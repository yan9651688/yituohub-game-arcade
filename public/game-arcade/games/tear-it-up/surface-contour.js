'use strict';
// Render-only boundary subdivision. No particles, links or cut faces are added.
// Face-local polygons share the exact same curved bank as the rim and sidewall.
(function(root){
 const cache=new WeakMap();
 function mix(a,b,t){const out=new Map();for(const [i,w] of a)out.set(i,(out.get(i)||0)+w*(1-t));for(const [i,w] of b)out.set(i,(out.get(i)||0)+w*t);return [...out];}
 function quadratic(a,b,c,t){return mix(mix(a,b,t),mix(b,c,t),t);}
 function topology(c){
  const old=cache.get(c);if(old&&old.key===c.boundaryEdges)return old;
  const adjacent=new Map(),corners=new Map(),incidentCounts=new Map();
  for(const f of c.liveFaces)for(const i of f.nodes)incidentCounts.set(i,(incidentCounts.get(i)||0)+1);
  for(const e of c.boundaryEdges){for(const [a,b] of [[e.a,e.b],[e.b,e.a]]){if(!adjacent.has(a))adjacent.set(a,[]);adjacent.get(a).push(b);}}
  // Use reference coordinates, never projected coordinates, to detect thin or
  // ambiguous fans. A folded projection must not change the material topology.
  const uv=i=>{const n=c.nodes[i];return{x:n.i,y:n.j};};
  for(const [i,neighbors] of adjacent){
   let amount=neighbors.length===2?.5:0;
   // An isolated triangle / one-cell sliver remains substantial and grabbable.
   if(incidentCounts.get(i)<3)amount*=.55;
   corners.set(i,{neighbors,amount});
  }
  // Two strictly local relaxation passes remove the *plateaus* of a
  // grid staircase, not just round each right angle. Bounded support is along
  // the same bank only; no nearest-screen-neighbor welding across a cut.
  let relaxed=new Map([...adjacent.keys()].map(i=>[i,[[i,1]]]));
  for(let pass=0;pass<2;pass++){const next=new Map();for(const [i,q] of corners){const ns=q.neighbors;next.set(i,ns.length===2?mix(relaxed.get(i),mix(relaxed.get(ns[0])||[[ns[0],1]],relaxed.get(ns[1])||[[ns[1],1]],.5),.42):[[i,1]]);}relaxed=next;}
  const relaxedAmount=new Map();for(const [i,q] of corners){const p=uv(i),w=relaxed.get(i);let x=0,y=0;for(const [id,a] of w){x+=uv(id).x*a;y+=uv(id).y*a;}const displacement=Math.hypot(x-p.x,y-p.y),limit=.24*Math.min(...q.neighbors.map(id=>Math.hypot(uv(id).x-p.x,uv(id).y-p.y)));relaxedAmount.set(i,Math.min(1,limit/(displacement||1)));}
  const baseCache=new Map(),anchorCache=new Map();
  function base(i){if(baseCache.has(i))return baseCache.get(i);const q=corners.get(i),value=q?mix([[i,1]],relaxed.get(i),relaxedAmount.get(i)*q.amount/.5):[[i,1]];baseCache.set(i,value);return value;}
  function anchor(i){if(anchorCache.has(i))return anchorCache.get(i);const q=corners.get(i),value=(!q||!q.amount)?[[i,1]]:mix(base(i),mix(base(q.neighbors[0]),base(q.neighbors[1]),.5),q.amount*.5);anchorCache.set(i,value);return value;}
  // Prevent local inversions around sharply turning, narrow scraps. Halving the
  // corner support preserves every original live face and never joins banks.
  const area=ps=>(ps[1].x-ps[0].x)*(ps[2].y-ps[0].y)-(ps[1].y-ps[0].y)*(ps[2].x-ps[0].x);
  const coord=w=>w.reduce((p,[i,a])=>{const n=uv(i);p.x+=n.x*a;p.y+=n.y*a;return p;},{x:0,y:0});
  for(let pass=0;pass<5;pass++){let changed=false;for(const f of c.liveFaces){if(!f.nodes.some(i=>corners.has(i)))continue;const raw=area(f.nodes.map(uv)),next=area(f.nodes.map(i=>coord(anchor(i))));if(raw*next<=raw*raw*.22){for(const i of f.nodes){const q=corners.get(i);if(q&&q.amount){q.amount*=.5;baseCache.clear();anchorCache.clear();changed=true;}}}}if(!changed)break;}
  const edgeWeights=new Map();
  for(const e of c.boundaryEdges){const a=base(e.a),b=base(e.b),qa=corners.get(e.a),qb=corners.get(e.b),ta=qa?.amount||0,tb=qb?.amount||0,start=anchor(e.a),end=anchor(e.b),left=mix(a,b,ta),right=mix(b,a,tb),weights=[start];
   // Two half-quadratics plus their straight middle span. Six segments are
   // enough at the original cell size, even on a full-DPR canvas.
   for(let k=1;k<=3;k++)weights.push(quadratic(start,mix(a,b,ta*.5),left,k/3));
   if(ta+tb<.999)weights.push(right);
   for(let k=1;k<=3;k++)weights.push(quadratic(right,mix(b,a,tb*.5),end,k/3));
   edgeWeights.set(e.id,weights);
  }
  const faceWeights=new Map();for(const f of c.liveFaces){if(!f.nodes.some(i=>corners.has(i)))continue;const weights=[];for(let j=0;j<3;j++){const a=f.nodes[j],b=f.nodes[(j+1)%3],e=c.edges[f.edges[j]],edge=edgeWeights.get(e.id);if(edge){const sequence=e.a===a?edge:edge.slice().reverse();weights.push(...sequence.slice(0,-1));}else weights.push(anchor(a));}faceWeights.set(f,weights);}
  const value={key:c.boundaryEdges,faceWeights,edgeWeights};cache.set(c,value);return value;
 }
 function build(c){
  if(c.yarnMode||c.chainMode||c.stockingMode)return {faces:new Map(),boundaries:[],stats:{refinedFaces:0,segments:0}};
  const t=topology(c),memo=new Map();
  function point(weights){if(memo.has(weights))return memo.get(weights);const p={x:0,y:0,z:0,depth:0,thickness:0,bodyDepth:0};for(const [id,w] of weights){const n=c.nodes[id];p.x+=n.x*w;p.y+=n.y*w;p.z+=(n.z||0)*w;p.depth+=(n.depth??n.z??0)*w;p.thickness+=(n.thickness??1)*w;p.bodyDepth+=(n.bodyDepth||c.gelThickness||0)*w;}p.volumeDepth=weights.reduce((s,[id,w])=>{const n=c.nodes[id];return s+(n.bodyDepth||c.gelThickness||0)*(n.thickness??1)*w;},0);memo.set(weights,p);return p;}
  // Drop only subpixel-collinear samples, using current projected geometry.
  // A 0.08 CSS-pixel error bound retains the same full-DPR silhouette while
  // avoiding six line segments on every straight boundary cell. The exact same
  // surviving samples feed the face polygon, wall and rim.
  const omitted=new Set(),boundaries=[];
  for(const edge of c.boundaryEdges){const weights=t.edgeWeights.get(edge.id),points=weights.map(point),keep=new Set([0,points.length-1]);
   function simplify(lo,hi){if(hi-lo<2)return;const a=points[lo],b=points[hi],dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy;let max=1,index=-1;
    for(let i=lo+1;i<hi;i++){const p=points[i],u=len2?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len2)):0,error=Math.hypot(p.x-a.x-dx*u,p.y-a.y-dy*u)/.08,depthError=Math.abs(p.volumeDepth-a.volumeDepth-(b.volumeDepth-a.volumeDepth)*u)/.025;const score=Math.max(error,depthError);if(score>max){max=score;index=i;}}
    if(index>=0){keep.add(index);simplify(lo,index);simplify(index,hi);}}
   simplify(0,points.length-1);const retained=[];for(let i=0;i<points.length;i++){if(keep.has(i))retained.push(points[i]);else omitted.add(weights[i]);}boundaries.push({edge,points:retained});
  }
  const faces=new Map();for(const [f,weights] of t.faceWeights)faces.set(f,weights.filter(w=>!omitted.has(w)).map(point));
  return {faces,boundaries,stats:{refinedFaces:faces.size,segments:boundaries.reduce((s,b)=>s+b.points.length-1,0)}};
 }
 const api={build};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.SurfaceContour=api;
})(typeof window!=='undefined'?window:globalThis);
