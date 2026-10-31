(function(){'use strict';
const TAU=Math.PI*2;
const translate=value=>window.GameI18n?.t(value)??value;
const FRONTIER_SITES=[[11,0],[-11,0],[0,11],[0,-11]];
const FRONTIER_TYPES=['frontierForge','frontierBattery','frontierHabitat','frontierRelay'];
const FRONTIER_NAMES=['铸造工业岛','重装防卫岛','生态栖居岛','远海中继岛'];
class Renderer{
constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.w=1;this.h=1;this.scale=35;this.zoom=1;this.cx=0;this.cy=0;this.t=0;this.drawer=false;this.occlusionFades=new Map();this.occlusionLayer=null;this.resize();}
resize(){const r=this.canvas.getBoundingClientRect(),d=Math.min(2,window.devicePixelRatio||1);if(this.w===r.width&&this.h===r.height&&this.canvas.width===Math.round(r.width*d)&&this.canvas.height===Math.round(r.height*d))return;this.w=r.width;this.h=r.height;this.canvas.width=Math.round(r.width*d);this.canvas.height=Math.round(r.height*d);this.ctx.setTransform(d,0,0,d,0,0);}
p(x,y,z=0){return {x:this.cx+(x-y)*this.scale,y:this.cy+(x+y)*this.scale*.47-z*this.scale,depth:x+y};}
screenToWorld(x,y){const a=(x-this.cx)/this.scale,b=(y-this.cy)/(this.scale*.47);return{x:(a+b)/2,y:(b-a)/2};}
poly(points,fill,stroke){this.paintPrimitive(points,c=>{c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}});}
line(points,color,width=1){this.paintPrimitive(points,c=>{c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();},'line',width);}

box(x,y,w,d,h,col,z=0){const a=this.p(x-w/2,y-d/2,z),b=this.p(x+w/2,y-d/2,z),c=this.p(x+w/2,y+d/2,z),dd=this.p(x-w/2,y+d/2,z);const t=[this.p(x-w/2,y-d/2,z+h),this.p(x+w/2,y-d/2,z+h),this.p(x+w/2,y+d/2,z+h),this.p(x-w/2,y+d/2,z+h)];this.poly([b,c,t[2],t[1]],col[1]||col[0]);this.poly([c,dd,t[3],t[2]],col[2]||col[0]);this.poly(t,col[0],col[3]);}
circle(x,y,z,r,color,ratio=1){const p=this.p(x,y,z),rx=Math.max(0,r*this.scale),ry=Math.max(0,r*this.scale*ratio);if(![p.x,p.y,rx,ry].every(Number.isFinite))return;this.paintPrimitive([p],c=>{c.beginPath();c.ellipse(p.x,p.y,rx,ry,0,0,TAU);c.fillStyle=color;c.fill();},'ellipse',[rx,ry]);}
ring(x,y,z,r,color,width=1,ratio=.47){const p=this.p(x,y,z),rx=Math.max(0,r*this.scale),ry=Math.max(0,r*this.scale*ratio);if(![p.x,p.y,rx,ry].every(Number.isFinite))return;this.paintPrimitive([p],c=>{c.beginPath();c.ellipse(p.x,p.y,rx,ry,0,0,TAU);c.strokeStyle=color;c.lineWidth=width;c.stroke();},'ellipse',[rx+width/2,ry+width/2]);}

pole(x,y,h,col='#a4c3c9',z=0,w=.065){this.line([this.p(x,y,z),this.p(x,y,z+h)],col,Math.max(1.5,this.scale*w));}
label(text,x,y,z,color='#cceff0',size=10){const p=this.p(x,y,z),c=this.ctx;c.font=`600 ${size}px system-ui`;c.textAlign='center';c.fillStyle=color;c.fillText(translate(text),p.x,p.y);}
sea(s){const c=this.ctx,g=c.createLinearGradient(0,0,0,this.h);g.addColorStop(0,s.storm>0?'#103841':'#0d4c5b');g.addColorStop(.55,s.storm>0?'#164b57':'#1c7280');g.addColorStop(1,'#062f43');c.fillStyle=g;c.fillRect(0,0,this.w,this.h);const t=this.t;for(let i=0;i<55;i++){const x=((i*157.37+t*7)% (this.w+120))-60,y=((i*89.3)%this.h);c.strokeStyle=i%4===0?'#87d6d324':'#c5eee817';c.lineWidth=i%4===0?2:1;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+10,y-4,x+25,y+4,x+45,y);c.stroke();}const p=this.p(0,0);const glow=c.createRadialGradient(p.x,p.y,20,p.x,p.y,this.scale*13);glow.addColorStop(0,'#a4ecd118');glow.addColorStop(1,'#a4ecd100');c.fillStyle=glow;c.fillRect(0,0,this.w,this.h);if(s.stage>=4){for(let i=0;i<8;i++)this.circle(Math.sin(i*7+t*.03)*12,Math.cos(i*9+t*.03)*12,0,.07,'#87e5cf55');}}
deck(s){const r=Tideborn.radius(s)+.5,t=s.tech.house;this.ring(0,0,-.3,r*1.42,'#9be2d337',3);this.box(0,0,r*2+.15,r*2+.15,.3,t>=4?['#405764','#172f41','#213e4b']:t>=2?['#657b7f','#304f58','#3c555b']:['#b4905f','#74583b','#8b6a46'],-.34);for(let x=-r+.07;x<r;x+=1)for(let y=-r+.07;y<r;y+=1){let col=t>=4?((Math.floor(x+y)&1)?'#526a73':'#49636e'):t>=2?((Math.floor(x+y)&1)?'#7c9290':'#738987'):((Math.floor(x+y)&1)?'#c6a275':'#ba9564');this.poly([this.p(x,y),this.p(Math.min(r,x+.93),y),this.p(Math.min(r,x+.93),Math.min(r,y+.93)),this.p(x,Math.min(r,y+.93))],col);if(t<2)this.line([this.p(x+.4,y+.1),this.p(x+.4,Math.min(r,y+.8))],'#75593860',1);}
if(t>=1){for(let a=-r+.4;a<r;a+=1.5){this.pole(a,-r,.55,t>=3?'#adced0':'#8d6c46');this.pole(-r,a,.55,t>=3?'#adced0':'#8d6c46');}this.line([this.p(-r,-r,.48),this.p(r,-r,.48)],'#bcc8b3',2);this.line([this.p(-r,-r,.48),this.p(-r,r,.48)],'#bcc8b3',2);}if(t>=4){for(let a=-r+.3;a<r;a+=1.25){this.box(a,r,.65,.25,.26,['#839ca2','#1b3544','#315969']);this.box(r,a,.25,.65,.26,['#839ca2','#1b3544','#315969']);}this.line([this.p(-r,r,.1),this.p(r,r,.1),this.p(r,-r,.1)],t>=6?'#71fbdc':'#72c3d2',2);for(const [x,y]of[[-r,-r],[r,-r],[-r,r],[r,r]]){this.box(x,y,.7,.7,.4,['#a4b5b8','#314853','#405e67']);this.circle(x,y,.43,.13,'#9fffd8');}}
if(t<2){for(let a=-r+.4;a<r;a+=1.5){this.box(a,r+.15,.8,.38,.28,['#b4baa1','#555f53','#879077'],-.4);this.box(r+.15,a,.38,.8,.28,['#b4baa1','#555f53','#879077'],-.4);}}}
deckDetails(s){
 const r=Tideborn.radius(s)+.5,t=s.tech.house;
 // Edge beams, fastening plates and layered flotation distinguish a constructed raft from a flat grid.
 for(const axis of[0,1]){const p=(d,z)=>axis===0?this.p(d,r,z):this.p(r,d,z);this.line([p(-r,-.05),p(r,-.05)],t>=2?'#c1d0bb':'#e2bd87',Math.max(1.5,this.scale*.045));this.line([p(-r,-.29),p(r,-.29)],t>=2?'#1d3d52':'#604b37',Math.max(2,this.scale*.06));for(let d=-r+.3;d<r;d+=1.5){const x=axis===0?d:r,y=axis===0?r:d;if(t<2){this.box(x,y,.16,.16,.32,['#b4b697','#4b6158','#7a8c75'],-.32);this.line([p(d-.08,-.25),p(d+.08,-.05)],'#d3c596',Math.max(.8,this.scale*.025));}else{this.circle(x,y,.035,.035,'#d4d7b8',.5);}}}
 if(t<2){for(const a of[-1,1])for(const q of[-1,1]){this.box(a*(r-.18),q*(r-.18),.18,.18,.32,['#c7ac74','#795d3e','#a98b59'],.015);this.ring(a*(r-.18),q*(r-.18),.22,.15,'#e3d3a1',Math.max(1,this.scale*.035));}}
 if(!t){this.shadow(-.7,-.62,.71,.48,.3);this.box(-.7,-.62,.65,.42,.15,['#83aca0','#3d6976','#64918f'],.05);this.line([this.p(-.85,-.84,.22),this.p(-.85,-.4,.22)],'#ddc995',Math.max(1,this.scale*.04));this.line([this.p(-.56,-.84,.22),this.p(-.56,-.4,.22)],'#ddc995',Math.max(1,this.scale*.04));this.box(.68,-.65,.35,.39,.23,['#d2bd8b','#7d755a','#a99e75'],.035);this.line([this.p(.51,-.45,.19),this.p(.85,-.45,.19)],'#6e7f76',Math.max(1,this.scale*.035));}
}
// The main ark keeps its original radius. Every outpost is a separate five-tile platform.
frontierSites(s){
 if(s.stage<6)return;
 const c=this.ctx,islands=s.buildings.filter(b=>b.type==='island');
 FRONTIER_SITES.forEach(([x,y],i)=>{
  if(islands.some(b=>Math.hypot(b.x-x,b.y-y)<.6))return;
  const next=i===islands.length,alpha=next?.48:.22;
  c.save();c.globalAlpha=alpha;c.setLineDash([4,6]);
  this.poly([this.p(x-2.5,y-2.5),this.p(x+2.5,y-2.5),this.p(x+2.5,y+2.5),this.p(x-2.5,y+2.5)],'#91cfc908','#a4ddcb');
  const dx=Math.sign(x),dy=Math.sign(y);
  this.line([this.p(dx*7.5,dy*7.5),this.p(dx*8.5,dy*8.5)],'#c5e0c7',2);
  c.setLineDash([]);
  for(const a of[-1,1])for(const b of[-1,1]){
   this.line([this.p(x+a*1.9,y+b*2.5),this.p(x+a*2.5,y+b*2.5),this.p(x+a*2.5,y+b*1.9)],'#d0ead2',1.5);
  }
  this.line([this.p(x-.28,y),this.p(x+.28,y)],'#d0e8d1',1.3);
  this.line([this.p(x,y-.28),this.p(x,y+.28)],'#d0e8d1',1.3);
  this.label(String(i+1).padStart(2,'0')+' · 待建海台',x,y+.9,0,'#d7ebd5',this.w<760?8:10);
  c.restore();
 });
}
frontierBridge(b){
 const dx=Math.sign(b.x),dy=Math.sign(b.y),nx=-dy,ny=dx,start=7.12,end=8.67;
 const point=(d,w,z=0)=>this.p(dx*d+nx*w,dy*d+ny*w,z);
 const mid=(start+end)/2,len=end-start;
 this.box(dx*mid,dy*mid,dx?len:1.3,dx?1.3:len,.2,['#829998','#284b5b','#436975'],-.17);
 for(let d=start;d<end;d+=.22)this.line([point(d,-.6,.045),point(d,.6,.045)],'#b9c6b35c',1);
 for(const side of[-1,1]){
  const w=side*.67;
  this.line([point(start,w,-.32),point(end,w,-.32)],'#233f50',Math.max(2,this.scale*.11));
  this.line([point(start,w,.6),point(end,w,.6)],'#c3d7c9',Math.max(1.5,this.scale*.055));
  this.line([point(start,w,.06),point(end,w,.06)],'#75c1bd',1.5);
  for(let d=start;d<end-.05;d+=.5){
   const dd=Math.min(end,d+.5);
   this.line([point(d,w,.6),point(d,w,-.32),point(dd,w,.6),point(dd,w,-.32)],'#6f929b',Math.max(1,this.scale*.045));
  }
  this.circle(dx*end+nx*w,dy*end+ny*w,.66,.07,'#c9ffe1');
 }
 // Moving guide lights make the utility connection readable without implying extra terrain.
 const a=start+((this.t*.36)%1)*len;
 this.circle(dx*a,dy*a,.07,.075,'#b4f8d7',.5);
}
frontierPlatform(b,s){
 const x=b.x,y=b.y,c=this.ctx,i=FRONTIER_SITES.findIndex(p=>Math.hypot(p[0]-x,p[1]-y)<.6),accent=['#f6c681','#91e7e8','#b7e4ab','#bcaaf2'][Math.max(0,i)];
 this.ring(x,y,-.43,3.4,'#9de6d326',2);
 for(const a of[-1,1])for(const q of[-1,1]){
  const px=x+a*1.96,py=y+q*1.96;
  this.circle(px,py,-1.02,.55,'#032b3f73',.47);
  this.box(px,py,.76,.76,.2,['#527684','#183b51','#285165'],-1.02);
  this.box(px,py,.4,.4,.97,['#99b8bc','#2b5368','#476f7d'],-.84);
  this.line([this.p(px-.21,py+.22,-.64),this.p(px+.21,py+.22,-.1)],'#afd1cd',1.2);
 }
 for(const a of[-1,1]){
  this.line([this.p(x-1.95,y+a*1.95,-.75),this.p(x+1.95,y+a*1.95,-.1)],'#3a6677',Math.max(2,this.scale*.09));
  this.line([this.p(x-1.95,y+a*1.95,-.1),this.p(x+1.95,y+a*1.95,-.75)],'#597f8a',Math.max(2,this.scale*.09));
 }
 this.box(x,y,5,5,.3,['#607b85','#1b3c51','#365d70'],-.28);
 for(let a=-2;a<=2;a++)for(let q=-2;q<=2;q++)this.box(x+a,y+q,.94,.94,.035,[(a+q)%2?'#708b90':'#789095','#455e6d','#4b707b'],.025);
 // Narrow perimeter cap, with a genuine opening facing the connecting bridge.
 for(const axis of[0,1])for(const side of[-1,1])for(let d=-2;d<=2;d++){
  const inward=axis===0&&x&&side===-Math.sign(x)||axis===1&&y&&side===-Math.sign(y);
  if(inward&&Math.abs(d)<1)continue;
  const px=x+(axis===0?side*2.48:d),py=y+(axis===1?side*2.48:d);
  const rim=inward&&Math.abs(d)===1?.62:.88;
  this.box(px,py,axis===0?.14:rim,axis===1?.14:rim,.22,['#bfd0c7','#355769','#6a8990'],.045);
  if(d%2===0)this.circle(px,py,.29,.055,accent);
 }
 for(const a of[-1,1])for(const q of[-1,1]){
  this.box(x+a*2.36,y+q*2.36,.33,.33,.4,['#c2d2c7','#31596d','#5e838c'],.04);
  this.circle(x+a*2.36,y+q*2.36,.48,.095,accent,.55);
 }
 this.line([this.p(x-2.48,y+2.5,.045),this.p(x+2.5,y+2.5,.045),this.p(x+2.5,y-2.48,.045)],accent,1.5);
 if(i>=0&&!s.buildings.some(q=>q.type===FRONTIER_TYPES[i])){
  c.save();c.setLineDash([3,4]);this.poly([this.p(x-1.55,y-1.5,.07),this.p(x+1.55,y-1.5,.07),this.p(x+1.55,y+1.5,.07),this.p(x-1.55,y+1.5,.07)],null,'#c6e3cd66');c.restore();
  this.label(FRONTIER_NAMES[i],x,y,.12,'#d9e8d1',this.w<760?8:10);
 }
}
frontierLabel(b,text,color){
 const p=this.p(b.x,b.y+2.7,-.08),c=this.ctx,size=this.w<760?8:10;
 c.save();c.font=`600 ${size}px system-ui`;const w=c.measureText(translate(text)).width+12;
 c.fillStyle='#072f40d9';c.fillRect(p.x-w/2,p.y-1,w,size+8);c.textAlign='center';c.fillStyle=color;c.fillText(translate(text),p.x,p.y+size+1);c.restore();
}
frontierFacility(b,s){
 const x=b.x,y=b.y,c=this.ctx,levels=s.frontier?.levels||{},on=s.power>1||s.frontier?.active,pulse=.72+Math.sin(this.t*2.6)*.22;
 const stone=['#bacdca','#285368','#537b89'],dark=['#416b7e','#183a50','#315666'];
 if(b.type==='frontierForge'){
  this.box(x,y,3.8,3.65,.18,dark,.08);
  this.box(x-.65,y-.17,1.7,2.1,1.18,stone,.26);
  this.poly([this.p(x-1.42,y+.91,.43),this.p(x+.07,y+.91,.43),this.p(x+.07,y+.91,1.16),this.p(x-1.42,y+.91,1.16)],on?'#eea85c':'#9c7358','#f7d997');
  for(let i=0;i<4;i++)this.line([this.p(x-1.24+i*.33,y+.93,.48),this.p(x-1.24+i*.33,y+.93,1.13)],'#644a41',Math.max(1,this.scale*.07));
  this.box(x-.67,y-.17,1.97,2.34,.14,['#d9dbbf','#637879','#92a5a0'],1.43);
  for(let i=0;i<2;i++){
   const px=x-1.08+i*.73,z=2.4-i*.28;
   this.box(px,y-.67,.43,.55,z-1.58,dark,1.58);
   this.box(px,y-.67,.56,.68,.13,stone,z);
   this.circle(px,y-.67,z+.15,.17,on?'#ffd7a0':'#987d67',.45);
   if(on){const t=(this.t*.45+i*.5)%1;this.circle(px-.16*t,y-.67,z+.25+t*.65,.12+t*.12,`rgba(204,228,206,${.25*(1-t)})`,.85);}
  }
  this.box(x+1.12,y+.12,.85,3.25,.28,dark,.28);
  for(let i=0;i<12;i++)this.line([this.p(x+.76,y-1.35+i*.26,.59),this.p(x+1.48,y-1.35+i*.26,.59)],'#a2bdba',Math.max(1,this.scale*.04));
  for(let i=0;i<3;i++)this.box(x+1.12,y-1.2+((this.t*.48+i*.9)%2.7),.45,.42,.23,['#f1cd87','#9b7a53','#c9aa75'],.6);
  for(const a of[-1.65,1.65]){
   this.box(x+a,y-.96,.22,.32,2.94,['#d8c088','#5f6a69','#998e72'],.23);
   this.line([this.p(x+a,y-1.3,.35),this.p(x+a,y-.96,2.15)],'#e1c997',Math.max(1,this.scale*.06));
  }
  this.box(x,y-.96,3.65,.39,.25,['#f0d497','#7a7768','#bba87e'],3.16);
  const trolley=x+Math.sin(this.t*.44)*1.13;
  this.box(trolley,y-.96,.52,.51,.2,dark,3.18);
  this.line([this.p(trolley,y-.96,3.12),this.p(trolley,y-.96,1.91+Math.sin(this.t*.8)*.12)],'#dfdaca',1.1);
  this.line([this.p(trolley,y-.96,1.98),this.p(trolley+.13,y-.96,1.88),this.p(trolley+.22,y-.96,1.99)],'#f3cf83',2);
  this.box(x-.6,y+1.35,1.7,.31,.24,dark,.28);
  for(let i=0;i<3;i++)this.circle(x-1.14+i*.48,y+1.53,.48,.08,on?'#a5f2c5':'#597f7e');
  if((levels.industry||0)>0)this.box(x-1.38,y+1.45,.51,.53,.3,['#f3d9a0','#9a8d65','#b9ad82'],.51);
  this.frontierLabel(b,'01 · 铸造工业 '+(levels.industry||0), '#f0d499');
 }else if(b.type==='frontierBattery'){
  this.box(x,y,3.9,3.5,.24,dark,.09);
  this.poly([this.p(x-1.8,y-1.25,.35),this.p(x-1.2,y-1.83,.35),this.p(x+1.2,y-1.83,.35),this.p(x+1.8,y-1.25,.35),this.p(x+1.8,y+1.2,.35),this.p(x+1.2,y+1.72,.35),this.p(x-1.2,y+1.72,.35),this.p(x-1.8,y+1.2,.35)],'#809fa4','#b6d8cf');
  this.box(x,y+.9,1.22,.82,.55,stone,.35);
  this.poly([this.p(x-.5,y+1.32,.49),this.p(x+.5,y+1.32,.49),this.p(x+.5,y+1.32,.76),this.p(x-.5,y+1.32,.76)],'#75d2d0');
  const target=s.enemies.find(e=>e.kind==='abyssTitan')||s.enemies.find(e=>Math.hypot(e.x-x,e.y-y)<28),a=target?Math.atan2(target.y-y,target.x-x):Math.atan2(y,x),dx=Math.cos(a),dy=Math.sin(a);
  for(const side of[-1,1]){
   const px=x+side*.91,py=y-.12;
   this.box(px,py,.95,1.2,.5,stone,.38);this.ring(px,py,.91,.47,'#c4e0d6',Math.max(1,this.scale*.075));
   this.box(px,py,.61,.74,.48,['#d3e5d9','#3b687d','#78a3ac'],.9);
   for(const offset of[-.16,.16]){
    const sx=px-dy*offset,sy=py+dx*offset;
    this.line([this.p(sx-dx*.18,sy-dy*.18,1.2),this.p(sx+dx*1.85,sy+dy*1.85,1.38)],'#24435a',Math.max(3,this.scale*.22));
    this.line([this.p(sx+dx*.2,sy+dy*.2,1.26),this.p(sx+dx*1.8,sy+dy*1.8,1.44)],on?'#9debe2':'#799ea6',Math.max(1.5,this.scale*.09));
    this.circle(sx+dx*1.83,sy+dy*1.83,1.43,.09,'#dbffe5');
   }
   this.ring(px,py,1.18,.33,'#7eeddf',1.3);
   this.box(px,y-1.3,.67,.6,.46,dark,.37);
   for(const o of[-.16,.16])this.circle(px+o,y-1.3,.86,.11,'#d7c594',.5);
  }
  this.pole(x,y-1.38,2.0,'#b4cfce',.3,.08);this.ring(x,y-1.38,2.27,.42,'#91e4df',1.5,.55);
  const a1=this.t*.8;this.line([this.p(x,y-1.38,2.27),this.p(x+Math.cos(a1)*.42,y-1.38+Math.sin(a1)*.42,2.27)],'#d3ffe6',1.5);
  this.frontierLabel(b,'02 · 轨道防卫 '+(levels.arsenal||0),'#a8ebec');
 }else if(b.type==='frontierHabitat'){
  this.box(x,y,3.85,3.8,.17,stone,.09);
  for(const side of[-1,1]){
   const px=x+side*.89,py=y-.48,h=side<0?2.25:1.74;
   this.box(px,py,1.5,2.05,h,['#dde1c8','#426d7b','#739e9f'],.26);
   for(let floor=0;floor<(side<0?3:2);floor++){
    const z=.53+floor*.63;
    for(let w=0;w<3;w++){
     const xx=px-.57+w*.41;
     this.poly([this.p(xx,py+1.03,z),this.p(xx+.27,py+1.03,z),this.p(xx+.27,py+1.03,z+.34),this.p(xx,py+1.03,z+.34)],floor%2===0?'#efdaad':'#a6e0ce','#bed5c7');
    }
    this.line([this.p(px+.76,py-.85,z),this.p(px+.76,py+.87,z)],'#b4e1d0',1.5);
   }
   this.box(px,py,1.7,2.23,.12,['#dce6d2','#587e85','#a0b9b0'],h+.27);
   for(let panel=0;panel<3;panel++)this.box(px-.45+panel*.44,py-.27,.36,1.13,.055,['#4b8996','#28586e','#376d7d'],h+.4);
  }
  this.box(x,y-.7,.47,.8,.15,stone,1.67);
  this.poly([this.p(x-.26,y-.29,1.83),this.p(x+.26,y-.29,1.83),this.p(x+.26,y-.29,2.21),this.p(x-.26,y-.29,2.21)],'#a3e0d599','#c9e9d5');
  this.box(x+.64,y+1.16,1.65,1.17,.16,['#bad3ae','#466e62','#7da185'],.25);
  for(let i=0;i<6;i++)this.circle(x+.1+(i%3)*.51,y+.93+Math.floor(i/3)*.49,.69,.21,['#75c28c','#a5d099','#52aa86'][i%3],.75);
  this.poly([this.p(x-.25,y+.48,.43),this.p(x+1.52,y+.48,.43),this.p(x+1.52,y+1.06,1.39),this.p(x-.25,y+1.06,1.39)],'#b3f3e037','#c8e8d6');
  this.poly([this.p(x-.25,y+1.06,1.39),this.p(x+1.52,y+1.06,1.39),this.p(x+1.52,y+1.84,.43),this.p(x-.25,y+1.84,.43)],'#b3f3e022','#baded3');
  for(const xx of[-.25,.63,1.52])this.line([this.p(x+xx,y+.48,.43),this.p(x+xx,y+1.06,1.39),this.p(x+xx,y+1.84,.43)],'#cfe8cf',1);
  this.box(x-1.19,y+1.16,.71,.69,.29,['#c4c9a4','#617966','#91a78a'],.26);this.pole(x-1.19,y+1.16,.84,'#a2aa77',.55,.08);
  for(const a of[-.2,.2])this.circle(x-1.19+a,y+1.16,1.27,.37,a<0?'#86c18c':'#a3d6a0',.8);
  const walk=(this.t*.13)%1;
  this.box(x-.18-walk*.7,y+1.79,.11,.12,.23,['#f1d48e','#aa8656','#c8b17d'],.28);this.circle(x-.18-walk*.7,y+1.79,.58,.09,'#eee3ba');
  this.frontierLabel(b,'03 · 生态栖居 '+(levels.habitat||0),'#c7e9af');
 }else if(b.type==='frontierRelay'){
  const complete=!!s.frontier?.bossDefeated,accent=complete?'#ffe3a2':'#bdb0fa';
  this.box(x,y,3.6,3.6,.2,dark,.09);this.box(x,y,1.52,1.52,.66,stone,.31);
  for(const a of[-1,1])for(const q of[-1,1]){
   const px=x+a*1.2,py=y+q*1.2;
   this.box(px,py,.43,.43,.39,stone,.31);
   this.line([this.p(px,py,.7),this.p(x+a*.2,y+q*.2,3.55)],'#a9c9ca',Math.max(1.5,this.scale*.1));
   this.line([this.p(px,py,.72),this.p(x-a*.43,y+q*.43,2.89)],'#648ea2',Math.max(1,this.scale*.045));
   this.circle(px,py,.75,.09,accent);
  }
  this.ring(x,y,1.03,.56,accent,Math.max(2,this.scale*.085));this.circle(x,y,1.14,.36,on?'#a8f2df':'#668c95',.55);
  this.box(x,y,.89,.89,.15,['#d1dfcf','#426777','#80a2a4'],2.72);
  this.pole(x,y,1.68,'#d8dfd1',2.7,.1);
  for(const z of[3.18,3.56])this.ring(x,y,z,z===3.18?.92:.61,accent,Math.max(1.5,this.scale*.07));
  const a=this.t*.45;
  this.line([this.p(x-Math.cos(a)*.96,y-Math.sin(a)*.96,3.18),this.p(x+Math.cos(a)*.96,y+Math.sin(a)*.96,3.18)],'#eee9c9',Math.max(1.5,this.scale*.07));
  this.circle(x,y,4.4,.2,complete?'#ffe7a7':'#d4c6ff');
  const p=this.p(x,y,4.4),glow=c.createRadialGradient(p.x,p.y,0,p.x,p.y,this.scale*.94);glow.addColorStop(0,complete?'#ffe4a157':'#c9bbff66');glow.addColorStop(1,'#b4a8f000');c.fillStyle=glow;c.fillRect(p.x-this.scale,p.y-this.scale,this.scale*2,this.scale*2);
  if(on){const wave=(this.t*.37)%1;this.ring(x,y,4.4,.35+wave*1.16,`rgba(200,199,253,${(1-wave)*.5})`,1.1);}
  for(const a of[-1,1])this.box(x+a*1.21,y+1.14,.61,.75,.5,['#bdcbca','#31596d','#628b99'],.3);
  this.frontierLabel(b,complete?'04 · 远海灯塔':'04 · 远海中继',accent);
 }
}
chargeWarning(s){
 const titan=s.enemies.find(e=>e.kind==='abyssTitan'&&e.telegraph>0);if(!titan)return;
 const c=this.ctx,r=Tideborn.radius(s)+.38,pulse=.5+.5*Math.sin(this.t*11);
 c.save();c.globalAlpha=.3+pulse*.4;
 this.poly([this.p(-r,-r,.045),this.p(r,-r,.045),this.p(r,r,.045),this.p(-r,r,.045)],'#ff55461a','#ffac82');
 this.ring(0,0,.08,9-pulse*.65,'#ff826b',2.2);
 this.line([this.p(titan.x,titan.y,.1),this.p(0,0,.1)],'#ff987055',Math.max(1,this.scale*.055));
 c.restore();
}
stairs(x,y,z,width,steps=7){for(let i=0;i<steps;i++)this.box(x,y+i*.14,width,.16,.09+i*.125,['#c1b99e','#5c7074','#778987'],z);this.line([this.p(x+width/2,y,.25+z),this.p(x+width/2,y+steps*.14,1.15+z)],'#dbd8bb',1.5);}
houseShadow(s){if(!s.tech.house)return;const t=s.tech.house,w=t>=5?4.6:t>=3?3.6:2.6;this.shadow(0,-.8,w+.45,t>=3?2.75:2.55,2.8);if(t>=5)for(const side of[-1,1])this.shadow(side*3.75,-.75,2.5,3.7,1.8);}
house(s,coreOnly=false){const t=s.tech.house;if(!t)return;const extra=Tideborn.count(s,'floor'),levels=Math.min(5,1+Math.floor(t/2)+Math.min(extra,1)),w=t>=5?4.6:t>=3?3.6:2.6,d=t>=3?2.4:2.2,cx=0,cy=-.8,h=1.48;const cols=t>=5?['#b8ccd0','#264c60','#477184']:t>=3?['#a5c3c8','#385e69','#5f8a91']:t>=2?['#b7bbb0','#53686c','#809396']:['#d7b37a','#8c6a47','#b78b5b'];
if(t>=5&&!coreOnly)this.bastions(s,cols);for(const xx of[-w/2,w/2]){this.line([this.p(xx,cy-d/2,.1),this.p(xx,cy+d/2,.38)],'#3b5860',Math.max(2,this.scale*.065));this.line([this.p(xx,cy-d/2,.38),this.p(xx,cy+d/2,.1)],'#80968c',Math.max(1,this.scale*.035));}
for(const [x,y]of[[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2]])this.box(cx+x,cy+y,.18,.18,.48,cols,-.1);
for(let f=0;f<levels;f++){const z=.38+f*h;this.box(cx,cy,w+.22,d+.22,.12,cols,z);this.line([this.p(cx-w/2-.12,cy+d/2+.12,z+.11),this.p(cx+w/2+.12,cy+d/2+.12,z+.11),this.p(cx+w/2+.12,cy-d/2-.12,z+.11)],t<3?'#f0cc92':'#d6e1c7',Math.max(1,this.scale*.025)); // load-bearing slab
this.poly([this.p(cx-w/2,cy-d/2,z+.12),this.p(cx+w/2,cy-d/2,z+.12),this.p(cx+w/2,cy-d/2,z+h),this.p(cx-w/2,cy-d/2,z+h)],t>=4?'#c4e1de':'#d5c9a5');this.poly([this.p(cx-w/2,cy-d/2,z+.12),this.p(cx-w/2,cy+d/2,z+.12),this.p(cx-w/2,cy+d/2,z+h),this.p(cx-w/2,cy-d/2,z+h)],t>=4?'#a1c6c4':'#b5b8a0');
// Glazed rear windows, strong mullions, and warm inhabited interiors
for(let a=0;a<3;a++){const x=cx-w/2+.28+a*w/3;this.poly([this.p(x,cy-d/2-.01,z+.39),this.p(x+.55,cy-d/2-.01,z+.39),this.p(x+.55,cy-d/2-.01,z+.84),this.p(x,cy-d/2-.01,z+.84)],t>=4?'#399cab':'#618e93','#eff9dc');}this.poly([this.p(cx-w/2-.01,cy-.25,z+.26),this.p(cx-w/2-.01,cy+.45,z+.26),this.p(cx-w/2-.01,cy+.45,z+.93),this.p(cx-w/2-.01,cy-.25,z+.93)],'#729ea1','#ddede4');
if(f%3===0){this.box(cx-.65,cy-.3,.95,.8,.2,['#e8dba4','#a1896b','#b4a083'],z+.13);this.box(cx-.65,cy-.35,.88,.65,.1,['#a8c6b3','#648d88','#83aaa0'],z+.34);this.box(cx-.88,cy-.61,.3,.2,.11,['#f0eee2'],z+.45);this.box(cx+.6,cy-.55,.5,.4,.48,['#af8e63','#655e4e','#9b8262'],z+.13);this.pole(cx+.65,cy-.5,.31,'#e3e1be',z+.6);this.circle(cx+.65,cy-.5,z+.92,.17,'#ffe9a6',.5);}else if(f%3===1){this.box(cx-.5,cy,.95,.56,.1,['#b89466','#6f6658','#977f62'],z+.56);for(const a of[-.8,-.2]){this.pole(a,cy-.18,.43,cols[2],z+.13);this.box(a,cy+.5,.36,.33,.38,['#d4b683','#7c877c','#8c9f92'],z+.13);}this.box(cx+.75,cy-.5,.55,.45,.77,['#b1cbc7','#688c8b','#7ca5a1'],z+.13);for(let a=0;a<3;a++)this.line([this.p(cx+.5,cy-.27,z+.28+a*.21),this.p(cx+1,cy-.27,z+.28+a*.21)],'#d8ece0');}else{this.box(cx-.15,cy,.9,.45,.5,['#d0b885','#536d77','#6c8a8c'],z+.13);this.box(cx-.15,cy-.04,.8,.11,.34,['#7adbcc','#245262','#316776'],z+.63);this.box(cx+.95,cy+.4,.42,.42,.32,['#7ba89e','#658071','#56736a'],z+.13);this.circle(cx+.95,cy+.4,z+.7,.34,'#559f76',.8);}
if(t>=2){this.poly([this.p(cx+w/2,cy-d/2,z+.12),this.p(cx+w/2,cy+d/2,z+.12),this.p(cx+w/2,cy+d/2,z+h),this.p(cx+w/2,cy-d/2,z+h)],t>=5?'#467181':t>=4?'#78a4aa':'#8ea8a3');for(let q=0;q<3;q++){const yy=cy-d/2+.16+q*(d-.2)/3;this.poly([this.p(cx+w/2+.01,yy,z+.34),this.p(cx+w/2+.01,yy+.5,z+.34),this.p(cx+w/2+.01,yy+.5,z+1.08),this.p(cx+w/2+.01,yy,z+1.08)],t>=5?'#9acec6':'#8bbac0','#d1e7d5');this.line([this.p(cx+w/2+.02,yy+.25,z+.35),this.p(cx+w/2+.02,yy+.25,z+1.07)],'#4f8491',1.3);}if(t>=5){this.box(cx+w/2+.08,cy,.16,d+.1,.14,['#a6c2c0','#355b70','#679b9f'],z+1.23);}}
for(const [x,y]of[[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2]])this.pole(cx+x,cy+y,h,cols[2],z+.05,.1);this.line([this.p(cx-w/2,cy+d/2,z+h),this.p(cx+w/2,cy+d/2,z+h),this.p(cx+w/2,cy-d/2,z+h)],cols[1],Math.max(3,this.scale*.1));
// Front cutaway wall is low; door and balcony leave rooms readable
if(t>=3){const fy=cy+d/2-.28;if(f%3===0){this.box(cx-.5,fy,.95,.58,.22,['#e2d4a1','#b49970','#c8b38f'],z+.14);this.box(cx-.5,fy+.04,.86,.45,.09,['#8cc4b7','#548f8b','#80b9ab'],z+.36);this.box(cx-.8,fy-.06,.24,.22,.1,['#f4f1d9'],z+.45);}else if(f%3===1){this.box(cx-.5,fy,.95,.42,.12,['#e6c58b','#aa8e65','#cbb27d'],z+.5);for(const q of[-.88,-.12])this.pole(q,fy,.4,'#879f9e',z+.13,.065);this.box(cx-.5,fy+.12,.2,.18,.14,['#dae4b1','#628e7c','#96ba9c'],z+.62);}else{this.box(cx-.5,fy,.95,.4,.44,['#bddad1','#4d7281','#759b9e'],z+.13);this.poly([this.p(cx-.94,fy+.21,z+.55),this.p(cx-.07,fy+.21,z+.55),this.p(cx-.07,fy+.21,z+.88),this.p(cx-.94,fy+.21,z+.88)],'#64d9c5','#d5ffe4');this.line([this.p(cx-.85,fy+.22,z+.67),this.p(cx-.61,fy+.22,z+.8),this.p(cx-.4,fy+.22,z+.62),this.p(cx-.16,fy+.22,z+.78)],'#e3ffdd',1);}}
if(t>=5){for(const x of[-w/2,w/2])this.box(cx+x,cy+d/2,.3,.36,h,['#a1bac0','#28516a','#47798b'],z+.06);if(f%2===0)this.box(cx+.8,cy+d/2,.82,.18,.59,['#9fbfbe','#3c677c','#5d8591'],z+.12);this.line([this.p(cx-w/2,cy+d/2+.2,z+.16),this.p(cx-w/2,cy+d/2+.2,z+h-.1)],'#90f6d4',1.6);}
this.box(cx,cy+d/2+.12,w+.35,.28,.07,cols,z);for(let a=-w/2-.2;a<=w/2+.2;a+=.6)this.pole(a,cy+d/2+.49,.37,cols[2],z+.08,.035);this.line([this.p(-w/2-.3,cy+d/2+.49,z+.45),this.p(w/2+.3,cy+d/2+.49,z+.45)],'#c8d9d0',1.5);if(f<levels-1)this.stairs(cx+w/2+.4,cy-.9,z+.15,.55,10);if(f===0){this.box(cx+w/2-.03,cy+.6,.1,.55,.85,cols,z+.1);this.pole(cx+w/2,cy+.37,.05,'#fceab4',z+.55,.08);}
if(t>=5)this.line([this.p(cx-w/2,cy+d/2,z+.05),this.p(cx+w/2,cy+d/2,z+.05)],'#81f4de',2);
}
const z=.38+levels*h;if(t<=1){const a=this.p(-w/2-.25,cy-d/2-.2,z),b=this.p(w/2+.25,cy-d/2-.2,z),cc=this.p(w/2+.25,cy+d/2+.2,z),dd=this.p(-w/2-.25,cy+d/2+.2,z),u=this.p(-w/2-.25,cy,z+.6),v=this.p(w/2+.25,cy,z+.6);this.poly([a,b,v,u],'#af6850');this.poly([u,v,cc,dd],'#d18459');this.poly([b,cc,v],'#8f523e');for(let q=0;q<7;q++){const xx=-w/2-.2+q*(w+.4)/6;this.line([this.p(xx,cy,z+.61),this.p(xx,cy+d/2+.2,z+.025)],'#e9aa7a66',Math.max(.7,this.scale*.025));}this.line([u,v],'#e1b680',Math.max(2,this.scale*.065));this.line([dd,cc],'#704e3f',Math.max(2,this.scale*.075));}else{this.box(cx,cy,w+.4,d+.4,.14,cols,z);for(const side of[-1,1])this.box(cx+side*(w/2+.13),cy,.09,d+.3,.16,['#dde1c3','#52737e','#a1b6ad'],z+.14);this.box(cx,cy-d/2-.13,w+.3,.09,.16,['#dde1c3','#52737e','#a1b6ad'],z+.14);if(t>=4){for(let a=0;a<4;a++)this.box(-.95+a*.55,cy-.35,.48,1.2,.06,['#347581','#144457','#235764'],z+.15);this.line([this.p(-1.2,cy-.4,z+.25),this.p(1.2,cy-.4,z+.25)],'#78dbd2',1);}else{this.box(-.6,cy-.25,.85,.7,.4,['#718c85','#4e686a','#5b817a'],z+.14);this.pole(.6,cy-.6,.9,'#a4afb0',z+.14);}}
if(t>=5){this.box(0,cy-.1,2.05,1.18,.67,['#b9cec9','#345c71','#547e8b'],z+.15);this.poly([this.p(-.8,cy+.5,z+.33),this.p(.8,cy+.5,z+.33),this.p(.8,cy+.5,z+.67),this.p(-.8,cy+.5,z+.67)],'#70cec3','#d0ece0');this.box(0,cy-.1,2.3,1.42,.12,['#c8d9d0','#456976','#7d9d9f'],z+.82);for(const x of[-1.5,1.5]){this.box(x,cy-.55,.68,.75,.36,['#ccded5','#33596e','#678d97'],z+.15);this.line([this.p(x,cy-.55,z+.6),this.p(x,cy-1.25,z+.6)],'#aaf3df',3);this.circle(x,cy-.55,z+.63,.07,'#efffe0');}this.pole(0,cy-.9,1.1,'#b1dfdb',z+.15,.09);this.ring(0,cy-.9,z+.8,.42,'#69ead3',2);this.circle(0,cy-.9,z+1.2,.11,'#b0ffdf');}
}
bastions(s,col,part=0){const r=Tideborn.radius(s),extra=Tideborn.count(s,'floor');for(const side of(part===3?[]:part?[part]:[-1,1])){const x=side*3.75,y=-.75,lv=1+(extra>=(side<0?2:3)?1:0);this.box(x,y,2.4,3.6,.35,['#779aa2','#254454','#406773']);for(let f=0;f<lv;f++){const z=.35+f*1.15;this.box(x,y,2.25,3.35,1.04,['#acc6c6','#315769','#547f8c'],z);for(let i=0;i<4;i++){const yy=y-1.25+i*.73;this.poly([this.p(x+1.14,yy,z+.28),this.p(x+1.14,yy+.44,z+.28),this.p(x+1.14,yy+.44,z+.78),this.p(x+1.14,yy,z+.78)],'#95d2d0','#c8e5d9');}for(let i=0;i<3;i++){const xx=x-.8+i*.65;this.poly([this.p(xx,y+1.69,z+.24),this.p(xx+.42,y+1.69,z+.24),this.p(xx+.42,y+1.69,z+.8),this.p(xx,y+1.69,z+.8)],f?'#8bc8bd':'#e2c997','#d3e7db');}this.box(x,y,2.5,3.6,.14,col,z+1.04);this.line([this.p(x-1.2,y+1.8,z+1.16),this.p(x+1.2,y+1.8,z+1.16),this.p(x+1.2,y-1.8,z+1.16)],'#94e7d1',2);}const roof=.35+lv*1.15;for(let i=0;i<3;i++)this.box(x-.7+i*.7,y-.2,.58,1.7,.08,['#315c72','#214459','#376078'],roof);for(const yy of[-1.8,1.1]){this.box(x+side*.6,y+yy,.6,.6,.65,col,0);this.pole(x+side*.6,y+yy,.3,'#83ecda',.67,.06);}this.box(side*2.5,y+.85,.8,.68,.16,col,1.4);for(let i=0;i<4;i++)this.box(x-1.1+i*.75,y+1.85,.4,.32,.33,col,roof+.1);this.stairs(x-side*.65,y+1.3,.12,.7,10);}if(part&&part!==3)return;this.box(0,2.2,3.25,.75,.82,['#799eaa','#234757','#386a7b']);this.box(0,2.22,1.08,.78,.74,['#678e99','#b5d2ca','#d8d4b5']);this.line([this.p(-.45,2.63,.15),this.p(-.45,2.63,.66),this.p(.45,2.63,.66),this.p(.45,2.63,.15)],'#9bfae4',2);this.box(0,2.25,3.55,1.02,.15,col,.84);for(const x of[-1.45,1.45])this.pole(x,2.52,.65,'#b8cecc',.96,.08);this.line([this.p(-1.45,2.52,1.58),this.p(1.45,2.52,1.58)],'#aac9c4',2);if(extra>=4){const z=1.03;this.box(0,2.18,3.34,1.1,.11,col,z);for(const x of[-1.5,1.5])for(const y of[1.73,2.68])this.pole(x,y,1.2,'#8faeb7',z,.11);this.poly([this.p(-1.48,1.69,z+.12),this.p(1.48,1.69,z+.12),this.p(1.48,1.69,z+1.14),this.p(-1.48,1.69,z+1.14)],'#99bbb8');this.poly([this.p(1.51,1.71,z+.1),this.p(1.51,2.66,z+.1),this.p(1.51,2.66,z+1.14),this.p(1.51,1.71,z+1.14)],'#477b8c');this.box(-.68,2.26,.95,.44,.23,['#e4c893','#9c8a6b','#b8ac88'],z+.12);this.box(-.68,2.26,.84,.37,.11,['#8bc5b4','#588e87','#75ada1'],z+.36);this.box(.63,2.24,.75,.38,.43,['#bbd8cb','#4c7783','#769f9c'],z+.12);this.poly([this.p(.32,2.44,z+.53),this.p(.94,2.44,z+.53),this.p(.94,2.44,z+.83),this.p(.32,2.44,z+.83)],'#72dfc6','#c7ffdc');this.box(0,2.18,3.55,1.26,.13,['#c2d5cc','#456c7e','#7b9ca2'],z+1.15);this.line([this.p(-1.55,2.76,z+.05),this.p(1.55,2.76,z+.05)],'#9cebcf',2);this.stairs(-2.04,1.52,0,.5,8);}}
shadow(x,y,w,d,h=.5){
 const corners=(q,dx,dy)=>[this.p(x-w/2-q+dx,y-d/2-q+dy,.025),this.p(x+w/2+q+dx,y-d/2-q+dy,.025),this.p(x+w/2+q+dx,y+d/2+q+dy,.025),this.p(x-w/2-q+dx,y+d/2+q+dy,.025)];
 this.poly(corners(.09,h*.18,h*.22),'#08293625');this.poly(corners(.01,.06,.07),'#08293640');
}
cylinder(x,y,r,h,cols,z=0,steps=10){
 const top=[],base=[];for(let i=0;i<steps;i++){const a=i*TAU/steps;top.push(this.p(x+Math.cos(a)*r,y+Math.sin(a)*r,z+h));base.push(this.p(x+Math.cos(a)*r,y+Math.sin(a)*r,z));}
 for(let i=0;i<steps;i++){const a=(i+.5)*TAU/steps;if(Math.cos(a)+Math.sin(a)>0){const n=(i+1)%steps;this.poly([base[i],base[n],top[n],top[i]],Math.cos(a)>0?cols[1]:cols[2]);}}
 this.poly(top,cols[0],cols[3]);
}
rail(x,y,w,d,z,col='#c8d6c6'){
 for(const side of[-1,1]){for(let i=0;i<=3;i++)this.pole(x-w/2+i*w/3,y+side*d/2,.34,col,z,.025);this.line([this.p(x-w/2,y+side*d/2,z+.34),this.p(x+w/2,y+side*d/2,z+.34)],col,Math.max(1,this.scale*.035));}
}
utilityPlate(x,y,w,d,col='#e4be72'){
 this.shadow(x,y,w,d,.8);this.box(x,y,w,d,.12,['#8aaba8','#274956','#476b74'],.04);
 for(const a of[-1,1])for(const b of[-1,1]){this.box(x+a*(w/2-.12),y+b*(d/2-.12),.14,.14,.08,['#cfdbbe','#44646a','#718f8e'],.17);}
 this.line([this.p(x-w/2,y+d/2,.18),this.p(x+w/2,y+d/2,.18)],col,Math.max(1.2,this.scale*.04));
}
waterFilter(b,s){
 const x=b.x,y=b.y,on=b.active,advanced=s.tech.factory>=5,water=(s.freshWater||0)/Tideborn.FACILITY_RULES.waterCap,c=this.ctx;
 this.utilityPlate(x,y,1.48,1.18,'#8cddd1');
 // Twin membrane vessels, actual pipe manifold, pressure gauge and a glazed clean-water tank.
 for(const a of[-.41,-.03]){this.cylinder(x+a,y-.18,.19,.98,['#d7dfc7','#5a9296','#8db8b0'],.2);for(const z of[.38,.89])this.ring(x+a,y-.18,z,.25,'#4b6d77',Math.max(1,this.scale*.045));this.cylinder(x+a,y-.18,.11,.14,['#e3cf9a','#63868b','#92b6ac'],1.18);}
 this.box(x+.42,y-.02,.42,.76,.8,['#b9e2d077','#365e6966','#6cbcaf66'],.22);
 this.box(x+.42,y-.02,.35,.67,Math.max(.035,water*.67),['#81decc99','#308d9b99','#58c1ba99'],.25);
 this.box(x+.42,y-.02,.47,.81,.08,['#d6e2c7','#517d86','#91ada7'],1.04);
 this.line([this.p(x-.41,y-.18,1.35),this.p(x-.41,y+.35,1.35),this.p(x+.42,y+.35,1.35),this.p(x+.42,y+.35,.42)],'#b8cebd',Math.max(2,this.scale*.075));
 this.line([this.p(x-.41,y-.18,.25),this.p(x-.8,y-.18,.25),this.p(x-.8,y+.63,.2),this.p(x-.8,y+.63,-.48)],'#466b78',Math.max(2,this.scale*.09));
 this.box(x-.22,y+.48,.56,.24,.32,['#d1d7b9','#43697a','#759c9d'],.23);
 this.circle(x-.24,y+.62,.64,.13,'#e8e5b9');this.line([this.p(x-.24,y+.62,.64),this.p(x-.24+(on?.075:-.07),y+.62,.69)],'#245763',1.1);
 this.circle(x+.07,y+.62,.43,.055,on?'#bbffdf':'#8da9a2');
 if(advanced){this.box(x-.08,y-.44,.98,.13,.08,['#dce8ce','#557c84','#96bcb0'],1.38);this.line([this.p(x-.43,y-.45,1.45),this.p(x+.26,y-.45,1.45)],'#b2fff0',1.5);}
 if(on){for(let i=0;i<3;i++){const a=(this.t*.7+i/3)%1;this.circle(x+.38+Math.sin(a*9+i)*.055,y-.02,.33+a*.65,.025,'#d8fff1',.85);}const flow=(this.t*.6)%1;this.circle(x-.8,y+.63,-.39+flow*.5,.055,'#b8ece2aa',.5);}
 if(this.scale>18)this.label('H₂O',x+.42,y+.39,.66,'#e6fff0',Math.max(7,this.scale*.22));
}
eelGenerator(b,s){
 const x=b.x,y=b.y,on=b.active,c=this.ctx,advanced=s.tech.factory>=5,accent=on?'#c0ffb6':'#8cbdaf';
 this.utilityPlate(x,y,1.65,1.47,'#e5c177');
 // Wide transparent habitat: the eel is a moving silhouette inside, not a decorative lightning icon.
 this.box(x,y,1.27,1.1,.1,['#b2c3aa','#3c6670','#719998'],.22);
 this.box(x,y,1.15,.99,.69,['#79d7c366','#225b6966','#6ac2b766'],.32);
 this.poly([this.p(x-.56,y+.51,.35),this.p(x+.56,y+.51,.35),this.p(x+.56,y+.51,.99),this.p(x-.56,y+.51,.99)],'#a3e6d72b','#aad8c6');
 const swim=this.t*(on?2:.65)+b.id,pts=[];for(let i=0;i<=11;i++){const q=i/11;pts.push(this.p(x-.46+q*.91,y+Math.sin(q*TAU+swim)*.18,.78+Math.cos(q*4+swim)*.06));}
 this.line(pts,'#1c4852',Math.max(2,this.scale*.1));this.line(pts,advanced?'#cbf0ab':'#a0d799',Math.max(1,this.scale*.045));const head=pts[pts.length-1];c.beginPath();c.arc(head.x,head.y,Math.max(1,this.scale*.065),0,TAU);c.fillStyle='#d4ed9d';c.fill();
 // Bronze electrodes and ribbed induction coils remain distinct from the wind turbine.
 for(const side of[-1,1]){const xx=x+side*.7;this.cylinder(xx,y-.14,.13,1.05,['#e7cc8b','#876e4d','#b79967'],.2);for(let i=0;i<5;i++)this.ring(xx,y-.14,.4+i*.15,.18,i%2?'#d1b378':'#756146',Math.max(1,this.scale*.035));this.circle(xx,y-.14,1.3,.075,accent);this.line([this.p(xx,y-.14,1.31),this.p(xx,y+.62,1.31),this.p(x+side*.21,y+.62,.4)],'#435e65',Math.max(1.5,this.scale*.06));}
 for(const a of[-1,1])for(const q of[-1,1])this.pole(x+a*.6,y+q*.55,.74,'#bad0b7',.31,.04);
 for(const side of[-1,1]){this.box(x+side*.62,y,.08,1.16,.08,['#e0d6ac','#527e83','#93aca1'],1.08);this.box(x,y+side*.54,1.24,.08,.08,['#e0d6ac','#527e83','#93aca1'],1.08);}
 this.poly([this.p(x-.51,y-.43,1.165),this.p(x+.51,y-.43,1.165),this.p(x+.51,y+.43,1.165),this.p(x-.51,y+.43,1.165)],'#9de4cf18','#cae2c1');
 this.box(x,y+.66,.6,.26,.37,['#d5d9b2','#426273','#759c9a'],.2);this.poly([this.p(x-.21,y+.8,.32),this.p(x+.21,y+.8,.32),this.p(x+.21,y+.8,.48),this.p(x-.21,y+.8,.48)],on?'#b8f6b4':'#476d70');
 const charge=Math.min(1,(b.fuel||0)/Tideborn.FACILITY_RULES.eelSeconds);this.line([this.p(x-.18,y+.81,.39),this.p(x-.18+charge*.36,y+.81,.39)],'#eaf9b0',Math.max(1,this.scale*.035));
 if(on){const a=(this.t*1.5+b.id)%1;if(a<.3)this.line([this.p(x-.58,y-.3,1.32),this.p(x-.24,y-.3,1.4),this.p(x-.12,y-.3,1.24),this.p(x+.23,y-.3,1.42),this.p(x+.58,y-.3,1.32)],'#e5ffb3',Math.max(1,this.scale*.04));for(let i=0;i<3;i++){const q=(this.t*.45+i/3)%1;this.circle(x-.36+i*.32,y-.25,.37+q*.6,.025,'#d7ffdf',.8);}}
 if(this.scale>18)this.label('ϟ',x,y+.81,.43,'#eaffc8',Math.max(8,this.scale*.27));
}
factory(s){
 const t=s.tech.factory;if(!t)return;const r=Tideborn.radius(s),x=-Math.max(1.8,r-1),y=.4,metal=t>=4?['#cad8c6','#31566d','#6b939a']:['#b5c2ac','#48636b','#7c9795'];
 this.utilityPlate(x,y,1.67,1.78,'#e4bc72');
 this.box(x-.17,y-.12,.93,1.04,.8,metal,.2);this.box(x-.17,y-.12,1.08,1.18,.1,['#e4d4a6','#657776','#9caaa0'],1.0);
 this.poly([this.p(x-.58,y+.415,.35),this.p(x+.23,y+.415,.35),this.p(x+.23,y+.415,.84),this.p(x-.58,y+.415,.84)],'#614f43','#bba576');
 this.poly([this.p(x-.46,y+.43,.42),this.p(x+.1,y+.43,.42),this.p(x+.1,y+.43,.73),this.p(x-.46,y+.43,.73)],'#ebaa60');
 for(let i=0;i<4;i++)this.line([this.p(x-.4+i*.14,y+.45,.42),this.p(x-.4+i*.14,y+.45,.73)],'#765b47',Math.max(1,this.scale*.04));
 this.cylinder(x-.41,y-.36,.16,.69,['#c4ccb4','#37596a','#78969a'],1.1);this.cylinder(x-.41,y-.36,.21,.1,metal,1.77);
 if(this.scale>11)for(let i=0;i<2;i++){const a=(this.t*.38+i*.5)%1;this.circle(x-.41-a*.15,y-.36,1.94+a*.65,.12+a*.16,`rgba(204,224,197,${.22*(1-a)})`,.75);}
 this.box(x+.55,y+.31,.32,.46,.52,metal,.2);for(let i=0;i<3;i++)this.line([this.p(x+.4,y+.55,.33+i*.1),this.p(x+.69,y+.55,.33+i*.1)],'#254958',1);
 if(t>=2){for(const xx of[x-.8,x+.75]){this.box(xx,y-.69,.18,.25,2.16,['#e4c688','#6a7167','#aa9d78'],.18);this.line([this.p(xx,y-.38,.22),this.p(xx,y-.69,1.25)],'#a5946a',Math.max(1,this.scale*.055));}this.box(x,y-.69,1.95,.33,.21,['#ebcc8b','#817e67','#c2b07e'],2.31);const xx=x+Math.sin(this.t*.6)*.53,z=.73+Math.sin(this.t*1.1)*.18;this.box(xx,y-.69,.38,.43,.17,['#9cb3aa','#345566','#64898d'],2.27);this.line([this.p(xx,y-.69,2.26),this.p(xx,y-.69,z+.29)],'#e2e2bc',1.2);this.line([this.p(xx,y-.69,z+.29),this.p(xx-.09,y-.69,z+.15),this.p(xx+.09,y-.69,z+.08),this.p(xx+.16,y-.69,z+.23)],'#edd49a',Math.max(1.4,this.scale*.06));}
 if(t>=3){this.box(x,y+1.28,1.04,1.32,.25,['#395d6b','#183948','#325667'],.08);for(let i=0;i<7;i++)this.line([this.p(x-.45,y+.72+i*.18,.36),this.p(x+.45,y+.72+i*.18,.36)],'#8caaa4',Math.max(1,this.scale*.055));for(let i=0;i<2;i++){const q=(this.t*.5+i*.59)%1.15;this.box(x,y+.77+q,.38,.33,.23,['#e3c58a','#8c7c60','#bea57c'],.38);}for(const xx of[x-.55,x+.55])this.line([this.p(xx,y+.65,.5),this.p(xx,y+1.96,.5)],'#b9c9b5',Math.max(1,this.scale*.04));}
 if(t>=4){this.box(x-.81,y+.61,.33,.48,.7,metal,.18);this.poly([this.p(x-.99,y+.87,.59),this.p(x-.64,y+.87,.59),this.p(x-.64,y+.87,.83),this.p(x-.99,y+.87,.83)],'#89dbc4','#c9e5c3');for(let i=0;i<3;i++)this.circle(x-.93+i*.11,y+.88,.45,.026,'#efd792');}
 if(t>=5){for(let i=0;i<2;i++){this.cylinder(x+.9,y-.23+i*.66,.26,1.07,['#accfbd','#2a5a72','#4d96a2'],.17);for(const z of[.38,.68,.98])this.ring(x+.9,y-.23+i*.66,z,.34,'#99edce',Math.max(1,this.scale*.04));}this.line([this.p(x+.9,y-.23,1.3),this.p(x+.9,y+.43,1.3),this.p(x+.37,y+.43,1.3)],'#b0e4cc',Math.max(2,this.scale*.065));}
}
generator(b,s){
 const x=b.x,y=b.y,t=s.tech.factory,c=this.ctx,metal=['#d0d9c5','#3d677b','#88a6aa'];
 this.utilityPlate(x,y,.96,.94,'#cfcd9b');this.box(x+.29,y+.16,.32,.44,.58,metal,.18);
 this.box(x-.08,y-.07,.2,.22,2.3,metal,.17);for(const a of[-.34,.34])this.line([this.p(x+a,y,.18),this.p(x-.08,y-.07,.97)],'#75989a',Math.max(1,this.scale*.055));
 this.box(x-.08,y-.07,.46,.5,.26,metal,2.37);const p=this.p(x-.08,y+.2,2.52);
 let bladeAngle=this.t*(s.storm>0?2.5:1.35)+b.id;for(let i=0;i<3;i++){bladeAngle+=TAU/3;const ca=Math.cos(bladeAngle),sa=Math.sin(bladeAngle),points=[[-.045,0],[-.035,-1.04],[.16,-.84],[.1,-.19]].map(([x,y])=>({x:p.x+(x*ca-y*sa)*this.scale,y:p.y+(x*sa+y*ca)*this.scale,depth:p.depth}));this.paintPrimitive(points,c=>{c.beginPath();points.forEach((q,i)=>i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y));c.closePath();c.fillStyle='#e5e8ca';c.fill();c.strokeStyle='#728f95';c.lineWidth=Math.max(.6,this.scale*.018);c.stroke();});}this.circle(x-.08,y+.2,2.52,.14,'#e5cf99');this.circle(x-.08,y+.2,2.52,.055,'#526f79');
 this.line([this.p(x-.09,y+.05,.33),this.p(x-.09,y+.05,2.34)],'#426574',Math.max(1,this.scale*.025));
 if(t>=4){this.box(x-.08,y-.07,.64,.62,.08,metal,1.55);this.rail(x-.08,y-.07,.64,.62,1.63,'#c4d4bf');for(let i=0;i<5;i++)this.line([this.p(x+.07,y-.02,.4+i*.21),this.p(x+.3,y-.02,.4+i*.21)],'#aec3b8',1);}
 this.circle(x+.29,y+.4,.54,.045,'#adf4cf');
}
turret(b,s){
 const t=s.tech.turret,x=b.x,y=b.y,c=this.ctx,e=s.enemies.find(e=>Math.hypot(e.x-x,e.y-y)<16),a=e?Math.atan2(e.y-y,e.x-x):Math.atan2(y,x),dx=Math.cos(a),dy=Math.sin(a),recoil=(b.cd||0)>.48?.06:0;
 const pt=(along,across,z)=>this.p(x+dx*along-dy*across,y+dy*along+dx*across,z),metal=['#c7d2b9','#355467','#789297'];
 this.utilityPlate(x,y,1,1,t>=4?'#a6e6d2':'#dfc086');for(const q of[-1,1])this.line([this.p(x+q*.4,y+.4,.2),this.p(x,y,.63)],'#516f7c',Math.max(2,this.scale*.07));this.cylinder(x,y,.36,.2,['#a4b8a7','#38586b','#64838d'],.24);this.ring(x,y,.46,.46,'#d3dbbe',Math.max(1,this.scale*.04));this.box(x,y,.42,.48,.32,metal,.46);
 if(t<=1){this.line([pt(-.35,0,.78),pt(.76,0,.78)],'#be9767',Math.max(2,this.scale*.09));this.line([pt(.35,-.52,.76),pt(.55,0,.8),pt(.35,.52,.76)],'#825a43',Math.max(2,this.scale*.07));this.line([pt(.35,-.52,.76),pt(-.28,0,.8),pt(.35,.52,.76)],'#e8d4a5',1);this.line([pt(-.28,0,.83),pt(.86,0,.83)],'#dfdbc0',1.2);}
 else if(t===5){for(const side of[-1,1]){this.poly([pt(-.4,side*.47,.66),pt(.37,side*.47,.87),pt(.37,side*.08,.87),pt(-.4,side*.08,.66)],'#d0dcc0','#466579');for(let i=0;i<3;i++){const across=side*(.16+i*.13);this.line([pt(-.36,across,.8),pt(.39,across,1.05)],'#638b94',Math.max(2,this.scale*.105));this.line([pt(.21,across,.99),pt(.39,across,1.05)],'#f5d1a1',Math.max(1.5,this.scale*.065));}}}
 else if(t>=6){this.cylinder(x,y,.25,.23,['#b3e1cc','#2b5972','#619ea6'],.72);this.ring(x,y,1,.39,'#8cf7d4',Math.max(2,this.scale*.07));this.circle(x,y,1.03,.17,'#ddffe0');for(const side of[-1,1])this.line([pt(-.16,side*.26,.81),pt(.62-recoil,side*.13,1.01)],'#bddaca',Math.max(2,this.scale*.08));this.line([pt(.3,0,1.02),pt(.85-recoil,0,1.02)],'#c8ffe3',Math.max(1,this.scale*.04));}
 else {const length=t===4?1.25:.85;for(const side of(t>=3?[-1,1]:[0])){const across=side*.14;this.line([pt(-.28,across,.79),pt(length-recoil,across,.85)],'#284d60',Math.max(3,this.scale*.14));this.line([pt(.04,across,.84),pt(length-.08-recoil,across,.9)],t===4?'#a6efda':'#9caf9f',Math.max(1.5,this.scale*.065));this.line([pt(length-.02-recoil,across-.06,.84),pt(length-.02-recoil,across+.06,.84)],'#e6dbc0',Math.max(2,this.scale*.065));}this.box(x-dy*.4,y+dx*.4,.3,.35,.27,metal,.43);for(let i=0;i<3;i++)this.line([pt(-.1+i*.1,.4,.75),pt(-.1+i*.1,.4,.61)],'#e3c188',Math.max(1,this.scale*.025));}
 this.circle(x,y,.91,.055,t>=4?'#b1ffdc':'#f6d69b');
}
smallFacility(b,s){
 const x=b.x,y=b.y,t=s.tech.factory,metal=['#d0d9c1','#3b6476','#7b9f9f'];
 if(b.type==='bench'){
  this.shadow(x,y,.96,.72,.7);for(const a of[-.35,.35])for(const q of[-.24,.24])this.box(x+a,y+q,.095,.095,.54,['#c7b081','#654f3d','#9f8055'],.03);
  this.box(x,y,.96,.75,.12,['#e5c489','#826345','#b29162'],.56);this.box(x,y,.73,.43,.08,['#8c9e88','#45666b','#76968b'],.25);
  this.box(x-.18,y+.02,.26,.2,.13,['#a5b7ad','#385768','#718b8e'],.69);this.box(x-.18,y+.02,.34,.16,.07,['#d6d9b9','#5c7881','#93aaa2'],.82);
  this.box(x+.24,y-.12,.25,.24,.04,['#dce2b9','#b5b993','#c4caa1'],.7);this.line([this.p(x+.14,y-.07,.76),this.p(x+.34,y+.06,.76)],'#547c8c',Math.max(1,this.scale*.045));
  this.pole(x-.34,y-.23,.37,'#8c7450',.69,.04);this.circle(x-.34,y-.23,1.06,.085,'#ffe1a0');this.box(x+.32,y+.26,.18,.1,.07,['#a3b4a2','#4e6773','#7c9492'],.69);
 }else if(b.type==='net'){
  for(const a of[-.75,.75]){this.pole(x+a,y,.97,'#c2a775',-.28,.065);this.circle(x+a,y,.73,.08,'#ebd5a1');this.line([this.p(x+a,y,.59),this.p(x+a*.6,y+.33,-.14)],'#d0c5a0',1);}
  this.poly([this.p(x-.72,y,.45),this.p(x+.72,y,.45),this.p(x+.51,y+.33,-.22),this.p(x-.51,y+.33,-.22)],'#63988630');
  for(let i=0;i<6;i++){const q=i/5;this.line([this.p(x-.72+q*1.44,y,.45),this.p(x-.51+q*1.02,y+.33,-.22)],'#b4c9aa88',1);this.line([this.p(x-.72+q*.21,y+q*.33,.45-q*.67),this.p(x+.72-q*.21,y+q*.33,.45-q*.67)],'#b4c9aa88',1);}
  this.box(x+.14,y+.12,.34,.16,.11,['#c7af7d','#6e7057','#a49770'],.08);this.circle(x-.25,y+.2,.05,.11,'#9fb9a0',.55);const bob=Math.sin(this.t*2+b.id)*.04;this.circle(x-.74,y,-.16+bob,.16,'#e2c38e',.55);this.circle(x+.74,y,-.16-bob,.16,'#e2c38e',.55);
 }else if(b.type==='shield'){
  this.utilityPlate(x,y,1.05,1.04,'#b3b6e3');this.cylinder(x,y,.34,.37,metal,.17);for(let i=0;i<3;i++){const a=i*TAU/3;this.pole(x+Math.cos(a)*.34,y+Math.sin(a)*.34,.65,'#91aeb4',.32,.055);this.circle(x+Math.cos(a)*.34,y+Math.sin(a)*.34,1.02,.07,'#b6c5ed');}
  this.ring(x,y,.66,.42,'#8eb5d8',Math.max(1.5,this.scale*.045));this.ring(x,y,1,.42,'#b7d5e9',Math.max(1.5,this.scale*.045));this.circle(x,y,.79,.23,s.shield>0?'#b7f5e0':'#6c929f');if(s.shield>0){const a=this.t;this.circle(x+Math.cos(a)*.4,y+Math.sin(a)*.4,.91,.055,'#f0ffe7');}
 }else if(b.type==='radar'){
  this.utilityPlate(x,y,.98,1.04,'#bfcbb0');this.box(x+.29,y+.28,.34,.39,.58,metal,.18);for(const side of[-1,1])this.line([this.p(x+side*.34,y,.2),this.p(x,y,1.14)],'#73969c',Math.max(1.5,this.scale*.065));this.pole(x,y,1.67,'#b4cdc1',.18,.085);
  const a=this.t*.5,dx=Math.cos(a),dy=Math.sin(a),p=(u,v,z)=>this.p(x+dx*u-dy*v,y+dy*u+dx*v,z),dish=[];for(let i=0;i<12;i++){const q=i*TAU/12;dish.push(p(Math.cos(q)*.62,.12,1.92+Math.sin(q)*.48));}this.poly(dish,'#a8c6ba','#dae3c3');for(const q of[-.4,0,.4])this.line([p(q,.12,1.62),p(0,-.18,1.93),p(q,.12,2.23)],'#5e8c97',Math.max(.8,this.scale*.025));this.line([p(-.5,.12,1.91),p(.5,.12,1.91)],'#648b94',1);this.line([p(0,-.28,1.92),p(0,.47,1.92)],'#d4d9b6',Math.max(1.5,this.scale*.05));const feed=p(0,.47,1.92);this.ctx.fillStyle='#e8cf96';this.ctx.fillRect(feed.x-1.5,feed.y-1.5,3,3);this.circle(x+.29,y+.48,.55,.045,'#b7f3d3');
 }else if(b.type==='garden'){
  const z=.6+Math.min(5,1+Math.floor(s.tech.house/2)+Math.min(1,Tideborn.count(s,'floor')))*1.48;
  this.box(x,y,1.7,1.45,.15,['#c9d4ad','#3f6565','#8baa91'],z);for(const side of[-1,1]){this.box(x+side*.4,y,.53,1.12,.12,['#8f9f7a','#4b6b5c','#718d70'],z+.16);for(let i=0;i<3;i++){this.pole(x+side*.4,y-.35+i*.35,.21,'#6b9966',z+.28,.025);this.circle(x+side*.4,y-.35+i*.35,z+.51,.18,side<0?'#7fbf7e':'#b0d392',.72);}}
  for(const side of[-1,1])this.poly([this.p(x-.89,y+side*.77,z+.18),this.p(x+.89,y+side*.77,z+.18),this.p(x+.89,y,z+1.02),this.p(x-.89,y,z+1.02)],side<0?'#a8e2cf30':'#a8e2cf15','#c1deca');for(const xx of[-.89,0,.89])this.line([this.p(x+xx,y-.77,z+.18),this.p(x+xx,y,z+1.02),this.p(x+xx,y+.77,z+.18)],'#d7e7c8',Math.max(.8,this.scale*.025));this.line([this.p(x-.89,y,z+1.02),this.p(x+.89,y,z+1.02)],'#e4e5c0',Math.max(1.5,this.scale*.04));
 }
}
renderAnchor(b,s){
 // Wind supply is noninteractive and position-independent in simulation. Late housing
 // grows side wings, so its complete visual assembly moves to the free utility apron.
 // Never remap a turret, player, enemy, projectile or other attack/interaction origin.
 if(b.type!=='generator'||s.tech.house<5)return b;
 const r=Tideborn.radius(s),n=s.buildings.filter(q=>q.type==='generator').findIndex(q=>q.id===b.id),sites=[[r-.8,-r+2],[-r+2,r-.8],[0,-r+.8]],p=sites[Math.max(0,n)];return {...b,x:p[0],y:p[1]};
}
facility(b,s){
 if(FRONTIER_TYPES.includes(b.type)){this.frontierFacility(b,s);return;}
 if(['bench','net','shield','radar','garden'].includes(b.type)){this.smallFacility(b,s);return;}
 if(b.type==='waterFilter'){this.waterFilter(b,s);return;}if(b.type==='eelGenerator'){this.eelGenerator(b,s);return;}
 if(b.type==='turret'){this.turret(b,s);return;}if(b.type==='generator'){this.generator(b,s);return;}
 const x=b.x,y=b.y;
 if(b.type==='beacon'){const z=1.9+Math.min(5,1+Math.floor(s.tech.house/2)+Math.min(1,Tideborn.count(s,'floor')))*1.48;this.pole(x,y,z,'#74a7ad',0,.16);this.circle(x,y,z,.23,'#d7ffe8');this.ring(x,y,z,.7,'#75eed394',2);this.ring(x,y,z+.22,.45,'#c5ffea',1);const p=this.p(x,y,z),c=this.ctx,g=c.createRadialGradient(p.x,p.y,1,p.x,p.y,this.scale*1.5);g.addColorStop(0,'#a6ffdb77');g.addColorStop(1,'#a6ffdb00');c.fillStyle=g;c.fillRect(p.x-this.scale*1.5,p.y-this.scale*1.5,this.scale*3,this.scale*3);}
}
abyssTitan(e){
 const p=this.p(e.x,e.y,-.03),c=this.ctx,u=this.scale,charge=e.telegraph>0,flash=e.flash>0;
 const heading=Math.atan2(-(e.x+e.y)*.47,-e.x+e.y)+Math.PI/2;
 c.save();c.translate(p.x,p.y);c.rotate(heading);
 const shape=(pts,fill,stroke,width=1)=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x*u,y*u):c.moveTo(x*u,y*u));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}};
 // A continent-sized, many-limbed carapace, rather than a scaled-up ordinary fish.
 c.fillStyle='#001b2a85';c.beginPath();c.ellipse(0,.7*u,5.55*u,4.85*u,0,0,TAU);c.fill();
 for(let i=0;i<3;i++){
  c.beginPath();c.ellipse(0,1.25*u, (4.8+i*.46)*u,(4.9+i*.3)*u,0,.1,Math.PI-.1);c.strokeStyle=i===0?'#b9e4d03b':'#9ed9dd22';c.lineWidth=Math.max(1,2-i*.4);c.stroke();
 }
 if(charge){const pulse=.5+.5*Math.sin(this.t*12);c.beginPath();c.ellipse(0,0,(5.75+pulse*.4)*u,(5.15+pulse*.4)*u,0,0,TAU);c.fillStyle='#ff615411';c.fill();c.strokeStyle=`rgba(255,137,106,${.3+pulse*.6})`;c.lineWidth=2+pulse*2;c.stroke();}
 for(const side of[-1,1]){
  shape([[side*1.1,-2.1],[side*3.3,-1.53],[side*5.32,1.14],[side*3.9,.5],[side*2.2,2.5],[side*.99,1.9]],flash?'#fff3d9':'#264557','#749699',Math.max(1,u*.07));
  shape([[side*1.55,-1.45],[side*3.2,-.83],[side*4.13,.72],[side*2.7,.34],[side*1.9,1.54]],charge?'#ab635c':'#587887');
  for(let i=0;i<3;i++){
   const yy=-.2+i*1.03,wiggle=Math.sin(this.t*1.1+i*1.7)*.27;
   c.beginPath();c.moveTo(side*1.44*u,yy*u);c.bezierCurveTo(side*(2.7+i*.13)*u,(yy+.55)*u,side*(3.8+i*.12)*u,(yy+1.38+wiggle)*u,side*(3.2+i*.31)*u,(yy+2.3)*u);
   c.strokeStyle='#0e2c40';c.lineWidth=u*(.39-i*.055);c.lineCap='round';c.stroke();c.strokeStyle=charge?'#e78374':'#8ca6a5';c.lineWidth=u*(.2-i*.04);c.stroke();
   for(let n=0;n<3;n++){c.beginPath();c.arc(side*(2.0+n*.34)*u,(yy+.38+n*.4)*u,Math.max(1,u*.055),0,TAU);c.fillStyle=charge?'#ffd1a4':'#90f0d7';c.fill();}
  }
 }
 shape([[-.88,2.1],[-1.03,4],[-2.35,5.02],[-.75,4.57],[0,5.49],[.75,4.57],[2.35,5.02],[1.03,4],[.88,2.1]],flash?'#fff1d9':'#446779','#75989e',Math.max(1,u*.08));
 const g=c.createLinearGradient(-2*u,-u,2*u,u);g.addColorStop(0,flash?'#fff9e2':'#496574');g.addColorStop(.45,flash?'#fff0cb':'#77959b');g.addColorStop(.55,flash?'#fff9e2':'#5a7886');g.addColorStop(1,flash?'#ffe2b3':'#294757');
 c.beginPath();c.moveTo(0,-3.61*u);c.bezierCurveTo(-1.65*u,-3.19*u,-2.4*u,-.96*u,-1.86*u,1.48*u);c.bezierCurveTo(-1.65*u,3.51*u,1.65*u,3.51*u,1.86*u,1.48*u);c.bezierCurveTo(2.4*u,-.96*u,1.65*u,-3.19*u,0,-3.61*u);c.fillStyle=g;c.fill();c.strokeStyle='#102e3c';c.lineWidth=Math.max(2,u*.1);c.stroke();
 for(const side of[-1,1]){
  shape([[side*.61,-2.48],[side*1.62,-3.02],[side*1.02,-4.54],[side*.99,-3.19],[side*.34,-2.76]],flash?'#fff4d8':'#d1c7a7','#66848c',Math.max(1,u*.04));
  for(let i=0;i<4;i++){
   const yy=-1.95+i*.98;
   shape([[side*.12,yy-.35],[side*1.37,yy-.25],[side*1.81,yy+.3],[side*.86,yy+.46]],i%2?'#597d8b':'#90aba8','#2a4b5d',Math.max(1,u*.06));
   c.beginPath();c.moveTo(side*.43*u,(yy+.1)*u);c.lineTo(side*1.28*u,(yy+.28)*u);c.strokeStyle=charge?'#ffb39b':'#93e9d8';c.lineWidth=Math.max(1,u*.055);c.stroke();
  }
 }
 // Raised dorsal spires and the exposed bioluminescent core are visible even on phones.
 for(let i=3;i>=0;i--){const yy=-1.5+i*.91;shape([[-.36,yy],[0,yy-1.05],[.32,yy],[0,yy+.47]],i===1?'#c6cec0':'#a9b7ad','#4e7180',Math.max(1,u*.04));}
 const heart=c.createRadialGradient(0,-.64*u,0,0,-.64*u,1.26*u);heart.addColorStop(0,charge?'#ffefbfc9':'#bdffe8bc');heart.addColorStop(.4,charge?'#ff8c7194':'#65dcd185');heart.addColorStop(1,'#5bc9c800');c.fillStyle=heart;c.fillRect(-1.3*u,-1.94*u,2.6*u,2.6*u);
 shape([[0,-1.52],[-.48,-.68],[0,.02],[.48,-.68]],charge?'#ffe9b9':'#beffe5','#e6f1cb',Math.max(1,u*.04));
 for(const side of[-1,1])for(let i=0;i<3;i++){
  const xx=side*(.36+i*.36),yy=-2.72+i*.13;c.beginPath();c.ellipse(xx*u,yy*u,.145*u,.09*u,side*-.2,0,TAU);c.fillStyle=charge?'#fff0bd':'#ffb995';c.shadowBlur=u*.23;c.shadowColor='#ff886a';c.fill();c.shadowBlur=0;
 }
 shape([[-.65,-3.15],[0,-3.59],[.65,-3.15],[.24,-2.93],[0,-3.15],[-.24,-2.93]],'#183745','#e1d2ab',Math.max(1,u*.04));
 c.restore();
 const name=(Tideborn.ENEMY_KINDS?.abyssTitan?.name||'渊海泰坦').split(' · ')[0],title=charge?'超级海兽 · 蓄力震荡':name+' · 超级海兽';
 c.save();c.font=`700 ${this.w<760?10:12}px system-ui`;
 const w=Math.max(100,c.measureText(translate(title)).width+12,Math.min(190,this.scale*7.5)),bx=Math.max(w/2+10,Math.min(this.w-w/2-10,p.x)),by=Math.max(this.w<760?310:168,Math.min(this.h-130,p.y-u*5.8));
 c.fillStyle='#102b3be8';c.fillRect(bx-w/2-7,by-24,w+14,39);c.textAlign='center';c.fillStyle=charge?'#ffb29c':'#f3d5b2';c.fillText(translate(title),bx,by-10);c.fillStyle='#4c3d45';c.fillRect(bx-w/2,by,w,5);c.fillStyle=charge?'#ffa886':'#d18c94';c.fillRect(bx-w/2,by,w*Math.max(0,Math.min(1,e.hp/e.maxHp)),5);c.restore();
}
dreadnought(e){
 const p=this.p(e.x,e.y,.03),c=this.ctx,u=this.scale*1.03;
 c.save();c.translate(p.x,p.y);c.rotate(Math.atan2(-(e.x+e.y)*.47,-e.x+e.y)+Math.PI/2);
 c.fillStyle='#06273970';c.beginPath();c.ellipse(0,.24*u,1.44*u,1.7*u,0,0,TAU);c.fill();
 for(const side of[-1,1]){
  c.beginPath();c.moveTo(side*.61*u,-.67*u);c.lineTo(side*1.43*u,-.25*u);c.lineTo(side*1.31*u,1.15*u);c.lineTo(side*.58*u,.77*u);c.closePath();c.fillStyle=e.flash>0?'#fff5df':'#526578';c.fill();
 }
 c.beginPath();c.moveTo(0,-1.75*u);c.lineTo(-.84*u,-.88*u);c.lineTo(-.94*u,.67*u);c.lineTo(0,1.55*u);c.lineTo(.94*u,.67*u);c.lineTo(.84*u,-.88*u);c.closePath();c.fillStyle=e.flash>0?'#fff4d9':'#7c8994';c.strokeStyle='#1a394b';c.lineWidth=Math.max(1,u*.09);c.fill();c.stroke();
 for(let i=0;i<4;i++){
  const yy=(-.89+i*.53)*u;c.beginPath();c.moveTo(-.65*u,yy);c.lineTo(0,yy-.32*u);c.lineTo(.65*u,yy);c.strokeStyle='#c2bfb2';c.lineWidth=Math.max(2,u*.15);c.stroke();
  for(const side of[-1,1]){c.beginPath();c.moveTo(side*.79*u,yy);c.lineTo(side*1.11*u,yy-.22*u);c.strokeStyle='#d4c2a5';c.lineWidth=Math.max(1,u*.075);c.stroke();}
 }
 for(const side of[-1,1]){c.beginPath();c.ellipse(side*.33*u,-1.02*u,.13*u,.075*u,0,0,TAU);c.fillStyle='#ffb091';c.fill();}
 c.restore();const w=Math.max(26,u*2.4);c.fillStyle='#163242';c.fillRect(p.x-w/2,p.y-u*2.02,w,3);c.fillStyle='#c8a2c0';c.fillRect(p.x-w/2,p.y-u*2.02,w*Math.max(0,e.hp/e.maxHp),3);
 if(this.scale>13)this.label('精英',e.x,e.y,2.48,'#e7c7d9',9);
}
enemy(e){
 if(e.kind==='abyssTitan'){this.abyssTitan(e);return;}if(e.kind==='dreadnought'){this.dreadnought(e);return;}
 // Dense far-away bodies keep their species outline, animation and health bars.
 // Only internal accents below useful screen size lose detail; close/zoomed foes and bosses do not.
 const p=this.p(e.x,e.y,.035),c=this.ctx,large=e.kind==='leviathan',u=this.scale*(large?.86:.47),near=!this.crowdPlayer||Math.hypot(e.x-this.crowdPlayer.x,e.y-this.crowdPlayer.y)<5.5,tiny=this.crowdCount>=120&&!near&&u<12,detail=u>6&&!tiny,a=Math.atan2(-(e.x+e.y)*.47,-e.x+e.y)+Math.PI/2,swim=Math.sin(this.t*3.1+(e.id||0))*.16;
 const col=e.flash>0?'#fff6dc':['#be9775','#a58d7e','#83a7a3','#887d9a','#8b779c','#699aab','#63829b'][Math.min(6,e.tier)],light=e.flash>0?'#fff9df':e.tier>=4?'#aec6bc':'#d3c5a1',dark='#264c60';
 c.save();c.translate(p.x,p.y);c.rotate(a);const shape=(pts,fill,stroke=dark)=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x*u,y*u):c.moveTo(x*u,y*u));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=Math.max(.7,u*.05);c.stroke();}};
 if(!tiny){c.fillStyle='#082b3c50';c.beginPath();c.ellipse(0,.24*u,u*(e.kind==='ray'?1.62:1.15),u*.75,0,0,TAU);c.fill();}
 if(e.kind==='eel'){
  const path=()=>{c.beginPath();c.moveTo(-.16*u,-.91*u);c.bezierCurveTo((.8+swim)*u,-.21*u,(-.85+swim)*u,.67*u,.15*u,1.54*u);};path();c.strokeStyle=dark;c.lineWidth=u*.48;c.lineCap='round';c.stroke();c.strokeStyle=col;c.lineWidth=u*.31;c.stroke();if(!tiny){c.strokeStyle='#bdd6aa';c.lineWidth=u*.06;c.stroke();}
  shape([[-.27,-1.02],[.02,-1.07],[.22,-.8],[-.13,-.62]],col);if(detail){for(let i=0;i<4;i++){c.beginPath();c.arc((Math.sin(i*2.2+swim)*.17)*u,(-.3+i*.33)*u,u*.045,0,TAU);c.fillStyle='#c3efb9';c.fill();}}
 }else if(e.kind==='ray'){
  shape([[0,-1.04],[-.67,-.26],[-1.72,.18+swim],[-1.34,.61],[-.47,.6],[0,1.02],[.47,.6],[1.34,.61],[1.72,.18-swim],[.67,-.26]],col);
  if(!tiny)shape([[0,-.88],[-.37,.04],[0,.79],[.37,.04]],light,null);c.beginPath();c.moveTo(0,.8*u);c.quadraticCurveTo(swim*u,1.3*u,-.22*u,1.9*u);c.strokeStyle=light;c.lineWidth=Math.max(1,u*.075);c.stroke();
  if(detail)for(const side of[-1,1]){c.beginPath();c.moveTo(side*.35*u,-.11*u);c.lineTo(side*1.25*u,.38*u);c.strokeStyle='#385d6c';c.lineWidth=u*.045;c.stroke();}
 }else if(e.kind==='crab'){
  for(const side of[-1,1]){c.beginPath();for(let i=0;i<3;i++){c.moveTo(side*.63*u,(-.18+i*.35)*u);c.lineTo(side*(1.1+Math.sin(this.t*4+i)*.07)*u,(-.26+i*.46)*u);c.lineTo(side*1.35*u,(-.08+i*.5)*u);}c.strokeStyle=light;c.lineWidth=Math.max(1.2,u*.12);c.lineCap='round';c.stroke();shape([[side*.53,-.35],[side*.83,-.82],[side*1.2,-.95],[side*1.33,-.56],[side*1.02,-.65],[side*.87,-.38]],col);}
  shape([[-.72,-.38],[-.45,-.76],[.45,-.76],[.72,-.38],[.77,.43],[.4,.73],[-.4,.73],[-.77,.43]],col);if(!tiny)shape([[-.49,-.32],[0,-.55],[.49,-.32],[.4,.32],[0,.48],[-.4,.32]],light);if(detail)shape([[-.26,-.2],[0,-.34],[.26,-.2],[0,.23]],col,null);
 }else{
  for(const side of[-1,1])shape([[side*.35,-.27],[side*(large?1.05:.91),.35+swim],[side*.48,.54],[side*.28,.3]],col);
  shape([[0,.63],[swim-.45,1.33],[swim,1.09],[swim+.45,1.33],[.19,.66]],col);
  c.beginPath();c.moveTo(0,-1.05*u);c.bezierCurveTo(-.61*u,-.63*u,-.68*u,.51*u,0,.94*u);c.bezierCurveTo(.68*u,.51*u,.61*u,-.63*u,0,-1.05*u);c.fillStyle=col;c.fill();c.strokeStyle=dark;c.lineWidth=Math.max(1,u*.055);c.stroke();
  if(!tiny)shape([[0,-.61],[-.12,.04],[0,.37],[.18,.09]],light,null);
  if(large){for(let i=0;i<3;i++)shape([[-.18,-.54+i*.46],[0,-.94+i*.46],[.18,-.54+i*.46],[0,-.39+i*.46]],'#c5ccad');shape([[-.28,-.78],[-.38,-1.21],[-.1,-.92],[0,-1.05],[.1,-.92],[.38,-1.21],[.28,-.78]],light);}
 }
 if(detail&&e.kind!=='eel'&&e.kind!=='ray'&&e.tier>=2){c.beginPath();for(let i=0;i<3;i++){c.moveTo(-.42*u,(-.23+i*.26)*u);c.lineTo(0,(-.38+i*.26)*u);c.lineTo(.42*u,(-.23+i*.26)*u);}c.strokeStyle=light;c.lineWidth=Math.max(.9,u*.08);c.stroke();}
 for(const side of[-1,1]){const ex=e.kind==='eel'?-.12+side*.09:side*.21,ey=e.kind==='eel'?-.86:-.62,rx=Math.max(.9,u*.095),ry=Math.max(.65,u*.06);c.fillStyle=e.tier>=4?'#ffc3a3':'#fbe1a6';if(tiny)c.fillRect(ex*u-rx,ey*u-ry,rx*2,ry*2);else{c.beginPath();c.ellipse(ex*u,ey*u,rx,ry,0,0,TAU);c.fill();}}
 if(detail&&e.kind!=='eel'){c.beginPath();c.moveTo(-.16*u,-.78*u);c.lineTo(.16*u,-.78*u);c.strokeStyle=dark;c.lineWidth=Math.max(.7,u*.04);c.stroke();}
 c.restore();if(e.hp<e.maxHp){const w=Math.max(16,u*1.9);c.fillStyle='#142c38';c.fillRect(p.x-w/2,p.y-u*1.4,w,3);c.fillStyle=large?'#efb18f':'#d7c79c';c.fillRect(p.x-w/2,p.y-u*1.4,w*Math.max(0,Math.min(1,e.hp/e.maxHp)),3);}
}
hero(s){
 const x=s.player.x,y=s.player.y,c=this.ctx,dir=s.player.dir,dx=Math.cos(dir),dy=Math.sin(dir),t=s.tech.weapon,walking=this.heroMoving||false,swing=walking?Math.sin(this.t*10)*.085:0,p=this.p(x,y,.08);
 // A restrained floor ring and overhead marker keep the sailor legible against busy rooms.
 this.ring(x,y,.025,.36,'#e6f2bd',Math.max(1.5,this.scale*.045));this.circle(x,y,.035,.28,'#092e3e77',.45);
 for(const side of[-1,1]){const xx=x+side*.09+dx*swing*side,yy=y+dy*swing*side;this.box(xx,yy,.13,.2,.12,['#526d77','#233b4a','#365867'],.05);this.pole(xx,yy,.25,'#456779',.15,.085);}
 this.box(x-dx*.11,y-dy*.11,.25,.23,.32,['#7b9a96','#375767','#507a83'],.43);
 this.box(x,y,.32,.26,.35,['#efd08d','#a76d4d','#d3a466'],.37);
 this.line([this.p(x-.12,y+.14,.42),this.p(x-.12,y+.14,.67)],'#e4e2b8',Math.max(1,this.scale*.035));this.line([this.p(x+.12,y+.14,.42),this.p(x+.12,y+.14,.67)],'#765e49',Math.max(1,this.scale*.03));
 this.pole(x,y,.12,'#d7ae83',.71,.1);this.circle(x,y,.88,.155,'#e7c59d');this.circle(x+dx*.08,y+dy*.08,.88,.075,'#f2d6ab');
 this.box(x-.015,y-.015,.38,.34,.075,['#f0d89c','#9f7b52','#c3a66b'],.99);this.box(x-.015,y-.015,.24,.23,.12,['#e4ca8a','#95794d','#c5a56d'],1.06);
 const arm=(side)=>{const xx=x-dy*.2*side,yy=y+dx*.2*side;this.line([this.p(xx,yy,.66),this.p(xx+dx*.21,yy+dy*.21,.55)],'#d4ab73',Math.max(2,this.scale*.075));};arm(-1);arm(1);
 const bx=x+dx*.13,by=y+dy*.13,tipx=x+dx*(t>=4?.79:.7),tipy=y+dy*(t>=4?.79:.7);this.line([this.p(bx,by,.59),this.p(tipx,tipy,.71)],t>=3?'#34566a':'#b5a275',Math.max(2,this.scale*(t>=3?.09:.045)));
 if(t>=3){this.line([this.p(bx+dx*.25,by+dy*.25,.65),this.p(tipx,tipy,.74)],t>=5?'#b6ffe1':'#b4d4c7',Math.max(1,this.scale*.035));this.circle(bx,by,.7,.05,t>=4?'#b9ffe1':'#f6db9e');}else{this.line([this.p(tipx-dy*.1-dx*.12,tipy+dx*.1-dy*.12,.75),this.p(tipx,tipy,.71),this.p(tipx+dy*.1-dx*.12,tipy-dx*.1-dy*.12,.67)],'#e6e2be',Math.max(1,this.scale*.035));}
}
heroMarker(s){const p=this.p(s.player.x,s.player.y,.08),c=this.ctx;
 const py=p.y-this.scale*1.57;this.poly([{x:p.x,y:py+4},{x:p.x-4,y:py-2},{x:p.x+4,y:py-2}],'#edf8ce','#355b55');c.font='700 10px system-ui';c.textAlign='center';c.fillStyle='#f3f9d9';c.shadowColor='#123d42';c.shadowBlur=4;c.fillText(translate('你'),p.x,py-6);c.shadowBlur=0;
}
// The camera looks down the +x,+y ray. Screen overlap alone is not depth:
// a roof behind the sailor must never fade merely because its projection is nearby.
// Each model keeps its existing geometry; these volumes only reject impossible
// occluders. Projected faces and interpolated world depth decide actual overlap.
structureItems(s){
 const items=[],t=s.tech.house,r=Tideborn.radius(s),extra=Tideborn.count(s,'floor'),levels=Math.min(5,1+Math.floor(t/2)+Math.min(extra,1));
 const add=(key,x,y,w,d,h,z,draw)=>items.push({key,x,y,w,d,h,z,depth:x+y,draw});
 if(s.tech.factory){const x=-Math.max(1.8,r-1);add('factory',x,.85,2.5,3.1,2.65,0,()=>this.factory(s));}
 if(t){
  const w=t>=5?4.6:t>=3?3.6:2.6,d=t>=3?2.4:2.2;
  add('house',.18,-.68,w+1.05,d+1.05,.38+levels*1.48+(t>=5?1.45:t===1?.68:1.1),0,()=>this.house(s,true));
  if(t>=5){const col=['#b8ccd0','#264c60','#477184'];for(const side of[-1,1])add('wing:'+side,side*3.75,-.3,2.65,4.65,.8+(1+(extra>=(side<0?2:3)?1:0))*1.15,0,()=>this.bastions(s,col,side));add('gate',0,2.25,4.2,1.65,extra>=4?2.5:1.65,0,()=>this.bastions(s,col,3));}
 }
 const sizes={bench:[1.4,1.3,1.3],net:[1.7,1.7,1.5],waterFilter:[1.9,1.65,1.65],eelGenerator:[1.9,1.8,1.6],generator:[2.7,2.7,3.75],turret:[2.5,2.5,2.1],shield:[1.4,1.4,1.2],radar:[1.8,1.8,2.6],frontierForge:[4.3,4.1,3.7],frontierBattery:[5.4,5.4,2.8],frontierHabitat:[4.3,4.3,3.4],frontierRelay:[4.1,4.1,4.9]};
 for(const original of s.buildings){if(['floor','island'].includes(original.type))continue;const b=this.renderAnchor(original,s);let size=sizes[b.type],z=0;
  if(b.type==='garden'){size=[1.9,1.7,1.1];z=.6+levels*1.48;}else if(b.type==='beacon')size=[1.5,1.5,2.2+levels*1.48];
  if(!size)continue;add('facility:'+b.type+':'+b.id,b.x,b.y,...size,z,()=>this.facility(b,s));
 }
 // Stable ties keep rooftop equipment above the same-footprint house.
 const order=item=>item.key==='factory'?1:item.key.startsWith('wing:')?2:item.key==='gate'?3:item.key==='house'?4:item.key.startsWith('facility:garden:')||item.key.startsWith('facility:beacon:')?6:item.depth<0?0:5;
 return items.sort((a,b)=>order(a)-order(b)||a.depth-b.depth);
}
structureInFront(item,player){
 // Sample the sailor's projected body, not the overhead HUD marker. A camera
 // ray keeps (x-y) and .47*(x+y)-z invariant: (x+t,y+t,z+.94*t).
 for(const side of[-.32,0,.32])for(const z of[.12,.42,.75,1.18]){
  const x=player.x+side*.5,y=player.y-side*.5;
  const near=Math.max(.015,item.x-item.w/2-x,item.y-item.d/2-y,(item.z-z)/.94);
  const far=Math.min(item.x+item.w/2-x,item.y+item.d/2-y,(item.z+item.h-z)/.94);
  if(far>=near)return true;
 }
 return false;
}
prepareOcclusionLayer(){
 if(!this.occlusionLayer){
  let canvas=null;
  if(typeof OffscreenCanvas==='function')canvas=new OffscreenCanvas(1,1);
  else if(this.canvas.ownerDocument)canvas=this.canvas.ownerDocument.createElement('canvas');
  else if(typeof document!=='undefined'&&document.createElement)canvas=document.createElement('canvas');
  if(!canvas)return null; // Non-raster Canvas contract harnesses still get depth order.
  this.occlusionLayer={canvas,ctx:canvas.getContext('2d')};
 }
 const layer=this.occlusionLayer,d=this.canvas.width/this.w;
 if(layer.canvas.width!==this.canvas.width||layer.canvas.height!==this.canvas.height){layer.canvas.width=this.canvas.width;layer.canvas.height=this.canvas.height;}
 layer.ctx.setTransform(d,0,0,d,0,0);layer.ctx.clearRect(0,0,this.w,this.h);return layer;
}
primitiveOccludes(points,kind,width){
 const route=this.occlusionRoute;if(!route||!route.enabled||points.some(p=>!Number.isFinite(p.depth)))return false;
 const depth=route.depth+.025;
 for(const sample of route.samples){
  if(kind==='ellipse'){
   const p=points[0],rx=width[0],ry=width[1];if(rx>0&&ry>0&&p.depth>depth&&((sample.x-p.x)/rx)**2+((sample.y-p.y)/ry)**2<=1)return true;
  }else if(kind==='line'){
   for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,n=dx*dx+dy*dy,t=n?Math.max(0,Math.min(1,((sample.x-a.x)*dx+(sample.y-a.y)*dy)/n)):0;
    if(a.depth+(b.depth-a.depth)*t>depth&&Math.hypot(sample.x-a.x-dx*t,sample.y-a.y-dy*t)<width/2+this.scale*.1)return true;
   }
  }else for(let i=1;i<points.length-1;i++){
   const a=points[0],b=points[i],c=points[i+1],den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(den)<1e-7)continue;
   const u=((b.y-c.y)*(sample.x-c.x)+(c.x-b.x)*(sample.y-c.y))/den,v=((c.y-a.y)*(sample.x-c.x)+(a.x-c.x)*(sample.y-c.y))/den,w=1-u-v;
   if(u>=0&&v>=0&&w>=0&&u*a.depth+v*b.depth+w*c.depth>depth)return true;
  }
 }
 return false;
}
paintPrimitive(points,draw,kind='polygon',width=1){
 const route=this.occlusionRoute;
 if(route){if(this.primitiveOccludes(points,kind,width)){route.parts++;route.keys.add(route.key);}if(route.probeOnly)return;}
 draw(this.ctx);
}
drawStructuresAndHero(s,dt){
 const c=this.ctx,items=this.structureItems(s),layer=this.prepareOcclusionLayer(),samples=[];
 for(const side of[-.28,0,.28])for(const z of[.12,.35,.6,.9,1.16])samples.push(this.p(s.player.x+side*.5,s.player.y-side*.5,z));
 // Probe the original projected geometry without painting it. Coarse volumes are
 // never enough to select a building: at least one real face must overlap the
 // sailor AND lie closer to the camera at that pixel.
 const route={samples,depth:s.player.x+s.player.y,parts:0,keys:new Set(),key:'',enabled:false,probeOnly:true};
 this.occlusionRoute=route;if(layer)this.ctx=layer.ctx;
 try{for(const item of items){route.enabled=this.structureInFront(item,s.player);route.key=item.key;if(route.enabled)item.draw();}}finally{this.occlusionRoute=null;this.ctx=c;}
 const step=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0)),live=new Set(items.map(item=>item.key));
 for(const key of this.occlusionFades.keys())if(!live.has(key))this.occlusionFades.delete(key);
 let maxFade=0;
 for(const item of items){const target=route.keys.has(item.key)?1:0,old=this.occlusionFades.get(item.key)||0;let fade=old+(target-old)*(1-Math.exp(-step*(target?18:9)));
  if(Math.abs(target-fade)<.002)fade=target;if(fade>0)this.occlusionFades.set(item.key,fade);else this.occlusionFades.delete(item.key);maxFade=Math.max(maxFade,fade);
 }
 const paint=item=>{
  const fade=this.occlusionFades.get(item.key)||0;
  if(!fade||!layer){c.save();if(fade)c.globalAlpha=1-.77*fade;item.draw();c.restore();return;}
  const d=this.canvas.width/this.w;layer.ctx.setTransform(d,0,0,d,0,0);layer.ctx.clearRect(0,0,this.w,this.h);
  this.ctx=layer.ctx;try{item.draw();}finally{this.ctx=c;}
  // Composite a whole selected structure ONCE, so overlapping model faces do
  // not accidentally stack back to opaque. The single scratch canvas is reused.
  c.save();c.globalAlpha=1-.77*fade;c.drawImage(layer.canvas,0,0,layer.canvas.width,layer.canvas.height,0,0,this.w,this.h);c.restore();
 };
 for(const item of items)if(!route.keys.has(item.key))paint(item);
 this.hero(s);
 for(const item of items)if(route.keys.has(item.key))paint(item);
 this.lastOcclusion={foreground:Array.from(route.keys),parts:route.parts,fade:maxFade,cacheSize:this.occlusionFades.size};
}

