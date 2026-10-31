(() => {
  "use strict";

  const classics = document.body.dataset.catalogue === "classics";
  const workshop = document.body.dataset.catalogue === "workshop";
  const i18n = window.SiteI18n;
  const t = (key, vars) => i18n.t(key, vars);
  const games = (workshop ? window.WORKSHOP_GAMES : classics ? window.CLASSIC_GAMES : window.ARCADE_GAMES) || [];
  const launchPage = workshop ? "workshop-play.html" : classics ? "classics-play.html" : "play.html";
  const touchInput = window.matchMedia("(pointer: coarse)");
  const controlsFor = game => touchInput.matches && game.mobileControls ? game.mobileControls : game.controls;
  const categoryLabel = name => name ? t(`lib.category.${name}`) : t('lib.all');
  const categories = [...new Set(games.map(game => game.category))];
  const grid = document.getElementById("game-grid");
  // Keep the server-rendered cards useful without JavaScript, and reuse their
  // existing image nodes when filters or the interface language change.
  const staticCards = new Map([...grid.querySelectorAll('.game-card[data-game]')].map(card => [card.dataset.game, card]));
  const filters = document.getElementById("category-filters");
  const search = document.getElementById("game-search");
  const clearSearch = document.getElementById("clear-search");
  const empty = document.getElementById("empty-state");
  const heading = document.getElementById("results-heading");
  const count = document.getElementById("result-count");
  const catalogueKey = workshop ? "workshop" : classics ? "classics" : "originals";
  const gameById = new Map(games.map(game => [game.id, game]));
  const NEW_DURATION = 72 * 60 * 60 * 1000;
  const POPULARITY_MAX_AGE = 24 * 60 * 60 * 1000;
  const REFRESH_INTERVAL = 5 * 60 * 1000;
  let popularity = null;
  let popularityRequest = false;
  let lastPopularityAttempt = 0;
  let badgeExpiryTimer;
  let category = "";
  let sortMode = "popular";

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function timestamp(value) {
    // Explicit offsets keep launch times consistent for visitors in every country.
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return NaN;
    const [year, month, day] = value.slice(0, 10).split("-").map(Number);
    if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate()) return NaN;
    return Date.parse(value);
  }

  function freshPopularity(now = Date.now()) {
    if (!popularity) return false;
    const age = now - popularity.generatedAt;
    return age >= -REFRESH_INTERVAL && age < POPULARITY_MAX_AGE;
  }

  function orderedGames() {
    if (sortMode === "newest") {
      const now = Date.now();
      return games.map((game, index) => {
        const releasedAt = timestamp(game.releasedAt);
        return { game, index, time: Number.isFinite(releasedAt) && releasedAt <= now ? releasedAt : -Infinity };
      }).sort((a, b) => b.time - a.time || a.index - b.index).map(entry => entry.game);
    }
    if (!freshPopularity()) return games;
    const ranked = new Set(popularity.order);
    return [...popularity.order.map(id => gameById.get(id)), ...games.filter(game => !ranked.has(game.id))];
  }

  function syncBadges(card, game, now = Date.now()) {
    const releasedAt = timestamp(game.releasedAt);
    const isNew = Number.isFinite(releasedAt) && now >= releasedAt && now - releasedAt < NEW_DURATION;
    const isHot = freshPopularity(now) && popularity.hot.has(game.id);
    let badges = card.querySelector(".game-badges");
    if (!isNew && !isHot) {
      badges?.remove();
      return;
    }
    if (!badges) {
      badges = element("div", "game-badges");
    }
    // Status belongs beside the game title, below the artwork, in reading order.
    const titleRow = card.querySelector(".game-heading");
    if (badges.parentElement !== titleRow) titleRow.append(badges);
    const items = [];
    for (const kind of ["hot", "new"]) {
      if (kind === "hot" ? !isHot : !isNew) continue;
      const badge = element("span", `game-badge game-badge--${kind}`, t(`lib.badge.${kind}`));
      const label = t(`lib.badge.${kind}Label`);
      badge.setAttribute("aria-label", label);
      badge.title = label;
      items.push(badge);
    }
    badges.replaceChildren(...items);
  }

  function scheduleBadgeExpiry() {
    clearTimeout(badgeExpiryTimer);
    const now = Date.now();
    const expiries = games.map(game => timestamp(game.releasedAt))
      .filter(releasedAt => Number.isFinite(releasedAt) && releasedAt <= now && releasedAt + NEW_DURATION > now)
      .map(releasedAt => releasedAt + NEW_DURATION);
    if (freshPopularity(now)) expiries.push(popularity.generatedAt + POPULARITY_MAX_AGE);
    if (!expiries.length) return;
    badgeExpiryTimer = setTimeout(() => {
      if (!freshPopularity()) popularity = null;
      render();
    }, Math.max(1, Math.min(...expiries) - now));
  }

  function parsePopularity(data) {
    const generatedAt = timestamp(data?.generatedAt);
    const age = Date.now() - generatedAt;
    const list = data?.catalogues?.[catalogueKey];
    if (data?.version !== 2 || data?.period !== "all" || data?.windowDays !== null || !Number.isFinite(generatedAt) || age < -REFRESH_INTERVAL || age >= POPULARITY_MAX_AGE || !Array.isArray(list?.order) || !Array.isArray(list?.hot)) return null;
    const order = [...new Set(list.order.filter(id => typeof id === "string" && gameById.has(id)))];
    const wantedHot = new Set(list.hot.filter(id => typeof id === "string"));
    return { generatedAt, order, hot: new Set(order.filter(id => wantedHot.has(id)).slice(0, 3)) };
  }

  async function refreshPopularity() {
    if (!games.length) return;
    if (popularityRequest) return;
    popularityRequest = true;
    lastPopularityAttempt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetch("/api/game-popularity.json", { cache: "no-store", credentials: "omit", signal: controller.signal });
      if (!response.ok) throw new Error("Popularity unavailable");
      popularity = parsePopularity(await response.json());
    } catch {
      // Browsing and launching stay available when analytics or the network is down.
      popularity = null;
    } finally {
      clearTimeout(timeout);
      popularityRequest = false;
      render();
    }
  }

  function syncUrl(push = false) {
    const url = new URL(window.location.href);
    const query = search.value.trim();
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    if (category) url.searchParams.set("category", category);
    else url.searchParams.delete("category");
    if (sortMode === "newest") url.searchParams.set("sort", "newest");
    else url.searchParams.delete("sort");
    if (url.href !== window.location.href) {
      history[push ? "pushState" : "replaceState"]({}, "", url);
    }
  }

  function makeCard(original, index) {
    const game = i18n.localizeGame(original);
    const existing = staticCards.get(game.id);
    if (existing) {
      const href = i18n.href(`${launchPage}?game=${encodeURIComponent(game.id)}`);
      existing.querySelector('.game-heading h3').textContent = game.title;
      const subtitle = existing.querySelector('.game-en');
      // Migrate a cached older HTML card without replacing its image or links.
      if (!existing.querySelector('.game-subheading')) {
        const subheading = element('div', 'game-subheading');
        subtitle.before(subheading);
        subheading.append(subtitle);
        const number = existing.querySelector('.game-number');
        if (number) subheading.append(number);
      }
      subtitle.textContent = game.en;
      syncAuthor(existing, original);
      syncDetails(existing, original);
      subtitle.hidden = game.en?.trim().toLocaleLowerCase() === game.title.trim().toLocaleLowerCase();
      existing.querySelector('.game-tags').replaceChildren(...game.tags.map(tag => element('span', '', tag)));
      existing.querySelector('.game-description').textContent = game.description;
      existing.querySelector('.game-controls span').textContent = controlsFor(game);
      existing.querySelector('.game-mode').textContent = categoryLabel(original.category);
      existing.querySelector('.cover-link').href = href;
      const img = existing.querySelector('.cover-link img');
      if (img.getAttribute('src') !== game.cover) img.src = game.cover;
      img.loading = index < 3 ? 'eager' : 'lazy';
      const launch = existing.querySelector('.launch-link');
      launch.href = href;
      launch.firstChild.textContent = t('lib.play');
      launch.title = t('lib.newTab');
      launch.setAttribute('aria-label', t('lib.playAria', { title: game.title }));
      syncBadges(existing, original);
      return existing;
    }
    const card = element("article", "game-card");
    card.dataset.game = game.id;
    const href = i18n.href(`${launchPage}?game=${encodeURIComponent(game.id)}`);
    const cover = element("a", "cover-link");
    cover.href = href;
    cover.target = "_blank";
    cover.rel = "noopener";
    cover.tabIndex = -1;
    cover.setAttribute("aria-hidden", "true");
    const img = element("img");
    img.src = game.cover;
    img.alt = "";
    img.width = 1536;
    img.height = 864;
    img.loading = index < 3 ? "eager" : "lazy";
    img.decoding = "async";
    cover.append(img);
    const body = element("div", "game-card-body");
    const titleRow = element("div", "game-heading");
    const title = element("h3", "", game.title);
    titleRow.append(title);
    const tags = element("div", "game-tags");
    for (const tag of game.tags) tags.append(element("span", "", tag));
    const controls = element("p", "game-controls");
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = '<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M5 10h2m2 0h2m2 0h2m2 0h2M5 13h2m2 0h2m2 0h2m2 0h2M7 16h10"/>';
    controls.append(icon, element("span", "", controlsFor(game)));
    const bottom = element("div", "card-bottom");
    bottom.append(element("span", "game-mode", categoryLabel(original.category)));
    const launch = element("a", "launch-link", t('lib.play'));
    launch.href = href;
    launch.target = "_blank";
    launch.rel = "noopener";
    launch.title = t('lib.newTab');
    launch.setAttribute("aria-label", t('lib.playAria', { title: game.title }));
    const arrow = element("span", "", "↗");
    arrow.setAttribute("aria-hidden", "true");
    launch.append(arrow);
    bottom.append(launch);
    const subtitle = element("p", "game-en", game.en);
    subtitle.hidden = game.en?.trim().toLocaleLowerCase() === game.title.trim().toLocaleLowerCase();
    const subheading = element("div", "game-subheading");
    subheading.append(subtitle, element("span", "game-number", `NO.${String(games.indexOf(original) + 1).padStart(2, "0")}`));
    body.append(titleRow, subheading, tags, element("p", "game-description", game.description), controls, bottom);
    card.append(cover, body);
    syncAuthor(card, original);
    syncDetails(card, original);
    syncBadges(card, original);
    staticCards.set(game.id, card);
    return card;
  }

  function syncDetails(card, original) {
    let link = card.querySelector('.game-details-link');
    if (!original.detailsPath) { link?.remove(); return; }
    if (!link) {
      link = element('a', 'game-details-link');
      card.querySelector('.game-controls').after(link);
    }
    link.href = i18n.href(original.detailsPath);
    link.textContent = t('lib.details');
    link.setAttribute('aria-label', t('lib.detailsAria', { title: i18n.localizeGame(original).title }));
  }

  function syncAuthor(card, game) {
    if (!workshop) return;
    let byline = card.querySelector('.game-author');
    if (!byline) {
      byline = element('p', 'game-author');
      card.querySelector('.game-heading').after(byline);
    }
    byline.replaceChildren(element('span', 'game-author-label', t('workshop.author')), element('span', 'game-author-name', game.author || ''));
  }

  function refreshSeo() {
    const url = new URL(workshop ? 'workshop.html' : classics ? 'classics.html' : 'games.html', 'https://game.yituohub.com/');
    if (i18n.locale !== 'zh-Hans') url.searchParams.set('lang', i18n.locale);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', url.href);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', url.href);
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', { 'zh-Hans': 'zh_CN', 'zh-Hant': 'zh_TW', en: 'en_US' }[i18n.locale]);
    const schema = document.getElementById('catalog-schema');
    if (!schema) return;
    let data;
    try { data = JSON.parse(schema.textContent); } catch { return; }
    if (!Array.isArray(data.itemListElement)) return;
    const entriesById = new Map(data.itemListElement.map(entry => {
      try { return [entry.item.identifier || new URL(entry.item.url, 'https://game.yituohub.com/').searchParams.get('game'), entry]; }
      catch { return [null, entry]; }
    }));
    data.name = t(workshop ? 'workshop.list' : 'lib.seoList');
    data.numberOfItems = games.length;
    data.itemListElement = orderedGames().map((original, index) => {
      const entry = entriesById.get(original.id) || (workshop ? { '@type': 'ListItem', item: { '@type': 'VideoGame', gamePlatform: 'Web Browser' } } : null);
      if (!entry) return null;
      entry.position = index + 1;
      const game = i18n.localizeGame(original);
      const launchUrl = new URL(original.detailsPath || launchPage, 'https://game.yituohub.com/');
      if (!original.detailsPath) launchUrl.searchParams.set('game', game.id);
      if (i18n.locale !== 'zh-Hans') launchUrl.searchParams.set('lang', i18n.locale);
      Object.assign(entry.item, { name: game.title, alternateName: game.en, description: game.description, genre: [categoryLabel(original.category), ...game.tags], url: launchUrl.href, image: new URL(game.cover, 'https://game.yituohub.com/').href });
      if (workshop && original.author) entry.item.author = { '@type': 'Person', name: original.author };
      // VideoGame.inLanguage describes the game itself, not this translated listing.
      return entry;
    }).filter(Boolean);
    schema.textContent = JSON.stringify(data);
  }

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const terms = query.split(/\s+/).filter(Boolean);
    const visible = orderedGames().filter(game => {
      if (category && game.category !== category) return false;
      const variants = [game, ...Object.values(window.SITE_GAME_TRANSLATIONS || {}).map(locale => locale[game.id]).filter(Boolean)];
      const text = variants.flatMap(item => [item.title, item.en, item.author || "", item.category, ...(item.tags || []), item.description, item.controls, item.mobileControls || ""]).join(" ").toLocaleLowerCase();
      return terms.every(term => text.includes(term));
    });
    const focused = grid.contains(document.activeElement) ? document.activeElement : null;
    const cards = visible.map(makeCard);
    const visibleCards = new Set(cards);
    for (const child of [...grid.children]) {
      if (!visibleCards.has(child)) child.remove();
    }
    cards.forEach((card, index) => {
      if (grid.children[index] !== card) grid.insertBefore(card, grid.children[index] || null);
    });
    if (focused?.isConnected && document.activeElement !== focused) focused.focus({ preventScroll: true });
    grid.hidden = visible.length === 0;
    empty.hidden = visible.length !== 0;
    if (workshop) {
      const awaiting = games.length === 0;
      document.getElementById('workshop-waiting').hidden = !awaiting;
      document.querySelector('.browse-bar').hidden = awaiting;
      document.querySelector('.results-bar').hidden = awaiting;
      document.querySelector('.library-count').hidden = awaiting;
      if (awaiting) empty.hidden = true;
    }
    clearSearch.hidden = search.value.length === 0;
    for (const button of filters.querySelectorAll("button")) {
      button.setAttribute("aria-pressed", String(button.dataset.category === category));
      button.firstElementChild.textContent = categoryLabel(button.dataset.category);
    }
    heading.textContent = query ? t('lib.results') : category ? categoryLabel(category) : t('lib.allGames');
    count.textContent = t(category || query ? 'lib.filteredCount' : 'lib.count', { count: visible.length, total: games.length });
    sortLabel.textContent = t('lib.sort.label');
    for (const option of sortSelect.options) option.textContent = t(`lib.sort.${option.value}`);
    sortSelect.value = sortMode;
    refreshSeo();
    scheduleBadgeExpiry();
  }

  function readUrl() {
    const params = new URLSearchParams(window.location.search);
    search.value = (params.get("q") || "").slice(0, 100);
    const selected = params.get("category") || "";
    category = categories.includes(selected) ? selected : "";
    sortMode = params.get("sort") === "newest" ? "newest" : "popular";
    render();
  }

  const resultsTools = element("div", "results-tools");
  const sortControl = element("label", "library-sort");
  const sortLabel = element("span", "", t('lib.sort.label'));
  const sortSelect = element("select");
  sortSelect.id = "game-sort";
  sortSelect.name = "sort";
  for (const value of ["popular", "newest"]) {
    const option = element("option", "", t(`lib.sort.${value}`));
    option.value = value;
    sortSelect.append(option);
  }
  sortControl.append(sortLabel, sortSelect);
  count.parentElement.append(resultsTools);
  resultsTools.append(count, sortControl);
  sortSelect.addEventListener("change", () => {
    sortMode = sortSelect.value === "newest" ? "newest" : "popular";
    render();
    syncUrl(true);
  });

  for (const name of ["", ...categories]) {
    const button = element("button", "category-filter");
    button.type = "button";
    button.dataset.category = name;
    button.append(element("span", "", categoryLabel(name)), element("span", "category-count", String(name ? games.filter(game => game.category === name).length : games.length).padStart(2, "0")));
    button.addEventListener("click", () => {
      category = name;
      render();
      syncUrl(true);
    });
    filters.append(button);
  }

  document.getElementById("total-games").textContent = String(games.length).padStart(2, "0");
  document.getElementById("search-form").addEventListener("submit", event => event.preventDefault());
  search.addEventListener("input", () => { render(); syncUrl(); });
  clearSearch.addEventListener("click", () => { search.value = ""; render(); syncUrl(); search.focus(); });
  document.getElementById("reset-filters").addEventListener("click", () => {
    search.value = "";
    category = "";
    render();
    syncUrl(true);
    filters.querySelector("button").focus();
  });
  document.addEventListener("keydown", event => {
    const editing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "") || document.activeElement?.isContentEditable;
    if (event.key === "/" && !editing && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      search.focus();
    } else if (event.key === "Escape" && document.activeElement === search) {
      search.value = "";
      render();
      syncUrl();
    }
  });
  window.addEventListener("popstate", readUrl);
  window.addEventListener("site:languagechange", render);
  touchInput.addEventListener("change", () => {
    for (const card of grid.querySelectorAll(".game-card")) {
      const game = games.find(item => item.id === card.dataset.game);
      if (game) card.querySelector(".game-controls span").textContent = controlsFor(i18n.localizeGame(game));
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    if (!freshPopularity()) popularity = null;
    render();
    if (Date.now() - lastPopularityAttempt >= REFRESH_INTERVAL) refreshPopularity();
  });
  setInterval(() => {
    if (!document.hidden) refreshPopularity();
  }, REFRESH_INTERVAL);
  readUrl();
  refreshPopularity();
})();
