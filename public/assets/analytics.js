/* Small, optional analytics bridge. Game loading never waits for telemetry. */
(() => {
  'use strict';
  const WEBSITE_ID = '8a3c3524-09ba-4af0-8771-70b4bc7174e9';
  const PLAY_WEBSITE_ID = '9e7c25c0-7388-42bb-9984-87636aecfef0';
  const PUBLIC_HOST = 'game.yituohub.com';
  const MAX_QUEUE = 48;
  const arcadeTitles = Object.freeze({ galaxian: '小蜜蜂', tanks: '坦克大战', breakout: '打砖块', circus: '马戏团', 'lode-runner': '淘金者', 'dr-mario': '马里奥医生' });
  const arcadeMatch = /^\/arcade\/games\/([a-z-]+)\/(?:index\.html)?$/.exec(location.pathname);
  const arcadeId = arcadeMatch && Object.hasOwn(arcadeTitles, arcadeMatch[1]) ? arcadeMatch[1] : null;
  const pages = new Set(['/', '/index.html', '/games.html', '/classics.html', '/mv.html', '/play.html', '/classics-play.html']);
  ['/arcade/', '/arcade/index.html', ...Object.keys(arcadeTitles).flatMap(id => ['/arcade/games/' + id + '/', '/arcade/games/' + id + '/index.html'])].forEach(path => pages.add(path));
  const events = new Set(['game_open', 'game_ready', 'game_error', 'game_retry', 'game_play']);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  // Browser tests may install an in-memory sink before this script runs. A URL
  // parameter cannot enable telemetry on a preview domain or override the host.
  const testSink = local && typeof window.__NEON_ANALYTICS_TEST__?.track === 'function'
    ? window.__NEON_ANALYTICS_TEST__.track : null;
  let disabled = window.top !== window.self || !pages.has(location.pathname) || (location.hostname !== PUBLIC_HOST && !testSink);
  let initialized = false;
  let sdkReady = false;
  let draining = false;
  let playSent = false;
  const arcadeEventsSent = new Set();
  let timer;
  const pending = [];
  const queue = [];
  function privacyOptOut() {
    // Match Umami v3.4.0: any nonempty umami.disabled value excludes this browser.
    // Storage can be unavailable in restricted browser contexts.
    try { if (window.localStorage.getItem('umami.disabled')) return true; } catch { /* No accessible setting. */ }
    const dnt = window.doNotTrack || navigator.doNotTrack || navigator.msDoNotTrack;
    return navigator.globalPrivacyControl === true || dnt === 1 || dnt === '1' || dnt === 'yes';
  }

  function stop() {
    disabled = true;
    pending.length = 0;
    queue.length = 0;
    clearTimeout(timer);
  }

  function gameForPage() {
    if (arcadeId) return { id: 'arcade-' + arcadeId, title: arcadeTitles[arcadeId] };
    if (!['/play.html', '/classics-play.html'].includes(location.pathname)) return null;
    const catalogue = location.pathname === '/classics-play.html' ? window.CLASSIC_GAMES : window.ARCADE_GAMES;
    const id = new URLSearchParams(location.search).get('game');
    return Array.isArray(catalogue) ? catalogue.find(game => game.id === id) : null;
  }

  function pageDetails() {
    let url = location.pathname === '/index.html' ? '/' : location.pathname;
    let title = ({ '/': 'NEON ARCADE', '/games.html': '小游戏库 · NEON ARCADE', '/classics.html': '经典小游戏 · NEON ARCADE', '/mv.html': 'AI放映厅 · NEON ARCADE' })[url] || '游戏加载 · NEON ARCADE';
    if (url === '/arcade/' || url === '/arcade/index.html') { url = '/arcade/index.html'; title = '经典街机 · NEON ARCADE'; }
    if (arcadeId) { url = '/arcade/games/' + arcadeId + '/index.html'; title = arcadeTitles[arcadeId] + ' · 经典街机'; }
    if (url === '/play.html' || url === '/classics-play.html') {
      const game = gameForPage();
      if (game) {
        url += '?game=' + encodeURIComponent(game.id);
        title = game.title + ' · NEON ARCADE';
      }
    }
    let referrer = '';
    try {
      const parsed = new URL(document.referrer);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') referrer = parsed.origin + parsed.pathname;
    } catch { /* An absent or non-HTTP referrer needs no telemetry. */ }
    return { url, title, referrer };
  }

  async function drain() {
    if (disabled || !sdkReady || draining) return;
    draining = true;
    try {
      while (queue.length && !disabled) {
        if (privacyOptOut()) { stop(); break; }
        const event = queue.shift();
        // The callback retains Umami's anonymous visit properties while removing
        // raw URLs/referrers from both pageviews and custom events.
        if (testSink) await testSink(event);
        else await window.umami.track(props => ({ ...props, ...event }));
      }
    } catch { stop(); }
    finally { draining = false; }
  }

  function enqueue(event) {
    if (disabled || privacyOptOut()) { stop(); return; }
    if (queue.length < MAX_QUEUE) queue.push(event);
    void drain();
  }

  function sendPlayerView(event) {
    if (playSent || disabled || privacyOptOut()) return;
    playSent = true;
    const payload = {
      website: PLAY_WEBSITE_ID,
      hostname: location.hostname,
      url: event.url,
      title: event.title,
      referrer: event.referrer,
      language: navigator.language,
      screen: screen.width + 'x' + screen.height
    };
    if (testSink) {
      // An explicit local sink stays entirely offline, including this dataset.
      try { window.__NEON_ANALYTICS_TEST__.trackPlayer?.(payload); } catch { /* Optional test sink. */ }
      return;
    }
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(PLAY_WEBSITE_ID)) return;
    // A separate anonymous pageview dataset makes player countries and game
    // popularity available directly in the dashboard. Never reuse SDK cache
    // across website IDs, and never send an identifier, event name, or input.
    try {
      void fetch('/stats/api/send', {
        method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json', 'x-umami-website-id': PLAY_WEBSITE_ID, 'x-umami-hostname': location.hostname },
        body: JSON.stringify({ type: 'event', payload })
      }).catch(() => {});
    } catch { /* Collection failure must never affect play. */ }
  }

  function track(name, data = {}) {
    try {
      if (disabled || privacyOptOut() || !events.has(name)) return;
      const game = gameForPage();
      if (!game || data.game_id !== game.id) return;
      if (arcadeId && ['game_open', 'game_ready', 'game_error', 'game_play'].includes(name)) {
        if (arcadeEventsSent.has(name)) return;
        arcadeEventsSent.add(name);
      }
      const locale = arcadeId ? window.ArcadeI18n?.language : window.SiteI18n?.locale;
      const safe = {
        game_id: game.id,
        game_title: game.title,
        catalogue: arcadeId ? 'arcade' : location.pathname === '/classics-play.html' ? 'classics' : 'original',
        site_language: ['zh-Hans', 'zh-Hant', 'en'].includes(data.site_language) ? data.site_language : (['zh-Hans', 'zh-Hant', 'en'].includes(locale) ? locale : 'zh-Hans')
      };
      for (const key of ['attempt', 'load_ms']) {
        if (Number.isFinite(data[key]) && data[key] >= 0) safe[key] = Math.round(data[key]);
      }
      if (['initial', 'retry', 'restore'].includes(data.reason)) safe.reason = data.reason;
      if (typeof data.error_key === 'string' && /^load\.[a-zA-Z]+$/.test(data.error_key)) safe.error_key = data.error_key;
      if (['connecting', 'downloading', 'preparing'].includes(data.phase)) safe.phase = data.phase;
      const event = { ...pageDetails(), name, data: safe };
      if (name === 'game_play') sendPlayerView(event);
      if (!initialized) { if (pending.length < MAX_QUEUE - 1) pending.push(event); }
      else enqueue(event);
    } catch { /* Telemetry must not change the game lifecycle. */ }
  }
  window.SiteAnalytics = Object.freeze({ track });

  // Direct arcade pages share the same anonymous datasets as the game loader.
  // Readiness is supplied by the resource loader; menu/language clicks do not
  // count as playing, and a visit generates at most one player pageview.
  function observeArcade() {
    if (!arcadeId || disabled || privacyOptOut()) return;
    const data = { game_id: 'arcade-' + arcadeId, attempt: 1 };
    track('game_open', data);
    const readiness = () => {
      const state = document.body.dataset.arcadeState;
      if (state === 'ready') track('game_ready', { ...data, load_ms: performance.now() });
      else if (state === 'error') track('game_error', { ...data, error_key: 'load.runtimeError' });
    };
    const observer = new MutationObserver(readiness);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-arcade-state'] });
    readiness();
    const onPlay = event => {
      if (!event.isTrusted || document.body.dataset.arcadeState !== 'ready') return;
      const target = event.target;
      if (target?.closest?.('select, input, textarea, a, [data-arcade-navigation]')) return;
      if (event.type === 'keydown') {
        if (!['Enter', ' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd', 'w', 's', 'j', 'k', 'z', 'x'].includes(event.key)) return;
      } else if (!target?.closest?.('canvas#game, #start-button, #primary-button, #action-button, .touch-controls button')) return;
      track('game_play', data);
      document.removeEventListener('pointerdown', onPlay, true);
      document.removeEventListener('keydown', onPlay, true);
    };
    document.addEventListener('pointerdown', onPlay, { capture: true, passive: true });
    document.addEventListener('keydown', onPlay, true);
    window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
  }

  function init() {
    if (initialized) return;
    initialized = true;
    try {
      if (disabled || privacyOptOut()) { stop(); return; }
      // Always send the pageview before gameplay events queued by deferred loader.
      enqueue(pageDetails());
      pending.splice(0).forEach(enqueue);
      observeArcade();
      if (testSink) { sdkReady = true; void drain(); return; }
      if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(WEBSITE_ID)) { stop(); return; }
      const script = document.createElement('script');
      script.src = '/stats/script.js';
      script.async = true;
      script.fetchPriority = 'low';
      script.dataset.websiteId = WEBSITE_ID;
      script.dataset.hostUrl = '/stats';
      script.dataset.autoPageview = 'false';
      script.dataset.doNotTrack = 'true';
      script.dataset.excludeSearch = 'true';
      script.dataset.excludeHash = 'true';
      script.dataset.domains = PUBLIC_HOST;
      script.onload = () => {
        clearTimeout(timer);
        if (disabled) return;
        if (typeof window.umami?.track !== 'function') { stop(); return; }
        sdkReady = true;
        void drain();
      };
      script.onerror = stop;
      timer = setTimeout(stop, 15000);
      document.head.append(script);
    } catch { stop(); }
    finally { window.dispatchEvent(new Event('site:analytics-ready')); }
  }
  // An async script may run while readyState is already interactive but deferred
  // catalog scripts are still waiting. Conversely, it may arrive after DOMReady
  // while another async request still delays window.load. Navigation timing
  // distinguishes these cases without waiting for the window load event.
  const domReady = document.readyState === 'complete' || performance.getEntriesByType('navigation')[0]?.domContentLoadedEventStart > 0;
  if (domReady) init();
  else document.addEventListener('DOMContentLoaded', init, { once: true });
})();
