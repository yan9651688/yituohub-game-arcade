import { LEVELS } from './levels.js';
import { GameEngine, WEAPONS } from './engine.js';
import { GameRenderer } from './render.js';
import { GameAudio } from './audio.js';

const $ = id => document.getElementById(id);
const SAVE_KEY = 'neon.contra2026.v1';
const freshSave = { best: 0, unlocked: 0, resume: 0, completed: false, muted: false, quality: 'high', difficulty: 'classic' };
let save = { ...freshSave };
try {
  const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
  if (raw && typeof raw === 'object') save = { ...freshSave, best: Math.max(0, Number(raw.best) || 0), unlocked: Math.max(0, Math.min(7, Number(raw.unlocked) || 0)), resume: Math.max(0, Math.min(7, Number(raw.resume) || 0)), completed: !!raw.completed, muted: !!raw.muted, quality: raw.quality === 'low' ? 'low' : 'high', difficulty: ['assist', 'classic', 'veteran'].includes(raw.difficulty) ? raw.difficulty : 'classic' };
} catch { /* Private browsing can disable persistent storage. */ }
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* Playing does not require storage. */ } };
let touch = matchMedia('(pointer: coarse)').matches;
document.body.classList.toggle('touch', touch);
const keys = new Set(), touchInput = { x: 0, y: 0, jump: false, shoot: false };
const audio = new GameAudio(); audio.setMuted(save.muted);
let renderer, players = 1, difficulty = save.difficulty, toastTime = 0, displayedMode = '', resultMode = '', lastTime = performance.now(), accumulator = 0, lastHud = 0, padPaused = false, fps = 60;

function toast(text, kicker = 'FIELD UPDATE', seconds = 2.3) {
  $('toast-text').textContent = text; $('toast-kicker').textContent = kicker; $('toast').hidden = false; toastTime = seconds;
}
function event(type, data) {
  if (type === 'level') {
    renderer?.setLevel(data.level); audio.setTheme(data.level.theme);
    $('mission-name').textContent = data.level.name; $('mission-objective').textContent = data.level.subtitle;
    $('sector-number').textContent = `SECTOR ${String(data.index + 1).padStart(2, '0')} / 08`;
    $('scene-name').textContent = data.level.name;
    toast(data.level.name, `${String(data.index + 1).padStart(2, '0')} / ${data.level.en}`, 2.4);
  } else if (type === 'start') {
    audio.setPaused(false); if (!data.training) { save.resume = data.index; save.difficulty = difficulty; persist(); }
  } else if (type === 'pickup') { audio.play('pickup'); toast(data.name, `${data.type} / SUPPLY ACQUIRED`, 1.8); }
  else if (type === 'checkpoint') { audio.play('ui'); toast('检查点已激活', 'CHECKPOINT', 1.5); }
  else if (type === 'room') { $('mission-objective').textContent = `闸门 ${data.index + 1} / 6 · ${data.name}`; toast(data.name, `ROOM ${data.index + 1} / 06`, 1.7); }
  else if (type === 'gate') { audio.play('clear'); toast('防线解除 · 前进', 'GATE OPEN', 1.3); }
  else if (type === 'boss') { audio.play('boss'); toast(data.name.split(' · ')[0], 'WARNING / BOSS APPROACHING', 2.5); }
  else if (type === 'clear') {
    audio.play('clear');
    if (!data.training) { save.best = Math.max(save.best, data.score); save.unlocked = Math.max(save.unlocked, Math.min(7, data.index + 1)); save.resume = data.final ? 0 : data.index + 1; save.completed ||= data.final; persist(); }
  } else if (type === 'gameover') { if (!engine.state.training) { save.best = Math.max(save.best, engine.state.score); persist(); } }
  else if (type === 'pause') audio.setPaused(true);
  else if (type === 'resume') audio.setPaused(false);
  else audio.play(type, data?.large ? 1.2 : 1);
}
const engine = new GameEngine(LEVELS, event);

