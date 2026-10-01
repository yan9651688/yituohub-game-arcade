/* Deterministic 60 Hz run-and-gun simulation. World y is up; actor y is feet. */
export const WEAPONS = Object.freeze({
  N: { name: '制式步枪', rate: .19, speed: 35, damage: 1.2, color: '#ffe7a2' },
  M: { name: '高速机枪', rate: .075, speed: 42, damage: 1, color: '#ffdb76' },
  S: { name: '五向散射', rate: .23, speed: 33, damage: 1.05, color: '#ff9465' },
  L: { name: '贯穿激光', rate: .28, speed: 57, damage: 4.2, color: '#8bf9ed' },
  F: { name: '回旋火焰', rate: .23, speed: 24, damage: 3, color: '#ff804f' }
});
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hypot = Math.hypot;
const overlap = (a, b) => a.x - a.w / 2 < b.x + b.w / 2 && a.x + a.w / 2 > b.x - b.w / 2 && a.y < b.y + b.h && a.y + a.h > b.y;
const sweptHit = (b, target) => {
  const minX = target.x - target.w / 2 - b.r, maxX = target.x + target.w / 2 + b.r;
  const minY = target.y - b.r, maxY = target.y + target.h + b.r;
  let lo = 0, hi = 1;
  for (const [p, delta, min, max] of [[b.px, b.x - b.px, minX, maxX], [b.py, b.y - b.py, minY, maxY]]) {
    if (Math.abs(delta) < 1e-8) { if (p < min || p > max) return false; }
    else { let a = (min - p) / delta, c = (max - p) / delta; if (a > c) [a, c] = [c, a]; lo = Math.max(lo, a); hi = Math.min(hi, c); if (lo > hi) return false; }
  }
  return true;
};

