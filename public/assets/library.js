(() => {
  "use strict";

  const games = window.ARCADE_GAMES || [];
  const categories = [...new Set(games.map(game => game.category))];
  const grid = document.getElementById("game-grid");
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

  function makeCard(game, index) {
    const card = element("article", "game-card");
    card.dataset.game = game.id;
    const href = `play.html?game=${encodeURIComponent(game.id)}`;
    const cover = element("a", "cover-link");
    cover.href = href;
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
    titleRow.append(title, element("span", "game-number", `NO.${String(games.indexOf(game) + 1).padStart(2, "0")}`));
    const tags = element("div", "game-tags");
    for (const tag of game.tags) tags.append(element("span", "", tag));
    const controls = element("p", "game-controls");
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = '<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M5 10h2m2 0h2m2 0h2m2 0h2M5 13h2m2 0h2m2 0h2m2 0h2M7 16h10"/>';
    controls.append(icon, element("span", "", game.controls));
    const bottom = element("div", "card-bottom");
    bottom.append(element("span", "game-mode", game.category));
    const launch = element("a", "launch-link", "开始游戏");
    launch.href = href;
    launch.setAttribute("aria-label", `开始游戏：${game.title}`);
    const arrow = element("span", "", "↗");
    arrow.setAttribute("aria-hidden", "true");
    launch.append(arrow);
    bottom.append(launch);
    body.append(titleRow, element("p", "game-en", game.en), tags, element("p", "game-description", game.description), controls, bottom);
    card.append(cover, body);
    return card;
  }

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const terms = query.split(/\s+/).filter(Boolean);
    const visible = games.filter(game => {
      if (category && game.category !== category) return false;
      const text = [game.title, game.en, game.category, ...game.tags, game.description, game.controls].join(" ").toLocaleLowerCase();
      return terms.every(term => text.includes(term));
    });
    grid.replaceChildren(...visible.map(makeCard));
    grid.hidden = visible.length === 0;
    empty.hidden = visible.length !== 0;
    clearSearch.hidden = search.value.length === 0;
    for (const button of filters.querySelectorAll("button")) {
      button.setAttribute("aria-pressed", String(button.dataset.category === category));
    }
    heading.textContent = query ? "搜索结果" : category || "全部游戏";
    count.textContent = category || query ? `找到 ${visible.length} 款游戏 · 共 ${games.length} 款` : `${games.length} 款游戏 · 即点即玩`;
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
    button.append(element("span", "", name || "全部"), element("span", "category-count", String(name ? games.filter(game => game.category === name).length : games.length).padStart(2, "0")));
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
  readUrl();
})();
