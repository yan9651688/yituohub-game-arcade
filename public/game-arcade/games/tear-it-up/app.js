'use strict';
(()=>{
const canvas=document.querySelector('#cloth'),hint=document.querySelector('#hint');let ctx=canvas.getContext('2d');
const looks={
 stocking:{note:'薄丝袜 · 横向柔伸，纵向坚韧；勾破后沿纵行跑丝',colors:[[70,61,58],[184,143,115],[117,108,126]],labels:['烟黑丝袜','肤色丝袜','雾紫丝袜']},
 chain_mail:{note:'环环穿扣 · 柔垂不易拉长，拉紧可扯开环口',colors:[[136,151,161],[178,145,94],[116,139,133]],labels:['冷银色','古铜色','青钢色']},
 jelly:{note:'透明果冻 · 切块后独立回弹，不会自行黏合',colors:[[100,185,204],[220,135,158],[168,151,217]],labels:['水蓝果冻','蜜桃果冻','葡萄果冻']},
 slime:{note:'透明史莱姆 · 慢拉延展，快拉断开；原切口贴合可黏回',colors:[[135,190,113],[102,177,191],[206,153,198]],labels:['青柠史莱姆','冰蓝史莱姆','紫莓史莱姆']},
 fishing_net:{note:'菱形结网 · 拉扯网眼自然开合',colors:[[157,133,93],[113,140,126],[139,148,166]],labels:['麻绳色','海藻色','雾蓝色']},
 cotton:{note:'轻软好撕 · 慢慢拉出裂口',colors:[[222,192,160],[159,180,175],[194,158,150]],labels:['原棉色','雾青色','陶粉色']},
 denim:{note:'厚实有阻力 · 拉紧后撕开',colors:[[82,112,141],[92,126,125],[137,108,120]],labels:['靛蓝色','青灰色','莓灰色']},
 gauze:{note:'细密轻薄 · 顺着织线扯出散纱',colors:[[229,223,204],[178,201,195],[217,194,191]],labels:['米白色','浅青色','藕白色']},
 silk:{note:'柔滑飘逸 · 拉紧后顺势撕开',colors:[[164,184,198],[189,164,184],[202,181,136]],labels:['月蓝色','烟紫色','香槟色']},
 linen:{note:'粗织干脆 · 顺着经纬拉出裂口',colors:[[176,151,111],[137,157,126],[180,131,103]],labels:['麦麻色','苔绿色','赭麻色']},
 felt:{note:'先拉长变细 · 缓缓撕开纤维',colors:[[154,136,129],[124,147,148],[170,133,142]],labels:['暖灰色','湖灰色','豆沙色']}
};
let scene='clips',tool='hand',cloths=[],toolPoint=null,previousPoint=null,clipGesture=null,paintColor=[190,78,85],brushSize=30;
let material='cotton',normalX,normalY,normalZ,shades,tints=[],floor;
let cloth,W=0,H=0,color=0,pointer=null,last=0,acc=0,muted=false,audio=null,burnAudio=null,gelAudio=null,lastRip=0,ripEvents=0,played=false;
let texture,tintKey='';
// Resizing the viewport must not replace an already torn/painted sheet. Keep
// its physical coordinate system until an explicit reset, and fit that view.
let viewportW=0,viewportH=0,canvasDpr=1,viewScale=1,viewX=0,viewY=0,pointerRect=null;
function setViewTransform(){viewScale=Math.min(viewportW/W,viewportH/H)||1;viewX=(viewportW-W*viewScale)/2;viewY=(viewportH-H*viewScale)/2;ctx.setTransform(canvasDpr*viewScale,0,0,canvasDpr*viewScale,canvasDpr*viewX,canvasDpr*viewY);}
const pigmentState={alpha:0,char:0,r:0,g:0,b:0};
function pigment(a,b,c){const aa=a.paintA||0,ab=b.paintA||0,ac=c.paintA||0,total=aa+ab+ac,p=pigmentState;p.alpha=total/3;p.char=((a.char||0)+(b.char||0)+(c.char||0))/3;p.r=total?(a.paintR*aa+b.paintR*ab+c.paintR*ac)/total:0;p.g=total?(a.paintG*aa+b.paintG*ab+c.paintG*ac)/total:0;p.b=total?(a.paintB*aa+b.paintB*ab+c.paintB*ac)/total:0;return p;}
function surfaceTint(a,b,c,aa,ab,ac,r,g,blue,opacity=1){
 const lo=Math.min(aa,ab,ac),hi=Math.max(aa,ab,ac),ux=b.x-a.x,uy=b.y-a.y,vx=c.x-a.x,vy=c.y-a.y,det=ux*vy-uy*vx;
 if(hi-lo>.008&&Math.abs(det)>.01){const gx=((ab-aa)*vy-(ac-aa)*uy)/det,gy=(ux*(ac-aa)-vx*(ab-aa))/det,g2=gx*gx+gy*gy;if(g2>1e-9){const fill=ctx.createLinearGradient(a.x+gx*(lo-aa)/g2,a.y+gy*(lo-aa)/g2,a.x+gx*(hi-aa)/g2,a.y+gy*(hi-aa)/g2);fill.addColorStop(0,`rgba(${r},${g},${blue},${lo*opacity})`);fill.addColorStop(1,`rgba(${r},${g},${blue},${hi*opacity})`);return fill;}}
 return `rgba(${r},${g},${blue},${(aa+ab+ac)/3*opacity})`;
}

function makeTexture(){
 const t=document.createElement('canvas');t.width=t.height=24;const c=t.getContext('2d');
 if(material==='felt'){
  // Deterministic short fibers, cached once on material change, not per frame.
  for(let i=0;i<72;i++){const x=(i*17.37)%24,y=(i*11.73)%24;c.strokeStyle=i%2?'rgba(255,250,240,.14)':'rgba(55,40,45,.09)';c.lineWidth=.65;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.sin(i*2.3)*2,y+Math.cos(i*1.7)*2);c.stroke();}
 }else{
  const step=material==='gauze'?8:material==='linen'?6:material==='silk'?2:3;
  c.strokeStyle=material==='gauze'?'rgba(255,255,246,.7)':material==='linen'?'rgba(255,239,197,.25)':'rgba(255,255,245,.16)';c.lineWidth=material==='gauze'?1.6:material==='linen'?1.2:.6;
  for(let n=1;n<24;n+=step){c.beginPath();c.moveTo(n,0);c.lineTo(n,24);c.stroke();}
  c.strokeStyle=material==='gauze'?'rgba(114,116,100,.21)':'rgba(65,52,34,.075)';
  for(let n=1;n<24;n+=step){c.beginPath();c.moveTo(0,n);c.lineTo(24,n);c.stroke();}
  if(material==='denim'){c.strokeStyle='rgba(225,235,245,.23)';c.lineWidth=1;for(let n=-24;n<48;n+=4){c.beginPath();c.moveTo(n,0);c.lineTo(n+24,24);c.stroke();}}
 }
 texture=ctx.createPattern(t,'repeat');
}
function unlock(){if(muted)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();if(!burnAudio&&window.ClothBurnAudio)burnAudio=new window.ClothBurnAudio(audio);if(!gelAudio&&window.GelAudio)gelAudio=new window.GelAudio(audio);if(gelAudio)gelAudio.setMuted(false);if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{muted=true;updateSound();}}
function rip(count){if(muted||!audio||audio.state!=='running')return;const now=audio.currentTime;if(now-lastRip<.045)return;lastRip=now;ripEvents++;const duration=Math.min(.2,.055+count*.007),len=Math.floor(audio.sampleRate*duration),buffer=audio.createBuffer(1,len,audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<len;i++){const t=i/len;data[i]=(Math.random()*2-1)*Math.pow(1-t,2)*(Math.sin(t*90)*.24+.76);}const src=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();src.buffer=buffer;filter.type='bandpass';filter.frequency.value=1400+Math.random()*1200;filter.Q.value=.65;gain.gain.value=Math.min(.14,.035+count*.006);src.connect(filter).connect(gain).connect(audio.destination);src.start();src.onended=()=>{src.disconnect();filter.disconnect();gain.disconnect();};}
// A single orthographic camera is shared by every render layer and input hit test.
// Physics remains in world coordinates; cached projected nodes are read-only views.
function projectPoint(n,c=cloths[0]){
 if(!c||!c.environment||!['flat','sphere','slope'].includes(c.environment.type))return{x:n.x,y:n.y,depth:n.z||0};
 const e=c.environment,dy=n.y-e.cy,z=n.z||0;
 return{x:e.cx+.90*(n.x-e.cx)+.34*dy,y:H*.52+.55*dy-.82*z,depth:dy*.82+z*.55};
}
function unprojectPoint(x,y,z=0,c=cloths[0]){
 if(!c||!c.environment||!['flat','sphere','slope'].includes(c.environment.type))return{x,y,z};
 const e=c.environment,dy=(y-H*.52+.82*z)/.55;
 return{x:e.cx+(x-e.cx-.34*dy)/.90,y:e.cy+dy,z};
}
function renderView(c){
 if(!c.projectPoint)return c;
 let v=c._renderView;if(!v){v=c._renderView=Object.create(c);v.nodes=c.nodes.map(n=>({...n}));v.worldNodes=c.nodes;v.surfaceAreaScale=.90*.55;}
 for(let i=0;i<c.nodes.length;i++){const n=c.nodes[i],p=c.projectPoint(n),r=v.nodes[i];Object.assign(r,n);r.x=p.x;r.y=p.y;r.z=n.z;r.depth=p.depth;}
 for(const f of c.liveFaces)f.viewDepth=v.nodes[f.nodes[0]].depth+v.nodes[f.nodes[1]].depth+v.nodes[f.nodes[2]].depth;
 v.liveFaces=c.liveFaces.slice().sort((a,b)=>a.viewDepth-b.viewDepth);
 v.clips=c.clips.map(n=>projectPoint(n,c));
 if(c.grab){v.grab={...c.grab,...projectPoint({x:c.grab.x,y:c.grab.y,z:c.grab.z||c.grab.startZ||0},c)};}else v.grab=null;
 return v;
}
function fresh(){
 const viewChanged=W!==viewportW||H!==viewportH;W=viewportW;H=viewportH;setViewTransform();
 release();if(gelAudio)gelAudio.stop();fireLow=false;perf.slow=0;clearFire();const width=Math.min(450,W*.79,H*.83),height=Math.min(H*.73,width*1.06),y=Math.max(38,H*.09);
 let specs=scene==='line'?Array.from({length:3},(_,i)=>{const w=Math.min(225,W*.26,H*.55);return{x:W/2+(i-1)*w*1.17-w/2,y,width:w,height:Math.min(H*.62,w*1.25),cols:14,rows:17};}):[{x:(W-width)/2,y,width,height,cols:27,rows:30}];
 const supported=['flat','sphere','slope'].includes(scene);
 if(supported||scene==='flag'){
  // Dense hanging materials need room for their full gravity sag, not the
  // wind-supported silhouette of cotton. Reserve vertical reach at creation.
  const heavyFlag=scene==='flag'&&['chain_mail','jelly','slime'].includes(material);
  const w=heavyFlag?Math.min(320,W*.58,H*(material==='chain_mail'?.50:.60)):Math.min(scene==='flag'?420:440,W*.67,H*(scene==='flag'?1.1:1.04)),h=w*(scene==='flag'?.58:.72);
  const x=(W-w)/2,y=heavyFlag?Math.max(24,H*.10):Math.max(35,(H-h)/2-12);
  const radius=Math.min(w*.34,h*.4);
  specs=[{x,y,width:w,height:h,cols:27,rows:scene==='flag'?19:25,environment:{type:scene,cx:x+w/2,cy:y+h/2,radius,centerZ:-radius*.45,planeZ:0,slope:.32,minX:Math.max(14,x-55),maxX:Math.min(W-14,x+w+55),minY:Math.max(22,y-30),maxY:Math.min(H-24,y+h+55),wind:1}}];
 }
 cloths=specs.map(spec=>{const c=new Cloth({...spec,material,anchors:scene==='flag'?'left':supported?'none':scene==='curtain'?'top':scene==='frame'?'frame':'clips'});if(supported){c.projectPoint=n=>projectPoint(n,c);c.unprojectPoint=(x,y,z)=>unprojectPoint(x,y,z,c);}if(c.gelMode){c.gelFloor=H-32;c.gelBounds={left:16,right:W-16};}c.renderBuffers=Array.from({length:4},()=>new Float32Array(c.nodes.length));c.onBreak=(count,position)=>{if(position&&!c.gelMode)rip(count);};c.onManipulate=event=>{if(!muted&&gelAudio)gelAudio.contact(event,c);};return c;});
 cloth=cloths[0];acc=0;played=false;hint.textContent=currentToolNote();document.querySelector('#toolNote').textContent=currentToolNote();hint.classList.remove('hidden');
 if(!floor||viewChanged){floor=ctx.createRadialGradient(W/2,H*.86,2,W/2,H*.86,cloth.width*.61);floor.addColorStop(0,'rgba(73,64,48,.075)');floor.addColorStop(1,'rgba(73,64,48,0)');}
}
function resize(){
 const r=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);pointerRect=null;
 if(!(r.width>0&&r.height>0)||(r.width===viewportW&&r.height===viewportH&&dpr===canvasDpr))return;
 release();viewportW=r.width;viewportH=r.height;canvasDpr=dpr;
 canvas.width=Math.round(viewportW*dpr);canvas.height=Math.round(viewportH*dpr);
 if(!cloths.length){W=viewportW;H=viewportH;}setViewTransform();makeTexture();
 if(!cloths.length)fresh();
}
function point(e){const r=pointerRect||(pointerRect=canvas.getBoundingClientRect());return{x:(e.clientX-r.left-viewX)/viewScale,y:(e.clientY-r.top-viewY)/viewScale};}
function release(commitClip=false, allowTail=false){
 const gesture=clipGesture;clipGesture=null;
 if(gesture){if(gesture.dragging){gesture.cloth.finishClipDrag(commitClip===true);}else if(commitClip===true&&!gesture.attempted){for(let i=cloths.length-1;i>=0;i--)if(cloths[i].togglePinAt(gesture.start.x,gesture.start.y,20))break;}}
 if(gelAudio){if(allowTail)gelAudio.releaseContact();else gelAudio.stop();}const id=pointer;pointer=null;toolPoint=null;previousPoint=null;if(id!==null){try{if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}catch{}}for(const c of cloths)c.release();canvas.classList.remove('grabbing');}
