/* 七剑江湖 · 演武场。与战斗同一坐标系的独立山间石台；不增加移动碰撞。 */
(function (global) {
  'use strict';
  const SQ = Math.sqrt(3) / 2, TAU = Math.PI * 2;
  const project = (x, y, z = 0) => ({ x: (x - y) * SQ, y: (x + y) * .5 - z });
  const hash = (a, b = 0) => { const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return n - Math.floor(n); };
  const mix = (a, b, t) => a + (b - a) * t;
  const clamp = (a, lo, hi) => Math.max(lo, Math.min(hi, a));
  const C = { ink: '#213c3c', edge: '#a2b4a2', gold: '#b9ab77', stone: '#768b83', pine: '#355c51' };

  function polygon(c, pts, fill, stroke, width = 1) {
    if (!pts.length) return;
    c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }
  function line(c, pts, color, width = 1) {
    if (pts.length < 2) return;
    c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
    c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
  }
  const plane = (c, pts, fill, stroke, width) => polygon(c, pts.map(p => project(...p)), fill, stroke, width);
  const stroke3 = (c, pts, color, width) => line(c, pts.map(p => project(...p)), color, width);
  function ellipse(c, x, y, rx, ry, color, stroke, width = 1) {
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU);
    if (color) { c.fillStyle = color; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }
  function ring(c, x, y, radius, color, width = 1, z = .25) {
    const ps = []; for (let i = 0; i <= 80; i++) { const a = i / 80 * TAU; ps.push(project(x + Math.cos(a) * radius, y + Math.sin(a) * radius, z)); }
    line(c, ps, color, width);
  }
  function box(c, x, y, w, d, z, h, top, left, right) {
    plane(c, [[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], left);
    plane(c, [[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], right);
    plane(c, [[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], top);
  }
  function canvas(width, height) {
    try {
      const el = global.document && global.document.createElement ? global.document.createElement('canvas') : typeof document !== 'undefined' ? document.createElement('canvas') : null;
      if (!el || !el.getContext) return null;
      el.width = Math.ceil(width); el.height = Math.ceil(height);
      return el.getContext('2d') ? el : null;
    } catch (_) { return null; }
  }
  function octagon(x, y, w, h, cut, z = 0) {
    return [[x + cut, y, z], [x + w - cut, y, z], [x + w, y + cut, z], [x + w, y + h - cut, z], [x + w - cut, y + h, z], [x + cut, y + h, z], [x, y + h - cut, z], [x, y + cut, z]];
  }
  function extrude(c, pts, z, faces) {
    // The lower half of the octagon faces the camera; its top stays exactly at combat z = 0.
    for (let i = 2; i < 7; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      plane(c, [a, b, [b[0], b[1], z], [a[0], a[1], z]], faces[i % faces.length]);
    }
  }
  function swordSeal(c, x, y, rotation, length, alpha) {
    c.save(); c.globalAlpha = alpha;
    const co = Math.cos(rotation), si = Math.sin(rotation), P = (a, b) => project(x + a * co - b * si, y + a * si + b * co, .4);
    polygon(c, [P(0, -length * .54), P(3.2, -length * .36), P(2.1, length * .15), P(0, length * .24), P(-2.1, length * .15), P(-3.2, -length * .36)], '#d4c9a1');
    line(c, [P(-8, length * .18), P(0, length * .24), P(8, length * .18)], '#d4c9a1', 1.35);
    line(c, [P(0, length * .24), P(0, length * .47)], '#d4c9a1', 2.4);
    c.restore();
  }

  function drawGroundGeometry(c, width, height) {
    const top = octagon(8, 49, width - 16, height - 72, 32);
    // The grove is a lower mountain ledge, so peripheral trees have a visible footing.
    const ledge = [[-140, -96, -43], [112, -143, -43], [width * .62, -156, -43], [width + 148, -78, -43], [width + 174, height * .47, -43], [width + 121, height + 109, -43], [width * .46, height + 135, -43], [-130, height + 98, -43], [-175, height * .48, -43]];
    for (let i = 3; i < 8; i++) { const a = ledge[i], b = ledge[i + 1]; plane(c, [a, b, [b[0] + 8, b[1] + 8, -175 - hash(i, 79) * 45], [a[0] + 8, a[1] + 8, -180 - hash(i, 83) * 35]], i % 2 ? '#4c6c5d' : '#557663'); }
    plane(c, ledge, '#6e8871');
    for (let i = 0; i < 73; i++) {
      const x = -155 + hash(i, 84) * (width + 325), y = -142 + hash(i, 90) * (height + 260);
      if (x > -24 && x < width + 24 && y > 16 && y < height + 28) continue;
      const q = project(x, y, -42);
      ellipse(c, q.x, q.y, 5 + hash(i, 99) * 16, 1.5 + hash(i, 94) * 4, i % 3 ? '#9bb1862d' : '#324c3920');
      if (i % 3 === 0) stroke3(c, [[x - 3, y, -42], [x - 5, y, -34], [x, y, -40], [x + 3, y, -34]], '#afba882c', .8);
    }
    // Substantial rock foundation, stepped masonry and bevels establish height without changing footing.
    const base = octagon(-25, 17, width + 50, height - 5, 56, -42);
    const cliff = base.map((p, i) => [p[0] + (i % 2 ? 10 : -18), p[1] + (i % 3 ? 16 : -13), -137 - hash(i, 81) * 44]);
    for (let i = 2; i < 7; i++) {
      const j = (i + 1) % base.length;
      plane(c, [base[i], base[j], cliff[j], cliff[i]], ['#405d58', '#4f6961', '#38544f'][i % 3]);
      const a = base[i], b = base[j];
      for (let k = 1; k < 5; k++) { const t = k / 5; stroke3(c, [[mix(a[0], b[0], t), mix(a[1], b[1], t), -48], [mix(a[0], b[0], t) + 8, mix(a[1], b[1], t) + 4, -91 - hash(i, k) * 58]], '#738d7936', 1.2); }
    }
    const steps = [
      { x: -24, y: 17, w: width + 48, h: height - 5, cut: 55, z: -33, below: -44, fill: '#637c70' },
      { x: -12, y: 28, w: width + 24, h: height - 26, cut: 43, z: -20, below: -33, fill: '#839888' },
      { x: -1, y: 39, w: width + 2, h: height - 49, cut: 36, z: -9, below: -20, fill: '#718b7c' }
    ];
    for (const s of steps) { const pts = octagon(s.x, s.y, s.w, s.h, s.cut, s.z); extrude(c, pts, s.below, ['#425f57', '#587165', '#4f6b60']); plane(c, pts, s.fill, '#adc0a941', .8); }
    extrude(c, top, -9, ['#556f65', '#708779', '#4b685d']);
    const floor = c.createLinearGradient(project(80, 80).x, 30, project(width, height).x, height + 50);
    floor.addColorStop(0, '#81948a'); floor.addColorStop(.46, '#778d84'); floor.addColorStop(1, '#687f75');
    plane(c, top, floor, '#c1c8ac85', 1.3);
    c.save(); polygon(c, top.map(p => project(...p))); c.clip();
    // Large fitted slabs with quiet seams and occasional hairline wear, all baked once.
    const tile = 77;
    for (let row = 0; row < Math.ceil(height / tile) + 1; row++) {
      const y = row * tile, shift = row % 2 ? tile * .5 : 0;
      for (let col = -1; col < Math.ceil(width / tile) + 1; col++) {
        const x = col * tile + shift, h = hash(col + 30, row);
        if (h > .56) plane(c, [[x + 1, y + 1, .01], [x + tile - 1, y + 1, .01], [x + tile - 1, y + tile - 1, .01], [x + 1, y + tile - 1, .01]], h > .82 ? '#dbe1c407' : '#1f44370a');
        stroke3(c, [[x, y, .05], [x + tile, y, .05], [x + tile, y + tile, .05]], '#2f504328', .8);
        stroke3(c, [[x + 1, y + 1, .08], [x + tile - 1, y + 1, .08]], '#dce2c621', .7);
        if (h > .91) stroke3(c, [[x + 15, y + 19, .11], [x + 23, y + 25, .11], [x + 24, y + 35, .11], [x + 33, y + 39, .11]], '#263e301b', .65);
      }
    }
    c.restore();
    for (const inset of [10, 16, 28]) plane(c, octagon(8 + inset, 49 + inset, width - 16 - inset * 2, height - 72 - inset * 2, 28), null, inset === 16 ? '#c5ba8887' : '#3b5c504c', inset === 16 ? 1.3 : .8);
    const cx = width * .5, cy = height * .52, radius = height * .348;
    ring(c, cx, cy, radius, '#c4bd9538', 1.15); ring(c, cx, cy, radius - 5, '#344f4024', .9);
    ring(c, cx, cy, radius * .76, '#bfd0b111', .8);
    // Seven understated sword inlays, with the center left empty for silhouettes and hit effects.
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * TAU - Math.PI * .5, rr = radius - 22;
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      swordSeal(c, x, y, a + Math.PI * .5, 24, .32);
      const a0 = a - .06, a1 = a + .06;
      stroke3(c, [[cx + Math.cos(a0) * (radius + 3), cy + Math.sin(a0) * (radius + 3), .2], [cx + Math.cos(a) * (radius + 9), cy + Math.sin(a) * (radius + 9), .2], [cx + Math.cos(a1) * (radius + 3), cy + Math.sin(a1) * (radius + 3), .2]], '#c9bc8f50', 1);
    }
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, rr = 25; stroke3(c, [[cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, .1], [cx + Math.cos(a) * (rr + 10), cy + Math.sin(a) * (rr + 10), .1]], '#e1dbc032', .8); }
    ring(c, cx, cy, 3, '#e1dbc044', .85);
    // Entry steps live beyond the combat boundary.
    for (let i = 7; i >= 0; i--) box(c, width * .5 - 63 - i * 2, height - 10 + i * 9, 126 + i * 4, 13, -8 - i * 9, 8, '#8a9b87', '#4c675b', '#678070');
    for (const x of [width * .5 - 74, width * .5 + 72]) stroke3(c, [[x, height - 9, -1], [x, height + 62, -66]], '#b0b999', 2);
  }

  function pine(c, p) {
    const h = p.h || 145, s = p.s || 1;
    ellipse(c, 7, 8, 41 * s, 12 * s, '#213e3326');
    polygon(c, [{ x: -7 * s, y: 0 }, { x: 6 * s, y: 0 }, { x: 14 * s, y: -h * .62 }, { x: 29 * s, y: -h * .84 }, { x: 17 * s, y: -h * .74 }, { x: 3 * s, y: -h * .39 }], '#526658');
    line(c, [{ x: -2 * s, y: -4 }, { x: 7 * s, y: -h * .47 }, { x: 21 * s, y: -h * .77 }], '#9f9d796e', 1.5);
    for (let i = 0; i < 5; i++) {
      const sign = i % 2 ? 1 : -1, yy = -h * (.32 + i * .126), xx = (6 + i * 2 + sign * (28 - i * 2)) * s, w = (51 - i * 5) * s;
      line(c, [{ x: 7 * s, y: yy + 14 }, { x: xx, y: yy }], '#4e6554', (4 - i * .4) * s);
      const pts = [];
      for (let k = 0; k < 17; k++) { const a = k / 16 * Math.PI, rr = .82 + hash(k, i + p.seed) * .18; pts.push({ x: xx - Math.cos(a) * w * rr, y: yy - Math.sin(a) * (18 + i) * rr }); }
      pts.push({ x: xx + w * .71, y: yy + 4 }, { x: xx + 3, y: yy + 10 }, { x: xx - w * .72, y: yy + 5 });
      polygon(c, pts, ['#456f5c', '#365d4f', '#4d7760'][i % 3]);
      for (let k = 0; k < 7; k++) {
        const q = (k / 6 - .5) * w * 1.45, y = yy - Math.sqrt(Math.max(0, 1 - (q / w) ** 2)) * 10;
        line(c, [{ x: xx + q - 6, y: y + 2 }, { x: xx + q, y: y - 2 }, { x: xx + q + 7, y: y + 1 }], '#9ab28a37', .9);
      }
    }
  }
  function bamboo(c, p) {
    ellipse(c, 0, 7, 33, 10, '#243f2f20');
    for (let i = 0; i < 6; i++) {
      const x = (i - 2.5) * 11, h = 86 + hash(i, p.seed) * 54, bend = (hash(i + 20, p.seed) - .5) * 25;
      line(c, [{ x, y: 0 }, { x: x + bend * .25, y: -h * .5 }, { x: x + bend, y: -h }], i % 2 ? '#557958' : '#648664', 3.2);
      for (let j = 1; j < 6; j++) {
        const y = -j * h / 6, xx = x + bend * (j / 6) ** 2;
        line(c, [{ x: xx - 2, y }, { x: xx + 2, y }], '#bac79883', 1);
        if (j < 3) continue;
        const sign = (i + j) % 2 ? 1 : -1;
        line(c, [{ x: xx, y }, { x: xx + sign * 26, y: y - 12 }], '#4b7051', 1);
        for (let l = 0; l < 3; l++) { const xx2 = xx + sign * (7 + l * 7), yy = y - 4 - l * 3; polygon(c, [{ x: xx2, y: yy }, { x: xx2 + sign * 15, y: yy - 13 }, { x: xx2 + sign * 9, y: yy - 1 }], l % 2 ? '#5c835e' : '#476d50'); }
      }
    }
  }
  function lantern(c) {
    box(c, -13, -13, 26, 26, -4, 8, '#a9b49a', '#667d69', '#7f957d');
    box(c, -8, -8, 16, 16, 4, 25, '#95a58c', '#68816e', '#829780');
    box(c, -13, -13, 26, 26, 29, 5, '#b5bda0', '#6e806c', '#84997f');
    box(c, -10, -10, 20, 20, 34, 24, '#8d9d85', '#647b68', '#82977b');
    plane(c, [[-5, 10, 38], [5, 10, 38], [5, 10, 53], [-5, 10, 53]], '#ecd2a0');
    plane(c, [[10, -5, 38], [10, 5, 38], [10, 5, 53], [10, -5, 53]], '#cbb889');
    plane(c, [[-20, -20, 57], [20, -20, 57], [20, 20, 57], [-20, 20, 57]], '#a8b796');
    plane(c, [[-20, 20, 57], [20, 20, 57], [0, 0, 71]], '#607c6a');
    plane(c, [[20, -20, 57], [20, 20, 57], [0, 0, 71]], '#82997c');
    stroke3(c, [[-20, 20, 57], [20, 20, 57], [20, -20, 57]], '#b3c09c', 1.5);
    ellipse(c, 0, -73, 3, 3, '#bbbc95');
  }
  function rack(c) {
    ellipse(c, 6, 5, 50, 13, '#223f382c');
    for (const x of [-40, 40]) { box(c, x - 5, -6, 10, 13, 0, 69, '#899170', '#526551', '#66775c'); box(c, x - 13, -13, 27, 27, -2, 6, '#86957c', '#516b5a', '#6c836d'); }
    for (const h of [33, 59]) stroke3(c, [[-46, 0, h], [46, 0, h]], '#6f7655', 5);
    for (let i = 0; i < 5; i++) {
      const x = -29 + i * 15, z = 15 + (i % 2) * 2;
      stroke3(c, [[x, -2, z], [x, -2, 68]], '#b6c9bb', 3.2);
      stroke3(c, [[x + .8, -2, z], [x + .8, -2, 64]], '#e1dec148', .8);
      stroke3(c, [[x - 6, -2, 63], [x + 6, -2, 63]], '#c8b279', 2.5);
      stroke3(c, [[x, -2, 65], [x, -2, 76]], '#655448', 3);
      stroke3(c, [[x - 2, -2, 75], [x + 2, -2, 75]], '#bfa975', 2.5);
    }
  }
  function rail(c, p) {
    const w = p.w || 120, angle = p.angle || 0, co = Math.cos(angle), si = Math.sin(angle);
    const P = (x, y, z) => project(x * co - y * si, x * si + y * co, z);
    polygon(c, [P(-w / 2, -5, 0), P(w / 2, -5, 0), P(w / 2, 5, 0), P(-w / 2, 5, 0)], '#506d5c');
    for (const x of [-w / 2, 0, w / 2]) {
      polygon(c, [P(x - 4, -4, 0), P(x + 4, -4, 0), P(x + 4, -4, 25), P(x - 4, -4, 25)], '#8c9e82');
      polygon(c, [P(x - 4, -4, 25), P(x + 4, -4, 25), P(x + 4, 4, 25), P(x - 4, 4, 25)], '#b5bea0');
      polygon(c, [P(x + 4, -4, 0), P(x + 4, 4, 0), P(x + 4, 4, 25), P(x + 4, -4, 25)], '#6b836d');
    }
    line(c, [P(-w / 2, 0, 20), P(w / 2, 0, 20)], '#a5b293', 4.5);
    line(c, [P(-w / 2, 0, 8), P(w / 2, 0, 8)], '#829779', 3);
  }
  function banner(c, p, time) {
    const phase = time * .0016 + p.seed, h = p.h || 148;
    box(c, -9, -9, 18, 18, -3, 5, '#a6ad87', '#556e56', '#768465');
    stroke3(c, [[0, 0, 1], [0, 0, h]], '#576b58', 4.7);
    stroke3(c, [[-1, 0, 1], [-1, 0, h]], '#bbc09a87', 1);
    const q = project(0, 0, h - 14), x = q.x + 6;
    const sway = (yy, strength = 1) => Math.sin(phase - yy * .026) * 4 * strength;
    const pts = [{ x, y: q.y }];
    for (let i = 0; i <= 8; i++) { const yy = i * 10; pts.push({ x: x + 39 + sway(yy), y: q.y + yy }); }
    pts.push({ x: x + 21 + sway(86), y: q.y + 94 }, { x: x + 1 + sway(86), y: q.y + 83 });
    for (let i = 7; i >= 0; i--) { const yy = i * 10; pts.push({ x: x + sway(yy, .28), y: q.y + yy }); }
    polygon(c, pts, '#3c675a', '#b6ac795d', 1.1);
    line(c, [{ x: x + 4, y: q.y + 4 }, { x: x + 34, y: q.y + 4 }], '#ccbb876e', 1);
    line(c, [{ x: x + 20 + sway(42, .5), y: q.y + 18 }, { x: x + 20 + sway(56, .5), y: q.y + 60 }], '#d9cca2b8', 2.4);
    line(c, [{ x: x + 10 + sway(58, .5), y: q.y + 53 }, { x: x + 20 + sway(56, .5), y: q.y + 56 }, { x: x + 31 + sway(58, .5), y: q.y + 53 }], '#d9cca2b8', 1.5);
    line(c, [{ x: x + 20 + sway(60, .5), y: q.y + 59 }, { x: x + 20 + sway(70, .5), y: q.y + 70 }], '#c0ac79', 3);
    line(c, [{ x: -5, y: q.y - 3 }, { x: 50, y: q.y - 3 }], '#afa77a', 3);
    ellipse(c, 0, -h - 2, 3.3, 4.5, '#c8b789');
  }
  function renderProp(c, p, time) {
    if (p.type === 'pine') pine(c, p);
    if (p.type === 'bamboo') bamboo(c, p);
    if (p.type === 'lantern') lantern(c);
    if (p.type === 'rack') rack(c);
    if (p.type === 'rail') rail(c, p);
    if (p.type === 'banner') banner(c, p, time);
  }
  function background(c, camera) {
    const W = camera.width || 1000, H = camera.height || 700;
    const grad = c.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#a8c0b7'); grad.addColorStop(.45, '#91ada2'); grad.addColorStop(1, '#657e74');
    c.fillStyle = grad; c.fillRect(0, 0, W, H);
    const cloud = c.createRadialGradient(W * .68, H * .22, 0, W * .68, H * .22, W * .75);
    cloud.addColorStop(0, '#eff0d42c'); cloud.addColorStop(1, '#dce5ce00'); c.fillStyle = cloud; c.fillRect(0, 0, W, H);
    for (let layer = 0; layer < 3; layer++) {
      const pts = [{ x: -90, y: H }], count = 36, shift = ((camera.x || 480) - (camera.y || 320)) * (.035 + layer * .025), base = H * (.44 + layer * .105);
      for (let i = -2; i < count + 3; i++) {
        const x = i / count * (W + 160) - 80 - shift;
        const mountain = Math.pow(hash(Math.floor(i / 2), layer + 27), 1.2), sharp = i % 2 === 0 ? 1 : .88;
        const y = base - (35 + mountain * H * (.19 + layer * .013)) * sharp;
        pts.push({ x, y });
      }
      pts.push({ x: W + 100, y: H });
      polygon(c, pts, ['#829f9352', '#6f8e8164', '#567b6878'][layer]);
    }
    const fog = c.createLinearGradient(0, H * .23, 0, H * .9);
    fog.addColorStop(0, '#b8cdba00'); fog.addColorStop(.34, '#b8cdba22'); fog.addColorStop(1, '#a1bbaa00');
    c.fillStyle = fog; c.fillRect(0, 0, W, H);
  }

  function create(options = {}) {
    const width = Number(options.width) || 960, height = Number(options.height) || 600;
    const props = [], caches = new Map(); let disposed = false, ground = null, backdrop = null, cacheAttempted = false;
    const add = (type, x, y, more = {}) => props.push({ type, x, y, seed: props.length * 23 + 5, id: 'dojo-' + props.length, ...more });
    for (const [x, y, h, s] of [[-74, 48, 151, 1], [-92, height * .68, 163, 1.12], [width + 80, height * .2, 153, 1], [width * .33, -86, 130, .92], [width + 81, height + 65, 164, 1.13]]) add('pine', x, y, { h, s, z: -43 });
    for (const [x, y] of [[-79, 232], [width + 62, 325], [width * .71, -71], [179, height + 79]]) add('bamboo', x, y, { z: -43 });
    for (const [x, y] of [[53, 40], [width - 53, 40], [26, height - 46], [width - 26, height - 46]]) add('lantern', x, y, { z: y === 40 ? -9 : 0 });
    for (const [x, y] of [[122, 19], [width - 166, 19]]) add('rack', x, y, { z: -33 });
    for (const x of [width * .29, width * .73]) add('banner', x, 18, { h: 143, z: -33 });
    for (const x of [148, 318, width - 318, width - 148]) add('rail', x, height - 10, { w: 115 });
    for (const y of [height * .26, height * .62]) { add('rail', -7, y, { w: 126, angle: Math.PI / 2 }); add('rail', width + 7, y, { w: 126, angle: Math.PI / 2 }); }
    const groundBounds = { x: -height * SQ - 340, y: -136, width: (width + height) * SQ + 700, height: (width + height) * .5 + 535 };
    function drawBackdrop(c, camera) {
      const W = Math.ceil(camera.width || 1000), H = Math.ceil(camera.height || 700);
      if (!backdrop || backdrop.width !== W + 128 || backdrop.height !== H + 128) {
        if (backdrop) { backdrop.width = 1; backdrop.height = 1; }
        backdrop = canvas(W + 128, H + 128);
        if (backdrop) background(backdrop.getContext('2d'), { width: W + 128, height: H + 128, x: 480, y: 320 });
      }
      if (backdrop) c.drawImage(backdrop, -64 - clamp(((camera.x || 480) - (camera.y || 320) - 160) * .07, -48, 48), -64);
      else background(c, camera);
    }
    function groundCache() {
      if (cacheAttempted) return ground;
      cacheAttempted = true;
      const el = canvas(groundBounds.width, groundBounds.height);
      if (el) { const c = el.getContext('2d'); c.translate(-groundBounds.x, -groundBounds.y); drawGroundGeometry(c, width, height); ground = el; }
      return ground;
    }
    function propCache(p) {
      if (p.type === 'banner') return null;
      if (caches.has(p.id)) return caches.get(p.id);
      const h = p.type === 'pine' ? p.h + 37 : p.type === 'bamboo' ? 177 : p.type === 'rail' ? 113 : 120;
      const w = p.type === 'pine' ? 216 : p.type === 'bamboo' ? 164 : p.type === 'rail' ? 170 : 157;
      const el = canvas(w, h + 37);
      if (!el) { caches.set(p.id, null); return null; }
      const c = el.getContext('2d'); c.translate(w / 2, h); renderProp(c, p, 0);
      const entry = { canvas: el, x: -w / 2, y: -h }; caches.set(p.id, entry); return entry;
    }
    const scene = {
      version: 6, name: '七剑演武场', width, height, combat: true, biome: 'training', props,
      heightAt: () => 0,
      canMove: (x, y, r = 18) => Number.isFinite(x) && Number.isFinite(y) && x >= Math.max(43, r + 20) && y >= Math.max(86, r + 20) && x <= width - Math.max(43, r + 20) && y <= height - Math.max(48, r + 20),
      drawGround(c, camera) {
        if (disposed) return;
        c.save(); drawBackdrop(c, camera);
        const k = camera.zoom || 1, center = project(camera.x || 0, camera.y || 0, camera.z || 0), el = groundCache();
        c.translate((camera.width || 1000) / 2 - center.x * k, (camera.height || 700) / 2 - center.y * k); c.scale(k, k);
        if (el) c.drawImage(el, groundBounds.x, groundBounds.y); else drawGroundGeometry(c, width, height);
        c.restore();
      },
      getDrawables(camera, time = 0, player) {
        if (disposed) return [];
        const k = camera.zoom || 1, W = camera.width || 1000, H = camera.height || 700, center = project(camera.x || 0, camera.y || 0, camera.z || 0);
        const playerP = player ? project(player.x, player.y, player.z || 0) : null;
        const out = [];
        for (const p of props) {
          const q = project(p.x, p.y, p.z || 0), sx = W / 2 + (q.x - center.x) * k, sy = H / 2 + (q.y - center.y) * k, boundH = p.h || (p.type === 'bamboo' ? 160 : 100);
          if (sx < -135 * k || sx > W + 135 * k || sy < -55 * k || sy - boundH * k > H + 35) continue;
          const behind = player && p.x + p.y > player.x + player.y && playerP && Math.abs(playerP.x - q.x) < (p.type === 'pine' ? 88 : 55) && playerP.y < q.y + 8 && playerP.y > q.y - boundH - 45;
          out.push({ id: p.id, depth: p.x + p.y, prop: p, draw(c) {
            c.save(); c.translate(sx, sy); c.scale(k, k); if (behind) c.globalAlpha *= .38;
            const entry = propCache(p); if (entry) c.drawImage(entry.canvas, entry.x, entry.y); else renderProp(c, p, time);
            c.restore();
          } });
        }
        return out;
      },
      dispose() {
        disposed = true; if (ground) { ground.width = 1; ground.height = 1; } ground = null;
        if (backdrop) { backdrop.width = 1; backdrop.height = 1; } backdrop = null;
        for (const entry of caches.values()) if (entry) { entry.canvas.width = 1; entry.canvas.height = 1; }
        caches.clear();
      },
      getStats() { return { props: props.length, cachedProps: caches.size, groundCached: !!ground, disposed }; }
    };
    return scene;
  }
  global.SevenTrainingScene = { version: 6, create };
})(window);
