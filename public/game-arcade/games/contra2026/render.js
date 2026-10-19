import * as THREE from '../../vendor/three/build/three.module.js';
import {texture,skyTexture} from './art.js?v=20261018-r1';

// Filmic, locally generated art direction; no remote assets during play.
const C = { steel:'#53616a', dark:'#17242c', pale:'#b0b8af', edge:'#87989c', blue:'#48686f', blueDark:'#253842', ice:'#9ed5de', coral:'#df7651', skin:'#d3a782', cyan:'#94c5bd', gold:'#edb765' };
const PALETTES = {
  jungle: {sky:'#253e45',fog:'#7a9596',ground:'#455653',top:'#798570',accent:'#e7af61'},
  base: {sky:'#111a25',fog:'#1b2d38',ground:'#394a52',top:'#78898b',accent:'#74aeb7'},
  waterfall: {sky:'#2d4b57',fog:'#5a7b80',ground:'#46564f',top:'#79906e',accent:'#9ccdc3'},
  base2: {sky:'#171c27',fog:'#252c3a',ground:'#404551',top:'#7d8794',accent:'#d5a274'},
  snow: {sky:'#647a89',fog:'#8fabb5',ground:'#687c86',top:'#c4d6d5',accent:'#e7b26d'},
  energy: {sky:'#3a3330',fog:'#68574a',ground:'#4f504a',top:'#8e8973',accent:'#e5a05d'},
  hangar: {sky:'#2c3842',fog:'#4e6270',ground:'#43515b',top:'#8e9a9c',accent:'#dbb763'},
  alien: {sky:'#211b28',fog:'#483944',ground:'#58424e',top:'#938175',accent:'#c0bd7f'},
};
const clamp = THREE.MathUtils.clamp;
function random(seed) { let a = seed >>> 0; return () => { a += 0x6d2b79f5; let t = Math.imul(a ^ a >>> 15, a | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false, powerPreference:'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.26;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-16,16,9,-9,.1,180);
    this.baseCamera = new THREE.PerspectiveCamera(48,1,.1,150);
    this.geo = new Map(); this.mat = new Map(); this.labels = new Map(); this.levelMaterials=[];
    this.units = new Map(); this.bullets = new Map(); this.pickups = new Map(); this.bulletPool = [];
    this.platformMeshes = []; this.hazardMeshes = []; this.animate = [];
    this.tmp = new THREE.Vector3(); this.matrix = new THREE.Matrix4(); this.color = new THREE.Color();
    this.ambient=new THREE.HemisphereLight('#cedde2','#50615b',2.15);this.scene.add(this.ambient);
    this.sun = new THREE.DirectionalLight('#fff1d6',2.7);
    this.sun.position.set(-16,30,24); this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1536,1536); this.sun.shadow.camera.left=-24; this.sun.shadow.camera.right=24;
    this.sun.shadow.camera.top=23; this.sun.shadow.camera.bottom=-23;
    this.sun.shadow.camera.near=1; this.sun.shadow.camera.far=110;
    this.sun.shadow.normalBias=.035; this.sun.shadow.bias=-.0002;
    this.scene.add(this.sun, this.sun.target);
    this.fill = new THREE.DirectionalLight('#8db7cf',1.1); this.fill.position.set(5,8,15); this.scene.add(this.fill);
    this.world = new THREE.Group(); this.dynamic = new THREE.Group(); this.scene.add(this.world,this.dynamic);
    this.particleCount=700;
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(this.particleCount*3),3));
    pg.setAttribute('color',new THREE.BufferAttribute(new Float32Array(this.particleCount*3),3));
    this.particleMaterial=new THREE.PointsMaterial({size:.12,vertexColors:true,transparent:true,opacity:.9,sizeAttenuation:true,depthWrite:false});
    this.particleSystem=new THREE.Points(pg,this.particleMaterial); this.particleSystem.frustumCulled=false; this.scene.add(this.particleSystem);
    this.resize();
  }
  geometry(type='box') {
    if(this.geo.has(type)) return this.geo.get(type);
    let g;
    if(type==='sphere') g=new THREE.SphereGeometry(.5,12,8);
    else if(type==='muscle') g=new THREE.SphereGeometry(.5,10,8);
    else if(type==='limb') g=new THREE.CylinderGeometry(.40,.5,1,10);
    else if(type==='torso') {const pts=[new THREE.Vector2(.32,-.5),new THREE.Vector2(.37,-.3),new THREE.Vector2(.49,.15),new THREE.Vector2(.5,.33),new THREE.Vector2(.34,.5)];g=new THREE.LatheGeometry(pts,12);}
    else if(type==='plane') g=new THREE.PlaneGeometry(1,1);
    else if(type==='rock') g=new THREE.DodecahedronGeometry(.5,0);
    else if(type==='slab') {const sh=new THREE.Shape();sh.moveTo(-.5,.35);sh.lineTo(-.24,.5);sh.lineTo(.29,.4);sh.lineTo(.5,.13);sh.lineTo(.38,-.35);sh.lineTo(.03,-.5);sh.lineTo(-.42,-.28);sh.closePath();g=new THREE.ExtrudeGeometry(sh,{depth:.85,bevelEnabled:false});g.translate(0,0,-.425);}
    else if(type==='cylinder') g=new THREE.CylinderGeometry(.5,.5,1,12);
    else if(type==='cone') g=new THREE.ConeGeometry(.5,1,6);
    else if(type==='ring') g=new THREE.TorusGeometry(.5,.085,5,24);
    else if(type==='beam') g=new THREE.CylinderGeometry(.5,.5,1,6);
    else if(type==='armor') {
      const shape=new THREE.Shape(), e=.065;
      shape.moveTo(-.5+e,-.5); shape.lineTo(.5-e,-.5); shape.lineTo(.5,-.5+e); shape.lineTo(.5,.5-e); shape.lineTo(.5-e,.5); shape.lineTo(-.5+e,.5); shape.lineTo(-.5,.5-e); shape.lineTo(-.5,-.5+e); shape.closePath();
      g=new THREE.ExtrudeGeometry(shape,{depth:.87,bevelEnabled:true,bevelThickness:.065,bevelSize:.02,bevelSegments:1,steps:1,curveSegments:1});
      g.translate(0,0,-.435); g.computeVertexNormals();
    } else g=new THREE.BoxGeometry(1,1,1);
    this.geo.set(type,g); return g;
  }
  material(color,glow=0,opacity=1) {
    const key=`${color}/${glow}/${opacity}`;
    if(!this.mat.has(key)) this.mat.set(key,new THREE.MeshStandardMaterial({color,emissive:glow?color:'#000000',emissiveIntensity:glow,roughness:.74,metalness:.15,flatShading:false,transparent:opacity<1,opacity,depthWrite:opacity>=1}));
    return this.mat.get(key);
  }
  mesh(parent,x,y,z,w,h,d,color,type='box',glow=0,opacity=1) {
    let mat=this.material(color,glow,opacity);
    if(!glow&&opacity===1&&['box','armor','rock','slab'].includes(type)) {const kind=[C.steel,C.dark,C.edge,C.pale].includes(color)?'metal':color===this.palette?.ground?(this.theme==='alien'?'organic':'rock'):color===this.palette?.top?(this.theme==='snow'?'ice':'earth'):null;if(kind)mat=this.surface(color,kind,Math.max(1,Math.min(12,Math.ceil(w/(kind==='metal'?3:2.3)))));}
    const m=new THREE.Mesh(this.geometry(type),mat);
    m.position.set(x,y,z); m.scale.set(w,h,d); m.castShadow=opacity>=1; m.receiveShadow=true; parent.add(m); return m;
  }
  surface(color,kind,repeat=1) {
    const key=`surface/${color}/${kind}/${repeat}`;
    if(!this.mat.has(key)){const map=texture(kind).clone();map.repeat.set(repeat,1);map.needsUpdate=true;const mat=new THREE.MeshStandardMaterial({color,map,roughness:kind==='metal'?.65:.94,metalness:kind==='metal'?.42:.04});mat.userData.ownTexture=true;this.mat.set(key,mat);}
    return this.mat.get(key);
  }
  spritePlane(parent,x,y,z,w,h,kind,color,opacity=1) {
    const key=`sprite/${kind}/${color}/${opacity}`;
    if(!this.mat.has(key))this.mat.set(key,new THREE.MeshBasicMaterial({map:texture(kind),color,transparent:true,opacity,depthWrite:opacity===1,alphaTest:opacity===1?.2:.005,side:THREE.DoubleSide}));
    const m=new THREE.Mesh(this.geometry('plane'),this.mat.get(key));m.position.set(x,y,z);m.scale.set(w,h,1);parent.add(m);return m;
  }
  pipe(parent,a,b,r,color=C.steel) {
    const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);
    const m=this.mesh(parent,...av.clone().add(bv).multiplyScalar(.5).toArray(),r,delta.length(),r,color,'cylinder');m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;
  }
  sign(parent,text,x,y,z,w=3,h=.6,color='#b8c5c1') {
    const key=`sign/${text}/${color}`;
    if(!this.labels.has(key)){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#142128';ctx.fillRect(0,0,512,128);ctx.fillStyle=color;ctx.font='700 68px Arial';ctx.textBaseline='middle';ctx.textAlign='center';ctx.fillText(text,256,66,476);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;this.labels.set(key,new THREE.MeshBasicMaterial({map:t}));}
    const m=new THREE.Mesh(this.geometry('plane'),this.labels.get(key));m.position.set(x,y,z);m.scale.set(w,h,1);parent.add(m);return m;
  }
  group(parent,x=0,y=0,z=0) { const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g; }
  badge(parent,type) {
    const text=type==='life'?'+':String(type||'?').slice(0,1);
    if(!this.labels.has(text)) {
      const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
      const ctx=canvas.getContext('2d');ctx.font='900 48px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff9e3';ctx.fillText(text,32,35);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
      this.labels.set(text,new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));
    }
    const badge=new THREE.Sprite(this.labels.get(text));badge.position.set(0,0,.39);badge.scale.set(.44,.44,1);parent.add(badge);
  }
  resize() {
    const w=Math.max(1,this.canvas.clientWidth||this.canvas.width||960),h=Math.max(1,this.canvas.clientHeight||this.canvas.height||540);
    this.width=w;this.height=h;this.aspect=w/h;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,this.quality==='low'?1:1.5));
    this.renderer.setSize(w,h,false);
    const v=this.aspect<1?18:this.level?.mode==='vertical'?17.5:12.5;
    this.camera.left=-v*this.aspect/2;this.camera.right=v*this.aspect/2;this.camera.top=v/2;this.camera.bottom=-v/2;this.camera.updateProjectionMatrix();
    this.baseCamera.aspect=this.aspect;this.baseCamera.updateProjectionMatrix();
  }
  setLevel(level) {
    this.level=level;this.theme=level.theme||'jungle';this.palette={...level.palette,...PALETTES[this.theme]};
    this.world.traverse(m=>{if(m.isInstancedMesh)m.dispose();});
    for(const m of this.levelMaterials)m.dispose();this.levelMaterials=[];
    this.world.clear();this.dynamic.clear();this.units.clear();this.bullets.clear();this.pickups.clear();this.bulletPool.length=0;
    this.platformMeshes=[];this.hazardMeshes=[];this.animate=[];this.bossMesh=null;this.checkpointMeshes=[];this.mistLayers=[];this.matte=null;
    this.water=null;this.waterLines=[];this.waterfalls=[];this.shield=null;this.baseGrid=[];
    if(this.sky)this.sky.dispose();this.sky=skyTexture(this.theme);this.scene.background=this.sky;
    this.ambient.intensity=['base','base2','alien'].includes(this.theme)?2.15:2.15;this.sun.intensity=this.theme==='snow'?2.35:2.7;
    this.scene.fog=new THREE.Fog(this.palette.fog,38,110);
    this.rng=random((level.index||0)*713+this.theme.length*3701+17);
    if(level.mode==='base')this.buildBase();else this.buildLandscape();
    if(['jungle','waterfall'].includes(this.theme))this.buildMatte();
    for(const p of level.platforms||[])this.platformMeshes.push(this.makePlatform(p));
    for(const h of level.hazards||[])this.hazardMeshes.push(this.makeHazard(h));
    this.buildCheckpoints();
    this.batchStatic();
    this.particleSystem.geometry.setDrawRange(0,0);
    this.resize();
  }
  batchStatic() {
    // Trees, stones and architecture share geometry; instance them into a few draws.
    this.world.updateMatrixWorld(true);
    const batches=new Map();
    this.world.traverse(m=>{ if(!m.isMesh)return;const key=`${m.geometry.uuid}/${m.material.uuid}/${m.castShadow}`;let b=batches.get(key);if(!b)batches.set(key,b={geometry:m.geometry,material:m.material,cast:m.castShadow,matrices:[]});b.matrices.push(m.matrixWorld.clone()); });
    this.world.clear();
    for(const b of batches.values()) { const m=new THREE.InstancedMesh(b.geometry,b.material,b.matrices.length);b.matrices.forEach((matrix,i)=>m.setMatrixAt(i,matrix));m.castShadow=b.cast;m.receiveShadow=true;this.world.add(m); }
  }
  tree(x,y,z,s=1,snow=false) {
    const tint=snow?'#607b7c':z<-12?'#4e7069':'#3c5e4e';
    const m=this.spritePlane(this.world,x,y+4.8*s,z,6.8*s,10*s,'tree',tint);m.rotation.y=(this.rng()-.5)*.35;
    if(snow)this.spritePlane(this.world,x-.04,y+4.86*s,z+.02,6.8*s,10*s,'tree','#9db3ae',.18);
    if(z>-13){this.mesh(this.world,x,y+1.3*s,z,.22*s,2.6*s,.26*s,'#4f5145','limb');this.fern(x+.4,y,z+.2,s*.8);}
  }
  fern(x,y,z,s=1) {
    const m=this.spritePlane(this.world,x,y+.35*s,z,1.5*s,.85*s,'fern',this.theme==='snow'?'#7f9794':'#526d4b');m.rotation.y=(this.rng()-.5)*.4;
  }
  palm(x,y,z,s=1) { this.tree(x,y,z,s); }
  rock(x,y,z,s=1,color=this.palette.ground) {
    const m=this.mesh(this.world,x,y+s*.4,z,s*1.7,s,s*1.3,color,'rock');m.rotation.set(.2,this.rng()*6,.14);return m;
  }
  ridge(length,z,y,color,seed=0) {
    const shape=new THREE.Shape();shape.moveTo(-40,-15);
    const heights=[];for(let x=-40;x<length+70;x+=4)heights.push([x,y+Math.sin(x*.031+seed)*5+Math.sin(x*.095+seed)*1.3+this.rng()*.8]);
    for(const [x,h] of heights)shape.lineTo(x,h);shape.lineTo(length+70,-15);shape.closePath();
    const geo=new THREE.ShapeGeometry(shape);if(this.geo.has(`ridge${z}`))this.geo.get(`ridge${z}`).dispose();this.geo.set(`ridge${z}`,geo);const m=new THREE.Mesh(geo,this.material(color));m.position.z=z;this.world.add(m);
  }
  bunker(x,y,z,variant=0) {
    const g=this.group(this.world,x,y,z),p=this.palette;g.scale.set(.78,.86,.82);
    this.mesh(g,0,1.5,0,6.4,3.2,4.7,'#48534f','armor');this.mesh(g,0,3.05,0,6.8,.35,5,C.steel,'armor');
    this.mesh(g,0,1.4,2.39,3.3,2.4,.14,C.dark,'armor');
    this.mesh(g,0,1.4,2.48,2.5,2.15,.12,'#36444b','armor');
    for(let j=0;j<6;j++)this.mesh(g,0,.45+j*.34,2.57,2.45,.07,.08,'#74817f');
    for(const side of [-1,1]){this.mesh(g,side*1.48,1.45,2.57,.28,2.55,.32,C.edge,'armor');for(let j=0;j<4;j++){const stripe=this.mesh(g,side*1.5,.35+j*.35,2.76,.22,.13,.025,j%2?'#26343b':'#b4a575');stripe.rotation.z=-.35;}}
    this.mesh(g,-1.95,1.58,2.55,.11,.4,.06,p.accent,'box',.65);
    for(let i=0;i<5;i++)this.mesh(g,2+i*.13,1.6,2.56,.055,.58,.06,C.dark);
    this.sign(g,`PERIMETER ${String(variant+1).padStart(2,'0')}`,0,2.8,2.58,2.15,.24);
    this.pipe(g,[-2.8,.3,2.6],[-2.8,3.7,2.6],.18,C.steel);this.pipe(g,[-2.8,3.7,2.6],[-.9,3.7,2.6],.18,C.steel);
    this.mesh(g,2.3,4.3,0,.055,2.5,.055,C.edge);this.mesh(g,2.3,5.5,0,.15,.16,.15,C.coral,'sphere',1);
    for(let i=0;i<3;i++)this.mesh(g,-3.7+i*.7,.36,3,.85,.65,.85,'#6b6b54','armor');
  }
  buildMatte() {
    if(!this.backdropTexture){this.backdropTexture=new THREE.TextureLoader().load(new URL('./art/jungle-backdrop.webp',import.meta.url).href);this.backdropTexture.colorSpace=THREE.SRGBColorSpace;this.backdropTexture.anisotropy=4;}
    const material=new THREE.MeshBasicMaterial({map:this.backdropTexture,color:'#dce8e4',fog:false,toneMapped:false});this.levelMaterials.push(material);
    this.matte=new THREE.Mesh(this.geometry('plane'),material);this.matte.position.z=-34;this.matte.frustumCulled=false;this.dynamic.add(this.matte);
  }
  buildLandscape() {
    const {level,palette:p,theme}=this,vertical=level.mode==='vertical',len=Math.max(40,level.length||180),height=level.height||85,natural=['jungle','waterfall','snow'].includes(theme),matte=['jungle','waterfall'].includes(theme),rng=this.rng;
    if(natural) {
      this.water=this.mesh(this.dynamic,len/2,-2.6,5.5,len+80,.1,14,theme==='snow'?'#304f5c':'#193f46','box',.03,.94);
      this.waterLines=[];
      for(let i=0;i<32;i++){const m=this.mesh(this.dynamic,rng()*len,-2.51,2+rng()*9,.4+rng()*2.3,.018,.035,theme==='snow'?'#82a9b6':'#699a99','box',.1,.35);m.userData.startX=m.position.x;this.waterLines.push(m);}
    } else {
      this.mesh(this.world,len/2,-4,4,len+50,.7,28,C.dark);
      if(theme==='energy'){this.mesh(this.world,len/2,-3.5,7,len+30,.05,10,'#a15227','box',.5);for(let i=0;i<38;i++)this.mesh(this.world,rng()*len,-3.4,4+rng()*8,.2+rng()*2,.025,.08,'#e9a659','box',.8);}
    }
    if(natural) {
      if(!matte){this.ridge(len,-56,8,'#718a95',2);this.ridge(len,-38,5,'#536c79',4);}
      if(!vertical) {
        if(!matte)for(let x=-35;x<len+55;x+=50)this.spritePlane(this.world,x,5.5,-27,60,30,'forest',theme==='snow'?'#80999d':'#87aaa4',.5);
        for(let x=-10;x<len+20;x+=4.5+rng()*3.5){const z=-8-rng()*7;if(!matte||rng()>.74)this.tree(x,-1.4,z,matte?.48+rng()*.25:.7+rng()*.45,theme==='snow');this.rock(x,-2,-5-rng()*3,1+rng()*1.8);}
        for(let x=13;x<len;x+=43){this.bunker(x,-.8,-7,Math.floor(x/43));this.fern(x+5,-.9,-3,1.6);}
        for(let x=0;x<len;x+=2.5){if(rng()>.3)this.fern(x,-.4,-3.5,.55+rng()*.8);}
      } else {
        // A continuous gorge with irregular shelves, hanging roots and distant forest.
        for(let y=-4;y<height+15;y+=5.5){
          this.rock(-5,y,-6,5+rng()*2,'#344b4b');this.rock(36,y,-9,6+rng()*3,'#3f5654');
          
          for(let j=0;j<3;j++){const xx=rng()<.5?1+rng()*3:28+rng()*4;this.fern(xx,y+3,-6,2);this.pipe(this.world,[xx,y+2,-6],[xx-.4,y-.8,-6],.06,'#404a34');}
          if(Math.floor(y)%4===0)this.tree(rng()<.5?-2:34,y+3,-13,.8);
        }
        this.waterfalls=[];
        for(const x of [8,18,25]){
          this.mesh(this.world,x,height*.5-2,-12,1.5,height+20,.12,'#8fb7b8','box',.06,.26);
          this.mesh(this.world,x+.4,height*.5-2,-11.9,.6,height+20,.08,'#a3c7c4','box',.09,.23);
          for(let i=0;i<14;i++){const stripe=this.mesh(this.dynamic,x+(rng()-.5)*1.8,rng()*height,-11.7,.025+rng()*.08,1+rng()*4,.035,'#c9dcd8','box',.15,.35);stripe.userData.offset=stripe.position.y;this.waterfalls.push(stripe);}
        }
      }
    } else if(theme==='alien') {
      this.mesh(this.world,len/2,5,-18,len+60,23,2,'#241d2c');
      for(let x=-6;x<len+15;x+=9) {
        for(const s of [-1,1]){const points=[[x+s*4,-1,-8],[x+s*4.7,3,-9],[x+s*3.3,7,-10],[x+s*.5,9,-11]];for(let j=0;j<points.length-1;j++)this.pipe(this.world,points[j],points[j+1],.75-j*.12,'#73635f');}
        this.mesh(this.world,x,4.4,-13,2.4,5.6,1.2,'#563c4a','muscle');this.mesh(this.world,x,4.5,-12.35,.3,2.5,.18,p.accent,'muscle',.3);
        for(let j=0;j<4;j++)this.pipe(this.world,[x+j*.3,-1,-5],[x+j*.1,1+rng()*1.5,-6],.12,'#67544f');
        this.rock(x,-1,-5,2.6,p.ground);
      }
    } else {
      this.ridge(len,-46,8,theme==='energy'?'#4b433d':'#35454f',3);
      for(let x=-14;x<len+25;x+=13){
        const z=-9,h=theme==='energy'?7+rng()*5:10+rng()*3;
        if(theme==='energy') {
          this.mesh(this.world,x,h/2-1,z,5.5,h,5.5,C.steel,'cylinder');
          for(const y of [0,h*.38,h*.72,h-1])this.mesh(this.world,x,y,z,5.64,.16,5.64,C.dark,'cylinder');
          this.mesh(this.world,x,h-.8,z,5.6,.25,5.6,C.edge,'cylinder');
          this.pipe(this.world,[x+3,-1,z+2],[x+3,h+3,z+2],.75,C.dark);this.pipe(this.world,[x+3,h+3,z+2],[x+8,h+3,z+2],.75,C.dark);
          this.mesh(this.world,x,h*.42,z+2.8,2.5,2.8,.1,C.dark,'armor');
          for(let j=0;j<3;j++)this.mesh(this.world,x-.72+j*.72,h*.42,z+2.9,.2,2.1,.08,p.accent,'box',.55);
        } else {
          this.mesh(this.world,x,h/2-1,z,11,h,5,C.steel,'armor');this.mesh(this.world,x,h/2-1,z+2.57,8.7,h-1.5,.1,C.dark,'armor');
          for(let j=0;j<12;j++)this.mesh(this.world,x,j*(h-2)/12,z+2.68,8.6,.15,.06,'#53616a');
          for(const side of [-1,1]){this.mesh(this.world,x+side*4.3,h*.5,z+2.8,.3,h,.55,'#747b79');this.mesh(this.world,x+side*3.8,h-1.7,z+2.9,.7,.15,.12,p.accent,'box',.6);}
          this.mesh(this.world,x,h,z,12,.35,6,C.dark);this.pipe(this.world,[x-5,h+2,z],[x+5,h+2,z],.22,C.edge);
          this.sign(this.world,`HGR ${String(Math.floor((x+14)/13)+1).padStart(2,'0')}`,x,h-1,z+2.93,2.2,.52);
        }
        this.mesh(this.world,x-3,1,-4.8,1.4,2.1,1.5,'#555d56','armor');this.mesh(this.world,x-1.8,.6,-4.3,1.1,1.2,1.3,'#686c55','armor');
        this.pipe(this.world,[x-6,-.6,-4.9],[x+6,-.6,-4.9],.3,C.dark);
      }
    }
    // Soft atmospheric planes make depth without per-object lights or bloom passes.
    for(let i=0;i<5;i++){const m=this.spritePlane(this.dynamic,len*i/4,vertical?height*i/4:1.4,-5-i*.9,48,7,'mist',theme==='energy'?'#a08b70':'#8ca9a5',.055);m.userData.origin=m.position.clone();this.mistLayers.push(m);}
  }
  buildBase() {
    const p=this.palette;this.water=null;this.waterLines=[];this.waterfalls=[];this.scene.fog=new THREE.Fog(p.fog,26,85);
    this.mesh(this.world,0,-.4,-4,27,.8,46,C.dark);
    for(let z=-25;z<21;z+=4){
      for(let x=-10;x<=10;x+=4)this.mesh(this.world,x,-.06,z,3.92,.12,3.92,'#44535b','armor');
      for(const side of [-1,1]){
        this.mesh(this.world,side*12,3.7,z,1.5,8,3.98,C.steel,'armor');this.mesh(this.world,side*11.1,3.1,z,.24,4.8,3.15,C.dark,'armor');
        this.mesh(this.world,side*10.95,5.7,z,.16,.12,2,p.accent,'box',.7);
        this.mesh(this.world,side*11,1.2,z,.22,1.2,2.8,'#58646b');
        this.mesh(this.world,side*9.7,.018,z,.10,.04,2.4,'#a99a6b','box',.1);
        this.pipe(this.world,[side*10.8,6.65,z-2],[side*10.8,6.65,z+2],.28,C.edge);
        this.pipe(this.world,[side*10.8,7.15,z-2],[side*10.8,7.15,z+2],.16,C.dark);
      }
    }
    this.mesh(this.world,0,4,-25,26,9,1.3,'#485963','armor');this.mesh(this.world,0,3.7,-24.1,8.5,7.3,.5,C.dark,'armor');
    this.baseDoor=this.group(this.dynamic,0,3,-23.87);
    this.mesh(this.baseDoor,0,.15,0,6.2,5.8,.28,'#4b5b62','armor');
    for(const side of [-1,1]){this.mesh(this.baseDoor,side*1.5,.15,.18,2.75,5.5,.14,C.steel,'armor');this.mesh(this.baseDoor,side*.11,.15,.3,.08,5.2,.03,p.accent,'box',.4);}
    this.mesh(this.world,0,10.5,-4,27,.4,47,C.dark);
    for(const side of [-1,1])this.mesh(this.world,side*12,8.9,-4,1.5,2.8,47,C.steel);
    for(let z=-20;z<22;z+=6){this.mesh(this.world,0,10.16,z,23,.18,.5,C.steel);this.mesh(this.world,0,10.04,z,5,.08,.28,'#c4d1cd','box',.7);}
    this.mesh(this.world,0,10.1,-28,33,6,1.3,'#24333d');
    this.mesh(this.world,0,8.6,-27,30,.35,9,C.dark);
    for(let x=-12;x<=12;x+=4){this.mesh(this.world,x,8.4,-27,.25,.55,8,C.steel);this.mesh(this.world,x,9.6,-27.2,2.9,.18,.1,'#bdcdd0','box',.45);}
    this.sign(this.world,'RESTRICTED  //  02',0,7.25,-23.2,5,.5);
    for(const side of [-1,1]){
      this.mesh(this.world,side*4.7,3.8,-23.7,.7,7.8,1.1,C.edge,'armor');
      this.mesh(this.world,side*8,2,-22,3,4,2,C.dark,'armor');
      this.mesh(this.world,side*8,2.7,-20.9,2.1,1.5,.08,'#17343d','armor',.15);
      for(let j=0;j<5;j++)this.mesh(this.world,side*8,2.2+j*.23,-20.8,1.75-j*.15,.035,.04,p.accent,'box',.5);
      this.pipe(this.world,[side*6.1,0,-23],[side*6.1,7,-23],.4,C.steel);
      this.mesh(this.world,side*4.7,6.6,-23,.3,.28,.3,C.coral,'sphere',.7);
    }
    for(let z=-18;z<15;z+=11){this.mesh(this.world,0,7.8,z,24,.35,.9,C.dark);this.mesh(this.world,0,7.58,z,6,.08,.24,'#c2d3d1','box',.65);}
    this.shield=this.mesh(this.dynamic,0,2.2,-12,21,4.4,.03,p.accent,'box',.3,.065);this.baseGrid=[];
    for(let i=0;i<9;i++)this.baseGrid.push(this.mesh(this.dynamic,-10+i*2.5,2.2,-11.95,.018,4.4,.025,p.accent,'box',.7,.24));
    this.roomLight=new THREE.PointLight(p.accent,8,28,2);this.roomLight.position.set(0,5,-12);this.dynamic.add(this.roomLight);
    this.baseAccentMaterials=[];const accentColor=new THREE.Color(p.accent),replacements=new Map();
    for(const root of [this.world,this.dynamic])root.traverse(m=>{if(!m.isMesh||!m.material.color.equals(accentColor)||m.material.emissiveIntensity<=0)return;let replacement=replacements.get(m.material);if(!replacement){replacement=m.material.clone();replacements.set(m.material,replacement);this.baseAccentMaterials.push(replacement);this.levelMaterials.push(replacement);}m.material=replacement;});
    this.lastBaseRoom=-1;
  }
  buildCheckpoints() {
    for(const [i,c]of (this.level.checkpoints||[]).entries()){
      if(i===0)continue;const g=this.group(this.dynamic,c.x,c.y,-1.45);g.userData.index=i;
      this.mesh(g,0,.1,0,.9,.2,.7,C.dark,'armor');this.mesh(g,0,.95,0,.16,1.65,.16,C.steel,'cylinder');
      this.mesh(g,0,1.8,0,.52,.65,.42,C.dark,'armor');
      const lamp=this.mesh(g,0,1.85,.25,.22,.34,.08,C.gold,'box',.9);g.userData.lamp=lamp;
      const glow=this.spritePlane(g,0,1.85,.28,1.4,1.4,'glow',C.gold,.28);glow.material=glow.material.clone();this.levelMaterials.push(glow.material);g.userData.glow=glow;
      const ring=this.mesh(g,0,.05,0,1.6,1.6,.08,C.gold,'ring',.6);ring.rotation.x=-Math.PI/2;g.userData.ring=ring;
      this.sign(g,`CP ${String(i).padStart(2,'0')}`,0,2.4,.05,1.15,.28,'#d7c6a4');this.checkpointMeshes.push(g);
    }
  }
  makePlatform(p) {
    const g=this.group(this.dynamic,(p.x||0)+(p.w||1)/2,p.y||0,0),w=p.w||1,h=(p.y||0)>0?Math.min(.32,p.h||1):Math.max(.3,p.h||1),theme=this.theme;
    const natural=['jungle','waterfall','snow','alien'].includes(theme)&&!['metal','moving','bridge','lift'].includes(p.kind);
    this.mesh(g,0,-h/2,-.7,w,h,4.4,natural?this.palette.ground:C.dark);
    this.mesh(g,0,-.075,-.6,w+.04,.16,4.65,natural?this.palette.top:C.edge);
    this.mesh(g,0,-.22,1.72,w,.08,.07,natural?(theme==='snow'?'#a7c4cc':'#77805b'):'#bdaf83');
    if(natural) {
      // Broken rock face; the walkable lip itself remains level and unambiguous.
      const n=Math.min(10,Math.ceil(w/2.8));
      for(let i=0;i<n;i++){
        const x=-w*.5+(i+.5)*w/n,y=-Math.min(h*.55,.65+(i%3)*.28);
        const stone=this.mesh(g,x,y,1.43,w/n*1.12,Math.min(h*.8,1.9),.38,this.palette.ground,'slab');stone.rotation.z=(i%3-1)*.18;
        if(i%2===0&&h>1)this.mesh(g,x,-h*.82,1.55,w/n*.93,.09,.12,theme==='snow'?'#889fa8':'#2c3937');
        if(['jungle','waterfall'].includes(theme)&&i%2===1){this.spritePlane(g,x,.19,-1.6,1.3,.6,'fern','#6b825d');this.mesh(g,x-.4,-.03,1.65,.85,.12,.36,this.palette.ground,'slab');this.spritePlane(g,x+.3,.09,1.7,.8,.25,'fern','#677b54');this.pipe(g,[x,-.18,1.76],[x+.2,-Math.min(h-.1,.8),1.85],.035,'#63704b');}
        if(theme==='alien'&&i%3===0)this.mesh(g,x,-.45,1.8,.15,.3,.1,this.palette.accent,'muscle',.25);
      }
    } else {
      this.mesh(g,0,-h+.12,1.5,w,.16,.28,C.steel);
      const count=Math.min(12,Math.ceil(w/2.6));
      for(let i=0;i<count;i++){
        const x=-w*.5+(i+.5)*w/count;
        this.mesh(g,x,-h*.5,1.59,.09,Math.max(.16,h-.22),.12,C.steel);
        if(i%2===0){this.mesh(g,x,-.34,1.73,.42,.07,.05,this.palette.accent,'box',.23);}
        if(h>1){const brace=this.mesh(g,x+.6,-h*.5,1.61,.10,h*.9,.10,'#55626a');brace.rotation.z=-.35;}
      }
      if(p.kind==='bridge'){
        this.mesh(g,0,-.65,-2.1,w,.16,.18,C.dark);this.mesh(g,0,-.65,1.65,w,.16,.18,C.dark);
        for(let x=-w*.5+.5;x<w*.5;x+=1.2){this.mesh(g,x,-.02,-.1,.10,.055,3.6,C.dark);this.pipe(g,[x,-.15,1.5],[x+.7,-.68,1.5],.1,C.steel);}
      }
    }
    return g;
  }
  makeHazard(h) {
    const g=this.group(this.dynamic,(h.x||0)+(h.w||1)/2,h.y||0,.6),w=h.w||1,height=h.h||1;
    g.userData.effects=[];
    if(h.type==='crusher') {
      this.mesh(g,0,height/2,0,w,height,3.8,C.steel,'armor');this.mesh(g,0,.2,0,w+.2,.4,4,C.edge);
      for(let x=-w*.4;x<w*.5;x+=.7)this.mesh(g,x,.12,2.02,.4,.19,.04,C.gold).rotation.z=-.5;
    } else if(['fire','flame','lava'].includes(h.type)) {
      this.mesh(g,0,.08,0,w,.16,1.4,C.dark,'armor');
      for(let x=-w*.4;x<w*.5;x+=.5)g.userData.effects.push(this.mesh(g,x,height*.45,0,.5,height,.5,'#ffb45c','cone',1,.83));
    } else if(h.type==='spikes'||h.type==='spike') {
      for(let x=-w*.45;x<w*.5;x+=.5)this.mesh(g,x,height*.5,0,.42,height,.6,C.pale,'cone');
    } else {
      this.mesh(g,0,.1,0,w,.2,1.5,C.dark,'armor');
      g.userData.effects.push(this.mesh(g,0,height/2,0,w*.8,height,.1,this.palette.accent,'box',1,.55));
      for(const side of [-1,1])this.mesh(g,side*w/2,height/2,0,.18,height+.3,.5,C.edge,'armor');
    }
    g.userData.warning=this.mesh(g,0,.09,1,w+.3,.05,.38,C.coral,'box',.8);g.userData.warning.visible=false;
    return g;
  }
  humanoid(player=false,id=0) {
    const g=new THREE.Group(),body=this.group(g),shirt=player?(id===1?'#6e5143':'#3c585b'):'#495051',pants=player?'#35434a':'#3b4248',skin=player?C.skin:'#ad9277';
    g.userData.body=body;
    const hip=this.group(body,0,.73,0);g.userData.hip=hip;
    this.mesh(body,0,.77,0,.39,.27,.32,pants,'muscle');
    this.mesh(body,-.015,1.1,0,.61,.55,.38,shirt,'torso');
    this.mesh(body,.02,1.22,.19,.47,.25,.09,'#263b3e','muscle');
    // Harness, magazine pouches and belt provide a readable military silhouette.
    const strap=this.mesh(body,-.12,1.13,.215,.055,.43,.035,'#859087');strap.rotation.z=-.19;
    this.mesh(body,.19,1.09,.22,.055,.39,.035,'#859087').rotation.z=.13;
    this.mesh(body,0,.84,.18,.41,.075,.08,'#202c30');this.mesh(body,.05,.84,.23,.10,.07,.02,'#9f9a7d');
    for(const x of [-.12,.02,.16])this.mesh(body,x,.99,.23,.10,.15,.08,'#54625b','armor');
    this.mesh(body,-.23,1.08,-.21,.23,.4,.19,'#28373b','armor');
    this.mesh(body,-.24,1.39,-.22,.035,.40,.035,'#18242a','cylinder');
    this.mesh(body,.015,1.4,0,.18,.16,.19,skin,'limb');
    this.mesh(body,0,1.55,0,.32,.37,.31,skin,'muscle');
    this.mesh(body,.132,1.51,.04,.12,.14,.14,skin,'muscle');
    this.mesh(body,.175,1.56,.04,.085,.09,.11,skin,'muscle');
    this.mesh(body,-.045,1.69,-.015,.35,.16,.34,player?'#252c29':'#39494c','muscle');
    this.mesh(body,-.13,1.61,-.02,.09,.17,.32,player?'#252c29':'#39494c','muscle');
    this.mesh(body,.127,1.60,.135,.065,.024,.025,'#182227');
    this.mesh(body,.08,1.43,.10,.18,.055,.13,'#8c705b','muscle');
    if(player){this.mesh(body,-.005,1.642,0,.36,.065,.33,id===1?'#bd996e':'#c54e32','muscle');}
    else {this.mesh(body,-.025,1.69,0,.41,.21,.39,'#39494c','muscle');this.mesh(body,.135,1.61,.06,.13,.1,.27,'#1a2930','armor');}
    const band=this.mesh(body,-.26,1.61,.04,.3,.055,.045,player?(id===1?'#bd996e':'#c54e32'):'#39494c');band.rotation.z=-.25;g.userData.band=band;
    const legs=[];
    for(const z of [-.14,.14]) {
      const leg=this.group(body,0,.73,z);this.mesh(leg,-.015,-.19,0,.25,.44,.25,pants,'limb');
      this.mesh(leg,-.02,-.11,.10,.18,.22,.08,'#52615c','armor');
      const knee=this.group(leg,0,-.37,0);leg.userData.knee=knee;
      this.mesh(knee,.035,0,.02,.24,.19,.27,'#26363e','muscle');this.mesh(knee,.07,-.015,.08,.16,.17,.17,'#77827c','armor');
      this.mesh(knee,0,-.145,0,.19,.3,.20,pants,'limb');this.mesh(knee,.06,-.29,.015,.34,.18,.27,'#1a252a','armor');
      this.mesh(knee,.065,-.355,.025,.36,.045,.28,'#101b20');legs.push(leg);
    }
    g.userData.legs=legs;
    // Both arms support a detailed carbine; the whole rig follows the aiming vector.
    const arm=this.group(body,0,1.25,.28);g.userData.arm=arm;
    this.mesh(arm,-.035,-.02,-.07,.29,.29,.28,skin,'muscle');
    this.pipe(arm,[-.02,-.05,0],[.18,-.22,.02],.22,skin);this.mesh(arm,.18,-.20,.02,.21,.19,.22,skin,'muscle');
    this.pipe(arm,[.18,-.20,.02],[.40,-.15,.02],.15,skin);this.mesh(arm,.42,-.14,.02,.17,.16,.17,'#283631','muscle');
    this.pipe(arm,[-.10,-.08,-.45],[.13,-.27,-.32],.19,skin);this.pipe(arm,[.13,-.27,-.32],[.57,-.13,-.03],.15,skin);
    this.mesh(arm,.57,-.12,-.015,.16,.15,.17,'#283631','muscle');
    this.mesh(arm,.18,-.055,.015,.28,.16,.15,'#273137','armor');
    this.mesh(arm,.52,-.055,.015,.48,.17,.15,'#3f4a4d','armor');this.mesh(arm,.57,.032,.015,.42,.038,.14,'#75817d');
    this.mesh(arm,.82,-.055,.015,.36,.085,.095,'#242d31');this.mesh(arm,1.01,-.055,.015,.13,.11,.13,'#566468','armor');
    const mag=this.mesh(arm,.43,-.21,.015,.13,.23,.12,'#1e292e','armor');mag.rotation.z=-.15;
    this.mesh(arm,.34,-.17,.015,.08,.15,.10,'#131d22','armor').rotation.z=-.28;
    this.mesh(arm,.49,.08,.015,.14,.09,.08,'#1d2b31','cylinder').rotation.z=Math.PI/2;
    for(let i=0;i<4;i++)this.mesh(arm,.65+i*.047,-.045,.099,.016,.075,.018,'#172327');
    const muzzle=this.group(arm,1.1,-.055,.015);this.mesh(muzzle,.11,0,0,.4,.16,.15,'#ffe3ad','sphere',2.4);this.mesh(muzzle,.06,0,0,.09,.42,.045,'#ed9e4b','rock',1.5).rotation.z=.4;this.mesh(muzzle,.06,0,0,.09,.045,.42,'#ed9e4b','rock',1.5);muzzle.visible=false;g.userData.muzzle=muzzle;
    const shadow=this.mesh(g,0,.012,0,.7,.01,.5,'#0c181c','cylinder',0,.25);shadow.castShadow=false;g.userData.shadow=shadow;
    return g;
  }
  enemy(kind) {
    if(['rifle','soldier','runner','sniper','jumper','grenadier','commando'].includes(kind)||!kind)return this.humanoid(false);
    const g=new THREE.Group();g.userData.kind=kind;
    if(kind==='core') {
      this.mesh(g,0,.55,0,1.25,1.12,.6,C.dark,'armor');this.mesh(g,0,.55,.35,1.02,.91,.13,C.edge,'armor');
      this.mesh(g,0,.55,.48,.50,.65,.24,C.coral,'sphere',.7);
      const ring=this.mesh(g,0,.55,.57,.92,.92,.7,C.coral,'ring',.25);g.userData.spin=ring;
    } else if(['drone','flyer','orb'].includes(kind)) {
      this.mesh(g,0,.5,0,.9,.55,.7,C.steel,'armor');this.mesh(g,0,.5,.37,.36,.2,.12,C.coral,'box',.75);
      for(const s of [-1,1]){this.mesh(g,s*.6,.55,0,.65,.12,.34,C.edge,'armor');this.mesh(g,s*.78,.48,0,.28,.16,.3,C.dark,'cylinder');}
      const fan=this.mesh(g,0,.87,0,1.8,.035,.12,C.dark);g.userData.spin=fan;
    } else if(kind==='tank') {
      this.mesh(g,0,.43,0,3,.72,1.15,C.dark,'armor');
      for(let i=0;i<5;i++)this.mesh(g,-1.1+i*.55,.35,.64,.5,.5,.13,C.edge,'cylinder').rotation.x=Math.PI/2;
      this.mesh(g,0,.87,0,2.8,.44,1.25,C.steel,'armor');this.mesh(g,.25,1.32,0,1.3,.66,1,C.edge,'armor');
      this.mesh(g,-.85,1.43,0,1.7,.25,.3,C.dark,'armor');this.mesh(g,.3,1.38,.55,.45,.20,.07,C.coral,'box',.4);
    } else if(kind==='crawler') {
      this.mesh(g,0,.28,0,.9,.45,.6,'#73897d','rock');this.mesh(g,-.4,.3,.24,.20,.13,.08,C.coral,'box',.5);
      for(const x of [-.3,0,.3])for(const z of [-.35,.35])this.mesh(g,x,.15,z,.14,.3,.14,C.dark,'armor').rotation.z=x;
    } else {
      this.mesh(g,0,.18,0,1.1,.35,.95,C.dark,'armor');this.mesh(g,0,.6,0,.8,.6,.74,C.steel,'armor');
      this.mesh(g,0,.7,.40,.34,.24,.09,C.coral,'box',.55);
      const cannon=this.group(g,0,.9,0);this.mesh(cannon,-.55,0,0,1.1,.25,.25,C.dark,'armor');this.mesh(cannon,-1.08,0,0,.13,.33,.35,C.edge);g.userData.cannon=cannon;
    }
    return g;
  }
  makeBoss(b) {
    const g=new THREE.Group(),type=b.type||'gate',w=b.w||5,h=b.h||5;
    g.userData.parts=[];g.userData.cores=[];g.userData.type=type;
    const box=(x,y,z,sx,sy,sz,c=C.steel,t='armor',glow=0)=>this.mesh(g,x,y,z,sx,sy,sz,c,t,glow);
    const core=(x,y,z,size,color=C.coral)=>{const m=box(x,y,z,size,size,size*.55,color,'sphere',.8);g.userData.cores.push(m);return m;};
    if(type==='gate') {
      box(0,h*.5,-.6,w,h,2,C.pale);box(0,h*.5,.46,w*.70,h*.86,.2,C.dark);box(0,h*.51,.61,w*.42,h*.7,.24,C.steel);
      for(const s of [-1,1]) {box(s*w*.43,h*.5,.6,w*.16,h,1,C.edge);const arm=this.group(g,s*w*.32,h*.58,1);this.mesh(arm,0,0,0,.9,.8,1.1,C.dark,'armor');this.mesh(arm,-.15,0,.6,1.3,.29,.35,C.steel,'armor');g.userData.parts.push(arm);}
      core(0,h*.66,1.03,.95);for(let i=0;i<5;i++)box(0,.5+i*.48,.84,w*.3,.12,.07,C.edge);
      box(0,h+.1,0,w+.5,.32,2.8,C.pale);
    } else if(type==='sentinel') {
      box(0,h*.5,-.7,w*.8,h,1.8,C.dark);box(0,h*.55,.27,w*.66,h*.80,.3,C.edge);
      for(const [x,y] of [[0,h*.72],[-w*.23,h*.42],[w*.23,h*.42]]){box(x,y,.6,1.3,1.3,.7,C.dark,'cylinder').rotation.x=Math.PI/2;core(x,y,1.1,.72,C.cyan);}
      for(const s of [-1,1]){const arm=this.group(g,s*w*.46,h*.4,0);this.mesh(arm,0,0,0,.7,h*.57,.7,C.steel,'armor');this.mesh(arm,0,-h*.28,.6,.75,.65,1.8,C.dark,'armor');g.userData.parts.push(arm);}
    } else if(type==='hydra') {
      for(const s of [-1,1]){box(s*w*.24,h*.2,0,.7,h*.4,1.1,C.dark);box(s*w*.25,.25,.2,1.4,.5,1.9,C.steel);const arm=this.group(g,s*w*.4,h*.66,0);this.mesh(arm,0,-.7,0,1,2.1,1.25,C.steel,'armor');this.mesh(arm,0,-1.5,.55,.55,.8,.7,C.edge,'armor');g.userData.parts.push(arm);}
      box(0,h*.51,0,w*.5,h*.34,1.5,C.steel);box(0,h*.78,0,w*.8,.65,1.8,C.edge);box(0,h*.89,.2,1.1,.9,1.1,C.dark);core(0,h*.6,.92,1.2,C.cyan);core(0,h*.9,.86,.45,C.coral);
      for(const s of [-1,1])box(s*w*.27,h*.92,0,.55,1.4,.7,C.dark);
    } else if(type==='twins') {
      core(0,h*.5,.6,1.55,'#b7a0eb');
      for(let i=0;i<3;i++){const ring=box(0,h*.5,0,w*(.5+i*.23),w*(.5+i*.23),1,i%2?C.edge:C.steel,'ring');ring.rotation.y=i*.5;g.userData.parts.push(ring);}
      for(let i=0;i<4;i++){const a=i*Math.PI/2;box(Math.cos(a)*w*.45,h*.5+Math.sin(a)*h*.4,0,.85,.9,.8,C.dark);core(Math.cos(a)*w*.45,h*.5+Math.sin(a)*h*.4,.5,.4,'#b7a0eb');}
    } else if(type==='hover') {
      box(0,h*.29,0,w*.96,h*.3,2.5,'#657f8f');
      for(const z of [-1.2,1.2]){box(0,h*.16,z,w, .65,.65,C.dark);for(let i=0;i<5;i++)box(-w*.36+i*w*.18,h*.16,z+.35,.57,.57,.15,C.edge,'cylinder').rotation.x=Math.PI/2;}
      box(0,h*.54,0,w*.56,h*.25,1.65,'#a8c7d3');const turret=this.group(g,0,h*.70,.4);for(const z of [-.45,0,.45])this.mesh(turret,-w*.3,0,z,w*.75,.24,.22,C.dark,'armor');g.userData.parts.push(turret);core(0,h*.55,1.05,1,C.coral);
    } else if(type==='titan') {
      box(0,h*.49,0,w*.58,h*.8,2,C.steel);box(0,h*.52,.8,w*.55,h*.54,.8,C.dark,'cylinder').rotation.x=Math.PI/2;
      const teeth=this.group(g,0,h*.52,1.3);for(let i=0;i<12;i++){const a=i*Math.PI/6;const m=this.mesh(teeth,Math.cos(a)*w*.28,Math.sin(a)*w*.28,0,.45,.55,.35,C.edge,'armor');m.rotation.z=a;}g.userData.parts.push(teeth);core(0,h*.52,1.5,w*.28,C.gold);
      for(const s of [-1,1]){box(s*w*.40,h*.32,0,.7,h*.5,1,C.dark);box(s*w*.45,h*.63,0,1.1,.8,1.6,C.pale);box(s*w*.46,h*.12,.4,1.2,.5,1.8,C.edge);}
    } else if(type==='fortress') {
      box(0,h*.56,0,w*.38,h*.45,2.4,C.steel);core(0,h*.66,1.28,.85,'#b5a0e8');
      for(const s of [-1,1]) {const wing=box(s*w*.3,h*.48,0,w*.47,.53,2.7,C.edge);wing.rotation.z=s*.15;box(s*w*.34,h*.29,.6,1,.9,1.8,C.dark);core(s*w*.34,h*.31,1.55,.65,C.cyan);const rotor=this.group(g,s*w*.37,h*.64,-.2);this.mesh(rotor,0,0,0,1.9,.09,.28,C.dark);this.mesh(rotor,0,0,0,.28,.09,1.9,C.dark);g.userData.parts.push(rotor);}
      box(0,h*.81,-.4,.28,1.2,1.8,C.pale);
    } else {
      core(0,h*.51,.8,2,'#ffd0ac');
      for(let i=0;i<6;i++){const a=i*Math.PI/3;const petal=this.group(g,Math.cos(a)*w*.27,h*.51+Math.sin(a)*h*.31,0);const m=this.mesh(petal,0,0,0,1.6,2.3,1.3,i%2?'#718b89':'#586b81','rock');m.rotation.z=a;g.userData.parts.push(petal);this.mesh(petal,0,0,.8,.25,1.4,.26,'#bf857a','cylinder');}
      for(const s of [-1,1]){const limb=this.group(g,s*w*.4,h*.3,-.3);for(let j=0;j<3;j++)this.mesh(limb,s*j*.23,-j*.5,0,.48,.9,.65,'#83bbae','armor').rotation.z=-s*.4;}
    }
    this.dynamic.add(g);return g;
  }
  render(state,dt=0.016) {
    if(!state)return;
    if(state.level&&this.level!==state.level)this.setLevel(state.level);
    if(!this.level)return;
    const time=state.time||0,base=this.level.mode==='base';
    if(this.quality!==(state.quality||'high')){this.quality=state.quality||'high';this.renderer.shadowMap.enabled=this.quality!=='low';this.resize();}
    if(this.canvas.clientWidth!==this.width||this.canvas.clientHeight!==this.height)this.resize();
    const cx=state.camera?.x||0,cy=state.camera?.y||0,shake=state.shake||0;
    const sx=shake*Math.sin(time*95)*.75,sy=shake*Math.cos(time*103)*.60;
    if(base){
      const transit=state.roomTransition>0?1-clamp(state.roomTransition/1.6,0,1):0;
      this.baseCamera.position.set(sx,7.2+sy-transit*.9,27-transit*4);this.baseCamera.lookAt(0,1.8,-7);
      if(this.baseDoor)this.baseDoor.position.y=3+Math.min(1,transit*3)*5;
      if(this.lastBaseRoom!==(state.baseRoom||0)){
        const color=this.level.baseRooms?.[state.baseRoom||0]?.color||this.palette.accent;
        for(const m of this.baseAccentMaterials||[]){m.color.set(color);m.emissive.set(color);}
        this.roomLight?.color.set(color);this.lastBaseRoom=state.baseRoom||0;
      }
    }
    else {this.camera.position.set(cx+sx,cy+2.8+sy,29);this.camera.lookAt(cx+sx,cy+sy,0);}
    if(this.matte){const spanX=this.camera.right-this.camera.left,spanY=this.camera.top-this.camera.bottom,w=Math.max(spanX,spanY*16/9)*1.12;this.matte.scale.set(w,w*9/16,1);this.matte.position.set(cx-Math.sin(cx*.012)*w*.025,cy-3.3,-34);}
    const lx=base?0:cx,ly=base?0:cy;
    this.sun.position.set(lx-18,ly+29,23);this.sun.target.position.set(lx,ly,0);this.sun.target.updateMatrixWorld();
    for(const g of this.checkpointMeshes||[]){const c=this.level.checkpoints[g.userData.index],active=(state.checkpointIndex??-1)>=g.userData.index||(state.checkpoint&&Math.abs(state.checkpoint.x-c.x)<.1&&Math.abs(state.checkpoint.y-c.y)<.1);g.userData.lamp.material=this.material(active?'#9ccdb8':C.gold,active?1:.35);g.userData.glow.material.opacity=active?.38+Math.sin(time*2)*.04:.15;g.userData.ring.visible=active;}
    for(const m of this.mistLayers||[]){m.position.x=m.userData.origin.x+Math.sin(time*.12+m.userData.origin.z)*2;}
    if(this.waterLines)for(let i=0;i<this.waterLines.length;i++){const m=this.waterLines[i];m.position.x=m.userData.startX+Math.sin(time*.5+i)*2;m.material.opacity=.55+Math.sin(time*1.5+i)*.12;}
    if(this.waterfalls)for(const m of this.waterfalls)m.position.y=((m.userData.offset-time*14)%(this.level.height||80)+(this.level.height||80))%(this.level.height||80);
    (state.platforms||this.level.platforms||[]).forEach((p,i)=>{const g=this.platformMeshes[i];if(g){g.position.set((p.x||0)+(p.w||1)/2,p.y||0,0);g.visible=!(p.gone>0);}});
    (state.hazards||this.level.hazards||[]).forEach((h,i)=>{
      const g=this.hazardMeshes[i];if(!g)return;
      g.visible=true;g.position.y=h.y||0;
      for(const m of g.userData.effects||[])m.visible=h.active!==false;
      g.userData.warning.visible=!!h.warning&&Math.floor(time*14)%2===0;
      if(h.type==='crusher')g.position.y+=(h.active?0:h.h+1);
      else if(!['spikes','spike'].includes(h.type))g.scale.y=1+Math.sin(time*12+i)*.06;
    });
    const seen=new Set();
    for(const [items,isPlayer] of [[state.players||[],true],[state.enemies||[],false]])for(const e of items) {
      const key=(isPlayer?'p':'e')+e.id;seen.add(key);
      let g=this.units.get(key);
      if(!g){g=isPlayer?this.humanoid(true,e.id):this.enemy(e.kind);this.units.set(key,g);this.dynamic.add(g);}
      const hidden=e.dead||(e.hp!==undefined&&e.hp<=0)||isPlayer&&(e.invuln||0)>0&&Math.floor(time*18)%2===0;
      g.visible=!hidden;if(hidden)continue;
      g.position.set(e.x||0,e.y||0,base?(e.z??(isPlayer?12:-12)):0);
      if(g.userData.body) {
        const face=e.face===-1?-1:1;
        g.scale.x=base?1:face;g.rotation.y=base?(isPlayer?Math.PI/2:-Math.PI/2):0;
        const body=g.userData.body,run=clamp(Math.abs(e.vx||0)/4,0,1),phase=time*13+(isPlayer?0:(Number(e.id)||0));
        body.position.y=e.prone?-.45:Math.sin(phase*2)*.025*run+Math.sin(time*2.1+Number(e.id||0))*.016;
        body.rotation.z=e.prone?-.95:((!e.grounded&&isPlayer&&Math.abs(e.vy||0)>2)?-.08:.035*run);
        g.userData.legs.forEach((leg,i)=>{const stride=Math.sin(phase+i*Math.PI);leg.rotation.z=e.prone?(i?-.55:.8):stride*.62*run;leg.userData.knee.rotation.z=e.prone?.55:Math.max(0,-stride)*.85*run;});
        const aimX=Math.abs(e.aimX??1),aimY=e.aimY||0;
        g.userData.arm.rotation.z=(base?0:Math.atan2(aimY,Math.max(.05,aimX)))+((e.muzzle||0)>0?.045:0);g.userData.arm.position.x=(e.muzzle||0)>0?-.04:0;
        g.userData.band.rotation.z=-.2+Math.sin(time*18)*.10*run;
        g.userData.muzzle.visible=(e.muzzle||0)>0||!!e.firing&&Math.floor(time*30)%2===0;g.userData.muzzle.scale.setScalar(.8+Math.sin(time*100)*.18);
        g.userData.shadow.visible=!e.prone&&(e.grounded!==false);
      } else {
        if(g.userData.spin){if(e.kind==='core')g.userData.spin.rotation.z=time;else g.userData.spin.rotation.y=time*30;}
        if(g.userData.cannon){g.userData.cannon.rotation.z=Math.sin(time)*.1;g.rotation.y=base?-Math.PI/2:0;}
        if(['drone','flyer','orb'].includes(e.kind))g.position.y+=Math.sin(time*4+Number(e.id||0))*.12;
      }
      if(e.hit>0)g.scale.y=1.02+Math.sin(time*55)*.025;else g.scale.y=1;
    }
    for(const [id,g]of this.units)if(!seen.has(id)){this.dynamic.remove(g);this.units.delete(id);}
    const bulletSeen=new Set();
    for(const b of state.bullets||[]) {
      const id=b.id;bulletSeen.add(id);let m=this.bullets.get(id);
      if(!m){m=this.bulletPool.pop()||new THREE.Mesh(this.geometry('sphere'),this.material(C.gold,1));this.dynamic.add(m);this.bullets.set(id,m);}
      m.visible=true;m.material=this.material(b.friendly?(b.weapon==='L'?'#a4ffff':b.weapon==='F'?'#ffb261':'#ffe7a0'):'#ff745e',1.5);
      m.position.set(b.x||0,b.y||0,base?(b.z||0):.44);
      const r=Math.max(.075,b.r||.12),laser=b.weapon==='L';m.scale.set(laser?.9:r*3,r*1.45,r*1.45);
      if(base){m.scale.set(r*1.6,r*1.6,laser?1.5:r*4);m.rotation.z=0;}else m.rotation.z=Math.atan2(b.vy||0,b.vx||1);
    }
    for(const [id,m]of this.bullets)if(!bulletSeen.has(id)){m.visible=false;this.dynamic.remove(m);this.bullets.delete(id);this.bulletPool.push(m);}
    const pickupSeen=new Set();
    for(const p of state.pickups||[]) {if(p.collected)continue;pickupSeen.add(p.id);let g=this.pickups.get(p.id);
      if(!g){g=new THREE.Group();const color=({S:'#ffc96b',L:'#86f9ed',F:'#ff956d',M:'#9cbdff',R:'#c5a4ff',B:'#b5ed9d',life:'#b5ed9d'})[p.type]||C.gold;
        this.mesh(g,0,0,0,.68,.58,.48,C.dark,'armor');this.mesh(g,0,0,.27,.42,.34,.12,color,'armor',.65);this.mesh(g,0,0,0,1.15,1.15,1,color,'ring',.15);this.badge(g,p.type);this.pickups.set(p.id,g);this.dynamic.add(g);}
      g.position.set(p.x||0,(p.y||0)+Math.sin(time*3+Number(p.id||0))*.12,base?(p.z||0):.4);g.rotation.y=Math.sin(time*2)*.18;g.rotation.z=Math.sin(time)*.1;
    }
    for(const [id,g]of this.pickups)if(!pickupSeen.has(id)){this.dynamic.remove(g);this.pickups.delete(id);}
    const boss=state.boss;
    if(boss&&!boss.dead&&boss.hp>0) {
      if(!this.bossMesh||this.bossMesh.userData.type!==boss.type){if(this.bossMesh)this.dynamic.remove(this.bossMesh);this.bossMesh=this.makeBoss(boss);}
      const g=this.bossMesh;g.visible=boss.active!==false;g.position.set(boss.x||0,boss.y||0,base?(boss.z??-17):0);
      if(['twins','fortress','heart'].includes(boss.type))g.position.y+=Math.sin(time*1.8)*.13;
      g.userData.parts.forEach((m,i)=>{if(boss.type==='twins'){m.rotation.z=time*(i%2?-.35:.35);m.rotation.y=Math.sin(time*.7+i)*.4;}else if(boss.type==='titan')m.rotation.z=time*.8;else if(boss.type==='fortress')m.rotation.y=time*23;else if(boss.type==='heart'){const amount=1+Math.sin(time*2)*.045;m.scale.setScalar(amount);}else m.rotation.z=Math.sin(time*1.5+i)*.10;});
      g.userData.cores.forEach((m,i)=>{if(!m.userData.baseScale)m.userData.baseScale=m.scale.clone();m.scale.copy(m.userData.baseScale).multiplyScalar(1+Math.sin(time*5+i)*.06);});
    } else if(this.bossMesh)this.bossMesh.visible=false;
    if(this.shield){const active=(state.enemies||[]).some(e=>e.kind==='core'&&e.hp>0);this.shield.visible=active;for(const m of this.baseGrid||[])m.visible=active;}
    const particles=state.particles||[],count=Math.min(particles.length,this.particleCount),pos=this.particleSystem.geometry.attributes.position,colors=this.particleSystem.geometry.attributes.color;
    for(let i=0;i<count;i++){const p=particles[i];pos.setXYZ(i,p.x||0,p.y||0,base?(p.z||0):.5);this.color.set(p.color||C.gold);const fade=clamp((p.life??1)/(p.maxLife||1),0,1);this.color.multiplyScalar(.4+fade*.9);colors.setXYZ(i,this.color.r,this.color.g,this.color.b);}
    pos.needsUpdate=true;colors.needsUpdate=true;this.particleSystem.geometry.setDrawRange(0,count);
    this.renderer.render(this.scene,base?this.baseCamera:this.camera);
  }
  dispose() {
    this.world.traverse(m=>{if(m.isInstancedMesh)m.dispose();});
    for(const g of this.geo.values())g.dispose();for(const m of this.mat.values()){if(m.userData.ownTexture)m.map.dispose();m.dispose();}if(this.backdropTexture)this.backdropTexture.dispose();
    for(const m of this.labels.values()){m.map.dispose();m.dispose();}
    for(const m of this.levelMaterials)m.dispose();if(this.sky)this.sky.dispose();
    this.particleSystem.geometry.dispose();this.particleMaterial.dispose();this.renderer.dispose();
    this.world.clear();this.dynamic.clear();this.units.clear();this.bullets.clear();this.pickups.clear();
  }
}
