(function(){'use strict';
const C={ink:'#173033',paper:'#edeadf',gold:'#e8b968'};
function shade(hex,n){if(!hex||!/^#[0-9a-f]{6}$/i.test(hex))hex='#9aafa0';return '#'+[1,3,5].map(i=>Math.max(0,Math.min(255,parseInt(hex.slice(i,i+2),16)+n)).toString(16).padStart(2,'0')).join('');}
class Renderer{
constructor(canvas){this.skinId='original';this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.w=0;this.h=0;this.cam={x:0,y:0,zoom:1};this.particles=[];this.pulses=[];this.geometryCache=new Map();this.geometryCacheLimit=768;this.spriteCache=new Map();this.spriteBytes=0;this.spriteByteLimit=96*1024*1024;this.spriteLimit=256;this.depthOrders=new WeakMap();this.menuImages=new Map();this.stats={visible:0,candidates:0,cacheBuilds:0,menuImage:false,spriteBuilds:0,spriteHits:0,spriteBytes:0};this.resize();}
setSkin(id){this.skinId=window.HCSkins?window.HCSkins.valid(id):'original';return this.skinId;}
resize(){this.w=innerWidth;this.h=innerHeight;const d=Math.min(devicePixelRatio||1,2);this.canvas.width=this.w*d;this.canvas.height=this.h*d;this.ctx.setTransform(d,0,0,d,0,0);}
project(x,y,z=0){return{world:[x,y,z],x:this.w*.5+((x-y)-(this.cam.x-this.cam.y))*.866*this.cam.zoom,y:this.h*.51+((x+y)-(this.cam.x+this.cam.y))*.5*this.cam.zoom-z*this.cam.zoom};}
poly(points,fill,stroke,strokeWidth=.8){if(this.geometryQueue&&points.every(p=>p.world)){this.geometryQueue.push({points:points.map(p=>p.world),fill,stroke,serial:this.geometryQueue.length});return;}let c=this.ctx;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=strokeWidth;c.stroke();}}
quad(x,y,w,d,z,color){this.poly([this.project(x,y,z),this.project(x+w,y,z),this.project(x+w,y+d,z),this.project(x,y+d,z)],color);}
box(x,y,w,d,h,color,z=0){const a=this.project(x,y,z),b=this.project(x+w,y,z),cc=this.project(x+w,y+d,z),dd=this.project(x,y+d,z),A=this.project(x,y,z+h),B=this.project(x+w,y,z+h),D=this.project(x,y+d,z+h),CC=this.project(x+w,y+d,z+h);this.poly([dd,cc,CC,D],shade(color,-16));this.poly([b,cc,CC,B],shade(color,-33));this.poly([A,B,CC,D],shade(color,19));}
ellipse(x,y,rx,ry,fill){const c=this.ctx;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);c.fillStyle=fill;c.fill();}
// All district architecture is presentation-only. Components stay inside the
// original object's w/d/height envelope and share its one swallowing transform.
line(points,color,width=1){if(this.geometryQueue&&points.every(p=>p.world)){for(let i=1;i<points.length;i++)this.geometryQueue.push({points:[points[i-1].world,points[i].world],stroke:color,width,line:true,serial:this.geometryQueue.length});return;}const c=this.ctx;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle=color;c.lineWidth=Math.max(.45,width*this.cam.zoom);c.stroke();}
front(x,y,w,z,h,color){this.poly([this.project(x,y,z),this.project(x+w,y,z),this.project(x+w,y,z+h),this.project(x,y,z+h)],color);}
side(x,y,d,z,h,color){this.poly([this.project(x,y,z),this.project(x,y+d,z),this.project(x,y+d,z+h),this.project(x,y,z+h)],color);}
roof(x,y,w,d,eave,peak,color){
this.poly([this.project(x,y,eave),this.project(x+w/2,y,peak),this.project(x+w,y,eave)],shade(color,5));
this.poly([this.project(x,y+d,eave),this.project(x+w,y+d,eave),this.project(x+w/2,y+d,peak)],shade(color,-22));
this.poly([this.project(x,y,eave),this.project(x+w/2,y,peak),this.project(x+w/2,y+d,peak),this.project(x,y+d,eave)],shade(color,15));
this.poly([this.project(x+w/2,y,peak),this.project(x+w,y,eave),this.project(x+w,y+d,eave),this.project(x+w/2,y+d,peak)],shade(color,-8));
}
windows(x,y,w,d,h,{glass='#537672',rows=2,cols=3,bottom=5,top=h-5,wide=false}={}){
for(let row=0;row<rows;row++)for(let j=0;j<cols;j++){let xx=x+4+j*(w-8)/cols,zz=bottom+row*(top-bottom)/rows;this.front(xx,y+d+.02,(w-8)/cols*(wide?.78:.44),zz,Math.max(2,Math.min(wide?12:7,(top-bottom)/rows*.55)),glass);}
for(let j=0;j<Math.max(1,cols-1);j++)this.side(x+w+.02,y+5+j*(d-9)/Math.max(1,cols-1),Math.max(2,(d-9)/cols*.4),bottom,Math.min(7,h*.17),shade(glass,-10));
}
awning(x,y,w,d,z,color){this.box(x,y,w,d,2,color,z);for(let i=0;i<7;i++){const cc=i%2?'#f4e5c9':color;this.quad(x+i*w/7,y,w/7,d,z+2.02,cc);this.front(x+i*w/7,y+d+.02,w/7,z-2,4,cc);}}
clock(x,y,w,z){if(this.geometryQueue){const p=(dx,dy)=>this.project(x+dx/.866,y,z+dx/.866*.5-dy);let ring=[];for(let i=0;i<24;i++){let a=i*Math.PI/12;ring.push(p(w*Math.cos(a),w*Math.sin(a)));}this.poly(ring,'#efe5c7','#765d46');this.line([p(0,-w*.65),p(0,0),p(w*.5,w*.15)],'#604b3c',1.5);return;}const c=this.ctx,p=this.project(x,y,z),r=w*this.cam.zoom;this.ellipse(p.x,p.y,r,r,'#efe5c7');c.strokeStyle='#765d46';c.lineWidth=Math.max(.6,this.cam.zoom);c.beginPath();c.arc(p.x,p.y,r,0,Math.PI*2);c.stroke();this.line([{x:p.x,y:p.y-r*.65},p,{x:p.x+r*.5,y:p.y+r*.15}],'#604b3c',1.5);}
oldtown(o,x,y,w,d,h,col,variant){
const large=o.kind==='landmark'||o.kind==='tower';
if(large){
// Municipal hall plus a genuinely narrow clock tower, not a roof ornament.
this.box(x,y,w,d,h*.32,col);this.roof(x,y,w,d,h*.32,h*.47,'#9a644f');
this.windows(x,y,w,d,h*.3,{rows:2,cols:5,top:h*.28});
const tx=x+w*.39,ty=y+d*.33,tw=w*.27,td=d*.42;
this.box(tx,ty,tw,td,h*.83,shade(col,9));this.box(tx,ty,tw,td,h*.035,'#dccdaf',h*.67);
this.clock(tx+tw*.5,ty+td+.04,tw*.22,h*.74);
this.front(tx+tw*.38,ty+td+.03,tw*.24,h*.44,h*.14,'#77685a');
this.roof(tx,ty,tw,td,h*.83,h,'#725c51');
}else{
const e=h*.65,peak=h*.91,roofcol=['#a9664f','#88756a','#a97855'][variant%3];
this.box(x,y,w,d,e,col);this.roof(x,y,w,d,e,peak,roofcol);
// Terracotta tile seams, chimney and striped storefront are real geometry.
for(let j=1;j<5;j++)this.line([this.project(x+w*.5,y+d*j/5,peak+.03),this.project(x+w,y+d*j/5,e+.03)],shade(roofcol,-17),.65);
this.box(x+w*.17,y+d*.2,w*.1,d*.13,h*.3,'#b39378',h*.7);
this.windows(x,y,w,d,e,{rows:o.kind==='warehouse'?2:1,cols:Math.max(2,Math.round(w/19)),bottom:e*.48,top:e*.9});
this.front(x+w*.43,y+d+.02,w*.15,0,e*.41,'#645e50');
this.awning(x+w*.09,y+d*.77,w*.82,d*.23,e*.42,['#b76d50','#709382','#a89058'][variant%3]);
}}
harbor(o,x,y,w,d,h,col,variant){
if(o.kind==='landmark'){
// Gantry crane: open undercarriage, cross-beam, operator cab and hanging hoist.
this.box(x,y,w,d,7,'#788e8b');
for(const xx of[x+w*.12,x+w*.79]){
this.box(xx-w*.03,y+d*.14,w*.15,d*.68,5,'#526d70',7);
for(const yy of[y+d*.22,y+d*.65])this.box(xx,yy,w*.075,d*.075,h*.75,'#c69553',12);
this.box(xx,y+d*.2,w*.075,d*.53,h*.045,'#bc8d4e',h*.82);
}
this.box(x+w*.06,y+d*.61,w*.9,d*.15,h*.095,'#e4b866',h*.81);
this.box(x+w*.06,y+d*.2,w*.9,d*.12,h*.055,'#d2a358',h*.82);
this.box(x+w*.65,y+d*.5,w*.16,d*.24,h*.14,'#739494',h*.8);
this.front(x+w*.67,y+d*.74,w*.12,h*.84,h*.065,'#c6e2db');
this.line([this.project(x+w*.44,y+d*.68,h*.81),this.project(x+w*.44,y+d*.68,h*.39)],'#4a6261',1.5);
this.box(x+w*.37,y+d*.6,w*.15,d*.15,h*.04,'#c6914d',h*.35);
for(const xx of[x+w*.16,x+w*.83])this.line([this.project(xx,y+d*.25,h*.24),this.project(xx,y+d*.7,h*.78)],'#dfbe79',2);
this.container(x+w*.29,y+d*.58,w*.4,d*.33,h*.24,'#a86e50',7);
}else if(o.kind==='tower'){
// Stacked shipping containers preserve the same collectible size tier.
this.container(x,y,w,d*.45,h*.31,'#7d9fa0',0);this.container(x,y+d*.53,w,d*.47,h*.31,'#ba8058',0);
this.container(x+w*.08,y+d*.17,w*.84,d*.46,h*.31,'#d0aa67',h*.32);
this.container(x+w*.23,y+d*.22,w*.62,d*.4,h*.22,'#718b8c',h*.64);
}else{
const e=h*.65;this.box(x,y,w,d,e,shade(col,-9));if(o.kind==='warehouse'){for(let bay=0;bay<3;bay++)this.roof(x+bay*w/3,y,w/3,d,e,h*.82,'#718586');}else this.roof(x,y,w,d,e,h*.82,'#718586');
for(let j=1;j<Math.min(12,w/5);j++){const xx=x+w*j/Math.min(12,w/5);this.line([this.project(xx,y+d+.03,4),this.project(xx,y+d+.03,e-2)],shade(col,-27),.8);}
for(let bay=0;bay<(o.kind==='warehouse'?3:1);bay++){const bays=o.kind==='warehouse'?3:1,bw=w/bays,bx=x+bay*bw;for(let j=1;j<7;j++)this.line([this.project(bx+bw*.5,y+j*d/7,h*.82+.02),this.project(bx+bw,y+j*d/7,e+.02)],'#a4b4ac',1);}
this.front(x+w*.19,y+d+.05,w*.6,0,e*.73,'#5a7171');
for(let j=1;j<6;j++)this.line([this.project(x+w*.2,y+d+.07,j*e*.12),this.project(x+w*.78,y+d+.07,j*e*.12)],'#839491',.7);
this.front(x+w*.34,y+d+.09,w*.3,e*.79,e*.12,'#e3c778');
this.box(x+w*.78,y+d*.7,w*.16,d*.25,h*.19,'#ad8456',0);
}}
container(x,y,w,d,h,col,z){this.box(x,y,w,d,h,col,z);for(let i=1;i<9;i++)this.line([this.project(x+i*w/9,y+d+.02,z+2),this.project(x+i*w/9,y+d+.02,z+h-2)],shade(col,-25),1);this.side(x+w+.03,y+d*.18,d*.64,z+h*.14,h*.74,shade(col,5));this.line([this.project(x+w+.04,y+d*.5,z+3),this.project(x+w+.04,y+d*.5,z+h-3)],shade(col,-32),1);}
glasshouse(x,y,w,d,h){
const e=h*.55;this.box(x,y,w,d,5,'#d6d5b5');this.box(x+2,y+2,w-4,d-4,e-5,'#a1c3b2',5);this.roof(x+2,y+2,w-4,d-4,e,h,'#aecfc0');
for(let j=0;j<=5;j++){const xx=x+2+(w-4)*j/5;this.line([this.project(xx,y+d-2,5),this.project(xx,y+d-2,e)],'#eef0d6',1.4);}
for(let j=0;j<=5;j++){const yy=y+2+(d-4)*j/5;this.line([this.project(x+2,yy,e),this.project(x+w*.5,yy,h),this.project(x+w-2,yy,e),this.project(x+w-2,yy,5)],'#e7edcc',1.5);}
this.line([this.project(x+w*.5,y+2,h),this.project(x+w*.5,y+d-2,h)],'#f2edcf',2);
this.front(x+w*.4,y+d-1.95,w*.2,5,e*.75,'#729e89');
}
garden(o,x,y,w,d,h,col,variant){
if(o.kind==='landmark'){
if(variant%3===1&&!/温室|玻璃/.test(o.label||'')){
// Tier-six garden fountain: a low basin plus an open, sculptural water column.
this.box(x+w*.08,y+d*.08,w*.84,d*.84,8,'#d8cba6');this.box(x+w*.14,y+d*.14,w*.72,d*.72,5,'#7eaaa1',8);
this.box(x+w*.43,y+d*.42,w*.14,d*.16,h*.32,'#d9d9b7',13);
this.box(x+w*.28,y+d*.27,w*.44,d*.46,6,'#dedbc1',h*.39);
this.box(x+w*.33,y+d*.32,w*.34,d*.36,2,'#8ac5be',h*.39+6);
this.line([this.project(x+w*.5,y+d*.5,h*.91),this.project(x+w*.5,y+d*.5,h*.42)],'#d7f1df',5);
for(const dx of[-.17,.17])this.line([this.project(x+w*.5,y+d*.5,h*.91),this.project(x+w*(.5+dx),y+d*.55,h*.66),this.project(x+w*(.5+dx*1.6),y+d*.55,h*.43)],'#b4ddd1',2);
}else{this.glasshouse(x,y,w,d,h*.88);this.box(x+w*.44,y+d*.39,w*.12,d*.22,h*.12,'#dedec2',h*.88);}
}else if(o.kind==='warehouse'||o.kind==='tower'){this.glasshouse(x,y,w,d,h*.78);}
else{
const e=h*.55;this.box(x+w*.04,y+d*.04,w*.92,d*.76,e,col);this.roof(x+w*.02,y+d*.02,w*.96,d*.8,e,h*.87,variant%2?'#83936b':'#8fa179');
this.windows(x+w*.04,y+d*.04,w*.92,d*.76,e,{rows:1,cols:2,bottom:e*.35,top:e*.85,glass:'#789c89'});
this.front(x+w*.43,y+d*.805,w*.16,0,e*.63,'#6a8169');
// Timber pergola over the front terrace, all within the existing rectangle.
for(const xx of[x+w*.12,x+w*.83])this.box(xx,y+d*.88,w*.035,d*.045,h*.43,'#b3a581');
for(let j=0;j<6;j++)this.box(x+w*.07+j*w*.16,y+d*.72,w*.035,d*.28,2,'#d0c6a1',h*.43);
this.box(x+w*.06,y+d*.88,w*.88,d*.04,3,'#bdb68f',h*.39);
}}
skyline(o,x,y,w,d,h,col,variant){
// Setback glass towers, stepped in plan and height; a single collectible body.
const landmark=o.kind==='landmark',small=o.kind==='house'||o.kind==='kiosk',pod=h*(small?.22:.16);
this.box(x,y,w,d,pod,'#b6b9bd');
const tw=w*(landmark?.48:.75),td=d*.7,tx=x+w*.09,ty=y+d*.06;
this.glassTower(tx,ty,tw,td,h*.7,col,pod);
this.glassTower(tx+tw*.14,ty+td*.13,tw*.72,td*.72,h*.12,shade(col,10),h*.86);
if(landmark)this.glassTower(x+w*.65,y+d*.26,w*.29,d*.65,h*.58,shade(col,-8),pod);
this.box(x+w*.03,y+d*.84,w*.94,d*.13,3,'#dbdace',pod);
this.front(x+w*.17,y+d*.971,w*.18,2,pod*.65,'#647983');
// Thin roof light/antenna, never taller than the catalog height.
this.box(tx+tw*.47,ty+td*.4,Math.max(2,w*.025),Math.max(2,d*.025),h*.02,'#dbcba2',h*.98);
if(landmark){
// Angular sculpture sits on the collectible podium, never a fake street object.
this.poly([this.project(x+w*.6,y+d*.85,pod+3),this.project(x+w*.73,y+d*.83,pod+h*.24),this.project(x+w*.86,y+d*.84,pod+3)],'#e1bd7c');
this.poly([this.project(x+w*.6,y+d*.85,pod+3),this.project(x+w*.73,y+d*.83,pod+h*.24),this.project(x+w*.74,y+d*.92,pod+3)],'#a68867');
}}
glassTower(x,y,w,d,h,col,z){
this.box(x,y,w,d,h,col,z);this.front(x+2,y+d+.02,w-4,z+2,h-4,'#7897a4');this.side(x+w+.02,y+2,d-4,z+2,h-4,'#607e8e');
const floors=Math.max(2,Math.min(9,Math.floor(h/10)));
for(let j=1;j<floors;j++){this.line([this.project(x+2,y+d+.04,z+h*j/floors),this.project(x+w-2,y+d+.04,z+h*j/floors)],'#b0c7c7',.8);this.line([this.project(x+w+.04,y+2,z+h*j/floors),this.project(x+w+.04,y+d-2,z+h*j/floors)],'#94b0b8',.7);}
for(let i=1;i<4;i++)this.line([this.project(x+w*i/4,y+d+.04,z+2),this.project(x+w*i/4,y+d+.04,z+h-2)],'#aec3c8',.8);
this.poly([this.project(x+w*.16,y+d+.06,z+3),this.project(x+w*.37,y+d+.06,z+3),this.project(x+w*.82,y+d+.06,z+h-3),this.project(x+w*.61,y+d+.06,z+h-3)],'#e4eeee20');
}
// v0.3 scene art uses normalized object-local coordinates. Every part is
// within [0,1]^3 and is rendered inside drawObject's single sink transform.
// Orthographic camera rays are parallel to (1,1,1): project(p+t*[1,1,1])
// is invariant. Increasing x+y+z is nearer, NOT increasing screen y.
// BSP splits intersecting faces/segments at true world planes. Unlike centroid
// sorting it preserves per-pixel visibility for curved roofs and nested volumes.
orderGeometry(commands){
const EPS=1e-6,dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],sub=(a,b)=>a.map((v,i)=>v-b[i]);
const plane=pts=>{for(let i=1;i<pts.length-1;i++){let a=sub(pts[i],pts[0]),b=sub(pts[i+1],pts[0]),n=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=Math.hypot(...n);if(len>EPS){n=n.map(v=>v/len);return{n,k:dot(n,pts[0])};}}return null;};
// Curved authoring can produce slightly twisted quads; split those into
// planar triangles before BSP construction, retaining authored coplanar polygons.
commands=commands.flatMap(c=>{
if(c.line)return[c];const p=plane(c.points);if(!p)return[c];
if(!c.points.every(q=>Math.abs(dot(p.n,q)-p.k)<=EPS))return c.points.slice(2).map((q,i)=>({...c,points:[c.points[0],c.points[i+1],q]}));
// Concave silhouettes (for example carousel horses) need convex pieces before
// plane clipping; ear clipping preserves their actual outline, unlike a fan.
const axis=p.n.map(Math.abs).indexOf(Math.max(...p.n.map(Math.abs))),uv=c.points.map(q=>q.filter((_,i)=>i!==axis)),cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),area=uv.reduce((a,q,i)=>a+q[0]*uv[(i+1)%uv.length][1]-q[1]*uv[(i+1)%uv.length][0],0),sign=Math.sign(area)||1;
if(uv.every((q,i)=>cross(uv[(i+uv.length-1)%uv.length],q,uv[(i+1)%uv.length])*sign>=-EPS))return[c];
let ids=uv.map((_,i)=>i),tris=[];while(ids.length>3){let ear=-1;for(let k=0;k<ids.length;k++){let a=ids[(k+ids.length-1)%ids.length],b=ids[k],d=ids[(k+1)%ids.length];if(cross(uv[a],uv[b],uv[d])*sign<=EPS)continue;if(ids.some(j=>j!==a&&j!==b&&j!==d&&cross(uv[a],uv[b],uv[j])*sign>=-EPS&&cross(uv[b],uv[d],uv[j])*sign>=-EPS&&cross(uv[d],uv[a],uv[j])*sign>=-EPS))continue;tris.push({...c,points:[c.points[a],c.points[b],c.points[d]]});ear=k;break;}if(ear<0)return[c];ids.splice(ear,1);}tris.push({...c,points:ids.map(i=>c.points[i])});return tris;
});
const split=(cmd,p)=>{let ds=cmd.points.map(q=>dot(p.n,q)-p.k),pos=ds.some(d=>d>EPS),neg=ds.some(d=>d<-EPS);if(!pos&&!neg)return[null,null,cmd];if(!neg)return[cmd,null,null];if(!pos)return[null,cmd,null];let a=[],b=[],count=cmd.line?1:cmd.points.length;for(let i=0;i<count;i++){let j=(i+1)%cmd.points.length,q=cmd.points[i],r=cmd.points[j],d=ds[i],e=ds[j];if(d>=-EPS)a.push(q);if(d<=EPS)b.push(q);if((d>EPS&&e<-EPS)||(d<-EPS&&e>EPS)){let t=d/(d-e),v=q.map((n,k)=>n+(r[k]-n)*t);a.push(v);b.push(v);}}if(cmd.line){let q=cmd.points[1],d=ds[1];if(d>=-EPS)a.push(q);if(d<=EPS)b.push(q);}let min=cmd.line?2:3;return[a.length>=min?{...cmd,points:a}:null,b.length>=min?{...cmd,points:b}:null,null];};
const build=list=>{if(!list.length)return null;let chosen=list.find(c=>!c.line&&plane(c.points));if(!chosen)return{leaf:list};let p=plane(chosen.points),front=[],back=[],same=[];for(const cmd of list){let[a,b,c]=split(cmd,p);if(a)front.push(a);if(b)back.push(b);if(c)same.push(c);}return{p,same,front:build(front),back:build(back)};};
let out=[];const visit=node=>{if(!node)return;if(node.leaf){out.push(...node.leaf.sort((a,b)=>a.serial-b.serial));return;}let facing=node.p.n.reduce((a,b)=>a+b,0)>=0;visit(facing?node.back:node.front);out.push(...node.same.sort((a,b)=>a.serial-b.serial));visit(facing?node.front:node.back);};visit(build(commands));return out;
}
sceneObject(o,x,y,w,d,h,col,scene,v,shared=false){
// The approved tea pavilion is frozen, including its original painter order.
if(!scene||(scene==='lotustea'&&!['bin','cone','lamp','bench','tree','car','van'].includes(o.kind)))return this.sceneObjectLegacy(o,x,y,w,d,h,col,scene,v);
// Original maps retain bit-exact world-coordinate geometry. Expanded maps share
// only identical physical models; v is used exclusively modulo 2/3/4 (LCM 12).
const key=[shared?'shared':'world',scene,o.kind,o.signature||false,o.label||'',...(shared?[]:[x,y]),w,d,h,col,shared?v%12:v].join('|');let ordered=this.geometryCache.get(key),handled;
if(!ordered){this.geometryQueue=[];try{handled=this.sceneObjectLegacy(o,x,y,w,d,h,col,scene,v);}finally{const commands=this.geometryQueue;this.geometryQueue=null;ordered=this.orderGeometry(commands);ordered.handled=handled;ordered.originX=x;ordered.originY=y;if(this.geometryCache.size>=this.geometryCacheLimit)this.geometryCache.delete(this.geometryCache.keys().next().value);this.geometryCache.set(key,ordered);this.stats.cacheBuilds++;}}
const dx=shared?x-ordered.originX:0,dy=shared?y-ordered.originY:0;
for(const cmd of ordered){const pts=cmd.points.map(p=>dx||dy?this.project(p[0]+dx,p[1]+dy,p[2]):this.project(...p));if(cmd.line)this.line(pts,cmd.stroke,cmd.width);else{const opaque=/^#[0-9a-f]{6}$/i.test(cmd.fill);this.poly(pts,cmd.fill,cmd.stroke||(opaque?cmd.fill:null),cmd.stroke?.8:.5);}}return ordered.handled;
}
sceneObjectLegacy(o,x,y,w,d,h,col,scene,v){
if(!scene)return false;
const B=(a,b,c,ww,dd,hh,color)=>this.box(x+a*w,y+b*d,ww*w,dd*d,hh*h,color,c*h),
P=(a,b,c)=>this.project(x+a*w,y+b*d,c*h),
L=(points,color,width=1)=>this.line(points.map(p=>P(...p)),color,width),
F=(points,color)=>this.poly(points.map(p=>P(...p)),color),
R=(a,b,ww,dd,e,peak,color)=>this.roof(x+a*w,y+b*d,ww*w,dd*d,e*h,peak*h,color),
D=(cx,cy,z,rx,ry,color)=>{let a=[];for(let i=0;i<20;i++){let t=i*Math.PI/10;a.push(P(cx+rx*Math.cos(t),cy+ry*Math.sin(t),z));}this.poly(a,color);},
// Painter ordering is camera-depth aware; rear cylinder/dome facets must never
// cover their forward silhouettes. Lighting is shared by all curved models.
MESH=(faces)=>faces.sort((a,b)=>a.points.reduce((n,p)=>n+p[0]*w+p[1]*d+p[2]*h,0)/a.points.length-b.points.reduce((n,p)=>n+p[0]*w+p[1]*d+p[2]*h,0)/b.points.length).forEach(f=>F(f.points,f.color)),
TAPER=(cx,cy,z,rx,ry,hh,top,color)=>{let faces=[];for(let i=0;i<16;i++){let a=i*Math.PI/8,b=(i+1)*Math.PI/8,m=(a+b)/2;faces.push({points:[[cx+rx*Math.cos(a),cy+ry*Math.sin(a),z],[cx+rx*Math.cos(b),cy+ry*Math.sin(b),z],[cx+rx*top*Math.cos(b),cy+ry*top*Math.sin(b),z+hh],[cx+rx*top*Math.cos(a),cy+ry*top*Math.sin(a),z+hh]],color:shade(color,Math.round(11*Math.sin(m)-20*Math.cos(m)-5))});}MESH(faces);D(cx,cy,z+hh,rx*top,ry*top,shade(color,18));},
C=(cx,cy,z,rx,ry,hh,color)=>TAPER(cx,cy,z,rx,ry,hh,1,color),
DOME=(cx,cy,z,rx,ry,hh,color,slit=false)=>{let faces=[];for(let row=0;row<6;row++){let a=row*Math.PI/12,b=(row+1)*Math.PI/12;for(let i=0;i<16;i++){let t=i*Math.PI/8,u=(i+1)*Math.PI/8,m=(t+u)/2;faces.push({points:[[cx+rx*Math.cos(a)*Math.cos(t),cy+ry*Math.cos(a)*Math.sin(t),z+hh*Math.sin(a)],[cx+rx*Math.cos(a)*Math.cos(u),cy+ry*Math.cos(a)*Math.sin(u),z+hh*Math.sin(a)],[cx+rx*Math.cos(b)*Math.cos(u),cy+ry*Math.cos(b)*Math.sin(u),z+hh*Math.sin(b)],[cx+rx*Math.cos(b)*Math.cos(t),cy+ry*Math.cos(b)*Math.sin(t),z+hh*Math.sin(b)]],color:slit&&i===3?'#354f60':shade(color,Math.round(10*Math.sin(m)-17*Math.cos(m)+row*3))});}}MESH(faces);},
// Swept hip roof: lifted corners, low eave middles and an inset roof crown.
// Everything is geometric and remains inside the original collectible envelope.
HIP=(a,b,ww,dd,e,peak,color)=>{const xy=[[0,0],[.5,0],[1,0],[1,.5],[1,1],[.5,1],[0,1],[0,.5]],outer=xy.map((q,i)=>[a+q[0]*ww,b+q[1]*dd,e+(i%2?0:(peak-e)*.25)]),inner=xy.map(q=>[a+(.22+q[0]*.56)*ww,b+(.22+q[1]*.56)*dd,peak-(peak-e)*.21]);let faces=[];for(let i=0;i<8;i++){let j=(i+1)%8;faces.push({points:[outer[i],outer[j],inner[j],inner[i]],color:shade(color,[13,13,-20,-20,-5,-5,21,21][i])});faces.push({points:[outer[i],outer[j],outer[j].map((v,k)=>k===2?v-.025:v),outer[i].map((v,k)=>k===2?v-.025:v)],color:shade(color,-25)});}faces.push({points:[inner[0],inner[1],inner[2],[a+ww*.5,b+dd*.38,peak]],color:shade(color,14)},{points:[inner[2],inner[3],inner[4],[a+ww*.5,b+dd*.62,peak],[a+ww*.5,b+dd*.38,peak]],color:shade(color,-16)},{points:[inner[4],inner[5],inner[6],[a+ww*.5,b+dd*.62,peak]],color:shade(color,-1)},{points:[inner[6],inner[7],inner[0],[a+ww*.5,b+dd*.38,peak],[a+ww*.5,b+dd*.62,peak]],color:shade(color,23)});MESH(faces);L([[a+ww*.5,b+dd*.29,peak+.008],[a+ww*.5,b+dd*.71,peak+.008]],shade(color,30),1.8);},
POST=(a,b,z,hh,color='#7b7561')=>B(a,b,z,.035,.035,hh,color),
WINDOWS=(z=.24,hh=.18,color='#759da1',n=4)=>{for(let i=0;i<n;i++)B(.1+i*.8/n,.965,z,.8/n*.6,.025,hh,color);},
// v09 miniatures: few large features, connected load paths, no floating detail.
BOOKS=(z=.1)=>{for(let j=0;j<3;j++){const a=.1+(j%2)*.06,zz=z+j*.19,cc=['#a9574d','#b09a50','#588b89'][j];B(a,.15,zz,.72,.65,.025,cc);B(a+.025,.16,zz+.025,.67,.61,.12,'#e5d8b9');B(a,.15,zz+.145,.72,.65,.025,cc);B(a,.15,zz+.02,.045,.65,.13,cc);}},
FISH=(a,b,z,len=.3,wide=.1,color='#dce1ce')=>{const q=(xx,yy,zz=0)=>[a+xx*len,b+yy*wide,z+zz];F([q(.22,0),q(.4,-.75),q(.73,-1),q(.96,-.4),q(1,0),q(.96,.4),q(.73,1),q(.4,.75)],color);F([q(.26,0),q(0,-.85),q(0,.85)],shade(color,-20));F([q(.48,-.67),q(.56,-1.35),q(.68,-.9)],shade(color,-30));D(a+len*.83,b-wide*.18,z+.003,len*.023,wide*.13,'#3b6266');L([q(.76,-.66,.002),q(.71,.1,.002),q(.77,.69,.002)],'#7eaaa6',.7);},
CRATE=(color,content,fish=false)=>{B(.05,.06,0,.9,.88,.1,color);B(.09,.1,.1,.82,.8,.24,'#746a54');for(const a of[.05,.87])B(a,.06,.1,.08,.88,.42,color);for(const b of[.06,.86]){B(.05,b,.1,.9,.08,.16,color);B(.05,b,.34,.9,.08,.14,color);}for(const a of[.12,.81])B(a,.948,.07,.065,.012,.43,shade(color,-25));if(fish){FISH(.17,.36,.39,.64,.12,content);FISH(.19,.67,.4,.59,.1,content);}else for(const [a,b]of[[.28,.34],[.7,.36],[.49,.7]])DOME(a,b,.34,.17,.17,.27,content);},
PRODUCE=(z=.4)=>{for(const a of[.25,.53,.77]){B(a-.11,.67,z,.22,.22,.045,'#806e51');DOME(a,.78,z+.045,.09,.095,.105,a===.53?'#d1a952':'#c47e45');}},
STALL=(color,fish=false)=>{
// Four posts end at the continuous eave ring. The one roof starts on that ring.
B(.06,.08,0,.88,.86,.055,'#b5a68a');
for(const a of[.075,.87])for(const b of[.1,.84])B(a,b,.055,.055,.055,.575,'#8d7557');
for(const b of[.06,.875])B(.04,b,.63,.92,.065,.055,'#9d805b');
for(const a of[.04,.895])B(a,.06,.63,.065,.88,.055,'#9d805b');
R(.04,.06,.92,.88,.685,.92,color);
for(let i=0;i<5;i++)F([[.04+i*.184,.94,.685],[.224+i*.184,.94,.685],[.224+i*.184,.94,.62],[.04+i*.184,.94,.62]],i%2?'#f1e2bb':color);
B(.13,.65,.055,.74,.25,.27,'#a58a64');B(.1,.62,.325,.8,.31,.045,'#d3bb92');
if(fish){B(.15,.66,.37,.7,.22,.024,'#668f94');FISH(.16,.78,.397,.31,.075);FISH(.53,.78,.4,.29,.07);}else PRODUCE(.37);
},
SHOP=(wall,roof)=>{
// Closed shop: one masonry volume, one roof, a shallow wall-mounted front awning.
B(.1,.1,0,.8,.66,.65,wall);R(.06,.06,.88,.74,.65,.94,roof);
B(.18,.765,.19,.26,.018,.3,'#638688');B(.55,.765,0,.2,.018,.46,'#6f6858');B(.57,.785,.24,.16,.008,.18,'#91b1a7');
B(.13,.787,.5,.74,.035,.06,'#806e55');
for(let i=0;i<5;i++){const a=.1+i*.16,cc=i%2?'#ecdbb3':roof;F([[a,.78,.56],[a+.16,.78,.56],[a+.16,.96,.45],[a,.96,.45]],cc);F([[a,.96,.45],[a+.16,.96,.45],[a+.16,.96,.405],[a,.96,.405]],cc);}
B(.13,.8,0,.28,.15,.2,'#9f8056');B(.13,.8,.2,.28,.15,.025,'#d9bd87');DOME(.21,.87,.225,.065,.05,.085,'#cc9446');DOME(.33,.87,.225,.06,.05,.08,'#d4ad54');
},
WHEEL=(a,b)=>{const faces=[];for(let i=0;i<12;i++){let t=i*Math.PI/6,u=(i+1)*Math.PI/6,q=(angle,y)=>[a+.075*Math.cos(angle),y,.115+.115*Math.sin(angle)];faces.push({points:[q(t,b),q(u,b),q(u,b+.06),q(t,b+.06)],color:'#3e5352'});}MESH(faces);for(const yy of[b,b+.06]){let pts=[];for(let i=0;i<12;i++){let t=i*Math.PI/6;pts.push([a+.075*Math.cos(t),yy,.115+.115*Math.sin(t)]);}F(pts,'#405554');}B(a-.018,b+.061,.087,.036,.006,.055,'#a9b4a6');},
WHEELS=()=>{for(const a of[.21,.79])for(const b of[.065,.875])WHEEL(a,b);},
HALL=(wall,roof)=>{B(.04,.06,0,.92,.88,.64,wall);R(.02,.04,.96,.92,.64,.98,roof);WINDOWS(.22,.22);B(.42,.96,0,.16,.025,.38,'#65645a');},
TENT=(color)=>{for(const a of[.08,.88])for(const b of[.1,.88])B(a,b,0,.04,.04,.66,'#927451');for(const b of[.1,.88])B(.08,b,.63,.84,.04,.03,'#b2996c');for(const a of[.08,.88])B(a,.1,.63,.04,.82,.03,'#b2996c');F([[.04,.04,.66],[.96,.04,.66],[.5,.5,1]],shade(color,16));F([[.96,.04,.66],[.96,.96,.66],[.5,.5,1]],shade(color,-12));F([[.96,.96,.66],[.04,.96,.66],[.5,.5,1]],color);F([[.04,.96,.66],[.04,.04,.66],[.5,.5,1]],shade(color,8));},
BOAT=(sail=false,yard=false)=>{
// One pointed bow, a broad transom and a narrower keel give a real boat silhouette.
const V=q=>yard?[.1+q[0]*.8,.13+q[1]*.74,.07+q[2]*.67]:q,
f=(points,color)=>F(points.map(V),color),
l=(points,color,width)=>L(points.map(V),color,width),
b=(a,bb,c,ww,dd,hh,color)=>{let q=V([a,bb,c]);B(...q,ww*(yard?.8:1),dd*(yard?.74:1),hh*(yard?.67:1),color);},
edge=[[.025,.5],[.25,.105],[.94,.18],[.96,.82],[.25,.895]],keel=[[.13,.5],[.31,.28],[.85,.32],[.87,.68],[.31,.72]],inside=edge.map(q=>[.5+(q[0]-.5)*.83,.5+(q[1]-.5)*.79]);
let faces=[];for(let i=0;i<5;i++){let j=(i+1)%5;faces.push({points:[V([...keel[i],.08]),V([...keel[j],.08]),V([...edge[j],.37]),V([...edge[i],.37])],color:['#9a7358','#8b6751','#775c4d','#ad7955','#bf9167'][i]});}MESH(faces);
f(edge.map(q=>[...q,.372]),'#516f73');f(inside.map(q=>[...q,.375]),'#c9b284');
for(let i=0;i<5;i++){let j=(i+1)%5;f([[...edge[i],.41],[...edge[j],.41],[...inside[j],.41],[...inside[i],.41]],'#dfc69a');l([[...edge[i],.37],[...edge[j],.37]],'#ead4a9',1.3);}
// Deck boards and one open foredeck remain readable at normal camera distance.
b(.29,.2,.38,.075,.6,.045,'#ae8d61');b(.85,.23,.38,.055,.53,.045,'#ae8d61');
if(sail){b(.49,.47,.4,.028,.03,.59,'#886f50');l([[.505,.49,.95],[.17,.79,.46]],'#a78c65',1);f([[.475,.51,.94],[.17,.79,.46],[.475,.51,.46]],'#e7d8ac');f([[.535,.46,.91],[.85,.18,.46],[.535,.46,.46]],'#c69e72');l([[.475,.51,.94],[.17,.79,.46],[.475,.51,.46]],'#b99f70',.65);b(.57,.37,.4,.25,.27,.08,'#a88460');}
else{b(.57,.29,.41,.27,.43,.29,'#e0d2ae');b(.59,.725,.49,.21,.012,.135,'#547e88');f([[.57,.3,.49],[.57,.69,.49],[.57,.69,.63],[.57,.3,.63]],'#739ca0');b(.54,.26,.7,.33,.49,.055,'#749493');b(.7,.38,.755,.065,.075,.17,'#a07855');b(.41,.47,.41,.025,.025,.5,'#8b7658');l([[.32,.483,.81],[.52,.483,.81]],'#8b7658',1.2);}
},
BIG=o.signature||o.kind==='landmark'||o.kind==='tower',SMALL=['bin','cone','lamp','bench','tree','car','van'].includes(o.kind),cream='#e4d6b4',ink='#566d6c';
// Small collectibles repeat the scene's story at the opening growth tiers.
if(SMALL){
if(o.kind==='tree'){
if(scene==='lotustea'){for(let i=0;i<4;i++){B(.16+i*.18,.3+(i%2)*.25,0,.045,.045,.95-i*.07,'#79925d');for(let j=1;j<4;j++)L([[.18+i*.18,.32+(i%2)*.25,j*.2],[.08+i*.18,.15+(i%2)*.25,j*.2+.13]],'#547f65',2);}return true;}
B(.46,.46,0,.08,.08,.53,'#947753');let foliage=scene==='fourseasongarden'?['#ce8c54','#a6b77e','#dfb2b0','#668d87'][v%4]:scene==='oldtheatre'?'#789187':scene==='windmillorchard'?'#88a15b':scene==='botanicalglasshouse'?'#579b7f':'#8da982';
TAPER(.5,.5,.38,.24,.24,.13,1.875,shade(foliage,-12));DOME(.5,.5,.51,.45,.45,.47,foliage);if(scene==='windmillorchard'||scene==='fourseasongarden')for(const [a,b]of[[.3,.65],[.6,.7],[.7,.4]]){C(a,b,.64,.065,.065,.07,scene==='windmillorchard'?'#df9b47':'#e3c09d');}if(scene==='botanicalglasshouse'){L([[.5,.5,.75],[.2,.2,.9]],'#bed493',3);L([[.5,.5,.75],[.8,.2,.87]],'#bed493',3);}return true;}
if(o.kind==='lamp'){
if(scene==='lotustea')POST(.48,.48,0,.78,ink);else{B(.37,.37,0,.26,.26,.065,ink);B(.475,.475,.065,.05,.05,.725,ink);}
if(['oldtheatre','festivalfair','bellmarket'].includes(scene)){B(.24,.25,.69,.52,.5,.04,ink);B(.29,.3,.73,.42,.4,.14,'#e8cc8f');for(const a of[.27,.7])for(const b of[.28,.68])B(a,b,.73,.035,.035,.14,ink);R(.2,.21,.6,.58,.87,1,ink);}
else if(scene==='canalbookstreet'){B(.18,.4,.63,.64,.18,.25,'#718876');B(.22,.59,.67,.56,.015,.17,cream);L([[.35,.605,.69],[.35,.605,.8]],'#a09579');R(.15,.35,.7,.3,.88,1,'#657c71');}
else if(scene==='lotustea'){C(.5,.5,.66,.28,.3,.23,'#eddbab');B(.15,.16,.92,.7,.68,.05,'#9c785d');}else if(scene==='fourseasongarden'){C(.5,.5,.69,.26,.28,.21,'#eddbab');B(.19,.17,.9,.62,.66,.06,'#9c785d');}
else if(scene==='observatorycampus'){B(.21,.39,.755,.59,.22,.075,'#8e9cb5');B(.49,.49,.69,.43,.065,.055,'#6c8190');B(.73,.42,.65,.23,.23,.04,'#8299a4');B(.75,.44,.624,.19,.19,.026,'#f4dea7');B(.47,.45,.83,.065,.1,.045,'#687c86');F([[.15,.2,.91],[.85,.2,.91],[.85,.78,.85],[.15,.78,.85]],'#647f9b');for(const a of[.38,.62])L([[a,.2,.912],[a,.78,.852]],'#bdcfc5',.8);}
else if(scene==='lighthousebay'){B(.26,.26,.69,.48,.48,.21,cream);R(.16,.16,.68,.68,.9,1,'#9e6356');}
else{B(.12,.35,.78,.76,.3,.08,scene==='financeplaza'?'#afaa99':'#748e89');B(.14,.38,.73,.72,.24,.05,'#e5dbb0');if(scene==='transithub'){B(.49,.52,.56,.36,.045,.035,ink);B(.56,.57,.45,.29,.04,.19,'#c19753');}}return true;}
if(o.kind==='bin'||o.kind==='cone'){
switch(scene){
case'canalbookstreet':BOOKS(.04);break;
case'bellmarket':CRATE('#ae855a','#dcb165');break;
case'oldtheatre':B(.12,.13,0,.76,.74,.57,'#98756c');B(.09,.1,.57,.82,.8,.08,'#d2b489');B(.22,.883,.17,.56,.016,.23,'#e0cda7');B(.37,.45,.65,.26,.1,.16,'#ba9667');B(.41,.45,.69,.18,.1,.075,'#67594b');break;
case'botanicalglasshouse':TAPER(.5,.5,0,.25,.25,.44,1.35,'#b28668');C(.5,.5,.4,.36,.36,.09,'#c49673');D(.5,.5,.493,.29,.29,'#766e50');for(const [a,b,z]of[[.3,.4,.66],[.68,.37,.69],[.52,.66,.72]]){L([[.5,.5,.49],[a,b,z+.14]],'#5e7955',2);DOME(a,b,z,.18,.17,.21,'#649674');}break;
case'windmillorchard':CRATE('#b0915f','#d08b40');break;
case'lotustea':C(.5,.5,0,.38,.38,.73,'#88a091');C(.5,.5,.73,.28,.28,.09,cream);C(.5,.5,.82,.08,.08,.13,'#647e74');break;
case'fishingharbor':CRATE('#718f94','#d4dfcf',true);break;
case'containerterminal':B(.04,.04,0,.92,.92,.75,'#b58354');for(let i=1;i<4;i++)B(.06,.98,i*.17,.87,.015,.03,'#dfbe85');B(.15,.25,.75,.7,.06,.08,'#6e7770');break;
case'shipyard':C(.5,.5,0,.44,.44,.12,'#b49a70');C(.5,.5,.12,.29,.29,.55,'#798882');for(const zz of[.23,.39,.55])C(.5,.5,zz,.3,.3,.045,'#9ca798');C(.5,.5,.67,.44,.44,.12,'#bca77d');D(.5,.5,.791,.1,.1,'#6d7262');break;
case'financeplaza':B(.12,.12,0,.76,.76,.58,'#a1afad');B(.08,.08,.58,.84,.84,.08,'#c0c5b5');B(.17,.17,.661,.66,.66,.025,'#707f65');DOME(.5,.5,.68,.3,.3,.28,'#78977e');break;
case'transithub':B(.12,.15,0,.76,.7,.9,'#c0965b');B(.21,.87,.52,.58,.025,.26,'#5d8b91');B(.23,.87,.3,.54,.025,.04,cream);break;
case'observatorycampus':B(.12,.12,0,.76,.76,.65,'#a6adba');B(.23,.89,.21,.54,.015,.31,'#637c9a');B(.25,.26,.65,.5,.48,.11,'#d9d2b4');break;
case'festivalfair':B(.2,.2,0,.6,.6,.67,'#c78864');for(let i=0;i<3;i++)B(.24+i*.2,.802,.04,.085,.012,.59,'#eed8ac');B(.18,.18,.67,.64,.64,.045,'#ead5ac');for(const [a,b,z]of[[.31,.32,.71],[.68,.33,.71],[.34,.65,.71],[.66,.65,.71],[.5,.49,.78]])DOME(a,b,z,.16,.16,.17,'#ecddb8');break;
case'fourseasongarden':TAPER(.5,.5,0,.27,.27,.46,1.3,'#b89378');C(.5,.5,.43,.37,.37,.08,'#c7a286');D(.5,.5,.513,.3,.3,'#789066');for(const [a,b]of[[.31,.38],[.56,.65],[.7,.32]]){L([[.5,.5,.5],[a,b,.72]],'#64845d',2);for(const [dx,dy]of[[-.07,0],[.07,0],[0,-.07],[0,.07]])DOME(a+dx,b+dy,.71,.075,.075,.095,['#e0b49e','#ded4a4','#c38e85'][v%3]);DOME(a,b,.75,.045,.045,.05,'#c39d57');}break;
case'lighthousebay':C(.5,.5,0,.4,.4,.075,'#9c977f');TAPER(.5,.5,.075,.36,.36,.63,.7,'#d4b17b');TAPER(.5,.5,.29,.324,.324,.18,.914,'#b46753');C(.5,.5,.705,.27,.27,.075,'#c8b187');let eye=[];for(let i=0;i<=12;i++){const a=i*Math.PI/6;eye.push([.5+.11*Math.cos(a),.5,.87+.095*Math.sin(a)]);}L(eye,'#697970',2.2);break;
case'sculpturepark':B(.06,.06,0,.88,.88,.13,'#bdc2b9');F([[.2,.2,.13],[.8,.2,.13],[.5,.5,.95]],'#c19a66');F([[.8,.2,.13],[.8,.8,.13],[.5,.5,.95]],'#a98056');break;
default:return false;}return true;}
if(o.kind==='bench'){
if(scene==='canalbookstreet'){for(const a of[.12,.8])B(a,.18,0,.07,.64,.29,'#877458');B(.04,.08,.29,.92,.84,.07,'#b49a70');BOOKS(.36);}
else if(scene==='fishingharbor'||scene==='lighthousebay'){BOAT(false);}
else if(scene==='shipyard'){for(const a of[.22,.72])B(a,.12,0,.08,.76,.09,'#8d8066');for(let row=0;row<3;row++)for(let i=0;i<3;i++){const a=.07+(row%2)*.045,b=.16+i*.23,z=.09+row*.17;B(a,b,z,.82,.18,.15,row%2?'#bba37e':'#c7b38d');L([[a+.82,b+.045,z+.07],[a+.82,b+.135,z+.07]],'#9b8563',.7);}}
else if(scene==='lotustea'){B(.08,.12,.3,.84,.76,.09,'#a99063');for(const a of[.15,.78])POST(a,.4,0,.3);C(.5,.5,.4,.16,.18,.25,'#789b8d');for(const a of[.2,.8])C(a,.5,.4,.07,.1,.1,cream);}
else if(scene==='observatorycampus'){B(.1,.13,0,.8,.75,.06,'#b8b9b1');for(const a of[.23,.7])B(a,.45,.06,.065,.065,.515,'#859487');F([[.12,.2,.73],[.88,.2,.73],[.88,.8,.48],[.12,.8,.48]],'#758dae');for(const a of[.33,.57])L([[a,.2,.732],[a,.8,.482]],'#c6d7d2',1);L([[.12,.5,.607],[.88,.5,.607]],'#c6d7d2',1);}
else if(scene==='sculpturepark'){B(.1,.1,0,.8,.8,.1,'#c5c9bd');L([[.2,.7,.13],[.4,.3,.75],[.75,.3,.95],[.8,.7,.26]],'#b18d63',5);}
else{for(const a of[.15,.78]){B(a,.2,0,.075,.6,.4,ink);B(a,.18,.4,.075,.075,.43,ink);}B(.06,.2,.4,.88,.62,.1,scene==='financeplaza'?'#c8c8bd':'#b49771');B(.06,.14,.65,.88,.12,.21,scene==='oldtheatre'?'#ab6f60':'#a68c68');L([[.07,.51,.502],[.93,.51,.502]],'#89795e',.8);}return true;}
if(o.kind==='car'||o.kind==='van'){
if(scene==='fishingharbor'||scene==='lighthousebay'||scene==='shipyard'||scene==='canalbookstreet'){BOAT(scene==='lighthousebay'||scene==='canalbookstreet');return true;}
if(scene==='transithub'){WHEELS();B(.03,.13,.15,.94,.74,.58,'#b97954');B(.05,.11,.73,.9,.78,.07,cream);for(let i=0;i<4;i++)B(.11+i*.19,.878,.42,.14,.012,.23,'#a8c1b7');B(.63,.89,.19,.14,.012,.48,'#876d55');B(.648,.904,.43,.1,.006,.21,'#abc2b8');B(.035,.24,.45,.012,.5,.23,'#9ab6b0');return true;}
if(scene==='containerterminal'){this.container(x,y,w,d,h*.8,['#b67c55','#729b9c','#bea55d'][v%3],0);return true;}
if(scene==='botanicalglasshouse'){WHEELS();B(.08,.17,.2,.84,.66,.09,'#a5916a');for(let i=0;i<3;i++){TAPER(.22+i*.28,.5,.29,.085,.16,.24,1.15,'#b58969');DOME(.22+i*.28,.5,.53,.13,.22,.34,'#699575');}B(.86,.21,.29,.035,.035,.39,'#827b60');B(.86,.7,.29,.035,.035,.39,'#827b60');B(.86,.21,.68,.035,.525,.04,'#827b60');return true;}
WHEELS();B(.04,.13,.15,.92,.74,.23,col);
if(['bellmarket','windmillorchard','festivalfair','oldtheatre'].includes(scene)){
B(.07,.17,.38,.27,.66,.32,shade(col,12));B(.075,.836,.43,.23,.012,.21,'#9dbcb7');B(.063,.25,.44,.012,.49,.2,'#a5c1b5');B(.36,.17,.38,.58,.66,.055,'#9f845f');
if(scene==='oldtheatre'){B(.37,.17,.435,.54,.66,.32,'#a8796b');B(.46,.834,.5,.35,.012,.19,cream);}else{for(const a of[.41,.67]){B(a,.23,.435,.22,.54,.18,'#b59466');DOME(a+.11,.5,.615,.085,.18,.105,'#d4a54f');}}
}else{
// Broad side windows, a sloping hood, and a roof visibly seated on the cabin.
B(.27,.18,.38,.46,.64,.32,shade(col,12));B(.3,.828,.44,.39,.014,.19,'#83a7ab');B(.495,.843,.44,.028,.005,.2,shade(col,-12));B(.26,.23,.47,.012,.54,.2,'#a4c0b9');B(.25,.16,.7,.5,.68,.045,shade(col,20));
}B(.035,.25,.27,.018,.14,.07,'#ecdbab');B(.035,.65,.27,.018,.14,.07,'#ecdbab');return true;}
}
// Kiosks and larger collectibles have authored compositions per scene.
switch(scene){
case'bellmarket':
if(!BIG){if(o.kind==='house'||o.kind==='warehouse')SHOP(col,v%2?'#a46b51':'#ac884e');else STALL(v%2?'#b56f4b':'#b69758');}else{B(.06,.06,0,.88,.88,.28,cream);R(.04,.04,.92,.92,.28,.43,'#9d6b50');B(.37,.31,.25,.27,.35,.49,'#d0b58a');for(const a of[.37,.6])POST(a,.63,.65,.18);B(.36,.3,.8,.3,.37,.04,cream);C(.5,.49,.65,.09,.09,.1,'#bd934c');R(.32,.25,.38,.47,.84,1,'#88735a');this.clock(x+w*.5,y+d*.667,w*.066,h*.55);for(let i=0;i<3;i++)B(.12+i*.3,.92,.06,.16,.025,.16,'#967c59');}break;
case'canalbookstreet':
if(!BIG){B(.1,.1,0,.8,.64,.63,'#cfba95');R(.06,.06,.88,.74,.63,.92,'#718681');B(.17,.742,.15,.66,.016,.34,'#536f64');for(const z of[.16,.33]){B(.15,.76,z,.7,.11,.025,'#ae9165');for(let i=0;i<3;i++){B(.21+i*.21,.765,z+.025,.14,.075,.12,['#a16955','#c4aa70','#7b9c91'][i]);B(.23+i*.21,.843,z+.048,.1,.006,.062,'#e8d9b6');}}B(.12,.755,.52,.76,.19,.045,'#8ba9a1');B(.14,.8,0,.72,.13,.09,'#a58c64');}else{B(.06,.1,0,.88,.8,.5,'#d2c3a5');R(.03,.08,.94,.84,.5,.69,'#70877c');B(.3,.3,.5,.4,.4,.34,'#d8c7a7');R(.26,.27,.48,.46,.84,1,'#678276');for(let i=0;i<5;i++)B(.1+i*.17,.905,.07,.12,.025,.34,'#7f8f82');F([[.3,.69,.73],[.5,.69,.67],[.7,.69,.73],[.7,.69,.87],[.5,.69,.82],[.3,.69,.87]],'#efe4c7');L([[.5,.69,.68],[.5,.69,.81]],'#aa9370',1.5);}break;
case'oldtheatre':
if(BIG){
// A tall recessed auditorium and lower classical portico have separate volumes.
B(.14,.08,.055,.72,.61,.66,'#aa8274');R(.11,.055,.78,.665,.715,.97,'#806969');B(.08,.69,.05,.84,.105,.62,'#c3a184');
B(.05,.06,0,.9,.86,.055,'#c5b28d');B(.14,.86,0,.72,.095,.025,'#d4c19a');B(.2,.81,.055,.6,.035,.37,'#765854');
for(const a of[.22,.405,.59]){B(a,.849,.06,.145,.02,.31,'#8d5d55');L([[a+.07,.872,.06],[a+.07,.872,.32]],'#b78268',.7);}
for(const a of[.115,.32,.62,.825]){B(a-.025,.835,.055,.085,.11,.045,'#d9c7a3');B(a,.855,.1,.035,.07,.43,'#e0d0ad');B(a-.025,.835,.53,.085,.11,.045,'#e1cda7');}
B(.08,.8,.575,.84,.16,.055,'#c9ae82');F([[.065,.97,.63],[.935,.97,.63],[.5,.97,.83]],'#d7c29a');F([[.15,.972,.655],[.85,.972,.655],[.5,.972,.78]],'#a67b64');
// Two theatrical masks are set into the pediment, rather than a generic sign.
F([[.38,.975,.697],[.47,.975,.68],[.495,.975,.725],[.405,.975,.744]],'#eee0bb');F([[.51,.975,.725],[.595,.975,.743],[.62,.975,.697],[.535,.975,.68]],'#cfab78');
}else{B(.1,.1,0,.8,.68,.55,'#b48c79');R(.06,.06,.88,.75,.55,.94,'#876b67');B(.16,.795,.05,.68,.02,.37,'#805b55');for(const a of[.12,.82])B(a,.84,.02,.05,.065,.47,'#d7c19a');B(.075,.78,.49,.85,.17,.06,'#cca777');B(.09,.84,0,.82,.1,.05,'#c7b18c');}break;
case'botanicalglasshouse':
if(BIG){
// Two low greenhouse wings make a stepped footprint around the glazed rotunda.
this.glasshouse(x+w*.035,y+d*.22,w*.3,d*.64,h*.59);this.glasshouse(x+w*.665,y+d*.22,w*.3,d*.64,h*.59);
C(.5,.49,0,.275,.31,.055,'#c5c9aa');C(.5,.49,.055,.25,.285,.44,'#9fbeab');
C(.5,.49,.49,.266,.301,.025,'#dce0bf');DOME(.5,.49,.515,.265,.3,.41,'#b2d0b7');
for(let i=0;i<16;i++){let a=i*Math.PI/8,pts=[];for(let j=0;j<=6;j++){let t=j*Math.PI/12;pts.push([.5+.266*Math.cos(t)*Math.cos(a),.49+.301*Math.cos(t)*Math.sin(a),.515+.411*Math.sin(t)]);}L(pts,'#e2e5c7',1);if(Math.cos(a)+Math.sin(a)>0)L([[.5+.252*Math.cos(a),.49+.287*Math.sin(a),.06],[.5+.252*Math.cos(a),.49+.287*Math.sin(a),.495]],'#e1e4c6',1.3);}
C(.5,.49,.925,.065,.074,.035,'#c7d3b6');DOME(.5,.49,.96,.063,.071,.038,'#e1dfbc');
B(.42,.765,.055,.16,.025,.245,'#668e7a');B(.492,.791,.055,.016,.012,.245,'#d8d7b5');B(.35,.8,0,.3,.12,.055,'#cac6a6');
}else{this.glasshouse(x+w*.03,y+d*.03,w*.94,d*.94,h*.92);if(o.kind==='kiosk'){for(const a of[.15,.5,.82])C(a,.78,.06,.06,.09,.16,'#bc9575');}}break;
case'windmillorchard':
if(BIG){
TAPER(.5,.44,.03,.28,.29,.69,.65,'#d8c49b');C(.5,.44,.035,.31,.32,.065,'#c0ab80');HIP(.27,.2,.46,.48,.72,.98,'#967050');
B(.43,.706,.06,.14,.018,.19,'#74694f');B(.455,.66,.47,.09,.02,.09,'#627c75');
// Four lattice sails sit in front of the tapered mill, with an unmistakable cross.
for(let i=0;i<4;i++){let a=Math.PI*.25+i*Math.PI/2,dx=Math.cos(a),dz=Math.sin(a),q=(r,t)=>[.5+dx*r-dz*t,.79,.57+dz*r*.85+dx*t*.85];F([q(.08,0),q(.45,0),q(.45,.125),q(.18,.125)],'#ebe1bf');L([q(.045,-.012),q(.47,-.012)],'#907a54',2);for(const r of[.2,.28,.36,.44])L([q(r,0),q(r,.12)],'#a48e63',.8);L([q(.18,.06),q(.45,.06)],'#b39a6c',.7);}B(.458,.77,.53,.084,.045,.085,'#92734e');
}else{SHOP('#cbb587','#9f8056');B(.58,.81,0,.28,.14,.15,'#b38c56');for(const a of[.65,.78])DOME(a,.88,.15,.055,.05,.075,'#dda64c');}break;
case'lotustea':
// Raised stone steps, an empty pavilion interior and exposed timber frame.
B(.08,.08,0,.84,.84,.06,'#b5aa8b');B(.14,.14,.06,.72,.72,.055,'#d2c29c');B(.35,.86,0,.3,.11,.035,'#c5b48d');
for(const a of[.2,.755])for(const b of[.2,.755]){B(a-.015,b-.015,.115,.08,.08,.04,'#d1bd90');B(a,b,.155,.045,.045,.395,'#97704e');B(a-.023,b-.023,.49,.09,.09,.07,'#b18a5e');}
for(const b of[.2,.76])B(.19,b,.54,.62,.04,.04,'#a27b53');for(const a of[.2,.76])B(a,.2,.54,.04,.6,.04,'#a27b53');
// Rear benches frame the space; the two front bays remain completely open.
B(.24,.23,.21,.5,.065,.045,'#b59766');B(.24,.23,.115,.04,.06,.1,'#92724f');B(.65,.23,.115,.04,.06,.1,'#92724f');
HIP(.035,.035,.93,.93,.575,BIG?.77:.93,'#638570');
if(BIG){for(const a of[.37,.595])for(const b of[.37,.595])B(a,b,.75,.035,.035,.07,'#bda374');HIP(.24,.24,.52,.52,.82,.98,'#769783');}break;
case'fishingharbor':
if(BIG){B(.08,.1,0,.84,.8,.54,'#cebd94');R(.04,.06,.92,.89,.54,.72,'#789b9a');B(.4,.34,.65,.2,.25,.21,cream);R(.36,.3,.28,.33,.86,1,'#5f8387');for(let i=0;i<4;i++)B(.15+i*.2,.91,0,.11,.025,.36,'#769091');F([[.31,.956,.61],[.58,.956,.66],[.72,.956,.59],[.59,.956,.54]],'#e6d3a0');F([[.29,.956,.61],[.19,.956,.67],[.19,.956,.55]],'#e6d3a0');}else if(o.kind==='warehouse'){BOAT(true);}else{STALL('#6d979d',true);}break;
case'containerterminal':
if(BIG){
// Four-legged truss gantry with open bays, visible hoist and suspended container.
for(const a of[.11,.815])B(a-.025,.1,0,.12,.8,.055,'#607b79');
for(const yy of[.17,.74]){
 for(const a of[.13,.83])B(a,yy,.055,.055,.07,.775,'#c59c58');
 B(.1,yy,.81,.8,.07,.045,'#c59b52');B(.1,yy,.955,.8,.07,.04,'#dfb56a');
 for(let i=0;i<6;i++){let xx=.12+i*.125;L([[xx,yy+.07,.85],[xx+.06,yy+.07,.95],[xx+.125,yy+.07,.85]],'#e1be79',1.8);}
}
for(const a of[.13,.83]){B(a,.17,.83,.055,.64,.055,'#cfa45e');L([[a,.2,.26],[a,.75,.8]],'#cfb272',1.7);}
B(.66,.7,.72,.17,.16,.15,'#759793');B(.69,.862,.77,.1,.012,.07,'#bbd4c6');
L([[.45,.58,.83],[.45,.58,.45]],'#526b68',1.2);L([[.57,.58,.83],[.57,.58,.45]],'#526b68',1.2);B(.38,.52,.425,.26,.11,.04,'#c6a060');
this.container(x+w*.28,y+d*.39,w*.44,d*.4,h*.22,'#b8865e',h*.19);
L([[.39,.57,.425],[.3,.58,.41]],'#627b70',1);L([[.62,.57,.425],[.7,.58,.41]],'#627b70',1);
}else{this.container(x,y,w,d*.46,h*.37,['#b97f59','#759b9d','#bca16a'][v%3],0);this.container(x+w*.04,y+d*.52,w*.92,d*.46,h*.37,'#bd9d61',0);this.container(x+w*.12,y+d*.2,w*.76,d*.48,h*.35,'#73989b',h*.37);}break;
case'shipyard':
if(BIG){
B(.04,.05,0,.92,.9,.04,'#b4b3a0');
// Four slender gantry legs, rather than opaque side walls; boat stays in the bay.
for(const a of[.09,.85]){B(a-.025,.11,.04,.105,.75,.045,'#738c89');for(const b of[.16,.75])B(a,b,.085,.055,.065,.72,'#9dafa6');B(a,.14,.805,.055,.69,.055,'#b9b18a');}
B(.08,.42,.82,.83,.1,.07,'#d3b47a');B(.7,.4,.78,.13,.15,.13,'#86a3a0');B(.73,.55,.81,.07,.01,.07,'#c7dcce');
for(const a of[.115,.875])L([[a,.2,.25],[a,.72,.77]],'#c9bd96',1.7);
for(const a of[.29,.69])B(a,.24,.04,.05,.5,.08,'#9b8564');BOAT(false,true);L([[.49,.47,.82],[.49,.47,.62]],'#526d6c',1.4);L([[.43,.48,.6],[.43,.48,.57],[.55,.48,.57],[.55,.48,.6]],'#556e6a',1.6);
}else{if(o.kind==='house'||o.kind==='warehouse'){for(const a of[.32,.76])B(a,.26,0,.045,.48,.1,'#9f8963');}BOAT(o.kind==='tower');}break;
case'financeplaza':
if(BIG){this.glassTower(x+w*.06,y+d*.08,w*.38,d*.7,h*.9,'#8ca7af',0);this.glassTower(x+w*.57,y+d*.23,w*.36,d*.67,h*.77,'#9badb4',0);B(.36,.35,.6,.31,.25,.07,'#c7c9bd');B(.12,.1,.9,.26,.52,.1,'#b4c2c0');B(.62,.28,.77,.26,.47,.1,'#c9cfbf');}else{B(.06,.07,0,.88,.86,.07,'#c8c8b7');B(.1,.12,.07,.8,.7,.66,'#9badb2');B(.08,.1,.73,.84,.74,.055,'#d3d2be');B(.18,.823,.2,.62,.014,.4,'#658995');B(.47,.84,.2,.035,.009,.4,'#bfc8b9');B(.15,.842,.39,.69,.01,.035,'#bfc8b9');B(.47,.86,.07,.15,.018,.26,'#496c75');B(.1,.83,.63,.8,.11,.035,cream);}break;
case'transithub':
// A masonry passenger terminal is the primary silhouette. The low platform
// canopy attaches to its side; it is deliberately secondary to the main hall.
B(.035,.055,0,.93,.89,.06,'#b8bead');
B(.075,.15,.06,.74,.57,.46,'#c3a77b');R(.055,.125,.78,.62,.52,.735,'#728d84');
B(.07,.715,.075,.75,.025,.065,'#aa8b63');B(.06,.72,.49,.77,.035,.035,cream);
for(const a of[.13,.265,.585,.72]){B(a,.722,.235,.075,.014,.17,'#608589');B(a-.01,.735,.215,.095,.018,.025,cream);L([[a+.0375,.738,.24],[a+.0375,.738,.405]],'#d3cbaa',.9);}
// Recessed double entrance and a continuous raised clock-tower facade.
B(.375,.545,.06,.21,.255,BIG?.77:.62,'#d1ba8c');
B(.405,.801,.06,.15,.014,.285,'#476b70');B(.474,.816,.065,.012,.008,.27,cream);
B(.39,.816,.35,.18,.015,.045,cream);B(.395,.817,.355,.17,.008,.022,'#748f89');
B(.34,.83,0,.28,.1,.032,'#d6c49e');B(.365,.815,.032,.23,.075,.028,'#c6b28c');
if(BIG){B(.365,.54,.79,.23,.27,.04,cream);this.clock(x+w*.48,y+d*.803,w*.055,h*.70);R(.35,.525,.26,.3,.83,.98,'#6c8579');}
else{this.clock(x+w*.48,y+d*.803,w*.05,h*.555);R(.35,.525,.26,.3,.68,.91,'#6c8579');}
// Glazed side platform canopy, joined to the hall rather than replacing it.
B(.82,.16,.06,.13,.68,.035,'#d2c099');
for(const b of[.21,.72]){const a=.921,A=.946,roof=x=>.455-(x-.813)*.06/.147-.001;
 F([[a,b+.035,.095],[A,b+.035,.095],[A,b+.035,roof(A)],[a,b+.035,roof(a)]],shade('#9b8a67',-16));
 F([[A,b,.095],[A,b+.035,.095],[A,b+.035,roof(A)],[A,b,roof(A)]],shade('#9b8a67',-33));
 F([[a,b,roof(a)],[A,b,roof(A)],[A,b+.035,roof(A)],[a,b+.035,roof(a)]],shade('#9b8a67',19));}

F([[.813,.15,.455],[.96,.15,.395],[.96,.835,.395],[.813,.835,.455]],'#92aea3');
F([[.96,.15,.395],[.96,.835,.395],[.96,.835,.37],[.96,.15,.37]],'#698a82');
for(const b of[.17,.39,.61,.815])L([[.815,b,.457],[.959,b,.397]],'#e0dec3',1);
break;
case'observatorycampus':
if(BIG){
// Real-building miniature, informed by Griffith Observatory's massing:
// low cream wings, circular end drums, a larger complete rear dome, and steps.
// The central planetarium dome is closed; no invented telescope slit/cutaway.
B(.025,.075,0,.95,.84,.045,'#b9b8a2');B(.06,.32,.045,.88,.48,.26,'#d4d2b9');
B(.06,.32,.305,.88,.48,.025,'#e5dfc5');B(.09,.35,.33,.82,.4,.018,'#acb8b1');
C(.5,.38,.045,.26,.30,.355,'#d8d4bc');C(.5,.38,.38,.27,.31,.035,'#e3ddc2');
C(.5,.38,.415,.25,.289,.045,'#8e9890');DOME(.5,.38,.46,.25,.289,.245,'#8b998d');
// Symmetric closed observing domes sit over the ends of the low gallery.
for(const cx of[.18,.82]){
 C(cx,.585,.045,.135,.16,.31,'#d7d5bf');C(cx,.585,.335,.142,.168,.025,'#e4ddc2');
 C(cx,.585,.36,.13,.154,.035,'#83928b');DOME(cx,.585,.395,.13,.154,.127,'#91a095');
 // Fine paired shutter seams on a closed shell, never an open dark wedge.
 for(const a of[.65,.84]){const pts=[];for(let j=0;j<=6;j++){let t=j*Math.PI/12;pts.push([cx+.131*Math.cos(t)*Math.cos(a),.585+.155*Math.cos(t)*Math.sin(a),.395+.128*Math.sin(t)]);}L(pts,'#aeb8a7',.55);}
}
// Door, horizontal parapet, tall gallery windows and a small entrance pavilion.
B(.395,.67,.045,.21,.155,.33,'#ded9be');B(.38,.655,.375,.24,.18,.025,'#e8dfc0');
R(.385,.66,.23,.17,.4,.435,'#81968a');B(.435,.827,.075,.13,.012,.245,'#4e7073');
B(.49,.841,.075,.018,.005,.245,'#babda9');
for(const a of[.285,.345,.625,.685]){B(a,.802,.105,.033,.012,.145,'#68888a');B(a-.007,.813,.092,.047,.012,.014,'#e4dcc0');}
B(.345,.825,0,.31,.12,.02,'#c6bda1');B(.375,.817,.02,.25,.105,.018,'#d3c8a9');B(.405,.81,.038,.19,.08,.018,'#dfd3b4');
}else{
// Low research/support buildings keep the same restrained campus palette.
B(.07,.08,0,.86,.84,.065,'#bcc2b5');B(.11,.13,.065,.78,.66,.39,'#cdd0bf');B(.09,.11,.455,.82,.7,.04,'#e0dac0');
for(const a of[.18,.37,.68])B(a,.792,.21,.12,.018,.15,'#668695');B(.52,.792,.065,.115,.018,.27,'#506e7d');B(.46,.82,0,.25,.1,.035,'#c6c9b8');
B(.19,.25,.495,.27,.29,.035,'#adb8ad');F([[.2,.28,.53],[.45,.28,.62],[.45,.53,.62],[.2,.53,.53]],'#748da5');
}break;
case'festivalfair':
if(BIG){
C(.5,.5,0,.46,.46,.07,'#b99e79');C(.5,.5,.07,.425,.425,.035,'#dfc49b');C(.5,.5,.105,.05,.05,.57,'#b18a59');
// Horses have a body, rising neck, muzzle and paired legs, rather than box seats.
for(let i=0;i<4;i++){let a=i*Math.PI/2+.5,cx=.5+.27*Math.cos(a),cy=.5+.27*Math.sin(a);B(cx-.012,cy-.012,.1,.024,.024,.51,'#bea370');F([[cx-.1,cy,.25],[cx-.085,cy,.35],[cx+.035,cy,.35],[cx+.06,cy,.46],[cx+.1,cy,.45],[cx+.13,cy,.4],[cx+.08,cy,.38],[cx+.065,cy,.26]],'#e3cc9f');L([[cx-.07,cy,.27],[cx-.085,cy,.15]],'#c6a77a',2);L([[cx+.04,cy,.27],[cx+.065,cy,.15]],'#c6a77a',2);L([[cx-.1,cy,.33],[cx-.135,cy,.25]],'#aa805e',2);}
for(let i=0;i<12;i++){let a=i*Math.PI/6,b=(i+1)*Math.PI/6;F([[.5+.47*Math.cos(a),.5+.47*Math.sin(a),.65],[.5+.47*Math.cos(b),.5+.47*Math.sin(b),.65],[.5,.5,.95]],i%2?'#dfc38b':'#b87764');F([[.5+.47*Math.cos(a),.5+.47*Math.sin(a),.65],[.5+.47*Math.cos(b),.5+.47*Math.sin(b),.65],[.5+.47*Math.cos(b),.5+.47*Math.sin(b),.59],[.5+.47*Math.cos(a),.5+.47*Math.sin(a),.59]],i%2?'#d4b379':'#a96f5a');}C(.5,.5,.95,.023,.023,.045,'#d2b370');
}else{TENT(v%2?'#b78373':'#c3a16b');B(.16,.7,0,.68,.22,.28,'#b08a64');B(.13,.67,.28,.74,.27,.04,'#d8b887');for(const a of[.3,.65]){B(a-.012,.83,.32,.024,.025,.18,'#dfceb0');let candy=[];for(let i=0;i<16;i++){const t=i*Math.PI/8;candy.push([a+.075*Math.cos(t),.862,.49+.11*Math.sin(t)]);}F(candy,a===.3?'#d09a76':'#d3b86d');L([[a-.037,.863,.49],[a+.035,.863,.49]],'#eee0bb',1.1);}}break;
case'fourseasongarden':
if(BIG){B(.04,.04,0,.92,.92,.08,'#c0b392');C(.5,.5,.08,.38,.38,.08,'#96b3a5');for(let i=0;i<4;i++){let a=i*Math.PI/2+.7,cx=.5+Math.cos(a)*.28,cy=.5+Math.sin(a)*.28;B(cx-.025,cy-.025,.16,.05,.05,.4,'#948564');DOME(cx,cy,.5,.18,.18,.26,['#d2a684','#91a37c','#cabc8f','#809791'][i]);}C(.5,.5,.16,.08,.08,.63,'#d7cfaa');DOME(.5,.5,.79,.13,.13,.16,'#d9c395');}else{B(.06,.06,0,.88,.88,.1,'#c2b697');for(const a of[.12,.83])for(const b of[.13,.82])POST(a,b,.1,.5);for(const b of[.13,.82])B(.09,b,.6,.8,.055,.04,'#9b8c69');for(let i=0;i<6;i++)B(.06+i*.17,.05,.64,.035,.91,.035,'#b5aa82');// Grounded climbing vines spread into a low connected mat along the beams.
// Overlap broad, very flat foliage lobes; leave the front-right slats visible.
const leaf=['#89915f','#769365','#9a9666','#748b77'][v%4];
for(const [a,b]of[[.12,.81],[.82,.14]]){
 B(a-.055,b-.055,.1,.145,.145,.16,'#ab9270');B(a-.065,b-.065,.24,.165,.165,.04,'#b8a17f');B(a-.04,b-.04,.281,.115,.115,.008,'#637550');
 L([[a+.015,b+.026,.285],[a-.016,b+.04,.4],[a+.036,b+.022,.53],[a+.015,b+.038,.68]],'#60794f',2.5);
 for(const zz of[.35,.47,.58]){F([[a+.01,b+.043,zz],[a-.072,b+.065,zz+.026],[a-.041,b+.07,zz+.078],[a+.013,b+.047,zz+.037]],leaf);F([[a+.02,b+.05,zz+.03],[a+.093,b+.076,zz+.055],[a+.073,b+.069,zz+.097],[a+.02,b+.05,zz+.065]],shade(leaf,9));}
}
for(const [a,b,rx,ry,z,hh,tint]of[[.24,.23,.19,.19,.665,.052,-4],[.45,.22,.2,.18,.672,.044,4],[.67,.23,.2,.18,.668,.054,0],[.81,.34,.13,.2,.669,.045,-6],[.24,.43,.18,.2,.668,.048,5],[.25,.63,.18,.19,.664,.052,-3],[.34,.79,.24,.13,.668,.045,2]])DOME(a,b,z,rx,ry,hh,shade(leaf,tint));
L([[.135,.85,.66],[.24,.77,.683],[.37,.7,.69]],'#677c4d',1.3);L([[.835,.17,.67],[.7,.22,.69],[.58,.26,.697]],'#677c4d',1.3);}break;
case'lighthousebay':
if(BIG){
C(.5,.5,0,.37,.37,.055,'#b7ae91');TAPER(.5,.5,.055,.255,.255,.645,.7,'#e0d5b6');
// Bands follow the same wall taper with a small outward skin offset.
for(const [base,height] of[[.255,.08],[.49,.075]]){const radius=z=>.255*(1-.3*(z-.055)/.645)+.0015,r=radius(base);TAPER(.5,.5,base,r,r,height,radius(base+height)/r,'#b46e56');}// Entrance is a surface patch on the tapered front wall, not a flat box
// intersecting the cylinder (which clipped the old door into diagonal shards).
for(const [a,b] of[[.455,.5],[.5,.54]]){const entry=(xx,z)=>[xx,.5+.255*(1-.3*(z-.055)/.645)-Math.abs(xx-.5)*Math.tan(Math.PI/16)+.0015,z];F([entry(a,.055),entry(b,.055),entry(b,.215),entry(a,.215)],'#697f7b');}
C(.5,.5,.7,.265,.265,.035,'#a7a589');C(.5,.5,.735,.158,.158,.145,'#9bbab3');C(.5,.5,.755,.08,.08,.095,'#f1d79a');
for(let i=0;i<8;i++){let a=i*Math.PI/4;B(.488+Math.cos(a)*.158,.488+Math.sin(a)*.158,.735,.024,.024,.145,'#657c75');}
// The visible gallery rail leaves air beneath the lantern roof.
let rail=[];for(let i=0;i<=16;i++){let a=i*Math.PI/8;rail.push([.5+.247*Math.cos(a),.5+.247*Math.sin(a),.79]);if(i<16&&i%2===0)L([[.5+.247*Math.cos(a),.5+.247*Math.sin(a),.735],[.5+.247*Math.cos(a),.5+.247*Math.sin(a),.79]],'#697e73',.8);}L(rail,'#7f8c76',.9);
TAPER(.5,.5,.88,.22,.22,.11,.06,'#9e7159');
}else{HALL('#dfcba7','#a77960');B(.43,.91,.12,.17,.07,.27,'#6e9395');for(let i=0;i<3;i++){const a=.14+i*.3,base=.64+.34*(1-Math.max(Math.abs((a-.5)/.48),Math.abs((a+.09-.5)/.48)));B(a,.2,base,.09,.1,.06,'#dfbc79');}}break;
case'sculpturepark':
B(.06,.06,0,.88,.88,.08,'#c3c4b6');if(BIG){
// Solid extruded arch, with a true open centre and shaded inner reveal.
let faces=[];for(let i=0;i<18;i++){let a=Math.PI*i/18,b=Math.PI*(i+1)/18,O=t=>[.5+.4*Math.cos(t),.08+.88*Math.sin(t)],I=t=>[.5+.255*Math.cos(t),.08+.69*Math.sin(t)],oa=O(a),ob=O(b),ia=I(a),ib=I(b);faces.push({points:[[oa[0],.38,oa[1]],[ob[0],.38,ob[1]],[ib[0],.38,ib[1]],[ia[0],.38,ia[1]]],color:'#bb9369'},{points:[[oa[0],.6,oa[1]],[ob[0],.6,ob[1]],[ib[0],.6,ib[1]],[ia[0],.6,ia[1]]],color:'#c29b6f'},{points:[[oa[0],.38,oa[1]],[ob[0],.38,ob[1]],[ob[0],.6,ob[1]],[oa[0],.6,oa[1]]],color:shade('#d0af7f',Math.round(-Math.cos(a)*16))},{points:[[ia[0],.38,ia[1]],[ib[0],.38,ib[1]],[ib[0],.6,ib[1]],[ia[0],.6,ia[1]]],color:'#987e5e'});}MESH(faces);
}else if(v%2){B(.27,.25,.08,.46,.46,.34,'#b0b8ae');B(.13,.32,.42,.74,.32,.19,'#d1b486');B(.4,.2,.61,.2,.58,.29,'#a1b5b0');}else{MESH([{points:[[.12,.2,.08],[.85,.3,.08],[.53,.55,.98]],color:'#aa8970'},{points:[[.85,.3,.08],[.6,.88,.08],[.53,.55,.98]],color:'#b39368'},{points:[[.6,.88,.08],[.12,.2,.08],[.53,.55,.98]],color:'#d1b582'}]);}break;
default:return false;
}return true;
}

architecture(o,x,y,w,d,h,col,district,variant){this[district==='oldtown'?'oldtown':district==='harbor'?'harbor':district==='garden'?'garden':'skyline'](o,x,y,w,d,h,col,variant);}
terrain(l,t){
const c=this.ctx,th=l.theme||{},w=l.bounds.w,h=l.bounds.h,district=l.districtId||'oldtown';
const skies={oldtown:'#b6c5b6',harbor:'#9bb7b9',garden:'#a7c0a1',skyline:'#b2bbc9'};
const sceneSkies={bellmarket:'#c9c8ad',canalbookstreet:'#aabfbb',oldtheatre:'#bcada8',botanicalglasshouse:'#afc7b2',windmillorchard:'#cbd0a3',lotustea:'#a7c2b8',fishingharbor:'#a9c4c3',containerterminal:'#b9c5bf',shipyard:'#a7bdc0',financeplaza:'#b8c5c6',transithub:'#c6c5b2',observatorycampus:'#adb8cd',festivalfair:'#ccc6ad',fourseasongarden:'#bdc7ab',lighthousebay:'#b4cacc',sculpturepark:'#c3c8ba'};
c.fillStyle=sceneSkies[l.sceneId]||skies[district];c.fillRect(0,0,this.w,this.h);
this.quad(-22,-22,w+44,h+44,-14,shade(th.ground,-38));this.quad(0,0,w,h,0,th.ground);
// Ground cues are flat inlays, never uncollectible three-dimensional props.
if(!l.sceneId&&l.design?.plan){const rows=l.design.plan.map(row=>row.trim().split(/\s+/)),cols=Math.max(...rows.map(row=>row.length)),gap=(w-330)/Math.max(1,cols-1);
rows.forEach((row,iy)=>row.forEach((token,ix)=>{if(['W','P','.'].includes(token))return;const cx=165+ix*gap,cy=165+iy*gap,size=gap-91,x=cx-size/2,y=cy-size/2;
this.quad(x,y,size,size,.1,shade(th.ground,5));
if(district==='oldtown'){
this.quad(x+3,y+3,size-6,size-6,.15,'#c5baa638');
for(let i=0;i<5;i++){this.quad(x+5+i*(size-10)/5,y+5,1,size-10,.2,'#ece0c547');this.quad(x+5,y+5+i*(size-10)/5,size-10,1,.2,'#ece0c547');}
}else if(district==='harbor'){
this.quad(x+8,y+size-27,size-16,2,.2,'#e3bd6a75');this.quad(x+8,y+size-10,size-16,2,.2,'#e3bd6a75');
for(let i=0;i<6;i++)this.poly([this.project(x+10+i*22,y+size-25,.21),this.project(x+17+i*22,y+size-25,.21),this.project(x+29+i*22,y+size-12,.21),this.project(x+22+i*22,y+size-12,.21)],'#697b7550');
}else if(district==='garden'){
this.quad(x+3,y+3,size-6,size-6,.2,'#a5ba8a45');
this.poly([this.project(x,y+size*.76,.3),this.project(x+size*.48,y+size*.59,.3),this.project(x+size,y+size*.77,.3),this.project(x+size,y+size*.87,.3),this.project(x+size*.48,y+size*.7,.3),this.project(x,y+size*.85,.3)],'#e8dfc88c');
}else{
for(let i=1;i<4;i++){this.quad(x+i*size/4,y,1,size,.2,'#9fa9b346');this.quad(x,y+i*size/4,size,1,.2,'#9fa9b346');}
this.quad(x+size*.07,y+size*.86,size*.86,3,.21,'#e7e6dc90');
}
}));}
for(const p of l.parks||[]){this.quad(p.x-3,p.y-3,p.w+6,p.h+6,1,shade(th.grass,18));this.quad(p.x,p.y,p.w,p.h,1.2,th.grass);
if(district==='garden'){
this.poly([this.project(p.x,p.y+p.h*.4,1.3),this.project(p.x+p.w*.5,p.y+p.h*.55,1.3),this.project(p.x+p.w,p.y+p.h*.37,1.3),this.project(p.x+p.w,p.y+p.h*.46,1.3),this.project(p.x+p.w*.5,p.y+p.h*.64,1.3),this.project(p.x,p.y+p.h*.49,1.3)],'#d9d3b6');
this.quad(p.x+p.w*.46,p.y,p.w*.09,p.h,1.35,'#d9d3b6');
for(let j=0;j<4;j++)this.quad(p.x+14+j*48,p.y+14,29,19,1.4,j%2?'#8d9e7855':'#c2bf8860');
}else if(district==='skyline'){
this.quad(p.x+p.w*.44,p.y,p.w*.12,p.h,1.3,'#c5c8c2');this.quad(p.x,p.y+p.h*.44,p.w,p.h*.12,1.3,'#c5c8c2');
}else{for(let i=12;i<p.w;i+=46)this.quad(p.x+i,p.y+8,2,Math.max(1,p.h-16),1.5,'#ffffff13');}}
for(const p of l.water||[]){
if(p.points){this.poly(p.points.map(q=>this.project(q[0],q[1],1)),th.water);continue;}
this.quad(p.x-3,p.y-3,p.w+6,p.h+6,.9,district==='harbor'?'#809394':'#b3c3a5');this.quad(p.x,p.y,p.w,p.h,1,th.water);
for(let i=16;i<p.w;i+=39){const pp=this.project(p.x+i,p.y+(Math.sin(t*.5+i)*.2+.5)*p.h,1.5);c.fillStyle='#ddf0dc50';c.fillRect(pp.x,pp.y,12*this.cam.zoom,1);}
if(district==='harbor')for(let i=14;i<p.w;i+=25){this.quad(p.x+i,p.y+2,2,12,1.6,'#b9b89b');this.quad(p.x+i,p.y+p.h-14,2,12,1.6,'#b9b89b');}}
// Scenic paving is a ground inlay: streets and their markings remain continuous.
this.sceneGround(l);
for(const r of l.roads||[]){
const horizontal=r.w>r.h;this.quad(r.x-5,r.y-5,r.w+10,r.h+10,.4,district==='harbor'?'#acb6ab':'#f0ecdd');this.quad(r.x,r.y,r.w,r.h,.6,district==='garden'?'#c6c7b0':th.road);
if(district==='oldtown'){
// Bounded cobble bands: broad enough to read at play zoom, quiet at overview.
const length=horizontal?r.w:r.h;for(let j=12;j<length;j+=28){if(horizontal){this.quad(r.x+j,r.y,.8,r.h,.8,'#dde0cd45');this.quad(r.x+j+14,r.y+r.h*.5,.8,r.h*.5,.8,'#dde0cd45');}else{this.quad(r.x,r.y+j,r.w,.8,.8,'#dde0cd45');this.quad(r.x+r.w*.5,r.y+j+14,r.w*.5,.8,.8,'#dde0cd45');}}
if(horizontal)this.quad(r.x,r.y+r.h*.5,r.w,.8,.8,'#dde0cd45');else this.quad(r.x+r.w*.5,r.y,.8,r.h,.8,'#dde0cd45');
}else if(district==='garden'){
if(horizontal){this.quad(r.x,r.y+5,r.w,1,.8,'#e8e3ce88');this.quad(r.x,r.y+r.h-6,r.w,1,.8,'#e8e3ce88');}else{this.quad(r.x+5,r.y,1,r.h,.8,'#e8e3ce88');this.quad(r.x+r.w-6,r.y,1,r.h,.8,'#e8e3ce88');}
}else{
if(horizontal){for(let xx=r.x+14;xx<r.x+r.w-10;xx+=34)this.quad(xx,r.y+r.h/2,15,district==='harbor'?2.4:1.6,1,district==='harbor'?'#dfce89':'#e3e7e6');}else{for(let yy=r.y+14;yy<r.y+r.h-10;yy+=34)this.quad(r.x+r.w/2,yy,district==='harbor'?2.4:1.6,15,1,district==='harbor'?'#dfce89':'#e3e7e6');}
}}
}
sceneGround(l){
const colors={plaza:'#d9c9a8',path:'#e5d9bb',rail:'#929e95',dock:'#b9a78b',pond:'#84b9b7',orchard:'#bac393',glassbed:'#9fbca0',stage:'#bfaa93',court:'#c5c5bc',gardenbed:'#a9bb93',lily:'#89b7a2',orbit:'#bac4ba'};
for(const p of l.sceneTerrain||[]){const x=p.x,y=p.y,w=p.w,d=p.h,z=.2,cc=p.color||colors[p.type]||'#c5c5af';
// Clip every treatment to its authored footprint, including rectangular beds.
this.ctx.save();const pp=(p.points||[[x,y],[x+w,y],[x+w,y+d],[x,y+d]]).map(q=>this.project(q[0],q[1],z));this.poly(pp,cc);this.ctx.beginPath();pp.forEach((q,i)=>i?this.ctx.lineTo(q.x,q.y):this.ctx.moveTo(q.x,q.y));this.ctx.closePath();this.ctx.clip();
const line=(a,b,color,width=1)=>this.line([this.project(...a,z+.01),this.project(...b,z+.01)],color,width);
if(p.type==='rail'){const horizontal=w>d;for(const f of[.3,.7]){if(horizontal)line([x,y+d*f],[x+w,y+d*f],'#617b7a',1.3);else line([x+w*f,y],[x+w*f,y+d],'#617b7a',1.3);}const n=Math.min(34,Math.floor(Math.max(w,d)/20));for(let i=0;i<n;i++)if(horizontal)line([x+(i+.5)*w/n,y+d*.19],[x+(i+.5)*w/n,y+d*.81],'#bfc0a5',1.5);else line([x+w*.19,y+(i+.5)*d/n],[x+w*.81,y+(i+.5)*d/n],'#bfc0a5',1.5);}
else if(p.type==='dock'){for(let i=1;i<Math.min(35,w/12);i++)line([x+i*12,y],[x+i*12,y+d],'#8c927970',.7);}
else if(p.type==='orchard'||p.type==='glassbed'||p.type==='gardenbed'){for(let j=0;j<4;j++){this.quad(x+6,y+8+j*(d-16)/4,Math.max(1,w-12),Math.max(1,(d-16)/4*.55),z+.02,p.type==='orchard'?'#a9ae7960':p.type==='glassbed'?'#c7d5a575':['#b7c395','#cfb698','#b3c7b1','#a3b59b'][j]);} }
else if(p.type==='pond'||p.type==='lily'){for(let i=0;i<7;i++){let cx=x+w*(.12+.12*i),cy=y+d*(.25+(i%3)*.22);if(p.type==='lily'){let pts=[];for(let j=0;j<14;j++){let a=j*Math.PI/7;pts.push(this.project(cx+Math.cos(a)*Math.min(10,w*.05),cy+Math.sin(a)*Math.min(8,d*.06),z+.02));}this.poly(pts,'#689d855c');}else line([cx,cy],[cx+w*.06,cy],'#cce7d07a',1);}}
else if(p.type==='orbit'){for(const f of[.28,.44]){let pts=[];for(let i=0;i<=40;i++){let a=i*Math.PI/20;pts.push(this.project(x+w*.5+Math.cos(a)*w*f,y+d*.5+Math.sin(a)*d*f,z+.02));}this.line(pts,'#e8e2c888',2);}line([x+w*.5,y+d*.07],[x+w*.5,y+d*.93],'#e9e3c770',1);}
else if(p.type==='stage'){for(let i=0;i<4;i++)this.quad(x+i*6,y+i*6,Math.max(1,w-i*12),3,z+.02,'#e2d4b477');}
else if(p.type==='plaza'||p.type==='court'){for(let i=1;i<5;i++){line([x+w*i/5,y],[x+w*i/5,y+d],'#f0e8d147',.7);line([x,y+d*i/5],[x+w,y+d*i/5],'#f0e8d147',.7);}if(l.sceneId==='financeplaza'){this.quad(x+w*.42,y+d*.1,w*.16,d*.8,z+.04,'#a7b7ae55');}if(l.sceneId==='sculpturepark'){for(let i=0;i<7;i++)this.quad(x+w*(.08+i*.13),y+d*(.25+(i%2)*.4),w*.035,d*.07,z+.04,'#879b8e44');}}
this.ctx.restore();
}
}

prop(o,x,y,w,d,h,col,district,variant){const z=this.cam.zoom;
switch(o.kind){
case'cone':{
const cc=district==='garden'?'#bcaa74':district==='skyline'?'#9ba6b6':'#dc955a';this.box(x,y,w,d,2,'#dfd8ba');this.poly([this.project(o.x,o.y,h),this.project(x,y+d,2),this.project(x+w,y+d,2)],cc);this.poly([this.project(o.x,o.y,h),this.project(x+w,y,2),this.project(x+w,y+d,2)],shade(cc,-28));this.front(x+w*.3,y+d*.7,w*.4,h*.3,2,'#eee6c8');break;}
case'bin':{
const cc=district==='oldtown'?'#a28c64':district==='harbor'?'#687f83':district==='garden'?'#849a72':'#9aa8ad';this.box(x,y,w,d,h*.85,cc);this.box(x,y,w,d,h*.15,shade(cc,-14),h*.85);this.quad(x+w*.23,y+d*.27,w*.54,d*.13,h+.02,'#314c49');
if(district==='oldtown'||district==='garden')for(let i=1;i<4;i++)this.line([this.project(x+w*i/4,y+d+.02,2),this.project(x+w*i/4,y+d+.02,h*.78)],shade(cc,-22),.8);
if(district==='harbor'){this.front(x,y+d+.02,w,h*.22,2,'#cfa66b');this.front(x,y+d+.02,w,h*.67,2,'#cfa66b');}
if(district==='skyline')this.front(x+w*.24,y+d+.02,w*.52,h*.53,3,'#d5ece4');break;}
case'bench':{
const cc=district==='harbor'?'#9fa9a3':district==='skyline'?'#c2c8c4':'#bc986c';
for(const xx of[x+w*.12,x+w*.8])this.box(xx,y+d*.15,w*.08,d*.65,h*.54,district==='garden'?'#849075':'#5e7570');this.box(x,y,w,d,3,cc,h*.54);
if(district==='garden'){
for(const xx of[x+w*.08,x+w*.86])this.box(xx,y+d*.08,w*.06,d*.15,h*.8,'#9a9c7c');this.box(x,y,w,d*.13,h*.24,'#c0b58e',h*.72);
}else if(district!=='skyline')this.box(x,y,w,d*.15,h*.4,cc,h*.6);
for(let j=1;j<3;j++)this.quad(x,y+j*d/3,w,.9,h*.54+3.02,shade(cc,-22));break;}
case'lamp':{
const metal=district==='oldtown'?'#667165':district==='garden'?'#9c936c':'#6f8384';this.box(o.x-w*.08,o.y-d*.08,w*.16,d*.16,h*.85,metal);
if(district==='oldtown'||district==='garden'){
this.box(x+w*.23,y+d*.23,w*.54,d*.54,h*.15,'#e5d49b',h*.7);this.roof(x+w*.15,y+d*.15,w*.7,d*.7,h*.85,h,metal);
}else if(district==='harbor'){
this.box(x+w*.15,y+d*.4,w*.7,d*.2,2,metal,h*.87);this.box(x+w*.03,y+d*.27,w*.35,d*.45,h*.13,'#d6ba78',h*.87);
}else{this.box(x,y+d*.37,w,d*.25,h*.06,'#96a6a6',h*.92);this.quad(x+w*.07,y+d*.4,w*.86,d*.2,h*.981,'#eef2d6');}break;}
case'tree':{
this.box(o.x-2,o.y-2,4,4,h*.58,'#958365');
if(district==='garden'||district==='oldtown'){
// Rounded orchard crowns have a distinct silhouette from the old diamond pines.
const radius=Math.min(w,d)*.43,zz=h*.65;
for(const [dx,dy,dz,rr,cc] of[[-w*.16,0,0,.78,'#79975f'],[w*.16,0,.02,.78,'#8ea872'],[0,-d*.14,.10,.76,'#a6b985']]){
const p=this.project(o.x+dx,o.y+dy,h*(.65+dz));this.ellipse(p.x,p.y,radius*rr*z,radius*rr*.94*z,cc);}
if(district==='garden'&&variant%3===0){const p=this.project(o.x+w*.14,o.y,h*.69);this.ellipse(p.x,p.y,2*z,2*z,'#d4c78b');}
}else if(district==='skyline'){
this.box(x+w*.13,y+d*.13,w*.74,d*.74,h*.32,'#799584',h*.55);this.box(x+w*.23,y+d*.23,w*.54,d*.54,h*.13,'#a2b496',h*.87);
}else{
for(let i=0;i<3;i++){const rr=Math.min(w,d)*(.46-i*.09),zz=h*(.4+i*.17);this.poly([this.project(o.x,o.y,Math.min(h,zz+h*.27)),this.project(o.x+rr,o.y,zz),this.project(o.x,o.y+rr,zz)],'#668e7e');this.poly([this.project(o.x,o.y,Math.min(h,zz+h*.27)),this.project(o.x,o.y+rr,zz),this.project(o.x-rr,o.y,zz),this.project(o.x,o.y-rr,zz)],i===2?'#96b09a':'#80a18b');}
}break;}
case'car':case'van':{
const commercial=district==='harbor',cc=district==='skyline'?['#788a99','#b8c4c5','#a0a6b7'][variant%3]:col;
this.box(x,y,w,d,h*.43,cc);
if(commercial){this.box(x+w*.32,y,w*.67,d,h*.56,shade(cc,9),h*.43);this.front(x+w*.35,y+d+.02,w*.6,h*.48,h*.44,shade(cc,-7));for(let i=1;i<5;i++)this.line([this.project(x+w*(.34+i*.12),y+d+.04,h*.5),this.project(x+w*(.34+i*.12),y+d+.04,h*.9)],shade(cc,-28),.8);this.box(x+w*.04,y+d*.08,w*.22,d*.84,h*.37,'#96afb0',h*.43);
}else{this.box(x+w*.22,y+d*.08,w*.53,d*.84,h*.42,shade(cc,12),h*.43);this.quad(x+w*.24,y+d*.12,w*.15,d*.76,h*.86,'#668893');this.quad(x+w*.57,y+d*.12,w*.15,d*.76,h*.86,'#668893');if(district==='garden')this.quad(x+w*.4,y+d*.12,w*.14,d*.76,h*.861,'#e3dbc0');}
for(const xx of[x+w*.21,x+w*.8]){const p=this.project(xx,y+d-.3,3);this.ellipse(p.x,p.y,2.7*z,3*z,'#425450');}this.quad(x+w*.93,y+d*.15,w*.07,d*.7,h*.44,'#e8dfb1');break;}
default:return false;
}return true;}
drawBody(o,s,x,y,w,d,h,col,district,variant){if(!this.sceneObject(o,x,y,w,d,h,col,o.visualScene||s.level.sceneId,variant,s.level.layoutVersion>=7)&&!this.prop(o,x,y,w,d,h,col,district,variant))this.architecture(o,x,y,w,d,h,col,district,variant);}
// All static city bodies reuse high-resolution rasterizations of the
// SAME BSP geometry. Shadows, target markers and swallowing stay live. Resolution
// tracks screen pixel needs; count and actual RGBA bytes are both bounded.
drawSprite(o,s,x,y,w,d,h,col,district,v,base){
if(typeof OffscreenCanvas==='undefined'&&typeof document==='undefined')return false;
const z=this.cam.zoom,dpr=Math.min(typeof devicePixelRatio==='number'?devicePixelRatio:1,2),density=Math.max(.5,Math.min(2,2**Math.ceil(Math.log2(Math.max(.5,z*dpr))))),key=[o.visualScene||s.level.sceneId,district,o.kind,o.signature||false,o.label||'',w,d,h,col,v%12].join('|');
let item=this.spriteCache.get(key);
if(item&&item.density<density){this.spriteBytes-=item.bytes;item.canvas.width=1;item.canvas.height=1;this.spriteCache.delete(key);item=null;}
if(!item){const pad=5,ex=(w+d)*.433,ey=(w+d)*.25,cw=Math.ceil(ex*2+pad*2),ch=Math.ceil(h+ey*2+pad*2),pw=Math.ceil(cw*density),ph=Math.ceil(ch*density),bytes=pw*ph*4;
if(bytes>this.spriteByteLimit/3||pw>4096||ph>4096)return false;
const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(pw,ph):document.createElement('canvas');canvas.width=pw;canvas.height=ph;const context=canvas.getContext('2d');context.setTransform(density,0,0,density,0,0);
const previous={ctx:this.ctx,w:this.w,h:this.h,cam:this.cam},baseY=h+ey+pad,offset=baseY-ch*.51;
try{this.ctx=context;this.w=cw;this.h=ch;this.cam={x:o.x-offset,y:o.y-offset,zoom:1};this.drawBody(o,s,x,y,w,d,h,col,district,v);}finally{Object.assign(this,previous);}
item={canvas,cw,ch,baseY,bytes,density};while(this.spriteCache.size>=this.spriteLimit||this.spriteBytes+bytes>this.spriteByteLimit){const oldest=this.spriteCache.keys().next().value,drop=this.spriteCache.get(oldest);if(!drop)break;this.spriteBytes-=drop.bytes;drop.canvas.width=1;drop.canvas.height=1;this.spriteCache.delete(oldest);}this.spriteCache.set(key,item);this.spriteBytes+=bytes;this.stats.spriteBuilds++;
}else{this.spriteCache.delete(key);this.spriteCache.set(key,item);this.stats.spriteHits++;}
this.stats.spriteBytes=this.spriteBytes;this.ctx.drawImage(item.canvas,base.x-item.cw*z/2,base.y-item.baseY*z,item.cw*z,item.ch*z);return true;
}
drawObject(o,s,time){const c=this.ctx,z=this.cam.zoom,base=this.project(o.x,o.y);if(!this.objectVisible(o,s))return;let r=o.radius||10,h=o.height||r,w=o.w||r*1.18,d=o.d||r*.95,x=o.x-w/2,y=o.y-d/2;const th=s.level.theme||{},district=s.level.districtId||'oldtown',variant=Math.abs(String(o.id).split('').reduce((a,b)=>a+b.charCodeAt(0),0));let col=o.color||(th.building||['#dd8772','#e7c777','#a8a0bb','#78a99c'])[Math.abs(String(o.id).split('').reduce((a,b)=>a+b.charCodeAt(0),0))%4]||'#a3ba9c';let sinking=o.state==='sinking';c.save();
if(sinking){const q=Math.min(1,o.sink),p=this.project(s.x,s.y),dx=(p.x-base.x)*q,dy=(p.y-base.y)*q; c.beginPath();c.rect(-2000,-2000,this.w+4000,p.y+s.radius*.707*z+2000);c.clip();c.translate(base.x+dx,base.y+dy+q*q*h*z*.95);c.rotate(Math.sin(q*Math.PI)*.18*(o.x>s.x?1:-1));c.scale(1-q*.55,1-q*.45);c.translate(-base.x,-base.y);c.globalAlpha=1-q*.65;}
if(!sinking){this.ellipse(base.x+7*z,base.y+5*z,r*1.2*z,r*.54*z,'#294c3b20');}
if(!(!sinking&&this.drawSprite(o,s,x,y,w,d,h,col,district,variant,base)))this.drawBody(o,s,x,y,w,d,h,col,district,variant);
if(o.target&&!sinking){const p=this.project(o.x,o.y,h+18+Math.sin(time*2+o.x)*2);this.poly([{x:p.x,y:p.y-7},{x:p.x+6,y:p.y},{x:p.x,y:p.y+7},{x:p.x-6,y:p.y}],o.tier<=s.tier?'#eab258':'#e9d8ab','#fff8df');}
c.restore();}
hole(s,time){const c=this.ctx,p=this.project(s.x,s.y),rx=s.radius*1.225*this.cam.zoom,ry=s.radius*.707*this.cam.zoom;this.ellipse(p.x,p.y+3*this.cam.zoom,rx+3,ry+3,'#344b3933');this.ellipse(p.x,p.y,rx+2.5,ry+2.5,'#e7d9b1');this.ellipse(p.x,p.y,rx,ry,'#425652');this.ellipse(p.x,p.y+2*this.cam.zoom,rx*.97,ry*.89,'#172e30');this.ellipse(p.x,p.y+4*this.cam.zoom,rx*.88,ry*.69,'#0b1d20');c.beginPath();c.ellipse(p.x,p.y,rx+5,ry+4,0,Math.PI*1.15,Math.PI*1.8);c.lineWidth=1.5;c.strokeStyle='#f8f5ceaa';c.stroke();if(this.skinId!=='original'&&window.HCSkins)window.HCSkins.draw(c,this.skinId,p.x,p.y,rx,ry);}
// Start preparation is sliced across paints. The existing menu remains intact;
// a new selection cancels preparation, and no partially built city is shown.
prepareCity(level,done,valid){const s={level,mode:'zen',x:level.spawn.x,y:level.spawn.y,tier:0,radius:15},cam={x:s.x,y:s.y,zoom:Math.max(.8,Math.min(1.2,this.w/680))},previous=this.cam;this.cam=cam;const objects=level.objects.filter(o=>this.objectVisible(o,s)).map(o=>({...o,state:'live'}));this.cam=previous;let index=0;const step=()=>{if(!valid())return;const start=performance.now(),old=this.cam;this.cam=cam;try{while(index<objects.length){this.drawObject(objects[index++],s,0);if(performance.now()-start>=8)break;}}finally{this.cam=old;}if(index<objects.length)requestAnimationFrame(step);else done();};requestAnimationFrame(step);}
// Conservative projected envelope includes tall towers and oversized late-game
// objects. Sinking objects keep their complete transform until swallowed.
objectVisible(o,s){if(o.state==='sinking')return true;const r=o.radius||10,w=o.w||r*1.18,d=o.d||r*.95,h=o.height||r,p=this.project(o.x,o.y),z=this.cam.zoom,ex=Math.max((w+d)*.433,r*1.3)*z+12,ey=(w+d)*.25*z+12;return p.x+ex>=0&&p.x-ex<=this.w&&p.y+ey>=0&&p.y-ey-(h+30)*z<=this.h;}
menuBackground(level){let img=this.menuImages.get(level.id);if(!img&&typeof Image!=='undefined'){img=new Image();img.src='assets/previews/'+level.id+'-map.webp';this.menuImages.set(level.id,img);}const c=this.ctx;this.stats.menuImage=!!(img&&img.complete&&img.naturalWidth);c.fillStyle=level.theme?.ground||'#b6c5b6';c.fillRect(0,0,this.w,this.h);if(this.stats.menuImage){const scale=Math.max(this.w/img.naturalWidth,this.h/img.naturalHeight),w=img.naturalWidth*scale,h=img.naturalHeight*scale;c.drawImage(img,(this.w-w)/2,(this.h-h)/2,w,h);}this.stats.visible=0;this.stats.candidates=0;}
render(s,dt,menu){const t=performance.now()/1000;if(menu){this.menuBackground(s.level);return;}this.stats.menuImage=false;
const baseZoom=Math.max(.8,Math.min(1.2,this.w/680)),normalZoom=baseZoom*(1-Math.min(s.tier,5)*.092),radiusZoom=Math.min(this.w/(Math.max(104,s.radius)*5.4),this.h/(Math.max(104,s.radius)*3.4));let targetZoom=s.mode==='zen'?Math.max(.08,Math.min(normalZoom,radiusZoom)):normalZoom;
let blend=1-Math.exp(-dt*5);this.cam.x+=(s.x-this.cam.x)*blend;this.cam.y+=(s.y-this.cam.y)*blend;this.cam.zoom+=(targetZoom-this.cam.zoom)*blend;this.terrain(s.level,t);this.hole(s,t);
// Authored objects never change their world anchors; retain stable painter order
// once per state instead of sorting the entire city on every animation frame.
let objs=this.depthOrders.get(s.objects);if(!objs){objs=s.objects.slice().sort((a,b)=>(a.x+a.y)-(b.x+b.y));this.depthOrders.set(s.objects,objs);}let visible=0,candidates=0;for(const o of objs){if(o.state!=='live'&&o.state!=='sinking')continue;candidates++;if(!this.objectVisible(o,s))continue;visible++;this.drawObject(o,s,t);}this.stats.visible=visible;this.stats.candidates=candidates;this.guides(s,t);this.drawParticles(dt);}

guides(s,time){const c=this.ctx,z=this.cam.zoom;let blocked=null,nearest=Infinity;for(const o of s.objects){if(o.state!=='live'||(o.tier<=s.tier&&o.radius<=s.radius))continue;const distance=(o.x-s.x)**2+(o.y-s.y)**2,reach=s.radius+o.radius+30;if(distance<reach*reach&&distance<nearest){blocked=o;nearest=distance;}}if(blocked){const p=this.project(blocked.x,blocked.y,blocked.height+12);c.font='bold 10px sans-serif';c.textAlign='center';const text=blocked.radius>s.radius?(window.HCI18n?.t('canvas.grow')||'还需继续长大'):(window.HCI18n?.t('canvas.needLevel',{level:blocked.tier+1})||'需要 '+(blocked.tier+1)+' 级'),width=Math.max(84,typeof c.measureText==='function'?(c.measureText(text)?.width||0)+16:84);c.fillStyle='#f7eedb';c.fillRect(p.x-width/2,p.y-12,width,18);c.fillStyle='#9d704a';c.fillText(text,p.x,p.y+1);c.textAlign='left';}let hole=this.project(s.x,s.y);c.font='bold 9px sans-serif';c.textAlign='center';c.fillStyle='#f7f2d9';c.fillText('LV '+(window.HCEngine?.displayLevel?window.HCEngine.displayLevel(s):s.tier+1),hole.x,hole.y+s.radius*.707*z+18);c.textAlign='left';}
burst(o,grow){if(this.particles.length>222)this.particles.splice(0,this.particles.length-222);let p=this.project(o.x,o.y);for(let i=0;i<(grow?18:5);i++){let a=Math.random()*Math.PI*2;this.particles.push({x:p.x,y:p.y,vx:Math.cos(a)*(grow?70:30),vy:Math.sin(a)*30-35,life:1,color:grow?'#f7d88b':o.color||'#efe5c7',size:grow?4:2});}}
drawParticles(dt){const c=this.ctx;for(const p of this.particles){p.life-=dt*1.8;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=50*dt;c.globalAlpha=Math.max(0,p.life);c.fillStyle=p.color;c.fillRect(p.x,p.y,p.size,p.size);}c.globalAlpha=1;this.particles=this.particles.filter(p=>p.life>0);}
minimap(canvas,s){const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,pad=9,scale=Math.min((w-pad*2)/s.level.bounds.w,(h-pad*2)/s.level.bounds.h);c.clearRect(0,0,w,h);c.fillStyle='#cedac6';c.fillRect(pad,pad,s.level.bounds.w*scale,s.level.bounds.h*scale);for(const r of s.level.roads||[]){c.fillStyle='#eef0df';c.fillRect(pad+r.x*scale,pad+r.y*scale,r.w*scale,r.h*scale);}for(const o of s.objects){if(o.state!=='live')continue;c.fillStyle=o.target?'#c28d42':o.tier<=s.tier?'#72977c':'#aab5a1';c.fillRect(pad+o.x*scale-1.5,pad+o.y*scale-1.5,o.target?5:2,o.target?5:2);}c.beginPath();c.arc(pad+s.x*scale,pad+s.y*scale,Math.max(3,s.radius*scale),0,Math.PI*2);c.fillStyle='#1b3b36';c.fill();c.strokeStyle='#f4edc8';c.lineWidth=1.5;c.stroke();}}
window.HCRenderer=Renderer;
})();
