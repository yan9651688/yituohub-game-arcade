/* Original, dependency-free gameplay simulation. See REFERENCES.md for fidelity boundaries. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ClassicSwarm = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const WIDTH = 256, HEIGHT = 240;
  const FORMATION = [
    { type: 'flagship', columns: [3, 6] },
    { type: 'red', columns: [2, 3, 4, 5, 6, 7] },
    { type: 'violet', columns: [1, 2, 3, 4, 5, 6, 7, 8] },
    { type: 'green', columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { type: 'green', columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { type: 'green', columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] }
  ];
  const POINTS = { green: [30, 60], violet: [40, 80], red: [50, 100], flagship: [60, 150] };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const ease = t => t * t * (3 - 2 * t);
  const TURN_TIME = 0.95, ATTACK_TIME = 2.25, EXIT_Y = HEIGHT + 15, ENTRY_Y = -28;
  // Cubic Hermite segments carry real velocities (logical pixels / sortie second).
  // Adjacent segments share both position and velocity, not just endpoints.
  function segment(from, to, startVelocity, endVelocity, duration) {
    return { from, to, startVelocity, endVelocity, duration };
  }
  function sampleSegment(part, time) {
    const p = clamp(time / part.duration, 0, 1), p2 = p * p, p3 = p2 * p;
    const h0 = 2 * p3 - 3 * p2 + 1, h1 = p3 - 2 * p2 + p;
    const h2 = -2 * p3 + 3 * p2, h3 = p3 - p2;
    const d0 = (6 * p2 - 6 * p) / part.duration, d1 = 3 * p2 - 4 * p + 1;
    const d2 = (-6 * p2 + 6 * p) / part.duration, d3 = 3 * p2 - 2 * p;
    const result = {};
    for (const axis of ['x', 'y']) {
      result[axis] = h0 * part.from[axis] + h1 * part.duration * part.startVelocity[axis]
        + h2 * part.to[axis] + h3 * part.duration * part.endVelocity[axis];
      result[axis === 'x' ? 'vx' : 'vy'] = d0 * part.from[axis] + d1 * part.startVelocity[axis]
        + d2 * part.to[axis] + d3 * part.endVelocity[axis];
    }
    return result;
  }
  function samplePath(path, time) {
    for (const part of path) {
      if (time <= part.duration) return sampleSegment(part, time);
      time -= part.duration;
    }
    const last = path[path.length - 1];
    return sampleSegment(last, last.duration);
  }
  function nearestAngle(angle, reference) {
    return reference + Math.atan2(Math.sin(angle - reference), Math.cos(angle - reference));
  }
  function flagshipPoints(group) {
    if (!group || !group.escortIds.length) return 150;
    const killed = group.killedEscortIds.length;
    if (group.escortIds.length === 2 && killed === 2) return 800;
    if (group.escortIds.length === 1 && killed === 1) return 300;
    return group.escortIds.length === 2 ? 300 : 200;
  }
  function waveIndicator(wave) {
    return { flags: wave <= 5 ? wave : 1, label: wave > 5 ? String(wave).padStart(2, '0') : '' };
  }
  class Game {
    constructor(options = {}) {
      this.initialSeed = options.seed || 1984;
      this.highScore = Number.isFinite(options.highScore) ? Math.max(0, Math.floor(options.highScore)) : 0;
      this.events = [];
      this.reset(false);
    }
    random() { this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0; return this.seed / 4294967296; }
    emit(type, data = {}) { this.events.push({ type, ...data }); }
    drainEvents() { const events = this.events; this.events = []; return events; }
    reset(play = true) {
      this.seed = this.initialSeed; this.score = 0; this.wave = 1; this.lives = 3;
      this.extraLifeAwarded = false; this.paused = false; this.time = 0; this.stateTime = 0;
      this.formationTime = 0; this.nextAttack = 3.0; this.attackSerial = 0; this.groupSerial = 0;
      this.attackFreeze = 0; this.effects = []; this.popups = []; this.bullets = []; this.shot = null;
      this.groups = new Map(); this.events = [];
      this.player = { x: WIDTH / 2, y: 216, invulnerable: 0 };
      this._spawnWave(); this.state = play ? 'ready' : 'title';
      if (play) this.emit('start');
    }
    start() { this.reset(true); }
    pause() { if (this.state !== 'title' && this.state !== 'gameover') this.paused = true; }
    resume() { this.paused = false; }
    togglePause() { if (this.paused) this.resume(); else this.pause(); }
    home(enemy, time = this.formationTime) {
      const offset = Math.sin(time * 0.68) * 15;
      return { x: 56 + enemy.column * 16 + offset, y: 49 + enemy.row * 12 };
    }
    _spawnWave(preserveShot = false) {
      this.enemies = []; this.groups.clear(); this.bullets = [];
      if (!preserveShot) this.shot = null;
      this.formationTime = 0; this.nextAttack = 3.0; this.attackFreeze = 0;
      FORMATION.forEach((row, rowIndex) => row.columns.forEach(column => {
        const enemy = { id: `${this.wave}:${rowIndex}:${column}`, type: row.type, row: rowIndex, column,
          alive: true, mode: 'formation', angle: 0, diveTime: 0, groupId: null };
        Object.assign(enemy, this.home(enemy)); this.enemies.push(enemy);
      }));
    }
    addScore(points, x, y, show = false) {
      this.score += points;
      if (this.score > this.highScore) { this.highScore = this.score; this.emit('highscore', { score: this.highScore }); }
      if (!this.extraLifeAwarded && this.score >= 5000) {
        this.extraLifeAwarded = true; this.lives++; this.emit('extraLife');
      }
      if (show) this.popups.push({ x, y, text: String(points), life: 1.1 });
    }
    _enemyPoints(enemy) {
      const diving = enemy.mode !== 'formation';
      if (enemy.type === 'flagship' && diving) return flagshipPoints(this.groups.get(enemy.groupId));
      return POINTS[enemy.type][diving ? 1 : 0];
    }
    _killEnemy(enemy, points = this._enemyPoints(enemy)) {
      if (!enemy.alive) return;
      const diving = enemy.mode !== 'formation';
      const group = this.groups.get(enemy.groupId);
      if (enemy.type === 'red' && group && !group.killedEscortIds.includes(enemy.id)) group.killedEscortIds.push(enemy.id);
      enemy.alive = false;
      if (enemy.type === 'flagship') this.attackFreeze = 4;
      this.addScore(points, enemy.x, enemy.y, enemy.type === 'flagship' && diving);
      this.effects.push({ x: enemy.x, y: enemy.y, life: 0.3, max: 0.3, kind: 'enemy', color: enemy.type });
      this.emit('hit', { enemyType: enemy.type, points });
    }
    _updatePlayerInput(dt, input) {
      const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      this.player.x = clamp(this.player.x + direction * 60 * dt, 12, WIDTH - 12);
      if (input.fire && !this.shot) { this.shot = { x: this.player.x, y: this.player.y - 10 }; this.emit('shoot'); }
    }
    _updateShot(dt) {
      if (!this.shot) return;
      const previousY = this.shot.y; this.shot.y -= 224 * dt;
      const targets = this.enemies.filter(e => e.alive && Math.abs(e.x - this.shot.x) <= 6 && e.y + 5 >= this.shot.y && e.y - 5 <= previousY).sort((a, b) => b.y - a.y);
      if (targets.length) {
        // The FC recording shows one shot removing overlapping ships. Keep this
        // local to the nearest overlapping hitboxes, not a piercing whole column.
        const overlap = targets.filter(e => targets[0].y - e.y < 10);
        // Resolve scores from the same pre-impact state: a simultaneous escort
        // hit must not count as an earlier kill and invent an 800-point bonus.
        const hits = overlap.map(enemy => ({ enemy, points: this._enemyPoints(enemy) }));
        for (const hit of hits) this._killEnemy(hit.enemy, hit.points);
        this.shot = null;
      } else if (this.shot.y < 22) this.shot = null;
    }
    _hitPlayer() {
      if (this.state !== 'playing' || this.player.invulnerable > 0) return;
      this.lives--; this.state = 'dying'; this.stateTime = 0; this.shot = null; this.bullets = [];
      this.effects.push({ x: this.player.x, y: this.player.y, life: 0.8, max: 0.8, kind: 'player' });
      this.emit('death');
      for (const enemy of this.enemies) if (enemy.alive) { enemy.mode = 'formation'; enemy.angle = 0; enemy.groupId = null; Object.assign(enemy, this.home(enemy)); }
      this.groups.clear();
    }
    _launch(enemy, groupId = null, side = null, aim = null, continuation = null) {
      enemy.mode = 'dive'; enemy.diveTime = 0; enemy.originX = enemy.x; enemy.originY = enemy.y;
      enemy.side = side || (enemy.x < WIDTH / 2 ? -1 : 1);
      // Lock the target once per pass. Neither player movement nor the survivor
      // threshold changes a path that is already in flight. Keep the original
      // ±17 pixel aim spread; escorts retain their explicit group spacing.
      enemy.aimX = aim === null ? clamp(this.player.x + (this.random() - 0.5) * 34, 20, 236) : aim;
      enemy.groupId = groupId; enemy.fired = 0; enemy.launchAngle = enemy.angle;
      enemy.continuation = !!continuation;
      enemy.fireOffset = continuation ? TURN_TIME : 0;
      const start = { x: enemy.x, y: enemy.y };
      let turn, velocity, remaining, first;
      if (continuation) {
        // Re-enter at the exact wrapped endpoint and tangent. A short, mostly
        // offscreen bend settles lateral drift before the next single aimed arc.
        const entryTime = 0.25;
        remaining = ATTACK_TIME - entryTime;
        const vy = (EXIT_Y - start.y - continuation.y * entryTime / 2) / (remaining + entryTime / 2);
        turn = { x: start.x + continuation.x * entryTime / 2,
          y: start.y + (continuation.y + vy) * entryTime / 2 };
        velocity = { x: 0, y: vy };
        first = segment(start, turn, continuation, velocity, entryTime);
      } else {
        turn = { x: clamp(start.x + enemy.side * 32, 12, WIDTH - 12), y: start.y + 14 };
        remaining = ATTACK_TIME;
        velocity = { x: 0, y: (EXIT_Y - turn.y) / remaining };
        first = segment(start, turn, { x: enemy.side * 52, y: -46 }, velocity, TURN_TIME);
      }
      const exitTime = (EXIT_Y - this.player.y) / velocity.y;
      const aimTime = remaining - exitTime;
      // The final tangent points through the sampled aim position, then carries
      // on below it. Limit only the offscreen exit, never ease up for a last enemy.
      const vx = clamp((enemy.aimX - turn.x) * 0.7 / aimTime,
        (12 - enemy.aimX) / exitTime, (WIDTH - 12 - enemy.aimX) / exitTime);
      const target = { x: enemy.aimX, y: this.player.y }, terminal = { x: vx, y: velocity.y };
      const end = { x: target.x + vx * exitTime, y: EXIT_Y };
      enemy.divePath = [first, segment(turn, target, velocity, terminal, aimTime),
        segment(target, end, terminal, terminal, exitTime)];
      enemy.diveDuration = first.duration + remaining;
      this._placeDiver(enemy);
      this.emit('dive');
    }
    _placeDiver(enemy) {
      const pose = samplePath(enemy.divePath, enemy.diveTime);
      enemy.x = pose.x; enemy.y = pose.y; enemy.vx = pose.vx; enemy.vy = pose.vy;
      let angle = nearestAngle(Math.atan2(pose.vx, pose.vy), enemy.angle);
      // Formation sprites face forward. Give their initial outward bank a short
      // visual turn instead of snapping their heading on the launch frame.
      if (!enemy.continuation && enemy.diveTime < 0.18) {
        angle = enemy.launchAngle + (nearestAngle(angle, enemy.launchAngle) - enemy.launchAngle) * ease(enemy.diveTime / 0.18);
      }
      enemy.angle = angle;
    }
    _beginReturn(enemy, speed, overflow = 0) {
      enemy.mode = 'return'; enemy.returnTime = 0; enemy.returnAngle = enemy.angle;
      const crossingTime = this.formationTime - overflow / speed;
      const home = this.home(enemy, crossingTime), homeVx = Math.cos(crossingTime * 0.68) * 10.2;
      // Work relative to the moving formation, so docking matches its velocity.
      enemy.returnPath = segment({ x: enemy.x - home.x, y: ENTRY_Y }, { x: 0, y: home.y },
        { x: enemy.vx * speed - homeVx, y: enemy.vy * speed }, { x: 0, y: 0 }, 1.5);
      enemy.y = ENTRY_Y;
    }
    _chooseAttack() {
      const alive = this.enemies.filter(e => e.alive);
      const available = alive.filter(e => e.mode === 'formation');
      const active = alive.length - available.length;
      const maxActive = Math.min(6, 2 + Math.floor((this.wave + 1) / 2));
      if (!available.length || active >= maxActive) return;
      const nextSerial = this.attackSerial + 1;
      const leaders = available.filter(e => e.type === 'flagship');
      // Reserve space for every fourth attack: groups must not be starved by solo divers.
      if (leaders.length && nextSerial % 4 === 0) {
        const leader = leaders[nextSerial % leaders.length];
        const escorts = available.filter(e => e.type === 'red').sort((a, b) => Math.abs(a.column - leader.column) - Math.abs(b.column - leader.column)).slice(0, 2);
        if (active + 1 + escorts.length > maxActive) return;
        this.attackSerial = nextSerial;
        const groupId = ++this.groupSerial;
        this.groups.set(groupId, { id: groupId, escortIds: escorts.map(e => e.id), killedEscortIds: [] });
        const side = leader.x < WIDTH / 2 ? -1 : 1;
        const target = clamp(this.player.x, 32, 224);
        this._launch(leader, groupId, side, target);
        escorts.forEach((escort, i) => this._launch(escort, groupId, side, target + (i === 0 ? -17 : 17)));
        return;
      }
      this.attackSerial = nextSerial;
      const typeOrder = ['green', 'violet', 'green', 'red', 'red', 'green', 'violet', 'green'];
      const preferred = typeOrder[(nextSerial - 1) % typeOrder.length];
      const preference = [preferred, 'green', 'violet', 'red', 'flagship'];
      let candidates = [];
      for (const type of preference) { candidates = available.filter(e => e.type === type); if (candidates.length) break; }
      // Pick an exposed flank rather than introducing enemies from nowhere.
      candidates.sort((a, b) => a.column - b.column);
      const enemy = this.attackSerial % 2 ? candidates[0] : candidates[candidates.length - 1];
      this._launch(enemy);
    }
    _enemyFire(enemy) {
      if (this.bullets.length >= Math.min(7, 4 + Math.floor(this.wave / 3))) return;
      const dy = this.player.y - enemy.y;
      if (dy < 22) return;
      const speed = 72 + Math.min(27, this.wave * 3);
      this.bullets.push({ x: enemy.x, y: enemy.y + 6, vx: clamp((this.player.x - enemy.x) / dy * speed, -29, 29), vy: speed });
    }
    _updateEnemies(dt, allowAttacks) {
      this.formationTime += dt;
      this.attackFreeze = Math.max(0, this.attackFreeze - dt);
      const finalAssault = this.enemies.filter(e => e.alive).length < 10;
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        if (enemy.mode === 'formation') { Object.assign(enemy, this.home(enemy)); enemy.angle = 0; continue; }
        if (enemy.mode === 'return') {
          enemy.returnTime += dt;
          const pose = sampleSegment(enemy.returnPath, enemy.returnTime), home = this.home(enemy);
          enemy.x = home.x + pose.x; enemy.y = pose.y;
          // Settle back to the formation's upright sprite as the return slows.
          enemy.angle = enemy.returnAngle * (1 - ease(clamp(enemy.returnTime / 1.5, 0, 1)));
          if (enemy.returnTime >= 1.5) { enemy.mode = 'formation'; enemy.groupId = null; enemy.angle = 0; }
          continue;
        }
        const speed = 1 + Math.min(0.35, (this.wave - 1) * 0.025);
        enemy.diveTime += dt * speed;
        this._placeDiver(enemy);
        const t = enemy.diveTime + enemy.fireOffset;
        if (allowAttacks && this.attackFreeze <= 0 && t >= 1.2 && enemy.fired === 0) { this._enemyFire(enemy); enemy.fired++; }
        if (allowAttacks && this.attackFreeze <= 0 && this.wave >= 3 && t >= 1.9 && enemy.fired === 1) { this._enemyFire(enemy); enemy.fired++; }
        if (enemy.diveTime >= enemy.diveDuration) {
          const overflow = enemy.diveTime - enemy.diveDuration;
          if (finalAssault) {
            // This is the only wrap: both endpoints are outside the visible field.
            // Preserve x, tangent and overshoot time so the next frame cannot jump.
            const continuation = { x: enemy.vx, y: enemy.vy };
            enemy.y = ENTRY_Y;
            this._launch(enemy, null, -enemy.side, null, continuation);
            enemy.diveTime = overflow; this._placeDiver(enemy);
          } else {
            // Return duration uses wall time; convert the leftover sortie time.
            this._beginReturn(enemy, speed, overflow);
            enemy.returnTime = overflow / speed;
            const pose = sampleSegment(enemy.returnPath, enemy.returnTime), home = this.home(enemy);
            enemy.x = home.x + pose.x; enemy.y = pose.y;
            enemy.angle = enemy.returnAngle * (1 - ease(clamp(enemy.returnTime / 1.5, 0, 1)));
          }
        }
      }
      if (!allowAttacks || this.attackFreeze > 0) return;
      this.nextAttack -= dt;
      if (this.nextAttack <= 0) {
        this._chooseAttack();
        this.nextAttack = finalAssault ? 0.35 : Math.max(0.62, 1.55 - (this.wave - 1) * 0.075);
      }
    }
    update(dt, input = {}) {
      if (!Number.isFinite(dt) || dt <= 0 || this.paused) return;
      dt = Math.min(dt, 0.05);
      this.time += dt; this.stateTime += dt;
      for (const effect of this.effects) effect.life -= dt;
      this.effects = this.effects.filter(e => e.life > 0);
      for (const popup of this.popups) { popup.life -= dt; popup.y -= dt * 8; }
      this.popups = this.popups.filter(p => p.life > 0);
      if (this.state === 'title') { this._updateEnemies(dt, false); return; }
      if (this.state === 'gameover') return;
      if (this.state === 'ready') {
        this._updateEnemies(dt, false);
        if (this.stateTime >= 1.6) { this.state = 'playing'; this.stateTime = 0; this.emit('ready'); }
        return;
      }
      if (this.state === 'waveclear') {
        // Play continues through the short FC inter-wave gap. Do not add the
        // initial READY delay again or erase a missile approaching the new rows.
        if (this.stateTime >= 1.3) {
          this.wave++; this._spawnWave(true); this.state = 'playing'; this.stateTime = 0;
          this.nextAttack = 4.6; this.emit('wave');
        }
        this._updatePlayerInput(dt, input); this._updateShot(dt);
        return;
      }
      if (this.state === 'dying') {
        this._updateEnemies(dt, false);
        if (this.stateTime >= 2.4) {
          if (this.lives <= 0) { this.state = 'gameover'; this.emit('gameover', { score: this.score }); }
          else { this.state = 'playing'; this.player.x = WIDTH / 2; this.player.invulnerable = 1.8; this.nextAttack = 1.5; }
          this.stateTime = 0;
        }
        return;
      }
      this.player.invulnerable = Math.max(0, this.player.invulnerable - dt);
      this._updatePlayerInput(dt, input);
      this._updateEnemies(dt, true);
      this._updateShot(dt);
      for (const bullet of this.bullets) {
        bullet.x += bullet.vx * dt; bullet.y += bullet.vy * dt;
        if (Math.abs(bullet.x - this.player.x) < 4.5 && Math.abs(bullet.y - this.player.y) < 6) this._hitPlayer();
      }
      this.bullets = this.bullets.filter(b => b.y < HEIGHT + 4 && b.x > -4 && b.x < WIDTH + 4);
      if (this.state !== 'playing') return;
      if (this.player.invulnerable <= 0) {
        for (const enemy of this.enemies) if (enemy.alive && Math.abs(enemy.x - this.player.x) < 8 && Math.abs(enemy.y - this.player.y) < 8) {
          // A body collision destroys both ships and awards the enemy's score.
          this._killEnemy(enemy); this._hitPlayer(); break;
        }
      }
      if (this.state === 'playing' && this.enemies.every(e => !e.alive)) {
        this.state = 'waveclear'; this.stateTime = 0; this.bullets = []; this.emit('clear');
      }
    }
  }
  return { Game, WIDTH, HEIGHT, FORMATION, POINTS, flagshipPoints, waveIndicator };
});
