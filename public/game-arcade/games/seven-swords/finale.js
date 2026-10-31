/* Seven Swords v9 · the final alliance is a one-time, playable story event.
   This staging follows the user-approved story outline. Camera blocking,
   dialogue and visual choreography are adaptations, not verified quotations. */
(function () {
  'use strict';
  const TAU = Math.PI * 2, ISO_X = Math.sqrt(3) / 2;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const mix = (a, b, u) => a + (b - a) * u;
  const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const v = (x, y, z = 0) => ({ x, y, z });
  const add = (a, b, s = 1) => v(a.x + b.x * s, a.y + b.y * s, a.z + b.z * s);
  const lerp = (a, b, u) => v(mix(a.x, b.x, u), mix(a.y, b.y, u), mix(a.z || 0, b.z || 0, u));
  const length = a => Math.hypot(a.x, a.y, a.z);
  const unit = a => { const n = length(a) || 1; return v(a.x / n, a.y / n, a.z / n); };
  const cross = (a, b) => v(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
  const fract = x => x - Math.floor(x);
  const hash = n => fract(Math.sin(n * 127.1 + 51.7) * 43758.5453);
  const cubic = (a, b, c, d, u) => {
    const k = 1 - u;
    return v(k * k * k * a.x + 3 * k * k * u * b.x + 3 * k * u * u * c.x + u * u * u * d.x,
      k * k * k * a.y + 3 * k * k * u * b.y + 3 * k * u * u * c.y + u * u * u * d.y,
      k * k * k * a.z + 3 * k * k * u * b.z + 3 * k * u * u * c.z + u * u * u * d.z);
  };
  const CAST = Object.freeze([
    { id: 'hongmao', name: '虹猫', sword: '长虹', color: '#ffb16b' },
    { id: 'lantu', name: '蓝兔', sword: '冰魄', color: '#a4ebff' },
    { id: 'doudou', name: '逗逗', sword: '雨花', color: '#cbe89d' },
    { id: 'daben', name: '大奔', sword: '奔雷', color: '#ffd886' },
    { id: 'tiaotiao', name: '跳跳', sword: '青光', color: '#83e9d2' },
    { id: 'dada', name: '达达', sword: '旋风', color: '#ddf0ce' },
    { id: 'masanniang', name: '马三娘', sword: '紫云', color: '#c39dec' }
  ]);
  const VIEWPOINTS = CAST.slice(0, 6).map(a => a.id);
  const END = 22.4, FIRE_AT = 10.85, FIRE_DURATION = 3.05;
  const FORMATION_GATE = 2.8, RELEASE_GATE = 4.65;
  const MOVE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
  const MA_PATHS = new Map();
  const PHASES = Object.freeze([
    { at: 0, end: 3, name: '七剑集阵', speaker: 'viewpoint' },
    { at: 3, end: 6.5, name: '七剑合璧', speaker: '虹猫' },
    { at: 6.5, end: 10, name: '紫云留力', speaker: '马三娘' },
    { at: 10, end: 14.8, name: '火舞破局', speaker: '虹猫' },
    { at: 14.8, end: 17.9, name: '魔教首领陨落', speaker: 'viewpoint' },
    { at: 17.9, end: END, name: '剑心未歇', speaker: 'viewpoint' }
  ]);
  const LINES = {
    hongmao: ['诸位，护卫已清。列阵，合璧！', '黑心虎……终于倒下了。', '大家先调息……莎丽来了！'],
    lantu: ['冰魄就位。虹猫，我们一同守住这片山林。', '总算……护住大家了。', '气力虽尽，剑心未歇。看，是莎丽！'],
    doudou: ['雨花就位！大家稳住气息，我跟得上。', '别硬撑着站起来……先调息。', '我守着大家。莎丽赶到了！'],
    daben: ['奔雷在此！这一回，俺定守住大伙。', '黑心虎败了……总算没辜负大伙。', '俺还撑得住！莎丽，这边！'],
    tiaotiao: ['青光就位。忍到今日，总算能与诸位并肩！', '藏了这么多年的这一剑，终于落定。', '马三娘竟还有余力……莎丽来了！'],
    dada: ['旋风就位。这一剑，为亲人，也为山河。', '风声渐息……这片山林保住了。', '先护住伤者。莎丽已经到了。']
  };
  const CSS = [
    '.ss-combat.ss-finale-playing .ss-c-player,.ss-combat.ss-finale-playing .ss-c-location,.ss-combat.ss-finale-playing .ss-c-boss,.ss-combat.ss-finale-playing .ss-c-guide,.ss-combat.ss-finale-playing .ss-c-controls,.ss-combat.ss-finale-playing .ss-c-joy,.ss-combat.ss-finale-playing .ss-c-chain,.ss-combat.ss-finale-playing .ss-c-toast{visibility:hidden;pointer-events:none}',
    '.ss-finale-ui{position:absolute;inset:0;z-index:9;pointer-events:none;color:#f6eed8;font-family:"PingFang SC","Microsoft YaHei",sans-serif}',
    '.ss-finale-ui[hidden]{display:none}.ss-finale-heading{position:absolute;left:25px;top:19px;max-width:68%;text-shadow:0 2px 8px #112326}',
    '.ss-finale-eyebrow{font-size:10px;letter-spacing:4px;color:#e5c58a}.ss-finale-heading h2{font:600 24px "Songti SC","STSong",serif;letter-spacing:4px;margin:6px 0}',
    '.ss-finale-viewpoint{font-size:11px;letter-spacing:1px;color:#e0e8d9}.ss-finale-viewpoint b{color:#ffdf9e;font-weight:600}',
    '.ss-finale-dialogue{position:absolute;left:50%;bottom:20px;transform:translateX(-50%);width:min(880px,calc(100% - 40px));padding:15px 19px 13px;border:1px solid #bda56a8c;border-radius:7px;background:linear-gradient(110deg,#112c2feb,#1d3330f2);box-shadow:0 10px 45px #061b2566,inset 0 0 0 3px #dcc98b0a;pointer-events:auto}',
    '.ss-finale-speaker{font:600 17px "Songti SC","STSong",serif;letter-spacing:3px;color:var(--speaker,#ecd09c);margin:0 0 7px}.ss-finale-line{font-size:14px;line-height:1.75;letter-spacing:.5px;margin:0}',
    '.ss-finale-context{margin:6px 0 0;font-size:11px;line-height:1.65;color:#b6c9bb;letter-spacing:.4px;min-height:18px}',
    '.ss-finale-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px}.ss-finale-beats{display:flex;gap:7px;align-items:center}.ss-finale-beats i{width:22px;height:2px;display:block;background:#79958666}.ss-finale-beats i[data-done="true"]{background:#e4c487}.ss-finale-actions{display:flex;gap:10px;align-items:center}',
    '.ss-finale-ui button{font:inherit;font-size:11px;border:1px solid #bda56a82;border-radius:4px;padding:8px 13px;color:#f2ddb2;background:#365146;cursor:pointer;touch-action:manipulation}.ss-finale-ui button[data-finale="skip"]{background:transparent;color:#c6d4c7;border-color:#9bb6a33b}.ss-finale-ui button:hover{background:#4c6450}.ss-finale-ui button:focus-visible{outline:2px solid #ffe1a5;outline-offset:3px}.ss-finale-ui button:disabled{opacity:.4;cursor:default}',
    '@media(max-width:640px){.ss-finale-heading{left:15px;top:17px;max-width:63%}.ss-finale-heading h2{font-size:20px;letter-spacing:3px}.ss-finale-eyebrow{font-size:9px;letter-spacing:2px}.ss-finale-viewpoint{font-size:10px}.ss-finale-dialogue{width:calc(100% - 24px);bottom:14px;padding:13px 13px 11px}.ss-finale-speaker{font-size:15px;margin-bottom:5px}.ss-finale-line{font-size:12px;line-height:1.7}.ss-finale-context{font-size:10px}.ss-finale-footer{gap:6px}.ss-finale-beats{gap:5px}.ss-finale-beats i{width:14px}.ss-finale-actions{gap:6px}.ss-finale-ui button{font-size:10px;padding:8px 10px}}',
    '@media(max-height:480px){.ss-finale-heading{top:12px}.ss-finale-heading h2{font-size:18px}.ss-finale-viewpoint{font-size:9px}.ss-finale-dialogue{bottom:9px;padding:9px 14px;width:min(800px,calc(100% - 32px))}.ss-finale-speaker{font-size:14px;margin-bottom:3px}.ss-finale-line{font-size:11px}.ss-finale-context{font-size:9px;margin-top:3px}.ss-finale-footer{margin-top:5px}.ss-finale-ui button{padding:5px 10px}}',
    '@media(min-width:700px) and (max-height:480px){.ss-finale-dialogue{left:auto;right:14px;bottom:14px;transform:none;width:min(330px,39%);padding:14px}.ss-finale-speaker{font-size:15px;margin-bottom:7px}.ss-finale-line{font-size:12px;line-height:1.8}.ss-finale-context{font-size:10px;line-height:1.75;margin-top:8px}.ss-finale-footer{margin-top:13px;gap:5px}.ss-finale-beats{gap:5px}.ss-finale-beats i{width:12px}.ss-finale-actions{gap:6px}.ss-finale-ui button{font-size:10px;padding:7px 9px}}',
    '.ss-finale-coop[hidden],.ss-finale-coop button[hidden]{display:none}.ss-finale-coop{margin-top:11px;border-top:1px solid #acbf9433;padding-top:10px;--own:#e9c485}.ss-finale-steps{display:flex;gap:8px;margin:0 0 8px;padding:0;list-style:none}.ss-finale-steps li{flex:1;font-size:10px;color:#92a99b;border-bottom:2px solid #718f7955;padding-bottom:6px;letter-spacing:1px}.ss-finale-steps li[data-current="true"]{color:#fff0c9;border-color:var(--own)}.ss-finale-steps li[data-done="true"]{color:#c9dcb8;border-color:#a3c284}',
    '.ss-finale-meter-row{display:flex;gap:12px;align-items:center;font-size:10px;color:#cddbcc}.ss-finale-meter{position:relative;height:6px;flex:1;background:#071e24;border-radius:9px;overflow:hidden;border:1px solid #9bb5a544}.ss-finale-meter>i{display:block;height:100%;width:0;background:linear-gradient(90deg,#789779,var(--own));box-shadow:0 0 9px var(--own);border-radius:9px}.ss-finale-meter-row b{min-width:32px;font-weight:500;text-align:right;font-variant-numeric:tabular-nums}.ss-finale-coop-actions{display:flex;gap:9px;align-items:center;margin-top:10px}.ss-finale-ui .ss-finale-coop-actions button{min-height:40px;flex:1;touch-action:none;user-select:none;font-size:12px;background:#375947;border-color:#a5bd8870}.ss-finale-ui .ss-finale-coop-actions button[data-held="true"]{background:#708359;box-shadow:0 0 17px #c5dc8955}.ss-finale-ui .ss-finale-coop-actions button[data-finale="release"]{background:linear-gradient(110deg,#675b35,#446947);border-color:#dfc879;color:#fff0c9}.ss-finale-coop kbd{font:600 10px sans-serif;display:inline-block;padding:2px 5px;margin-right:6px;border:1px solid #c1d0b955;border-radius:3px;color:#f6ead0}.ss-finale-feedback{margin:7px 0 0;font-size:10px;min-height:15px;color:#cadbbb;line-height:1.5}.ss-finale-ui[data-cooperating="true"] .ss-finale-context{display:none}.ss-finale-ui[data-cooperating="true"] .ss-finale-beats{display:none}.ss-finale-ui[data-cooperating="true"] .ss-finale-footer{justify-content:flex-end;margin-top:6px}.ss-finale-ui[data-cooperating="true"] .ss-finale-line{font-size:12px}',
    '.ss-finale-sync{display:none;position:relative;flex:1;height:12px;border:1px solid #91ad8059;border-radius:10px;background:#0b272b;overflow:hidden}.ss-finale-sync:before{content:"";position:absolute;top:0;bottom:0;left:37%;width:26%;background:#d8d38a42;border-left:1px solid #d8d38a;border-right:1px solid #d8d38a}.ss-finale-sync>i{position:absolute;top:0;bottom:0;width:3px;background:#fff5bf;box-shadow:0 0 8px #fff4b7;left:50%}.ss-finale-coop[data-stage="release"] .ss-finale-sync{display:block}.ss-finale-coop[data-stage="release"] .ss-finale-meter{display:none}',
    '@media(max-width:640px){.ss-finale-coop{margin-top:9px;padding-top:8px}.ss-finale-steps{gap:6px;margin-bottom:8px}.ss-finale-steps li{font-size:9px;letter-spacing:.5px;padding-bottom:5px}.ss-finale-ui .ss-finale-coop-actions button{min-height:42px;font-size:11px;padding:7px 9px}.ss-finale-coop-actions{gap:7px;margin-top:9px}.ss-finale-feedback{font-size:9px}.ss-finale-ui[data-cooperating="true"] .ss-finale-line{font-size:11px;line-height:1.7}.ss-finale-coop kbd{font-size:9px;margin-right:4px}}',
    '@media(min-width:700px) and (max-height:480px){.ss-finale-ui[data-cooperating="true"] .ss-finale-dialogue{max-height:calc(100% - 98px);overflow:auto}.ss-finale-coop{margin-top:9px;padding-top:8px}.ss-finale-ui .ss-finale-coop-actions button{min-height:38px;font-size:10px;padding:6px}.ss-finale-ui[data-cooperating="true"] .ss-finale-line{font-size:11px}.ss-finale-feedback{font-size:9px}}'
  ].join('');

  class Finale {
    constructor(combat, config) {
      this.c = combat;
      this.config = Object.assign({}, config);
      // Route identity is never replaced, including when Hongmao takes the shot.
      this.viewpoint = combat.hero.id;
      this.viewer = CAST.find(a => a.id === this.viewpoint);
      this.active = false; this.complete = false; this.started = false;
      this.disposed = false; this.settled = false; this.time = 0;
      this.phase = 0; this.lastPhase = -1; this.listeners = [];
      // This clock animates the living formation while the story waits for
      // player input. No deadlines, HP loss, or progress loss are attached.
      this.clock = 0; this.inputKeys = new Set(); this.chargePointer = null;
      this.interaction = { stage: 'position', positioned: false, charge: 0, released: false,
        walkTo: null, intent: false, moved: false, assistAt: -20, slashAt: -20,
        note: '', noteUntil: 0, quality: null, contributions: 0 };
      this.inputCues = [];
      this.center = v(430, 335, 0);
      this.bossTarget = v(735, 185, 0);
      this.focus = v(430, 335, 158);
      this.actors = [];
      this.fx = window.SwordFX && window.SwordFX.create ? window.SwordFX.create(combat) : null;
      this.stats = { primitives: 0, vertices: 0, actors: 7, effects: 0 };
    }
    guardBossDamage(enemy, damage) {
      const n = Number.isFinite(damage) ? Math.max(0, damage) : 0;
      if (enemy !== this.c.boss) return n;
      if (this.active || this.complete) return 0;
      const floor = Math.max(1, enemy.maxHp * .2);
      return Math.max(0, Math.min(n, enemy.hp - floor));
    }
    tryStart() {
      const c = this.c, boss = c.boss;
      if (this.started || this.complete || this.disposed || c.paused || c.ended || c.destroyed || !boss || boss.dead || boss.spawn > 0 || c.p.hp <= 0) return false;
      if (c.spawned < c.total || c.enemies.some(e => e !== boss && !e.dead)) return false;
      if (boss.hp > Math.max(1, boss.maxHp * .2) + .01) return false;
      this.started = true; this.active = true;
      this.savedCamera = Object.assign({}, c.camera);
      this.bossStart = v(boss.x, boss.y);
      this.bossActor = Object.assign({}, boss, { dead: false, spawn: 0, action: 0, hit: 0, stun: 0, slow: 0, trackVx: 0, trackVy: 0 });
      this.actors = CAST.map((a, i) => {
        const angle = -.65 + i * TAU / 7;
        const target = v(this.center.x + Math.cos(angle) * 185, this.center.y + Math.sin(angle) * 185);
        const start = a.id === this.viewpoint ? v(c.p.x, c.p.y, c.p.air || 0) : v(clamp(target.x + Math.cos(angle) * 145, 60, 900), clamp(target.y + Math.sin(angle) * 145, 95, 545));
        return Object.assign({}, a, { target, start, control: v(start.x, start.y), x: start.x, y: start.y, z: start.z, size: a.id === 'doudou' ? 116 : 127 });
      });
      if (c.clearInput) c.clearInput();
      this.makeUI();
      this.seek(0);
      if (c.tone) c.tone('skill');
      return true;
    }
    makeUI() {
      if (this.ui || !this.c.root) return;
      const d = this.c.root.ownerDocument || document;
      const ui = d.createElement('section');
      ui.className = 'ss-finale-ui';
      ui.setAttribute('aria-label', '七剑合璧协同终局，走入阵位，聚气后主动合璧');
      ui.setAttribute('data-cooperating', 'true');
      ui.innerHTML = '<style>' + CSS + '</style><header class="ss-finale-heading"><div class="ss-finale-eyebrow">终 章 · 天 子 山</div><h2>七剑合璧</h2><div class="ss-finale-viewpoint">你的视角 · <b></b></div></header>' +
        '<div class="ss-finale-dialogue"><div class="ss-finale-caption" aria-live="polite" aria-atomic="true"><h3 class="ss-finale-speaker"></h3><p class="ss-finale-line"></p><p class="ss-finale-context"></p></div>' +
        '<div class="ss-finale-coop" data-stage="position"><ol class="ss-finale-steps" aria-label="协同步骤"><li>① 走入阵位</li><li>② 注入剑意</li><li>③ 主动合璧</li></ol><div class="ss-finale-meter-row"><span class="ss-finale-meter-label"></span><div class="ss-finale-meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-label="你的协同进度"><i></i></div><div class="ss-finale-sync" aria-hidden="true"><i></i></div><b class="ss-finale-meter-value">0%</b></div><div class="ss-finale-coop-actions"><button type="button" data-finale="walk" aria-label="走向你自己的发光阵位"><kbd>WASD</kbd>前往阵位</button><button type="button" data-finale="charge" hidden aria-label="按住聚气。可按住 J 或长按此键，也可点按少量累积"><kbd>J</kbd>按住聚气</button><button type="button" data-finale="assist" hidden><kbd>Q</kbd><span>助阵剑招</span></button><button type="button" data-finale="release" hidden aria-label="主动释放七剑合璧，无失败惩罚"><kbd>E</kbd>七剑合璧</button></div><p class="ss-finale-feedback" role="status" aria-live="polite"></p></div>' +
        '<div class="ss-finale-footer"><div class="ss-finale-beats" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="ss-finale-actions"><button type="button" data-finale="skip" aria-label="跳过协同与终局剧情并完成本场决战">跳过合璧</button><button type="button" data-finale="next" aria-label="先完成协同再推进剧情">等待入阵</button></div></div></div>';
      this.c.root.appendChild(ui);
      this.c.root.classList.add('ss-finale-playing');
      this.ui = ui;
      this.dom = {
        heading: ui.querySelector('h2'),
        viewer: ui.querySelector('.ss-finale-viewpoint b'),
        speaker: ui.querySelector('.ss-finale-speaker'),
        line: ui.querySelector('.ss-finale-line'),
        context: ui.querySelector('.ss-finale-context'),
        next: ui.querySelector('[data-finale="next"]'),
        skip: ui.querySelector('[data-finale="skip"]'),
        beats: [...ui.querySelectorAll('.ss-finale-beats i')],
        coop: ui.querySelector('.ss-finale-coop'),
        steps: [...ui.querySelectorAll('.ss-finale-steps li')],
        meter: ui.querySelector('.ss-finale-meter'),
        meterFill: ui.querySelector('.ss-finale-meter>i'),
        meterLabel: ui.querySelector('.ss-finale-meter-label'),
        meterValue: ui.querySelector('.ss-finale-meter-value'),
        sync: ui.querySelector('.ss-finale-sync>i'),
        feedback: ui.querySelector('.ss-finale-feedback'),
        walk: ui.querySelector('[data-finale="walk"]'),
        charge: ui.querySelector('[data-finale="charge"]'),
        assist: ui.querySelector('[data-finale="assist"]'),
        release: ui.querySelector('[data-finale="release"]')
      };
      this.dom.viewer.textContent = this.viewer.name;
      this.dom.coop.style.setProperty('--own', this.viewer.color);
      this.dom.assist.querySelector('span').textContent = this.viewer.sword + '助阵';
      this.dom.assist.setAttribute('aria-label', '施展' + this.viewer.name + '的' + (this.c.skill && this.c.skill.name || this.viewer.sword + '剑法') + '，注入22点剑意，冷却1.6秒');
      const listen = (el, name, fn) => { el.addEventListener(name, fn); this.listeners.push([el, name, fn]); };
      listen(this.dom.next, 'click', () => this.advance());
      listen(this.dom.skip, 'click', () => this.skip());
      listen(this.dom.walk, 'click', () => this.walkToFormation());
      listen(this.dom.assist, 'click', () => this.assist());
      listen(this.dom.release, 'click', () => this.release());
      listen(this.dom.charge, 'pointerdown', e => {
        if (!this.canAct() || this.interaction.stage !== 'charge' || e.button > 0) return;
        e.preventDefault(); this.chargePointer = e.pointerId; this.lastChargePointerAt = this.clock;
        if (this.c.unlockSound) this.c.unlockSound();
        try { if (e.pointerId != null && this.dom.charge.setPointerCapture) this.dom.charge.setPointerCapture(e.pointerId); } catch (_) { /* Pointer remains tracked on window. */ }
      });
      listen(this.dom.charge, 'click', e => {
        // Keyboard / assistive activation can accumulate without a held key.
        if ((e.detail || 0) === 0 && (this.lastChargePointerAt == null || this.clock - this.lastChargePointerAt > .6)) this.chargeTap();
      });
      listen(window, 'keydown', e => {
        if (!this.canAct() || /INPUT|TEXTAREA|SELECT/.test(e.target && e.target.tagName || '')) return;
        const code = e.code;
        if (MOVE_KEYS.has(code) || code === 'KeyJ') {
          e.preventDefault(); this.inputKeys.add(code);
          if (this.c.unlockSound) this.c.unlockSound();
          return;
        }
        if (e.repeat) return;
        if (code === 'KeyQ') { e.preventDefault(); this.assist(); }
        else if (code === 'KeyE') { e.preventDefault(); this.release(); }
        else if (code === 'Enter' && (e.target && e.target.tagName) !== 'BUTTON') { e.preventDefault(); this.advance(); }
      });
      listen(window, 'keyup', e => this.inputKeys.delete(e.code));
      const releasePointer = e => {
        if (e.pointerId === this.chargePointer) { this.chargePointer = null; this.lastChargePointerAt = this.clock; }
      };
      listen(window, 'pointerup', releasePointer);
      listen(window, 'pointercancel', releasePointer);
      listen(this.dom.charge, 'lostpointercapture', releasePointer);
      listen(window, 'blur', () => this.clearInteractionInput());
      listen(d, 'visibilitychange', () => { if (d.hidden) this.clearInteractionInput(); });
      if (this.c.canvas) listen(this.c.canvas, 'pointerdown', e => {
        if (!this.canAct() || this.interaction.stage !== 'position' || this.interaction.positioned || e.button > 0 || !Number.isFinite(e.clientX + e.clientY)) return;
        e.preventDefault();
        const p = this.c.toWorld(e.clientX, e.clientY);
        this.setWalkTarget(p);
      });
      if (this.c.canvas && this.c.canvas.focus) this.c.canvas.focus({ preventScroll: true });
    }
    canAct() { const c = this.c; return this.active && !this.complete && !this.disposed && !c.paused && !c.ended && !c.destroyed; }
    clearInteractionInput() {
      this.inputKeys.clear(); this.chargePointer = null;
      this.interaction.walkTo = null; this.interaction.moved = false;
      if (this.dom) this.dom.charge.setAttribute('data-held', 'false');
    }
    chosenActor() { return this.actors.find(a => a.id === this.viewpoint); }
    setWalkTarget(p) {
      if (!this.canAct() || this.interaction.positioned || this.interaction.stage !== 'position' || !p || !Number.isFinite(p.x + p.y)) return false;
      this.interaction.walkTo = v(clamp(p.x, 60, 900), clamp(p.y, 85, 570));
      this.interaction.intent = true;
      if (this.c.unlockSound) this.c.unlockSound();
      return true;
    }
    walkToFormation() { const a = this.chosenActor(); return !!a && this.setWalkTarget(a.target); }
    inputCue(tier) {
      this.inputCues.push({ hero: this.viewpoint, tier, at: this.clock, duration: tier === 'q' ? 1.55 : .36 });
      this.inputCues = this.inputCues.slice(-5);
      this.interaction.slashAt = this.clock;
    }
    feedback(text, duration = 2.3) {
      this.interaction.note = text; this.interaction.noteUntil = this.clock + duration;
      this.updateInteractionUI();
    }
    addCharge(amount) {
      const state = this.interaction;
      state.charge = clamp(state.charge + amount, 0, 100);
      if (state.charge >= 100 && state.stage === 'charge') {
        state.stage = 'release'; this.clearInteractionInput();
        this.feedback(this.viewer.sword + '剑意已满。按 E 或点“七剑合璧”，由你引剑！', 4);
        this.updateDialogue();
        if (this.c.tone) this.c.tone('skill');
      }
    }
    chargeTap() {
      if (!this.canAct() || this.interaction.stage !== 'charge') return false;
      this.addCharge(12); this.inputCue('attack');
      if (this.interaction.stage === 'charge') this.feedback(this.viewer.sword + '剑意 +12 · 长按可持续注入');
      return true;
    }
    assist() {
      const state = this.interaction;
      if (!this.canAct() || state.stage !== 'charge' || this.clock - state.assistAt < 1.6) return false;
      state.assistAt = this.clock; state.contributions++;
      this.inputCue('q'); this.addCharge(22);
      if (this.c.tone) this.c.tone('skill');
      if (state.stage === 'charge') this.feedback((this.c.skill && this.c.skill.name || this.viewer.sword + '剑法') + ' · 剑意 +22');
      this.updateFX();
      return true;
    }
    release() {
      const state = this.interaction;
      if (!this.canAct() || state.stage !== 'release' || state.charge < 100 || this.time < RELEASE_GATE - .001) return false;
      const alignment = (Math.sin(this.clock * 1.65) + 1) / 2;
      state.quality = alignment >= .37 && alignment <= .63 ? 'resonant' : 'steady';
      state.released = true; state.stage = 'joined'; state.releaseAt = this.clock;
      this.clearInteractionInput(); this.inputCue('attack');
      this.feedback(state.quality === 'resonant' ? '剑心共鸣！' + this.viewer.name + '引剑，七剑合璧！' : this.viewer.name + '引剑——七剑合璧！', 2.4);
      this.updateDialogue(); this.updateFX();
      if (this.c.tone) this.c.tone('ult');
      return true;
    }
    updateInteraction(dt) {
      const state = this.interaction, a = this.chosenActor();
      state.moved = false;
      if (state.stage === 'position' && !state.positioned) {
        let dx = 0, dy = 0;
        if (this.inputKeys.has('KeyA') || this.inputKeys.has('ArrowLeft')) dx--;
        if (this.inputKeys.has('KeyD') || this.inputKeys.has('ArrowRight')) dx++;
        if (this.inputKeys.has('KeyW') || this.inputKeys.has('ArrowUp')) dy--;
        if (this.inputKeys.has('KeyS') || this.inputKeys.has('ArrowDown')) dy++;
        let direction;
        if (dx || dy) {
          state.walkTo = null; state.intent = true;
          direction = this.c.screenVectorToWorld(dx, dy);
        } else if (state.walkTo) {
          const delta = add(state.walkTo, a.control, -1), distance = Math.hypot(delta.x, delta.y);
          if (distance <= 210 * dt) { a.control = v(state.walkTo.x, state.walkTo.y); state.walkTo = null; }
          else direction = v(delta.x / distance, delta.y / distance);
        }
        if (direction) {
          a.control.x = clamp(a.control.x + direction.x * 210 * dt, 60, 900);
          a.control.y = clamp(a.control.y + direction.y * 210 * dt, 85, 570);
          a.moveDir = Math.atan2(direction.y, direction.x); state.moved = true;
        }
        if (state.intent && Math.hypot(a.control.x - a.target.x, a.control.y - a.target.y) <= 27) {
          a.control = v(a.target.x, a.target.y); state.positioned = true; state.positionedAt = this.clock;
          this.clearInteractionInput();
          this.feedback(this.viewer.name + '就位 · ' + this.viewer.sword + '阵眼已点亮');
          if (this.c.tone) this.c.tone('hit');
        }
      }
      if (state.stage === 'position' && state.positioned && this.time >= FORMATION_GATE - .001) {
        state.stage = 'charge'; this.updateDialogue();
      }
      if (state.stage === 'charge' && (this.inputKeys.has('KeyJ') || this.chargePointer != null)) {
        this.addCharge(19 * dt);
        if (this.clock - state.slashAt >= .62) this.inputCue('attack');
      }
      this.inputCues = this.inputCues.filter(cue => this.clock - cue.at < cue.duration);
    }
    storyLimit() { return !this.interaction.positioned ? FORMATION_GATE : !this.interaction.released ? RELEASE_GATE : END; }
    update(dt) {
      if (!this.canAct() || !Number.isFinite(dt) || dt <= 0) return;
      this.clock += dt;
      this.updateInteraction(dt);
      this.seek(Math.min(END, this.time + dt));
      this.updateInteractionUI();
      if (this.time >= END) this.finalize(false);
    }
    advance() {
      if (!this.canAct()) return false;
      if (!this.interaction.released) return false;
      const next = PHASES[this.phase].end;
      this.seek(next);
      if (next >= END) this.finalize(false);
      return true;
    }
    skip() {
      if (!this.canAct()) return false;
      this.clearInteractionInput();
      Object.assign(this.interaction, { positioned: true, released: true, stage: 'joined', bypassed: true });
      this.seek(END, true);
      return this.finalize(true);
    }
    seek(time, bypass = false) {
      this.time = clamp(time, 0, bypass ? END : this.storyLimit());
      this.phase = Math.min(PHASES.length - 1, PHASES.filter(p => this.time >= p.at).length - 1);
      this.updateActors();
      this.updateCamera();
      this.updateFX();
      if (this.phase !== this.lastPhase) {
        if (this.lastPhase >= 0 && this.c.tone) this.c.tone(this.phase === 3 ? 'ult' : this.phase === 4 ? 'hit' : 'skill');
        this.lastPhase = this.phase;
        this.updateDialogue();
      }
    }
    updateActors() {
      const t = this.time, anim = this.clock, join = smooth(0, 2.6, t), own = this.interaction;
      for (let i = 0; i < this.actors.length; i++) {
        const a = this.actors[i];
        const walk = smooth(i === 0 ? 0 : .15 + i * .045, 2.4 + i * .04, t);
        const controlled = a.id === this.viewpoint && !own.positioned;
        const pos = controlled ? a.control : a.id === this.viewpoint ? a.target : lerp(a.start, a.target, walk);
        a.x = pos.x; a.y = pos.y; a.z = mix(a.start.z || 0, 0, walk);
        a.state = controlled ? own.moved ? 'walk' : 'idle' : walk < .995 && a.id !== this.viewpoint ? 'walk' : t < 3 ? 'idle' : t < 15.4 ? 'cast' : 'idle';
        a.phase = a.state === 'walk' ? fract(anim * 1.9 + i * .13) : a.state === 'cast' ? .47 + Math.sin(anim * 1.7 + i) * .075 : .25;
        a.dir = Math.atan2(this.focus.y - a.y, this.focus.x - a.x);
        if (controlled && own.moved) a.dir = a.moveDir;
        if (a.id === this.viewpoint && !own.released && own.positioned) {
          const cue = this.inputCues[this.inputCues.length - 1], age = cue ? anim - cue.at : 10;
          if (age < (cue && cue.tier === 'q' ? .7 : .36)) {
            a.state = cue.tier === 'q' ? 'cast' : 'attack';
            a.phase = cue.tier === 'q' ? .4 + Math.sin(age * Math.PI) * .2 : clamp(age / .36);
          } else a.state = own.stage === 'charge' && !(this.inputKeys.has('KeyJ') || this.chargePointer != null) ? 'idle' : 'cast';
        }
        a.exhaustion = a.id === 'masanniang' ? 0 : smooth(15.3, 17.3, t);
        a.tilt = a.exhaustion * (i % 2 ? -.13 : .13);
        if (a.id === 'masanniang') {
          // The impostor keeps her own horse silhouette and remains standing.
          a.state = t > 7.5 ? 'idle' : a.state;
          a.retaining = smooth(6.6, 8.9, t);
          const step = smooth(17.6, 20.2, t);
          a.x += step * 60; a.y += step * 44;
          a.dir = Math.atan2(this.bossTarget.y - a.y, this.bossTarget.x - a.x);
          if (step > 0 && step < 1) { a.state = 'walk'; a.phase = fract(t * 1.2); }
        }
        if (a.id === 'hongmao') {
          const step = smooth(10.15, 11.65, t);
          a.x += step * 63; a.y -= step * 20;
          const age = t - FIRE_AT;
          if (age >= 0 && age <= FIRE_DURATION) {
            a.state = 'attack'; a.phase = fract(age * 3.4);
            a.z = Math.sin(clamp(age / FIRE_DURATION) * Math.PI) * 30;
            a.dir = -.35 + age * TAU * (this.c.reducedMotion ? .3 : 1.3);
          }
        }
      }
      const bp = lerp(this.bossStart, this.bossTarget, join);
      const recoil = smooth(13, 15.2, t);
      this.bossActor.x = bp.x + recoil * 21;
      this.bossActor.y = bp.y - recoil * 15;
      this.bossActor.dir = Math.atan2(this.center.y - bp.y, this.center.x - bp.x);
      this.bossActor.action = t > 3 && t < 13.4 ? .32 : 0;
      this.bossActor.hit = t > 12.9 && t < 14.9 ? .08 : 0;
      this.arrival = null;
      if (t >= 18.5) {
        const arrive = smooth(18.5, 21.5, t), pos = lerp(v(850, 105), v(610, 137), arrive);
        this.arrival = { id: 'sali', name: '莎丽', x: pos.x, y: pos.y, z: 0,
          dir: Math.atan2(194 - pos.y, 494 - pos.x), alpha: smooth(18.5, 19.15, t),
          phase: fract(t * 1.7), state: arrive < .995 ? 'walk' : 'idle' };
      }
    }
    updateCamera() {
      if (!this.savedCamera) return;
      const c = this.c, t = this.time;
      const fireFrame = smooth(9.7, 11.6, t) * (1 - smooth(14.1, 16, t));
      // The widest collapsing flame reaches projected x≈825. A measured wider
      // frame prevents the fire from being cropped on a portrait phone.
      const sidebar = c.cw >= 700 && c.ch <= 480;
      const releaseBlend = this.interaction.released ? smooth(0, .8, this.clock - (this.interaction.releaseAt == null ? -10 : this.interaction.releaseAt)) : 0;
      const dialogueHeight = mix(c.cw < 650 ? 258 : 242, c.ch < 480 ? 124 : c.cw < 650 ? 184 : 160, releaseBlend);
      const viewWidth = sidebar ? c.cw - Math.min(330, c.cw * .39) - 40 : c.cw;
      const viewHeight = sidebar ? c.ch - 90 : c.ch - 92 - dialogueHeight;
      const midX = sidebar ? 20 + viewWidth / 2 : c.cw / 2;
      const midY = sidebar ? 70 + viewHeight / 2 : 92 + viewHeight / 2;
      let fit = clamp(Math.min(viewWidth / mix(830, 1070, fireFrame), Math.max(120, viewHeight) / mix(540, 660, fireFrame)), .25, 1.42);
      let frame = v(400 + fireFrame * 142, 174 - fireFrame * 18);
      const chosen = this.chosenActor(), positionFrame = this.interaction.positioned ? 1 - smooth(0, .8, this.clock - (this.interaction.positionedAt == null ? -10 : this.interaction.positionedAt)) : 1;
      if (positionFrame > .001) {
        // A player may finish combat at any edge of the arena. Keep both the
        // controllable actor and their destination inside the view while joining.
        const points = [];
        for (const a of this.actors) {
          const p = a.id === this.viewpoint ? a.control : a.target;
          points.push(c.project(p.x, p.y), c.project(p.x, p.y, a.size + 20));
          points.push(c.project(a.target.x, a.target.y));
        }
        points.push(c.project(this.bossTarget.x, this.bossTarget.y), c.project(this.bossTarget.x, this.bossTarget.y, 175), c.project(this.focus.x, this.focus.y, 242));
        const xs = points.map(p => p.x), ys = points.map(p => p.y);
        const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
        const groupFit = clamp(Math.min(viewWidth / (right - left + 135), Math.max(120, viewHeight) / (bottom - top + 100)), .23, 1.42);
        const group = c.unproject((left + right) / 2, (top + bottom) / 2);
        fit = mix(fit, groupFit, positionFrame); frame = lerp(frame, group, positionFrame);
      }
      const close = smooth(18.1, 20.9, t) * (c.cw < 650 ? .14 : .27);
      const target = lerp(frame, v(chosen.x - 43, chosen.y - 43), close);
      const zoom = fit * (1 + close * (c.cw < 650 ? .06 : .33));
      // Center the action in the area between the heading and the dialogue,
      // rather than allowing the short landscape dialogue to cover the heroes.
      const biasX = (c.cw / 2 - midX) / zoom / (2 * ISO_X);
      const biasY = (c.ch / 2 - midY) / zoom;
      target.x += biasY + biasX; target.y += biasY - biasX;
      const enter = smooth(0, this.c.reducedMotion ? .8 : 2.5, t);
      c.camera.x = mix(this.savedCamera.x, target.x, enter);
      c.camera.y = mix(this.savedCamera.y, target.y, enter);
      c.camera.zoom = mix(this.savedCamera.zoom, zoom, enter);
      c.scale = c.camera.zoom;
    }
    updateFX() {
      if (!this.fx) return;
      // Rebuild the small deterministic cue set after a dialogue jump. There
      // are no delayed damage callbacks to survive a skip, pause or retreat.
      this.fx.clear();
      const t = this.time, fireAge = t - FIRE_AT;
      if (fireAge >= 0 && fireAge < FIRE_DURATION) {
        const hongmao = this.actors[0], travel = smooth(.48, 1.9, fireAge);
        const p = lerp(v(hongmao.x, hongmao.y), this.bossTarget, travel);
        this.fx.emit('hongmao', 'e', { x: p.x, y: p.y, angle: -.4, age: fireAge, radius: 220,
          duration: FIRE_DURATION, follow: false, hand: 'right', equipment: 'sword', technique: 'firewhirl', seed: 811 });
      }
      for (let i = 0; i < 6; i++) {
        const age = this.clock - (2.48 + i * .13);
        if (age < 0 || age > .34 || this.actors[i].id === this.viewpoint) continue;
        const a = this.actors[i];
        this.fx.emit(a.id, 'attack', { x: a.x, y: a.y, angle: a.dir, radius: 73, duration: .34, age, follow: false, combo: 1, seed: 60 + i });
      }
      const chosen = this.chosenActor();
      for (const cue of this.inputCues) {
        const age = this.clock - cue.at;
        if (age < 0 || age >= cue.duration || t > 7) continue;
        this.fx.emit(cue.hero, cue.tier, { x: chosen.x, y: chosen.y, angle: chosen.dir,
          radius: cue.tier === 'q' ? 94 : 71, duration: cue.duration, age, follow: false,
          hand: 'right', equipment: 'sword', seed: 190 + VIEWPOINTS.indexOf(cue.hero) * 17 });
      }
      this.fx.dirty = true;
    }
    updateInteractionUI() {
      if (!this.dom) return;
      const d = this.dom, state = this.interaction, stage = state.stage, cooperating = !state.released && !this.complete;
      const enabled = this.canAct();
      this.ui.setAttribute('data-cooperating', String(cooperating));
      d.coop.hidden = !cooperating; d.coop.setAttribute('data-stage', stage);
      d.skip.disabled = !enabled;
      d.next.disabled = !enabled || cooperating;
      if (cooperating) {
        const index = stage === 'position' ? 0 : stage === 'charge' ? 1 : 2;
        d.steps.forEach((el, i) => {
          el.setAttribute('data-current', String(i === index)); el.setAttribute('data-done', String(i < index));
          if (i === index) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
        });
        const a = this.chosenActor(), initial = Math.max(40, Math.hypot(a.start.x - a.target.x, a.start.y - a.target.y));
        const percent = stage === 'position' ? state.positioned ? 100 : Math.min(98, clamp(1 - Math.hypot(a.control.x - a.target.x, a.control.y - a.target.y) / initial) * 100) : state.charge;
        d.meterFill.style.width = percent.toFixed(1) + '%';
        d.meter.setAttribute('aria-valuenow', String(Math.floor(percent)));
        d.meter.setAttribute('aria-label', stage === 'position' ? this.viewer.name + '入阵进度' : this.viewer.sword + '剑意');
        d.meterLabel.textContent = stage === 'position' ? this.viewer.sword + '阵眼' : stage === 'charge' ? this.viewer.sword + '剑意' : '剑心相合';
        d.meterValue.textContent = stage === 'release' ? '已就绪' : Math.floor(percent) + '%';
        d.sync.style.left = (3 + (Math.sin(this.clock * 1.65) + 1) * 47).toFixed(1) + '%';
        d.walk.hidden = stage !== 'position'; d.walk.disabled = !enabled || state.positioned;
        d.charge.hidden = stage !== 'charge'; d.charge.disabled = !enabled;
        d.charge.setAttribute('data-held', String(enabled && (this.inputKeys.has('KeyJ') || this.chargePointer != null)));
        d.assist.hidden = stage !== 'charge';
        d.assist.disabled = !enabled || this.clock - state.assistAt < 1.6;
        d.release.hidden = stage !== 'release'; d.release.disabled = !enabled || this.time < RELEASE_GATE - .001;
        d.next.textContent = stage === 'position' ? '等待入阵' : stage === 'charge' ? '等待注入剑意' : '等待你引剑';
        d.next.setAttribute('aria-label', '先完成当前协同步骤再推进剧情');
        const message = this.clock < state.noteUntil ? state.note : stage === 'position' ? state.positioned ? '已就位，等待同伴列阵。' : '点击地面或用方向键移动；也可点“前往阵位”。' : stage === 'charge' ? '松手即保留进度 · Q 施展你的剑法，可加快注入剑意。' : '何时引剑都能成；光点落在中间亮区时，会激起共鸣。';
        if (d.feedback.textContent !== message) d.feedback.textContent = message;
      }
    }
    updateDialogue() {
      if (!this.dom) return;
      const phase = PHASES[this.phase], own = LINES[this.viewpoint];
      const lines = [own[0], '七剑同心——合璧！', '这最后一分内力……我可要留着自己用。', '阵中少了一股劲力……让我来！火舞旋风！', own[1], own[2]];
      const contexts = [
        '长虹、冰魄、雨花、奔雷、青光、旋风各自列阵。马三娘仍占着紫云的位置。',
        '七柄剑腾空而起，七色剑气汇向同一道剑锋。',
        '紫色剑气骤然转薄。其余六人全力相持，她却悄悄收回了剑势。',
        '虹猫追加火舞旋风，以旋焰剑气补上合璧缺下的那一股力。',
        '火势散去，六侠相继力竭。马三娘仍握着紫云剑。',
        '莎丽赶到，左手剑直指马三娘。这一场恩怨，该由她亲手了结。'
      ];
      const state = this.interaction, cooperating = !state.released && this.time < 6.5;
      let speaker = phase.speaker === 'viewpoint' ? this.viewer.name : phase.speaker;
      if (cooperating || this.phase === 1 && state.released) speaker = this.viewer.name;
      const actor = CAST.find(a => a.name === speaker);
      this.dom.heading.textContent = phase.name;
      this.dom.speaker.textContent = speaker;
      // A UI cut-in follows the actual speaker; the player and 2.5D actors never change.
      if(window.SevenUIArt){
        let cutIn=this.dom.speaker.parentElement.querySelector('.ss-finale-cut-in');
        if(!cutIn){cutIn=document.createElement('div');cutIn.className='ss-finale-cut-in';this.dom.speaker.before(cutIn);}
        const artId=window.SevenUIArt.speakerId(speaker,this.viewpoint);
        if(cutIn.dataset.speaker!==artId){
          cutIn.dataset.speaker=artId||'';
          const swordState=artId===this.viewpoint?this.c.swordState:artId==='masanniang'?{weaponName:'紫云剑',hand:'right'}:window.SevenTrainingData?.getPreset(artId)?.swordState;
          cutIn.innerHTML=artId?window.SevenUIArt.render(artId,{swordState}):'';
        }
      }
      this.dom.speaker.style.setProperty('--speaker', actor ? actor.color : '#ecd09c');
      this.dom.line.textContent = lines[this.phase];
      this.dom.context.textContent = contexts[this.phase];
      if (cooperating) {
        this.dom.heading.textContent = state.stage === 'position' ? '七剑集阵 · 由你入阵' : state.stage === 'charge' ? this.viewer.sword + '剑意 · 注入合璧' : '七剑同心 · 由你引剑';
        this.dom.line.textContent = state.stage === 'position' ? '你的' + this.viewer.sword + '阵眼正在发光。走入阵位，与六位同伴一同迎敌。' : state.stage === 'charge' ? '长按 J 或聚气键，注入你的剑意；按 Q 施展' + this.viewer.sword + '剑法助阵。' : '七剑已齐。按 E 或点合璧键，把' + this.viewer.sword + '剑意尽数汇入七剑！';
      } else if (this.phase === 1 && state.released) {
        this.dom.line.textContent = this.viewer.sword + '引剑，七剑同心——合璧！';
        this.dom.context.textContent = state.quality === 'resonant' ? '你抓住了剑心相合的那一瞬，七色剑路一同亮起。' : '你的剑意贯入阵心，七柄剑随你引剑，汇作同一道剑锋。';
      }
      this.dom.next.textContent = this.phase === PHASES.length - 1 ? '完成终章 ↵' : '下一段 ↵';
      this.dom.next.setAttribute('aria-label', this.phase === PHASES.length - 1 ? '完成本角色的终局演出' : '推进到下一段终局剧情');
      this.dom.beats.forEach((b, i) => b.setAttribute('data-done', String(i <= this.phase)));
      this.updateInteractionUI();
    }
    finalize(skipped) {
      if (!this.canAct() || this.settled) return false;
      this.settled = true; this.complete = true; this.active = false;
      this.clearInteractionInput();
      this.skipped = !!skipped; this.time = END;
      if (this.ui) this.ui.hidden = true;
      // Combat owns boss death, rewards and delivery. A single path is shared
      // by natural completion, the last dialogue and the accessible skip.
      if (typeof this.c.finishFinale === 'function') this.c.finishFinale();
      return true;
    }
    dispose() {
      if (this.disposed) return;
      this.disposed = true; this.active = false;
      this.clearInteractionInput(); this.inputCues = [];
      this.listeners.forEach(([el, name, fn]) => el.removeEventListener(name, fn));
      this.listeners = [];
      if (this.ui) this.ui.remove();
      if (this.c.root) this.c.root.classList.remove('ss-finale-playing');
      if (this.fx) this.fx.clear();
      if (this.savedCamera) {
        Object.assign(this.c.camera, this.savedCamera);
        this.c.scale = this.c.camera.zoom;
      }
    }
    geometry() {
      const t = this.time, anim = this.clock, state = this.interaction, out = [], ground = [];
      const put = (points, color, alpha, width = 1, fill = false, onGround = false, glow = false) => {
        if (alpha < .008 || !points.length || out.length + ground.length >= 560) return;
        if (!points.every(p => Number.isFinite(p.x + p.y + p.z))) return;
        const p = { points, color, alpha: clamp(alpha), width, fill, glow,
          depth: points.reduce((n, q) => n + q.x + q.y, 0) / points.length };
        (onGround ? ground : out).push(p);
      };
      const ring = (p, r, z, color, alpha, width = 1, start = 0, span = TAU) => {
        const pts = [];
        for (let i = 0; i <= 56; i++) { const a = start + span * i / 56; pts.push(v(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, z)); }
        put(pts, color, alpha, width, false, z < 5);
      };
      const sword = (base, axis, len, width, color, alpha) => {
        const side = unit(cross(axis, Math.abs(axis.z) > .85 ? v(1, 0, 0) : v(0, 0, 1)));
        const root = add(base, axis, 8), shoulders = add(base, axis, len * .75), tip = add(base, axis, len);
        const left = add(shoulders, side, width), right = add(shoulders, side, -width);
        put([root, add(root, side, width * .65), left, tip], color, alpha * .44, 1, true);
        put([root, tip, right, add(root, side, -width * .65)], '#fcf4d4', alpha * .33, 1, true);
        put([root, tip], '#fff9df', alpha, 1.6, false, false, true);
        put([add(root, side, width * .65), left, tip, right, add(root, side, -width * .65)], color, alpha * .83, 1.3);
        put([add(base, side, width * 2), add(base, side, -width * 2)], '#f7ddb3', alpha, 2);
        put([add(base, axis, -12), root], color, alpha, 3);
      };
      const join = smooth(.35, 2.9, t), energy = smooth(2.6, 4, t), endFade = 1 - smooth(13.5, 15.9, t);
      const chosen = this.chosenActor();
      if (!state.released) {
        const mark = chosen.target, pulse = .72 + Math.sin(anim * 2.4) * .18;
        if (!state.positioned) {
          ring(mark, 34, 2.5, chosen.color, .92, 2.5);
          ring(mark, 43, 2, '#fff3be', pulse, 1.4, anim * .7, TAU * .76);
          ring(mark, 48, 1, chosen.color, pulse * .3, 5);
          for (let i = 0; i < 4; i++) {
            const angle = i * TAU / 4 + Math.PI / 4;
            put([add(mark, v(Math.cos(angle - .16) * 56, Math.sin(angle - .16) * 56, 2)),
              add(mark, v(Math.cos(angle) * 47, Math.sin(angle) * 47, 2)),
              add(mark, v(Math.cos(angle + .16) * 56, Math.sin(angle + .16) * 56, 2))], '#fff1c3', .83, 1.7, false, true);
          }
          const distance = Math.hypot(chosen.x - mark.x, chosen.y - mark.y), n = Math.min(16, Math.ceil(distance / 22));
          for (let k = 0; k < n; k++) {
            const u = (k + .22) / n, ahead = Math.min(1, u + .035);
            const p = lerp(chosen, mark, u), q = lerp(chosen, mark, ahead); p.z = q.z = 2;
            put([p, q], chosen.color, .28 + fract(anim * .7 - u) * .28, 2.2, false, true);
          }
          if (state.walkTo) ring(state.walkTo, 10, 2, '#fff4cc', .65, 1.3);
        } else {
          ring(mark, 34, 2, '#c1d1ad', .33, 1.2);
          ring(mark, 35, 2.5, chosen.color, .95, 2.8, -Math.PI / 2, Math.max(.018, state.charge / 100) * TAU);
          if (state.stage === 'release') {
            const r = 20 + ((Math.sin(anim * 1.65) + 1) / 2) * 31;
            ring(this.focus, r, this.focus.z, '#f5e3a5', .72, 1.5);
            ring(this.focus, 35, this.focus.z, '#e2d7a3', .38, 1.2);
          }
        }
      }
      ring(this.center, 185, 1.8, '#ead9a6', join * .44 * endFade, 1.15);
      ring(this.center, 207, 1.5, '#c6dace', join * .2 * endFade, .8);
      for (let i = 0; i < 7; i++) {
        const a = this.actors[i], target = a.target, next = this.actors[(i + 3) % 7].target;
        ring(this.center, 196, 2, a.color, join * .56 * endFade, 2, -.65 + i * TAU / 7 + .07, TAU / 7 - .16);
        put([v(target.x, target.y, 1), v(next.x, next.y, 1)], a.color, energy * .21 * endFade, 1, false, true);
        ring(v(a.x, a.y), 22, 2, a.color, join * .62 * endFade, 1.5);
        const weak = a.id === 'masanniang' ? 1 - smooth(6.65, 9.1, t) * .86 : 1;
        const ownEnergy = a.id === this.viewpoint && !state.released ? state.positioned ? .12 + state.charge * .0088 : 0 : 1;
        const flow = energy * ownEnergy;
        const base = v(a.x, a.y, 90 + energy * 24);
        const swordLift = smooth(2.9 + i * .07, 4.5 + i * .07, t) * ownEnergy;
        const origin = lerp(base, v(mix(a.x, this.center.x, .34), mix(a.y, this.center.y, .34), 189 + i % 2 * 12), swordLift);
        sword(origin, unit(v(Math.cos(i * .6) * .18, Math.sin(i * .6) * .18, 1)), 55, 4.6, a.color, flow * endFade * (a.id === 'masanniang' ? .9 : 1));
        if (flow > 0) {
          const from = v(a.x, a.y, 70), to = this.focus;
          const start = add(from, v(0, 0, 92));
          const finish = v(mix(from.x, to.x, .7), mix(from.y, to.y, .7), 220);
          const pts = [];
          for (let k = 0; k <= 28; k++) {
            const u = k / 28;
            pts.push(cubic(from, start, finish, to, u));
          }
          if (a.id === 'masanniang' && t > 7) {
            for (let k = 0; k < pts.length - 3; k += 5) {
              const flutter = .48 + .2 * Math.sin(anim * 3.2 + k);
              put(pts.slice(k, k + 3), a.color, flow * endFade * (.22 + weak * .7) * flutter, .8 + weak * 1.7);
            }
          } else {
            const ownWidth = a.id === this.viewpoint && !state.released ? 1 + state.charge * .01 : 1;
            put(pts, a.color, flow * .17 * endFade, 7, false, false, true);
            put(pts, a.color, flow * .76 * endFade, 1.9 * ownWidth, false, false, true);
            put(pts, '#fffbea', flow * .36 * endFade, .65);
          }
          for (let k = 0; k < (this.c.reducedMotion ? 2 : 4); k++) {
            const u = fract(anim * .43 + k / 4 + i * .16), p = cubic(from, start, finish, to, u);
            const trail = cubic(from, start, finish, to, Math.max(0, u - .05));
            put([trail, p], a.color, flow * endFade * weak * .88, 3.1);
          }
        }
      }
      // Seven narrow helices form one solid, pointed energy sword. Purple
      // visibly loses continuity while the other six strands remain engaged.
      const combine = state.released ? smooth(RELEASE_GATE, 6, t) * (1 - smooth(12.2, 14.4, t)) : 0;
      if (combine > .008) {
        const start = add(this.focus, v(0, 0, -10)), end = add(this.bossTarget, v(0, 0, 69));
        const delta = add(end, start, -1), axis = unit(delta), side = unit(cross(axis, v(0, 0, 1))), normal = unit(cross(axis, side));
        const swordLength = length(delta), release = smooth(RELEASE_GATE, 6.2, t);
        sword(start, axis, swordLength * release, state.quality === 'resonant' ? 20 : 16, '#efdaad', combine * .85);
        for (let k = 0; k < 7; k++) {
          const a = CAST[k], pts = [], weak = k === 6 ? 1 - smooth(6.65, 8.9, t) * .84 : 1;
          for (let j = 0; j <= 40; j++) {
            const u = j / 40, r = Math.sin(u * Math.PI) * 18;
            const an = k * TAU / 7 + u * TAU * .75 + anim * (this.c.reducedMotion ? .12 : .7);
            let p = lerp(start, end, u * release);
            p = add(add(p, side, Math.cos(an) * r), normal, Math.sin(an) * r);
            pts.push(p);
          }
          put(pts, a.color, combine * .74 * weak, 1.3 + weak * .7);
        }
      }
      if (state.released && state.releaseAt != null && this.clock - state.releaseAt < 1.4) {
        const age = this.clock - state.releaseAt, alpha = Math.sin(clamp(age / 1.4) * Math.PI);
        ring(this.center, 22 + age * 154, 3, state.quality === 'resonant' ? '#fff4c7' : chosen.color, alpha * .66, state.quality === 'resonant' ? 3.1 : 1.9);
        for (let i = 0; i < 7; i++) {
          const actor = this.actors[i], u = clamp(age * 1.9), p = lerp(v(actor.x, actor.y, 72), this.focus, u);
          const tail = lerp(v(actor.x, actor.y, 72), this.focus, Math.max(0, u - .14));
          put([tail, p], actor.color, alpha, i === VIEWPOINTS.indexOf(this.viewpoint) ? 5 : 2.6, false, false, true);
        }
      }
      const impact = smooth(12.7, 13.3, t) * (1 - smooth(14.8, 16.7, t));
      if (impact > 0) {
        const age = Math.max(0, t - 12.9);
        ring(this.bossTarget, 45 + age * 82, 2, '#f9dfac', impact * .67, 2);
        ring(this.bossTarget, 27 + age * 105, 1, '#eea466', impact * .31, 4);
        for (let i = 0; i < (this.c.reducedMotion ? 24 : 52); i++) {
          const a = i * 2.399, r = (38 + hash(i) * 76) * age;
          const z = Math.max(3, 80 + Math.sin(age * 1.3) * 75 - age * age * (4 + hash(i + 5) * 15));
          const p = v(this.bossTarget.x + Math.cos(a) * r, this.bossTarget.y + Math.sin(a) * r, z);
          const tail = add(p, v(-Math.cos(a) * 10, -Math.sin(a) * 10, -7));
          put([tail, p], i % 3 ? '#efb37c' : '#fff6d9', impact * (.3 + hash(i + 2) * .65), i % 4 ? 1.2 : 2.3);
        }
      }
      const aftermath = smooth(14.5, 17.5, t);
      if (aftermath > 0) {
        for (let i = 0; i < 10; i++) {
          const a = i * TAU / 10, r = 33 + hash(i) * 45;
          put([add(this.bossTarget, v(Math.cos(a) * 16, Math.sin(a) * 16, 1)),
            add(this.bossTarget, v(Math.cos(a + .13) * r, Math.sin(a + .13) * r, 1)),
            add(this.bossTarget, v(Math.cos(a) * (r + 29), Math.sin(a) * (r + 29), 1))], '#553e3699', aftermath * .6, 2, false, true);
        }
      }
      this.stats.primitives = out.length + ground.length;
      this.stats.vertices = out.concat(ground).reduce((n, p) => n + p.points.length, 0);
      return { air: out, ground };
    }
    drawPrimitive(ctx, p) {
      const project = this.c.project.bind(this.c);
      ctx.save(); ctx.globalAlpha = p.alpha;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      p.points.forEach((a, i) => { const q = project(a.x, a.y, a.z); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); });
      if (p.glow && !this.c.reducedMotion) { ctx.shadowColor = p.color; ctx.shadowBlur = 5; }
      if (p.fill) { ctx.closePath(); ctx.fillStyle = p.color; ctx.fill(); }
      else { ctx.lineWidth = p.width; ctx.strokeStyle = p.color; ctx.stroke(); }
      ctx.restore();
    }
    drawWorld(ctx) {
      if (!this.started || this.disposed) return;
      const c = this.c, t = this.time;
      this.updateCamera();
      const sky = ctx.createLinearGradient(0, 0, 0, c.ch);
      sky.addColorStop(0, '#617783'); sky.addColorStop(.58, '#9fada0'); sky.addColorStop(1, '#415d53');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, c.cw, c.ch);
      ctx.save();
      if (c.scene && c.scene.drawGround) c.scene.drawGround(ctx, c.camera, (c.time || 0) * 1000);
      else if (c.drawFallbackGround) c.drawFallbackGround(ctx);
      ctx.fillStyle = 'rgba(13,32,39,' + (.29 + Math.sin(smooth(2, 15, t) * Math.PI) * .08) + ')';
      ctx.fillRect(0, 0, c.cw, c.ch);
      const geo = this.geometry();
      this.stats.actors = this.actors.length + (this.arrival ? 1 : 0);
      this.stats.allianceActors = this.actors.length;
      c.withView(ctx, () => {
        geo.ground.forEach(p => this.drawPrimitive(ctx, p));
        this.drawShadows(ctx);
      });
      if (this.fx) this.fx.drawGround(ctx);
      let drawables = [];
      if (c.scene && c.scene.getDrawables) drawables = c.scene.getDrawables(c.camera, (c.time || 0) * 1000, { x: c.p.x, y: c.p.y, z: 0, hero: true }).slice();
      else if (c.fallbackProps && c.drawFallbackProp) drawables = c.fallbackProps.map(p => ({ depth: p.x + p.y + (p.d || 0), draw: () => c.withView(ctx, () => c.drawFallbackProp(ctx, p)) }));
      for (const a of this.actors) drawables.push({ depth: a.x + a.y, draw: () => c.withView(ctx, () => this.drawActor(ctx, a)) });
      if (this.arrival) drawables.push({ depth: this.arrival.x + this.arrival.y, draw: () => c.withView(ctx, () => this.drawArrival(ctx)) });
      drawables.push({ depth: this.bossActor.x + this.bossActor.y, draw: () => c.withView(ctx, () => this.drawBoss(ctx)) });
      const groups = new Map();
      for (const p of geo.air) { const key = Math.floor(p.depth / 28); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(p); }
      groups.forEach((ps, key) => drawables.push({ depth: key * 28 + 14, draw: () => c.withView(ctx, () => ps.sort((a, b) => a.depth - b.depth).forEach(p => this.drawPrimitive(ctx, p))) }));
      if (this.fx) {
        drawables.push(...this.fx.getDrawables());
        this.stats.effects = this.fx.effects.length;
        this.stats.effectPrimitives = this.fx.stats.primitives;
        this.stats.effectVertices = this.fx.stats.vertices;
      }
      drawables.sort((a, b) => a.depth - b.depth).forEach(item => item.draw(ctx));
      c.withView(ctx, () => this.drawAsh(ctx));
      ctx.restore();
    }
    drawShadows(ctx) {
      const t = this.time;
      for (const a of this.actors) {
        const q = this.c.project(a.x + 3, a.y + 3);
        ctx.save(); ctx.fillStyle = '#142a28'; ctx.globalAlpha = .28;
        ctx.beginPath(); ctx.ellipse(q.x, q.y, a.id === 'daben' ? 29 : 23, 10, 0, 0, TAU); ctx.fill();
        if (a.id === this.viewpoint) {
          ctx.globalAlpha = .8; ctx.strokeStyle = '#f5d18c'; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.ellipse(q.x, q.y, 29, 14, 0, 0, TAU); ctx.stroke();
          ctx.globalAlpha = .28; ctx.lineWidth = 4; ctx.stroke();
        }
        ctx.restore();
      }
      if (!this.interaction.positioned && !this.interaction.released) {
        const a = this.chosenActor(), mark = this.c.project(a.target.x, a.target.y, 50);
        this.drawLabel(ctx, mark.x, mark.y, a.sword + '阵位 · 你', a.color, true);
      }
      const q = this.c.project(this.bossActor.x, this.bossActor.y);
      ctx.save(); ctx.globalAlpha = .26 * (1 - smooth(16, 19, t)); ctx.fillStyle = '#1b242a';
      ctx.beginPath(); ctx.ellipse(q.x, q.y, 47, 21, 0, 0, TAU); ctx.fill(); ctx.restore();
    }
    drawArrival(ctx) {
      const a = this.arrival, q = this.c.project(a.x, a.y);
      ctx.save(); ctx.globalAlpha = a.alpha;
      ctx.fillStyle = '#142a2859'; ctx.beginPath(); ctx.ellipse(q.x, q.y + 2, 19, 8, 0, 0, TAU); ctx.fill();
      if (window.GameArt && window.GameArt.drawHero) {
        // She arrives only after the alliance. Her left hand holds the plain
        // metal left-hand sword left by the one-armed swordsman; the purple
        // bound sword is still with Ma Sanniang.
        window.GameArt.drawHero(ctx, 'sali', q.x, q.y, 110, this.c.screenDirection(a.dir), this.time,
          { state: a.state, phase: a.phase, hand: 'left', equipment: { type: 'plain', name: '左手剑' },
            swordState: { status: 'lost', hand: 'left', weaponName: '左手剑' } });
      }
      this.drawLabel(ctx, q.x, q.y + 16, '莎丽', '#e8c6e4', false);
      ctx.restore();
    }
    drawActor(ctx, a) {
      const q = this.c.project(a.x, a.y, a.z), t = this.time;
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(a.tilt || 0); ctx.scale(1, 1 - a.exhaustion * .22);
      if (a.id === 'masanniang') {
        // Her ally-scale body is the same height as the six swordsmen. The
        // standalone boss export below keeps its independently chosen size.
        ctx.scale(a.size / 150, a.size / 150);
        this.drawMa(ctx, a);
      }
      else if (window.GameArt && window.GameArt.drawHero) {
        window.GameArt.drawHero(ctx, a.id, 0, 0, a.size, this.c.screenDirection(a.dir), this.clock,
          { state: a.state, phase: a.phase, air: clamp(a.z / 46), equipment: { type: 'sword', name: a.sword + '剑' },
            swordState: { status: 'bound', hand: 'right' }, hand: 'right' });
      }
      ctx.restore();
      this.drawLabel(ctx, q.x, q.y + 17, a.name, a.color, a.id === this.viewpoint);
      if (a.id === 'masanniang' && t > 6.9 && t < 10.1) {
        const alpha = smooth(6.9, 7.4, t) * (1 - smooth(9.6, 10.1, t));
        ctx.save(); ctx.globalAlpha = alpha;
        this.drawLabel(ctx, q.x + 1, q.y - a.size - 7, '留力', '#e1b2ea', false);
        ctx.restore();
      }
    }
    drawLabel(ctx, x, y, text, color, selected) {
      const zoom = this.c.camera.zoom;
      const size = Math.max(12, 10 / zoom);
      ctx.save(); ctx.font = (selected ? '600 ' : '') + size + 'px "PingFang SC","Microsoft YaHei",sans-serif';
      const label = selected ? '◆ ' + text : text, w = ctx.measureText(label).width;
      ctx.fillStyle = '#163232da'; ctx.fillRect(x - w / 2 - 7, y - size * .64, w + 14, size * 1.35);
      ctx.strokeStyle = selected ? '#e1bd7b' : '#b8c9ac55'; ctx.lineWidth = .7;
      ctx.strokeRect(x - w / 2 - 7, y - size * .64, w + 14, size * 1.35);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = selected ? '#ffe2a5' : color; ctx.fillText(label, x, y);
      ctx.restore();
    }
    drawMa(ctx, a) {
      // Articulated mare design matches the standing portrait: pink muzzle,
      // lavender blaze, turquoise bead and purple coat. Not a Sali reskin.
      const path = (d, fill, stroke = '#41414e', width = 1.2) => {
        let p = MA_PATHS.get(d);
        if (!p) { p = new Path2D(d); MA_PATHS.set(d, p); }
        if (fill) { ctx.fillStyle = fill; ctx.fill(p); }
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(p); }
      };
      const ellipse = (x, y, rx, ry, fill, stroke) => {
        ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
        if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
      };
      ctx.save();
      const step = a.state === 'walk' ? Math.sin(a.phase * TAU) * 3 : 0;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      path('M-19 -75Q-31 -65 -34 -44L-40 -21L-25 -24L-14 -51Z', '#74418b');
      path('M16 -74Q27 -61 32 -36L35 -24L20 -28L11 -48Z', '#8e55a4');
      path('M-13 -18L-15 -4L-24 0Q-12 4 -5 0L-3 -18Z', '#393d54');
      ctx.translate(step, 0);
      path('M8 -18L10 -3L20 1Q24 5 10 5L1 2L0 -19Z', '#4f4a64');
      ctx.translate(-step, 0);
      const robe = ctx.createLinearGradient(-23, -81, 22, -5);
      robe.addColorStop(0, '#ac79ba'); robe.addColorStop(.45, '#955daf'); robe.addColorStop(1, '#744388');
      path('M-19 -80Q-10 -86 0 -84Q14 -87 21 -75L16 -55L24 -12Q3 -3 -24 -13L-16 -56Z', robe);
      path('M-10 -81L1 -63L12 -80L8 -52L0 -48L-8 -52Z', '#e6e3e5');
      path('M-20 -59Q1 -53 20 -59L20 -52Q0 -47 -18 -54Z', '#342f55');
      path('M-5 -49L-14 -10L0 -8L3 -39L8 -9L20 -12L7 -49Z','#557faf','#3e4c74',.8);path('M-7 -49L-17 -12M8 -49L21 -13',null,'#d4a7e7',2);
      path('M6 -48Q11 -31 17 -18M-14 -42Q-16 -25 -19 -17', null, '#d2ace1', .9);
      path('M-13 -71L-27 -59L-32 -45Q-28 -38 -23 -41L-16 -57L-7 -62Z', '#a374ba');
      ellipse(-28, -43, 5, 6, '#f3b8a7', '#545666');
      // The hand visibly lowers as the purple contribution weakens.
      const lift = a.state === 'cast' ? -16 : a.retaining > .5 ? 8 : 0;
      ctx.save(); ctx.translate(21, -54 + lift); ctx.rotate(a.state === 'cast' ? -.7 : .25);
      path('M-6 -11L8 -8L12 9L0 13L-6 4Z', '#a374ba');
      ellipse(7, 11, 4.8, 5.5, '#f5bcad', '#565369');
      path('M6 9L11 -39L15 -48L18 -39L13 10Z', '#c0a3df', '#5d547d', .8);
      path('M11 -35L15 -47L11 7Z', '#e8d8f2', null);
      ctx.save();ctx.translate(9,11);ctx.rotate(.15);ellipse(0,0,8,11,null,'#c18adb');ellipse(0,0,6,9,null,'#75458b');ctx.restore();
      path('M6 12L9 26L13 27L11 13Z', '#4b426d');
      ctx.restore();
      // Mane is behind the long face; bead and forehead stripe stay legible
      // at boss scale and in the seven-swords formation.
      path('M7 -125Q25 -115 20 -88Q24 -70 13 -62L7 -74L4 -109Z','#a29bbb','#56506e');
      path('M-15 -116L-20 -146Q-20 -154 -15 -150L-5 -126Z','#f2b6a5');
      path('M7 -124L17 -151Q22 -157 23 -147L19 -115Z','#f2b6a5');
      path('M-16 -145L-11 -126M19 -146L15 -127',null,'#cc8f91',1.4);
      path('M-17 -119Q-7 -136 12 -125Q21 -117 18 -102L13 -85Q3 -76 -11 -86L-18 -101Z','#f5beaf');
      path('M-3 -130L8 -129Q1 -111 2 -92L-6 -93Q-10 -112 -3 -130Z','#a49bb8',null);
      path('M-17 -100Q-7 -105 9 -101Q22 -102 20 -89Q18 -78 3 -77Q-14 -76 -20 -88Q-22 -95 -17 -100Z','#f8c3b3');
      path('M-14 -111Q-10 -126 -5 -112L-5 -101L-14 -103ZM5 -112Q12 -129 16 -113L15 -102L5 -101Z','#9460b1','#80529c',.7);
      path('M-14 -105L-5 -102L-6 -97L-12 -99ZM5 -102L15 -105L13 -98L7 -97Z','#fff5e7','#543b48',.7);
      ellipse(-9,-102,1.8,3.5,'#2d2b34');ellipse(10,-102,1.8,3.5,'#2d2b34');
      path('M-15 -121Q-12 -130 -5 -121M5 -122Q12 -134 17 -123',null,'#39303e',2.2);
      path('M-12 -84Q2 -80 13 -86',null,'#ac747d',1.1);
      ellipse(1,-137,9,10,'#77d0e6','#38647b');
      path('M-7 -139Q0 -143 9 -137',null,'#28a9ca',3);
      ellipse(-2,-142,2.6,1.5,'#c4f3ee');
      ctx.restore();
    }
    drawBoss(ctx) {
      const c = this.c, t = this.time, boss = this.bossActor;
      const q = c.project(boss.x, boss.y), defeat = smooth(14.35, 16.5, t), fade = 1 - smooth(16.7, 19.1, t);
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(defeat * .73); ctx.scale(1.35, 1.35 * (1 - defeat * .35)); ctx.globalAlpha = Math.max(0, fade);
      if (typeof c.drawEnemySprite === 'function') c.drawEnemySprite(ctx, Object.assign({}, boss, { x: 0, y: 0, dir: c.screenDirection(boss.dir) }));
      ctx.restore();
      const barrier = smooth(2.8, 4.5, t) * (1 - smooth(12.8, 14.1, t));
      if (barrier > .01) {
        const at = c.project(boss.x, boss.y, 80);
        ctx.save(); ctx.strokeStyle = '#b99dbd'; ctx.lineWidth = 2; ctx.globalAlpha = barrier * .5;
        ctx.beginPath(); ctx.ellipse(at.x, at.y, 65, 82, -.27, this.clock * .38, this.clock * .38 + TAU * .88); ctx.stroke();
        ctx.lineWidth = 6; ctx.globalAlpha *= .18; ctx.stroke();
        ctx.lineWidth = 1; ctx.globalAlpha = barrier * .32;
        ctx.beginPath(); ctx.ellipse(at.x, at.y, 76, 94, -.27, -this.clock * .23, -this.clock * .23 + TAU * .72); ctx.stroke();
        ctx.restore();
      }
      if (t < 16.5) this.drawLabel(ctx, q.x, q.y + 24, '黑心虎', '#edb89d', false);
    }
    drawAsh(ctx) {
      const c = this.c, t = this.time, warm = smooth(11, 14, t);
      for (let i = 0; i < (c.reducedMotion ? 16 : 32); i++) {
        const age = fract(this.clock * .045 + hash(i));
        const p = v(220 + hash(i + 13) * 560 + Math.sin(this.clock * .35 + i) * 16, 120 + hash(i + 51) * 400, 16 + age * 205);
        const q = c.project(p.x, p.y, p.z);
        ctx.save(); ctx.globalAlpha = Math.sin(age * Math.PI) * (.2 + warm * .18);
        ctx.strokeStyle = warm && i % 3 ? '#eab477' : '#f0ead4'; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(q.x - 2, q.y + 4); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.restore();
      }
    }
    drawOverlay(ctx) {
      if (!this.started || this.disposed) return;
      const c = this.c, t = this.time, w = c.cw, h = c.ch;
      ctx.save();
      const top = ctx.createLinearGradient(0, 0, 0, Math.min(170, h * .25));
      top.addColorStop(0, '#0c202cba'); top.addColorStop(1, '#0c202c00');
      ctx.fillStyle = top; ctx.fillRect(0, 0, w, Math.min(170, h * .25));
      const lower = ctx.createLinearGradient(0, h - 190, 0, h);
      lower.addColorStop(0, '#10292c00'); lower.addColorStop(1, '#10292c96');
      ctx.fillStyle = lower; ctx.fillRect(0, Math.max(0, h - 190), w, 190);
      ctx.fillStyle = '#ecd9a766'; ctx.fillRect(0, 0, w, 1);
      if (t > FIRE_AT && t < FIRE_AT + 2) {
        const alpha = smooth(FIRE_AT, FIRE_AT + .3, t) * (1 - smooth(FIRE_AT + 1.4, FIRE_AT + 2, t));
        ctx.globalAlpha = alpha; ctx.textAlign = 'center';
        ctx.font = '600 ' + (w < 650 ? 24 : 34) + 'px "Songti SC","STSong",serif';
        ctx.fillStyle = '#ffe3ab'; ctx.shadowColor = '#7c382b'; ctx.shadowBlur = 13;
        ctx.fillText('火舞旋风', w * .66, h < 480 ? 69 : 122);
      }
      ctx.restore();
      if (this.dom) this.updateInteractionUI();
    }
  }
  window.SevenFinale = Object.freeze({
    version: 9, duration: END,
    drawMaSanniang(ctx, x, y, size = 150, dir = 0, time = 0, options = {}) {
      ctx.save(); ctx.translate(x, y); ctx.scale(size / 150, size / 150);
      if (Math.cos(dir) < -.25) ctx.scale(-1, 1);
      Finale.prototype.drawMa(ctx, {
        state: options.state || 'idle',
        phase: options.phase == null ? fract(time * 1.8) : clamp(options.phase),
        retaining: options.retaining || 0
      });
      ctx.restore();
    },
    create(combat, config) {
      if (!combat || !config || config.kind !== 'seven-swords' || !combat.hero || !VIEWPOINTS.includes(combat.hero.id)) return null;
      return new Finale(combat, config);
    }
  });
})();
