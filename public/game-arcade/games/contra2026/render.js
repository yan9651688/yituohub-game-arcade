import * as THREE from '../../vendor/three/build/three.module.js';

// A small, fully procedural art kit. No network assets or texture downloads.
const C = { steel: '#526870', dark: '#263c49', pale: '#d6ded7', edge: '#98aaa8', blue: '#238dea', blueDark: '#194976', ice: '#95e8ff', coral: '#e96950', skin: '#ffcd99', cyan: '#86f9ed', gold: '#ffc96b' };
const PALETTES = {
  jungle: { sky:'#bfe8f4', fog:'#b4d8db', ground:'#829480', top:'#768d5d', accent:'#61e4cd' },
  base: { sky:'#203641', fog:'#243c4a', ground:'#526870', top:'#91aaa9', accent:'#64efe2' },
  waterfall: { sky:'#badcec', fog:'#9bc9cc', ground:'#50625d', top:'#698568', accent:'#a9f2e5' },
  base2: { sky:'#182936', fog:'#243849', ground:'#526070', top:'#899aae', accent:'#b49aee' },
  snow: { sky:'#c5e6f4', fog:'#c5dfe8', ground:'#9ab6cc', top:'#e3f1f3', accent:'#63b8d7' },
  energy: { sky:'#e5bc94', fog:'#bea695', ground:'#a48670', top:'#c8ac86', accent:'#ffba63' },
  hangar: { sky:'#7899b5', fog:'#6f93ac', ground:'#466c8f', top:'#89a4b5', accent:'#47eeef' },
  alien: { sky:'#253641', fog:'#3a515a', ground:'#586b81', top:'#83bbae', accent:'#ff927e' },
};
const clamp = THREE.MathUtils.clamp;
function random(seed) { let a = seed >>> 0; return () => { a += 0x6d2b79f5; let t = Math.imul(a ^ a >>> 15, a | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false, powerPreference:'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.32;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-16,16,9,-9,.1,180);
    this.baseCamera = new THREE.PerspectiveCamera(48,1,.1,150);
    this.geo = new Map(); this.mat = new Map(); this.labels = new Map(); this.levelMaterials=[];
    this.units = new Map(); this.bullets = new Map(); this.pickups = new Map(); this.bulletPool = [];
    this.platformMeshes = []; this.hazardMeshes = []; this.animate = [];
    this.tmp = new THREE.Vector3(); this.matrix = new THREE.Matrix4(); this.color = new THREE.Color();
    this.scene.add(new THREE.HemisphereLight('#dceff6','#607466',2.2));
    this.sun = new THREE.DirectionalLight('#fff0cd',3.4);
    this.sun.position.set(-16,30,24); this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1536,1536); this.sun.shadow.camera.left=-24; this.sun.shadow.camera.right=24;
    this.sun.shadow.camera.top=23; this.sun.shadow.camera.bottom=-23;
    this.sun.shadow.camera.near=1; this.sun.shadow.camera.far=110;
    this.sun.shadow.normalBias=.035; this.sun.shadow.bias=-.0002;
    this.scene.add(this.sun, this.sun.target);
    this.fill = new THREE.DirectionalLight('#9fc9eb',.75); this.fill.position.set(10,6,-15); this.scene.add(this.fill);
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
    if(type==='sphere') g=new THREE.IcosahedronGeometry(.5,1);
    else if(type==='rock') g=new THREE.IcosahedronGeometry(.5,0);
    else if(type==='cylinder') g=new THREE.CylinderGeometry(.5,.5,1,8);
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
    if(!this.mat.has(key)) this.mat.set(key,new THREE.MeshStandardMaterial({color,emissive:glow?color:'#000000',emissiveIntensity:glow,roughness:.8,metalness:.1,flatShading:true,transparent:opacity<1,opacity,depthWrite:opacity>=1}));
    return this.mat.get(key);
  }
  mesh(parent,x,y,z,w,h,d,color,type='box',glow=0,opacity=1) {
    const m=new THREE.Mesh(this.geometry(type),this.material(color,glow,opacity));
    m.position.set(x,y,z); m.scale.set(w,h,d); m.castShadow=opacity>=1; m.receiveShadow=true; parent.add(m); return m;
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
    const v=this.aspect<1?18:this.level?.mode==='vertical'?17.5:14.5;
    this.camera.left=-v*this.aspect/2;this.camera.right=v*this.aspect/2;this.camera.top=v/2;this.camera.bottom=-v/2;this.camera.updateProjectionMatrix();
    this.baseCamera.aspect=this.aspect;this.baseCamera.updateProjectionMatrix();
  }
  setLevel(level) {
    this.level=level;this.theme=level.theme||'jungle';this.palette={...PALETTES[this.theme],...level.palette};
    this.world.traverse(m=>{if(m.isInstancedMesh)m.dispose();});
    for(const m of this.levelMaterials)m.dispose();this.levelMaterials=[];
    this.world.clear();this.dynamic.clear();this.units.clear();this.bullets.clear();this.pickups.clear();this.bulletPool.length=0;
    this.platformMeshes=[];this.hazardMeshes=[];this.animate=[];this.bossMesh=null;
    this.water=null;this.waterLines=[];this.waterfalls=[];this.shield=null;this.baseGrid=[];
    this.scene.background=new THREE.Color(this.palette.sky);
    this.scene.fog=new THREE.Fog(this.palette.fog,38,110);
    this.rng=random((level.index||0)*713+this.theme.length*3701+17);
    if(level.mode==='base')this.buildBase();else this.buildLandscape();
    for(const p of level.platforms||[])this.platformMeshes.push(this.makePlatform(p));
    for(const h of level.hazards||[])this.hazardMeshes.push(this.makeHazard(h));
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
    const g=this.group(this.world,x,y,z);g.rotation.y=this.rng()*6.28;
    this.mesh(g,0,1.4*s,0,.32*s,2.8*s,.35*s,'#756e56','cylinder');
    if(snow||this.theme==='waterfall') {
      for(let j=0;j<3;j++)this.mesh(g,0,(2+j*.67)*s,0,(2.7-j*.65)*s,1.8*s,(2.7-j*.65)*s,snow&&j%2===0?'#e7f3ed':['#406b59','#5d8162','#7a9870'][j],'cone');
    } else {
      for(let j=0;j<4;j++) { const a=j*2.4,r=j? .65*s:0;const leaf=this.mesh(g,Math.cos(a)*r,(2.9+this.rng()*.65)*s,Math.sin(a)*r,2.3*s,1.8*s,2.5*s,['#587354','#708959','#8da968','#a1b678'][j],'rock');leaf.rotation.set(this.rng(),this.rng(),this.rng()); }
      this.mesh(g,.6*s,1.9*s,0,1.5*s,.2*s,.25*s,'#756e56','box').rotation.z=.4;
    }
  }
  palm(x,y,z,s=1) {
    const g=this.group(this.world,x,y,z);g.rotation.y=this.rng()*6.28;
    for(let j=0;j<4;j++){
      const trunk=this.mesh(g,j*.12*s,(j+.5)*.78*s,0,.28*s,.86*s,.32*s,'#827d59','cylinder');trunk.rotation.z=-.14;
      this.mesh(g,j*.12*s,(j+.9)*.78*s,0,.32*s,.10*s,.35*s,'#6c7351','cylinder');
    }
    for(let j=0;j<7;j++) {
      const a=j*Math.PI*2/7,r=1.05*s,leaf=this.mesh(g,.42*s+Math.cos(a)*r,3.25*s,Math.sin(a)*r,3.1*s,.26*s,.73*s,j%2?'#7b9b59':'#a0b776','rock');
      leaf.rotation.y=-a;leaf.rotation.z=Math.cos(a)*-.13;
    }
    this.mesh(g,.44*s,3.05*s,0,.60*s,.45*s,.6*s,'#8e9661','rock');
  }
  rock(x,y,z,s=1,color=this.palette.ground) {
    const m=this.mesh(this.world,x,y+s*.4,z,s*1.7,s,s*1.3,color,'rock');m.rotation.set(.2,this.rng()*6,.14);return m;
  }
  buildLandscape() {
    const {level,palette:p,theme}=this, vertical=level.mode==='vertical',len=Math.max(40,level.length||180),height=level.height||85;
    const natural=['jungle','waterfall','snow'].includes(theme),rng=this.rng;
    // A cool, readable foreground river separates the playable shelf from the viewer.
    if(natural) {
      this.water=this.mesh(this.dynamic,len/2,-2.3,6,len+80,.16,17,theme==='snow'?'#77b9d0':'#299ebc','box',.04,.92);
      this.waterLines=[];
      for(let i=0;i<20;i++) {const line=this.mesh(this.dynamic,rng()*len,-2.15,3+rng()*9,1+rng()*3,.035,.08,'#b9f1e8','box',.1,.65);line.userData.startX=line.position.x;this.waterLines.push(line);}
    } else {
      this.mesh(this.world,len/2,-4,4,len+40,.7,30,theme==='energy'?'#a96648':p.ground);
      if(theme==='energy') {
        this.mesh(this.world,len/2,-3.5,8,len+30,.05,12,'#d97b46','box',.55);
        for(let i=0;i<38;i++)this.mesh(this.world,rng()*len,-3.4,4+rng()*8,1+rng()*2,.04,.13,'#ffcf85','box',1);
      }
    }
    // Long-distance silhouettes remain in view during the entire scroll.
    for(let i=0;i<Math.ceil(len/13)+6;i++) {
      const x=i*13-30,z=-39-rng()*15,h=10+rng()*15;
      const m=this.mesh(this.world,x,h*.15-3,z,30+rng()*15,h,15,theme==='snow'?'#91b9cc':theme==='energy'?'#9e9690':theme==='alien'?'#455866':'#7badae','rock');m.rotation.y=rng()*6;
      if(theme==='snow')this.mesh(this.world,x,h*.42-3,z,12,h*.28,8,'#e0eef0','rock').rotation.y=m.rotation.y;
    }
    if(vertical) {
      for(let y=-3;y<height+15;y+=6) {
        this.mesh(this.world,-5,y,-5,12,7,10,'#586f66','rock').rotation.z=.15;
        this.mesh(this.world,35,y,-8,15,9,11,'#617568','rock').rotation.z=-.3;
        this.mesh(this.world,15,y,-15,32,7,6,'#749b93','rock');
        for(let i=0;i<3;i++)this.rock(rng()*30,y,-6,2+rng()*3,'#566f61');
        this.tree(rng()<.5?-2:32,y+2.5,-8,.6+rng()*.6);
      }
      this.waterfalls=[];
      for(const x of [8,18,25]) {
        this.mesh(this.world,x,height*.5-2,-10,3.2,height+20,.3,'#64c4d3','box',.1,.76);
        for(let i=0;i<12;i++) {const stripe=this.mesh(this.dynamic,x+(rng()-.5)*2.4,rng()*height,-9.7,.12,1.5+rng()*3,.05,'#c1f5ef','box',.25,.72);stripe.userData.offset=stripe.position.y;this.waterfalls.push(stripe);}
        this.mesh(this.world,x,-1,-8,6,1.3,5,'#b0e5e1','rock',.1,.7);
      }
    } else if(natural) {
      for(let x=-15;x<len+30;x+=5.7) {
        const y=-1.05,z=-5-rng()*9;
        this.rock(x,-3.3,z,3+rng()*3,theme==='snow'?'#adc7ce':'#91a586');
        if(theme==='jungle'&&rng()>.56)this.palm(x,y,z,.95+rng()*.7);
        else this.tree(x,y,z,.75+rng()*1.05,theme==='snow');
        if(rng()>.55)this.tree(x+2,y,-17,.6+rng()*.9,theme==='snow');
      }
      for(let x=6;x<len;x+=19) {
        const g=this.group(this.world,x,-1,-5);this.mesh(g,0,1,0,3,2.1,2.5,C.pale,'armor');
        this.mesh(g,0,1.3,1.27,2.4,.6,.1,C.dark);this.mesh(g,-.7,1.3,1.35,.15,.15,.08,C.cyan,'box',.6);
        this.mesh(g,1.3,2.2,-.3,.08,2.1,.08,C.steel);this.mesh(g,1.3,3.2,-.3,.6,.1,.08,C.coral);
      }
    } else if(theme==='alien') {
      for(let x=-8;x<len+20;x+=8) {
        const rib=[[-3.4,-.6],[-3.8,2],[-2.9,4.6],[-1.6,6.6],[0,7.2],[1.6,6.6],[2.9,4.6],[3.8,2],[3.4,-.6]];
        for(let j=0;j<rib.length-1;j++){
          const a=rib[j],b=rib[j+1],dx=b[0]-a[0],dy=b[1]-a[1];
          const bone=this.mesh(this.world,x+(a[0]+b[0])/2,(a[1]+b[1])/2,-9,.68,Math.hypot(dx,dy)+.2,1.3,j%2?'#91aea0':'#718b89','armor');bone.rotation.z=-Math.atan2(dx,dy);
          this.mesh(this.world,x+a[0],a[1],-9,.82,.82,1.45,'#b3c2b0','rock');
        }
        this.rock(x,-.8,-6,3,'#967f7b');
        for(let j=0;j<3;j++)this.mesh(this.world,x+j*.5,1,-6,.23,2+j*.6,.23,'#bf857a','cylinder');
        this.mesh(this.world,x,3.4,-8,1.4,2.6,1.1,'#8dc8b7','sphere',.28);
      }
    } else if(theme==='energy') {
      for(let x=-10;x<len+20;x+=11) {
        const z=-8,h=6+rng()*3;
        this.mesh(this.world,x,h/2-1,z,5.6,h,5.6,'#8a958f','cylinder');
        for(const y of [0,h*.45,h-1.2])this.mesh(this.world,x,y,z,5.85,.20,5.85,C.dark,'cylinder');
        this.mesh(this.world,x,h-.9,z,5.7,.35,5.7,C.edge,'cylinder');
        this.mesh(this.world,x,h+.15,z,1.5,1.8,1.5,C.steel,'cylinder');
        this.mesh(this.world,x,h+1,z,1.65,.16,1.65,p.accent,'cylinder',.5);
        this.mesh(this.world,x,h*.55,z+2.85,1.8,1.4,.1,C.dark,'armor');
        for(let j=0;j<3;j++)this.mesh(this.world,x-.55+j*.55,h*.55,z+2.93,.24,.82,.1,p.accent,'box',.55);
        const pipe=this.mesh(this.world,x+4,1.8,z+1.9,.8,8,.8,C.steel,'cylinder');pipe.rotation.z=Math.PI/2;
        this.mesh(this.world,x+7,2.8,z+1.9,.9,2.8,.9,C.steel,'cylinder');
        this.mesh(this.world,x+7,4.25,z+1.9,1.4,.24,1.4,C.edge,'cylinder');
      }
    } else {
      for(let x=-10;x<len+20;x+=10) {
        const z=-7,h=7+rng()*4;
        this.mesh(this.world,x,h/2-1,z,7.8,h,5,theme==='hangar'?'#7594a7':'#928f89','armor');
        this.mesh(this.world,x,h/2,z+2.54,6,h-1,.15,C.dark);
        for(let j=0;j<7;j++)this.mesh(this.world,x,.6+j*(h-2)/7,z+2.7,5.8,.56,.13,'#567486');
        for(const side of [-1,1])this.mesh(this.world,x+side*2.6,h-1.5,z+2.81,.35,.16,.12,p.accent,'box',.65);
        this.mesh(this.world,x,h-.1,z,8.3,.3,5.5,C.edge);
        if(theme==='energy'){this.mesh(this.world,x,h+1,z,1.6,2.5,1.6,C.steel,'cylinder');this.mesh(this.world,x,h+2.3,z,1.75,.16,1.75,p.accent,'cylinder',.5);}
        if(theme==='hangar'){this.mesh(this.world,x,h+2,z,.3,5,.3,C.dark);this.mesh(this.world,x+3,h+4,z,6,.3,.5,C.edge);}
      }
    }
    // Drifting high clouds are solid low-poly volumes, not billboards.
    if(natural||theme==='energy'||theme==='hangar')for(let i=0;i<14;i++) {
      const x=rng()*len,z=-32-rng()*20,y=17+rng()*7;
      for(let j=0;j<3;j++)this.mesh(this.world,x+j*2,y+Math.sin(j)*.6,z,5,1.5,2.5,'#edf3ea','sphere',0,.7);
    }
  }
  buildBase() {
    const p=this.palette, purple=this.theme==='base2';this.water=null;this.waterLines=[];this.waterfalls=[];
    this.scene.fog=new THREE.Fog(p.fog,32,80);
    this.mesh(this.world,0,-.35,-4,27,.7,46,C.dark);
    for(let z=-25;z<21;z+=4) {
      for(let x=-10;x<=10;x+=4)this.mesh(this.world,x,-.08,z,3.83,.15,3.84,'#5b717a','armor');
      for(const side of [-1,1]) {
        this.mesh(this.world,side*12,3.6,z,1.6,7.5,3.75,C.steel,'armor');
        this.mesh(this.world,side*11.13,3.7,z,.14,5,2.6,C.dark,'armor');
        this.mesh(this.world,side*11,5.7,z,.16,.17,2,p.accent,'box',.75);
        this.mesh(this.world,side*9.7,.02,z,.18,.1,2.8,p.accent,'box',.35);
      }
    }
    this.mesh(this.world,0,3.6,-25,26,8,1.3,'#657b82','armor');
    this.mesh(this.world,0,3.3,-24.2,8,6,.5,C.dark,'armor');
    this.baseDoor=this.mesh(this.dynamic,0,3,-23.87,5.5,4.7,.1,purple?'#695788':'#3c666a','armor');
    for(const side of [-1,1]){
      this.mesh(this.world,side*5,3.8,-23.8,1,7.5,1.6,C.pale,'armor');
      this.mesh(this.world,side*8,2,-22,3,3.5,2,C.dark,'armor');
      for(let j=0;j<4;j++)this.mesh(this.world,side*8,1+j*.6,-20.95,2.1,.15,.1,j%2?p.accent:C.gold,'box',.5);
    }
    for(let z=-18;z<15;z+=11){this.mesh(this.world,0,7.8,z,24,.4,.8,C.edge);this.mesh(this.world,0,7.55,z,8,.08,.38,'#ddf2e8','box',.75);}
    this.shield=this.mesh(this.dynamic,0,2.2,-12,21,4.4,.03,p.accent,'box',.5,.14);
    this.baseGrid=[];
    for(let i=0;i<13;i++)this.baseGrid.push(this.mesh(this.dynamic,-10+i*1.65,2.2,-11.95,.035,4.4,.035,p.accent,'box',1,.62));
    this.roomLight=new THREE.PointLight(p.accent,15,25,2);this.roomLight.position.set(0,5,-12);this.dynamic.add(this.roomLight);
    this.baseAccentMaterials=[];
    const accentColor=new THREE.Color(p.accent),replacements=new Map();
    for(const root of [this.world,this.dynamic])root.traverse(m=>{
      if(!m.isMesh||!m.material.color.equals(accentColor)||m.material.emissiveIntensity<=0)return;
      let replacement=replacements.get(m.material);if(!replacement){replacement=m.material.clone();replacements.set(m.material,replacement);this.baseAccentMaterials.push(replacement);this.levelMaterials.push(replacement);}m.material=replacement;
    });
    this.lastBaseRoom=-1;
  }
  makePlatform(p) {
    const g=this.group(this.dynamic,(p.x||0)+(p.w||1)/2,p.y||0,0),w=p.w||1,h=Math.max(.3,p.h||1),theme=this.theme;
    const natural=['jungle','waterfall','snow','alien'].includes(theme)&&!['metal','moving','bridge','lift'].includes(p.kind);
    const body=this.mesh(g,0,-h/2,-.7,w,h,4.8,natural?this.palette.ground:C.steel,'box');
    this.mesh(g,0,-.10,-.6,w+.06,.22,5,natural?this.palette.top:C.pale,'box');
    this.mesh(g,0,-.37,1.77,w,.22,.12,natural?(theme==='snow'?'#cce3e7':'#5e7859'):C.dark);
    if(natural) {
      // Rock strata have deliberate horizontal layers with a shaded front face.
      if(h>1)this.mesh(g,0,-Math.min(h-.2,1.1),1.77,w,.17,.09,theme==='snow'?'#7ea7b8':'#697c64');
      for(let i=0;i<Math.min(6,Math.floor(w/3));i++) {
        const x=-w*.4+i*w/Math.max(1,Math.floor(w/3));
        if(theme!=='snow'&&theme!=='alien')this.mesh(g,x,.1,-1.3,.08,.32,.07,'#92ae77','cone');
      }
      if(h>1.2)for(let i=0;i<Math.min(5,Math.floor(w/4));i++){
        const x=-w*.42+i*w/Math.max(1,Math.floor(w/4)),snow=theme==='snow';
        const stone=this.mesh(g,x,-Math.min(h-.3,1.8+i%2*.8),1.84,1.3+i%2*.5,.55,.38,snow?'#8daebb':theme==='alien'?'#9c838a':'#758b70','rock');stone.rotation.z=(i%2-.5)*.3;
        this.mesh(g,x+.25,-.56,1.85,1.1,.15,.15,snow?'#d7ebed':theme==='alien'?'#9db7a2':'#99ac71','rock');
      }
      if(theme==='jungle'||theme==='waterfall')for(let i=0;i<Math.min(2,Math.floor(w/10));i++){
        const x=-w*.32+i*w*.48;
        for(const side of [-1,1]){
          const leaf=this.mesh(g,x+side*.18,.20,-1.5,.65,.14,.18,side<0?'#6a914e':'#a5bf77','rock');leaf.rotation.z=side*.6;
          const tip=this.mesh(g,x+side*.10,.34,-1.55,.47,.12,.16,'#91ad64','rock');tip.rotation.z=side*.95;
        }
      }
    } else {
      for(let x=-w/2+.45;x<w/2;x+=2.5){this.mesh(g,x,-.38,1.85,.65,.10,.04,this.palette.accent,'box',.28);this.mesh(g,x,-h*.6,1.8,.13,Math.min(.5,h*.45),.1,C.edge);}
      if(p.kind==='bridge'){this.mesh(g,0,-h-.3,0,w,.22,.25,C.dark);for(let x=-w*.5+.4;x<w*.5;x+=1.5)this.mesh(g,x,-h*.5,0,.13,h,.23,C.dark).rotation.z=.6;}
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
    const g=new THREE.Group(), body=this.group(g), blue=player?(id===1?'#e29154':C.blue):'#425564',dark=player?C.blueDark:'#293d54';
    g.userData.body=body;
    const hip=this.group(body,0,.7,0);g.userData.hip=hip;
    this.mesh(body,0,.9,0,.49,.43,.37,dark,'armor');
    this.mesh(body,0,1.16,0,.62,.40,.45,blue,'armor');
    this.mesh(body,.12,1.15,.24,.29,.21,.065,player?'#54b4f8':'#5b748a','armor');
    this.mesh(body,-.20,1.13,-.27,.25,.42,.2,C.dark,'armor');
    this.mesh(body,0,1.46,0,.37,.34,.37,C.skin,'armor');
    this.mesh(body,-.035,1.62,0,.42,.19,.42,player?dark:C.dark,'armor');
    this.mesh(body,.202,1.5,.08,.07,.12,.27,player?C.ice:C.coral,'box',.15);
    this.mesh(body,-.03,1.56,.235,.38,.065,.035,player?'#e56f54':'#c27259');
    const band=this.mesh(body,-.3,1.48,.22,.4,.06,.045,player?'#d95e48':'#9b5348');band.rotation.z=-.2;g.userData.band=band;
    const legs=[];
    for(const z of [-.15,.15]) {
      const leg=this.group(body,0,.70,z);this.mesh(leg,0,-.21,0,.23,.42,.25,dark,'armor');
      this.mesh(leg,.045,-.45,0,.26,.18,.28,blue,'armor');this.mesh(leg,.07,-.61,0,.37,.17,.30,'#173757','armor');legs.push(leg);
    }
    g.userData.legs=legs;
    const arm=this.group(body,0,1.23,.3);g.userData.arm=arm;
    this.mesh(arm,.1,-.10,0,.28,.27,.32,player?'#54b4f8':'#5b748a','armor');
    this.mesh(arm,.27,-.19,0,.4,.19,.22,C.skin,'armor');
    this.mesh(arm,.50,-.10,.025,.59,.22,.18,'#213750','armor');
    this.mesh(arm,.82,-.055,.025,.17,.11,.13,C.edge);this.mesh(arm,.42,-.25,.025,.14,.21,.16,C.dark,'armor');
    this.mesh(arm,.5,.02,.025,.17,.045,.12,C.gold,'box',.3);
    const muzzle=this.mesh(arm,.94,-.055,.025,.28,.18,.14,'#ffdfa0','rock',2);muzzle.visible=false;g.userData.muzzle=muzzle;
    const shadow=this.mesh(g,0,.012,0,.78,.01,.5,'#17272a','cylinder',0,.18);shadow.castShadow=false;g.userData.shadow=shadow;
    return g;
  }
  enemy(kind) {
    if(['rifle','soldier','runner','sniper','jumper','grenadier','commando'].includes(kind)||!kind)return this.humanoid(false);
    const g=new THREE.Group();g.userData.kind=kind;
    if(kind==='core') {
      this.mesh(g,0,.55,0,1.25,1.12,.6,C.dark,'armor');this.mesh(g,0,.55,.35,1.02,.91,.13,C.edge,'armor');
      this.mesh(g,0,.55,.48,.50,.65,.24,this.palette.accent,'sphere',.7);
      const ring=this.mesh(g,0,.55,.57,.92,.92,.7,this.palette.accent,'ring',.25);g.userData.spin=ring;
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
      this.baseCamera.position.set(sx,11+sy-transit*.9,27-transit*4);this.baseCamera.lookAt(0,1.8,-7);
      if(this.baseDoor)this.baseDoor.position.y=3+Math.min(1,transit*3)*5;
      if(this.lastBaseRoom!==(state.baseRoom||0)){
        const color=this.level.baseRooms?.[state.baseRoom||0]?.color||this.palette.accent;
        for(const m of this.baseAccentMaterials||[]){m.color.set(color);m.emissive.set(color);}
        this.roomLight?.color.set(color);this.lastBaseRoom=state.baseRoom||0;
      }
    }
    else {this.camera.position.set(cx+sx,cy+2.8+sy,29);this.camera.lookAt(cx+sx,cy+sy,0);}
    const lx=base?0:cx,ly=base?0:cy;
    this.sun.position.set(lx-18,ly+29,23);this.sun.target.position.set(lx,ly,0);this.sun.target.updateMatrixWorld();
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
        body.rotation.z=e.prone?-.95:((!e.grounded&&isPlayer&&Math.abs(e.vy||0)>2)?Math.sin(time*10)*.12:0);
        g.userData.legs.forEach((leg,i)=>leg.rotation.z=e.prone?(i?-.55:.8):Math.sin(phase+i*Math.PI)*.68*run);
        const aimX=Math.abs(e.aimX??1),aimY=e.aimY||0;
        g.userData.arm.rotation.z=base?0:Math.atan2(aimY,Math.max(.05,aimX));
        g.userData.band.rotation.z=-.2+Math.sin(time*18)*.10*run;
        g.userData.muzzle.visible=(e.muzzle||0)>0||!!e.firing&&Math.floor(time*30)%2===0;
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
    for(const g of this.geo.values())g.dispose();for(const m of this.mat.values())m.dispose();
    for(const m of this.labels.values()){m.map.dispose();m.dispose();}
    for(const m of this.levelMaterials)m.dispose();
    this.particleSystem.geometry.dispose();this.particleMaterial.dispose();this.renderer.dispose();
    this.world.clear();this.dynamic.clear();this.units.clear();this.bullets.clear();this.pickups.clear();
  }
}
