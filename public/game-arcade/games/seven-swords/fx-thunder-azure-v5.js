/* Seven Swords v5 — sprite-sheet redraws: 奔雷 / 青光.
   The generated eight-cell references are studied first; runtime geometry is
   independently drawn in world coordinates. No raster sprites enter combat. */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const v = (x, y, z = 0) => ({ x, y, z });
  const plus = (p, d, n = 1) => v(p.x + d.x * n, p.y + d.y * n, p.z + d.z * n);
  const at = (a, b, u) => v(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, a.z + (b.z - a.z) * u);
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const frac = x => x - Math.floor(x);
  const rnd = n => frac(Math.sin(n * 127.1 + 311.7) * 43758.5453123);
  const gradient = (from, to, stops) => ({ from, to, stops });
  const cubic = (a, b, c, d, u) => { const q = 1 - u; return v(q * q * q * a.x + 3 * q * q * u * b.x + 3 * q * u * u * c.x + u * u * u * d.x, q * q * q * a.y + 3 * q * q * u * b.y + 3 * q * u * u * c.y + u * u * u * d.y, q * q * q * a.z + 3 * q * q * u * b.z + 3 * q * u * u * c.z + u * u * u * d.z); };
  const GOLD = { dark: '#805139', body: '#d58f34', edge: '#ffe592', core: '#fffde5', mist: '#877299' };
  function surfaceLine(g, pts, color, alpha, width, glow, depth) {
    const before = g.primitives.length;
    g.line(pts, color, alpha, width, glow);
    if (g.primitives.length > before) g.primitives[g.primitives.length - 1].depth = depth;
  }

  // A smoothly tapered sheet with broad translucent material, a fine raised
  // leading edge and an independent inner vein. The silhouette is one path.
  function membrane(g, fn, normal, width, alpha, colors, n = 28, opts = {}) {
    if (alpha < .009) return;
    const ps = [], left = [], right = [], ridge = [], inner = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, p = fn(u), d = normal(u), w = width(u);
      ps.push(p); left.push(plus(p, d, w)); right.push(plus(p, d, -w));
      ridge.push(plus(p, d, w * .78)); inner.push(plus(p, d, w * .28));
    }
    const shared = { ground: !!opts.ground };
    // Continuous nested material strips avoid both a global-gradient cutoff
    // around a curve and the crosswise seams of per-segment Canvas gradients.
    const bands = colors === GOLD
      ? [[0, .17, colors.dark, .1], [.17, .38, colors.dark, .27], [.38, .61, colors.body, .5], [.61, .8, colors.edge, .7], [.8, .96, colors.edge, .9], [.96, 1, colors.core, .94]]
      : [[0, .10, colors.dark, .08], [.10, .25, colors.dark, .22], [.25, .42, colors.body, .36], [.42, .59, colors.body, .54], [.59, .74, colors.edge, .64], [.74, .86, colors.edge, .78], [.86, .95, colors.edge, .91], [.95, 1, colors.core, .9]];
    for (const [lo, hi, color, opacity] of bands) {
      const a = right.map((p, i) => at(p, left[i], lo)), b = right.map((p, i) => at(p, left[i], hi));
      g.put(a.concat(b.reverse()), color, alpha * opacity, shared);
    }
    g.line(left, colors.core, alpha * .88, opts.edgeWidth || 1.5, !!opts.glow, !!opts.ground);
    g.line(inner, colors.edge, alpha * .46, .7, false, !!opts.ground);
  }

  // Irregular filled lightning core. Gold facets carry fine branching white
  // fissures; a restrained violet corona gives the reference's warm/cool relief.
  function solidBolt(g, top, foot, width, alpha, seed, sideAngle, branches = true, motion = 0, glow = true) {
    if (alpha < .01) return;
    // The electrical cross-section faces the isometric camera, preserving
    // material width even when an enemy is aimed along the diagonal axis.
    const facing = -Math.PI / 4 + Math.sin(sideAngle) * .13;
    const side = v(Math.cos(facing), Math.sin(facing), .06), ps = [], left = [], right = [];
    const n = 9, depth = foot.x + foot.y;
    for (let i = 0; i <= n; i++) {
      const u = i / n, envelope = Math.pow(Math.sin(Math.PI * u), .55);
      const electric = Math.sin(motion * 18 - i * .93) * .17 + Math.sin(motion * 27 + i * 1.1) * .06;
      const p = plus(at(top, foot, u), side, ((rnd(seed + i * 13) - .5) * 2.5 + electric) * width * Math.sin(Math.PI * u));
      const w = width * envelope * (.52 + rnd(seed * 2 + i) * .7);
      ps.push(p); left.push(plus(p, side, w)); right.push(plus(p, side, -w));
    }
    const wide = left.map((p, i) => at(ps[i], p, 3.2)).concat(right.map((p, i) => at(ps[i], p, 3.2)).reverse());
    g.put(wide, GOLD.mist, alpha * .13, { depth, glow, blur: 8,
      gradient: gradient(top, foot, [[0, '#86749700'], [.36, '#b8948766'], [1, '#ffd681cc']]) });
    g.put(left.concat(ps.slice().reverse()), GOLD.body, alpha * .82, { depth: depth + .01,
      gradient: gradient(top, foot, [[0, '#a37752'], [.36, '#cf9a57'], [.66, '#ffe99c'], [1, '#fff9d7']]) });
    g.put(ps.concat(right.slice().reverse()), GOLD.dark, alpha * .8, { depth: depth + .02,
      gradient: gradient(top, foot, [[0, '#62443d'], [.52, '#b97834'], [1, '#f6d76f']]) });
    const hotLeft = ps.map((p, i) => at(p, left[i], .24)), hotRight = ps.map((p, i) => at(p, right[i], .18));
    g.put(hotLeft.concat(hotRight.reverse()), '#fff6ba', alpha * .88, { depth: depth + .025, blend: 'screen' });
    surfaceLine(g, left, GOLD.edge, alpha, 2, glow, depth + .04);
    surfaceLine(g, right, '#ffe0a0', alpha * .89, 1.2, false, depth + .04);
    surfaceLine(g, ps, '#ffd060', alpha * .78, 9, glow, depth + .05);
    surfaceLine(g, ps, '#fffbd5', alpha, 4.2, false, depth + .06);
    surfaceLine(g, ps, '#ffffff', alpha * .92, 1.65, false, depth + .07);
    if (branches) for (let j = 1; j < n - 1; j++) {
      const sign = j % 2 ? -1 : 1, p = ps[j], end = plus(plus(p, side, sign * width * (1.5 + rnd(seed + j) * 2.6)), v(0, 0, 1), width * (1.1 + rnd(j) * 2));
      const elbow = plus(at(p, end, .38), v(0, 0, 1), -width * .6);
      const branch = [p, elbow, at(p, end, .68), end];
      surfaceLine(g, branch, '#e6a340', alpha * .65, 4, false, depth + .075);
      surfaceLine(g, branch, '#fffbd0', alpha, 1.6, j === 2 && glow, depth + .08);
      const branch2 = [elbow, plus(at(elbow, end, .55), side, sign * width * .65), plus(end, v(0, 0, 1), width * .9)];
      surfaceLine(g, branch2, '#fff8d1', alpha * .78, .8, false, depth + .08);
      const crack = [left[j - 1], at(ps[j - 1], ps[j], .57), ps[j], at(ps[j], right[j + 1], .35), right[j + 1]];
      surfaceLine(g, crack, '#fffdec', alpha * .94, 1.1, false, depth + .09);
      // A small ivory surge travels down the fissure while its gold body cools.
      const pulse = Math.pow(.5 + .5 * Math.sin(motion * 20 - j * 1.2), 4);
      surfaceLine(g, [ps[j - 1], ps[j]], '#ffffff', alpha * pulse, 3.2, false, depth + .1);
    }
  }

  function goldenShard(g, p, a, length, width, alpha, seed) {
    const d = v(Math.cos(a) * .55, Math.sin(a) * .55, .72), side = v(-Math.sin(a), Math.cos(a), 0);
    const tail = plus(p, d, -length * .46), tip = plus(p, d, length * .6), waist = plus(p, d, -length * .06);
    const l = plus(waist, side, width), r = plus(waist, side, -width);
    g.put([tail, l, tip, waist], GOLD.body, alpha * .8, { gradient: gradient(tail, tip, [[0, '#715044'], [.62, '#dfac57'], [1, '#fff6c2']]) });
    g.put([tail, waist, tip, r], GOLD.dark, alpha * .88);
    g.line([tail, l, tip, r, tail], GOLD.edge, alpha * .9, 1.05);
    g.line([tail, plus(at(tail, tip, .3), side, width * .23), at(tail, tip, .51), plus(at(tail, tip, .68), side, -width * .32), tip], GOLD.core, alpha, .95);
    if (seed % 3 === 0) g.line([l, waist, r], GOLD.core, alpha * .68, .7);
    g.particles++;
  }

  function thunderCrest(g, e, radius, turn, rise, alpha, seed, lift = 35) {
    for (let k = 0; k < 2; k++) {
      const start = turn + k * Math.PI, span = Math.PI * (k ? .95 : 1.07);
      const fn = u => {
        const a = start + u * span, rr = radius * (.87 + .13 * u) + Math.sin(u * 16 + seed) * 4;
        const teeth = Math.pow(Math.max(0, Math.sin(u * Math.PI * 11 + seed * .2)), 4) * lift * .33;
        const crest = Math.pow(Math.sin(u * Math.PI), .85) * (lift + teeth) * rise;
        return v(e.x + Math.cos(a) * rr, e.y + Math.sin(a) * rr, 5 + crest + Math.sin(a * 3 + seed) * 4);
      };
      membrane(g, fn, u => { const a = start + u * span; return v(Math.cos(a) * .58, Math.sin(a) * .58, .84); },
        u => (27 + lift * .3) * Math.pow(Math.sin(Math.PI * u), .58), alpha * 1.12, GOLD, 30, { glow: k === 0, edgeWidth: 2.4 });
      // Serrated rolling crests: long pointed sheets curl outward, then split
      // into short angular white fissures, matching the reference's breakers.
      for (let j = 0; j < 6; j++) {
        const u = .11 + j * .14, p = fn(u), an = start + u * span, radial = v(Math.cos(an), Math.sin(an), .38), tangent = v(-Math.sin(an), Math.cos(an), .2);
        const s = (21 + rnd(seed + j) * 24) * (.45 + rise * .55), edge = plus(p, radial, 13);
        const tip = plus(plus(edge, radial, s * .7), tangent, s * .82), high = plus(plus(edge, tangent, s * .19), v(0, 0, 1), s * .62);
        const base = plus(p, tangent, -s * .6), points = [base, p, high, tip, plus(edge, tangent, s * .18)];
        g.put(points, GOLD.edge, alpha * .75, { gradient: gradient(base, tip, [[0, '#a96e2800'], [.45, '#edb14c'], [.79, '#fff8bc'], [1, '#fffdf4']]) });
        const depth = Math.max(...points.map(q => q.x + q.y)) + .3;
        surfaceLine(g, [base, p, high, tip], '#fffdea', alpha, 1.5, false, depth);
        const outside = plus(tip, tangent, s * .32);
        surfaceLine(g, [p, at(p, tip, .4), plus(at(p, tip, .7), radial, s * .2), tip, outside], '#fff6bc', alpha * .95, 1.05, false, depth + .01);
      }
    }
  }

  function thunderImpact(g, foot, age, radius, alpha, seed, ult) {
    const flash = Math.exp(-age * 10), spread = smooth(0, .52, age), breath = Math.exp(-age * 2.35);
    if (flash > .012) {
      const star = [];
      for (let i = 0; i < 20; i++) {
        const a = i * TAU / 20, r = i % 2 ? 12 : (48 + rnd(seed + i) * 46) * (.5 + spread);
        star.push(v(foot.x + Math.cos(a) * r, foot.y + Math.sin(a) * r, 10 + (i % 2 ? 2 : 16)));
      }
      g.put(star, '#ffffea', alpha * flash * .92, { glow: true, blur: 10 });
    }
    for (let i = 0; i < (ult ? 12 : 9); i++) {
      const a = i * TAU / (ult ? 12 : 9) + seed * .07, radial = v(Math.cos(a), Math.sin(a), .08), side = v(-Math.sin(a), Math.cos(a), 0);
      const length = radius * (.14 + spread * (.63 + rnd(i + 19) * .25)), root = plus(foot, radial, 8), tip = plus(foot, radial, length);
      const bend = plus(plus(foot, radial, length * .58), side, (rnd(seed + i) - .5) * 28);
      bend.z = 12 + Math.sin(spread * Math.PI) * (26 + (i % 3) * 11);
      const sideWidth = (ult ? 10 : 7) * (1 - spread * .48), p0 = plus(root, side, -sideWidth * .35), p1 = plus(bend, side, sideWidth), p2 = tip, p3 = plus(bend, side, -sideWidth * .46);
      g.put([p0, p1, p2, p3], '#ffd869', alpha * breath * .72, { gradient: gradient(root, tip, [[0, '#fffbd8'], [.28, '#ffea9e'], [.74, '#e9b946aa'], [1, '#a7703000']]) });
      const pts = [root, plus(at(root, bend, .48), side, sideWidth), bend, at(bend, tip, .76), tip];
      const depth = Math.max(...pts.map(p => p.x + p.y)) + .2;
      surfaceLine(g, pts, '#fffde3', alpha * breath * .94, 1.4, i === 0, depth);
      if (i % 2 === 0) surfaceLine(g, [bend, plus(at(bend, tip, .55), side, sideWidth * 2), plus(tip, side, sideWidth * 1.8)], '#fff4b5', alpha * breath * .75, .9, false, depth + .01);
    }
    // Short angular sparks shoot beyond the breaker, with analytic trajectories
    // and a tapered point rather than a cloud of slowly hovering dots.
    for (let i = 0; i < (ult ? 19 : 13); i++) {
      const delay = rnd(i + seed) * .09, u = clamp((age - delay) / (.58 + rnd(i) * .18));
      if (u <= 0 || u >= 1) continue;
      const a = i * 2.3999 + seed * .11, speed = .58 + rnd(i * 3) * .49, distance = radius * (.1 + u * speed);
      const p = v(foot.x + Math.cos(a) * distance, foot.y + Math.sin(a) * distance, 13 + Math.sin(u * Math.PI) * (28 + rnd(i + 9) * 95));
      const direction = v(Math.cos(a), Math.sin(a), (.5 - u) * .7), tail = plus(p, direction, -(11 + (1 - u) * 23)), side = v(-Math.sin(a), Math.cos(a), 0), al = Math.sin(u * Math.PI) * alpha;
      g.put([p, plus(tail, side, 1.9), plus(tail, direction, -6), plus(tail, side, -.8)], '#ffe3a0', al * .87);
      g.line([tail, p], '#fffdee', al, 1.05, i < 2); g.particles++;
    }
  }

  // v7: the four-column lightning reference is redrawn as narrow, branched
  // discharges. A leader descends before each hit; the hot return stroke lasts
  // only a fraction of a second. All paths keep one fixed ground contact.
  function revealDischarge(points, progress) {
    const count = (points.length - 1) * clamp(progress), end = Math.floor(count);
    const out = points.slice(0, end + 1);
    if (end < points.length - 1) out.push(at(points[end], points[end + 1], count - end));
    return out.length > 1 ? out : [];
  }

  function dischargePath(top, foot, seed, segments = 20, spread = 26) {
    const out = [], screenSide = v(.7071, -.7071, 0), across = v(.7071, .7071, 0);
    for (let i = 0; i <= segments; i++) {
      const u = i / segments, taper = Math.pow(Math.sin(Math.PI * u), .7);
      const p = at(top, foot, u);
      const zig = (rnd(seed + i * 17) - .5) * spread * 1.55;
      const drift = Math.sin(u * 7.2 + seed) * spread * .54;
      out.push(plus(plus(p, screenSide, (zig + drift) * taper), across, (rnd(seed + i * 31) - .5) * spread * .7 * taper));
    }
    return out;
  }

  function electricLine(g, points, alpha, width, depth, ground = false, glow = false) {
    if (points.length < 2 || alpha < .009) return;
    // The broadest pass is light only. There is no filled lightning polygon.
    g.put(points, '#ffd58a', alpha * .12, { fill: false, width: width * 4.1, depth, ground, glow, blur: 5, blend: 'screen' });
    g.put(points, '#ffe5ac', alpha * .72, { fill: false, width: width * 1.6, depth: depth + .01, ground, blend: 'screen' });
    g.put(points, '#fffff3', alpha, { fill: false, width: width * .66, depth: depth + .02, ground, blend: 'screen' });
  }

  function skyDischarge(g, foot, angle, age, seed, reduced) {
    const top = v(foot.x - Math.cos(angle) * 36, foot.y - Math.sin(angle) * 36, 348);
    const trunk = dischargePath(top, foot, seed, 22, 26), depth = foot.x + foot.y;
    const leader = clamp((age + .16) / .16), connected = age >= 0;
    // Stable seeded branches keep their identity during the short discharge.
    // Their visibility travels down the tree; random geometry never jitters.
    const returnStroke = age < 0 ? 0 : Math.exp(-age * 12.5) * (reduced ? .82 : .77 + .23 * Math.pow(Math.cos(age * 66), 2));
    const alpha = connected ? returnStroke : .28 + leader * .32;
    electricLine(g, revealDischarge(trunk, connected ? 1 : leader), alpha, connected ? 3.5 : 1.3, depth, false, true);
    for (let j = 0; j < 8; j++) {
      const index = 3 + j * 2, u = index / 22, root = trunk[index];
      const branchProgress = connected ? 1 : clamp((leader - u) / .24);
      if (branchProgress <= 0) continue;
      const side = j % 2 ? -1 : 1, turn = -Math.PI / 4 + side * .19 + (rnd(seed + j * 3) - .5) * .65;
      const reach = (44 + rnd(seed + j * 5) * 65) * (1 - u * .35);
      const end = v(root.x + Math.cos(turn) * reach * side, root.y + Math.sin(turn) * reach * side, Math.max(8, root.z - 40 - rnd(seed + j * 7) * 83));
      const branch = dischargePath(root, end, seed + j * 79 + 29, 8, 9);
      electricLine(g, revealDischarge(branch, branchProgress), alpha * (.49 + rnd(j + 3) * .3), connected ? 1.2 : .7, depth + .06, false, j < 2);
      if (j % 2 === 0 && branchProgress > .5) {
        const split = branch[3], tip = v(end.x + Math.cos(turn) * side * 29, end.y + Math.sin(turn) * side * 29, Math.max(6, end.z - 31));
        const twig = dischargePath(split, tip, seed + j * 61 + 451, 6, 6);
        electricLine(g, revealDischarge(twig, connected ? 1 : (branchProgress - .5) * 2), alpha * .35, .66, depth + .09);
      }
    }
    if (!connected && trunk.length > 2 && leader > .05) {
      const tip = revealDischarge(trunk, leader).at(-1), spark = 2.2;
      g.line([plus(tip, v(.7071, -.7071, 0), -spark), plus(tip, v(.7071, -.7071, 0), spark)], '#fff8da', .8, 1.1);
    }
  }

  function groundedDischarge(g, foot, age, radius, seed) {
    const spread = smooth(0, .23, age), flash = Math.exp(-age * 25), glow = Math.exp(-age * 15);
    const residue = (1 - smooth(.48, .93, age)) * Math.exp(-age * 2.5);
    const depth = foot.x + foot.y;
    if (glow > .009) {
      const glowPoints = [];
      for (let i = 0; i < 24; i++) {
        const a = i * TAU / 24;
        glowPoints.push(v(foot.x + Math.cos(a) * (22 + spread * 15), foot.y + Math.sin(a) * (22 + spread * 15), 1));
      }
      g.put(glowPoints, '#ffe5a0', glow * .12, { ground: true, glow: true, blur: 11, blend: 'screen' });
      // Small contact star sits on the ground, with one vertical electric flash.
      for (let j = 0; j < 4; j++) {
        const a = j * Math.PI / 4, span = j % 2 ? 14 : 26;
        const d = v(Math.cos(a), Math.sin(a), 0);
        electricLine(g, [plus(foot, d, -span), foot, plus(foot, d, span)], flash * .94, j % 2 ? 1.25 : 2.2, depth + .11, true);
      }
      electricLine(g, [v(foot.x, foot.y, 1), v(foot.x, foot.y, 29)], flash * .85, 1.7, depth + .12);
    }
    // Short branching channels spread over the ground; broken terminal
    // filaments outlive the shaft, without building a solid circular wall.
    for (let j = 0; j < 11; j++) {
      const angle = j * TAU / 11 + seed * .012 + (rnd(j + seed) - .5) * .17;
      const radial = v(Math.cos(angle), Math.sin(angle), 0), side = v(-Math.sin(angle), Math.cos(angle), 0);
      const length = radius * (.46 + rnd(seed + j * 11) * .46);
      const points = [];
      for (let k = 0; k <= 9; k++) {
        const u = k / 9, p = plus(foot, radial, 4 + u * length);
        points.push(plus(p, side, (rnd(seed + j * 41 + k * 13) - .5) * 30 * Math.sin(u * Math.PI)));
      }
      const channel = revealDischarge(points, spread);
      electricLine(g, channel, residue * (.32 + flash * .66), 1.05, depth, true, j === 0);
      if (spread > .62 && j % 2 === 0) {
        const start = points[5], end = plus(points[9], side, (j % 4 ? 1 : -1) * (24 + rnd(seed + j) * 21));
        electricLine(g, revealDischarge(dischargePath(start, end, seed + j * 29, 5, 8), (spread - .62) / .38), residue * .5, .72, depth, true);
      }
      if (age > .16 && age < .72 && j % 2 === 0) {
        const u = clamp((age - .12 - rnd(j + seed) * .06) / .55);
        const distance = radius * (.19 + u * .65), p = plus(foot, radial, distance);
        p.z = 6 + Math.sin(u * Math.PI) * (23 + rnd(j + 73) * 30);
        const velocity = v(radial.x, radial.y, (.5 - u) * 1.4);
        const tail = plus(p, velocity, -(7 + (1 - u) * 9));
        electricLine(g, [tail, plus(at(tail, p, .54), side, 2.1), p], Math.sin(u * Math.PI) * residue * .9, .85, p.x + p.y);
        g.particles++;
      }
    }
  }

  // v9 returns to the approved v5 eight-cell gold sword material. The v7
  // reference informs only the descending contact and timing: it does not
  // replace the original bevels, ivory fissures, violet veil or rolling crest.
  function fallingThunder(g, e, t) {
    const angle = e.angle || 0, r = e.radius, fade = 1 - smooth(2.03, e.duration, t);
    const charge = smooth(0, .12, t), prep = charge * (1 - smooth(.23, .41, t));
    if (prep > .01) {
      const base = v(e.x, e.y, 47), top = v(e.x - Math.cos(angle) * 8, e.y - Math.sin(angle) * 8, 211);
      solidBolt(g, top, base, 16, prep * .76, e.seed + 21, angle + 1.45, true, t * (e.reduced ? .3 : 1));
      thunderCrest(g, e, r * (.25 + charge * .18), angle + t * .85, charge, prep * .43, 4, 43);
      for (let j = 0; j < 7; j++) {
        const a = angle + j * TAU / 7, p = v(e.x + Math.cos(a) * r * .38, e.y + Math.sin(a) * r * .38, 47 + j % 3 * 34 + charge * 17);
        goldenShard(g, p, a, 49, 8, prep * .73, j);
      }
    }
    for (let k = 0; k < 3; k++) {
      const age = t - (.35 + k * .54), direction = angle + k * TAU / 3;
      if (age < -.16 || age > 1.12) continue;
      // One immutable point per strike, as in the v7 correction. A true
      // descending tip reaches z=5 exactly when its matching damage fires.
      const foot = v(e.x + Math.cos(direction) * r * .28, e.y + Math.sin(direction) * r * .28, 5);
      const top = v(foot.x - Math.cos(direction) * 29, foot.y - Math.sin(direction) * 29, 321);
      const descent = smooth(-.16, 0, age), end = at(top, foot, descent);
      const hot = age < 0 ? (.22 + descent * .58) : Math.exp(-age * 5.5) * (1 - smooth(.43, .7, age));
      if (hot > .012) {
        solidBolt(g, top, end, (age < 0 ? 14 : 23) * (.74 + descent * .26), hot * fade, e.seed + k * 97, direction + 1.45, true, Math.max(0, age) * (e.reduced ? .3 : 1));
        for (let j = 0; j < 4; j++) {
          const u = .34 + j * .15; if (descent < u) continue;
          const an = direction + (j - 1) * 1.23, meet = at(top, foot, u);
          const crown = v(foot.x + Math.cos(an) * (64 + j * 15), foot.y + Math.sin(an) * (64 + j * 15), 194 + j * 25);
          // The main trunk owns the soft corona. Branches retain their gold
          // facets without four extra overlapping blur passes per junction.
          solidBolt(g, crown, meet, 6.5, hot * fade * .78, e.seed + k * 31 + j * 15, an + .6, false, Math.max(0, age) * (e.reduced ? .3 : 1), false);
        }
      }
      if (age < 0) continue;
      const spread = smooth(0, .62, age), sustain = Math.exp(-age * 2.6) * fade, contact = { x: foot.x, y: foot.y };
      thunderCrest(g, contact, r * (.28 + spread * .74), direction - age * .8, 1 - spread * .61, sustain * .76, k * 7, 54);
      thunderImpact(g, foot, age, r, fade, e.seed + k * 11, true);
      for (let j = 0; j < 9; j++) {
        const an = j * TAU / 9 + k * .51, flight = clamp(age / 1.05), distance = r * (.16 + .81 * flight) * (.67 + rnd(j * 8 + k) * .33);
        const height = (37 + rnd(j + 13) * 82) * Math.sin(Math.PI * flight);
        const p = v(foot.x + Math.cos(an) * distance, foot.y + Math.sin(an) * distance, 10 + height);
        goldenShard(g, p, an + flight, 42 * (1 - flight * .55), 7.8 * (1 - flight * .48), sustain * .85, j);
      }
      // Fine grounded channels connect the old material crest to the fixed
      // impact; they support the sword silhouette instead of becoming it.
      groundedDischarge(g, foot, age, r, e.seed + k * 79);
    }
    const wake = smooth(.27, .59, t) * fade;
    if (wake > .01) {
      const veil = { dark: '#554365', body: '#9d7d94', edge: '#dab393', core: '#fff4cc' };
      membrane(g, u => { const a = angle + t * .72 + u * TAU * .82, rr = r * (.65 + u * .31); return v(e.x + Math.cos(a) * rr, e.y + Math.sin(a) * rr, 20 + Math.sin(u * Math.PI) * 86); },
        u => { const a = angle + t * .72 + u * TAU * .82; return v(Math.cos(a) * .35, Math.sin(a) * .35, .92); },
        u => 25 * Math.pow(Math.sin(Math.PI * u), .7), wake * .3, veil, 36);
      for (let i = 0; i < (e.reduced ? 10 : 18); i++) {
        const phase = frac(rnd(i + e.seed) + t * .24), a = i * 2.3999 + t * .35, distance = r * (.23 + rnd(i * 6 + 20) * .79);
        const p = v(e.x + Math.cos(a) * distance, e.y + Math.sin(a) * distance, 16 + phase * 173);
        g.line([plus(p, v(-Math.sin(a), Math.cos(a), -.8), 8), p], i % 3 ? GOLD.edge : GOLD.core, Math.sin(phase * Math.PI) * wake * .58, i % 5 ? .9 : 1.7);
        g.particles++;
      }
    }
  }

  function thunder(g, e, t, pal, H) {
    if (e.tier === 'e') return fallingThunder(g, e, t);
    const ult = e.tier === 'e', fade = 1 - smooth(e.duration - (ult ? .82 : .38), e.duration, t), charge = smooth(0, ult ? .27 : .13, t);
    const a = e.angle || 0, radial = v(Math.cos(a), Math.sin(a), 0), r = e.radius;
    const turn = a + t * (e.reduced ? .8 : 1.35), prep = charge * (1 - smooth(ult ? .28 : .13, ult ? .59 : .35, t));
    // Row 1 / 2 wind-up: a pointed gold core, suspended bevelled fragments and
    // a broad, violet-backed electric veil. This remains visible before impact.
    if (prep > .01) {
      const coreBase = plus(v(e.x, e.y, 42), radial, 5), coreTop = plus(coreBase, v(0, 0, 1), ult ? 226 : 144);
      solidBolt(g, coreTop, coreBase, ult ? 21 : 15, prep * .98, e.seed + 21, a + Math.PI / 2, true, t * (e.reduced ? .3 : 1));
      thunderCrest(g, e, r * (.28 + charge * .2), turn, charge, prep * .57, 4, ult ? 52 : 29);
      for (let i = 0; i < (ult ? 7 : 4); i++) {
        const an = a + i * TAU / (ult ? 7 : 4), p = v(e.x + Math.cos(an) * r * .39, e.y + Math.sin(an) * r * .39, 49 + (i % 3) * 38 + charge * 15);
        goldenShard(g, p, an, ult ? 55 : 39, ult ? 9 : 6, prep * .8, i);
      }
    }
    const count = ult ? 3 : 1;
    for (let k = 0; k < count; k++) {
      const age = t - (ult ? .35 + k * .54 : .22);
      if (age < 0 || age > 1.85) continue;
      const flash = Math.exp(-age * 4.3), sustain = Math.exp(-age * 1.7), spread = smooth(0, .65, age);
      const angle = a + k * TAU / 3, dist = ult ? r * .28 : r * .21;
      const foot = v(e.x + Math.cos(angle) * dist, e.y + Math.sin(angle) * dist, 8);
      const crown = plus(foot, v(-Math.cos(angle) * 28, -Math.sin(angle) * 28, 1));
      crown.z = ult ? 316 : 204;
      const beamAlpha = (flash * .62 + sustain * .45) * fade;
      solidBolt(g, crown, foot, ult ? 27 : 19, beamAlpha, e.seed + k * 97, angle + 1.45, true, age * (e.reduced ? .3 : 1));
      // The branching crown is stable in space; opacity breathes, never frame-random jitters.
      for (let j = 0; j < (ult ? 4 : 3); j++) {
        const an = angle + (j - 1) * 1.23, top = v(foot.x + Math.cos(an) * (66 + j * 17), foot.y + Math.sin(an) * (66 + j * 17), (ult ? 194 : 131) + j * 26);
        const meet = at(crown, foot, .42 + j * .17);
        solidBolt(g, top, meet, ult ? 8 : 5.5, beamAlpha * .9, e.seed + k * 31 + j * 15, an + .6, false, age * (e.reduced ? .3 : 1));
      }
      // Row impact frames: curled white-gold breakers, splayed sharp fragments,
      // and ground fissures. The wave cools slowly after each timed hit.
      const center = { x: foot.x, y: foot.y };
      thunderCrest(g, center, r * (.32 + spread * .73), angle - age * .9, 1 - spread * .6, sustain * fade * .83, k * 7, ult ? 58 : 37);
      thunderImpact(g, foot, age, r, fade, e.seed + k * 11, ult);
      for (let j = 0; j < (ult ? 9 : 7); j++) {
        const an = j * TAU / (ult ? 9 : 7) + k * .51, flight = clamp(age / 1.5);
        const d = r * (.17 + .75 * flight) * (.65 + rnd(j * 8 + k) * .36), height = (40 + rnd(j + 13) * 85) * Math.sin(Math.PI * flight);
        const p = v(foot.x + Math.cos(an) * d, foot.y + Math.sin(an) * d, 10 + height);
        goldenShard(g, p, an + flight, (ult ? 44 : 31) * (1 - flight * .55), (ult ? 8 : 6) * (1 - flight * .48), sustain * fade * .8, j);
        if (j % 2 === 0) {
          const end = v(foot.x + Math.cos(an) * r * spread, foot.y + Math.sin(an) * r * spread, 3), bend = at(foot, end, .55);
          bend.x += Math.cos(an + 1.6) * 14; bend.y += Math.sin(an + 1.6) * 14; bend.z = 3;
          g.line([v(foot.x, foot.y, 3), bend, end], GOLD.edge, sustain * fade * .42, 2, false, true);
          g.line([v(foot.x, foot.y, 3), bend, end], GOLD.core, sustain * fade * .56, .8, false, true);
        }
      }
    }
    // The sprite's last cell leaves a curved charged wake and slow motes,
    // retaining readable volume between the three impacts and while dissolving.
    const wake = smooth(ult ? .29 : .16, ult ? .58 : .3, t) * fade;
    if (wake > .01) {
      const veil = { dark: '#554365', body: '#9d7d94', edge: '#dab393', core: '#fff4cc' };
      membrane(g, u => { const an = a + t * .8 + u * TAU * .82, rr = r * (.65 + u * .31); return v(e.x + Math.cos(an) * rr, e.y + Math.sin(an) * rr, 20 + Math.sin(u * Math.PI) * (ult ? 93 : 47)); },
        u => { const an = a + t * .8 + u * TAU * .82; return v(Math.cos(an) * .35, Math.sin(an) * .35, .92); },
        u => (ult ? 27 : 17) * Math.pow(Math.sin(Math.PI * u), .7), wake * .32, veil, 36);
      for (let i = 0; i < (ult ? 23 : 12); i++) {
        const phase = frac(rnd(i + e.seed) + t * .24), an = i * 2.3999 + t * .35, d = r * (.23 + rnd(i * 6 + 20) * .79), p = v(e.x + Math.cos(an) * d, e.y + Math.sin(an) * d, 16 + phase * (ult ? 205 : 99));
        const al = Math.sin(phase * Math.PI) * wake * .7;
        g.line([plus(p, v(-Math.sin(an), Math.cos(an), -.8), 8), p], i % 3 ? GOLD.edge : GOLD.core, al, i % 5 ? .9 : 1.8);
        g.particles++;
      }
    }
  }

  const JADE = { dark: '#286c76', body: '#66b7aa', edge: '#b8eee2', core: '#f4fff1' };

  // The reference's wide polished jade blades have a raised ivory ridge,
  // translucent green faces and a small warm gold guard. They are not needles.
  function jadeBlade(g, root, a, length, width, alpha, tilt = .15, seed = 0) {
    if (alpha < .009 || length < 2) return;
    const axis = v(Math.cos(a) * Math.cos(tilt), Math.sin(a) * Math.cos(tilt), Math.sin(tilt));
    const side = v(-Math.sin(a), Math.cos(a), .08), us = [0, .12, .3, .56, .77, .93, 1];
    const ps = [], left = [], right = [], inLeft = [], inRight = [];
    for (const u of us) {
      const p = plus(plus(root, axis, length * u), side, Math.sin(Math.PI * u) * length * .025);
      const w = width * Math.pow(Math.sin(Math.PI * Math.pow(u, .64)), .75);
      ps.push(p); left.push(plus(p, side, w)); right.push(plus(p, side, -w));
      inLeft.push(plus(p, side, w * .17)); inRight.push(plus(p, side, -w * .1));
    }
    const tip = ps[ps.length - 1], mid = ps[3], depth = (root.x + root.y + tip.x + tip.y) / 2;
    g.put(left.concat(right.slice().reverse()), JADE.edge, alpha * .1, { depth, glow: true, blur: 4 });
    g.put(left.concat(ps.slice().reverse()), JADE.body, alpha * .8, { depth: depth + .01,
      gradient: gradient(root, tip, [[0, '#55999755'], [.17, '#61acaa'], [.58, '#a7e6d4'], [.89, '#d2fff0'], [1, '#fffff0']]) });
    g.put(ps.concat(right.slice().reverse()), JADE.dark, alpha * .7, { depth: depth + .02,
      gradient: gradient(root, tip, [[0, '#24677555'], [.3, '#328582'], [.72, '#68cbb6'], [1, '#e4fff4']]) });
    g.put(inLeft.concat(inRight.slice().reverse()), JADE.core, alpha * .82, { depth: depth + .03,
      gradient: gradient(root, tip, [[0, '#dcffee00'], [.3, '#bdffdf99'], [.68, '#ecfff0'], [1, '#ffffff']]), blend: 'screen' });
    g.line(left, JADE.core, alpha * .94, 1.45, false);
    g.line(right, JADE.edge, alpha * .84, 1.05);
    g.line(ps, JADE.core, alpha * .86, 1.25, false);
    // Smooth internal striation follows the carved blade contour.
    for (let j = 0; j < 3; j++) {
      const startU = .16 + j * .13, points = [];
      for (let k = 0; k <= 8; k++) {
        const u = startU + k / 8 * (.93 - startU), w = width * Math.pow(Math.sin(Math.PI * Math.pow(u, .64)), .75);
        const p = plus(root, axis, length * u), offset = w * (.36 + j * .16) * (1 - k / 8 * .74);
        points.push(plus(p, side, (j % 2 ? -1 : 1) * offset + Math.sin(Math.PI * u) * length * .025));
      }
      g.line(points, j === 1 ? '#d5e4aa' : JADE.core, alpha * (j === 1 ? .54 : .48), .7);
    }
    const guard = plus(root, axis, length * .12), guardPts = [];
    for (let i = 0; i <= 10; i++) {
      const u = i / 10 * 2 - 1, bow = Math.sin(Math.abs(u) * Math.PI) * width * .34;
      guardPts.push(plus(plus(guard, side, u * width * 1.47), axis, bow - Math.abs(u) * width * .08));
    }
    g.line(guardPts, '#8d8050', alpha * .76, 3.4);
    g.line(guardPts, '#eadcad', alpha * .96, 1.25);
    const jewel = plus(guard, axis, width * .12), jewelSide = width * .22;
    g.put([plus(jewel, axis, jewelSide * 1.4), plus(jewel, side, jewelSide), plus(jewel, axis, -jewelSide * 1.4), plus(jewel, side, -jewelSide)], '#f8efb8', alpha * .88);
    g.line([plus(root, axis, -length * .12), guard], '#a59e69', alpha * .7, 2.8);
    g.line([plus(root, axis, -length * .11), guard], '#ecedc7', alpha * .82, .8);
  }

  function jadeWake(g, fn, normal, width, alpha, seed, featherCount = 9, n = 25) {
    if (alpha < .01) return;
    membrane(g, fn, normal, u => width * Math.pow(Math.sin(Math.PI * u), .66) * (.86 + Math.sin(u * 14 + seed) * .08), alpha, JADE, n, { edgeWidth: 1.65 });
    // Filled feather-shaped lobes, selected from the sheet's layered comet
    // contour. Their tapered silhouettes do most of the visual work.
    for (let i = 0; i < featherCount; i++) {
      const u = .1 + i / Math.max(1, featherCount - 1) * .74, p = fn(u), q = fn(clamp(u + .035)), back = fn(clamp(u - .035));
      const len = Math.hypot(q.x - back.x, q.y - back.y, q.z - back.z) || 1;
      const tangent = v((q.x - back.x) / len, (q.y - back.y) / len, (q.z - back.z) / len), side = normal(u);
      const scale = Math.pow(Math.sin(Math.PI * u), .6), size = width * (.75 + rnd(i + seed) * .3) * scale, sign = i % 3 === 0 ? -1 : 1;
      const start = plus(p, side, sign * size * .3), belly = plus(plus(p, side, sign * size * 1.75), tangent, -size * 1.4);
      const tip = plus(plus(p, side, sign * size * 1.4), tangent, -size * 3.05), end = plus(p, tangent, -size * 1.13);
      const edge = [], returnEdge = [];
      for (let q = 0; q <= 9; q++) {
        edge.push(cubic(start, plus(plus(start, tangent, -size * .8), side, sign * size * .9), belly, tip, q / 9));
        returnEdge.push(cubic(tip, plus(tip, side, -sign * size * .9), end, start, q / 9));
      }
      g.put(edge.concat(returnEdge), i % 3 ? '#75bdb1' : '#368b90', alpha * .58, { gradient: gradient(tip, start, [[0, '#2c858200'], [.4, '#469c9b88'], [.8, '#87d8bc'], [1, '#d6ffdc']]) });
      g.line(edge, JADE.edge, alpha * .52, .85);
      if (i % 2 === 0) {
        const fleck = plus(at(belly, start, .62), side, sign * size * .09);
        g.line([plus(fleck, tangent, -size * .15), fleck, plus(fleck, tangent, size * .15)], '#f4e4ad', alpha * .66, .85);
      }
    }
  }

  function azureDash(g, e, t) {
    const u = clamp(t / e.duration), open = smooth(0, .09, t), fade = 1 - smooth(.16, e.duration, t), alpha = open * fade;
    const start = v(e.x, e.y, 39), end = v(Number.isFinite(e.x2) ? e.x2 : e.x + Math.cos(e.angle) * 170, Number.isFinite(e.y2) ? e.y2 : e.y + Math.sin(e.angle) * 170, 43);
    const a = Math.atan2(end.y - start.y, end.x - start.x), side = v(-Math.sin(a), Math.cos(a), .18);
    const reach = at(start, end, smooth(0, .16, t));
    for (let k = 0; k < 2; k++) {
      const off = k ? -.55 : .65;
      const fn = s => plus(plus(at(start, reach, s), side, Math.sin(Math.PI * s) * off * 46), v(0, 0, 1), Math.sin(Math.PI * s) * (k ? 10 : 32));
      jadeWake(g, fn, () => side, k ? 10 : 19, alpha * (k ? .32 : .62), e.seed + k * 10, k ? 4 : 6, 18);
    }
    jadeBlade(g, plus(reach, v(-Math.cos(a), -Math.sin(a), 0), 29), a, 94, 13, alpha * .9, .07, e.seed);
  }

  function azure(g, e, t, pal, H) {
    if (e.tier === 'dash') { azureDash(g, e, t); return; }
    const ult = e.tier === 'e', a = e.angle || 0, r = e.radius, fade = 1 - smooth(e.duration - (ult ? .8 : .36), e.duration, t);
    const form = smooth(0, ult ? .22 : .11, t), unfold = smooth(ult ? .17 : .09, ult ? .56 : .3, t), clear = smooth(ult ? .46 : .23, ult ? .85 : .45, t);
    // Wind-up cells: three upward polished jade leaves, shown without placing
    // the large blades on the character's face.
    const prep = form * (1 - clear);
    for (let k = 0; k < (ult ? 3 : 1); k++) {
      const an = a + (k - (ult ? 1 : 0)) * .64;
      const base = v(e.x + Math.cos(an) * 37, e.y + Math.sin(an) * 37, 39);
      jadeBlade(g, base, an, (ult ? 158 : 125) * form, ult ? 21 : 17, prep * .88, 1.21 - Math.abs(k - 1) * .2, k);
    }
    if (!ult) {
      // Q rows 2–3: a sweeping curved jade cut, then a crossing second edge.
      for (let k = 0; k < 2; k++) {
        const age = t - (k ? .2 : .075), open = smooth(0, .16, age), disappear = 1 - smooth(.48, .8, age), al = open * disappear * fade;
        if (al < .01) continue;
        const sign = k ? -1 : 1, turn = a + (k ? .6 : -.55), span = 2.6, baseR = r * (.52 + open * .46);
        const fn = s => { const an = turn - span * .63 + s * span; return v(e.x + Math.cos(an) * baseR + Math.cos(a) * open * 31, e.y + Math.sin(an) * baseR + Math.sin(a) * open * 31, 35 + Math.sin(Math.PI * s) * (k ? 37 : 91) + k * 24); };
        jadeWake(g, fn, s => { const an = turn - span * .63 + s * span; return v(Math.cos(an) * .74, Math.sin(an) * .74, .58 * sign); }, k ? 26 : 35, al * .72, k * 20 + 4, 10);
        const p = fn(.83), tangentA = turn - span * .63 + .83 * span + Math.PI / 2;
        jadeBlade(g, p, tangentA, 130, 21, al * .94, k ? -.18 : .09, k);
      }
    } else {
      // E moves through the sheet's open seven-blade fan into an airy jade
      // spiral. The clear central hole retains the hero and enemy telegraphs.
      const orbit = smooth(.47, 1.03, t), dissolve = smooth(1.6, e.duration, t), n = 7;
      for (let k = 0; k < n; k++) {
        const stagger = smooth(.12 + k * .037, .42 + k * .037, t), al = stagger * fade * (.86 + .09 * Math.sin(t * 3.1 + k));
        if (al < .01) continue;
        const fanAngle = a - .93 + k * .31, orbitAngle = a + k * TAU / n + t * (e.reduced ? .48 : 1.02);
        const angle = fanAngle * (1 - orbit) + orbitAngle * orbit;
        const reach = r * (.43 + unfold * .34 + dissolve * .15), cx = e.x, cy = e.y;
        const baseAngle = angle - (.66 + orbit * .43), endAngle = angle + .18;
        const fn = s => {
          const theta = baseAngle + s * (endAngle - baseAngle), rr = reach * (.56 + s * .52);
          const fanLift = (1 - orbit) * (40 + (3 - Math.abs(k - 3)) * 13);
          return v(cx + Math.cos(theta) * rr, cy + Math.sin(theta) * rr, 37 + Math.sin(Math.PI * s) * 51 + fanLift + Math.sin(theta * 1.2 + t) * 14);
        };
        const normal = s => { const theta = baseAngle + s * (endAngle - baseAngle); return v(Math.cos(theta) * .75, Math.sin(theta) * .75, .37); };
        jadeWake(g, fn, normal, (27 + (k % 2) * 4) * (1 - dissolve * .35), al * .54, k * 13 + 9, 7, 22);
        const root = fn(.77), bladeAngle = angle + .43 + orbit * .83;
        jadeBlade(g, root, bladeAngle, (136 + (k % 3) * 12) * (1 - dissolve * .3), 23 - dissolve * 8, al * .92, .18 + (1 - orbit) * .28, k);
      }
      // A lower feathered crescent ties the fan together without making a wall.
      const baseAlpha = unfold * fade * .3;
      const fn = s => { const an = a - 1.8 + t * .58 + s * 4.4, rr = r * (.67 + s * .2); return v(e.x + Math.cos(an) * rr, e.y + Math.sin(an) * rr, 15 + Math.sin(Math.PI * s) * 37); };
      jadeWake(g, fn, s => { const an = a - 1.8 + t * .58 + s * 4.4; return v(Math.cos(an) * .8, Math.sin(an) * .8, .55); }, 25, baseAlpha, 59, 7, 26);
    }
    // Little translucent blade flakes replace the old lightning jitter.
    for (let i = 0; i < (ult ? 16 : 9); i++) {
      const phase = frac(rnd(i + e.seed) + t * .32), an = i * 2.3999 + t * .51, rr = r * (.39 + rnd(i + 33) * .69), alpha = Math.sin(Math.PI * phase) * unfold * fade * .53;
      const p = v(e.x + Math.cos(an) * rr, e.y + Math.sin(an) * rr, 25 + phase * (ult ? 148 : 96)), dir = v(-Math.sin(an), Math.cos(an), .4), side = v(Math.cos(an), Math.sin(an), -.1);
      const len = 8 + rnd(i + 9) * 11;
      g.put([plus(p, dir, len), plus(p, side, 3), plus(p, dir, -len * .6), plus(p, side, -2)], JADE.edge, alpha * .7);
      g.line([plus(p, dir, -len * .5), plus(p, dir, len)], i % 4 ? JADE.core : '#e9ddb0', alpha, .6);
      g.particles++;
    }
  }

  window.SwordFXModels = window.SwordFXModels || {};
  window.SwordFXModels.daben = thunder;
  window.SwordFXModels.tiaotiao = azure;
})();