function applyTool(p,down=false){
 if(tool==='hand'||tool==='hook'){if(down){for(let i=cloths.length-1;i>=0;i--){const c=cloths[i];if(tool==='hook'?c.hookAt(p.x,p.y,Math.max(13,c.spacing)):c.grabAt(p.x,p.y,Math.max(25,c.width/11))){cloth=c;if(gelAudio&&c.gelMode)gelAudio.captureSource(c);break;}}}else for(const c of cloths)c.moveGrab(p.x,p.y);}
 else if(tool==='clip'){
  if(down)clipGesture={start:{...p},dragging:false,attempted:false,cloth:null};
  else if(clipGesture){const g=clipGesture;
   if(!g.attempted&&Math.hypot(p.x-g.start.x,p.y-g.start.y)>6){g.attempted=true;for(let i=cloths.length-1;i>=0;i--)if(cloths[i].beginClipDrag(g.start.x,g.start.y,23)){g.cloth=cloths[i];g.dragging=true;cloth=g.cloth;break;}}
   if(g.dragging)g.cloth.moveClipDrag(p.x,p.y);
  }
 }
 else if(tool==='scissors'&&down){for(const c of cloths)c.snipAt(p.x,p.y);}
 else if(tool==='knife'){const q=previousPoint||p;for(const c of cloths)c.cutPath(q.x,q.y,p.x,p.y,3);}
 previousPoint=p;
}
canvas.addEventListener('pointerdown',e=>{if(pointer!==null||e.button!==0)return;unlock();pointerRect=null;pointer=e.pointerId;toolPoint=point(e);previousPoint=toolPoint;if(gelAudio)gelAudio.beginGesture(tool,toolPoint.x,toolPoint.y);canvas.setPointerCapture(pointer);canvas.classList.add('grabbing');applyTool(toolPoint,true);hint.classList.add('hidden');played=true;e.preventDefault();});
canvas.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;toolPoint=point(e);if(gelAudio)gelAudio.moveGesture(toolPoint.x,toolPoint.y);applyTool(toolPoint);e.preventDefault();});
canvas.addEventListener('pointerup',e=>{if(e.pointerId===pointer){if(tool==='clip')applyTool(point(e));release(true,true);}});canvas.addEventListener('pointercancel',e=>{if(e.pointerId===pointer)release();});canvas.addEventListener('lostpointercapture',e=>{if(e.pointerId===pointer)release();});window.addEventListener('blur',release);
const fireNotes={stocking:'薄针织局部熔缩 · 小火沿细纱蔓延',chain_mail:'局部热红 · 环口软化，不会像布一样起火',jelly:'受热软化 · 透明度变化，轻微热晕',slime:'受热流软 · 拉伸更缓，不冒大火',cotton:'均衡火舌 · 随燃烧面积起伏',denim:'短浓橙火 · 烟气较厚',gauze:'薄细微火 · 织线留红',silk:'轻窄低火 · 少量余烬',linen:'参差火舌 · 纤维余烬',felt:'低矮闷烧 · 宽火慢烟',fishing_net:'沿绳起火 · 网眼留空'};
function updateMaterialNote(){document.querySelector('#materialNote').textContent=tool==='fire'?fireNotes[material]:looks[material].note;document.querySelector('#toolNote').textContent=currentToolNote();if(!hint.classList.contains('hidden'))hint.textContent=currentToolNote();}
const toolNotes={hand:'捏住一角，慢慢拉开',clip:'轻点固定／松开；按住拖动，松手夹在新位置',scissors:'每点一下，剪开一个短口',knife:'按住划过，沿路径切开',fire:'按住加热，焦边会慢慢烧开',paint:'按住喷色，停留越久颜色越浓',hook:'勾住细线和夹子边的小布头'};
function currentToolNote(){if(['flat','sphere','slope'].includes(scene)&&(tool==='hand'||tool==='hook'))return '未固定时提起整片；用夹子固定同一片后再拉扯';if(material==='jelly'||material==='slime'){const jelly=material==='jelly',notes={hand:jelly?'捏住拉开，切下的果冻也能抓起晃动':'慢拉变细，猛拉断开；把原切口贴在一起稍等',knife:'先压出凹槽，继续划过便切开',scissors:'每点一下，真正剪开一个短口',hook:jelly?'勾住小块果冻，拉开后松手回弹':'勾住细长软胶，慢拉延展、快拉断开',fire:fireNotes[material]};return notes[tool]||toolNotes[tool];}return toolNotes[tool];}
function selectButtons(selector,key,value){document.querySelectorAll(selector).forEach(b=>{const on=b.dataset[key]===value;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});}
document.querySelectorAll('.tool').forEach(b=>b.addEventListener('click',()=>{release();tool=b.dataset.tool;updateMaterialNote();selectButtons('.tool','tool',tool);document.querySelector('#toolNote').textContent=currentToolNote();document.querySelector('#paintControls').hidden=tool!=='paint';document.querySelector('#fireControls').hidden=tool!=='fire';canvas.style.cursor=tool==='hand'?'grab':'crosshair';}));
document.querySelectorAll('.scene').forEach(b=>b.addEventListener('click',()=>{scene=b.dataset.scene;selectButtons('.scene','scene',scene);fresh();}));
document.querySelector('#extinguish').addEventListener('click',()=>{release();for(const c of cloths)c.extinguish();clearFire();});
document.querySelector('#clearPaint').addEventListener('click',()=>{release();for(const c of cloths)c.clearPaint();});
document.querySelector('#paintColor').addEventListener('input',e=>{const hex=e.target.value;paintColor=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));});
document.querySelector('#brushSize').addEventListener('input',e=>{brushSize=Number(e.target.value);});
canvas.addEventListener('keydown',e=>{if(e.code==='KeyR'){e.preventDefault();fresh();return;}if(e.code==='Space'){e.preventDefault();if(!cloth.grab){unlock();let n=cloth.nodes.filter(n=>n.active&&!n.pin).sort((a,b)=>b.y-a.y)[0];if(n){const p=projectPoint(n,cloth);if(gelAudio)gelAudio.beginGesture('hand',p.x,p.y);cloth.grabAt(p.x,p.y,Math.max(25,cloth.width/11));if(gelAudio&&cloth.gelMode)gelAudio.captureSource(cloth);hint.classList.add('hidden');}}}if(cloth.grab&&e.key.startsWith('Arrow')){e.preventDefault();const g=cloth.grab,p=projectPoint({x:g.tx,y:g.ty,z:g.startZ||0},cloth);const x=p.x+(e.key==='ArrowRight'?22:e.key==='ArrowLeft'?-22:0),y=p.y+(e.key==='ArrowDown'?22:e.key==='ArrowUp'?-22:0);if(gelAudio)gelAudio.moveGesture(x,y);cloth.moveGrab(x,y);}});canvas.addEventListener('keyup',e=>{if(e.code==='Space')release(false,true);});canvas.addEventListener('blur',release);
function updateSound(){document.querySelector('#soundText').textContent=muted?'声音关':'声音开';document.querySelector('#soundIcon').textContent=muted?'◌':'◖';document.querySelector('#sound').setAttribute('aria-pressed',String(!muted));document.querySelector('#sound').setAttribute('aria-label',muted?'开启声音':'关闭声音');}
document.querySelector('#sound').addEventListener('click',()=>{muted=!muted;if(gelAudio)gelAudio.setMuted(muted);unlock();if(muted&&burnAudio)burnAudio.silence(true);if(muted&&audio)audio.suspend().catch(()=>{});updateSound();});
document.querySelector('#reset').addEventListener('click',()=>{unlock();fresh();});document.querySelectorAll('.swatch').forEach(b=>b.addEventListener('click',()=>{color=Number(b.dataset.color);document.querySelectorAll('.swatch').forEach(s=>{const on=s===b;s.classList.toggle('selected',on);s.setAttribute('aria-pressed',String(on));});}));