function setDifficulty(value) {
  difficulty = value;
  document.querySelectorAll('[data-difficulty]').forEach(button => { const selected = button.dataset.difficulty === value; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', selected); });
  $('difficulty-note').textContent = { assist: '3 格装甲 · 30 条生命 · 更缓和的敌弹', classic: '一击倒下 · 30 条生命 · 检查点继续', veteran: '一击倒下 · 30 条生命 · 更密集的交火' }[value];
}
function setPlayers(value) {
  players = value;
  document.querySelectorAll('[data-players]').forEach(button => { const selected = Number(button.dataset.players) === value; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', selected); });
  if (value === 2) toast('1P WASD + J/K · 2P 方向键 + 小键盘1/2', 'LOCAL CO-OP', 4);
}
function updateButtons() {
  $('sound-btn').textContent = `声音 ${save.muted ? '关' : '开'}`; $('sound-btn').setAttribute('aria-pressed', !save.muted);
  $('quality-btn').textContent = `画质 ${save.quality === 'low' ? '流畅' : '高'}`;
  $('best-label').textContent = `BEST ${String(save.best).padStart(6, '0')}`;
  $('continue-btn').hidden = save.resume === 0;
  $('continue-btn').innerHTML = `继续第 ${save.resume + 1} 关 · ${LEVELS[save.resume].name} <span>→</span>`;
}
async function start(index = 0, training = false) {
  audio.unlock().catch(() => {}); audio.setPaused(false);
  keys.clear(); touchInput.jump = false; touchInput.shoot = false; touchInput.x = 0; touchInput.y = 0;
  $('stage-select').hidden = true; $('pause-screen').hidden = true; $('result-screen').hidden = true;
  engine.start(index, { difficulty, players, training }); engine.state.quality = save.quality;
  const width = renderer.camera.right - renderer.camera.left, s = engine.state;
  s.viewWidth = width;
  const half = Math.min(width / 2, s.level.length / 2);
  if (s.level.mode !== 'base') s.camera.x = Math.max(half, Math.min(s.level.length - half, s.level.spawn.x + (s.level.mode === 'vertical' ? 0 : Math.min(5, half * .4))));
  displayedMode = ''; syncMode(); $('world').focus?.();
}
function home() {
  keys.clear(); audio.setPaused(true); engine.preview(0); engine.state.quality = save.quality;
  engine.state.players[0].x = 23; engine.state.players[0].invuln = 0;
  engine.state.players[0].grounded = true; engine.state.players[0].y = 0; engine.state.camera.x = 16;
  $('stage-select').hidden = true; $('pause-screen').hidden = true; $('result-screen').hidden = true;
  $('toast').hidden = true; toastTime = 0; displayedMode = ''; updateButtons(); syncMode();
}
function stageSelect() {
  if (engine.state.mode === 'playing') engine.pause();
  $('stage-select').hidden = false; audio.play('ui');
}
function closeStages() { $('stage-select').hidden = true; if (engine.state.mode === 'paused') $('pause-screen').hidden = false; }
function pauseToggle() {
  if (engine.state.mode === 'playing') engine.pause();
  else if (engine.state.mode === 'paused' && $('stage-select').hidden) engine.resume();
  keys.clear(); touchInput.shoot = false; touchInput.jump = false;
  syncMode();
}
function syncMode() {
  const s = engine.state; if (displayedMode === s.mode) return; displayedMode = s.mode;
  document.body.dataset.mode = s.mode;
  $('home').hidden = s.mode !== 'menu'; $('hud').hidden = s.mode === 'menu';
  $('pause-btn').hidden = s.mode !== 'playing' && s.mode !== 'paused';
  $('touch-controls').hidden = !touch || s.mode !== 'playing';
  $('pause-screen').hidden = s.mode !== 'paused';
  $('result-screen').hidden = !['clear', 'gameover', 'victory'].includes(s.mode);
  $('training-label').hidden = !s.training;
  if (['clear', 'gameover', 'victory'].includes(s.mode)) showResult(s.mode);
}
function showResult(mode) {
  const s = engine.state; resultMode = mode; keys.clear(); audio.setPaused(true);
  const info = mode === 'victory' ? ['ALL SECTORS SECURED', '回家吧，英雄。', '八道防线已经突破。硝烟散尽，这一次，世界等到了黎明。', '再次出击']
    : mode === 'clear' ? [`SECTOR ${String(s.index + 1).padStart(2, '0')} SECURED`, '防线，已突破。', `剩余 ${s.lives} 条命 · 下一站：${LEVELS[s.index + 1].name}。武器与剩余命数将带入下一关。`, '进入下一关']
    : ['MISSION INTERRUPTED', '战斗，还没结束。', `在${s.level.name}重新集结。30 条命，准备再来一次。`, '30 条命 · 再次挑战'];
  $('result-eyebrow').textContent = info[0]; $('result-title').textContent = info[1]; $('result-copy').textContent = info[2]; $('result-action').innerHTML = `${info[3]} <b>→</b>`;
  $('result-score').textContent = s.score.toLocaleString(); $('result-kills').textContent = s.kills;
  $('result-time').textContent = `${String(Math.floor(s.elapsed / 60)).padStart(2, '0')}:${String(Math.floor(s.elapsed % 60)).padStart(2, '0')}`;
}
function hud() {
  const s = engine.state, p = s.players.find(p => !p.dead) || s.players[0];
  $('score').textContent = String(s.score).padStart(6, '0'); $('lives').textContent = s.training ? '演练 · 无限续战' : `余命 × ${String(s.lives).padStart(2, '0')}`;
  $('mission-progress').style.width = `${Math.min(100, s.progress * 100)}%`;
  $('weapon-letter').textContent = p.weapon; $('weapon-name').textContent = WEAPONS[p.weapon]?.name || '制式步枪';
  $('player-status').innerHTML = s.players.map(p => `<div class="status-chip"><b>${p.id + 1}P</b><span class="hearts">${p.dead ? '等待增援' : '◆'.repeat(Math.max(0, p.hp)) + '◇'.repeat(Math.max(0, p.maxHp - p.hp))}</span>${p.invuln > 4 ? '<span>屏障</span>' : ''}</div>`).join('');
  const b = s.boss; $('boss-hud').hidden = !b || b.dead;
  if (b && !b.dead) { const pct = Math.max(0, b.hp / b.maxHp * 100); $('boss-name').textContent = b.name.split(' · ')[0]; $('boss-percent').textContent = `${Math.ceil(pct)}%`; $('boss-bar').style.width = `${pct}%`; }
  $('play-hint').hidden = s.time > 12 || !!b;
  $('damage-flash').style.opacity = String(Math.min(1, s.flash * 4));
}
function readInput() {
  const down = (...codes) => codes.some(code => keys.has(code));
  const result = [{ left: down('KeyA') || (players === 1 && down('ArrowLeft')) || touchInput.x < -.25,
    right: down('KeyD') || (players === 1 && down('ArrowRight')) || touchInput.x > .25,
    up: down('KeyW') || (players === 1 && down('ArrowUp')) || touchInput.y < -.3,
    down: down('KeyS') || (players === 1 && down('ArrowDown')) || touchInput.y > .3,
    jump: down('KeyK', 'Space') || touchInput.jump, shoot: down('KeyJ') || touchInput.shoot }];
  if (players === 2) result.push({ left: down('ArrowLeft'), right: down('ArrowRight'), up: down('ArrowUp'), down: down('ArrowDown'), jump: down('Numpad2', 'ShiftRight'), shoot: down('Numpad1', 'ControlRight') });
  const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
  let startDown = false;
  for (let i = 0; i < Math.min(result.length, pads.length); i++) {
    const pad = pads[i], p = result[i], pressed = n => !!pad.buttons[n]?.pressed;
    p.left ||= pad.axes[0] < -.28 || pressed(14); p.right ||= pad.axes[0] > .28 || pressed(15);
    p.up ||= pad.axes[1] < -.3 || pressed(12); p.down ||= pad.axes[1] > .3 || pressed(13);
    p.jump ||= pressed(0); p.shoot ||= pressed(2) || pressed(7); startDown ||= pressed(9);
  }
  if (startDown && !padPaused) pauseToggle(); padPaused = startDown;
  return result;
}

document.querySelectorAll('[data-difficulty]').forEach(button => button.addEventListener('click', () => { setDifficulty(button.dataset.difficulty); audio.play('ui'); }));
document.querySelectorAll('[data-players]').forEach(button => button.addEventListener('click', () => setPlayers(Number(button.dataset.players))));
for (const [id, handler] of Object.entries({ 'start-btn': () => start(0), 'continue-btn': () => start(save.resume), 'stages-btn': stageSelect, 'stage-close': closeStages, 'pause-btn': pauseToggle, 'resume-btn': pauseToggle,
  'retry-pause': () => start(engine.state.index, engine.state.training), 'home-pause': home, 'result-home': home, 'result-stages': stageSelect,
  'result-action': () => { if (resultMode === 'clear') { audio.setPaused(false); engine.next(); displayedMode = ''; syncMode(); } else start(resultMode === 'victory' ? 0 : engine.state.index, engine.state.training); } })) $(id).addEventListener('click', handler);
$('sound-btn').addEventListener('click', () => { save.muted = !save.muted; audio.setMuted(save.muted); audio.unlock().catch(() => {}); persist(); updateButtons(); });
$('quality-btn').addEventListener('click', () => { save.quality = save.quality === 'high' ? 'low' : 'high'; engine.state.quality = save.quality; persist(); updateButtons(); toast(save.quality === 'high' ? '高画质 · 柔和阴影' : '流畅模式 · 降低渲染负载', 'GRAPHICS'); });
$('fullscreen-btn').addEventListener('click', async () => { try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); } catch { toast('浏览器暂不支持全屏，横屏同样可以游玩', 'DISPLAY'); } });
for (const [index, level] of LEVELS.entries()) {
  const card = document.createElement('button'); card.className = 'stage-card'; card.dataset.stage = index; card.style.setProperty('--stage-color', level.palette.accent);
  card.innerHTML = `<span>SECTOR ${String(index + 1).padStart(2, '0')} / ${level.en}</span><b>${level.name}</b><small>${level.mode === 'base' ? '纵深基地 · 六道闸门' : level.mode === 'vertical' ? '瀑布攀登 · 垂直推进' : '横版突击 · 跑跳射击'}<br>${level.boss.name.split(' · ')[0]}</small><i>↗</i>`;
  card.addEventListener('click', () => start(index, true)); $('stage-grid').appendChild(card);
}
addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ControlRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'Escape' && !e.repeat) { if (!$('stage-select').hidden) closeStages(); else pauseToggle(); return; }
  if (e.code === 'KeyP' && !e.repeat) { pauseToggle(); return; }
  keys.add(e.code);
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => { keys.clear(); touchInput.jump = false; touchInput.shoot = false; });
document.addEventListener('visibilitychange', () => { if (document.hidden) { engine.pause(); keys.clear(); syncMode(); } });
addEventListener('contextmenu', e => { if (engine.state.mode === 'playing') e.preventDefault(); });
addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch' && !touch) { touch = true; document.body.classList.add('touch'); displayedMode = ''; syncMode(); }
}, { passive: true });
let joystickPointer = null;
function joystickMove(e) {
  const box = $('joystick').getBoundingClientRect(), radius = box.width * .35;
  const dx = e.clientX - box.left - box.width / 2, dy = e.clientY - box.top - box.height / 2;
  const distance = Math.hypot(dx, dy), scale = distance > radius ? radius / distance : 1;
  touchInput.x = dx * scale / radius; touchInput.y = dy * scale / radius;
  $('joy-stick').style.transform = `translate(${dx * scale}px,${dy * scale}px)`;
}
$('joystick').addEventListener('pointerdown', e => { e.preventDefault(); joystickPointer = e.pointerId; $('joystick').setPointerCapture(e.pointerId); joystickMove(e); });
$('joystick').addEventListener('pointermove', e => { if (e.pointerId === joystickPointer) joystickMove(e); });
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) $('joystick').addEventListener(type, e => { if (e.pointerId === joystickPointer) { joystickPointer = null; touchInput.x = 0; touchInput.y = 0; $('joy-stick').style.transform = ''; } });
for (const [id, action] of [['touch-jump', 'jump'], ['touch-fire', 'shoot']]) {
  const button = $(id); let pointer = null;
  button.addEventListener('pointerdown', e => { e.preventDefault(); pointer = e.pointerId; button.setPointerCapture(pointer); touchInput[action] = true; button.classList.add('pressed'); audio.unlock().catch(() => {}); });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, e => { if (pointer === e.pointerId) { pointer = null; touchInput[action] = false; button.classList.remove('pressed'); } });
}

