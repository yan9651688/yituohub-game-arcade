/* Nonhuman tower bestiary. Coordinates are already projected screen coordinates.
 * No ground shadow: Combat.drawShadows owns that pass. No gameplay mutations.
 */
(() => {
  'use strict';
  const TAU = Math.PI * 2, clamp = v => Math.max(0, Math.min(1, v));
  const aliases = { beast:'beast', yishou:'beast', '异兽':'beast', yao:'yao', demon:'yao', '妖物':'yao', evil:'evil', xie:'evil', '邪物':'evil', ghost:'ghost', gui:'ghost', '鬼物':'ghost' };
  function poly(c, points, fill, stroke='#263e3b', width=1.15) {
    c.beginPath(); points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p)); c.closePath();
    if(fill){c.fillStyle=fill;c.fill();} if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
  }
  function line(c, points, color, width=2) {c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
  function orb(c,x,y,r,color) {c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=color;c.fill();}
  function gem(c,x,y,r,color) {poly(c,[[x,y-r],[x+r*.7,y],[x,y+r],[x-r*.7,y]],color,'#d9e9be',.7);}
  function eye(c,x,y,color='#f6e5a3',back=false){if(!back){poly(c,[[x-4,y-2],[x+5,y-1],[x+1,y+2]],color,null);}}
  function leaf(c,x,y,a,size,fill) {c.save();c.translate(x,y);c.rotate(a);poly(c,[[0,3],[-size*.4,-size*.45],[0,-size],[size*.38,-size*.4]],fill);line(c,[[0,1],[0,-size*.8]],'#adba82',.7);c.restore();}
  function blade(c,x,y,a,s=1,color='#94aeb0') {c.save();c.translate(x,y);c.rotate(a);c.scale(s,s);poly(c,[[-4,4],[-7,-24],[0,-47],[6,-24],[3,4]],color);poly(c,[[0,-43],[6,-24],[3,4],[0,1]],'#4b6574',null);line(c,[[-11,5],[10,5]],'#c3a66b',3);line(c,[[0,6],[0,17]],'#4c403c',4);gem(c,0,-11,3,'#d6aa81');c.restore();}
  function beast(c,k,b,t,step,attack,back) {
    const heavy=k==='heavy', ranged=k==='archer', swift=k==='assassin';
    const main=heavy?'#788b83':swift?'#789ba0':'#899b87', light=heavy?'#afbb9d':'#b9c6a2';
    // A long lashing tail and four separated digitigrade legs preserve the animal silhouette.
    line(c,[[-25,-31],[-43,-36-step*2],[-54,-52-step*3]],'#364f4d',7);
    poly(c,[[-55,-50-step*3],[-63,-61-step*3],[-48,-56-step*3]],light);
    for(let i=0;i<4;i++){const x=i<2?-23:18,far=i%2===0,s=step*(far?-1:1)*5;poly(c,[[x+(far?6:0),-28],[x+9,-18],[x+5+s,-3],[x+16+s,-2],[x+12+s,1],[x-1+s,0],[x-4,-15]],far?'#425d58':main);}
    poly(c,[[-35,-32],[-29,-49],[5,-54],[28,-44],[30,-23],[7,-17],[-24,-22]],main);
    poly(c,[[-29,-49],[5,-54],[28,-44],[2,-35],[-35,-32]],light);
    poly(c,[[-8,-51],[6,-63],[18,-53],[28,-44],[1,-35]],'#526d65');
    if(heavy||b)for(let i=0;i<5;i++)poly(c,[[-28+i*12,-42],[-28+i*12,-61-(i%2)*7],[-15+i*12,-46]],i%2?'#728b7e':'#c1c8a5');
    c.save();c.translate(attack*7,-attack*3);
    poly(c,[[17,-46],[26,-64],[43,-60],[52,-44],[43,-30],[28,-32]],main);
    poly(c,[[26,-64],[43,-60],[36,-47],[17,-46]],light);
    poly(c,[[38,-47],[56,-44],[53,-35],[38,-33]],'#455f58');
    poly(c,[[23,-60],[18,-80],[30,-68]],'#d9cfaa');poly(c,[[39,-59],[48,-77],[46,-56]],'#e3d8b3');
    eye(c,39,-50,'#f3d995',back);poly(c,[[48,-36],[47,-28],[43,-35]],'#eee2ba',null);c.restore();
    if(ranged||b){ // Broad bat/stone wings are not a humanoid cape.
      for(const s of [-1,1]){c.save();c.translate(-8,-43);c.scale(s,1);poly(c,[[0,0],[16,-21],[49,-30+step*4],[38,-9],[25,-12],[17,2]],'#6a8480');line(c,[[0,0],[16,-21],[38,-9]],'#b3bea0',1.2);c.restore();}
    }
    if(swift)for(let i=0;i<3;i++)line(c,[[-25+i*12,-34],[-20+i*12,-24]],'#d0ddd1',1.5);
    if(b){gem(c,31,-65,6,'#ecdca0');poly(c,[[-14,-51],[-14,-78],[-7,-69],[0,-87],[7,-65],[15,-74],[14,-50]],'#b4bd9c');}
  }
  function yao(c,k,b,t,step,attack,back) {
    const heavy=k==='heavy', swift=k==='assassin', ranged=k==='archer';
    if(swift){ // Fox apparition: low body, pointed muzzle, ears and three separate tails.
      for(let i=0;i<(b?5:3);i++) {const y=-28-i*9;poly(c,[[-15,-25],[-38,y+8],[-55,y-11-step*2],[-46,y-24],[-36,y-8],[-10,-35]],i%2?'#8aa88f':'#b9c4a2');}
      poly(c,[[-24,-36],[5,-44],[26,-32],[20,-19],[-18,-16]],'#aabda1');
      for(const x of [-16,17])poly(c,[[x,-23],[x+5,-22],[x+step*3,0],[x-8+step*3,0]],'#668a77');
      poly(c,[[13,-35],[13,-66],[26,-51],[39,-65],[37,-43],[48,-35],[28,-29]],'#c7d3b5');eye(c,31,-43,'#b55980',back);gem(c,25,-51,3,'#d795af');return;
    }
    // Root stalks, leaf crowns and flower-maws never have human arms or clothing.
    const n=heavy?7:5;
    for(let i=0;i<n;i++){const a=i/n*TAU,x=Math.cos(a)*17;line(c,[[0,-28],[x,-17],[x*1.7+step*(i%2?2:-2),-3],[x*2.1,0]],i%2?'#536a43':'#7a8d55',heavy?7:4);}
    poly(c,[[-14,-19],[-19,-47],[-10,-70],[4,-82],[18,-63],[19,-36],[10,-17]],heavy?'#63774c':'#80935e');
    poly(c,[[-14,-19],[-19,-47],[-10,-70],[1,-69],[0,-21]],'#b2b97b',null);
    for(let i=0;i<(b?10:7);i++){const a=i*TAU/(b?10:7);leaf(c,Math.sin(a)*12,-55+Math.cos(a)*10,a+(Math.sin(t*2+i)*.1),heavy?29:24,i%2?'#809d66':'#b8bf7f');}
    if(heavy){poly(c,[[-23,-48],[-12,-73],[13,-73],[27,-51],[13,-35],[-9,-33]],'#697752');poly(c,[[-12,-57],[13,-59],[7,-43],[-7,-42]],'#263e36');}
    else {poly(c,[[-17,-58],[0,-77],[20,-58],[11,-40],[-6,-38]],'#d5b2a1');poly(c,[[-10,-56],[1,-68],[12,-54],[6,-45],[-4,-44]],'#4f4050');}
    for(let i=0;i<3;i++)poly(c,[[-8+i*7,-58],[-5+i*7,-50],[-2+i*7,-60]],'#efe1b5',null);
    for(const s of [-1,1]){line(c,[[s*12,-36],[s*(31+attack*9),-48-step*2],[s*37,-68]],'#698557',4);leaf(c,s*37,-68,s*.7,17,'#b2bc7a');}
    if(ranged||b){orb(c,0,-55,5+attack*3,'#b7dba4');for(let i=0;i<3;i++)leaf(c,-20+i*21,-81-Math.sin(t*2+i)*3,i-1,17,'#d6b6bb');}
    if(b){leaf(c,0,-79,0,32,'#d5d6a3');gem(c,0,-67,6,'#f0db9e');}
  }
  function evil(c,k,b,t,step,attack,back) {
    const heavy=k==='heavy', ranged=k==='archer', swift=k==='assassin', bob=Math.sin(t*3)*3;
    c.translate(0,bob-7);
    if(swift){blade(c,-9,-28,-.45-attack*.6,1.2);blade(c,16,-39,.6+attack*.6,.9);line(c,[[-3,-42],[-14,-15],[0,-6],[13,-23]],'#bb8a8a',1.2);return;}
    // Suspended many-sided reliquary: no legs, separated orbiting shards.
    const w=heavy?26:19;
    poly(c,[[-w,-61],[0,-82],[w,-61],[w-3,-24],[0,-12],[-w+3,-24]],'#707c7e');
    poly(c,[[-w,-61],[0,-82],[0,-18],[-w+3,-24]],'#a5a995');
    poly(c,[[0,-82],[w,-61],[w-3,-24],[0,-12]],'#475b64');
    poly(c,[[-w,-61],[0,-71],[w,-61],[0,-50]],'#b8aa7c');
    poly(c,[[-10,-49],[0,-57],[11,-48],[8,-31],[0,-26],[-8,-32]],'#2b3640');
    gem(c,0,-42,8+attack*2,'#dd9b91');
    for(const s of [-1,1]){poly(c,[[s*(w+7),-58],[s*(w+18),-47],[s*(w+13),-24],[s*(w+5),-33]],'#8d9284');line(c,[[s*w,-53],[s*(w+7),-48]],'#c2ab76',1.6);}
    for(let i=0;i<3;i++){const x=(i-1)*13;poly(c,[[x-4,-8],[x+4,-8],[x+2,-1+Math.sin(t*3+i)*3],[x,-3],[x-3,3+Math.sin(t*3+i)*3]],'#a56c62');}
    if(ranged){for(let i=0;i<3;i++){const a=t*.8+i*TAU/3;gem(c,Math.cos(a)*33,-52+Math.sin(a)*13,5,'#d8a99e');}}
    if(heavy||b)for(const s of [-1,1])blade(c,s*37,-16,s*(.2+attack*.4),b?1.1:.8);
    if(b){poly(c,[[-23,-72],[-28,-100],[-12,-86],[0,-109],[12,-86],[28,-100],[23,-72]],'#b9a674');line(c,[[-17,-75],[0,-86],[17,-75]],'#eee0a6',1.4);}
  }
  function ghost(c,k,b,t,step,attack,back) {
    const heavy=k==='heavy', swift=k==='assassin', ranged=k==='archer', w=heavy?29:19;
    c.translate(0,-4+Math.sin(t*2.6)*3);
    // Tapering suspended flame with irregular ribbons, not a robed human body.
    c.save();c.globalAlpha*=.34;poly(c,[[-w-4,-27],[-w-10,-54],[-14,-83],[0,-101],[7,-84],[w+9,-64],[w+3,-31],[15,-14],[0,3],[-9,-13]],'#98c6bd',null);c.restore();
    poly(c,[[-w,-37],[-w+4,-63],[-9,-79],[2,-91],[8,-73],[w,-61],[w+3,-38],[12,-19],[8,-4],[0,-13],[-7,0],[-12,-23]],'#79a8a2','#426c70',1);
    poly(c,[[-w,-37],[-w+4,-63],[-9,-79],[2,-91],[-3,-62],[-11,-41],[-7,-17]],'#bdd6bb',null);
    poly(c,[[-12,-62],[0,-72],[14,-61],[10,-44],[0,-37],[-10,-45]],'#ced9bc');
    poly(c,[[-10,-57],[-2,-54],[-5,-49],[-10,-50]],'#375960',null);poly(c,[[3,-54],[12,-57],[11,-50],[6,-49]],'#375960',null);poly(c,[[-3,-46],[4,-46],[1,-40]],'#426871',null);
    for(const s of [-1,1]){poly(c,[[s*13,-43],[s*(29+attack*7),-53],[s*40,-40+step*2],[s*28,-45],[s*22,-26],[s*20,-43]],'#83b3aa');}
    if(ranged||b)for(let i=0;i<3;i++){const a=t+i*TAU/3,x=Math.cos(a)*32,y=-53+Math.sin(a)*20;orb(c,x,y,4,'#c4e0bd');poly(c,[[x-3,y],[x,y+13],[x+3,y]],'#82b6af',null);}
    if(swift){line(c,[[-15,-38],[-33,-20],[-47,-18]],'#b9dad0',2);line(c,[[-7,-21],[-26,-5],[-41,-3]],'#80ada8',2);}
    if(heavy||b){for(const s of [-1,1])poly(c,[[s*9,-70],[s*25,-87],[s*22,-61],[s*16,-54]],'#bccbb1');}
    if(b){poly(c,[[-20,-74],[-19,-97],[-8,-87],[0,-107],[9,-87],[20,-97],[20,-74]],'#d3d9b4');gem(c,0,-62,4,'#dcb5b0');}
  }
  // Species are visual identities, independent of the combat archetype.
  const skins=Object.freeze({
    beast:Object.freeze([{id:'beast-wolf',name:'霜鬃狼'},{id:'beast-ape',name:'铁臂猿'},{id:'beast-pangolin',name:'岩甲穿山兽'},{id:'beast-horn',name:'双角狰'}].map(Object.freeze)),
    yao:Object.freeze([{id:'yao-flower',name:'噬灵花'},{id:'yao-fox',name:'三尾妖狐'},{id:'yao-mantis',name:'碧镰螳妖'},{id:'yao-mushroom',name:'赤伞菌妖'}].map(Object.freeze)),
    evil:Object.freeze([{id:'evil-idol',name:'碎面邪像'},{id:'evil-blades',name:'双刃剑煞'},{id:'evil-eye',name:'悬瞳邪眼'},{id:'evil-puppet',name:'缚咒木偶'}].map(Object.freeze)),
    ghost:Object.freeze([{id:'ghost-wisp',name:'寒魄幽魂'},{id:'ghost-lantern',name:'青火灯鬼'},{id:'ghost-armor',name:'无首甲魂'},{id:'ghost-banner',name:'招魂幡灵'}].map(Object.freeze))
  });
  function skinFor(family,floor=1,slot=0){const list=skins[aliases[family]];if(!list)return null;const f=Number.isFinite(floor)?Math.max(1,Math.floor(floor)):1,s=Number.isFinite(slot)?Math.max(0,Math.floor(slot)):0;return list[(s+Math.floor(s/4)+Math.floor((f-1)/4))%list.length];}
  function wolf(c,t,s,a,back){
    poly(c,[[-22,-29],[-48,-40],[-60,-29],[-42,-26],[-26,-16]],'#c6d7cb');
    for(const x of [-21,17])for(const far of [true,false]){const d=s*(far?-4:4);poly(c,[[x,-25],[x+7,-21],[x+3+d,-5],[x+12+d,0],[x-3+d,0],[x-4,-13]],far?'#405d67':'#809eaa');}
    poly(c,[[-32,-31],[-20,-47],[13,-44],[31,-31],[20,-19],[-21,-21]],'#809eaa');poly(c,[[-25,-36],[-18,-49],[11,-46],[20,-33]],'#c6d7cb');
    c.translate(a*5,-a*2);poly(c,[[11,-36],[11,-65],[23,-57],[34,-67],[36,-45],[53,-34],[39,-26],[23,-28]],'#a9c3c3');poly(c,[[13,-58],[13,-78],[24,-59]],'#d5dfcc');poly(c,[[30,-58],[38,-77],[37,-48]],'#617f8e');poly(c,[[43,-39],[57,-35],[51,-30]],'#334d5a');eye(c,33,-45,'#e9e1ac',back);
  }
  function ape(c,t,s,a,back){
    for(const x of [-13,12])poly(c,[[x-8,-25],[x+8,-25],[x+9+s*2,-5],[x+17+s*2,1],[x-9,1]],'#645f67');
    poly(c,[[-25,-55],[-14,-69],[16,-68],[29,-53],[19,-21],[-17,-21]],'#776e75');poly(c,[[-18,-52],[0,-60],[19,-51],[11,-29],[-10,-29]],'#b9a999');
    for(const q of [-1,1]){poly(c,[[q*20,-59],[q*35,-54],[q*(44+a*7),-18+s*q*3],[q*(34+a*7),-8],[q*25,-18],[q*25,-37]],'#837980');poly(c,[[q*35,-30],[q*46,-22],[q*45,-9],[q*31,-8],[q*28,-18]],'#c4b9a2');}
    poly(c,[[-16,-67],[-18,-83],[-8,-92],[12,-91],[22,-77],[16,-64]],'#5e5c67');poly(c,[[-11,-80],[12,-83],[15,-68],[-7,-66]],'#b8b09c');eye(c,8,-77,'#efe2ad',back);line(c,[[-6,-70],[9,-70]],'#564d53',2);
  }
  function pangolin(c,t,s,a,back){
    poly(c,[[-21,-23],[-49,-19],[-64,-7],[-45,-9],[-17,-12]],'#9b977d');
    for(const x of [-23,18])poly(c,[[x,-22],[x+10,-19],[x+13+s*2,-1],[x-3+s*2,0]],'#615f59');
    poly(c,[[-37,-22],[-30,-43],[-10,-58],[14,-58],[32,-39],[34,-18]],'#9c9f86');
    for(let r=0;r<3;r++)for(let i=0;i<3;i++){const x=-25+i*17+r*4,y=-29-r*10;poly(c,[[x-9,y],[x,y-14],[x+12,y-2],[x+5,y+10]],(r+i)%2?'#b9b99c':'#7f8a78');}
    poly(c,[[21,-31],[36,-35],[53+a*5,-15],[37,-12],[24,-17]],'#b8b69b');eye(c,37,-25,'#edd8a0',back);poly(c,[[49,-20],[57,-14],[50,-12]],'#424e49');
  }
  function mantis(c,t,s,a,back){
    poly(c,[[-11,-38],[-20,-54],[-8,-74],[5,-61],[8,-36]],'#78a284');poly(c,[[-10,-35],[0,-13],[12,-38],[7,-61]],'#b4c791');
    for(const q of [-1,1]){line(c,[[q*5,-35],[q*22,-19],[q*(36+s*2),0]],'#6e8e72',4);line(c,[[q*6,-48],[q*30,-44],[q*40,-24]],'#8baa7c',3);poly(c,[[q*10,-58],[q*(32+a*7),-80],[q*42,-70],[q*27,-42],[q*30,-66],[q*20,-53]],'#c8d4a7');}
    poly(c,[[-19,-77],[19,-77],[6,-62],[-7,-63]],'#a9c195');orb(c,-12,-75,4,'#e4d8a7');orb(c,12,-75,4,'#e4d8a7');line(c,[[-6,-79],[-13,-91]],'#789b80',1.5);line(c,[[6,-79],[15,-91]],'#789b80',1.5);
  }
  function mushroom(c,t,s,a,back){
    for(const q of [-1,1])poly(c,[[q*7,-20],[q*18,-9],[q*(24+s*2),0],[q*5,-2]],'#b2b18c');
    poly(c,[[-13,-58],[14,-58],[11,-29],[23,-17],[11,-8],[-11,-12],[-21,-23],[-9,-36]],'#d0c6a1');
    poly(c,[[-39,-55],[-29,-73],[-10,-87],[13,-84],[33,-68],[40,-52],[15,-43],[-17,-44]],'#a96770');poly(c,[[-39,-55],[-17,-51],[18,-50],[40,-52],[15,-43],[-17,-44]],'#e3c4ae');poly(c,[[-25,-67],[-13,-78],[-7,-66]],'#deb6a1');poly(c,[[6,-74],[17,-72],[21,-60],[8,-61]],'#d8b59e');eye(c,3,-35,'#5d5859',back);
    for(const q of [-1,1])line(c,[[q*10,-29],[q*(26+a*9),-38]],'#b8b48e',5);
  }
  function evilEye(c,t,s,a,back){
    c.translate(0,Math.sin(t*3)*3-9);for(const q of [-1,1])poly(c,[[q*16,-43],[q*31,-66],[q*43,-56],[q*50,-31],[q*35,-42],[q*28,-24]],'#72758c');
    poly(c,[[-29,-45],[-15,-69],[9,-73],[30,-54],[31,-32],[10,-16],[-14,-20]],'#8c7f8e');poly(c,[[-26,-45],[-8,-57],[13,-57],[28,-44],[12,-31],[-8,-31]],'#e2c5ad');orb(c,2+a*3,-44,11,'#b67893');orb(c,3+a*3,-44,5,'#303f53');orb(c,6,-48,2,'#f1e5c8');
    for(let i=0;i<3;i++)line(c,[[-10+i*10,-19],[-17+i*12,-8],[i*13-15,1]],'#aa8395',3);
  }
  function puppet(c,t,s,a,back){
    for(const q of [-1,1]){line(c,[[q*9,-29],[q*(17+s*2),-16],[q*14,0]],'#ad9682',7);orb(c,q*16,-16,4,'#454957');line(c,[[q*14,-63],[q*29,-46],[q*(37+a*10),-24]],'#ad9682',6);orb(c,q*29,-46,4,'#454957');}
    poly(c,[[-15,-63],[16,-63],[10,-29],[-11,-28]],'#836b73');poly(c,[[-9,-56],[9,-56],[5,-34],[-6,-34]],'#d1b695');
    poly(c,[[-13,-86],[10,-91],[18,-76],[10,-65],[-12,-68]],'#c1a68d');line(c,[[-8,-79],[-2,-77]],'#4e4655',2);line(c,[[6,-79],[12,-82]],'#4e4655',2);line(c,[[-8,-70],[8,-72]],'#4e4655',2);poly(c,[[-4,-91],[6,-92],[7,-66],[-3,-64]],'#ccbb86');line(c,[[0,-86],[3,-82],[0,-78],[4,-73]],'#906461',1.4);
  }
  function lantern(c,t,s,a,back){
    c.translate(0,Math.sin(t*3)*3);line(c,[[-10,-79],[-8,-91],[8,-91],[10,-79]],'#9eaf99',3);
    poly(c,[[-17,-78],[17,-78],[27,-61],[24,-36],[12,-25],[-13,-25],[-25,-38],[-27,-61]],'#536c73');poly(c,[[-14,-72],[14,-72],[19,-58],[15,-37],[-15,-37],[-19,-58]],'#b7ccae');poly(c,[[-5,-39],[-11,-51],[0,-69],[3,-56],[11,-48],[6,-39]],'#5d9992');poly(c,[[-18,-79],[18,-79],[23,-73],[-23,-73]],'#adc0aa');line(c,[[0,-26],[0,-13]],'#bcbb92',3);poly(c,[[-6,-17],[6,-17],[9,0],[0,-5],[-7,0]],'#82a99f');
    for(const q of [-1,1])line(c,[[q*24,-57],[q*(36+a*6),-48],[q*39,-27]],'#88ada4',2);
  }
  function armor(c,t,s,a,back){
    for(const q of [-1,1]){poly(c,[[q*4,-26],[q*17,-28],[q*20,-7+s*q*2],[q*7,-4+s*q*2]],'#82959b');poly(c,[[q*15,-62],[q*31,-58],[q*33,-44],[q*20,-39]],'#a8b9ae');poly(c,[[q*25,-42],[q*35,-39],[q*(37+a*8),-21],[q*27,-19]],'#647e89');}
    poly(c,[[-19,-60],[18,-60],[24,-37],[14,-23],[-15,-24],[-24,-37]],'#81969a');poly(c,[[-15,-53],[0,-59],[15,-53],[11,-36],[0,-29],[-12,-37]],'#b2c0ac');line(c,[[-15,-35],[15,-35]],'#435e6c',3);poly(c,[[-17,-26],[18,-26],[25,-9],[8,-12],[0,-7],[-23,-10]],'#536d7b');
    // Empty neck aperture and a tiny free flame: deliberately no head.
    poly(c,[[-11,-62],[0,-67],[12,-62],[5,-57],[-7,-57]],'#2d4958');poly(c,[[-4,-67],[-7,-75],[0,-88],[3,-77],[7,-71],[2,-66]],'#afd5bb',null);
  }
  function banner(c,t,s,a,back){
    const sway=Math.sin(t*2)*3;line(c,[[0,-1],[0,-95]],'#a8a585',4);line(c,[[-24,-89],[25,-89]],'#c6c4a2',3);gem(c,0,-99,5,'#d7d5af');
    poly(c,[[-21,-86],[23,-86],[24+sway,-63],[18+sway,-44],[25+sway,-21],[10,-27],[3,-14],[-6,-29],[-18,-20],[-15,-49]],'#98b8ad');poly(c,[[-13,-81],[14,-81],[11+sway,-51],[14,-36],[4,-42],[-5,-34],[-9,-52]],'#d0d7b7');line(c,[[-5,-72],[6,-72],[1,-65],[9,-61],[-6,-57],[3,-51]],'#537b7e',3);for(const q of [-1,1])line(c,[[q*22,-88],[q*31,-64],[q*(34+a*6),-48]],'#7fa49f',2);
  }
  const speciesPainters={
    'beast-wolf':wolf,'beast-ape':ape,'beast-pangolin':pangolin,'beast-horn':(c,t,s,a,b)=>beast(c,'grunt',false,t,s,a,b),
    'yao-flower':(c,t,s,a,b)=>yao(c,'grunt',false,t,s,a,b),'yao-fox':(c,t,s,a,b)=>yao(c,'assassin',false,t,s,a,b),'yao-mantis':mantis,'yao-mushroom':mushroom,
    'evil-idol':(c,t,s,a,b)=>evil(c,'grunt',false,t,s,a,b),'evil-blades':(c,t,s,a,b)=>evil(c,'assassin',false,t,s,a,b),'evil-eye':evilEye,'evil-puppet':puppet,
    'ghost-wisp':(c,t,s,a,b)=>ghost(c,'grunt',false,t,s,a,b),'ghost-lantern':lantern,'ghost-armor':armor,'ghost-banner':banner
  };

  const renderers={beast,yao,evil,ghost};
  function draw(c,e,time=0) {
    const family=aliases[e.towerFamily]; if(!family)return false;
    const k=e.towerArchetype||e.kind||'melee', boss=!!(e.boss||e.towerGuardian), t=Number.isFinite(time)?time:0;
    const seed=Number.isFinite(e.seed)?e.seed:0, moving=!e.dead && !(e.action>0) && !(e.stun>0);
    const step=moving?Math.sin(t*(k==='assassin'?13:9)+seed):0, attack=e.action>0?Math.sin(clamp(e.action)*Math.PI)*.9:0;
    const scale=boss?1.55:e.captain?1.2:k==='heavy'?1.08:.92;
    c.save();
    if(e.dead)c.globalAlpha*=clamp(1-(t-(Number.isFinite(e.deathTime)?e.deathTime:t))/.36);
    else if(e.spawn>0)c.globalAlpha*=clamp(1-e.spawn/.8);
    c.translate(Number.isFinite(e.x)?e.x:0,Number.isFinite(e.y)?e.y:0);
    c.scale(Math.cos(e.dir||0)<-.1?-scale:scale,scale);
    if(e.dead){const f=clamp((t-(Number.isFinite(e.deathTime)?e.deathTime:t))/.36);c.scale(1+f*.2,1-f*.55);}
    c.translate(attack*3,moving?Math.abs(step)*1.1:0);
    const skin=skins[family].find(v=>v.id===e.towerSkin)||skinFor(family,e.towerFloor,e.towerSlot??Math.floor(seed));
    if(boss)renderers[family](c,k,true,t,step,attack,Math.sin(e.dir||0)<-.35);
    else {
      c.save();speciesPainters[skin.id](c,t,step,attack,Math.sin(e.dir||0)<-.35);c.restore();
      // Sparse role marks preserve the independent species silhouette and floor tells.
      if(k==='archer'){gem(c,25,-72,4,'#e2d8aa');line(c,[[21,-72],[17,-65]],'#c7d0b1',1);}
      if(k==='heavy')poly(c,[[-8,-33],[0,-39],[8,-33],[5,-24],[-5,-24]],'#b4b5a0','#475a5d',1);
      if(e.captain||k==='elite')gem(c,0,-110,5,'#e5cc88');
    }
    if(e.hit>0&&!e.dead){c.save();c.globalAlpha*=clamp(e.hit/.13)*.65;line(c,[[-14,-58],[0,-68],[15,-58]],'#fff3c4',2.3);c.restore();}
    c.restore();return true;
  }
  window.TowerArt=Object.freeze({draw,skinFor,skins,families:Object.freeze(Object.keys(renderers))});
})();