document.querySelectorAll('.material').forEach(b=>b.addEventListener('click',()=>{
 if(material===b.dataset.material)return;material=b.dataset.material;
 document.querySelectorAll('.material').forEach(s=>{const on=s===b;s.classList.toggle('selected',on);s.setAttribute('aria-pressed',String(on));});
 const look=looks[material];updateMaterialNote();
 document.querySelectorAll('.swatch').forEach((s,i)=>{s.setAttribute('aria-label',look.labels[i]);s.style.setProperty('--swatch',`rgb(${look.colors[i].join(',')})`);});
 canvas.setAttribute('aria-label','拖住'+Cloth.MATERIALS[material].label+'，向任意方向拉扯。也可以按住空格并使用方向键拉扯。');
 makeTexture();fresh();
}));
let surfaceMesh=null;
function facePoints(f){return surfaceMesh?.faces.get(f)||f.nodes.map(i=>cloth.nodes[i]);}
function tri(f){const points=facePoints(f);ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);ctx.closePath();}
function surfaceBoundaries(){return surfaceMesh?.boundaries||cloth.boundaryEdges.map(edge=>({edge,points:[cloth.nodes[edge.a],cloth.nodes[edge.b]]}));}

function renderFixtures(){
 for(const n of cloth.nodes)if(n.customPin&&n.pin&&n.active&&(cloth.chainMode||cloth.gelMode)){ctx.fillStyle='#65745e';ctx.beginPath();ctx.arc(n.x,n.y,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff8';ctx.stroke();}
 for(const n of (scene==='clips'||scene==='line'?cloth.clips:[])){ctx.save();ctx.translate(n.x,n.y);ctx.shadowColor='#303a2420';ctx.shadowBlur=5;ctx.shadowOffsetY=3;ctx.fillStyle='#69715f';ctx.beginPath();ctx.roundRect(-17,-21,34,39,4);ctx.fill();ctx.shadowColor='transparent';ctx.fillStyle='#87917b';ctx.fillRect(-6,-17,12,2);ctx.strokeStyle='#c1c4ad';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-5,-20);ctx.lineTo(-6,-30);ctx.quadraticCurveTo(0,-36,6,-30);ctx.lineTo(5,-20);ctx.stroke();ctx.restore();}
 if(cloth.grab){const g=cloth.grab;ctx.strokeStyle='#ffffff75';ctx.lineWidth=1;ctx.beginPath();ctx.arc(g.x,g.y,8,0,Math.PI*2);ctx.stroke();}
}
// Translucency is composited once over the union of surviving faces. This keeps
// shared triangle boundaries invisible, instead of double-blending every seam.
function gelTriangle(f){
 const refined=surfaceMesh?.faces.get(f);
 if(!refined){const a=cloth.nodes[f.nodes[0]],b=cloth.nodes[f.nodes[1]],c=cloth.nodes[f.nodes[2]],positive=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)>=0,p=positive?b:c,q=positive?c:b;ctx.moveTo(a.x,a.y);ctx.lineTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.closePath();return;}
 let area=0;for(let i=0;i<refined.length;i++){const a=refined[i],b=refined[(i+1)%refined.length];area+=a.x*b.y-a.y*b.x;}
 ctx.moveTo(refined[0].x,refined[0].y);if(area>=0){for(let i=1;i<refined.length;i++)ctx.lineTo(refined[i].x,refined[i].y);}else{for(let i=refined.length-1;i>0;i--)ctx.lineTo(refined[i].x,refined[i].y);}ctx.closePath();
}
function renderGel(rgb){
 const jelly=cloth.gelMode==='jelly';
 // Cohesive volume: cut faces have depth, rather than a painted cloth outline.
 const thickness=cloth.gelThickness||(jelly?12:8),depthScale=cloth.projectPoint?.82:1,banks=surfaceBoundaries();ctx.save();ctx.fillStyle=`rgba(${rgb.map(v=>Math.max(0,v-24))},.42)`;
 // Sidewalls use the same refined top bank and interpolated *physical* local
 // volume as the fill/rim. Only camera-facing walls are visible, so back walls
 // cannot shine as dark steps through the translucent top on oblique supports.
 const walls=[];for(const bank of banks){const f=bank.edge.faces.map(id=>cloth.faces[id]).find(f=>f.alive);if(!f)continue;const ids=f.nodes,na=cloth.nodes[ids[0]],nb=cloth.nodes[ids[1]],nc=cloth.nodes[ids[2]],winding=Math.sign((nb.x-na.x)*(nc.y-na.y)-(nb.y-na.y)*(nc.x-na.x))||1;const directed=ids.some((id,i)=>id===bank.edge.a&&ids[(i+1)%3]===bank.edge.b)?1:-1;
  for(let i=1;i<bank.points.length;i++){const a=bank.points[i-1],b=bank.points[i];if((b.x-a.x)*directed*winding>=0)continue;walls.push({a,b,depth:((a.depth??a.z)+(b.depth??b.z))*.5});}}
 walls.sort((a,b)=>a.depth-b.depth);ctx.beginPath();for(const wall of walls){let {a,b}=wall;if(a.x>b.x)[a,b]=[b,a];const ta=(a.volumeDepth??(a.bodyDepth||thickness)*(a.thickness??1))*depthScale,tb=(b.volumeDepth??(b.bodyDepth||thickness)*(b.thickness??1))*depthScale;ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(b.x,b.y+tb);ctx.lineTo(a.x,a.y+ta);ctx.closePath();}ctx.fill();
 ctx.restore();ctx.save();ctx.beginPath();for(const f of cloth.liveFaces)gelTriangle(f);ctx.clip();
 // Optical density follows the same local volume field as the walls. Batch
 // neighboring faces into bounded density bands rather than double-blending
 // individual translucent triangles along every internal grid edge.
 const densityBands=new Map();for(const f of cloth.liveFaces){const t=f.nodes.reduce((sum,id)=>sum+(cloth.nodes[id].thickness??1),0)/3,band=Math.max(1,Math.min(16,Math.round(t*12)));if(!densityBands.has(band))densityBands.set(band,[]);densityBands.get(band).push(f);}
 for(const [band,faces] of densityBands){const density=band/12,body=ctx.createLinearGradient(cloth.x,cloth.y,cloth.x+cloth.width,cloth.y+cloth.height);for(const [stop,alpha] of [[0,jelly?.39:.27],[.35,jelly?.19:.12],[.72,jelly?.43:.29],[1,jelly?.57:.42]])body.addColorStop(stop,`rgba(${rgb},${1-Math.pow(1-alpha,density)})`);ctx.fillStyle=body;if(densityBands.size===1)ctx.fillRect(0,0,W,H);else{ctx.beginPath();for(const f of faces)gelTriangle(f);ctx.fill();}}
 // Broad reflections are attached to live solver nodes, so folds move with the gel.
 let bubbles=0;for(let i=0;i<cloth.nodes.length;i++){const n=cloth.nodes[i];if(!n.active)continue;
  if(n.paintA>.006){ctx.fillStyle=`rgba(${n.paintR},${n.paintG},${n.paintB},${Math.min(.72,n.paintA*.7)})`;ctx.beginPath();ctx.arc(n.x,n.y,cloth.spacing*.8,0,Math.PI*2);ctx.fill();}
  if(i%31===9&&bubbles<24){const r=(jelly?2.1:3.2)*Math.max(.45,n.thickness||1);ctx.strokeStyle='rgba(255,255,255,.43)';ctx.lineWidth=.7;ctx.beginPath();ctx.arc(n.x,n.y,r,0,Math.PI*2);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.arc(n.x-r*.35,n.y-r*.4,.6,0,Math.PI*2);ctx.fill();bubbles++;}
  if(i%47===12){const r=cloth.spacing*2.6,g=ctx.createRadialGradient(n.x-r*.25,n.y-r*.35,0,n.x,n.y,r);g.addColorStop(0,'rgba(255,255,255,.23)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(n.x-r,n.y-r,r*2,r*2);}
  if(n.heat>.12&&i%3===0){const r=cloth.spacing*1.5,g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,r);g.addColorStop(0,`rgba(255,229,173,${Math.min(.22,n.heat*.12)})`);g.addColorStop(1,'rgba(255,245,223,0)');ctx.fillStyle=g;ctx.fillRect(n.x-r,n.y-r,r*2,r*2);}
 }
 // Four alpha bands keep a fully scribbled sheet to eight groove strokes.
 // Paths remain attached to the deformed nodes and fade with local compression.
 ctx.lineCap='round';for(let band=1;band<=4;band++){const a=band/4;
  for(let pass=0;pass<2;pass++){ctx.beginPath();let count=0;
   for(const n of cloth.nodes){if(!n.active||!(n.groove>.025)||Math.ceil(n.groove*4)!==band)continue;
    const u=n.grooveUX===undefined?1:n.grooveUX,v=n.grooveUY||0,r=cloth.spacing*.7,ox=pass?-v*2:0,oy=pass?u*2:0;
    ctx.moveTo(n.x-u*r+ox,n.y-v*r+oy);ctx.lineTo(n.x+u*r+ox,n.y+v*r+oy);count++;
   }
   if(count){ctx.lineWidth=pass?1.1:2.6*a+.6;ctx.strokeStyle=pass?`rgba(255,255,255,${a*.53})`:`rgba(42,103,118,${a*.14})`;ctx.stroke();}
  }
 }ctx.lineCap='butt';
 ctx.restore();
 // Only matching, physically contacting cut surfaces can enter this bounded
 // fusion preview. Physics clears progress immediately if contact is lost.
 if(!jelly){ctx.fillStyle=`rgba(${rgb},.28)`;for(let band=1;band<=4;band++){ctx.beginPath();let count=0;for(const f of cloth.faces){if(f.alive||!(f.healProgress>.02)||Math.min(4,Math.ceil(f.healProgress*4))!==band)continue;gelTriangle(f);count++;}if(count){ctx.globalAlpha=band/4;ctx.fill();}}ctx.globalAlpha=1;}
 // Wet thickness rim, never fraying yarn. Quantized thickness limits even a
 // heavily diced gel to twelve strokes rather than two strokes per cut edge.
 ctx.lineCap='round';for(let pass=0;pass<2;pass++){ctx.strokeStyle=pass?'rgba(255,255,255,.56)':`rgba(${rgb},.42)`;for(let band=1;band<=6;band++){ctx.beginPath();let count=0;for(const bank of banks)for(let i=1;i<bank.points.length;i++){const a=bank.points[i-1],b=bank.points[i],thickness=Math.max(.06,Math.min(1.5,((a.thickness??1)+(b.thickness??1))/2));if(Math.min(6,Math.max(1,Math.ceil(thickness*4)))!==band)continue;const offset=pass?-Math.min(.7,thickness*.7):0;ctx.moveTo(a.x+offset,a.y+offset);ctx.lineTo(b.x+offset,b.y+offset);count++;}if(count){ctx.lineWidth=(pass?1.05:jelly?3.8:2.8)*Math.max(.12,(band-.5)/4);ctx.stroke();}}}
 ctx.lineCap='butt';renderFixtures();
}
function renderChain(rgb){
 // Each oval belongs to one physical joint. Adjacent ovals overlap and the
 // alternating front half is redrawn last, making the over/under weave legible.
 const rings=cloth.liveRings||[];ctx.lineCap='round';
 function path(r,front,append=false){const n=cloth.nodes[r.node];let hx=1,hy=0,vx=0,vy=1,hl=cloth.spacing,vl=cloth.spacing;
  for(const id of r.edges){const e=cloth.edges[id];if(!e||!e.alive)continue;const o=cloth.nodes[e.a===r.node?e.b:e.a];if(o.i!==n.i&&o.j===n.j){const sign=o.i>n.i?1:-1,dx=(o.x-n.x)*sign,dy=(o.y-n.y)*sign;hl=Math.hypot(dx,dy)||hl;hx=dx/hl;hy=dy/hl;}else if(o.j!==n.j&&o.i===n.i){const sign=o.j>n.j?1:-1,dx=(o.x-n.x)*sign,dy=(o.y-n.y)*sign;vl=Math.hypot(dx,dy)||vl;vx=dx/vl;vy=dy/vl;}}
  const radius=cloth.spacing*.68,tilt=(n.i+n.j)%2?1:-1,rx=radius*.88*Math.max(.35,Math.min(1.15,hl/cloth.spacing)),ry=radius*1.06*Math.max(.35,Math.min(1.15,vl/(cloth.height/cloth.rows))),broken=!!r.open;if(!append)ctx.beginPath();let from=front?(tilt>0?Math.PI:0):broken?.2:0,to=front?from+Math.PI:broken?Math.PI*1.87:Math.PI*2;if(broken){from=Math.max(from,.2);to=Math.min(to,Math.PI*1.87);}
  for(let j=0;j<=16;j++){const a=from+(to-from)*j/16,u=Math.cos(a)*rx,v=Math.sin(a)*ry,x=n.x+hx*u+vx*v+tilt*v*.17,y=n.y+hy*u+vy*v;j?ctx.lineTo(x,y):ctx.moveTo(x,y);}
 }
 // Batch identical metal/heat/paint tones, keeping draw-call count bounded even
 // for a full 868-node sheet. Both weave layers retain the same geometry.
 const buckets=new Map();for(const r of rings){const n=cloth.nodes[r.node];if(!n.active)continue;const hot=Math.round(Math.min(1,n.heat||0)*8)/8,paint=Math.round((n.paintA||0)*6)/6;const tone=hot>.16?`rgb(${Math.round(152+hot*103)},${Math.round(70+hot*95)},${Math.round(42+hot*35)})`:paint>.02?`rgb(${Math.round((rgb[0]*(1-paint)+n.paintR*paint)/16)*16},${Math.round((rgb[1]*(1-paint)+n.paintG*paint)/16)*16},${Math.round((rgb[2]*(1-paint)+n.paintB*paint)/16)*16})`:`rgb(${rgb})`;let group=buckets.get(tone);if(!group){group={rings:[],hot};buckets.set(tone,group);}group.rings.push(r);}
 for(let front=0;front<2;front++)for(const [tone,group] of buckets){ctx.beginPath();for(const r of group.rings)path(r,front,true);ctx.lineWidth=3.7;ctx.strokeStyle='rgba(38,44,47,.86)';ctx.stroke();ctx.lineWidth=2.35;ctx.strokeStyle=tone;ctx.stroke();ctx.lineWidth=.72;ctx.strokeStyle=group.hot>.4?'rgba(255,224,153,.8)':'rgba(242,249,250,.71)';ctx.stroke();}
 ctx.lineCap='butt';renderFixtures();
}

function renderCloth(){
 surfaceMesh=window.SurfaceContour?window.SurfaceContour.build(cloth):null;
 if(cloth.stockingMode&&window.StockingRenderer){window.StockingRenderer.draw(ctx,cloth,{rgb:looks[material].colors[color],worldNodes:cloth.worldNodes||cloth.nodes});renderFixtures();return;}
 if(cloth.chainMode){renderChain(looks[material].colors[color]);return;}
 if(cloth.gelMode){renderGel(looks[material].colors[color]);return;}
 [normalX,normalY,normalZ,shades]=cloth.renderBuffers;const rgb=looks[material].colors[color];
 if(tintKey!==material+color){tintKey=material+color;for(let shade=-48;shade<=20;shade++)tints[shade+48]=`rgb(${Math.max(0,rgb[0]+shade)},${Math.max(0,rgb[1]+shade)},${Math.max(0,rgb[2]+shade)})`;}
 const tint=shade=>tints[Math.max(0,Math.min(68,Math.round(shade)+48))];
 // A quiet floor shadow makes the hanging sheet feel suspended in space.


 // Accumulate normals only across surviving faces, never across a tear.
 normalX.fill(0);normalY.fill(0);normalZ.fill(0);
 const geometry=cloth.worldNodes||cloth.nodes;
 for(const f of cloth.liveFaces){
  const a=geometry[f.nodes[0]],b=geometry[f.nodes[1]],c=geometry[f.nodes[2]];
  const ux=b.x-a.x,uy=b.y-a.y,uz=b.z-a.z,vx=c.x-a.x,vy=c.y-a.y,vz=c.z-a.z;
  let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
  const length=Math.sqrt(nx*nx+ny*ny+nz*nz)||1,sign=nz<0?-1:1;
  nx=nx/length*sign;ny=ny/length*sign;nz=nz/length*sign;
  for(const i of f.nodes){normalX[i]+=nx;normalY[i]+=ny;normalZ[i]+=nz;}
 }
 for(let i=0;i<shades.length;i++){
  const nx=normalX[i],ny=normalY[i],nz=normalZ[i];
  const length=Math.sqrt(nx*nx+ny*ny+nz*nz)||1,light=(nx*-.46+ny*-.32+nz*.83)/length;
  shades[i]=Math.max(-47,Math.min(19,(light-.72)*(material==='silk'?85:material==='felt'?35:52)));
 }
 ctx.globalAlpha=cloth.yarnMode?.065:1;
 for(const f of cloth.liveFaces){
  const ia=f.nodes[0],ib=f.nodes[1],ic=f.nodes[2],a=cloth.nodes[ia],b=cloth.nodes[ib],c=cloth.nodes[ic],sa=shades[ia],sb=shades[ib],sc=shades[ic];
  const ux=b.x-a.x,uy=b.y-a.y,vx=c.x-a.x,vy=c.y-a.y,det=ux*vy-uy*vx;
  let paint=tint((sa+sb+sc)/3);
  if(Math.abs(det)>.01&&Math.max(sa,sb,sc)-Math.min(sa,sb,sc)>3){
   // A linear lighting plane interpolates all three vertex intensities, so
   // adjacent triangles share continuous shading rather than paper facets.
   const gx=((sb-sa)*vy-(sc-sa)*uy)/det,gy=(ux*(sc-sa)-vx*(sb-sa))/det,g2=gx*gx+gy*gy;
   if(g2>.00001){
    const lo=Math.min(sa,sb,sc),hi=Math.max(sa,sb,sc);
    paint=ctx.createLinearGradient(a.x+gx*(lo-sa)/g2,a.y+gy*(lo-sa)/g2,a.x+gx*(hi-sa)/g2,a.y+gy*(hi-sa)/g2);
    paint.addColorStop(0,tint(lo));paint.addColorStop(1,tint(hi));
   }
  }
  ctx.fillStyle=paint;ctx.strokeStyle=paint;ctx.lineWidth=.55;ctx.beginPath();tri(f);ctx.fill();ctx.stroke();
 }
 ctx.globalAlpha=1;
 if(cloth.yarnMode){
  // Gauze has fine fibers, the fishing net has thick ropes and tied joins.
  ctx.lineCap='round';
  if(material==='gauze'){
   ctx.strokeStyle=`rgba(${rgb.map(v=>Math.max(0,v-25)).join(',')},.54)`;ctx.lineWidth=.65;ctx.beginPath();
   for(const f of cloth.liveFaces)for(const segment of f.weaveSegments){const a=segment.a,b=segment.b,A=cloth.nodes[a[0]],B=cloth.nodes[a[1]],C=cloth.nodes[b[0]],D=cloth.nodes[b[1]];ctx.moveTo(A.x+(B.x-A.x)*a[2],A.y+(B.y-A.y)*a[2]);ctx.lineTo(C.x+(D.x-C.x)*b[2],C.y+(D.y-C.y)*b[2]);}ctx.stroke();
  }
  for(let pass=0;pass<2;pass++){ctx.strokeStyle=pass?'rgba(255,252,235,.85)':`rgb(${rgb.map(v=>Math.max(0,v-38)).join(',')})`;ctx.lineWidth=cloth.knotted?(pass?1.1:3.2):(pass?.38:.9);ctx.beginPath();for(const e of cloth.liveEdges)if(e.yarn){const a=cloth.nodes[e.a],b=cloth.nodes[e.b];ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);}ctx.stroke();}
  if(cloth.knotted){
   // A wrapped crossing is centered on the SAME shared solver vertex. Its
   // axes follow surviving ropes; no dot is placed at unrelated crossings.
   for(let pass=0;pass<2;pass++){ctx.strokeStyle=pass?'rgba(246,230,189,.92)':`rgb(${rgb.map(v=>Math.max(0,v-58)).join(',')})`;ctx.lineWidth=pass?1.05:2.8;ctx.beginPath();
    for(const knot of cloth.liveKnots){const n=cloth.nodes[knot.node],eh=cloth.edges[knot.horizontal[0]],ev=cloth.edges[knot.vertical[0]],h=cloth.nodes[eh.a===knot.node?eh.b:eh.a],v=cloth.nodes[ev.a===knot.node?ev.b:ev.a];let hx=h.x-n.x,hy=h.y-n.y,vx=v.x-n.x,vy=v.y-n.y;const hl=Math.hypot(hx,hy)||1,vl=Math.hypot(vx,vy)||1;hx/=hl;hy/=hl;vx/=vl;vy/=vl;const r=Math.min(2.8,hl*.22,vl*.22);ctx.moveTo(n.x-hx*r-vx*r*.65,n.y-hy*r-vy*r*.65);ctx.lineTo(n.x+hx*r-vx*r*.65,n.y+hy*r-vy*r*.65);ctx.lineTo(n.x+vx*r*.8,n.y+vy*r*.8);ctx.lineTo(n.x-hx*r+vx*r*.65,n.y-hy*r+vy*r*.65);}ctx.stroke();}
  }
  ctx.lineCap='butt';
 }else{ctx.save();ctx.beginPath();for(const f of cloth.liveFaces)tri(f);ctx.clip();ctx.fillStyle=texture;ctx.fillRect(0,0,W,H);ctx.restore();}
 // Pigment and char live on solver nodes; draw only surviving material.
 const decorated=cloth.nodes.some(n=>n.paintA>.004||n.char>.01);
 if(decorated){

 if(!cloth.yarnMode){for(const f of cloth.liveFaces){const a=cloth.nodes[f.nodes[0]],b=cloth.nodes[f.nodes[1]],c=cloth.nodes[f.nodes[2]],p=pigment(a,b,c);if(p.alpha>.004){ctx.fillStyle=surfaceTint(a,b,c,a.paintA,b.paintA,c.paintA,p.r,p.g,p.b,.88);ctx.beginPath();tri(f);ctx.fill();}if(p.char>.01){ctx.fillStyle=surfaceTint(a,b,c,Math.min(1,a.char*2.8),Math.min(1,b.char*2.8),Math.min(1,c.char*2.8),14,12,10,.98);ctx.beginPath();tri(f);ctx.fill();}}}
 else{ctx.lineCap='round';for(const e of cloth.liveEdges)if(e.yarn){const a=cloth.nodes[e.a],b=cloth.nodes[e.b],p=pigment(a,b,b);if(p.alpha>.004||p.char>.01){ctx.strokeStyle=p.char>.1?`rgba(38,28,21,${Math.min(.95,p.char)})`:`rgba(${p.r},${p.g},${p.b},${p.alpha})`;ctx.lineWidth=cloth.knotted?3.3:1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}if(material==='gauze')for(const f of cloth.liveFaces){const p=pigment(cloth.nodes[f.nodes[0]],cloth.nodes[f.nodes[1]],cloth.nodes[f.nodes[2]]);if(p.alpha<.004&&p.char<.01)continue;ctx.strokeStyle=p.char>.1?`rgba(38,28,21,${Math.min(.95,p.char)})`:`rgba(${p.r},${p.g},${p.b},${p.alpha})`;ctx.lineWidth=.7;ctx.beginPath();for(const seg of f.weaveSegments){const a=seg.a,b=seg.b,A=cloth.nodes[a[0]],B=cloth.nodes[a[1]],C=cloth.nodes[b[0]],D=cloth.nodes[b[1]];ctx.moveTo(A.x+(B.x-A.x)*a[2],A.y+(B.y-A.y)*a[2]);ctx.lineTo(C.x+(D.x-C.x)*b[2],C.y+(D.y-C.y)*b[2]);}ctx.stroke();}ctx.lineCap='butt';}
 }
 for(const n of cloth.nodes)if(n.customPin&&n.pin&&n.active){ctx.fillStyle='#65745e';ctx.beginPath();ctx.arc(n.x,n.y,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff8';ctx.stroke();}
 if(decorated&&cloth.knotted){for(const knot of cloth.liveKnots){const n=cloth.nodes[knot.node];if(n.paintA<.004&&n.char<.01)continue;const eh=cloth.edges[knot.horizontal[0]],ev=cloth.edges[knot.vertical[0]],h=cloth.nodes[eh.a===knot.node?eh.b:eh.a],v=cloth.nodes[ev.a===knot.node?ev.b:ev.a];let hx=h.x-n.x,hy=h.y-n.y,vx=v.x-n.x,vy=v.y-n.y;const hl=Math.hypot(hx,hy)||1,vl=Math.hypot(vx,vy)||1;hx/=hl;hy/=hl;vx/=vl;vy/=vl;const r=Math.min(2.8,hl*.22,vl*.22);ctx.strokeStyle=n.char>.1?`rgba(38,28,21,${Math.min(.95,n.char)})`:`rgba(${n.paintR},${n.paintG},${n.paintB},${n.paintA})`;ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(n.x-hx*r-vx*r*.65,n.y-hy*r-vy*r*.65);ctx.lineTo(n.x+hx*r-vx*r*.65,n.y+hy*r-vy*r*.65);ctx.lineTo(n.x+vx*r*.8,n.y+vy*r*.8);ctx.lineTo(n.x-hx*r+vx*r*.65,n.y-hy*r+vy*r*.65);ctx.stroke();}}
 // Boundary fibers follow surviving triangle edges. They never bridge a severed link.
 ctx.lineWidth=.7;ctx.strokeStyle='rgba(247,237,215,.6)';ctx.beginPath();
 for(const bank of surfaceBoundaries()){const e=bank.edge,points=bank.points;ctx.moveTo(points[0].x,points[0].y);for(let j=1;j<points.length;j++)ctx.lineTo(points[j].x,points[j].y);if(e.faces.length===2){const a=points[0],b=points[points.length-1],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;for(let j=1;j<4;j++){const p=points[Math.round((points.length-1)*j/4)],s=(e.id+j)%2?1:-1;ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-dy/len*(1+e.id%2)*s,p.y+dx/len*(1+e.id%2)*s);}}}ctx.stroke();
 renderFixtures();
}
// A fixed world-space combustion texture: moving material never stretches or
// rescales the old flame. The solver's temperature and topology remain untouched.
const fireLimits={edges:480,plumes:1800,sparks:24,ash:24,smoke:18,cells:262144,embers:7200};
let fireStats={hotEdges:0,plumes:0,sparks:0,ash:0,smoke:0,glowSprites:0,embers:0,cells:0,fieldSteps:0,active:false};
// Stylized visual recipes, not statements about real-world fibre chemistry.
const fireProfiles=[
 {name:'cotton',height:1,width:1,density:1,smoke:.55,embers:.65,rise:.85,warm:1,tongues:4},
 {name:'denim',height:.64,width:1.1,density:1.1,smoke:1,embers:.4,rise:.65,warm:.73,tongues:3},
 {name:'gauze',height:.5,width:.48,density:.7,smoke:.12,embers:.12,rise:.85,warm:1.05,tongues:5},
 {name:'stocking',height:.39,width:.4,density:.65,smoke:.18,embers:.07,rise:.8,warm:1.1,tongues:4},
 {name:'silk',height:.57,width:.55,density:.78,smoke:.22,embers:.08,rise:.75,warm:1.13,tongues:3},
 {name:'linen',height:.83,width:.7,density:.94,smoke:.42,embers:1,rise:.9,warm:.94,tongues:6},
 {name:'felt',height:.38,width:1.25,density:.82,smoke:1.2,embers:.3,rise:.5,warm:.65,tongues:2},
 {name:'fishing_net',height:.48,width:.32,density:.85,smoke:.25,embers:.5,rise:.65,warm:.88,tongues:4},
 ...['chain_mail','jelly','slime'].map(name=>({name,height:0,width:0,density:0,smoke:0,embers:0,rise:0,warm:0,tongues:1,thermalOnly:true}))
];
const fireProfileFor=c=>fireProfiles.find(p=>p.name===c.material)||fireProfiles[0];
let firePatchCache=new WeakMap();
let fireClothStats=[];
// Nearby surviving surface and active fuel, measured in world pixels. A local
// 3x3 bin neighbourhood avoids both whole-scene scaling and per-source scans.
function firePatch(c){
 let state=firePatchCache.get(c);if(!state){state={time:-1,bins:new Map(),scales:new Float32Array(c.nodes.length)};firePatchCache.set(c,state);}
 if(c.time-state.time<.1&&state.time>=0)return state;
 const dt=state.time<0?1:Math.max(0,c.time-state.time),blend=1-Math.exp(-dt*7);state.time=c.time;state.bins.clear();
 const area=c.width*c.height*(c.surfaceAreaScale||1)/Math.max(1,c.nodes.length),key=(x,y)=>x+','+y;
 for(const n of c.nodes){if(!n.active||n.burnt)continue;const k=key(Math.floor(n.x/32),Math.floor(n.y/32));let b=state.bins.get(k);if(!b){b={live:0,hot:0};state.bins.set(k,b);}b.live+=area;b.hot+=fireHot(n)?area*clampFire(n.heat):0;}
 let min=1,max=0,total=0,hot=0;
 for(let i=0;i<c.nodes.length;i++){const n=c.nodes[i];if(!fireHot(n))continue;const bx=Math.floor(n.x/32),by=Math.floor(n.y/32);let live=0,burning=0;
  for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++){const b=state.bins.get(key(bx+x,by+y));if(b){live+=b.live;burning+=b.hot;}}
  const target=clampFire(Math.sqrt(Math.max(0,burning))/100,.13,.85)*clampFire(Math.sqrt(live)/85,.2,1)*clampFire(Math.sqrt(c.width*c.height*(c.surfaceAreaScale||1))/310,.35,1);
  state.scales[i]=state.scales[i]?state.scales[i]+(target-state.scales[i])*blend:target;
  min=Math.min(min,state.scales[i]);max=Math.max(max,state.scales[i]);total+=state.scales[i];hot++;
 }
 state.summary={material:c.material,hotNodes:hot,scaleMin:hot?min:0,scaleMax:max,scaleMean:hot?total/hot:0,localSamplingPixels:96};return state;
}
const fireSprites={};
let fireQuality='auto',fireLow=false,fireClock=-1,fireAcc=0,firePhase=0,fireDirty=false;
let fireLayer,fireCtx,firePixels,fireA,fireB,fireMetaA,fireMetaB,fireWind,fireNX=0,fireNY=0,fireScale=2,fireWidth=0,fireHeight=0,fireOX=0,fireOY=-64;
const fireSources=[],fireEdges=[],fireSmoke=[];
let fireSmokeCredit=0,fireSmokeSerial=0;
let fireBounds={left:2,right:2,top:1,bottom:1};
const fireNoise=new Float32Array(128*128);let fireSeed=39417;for(let i=0;i<fireNoise.length;i++){fireSeed=(Math.imul(fireSeed,1664525)+1013904223)>>>0;fireNoise[i]=fireSeed/4294967296;}
const clampFire=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function fireHash(x,y){return fireNoise[((y&127)<<7)|(x&127)];}
function fireValue(x,y){const ix=Math.floor(x),iy=Math.floor(y);let u=x-ix,v=y-iy;u=u*u*(3-2*u);v=v*v*(3-2*v);return (fireHash(ix,iy)*(1-u)+fireHash(ix+1,iy)*u)*(1-v)+(fireHash(ix,iy+1)*(1-u)+fireHash(ix+1,iy+1)*u)*v;}
const fireTurbulence=new Float32Array(256*256);for(let y=0;y<256;y++)for(let x=0;x<256;x++)fireTurbulence[y*256+x]=fireValue(x*.24,y*.13)*.57+fireValue(x*.504+11,y*.273)*.28+fireValue(x*1.008,y*.546+27)*.15;
function fireTurb(x,y){const ix=Math.floor(x),iy=Math.floor(y),u=x-ix,v=y-iy;const row=(iy&255)<<8,next=((iy+1)&255)<<8,l=ix&255,r=(ix+1)&255;return (fireTurbulence[row|l]*(1-u)+fireTurbulence[row|r]*u)*(1-v)+(fireTurbulence[next|l]*(1-u)+fireTurbulence[next|r]*u)*v;}
function clearFire(){
 firePatchCache=new WeakMap();fireClothStats=[];fireSmoke.length=0;fireSmokeCredit=0;
 if(burnAudio)burnAudio.silence();if(fireMetaA)fireMetaA.fill(0);if(fireMetaB)fireMetaB.fill(0);
 if(fireA)fireA.fill(0);if(fireB)fireB.fill(0);if(firePixels)firePixels.data.fill(0);if(fireCtx)fireCtx.clearRect(0,0,fireNX,fireNY);
 fireBounds={left:2,right:2,top:1,bottom:1};fireSources.length=fireEdges.length=0;fireClock=-1;fireAcc=0;fireDirty=false;
 fireStats={hotEdges:0,plumes:0,sparks:0,ash:0,smoke:0,glowSprites:0,embers:0,cells:0,fieldSteps:0,active:false};
}
function ensureFireField(){
 // Same texel density in all quality modes and for all cloth counts. Only an
 // exceptionally large viewport hits this documented 262k-cell safety ceiling.
 const scale=Math.max(2,Math.sqrt((W+4)*(H+92)/(fireLimits.cells-2048))),nx=Math.ceil(W/scale)+2,ny=Math.ceil((H+88)/scale);
 if(nx===fireNX&&ny===fireNY&&scale===fireScale)return;
 fireScale=scale;fireOX=-scale;fireOY=-64;fireWidth=nx*scale;fireHeight=ny*scale;
 if(!fireLayer){fireLayer=document.createElement('canvas');fireCtx=fireLayer.getContext('2d');}
 fireNX=nx;fireNY=ny;fireLayer.width=nx;fireLayer.height=ny;
 fireA=new Float32Array(nx*ny);fireB=new Float32Array(nx*ny);fireMetaA=new Float32Array(nx*ny);fireMetaB=new Float32Array(nx*ny);fireWind=new Float32Array(nx*ny);firePixels=fireCtx.createImageData(nx,ny);
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++)fireWind[y*nx+x]=fireValue(x*scale*.016,y*scale*.016)*2-1;
 fireClock=-1;fireAcc=0;
}
function fireHot(n){return n.active&&!n.burnt&&n.heat>.3&&n.char>.01;}
function fireSprite(kind){
 if(fireSprites[kind])return fireSprites[kind];
 if(kind==='smoke'){
  // Filament-shaped, mottled soot, not a blurred circular blob. Cached once.
  const s=document.createElement('canvas');s.width=s.height=64;const g=s.getContext('2d'),pixels=g.createImageData(64,64);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
   const u=(x-31.5)/31.5,v=(y-31.5)/31.5,edge=Math.max(0,1-u*u-v*v),noise=fireValue(x*.17,y*.21);
   const curl=Math.exp(-Math.pow((u-Math.sin(v*4)*.3)/.43,2));const k=(y*64+x)*4;
   pixels.data[k]=65;pixels.data[k+1]=61;pixels.data[k+2]=57;pixels.data[k+3]=Math.round(255*Math.pow(edge,1.4)*(.25+noise*.75)*(.28+curl*.72));
  }
  g.putImageData(pixels,0,0);return fireSprites[kind]=s;
 }
 const s=document.createElement('canvas');s.width=s.height=64;const g=s.getContext('2d'),r=g.createRadialGradient(32,32,1,32,32,31);
 r.addColorStop(0,kind==='smoke'?'rgba(44,34,28,.2)':'rgba(255,88,6,.24)');r.addColorStop(.4,kind==='smoke'?'rgba(44,34,28,.09)':'rgba(255,62,3,.09)');r.addColorStop(1,'rgba(35,25,20,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return fireSprites[kind]=s;
}
// Detached smoke retains its birth position and dissipates after fuel is gone.
// Exactly 18 live wisps maximum, independent of cloth/node count.
function stepFireSmoke(dt){
 for(let i=fireSmoke.length-1;i>=0;i--){const p=fireSmoke[i];p.age+=dt;if(p.age>=p.life){fireSmoke.splice(i,1);continue;}p.x+=(p.drift+Math.sin(p.age*2.1+p.seed)*5)*dt;p.y-=(p.rise+p.age*5)*dt;}
 const sources=fireSources.filter(s=>s.nodeSource&&fireProfiles[s.profile].smoke>0);
 if(!sources.length){fireSmokeCredit=0;return;}
 // Favor the actual upper burning rim in each local column. Uniform area
 // sampling buried short-lived smoke in the expanding blackened cloth region.
 const rimBins=new Map();for(const s of sources){const key=s.clothIndex+','+Math.floor(s.x/42),old=rimBins.get(key);if(!old||s.y<old.y)rimBins.set(key,s);}
 const rim=Array.from(rimBins.values());
 const weight=sources.reduce((sum,s)=>sum+fireProfiles[s.profile].smoke,0)/sources.length;
 fireSmokeCredit=Math.min(2,fireSmokeCredit+dt*(3+Math.min(7,Math.sqrt(sources.length)))*Math.sqrt(weight));
 while(fireSmokeCredit>=1&&fireSmoke.length<fireLimits.smoke){
  fireSmokeCredit--;const serial=++fireSmokeSerial,pool=serial%5?rim:sources,s=pool[Math.floor(fireHash(serial*17,serial*31)*pool.length)],p=fireProfiles[s.profile],seed=fireHash(serial,37)*6.28;
  fireSmoke.push({x:s.x,y:s.y-4,age:0,life:2.1+fireHash(serial,63)*.9,size:10+s.scale*15,rise:40+s.scale*22,drift:(fireHash(serial,91)-.5)*12,seed,density:Math.min(.48,.17+Math.sqrt(p.smoke)*.22),scale:s.scale});
 }
}
function renderFireSmoke(){
 for(const p of fireSmoke){const age=p.age/p.life,fade=Math.min(1,p.age/.22)*Math.pow(1-age,1.2),size=p.size+p.age*13;
  ctx.globalAlpha=p.density*fade;ctx.drawImage(fireSprite('smoke'),p.x-size*.5,p.y-size*.75,size,size*1.5);fireStats.smoke++;
 }
}
function stepFireField(){
 const nx=fireNX,ny=fireNY,A=fireA,B=fireB,t=++firePhase*.019,unit=3/fireScale,MA=fireMetaA,MB=fireMetaB;B.fill(0);MB.fill(0);
 for(let y=fireBounds.top;y<fireBounds.bottom;y++)for(let x=fireBounds.left;x<fireBounds.right;x++){
  const i=y*nx+x,wx=x*fireScale/3,wy=y*fireScale/3;
  const meta=MA[i],profile=fireProfiles[Math.floor(meta)]||fireProfiles[0],scale=Math.max(.1,(meta%1)*1.01);
  const side=(fireWind[i]*.9+Math.sin(wy*.13+t*2)*.85+Math.sin(wx*.11-wy*.07+t)*.7)*unit*profile.width*scale;
  const sx=clampFire(x-side,1,nx-2),sy=clampFire(y+(1.2+A[i]*.45+Math.sin(wx*.17+t)*.18)*unit*profile.rise*(.4+scale*.6),1,ny-2),ix=sx|0,iy=sy|0,u=sx-ix,v=sy-iy,j=iy*nx+ix;
  const adv=(A[j]*(1-u)+A[j+1]*u)*(1-v)+(A[j+nx]*(1-u)+A[j+nx+1]*u)*v;
  const nearest=(v<.5?iy:iy+1)*nx+(u<.5?ix:ix+1),m=MA[nearest]||meta,p=fireProfiles[Math.floor(m)]||fireProfiles[0],sc=Math.max(.1,(m%1)*1.01);
  B[i]=Math.max(0,adv*.976-.018/(Math.max(.12,sc)*p.height));MB[i]=m;
 }
 for(const s of fireSources){const fx=(s.x-fireOX)/fireScale,fy=(s.y-fireOY)/fireScale,x=Math.round(fx),y=Math.round(fy);if(x<4||y<2||x>=nx-4||y>=ny-2)continue;
  // Spatially coherent travelling fuel variations, not per-node flashing. A
  // persistent base joins neighboring sources into a continuous burning front.
  const p=fireProfiles[s.profile],wave=.5+.5*Math.sin(s.x*.17+s.y*.063+firePhase*.11),pulse=.12+1.25*Math.pow(wave,p.tongues),power=clampFire(s.heat*1.5,0,1.7)*pulse*p.density*(.55+s.scale*.45)*(s.yarn?.8:1),radius=Math.max(1,Math.ceil(3*p.width*(.4+s.scale*.6))),meta=s.profile+Math.min(.98,s.scale/1.01);
  for(let dx=-radius;dx<=radius;dx++){const k=y*nx+x+dx,value=power*(1-Math.abs(dx)/(radius+1));if(value>B[k]){B[k]=value;MB[k]=meta;}if(value*.72>B[k-nx]){B[k-nx]=value*.72;MB[k-nx]=meta;}}

 }
 fireA=B;fireB=A;fireMetaA=MB;fireMetaB=MA;
}
function paintFireField(){
 // The active rectangle only grows until clearFire(). Cells outside it are
 // already transparent; keep identical pixels without rescanning that area.
 const out=firePixels.data,nx=fireNX,{left,right,top,bottom}=fireBounds;for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
  const i=y*nx+x,k=i*4;if(fireA[i]<.12){out[k+3]=0;continue;}
  const wx=x*fireScale/3,wy=y*fireScale/3,n=fireTurb(wx,wy-firePhase*.65),grain=fireTurb(wx*2+37,wy+firePhase*.21+79);
  let h=Math.max(0,fireA[i]-(.08+n*.28));h*=1-clampFire((grain-.48)*4)*.86;if(h<.04){out[k+3]=0;continue;}
  const profile=fireProfiles[Math.floor(fireMetaA[i])]||fireProfiles[0],warm=clampFire((h-.2)*.85*profile.warm);out[k]=255;out[k+1]=Math.min(237,43+warm*235);out[k+2]=Math.max(2,(warm-.78)*380);out[k+3]=Math.min(220,Math.pow(h,.65)*245)*clampFire((fireOY+y*fireScale)/24);
 }fireCtx.putImageData(firePixels,0,0,left,top,right-left,bottom-top);
}
function renderFireGrains(){
 const reduced=fireQuality==='smooth';
 for(let ci=0;ci<cloths.length;ci++){const c=cloths[ci],profile=fireProfileFor(c);if(c.yarnMode)continue;
  for(let fi=0;fi<c.liveFaces.length;fi++){const f=c.liveFaces[fi],a=c.nodes[f.nodes[0]],b=c.nodes[f.nodes[1]],d=c.nodes[f.nodes[2]];
   if(!a.active||!b.active||!d.active||a.burnt||b.burnt||d.burnt||Math.max(a.char,b.char,d.char)<.03)continue;
   const area=Math.abs((b.x-a.x)*(d.y-a.y)-(b.y-a.y)*(d.x-a.x))*.5,samples=Math.min(80,Math.ceil(area/(reduced?9:4)));
   for(let j=0;j<samples&&fireStats.embers<fireLimits.embers;j++){const seed=f.nodes[0]*19+f.nodes[1]*7+f.nodes[2]*3+ci*991;let u=fireHash(seed+j*7,seed),v=fireHash(seed+j*11,seed+43);if(u+v>1){u=1-u;v=1-v;}const w=1-u-v,ch=a.char*w+b.char*u+d.char*v,heat=a.heat*w+b.heat*u+d.heat*v;
    if(ch<.03)continue;const x=a.x*w+b.x*u+d.x*v,y=a.y*w+b.y*u+d.y*v,r=fireHash(seed+j*13,seed+17),activity=profile.embers*clampFire((heat-.28)*1.3)*(.72+.28*Math.sin(c.time*3+x*.07+y*.03));
    ctx.globalAlpha=Math.min(.9,ch*2.8);ctx.fillStyle='#17100b';
    if(activity>.1&&r<activity*.82){ctx.globalAlpha=.5+activity*.45;ctx.fillStyle=r<activity*.055?'#ffed9d':r<activity*.3?'#ffac25':'#ed4e08';}
    // Barycentric point and subpixel grain stay inside the surviving face.
    ctx.fillRect(x,y,.55+r*.7,.45+r*.5);fireStats.embers++;
   }
  }
 }
 for(const {a,b,c,id} of fireEdges){const profile=fireProfileFor(c),len=Math.hypot(b.x-a.x,b.y-a.y),samples=Math.ceil(len/(reduced?2.5:1.3));
  for(let j=0;j<samples&&fireStats.embers<fireLimits.embers;j++){const f=(j+.5)/samples,heat=clampFire((a.heat*(1-f)+b.heat*f-.2)*1.1),r=fireHash(id+j*13,id+19),pulse=.8+.2*Math.sin(c.time*3+id*.07+j*.3);if(r>heat*.9*profile.embers)continue;
   ctx.globalAlpha=heat*pulse;ctx.fillStyle=r<heat*.06?'#ffedaa':r<heat*.35?'#ffac26':'#f45409';const size=c.yarnMode?(c.knotted?1.25:.7):.85;ctx.fillRect(a.x+(b.x-a.x)*f-size/2,a.y+(b.y-a.y)*f-size/2,size,size);fireStats.embers++;
  }
 }
 ctx.globalAlpha=1;
}
function renderFire(){
 const effectStart=typeof performance!=='undefined'?performance.now():0;
 fireStats={hotEdges:0,plumes:0,sparks:0,ash:0,smoke:0,glowSprites:0,embers:0,cells:0,fieldSteps:0,active:false};fireSources.length=fireEdges.length=0;fireClothStats=[];
 for(let ci=0;ci<cloths.length;ci++){
  const c=cloths[ci];if(c.chainMode||c.gelMode){fireClothStats.push({material:c.material,clothIndex:ci,hotNodes:c.nodes.filter(n=>n.active&&n.heat>.12).length,sources:0,scaleMin:0,scaleMax:0,scaleMean:0,profile:{...fireProfileFor(c)}});continue;}const patch=firePatch(c),profile=fireProfiles.indexOf(fireProfileFor(c)),sourceStart=fireSources.length,sourceEnd=Math.floor(fireLimits.plumes*(ci+1)/cloths.length),edgeEnd=Math.floor(fireLimits.edges*(ci+1)/cloths.length);for(let i=0;i<c.nodes.length&&fireSources.length<sourceEnd;i++){const n=c.nodes[i];if(fireHot(n)&&n.x>=0&&n.x<=W&&n.y>=0&&n.y<=H)fireSources.push({x:n.x,y:n.y,heat:n.heat,nodeSource:true,id:i+ci*991,t:c.time,yarn:c.yarnMode,clothIndex:ci,material:c.material,profile,scale:patch.scales[i]||.13});}
  const edges=c.yarnMode?c.liveEdges:c.boundaryEdges;
  for(const e of edges){if(fireEdges.length>=edgeEnd)break;if(c.yarnMode&&!e.yarn)continue;const a=c.nodes[e.a],b=c.nodes[e.b];
   if(!a.active||!b.active||a.burnt||b.burnt||Math.min(a.heat,b.heat)<.18||(!fireHot(a)&&!fireHot(b)))continue;
   fireEdges.push({a,b,c,id:e.a*13+e.b+ci*991});
   const steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/3);for(let j=1;j<steps&&fireSources.length<sourceEnd;j++){const f=j/steps,x=a.x+(b.x-a.x)*f,y=a.y+(b.y-a.y)*f;if(x<0||x>W||y<0||y>H)continue;fireSources.push({x,y,heat:a.heat+(b.heat-a.heat)*f,id:e.a*31+e.b*7+j+ci*991,t:c.time,yarn:c.yarnMode,clothIndex:ci,material:c.material,profile,scale:(patch.scales[e.a]||.13)*(1-f)+(patch.scales[e.b]||.13)*f});}
  }
  fireClothStats.push({...patch.summary,clothIndex:ci,sources:fireSources.length-sourceStart,profile:{...fireProfiles[profile]}});
 }
 if(burnAudio&&!muted&&!document.hidden){
  let total=0,x=0,body=0,cutoff=0,crackle=0;
  for(const s of fireSources){if(!s.nodeSource)continue;const w=s.scale*clampFire(s.heat),p=window.ClothBurnAudio.profiles[s.material]||window.ClothBurnAudio.profiles.cotton;total+=w;x+=s.x*w;body+=p.body*w;cutoff+=p.cutoff*w;crackle+=p.crackle*w;}
  burnAudio.update(clampFire(total/90),total?{body:body/total,cutoff:cutoff/total,crackle:crackle/total}:material,0,total?clampFire(x/total/Math.max(1,W)*2-1,-1,1):0);
 }
 if(fireSources.length>fireLimits.plumes)fireSources.length=fireLimits.plumes;
 if(!fireSources.length&&!fireDirty&&!fireSmoke.length)return;
 ensureFireField();
 // Grow a calculation window in fixed world coordinates. It never shrinks or
 // remaps while a burn is active, so old trails remain temporally coherent.
 let left=fireNX-3,right=2,top=fireNY-3,bottom=1;
 for(const source of fireSources){const p=fireProfiles[source.profile],side=16+35*source.scale*p.width,up=24+110*source.scale*p.height;left=Math.min(left,Math.floor((source.x-fireOX-side)/fireScale));right=Math.max(right,Math.ceil((source.x-fireOX+side)/fireScale));top=Math.min(top,Math.floor((source.y-fireOY-up)/fireScale));bottom=Math.max(bottom,Math.ceil((source.y-fireOY+12)/fireScale));}
 fireBounds={left:Math.max(2,fireDirty?Math.min(left,fireBounds.left):left),right:Math.min(fireNX-2,Math.max(right,fireBounds.right)),top:Math.max(1,fireDirty?Math.min(top,fireBounds.top):top),bottom:Math.min(fireNY-2,Math.max(bottom,fireBounds.bottom))};
 fireDirty=true;const now=cloths[0].time,dt=fireClock<0?1/30:Math.max(0,Math.min(.1,now-fireClock));fireClock=now;fireAcc+=dt;stepFireSmoke(dt);
 let steps=0;while(fireAcc>=1/30&&steps<2){stepFireField();fireAcc-=1/30;steps++;}if(steps===2)fireAcc=Math.min(fireAcc,1/30);if(steps)paintFireField();
 if(!fireSources.length&&!fireSmoke.length&&!fireA.some(v=>v>.12)){clearFire();return;}
 fireStats.active=true;fireStats.hotEdges=fireEdges.length;fireStats.plumes=fireSources.length;fireStats.cells=fireNX*fireNY;fireStats.fieldSteps=steps;fireStats.activeCells=(fireBounds.right-fireBounds.left)*(fireBounds.bottom-fireBounds.top);
 ctx.save();ctx.lineCap='round';
 // Sparse, softly fading airborne particles are secondary to the continuous
 // flame. They no longer erupt in synchronized three-spark trains per node.
 renderFireSmoke();
 ctx.globalAlpha=.9;ctx.imageSmoothingEnabled=true;ctx.drawImage(fireLayer,fireOX,fireOY,fireWidth,fireHeight);
 renderFireGrains();
 for(let i=0;i<fireSources.length;i+=Math.max(1,Math.ceil(fireSources.length/(fireQuality==='smooth'?10:24)))){
  const s=fireSources[i],p=fireProfiles[s.profile],age=(s.t*.43+s.id*.137)%1,vx=Math.sin(s.id*7.1)*25*s.scale,x=s.x+vx*age,y=s.y-age*75*s.scale;ctx.globalAlpha=Math.sin(age*Math.PI)*.6*p.embers*s.scale;ctx.lineWidth=.6;ctx.strokeStyle='#ff9c38';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-vx*.03,y+2.5);ctx.stroke();fireStats.sparks++;
  ctx.globalAlpha=Math.sin(age*Math.PI)*.45*p.embers*s.scale;ctx.fillStyle='#30251e';ctx.fillRect(s.x+Math.sin(s.id*3.7)*age*29,s.y+12+age*age*85,1,1.5);fireStats.ash++;
 }
 ctx.restore();fireStats.effectMs=typeof performance!=='undefined'?performance.now()-effectStart:0;
}
const perf={frames:0,start:0,fps:0,frameMs:0,drawMs:0,slow:0,show:false,maxFrameMs:0,periodMax:0,effectMs:0};
const qualityControl=document.querySelector('#fireQuality'),meterToggle=document.querySelector('#performanceToggle'),meter=document.querySelector('#performanceMeter');
if(qualityControl)qualityControl.addEventListener('change',e=>{fireQuality=e.target.value;fireLow=false;clearFire();});
if(meterToggle)meterToggle.addEventListener('click',()=>{perf.show=!perf.show;meterToggle.setAttribute('aria-pressed',String(perf.show));if(meter)meter.hidden=!perf.show;});
function reportPerformance(t,delta,drawMs){
 perf.periodMax=Math.max(perf.periodMax,delta);perf.effectMs=perf.effectMs*.9+(fireStats.effectMs||0)*.1;perf.frames++;if(!perf.start)perf.start=t;perf.frameMs=perf.frameMs*.94+delta*.06;perf.drawMs=perf.drawMs*.94+drawMs*.06;
 if(fireStats.active&&perf.frameMs>21)perf.slow++;else perf.slow=Math.max(0,perf.slow-1);
 // Automatic mode preserves the reference appearance; no hidden resolution downgrade.
 if(t-perf.start>=750){perf.fps=Math.round(perf.frames*1000/(t-perf.start));perf.frames=0;perf.start=t;perf.maxFrameMs=perf.periodMax;perf.periodMax=0;
  if(perf.show&&meter)meter.textContent=`${perf.fps} FPS · 帧间隔 ${perf.frameMs.toFixed(1)} ms · 最长 ${perf.maxFrameMs.toFixed(1)} ms · 火焰计算 ${perf.effectMs.toFixed(1)} ms · 火焰 ${fireStats.active?fireNX+'×'+fireNY:'待机'} · ${fireQuality==='smooth'?'精简粒子':'原貌'}`;
 }
}

