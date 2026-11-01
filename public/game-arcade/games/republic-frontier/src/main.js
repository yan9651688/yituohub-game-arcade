import { Game } from "./engine.js";
import { Renderer } from "./renderer.js";
import { UNITS, BUILDINGS, FACTIONS, displayName, definition } from "./data.js";
import { MAPS, createMap } from "./maps.js";
import { tacticalColor, elevationAt } from "./terrain.js";
import { CAMPAIGNS, getMission } from "./campaigns.js";
import {
  writeSave,
  readSave,
  listSaves,
  latestMeta,
  exportSave,
} from "./persistence.js";
import { AudioBus } from "./audio.js";
import { artProgress, waitForArt } from "./assets-ready.js";

const $ = (id) => document.getElementById(id);
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const allMissions = [...CAMPAIGNS.allied, ...CAMPAIGNS.china];
const SETTINGS_KEY = "republic-frontier-settings-v1",
  PROGRESS_KEY = "republic-frontier-campaign-v1",
  COACH_KEY = "republic-frontier-coach-v1";
let settings = { muted: false, modernControls: false, speed: 1 },
  completed = {},
  coachSeen = { campaign: false, skirmish: false };
try {
  const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
  if (s)
    settings = {
      muted: !!s.muted,
      modernControls: !!s.modernControls,
      speed: [1, 1.5, 2].includes(s.speed) ? s.speed : 1,
    };
} catch {}
try {
  completed = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}") || {};
} catch {}
try {
  const c = JSON.parse(localStorage.getItem(COACH_KEY) || "null");
  if (c)
    coachSeen = {
      campaign: !!c.campaign,
      skirmish: !!c.skirmish,
    };
} catch {}
const audio = new AudioBus(settings.muted);
const coarsePointer = () =>
  !!(
    window.matchMedia?.("(pointer: coarse)").matches ||
    (navigator.maxTouchPoints || 0) > 0
  );
