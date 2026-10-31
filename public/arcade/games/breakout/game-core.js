/* Original implementation. Level geometry reconstructed from NES Arkanoid maps.
 * See REFERENCES.md for sources, discrepancies, and deliberate adaptations. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./levels.js'));
  else root.BreakoutCore = factory(root.BreakoutLevels);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (levelData) {
  'use strict';
  const WIDTH = 320, HEIGHT = 400;
  const FIELD = { left: 18, right: 302, top: 42, bottom: 400 };
  const BRICK = { x: 28, y: 72, width: 24, height: 11, stepY: 12 };
  const VALUES = { W: 50, O: 60, L: 70, G: 80, R: 90, B: 100, P: 110, Y: 120 };
  const POWERUPS = ['E', 'L', 'C', 'D', 'S', 'P', 'B'];
  // NES has discrete aim directions and speed steps. These magnitudes and
  // thresholds are tuned for this resized field, not copied ROM constants.
  const AIM_ANGLES = [Math.PI / 12, Math.PI * 7 / 36, Math.PI / 3];
  const SPEED_TIERS = [90, 110, 135, 155, 180, 210, 240];
  const SPEED_HITS = [6, 18, 36, 60, 90, 120];
  // Later-round gate delays are remake pacing, not unverified ROM values.
  const ENEMY_DELAYS = Array.from({ length: 36 }, (_, i) => i < 8 ? [35, 6, 7, 5, 5, 6, 8, 10][i] : i === 35 ? Infinity : 6);
  // Round categories documented by Chef_Stef's reverse-engineering (6347S).
  const FAST_ROUNDS = [8, 10, 14, 16, 23, 27, 29], SLOW_ROUNDS = [11, 13, 17, 28];
  const POWER_INFO = {
    E: { name: '加长挡板', detail: '挡板加宽，直到换道具或失球', color: '#657bb9' },
    L: { name: '双管激光', detail: '按住左键 / 空格连续射击', color: '#dd6f60' },
    C: { name: '粘球挡板', detail: '接球后停住，左键再次发射', color: '#d9ba59' },
    D: { name: '三球分裂', detail: '三球同时弹跳，全部落下才失命', color: '#62becb' },
    S: { name: '减速胶囊', detail: '降低球速档位，多次撞砖后再次提速', color: '#dc9256' },
    P: { name: '追加生命', detail: '增加一次机会，最多 9 条生命', color: '#aab5ad' },
    B: { name: '传送出口', detail: '移到最右侧出口，提前进入下一关', color: '#c387b7' }
  };
  const LEVELS = levelData.LEVELS;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  function buildBricks(index) {
    if (!Number.isInteger(index) || index < 0 || index >= LEVELS.length) throw new RangeError('Invalid level');
    let id = 0;
    return LEVELS[index].rows.flatMap((row, r) => Array.from(row).flatMap((type, c) => type === '.' ? [] : [{
      id: id++, type, x: BRICK.x + c * BRICK.width, y: BRICK.y + r * BRICK.stepY,
      w: BRICK.width - 1, h: BRICK.height, hp: type === 'g' ? Infinity : type === 'S' ? 2 + Math.floor(index / 8) : 1,
      score: type === 'S' ? 50 * (index + 1) : VALUES[type] || 0, flash: 0
    }]));
  }
  // Earliest contact of a moving point with a radius-expanded rectangle.
  // Continuous time-of-impact prevents tunneling through even a thin brick.
  function sweepRect(x, y, dx, dy, rect, radius) {
    const minX = rect.x - radius, maxX = rect.x + rect.w + radius;
    const minY = rect.y - radius, maxY = rect.y + rect.h + radius;
    let tx0 = -Infinity, tx1 = Infinity, ty0 = -Infinity, ty1 = Infinity;
    if (Math.abs(dx) < 1e-10) { if (x < minX || x > maxX) return null; }
    else { tx0 = (minX - x) / dx; tx1 = (maxX - x) / dx; if (tx0 > tx1) [tx0, tx1] = [tx1, tx0]; }
    if (Math.abs(dy) < 1e-10) { if (y < minY || y > maxY) return null; }
    else { ty0 = (minY - y) / dy; ty1 = (maxY - y) / dy; if (ty0 > ty1) [ty0, ty1] = [ty1, ty0]; }
    const entry = Math.max(tx0, ty0), exit = Math.min(tx1, ty1);
    if (entry < -1e-7 || entry > 1 || exit < Math.max(0, entry)) return null;
    return tx0 > ty0 ? { t: Math.max(0, entry), nx: dx > 0 ? -1 : 1, ny: 0 } : { t: Math.max(0, entry), nx: 0, ny: dy > 0 ? -1 : 1 };
  }
  class Game {
    constructor(options = {}) {
      this.seed = options.seed || 0x8b17cafe;
      const initialBest = Number(options.best);
      this.best = Number.isFinite(initialBest) ? Math.max(0, Math.floor(initialBest)) : 0;
      this.events = []; this.score = 0; this.lives = 3; this.level = 0;
      this.state = 'title'; this.previousState = 'ready'; this.elapsed = 0;
      this.paddle = { x: 160, y: 365, width: 47, height: 8 };
      this.bricks = buildBricks(0); this.balls = []; this.capsules = []; this.lasers = [];
      this.power = ''; this.currentCapsule = ''; this.shotCooldown = 0; this.destroyed = 0; this.practice = false;
      this.warpOpen = false; this.clearReason = ''; this.enemies = []; this.enemyTimer = ENEMY_DELAYS[0]; this.enemySerial = 0; this.boss = null; this.bossShots = [];
    }
    random() { let x = this.seed | 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.seed = x >>> 0; return this.seed / 4294967296; }
    emit(type, data = {}) { this.events.push(Object.assign({ type }, data)); }
    drainEvents() { const out = this.events; this.events = []; return out; }
    get remaining() { return this.bricks.filter(b => b.hp > 0 && b.type !== 'g').length; }
    get initialSpeedTier() { return FAST_ROUNDS.includes(this.level + 1) ? 3 : SLOW_ROUNDS.includes(this.level + 1) ? 1 : 2; }
    get speed() { return SPEED_TIERS[this.initialSpeedTier]; }
    addScore(value) { this.score += value; this.best = Math.max(this.best, this.score); }
    newGame(level = 0) {
      if (!Number.isInteger(level) || level < 0 || level >= LEVELS.length) level = 0;
      this.score = 0; this.lives = 3; this.practice = level !== 0; this.elapsed = 0; this.events = [];
      this.loadLevel(level);
    }
    resetPaddle() { this.power = ''; this.currentCapsule = ''; this.warpOpen = false; this.paddle.width = 47; this.paddle.x = clamp(this.paddle.x, FIELD.left + 24, FIELD.right - 24); this.lasers = []; this.capsules = []; this.shotCooldown = 0; }
    makeBall(x, y, vx, vy, attached = false) {
      return { x, y, vx, vy, r: 3, attached, offset: 0, trail: [], speedTier: this.initialSpeedTier, brickHits: 0, ceilingHit: false, heldSpeed: 0 };
    }
    setBallSpeed(ball, speed) {
      const old = Math.hypot(ball.vx, ball.vy);
      if (old > 0) { ball.vx *= speed / old; ball.vy *= speed / old; }
      else ball.heldSpeed = speed;
    }
    advanceBallSpeed(ball, ceiling = false) {
      if (ceiling) { if (ball.ceilingHit) return; ball.ceilingHit = true; }
      else { ball.brickHits += 1; if (!SPEED_HITS.includes(ball.brickHits)) return; }
      ball.speedTier = Math.min(SPEED_TIERS.length - 1, ball.speedTier + 1);
      this.setBallSpeed(ball, SPEED_TIERS[ball.speedTier]);
    }
    chooseCapsule() {
      // P/B are rare; E/D occur about twice as often as S/C/L. The original's
      // score/paddle-driven random byte table is deliberately not reproduced.
      let type;
      for (let tries = 0; tries < 16; tries++) {
        const roll = Math.floor(this.random() * 256);
        type = roll < 3 ? 'P' : roll < 6 ? 'B' : ['E', 'E', 'D', 'D', 'S', 'C', 'L'][Math.floor((roll - 6) * 7 / 250)];
        if (type !== this.currentCapsule) return type;
      }
      return ['E', 'D', 'S', 'C', 'L'].find(type => type !== this.currentCapsule);
    }
    finishLevel(warp = false) {
      if (this.state !== 'playing' || (this.boss && (warp || this.boss.hp > 0))) return false;
      this.clearReason = warp ? 'warp' : 'clear';
      if (!warp) this.addScore(500); // Explicit remake bonus, not an NES rule.
      this.capsules = []; this.lasers = []; this.enemies = []; this.bossShots = []; this.warpOpen = false;
      this.state = this.level === LEVELS.length - 1 ? 'win' : 'levelclear'; this.emit(this.state, { warp }); return true;
    }
    spawnEnemy() {
      if (this.boss || this.enemies.filter(e => !e.dead).length >= 3) return false;
      const left = this.paddle.x < WIDTH / 2;
      this.enemies.push({ x: left ? 58 : 250, y: FIELD.top + 1, w: 12, h: 12, vx: left ? 24 : -24, vy: 19, age: 0, phase: 'wander', shape: this.enemySerial++ % 4, dead: false });
      return true;
    }
    destroyEnemy(enemy) {
      if (enemy.dead) return;
      enemy.dead = true; this.addScore(100);
      this.emit('enemy', { x: enemy.x + enemy.w / 2, y: enemy.y + enemy.h / 2 });
    }
    moveEnemies(dt) {
      this.enemyTimer -= dt;
      if (this.enemyTimer <= 0 && this.enemies.filter(e => !e.dead).length < 3) {
        this.spawnEnemy(); this.enemyTimer = 4;
      }
      const lowest = this.bricks.reduce((y, b) => b.hp > 0 ? Math.max(y, b.y + b.h) : y, FIELD.top);
      for (const enemy of this.enemies) {
        if (enemy.dead) continue;
        enemy.age += dt;
        if (enemy.phase === 'wander' && enemy.y > lowest + 14) { enemy.phase = 'circle'; enemy.age = 0; }
        if (enemy.phase === 'circle' && (enemy.age > 7 || enemy.y > this.paddle.y - 65)) enemy.phase = 'exit';
        if (enemy.phase === 'circle') { enemy.x += Math.cos(enemy.age * 2.4) * 36 * dt; enemy.y += (15 + Math.sin(enemy.age * 2.4) * 22) * dt; }
        else if (enemy.phase === 'exit') enemy.y += 36 * dt;
        else {
          // Wander through open space; intact bricks turn the debris aside.
          const dx = enemy.vx * dt, dy = enemy.vy * dt;
          const overlaps = (x, y) => this.bricks.some(b => b.hp > 0 && x < b.x + b.w && x + enemy.w > b.x && y < b.y + b.h && y + enemy.h > b.y);
          if (overlaps(enemy.x + dx, enemy.y)) enemy.vx *= -1; else enemy.x += dx;
          if (overlaps(enemy.x, enemy.y + dy)) { enemy.vy *= -1; if (Math.abs(enemy.vx) < 1) enemy.vx = 24; } else enemy.y += dy;
        }
        if (enemy.x < FIELD.left || enemy.x + enemy.w > FIELD.right) { enemy.x = clamp(enemy.x, FIELD.left, FIELD.right - enemy.w); enemy.vx *= -1; }
        if (enemy.y < FIELD.top) { enemy.y = FIELD.top; enemy.vy = Math.abs(enemy.vy); }
        if (enemy.y + enemy.h >= this.paddle.y && enemy.y <= this.paddle.y + this.paddle.height && enemy.x + enemy.w >= this.paddle.x - this.paddle.width / 2 && enemy.x <= this.paddle.x + this.paddle.width / 2) this.destroyEnemy(enemy);
        if (enemy.y > HEIGHT) enemy.dead = true;
      }
      this.enemies = this.enemies.filter(e => !e.dead);
    }
    // Sixteen hits and hostile bullets follow the manual. Timing, dimensions,
    // aimed single shots, and resetting HP per life are explicit remake choices.
    resetBoss() {
      this.bossShots = [];
      this.boss = LEVELS[this.level].boss ? { x: 124, y: 92, w: 72, h: 94, hp: 16, maxHp: 16, flash: 0, age: 0, shootTimer: 2.4 } : null;
      if (this.boss) this.emit('bossintro', { x: 160, y: 139, hp: 16, maxHp: 16 });
    }
    hitBoss() {
      const boss = this.boss;
      if (!boss || boss.hp <= 0 || this.state !== 'playing') return false;
      boss.hp--; boss.flash = 0.14;
      this.emit('bosshit', { x: boss.x + boss.w / 2, y: boss.y + boss.h / 2, hp: boss.hp, maxHp: boss.maxHp });
      if (!boss.hp) {
        this.emit('bossdefeat', { x: boss.x + boss.w / 2, y: boss.y + boss.h / 2 });
        this.finishLevel();
      }
      return true;
    }
    moveBoss(dt) {
      const boss = this.boss;
      if (!boss || boss.hp <= 0 || this.state !== 'playing') return;
      boss.age += dt; boss.flash = Math.max(0, boss.flash - dt); boss.shootTimer -= dt;
      if (boss.shootTimer <= 0) {
        const x = boss.x + boss.w / 2, y = boss.y + boss.h - 18;
        const dx = this.paddle.x - x, dy = this.paddle.y - y, length = Math.hypot(dx, dy);
        this.bossShots.push({ x, y, r: 4, vx: dx / length * 105, vy: dy / length * 105 });
        boss.shootTimer += 1.8;
        this.emit('bossshoot', { x, y });
      }
      const paddle = { x: this.paddle.x - this.paddle.width / 2, y: this.paddle.y, w: this.paddle.width, h: this.paddle.height };
      for (const shot of this.bossShots) {
        const dx = shot.vx * dt, dy = shot.vy * dt;
        const overlap = shot.x + shot.r >= paddle.x && shot.x - shot.r <= paddle.x + paddle.w && shot.y + shot.r >= paddle.y && shot.y - shot.r <= paddle.y + paddle.h;
        if (overlap || sweepRect(shot.x, shot.y, dx, dy, paddle, shot.r)) { this.loseLife('boss-shot'); return; }
        shot.x += dx; shot.y += dy;
      }
      this.bossShots = this.bossShots.filter(s => s.y - s.r < HEIGHT && s.x > FIELD.left - 10 && s.x < FIELD.right + 10);
    }
    loseLife(reason = 'ball') {
      if (this.state !== 'playing') return;
      this.lives--; this.emit('life', { reason }); this.bossShots = [];
      if (this.lives <= 0) { this.state = 'gameover'; this.resetPaddle(); this.balls = []; this.enemies = []; this.emit('gameover'); }
      else this.serve();
    }
    serve() {
      this.resetPaddle(); this.enemies = []; this.enemyTimer = ENEMY_DELAYS[this.level]; this.resetBoss();
      this.balls = [this.makeBall(this.paddle.x, this.paddle.y - 4, 0, 0, true)];
      this.state = 'ready';
    }
    loadLevel(index) {
      this.level = index; this.clearReason = ''; this.enemySerial = 0; this.bricks = buildBricks(index); this.destroyed = 0;
      this.paddle.x = 160; this.serve(); this.emit('level', { level: index });
    }
    nextLevel() { if (this.state !== 'levelclear') return false; if (this.level + 1 < LEVELS.length) this.loadLevel(this.level + 1); else this.state = 'win'; return true; }
    togglePause() {
      if (this.state === 'paused') { this.state = this.previousState; this.emit('resume'); return true; }
      if (this.state !== 'playing' && this.state !== 'ready') return false;
      this.previousState = this.state; this.state = 'paused'; this.emit('pause'); return true;
    }
    action() {
      if (this.state !== 'ready' && this.state !== 'playing') return false;
      let launched = false;
      for (const ball of this.balls) if (ball.attached) {
        const angle = -Math.PI / 2 + clamp(ball.offset / (this.paddle.width / 2), -0.8, 0.8) * 0.65 + 0.17;
        const speed = ball.heldSpeed || SPEED_TIERS[ball.speedTier];
        ball.vx = Math.cos(angle) * speed; ball.vy = Math.sin(angle) * speed; ball.heldSpeed = 0; ball.attached = false; launched = true;
      }
      this.state = 'playing';
      if (launched) this.emit('launch');
      if (this.power === 'L' && this.shotCooldown <= 0) {
        for (const side of [-1, 1]) this.lasers.push({ x: this.paddle.x + side * (this.paddle.width / 2 - 4), y: this.paddle.y - 5 });
        this.shotCooldown = 0.19; this.emit('laser');
      }
      return true;
    }
    hitBrick(brick, laser = false) {
      if (brick.hp <= 0) return;
      brick.flash = 0.12;
      if (brick.type === 'g') { this.emit('metal', { x: brick.x + brick.w / 2, y: brick.y }); return; }
      brick.hp -= 1;
      if (brick.hp > 0) { this.emit('armor', { x: brick.x + brick.w / 2, y: brick.y }); return; }
      this.addScore(brick.score); this.destroyed += 1;
      this.emit('brick', { x: brick.x + brick.w / 2, y: brick.y + brick.h / 2, color: brick.type, score: brick.score });
      if (brick.type !== 'S' && this.capsules.length === 0 && this.balls.length <= 1 && this.random() < 0.22) {
        const type = this.chooseCapsule();
        this.capsules.push({ x: brick.x + brick.w / 2, y: brick.y + 6, type, spin: 0 });
      }
    }
    applyPower(type) {
      if (this.boss || !POWERUPS.includes(type)) return false;
      this.addScore(100); this.power = ''; this.currentCapsule = type; this.warpOpen = false; this.paddle.width = 47; this.lasers = [];
      // Release previously caught balls before replacing Catch with a new capsule.
      if (type !== 'C' && this.balls.some(b => b.attached) && this.state === 'playing') this.action();
      if (type === 'E') { this.power = type; this.paddle.width = 73; }
      if (type === 'L' || type === 'C') this.power = type;
      if (type === 'S') for (const b of this.balls) { b.speedTier = Math.max(0, b.speedTier - 2); this.setBallSpeed(b, SPEED_TIERS[b.speedTier]); }
      if (type === 'B') this.warpOpen = true;
      if (type === 'P') this.lives = Math.min(9, this.lives + 1);
      if (type === 'D' && this.balls.length) {
        const origin = this.balls[0]; const s = Math.max(110, Math.hypot(origin.vx, origin.vy) || this.speed);
        let angle = Math.atan2(origin.vy || -s, origin.vx || 0);
        this.balls = [-0.4, 0, 0.4].map(shift => {
          let vx = Math.cos(angle + shift) * s, vy = Math.sin(angle + shift) * s;
          if (Math.abs(vy) < s * 0.22) vy = Math.sign(vy || -1) * s * 0.22;
          const ball = this.makeBall(origin.x, origin.y, vx, vy, false);
          ball.speedTier = origin.speedTier; ball.brickHits = origin.brickHits; ball.ceilingHit = origin.ceilingHit;
          this.setBallSpeed(ball, s); return ball;
        });
        this.state = 'playing';
      }
      this.paddle.x = clamp(this.paddle.x, FIELD.left + this.paddle.width / 2, FIELD.right - this.paddle.width / 2);
      this.emit('power', { power: type }); return true;
    }
    moveBall(ball, dt) {
      if (ball.attached) { ball.x = this.paddle.x + ball.offset; ball.y = this.paddle.y - ball.r - 1; return; }
      ball.trail.push({ x: ball.x, y: ball.y }); if (ball.trail.length > 5) ball.trail.shift();
      let remaining = dt, iterations = 0;
      while (remaining > 1e-7 && iterations++ < 16) {
        const dx = ball.vx * remaining, dy = ball.vy * remaining;
        let collision = null;
        const candidate = (item) => { if (item && item.t >= -1e-7 && item.t <= 1 && (!collision || item.t < collision.t)) collision = item; };
        if (dx < 0) candidate({ t: (FIELD.left + ball.r - ball.x) / dx, nx: 1, ny: 0, kind: 'wall' });
        if (dx > 0) candidate({ t: (FIELD.right - ball.r - ball.x) / dx, nx: -1, ny: 0, kind: 'wall' });
        if (dy < 0) candidate({ t: (FIELD.top + ball.r - ball.y) / dy, nx: 0, ny: 1, kind: 'ceiling' });
        if (dy > 0 && ball.y <= this.paddle.y - ball.r + 0.01) {
          const t = (this.paddle.y - ball.r - ball.y) / dy, x = ball.x + dx * t;
          if (x >= this.paddle.x - this.paddle.width / 2 - ball.r && x <= this.paddle.x + this.paddle.width / 2 + ball.r) candidate({ t, nx: 0, ny: -1, kind: 'paddle' });
        }
        if (this.boss && this.boss.hp > 0) {
          const hit = sweepRect(ball.x, ball.y, dx, dy, this.boss, ball.r);
          if (hit) candidate(Object.assign(hit, { kind: 'boss' }));
        }
        for (const brick of this.bricks) if (brick.hp > 0) {
          const hit = sweepRect(ball.x, ball.y, dx, dy, brick, ball.r);
          if (hit) candidate(Object.assign(hit, { kind: 'brick', brick }));
        }
        for (const enemy of this.enemies) if (!enemy.dead) {
          const hit = sweepRect(ball.x, ball.y, dx, dy, enemy, ball.r);
          if (hit) candidate(Object.assign(hit, { kind: 'enemy', enemy }));
        }
        if (!collision) { ball.x += dx; ball.y += dy; break; }
        ball.x += dx * collision.t; ball.y += dy * collision.t;
        ball.x += collision.nx * 0.04; ball.y += collision.ny * 0.04;
        remaining *= 1 - collision.t;
        if (collision.kind === 'paddle') {
          const relative = clamp((ball.x - this.paddle.x) / (this.paddle.width / 2), -1, 1);
          if (this.power === 'C') { ball.attached = true; ball.offset = clamp(ball.x - this.paddle.x, -this.paddle.width / 2 + 4, this.paddle.width / 2 - 4); ball.heldSpeed = Math.hypot(ball.vx, ball.vy); ball.vx = 0; ball.vy = 0; this.emit('catch'); break; }
          const speed = clamp(Math.hypot(ball.vx, ball.vy), 90, 240);
          const zone = Math.min(2, Math.floor(Math.abs(relative) * 3));
          const angle = AIM_ANGLES[zone] * Math.sign(relative || ball.vx || 1);
          ball.vx = Math.sin(angle) * speed; ball.vy = -Math.cos(angle) * speed;
          this.emit('paddle');
        } else {
          if (collision.nx) ball.vx = -ball.vx; if (collision.ny) ball.vy = -ball.vy;
          if (collision.kind === 'brick') {
            this.hitBrick(collision.brick);
            this.advanceBallSpeed(ball);
          } else if (collision.kind === 'boss') { this.hitBoss(); if (this.state !== 'playing') return; }
          else if (collision.kind === 'enemy') this.destroyEnemy(collision.enemy);
          else { if (collision.kind === 'ceiling') this.advanceBallSpeed(ball, true); this.emit('wall'); }
        }
      }
    }
    step(dt, input = {}) {
      if (this.state !== 'playing' && this.state !== 'ready') return;
      dt = clamp(Number(dt) || 0, 0, 0.1); if (!dt) return;
      this.elapsed += dt; this.shotCooldown = Math.max(0, this.shotCooldown - dt);
      if (Number.isFinite(input.pointerX)) this.paddle.x = input.pointerX;
      if (input.left || input.right) this.paddle.x += ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * 280 * dt;
      this.paddle.x = clamp(this.paddle.x, FIELD.left + this.paddle.width / 2, FIELD.right - this.paddle.width / 2);
      for (const brick of this.bricks) brick.flash = Math.max(0, brick.flash - dt);
      if (input.fire && this.state === 'playing' && this.power === 'L') this.action();
      if (this.state === 'playing' && this.warpOpen && this.paddle.x + this.paddle.width / 2 >= FIELD.right - 0.01) { this.finishLevel(true); return; }
      if (!this.boss) this.moveEnemies(dt);
      for (const ball of this.balls) this.moveBall(ball, dt);
      if (this.state !== 'playing') return;
      this.moveBoss(dt);
      if (this.state !== 'playing') return;
      for (const laser of this.lasers) {
        const dy = -350 * dt; let closest = null;
        for (const brick of this.bricks) if (brick.hp > 0) {
          const hit = sweepRect(laser.x, laser.y, 0, dy, brick, 1);
          if (hit && (!closest || hit.t < closest.t)) closest = { t: hit.t, brick };
        }
        for (const enemy of this.enemies) if (!enemy.dead) {
          const hit = sweepRect(laser.x, laser.y, 0, dy, enemy, 1);
          if (hit && (!closest || hit.t < closest.t)) closest = { t: hit.t, enemy };
        }
        if (closest) { if (closest.enemy) this.destroyEnemy(closest.enemy); else this.hitBrick(closest.brick, true); laser.dead = true; } else laser.y += dy;
      }
      this.lasers = this.lasers.filter(l => !l.dead && l.y > FIELD.top);
      for (const cap of this.capsules) {
        cap.y += 51 * dt; cap.spin += dt;
        if (Math.abs(cap.x - this.paddle.x) <= this.paddle.width / 2 + 8 && cap.y + 5 >= this.paddle.y && cap.y - 5 <= this.paddle.y + this.paddle.height) { cap.dead = true; this.applyPower(cap.type); }
      }
      this.capsules = this.capsules.filter(c => !c.dead && c.y < HEIGHT + 12);
      this.balls = this.balls.filter(b => b.y < HEIGHT + b.r);
      if (!this.boss && this.remaining === 0) {
        this.finishLevel(); return;
      }
      if (this.balls.length === 0) this.loseLife();
    }
  }
  return { Game, WIDTH, HEIGHT, FIELD, BRICK, LEVELS, VALUES, POWERUPS, POWER_INFO, AIM_ANGLES, SPEED_TIERS, SPEED_HITS, ENEMY_DELAYS, buildBricks, sweepRect, clamp };
});
