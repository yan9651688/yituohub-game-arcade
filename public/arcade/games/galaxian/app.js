(function () {
  'use strict';
  const { Game, WIDTH, HEIGHT, waveIndicator } = window.ClassicSwarm;
  const $ = id => document.getElementById(id);
  const T=(s,p)=>window.ArcadeI18n?window.ArcadeI18n.t(s,p):s.replace(/\{(\w+)\}/g,(_,k)=>p?.[k]??'{'+k+'}');
  const storage = { get(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch (_) { return fallback; } }, set(key, value) { try { localStorage.setItem(key, value); } catch (_) {} } };
  const savedScore = Number(storage.get('classic-arcade:highscore:v1', '0'));
  const game = new Game({ highScore: Number.isFinite(savedScore) ? savedScore : 0 });
  const canvas = $('game'), ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const keys = new Set(), touch = { left: new Set(), right: new Set(), fire: new Set() };
  const heldControls = new Map(), mouseFire = new Set();
  let mousePressPending = false;
  // Combine independent sources: releasing one must not cancel another held input.
  const input = () => ({ left: keys.has('ArrowLeft') || keys.has('KeyA') || touch.left.size > 0, right: keys.has('ArrowRight') || keys.has('KeyD') || touch.right.size > 0, fire: keys.has('Space') || keys.has('KeyJ') || keys.has('KeyK') || touch.fire.size > 0 || mouseFire.size > 0 || mousePressPending });
  function releaseCapture(element, pointerId) { try { if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId); } catch (_) {} }
  function clearInput() {
    keys.clear(); for (const set of Object.values(touch)) set.clear();
    const controls = [...heldControls], mousePointers = [...mouseFire];
    heldControls.clear(); mouseFire.clear(); mousePressPending = false;
    for (const [pointerId, button] of controls) { button.classList.remove('is-held'); releaseCapture(button, pointerId); }
    for (const pointerId of mousePointers) releaseCapture(canvas, pointerId);
  }
  function canHoldInput() { return ['playing', 'ready', 'waveclear'].includes(game.state) && !game.paused && !anyDialog(); }
  const palette = { W: '#eef8de', C: '#68d4d5', R: '#ee5c54', G: '#6ddd81', Y: '#f2cd69', V: '#bc85e7', B: '#6e92e5', O: '#f3a35b', D: '#354b35', '.': null };
  const sprites = {
    player: ['......R......','......R......','.....WWW.....','.....WCW.....','.....WCW.....','W....WCW....W','WW...WCW...WW','WWWWWWWWWWWWW','..WWWWCWWWW..','...WWWWWWW...','....W...W....','....R...R....'],
    green: ['..G.....G..','...G...G...','..GGGGGGG..','.GGWGGGWGG.','GGGGGGGGGGG','G.GGGGGGG.G','G.G.....G.G','...GG.GG...'],
    violet: ['..V.....V..','V..V...V..V','VVVVVVVVVVV','.VVWVVVWVV.','..VVVVVVV..','.VVV.V.VVV.','VV.V...V.VV','V.........V'],
    red: ['...R...R...','R...R.R...R','RRRRRRRRRRR','.RRWRRWRRR.','..RRRRRRR..','.RRR...RRR.','RR.R...R.RR','..R.....R..'],
    flagship: ['.....YY.....','...YYYYYY...','.OOYYYYYYOO.','OOOYYWWYYOOO','OOYYYYYYYYOO','..YYYYYYYY..','...YY..YY...','..YY....YY..','..Y......Y..']
  };
  const glyphs = {
    '0':['111','101','101','101','111'],'1':['010','110','010','010','111'],'2':['111','001','111','100','111'],'3':['111','001','111','001','111'],'4':['101','101','111','001','001'],'5':['111','100','111','001','111'],'6':['111','100','111','101','111'],'7':['111','001','010','010','010'],'8':['111','101','111','101','111'],'9':['111','101','111','001','111'],
    A:['010','101','111','101','101'],B:['110','101','110','101','110'],C:['111','100','100','100','111'],D:['110','101','101','101','110'],E:['111','100','110','100','111'],F:['111','100','110','100','100'],G:['111','100','101','101','111'],H:['101','101','111','101','101'],I:['111','010','010','010','111'],J:['001','001','001','101','111'],K:['101','101','110','101','101'],L:['100','100','100','100','111'],M:['10001','11011','10101','10101','10001'],N:['1001','1101','1011','1001','1001'],O:['111','101','101','101','111'],P:['111','101','111','100','100'],Q:['111','101','101','111','001'],R:['110','101','110','101','101'],S:['111','100','111','001','111'],T:['111','010','010','010','010'],U:['101','101','101','101','111'],V:['101','101','101','101','010'],W:['10001','10001','10101','11011','10001'],X:['101','101','010','101','101'],Y:['101','101','010','010','010'],Z:['111','001','010','100','111'],'-':['000','000','111','000','000'],'.':['0','0','0','0','1'],' ':['00','00','00','00','00'],'!':['1','1','1','0','1']
  };
  function pixelText(text, x, y, color = '#e8efd8', scale = 1, align = 'left') {
    let width = 0; for (const char of text) width += ((glyphs[char] || glyphs[' '])[0].length + 1) * scale;
    if (align === 'center') x -= (width - scale) / 2; if (align === 'right') x -= width - scale;
    ctx.fillStyle = color; x = Math.round(x);
    for (const char of text) { const rows = glyphs[char] || glyphs[' ']; rows.forEach((row, yy) => [...row].forEach((cell, xx) => { if (cell === '1') ctx.fillRect(x + xx * scale, Math.round(y) + yy * scale, scale, scale); })); x += (rows[0].length + 1) * scale; }
  }
  const spriteRuns={};
  for(const [type,rows] of Object.entries(sprites)){
    spriteRuns[type]=[0,1].map(frame=>{const runs=[],hw=Math.floor(rows[0].length/2),hh=Math.floor(rows.length/2);
      for(let yy=0;yy<rows.length;yy++){let xx=0;while(xx<rows[yy].length){const cell=rows[yy][xx];if(cell==='.'){xx++;continue;}const py=yy-hh-(type!=='player'&&frame&&(xx<2||xx>=rows[yy].length-2)&&yy>3?2:0);let end=xx+1;while(type!=='player'&&end<rows[yy].length&&rows[yy][end]===cell&&yy-hh-(type!=='player'&&frame&&(end<2||end>=rows[yy].length-2)&&yy>3?2:0)===py)end++;runs.push([xx-hw,py,end-xx,palette[cell]]);xx=end;}}
      return runs;
    });
  }
  // Rotated unit pixels retain the original anti-aliased silhouette at diagonal angles.
  const spritePixels={};for(const[type,frames]of Object.entries(spriteRuns))spritePixels[type]=frames.map(runs=>runs.flatMap(([x,y,w,c])=>Array.from({length:w},(_,i)=>[x+i,y,1,c])));
  function sprite(target,type,x,y,frame=0,angle=0,alpha=1){
    target.save();target.globalAlpha=alpha;target.translate(Math.round(x),Math.round(y));
    if(angle)target.rotate(Math.round(angle/(Math.PI/4))*Math.PI/4);
    let color='';for(const[px,py,width,c]of (angle?spritePixels:spriteRuns)[type][frame?1:0]){if(c!==color){target.fillStyle=c;color=c;}target.fillRect(px,py,width,1);}target.restore();
  }
  for (const preview of document.querySelectorAll('.enemy-preview')) { const p = preview.getContext('2d'); p.imageSmoothingEnabled = false; p.scale(2, 2); sprite(p, preview.dataset.type, 6, 6); }
  let starSeed = 1007;
  const stars = Array.from({ length: 62 }, () => { const rand = () => { starSeed = (Math.imul(starSeed, 1664525) + 1013904223) >>> 0; return starSeed / 4294967296; }; return { x: Math.floor(rand() * WIDTH), y: rand() * HEIGHT, speed: 2 + rand() * 5, shade: ['#2b3d36','#3b3744','#41412c','#283b45'][Math.floor(rand() * 4)], blink: rand() * 10 }; });
  const audio = {
    enabled: storage.get('classic-arcade:sound:v1', '1') !== '0', context: null,
    unlock() { if (!this.enabled) return; try { if (!this.context) this.context = new (window.AudioContext || window.webkitAudioContext)(); if (this.context.state === 'suspended') this.context.resume().catch(() => {}); } catch (_) {} },
    tone(start, end, duration, type = 'square', volume = 0.025, delay = 0) { if (!this.enabled || !this.context || this.context.state !== 'running') return; try { const ac = this.context, t = ac.currentTime + delay, oscillator = ac.createOscillator(), gain = ac.createGain(); oscillator.type = type; oscillator.frequency.setValueAtTime(start, t); oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + duration); gain.gain.setValueAtTime(volume, t); gain.gain.exponentialRampToValueAtTime(0.0001, t + duration); oscillator.connect(gain); gain.connect(ac.destination); oscillator.start(t); oscillator.stop(t + duration + 0.01); } catch (_) {} },
    play(event) {
      if (event.type === 'shoot') this.tone(1350, 330, 0.075, 'square', 0.025);
      if (event.type === 'hit') { this.tone(170, 55, 0.12, 'sawtooth', 0.033); this.tone(event.points >= 300 ? 850 : 410, 110, 0.07, 'square', 0.015); }
      if (event.type === 'dive') this.tone(410, 75, 0.45, 'triangle', 0.014);
      if (event.type === 'death') { this.tone(95, 25, 0.65, 'sawtooth', 0.055); this.tone(210, 35, 0.37, 'square', 0.025); }
      if (['start','wave','clear','extraLife','gameover'].includes(event.type)) {
        const notes = event.type === 'gameover' ? [392,330,262,196] : event.type === 'extraLife' ? [523,659,784,1047] : [262,330,392,523];
        notes.forEach((note, i) => this.tone(note, note, event.type === 'gameover' ? 0.25 : 0.16, 'square', 0.02, i * 0.12));
      }
    },
    muteActive() { if (this.context && this.context.state === 'running') this.context.suspend().catch(() => {}); }
  };
  let toastUntil = 0, uiStamp = '', bestAtStart = game.highScore;
  function showToast(text, seconds = 2) { $('toast').textContent = T(text); $('toast').classList.remove('hidden'); toastUntil = performance.now() + seconds * 1000; }
  function updateSound() { $('sound-button').textContent = T(audio.enabled ? '声音 开' : '声音 关'); $('sound-button').setAttribute('aria-pressed', String(audio.enabled)); }
  function toggleSound() { audio.enabled = !audio.enabled; storage.set('classic-arcade:sound:v1', audio.enabled ? '1' : '0'); if (audio.enabled) { audio.unlock(); audio.tone(700, 700, 0.06); } else audio.muteActive(); updateSound(); }
  function startGame() { clearInput(); bestAtStart = game.highScore; game.start(); audio.unlock(); uiStamp = ''; syncUI(); canvas.focus({ preventScroll: true }); }
  function togglePause() { if (anyDialog()) return; game.togglePause(); clearInput(); if (game.paused) audio.muteActive(); else audio.unlock(); syncUI(); }
  function anyDialog() { return $('reference-dialog').open || $('restart-dialog').open; }
  function syncUI() {
    const stamp = game.state + ':' + game.paused;
    if (stamp === uiStamp) return; uiStamp = stamp;
    $('title-overlay').classList.toggle('hidden', game.state !== 'title');
    $('pause-overlay').classList.toggle('hidden', !game.paused || anyDialog());
    $('gameover-overlay').classList.toggle('hidden', game.state !== 'gameover');
    $('pause-button').disabled = game.state === 'title' || game.state === 'gameover';
    $('restart-button').disabled = game.state === 'title';
    $('pause-button').textContent = T(game.paused ? '继续' : '暂停');
    $('pause-button').setAttribute('aria-pressed', String(game.paused));
    if (game.state === 'gameover') { clearInput(); $('result-score').textContent = String(game.score).padStart(6, '0'); $('result-detail').textContent = T('第 {wave} 波 · 本局得分',{wave:game.wave}); $('over-title').textContent = T(game.score > bestAtStart ? '新的最高分！' : '再来一局？'); }
  }
  const dialogStates = new Map();
  function openDialog(id) { if (anyDialog()) return; const dialog = $(id); dialogStates.set(id, game.paused); game.pause(); clearInput(); audio.muteActive(); dialog.showModal(); uiStamp = ''; syncUI(); }
  function closeDialog(id) { const dialog = $(id); if (dialog.open) dialog.close(); }
  for (const id of ['reference-dialog', 'restart-dialog']) $(id).addEventListener('close', () => { if (dialogStates.get(id) === false) { game.resume(); audio.unlock(); } dialogStates.delete(id); clearInput(); uiStamp = ''; syncUI(); });
  function requestRestart() { if (game.state === 'title' || game.state === 'gameover') startGame(); else openDialog('restart-dialog'); }
  $('start-button').addEventListener('click', startGame); $('again-button').addEventListener('click', startGame);
  $('resume-button').addEventListener('click', togglePause); $('pause-button').addEventListener('click', togglePause);
  $('sound-button').addEventListener('click', toggleSound); $('restart-button').addEventListener('click', requestRestart);
  $('reference-button').addEventListener('click', () => openDialog('reference-dialog'));
  $('close-reference').addEventListener('click', () => closeDialog('reference-dialog')); $('reference-done').addEventListener('click', () => closeDialog('reference-dialog'));
  $('cancel-restart').addEventListener('click', () => closeDialog('restart-dialog'));
  $('confirm-restart').addEventListener('click', () => { dialogStates.set('restart-dialog', true); closeDialog('restart-dialog'); startGame(); });
  document.addEventListener('keydown', event => {
    if (anyDialog() || event.ctrlKey || event.metaKey || event.altKey) return;
    const handled = ['ArrowLeft','ArrowRight','KeyA','KeyD','Space','KeyJ','KeyK','Enter','KeyP','Escape','KeyR','KeyM'];
    if (!handled.includes(event.code)) return;
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (['Space','Enter'].includes(event.code) && event.target.closest('button, a')) return;
    event.preventDefault(); audio.unlock();
    if (['ArrowLeft','ArrowRight','KeyA','KeyD','Space','KeyJ','KeyK'].includes(event.code)) keys.add(event.code);
    if (event.repeat) return;
    if (event.code === 'Enter' && (game.state === 'title' || game.state === 'gameover')) startGame();
    if (event.code === 'KeyP' || event.code === 'Escape') togglePause();
    if (event.code === 'KeyR') requestRestart(); if (event.code === 'KeyM') toggleSound();
  });
  document.addEventListener('keyup', event => keys.delete(event.code));
  // Acquire mouse fire only on the canvas, never on surrounding UI or overlays.
  // A one-tick press buffer also catches quick clicks entirely between animation frames.
  canvas.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || !canHoldInput()) return;
    event.preventDefault(); canvas.focus({ preventScroll: true }); audio.unlock();
    mouseFire.add(event.pointerId); mousePressPending = true;
    try { canvas.setPointerCapture(event.pointerId); } catch (_) {}
  });
  function releaseMouseFire(event) {
    if (!mouseFire.delete(event.pointerId)) return;
    if (event.type === 'pointercancel' || event.type === 'lostpointercapture') mousePressPending = false;
    releaseCapture(canvas, event.pointerId);
  }
  canvas.addEventListener('lostpointercapture', releaseMouseFire);
  // Window fallbacks also cover release outside the board if capture is unavailable.
  window.addEventListener('pointerup', releaseMouseFire);
  window.addEventListener('pointercancel', releaseMouseFire);
  window.addEventListener('pointermove', event => {
    // Chorded mouse buttons do not emit pointerup until the final button is released.
    if (!(event.buttons & 1)) releaseMouseFire(event);
  });
  canvas.addEventListener('contextmenu', event => event.preventDefault());
  function holdButton(id, action) {
    const button = $(id);
    button.addEventListener('pointerdown', event => { if (event.button !== 0 || !canHoldInput()) return; event.preventDefault(); audio.unlock(); touch[action].add(event.pointerId); heldControls.set(event.pointerId, button); button.classList.add('is-held'); try { button.setPointerCapture(event.pointerId); } catch (_) {} });
    const release = event => { touch[action].delete(event.pointerId); heldControls.delete(event.pointerId); if (!touch[action].size) button.classList.remove('is-held'); releaseCapture(button, event.pointerId); };
    button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release); button.addEventListener('contextmenu', event => event.preventDefault());
  }
  holdButton('left-button', 'left'); holdButton('right-button', 'right'); holdButton('fire-button', 'fire');
  function pauseForLeave() { clearInput(); if (!anyDialog()) game.pause(); audio.muteActive(); syncUI(); }
  window.addEventListener('blur', pauseForLeave);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseForLeave(); });
  function draw() {
    ctx.fillStyle = '#050909'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    for (const star of stars) {
      const y = reducedMotion ? star.y : (star.y + game.time * star.speed) % HEIGHT;
      if (y < 28 || y > 228) continue;
      ctx.fillStyle = star.shade; ctx.fillRect(star.x, Math.floor(y), 1, 1);
    }
    pixelText('1UP', 12, 7, '#df6b59'); pixelText('HI-SCORE', 128, 7, '#d6d7be', 1, 'center'); pixelText('WAVE', 244, 7, '#df6b59', 1, 'right');
    pixelText(String(game.score).padStart(6, '0'), 12, 16, '#eaf0d9'); pixelText(String(game.highScore).padStart(6, '0'), 128, 16, '#eaf0d9', 1, 'center'); pixelText(String(game.wave).padStart(2, '0'), 244, 16, '#eaf0d9', 1, 'right');
    const frame = Math.floor(game.time * 3) % 2;
    for (const enemy of game.enemies) if (enemy.alive) sprite(ctx, enemy.type, enemy.x, enemy.y, frame, enemy.mode !== 'formation' ? enemy.angle : 0);
    if (!['dying','gameover'].includes(game.state) && (game.player.invulnerable <= 0 || Math.floor(game.time * 12) % 2)) {
      sprite(ctx, 'player', game.player.x, game.player.y);
      if (!game.shot) { ctx.fillStyle = '#f5c4a2'; ctx.fillRect(Math.round(game.player.x), game.player.y - 8, 1, 2); }
    }
    if (game.shot) { ctx.fillStyle = '#f5e7bd'; ctx.fillRect(Math.round(game.shot.x), Math.round(game.shot.y), 1, 5); }
    ctx.fillStyle = '#f3ab77'; for (const bullet of game.bullets) { const x = Math.round(bullet.x), y = Math.round(bullet.y); ctx.fillRect(x, y, 1, 3); ctx.fillRect(x + (Math.floor(game.time * 12) % 2 ? 1 : -1), y + 2, 1, 2); }
    for (const effect of game.effects) {
      const p = 1 - effect.life / effect.max, size = effect.kind === 'player' ? 18 : 9;
      ctx.fillStyle = p < 0.3 ? '#ffecb0' : p < 0.65 ? '#ed935a' : '#a64e3d';
      for (let i = 0; i < 8; i++) { const angle = i * Math.PI / 4, r = 2 + p * size; ctx.fillRect(Math.round(effect.x + Math.cos(angle) * r), Math.round(effect.y + Math.sin(angle) * r), p < 0.5 ? 2 : 1, p < 0.5 ? 2 : 1); }
      if (p < 0.35) ctx.fillRect(Math.round(effect.x - 2), Math.round(effect.y - 2), 5, 5);
    }
    for (const popup of game.popups) pixelText(popup.text, popup.x, popup.y, '#f8ce70', 1, 'center');
    if (game.state === 'ready') { pixelText(`WAVE ${String(game.wave).padStart(2, '0')}`, 128, 155, '#e8d58c', 1, 'center'); if (Math.floor(game.stateTime * 4) % 2 === 0) pixelText('READY', 128, 168, '#d8e6cd', 1, 'center'); }
    if (game.state === 'waveclear') { pixelText('WAVE CLEAR', 128, 158, '#d8e6a1', 1, 'center'); pixelText('GOOD FLYING!', 128, 171, '#8cb782', 1, 'center'); }
    if (game.state === 'dying' && game.lives > 0 && game.stateTime > 0.7) pixelText('READY', 128, 162, '#d8e6cd', 1, 'center');
    for (let i = 0; i < Math.min(5, Math.max(0, game.lives - 1)); i++) { ctx.save(); ctx.translate(14 + i * 13, 234); ctx.scale(0.65, 0.65); sprite(ctx, 'player', 0, 0); ctx.restore(); }
    // FC display: one flag per current round through five, then one + its number.
    const indicator = waveIndicator(game.wave);
    for (let i = 0; i < indicator.flags; i++) { const x = 240 - i * 7; ctx.fillStyle = '#9fae86'; ctx.fillRect(x, 231, 1, 7); ctx.fillStyle = '#d65b45'; ctx.fillRect(x + 1, 231, 4, 3); }
    if (indicator.label) pixelText(indicator.label, 232, 232, '#c1cba4', 1, 'right');
  }
  let previous = performance.now(), accumulator = 0;
  function tick(now) {
    const elapsed = Math.min(0.1, Math.max(0, (now - previous) / 1000)); previous = now;
    if (!game.paused && !anyDialog()) { accumulator += elapsed; while (accumulator >= 1 / 60) { game.update(1 / 60, input()); mousePressPending = false; accumulator -= 1 / 60; } } else accumulator = 0;
    for (const event of game.drainEvents()) { audio.play(event); if (event.type === 'highscore') storage.set('classic-arcade:highscore:v1', String(event.score)); if (event.type === 'extraLife') showToast('5,000 分！额外飞机 +1'); }
    if (toastUntil && now > toastUntil) { $('toast').classList.add('hidden'); toastUntil = 0; }
    syncUI(); draw(); requestAnimationFrame(tick);
  }
  window.addEventListener('arcade-language-change',()=>{uiStamp='';updateSound();syncUI();draw();});
  updateSound(); syncUI(); draw(); requestAnimationFrame(tick);
})();

// The first scene and controls are now initialized.
window.ArcadeGameLoader?.ready();
