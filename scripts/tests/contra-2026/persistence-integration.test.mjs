import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../../../public/game-arcade/games/contra2026/', import.meta.url);
const moduleFrom = async name => import(`data:text/javascript;base64,${Buffer.from(await readFile(new URL(name, root))).toString('base64')}`);
const { GameEngine, WEAPONS } = await moduleFrom('engine.js');
const { LEVELS } = await moduleFrom('levels.js');
const main = (await readFile(new URL('main.js', root), 'utf8')).replace(/^import .*;\r?$/gm, '')
  .replace(/import\.meta\.url/g, JSON.stringify(new URL('main.js', root).href));
const key = 'neon.contra2026.v1';

// Execute the real controller with inert DOM/audio/WebGL boundaries. These tests
// verify persistence and event ordering; they do not claim browser/render coverage.
function controller(seed = null) {
  const nodes = new Map(), listeners = new Map(), storage = new Map(seed ? [[key, JSON.stringify(seed)]] : []);
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, { hidden: false, textContent: '', innerHTML: '', dataset: {}, handlers: {},
      style: { setProperty() {} }, classList: { toggle() {}, add() {}, remove() {} },
      addEventListener(type, fn) { this.handlers[type] = fn; }, setAttribute() {}, appendChild() {}, focus() {} });
    return nodes.get(id);
  };
  class GameAudio { setMuted() {} setPaused() {} setTheme() {} play() {} update() {} dispose() {} unlock() { return Promise.resolve(); } }
  class GameRenderer { constructor() { this.camera = { right: 15.5, left: -15.5 }; } setLevel() {} resize() {} render() {} dispose() {} }
  const context = {
    LEVELS, WEAPONS, GameEngine, GameAudio, GameRenderer, console,
    document: { body: node('body'), getElementById: node, querySelectorAll: () => [], createElement: () => node(Symbol()), addEventListener() {} },
    localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) },
    matchMedia: () => ({ matches: false }), performance: { now: () => 0 }, navigator: {},
    window: {}, location: { search: '', reload() {} }, URLSearchParams, URL,
    requestAnimationFrame() {}, addEventListener(type, fn) { listeners.set(type, fn); }
  };
  const app = vm.runInNewContext(`${main}\n({ engine, start, home, saveBattle, regroup, getSave: () => save });`, context);
  return { ...app, node, listeners, stored: () => JSON.parse(storage.get(key) || 'null') };
}

function moveToCheckpoint(engine, index) {
  const c = engine.state.level.checkpoints[index];
  Object.assign(engine.state.players[0], { x: c.x, y: c.y, vx: 0, vy: 0, grounded: true, invuln: 10 });
  engine.step(1 / 60);
}

test('room event persists a complete room and refresh restores its defeated cores', async () => {
  const app = controller(); await app.start(1);
  app.engine.setupRoom(3);
  assert.equal(app.stored().checkpoint.baseRoom, 3);
  assert.equal(app.stored().checkpoint.enemies.length, app.engine.state.enemies.length);
  app.engine.state.enemies[0].hp = 0; app.engine.state.enemies[0].dead = true;
  app.engine.pause();
  const fresh = controller(app.stored());
  await fresh.start(fresh.getSave().resume, false, fresh.getSave().checkpoint);
  assert.equal(fresh.engine.state.baseRoom, 3); assert.equal(fresh.engine.state.enemies[0].dead, true);
  assert.equal(fresh.stored().checkpoint.baseRoom, 3);
});

test('ordinary death and 30-life regroup events save the retained weapons and checkpoint', async () => {
  const app = controller(); await app.start(0); moveToCheckpoint(app.engine, 5);
  const p = app.engine.state.players[0]; p.weapon = 'S'; p.rapid = true;
  app.engine.damagePlayer(p, true); app.engine.revive(p);
  assert.equal(app.stored().checkpoint.checkpointIndex, 5);
  assert.equal(app.stored().checkpoint.playerLoadouts[0].weapon, 'S');
  app.engine.state.lives = 0; p.dead = true; app.engine.state.mode = 'gameover'; app.regroup();
  assert.equal(app.stored().checkpoint.lives, 30);
  assert.equal(app.stored().checkpoint.checkpointIndex, 5);
  assert.equal(app.stored().checkpoint.playerLoadouts[0].rapid, true);
});

