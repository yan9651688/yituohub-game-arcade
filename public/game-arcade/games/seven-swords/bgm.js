/* User-supplied score. One reusable player per track; scene changes never create players. */
(() => {
  'use strict';
  const KEY = 'seven-swords-bgm-v1';
  let saved = {}; try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (_) {}
  let enabled = saved.enabled !== false, volume = Number.isFinite(saved.volume) ? Math.max(0, Math.min(.6, saved.volume)) : .28;
  let scene = 'exploration', unlocked = false, blocked = false, generation = 0, frame = 0, context = null;
  const tracks = {};
  for (const [id, title] of [['exploration', '竹林茶舍'], ['battle', '正气凛然']]) {
    const audio = document.createElement('audio');
    audio.src = `assets/audio/${id}.mp3`; audio.loop = true; audio.preload = 'none'; audio.volume = 0;
    audio.dataset.bgm = id; audio.setAttribute('aria-label', title); audio.hidden = true;
    document.body.appendChild(audio); tracks[id] = { audio, gain: null, level: 0 };
    audio.addEventListener('error', () => { if (scene === id) { blocked = true; updateUI(); } });
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify({ enabled, volume })); } catch (_) {} }
  function level(track, value) {
    track.level = value;
    if (track.gain) track.gain.gain.value = value; else track.audio.volume = value;
    track.audio.dataset.gain = value.toFixed(3);
  }
  function updateUI() {
    document.querySelectorAll('[data-action="sound"], [data-bgm-toggle]').forEach(button => {
      button.classList.toggle('playing', enabled); button.setAttribute('aria-pressed', String(enabled));
      const label = enabled ? (blocked ? '音乐待播放，点击关闭' : '关闭背景音乐') : '开启背景音乐';
      button.title = label; button.setAttribute('aria-label', label);
      if (button.hasAttribute('data-bgm-toggle')) button.textContent = `音乐：${enabled ? '开' : '关'}`;
    });
    document.querySelectorAll('[data-bgm-volume]').forEach(input => { input.value = Math.round(volume * 100); });
  }
  function stopNow() {
    generation++; cancelAnimationFrame(frame);
    Object.values(tracks).forEach(t => { level(t, 0); t.audio.pause(); });
  }
  function fade(token, target) {
    cancelAnimationFrame(frame);
    const start = performance.now(), from = Object.fromEntries(Object.entries(tracks).map(([id, t]) => [id, t.level]));
    function tick(now) {
      if (token !== generation) return;
      const p = Math.min(1, (now - start) / 700), ease = p * p * (3 - 2 * p);
      for (const [id, t] of Object.entries(tracks)) {
        level(t, from[id] + ((id === target ? volume : 0) - from[id]) * ease);
        if (p === 1 && id !== target) t.audio.pause();
      }
      if (p < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    const token = ++generation; cancelAnimationFrame(frame);
    if (!enabled || !unlocked || document.hidden || volume === 0) { stopNow(); updateUI(); return; }
    const id = scene, t = tracks[id];
    let promise;
    try { promise = t.audio.play(); } catch (_) { promise = Promise.reject(); }
    Promise.resolve(promise).then(() => {
      if (token !== generation) {
        if (!enabled || document.hidden || scene !== id || volume === 0) { level(t, 0); t.audio.pause(); }
        return;
      }
      blocked = false; fade(token, id); updateUI();
    }, () => {
      if (token !== generation) return;
      blocked = true; stopNow(); updateUI();
    });
  }
  function unlock() {
    if (!enabled || document.hidden) return;
    unlocked = true;
    // Web Audio gain also makes the volume control work on mobile Safari.
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!context && AC) {
        context = new AC();
        for (const t of Object.values(tracks)) {
          const source = context.createMediaElementSource(t.audio); t.gain = context.createGain();
          t.gain.gain.value = t.level; source.connect(t.gain); t.gain.connect(context.destination); t.audio.volume = 1;
        }
      }
      if (context?.state === 'suspended') context.resume().then(() => { if (enabled && !document.hidden) sync(); }).catch(() => { blocked = true; updateUI(); });
    } catch (_) { /* HTML audio remains the fallback when Web Audio is unavailable. */ }
    if (tracks[scene].audio.paused || blocked) sync();
  }
  window.SevenBGM = {
    setScene(next) { next = next === 'battle' ? 'battle' : 'exploration'; if (scene !== next) { scene = next; sync(); } },
    toggle() { enabled = !enabled; blocked = false; persist(); if (enabled) unlock(); else stopNow(); updateUI(); return enabled; },
    setVolume(next) { volume = Math.max(0, Math.min(.6, Number(next) || 0)); persist(); sync(); },
    get enabled() { return enabled; }, get volume() { return volume; },
    refresh: updateUI
  };
  document.addEventListener('pointerdown', unlock, { passive: true });
  document.addEventListener('keydown', unlock);
  document.addEventListener('click', e => { if (e.target.closest('[data-bgm-toggle]')) window.SevenBGM.toggle(); });
  document.addEventListener('input', e => { if (e.target.matches('[data-bgm-volume]')) window.SevenBGM.setVolume(e.target.value / 100); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopNow(); else sync(); });
  window.addEventListener('pagehide', stopNow);
  window.addEventListener('pageshow', () => { if (unlocked) sync(); });
  updateUI();
})();
