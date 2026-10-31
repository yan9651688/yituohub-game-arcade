/* Seven Swords v5 — Blue Rabbit / Sali.
   Drawn after inspection of the eight-frame imagegen sheets:
   ice crescent → faceted frost lotus; ivory-edged violet clouds → interlocking S sweeps.
   This file contains world-space surfaces only. It does not embed or play raster frames.
   Q/E phase times follow the existing combat hit schedule; mechanics remain in combat.js. */
(function () {
  'use strict';
  const Models = window.SwordFXModels = window.SwordFXModels || {};
  const TAU = Math.PI * 2;
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = (a, b, t) => { const u = clamp((t - a) / (b - a)); return u * u * (3 - 2 * u); };
  const hash = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453123; return v - Math.floor(v); };
  const fract = x => x - Math.floor(x);
  const V = (x, y, z = 0) => ({ x, y, z });
  const add = (p, d, m = 1) => V(p.x + d.x * m, p.y + d.y * m, p.z + d.z * m);
  const lerp = (a, b, t) => V(mix(a.x, b.x, t), mix(a.y, b.y, t), mix(a.z, b.z, t));
  const local = (e, x, y, z = 0) => V(e.x + Math.cos(e.angle) * x - Math.sin(e.angle) * y, e.y + Math.sin(e.angle) * x + Math.cos(e.angle) * y, z);
  const ICE = { deep: '#3659a9', blue: '#578bcc', body: '#89beef', edge: '#cbf1ff', core: '#f6ffff', violet: '#b5a9ed' };
  const CLOUD = { deep: '#4a367b', dark: '#62488f', body: '#9e78c3', edge: '#dcbaff', core: '#fff5da', gold: '#f4cf95' };

  function grad(from, to, stops) { return { gradient: { from, to, stops } }; }

  // Broad strips have a shaded underside, a satin middle and a thin hot edge.
  // The different width profile is essential: these are painted masses, not wires.
  function membrane(g, curve, normal, width, n, alpha, colors, opt = {}) {
    if (alpha < .008) return;
    const ps = [], left = [], right = [], mid = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, p = curve(u), d = normal(u), w = width(u);
      ps.push(p); left.push(add(p, d, -w)); right.push(add(p, d, w)); mid.push(add(p, d, w * .33));
    }
    // Curved patches share a few samples, avoiding a visible grid of quad seams.
    // They remain short enough for world-depth sorting around the central actor.
    const patchSize = 8;
    const anchor = ps[Math.floor(n / 2)], minZ = Math.min(...left.map(p => p.z)), maxZ = Math.max(...right.map(p => p.z));
    const materialFrom = V(anchor.x, anchor.y, minZ), materialTo = V(anchor.x, anchor.y, maxZ);
    const material = grad(materialFrom, materialTo, [[0, colors.deep], [.32, colors.body], [.76, colors.edge], [1, colors.body]]);
    for (let i = 0; i < n; i += patchSize) {
      const end = Math.min(n, i + patchSize), center = Math.round((i + end) * .5), a = left[center], b = right[center];
      const outer = left.slice(i, end + 1), inner = right.slice(i, end + 1);
      g.put(outer.concat(inner.slice().reverse()), colors.body, alpha, Object.assign({}, material, { ground: !!opt.ground }));
      const highlights = outer.map((p, j) => lerp(p, inner[j], .86));
      g.put(highlights.concat(inner.slice().reverse()), colors.core, alpha * .46, { blend: 'screen', ground: !!opt.ground });
    }
    g.line(right, colors.core, alpha * .87, opt.lineWidth || 1.4, !!opt.glow, !!opt.ground);
    g.line(left, colors.edge, alpha * .44, .85, false, !!opt.ground);
    if (opt.filaments) for (let k = 0; k < 3; k++) {
      const pts = ps.map((p, i) => {
        const u = i / n, d = normal(u);
        return add(p, d, width(u) * (k * .35 - .48 + .12 * Math.sin(u * 17 + k * 1.8)));
      });
      g.line(pts, k === 1 ? colors.core : colors.edge, alpha * (k === 1 ? .27 : .18), .72);
    }
    return { ps, left, right, mid };
  }

  function icePetal(g, base, angle, reach, height, width, alpha, seed, flourish = 0) {
    if (alpha < .015 || width < .1) return;
    const radial = V(Math.cos(angle), Math.sin(angle)), side = V(-Math.sin(angle), Math.cos(angle));
    const point = (u, v) => {
      const bulge = Math.pow(Math.sin(Math.PI * u), .96), bend = Math.sin(u * Math.PI) * width * flourish;
      const p = add(base, radial, reach * Math.pow(u, .92) + (1 - v * v) * width * .11 * bulge);
      p.x += side.x * (width * bulge * v + bend); p.y += side.y * (width * bulge * v + bend);
      p.z += height * (Math.pow(u, .88) + .12 * Math.sin(u * Math.PI)) + bulge * width * (1 - Math.abs(v)) * .48;
      return p;
    };
    const columns = [-1, -.12, .46, 1], n = 8;
    const top = point(1, 0), bottom = point(0, 0);
    const shades = [ICE.blue, ICE.edge, ICE.violet];
    for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) {
      const u0 = i / n, u1 = (i + 1) / n;
      const a = point(u0, columns[k]), b = point(u1, columns[k]), c = point(u1, columns[k + 1]), d = point(u0, columns[k + 1]);
      g.put([a, b, c, d], shades[k], alpha * (k === 1 ? .94 : .8), grad(bottom, top, [[0, ICE.deep], [.31, shades[k]], [.78, k === 2 ? ICE.body : ICE.edge], [1, ICE.core]]));
      // Irregular facets are anchored to the petal; they never flicker by frame.
      if ((i + k) % 2 === 0 && i > 0 && i < 7) {
        const m = point(mix(u0, u1, .54), mix(columns[k], columns[k + 1], .63));
        g.put([a, c, m], (i + k) % 3 ? '#e5f9ff' : '#8f85d0', alpha * (.19 + hash(seed + i * 3 + k) * .26));
      }
    }
    const l = [], r = [], ridge = [];
    for (let i = 0; i <= 12; i++) { const u = i / 12; l.push(point(u, -1)); r.push(point(u, 1)); ridge.push(point(u, -.12)); }
    g.line(l, ICE.edge, alpha * .88, 1.25);
    g.line(r, ICE.core, alpha * .95, 1.25);
    g.line(ridge, '#f5ffff', alpha * .78, 1.0);
    for (let i = 2; i < 7; i++) {
      const u = i / 8, root = point(u, -.12);
      g.line([point(u - .11, -.93), root, point(u + .10, .9)], ICE.core, alpha * .37, .65);
    }
    g.particles++;
    return point;
  }

  function crystal(g, p, a, s, alpha, tilt = .2) {
    if (alpha < .02) return;
    const up = V(Math.cos(a) * tilt, Math.sin(a) * tilt, 1), side = V(Math.cos(a + 1.25), Math.sin(a + 1.25), .12);
    const top = add(p, up, s * 1.8), bottom = add(p, up, -s * 1.15), left = add(p, side, s * .64), right = add(p, side, -s * .64), facet = add(p, up, s * .3);
    g.put([top, left, bottom, facet], ICE.blue, alpha, grad(left, top, [[0, ICE.deep], [.6, ICE.body], [1, ICE.core]]));
    g.put([top, facet, bottom, right], ICE.edge, alpha * .84, grad(bottom, top, [[0, ICE.body], [.6, '#d8f5ff'], [1, '#ffffff']]));
    g.line([top, left, bottom, right, top], ICE.core, alpha * .94, .75);
    g.line([top, facet, bottom], '#ffffff', alpha * .78, .7);
    g.particles++;
  }

  function snowflake(g, p, radius, alpha, rotation = 0, ground = false) {
    if (alpha < .02) return;
    const u = V(.707, -.707), v = ground ? V(.707, .707) : V(.15, .15, .94);
    const pt = (a, r) => add(add(p, u, Math.cos(a) * r), v, Math.sin(a) * r);
    for (let k = 0; k < 6; k++) {
      const a = rotation + k * TAU / 6, tip = pt(a, radius), neck = pt(a, radius * .56);
      g.line([p, tip], ICE.core, alpha, .9, false, ground);
      if (radius > 7) {
        const twigL = add(add(neck, u, Math.cos(a + .87) * radius * .23), v, Math.sin(a + .87) * radius * .23);
        const twigR = add(add(neck, u, Math.cos(a - .87) * radius * .23), v, Math.sin(a - .87) * radius * .23);
        g.line([twigL, neck, twigR], ICE.edge, alpha * .8, .65, false, ground);
      }
    }
    g.particles++;
  }

  function frostDust(g, e, t, radius, alpha, count) {
    for (let i = 0; i < count; i++) {
      const a = i * 2.399963 + t * .22, r = radius * (.25 + .7 * hash(i + 65)), life = fract(hash(i + 6) + t * .2);
      const p = V(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 15 + (1 - life) * (95 + hash(i) * 105));
      const f = Math.sin(Math.PI * life) * alpha;
      if (i % 4 === 0) snowflake(g, p, 6 + hash(i + 10) * 5, f * .75, t * .15 + i);
      else crystal(g, p, a, 2.8 + hash(i) * 3.5, f * .7, .45);
    }
  }

  Models.lantu = function (g, e, t) {
    const ult = e.tier === 'e', fade = 1 - ease(e.duration - (ult ? .82 : .3), e.duration, t);
    const awake = ease(0, ult ? .21 : .11, t), impact = ease(ult ? .17 : .055, ult ? .49 : .22, t);
    const alpha = awake * fade;
    if (!ult) {
      const sweep = ease(.035, .38, t), r = e.radius * (.43 + sweep * .57), start = e.angle - 2.6 + sweep * .23;
      const curve = u => { const a = start + u * 3.9; return V(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 27 + Math.sin(u * Math.PI) * 86 * impact); };
      const normal = u => { const a = start + u * 3.9; return V(Math.cos(a) * .42, Math.sin(a) * .42, .9); };
      membrane(g, curve, normal, u => 46 * Math.pow(Math.sin(u * Math.PI), .65) * (.76 + .24 * Math.sin(u * 6 + 1)) * impact, 34, alpha * .83, ICE, { filaments: true, glow: true });
      for (let i = 0; i < 11; i++) {
        const u = (i + 1) / 13, a = start + u * 3.9, p = add(curve(u), normal(u), 15 * Math.sin(Math.PI * u));
        icePetal(g, p, a + .88, 38 + (i % 3) * 11, 22 + (i % 4) * 5, (8 + (i % 3) * 3) * impact, alpha * .8, i, .18);
      }
      for (let i = 0; i < 4; i++) {
        const u = .21 + i * .17;
        snowflake(g, add(curve(u), normal(u), 10), 7 + (i % 2) * 2, alpha * .58, i * .24);
      }
      frostDust(g, e, t, r * .9, alpha * .7, 10);
      if (t < .29) snowflake(g, V(e.x, e.y, 83), 23 * (1 - sweep * .55), (1 - sweep) * alpha, .2);
      return;
    }

    const open = ease(.16, .69, t), melt = ease(e.duration - 1.0, e.duration, t), r = e.radius * (.73 + open * .2);
    // A low engraved frost rosette ties the petal volumes to the frozen field.
    for (let k = 0; k < 6; k++) {
      const a = k * TAU / 6 + .23, p0 = V(e.x + Math.cos(a) * 52, e.y + Math.sin(a) * 52, 2), p1 = V(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 2);
      const s = V(-Math.sin(a), Math.cos(a));
      const l = add(lerp(p0, p1, .63), s, 27 * open), rr = add(lerp(p0, p1, .63), s, -27 * open);
      g.put([p0, l, p1, rr], ICE.blue, alpha * .22, Object.assign(grad(p0, p1, [[0, '#88d7ff00'], [.6, '#a0d8f088'], [1, '#f5ffffbb']]), { ground: true }));
      g.line([p0, p1], ICE.edge, alpha * .38, 1, false, true);
      for (let j = 1; j <= 3; j++) {
        const p = lerp(p0, p1, j / 4), size = 10 + j * 4;
        g.line([add(add(p, s, -size), V(Math.cos(a), Math.sin(a)), -12), p, add(add(p, s, size), V(Math.cos(a), Math.sin(a)), -12)], ICE.core, alpha * .22, .85, false, true);
      }
    }

    // Outer and inner petals deliberately have different reaches and heights.
    // Front petals remain low; the hero's face stays visible inside the lotus.
    for (let ring = 0; ring < 2; ring++) {
      const count = ring ? 6 : 12;
      for (let i = 0; i < count; i++) {
        const a = i * TAU / count + (ring ? .38 : .08), front = (Math.cos(a) + Math.sin(a)) / Math.SQRT2;
        const growth = ease(.03 + i * .012, .37 + i * .012, t), baseR = ring ? 32 : 47;
        const base = V(e.x + Math.cos(a) * baseR, e.y + Math.sin(a) * baseR, 3);
        const reach = (ring ? 118 : 185) * (.72 + open * .28) * (1 + melt * .14);
        const backHeight = ring ? 202 : 139, frontHeight = ring ? 37 : 26;
        const height = mix(backHeight, frontHeight, ease(-.32, .52, front)) * growth * (1 - melt * .32);
        const petal = icePetal(g, base, a, reach * growth, height, (ring ? 48 : 58) * growth, alpha * (ring ? .9 : .86), ring * 100 + i, .14 * Math.sin(i));
        if (ring && front < -.2 && petal) snowflake(g, add(petal(.58, 0), V(.707, .707, .3), 3), 11 * growth, alpha * .67, .1 + i * .16);
      }
    }

    // Two frozen-mist curls, copied from the sheet's low sweeping base.
    for (let k = 0; k < 2; k++) {
      const start = k * Math.PI + t * (e.reduced ? .10 : .22), rr = r * (.96 + k * .02);
      const curve = u => { const a = start + u * 2.95, curl = rr * (1 - .22 * u * u); return V(e.x + Math.cos(a) * curl, e.y + Math.sin(a) * curl, 8 + 29 * Math.sin(u * Math.PI) + 6 * Math.sin(a)); };
      const normal = u => { const a = start + u * 2.95; return V(Math.cos(a) * .74, Math.sin(a) * .74, .6); };
      membrane(g, curve, normal, u => Math.pow(Math.sin(Math.PI * u), .8) * 30 * open, 27, alpha * .27, ICE, { filaments: true });
    }
    const engraving = V(e.x - 44, e.y - 44, 179 * open + 10);
    snowflake(g, engraving, 24 * awake, alpha * .76, .08);
    frostDust(g, e, t, r, alpha, e.reduced ? 10 : 16);
  };

  // A scalloped cloud profile, with a warm engraved curl and a shaded lower fold.
  // Its filled surface remains legible at normal gameplay zoom, unlike neon loops.
  function cloudLobe(g, p, size, alpha, seed, skew = 0) {
    if (alpha < .02 || size < 1) return;
    const u = V(.707, -.707), v = V(.17 + skew * .2, .17 - skew * .2, .91);
    const point = (x, y) => add(add(p, u, x * size), v, y * size);
    const outline = [];
    for (let i = 0; i < 30; i++) {
      const a = i / 30 * TAU, lobes = .86 + .13 * Math.cos(a * 5 + seed * .7) + .05 * Math.sin(a * 3);
      outline.push(point(Math.cos(a) * lobes, Math.sin(a) * lobes * .95));
    }
    g.put(outline, CLOUD.body, alpha * .97, Object.assign(grad(point(-.2, -.95), point(.1, .87), [[0, CLOUD.deep], [.31, CLOUD.dark], [.67, CLOUD.body], [1, '#efccff']]), { depth: p.x + p.y + 9 }));
    const cap = [];
    for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI, r = .85 + .09 * Math.cos(a * 5 + seed * .7); cap.push(point(Math.cos(a) * r, Math.sin(a) * r * .95)); }
    for (let i = 16; i >= 0; i--) { const a = i / 16 * Math.PI, r = .69 + .08 * Math.cos(a * 5 + seed * .7); cap.push(point(Math.cos(a) * r, Math.sin(a) * r * .79 - .04)); }
    g.put(cap, '#f7dcff', alpha * .22, { depth: p.x + p.y + 10 });
    const rim = outline.slice(0, 17);
    g.put(rim, CLOUD.gold, alpha * .69, { fill: false, width: .94, depth: p.x + p.y + 10 });
    const curl = [];
    for (let j = 0; j <= 24; j++) {
      const q = j / 24, a = q * TAU * 1.24 + seed * .55, rr = .66 * (1 - q) + .035;
      curl.push(point(Math.cos(a) * rr, Math.sin(a) * rr * .80 + .055));
    }
    g.put(curl, '#f5d7b0', alpha * .75, { fill: false, width: 1.0, depth: p.x + p.y + 10 });
    const shine = [];
    for (let j = 0; j <= 9; j++) { const a = .14 + j / 9 * 2.2; shine.push(point(Math.cos(a) * .73, Math.sin(a) * .73)); }
    g.put(shine, '#f9e8ff', alpha * .53, { fill: false, width: 1.2, depth: p.x + p.y + 10 });
    g.particles++;
  }

  function cloudCluster(g, p, size, alpha, seed) {
    const u = V(.707, -.707), up = V(0, 0, 1);
    cloudLobe(g, add(add(p, u, -size * .46), up, size * .13), size * .68, alpha * .83, seed + 1);
    cloudLobe(g, add(add(p, u, size * .40), up, size * .23), size * .64, alpha * .85, seed + 3);
    cloudLobe(g, add(p, up, -size * .10), size * .96, alpha, seed + 5);
  }

  function cloudSweep(g, e, t, spec) {
    const { alpha, radius, phase, height, width, handed, tail, clouds, seed } = spec;
    if (alpha < .008) return;
    const start = e.angle + handed * phase, span = handed * (spec.span || 4.05), drift = spec.drift || 0;
    const center = local(e, spec.offsetX || 0, spec.offsetY || 0);
    const curve = u => {
      const a = start + u * span, rr = radius * (.84 + .16 * Math.sin(u * Math.PI));
      let z = height + Math.sin(u * Math.PI) * (53 + width * .55) + Math.sin(u * TAU + phase) * 12;
      if (spec.clearActor) {
        const front = (Math.cos(a) + Math.sin(a)) / Math.SQRT2;
        z = mix(z, 20 + Math.sin(u * Math.PI) * 24, ease(.08, .75, front) * .86);
      }
      return V(center.x + Math.cos(a) * rr + Math.cos(e.angle) * drift * u, center.y + Math.sin(a) * rr + Math.sin(e.angle) * drift * u, z);
    };
    const normal = u => { const a = start + u * span; return V(Math.cos(a) * .44, Math.sin(a) * .44, .86); };
    const shape = u => Math.pow(Math.sin(Math.PI * u), .68) * width * (.78 + .22 * Math.cos(u * 10 + phase));
    membrane(g, curve, normal, shape, 37, alpha * .89, CLOUD, { filaments: true, glow: true });

    // Scalloped outer clouds make each blade feel carved from rolling purple mist.
    for (let i = 0; i < clouds; i++) {
      const u = (i + 1.15) / (clouds + 1.6), p = add(curve(u), normal(u), -shape(u) * .97);
      cloudCluster(g, p, (26 + width * .67) * (1 + .22 * Math.sin(i * 2.3)), alpha * .97, seed + i * 3);
    }
    // The narrow gold engraving is subordinate to the luminous ivory blade.
    const gold = [], secondary = [];
    for (let i = 0; i <= 34; i++) {
      const u = i / 34, p = curve(u), d = normal(u), w = shape(u);
      gold.push(add(p, d, w * (.55 + .055 * Math.sin(u * 28))));
      secondary.push(add(p, d, -w * .78));
    }
    g.line(gold, CLOUD.gold, alpha * .78, .94);
    g.line(secondary, CLOUD.gold, alpha * .32, .68);
    if (tail) for (let k = 0; k < 3; k++) {
      const pts = [];
      for (let i = 0; i <= 23; i++) {
        const u = i / 23, a = start + span * u * .68 - handed * k * .12, rr = radius * (.93 + k * .07), p = V(e.x + Math.cos(a) * rr, e.y + Math.sin(a) * rr, height + 22 + Math.sin(u * Math.PI) * (40 + k * 17));
        pts.push(p);
      }
      g.line(pts, k === 1 ? CLOUD.gold : CLOUD.edge, alpha * .20, .82);
    }
    return { curve, normal, shape };
  }

  function violetMotes(g, e, t, radius, alpha, count) {
    const u = V(.707, -.707);
    for (let i = 0; i < count; i++) {
      const age = fract(hash(i + 98) + t * .37), a = i * 2.399963 + t * .38, r = radius * (.44 + .55 * hash(i + 13));
      const p = V(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 28 + age * 145), fade = Math.sin(Math.PI * age) * alpha, s = 2 + hash(i) * 3;
      const top = add(p, V(.2, -.2, 1), s * 1.9), bottom = add(p, V(.2, -.2, 1), -s * 1.4);
      g.put([top, add(p, u, s), bottom, add(p, u, -s)], i % 3 ? CLOUD.edge : CLOUD.gold, fade * .78);
      if (i % 4 === 0) g.line([add(p, u, -s * 2), add(p, u, s * 2)], CLOUD.core, fade * .63, .7);
      g.particles++;
    }
  }

  Models.sali = function (g, e, t) {
    const ult = e.tier === 'e', hand = e.hand === 'left' ? -1 : 1;
    if (!ult) {
      // The three Q cuts resolve at .10 / .26 / .42 seconds in combat.js.
      for (let k = 0; k < 3; k++) {
        const age = t - k * .16, rise = ease(.012, .11, age), fall = 1 - ease(.29, .64, age);
        const alpha = rise * fall;
        cloudSweep(g, e, age, { alpha: alpha * (k === 1 ? .88 : .7), radius: e.radius * (.68 + .12 * k + ease(.04, .39, age) * .11), phase: -2.85 + k * .49 + ease(.03, .43, age) * .43, height: 16 + k * 22, width: 28 + k * 5, handed: hand * (k % 2 ? -1 : 1), clouds: k === 1 ? 3 : 2, seed: k * 43, tail: k === 2, span: 3.58 });
      }
      violetMotes(g, e, t, e.radius, Math.sin(clamp(t / e.duration) * Math.PI) * .61, 14);
      return;
    }
    const fade = 1 - ease(e.duration - .67, e.duration, t), rise = ease(.015, .29, t), release = ease(1.48, 1.77, t);
    const pulse = .94 + .06 * Math.cos(Math.max(0, t - .32) / .15 * TAU), alpha = rise * fade;
    const spin = (e.reduced ? .17 : .38) * t;
    // Opposing, offset crescents interlock as a broad S, matching the sheet.
    const unfold = mix(.48, 1, rise);
    cloudSweep(g, e, t, { alpha: alpha * .87, radius: e.radius * (.75 + release * .15) * unfold, phase: -2.4 + spin, height: (20 + release * 13) * rise, width: (63 + release * 15) * pulse * unfold, handed: hand, clouds: 4, seed: 16, tail: true, drift: release * 58, span: 3.73, offsetX: -27, offsetY: 24, clearActor: true });
    cloudSweep(g, e, t, { alpha: alpha * .84, radius: e.radius * (.64 + release * .18) * unfold, phase: .65 - spin * .68, height: (93 + release * 12) * rise, width: (56 + release * 14) * pulse * unfold, handed: -hand, clouds: 3, seed: 64, tail: true, drift: release * 44, span: 3.47, offsetX: 34, offsetY: -21, clearActor: true });
    // The final forward sweep begins with the 1.66s hit, then thins into motes.
    if (t > 1.45) {
      const flourish = ease(1.46, 1.70, t) * (1 - ease(1.91, 2.56, t));
      cloudSweep(g, e, t, { alpha: flourish * .57, radius: e.radius * (1.0 + .16 * release), phase: -2.70 + release * .24, height: 17, width: 47 * (1 - ease(1.88, 2.65, t) * .65), handed: hand, clouds: 2, seed: 107, tail: false, drift: 79 * release, span: 2.67, clearActor: true });
    }
    violetMotes(g, e, t, e.radius * (1 + release * .12), alpha * .83, e.reduced ? 18 : 30);
  };
})();