// Supports are drawn behind the live mesh. Its true solver depth supplies the
// cloth's lighting, so the dome remains tangible even before a hole exposes it.
let environmentLayer=null,environmentKey='',environmentBuilds=0;
function renderEnvironment(){
 const c=cloths[0],e=c.environment;if(!e)return;
 if(e.type==='flag'){drawEnvironment();return;}
 // Static supports are rasterized once at the exact display DPR. Cloth and
 // all effects remain live; resizing or geometry changes invalidate this cache.
 const dpr=canvasDpr*viewScale,key=[W,H,dpr,JSON.stringify(e)].join('|');
 if(!environmentLayer)environmentLayer=document.createElement('canvas');
 if(key!==environmentKey){environmentBuilds++;environmentLayer.width=Math.round(W*dpr);environmentLayer.height=Math.round(H*dpr);const main=ctx;ctx=environmentLayer.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);try{drawEnvironment();}finally{ctx=main;}environmentKey=key;}
 ctx.drawImage(environmentLayer,0,0,W,H);
}
function drawEnvironment(){
 const c=cloths[0],e=c.environment;if(!e)return;
 ctx.save();
 if(e.type==='flag'){
  const poleX=c.x-5,bottom=Math.min(H-28,c.y+c.height+75);
  const pole=ctx.createLinearGradient(poleX-4,0,poleX+4,0);pole.addColorStop(0,'#8a8e80');pole.addColorStop(.45,'#d5d7c8');pole.addColorStop(1,'#767d70');
  ctx.fillStyle=pole;ctx.beginPath();ctx.roundRect(poleX-4,c.y-25,8,bottom-c.y+25,4);ctx.fill();
  ctx.fillStyle='#7c8876';ctx.beginPath();ctx.arc(poleX,c.y-28,6,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#b6bcad';ctx.beginPath();ctx.ellipse(poleX,bottom+3,30,5,0,0,Math.PI*2);ctx.fill();
  // A few coherent streamlines convey direction without a particle system.
  ctx.strokeStyle='rgba(139,159,159,.25)';ctx.lineWidth=1.2;ctx.beginPath();
  for(let i=0;i<4;i++){const x=c.x-100+(c.time*24+i*41)%90,y=c.y+15+i*c.height*.24;ctx.moveTo(x,y);ctx.bezierCurveTo(x+12,y-4,x+26,y+4,x+42,y);}
  ctx.stroke();
 }else{
  const p=(x,y,z)=>projectPoint({x,y,z},c),left=e.minX-9,right=e.maxX+9,top=e.minY-9,bottom=e.maxY+9;
  const height=(x,y)=>e.type==='slope'?c.supportHeight(x,y):e.planeZ;
  const corners=[[left,top],[right,top],[right,bottom],[left,bottom]].map(([x,y])=>p(x,y,height(x,y)));
  const polygon=points=>{ctx.beginPath();points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();};
  // Front and right edge are true world-space extrusions, not a decorative tilt.
  for(const ids of [[1,2],[2,3]]){const a=corners[ids[0]],b=corners[ids[1]];polygon([a,b,{x:b.x,y:b.y+17},{x:a.x,y:a.y+17}]);ctx.fillStyle=ids[0]===1?'#a5aa98':'#bbc0ad';ctx.fill();}
  const surface=ctx.createLinearGradient(corners[0].x,corners[0].y,corners[2].x,corners[2].y);surface.addColorStop(0,e.type==='slope'?'#e9deca':'#f0eee2');surface.addColorStop(1,e.type==='slope'?'#c3b99f':'#d9dfce');
  polygon(corners);ctx.fillStyle=surface;ctx.fill();ctx.strokeStyle='rgba(118,126,103,.44)';ctx.lineWidth=1;ctx.stroke();
  // Low-contrast grid and front lip reveal actual depth even under translucent gel.
  ctx.strokeStyle='rgba(115,133,111,.13)';ctx.beginPath();
  for(let i=1;i<9;i++){const x=left+(right-left)*i/9,a=p(x,top,height(x,top)),b=p(x,bottom,height(x,bottom));ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);}
  for(let i=1;i<7;i++){const y=top+(bottom-top)*i/7,a=p(left,y,height(left,y)),b=p(right,y,height(right,y));ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);}ctx.stroke();
  if(e.type==='sphere'){
   // Tessellate the actual supported spherical cap with the exact same camera.
   // Latitude strips are painter-sorted; the hidden lower hemisphere stays under the table.
   const radius=e.radius,visible=Math.sqrt(Math.max(0,radius*radius-(e.planeZ-e.centerZ)**2)),cells=[];
   for(let row=0;row<12;row++)for(let col=0;col<36;col++){
    const points=[];for(const [rr,cc] of [[row,col],[row,col+1],[row+1,col+1],[row+1,col]]){const r=visible*rr/12,a=cc/36*Math.PI*2,x=e.cx+Math.cos(a)*r,y=e.cy+Math.sin(a)*r;points.push(p(x,y,e.centerZ+Math.sqrt(Math.max(0,radius*radius-r*r))));}
    const a=(col+.5)/36*Math.PI*2,r=visible*(row+.5)/12,nz=Math.sqrt(Math.max(0,radius*radius-r*r))/radius,light=Math.max(0,Math.min(1,.6+nz*.34-Math.cos(a)*r/radius*.22-Math.sin(a)*r/radius*.18));
    cells.push({points,depth:points.reduce((n,q)=>n+q.depth,0),shade:Math.round(156+light*76)});
   }
   cells.sort((a,b)=>a.depth-b.depth);for(const cell of cells){polygon(cell.points);ctx.fillStyle=`rgb(${cell.shade},${cell.shade+6},${cell.shade-4})`;ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=.7;ctx.fill();ctx.stroke();}
  }

 }
 ctx.restore();
}

