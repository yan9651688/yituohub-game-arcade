// One native audio element replaces the original synthesized soundtrack entirely.
const source = new URL('../../assets/media/a36233b6e5716cdcf22fc1b40a3e77457dc25a9cb33d35f87c411611041f7640.mp3', import.meta.url);
const button = document.getElementById('btn-bgm');
const audio = document.createElement('audio');
audio.id = 'palace-music';
audio.preload = 'none';
audio.loop = true;
audio.volume = 0.65;
audio.src = source.href;
audio.setAttribute('playsinline', '');
document.body.appendChild(audio);

let wanted = false;
let pending = false;
let sequence = 0;
let failed = false;
let awaitingGesture = false;
const defaults = {
  'afang.music.play': '♫ 盛世金钟',
  'afang.music.pause': 'Ⅱ 暂停音乐',
  'afang.music.loading': '音乐载入中…',
  'afang.music.error': '音乐暂时无法播放，请重试',
  'afang.music.title': '盛世金钟',
  'afang.music.gesture': '点击画面开启音乐'
};
const t = key => window.AfangUI?.t(key) || defaults[key] || key;
function refresh() {
  const playing = wanted && !audio.paused;
  button.textContent = t(pending ? 'afang.music.loading' : playing ? 'afang.music.pause' : 'afang.music.play');
  button.classList.toggle('active', playing);
  button.setAttribute('aria-pressed', String(playing));
  button.setAttribute('aria-busy', String(pending));
  button.title = t('afang.music.title');
  const status = document.getElementById('music-status');
  if (status) status.textContent = failed ? t('afang.music.error') : pending ? t('afang.music.loading') : awaitingGesture ? t('afang.music.gesture') : '';
}
async function play() {
  const token = ++sequence;
  wanted = true;
  failed = false;
  if (document.hidden) { pending = false; refresh(); return; }
  pending = true;
  refresh();
  try {
    if (audio.error) audio.load();
    await audio.play();
    if (token !== sequence) return;
    pending = false;
    awaitingGesture = false;
    if (!wanted || document.hidden) audio.pause();
    refresh();
  } catch (error) {
    if (token !== sequence) return;
    pending = false;
    awaitingGesture = error.name === 'NotAllowedError';
    wanted = awaitingGesture;
    failed = !awaitingGesture;
    refresh();
  }
}
function pause() {
  ++sequence;
  wanted = false;
  pending = false;
  failed = false;
  awaitingGesture = false;
  audio.pause();
  refresh();
}
function toggle() { if (wanted && !awaitingGesture) pause(); else void play(); }
button.addEventListener('click', toggle);
// Browsers may require a real user gesture before audible autoplay is allowed.
// The music button owns its click, avoiding a gesture-start followed by a pause.
function activateFromGesture(event) {
  if (!wanted || !awaitingGesture || !event.isTrusted || event.target.closest?.('#btn-bgm')) return;
  if (event.type === 'keydown' && (event.ctrlKey || event.altKey || event.metaKey || ['Shift', 'Control', 'Alt', 'Meta', 'Tab', 'Escape'].includes(event.key))) return;
  void play();
}
window.addEventListener('pointerdown', activateFromGesture, true);
window.addEventListener('keydown', activateFromGesture, true);
audio.addEventListener('play', refresh);
audio.addEventListener('pause', refresh);
audio.addEventListener('error', () => { ++sequence; wanted = false; pending = false; awaitingGesture = false; failed = true; refresh(); });
window.addEventListener('site:languagechange', refresh);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { ++sequence; pending = false; audio.pause(); refresh(); }
  else if (wanted) void play();
});
window.addEventListener('pagehide', () => { ++sequence; pending = false; audio.pause(); });
window.addEventListener('pageshow', () => { if (wanted && !document.hidden) void play(); });
window.AfangMusic = Object.freeze({
  audio, play, pause, toggle,
  get state() { return { wanted, playing: !audio.paused, pending, failed, awaitingGesture, source: audio.currentSrc || audio.src }; }
});
refresh();
// Default on: attempt immediately; if blocked, the first real interaction starts it.
void play();