export class GameEngine {
  constructor(levels, onEvent = () => {}) {
    this.levels = levels; this.onEvent = onEvent; this.serial = 0; this.seed = 2026;
    this.preview(0);
  }
  random() { this.seed = (Math.imul(1664525, this.seed) + 1013904223) >>> 0; return this.seed / 4294967296; }
  emit(type, data = {}) { this.onEvent(type, data); }
  makePlayer(id, spawn) {
    const assist = this.options?.difficulty === 'assist';
    return { id, x: spawn.x + id * 1.15, y: spawn.y + .04, z: 12, vx: 0, vy: 0, w: .65, h: 1.65, face: 1, aimX: 1, aimY: 0, grounded: false, prone: false, weapon: 'N', invuln: 2.5, hp: assist ? 3 : 1, maxHp: assist ? 3 : 1, dead: false, respawn: 0, shot: 0, rapid: false, coyote: 0, buffer: 0, previousJump: false, distance: 0 };
  }
  preview(index) {
    this.options = { difficulty: 'classic', players: 1, training: false };
    this.load(index, false); this.state.mode = 'menu';
    this.state.players[0].x = this.state.level.mode === 'base' ? 0 : 12;
    this.state.camera.x = this.state.level.mode === 'vertical' ? 15 : 15;
  }
  start(index = 0, options = {}) {
    this.options = { difficulty: 'classic', players: 1, training: false, ...options };
    this.seed = 2026 + index; this.load(index, false); this.state.mode = 'playing';
    this.emit('start', { index, ...this.options });
  }
  load(index, carry) {
    const old = this.state, level = this.levels[index];
    if (!level) throw new Error('Unknown level');
    const lives = 30;
    const players = Array.from({ length: this.options.players }, (_, i) => this.makePlayer(i, level.spawn));
    if (carry && old) players.forEach((p, i) => { p.weapon = old.players[i]?.weapon || 'N'; p.rapid = old.players[i]?.rapid || false; });
    this.state = { level, index, mode: 'playing', time: 0, elapsed: carry ? old.elapsed : 0, score: carry ? old.score : 0, kills: carry ? old.kills : 0, deaths: carry ? old.deaths : 0,
      lives: carry ? old.lives : lives, players, enemies: [], bullets: [], particles: [], pickups: [],
      platforms: (level.platforms || []).map((p, i) => ({ ...p, id: i, originX: p.x, originY: p.y, dx: 0, dy: 0, standing: 0, gone: 0 })),
      hazards: (level.hazards || []).map((h, i) => ({ ...h, id: i, active: false, warning: false })),
      camera: { x: level.mode === 'vertical' ? 15 : 10, y: level.mode === 'vertical' ? 5.4 : 3.5 }, checkpoint: { ...level.spawn }, checkpointIndex: level.checkpoints?.[0]?.x === level.spawn.x && level.checkpoints?.[0]?.y === level.spawn.y ? 0 : -1,
      boss: null, baseRoom: 0, roomTransition: 0, progress: 0, shake: 0, flash: 0, cleared: false, quality: 'high', training: this.options.training, difficulty: this.options.difficulty };
    const s = this.state;
    if (level.mode === 'base') { this.setupRoom(0); s.players.forEach((p, i) => { p.x = i ? 2 : -2; p.y = 0; p.grounded = true; }); }
    else {
      s.enemies = (level.enemies || []).map(e => this.enemy(e));
      s.pickups = (level.pickups || []).map(p => ({ ...p, id: ++this.serial, collected: false }));
    }
    this.emit('level', { index, level });
  }
  enemy(config) {
    const kind = config.kind || 'rifle';
    const stats = { runner: [1.5, .65, 1.65], rifle: [2.4, .7, 1.65], sniper: [3, .7, 1.6], turret: [7, 1.3, 1.2], drone: [3, 1.3, .85], tank: [22, 3, 1.8], crawler: [2, 1, .55], core: [8, 1.1, 1.1] }[kind] || [2, .7, 1.65];
    return { ...config, id: ++this.serial, kind, x: config.x, y: config.y ?? 0, originX: config.x, originY: config.y ?? 0, z: config.z ?? 0, vx: 0, vy: 0,
      hp: config.hp || stats[0], maxHp: config.hp || stats[0], w: stats[1], h: stats[2], shot: .7 + this.random() * 1.5, time: this.random() * 4, hit: 0, face: -1, active: false, dead: false };
  }
  setupRoom(index) {
    const s = this.state, rooms = s.level.baseRooms || [], room = rooms[index] || {};
    s.baseRoom = index; s.bullets = []; s.enemies = [];
    if (index < rooms.length - 1) s.enemies.push(...(room.cores || [{ x: 0, y: 1.3, hp: 10 }]).map(c => this.enemy({ ...c, kind: 'core', z: -14 })));
    s.enemies.push(...(room.enemies || []).map(e => this.enemy({ ...e, y: 0, z: e.z ?? -7 })));
    s.pickups = [{ id: ++this.serial, x: index % 2 ? 4 : -4, y: .6, z: 12, type: ['S', 'M', 'L', 'F', 'B', 'S'][index % 6], collected: false }];
    s.players.forEach(p => { p.invuln = Math.max(1.5, p.invuln); p.z = 12; });
    if (index === rooms.length - 1) this.spawnBoss();
    this.emit('room', { index, name: room.name || '前进闸门' });
  }
  next() {
    if (this.state.mode !== 'clear') return;
    if (this.state.index >= this.levels.length - 1) { this.state.mode = 'victory'; return; }
    this.load(this.state.index + 1, true);
  }
  pause() { if (this.state.mode === 'playing') { this.state.mode = 'paused'; this.emit('pause'); } }
  resume() { if (this.state.mode === 'paused') { this.state.mode = 'playing'; this.emit('resume'); } }
  particle(x, y, color, count = 8, z = 0) {
    const s = this.state;
    for (let i = 0; i < count && s.particles.length < 230; i++) {
      const life = .22 + this.random() * .55;
      s.particles.push({ x, y, z, vx: (this.random() - .5) * 9, vy: this.random() * 7 - 1, vz: (this.random() - .5) * 3, life, maxLife: life, size: .08 + this.random() * .2, color });
    }
  }
  bullet(x, y, vx, vy, friendly, config = {}) {
    if (this.state.bullets.length > 320) return;
    const b = { id: ++this.serial, x, y, px: x, py: y, z: config.z ?? 0, pz: config.z ?? 0, vx, vy, vz: 0, r: friendly ? .13 : .18, life: 2.7, friendly, weapon: 'N', damage: 1, age: 0, hits: [], ...config };
    this.state.bullets.push(b); return b;
  }
  fire(p) {
    const s = this.state, w = WEAPONS[p.weapon] || WEAPONS.N;
    p.shot = w.rate * (p.rapid ? .76 : 1); p.muzzle = .055;
    const y = p.y + (p.prone ? .38 : 1.14), base = s.level.mode === 'base';
    let ax = p.aimX, ay = p.aimY, az = 0;
    if (base) {
      const targets = [...s.enemies.filter(e => !e.dead && e.kind === 'core'), ...(s.boss?.active && !s.boss.dead ? [s.boss] : [])];
      const target = targets.sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
      ax = 0; ay = target ? (target.y + target.h * .52 - y) / 26 : 0; az = -1;
      if (target && Math.abs(target.x - p.x) < 1.9) ax = (target.x - p.x) / 26;
      const norm = hypot(ax, ay, az); ax /= norm; ay /= norm; az /= norm;
    }
    const spread = p.weapon === 'S' ? [-.22, -.11, 0, .11, .22] : [0];
    for (const angle of spread) {
      let dx = ax * Math.cos(angle) - ay * Math.sin(angle), dy = ax * Math.sin(angle) + ay * Math.cos(angle), dz = az;
      if (base) { dx = ax + Math.sin(angle); dy = ay; dz = -Math.cos(angle); }
      this.bullet(p.x + (base ? 0 : ax * .65), y + (base ? 0 : ay * .48), dx * w.speed, dy * w.speed, true,
        { z: base ? 11.2 : 0, vz: dz * w.speed, owner: p.id, weapon: p.weapon, damage: w.damage, r: p.weapon === 'F' ? .28 : p.weapon === 'L' ? .17 : .13, color: w.color });
    }
    this.emit(p.weapon === 'S' ? 'spread' : p.weapon === 'L' ? 'laser' : p.weapon === 'F' ? 'flame' : 'shoot');
  }
  enemyFire(e, count = 1, spread = .16, speed = 8) {
    const s = this.state, targets = s.players.filter(p => !p.dead);
    if (!targets.length) return;
    const p = targets.sort((a, b) => hypot(a.x - e.x, a.y - e.y) - hypot(b.x - e.x, b.y - e.y))[0];
    const y = e.y + e.h * .65, py = p.y + (p.prone ? .35 : .9), base = s.level.mode === 'base';
    if (base) {
      const norm = hypot(p.x - e.x, py - y, 12 - (e.z ?? -14));
      for (let i = 0; i < count; i++) this.bullet(e.x, y, (p.x - e.x) / norm * speed + (i - (count - 1) / 2) * 1.1, (py - y) / norm * speed, false, { z: e.z ?? -14, vz: (12 - (e.z ?? -14)) / norm * speed, life: 5, r: .22 });
    } else {
      const angle = Math.atan2(py - y, p.x - e.x);
      for (let i = 0; i < count; i++) { const a = angle + (i - (count - 1) / 2) * spread; this.bullet(e.x, y, Math.cos(a) * speed, Math.sin(a) * speed, false); }
    }
    this.particle(e.x, y, '#ffca7f', 2, e.z || 0);
  }
  moveActor(a, dt, isPlayer = false) {
    const s = this.state, prevX = a.x, prevY = a.y;
    a.x += a.vx * dt; a.vy -= 28 * dt; a.y += a.vy * dt; a.grounded = false;
    for (const plat of s.platforms) {
      if (plat.gone > 0) continue;
      if (a.x + a.w / 2 > plat.x && a.x - a.w / 2 < plat.x + plat.w && a.vy <= 0 && prevY >= plat.y - .14 && a.y <= plat.y) {
        a.y = plat.y; a.vy = 0; a.grounded = true; a.platformId = plat.id;
        if (isPlayer && plat.kind === 'crumble') plat.standing += dt;
      }
      if (plat.kind === 'ground' && a.y < plat.y - .35 && a.y + a.h > plat.y - plat.h && prevY < plat.y - .35) {
        if (prevX + a.w / 2 <= plat.x && a.x + a.w / 2 > plat.x) a.x = plat.x - a.w / 2;
        else if (prevX - a.w / 2 >= plat.x + plat.w && a.x - a.w / 2 < plat.x + plat.w) a.x = plat.x + plat.w + a.w / 2;
      }
    }
  }
  damagePlayer(p, lethal = false) {
    const s = this.state;
    if (s.cleared || p.dead || (!lethal && p.invuln > 0)) return;
    p.hp -= lethal ? p.maxHp : 1; s.flash = .2; s.shake = .2;
    this.particle(p.x, p.y + .8, '#a3f9ec', 15, p.z);
    if (p.hp > 0) { p.invuln = 1.7; this.emit('hit'); return; }
    s.deaths++; p.dead = true; p.respawn = 1.1; p.weapon = 'N'; p.rapid = false;
    if (!s.training) s.lives = Math.max(0, s.lives - 1);
    this.emit('death');
  }
  revive(p) {
    const s = this.state;
    if (s.lives <= 0 && !s.training) return;
    const partner = s.players.find(a => a !== p && !a.dead && a.grounded);
    const checkpoint = partner && s.level.mode !== 'base' ? partner : s.checkpoint;
    const replacement = this.makePlayer(p.id, checkpoint); replacement.invuln = 3.2;
    if (s.level.mode === 'base') { replacement.x = p.id ? 2 : -2; replacement.y = 0; replacement.z = 12; }
    Object.assign(p, replacement);
    if (!partner && s.level.mode !== 'base') {
      const half = Math.min((s.viewWidth || 31) / 2, s.level.length / 2);
      s.camera.x = clamp(p.x + (s.level.mode === 'vertical' ? 0 : Math.min(5, half * .4)), half, s.level.length - half);
      s.camera.y = Math.max(s.level.mode === 'vertical' ? 5.4 : 3.5, p.y + 2.4);
    }
  }
  playerStep(p, input, dt) {
    const s = this.state;
    if (p.dead) { p.respawn -= dt; if (p.respawn <= 0) this.revive(p); return; }
    p.invuln = Math.max(0, p.invuln - dt); p.shot -= dt; p.muzzle = Math.max(0, (p.muzzle || 0) - dt);
    const axis = (input.right ? 1 : 0) - (input.left ? 1 : 0), up = (input.up ? 1 : 0) - (input.down ? 1 : 0);
    const base = s.level.mode === 'base';
    p.prone = !!input.down && !axis && p.grounded; p.h = p.prone ? .65 : 1.65;
    if (axis) p.face = axis;
    let ax = axis || (up ? 0 : p.face), ay = up;
    if (p.prone) { ax = p.face; ay = 0; }
    const len = hypot(ax, ay) || 1; p.aimX = ax / len; p.aimY = ay / len;
    p.coyote = p.grounded ? .1 : Math.max(0, p.coyote - dt);
    p.buffer = input.jump && !p.previousJump ? .13 : Math.max(0, p.buffer - dt); p.previousJump = input.jump;
    if (p.buffer > 0 && p.coyote > 0 && !p.prone) { p.vy = 13; p.buffer = 0; p.coyote = 0; p.grounded = false; this.emit('jump'); }
    if (!input.jump && p.vy > 6.5) p.vy -= 22 * dt;
    const plat = s.platforms.find(q => q.id === p.platformId);
    if (p.grounded && plat && !base) { p.x += plat.dx; p.y += plat.dy; }
    const targetV = p.prone ? 0 : axis * 7;
    p.vx += (targetV - p.vx) * Math.min(1, dt * (plat?.kind === 'ice' ? 7 : 32));
    if (base) { p.x = clamp(p.x + p.vx * dt, -9, 9); p.vy -= 28 * dt; p.y = Math.max(0, p.y + p.vy * dt); if (p.y === 0) { p.grounded = true; p.vy = 0; } }
    else {
      this.moveActor(p, dt, true);
      p.x = clamp(p.x, .5, s.level.length - .5);
      if (s.level.mode === 'side' && s.boss?.active && !s.boss.dead) p.x = Math.min(p.x, s.level.boss.x - 1);
      if (p.y < -6 || (s.level.mode === 'vertical' && p.y < s.camera.y - 13)) this.damagePlayer(p, true);
    }
    if (input.shoot && p.shot <= 0 && !p.dead && s.roomTransition <= 0) this.fire(p);
    for (const item of s.pickups) if (!item.collected && Math.abs(p.x - item.x) < 1 && Math.abs(p.y + .9 - item.y) < 1.7 && (!base || Math.abs((item.z || 12) - p.z) < 3)) {
      item.collected = true; s.score += 100;
      if (WEAPONS[item.type]) p.weapon = item.type;
      else if (item.type === 'B') p.invuln = 12;
      else if (item.type === 'R') p.rapid = true;
      else if (item.type === 'life') s.lives++;
      this.emit('pickup', { type: item.type, name: WEAPONS[item.type]?.name || ({ B: '无敌屏障 · 12秒', R: '射速强化', life: '增援 +1' }[item.type]) });
      this.particle(item.x, item.y, '#bafa99', 14, item.z || 0);
    }
  }
  enemiesStep(dt) {
    const s = this.state, base = s.level.mode === 'base', alive = s.players.filter(p => !p.dead);
    for (const e of s.enemies) {
      if (e.dead) continue;
      e.hit = Math.max(0, e.hit - dt); e.time += dt;
      const p = alive.reduce((best, a) => !best || hypot(a.x - e.x, a.y - e.y) < hypot(best.x - e.x, best.y - e.y) ? a : best, null);
      if (!p) continue;
      const near = base || (Math.abs(e.x - s.camera.x) < 25 && Math.abs(e.y - s.camera.y) < 17);
      e.active = near; if (!near) continue;
      e.face = p.x > e.x ? 1 : -1;
      if (base) {
        if (e.kind !== 'core' && e.kind !== 'turret') e.z += dt * (e.kind === 'crawler' ? 2.8 : 1.4);
        if (e.z > 15) { e.dead = true; continue; }
      } else if (e.kind === 'drone') { e.y = e.originY + Math.sin(e.time * 1.8) * .75; e.x += e.face * dt * 1.2; }
      else if (['runner', 'crawler', 'rifle'].includes(e.kind)) {
        e.vx = ['runner', 'crawler'].includes(e.kind) ? e.face * (e.kind === 'crawler' ? 3.7 : 2.7) : Math.abs(p.x - e.x) > 10 ? e.face * 1.4 : 0;
        if (e.patrol && Math.abs(e.x - e.originX) > e.patrol) e.vx = -Math.sign(e.x - e.originX) * 1.8;
        this.moveActor(e, dt); if (e.y < -8) e.dead = true;
      }
      e.shot -= dt; e.warning = e.shot < .4;
      if (e.shot <= 0 && e.kind !== 'crawler' && e.kind !== 'runner') {
        e.shot = (e.kind === 'turret' ? 2.4 : e.kind === 'core' ? 2.7 : 2.1) * (s.difficulty === 'veteran' ? .75 : 1) + this.random() * .55;
        this.enemyFire(e, e.kind === 'tank' ? 3 : e.kind === 'turret' ? 2 : 1, .18, s.difficulty === 'assist' ? 6.5 : 8.5);
      }
      for (const p of alive) if ((!base || Math.abs(e.z - p.z) < 1.1) && overlap(p, e)) this.damagePlayer(p);
    }
  }
  spawnBoss() {
    const s = this.state; if (s.boss) return;
    const b = s.level.boss, multiplier = (s.difficulty === 'assist' ? .72 : 1) * (s.players.length > 1 ? 1.45 : 1);
    s.boss = { ...b, x: s.level.mode === 'base' ? 0 : b.x, y: s.level.mode === 'base' ? .5 : b.y, z: s.level.mode === 'base' ? -14 : 0,
      hp: b.hp * multiplier, maxHp: b.hp * multiplier, timer: 0, shot: 1.7, phase: 0, hit: 0, active: true, dead: false };
    s.shake = .2; this.emit('boss', { name: b.name });
  }
  bossStep(dt) {
    const s = this.state, b = s.boss;
    if (!b || b.dead) return;
    b.timer += dt; b.shot -= dt; b.hit = Math.max(0, b.hit - dt); b.phase = b.hp < b.maxHp * .4 ? 2 : b.hp < b.maxHp * .7 ? 1 : 0;
    b.warning = b.shot < .5;
    if (b.type === 'hover') { b.y = s.level.boss.y + 1.3 + Math.sin(b.timer * 1.7) * 1.2; b.x = s.level.boss.x - 3 + Math.sin(b.timer * .7) * 3; }
    if (b.type === 'titan') { b.x = s.level.boss.x - Math.max(0, Math.sin(b.timer * .6)) * 9; b.y = s.level.boss.y + Math.max(0, Math.sin(b.timer * 1.4)) * 2.4; }
    if (b.shot <= 0) {
      b.shot = 1.7 - b.phase * .24;
      if (b.type === 'heart') {
        for (let i = 0; i < 9; i++) { const angle = Math.PI * .58 + i * .32; this.bullet(b.x, b.y + b.h * .55, Math.cos(angle) * 6.5, Math.sin(angle) * 6.5, false, { r: .23 }); }
        if (s.enemies.filter(e => !e.dead).length < 8) s.enemies.push(this.enemy({ x: b.x - 3, y: b.y, kind: 'crawler' }));
      } else if (b.type === 'hydra') {
        this.enemyFire({ ...b, x: b.x - 3, y: b.y + 1 }, 3, .18, 7.5);
        this.enemyFire({ ...b, x: b.x + 3, y: b.y + 1 }, 3, .18, 7.5);
      } else if (b.type === 'gate' || b.type === 'fortress') {
        this.enemyFire(b, 3 + b.phase * 2, .14, 8);
        if (b.phase && s.enemies.filter(e => !e.dead && e.active).length < 6) s.enemies.push(this.enemy({ x: b.x - 2, y: b.y, kind: 'runner' }));
      } else if (b.type === 'twins') {
        this.enemyFire({ ...b, x: -4 }, 3, .2, 11);
        this.enemyFire({ ...b, x: 4 }, 3, .2, 11);
      } else this.enemyFire(b, 3 + b.phase * 2, .18, s.level.mode === 'base' ? 12 : 9);
      this.emit('bossShot');
    }
    for (const p of s.players) if (!p.dead && s.level.mode !== 'base' && overlap(p, b)) this.damagePlayer(p);
  }
  hitEnemy(e, b) {
    e.hp -= b.damage; e.hit = .1; b.hits.push(e.id);
    this.particle(b.x, b.y, '#fff0b2', 3, b.z);
    if (b.weapon !== 'L' || b.hits.length >= 4) b.life = 0;
    if (e.hp <= 0) {
      e.dead = true; this.state.kills++; this.state.score += e.kind === 'tank' ? 450 : e.kind === 'core' ? 300 : 100;
      this.particle(e.x, e.y + e.h * .5, '#ffa354', e.kind === 'tank' ? 26 : 12, e.z);
      this.emit('explode', { large: e.kind === 'tank' });
      if (!this.state.level.mode.includes('base') && this.random() < .04) this.state.pickups.push({ id: ++this.serial, x: e.x, y: Math.max(.8, e.y + .7), type: 'M' });
    }
  }
  bulletsStep(dt) {
    const s = this.state, base = s.level.mode === 'base';
    for (const b of s.bullets) {
      b.px = b.x; b.py = b.y; b.pz = b.z; b.age += dt; b.life -= dt;
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
      if (b.weapon === 'F') b.y += Math.sin(b.age * 22) * dt * 2;
      if (b.life <= 0) continue;
      if (b.friendly) {
        for (const e of s.enemies) {
          if (e.dead || !e.active || b.hits.includes(e.id)) continue;
          const depth = !base || (Math.min(b.pz, b.z) <= e.z + .7 && Math.max(b.pz, b.z) >= e.z - .7);
          if (depth && sweptHit(b, e)) { this.hitEnemy(e, b); if (b.life <= 0) break; }
        }
        const boss = s.boss;
        if (b.life > 0 && boss && !boss.dead && !b.hits.includes('boss') && (!base || (Math.min(b.pz, b.z) <= boss.z + 2 && Math.max(b.pz, b.z) >= boss.z - 2)) && sweptHit(b, boss)) {
          boss.hp -= b.damage; boss.hit = .08; b.life = 0; b.hits.push('boss');
          this.particle(b.x, b.y, '#fff0bb', 4, b.z);
          if (boss.hp <= 0) { boss.dead = true; s.shake = .7; s.score += 5000; this.particle(boss.x, boss.y + 2, '#ffad67', 70, boss.z); s.cleared = true; s.clearTimer = 1.3; this.emit('explode', { large: true }); }
        }
      } else for (const p of s.players) {
        if (!p.dead && (!base || (Math.min(b.pz, b.z) <= p.z + .5 && Math.max(b.pz, b.z) >= p.z - .5)) && sweptHit(b, p)) { this.damagePlayer(p); b.life = 0; break; }
      }
    }
    s.bullets = s.bullets.filter(b => b.life > 0 && b.y > -12 && Math.abs(b.x - s.camera.x) < 60 && (!base || Math.abs(b.z) < 40));
  }
  step(dt, inputs = []) {
    const s = this.state;
    if (s.mode === 'menu') { s.time += dt; return; }
    if (s.mode !== 'playing') return;
    dt = clamp(dt, 0, 1 / 30); s.time += dt; s.elapsed += dt; s.shake = Math.max(0, s.shake - dt); s.flash = Math.max(0, s.flash - dt);
    if (s.cleared) {
      s.clearTimer -= dt;
      if (s.clearTimer <= 0) { s.mode = s.index === 7 ? 'victory' : 'clear'; this.emit('clear', { index: s.index, final: s.index === 7, score: s.score, training: s.training }); }
    }
    for (const p of s.platforms) {
      p.dx = 0; p.dy = 0;
      if (p.kind === 'moving') {
        const value = Math.sin(s.time * (p.speed || 1) + (p.phase || 0)) * (p.range || 1.5);
        if (p.axis === 'y') { const y = p.originY + value; p.dy = y - p.y; p.y = y; }
        else { const x = p.originX + value; p.dx = x - p.x; p.x = x; }
      }
      if (p.kind === 'crumble' && p.standing > .65) { p.gone = 3.4; p.standing = 0; }
      if (p.gone > 0) p.gone = Math.max(0, p.gone - dt);
    }
    for (let i = 0; i < s.players.length; i++) this.playerStep(s.players[i], inputs[i] || {}, dt);
    const alive = s.players.filter(p => !p.dead);
    if (!alive.length && s.players.every(p => p.respawn <= 0) && !s.training) { s.mode = 'gameover'; this.emit('gameover'); return; }
    if (!s.cleared) {
      this.enemiesStep(dt); this.bossStep(dt); this.bulletsStep(dt);
      for (const h of s.hazards) {
        const period = h.period || 3.5, t = (s.time + (h.phase || 0)) % period;
        h.active = h.type === 'spike' || t > period * .52; h.warning = !h.active && t > period * .52 - .5; h.top = h.y + h.h;
        if (h.active) for (const p of alive) if (overlap(p, { x: h.x + h.w / 2, y: h.y, w: h.w, h: h.h })) this.damagePlayer(p);
      }
      if (s.level.mode === 'base') {
        if (!s.boss && !s.enemies.some(e => e.kind === 'core' && !e.dead) && s.roomTransition <= 0) { s.roomTransition = 1.6; s.enemies.forEach(e => e.dead = true); s.bullets = []; this.emit('gate'); }
        if (s.roomTransition > 0) { s.roomTransition -= dt; if (s.roomTransition <= 0) this.setupRoom(s.baseRoom + 1); }
        s.progress = (s.baseRoom + (s.boss ? 1 - s.boss.hp / s.boss.maxHp : .2)) / (s.level.baseRooms?.length || 6);
      } else if (alive.length) {
        const frontX = Math.max(...alive.map(p => p.x)), frontY = Math.max(...alive.map(p => p.y));
        const vertical = s.level.mode === 'vertical';
        s.progress = clamp((vertical ? frontY : frontX) / (vertical ? s.level.height : s.level.length), 0, 1);
        const half = Math.min((s.viewWidth || 31) / 2, s.level.length / 2);
        const tx = clamp(frontX + (vertical ? 0 : Math.min(5, half * .4)), half, s.level.length - half);
        const ty = vertical ? Math.max(5.4, frontY + 3.6) : Math.max(3.5, Math.min(6.8, frontY + 2.3));
        s.camera.x += (tx - s.camera.x) * Math.min(1, dt * 4.5);
        s.camera.y += (ty - s.camera.y) * Math.min(1, dt * 5);
        for (let i = 0; i < (s.level.checkpoints || []).length; i++) {
          const c = s.level.checkpoints[i];
          if (i > s.checkpointIndex && (vertical ? frontY >= c.y : frontX >= c.x)) { s.checkpoint = { ...c }; s.checkpointIndex = i; this.emit('checkpoint'); }
        }
        if (!s.boss && (vertical ? frontY > s.level.boss.y - 9 : frontX > s.level.boss.x - 21)) this.spawnBoss();
        if (s.players.length > 1 && Math.abs(alive[0]?.x - (alive[1]?.x ?? alive[0]?.x)) > 25) { const back = alive.sort((a, b) => a.x - b.x)[0]; back.x = frontX - 22; back.invuln = Math.max(back.invuln, 1); }
      }
    }
    for (const p of s.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += (p.vz || 0) * dt; p.vy -= 12 * dt; }
    s.particles = s.particles.filter(p => p.life > 0);
  }
  snapshot() {
    const s = this.state;
    return { mode: s.mode, level: s.index + 1, theme: s.level.theme, lives: s.lives, score: s.score, room: s.baseRoom, progress: s.progress, kills: s.kills,
      players: s.players.map(({ x, y, weapon, hp, dead, grounded }) => ({ x, y, weapon, hp, dead, grounded })),
      boss: s.boss && { name: s.boss.name, hp: s.boss.hp, maxHp: s.boss.maxHp, dead: s.boss.dead }, enemies: s.enemies.filter(e => !e.dead).length, bullets: s.bullets.length };
  }
}
