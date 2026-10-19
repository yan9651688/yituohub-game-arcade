// Topology is authored and independent of player count. Seeds vary scenery only.
export const MAPS = Object.freeze([
  {
    id: "frontier",
    name: "边境丘陵",
    subtitle: "田野村落 · 双翼高地",
    width: 80,
    height: 64,
    terrain: "plains",
    climate: "temperate",
    players: 8,
    tags: ["缓坡高地", "村落", "侧翼矿区"],
    tactics:
      "公路贯穿村落，两侧坡道通向高地矿区。正面推进与绕侧扩矿都能打开局面。",
    view: [40, 29],
  },
  {
    id: "river",
    name: "双桥河谷",
    subtitle: "钢桥要塞 · 河岸包抄",
    width: 88,
    height: 68,
    terrain: "river",
    climate: "temperate",
    players: 8,
    tags: ["双桥", "河谷", "两岸高地"],
    tactics:
      "宽河将战场分为两岸，南北钢桥承担重装通行。控制桥头，同时提防两栖部队从河岸穿插。",
    view: [44, 22],
  },
  {
    id: "islands",
    name: "群岛封锁",
    subtitle: "跨海长桥 · 联合登陆",
    width: 96,
    height: 76,
    terrain: "islands",
    climate: "coastal",
    players: 8,
    tags: ["四座长桥", "海峡", "中央宝石岛"],
    tactics:
      "四座跨海桥连接四片岛岸，海军可以穿过桥下水道。中央宝石岛需要两栖或运输部队夺取。",
    view: [48, 17],
  },
  {
    id: "highland",
    name: "山口前线",
    subtitle: "断崖台地 · 山口争夺",
    width: 88,
    height: 68,
    terrain: "highland",
    climate: "temperate",
    players: 8,
    tags: ["多层台地", "坡道", "狭窄山口"],
    tactics:
      "山脊阻挡直线突进。地面部队只能沿坡道登上台地，中央山口和南北绕行路线必须兼顾。",
    view: [44, 29],
  },
  {
    id: "crossroads",
    name: "四路会战",
    subtitle: "工业废城 · 公路穿插",
    width: 84,
    height: 68,
    terrain: "crossroads",
    climate: "temperate",
    players: 8,
    tags: ["废弃街区", "环线公路", "湿地"],
    tactics:
      "废城街区分割装甲路线，公路利于快速调动。外围湿地可以绕行，但重装部队会显著减速。",
    view: [42, 34],
  },
  {
    id: "oasis",
    name: "荒漠绿洲",
    subtitle: "风蚀峡谷 · 绿洲补给",
    width: 88,
    height: 68,
    terrain: "oasis",
    climate: "desert",
    players: 8,
    tags: ["砂岩台地", "湖泊", "宝石争夺"],
    tactics:
      "绿洲湖泊挡住中心直线，砂岩台地由两侧缓坡进入。争夺高地宝石矿，保住漫长的采矿线路。",
    view: [43, 32],
  },
  {
    id: "frost",
    name: "冰封峡湾",
    subtitle: "冰湖裂隙 · 雪岭长桥",
    width: 96,
    height: 76,
    terrain: "frost",
    climate: "snow",
    players: 8,
    tags: ["可通行冰湖", "深水裂隙", "雪山"],
    tactics:
      "封冻湖面可供地面部队通过，但履带车辆在冰面减速。深水裂隙可从两座桥跨越，两翼雪岭提供另一条推进路线。",
    view: [38, 32],
  },
  {
    id: "taiga",
    name: "极北林海",
    subtitle: "针叶雪林 · 冰河隘口",
    width: 88,
    height: 72,
    terrain: "taiga",
    climate: "snow",
    players: 8,
    tags: ["密集雪林", "冰河双桥", "高地矿区"],
    tactics:
      "雪林把行军路线切成几条通道，冰河桥头适合拦截。坡道连接高地矿区，侦察侧翼才能避免被断掉补给。",
    view: [44, 23],
  },
]);

