import {
  UNITS,
  BUILDINGS,
  FACTIONS,
  PLAYER_COLORS,
  ARMOR_MULTIPLIERS,
  RULES_VERSION,
  definition,
  displayName,
  unitDefinition,
} from "./data.js";
import { createMap } from "./maps.js";
import { edgeConnected, terrainSpeed } from "./terrain.js";
import { getMission } from "./campaigns.js";
import {
  missionSetup,
  updateMission,
  validateMissionState,
} from "./missions.js";

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const center = (e) => ({
  x: e.x + (e.kind === "building" ? (BUILDINGS[e.type]?.w || 1) / 2 : 0),
  y: e.y + (e.kind === "building" ? (BUILDINGS[e.type]?.h || 1) / 2 : 0),
});
const alive = (e) => e.hp > 0 && !e.dead;
const ready = (e) => alive(e) && (e.progress ?? 1) >= 1;
const success = () => ({ ok: true });
const fail = (reason) => ({ ok: false, reason });

class Heap {
  constructor() {
    this.a = [];
  }
  push(v) {
    let i = this.a.length;
    this.a.push(v);
    while (i) {
      const p = (i - 1) >> 1;
      if (this.a[p].f <= v.f) break;
      this.a[i] = this.a[p];
      i = p;
    }
    this.a[i] = v;
  }
  pop() {
    const top = this.a[0],
      end = this.a.pop();
    if (this.a.length) {
      let i = 0;
      while (i * 2 + 1 < this.a.length) {
        let c = i * 2 + 1;
        if (c + 1 < this.a.length && this.a[c + 1].f < this.a[c].f) c++;
        if (this.a[c].f >= end.f) break;
        this.a[i] = this.a[c];
        i = c;
      }
      this.a[i] = end;
    }
    return top;
  }
  get length() {
    return this.a.length;
  }
}

