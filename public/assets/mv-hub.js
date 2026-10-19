(() => {
  "use strict";

  // Add future videos here. Each item maps to one detail page and one poster.
  const videos = Object.freeze([
    Object.freeze({
      id: 'afang-palace',
      title: '阿房宫', en: 'AFANG PALACE', type: 'INTERACTIVE MUSIC SCENE',
      localePrefix: 'mv.afang',
      cover: 'assets/mv/afang-palace-cover.webp',
      href: 'game-arcade/afang-palace/index.html'
    }),
    Object.freeze({
      id: 'lanterns-still-burn',
      title: "千禧凝思",
      en: "LANTERNS STILL BURN",
      type: "AI MUSIC VIDEO",
      meta: "Y2K MEMOIR · LYRIC FILM v3",
      duration: "03:10",
      description: "穿过 1998—2000 的霓虹记忆。一场把歌词、旧街区和千禧年夜色揉在一起的 AI 音乐视觉演出。",
      cover: "assets/mv/lanterns-still-burn-cover.webp",
      href: "game-arcade/film.html"
    })
  ]);

  const t = (key, vars) => SiteI18n.t(key, vars);
  const grid = document.querySelector("[data-mv-grid]");
  const counts = document.querySelectorAll("[data-mv-count]");
  if (!grid) return;

  function makeCard(source, index) {
    const prefix = source.localePrefix || 'mv.film';
    const video = { ...source, title: t(prefix + 'Title'), en: t(prefix + 'Subtitle'), description: t(prefix + 'Description') };
    const article = document.createElement("article");
    article.className = "mv-card";
    article.dataset.film = source.id;
    const cover = document.createElement("a");
    cover.className = "mv-cover";
    cover.href = SiteI18n.href(video.href);
    cover.setAttribute("aria-label", t("mv.watchLabel", { title: video.title }));
    const img = document.createElement("img");
    img.src = video.cover;
    img.alt = t("mv.coverAlt", { title: video.title });
    img.width = 1536;
    img.height = 864;
    img.loading = index === 0 ? "eager" : "lazy";
    img.decoding = "async";
    const no = document.createElement("span");
    no.className = "mv-index";
    no.textContent = `MV / ${String(index + 1).padStart(2, "0")}`;
    const duration = document.createElement("span");
    duration.className = "mv-duration";
    duration.textContent = source.localePrefix ? t(prefix + 'Format') : video.duration;
    const play = document.createElement("span");
    play.className = "play-badge";
    play.textContent = t(source.localePrefix ? prefix + 'Watch' : 'mv.watch');
    cover.append(img, no, duration, play);

    const body = document.createElement("div");
    body.className = "mv-card-body";
    const heading = document.createElement("div");
    heading.className = "mv-card-heading";
    const title = document.createElement("h3");
    title.textContent = video.title;
    const cardNo = document.createElement("span");
    cardNo.className = "mv-card-no";
    cardNo.textContent = video.type;
    heading.append(title, cardNo);
    const en = document.createElement("p");
    en.className = "mv-en";
    en.textContent = video.en;
    const tags = document.createElement("div");
    tags.className = "mv-tags";
    const tagLabels = source.localePrefix ? [t(prefix + 'Views'), t(prefix + 'Lighting'), t(prefix + 'Music')] : [video.meta, t("mv.generated", { duration: video.duration }), t("mv.freeView")];
    for (const tag of tagLabels) {
      const item = document.createElement("span");
      item.textContent = tag;
      tags.append(item);
    }
    const description = document.createElement("p");
    description.className = "mv-description";
    description.textContent = video.description;
    const bottom = document.createElement("div");
    bottom.className = "mv-card-bottom";
    const mode = document.createElement("span");
    mode.className = "mv-mode";
    mode.textContent = t("mv.available");
    const link = document.createElement("a");
    link.className = "watch-link";
    link.href = SiteI18n.href(video.href);
    link.innerHTML = `${t(source.localePrefix ? prefix + 'Enter' : 'mv.enter')} <span aria-hidden="true">↗</span>`;
    bottom.append(mode, link);
    body.append(heading, en, tags, description, bottom);
    article.append(cover, body);
    return article;
  }

  counts.forEach(count => { count.textContent = String(videos.length).padStart(2, "0"); });
  const render = () => grid.replaceChildren(...videos.map(makeCard));
  render();
  window.addEventListener("site:languagechange", render);
})();
