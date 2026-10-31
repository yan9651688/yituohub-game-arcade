/* Seven Swords v5 — 雨花 / 旋风 / 琴针飞箭.
   These world-space curves were drawn after inspecting the generated eight-frame
   reference sheets. No bitmap is embedded in any effect. */
(function () {
  'use strict';
  const M = window.SwordFXModels || (window.SwordFXModels = {});
  const PI = Math.PI, TAU = PI * 2;
  const V = (x, y, z = 0) => ({ x, y, z });
  const C = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const L = (a, b, u) => a + (b - a) * u;
  const A = (p, d, s = 1) => V(p.x + d.x * s, p.y + d.y * s, p.z + d.z * s);
  const P = (a, b, u) => V(L(a.x, b.x, u), L(a.y, b.y, u), L(a.z, b.z, u));
  const S = (a, b, t) => { const u = C((t - a) / (b - a)); return u * u * (3 - 2 * u); };
  const F = v => v - Math.floor(v);
  const R = n => F(Math.sin(n * 127.1 + 311.7) * 43758.5453123);
  const WATER = { shade: '#277f83', body: '#66bcab', edge: '#daf3d0', core: '#fffce8' };
  const WIND = { shade: '#376e63', body: '#81aa7e', edge: '#e5e7b7', core: '#fff9d9' };

  // A broad translucent surface is split into a few curved panels. This keeps
  // the fold continuous while allowing the world renderer to sort its depth.
  function silk(g, curve, normal, width, alpha, pal, opts = {}) {
    if (alpha < .01) return;
    const n = opts.n || 32, step = 4, ps = [], lo = [], hi = [], ridge = [];
    for (let j = 0; j <= n; j++) {
      const u = j / n, p = curve(u), d = normal(u), w = width(u);
      ps.push(p); lo.push(A(p, d, -w)); hi.push(A(p, d, w)); ridge.push(A(p, d, -w * .46));
    }
    const lightAt = Math.floor(n * .46);
    for (let j = 0; j < n; j += step) {
      const end = Math.min(n, j + step), middle = Math.floor((j + end) / 2);
      const a = lo.slice(j, end + 1), b = hi.slice(j, end + 1), c = ridge.slice(j, end + 1);
      const common = { ground: !!opts.ground };
      g.put(a.concat(b.slice().reverse()), pal.body, alpha * .74, Object.assign({}, common, {
        gradient: { from: lo[lightAt], to: hi[lightAt], stops: [[0, pal.edge], [.16, pal.core], [.35, pal.body], [.72, pal.shade], [1, pal.edge]] }
      }));
      g.put(a.concat(c.reverse()), pal.core, alpha * .28, Object.assign({}, common, {
        gradient: { from: lo[lightAt], to: ridge[lightAt], stops: [[0, pal.core], [.46, pal.edge], [1, pal.body + '00']] }, blend: 'screen'
      }));
    }
    g.line(lo, pal.core, alpha * .72, opts.width || 1.7, !!opts.glow, !!opts.ground);
    g.line(hi, pal.edge, alpha * .46, 1, false, !!opts.ground);
    g.line(ridge, pal.edge, alpha * .43, .85, false, !!opts.ground);
    if (opts.vein) g.line(ps, pal.core, alpha * .36, .8, false, !!opts.ground);
  }

  // Rose-ivory petals have a rounded contour, a curled rim and an inset fold.
  // Their peach colour is deliberate: it is a key distinction in the sheet.
  function petal(g, base, angle, length, width, lift, alpha, opts = {}) {
    if (alpha < .008 || length < .1) return;
    const d = V(Math.cos(angle), Math.sin(angle)), side = V(-d.y, d.x), n = opts.small ? 5 : 7;
    const lo = [], hi = [], mid = [], fold = [], tipLift = opts.tip == null ? lift * .55 : opts.tip;
    const turn = opts.turn || 0;
    for (let j = 0; j <= n; j++) {
      const u = j / n, w = width * Math.pow(Math.sin(PI * u), .72);
      const p = A(A(base, d, length * u), V(0, 0, 1), lift * Math.sin(PI * u) * .62 + tipLift * u);
      const normal = V(side.x, side.y, turn * Math.sin(PI * u));
      lo.push(A(p, normal, -w)); hi.push(A(p, normal, w)); mid.push(p); fold.push(A(p, normal, w * .19));
    }
    const root = base, tip = mid[n], shade = opts.shade || '#c67e8c', rim = opts.rim || '#fff9e8';
    g.put(lo.concat(hi.slice().reverse()), '#ffdcce', alpha * .94, {
      gradient: { from: root, to: tip, stops: [[0, shade], [.30, '#f1b6ae'], [.7, '#ffe7cf'], [1, rim]] }
    });
    g.put(mid.concat(hi.slice().reverse()), '#fff7e3', alpha * .6, {
      gradient: { from: lo[Math.floor(n / 2)], to: hi[Math.floor(n / 2)], stops: [[0, '#df979c00'], [.65, '#fff6de'], [1, '#fffdf0']] }
    });
    g.line(lo, '#fff9e9', alpha * .72, opts.small ? .6 : .9);
    if (!opts.small) g.line(fold, '#fff5d5', alpha * .46, .6);
  }

  function lotus(g, base, size, spin, alpha, detail = true) {
    if (alpha < .012 || size < .5) return;
    const petals = detail ? 6 : 5;
    for (let j = 0; j < petals; j++) {
      const a = spin + j * TAU / petals;
      petal(g, base, a, size * (1 + .08 * Math.sin(j * 2)), size * .33, size * .53, alpha, { tip: size * .19, small: !detail });
    }
    for (let j = 0; j < (detail ? 3 : 2); j++) {
      const a = spin + .34 + j * TAU / (detail ? 3 : 2);
      petal(g, A(base, V(0, 0, 1), size * .13), a, size * .62, size * .24, size * .58, alpha * .94, { tip: size * .65, small: true, shade: '#dfae71' });
    }
    const center = A(base, V(0, 0, 1), size * .42), stamens = detail ? 6 : 4;
    for (let j = 0; j < stamens; j++) {
      const a = j * 2.399 + spin, r = size * (.09 + .12 * R(j + 32));
      const end = A(center, V(Math.cos(a) * r, Math.sin(a) * r, size * (.14 + .1 * R(j + 8))));
      g.line([A(base, V(0, 0, 1), size * .28), end], '#ffc577', alpha * .85, .9);
      const s = Math.max(.6, size * .035), side = V(.7, -.7, 0);
      g.put([A(end, V(0, 0, 1), s * 1.4), A(end, side, s), A(end, V(0, 0, 1), -s), A(end, side, -s)], '#fff1af', alpha);
    }
  }

  function dew(g, base, size, alpha, turn = 0) {
    if (alpha < .01 || size < .2) return;
    const side = V(Math.cos(-.76 + turn * .14), Math.sin(-.76 + turn * .14), 0), n = 8, lo = [], hi = [], seam = [];
    for (let j = 0; j <= n; j++) {
      const u = j / n, w = size * Math.pow(Math.sin(PI * u), .78) * (.4 + .64 * u);
      const p = A(base, V(0, 0, 1), size * (2.05 - u * 3.0));
      lo.push(A(p, side, -w)); hi.push(A(p, side, w)); seam.push(A(p, side, -w * .45));
    }
    g.put(lo.concat(hi.slice().reverse()), '#9cdbcd', alpha * .88, {
      gradient: { from: lo[5], to: hi[5], stops: [[0, '#fff9dc'], [.16, '#dff7e9'], [.38, '#8fcfc6'], [.66, '#2c858e'], [1, '#d8efd4']] }
    });
    g.put(seam.slice(3).concat(hi.slice(3).reverse()), '#fff0b5', alpha * .33, {
      gradient: { from: base, to: A(base, V(0, 0, 1), -size), stops: [[0, '#c6e8d000'], [1, '#fff4bd']] }
    });
    g.line(lo, '#fff9dd', alpha * .82, size > 6 ? 1.1 : .7);
    g.line(seam.slice(2, 7), '#f8fff3', alpha * .82, Math.max(.8, size * .14));
    g.particles++;
  }

  function sprig(g, p, angle, size, alpha, pal = WATER) {
    const d = V(Math.cos(angle), Math.sin(angle), .2), s = V(-d.y, d.x, .25), tip = A(p, d, size), n = 6, left = [], right = [];
    for (let j = 0; j <= n; j++) {
      const u = j / n, at = A(p, d, size * u), w = Math.sin(PI * u) * size * .23;
      left.push(A(at, s, w)); right.push(A(at, s, -w));
    }
    g.put(left.concat(right.reverse()), pal.body, alpha * .74, { gradient: { from: p, to: tip, stops: [[0, pal.shade], [.55, pal.body], [1, pal.edge]] } });
    g.line([p, A(P(p, tip, .65), V(0, 0, 1), size * .04), tip], pal.core, alpha * .74, .65);
    g.particles++;
  }

  function loosePetals(g, e, t, count, radius, height, alpha, delay = 0) {
    const age = Math.max(0, t - delay);
    for (let j = 0; j < count; j++) {
      const u = F(age * .17 + R(j * 7 + e.seed)), a = j * 2.399963 + age * .26;
      const r = radius * (.32 + R(j + 41) * .65) + Math.sin(age + j) * 8;
      const p = V(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 12 + (1 - u) * height);
      petal(g, p, a + PI / 2 + Math.sin(age + j) * .65, 10 + R(j + 2) * 10, 3 + R(j + 3) * 3, 5, alpha * Math.sin(u * PI), { small: true, turn: Math.sin(age * 1.4 + j), tip: 3 });
      g.particles++;
    }
  }

  M.doudou = function (g, e, t, pal, H) {
    const ult = e.tier === 'e', grow = S(0, ult ? .54 : .19, t), fade = 1 - S(e.duration - (ult ? .94 : .43), e.duration, t);
    const alpha = grow * fade, r = e.radius * (ult ? .90 : .84), reduced = !!e.reduced;
    if (!ult) {
      const sweep = S(.05, .67, t), spin = e.angle - .86 + sweep * 1.6;
      const curve = u => { const a = spin + u * PI * 1.55, rad = r * (.62 + .34 * u) * (.58 + .42 * grow); return V(e.x + Math.cos(a) * rad, e.y + Math.sin(a) * rad, 16 + Math.sin(PI * u) * (48 + 58 * sweep) + u * 30); };
      silk(g, curve, u => { const a = spin + u * PI * 1.55; return V(Math.cos(a) * .7, Math.sin(a) * .7, .72); }, u => Math.pow(Math.sin(PI * u), .6) * (23 + 10 * Math.sin(u * PI)), alpha * .97, WATER, { n: 40, glow: true, vein: true });
      // An inner curl gives the C-shaped water blade thickness and lift.
      silk(g, u => { const p = curve(u); return A(A(p, V(0, 0, 1), 18 * Math.sin(PI * u)), V(Math.cos(spin + u * PI * 1.55), Math.sin(spin + u * PI * 1.55), 0), -22); }, u => V(Math.cos(spin + u * PI * 1.55) * .5, Math.sin(spin + u * PI * 1.55) * .5, .7), u => Math.sin(PI * u) * 9, alpha * .56, WATER, { n: 28 });
      for (let j = 0; j < 4; j++) { const u = .16 + j * .20, p = curve(u); lotus(g, A(p, V(0, 0, 1), 4), (j === 2 ? 27 : 18) * grow, spin + u * PI, alpha * .93, j === 2); }
      for (let j = 0; j < (reduced ? 8 : 16); j++) {
        const u = (.06 + j / 17 + sweep * .18) % 1, p = curve(u), h = (6 + R(j + 20) * 22) * Math.sin(PI * sweep);
        dew(g, A(p, V(0, 0, 1), h), 3.5 + R(j) * 4.1, alpha * Math.sin(PI * u) * .83, t + j);
        if (j % 2 === 0) sprig(g, p, spin + u * PI * 1.55 + PI / 2, 16 + R(j + 1) * 11, alpha * .7);
      }
      loosePetals(g, e, t, reduced ? 7 : 12, r, 135, alpha * S(.13, .42, t));
      return;
    }

    const rise = S(.10, .82, t), fall = S(e.duration - 1.05, e.duration, t), domeHeight = (206 + 8 * Math.sin(t * .9)) * rise * (1 - fall * .68);
    // Water roots and open lotus blossoms remain low; the centre is clear.
    for (let k = 0; k < 2; k++) {
      const phase = e.angle + k * PI + t * .16;
      silk(g, u => { const a = phase + u * PI * 1.74, rr = r * (.77 + .12 * Math.sin(PI * u)) * (.48 + .52 * grow); return V(e.x + Math.cos(a) * rr, e.y + Math.sin(a) * rr, 5 + 10 * Math.sin(PI * u)); }, u => { const a = phase + u * PI * 1.74; return V(Math.cos(a), Math.sin(a), .13); }, u => Math.pow(Math.sin(PI * u), .65) * 14, alpha * .7, WATER, { ground: true, n: 32, vein: true });
    }
    const branches = reduced ? 6 : 8;
    for (let k = 0; k < branches; k++) {
      const a = e.angle + k * TAU / branches + .08 * Math.sin(t * .7 + k), front = Math.cos(a) + Math.sin(a) > .20;
      const height = domeHeight * (front ? .78 : 1.05), startU = front ? .30 : .02;
      const curve = v => { const u = L(startU, .99, v), rr = r * Math.sin(u * PI / 2) * rise, bend = .16 * Math.sin(u * PI) + .10 * Math.sin(u * TAU + t * .36 + k) * Math.sin(PI * u); return V(e.x + Math.cos(a + bend) * rr, e.y + Math.sin(a + bend) * rr, 15 + height * Math.pow(Math.cos(u * PI / 2), .76) + Math.sin(u * TAU + k * .7 + t * .23) * 19 * Math.sin(PI * u)); };
      silk(g, curve, u => V(-Math.sin(a) * .77, Math.cos(a) * .77, .28 * Math.cos(u * PI)), u => Math.pow(Math.sin(PI * u), .65) * (front ? 12 : 18) * (.84 + .16 * Math.sin(u * 13 + k + t * .7)), alpha * (front ? .55 : .79), WATER, { n: 24, vein: true, glow: k === 2 });
      for (let j = 1; j < 5; j++) {
        const u = j / 6, p = curve(u), d = Math.sin(t * .75 + j + k) * .13;
        sprig(g, p, a + PI / 2 + d, 15 + j * 2, alpha * .8);
        if (j % 2 === 0) sprig(g, A(p, V(0, 0, 1), 2), a - PI / 2 + d, 13 + j * 2, alpha * .73);
      }
      if (k % 2 === 0) lotus(g, curve(.58), (k === 2 ? 24 : 19) * rise, a + t * .04, alpha * .96, false);
      if (!reduced && (k === 1 || k === 5)) {
        const at = curve(.43), shoot = u => A(at, V(Math.cos(a) * u * 64 - Math.sin(a) * Math.sin(PI * u) * 42, Math.sin(a) * u * 64 + Math.cos(a) * Math.sin(PI * u) * 42, Math.sin(PI * u) * 29 - u * 43));
        silk(g, shoot, u => V(-Math.sin(a) * .45, Math.cos(a) * .45, .7), u => Math.sin(PI * u) * 6.4, alpha * .7, WATER, { n: 16 });
        dew(g, shoot(1), 7.5, alpha * .8, t * .2);
      }
    }
    let nearestBloom = 0, frontScore = -2;
    for (let j = 0; j < 6; j++) { const a = e.angle + j * TAU / 6 + .3, score = Math.cos(a) + Math.sin(a); if (score > frontScore) { frontScore = score; nearestBloom = j; } }
    for (let j = 0; j < 6; j++) {
      const primary = j === nearestBloom, a = primary ? PI / 4 : e.angle + j * TAU / 6 + .3, rr = primary ? r * .54 : r * (.86 + .055 * Math.sin(j * 3));
      const p = V(e.x + Math.cos(a) * rr, e.y + Math.sin(a) * rr, 7);
      lotus(g, p, (primary ? 54 : Math.cos(a) + Math.sin(a) > 0 ? 33 : 28) * grow, a + .45, alpha * .98, j === nearestBloom || j === (nearestBloom + 2) % 6 || j === (nearestBloom + 4) % 6);
    }
    const drops = reduced ? 18 : 28;
    for (let j = 0; j < drops; j++) {
      const a = j * 2.399963 + e.angle, rr = r * (.22 + .71 * R(j + 71));
      const phase = F(t * .17 + R(j * 5 + e.seed)), cap = domeHeight * Math.sqrt(Math.max(.08, 1 - Math.pow(rr / (r * 1.06), 2)));
      const z = 10 + cap * (1 - phase * .79) - fall * 28, p = V(e.x + Math.cos(a) * rr, e.y + Math.sin(a) * rr, Math.max(4, z));
      const a2 = alpha * Math.sin(phase * PI) * .90, size = 3.6 + R(j + 40) * 5.0;
      if (j % 3 === 0 && phase < .6) g.line([A(p, V(0, 0, 1), size * 2), A(p, V(0, 0, 1), size * 2 + 12 + (1 - phase) * 16)], '#e1edc9', a2 * .44, .65);
      dew(g, p, size, a2, t * .2 + j);
      if (j % 5 === 0) { const top = A(p, V(0, 0, 1), size * 1.32), glint = .9 + Math.pow(Math.sin(t * 1.8 + j), 10) * 1.4; g.put([A(top, V(0, 0, 1), glint * 2.6), A(top, V(.7, -.7, 0), glint), A(top, V(0, 0, 1), -glint * 2.6), A(top, V(.7, -.7, 0), -glint)], '#fffde8', a2 * .93); }
    }
    loosePetals(g, e, t, reduced ? 8 : 10, r * 1.05, 213 * rise, alpha * .84, .2);
  };

  const GOLD = { shade: '#886741', body: '#c5a671', edge: '#ffedb8', core: '#fffbe1' };
  function bamboo(g, base, angle, size, alpha, sway = 0) {
    const d = V(Math.cos(angle), Math.sin(angle), .10), end = A(base, d, size * .88);
    g.line([base, A(P(base, end, .5), V(0, 0, 1), size * .09), end], '#d2d6a3', alpha * .8, .75);
    for (let k = 0; k < 3; k++) {
      const at = A(base, d, size * (.20 + k * .2)), a = angle + (k % 2 ? -.55 : .49) + sway * .13;
      const l = size * (.64 + (k === 1 ? .18 : 0)), axis = V(Math.cos(a), Math.sin(a), .16 + sway * .09), side = V(-Math.sin(a), Math.cos(a), .13);
      const left = [], right = [], middle = [], n = 8;
      for (let j = 0; j <= n; j++) {
        const u = j / n, w = Math.pow(Math.sin(PI * u), .86) * l * .12;
        const p = A(A(at, axis, u * l), V(0, 0, 1), Math.sin(PI * u) * l * .07);
        left.push(A(p, side, -w)); right.push(A(p, side, w)); middle.push(p);
      }
      g.put(left.concat(right.slice().reverse()), '#6e9b66', alpha * .94, { gradient: { from: at, to: middle[n], stops: [[0, '#476b4d'], [.5, '#8eaf72'], [1, '#dce8b2']] } });
      g.put(middle.concat(right.slice().reverse()), '#bccb8d', alpha * .55);
      g.line(middle, '#f0efbb', alpha * .75, .65);
      for (const q of [3, 5]) {
        const off = A(middle[q], side, l * .07 * (q === 3 ? 1 : -1)), end = A(middle[q + 1], side, l * .06 * (q === 3 ? 1 : -1));
        g.line([middle[q - 1], off, end], '#e7e9ad', alpha * .42, .5);
      }
    }
    g.particles++;
  }

  function goldenCurl(g, at, angle, size, alpha) {
    const pts = [], fine = [];
    for (let j = 0; j <= 20; j++) {
      const u = j / 20, a = angle + u * TAU * 1.18, r = size * (1 - u * .84);
      const p = A(at, V(Math.cos(a) * r, Math.sin(a) * r * .76, Math.sin(a) * r * .28));
      pts.push(p); fine.push(A(p, V(0, 0, 1), 2.1));
    }
    g.line(pts, '#ac905b', alpha * .8, 3.5);
    g.line(fine, '#fff2bb', alpha * .93, 1.2);
  }

  // v7 Q: the reference's pointed crescent is a shallow bevelled blade in
  // world space. It has no vertical cloth face, rolled end or full hoop.
  function windCrescent(g, e, angle, span, radius, height, width, alpha, tilt = 0) {
    if (alpha < .01) return;
    const outer = [], inner = [], bevel = [], n = 24;
    for (let j = 0; j <= n; j++) {
      const u = j / n, a = angle + span * u;
      const taper = Math.pow(Math.sin(PI * u), 1.28) * (.55 + .45 * u);
      const r = radius * (.965 + .035 * u), w = width * taper;
      const z = height + Math.sin(a) * tilt + Math.sin(PI * u) * 3;
      outer.push(V(e.x + Math.cos(a) * (r + w), e.y + Math.sin(a) * (r + w), z + 1.5 * taper));
      inner.push(V(e.x + Math.cos(a) * (r - w * .43), e.y + Math.sin(a) * (r - w * .43), z - 1.4 * taper));
      bevel.push(P(outer[j], inner[j], .24));
    }
    // Three planar sections make the crossing front/rear edges sort against
    // enemies and the swordsman, while a fine ivory cutting edge stays sharp.
    for (let j = 0; j < n; j += 8) {
      const end = j + 8, mid = j + 4, o = outer.slice(j, end + 1), i = inner.slice(j, end + 1), b = bevel.slice(j, end + 1);
      g.put(o.concat(i.slice().reverse()), '#a8c9a6', alpha * .46, {
        gradient: { from: inner[mid], to: outer[mid], stops: [[0, '#68968400'], [.17, '#78a88e'], [.64, '#c7dcac'], [1, '#fffce5']] }
      });
      g.put(o.concat(b.slice().reverse()), '#fff9da', alpha * .91, {
        gradient: { from: bevel[mid], to: outer[mid], stops: [[0, '#dbe4b6'], [.48, '#fff5cf'], [1, '#fffff0']] }
      });
      g.line(o, '#fffcea', alpha * .96, 1.45, j === 8);
    }
    g.line(inner, '#b4d1aa', alpha * .25, .75);
  }

  // Severed leaf halves travel tangentially. Their angular cut edge and short
  // white scar distinguish a sword strike from floating decorative branches.
  function cutLeaf(g, p, angle, size, split, alpha) {
    if (alpha < .01) return;
    const d = V(Math.cos(angle), Math.sin(angle), .15), side = V(-d.y, d.x, .2);
    const a = A(p, d, -split), b = A(p, d, split);
    const edgeL = A(a, side, size * .22), edgeR = A(a, side, -size * .17);
    const edgeL2 = A(b, side, size * .20), edgeR2 = A(b, side, -size * .15);
    const tail = A(a, d, -size * .55), tip = A(b, d, size * .72);
    g.put([tail, edgeL, edgeR], '#749b6b', alpha * .88);
    g.put([edgeL2, tip, edgeR2], '#b4cb8e', alpha * .95);
    g.line([tail, a], '#d4dfab', alpha * .6, .65);
    g.line([b, tip], '#edf1bc', alpha * .74, .65);
    g.line([edgeL2, edgeR2], '#fffae0', alpha * .86, .8);
    g.particles += 2;
  }

  M.dada = function (g, e, t, pal, H) {
    const ult = e.tier === 'e', rise = S(0, ult ? .38 : .31, t), release = S(ult ? .18 : .08, ult ? .8 : .68, t);
    const fade = 1 - S(e.duration - (ult ? .92 : .76), e.duration, t), alpha = rise * fade, reduced = !!e.reduced;
    const point = (x, y, z) => H.loc(e, x, y, z), direction = (x, y, z = 0) => V(Math.cos(e.angle) * x - Math.sin(e.angle) * y, Math.sin(e.angle) * x + Math.cos(e.angle) * y, z);
    if (!ult) {
      const build = S(0, .18, t), aQ = build * fade, spin = e.angle + t * (reduced ? 2.4 : 4.6);
      const radius = e.radius * (.61 + .31 * S(.04, .37, t));
      const age = t - .16, beat = age < 0 ? 0 : F(age / .45), pulse = age < 0 ? 0 : Math.exp(-beat * 6.8);
      const beatIndex = Math.max(0, Math.floor(age / .45));

      // A sparse low flow survives between cutting beats, marking the full
      // persistent field without filling the player's silhouette with a tube.
      for (let k = 0; k < 3; k++) {
        const pts = [], trailing = [], phase = spin * .59 + k * TAU / 3;
        for (let j = 0; j <= 26; j++) {
          const u = j / 26, a = phase + u * 1.73, r = e.radius * (.62 + .24 * u) * (.71 + .29 * build);
          pts.push(V(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 3));
          trailing.push(V(e.x + Math.cos(a - .08) * (r - 7), e.y + Math.sin(a - .08) * (r - 7), 4));
        }
        g.line(pts, '#dbebcb', aQ * .3, 1.25, false, true);
        g.line(trailing, '#9fbf9b', aQ * .14, .75, false, true);
      }

      for (let k = 0; k < 3; k++) {
        const phase = spin + k * TAU / 3, r = radius * (.76 + k * .105);
        const cut = .66 + pulse * .34, height = 27 + k * 24;
        windCrescent(g, e, phase, [1.60, 1.25, 1.04][k], r, height, (13 + k * 2) * cut, aQ * (.63 + pulse * .32), 7 + k * 3);
        // Fine isolated wakes are short tangential streaks, never a second
        // broad surface. Each terminates before the next blade begins.
        const wake = [];
        for (let j = 0; j <= 14; j++) {
          const u = j / 14, a = phase - .38 + u * .84, rr = r - 8 - (1 - u) * 12;
          wake.push(V(e.x + Math.cos(a) * rr, e.y + Math.sin(a) * rr, height - 4 + Math.sin(u * PI) * 4));
        }
        g.line(wake, '#deebc5', aQ * .24, .82);
      }

      if (pulse > .08) {
        // A brief outer shear and two straight jian ghosts emphasize each
        // real .45 s cutting tick instead of merely spinning decorative wind.
        const phase = e.angle + beatIndex * 2.17 + beat * 2.7;
        const shearR = e.radius * (.79 + beat * .39);
        windCrescent(g, e, phase, 1.14 + beat * .7, shearR, 34 + beat * 32, 21 * (1 - beat * .55), aQ * pulse * .79, 14);
        for (let j = 0; j < 2; j++) {
          const a = phase + j * PI + .70;
          const base = V(e.x + Math.cos(a) * 39, e.y + Math.sin(a) * 39, 39 + j * 22);
          H.sword(g, base, a, 91 + j * 11, 4.1, WIND, aQ * pulse * .66, 1.50 - j * .17);
        }
        for (let j = 0; j < 3; j++) {
          const a = phase + .30 + j * .43, tangent = V(-Math.sin(a), Math.cos(a), .11);
          const p = V(e.x + Math.cos(a) * shearR, e.y + Math.sin(a) * shearR, 28 + j * 8);
          const head = A(p, tangent, 31 + 31 * pulse), tail = A(p, tangent, -19);
          g.put([tail, A(p, V(Math.cos(a), Math.sin(a), 0), 3.5), head, A(p, V(Math.cos(a), Math.sin(a), 0), -1.5)], '#eff4d4', aQ * pulse * .58);
          g.line([p, head], '#fffce9', aQ * pulse * .72, .9);
        }
      }
      for (let j = 0; j < (reduced ? 6 : 10); j++) {
        const u = F(t * .48 + R(j + e.seed)), a = j * 2.399 + spin * .51;
        const r = radius * (.72 + .44 * u), p = V(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 11 + (1 - u) * (37 + j % 3 * 18));
        cutLeaf(g, p, a + PI / 2 + u * 1.1, 12 + R(j + 21) * 9, 1.4 + u * 4.5, aQ * Math.sin(PI * u) * .73);
      }
      return;
    }

    // One open, folded scroll frames the qin's rear. The seven strings remain
    // here; v7 actual seeking needles are drawn exclusively by combat.drawBolt.
    const rear = u => { const a = -.98 + u * PI * .73; return point(-94 - Math.cos(a) * 133, Math.sin(a) * 203, 37 + Math.sin(PI * u) * 116 * release); };
    silk(g, rear, u => direction(-.52, Math.sin(-.98 + u * PI * .73) * .48, .8), u => Math.pow(Math.sin(PI * u), .63) * 41, alpha * .74, WIND, { n: 32, vein: true });
    const lower = u => point(-208 + u * 389, -101 - Math.sin(PI * u) * 72, 16 + Math.sin(PI * u) * 46);
    silk(g, lower, u => direction(0, .55, 1), u => Math.pow(Math.sin(PI * u), .64) * 24, alpha * .66, WIND, { n: 32 });
    silk(g, u => { const a = -.6 + u * PI * 1.52, rr = 49 * (1 - u * .77); return point(-181 + Math.cos(a) * rr, 70 + Math.sin(a) * rr, 135 + Math.sin(PI * u) * 32); }, u => direction(Math.cos(-.6 + u * PI * 1.52) * .35, Math.sin(-.6 + u * PI * 1.52) * .35, .8), u => Math.sin(PI * u) * 11, alpha * .70, WIND, { n: 24 });
    for (let j = 0; j < 5; j++) bamboo(g, rear(.10 + j * .18), e.angle + j * .57, 31 + R(j + 33) * 12, alpha * .85, Math.sin(t + j));

    const pulseAge = t - .4, pulseIndex = Math.max(0, Math.min(7, Math.floor(Math.max(0, pulseAge) / .54))), pulseT = pulseAge - pulseIndex * .54;
    const pluck = pulseAge >= 0 && pulseAge <= 4.70 ? Math.exp(-Math.max(0, pulseT) * 8) : 0;
    const rail = (front, u) => { const side = (u * 2 - 1) * 86, bow = Math.sin(PI * u); return point((front ? 93 : -107) + bow * (front ? 28 : -17), side, 59 + bow * 19); };
    for (let k = 0; k < 2; k++) {
      silk(g, u => rail(k === 1, u), () => direction(.85, 0, .24), u => 7.5 + Math.sin(PI * u) * 4.8, alpha * .98, GOLD, { n: 24, glow: k === 0, vein: true });
      for (let j = 0; j < 3; j++) {
        const at = rail(k === 1, .13 + j * .36);
        goldenCurl(g, A(at, V(0, 0, 1), 4), e.angle + j * .8 + k * PI, 13 + (j === 1 ? 7 : 0), alpha * .94);
        const cap = A(at, V(0, 0, 1), 6);
        sprig(g, cap, e.angle + (k ? PI : 0), 20 + j * 3, alpha * .93, GOLD);
      }
    }

    // Exactly seven fundamental strings; all highlight layers coincide with
    // those same paths. Their travelling standing waves decay after each pluck.
    for (let string = 0; string < 7; string++) {
      const su = .12 + string / 6 * .76, start = rail(false, su), end = rail(true, su), pts = [];
      const amplitude = (2 + pluck * 9) * (reduced ? .45 : 1), frequency = 16 + string * 1.3;
      for (let j = 0; j <= 32; j++) {
        const u = j / 32, p = P(start, end, u), wave = (Math.sin(PI * u) * Math.sin(t * frequency - u * 4) + .28 * Math.sin(PI * u * 3) * Math.sin(t * (frequency + 11))) * amplitude;
        pts.push(A(p, V(0, 0, 1), 9 * Math.sin(PI * u) + wave));
      }
      g.line(pts, '#d7bc77', alpha * .28, 4.5);
      g.line(pts, '#fff5c3', alpha * (.8 + pluck * .18), 1.5, string % 2 === 0);
      if (string === pulseIndex % 7) g.line(pts, '#ffffff', alpha * pluck * .8, .8);
      dew(g, A(start, V(0, 0, 1), -5), 2.8, alpha * .55);
    }

    // Three short pluck glints stay attached to the strings. There are no
    // decorative airborne needles pointing somewhere different from a target.
    if (pluck > .03) for (let j = 0; j < 3; j++) {
      const su = .12 + j * .38, at = P(rail(false, su), rail(true, su), .61);
      const p = A(at, V(0, 0, 1), 9), size = 3 + pluck * 7;
      g.line([A(p, direction(-1, 0), size * 1.25), A(p, direction(1, 0), size * 1.25)], '#fff9d8', alpha * pluck * .87, 1.4, j === 1);
      g.line([A(p, V(0, 0, 1), -size * .46), A(p, V(0, 0, 1), size * .46)], '#fffde8', alpha * pluck * .78, .9);
    }
    for (let j = 0; j < (reduced ? 5 : 9); j++) {
      const u = F(t * .10 + R(j * 11 + e.seed)), a = j * 2.399 + t * .2;
      const p = point(-80 + Math.cos(a) * (120 + u * 110), Math.sin(a) * 175, 20 + (1 - u) * 141);
      bamboo(g, p, e.angle + a + PI / 2, 17 + R(j + 82) * 12, alpha * Math.sin(u * PI) * .74, Math.sin(t + j));
    }
  };
})();
