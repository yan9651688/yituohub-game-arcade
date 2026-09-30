/* One streamed HTML request per attempt. srcdoc keeps the site's origin and storage.
   Only an uncompressed response Content-Length is a valid fetch-stream denominator;
   gzip/br Content-Length describes compressed bytes, so those responses stay indeterminate. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const games = Array.isArray(window.ARCADE_GAMES) ? window.ARCADE_GAMES : [];
  const gameId = new URLSearchParams(location.search).get('game');
  const game = games.find((item) => item.id === gameId);
  let attempt = 0;
  let controller;
  let frame;
  let startupTimer;
  let loaded = 0;
  let total = 0;
  let activeToken = '';
  const mb = (bytes) => (bytes / 1048576).toFixed(2) + ' MB';
  const bytesLabel = () => total ? `${mb(loaded)} / ${mb(total)}` : `已读取 ${mb(loaded)}`;

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

  function fail(message, retry = true) {
    clearAttempt();
    document.body.dataset.state = 'error';
    $('loadingScreen').hidden = false;
    $('gameReturn').hidden = true;
    $('loadEyebrow').textContent = 'LOAD INTERRUPTED / 加载中断';
    $('loadStatus').textContent = '暂时无法进入游戏';
    $('loadPercent').textContent = '×';
    $('loadDescription').textContent = message;
    $('loadBytes').textContent = loaded ? bytesLabel() : '尚未读取游戏资源';
    $('loadProgress').classList.remove('is-indeterminate');
    $('loadProgress').removeAttribute('aria-valuenow');
    $('loadProgress').setAttribute('aria-label', '游戏加载失败');
    $('retryButton').hidden = !retry;
    $('cancelLink').firstChild.textContent = '返回游戏库 ';
  }

  // Runs in the game before its own scripts; waits for real image loading and paint.
  function gameBridge(token, id, targetOrigin) {
    const channel = 'neon-arcade-loader';
    const tracked = new Set();
    const pending = new Set();
    let done = 0;
    let imageError = false;
    let scriptError = '';
    // srcdoc's URL reports an opaque `location.origin` in Chromium even when its
    // DOM/storage origin is inherited. Pass the parent origin explicitly instead
    // of using that URL origin as postMessage's targetOrigin.
    const send = (type, extra = {}) => parent.postMessage({ channel, token, type, ...extra }, targetOrigin || '*');
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
          send('images', { done, count: tracked.size });
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
      if (event.target instanceof HTMLScriptElement || event.target instanceof HTMLLinkElement) scriptError = '游戏脚本或样式读取失败';
      else if (event.message) scriptError = event.message;
    }, true);
    addEventListener('unhandledrejection', (event) => {
      scriptError = event.reason?.message || String(event.reason || '游戏初始化失败');
    });
    document.addEventListener('pointerlockchange', () => send('pointerlock', { locked: Boolean(document.pointerLockElement) }));
    const paint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    addEventListener('load', async () => {
      try {
        // Lazy route thumbnails are not prerequisites for playing. Eager DOM images are.
        [...document.images].filter((img) => img.loading !== 'lazy' && img.src).forEach(track);
        send('images', { done, count: tracked.size });
        do {
          await Promise.all([...pending]);
          await paint();
        } while (pending.size);
        if (scriptError) throw new Error(scriptError);
        if (imageError) throw new Error('部分游戏画面未能读取，请重新加载');
        const fatal = document.getElementById('fatal');
        if (fatal && !fatal.hidden && getComputedStyle(fatal).display !== 'none' && getComputedStyle(fatal).visibility !== 'hidden') {
          throw new Error(fatal.textContent.trim() || '游戏初始化失败');
        }
        if (id === 'fallen-frontier' && !window.Frontier) throw new Error('战场初始化未完成，请重新加载');
        send('ready');
      } catch (error) {
        send('error', { message: error.message || '游戏初始化失败' });
      }
    }, { once: true });
  }

  function mountGame(html, url, currentAttempt) {
    document.body.dataset.state = 'preparing';
    $('loadStatus').textContent = '下载完成，正在准备画面';
    $('loadPercent').textContent = '准备中';
    $('loadBytes').textContent = `已读取 ${mb(loaded)} · 正在启动游戏`;
    indeterminate('游戏画面准备中');
    activeToken = `${currentAttempt}-${Math.random().toString(36).slice(2)}`;
    // Frontier's original timer can fire before later extension scripts are parsed.
    // Defer only this known boot call in the in-memory document; source files stay intact.
    if (game.id === 'fallen-frontier') {
      html = html.replace('setTimeout(boot,40);', "if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',boot,{once:true});}else{boot();}");
    }
    const escapedUrl = url.href.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const bridge = `<base href="${escapedUrl}"><script>(${gameBridge.toString()})(${JSON.stringify(activeToken)},${JSON.stringify(game.id)},${JSON.stringify(location.origin)});<\/script>`;
    html = /<head(?:\s[^>]*)?>/i.test(html)
      ? html.replace(/<head(?:\s[^>]*)?>/i, (head) => head + bridge)
      : '<head>' + bridge + '</head>' + html;
    frame = document.createElement('iframe');
    frame.id = 'gameFrame';
    frame.title = game.title;
    frame.allow = 'fullscreen; autoplay; gamepad';
    frame.setAttribute('allowfullscreen', '');
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    // No sandbox/Blob URL: these are trusted local games and need same-origin storage.
    frame.srcdoc = html;
    $('gameHost').appendChild(frame);
    startupTimer = setTimeout(() => {
      if (currentAttempt === attempt && document.body.dataset.state === 'preparing') fail('游戏画面准备时间过长。请重新加载，或稍后再试。');
    }, 120000);
  }

  async function start() {
    clearAttempt();
    const currentAttempt = ++attempt;
    controller = new AbortController();
    loaded = 0;
    total = 0;
    $('loadingScreen').hidden = false;
    $('gameReturn').hidden = true;
    $('retryButton').hidden = true;
    $('loadEyebrow').textContent = 'NEXT UP / 即将进入';
    $('loadDescription').textContent = game.description || '游戏即将开始。';
    $('loadStatus').textContent = '正在连接游戏资源';
    $('loadPercent').textContent = '—';
    $('loadBytes').textContent = '已读取 0 MB';
    $('loadBar').style.width = '0%';
    $('cancelLink').firstChild.textContent = '取消并返回游戏库 ';
    document.body.dataset.state = 'loading';
    indeterminate('正在连接游戏资源');
    try {
      const url = new URL(game.path, document.baseURI);
      if (url.origin !== location.origin) throw new Error('游戏资源地址不属于当前站点');
      const response = await fetch(url, { signal: controller.signal, credentials: 'same-origin', cache: 'no-cache' });
      if (!response.ok) throw new Error(`游戏资源读取失败（HTTP ${response.status}）。请重试。`);
      const encoding = (response.headers.get('content-encoding') || '').toLowerCase();
      const length = Number(response.headers.get('content-length'));
      total = (!encoding || encoding === 'identity') && Number.isFinite(length) && length > 0 ? length : 0;
      $('loadStatus').textContent = '正在下载游戏';
      const decoder = new TextDecoder('utf-8');
      const parts = [];
      const update = () => {
        if (total && loaded > total) total = 0;
        $('loadBytes').textContent = bytesLabel();
        if (total) {
          const percent = Math.floor(loaded / total * 100);
          $('loadProgress').classList.remove('is-indeterminate');
          $('loadProgress').setAttribute('aria-label', '游戏资源下载进度');
          $('loadProgress').setAttribute('aria-valuenow', String(percent));
          $('loadBar').style.width = percent + '%';
          $('loadPercent').textContent = percent + '%';
        } else {
          indeterminate('正在下载游戏，资源总量未知');
          $('loadPercent').textContent = '读取中';
        }
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
      if (!loaded) throw new Error('游戏资源为空，请重新加载');
      mountGame(parts.join(''), url, currentAttempt);
    } catch (error) {
      if (currentAttempt !== attempt || error.name === 'AbortError') return;
      fail(error instanceof TypeError ? '无法连接游戏资源，请检查网络后重试。' : error.message);
    }
  }

  addEventListener('message', (event) => {
    const data = event.data;
    if (!frame || event.source !== frame.contentWindow || (event.origin !== location.origin && event.origin !== 'null') || data?.channel !== 'neon-arcade-loader' || data.token !== activeToken) return;
    if (data.type === 'pointerlock') {
      document.body.classList.toggle('is-pointer-locked', Boolean(data.locked));
      return;
    }
    if (document.body.dataset.state !== 'preparing') return;
    if (data.type === 'images') {
      $('loadStatus').textContent = data.count ? `正在准备画面 · ${data.done} / ${data.count}` : '正在启动游戏';
    } else if (data.type === 'error') {
      fail(data.message || '游戏初始化失败，请重新加载');
    } else if (data.type === 'ready') {
      clearTimeout(startupTimer);
      $('loadStatus').textContent = '准备完成';
      $('loadPercent').textContent = '100%';
      $('loadProgress').classList.remove('is-indeterminate');
      $('loadProgress').setAttribute('aria-valuenow', '100');
      $('loadProgress').setAttribute('aria-label', '游戏准备完成');
      $('loadBar').style.width = '100%';
      document.body.dataset.state = 'ready';
      $('loadingScreen').hidden = true;
      $('gameReturn').hidden = false;
      frame.removeAttribute('aria-hidden');
      frame.removeAttribute('tabindex');
      frame.contentWindow.focus();
    }
  });

  $('retryButton').addEventListener('click', () => { if (game) start(); });
  $('cancelLink').addEventListener('click', () => { attempt++; clearAttempt(); });
  $('gameReturn').addEventListener('click', () => { attempt++; clearAttempt(); });
  addEventListener('pagehide', () => { attempt++; clearAttempt(); });
  addEventListener('pageshow', (event) => { if (event.persisted && game) start(); });
  if (!game) {
    $('loadTitle').textContent = '没有找到这款游戏';
    $('loadCover').hidden = true;
    fail(games.length ? '这个游戏入口已失效，请返回游戏库重新选择。' : '游戏目录暂时无法读取，请返回游戏库重试。', false);
    return;
  }
  document.title = `${game.title} · NEON ARCADE`;
  $('loadTitle').textContent = game.title;
  $('loadEnglish').textContent = game.en || '';
  $('loadCover').src = game.cover;
  $('loadCover').alt = `${game.title}游戏封面`;
  $('loadControls').textContent = Array.isArray(game.controls) ? game.controls.join(' · ') : (game.controls || '');
  $('loadCover').addEventListener('error', () => { $('loadCover').hidden = true; }, { once: true });
  start();
})();
