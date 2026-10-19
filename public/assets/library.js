(() => {
  "use strict";

  const classics = document.body.dataset.catalogue === "classics";
  const i18n = window.SiteI18n;
  const t = (key, vars) => i18n.t(key, vars);
  const games = (classics ? window.CLASSIC_GAMES : window.ARCADE_GAMES) || [];
  const launchPage = classics ? "classics-play.html" : "play.html";
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
  let category = "";

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function syncUrl(push = false) {
    const url = new URL(window.location.href);
    const query = search.value.trim();
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    if (category) url.searchParams.set("category", category);
    else url.searchParams.delete("category");
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
      subtitle.textContent = game.en;
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
    titleRow.append(title, element("span", "game-number", `NO.${String(games.indexOf(original) + 1).padStart(2, "0")}`));
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
    body.append(titleRow, subtitle, tags, element("p", "game-description", game.description), controls, bottom);
    card.append(cover, body);
    staticCards.set(game.id, card);
    return card;
  }

  function refreshSeo() {
    const url = new URL(classics ? 'classics.html' : 'games.html', 'https://game.yituohub.com/');
    if (i18n.locale !== 'zh-Hans') url.searchParams.set('lang', i18n.locale);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', url.href);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', url.href);
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', { 'zh-Hans': 'zh_CN', 'zh-Hant': 'zh_TW', en: 'en_US' }[i18n.locale]);
    const schema = document.getElementById('catalog-schema');
    if (!schema) return;
    const data = JSON.parse(schema.textContent);
    data.name = t('lib.seoList');
    data.itemListElement.forEach(entry => {
      const original = games[entry.position - 1];
      if (!original) return;
      const game = i18n.localizeGame(original);
      const launchUrl = new URL(launchPage, 'https://game.yituohub.com/');
      launchUrl.searchParams.set('game', game.id);
      if (i18n.locale !== 'zh-Hans') launchUrl.searchParams.set('lang', i18n.locale);
      Object.assign(entry.item, { name: game.title, alternateName: game.en, description: game.description, genre: [categoryLabel(original.category), ...game.tags], url: launchUrl.href, image: new URL(game.cover, 'https://game.yituohub.com/').href });
      // VideoGame.inLanguage describes the game itself, not this translated listing.
    });
    schema.textContent = JSON.stringify(data);
  }

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const terms = query.split(/\s+/).filter(Boolean);
    const visible = games.filter(game => {
      if (category && game.category !== category) return false;
      const variants = [game, ...Object.values(window.SITE_GAME_TRANSLATIONS || {}).map(locale => locale[game.id]).filter(Boolean)];
      const text = variants.flatMap(item => [item.title, item.en, item.category, ...(item.tags || []), item.description, item.controls, item.mobileControls || ""]).join(" ").toLocaleLowerCase();
      return terms.every(term => text.includes(term));
    });
    grid.replaceChildren(...visible.map(makeCard));
    grid.hidden = visible.length === 0;
    empty.hidden = visible.length !== 0;
    clearSearch.hidden = search.value.length === 0;
    for (const button of filters.querySelectorAll("button")) {
      button.setAttribute("aria-pressed", String(button.dataset.category === category));
      button.firstElementChild.textContent = categoryLabel(button.dataset.category);
    }
    heading.textContent = query ? t('lib.results') : category ? categoryLabel(category) : t('lib.allGames');
    count.textContent = t(category || query ? 'lib.filteredCount' : 'lib.count', { count: visible.length, total: games.length });
  }

  function readUrl() {
    const params = new URLSearchParams(window.location.search);
    search.value = (params.get("q") || "").slice(0, 100);
    const selected = params.get("category") || "";
    category = categories.includes(selected) ? selected : "";
    render();
  }

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
  window.addEventListener("site:languagechange", () => { render(); refreshSeo(); });
  touchInput.addEventListener("change", () => {
    for (const card of grid.querySelectorAll(".game-card")) {
      const game = games.find(item => item.id === card.dataset.game);
      if (game) card.querySelector(".game-controls span").textContent = controlsFor(i18n.localizeGame(game));
    }
  });
  readUrl();
  refreshSeo();
})();
