// Load authored, transparent in-game art. Each image is a scene object, not a
// battlefield background. Native procedural sprites remain a loading fallback.
export const BUILDING_SPRITE_TYPES = [
  "constructionYard",
  "powerPlant",
  "barracks",
  "refinery",
  "warFactory",
  "radar",
  "techLab",
  "airfield",
  "shipyard",
  "repairDepot",
  "pillbox",
  "airDefense",
  "defenseTower",
  "superweapon",
  "oilDerrick",
  "hospital",
];
export const SPECIAL_BUILDING_TYPES = [
  "weatherControl",
  "chronoSphere",
  "teslaCoil",
  "railStation",
];
export const DIRECTIONAL_UNIT_TYPES = [
  "mcv",
  "miner",
  "tank",
  "mammoth",
  "apc",
  "artillery",
  "antiAir",
  "prism",
  "infantry",
  "engineer",
  "spy",
  "dog",
  "fighter",
  "helicopter",
  "destroyer",
  "transport",
  "kirov",
];
export const TERRAIN_TEXTURE_TYPES = [
  "grass",
  "dirt",
  "sand",
  "concrete",
  "road",
  "water",
  "snow",
  "rock",
  "ice",
  "winterSnow",
  "marsh",
  "cliff",
];
export const SCENERY_TYPES = [
  "pine",
  "snowPine",
  "trees",
  "rock",
  "snowRock",
  "sandRock",
  "cottage",
  "snowCottage",
  "ruin",
];
const UNIT_WIDTH = {
  mcv: 82,
  miner: 76,
  tank: 66,
  mammoth: 84,
  apc: 64,
  artillery: 78,
  antiAir: 64,
  prism: 68,
  fighter: 94,
  helicopter: 96,
  destroyer: 108,
  transport: 92,
  kirov: 138,
};
const UNIT_HEIGHT = { infantry: 36, engineer: 36, spy: 38, dog: 26 };
export function facingIndex(angle = 0) {
  const turn = Math.PI * 2;
  return Math.round((((angle % turn) + turn) % turn) / (Math.PI / 2)) % 4;
}