function fail(error) {
  console.error(error); $('loading').hidden = true; $('fatal').hidden = false;
  $('fatal-message').textContent = '请使用支持 WebGL 的现代浏览器，并开启硬件加速。' + (error?.message ? `（${error.message}）` : '');
}
try {
  renderer = new GameRenderer($('world')); renderer.setLevel(LEVELS[0]);
  setDifficulty(difficulty); setPlayers(1); updateButtons(); home(); $('loading').hidden = true;
  addEventListener('resize', () => renderer.resize());
  const frame = now => {
    try {
      const dt = Math.min(.1, Math.max(0, (now - lastTime) / 1000)); lastTime = now; fps += ((1 / (dt || .016)) - fps) * .025;
      engine.state.viewWidth = renderer.camera.right - renderer.camera.left;
      engine.state.quality = save.quality;
      const input = readInput(); accumulator += dt;
      while (accumulator >= 1 / 60) { engine.step(1 / 60, input); accumulator -= 1 / 60; }
      audio.update(dt, engine.state); renderer.render(engine.state, dt); syncMode();
      if (now - lastHud > 80) { hud(); lastHud = now; }
      if (toastTime > 0) { toastTime -= dt; if (toastTime <= 0) $('toast').hidden = true; }
      requestAnimationFrame(frame);
    } catch (error) { fail(error); }
  };
  requestAnimationFrame(frame);
  window.Contra2026 = Object.freeze({ version: '1.0.0', snapshot: () => ({ ...engine.snapshot(), fps: Math.round(fps) }) });
  if (new URLSearchParams(location.search).get('qa') === '1') {
    window.__CONTRA_TEST__ = { engine, renderer, start, home, input: touchInput, snapshot: () => engine.snapshot() };
  }
} catch (error) { fail(error); }
addEventListener('pagehide', () => { audio.dispose(); renderer?.dispose(); });
addEventListener('pageshow', e => { if (e.persisted) location.reload(); });