export class Game {
  constructor(options = {}) {
    const count = clamp(Math.floor(options.players || 2), 2, 8);
    this.options = {
      mode: "skirmish",
      faction: "allied",
      difficulty: "normal",
      mapId: "frontier",
      seed: 2026,
      ...options,
      players: count,
    };
    if (!FACTIONS[this.options.faction]) this.options.faction = "allied";
    if (!["easy", "normal", "hard"].includes(this.options.difficulty))
      this.options.difficulty = "normal";
    const map = createMap(this.options.mapId, count, this.options.seed);
    this.onEvent = () => {};
    this.state = {
      version: RULES_VERSION,
      mode: this.options.mode,
      difficulty: this.options.difficulty,
      status: "playing",
      time: 0,
      seed: this.options.seed >>> 0,
      mapId: map.id,
      missionId: this.options.missionId || null,
      width: map.width,
      height: map.height,
      tiles: map.tiles,
      starts: map.starts,
      climate: this.options.mode === "skirmish" ? map.climate : "temperate",
      props: this.options.mode === "skirmish" ? map.props : [],
      bridges: this.options.mode === "skirmish" ? map.bridges : [],
      landmarks: this.options.mode === "skirmish" ? map.landmarks : [],
      players: [],
      entities: [],
      projectiles: [],
      effects: [],
      events: [],
      nextId: 1,
      objectives: [],
      mission: null,
      selectedIds: [],
      visibilityClock: 0,
      aiClock: 0,
      economyClock: 0,
      statistics: { kills: 0, lost: 0, mined: 0, built: 0 },
      options: { ...this.options },
    };
    for (let i = 0; i < count; i++) {
      const faction =
        i === 0
          ? this.options.faction
          : ["soviet", "china", "allied"][(i - 1) % 3];
      const factionOption = options.opponents?.[i - 1];
      this.state.players.push({
        id: i,
        faction: FACTIONS[factionOption] ? factionOption : faction,
        name: i === 0 ? "指挥官" : `电脑 ${i}`,
        team: options.teams?.[i] ?? i,
        credits: Math.max(0, Number(options.credits ?? 10000)),
        power: 0,
        demand: 0,
        defeated: false,
        color: PLAYER_COLORS[i],
        ai: i > 0,
        aiState: {
          nextBuild: 2 + i * 0.3,
          nextAttack: 85,
          lastWave: 0,
          target: 0,
        },
        income: 0,
        spent: 0,
        kills: 0,
        lost: 0,
      });
      const p = map.starts[i];
      this.spawn("mcv", i, p.x, p.y);
      this.spawn("miner", i, p.x + 3.8, p.y + 2.8);
      this.spawn("infantry", i, p.x + 3, p.y - 1.5);
      this.spawn("infantry", i, p.x + 4, p.y - 1.5);
    }
    for (const n of map.neutralSpawns) this.spawn(n.type, -1, n.x, n.y);
    if (this.options.mode === "campaign") {
      const mission = getMission(this.options.missionId);
      if (!mission) throw new Error("未知战役任务");
      missionSetup(this.state, mission, this);
      // Campaign setup owns the playable faction. Persist the same canonical
      // options used by restart, instead of an omitted caller default faction.
      this.options.faction = this.state.players[0].faction;
      this.state.options = { ...this.options };
    }
    this.recalculatePower();
    this.updateVisibility();
  }
  random() {
    const s = this.state;
    s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
    return s.seed / 4294967296;
  }
  emit(type, data = {}) {
    const event = { ...data, type, time: this.state.time };
    this.state.events.push(event);
    if (this.state.events.length > 200) this.state.events.shift();
    this.onEvent?.(event);
    return event;
  }
  getEntity(id) {
    return this.state.entities.find((e) => e.id === id);
  }
  getDefinition(type, owner = 0) {
    if (Object.hasOwn(BUILDINGS, type)) return BUILDINGS[type];
    if (!Object.hasOwn(UNITS, type)) return undefined;
    const faction = this.state.players[owner]?.faction || "allied",
      key = `${faction}:${type}`;
    this._definitions ||= Object.create(null);
    return (this._definitions[key] ||= Object.freeze(
      unitDefinition(type, faction),
    ));
  }
  unitDef(e) {
    return this.getDefinition(e.type, e.owner ?? -1);
  }
  entityDef(e) {
    return e.kind === "unit" ? this.unitDef(e) : BUILDINGS[e.type];
  }
  isEnemy(a, b) {
    const x = typeof a === "number" ? a : a?.owner,
      y = typeof b === "number" ? b : b?.owner;
    return (
      x >= 0 &&
      y >= 0 &&
      x !== y &&
      this.state.players[x]?.team !== this.state.players[y]?.team
    );
  }
  tile(x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    return x >= 0 && y >= 0 && x < this.state.width && y < this.state.height
      ? this.state.tiles[y * this.state.width + x]
      : null;
  }
  owned(owner, predicate = () => true) {
    return this.state.entities.filter(
      (e) => e.owner === owner && alive(e) && predicate(e),
    );
  }
  spawn(type, owner, x, y, extra = {}) {
    const d = this.getDefinition(type, owner);
    if (!d) throw new Error(`未知单位或建筑: ${type}`);
    const building = !!BUILDINGS[type];
    const e = {
      id: this.state.nextId++,
      type,
      kind: building ? "building" : "unit",
      owner,
      createdFaction: this.state.players[owner]?.faction || null,
      x: clamp(x, 0, this.state.width - (building ? d.w : 0.1)),
      y: clamp(y, 0, this.state.height - (building ? d.h : 0.1)),
      hp: d.hp,
      maxHp: d.hp,
      facing: 0,
      order: { type: "idle" },
      selected: false,
      progress: 1,
      cargo: 0,
      targetId: null,
      queue: [],
      deployed: false,
      veteran: 0,
      experience: 0,
      cooldown: 0,
      path: [],
      pathGoal: null,
      repath: 0,
      passengers: [],
      garrison: [],
      carrierId: null,
      charge: 0,
      ammo: d.ammo ?? null,
      repairEnabled: false,
      tags: [],
      ...extra,
    };
    this.state.entities.push(e);
    this._blocking = null;
    if (building) this.recalculatePower();
    return e;
  }
  canTrain(unit, owner = 0) {
    const d = this.getDefinition(unit, owner),
      p = this.state.players[owner];
    if (!d || !p || p.defeated) return fail("单位不可用");
    if (!d.factions.includes(p.faction)) return fail("该阵营无法生产此单位");
    if (
      this.state.mission?.allowedUnits &&
      !this.state.mission.allowedUnits.includes(unit)
    )
      return fail("本阶段尚未解锁");
    for (const req of d.prerequisites)
      if (!this.owned(owner, (e) => e.type === req && ready(e)).length)
        return fail(`需要${BUILDINGS[req]?.name || req}`);
    if (!this.owned(owner, (e) => e.type === d.factory && ready(e)).length)
      return fail("缺少生产设施");
    if (p.credits < 1) return fail("资金不足");
    if (this.owned(owner, (e) => e.kind === "unit").length >= 180)
      return fail("单位上限 180");
    if (d.ammo) {
      const pads =
        this.owned(owner, (e) => e.type === "airfield" && ready(e)).length * 4;
      const aircraft =
        this.owned(owner, (e) => e.type === unit).length +
        this.owned(owner).reduce(
          (n, e) => n + e.queue.filter((q) => q.type === unit).length,
          0,
        );
      if (aircraft >= pads) return fail("机位已满，建造更多机场");
    }
    return success();
  }
  canBuild(type, x, y, owner = 0) {
    const d = Object.hasOwn(BUILDINGS, type) ? BUILDINGS[type] : null,
      p = this.state.players[owner];
    if (!d || !p || p.defeated || d.deployOnly || d.neutralOnly)
      return fail("此建筑不可直接建造");
    if (
      this.state.mission?.allowedBuildings &&
      !this.state.mission.allowedBuildings.includes(type)
    )
      return fail("本阶段尚未解锁");
    if (!d.factions.includes(p.faction)) return fail("该阵营无法建造");
    if (this.owned(owner, (e) => e.kind === "building" && !ready(e)).length)
      return fail("已有建筑正在施工");
    for (const req of d.prerequisites)
      if (!this.owned(owner, (e) => e.type === req && ready(e)).length)
        return fail(`需要${BUILDINGS[req]?.name || req}`);
    if (d.unique && this.owned(owner, (e) => e.type === type).length)
      return fail("只能建造一座");
    if (p.credits < 1) return fail("资金不足");
    if (!Number.isFinite(x) || !Number.isFinite(y)) return fail("选择建造位置");
    x = Math.floor(x);
    y = Math.floor(y);
    const bounds = this.placement(type, x, y, owner);
    if (!bounds.ok) return bounds;
    const anchor = this.owned(
      owner,
      (e) =>
        e.kind === "building" && ready(e) && !BUILDINGS[e.type].neutralOnly,
    ).some(
      (e) =>
        distance(center(e), { x: x + d.w / 2, y: y + d.h / 2 }) <=
        (BUILDINGS[e.type].buildRadius || 8) + 2,
    );
    return anchor ? success() : fail("超出基地建造范围");
  }
  placement(type, x, y, owner, ignoreId = null) {
    const d = BUILDINGS[type];
    const level = this.tile(x, y)?.height || 0;
    let water = 0,
      land = 0;
    for (let yy = y; yy < y + d.h; yy++)
      for (let xx = x; xx < x + d.w; xx++) {
        const t = this.tile(xx, yy);
        if (
          !t ||
          t.kind === "rock" ||
          t.bridge ||
          t.ore > 0 ||
          t.obstacle ||
          t.ramp ||
          t.surface === "ice" ||
          t.surface === "marsh" ||
          Math.abs((t.height || 0) - level) > 0.01
        )
          return fail("地形不适合建造");
        if (t.kind === "water") water++;
        else land++;
        if (owner === 0 && !t.explored) return fail("请先侦察该区域");
        if (
          this.state.entities.some(
            (e) =>
              alive(e) &&
              e.id !== ignoreId &&
              !e.carrierId &&
              (e.kind === "building"
                ? xx >= e.x &&
                  xx < e.x + BUILDINGS[e.type].w &&
                  yy >= e.y &&
                  yy < e.y + BUILDINGS[e.type].h
                : UNITS[e.type].movement !== "air" &&
                  Math.floor(e.x) === xx &&
                  Math.floor(e.y) === yy),
          )
        )
          return fail("位置被占用");
      }
    if (d.coastal) {
      if (!water) return fail("造船厂需要水域");
      let coast = land > 0;
      for (let yy = y - 1; yy <= y + d.h; yy++)
        for (let xx = x - 1; xx <= x + d.w; xx++) {
          const t = this.tile(xx, yy);
          if (t && !["water", "rock"].includes(t.kind)) coast = true;
        }
      return coast ? success() : fail("必须靠近海岸");
    }
    return water ? fail("地面建筑不能建在水上") : success();
  }
  command(c = {}) {
    const s = this.state,
      owner = c.owner ?? 0;
    if (c.type === "pause") {
      if (s.status === "playing") s.status = "paused";
      return success();
    }
    if (c.type === "resume") {
      if (s.status === "paused") s.status = "playing";
      return success();
    }
    if (c.type === "select") {
      s.selectedIds = (c.ids || []).filter((id) => {
        const e = this.getEntity(id);
        return e && alive(e) && e.owner === owner && !e.carrierId;
      });
      s.entities.forEach((e) => {
        e.selected = s.selectedIds.includes(e.id);
      });
      return success();
    }
    if (s.status !== "playing") return fail("游戏已暂停或结束");
    if (!s.players[owner] || s.players[owner].defeated)
      return fail("玩家已退出战斗");
    if (c.type === "build") {
      const check = this.canBuild(c.building, c.x, c.y, owner);
      if (!check.ok) return check;
      this.spawn(c.building, owner, Math.floor(c.x), Math.floor(c.y), {
        hp: 1,
        progress: 0,
        costSpent: 0,
      });
      this.emit("buildStarted", { building: c.building, owner });
      return success();
    }
    if (c.type === "train") {
      const check = this.canTrain(c.unit, owner);
      if (!check.ok) return check;
      const d = this.getDefinition(c.unit, owner),
        explicit = c.buildingId ? this.getEntity(c.buildingId) : null;
      const factory =
        explicit ||
        this.owned(owner, (e) => e.type === d.factory && ready(e)).sort(
          (a, b) => a.queue.length - b.queue.length,
        )[0];
      if (
        !factory ||
        factory.owner !== owner ||
        !ready(factory) ||
        factory.type !== d.factory
      )
        return fail("请选择正确的生产设施");
      if (factory.queue.length >= 12) return fail("生产队列已满");
      factory.queue.push({ type: c.unit, progress: 0, paid: 0 });
      this.emit("queued", { unit: c.unit, owner, buildingId: factory.id });
      return success();
    }
    if (c.type === "cancelProduction") {
      const e = c.buildingId
        ? this.getEntity(c.buildingId)
        : this.owned(
            owner,
            (a) => a.kind === "building" && (a.queue.length || !ready(a)),
          )[0];
      if (!e || e.owner !== owner) return fail("没有进行中的生产");
      if (!ready(e)) {
        s.players[owner].credits += e.costSpent || 0;
        e.hp = 0;
        e.dead = true;
      } else if (e.queue.length) {
        const q = e.queue.shift();
        s.players[owner].credits += q.paid;
      } else return fail("队列为空");
      this.recalculatePower();
      return success();
    }
    if (c.type === "sell") {
      const e = this.getEntity(c.id);
      if (!e || e.owner !== owner || e.kind !== "building" || !alive(e))
        return fail("请选择己方建筑");
      if (BUILDINGS[e.type].neutralOnly || e.protected)
        return fail("此设施不可出售");
      const amount = ready(e) ? BUILDINGS[e.type].cost * 0.5 : e.costSpent || 0;
      s.players[owner].credits +=
        amount + e.queue.reduce((n, q) => n + q.paid, 0);
      this.unload(e);
      e.hp = 0;
      e.dead = true;
      this.recalculatePower();
      this.emit("sold", { entityId: e.id, owner, amount });
      return success();
    }
    if (c.type === "superweapon") {
      const e = this.getEntity(c.id);
      if (e?.missionControlled && !c.missionLaunch)
        return fail("此任务设施由战役目标控制");
      if (
        !e ||
        e.owner !== owner ||
        e.type !== "superweapon" ||
        !ready(e) ||
        !this.powered(owner) ||
        e.charge < BUILDINGS.superweapon.chargeTime
      )
        return fail("战略武器尚未就绪");
      if (
        !this.tile(c.x, c.y) ||
        (owner === 0 && !this.tile(c.x, c.y).explored)
      )
        return fail("目标区域尚未侦察");
      e.charge = 0;
      s.projectiles.push({
        id: s.nextId++,
        kind:
          e.missionRole === "weather" ||
          (e.createdFaction || s.players[owner].faction) === "allied"
            ? "storm"
            : "nuclear",
        owner,
        sourceId: e.id,
        x: c.x,
        y: c.y,
        targetX: c.x,
        targetY: c.y,
        damage: 1500,
        splash: 5.5,
        life: 5,
        strategic: true,
      });
      this.emit("superweapon", { owner, x: c.x, y: c.y, delay: 5 });
      return success();
    }
    const units = (c.ids || s.selectedIds)
      .map((id) => this.getEntity(id))
      .filter((e) => e && e.owner === owner && alive(e) && !e.carrierId);
    if (!units.length) return fail("请先选择己方单位");
    if (c.type === "stop") {
      units.forEach((e) => {
        e.order = { type: "idle" };
        e.path = [];
        e.targetId = null;
      });
      return success();
    }
    if (c.type === "deploy") {
      let done = false;
      for (const e of units) {
        if (e.type === "mcv") {
          const x = Math.floor(e.x) - 1,
            y = Math.floor(e.y) - 1;
          if (!this.placement("constructionYard", x, y, owner, e.id).ok)
            continue;
          e.dead = true;
          e.hp = 0;
          const yard = this.spawn("constructionYard", owner, x, y, {
            tags: e.tags,
          });
          this.emit("deployed", {
            entityId: yard.id,
            previousId: e.id,
            owner,
            entityType: "constructionYard",
          });
          done = true;
        } else if (e.type === "constructionYard") {
          if (
            !ready(e) ||
            this.owned(owner, (a) => a.kind === "building" && !ready(a)).length
          )
            continue;
          const p = center(e);
          e.dead = true;
          e.hp = 0;
          const mobile = this.spawn("mcv", owner, p.x, p.y, { tags: e.tags });
          this.emit("deployed", {
            entityId: mobile.id,
            previousId: e.id,
            owner,
            entityType: "mcv",
          });
          done = true;
        } else if (this.unitDef(e)?.deployable) {
          e.deployed = !e.deployed;
          e.path = [];
          e.order = { type: "idle" };
          done = true;
        }
      }
      this.recalculatePower();
      return done ? success() : fail("部署区域被占用，移到开阔地面后重试");
    }
    if (c.type === "unload") {
      const n = units.reduce((v, e) => v + this.unload(e), 0);
      return n ? success() : fail("没有乘员或附近无安全下车位置");
    }
    const target = c.targetId ? this.getEntity(c.targetId) : null;
    if (
      c.type === "repair" &&
      units.some((e) => e.kind === "building") &&
      !target
    ) {
      units
        .filter((e) => e.kind === "building")
        .forEach((e) => {
          e.repairEnabled = !e.repairEnabled;
        });
      return success();
    }
    if (
      ["attack", "capture", "repair", "garrison", "infiltrate"].includes(
        c.type,
      ) &&
      (!target || !alive(target))
    )
      return fail("目标已消失");
    if (
      c.type === "capture" &&
      (target.kind !== "building" ||
        target.owner === owner ||
        target.protected ||
        !BUILDINGS[target.type].capturable)
    )
      return fail("此目标不可占领");
    if (c.type === "attack" && !this.isEnemy(owner, target.owner) && !c.force)
      return fail("不能攻击友军；强制攻击需明确启用");
    if (c.type === "garrison" && target.owner !== owner && target.owner !== -1)
      return fail("目标不属于己方");
    if (
      c.type === "infiltrate" &&
      (target.kind !== "building" || target.owner === owner)
    )
      return fail("请选择其他势力的建筑");
    let count = 0;
    for (const [i, e] of units.entries()) {
      if (e.kind === "building") {
        if (c.type === "move" && ready(e) && BUILDINGS[e.type].factory) {
          e.rally = { x: c.x, y: c.y };
          count++;
        }
        if (c.type === "repair" && target.id === e.id) {
          e.repairEnabled = !e.repairEnabled;
          count++;
        }
        continue;
      }
      const d = this.unitDef(e);
      if (["move", "attackMove"].includes(c.type)) {
        if (!this.tile(c.x, c.y)) continue;
        const x = clamp(
          c.x + (units.length > 1 ? ((i % 4) - 1.5) * 0.7 : 0),
          0.5,
          s.width - 0.5,
        );
        const y = clamp(
          c.y + (units.length > 1 ? Math.floor(i / 4) * 0.7 : 0),
          0.5,
          s.height - 0.5,
        );
        if (e.type === "miner" && this.tile(c.x, c.y)?.ore > 0)
          e.order = { type: "harvest", x: c.x, y: c.y };
        else e.order = { type: c.type, x, y };
        e.deployed = false;
        e.path = [];
        e.pathGoal = null;
        e.targetId = null;
        count++;
      } else if (c.type === "capture" && d.engineer) {
        e.order = { type: "capture", targetId: target.id };
        e.path = [];
        count++;
      } else if (c.type === "infiltrate" && d.spy) {
        e.order = { type: "infiltrate", targetId: target.id };
        e.path = [];
        count++;
      } else if (
        c.type === "repair" &&
        (d.engineer || target.type === "repairDepot") &&
        target.owner === owner
      ) {
        e.order = { type: "repair", targetId: target.id };
        e.path = [];
        count++;
      } else if (
        c.type === "garrison" &&
        (d.armor === "infantry" || target.type === "transport") &&
        (UNITS[target.type]?.transport ||
          BUILDINGS[target.type]?.garrisonCapacity)
      ) {
        e.order = { type: "garrison", targetId: target.id };
        e.path = [];
        count++;
      } else if (
        c.type === "attack" &&
        this.canTarget(e, target, c.force, true)
      ) {
        e.order = { type: "attack", targetId: target.id, force: !!c.force };
        e.path = [];
        count++;
      }
    }
    return count ? success() : fail("所选单位不能执行该命令");
  }
  powered(owner) {
    const p = this.state.players[owner];
    return (
      !!p && p.power >= p.demand && !(p.powerDisabledUntil > this.state.time)
    );
  }
  recalculatePower() {
    if (!this.state) return;
    for (const p of this.state.players) {
      p.power = 0;
      p.demand = 0;
    }
    for (const e of this.state.entities)
      if (e.owner >= 0 && e.kind === "building" && ready(e)) {
        const p = this.state.players[e.owner],
          d = BUILDINGS[e.type];
        if (!p) continue;
        if (d.power > 0) p.power += d.power * (0.5 + (0.5 * e.hp) / e.maxHp);
        else p.demand -= d.power;
      }
  }
  blocked(x, y, mover, ignoreBuilding = null) {
    const t = this.tile(x, y),
      d = this.unitDef(mover) || {};
    if (!t) return true;
    if (d.movement === "air") return false;
    if (t.kind === "rock" || t.obstacle) return true;
    if (
      d.movement === "naval"
        ? t.kind !== "water" && !t.bridge
        : d.movement !== "amphibious" && t.kind === "water"
    )
      return true;
    if (!this._blocking) {
      const s = this.state;
      this._blocking = new Int32Array(s.width * s.height);
      for (const b of s.entities)
        if (b.kind === "building" && alive(b)) {
          const def = BUILDINGS[b.type];
          for (let yy = Math.floor(b.y); yy < b.y + def.h; yy++)
            for (let xx = Math.floor(b.x); xx < b.x + def.w; xx++) {
              if (xx >= 0 && yy >= 0 && xx < s.width && yy < s.height)
                this._blocking[yy * s.width + xx] = b.id;
            }
        }
    }
    const id = this._blocking[Math.floor(y) * this.state.width + Math.floor(x)];
    return !!id && id !== ignoreBuilding;
  }
  canTraverse(x, y, xx, yy, mover) {
    const movement = this.unitDef(mover)?.movement;
    if (this.blocked(xx, yy, mover)) return false;
    const dx = Math.sign(xx - x),
      dy = Math.sign(yy - y);
    const from = this.tile(x, y),
      to = this.tile(xx, yy);
    if (!edgeConnected(from, to, dx, dy, movement)) return false;
    if (dx && dy) {
      const a = this.tile(x + dx, y),
        b = this.tile(x, y + dy);
      // Both L-shaped routes must be legal: no cutting across a cliff corner.
      return (
        !this.blocked(x + dx, y, mover) &&
        !this.blocked(x, y + dy, mover) &&
        edgeConnected(from, a, dx, 0, movement) &&
        edgeConnected(a, to, 0, dy, movement) &&
        edgeConnected(from, b, 0, dy, movement) &&
        edgeConnected(b, to, dx, 0, movement)
      );
    }
    return true;
  }
  findPath(e, x, y, range = 0.2) {
    const s = this.state,
      d = this.unitDef(e),
      sx = Math.floor(e.x),
      sy = Math.floor(e.y);
    if (d.movement === "air") return [{ x, y }];
    const start = sy * s.width + sx,
      target = { x, y },
      heap = new Heap(),
      g = new Map([[start, 0]]),
      parent = new Map(),
      closed = new Set();
    heap.push({ n: start, f: 0 });
    let found = null,
      visits = 0;
    while (heap.length && visits < s.width * s.height) {
      const node = heap.pop().n;
      if (closed.has(node)) continue;
      closed.add(node);
      visits++;
      const nx = node % s.width,
        ny = Math.floor(node / s.width);
      if (Math.hypot(nx + 0.5 - x, ny + 0.5 - y) <= Math.max(0.75, range)) {
        found = node;
        break;
      }
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
      ]) {
        const xx = nx + dx,
          yy = ny + dy;
        if (!this.canTraverse(nx, ny, xx, yy, e)) continue;
        const next = yy * s.width + xx,
          ng =
            g.get(node) +
            (dx && dy ? 1.4142 : 1) /
              terrainSpeed(
                this.tile(xx, yy),
                d.movement || (d.armor === "infantry" ? "foot" : "tracked"),
              );
        if (ng >= (g.get(next) ?? Infinity)) continue;
        g.set(next, ng);
        parent.set(next, node);
        heap.push({
          n: next,
          f: ng + Math.hypot(xx + 0.5 - target.x, yy + 0.5 - target.y) / 1.12,
        });
      }
    }
    if (found === null) return [];
    // Grid-node centres and actor positions can differ by half a cell. If the
    // start cell satisfies the goal radius, still walk to its centre rather than
    // reporting an empty/unreachable path while the actual actor is out of reach.
    if (found === start) return [{ x: sx + 0.5, y: sy + 0.5 }];
    const path = [];
    for (let n = found; n !== start; n = parent.get(n))
      path.push({ x: (n % s.width) + 0.5, y: Math.floor(n / s.width) + 0.5 });
    path.reverse();
    return path;
  }
  moveTowards(e, x, y, dt, range = 0.25) {
    // A move/attack-move click may target a building's footprint. Route to its
    // perimeter; requiring a walkable centre cell would freeze whole AI armies.
    if (range < 1 && this.unitDef(e).movement !== "air") {
      const obstacle = this.state.entities.find(
        (b) =>
          alive(b) &&
          b.kind === "building" &&
          x >= b.x &&
          x < b.x + BUILDINGS[b.type].w &&
          y >= b.y &&
          y < b.y + BUILDINGS[b.type].h,
      );
      if (obstacle)
        range =
          Math.max(BUILDINGS[obstacle.type].w, BUILDINGS[obstacle.type].h) / 2 +
          0.8;
    }
    if (distance(e, { x, y }) <= Math.max(0.5, range)) {
      e.path = [];
      return true;
    }
    const key = `${Math.floor(x)},${Math.floor(y)},${Math.round(range * 2)}`;
    if (e.pathGoal !== key || (!e.path.length && e.repath <= 0)) {
      e.path = this.findPath(e, x, y, range);
      e.pathGoal = key;
      e.repath = 1.4;
      if (!e.path.length) {
        e.blockedTime = (e.blockedTime || 0) + dt;
        return false;
      }
    }
    const next = e.path[0];
    if (!next) return false;
    if (
      !this.canTraverse(
        Math.floor(e.x),
        Math.floor(e.y),
        Math.floor(next.x),
        Math.floor(next.y),
        e,
      )
    ) {
      e.path = [];
      e.pathGoal = null;
      return false;
    }
    const dx = next.x - e.x,
      dy = next.y - e.y,
      len = Math.hypot(dx, dy);
    const mover = this.unitDef(e);
    const speed =
        mover.speed *
        (1 + (e.veteran || 0) * 0.08) *
        terrainSpeed(
          this.tile(e.x, e.y),
          mover.movement || (mover.armor === "infantry" ? "foot" : "tracked"),
        ),
      move = Math.min(len, speed * dt);
    if (len > 0.001) {
      e.x += (dx / len) * move;
      e.y += (dy / len) * move;
      e.facing = Math.atan2(dy, dx);
    }
    if (len <= move + 0.02) e.path.shift();
    return distance(e, { x, y }) <= Math.max(0.8, range);
  }
  findExit(building, type) {
    const d = BUILDINGS[building.type],
      mover = { type },
      cx = building.x + d.w / 2,
      cy = building.y + d.h / 2;
    for (let ring = 1; ring <= 7; ring++)
      for (let y = Math.floor(cy) - ring; y <= Math.floor(cy) + ring; y++)
        for (let x = Math.floor(cx) - ring; x <= Math.floor(cx) + ring; x++) {
          if (
            Math.max(
              Math.abs(x - Math.floor(cx)),
              Math.abs(y - Math.floor(cy)),
            ) !== ring
          )
            continue;
          if (
            !this.blocked(x, y, mover) &&
            !this.state.entities.some(
              (e) =>
                alive(e) &&
                e.kind === "unit" &&
                !e.carrierId &&
                distance(e, { x: x + 0.5, y: y + 0.5 }) < 0.6,
            )
          )
            return { x: x + 0.5, y: y + 0.5 };
        }
    return null;
  }
  unload(carrier) {
    const ids = [...(carrier.passengers || []), ...(carrier.garrison || [])];
    let count = 0;
    for (const id of ids) {
      const passenger = this.getEntity(id);
      if (!passenger || !alive(passenger)) continue;
      let point = null;
      for (let r = 1; r <= 4 && !point; r++)
        for (let a = 0; a < 12; a++) {
          const x = Math.floor(
              center(carrier).x + Math.cos((a * Math.PI) / 6) * r,
            ),
            y = Math.floor(center(carrier).y + Math.sin((a * Math.PI) / 6) * r);
          if (!this.blocked(x, y, passenger)) {
            point = { x: x + 0.5, y: y + 0.5 };
            break;
          }
        }
      if (!point) continue;
      passenger.carrierId = null;
      Object.assign(passenger, point);
      passenger.order = { type: "idle" };
      passenger.path = [];
      carrier.passengers = carrier.passengers.filter((n) => n !== id);
      carrier.garrison = carrier.garrison.filter((n) => n !== id);
      count++;
    }
    return count;
  }
  harvest(e, dt) {
    const s = this.state,
      d = this.unitDef(e),
      owner = s.players[e.owner];
    const refineries = this.owned(
      e.owner,
      (a) => a.type === "refinery" && ready(a),
    ).sort((a, b) => distance(e, center(a)) - distance(e, center(b)));
    if (!refineries.length) {
      e.harvestState = "waiting-refinery";
      return;
    }
    const ref = this.getEntity(e.refineryId);
    const refinery =
      ref && ready(ref) && ref.owner === e.owner ? ref : refineries[0];
    e.refineryId = refinery.id;
    if (e.cargo >= d.capacity || e.harvestState === "return") {
      e.harvestState = "return";
      if (d.chronoReturn && distance(e, center(refinery)) > 3) {
        e.chronoTimer = (e.chronoTimer || 0) + dt;
        if (e.chronoTimer < 1.5) return;
        const exit = this.findExit(refinery, "miner");
        if (exit) {
          this.state.effects.push({
            id: s.nextId++,
            x: e.x,
            y: e.y,
            kind: "chrono",
            life: 0.7,
            maxLife: 0.7,
            size: 1,
          });
          e.x = exit.x;
          e.y = exit.y;
          e.path = [];
          e.pathGoal = null;
          e.chronoTimer = 0;
          this.emit("chronoReturn", {
            entityId: e.id,
            owner: e.owner,
            refineryId: refinery.id,
          });
        }
      }
      if (
        this.moveTowards(e, center(refinery).x, center(refinery).y, dt, 2.7)
      ) {
        owner.credits += e.cargo;
        owner.income += e.cargo;
        if (e.owner === 0) s.statistics.mined += e.cargo;
        this.emit("oreDelivered", {
          entityId: e.id,
          owner: e.owner,
          amount: e.cargo,
        });
        e.cargo = 0;
        e.harvestState = "seek";
        e.pathGoal = null;
      }
      return;
    }
    let target =
      e.oreTarget && this.tile(e.oreTarget.x, e.oreTarget.y)?.ore > 0
        ? e.oreTarget
        : null;
    if (!target) {
      let best = Infinity;
      for (let i = 0; i < s.tiles.length; i++)
        if (s.tiles[i].ore > 0) {
          const point = {
              x: (i % s.width) + 0.5,
              y: Math.floor(i / s.width) + 0.5,
            },
            cost = distance(e, point);
          if (
            cost < best &&
            (!e.unreachableOre || !e.unreachableOre.includes(i))
          ) {
            best = cost;
            target = point;
          }
        }
      if (!target) {
        if (e.cargo) e.harvestState = "return";
        else e.unreachableOre = [];
        return;
      }
      e.oreTarget = target;
      e.pathGoal = null;
    }
    e.harvestState = "collect";
    if (this.moveTowards(e, target.x, target.y, dt, 0.8)) {
      const tile = this.tile(target.x, target.y),
        value = tile.kind === "gem" ? 2 : 1;
      const amount = Math.min(
        tile.ore,
        d.harvestRate * dt,
        (d.capacity - e.cargo) / value,
      );
      e.cargo += amount * value;
      tile.ore -= amount;
      if (tile.ore <= 0) {
        tile.ore = 0;
        tile.kind = "dirt";
        e.oreTarget = null;
      }
    } else if (!e.path.length && e.repath < 0.2) {
      e.unreachableOre ||= [];
      e.unreachableOre.push(
        Math.floor(target.y) * s.width + Math.floor(target.x),
      );
      e.oreTarget = null;
    }
  }
  canTarget(e, target, force = false, explicit = false) {
    if (!alive(target) || target.carrierId || e.id === target.id) return false;
    if (target.missionCaptureOnly && !explicit) return false;
    if (
      target.type === "spy" &&
      !(target.revealedUntil > this.state.time) &&
      !force &&
      !(e.type === "dog" && distance(center(e), target) < 3.5)
    )
      return false;
    const d = this.entityDef(e);
    if (!d.damage) return false;
    if (!force && !this.isEnemy(e, target)) return false;
    const td = this.entityDef(target),
      cat =
        td.movement === "air"
          ? "air"
          : td.movement === "naval"
            ? "naval"
            : td.armor === "infantry"
              ? "infantry"
              : "ground";
    return (
      (d.targets || ["ground"]).includes(cat) ||
      (cat === "infantry" && d.targets?.includes("ground")) ||
      (cat === "naval" && d.targets?.includes("ground"))
    );
  }
  inSight(e, target) {
    return (
      distance(center(e), center(target)) <= (this.entityDef(e).sight || 8) + 1
    );
  }
  fire(e, target) {
    let d = this.entityDef(e);
    const s = this.state;
    if (e.kind === "building" && !d.damage && e.garrison.length)
      d = {
        ...d,
        damage: 12 * e.garrison.length,
        cooldown: 0.9,
        weapon: "rifle",
        targets: ["ground"],
      };
    if (e.cooldown > 0 || (d.ammo && e.ammo <= 0)) return;
    if (e.kind === "building" && d.requiresPower && !this.powered(e.owner))
      return;
    const from = center(e),
      to = center(target),
      boost = (1 + (e.veteran || 0) * 0.15) * (e.deployed ? 1.4 : 1);
    e.cooldown = d.cooldown / (1 + (e.veteran || 0) * 0.12);
    e.facing = Math.atan2(to.y - from.y, to.x - from.x);
    e.muzzle = 0.1;
    if (d.ammo) e.ammo--;
    s.projectiles.push({
      id: s.nextId++,
      x: from.x,
      y: from.y,
      targetX: to.x,
      targetY: to.y,
      targetId: target.id,
      sourceId: e.id,
      owner: e.owner,
      kind: d.weapon || "rifle",
      speed:
        d.weapon === "laser" || d.weapon === "bite"
          ? 70
          : d.weapon === "rifle"
            ? 32
            : d.weapon === "rocket"
              ? 12
              : 18,
      damage:
        d.damage *
        boost *
        (e.kind === "building" ? 1 + e.garrison.length * 0.15 : 1),
      splash: d.splash || 0,
      force: !!e.order?.force,
      life: 6,
    });
    this.emit("shot", {
      entityId: e.id,
      owner: e.owner,
      weapon: d.weapon,
      x: from.x,
      y: from.y,
    });
  }
  damage(entity, amount, source = null) {
    const e = typeof entity === "number" ? this.getEntity(entity) : entity;
    if (!e || !alive(e) || e.invulnerable) return;
    e.hp -= Math.max(0, amount);
    e.hit = 0.12;
    if (e.hp > 0) return;
    e.hp = 0;
    e.dead = true;
    e.order = { type: "idle" };
    e.path = [];
    this._blocking = null;
    const attacker =
      typeof source === "number" ? this.getEntity(source) : source;
    const owner = attacker?.owner;
    if (e.owner >= 0) {
      this.state.players[e.owner].lost++;
      if (e.owner === 0) this.state.statistics.lost++;
    }
    if (owner >= 0 && this.isEnemy(owner, e.owner)) {
      this.state.players[owner].kills++;
      if (owner === 0) this.state.statistics.kills++;
      if (attacker?.kind === "unit") {
        attacker.experience += this.entityDef(e).cost || 100;
        attacker.veteran = Math.min(
          2,
          Math.floor(
            attacker.experience /
              Math.max(300, this.entityDef(attacker).cost * 2),
          ),
        );
      }
    }
    for (const id of [...e.passengers, ...e.garrison]) {
      const p = this.getEntity(id);
      if (p) {
        p.carrierId = null;
        this.damage(p, p.hp, attacker);
      }
    }
    this.state.effects.push({
      id: this.state.nextId++,
      x: center(e).x,
      y: center(e).y,
      kind: "explosion",
      life: 0.8,
      maxLife: 0.8,
      size: e.kind === "building" ? 2.3 : 0.8,
    });
    this.recalculatePower();
    this.emit("death", {
      entityId: e.id,
      entityType: e.type,
      owner: e.owner,
      sourceId: attacker?.id ?? null,
      killerOwner: owner ?? null,
      tags: [...(e.tags || [])],
      x: e.x,
      y: e.y,
    });
  }
  updateProduction(e, dt) {
    const s = this.state,
      p = s.players[e.owner],
      d = BUILDINGS[e.type];
    if (!p) return;
    const rate = this.powered(e.owner) ? 1 : 0.45;
    if (!ready(e)) {
      const desired = Math.min(1 - e.progress, (dt / d.buildTime) * rate),
        price = desired * d.cost;
      const fraction = price > p.credits ? p.credits / (price || 1) : 1;
      const increment = desired * fraction;
      p.credits -= price * fraction;
      p.spent += price * fraction;
      e.costSpent = (e.costSpent || 0) + price * fraction;
      e.progress = Math.min(1, e.progress + increment);
      e.hp = Math.min(e.maxHp, e.hp + increment * (e.maxHp - 1));
      if (e.progress >= 1 - 1e-8) {
        e.progress = 1;
        this.recalculatePower();
        if (e.owner === 0) s.statistics.built++;
        if (d.givesMiner) {
          const exit = this.findExit(e, "miner");
          if (exit) this.spawn("miner", e.owner, exit.x, exit.y);
          else e.pendingMiner = true;
        }
        this.emit("buildComplete", {
          entityId: e.id,
          building: e.type,
          owner: e.owner,
          tags: e.tags,
        });
      }
      return;
    }
    if (e.pendingMiner) {
      const exit = this.findExit(e, "miner");
      if (exit) {
        this.spawn("miner", e.owner, exit.x, exit.y);
        e.pendingMiner = false;
      }
    }
    if (e.queue.length) {
      const q = e.queue[0],
        unit = this.getDefinition(q.type, e.owner);
      const desired = Math.min(1 - q.progress, (dt / unit.buildTime) * rate),
        price = desired * unit.cost;
      const fraction = price > p.credits ? p.credits / (price || 1) : 1;
      p.credits -= price * fraction;
      p.spent += price * fraction;
      q.paid += price * fraction;
      q.progress += desired * fraction;
      if (q.progress >= 1 - 1e-8) {
        q.progress = 1;
        const exit = this.findExit(e, q.type);
        if (exit) {
          const born = this.spawn(q.type, e.owner, exit.x, exit.y, {
            homeId: e.id,
          });
          if (e.rally && born.type !== "miner")
            born.order = { type: "move", ...e.rally };
          e.queue.shift();
          this.emit("trainComplete", {
            entityId: born.id,
            unit: q.type,
            owner: e.owner,
            buildingId: e.id,
          });
        }
      }
    }
    if (d.income) {
      p.credits += d.income * dt;
      p.income += d.income * dt;
    }
    if (d.chargeTime && this.powered(e.owner))
      e.charge = Math.min(d.chargeTime, e.charge + dt);
    if (e.repairEnabled && e.hp < e.maxHp && p.credits > 0) {
      const heal = Math.min(30 * dt, e.maxHp - e.hp, p.credits * 3);
      e.hp += heal;
      p.credits -= heal / 3;
    }
    if (d.repairs || d.hospital)
      for (const target of this.owned(
        e.owner,
        (a) => a.kind === "unit" && !a.carrierId && a.hp < a.maxHp,
      )) {
        const infantry = UNITS[target.type].armor === "infantry";
        if (
          (d.hospital
            ? infantry
            : !infantry && UNITS[target.type].movement !== "air") &&
          distance(center(e), target) < 4
        ) {
          const heal = Math.min(
            22 * dt,
            target.maxHp - target.hp,
            p.credits * 2,
          );
          target.hp += heal;
          p.credits -= heal / 2;
        }
      }
  }
  updateUnit(e, dt) {
    const s = this.state,
      d = this.unitDef(e),
      order = e.order || { type: "idle" };
    if (e.carrierId) {
      const carrier = this.getEntity(e.carrierId);
      if (carrier) {
        e.x = carrier.x;
        e.y = carrier.y;
      }
      return;
    }
    if (
      d.spy &&
      s.entities.some(
        (a) =>
          alive(a) &&
          a.type === "dog" &&
          this.isEnemy(e, a) &&
          distance(e, a) < 3.5,
      )
    )
      e.revealedUntil = s.time + 12;
    if (e.veteran >= 2) e.hp = Math.min(e.maxHp, e.hp + dt * 3);
    if (d.ammo && (e.ammo <= 0 || e.rearming)) {
      const airport = this.owned(
        e.owner,
        (a) => a.type === "airfield" && ready(a),
      ).sort((a, b) => distance(e, center(a)) - distance(e, center(b)))[0];
      if (airport) {
        e.rearming = true;
        if (
          this.moveTowards(e, center(airport).x, center(airport).y, dt, 1.2)
        ) {
          e.reload = (e.reload || 0) + dt * (this.powered(e.owner) ? 1 : 0.45);
          if (e.reload >= d.reloadTime) {
            e.ammo = d.ammo;
            e.reload = 0;
            e.rearming = false;
          }
        }
      }
      return;
    }
    if (e.type === "miner" && ["idle", "harvest"].includes(order.type)) {
      this.harvest(e, dt);
      if (d.damage && e.cooldown <= 0) {
        const threat = s.entities.find(
          (a) => this.canTarget(e, a) && distance(e, center(a)) <= d.range,
        );
        if (threat) this.fire(e, threat);
      }
      return;
    }
    if (["capture", "repair", "garrison", "infiltrate"].includes(order.type)) {
      const target = this.getEntity(order.targetId);
      if (!target || !alive(target)) {
        e.order = { type: "idle" };
        return;
      }
      if (
        this.moveTowards(
          e,
          center(target).x,
          center(target).y,
          dt,
          target.kind === "building"
            ? Math.max(BUILDINGS[target.type].w, BUILDINGS[target.type].h) / 2 +
                0.8
            : 1.1,
        )
      ) {
        if (
          order.type === "capture" &&
          d.engineer &&
          target.kind === "building" &&
          target.owner !== e.owner &&
          !target.protected
        ) {
          const previousOwner = target.owner;
          target.owner = e.owner;
          target.queue = [];
          target.repairEnabled = false;
          e.hp = 0;
          e.dead = true;
          this.recalculatePower();
          this.emit("capture", {
            entityId: target.id,
            previousOwner,
            owner: target.owner,
            tags: target.tags,
          });
        } else if (
          order.type === "infiltrate" &&
          d.spy &&
          target.kind === "building" &&
          target.owner !== e.owner
        ) {
          target.lastInfiltrationAt = s.time;
          target.lastInfiltratorId = e.id;
          target.lastInfiltratedId = e.id;
          e.lastInfiltratedId = target.id;
          e.lastInfiltrationAt = s.time;
          if (target.type === "powerPlant" && target.owner >= 0)
            s.players[target.owner].powerDisabledUntil = s.time + 45;
          if (target.type === "refinery" && target.owner >= 0) {
            const stolen = s.players[target.owner].credits * 0.35;
            s.players[target.owner].credits -= stolen;
            s.players[e.owner].credits += stolen;
          }
          e.order = { type: "idle" };
          e.path = [];
          e.revealedUntil = s.time + 3;
          this.emit("infiltrate", {
            entityId: e.id,
            targetId: target.id,
            owner: e.owner,
            previousOwner: target.owner,
            tags: target.tags,
          });
        } else if (order.type === "repair") {
          const healed = d.engineer ? target : e,
            max = healed.maxHp,
            player = s.players[e.owner];
          const amount = Math.min(40 * dt, max - healed.hp, player.credits * 3);
          healed.hp += amount;
          player.credits -= amount / 3;
          if (healed.hp >= max) e.order = { type: "idle" };
        } else if (order.type === "garrison") {
          const td = this.entityDef(target),
            seats = td.transport ? target.passengers : target.garrison,
            capacity = td.transport ? td.capacity : td.garrisonCapacity;
          const weight = d.armor === "infantry" ? 1 : 3,
            occupied = seats.reduce(
              (n, id) =>
                n +
                (UNITS[this.getEntity(id)?.type]?.armor === "infantry" ? 1 : 3),
              0,
            );
          if (capacity && occupied + weight <= capacity) {
            seats.push(e.id);
            e.carrierId = target.id;
            e.order = { type: "idle" };
            if (target.owner === -1) target.owner = e.owner;
          } else e.order = { type: "idle" };
        }
      }
      return;
    }
    let target =
      order.type === "attack"
        ? this.getEntity(order.targetId)
        : e.targetId
          ? this.getEntity(e.targetId)
          : null;
    if (
      target &&
      !this.canTarget(e, target, order.force, order.type === "attack")
    )
      target = null;
    if (!target && order.type !== "move" && d.damage && e.scan <= 0) {
      target = s.entities
        .filter((a) => this.canTarget(e, a) && this.inSight(e, a))
        .sort((a, b) => distance(e, center(a)) - distance(e, center(b)))[0];
      e.scan = 0.45;
    }
    e.targetId = target?.id ?? null;
    if (target) {
      const pos = center(target),
        range = d.range + (e.deployed ? 2 : 0),
        dist = distance(e, pos);
      if (dist <= range && dist >= (d.minRange || 0)) this.fire(e, target);
      else if (
        !e.deployed &&
        (order.type === "attack" || order.type === "attackMove")
      )
        this.moveTowards(e, pos.x, pos.y, dt, range * 0.9);
      if (order.type === "attack" || order.type === "attackMove") return;
    } else if (order.type === "attack") {
      e.order = { type: "idle" };
    }
    if (["move", "attackMove"].includes(order.type) && !e.deployed) {
      if (this.moveTowards(e, order.x, order.y, dt)) {
        e.order = { type: "idle" };
        e.pathGoal = null;
      }
    }
  }
  updateBuildingCombat(e) {
    const d = BUILDINGS[e.type];
    if (
      (!d.damage && !e.garrison.length) ||
      !ready(e) ||
      (d.requiresPower && !this.powered(e.owner))
    )
      return;
    const range = d.range || 6;
    let target = this.getEntity(e.targetId);
    const allowed = (a) =>
      d.damage
        ? this.canTarget(e, a)
        : this.isEnemy(e, a) &&
          alive(a) &&
          !a.carrierId &&
          this.entityDef(a).movement !== "air";
    if (
      !target ||
      !allowed(target) ||
      distance(center(e), center(target)) > range
    )
      target = null;
    if (!target && e.scan <= 0) {
      target = this.state.entities
        .filter((a) => allowed(a) && distance(center(e), center(a)) <= range)
        .sort(
          (a, b) =>
            distance(center(e), center(a)) - distance(center(e), center(b)),
        )[0];
      e.scan = 0.35;
    }
    e.targetId = target?.id ?? null;
    if (target) this.fire(e, target);
  }
  updateProjectiles(dt) {
    const s = this.state;
    for (const shot of s.projectiles) {
      shot.life -= dt;
      if (shot.strategic) {
        if (shot.life > 0) continue;
        this.impact(shot);
        shot.done = true;
        continue;
      }
      const target = this.getEntity(shot.targetId);
      if (
        target &&
        alive(target) &&
        !target.carrierId &&
        shot.kind === "missile"
      ) {
        const p = center(target);
        shot.targetX = p.x;
        shot.targetY = p.y;
      }
      const dx = shot.targetX - shot.x,
        dy = shot.targetY - shot.y,
        length = Math.hypot(dx, dy),
        move = shot.speed * dt;
      if (length <= move || shot.life <= 0) {
        shot.x = shot.targetX;
        shot.y = shot.targetY;
        this.impact(shot);
        shot.done = true;
      } else {
        shot.x += (dx / length) * move;
        shot.y += (dy / length) * move;
      }
    }
    s.projectiles = s.projectiles.filter((p) => !p.done);
  }
  impact(shot) {
    const s = this.state,
      source = this.getEntity(shot.sourceId) || {
        id: shot.sourceId,
        owner: shot.owner,
      };
    const direct = this.getEntity(shot.targetId),
      point = { x: shot.targetX, y: shot.targetY };
    for (const e of s.entities) {
      if (!alive(e) || e.carrierId) continue;
      const d = distance(center(e), point),
        radius =
          e.kind === "building"
            ? Math.min(BUILDINGS[e.type].w, BUILDINGS[e.type].h) / 2
            : 0.55;
      if (
        shot.strategic
          ? d > shot.splash + radius
          : e !== direct && (!shot.splash || d > shot.splash + radius)
      )
        continue;
      if (!shot.strategic && !shot.force && e.owner === shot.owner) continue;
      if (e === direct && d > radius + 0.8 && shot.kind !== "missile") continue;
      const armor = this.entityDef(e).armor,
        modifier = shot.strategic
          ? Math.max(0.2, 1 - d / (shot.splash + radius + 1))
          : (ARMOR_MULTIPLIERS[shot.kind]?.[armor] ?? 1);
      const splash = e !== direct && !shot.strategic ? 0.6 : 1;
      this.damage(e, shot.damage * modifier * splash, source);
    }
    s.effects.push({
      id: s.nextId++,
      x: point.x,
      y: point.y,
      kind: shot.strategic ? shot.kind : "impact",
      life: shot.strategic ? 2.5 : 0.3,
      maxLife: shot.strategic ? 2.5 : 0.3,
      size: shot.strategic ? shot.splash : 0.4,
    });
  }
  updateVisibility() {
    const s = this.state;
    for (const tile of s.tiles) tile.visible = false;
    for (const e of s.entities)
      if (
        alive(e) &&
        !e.carrierId &&
        e.owner >= 0 &&
        s.players[e.owner]?.team === s.players[0]?.team
      ) {
        const p = center(e),
          radius = this.entityDef(e).sight || 8;
        for (
          let y = Math.max(0, Math.floor(p.y - radius));
          y <= Math.min(s.height - 1, Math.ceil(p.y + radius));
          y++
        )
          for (
            let x = Math.max(0, Math.floor(p.x - radius));
            x <= Math.min(s.width - 1, Math.ceil(p.x + radius));
            x++
          )
            if (Math.hypot(x + 0.5 - p.x, y + 0.5 - p.y) <= radius) {
              const tile = s.tiles[y * s.width + x];
              tile.visible = true;
              tile.explored = true;
            }
      }
  }
  aiPlace(owner, type) {
    const anchors = this.owned(
      owner,
      (e) =>
        e.kind === "building" && ready(e) && !BUILDINGS[e.type].neutralOnly,
    );
    for (const anchor of anchors) {
      const p = center(anchor);
      for (let r = 3; r <= 9; r++)
        for (let k = 0; k < 16; k++) {
          const x = Math.floor(p.x + Math.cos((k * Math.PI) / 8) * r),
            y = Math.floor(p.y + Math.sin((k * Math.PI) / 8) * r);
          if (this.canBuild(type, x, y, owner).ok)
            return this.command({ type: "build", owner, building: type, x, y })
              .ok;
        }
    }
    return false;
  }
  updateAI() {
    const s = this.state;
    for (const player of s.players) {
      if (!player.ai || player.defeated) continue;
      const owner = player.id,
        ai = player.aiState,
        mine = this.owned(owner),
        has = (type) => mine.some((e) => e.type === type && ready(e));
      for (const mcv of mine.filter((e) => e.type === "mcv")) {
        if (
          !this.command({ type: "deploy", ids: [mcv.id], owner }).ok &&
          (!mcv.order || mcv.order.type === "idle")
        )
          this.command({
            type: "move",
            owner,
            ids: [mcv.id],
            x: mcv.x + 2,
            y: mcv.y + 2,
          });
      }
      if (s.time >= ai.nextBuild) {
        ai.nextBuild = s.time + 3;
        let wanted = null;
        if (!has("powerPlant") || player.power - player.demand < 50)
          wanted = "powerPlant";
        else if (!has("refinery")) wanted = "refinery";
        else if (!has("barracks")) wanted = "barracks";
        else if (!has("warFactory")) wanted = "warFactory";
        else if (!has("radar")) wanted = "radar";
        else if (!has("pillbox")) wanted = "pillbox";
        else if (!has("repairDepot")) wanted = "repairDepot";
        else if (s.mapId === "islands" && !has("shipyard")) wanted = "shipyard";
        else if (player.faction !== "soviet" && !has("airfield"))
          wanted = "airfield";
        else if (s.time > 180 && !has("techLab")) wanted = "techLab";
        else if (s.time > 330 && !has("superweapon")) wanted = "superweapon";
        if (wanted && player.credits > BUILDINGS[wanted].cost * 0.6)
          this.aiPlace(owner, wanted);
      }
      for (const factory of mine.filter(
        (e) => ready(e) && BUILDINGS[e.type]?.factory && e.queue.length < 2,
      )) {
        let unit = null;
        if (factory.type === "barracks") unit = "infantry";
        if (factory.type === "warFactory")
          unit = !has("constructionYard")
            ? "mcv"
            : mine.filter((e) => e.type === "miner").length < 2
              ? "miner"
              : has("techLab") && this.random() < 0.25
                ? player.faction === "allied"
                  ? "prism"
                  : player.faction === "soviet" && this.random() < 0.35
                    ? "kirov"
                    : "mammoth"
                : this.random() < 0.2
                  ? "antiAir"
                  : "tank";
        if (factory.type === "airfield") unit = "fighter";
        if (factory.type === "shipyard")
          unit =
            s.mapId === "islands" && !mine.some((e) => e.type === "transport")
              ? "transport"
              : "destroyer";
        if (
          unit &&
          player.credits > UNITS[unit].cost * 0.7 &&
          mine.filter((e) => e.kind === "unit").length < 65
        )
          this.command({ type: "train", unit, buildingId: factory.id, owner });
      }
      const enemyPlayers = s.players.filter(
        (p) => !p.defeated && this.isEnemy(owner, p.id),
      );
      if (!enemyPlayers.length) continue;
      const enemyId =
        enemyPlayers[Math.floor(this.random() * enemyPlayers.length)].id;
      const targets = this.owned(
        enemyId,
        (e) => e.kind === "building" && !BUILDINGS[e.type].neutralOnly,
      );
      const target =
        targets.find((e) => e.type === "constructionYard") ||
        targets[0] ||
        this.owned(enemyId)[0];
      if (target)
        for (const carrier of mine.filter((e) => e.type === "transport")) {
          const destination = center(target);
          if (
            carrier.passengers.length &&
            distance(carrier, destination) < 11
          ) {
            const ids = [...carrier.passengers];
            this.unload(carrier);
            this.command({
              type: "attackMove",
              owner,
              ids: ids.filter((id) => !this.getEntity(id)?.carrierId),
              ...destination,
            });
            carrier.order = { type: "idle" };
          } else if (carrier.passengers.length >= 3) {
            this.command({
              type: "move",
              owner,
              ids: [carrier.id],
              ...destination,
            });
          } else {
            const boarding = mine
              .filter(
                (e) =>
                  e.kind === "unit" &&
                  !e.carrierId &&
                  ["infantry", "tank", "antiAir"].includes(e.type) &&
                  distance(e, carrier) < 14,
              )
              .slice(0, 5);
            if (boarding.length)
              this.command({
                type: "garrison",
                owner,
                ids: boarding.map((e) => e.id),
                targetId: carrier.id,
              });
          }
        }
      if (target && s.time >= ai.nextAttack) {
        const interval =
          this.options.difficulty === "easy"
            ? 100
            : this.options.difficulty === "hard"
              ? 46
              : 70;
        ai.nextAttack = s.time + interval;
        ai.lastWave++;
        const attackers = mine.filter(
          (e) =>
            e.kind === "unit" &&
            !["mcv", "miner", "engineer", "transport"].includes(e.type) &&
            !e.carrierId,
        );
        if (attackers.length >= 3)
          this.command({
            type: "attackMove",
            owner,
            ids: attackers.map((e) => e.id),
            ...center(target),
          });
      }
      const weapon = mine.find(
        (e) =>
          e.type === "superweapon" &&
          e.charge >= BUILDINGS.superweapon.chargeTime,
      );
      if (weapon && target)
        this.command({
          type: "superweapon",
          owner,
          id: weapon.id,
          ...center(target),
        });
      for (const e of mine)
        if (
          e.kind === "building" &&
          e.hp < e.maxHp * 0.7 &&
          player.credits > 500
        )
          e.repairEnabled = true;
    }
  }
  checkVictory() {
    const s = this.state;
    if (s.mode !== "skirmish" || s.time < 3) return;
    for (const player of s.players)
      if (
        !player.defeated &&
        !this.owned(
          player.id,
          (e) =>
            (e.kind === "building" && !BUILDINGS[e.type].neutralOnly) ||
            e.kind === "unit",
        ).length
      ) {
        player.defeated = true;
        this.emit("playerDefeated", { owner: player.id });
      }
    if (s.players[0].defeated) {
      s.status = "lost";
      this.emit("defeat");
    } else if (!s.players.some((p) => !p.defeated && this.isEnemy(0, p.id))) {
      s.status = "won";
      this.emit("victory");
    }
  }
  step(dt) {
    if (this.state.status !== "playing" || !Number.isFinite(dt) || dt <= 0)
      return;
    let remaining = Math.min(dt, 2);
    while (remaining > 1e-8 && this.state.status === "playing") {
      const tick = Math.min(0.05, remaining);
      this.simulate(tick);
      remaining -= tick;
    }
  }
  simulate(dt) {
    const s = this.state;
    this._blocking = null;
    s.time += dt;
    s.visibilityClock -= dt;
    s.aiClock -= dt;
    s.economyClock -= dt;
    if (s.economyClock <= 0) {
      this.recalculatePower();
      s.economyClock = 0.5;
    }
    const frame = [...s.entities];
    for (const e of frame) {
      if (!alive(e)) continue;
      e.cooldown = Math.max(0, (e.cooldown || 0) - dt);
      e.repath = Math.max(0, (e.repath || 0) - dt);
      e.scan = Math.max(0, (e.scan || 0) - dt);
      e.hit = Math.max(0, (e.hit || 0) - dt);
      e.muzzle = Math.max(0, (e.muzzle || 0) - dt);
      if (e.kind === "building") {
        if (e.owner >= 0) this.updateProduction(e, dt);
        this.updateBuildingCombat(e);
      } else this.updateUnit(e, dt);
    }
    this.updateProjectiles(dt);
    for (const effect of s.effects) effect.life -= dt;
    s.effects = s.effects.filter((e) => e.life > 0).slice(-200);
    if (s.visibilityClock <= 0) {
      this.updateVisibility();
      s.visibilityClock = 0.2;
    }
    if (s.aiClock <= 0) {
      if (s.mode === "skirmish" || s.mission?.allowGenericAI) this.updateAI();
      s.aiClock = 2;
    }
    if (s.mode === "campaign") updateMission(this, dt);
    else this.checkVictory();
  }
  serialize() {
    return JSON.parse(
      JSON.stringify({ version: RULES_VERSION, state: this.state }),
    );
  }
  static restore(snapshot) {
    if (!snapshot || snapshot.version !== RULES_VERSION || !snapshot.state)
      throw new Error("存档版本不兼容");
    const s = snapshot.state;
    if (
      s.version !== RULES_VERSION ||
      !Number.isInteger(s.width) ||
      !Number.isInteger(s.height) ||
      s.width < 8 ||
      s.height < 8 ||
      s.width > 160 ||
      s.height > 160 ||
      !Array.isArray(s.tiles) ||
      s.tiles.length !== s.width * s.height ||
      !Array.isArray(s.players) ||
      s.players.length < 1 ||
      s.players.length > 8 ||
      !Array.isArray(s.entities) ||
      s.entities.length > 12000 ||
      !Array.isArray(s.projectiles) ||
      s.projectiles.length > 10000 ||
      !Number.isFinite(s.time) ||
      s.time < 0 ||
      !["skirmish", "campaign"].includes(s.mode) ||
      !["playing", "paused", "won", "lost"].includes(s.status) ||
      !Array.isArray(s.events) ||
      !Array.isArray(s.effects) ||
      !s.options ||
      !Number.isInteger(s.seed)
    )
      throw new Error("存档数据损坏");
    if (
      s.options.mode !== s.mode ||
      !["easy", "normal", "hard"].includes(s.options.difficulty) ||
      !FACTIONS[s.options.faction] ||
      s.options.players !== s.players.length ||
      (s.mode === "campaign" && s.options.missionId !== s.missionId)
    )
      throw new Error("存档设置与战场不一致");
    if (
      s.tiles.some(
        (t) =>
          !t ||
          !["grass", "dirt", "road", "water", "rock", "ore", "gem"].includes(
            t.kind,
          ) ||
          !Number.isFinite(t.ore) ||
          t.ore < 0 ||
          !Number.isFinite(t.height) ||
          t.height < 0 ||
          t.height > 12 ||
          (t.ramp &&
            (!["x", "y"].includes(t.ramp.axis) ||
              ![-1, 1].includes(t.ramp.sign) ||
              !Number.isFinite(t.ramp.low) ||
              !Number.isFinite(t.ramp.high) ||
              t.ramp.low < 0 ||
              t.ramp.high > 12 ||
              t.ramp.high < t.ramp.low)),
      ) ||
      s.players.some(
        (p, i) =>
          !p ||
          p.id !== i ||
          !FACTIONS[p.faction] ||
          !Number.isFinite(p.credits) ||
          p.credits < -0.01 ||
          !p.aiState,
      )
    )
      throw new Error("存档地图或玩家数据损坏");
    if (
      s.mode === "campaign" &&
      (!getMission(s.missionId) ||
        !s.mission ||
        s.mission.id !== s.missionId ||
        !Number.isInteger(s.mission.stage) ||
        s.mission.stage < 1 ||
        s.mission.stage > 3 ||
        !s.mission.roles ||
        !s.mission.flags ||
        !Array.isArray(s.mission.radio))
    )
      throw new Error("战役存档数据损坏");
    const ids = new Set();
    for (const e of s.entities) {
      if (
        !definition(e.type) ||
        !Number.isInteger(e.id) ||
        ids.has(e.id) ||
        !Number.isFinite(e.x) ||
        !Number.isFinite(e.y) ||
        !Number.isFinite(e.hp) ||
        !Number.isInteger(e.owner) ||
        e.owner < -1 ||
        e.owner >= s.players.length ||
        !Number.isFinite(e.maxHp) ||
        e.maxHp <= 0 ||
        !Array.isArray(e.tags) ||
        !Array.isArray(e.path) ||
        !Array.isArray(e.queue) ||
        !Array.isArray(e.passengers) ||
        !Array.isArray(e.garrison)
      )
        throw new Error("存档单位数据损坏");
      if (
        e.queue.some(
          (q) =>
            !UNITS[q.type] ||
            !Number.isFinite(q.progress) ||
            q.progress < 0 ||
            q.progress > 1 ||
            !Number.isFinite(q.paid),
        )
      )
        throw new Error("存档生产数据损坏");
      ids.add(e.id);
    }
    if (
      s.entities.some(
        (e) =>
          (e.carrierId && !ids.has(e.carrierId)) ||
          [...e.passengers, ...e.garrison].some((id) => !ids.has(id)),
      ) ||
      s.projectiles.some(
        (p) =>
          !Number.isFinite(p.x) ||
          !Number.isFinite(p.y) ||
          !Number.isFinite(p.life) ||
          !Number.isFinite(p.damage),
      )
    )
      throw new Error("存档引用或弹体数据损坏");
    if (
      !Number.isInteger(s.nextId) ||
      [...ids].some((id) => id >= s.nextId) ||
      s.players.some(
        (p) =>
          !FACTIONS[p.faction] ||
          !Number.isFinite(p.credits) ||
          p.credits < -0.01,
      )
    )
      throw new Error("存档经济数据损坏");
    if (s.mode === "campaign") validateMissionState(s);
    const game = Object.create(Game.prototype);
    game.state = JSON.parse(JSON.stringify(s));
    game.options = { ...s.options };
    game.onEvent = () => {};
    return game;
  }
}