export class SpriteAtlas {
  constructor(onLoad = () => {}) {
    this.onLoad = onLoad;
    this.assets = new Map();
    this.sprites = new Map();
    this.failed = new Set();
    this.disposed = false;
    this.generation = 0;
    this.load();
  }
  load() {
    for (const type of SCENERY_TYPES)
      this.request(
        `scenery:${type}`,
        new URL(`../assets/sprites/scenery/${type}.webp`, import.meta.url).href,
      );
    for (const type of BUILDING_SPRITE_TYPES)
      this.request(
        `building:${type}`,
        new URL(`../assets/sprites/buildings/${type}.webp`, import.meta.url)
          .href,
      );
    for (const type of SPECIAL_BUILDING_TYPES)
      this.request(
        `special:${type}`,
        new URL(`../assets/sprites/special/${type}.webp`, import.meta.url).href,
      );
    for (const type of DIRECTIONAL_UNIT_TYPES)
      for (let direction = 0; direction < 4; direction++)
        this.request(
          `unit:${type}:${direction}`,
          new URL(
            `../assets/sprites/units/${type}-${direction}.webp`,
            import.meta.url,
          ).href,
        );
  }
  request(key, url) {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (this.disposed) return;
      try {
        const source = this.trim(image);
        if (!source) return;
        this.assets.set(key, source);
        this.failed.delete(key);
        this.generation++;
        this.onLoad(key);
      } catch {
        this.failed.add(key);
      }
    };
    image.onerror = () => {
      if (!this.disposed) this.failed.add(key);
    };
    image.src = url;
  }
  trim(image) {
    const c = document.createElement("canvas");
    c.width = image.naturalWidth || image.width;
    c.height = image.naturalHeight || image.height;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, c.width, c.height).data;
    let minX = c.width,
      minY = c.height,
      maxX = -1,
      maxY = -1;
    for (let y = 0; y < c.height; y++)
      for (let x = 0; x < c.width; x++)
        if (pixels[(y * c.width + x) * 4 + 3] > 12) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
    if (maxX < minX || maxY < minY) return null;
    return {
      image,
      x: Math.max(0, minX - 2),
      y: Math.max(0, minY - 2),
      w: Math.min(c.width, maxX + 3) - Math.max(0, minX - 2),
      h: Math.min(c.height, maxY + 3) - Math.max(0, minY - 2),
    };
  }
  get(type, definition = null, angle = 0, variant = null) {
    const key =
        definition && variant
          ? `special:${variant}`
          : definition
            ? `building:${type}`
            : `unit:${type}:${facingIndex(angle)}`,
      asset = this.assets.get(key);
    if (!asset) return null;
    const cacheKey = `${key}/${definition?.w || 0}/${definition?.h || 0}`;
    if (this.sprites.has(cacheKey)) return this.sprites.get(cacheKey);
    const fixedHeight = !definition && UNIT_HEIGHT[type];
    const logicalWidth = definition
        ? (definition.w + definition.h) * 32 * 1.04
        : fixedHeight
          ? (fixedHeight * asset.w) / asset.h
          : UNIT_WIDTH[type] || 72,
      logicalHeight = fixedHeight || (logicalWidth * asset.h) / asset.w;
    // Preserve source resolution for DPR/zoom; anchors are measured in logical
    // world pixels while alpha hit-tests address source pixels.
    const c = document.createElement("canvas");
    c.width = asset.w;
    c.height = asset.h;
    const ctx = c.getContext("2d");
    ctx.drawImage(
      asset.image,
      asset.x,
      asset.y,
      asset.w,
      asset.h,
      0,
      0,
      c.width,
      c.height,
    );
    const sprite = {
      canvas: c,
      width: logicalWidth,
      height: logicalHeight,
      pixelRatio: asset.w / logicalWidth,
      ox: definition
        ? logicalWidth / 2 - (definition.w - definition.h) * 16
        : logicalWidth / 2,
      oy: definition
        ? logicalHeight - (definition.w + definition.h) * 16
        : logicalHeight - (fixedHeight ? 3 : 9),
      source: "atlas",
      direction: definition ? null : facingIndex(angle),
      bounds: { x: 0, y: 0, w: c.width, h: c.height },
      key,
    };
    this.sprites.set(cacheKey, sprite);
    return sprite;
  }
  get status() {
    return {
      loaded: this.assets.size,
      expected:
        BUILDING_SPRITE_TYPES.length +
        SPECIAL_BUILDING_TYPES.length +
        SCENERY_TYPES.length +
        DIRECTIONAL_UNIT_TYPES.length * 4,
      failed: [...this.failed],
      generation: this.generation,
    };
  }
  dispose() {
    this.disposed = true;
    this.assets.clear();
    this.sprites.clear();
    this.failed.clear();
  }
}

export class TerrainAtlas {
  constructor(onLoad = () => {}) {
    this.images = new Map();
    this.failed = new Set();
    this.disposed = false;
    for (const kind of TERRAIN_TEXTURE_TYPES) {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        if (this.disposed) return;
        this.images.set(kind, image);
        onLoad(kind);
      };
      image.onerror = () => {
        if (!this.disposed) this.failed.add(kind);
      };
      image.src = new URL(
        `../assets/textures/${kind}.webp`,
        import.meta.url,
      ).href;
    }
  }
  get(kind, surface = null) {
    const material =
      surface === "runway"
        ? "road"
        : surface === "snow"
          ? "winterSnow"
          : ["sand", "ice", "marsh", "cliff"].includes(surface)
            ? surface
            : surface
              ? "concrete"
              : kind === "ore" || kind === "gem"
                ? "dirt"
                : kind;
    return this.images.get(material) || null;
  }
  get status() {
    return {
      loaded: this.images.size,
      expected: TERRAIN_TEXTURE_TYPES.length,
      failed: [...this.failed],
    };
  }
  dispose() {
    this.disposed = true;
    this.images.clear();
    this.failed.clear();
  }
}
