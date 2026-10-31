/* 七剑江湖 · 山河漫游：共享 2.5D 山水、建筑、地形与空间碰撞。 */
(function (global) {
  'use strict';
  const SQ = Math.sqrt(3) / 2;
  const TAU = Math.PI * 2;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const mix = (a, b, t) => a + (b - a) * t;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const hash = (x, y = 0) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
  function rng(seed) { let s = (Number(seed) || 71337) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function project(x, y, z = 0) { return { x: (x - y) * SQ, y: (x + y) * .5 - z }; }
  function unproject(x, y, z = 0) { const yy = y + z; return { x: yy + x / (2 * SQ), y: yy - x / (2 * SQ) }; }
  function screen(x, y, z, camera) {
    const q = project(x, y, z || 0), c = project(camera.x || 0, camera.y || 0, camera.z || 0);
    return { x: (camera.width || 1000) / 2 + (q.x - c.x) * (camera.zoom || 1), y: (camera.height || 700) / 2 + (q.y - c.y) * (camera.zoom || 1) };
  }
  function worldAt(sx, sy, camera, z = 0) {
    const c = project(camera.x || 0, camera.y || 0, camera.z || 0), k = camera.zoom || 1;
    return unproject((sx - camera.width / 2) / k + c.x, (sy - camera.height / 2) / k + c.y, z);
  }
  function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function tone(hex, amount) { const a = rgb(hex); return `rgb(${a.map(n => clamp(Math.round(n + amount), 0, 255)).join(',')})`; }
  function blend(a, b, t) { const aa = rgb(a), bb = rgb(b); return '#' + aa.map((n, i) => Math.round(mix(n, bb[i], t)).toString(16).padStart(2, '0')).join(''); }
  function polygon(ctx, points, fill, stroke, lw = 1) {
    if (!points.length) return;
    ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }
  function line(ctx, points, color, width = 1) {
    if (points.length < 2) return; ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
  }
  function ellipse(ctx, x, y, rx, ry, fill, stroke, width = 1) {
    ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
  }
  function distanceSegment(x, y, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
    const t = l2 ? clamp(((x - a.x) * dx + (y - a.y) * dy) / l2, 0, 1) : 0;
    return Math.hypot(x - a.x - dx * t, y - a.y - dy * t);
  }
  function distancePath(x, y, path) { let d = Infinity; for (let i = 1; i < path.length; i++) d = Math.min(d, distanceSegment(x, y, path[i - 1], path[i])); return d; }
  function intersection(a, b, c, d) {
    const abx = b.x - a.x, aby = b.y - a.y, cdx = d.x - c.x, cdy = d.y - c.y, den = abx * cdy - aby * cdx;
    if (Math.abs(den) < .001) return null;
    const acx = c.x - a.x, acy = c.y - a.y, t = (acx * cdy - acy * cdx) / den, u = (acx * aby - acy * abx) / den;
    if (t < 0 || t > 1 || u < 0 || u > 1) return null;
    return { x: a.x + t * abx, y: a.y + t * aby, angle: Math.atan2(aby, abx) };
  }
  const PALETTES = {
    forest: { ground: '#658a6d', light: '#9bb38a', path: '#b6b49a', stone: '#829c90', leaf: '#346c53', dark: '#244a3e', roof: '#385e61', wall: '#d0c8a6', accent: '#c07848', water: '#467d80' },
    palace: { ground: '#82a38f', light: '#b0c4ad', path: '#d6d5ba', stone: '#9aafa6', leaf: '#71997c', dark: '#507769', roof: '#638f99', wall: '#ecdfc0', accent: '#b66e69', water: '#77a5a8' },
    inn: { ground: '#8d956b', light: '#b4b68b', path: '#c7b591', stone: '#869d8a', leaf: '#618864', dark: '#466449', roof: '#526868', wall: '#dcbb82', accent: '#9e5147', water: '#507f77' },
    temple: { ground: '#7e9680', light: '#a7b2a0', path: '#c7c4af', stone: '#9ba69a', leaf: '#668970', dark: '#4e6b60', roof: '#526e76', wall: '#d8cbaa', accent: '#b07959', water: '#699797' },
    village: { ground: '#91a175', light: '#bbbf8c', path: '#c1b18a', stone: '#919a83', leaf: '#69845a', dark: '#4e6649', roof: '#727762', wall: '#d9bd8c', accent: '#a66b40', water: '#588879' },
    waterfall: { ground: '#6a9390', light: '#9fb8a6', path: '#b5c5b6', stone: '#789593', leaf: '#4e8677', dark: '#355f5c', roof: '#496d77', wall: '#cad1b8', accent: '#a1cfcc', water: '#669fa2' },
    bamboo: { ground: '#779479', light: '#a8b79a', path: '#bcc2a3', stone: '#8daba2', leaf: '#558965', dark: '#326b56', roof: '#5a7d6d', wall: '#dbcea8', accent: '#c29d62', water: '#669591' },
    garden: { ground: '#9ba47b', light: '#c1c697', path: '#c6c6a6', stone: '#a0af97', leaf: '#6f8d5f', dark: '#4a7556', roof: '#718674', wall: '#ded9ae', accent: '#bd9cab', water: '#88a7a0' },
    summit: { ground: '#8c9e96', light: '#bbc6b6', path: '#d4d0b8', stone: '#9caeaa', leaf: '#638c84', dark: '#4c6c6c', roof: '#687e87', wall: '#d9ddcd', accent: '#b0bbd4', water: '#7f9ea7' }
  };
  const ALIASES = { mountain: 'summit', tianzi: 'summit', baicao: 'garden', yuchan: 'palace', liuqige: 'temple', gallery: 'bamboo', leizhuang: 'village' };
  const biomeName = name => PALETTES[name] ? name : ALIASES[name] || 'forest';
  const palette = name => PALETTES[biomeName(name)];

  function quad(ctx, S, a, b, c, d, fill, stroke, width) { polygon(ctx, [S(...a), S(...b), S(...c), S(...d)], fill, stroke, width); }
  function box(ctx, S, x, y, w, d, z, h, colors, stroke) {
    const [top, left, right] = Array.isArray(colors) ? colors : [colors, colors, colors];
    quad(ctx, S, [x - w / 2, y + d / 2, z], [x + w / 2, y + d / 2, z], [x + w / 2, y + d / 2, z + h], [x - w / 2, y + d / 2, z + h], left, stroke);
    quad(ctx, S, [x + w / 2, y - d / 2, z], [x + w / 2, y + d / 2, z], [x + w / 2, y + d / 2, z + h], [x + w / 2, y - d / 2, z + h], right, stroke);
    quad(ctx, S, [x - w / 2, y - d / 2, z + h], [x + w / 2, y - d / 2, z + h], [x + w / 2, y + d / 2, z + h], [x - w / 2, y + d / 2, z + h], top, stroke);
  }
  function ringWorld(ctx, S, x, y, z, rx, ry, fill, stroke, width) {
    const ps = []; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; ps.push(S(x + Math.cos(a) * rx, y + Math.sin(a) * ry, z)); } polygon(ctx, ps, fill, stroke, width);
  }
  function shadow(ctx, p, camera, S, w, d, alpha = .17) {
    ringWorld(ctx, S, p.x + 8, p.y + 12, p.z || 0, w, d, `rgba(25,52,45,${alpha})`);
  }
  function roof(ctx, S, x, y, z, w, d, h, pal, k, tier = 0) {
    const e = 18, ridge = [[x - w * .38, y, z + h], [x + w * .38, y, z + h]];
    const nw = [x - w / 2 - e, y - d / 2 - e, z + 10], ne = [x + w / 2 + e, y - d / 2 - e, z + 10];
    const se = [x + w / 2 + e, y + d / 2 + e, z + 10], sw = [x - w / 2 - e, y + d / 2 + e, z + 10];
    polygon(ctx, [S(...nw), S(...ne), S(...ridge[1]), S(...ridge[0])], tone(pal.roof, 12), tone(pal.roof, -14), .8 * k);
    polygon(ctx, [S(...ne), S(...se), S(...ridge[1])], tone(pal.roof, -20), tone(pal.roof, -28), .8 * k);
    polygon(ctx, [S(...sw), S(...se), S(...ridge[1]), S(...ridge[0])], pal.roof, tone(pal.roof, -22), .8 * k);
    for (let t = .12; t < 1; t += .12) {
      line(ctx, [S(mix(sw[0], ridge[0][0], t), mix(sw[1], ridge[0][1], t), mix(sw[2], ridge[0][2], t)), S(mix(se[0], ridge[1][0], t), mix(se[1], ridge[1][1], t), mix(se[2], ridge[1][2], t))], 'rgba(211,226,210,.23)', .8 * k);
    }
    for (let a = -w * .47; a < w * .48; a += 16) {
      const p1 = S(x + a, y + d / 2 + e, z + 10), p2 = S(x + a * .79, y, z + h);
      line(ctx, [p1, p2], 'rgba(20,43,48,.22)', .7 * k);
    }
    line(ctx, [S(...sw), S(...se)], tone(pal.roof, 36), 4 * k);
    line(ctx, [S(...ne), S(...se)], tone(pal.roof, -3), 4 * k);
    line(ctx, [S(...ridge[0]), S(...ridge[1])], tone(pal.roof, 50), 4.3 * k);
    for (const c of [nw, ne, se, sw]) {
      const out = [x + (c[0] - x) * 1.1, y + (c[1] - y) * 1.1, z + 22];
      line(ctx, [S(x + (c[0] - x) * .82, y + (c[1] - y) * .82, z + 10), S(...c), S(...out)], tone(pal.roof, 38), 4 * k);
    }
    if (!tier) {
      const a = S(x, y, z + h + 10); ellipse(ctx, a.x, a.y, 4 * k, 7 * k, '#c1b992');
    }
  }
  function building(ctx, p, camera, S) {
    const k = camera.zoom || 1, pal = palette(p.biome), w = p.w || 180, d = p.d || 135, h = p.h || 110, z = p.z || 0;
    shadow(ctx, p, camera, S, w * .73, d * .72, .20);
    box(ctx, S, p.x, p.y, w + 28, d + 28, z, 13, [tone(pal.stone, 28), tone(pal.stone, -9), tone(pal.stone, -24)]);
    const floors = p.floors || 1;
    for (let f = 0; f < floors; f++) {
      const zz = z + 13 + f * (h * .66), hh = h * (floors > 1 ? .62 : 1), ww = w * (1 - f * .035), dd = d * (1 - f * .035);
      if (p.open) {
        for (const dx of [-ww / 2 + 10, ww / 2 - 10]) for (const dy of [-dd / 2 + 10, dd / 2 - 10]) box(ctx, S, p.x + dx, p.y + dy, 9, 9, zz, hh, [tone(pal.accent, 18), pal.accent, tone(pal.accent, -20)]);
      } else {
        box(ctx, S, p.x, p.y, ww, dd, zz, hh, [pal.wall, tone(pal.wall, -4), tone(pal.wall, -25)]);
        const yf = p.y + dd / 2 + .4;
        for (let dx = -ww / 2 + 13; dx <= ww / 2 - 10; dx += Math.max(30, ww / 5)) {
          quad(ctx, S, [p.x + dx - 10, yf, zz + hh * .35], [p.x + dx + 10, yf, zz + hh * .35], [p.x + dx + 10, yf, zz + hh * .76], [p.x + dx - 10, yf, zz + hh * .76], '#7b8268', '#bcb68d', 2 * k);
          line(ctx, [S(p.x + dx, yf, zz + hh * .35), S(p.x + dx, yf, zz + hh * .76)], pal.accent, 2 * k);
          line(ctx, [S(p.x + dx - 10, yf, zz + hh * .57), S(p.x + dx + 10, yf, zz + hh * .57)], pal.accent, 2 * k);
        }
        if (!f) {
          quad(ctx, S, [p.x - 20, yf + 1, zz], [p.x + 20, yf + 1, zz], [p.x + 20, yf + 1, zz + hh * .67], [p.x - 20, yf + 1, zz + hh * .67], '#4b5548', pal.accent, 3 * k);
          line(ctx, [S(p.x, yf + 2, zz), S(p.x, yf + 2, zz + hh * .67)], '#b19a6d', 1.7 * k);
        }
        const xp = p.x + ww / 2 + .5;
        for (let dy = -dd / 2 + 28; dy < dd / 2 - 16; dy += 40) {
          quad(ctx, S, [xp, p.y + dy - 10, zz + hh * .4], [xp, p.y + dy + 10, zz + hh * .4], [xp, p.y + dy + 10, zz + hh * .77], [xp, p.y + dy - 10, zz + hh * .77], '#71735f', pal.accent, 2 * k);
          line(ctx, [S(xp, p.y + dy, zz + hh * .4), S(xp, p.y + dy, zz + hh * .77)], pal.accent, 1.5 * k);
        }
        for (const dx of [-ww / 2 + 5, ww / 2 - 5]) box(ctx, S, p.x + dx, p.y + dd / 2, 8, 8, zz, hh, [pal.accent, pal.accent, tone(pal.accent, -20)]);
        for (const hh2 of [8, hh - 8]) line(ctx, [S(p.x - ww / 2, yf + 1, zz + hh2), S(p.x + ww / 2, yf + 1, zz + hh2)], pal.accent, 4 * k);
      }
      roof(ctx, S, p.x, p.y, zz + hh, ww, dd, p.roofH || 42, pal, k, f);
    }
    if (p.sign) {
      const zz = z + h * .77, pp = S(p.x, p.y + d / 2 + 5, zz);
      ctx.save(); ctx.translate(pp.x, pp.y); ctx.transform(1, .577, 0, 1, 0, 0);
      ctx.fillStyle = '#415849'; ctx.fillRect(-37 * k, -15 * k, 74 * k, 24 * k); ctx.strokeStyle = '#c8b788'; ctx.lineWidth = k; ctx.strokeRect(-35 * k, -13 * k, 70 * k, 20 * k);
      ctx.fillStyle = '#eddfae'; ctx.font = `${Math.max(9, 13 * k)}px "Noto Serif SC",serif`; ctx.textAlign = 'center'; ctx.fillText(p.sign, 0, 3 * k); ctx.restore();
    }
    if (p.lanterns) for (const dx of [-w * .38, w * .38]) drawLantern(ctx, S(p.x + dx, p.y + d * .57, z + h * .66), k, 1);
  }
  function drawLantern(ctx, q, k, size) {
    k *= size || 1; line(ctx, [{x:q.x,y:q.y-10*k},{x:q.x,y:q.y+3*k}], '#514e3a', 1.3*k);
    const g = ctx.createRadialGradient(q.x, q.y + 12*k, 2*k, q.x, q.y + 12*k, 28*k); g.addColorStop(0,'rgba(241,176,90,.22)'); g.addColorStop(1,'rgba(241,176,90,0)'); ellipse(ctx,q.x,q.y+12*k,28*k,24*k,g);
    ellipse(ctx,q.x,q.y+12*k,8*k,12*k,'#c66c48','#764b37',k); line(ctx,[{x:q.x,y:q.y+1*k},{x:q.x,y:q.y+23*k}],'#ebad66',2*k);
    ctx.fillStyle='#d6b175';ctx.fillRect(q.x-5*k,q.y,10*k,2*k);ctx.fillRect(q.x-5*k,q.y+23*k,10*k,2*k);line(ctx,[{x:q.x,y:q.y+25*k},{x:q.x,y:q.y+33*k}],'#a7754b',k);
  }
  function tree(ctx, p, camera, S, time) {
    const k = camera.zoom || 1, pal = palette(p.biome), scale = p.s || 1, h = (p.h || 133) * scale, w = (p.w || 67) * scale;
    const b = S(p.x, p.y, p.z || 0), sway = Math.sin(time * .0011 + p.seed) * 1.5 * k;
    shadow(ctx, p, camera, S, w * .69, w * .52, .21);
    line(ctx, [b, {x:b.x+3*k,y:b.y-h*.46*k},{x:b.x-3*k+sway,y:b.y-h*.88*k}], '#53614a', 8 * scale * k);
    line(ctx,[{x:b.x+2*k,y:b.y-h*.35*k},{x:b.x-w*.37*k,y:b.y-h*.61*k}], '#53614a', 4 * scale*k);
    if (p.type === 'pine') {
      for (let i = 0; i < 3; i++) {
        const yy = b.y - h * k * (.32 + i * .22), ww = w * k * (1.05 - i * .21);
        polygon(ctx,[{x:b.x+sway,y:yy-h*.43*k},{x:b.x-ww*.84,y:yy-7*k},{x:b.x-ww*.35,y:yy+5*k},{x:b.x+ww*.1,y:yy+10*k},{x:b.x+ww*.82,y:yy-2*k}], i===2?tone(pal.leaf,14):pal.leaf, tone(pal.dark,-2),.7*k);
        polygon(ctx,[{x:b.x+sway,y:yy-h*.43*k},{x:b.x-ww*.84,y:yy-7*k},{x:b.x-ww*.21,y:yy-14*k}],tone(pal.leaf,15));
        line(ctx,[{x:b.x-ww*.62,y:yy-6*k},{x:b.x-ww*.2,y:yy-15*k},{x:b.x+ww*.39,y:yy-6*k}], 'rgba(158,182,125,.3)',1.2*k);
      }
    } else {
      const leaf = p.type === 'blossom' ? '#cfa7ae' : p.type === 'goldtree' ? '#b4aa69' : pal.leaf;
      const lobes = [[-.44,.69,.45],[.34,.72,.47],[-.19,.93,.4],[.17,.98,.36],[.57,.64,.29],[-.59,.64,.27],[0,.75,.50]];
      for (let i=0;i<lobes.length;i++) {
        const [dx,dy,r] = lobes[i], qx=b.x+dx*w*k+sway,qy=b.y-dy*h*k;
        const pts=[];for(let j=0;j<9;j++){const a=j/9*TAU;const rr=r*(.88+hash(i*7+j,p.seed)*.23);pts.push({x:qx+Math.cos(a)*rr*w*k,y:qy+Math.sin(a)*rr*w*.66*k});}
        polygon(ctx,pts,tone(leaf,(i%3-1)*8),null);
        if (i===2||i===6) ellipse(ctx,qx-7*k,qy-8*k,r*w*.46*k,r*w*.15*k,tone(leaf,17));
      }
      for(let i=0;i<8;i++){const dx=(hash(i,p.seed)-.5)*w*1.15,dy=.62+hash(i+12,p.seed)*.4;const qq={x:b.x+dx*k,y:b.y-h*dy*k};ellipse(ctx,qq.x,qq.y,3.2*k*scale,1.6*k*scale,tone(leaf,27));}
    }
    for(let i=0;i<3;i++) line(ctx,[{x:b.x+(i-1)*4*k,y:b.y},{x:b.x+(i-1)*12*k,y:b.y+3*k}], '#566c4f',2*k);
  }
  function bamboo(ctx,p,camera,S,time){
    const k=camera.zoom||1,pal=palette(p.biome),n=p.count||5;
    shadow(ctx,p,camera,S,35,24,.1);
    for(let i=0;i<n;i++){
      const dx=(hash(i,p.seed)-.5)*54,dy=(hash(i+10,p.seed)-.5)*30,h=112+hash(i+20,p.seed)*77,b=S(p.x+dx,p.y+dy,p.z||0),tilt=(hash(i+30,p.seed)-.5)*18+Math.sin(time*.001+p.seed+i)*2;
      line(ctx,[b,{x:b.x+tilt*k,y:b.y-h*k}],i%2?'#658965':'#426f5e',3.6*k);
      line(ctx,[{x:b.x-1*k,y:b.y},{x:b.x+tilt*k-1*k,y:b.y-h*k}],'#a2b88b',.8*k);
      for(let j=1;j<6;j++){const yy=b.y-h*j/6*k,xx=b.x+tilt*j/6*k;line(ctx,[{x:xx-2.5*k,y:yy},{x:xx+2.5*k,y:yy}],'#aac49b',1*k);}
      for(let j=0;j<4;j++){
        const yy=b.y-h*(.45+j*.13)*k,xx=b.x+tilt*(.45+j*.13)*k,dir=(j+i)%2?1:-1;
        line(ctx,[{x:xx,y:yy},{x:xx+dir*25*k,y:yy-12*k}],'#527c58',1.1*k);
        for(let a=0;a<4;a++){const px=xx+dir*(6+a*6)*k,py=yy-(3+a*3)*k;polygon(ctx,[{x:px,y:py},{x:px+dir*(10+a)*k,y:py-(10-a)*k},{x:px+dir*7*k,y:py+2*k}],tone(pal.leaf,j*5-6));}
      }
    }
  }
  function rock(ctx,p,camera,S){
    const k=camera.zoom||1,pal=palette(p.biome),w=p.w||60,d=p.d||w*.7,h=p.h||w*.65,z=p.z||0;
    shadow(ctx,p,camera,S,w*.62,d*.72,.15);
    const a=[p.x-w*.49,p.y-d*.46,z+h*.3],b=[p.x+w*.23,p.y-d*.55,z+h*.65],c=[p.x+w*.52,p.y+d*.13,z+h*.4],d1=[p.x+w*.21,p.y+d*.54,z+h*.18],e=[p.x-w*.45,p.y+d*.34,z+h*.23],t=[p.x-w*.12,p.y-d*.07,z+h];
    polygon(ctx,[S(...a),S(...b),S(...t),S(...e)],tone(pal.stone,10));polygon(ctx,[S(...b),S(...c),S(...d1),S(...t)],tone(pal.stone,-13));polygon(ctx,[S(...e),S(...t),S(...d1),S(p.x+w*.13,p.y+d*.47,z),S(p.x-w*.4,p.y+d*.29,z)],pal.stone);
    line(ctx,[S(...a),S(...t),S(...b)],tone(pal.stone,30),1*k);line(ctx,[S(p.x-w*.13,p.y+d*.1,z+h*.6),S(p.x+w*.1,p.y+d*.22,z+h*.28)],tone(pal.stone,-24),1*k);
    if(p.moss!==false)polygon(ctx,[S(p.x-w*.27,p.y-d*.14,z+h*.83),S(...t),S(p.x+w*.08,p.y+d*.1,z+h*.7),S(p.x-w*.2,p.y+d*.14,z+h*.63)],'#719479');
  }
  function pillar(ctx,p,camera,S,time){
    const k=camera.zoom||1,pal=palette(p.biome),w=p.w||160,d=p.d||w*.7,h=p.h||330,z=p.z||0;
    shadow(ctx,p,camera,S,w*.77,d*.75,.14);
    const left=[[-.62,.04,0],[-.55,-.2,.31],[-.46,-.18,.59],[-.36,-.26,.88],[-.21,-.28,1]],right=[[.48,.1,0],[.53,.12,.23],[.39,.08,.57],[.35,.02,.83],[.28,-.1,.98]],front=[[.1,.48,0],[.13,.44,.24],[.08,.35,.54],[.12,.25,.84],[.08,.14,1.04]];
    const W=a=>a.map(q=>S(p.x+q[0]*w,p.y+q[1]*d,z+q[2]*h));
    polygon(ctx,[...W(left),...W(front).reverse()],tone(pal.stone,0));polygon(ctx,[...W(front),...W(right).reverse()],tone(pal.stone,-35));
    polygon(ctx,[W(left)[4],W(right)[4],W(front)[4]],tone(pal.stone,20));
    for(let i=0;i<11;i++){
      const zz=.08+i*.079,wx=(-.38+hash(i,p.seed)*.35)*w;
      line(ctx,[S(p.x+wx,p.y+d*.25,z+zz*h),S(p.x+wx+Math.sin(i)*9,p.y+d*.24,z+(zz+.069)*h)],'rgba(48,79,77,.27)',(2+hash(i+20,p.seed)*3)*k);
      if(i%2===0)line(ctx,[S(p.x-w*.36,p.y+d*.1,z+zz*h),S(p.x+w*.2,p.y+d*.22,z+(zz+.008)*h)],'rgba(195,208,182,.2)',1.5*k);
    }
    for(let i=0;i<4;i++){
      const zz=(.28+i*.2)*h,wx=(-.28+hash(i+3,p.seed)*.25)*w;
      const q=S(p.x+wx,p.y+d*.17,z+zz);ellipse(ctx,q.x,q.y,18*k,6*k,'#477861');
    }
    const top={...p,type:'pine',x:p.x,y:p.y,z:z+h*1.02,h:90,w:41,s:1,seed:p.seed};tree(ctx,top,camera,S,time);
  }
  function bridge(ctx,p,camera,S){
    const k=camera.zoom||1,l=p.length||210,w=p.w||95,ang=p.angle||0,co=Math.cos(ang),si=Math.sin(ang),z=p.z||0;
    const P=(u,v,zz=0)=>[p.x+co*u-si*v,p.y+si*u+co*v,z+zz];
    const B=(u,v,zz=0)=>S(...P(u,v,zz));
    const arch=u=>p.stone?Math.sin((u/l+.5)*Math.PI)*15:0;
    for(let i=0;i<16;i++){
      const u=-l/2+i*l/16,uu=u+l/16,zz=arch(u),zz2=arch(uu);
      polygon(ctx,[B(u,-w/2,zz),B(uu,-w/2,zz2),B(uu,w/2,zz2),B(u,w/2,zz)],p.stone?(i%2?'#b7c3b3':'#c9cebc'):(p.repaired?(i%2?'#b0a47a':'#c8b88e'):(i%2?'#9d916e':'#b1a17b')),'rgba(66,79,66,.24)',.7*k);
      polygon(ctx,[B(u,w/2,zz),B(uu,w/2,zz2),B(uu,w/2,zz2-13),B(u,w/2,zz-13)],p.stone?'#829689':'#71694f');
    }
    for(const side of [-1,1]){
      const points=[];for(let i=0;i<=8;i++){const u=-l/2+i*l/8,zz=arch(u);points.push(B(u,side*w/2,zz+31));line(ctx,[B(u,side*w/2,zz),B(u,side*w/2,zz+36)],p.stone?'#b1c0ac':'#786f55',5*k);if(p.stone){const q=B(u,side*w/2,zz+38);ellipse(ctx,q.x,q.y,4*k,4*k,'#d2d6bf');}}
      line(ctx,points,p.stone?'#ccd0b8':'#948767',4*k);
    }
  }
  function lantern(ctx,p,camera,S){
    const k=camera.zoom||1,z=p.z||0,h=p.h||75;
    shadow(ctx,p,camera,S,15,13,.13);
    if(p.wood){line(ctx,[S(p.x,p.y,z),S(p.x,p.y,z+h)],'#665d44',5*k);line(ctx,[S(p.x,p.y,z+h),S(p.x+18,p.y,z+h)],'#665d44',3*k);drawLantern(ctx,S(p.x+16,p.y,z+h),k,1.3);}
    else{box(ctx,S,p.x,p.y,28,28,z,8,['#b4bda3','#84987e','#687f6c']);box(ctx,S,p.x,p.y,10,10,z+8,h*.56,['#b4bda3','#92a28a','#748d7c']);box(ctx,S,p.x,p.y,26,26,z+h*.56,25,['#c1c7a9','#98a489','#7d917a']);const q=S(p.x+14,p.y+3,z+h*.76);ellipse(ctx,q.x,q.y,3*k,6*k,'#f2d08a');roof(ctx,S,p.x,p.y,z+h*.56+25,29,29,17,palette(p.biome),k,1);}
  }
  function fence(ctx,p,camera,S){
    const k=camera.zoom||1,l=p.length||100,ang=p.angle||0,co=Math.cos(ang),si=Math.sin(ang),z=p.z||0,h=p.h||36,color=p.stone?'#aebca4':'#8f8b64';
    const P=(u,h0)=>S(p.x+co*u,p.y+si*u,z+h0);
    for(let a=-l/2;a<=l/2+.1;a+=l/Math.ceil(l/36))line(ctx,[P(a,0),P(a,h)],p.stone?'#a7b29b':'#727b54',(p.stone?6:4)*k);
    for(const hh of [h*.37,h*.82])line(ctx,[P(-l/2,hh),P(l/2,hh)],color,(p.stone?5:3)*k);
  }
  function field(ctx,p,camera,S){
    const k=camera.zoom||1,z=p.z||0,w=p.w||150,d=p.d||80;
    box(ctx,S,p.x,p.y,w,d,z-4,6,['#7f8c63','#788363','#61795e']);
    for(let i=0;i<4;i++){
      const yy=p.y-d*.34+i*d*.22;line(ctx,[S(p.x-w*.43,yy,z+3),S(p.x+w*.43,yy,z+3)],'#a5aa78',3*k);
      for(let j=0;j<9;j++){
        const xx=p.x-w*.41+j*w*.102,q=S(xx,yy,z+7),c=p.flowers?['#c3b1c1','#d8c8a2','#9baebb'][j%3]:'#8fa26d';
        line(ctx,[{x:q.x,y:q.y+3*k},{x:q.x,y:q.y-7*k}], '#63845b',k);polygon(ctx,[{x:q.x-6*k,y:q.y-2*k},{x:q.x,y:q.y-5*k},{x:q.x+2*k,y:q.y-10*k},{x:q.x+6*k,y:q.y-2*k},{x:q.x,y:q.y+2*k}],c);
      }
    }
  }
  function stair(ctx,p,camera,S){
    const pal=palette(p.biome),steps=p.steps||9,w=p.w||140,d=p.d||130,h=p.h||55,z=p.z||0;
    for(let i=0;i<steps;i++){const yy=p.y+d/2-i*d/steps;box(ctx,S,p.x,yy,w,d/steps+1,z+i*h/steps,h/steps,[tone(pal.stone,23),tone(pal.stone,-4),tone(pal.stone,-15)]);}
  }
  function cart(ctx,p,camera,S){
    const k=camera.zoom||1,z=p.z||0;
    shadow(ctx,p,camera,S,49,38,.17);
    const a=S(p.x-28,p.y+36,z+15),b=S(p.x+28,p.y+36,z+15);
    for(const q of [a,b]){ellipse(ctx,q.x,q.y,13*k,15*k,'#6e6850','#a39469',3*k);line(ctx,[{x:q.x-9*k,y:q.y},{x:q.x+9*k,y:q.y}],'#c0af80',2*k);line(ctx,[{x:q.x,y:q.y-10*k},{x:q.x,y:q.y+10*k}],'#c0af80',2*k);}
    box(ctx,S,p.x,p.y,72,55,z+13,11,['#af9c70','#8a7c58','#6f694d']);
    for(const xx of [-25,0,25])for(const yy of [-13,14]){const q=S(p.x+xx,p.y+yy,z+31);ellipse(ctx,q.x,q.y,13*k,12*k,'#bcb486','#ded0a0',k);}
    line(ctx,[S(p.x-26,p.y+25,z+21),S(p.x-26,p.y+82,z+16)],'#938257',4*k);line(ctx,[S(p.x+26,p.y+25,z+21),S(p.x+26,p.y+82,z+16)],'#938257',4*k);
  }
  function shrine(ctx,p,camera,S,time){
    const pal=palette(p.biome),k=camera.zoom||1,z=p.z||0;
    shadow(ctx,p,camera,S,42,32,.14);box(ctx,S,p.x,p.y,63,53,z,10,['#bfc4ab','#98a28c','#7d927f']);
    box(ctx,S,p.x,p.y,38,29,z+10,69,[pal.stone,tone(pal.stone,4),tone(pal.stone,-20)]);
    const pp=S(p.x,p.y+15,z+46);line(ctx,[{x:pp.x,y:pp.y-19*k},{x:pp.x,y:pp.y+10*k}],'#d8d5b4',2*k);
    roof(ctx,S,p.x,p.y,z+79,52,42,25,pal,k,1);
    if(p.glow!==false&&!p.discovered){const q=S(p.x,p.y,z+105),r=13+Math.sin(time*.002)*3;const g=ctx.createRadialGradient(q.x,q.y,1,q.x,q.y,r*k);g.addColorStop(0,'rgba(231,221,166,.35)');g.addColorStop(1,'rgba(231,221,166,0)');ellipse(ctx,q.x,q.y,r*k,r*k,g);}
  }
  function waterfall(ctx,p,camera,S,time){
    const k=camera.zoom||1,h=p.h||360,w=p.w||95,z=p.z||0;
    pillar(ctx,{...p,w:w*2.9,d:w*1.65,h:h*.96},camera,S,time);
    const top=S(p.x+p.w*.12,p.y+p.w*.35,z+h*.94),bottom=S(p.x+p.w*.12,p.y+p.w*.35,z+4),ww=w*k;
    const g=ctx.createLinearGradient(top.x,top.y,bottom.x,bottom.y);g.addColorStop(0,'#b4d5d4');g.addColorStop(.3,'#c9e4df');g.addColorStop(.75,'#abd0d0');g.addColorStop(1,'rgba(207,232,225,.5)');
    polygon(ctx,[{x:top.x-ww*.5,y:top.y},{x:top.x+ww*.46,y:top.y+9*k},{x:bottom.x+ww*.60,y:bottom.y},{x:bottom.x-ww*.63,y:bottom.y}],g);
    for(let i=0;i<10;i++){const xx=top.x+(i/9-.5)*ww*.91,phase=((time*.055+i*49)%120)/120,yy=mix(top.y,bottom.y,phase);line(ctx,[{x:xx,y:yy},{x:xx+Math.sin(i)*3*k,y:Math.min(bottom.y,yy+(43+hash(i,p.seed)*50)*k)}],i%3?'rgba(239,250,239,.55)':'rgba(117,175,179,.65)',(1+hash(i+10,p.seed)*2)*k);}
    for(let i=0;i<7;i++){const qx=bottom.x+Math.sin(time*.0009+i*1.7)*ww*.63,qy=bottom.y+(i%3-1)*6*k;ellipse(ctx,qx,qy,ww*(.21+hash(i,p.seed)*.12),9*k,'rgba(211,232,216,.18)');}
  }
  function flag(ctx,p,camera,S,time){
    const k=camera.zoom||1,z=p.z||0,h=p.h||120,q=S(p.x,p.y,z+h),b=S(p.x,p.y,z);line(ctx,[b,q],'#77764e',4*k);ellipse(ctx,q.x,q.y-3*k,4*k,5*k,'#c6bf8a');
    const sw=Math.sin(time*.002+p.seed)*4*k;
    polygon(ctx,[{x:q.x+2*k,y:q.y+6*k},{x:q.x+42*k,y:q.y+9*k+sw},{x:q.x+38*k,y:q.y+73*k+sw},{x:q.x+20*k,y:q.y+65*k},{x:q.x+3*k,y:q.y+73*k}],p.color||'#777893','#c6b689',1*k);
    line(ctx,[{x:q.x+13*k,y:q.y+18*k},{x:q.x+27*k,y:q.y+23*k},{x:q.x+17*k,y:q.y+34*k},{x:q.x+29*k,y:q.y+45*k}], '#ded4aa',1.5*k);
  }
  function chest(ctx,p,camera,S){
    const z=p.z||0,k=camera.zoom||1;shadow(ctx,p,camera,S,24,17,.14);
    box(ctx,S,p.x,p.y,38,27,z,p.discovered?18:24,[p.discovered?'#544f3e':'#a19165','#82724f','#685e48']);
    for(const dx of [-14,14])line(ctx,[S(p.x+dx,p.y+14,z+2),S(p.x+dx,p.y+14,z+(p.discovered?17:23))],'#c8b87f',3*k);
    if(p.discovered){quad(ctx,S,[p.x-19,p.y-13,z+18],[p.x+19,p.y-13,z+18],[p.x+19,p.y-26,z+42],[p.x-19,p.y-26,z+42],'#9c8759','#c5af75',1.6*k);}
    const q=S(p.x,p.y+15,z+13);ctx.fillStyle=p.discovered?'#a69564':'#e4c27d';ctx.fillRect(q.x-3*k,q.y-3*k,6*k,6*k);
  }
  function gate(ctx,p,camera,S){
    const k=camera.zoom||1,w=p.w||185,h=p.h||150,z=p.z||0,pal=palette(p.biome);
    for(const dx of [-w/2,w/2]){box(ctx,S,p.x+dx,p.y,26,26,z,17,['#b3bca3','#8e9d87','#768e7c']);box(ctx,S,p.x+dx,p.y,14,14,z+17,h-17,[pal.accent,pal.accent,tone(pal.accent,-23)]);}
    box(ctx,S,p.x,p.y,w+24,16,z+h-15,20,[pal.accent,pal.accent,tone(pal.accent,-22)]);roof(ctx,S,p.x,p.y,z+h+5,w+20,46,37,pal,k);
    const q=S(p.x,p.y+10,z+h-7);ctx.save();ctx.translate(q.x,q.y);ctx.transform(1,.577,0,1,0,0);ctx.fillStyle='#3c5349';ctx.fillRect(-39*k,-13*k,78*k,24*k);ctx.strokeStyle='#bdb58a';ctx.lineWidth=k;ctx.strokeRect(-37*k,-11*k,74*k,20*k);ctx.fillStyle='#e1d5a3';ctx.font=`${Math.max(9,13*k)}px "Noto Serif SC",serif`;ctx.textAlign='center';ctx.fillText(p.sign||'山河无恙',0,3*k);ctx.restore();
  }
  function altar(ctx,p,camera,S){
    const pal=palette(p.biome),k=camera.zoom||1,z=p.z||0;
    for(let t=0;t<3;t++){const r=(p.w||160)-t*17,zz=z+t*8,ps=[];for(let i=0;i<8;i++){const a=i/8*TAU;ps.push([p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,zz]);}
      for(let i=0;i<8;i++)if(i<4)quad(ctx,S,ps[i],ps[(i+1)%8],[...ps[(i+1)%8].slice(0,2),zz+8],[...ps[i].slice(0,2),zz+8],tone(pal.stone,i%2?-16:-5));
      polygon(ctx,ps.map(q=>S(q[0],q[1],zz+8)),tone(pal.stone,14+t*9),'#a6b1a0',k);
    }
    ringWorld(ctx,S,p.x,p.y,z+25,(p.w||160)*.63,(p.w||160)*.63,null,'#899a91',1.8*k);
    for(let i=0;i<7;i++){const a=i/7*TAU;line(ctx,[S(p.x+Math.cos(a)*35,p.y+Math.sin(a)*35,z+25),S(p.x+Math.cos(a)*100,p.y+Math.sin(a)*100,z+25)],'#889b93',1.4*k);}
  }
  function regionExtra(ctx,p,camera,S,time){
    const k=camera.zoom||1,z=p.z||0,pal=palette(p.biome),w=p.w||100,d=p.d||70,h=p.h||90;
    if(p.type==='wall'){
      box(ctx,S,p.x,p.y,w,d,z,h,[tone(pal.stone,21),tone(pal.stone,-1),tone(pal.stone,-20)]);
      box(ctx,S,p.x,p.y,w+9,d+9,z+h,8,[tone(pal.stone,30),tone(pal.stone,7),tone(pal.stone,-7)]);
      for(let i=-w/2+30;i<w/2;i+=45)line(ctx,[S(p.x+i,p.y+d/2+.5,z+7),S(p.x+i,p.y+d/2+.5,z+h-3)],'rgba(61,82,69,.27)',k);
    }else if(p.type==='tent'){
      shadow(ctx,p,camera,S,w*.66,d*.62,.19);
      const a=[p.x-w/2,p.y-d/2,z],b=[p.x+w/2,p.y-d/2,z],c=[p.x+w/2,p.y+d/2,z],dd=[p.x-w/2,p.y+d/2,z],r1=[p.x,p.y-d/2,z+h],r2=[p.x,p.y+d/2,z+h];
      polygon(ctx,[S(...a),S(...dd),S(...r2),S(...r1)],p.color||'#9b9d7b','#626f57',k);polygon(ctx,[S(...c),S(...b),S(...r1),S(...r2)],p.secured?'#7d9f83':'#797f68','#626f57',k);
      polygon(ctx,[S(...dd),S(...c),S(...r2)],'#b4ae87','#716f53',k);polygon(ctx,[S(p.x-18,p.y+d/2+1,z),S(p.x+18,p.y+d/2+1,z),S(p.x,p.y+d/2+1,z+h*.76)],'#465747');
      for(const q of [a,b,c,dd]){line(ctx,[S(...q),S(q[0]+(q[0]-p.x)*.3,q[1]+(q[1]-p.y)*.3,z-3)],'#b7b391',k);}
      line(ctx,[S(...r1),S(...r2)],'#d0c69a',2*k);
    }else if(p.type==='boat'){
      const pts=[[p.x-w*.5,p.y,z+8],[p.x-w*.29,p.y-d*.48,z+13],[p.x+w*.36,p.y-d*.44,z+14],[p.x+w*.55,p.y,z+18],[p.x+w*.35,p.y+d*.42,z+7],[p.x-w*.3,p.y+d*.45,z+6]];
      polygon(ctx,pts.map(q=>S(...q)),'#9a8b62','#5d6650',2*k);polygon(ctx,[S(p.x-w*.3,p.y-d*.28,z+14),S(p.x+w*.3,p.y-d*.26,z+15),S(p.x+w*.31,p.y+d*.22,z+13),S(p.x-w*.28,p.y+d*.24,z+12)],'#615f44');
      for(let i=-1;i<=1;i++)line(ctx,[S(p.x+i*w*.19,p.y-d*.3,z+16),S(p.x+i*w*.19,p.y+d*.29,z+14)],'#b5a37b',5*k);
      if(p.canopy)roof(ctx,S,p.x,p.y,z+56,w*.54,d*.8,25,pal,k,1);
    }else if(p.type==='brazier'){
      shadow(ctx,p,camera,S,19,17,.16);box(ctx,S,p.x,p.y,26,26,z,12,['#a5ac90','#808b73','#627965']);box(ctx,S,p.x,p.y,14,14,z+12,21,['#778670','#6a785e','#4c6051']);
      ringWorld(ctx,S,p.x,p.y,z+33,26,25,'#535f50','#b7b18a',2*k);
      if(p.lit!==false){const q=S(p.x,p.y,z+44),f=1+Math.sin(time*.009+p.seed)*.12;const g=ctx.createRadialGradient(q.x,q.y,1,q.x,q.y,55*k);g.addColorStop(0,'rgba(245,189,96,.22)');g.addColorStop(1,'rgba(245,189,96,0)');ellipse(ctx,q.x,q.y,55*k,42*k,g);polygon(ctx,[{x:q.x-14*k,y:q.y+8*k},{x:q.x-5*k,y:q.y-10*k*f},{x:q.x+3*k,y:q.y-25*k*f},{x:q.x+7*k,y:q.y-6*k},{x:q.x+14*k,y:q.y+8*k}], '#d59656');ellipse(ctx,q.x,q.y+3*k,6*k,13*k,'#f1ce88');}
    }else if(p.type==='sluice'){
      for(const dx of [-w/2,w/2])box(ctx,S,p.x+dx,p.y,21,26,z,h,['#a1af96','#7d927d','#5d7b6c']);
      box(ctx,S,p.x,p.y,w+34,22,z+h,16,['#adbc9d','#8da28a','#6b8877']);
      const lift=p.opened?h*.48:0;
      for(let i=0;i<5;i++)box(ctx,S,p.x,p.y+4,w-15,10,z+12+i*13+lift,11,['#a79669','#8d805b','#6f694e']);
      const q=S(p.x+w*.7,p.y,z+h*.5);ellipse(ctx,q.x,q.y,17*k,18*k,null,'#a9a07a',3*k);line(ctx,[{x:q.x-15*k,y:q.y},{x:q.x+15*k,y:q.y}],'#d0c197',2*k);line(ctx,[{x:q.x,y:q.y-15*k},{x:q.x,y:q.y+15*k}],'#d0c197',2*k);
    }else if(p.type==='taskToken'){
      const kind=p.taskKind||'board';
      if(kind==='flag'){flag(ctx,{...p,h:123,color:'#739b83'},camera,S,time);}
      else if(['parcel','medicine','basket','scroll','map'].includes(kind)){
        shadow(ctx,p,camera,S,31,25,.15);box(ctx,S,p.x,p.y,48,37,z,31,['#c6b78e','#a99c73','#858562']);
        for(const dx of [-17,17])line(ctx,[S(p.x+dx,p.y+19,z+3),S(p.x+dx,p.y+19,z+30)],'#73846b',3*k);
        line(ctx,[S(p.x-24,p.y,z+32),S(p.x+24,p.y,z+32)],'#75866e',4*k);
        const q=S(p.x,p.y,z+36);ellipse(ctx,q.x,q.y,9*k,3*k,null,'#74816a',2*k);
        if(kind==='medicine'){const q2=S(p.x+11,p.y-5,z+37);line(ctx,[{x:q2.x-5*k,y:q2.y},{x:q2.x+5*k,y:q2.y}],'#d9d4a3',2*k);line(ctx,[{x:q2.x,y:q2.y-5*k},{x:q2.x,y:q2.y+5*k}],'#d9d4a3',2*k);}
      }else if(kind==='bench'||kind==='table'){
        const ww=kind==='table'?93:112,dd=kind==='table'?61:30,hh=kind==='table'?39:30;
        for(const dx of [-ww*.34,ww*.34])for(const dy of [-dd*.31,dd*.31])box(ctx,S,p.x+dx,p.y+dy,8,8,z,hh,['#ab9c73','#92866a','#756f55']);
        box(ctx,S,p.x,p.y,ww,dd,z+hh,8,['#b8ad84','#958e6c','#7b7859']);
        if(kind==='table')for(const dx of [-25,4,28]){const q=S(p.x+dx,p.y+dx*.2,z+hh+15);ellipse(ctx,q.x,q.y,9*k,4*k,'#ddd7b3','#7a8d77',k);ellipse(ctx,q.x,q.y-2*k,6*k,2*k,'#eee4c2');}
      }else if(kind==='rope'){
        for(let i=0;i<4;i++)ringWorld(ctx,S,p.x,p.y,z+4+i*2,28-i*4,23-i*3,null,'#c4b087',2.6*k);
        line(ctx,[S(p.x+27,p.y,z+4),S(p.x+49,p.y+16,z+2),S(p.x+76,p.y+13,z+2)],'#b9a279',2.3*k);
        box(ctx,S,p.x-38,p.y-15,17,17,z,59,['#beae82','#a39573','#857958']);
      }else if(kind==='cloth'||kind==='windchime'||kind==='windharp'){
        for(const dx of [-54,54])box(ctx,S,p.x+dx,p.y,8,8,z,83,['#b9ab7f','#998c68','#748263']);
        line(ctx,[S(p.x-54,p.y,z+79),S(p.x,p.y,z+72),S(p.x+54,p.y,z+79)],'#b7b69b',1.5*k);
        if(kind==='cloth')for(let i=0;i<3;i++){const xx=p.x-33+i*33,zz=z+74-Math.abs(i-1)*3;quad(ctx,S,[xx-12,p.y,zz],[xx+12,p.y,zz],[xx+15,p.y+2,zz-29],[xx-12,p.y+2,zz-32],['#b5c5b2','#c7b8a0','#9fbbb0'][i]);}
        else for(let i=0;i<5;i++){const xx=p.x-33+i*17,zz=z+72,len=16+(i%3)*9;line(ctx,[S(xx,p.y,zz),S(xx,p.y,zz-len)],kind==='windharp'?'#94a77c':'#c4bc92',4*k);const q=S(xx,p.y,zz-len-4);ellipse(ctx,q.x,q.y,4*k,3*k,'#b1b18a');}
      }else if(kind==='stone'){
        box(ctx,S,p.x,p.y,88,65,z,17,['#bfc6ad','#93a58f','#728b7a']);rock(ctx,{...p,w:54,d:39,h:57,z:z+17,moss:true},camera,S);
        for(const dx of [-26,26])line(ctx,[S(p.x+dx,p.y+25,z+8),S(p.x+dx,p.y+21,z+51)],'#c5b37d',3*k);
      }else if(kind==='lantern'){
        lantern(ctx,{...p,wood:true,h:97},camera,S);
      }else{
        box(ctx,S,p.x,p.y,10,10,z,83,['#bca97b','#9e916c','#7c795a']);
        box(ctx,S,p.x,p.y+1,85,10,z+51,39,['#b0a17c','#bcad84','#938363']);
        for(let i=0;i<3;i++)line(ctx,[S(p.x-27,p.y+7,z+79-i*9),S(p.x+22-(i%2)*9,p.y+7,z+79-i*9)],kind==='redcord'?'#9e6152':'#577d68',2*k);
        if(kind==='redcord')line(ctx,[S(p.x-49,p.y,z+56),S(p.x-30,p.y+5,z+42),S(p.x+45,p.y+3,z+61)],'#ad6958',2.5*k);
      }
    }
  }

  function drawProp(ctx, p, camera, time = 0, playerPos) {
    const k=camera.zoom||1,S=(x,y,z=0)=>{if(p.rotation){const dx=x-p.x,dy=y-p.y,co=Math.cos(p.rotation),si=Math.sin(p.rotation);return screen(p.x+dx*co-dy*si,p.y+dx*si+dy*co,z,camera);}return screen(x,y,z,camera);}; ctx.save();
    if(playerPos && !['field','bridge','stair','altar','chest'].includes(p.type)) {
      const pp=S(playerPos.x,playerPos.y,playerPos.z||0),bb=S(p.x,p.y,p.z||0),w=(p.boundW||p.w||100)*k*.95,h=(p.boundH||p.h||150)*k;
      if(p.x+p.y>playerPos.x+playerPos.y+14 && Math.abs(bb.x-pp.x)<w && pp.y<bb.y+10*k && pp.y>bb.y-h-25*k)ctx.globalAlpha=.34;
    }
    switch(p.type){
      case 'pine':case 'tree':case 'blossom':case 'goldtree':tree(ctx,p,camera,S,time);break;
      case 'bamboo':bamboo(ctx,p,camera,S,time);break;case 'rock':rock(ctx,p,camera,S);break;case 'pillar':pillar(ctx,p,camera,S,time);break;
      case 'building':building(ctx,p,camera,S);break;case 'bridge':bridge(ctx,p,camera,S);break;case 'lantern':lantern(ctx,p,camera,S);break;
      case 'fence':fence(ctx,p,camera,S);break;case 'field':field(ctx,p,camera,S);break;case 'stair':stair(ctx,p,camera,S);break;
      case 'cart':cart(ctx,p,camera,S);break;case 'shrine':shrine(ctx,p,camera,S,time);break;case 'waterfall':waterfall(ctx,p,camera,S,time);break;
      case 'wall':case 'tent':case 'boat':case 'brazier':case 'sluice':case 'taskToken':regionExtra(ctx,p,camera,S,time);break;
      case 'flag':flag(ctx,p,camera,S,time);break;case 'chest':chest(ctx,p,camera,S);break;case 'gate':gate(ctx,p,camera,S);break;case 'altar':altar(ctx,p,camera,S);break;
    }ctx.restore();
  }

  function makePath(a,b,index=0,width=106){
    const length=dist(a,b),bend=Math.min(165,length*.115)*(hash(index,17)>.5?1:-1),mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=b.x-a.x,dy=b.y-a.y,n=Math.max(6,Math.ceil(length/130));
    const cx=mx-dy/length*bend,cy=my+dx/length*bend,points=[];
    for(let i=0;i<=n;i++){const t=i/n,u=1-t;points.push({x:u*u*a.x+2*u*t*cx+t*t*b.x,y:u*u*a.y+2*u*t*cy+t*t*b.y});}
    return {from:a.id,to:b.id,points,width};
  }
  function riverRibbon(points,width){
    const a=[],b=[];
    for(let i=0;i<points.length;i++){
      const prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],dx=next.x-prev.x,dy=next.y-prev.y,len=Math.hypot(dx,dy)||1;
      a.push({x:points[i].x-dy/len*width,y:points[i].y+dx/len*width});b.push({x:points[i].x+dy/len*width,y:points[i].y-dx/len*width});
    }return a.concat(b.reverse());
  }
  function canvasSurface(width,height){
    try{
      if(typeof global.OffscreenCanvas==='function')return new global.OffscreenCanvas(width,height);
      if(global.document&&typeof global.document.createElement==='function'){const c=global.document.createElement('canvas');if(typeof c.getContext!=='function')return null;c.width=width;c.height=height;return c;}
    }catch(e){ /* Headless renderers use the exact same vector fallback. */ }
    return null;
  }
  function propOpacity(p,camera,playerPos){
    if(!playerPos||['field','bridge','stair','altar','chest'].includes(p.type))return 1;
    const k=camera.zoom||1,pp=screen(playerPos.x,playerPos.y,playerPos.z||0,camera),bb=screen(p.x,p.y,p.z||0,camera),w=(p.boundW||p.w||100)*k*.95,h=(p.boundH||p.h||150)*k;
    return p.x+p.y>playerPos.x+playerPos.y+14&&Math.abs(bb.x-pp.x)<w&&pp.y<bb.y+10*k&&pp.y>bb.y-h-25*k?.34:1;
  }
  function drawCachedProp(ctx,scene,p,camera,time,playerPos){
    if(p.type==='waterfall'||p.type==='flag'||p.type==='brazier'||scene._canvasUnavailable){drawProp(ctx,p,camera,time,playerPos);return;}
    const cache=scene._propCache||(scene._propCache=new Map());let entry=cache.get(p.id);if(entry&&Math.abs((camera.zoom||1)-entry.zoom)>.18){cache.delete(p.id);scene._cacheBytes-=entry.bytes;entry=null;}
    if(!entry){
      const pixelRatio=Math.max(1,Math.min(2,ctx.getTransform?Math.abs(ctx.getTransform().a)||1:1)),density=(camera.zoom||1)*pixelRatio,pad=9;let rad=Math.max(36,p.boundW||100),bottom=Math.max(34,((p.w||55)+(p.d||45))*.28),top=p.boundH||150;
      if(['tree','pine','blossom','goldtree'].includes(p.type)){rad=(p.w||67)*(p.s||1)*1.12+9;bottom=31;top=(p.h||133)*(p.s||1)*1.25+18;}
      else if(p.type==='bamboo'){rad=86;bottom=31;top=221;}
      else if(p.type==='building'){const bw=p.w||180,bd=p.d||135,bh=p.h||110,f=p.floors||1;rad=SQ*(bw+bd)/2+50;bottom=(bw+bd)*.26+25;top=13+(f-1)*bh*.66+bh*(f>1?.62:1)+(p.roofH||42)+40+(bw+bd)*.25;}
      else if(p.type==='rock'){rad=(p.w||60)*.66+(p.d||p.w||60)*.38+8;bottom=((p.w||60)+(p.d||p.w||60))*.18+14;top=(p.h||40)+((p.w||60)+(p.d||60))*.21+12;}
      else if(p.type==='bridge'){const co=Math.cos(p.angle||0),si=Math.sin(p.angle||0),len=p.length||210,bw=p.w||95;rad=SQ*(Math.abs(co-si)*len+Math.abs(co+si)*bw)/2+18;bottom=(Math.abs(co+si)*len+Math.abs(co-si)*bw)*.25+20;top=bottom+70;}
      else if(p.type==='field'){rad=SQ*((p.w||150)+(p.d||80))/2+10;bottom=((p.w||150)+(p.d||80))*.25+14;top=bottom+18;}
      else if(p.type==='gate'){rad=SQ*((p.w||185)+80)/2+36;bottom=(p.w||185)*.25+30;}
      const ww=Math.ceil((rad*2+pad*2)*density),hh=Math.ceil((top+bottom+pad)*density),canvas=canvasSurface(ww,hh);
      if(!canvas){scene._canvasUnavailable=true;drawProp(ctx,p,camera,time,playerPos);return;}
      const c=canvas.getContext('2d');if(!c){scene._canvasUnavailable=true;drawProp(ctx,p,camera,time,playerPos);return;}
      const localCamera={x:p.x,y:p.y,z:(p.z||0)+(hh/2-bottom*density)/density,width:ww,height:hh,zoom:density};
      drawProp(c,p,localCamera,21000,null);
      entry={canvas,width:ww/density,height:hh/density,bottom,zoom:camera.zoom||1,bytes:ww*hh*4,last:scene._cacheFrame||0};cache.set(p.id,entry);scene._cacheBytes=(scene._cacheBytes||0)+entry.bytes;
      if(scene._cacheBytes>88*1024*1024){for(const [key,v]of cache){if(v.last<(scene._cacheFrame||0)-2){cache.delete(key);scene._cacheBytes-=v.bytes;if(scene._cacheBytes<72*1024*1024)break;}}}
    }
    entry.last=scene._cacheFrame||0;
    const q=screen(p.x,p.y,p.z||0,camera),k=camera.zoom||1;
    ctx.save();ctx.globalAlpha*=propOpacity(p,camera,playerPos);
    const sway=['tree','pine','blossom','goldtree','bamboo'].includes(p.type)?Math.sin(time*.0013+p.seed)*.65*k:0;
    ctx.drawImage(entry.canvas,q.x-entry.width*.5*k+sway,q.y-(entry.height-entry.bottom)*k,entry.width*k,entry.height*k);ctx.restore();
  }
  function drawCachedGround(ctx,scene,camera,time){
    if(scene._canvasUnavailable){drawGround(ctx,scene,camera,time);return;}
    const W=camera.width||1000,H=camera.height||700,k=camera.zoom||1,padding=210;
    const cur=project(camera.x||0,camera.y||0,camera.z||0);let cache=scene._groundCache;
    let dx=cache?(cache.center.x-cur.x)*k:Infinity,dy=cache?(cache.center.y-cur.y)*k:Infinity;
    if(!cache||cache.W!==W||cache.H!==H||Math.abs(cache.zoom-k)>.001||Math.abs(dx)>padding-40||Math.abs(dy)>padding-40||time-cache.time>1800){
      const canvas=cache&&cache.W===W&&cache.H===H?cache.canvas:canvasSurface(W+padding*2,H+padding*2);
      if(!canvas){scene._canvasUnavailable=true;drawGround(ctx,scene,camera,time);return;}
      const c=canvas.getContext('2d');if(!c){scene._canvasUnavailable=true;drawGround(ctx,scene,camera,time);return;}const cc={...camera,width:W+padding*2,height:H+padding*2};drawGround(c,scene,cc,time);
      cache=scene._groundCache={canvas,W,H,zoom:k,center:cur,time,padding};dx=0;dy=0;
    }
    const sx=Math.round(cache.padding-dx),sy=Math.round(cache.padding-dy);ctx.drawImage(cache.canvas,sx,sy,W,H,0,0,W,H);
  }

  function makeScene(config){
    const width=config.width,height=config.height,combat=!!config.combat,random=rng(config.seed||84051),locations=config.locations||[],props=[],colliders=[],paths=config.paths||[],rivers=[],ponds=[],discoveries=[],surfaces=[];
    let propID=0;
    const baseHeight=config.heightAt||(()=>0);
    const bridges=[];
    const scene={width,height,combat,locations,props,colliders,paths,rivers,ponds,discoveries,surfaces,reservedPoints:config.reservedPoints||[],spawn:config.spawn||{x:width/2,y:height/2},biome:config.biome||'forest'};
    scene.heightAt=(x,y)=>{
      const base=baseHeight(x,y); if(combat)return 0;
      for(const b of bridges){if(!b.stone)continue;const co=Math.cos(b.angle||0),si=Math.sin(b.angle||0),dx=x-b.x,dy=y-b.y,u=dx*co+dy*si,v=-dx*si+dy*co;if(Math.abs(u)<=b.length/2&&Math.abs(v)<=b.w/2+3)return b.z+Math.max(0,Math.sin((u/b.length+.5)*Math.PI))*15;}
      return base;
    };
    scene.nearestLocation=(x,y)=>{let nearest=locations[0],dd=Infinity;for(const l of locations){const d=Math.hypot(x-l.x,y-l.y);if(d<dd){dd=d;nearest=l;}}return nearest;};
    scene.biomeAt=(x,y)=>combat?scene.biome:(scene.nearestLocation(x,y)||{biome:'forest'}).biome;
    scene.pathDistance=(x,y)=>{let n=Infinity;for(const p of paths)n=Math.min(n,distancePath(x,y,p.points)-(p.width||106)/2);return n;};
    scene.isReserved=(x,y,r=0)=>{
      if(scene.pathDistance(x,y)<r+16)return true;
      for(const l of locations)if(Math.hypot(x-l.x,y-l.y)<132+r)return true;
      for(const d of discoveries)if(Math.hypot(x-d.x,y-d.y)<74+r)return true;
      for(const a of scene.reservedPoints)if(Math.hypot(x-a.x,y-a.y)<(a.radius||86)+r)return true;
      return false;
    };
    scene.isWater=(x,y,r=0)=>{
      for(const p of ponds)if(((x-p.x)/(p.rx+r))**2+((y-p.y)/(p.ry+r))**2<1)return true;
      for(const river of rivers)if(distancePath(x,y,river.points)<river.width+r)return true;
      return false;
    };
    scene.canMove=(x,y,r=18)=>{
      if(!Number.isFinite(x)||!Number.isFinite(y))return false;
      if(x<r+20||y<r+20||x>width-r-20||y>height-r-20)return false;
      if(combat)return true;
      let bridged=false;
      for(const b of bridges){const co=Math.cos(b.angle||0),si=Math.sin(b.angle||0),dx=x-b.x,dy=y-b.y,u=dx*co+dy*si,v=-dx*si+dy*co;if(Math.abs(u)<b.length*.56&&Math.abs(v)<b.w*.5+12){bridged=true;break;}}
      if(!bridged&&scene.isWater(x,y,r*.35)&&scene.pathDistance(x,y)>-r-6)return false;
      for(const c of colliders){
        if(c.kind==='rect'){if(Math.abs(x-c.x)<c.w/2+r&&Math.abs(y-c.y)<c.d/2+r)return false;}
        else if(((x-c.x)/(c.rx+r))**2+((y-c.y)/(c.ry+r))**2<1)return false;
      }return true;
    };
    scene.addProp=(p,collision=false)=>{
      p={seed:hash(propID+3,config.seed||31)*1000,id:'landscape-'+propID++,...p};
      if(p.z===undefined)p.z=baseHeight(p.x,p.y);if(!p.biome)p.biome=scene.biomeAt(p.x,p.y);if(!p.boundW)p.boundW=p.type==='building'?(p.w||180)+(p.d||135):p.type==='pillar'?(p.w||160)*1.3:p.type==='bamboo'?120:p.type==='gate'?(p.w||185)*1.2:(p.w||90)*1.5;
      if(!p.boundH)p.boundH=p.type==='building'?(p.h||110)*(p.floors||1)+110:p.type==='waterfall'?(p.h||360)+130:p.type==='pillar'?(p.h||330)+140:p.type==='bamboo'?230:(p.h||150)*(p.s||1)+40;
      props.push(p);
      if(p.type==='bridge'){bridges.push(p);const co=Math.cos(p.angle||0),si=Math.sin(p.angle||0);p.boundW=SQ*(Math.abs(co-si)*(p.length||210)+Math.abs(co+si)*(p.w||95))/2+22;p.boundH=(Math.abs(co+si)*(p.length||210)+Math.abs(co-si)*(p.w||95))*.25+86;}
      if(collision&&!combat&&!p.open){
        if(p.type==='building'||p.collisionBox)colliders.push({kind:'rect',x:p.x,y:p.y,w:(p.w||180)+6,d:(p.d||135)+6,prop:p.id});
        else colliders.push({kind:'ellipse',x:p.x,y:p.y,rx:p.collisionR||(p.type==='pine'||p.type==='tree'||p.type==='blossom'||p.type==='goldtree'?11:(p.w||60)*.43),ry:p.collisionR||(p.type==='pine'||p.type==='tree'||p.type==='blossom'||p.type==='goldtree'?11:(p.d||p.w||60)*.38),prop:p.id});
      }return p;
    };
    scene.safePlace=(l,dx,dy,r=100)=>{
      const want={x:l.x+dx,y:l.y+dy},candidates=[want];
      for(const rr of [0,70,140,210])for(let i=0;i<24;i++){const a=i/24*TAU;candidates.push({x:want.x+Math.cos(a)*rr,y:want.y+Math.sin(a)*rr});}
      let best=want,score=-Infinity;
      for(const p of candidates){if(p.x<80+r||p.y<80+r||p.x>width-80-r||p.y>height-80-r)continue;const path=scene.pathDistance(p.x,p.y),core=Math.min(...locations.map(x=>dist(p,x)-132)),free=Math.min(path,core),water=scene.isWater(p.x,p.y,r);let ss=Math.min(free,r+30)*5-dist(p,want)*.2-(water?700:0);for(const c of colliders)if(dist(p,c)<r+(c.w||c.rx||25))ss-=500;if(ss>score){score=ss;best=p;}}
      return best;
    };
    scene.getDrawables=(camera,time=0,playerPos)=>{
      const out=[],k=camera.zoom||1,W=camera.width||1000,H=camera.height||700;scene._cacheFrame=(scene._cacheFrame||0)+1;
      for(const p of props){if(p.hidden)continue;if(k<.52&&['tree','pine','bamboo','goldtree','blossom'].includes(p.type)&&hash(p.seed,13)>.63)continue;const q=screen(p.x,p.y,p.z,camera),rx=p.boundW*k,hh=p.boundH*k;if(q.x+rx<-60||q.x-rx>W+60||q.y+80*k<-60||q.y-hh>H+60)continue;out.push({id:p.id,depth:p.depth!==undefined?p.depth:p.x+p.y,prop:p,draw:ctx=>drawCachedProp(ctx,scene,p,camera,time,playerPos)});}
      return out;
    };
    scene.drawProp=(ctx,p,camera,time,playerPos)=>drawProp(ctx,p,camera,time,playerPos);
    scene.getGroundHeight=baseHeight;
    scene._random=random;
    scene.rebuildGround=()=>{scene._groundCache=null;prepareGround(scene,config);};
    scene.setDiscoveries=(ids=[])=>{
      const seen=ids&&typeof ids.has==='function'?ids:new Set(Array.isArray(ids)?ids:Object.keys(ids).filter(id=>ids[id]));
      for(const p of props){if(!p.discoveryId)continue;const flag=seen.has(p.discoveryId);if(!!p.discovered===flag)continue;p.discovered=flag;const entry=scene._propCache&&scene._propCache.get(p.id);if(entry){scene._cacheBytes-=entry.bytes;scene._propCache.delete(p.id);}}
    };
    scene.dispose=()=>{if(scene._propCache)scene._propCache.clear();scene._cacheBytes=0;scene._groundCache=null;};
    scene.drawGround=(ctx,camera,time=0)=>drawCachedGround(ctx,scene,camera,time);
    return scene;
  }
  function prepareGround(scene,config){
    const tile=scene.combat?95:112,margin=scene.combat?600:400,tiles=[],H=scene.getGroundHeight;scene.tileSize=tile;
    const minx=-Math.ceil(margin/tile),miny=-Math.ceil(margin/tile),maxx=Math.ceil((scene.width+margin)/tile),maxy=Math.ceil((scene.height+margin)/tile);
    for(let iy=miny;iy<maxy;iy++)for(let ix=minx;ix<maxx;ix++){
      const x=ix*tile,y=iy*tile,biome=scene.biomeAt(x+tile/2,y+tile/2),pal=palette(biome);let col=pal.ground;
      if(!scene.combat){let total=0,rr=0,gg=0,bb=0;for(const l of scene.locations){const d2=(x-l.x)**2+(y-l.y)**2,w=Math.exp(-d2/480000);const c=rgb(palette(l.biome).ground);total+=w;rr+=c[0]*w;gg+=c[1]*w;bb+=c[2]*w;}if(total>.0001)col='#'+[rr/total,gg/total,bb/total].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');}
      const hh=H(x,y),slope=(H(x+tile,y)-hh)/tile,shade=Math.round((Math.sin(x/390)+Math.cos(y/460))*.9+slope*14);
      const pts=[[x,y],[x+tile,y],[x+tile,y+tile],[x,y+tile]].map(q=>project(q[0],q[1],H(...q)));
      tiles.push({ix,iy,x,y,pts,fill:tone(col,shade)});
    }scene.groundTiles=tiles;
    const decors=[],random=rng(config.seed||5311),count=scene.combat?170:2600;
    for(let i=0;i<count;i++){
      const x=(random()*(scene.width+margin*2)-margin),y=random()*(scene.height+margin*2)-margin;
      if(scene.pathDistance(x,y)<8||scene.isWater(x,y,12))continue;
      decors.push({x,y,z:H(x,y),type:random()>.32?'grass':'pebble',n:random(),biome:scene.biomeAt(x,y)});
    }scene.groundDecor=decors;
  }
  function drawGround(ctx,scene,camera,time){
    const k=camera.zoom||1,W=camera.width||1000,H=camera.height||700,S=(x,y,z=0)=>screen(x,y,z,camera),GH=scene.getGroundHeight;
    ctx.save();const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,scene.combat?'#a8bbb1':'#a7bdb8');bg.addColorStop(1,'#667f74');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    const corners=[[0,0],[W,0],[W,H],[0,H]].map(a=>worldAt(a[0],a[1],camera,180)),xs=corners.map(q=>q.x),ys=corners.map(q=>q.y),minX=Math.min(...xs)-300,maxX=Math.max(...xs)+300,minY=Math.min(...ys)-300,maxY=Math.max(...ys)+300;
    const cc=project(camera.x||0,camera.y||0,camera.z||0),ox=W/2-cc.x*k,oy=H/2-cc.y*k;
    for(const t of scene.groundTiles||[]){if(t.x<minX-scene.tileSize||t.x>maxX||t.y<minY-scene.tileSize||t.y>maxY)continue;polygon(ctx,t.pts.map(p=>({x:p.x*k+ox,y:p.y*k+oy})),t.fill,t.fill,.7);}
    if(k>.28)for(const p of scene.groundDecor||[]){if(p.x<minX||p.x>maxX||p.y<minY||p.y>maxY)continue;const q=S(p.x,p.y,p.z);if(q.x<-20||q.x>W+20||q.y<-20||q.y>H+20)continue;const pal=palette(p.biome);if(p.type==='grass'){
      line(ctx,[{x:q.x-4*k,y:q.y},{x:q.x-7*k,y:q.y-5*k}],tone(pal.light,-4),.8*k);line(ctx,[q,{x:q.x-1*k,y:q.y-8*k}],tone(pal.light,3),k);line(ctx,[{x:q.x+2*k,y:q.y+1*k},{x:q.x+5*k,y:q.y-4*k}],tone(pal.dark,12),.8*k);
    }else ellipse(ctx,q.x,q.y,(2+p.n*4)*k,(1+p.n*2)*k,tone(pal.stone,5));}
    for(const r of scene.rivers){
      const broad=riverRibbon(r.points,r.width+11).map(p=>S(p.x,p.y,GH(p.x,p.y)-1));polygon(ctx,broad,'#7e9c88');
      const inner=riverRibbon(r.points,r.width).map(p=>S(p.x,p.y,GH(p.x,p.y)+1));polygon(ctx,inner,r.color||'#649590');
      const inner2=riverRibbon(r.points,r.width*.73).map(p=>S(p.x,p.y,GH(p.x,p.y)+2));polygon(ctx,inner2,'rgba(47,107,113,.19)');
      for(let j=1;j<r.points.length;j++){
        const a=r.points[j-1],b=r.points[j],n=Math.max(1,Math.floor(dist(a,b)/85));
        for(let ii=0;ii<n;ii++){const t=(ii+((time*.0002+j*.31)%1))/n,x=mix(a.x,b.x,t),y=mix(a.y,b.y,t),off=(hash(ii,j)-.5)*r.width*1.3,q=S(x+off,y-off,GH(x,y)+3);if(q.x<-40||q.x>W+40||q.y<-30||q.y>H+30)continue;line(ctx,[{x:q.x-13*k,y:q.y},{x:q.x,y:q.y+2*k},{x:q.x+20*k,y:q.y}], 'rgba(184,220,205,.43)',1*k);}
      }
    }
    for(const p of scene.ponds){
      const z=GH(p.x,p.y),pal=palette(p.biome||scene.biome),q=S(p.x,p.y,z);if(q.x+p.rx*k*2<0||q.x-p.rx*k*2>W||q.y+p.ry*k<0||q.y-p.ry*k>H)continue;
      ringWorld(ctx,S,p.x,p.y,z,p.rx+12,p.ry+12,'#92ac91');ringWorld(ctx,S,p.x,p.y,z+1,p.rx,p.ry,p.color||pal.water);ringWorld(ctx,S,p.x,p.y,z+2,p.rx*.79,p.ry*.81,'rgba(59,123,124,.16)');
      for(let i=0;i<18;i++){const a=hash(i,27)*TAU,r=Math.sqrt(hash(i+20,p.x))*.86,x=p.x+Math.cos(a)*p.rx*r,y=p.y+Math.sin(a)*p.ry*r,q2=S(x,y,z+3);line(ctx,[{x:q2.x-9*k,y:q2.y},{x:q2.x+13*k,y:q2.y}],'rgba(220,238,217,.33)',1*k);if(p.lotus&&i%3===0){ringWorld(ctx,S,x,y,z+4,12,11,'#88a77b');const flower=S(x+4,y-4,z+8);ellipse(ctx,flower.x,flower.y,4*k,3*k,i%2?'#cfaeb3':'#e0c8bc');}}
    }
    for(const p of scene.paths){
      const pts=p.points;if(!pts.some(q=>q.x>minX-250&&q.x<maxX+250&&q.y>minY-250&&q.y<maxY+250))continue;const pal=palette(scene.biomeAt(pts[Math.floor(pts.length/2)].x,pts[Math.floor(pts.length/2)].y)),ribbon=riverRibbon(pts,(p.width||106)/2);
      polygon(ctx,ribbon.map(q=>S(q.x,q.y,GH(q.x,q.y)+2)),tone(pal.path,-15));polygon(ctx,riverRibbon(pts,(p.width||106)/2-5).map(q=>S(q.x,q.y,GH(q.x,q.y)+3)),pal.path);
      if(k>.4)for(let i=1;i<pts.length;i++){
        const a=pts[i-1],b=pts[i],len=dist(a,b),n=Math.ceil(len/31),dx=(b.x-a.x)/len,dy=(b.y-a.y)/len;
        for(let j=0;j<n;j++){const t=j/n,x=mix(a.x,b.x,t),y=mix(a.y,b.y,t);if(x<minX||x>maxX||y<minY||y>maxY)continue;const off=(hash(i,j)-.5)*22,half=(p.width||106)*.36,aa={x:x-dy*half+dx*off,y:y+dx*half+dy*off},bb={x:x+dy*half+dx*off,y:y-dx*half+dy*off};line(ctx,[S(aa.x,aa.y,GH(aa.x,aa.y)+3.1),S(bb.x,bb.y,GH(bb.x,bb.y)+3.1)],'rgba(121,122,92,.20)',.8*k);if((i+j)%3===0)line(ctx,[S(x,y,GH(x,y)+3.1),S(x+dx*18,y+dy*18,GH(x+dx*18,y+dy*18)+3.1)],'rgba(118,118,88,.18)',.8*k);}
      }
    }
    for(const l of scene.locations){
      const q=S(l.x,l.y,GH(l.x,l.y));if(q.x<-300||q.x>W+300||q.y<-220||q.y>H+220)continue;
      const pal=palette(l.biome);ringWorld(ctx,S,l.x,l.y,GH(l.x,l.y)+3,128,128,tone(pal.path,5));ringWorld(ctx,S,l.x,l.y,GH(l.x,l.y)+3.5,117,117,null,'rgba(136,144,109,.35)',1.5*k);
      for(let a=0;a<8;a++){const ang=a/8*TAU;line(ctx,[S(l.x+Math.cos(ang)*72,l.y+Math.sin(ang)*72,GH(l.x,l.y)+4),S(l.x+Math.cos(ang)*116,l.y+Math.sin(ang)*116,GH(l.x,l.y)+4)],'rgba(132,143,111,.25)',1*k);}
    }
    for(const f of scene.surfaces){
      const pal=palette(f.biome||scene.biome),z=f.z||0;
      if(f.type==='court'){
        box(ctx,S,f.x,f.y,f.w+26,f.d+26,z-26,25,[tone(pal.stone,9),tone(pal.stone,-26),tone(pal.stone,-40)]);
        quad(ctx,S,[f.x-f.w/2,f.y-f.d/2,z],[f.x+f.w/2,f.y-f.d/2,z],[f.x+f.w/2,f.y+f.d/2,z],[f.x-f.w/2,f.y+f.d/2,z],f.color||pal.path);
        for(let y=f.y-f.d/2+40;y<f.y+f.d/2;y+=40)line(ctx,[S(f.x-f.w/2,y,z+.1),S(f.x+f.w/2,y,z+.1)],'rgba(109,124,105,.24)',.8*k);
        for(let x=f.x-f.w/2+48;x<f.x+f.w/2;x+=48)line(ctx,[S(x,f.y-f.d/2,z+.1),S(x,f.y+f.d/2,z+.1)],'rgba(109,124,105,.20)',.8*k);
        ringWorld(ctx,S,f.x,f.y,z+.2,120,120,null,'rgba(150,148,112,.37)',3*k);ringWorld(ctx,S,f.x,f.y,z+.2,112,112,null,'rgba(150,148,112,.22)',1*k);
      }
    }
    if(scene.combat){
      const pal=palette(scene.biome);const corners=[[40,75],[scene.width-40,75],[scene.width-40,scene.height-40],[40,scene.height-40]];polygon(ctx,corners.map(p=>S(...p,0)),null,'rgba(225,225,188,.25)',2*k);
    }
    ctx.restore();
  }

  function createWorld(data){
    const source=Array.isArray(data)?data:(data&&data.locations)||[],width=5600,height=4000;
    const fallback=[['forest','西海峰林',20,73,'forest'],['yuchan','玉蟾宫',22,27,'palace'],['inn','金鞭溪客栈',42,62,'inn'],['liuqige','六奇阁',48,24,'temple'],['leizhuang','快活林·奔雷旧庄',62,75,'village'],['waterfall','天悬白练',67,44,'waterfall'],['gallery','十里画廊',82,64,'bamboo'],['baicao','百草谷',84,26,'garden'],['tianzi','天子山',55,9,'summit']].map(a=>({id:a[0],name:a[1],x:a[2],y:a[3],biome:a[4]}));
    const locations=(source.length?source:fallback).map(l=>({...l,px:l.x,py:l.y,originalX:l.x,originalY:l.y,x:l.x*width/100,y:l.y*height/100,biome:biomeName(l.biome||l.id)}));
    const byId=Object.fromEntries(locations.map(l=>[l.id,l])),paths=[],done=new Set();
    const defaultEdges=[['forest','yuchan'],['forest','inn'],['yuchan','liuqige'],['inn','liuqige'],['inn','leizhuang'],['liuqige','waterfall'],['liuqige','tianzi'],['leizhuang','waterfall'],['leizhuang','gallery'],['waterfall','gallery'],['waterfall','baicao'],['gallery','baicao'],['gallery','tianzi'],['baicao','tianzi']];
    const edges=[];for(const l of locations)for(const c of l.connections||[])edges.push([l.id,c]);if(!edges.length)edges.push(...defaultEdges);
    for(const [a,b] of edges){const key=[a,b].sort().join('|');if(done.has(key)||!byId[a]||!byId[b])continue;done.add(key);paths.push(makePath(byId[a],byId[b],paths.length,106));}
    const heightAt=(x,y)=>{
      let z=17+Math.sin(x/490)*8+Math.cos(y/420)*7+Math.sin((x+y)/760)*5;
      for(const [id,amp,spread] of [['forest',38,610],['liuqige',76,540],['waterfall',39,570],['baicao',32,700],['tianzi',160,610]]){
        const l=byId[id];if(l)z+=amp*Math.exp(-((x-l.x)**2+(y-l.y)**2)/(spread*spread));
      }return z;
    };
    const scene=makeScene({width,height,seed:72067,locations,paths,heightAt,spawn:{x:(byId.forest||locations[0]).x+30,y:(byId.forest||locations[0]).y+36}});
    const A=scene.addProp,random=scene._random;
    const discoveryNames={forest:[['viewpoint','云海听松','旧栈台伸向云海，七峰的影子在雾里相接。'],['cache','白猫遗刻','石碑旁的旧匣仍留着守林人的刻记。']],yuchan:[['shrine','冰月水榭','水榭的风铃与荷池水声轻轻相和。'],['herb','玉露青莲','雨后的荷叶托着一颗晶亮的露珠。']],inn:[['cache','溪畔旧酒坛','小木棚里留着掌柜给过路人的物资。'],['viewpoint','金鞭听溪','石桥下的清流绕过客栈，奔向远山。']],liuqige:[['herb','云阶药圃','药圃里长着逗逗细心栽培的山间灵草。'],['shrine','六奇问心亭','小观后的一方清静处，留给赶路人调息。']],leizhuang:[['cache','旧庄粮仓','乡亲们留下几袋粮食，为同行的人添一份力。'],['shrine','奔雷古碑','经年风雨洗过碑面，侠义二字仍清晰可见。']],waterfall:[['viewpoint','水帘观瀑台','水雾从白练深处涌出，山谷里只有瀑声。'],['cache','青光藏锋处','青苔后藏着一份没有落款的行路补给。']],gallery:[['viewpoint','画廊望峰台','一水一峰，连成十里的青绿长卷。'],['herb','听竹灵泉','竹根旁清泉潺潺，灵草借水而生。']],baicao:[['herb','百草试香田','药田依着缓坡铺开，风送来草木清香。'],['shrine','竹舍听琴','一张旧琴静候谷主归来，竹叶正随风起舞。']],tianzi:[['viewpoint','天门观星台','登临峰顶，群山和来时的道路都在脚下。'],['shrine','七剑问天石','七道旧剑痕汇向中央，等着同伴再度相逢。']]};
    for(const l of locations){
      const defs=discoveryNames[l.id]||[],offsets=[[265,172],[-232,210]];
      defs.forEach((d,i)=>{
        const x=clamp(l.x+offsets[i][0],90,width-90),y=clamp(l.y+offsets[i][1],90,height-90),id=l.id+'-wild-'+(i+1),item={id,location:l.id,region:l.id,type:d[0],name:d[1],description:d[2],x,y,z:heightAt(x,y)};scene.discoveries.push(item);
        paths.push({...makePath(l,item,30+paths.length,76),exploration:true});
      });
      l.safe={x:l.x,y:l.y,z:heightAt(l.x,l.y)};l.npc={x:l.x-10,y:l.y-16,z:heightAt(l.x-10,l.y-16)};l.spawn={x:l.x+34,y:l.y+42,z:heightAt(l.x+34,l.y+42)};
    }
    scene.spawn.z=heightAt(scene.spawn.x,scene.spawn.y);
    scene.rivers.push({id:'golden-whip-creek',width:54,color:'#5e9790',points:[{x:4090,y:1010},{x:3930,y:1320},{x:4000,y:1580},{x:3740,y:1800},{x:3490,y:2010},{x:3010,y:2170},{x:2700,y:2420},{x:2350,y:2610},{x:2090,y:2980},{x:2260,y:3350},{x:2330,y:4000},{x:2420,y:4400}]});
    scene.rivers.push({id:'gallery-stream',width:43,color:'#699c94',points:[{x:5280,y:850},{x:5060,y:1290},{x:4920,y:1730},{x:5100,y:2110},{x:4840,y:2500},{x:4630,y:2960},{x:4520,y:3460},{x:4710,y:4090}]});
    if(byId.yuchan)scene.ponds.push({x:byId.yuchan.x+210,y:byId.yuchan.y+195,rx:166,ry:126,biome:'palace',lotus:true});
    if(byId.baicao)scene.ponds.push({x:byId.baicao.x+230,y:byId.baicao.y-150,rx:125,ry:90,biome:'garden',lotus:true});
    for(const path of paths)for(const river of scene.rivers)for(let i=1;i<path.points.length;i++)for(let j=1;j<river.points.length;j++){
      const p=intersection(path.points[i-1],path.points[i],river.points[j-1],river.points[j]);if(p&&!scene.props.some(q=>q.type==='bridge'&&dist(q,p)<125))A({type:'bridge',...p,length:river.width*3.2,w:(path.width||106)+8,stone:['palace','temple','summit'].includes(scene.biomeAt(p.x,p.y)),biome:scene.biomeAt(p.x,p.y)});
    }
    function structure(l,dx,dy,p,collision=true){
      const r=Math.hypot((p.w||150)/2,(p.d||110)/2)+30,at=scene.safePlace(l,dx,dy,r);return A({...p,...at,biome:l.biome},collision);
    }
    function flora(l,type,count,inner=260,outer=690){
      for(let i=0;i<count*4&&count>0;i++){
        const a=random()*TAU,r=inner+Math.sqrt(random())*(outer-inner),x=l.x+Math.cos(a)*r,y=l.y+Math.sin(a)*r;
        if(x<70||y<70||x>width-70||y>height-70||scene.isReserved(x,y,type==='bamboo'?40:23)||scene.isWater(x,y,25)||!scene.canMove(x,y,40))continue;
        A({type,x,y,s:.75+random()*.55,h:type==='pine'?133+random()*45:110+random()*34,w:57+random()*28,count:4+Math.floor(random()*3),biome:l.biome},type!=='bamboo');count--;
      }
    }
    for(const l of locations){
      if(l.id==='forest'){
        const hut=structure(l,-315,-190,{type:'building',w:135,d:108,h:102,open:true,roofH:48,sign:'守林旧亭'});
        structure(l,170,-270,{type:'gate',w:135,d:30,h:128,sign:'西海峰林'},false);
        flora(l,'pine',52,280,800);flora(l,'tree',30,220,650);
        for(const [dx,dy,w,h] of [[-430,-380,190,420],[-110,-640,146,350],[-650,-60,135,330],[260,-530,112,286],[-450,300,126,290]])structure(l,dx,dy,{type:'pillar',w,d:w*.73,h},true);
        A({type:'lantern',x:hut.x+93,y:hut.y+100,biome:l.biome});
      }else if(l.id==='yuchan'){
        const hall=structure(l,-260,-265,{type:'building',w:238,d:155,h:148,floors:2,roofH:49,sign:'玉蟾宫',lanterns:true});
        structure(l,340,-250,{type:'building',w:128,d:97,h:113,open:true,roofH:43},true);
        structure(l,-390,210,{type:'building',w:132,d:100,h:94,roofH:36},true);
        structure(l,20,365,{type:'gate',w:200,d:30,h:140,sign:'冰魄映月'},false);
        for(const dx of [-hall.w*.55,hall.w*.55])A({type:'lantern',x:hall.x+dx,y:hall.y+155,biome:l.biome});
        A({type:'stair',x:hall.x,y:hall.y+110,z:hall.z-22,w:150,d:75,h:22,steps:5,biome:l.biome});
        flora(l,'blossom',30,275,625);flora(l,'tree',15,500,750);
        for(let i=0;i<5;i++)A({type:'fence',x:hall.x-180+i*90,y:hall.y+140,length:75,stone:true,biome:l.biome});
      }else if(l.id==='inn'){
        const inn=structure(l,-245,-225,{type:'building',w:232,d:157,h:139,floors:2,roofH:48,sign:'金鞭溪',lanterns:true});
        structure(l,255,-260,{type:'building',w:131,d:93,h:80,roofH:34,open:true,lanterns:true});
        structure(l,-350,165,{type:'building',w:113,d:82,h:76,roofH:30});
        structure(l,280,250,{type:'cart',w:82,d:88,h:65});
        A({type:'flag',x:inn.x+inn.w*.61,y:inn.y+98,h:148,color:'#96776c',biome:l.biome});
        for(const d of [-1,1])A({type:'lantern',x:inn.x+d*120,y:inn.y+139,wood:true,h:98,biome:l.biome});
        flora(l,'goldtree',29,280,650);flora(l,'tree',27,480,800);
      }else if(l.id==='liuqige'){
        const temple=structure(l,-240,-230,{type:'building',w:186,d:139,h:144,floors:2,roofH:43,sign:'六奇阁'});
        structure(l,315,-195,{type:'building',w:114,d:97,h:95,roofH:43,open:true});
        A({type:'stair',x:temple.x,y:temple.y+120,z:temple.z-45,w:147,d:112,h:45,steps:10,biome:l.biome});
        for(const dx of [-112,112])A({type:'lantern',x:temple.x+dx,y:temple.y+157,biome:l.biome});
        for(let i=0;i<4;i++){const pt=scene.safePlace(l,240+i*32,260-i*50,20);A({type:'field',...pt,w:135,d:64,flowers:i%2===0,biome:l.biome});}
        flora(l,'pine',31,310,735);flora(l,'blossom',13,370,610);
        for(const [dx,dy]of [[-450,-290],[220,-435]])structure(l,dx,dy,{type:'pillar',w:143,d:100,h:250});
      }else if(l.id==='leizhuang'){
        const manor=structure(l,-235,-245,{type:'building',w:193,d:136,h:118,roofH:45,sign:'奔雷旧庄',lanterns:true});
        structure(l,315,-110,{type:'building',w:130,d:102,h:83,roofH:34});structure(l,-290,305,{type:'building',w:120,d:99,h:83,roofH:38});
        structure(l,270,290,{type:'cart',w:86,d:98,h:73});structure(l,430,205,{type:'cart',w:84,d:98,h:73});
        for(let i=0;i<3;i++)A({type:'field',x:manor.x-255,y:manor.y+40+i*99,w:173,d:77,biome:l.biome});
        A({type:'flag',x:manor.x+127,y:manor.y+110,h:142,color:'#b39665',biome:l.biome});
        flora(l,'goldtree',36,320,790);flora(l,'tree',30,200,700);
      }else if(l.id==='waterfall'){
        const fall=structure(l,-365,-270,{type:'waterfall',w:120,d:195,h:370});
        scene.ponds.push({x:fall.x+56,y:fall.y+79,rx:169,ry:127,biome:'waterfall',color:'#8cb6b0'});
        structure(l,305,-240,{type:'building',w:128,d:111,h:102,roofH:46,open:true});
        for(const [dx,dy,w,h] of [[-490,-470,150,410],[-35,-490,180,420],[320,-510,145,336]])structure(l,dx,dy,{type:'pillar',w,d:w*.72,h});
        flora(l,'tree',35,330,745);flora(l,'bamboo',18,280,610);
      }else if(l.id==='gallery'){
        structure(l,-290,-180,{type:'building',w:138,d:115,h:108,roofH:41,open:true});
        structure(l,310,-260,{type:'building',w:103,d:93,h:88,roofH:32,open:true});
        for(const [dx,dy,w,h] of [[-420,-460,136,326],[45,-580,131,305],[390,-430,153,344],[-410,280,119,266]])structure(l,dx,dy,{type:'pillar',w,d:w*.7,h});
        flora(l,'bamboo',57,255,780);flora(l,'tree',16,420,775);
      }else if(l.id==='baicao'){
        const house=structure(l,-265,-210,{type:'building',w:164,d:123,h:107,roofH:42,sign:'百草谷',lanterns:true});
        structure(l,325,270,{type:'building',w:109,d:104,h:97,roofH:32,open:true});
        for(let i=0;i<8;i++){
          const x=house.x-80+(i%2)*171,y=house.y+230+Math.floor(i/2)*80;if(scene.isReserved(x,y,58)||scene.isWater(x,y,20))continue;
          A({type:'field',x,y,w:154,d:65,flowers:true,biome:l.biome});
        }
        flora(l,'bamboo',29,310,685);flora(l,'blossom',24,280,700);flora(l,'tree',15,450,770);
      }else if(l.id==='tianzi'){
        A({type:'altar',x:l.x,y:l.y,z:heightAt(l.x,l.y)-24,w:118,h:25,biome:l.biome});
        structure(l,-245,-120,{type:'gate',w:179,d:30,h:157,sign:'天子山'},false);
        for(const [dx,dy,w,h]of [[-320,-230,152,320],[220,-260,183,425],[-510,80,180,377],[490,60,151,296],[-420,370,121,307],[330,450,148,360]])structure(l,dx,dy,{type:'pillar',w,d:w*.7,h});
        for(let i=0;i<7;i++){const a=i/7*TAU,x=l.x+Math.cos(a)*207,y=l.y+Math.sin(a)*207;if(scene.isReserved(x,y,16))continue;A({type:'shrine',x,y,w:70,d:55,h:103,glow:false,biome:l.biome},true);}
        flora(l,'pine',30,390,830);
      }
    }
    // 途中地形以疏密和轮廓区别：竹林、暖色阔叶、雾峰与药田分区布置。
    for(let i=0;i<1050;i++){
      const x=80+random()*(width-160),y=80+random()*(height-160),biome=scene.biomeAt(x,y),l=scene.nearestLocation(x,y);
      if(scene.isReserved(x,y,38)||scene.isWater(x,y,35)||!scene.canMove(x,y,48)||dist({x,y},l)<450)continue;
      if(random()<.29){const w=35+random()*50;A({type:'rock',x,y,w,d:w*.76,h:w*(.53+random()*.36),biome},true);}
      else{const type=['bamboo','garden'].includes(biome)?'bamboo':biome==='village'||biome==='inn'?'goldtree':biome==='summit'?'pine':random()>.6?'pine':'tree';A({type,x,y,s:.65+random()*.5,h:105+random()*55,w:47+random()*33,biome},type!=='bamboo');}
    }
    for(const d of scene.discoveries){
      const parent=byId[d.location],biome=parent.biome,dx=d.x-parent.x,dy=d.y-parent.y,dl=Math.hypot(dx,dy)||1,side=scene.safePlace(d,dy/dl*108,-dx/dl*108,45);
      if(d.type==='shrine')A({type:'shrine',x:side.x,y:side.y,w:65,d:54,h:120,biome,discoveryId:d.id},true);
      else if(d.type==='cache')A({type:'chest',x:d.x-38,y:d.y-26,w:43,d:31,h:40,biome,discoveryId:d.id});
      else if(d.type==='herb')A({type:'field',x:d.x-65,y:d.y-54,w:93,d:62,flowers:true,biome,discoveryId:d.id});
      else{
        A({type:'building',x:d.x-68,y:d.y-75,w:86,d:82,h:90,open:true,roofH:34,biome,discoveryId:d.id},true);
        A({type:'lantern',x:d.x+64,y:d.y-47,w:35,h:66,biome,discoveryId:d.id});
      }
    }
    // 开放水域在小径交会处铺石堤，桥面在行走高度中真实抬起。
    for(const pond of scene.ponds){
      for(const path of paths){let hit=null;for(const q of path.points)if(((q.x-pond.x)/pond.rx)**2+((q.y-pond.y)/pond.ry)**2<.72){hit=q;break;}if(!hit)continue;
        if(propsNear(scene.props,hit,'bridge',190))continue;const idx=path.points.indexOf(hit),a=path.points[Math.max(0,idx-1)],b=path.points[Math.min(path.points.length-1,idx+1)],angle=Math.atan2(b.y-a.y,b.x-a.x);
        A({type:'bridge',x:hit.x,y:hit.y,angle,length:Math.max(pond.rx,pond.ry)*2.35,w:path.width+7,stone:true,biome:pond.biome});
      }
    }
    scene.rebuildGround();return scene;
  }
  function propsNear(props,p,type,r){return props.some(q=>q.type===type&&dist(q,p)<r);}

  function createBattle(biome,seed,opts={}){
    biome=biomeName(biome);const width=opts.width||960,height=opts.height||600,scene=makeScene({width,height,combat:true,biome,seed:seed||90331,heightAt:()=>0,spawn:{x:width*.5,y:height*.64}}),A=scene.addProp,random=scene._random;
    const center={x:width/2,y:height/2},pal=palette(biome);
    if(['palace','temple','inn','village','summit'].includes(biome))scene.surfaces.push({type:'court',...center,w:width-6,d:height-6,biome,color:biome==='inn'?'#b8ad87':biome==='village'?'#bdb78f':pal.path});
    else scene.paths.push({from:'entry',to:'exit',width:122,points:[{x:-280,y:height*.65},{x:width*.25,y:height*.58},{x:width*.55,y:height*.49},{x:width+210,y:height*.31}]});
    const bgBuilding=(x,y,w,d,h,extra={})=>A({type:'building',x,y,w,d,h,biome,...extra});
    if(biome==='palace'){
      bgBuilding(width*.34,-195,247,159,141,{floors:2,roofH:45,sign:'玉蟾宫',lanterns:true});bgBuilding(width+147,height*.27,132,117,103,{open:true,roofH:38});
      scene.ponds.push({x:width*.68,y:-115,rx:165,ry:80,biome,lotus:true});A({type:'bridge',x:width*.7,y:-98,angle:0,length:304,w:71,stone:true,biome});
      for(const [x,y]of [[70,-70],[width-90,-76],[-59,height*.46],[width+53,height*.58]])A({type:'lantern',x,y,h:78,biome});
      for(let i=0;i<12;i++){const side=i%2?-1:1;A({type:'blossom',x:side<0?-100-random()*160:width+110+random()*160,y:-200+i*85,w:60+random()*27,h:135,s:1.1,biome});}
    }else if(biome==='inn'){
      bgBuilding(width*.36,-191,237,163,139,{floors:2,roofH:46,sign:'金鞭溪',lanterns:true});bgBuilding(width+125,height*.25,140,105,83,{open:true,lanterns:true});
      scene.rivers.push({width:38,points:[{x:-230,y:-160},{x:90,y:-106},{x:390,y:-100},{x:730,y:-87},{x:1160,y:-180}],color:'#6d9b91'});
      A({type:'bridge',x:width*.72,y:-100,angle:Math.PI/2,length:165,w:86,stone:false,biome});
      A({type:'flag',x:width*.27,y:-35,h:117,color:'#ac795f',biome});A({type:'cart',x:width+87,y:height*.73,w:80,d:100,h:73,biome});
    }else if(biome==='temple'){
      bgBuilding(width*.40,-215,207,148,143,{floors:2,sign:'六奇阁',roofH:44});A({type:'stair',x:width*.4,y:-47,z:-42,w:166,d:97,h:42,steps:8,biome});
      for(const x of [width*.16,width*.73])A({type:'lantern',x,y:-23,h:81,biome});
      A({type:'pillar',x:-174,y:105,w:167,d:122,h:323,biome});A({type:'pillar',x:width+180,y:100,w:157,d:99,h:367,biome});
      bgBuilding(width+137,height*.75,105,91,88,{open:true});
    }else if(biome==='village'){
      bgBuilding(width*.20,-154,169,129,106,{roofH:42,sign:'奔雷旧庄'});bgBuilding(width*.69,-150,151,117,91,{roofH:39,lanterns:true});bgBuilding(-134,height*.37,125,111,80,{roofH:36});
      A({type:'cart',x:width+82,y:height*.26,w:81,d:92,h:76,biome});A({type:'cart',x:width+112,y:height*.77,w:81,d:94,h:72,biome});A({type:'flag',x:width*.52,y:-32,h:139,color:'#b79a62',biome});
      for(let i=0;i<3;i++)A({type:'field',x:-170,y:height*.65+i*89,w:155,d:71,biome});
    }else if(biome==='waterfall'){
      A({type:'waterfall',x:width*.48,y:-234,w:141,d:191,h:410,biome});A({type:'pillar',x:width*.18,y:-275,w:169,d:122,h:380,biome});A({type:'pillar',x:width*.81,y:-292,w:139,d:100,h:370,biome});
      scene.ponds.push({x:width*.57,y:-92,rx:194,ry:76,biome,color:'#84afa9'});
      A({type:'bridge',x:width*.58,y:-78,angle:0,length:343,w:70,stone:false,biome});bgBuilding(width+160,height*.39,118,107,103,{open:true,roofH:39});
      scene.rivers.push({width:40,points:[{x:width+125,y:-200},{x:width+98,y:150},{x:width+160,y:470},{x:width+100,y:height+270}],color:'#87b4ac'});
    }else if(biome==='bamboo'){
      A({type:'pillar',x:width*.24,y:-244,w:149,d:109,h:359,biome});A({type:'pillar',x:width*.68,y:-312,w:171,d:115,h:389,biome});bgBuilding(width*.51,-103,128,107,104,{open:true,roofH:37});
      scene.rivers.push({width:43,points:[{x:-143,y:-170},{x:-105,y:120},{x:-133,y:400},{x:-187,y:height+200}],color:'#77a499'});
      A({type:'bridge',x:-115,y:height*.71,angle:0,length:205,w:82,stone:true,biome});
    }else if(biome==='garden'){
      bgBuilding(width*.38,-163,173,127,104,{roofH:41,sign:'百草谷'});bgBuilding(width+141,height*.27,104,101,91,{open:true,roofH:32});
      for(let i=0;i<5;i++)A({type:'field',x:width*.14+i*170,y:-65,w:151,d:65,flowers:true,biome});
      scene.ponds.push({x:-176,y:height*.42,rx:102,ry:151,biome,lotus:true});
    }else if(biome==='summit'){
      A({type:'gate',x:width*.47,y:-165,w:250,h:183,sign:'七剑合璧',biome});
      for(const [x,y,w,h]of [[-200,-97,190,389],[width*.18,-330,150,430],[width*.77,-289,170,402],[width+190,87,145,335],[-123,height+190,148,284],[width+146,height+204,151,310]])A({type:'pillar',x,y,w,d:w*.7,h,biome});
      for(const [x,y]of [[93,-23],[width-92,-23],[-23,height*.76],[width+25,height*.77]])A({type:'shrine',x,y,w:63,d:57,h:111,glow:false,biome});
    }else{
      for(const [x,y,w,h]of [[width*.15,-262,177,361],[width*.64,-280,140,402],[-186,height*.12,130,301],[width+154,height*.16,167,357]])A({type:'pillar',x,y,w,d:w*.74,h,biome});
      bgBuilding(width*.44,-97,125,106,104,{open:true,roofH:43});A({type:'gate',x:width*.83,y:-96,w:133,h:115,sign:'西海峰林',biome});
    }
    const forestCount=['bamboo','garden'].includes(biome)?60:33;
    for(let i=0;i<forestCount;i++){
      let x,y;const edge=i%4;
      if(edge===0){x=-95-random()*210;y=-250+random()*(height+470);}
      else if(edge===1){x=width+95+random()*210;y=-250+random()*(height+470);}
      else if(edge===2){x=-210+random()*(width+420);y=-145-random()*200;}
      else{x=-200+random()*(width+400);y=height+150+random()*240;}
      if(scene.isWater(x,y,25)||scene.props.some(p=>['building','pillar','waterfall'].includes(p.type)&&Math.hypot(x-p.x,y-p.y)<145))continue;
      const type=['bamboo','garden'].includes(biome)?'bamboo':biome==='village'||biome==='inn'?'goldtree':biome==='palace'?'blossom':i%3?'pine':'tree';
      A({type,x,y,w:57+random()*30,h:120+random()*40,s:.75+random()*.45,biome});
    }
    for(let i=0;i<16;i++){
      const x=i%2?-60-random()*90:width+60+random()*90,y=random()*height,w=29+random()*30;A({type:'rock',x,y,w,d:w*.7,h:w*.72,biome});
    }
    scene.rebuildGround();return scene;
  }
  global.JianghuScene={project,unproject,screen,worldAt,createWorld,createBattle,createTerrain:makeScene,makePath,drawProp,palettes:PALETTES,distancePath,version:'3.0.0'};
})(typeof window!=='undefined'?window:globalThis);
