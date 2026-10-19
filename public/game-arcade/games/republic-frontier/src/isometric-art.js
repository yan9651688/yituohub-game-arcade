// Original local art kit. No proprietary game sprites or remote images are used.
export const TILE_W = 64,
  TILE_H = 32,
  HEIGHT_STEP = 12;
export const TEAM_COLORS = [
  "#5188b8",
  "#b95242",
  "#ccad55",
  "#7baf80",
  "#ab80af",
  "#5aaab2",
  "#d8834d",
  "#bbb9aa",
];
const TWO_PI_LOCAL = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function shade(hex, f = 1) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${clamp((n >> 16) * f, 0, 255) | 0},${clamp(((n >> 8) & 255) * f, 0, 255) | 0},${clamp((n & 255) * f, 0, 255) | 0})`;
}
export function seeded(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
}
const canvas = (w, h) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};
export function path(ctx, pts, fill, stroke = null, width = 0.7) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

export function makeTile(
  kind = "grass",
  variant = 0,
  bridge = false,
  richness = 1,
  surface = null,
  textureImage = null,
  textureCell = { x: 0, y: 0 },
) {
  const c = canvas(136, 100),
    ctx = c.getContext("2d"),
    r = seeded(variant * 7919 + kind.length * 751 + 53),
    diamond = [
      [34, 2],
      [66, 18],
      [34, 34],
      [2, 18],
    ];
  ctx.scale(2, 2);
  const colors = {
    grass: ["#647454", "#657555", "#637353", "#667655"],
    dirt: ["#8b8064", "#93866b", "#847b61", "#8d8165"],
    road: ["#555b56", "#59605c", "#515953", "#565c57"],
    water: ["#385f6a", "#3a6670", "#355c67", "#426d76"],
    rock: ["#70766a", "#7d8071", "#6e766c", "#777b6e"],
    ore: ["#716f50", "#787451", "#73714e", "#6d714f"],
    gem: ["#5f6b60", "#626e62", "#677064", "#616b5d"],
  };
  const surfaceColors = {
    snow: "#d7e0e4",
    ice: "#98c0d1",
    marsh: "#69755b",
    sand: "#b9a184",
    concrete: "#7b827c",
    urban: "#747b75",
    quay: "#77847c",
    warehouse: "#827e6f",
    runway: "#4c5759",
  };
  path(
    ctx,
    diamond,
    surfaceColors[surface] || (colors[kind] || colors.grass)[variant % 4],
  );
  ctx.save();
  path(ctx, diamond);
  ctx.clip();
  if (textureImage) {
    const tw = textureImage.naturalWidth || textureImage.width,
      th = textureImage.naturalHeight || textureImage.height,
      period = 8,
      sw = tw / period,
      sh = th / period;
    const sx = (((textureCell.x % period) + period) % period) * sw,
      sy = (((textureCell.y % period) + period) % period) * sh;
    ctx.save();
    ctx.transform(32 / sw, 16 / sw, -32 / sh, 16 / sh, 34, 2);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    // One texture spans an 8 x 8 area rather than being squeezed onto every tile.
    // A restrained material grade keeps unit silhouettes readable over the ground.
    ctx.filter =
      surface === "snow"
        ? "saturate(.65) contrast(.86) brightness(1.03)"
        : surface === "ice"
          ? "saturate(.8) contrast(.82) brightness(.96)"
          : surface === "sand"
            ? "saturate(.7) contrast(.75) brightness(.95)"
            : kind === "grass"
              ? "saturate(.45) contrast(.6) brightness(.78)"
              : kind === "water"
                ? "saturate(.5) contrast(.8) brightness(.76)"
                : kind === "road"
                  ? "saturate(.3) contrast(.65) brightness(.68)"
                  : "saturate(.58) contrast(.75) brightness(.8)";
    ctx.drawImage(textureImage, sx, sy, sw, sh, 0, 0, sw, sh);
    ctx.restore();
    if (kind === "grass" && !surface) {
      ctx.fillStyle = "rgba(69,87,54,.28)";
      ctx.fillRect(0, 0, 68, 38);
    }
  }
  for (let i = 0; i < (textureImage ? 14 : 100); i++) {
    const x = r() * 68,
      y = r() * 38;
    ctx.fillStyle =
      i % 3 === 0 ? "rgba(214,220,178,.08)" : "rgba(15,33,28,.065)";
    ctx.fillRect(x, y, 1 + r() * 4, 1 + r() * 2);
  }
  if (
    ["concrete", "urban", "quay", "warehouse", "runway"].includes(surface) &&
    kind !== "water"
  ) {
    ctx.strokeStyle = "rgba(30,43,43,.22)";
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    ctx.moveTo(3, 18);
    ctx.lineTo(34, 33);
    ctx.lineTo(65, 18);
    ctx.stroke();
    if (surface === "runway") {
      ctx.strokeStyle = "#c7c5a6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(25, 13);
      ctx.lineTo(42, 22);
      ctx.stroke();
    }
  }
  if (kind === "water") {
    for (let i = 0; i < 10; i++) {
      const x = r() * 64,
        y = r() * 32;
      ctx.strokeStyle = "rgba(152,191,188,.22)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 4 + r() * 7, y - 1);
      ctx.stroke();
    }
  } else if (kind === "road") {
    ctx.strokeStyle = "rgba(201,191,139,.4)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(28, 14);
    ctx.lineTo(39, 20);
    ctx.stroke();
  } else if (kind === "grass" && !surface) {
    for (let i = 0; i < 7; i++) {
      const x = 9 + r() * 50,
        y = 8 + r() * 23;
      ctx.strokeStyle = i % 2 ? "#879270" : "#465d47";
      ctx.lineWidth = 0.55;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 1, y - 2);
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2, y - 2);
      ctx.stroke();
    }
  } else if (kind === "ore" || kind === "gem") {
    const n = Math.round((kind === "ore" ? 21 : 15) * richness);
    for (let i = 0; i < n; i++) {
      const x = 8 + r() * 52,
        y = 6 + r() * 25,
        s = 1.3 + r() * 2.8,
        col =
          kind === "ore"
            ? ["#d7bc62", "#a18a43", "#b5a369", "#e2ca7d"][i % 4]
            : ["#ba7fb1", "#71b9b4", "#8f93cf", "#c0ad74"][i % 4];
      path(
        ctx,
        [
          [x - s, y],
          [x, y - s * 1.1],
          [x + s, y],
          [x, y + s * 0.5],
        ],
        col,
        "rgba(38,43,31,.35)",
        0.5,
      );
    }
  }
  ctx.restore();
  if (bridge) {
    path(
      ctx,
      [
        [3, 16],
        [34, 1],
        [66, 17],
        [35, 33],
      ],
      "#8b856d",
      "#302e28",
    );
    for (let i = 0; i < 8; i++)
      path(
        ctx,
        [
          [6 + i * 4, 16 - i * 2],
          [8 + i * 4, 15 - i * 2],
          [38 + i * 4, 30 - i * 2],
          [36 + i * 4, 31 - i * 2],
        ],
        i % 2 ? "#6c6f60" : "#9b9479",
      );
    path(
      ctx,
      [
        [3, 12],
        [34, -3],
        [34, 0],
        [3, 15],
      ],
      "#b9b091",
      "#424e45",
    );
    path(
      ctx,
      [
        [35, 29],
        [66, 14],
        [66, 17],
        [35, 32],
      ],
      "#7b8275",
      "#3b4944",
    );
  }
  return c;
}

class IsoPaint {
  constructor(ctx, originX, originY, scale = 32, turn = 0) {
    this.ctx = ctx;
    this.ox = originX;
    this.oy = originY;
    this.scale = scale;
    this.turn = turn;
    this.faces = [];
    this.part = 0;
  }
  rotate(x, y) {
    const c = Math.cos(this.turn),
      s = Math.sin(this.turn);
    return [x * c - y * s, x * s + y * c];
  }
  point(x, y, z = 0) {
    const [a, b] = this.rotate(x, y);
    return [
      this.ox + (a - b) * this.scale,
      this.oy + (a + b) * this.scale * 0.5 - z * this.scale,
    ];
  }
  poly(vertices, color, stroke = "rgba(15,26,29,.45)", width = 0.65) {
    const depth =
      vertices.reduce((a, p) => {
        const [x, y] = this.rotate(p[0], p[1]);
        return a + x + y + p[2] * 0.7;
      }, 0) / vertices.length;
    this.faces.push({ vertices, color, stroke, width, depth, part: this.part });
  }
  box(x, y, z, w, h, d, color, roof = null) {
    this.part++;
    this.poly(
      [
        [x, y, z],
        [x + w, y, z],
        [x + w, y, z + d],
        [x, y, z + d],
      ],
      shade(color, 0.57),
    );
    this.poly(
      [
        [x, y, z],
        [x, y + h, z],
        [x, y + h, z + d],
        [x, y, z + d],
      ],
      shade(color, 0.65),
    );
    this.poly(
      [
        [x + w, y, z],
        [x + w, y + h, z],
        [x + w, y + h, z + d],
        [x + w, y, z + d],
      ],
      shade(color, 0.83),
    );
    this.poly(
      [
        [x, y + h, z],
        [x + w, y + h, z],
        [x + w, y + h, z + d],
        [x, y + h, z + d],
      ],
      shade(color, 0.69),
    );
    this.poly(
      [
        [x, y, z + d],
        [x + w, y, z + d],
        [x + w, y + h, z + d],
        [x, y + h, z + d],
      ],
      roof || shade(color, 1.12),
    );
  }
  cylinder(x, y, z, r, h, color, segments = 12) {
    this.part++;
    const top = [];
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2,
        b = ((i + 1) / segments) * Math.PI * 2,
        A = [x + Math.cos(a) * r, y + Math.sin(a) * r],
        B = [x + Math.cos(b) * r, y + Math.sin(b) * r];
      this.poly(
        [
          [...A, z],
          [...B, z],
          [...B, z + h],
          [...A, z + h],
        ],
        shade(color, 0.65 + Math.cos(a + 1) * 0.17),
      );
      top.push([...A, z + h]);
    }
    this.poly(top, shade(color, 1.14));
  }
  roof(x, y, z, w, h, rise, color) {
    this.part++;
    const a = [x, y, z],
      b = [x + w, y, z],
      c = [x + w, y + h, z],
      d = [x, y + h, z],
      e = [x + w / 2, y, z + rise],
      f = [x + w / 2, y + h, z + rise];
    this.poly([a, e, f, d], shade(color, 0.86));
    this.poly([e, b, c, f], shade(color, 1.14));
    this.poly([d, f, c], shade(color, 0.7));
    this.poly([a, b, e], shade(color, 0.65));
  }
  flush() {
    this.faces.sort((a, b) => a.part - b.part || a.depth - b.depth);
    for (const f of this.faces) {
      const pts = f.vertices.map((v) => this.point(...v));
      path(this.ctx, pts, f.color, f.stroke, f.width);
      const minX = Math.min(...pts.map((v) => v[0])),
        maxX = Math.max(...pts.map((v) => v[0])),
        minY = Math.min(...pts.map((v) => v[1])),
        maxY = Math.max(...pts.map((v) => v[1]));
      if ((maxX - minX) * (maxY - minY) > 180) {
        const r = seeded((minX * 43 + minY * 131 + f.part * 71) | 0);
        this.ctx.save();
        path(this.ctx, pts);
        this.ctx.clip();
        for (let j = 0; j < 42; j++) {
          this.ctx.fillStyle =
            j % 2 ? "rgba(224,232,208,.09)" : "rgba(14,31,28,.07)";
          this.ctx.fillRect(
            minX + r() * (maxX - minX),
            minY + r() * (maxY - minY),
            1 + r() * 2,
            1,
          );
        }
        this.ctx.restore();
      }
    }
    this.faces = [];
  }
  line(a, b, color = "#a9b1a8", width = 1) {
    const ctx = this.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(...this.point(...a));
    ctx.lineTo(...this.point(...b));
    ctx.stroke();
  }
}

function floor(p, w, h, color = "#5c635b") {
  p.box(0.08, 0.08, 0, w - 0.16, h - 0.16, 0.1, color);
}
function stripes(p, x, y, z, w, h) {
  for (let i = 0; i < 5; i++)
    p.box(
      x + (i * w) / 5,
      y,
      z,
      w / 10,
      h,
      0.018,
      i % 2 ? "#b7a970" : "#363c38",
    );
}
function vents(p, x, y, z, w, h, n = 5) {
  p.box(x, y, z, w, h, 0.09, "#394749");
  for (let i = 0; i < n; i++)
    p.box(
      x + 0.035,
      y + 0.035 + (i * (h - 0.07)) / n,
      z + 0.09,
      w - 0.07,
      0.025,
      0.015,
      "#8a9690",
    );
}
function windows(p, x, y, z, n, w = 0.13) {
  for (let i = 0; i < n; i++)
    p.box(x + i * (w + 0.07), y, z, w, 0.018, 0.13, "#4f838b", "#7cb1ac");
}
function chimney(p, x, y, h = 0.9, r = 0.12) {
  p.cylinder(x, y, 0.4, r, h, "#8c9187");
  p.cylinder(x, y, h + 0.28, r * 1.1, 0.1, "#4b5752");
  p.cylinder(x, y, h + 0.38, r * 0.75, 0.02, "#202f31");
}
function flag(p, x, y, z, team) {
  p.line([x, y, z], [x, y, z + 0.7], "#c3c4ac", 1);
  const [a, b] = p.point(x, y, z + 0.7);
  path(
    p.ctx,
    [
      [a, b],
      [a + 17, b + 3],
      [a + 13, b + 10],
      [a, b + 7],
    ],
    team,
    "#273432",
  );
}

export function makeBuilding(
  type,
  w = 3,
  h = 3,
  team = TEAM_COLORS[0],
  faction = "allied",
) {
  const margin = 30,
    top = 140,
    width = Math.ceil((w + h) * 32 + margin * 2),
    height = Math.ceil((w + h) * 16 + top + 32),
    c = canvas(width, height),
    ctx = c.getContext("2d"),
    ox = h * 32 + margin,
    oy = top,
    p = new IsoPaint(ctx, ox, oy),
    metal =
      faction === "china"
        ? "#6a7363"
        : faction === "soviet"
          ? "#7a7165"
          : "#7f8a85",
    roof = faction === "china" ? "#637260" : "#687c7f";
  floor(p, w, h);
  if (type === "constructionYard") {
    p.box(0.2, 0.55, 0.1, w - 1, h - 0.8, 0.8, metal);
    p.roof(0.2, 0.55, 0.9, w - 1, h - 0.8, 0.25, roof);
    p.box(0.16, 0.5, 0.75, w - 0.92, 0.12, 0.22, team);
    p.box(w - 1.15, 0.25, 0.1, 0.7, h - 0.5, 0.38, "#697565");
    vents(p, w - 0.96, 0.45, 0.48, 0.35, 0.65);
    p.box(0.55, h - 0.34, 0.12, w - 1.65, 0.1, 0.57, "#23383b");
    p.box(0.63, h - 0.22, 0.14, w - 1.82, 0.03, 0.08, "#b2ac8a");
    stripes(p, 0.42, h - 0.15, 0.12, w - 1.3, 0.12);
    p.box(w - 0.63, 0.4, 0.12, 0.22, 0.25, 1.65, "#ad9e5c");
    p.box(w - 0.62, 0.41, 1.7, 1.55, 0.2, 0.17, "#c5b56a");
    p.box(w + 0.56, 0.4, 1.66, 0.27, 0.24, 0.31, "#626b5e");
    p.box(0.35, 0.15, 0.12, 0.65, 0.35, 0.27, "#817b55");
    p.box(0.44, 0.22, 0.4, 0.36, 0.23, 0.11, "#c0b073");
    p.flush();
    p.line([w + 0.35, 0.5, 1.7], [w + 0.35, 0.5, 0.9], "#2b3838", 1);
    flag(p, 0.35, 0.6, 1.25, team);
  } else if (type === "powerPlant") {
    p.box(0.2, 0.28, 0.1, w - 0.4, h - 0.5, 0.58, metal);
    p.box(0.15, 0.21, 0.62, w - 0.3, 0.16, 0.16, team);
    p.cylinder(w * 0.46, h * 0.57, 0.63, 0.42, 0.42, "#7e8e83");
    p.cylinder(w * 0.46, h * 0.57, 1.05, 0.33, 0.08, "#9abb7f");
    p.cylinder(w * 0.46, h * 0.57, 1.13, 0.23, 0.11, "#424f43");
    chimney(p, w - 0.45, 0.42, 1.25, 0.17);
    chimney(p, w - 0.76, 0.72, 0.95, 0.14);
    vents(p, 0.3, h - 0.55, 0.68, 0.6, 0.32);
    windows(p, 0.35, h - 0.22, 0.3, 3);
    p.flush();
  } else if (type === "barracks") {
    p.box(0.25, 0.2, 0.1, w - 0.55, h - 0.45, 0.48, metal);
    p.roof(0.2, 0.15, 0.58, w - 0.45, h - 0.35, 0.46, roof);
    p.box(0.2, h - 0.26, 0.55, w - 0.45, 0.12, 0.12, team);
    p.box(w * 0.42, h - 0.18, 0.1, 0.37, 0.04, 0.43, "#253a38");
    p.box(0.15, h - 0.6, 0.12, 0.31, 0.3, 0.18, "#84805c");
    windows(p, 0.28, h - 0.22, 0.35, 2, 0.12);
    p.flush();
    flag(p, w - 0.27, 0.35, 0.63, team);
  } else if (type === "refinery") {
    p.box(0.12, 0.12, 0.1, w - 0.5, 0.7, 0.6, metal);
    p.cylinder(0.7, 0.65, 0.18, 0.48, 0.96, "#aaa796");
    p.cylinder(0.7, 0.65, 1.04, 0.49, 0.1, team);
    p.cylinder(1.6, 0.6, 0.15, 0.35, 0.72, "#989d8b");
    p.box(0.35, 1, 0.1, w - 0.55, h - 1.2, 0.2, "#687269");
    p.box(0.3, 1, 0.32, 0.3, h - 1.2, 0.36, metal);
    p.box(w - 0.55, 1, 0.32, 0.27, h - 1.2, 0.36, metal);
    p.box(0.58, 1.15, 0.31, w - 1.15, 0.48, 0.25, "#a09567");
    p.roof(0.58, 1.15, 0.56, w - 1.15, 0.48, 0.19, "#c0ac6a");
    p.box(0.55, h - 0.32, 0.12, w - 1, 0.17, 0.05, "#253d40");
    stripes(p, 0.42, h - 0.17, 0.12, w - 0.75, 0.12);
    p.box(w - 0.42, 0.2, 0.12, 0.14, 1.4, 0.17, "#a0a18c");
    p.flush();
  } else if (type === "warFactory") {
    p.box(0.12, 0.16, 0.1, w - 0.25, h - 0.4, 0.93, metal);
    p.roof(0.12, 0.16, 1.03, w - 0.25, h - 0.4, 0.22, roof);
    p.box(0.1, h - 0.28, 0.85, w - 0.2, 0.12, 0.2, team);
    p.box(0.58, h - 0.24, 0.12, w - 1.16, 0.07, 0.71, "#182e34");
    p.box(0.65, h - 0.15, 0.15, w - 1.3, 0.07, 0.06, "#7f8877");
    for (let i = 0; i < 3; i++)
      p.box(0.63, h - 0.19, 0.62 + i * 0.07, w - 1.25, 0.025, 0.025, "#738077");
    stripes(p, 0.4, h - 0.12, 0.12, w - 0.8, 0.12);
    vents(p, 0.35, 0.42, 1.1, 0.62, 0.77, 7);
    vents(p, w - 1.1, 0.42, 1.1, 0.62, 0.77, 7);
    chimney(p, w - 0.4, 0.32, 1.15, 0.1);
    p.flush();
  } else if (type === "radar") {
    p.box(0.15, 0.2, 0.1, w - 0.3, h - 0.4, 0.6, metal);
    p.box(0.12, 0.15, 0.62, w - 0.24, h - 0.3, 0.1, team);
    p.box(w * 0.4, h * 0.4, 0.72, 0.28, 0.28, 0.55, "#a5afa3");
    vents(p, 0.28, 0.35, 0.73, 0.45, 0.6);
    windows(p, 0.35, h - 0.18, 0.37, 4);
    p.flush();
    const [dX, dY] = p.point(w * 0.55, h * 0.55, 1.4);
    ctx.save();
    ctx.translate(dX, dY);
    ctx.rotate(-0.52);
    ctx.fillStyle = "#c2c8b5";
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#526967";
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.ellipse(i * 6, 0, 5, 9, 0, 0, 6.29);
      ctx.stroke();
    }
    ctx.restore();
    p.line(
      [w * 0.55, h * 0.55, 1.4],
      [w * 0.73, h * 0.39, 1.72],
      "#4e5e5d",
      1.2,
    );
  } else if (type === "airfield") {
    p.box(0.08, 0.08, 0.12, w - 0.16, h - 0.16, 0.02, "#53605d");
    for (let i = 0; i < 5; i++)
      p.box(
        w * 0.5 - 0.035,
        0.25 + (i * (h - 0.5)) / 5,
        0.15,
        0.07,
        0.25,
        0.01,
        "#ccc7a1",
      );
    for (const x of [0.2, w - 0.22])
      for (let j = 0; j < 5; j++)
        p.box(
          x,
          0.2 + (j * (h - 0.4)) / 5,
          0.16,
          0.055,
          0.055,
          0.04,
          "#a7d2be",
        );
    p.box(0.15, 0.15, 0.15, w * 0.4, 0.7, 0.58, metal);
    p.roof(0.12, 0.12, 0.73, w * 0.43, 0.75, 0.22, roof);
    p.box(0.12, 0.12, 0.74, w * 0.43, 0.08, 0.1, team);
    p.flush();
  } else if (type === "shipyard") {
    p.box(0.12, 0.15, 0.1, 0.5, h - 0.3, 0.15, "#7b7f71");
    p.box(w - 0.62, 0.15, 0.1, 0.5, h - 0.3, 0.15, "#7b7f71");
    p.box(0.12, 0.15, 0.1, w - 0.24, 0.6, 0.38, metal);
    p.box(0.12, 0.15, 0.48, w - 0.24, 0.12, 0.15, team);
    for (let i = 0; i < 3; i++) {
      p.cylinder(0.35, 0.9 + i * 0.65, 0, 0.11, 0.35, "#3d5151");
      p.cylinder(w - 0.36, 0.9 + i * 0.65, 0, 0.11, 0.35, "#3d5151");
    }
    p.box(w - 0.5, 0.45, 0.45, 0.13, 0.14, 1.2, "#b4a46b");
    p.box(w - 1.65, 0.45, 1.5, 1.3, 0.14, 0.14, "#c4b47a");
    p.flush();
    p.line([w - 1.5, 0.5, 1.5], [w - 1.5, 0.5, 0.5], "#374b4e");
  } else if (type === "techLab") {
    p.box(0.2, 0.2, 0.1, w - 0.4, h - 0.4, 0.9, metal);
    p.box(0.15, 0.15, 0.86, w - 0.3, h - 0.3, 0.18, team);
    p.box(0.43, 0.5, 1.04, w - 0.86, h - 0.95, 0.32, "#b0b9a5");
    p.cylinder(w * 0.52, h * 0.5, 1.36, 0.35, 0.12, "#92b9b1");
    windows(p, 0.35, h - 0.17, 0.48, Math.max(2, (w * 3) | 0));
    vents(p, 0.3, 0.28, 1.07, 0.4, 0.3);
    p.flush();
    for (let i = 0; i < 3; i++)
      p.line(
        [w - 0.35, 0.4 + i * 0.2, 1.08],
        [w - 0.35, 0.4 + i * 0.2, 1.65 - i * 0.13],
        "#c0c3b0",
        1,
      );
  } else if (type === "pillbox") {
    p.cylinder(w * 0.5, h * 0.5, 0.12, 0.39, 0.47, "#8a8d78");
    p.cylinder(w * 0.5, h * 0.5, 0.6, 0.42, 0.12, team);
    p.box(w * 0.5 - 0.26, h * 0.5 + 0.24, 0.37, 0.52, 0.11, 0.15, "#172b2b");
    p.box(w * 0.5 - 0.035, h * 0.5 + 0.3, 0.43, 0.07, 0.36, 0.08, "#434f46");
    p.flush();
  } else if (type === "airDefense") {
    p.box(0.2, 0.2, 0.13, w - 0.4, h - 0.4, 0.25, metal);
    p.cylinder(w * 0.5, h * 0.5, 0.38, 0.22, 0.32, team);
    for (const x of [-0.18, 0.18])
      p.box(
        w * 0.5 + x - 0.065,
        h * 0.5 - 0.35,
        0.6,
        0.13,
        0.66,
        0.18,
        "#8f9b8b",
      );
    p.flush();
  } else if (type === "defenseTower") {
    p.box(0.22, 0.22, 0.1, w - 0.44, h - 0.44, 0.23, metal);
    p.box(w * 0.38, h * 0.38, 0.33, 0.24, 0.24, 0.85, metal);
    p.cylinder(w * 0.5, h * 0.5, 1.15, 0.28, 0.15, team);
    p.cylinder(w * 0.5, h * 0.5, 1.32, 0.19, 0.23, "#b3c7b4");
    p.cylinder(w * 0.5, h * 0.5, 1.55, 0.13, 0.07, "#a9ddd0");
    p.flush();
  } else if (type === "repairDepot") {
    p.box(0.15, 0.15, 0.12, w - 0.3, h - 0.3, 0.03, "#4c615a");
    for (const x of [0.3, w - 0.5])
      p.box(x, 0.3, 0.15, 0.2, h - 0.6, 0.12, "#b5af85");
    p.box(0.15, 0.15, 0.13, w - 0.3, 0.35, 0.35, metal);
    p.box(0.15, 0.15, 0.48, w - 0.3, 0.12, 0.13, team);
    stripes(p, 0.2, h - 0.3, 0.16, w - 0.4, 0.13);
    p.flush();
    p.line([w * 0.35, h * 0.5, 0.17], [w * 0.65, h * 0.5, 0.17], "#b9bc95", 3);
    p.line([w * 0.5, h * 0.35, 0.17], [w * 0.5, h * 0.65, 0.17], "#b9bc95", 3);
  } else if (type === "superweapon") {
    p.box(0.1, 0.1, 0.12, w - 0.2, h - 0.2, 0.3, metal);
    p.cylinder(w * 0.5, h * 0.5, 0.42, 0.67, 0.22, team);
    p.cylinder(w * 0.5, h * 0.5, 0.65, 0.57, 0.06, "#303c36");
    p.cylinder(w * 0.5, h * 0.5, 0.7, 0.46, 0.13, "#a9aea0");
    p.box(0.18, 0.18, 0.4, 0.28, 0.35, 0.5, "#889184");
    chimney(p, w - 0.4, 0.4, 0.75, 0.07);
    p.flush();
    p.line([w * 0.21, h * 0.5, 0.85], [w * 0.79, h * 0.5, 0.85], "#333f3a", 2);
    p.line([w * 0.5, h * 0.21, 0.85], [w * 0.5, h * 0.79, 0.85], "#333f3a", 2);
  } else if (type === "oilDerrick") {
    p.box(0.2, 0.2, 0.1, w - 0.4, h - 0.4, 0.23, "#796d53");
    for (const x of [0.3, w - 0.45])
      p.box(x, 0.4, 0.32, 0.15, 0.45, 1.18, "#5f5b43");
    p.box(0.27, 0.5, 1.35, w - 0.55, 0.15, 0.18, "#b6a477");
    p.cylinder(w * 0.5, h * 0.65, 0.32, 0.25, 0.4, "#716d53");
    p.flush();
    p.line([0.3, 0.45, 0.4], [w - 0.3, 0.45, 1.4], "#c1b584", 2);
    p.line([w - 0.3, 0.45, 0.4], [0.3, 0.45, 1.4], "#c1b584", 2);
  } else if (type === "hospital") {
    p.box(0.2, 0.2, 0.1, w - 0.4, h - 0.4, 0.54, "#b1b6a1");
    p.roof(0.15, 0.15, 0.64, w - 0.3, h - 0.3, 0.3, "#b5bba7");
    p.box(w * 0.5 - 0.1, h - 0.18, 0.35, 0.2, 0.025, 0.35, "#a64e43");
    p.box(w * 0.5 - 0.22, h - 0.17, 0.45, 0.44, 0.02, 0.12, "#a64e43");
    p.flush();
  } else {
    p.box(0.2, 0.2, 0.12, w - 0.4, h - 0.4, 0.7, metal);
    p.roof(0.15, 0.15, 0.82, w - 0.3, h - 0.3, 0.25, team);
    p.flush();
  }
  return { canvas: c, ox, oy, w, h };
}

export function makeUnit(
  type,
  angle = 0,
  team = TEAM_COLORS[0],
  faction = "allied",
  walk = 0,
  deployed = false,
) {
  const c = canvas(160, 138),
    ctx = c.getContext("2d"),
    ox = 80,
    oy = 95,
    p = new IsoPaint(ctx, ox, oy, 32, angle),
    armor =
      faction === "china"
        ? "#81916a"
        : faction === "soviet"
          ? "#8b8572"
          : "#8b9b8f";
  if (["infantry", "engineer", "spy"].includes(type)) {
    const move = walk ? 2 : 0,
      dir = p.point(0.27, 0, 0.28),
      head = [ox, oy - (deployed ? 12 : 21)];
    ctx.fillStyle = "#213030";
    ctx.fillRect(ox - 4 - move, oy - 8, 3, 7);
    ctx.fillRect(ox + 1 + move, oy - 8, 3, 7);
    ctx.fillStyle = "#141f23";
    ctx.fillRect(ox - 5 - move, oy - 2, 5, 2);
    ctx.fillRect(ox + move, oy - 2, 5, 2);
    ctx.fillStyle = type === "spy" ? "#475358" : armor;
    ctx.fillRect(ox - 4, head[1] + 5, 8, deployed ? 6 : 10);
    ctx.fillStyle = team;
    ctx.fillRect(ox - 4, head[1] + 6, 3, 5);
    ctx.fillStyle = "#ccb591";
    ctx.fillRect(ox - 3, head[1], 6, 6);
    ctx.fillStyle =
      type === "engineer" ? "#d1b963" : type === "spy" ? "#68777b" : "#364943";
    ctx.beginPath();
    ctx.ellipse(ox, head[1], 4.2, 3, 0, 0, 6.3);
    ctx.fill();
    ctx.strokeStyle = type === "engineer" ? "#aa9e66" : "#1b2d30";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox + 1, head[1] + 10);
    ctx.lineTo(dir[0] + 3, head[1] + 7 + (dir[1] - oy) * 0.35);
    ctx.stroke();
    if (type === "engineer" || type === "spy") {
      ctx.fillStyle = "#75664c";
      ctx.fillRect(ox + 4, head[1] + 10, 4, 5);
    }
  } else if (type === "dog") {
    p.box(-0.24, -0.1, 0.08, 0.48, 0.2, 0.19, "#827052");
    p.box(0.21, -0.11, 0.17, 0.17, 0.2, 0.2, "#4c4c3d");
    for (const x of [-0.17, 0.17])
      for (const y of [-0.09, 0.09])
        p.box(x + (walk ? 0.04 : 0), y, 0, 0.07, 0.06, 0.16, "#343f35");
    p.flush();
  } else if (type === "kirov") {
    for (let u = 0; u < 12; u++)
      for (let v = 0; v < 12; v++) {
        const theta1 = (Math.PI * u) / 12,
          theta2 = (Math.PI * (u + 1)) / 12,
          phi1 = (TWO_PI_LOCAL * v) / 12,
          phi2 = (TWO_PI_LOCAL * (v + 1)) / 12;
        const point = (theta, phi) => [
          Math.cos(theta) * 1.55,
          Math.sin(theta) * Math.cos(phi) * 0.54,
          1.0 + Math.sin(theta) * Math.sin(phi) * 0.53,
        ];
        p.poly(
          [
            point(theta1, phi1),
            point(theta2, phi1),
            point(theta2, phi2),
            point(theta1, phi2),
          ],
          shade("#a3a88b", 0.75 + Math.sin(phi1) * 0.2 + Math.cos(phi1) * 0.08),
          "rgba(48,62,50,.20)",
          0.45,
        );
      }
    p.box(-0.35, -0.18, 0.18, 0.7, 0.36, 0.25, "#637568");
    p.box(-0.2, -0.19, 0.35, 0.35, 0.38, 0.08, team);
    p.poly(
      [
        [-1.1, 0, 0.8],
        [-1.7, 0, 0.3],
        [-1.45, 0, 1.25],
      ],
      team,
    );
    p.poly(
      [
        [-1.2, 0, 1],
        [-1.65, -0.55, 0.8],
        [-1.65, 0.55, 0.8],
      ],
      "#7b876e",
    );
    p.flush();
  } else if (["helicopter", "fighter"].includes(type)) {
    if (type === "helicopter") {
      p.box(-0.5, -0.2, 0.15, 0.72, 0.4, 0.29, armor);
      p.box(0.15, -0.16, 0.16, 0.32, 0.32, 0.22, "#3e626a");
      p.box(-1.02, -0.07, 0.27, 0.6, 0.14, 0.11, team);
      p.box(-1.1, -0.15, 0.32, 0.17, 0.3, 0.2, armor);
      for (const y of [-0.28, 0.28])
        p.box(-0.48, y, 0.05, 0.95, 0.035, 0.035, "#374b4e");
      p.cylinder(-0.17, 0, 0.44, 0.06, 0.16, "#46594f");
    } else {
      p.poly(
        [
          [0.85, 0, 0.15],
          [-0.6, -0.16, 0.16],
          [-0.6, 0.16, 0.16],
        ],
        "#a5b0a0",
      );
      p.poly(
        [
          [0.2, 0, 0.2],
          [-0.55, -0.8, 0.12],
          [-0.3, 0, 0.12],
          [-0.55, 0.8, 0.12],
        ],
        armor,
      );
      p.poly(
        [
          [-0.65, -0.37, 0.18],
          [-0.45, 0, 0.5],
          [-0.65, 0.37, 0.18],
        ],
        team,
      );
      p.box(0.12, -0.055, 0.18, 0.28, 0.11, 0.12, "#355965");
    }
    p.flush();
  } else if (["destroyer", "transport"].includes(type)) {
    p.poly(
      [
        [-1.15, -0.37, 0.1],
        [0.75, -0.37, 0.1],
        [1.2, 0, 0.12],
        [0.75, 0.37, 0.1],
        [-1.15, 0.37, 0.1],
      ],
      "#3e5558",
    );
    p.poly(
      [
        [-1.05, -0.3, 0.23],
        [0.7, -0.3, 0.23],
        [1, 0, 0.25],
        [0.7, 0.3, 0.23],
        [-1.05, 0.3, 0.23],
      ],
      armor,
    );
    p.box(-0.35, -0.21, 0.23, 0.65, 0.42, 0.42, team);
    p.box(-0.28, -0.17, 0.65, 0.4, 0.34, 0.14, "#afbbb0");
    p.box(-0.72, -0.12, 0.23, 0.22, 0.24, 0.5, "#747f6e");
    if (type === "destroyer")
      p.box(0.45, -0.17, 0.25, 0.28, 0.34, 0.2, "#718279");
    p.flush();
  } else {
    const heavy = ["mammoth", "mcv"].includes(type),
      len = type === "miner" ? 1.22 : heavy ? 1.3 : 0.96,
      width = heavy ? 0.8 : 0.65;
    for (const side of [-1, 1]) {
      p.box(
        -len * 0.5,
        side * width * 0.5 - 0.105,
        0.04,
        len,
        0.21,
        0.21,
        "#35433d",
      );
      for (let i = 0; i < 5; i++)
        p.box(
          -len * 0.45 + i * len * 0.2,
          side * width * 0.5 - 0.11,
          0.08,
          0.12,
          0.23,
          0.14,
          walk % 2 ? "#535d4b" : "#66705c",
        );
    }
    p.box(
      -len * 0.48,
      -width * 0.38,
      0.22,
      len * 0.96,
      width * 0.76,
      0.24,
      armor,
    );
    p.poly(
      [
        [-len * 0.5, -width * 0.38, 0.38],
        [len * 0.49, -width * 0.32, 0.33],
        [len * 0.35, width * 0.35, 0.48],
        [-len * 0.36, width * 0.38, 0.48],
      ],
      shade(armor, 1.14),
    );
    p.box(
      -len * 0.32,
      -width * 0.32,
      0.46,
      len * 0.28,
      width * 0.64,
      0.08,
      team,
    );
    if (type === "miner") {
      p.box(-0.49, -0.26, 0.45, 0.68, 0.52, 0.28, "#958b69");
      p.box(-0.44, -0.21, 0.72, 0.58, 0.42, 0.05, "#4c584a");
      p.box(0.22, -0.21, 0.44, 0.32, 0.42, 0.25, team);
      p.box(0.35, -0.2, 0.56, 0.12, 0.4, 0.11, "#3c6265");
    } else if (type === "mcv") {
      p.box(-0.52, -0.27, 0.48, 0.7, 0.54, 0.48, "#999b83");
      p.roof(-0.54, -0.29, 0.96, 0.74, 0.58, 0.12, team);
      p.box(0.23, -0.24, 0.44, 0.33, 0.48, 0.3, armor);
      p.box(0.38, -0.22, 0.61, 0.1, 0.44, 0.13, "#345a61");
    } else if (type === "apc") {
      p.box(-0.31, -0.22, 0.43, 0.57, 0.44, 0.26, team);
      p.box(0.2, -0.18, 0.52, 0.17, 0.36, 0.12, "#344f52");
    } else if (type === "artillery") {
      p.box(-0.35, -0.21, 0.43, 0.5, 0.42, 0.22, team);
      p.box(-0.02, -0.07, 0.65, 0.9, 0.14, 0.12, "#687a6e");
      p.box(0.76, -0.1, 0.65, 0.18, 0.2, 0.14, "#344d49");
    } else if (type === "antiAir") {
      p.box(-0.25, -0.23, 0.43, 0.5, 0.46, 0.22, team);
      for (const y of [-0.15, 0.15])
        p.box(-0.33, y - 0.05, 0.68, 0.66, 0.1, 0.14, "#a4ac99");
    } else if (type === "prism") {
      p.cylinder(0, 0, 0.43, 0.18, 0.3, team);
      p.poly(
        [
          [-0.16, 0, 0.75],
          [0, -0.16, 0.75],
          [0.16, 0, 0.75],
          [0, 0.16, 0.75],
          [0, 0, 1.02],
        ],
        "#a4d5ce",
      );
    }
    p.flush();
  }
  return { canvas: c, ox, oy };
}

export function drawTurret(ctx, x, y, angle, team, scale = 1, heavy = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const p = new IsoPaint(ctx, 0, -15, 32, angle);
  p.box(-0.23, -0.2, 0, 0.46, 0.4, 0.19, team);
  for (const side of heavy ? [-0.11, 0.11] : [0]) {
    p.box(0.05, side - 0.035, 0.13, 0.65, 0.07, 0.07, "#546b60");
    p.box(0.63, side - 0.052, 0.11, 0.1, 0.104, 0.104, "#304b43");
  }
  p.flush();
  ctx.restore();
}