export function createMap(id = "frontier", players = 2, seed = 2026) {
  const spec = MAPS.find((m) => m.id === id) || MAPS[0];
  id = spec.id;
  const { width: w, height: h } = spec,
    cx = Math.floor(w / 2),
    cy = Math.floor(h / 2),
    snow = spec.climate === "snow";
  let rng = seed >>> 0;
  const random = () =>
    (rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0) / 4294967296;
  const allStarts = [
    { x: 10, y: h - 14 },
    { x: w - 14, y: 10 },
    { x: 10, y: 10 },
    { x: w - 14, y: h - 14 },
    { x: cx - 2, y: 9 },
    { x: cx - 2, y: h - 13 },
    { x: 9, y: cy - 2 },
    { x: w - 13, y: cy - 2 },
  ];
  if (id === "islands") {
    allStarts[4] = { x: 31, y: 10 };
    allStarts[5] = { x: w - 35, y: h - 14 };
    allStarts[6] = { x: 10, y: 30 };
    allStarts[7] = { x: w - 14, y: h - 34 };
  }
  if (id === "river" || id === "taiga") {
    allStarts[4] = { x: cx - 18, y: 9 };
    allStarts[5] = { x: cx + 14, y: h - 13 };
  }
  const tiles = Array.from({ length: w * h }, (_, i) => {
    const x = i % w,
      y = Math.floor(i / w),
      patch =
        Math.sin(x * 0.17) + Math.cos(y * 0.23) + Math.sin((x + y) * 0.11);
    return {
      kind: patch > 1.55 ? "dirt" : "grass",
      height: 0,
      ore: 0,
      explored: false,
      visible: false,
      ...(snow
        ? { surface: "snow" }
        : id === "oasis"
          ? { surface: "sand" }
          : {}),
    };
  });
  const at = (x, y) =>
    x >= 0 && y >= 0 && x < w && y < h
      ? tiles[Math.floor(y) * w + Math.floor(x)]
      : null;
  const paint = (x, y, values) => {
    const t = at(x, y);
    if (t) Object.assign(t, values);
  };
  const rect = (x0, y0, x1, y1, values) => {
    for (let y = Math.floor(y0); y <= y1; y++)
      for (let x = Math.floor(x0); x <= x1; x++) paint(x, y, values);
  };
  const ellipse = (x, y, rx, ry, values) => {
    for (let yy = Math.floor(y - ry); yy <= y + ry; yy++)
      for (let xx = Math.floor(x - rx); xx <= x + rx; xx++)
        if (((xx - x) / rx) ** 2 + ((yy - y) / ry) ** 2 <= 1)
          paint(xx, yy, values);
  };
  const water = { kind: "water", surface: null, height: 0 };
  const road = (points, radius = 1) => {
    for (let i = 1; i < points.length; i++) {
      const [ax, ay] = points[i - 1],
        [bx, by] = points[i],
        n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
      for (let j = 0; j <= n; j++) {
        const x = Math.round(ax + ((bx - ax) * j) / Math.max(1, n)),
          y = Math.round(ay + ((by - ay) * j) / Math.max(1, n));
        for (let dy = -radius; dy <= radius; dy++)
          for (let dx = -radius; dx <= radius; dx++) {
            const t = at(x + dx, y + dy);
            if (t && t.kind !== "water" && !t.ramp)
              Object.assign(t, { kind: "road", surface: null });
          }
      }
    }
  };
  const landmarks = [],
    bridges = [];
  const bridge = (name, axis, from, to, center, breadth = 3) => {
    const start = center - Math.floor(breadth / 2);
    const b = {
      id: `bridge-${bridges.length}`,
      name,
      axis,
      x: axis === "x" ? from : start,
      y: axis === "x" ? start : from,
      w: axis === "x" ? to - from + 1 : breadth,
      h: axis === "x" ? breadth : to - from + 1,
      deck: 0.65,
    };
    bridges.push(b);
    for (let y = b.y; y < b.y + b.h; y++)
      for (let x = b.x; x < b.x + b.w; x++)
        paint(x, y, {
          kind: "road",
          surface: null,
          bridge: true,
          bridgeId: b.id,
          bridgeAxis: axis,
          height: 0.65,
        });
    landmarks.push({
      name,
      x: b.x + b.w / 2,
      y: b.y + b.h / 2,
      kind: "bridge",
    });
  };
  const plateau = (name, x0, y0, x1, y1, z = 3, axis = "x") => {
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const edgeX = Math.min(x - x0, x1 - x),
          edgeY = Math.min(y - y0, y1 - y);
        if (edgeX + edgeY < 2) continue;
        paint(x, y, { height: z, ...(snow ? { surface: "snow" } : {}) });
      }
    const lane =
      axis === "x" ? Math.floor((y0 + y1) / 2) : Math.floor((x0 + x1) / 2);
    // Six-cell ramps meet the plateau and lowland exactly. Side faces stay cliffs.
    for (const side of [-1, 1])
      for (let j = 0; j < 6; j++) {
        const low = (z * j) / 6,
          high = (z * (j + 1)) / 6;
        for (let k = -2; k <= 2; k++) {
          const x =
            axis === "x" ? (side < 0 ? x0 - 6 + j : x1 + 6 - j) : lane + k;
          const y =
            axis === "y" ? (side < 0 ? y0 - 6 + j : y1 + 6 - j) : lane + k;
          paint(x, y, {
            kind: "dirt",
            ...(snow ? { surface: "snow" } : {}),
            height: (low + high) / 2,
            ramp: { axis, low, high, sign: side < 0 ? 1 : -1 },
          });
        }
      }
    landmarks.push({
      name,
      x: (x0 + x1) / 2,
      y: (y0 + y1) / 2,
      kind: "highland",
      bounds: [x0, y0, x1, y1],
    });
  };
  const river = () => {
    for (let y = 0; y < h; y++) {
      const bend = Math.round(Math.sin((y / h) * Math.PI * 2) * 2);
      rect(cx + bend - 3, y, cx + bend + 3, y, water);
    }
  };
  if (id === "frontier") {
    plateau("北部丘陵", 28, 19, 49, 25, 2);
    plateau("南部丘陵", 30, 40, 51, 46, 2);
    road([
      [5, cy + 1],
      [w - 5, cy + 1],
    ]);
    road([
      [20, 13],
      [20, h - 13],
    ]);
    road([
      [w - 22, 13],
      [w - 22, h - 13],
    ]);
  } else if (id === "river" || id === "taiga") {
    river();
    plateau(snow ? "西岸雪岭" : "西岸台地", 24, 27, 32, h - 28, 3, "y");
    plateau(snow ? "东岸雪岭" : "东岸台地", w - 33, 27, w - 25, h - 28, 3, "y");
    for (const [name, y] of [
      ["北河钢桥", 22],
      ["南河钢桥", h - 23],
    ]) {
      road([
        [14, y],
        [w - 14, y],
      ]);
      bridge(name, "x", cx - 6, cx + 6, y);
    }
  } else if (id === "islands") {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (Math.abs(x - cx) < 9 || Math.abs(y - cy) < 7) paint(x, y, water);
    ellipse(cx, cy, 6, 5, { kind: "grass", surface: null });
    for (const y of [17, h - 18]) {
      road([
        [8, y],
        [w - 8, y],
      ]);
      bridge(y < cy ? "北海大桥" : "南海大桥", "x", cx - 10, cx + 10, y);
    }
    for (const x of [24, w - 25]) {
      road([
        [x, 10],
        [x, h - 10],
      ]);
      bridge(x < cx ? "西海大桥" : "东海大桥", "y", cy - 8, cy + 8, x);
    }
    ellipse(cx, cy, 3, 2, { kind: "gem", ore: 3800 });
    landmarks.push({ name: "中央宝石岛", x: cx, y: cy, kind: "resource" });
  } else if (id === "highland") {
    plateau("北峰台地", cx - 9, 19, cx + 9, cy - 5, 3.5);
    plateau("南峰台地", cx - 9, cy + 5, cx + 9, h - 20, 3.5);
    road([
      [8, cy],
      [w - 8, cy],
    ]);
    road([
      [23, 12],
      [23, h - 12],
    ]);
    road([
      [w - 24, 12],
      [w - 24, h - 12],
    ]);
  } else if (id === "crossroads") {
    rect(cx - 13, cy - 12, cx + 13, cy + 12, {
      kind: "dirt",
      surface: "concrete",
    });
    road([
      [6, cy],
      [w - 6, cy],
    ]);
    road([
      [cx, 6],
      [cx, h - 6],
    ]);
    road([
      [cx - 14, cy - 13],
      [cx + 14, cy - 13],
      [cx + 14, cy + 13],
      [cx - 14, cy + 13],
      [cx - 14, cy - 13],
    ]);
    ellipse(22, 22, 5, 4, { surface: "marsh" });
    ellipse(w - 23, h - 23, 5, 4, { surface: "marsh" });
  } else if (id === "oasis") {
    ellipse(cx, cy, 8, 14, water);
    ellipse(cx, cy, 5, 10, { kind: "grass", surface: null });
    road([
      [15, cy],
      [w - 15, cy],
    ]);
    bridge("绿洲栈桥", "x", cx - 9, cx + 9, cy);
    plateau("西部风蚀台地", 24, 20, 31, 46, 3, "y");
    plateau("东部风蚀台地", w - 32, 20, w - 25, 46, 3, "y");
  } else if (id === "frost") {
    ellipse(cx, cy, 26, 20, { kind: "dirt", surface: "ice" });
    for (let y = 15; y <= h - 16; y++) {
      const bend = Math.round(Math.sin(y * 0.13) * 2);
      rect(cx + bend - 1, y, cx + bend + 1, y, water);
    }
    for (const y of [27, h - 28])
      bridge(y < cy ? "北冰湖桥" : "南冰湖桥", "x", cx - 5, cx + 5, y);
    plateau("西部雪岭", 21, 28, 28, 47, 3, "y");
    plateau("东部雪岭", w - 29, 28, w - 22, 47, 3, "y");
    road([
      [14, 17],
      [w - 14, 17],
    ]);
    road([
      [14, h - 18],
      [w - 14, h - 18],
    ]);
  }
  // Clear all eight aprons even with two players, keeping preview topology stable.
  const protectedCell = (x, y) =>
    allStarts.some(
      (p) => Math.abs(x - p.x - 1) <= 6 && Math.abs(y - p.y - 1) <= 6,
    );
  for (const p of allStarts)
    for (let y = p.y - 5; y <= p.y + 7; y++)
      for (let x = p.x - 5; x <= p.x + 7; x++) {
        const t = at(x, y);
        if (!t) continue;
        const apronKind =
          t.kind === "road" && !t.bridge
            ? "road"
            : Math.hypot(x - p.x - 1, y - p.y - 1) < 3
              ? "dirt"
              : "grass";
        Object.assign(t, {
          kind: apronKind,
          height: 0,
          ore: 0,
          bridge: false,
          surface: snow ? "snow" : id === "oasis" ? "sand" : null,
        });
        delete t.ramp;
        delete t.bridgeId;
      }
  const orePatch = (x, y, radius = 2, gems = false) => {
    for (let yy = y - radius; yy <= y + radius; yy++)
      for (let xx = x - radius; xx <= x + radius; xx++) {
        const t = at(xx, yy);
        if (!t || t.kind === "water" || t.bridge || t.ramp) continue;
        Object.assign(t, {
          kind: gems ? "gem" : "ore",
          ore: gems ? 3200 : 2500,
        });
      }
  };
  for (const p of allStarts) {
    const dx = p.x < cx ? 1 : -1;
    let best = null;
    for (let r = 8; r <= 17 && !best; r++)
      for (const [ox, oy] of [0, -4, 4, -8, 8].flatMap((offset) => [
        [p.x + dx * r, p.y + offset],
        [p.x - dx * r, p.y + offset],
        [p.x + offset, p.y + r],
        [p.x + offset, p.y - r],
      ])) {
        let valid = true;
        for (let y = oy - 2; y <= oy + 2; y++)
          for (let x = ox - 2; x <= ox + 2; x++) {
            const t = at(x, y);
            if (
              !t ||
              t.kind === "water" ||
              t.bridge ||
              t.ramp ||
              t.height !== 0 ||
              t.ore > 0 ||
              Math.hypot(x - p.x, y - p.y) < 5
            )
              valid = false;
          }
        if (valid) {
          best = { x: ox, y: oy };
          break;
        }
      }
    if (best) {
      orePatch(best.x, best.y);
      p.ore = best;
    }
  }
  for (const l of landmarks.filter((l) => l.kind === "highland"))
    orePatch(Math.floor(l.x), Math.floor(l.y), 1, true);
  const neutralSpawns = [],
    props = [];
  const clearForProp = (x, y, radius = 1) => {
    const z = at(x, y)?.height;
    for (let yy = y - radius; yy <= y + radius; yy++)
      for (let xx = x - radius; xx <= x + radius; xx++) {
        const t = at(xx, yy);
        if (
          !t ||
          protectedCell(xx, yy) ||
          t.ramp ||
          t.bridge ||
          t.kind === "water" ||
          t.kind === "road" ||
          t.ore ||
          t.obstacle ||
          Math.abs(t.height - z) > 0.01 ||
          t.surface === "ice"
        )
          return false;
      }
    return true;
  };
  const prop = (type, x, y) => {
    if (!clearForProp(x, y)) return false;
    const masonry = ["cottage", "snowCottage", "ruin"].includes(type);
    props.push({
      type,
      x: x + (masonry ? 1 : 0.5),
      y: y + (masonry ? 1 : 0.5),
      scale: 0.9 + random() * 0.2,
    });
    rect(x, y, x + (masonry ? 1 : 0), y + (masonry ? 1 : 0), {
      obstacle: true,
    });
    return true;
  };
  for (const [x, y] of [
    [cx - 8, cy - 7],
    [cx + 7, cy + 7],
    [cx - 6, cy + 7],
    [cx + 6, cy - 7],
  ])
    prop(id === "crossroads" ? "ruin" : snow ? "snowCottage" : "cottage", x, y);
  for (const l of landmarks.filter((l) => l.kind === "highland")) {
    const [x0, y0, x1, y1] = l.bounds,
      rock = snow ? "snowRock" : id === "oasis" ? "sandRock" : "rock";
    for (let x = x0 + 3; x <= x1 - 2; x += 4) {
      prop(rock, x, y0 + 1);
      prop(rock, x, y1 - 1);
    }
  }
  const count = id === "taiga" ? 150 : id === "oasis" ? 50 : 85;
  for (let i = 0; i < count * 5 && props.length < count; i++) {
    const x = 3 + Math.floor(random() * (w - 6)),
      y = 3 + Math.floor(random() * (h - 6));
    if (
      Math.sin(x * 0.24) + Math.cos(y * 0.29) <=
      (id === "taiga" ? -0.4 : 0.25)
    )
      continue;
    const type =
      id === "oasis"
        ? "sandRock"
        : snow
          ? random() < 0.82
            ? "snowPine"
            : "snowRock"
          : random() < 0.7
            ? "pine"
            : random() < 0.6
              ? "trees"
              : "rock";
    prop(type, x, y);
  }
  for (const [type, ox, oy] of [
    ["oilDerrick", cx - 16, cy + 6],
    ["hospital", cx + 15, cy - 8],
  ]) {
    let placed = false;
    for (let r = 0; r < 14 && !placed; r++)
      for (const [dx, dy] of [
        [r, 0],
        [-r, 0],
        [0, r],
        [0, -r],
      ]) {
        const x = ox + dx,
          y = oy + dy;
        if (!clearForProp(x + 1, y + 1, 2)) continue;
        neutralSpawns.push({ type, x, y });
        rect(x, y, x + 1, y + 1, { surface: snow ? "snow" : "concrete" });
        placed = true;
        break;
      }
  }
  return {
    ...spec,
    tiles,
    starts: allStarts.slice(0, Math.max(2, Math.min(8, players))),
    neutralSpawns,
    bridges,
    props,
    landmarks,
  };
}
export const generateMap = createMap;
