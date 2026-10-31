/* Seven Swords v5 — six detailed materials drawn from eight-frame imagegen
   sprite sheets. The approved v4 Hongmao geometry is preserved verbatim.
   Every animated surface remains real world-space x/y/z geometry. */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, t) => { const u = clamp((t - a) / (b - a)); return u * u * (3 - 2 * u); };
  const fract = x => x - Math.floor(x);
  const hash = n => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453123);
  const PALETTES = {
    hongmao: { body: '#ee583c', shade: '#a53035', edge: '#ffc26b', core: '#fff4c3', mist: '#ec7e46' },
    lantu: { body: '#88c8f0', shade: '#638dcc', edge: '#c9edff', core: '#f2ffff', mist: '#a5e8f4' },
    sali: { body: '#a27be7', shade: '#6150a5', edge: '#d4b2ff', core: '#fff0ff', mist: '#b285d8' },
    doudou: { body: '#a9d8bb', shade: '#669f97', edge: '#e0efc8', core: '#fffbe1', mist: '#acd8b9' },
    daben: { body: '#dca54e', shade: '#8c623f', edge: '#ffdc8d', core: '#fff9d7', mist: '#d6b577' },
    tiaotiao: { body: '#69cbc9', shade: '#348aa8', edge: '#b9f4e5', core: '#f0fff3', mist: '#78d9c2' },
    dada: { body: '#b6ce93', shade: '#5b9680', edge: '#e4edb5', core: '#ffffde', mist: '#a4c5ad' }
  };
  const LIMITS = Object.freeze({ effects: 26, attackEffects: 7, primitives: 1550, vertices: 10800, glowStrokes: 30 });
  const vec = (x, y, z = 0) => ({ x, y, z });
  const add = (a, b, t = 1) => vec(a.x + b.x * t, a.y + b.y * t, a.z + b.z * t);
  const lerp = (a, b, t) => vec(mix(a.x, b.x, t), mix(a.y, b.y, t), mix(a.z, b.z, t));
  const bezier = (p0, p1, p2, p3, t) => { const u = 1 - t; return vec(u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x, u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y, u * u * u * p0.z + 3 * u * u * t * p1.z + 3 * u * t * t * p2.z + t * t * t * p3.z); };

  class Geometry {
    constructor() { this.primitives = []; this.vertices = 0; this.particles = 0; this.glows = 0; }
    put(points, color, alpha, opt = {}) {
      if (alpha < .008 || this.primitives.length >= LIMITS.primitives || this.vertices + points.length > LIMITS.vertices) return;
      if (!points.every(p => Number.isFinite(p.x + p.y + p.z))) return;
      const depth = points.reduce((s, p) => s + p.x + p.y, 0) / points.length;
      this.primitives.push(Object.assign({ points, color, alpha: clamp(alpha), depth, width: 1, fill: true }, opt));
      this.vertices += points.length;
    }
    line(points, color, alpha, width = 1, glow = false, ground = false) {
      this.put(points, color, alpha, { fill: false, width, glow: glow && this.glows++ < LIMITS.glowStrokes, ground });
    }
    ring(cx, cy, r, z, color, alpha, width = 1, span = TAU, start = 0, ground = false) {
      const points = []; const n = Math.max(14, Math.ceil(span * 7));
      for (let i = 0; i <= n; i++) { const a = start + i / n * span; points.push(vec(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z)); }
      this.line(points, color, alpha, width, false, ground);
    }
    ribbon(fn, normal, widthFn, n, pal, alpha, opt = {}) {
      const ps = Array.from({ length: n + 1 }, (_, i) => fn(i / n));
      const ends = ps.map((p, i) => { const u = i / n, w = widthFn(u), v = normal(u); return [add(p, v, -w), add(p, v, w)]; });
      for (let i = 0; i < n; i++) {
        if (opt.fragment && hash(i * 13 + 9) > 1 - opt.fragment) continue;
        const a = ends[i], b = ends[i + 1];
        // A continuous translucent membrane with an emissive hot inner layer.
        // Per-segment alternating albedo creates a checkerboard at game scale;
        // the band instead gets its relief from taper, curvature and edge light.
        this.put([a[0], b[0], b[1], a[1]], pal.body, alpha * .64, { ground: !!opt.ground });
        this.put([a[0], b[0], lerp(b[0], b[1], .25), lerp(a[0], a[1], .25)], pal.edge, alpha * .87, { ground: !!opt.ground, blend: 'screen' });
        this.line([a[0], b[0]], pal.edge, alpha * 1.35, opt.edgeWidth || 1.8, i % 7 === 0, !!opt.ground);
        this.line([lerp(a[0], a[1], .08), lerp(b[0], b[1], .08)], pal.core, alpha * 1.14, 1.05, false, !!opt.ground);
      }
      if (opt.spine) this.line(ps, pal.core, alpha * .85, 1.1);
    }
  }
  const loc = (e, x, y, z = 0) => { const a = e.angle || 0; return vec(e.x + Math.cos(a) * x - Math.sin(a) * y, e.y + Math.sin(a) * x + Math.cos(a) * y, z); };
  function sword(g, base, angle, length, width, pal, alpha, tilt = .65) {
    const axis = vec(Math.cos(angle) * Math.sin(tilt), Math.sin(angle) * Math.sin(tilt), Math.cos(tilt));
    const side = vec(-Math.sin(angle), Math.cos(angle), 0);
    const root = add(base, axis, 8), shoulder = add(base, axis, length * .73), tip = add(base, axis, length);
    const l = add(shoulder, side, width), r = add(shoulder, side, -width);
    const lb = add(root, side, width * .58), rb = add(root, side, -width * .58);
    g.put([root, lb, l, tip], pal.body, alpha * .72);
    g.put([root, tip, r, rb], pal.shade, alpha * .63);
    g.line([lb, l, tip, r, rb], pal.edge, alpha, 1.2, true);
    g.line([root, tip], pal.core, alpha, 1.35);
    g.line([add(base, side, width * 1.9), add(base, side, -width * 1.9)], pal.edge, alpha, 2.1);
    g.line([add(base, axis, -14), root], pal.core, alpha * .8, 2.6);
  }
  function leaf(g, p, angle, size, pal, alpha, spin = 0) {
    const d = vec(Math.cos(angle), Math.sin(angle), Math.sin(spin) * .45), n = vec(-Math.sin(angle), Math.cos(angle), .23);
    const tip = add(p, d, size), end = add(p, d, -size * .65), mid = add(p, n, size * .34);
    g.put([tip, mid, end, add(p, n, -size * .22)], pal.edge, alpha);
    g.line([tip, end], pal.core, alpha, .7); g.particles++;
  }
  function blossom(g, p, size, pal, alpha, spin = 0) {
    for (let k = 0; k < 5; k++) {
      const a = spin + k * TAU / 5, d = vec(Math.cos(a), Math.sin(a), .15), n = vec(-Math.sin(a), Math.cos(a), 0);
      const mid = add(p, d, size * .65), tip = add(p, d, size);
      g.put([p, add(mid, n, size * .3), add(tip, vec(0, 0, 1), size * .4), add(mid, n, -size * .3)], pal.core, alpha * .8);
    }
    g.particles++;
  }
  function shards(g, e, t, count, pal, radius, height, alpha, kind = 'spark') {
    for (let i = 0; i < count; i++) {
      const phase = fract(t * .5 + hash(i + e.seed) * 1.7), a = i * 2.399963 + t * (kind === 'leaf' ? 1.7 : .6), r = radius * (.34 + .62 * hash(i * 3 + e.seed)) * (.75 + phase * .35);
      const p = vec(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 9 + phase * height), fade = Math.sin(phase * Math.PI) * alpha;
      if (kind === 'leaf') leaf(g, p, a + 1.4, 7 + hash(i) * 6, pal, fade, t * 2 + i);
      else { const trail = add(p, vec(-Math.sin(a) * 8, Math.cos(a) * 8, -13)); g.line([trail, p], i % 3 ? pal.edge : pal.core, fade, i % 4 ? 1.2 : 2); g.particles++; }
    }
  }
  function attackModel(g, e, t, pal) {
    const u = clamp(t / e.duration), left = e.hand === 'left' ? -1 : 1, flip = e.combo % 2 ? left : -left;
    const a = e.angle + mix(-e.half * flip, e.half * flip, 1 - Math.pow(1 - u, 2.8));
    const tail = e.half * 1.45 * flip, r = e.radius * (.76 + .24 * u), alpha = Math.sin(Math.PI * Math.pow(u, .55)) * .75;
    const p = e.equipment !== 'sword' ? { body: '#ac9871', shade: '#73674f', edge: '#e0cea0', core: '#fff1cf' } : pal;
    g.ribbon(v => { const an = a - tail * (1 - v); return vec(e.x + Math.cos(an) * r, e.y + Math.sin(an) * r, 30 + Math.sin(v * Math.PI) * 18 + (e.combo % 3 === 0 ? 15 * v : 0)); }, v => { const an = a - tail * (1 - v); return vec(Math.cos(an) * .9, Math.sin(an) * .9, .25); }, v => Math.sin(v * Math.PI) * (e.combo % 3 === 0 ? 13 : 8), 18, p, alpha, { edgeWidth: 1.5 });
    g.line([vec(e.x, e.y, 37), vec(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 38)], p.core, alpha * .24, 1);
  }
  function fire(g, e, t, pal) {
    const ult = e.tier === 'e', charge = smooth(0, .28, t), release = smooth(.24, .67, t), collapse = smooth(2.02, 2.78, t), fade = 1 - smooth(e.duration - .62, e.duration, t);
    if (!ult) {
      const u = clamp(t / e.duration), travel = smooth(.12, .72, t), r = e.radius * (.42 + travel * .72), alpha = Math.sin(Math.PI * u) * .72;
      g.ribbon(v => { const a = e.angle - 1.38 + v * 2.76; return vec(e.x + Math.cos(a) * r + Math.cos(e.angle) * travel * 65, e.y + Math.sin(a) * r + Math.sin(e.angle) * travel * 65, 22 + Math.sin(v * Math.PI) * 50); }, v => vec(Math.cos(e.angle - 1.38 + v * 2.76) * .7, Math.sin(e.angle - 1.38 + v * 2.76) * .7, .75), v => (13 + 10 * Math.sin(v * 23 + t * 6)) * Math.sin(v * Math.PI), 30, pal, alpha, { spine: true });
      shards(g, e, t, 16, pal, r, 85, alpha * .75); return;
    }
    const radius = e.radius * (.55 + .4 * release + .27 * collapse), spin = t * (e.reduced ? 3.2 : 5.2) + .9;
    const envelope = charge * fade;
    // The concept's slanted horizontal flow is a low sheet, not a flat halo.
    for (let k = 0; k < 2; k++) {
      const off = k * Math.PI + spin;
      g.ribbon(u => { const a = off + u * TAU * .88, r = radius * (.7 + u * .2) + Math.sin(u * 21 - t * 7) * 6; return vec(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 14 + Math.sin(a + .7) * 15 + Math.sin(u * Math.PI) * 24); }, u => { const a = off + u * TAU * .88; return vec(Math.cos(a) * .65, Math.sin(a) * .65, .62); }, u => (11 + release * 12) * Math.pow(Math.sin(u * Math.PI), .7) * (1 + .38 * Math.sin(u * 43 - t * 12)), 44, pal, envelope * .64);
    }
    if (release > .01) for (let k = 0; k < 2; k++) {
      const twist = spin + k * Math.PI, height = 225 * release * (1 - collapse * .56), turns = 1.65;
      const curve = u => { const a = twist + u * TAU * turns, r = (67 + Math.pow(u, .7) * 125 + Math.sin(u * 17 - t * 7) * 6) * release + collapse * 85; return vec(e.x + Math.cos(a) * r + u * 24, e.y + Math.sin(a) * r - u * 18, 27 + u * height); };
      g.ribbon(curve, u => { const a = twist + u * TAU * turns; return vec(Math.cos(a) * .24, Math.sin(a) * .24, .97); }, u => (18 + Math.sin(u * Math.PI) * 12) * (1 - collapse * .75) * Math.pow(Math.sin(Math.PI * u), .6) * (.85 + .32 * Math.sin(u * 64 - t * 11)), 76, pal, release * fade * .70, { edgeWidth: 2.4, fragment: collapse * .72 });
      // Swept flame tongues are sharp tapered blades leaving the hot ribbon edge.
      for (let i = 0; i < 19; i++) {
        const u = (i + .5) / 20, p = curve(u), a = twist + u * TAU * turns;
        const tongue = 23 + hash(i) * 36, tip = add(p, vec(-Math.sin(a) * tongue, Math.cos(a) * tongue, 17 + hash(i + 3) * 28));
        const root = add(p, vec(0, 0, 1), 8), elbow = add(p, vec(-Math.sin(a) * tongue * .2, Math.cos(a) * tongue * .2, 25));
        g.put([add(p, vec(0, 0, 1), -4), root, elbow, tip], i % 3 ? pal.body : pal.edge, release * fade * .68);
        g.line([root, lerp(root, tip, .7)], pal.edge, release * fade * .58, 1.4);
      }
    }
    if (t < .62) sword(g, vec(e.x, e.y, 45), e.angle, 90 * charge, 7, pal, (1 - release) * .7, .2);
    if (collapse > 0) { g.ring(e.x, e.y, 165 + collapse * 200, 9, pal.core, (1 - collapse) * .63, 2.1); g.ring(e.x, e.y, 140 + collapse * 215, 6, pal.edge, (1 - collapse) * .36, 5); }
    shards(g, e, t, e.reduced ? 23 : 48, pal, radius, 225, envelope * .75);
  }
  function iceCrystal(g, base, a, radius, height, pal, alpha) {
    const radial = vec(Math.cos(a), Math.sin(a), 0), side = vec(-Math.sin(a), Math.cos(a), 0);
    const tip = add(add(base, radial, height * .17), vec(0, 0, 1), height), crest = add(base, vec(0, 0, 1), height * .43);
    const l = add(base, side, radius), r = add(base, side, -radius), back = add(base, radial, -radius * .8), front = add(base, radial, radius * .8);
    g.put([back, l, tip], pal.shade, alpha * .58); g.put([l, front, tip], pal.body, alpha * .58); g.put([front, r, tip], pal.core, alpha * .54);
    g.line([back, l, front, r, tip, l], pal.edge, alpha, 1.1); g.line([front, crest, tip], pal.core, alpha, 1);
  }
  function ice(g, e, t, pal) {
    const ult = e.tier === 'e', raise = smooth(.12, .57, t), fade = 1 - smooth(e.duration - .65, e.duration, t), r = e.radius * (.74 + .26 * raise), n = ult ? 14 : 9;
    for (let i = 0; i < n; i++) {
      const a = i * TAU / n + e.angle, front = Math.cos(a) + Math.sin(a) > .25, pulse = .78 + .22 * Math.sin(t * 2.3 + i);
      const p = vec(e.x + Math.cos(a) * r * (.86 + .1 * hash(i)), e.y + Math.sin(a) * r * (.86 + .1 * hash(i)), 2);
      const h = (ult ? front ? 40 : 105 : front ? 27 : 68) * raise * (i % 3 === 0 ? 1.25 : 1) * (fade < .7 ? fade : 1);
      iceCrystal(g, p, a, 15 + (i % 3) * 5, h, pal, fade * raise * .88);
      if (ult && i % 2 === 0) iceCrystal(g, add(p, vec(Math.cos(a + .4), Math.sin(a + .4), 0), 25), a + .4, 8, h * .52, pal, fade * raise * .62);
      const p2 = vec(e.x + Math.cos(a) * r * .35, e.y + Math.sin(a) * r * .35, 2);
      g.line([p2, lerp(p2, p, .55), p], pal.edge, raise * fade * .22 * pulse, 1.2, false, true);
    }
    const spin = t * 1.5, ringAlpha = raise * fade;
    for (let k = 0; k < (ult ? 2 : 1); k++) g.ribbon(u => { const a = e.angle + spin + k * Math.PI + u * Math.PI * 1.25; return vec(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 15 + Math.sin(u * Math.PI) * (ult ? 63 : 40)); }, u => { const a = e.angle + spin + k * Math.PI + u * Math.PI * 1.25; return vec(Math.cos(a) * .65, Math.sin(a) * .65, .55); }, u => 8 * Math.sin(u * Math.PI), 27, pal, ringAlpha * .47);
    for (let i = 0; i < (ult ? 30 : 16); i++) {
      const a = i * 2.399, rad = r * (.2 + hash(i + e.seed) * .83), z = 16 + fract(hash(i) + t * .16) * 135, p = vec(e.x + Math.cos(a) * rad, e.y + Math.sin(a) * rad, z);
      const s = 2.5 + hash(i + 7) * 2, alpha = ringAlpha * Math.sin(fract(hash(i) + t * .16) * Math.PI) * .8;
      g.line([add(p, vec(-s, 0, 0)), add(p, vec(s, 0, 0))], pal.core, alpha, 1); g.line([add(p, vec(0, 0, -s)), add(p, vec(0, 0, s))], pal.edge, alpha, 1); g.particles++;
    }
    g.ring(e.x, e.y, r * .98, 2, pal.edge, raise * fade * .38, 1.2, TAU, 0, true);
  }
  function purple(g, e, t, pal) {
    const ult = e.tier === 'e', n = 3, fade = 1 - smooth(e.duration - .6, e.duration, t), handed = e.hand === 'left' ? -1 : 1;
    for (let k = 0; k < n; k++) {
      const age = Math.max(0, t - k * .13), grow = smooth(0, .37, age), alpha = grow * fade * .62, z = 24 + k * (ult ? 44 : 16);
      const r = e.radius * (ult ? 1.04 : .9), curl = Math.sin(age * 3.5 + k * .7) * 23;
      const ps = [loc(e, -r * .65, handed * (-r * .65 + k * 20), z + 65), loc(e, -r * 1.15, handed * (r * .72 + curl), z + 100), loc(e, r * .5, handed * (-r * .7 + curl), z + 45), loc(e, r * grow, handed * (r * .36 - k * 30), z)];
      g.ribbon(u => bezier(...ps, u), u => { const a = bezier(...ps, clamp(u + .015)), b = bezier(...ps, clamp(u - .015)); const d = Math.hypot(a.x - b.x, a.y - b.y) || 1; return vec(-(a.y - b.y) / d, (a.x - b.x) / d, .42); }, u => Math.pow(Math.sin(Math.PI * u), .7) * (ult ? 17 : 12) * (.8 + .2 * Math.sin(u * 23 - age * 5)), 33, pal, alpha, { spine: true });
      const tip = ps[3], before = bezier(...ps, .9), a = Math.atan2(tip.y - before.y, tip.x - before.x);
      sword(g, add(tip, vec(-Math.cos(a), -Math.sin(a), -.12), 30), a, ult ? 87 : 65, ult ? 8 : 6, pal, alpha * 1.25, 1.5);
      for (let j = 1; j < 7; j++) {
        const u = j / 9, p = bezier(...ps, u), r2 = (7 + (j % 3) * 3) * Math.sin(grow * Math.PI / 2);
        const pts = []; for (let q = 0; q <= 12; q++) { const a2 = q / 12 * TAU * .8 + age; pts.push(add(p, vec(Math.cos(a2) * r2, Math.sin(a2) * r2, q * 1.2))); }
        g.line(pts, pal.edge, alpha * .27, 1);
      }
    }
    shards(g, e, t, ult ? 29 : 12, pal, e.radius * .8, 165, fade * .45);
  }
  function rain(g, e, t, pal) {
    const ult = e.tier === 'e', bloom = smooth(.08, .5, t), fade = 1 - smooth(e.duration - .55, e.duration, t), count = ult ? 7 : 5, r = e.radius * bloom;
    for (let k = 0; k < count; k++) {
      const a = e.angle + k * TAU / count, lift = ult ? 176 : 110;
      const fn = u => vec(e.x + Math.cos(a) * r * u, e.y + Math.sin(a) * r * u, 24 * (1 - u) + Math.sin(Math.PI * u) * lift);
      const points = Array.from({ length: 23 }, (_, i) => fn(i / 22));
      g.line(points, pal.edge, bloom * fade * .27, 1.1);
      for (let j = 0; j < 5; j++) {
        const u = fract(t * .4 + j / 5 + k * .091), p = fn(u), alpha = Math.sin(u * Math.PI) * bloom * fade;
        const s = 3.4 + (ult ? 2.5 : 1) * Math.sin(u * Math.PI), top = add(p, vec(0, 0, 1), s * 2.4);
        g.put([top, add(p, vec(-s, 0, 0)), add(p, vec(0, 0, -s)), add(p, vec(s, 0, 0))], pal.edge, alpha * .8); g.line([top, add(p, vec(0, 0, -s))], pal.core, alpha, .9); g.particles++;
      }
      const end = fn(1), ripple = fract(t * .9 + k * .12);
      g.ring(end.x, end.y, 8 + ripple * 29, 2, pal.edge, (1 - ripple) * bloom * fade * .65, 1, TAU, 0, true);
      blossom(g, add(end, vec(0, 0, 1), 3), 10 * bloom, pal, bloom * fade * .65, a);
      if (ult && k % 2 === 0) blossom(g, fn(.47 + .08 * Math.sin(t + k)), 8, pal, bloom * fade * .58, a + t);
    }
    shards(g, e, t, ult ? 22 : 12, pal, r * .9, 126, bloom * fade * .45, 'leaf');
  }
  function jagged(g, start, end, pal, alpha, seed, width = 1.8, branches = true) {
    const d = vec(end.x - start.x, end.y - start.y, end.z - start.z), pts = [start], n = 9;
    for (let i = 1; i < n; i++) { const u = i / n, p = lerp(start, end, u), amp = Math.sin(u * Math.PI) * (13 + width * 1.8); pts.push(add(p, vec((hash(seed + i) - .5) * amp, (hash(seed * 2 + i) - .5) * amp, (hash(seed * 3 + i) - .5) * amp))); } pts.push(end);
    g.line(pts, pal.body, alpha * .24, width * 5); g.line(pts, pal.edge, alpha, width, true); g.line(pts, pal.core, alpha, width * .38);
    if (branches) for (let i = 2; i < n; i += 3) { const p = pts[i], end2 = add(p, vec((hash(seed + i + 100) - .5) * 76, (hash(seed + i + 200) - .5) * 76, -22)); g.line([p, lerp(p, end2, .54), end2], pal.edge, alpha * .56, .85); }
  }
  function thunder(g, e, t, pal) {
    const ult = e.tier === 'e', count = ult ? 3 : 1;
    for (let k = 0; k < count; k++) {
      const localAge = t - (ult ? .35 + k * .54 : .22), prep = smooth(-.22, 0, localAge), hit = localAge >= 0 ? Math.exp(-localAge * 2.7) : 0, a = e.angle + k * TAU / 3;
      const distance = ult ? 145 : 90, p = vec(e.x + Math.cos(a) * distance, e.y + Math.sin(a) * distance, 0);
      if (localAge < -.24 || localAge > 1.35) continue;
      g.ring(p.x, p.y, 31 + prep * 18, 2, pal.edge, localAge < 0 ? prep * .5 : hit * .5, 1.5, TAU, 0, true);
      if (localAge >= 0) {
        const top = add(p, vec(0, 0, 1), ult ? 285 : 185);
        jagged(g, top, p, pal, hit * .95, e.seed + k * 97 + Math.floor(Math.max(0, localAge) * 15), ult ? 3.7 : 2.6);
        sword(g, add(p, vec(0, 0, 1), 13), a, ult ? 160 : 115, ult ? 12 : 9, pal, hit * .66, -.13);
        for (let j = 0; j < 7; j++) {
          const an = j * TAU / 7 + k * .6, len = (60 + hash(j + e.seed) * 62) * smooth(0, .24, localAge), pts = [p];
          for (let q = 1; q <= 5; q++) pts.push(add(p, vec(Math.cos(an + (hash(j * 11 + q) - .5) * .23) * len * q / 5, Math.sin(an + (hash(j * 11 + q) - .5) * .23) * len * q / 5, 2)));
          g.line(pts, pal.edge, hit * .57, 1.4, false, true);
          const flight = clamp(localAge / .8), stone = add(p, vec(Math.cos(an) * flight * 80, Math.sin(an) * flight * 80, 100 * flight * (1 - flight)));
          g.put([add(stone, vec(-3, -3, 0)), add(stone, vec(4, -2, 1)), add(stone, vec(3, 3, 6)), add(stone, vec(-4, 2, 3))], '#655849', hit * .65);
        }
      }
    }
  }
  function electric(g, e, t, pal) {
    if (e.tier === 'dash') {
      const fade = 1 - t / e.duration, end = vec(e.x2, e.y2, 30), start = vec(e.x, e.y, 30);
      jagged(g, start, end, pal, fade * .8, e.seed, 2.5, true);
      const a = Math.atan2(end.y - start.y, end.x - start.x);
      sword(g, add(end, vec(-Math.cos(a), -Math.sin(a), 0), 48), a, 92, 7, pal, fade, Math.PI / 2); return;
    }
    const ult = e.tier === 'e', count = ult ? 3 : 1, fade = 1 - smooth(e.duration - .7, e.duration, t);
    for (let k = 0; k < count; k++) {
      const grow = smooth(k * .13, .4 + k * .13, t), a = e.angle + (k - 1) * .85, r = e.radius * (ult ? 1.17 : .92);
      const start = vec(e.x - Math.cos(a) * r, e.y - Math.sin(a) * r, 24 + k * 37), end = vec(e.x + Math.cos(a) * r * grow, e.y + Math.sin(a) * r * grow, 33 + k * 23);
      const p0 = start, p1 = add(lerp(start, end, .3), vec(-Math.sin(a) * 92, Math.cos(a) * 92, 36)), p2 = add(lerp(start, end, .6), vec(Math.sin(a) * 66, -Math.cos(a) * 66, 24)), p3 = end;
      g.ribbon(u => bezier(p0, p1, p2, p3, u), () => vec(-Math.sin(a), Math.cos(a), .22), u => Math.sin(Math.PI * u) * 8, 27, pal, grow * fade * .64);
      jagged(g, start, end, pal, grow * fade * .42, e.seed + k * 99 + Math.floor(t * 12), 1.25);
      sword(g, add(end, vec(-Math.cos(a), -Math.sin(a), 0), 45), a, 100, 8, pal, grow * fade * .9, Math.PI / 2);
    }
  }
  function wind(g, e, t, pal) {
    const ult = e.tier === 'e', rise = smooth(0, .42, t), fade = 1 - smooth(e.duration - .7, e.duration, t), n = ult ? 3 : 2, spin = t * (e.reduced ? 1.6 : 2.5);
    for (let k = 0; k < n; k++) {
      const r = e.radius * (.78 + k * .075), z = 20 + k * (ult ? 49 : 30), phase = spin * (k % 2 ? -.82 : 1) + k * 2.1;
      const curve = u => { const a = phase + u * TAU * .93; return vec(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, z + Math.sin(a + k) * 32 * rise); };
      g.ribbon(curve, u => { const a = phase + u * TAU * .93; return vec(Math.cos(a) * .65, Math.sin(a) * .65, .6); }, u => (ult ? 11 : 8) * Math.pow(Math.sin(Math.PI * u), .8), 36, pal, rise * fade * .46);
      for (let j = 0; j < 4; j++) { const u = (j + .2) / 4, p = curve(u), a = phase + u * TAU * .93; leaf(g, p, a + Math.PI / 2, 17 + j * 3, pal, rise * fade * .87, t + j); }
      if (ult) for (let string = 0; string < 3; string++) {
        const a = e.angle + Math.PI / 2, off = (string - 1) * 11, points = [];
        for (let j = 0; j <= 20; j++) {
          const u = j / 20, length = (u * 2 - 1) * r * .82;
          const vibration = (Math.sin(Math.PI * u) * Math.sin(t * 24 + k + string) + .35 * Math.sin(Math.PI * u * 3) * Math.sin(t * 39 + k)) * 5;
          points.push(vec(e.x + Math.cos(a) * length - Math.sin(a) * off, e.y + Math.sin(a) * length + Math.cos(a) * off, z + 15 + vibration));
        }
        g.line(points, pal.core, rise * fade * .34, string === 1 ? 1.1 : .8);
      }
    }
    if (ult) for (let k = 0; k < 8; k++) {
      const fly = fract(t * 1.65 + k / 8), a = e.angle + (k % 3 - 1) * .26, r = 25 + fly * e.radius * 1.35, p = vec(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 46 + (k % 3) * 12), tail = add(p, vec(-Math.cos(a), -Math.sin(a), 0), 32);
      g.line([tail, p], pal.core, Math.sin(fly * Math.PI) * rise * fade * .8, 1.35);
      g.put([p, add(tail, vec(-Math.sin(a), Math.cos(a), 0), 2), add(tail, vec(Math.sin(a), -Math.cos(a), 0), 2)], pal.edge, rise * fade * .55);
    }
    shards(g, e, t, ult ? 33 : 18, pal, e.radius * .9, ult ? 150 : 85, rise * fade * .64, 'leaf');
  }
  function practice(g, e, t, pal) {
    const p = e.equipment === 'sword' ? pal : { body: '#bba47b', shade: '#857350', edge: '#ece0b6', core: '#fff3cf' };
    for (let k = 0; k < 3; k++) {
      const age = t - k * .25, alpha = age > 0 && age < .7 ? Math.sin(age / .7 * Math.PI) * .56 : 0, r = e.radius * (.55 + k * .12 + Math.max(0, age) * .3);
      g.ribbon(u => { const a = e.angle - 1.8 + u * 3.6 + k * .3; return vec(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 20 + k * 13 + Math.sin(u * Math.PI) * 22); }, u => { const a = e.angle - 1.8 + u * 3.6 + k * .3; return vec(Math.cos(a), Math.sin(a), .2); }, u => Math.sin(u * Math.PI) * 11, 27, p, alpha);
    }
  }
  function alliance(g, e, t) {
    const ids = Object.keys(PALETTES), charge = smooth(0, .5, t), collapse = smooth(1.35, 1.9, t), fade = 1 - smooth(2.1, e.duration, t);
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + i * TAU / 7, r = 194 * (1 - collapse * .6), pal = PALETTES[ids[i]], base = vec(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 21 + charge * 18);
      sword(g, base, a + Math.PI, 100 + charge * 28, 7, pal, charge * fade * .9, .4 + collapse);
      const c0 = base, c1 = add(base, vec(-Math.cos(a) * 80, -Math.sin(a) * 80, 94)), c2 = vec(e.x + Math.cos(a + 1.2) * 70, e.y + Math.sin(a + 1.2) * 70, 155), c3 = vec(e.x, e.y, 220);
      g.ribbon(u => bezier(c0, c1, c2, c3, u), u => vec(Math.cos(a + u), Math.sin(a + u), .2), u => 6 * Math.sin(u * Math.PI), 22, pal, charge * fade * .5);
    }
    if (collapse > 0) { const pal = PALETTES.daben; sword(g, vec(e.x, e.y, 25), 0, 265 * collapse, 17, pal, collapse * fade * .75, .02); g.ring(e.x, e.y, 130 + collapse * 230, 3, '#fff2bd', fade * .6, 2.5); }
  }
  function awakening(g, e, t) {
    const rise = smooth(0, 1.7, t), fade = smooth(0, .3, t) * (1 - smooth(1.45, e.duration, t));
    for (let i = 0; i < 7; i++) {
      const a = i * TAU / 7 + t * 1.2, r = e.radius * (1 - rise * .6), p = vec(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 54 + rise * 135 + Math.sin(t * 4 + i) * 12);
      const f = vec(-Math.sin(a), Math.cos(a), 0), s = vec(Math.cos(a), Math.sin(a), 0), wing = 7 + Math.sin(t * 16 + i) * 6;
      g.put([add(p, f, 11), add(add(p, f, 1), s, 4), add(p, f, -9), add(add(p, f, 1), s, -4)], '#fff2cf', fade * .88);
      for (const sign of [-1, 1]) g.put([add(p, f, 4), add(add(add(p, f, -3), s, sign * 18), vec(0, 0, 1), wing), add(add(p, f, -7), s, sign * 5)], '#fff7de', fade * .82);
      const tail = []; for (let k = 0; k < 8; k++) { const u = k / 7, an = a - u * .38; tail.push(vec(e.x + Math.cos(an) * r, e.y + Math.sin(an) * r, p.z - u * 16)); }
      g.line(tail, '#eab37c', fade * .5, 1.2);
    }
  }
  const MODEL_HELPERS = Object.freeze({ TAU, clamp, mix, smooth, fract, hash, vec, add, lerp, bezier, loc, sword, leaf, blossom, shards });
  function generate(e) {
    const g = new Geometry(), pal = PALETTES[e.hero] || PALETTES.hongmao, t = e.age;
    if (e.tier === 'attack') attackModel(g, e, t, pal);
    else if (e.tier === 'alliance') alliance(g, e, t);
    else if (e.tier === 'awakening') awakening(g, e, t);
    else if (e.tier === 'practice' || e.equipment !== 'sword' && !e.learned) practice(g, e, t, pal);
    else if (e.hero === 'hongmao') fire(g, e, t, pal);
    else if (window.SwordFXModels && window.SwordFXModels[e.hero]) window.SwordFXModels[e.hero](g, e, t, pal, MODEL_HELPERS);
    else if (e.hero === 'lantu') ice(g, e, t, pal);
    else if (e.hero === 'sali') purple(g, e, t, pal);
    else if (e.hero === 'doudou') rain(g, e, t, pal);
    else if (e.hero === 'daben') thunder(g, e, t, pal);
    else if (e.hero === 'tiaotiao') electric(g, e, t, pal);
    else wind(g, e, t, pal);
    return g;
  }
  function paintPrimitive(ctx, p, project, base) {
    let material = p.color;
    if (p.gradient) {
      const from = project(p.gradient.from.x, p.gradient.from.y, p.gradient.from.z || 0), to = project(p.gradient.to.x, p.gradient.to.y, p.gradient.to.z || 0);
      if (Math.hypot(to.x - from.x, to.y - from.y) > .001) {
        material = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
        for (const [stop, color] of p.gradient.stops) material.addColorStop(clamp(stop), color);
      }
    }
    ctx.globalAlpha = p.alpha; ctx.globalCompositeOperation = p.blend || base.blend;
    ctx.shadowColor = p.glow ? p.color : base.shadowColor; ctx.shadowBlur = p.glow ? p.blur || 4 : base.shadowBlur;
    ctx.beginPath();
    // Project directly into the path, avoiding one temporary array per surface.
    for (let i = 0; i < p.points.length; i++) { const q = p.points[i], point = project(q.x, q.y, q.z); i ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y); }
    if (p.fill) { ctx.closePath(); ctx.fillStyle = material; ctx.fill(); }
    else { ctx.strokeStyle = material; ctx.lineWidth = p.width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }
  }
  function drawPrimitives(ctx, primitives, project, batch) {
    // The lightning/cloud materials keep their original isolated draw states.
    // Only the validated Hongmao material family uses the shared-state path.
    if (!batch) { for (const p of primitives) drawPrimitive(ctx, p, project); return; }
    // These surfaces share a coordinate system. Preserve caller state once;
    // material, alpha, blend and glow still reset for every individual surface.
    const base = { blend: ctx.globalCompositeOperation, shadowColor: ctx.shadowColor, shadowBlur: ctx.shadowBlur };
    ctx.save(); for (const p of primitives) paintPrimitive(ctx, p, project, base); ctx.restore();
  }
  function drawPrimitive(ctx, p, project) {
    const base = { blend: ctx.globalCompositeOperation, shadowColor: ctx.shadowColor, shadowBlur: ctx.shadowBlur };
    ctx.save(); paintPrimitive(ctx, p, project, base); ctx.restore();
  }
  class Director {
    constructor(combat) { this.combat = combat; this.project = combat.project.bind(combat); this.effects = []; this.serial = 0; this.layers = []; this.ground = []; this.stats = { effects: 0, primitives: 0, vertices: 0, particles: 0, glows: 0 }; }
    emit(hero, tier, opts = {}) {
      const e = Object.assign({ id: ++this.serial, hero, tier, age: 0, duration: tier === 'attack' ? .27 : tier === 'e' ? 3 : 1, radius: 230, angle: 0, half: 1.4, combo: 1, hand: 'right', equipment: 'sword', learned: true, seed: this.serial * 83, reduced: this.combat.reducedMotion }, opts);
      e.radius = Math.max(10, Math.min(520, Number(e.radius) || 230)); e.duration = Math.max(.12, Number(e.duration) || 1);
      if (tier === 'attack') { const attacks = this.effects.filter(v => v.tier === 'attack'); if (attacks.length >= LIMITS.attackEffects) this.effects.splice(this.effects.indexOf(attacks[0]), 1); }
      if (this.effects.length >= LIMITS.effects) this.effects.shift(); this.effects.push(e); this.dirty = true; return e;
    }
    update(dt) {
      for (const e of this.effects) { e.age += dt; if (e.owner && (e.owner.dead || e.owner.removed || e.owner.hp <= 0 || !this.combat.companions.includes(e.owner))) { e.age = e.duration; continue; } if (e.follow) { const actor = e.owner || this.combat.p; e.x = actor.x; e.y = actor.y; } }
      this.effects = this.effects.filter(e => e.age < e.duration); this.dirty = true;
    }
    build() {
      const groups = new Map(); this.ground = []; this.dirty = false; this.stats = { effects: this.effects.length, primitives: 0, vertices: 0, particles: 0, glows: 0 };
      this.batchDrawing = this.effects.every(e => e.hero === 'hongmao' && e.tier !== 'alliance');
      // Major techniques precede normal blade trails when the bounded geometry
      // budget is reached. Gameplay simulation never depends on visual budgets.
      // Keep a new detailed ultimate intact when Q, E and blade afterimages
      // overlap. Hongmao retains the approved ordering of his existing layers.
      const priority = e => e.tier === 'attack' ? 2 : e.hero !== 'hongmao' && e.tier === 'e' ? 0 : 1;
      const effects = this.effects.slice().sort((a, b) => priority(a) - priority(b));
      for (const e of effects) {
        const g = generate(e); this.stats.particles += g.particles;
        for (const p of g.primitives) {
          if (this.stats.primitives >= LIMITS.primitives || this.stats.vertices + p.points.length > LIMITS.vertices) break;
          this.stats.primitives++; this.stats.vertices += p.points.length; if (p.glow) { if (this.stats.glows >= LIMITS.glowStrokes) p.glow = false; else this.stats.glows++; }
          if (p.ground) this.ground.push(p);
          else { const key = Math.floor(p.depth / 40); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(p); }
        }
      }
      this.layers = [...groups.entries()].map(([key, primitives]) => ({ depth: key * 40 + 20, primitives: primitives.sort((a, b) => a.depth - b.depth) }));
    }
    drawGround(ctx) { const c = this.combat; if (this.dirty || !this.layers.length && this.effects.length) this.build(); c.withView(ctx, () => drawPrimitives(ctx, this.ground, this.project, this.batchDrawing)); }
    getDrawables() {
      const c = this.combat; if (this.dirty) this.build(); return this.layers.map(layer => ({ depth: layer.depth, draw: ctx => c.withView(ctx, () => drawPrimitives(ctx, layer.primitives, this.project, this.batchDrawing)) }));
    }
    clear() { this.effects = []; this.layers = []; this.ground = []; }
  }
  window.SwordFX = { version: 5, palettes: PALETTES, limits: LIMITS, create: combat => new Director(combat), sample(hero, tier, age, options = {}) { return generate(Object.assign({ hero, tier, age, duration: tier === 'e' ? 3.05 : 1, radius: 280, x: 480, y: 300, angle: -.5, hand: 'right', equipment: 'sword', seed: 831, half: 1.4, combo: 1 }, options)); }, drawPrimitive };
})();