function render(){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.restore();if(!cloths.length)return;ctx.save();if(cloths[0].projectPoint)ctx.globalAlpha=0;ctx.translate(0,H*.86);ctx.scale(1,.1);ctx.translate(0,-H*.86);ctx.fillStyle=floor;ctx.fillRect(0,0,W,H*10);ctx.restore();
 renderEnvironment();
 if(cloths[0].gelMode&&!cloths[0].environment){const y=cloths[0].gelFloor;ctx.fillStyle='rgba(154,167,160,.09)';ctx.beginPath();ctx.roundRect(14,y,W-28,13,5);ctx.fill();ctx.strokeStyle='rgba(118,139,130,.42)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(16,y-7);ctx.lineTo(16,y);ctx.lineTo(W-16,y);ctx.lineTo(W-16,y-7);ctx.stroke();}
 ctx.strokeStyle='#92917b';ctx.lineWidth=2;ctx.beginPath();
 if(scene==='line'){ctx.moveTo(12,cloths[0].y-24);ctx.quadraticCurveTo(W/2,cloths[0].y-14,W-12,cloths[0].y-24);}
 if(scene==='curtain'){const c=cloths[0];ctx.moveTo(c.x-20,c.y-8);ctx.lineTo(c.x+c.width+20,c.y-8);}
 if(scene==='frame'){const c=cloths[0];ctx.rect(c.x-6,c.y-6,c.width+12,c.height+12);ctx.lineWidth=9;ctx.strokeStyle='#a18d70';}ctx.stroke();
 const chosen=cloth,worldCloths=cloths,views=cloths.map(renderView);for(const c of views){cloth=c;renderCloth();}cloth=chosen;
 cloths=views;try{renderFire();}finally{cloths=worldCloths;}

 if(toolPoint&&(tool==='paint'||tool==='fire')){ctx.strokeStyle='#7a6d5d88';ctx.lineWidth=1;ctx.beginPath();ctx.arc(toolPoint.x,toolPoint.y,tool==='paint'?brushSize:24,0,Math.PI*2);ctx.stroke();}
}
let frameHandle=null;
function scheduleFrame(){if(!document.hidden&&frameHandle===null)frameHandle=requestAnimationFrame(frame);}
function frame(t){frameHandle=null;if(document.hidden){last=0;return;}const delta=last?t-last:16.7,started=typeof performance!=='undefined'?performance.now():0;if(last)acc+=Math.min((t-last)/1000,.08);let steps=0;while(acc>=1/60&&steps<5){for(const c of cloths){if(toolPoint&&tool==='fire')c.heatAt(toolPoint.x,toolPoint.y,24,1/60);if(toolPoint&&tool==='paint')c.paintAt(toolPoint.x,toolPoint.y,brushSize,paintColor,1/60);c.updateEffects(1/60);c.step();if(gelAudio&&c.gelMode)gelAudio.observeMotion(c);}acc-=1/60;steps++;}for(const c of cloths)c.pruneBelow(H+220);if(gelAudio)gelAudio.update(Math.min(delta/1000,.1));render();reportPerformance(t,delta,typeof performance!=='undefined'?performance.now()-started:0);last=t;scheduleFrame();}
document.addEventListener('visibilitychange',()=>{release();last=0;acc=0;perf.frames=0;perf.start=0;perf.periodMax=0;if(document.hidden){if(frameHandle!==null&&typeof window.cancelAnimationFrame==='function'){window.cancelAnimationFrame(frameHandle);frameHandle=null;}if(gelAudio)gelAudio.stop();if(burnAudio)burnAudio.silence(true);if(audio)audio.suspend().catch(()=>{});}else scheduleFrame();});
let resizeTimer;function queueResize(){pointerRect=null;clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,120);}
window.addEventListener('resize',queueResize);
window.addEventListener('scroll',()=>{pointerRect=null;},true);
if(typeof window.ResizeObserver==='function'){const observer=new window.ResizeObserver(queueResize);observer.observe(canvas);}
window.__clothDebug={getSurfaceStats:()=>surfaceMesh?.stats||null,getEnvironmentCache:()=>({builds:environmentBuilds,width:environmentLayer?.width||0,height:environmentLayer?.height||0,dpr:Math.min(window.devicePixelRatio||1,2)}),projectPoint:(n,i=0)=>projectPoint(n,cloths[i]),unprojectPoint:(x,y,z=0,i=0)=>unprojectPoint(x,y,z,cloths[i]),getProjectedNodes:(i=0)=>cloths[i].nodes.map(n=>projectPoint(n,cloths[i])),getMaterials:()=>Object.keys(Cloth.MATERIALS),getCloths:()=>cloths,getFireProfiles:()=>fireProfiles.map(p=>({...p})),getFireClothStats:()=>fireClothStats.map(c=>({...c})),getGelAudio:()=>gelAudio?gelAudio.stats():null,getBurnAudio:()=>burnAudio?burnAudio.stats():null,getFireSources:()=>fireSources.map(s=>({...s})),getFireField:()=>({maximum:fireA?fireA.reduce((m,v)=>Math.max(m,v),0):0,nonzero:fireA?fireA.reduce((m,v)=>m+Number(v>.001),0):0,x:fireOX,y:fireOY,width:fireWidth,height:fireHeight,texelSize:fireScale,stableWorldGrid:true}),getStats:()=>({audio:{ripEvents,gel:gelAudio?gelAudio.stats():null,burn:burnAudio?burnAudio.stats():null},fire:{...fireStats,cacheSize:Object.keys(fireSprites).length,limits:fireLimits,quality:fireQuality,effectiveQuality:fireQuality==='smooth'||fireLow?'smooth':'clear',width:fireNX,height:fireNY,texelSize:fireScale,stableWorldGrid:true,finite:!fireA||fireA.every(Number.isFinite),fps:perf.fps,frameMs:perf.frameMs,drawMs:perf.drawMs,effectMs:perf.effectMs,maxFrameMs:perf.maxFrameMs},nodes:cloth.nodes.filter(n=>n.active).length,faces:cloth.faces.filter(f=>f.alive).length,edges:cloth.edges.filter(e=>e.alive).length,material:cloth.material,gel:{components:cloth.gelComponents?cloth.gelComponents.length:0,healed:cloth.healedCount||0,floor:cloth.gelFloor},breaks:cloth.breakCount,grabbed:!!cloth.grab,pins:cloth.nodes.filter(n=>n.pin).map(n=>({x:n.x,y:n.y})),bounds:{x:cloth.x,y:cloth.y,width:cloth.width,height:cloth.height},finite:cloth.nodes.every(n=>Number.isFinite(n.x)&&Number.isFinite(n.y)&&Number.isFinite(n.z)),depth:Math.max(...cloth.nodes.filter(n=>n.active).map(n=>n.z))-Math.min(...cloth.nodes.filter(n=>n.active).map(n=>n.z)),clips:cloth.clips,muted,scene,tool,clothCount:cloths.length,pointerActive:pointer!==null,clipDragging:!!(clipGesture&&clipGesture.dragging),environment:cloth.environment||null,totalNodes:cloths.reduce((n,c)=>n+c.nodes.length,0),burning:cloths.reduce((n,c)=>n+c.nodes.filter(n=>n.heat>.55).length,0),painted:cloths.reduce((n,c)=>n+c.nodes.filter(n=>n.paintA>.01).length,0)})};
window.__clothDebug.getViewport=()=>({width:viewportW,height:viewportH,worldWidth:W,worldHeight:H,scale:viewScale,x:viewX,y:viewY,dpr:canvasDpr});
resize();scheduleFrame();
})();
