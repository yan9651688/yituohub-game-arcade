import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Browser modules are loaded without requiring a package.json or production changes.
const source = new URL('../../../public/game-arcade/games/contra2026/', import.meta.url);
const moduleFrom = async name => import(`data:text/javascript;base64,${Buffer.from(await readFile(new URL(name, source))).toString('base64')}`);
const { GameEngine } = await moduleFrom('engine.js');
const { LEVELS } = await moduleFrom('levels.js');
const game = (index = 0, options = {}) => { const g = new GameEngine(LEVELS); g.start(index, options); return g; };
const tick = (g, count = 1) => { for (let n = 0; n < count; n++) g.step(1 / 60); };
const arrive = (g, index) => {
  const c = g.state.level.checkpoints[index], p = g.state.players[0];
  Object.assign(p, { x: c.x, y: c.y, vx: 0, vy: 0, grounded: true, invuln: 10 });
  g.step(1 / 60);
  assert.equal(g.state.checkpointIndex, index);
};

test('every authored checkpoint has permanent ground and hazard-free space for both players', () => {
  for (const [index, level] of LEVELS.entries()) {
    const g = game(index, { players: 2 });
    if (level.mode === 'base') continue;
    for (const [n, c] of level.checkpoints.entries()) {
      g.state.checkpoint = c;
      for (const id of [0, 1]) {
        const point = g.safeSpawn(c, id);
        assert.ok(g.isSafeSpawn(point), `${level.name} checkpoint ${n} / ${id + 1}P`);
        assert.equal(point.y, c.y, 'safe position must stay on the checkpoint ledge');
        assert.ok(Math.abs(point.x - c.x) <= 4.6 + 1e-6, 'do not fall back to the stage entrance');
      }
      if (n) {
        const prev = level.checkpoints[n - 1];
        const distance = level.mode === 'vertical' ? c.y - prev.y : c.x - prev.x;
        assert.ok(distance > 0 && distance <= (level.mode === 'vertical' ? 8.81 : 34), `${level.name}: interval ${distance}`);
      }
    }
    const last = level.checkpoints.at(-1);
    assert.equal(last.boss, true, `${level.name} must have a Boss checkpoint`);
    assert.ok(level.mode === 'vertical' ? last.y === level.boss.y : level.boss.x - last.x <= 24);
  }
});

test('side-stage death retains gear and checkpoint, clears nearby hostile fire only', () => {
  const g = game(), s = g.state, p = s.players[0];
  arrive(g, 5);
  p.weapon = 'S'; p.rapid = true; s.enemies[0].dead = true;
  g.damagePlayer(p, true);
  assert.equal(s.lives, 29);
  g.bullet(s.checkpoint.x, 1, 0, 0, false);
  const far = g.bullet(s.checkpoint.x + 15, 1, 0, 0, false);
  const friendly = g.bullet(s.checkpoint.x, 1, 0, 0, true);
  g.revive(p);
  assert.ok(p.x >= s.checkpoint.x - 4.6 && p.x > 100);
  assert.equal(p.weapon, 'S'); assert.equal(p.rapid, true);
  assert.equal(p.invuln, 3.2); assert.equal(p.hp, p.maxHp);
  assert.equal(s.enemies[0].dead, true);
  assert.deepEqual(s.bullets.map(b => b.id), [far.id, friendly.id]);
  g.damagePlayer(p); assert.equal(p.dead, false, 'spawn shield absorbs contact');
  p.invuln = 0; g.damagePlayer(p); assert.equal(p.dead, true, 'shield is temporary, normal combat remains lethal');
});

test('a new player walking into the first jungle gap revives beyond the opening encounter', () => {
  const g = game(0, { difficulty: 'assist' }), s = g.state, p = s.players[0];
  for (let i = 0; i < 600 && !p.dead; i++) g.step(1 / 60, [{ right: true, shoot: true }]);
  assert.equal(p.dead, true); assert.equal(s.checkpointIndex, 1); assert.equal(s.checkpoint.x, 24);
  tick(g, 75);
  assert.equal(p.dead, false); assert.ok(p.x >= 20 && p.x < 28, 'first pit must not send the player to x=3');
  assert.equal(p.weapon, 'M', 'the introductory pickup survives the fall');
});

test('vertical checkpoint requires landing and resets the camera before safe revival', () => {
  const g = game(2), s = g.state, p = s.players[0];
  Object.assign(p, { x: 15, y: 9, vy: 5, grounded: false });
  g.step(1 / 60);
  assert.equal(s.checkpointIndex, 0, 'airborne height cannot activate an unreached ledge');
  arrive(g, 5);
  p.weapon = 'L'; g.damagePlayer(p, true); s.camera.y = 82;
  g.revive(p);
  assert.equal(p.y, 44.04); assert.ok(s.camera.y < 50);
  tick(g, 12);
  assert.equal(p.dead, false); assert.equal(p.weapon, 'L');
  assert.ok(p.y >= 43.99, 'respawn lands on the saved ledge');
});

test('the waterfall Boss cannot activate before its approach checkpoint is safely landed', () => {
  const g = game(2), s = g.state, p = s.players[0];
  arrive(g, 7);
  Object.assign(p, { x: 16, y: 69, vy: 4, grounded: false });
  tick(g);
  assert.equal(s.boss, null); assert.equal(s.checkpointIndex, 7);
  arrive(g, 8);
  assert.ok(s.boss?.active); assert.equal(s.checkpoint.y, 70.4);
  const data = g.checkpointSnapshot(), restored = game();
  assert.equal(restored.restoreCheckpoint(data), true);
  assert.equal(restored.state.checkpoint.y, 70.4); assert.ok(restored.state.players[0].y >= 70.4);
});

