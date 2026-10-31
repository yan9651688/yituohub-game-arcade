/* Original position-based cotton mesh. Shared by the browser and headless tests. */
(function (root) {
'use strict';
const MATERIALS={fishing_net:{label:'渔网',stretch:.92,compression:.08,shear:.003,tear:2.05,fatigue:.8,damageRate:5,damageStart:1.22,damping:.989,depthDamping:.975,gravity:370},cotton:{label:'薄棉布',stretch:.82,compression:.24,shear:.045,tear:1.48,fatigue:.65,damageRate:7,damageStart:1.18,damping:.989,depthDamping:.978,gravity:340},denim:{label:'牛仔布',stretch:.94,compression:.38,shear:.12,tear:2.1,fatigue:1.15,damageRate:4,damageStart:1.25,damping:.982,depthDamping:.965,gravity:440},gauze:{label:'纱布',stretch:.68,compression:.12,shear:.018,tear:1.45,fatigue:.46,damageRate:9,damageStart:1.12,damping:.992,depthDamping:.985,gravity:220,crossTear:.95},silk:{label:'丝绸',stretch:.87,compression:.08,shear:.022,tear:1.8,fatigue:.9,damageRate:5,damageStart:1.22,damping:.996,depthDamping:.99,gravity:270,crossTear:1.12},linen:{label:'亚麻',stretch:.95,compression:.31,shear:.075,tear:1.72,fatigue:.7,damageRate:6,damageStart:1.2,damping:.978,depthDamping:.96,gravity:390,crossTear:.78},felt:{label:'毛毡',stretch:.65,compression:.4,shear:.16,tear:1.95,fatigue:1,damageRate:4.5,damageStart:1.24,damping:.965,depthDamping:.94,gravity:470}};
// Gel sheets are inexpensive 2.5D spring networks, not volume-conserving fluids.
Object.assign(MATERIALS,{
  stocking:{label:'薄丝袜',stretch:.1,compression:.09,shear:.018,tear:3.2,fatigue:1.1,damageRate:2.5,damageStart:1.7,damping:.985,depthDamping:.975,gravity:245},
  chain_mail:{label:'铁环网',stretch:.98,compression:.045,shear:.006,tear:3.7,fatigue:2.8,damageRate:2,damageStart:1.8,damping:.976,depthDamping:.963,gravity:480},
  jelly:{label:'透明果冻',stretch:.19,compression:.16,shear:.09,tear:4.2,fatigue:2.3,damageRate:1.8,damageStart:2.8,damping:.994,depthDamping:.989,gravity:155},
  slime:{label:'透明史莱姆',stretch:.3,compression:.18,shear:.07,tear:5.4,fatigue:1.6,damageRate:1.8,damageStart:3.5,damping:.94,depthDamping:.92,gravity:150}
});
// Deliberately independent of the mechanical profiles: an unheated cloth
// retains the original solver response, including its exact tear thresholds.
const BURN_PROFILES={stocking:{rate:.58,spread:.7},cotton:{rate:.62,spread:.8},denim:{rate:.34,spread:.62},gauze:{rate:.94,spread:1.02},silk:{rate:.74,spread:.86},linen:{rate:.55,spread:.74},felt:{rate:.27,spread:.52},fishing_net:{rate:.44,spread:.78},chain_mail:{rate:0,spread:.18},jelly:{rate:0,spread:.08},slime:{rate:0,spread:.06}};
function pointSegmentDistanceSq(x,y,ax,ay,bx,by){
  const dx=bx-ax,dy=by-ay,length=dx*dx+dy*dy;
  const t=length?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/length)):0;
  const ex=x-ax-t*dx,ey=y-ay-t*dy;return ex*ex+ey*ey;
}
function segmentsTouch(ax,ay,bx,by,cx,cy,dx,dy,radiusSq){
  // A swept capsule, not sampled points, makes a fast stroke continuous.
  const ux=bx-ax,uy=by-ay,vx=dx-cx,vy=dy-cy,den=ux*vy-uy*vx;
  if(Math.abs(den)>1e-9){const wx=cx-ax,wy=cy-ay,t=(wx*vy-wy*vx)/den,s=(wx*uy-wy*ux)/den;if(t>=0&&t<=1&&s>=0&&s<=1)return true;}
  return pointSegmentDistanceSq(ax,ay,cx,cy,dx,dy)<=radiusSq||pointSegmentDistanceSq(bx,by,cx,cy,dx,dy)<=radiusSq||pointSegmentDistanceSq(cx,cy,ax,ay,bx,by)<=radiusSq||pointSegmentDistanceSq(dx,dy,ax,ay,bx,by)<=radiusSq;
}
class Cloth {
  constructor({x=100,y=70,width=400,height=430,cols=27,rows=30,material='cotton',anchors='clips',environment=null}={}) {
    Object.assign(this,{x,y,width,height,cols,rows});
    this.material=MATERIALS[material]?material:'cotton';this.profile=MATERIALS[this.material];
    const config=typeof environment==='string'?{type:environment}:environment;
    this.environment=null;
    if(config&&['flat','sphere','slope','flag'].includes(config.type)){
      const finite=(value,fallback)=>Number.isFinite(value)?value:fallback;
      const radius=Math.max(1,finite(config.radius,Math.min(width,height)*.36));
      this.environment={type:config.type,cx:finite(config.cx,x+width*.5),cy:finite(config.cy,y+height*.5),radius,centerZ:finite(config.centerZ,-radius*.45),planeZ:finite(config.planeZ,0),slope:Math.max(0,Math.min(.7,finite(config.slope,.3))),minX:finite(config.minX,x-width*.22),maxX:finite(config.maxX,x+width*1.22),minY:finite(config.minY,y-height*.12),maxY:finite(config.maxY,y+height*1.2),wind:Math.max(0,Math.min(2,finite(config.wind,1)))};
      anchors=config.type==='flag'?'left':'none';
    }
    this.anchors=['top','frame','left','none'].includes(anchors)?anchors:'clips';this.burnProfile=BURN_PROFILES[this.material];
    this.clips=this.anchors==='clips'?[2,cols-2].map(i=>({x:x+i*width/cols,y})):[];
    this.spacing=width/cols;this.stepCount=0;this.yarnMode=material==='gauze'||material==='fishing_net';this.knotted=material==='fishing_net';this.viscoelastic=material==='felt';this.chainMode=this.material==='chain_mail';this.gelMode=this.material==='jelly'||this.material==='slime'?this.material:null;this.stockingMode=this.material==='stocking';if(this.chainMode||this.stockingMode)this.yarnMode=true;this.ladderCount=0;this.ladderFronts=new Set();
    this.nodes=[]; this.edges=[]; this.liveEdges=[]; this.liveFaces=[]; this.boundaryEdges=[]; this.activeMask=new Uint8Array((cols+1)*(rows+1)); this.faces=[]; this.grab=null; this.time=0; this.breakCount=0; this.onBreak=null;this.onManipulate=null;
    const edgeMap=new Map();this.heatDelta=new Float32Array(this.activeMask.length);
    for(let j=0;j<=rows;j++) for(let i=0;i<=cols;i++) {
      // A staggered row lattice gives real diagonal ropes and diamond apertures.
      // Only fishing nets use it; cloth/gauze retain their original coordinates.
      const px=x+(i+(this.knotted&&j%2?.5:0))*width/cols, py=y+j*height/rows;
      const pin=this.anchors==='none'?false:this.anchors==='left'?i===0:this.anchors==='top'?j===0:this.anchors==='frame'?j===0||j===rows||i===0||i===cols:j<=1&&(Math.abs(i-2)<=1||Math.abs(i-(cols-2))<=1);
      // Tiny real out-of-plane irregularities seed buckling under compression.
      const z=this.environment&&this.environment.type!=='flag'?this.supportHeight(px,py)+(this.gelMode?this.spacing*(this.gelMode==='jelly'?1.25:.8):0):pin?0:Math.sin(i*.72)*Math.sin(j*.37)*width*.009;
      this.nodes.push({x:px,y:py,z,px,py,pz:z,ox:px,oy:py,pin,anchor:pin,customPin:false,active:true,i,j,thickness:1,bodyDepth:this.gelMode?(this.gelMode==='jelly'?this.spacing*1.25:this.spacing*.8):this.chainMode?this.spacing*.18:0,heat:0,char:0,burnt:false,paintR:0,paintG:0,paintB:0,paintA:0});
    }
    const edge=(a,b)=>{
      const key=a<b?a+':'+b:b+':'+a;
      if(edgeMap.has(key))return edgeMap.get(key);
      const A=this.nodes[a],B=this.nodes[b],id=this.edges.length;
      // Net ropes run between staggered rows. Same-row triangulation links
      // are weak auxiliary braces, never rendered as rope.
      const shear=this.knotted?A.j===B.j:A.i!==B.i&&A.j!==B.j;
      const reinforced=[A,B].some(n=>this.anchors==='none'?false:this.anchors==='left'?n.i<=2:this.anchors==='top'?n.j<=2:this.anchors==='frame'?n.j<=2||n.j>=rows-2||n.i<=2||n.i>=cols-2:n.j<=4&&(Math.abs(n.i-2)<=3||Math.abs(n.i-(cols-2))<=3));
      // Sphere cloth is cut flat, not molded to the support: shorter planar
      // rest lengths gather the perimeter and form folds as it settles.
      const rest=Math.hypot(A.x-B.x,A.y-B.y,this.environment?.type==='sphere'?0:A.z-B.z);this.edges.push({id,a,b,rest,softRest:rest,yarn:this.yarnMode&&!shear,shear,cross:this.knotted?(B.x-A.x)*(B.y-A.y)>0:A.j===B.j,reinforced,knitAxis:this.stockingMode&&!shear?(A.j===B.j?'course':'wale'):null,alive:true,faces:[],damage:0});edgeMap.set(key,id);return id;
    };
    const face=(a,b,c)=>{const id=this.faces.length,ee=[edge(a,b),edge(b,c),edge(c,a)];this.faces.push({nodes:[a,b,c],edges:ee,alive:true,restArea:Math.abs((this.nodes[b].x-this.nodes[a].x)*(this.nodes[c].y-this.nodes[a].y)-(this.nodes[b].y-this.nodes[a].y)*(this.nodes[c].x-this.nodes[a].x))*.5});ee.forEach(e=>this.edges[e].faces.push(id));};
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+1,c=a+cols+1,d=c+1;if(this.knotted?j%2===0:(i+j)%2){face(a,b,c);face(b,d,c);}else{face(a,b,d);face(a,d,c);}}
    // Fine gauze detail is interpolated inside each intact physical triangle.
    // It is not extra solver particles, and cannot cross a missing face.
    if(this.material==='gauze')for(const f of this.faces){f.weaveSegments=[];for(const axis of ['i','j']){const values=f.nodes.map(id=>this.nodes[id][axis]);for(let q=Math.min(...values)*3+1;q<Math.max(...values)*3;q++){const level=q/3,ends=[];for(let k=0;k<3;k++){const a=k,b=(k+1)%3;if((values[a]<level&&values[b]>level)||(values[b]<level&&values[a]>level))ends.push([f.nodes[a],f.nodes[b],(level-values[a])/(values[b]-values[a])]);}if(ends.length===2)f.weaveSegments.push({a:ends[0],b:ends[1]});}}}
    if(this.gelMode){this.gelFloor=y+height+60;this.gelBounds={minX:x-width*.5,maxX:x+width*1.5};this.pendingCuts=new Map();this.healedCount=0;}
    this.reconcile();
  }
  screenPoint(n){return this.projectPoint?this.projectPoint(n):n;}
  worldPoint(x,y,z){return this.unprojectPoint?this.unprojectPoint(x,y,z):{x,y};}
  boundedTarget(x,y){const e=this.environment;return e&&e.type!=='flag'?{x:Math.max(e.minX,Math.min(e.maxX,x)),y:Math.max(e.minY,Math.min(e.maxY,y))}:{x,y};}
  nearestVisible(x,y,radius,allow){let best=-1,distance=radius*radius,depth=-Infinity;const epsilon=this.projectPoint?1:0;
    for(let i=0;i<this.nodes.length;i++){const n=this.nodes[i];if(!allow(n))continue;const q=this.screenPoint(n),d=(q.x-x)**2+(q.y-y)**2,z=Number.isFinite(q.depth)?q.depth:0;
      if(d>=radius*radius)continue;if(best<0||d<distance-epsilon||(Math.abs(d-distance)<=epsilon&&z>depth)){best=i;distance=d;depth=z;}}
    return best;
  }
  // Elevation support is shared with the renderer; x/y/z remain world coordinates.
  supportHeight(x,y){
    const e=this.environment;if(!e||e.type==='flag')return -Infinity;
    if(e.type==='sphere'){const r2=e.radius*e.radius-(x-e.cx)**2-(y-e.cy)**2;return Math.max(e.planeZ,r2>0?e.centerZ+Math.sqrt(r2):e.planeZ);}
    return e.type==='slope'?e.planeZ-e.slope*(y-e.cy):e.planeZ;
  }
  // World-space depth below n.z (the top surface), shared by contact and rendering.
  gelDepth(n){return n?(n.bodyDepth||0)*n.thickness:0;}
  projectSupport(){
    const e=this.environment;if(!e||e.type==='flag')return;
    for(const n of this.nodes){if(!n.active||n.pin)continue;const floor=this.supportHeight(n.x,n.y)+(this.gelMode?this.gelDepth(n):0);if(n.z<floor){const dz=floor-n.z;n.z=floor;n.pz+=dz;const vz=n.z-n.pz;if(vz<0)n.pz=n.z;}}
  }
  containSupport(){
    const e=this.environment;if(!e||e.type==='flag')return;
    // Only build connectivity when a piece reaches a tray edge. Move each
    // free component as a whole: a stopped sheet must not squash to a line.
    if(!this.nodes.some(n=>n.active&&!n.pin&&(n.x<e.minX||n.x>e.maxX||n.y<e.minY||n.y>e.maxY)))return;
    const adjacent=this.nodes.map(()=>[]);for(const edge of this.liveEdges)if(edge.alive){adjacent[edge.a].push(edge.b);adjacent[edge.b].push(edge.a);}
    const seen=new Uint8Array(this.nodes.length);
    for(let start=0;start<this.nodes.length;start++){
      if(seen[start]||!this.nodes[start].active)continue;const ids=[start];seen[start]=1;let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,pinned=false;
      for(let k=0;k<ids.length;k++){const n=this.nodes[ids[k]];minX=Math.min(minX,n.x);maxX=Math.max(maxX,n.x);minY=Math.min(minY,n.y);maxY=Math.max(maxY,n.y);pinned=pinned||n.pin;for(const next of adjacent[ids[k]])if(!seen[next]){seen[next]=1;ids.push(next);}}
      if(pinned)continue;
      const dx=maxX-minX>e.maxX-e.minX?(e.minX+e.maxX-minX-maxX)*.5:minX<e.minX?e.minX-minX:maxX>e.maxX?e.maxX-maxX:0,dy=maxY-minY>e.maxY-e.minY?(e.minY+e.maxY-minY-maxY)*.5:minY<e.minY?e.minY-minY:maxY>e.maxY?e.maxY-maxY:0;
      if(dx||dy)for(const id of ids){const n=this.nodes[id];n.x+=dx;n.y+=dy;n.px=n.x;n.py=n.y;}
    }
    this.projectSupport();
  }
  beginClipDrag(x,y,radius=23){
    if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(radius)||radius<=0)return false;
    this.release();const best=this.nearestVisible(x,y,radius,n=>n.active&&!n.anchor&&!n.burnt);
    if(best<0)return false;const n=this.nodes[best];
    const previous={x:n.x,y:n.y,z:n.z,ox:n.ox,oy:n.oy,customPin:n.customPin,pin:n.pin};
    n.pin=false;n.customPin=false;delete n.clipTarget;
    // Center the connected patch on the chosen node, then retain pointer offset.
    const pick=this.screenPoint(n);if(!this.grabAt(pick.x,pick.y,radius)){Object.assign(n,previous);return false;}
    const world=this.worldPoint(x,y,n.z);x=world.x;y=world.y;const g=this.grab;g.x=g.tx=g.startX=x;g.y=g.ty=g.startY=y;
    for(const it of g.items){it.dx=this.nodes[it.i].x-x;it.dy=this.nodes[it.i].y-y;}
    g.kind='clip';this.refreshGrabSupport();this.clipDrag={index:best,previous};return true;
  }
  moveClipDrag(x,y){if(this.clipDrag&&Number.isFinite(x)&&Number.isFinite(y))this.moveGrab(x,y);}
  finishClipDrag(commit=true){
    const drag=this.clipDrag;if(!drag)return false;const grab=this.grab;this.clipDrag=null;this.grab=null;
    const n=this.nodes[drag.index];if(!n||!n.active||n.burnt||n.anchor)return false;
    if(commit){
      // A quick swipe can finish between animation frames. Consume the last
      // pointer target on this movable patch, never on permanent fixtures.
      const center=grab?.items.find(it=>it.i===drag.index);
      if(center){let target=this.boundedTarget(grab.tx+center.dx,grab.ty+center.dy);const desired=this.screenPoint({x:grab.tx+center.dx,y:grab.ty+center.dy,z:grab.z+center.dz});for(let settle=0;settle<3;settle++){n.z=Math.max(grab.z+center.dz,this.supportHeight(target.x,target.y)+(this.gelMode?this.gelDepth(n):0));if(this.unprojectPoint){const world=this.worldPoint(desired.x,desired.y,n.z);target=this.boundedTarget(world.x,world.y);}}let dx=target.x-n.x,dy=target.y-n.y;
        if(Math.hypot(dx,dy)>this.spacing*2&&Math.hypot(grab.tx-grab.startX,grab.ty-grab.startY)>this.spacing*3){n.clipTarget={x:n.x+dx,y:n.y+dy};if(this.projectPoint){const screen=this.screenPoint({x:n.clipTarget.x,y:n.clipTarget.y,z:n.z});n.clipTarget.screenX=screen.x;n.clipTarget.screenY=screen.y;}const fraction=this.spacing*.6/Math.hypot(dx,dy);dx*=fraction;dy*=fraction;}
        for(const it of grab.items){const part=this.nodes[it.i];if(!part.active||part.pin||part.anchor)continue;part.x+=dx;part.y+=dy;part.z=Math.max(part.z,this.supportHeight(part.x,part.y)+(this.gelMode?this.gelDepth(part):0));part.px=part.x;part.py=part.y;part.pz=part.z;}}
      n.pin=true;n.customPin=true;n.z=Math.max(n.z,this.supportHeight(n.x,n.y)+(this.gelMode?this.gelDepth(n):0));n.ox=n.x;n.oy=n.y;
    }
    else if(drag.previous.customPin){Object.assign(n,drag.previous);}
    n.px=n.x;n.py=n.y;n.pz=n.z;return true;
  }
  cutPath(x1,y1,x2,y2,radius=3,immediate=false){
    if(!Number.isFinite(x1)||!Number.isFinite(y1)||!Number.isFinite(x2)||!Number.isFinite(y2))return 0;
    radius=Number.isFinite(radius)?Math.max(0,radius):3;
    if(this.gelMode)this.indentPath(x1,y1,x2,y2,radius);
    const minX=Math.min(x1,x2)-radius,maxX=Math.max(x1,x2)+radius,minY=Math.min(y1,y2)-radius,maxY=Math.max(y1,y2)+radius,r2=radius*radius,before=this.breakCount;
    for(const e of this.liveEdges){
      if(!e.alive)continue;const a=this.screenPoint(this.nodes[e.a]),b=this.screenPoint(this.nodes[e.b]);
      if(Math.max(a.x,b.x)<minX||Math.min(a.x,b.x)>maxX||Math.max(a.y,b.y)<minY||Math.min(a.y,b.y)>maxY)continue;
      if(segmentsTouch(x1,y1,x2,y2,a.x,a.y,b.x,b.y,r2)){
        if(this.gelMode&&!immediate){if(!this.pendingCuts.has(e.id))this.pendingCuts.set(e.id,this.time+.075);}
        else this.breakEdge(e.id,true);
      }
    }
    const count=this.breakCount-before;
    if(count){this.reconcile();if(!this.gelMode&&this.onBreak)this.onBreak(count,{x:(x1+x2)*.5,y:(y1+y2)*.5});}
    return count;
  }
  indentPath(x1,y1,x2,y2,radius=3){
    // The blade first compresses the surface; queued bonds sever after 75 ms.
    // The compression field is bounded, so repeated strokes cannot add unlimited energy.
    const reach=Math.max(this.spacing*1.35,radius+this.spacing*.7),dx=x2-x1,dy=y2-y1,length=Math.hypot(dx,dy),ux=length?dx/length:1,uy=length?dy/length:0;
    let touched=0;
    for(const n of this.nodes){if(!n.active||n.pin)continue;
      const distance=Math.sqrt(pointSegmentDistanceSq(this.screenPoint(n).x,this.screenPoint(n).y,x1,y1,x2,y2));if(distance>=reach)continue;
      const weight=1-distance/reach,old=n.groove||0,target=Math.min(1,old+weight*.7),amount=(target-old)*this.spacing;
      n.groove=target;n.grooveUX=ux;n.grooveUY=uy;
      const q=this.screenPoint(n),side=((q.x-x1)*(-uy)+(q.y-y1)*ux)>=0?1:-1;
      const displaced=this.worldPoint(q.x-uy*side*amount*.34,q.y+ux*side*amount*.34,n.z),origin=this.worldPoint(q.x,q.y,n.z),sx=displaced.x-origin.x,sy=displaced.y-origin.y;
      n.x+=sx;n.y+=sy;n.z-=amount*.55;
      // Carry previous positions with the tool: displacement without explosive velocity.
      n.px+=sx*.85;n.py+=sy*.85;n.pz-=amount*.48;touched++;
    }
    if(touched&&this.onManipulate)this.onManipulate({material:this.material,kind:'cut',intensity:Math.min(1,.25+length/(this.spacing*12)),x:x2,y:y2});
    return touched;
  }
  snipAt(x,y){return this.cutPath(x-8,y,x+8,y,2,true);}
  togglePinAt(x,y,radius=18){
    if(!(radius>0)||!Number.isFinite(radius)||!Number.isFinite(x)||!Number.isFinite(y))return false;
    // Scene anchors are permanent fixtures. The pin tool manages additional
    // attachments without silently taking down a curtain or frame.
    const best=this.nearestVisible(x,y,radius,n=>n.active&&!n.anchor&&!n.burnt);
    if(best<0)return false;
    const n=this.nodes[best];n.customPin=!n.customPin;n.pin=n.customPin;delete n.clipTarget;
    n.px=n.x;n.py=n.y;n.pz=n.z;
    if(n.pin){n.z=Math.max(n.z,this.supportHeight(n.x,n.y)+(this.gelMode?this.gelDepth(n):0));n.pz=n.z;n.ox=n.x;n.oy=n.y;}
    if(this.grab){this.grab.items=this.grab.items.filter(it=>!this.nodes[it.i].pin);this.grab.held=new Set(this.grab.items.map(it=>it.i));if(!this.grab.items.length)this.release();else this.refreshGrabSupport();}
    return true;
  }
  hookAt(x,y,radius=14){
    if(!(radius>0)||!Number.isFinite(radius)||!Number.isFinite(x)||!Number.isFinite(y))return false;
    const best=this.nearestVisible(x,y,radius,n=>n.active&&!n.pin&&!n.burnt);
    if(best<0)return false;
    const n=this.nodes[best],world=this.worldPoint(x,y,n.z);x=world.x;y=world.y;const items=[{i:best,dx:n.x-x,dy:n.y-y,dz:0}];
    this.grab={x,y,z:n.z,startZ:n.z,tx:x,ty:y,radius,startX:x,startY:y,items,held:new Set([best]),kind:'hook',seed:best};this.refreshGrabSupport();return true;
  }
  heatAt(x,y,radius=25,dt=1/60){
    if(!(radius>0)||!Number.isFinite(radius)||!(dt>0)||!Number.isFinite(dt)||!Number.isFinite(x)||!Number.isFinite(y))return 0;
    const r2=radius*radius,amount=Math.min(dt,.1)*5;let count=0;
    for(const n of this.nodes){if(!n.active||n.burnt)continue;const q=this.screenPoint(n),dx=q.x-x,dy=q.y-y,d2=dx*dx+dy*dy;if(d2<r2){n.heat=Math.min(1,n.heat+amount*(1-Math.sqrt(d2)/radius));count++;}}
    return count;
  }
  updateEffects(dt=1/60){
    // Separate from step() so callers can budget the effects at a fixed rate.
    // Reuse one node-sized buffer: no adjacency graphs or particle arrays per frame.
    if(!(dt>0)||!Number.isFinite(dt))return 0;dt=Math.min(dt,1/30);
    let heated=false;
    for(const n of this.nodes){if(!n.active||n.burnt)n.heat=0;else if(n.heat>0)heated=true;}
    if(!heated)return 0;
    const delta=this.heatDelta,spread=this.burnProfile.spread;delta.fill(0);
    for(const e of this.liveEdges){
      if(!e.alive)continue;const a=this.nodes[e.a],b=this.nodes[e.b];
      if(!a.active||!b.active||a.burnt||b.burnt)continue;
      const flow=(a.heat-b.heat)*spread*dt;delta[e.a]-=flow;delta[e.b]+=flow;
    }
    if(this.chainMode||this.gelMode){
      // Game heat deformation: metals and gels cool rather than self-ignite.
      // char is only a bounded local visual stain; no organic burn-away.
      for(let i=0;i<this.nodes.length;i++){const n=this.nodes[i];if(!n.active)continue;
        n.heat=Math.max(0,Math.min(1,n.heat+delta[i])-dt*(this.chainMode?.22:.34));
        n.char=Math.min(this.chainMode?.35:.22,Math.max(0,n.char+dt*(n.heat>.65?.025:-.008)));
      }
      return 0;
    }
    let burnt=0;
    for(let i=0;i<this.nodes.length;i++){
      const n=this.nodes[i];if(!n.active||n.burnt)continue;
      let heat=Math.max(0,Math.min(1,n.heat+delta[i]));
      // Combustion sustains a lit patch; isolated, insufficiently heated
      // fibers cool down. Cutting can therefore isolate a burning fragment.
      if(heat>.26){heat=Math.min(1,heat+dt*2.5);n.char=Math.min(1,n.char+dt*this.burnProfile.rate*(.25+.75*heat));}
      else heat=Math.max(0,heat-dt*.2);
      n.heat=heat;
      if(n.char>=1){n.burnt=true;n.heat=0;burnt++;}
    }
    if(burnt){
      const before=this.breakCount;
      // A consumed node loses every incident rope/constraint and face. An
      // orange overlay can never leave an invisible, still-connected sheet.
      for(const e of this.liveEdges)if(e.alive&&(this.nodes[e.a].burnt||this.nodes[e.b].burnt))this.breakEdge(e.id,true);
      this.reconcile();if(this.onBreak&&this.breakCount>before)this.onBreak(this.breakCount-before,null);
    }
    return burnt;
  }
  extinguish(){for(const n of this.nodes)n.heat=0;this.heatDelta.fill(0);}
  paintAt(x,y,radius=25,rgb=[255,255,255],dt=1/60){
    if(!(radius>0)||!Number.isFinite(radius)||!(dt>0)||!Number.isFinite(dt)||!Number.isFinite(x)||!Number.isFinite(y)||!rgb)return 0;
    const r=Number(rgb.r===undefined?rgb[0]:rgb.r),g=Number(rgb.g===undefined?rgb[1]:rgb.g),b=Number(rgb.b===undefined?rgb[2]:rgb.b);
    if(!Number.isFinite(r)||!Number.isFinite(g)||!Number.isFinite(b))return 0;
    const red=Math.max(0,Math.min(255,r)),green=Math.max(0,Math.min(255,g)),blue=Math.max(0,Math.min(255,b)),r2=radius*radius;let count=0;
    for(const n of this.nodes){
      if(!n.active||n.burnt)continue;const q=this.screenPoint(n),dx=q.x-x,dy=q.y-y,d2=dx*dx+dy*dy;if(d2>=r2)continue;
      const falloff=1-Math.sqrt(d2)/radius,a=1-Math.exp(-Math.min(dt,.1)*14*falloff),old=n.paintA*(1-a),alpha=old+a;
      if(!alpha)continue;
      n.paintR=(n.paintR*old+red*a)/alpha;n.paintG=(n.paintG*old+green*a)/alpha;n.paintB=(n.paintB*old+blue*a)/alpha;n.paintA=alpha;count++;
    }
    return count;
  }
  clearPaint(){for(const n of this.nodes)n.paintA=0;}
  grabAt(x,y,radius=23){
    const best=this.nearestVisible(x,y,radius,n=>n.active&&!n.pin);
    if(best<0)return false;
    const center=this.nodes[best],world=this.worldPoint(x,y,center.z);x=world.x;y=world.y;const items=[];
    // Connected local patch only: the hand never welds already torn pieces together.
    const candidates=new Set([best]);for(let ring=0;ring<3;ring++)for(const e of this.edges)if(e.alive){if(candidates.has(e.a)&&Math.hypot(this.nodes[e.b].x-center.x,this.nodes[e.b].y-center.y)<radius)candidates.add(e.b);if(candidates.has(e.b)&&Math.hypot(this.nodes[e.a].x-center.x,this.nodes[e.a].y-center.y)<radius)candidates.add(e.a);}
    for(const i of candidates){const n=this.nodes[i];if(!n.pin&&Math.hypot(n.x-center.x,n.y-center.y)<radius*.94)items.push({i,dx:n.x-x,dy:n.y-y,dz:n.z-center.z});}
    this.grab={x,y,z:center.z,startZ:center.z,tx:x,ty:y,radius,startX:x,startY:y,items,held:new Set(items.map(it=>it.i)),seed:best};this.refreshGrabSupport();return true;
  }
  refreshGrabSupport(){
    const g=this.grab;if(!g)return;
    // Only free-support scenes change semantics. Hanging cloth and gels retain
    // their existing deformation/fracture laws.
    g.freeCarry=false;
    if(!this.supportComponents||g.kind==='clip')return;
    const component=this.supportComponents[this.supportComponentOf[g.seed]];
    if(!component||!this.nodes[g.seed]?.active){this.release();return;}
    g.component=component;
    // A cut can split the handful itself. Keep only the piece originally picked.
    if(g.items.some(it=>this.supportComponentOf[it.i]!==this.supportComponentOf[g.seed]||this.nodes[it.i].pin)){
      g.items=g.items.filter(it=>this.supportComponentOf[it.i]===this.supportComponentOf[g.seed]&&!this.nodes[it.i].pin);
      g.held=new Set(g.items.map(it=>it.i));
    }
    if(!g.items.length){this.release();return;}
    g.freeCarry=!component.some(i=>this.nodes[i].pin||this.nodes[i].anchor);
  }
  moveGrab(x,y){if(this.grab&&Number.isFinite(x)&&Number.isFinite(y)){const g=this.grab;if(this.unprojectPoint){g.pointerSX=x;g.pointerSY=y;}const world=this.worldPoint(x,y,g.z);x=world.x;y=world.y;g.tx=x;g.ty=y;
    // A loaded or freshly cut neck must not rupture merely because it is
    // selected. Arm slime tension only after deliberate pointer excursion,
    // not solver motion, a depth transient, or accumulated subpixel jitter.
    if(this.gelMode==='slime'&&Math.hypot(x-g.startX,y-g.startY)>Math.max(4,this.spacing*.5))g.pullIntent=true;
  }}
  carryFreePiece(g,x=g.x,y=g.y){
    // Translate the connected mass, never a frozen rest-shape snapshot. Move
    // previous positions too: carrying must not turn into a release impulse.
    // Only depth is held locally by the solver, so the piece can sag and fold.
    let cx=0,cy=0;for(const it of g.items){const n=this.nodes[it.i];cx+=n.x-it.dx;cy+=n.y-it.dy;}
    cx/=g.items.length;cy/=g.items.length;
    const target=this.boundedTarget(x,y),dx=target.x-cx,dy=target.y-cy,d=Math.hypot(dx,dy),fraction=Math.min(.65,this.spacing*.7/(d||1));
    for(const i of g.component){const n=this.nodes[i];n.x+=dx*fraction;n.px+=dx*fraction;n.y+=dy*fraction;n.py+=dy*fraction;}
  }
  release(){
    if(this.clipDrag)this.finishClipDrag(false);
    const g=this.grab;
    // Coalesced move + release may precede the next physics tick. Consume only
    // one bounded carry increment, not the whole queued swipe or an impulse.
    if(g?.freeCarry&&g.items.length&&g.component.every(i=>this.nodes[i].active&&!this.nodes[i].pin&&!this.nodes[i].anchor)){
      this.carryFreePiece(g,g.tx,g.ty);this.projectSupport();this.containSupport();
    }
    this.grab=null;
  }
  breakEdge(id,skipFray=false){const e=this.edges[id];if(!e||!e.alive)return;e.alive=false;e.brokenAt=this.time;this.breakCount++;if(this.stockingMode&&!e.shear){const a=this.nodes[e.a],b=this.nodes[e.b];const column=Math.min(a.i,b.i);for(const q of this.edges)if(q.knitAxis==='wale'&&q.alive&&Math.abs(this.nodes[q.a].i-column)<=0&&Math.abs(Math.min(this.nodes[q.a].j,this.nodes[q.b].j)-Math.min(a.j,b.j))<=1)this.ladderFronts.add(q.id);}for(const f of e.faces){this.faces[f].alive=false;if(this.gelMode){this.faces[f].brokenAt=this.time;this.faces[f].healProgress=0;}}
    if(this.gelMode){
      // Remove auxiliary diagonal constraints with their last visible face immediately.
      for(const fi of e.faces)for(const ei of this.faces[fi].edges){const other=this.edges[ei];if(other.alive&&!other.faces.some(f=>this.faces[f].alive)){other.alive=false;other.brokenAt=this.time;}}
      const a=this.nodes[e.a],b=this.nodes[e.b],d=Math.hypot(b.x-a.x,b.y-a.y)||1,k=this.gelMode==='jelly'?.38:.14;
      if(!a.pin){a.px+=(b.x-a.x)/d*k;a.py+=(b.y-a.y)/d*k;}
      if(!b.pin){b.px-=(b.x-a.x)/d*k;b.py-=(b.y-a.y)/d*k;}
    }
    // Cross-yarns unzip in a grid-aligned front. Vertical yarns remain real,
    // movable strands, not painted whiskers or invisible orphan springs.
    if(!skipFray&&this.yarnMode&&!this.knotted&&!this.chainMode&&!this.stockingMode&&e.cross){const a=this.nodes[e.a],b=this.nodes[e.b];for(const n of this.liveEdges)if(n.alive&&n.cross&&!n.reinforced){const x=this.nodes[n.a],y=this.nodes[n.b];if(Math.min(x.i,y.i)===Math.min(a.i,b.i)&&Math.abs(x.j-a.j)===1)n.damage+=.32;}}
  }
  reconcile(){
    // A constraint exists only where a rendered triangle still contains it.
    const active=this.activeMask;active.fill(0);
    for(const e of this.edges)if(e.alive&&!e.yarn&&!e.faces.some(f=>this.faces[f].alive))e.alive=false;
    for(const f of this.faces)if(f.alive)for(const i of f.nodes)active[i]=1;
    if(this.yarnMode)for(const e of this.edges)if(e.alive&&e.yarn){active[e.a]=1;active[e.b]=1;}
    this.nodes.forEach((n,i)=>{n.active=!!active[i];if(!n.active||n.burnt)n.heat=0;});
    this.liveEdges=this.edges.filter(e=>e.alive);this.liveFaces=this.faces.filter(f=>f.alive);
    if(this.environment&&this.environment.type!=='flag'){
      // Cache topology only when it changes, not during pointer moves or solver
      // iterations. Pins are checked live, so adding/removing one needs no graph.
      const links=this.nodes.map(()=>[]),componentOf=new Int32Array(this.nodes.length);componentOf.fill(-1);
      this.supportComponents=[];this.supportComponentOf=componentOf;
      for(const e of this.liveEdges){links[e.a].push(e.b);links[e.b].push(e.a);}
      for(let i=0;i<this.nodes.length;i++)if(this.nodes[i].active&&componentOf[i]<0){
        const ids=[i],id=this.supportComponents.length;componentOf[i]=id;
        for(let q=0;q<ids.length;q++)for(const next of links[ids[q]])if(componentOf[next]<0&&this.nodes[next].active){componentOf[next]=id;ids.push(next);}
        this.supportComponents.push(ids);
      }
    }
    this.liveRings=[];
    if(this.chainMode){const rings=this.nodes.map((n,node)=>({node,edges:[],open:false}));
      for(const e of this.edges)if(e.yarn){if(e.alive){rings[e.a].edges.push(e.id);rings[e.b].edges.push(e.id);}else{rings[e.a].open=true;rings[e.b].open=true;}}
      this.liveRings=rings.filter(r=>r.edges.length);
    }
    this.liveKnots=[];
    // Historical field names horizontal/vertical now group the two diagonal
    // rope families in a fishing net, not screen-space horizontal/vertical.
    if(this.knotted){const joins=this.nodes.map((n,node)=>({node,horizontal:[],vertical:[]}));for(const e of this.liveEdges)if(e.yarn){const axis=e.cross?'horizontal':'vertical';joins[e.a][axis].push(e.id);joins[e.b][axis].push(e.id);}this.liveKnots=joins.filter(k=>k.horizontal.length&&k.vertical.length);}
    this.boundaryEdges=this.liveEdges.filter(e=>e.faces.reduce((n,f)=>n+Number(this.faces[f].alive),0)===1);
    if(this.grab){this.grab.items=this.grab.items.filter(g=>this.nodes[g.i].active);if(this.gelMode)this.grab.held=new Set(this.grab.items.map(g=>g.i));if(!this.grab.items.length)this.release();}
    this.refreshGrabSupport();
    if(this.gelMode){
      // Fixed mesh connectivity: rebuild only after a cut or a completed local weld.
      const links=this.nodes.map(()=>[]),seen=new Uint8Array(this.nodes.length);this.gelComponents=[];
      for(const e of this.liveEdges){links[e.a].push(e.b);links[e.b].push(e.a);}
      for(let i=0;i<this.nodes.length;i++)if(this.nodes[i].active&&!seen[i]){const ids=[i];seen[i]=1;for(let q=0;q<ids.length;q++)for(const j of links[ids[q]])if(!seen[j]){seen[j]=1;ids.push(j);}this.gelComponents.push(ids);}
    }
  }
  advanceLadders(dt){
    let broken=0;for(const id of this.ladderFronts){const e=this.edges[id];if(!e.alive||e.reinforced){this.ladderFronts.delete(id);continue;}
      // An unsupported stocking piece has no opposing attachment to run against.
      if(this.supportComponents&&!this.supportComponents[this.supportComponentOf[e.a]]?.some(i=>this.nodes[i].pin||this.nodes[i].anchor)){e.runProgress=0;continue;}
      const a=this.nodes[e.a],b=this.nodes[e.b];let strain=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)/e.rest;for(const fi of e.faces)for(const id of this.faces[fi].edges){const course=this.edges[id];if(course.alive&&course.knitAxis==='course'){const u=this.nodes[course.a],v=this.nodes[course.b];strain=Math.max(strain,1+(Math.hypot(u.x-v.x,u.y-v.y,u.z-v.z)/course.rest-1)*.18);}}
      e.runProgress=strain>1.004?(e.runProgress||0)+dt*Math.min(4,(strain-1)*100):0;
      if(e.runProgress>.1&&broken<1){this.ladderFronts.delete(id);e.ladder=true;this.breakEdge(id,true);this.ladderCount++;broken++;break;}}
  }
  solveGelArea(){
    // Local triangle area resists a gel collapsing into a rope. This is a
    // bounded membrane-volume approximation, not global rigid shape matching:
    // severed faces contribute no forces and free fragments remain independent.
    for(const f of this.liveFaces){if(!f.alive)continue;const a=this.nodes[f.nodes[0]],b=this.nodes[f.nodes[1]],c=this.nodes[f.nodes[2]];
      const ux=b.x-a.x,uy=b.y-a.y,uz=b.z-a.z,vx=c.x-a.x,vy=c.y-a.y,vz=c.z-a.z;
      let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const length=Math.hypot(nx,ny,nz);if(length<1e-7)continue;nx/=length;ny/=length;nz/=length;
      const area=length*.5,target=f.restArea,ratio=area/target;
      if(ratio>.75&&ratio<1.45)continue;
      const gradients=[[ny*(b.z-c.z)-nz*(b.y-c.y),nz*(b.x-c.x)-nx*(b.z-c.z),nx*(b.y-c.y)-ny*(b.x-c.x)],[ny*(c.z-a.z)-nz*(c.y-a.y),nz*(c.x-a.x)-nx*(c.z-a.z),nx*(c.y-a.y)-ny*(c.x-a.x)],[ny*(a.z-b.z)-nz*(a.y-b.y),nz*(a.x-b.x)-nx*(a.z-b.z),nx*(a.y-b.y)-ny*(a.x-b.x)]];
      const nodes=[a,b,c];let denom=0;for(let i=0;i<3;i++)if(!nodes[i].pin)denom+=gradients[i].reduce((sum,v)=>sum+v*v,0)*.25;if(denom<1e-8)continue;
      const desired=target*(ratio<.75?.75:1.45),lambda=(area-desired)/denom*(this.gelMode==='jelly'?.16:.055);
      for(let i=0;i<3;i++){const n=nodes[i];if(n.pin)continue;const q=gradients[i],amount=Math.min(1,this.spacing*.12/(Math.hypot(...q)*Math.abs(lambda)*.5||1));n.x+=q[0]*lambda*.5*amount;n.y+=q[1]*lambda*.5*amount;n.z+=q[2]*lambda*.5*amount;}
    }
  }
  updateGelThickness(dt){
    if(!this.gelMode||!(dt>0)||!Number.isFinite(dt))return;
    dt=Math.min(dt,1/30);
    // A bounded local membrane-depth model, not a fluid or exact conservation
    // law. Surface dilation must thin a biaxial pull more than one stretched
    // edge. Only surviving faces contribute; cuts cannot bridge the estimate.
    const count=this.nodes.length;
    if(!this.gelAreaSum){this.gelAreaSum=new Float32Array(count);this.gelRestAreaSum=new Float32Array(count);this.gelStretchSum=new Float32Array(count);this.gelStretchWeight=new Float32Array(count);}
    const areas=this.gelAreaSum,rests=this.gelRestAreaSum,stretch=this.gelStretchSum,weights=this.gelStretchWeight;
    areas.fill(0);rests.fill(0);stretch.fill(0);weights.fill(0);
    for(const f of this.liveFaces){if(!f.alive)continue;
      const a=this.nodes[f.nodes[0]],b=this.nodes[f.nodes[1]],c=this.nodes[f.nodes[2]];
      const ux=b.x-a.x,uy=b.y-a.y,uz=b.z-a.z,vx=c.x-a.x,vy=c.y-a.y,vz=c.z-a.z;
      const area=.5*Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx);
      for(const id of f.nodes){areas[id]+=area;rests[id]+=f.restArea;}
    }
    for(const e of this.liveEdges){if(!e.alive||e.shear)continue;
      const a=this.nodes[e.a],b=this.nodes[e.b];
      // The existing yielding rest lengths retain real local slime strain
      // after release. Do not reset depth merely because the hand disappeared.
      const measured=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)/e.rest;
      const retained=this.gelMode==='slime'?e.softRest/e.rest:1;
      const value=Math.max(1,measured,retained);
      stretch[e.a]+=value;stretch[e.b]+=value;weights[e.a]++;weights[e.b]++;
    }
    for(let i=0;i<count;i++){const n=this.nodes[i];if(!n.active||!rests[i])continue;
      const dilation=Math.max(1,areas[i]/rests[i],weights[i]?stretch[i]/weights[i]:1);
      const target=Math.max(.16,1/dilation),oldDepth=this.gelDepth(n);
      // Fast response under load; jelly springs back quickly with its actual
      // geometry, while slime follows its slow retained local deformation.
      const rate=target<n.thickness?20:this.gelMode==='jelly'?14:2.2;
      n.thickness+=(target-n.thickness)*(1-Math.exp(-dt*rate));
      const floor=this.supportHeight(n.x,n.y);
      // A clip applied to a thin patch fixes its top position. Recovery cannot
      // push its underside through the tray; unpinning releases this clamp.
      if(n.pin&&Number.isFinite(floor)&&n.bodyDepth>0)n.thickness=Math.min(n.thickness,Math.max(0,(n.z-floor)/n.bodyDepth));
      if(!n.pin&&Number.isFinite(floor)&&n.z<=floor+oldDepth+1){
        // Preserve bottom clearance and Verlet velocity when a resting patch
        // changes depth. Otherwise shrinking only the rim leaves it hovering.
        const shift=this.gelDepth(n)-oldDepth;n.z+=shift;n.pz+=shift;
      }
    }
    this.projectSupport();
  }
  supportGel(){
    const floor=this.gelFloor,bounds=this.gelBounds||{},left=bounds.minX??bounds.left,right=bounds.maxX??bounds.right;
    for(const ids of this.gelComponents){
      if(ids.some(i=>this.nodes[i].pin))continue;
      let bottom=-Infinity,minX=Infinity,maxX=-Infinity;for(const i of ids){const n=this.nodes[i];bottom=Math.max(bottom,n.y);minX=Math.min(minX,n.x);maxX=Math.max(maxX,n.x);}
      const lift=Number.isFinite(floor)?Math.max(0,bottom-floor):0;
      let shift=Number.isFinite(left)?Math.max(0,left-minX):0;if(Number.isFinite(right)&&maxX+shift>right)shift+=right-maxX-shift;
      if(lift||shift)for(const i of ids){const n=this.nodes[i],vx=n.x-n.px,vy=n.y-n.py;n.x+=shift;n.y-=lift;n.px=n.x-vx*(lift?.89:.2);n.py=n.y-(lift&&vy>0?-vy*.12:vy*.88);}
    }
  }
  healGel(dt){
    if(this.gelMode!=='slime')return;
    let healed=0;
    // O(original face count), no all-pairs search or unbounded generated topology.
    // Only original matching seams can weld; no spring exists until real contact.
    for(const f of this.faces){
      if(f.alive||this.time-(f.brokenAt||0)<.35||f.nodes.some(i=>!this.nodes[i].active)){f.healProgress=0;continue;}
      let contact=false,safe=true;
      for(const id of f.edges){const e=this.edges[id],a=this.nodes[e.a],b=this.nodes[e.b],d=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
        if(d>e.rest*1.35)safe=false;
        if((!e.alive&&!e.shear&&d<e.rest*.55)||(e.alive&&e.weldedAt!==undefined&&this.time-e.weldedAt<2.5&&d<e.rest*.85))contact=true;
        if(e.alive&&e.faces.filter(fi=>this.faces[fi].alive).length===1){
          // Contact is with the continuous cut rim, not one exact lattice
          // vertex: a slightly sideways hand placement must still fuse.
          const n=this.nodes[f.nodes.find(i=>i!==e.a&&i!==e.b)],ux=b.x-a.x,uy=b.y-a.y,uz=b.z-a.z;
          const t=Math.max(0,Math.min(1,((n.x-a.x)*ux+(n.y-a.y)*uy+(n.z-a.z)*uz)/(d*d||1)));
          if(Math.hypot(n.x-a.x-t*ux,n.y-a.y-t*uy,n.z-a.z-t*uz)<this.spacing*.45)contact=true;
        }
      }
      f.healProgress=safe&&contact?(f.healProgress||0)+dt/.72:0;
      if(f.healProgress<1)continue;
      f.alive=true;f.healProgress=0;healed++;
      for(const id of f.edges){const e=this.edges[id];if(!e.alive){const a=this.nodes[e.a],b=this.nodes[e.b];e.alive=true;e.damage=0;e.weldRest=Math.max(e.rest*.18,Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z));e.softRest=e.weldRest;e.weldedAt=this.time;}}
    }
    if(healed){this.healedCount+=healed;this.reconcile();}
  }
  step(dt=1/60){
    if(!(dt>0)||!Number.isFinite(dt))return;dt=Math.min(dt,1/30);this.time+=dt;this.stepCount++;const before=this.breakCount;
    for(const n of this.nodes)if(n.clipTarget&&n.pin&&n.active){if(this.unprojectPoint&&Number.isFinite(n.clipTarget.screenX)){const world=this.worldPoint(n.clipTarget.screenX,n.clipTarget.screenY,n.z),target=this.boundedTarget(world.x,world.y);n.clipTarget.x=target.x;n.clipTarget.y=target.y;}const dx=n.clipTarget.x-n.x,dy=n.clipTarget.y-n.y,d=Math.hypot(dx,dy),fraction=Math.min(1,this.spacing*.6/(d||1));n.x+=dx*fraction;n.y+=dy*fraction;n.z=Math.max(n.z,this.supportHeight(n.x,n.y)+(this.gelMode?this.gelDepth(n):0));n.px=n.ox=n.x;n.py=n.oy=n.y;n.pz=n.z;if(fraction===1)delete n.clipTarget;}
    if(this.gelMode)for(const [id,ready] of this.pendingCuts)if(this.time>=ready){this.breakEdge(id,true);this.pendingCuts.delete(id);}
    if(this.gelMode&&this.breakCount>before)this.reconcile();
    this.refreshGrabSupport();
    if(this.stockingMode)this.advanceLadders(dt);
    const scale=this.width/400,p=this.profile;
    for(const n of this.nodes){
      if(this.gelMode)n.groove=(n.groove||0)*Math.exp(-dt*(this.gelMode==='jelly'?3.8:1.45));
      if(!n.active||n.pin)continue;
      let vx=(n.x-n.px)*p.damping,vy=(n.y-n.py)*p.damping,vz=(n.z-n.pz)*p.depthDamping;const velocity=Math.hypot(vx,vy,vz),maxStep=this.spacing*2;if(this.environment&&this.environment.type!=='flag'&&velocity>maxStep){const limit=maxStep/velocity;vx*=limit;vy*=limit;vz*=limit;}
      n.px=n.x;n.py=n.y;n.pz=n.z;
      const env=this.environment;
      if(env&&env.type!=='flag'){
        const contact=n.z<=this.supportHeight(n.x,n.y)+(this.gelMode?this.gelDepth(n):0)+1,friction=contact?(this.chainMode?.92:this.gelMode==='slime'?.72:this.gelMode==='jelly'?.83:.86):1;
        n.x+=vx*friction;n.y+=vy*friction;
        // Gravity is normal to a tabletop, and has a downhill component on
        // a sloped support. Sphere projection converts falling depth to drape.
        if(env.type==='slope'&&contact)n.y+=p.gravity*scale*env.slope/(1+env.slope*env.slope)*dt*dt;
        n.z+=vz-p.gravity*scale*dt*dt;
      }else if(env){
        const free=n.i/this.cols,massResponse=this.chainMode?.18:this.gelMode?.34:1,wave=Math.sin(this.time*3.1-n.i*.18+n.j*.08),wind=env.wind;
        n.x+=vx+(140+wave*24)*scale*wind*massResponse*dt*dt;
        n.y+=vy+(p.gravity*(this.chainMode||this.gelMode?.65:.12)+Math.sin(this.time*2.4-n.i*.14)*18*wind*massResponse)*scale*dt*dt;
        n.z+=vz+wave*290*scale*wind*massResponse*(.15+.85*free)*dt*dt;
      }else{
        n.x+=vx;n.y+=vy+p.gravity*scale*dt*dt;
        // A light breeze excites actual depth displacement, not a painted wave.
        n.z+=vz+Math.sin(this.time*1.7+n.i*.23+n.j*.16)*9*scale*dt*dt;
      }
    }
    const g=this.grab;
    if(g&&this.unprojectPoint&&Number.isFinite(g.pointerSX)){const target=this.worldPoint(g.pointerSX,g.pointerSY,g.z);g.tx=target.x;g.ty=target.y;}
    if(g&&g.freeCarry){const target=this.boundedTarget(g.tx,g.ty);g.tx=target.x;g.ty=target.y;}
    if(g){const dx=g.tx-g.x,dy=g.ty-g.y,d=Math.hypot(dx,dy),s=Math.min(1,22*scale/(d||1));g.x+=dx*s;g.y+=dy*s;if(this.gelMode){g.speed=d*s/dt;
      // A detached piece follows the hand as a mass, rather than plucking a
      // tiny plug from a stationary free body. Remaining lag still deforms it.
      const piece=this.gelComponents.find(ids=>ids.includes(g.items[0]?.i));
      if(!g.freeCarry&&piece&&!piece.some(i=>this.nodes[i].pin)){const carry=this.gelMode==='jelly'?.84:.68;for(const i of piece){const n=this.nodes[i];n.x+=dx*s*carry;n.px+=dx*s*carry;n.y+=dy*s*carry;n.py+=dy*s*carry;}}
    }if(this.gelMode&&d*s>.02&&this.onManipulate)this.onManipulate({material:this.material,kind:g.kind==='hook'?'hook':'drag',intensity:Math.min(1,d*s/(this.spacing*.8)),x:g.x,y:g.y});const excursion=Math.hypot(g.x-g.startX,g.y-g.startY);
      // Preserve contact depth on a click; blend back to the established drag
      // lift over two mesh cells so long-pull/release behavior stays unchanged.
      const contactDepth=this.gelMode==='slime'?g.startZ*Math.max(0,1-excursion/(this.spacing*2)):0;
      const support=this.supportHeight(g.x,g.y)+(this.gelMode?this.gelDepth(this.nodes[g.items[0]?.i]):0);g.z+=((Number.isFinite(support)?Math.max(contactDepth,support):contactDepth)+Math.min(30*scale,excursion*.12)-g.z)*.08;}
    if(g&&g.freeCarry)this.carryFreePiece(g);
    let chainLoad=0,chainX=0,chainY=0;
    if(this.chainMode&&g&&g.items.length){for(const it of g.items){chainX+=this.nodes[it.i].x;chainY+=this.nodes[it.i].y;}
      chainX/=g.items.length;chainY/=g.items.length;chainLoad=Math.hypot(g.x-chainX,g.y-chainY)/this.spacing;
    }
    for(let iter=0;iter<(this.chainMode?12:8);iter++){
      if(g&&(!this.chainMode||iter===0))for(const it of g.items){const n=this.nodes[it.i];if(n.active&&!n.pin){if(!g.freeCarry){n.x+=(g.x+it.dx-n.x)*(this.chainMode?.05:.36);n.y+=(g.y+it.dy-n.y)*(this.chainMode?.05:.36);}n.z+=(g.z+it.dz-n.z)*(this.chainMode?.15:.24);}}
      // Reverse traversal each pass to avoid directional solver bias.
      for(let k=0;k<this.liveEdges.length;k++){
        const e=this.liveEdges[iter%2?this.liveEdges.length-1-k:k];if(!e.alive)continue;
        const a=this.nodes[e.a],b=this.nodes[e.b],dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,d=Math.sqrt(dx*dx+dy*dy+dz*dz)||.001,strain=d/e.rest;
        // Most solver links never need a hand-distance test; compare squared
        // distances only when the link is under enough tension to damage.
        let local=false,insideHand=false;
        if(g&&!g.freeCarry&&(this.viscoelastic||this.gelMode||this.chainMode||strain>p.damageStart||e.damage>p.fatigue)){
          const hx=(a.x+b.x)*.5-(this.chainMode?chainX:g.x),hy=(a.y+b.y)*.5-(this.chainMode?chainY:g.y);
          const range=this.chainMode?this.spacing*2.5:Math.max(g.radius*3.6,this.spacing*5);
          local=hx*hx+hy*hy<range*range&&(!this.supportComponentOf||g.kind==='clip'||this.supportComponentOf[e.a]===this.supportComponentOf[g.seed]);
          if(local)insideHand=(this.viscoelastic||this.gelMode||this.chainMode)?(g.held.has(e.a)&&g.held.has(e.b)):(g.held.has(e.a)||g.held.has(e.b));
        }
        if(this.viscoelastic&&!e.reinforced){
          // A fiber mat has a yielding rest shape and delayed recovery. The
          // hand draws out a neck before bonds fail, unlike inextensible yarn.
          if(iter===0){const target=g&&local?Math.min(e.rest*1.8,Math.max(e.rest,d*.84)):e.rest;
            e.softRest+=(target-e.softRest)*Math.min(1,dt*(g&&local?3.8:.48));}
        }
        if(this.gelMode==='slime'&&!e.reinforced&&iter===0){
          const target=g&&local?Math.min(e.rest*3.4,Math.max(e.rest,d*.93)):e.rest;
          e.softRest+=(target-e.softRest)*Math.min(1,dt*(g&&local?(g.speed>this.spacing*25?.7:4.4):.16));
        }
        if(iter===0&&!this.gelMode){
          const damageStart=this.viscoelastic?1.95:p.damageStart;
          const rate=this.viscoelastic?1.7:p.damageRate*(this.yarnMode&&!this.knotted&&!this.chainMode?(e.cross?1.5:.16):1);
          e.damage=Math.max(0,e.damage+(local&&!insideHand?(this.chainMode?(Math.max(0,strain-damageStart)*rate+Math.max(0,chainLoad-7)*.16)*dt:Math.max(0,strain-damageStart)*dt*rate):0)-dt*.08);
        }
        const tear=this.stockingMode?(e.cross?4.4:2.2):this.chainMode?p.tear:this.knotted?p.tear:this.yarnMode?(e.cross?1.38:2.65):this.viscoelastic?3.8:p.tear*(e.cross?(p.crossTear||1):1);
        const fatigue=this.stockingMode?1.2:this.chainMode?p.fatigue:this.knotted?p.fatigue:this.viscoelastic?.42:this.yarnMode?(e.cross?.38:1.8):p.fatigue;
        if(this.gelMode&&iter===0&&!e.reinforced&&!insideHand&&local&&this.breakCount-before<12){
          const fast=Math.min(1,(g.speed||0)/(this.spacing*40)),limit=this.gelMode==='jelly'?4.2:4.8-fast*3.05;
          const load=this.gelMode==='slime'?d/e.softRest:strain;
          if(load>limit&&(this.gelMode!=='slime'||g.pullIntent)){this.breakEdge(e.id,true);continue;}
        }
        // Original cloth thresholds are independent of the gel fracture law.
        const budget=this.viscoelastic?(this.stepCount%5===0?1:0):this.yarnMode?1:2;
        if(!this.gelMode&&!e.reinforced&&!e.shear&&!insideHand&&local&&this.breakCount-before<budget&&(strain>tear||e.damage>fatigue)){this.breakEdge(e.id);continue;}
        // Felt's low initial tensile stiffness allows visible extension;
        // strain stiffening prevents an unlimited rubber-band explosion.
        let stiffness=e.shear?p.shear:(strain<1?p.compression:p.stretch),rest=e.rest;
        if(this.viscoelastic&&!e.reinforced){rest=e.softRest;const relative=d/rest;
          // Yield only under the hand's local load; ordinary gravity must not
          // stretch an untouched sheet offscreen. Residual length recovers slowly.
          if(g&&local)stiffness=e.shear?.012:relative<1?.12:.016+Math.min(.5,Math.max(0,relative-1.45)*.22);}
        if(this.gelMode&&!e.reinforced){
          const warmth=(a.heat+b.heat)*.5;
          if(this.gelMode==='slime'){
            rest=e.softRest;const relative=d/rest;
            if(g&&local)stiffness=e.shear?.018:relative<1?.11:.012+Math.min(.48,Math.max(0,relative-1.9)*.24);
            else stiffness=e.shear?.035:.16;
          }else if(g&&local){
            stiffness=e.shear?.025:strain<1?.15:.035+Math.min(.55,Math.max(0,strain-1.75)*.22);
          }
          stiffness*=1-warmth*.45;
        }
        if(this.gelMode&&e.weldRest){
          if(iter===0)e.weldRest+=(e.rest-e.weldRest)*dt*.32;
          rest=e.weldRest;stiffness*=Math.min(1,.15+(this.time-e.weldedAt)*.5);
        }
        if(this.chainMode&&!e.shear)stiffness*=1-(a.heat+b.heat)*.045;
        if(this.yarnMode&&e.shear)stiffness=.003;
        if(this.stockingMode&&!e.shear){stiffness=strain<1?.065:e.cross?.045+Math.min(.55,Math.max(0,strain-2.1)*.35):.68;}
        const correction=(d-rest)/d*stiffness;
        const wa=a.pin?0:1,wb=b.pin?0:1,sum=wa+wb;if(!sum)continue;
        a.x+=dx*correction*wa/sum;a.y+=dy*correction*wa/sum;a.z+=dz*correction*wa/sum;
        b.x-=dx*correction*wb/sum;b.y-=dy*correction*wb/sum;b.z-=dz*correction*wb/sum;
      }
      if(this.gelMode&&this.environment&&this.environment.type!=='flag'&&iter%2===1)this.solveGelArea();
      this.projectSupport();
      // Pinned vertices have zero solver weight and are never integrated.
    }
    if(this.gelMode)this.updateGelThickness(dt);
    if(this.breakCount>before){this.reconcile();if(!this.gelMode&&this.onBreak)this.onBreak(this.breakCount-before,g?{x:g.x,y:g.y}:null);}
    if(this.environment&&this.environment.type!=='flag')this.containSupport();
    if(this.gelMode){if(!this.environment||this.environment.type==='flag')this.supportGel();this.healGel(dt);}
  }
  pruneBelow(y){
    // Gel fragments remain on the tray and can be re-grabbed; never discard them.
    if(this.gelMode||(this.environment&&this.environment.type!=='flag'))return;
    // Most frames have no offscreen face. Avoid building a connectivity graph
    // (and hundreds of temporary arrays) until there is actually cleanup work.
    let candidate=false;
    for(const f of this.liveFaces){const ns=f.nodes;if(this.nodes[ns[0]].y>y&&this.nodes[ns[1]].y>y&&this.nodes[ns[2]].y>y){candidate=true;break;}}
    if(this.yarnMode)for(const e of this.liveEdges)if(e.yarn&&this.nodes[e.a].y>y&&this.nodes[e.b].y>y){candidate=true;break;}
    if(!candidate)return;
    // Keep the held connected component even if the pointer leaves the viewport.
    const held=new Set(this.grab?this.grab.items.map(g=>g.i):[]);
    if(held.size){const adjacent=this.nodes.map(()=>[]);for(const e of this.edges)if(e.alive){adjacent[e.a].push(e.b);adjacent[e.b].push(e.a);}const queue=[...held];for(let k=0;k<queue.length;k++)for(const n of adjacent[queue[k]])if(!held.has(n)){held.add(n);queue.push(n);}}
    let changed=false;if(this.yarnMode)for(const e of this.liveEdges)if(e.yarn&&!held.has(e.a)&&!held.has(e.b)&&this.nodes[e.a].y>y&&this.nodes[e.b].y>y){e.alive=false;for(const fi of e.faces)this.faces[fi].alive=false;changed=true;}for(const f of this.faces)if(f.alive&&!f.nodes.some(i=>held.has(i))&&f.nodes.every(i=>this.nodes[i].y>y)){f.alive=false;changed=true;}if(changed)this.reconcile();
  }
}
Cloth.MATERIALS=MATERIALS;root.Cloth=Cloth;if(typeof module!=='undefined')module.exports={Cloth};
})(typeof window!=='undefined'?window:globalThis);
