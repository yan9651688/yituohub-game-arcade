/* Seven Swords · articulated vector character system. */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const INK = '#304438';
  let svgSerial = 0;
  const pathCache = new Map();
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const mix = (a,b,t) => a+(b-a)*t;
  const smooth = (a,b,x) => {const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
  const esc = s => String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const material = (a,b,box=[-30,-40,30,40]) => ({a,b,box});

  class SVGBrush {
    constructor(){this.parts=[];this.defs=[];this.gradients=new Map();this.prefix='qsp'+(++svgSerial)+'_';}
    color(c){
      if(typeof c==='string'||!c)return c||'none';
      const key=JSON.stringify(c);let id=this.gradients.get(key);
      if(!id){id=this.prefix+'g'+this.gradients.size;this.gradients.set(key,id);const [x1,y1,x2,y2]=c.box;this.defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop stop-color="${c.a}"/><stop offset="1" stop-color="${c.b}"/></linearGradient>`);}
      return 'url(#'+id+')';
    }
    path(d,fill,stroke=INK,width=1.3){this.parts.push(`<path d="${d}" fill="${this.color(fill)}" stroke="${this.color(stroke)}" stroke-width="${width}"/>`);}
    ellipse(x,y,rx,ry,fill,stroke=null,width=1){this.parts.push(`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${this.color(fill)}" stroke="${this.color(stroke)}" stroke-width="${width}"/>`);}
    line(d,color=INK,width=1.3){this.path(d,null,color,width);}
    group(x,y,angle,sx,sy,fn){this.parts.push(`<g transform="translate(${x} ${y}) rotate(${angle*180/Math.PI}) scale(${sx} ${sy})">`);fn();this.parts.push('</g>');}
    alpha(a,fn){this.parts.push(`<g opacity="${a}">`);fn();this.parts.push('</g>');}
    finish(options,id){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 ${options.portrait?240:360}" class="${esc(options.className)}" data-view="${Number.isFinite(options.direction)?'chosen':'front'}" role="img" aria-label="${esc(id)}${Number.isFinite(options.direction)?'':'正面'}${options.portrait?'头像':'精绘侠士'}"><defs>${this.defs.join('')}</defs><g stroke-linejoin="round" stroke-linecap="round">${this.parts.join('')}</g></svg>`;}
  }
  class CanvasBrush {
    constructor(ctx){this.ctx=ctx;}
    color(c){if(typeof c==='string'||!c)return c;const [x1,y1,x2,y2]=c.box;const g=this.ctx.createLinearGradient(x1,y1,x2,y2);g.addColorStop(0,c.a);g.addColorStop(1,c.b);return g;}
    path(d,fill,stroke=INK,width=1.3){
      let path=pathCache.get(d);
      if(!path){path=new Path2D(d);if(pathCache.size<2200)pathCache.set(d,path);}
      const c=this.ctx;
      if(fill){c.fillStyle=this.color(fill);c.fill(path);}
      if(stroke&&width){c.strokeStyle=this.color(stroke);c.lineWidth=width;c.stroke(path);}
    }
    ellipse(x,y,rx,ry,fill,stroke=null,width=1){const c=this.ctx;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);if(fill){c.fillStyle=this.color(fill);c.fill();}if(stroke&&width){c.strokeStyle=this.color(stroke);c.lineWidth=width;c.stroke();}}
    line(d,color=INK,width=1.3){this.path(d,null,color,width);}
    group(x,y,angle,sx,sy,fn){const c=this.ctx;c.save();c.translate(x,y);c.rotate(angle);c.scale(sx,sy);fn();c.restore();}
    alpha(a,fn){const c=this.ctx;c.save();c.globalAlpha*=a;fn();c.restore();}
  }

  function motion(dir,t,options={}) {
    const q=Math.round(dir/(Math.PI/4))*(Math.PI/4);
    const dx=Math.cos(q),dy=Math.sin(q),profile=Math.abs(dx),back=dy<-.25;
    const state=options.state||'idle';
    const phase=options.phase===undefined?(t*(state==='walk'?1.8:.6)%1):clamp(options.phase,0,1);
    const step=state==='walk'?Math.sin(phase*TAU):0;
    const action=state==='attack'?Math.sin(Math.PI*phase):0;
    const cast=state==='cast'?Math.sin(Math.PI*phase):0;
    const air=clamp(options.air||0,0,1);
    const dash=state==='dash'?1:air;
    return {q,dx,dy,profile,back,state,phase,step,action,cast,dash,air,social:state==='social',
      cross:(dy<-.25?-1:1)*(.38+.62*Math.abs(dy)),
      lean:dx*(action*.07+dash*.13),
      bob:state==='walk'?Math.abs(step)*2.7:Math.sin(t*2.8)*.5,
      cloth:Math.sin(t*2.5)*2.2+step*3.5+dx*dash*13};
  }

  const HEROES = {
    hongmao:{name:'虹猫',kind:'cat',w:31,hip:16,head:36,robe:93,fur:'#ee923f',furHi:'#ffd28a',furShade:'#cb662c',face:'#fff1d6',cloth:'#faf5e9',clothShade:'#bccbd2',lining:'#759ab1',trim:'#5e839b',belt:'#456d88',armor:'#3c505d',gold:'#c3aa72',gem:'#8ac8d5',eye:'#2f738e',blade:'#ea7041',boot:'#45525a',hand:-1},
    lantu:{name:'蓝兔',kind:'rabbit',w:25,hip:13,head:33,robe:122,fur:'#83bdd8',furHi:'#c6e9ee',furShade:'#5c92bf',face:'#fff1ee',cloth:'#f3d2e6',clothShade:'#b8a1ce',lining:'#93aecb',trim:'#a275a7',belt:'#80618e',armor:'#817899',gold:'#c6b891',gem:'#bdecef',eye:'#6466a4',blade:'#8addea',boot:'#9487ad',hand:-1},
    sali:{name:'莎丽',kind:'squirrel',w:26,hip:14,head:33,robe:107,fur:'#bf83b1',furHi:'#e4b2d2',furShade:'#8d5a85',face:'#ffe6e7',cloth:'#ba95c7',clothShade:'#79628e',lining:'#ecd0df',trim:'#a276aa',belt:'#57405f',armor:'#544558',gold:'#b9a07c',gem:'#d6a7d5',eye:'#905685',blade:'#b989df',boot:'#554653',hand:1},
    doudou:{name:'逗逗',kind:'dog',w:33,hip:18,head:35,robe:82,fur:'#bd8a53',furHi:'#e6bb83',furShade:'#906138',face:'#f5d8ab',cloth:'#a0ad86',clothShade:'#63795e',lining:'#eee3ca',trim:'#647d62',belt:'#775c3b',armor:'#506148',gold:'#b8a16c',gem:'#8fc291',eye:'#827132',blade:'#88c698',boot:'#52664f',hand:-1},
    daben:{name:'大奔',kind:'bear',w:46,hip:24,head:42,robe:72,fur:'#f3eddf',furHi:'#fffbee',furShade:'#c2c5b9',face:'#eee2c7',cloth:'#6391a8',clothShade:'#345b75',lining:'#e5e6d6',trim:'#acbdb7',belt:'#993f2e',armor:'#394951',gold:'#bf9c61',gem:'#dda963',eye:'#5e5742',blade:'#daba66',boot:'#394650',hand:-1},
    tiaotiao:{name:'跳跳',kind:'monkey',w:28,hip:16,head:33,robe:77,fur:'#a77443',furHi:'#d7ab79',furShade:'#835531',face:'#efd2a3',cloth:'#97a375',clothShade:'#566a4c',lining:'#e3d6ad',trim:'#577760',belt:'#3a6957',armor:'#524f38',gold:'#bca365',gem:'#a9d18b',eye:'#86582d',blade:'#68c892',boot:'#4d5944',hand:-1},
    dada:{name:'达达',kind:'panda',w:31,hip:17,head:37,robe:128,fur:'#f8f4e8',furHi:'#ffffff',furShade:'#c6d3c7',face:'#fff8e9',cloth:'#f6f3e2',clothShade:'#bccfbf',lining:'#72968b',trim:'#668b77',belt:'#3d7365',armor:'#34574c',gold:'#bdaf7d',gem:'#9dcbbd',eye:'#4d765e',blade:'#b4dbb6',boot:'#364b3f',hand:-1}
  };

  function ornament(p,c,x,y,scale=1,kind='cloud') {
    p.group(x,y,0,scale,scale,()=>{
      if(kind==='bamboo'){
        p.line('M-4 18Q-2 0 1 -22M1 -11L12 -21M-1 1L-14 -9',c.trim,1.1);
        p.path('M2 -14Q1 -27 8 -31Q11 -21 2 -14M8 -16Q20 -28 24 -20Q16 -12 8 -16M-2 -1Q-13 -16 -19 -13Q-17 -4 -2 -1M-8 -7Q-14 -23 -7 -22Q-2 -16 -8 -7M-3 9Q10 -1 15 5Q9 11 -3 9',c.trim,null);
        p.line('M-4 7h5M-2 -4h4M0 -15h3',c.cloth,1);
      } else if(kind==='flower') {
        [-90,-18,54,126,198].forEach(a=>p.group(0,0,a*Math.PI/180,1,1,()=>p.path('M0 1Q-7 -6 -4 -13Q2 -17 5 -9Q6 -2 0 1',null,c.gold,1)));
        p.ellipse(0,0,2,2,c.gold);p.line('M-9 11Q0 7 8 14M7 15l5 -3',c.gold,.8);
      } else {
        p.line('M-14 7Q-19 -1 -10 -4Q-10 -13 -1 -11Q8 -12 10 -4Q20 -3 15 6Q9 12 3 7Q-3 1 3 -2Q9 -4 11 2M-14 7Q-7 11 -2 7',c.gold,1);
        p.line('M-12 12Q1 17 13 11',c.gold,.8);
      }
    });
  }
  function ribbon(p,c,x,y,side,m,long=false) {
    p.group(x,y,(-m.cloth*.012)*(side||1),(side||1)*.76,1,()=>{
      const col=material(c.lining,c.trim,[-15,-20,80,80]);
      p.path(long?'M0 0C24 -19 43 -15 55 5C73 34 60 61 78 87L67 82 65 96C44 70 55 44 41 24C27 7 11 20 0 12Z':'M0 0C27 -27 48 -16 64 3C78 18 92 14 104 5L99 18 108 21C83 38 65 27 49 10C33 -6 20 8 0 12Z',col,c.trim,.9);
      p.line(long?'M6 5C31 -9 43 8 50 28C62 51 52 65 69 84':'M8 5C28 -14 45 -5 58 9C74 28 91 21 99 17',c.cloth,1.1);
    });
  }
  function tail(p,c,m) {
    const turn=m.dx>-.2?1:-1;
    if(c.kind==='squirrel')p.group(-8*turn,-127,-m.cloth*.006,turn,1,()=>{
      p.path('M0 5C-34 24 -67 -1 -76 -40C-89 -84 -59 -131 -20 -130C18 -131 35 -100 23 -72C13 -48 -13 -51 -19 -67C-7 -61 8 -72 1 -86C-10 -109 -44 -93 -41 -64C-41 -33 -5 -23 0 5Z',material(c.furHi,c.furShade,[-85,-125,13,0]),'#8b5f80',1.4);
      p.path('M-62 -98C-82 -64 -57 -24 -23 -17C-48 -33 -62 -49 -59 -77C-51 -113 -21 -121 3 -102C-10 -127 -45 -126 -62 -98Z',c.furHi,null);
      p.line('M-69 -69C-70 -37 -47 -16 -25 -12',c.furShade,1);
      p.line('M-66 -77C-69 -45 -50 -20 -30 -15',c.furShade,1);
      p.line('M-66 -77C-69 -45 -50 -20 -30 -15M-50 -108Q-24 -123 -5 -105M-16 -61Q10 -46 23 -72',c.furShade,1.1);
    });
    if(c.kind==='cat')p.group(-8*turn,-122,-m.cloth*.013,turn,1,()=>{
      p.path('M0 -7C-23 3 -31 24 -50 27C-72 30 -84 8 -73 -8C-65 -19 -54 -19 -47 -11C-69 -9 -65 10 -51 9C-34 8 -28 -15 -6 -20Z',material(c.furHi,c.furShade,[-77,-19,0,27]),'#a26b3f',1.4);
      
      p.path('M-74 -9Q-60 -25 -47 -11Q-61 -11 -64 -2L-70 -1Z','#ffdfa3',null);
      p.line('M-54 20Q-72 16 -71 3',c.furHi,2.1);
    });
    if(c.kind==='monkey')p.group(-8*turn,-119,-m.cloth*.014,turn,1,()=>{
      p.line('M0 0C-34 32 -75 6 -75 -29C-76 -61 -49 -70 -36 -49C-25 -29 -45 -11 -53 -29',c.furShade,15);
      p.line('M0 0C-34 32 -75 6 -75 -29C-76 -61 -49 -70 -36 -49C-25 -29 -45 -11 -53 -29',c.fur,11);
      p.line('M-14 8C-43 20 -68 0 -68 -29C-68 -47 -54 -55 -44 -45',c.furHi,2);
    });
  }

  function between(p,a,b,nominal,fn){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);p.group(a.x,a.y,-Math.atan2(dx,dy),1,len/nominal,fn);}
  function leg(p,c,m,side) {
    const s=side*m.cross;
    const stride=m.step*side;
    const standing=c.kind==='bear'?35:c.kind==='monkey'?30:24;
    let foot={x:s*standing+m.dx*stride*22+(m.state==='idle'?side*3:0),y:m.dy*stride*9-Math.max(0,-stride)*9-side*m.dx*5};
    const hip={x:side*c.hip*m.cross,y:-132-side*m.dx*4};
    let knee={x:mix(hip.x,foot.x,.6)+m.dx*stride*9,y:-68-Math.max(0,-stride)*10};
    if(m.action){foot.x+=m.dx*side*m.action*23;foot.y+=m.dy*side*m.action*8;knee.x=mix(hip.x,foot.x,.75);knee.y=-57+side*m.action*7;}
    if(m.dash){foot.x-=m.dx*(side===1?22:42)*m.dash;foot.y-=m.dash*(side===1?44:24);knee.x+=m.dx*18*m.dash;knee.y-=m.dash*13;}
    const ankle={x:foot.x,y:foot.y-10};
    const feminine=c.kind==='rabbit'||c.kind==='squirrel';
    const pants=feminine?material(c.face,c.furHi,[-12,0,12,65]):material(c.kind==='bear'?'#4d6273':c.lining,c.kind==='bear'?'#2d4050':c.clothShade,[-15,0,13,60]);
    const thighScale=c.kind==='bear'?1.43:c.kind==='dog'?1.14:feminine?.78:1;
    between(p,hip,knee,64,()=>p.group(0,0,0,thighScale,1,()=>{
      p.path('M-11 -5Q-17 9 -15 30L-10 58Q0 68 11 58L15 27Q19 8 11 -5Z',pants,INK,1.2);
      if(!feminine){p.path('M3 -3Q12 24 6 40L0 62 10 58 15 30 13 2Z',c.clothShade,null);p.line('M-9 15Q-3 34 -8  40 M-8 47L-2 54',c.trim,1);p.line('M-9 15Q-3 34 -8 40M-8 47L-2 54',c.trim,1);}
    }));
    between(p,knee,ankle,55,()=>p.group(0,0,0,c.kind==='bear'?1.2:feminine?.82:1,1,()=>{
      
      p.path('M-10 -4Q0 -8 10 -3L8 40 11 55 -10 55 -8 23Z',material(c.boot,c.armor,[-10,-5,10, 50]),INK,1.1);
      p.path('M-9 3L-5 17 -6 36 0 46 6 34 5 17 9 4Q0 9 -9 3Z',material(c.armor,c.boot,[-8,0,9,40]),c.gold,.8);
      p.line('M-6 5L-2 20 -3 33 0 38M-9  40 Q0 45 8  40',c.gold,.9);
      p.line('M-6 5L-2 20 -3 33 0 38M-9 40Q0 45 8 40',c.gold,.9);
      p.path('M-11 -2Q0 1 11 -3L11 3Q0 9 -11 4Z',c.trim,c.gold,.7);
      p.line('M-9 46Q1 51 9 46M-9 51Q0 56 10 51',c.gold,.7);
    }));
    const toe=Math.abs(m.dx)>.85?Math.sign(m.dx):Math.sign(side*m.cross)||1;
    p.group(foot.x,foot.y,0,toe,c.kind==='bear'?1.1:1,()=>{
      p.path('M-10 -13L7 -14Q11 -7 17 -5Q23 -2 20 3Q4 10 -13 4Q-15 -2 -10 -13Z',material(c.boot,c.armor,[-9,-13,17,7]),INK,1.1);
      p.path('M8 -8Q15 -7 19 -2L18 1 5 2 1 -4Z',c.clothShade,c.gold,.7);
      p.line('M-12 3Q4 7 20 1',c.gold,1);
    });
  }

  function coat(p,c,m,backLayer=false) {
    const scale=c.w/31, bottom=-132+c.robe;
    const female=c.kind==='rabbit'||c.kind==='squirrel';
    p.group(0,-135,m.cloth*.004,scale,1,()=>{
      if(backLayer){
        p.path(`M-25 -4Q-40 34 -66 ${c.robe-5}L-48 ${c.robe+7} -27 ${c.robe-2} -7 ${c.robe-8} 10 ${c.robe+4} 52 ${c.robe-3}Q30 43 27 -7Z`,material(c.lining,c.clothShade,[-50,0,55,c.robe]),INK,1.1);
        p.path(`M-25 1Q-34 44 -48 ${c.robe-3}L-34 ${c.robe-8}Q-15 53 -12 5Z`,c.cloth,null);
        p.path(`M20 -1Q29 42 43 ${c.robe-5}L34 ${c.robe+1}Q13 46 11 1Z`,c.cloth,null);
        p.line(`M-42 ${c.robe-7}Q-31 ${c.robe-1} -27 ${c.robe-8}M17 ${c.robe-7}Q30 ${c.robe+1} 45 ${c.robe-10}`,c.trim,1.3);
      }else{
        p.path(`M-16 -4L21 -4Q16 31 24 58L37 ${c.robe+1} 14 ${c.robe+11} -9 ${c.robe+6} -32 ${c.robe+10}Q-22 62 -16 -4Z`,material(c.kind==='bear'?c.lining: female?c.face:c.cloth,c.clothShade,[-22,0,34,c.robe+9]),INK,1.1);
        
        p.path(`M7 4Q-5 48 3 ${c.robe+8}L14 ${c.robe+11} 17 ${c.robe+4}Q8 50 16 -2Z`,c.lining,null);
        p.line(`M-7 17Q-18 54 -20 ${c.robe+1}M20 66L27 ${c.robe-3}`,c.trim,.9);
        p.path(`M-25 -7Q-25 33 -48 ${c.robe-16}L-33 ${c.robe-2}Q-9 60 1 -3Z`,material(c.cloth,c.clothShade,[-45,4,5,c.robe]),INK,1.1);
        
        p.path(`M20 -9Q19 30 39 ${c.robe-18}L49 ${c.robe-5} 35 ${c.robe+1}Q13 50 7 -3Z`,material(c.cloth,c.clothShade,[10,0,49,c.robe]),INK,1.1);
        p.path(`M-25 -6L-18 -3Q-22 45 -39 ${c.robe-9}L-46 ${c.robe-15}Q-25 32 -25 -6Z`,c.trim,null);
        p.path(`M16 -4Q19 48 43 ${c.robe-9}L36 ${c.robe-4}Q14 46 10 -3Z`,c.trim,null);
        p.line(`M-22 6Q-24  40 -41 ${c.robe-14}`,c.gold,.9);
        p.line(`M-22 6Q-24 40 -41 ${c.robe-14}M18 16Q26 57 40 ${c.robe-7}`,c.gold,.9);
        if(c.kind==='panda'){ornament(p,c,-20,63,.64,'bamboo');ornament(p,c,29,86,.6,'bamboo');}
        else if(female){ornament(p,c,-30,c.robe-19,.51,'flower');ornament(p,c,28,c.robe-10,.42,'flower');}
        else {ornament(p,c,-28,c.robe-15,.5);ornament(p,c,33,c.robe-16,.42);}
      }
    });
  }

  function torso(p,c,m) {
    const width=c.w/31, projection=.73+.27*Math.abs(m.dy);
    p.group(m.dx*3,-171,0,width*projection,1,()=>{
      
      p.path('M-29 -41Q-21 -50 0 -50Q20 -49 29 -39L26 8 23 40Q0 49 -25 39L-28 2Z',material(c.cloth,c.clothShade,[-28,-45,28,40]),INK,1.3);
      
      p.path('M18 -42L28 -30 25 36 12 40Q20 15 15 -4Z',c.clothShade,null);
      if(m.back){
        
        p.path('M-22 -44Q0 -29 23 -43L24 -30Q0 -20 -24 -31Z',c.trim,null);
        p.line('M-18 -43Q0 -31 19 -42M0 -29V20',c.gold,.9);
        ornament(p,c,0,-7,.7,c.kind==='panda'?'bamboo':c.kind==='rabbit'||c.kind==='squirrel'?'flower':'cloud');
      } else {
        if(c.kind==='bear'){
          p.path('M-18 -48Q0 -40 17 -48L13 -28 0 -10 -13 -28Z',material(c.furHi,c.furShade,[-20,-48,18,-9]),INK,1);
          p.line('M-8 -30L0 -23 6 -31M0 -23L0 -16','#9baba0',.8);
        }

        p.path('M-20 -46L-5 -30 16 -13 24 -30 17 -40Q13 -29 3 -21L-12 -49Z',c.lining,c.trim,.9);
        p.path('M13 -48L24 -39Q16 -18 -7 15L-11 38 -22 38Q-14 4 -3 -11L13 -48Z',material(c.kind==='bear'?c.cloth:c.cloth,c.lining,[2,-40,-12,36]),c.trim,1.1);
        p.path('M13 -48L17 -44Q8 -20 -12 12L-20 36 -24 36Q-16 4 -6 -12Z',c.trim,null);
        p.line('M14 -42Q7 -21 -13 13M-18 -43L-4 -29',c.gold,.9);
        p.line('M-23 -16Q-19 -8 -20 2M17 -7L12 11M-17 24L-20 34',c.trim,.85);
        if(c.kind==='panda')ornament(p,c,19,4,.42,'bamboo');
      }
      if(c.kind==='dog'){
        p.path('M-30 -39L-23 -46Q-22 -10 -34 16L-25 12 -17 22 -7 19Q-22 -11 -16 -43Z',c.cloth,c.trim,1);
        p.path('M23 -43Q27 -9 14 17L26 25 35 11Q23 -14 31 -36Z',c.cloth,c.trim,1);
      }
    });
  }

  function belt(p,c,m) {
    const projection=.72+.28*Math.abs(m.dy),width=c.w/31;
    p.group(m.dx*3,-140,0,width*projection,1,()=>{
      p.path('M-29 -12Q-4 -5 28 -13L29 4Q0 14 -29 4Z',material(c.belt,c.armor,[-28,-12,28,10]),INK,1.2);
      p.line('M-27 -9Q0 -1 26 -10M-27 1Q0 9 27 1',c.gold,.9);
      if(!m.back){
        p.path('M-11 -6L1 -12 14 -5 12 4 0 8 -11 2Z',material(c.gold,'#7b754f',[-10,-10,13,7]),c.gold,.8);
        p.path('M-6 -4L1 -8 9 -3 6 3 -2 3Z',c.armor,null);
        p.ellipse(2,-2,4.8,3.3,material(c.gem,c.trim,[-3,-5,7,2]),c.gold,.7);
        p.line('M-3 -5L0 -6',c.cloth,1.4);
        
        p.path('M-21 2Q-17 21 -30 31L-24 34 -21 41Q-6 20 -10 6Z',c.belt,c.gold,.8);
        p.line('M-12 5Q-11 23 -21  30',c.gold,.9);
        p.line('M-12 5Q-11 23 -21 30',c.gold,.9);
        p.line('M9 5Q13 29 8 41M12 6Q18 28 13 40',c.gold,1.2);
        p.ellipse(10,43,4.2,4.9,c.gem,c.gold,.9);
        p.path('M7 47L6 62 10 65 14 62 13 47Z',c.lining,c.trim,.8);
        p.line('M8 50V61M11 50V63',c.gold,.6);
      } else {
        p.path('M-7 -5L0 -10 7 -4 6 4 -6 4Z',c.gold,INK,.7);
        p.line('M0 4V27M-2 5L-5  20',c.trim,2);
        p.line('M0 4V27M-2 5L-5 20',c.trim,2);
      }
    });
    if(c.kind==='dog')p.group(-c.w*m.cross-9,-133,.11,1,1,()=>{
      
      p.path('M-16 -7Q0 -13 17 -4L19 19Q17 34 -3 34Q-23 30 -21 14Z',material('#ad8550','#745630',[-20,-7,20,34]),INK,1.1);
      p.path('M-17 -7Q-1 4 17 -5L18 7Q0 19 -19 7Z','#b99a65',c.gold,.8);
      p.ellipse(0,11,3,4,c.gold,c.armor,.7);p.line('M-15 10L-13 23M13 13L12 25',c.gold,.7);
      
      p.path('M11 -10L11 -19 18 -20 19 -10Z','#8eaa84',c.trim,.8);p.line('M13 -20 H17',c.gold,2);p.line('M13 -20H17',c.gold,2);
    });
    if(c.kind==='panda')p.group(c.w*m.cross+1,-138,-.15,1,1,()=>{
      
      p.path('M-3 -6H5V58Q1 62 -3 58Z',material('#d5cea2','#8b9e79',[-3,-6,5,58]),c.trim,.9);
      p.line('M-3 3H5M-3 18H5M-3 34H5M-3  50 H5',c.gold,1.5);
      p.line('M-3 3H5M-3 18H5M-3 34H5M-3 50H5',c.gold,1.5);
      [9,14,23,28,39,44].forEach(y=>p.ellipse(1,y,1.15,1.15,c.armor));
    });
  }

  function scabbard(p,c,m) {
    if(c.weaponType==='wood'||c.weaponType==='staff')return;
    const side=m.back?1:-1;
    if(c.weaponType==='plain'){
      p.group(side*22*m.cross,-190,side*.2,1,1,()=>{
        p.path('M-4 0H4L5 121 0 134 -5 121Z',material('#888776','#555f57',[-5,0,5,134]),INK,1);
        p.path('M-5 0H5V7H-5ZM-5 113H5V121H-5Z','#b7a77e',INK,.8);
      });return;
    }
    p.group(side*22*m.cross,-197,side*.2,1,1,()=>{
      p.path('M-5 -8H5L6 129 0 144 -6 129Z',material(c.armor,c.trim,[-6,0,6,144]),INK,1.1);
      p.path('M-6 -8H6V0H-6ZM-6 112H6V124H-6Z',c.gold,c.armor,.7);
      p.line('M-2 5V109',c.gold,.85);
      p.path('M-4 -33H4V-10H-4Z',c.belt,INK,.9);
      p.line('M-4 -27L4 -22M-4 -18L4 -13',c.gold,1);
      p.path('M-12 -10Q0 -19 12 -10L9 -5Q0 -10 -9 -5Z',c.gold,c.armor,.9);
      p.ellipse(0,-35,4,4,c.gem,c.gold,.9);
    });
  }
  function blade(p,c,x,y,angle,m) {
    p.group(x,y,angle,1,1,()=>{
      if(c.weaponType==='staff'){
        p.path('M-5 -175Q0 -180 5 -175L5 121Q0 127 -5 121Z',material('#a68555','#574a38',[-6,-170,6,125]),'#3c453a',1.1);
        p.path('M-6 -172H6V-143H-6ZM-6 90H6V119H-6Z',material('#b0986a','#645c4a',[-6,-172,6,119]),'#524d3c',.9);
        p.path('M-5 -93H5V-69H-5ZM-5 45H5V69H-5Z','#883f36','#5b3d34',.8);
        p.line('M-2 -135V-99M2 -62V35M-5 -87H5M-5 -79H5M-5 51H5M-5 60H5','#d0b982',.9);
        return;
      }
      if(c.weaponType==='plain'&&c.kind==='squirrel'){
        // The inherited left-hand sword is a steel weapon, distinct from the early wooden tutorial sword.
        p.path('M-4.4 -17L-4.8 -136 0 -157 4.8 -136 4.4 -17Z',material('#e2e9df','#748d91',[-5,-137,5,-20]),'#516d70',.85);
        p.path('M0 -153L4 -135 3.6 -21 0 -18Z',material('#9eb3b3','#e2ebe0',[0,-100,4,-27]),null);
        p.line('M0 -146V-25','#ffffe8',1.15);
        p.path('M-17 -20L-14 -25 -6 -21H6L14 -25 17 -20 12 -14H-12Z',material('#c5ccba','#788e85',[-17,-24,17,-14]),'#516763',.95);
        p.line('M-12 -20H12','#e0dfc0',1.1);
        p.path('M-3.7 -13H3.7V13H-3.7Z',material('#857296','#554462',[-4,-12,4,13]),'#514458',.8);
        p.line('M-3.4 -9L3.4 -3M-3.4 -1L3.4 5M-3.4 7L3.4 12','#c1aeca',1.15);
        p.path('M-5 13H5L4 18 0 22 -4 18Z','#9aaa96','#556c63',.85);
        p.line('M0 22Q-4 28 -3 33','#a993b5',.9);
        p.path('M-6 31L-7 42 -3 46 1 41 0 31Z','#9c80b2','#6c5c80',.65);
        return;
      }
      if(c.weaponType==='wood'||c.weaponType==='plain'){
        const wooden=c.weaponType==='wood',col=wooden?'#ba965e':'#c1d0ce',shade=wooden?'#7d6340':'#6e878a';
        p.path('M-4 -16L-4 -133 0 -149 4 -133 4 -16Z',material(col,shade,[-4,-140,4,-20]),wooden?'#786344':'#526d6b',.9);
        p.line('M0 -134V-25',wooden?'#dec28a':'#f7f5da',.8);
        p.path('M-14 -18H14V-12H-14Z',wooden?'#977b50':'#a99871',INK,.9);
        p.path('M-3 -12H3V14H-3Z',wooden?'#816445':'#6c4c44',INK,.9);
        p.line('M-3 -7L3 -2M-3 1L3 6M-3 9L3 13',wooden?'#d7b682':'#cbb991',.9);
        return;
      }
      const big=c.kind==='bear',length=big?164:149,w=big?9:3.4;
      p.path(`M-${w} -18L-${w} -${length-18} 0 -${length+7} ${w} -${length-18} ${w} -18Z`,material(c.blade,'#f6f7dd',[-w,-100,w,-40]),c.trim,big?1.2:.9);
      p.path(`M0 -${length+7}L${w*.25} -31 ${w} -18H0Z`,c.blade,null);
      p.line(`M0 -${length-4}V-29`,'#fffde8',big?1.4:1);
      if(big){p.path('M-9 -83L-5 -93 -5 -49 -9 -41ZM9 -102L5 -113 5 -69 9 -58Z',c.gold,null);p.line('M-5 -114L0 -132 5 -114',c.gold,.9);}
      p.path('M-3 -22Q-12 -29 -20 -21L-19 -15 -11 -15 -6 -10 0 -13 6 -10 11 -15 19 -15 20 -21Q11 -29 3 -22Z',material(c.gold,'#746c4e',[-18,-27,18,-9]),c.armor,1);
      p.path('M-15 -20Q-9 -22 -6 -17M15 -20Q9 -22 6 -17',null,c.cloth,.8);
      p.path('M-4 -13H4V12L0 16 -4 12Z',c.armor,c.gold,.8);
      p.line('M-4 -8L4 -4M-4 1L4 5M-4 8L3 12',c.lining,1.3);
      p.path('M-4 13L0 11 5 14 4 21 0 24 -5 19Z',c.gold,c.armor,.8);
      p.ellipse(0,17,2.1,2.8,c.gem,c.armor,.6);
      if(c.kind==='rabbit'||c.kind==='squirrel'){
        p.line('M2 22Q9 31 5 41',c.trim,1);
        p.path('M2 38L0 49 5 55 9 48 7 38Z',c.lining,c.trim,.7);p.line('M4 41L3 50M6 42V51',c.cloth,.6);
      }
    });
  }
  function armPose(c,m,side) {
    const screen=side*(m.cross<0?-1:1),weapon=side===c.hand;
    const shoulder={x:side*c.w*m.cross,y:-207-side*m.dx*7};
    const elbow={x:shoulder.x+screen*16,y:-172-side*m.dx*4};
    const wrist={x:shoulder.x+screen*(weapon?19:23),y:weapon?-139:-147};
    if(c.kind==='rabbit'&&!weapon){wrist.x+=screen*7;wrist.y=-159;elbow.x+=screen*7;elbow.y=-181;}
    if(c.kind==='monkey'&&!weapon){wrist.y=-174;wrist.x+=screen*8;elbow.y=-167;elbow.x+=screen*5;}
    if(c.kind==='panda'&&!weapon){wrist.y=-182;wrist.x=shoulder.x*.56;elbow.y=-168;elbow.x+=screen*12;}
    if(c.kind==='dog'&&!weapon){wrist.y=-161;wrist.x+=screen*5;}
    let angle=screen*(c.kind==='bear'?2.9:2.75);
    if(c.kind==='bear'&&weapon){wrist.y=-170;elbow.y=-186;elbow.x+=screen*7;}
    const rest={wx:wrist.x,wy:wrist.y,ex:elbow.x,ey:elbow.y,angle};
    if(m.state==='walk'){
      wrist.x-=m.dx*m.step*side*15;wrist.y+=m.step*side*13;elbow.x-=m.dx*m.step*side*6;angle+=m.step*side*.14;
    }
    if(m.state==='attack'){
      const q=smooth(.15,.66,m.phase),a=m.action;
      if(weapon){
        wrist.x=shoulder.x+m.dx*(36+35*a)+screen*9;
        wrist.y=-178+m.dy*a*28-Math.sin(q*Math.PI)*11;
        elbow.x=mix(shoulder.x,wrist.x,.55)+screen*13;
        elbow.y=mix(shoulder.y,wrist.y,.55)+8;
        angle=m.q+Math.PI/2+mix(-2.06,1.06,q);
      }else{wrist.x=shoulder.x-screen*a*3-m.dx*a*15;wrist.y=-159+a*8;elbow.x=shoulder.x+screen*(15-a*8);}
      const engage=smooth(0,.12,m.phase)*(1-smooth(.76,1,m.phase));
      wrist.x=mix(rest.wx,wrist.x,engage);wrist.y=mix(rest.wy,wrist.y,engage);
      elbow.x=mix(rest.ex,elbow.x,engage);elbow.y=mix(rest.ey,elbow.y,engage);
      angle=rest.angle+Math.atan2(Math.sin(angle-rest.angle),Math.cos(angle-rest.angle))*engage;
    }
    if(m.state==='cast'){
      wrist.x=mix(rest.wx,shoulder.x+screen*(15+22*m.cast),m.cast);wrist.y=mix(rest.wy,-199-23*m.cast,m.cast);
      elbow.x=mix(rest.ex,shoulder.x+screen*21,m.cast);elbow.y=mix(rest.ey,-179-8*m.cast,m.cast);
      angle=rest.angle+Math.atan2(Math.sin(screen*.45-rest.angle),Math.cos(screen*.45-rest.angle))*m.cast;
    }
    if(m.dash){wrist.x-=m.dx*43*m.dash;wrist.y-=23*m.dash;elbow.x-=m.dx*12*m.dash;elbow.y-=11*m.dash;angle=m.dx>=0?-1.82:1.82;}
    if(m.social){
      if(weapon){const lift=.18+.82*Math.sin(Math.PI*m.phase)**2;wrist.x=mix(screen*(c.w+10),screen*11,lift);wrist.y=mix(-160,-216,lift);elbow.x=shoulder.x+screen*16;elbow.y=mix(-172,-192,lift);angle=0;}
      else{wrist.x=shoulder.x+screen*10;wrist.y=-154;elbow.x=shoulder.x+screen*13;elbow.y=-177;}
    }
    if(c.injuredRight&&side===-1&&!weapon){wrist.x=4*m.cross;wrist.y=-161;elbow.x=shoulder.x+screen*6;elbow.y=-171;}
    return {shoulder,elbow,wrist,angle,weapon,screen};
  }
  function arm(p,c,m,side) {
    const a=armPose(c,m,side),feminine=c.kind==='rabbit'||c.kind==='squirrel';
    const broad=c.kind==='bear'?1.55:feminine?.84:1;
    between(p,a.shoulder,a.elbow, 40,()=>{});
    between(p,a.shoulder,a.elbow,40,()=>p.group(0,0,0,broad,1,()=>{
      if(c.kind==='bear'){
        p.path('M-12 -7Q-22 7 -16 24L-12 42Q0 51 13 42L19 24Q20 2 11 -8Z',material(c.furHi,c.furShade,[-15,-4,18,44]),INK,1.2);
        p.path('M8 2Q18 20 8 35L6 44 13 42 19 24Q19 7 14 2Z',c.furShade,null);
        p.line('M-10 6Q-17 18 -10 28M-8 36Q0 42 8 35','#a7b1a5',.85);
        p.path('M-16 -4Q-4 -18 14 -6L14 6Q0 1 -15 10Z',c.armor,c.gold,1.1);
        ornament(p,c,0,-2,.46);
      }else{
        const wide=feminine||c.kind==='panda'?18:14;
        p.path(`M-12 -8Q-${wide+4} 3 -${wide} 22L-${wide-3} 42Q1 55 ${wide} 42L${wide+3} 24Q19 4 11 -8Z`,material(c.cloth,c.clothShade,[-18,-7,22,48]),INK,1.1);
        p.path(`M8 -4Q18 19 10 44L${wide} 42 ${wide+3} 24Q18 4 11 -8Z`,c.clothShade,null);
        p.line(`M-9 5Q-16 18 -${wide-3}  30 M-6 38L0 44`,c.trim,.9);
        p.line(`M-9 5Q-16 18 -${wide-3} 30M-6 38L0 44`,c.trim,.9);
        if(!feminine&&c.kind!=='panda'){
          p.path('M-14 -5Q0 -19 15 -4L13 11Q0 6 -16 12Z',material(c.armor,c.trim,[-14,-10,16,14]),c.gold,1);
          p.line('M-11 -3Q1 -12 12 -2M-10 8L-7 0',c.gold,.8);
          ornament(p,c,1,1,.39);
        }else{
          p.path('M-12 -7Q0 -13 12 -5L10 0Q-1 -6 -12 0Z',c.trim,c.gold,.8);
          if(feminine)ornament(p,c,-7,-1,.3,'flower');
        }
        p.path(`M-${wide-3} 35Q0 45 ${wide} 34L${wide} 44Q0 53 -${wide-3} 43Z`,c.lining,c.trim,.9);
        p.line(`M-${wide-2} 40Q0 48 ${wide-1} 39`,c.gold,.8);
      }
    }));
    between(p,a.elbow,a.wrist,38,()=>p.group(0,0,0,c.kind==='bear'?1.34:feminine?.82:1,1,()=>{
      p.path('M-10 -2Q-12 11 -8 36Q0 42 9 35L12 4 9 -3Z',material(c.kind==='panda'?'#3c5044':c.furHi,c.kind==='panda'?'#233b30':c.fur,[-11,0,12,38]),INK,1.1);
      p.path('M-11 6L-13 28 -8 36Q1 39 10 32L14 9 5 13 -2 4Z',material(c.armor,c.boot,[-12,5,12,36]),c.gold,.9);
      p.path('M-5 9L-6 23 -2 30 4 25 7 13 2 15Z',c.trim,c.gold,.75);
      p.line('M-11 27Q0 34 10 28M-12 19L-8 22M10 18L7 20',c.gold,.9);
      if(c.kind==='squirrel'&&!a.weapon){p.path('M-13 27Q0 33 11 27L10 35Q0 40 -11 34Z',c.lining,c.trim,.7);p.line('M-6  30 L-5 36M0 31V38M6 30L5 36',c.trim,.7);p.line('M-6 30L-5 36M0 31V38M6 30L5 36',c.trim,.7);}
    }));
    if(a.weapon&&!m.social){
      if(m.state==='attack'&&m.phase>.19&&m.phase<.76){
        p.alpha(.14,()=>p.group(a.wrist.x,a.wrist.y,0,1,1,()=>{
          const r=135,aa=a.angle-.6,bb=a.angle-.12;
          const ax=Math.sin(aa)*r,ay=-Math.cos(aa)*r,bx=Math.sin(bb)*r,by=-Math.cos(bb)*r;
          p.path(`M${ax} ${ay}Q${Math.sin((aa+bb)/2)*155} ${-Math.cos((aa+bb)/2)*155} ${bx} ${by}L${bx*.72} ${by*.72}Q${Math.sin((aa+bb)/2)*95} ${-Math.cos((aa+bb)/2)*95} ${ax*.9} ${ay*.9}Z`,c.blade,null);
        }));
      }
      blade(p,c,a.wrist.x,a.wrist.y,a.angle,m);
    }
    p.group(a.wrist.x,a.wrist.y,a.weapon?a.angle*.16:0,1,1,()=>{
      const paw=c.kind==='panda'?'#33493e':c.fur;
      if((m.state==='cast'||c.kind==='monkey')&&!a.weapon){
        
        p.path('M-7 5L-9 -4 -5 -7 -6 -19Q-4 -23 -2 -18L1 -7 2 -21Q5 -24 6 -19L7 -4 12 -7Q17 -6 12 0L8 9 -1 13Z',paw,INK,1);
        p.line('M-3 -6L0 3M4 -5L5 3M-3 7Q2 4 7 6',c.furShade,.75);
      } else {
        p.path('M-8 -4Q-4 -10 2 -7L8 -4 8 5Q6 12 -2 10L-8 4Z',material(c.kind==='panda'?paw:c.furHi,paw,[-8,-7,8,10]),INK,1.1);
        p.line('M-4 -4L-2 3M0 -5L2 3M4 -3L5 4',c.kind==='panda'?'#849183':c.furShade,.75);
        p.path('M-7 1Q-2 -2 2 1Q5 5 -1 7L-6 5Z',paw,INK,.7);
      }
      if(m.social&&a.weapon){
        p.path('M-9 -11L9 -11 6 2Q0 6 -6 2Z',material('#eef1d8','#93b6a1',[-9,-12,9,4]),'#486859',.9);
        p.ellipse(0,-11,9,3.1,'#edf3e0','#647e65',.8);
        p.ellipse(0,-11,6.7,1.8,'#9e864e');
        p.path('M-6 -7L-4 0M5 -7L3 0',null,'#d9e8d1',.8);
      }
      if(c.kind==='dog'&&!a.weapon&&!m.social){
        p.line('M0 -6Q2 -22 13 -30 M5 -18 L-4 -29',c.trim,1.3);
        p.line('M0 -6Q2 -22 13 -30M5 -18L-4 -29',c.trim,1.3);
        
        p.path('M8 -22Q7 -34 14 -38Q19 -30 8 -22M6 -20Q19 -27 23 -20Q16 -16 6 -20M1 -20Q-14 -24 -12 -30Q-3 -35 1 -20',c.clothShade,c.trim,.6);
      }
    });
  }

  /* Faces studied from the 2006 animation: CCTV promotional frame (2007)
     and original episode frames. Each model has its own skull, mask, eyelids
     and muzzle. Shared brushes keep the same geometry in SVG and Canvas. */
  const FACE = {
    cat:{fur:'#ed8737',hi:'#f8a955',shade:'#cf6e2e',line:'#885338',cream:'#f6dfad',eye:'#252b2b'},
    rabbit:{fur:'#63b5d8',hi:'#99d4e7',shade:'#3c8cbd',line:'#496f9c',cream:'#fbf3dc',eye:'#6e393d'},
    squirrel:{fur:'#ba639c',hi:'#d58bbb',shade:'#99517f',line:'#764765',cream:'#fbefc9',eye:'#252429'},
    dog:{fur:'#c09961',hi:'#dfba7b',shade:'#a57b4a',line:'#7e633f',cream:'#f2dba6',eye:'#262721'},
    bear:{fur:'#f0efda',hi:'#fffcef',shade:'#c9cbb4',line:'#8c9683',cream:'#eaddb8',eye:'#282a25'},
    monkey:{fur:'#91866b',hi:'#aca185',shade:'#72674e',line:'#675844',cream:'#dfc1a0',eye:'#262a26'},
    panda:{fur:'#faf8ed',hi:'#fffef6',shade:'#d9dfd4',line:'#909f94',cream:'#fff9e8',eye:'#1c292d'}
  };
  function faceMaterial(f){return material(f.hi,f.fur,[-33,-44,34,33]);}
  function shine(p,x,y,r=1.3){p.ellipse(x,y,r,r*1.24,'#fffef1');}
  function flowerPin(p,c,x,y,scale=1) {
    p.group(x,y,0,scale,scale,()=>{
      for(let i=0;i<5;i++)p.group(0,0,i*TAU/5,1,1,()=>p.path('M0 0Q-7 -5 -4 -9Q1 -13 5 -7Q6 -3 0 0Z',material(c.cloth,c.furShade,[-5,-10,5,0]),c.trim,.65));
      p.ellipse(0,0,3,3,c.gold,c.armor,.7);p.ellipse(-.8,-1,1,1,c.cloth);
    });
  }
  function canonicalEye(p,c,x,y,sx=1,sy=1,near=true,m={}) {
    const f=FACE[c.kind],action=m.action||0;
    p.group(x,y,0,sx,sy,()=>{
      if(c.kind==='cat'){
        p.path('M-10 12L-10 -10Q-10 -23 0 -24Q10 -22 11 -9L10 12Q1 15 -10 12Z','#fffaf0',f.line,.8);
        p.ellipse(3.5,1.6,5.7,12.9,'#23272a');
        p.path('M1 -8Q0 -3 1 3L2 8Q-2 1 -1 -6Z','#695447',null);
        shine(p,1,-6.3,1.5);
        p.path(`M-12 ${-28+action*4}Q-4 -33 9 -26Q0 -28 -10 -25Z`,'#52392e',null);
        p.line('M-10 12L-5 13M7 13L11 11',f.line,.8);
        if(action>.2)p.path(`M-11 -17L12 ${-10-action*3}V-18L-11 -25Z`,f.fur,null);
      }else if(c.kind==='rabbit'){
        p.path('M-12 4Q-10 -11 -1 -14Q9 -15 13 -4L11 10Q0 16 -10 10Z','#fffdf1',f.line,.65);
        p.ellipse(3.2,2.5,6.3,9.8,material('#994a51','#63313c',[-3,-7,8,12]));
        p.ellipse(4,3.4,3.9,8.5,'#58303b');shine(p,.8,-2.7,1.45);
        p.path('M-13 4Q-12 -11 -3 -15Q5 -20 13 -11L15 -17 16 -9 20 -12 17 -5Q10 -10 7 -11Q-6 -16 -11 5Z','#3e5191',null);
        p.line('M-10 10Q0 16 10 10','#9d7c83',.75);
        p.path('M-10 -23Q-1 -29 10 -23L9 -21Q-1 -24 -10 -22Z','#4d75ab',null);
      }else if(c.kind==='squirrel'){
        p.path('M-10 10Q-11 -8 -3 -20Q5 -21 11 -7L10 12Q-1 15 -10 10Z','#fffceb',f.line,.75);
        p.ellipse(2.7,3.2,5.4,10.7,'#262429');shine(p,1,-3.4,1.15);
        p.path('M-11 -3Q-8 -17 -2 -22Q9 -20 13 -4Q1 -13 -11 -3Z',material('#c383b1','#a1598d',[-9,-20,11,-3]),null);
        p.line('M-11 -3Q1 -13 13 -4',f.line,1.1);
        p.line('M8 -7L11 -12M11 -5L15 -10M12 -3L18 -6',f.line,.9);
        p.line('M-7 -26Q-2 -29 4 -26',f.line,.8);
      }else if(c.kind==='dog'){
        p.path('M-12 12Q-16 -3 -11 -18Q-7 -29 1 -26Q11 -22 12 -7L12 11Q1 17 -12 12Z','#fffdf0',f.line,.8);
        p.ellipse(5.3,4.5,4.7,10.2,'#202721');shine(p,3.8,-1.1,1.15);
        p.line('M-9 -30Q-4 -33 1 -31',f.line,1);
      }else if(c.kind==='bear'){
        p.path('M-10 -11L12 -10Q12 8 6 14Q-2 19 -9 7Z','#fffdf1',f.line,.8);
        p.ellipse(3,3.2,3.5,7.4,'#292c2b');shine(p,1.8,.1,.85);
        p.path('M-12 -20L9 -22 12 -19Q1 -16 -12 -17Z','#535944',null);
        p.line('M-11 -11L12 -10',f.line,1.05);
      }else if(c.kind==='monkey'){
        p.path('M-12 5Q-17 -6 -11 -20Q-6 -31 2 -26Q12 -20 13 -7L10 7Z','#dba351',null);
        p.path('M-9 5Q-12 -5 -6 -13Q1 -19 7 -10L8 7Z','#fff8e2',f.line,.65);
        p.ellipse(3.2,2,3.6,7.7,'#252824');shine(p,2,-1.4,.8);
        p.path('M-15 -10Q-19 -24 -10 -31Q1 -36 10 -19L13 -8Q2 -22 -6 -22Q-12 -21 -15 -10Z','#302c24',null);
      }else{
        p.path('M-16 8Q-15 -13 -3 -20Q11 -21 16 -4Q17 12 5 18Q-7 23 -16 8Z','#233036',null);
        p.path('M-13 8Q-1 -4 13 -5Q13 9 5 14Q-6 20 -13 8Z','#fffdf1',f.line,.65);
        p.ellipse(6.7,3.2,4.4,7.2,'#20292e');shine(p,5,-.8,1.0);
        p.line('M-13 8Q-1 -4 13 -5','#233036',1.1);
      }
    });
  }
  function eyePair(p,c,v,m,position={}) {
    const y=position.y===undefined?-6:position.y;
    const span=position.span||16;
    const height=position.height||1;
    if(!v.side)canonicalEye(p,c,-span+v.turn*9,y,(1-v.turn*.36)*(position.width||1),height,false,m);
    canonicalEye(p,c,span+v.turn*3.5,y-v.turn*1.5,(1-v.turn*.17)*(position.width||1),height,true,m);
  }
  function backTexture(p,f,kind,v) {
    if(kind==='panda'){
      p.path('M-29 21Q-17 33 1 34Q22 33 33 18L29 30Q5 42 -23 31Z',f.shade,null);
    }else{
      p.path('M18 -31Q32 -14 29 10Q28 24 15 33L24 29Q40 8 31 -17Z',f.shade,null);
      p.line('M-24 -6Q-27 11 -19 20M17 -12Q24 2 20 15',f.line,.65);
    }
  }
  function catHead(p,c,m,v) {
    const f=FACE.cat;
    p.path('M-30 -22L-38 -53Q-39 -59 -33 -55L-13 -39Z',faceMaterial(f),f.line,1.1);
    p.path('M-32 -31L-34 -48 -20 -37Z','#de7b45',null);
    p.path('M17 -35L35 -53Q41 -57 40 -49L34 -21Z',material(f.hi,f.shade,[17,-48,41,-23]),f.line,1.1);
    p.path('M25 -32L35 -46 33 -28Z','#e69961',null);
    p.path(v.side?'M-31 -29Q-7 -42 18 -29Q30 -16 31 4L45 12Q52 22 41 29Q24 40 -5 36Q-27 33 -34 15Q-39 -5 -31 -29Z':'M-32 -28Q-19 -41 3 -37Q26 -38 35 -21L37 6Q43 23 29 34Q15 43 -4 40Q-23 40 -34 27L-37 9Q-39 -13 -32 -28Z',faceMaterial(f),f.line,1.15);
    p.path('M-30 -26Q-21 -36 -8 -35L-12 -31Q-25 -29 -31 -17Z',f.hi,null);
    if(v.back){backTexture(p,f,c.kind,v);}else{
      const nx=2+v.turn*24;
      eyePair(p,c,v,m,{y:-6,span:16,width:.93,height:.93});
      p.path(`M${nx-18} 15Q${nx-6} 11 ${nx} 16Q${nx+14} 13 ${nx+21} 23Q${nx+13} 34 ${nx-5} 35Q${nx-21} 33 ${nx-25} 25Z`,material('#f2a150',f.fur,[nx-21,14,nx+19,33]),null);
      p.path(`M${nx-7} 14Q${nx} 10 ${nx+8} 14Q${nx+7} 20 ${nx+1} 22Q${nx-5} 22 ${nx-7} 14Z`,'#263032',null);
      p.ellipse(nx-1,14,2.5,1.05,'#d7d5c2');
      p.line(`M${nx+1} 22V25M${nx-11} 27Q${nx+1} 34 ${nx+14} 26`,f.line,.95);
      p.line(`M${nx+12} 25L${nx+16} 25`,f.line,.65);
      if(!v.side)p.path('M-33 14L-40 16 -35 20 -41 23Q-34 24 -29 20Z',f.cream,f.line,.6);
      p.path('M34 13L41 14 37 19 43 21Q36 24 31 20Z',f.cream,f.line,.6);
    }
    p.path(v.back?'M-13 -34L-15 -43 -7 -39 -2 -47 3 -40 14 -43 9 -35Z':'M-12 -35L-15 -44 -5 -40 -2 -48 3 -41 12 -42 6 -36 14 -28 7 -29 6 -20 0 -29 -5 -31Z',material(f.hi,f.fur,[-12,-45,13,-22]),f.line,.7);
    p.line('M-5 -38L0 -35 3 -29',f.hi,.95);
  }
  function rabbitHead(p,c,m,v) {
    const f=FACE.rabbit;
    p.path('M-20 -31C-35 -42 -42 -65 -35 -88Q-31 -100 -29 -96C-24 -88 -13 -77 -11 -58Q-9 -39 -10 -29Z',material(f.hi,f.shade,[-38,-98,-10,-29]),f.line,1.1);
    if(!v.back)p.path('M-22 -40Q-31 -55 -31 -80Q-21 -71 -18 -57L-17 -42Z',material('#f1d6e1','#cfa6ce',[-30,-83,-17,-41]),null);
    p.path('M8 -33Q5 -58 22 -87Q30 -101 33 -96C39 -77 39 -58 27 -37L20 -28Z',material(f.hi,f.shade,[15,-98,38,-28]),f.line,1.1);
    if(!v.back)p.path('M17 -42Q17 -60 29 -80Q33 -62 24 -44Z',material('#f4d9e1','#c8a0c9',[20,-82,30,-39]),null);
    p.path(v.side?'M-25 -30Q-8 -40 10 -34Q32 -24 34 4L45 11Q50 19 42 27Q31 37 10 36L0 43 -9 37Q-29 33 -35 12Q-40 -11 -25 -30Z':'M-26 -30Q-9 -42 11 -34Q30 -30 34 -9L35 10 40 16 35 23Q27 35 11 37L2 45 -6 38Q-28 36 -34 16L-35 -5Q-34 -20 -26 -30Z',faceMaterial(f),f.line,1.1);
    if(v.back){backTexture(p,f,c.kind,v);}else{
      const nx=2+v.turn*24;
      if(!v.side)p.path('M-27 -18Q-17 -34 -8 -21Q-3 -10 -3 11L-25 19Q-35 7 -27 -18Z',f.cream,null);
      p.path(v.side?'M20 -21Q33 -26 34 -6L36 11 47 14Q49 22 37 29L18 33 6 21Q16 3 20 -21Z':'M10 -22Q19 -35 30 -17Q36 -5 32 12L21 24 -3 19Q4 7 10 -22Z',f.cream,null);
      p.path(`M-30 11Q-23 8 -13 13Q${nx-10} 13 ${nx-3} 8Q${nx+5} 10 ${nx+13} 11Q${nx+27} 11 ${nx+24} 23Q${nx+19} 34 5 38L2 44 -3 37Q-25 36 -31 25Q-35 18 -30 11Z`,material('#fff7df','#eee3cb',[-28,8,34,38]),null);
      eyePair(p,c,v,m,{y:-6,span:15.5,width:.97,height:1.04});
      p.path(`M${nx-5} 9Q${nx} 6 ${nx+6} 10Q${nx+6} 16 ${nx} 18Q${nx-5} 16 ${nx-5} 9Z`,'#86474d',null);
      p.ellipse(nx-1,9.5,1.6,.8,'#c99797');
      p.line(`M${nx} 18L${nx+1} 21M${nx-8} 25Q${nx+1} 30 ${nx+12} 23`,'#9d7d80',.9);
      p.line(`M${nx-14} 20L${nx-9} 20`,'#ccb59c',.6);
    }
    p.path(v.back?'M-21 -31Q-11 -45 4 -41Q21 -39 25 -24Q13 -32 2 -29Q-13 -24 -21 -31Z':'M-23 -29Q-29 -44 -11 -47Q6 -48 13 -36Q17 -24 2 -18L-3 -12 -6 -20Q-17 -20 -23 -29Z',material(f.hi,f.fur,[-23,-48,14,-12]),f.line,.85);
    p.line('M-19 -35Q-13 -43 -4 -40',f.hi,1.5);
    flowerPin(p,c,-25,-32,.45);flowerPin(p,c,-31,-27,.35);
    if(!v.back){p.ellipse(-31,24,1.5,2,c.gold);p.line('M-31 26L-30 32',c.gold,.6);p.ellipse(-30,34,1.4,2.2,c.gem,c.trim,.5);}
  }
  function squirrelHead(p,c,m,v) {
    const f=FACE.squirrel;
    p.path('M-25 -26Q-41 -44 -35 -61Q-31 -67 -28 -58L-11 -31Z',faceMaterial(f),f.line,1);
    p.path('M18 -30Q23 -45 33 -65Q37 -73 39 -63Q44 -48 31 -28Z',faceMaterial(f),f.line,1);
    p.line('M-32 -53Q-30 -41 -21 -33M32 -54L24 -35',f.shade,1.1);
    p.path('M-23 -33Q-45 -45 -43 -31Q-47 -22 -29 -23L-19 -26M16 -34Q44 -47 45 -30Q42 -18 27 -23L17 -27Z',material('#efdc7e','#ccae58',[-42,-44,45,-19]),'#ad9350',.75);
    p.path(v.side?'M-25 -28Q-12 -40 8 -32Q27 -30 32 -7L36 5 47 12Q58 24 40 33Q25 43 5 39Q-22 39 -36 23L-42 11 -37 9 -43 3 -33 1 -34 -8Z':'M-25 -29Q-11 -40 8 -34Q26 -33 33 -13L35 0 44 -3 39 6 47 11 38 15Q41 28 24 35Q13 40 3 42Q-13 38 -27 33Q-43 24 -38 13L-45 10 -40 5 -43 -2 -33 2 -31 -14Z',faceMaterial(f),f.line,1.15);
    if(v.back){backTexture(p,f,c.kind,v);}else{
      const nx=2+v.turn*25;
      if(!v.side)p.path('M-27 -19Q-20 -34 -12 -26Q-5 -16 -3 8L-28 15Q-32 1 -27 -19Z',f.cream,null);
      p.path(v.side?'M18 -27Q29 -29 32 -12L36 5 48 14Q50 22 38 31L18 28 6 18Q15 -3 18 -27Z':'M10 -27Q20 -36 29 -20Q34 -6 33 9L8 19 -3 10Q4 -3 10 -27Z',f.cream,null);
      p.path(`M-33 12Q-25 8 -12 12Q${nx-11} 11 ${nx-6} 5Q${nx} -1 ${nx+6} 9Q${nx+16} 9 ${nx+24} 13Q${nx+33} 25 ${nx+14} 34Q14 40 3 43Q-16 38 -27 32Q-42 25 -33 12Z`,material('#fff5d6','#eadbb5',[-35,6,38,38]),null);
      eyePair(p,c,v,m,{y:-6,span:16,width:.88,height:.98});
      p.ellipse(nx,3,4.9,9.2,'#27232a');p.ellipse(nx-1.25,-1.8,.9,2.2,'#68606b');
      p.line(`M${nx} 12L${nx+.5} 18M${nx-9} 27Q${nx+1} 31 ${nx+12} 24`,f.line,.9);
      p.ellipse(nx+(v.side?-13:16),17,1.55,1.45,'#a25786');
    }
    p.path(v.back?'M-20 -34Q-18 -49 1 -46Q21 -45 23 -32L16 -23 -1 -29 -15 -25Z':'M-23 -30Q-32 -43 -12 -50Q6 -57 20 -44Q28 -32 15 -24L3 -20Q6 -11 -2 -14L-5 -21Q-17 -20 -23 -30Z',material('#f5df81','#d8b854',[-20,-50,18,-13]),'#b99c4c',.85);
    p.path('M-22 -34Q-26 -44 -11 -46Q1 -50 13 -44Q-4 -48 -15 -37Z','#faeaa3',null);
  }
  function dogCap(p,c,v) {
    p.path('M-27 -35Q-24 -47 -17 -50L23 -53 30 -37Q3 -44 -27 -35Z',material('#869d75','#516f55',[-26,-54,27,-34]),'#4f694f',1);
    p.path('M-31 -48L-28 -62Q1 -67 29 -58L34 -48Q3 -52 -31 -48Z',material('#a0b38a','#718b69',[-29,-64,30,-46]),'#516f54',1);
    p.line('M-27 -58Q0 -61 26 -55M-28 -49Q0 -53 30 -48',c.gold,.75);
    if(!v.back){p.path('M-6 -45L1 -48 9 -44 6 -37 -3 -37Z',c.gold,c.trim,.65);p.ellipse(1,-42,2.5,2.5,c.gem,c.trim,.5);}
  }
  function dogHead(p,c,m,v) {
    const f=FACE.dog;
    p.path('M-25 -32Q-37 -36 -44 -25Q-49 -17 -42 -15Q-32 -14 -25 -25Z',faceMaterial(f),f.line,1.1);
    p.path('M22 -34Q36 -34 42 -27Q43 -17 35 -18L25 -24Z',faceMaterial(f),f.line,1.1);
    p.path(v.side?'M-30 -27Q-15 -42 8 -37Q27 -36 34 -19L36 3 45 12Q50 28 36 34L11 40Q-6 45 -18 34Q-35 42 -39 25L-35 6Z':'M-30 -28Q-16 -43 7 -38Q27 -38 33 -18L33 3Q43 25 32 35Q25 40 16 35Q2 45 -11 36Q-26 44 -36 31Q-42 24 -34 6L-34 -10Z',faceMaterial(f),f.line,1.1);
    if(v.back){backTexture(p,f,c.kind,v);}else{
      const nx=2+v.turn*25;
      eyePair(p,c,v,m,{y:-7,span:16,width:.94,height:.97});
      p.path(`M${nx-15} 6Q${nx} -3 ${nx+16} 9L${nx+24} 31Q${nx+12} 42 ${nx-8} 40L${nx-23} 34Z`,material('#f6e3b3','#e9ca8d',[nx-20,3,nx+20,40]),f.line,.8);
      if(!v.side)p.path('M-33 7Q-25 2 -15 7Q-10 9 -13 17Q-15 31 -21 36Q-31 43 -36 31Q-41 22 -33 7Z',faceMaterial(f),f.line,.65);
      p.path(`M${nx+13} 8Q${nx+25} 6 ${nx+30} 18Q${nx+33} 33 ${nx+22} 35Q${nx+16} 36 ${nx+17} 28Z`,material(f.hi,f.fur,[nx+14,9,nx+31,34]),f.line,.6);
      p.ellipse(nx,8,9.2,4.8,'#292b22');p.ellipse(nx-2,6.6,2.6,.8,'#868166');
      p.line(`M${nx} 13V19`,f.line,.9);
      p.path(`M${nx-10} 24Q${nx+1} 30 ${nx+14} 21Q${nx+7} 35 ${nx-1} 34Q${nx-7} 31 ${nx-10} 24Z`,'#834c35',f.line,.65);
      p.path(`M${nx-3} 32Q${nx+2} 28 ${nx+7} 31L${nx+3} 34Z`,'#d8a38b',null);
      p.line(`M${nx-13} 23L${nx-10} 24`,f.line,.7);
    }
    dogCap(p,c,v);
  }
  function bearHead(p,c,m,v) {
    const f=FACE.bear;
    p.path('M-22 -34Q-34 -36 -33 -48Q-28 -57 -21 -47L-16 -36Z',faceMaterial(f),f.line,1);
    p.path('M18 -35Q19 -50 28 -48Q35 -43 30 -34Z',faceMaterial(f),f.line,1);
    p.line('M-27 -44L-23 -40M25 -44L25 -38',f.shade,1.5);
    p.path(v.side?'M-27 -29Q-18 -43 2 -43Q26 -44 29 -23L28 -2Q44 0 49 10Q56 26 38 35L8 39 -8 43 -17 37Q-29 27 -31 8Z':'M-25 -32Q-15 -43 3 -43Q24 -43 29 -26L31 -1 34 16 31 29Q25 41 11 44L-7 44Q-24 39 -29 25L-34 18 -30 11 -32 1Z',faceMaterial(f),f.line,1.1);
    if(v.back){backTexture(p,f,c.kind,v);}else{
      const nx=1+v.turn*26;
      eyePair(p,c,v,m,{y:-11,span:13,width:.89,height:1});
      p.path(`M${nx-19} 5Q${nx-8} -6 ${nx+10} 1Q${nx+25} 6 ${nx+24} 22Q${nx+22} 37 ${nx+8} 39Q${nx-13} 40 ${nx-22} 24Q${nx-25} 14 ${nx-19} 5Z`,material('#f3e7c3','#dccda8',[nx-22,0,nx+23,37]),f.line,.85);
      p.path(`M${nx-10} 4Q${nx} -2 ${nx+11} 4Q${nx+11} 11 ${nx+2} 15Q${nx-4} 14 ${nx-10} 8Z`,'#88423b',null);
      p.ellipse(nx-1,4,3,.9,'#bf7763');
      p.line(`M${nx+1} 15L${nx+2} 20`,f.line,.85);
      p.path(`M${nx-11} 24Q${nx+5} 32 ${nx+17} 20Q${nx+16} 35 ${nx+5} 36Q${nx-4} 34 ${nx-11} 24Z`,'#925e49',f.line,.65);
      p.path(`M${nx+4} 27Q${nx+12} 25 ${nx+16} 22L${nx+13} 29 ${nx+5} 31Z`,'#fff9de',null);
      p.line('M-28 22L-25 29 -20 27M28 24L25 31',f.shade,.75);
    }
    p.path('M-17 -37L-16 -47 -9 -42 -5 -49 0 -43 7 -46 9 -40 15 -38 9 -32 3 -35 -2 -31 -7 -36Z',f.hi,f.line,.65);
    p.line('M-8 -41L-5 -37 1 -38',f.shade,.7);
  }
  function monkeyCap(p,c,v) {
    p.path('M-13 -38L-18 -62Q1 -68 18 -60L12 -37Z',material('#d8b36e','#b58b42',[-17,-64,16,-39]),'#8b713e',.9);
    p.path('M-19 -63Q0 -70 20 -62L19 -57Q0 -63 -17 -58Z','#e8cb83','#9d844c',.7);
    p.line('M-10 -59L-7 -41M0 -61L1 -41M11 -58L8 -40','#927443',.85);
    p.path('M-18 -39Q0 -46 18 -39L19 -34Q1 -40 -18 -33Z',c.belt,c.gold,.9);
    p.line('M-24 -43L26 -49',c.gold,1.9);p.ellipse(28,-49,2.6,2.8,c.gold,c.armor,.55);
  }
  function monkeyHead(p,c,m,v) {
    const f=FACE.monkey;
    p.ellipse(-33,-10,13,13,material('#edd3b5',f.cream,[-44,-23,-22,2]),f.line,1);
    p.ellipse(33,-10,12,12,material('#efdbc0',f.cream,[23,-20,44,2]),f.line,1);
    p.line('M-38 -12Q-29 -17 -27 -7M-35 -6L-31 -10M29 -14Q35 -18 38 -9',f.line,.85);
    p.path(v.side?'M-28 -24Q-20 -41 0 -40Q25 -42 30 -23L32 -2Q45 -1 51 12Q60 30 35 39Q14 46 -8 39Q-29 34 -34 13L-31 3Z':'M-26 -28Q-18 -42 2 -41Q26 -40 30 -19L30 1 34 18 29 17 30 27 24 24Q14 39 0 40Q-16 39 -28 26L-34 27 -32 17 -38 19 -32 6Z',faceMaterial(f),f.line,1.1);
    if(v.back){backTexture(p,f,c.kind,v);}else{
      const nx=1+v.turn*24;
      eyePair(p,c,v,m,{y:-9,span:14,width:.85,height:.95});
      p.path(`M${nx-28} 4Q${nx-14} -4 ${nx+3} -3Q${nx+22} -1 ${nx+32} 12Q${nx+41} 30 ${nx+19} 39Q${nx+2} 45 ${nx-18} 37Q${nx-38} 29 ${nx-34} 17Z`,material('#ead0b0','#ceb08e',[nx-31,-2,nx+32,40]),f.line,.9);
      p.path(`M${nx-11} 9Q${nx+1} 2 ${nx+14} 9Q${nx+14} 14 ${nx+2} 21Q${nx-9} 17 ${nx-11} 9Z`,'#82423a',null);
      p.ellipse(nx,9,3.2,1,'#b67760');
      p.line(`M${nx+2} 21L${nx+2} 25M${nx-24} 26Q${nx-4} 42 ${nx+27} 24`,f.line,1.05);
      p.line(`M${nx-25} 23L${nx-24} 29M${nx+27} 21L${nx+28} 26`,f.line,.85);
      p.path(`M${nx-20} 32Q${nx-2} 42 ${nx+18} 32Q${nx-2} 45 ${nx-20} 32Z`,'#c4a588',null);
    }
    monkeyCap(p,c,v);
  }
  function pandaCap(p,c,v) {
    p.path('M-13 -35Q-23 -46 -13 -57Q-4 -65 8 -57Q18 -48 12 -37Z',material('#b2dfe4','#7fb5c5',[-17,-61,13,-34]),'#6e929b',.85);
    p.path('M-25 -35Q-6 -43 20 -35Q23 -28 13 -25Q0 -23 -11 -28Q-22 -25 -25 -35Z',material('#abd5dc','#7eafb9',[-22,-40,20,-25]),'#6d8b94',.8);
    p.line('M-21 -34Q-6 -32 1 -30Q10 -31 17 -34','#c9d9bf',1);
  }
  function pandaHead(p,c,m,v) {
    const f=FACE.panda;
    p.ellipse(-29,-27,12,14,material('#3f5158','#202d32',[-39,-38,-20,-14]),'#283a3d',1);
    p.ellipse(29,-29,13,14,material('#445860','#233136',[20,-38,38,-16]),'#283a3d',1);
    p.path(v.side?'M-28 -26Q-15 -41 6 -35Q27 -32 32 -12L34 6 43 13Q46 26 33 31Q17 38 -5 36L-23 36 -22 32Q-36 24 -36 9Q-38 -10 -28 -26Z':'M-28 -27Q-13 -40 8 -35Q29 -33 35 -12L37 8Q42 25 30 32L25 36 24 33Q5 41 -15 36L-24 36 -24 32 -31 33 -29 28Q-41 16 -36 -3Z',faceMaterial(f),f.line,1.05);
    if(v.back){backTexture(p,f,c.kind,v);}else{
      const nx=1+v.turn*25;
      eyePair(p,c,v,m,{y:-1,span:17,width:.87,height:.9});
      p.path(`M${nx-9} -13Q${nx-15} -18 ${nx-15} -23Q${nx-10} -24 ${nx-8} -15Z`,'#a3483e',null);
      p.path(`M${nx+1} -14Q${nx+3} -25 ${nx+7} -25Q${nx+12} -22 ${nx+4} -13Z`,'#a3483e',null);
      p.path(`M${nx-7} 15Q${nx} 10 ${nx+8} 14Q${nx+7} 21 ${nx+1} 22Q${nx-5} 21 ${nx-7} 15Z`,'#b14c43',null);
      p.ellipse(nx,14.5,2.1,.85,'#cf8270');
      p.line(`M${nx-3} 30Q${nx+3} 27 ${nx+8} 30`,'#9eaaa0',.8);
      p.path('M-27 24Q-11 34 5 33Q22 32 31 24Q21 38 4 38Q-14 37 -27 29Z',material('#fdfaed','#e1e4d6',[-25,24,30,37]),null);
      p.line(`M${nx-3} 30Q${nx+3} 27 ${nx+8} 30`,'#9eaaa0',.8);
    }
    pandaCap(p,c,v);
  }
  const HEAD_DRAWERS={cat:catHead,rabbit:rabbitHead,squirrel:squirrelHead,dog:dogHead,bear:bearHead,monkey:monkeyHead,panda:pandaHead};
  function head(p,c,m) {
    const turn=m.profile,side=turn>.9,front=Math.abs(m.dy)>.9;
    const v={turn,side,front,back:m.back};
    const scale=(m.dx<-.1?-1:1)*(c.head/36)*(.83+.17*Math.abs(m.dy));
    const y=c.kind==='bear'?-253:c.kind==='dog'?-247:-248;
    p.group(m.dx*3.3,y,-m.lean*.23,scale,1,()=>HEAD_DRAWERS[c.kind](p,c,m,v));
  }


  function paintHero(p,id,dir,t,options={}) {
    const base=HEROES[id]||HEROES.hongmao,ss=options.swordState||options.equipment&&options.equipment.swordState||{},eq=options.equipment||{};
    const hand=options.hand||eq.hand||ss.hand;
    const type=typeof eq==='string'?eq:eq.type||((ss.status==='sealed'&&id==='daben')?'staff':['左手剑','剑冢左手剑'].includes(ss.weaponName)||ss.status==='sealed'?'plain':['lost','training'].includes(ss.status)?'wood':'sword');
    const c=Object.assign({},base,{hand:hand==='left'?1:hand==='right'?-1:base.hand,weaponType:type,injuredRight:id==='sali'&&['lost','training'].includes(ss.status)}),m=motion(dir,t,options);
    if(!options.portrait)p.alpha(.16,()=>p.ellipse(0,3,c.w*.98,7.2,'#2c4b37'));
    p.group(0,-m.bob,0,1,1,()=>{
      tail(p,c,m);
      if(c.kind==='cat'||c.kind==='monkey'){
        ribbon(p,c,-c.w*m.cross,-210,-1,m,false);
        ribbon(p,c,c.w*m.cross-5,-143,1,m,true);
      }
      if(c.kind==='rabbit'){
        ribbon(p,c,-20*m.cross,-181,-1,m,true);
        ribbon(p,c,19*m.cross,-147,1,m,true);
      }
      if(c.kind==='squirrel'||c.kind==='dog'||c.kind==='panda')ribbon(p,c,-18*m.cross,-205,-1,m,c.kind!=='dog');
      scabbard(p,c,m);
      coat(p,c,m,true);
      const far=m.dx>=0?1:-1;
      leg(p,c,m,far);leg(p,c,m,-far);
      p.group(0,-136,m.lean,1,1,()=>p.group(0,136,0,1,1,()=>{
        arm(p,c,m,far);
        coat(p,c,m,m.back);
        torso(p,c,m);
        belt(p,c,m);
        arm(p,c,m,-far);
        head(p,c,m);
      }));
    });
  }

  function heroSVG(id,options={}) {
    id=HEROES[id]?id:'hongmao';
    const p=new SVGBrush();
    const direction=Number.isFinite(options.direction)?options.direction:Math.PI/2;
    // Frame each existing front-facing head around its ears, crown and chin.
    // Rabbit ears need more headroom than the cat and bear portraits.
    const framing={hongmao:[2.14,671],lantu:[1.56,555],sali:[1.94,625],doudou:[2.12,670],daben:[1.99,664],tiaotiao:[2.08,670],dada:[2.07,664]};
    if(options.portrait){const [scale,y]=framing[id];p.group(120,y,0,scale,scale,()=>paintHero(p,id,direction,1.37,Object.assign({},options,{portrait:true})));}
    else p.group(120,349,0,1,1,()=>paintHero(p,id,direction,1.37,Object.assign({state:'idle'},options)));
    return p.finish(options,HEROES[id].name);
  }
  function drawHero(ctx,id,x,y,size=100,dir=Math.PI/2,t=0,options={}) {
    if(typeof dir!=='number')dir=Math.atan2(dir&&dir.y||0,dir&&dir.x||1);
    ctx.save();ctx.translate(x,y);ctx.scale(size/335,size/335);ctx.lineCap='round';ctx.lineJoin='round';
    paintHero(new CanvasBrush(ctx),id,dir,t,options||{});
    ctx.restore();
  }
  window.GameArt=window.GameArt||{};
  window.GameArt.heroSVG=heroSVG;
  window.GameArt.drawHero=drawHero;
  window.GameArt.spriteVersion=9;
})();