test('training, training room events, training clear and returning home preserve campaign save', async () => {
  const app = controller(); await app.start(0); moveToCheckpoint(app.engine, 5); app.saveBattle();
  const campaign = JSON.stringify(app.stored());
  await app.start(1, true); app.engine.setupRoom(4); app.engine.pause();
  assert.equal(JSON.stringify(app.stored()), campaign);
  app.engine.resume(); app.engine.state.cleared = true; app.engine.state.clearTimer = 0; app.engine.step(1 / 60);
  assert.equal(JSON.stringify(app.stored()), campaign);
  app.home(); assert.equal(JSON.stringify(app.stored()), campaign);
});

test('old stage-only saves continue the old stage and migrate to a checkpoint snapshot', async () => {
  const app = controller({ resume: 4, unlocked: 4, difficulty: 'classic', best: 7000 });
  assert.equal(app.node('continue-btn').hidden, false);
  await app.start(app.getSave().resume, false, app.getSave().checkpoint);
  assert.equal(app.engine.state.index, 4); assert.equal(app.engine.state.checkpointIndex, 0);
  assert.equal(app.stored().checkpoint.version, 2); assert.equal(app.stored().best, 7000);
});

test('new-game and restored game writes occur after full initialization', async () => {
  const app = controller(); await app.start(2); moveToCheckpoint(app.engine, 8);
  app.engine.state.boss.hp = 41; app.saveBattle();
  const fresh = controller(app.stored());
  await fresh.start(fresh.getSave().resume, false, fresh.getSave().checkpoint);
  assert.equal(fresh.stored().checkpoint.checkpointIndex, 8);
  assert.equal(fresh.stored().checkpoint.boss.hp, 41);
  assert.ok(Math.abs(fresh.engine.state.players[0].y - 70.44) < 1e-8);
  await fresh.start(0);
  assert.equal(fresh.stored().checkpoint.index, 0); assert.equal(fresh.stored().checkpoint.checkpointIndex, 0);
});

test('pagehide saves the current base room instead of a menu preview', async () => {
  const app = controller(); await app.start(3); app.engine.setupRoom(4);
  app.listeners.get('pagehide')();
  assert.equal(app.stored().checkpoint.index, 3); assert.equal(app.stored().checkpoint.baseRoom, 4);
});

for (const index of [0, 7]) {
  test(`refresh during stage ${index + 1} Boss destruction commits the clear immediately`, async () => {
    const app = controller(); await app.start(index);
    app.engine.spawnBoss(); const s = app.engine.state;
    app.engine.bullet(s.boss.x, s.boss.y + 2, 0, 0, true, { damage: 5000 });
    app.engine.bulletsStep(1 / 60);
    assert.equal(s.cleared, true); assert.equal(s.mode, 'playing', 'clear animation is still running');
    app.listeners.get('pagehide')();
    assert.equal(app.stored().checkpoint, null);
    assert.equal(app.stored().resume, index === 7 ? 0 : 1);
    assert.equal(app.stored().completed, index === 7);
    assert.ok(app.stored().best >= 5000);
  });
}

test('fractional legacy stage and malformed checkpoint recover without a startup crash', async () => {
  const app = controller({ resume: 2.5, unlocked: 3.7, checkpoint: { version: 2, index: 2, checkpointIndex: 999 } });
  assert.equal(app.getSave().resume, 2); assert.equal(app.getSave().unlocked, 3);
  assert.match(app.node('continue-btn').textContent, /瀑布攀登/);
  await app.start(app.getSave().resume, false, app.getSave().checkpoint);
  assert.equal(app.engine.state.index, 2); assert.equal(app.engine.state.checkpointIndex, 0);
  assert.equal(app.stored().checkpoint.checkpointIndex, 0);
});