test('base death keeps the current room and destroyed cores', () => {
  const g = game(1), s = g.state, p = s.players[0];
  g.setupRoom(4); s.enemies[0].dead = true; s.enemies[0].hp = 0; s.enemies[1].hp = 3;
  p.weapon = 'F'; g.damagePlayer(p, true); g.revive(p);
  assert.equal(s.baseRoom, 4); assert.equal(s.checkpointIndex, 4);
  assert.equal(s.enemies[0].dead, true); assert.equal(s.enemies[1].hp, 3);
  assert.equal(p.weapon, 'F'); assert.equal(p.z, 12); assert.equal(p.y, 0);
});

test('exhausting all 30 lives continues the same fight without resetting Boss damage', () => {
  const g = game(), s = g.state, p = s.players[0];
  arrive(g, 8); g.spawnBoss(); s.boss.hp = 27; s.score = 2400;
  s.enemies[0].dead = true; p.weapon = 'M';
  for (let death = 0; death < 30; death++) { g.damagePlayer(p, true); g.revive(p); }
  assert.equal(s.lives, 0); assert.equal(p.dead, true); assert.equal(s.deaths, 30);
  tick(g, 70); assert.equal(s.mode, 'gameover');
  assert.equal(g.continueFromCheckpoint(), true);
  assert.equal(g.state, s, 'continue must not reload the level');
  assert.equal(s.lives, 30); assert.equal(s.mode, 'playing');
  assert.equal(s.checkpointIndex, 8); assert.ok(p.x > 180); assert.equal(p.weapon, 'M');
  assert.equal(s.boss.hp, 27); assert.equal(s.score, 2400); assert.equal(s.enemies[0].dead, true);
  assert.equal(s.continues, 1);
});

for (const [index, checkpoint, room] of [[0, 6, 0], [2, 7, 0], [1, 0, 4]]) {
  test(`JSON save restores ${LEVELS[index].mode} progress, equipment and defeated enemies`, () => {
    const g = game(index, { difficulty: 'assist', players: 2 }), s = g.state;
    if (s.level.mode === 'base') g.setupRoom(room); else arrive(g, checkpoint);
    s.players[0].weapon = 'L'; s.players[1].weapon = 'S'; s.players[1].rapid = true;
    s.enemies[0].dead = true; s.enemies[0].hp = 0; s.enemies[1].hp = .5;
    s.pickups[0].collected = true; s.lives = 17; s.score = 1200; s.elapsed = 99;
    const data = JSON.parse(JSON.stringify(g.checkpointSnapshot()));
    const restored = game();
    assert.equal(restored.restoreCheckpoint(data), true);
    const r = restored.state;
    assert.equal(r.index, index); assert.equal(r.baseRoom, room); assert.equal(r.checkpointIndex, s.checkpointIndex);
    assert.equal(r.lives, 17); assert.equal(r.score, 1200); assert.equal(r.elapsed, 99);
    assert.equal(r.players.length, 2); assert.equal(r.players[0].maxHp, 3);
    assert.equal(r.players[0].weapon, 'L'); assert.equal(r.players[1].weapon, 'S'); assert.equal(r.players[1].rapid, true);
    assert.equal(r.enemies[0].dead, true); assert.equal(r.enemies[1].hp, .5); assert.equal(r.pickups[0].collected, true);
    assert.equal(r.bullets.length, 0); assert.ok(r.players.every(p => !p.dead && p.invuln === 3.2));
    if (r.level.mode !== 'base') assert.ok(r.players.every(p => Math.abs(p.y - r.checkpoint.y) < .1));
  });
}

test('Boss save and a zero-life save restore as a playable checkpoint', () => {
  const g = game(3); g.setupRoom(5); g.state.boss.hp = 31; g.state.lives = 0;
  const restored = game(); assert.equal(restored.restoreCheckpoint(g.checkpointSnapshot()), true);
  assert.equal(restored.state.baseRoom, 5); assert.equal(restored.state.boss.hp, 31);
  assert.equal(restored.state.lives, 30); assert.equal(restored.state.continues, 1);
});

test('co-op respawn cannot use a lagging partner to move behind a shared checkpoint', () => {
  const g = game(0, { players: 2 }), s = g.state, [front, back] = s.players;
  arrive(g, 6); Object.assign(back, { x: 4, y: 0, grounded: true });
  g.damagePlayer(front, true); g.revive(front);
  assert.ok(front.x > 136); assert.equal(s.checkpointIndex, 6);
  const vertical = game(2, { players: 2 }); arrive(vertical, 7);
  const [a, b] = vertical.state.players;
  Object.assign(b, { x: 4, y: 0, grounded: true });
  vertical.damagePlayer(a, true); vertical.revive(a);
  assert.ok(a.y >= 61.6); assert.equal(vertical.state.checkpointIndex, 7);
  vertical.damagePlayer(a, true); vertical.damagePlayer(b, true);
  vertical.revive(a); vertical.revive(b);
  assert.ok(vertical.state.players.every(p => p.y >= 61.6 && !p.dead));
});

test('invalid and obsolete save data is rejected without changing an active run', () => {
  const g = game(), before = g.state, valid = g.checkpointSnapshot();
  for (const invalid of [null, {}, { ...valid, version: 1 }, { ...valid, index: 99 },
    { ...valid, checkpointIndex: 99 }, { ...valid, lives: -1 },
    { ...valid, playerLoadouts: [{ weapon: '__proto__' }] },
    { ...valid, enemies: [{ hp: NaN }] }, { ...valid, boss: { hp: 0, dead: true } }]) {
    assert.equal(g.restoreCheckpoint(invalid), false); assert.equal(g.state, before);
  }
});
