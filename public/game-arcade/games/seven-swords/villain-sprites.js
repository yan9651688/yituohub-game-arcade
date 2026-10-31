/* Principal antagonists: articulated Canvas actors, never standing-PNG billboards.
 * Positions, hitboxes, timings and AI belong to combat.js; this layer is art only. */
(() => {
  'use strict';
  const TAU=Math.PI*2, INK='#302c38', paths=new Map();
  const identities={黑心虎:'heixinhu',黑小虎:'heixiaohu',猪无戒:'zhuwujie',牛旋风:'niuxuanfeng',马三娘:'masanniang'};
  const designs={
    heixinhu:{name:'黑心虎',fur:'#b9582c',light:'#f1c78b',shade:'#843a2a',cloth:'#795098',dark:'#3a285a',trim:'#dbb346',cape:'#8b328f',w:30,head:25},
    heixiaohu:{name:'黑小虎',fur:'#d69248',light:'#ffdda0',shade:'#a2592c',cloth:'#7374c1',dark:'#34416f',trim:'#e6b647',cape:'#823a4b',w:22,head:22},
    zhuwujie:{name:'猪无戒',fur:'#e3aa8e',light:'#f9d2ac',shade:'#ad7765',cloth:'#995ea6',dark:'#4e407c',trim:'#b62f3e',cape:'#384d3e',w:31,head:24},
    niuxuanfeng:{name:'牛旋风',fur:'#65a4c4',light:'#7dbbd1',shade:'#3e7297',cloth:'#332b3a',dark:'#482830',trim:'#e4b14f',cape:'#72508d',w:33,head:25}
  };
  class Brush{
    constructor(c){this.c=c;this.materials=new Map();}
    color(fill){if(!/^#[a-f0-9]{6}$/i.test(fill))return fill;let g=this.materials.get(fill);if(!g){const n=parseInt(fill.slice(1),16),r=n>>16,b=n&255,v=(n>>8)&255;const rgb=(k,a)=>`rgb(${Math.min(255,Math.round(r*k+a))},${Math.min(255,Math.round(v*k+a))},${Math.min(255,Math.round(b*k+a))})`;g=this.c.createLinearGradient(-35,-150,32,0);g.addColorStop(0,rgb(1,20));g.addColorStop(.48,fill);g.addColorStop(1,rgb(.79,0));this.materials.set(fill,g);}return g;}
    path(d,fill,stroke=INK,width=1.2){let p=paths.get(d);if(!p){p=new Path2D(d);if(paths.size<700)paths.set(d,p);}const c=this.c;if(fill){c.fillStyle=this.color(fill);c.fill(p);}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(p);}}
    ellipse(x,y,rx,ry,fill,stroke=null,width=1){const c=this.c;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
    group(x,y,r,sx,sy,fn){const c=this.c;c.save();c.translate(x,y);c.rotate(r);c.scale(sx,sy);fn();c.restore();}
    line(d,color,width=1.2){this.path(d,null,color,width);}
  }
  function palm(p,d,cast){
    p.path('M-5 2L-8 -6Q-12 -13 -9 -14L-4 -8L-5 -21Q-4 -25 -2 -21L0 -11L1 -25Q3 -28 4 -23L4 -11L7 -23Q10 -25 10 -21L8 -9L12 -17Q15 -19 15 -15L12 -1Q8 8 1 8Z',d.fur);
    p.line('M-2 0Q4 -5 9 -2',d.shade,1);
    if(cast)p.line('M-7 -18Q4 -32 16 -20M-13 -6Q-17 -22 -7 -29','#d0a2da',1.2);
  }
  function weapon(p,id,d){
    if(id==='zhuwujie'){
      p.line('M0 2Q-9 17 -2 28','#253744',3.2);
      p.ellipse(-2,40,14,14,'#293b5d',INK);p.ellipse(-2,40,5,5,'#4a9cb4');
      p.path('M-7 26L3 26L3 22L-7 22M-7 54L3 54L3 58L-7 58M-16 35L-20 36L-20 43L-16 45M12 35L16 36L16 43L12 45','#4c90a9');
    }else if(id==='niuxuanfeng'){
      p.line('M0 12L0 -58','#d59a3e',5);p.line('M1 7L1 -56','#f2d37a',1.4);
      p.path('M-3 -60L4 -60Q13 -53 25 -59Q29 -41 13 -31L3 -43L-3 -43Z','#2883b1');
      p.line('M25 -58Q28 -41 13 -32','#edf1df',3);p.ellipse(1,-52,2.5,2.5,d.trim);
    }
  }
  function head(p,id,d,back,look){
    const tiger=id==='heixinhu'||id==='heixiaohu',bull=id==='niuxuanfeng',pig=id==='zhuwujie';
    const w=d.head;
    // Ear and horn silhouettes remain readable when actors face away.
    if(tiger){for(const s of [-1,1]){p.ellipse(s*(w-4),-20,8,10,d.fur,INK);p.ellipse(s*(w-4),-21,4.5,5.5,'#694344');}}
    if(pig){p.path('M-17 -15Q-38 -31 -31 -7L-20 0M17 -15Q38 -31 31 -7L20 0',d.fur);p.path('M-22 -13L-29 -20L-27 -8M22 -13L29 -20L27 -8','#b47776',null);}
    if(bull){p.path('M-20 -18Q-39 -15 -37 -40Q-32 -25 -21 -29M20 -18Q39 -15 37 -40Q32 -25 21 -29', '#f3cd5e');p.path('M-20 -10Q-36 -21 -36 -7Q-29 3 -21 1M20 -10Q36 -21 36 -7Q29 3 21 1',d.fur);}
    p.path(`M-${w} -10Q-${w+3} -30 0 -31Q${w+3} -30 ${w} -10L${w-2} 8Q15 23 0 24Q-16 23 -${w-2} 8Z`,d.fur);
    if(back){if(tiger){p.line('M-18 -8L-9 -2M18 -8L9 -2',d.light,3);if(id==='heixinhu'){p.path('M-9 -29L-12 -73Q0 -82 12 -73L9 -29Z','#8d3592');p.line('M0 -76L0 -32','#b34a71',4);}else{p.path('M-9 -29L-12 -72L-6 -77L-2 -71L0 -37L5 -37L7 -73L12 -73L10 -30Z','#484bb9');p.line('M-3 -70L0 -40L6 -39L9 -69','#a3b6ec',2);}}return;}
    p.group(look,0,0,1,1,()=>{
      if(tiger){
        p.path('M-23 1L-14 -4L-9 3Q0 -5 9 3L15 -4L23 1L20 12Q10 24 0 22Q-13 23 -21 12Z',d.light);
        p.path('M-21 -16L-10 -10L-21 -9M21 -16L10 -10L21 -9M-24 -1L-14 3L-24 5M24 -1L14 3L24 5M-5 -29L0 -18L5 -29Z',d.light,null);
        
      }else if(bull){
        p.path('M-19 1Q0 -7 19 1L23 16Q15 28 0 27Q-18 27 -23 15Z',d.light);
        p.line('M-15 -24Q-10 -31 -6 -25M6 -25Q10 -31 15 -24',d.shade,2);
      }else{
        p.ellipse(0,9,16,12,d.light,INK);p.ellipse(-6,8,3,4,d.shade);p.ellipse(6,8,3,4,d.shade);
        p.line('M-6 23Q0 26 6 23','#9a5b56',1.4);
      }
      for(const s of [-1,1]){
        p.path(`M${s*5} -6Q${s*12} -10 ${s*18} -6L${s*16} -1L${s*7} -1Z`,'#fff4d6');
        p.ellipse(s*11,-4,2.1,3.1,id==='heixinhu'?'#a52e3d':'#48352d');
        p.line(`M${s*5} -11L${s*19} -16`,INK,3);
      }
      if(!pig){p.path('M-5 8Q0 5 5 8L1 12L-1 12Z','#5b3f3c');p.line('M0 12L0 16M-9 17Q0 20 9 17','#694837',1);}
      if(bull){p.ellipse(-9,12,2,1.5,d.shade);p.ellipse(9,12,2,1.5,d.shade);p.ellipse(0,8,10,7,'#a92032',INK,1);p.line('M-11 21Q0 25 11 21',d.shade,1);}
      if(id==='heixinhu'){
        p.path('M-25 -4Q-36 -1 -30 10Q-15 24 0 23Q20 24 30 10Q35 -2 25 -4L14 3Q0 -2 -14 3Z',d.light);
        p.ellipse(0,7,6,3.5,'#3d282b');p.line('M-17 17Q0 22 17 17','#7c4936',1.3);
        p.path('M-9 -29L-12 -73Q0 -82 12 -73L9 -29Z','#8d3592');p.path('M-3 -77L2 -77L3 -32L-2 -32Z','#b34a71',null);p.line('M-12 -28L0 -14L12 -28',d.trim,2.5);
      }
      if(id==='heixiaohu'){p.path('M-10 -29L-7 -39L-9 -65Q-14 -72 -14 -62L-16 -61Q-19 -77 -9 -77L-2 -72L2 -30Z','#4245b1');p.path('M2 -31L6 -72Q12 -79 13 -69L10 -34L5 -27Z','#484bb9');p.line('M-3 -70L0 -40L6 -39L9 -69','#a3b6ec',2.5);}
      if(pig){p.line('M-18 -13Q-12 -19 -6 -12M6 -12Q12 -19 18 -13','#302a2a',4);}
    });
  }
  function paint(p,id,dir,t,o){
    const d=designs[id],state=o.state||'idle',phase=o.phase==null?(t*1.65)%1:o.phase;
    const step=state==='walk'?Math.sin(phase*TAU):0,action=['attack','cast'].includes(state)?Math.sin(Math.max(0,Math.min(1,phase))*Math.PI):0;
    const back=Math.sin(dir)<-.35,flip=Math.cos(dir)<-.15?-1:1,look=Math.cos(dir)*2.7,bob=Math.abs(step)*2+Math.sin(t*2.5)*.45,cloth=Math.sin(t*3)*2+step*3;
    p.group(0,-bob,Math.cos(dir)*action*.055,flip,1,()=>{
      // Separate cape, legs, torso, forearms and head: locomotion and attacks
      // deform the actor rather than translating a finished illustration.
      if(id==='heixinhu'||id==='heixiaohu'||id==='niuxuanfeng')p.group(0,-99,0,1,1,()=>{
        p.path(`M-24 1Q-40 18 -43 ${84+cloth}L-24 77L-9 86L7 77L25 85L43 ${83-cloth}Q38 20 23 1Z`,d.cape);
        p.line('M-23 11Q-25 43 -31 71M24 11Q24 45 32 73',id==='niuxuanfeng'?'#9d79b9':'#d77769',1);
      });
      for(const s of [-1,1])p.group(s*12,-29,-step*s*.14,1,1,()=>{
        if(id==='niuxuanfeng')p.path('M-10 -19L10 -19L10 14L-10 14Z','#e6dfc9');else p.path('M-7 -10L7 -10L6 23L-7 23Z',d.dark);p.path('M-7 13L7 14L10 22L16 25Q18 30 9 30L-10 29Z',id==='niuxuanfeng'?'#673c42':'#30333c');p.line('M-7 16L7 17',d.trim,2);
      });
      const w=d.w;
      if(id==='niuxuanfeng'){
        p.path('M-25 -103Q0 -111 25 -103L29 -76L27 -48Q0 -43 -27 -48L-29 -76Z',d.fur);
        p.path('M-27 -102L-13 -106L-15 -53L-29 -51L-30 -77ZM27 -102L13 -106L15 -53L29 -51L30 -77Z','#6b2633');
        p.line('M-13 -104L-15 -53L-28 -51M13 -104L15 -53L28 -51','#ce514c',2.3);
      }else p.path(`M-${w-7} -103Q0 -111 ${w-7} -103L${w} -76L${w+2+cloth*.25} -33Q0 -22 -${w+2-cloth*.25} -33L-${w} -76Z`,d.cloth);
      if(id==='heixinhu'){p.path(`M-22 -70L-36 ${-8+cloth*.2}Q0 2 36 ${-8-cloth*.2}L22 -70Z`,d.cloth);p.line('M-5 -65L-10 -5M9 -65L17 -5',d.dark,1.4);}
      if(!back&&id!=='niuxuanfeng'){
        p.path(`M-${w-8} -101L0 -84L${w-8} -101L13 -66L0 -61L-13 -66Z`,id==='heixiaohu'?'#e3d1a5':d.dark);
        p.line(`M-${w-8} -100L0 -82L${w-8} -100`,d.trim,2.6);
        p.line('M-15 -64L-19 -38M15 -64L19 -38',d.trim,1.1);
        if(id==='heixinhu'){p.path('M-25 -107L-40 -114L-31 -88L-8 -79L0 -88L8 -79L31 -88L40 -114L25 -107Z',d.cape);p.line('M-22 -96L0 -81L22 -96',d.trim,2);}
        if(id==='zhuwujie'){p.path('M-15 -103Q7 -112 23 -103L31 -79L18 -69Q-6 -70 -15 -103Z',d.fur);p.line('M-16 -102Q-6 -72 19 -69','#bf8ac7',3);}
        if(id==='niuxuanfeng'){p.path('M-9 -104L-7 -54L7 -54L9 -104Z',d.fur);p.line('M-10 -104L-9 -55M10 -104L9 -55','#c84948',2.5);}
      }else if(back) p.line('M0 -95Q6 -68 0 -38',d.trim,1.2);
      p.path(`M-${w} -53Q0 -48 ${w} -53L${w} -44Q0 -39 -${w} -44Z`,id==='niuxuanfeng'?'#d5a65b':d.dark);p.ellipse(0,-47,7,5,d.trim,INK);p.ellipse(0,-47,3,2,d.dark);
      const arm=s=>p.group(s*(w-3),-92,s*(.12+step*.18)+(s===1?-action*1.2:action*.25),1,1,()=>{
        p.path('M-9 -4Q0 -10 9 -2L11 26L7 36L-7 35L-11 20Z',id==='zhuwujie'||id==='niuxuanfeng'?d.fur:d.cloth);p.path('M-9 25L9 25L8 34L-8 34Z',id==='zhuwujie'?'#af2c3c':id==='heixiaohu'||id==='niuxuanfeng'?d.trim:d.dark);if(id==='zhuwujie')p.line('M-9 18L9 19M-9 22L9 23','#ae2f3c',3);p.line('M-8 28L8 28',d.trim,1.6);
        if(id==='heixinhu'){p.path('M-10 -2L-17 31L-10 45Q0 50 12 41L14 28L9 -2Z',d.cape);p.path('M-16 29L13 26L14 32L-14 36Z',d.trim);p.line('M-7 29L-5 33M2 28L3 32','#9c4b36',4);}
        p.group(0,38,action*(s===1?-.25:.2),1,1,()=>{
          if(id==='heixinhu'||id==='heixiaohu')p.group(0,0,action*-.3,1,1,()=>{if(action>.15)palm(p,d,state==='cast'&&action>.5);else{p.ellipse(0,0,6,8,d.fur,INK);p.line('M-3 -3L-3 2M0 -4L0 1M3 -3L3 2',d.shade,.8);}});
          else {p.ellipse(0,1,6,7,d.fur,INK);if(s===1||id==='niuxuanfeng'||id==='zhuwujie')weapon(p,id,d);}
        });
      });
      arm(-1);arm(1);
      if(id==='heixiaohu'){p.path('M-25 -100L-34 -92L-30 -80L-16 -86L-11 -101M25 -100L34 -92L30 -80L16 -86L11 -101',d.trim);p.path('M-18 -106L0 -100L18 -106L12 -90L0 -86L-12 -90Z',d.cape);p.line('M-18 -62L-23 -34L-2 -29L0 -62M18 -62L23 -34L2 -29L0 -62','#8db5dc',2);}
      if(id==='niuxuanfeng'){p.line('M-37 -94L-25 -97M25 -97L37 -94',d.trim,4);p.ellipse(-31,-95,1.3,1.3,'#fff0a4');p.ellipse(31,-95,1.3,1.3,'#fff0a4');}
      p.group(0,-128,Math.cos(dir)*action*.035,1,1,()=>head(p,id,d,back,look*flip));
    });
  }
  function resolve(name,kind){return identities[name]||({blackheart:'heixinhu',tiger:'heixiaohu',boar:'zhuwujie',bull:'niuxuanfeng',masanniang:'masanniang'})[kind]||null;}
  function draw(ctx,id,x,y,size=140,dir=Math.PI/2,t=0,options={}){
    if(id==='masanniang'&&window.SevenFinale?.drawMaSanniang){window.SevenFinale.drawMaSanniang(ctx,x,y,size,dir,t,options);return true;}
    if(!designs[id])return false;
    ctx.save();ctx.translate(x,y);ctx.scale(size/(['heixiaohu','heixinhu'].includes(id)?205:170),size/(['heixiaohu','heixinhu'].includes(id)?205:170));ctx.lineCap='round';ctx.lineJoin='round';paint(new Brush(ctx),id,dir,t,options);ctx.restore();return true;
  }
  window.SevenVillainArt=Object.freeze({version:'11.5',identities:Object.freeze(identities),designs:Object.freeze(designs),resolve,draw});
  window.GameArt.drawVillain=draw;
})();