fx(s){for(const f of s.effects){if(!Number.isFinite(f.life)||f.life<=0)continue;const a=this.p(f.px||0,f.py||0,f.manual?.7:.7),b=this.p(f.x,f.y,.4),c=this.ctx;c.save();c.globalAlpha=Math.min(1,f.life*4);if(['shot','hook','beam','missile','blast'].includes(f.type)){const col=f.type==='hook'?'#e7d5a4':f.manual?'#fff0b7':f.tier>=5?'#92ffe0':'#ffc184';if(f.type==='missile'){const frac=1-f.life/.42,x=a.x+(b.x-a.x)*frac,y=a.y+(b.y-a.y)*frac-Math.sin(frac*Math.PI)*35;this.line([{x:x-8,y:y-10},{x,y}],col,3);this.circle(f.x,f.y,.3,.1,col);}else{this.line([a,b],col,f.type==='beam'?Math.max(2,this.scale*.11):1.8);if(f.type==='beam')this.line([a,b],'#f2fff5',1);}if(f.radius){const rad=Math.max(0,(.4+(1-f.life/.42)*.6)*f.radius);this.ring(f.x,f.y,.15,rad,col,2);this.ring(f.x,f.y,.15,rad*.72,col,1);}}else if(f.type==='build'){this.ring(f.x,f.y,.3,Math.max(0,1+(1-f.life)*2),'#eaffc799',2);}else if(f.type==='sink'||f.type==='hit'){this.ring(f.x,f.y,.1,Math.max(0,.9-f.life)*1.3,f.type==='hit'?'#ffb1a0':'#d2ffff',2);}if(f.text){c.font='600 11px system-ui';c.textAlign='center';c.fillStyle='#f4f5da';c.shadowColor='#123541';c.shadowBlur=3;c.fillText(translate(f.text),b.x,b.y-14-(1-f.life)*10);}c.restore();}}
draw(s,dt=0){this.t+=dt;this.heroMoving=!!this.lastHero&&Math.hypot(s.player.x-this.lastHero.x,s.player.y-this.lastHero.y)>.001;this.lastHero={x:s.player.x,y:s.player.y};const r=Tideborn.radius(s),mobile=this.w<760;
if(s.stage>=6){
 // Fit the whole 4-island ring, including foundations and antennae. Zoom remains a user multiplier.
 const landscape=this.h<500,margin=mobile?12:24;
 const left=mobile?margin:(landscape?206:this.w<=1100?236:290);
 const right=mobile?this.w-margin:this.w-(this.drawer?(this.w<=1100?338:390):margin);
 const top=mobile?(this.h<670?255:300):(landscape?118:162);
 const bottom=this.h-(mobile?(this.h<670?160:212):(landscape?87:124));
 const width=Math.max(120,right-left),height=Math.max(120,bottom-top);
 const bounds={left:-16.8,right:16.8,top:-11.6,bottom:9.4};
 for(const e of s.enemies)if(e.kind==='abyssTitan'){
  const ex=e.x-e.y,ey=(e.x+e.y)*.47;
  bounds.left=Math.min(bounds.left,ex-6.3);bounds.right=Math.max(bounds.right,ex+6.3);
  bounds.top=Math.min(bounds.top,ey-6.3);bounds.bottom=Math.max(bounds.bottom,ey+6.3);
 }
 const fit=Math.min(mobile?24:38,width/(bounds.right-bounds.left+.5),height/(bounds.bottom-bounds.top+.5));
 this.scale=Math.max(3.4,fit)*this.zoom;
 this.cx=(left+right)/2-(bounds.left+bounds.right)*.5*this.scale;
 this.cy=(top+bottom)/2-(bounds.top+bounds.bottom)*.5*this.scale;
}else{
 const availableW=this.w-(mobile?12:310)-(this.drawer&&!mobile?280:0);
 const fit=Math.min(mobile?29:47,availableW/(r*4+11),(this.h-(mobile?260:200))/(r*2+13));
 this.scale=Math.max(mobile?14:10,fit)*(mobile&&s.stage>=3?1.55:1)*this.zoom;
 this.cx=mobile?this.w*.5:(this.drawer?this.w*.51:this.w*.59);this.cy=mobile?this.h*.59:this.h*.57;
 if(mobile&&s.stage>=3){this.cx-=(s.player.x-s.player.y)*this.scale*.25;this.cy-=(s.player.x+s.player.y)*this.scale*.47*.2;const hx=this.cx+(s.player.x-s.player.y)*this.scale;this.cx+=Math.max(30,Math.min(this.w-30,hx))-hx;const hy=this.cy+(s.player.x+s.player.y)*this.scale*.47;this.cy+=Math.max(290,Math.min(this.h-180,hy))-hy;}
}
this.crowdCount=s.enemies.length;this.crowdPlayer=s.player;this.sea(s);const back=s.enemies.filter(e=>e.x+e.y<0),front=s.enemies.filter(e=>e.x+e.y>=0);for(const e of back)this.enemy(e);for(const p of s.salvage){this.box(p.x,p.y,.38,.45,.12,p.type==='wood'?['#d2ad78','#7a6248','#ad8456']:p.type==='scrap'?['#b9c8bc','#526c72','#7c9698']:['#8fb6a0','#587c78','#739e8c']);if(Math.hypot(p.x-s.player.x,p.y-s.player.y)<3.9+s.tech.weapon*.35)this.ring(p.x,p.y,.03,.32,'#dcf4bf65',1);}
this.frontierSites(s);
const islands=s.buildings.filter(b=>b.type==='island').sort((a,b)=>a.x+a.y-b.x-b.y);
for(const b of islands)this.frontierPlatform(b,s);
this.deck(s);this.deckDetails(s);
for(const b of islands)this.frontierBridge(b);
this.chargeWarning(s);
this.shadow(-Math.max(1.8,r-1),.4,1.7,1.8,1.7);this.houseShadow(s);
this.drawStructuresAndHero(s,dt);
if(s.shield>0){const rr=r+.25;this.line([this.p(-rr,rr,.55),this.p(rr,rr,.55),this.p(rr,-rr,.55)],'#85f5f169',2);}for(const e of front)this.enemy(e);this.fx(s);if(s.storm>0){const c=this.ctx;c.strokeStyle='#b4e3ed42';c.lineWidth=1;for(let i=0;i<65;i++){const x=(i*89+this.t*240)%(this.w+60)-30,y=(i*137+this.t*400)%this.h;this.line([{x,y},{x:x-12,y:y+25}],'#bae8ed30',1);}if(s.stormTier>=4){const c=this.ctx;c.strokeStyle='#9bffff28';c.lineWidth=4;const y=(this.t*45)%this.h;c.beginPath();c.moveTo(0,y);c.bezierCurveTo(this.w*.3,y-50,this.w*.65,y+60,this.w,y);c.stroke();}}this.heroMarker(s);
}
}
window.TidebornRenderer=Renderer;
})();
