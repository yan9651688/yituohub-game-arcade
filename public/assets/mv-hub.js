(() => {
  "use strict";

  // Add future videos here. Each item maps to one detail page and one poster.
  const videos = Object.freeze([
    Object.freeze({
      title: "千禧凝思",
      en: "LANTERNS STILL BURN",
      type: "AI MUSIC VIDEO",
      meta: "Y2K MEMOIR · LYRIC FILM v3",
      duration: "03:10",
      description: "穿过 1998—2000 的霓虹记忆。一场把歌词、旧街区和千禧年夜色揉在一起的 AI 音乐视觉演出。",
      cover: "assets/mv/lanterns-still-burn-cover.png",
      href: "game-arcade/film.html"
    })
  ]);

  const grid = document.querySelector("[data-mv-grid]");
  const count = document.querySelector("[data-mv-count]");
  if (!grid) return;

  function makeCard(video, index) {
    const article = document.createElement("article");
    article.className = "mv-card";
    const cover = document.createElement("a");
    cover.className = "mv-cover";
    cover.href = video.href;
    cover.setAttribute("aria-label", `观看 ${video.title}：${video.en}`);
    const img = document.createElement("img");
    img.src = video.cover;
    img.alt = `${video.title} · ${video.en} MV 封面`;
    img.width = 1536;
    img.height = 864;
    img.loading = index === 0 ? "eager" : "lazy";
    img.decoding = "async";
    const no = document.createElement("span");
    no.className = "mv-index";
    no.textContent = `MV / ${String(index + 1).padStart(2, "0")}`;
    const duration = document.createElement("span");
    duration.className = "mv-duration";
    duration.textContent = video.duration;
    const play = document.createElement("span");
    play.className = "play-badge";
    play.textContent = "WATCH FILM";
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
    for (const tag of [video.meta, `${video.duration} · AI 生成`, "自由视角"]) {
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
    mode.textContent = "已上线 · 可播放";
    const link = document.createElement("a");
    link.className = "watch-link";
    link.href = video.href;
    link.innerHTML = "进入演出 <span aria-hidden=\"true\">↗</span>";
    bottom.append(mode, link);
    body.append(heading, en, tags, description, bottom);
    article.append(cover, body);
    return article;
  }

  count.textContent = String(videos.length).padStart(2, "0");
  grid.replaceChildren(...videos.map(makeCard));
})();