function saveCoach() {
  try {
    localStorage.setItem(COACH_KEY, JSON.stringify(coachSeen));
  } catch {}
}
function missionUnlocked(faction, index) {
  if (index <= 0) return true;
  const prev = CAMPAIGNS[faction]?.[index - 1];
  return !!(prev && completed[prev.id]);
}
function formatSavedAt(ts) {
  return new Date(ts).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function setSaveState(text) {
  const el = $("save-state");
  if (el) el.textContent = text;
}
let game = null,
  renderer = null,
  screen = "menu",
  campaignFaction = "allied",
  mapId = "frontier",
  pendingMission = null;
let selection = [],
  placement = null,
  action = null,
  mouse = { x: 0, y: 0, world: { x: 0, y: 0 }, inside: false };
let drag = null,
  activePointers = new Map(),
  longPressTimer = null,
  coach = null,
  groups = {},
  category = "buildings",
  lastFrame = performance.now(),
  accumulator = 0,
  hudAt = 0,
  autoAt = 0;
let toastUntil = 0,
  radioUntil = 0,
  bannerUntil = 0,
  lastRadio = "",
  seenStatus = "",
  pendingAuto = false,
  saveBusy = false;
let launchBusy = false,
  optionsForRestart = null,
  helpResume = false,
  keyPan = new Set(),
  selectionSignature = "",
  productionSignature = "";
const categories = {
  buildings: Object.keys(BUILDINGS).filter(
    (t) =>
      !BUILDINGS[t].deployOnly &&
      !BUILDINGS[t].neutralOnly &&
      !["pillbox", "airDefense", "defenseTower"].includes(t),
  ),
  defenses: ["pillbox", "airDefense", "defenseTower"],
  infantry: ["infantry", "engineer", "dog", "spy"],
  vehicles: [
    "miner",
    "tank",
    "apc",
    "antiAir",
    "artillery",
    "helicopter",
    "fighter",
    "kirov",
    "destroyer",
    "transport",
    "prism",
    "mammoth",
    "mcv",
  ],
};
function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}
function toast(text, kind = "normal", seconds = 3) {
  const modalOpen = [
    "pause-screen",
    "help-screen",
    "result-screen",
    "briefing",
    "load-screen",
  ].some((id) => $(id) && !$(id).hidden);
  const box = $(
    screen === "battle" && !modalOpen ? "battle-toast" : "global-toast",
  );
  box.textContent = text;
  box.classList.toggle("bad", kind === "error");
  box.hidden = false;
  toastUntil = performance.now() + seconds * 1000;
  if (kind === "error") audio.play("error");
}
function titleFor(s) {
  return s.mode === "campaign"
    ? getMission(s.missionId)?.title || "战役行动"
    : MAPS.find((m) => m.id === s.mapId)?.name || "遭遇战";
}
function setScreen(name) {
  screen = name;
  for (const id of ["menu", "campaign-screen", "skirmish-screen", "battle"])
    $(id).hidden = id !== name;
  for (const id of ["briefing", "pause-screen", "result-screen", "help-screen"])
    $(id).hidden = true;
  if (name === "battle") {
    renderer?.resize();
    $("world").focus();
  } else {
    action = null;
    placement = null;
    drag = null;
    keyPan.clear();
  }
  if (name === "menu") refreshContinue();
}
function refreshContinue() {
  const m = latestMeta();
  $("continue-menu").hidden = !m;
  $("continue-detail").textContent = m
    ? `${m.title || "战场存档"} · ${new Date(m.savedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}`
    : "";
}
function factionOf(owner = 0) {
  return game?.state.players.find((p) => p.id === owner)?.faction || "allied";
}
function entityName(e) {
  const roles = {
    investigators: "调查队",
    evacuees: "居民运输车",
    transports: "档案运输船",
    mainForce: "主力装甲",
    captiveEngineers: "待救工程师",
    trappedGuards: "被困守军",
    warehouseGuards: "仓库守军",
  };
  return (
    e.missionName ||
    roles[e.missionRole] ||
    displayName(
      e.type,
      e.kind === "building"
        ? e.createdFaction || factionOf(e.owner)
        : factionOf(e.owner),
    )
  );
}
function selectedEntities() {
  return game
    ? game.state.entities.filter(
        (e) =>
          selection.includes(e.id) &&
          e.hp > 0 &&
          !e.dead &&
          e.carrierId == null,
      )
    : [];
}
function issue(command, quiet = false) {
  if (!game || game.state.status !== "playing") return { ok: false };
  const result = game.command(command) || { ok: true };
  if (!result.ok && !quiet)
    toast(result.reason || "当前无法执行该命令", "error");
  else if (result.ok && !quiet) audio.play("command");
  return result;
}
function select(ids) {
  selection = [...new Set(ids)].filter((id) =>
    game?.state.entities.some(
      (e) =>
        e.id === id &&
        e.hp > 0 &&
        e.owner === 0 &&
        !e.dead &&
        e.carrierId == null,
    ),
  );
  if (game) {
    game.state.selectedIds = selection;
    for (const entity of game.state.entities)
      entity.selected = selection.includes(entity.id);
  }
  selectionSignature = "";
  audio.play("select");
}
function event(ev, data = {}) {
  const type = typeof ev === "string" ? ev : ev?.type;
  const payload = typeof ev === "string" ? data : ev?.data || ev || {};
  if (type === "deployed" && payload.owner === 0) {
    select([payload.entityId]);
    productionSignature = "";
    pendingAuto = true;
    advanceCoach("deploy");
  } else if (type === "missionStage") {
    pendingAuto = true;
    bannerUntil = performance.now() + 3200;
    $("mission-banner").textContent =
      game?.state.mission?.stageTitle || `阶段 ${payload.stage} · 新的行动目标`;
    $("mission-banner").hidden = false;
    audio.play("complete");
  } else if (
    [
      "buildComplete",
      "trainComplete",
      "buildingComplete",
      "productionComplete",
      "unitProduced",
      "constructed",
      "trained",
    ].includes(type)
  ) {
    audio.play("complete");
    productionSignature = "";
  } else if (["shot", "fire"].includes(type)) audio.play("shot");
  else if (
    ["death", "destroyed", "entityDestroyed", "explosion"].includes(type)
  )
    audio.play("explosion");
  else if (["underAttack", "lowPower"].includes(type)) {
    audio.play("alarm");
  } else if (type === "error")
    toast(payload.reason || payload.message || "指令未能执行", "error");
}
function bindGame(instance, options = null, saveLabel = null) {
  game = instance;
  game.onEvent = event;
  optionsForRestart = options ||
    game.state.options || {
      mode: game.state.mode,
      faction: factionOf(),
      difficulty: game.state.difficulty || "normal",
      mapId: game.state.mapId,
      missionId: game.state.missionId,
      players: game.state.players.length,
      seed: 2026,
    };
  selection = [];
  groups = {};
  placement = null;
  action = null;
  drag = null;
  seenStatus = "";
  selectionSignature = "";
  productionSignature = "";
  lastRadio = "";
  accumulator = 0;
  lastFrame = performance.now();
  autoAt = game.state.time;
  pendingAuto = false;
  if (game.state.status === "paused") game.command({ type: "resume" });
  setScreen("battle");
  renderer.resize();
  const own = game.state.entities.filter((e) => e.owner === 0 && e.hp > 0);
  const anchor =
    own.find((e) => e.type === "mcv") ||
    own.find((e) => e.type === "constructionYard") ||
    own[0];
  if (anchor) {
    renderer.centerOn(anchor.x, anchor.y);
    select([anchor.id]);
  }
  $("faction-label").textContent =
    `${FACTIONS[factionOf()]?.name || "前线"}指挥部`;
  category = "buildings";
  setCategory(category);
  drawHud(true);
  if (saveLabel != null) setSaveState(saveLabel);
  else if (options) setSaveState("尚未保存");
  startCoach(game.state);
  if (game.state.mode === "campaign") {
    bannerUntil = performance.now() + 3500;
    $("mission-banner").textContent = titleFor(game.state);
    $("mission-banner").hidden = false;
    pendingAuto = true;
  } else if (!coach) {
    toast(
      "选中基地车，点侧栏「展开」或按 D。建设发电厂和矿场，建立补给。",
      "normal",
      6,
    );
  }
}
async function ensureArtReady() {
  if (artProgress(renderer).ready) return;
  $("boot").hidden = false;
  await waitForArt(renderer, (p) => {
    $("boot-message").textContent =
      `正在载入作战画面 ${Math.floor((p.loaded / Math.max(1, p.total)) * 100)}%`;
  });
  $("boot").hidden = true;
}
async function launch(options) {
  if (launchBusy) return;
  launchBusy = true;
  try {
    audio.unlock();
    await ensureArtReady();
    bindGame(new Game(options), options);
  } catch (error) {
    fail(error);
  } finally {
    launchBusy = false;
  }
}
function pause() {
  if (!game || game.state.status !== "playing") return;
  game.command({ type: "pause" });
  $("pause-screen").hidden = false;
  $("pause-info").textContent =
    `${titleFor(game.state)} · ${formatTime(game.state.time)} · 战场时间已暂停`;
  keyPan.clear();
  drag = null;
  $("selection-marquee").hidden = true;
}
function resume() {
  if (!game) return;
  game.command({ type: "resume" });
  $("pause-screen").hidden = true;
  lastFrame = performance.now();
  accumulator = 0;
  $("world").focus();
}
function formatTime(t) {
  return `${String(Math.floor((t || 0) / 60)).padStart(2, "0")}:${String(Math.floor((t || 0) % 60)).padStart(2, "0")}`;
}
async function save(automatic = false) {
  if (!game || saveBusy || ["won", "lost"].includes(game.state.status)) return;
  saveBusy = true;
  $("save-state").textContent = "正在保存…";
  try {
    const meta = {
      title: titleFor(game.state),
      mode: game.state.mode,
      missionId: game.state.missionId,
      faction: factionOf(),
      stage: game.state.mission?.stage,
      time: game.state.time,
    };
    const record = await writeSave(game.serialize(), meta, automatic);
    $("save-state").textContent =
      `已保存 ${new Date(record.savedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
    if (!automatic) toast("完整战场已保存");
    refreshContinue();
  } catch (error) {
    $("save-state").textContent = "保存失败";
    toast(error?.message || "浏览器存储空间不足，存档未完成", "error", 6);
  } finally {
    saveBusy = false;
  }
}
async function restore(id) {
  if (launchBusy) return false;
  launchBusy = true;
  try {
    const record = await readSave(id);
    if (!record) throw new Error("还没有可读取的战场存档");
    const restored = Game.restore(record.snapshot);
    await ensureArtReady();
    const label = record.savedAt
      ? `已读取 ${formatSavedAt(record.savedAt)}`
      : "存档已恢复";
    setSaveState(label);
    bindGame(restored, null, label);
    toast("战场与任务进度已恢复");
    return true;
  } catch (error) {
    $("boot").hidden = true;
    toast(error?.message || "存档与当前版本不兼容", "error", 6);
    return false;
  } finally {
    launchBusy = false;
  }
}
function showCampaign(faction = campaignFaction) {
  campaignFaction = faction;
  $("allied-campaign").classList.toggle("active", faction === "allied");
  $("china-campaign").classList.toggle("active", faction === "china");
  $("campaign-kicker").textContent =
    faction === "allied" ? "ALLIED COMMAND" : "CHINA COMMAND";
  $("campaign-title").textContent =
    faction === "allied" ? "破雾行动" : "山海防线";
  $("campaign-description").textContent =
    faction === "allied"
      ? "失联船队把盟军引向一场被精心制造的冲突。查明袭击来源，救出证人，在核威胁与风暴降临前夺回主动。"
      : "守住城市和撤离通道，打通山海之间的补给线。从有组织的撤退，到穿越海峡的反攻，让家园重新迎来黎明。";
  $("mission-list").replaceChildren();
  for (const [index, m] of CAMPAIGNS[faction].entries()) {
    const unlocked = missionUnlocked(faction, index);
    const b = document.createElement("button");
    b.className = "mission-card" + (unlocked ? "" : " locked");
    b.dataset.mission = m.id;
    b.disabled = !unlocked;
    b.style.setProperty(
      "--mission-art",
      `url('${new URL(`../assets/previews/${m.id}.webp`, import.meta.url).href}')`,
    );
    const badge = completed[m.id]
      ? '<span class="completed">已完成 ✓</span>'
      : unlocked
        ? index === 0
          ? '<span class="available">可出击</span>'
          : ""
        : '<span class="locked-tag">未解锁</span>';
    b.innerHTML = `<span class="mission-no">${faction === "allied" ? "A" : "C"} / ${String(index + 1).padStart(2, "0")}</span>${badge}<h4>${esc(m.title)}</h4><p>${esc(unlocked ? m.subtitle : "完成前一任务后解锁")}</p>`;
    if (unlocked) b.addEventListener("click", () => briefing(m));
    $("mission-list").append(b);
  }
  setScreen("campaign-screen");
}
function briefing(m) {
  pendingMission = m;
  $("briefing-code").textContent =
    `${m.id.toUpperCase()} / ${m.faction === "allied" ? "破雾行动" : "山海防线"}`;
  $("briefing-title").textContent = m.title;
  let art = $("briefing-art");
  if (!art) {
    art = document.createElement("img");
    art.id = "briefing-art";
    art.alt = "战场预览";
    $("briefing-title").after(art);
  }
  art.src = new URL(`../assets/previews/${m.id}.webp`, import.meta.url).href;
  $("briefing-story").textContent = m.briefing;
  $("briefing-objectives").innerHTML = m.stages
    .map(
      (s) => `<li>${esc(typeof s === "string" ? s : s.text || s.title)}</li>`,
    )
    .join("");
  $("briefing-hint").textContent = `可选行动：${m.optional}`;
  $("briefing").hidden = false;
  audio.play("click");
}
function previewMap(canvas, map) {
  const ctx = canvas.getContext("2d");
  const w = (canvas.width = 220),
    h = (canvas.height = 140);
  ctx.fillStyle = "#122018";
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < map.height; y++)
    for (let x = 0; x < map.width; x++) {
      ctx.fillStyle = tacticalColor(map.tiles[y * map.width + x]);
      ctx.fillRect(
        (x * w) / map.width,
        (y * h) / map.height,
        Math.ceil(w / map.width),
        Math.ceil(h / map.height),
      );
    }
  for (const [i, p] of map.starts.entries()) {
    ctx.fillStyle = i === 0 ? "#fae596" : "#e87865";
    ctx.fillRect((p.x * w) / map.width - 3, (p.y * h) / map.height - 3, 6, 6);
  }
}
function setupSkirmish() {
  if (!$("map-list").children.length) {
    for (const map of MAPS) {
      const b = document.createElement("button");
      b.className = "map-card";
      b.dataset.map = map.id;
      const image = new URL(
        `../assets/map-previews/${map.id}.webp`,
        import.meta.url,
      ).href;
      const biome = {
        snow: "寒地作战",
        desert: "沙漠作战",
        coastal: "海岸作战",
        temperate: "温带作战",
      }[map.climate];
      b.innerHTML = `<div class="map-visual"><img src="${image}" alt="${esc(map.name)}地形景观" loading="lazy"><span class="map-biome">${biome}</span><canvas aria-label="${esc(map.name)}地形与出生点示意"></canvas></div><div class="map-caption"><b>${esc(map.name)}</b><p>${esc(map.subtitle)}</p><div class="map-tags">${map.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div></div>`;
      previewMap(b.querySelector("canvas"), createMap(map.id, 8, 2026));
      b.addEventListener("click", () => chooseMap(map.id));
      $("map-list").append(b);
    }
  }
  chooseMap(mapId);
  setScreen("skirmish-screen");
}
function chooseMap(id) {
  mapId = id;
  const m = MAPS.find((m) => m.id === id) || MAPS[0];
  $("selected-map-name").textContent = m.name;
  $("selected-map-desc").textContent = m.tactics || m.subtitle;
  let note = $("map-terrain-note");
  if (!note) {
    note = document.createElement("div");
    note.id = "map-terrain-note";
    $("selected-map-desc").after(note);
  }
  note.innerHTML = `<span class="map-dimensions">${m.width} × ${m.height} · 2—8 方战场</span><div class="map-key"><span><i class="key-water"></i>水域</span><span><i class="key-height"></i>高地</span><span><i class="key-ore"></i>矿区</span><span><i class="key-bridge"></i>桥梁</span></div><p>沿坡道上高地；冰面、积雪与湿地减速，公路加快行军。森林与废墟需要绕行。</p>`;
  document.querySelectorAll(".map-card").forEach((b) => {
    b.classList.toggle("active", b.dataset.map === id);
    b.setAttribute("aria-pressed", String(b.dataset.map === id));
  });
}
function setCategory(value) {
  category = value;
  document.querySelectorAll("[data-category]").forEach((b) => {
    const active = b.dataset.category === value;
    b.classList.toggle("active", active);
    b.setAttribute("aria-selected", String(active));
  });
  productionSignature = "";
  drawProduction(true);
}
function eligible(type) {
  const d = definition(type),
    f = factionOf();
  if (!d) return false;
  return !d.factions || d.factions.includes(f);
}
function prerequisiteReason(type) {
  const d = definition(type);
  if (!d) return "未开放";
  if (!eligible(type)) return "当前阵营不可用";
  const own = game.state.entities.filter(
    (e) =>
      e.owner === 0 &&
      e.kind === "building" &&
      e.hp > 0 &&
      !e.dead &&
      (e.progress === undefined || e.progress >= 1),
  );
  const missing = (d.prerequisites || []).filter(
    (t) => !own.some((e) => e.type === t),
  );
  return missing.length
    ? `需要${missing.map((t) => displayName(t, factionOf())).join("、")}`
    : "";
}
function drawProduction(force = false) {
  if (!game || !renderer) return;
  const f = factionOf(),
    types = (categories[category] || []).filter(eligible);
  const own = game.state.entities.filter((e) => e.owner === 0 && e.hp > 0);
  const signature = JSON.stringify([
    category,
    f,
    own
      .filter((e) => e.kind === "building")
      .map((e) => [e.id, e.type, e.progress === undefined || e.progress >= 1]),
    types,
  ]);
  if (force || productionSignature !== signature) {
    productionSignature = signature;
    $("production").replaceChildren();
    for (const type of types) {
      const d = game.getDefinition(type),
        button = document.createElement("button");
      button.className = "production-card";
      button.dataset.type = type;
      button.innerHTML = `<canvas aria-hidden="true" width="110" height="62"></canvas><span class="name">${esc(displayName(type, f))}</span><span class="price">${d.cost.toLocaleString()}</span><span class="count" hidden></span><span class="production-bar"></span>`;
      button.addEventListener("click", () => productionClick(type));
      $("production").append(button);
      renderer.drawIcon?.(button.querySelector("canvas"), type, f);
    }
  }
  for (const button of $("production").children) {
    const type = button.dataset.type,
      d = game.getDefinition(type);
    const reason = UNITS[type]
      ? game.canTrain?.(type)?.reason || prerequisiteReason(type)
      : prerequisiteReason(type);
    button.disabled = !!reason;
    button.title = `${displayName(type, f)} · $${d.cost}\n${reason || `${d.buildTime} 秒 · 点击${BUILDINGS[type] ? "放置建筑" : "加入生产队列"}`}`;
    let count = 0,
      progress = 0;
    for (const entity of own) {
      for (const q of entity.queue || [])
        if (q.type === type || q.unit === type) {
          count++;
          if (count === 1) progress = q.progress || 0;
        }
      if (
        entity.type === type &&
        entity.kind === "building" &&
        entity.progress < 1
      ) {
        count++;
        progress = entity.progress;
      }
    }
    const badge = button.querySelector(".count");
    badge.hidden = count === 0;
    badge.textContent = String(count);
    button.querySelector(".production-bar").style.width =
      `${clamp(progress, 0, 1) * 100}%`;
  }
}
function productionClick(type) {
  audio.unlock();
  if (!game || game.state.status !== "playing") return;
  if (BUILDINGS[type]) {
    placement = {
      type,
      x: Math.floor(mouse.world.x),
      y: Math.floor(mouse.world.y),
      valid: false,
    };
    action = null;
    $("placement-hint").hidden = false;
    $("placement-hint").textContent =
      `${displayName(type, factionOf())} · 点击放置 · 侧栏「取消」或右键取消`;
    toast("在基地附近选择空地放置建筑");
  } else {
    const producer = selectedEntities().find(
      (e) => e.kind === "building" && e.type === UNITS[type].factory,
    );
    issue({
      type: "train",
      unit: type,
      ...(producer ? { buildingId: producer.id } : {}),
    });
  }
}
function drawHud(force = false) {
  if (!game) return;
  const s = game.state,
    p = s.players.find((p) => p.id === 0) || s.players[0];
  $("credits").textContent = Math.floor(p.credits || 0).toLocaleString();
  $("clock").textContent = formatTime(s.time);
  $("power-text").textContent =
    `供电 ${Math.round(p.power || 0)} / ${Math.round(p.demand || 0)}`;
  const low = !game.powered(0);
  $("power-text").parentElement.classList.toggle("low", low);
  $("power-fill").style.width =
    `${p.demand ? clamp(p.power / p.demand, 0, 1) * 100 : 100}%`;
  const own = s.entities.filter((e) => e.owner === 0 && e.hp > 0 && !e.dead);
  const radar =
    own.some(
      (e) =>
        e.type === "radar" && (e.progress === undefined || e.progress >= 1),
    ) && !low;
  $("radar-offline").hidden = radar;
  renderer.drawMinimap($("minimap"), s);
  drawProduction(force);
  updateCoachProgress();
  const selected = selectedEntities();
  const sig = JSON.stringify(
    selected.map((e) => [
      e.id,
      Math.round(e.hp),
      e.progress === undefined ? 1 : Math.round(e.progress * 100),
      Math.round(e.charge || 0),
      e.cargo,
      e.passengers?.length,
    ]),
  );
  if (force || sig !== selectionSignature) {
    selectionSignature = sig;
    $("unit-detail").hidden = !selected.length;
    if (selected.length === 1) {
      const e = selected[0];
      $("unit-detail").innerHTML =
        `<b>${esc(entityName(e))}</b>耐久 ${Math.ceil(e.hp)} / ${e.maxHp}${e.cargo ? `<br>矿石 ${Math.floor(e.cargo)}` : ""}${e.passengers?.length ? `<br>乘员 ${e.passengers.length}` : ""}${e.type === "superweapon" && !e.missionControlled ? `<br>充能 ${Math.floor(((e.charge || 0) / BUILDINGS.superweapon.chargeTime) * 100)}% · 左键目标区域` : ""}`;
    } else
      $("unit-detail").innerHTML =
        `<b>已选择 ${selected.length} 个单位</b>A 突击 · S 停止 · Ctrl + 数字编队`;
  }
  const building = own.find((e) => e.kind === "building" && e.progress < 1);
  const queued =
    selected.find((e) => e.queue?.length) || own.find((e) => e.queue?.length);
  if (building) {
    $("production-status").textContent =
      `${displayName(building.type, factionOf())} · 施工 ${Math.floor(building.progress * 100)}%${low ? " · 电力不足" : ""}`;
  } else if (queued) {
    const q = queued.queue[0];
    $("production-status").innerHTML =
      `${esc(displayName(q.type || q.unit, factionOf()))} · 生产 ${Math.floor((q.progress || 0) * 100)}% <button id="cancel-queue">取消</button>`;
    $("cancel-queue")?.addEventListener("click", () =>
      issue({ type: "cancelProduction", buildingId: queued.id }),
    );
  } else $("production-status").textContent = idleProductionHint(own, low);
  for (const b of document.querySelectorAll("[data-command]"))
    b.disabled = selected.length === 0;
  if (s.mode === "campaign") {
    const mission = s.mission || {};
    $("objective-panel").hidden = false;
    const objectives = s.objectives || [];
    const timer = mission.deadlineAt
      ? `<p class="bad">任务期限 ${formatTime(Math.max(0, mission.deadlineAt - s.time))}</p>`
      : "";
    const silos = (mission.siloTimers || [])
      .map(
        (t, i) =>
          `<p class="${t.disabled ? "done" : "bad"}">发射井 ${i + 1} · ${t.disabled ? "已解除" : t.paused ? "停电暂停" : formatTime(t.remaining)}</p>`,
      )
      .join("");
    const html =
      `<p class="stage-name">${esc(mission.stageTitle || titleFor(s))}</p>${timer}${silos}${mission.powerStatus ? `<p>${esc(mission.powerStatus)}</p>` : ""}` +
      objectives
        .map(
          (o) =>
            `<p class="${o.done ? "done " : ""}${o.optional ? "optional" : ""}" data-objective="${esc(o.id)}">${o.done ? "✓" : o.optional ? "◇" : "□"} ${esc(o.text)}${o.progress !== undefined && o.target !== undefined && typeof o.target === "number" ? ` (${o.progress}/${o.target})` : ""}</p>`,
        )
        .join("");
    if ($("objectives").innerHTML !== html) $("objectives").innerHTML = html;
    const radio = mission.radio?.at(-1);
    if (radio) {
      const id = `${radio.time}/${radio.speaker}/${radio.text}`;
      if (id !== lastRadio) {
        lastRadio = id;
        $("radio-speaker").textContent = radio.speaker;
        $("radio-text").textContent = radio.text;
        $("radio").hidden = false;
        radioUntil =
          performance.now() + Math.max(6000, radio.text.length * 100);
        audio.play("click");
      }
    }
  } else {
    $("objective-panel").hidden = true;
    $("radio").hidden = true;
  }
  if (s.status !== seenStatus) {
    seenStatus = s.status;
    if (s.status === "won" || s.status === "lost") result(s.status);
  }
}
function result(status) {
  const s = game.state,
    won = status === "won";
  placement = null;
  action = null;
  select([]);
  audio.play(won ? "complete" : "alarm");
  $("pause-screen").hidden = true;
  $("result-screen").hidden = false;
  $("result-kicker").textContent = won
    ? "MISSION ACCOMPLISHED"
    : "FORCES REGROUPING";
  $("result-title").textContent = won ? "任务完成" : "重新集结";
  $("result-copy").textContent = won
    ? s.mode === "campaign"
      ? "这条战线已推进。下一场行动，等待你的命令。"
      : "敌方已失去继续作战的能力。战场由你掌握。"
    : s.mission?.failureReason ||
      s.lossReason ||
      "指挥部已经失去继续作战的能力。可以读取存档，调整部署再次行动。";
  $("result-stats").innerHTML =
    `<div><b>${formatTime(s.time)}</b><span>行动时间</span></div><div><b>${s.entities.filter((e) => e.owner === 0 && e.hp > 0).length}</b><span>存续部队与设施</span></div><div><b>${Math.floor(s.players[0].credits || 0).toLocaleString()}</b><span>剩余资金</span></div>`;
  if (won && s.mode === "campaign") {
    completed[s.missionId] = {
      at: Date.now(),
      difficulty: s.difficulty || "normal",
    };
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(completed));
    } catch {}
    const list = CAMPAIGNS[factionOf()] || [];
    const next = list[list.findIndex((m) => m.id === s.missionId) + 1];
    $("result-primary").textContent = next
      ? `下一关 · ${next.title} →`
      : "战役完成 · 返回战线";
  } else $("result-primary").textContent = won ? "再战一局" : "读取最近存档";
}
function cursorPoint(event) {
  const r = $("world").getBoundingClientRect();
  return { x: event.clientX - r.left, y: event.clientY - r.top };
}
function updateMouse(event) {
  const p = cursorPoint(event);
  mouse = {
    ...mouse,
    ...p,
    world: renderer.screenToWorld(p.x, p.y),
    inside: true,
  };
  if (placement) {
    placement.x = Math.floor(mouse.world.x);
    placement.y = Math.floor(mouse.world.y);
    const valid = game.canBuild(placement.type, placement.x, placement.y);
    placement.valid = !!valid.ok;
    $("placement-hint").textContent =
      `${displayName(placement.type, factionOf())} · ${valid.ok ? "点击放置 · 侧栏「取消」或右键取消" : valid.reason || "不能在此建造"}`;
  }
}

function idleProductionHint(own, low) {
  const missionId = game?.state.missionId;
  const hasYard = own.some((e) => e.type === "constructionYard");
  const hasMcv = own.some((e) => e.type === "mcv");
  const hasSpy = own.some((e) => e.type === "spy");
  if (
    missionId === "a3" ||
    (!hasYard && !hasMcv && hasSpy)
  ) {
    return "选中间谍，点击敌方电厂或档案设施潜入。避开军犬与哨戒。";
  }
  if (hasYard) {
    return low
      ? "电力不足，请补充发电设施。"
      : "建设基地、侦察敌情，维持矿车补给。";
  }
  if (hasMcv) {
    const mcvSelected = selectedEntities().some((e) => e.type === "mcv");
    return mcvSelected
      ? "点侧栏「展开」或按 D，将基地车展开为建造厂。"
      : "选中基地车，再点侧栏「展开」或按 D。";
  }
  return "建立或夺回指挥设施，组织补给与作战。";
}
function startCoach(state) {
  hideCoach(true);
  const firstCampaign =
    state.mode === "campaign" &&
    (state.missionId === "a1" || state.missionId === "c1") &&
    !coachSeen.campaign;
  const firstSkirmish = state.mode === "skirmish" && !coachSeen.skirmish;
  if (!firstCampaign && !firstSkirmish) {
    coach = null;
    return;
  }
  const kind = firstCampaign ? "campaign" : "skirmish";
  const own = (state.entities || []).filter(
    (e) => e.owner === 0 && e.hp > 0 && !e.dead,
  );
  const done = {
    deploy: own.some(
      (e) =>
        e.type === "constructionYard" &&
        (e.progress === undefined || e.progress >= 1),
    ),
    power: own.some(
      (e) =>
        e.type === "powerPlant" &&
        (e.progress === undefined || e.progress >= 1),
    ),
    mine: own.some(
      (e) =>
        e.type === "refinery" &&
        (e.progress === undefined || e.progress >= 1),
    ),
  };
  if (done.deploy && done.power && done.mine) {
    coachSeen[kind] = true;
    saveCoach();
    coach = null;
    return;
  }
  const steps = [
    {
      id: "deploy",
      title: "1 / 3 · 展开基地",
      body: "选中基地车，点侧栏「展开」或按 D，展开为建造厂。",
    },
    {
      id: "power",
      title: "2 / 3 · 接通电力",
      body: "在侧栏建筑页选择发电厂，放到建造厂附近空地。",
    },
    {
      id: "mine",
      title: "3 / 3 · 建立矿场",
      body: "再建一座矿场，矿车会自动采集。之后可训练部队。",
    },
  ];
  let step = 0;
  if (done.deploy) step = 1;
  if (done.power) step = 2;
  coach = { kind, step, steps };
  renderCoach();
}
function hideCoach(silent = false) {
  const panel = $("coach-panel");
  if (panel) panel.hidden = true;
  if (!silent) coach = null;
}
function advanceCoach(doneId) {
  if (!coach) return;
  const current = coach.steps[coach.step];
  if (!current || current.id !== doneId) return;
  if (coach.step >= coach.steps.length - 1) {
    coachSeen[coach.kind] = true;
    saveCoach();
    hideCoach();
    toast("基础部署完成。继续建设兵营与侦察。", "normal", 4);
    return;
  }
  coach.step += 1;
  renderCoach();
}
function renderCoach() {
  const panel = $("coach-panel");
  if (!panel || !coach) return;
  const step = coach.steps[coach.step];
  panel.hidden = false;
  panel.innerHTML = `<p class="overline">FIELD COACH</p><h3>${esc(step.title)}</h3><p>${esc(step.body)}</p><button type="button" id="coach-skip" class="plain">跳过指引</button>`;
  $("coach-skip").onclick = () => {
    coachSeen[coach.kind] = true;
    saveCoach();
    hideCoach();
  };
}
function updateCoachProgress() {
  if (!coach || !game) return;
  const own = game.state.entities.filter((e) => e.owner === 0 && e.hp > 0 && !e.dead);
  const yard = own.some(
    (e) =>
      e.type === "constructionYard" &&
      (e.progress === undefined || e.progress >= 1),
  );
  const power = own.some(
    (e) =>
      e.type === "powerPlant" &&
      (e.progress === undefined || e.progress >= 1),
  );
  const ore = own.some(
    (e) =>
      e.type === "refinery" &&
      (e.progress === undefined || e.progress >= 1),
  );
  if (yard) advanceCoach("deploy");
  if (power) advanceCoach("power");
  if (ore) advanceCoach("mine");
}
function applyCoarseDefaults() {
  const intro = $("control-intro");
  if (!intro) return;
  if (coarsePointer()) {
    intro.innerHTML =
      "触控：单指拖动平移视角 · 轻点下令 · 长按或侧栏「取消」取消操作<br />也可接键鼠：左键下令 · 右键取消 · Ctrl + 数字编队";
    if (!settings._touchHinted) {
      settings._touchHinted = true;
      /* do not force modernControls; classic left-order works better with tap */
    }
  } else {
    intro.innerHTML =
      "经典左键下令 · 右键取消 · Ctrl + 数字编队<br />触控设备可用单指拖动平移，长按或侧栏「取消」代替右键";
  }
}

function cancel() {
  placement = null;
  action = null;
  $("placement-hint").hidden = true;
  $("repair-tool").classList.remove("active");
  $("sell-tool").classList.remove("active");
}
function orderAt(point) {
  if (!game || game.state.status !== "playing") return;
  const world = renderer.screenToWorld(point.x, point.y),
    target = renderer.pick(game.state, point.x, point.y),
    units = selectedEntities();
  if (placement) {
    const r = issue({
      type: "build",
      building: placement.type,
      x: Math.floor(world.x),
      y: Math.floor(world.y),
    });
    if (r.ok) cancel();
    return;
  }
  if (action === "sell") {
    if (target?.owner === 0 && target.kind === "building")
      issue({ type: "sell", id: target.id });
    else toast("点击己方建筑出售", "error");
    return;
  }
  if (action === "repair") {
    if (target?.owner === 0 && target.kind === "building")
      issue({ type: "repair", ids: [target.id] });
    else toast("点击己方建筑进行修理", "error");
    return;
  }
  if (action === "attackMove") {
    issue({ type: "attackMove", ids: selection, x: world.x, y: world.y });
    cancel();
    return;
  }
  if (
    units.length === 1 &&
    units[0].type === "superweapon" &&
    !units[0].missionControlled &&
    (!target || target.owner !== 0)
  ) {
    issue({ type: "superweapon", id: units[0].id, x: world.x, y: world.y });
    return;
  }
  if (target) {
    if (target.owner === 0) {
      if (
        target.hp < target.maxHp &&
        units.some((e) => e.type === "engineer")
      ) {
        issue({
          type: "repair",
          ids: units.filter((e) => e.type === "engineer").map((e) => e.id),
          targetId: target.id,
        });
        return;
      }
      const infantry = units.filter(
        (e) => e.kind === "unit" && e.type !== "mcv",
      );
      if (
        (definition(target.type)?.transport ||
          definition(target.type)?.garrisonCapacity) &&
        infantry.length &&
        !selection.includes(target.id)
      ) {
        issue({
          type: "garrison",
          ids: infantry.map((e) => e.id),
          targetId: target.id,
        });
        return;
      }
      select([target.id]);
      return;
    }
    if (
      units.some((e) => e.type === "engineer") &&
      target.kind === "building"
    ) {
      issue({
        type: "capture",
        ids: units.filter((e) => e.type === "engineer").map((e) => e.id),
        targetId: target.id,
      });
      return;
    }
    if (units.some((e) => e.type === "spy") && target.kind === "building") {
      issue({
        type: "infiltrate",
        ids: units.filter((e) => e.type === "spy").map((e) => e.id),
        targetId: target.id,
      });
      return;
    }
    if (target.owner < 0 && target.kind === "building" && units.length) {
      issue({ type: "garrison", ids: selection, targetId: target.id });
      return;
    }
    if (units.length) {
      issue({ type: "attack", ids: selection, targetId: target.id });
      return;
    }
  }
  if (units.some((e) => e.kind === "unit" || definition(e.type)?.factory))
    issue({ type: "move", ids: selection, x: world.x, y: world.y });
  else select([]);
}
function clearLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}
function onPointerDown(e) {
  if (!game || game.state.status !== "playing") return;
  audio.unlock();
  updateMouse(e);
  $("world").focus();
  try {
    $("world").setPointerCapture(e.pointerId);
  } catch {}
  const point = cursorPoint(e);
  activePointers.set(e.pointerId, point);
  const touchLike =
    e.pointerType === "touch" || (e.pointerType === "pen" && coarsePointer());
  drag = {
    button: e.button,
    start: point,
    last: point,
    shift: e.shiftKey,
    moved: false,
    pointerId: e.pointerId,
    pan:
      e.button === 1 ||
      (e.button === 0 && touchLike) ||
      activePointers.size >= 2,
    longPressed: false,
    touchLike,
  };
  if (activePointers.size >= 2) {
    clearLongPress();
    drag.pan = true;
    $("selection-marquee").hidden = true;
  }
  if (e.button === 2 && !settings.modernControls) {
    cancel();
    clearLongPress();
    activePointers.delete(e.pointerId);
    drag = null;
    e.preventDefault();
    return;
  }
  if (drag.pan && e.button === 0 && touchLike && activePointers.size === 1) {
    clearLongPress();
    longPressTimer = setTimeout(() => {
      if (drag && !drag.moved && drag.pointerId === e.pointerId) {
        drag.longPressed = true;
        cancel();
        toast("已取消当前操作");
      }
    }, 480);
  }
  e.preventDefault();
}
function onPointerMove(e) {
  if (!renderer) return;
  updateMouse(e);
  const p = cursorPoint(e);
  if (activePointers.has(e.pointerId)) activePointers.set(e.pointerId, p);
  if (!drag) return;
  const distance = Math.hypot(p.x - drag.start.x, p.y - drag.start.y);
  if (distance > 8) {
    drag.moved = true;
    clearLongPress();
  }
  if (activePointers.size >= 2) {
    drag.pan = true;
    $("selection-marquee").hidden = true;
    const pts = [...activePointers.values()];
    const cx = pts.reduce((s, q) => s + q.x, 0) / pts.length;
    const cy = pts.reduce((s, q) => s + q.y, 0) / pts.length;
    if (drag.multiCenter) {
      renderer.pan(cx - drag.multiCenter.x, cy - drag.multiCenter.y);
    }
    drag.multiCenter = { x: cx, y: cy };
    drag.last = p;
    return;
  }
  if (drag.pan || drag.button === 1) {
    renderer.pan(p.x - drag.last.x, p.y - drag.last.y);
    drag.last = p;
    return;
  }
  if (drag.button === 0 && drag.moved && !placement && !action) {
    const box = $("selection-marquee");
    box.hidden = false;
    box.style.left = `${Math.min(p.x, drag.start.x)}px`;
    box.style.top = `${Math.min(p.y, drag.start.y)}px`;
    box.style.width = `${Math.abs(p.x - drag.start.x)}px`;
    box.style.height = `${Math.abs(p.y - drag.start.y)}px`;
  }
}
function onPointerUp(e) {
  activePointers.delete(e.pointerId);
  clearLongPress();
  if (!drag) return;
  const d = drag;
  const p = cursorPoint(e);
  if (activePointers.size > 0) {
    drag = {
      ...d,
      pointerId: [...activePointers.keys()][0],
      last: [...activePointers.values()][0],
      pan: true,
      multiCenter: null,
    };
    $("selection-marquee").hidden = true;
    return;
  }
  drag = null;
  $("selection-marquee").hidden = true;
  if (d.longPressed) return;
  if (d.button === 1 || (d.pan && d.moved)) return;
  if (d.button === 2) {
    if (settings.modernControls) orderAt(p);
    return;
  }
  if (d.moved && !d.pan && !placement && !action) {
    const minX = Math.min(d.start.x, p.x),
      maxX = Math.max(d.start.x, p.x),
      minY = Math.min(d.start.y, p.y),
      maxY = Math.max(d.start.y, p.y);
    let ids = game.state.entities
      .filter(
        (entity) =>
          entity.owner === 0 &&
          entity.kind === "unit" &&
          entity.hp > 0 &&
          !entity.dead &&
          !entity.hidden &&
          !entity.inside &&
          entity.carrierId == null,
      )
      .filter((entity) => {
        const s = renderer.worldToScreen(
          entity.x,
          entity.y,
          elevationAt(
            game.state,
            entity.x,
            entity.y,
            UNITS[entity.type]?.movement,
          ) + (UNITS[entity.type]?.movement === "air" ? 3 : 0),
        );
        return s.x >= minX && s.x <= maxX && s.y >= minY && s.y <= maxY;
      })
      .map((ent) => ent.id);
    if (d.shift) ids = [...selection, ...ids];
    select(ids);
    return;
  }
  if (d.shift) {
    const hit = renderer.pick(game.state, p.x, p.y);
    if (hit?.owner === 0) {
      select(
        selection.includes(hit.id)
          ? selection.filter((id) => id !== hit.id)
          : [...selection, hit.id],
      );
      return;
    }
  }
  if (settings.modernControls && !placement && !action) {
    const hit = renderer.pick(game.state, p.x, p.y);
    select(hit?.owner === 0 ? [hit.id] : []);
  } else orderAt(p);
}
function commandAction(type) {
  if (!game) return;
  if (type === "attackMove") {
    action = type;
    placement = null;
    $("placement-hint").textContent = "攻击移动 · 点击目标位置 · 侧栏「取消」或右键取消";
    $("placement-hint").hidden = false;
  } else issue({ type, ids: selection });
}
function showHelp() {
  helpResume = game?.state.status === "playing";
  if (helpResume) game.command({ type: "pause" });
  $("help-screen").hidden = false;
}
function hideHelp() {
  $("help-screen").hidden = true;
  if (helpResume && game?.state.status === "paused")
    game.command({ type: "resume" });
  helpResume = false;
}
function bindUI() {
  $("campaign-menu").onclick = () => showCampaign();
  $("skirmish-menu").onclick = setupSkirmish;
  $("continue-menu").onclick = () => restore();
  $("allied-campaign").onclick = () => showCampaign("allied");
  $("china-campaign").onclick = () => showCampaign("china");
  document
    .querySelectorAll("[data-back]")
    .forEach((b) => (b.onclick = () => setScreen(b.dataset.back)));
  $("close-briefing").onclick = () => {
    $("briefing").hidden = true;
  };
  $("start-mission").onclick = () => {
    if (pendingMission)
      launch({
        mode: "campaign",
        faction: pendingMission.faction,
        difficulty: $("campaign-difficulty").value,
        mapId: "frontier",
        missionId: pendingMission.id,
        players: 2,
        seed: 2026,
      });
  };
  $("launch-skirmish").onclick = () =>
    launch({
      mode: "skirmish",
      mapId,
      faction: $("skirmish-faction").value,
      difficulty: $("skirmish-difficulty").value,
      players: Number($("skirmish-players").value),
      credits: Number($("starting-credits").value),
      startingCredits: Number($("starting-credits").value),
      seed: Date.now() >>> 0,
    });
  $("pause-game").onclick = pause;
  $("resume-game").onclick = resume;
  $("save-game").onclick = () => save();
  $("save-pause").onclick = () => save();
  $("load-pause").onclick = loadDialog;
  $("restart-game").onclick = () => {
    if (optionsForRestart) launch(optionsForRestart);
  };
  $("return-menu").onclick = async () => {
    await save();
    game?.command({ type: "pause" });
    setScreen("menu");
  };
  $("help-menu").onclick = showHelp;
  $("help-game").onclick = showHelp;
  $("close-help").onclick = hideHelp;
  $("sound-toggle").checked = !settings.muted;
  $("modern-controls").checked = settings.modernControls;
  $("game-speed").value = String(settings.speed);
  const sound = () => {
    settings.muted = !settings.muted;
    audio.setMuted(settings.muted);
    audio.unlock();
    $("sound-menu").textContent = `声音 ${settings.muted ? "关" : "开"}`;
    $("sound-toggle").checked = !settings.muted;
    saveSettings();
  };
  $("sound-menu").onclick = sound;
  $("sound-toggle").onchange = sound;
  $("sound-menu").textContent = `声音 ${settings.muted ? "关" : "开"}`;
  $("modern-controls").onchange = (e) => {
    settings.modernControls = e.target.checked;
    saveSettings();
  };
  $("game-speed").onchange = (e) => {
    settings.speed = Number(e.target.value);
    saveSettings();
  };
  $("repair-tool").onclick = () => {
    const toggle = action !== "repair";
    cancel();
    if (toggle) {
      action = "repair";
      $("repair-tool").classList.add("active");
      toast("点击己方建筑修理");
    }
  };
  $("sell-tool").onclick = () => {
    const toggle = action !== "sell";
    cancel();
    if (toggle) {
      action = "sell";
      $("sell-tool").classList.add("active");
      toast("点击己方建筑出售，建筑会被拆除");
    }
  };
  document
    .querySelectorAll("[data-category]")
    .forEach((b) => (b.onclick = () => setCategory(b.dataset.category)));
  document
    .querySelectorAll("[data-command]")
    .forEach((b) => (b.onclick = () => commandAction(b.dataset.command)));
  $("objectives-toggle").onclick = () => {
    $("objectives").hidden = !$("objectives").hidden;
    $("objectives-toggle").querySelector("span").textContent = $("objectives")
      .hidden
      ? "+"
      : "−";
  };
  $("objectives").onclick = (e) => {
    const p = e.target.closest("[data-objective]");
    if (!p) return;
    const o = game?.state.objectives.find((o) => o.id === p.dataset.objective);
    let t = o?.targetPosition || o?.target;
    if (typeof t === "number") t = game.getEntity(t);
    if (t && Number.isFinite(t.x)) renderer.centerOn(t.x, t.y);
  };
  $("result-primary").onclick = () => {
    const s = game.state;
    if (s.status === "lost") {
      restore();
      return;
    }
    if (s.mode === "campaign") {
      const list = CAMPAIGNS[factionOf()] || [],
        next = list[list.findIndex((m) => m.id === s.missionId) + 1];
      if (next) {
        showCampaign(next.faction);
        briefing(next);
      } else showCampaign(factionOf());
    } else setupSkirmish();
  };
  $("result-retry").onclick = () => launch(optionsForRestart);
  $("result-home").onclick = () => setScreen("menu");
  const canvas = $("world");
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", () => {
    clearLongPress();
    activePointers.clear();
    drag = null;
    $("selection-marquee").hidden = true;
  });
  canvas.addEventListener("pointerleave", () => {
    mouse.inside = false;
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const p = cursorPoint(e);
      renderer.zoomAt(Math.exp(-e.deltaY * 0.001), p.x, p.y);
    },
    { passive: false },
  );
  canvas.addEventListener("dblclick", (e) => {
    const p = cursorPoint(e),
      hit = renderer.pick(game.state, p.x, p.y);
    if (hit?.owner === 0)
      select(
        game.state.entities
          .filter(
            (entity) =>
              entity.owner === 0 && entity.type === hit.type && entity.hp > 0,
          )
          .map((e) => e.id),
      );
  });
  $("minimap").addEventListener("pointerdown", (e) => {
    if (!game) return;
    const r = $("minimap").getBoundingClientRect();
    renderer.centerOn(
      ((e.clientX - r.left) / r.width) * game.state.width,
      ((e.clientY - r.top) / r.height) * game.state.height,
    );
  });
  $("minimap").addEventListener("pointermove", (e) => {
    if (!game || (e.buttons & 1) === 0) return;
    const r = $("minimap").getBoundingClientRect();
    renderer.centerOn(
      ((e.clientX - r.left) / r.width) * game.state.width,
      ((e.clientY - r.top) / r.height) * game.state.height,
    );
  });
  const cancelBtn = $("cancel-tool");
  if (cancelBtn)
    cancelBtn.onclick = () => {
      cancel();
      toast("已取消当前操作");
    };
  addEventListener("keydown", (e) => {
    if (
      e.target instanceof HTMLSelectElement ||
      e.target instanceof HTMLInputElement
    )
      return;
    if (e.code === "Escape") {
      e.preventDefault();
      if (!$("help-screen").hidden) {
        hideHelp();
        return;
      }
      if (placement || action) {
        cancel();
        return;
      }
      if (!$("briefing").hidden) {
        $("briefing").hidden = true;
        return;
      }
      if (screen === "battle") {
        if (game.state.status === "playing") pause();
        else if (game.state.status === "paused") resume();
      }
      return;
    }
    if (screen !== "battle" || game?.state.status !== "playing") return;
    if (e.code.startsWith("Arrow")) {
      e.preventDefault();
      keyPan.add(e.code);
      return;
    }
    if (e.repeat) return;
    if (e.code === "KeyA") commandAction("attackMove");
    if (e.code === "KeyS") commandAction("stop");
    if (e.code === "KeyD") commandAction("deploy");
    if (e.code === "KeyU") commandAction("unload");
    if (e.code === "KeyH") {
      const yard = game.state.entities.find(
        (e) => e.owner === 0 && e.type === "constructionYard" && e.hp > 0,
      );
      if (yard) {
        renderer.centerOn(yard.x, yard.y);
        select([yard.id]);
      }
    }
    if (e.code === "Space") {
      e.preventDefault();
      const entities = selectedEntities();
      if (entities.length) renderer.centerOn(entities[0].x, entities[0].y);
    }
    if (/^Digit[1-9]$/.test(e.code)) {
      e.preventDefault();
      if (e.ctrlKey) groups[e.code] = [...selection];
      else select(groups[e.code] || []);
    }
  });
  addEventListener("keyup", (e) => keyPan.delete(e.code));
  addEventListener("resize", () => renderer.resize());
  addEventListener("blur", () => {
    keyPan.clear();
    if (screen === "battle") pause();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && screen === "battle") pause();
  });
}
async function loadDialog() {
  try {
    const records = await listSaves();
    if (!records.length) {
      toast("还没有可读取的战场存档", "error");
      return;
    }
    let modal = $("load-screen");
    if (!modal) {
      modal = document.createElement("section");
      modal.id = "load-screen";
      modal.className = "modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      document.getElementById("app").append(modal);
    }
    modal.innerHTML =
      '<div class="dialog"><p class="overline">SAVED OPERATIONS</p><h2>选择存档</h2><div class="pause-actions" id="save-list"></div><button id="close-load" class="secondary-button">返回</button></div>';
    modal.hidden = false;
    for (const r of records) {
      const b = document.createElement("button");
      b.className = "secondary-button";
      b.textContent = `${r.automatic ? "自动" : "手动"} · ${r.meta.title} · ${formatTime(r.meta.time)} · ${new Date(r.savedAt).toLocaleTimeString("zh-CN")}`;
      b.onclick = async () => {
        if (await restore(r.id)) modal.hidden = true;
      };
      $("save-list").append(b);
    }
    const exportButton = document.createElement("button");
    exportButton.className = "secondary-button";
    exportButton.textContent = "导出最近存档";
    exportButton.onclick = () => exportSave(records[0]);
    $("save-list").append(exportButton);
    $("close-load").onclick = () => {
      modal.hidden = true;
    };
  } catch (error) {
    toast(error.message || "存档读取失败", "error");
  }
}
function fail(error) {
  console.error(error);
  $("boot").hidden = true;
  $("fatal").hidden = false;
  $("fatal-message").textContent = error?.message || String(error);
}
function frame(now) {
  try {
    const dt = Math.min(0.15, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    if (game && screen === "battle") {
      if (game.state.status === "playing") {
        accumulator += dt * settings.speed;
        let steps = 0;
        while (accumulator >= 0.05 && steps++ < 8) {
          game.step(0.05);
          accumulator -= 0.05;
          if (game.state.status !== "playing") break;
        }
        if (game.state.time - autoAt >= 60) {
          pendingAuto = true;
          autoAt = game.state.time;
        }
        if (
          pendingAuto &&
          !saveBusy &&
          !["lost", "won"].includes(game.state.status)
        ) {
          pendingAuto = false;
          save(true);
        }
      } else accumulator = 0;
      const speed = 550 * dt;
      let dx =
          (keyPan.has("ArrowLeft") ? speed : 0) -
          (keyPan.has("ArrowRight") ? speed : 0),
        dy =
          (keyPan.has("ArrowUp") ? speed : 0) -
          (keyPan.has("ArrowDown") ? speed : 0);
      if (
        mouse.inside &&
        !drag &&
        !document.hidden &&
        game.state.status === "playing"
      ) {
        const w = $("world").clientWidth,
          h = $("world").clientHeight;
        if (mouse.x < 8) dx += speed;
        if (mouse.x > w - 8) dx -= speed;
        if (mouse.y < 8) dy += speed;
        if (mouse.y > h - 8) dy -= speed;
      }
      if (dx || dy) renderer.pan(dx, dy);
      selection = selection.filter((id) =>
        game.state.entities.some(
          (e) => e.id === id && e.hp > 0 && !e.dead && e.carrierId == null,
        ),
      );
      renderer.render(
        game.state,
        {
          selection,
          selectionBox:
            drag?.moved && !drag.pan
              ? { x1: drag.start.x, y1: drag.start.y, x2: mouse.x, y2: mouse.y }
              : null,
          placement,
          mouseWorld: mouse.world,
          showHealth: false,
          paused: game.state.status === "paused",
        },
        dt,
      );
      if (now - hudAt > 180) {
        drawHud();
        hudAt = now;
      }
    }
    if (now > toastUntil) {
      $("battle-toast").hidden = true;
      $("global-toast").hidden = true;
    }
    if (now > radioUntil) $("radio").hidden = true;
    if (now > bannerUntil) $("mission-banner").hidden = true;
    requestAnimationFrame(frame);
  } catch (error) {
    fail(error);
  }
}
try {
  renderer = new Renderer($("world"));
  bindUI();
  applyCoarseDefaults();
  refreshContinue();
  $("boot").hidden = true;
  setScreen("menu");
  requestAnimationFrame(frame);
  window.RepublicFrontier = Object.freeze({
    version: "0.3.0-preview",
    snapshot: () =>
      game
        ? {
            mode: game.state.mode,
            status: game.state.status,
            time: game.state.time,
            missionId: game.state.missionId,
            stage: game.state.mission?.stage,
            units: game.state.entities.filter(
              (e) => e.owner === 0 && e.kind === "unit" && e.hp > 0,
            ).length,
            credits: game.state.players[0].credits,
          }
        : null,
  });
  if (new URLSearchParams(location.search).get("qa") === "1")
    window.__REPUBLIC_TEST__ = {
      get game() {
        return game;
      },
      get renderer() {
        return renderer;
      },
      launch,
      save,
      restore,
      select,
      setScreen,
      drawHud,
      optionsForRestart: () => optionsForRestart,
    };
} catch (error) {
  fail(error);
}
addEventListener("pagehide", () => {
  audio.dispose();
  renderer?.dispose();
});
addEventListener("pageshow", (e) => {
  if (e.persisted) location.reload();
});
