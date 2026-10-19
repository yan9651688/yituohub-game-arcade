/* Vegetable Ninja. Canvas coordinates stay in CSS pixels, including touch input. */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const COLORS = ['#ff8b23', '#ab62e0', '#ff5740', '#eaf8c5', '#8ddc39', '#ffd344'];
  const FLESH = ['#ffd38a', '#fff1be', '#ffb58c', '#fcffe8', '#d8efa6', '#fff2a0'];
  const modes = { classic: Infinity, arcade: 60, zen: 90 };
  function segmentDistance(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const f = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    return Math.hypot(px - ax - f * dx, py - ay - f * dy);
  }
  class AudioKit {
    constructor() { this.muted = false; this.context = null; this.last = 0; }
    unlock() {
      if (this.muted) return;
      try {
        this.context ||= new (window.AudioContext || window.webkitAudioContext)();
        if (this.context.state === 'suspended') this.context.resume().catch(() => {});
      } catch { /* Silent play remains available. */ }
    }
    play(kind, combo = 1) {
      const c = this.context;
      if (!c || this.muted || c.state !== 'running') return;
      const now = c.currentTime;
      if (kind === 'slice' && now - this.last < .025) return;
      this.last = now;
      const o = c.createOscillator(), g = c.createGain();
      o.type = kind === 'bomb' ? 'sawtooth' : 'sine';
      const f = kind === 'bomb' ? 110 : kind === 'end' ? 392 : 380 + Math.min(combo, 10) * 72;
      const duration = kind === 'bomb' ? .34 : kind === 'start' ? .24 : .12;
      o.frequency.setValueAtTime(f, now);
      o.frequency.exponentialRampToValueAtTime(kind === 'bomb' ? 28 : f * 1.7, now + duration);
      g.gain.setValueAtTime(.0001, now); g.gain.exponentialRampToValueAtTime(.06, now + .008);
      g.gain.exponentialRampToValueAtTime(.0001, now + duration);
      o.connect(g); g.connect(c.destination); o.start(now); o.stop(now + duration + .01);
      o.onended = () => { o.disconnect(); g.disconnect(); };
    }
    close() { if (this.context) this.context.close().catch(() => {}); }
  }

  class VegetableNinjaEngine {
    constructor(canvas, callbacks = {}) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.callbacks = callbacks;
      this.state = 'idle'; this.mode = 'classic'; this.score = 0; this.lives = 3;
      this.sliced = 0; this.combo = 0; this.maxCombo = 0; this.elapsed = 0;
      this.timeLeft = Infinity; this.objects = []; this.parts = []; this.particles = [];
      this.splats = []; this.labels = []; this.trail = []; this.pointer = null;
      this.sound = new AudioKit(); this.best = {}; this.lastFrame = 0; this.visualTime = 0;
      this.lastHit = -10; this.invulnerable = 0; this.nextWave = .65; this.wave = 0;
      this.flash = 0; this.shake = 0; this.frozen = 0; this.double = 0; this.seq = 0;
      this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      for (const mode of Object.keys(modes)) {
        try { this.best[mode] = Math.max(0, Number(localStorage.getItem('vegetable-ninja.best.' + mode)) || 0); }
        catch { this.best[mode] = 0; }
      }
      this.atlas = new Image(); this.atlas.src = new URL('art/vegetables.webp', document.baseURI).href;
      this.resize = this.resize.bind(this); this.frame = this.frame.bind(this);
      this.down = this.down.bind(this); this.move = this.move.bind(this); this.up = this.up.bind(this);
      this.onBlur = () => { if (this.state === 'playing') this.pause(); };
      this.onHidden = () => { if (document.hidden) this.onBlur(); };
      canvas.addEventListener('pointerdown', this.down);
      canvas.addEventListener('pointermove', this.move);
      canvas.addEventListener('pointerup', this.up);
      canvas.addEventListener('pointercancel', this.up);
      canvas.addEventListener('lostpointercapture', this.up);
      window.addEventListener('blur', this.onBlur);
      document.addEventListener('visibilitychange', this.onHidden);
      this.observer = new ResizeObserver(this.resize); this.observer.observe(canvas);
      this.resize(); this.raf = requestAnimationFrame(this.frame);
      if (new URLSearchParams(location.search).get('qa') === '1') this.installQA();
    }
    resize() {
      const b = this.canvas.getBoundingClientRect();
      const oldW = this.w || b.width, oldH = this.h || b.height;
      this.w = Math.max(1, b.width); this.h = Math.max(1, b.height);
      const dpr = Math.min(devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(this.w * dpr); this.canvas.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (oldW !== this.w || oldH !== this.h) {
        for (const o of [...this.objects, ...this.parts]) { o.x *= this.w / oldW; o.y *= this.h / oldH; o.vx *= this.w / oldW; o.vy *= this.h / oldH; }
        this.up();
        if (this.state === 'playing') this.pause();
      }
    }
    snapshot() {
      return { state: this.state, mode: this.mode, score: this.score, best: this.best[this.mode],
        combo: this.combo, maxCombo: this.maxCombo, sliced: this.sliced, lives: this.lives,
        timeLeft: this.timeLeft, elapsed: this.elapsed, frozen: this.frozen > 0, double: this.double > 0 };
    }
    emit() { this.callbacks.onUpdate?.(this.snapshot()); }
    start(mode = 'classic') {
      this.mode = Object.hasOwn(modes, mode) ? mode : 'classic';
      this.state = 'playing'; this.score = 0; this.sliced = 0; this.combo = 0; this.maxCombo = 0;
      this.lives = 3; this.elapsed = 0; this.timeLeft = modes[this.mode];
      this.objects = []; this.parts = []; this.particles = []; this.splats = []; this.labels = [];
      this.up(); this.nextWave = .65; this.wave = 0; this.lastHit = -10; this.invulnerable = 0;
      this.frozen = 0; this.double = 0; this.flash = 0; this.shake = 0; this.manual = false;
      this.lastFrame = performance.now(); this.sound.unlock(); this.sound.play('start'); this.emit();
    }
    pause() {
      if (this.state !== 'playing') return;
      this.state = 'paused'; this.up(); this.emit(); this.callbacks.onPause?.(this.snapshot());
    }
    resume() { if (this.state !== 'paused') return; this.up(); this.lastFrame = performance.now(); this.state = 'playing'; this.sound.unlock(); this.emit(); }
    home() { this.state = 'idle'; this.objects = []; this.parts = []; this.particles = []; this.labels = []; this.up(); this.emit(); }
    end() {
      if (this.state !== 'playing') return;
      this.state = 'ended'; this.up(); this.saveBest(); this.sound.play('end'); this.emit(); this.callbacks.onEnd?.(this.snapshot());
    }
    saveBest() {
      if (this.score <= this.best[this.mode]) return;
      this.best[this.mode] = this.score;
      try { localStorage.setItem('vegetable-ninja.best.' + this.mode, String(this.score)); } catch { /* Session record still works. */ }
    }
    setMuted(value) { this.sound.muted = Boolean(value); if (!value) this.sound.unlock(); }
    position(e) { const b = this.canvas.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }
    down(e) {
      if (this.state !== 'playing' || this.pointer !== null || e.button > 0) return;
      e.preventDefault(); this.sound.unlock(); this.pointer = e.pointerId;
      this.previous = this.position(e); this.trail = [{ ...this.previous, life: .15 }];
      try { this.canvas.setPointerCapture(e.pointerId); } catch { /* Window cancellation resets the stroke. */ }
    }
    move(e) {
      if (this.state !== 'playing' || e.pointerId !== this.pointer) return;
      if (e.pointerType === 'mouse' && !(e.buttons & 1)) { this.up(); return; }
      e.preventDefault();
      const events = e.getCoalescedEvents?.();
      for (const event of events?.length ? events : [e]) {
        const p = this.position(event), a = this.previous;
        if (!a) { this.previous = p; continue; }
        if (Math.hypot(p.x - a.x, p.y - a.y) > 3) this.slice(a, p);
        this.trail.push({ ...p, life: .15 }); this.trail = this.trail.slice(-32); this.previous = p;
      }
    }
    up(e) {
      if (e && e.pointerId !== this.pointer) return;
      const id = this.pointer; this.pointer = null; this.previous = null; this.trail = [];
      if (id !== null && this.canvas.hasPointerCapture?.(id)) { try { this.canvas.releasePointerCapture(id); } catch {} }
    }
    spawn(spec = {}) {
      const r = clamp(Math.min(this.w, this.h) * .073, 27, 47);
      const g = this.h * 1.1;
      const top = Math.max(110, this.h * rand(.25, .45));
      const o = { id: ++this.seq, type: Math.floor(rand(0, 6)), kind: 'veg', r,
        x: rand(this.w * .22, this.w * .78), y: this.h + r * 1.5,
        vx: rand(-.13, .13) * this.w, vy: -Math.sqrt(2 * g * (this.h + r * 1.5 - top)),
        angle: rand(-.7, .7), spin: rand(-1.2, 1.2), hit: false, entered: false, ...spec };
      this.objects.push(o); return o;
    }
    spawnWave() {
      this.wave++;
      const count = this.wave < 3 ? 3 : Math.min(6, 3 + Math.floor(this.elapsed / 20) + (Math.random() > .6 ? 1 : 0));
      const center = rand(.35, .65) * this.w;
      for (let i = 0; i < count; i++) {
        const spread = Math.min(this.w * .125, 95);
        this.spawn({ type: (this.wave + i) % 6, x: clamp(center + (i - (count - 1) / 2) * spread, 48, this.w - 48), y: this.h + 70 + i * 15 });
      }
      if (this.mode !== 'zen' && this.elapsed > 5 && Math.random() < .58) {
        this.spawn({ kind: 'bomb', x: center > this.w / 2 ? this.w * .15 : this.w * .85, vx: center > this.w / 2 ? this.w * .09 : -this.w * .09, r: clamp(Math.min(this.w, this.h) * .062, 25, 39) });
      }
      if (this.mode === 'arcade' && this.wave % 4 === 0) this.spawn({ kind: this.wave % 8 === 0 ? 'double' : 'freeze', x: this.w * .5, r: 30 });
    }
    slice(a, b) {
      if (this.state !== 'playing') return;
      const theta = Math.atan2(b.y - a.y, b.x - a.x);
      for (const o of this.objects) {
        if (o.hit || o.y > this.h + o.r || segmentDistance(o.x, o.y, a.x, a.y, b.x, b.y) > o.r + 7) continue;
        o.hit = true;
        if (o.kind === 'bomb') {
          if (this.invulnerable <= 0) {
            this.invulnerable = 1; this.combo = 0; this.lastHit = -10; this.flash = .3; this.shake = this.reduced ? 0 : .25;
            if (this.mode === 'classic') this.lives = Math.max(0, this.lives - 1);
            else this.score = Math.max(0, this.score - 50);
            this.label(this.mode === 'classic' ? '−1' : '−50', o.x, o.y, '#ff9d85', 38);
            this.burst(o, '#ffb442', 36); this.sound.play('bomb');
          }
          if (this.lives <= 0 && this.mode === 'classic') { this.objects = this.objects.filter(item => !item.hit); this.end(); return; }
          continue;
        }
        if (o.kind !== 'veg') {
          if (o.kind === 'freeze') this.frozen = 5; else this.double = 6;
          this.label(o.kind === 'freeze' ? '❄ 5s' : '×2 6s', o.x, o.y, o.kind === 'freeze' ? '#a8f7ff' : '#ffe891', 32);
          this.burst(o, o.kind === 'freeze' ? '#a8f7ff' : '#ffe891', 22); this.sound.play('slice', 7); continue;
        }
        this.combo = this.elapsed - this.lastHit < .45 ? this.combo + 1 : 1;
        this.lastHit = this.elapsed; this.maxCombo = Math.max(this.maxCombo, this.combo); this.sliced++;
        const points = (10 + (this.combo >= 3 ? this.combo * 5 : 0)) * (this.double > 0 ? 2 : 1);
        this.score += points; this.saveBest();
        this.label('+' + points, o.x, o.y - o.r, COLORS[o.type], 24);
        if (this.combo >= 3) this.label(this.combo + ' COMBO', this.w / 2, this.h * .29, '#ffe3a2', clamp(this.w * .06, 27, 48), true);
        this.sound.play('slice', this.combo); this.burst(o, COLORS[o.type], this.reduced ? 12 : 26);
        const nx = -Math.sin(theta), ny = Math.cos(theta);
        for (const side of [-1, 1]) {
          this.parts.push({ ...o, x: o.x + nx * side * 5, y: o.y + ny * side * 5,
            vx: o.vx + nx * side * 150, vy: o.vy * .25 + ny * side * 100 - 80,
            side, cut: theta - o.angle, spin: side * rand(1.7, 3.6), life: 1.6 });
        }
        this.splats.push({ x: o.x, y: o.y, color: COLORS[o.type], r: o.r * .8, life: 7, angle: rand(0, TAU) });
      }
      this.objects = this.objects.filter(o => !o.hit); this.parts = this.parts.slice(-42); this.splats = this.splats.slice(-24);
      this.emit();
    }
    label(text, x, y, color, size, combo = false) {
      if (combo) this.labels = this.labels.filter(l => !l.combo);
      this.labels.push({ text, x, y, color, size, combo, life: combo ? .8 : .7, maxLife: combo ? .8 : .7 });
      this.labels = this.labels.slice(-14);
    }
    burst(o, color, count) {
      for (let i = 0; i < count; i++) {
        const a = rand(0, TAU), v = rand(60, 370);
        this.particles.push({ x: o.x, y: o.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80,
          color, r: rand(2, 7), life: rand(.3, .9), angle: a, leaf: i % 5 === 0 });
      }
      this.particles = this.particles.slice(-400);
    }
    step(dt) {
      this.elapsed += dt; this.timeLeft = Math.max(0, modes[this.mode] - this.elapsed);
      this.invulnerable = Math.max(0, this.invulnerable - dt);
      this.frozen = Math.max(0, this.frozen - dt); this.double = Math.max(0, this.double - dt);
      const speed = this.frozen > 0 ? .45 : 1, physics = dt * speed, g = this.h * 1.1;
      if (this.timeLeft <= 0) { this.end(); return; }
      this.nextWave -= physics;
      if (this.nextWave <= 0 && !this.manual) { this.spawnWave(); this.nextWave = Math.max(.9, 1.65 - this.elapsed / 150); }
      let misses = 0;
      for (const o of this.objects) {
        o.x += o.vx * physics; o.y += o.vy * physics; o.vy += g * physics; o.angle += o.spin * physics;
        if (o.y < this.h - o.r) o.entered = true;
        if (o.x < o.r) { o.x = o.r; o.vx = Math.abs(o.vx); }
        if (o.x > this.w - o.r) { o.x = this.w - o.r; o.vx = -Math.abs(o.vx); }
        if (o.y > this.h + o.r * 2 && o.vy > 0) {
          o.hit = true;
          if (o.kind === 'veg' && o.entered && this.mode === 'classic') { misses++; this.label('×', o.x, this.h - 55, '#ff9680', 32); }
        }
      }
      this.objects = this.objects.filter(o => !o.hit);
      if (misses && this.mode === 'classic') { this.lives = Math.max(0, this.lives - misses); if (!this.lives) { this.end(); return; } }
      for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += g * dt; p.angle += p.spin * dt; p.life -= dt; }
      for (const p of this.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += g * .7 * dt; p.life -= dt; p.angle += dt * 3; }
      for (const p of this.splats) p.life -= dt;
      for (const p of this.labels) { p.life -= dt; p.y -= dt * (p.combo ? 12 : 65); }
      for (const p of this.trail) p.life -= dt;
      this.parts = this.parts.filter(p => p.life > 0 && p.y < this.h + 150);
      this.particles = this.particles.filter(p => p.life > 0);
      this.splats = this.splats.filter(p => p.life > 0);
      this.labels = this.labels.filter(p => p.life > 0);
      this.trail = this.trail.filter(p => p.life > 0);
      this.flash = Math.max(0, this.flash - dt); this.shake = Math.max(0, this.shake - dt);
      if (this.elapsed - this.lastHit > .5) this.combo = 0;
      this.emit();
    }
    frame(now) {
      if (this.state === 'destroyed') return;
      const elapsed = (now - (this.lastFrame || now)) / 1000; this.lastFrame = now;
      // A long renderer stall pauses fairly; it cannot consume lives off screen.
      if (this.state === 'playing' && elapsed > .3) this.pause();
      let remaining = Math.min(elapsed, .3);
      while (this.state === 'playing' && remaining > 0) {
        const dt = Math.min(remaining, .025); this.step(dt); remaining -= dt;
      }
      if (this.state !== 'paused') this.visualTime += Math.min(elapsed, .05);
      this.draw(); this.raf = requestAnimationFrame(this.frame);
    }
    vegetable(o, half = false) {
      const c = this.ctx, s = o.r * 3;
      c.save(); c.translate(o.x, o.y); c.rotate(o.angle);
      if (half) {
        c.globalAlpha = Math.min(1, o.life * 2); c.rotate(o.cut); c.beginPath();
        c.rect(-s, o.side < 0 ? -s : 0, s * 2, s); c.clip(); c.rotate(-o.cut);
      }
      c.shadowColor = '#00170c'; c.shadowBlur = 12; c.shadowOffsetY = 7;
      if (this.atlas.complete && this.atlas.naturalWidth) {
        const tw = this.atlas.naturalWidth / 3, th = this.atlas.naturalHeight / 2;
        c.drawImage(this.atlas, (o.type % 3) * tw, Math.floor(o.type / 3) * th, tw, th, -s / 2, -s / 2, s, s);
      } else {
        c.fillStyle = COLORS[o.type]; c.beginPath(); c.ellipse(0, 0, o.r, o.r * 1.15, 0, 0, TAU); c.fill();
      }
      c.restore();
      if (half) {
        c.save(); c.globalAlpha = Math.min(1, o.life * 2); c.translate(o.x, o.y); c.rotate(o.angle + o.cut);
        const flesh = c.createRadialGradient(-6, -3, 1, 0, 0, o.r * .7);
        flesh.addColorStop(0, FLESH[o.type]); flesh.addColorStop(.7, FLESH[o.type]); flesh.addColorStop(1, COLORS[o.type]);
        c.fillStyle = flesh; c.strokeStyle = COLORS[o.type]; c.lineWidth = 1.5;
        c.beginPath(); c.ellipse(0, o.side * 2, o.r * .62, 7, 0, 0, TAU); c.fill(); c.stroke();
        if (o.type === 0 || o.type === 3) {
          c.strokeStyle = o.type === 0 ? '#e58b31aa' : '#becd9d77'; c.lineWidth = .6;
          c.beginPath(); c.ellipse(0, o.side * 2, o.r * .25, 3, 0, 0, TAU); c.stroke();
          for (let i = 0; i < 17; i++) { const a = i * TAU / 17; c.beginPath(); c.moveTo(Math.cos(a) * o.r * .25, Math.sin(a) * 3 + o.side * 2); c.lineTo(Math.cos(a) * o.r * .56, Math.sin(a) * 6 + o.side * 2); c.stroke(); }
        } else {
          if (o.type === 2) { c.fillStyle = '#b63723'; c.beginPath(); c.ellipse(0, 1, o.r * .4, 3.5, 0, 0, TAU); c.fill(); }
          c.fillStyle = o.type === 2 ? '#f9dd97' : '#b79e69';
          for (let i = -3; i <= 3; i++) { c.beginPath(); c.ellipse(i * o.r * .13, Math.sin(i * 2) * 2, 1.2, 1.9, .5, 0, TAU); c.fill(); }
        }
        c.restore();
      }
    }
    special(o) {
      const c = this.ctx, bomb = o.kind === 'bomb', r = o.r;
      c.save(); c.translate(o.x, o.y); c.rotate(o.angle);
      c.shadowBlur = bomb ? 14 : 24; c.shadowColor = bomb ? '#ff5a2c' : o.kind === 'freeze' ? '#52edff' : '#ffd058';
      const g = c.createRadialGradient(-r * .3, -r * .4, 2, 0, 0, r);
      g.addColorStop(0, bomb ? '#637675' : '#fbfff3');
      g.addColorStop(.35, bomb ? '#263b39' : o.kind === 'freeze' ? '#75e5f6' : '#fce28c');
      g.addColorStop(1, bomb ? '#071914' : o.kind === 'freeze' ? '#176c9c' : '#ae691c');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
      c.strokeStyle = bomb ? '#f27948' : '#e5ffef'; c.lineWidth = 2; c.stroke(); c.shadowBlur = 0;
      if (bomb) {
        c.fillStyle = '#b7a787'; c.fillRect(-8, -r - 6, 16, 10);
        c.strokeStyle = '#dbcba4'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -r - 5); c.quadraticCurveTo(3, -r - 24, 16, -r - 20); c.stroke();
        c.save(); c.translate(16, -r - 20); c.rotate(this.visualTime * 5);
        c.strokeStyle = '#ffce71'; c.lineWidth = 2;
        for (let i = 0; i < 7; i++) { c.rotate(TAU / 7); c.beginPath(); c.moveTo(4, 0); c.lineTo(10 + Math.sin(this.visualTime * 30) * 3, 0); c.stroke(); }
        c.restore();
        c.strokeStyle = '#ffc6a0'; c.lineWidth = 3.5; c.lineCap = 'round';
        c.beginPath(); c.moveTo(-9, -9); c.lineTo(9, 9); c.moveTo(9, -9); c.lineTo(-9, 9); c.stroke();
      } else {
        c.fillStyle = '#043737'; c.font = 'bold 26px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o.kind === 'freeze' ? '❄' : '×2', 0, 1);
      }
      c.restore();
    }
    draw() {
      const c = this.ctx; c.clearRect(0, 0, this.w, this.h); c.save();
      if (this.shake > 0) c.translate(rand(-4, 4), rand(-4, 4));
      if (!this.reduced) {
        for (let i = 0; i < 22; i++) {
          const x = (i * 179.3 + Math.sin(this.visualTime * .3 + i) * 27) % this.w;
          const y = (i * 113 + this.visualTime * (5 + i % 4)) % this.h;
          c.fillStyle = `rgba(255,223,135,${.15 + Math.sin(this.visualTime + i) * .09})`;
          c.beginPath(); c.arc(x, y, 1 + i % 3 * .4, 0, TAU); c.fill();
        }
      }
      for (const s of this.splats) {
        c.save(); c.translate(s.x, s.y); c.rotate(s.angle); c.globalAlpha = .15 * Math.min(1, s.life / 2); c.fillStyle = s.color;
        c.beginPath();
        for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU, r = s.r * (.6 + .28 * Math.sin(i * 7.2)); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        c.closePath(); c.fill(); c.restore();
      }
      for (const o of this.parts) this.vegetable(o, true);
      for (const o of this.objects) o.kind === 'veg' ? this.vegetable(o) : this.special(o);
      for (const p of this.particles) {
        c.save(); c.globalAlpha = Math.min(1, p.life * 2); c.translate(p.x, p.y); c.rotate(p.angle);
        c.fillStyle = p.color; c.beginPath(); c.ellipse(0, 0, p.r, p.leaf ? p.r * 2.2 : p.r * .7, 0, 0, TAU); c.fill();
        c.fillStyle = '#fff5c7'; c.globalAlpha *= .55; c.beginPath(); c.arc(-p.r * .2, -p.r * .2, p.r * .3, 0, TAU); c.fill(); c.restore();
      }
      if (this.trail.length > 1) {
        c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
        for (let i = 1; i < this.trail.length; i++) {
          const a = this.trail[i - 1], b = this.trail[i], opacity = clamp(b.life / .15, 0, 1);
          c.globalAlpha = opacity; c.shadowColor = '#ffca63'; c.shadowBlur = this.reduced ? 0 : 16;
          c.strokeStyle = '#ffb73e'; c.lineWidth = 9 * opacity; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
          c.shadowBlur = 0; c.strokeStyle = '#fffce9'; c.lineWidth = 3 * opacity; c.stroke();
        }
        c.restore();
      }
      for (const p of this.labels) {
        c.save(); c.globalAlpha = Math.min(1, p.life * 4); c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = `900 ${p.size}px "Trebuchet MS", sans-serif`; c.lineWidth = 5; c.strokeStyle = '#153325'; c.strokeText(p.text, p.x, p.y);
        c.fillStyle = p.color; c.fillText(p.text, p.x, p.y); c.restore();
      }
      if (this.frozen > 0) { c.strokeStyle = '#7bddff77'; c.lineWidth = 8; c.strokeRect(4, 4, this.w - 8, this.h - 8); }
      if (this.flash > 0 && !this.reduced) { c.fillStyle = `rgba(255,115,65,${this.flash * .45})`; c.fillRect(0, 0, this.w, this.h); }
      c.restore();
    }
    installQA() {
      window.__ninjaQA = Object.freeze({ snapshot: () => ({ ...this.snapshot(), objects: this.objects.map(o => ({ ...o })), parts: this.parts.length, particles: this.particles.length, w: this.w, h: this.h }),
        spawn: spec => { this.manual = true; return this.spawn(spec).id; }, clear: () => { this.manual = true; this.objects = []; },
        setTime: v => { this.elapsed = modes[this.mode] - v; }, setLives: v => { this.lives = v; },
        step: dt => { if (this.state === 'playing') this.step(dt); }, end: () => this.end(), pause: () => this.pause() });
    }
    destroy() {
      this.state = 'destroyed'; cancelAnimationFrame(this.raf); this.observer.disconnect(); this.sound.close();
      this.canvas.removeEventListener('pointerdown', this.down); this.canvas.removeEventListener('pointermove', this.move);
      for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) this.canvas.removeEventListener(name, this.up);
      window.removeEventListener('blur', this.onBlur); document.removeEventListener('visibilitychange', this.onHidden);
    }
  }
  window.VegetableNinjaEngine = VegetableNinjaEngine;
  window.VegetableNinjaMath = Object.freeze({ segmentDistance });
})();
