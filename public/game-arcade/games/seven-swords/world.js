/* 七剑江湖 · 九境行游。剧情停驻、同行歇脚与山道遭遇，共用等角空间与脚点纵深。 */
(function(){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const lerp=(a,b,t)=>a+(b-a)*t,TAU=Math.PI*2;
  // The tower opens from its broad front court, not from a point on the side wall.
  const interactionRadius=(target,ordinary=108)=>target?.type==='tower'?170:ordinary;
  const LABELS={forest:'风穿林海 · 鸟鸣深处',palace:'花影临水 · 月宫遗韵',inn:'溪桥灯暖 · 烟火人间',temple:'山雨初歇 · 药香入云',village:'长风过庄 · 故人旧事',waterfall:'飞瀑鸣涧 · 栈道穿云',bamboo:'竹声清越 · 碧水十里',garden:'百草逢春 · 琴声悠悠',summit:'云海翻涌 · 七剑之约'};
  function create(opts){
    if(!window.JianghuScene||!window.GameArt)throw new Error('山河素材尚未就绪');
    const J=window.JianghuScene,A=window.GameArt,D=window.GAME_DATA,R=window.JianghuRegions;
    const host=opts.container,canvas=host.querySelector('canvas.world-canvas'),ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)throw new Error('此浏览器无法展开画卷');
    const mini=host.querySelector('#worldMini'),mc=mini?.getContext('2d');
    let scene=R?R.create(opts.getState?.()?.current||'forest',D):J.createWorld(D);const camera={x:scene.spawn.x,y:scene.spawn.y,z:0,zoom:1,width:1200,height:700};
    const p={x:scene.spawn.x,y:scene.spawn.y,dir:Math.PI/2,z:0,walking:false,phase:0,air:0,dash:0,cooldown:0,swing:0};
    let width=1200,height=700,dpr=1,time=0,last=0,raf=0,paintDirty=true,dead=false,path=[],destination=null,autoInteract=null,near=null,blockedTime=0;
    let keys=new Set(),stick={x:0,y:0,id:null},pointerDown=null,zoomUser=1,saveClock=0,uiClock=0,moved=0,wasActive=false;
    let region=scene.locations[0],travelGoal=null,pendingTarget=null,locationTag='',lastHint='',lastQuest='',lastTracked='',tracked=null,trail=[],trailClock=0,footsteps=[],errorShown=false;
    const handlers=[],collisionCache=new Map(),lifePositions=new Map(),followers=new Map(),GRID=48;let COLS=Math.ceil(scene.width/GRID),ROWS=Math.ceil(scene.height/GRID),socialGather=null,lifeRefresh=0,lifeCollisionKey='';
    const on=(el,type,fn,options)=>{el.addEventListener(type,fn,options);handlers.push(()=>el.removeEventListener(type,fn,options));};
    const state=()=>opts.getState?.(),active=()=>!!state()&&!opts.isPaused?.()&&!document.hidden;
    const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const hero=()=>D.heroes.find(h=>h.id===(state()?.hero||opts.getPreviewHero?.()))||D.heroes[0];
    const at=(x,y,z=scene.heightAt(x,y))=>J.screen(x,y,z,camera);
    const found=id=>(state()?.world?.finds||[]).includes(id);
    function worldAt(sx,sy){
      const cp=J.project(camera.x,camera.y,camera.z),px=(sx-width/2)/camera.zoom+cp.x,py=(sy-height/2)/camera.zoom+cp.y;
      let q=J.unproject(px,py,scene.heightAt(p.x,p.y));
      for(let n=0;n<5;n++)q=J.unproject(px,py,scene.heightAt(q.x,q.y));
      return {x:clamp(q.x,36,scene.width-36),y:clamp(q.y,36,scene.height-36)};
    }
    function safePoint(point,clearance=22){
      const q={x:clamp(Number(point?.x)||scene.spawn.x,36,scene.width-36),y:clamp(Number(point?.y)||scene.spawn.y,36,scene.height-36)};
      if(scene.canMove(q.x,q.y,clearance))return q;
      for(let r=24;r<=240;r+=24)for(let k=0;k<16;k++){const x=q.x+Math.cos(k*TAU/16)*r,y=q.y+Math.sin(k*TAU/16)*r;if(scene.canMove(x,y,clearance))return{x,y};}
      return {x:scene.spawn.x,y:scene.spawn.y};
    }
    function setRegion(id,{from=null,restore=false,preserve=true,notify=true}={}){
      const s=state();if(!D.locations.some(l=>l.id===id))return false;
      if(preserve)syncPosition();
      if(R&&scene.id!==id){const previous=scene;scene=R.create(id,D);previous.dispose?.();collisionCache.clear();COLS=Math.ceil(scene.width/GRID);ROWS=Math.ceil(scene.height/GRID);}
      followers.clear();lifePositions.clear();socialGather=null;lifeCollisionKey='';
      if(scene.colliders)for(let i=scene.colliders.length-1;i>=0;i--)if(scene.colliders[i].lifeId)scene.colliders.splice(i,1);
      const loc=scene.locations.find(l=>l.id===id)||scene.locations[0];region=loc;
      const w=s?.world,saved=restore&&w?.format===3?(w.region===id&&Number.isFinite(w.x)&&Number.isFinite(w.y)?w:w.positions?.[id]):null;
      const entry=from&&scene.entryFrom?.[from],q=safePoint(entry||saved||loc.spawn||scene.spawn,saved?18:22);
      Object.assign(p,q,{dir:Number.isFinite(saved?.dir)?saved.dir:Math.PI/2,z:scene.heightAt(q.x,q.y),walking:false,phase:0,air:0,dash:0,cooldown:0,swing:0,jumpDir:null});
      zoomUser=clamp(w?.zoom||1,.65,1.5);camera.x=p.x;camera.y=p.y;camera.z=p.z;
      path=[];destination=null;autoInteract=null;near=null;tracked=null;trail=[];footsteps=[];blockedTime=0;keys.clear();stick.x=stick.y=0;pointerDown=null;
      resize();syncPosition();updateTargets();
      if(restore&&w?.tracking)tracked=targets.find(t=>t.id===w.tracking&&!t.done)||null;
      updateUI(true);drawMini();
      if(notify&&s)opts.onRegion?.(id);
      if(preserve){host.classList.remove('region-arrival');void host.offsetWidth;host.classList.add('region-arrival');}
      return true;
    }
    function arrive(id,anchor='arrival',targetId=null){
      travelGoal=null;pendingTarget=null;if(!setRegion(id,{preserve:true,notify:false}))return false;
      const target=(targetId&&targets.find(t=>t.id===targetId))||targets.find(t=>t.type==='main'&&t.anchor===anchor)||targets.find(t=>t.anchor===anchor)||scene.anchors?.[anchor]||scene.spawn;
      const center=safePoint(target);let q=center;
      outer:for(const r of [78,64,92,48])for(let n=0;n<16;n++){const a=Math.PI/4+n*TAU/16,c={x:center.x+Math.cos(a)*r,y:center.y+Math.sin(a)*r};if(scene.canMove(c.x,c.y,22)&&segmentFree(c,center)){q=c;break outer;}}
      Object.assign(p,q,{z:scene.heightAt(q.x,q.y),dir:Math.PI/2,walking:false,air:0,dash:0});camera.x=p.x;camera.y=p.y;camera.z=p.z;
      path=[];destination=null;autoInteract=null;near=targets.filter(t=>dist(p,t)<interactionRadius(t)).sort((a,b)=>dist(p,a)-dist(p,b))[0]||null;syncPosition();updateUI(true);drawMini();return true;
    }
    function reset(){
      const s=state();travelGoal=null;pendingTarget=null;moved=0;
      if(s?.world){const ids=new Set(D.locations.flatMap(l=>[l.id+'-wild-1',l.id+'-wild-2']));s.world.finds=[...new Set((s.world.finds||[]).filter(id=>ids.has(id)))];}
      setRegion(s?.current||'forest',{restore:true,preserve:false,notify:false});
    }
    function snapshot(){const old=state()?.world||{},position={x:Math.round(p.x*10)/10,y:Math.round(p.y*10)/10,dir:p.dir},id=scene.id||region?.id||state()?.current;return {...old,...position,format:3,region:id,positions:{...(old.format===3?old.positions:{}),[id]:position},zoom:zoomUser,tracking:tracked?.id||null,finds:Array.isArray(old.finds)?old.finds:[],seen:Array.isArray(old.seen)?old.seen:[],distance:Math.round((old.distance||0)+moved)};}
    function syncPosition(){const s=state();if(s){s.world=snapshot();moved=0;}}
    function resize(){
      paintDirty=true;
      const b=host.getBoundingClientRect();width=Math.max(280,b.width||1200);height=Math.max(250,b.height||650);dpr=Math.min(window.devicePixelRatio||1,2);
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=width+'px';canvas.style.height=height+'px';
      camera.width=width;camera.height=height;camera.zoom=clamp(Math.min(width/1120,height/640),.68,1.15)*zoomUser;
      if(mini){mini.width=320;mini.height=240;}
      drawMini();
    }
    function setZoom(delta){zoomUser=clamp(zoomUser+delta,.65,1.5);resize();syncPosition();}
    function segmentFree(a,b){const len=dist(a,b),n=Math.max(1,Math.ceil(len/9));for(let i=1;i<=n;i++)if(!scene.canMove(lerp(a.x,b.x,i/n),lerp(a.y,b.y,i/n),21))return false;return true;}
    function cellFree(x,y){if(x<0||y<0||x>=COLS||y>=ROWS)return false;const id=y*COLS+x;if(!collisionCache.has(id))collisionCache.set(id,scene.canMove(x*GRID+GRID/2,y*GRID+GRID/2,20));return collisionCache.get(id);}
    function nearestCell(point){const bx=Math.floor(point.x/GRID),by=Math.floor(point.y/GRID);let best=null,score=Infinity;for(let r=0;r<=3;r++)for(let y=by-r;y<=by+r;y++)for(let x=bx-r;x<=bx+r;x++){if(!cellFree(x,y))continue;const q={x:x*GRID+GRID/2,y:y*GRID+GRID/2};if(!segmentFree(point,q))continue;const d=dist(point,q);if(d<score){score=d;best={x,y,id:y*COLS+x};}}return best;}
    function findPath(start,target){
      if(segmentFree(start,target))return [target];
      const a=nearestCell(start),b=nearestCell(target);if(!a||!b)return null;
      const N=COLS*ROWS,g=new Float32Array(N).fill(Infinity),parent=new Int32Array(N).fill(-1),closed=new Uint8Array(N),heap=[];
      const heuristic=(x,y)=>{const dx=Math.abs(x-b.x),dy=Math.abs(y-b.y);return Math.max(dx,dy)+.414214*Math.min(dx,dy);};
      const push=n=>{heap.push(n);let i=heap.length-1;while(i){const j=(i-1)>>1;if(heap[j].f<=n.f)break;heap[i]=heap[j];i=j;}heap[i]=n;};
      const pop=()=>{const top=heap[0],v=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=v.f)break;heap[i]=heap[c];i=c;}heap[i]=v;}return top;};
      g[a.id]=0;push({...a,f:heuristic(a.x,a.y)});let count=0;
      while(heap.length&&count++<N*2){
        const u=pop();if(closed[u.id])continue;closed[u.id]=1;if(u.id===b.id){
          const out=[target];let k=b.id;while(k!==a.id&&k>=0){out.push({x:(k%COLS)*GRID+GRID/2,y:Math.floor(k/COLS)*GRID+GRID/2});k=parent[k];}out.reverse();
          const result=[];let prev=start;for(let i=0;i<out.length;){let j=i;while(j+1<out.length&&segmentFree(prev,out[j+1]))j++;result.push(out[j]);prev=out[j];i=j+1;}return result;
        }
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
          if(!dx&&!dy)continue;const x=u.x+dx,y=u.y+dy,id=y*COLS+x;if(!cellFree(x,y)||closed[id])continue;
          if(dx&&dy&&(!cellFree(u.x+dx,u.y)||!cellFree(u.x,u.y+dy)))continue;
          const wa={x:u.x*GRID+GRID/2,y:u.y*GRID+GRID/2},wb={x:x*GRID+GRID/2,y:y*GRID+GRID/2};if(!segmentFree(wa,wb))continue;
          const score=g[u.id]+(dx&&dy?Math.SQRT2:1);if(score>=g[id])continue;g[id]=score;parent[id]=u.id;push({x,y,id,f:score+heuristic(x,y)});
        }
      }
      return null;
    }
    function navigate(point,{interact=null,label='山路'}={}){
      const q=safePoint(point),next=findPath(p,q);
      if(!next){opts.onNotice?.('这里被山石或溪水挡住了，试着沿铺好的山路走。');return false;}
      path=next;destination={...q,label,stopRadius:interact?(point.type==='tower'?interactionRadius(point)-30:point.life?10:63):point.type==='main'?57:9};autoInteract=interact;blockedTime=0;keys.clear();return true;
    }
    function regionRoute(from,to){
      const queue=[[from]],seen=new Set([from]);while(queue.length){const route=queue.shift(),last=route[route.length-1];if(last===to)return route;for(const id of D.locations.find(l=>l.id===last)?.connections||[]){if(!seen.has(id)){seen.add(id);queue.push([...route,id]);}}}return null;
    }
    function continueJourney(){
      if(!travelGoal)return false;
      const current=scene.id||region?.id;
      if(current===travelGoal){const id=pendingTarget||travelGoal;travelGoal=null;pendingTarget=null;const t=targets.find(t=>t.id===id)||targets.find(t=>t.type==='main');if(!t)return false;tracked=t;return navigate(t,{interact:t.id,label:t.label});}
      const route=regionRoute(current,travelGoal),exit=route&&targets.find(t=>t.type==='exit'&&t.to===route[1]);
      if(!exit){opts.onNotice?.('此处没有直达的山路，请在江湖舆图查看相邻区域。');travelGoal=null;pendingTarget=null;return false;}
      tracked=exit;return navigate(exit,{interact:exit.id,label:'前往'+D.locations.find(l=>l.id===travelGoal).name+' · 经'+D.locations.find(l=>l.id===exit.to).name});
    }
    function navigateLocation(id){if(!D.locations.some(l=>l.id===id))return false;travelGoal=id;pendingTarget=null;return continueJourney();}
    function navigateTarget(id){
      const here=targets.find(t=>t.id===id);if(here){travelGoal=null;pendingTarget=null;tracked=here;if(dist(p,here)<interactionRadius(here))return interact(here);return navigate(here,{interact:id,label:here.label});}
      const custom=(window.CANON_DATA?.encounters||[]).find(t=>t.id===id)||window.CANON_DATA?.heroes?.[state()?.hero]?.chapters.find(t=>t.id===id);
      const task=(window.REGION_DATA?.tasks||[]).find(t=>'task-'+t.id===id),side=D.sideEvents.find(e=>e.id===id),loc=D.locations.find(l=>l.id===id);
      const area=custom?.region||task?.region||side?.location||loc?.id;if(!area)return false;pendingTarget=id;travelGoal=area;return continueJourney();
    }
    function teleport(id){travelGoal=null;pendingTarget=null;return setRegion(id,{preserve:true,notify:false});}
    let targets=[];
    function companions(){const selected=opts.getCompanions?.()||(state()?.recruited||[]).filter(id=>id!==state()?.hero).slice(0,1).map(id=>({id}));return selected.filter(c=>c&&c.id!==state()?.hero&&D.heroes.some(h=>h.id===c.id)).slice(0,2);}
    function prepareLifeTarget(t){
      let q=lifePositions.get(t.id);
      if(!q){
        const a=scene.anchors?.[t.anchor]||scene.spawn;
        const offsets=[[0,0],[110,10],[-110,35],[45,110],[-65,-105],[140,-75],[-145,100]];
        q=offsets.map(([x,y])=>({x:a.x+x,y:a.y+y})).find(v=>scene.canMove(v.x,v.y,t.type==='rest'?55:25)&&!targets.some(u=>u.type!=='discovery'&&dist(u,v)<92));
        q=q||safePoint(a,t.type==='rest'?50:22);lifePositions.set(t.id,q);
      }
      return {...t,...q,life:true,location:scene.id,unlocked:true,color:t.color||(t.type==='rest'?'#ebd29b':t.type==='patrol'?'#d79a73':'#c9be91')};
    }
    function updateLifeCollisions(){
      const rests=targets.filter(t=>t.life&&t.type==='rest'),key=rests.map(t=>t.id+':'+t.x+':'+t.y).join('|');
      if(key===lifeCollisionKey)return;lifeCollisionKey=key;
      const all=scene.colliders;if(!all)return;
      for(let i=all.length-1;i>=0;i--)if(all[i].lifeId)all.splice(i,1);
      for(const t of rests)all.push({kind:'ellipse',x:t.x,y:t.y,rx:52,ry:52,lifeId:t.id});
      collisionCache.clear();
      if(!scene.canMove(p.x,p.y,18)){const q=safePoint(p,18);Object.assign(p,q,{z:scene.heightAt(q.x,q.y)});}
    }
    function gatherAt(id,options={}){
      const t=targets.find(v=>v.id===id&&v.life&&v.type==='rest');if(!t||dist(p,t)>220)return false;
      const seats=[[78,31],[-24,84],[-83,-26]].map(([x,y])=>safePoint({x:t.x+x,y:t.y+y},24));
      if(!navigate(seats[0],{label:'围桌叙话'}))return false;
      socialGather={id,seats,elapsed:0,approach:0,duration:clamp(Number(options.duration)||6,3,12),activity:['tea','meal','wine'].includes(options.activity)?options.activity:'tea'};
      updateUI(true);return true;
    }
    function updateCompanions(dt){
      const list=companions(),ids=new Set(list.map(c=>c.id));for(const id of followers.keys())if(!ids.has(id))followers.delete(id);
      list.forEach((c,index)=>{
        let f=followers.get(c.id);const offset=index?{x:18,y:-77}:{x:-67,y:14};
        if(!f){const q=safePoint({x:p.x+offset.x,y:p.y+offset.y},18);f={...q,z:scene.heightAt(q.x,q.y),dir:Math.PI/2,phase:index*.35,walking:false,route:[],planClock:0};followers.set(c.id,f);}
        f.swordState=c.swordState;f.name=c.name||D.heroes.find(h=>h.id===c.id)?.name||'';
        const trailPoint=trail[Math.max(0,trail.length-1-6*(index+1))],wanted=socialGather?.seats[index+1]||(p.walking&&trailPoint?{x:trailPoint.x+(index?13:-13),y:trailPoint.y+(index?-13:13)}:{x:p.x+offset.x,y:p.y+offset.y});
        let goal=wanted;f.planClock=Math.max(0,f.planClock-dt);
        if(!segmentFree(f,goal)){
          if(f.planClock===0){f.route=findPath(f,safePoint(goal,18))||[];f.planClock=.75;}
          while(f.route.length&&dist(f,f.route[0])<10)f.route.shift();goal=f.route[0]||f;
        }else f.route=[];
        const distance=dist(f,goal),speed=clamp(185+dist(f,p)*.7,185,370),amount=Math.min(distance,dt*speed);f.walking=distance>9;
        if(f.walking&&amount>0){const dx=(goal.x-f.x)/distance*amount,dy=(goal.y-f.y)/distance*amount;
          if(scene.canMove(f.x+dx,f.y+dy,16)){f.x+=dx;f.y+=dy;}else{if(scene.canMove(f.x+dx,f.y,16))f.x+=dx;if(scene.canMove(f.x,f.y+dy,16))f.y+=dy;}
          const dir=J.project(dx,dy);f.dir=Math.atan2(dir.y,dir.x);
        }else f.dir=Math.PI/2;
        f.z=scene.heightAt(f.x,f.y);f.phase=(f.phase+dt*(f.walking?1.9:.32))%1;f.gathering=!!socialGather&&dist(f,wanted)<30;
      });
    }
    function challengeNearby(){
      if(!active())return;p.swing=.5;
      const t=targets.filter(t=>t.life&&t.type==='patrol'&&!t.disabled&&!t.cooldownLeft&&dist(p,t)<145).sort((a,b)=>dist(p,a)-dist(p,b))[0];
      if(t){path=[];destination=null;autoInteract=null;syncPosition();opts.onLifeInteract?.(t.id,{challenge:true});}
    }
    function updateTargets(){
      const s=state();targets=[];scene.setDiscoveries?.(s?.world?.finds||[]);scene.setEvents?.((window.REGION_DATA?.tasks||[]).filter(t=>(s?.regional?.[t.id]?.step||0)>=t.steps.length).map(t=>t.id));
      const story=opts.getStoryTargets?.(scene.id||region?.id);
      if(story){
        const groups={};for(const t of story)(groups[t.anchor]||=[]).push(t);
        for(const t of story){const anchor=scene.anchors?.[t.anchor]||scene.spawn,g=groups[t.anchor],i=g.indexOf(t),dx=g.length>1?(i-(g.length-1)/2)*64:0,q=safePoint({x:anchor.x+dx,y:anchor.y-dx});targets.push({...t,...q,location:scene.id,unlocked:true,color:t.color||'#edd197'});}
      }else for(const l of scene.locations){
        const npc=l.npc||l.safe||l,done=!!s?.completed.includes(l.id),unlocked=opts.canEnter?.(l.id)??true;
        const isSelf=l.hero===s?.hero,name=isSelf?(l.selfSpeaker||'山间信使'):(l.speaker||'山间来客');
        targets.push({id:l.id,type:'main',location:l.id,x:npc.x,y:npc.y,name,label:opts.getQuestTitle?.(l.id)||l.name,hero:l.hero&&!isSelf?l.hero:null,done,unlocked,color:done?'#a4cbbc':unlocked?'#f5cf76':'#c3cbd0'});
        D.sideEvents.filter(e=>e.location===l.id).forEach((e,i)=>{
          const q=safePoint(scene.anchors?.[i?'side2':'side1']||{x:l.x+(i?82:-85),y:l.y+(i?55:30)});
          targets.push({id:e.id,type:'side',location:l.id,...q,name:e.speaker||'山间来客',label:e.title,done:!!s?.sides.includes(e.id),unlocked:true,color:'#bbd5bf',variant:i});
        });
      }
      for(const d of scene.discoveries||[])targets.push({...d,type:'discovery',kind:d.type,label:d.name,name:d.name,done:found(d.id),hasArt:scene.props.some(prop=>prop.discoveryId===d.id),unlocked:true,color:d.type==='herb'?'#bfd6a0':'#e6ce86'});
      const tasks=opts.getTasks?.(scene.id||region?.id)||[];
      const groups={};tasks.forEach(t=>{(groups[t.anchor]||=[]).push(t);});
      for(const t of tasks){const anchor=scene.anchors?.[t.anchor];if(!anchor)continue;const group=groups[t.anchor],index=group.indexOf(t),occupied=targets.some(v=>v.type!=='task'&&dist(v,anchor)<55);let dx=0,dy=0;if(occupied){const slot=[[60,-60],[-60,60],[42,54]][index%3];dx=slot[0];dy=slot[1];}else if(group.length>1){dx=group.length===2?(index?46:-46):(index-1)*62;dy=-dx;}const q=safePoint({x:anchor.x+dx,y:anchor.y+dy});targets.push({...t,...q,type:'task',location:scene.id,unlocked:true,color:'#dac0eb',anchorName:anchor.name});}
      for(const t of opts.getLifeTargets?.(scene.id||region?.id)||[])targets.push(prepareLifeTarget(t));
      updateLifeCollisions();
      if(scene.tower){const status=opts.getTowerStatus?.()||{};targets.push({...scene.tower,id:'endless-tower',anchor:'tower',type:'tower',location:scene.id,name:'锁妖塔',label:status.label||(status.unlocked?'进入无尽试炼塔':'完成当前剑主八幕主线后开启'),unlocked:!!status.unlocked,done:false,color:'#d4d6af'});}
      for(const a of scene.landmarks||[]){if(a.id==='tower'||tasks.some(t=>t.anchor===a.id)||targets.some(t=>t.life&&t.anchor===a.id))continue;targets.push({...a,id:'landmark-'+scene.id+'-'+a.id,anchor:a.id,type:'landmark',location:scene.id,label:a.description||'驻足观景，听听此间旧事',name:a.name,color:'#cbd7be',unlocked:true,done:!!s?.world?.seen?.includes(scene.id+':'+a.id)});}
      for(const e of scene.exits||[]){targets.push({...e,type:'exit',location:scene.id,name:'前往'+D.locations.find(l=>l.id===e.to)?.name,label:e.label||'循山路进入相邻区域',color:'#f4dfb0',unlocked:true,done:false});}
      if(tracked){const next=targets.find(t=>t.id===tracked.id);tracked=next&&!next.done?next:null;}if(near)near=targets.find(t=>t.id===near.id)||null;
    }
    function interact(target=near){
      if(!active()||!target)return false;
      if(dist(p,target)>interactionRadius(target)){navigate(target,{interact:target.id,label:target.label});return false;}
      path=[];destination=null;autoInteract=null;syncPosition();
      if(target.type==='exit'){const goal=travelGoal,focus=pendingTarget;setRegion(target.to,{from:scene.id||region?.id});travelGoal=goal;pendingTarget=focus;if(goal)continueJourney();return true;}
      if(target.type==='tower'){opts.onTower?.();}
      else if(target.life){opts.onLifeInteract?.(target.id);}
      else if(target.type==='task'){opts.onTask?.(target.taskId);}
      else if(target.type==='landmark'){opts.onLandmark?.(target);}
      else if(target.type==='discovery'){if(target.done){opts.onNotice?.('这一处山间见闻已经记入江湖志。');return false;}opts.onDiscover?.(target);}
      else if(target.type==='main'){opts.onMain?.(target.id,target.done);}
      else opts.onSide?.(target.id,target.done);
      updateTargets();updateUI(true);return true;
    }
    function trackNext(){
      if(opts.onTrackNext){opts.onTrackNext();return;}
      const s=state();if(!s)return;
      let q=tracked&&!tracked.done?targets.find(t=>t.id===tracked.id):null;
      if(!q)q=targets.find(t=>t.type==='main'&&!t.done&&t.unlocked);
      if(!q)q=targets.filter(t=>t.type==='task'&&!t.done).sort((a,b)=>(b.stage||0)-(a.stage||0)||dist(p,a)-dist(p,b))[0];
      if(!q)q=targets.filter(t=>['side','discovery'].includes(t.type)&&!t.done).sort((a,b)=>dist(p,a)-dist(p,b))[0];
      if(!q){const next=s.recruited.length===7&&!s.ending?D.locations.find(l=>l.id==='tianzi'):D.locations.find(l=>!s.completed.includes(l.id)&&(opts.canEnter?.(l.id)??true));if(next){navigateLocation(next.id);return;}opts.onNotice?.('此地故事已收录，打开江湖舆图继续远行。');return;}
      travelGoal=null;pendingTarget=null;tracked=q;navigate(q,{interact:q.id,label:q.label});opts.onNotice?.('循迹：'+q.label+'。方向键可随时接手。');updateUI(true);
    }
    function jump(){if(!active()||p.cooldown>0)return;p.dash=.72;p.cooldown=1.45;p.air=0;if(!p.walking&&!path.length){const q=J.unproject(Math.cos(p.dir),Math.sin(p.dir));const len=Math.hypot(q.x,q.y);p.jumpDir={x:q.x/len,y:q.y/len};}else p.jumpDir=null;}
    function step(dt){
      time+=dt;
      const isActive=active();if(!isActive){if(wasActive){keys.clear();stick.x=stick.y=0;syncPosition();}wasActive=false;p.walking=false;return;}wasActive=true;
      const s=state();let sx=stick.x,sy=stick.y;
      if(keys.has('KeyA')||keys.has('ArrowLeft'))sx--;if(keys.has('KeyD')||keys.has('ArrowRight'))sx++;
      if(keys.has('KeyW')||keys.has('ArrowUp'))sy--;if(keys.has('KeyS')||keys.has('ArrowDown'))sy++;
      let vx=0,vy=0;const manual=Math.hypot(sx,sy)>.1;
      if(manual){socialGather=null;p.gathering=false;path=[];destination=null;autoInteract=null;travelGoal=null;pendingTarget=null;const q=J.unproject(sx,sy);const len=Math.hypot(q.x,q.y);vx=q.x/len;vy=q.y/len;}
      else if(path.length){let q=path[0],d=dist(p,q);while(path.length&&d<(path.length===1?(destination?.stopRadius||9):5)){path.shift();q=path[0];d=q?dist(p,q):0;}if(q){vx=(q.x-p.x)/d;vy=(q.y-p.y)/d;}else{destination=null;if(autoInteract){const target=targets.find(t=>t.id===autoInteract);autoInteract=null;if(target)interact(target);}}}
      p.cooldown=Math.max(0,p.cooldown-dt);p.swing=Math.max(0,p.swing-dt);p.dash=Math.max(0,p.dash-dt);
      if(p.dash>0&&!vx&&!vy&&p.jumpDir){vx=p.jumpDir.x;vy=p.jumpDir.y;}
      const speed=p.dash>0?510:keys.has('ShiftLeft')||keys.has('ShiftRight')?318:236;
      p.air=p.dash>0?Math.sin((1-p.dash/.72)*Math.PI):0;
      const stride=!manual&&path.length?Math.min(speed*dt,dist(p,path[0])):speed*dt;
      let dx=vx*stride,dy=vy*stride,moving=false;const subdivisions=Math.max(1,Math.ceil(Math.hypot(dx,dy)/9));
      for(let i=0;i<subdivisions;i++){const ax=dx/subdivisions,ay=dy/subdivisions,ox=p.x,oy=p.y;if(scene.canMove(p.x+ax,p.y+ay,18)){p.x+=ax;p.y+=ay;}else{if(scene.canMove(p.x+ax,p.y,18))p.x+=ax;if(scene.canMove(p.x,p.y+ay,18))p.y+=ay;}const d=Math.hypot(p.x-ox,p.y-oy);moved+=d;moving ||=d>.01;}
      p.walking=moving;
      if(path.length&&!manual&&!moving){blockedTime+=dt;if(blockedTime>.3&&destination){blockedTime=0;const next=findPath(p,destination);if(next)path=next;else{path=[];destination=null;autoInteract=null;opts.onNotice?.('前方地势不便通行，试着沿桥面或石径绕行。');}}}else blockedTime=0;
      if(vx||vy){const projected=J.project(vx,vy);p.dir=Math.atan2(projected.y,projected.x);}
      p.phase=(p.phase+dt*(moving?(p.dash?2.5:2.0):.45))%1;p.z=scene.heightAt(p.x,p.y);
      if(socialGather){
        socialGather.approach+=dt;p.gathering=dist(p,socialGather.seats[0])<25;
        if(p.gathering){socialGather.elapsed+=dt;p.dir=Math.PI/2;}
        if(socialGather.elapsed>=socialGather.duration||socialGather.approach>socialGather.duration+12){socialGather=null;p.gathering=false;}
      }else p.gathering=false;
      updateCompanions(dt);
      camera.x=lerp(camera.x,p.x,1-Math.exp(-dt*6));camera.y=lerp(camera.y,p.y,1-Math.exp(-dt*6));camera.z=lerp(camera.z,p.z,1-Math.exp(-dt*5));
      trailClock+=dt;if(trailClock>.10){trailClock=0;trail.push({x:p.x,y:p.y,z:p.z,dir:p.dir,walking:moving,phase:p.phase});if(trail.length>17)trail.shift();if(moving&&p.air<.1){footsteps.push({x:p.x,y:p.y,z:p.z,t:time,dir:p.dir});if(footsteps.length>12)footsteps.shift();}}
      const priority=t=>dist(p,t)+(t.done?30:0)+(t.type==='landmark'?45:0);
      near=targets.filter(t=>dist(p,t)<interactionRadius(t,105)).sort((a,b)=>priority(a)-priority(b))[0]||null;
      if(s.world){const seen=s.world.seen||(s.world.seen=[]);for(const a of scene.landmarks||[]){const id=scene.id+':'+a.id;if(dist(p,a)<155&&!seen.includes(id))seen.push(id);}}

      saveClock+=dt;uiClock+=dt;lifeRefresh+=dt;if(lifeRefresh>=1){lifeRefresh=0;if(opts.getLifeTargets)updateTargets();}
      if(saveClock>=7){saveClock=0;syncPosition();opts.onSave?.();}
      if(uiClock>=.2){uiClock=0;updateUI();drawMini();}
    }
    function shadow(x,y,z,r=22,alpha=.19){const q=at(x,y,z);ctx.save();ctx.translate(q.x,q.y);ctx.scale(camera.zoom,camera.zoom);ctx.fillStyle=`rgba(22,47,39,${alpha})`;ctx.beginPath();ctx.ellipse(0,1,r,r*.40,0,0,TAU);ctx.fill();ctx.restore();}
    function drawVillager(t,q){
      const z=camera.zoom,robe=t.variant?'#8d7595':'#879d87',species=Array.from(t.name).reduce((v,c)=>v+c.charCodeAt(0),0)%3,fur=['#d5b183','#cbd7d0','#c7a897'][species];ctx.save();ctx.translate(q.x,q.y);ctx.scale(z,z);ctx.lineJoin='round';ctx.lineWidth=1.3;ctx.strokeStyle='#405b50';
      ctx.strokeStyle=fur;ctx.lineWidth=species===1?9:7;ctx.beginPath();ctx.moveTo(-13,-14);ctx.quadraticCurveTo(-35,-9,-30,-27);ctx.stroke();ctx.lineWidth=1.3;ctx.strokeStyle='#405b50';
      ctx.fillStyle='#433d35';ctx.beginPath();ctx.ellipse(-10,-3,7,4,0,0,TAU);ctx.ellipse(9,-3,7,4,0,0,TAU);ctx.fill();
      ctx.fillStyle=robe;ctx.beginPath();ctx.moveTo(-12,-51);ctx.quadraticCurveTo(-28,-31,-18,-19);ctx.lineTo(-18,-4);ctx.quadraticCurveTo(0,0,19,-6);ctx.lineTo(14,-45);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle='#d9d6bb';ctx.beginPath();ctx.moveTo(-4,-54);ctx.lineTo(10,-47);ctx.lineTo(-4,-27);ctx.lineTo(-10,-44);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#526251';ctx.beginPath();ctx.moveTo(-18,-22);ctx.lineTo(15,-24);ctx.moveTo(1,-20);ctx.lineTo(6,-7);ctx.stroke();
      ctx.fillStyle=fur;ctx.strokeStyle='#746853';ctx.beginPath();if(species===0){ctx.moveTo(-12,-65);ctx.lineTo(-17,-82);ctx.lineTo(-2,-73);ctx.moveTo(5,-73);ctx.lineTo(16,-82);ctx.lineTo(13,-63);}else{ctx.ellipse(-13,-70,species===1?4:7,species===1?18:12,species===1?-.24:-.6,0,TAU);ctx.ellipse(13,-70,species===1?4:7,species===1?18:12,species===1?.24:.6,0,TAU);}ctx.fill();ctx.stroke();
      ctx.fillStyle=fur;ctx.beginPath();ctx.ellipse(0,-61,13,15,-.08,0,TAU);ctx.fill();ctx.strokeStyle='#655348';ctx.stroke();
      ctx.fillStyle='#ede6cf';ctx.beginPath();ctx.ellipse(0,-55,8,5,0,0,TAU);ctx.fill();ctx.fillStyle='#544d41';ctx.beginPath();ctx.moveTo(-2,-59);ctx.lineTo(2,-59);ctx.lineTo(0,-56);ctx.closePath();ctx.fill();
      ctx.fillStyle='#443d35';ctx.beginPath();ctx.ellipse(0,-69,14,7,0,Math.PI,TAU);ctx.fill();ctx.beginPath();ctx.arc(4,-80,5,0,TAU);ctx.fill();
      ctx.strokeStyle='#6c5441';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-8,-61);ctx.lineTo(-4,-62);ctx.moveTo(4,-62);ctx.lineTo(8,-61);ctx.stroke();ctx.fillStyle='#f2e1be';ctx.beginPath();ctx.ellipse(17,-31,4,5,0,0,TAU);ctx.fill();ctx.restore();
    }
    function drawDiscovery(t,q){
      const z=camera.zoom;ctx.save();ctx.translate(q.x,q.y);ctx.scale(z,z);const glow=t.done?0:.35+.15*Math.sin(time*2+t.x);
      if(glow){const g=ctx.createRadialGradient(0,-9,0,0,-9,43);g.addColorStop(0,`rgba(224,215,143,${glow})`);g.addColorStop(1,'rgba(224,215,143,0)');ctx.fillStyle=g;ctx.fillRect(-44,-54,88,88);}
      if(t.hasArt){if(!t.done){ctx.fillStyle='#f0de9c';ctx.globalAlpha=.65+.25*Math.sin(time*3);ctx.beginPath();ctx.arc(0,-38-Math.sin(time*2)*4,2,0,TAU);ctx.fill();}ctx.restore();return;}
      ctx.lineJoin='round';ctx.lineWidth=1.5;
      if(t.kind==='herb'){
        for(let k=0;k<7;k++){ctx.save();ctx.rotate((k-3)*.23);ctx.strokeStyle='#47765b';ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(4,-15,(k-3)*3,-30);ctx.stroke();ctx.fillStyle=k%2?'#8bb877':'#659168';ctx.beginPath();ctx.ellipse(2,-16,5,12,.4,0,TAU);ctx.fill();ctx.restore();}ctx.fillStyle='#d2c187';ctx.beginPath();ctx.arc(0,-31,3,0,TAU);ctx.fill();
      }else if(t.kind==='cache'){
        ctx.fillStyle='#685740';ctx.strokeStyle='#3e493b';ctx.beginPath();ctx.moveTo(-20,-5);ctx.lineTo(1,5);ctx.lineTo(23,-7);ctx.lineTo(23,-24);ctx.lineTo(1,-15);ctx.lineTo(-20,-25);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=t.done?'#9b8356':'#be9e65';ctx.beginPath();ctx.moveTo(-20,-25);ctx.lineTo(2,-35);ctx.lineTo(23,-24);ctx.lineTo(1,-15);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='#ddc785';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-10,-28);ctx.lineTo(11,-19);ctx.lineTo(11,-1);ctx.moveTo(6,-32);ctx.lineTo(16,-28);ctx.stroke();
      }else{
        ctx.fillStyle='#8f9f91';ctx.strokeStyle='#5d766b';ctx.beginPath();ctx.moveTo(-24,0);ctx.lineTo(0,9);ctx.lineTo(27,-2);ctx.lineTo(5,-12);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#c0c6b3';ctx.beginPath();ctx.moveTo(-11,-3);ctx.lineTo(-11,-39);ctx.quadraticCurveTo(1,-48,12,-38);ctx.lineTo(12,-2);ctx.lineTo(0,3);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='#82917a';ctx.beginPath();ctx.moveTo(-3,-30);ctx.lineTo(5,-27);ctx.moveTo(-3,-20);ctx.lineTo(4,-17);ctx.stroke();
      }
      ctx.restore();
    }
    function drawTarget(t){
      const z=scene.heightAt(t.x,t.y),q=at(t.x,t.y,z);if(q.x<-160||q.x>width+160||q.y<-60||q.y>height+180)return;
      if(t.type==='landmark'){if(dist(p,t)<470){ctx.save();ctx.font=`${clamp(13*camera.zoom,11,15)}px "Noto Serif SC","Microsoft YaHei",serif`;ctx.textAlign='center';ctx.fillStyle='#edf0d0';ctx.shadowColor='#203b2c';ctx.shadowBlur=4;ctx.fillText(t.name,q.x,q.y-24*camera.zoom);ctx.restore();}return;}
      if(!t.life)shadow(t.x,t.y,z,t.type==='discovery'?20:22,.15);
      if(t.type==='tower'){/* The tower building is in the shared depth list; no human NPC. */}
      else if(t.life){/* Props and patrol actors join the shared depth list below. */}
      else if(t.type==='exit'){ctx.save();ctx.translate(q.x,q.y);ctx.scale(camera.zoom,camera.zoom);ctx.strokeStyle='#66583e';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-60);ctx.stroke();ctx.fillStyle='#d9c79b';ctx.strokeStyle='#7d704e';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-31,-66);ctx.lineTo(23,-66);ctx.lineTo(36,-54);ctx.lineTo(23,-42);ctx.lineTo(-31,-42);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#586650';ctx.font='bold 18px serif';ctx.textAlign='center';ctx.fillText('➜',0,-47);ctx.restore();}
      else if(t.type==='task'&&!['talk','deliver','battle'].includes(t.action)){drawDiscovery({...t,kind:t.action==='gather'?'herb':t.action==='craft'?'cache':'shrine',hasArt:false},q);}
      else if(t.type==='discovery')drawDiscovery(t,q);else if(t.hero)A.drawHero(ctx,t.hero,q.x,q.y,98*camera.zoom,Math.PI/2+.25, time,{state:'idle',phase:(time*.3)%1});else drawVillager(t,q);
      const d=dist(p,t),isNear=near?.id===t.id,tracking=tracked?.id===t.id;
      if(d<610||tracking){
        const object=t.type==='tower'||t.type==='discovery'||t.type==='exit'||t.type==='task'&&!['talk','deliver','battle'].includes(t.action);const yy=q.y-(t.type==='rest'?167:object?76:112)*camera.zoom,bounce=t.done?0:Math.sin(time*2.4+t.x)*3;
        ctx.save();ctx.translate(q.x,yy+bounce);ctx.font=`${isNear?'600 ':''}${clamp(12*camera.zoom,10,14)}px "PingFang SC","Microsoft YaHei",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.shadowColor='#17392e';ctx.shadowBlur=3;ctx.shadowOffsetY=1;ctx.fillStyle=t.done?'#e2e7d9':t.color;
        if(t.type!=='discovery'){ctx.fillText(t.name,0,0);if(!t.done){ctx.font='bold 19px serif';ctx.fillText(t.type==='rest'?(t.venue==='wine'?'酒':t.venue==='inn'?'客':'茶'):t.type==='patrol'?(t.cooldownLeft?'·':'⚔'):t.type==='commission'?'!':t.type==='main'?(t.unlocked?'◆':'◇'):t.type==='task'?'!':t.type==='exit'?'↗':t.type==='tower'?'塔':'◇',0,-24);}}
        else if(isNear||tracking)ctx.fillText(t.name,0,0);
        if(isNear){ctx.shadowBlur=0;ctx.fillStyle='#f4e7b8';ctx.beginPath();ctx.moveTo(0,18);ctx.lineTo(-4,13);ctx.lineTo(4,13);ctx.closePath();ctx.fill();}
        ctx.restore();
      }
    }
    function drawRoute(){
      if(path.length){const points=[p,...path];ctx.save();ctx.strokeStyle='#f4e7b29e';ctx.lineWidth=2;ctx.setLineDash([3,10]);ctx.beginPath();for(let i=0;i<points.length;i++){const q=at(points[i].x,points[i].y);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);}ctx.stroke();ctx.restore();}
      if(destination){const q=at(destination.x,destination.y);ctx.save();ctx.translate(q.x,q.y);ctx.scale(camera.zoom,camera.zoom);ctx.strokeStyle='#eddba1';ctx.lineWidth=1.8;ctx.beginPath();ctx.ellipse(0,0,16+Math.sin(time*3)*3,8,0,0,TAU);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(-4,-21);ctx.lineTo(4,-21);ctx.closePath();ctx.fillStyle='#f9e8b1';ctx.fill();ctx.restore();}
      for(const f of footsteps){const age=time-f.t;if(age>1.4)continue;const q=at(f.x,f.y,f.z);ctx.fillStyle=`rgba(240,231,203,${(1-age/1.4)*.13})`;ctx.beginPath();ctx.ellipse(q.x,q.y,(5+age*11)*camera.zoom,(2+age*4)*camera.zoom,0,0,TAU);ctx.fill();}
    }
    function drawActor(actor,id,size,isPlayer){
      const q=at(actor.x,actor.y,actor.z),air=isPlayer?p.air:0;shadow(actor.x,actor.y,actor.z,size*.23*(1-air*.25),.19*(1-air*.3));
      if(isPlayer){ctx.save();ctx.strokeStyle=hero().color+'99';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(q.x,q.y+1,24*camera.zoom,10*camera.zoom,0,0,TAU);ctx.stroke();ctx.restore();}
      const action=isPlayer&&p.dash?'dash':isPlayer&&p.swing?'attack':actor.walking?'walk':actor.gathering?'social':'idle';
      A.drawHero(ctx,id,q.x,q.y-air*66*camera.zoom,size*camera.zoom,actor.dir,time,{state:action,phase:action==='attack'?1-p.swing/.5:actor.phase,air,swordState:isPlayer?opts.getEquipment?.():actor.swordState});
      if(!isPlayer){ctx.save();ctx.textAlign='center';ctx.fillStyle='#e9edcc';ctx.strokeStyle='#284735';ctx.font=`${clamp(11*camera.zoom,10,13)}px "Microsoft YaHei",sans-serif`;ctx.lineWidth=3;ctx.strokeText(actor.name||D.heroes.find(h=>h.id===id)?.name||'',q.x,q.y-(size+10)*camera.zoom);ctx.fillText(actor.name||D.heroes.find(h=>h.id===id)?.name||'',q.x,q.y-(size+10)*camera.zoom);ctx.restore();}
      if(isPlayer&&p.swing>0){ctx.save();ctx.translate(q.x,q.y-44*camera.zoom);ctx.rotate(p.dir);ctx.scale(camera.zoom,camera.zoom);ctx.strokeStyle=hero().color;ctx.globalAlpha=p.swing*1.6;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(16,0,55,32,0,-1.25,1.25);ctx.stroke();ctx.restore();}
    }
    function atmosphere(){
      const biome=region?.biome||'forest',snow=biome==='summit',pink=biome==='palace',count=width<700?18:32;
      ctx.save();for(let i=0;i<count;i++){const sx=((i*193.1+time*(snow?11:17)+Math.sin(time*.2+i)*17)%(width+40))-20,sy=((i*139.7+time*(snow?14:8))%(height+60))-30;ctx.globalAlpha=.12+(i%4)*.035;ctx.fillStyle=snow?'#fcfff4':pink?'#f3c0cc':'#e3d5a1';ctx.beginPath();ctx.ellipse(sx,sy,snow?1.5:3,snow?1.5:1.2,time*.3+i,0,TAU);ctx.fill();}
      ctx.globalAlpha=1;const fog=ctx.createLinearGradient(0,height*.7,0,height);fog.addColorStop(0,'rgba(226,239,221,0)');fog.addColorStop(1,'rgba(222,235,222,.13)');ctx.fillStyle=fog;ctx.fillRect(0,height*.7,width,height*.3);
      const v=ctx.createRadialGradient(width*.52,height*.48,Math.min(width,height)*.28,width*.52,height*.48,Math.max(width,height)*.73);v.addColorStop(0,'rgba(21,45,39,0)');v.addColorStop(1,'rgba(17,40,32,.22)');ctx.fillStyle=v;ctx.fillRect(0,0,width,height);ctx.restore();
    }
    function render(){
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=1;ctx.clearRect(0,0,width,height);
      scene.drawGround(ctx,camera,time*1000);drawRoute();
      const objects=scene.getDrawables(camera,time*1000,p).slice();
      if(window.WorldLifeArt)objects.push(...window.WorldLifeArt.getDrawables({scene,camera,time,drawVillager},targets.filter(t=>{const q=at(t.x,t.y);return q.x>-420&&q.x<width+420&&q.y>-160&&q.y<height+410;})));
      for(const t of targets){const q=at(t.x,t.y);if(q.x>-180&&q.x<width+180&&q.y>-80&&q.y<height+210)objects.push({depth:t.x+t.y+.4,draw:()=>drawTarget(t)});}
      for(const [id,follower] of followers)objects.push({depth:follower.x+follower.y+.6,draw:()=>drawActor(follower,id,101,false)});
      objects.push({depth:p.x+p.y+1,draw:()=>drawActor(p,hero().id,106,true)});
      objects.sort((a,b)=>a.depth-b.depth);for(const o of objects){ctx.save();o.draw(ctx);ctx.restore();}
      atmosphere();
    }
    function drawMini(){
      if(!mc||!mini)return;const w=mini.width,h=mini.height,pad=24,proj=J.project,all=[proj(0,0),proj(scene.width,0),proj(0,scene.height),proj(scene.width,scene.height)];
      const minx=Math.min(...all.map(v=>v.x)),maxx=Math.max(...all.map(v=>v.x)),miny=Math.min(...all.map(v=>v.y)),maxy=Math.max(...all.map(v=>v.y));
      const scale=Math.min((w-pad*2)/(maxx-minx),(h-pad*2)/(maxy-miny)),mp=(x,y)=>{const q=proj(x,y);return{x:w/2+(q.x-(minx+maxx)/2)*scale,y:h/2+(q.y-(miny+maxy)/2)*scale};};
      mc.clearRect(0,0,w,h);mc.fillStyle='#263f37';mc.fillRect(0,0,w,h);mc.fillStyle='#3b5748';mc.beginPath();[[0,0],[scene.width,0],[scene.width,scene.height],[0,scene.height]].forEach(([x,y],i)=>{const q=mp(x,y);i?mc.lineTo(q.x,q.y):mc.moveTo(q.x,q.y);});mc.closePath();mc.fill();
      for(const river of scene.rivers||[]){mc.beginPath();(river.points||[]).forEach((v,i)=>{const q=mp(v.x,v.y);i?mc.lineTo(q.x,q.y):mc.moveTo(q.x,q.y);});mc.lineWidth=Math.max(2,(river.width||80)*scale);mc.strokeStyle='#74a6a099';mc.stroke();}
      for(const prop of scene.props||[]){if(prop.type!=='building')continue;const q=mp(prop.x,prop.y);mc.fillStyle='#bdbda09a';mc.fillRect(q.x-3,q.y-2,6,4);}
      for(const road of scene.paths||[]){mc.beginPath();(road.points||[]).forEach((v,i)=>{const q=mp(v.x,v.y);i?mc.lineTo(q.x,q.y):mc.moveTo(q.x,q.y);});mc.strokeStyle=road.exploration?'#9aac7650':'#d0c79770';mc.lineWidth=road.exploration?1:1.6;mc.stroke();}
      for(const t of targets){if(t.type==='landmark'||t.done)continue;const q=mp(t.x,t.y);mc.fillStyle=t.color;mc.beginPath();mc.arc(q.x,q.y,t.type==='main'?3.8:t.type==='exit'?3:2.1,0,TAU);mc.fill();}
      const s=state();for(const l of []){const q=mp(l.x,l.y);mc.beginPath();mc.arc(q.x,q.y,l.id===region?.id?5:3.3,0,TAU);mc.fillStyle=s?.completed.includes(l.id)?'#9dbbaa':s?.visited.includes(l.id)?'#e1c682':'#778b77';mc.fill();}
      if(tracked){const q=mp(tracked.x,tracked.y);mc.strokeStyle='#f2d384';mc.lineWidth=1.5;mc.beginPath();mc.arc(q.x,q.y,7+Math.sin(time*2),0,TAU);mc.stroke();}
      const q=mp(p.x,p.y);mc.save();mc.translate(q.x,q.y);mc.rotate(p.dir);mc.fillStyle='#fff4c5';mc.beginPath();mc.moveTo(7,0);mc.lineTo(-5,-4);mc.lineTo(-3,0);mc.lineTo(-5,4);mc.closePath();mc.fill();mc.restore();
      mc.strokeStyle='#dde5c650';mc.lineWidth=1;mc.strokeRect(q.x-16,q.y-10,32,20);
    }
    function updateUI(force=false){
      const s=state(),l=region||scene.locations.find(v=>v.id===s?.current)||scene.locations[0];
      if(locationTag!==l.id||force){locationTag=l.id;const title=host.querySelector('#worldRegion');if(title)title.textContent=opts.getPlaceName?.(l.id)||l.name;const desc=host.querySelector('#worldWeather');if(desc)desc.textContent=window.REGION_DATA?.regions?.[l.id]?.atmosphere||LABELS[l.biome]||'山风拂衣 · 云深不知处';}
      const current=targets.find(t=>t.type==='main'&&!t.done&&t.unlocked)||targets.filter(t=>t.type==='task'&&!t.done).sort((a,b)=>(b.stage||0)-(a.stage||0)||dist(p,a)-dist(p,b))[0]||targets.find(t=>['side','discovery'].includes(t.type)&&!t.done);
      const goal=tracked||current;const questKey=(goal?.id||'done')+':'+(goal?.stage||0)+':'+(s?.recruited.length||1)+':'+(destination?.label||'');
      if(lastQuest!==questKey||force){lastQuest=questKey;const el=host.querySelector('#worldQuest');if(el)el.innerHTML=`<span class="world-quest-kicker">${destination?'正在循迹':goal?.type==='task'?'此间委托':goal?.type==='side'?'山间见闻':goal?.type==='discovery'?'山河拾遗':'江湖主线'} <em>${s?.recruited.length||1} / 7 剑</em></span><strong>${esc(goal?.label||'山河无恙，余韵未尽')}</strong><p>${destination?'循着光迹行走，方向键随时接手。':goal?.type==='task'?'第 '+((goal.stage||0)+1)+' / '+goal.total+' 步 · '+esc(goal.anchorName||'循迹互动'):goal?'走近按 F 交谈；L 查看本区地图。':'L 查看本区地图，M 查看九境舆图。'}</p>`;}
      const chapterHUD=opts.getChapterHUD?.();if(chapterHUD&&host.querySelector('#worldQuest').innerHTML!==chapterHUD)host.querySelector('#worldQuest').innerHTML=chapterHUD;
      const hint=near?near.id+':'+near.done+':'+near.unlocked+':'+(near.stage||0):'';
      if(lastHint!==hint||force){lastHint=hint;const el=host.querySelector('#worldInteract');if(el){el.hidden=!near;el.innerHTML=near?`<span class="interact-key">F</span><span><strong>${esc(near.type==='discovery'?(near.done?'重访 · ':'发现 · ')+near.name:near.name)}</strong><small>${esc(near.type==='exit'?'沿路进入另一张区域地图':near.done?'此事已记入江湖志':near.type==='main'&&!near.unlocked?'先探明前路，再续这段故事':near.label)}</small></span><b>›</b>`:'';}}
      const stats=host.querySelector('#worldExploreCount');if(stats)stats.textContent=`九境 ${s?.visited.length||1}/9 · 此地足迹 ${(s?.world?.seen||[]).filter(id=>id.startsWith(l.id+':')).length}/${scene.landmarks?.length||12}`;
      const movement=host.querySelector('#worldMoveState');if(movement)movement.textContent=socialGather?'围桌叙话 · 方向键随时起身':path.length?'循迹中 · 方向键接手':p.dash?'踏风而行':p.walking?'山路徐行':'山河由你行走';
      const party=host.querySelector('#worldParty');if(party){const list=companions(),key=list.map(c=>c.id).join(':');if(party.dataset.members!==key||force){party.dataset.members=key;party.hidden=!list.length;party.innerHTML='<span class="world-party-title">同游</span>'+list.map(c=>`<span class="world-party-member"><span class="world-party-avatar">${A.heroSVG(c.id,{portrait:true,swordState:c.swordState})}</span><span>${esc(c.name||D.heroes.find(h=>h.id===c.id)?.name)}</span></span>`).join('');}}
      const jumpButton=host.querySelector('[data-world="jump"]');if(jumpButton)jumpButton.classList.toggle('cooling',p.cooldown>0);
    }
    function frame(ts){
      if(dead)return;const dt=Math.min(.05,(ts-last)/1000||.016);last=ts;
      // Keep the map's last image beneath panels, not a second full scene loop beneath combat.
      try{const playing=active();if(playing||wasActive)step(dt);if(!document.hidden&&(playing||paintDirty)){render();paintDirty=false;}}catch(error){if(!errorShown){errorShown=true;console.error(error);opts.onNotice?.('这片山河暂时没有展开，请保存旅途后刷新。');}}
      raf=requestAnimationFrame(frame);
    }
    on(window,'keydown',e=>{
      if(!active()||/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||''))return;
      if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','Space','KeyF','KeyJ','KeyM','KeyG','KeyL'].includes(e.code))e.preventDefault();
      keys.add(e.code);if(e.repeat)return;
      if(e.code==='Space')jump();if(e.code==='KeyF')interact();if(e.code==='KeyJ')challengeNearby();if(e.code==='KeyM'){syncPosition();opts.onAtlas?.();}if(e.code==='KeyG')trackNext();if(e.code==='KeyL'){syncPosition();opts.onLocalMap?.();}
    });
    on(window,'keyup',e=>keys.delete(e.code));on(window,'blur',()=>{keys.clear();stick.x=stick.y=0;syncPosition();});
    on(canvas,'pointerdown',e=>{if(!active())return;pointerDown={x:e.clientX,y:e.clientY,id:e.pointerId};canvas.focus({preventScroll:true});});
    on(canvas,'pointerup',e=>{
      if(!active()||!pointerDown||pointerDown.id!==e.pointerId)return;const down=pointerDown;pointerDown=null;if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>14)return;
      const b=canvas.getBoundingClientRect(),sx=e.clientX-b.left,sy=e.clientY-b.top;
      socialGather=null;p.gathering=false;
      const hit=targets.filter(t=>{const q=at(t.x,t.y);return Math.abs(q.x-sx)<(t.type==='tower'?92:t.type==='rest'?85:t.type==='patrol'?46:30)*camera.zoom&&sy<q.y+12&&sy>q.y-(t.type==='tower'?160:t.type==='rest'?189:t.type==='landmark'?42:t.type==='discovery'?58:126)*camera.zoom;}).sort((a,b)=>dist(p,a)-dist(p,b))[0];
      if(hit){tracked=hit;if(dist(p,hit)<interactionRadius(hit))interact(hit);else navigate(hit,{interact:hit.id,label:hit.label});}else{travelGoal=null;pendingTarget=null;navigate(worldAt(sx,sy));}
    });
    on(canvas,'pointercancel',()=>{pointerDown=null;});on(canvas,'contextmenu',e=>e.preventDefault());
    on(canvas,'wheel',e=>{if(!active())return;e.preventDefault();setZoom(e.deltaY>0?-.07:.07);},{passive:false});
    on(host,'click',e=>{const b=e.target.closest('[data-world]');if(!b)return;e.preventDefault();const action=b.dataset.world;
      if(action==='atlas'){syncPosition();opts.onAtlas?.();}else if(action==='local-map'){syncPosition();opts.onLocalMap?.();}else if(action==='interact')interact();else if(action==='jump')jump();else if(action==='attack'&&active())challengeNearby();else if(action==='track')trackNext();else if(action==='zoom-in')setZoom(.1);else if(action==='zoom-out')setZoom(-.1);else if(action==='recenter'){camera.x=p.x;camera.y=p.y;camera.z=p.z;resize();}else if(action==='local'){syncPosition();opts.onLocal?.(region?.id||state()?.current);}
    });
    const joystick=host.querySelector('.world-joystick'),knob=host.querySelector('.world-joystick-knob');
    function stickMove(e){const b=joystick.getBoundingClientRect(),dx=e.clientX-b.left-b.width/2,dy=e.clientY-b.top-b.height/2,r=Math.min(1,36/(Math.hypot(dx,dy)||1));stick.x=dx*r/36;stick.y=dy*r/36;if(knob)knob.style.transform=`translate(${dx*r}px,${dy*r}px)`;}
    if(joystick){on(joystick,'pointerdown',e=>{if(!active())return;e.preventDefault();stick.id=e.pointerId;joystick.setPointerCapture(e.pointerId);stickMove(e);});on(joystick,'pointermove',e=>{if(stick.id===e.pointerId)stickMove(e);});const release=e=>{if(stick.id!==e.pointerId)return;stick.id=null;stick.x=stick.y=0;if(knob)knob.style.transform='';};on(joystick,'pointerup',release);on(joystick,'pointercancel',release);}
    on(window,'resize',resize);on(document,'visibilitychange',()=>{if(document.hidden){keys.clear();stick.x=stick.y=0;syncPosition();}});
    const observer=window.ResizeObserver?new ResizeObserver(resize):null;observer?.observe(host);
    reset();raf=requestAnimationFrame(frame);
    return {get scene(){return scene;},camera,player:p,reset,resize,render,step,snapshot,flush:syncPosition,navigate,navigateLocation,navigateTarget,teleport,interact,trackNext,findPath,worldAt,arrive,gatherAt,challengeNearby,getCompanions:()=>Array.from(followers,([id,v])=>({id,...v,route:undefined})),getSocial:()=>socialGather?{...socialGather,seats:socialGather.seats.map(s=>({...s}))}:null,getTargets:()=>targets.slice(),getNearby:()=>near,getRegion:()=>region,regionRoute,refresh:()=>{updateTargets();updateUI(true);},destroy(){dead=true;cancelAnimationFrame(raf);observer?.disconnect();scene.dispose?.();handlers.forEach(fn=>fn());},setZoom};
  }
  window.SevenWorld={create};
})();
