import { SpriteAtlas, TerrainAtlas } from "./sprite-atlas.js";
import { UNITS, BUILDINGS, FACTIONS, PLAYER_COLORS } from "./data.js";
import { elevationAt, tileElevation, tacticalColor } from "./terrain.js";
import {
  TILE_W,
  TILE_H,
  HEIGHT_STEP,
  TEAM_COLORS,
  makeTile,
  makeBuilding,
  makeUnit,
  drawTurret,
  path,
  seeded,
} from "./isometric-art.js";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const AIR = new Set(["fighter", "helicopter", "kirov"]);
const INFANTRY = new Set(["infantry", "engineer", "dog", "spy"]);
const angleBetween = (x, y, tx, ty) => Math.atan2(ty - y, tx - x);
const TWO_PI = Math.PI * 2;

// All pixel coordinates in this public API are local CSS pixels, never device pixels.
// The simulation owns every entity, tile and order; this class only owns view caches.
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!this.ctx) throw new Error("Canvas 2D is unavailable");
    this.camera = { x: 0, y: 0, zoom: 1 };
    this.width = 1;
    this.height = 1;
    this.dpr = 1;
    this.tileCache = new Map();
    this.spriteCache = new Map();
    this.iconTargets = new Map();
    this.atlas = new SpriteAtlas(() => this.refreshIcons());
    this.terrainAtlas = new TerrainAtlas(() => this.tileCache.clear());
    this.hitRegions = [];
    this.rememberedBuildings = new Map();
    this.lastState = null;
    this.centered = false;
    this.lastWorldKey = null;
    this.animationTime = 0;
    this.frameCount = 0;
    this.lastMinimapAt = -Infinity;
    this.resize();
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(
      1,
      Math.round(rect.width || this.canvas.clientWidth || 960),
    );
    this.height = Math.max(
      1,
      Math.round(rect.height || this.canvas.clientHeight || 640),
    );
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }
  worldToScreen(x, y, z = 0) {
    const zoom = this.camera.zoom;
    return {
      x:
        this.width / 2 +
        (x - y - (this.camera.x - this.camera.y)) * TILE_W * 0.5 * zoom,
      y:
        this.height / 2 +
        (x + y - (this.camera.x + this.camera.y)) * TILE_H * 0.5 * zoom -
        z * HEIGHT_STEP * zoom,
    };
  }
  screenToWorld(x, y) {
    const a =
      (x - this.width / 2) / (TILE_W * 0.5 * this.camera.zoom) +
      this.camera.x -
      this.camera.y;
    let b =
      (y - this.height / 2) / (TILE_H * 0.5 * this.camera.zoom) +
      this.camera.x +
      this.camera.y;
    let wx = (a + b) / 2,
      wy = (b - a) / 2;
    // Intersect the cursor ray with each candidate flat/sloped cell. Iterating
    // from z=0 alone misses plateau tops when their screen pixel lies over a cliff.
    if (this.lastState) {
      const k = HEIGHT_STEP / TILE_H,
        baseX = wx,
        baseY = wy;
      let highest = -1;
      const checked = new Set();
      for (let z = 0; z <= 12; z += 0.25) {
        const tx = Math.floor(baseX + k * z),
          ty = Math.floor(baseY + k * z),
          key = `${tx},${ty}`;
        if (checked.has(key)) continue;
        checked.add(key);
        const tile = this.tileAt(this.lastState, tx, ty);
        if (!tile) continue;
        const r = tile.ramp,
          delta = r ? (r.high - r.low) * r.sign : 0;
        const gx = r?.axis === "x" ? delta : 0,
          gy = r?.axis === "y" ? delta : 0;
        const base = r ? (r.sign > 0 ? r.low : r.high) : tile.height || 0;
        const height =
          (base + gx * (baseX - tx) + gy * (baseY - ty)) / (1 - k * (gx + gy));
        const xx = baseX + k * height,
          yy = baseY + k * height;
        if (
          height >= highest &&
          xx >= tx - 1e-8 &&
          xx < tx + 1 - 1e-8 &&
          yy >= ty - 1e-8 &&
          yy < ty + 1 - 1e-8
        ) {
          wx = xx;
          wy = yy;
          highest = height;
        }
      }
    }
    return { x: wx, y: wy };
  }
  centerOn(x, y) {
    this.camera.x = Number.isFinite(x) ? x : 0;
    this.camera.y = Number.isFinite(y) ? y : 0;
    this.centered = true;
  }
  pan(dxPixels, dyPixels) {
    const a = dxPixels / (TILE_W * 0.5 * this.camera.zoom),
      b = dyPixels / (TILE_H * 0.5 * this.camera.zoom);
    this.camera.x -= (a + b) / 2;
    this.camera.y -= (b - a) / 2;
    this.centered = true;
    this.constrainCamera();
  }
  zoomAt(factor, x = this.width / 2, y = this.height / 2) {
    const before = this.screenToWorld(x, y);
    this.camera.zoom = clamp(this.camera.zoom * factor, 0.48, 1.85);
    const after = this.screenToWorld(x, y);
    this.camera.x += before.x - after.x;
    this.camera.y += before.y - after.y;
    this.constrainCamera();
  }
  constrainCamera() {
    if (!this.lastState) return;
    this.camera.x = clamp(this.camera.x, -4, this.lastState.width + 4);
    this.camera.y = clamp(this.camera.y, -4, this.lastState.height + 4);
  }
  tileAt(state, x, y) {
    if (!state) return null;
    const tx = Math.floor(x),
      ty = Math.floor(y);
    return tx >= 0 && ty >= 0 && tx < state.width && ty < state.height
      ? state.tiles?.[ty * state.width + tx]
      : null;
  }
  teamColor(state, owner) {
    return (
      state.players?.find((p) => p.id === owner)?.color ||
      (owner < 0
        ? "#9c9d7d"
        : (PLAYER_COLORS || TEAM_COLORS)[Math.abs(owner) % 8])
    );
  }
  faction(state, owner) {
    return state.players?.find((p) => p.id === owner)?.faction || "allied";
  }
  getTile(tile, x, y) {
    const variant = ((((x % 8) * 73856093) ^ ((y % 8) * 19349663)) >>> 0) % 16,
      richness =
        tile.ore === 0
          ? 0
          : (tile.ore || 2500) < 500
            ? 0.35
            : (tile.ore || 2500) < 1300
              ? 0.65
              : 1;
    const kind =
        (tile.kind === "ore" || tile.kind === "gem") && richness === 0
          ? "dirt"
          : tile.kind || "grass",
      surface =
        tile.surface ||
        (this.lastState?.mapId === "oasis" && kind === "dirt" ? "sand" : null),
      key = `${kind}/${variant}/${!!tile.bridge && !tile.bridgeId}/${richness}/${surface || ""}/${x % 8}/${y % 8}`;
    if (!this.tileCache.has(key)) {
      if (this.tileCache.size >= 1024)
        this.tileCache.delete(this.tileCache.keys().next().value);
      this.tileCache.set(
        key,
        makeTile(
          kind,
          variant,
          !!tile.bridge && !tile.bridgeId,
          richness,
          surface,
          this.terrainAtlas?.get(kind, surface),
          { x, y },
        ),
      );
    }
    return this.tileCache.get(key);
  }
  getSprite(
    type,
    ownerColor,
    faction = "allied",
    facing = 0,
    walk = 0,
    deployed = false,
    variant = null,
  ) {
    const def = BUILDINGS[type],
      artVariant =
        variant ||
        (type === "superweapon" && faction === "allied"
          ? "weatherControl"
          : type === "defenseTower" && faction === "soviet"
            ? "teslaCoil"
            : null),
      atlasSprite = this.atlas?.get(type, def, facing, artVariant);
    if (atlasSprite) return atlasSprite;
    const directions = INFANTRY.has(type) ? 8 : 32,
      angle =
        Math.round(
          ((((facing || 0) % TWO_PI) + TWO_PI) / TWO_PI) * directions,
        ) % directions,
      phase = walk ? 1 : 0;
    const key = def
      ? `b/${type}/${ownerColor}/${faction}`
      : `u/${type}/${ownerColor}/${faction}/${angle}/${phase}/${!!deployed}`;
    if (!this.spriteCache.has(key)) {
      const sprite = def
        ? makeBuilding(type, def.w, def.h, ownerColor, faction)
        : makeUnit(
            type,
            (angle / directions) * TWO_PI,
            ownerColor,
            faction,
            phase,
            deployed,
          );
      this.spriteCache.set(key, sprite);
    }
    return this.spriteCache.get(key);
  }
  pick(state, x, y) {
    for (let i = this.hitRegions.length - 1; i >= 0; i--) {
      const r = this.hitRegions[i];
      if (x < r.x || x > r.x + r.w || y < r.y || y > r.y + r.h) continue;
      const e = state.entities?.find((e) => e.id === r.id);
      if (!e || e.hp <= 0 || e.carrierId) continue;
      const sx = Math.floor((x - r.imageX) / r.scale),
        sy = Math.floor((y - r.imageY) / r.scale);
      if (
        sx >= 0 &&
        sy >= 0 &&
        sx < r.sprite.canvas.width &&
        sy < r.sprite.canvas.height
      ) {
        const alpha =
          r.sprite.alpha ||
          (r.sprite.alpha = r.sprite.canvas
            .getContext("2d")
            .getImageData(
              0,
              0,
              r.sprite.canvas.width,
              r.sprite.canvas.height,
            ).data);
        if (alpha[(sy * r.sprite.canvas.width + sx) * 4 + 3] > 24) return e;
      }
    }
    // Small sprites still have a forgiving screen-space hit target. Transparent
    // margins of a nearer vehicle must never steal clicks from visible infantry.
    const candidates = (state.entities || []).filter(
      (e) =>
        e.hp > 0 &&
        !e.carrierId &&
        e.kind === "unit" &&
        (e.owner === 0 || this.tileAt(state, e.x, e.y)?.visible),
    );
    let nearest = null,
      best = Infinity;
    for (const e of candidates) {
      const height =
          elevationAt(state, e.x, e.y, UNITS[e.type]?.movement) +
          (AIR.has(e.type) ? 3 : 0),
        p = this.worldToScreen(e.x, e.y, height),
        dy = INFANTRY.has(e.type) ? 13 : 20,
        dist = Math.hypot(x - p.x, y - (p.y - dy * this.camera.zoom)),
        limit =
          (INFANTRY.has(e.type) ? 12 : 20) * Math.max(0.7, this.camera.zoom);
      if (dist <= limit && dist < best) {
        nearest = e;
        best = dist;
      }
    }
    return nearest;
  }
  footprint(x, y, w, h, z = 0) {
    return [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ].map(([a, b]) => {
      const p = this.worldToScreen(a, b, z);
      return [p.x, p.y];
    });
  }
  groundCorners(x, y, tile) {
    return [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ].map(([dx, dy]) => {
      const p = this.worldToScreen(x + dx, y + dy, tileElevation(tile, dx, dy));
      return [p.x, p.y];
    });
  }
  drawCliff(x, y, tile) {
    if (!tile.height || tile.bridge) return;
    const ctx = this.ctx,
      z = this.camera.zoom,
      s = this.lastState;
    for (const [dx, dy, edge] of [
      [
        1,
        0,
        [
          [1, 0],
          [1, 1],
        ],
      ],
      [
        0,
        1,
        [
          [0, 1],
          [1, 1],
        ],
      ],
    ]) {
      const neighbor = this.tileAt(s, x + dx, y + dy);
      const top = edge.map(([a, b]) => tileElevation(tile, a, b));
      const bottom = edge.map(([a, b]) =>
        tileElevation(neighbor, a - dx, b - dy),
      );
      if (top.every((h, i) => h <= bottom[i] + 0.12)) continue;
      const project = (p, h) => {
        const q = this.worldToScreen(x + p[0], y + p[1], h);
        return [q.x, q.y];
      };
      const points = [
        project(edge[0], top[0]),
        project(edge[1], top[1]),
        project(edge[1], Math.min(top[1], bottom[1])),
        project(edge[0], Math.min(top[0], bottom[0])),
      ];
      const snow = tile.surface === "snow" || s.climate === "snow",
        sand = tile.surface === "sand";
      const fill = snow
        ? dx
          ? "#718590"
          : "#8e9ea6"
        : sand
          ? dx
            ? "#80664e"
            : "#a58962"
          : dx
            ? "#50584c"
            : "#737765";
      path(ctx, points, fill);
      ctx.save();
      path(ctx, points);
      ctx.clip();
      const texture = this.terrainAtlas.get("rock", "cliff");
      if (texture) {
        const left = Math.min(...points.map((p) => p[0])),
          topY = Math.min(...points.map((p) => p[1]));
        const width = Math.max(...points.map((p) => p[0])) - left,
          height = Math.max(...points.map((p) => p[1])) - topY;
        ctx.globalAlpha = 0.42;
        ctx.drawImage(
          texture,
          (x % 4) * (texture.width / 4),
          ((y % 2) * texture.height) / 2,
          texture.width / 4,
          texture.height / 2,
          left,
          topY,
          width,
          height,
        );
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      ctx.strokeStyle = snow ? "#e4eaed" : sand ? "#c7ad81" : "#9b9d82";
      ctx.lineWidth = 1.5 * z;
      ctx.beginPath();
      ctx.moveTo(...points[0]);
      ctx.lineTo(...points[1]);
      ctx.stroke();
      ctx.strokeStyle = "rgba(22,34,32,.22)";
      ctx.lineWidth = 0.6 * z;
      for (const f of [0.32, 0.65]) {
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1] * (1 - f) + points[3][1] * f);
        ctx.lineTo(points[1][0], points[1][1] * (1 - f) + points[2][1] * f);
        ctx.stroke();
      }
    }
  }
  drawShore(x, y, tile) {
    if (tile.kind === "water" || tile.bridge) return;
    const ctx = this.ctx,
      corners = this.groundCorners(x, y, tile);
    for (const [dx, dy, a, b] of [
      [0, -1, 0, 1],
      [1, 0, 1, 2],
      [0, 1, 2, 3],
      [-1, 0, 3, 0],
    ]) {
      if (this.tileAt(this.lastState, x + dx, y + dy)?.kind !== "water")
        continue;
      ctx.strokeStyle =
        tile.surface === "ice" || tile.surface === "snow"
          ? "#d0e5ec"
          : "#9fa88a";
      ctx.lineWidth = 2.7 * this.camera.zoom;
      ctx.beginPath();
      ctx.moveTo(...corners[a]);
      ctx.lineTo(...corners[b]);
      ctx.stroke();
    }
  }
  drawScenery(prop, state) {
    const t = this.tileAt(state, prop.x, prop.y),
      asset = this.atlas.assets.get(`scenery:${prop.type}`);
    if (!t || t.explored === false || !asset) return;
    const size =
      {
        pine: 84,
        snowPine: 88,
        trees: 94,
        rock: 78,
        snowRock: 82,
        sandRock: 85,
        cottage: 114,
        snowCottage: 114,
        ruin: 118,
      }[prop.type] || 80;
    const w = size * (prop.scale || 1) * this.camera.zoom,
      h = (w * asset.h) / asset.w;
    const p = this.worldToScreen(
      prop.x,
      prop.y,
      elevationAt(state, prop.x, prop.y),
    );
    if (
      p.x + w / 2 < 0 ||
      p.x - w / 2 > this.width ||
      p.y < -30 ||
      p.y - h > this.height
    )
      return;
    this.ctx.drawImage(
      asset.image,
      asset.x,
      asset.y,
      asset.w,
      asset.h,
      p.x - w / 2,
      p.y - h + 13 * this.camera.zoom,
      w,
      h,
    );
  }
  drawBridgeRail(segment) {
    const { x, y, axis, deck, pier } = segment,
      ctx = this.ctx,
      z = this.camera.zoom;
    const p = this.worldToScreen(x, y, deck),
      q = this.worldToScreen(
        x + (axis === "x" ? 1 : 0),
        y + (axis === "y" ? 1 : 0),
        deck,
      );
    const rail = 11 * z;
    // Steel lattice and stone piers follow the actual traversable bridge span.
    if (pier) {
      const base = this.worldToScreen(x, y, 0);
      path(
        ctx,
        [
          [p.x - 3 * z, p.y],
          [p.x + 4 * z, p.y],
          [base.x + 4 * z, base.y + 5 * z],
          [base.x - 3 * z, base.y + 5 * z],
        ],
        "#777c75",
        "#404c4b",
        0.6 * z,
      );
    }
    ctx.lineWidth = 2.5 * z;
    ctx.strokeStyle = "#535f5e";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + 1 * z);
    ctx.lineTo(q.x, q.y + 1 * z);
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x, p.y - rail);
    ctx.lineTo(q.x, q.y - rail);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
    ctx.lineWidth = 1.2 * z;
    ctx.strokeStyle = "#99aaa6";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - rail);
    ctx.lineTo(q.x, q.y - rail);
    ctx.moveTo(p.x, p.y - rail);
    ctx.lineTo(q.x, q.y);
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y - rail);
    ctx.stroke();
  }
  drawTerrain(state) {
    const ctx = this.ctx,
      zoom = this.camera.zoom,
      corners = [
        this.screenToWorld(-170, -200),
        this.screenToWorld(this.width + 170, -200),
        this.screenToWorld(-170, this.height + 200),
        this.screenToWorld(this.width + 170, this.height + 200),
      ];
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const minX = clamp(
        Math.floor(Math.min(...corners.map((c) => c.x))) - 2,
        0,
        state.width - 1,
      ),
      maxX = clamp(
        Math.ceil(Math.max(...corners.map((c) => c.x))) + 2,
        0,
        state.width - 1,
      ),
      minY = clamp(
        Math.floor(Math.min(...corners.map((c) => c.y))) - 2,
        0,
        state.height - 1,
      ),
      maxY = clamp(
        Math.ceil(Math.max(...corners.map((c) => c.y))) + 2,
        0,
        state.height - 1,
      );
    this.visibleTiles = [];
    for (let sum = minX + minY; sum <= maxX + maxY; sum++)
      for (
        let x = Math.max(minX, sum - maxY);
        x <= Math.min(maxX, sum - minY);
        x++
      ) {
        const y = sum - x,
          t = state.tiles?.[y * state.width + x];
        if (!t) continue;
        const p = this.worldToScreen(x, y, t.height || 0);
        if (
          p.x < -100 ||
          p.x > this.width + 100 ||
          p.y < -120 ||
          p.y > this.height + 80
        )
          continue;
        this.visibleTiles.push({ x, y, t, p });
        this.drawCliff(x, y, t);
        if (t.explored === false) {
          path(ctx, this.groundCorners(x, y, t), "#111b1b");
          continue;
        }
        const groundColor =
          {
            snow: "#d3dfe4",
            ice: "#a4c4d3",
            marsh: "#667059",
            sand: "#b7a083",
            concrete: "#7b827c",
            urban: "#747b75",
            quay: "#77847c",
            warehouse: "#827e6f",
            runway: "#4c5759",
          }[t.surface] ||
          {
            grass: "#657555",
            dirt: "#8b8064",
            road: "#555b56",
            water: "#385f6a",
            rock: "#70766a",
            ore: "#716f50",
            gem: "#5f6b60",
          }[t.kind] ||
          "#657555";
        path(ctx, this.groundCorners(x, y, t), groundColor);
        if (t.ramp) {
          const [a, b, , d] = this.groundCorners(x, y, t),
            u = [b[0] - a[0], b[1] - a[1]],
            v = [d[0] - a[0], d[1] - a[1]];
          const aa = (u[0] - v[0]) / 128,
            bb = (u[1] - v[1]) / 128,
            cc = (u[0] + v[0]) / 64,
            dd = (u[1] + v[1]) / 64;
          ctx.save();
          ctx.transform(
            aa,
            bb,
            cc,
            dd,
            a[0] - aa * 68 - cc * 4,
            a[1] - bb * 68 - dd * 4,
          );
          ctx.drawImage(this.getTile(t, x, y), 0, 0);
          ctx.restore();
        } else
          ctx.drawImage(
            this.getTile(t, x, y),
            p.x - 34.51 * zoom,
            p.y - 2.27 * zoom,
            69.02 * zoom,
            50.75 * zoom,
          );
        this.drawShore(x, y, t);
        if (t.kind === "water" && !t.bridge && (x * 31 + y * 13) % 11 === 0) {
          ctx.globalAlpha =
            0.16 + 0.06 * Math.sin(this.animationTime * 1.7 + x);
          ctx.strokeStyle = "#b5d7d2";
          ctx.lineWidth = 0.6 * zoom;
          ctx.beginPath();
          ctx.moveTo(p.x - 7 * zoom, p.y + 16 * zoom);
          ctx.lineTo(p.x + 6 * zoom, p.y + 18 * zoom);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
  }
  drawRock(x, y, t) {
    const ctx = this.ctx,
      p = this.worldToScreen(x + 0.5, y + 0.5, t.height || 0),
      z = this.camera.zoom,
      r = seeded(x * 177 + y * 589 + 7);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(z, z);
    ctx.fillStyle = "rgba(17,29,24,.25)";
    ctx.beginPath();
    ctx.ellipse(2, 2, 23, 11, 0, 0, 6.29);
    ctx.fill();
    const peak = -15 - r() * 16,
      shift = (r() - 0.5) * 9;
    path(
      ctx,
      [
        [-24, 1],
        [-18, -12],
        [shift, peak],
        [21, -14],
        [25, 4],
        [4, 13],
      ],
      "#657369",
      "#3b5048",
    );
    path(
      ctx,
      [
        [-18, -12],
        [shift, peak],
        [21, -14],
        [3, -6],
      ],
      "#8a9280",
    );
    path(
      ctx,
      [
        [3, -6],
        [21, -14],
        [25, 4],
        [4, 13],
      ],
      "#53665b",
    );
    ctx.strokeStyle = "#a0a18a";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(-17, -10);
    ctx.lineTo(-1, -4);
    ctx.lineTo(13, -9);
    ctx.stroke();
    ctx.restore();
  }
  drawShadow(e, state) {
    const ctx = this.ctx,
      def = BUILDINGS[e.type],
      z = this.camera.zoom,
      height = elevationAt(state, e.x, e.y, UNITS[e.type]?.movement);
    if (def) {
      const pts = this.footprint(
        e.x + 0.15,
        e.y + 0.15,
        def.w,
        def.h,
        height,
      ).map(([x, y]) => [x + 12 * z, y + 3 * z]);
      path(ctx, pts, "rgba(16,28,26,.23)");
    } else {
      const p = this.worldToScreen(e.x, e.y, height);
      ctx.fillStyle = AIR.has(e.type)
        ? "rgba(12,26,26,.17)"
        : "rgba(17,28,23,.30)";
      ctx.beginPath();
      ctx.ellipse(
        p.x + 2 * z,
        p.y + 2 * z,
        (INFANTRY.has(e.type) ? 7 : 20) * z,
        (INFANTRY.has(e.type) ? 3 : 8) * z,
        0,
        0,
        6.29,
      );
      ctx.fill();
    }
  }
  drawHealth(e, state, sprite, screen, ui, selected) {
    if (!(selected || ui.showHealth || e.hp < e.maxHp)) return;
    const ctx = this.ctx,
      z = this.camera.zoom,
      building = BUILDINGS[e.type],
      ratio = clamp(e.hp / (e.maxHp || 1), 0, 1),
      width = (building ? 58 : INFANTRY.has(e.type) ? 22 : 34) * z;
    const x =
        screen.x +
        (building ? (building.w - building.h) * 16 * z : 0) -
        width / 2,
      y =
        sprite.source === "atlas"
          ? screen.y - sprite.oy * z - 8 * z
          : screen.y -
            (building
              ? 55 + Math.min(building.w, 3) * 10
              : AIR.has(e.type)
                ? 26
                : INFANTRY.has(e.type)
                  ? 30
                  : 37) *
              z;
    ctx.fillStyle = "#1d2827";
    ctx.fillRect(x - 1, y - 1, width + 2, 5 * z + 2);
    ctx.fillStyle =
      ratio > 0.6 ? "#9dbb65" : ratio > 0.3 ? "#c8ac5c" : "#c3654c";
    ctx.fillRect(x, y, width * ratio, 4 * z);
    if ((e.progress ?? 1) < 1) {
      ctx.fillStyle = "#272b27";
      ctx.fillRect(x - 1, y + 7 * z, width + 2, 4 * z);
      ctx.fillStyle = "#c3b477";
      ctx.fillRect(x, y + 8 * z, width * e.progress, 2 * z);
    }
    if (e.veteran) {
      ctx.fillStyle = "#e5d08b";
      ctx.font = `bold ${10 * z}px Arial`;
      ctx.fillText("★", x + width + 3 * z, y + 5 * z);
    }
  }
  drawEntity(e, state, ui, selected, remembered = false) {
    const ctx = this.ctx,
      def = BUILDINGS[e.type],
      zoom = this.camera.zoom,
      faction = def
        ? e.createdFaction || this.faction(state, e.owner)
        : this.faction(state, e.owner),
      color = this.teamColor(state, e.owner),
      moving = !!(
        e.path?.length ||
        (e.order &&
          ["move", "attackMove", "harvest", "return"].includes(e.order.type))
      ),
      walk = moving ? Math.floor(this.animationTime * 8 + e.id) % 2 : 0;
    const variant =
      e.missionRole === "chronosphere"
        ? "chronoSphere"
        : e.missionRole === "weather"
          ? "weatherControl"
          : ["station", "railControl"].includes(e.missionRole)
            ? "railStation"
            : null;
    const elevation =
        elevationAt(state, e.x, e.y, UNITS[e.type]?.movement) +
        (AIR.has(e.type) ? 3 : 0),
      screen = this.worldToScreen(e.x, e.y, elevation),
      sprite = this.getSprite(
        e.type,
        color,
        faction,
        e.facing || 0,
        walk,
        e.deployed,
        variant,
      );
    const x = screen.x - sprite.ox * zoom,
      y = screen.y - sprite.oy * zoom,
      w = (sprite.width || sprite.canvas.width) * zoom,
      h = (sprite.height || sprite.canvas.height) * zoom;
    if (x + w < 0 || x > this.width || y + h < 0 || y > this.height) return;
    if (sprite.source === "atlas" && !selected && !def) {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 1.5 * zoom;
      ctx.beginPath();
      ctx.ellipse(
        screen.x,
        screen.y + 2 * zoom,
        sprite.width * 0.31 * zoom,
        (INFANTRY.has(e.type) ? 4 : 10) * zoom,
        0,
        0,
        6.29,
      );
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (selected) {
      if (def)
        path(
          ctx,
          this.footprint(
            e.x - 0.05,
            e.y - 0.05,
            def.w + 0.1,
            def.h + 0.1,
            elevation,
          ),
          "rgba(189,205,146,.10)",
          "#c5d5a3",
          1,
        );
      else {
        ctx.strokeStyle = "#c5d5a3";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(
          screen.x,
          screen.y + 2 * zoom,
          INFANTRY.has(e.type) ? 10 * zoom : 25 * zoom,
          INFANTRY.has(e.type) ? 5 * zoom : 12 * zoom,
          0,
          0,
          6.29,
        );
        ctx.stroke();
      }
    }
    ctx.save();
    if (sprite.source === "atlas") {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    }
    if (remembered) ctx.globalAlpha = 0.65;
    if ((e.progress ?? 1) < 1) {
      const p = e.progress || 0;
      ctx.globalAlpha = 0.48 + p * 0.52;
      ctx.filter = "saturate(.35)";
    }
    ctx.drawImage(
      sprite.canvas,
      x,
      y +
        (sprite.source === "atlas" && moving && !def
          ? Math.sin(this.animationTime * 13 + e.id) * 0.4 * zoom
          : 0),
      w,
      h,
    );
    ctx.restore();
    if (sprite.source === "atlas" && def) {
      const corner = this.footprint(e.x, e.y, def.w, def.h, elevation)[3];
      ctx.strokeStyle = "#d2d1b5";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(corner[0] + 5 * zoom, corner[1]);
      ctx.lineTo(corner[0] + 5 * zoom, corner[1] - 24 * zoom);
      ctx.stroke();
      path(
        ctx,
        [
          [corner[0] + 5 * zoom, corner[1] - 24 * zoom],
          [corner[0] + 18 * zoom, corner[1] - 22 * zoom],
          [corner[0] + 16 * zoom, corner[1] - 16 * zoom],
          [corner[0] + 5 * zoom, corner[1] - 17 * zoom],
        ],
        color,
      );
    }
    if (
      sprite.source !== "atlas" &&
      ["tank", "mammoth", "destroyer"].includes(e.type)
    ) {
      const target = state.entities?.find((t) => t.id === e.targetId),
        facing = target
          ? angleBetween(e.x, e.y, target.x, target.y)
          : (e.turretFacing ?? e.facing ?? 0);
      drawTurret(
        ctx,
        screen.x,
        screen.y,
        facing,
        color,
        zoom,
        e.type === "mammoth",
      );
    }
    if ((e.muzzle || 0) > 0) {
      const tip = this.worldToScreen(
          e.x + Math.cos(e.facing || 0) * 0.6,
          e.y + Math.sin(e.facing || 0) * 0.6,
          elevation + 1,
        ),
        r = INFANTRY.has(e.type) ? 3 : 5;
      ctx.fillStyle = "#ffe8ae";
      path(
        ctx,
        [
          [tip.x - r * zoom, tip.y],
          [tip.x, tip.y - r * zoom],
          [tip.x + r * 1.8 * zoom, tip.y],
          [tip.x, tip.y + r * zoom],
        ],
        "#ffe8ae",
      );
    }
    if (
      sprite.source === "atlas" &&
      moving &&
      !def &&
      !AIR.has(e.type) &&
      this.tileAt(state, e.x, e.y)?.kind !== "water"
    ) {
      for (let i = 0; i < 3; i++) {
        const age = (this.animationTime * 0.8 + i * 0.33 + e.id * 0.09) % 1,
          dust = this.worldToScreen(
            e.x - Math.cos(e.facing || 0) * (0.5 + age * 0.4),
            e.y - Math.sin(e.facing || 0) * (0.5 + age * 0.4),
            elevation,
          );
        ctx.fillStyle = `rgba(167,158,126,${(1 - age) * 0.14})`;
        ctx.beginPath();
        ctx.ellipse(
          dust.x,
          dust.y - age * 5 * zoom,
          (2 + age * 4) * zoom,
          (1 + age * 2) * zoom,
          0,
          0,
          6.29,
        );
        ctx.fill();
      }
    }
    if (e.type === "miner" && (e.cargo || 0) > 0) {
      ctx.fillStyle = "#c8b05f";
      ctx.fillRect(
        screen.x - 8 * zoom,
        screen.y - 20 * zoom,
        Math.min(16, (e.cargo || 0) / 45) * zoom,
        3 * zoom,
      );
    }
    if (e.type === "helicopter" && sprite.source !== "atlas") {
      ctx.save();
      ctx.translate(screen.x, screen.y - 19 * zoom);
      ctx.scale(zoom, zoom);
      ctx.rotate(this.animationTime * 38);
      ctx.strokeStyle = "rgba(44,62,61,.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-35, 0);
      ctx.lineTo(35, 0);
      ctx.moveTo(0, -13);
      ctx.lineTo(0, 13);
      ctx.stroke();
      ctx.restore();
    }
    if (def && (e.progress ?? 1) < 1) this.drawScaffold(e, def, elevation);
    if (
      def?.requiresPower &&
      state.players?.find((p) => p.id === e.owner)?.power <
        state.players?.find((p) => p.id === e.owner)?.demand
    ) {
      ctx.fillStyle = "#e6bd69";
      ctx.font = `bold ${16 * zoom}px sans-serif`;
      ctx.fillText("ϟ", screen.x, screen.y - 70 * zoom);
    }
    if (!remembered) {
      this.drawHealth(e, state, sprite, screen, ui, selected);
      this.hitRegions.push({
        id: e.id,
        x,
        y,
        w,
        h,
        imageX: x,
        imageY: y,
        scale: zoom / (sprite.pixelRatio || 1),
        sprite,
      });
    }
    // Atmospheric smoke is view-only and generated from the simulation clock.
    if (
      def &&
      ["powerPlant", "refinery", "warFactory"].includes(e.type) &&
      (e.progress ?? 1) >= 1 &&
      e.hp > 0
    ) {
      const smoke = this.worldToScreen(e.x + def.w - 0.4, e.y + 0.4, elevation);
      for (let i = 0; i < 3; i++) {
        const age = (this.animationTime * 0.35 + i * 0.33 + e.id * 0.03) % 1;
        ctx.fillStyle = `rgba(173,182,164,${(1 - age) * 0.13})`;
        ctx.beginPath();
        ctx.ellipse(
          smoke.x + age * 18 * zoom,
          smoke.y - (48 + age * 45) * zoom,
          (3 + age * 8) * zoom,
          (4 + age * 6) * zoom,
          0,
          0,
          6.29,
        );
        ctx.fill();
      }
    }
  }
  drawScaffold(e, def, elevation) {
    const ctx = this.ctx,
      z = this.camera.zoom,
      pts = this.footprint(e.x, e.y, def.w, def.h, elevation);
    ctx.strokeStyle = "#b2a16b";
    ctx.lineWidth = 1.3 * z;
    for (const [x, y] of pts) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - 38 * z);
      ctx.stroke();
    }
    path(
      ctx,
      pts.map(([x, y]) => [x, y - 38 * z]),
      null,
      "#897b51",
      1 * z,
    );
    for (let i = 0; i < 4; i++) {
      const a = pts[i],
        b = pts[(i + 1) % 4];
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1] - 38 * z);
      ctx.stroke();
    }
  }
  drawProjectiles(state) {
    const ctx = this.ctx,
      z = this.camera.zoom;
    for (const p of state.projectiles || []) {
      if (
        !this.tileAt(state, p.x, p.y)?.visible &&
        !(p.strategic && p.owner === 0)
      )
        continue;
      const screen = this.worldToScreen(
          p.x,
          p.y,
          elevationAt(state, p.x, p.y) + 1,
        ),
        tx = p.targetX ?? p.x,
        ty = p.targetY ?? p.y,
        target = this.worldToScreen(tx, ty, elevationAt(state, tx, ty) + 1),
        angle = Math.atan2(target.y - screen.y, target.x - screen.x),
        laser = p.kind === "laser";
      if (p.strategic) {
        const radius = (p.splash || 5) * 24 * z;
        ctx.save();
        ctx.strokeStyle = p.kind === "storm" ? "#a9e7e6" : "#edbe78";
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5 + 0.25 * Math.sin(this.animationTime * 6);
        ctx.beginPath();
        ctx.ellipse(target.x, target.y, radius, radius * 0.5, 0, 0, 6.29);
        ctx.stroke();
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.ellipse(
          target.x,
          target.y,
          radius * 0.75,
          radius * 0.375,
          0,
          0,
          6.29,
        );
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        ctx.font = 'bold 11px "Microsoft YaHei",sans-serif';
        ctx.textAlign = "center";
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fillText(
          `${p.kind === "storm" ? "雷暴" : "核打击"} · ${Math.ceil(p.life)}s`,
          target.x,
          target.y - radius * 0.5 - 10,
        );
        ctx.restore();
        continue;
      }
      ctx.save();
      ctx.strokeStyle = laser
        ? "#b9f2df"
        : p.kind === "missile" || p.kind === "rocket"
          ? "#edc187"
          : "#e7d5a1";
      ctx.lineWidth = (laser ? 2 : 1.6) * z;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = laser ? 7 : 3;
      ctx.beginPath();
      ctx.moveTo(
        screen.x - Math.cos(angle) * (laser ? 18 : 7) * z,
        screen.y - Math.sin(angle) * (laser ? 18 : 7) * z,
      );
      ctx.lineTo(screen.x, screen.y);
      ctx.stroke();
      ctx.restore();
    }
  }
  drawEffects(state) {
    const ctx = this.ctx,
      z = this.camera.zoom;
    for (const [i, e] of (state.effects || []).entries()) {
      if (!this.tileAt(state, e.x, e.y)?.visible) continue;
      const s = this.worldToScreen(
          e.x,
          e.y,
          elevationAt(state, e.x, e.y) + 0.4,
        ),
        fade = clamp((e.life ?? 0.5) / (e.maxLife || 1), 0, 1),
        age = 1 - fade,
        kind = e.kind || "hit";
      if (kind === "chrono") {
        ctx.strokeStyle = `rgba(144,221,217,${fade})`;
        ctx.lineWidth = 2 * z;
        ctx.beginPath();
        ctx.ellipse(
          s.x,
          s.y,
          10 * z + age * 20 * z,
          15 * z + age * 12 * z,
          0,
          0,
          6.29,
        );
        ctx.stroke();
      } else if (kind === "storm") {
        ctx.save();
        const radius = (e.size || 5) * 22 * z;
        ctx.globalAlpha = fade * 0.34;
        const cloud = ctx.createRadialGradient(
          s.x,
          s.y - 80 * z,
          3,
          s.x,
          s.y - 80 * z,
          radius,
        );
        cloud.addColorStop(0, "#aecbd6");
        cloud.addColorStop(0.6, "#344e66");
        cloud.addColorStop(1, "#20384b00");
        ctx.fillStyle = cloud;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y - 80 * z, radius, radius * 0.55, 0, 0, 6.29);
        ctx.fill();
        ctx.globalAlpha = fade;
        const random = seeded((e.id || i) * 177 + Math.floor(age * 16));
        for (let bolt = 0; bolt < 5; bolt++) {
          const endX = s.x + (random() - 0.5) * radius * 1.6,
            endY = s.y + (random() - 0.5) * radius * 0.65;
          ctx.beginPath();
          ctx.moveTo(endX - 20 * z, endY - 150 * z);
          for (let j = 1; j < 6; j++)
            ctx.lineTo(
              endX + (random() - 0.5) * 20 * z,
              endY - 150 * z + j * 30 * z,
            );
          ctx.strokeStyle = "#d5ffff";
          ctx.lineWidth = 2 * z;
          ctx.shadowColor = "#6ccfff";
          ctx.shadowBlur = 9 * z;
          ctx.stroke();
        }
        ctx.restore();
      } else if (
        kind === "explosion" ||
        kind === "death" ||
        kind === "nuke" ||
        kind === "nuclear"
      ) {
        const r =
          kind === "nuke" || kind === "nuclear"
            ? 110
            : kind === "death"
              ? 28
              : 20;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.scale(z, z);
        ctx.globalAlpha = fade;
        ctx.strokeStyle = "#e2bc79";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 5, (8 + age * r) * 1.25, 4 + age * r * 0.45, 0, 0, 6.29);
        ctx.stroke();
        for (let j = 0; j < 8; j++) {
          const a = j * 0.785 + (i % 3),
            dist = age * r * 0.55,
            rad = (1 - age * 0.65) * (j % 2 ? 7 : 10);
          ctx.fillStyle =
            j % 3 === 0 ? "#efcc8c" : j % 3 === 1 ? "#d78342" : "#695443";
          ctx.beginPath();
          ctx.arc(
            Math.cos(a) * dist,
            Math.sin(a) * dist * 0.7 - age * 12,
            rad,
            0,
            6.29,
          );
          ctx.fill();
        }
        ctx.restore();
      } else if (kind === "repair" || kind === "heal") {
        ctx.fillStyle = `rgba(152,213,157,${fade})`;
        ctx.font = `bold ${14 * z}px Arial`;
        ctx.fillText("+", s.x, s.y - age * 22 * z);
      } else {
        ctx.strokeStyle = `rgba(241,207,137,${fade})`;
        ctx.lineWidth = 1.3 * z;
        for (let j = 0; j < 5; j++) {
          const a = j * 1.256 + i;
          ctx.beginPath();
          ctx.moveTo(s.x + Math.cos(a) * 3 * z, s.y + Math.sin(a) * 3 * z);
          ctx.lineTo(
            s.x + Math.cos(a) * (6 + age * 9) * z,
            s.y + Math.sin(a) * (6 + age * 9) * z,
          );
          ctx.stroke();
        }
      }
    }
  }
  drawPlacement(state, placement) {
    const def = BUILDINGS[placement.type];
    if (!def) return;
    const ctx = this.ctx,
      x = Math.floor(placement.x),
      y = Math.floor(placement.y),
      height = this.tileAt(state, x, y)?.height || 0,
      z = this.camera.zoom;
    for (let yy = 0; yy < def.h; yy++)
      for (let xx = 0; xx < def.w; xx++)
        path(
          ctx,
          this.footprint(x + xx, y + yy, 1, 1, height),
          placement.valid ? "rgba(165,194,112,.20)" : "rgba(212,105,85,.24)",
          placement.valid ? "#bdd392" : "#e49c82",
          0.8,
        );
    const s = this.worldToScreen(x, y, height),
      sprite = this.getSprite(
        placement.type,
        placement.valid ? "#95b476" : "#b66e58",
        this.faction(state, 0),
      );
    ctx.save();
    ctx.globalAlpha = 0.48;
    ctx.drawImage(
      sprite.canvas,
      s.x - sprite.ox * z,
      s.y - sprite.oy * z,
      (sprite.width || sprite.canvas.width) * z,
      (sprite.height || sprite.canvas.height) * z,
    );
    ctx.restore();
  }
  drawFog() {
    const ctx = this.ctx;
    for (const { x, y, t } of this.visibleTiles || []) {
      if (t.visible !== false && t.explored !== false) continue;
      path(
        ctx,
        this.footprint(x, y, 1, 1, t.height || 0),
        t.explored === false ? "#111b1b" : "rgba(15,24,24,.48)",
      );
    }
  }
  drawMissionMarkers(state) {
    const ctx = this.ctx,
      markers = state.mission?.markers || [],
      done = new Set(
        (state.objectives || []).filter((o) => o.done).map((o) => o.id),
      );
    for (const marker of markers) {
      if (
        done.has(marker.objectiveId) ||
        !Number.isFinite(marker.x) ||
        !Number.isFinite(marker.y)
      )
        continue;
      const p = this.worldToScreen(
        marker.x,
        marker.y,
        this.tileAt(state, marker.x, marker.y)?.height || 0,
      );
      if (
        p.x < 30 ||
        p.x > this.width - 30 ||
        p.y < 50 ||
        p.y > this.height - 20
      )
        continue;
      const pulse = 0.5 + 0.5 * Math.sin(this.animationTime * 2.3),
        r = 8 + pulse * 2;
      ctx.save();
      ctx.strokeStyle = "#f1cf7f";
      ctx.fillStyle = "rgba(38,38,24,.85)";
      ctx.lineWidth = 1.5;
      path(
        ctx,
        [
          [p.x, p.y - r - 24],
          [p.x + r, p.y - 24],
          [p.x, p.y + r - 24],
          [p.x - r, p.y - 24],
        ],
        ctx.fillStyle,
        ctx.strokeStyle,
        1.5,
      );
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 14);
      ctx.lineTo(p.x, p.y - 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, r + 5, (r + 5) * 0.5, 0, 0, 6.29);
      ctx.stroke();
      const label = String(marker.label || "行动目标");
      ctx.font = '11px "Microsoft YaHei",sans-serif';
      const textWidth = Math.min(225, ctx.measureText(label).width + 18),
        x = clamp(p.x - textWidth / 2, 4, this.width - textWidth - 4);
      ctx.fillStyle = "rgba(14,24,22,.92)";
      ctx.fillRect(x, p.y - 59, textWidth, 22);
      ctx.fillStyle = "#eedbad";
      ctx.textAlign = "center";
      ctx.fillText(label, x + textWidth / 2, p.y - 44, textWidth - 10);
      ctx.restore();
    }
  }
  render(state, ui = {}, dt = 0.016) {
    if (!state?.tiles) return;
    if (
      (this.canvas.clientWidth &&
        Math.abs(this.canvas.clientWidth - this.width) > 1) ||
      (this.canvas.clientHeight &&
        Math.abs(this.canvas.clientHeight - this.height) > 1)
    )
      this.resize();
    const key = `${state.mapId}/${state.missionId}/${state.width}/${state.height}`;
    if (this.lastState !== state) this.rememberedBuildings.clear();
    if (this.lastWorldKey !== key) {
      this.rememberedBuildings.clear();
      this.tileCache.clear();
      if (this.lastWorldKey !== null) this.centered = false;
      this.lastWorldKey = key;
    }
    this.lastState = state;
    if (!this.centered) {
      const home =
        (state.entities || []).find(
          (e) =>
            e.owner === 0 &&
            (e.type === "mcv" || e.type === "constructionYard"),
        ) || (state.entities || []).find((e) => e.owner === 0);
      this.centerOn(
        home?.x ?? state.width * 0.5,
        home?.y ?? state.height * 0.5,
      );
    }
    this.animationTime = state.time ?? this.animationTime + dt;
    this.frameCount++;
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.fillStyle = "#172221";
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.imageSmoothingEnabled = false;
    this.hitRegions = [];
    this.drawTerrain(state);
    const raw = ui.selection ?? state.selectedIds ?? [],
      selection =
        raw instanceof Set ? raw : new Set(Array.isArray(raw) ? raw : []),
      renderables = [];
    for (const { x, y, t } of this.visibleTiles || []) {
      if (t.kind === "rock" && t.explored !== false)
        renderables.push({ kind: "rock", x, y, t, depth: x + y + 1 });
      if (t.height > 0 && t.explored !== false && !t.bridge)
        renderables.push({ kind: "cliff", x, y, t, depth: x + y + 1.99 });
    }
    for (const prop of state.props || [])
      if (this.tileAt(state, prop.x, prop.y)?.explored !== false)
        renderables.push({
          kind: "scenery",
          prop,
          depth: prop.x + prop.y + 0.4,
        });
    for (const bridge of state.bridges || []) {
      const n = bridge.axis === "x" ? bridge.w : bridge.h;
      for (let i = 0; i < n; i++)
        for (const side of [0, 1]) {
          const x = bridge.x + (bridge.axis === "x" ? i : side * bridge.w),
            y = bridge.y + (bridge.axis === "y" ? i : side * bridge.h);
          const tx = Math.min(bridge.x + bridge.w - 0.5, x + 0.1),
            ty = Math.min(bridge.y + bridge.h - 0.5, y + 0.1);
          if (this.tileAt(state, tx, ty)?.explored === false) continue;
          renderables.push({
            kind: "bridgeRail",
            x,
            y,
            axis: bridge.axis,
            deck: bridge.deck,
            pier: i % 4 === 0,
            depth: x + y + 0.5,
          });
        }
    }
    const present = new Set();
    for (const e of state.entities || []) {
      if (e.hp <= 0 || e.carrierId) continue;
      present.add(e.id);
      const def = BUILDINGS[e.type],
        tx = e.x + (def ? def.w * 0.5 : 0),
        ty = e.y + (def ? def.h * 0.5 : 0),
        visible =
          e.owner === 0 || this.tileAt(state, tx, ty)?.visible !== false;
      if (visible) {
        if (def) this.rememberedBuildings.set(e.id, { ...e, queue: undefined });
        renderables.push({
          kind: "entity",
          e,
          depth:
            e.x +
            e.y +
            (def ? (def.w + def.h) * 0.5 : 0) +
            (AIR.has(e.type) ? 8 : 0),
        });
      } else if (def && this.rememberedBuildings.has(e.id)) {
        const remembered = this.rememberedBuildings.get(e.id);
        renderables.push({
          kind: "entity",
          e: remembered,
          remembered: true,
          depth: remembered.x + remembered.y + (def.w + def.h) * 0.5,
        });
      }
    }
    for (const [id, e] of this.rememberedBuildings)
      if (!present.has(id)) {
        const def = BUILDINGS[e.type];
        if (this.tileAt(state, e.x + def.w * 0.5, e.y + def.h * 0.5)?.visible)
          this.rememberedBuildings.delete(id);
        else
          renderables.push({
            kind: "entity",
            e,
            remembered: true,
            depth: e.x + e.y + (def.w + def.h) * 0.5,
          });
      }
    renderables.sort(
      (a, b) => a.depth - b.depth || (a.e?.id ?? 0) - (b.e?.id ?? 0),
    );
    for (const r of renderables)
      if (r.kind === "entity") this.drawShadow(r.e, state);
    for (const r of renderables) {
      if (r.kind === "rock") this.drawRock(r.x, r.y, r.t);
      else if (r.kind === "cliff") this.drawCliff(r.x, r.y, r.t);
      else if (r.kind === "scenery") this.drawScenery(r.prop, state);
      else if (r.kind === "bridgeRail") this.drawBridgeRail(r);
      else
        this.drawEntity(
          r.e,
          state,
          ui,
          selection.has(r.e.id) || !!r.e.selected,
          r.remembered,
        );
    }
    this.drawProjectiles(state);
    this.drawEffects(state);
    this.drawFog();
    this.drawMissionMarkers(state);
    if (ui.placement) this.drawPlacement(state, ui.placement);
    if (ui.selectionBox) {
      const b = ui.selectionBox,
        x1 = b.x1 ?? b.x ?? 0,
        y1 = b.y1 ?? b.y ?? 0,
        x2 = b.x2 ?? x1 + (b.w || 0),
        y2 = b.y2 ?? y1 + (b.h || 0);
      ctx.fillStyle = "rgba(192,209,156,.08)";
      ctx.strokeStyle = "#c8d7a6";
      ctx.lineWidth = 1;
      ctx.fillRect(
        Math.min(x1, x2),
        Math.min(y1, y2),
        Math.abs(x2 - x1),
        Math.abs(y2 - y1),
      );
      ctx.strokeRect(
        Math.min(x1, x2) + 0.5,
        Math.min(y1, y2) + 0.5,
        Math.abs(x2 - x1),
        Math.abs(y2 - y1),
      );
    }
  }
  drawMinimap(canvas, state) {
    if (!state?.tiles) return;
    const rect = canvas.getBoundingClientRect(),
      width = Math.round(rect.width || canvas.width || 200),
      height = Math.round(rect.height || canvas.height || 140),
      dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#101b19";
    ctx.fillRect(0, 0, width, height);
    const scaleX = width / state.width,
      scaleY = height / state.height,
      offsetX = 0,
      offsetY = 0;
    this.minimapTransform = {
      x: offsetX,
      y: offsetY,
      scaleX,
      scaleY,
      width,
      height,
    };
    const colors = {
      grass: "#5d7151",
      dirt: "#8b8065",
      road: "#9c9e8b",
      water: "#3a626f",
      rock: "#7e8476",
      ore: "#c7af58",
      gem: "#a582aa",
    };
    for (let y = 0; y < state.height; y++)
      for (let x = 0; x < state.width; x++) {
        const t = state.tiles[y * state.width + x];
        if (!t || t.explored === false) continue;
        ctx.globalAlpha = t.visible === false ? 0.45 : 1;
        ctx.fillStyle = tacticalColor(t);
        ctx.fillRect(
          offsetX + x * scaleX,
          offsetY + y * scaleY,
          Math.ceil(scaleX),
          Math.ceil(scaleY),
        );
      }
    ctx.globalAlpha = 1;
    for (const e of state.entities || []) {
      if (
        e.hp <= 0 ||
        e.carrierId ||
        (e.owner !== 0 && this.tileAt(state, e.x, e.y)?.visible === false)
      )
        continue;
      const d = BUILDINGS[e.type];
      ctx.fillStyle = this.teamColor(state, e.owner);
      ctx.fillRect(
        offsetX + e.x * scaleX,
        offsetY + e.y * scaleY,
        Math.max(2, (d?.w || 1) * scaleX),
        Math.max(2, (d?.h || 1) * scaleY),
      );
    }
    const corners = [
      [0, 0],
      [this.width, 0],
      [this.width, this.height],
      [0, this.height],
    ].map(([x, y]) => {
      const p = this.screenToWorld(x, y);
      return [offsetX + p.x * scaleX, offsetY + p.y * scaleY];
    });
    path(ctx, corners, null, "#d1d4aa", 1);
    ctx.strokeStyle = "#5f6d5a";
    ctx.strokeRect(
      offsetX - 0.5,
      offsetY - 0.5,
      state.width * scaleX + 1,
      state.height * scaleY + 1,
    );
  }
  refreshIcons() {
    for (const [canvas, { type, faction }] of this.iconTargets) {
      if (canvas.isConnected === false) {
        this.iconTargets.delete(canvas);
        continue;
      }
      this.drawIcon(canvas, type, faction);
    }
  }
  drawIcon(canvas, type, faction = "allied") {
    for (const target of this.iconTargets.keys())
      if (target.isConnected === false) this.iconTargets.delete(target);
    const previous = this.iconTargets.get(canvas),
      rect = canvas.getBoundingClientRect(),
      w = Math.round(rect.width || previous?.width || canvas.width || 96),
      h = Math.round(rect.height || previous?.height || canvas.height || 72),
      dpr = Math.min(2, window.devicePixelRatio || 1);
    this.iconTargets.set(canvas, { type, faction, width: w, height: h });
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const sprite = this.getSprite(
        type,
        FACTIONS[faction]?.color || TEAM_COLORS[0],
        faction,
        -0.4,
      ),
      s = sprite.canvas;
    if (!sprite.bounds) {
      const pixels = s
        .getContext("2d")
        .getImageData(0, 0, s.width, s.height).data;
      let x0 = s.width,
        y0 = s.height,
        x1 = 0,
        y1 = 0;
      for (let y = 0; y < s.height; y++)
        for (let x = 0; x < s.width; x++)
          if (pixels[(y * s.width + x) * 4 + 3] > 20) {
            x0 = Math.min(x0, x);
            y0 = Math.min(y0, y);
            x1 = Math.max(x1, x);
            y1 = Math.max(y1, y);
          }
      sprite.bounds = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    }
    const b = sprite.bounds,
      scale = Math.min((w - 8) / b.w, (h - 6) / b.h);
    ctx.imageSmoothingEnabled = sprite.source === "atlas";
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      s,
      b.x,
      b.y,
      b.w,
      b.h,
      (w - b.w * scale) / 2,
      (h - b.h * scale) / 2,
      b.w * scale,
      b.h * scale,
    );
    if (sprite.source !== "atlas" && ["tank", "mammoth"].includes(type)) {
      const anchorX = (w - b.w * scale) / 2 + (sprite.ox - b.x) * scale,
        anchorY = (h - b.h * scale) / 2 + (sprite.oy - b.y) * scale;
      drawTurret(
        ctx,
        anchorX,
        anchorY,
        -0.4,
        FACTIONS[faction]?.color || TEAM_COLORS[0],
        scale,
        type === "mammoth",
      );
    }
  }
  dispose() {
    this.atlas?.dispose();
    this.terrainAtlas?.dispose();
    this.iconTargets.clear();
    this.tileCache.clear();
    this.spriteCache.clear();
    this.rememberedBuildings.clear();
    this.hitRegions = [];
    this.lastState = null;
  }
}
