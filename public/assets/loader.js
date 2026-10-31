/* One streamed HTML request per attempt. srcdoc keeps the site's origin and storage.
   Only an uncompressed response Content-Length is a valid fetch-stream denominator;
   gzip/br Content-Length describes compressed bytes, so those responses stay indeterminate. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const i18n = window.SiteI18n;
  const t = (key, vars) => i18n.t(key, vars);
  const classics = document.body.dataset.catalogue === 'classics';
  const workshop = document.body.dataset.catalogue === 'workshop';
  const catalogue = workshop ? window.WORKSHOP_GAMES : classics ? window.CLASSIC_GAMES : window.ARCADE_GAMES;
  const games = Array.isArray(catalogue) ? catalogue : [];
  const returnLabel = () => t(workshop ? 'site.workshop' : classics ? 'catalog.classics' : 'catalog.library');
  const returnPage = workshop ? 'workshop.html' : classics ? 'classics.html' : 'games.html';
  const gameId = new URLSearchParams(location.search).get('game');
  const game = games.find((item) => item.id === gameId);
  let attempt = 0;
  let controller;
  let frame;
  let startupTimer;
  let loaded = 0;
  let total = 0;
  let activeToken = '';
  let phase = 'connecting';
  let imageStatus = null;
  let errorInfo = null;
  let attemptStartedAt = 0;
  let attemptOutcome = '';
  let attemptReason = 'initial';
  let gamePlayed = false;
  // The optional analytics bridge loads asynchronously. Keep a small local
  // queue so its network request never delays game fetch, rendering, or input.
  const analyticsPending = [];
  const mb = (bytes) => (bytes / 1048576).toFixed(2) + ' MB';
  const bytesLabel = () => total ? `${mb(loaded)} / ${mb(total)}` : t('load.read', { bytes: mb(loaded) });

  function localizedError(key, vars = {}) {
    return Object.assign(new Error(key), { i18nKey: key, i18nVars: vars });
  }

  function flushAnalytics() {
    try {
      if (typeof window.SiteAnalytics?.track !== 'function') return;
      while (analyticsPending.length) {
        const event = analyticsPending.shift();
        try { window.SiteAnalytics.track(event.name, event.data); } catch { /* Skip a failed optional event. */ }
      }
    } catch { /* A missing or broken bridge cannot interrupt the game. */ }
  }

  function trackGame(name, extra = {}) {
    try {
      if (!game) return;
      if (analyticsPending.length < 48) analyticsPending.push({ name, data: { game_id: game.id, attempt, reason: attemptReason, site_language: i18n.locale, ...extra } });
      flushAnalytics();
    } catch { /* Optional analytics cannot interrupt loading or input. */ }
  }
  window.addEventListener('site:analytics-ready', flushAnalytics, { once: true });

  function refreshSeo(current) {
    if (!current) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', t('load.defaultDescription'));
      return;
    }
    const canonicalUrl = new URL(workshop ? 'workshop-play.html' : classics ? 'classics-play.html' : 'play.html', 'https://game.yituohub.com/');
    canonicalUrl.searchParams.set('game', game.id);
    if (i18n.locale !== 'zh-Hans') canonicalUrl.searchParams.set('lang', i18n.locale);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); }
    canonical.href = canonicalUrl.href;
    const description = t('load.seoDescription', { ...current, category: t(`lib.category.${game.category}`) });
    const meta = (attribute, key, value) => {
      let node = document.querySelector(`meta[${attribute}="${key}"]`);
      if (!node) { node = document.createElement('meta'); node.setAttribute(attribute, key); document.head.append(node); }
      node.content = value;
    };
    meta('name', 'description', description);
    const title = t('load.seoTitle', { title: current.title });
    const cover = new URL(current.cover, 'https://game.yituohub.com/').href;
    for (const [property, value] of Object.entries({ 'og:type': 'website', 'og:site_name': 'NEON ARCADE', 'og:title': title, 'og:description': current.description, 'og:image': cover, 'og:url': canonicalUrl.href, 'og:locale': { 'zh-Hans': 'zh_CN', 'zh-Hant': 'zh_TW', en: 'en_US' }[i18n.locale] })) meta('property', property, value);
    for (const [name, value] of Object.entries({ 'twitter:card': 'summary_large_image', 'twitter:title': title, 'twitter:description': current.description, 'twitter:image': cover })) meta('name', name, value);
  }

  // Keep presentation separate from the fetch/frame lifecycle so changing the
  // site language never restarts a download or changes a game's own language.
  function refresh() {
    const state = document.body.dataset.state;
    const current = game && i18n.localizeGame(game);
    const library = returnLabel();
    document.title = `${current ? current.title : t('load.notFound')} · NEON ARCADE`;
    refreshSeo(current);
    $('loadTitle').textContent = current ? current.title : t('load.notFound');
    if ($('loadAuthor')) {
      $('loadAuthor').hidden = !game?.author;
      $('loadAuthor').textContent = game?.author ? `${t('workshop.author')} ${game.author}` : '';
    }
    $('loadEnglish').textContent = current?.en || 'NEON ARCADE';
    $('loadCover').alt = current ? t('load.coverAlt', { title: current.title }) : '';
    $('loadDescription').textContent = errorInfo ? t(errorInfo.key, { library, ...errorInfo.vars }) : current?.description || t('load.soon');
    if (current) {
      const controls = touchInput.matches && current.mobileControls ? current.mobileControls : current.controls;
      $('loadControls').textContent = Array.isArray(controls) ? controls.join(' · ') : controls || '';
    }
    if (frame) frame.title = current?.title || '';
    $('cancelLink').href = i18n.href(returnPage);
    $('gameReturn').href = i18n.href(returnPage);
    $('gameReturn').querySelector('span').textContent = library;
    $('gameReturn').setAttribute('aria-label', t('load.exit', { library }));
    $('cancelLink').firstChild.textContent = t(state === 'error' ? 'load.back' : 'load.cancel', { library }) + ' ';
    $('loadEyebrow').textContent = t(state === 'error' ? 'load.interrupted' : 'load.next');
    refreshStatus();
  }

  function refreshStatus() {
    const state = document.body.dataset.state;
    if (state === 'error') {
      $('loadStatus').textContent = t('load.unavailable');
      $('loadPercent').textContent = '×';
      $('loadBytes').textContent = loaded ? bytesLabel() : t('load.noBytes');
      $('loadProgress').setAttribute('aria-label', t('load.failed'));
    } else if (state === 'ready') {
      $('loadStatus').textContent = t('load.ready');
      $('loadProgress').setAttribute('aria-label', t('load.readyAria'));
    } else if (state === 'preparing') {
      $('loadStatus').textContent = imageStatus ? (imageStatus.count ? t('load.images', imageStatus) : t('load.starting')) : t('load.preparing');
      $('loadPercent').textContent = t('load.preparingShort');
      $('loadBytes').textContent = t('load.startingBytes', { bytes: mb(loaded) });
      indeterminate(t('load.preparingAria'));
      if (['plants-vs-zombies', 'seven-swords'].includes(game?.id) && imageStatus?.count) {
        const percent = Math.min(99, Math.floor(imageStatus.done / imageStatus.count * 100));
        $('loadProgress').classList.remove('is-indeterminate');
        $('loadProgress').setAttribute('aria-valuenow', String(percent));
        $('loadBar').style.width = percent + '%';
        $('loadPercent').textContent = percent + '%';
      }
    } else {
      $('loadStatus').textContent = t(phase === 'downloading' ? 'load.downloading' : 'load.connecting');
      $('loadBytes').textContent = bytesLabel();
      if (phase === 'downloading' && total) {
        const percent = Math.floor(loaded / total * 100);
        $('loadProgress').classList.remove('is-indeterminate');
        $('loadProgress').setAttribute('aria-label', t('load.progress'));
        $('loadProgress').setAttribute('aria-valuenow', String(percent));
        $('loadBar').style.width = percent + '%';
        $('loadPercent').textContent = percent + '%';
      } else {
        indeterminate(t(phase === 'downloading' ? 'load.unknownProgress' : 'load.connecting'));
        $('loadPercent').textContent = phase === 'downloading' ? t('load.reading') : '—';
      }
    }
  }

  function indeterminate(label) {
    $('loadProgress').classList.add('is-indeterminate');
    $('loadProgress').removeAttribute('aria-valuenow');
    $('loadProgress').setAttribute('aria-label', label);
  }

  function clearAttempt() {
    if (controller) controller.abort();
    clearTimeout(startupTimer);
    if (frame) frame.remove();
    frame = null;
    document.body.classList.remove('is-pointer-locked');
  }

  function fail(key, vars = {}, retry = true) {
    if (game && attemptOutcome === 'pending') {
      attemptOutcome = 'error';
      trackGame('game_error', { error_key: key, phase: document.body.dataset.state === 'preparing' ? 'preparing' : phase });
    }
    errorInfo = { key, vars };
    clearAttempt();
    document.body.dataset.state = 'error';
    $('loadingScreen').hidden = false;
    $('gameReturn').hidden = true;
    $('loadProgress').classList.remove('is-indeterminate');
    $('loadProgress').removeAttribute('aria-valuenow');
    $('retryButton').hidden = !retry;
    refresh();
  }

  // Runs in the game before its own scripts; waits for real image loading and paint.
  function gameBridge(token, id, targetOrigin) {
    const channel = 'neon-arcade-loader';
    const tracked = new Set();
    const pending = new Set();
    let done = 0;
    let imageError = false;
    let scriptError = null;
    // srcdoc's URL reports an opaque `location.origin` in Chromium even when its
    // DOM/storage origin is inherited. Pass the parent origin explicitly instead
    // of using that URL origin as postMessage's targetOrigin.
    const send = (type, extra = {}) => parent.postMessage({ channel, token, type, ...extra }, targetOrigin || '*');
    const reportImages = () => {
      const assets = id === 'plants-vs-zombies' && window.PVZAssetLoading?.snapshot;
      send('images', assets ? { done: assets.loaded, count: assets.total } : { done, count: tracked.size });
    };
    if (id === 'plants-vs-zombies') addEventListener('pvz:loading-progress', reportImages);
    const track = (img) => {
      if (tracked.has(img)) return;
      tracked.add(img);
      if (img.complete && img.currentSrc) {
        done++;
        if (!img.naturalWidth) imageError = true;
        return;
      }
      const task = new Promise((resolve) => {
        const finish = (failed) => {
          img.removeEventListener('load', onload);
          img.removeEventListener('error', onerror);
          if (failed) imageError = true;
          done++;
          pending.delete(task);
          reportImages();
          resolve();
        };
        const onload = () => finish(false);
        const onerror = () => finish(true);
        img.addEventListener('load', onload, { once: true });
        img.addEventListener('error', onerror, { once: true });
      });
      pending.add(task);
    };
    const NativeImage = window.Image;
    window.Image = new Proxy(NativeImage, {
      construct(target, args) {
        const img = Reflect.construct(target, args);
        track(img);
        return img;
      }
    });
    addEventListener('error', (event) => {
      if (event.target instanceof HTMLScriptElement || event.target instanceof HTMLLinkElement) scriptError = { key: 'load.scriptError' };
      else if (event.message) scriptError = { key: 'load.runtimeError', message: event.message };
    }, true);
    addEventListener('unhandledrejection', (event) => {
      scriptError = event.reason ? { key: 'load.runtimeError', message: event.reason?.message || String(event.reason) } : { key: 'load.initError' };
    });
    document.addEventListener('pointerlockchange', () => send('pointerlock', { locked: Boolean(document.pointerLockElement) }));
    const paint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    addEventListener('load', async () => {
      try {
        // Lazy route thumbnails are not prerequisites for playing. Eager DOM images are.
        [...document.images].filter((img) => img.loading !== 'lazy' && img.src).forEach(track);
        reportImages();
        do {
          await Promise.all([...pending]);
          await paint();
        } while (pending.size);
        if (id === 'plants-vs-zombies') {
          while (window.PVZApp && !window.PVZApp.rendererReady && window.PVZApp.rendererStatus !== 'failed') {
            if (scriptError || imageError) break;
            await new Promise(resolve => setTimeout(resolve, 32));
          }
          if (!window.PVZApp?.rendererReady) throw { key: 'load.imageError' };
        }
        if (id === 'wasteland-breakout') {
          // The tank world builds asynchronously after its images have decoded.
          // Report ready only after its first real menu render and loading fade.
          const deadline = performance.now() + 60000;
          while (!(window.__game?._homePreview && document.querySelector('#loading.hidden'))) {
            const failed = document.getElementById('fatal');
            if (scriptError || imageError || (failed && !failed.classList.contains('hidden'))) break;
            if (performance.now() > deadline) throw { key: 'load.initError' };
            await new Promise(resolve => setTimeout(resolve, 32));
          }
        }
        if (scriptError) throw scriptError;
        if (imageError) throw { key: 'load.imageError' };
        const fatal = document.getElementById('fatal');
        if (fatal && !fatal.hidden && getComputedStyle(fatal).display !== 'none' && getComputedStyle(fatal).visibility !== 'hidden') {
          throw { key: 'load.runtimeError', message: fatal.textContent.trim() };
        }
        if (id === 'fallen-frontier' && !window.Frontier) throw { key: 'load.frontierError' };
        send('ready');
        // Readiness alone does not mean somebody played. Record only the first
        // real interaction after the game is ready, without keys or coordinates.
        let interacted = false;
        const onInteraction = (event) => {
          if (interacted || !event.isTrusted) return;
          interacted = true;
          removeEventListener('pointerdown', onInteraction, true);
          removeEventListener('keydown', onInteraction, true);
          send('play');
        };
        addEventListener('pointerdown', onInteraction, { capture: true, passive: true });
        addEventListener('keydown', onInteraction, { capture: true });
      } catch (error) {
        send('error', { errorKey: error.key || (error.message ? 'load.runtimeError' : 'load.initError'), message: error.message || '' });
      }
    }, { once: true });
  }

  function mountGame(html, url, currentAttempt) {
    document.body.dataset.state = 'preparing';
    imageStatus = null;
    refresh();
    activeToken = `${currentAttempt}-${Math.random().toString(36).slice(2)}`;
    // Frontier's original timer can fire before later extension scripts are parsed.
    // Defer only this known boot call in the in-memory document; source files stay intact.
    if (game.id === 'fallen-frontier') {
      html = html.replace('setTimeout(boot,40);', "if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',boot,{once:true});}else{boot();}");
    }
    const escapedUrl = url.href.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const bridge = `<base href="${escapedUrl}"><script>(${gameBridge.toString()})(${JSON.stringify(activeToken)},${JSON.stringify(game.id)},${JSON.stringify(location.origin)});<\/script>`;
    // Some standalone games omit <head>; a later JS string may contain one for
    // a nested classic mode. Only match the document head before body/scripts.
    const head = /<head(?:\s[^>]*)?>/i.exec(html);
    const contentStart = html.search(/<(?:script|body)\b/i);
    if (head && (contentStart < 0 || head.index < contentStart)) {
      html = html.slice(0, head.index + head[0].length) + bridge + html.slice(head.index + head[0].length);
    } else if (/<html(?:\s[^>]*)?>/i.test(html)) {
      html = html.replace(/<html(?:\s[^>]*)?>/i, (tag) => tag + '<head>' + bridge);
    } else {
      html = '<head>' + bridge + '</head>' + html;
    }
    frame = document.createElement('iframe');
    frame.id = 'gameFrame';
    frame.title = i18n.localizeGame(game).title;
    frame.allow = 'fullscreen; autoplay; gamepad';
    frame.setAttribute('allowfullscreen', '');
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    // No sandbox/Blob URL: these are trusted local games and need same-origin storage.
    frame.srcdoc = html;
    $('gameHost').appendChild(frame);
    startupTimer = setTimeout(() => {
      if (currentAttempt === attempt && document.body.dataset.state === 'preparing') fail('load.timeout');
    }, 120000);
  }

  async function start(reason = 'initial') {
    clearAttempt();
    const currentAttempt = ++attempt;
    attemptStartedAt = performance.now();
    attemptOutcome = 'pending';
    attemptReason = reason;
    controller = new AbortController();
    loaded = 0;
    total = 0;
    phase = 'connecting';
    imageStatus = null;
    errorInfo = null;
    $('loadingScreen').hidden = false;
    $('gameReturn').hidden = true;
    $('retryButton').hidden = true;
    $('loadBar').style.width = '0%';
    document.body.dataset.state = 'loading';
    refresh();
    try {
      const url = new URL(game.path, document.baseURI);
      if (url.origin !== location.origin) throw localizedError('load.originError');
      const response = await fetch(url, { signal: controller.signal, credentials: 'same-origin', cache: 'no-cache' });
      if (!response.ok) throw localizedError('load.httpError', { status: response.status });
      const encoding = (response.headers.get('content-encoding') || '').toLowerCase();
      const length = Number(response.headers.get('content-length'));
      total = (!encoding || encoding === 'identity') && Number.isFinite(length) && length > 0 ? length : 0;
      phase = 'downloading';
      const decoder = new TextDecoder('utf-8');
      const parts = [];
      const update = () => {
        if (total && loaded > total) total = 0;
        refreshStatus();
      };
      if (response.body?.getReader) {
        const reader = response.body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (currentAttempt !== attempt) return;
            loaded += value.byteLength;
            parts.push(decoder.decode(value, { stream: true }));
            update();
          }
          parts.push(decoder.decode());
        } finally {
          reader.releaseLock();
        }
      } else {
        const buffer = await response.arrayBuffer();
        loaded = buffer.byteLength;
        parts.push(decoder.decode(buffer));
        update();
      }
      if (currentAttempt !== attempt || controller.signal.aborted) return;
      if (!loaded) throw localizedError('load.emptyResource');
      mountGame(parts.join(''), url, currentAttempt);
    } catch (error) {
      if (currentAttempt !== attempt || error.name === 'AbortError') return;
      if (error instanceof TypeError) fail('load.networkError');
      else fail(error.i18nKey || 'load.runtimeError', error.i18nVars || { message: error.message });
    }
  }

  addEventListener('message', (event) => {
    const data = event.data;
    if (!frame || event.source !== frame.contentWindow || (event.origin !== location.origin && event.origin !== 'null') || data?.channel !== 'neon-arcade-loader' || data.token !== activeToken) return;
    if (data.type === 'pointerlock') {
      document.body.classList.toggle('is-pointer-locked', Boolean(data.locked));
      return;
    }
    if (data.type === 'play') {
      if (document.body.dataset.state === 'ready' && !gamePlayed) {
        gamePlayed = true;
        trackGame('game_play');
      }
      return;
    }
    if (document.body.dataset.state !== 'preparing') return;
    if (data.type === 'images') {
      imageStatus = { done: data.done, count: data.count };
      refreshStatus();
    } else if (data.type === 'error') {
      const allowed = ['load.scriptError', 'load.runtimeError', 'load.imageError', 'load.frontierError', 'load.initError'];
      fail(allowed.includes(data.errorKey) ? data.errorKey : 'load.initError', { message: data.message || '' });
    } else if (data.type === 'ready') {
      clearTimeout(startupTimer);
      $('loadPercent').textContent = '100%';
      $('loadProgress').classList.remove('is-indeterminate');
      $('loadProgress').setAttribute('aria-valuenow', '100');
      $('loadBar').style.width = '100%';
      document.body.dataset.state = 'ready';
      if (attemptOutcome === 'pending') {
        attemptOutcome = 'ready';
        trackGame('game_ready', { load_ms: performance.now() - attemptStartedAt });
      }
      refresh();
      $('loadingScreen').hidden = true;
      $('gameReturn').hidden = false;
      frame.removeAttribute('aria-hidden');
      frame.removeAttribute('tabindex');
      frame.contentWindow.focus();
    }
  });

  $('retryButton').addEventListener('click', () => {
    if (game && document.body.dataset.state === 'error') {
      trackGame('game_retry');
      start('retry');
    }
  });
  $('cancelLink').addEventListener('click', () => { attempt++; clearAttempt(); });
  $('gameReturn').addEventListener('click', () => { attempt++; clearAttempt(); });
  addEventListener('pagehide', () => { attempt++; clearAttempt(); });
  addEventListener('pageshow', (event) => { if (event.persisted && game) start('restore'); });
  const touchInput = window.matchMedia('(pointer: coarse)');
  touchInput.addEventListener('change', refresh);
  window.addEventListener('site:languagechange', refresh);
  if (!game) {
    $('loadCover').hidden = true;
    fail(games.length ? 'load.invalidLink' : 'load.missingCatalog', {}, false);
    return;
  }
  $('loadCover').src = game.cover;
  $('loadCover').addEventListener('error', () => { $('loadCover').hidden = true; }, { once: true });
  trackGame('game_open', { attempt: 1 });
  start();
})();
