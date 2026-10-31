/* The film.html start screen's local Three.js fat-line + bloom rendering approach,
   with purpose-built arcade geometry. No game or film runtime is loaded here. */
import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function mountScene(canvas,host){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),BG='#000000';scene.background=new THREE.Color(BG);scene.fog=new THREE.Fog(BG,13,35);
  const camera=new THREE.PerspectiveCamera(38,1,.1,80);
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
  // Keep the close neon glow while reducing the wider spill into the page.
  const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.56,.19,.22);composer.addPass(bloom);composer.addPass(new OutputPass());
  const N={pink:'#FF4FD8',vio:'#8B5CFF',cyan:'#4FE8FF',pale:'#FFD6F5',hot:'#FF2E88'},materials=[];
  const PV=[N.vio,N.pink],VP=[N.pink,N.vio];
  function material(color,width=2.4,opacity=1){const gradient=Array.isArray(color),m=new LineMaterial({color:gradient?'#fff':color,vertexColors:gradient,linewidth:width,transparent:true,opacity,fog:true});if(gradient)m.userData.gradient=color.map(c=>new THREE.Color(c));materials.push(m);return m;}
  class Wire{
    constructor(){this.p=[];}
    seg(a,b){this.p.push(...a,...b);return this;}
    poly(points,closed=false){for(let i=0;i<points.length-(closed?0:1);i++)this.seg(points[i],points[(i+1)%points.length]);return this;}
    box(w,h,d,x=0,y=0,z=0){const box=new THREE.BoxGeometry(w,h,d),geo=new THREE.EdgesGeometry(box),a=geo.attributes.position.array;for(let i=0;i<a.length;i+=3)this.p.push(a[i]+x,a[i+1]+y,a[i+2]+z);geo.dispose();box.dispose();return this;}
    rrect(w,h,r,x=0,y=0,z=0){const points=[],corners=[[w/2-r,h/2-r,0],[-w/2+r,h/2-r,1],[-w/2+r,-h/2+r,2],[w/2-r,-h/2+r,3]];for(const[cx,cy,q]of corners)for(let k=0;k<=5;k++){const a=(q+k/5)*Math.PI/2;points.push([x+cx+Math.cos(a)*r,y+cy+Math.sin(a)*r,z]);}return this.poly(points,true);}
    circle(r,x=0,y=0,z=0,axis='z',n=36){const points=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2,u=Math.cos(a)*r,v=Math.sin(a)*r;points.push(axis==='z'?[x+u,y+v,z]:axis==='y'?[x+u,y,z+v]:[x,y+u,z+v]);}return this.poly(points,true);}
    mesh(mat){const g=new LineSegmentsGeometry();g.setPositions(this.p);if(mat.userData.gradient){const[a,b]=mat.userData.gradient,p=this.p,colors=[];let low=Infinity,high=-Infinity;for(let i=0;i<p.length;i+=3){const v=p[i+1]+p[i]*.25;low=Math.min(low,v);high=Math.max(high,v);}for(let i=0;i<p.length;i+=3){const k=(p[i+1]+p[i]*.25-low)/(high-low||1);colors.push(THREE.MathUtils.lerp(a.r,b.r,k),THREE.MathUtils.lerp(a.g,b.g,k),THREE.MathUtils.lerp(a.b,b.b,k));}g.setColors(colors);}const mesh=new LineSegments2(g,mat);mesh.computeLineDistances();return mesh;}
  }
  function face(points,color,parent){const g=new THREE.BufferGeometry(),p=[];for(let i=1;i<points.length-1;i++)p.push(...points[0],...points[i],...points[i+1]);g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1}));parent.add(m);return m;}
  const cabinet=new THREE.Group();scene.add(cabinet);cabinet.rotation.set(-.015,-.38,-.035);
  const profile=[[-2.7,-.66],[-2.7,.64],[-.7,.69],[-.22,1.34],[.15,1.30],[.25,.68],[.53,.66],[2.60,.30],[2.72,.79],[3.34,.67],[3.34,-.66]];
  const body=new Wire();for(const x of[-1.65,1.65])body.poly(profile.map(([y,z])=>[x,y,z]),true);for(const[y,z]of profile)body.seg([-1.65,y,z],[1.65,y,z]);cabinet.add(body.mesh(material(PV,2.4)));
  for(const x of[-1.642,1.642])face(profile.map(([y,z])=>[x,y,z]),x<0?'#150a29':'#100922',cabinet);
  for(let i=1;i<profile.length-1;i++){const a=profile[i],b=profile[i+1];face([[-1.64,a[0],a[1]-.005],[1.64,a[0],a[1]-.005],[1.64,b[0],b[1]-.005],[-1.64,b[0],b[1]-.005]],i===4?'#1a0c31':'#10091f',cabinet);}
  // Double-rimmed CRT, a recessed face, vector pixels and small score marks.
  const screen=new THREE.Group();screen.position.set(0,1.57,.494);screen.rotation.x=-.172;cabinet.add(screen);
  face([[-1.37,-1,0],[1.37,-1,0],[1.37,1,0],[-1.37,1,0]],'#090c20',screen);
  screen.add(new Wire().rrect(2.85,2.08,.18,0,0,.018).mesh(material(VP,2.2,.95)));
  screen.add(new Wire().rrect(2.60,1.82,.15,0,0,.028).mesh(material(N.cyan,2.15)));
  screen.add(new Wire().rrect(2.45,1.68,.12,0,0,.03).mesh(material(N.vio,1.1,.45)));
  const screenDetail=new Wire();for(let y=-.65;y<.72;y+=.135)screenDetail.seg([-1.12,y,.034],[1.12,y,.034]);screen.add(screenDetail.mesh(material(N.cyan,.8,.10)));
  const alien=['00100100','00011000','00111100','01100110','11111111','10100101'],pixels=new Wire();
  alien.forEach((row,j)=>[...row].forEach((v,i)=>{if(v==='1')pixels.rrect(.105,.082,.014,-.45+i*.13,.41-j*.11,.043);}));screen.add(pixels.mesh(material([N.cyan,N.pale],1.65,.95)));
  const score=new Wire();for(let k=0;k<9;k++)score.seg([-.98+k*.09,.68,.041],[-.93+k*.09,.68,.041]);for(let k=0;k<3;k++)score.rrect(.08,.04,.008,.76+k*.12,.68,.041);screen.add(score.mesh(material(N.pale,1.25,.8)));
  screen.add(new Wire().poly([[-.13,-.57,.045],[0,-.39,.045],[.13,-.57,.045],[0,-.53,.045]],true).seg([0,-.36,.045],[0,-.24,.045]).mesh(material(N.pink,1.8)));
  // Marquee with real depth, vector lettering, and narrow light strips.
  const marquee=new THREE.Group();marquee.position.set(0,3.015,.754);marquee.rotation.x=-.17;cabinet.add(marquee);
  marquee.add(new Wire().rrect(2.91,.43,.055,0,0,.016).mesh(material([N.pink,N.pale],2.15)));
  const glyph={A:[[0,0,0,1],[0,1,.55,1],[.55,1,.55,0],[0,.48,.55,.48]],R:[[0,0,0,1],[0,1,.55,1],[.55,1,.55,.5],[.55,.5,0,.5],[.2,.5,.6,0]],C:[[.55,1,0,1],[0,1,0,0],[0,0,.55,0]],D:[[0,0,0,1],[0,1,.45,1],[.45,1,.62,.75],[.62,.75,.62,.25],[.62,.25,.45,0],[.45,0,0,0]],E:[[.55,1,0,1],[0,1,0,0],[0,0,.55,0],[0,.5,.44,.5]]};
  const letters=new Wire();[...'ARCADE'].forEach((letter,i)=>{for(const[x1,y1,x2,y2]of glyph[letter])letters.seg([-.90+i*.31+x1*.28,-.12+y1*.24,.024],[-.90+i*.31+x2*.28,-.12+y2*.24,.024]);});marquee.add(letters.mesh(material(N.pale,1.5,.9)));
  const vents=new Wire();for(let i=0;i<6;i++){vents.seg([-1.42+i*.055,-.11,.023],[-1.42+i*.055,.11,.023]);vents.seg([1.15+i*.055,-.11,.023],[1.15+i*.055,.11,.023]);}marquee.add(vents.mesh(material(N.cyan,1.15,.6)));
  // Broad control deck, spherical joystick, six raised buttons and two start keys.
  const deck=new THREE.Group();deck.position.set(0,.205,.985);deck.rotation.x=-Math.PI*.5+.16;cabinet.add(deck);
  deck.add(new Wire().rrect(3.00,.48,.055,0,0,.02).mesh(material(VP,1.5,.8)));
  for(const x of[-.36,-.04])deck.add(new Wire().rrect(.20,.09,.025,x,-.08,.03).mesh(material(N.pale,1.3,.7)));
  const stick=new THREE.Group();stick.position.set(-.86,.23,.98);cabinet.add(stick);
  stick.add(new Wire().circle(.24,0,.015,0,'y').circle(.14,0,.04,0,'y').seg([-.028,.04,0],[-.028,.47,0]).seg([.028,.04,0],[.028,.47,0]).mesh(material(N.cyan,1.8)));
  stick.add(new Wire().circle(.16,0,.57,0,'x').circle(.16,0,.57,0,'y').circle(.16,0,.57,0,'z').mesh(material([N.pink,N.pale],2.1)));
  [[.35,.86],[.71,.86],[1.07,.86],[.42,1.16],[.78,1.16],[1.14,1.16]].forEach(([x,z],i)=>{const y=.15+(1.30-z)*.162+.015,color=[N.pink,N.cyan,N.pink,N.vio,N.pink,N.cyan][i];const b=new Wire().circle(.115,x,y,z,'y').circle(.115,x,y+.08,z,'y').seg([x-.115,y,z],[x-.115,y+.08,z]).seg([x+.115,y,z],[x+.115,y+.08,z]);cabinet.add(b.mesh(material(color,1.75,.95)));});
  cabinet.add(new Wire().seg([-1.5,-.40,1.17],[1.5,-.40,1.17]).mesh(material(N.cyan,1.3,.65)));
  // The cabinet is the only subject; black is composited with screen blending.
  const motion=matchMedia('(prefers-reduced-motion: reduce)');let width=0,height=0,visible=true,disposed=false,frame=0,timer=0,last=0,time=0,ready=false;
  const mouse={x:0,y:0,sx:0,sy:0};
  function draw(){if(disposed||!width||!height)return;mouse.sx+=(mouse.x-mouse.sx)*.08;mouse.sy+=(mouse.y-mouse.sy)*.08;const still=motion.matches;cabinet.rotation.y=-.38+(still?0:Math.sin(time*.25)*.05);cabinet.position.y=still?0:Math.sin(time*.6)*.025;const distance=width/height<1.08?7.65:7.05;camera.position.set(.12+(still?0:mouse.sx*.25),1.65-(still?0:mouse.sy*.13),distance);camera.lookAt(0,1.40,0);composer.render();if(!ready){ready=true;canvas.dataset.renderer='webgl';host.dataset.sceneState='ready';}}
  function stop(){clearTimeout(timer);timer=0;if(frame)cancelAnimationFrame(frame);frame=0;last=0;}
  function tick(now){frame=0;if(disposed||document.hidden||!visible||motion.matches)return;if(last)time+=Math.min(.1,(now-last)/1000);last=now;draw();timer=setTimeout(()=>{timer=0;frame=requestAnimationFrame(tick);},1000/30);}
  function sync(){stop();if(!disposed&&!document.hidden&&visible){draw();if(!motion.matches)frame=requestAnimationFrame(tick);}}
  function resize(){const box=host.getBoundingClientRect(),w=Math.max(1,Math.round(box.width)),h=Math.max(1,Math.round(box.height));if(w===width&&h===height)return;width=w;height=h;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(w,h,false);composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();materials.forEach(m=>m.resolution.set(w,h));sync();}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
  const intersectionObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();});intersectionObserver.observe(host);
  host.addEventListener('pointermove',event=>{if(motion.matches)return;const box=host.getBoundingClientRect();mouse.x=(event.clientX-box.left)/box.width-.5;mouse.y=(event.clientY-box.top)/box.height-.5;},{passive:true});host.addEventListener('pointerleave',()=>{mouse.x=mouse.y=0;},{passive:true});
  document.addEventListener('visibilitychange',sync);motion.addEventListener?.('change',sync);window.addEventListener('pagehide',stop);window.addEventListener('pageshow',sync);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();stop();host.dataset.sceneState='fallback';disposed=true;});
  resize();
  return ()=>{disposed=true;stop();resizeObserver.disconnect();intersectionObserver.disconnect();composer.dispose();renderer.dispose();};
}
