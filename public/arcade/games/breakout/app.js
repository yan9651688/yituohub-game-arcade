(function () {
  'use strict';
  const t=(source,params)=>window.ArcadeI18n?window.ArcadeI18n.t(source,params):String(source).replace(/\{(\w+)\}/g,(_,key)=>params?.[key]??'{'+key+'}');
  const setText=(id,value)=>{const el=$(id);if(el.textContent!==value)el.textContent=value;};
  const C = window.BreakoutCore, $ = id => document.getElementById(id);
  const canvas = $('game'); let ctx = canvas.getContext('2d');
  let backdrop=null,backdropKey='';
  const COLORS = { W: '#d4d9c8', O: '#d99862', L: '#69b5bc', G: '#95ad76', R: '#ce7264', B: '#7197c6', P: '#b58aaf', Y: '#d8bf68', S: '#aab9b6', g: '#bc9d51' };
  const STORAGE = 'classic-breakout-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE) || '{}') || {}; } catch (_) {}
  const game = new C.Game({ best: saved.best });
  const input = { left: false, right: false, fire: false, pointerX: null };
  const keys = new Set(), touches = new Map();
  let mouseHeld = false, gamePointer = null, pointerX = null, particles = [], uiTime = 0;
  let bossPulse = 0, bossDeathUntil = 0, levelPage = 0;
  let last = 0, oldState = '', oldLevel = -1, storedBest = game.best, toastUntil = 0;
  let soundOn = saved.sound !== false, audio = null, dialogRestore = false, pendingLevel = 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function save() { try { localStorage.setItem(STORAGE, JSON.stringify({ best: game.best, sound: soundOn })); } catch (_) {} }
  function unlockAudio() {
    if (!soundOn) return;
    try { if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume().catch(() => {}); } catch (_) {}
  }
  function beep(freq, length = .045, volume = .025, end = freq, delay = 0) {
    if (!soundOn || !audio || audio.state !== 'running') return;
    try {
      const t = audio.currentTime + delay, o = audio.createOscillator(), g = audio.createGain();
      o.type = 'square'; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, end), t + length);
      g.gain.setValueAtTime(volume, t); g.gain.exponentialRampToValueAtTime(.0001, t + length);
      o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + length + .01); o.onended = () => { o.disconnect(); g.disconnect(); };
    } catch (_) {}
  }
  function notify(text, seconds = 2.1) { $('toast').textContent = t(text); $('toast').classList.remove('hidden'); toastUntil = uiTime + seconds; }
  function cleanInput() {
    keys.clear(); touches.clear(); mouseHeld = false; gamePointer = null; pointerX = null;
    input.left = input.right = input.fire = false; input.pointerX = null;
    document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
  }
  function focusGame() { canvas.focus({ preventScroll: true }); }
  function alignCabinet() {
    requestAnimationFrame(() => {
      if (anyDialog() || !['ready','playing'].includes(game.state)) return;
      const cabinet = document.querySelector('.cabinet');
      window.scrollTo({ top: Math.max(0, window.scrollY + cabinet.getBoundingClientRect().top - 12), behavior: 'auto' });
      focusGame();
    });
  }
  function start(level = 0) {
    cleanInput(); unlockAudio(); game.newGame(level); particles = []; bossPulse = bossDeathUntil = 0; oldState = ''; oldLevel = -1; sync(); focusGame(); alignCabinet();
  }
  function action() { unlockAudio(); game.action(); focusGame(); }
  function togglePause() { cleanInput(); game.togglePause(); sync(); focusGame(); alignCabinet(); }
  function anyDialog() { return document.querySelector('dialog[open]'); }
  function openDialog(id) {
    if (anyDialog()) return;
    cleanInput(); dialogRestore = game.state === 'playing' || game.state === 'ready';
    if (dialogRestore) game.togglePause();
    $(id).showModal(); sync();
  }
  function closeDialog(dialog, restore = true) {
    const shouldResume = restore && dialogRestore; dialogRestore = false;
    dialog.close();
    if (shouldResume && game.state === 'paused') { game.togglePause(); alignCabinet(); }
    cleanInput(); sync(); focusGame();
  }
  function requestRestart(level = 0, fromSelect = false) {
    pendingLevel = level;
    if (['title', 'win', 'gameover'].includes(game.state)) { start(level); return; }
    $('restart-title').textContent = fromSelect ? t('从第 {n} 关开始？',{n:level+1}) : '重新开始这一局？';
    $('restart-copy').textContent = '当前分数和关卡进度会清零，最高分会保留。新的一局从 3 条生命开始。';
    openDialog('restart-dialog');
  }
  $('confirm-restart').addEventListener('click', () => { closeDialog($('restart-dialog'), false); start(pendingLevel); });
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => closeDialog(button.closest('dialog'))));
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); });
    dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog(dialog); } });
  });
  $('primary-button').addEventListener('click', () => {
    if (game.state === 'paused') togglePause();
    else if (game.state === 'levelclear') { game.nextLevel(); cleanInput(); sync(); focusGame(); alignCabinet(); }
    else start(0);
  });
  $('pause-button').addEventListener('click', togglePause);
  $('restart-button').addEventListener('click', () => requestRestart(0));
  $('help-button').addEventListener('click', () => openDialog('help-dialog'));
  $('reference-button').addEventListener('click', () => openDialog('reference-dialog'));
  $('select-button').addEventListener('click', () => openDialog('levels-dialog'));
  $('levels-button').addEventListener('click', () => openDialog('levels-dialog'));
  function setSound() { soundOn = !soundOn; if (soundOn) { unlockAudio(); beep(440, .07); } save(); updateSound(); }
  function updateSound() { setText('sound-button',t(soundOn?'声音 开':'声音 关')); $('sound-button').setAttribute('aria-pressed', String(soundOn)); }
  $('sound-button').addEventListener('click', setSound);
  function currentInput() {
    const values = Array.from(touches.values());
    input.left = keys.has('arrowleft') || keys.has('a') || values.includes('left');
    input.right = keys.has('arrowright') || keys.has('d') || values.includes('right');
    input.fire = keys.has(' ') || keys.has('j') || mouseHeld || values.includes('fire');
    input.pointerX = input.left || input.right ? null : pointerX;
    return input;
  }
  document.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    if (anyDialog() || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    if (target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    if (['arrowleft','arrowright','a','d',' ','j','p','escape','r','m','enter'].includes(key)) {
      if ((key === 'enter' || key === ' ') && target instanceof HTMLButtonElement) return;
      event.preventDefault();
    } else return;
    if (event.repeat) return;
    if (key === 'p' || key === 'escape') { togglePause(); return; }
    if (key === 'm') { setSound(); return; }
    if (key === 'r') { if (game.state !== 'title') requestRestart(0); return; }
    if (key === 'enter') { if (['title','paused','levelclear','win','gameover'].includes(game.state)) $('primary-button').click(); else if (game.state === 'ready') action(); return; }
    if (key === ' ' || key === 'j') {
      if (game.state === 'title') start(); else if (game.state === 'playing' || game.state === 'ready') action();
    }
    if (game.state === 'playing' || game.state === 'ready') keys.add(key);
    if (key === 'arrowleft' || key === 'arrowright' || key === 'a' || key === 'd') pointerX = null;
  });
  document.addEventListener('keyup', event => { keys.delete(event.key.toLowerCase()); });
  function pointerLocation(event) { const r = canvas.getBoundingClientRect(); return (event.clientX - r.left) / r.width * C.WIDTH; }
  canvas.addEventListener('pointermove', event => {
    if (anyDialog()) return;
    if (event.pointerType === 'mouse' && !(event.buttons & 1)) mouseHeld = false;
    if (event.pointerType === 'mouse' || event.pointerId === gamePointer) pointerX = pointerLocation(event);
  });
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || anyDialog() || !['ready','playing'].includes(game.state)) return;
    event.preventDefault(); pointerX = pointerLocation(event); gamePointer = event.pointerId; mouseHeld = true;
    try { canvas.setPointerCapture(event.pointerId); } catch (_) {}
    // Align the paddle immediately before launch so touch launch begins under the finger.
    game.step(1 / 1000, { pointerX }); action();
  });
  function releaseCanvas(event) { if (event.pointerId === gamePointer) { mouseHeld = false; gamePointer = null; } }
  canvas.addEventListener('pointerup', releaseCanvas); canvas.addEventListener('pointercancel', releaseCanvas); canvas.addEventListener('lostpointercapture', releaseCanvas);
  for (const [id, control] of [['left-button','left'],['right-button','right'],['action-button','fire']]) {
    const button = $(id);
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0 || anyDialog()) return;
      event.preventDefault(); try { button.setPointerCapture(event.pointerId); } catch (_) {} touches.set(event.pointerId, control); button.classList.add('active');
      if (control === 'fire') { if (game.state === 'title') start(); else action(); }
      else pointerX = null;
    });
    const release = event => { touches.delete(event.pointerId); button.classList.remove('active'); };
    button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
    button.addEventListener('click', event => { if (event.detail === 0 && control === 'fire') { if (game.state === 'title') start(); else action(); } });
  }
  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'mouse' && !(event.buttons & 1)) {
      mouseHeld = false; touches.delete(event.pointerId);
      document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
    }
  });
  window.addEventListener('pointerup', event => { releaseCanvas(event); touches.delete(event.pointerId); if (!event.buttons) { mouseHeld = false; document.querySelectorAll('.active').forEach(el => el.classList.remove('active')); } });
  window.addEventListener('pointercancel', event => { releaseCanvas(event); touches.delete(event.pointerId); document.querySelectorAll('.active').forEach(el => el.classList.remove('active')); });
  function pauseAway() { cleanInput(); if (game.state === 'playing' || game.state === 'ready') { game.togglePause(); sync(); } }
  window.addEventListener('blur', pauseAway);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseAway(); last = 0; });
  window.addEventListener('pagehide', () => { pauseAway(); save(); });
  function sync() {
    const state = game.state;
    document.body.classList.toggle('is-running', state !== 'title');
    $('pause-button').disabled = !['ready','playing','paused'].includes(state);
    setText('pause-button',t(state === 'paused' ? '继续' : '暂停'));
    $('restart-button').disabled = state === 'title';
    if (game.level !== oldLevel) {
      $('level-caption').textContent = 'ROUND ' + String(game.level + 1).padStart(2, '0') + ' / ' + C.LEVELS.length + (game.practice ? t(' · 练习') : '');
      $('level-name').textContent = t(C.LEVELS[game.level].name); $('level-hint').textContent = t(C.LEVELS[game.level].subtitle); oldLevel = game.level;
    }
    if (state === 'win' && uiTime < bossDeathUntil) { $('overlay').classList.add('hidden'); return; }
    if (state === oldState) return; oldState = state;
    const overlay = $('overlay'); overlay.classList.toggle('hidden', state === 'playing' || state === 'ready');
    overlay.classList.toggle('is-paused', state === 'paused'); overlay.classList.toggle('is-finished', ['levelclear','win','gameover'].includes(state));
    $('result-score').classList.toggle('hidden', !['levelclear','win','gameover'].includes(state));
    $('select-button').classList.toggle('hidden', state === 'paused');
    const configs = {
      title: ['ONE PADDLE. ENDLESS JOY.', '接住这一点快乐。', '35 面砖阵 + 第 36 关 DOH 决战\n一颗小球，一路闯到底。', '开始游戏  ▶', 'ENTER 开始 · 鼠标左键发球'],
      paused: ['TAKE A BREATH', '小球，等你回来。', '当前游戏已暂停。\n继续时，先看清小球的位置。', '继续游戏  ▶', 'P / ESC 继续'],
      levelclear: ['ROUND COMPLETE', '这一面，敲得漂亮。', t(game.clearReason === 'warp'?'第 {n} 关通过传送出口\n下一关：{name}':'第 {n} 关完成 · 清关奖励 500 分\n下一关：{name}',{n:game.level+1,name:t(C.LEVELS[game.level+1]?.name||'')}), '进入下一关  ▶', 'ENTER 继续'],
      win: ['DOH DEFEATED. WELL PLAYED.', '最后一击，漂亮。', t('{result} · 剩余 {lives} 条生命\n今天的手感，值得再来一局。',{result:t(game.practice?'选关练习完成 · DOH 已击败':'36 关全部完成 · DOH 已击败'),lives:game.lives}), '再玩一局  ↻', 'ENTER 重新开始'],
      gameover: ['GAME OVER', '就差那么一点点。', t('停在第 {n} 关 · {name}\n下一次，换个角度再试试。',{n:game.level+1,name:t(C.LEVELS[game.level].name)}), '再玩一局  ↻', 'ENTER 重新开始']
    };
    const config = configs[state]; if (!config) return;
    $('overlay-kicker').textContent = t(config[0]); $('overlay-title').textContent = t(config[1]);
    $('overlay-copy').textContent = t(config[2]).split('\n').map(line=>t(line)).join('\n'); $('overlay-copy').style.whiteSpace = 'pre-line';
    $('primary-button').textContent = t(config[3]); $('overlay-shortcut').textContent = t(config[4]);
    $('result-score').textContent = String(game.score).padStart(6, '0');
  }
  function renderBrick(c, b) {
    const x = Math.round(b.x), y = Math.round(b.y), w = b.w, h = b.h;
    c.fillStyle = '#080e13'; c.fillRect(x + 1, y + 1, w, h);
    c.fillStyle = b.flash > 0 ? '#e8edda' : COLORS[b.type]; c.fillRect(x, y, w - 1, h - 1);
    c.fillStyle = '#ffffff46'; c.fillRect(x + 1, y, w - 3, 1); c.fillRect(x, y + 1, 1, h - 3);
    c.fillStyle = '#00000035'; c.fillRect(x + 1, y + h - 3, w - 2, 2); c.fillRect(x + w - 3, y + 1, 2, h - 2);
    if (b.type === 'S') { c.fillStyle = b.hp === 1 ? '#455a60' : '#e3e9dc'; c.fillRect(x + 4, y + 4, w - 9, 1); if (b.hp === 1) { c.fillRect(x + 10, y + 1, 1, 3); c.fillRect(x + 12, y + 5, 1, 4); } }
    if (b.type === 'g') { c.fillStyle = '#e4cb7d'; c.fillRect(x + 3, y + 3, 2, 3); c.fillRect(x + w - 7, y + 3, 2, 3); c.fillStyle = '#8d7536'; c.fillRect(x + 9, y + 3, 4, 3); }
  }
  function smallText(text, x, y, color = '#a6b8a6', align = 'left', size = 7) { ctx.fillStyle = color; ctx.font = size + 'px ui-monospace, monospace'; ctx.textAlign = align; ctx.fillText(t(text), x, y); }
  // Original geometric pixel sculpture: no ROM sprites or sampled artwork.
  function renderBoss(c, boss, time = 0, attack = 0) {
    const x = Math.round(boss.x), y = Math.round(boss.y);
    c.save(); c.translate(x, y); c.scale(boss.w / 72, boss.h / 94);
    const flash = boss.flash > 0, stone = flash ? '#fff2c3' : '#9c443b';
    const light = flash ? '#ffffff' : '#e38762', shade = flash ? '#d9bb9a' : '#492c32';
    const rect = (color, x, y, w, h) => { c.fillStyle = color; c.fillRect(x,y,w,h); };
    rect('#171c25',4,4,64,90); rect(shade,0,25,72,43);
    rect(stone,6,7,60,80); rect(stone,13,0,46,94);
    rect(light,13,0,46,5); rect(light,6,8,5,65);
    rect('#b95745',13,7,43,22); rect(shade,58,7,8,75);
    rect(light,2,29,4,29); rect(shade,8,33,4,25); rect('#382b30',64,32,4,29);
    // Overhanging brow, recessed eyes, long angular nose and square jaw.
    rect(shade,12,30,48,13); rect(light,11,28,22,5); rect(light,39,28,21,5);
    const blink = !attack && Math.floor(time * 2) % 13 === 12;
    rect('#251e29',15,35,15,blink ? 2 : 7); rect('#251e29',42,35,15,blink ? 2 : 7);
    if (!blink) { rect(attack ? '#ffe6a7' : '#e5bf8b',23,36,5,3); rect(attack ? '#ffe6a7' : '#e5bf8b',44,36,5,3); }
    rect(shade,29,33,16,34); rect(light,31,30,9,31); rect(stone,27,57,19,8);
    rect(shade,26,64,22,4); rect('#35242a',30,64,5,3); rect('#35242a',40,64,5,3);
    rect(light,14,46,7,20); rect(shade,52,46,7,20);
    rect(shade,20,73,33,12); rect('#251e29',24,75,25,attack ? 10 : 4);
    if (attack) { rect('#c85543',29,77,15,6); rect('#ffe0a0',34,78,5,4); }
    rect(light,22,71,30,3); rect(light,22,87,30,3); rect(shade,15,91,43,3);
    // Engraved copper mesh suggests the original wireframe head without tracing its sprite.
    for (let row=7;row<27;row+=5) { rect('#612f32',13,row,43,1); for(let col=16;col<56;col+=6) rect('#e38762',col,row+1,1,3); }
    for (let row=48;row<69;row+=5) { rect('#612f32',13,row,12,1); rect('#612f32',48,row,11,1); }
    for (let row=36;row<59;row+=5) rect('#9c443b',32,row,7,1);
    for (let row=85;row<93;row+=4) { rect('#612f32',16,row,41,1); for(let col=20;col<55;col+=7) rect('#e38762',col,row+1,1,2); }
    // Chipped stone detail becomes visible at low health.
    if (boss.hp < boss.maxHp / 2) { rect(shade,48,9,2,9); rect(shade,46,17,2,7); rect(shade,15,68,2,9); }
    c.restore();
  }
  function draw() {
    ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, 320, 400);
    const key=game.level+':'+Boolean(game.boss);
    if(!backdrop||backdropKey!==key){
      backdrop=document.createElement('canvas');backdrop.width=320;backdrop.height=400;backdropKey=key;
      const front=ctx;ctx=backdrop.getContext('2d');
    ctx.fillStyle = game.boss ? '#271c25' : ['#14222a','#172820','#1b2331','#2a211d'][game.level % 4]; ctx.fillRect(0, 0, 320, 400);
    // Original repeating circuit-like pixel pattern; never sampled from the ROM.
    ctx.strokeStyle = game.boss ? '#482831' : ['#1c2c33','#21332a','#242d3c','#382c24'][game.level % 4]; ctx.lineWidth = 1;
    for (let y = 48; y < 398; y += 18) for (let x = 25; x < 300; x += 24) {
      ctx.strokeRect(x + .5, y + .5, 13, 8); ctx.fillStyle = '#738d6930'; ctx.fillRect(x + 3, y + 3, 2, 2);
    }
    ctx.fillStyle = '#121b21'; ctx.fillRect(0, 0, 320, 40);
    for (const x of [9, 303]) {
      ctx.fillStyle = '#718079'; ctx.fillRect(x, 40, 8, 360); ctx.fillStyle = '#a6b0a0'; ctx.fillRect(x + 1, 40, 2, 360);
      ctx.fillStyle = '#34453f'; ctx.fillRect(x + 6, 40, 2, 360);
      for (let y = 48; y < 400; y += 31) { ctx.fillStyle = '#263d37'; ctx.fillRect(x, y, 8, 2); ctx.fillStyle = '#b45e48'; ctx.fillRect(x + 2, y + 8, 4, 7); ctx.fillStyle = '#dc9a73'; ctx.fillRect(x + 2, y + 8, 4, 1); }
    }
    ctx.fillStyle = '#566a60'; ctx.fillRect(17, 39, 286, 3); ctx.fillStyle = '#a8b4a0'; ctx.fillRect(17,39,286,1);
    for (const gateX of [58, 250]) {
      ctx.fillStyle = '#111b20'; ctx.fillRect(gateX - 2, 38, 16, 7);
      ctx.fillStyle = '#8b9682'; ctx.fillRect(gateX - 3, 38, 2, 8); ctx.fillRect(gateX + 13, 38, 2, 8);
    }
      ctx=front;
    }
    ctx.drawImage(backdrop,0,0);
    smallText('SCORE', 23, 13, '#829887', 'left', 6); smallText('BEST', 121, 13, '#829887', 'left', 6); smallText('ROUND', 269, 13, '#829887', 'center', 6);
    smallText(String(game.score).padStart(6,'0'), 23, 26, '#e5e6c8', 'left', 10);
    smallText(String(game.best).padStart(6,'0'), 121, 26, '#d9bf7b', 'left', 10);
    smallText(String(game.level + 1).padStart(2,'0') + '/' + C.LEVELS.length, 269, 26, '#d1dbb7', 'center', 9);
    if (game.warpOpen) {
      ctx.fillStyle = '#1b1523'; ctx.fillRect(300, 351, 12, 28);
      ctx.fillStyle = '#c387b7'; ctx.fillRect(300, 350, 12, 2); ctx.fillRect(300, 379, 12, 2);
      smallText('›', 307, 371, '#f1c9e2', 'center', 17);
      smallText('出口 →', 294, 346, '#e5b7d4', 'right', 8);
    }
    if (game.boss) {
      const boss = game.boss, death = boss.hp <= 0;
      const fade = death ? Math.max(0, (bossDeathUntil - uiTime) / .9) : 1;
      ctx.globalAlpha = fade;
      renderBoss(ctx, boss, boss.age || 0, (boss.age || 0) < bossPulse);
      ctx.globalAlpha = 1;
      smallText('DOH', 28, 56, '#e6b38b', 'left', 8);
      ctx.fillStyle = '#0c151b'; ctx.fillRect(56,49,180,8);
      ctx.fillStyle = boss.flash > 0 ? '#fff1b6' : '#cb765f'; ctx.fillRect(58,51,176 * Math.max(0,boss.hp) / boss.maxHp,4);
      smallText(Math.max(0,boss.hp) + '/' + boss.maxHp, 291, 56, '#e6b38b', 'right', 8);
      for (const shot of game.bossShots || []) {
        const sx = Math.round(shot.x), sy = Math.round(shot.y), r = shot.r || 4;
        ctx.fillStyle = '#b84942'; ctx.fillRect(sx-r,sy-r,r*2,r*2);
        ctx.fillStyle = '#ecab6b'; ctx.fillRect(sx-r+1,sy-r+1,r*2-2,r*2-2);
        ctx.fillStyle = '#fff0bb'; ctx.fillRect(sx-1,sy-2,2,3);
      }
    }
    for (const b of game.bricks) if (b.hp > 0) renderBrick(ctx, b);
    for (const enemy of game.enemies) if (!enemy.dead) {
      const x = Math.round(enemy.x), y = Math.round(enemy.y), colors = ['#a3b5c5','#bc8e7d','#a09cc6','#a1b983'];
      ctx.fillStyle = '#10151b'; ctx.fillRect(x + 1, y + 2, 12, 11);
      ctx.fillStyle = colors[enemy.shape];
      if (enemy.shape === 0) { ctx.fillRect(x + 2, y, 8, 12); ctx.fillRect(x, y + 3, 12, 6); }
      else if (enemy.shape === 1) { for (let row = 0; row < 6; row++) ctx.fillRect(x + 5 - row, y + row * 2, 2 + row * 2, 2); }
      else if (enemy.shape === 2) { ctx.fillRect(x + 3, y, 6, 6); ctx.fillRect(x, y + 6, 6, 6); ctx.fillRect(x + 6, y + 6, 6, 6); }
      else { ctx.fillRect(x + 1, y + 1, 10, 10); ctx.fillRect(x, y + 4, 12, 4); }
      ctx.fillStyle = '#e8ead6'; ctx.fillRect(x + 3, y + 3, 2, 2); ctx.fillRect(x + 7, y + 3, 2, 2);
      ctx.fillStyle = '#42515b'; ctx.fillRect(x + 4, y + 8, 4, 2);
    }
    for (const p of particles) { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.color; ctx.fillRect(Math.round(p.x),Math.round(p.y),p.size,p.size); } ctx.globalAlpha = 1;
    for (const cap of game.capsules) {
      const x = Math.round(cap.x - 8), y = Math.round(cap.y - 4); ctx.fillStyle = '#111819'; ctx.fillRect(x, y + 1, 17, 8);
      ctx.fillStyle = C.POWER_INFO[cap.type].color; ctx.fillRect(x + 1, y, 14, 8); ctx.fillRect(x, y + 2, 16, 4);
      ctx.fillStyle = '#ffffff66'; ctx.fillRect(x + 2, y + 1, 12, 1); ctx.fillStyle = '#00000030'; ctx.fillRect(x + 2, y + 6, 12, 1);
      smallText(cap.type, x + 8, y + 6, '#fff6d5', 'center', 7);
    }
    const pad = game.paddle, px = Math.round(pad.x - pad.width / 2), py = pad.y;
    ctx.fillStyle = '#0b1014'; ctx.fillRect(px - 1, py + 2, pad.width + 2, 8);
    ctx.fillStyle = game.power === 'C' ? '#c4ad55' : '#c9d5c4'; ctx.fillRect(px + 3, py, pad.width - 6, 7);
    ctx.fillStyle = '#f2ebc8'; ctx.fillRect(px + 4, py, pad.width - 8, 2);
    ctx.fillStyle = '#768a80'; ctx.fillRect(px + 5, py + 5, pad.width - 10, 2);
    ctx.fillStyle = game.power === 'L' ? '#e59864' : '#bb6153'; ctx.fillRect(px, py + 1, 7, 6); ctx.fillRect(px + pad.width - 7, py + 1, 7, 6);
    ctx.fillStyle = '#e99b76'; ctx.fillRect(px + 1, py, 5, 1); ctx.fillRect(px + pad.width - 6, py, 5, 1);
    if (game.power === 'L') { ctx.fillStyle = '#e3bb70'; ctx.fillRect(px + 2, py - 5, 3, 7); ctx.fillRect(px + pad.width - 5, py - 5, 3, 7); }
    for (const laser of game.lasers) { ctx.fillStyle = '#e2ae5d'; ctx.fillRect(Math.round(laser.x - 1),Math.round(laser.y - 5),2,7); ctx.fillStyle = '#fff0c8'; ctx.fillRect(Math.round(laser.x),Math.round(laser.y - 5),1,5); }
    for (const ball of game.balls) {
      if (!reduced) ball.trail.forEach((p, i) => { ctx.fillStyle = '#b0cfb2'; ctx.globalAlpha = i * .07; ctx.fillRect(Math.round(p.x - 2),Math.round(p.y - 2),4,4); });
      ctx.globalAlpha = 1; const x = Math.round(ball.x), y = Math.round(ball.y); ctx.fillStyle = '#91b9aa'; ctx.fillRect(x - 2,y - 3,4,6); ctx.fillRect(x - 3,y - 2,6,4); ctx.fillStyle = '#f0f0cf'; ctx.fillRect(x - 2,y - 2,4,4); ctx.fillStyle = '#fff8e4'; ctx.fillRect(x - 1,y - 2,2,2);
    }
    if (game.state === 'title') {
      ctx.font = 'bold 28px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#6c6251'; ctx.fillText('BRICK',162,196); ctx.fillStyle = '#d6c47d'; ctx.fillText('BRICK',160,194);
      smallText('B R E A K E R',160,212,'#bac6ac','center',11);
      smallText('THE SIMPLE THINGS STILL FEEL GOOD.',160,230,'#718e80','center',5);
    }
    if (game.state === 'ready') smallText('左键 / 空格发球',160,337,'#ced7b0','center',9);
    else if (game.state === 'playing' && game.balls.some(b => b.attached)) smallText('已接住 · 左键再次发球',160,337,'#e1d49b','center',8);
    ctx.fillStyle = '#14201dd9'; ctx.fillRect(18,383,284,17);
    for (let i = 0; i < game.lives; i++) { ctx.fillStyle = '#c67762'; ctx.fillRect(25 + i * 10,389,7,3); ctx.fillStyle = '#e3d8b3'; ctx.fillRect(27 + i * 10,388,3,4); }
    const label = game.warpOpen ? '传送出口 →' : game.power ? C.POWER_INFO[game.power].name : game.balls.length > 1 ? '三球同屏' : '普通挡板';
    smallText(label,294,393,'#9db29c','right',7);
  }
  function handleEvents() {
    const events = game.drainEvents(); let brickSound = false;
    for (const event of events) {
      if (event.type === 'bossintro') { bossPulse = 0; notify('最终关 DOH · 瞄准石像，避开火球',2.6); beep(130,.25,.03,65); }
      if (event.type === 'bossshoot') { bossPulse = (game.boss?.age || 0) + .3; beep(130,.12,.02,340); }
      if (event.type === 'bosshit') { beep(85,.1,.03,220); if (!reduced) for (let i=0;i<8;i++) particles.push({x:event.x,y:event.y,vx:(Math.random()-.5)*100,vy:(Math.random()-.5)*100,life:.35,max:.35,size:2,color:'#e5b58b'}); }
      if (event.type === 'bossdefeat') {
        bossDeathUntil = uiTime + .9; bossPulse = 0;
        [110,85,55].forEach((n,i)=>beep(n,.2,.035,35,i*.17));
        if (!reduced) for (let i=0;i<65;i++) particles.push({x:event.x+(Math.random()-.5)*60,y:event.y+(Math.random()-.5)*80,vx:(Math.random()-.5)*180,vy:-40-Math.random()*130,life:1.2,max:1.2,size:2+i%4,color:['#dca27c','#a96953','#ffe1aa'][i%3]});
      }
      if (event.type === 'brick') {
        if (!brickSound) { beep(520 + Math.min(game.level * 45, 240), .045, .015, 390); brickSound = true; }
        if (!reduced) for (let i = 0; i < 5; i++) particles.push({ x:event.x,y:event.y,vx:(Math.random()-.5)*68,vy:-15-Math.random()*47,life:.34,max:.34,size:i%2+1,color:COLORS[event.color] });
      }
      if (event.type === 'armor' || event.type === 'metal') beep(event.type === 'metal' ? 1000 : 760,.025,.012,530);
      if (event.type === 'enemy') { beep(610,.06,.016,260); if (!reduced) for (let i = 0; i < 5; i++) particles.push({ x:event.x,y:event.y,vx:(Math.random()-.5)*50,vy:-20-Math.random()*30,life:.3,max:.3,size:2,color:'#b1bfcc' }); }
      if (event.type === 'paddle') beep(240,.045,.025,320);
      if (event.type === 'wall') beep(165,.02,.01,150);
      if (event.type === 'launch') beep(330,.07,.022,500);
      if (event.type === 'laser') beep(950,.045,.015,300);
      if (event.type === 'catch') { beep(200,.06,.022,230); notify('接住了 · 左键重新发球',1.4); }
      if (event.type === 'power') { beep(420,.08,.025,680); beep(780,.1,.02,900,.08); notify(t(C.POWER_INFO[event.power].name) + ' · ' + t(C.POWER_INFO[event.power].detail),2.8); }
      if (event.type === 'life') { beep(190,.24,.03,65); notify(game.lives > 0 ? t('别急，还剩 {lives} 条生命',{lives:game.lives}) : '本局结束',1.7); }
      if (event.type === 'levelclear' || event.type === 'win') { [440,550,660,880].forEach((n,i) => beep(n,.13,.024,n,i*.12)); $('toast').classList.add('hidden'); }
      if (event.type === 'gameover') { beep(180,.4,.025,55); $('toast').classList.add('hidden'); }
    }
    if (game.best !== storedBest) { storedBest = game.best; save(); }
  }
  function showLevelPage(page) {
    levelPage = page;
    document.querySelectorAll('.level-card').forEach((card,index) => { card.hidden = Math.floor(index / 12) !== page; });
    document.querySelectorAll('.level-page').forEach((button,index) => button.setAttribute('aria-pressed', String(index === page)));
    $('level-grid').scrollTop = 0;
  }
  for (let page=0;page<Math.ceil(C.LEVELS.length/12);page++) {
    const tab = document.createElement('button'); tab.className = 'level-page';
    tab.textContent = String(page*12+1).padStart(2,'0') + '—' + String(Math.min((page+1)*12,C.LEVELS.length)).padStart(2,'0');
    tab.setAttribute('aria-label',t('选择第 {first} 至 {last} 关',{first:page*12+1,last:Math.min((page+1)*12,C.LEVELS.length)}));
    tab.addEventListener('click',()=>showLevelPage(page)); $('level-pages').append(tab);
  }
  C.LEVELS.forEach((level,index) => {
    const button = document.createElement('button'); button.className = 'level-card'; button.setAttribute('aria-label', t('从第 {n} 关 {name} 开始',{n:index+1,name:t(level.name)}));
    const mini = document.createElement('canvas'); mini.width = 144; mini.height = 112; mini.setAttribute('aria-hidden','true');
    const m = mini.getContext('2d'); m.fillStyle = '#17212a'; m.fillRect(0,0,144,112); if (level.boss) renderBoss(m,{x:49,y:7,w:46,h:60,hp:16,maxHp:16}); else { m.scale(.48,.48); m.translate(-10,-57); C.buildBricks(index).forEach(b => renderBrick(m,b)); }
    const n = document.createElement('b'); n.textContent = level.boss ? 'FINAL · DOH' : 'ROUND ' + String(index + 1).padStart(2,'0'); const name = document.createElement('span'); name.textContent = t(level.name);
    button.append(mini,n,name); button.addEventListener('click', () => { const ongoing = !['title','win','gameover'].includes(game.state); closeDialog($('levels-dialog')); if (ongoing) requestRestart(index,true); else start(index); }); $('level-grid').append(button);
  });
  showLevelPage(0);
  function frame(time) {
    const dt = last ? Math.min((time - last) / 1000, .05) : 0; last = time; uiTime += dt;
    if (!anyDialog()) game.step(dt, currentInput());
    if (game.state !== 'paused') { for (const p of particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 80 * dt; } particles = particles.filter(p => p.life > 0); }
    handleEvents(); sync(); draw();
    if (uiTime >= toastUntil) $('toast').classList.add('hidden');
    requestAnimationFrame(frame);
  }
  window.addEventListener('arcade-language-change',()=>{oldState='';oldLevel=-1;updateSound();sync();document.querySelectorAll('.level-card').forEach((button,index)=>{button.setAttribute('aria-label',t('从第 {n} 关 {name} 开始',{n:index+1,name:t(C.LEVELS[index].name)}));button.querySelector('span').textContent=t(C.LEVELS[index].name);});draw();});
  updateSound(); sync(); draw(); requestAnimationFrame(frame);
})();

// The first scene and controls are now initialized.
window.ArcadeGameLoader?.ready();
