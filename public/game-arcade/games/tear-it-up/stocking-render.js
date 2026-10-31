/* Fine, topology-bound stocking knit. No additional simulation particles. */
(function (root) {
'use strict';
const caches=new WeakMap(), motifs=new Map();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const identity=(x,y)=>({x,y});
function motif(face,nodes){
  const uv=face.nodes.map(id=>[nodes[id].i,nodes[id].j]);
  const minX=Math.min(...uv.map(p=>p[0])),minY=Math.min(...uv.map(p=>p[1]));
  for(const p of uv){p[0]-=minX;p[1]-=minY;}
  const key=uv.flat().join(',');if(motifs.has(key))return motifs.get(key);
  const [a,b,c]=uv,det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
  if(Math.abs(det)<1e-8)return [];
  const bary=(x,y)=>{const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/det,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/det;return [u,v,1-u-v];};
  const lines=[];
  // Three fine loop columns per physical cell: a rounded V with a crossing
  // neck, not a square or diamond fishing net. Clip each yarn segment to its
  // own physical triangle so missing topology cannot be painted over.
  for(let j=0;j<2;j++)for(let i=0;i<3;i++){
    const points=[[.22,.04],[.31,.68],[.5,.91],[.69,.68],[.78,.04]];
    for(let k=1;k<points.length;k++){
      const p=bary((i+points[k-1][0])/3,(j+points[k-1][1])/2),q=bary((i+points[k][0])/3,(j+points[k][1])/2);
      let lo=0,hi=1;
      for(let v=0;v<3;v++){const d=q[v]-p[v];if(Math.abs(d)<1e-10){if(p[v]<-1e-8){hi=-1;break;}}else if(d>0)lo=Math.max(lo,-p[v]/d);else hi=Math.min(hi,-p[v]/d);}
      if(hi-lo>1e-7)lines.push([p.map((v,k)=>v+(q[k]-v)*lo),p.map((v,k)=>v+(q[k]-v)*hi)]);
    }
  }
  motifs.set(key,lines);return lines;
}
function getCache(cloth){
  let cache=caches.get(cloth);
  if(!cache||cache.count!==cloth.nodes.length||cache.faces!==cloth.faces){
    cache={count:cloth.nodes.length,faces:cloth.faces,projected:new Float64Array(cloth.nodes.length*2),groups:Array.from({length:12},()=>[]),detail:new WeakMap()};caches.set(cloth,cache);
  }
  return cache;
}
function draw(ctx,cloth,options={}){
  if(!cloth||!cloth.nodes||!cloth.liveFaces)return;
  const rgb=options.rgb||[48,43,49],project=options.project||identity,world=options.worldNodes||cloth.nodes,cache=getCache(cloth),xy=cache.projected;
  const color=rgb.map(v=>clamp(Math.round(v),0,255));
  for(let i=0;i<cloth.nodes.length;i++){
    const n=cloth.nodes[i],p=project(n.x,n.y,n.z||0);xy[i*2]=p.x;xy[i*2+1]=p.y;
  }
  for(const group of cache.groups)group.length=0;
  const restArea=Math.max(.001,cloth.width/cloth.cols*cloth.height/cloth.rows);
  for(const f of cloth.liveFaces){
    if(!f.alive||f.edges.some(id=>!cloth.edges[id].alive))continue;
    const [ia,ib,ic]=f.nodes,a=world[ia],b=world[ib],c=world[ic];
    const ux=b.x-a.x,uy=b.y-a.y,uz=(b.z||0)-(a.z||0),vx=c.x-a.x,vy=c.y-a.y,vz=(c.z||0)-(a.z||0);
    const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,area=Math.hypot(nx,ny,nz);
    // Surface mass is spread over the LOCAL deformed area, not faded globally.
    const density=clamp(1/Math.max(.45,area/restArea),.14,1.45);
    const band=clamp(Math.round((density-.14)/1.31*5),0,5),shade=Math.abs(nz)/(area||1)<.65?1:0;
    cache.groups[band*2+shade].push(f);
    if(!cache.detail.has(f))cache.detail.set(f,motif(f,cloth.nodes));
  }
  // Batched nonzero fills must share SCREEN winding. A folded triangle can
  // reverse its projection without disappearing; opposite subpath windings
  // would otherwise cancel and punch a false hole in their overlap.
  // Only fill order changes: knit barycentric coordinates retain node order.
  const triangle=f=>{let [a,b,c]=f.nodes;const winding=(xy[b*2]-xy[a*2])*(xy[c*2+1]-xy[a*2+1])-(xy[b*2+1]-xy[a*2+1])*(xy[c*2]-xy[a*2]);if(winding<0){const t=b;b=c;c=t;}ctx.moveTo(xy[a*2],xy[a*2+1]);ctx.lineTo(xy[b*2],xy[b*2+1]);ctx.lineTo(xy[c*2],xy[c*2+1]);ctx.closePath();};
  ctx.save();ctx.lineJoin='bevel';ctx.lineCap='butt';
  for(let band=0;band<6;band++)for(let shade=0;shade<2;shade++){
    const group=cache.groups[band*2+shade];if(!group.length)continue;
    const density=.14+band/5*1.31,tone=color.map(v=>Math.max(0,v-(shade?17:0)));
    ctx.beginPath();for(const f of group)triangle(f);
    ctx.fillStyle=`rgba(${tone},${Math.min(.54,.31*density)})`;ctx.fill();
    ctx.beginPath();
    for(const f of group){const [a,b,c]=f.nodes,ax=xy[a*2],ay=xy[a*2+1],bx=xy[b*2],by=xy[b*2+1],cx=xy[c*2],cy=xy[c*2+1];
      let lastX=NaN,lastY=NaN;for(const [p,q] of cache.detail.get(f)){const x=ax*p[0]+bx*p[1]+cx*p[2],y=ay*p[0]+by*p[1]+cy*p[2],ex=ax*q[0]+bx*q[1]+cx*q[2],ey=ay*q[0]+by*q[1]+cy*q[2];if(Math.abs(x-lastX)+Math.abs(y-lastY)>1e-6||!Number.isFinite(lastX))ctx.moveTo(x,y);ctx.lineTo(ex,ey);lastX=ex;lastY=ey;}
    }
    ctx.lineWidth=.48;ctx.strokeStyle=`rgba(${tone},${Math.min(.66,.3+ density*.22)})`;ctx.stroke();
  }
  // A run has real cross-course bars. Draw ONLY surviving physical yarns
  // bordering a removed face. Never invent fine bars across dead constraints.
  ctx.beginPath();let bars=0;
  for(const e of cloth.liveEdges||[]){
    if(!e.alive||!e.yarn||e.shear||!e.faces.some(id=>!cloth.faces[id].alive))continue;
    const a=e.a,b=e.b;if(!cloth.nodes[a].active||!cloth.nodes[b].active)continue;
    ctx.moveTo(xy[a*2],xy[a*2+1]);ctx.lineTo(xy[b*2],xy[b*2+1]);bars++;
  }
  if(bars){ctx.lineWidth=.8;ctx.strokeStyle=`rgba(${color},.73)`;ctx.stroke();ctx.lineWidth=.24;ctx.strokeStyle='rgba(255,246,234,.35)';ctx.stroke();}
  // Pigment and charring stay on live faces, including when viewed obliquely.
  // Only decorated faces pay for these overlays; at most one per solver face.
  for(const f of cloth.liveFaces){
    if(!f.alive||f.edges.some(id=>!cloth.edges[id].alive))continue;
    const ns=f.nodes.map(id=>cloth.nodes[id]),paint=ns.reduce((v,n)=>v+(n.paintA||0),0)/3,char=ns.reduce((v,n)=>v+(n.char||0),0)/3;
    if(paint>.01){const sum=ns.reduce((v,n)=>v+(n.paintA||0),0),mix=key=>Math.round(ns.reduce((v,n)=>v+(n[key]||0)*(n.paintA||0),0)/sum);ctx.beginPath();triangle(f);ctx.fillStyle=`rgba(${mix('paintR')},${mix('paintG')},${mix('paintB')},${Math.min(.7,paint*.7)})`;ctx.fill();}
    if(char>.02){ctx.beginPath();triangle(f);ctx.fillStyle=`rgba(38,25,20,${Math.min(.83,char*.75)})`;ctx.fill();}
  }
  ctx.restore();
}
const api={draw};root.StockingRenderer=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
