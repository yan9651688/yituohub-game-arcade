import assert from 'node:assert/strict';
import { GameEngine } from '../../public/game-arcade/games/contra2026/engine.js';
import { LEVELS } from '../../public/game-arcade/games/contra2026/levels.js';

const engine = new GameEngine(LEVELS);
const tick = (seconds, input = {}) => { for (let n = 0; n < seconds * 60; n++) engine.step(1 / 60, [input]); };
assert.equal(LEVELS.length, 8);
for (const difficulty of ['assist', 'classic', 'veteran']) {
  engine.start(0, { difficulty });
  assert.equal(engine.state.lives, 30, `${difficulty} must begin with 30 lives`);
}

engine.start(0);
for (let lost = 1; lost <= 30; lost++) {
  engine.damagePlayer(engine.state.players[0], true);
  assert.equal(engine.state.lives, 30 - lost);
  tick(1.3);
  assert.equal(engine.state.mode, lost === 30 ? 'gameover' : 'playing');
}
engine.start(0);
assert.equal(engine.state.lives, 30, 'Restart restores all 30 lives');
engine.state.lives = 23;
engine.state.mode = 'clear'; engine.next();
assert.equal(engine.state.lives, 23, 'Stage transition carries the remaining lives');
assert.equal(engine.state.index, 1);

engine.start(0);
tick(.2);
const player = engine.state.players[0]; player.invuln = 999;
assert.equal(player.grounded, true);
tick(.32, { jump: true, right: true, shoot: true });
assert.ok(player.y > 2, 'Held jump reaches the intended platform height');
assert.ok(player.x > 4.5, 'Movement works while jumping and shooting');
assert.ok(engine.state.bullets.length > 0);
tick(.9);
assert.equal(player.grounded, true);
player.weapon = 'S'; player.shot = 0; engine.state.bullets = [];
tick(1 / 60, { shoot: true });
assert.equal(engine.state.bullets.filter(b => b.friendly).length, 5);

engine.start(1);
engine.state.players[0].invuln = 999;
engine.state.players[0].x = 0;
tick(8, { shoot: true });
assert.ok(engine.state.baseRoom >= 1, 'Real shots destroy a core and open the next room');

engine.start(0, { players: 2 });
assert.equal(engine.state.players.length, 2);
assert.equal(engine.state.lives, 30);
engine.damagePlayer(engine.state.players[1], true);
assert.equal(engine.state.lives, 29, 'Co-op uses the visible shared life reserve');

for (let index = 0; index < LEVELS.length; index++) {
  engine.start(index, { training: true });
  tick(.2);
  for (const p of engine.state.players) {
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
    assert.equal(p.dead, false, `Stage ${index + 1} spawn is safe`);
  }
}
console.log('PASS: 30 lives, restart/carry, all spawns, jump/shoot, spread gun, real base-core progression, co-op');
