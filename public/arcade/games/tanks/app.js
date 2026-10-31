(function(){'use strict';
const G=window.TankGame,$=id=>document.getElementById(id),canvas=$('game'),ctxInitial=canvas.getContext('2d');let ctx=ctxInitial;ctx.imageSmoothingEnabled=false;
const T=(s,p)=>window.ArcadeI18n?window.ArcadeI18n.t(s,p):s.replace(/\{(\w+)\}/g,(_,k)=>p?.[k]??'{'+k+'}');
const read=(k,f)=>{try{return localStorage.getItem(k)||f;}catch{return f;}},write=(k,v)=>{try{localStorage.setItem(k,String(v));}catch{}};
const storedBest=Number(read('fc-tanks-best','0')),g=G.create({best:Number.isFinite(storedBest)&&storedBest>0?storedBest:0});
const colors={basic:['#d5dac5','#84927d'],fast:['#d8b66a','#926c35'],power:['#c48d7c','#8a574b'],armor:['#97b78f','#526f4f']};
const itemNames={star:'星星 · 火力升级',helmet:'头盔 · 短暂无敌',grenade:'手雷 · 清场',shovel:'铁锹 · 临时加固基地',timer:'时钟 · 冻结敌军',life:'坦克 · 生命 +1',boat:'船 · 水陆两栖'};
// Original pixel symbols, not font-dependent chess/sun/plus stand-ins.
const itemPixels={
 boat:['00011000','00011000','00111100','10111101','11111111','01111110','00111100','01011010'],
 star:['00010000','00010000','11111110','01111100','00111000','01111100','01101100','01000100'],
 helmet:['00011000','00111100','01111110','01111110','11111111','11000011','00000000','00000000'],
 grenade:['00011000','00011100','00111100','01111110','01101110','01111110','00111100','00000000'],
 shovel:['00111100','00100100','00011000','00011000','00011000','00111100','00111100','00011000'],
 timer:['00111100','01000010','10011001','10010001','10011101','10000001','01000010','00111100'],
 life:['00011000','00011000','11011011','11111111','11100111','11111111','11111111','11000011']
};
function drawItemIcon(target,type,x,y,color='#e5d999'){target.fillStyle=color;itemPixels[type].forEach((row,j)=>Array.from(row).forEach((bit,i)=>{if(bit==='1')target.fillRect(x+i*2,y+j*2,2,2);}));}
const stages=G.levels;
let sound=read('fc-tanks-sound','off')==='on',audio=null,prevState='',toastUntil=0,last=0,frame=0,savedBest=g.best;
let pickupFx=[];
const dirs=new Map(),fires=new Set();let pressOrder=0;
function syncInput(){let latest=null;for(const v of dirs.values())if(!latest||v.order>latest.order)latest=v;G.setInput(g,{dir:latest?latest.dir:null,fire:fires.size>0});}
function clearInput(){dirs.clear();fires.clear();G.setInput(g,{});document.querySelectorAll('.held').forEach(e=>e.classList.remove('held'));}
function setDir(key,dir,on){if(on)dirs.set(key,{dir,order:++pressOrder});else dirs.delete(key);syncInput();}
function setFire(key,on){if(on)fires.add(key);else fires.delete(key);syncInput();}
function wakeAudio(){if(!sound)return;try{if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{audio=null;}}
function tone(freq,duration,type='square',volume=.025,slide=0){if(!sound||!audio||audio.state!=='running')return;try{const o=audio.createOscillator(),a=audio.createGain(),t=audio.currentTime;o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(25,slide),t+duration);a.gain.setValueAtTime(volume,t);a.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(a);a.connect(audio.destination);o.start(t);o.stop(t+duration+.01);}catch{}}
function soundEvent(e){if(e.type==='shoot')tone(480,.055,'square',.018,140);if(e.type==='explode')tone(85,.17,'sawtooth',.03,32);if(e.type==='wall')tone(75,.035,'triangle',.012);if(e.type==='pickup'||e.type==='life'){tone(650,.12,'square',.025,1100);}if(e.type==='clear'||e.type==='victory')tone(440,.4,'triangle',.035,880);if(e.type==='playerhit'||e.type==='gameover')tone(180,.5,'sawtooth',.035,35);}
function toggleSound(){sound=!sound;write('fc-tanks-sound',sound?'on':'off');updateSound();wakeAudio();if(sound)tone(520,.09,'triangle');}
function updateSound(){$('sound-button').textContent=T('声音 '+(sound?'开':'关'));$('sound-button').setAttribute('aria-pressed',String(sound));}
function toast(text){$('toast').textContent=T(text);$('toast').classList.remove('hidden');toastUntil=performance.now()+2200;}
function start(stage=0){clearInput();wakeAudio();G.start(g,stage);pickupFx=[];last=performance.now();prevState='';refresh();canvas.focus({preventScroll:true});}
function togglePause(){wakeAudio();if(g.state==='playing'||g.state==='paused'){clearInput();G.pause(g);refresh();}}
function openDialog(id){const dialog=$(id);if(dialog.open)return;clearInput();dialog.dataset.resume=g.state==='playing'?'yes':'no';if(g.state==='playing')G.pause(g);dialog.showModal();refresh();}
function closeDialog(dialog){dialog.close();}
document.querySelectorAll('dialog').forEach(dialog=>{dialog.addEventListener('close',()=>{if(dialog.dataset.resume==='yes'&&g.state==='paused')G.pause(g);dialog.dataset.resume='no';clearInput();refresh();});dialog.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeDialog(dialog)));});
$('start-button').addEventListener('click',()=>start());$('practice-button').addEventListener('click',()=>openDialog('practice-dialog'));$('resume-button').addEventListener('click',togglePause);$('pause-button').addEventListener('click',togglePause);$('sound-button').addEventListener('click',toggleSound);$('help-button').addEventListener('click',()=>openDialog('help-dialog'));$('reference-button').addEventListener('click',()=>openDialog('reference-dialog'));$('restart-button').addEventListener('click',()=>openDialog('restart-dialog'));
$('confirm-restart').addEventListener('click',()=>{const d=$('restart-dialog');d.dataset.resume='no';d.close();start();});
$('result-button').addEventListener('click',()=>{wakeAudio();if(g.state==='stageclear'){G.nextStage(g);clearInput();refresh();canvas.focus({preventScroll:true});}else start();});
for(let i=0;i<stages.length;i++){const b=document.createElement('button');b.innerHTML='<strong>'+String(i+1).padStart(2,'0')+'</strong>'+T(stages[i].name)+'<small>'+T('原版第 {stage} 关 / 20 辆敌军',{stage:i+1})+'</small>';b.addEventListener('click',()=>{const d=$('practice-dialog');d.dataset.resume='no';d.close();start(i);g.practice=true;});$('stage-options').appendChild(b);}
for(let i=0;i<20;i++)$('wave-track').appendChild(document.createElement('span'));
const keyDirs={ArrowUp:0,KeyW:0,ArrowRight:1,KeyD:1,ArrowDown:2,KeyS:2,ArrowLeft:3,KeyA:3};
window.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))return;if(e.altKey||e.ctrlKey||e.metaKey)return;if(e.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;const code=e.code;
if((code==='Space'||code==='Enter')&&e.target.closest&&e.target.closest('button,a,input,textarea,select,[contenteditable="true"]'))return;
if(code in keyDirs){if(['playing','paused'].includes(g.state))e.preventDefault();if(g.state==='playing'&&!e.repeat)setDir('k'+code,keyDirs[code],true);return;}
if(code==='Space'||code==='KeyJ'){if(g.state==='playing'){e.preventDefault();wakeAudio();if(!e.repeat)G.fire(g,g.player);setFire('k'+code,true);}return;}
if(e.repeat)return;if(code==='KeyP'||code==='Escape'){e.preventDefault();togglePause();}else if(code==='KeyM')toggleSound();else if(code==='KeyR'&&g.state!=='title')openDialog('restart-dialog');else if(code==='Enter'){if(g.state==='title'||g.state==='gameover'||g.state==='victory'){e.preventDefault();start();}else if(g.state==='stageclear'){e.preventDefault();G.nextStage(g);clearInput();refresh();}}});
window.addEventListener('keyup',e=>{dirs.delete('k'+e.code);fires.delete('k'+e.code);syncInput();});
canvas.addEventListener('pointerdown',e=>{if(e.button!==0||g.state!=='playing')return;e.preventDefault();canvas.focus({preventScroll:true});wakeAudio();G.fire(g,g.player);setFire('p'+e.pointerId,true);try{canvas.setPointerCapture(e.pointerId);}catch{}});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
function releasePointer(e){dirs.delete('p'+e.pointerId);fires.delete('p'+e.pointerId);syncInput();document.querySelectorAll('[data-pointer="'+e.pointerId+'"]').forEach(el=>{el.classList.remove('held');delete el.dataset.pointer;});}
window.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&!(e.buttons&1))releasePointer(e);});
window.addEventListener('pointerup',releasePointer);window.addEventListener('pointercancel',releasePointer);canvas.addEventListener('lostpointercapture',releasePointer);
for(const button of document.querySelectorAll('[data-dir],#fire-button')){button.addEventListener('pointerdown',e=>{if(e.button!==0||g.state!=='playing')return;e.preventDefault();wakeAudio();button.classList.add('held');button.dataset.pointer=e.pointerId;button.setPointerCapture(e.pointerId);if(button.hasAttribute('data-dir'))setDir('p'+e.pointerId,Number(button.dataset.dir),true);else{G.fire(g,g.player);setFire('p'+e.pointerId,true);}});button.addEventListener('lostpointercapture',releasePointer);}
function autoPause(){clearInput();if(g.state==='playing'){G.pause(g);refresh();}if(audio&&audio.state==='running')audio.suspend().catch(()=>{});}
window.addEventListener('blur',autoPause);document.addEventListener('visibilitychange',()=>{if(document.hidden)autoPause();});window.addEventListener('pagehide',autoPause);
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
function terrain(tile,x,y){const t=tile.type;if(t==='B'){const c='#b47b54',dark='#684a32';rect(x,y,16,16,dark);for(let row=0;row<4;row++){if(tile.hp===1&&row<2)continue;for(let col=0;col<3;col++){let bx=x+col*8-(row%2?4:0);const left=Math.max(x,bx),right=Math.min(x+15,bx+7);if(right>left){rect(left,y+row*4,right-left,3,c);rect(left,y+row*4,right-left,1,'#cc9870');}}}if(tile.hp===1)rect(x,y,16,8,'#18221b');}
else if(t==='S'){rect(x,y,16,16,'#818d7a');rect(x+1,y+1,14,14,'#bdc7af');rect(x+1,y+1,14,2,'#e0e5ce');rect(x+1,y+3,2,10,'#d3dbc3');rect(x+3,y+13,12,2,'#919f88');rect(x+4,y+4,2,2,'#788a73');rect(x+11,y+11,2,2,'#788a73');}
else if(t==='W'){rect(x,y,16,16,'#376c79');const off=Math.floor(g.time*3)%2;rect(x+2+off*3,y+3,8,2,'#609aa3');rect(x+7-off*3,y+10,7,2,'#518d99');const col=x/16,row=y/16;const water=(xx,yy)=>g.tiles[yy]?.[xx]?.type==='W';if(!water(col,row-1))rect(x,y,16,1,'#8da58a');if(!water(col,row+1))rect(x,y+15,16,1,'#264e5c');if(!water(col-1,row))rect(x,y,1,16,'#74948a');if(!water(col+1,row))rect(x+15,y,1,16,'#264e5c');}
else if(t==='I'){rect(x,y,16,16,'#a0bdb9');rect(x+2,y+5,8,1,'#d1ddd1');}
}
function forest(x,y){rect(x,y,16,16,'#31542c');rect(x+2,y+1,8,5,'#66884b');rect(x+1,y+7,6,6,'#4d773c');rect(x+7,y+5,8,8,'#426b35');rect(x+5,y+3,4,3,'#89a263');rect(x+11,y+10,4,4,'#779954');rect(x+1,y+14,7,2,'#233c25');}
// Pixel silhouettes are adapted from the manual, with an optional mixed-version boat.
// This renderer never changes tank state; it also powers the sprite QA gallery.
function drawTankSprite(target,t,time=0,freeze=false){
 if(!t.alive)return;
 const r=(x,y,w,h,c)=>{target.fillStyle=c;target.fillRect(Math.round(x),Math.round(y),w,h);};
 const x=Math.round(t.x+14),y=Math.round(t.y+14),ink='#18231c';
 if(t.spawning>0){target.save();target.translate(x,y);const s=Math.floor(time*10)%3;for(let i=0;i<4;i++){target.rotate(Math.PI/2);r(-2,-6-s*4,4,7,'#dce8ad');r(-7,-3-s*3,4,3,'#8da969');}target.restore();return;}
 const player=t.team==='player',level=Math.max(0,Math.min(3,t.upgrade||0));
 const palettes=[['#d4d9c1','#818b73'],['#d8bb77','#8f7445'],['#b5c3be','#667f79'],['#9cbe89','#4c714c']];
 let c=player?['#e0c16c','#96743b']:t.type==='armor'?palettes[Math.max(0,Math.min(3,(t.hp||1)-1))]:(colors[t.type]||colors.basic);
 const hi=player?'#fff0ad':'#e5ead1',phase=Math.floor((t.track||0)/4)%2;
 target.save();target.translate(x,y);target.rotate((t.dir||0)*Math.PI/2);
 if(t.boat){
   if(t.inWater&&t.moving){const p=Math.floor(time*10)%3;for(let i=0;i<3;i++){const spread=9+i*3;r(-spread-2,17+i*4+p,4,2,'#8ebbb8');r(spread-2,17+i*4+p,4,2,'#8ebbb8');}r(-5,18+p,10,2,'#609caa');}
   if(t.inWater){r(-18,-10,36,23,ink);r(-16,-14,32,30,'#78633e');r(-13,-17,26,34,'#b79a5d');r(-9,-19,18,3,'#d9bf7b');}else{r(-18,-11,7,26,ink);r(11,-11,7,26,ink);r(-17,-10,6,24,'#78633e');r(11,-10,6,24,'#78633e');r(-13,-7,26,3,'#b79a5d');r(-13,8,26,3,'#b79a5d');}
   r(-17,-9,5,22,'#d0b473');r(12,-9,5,22,'#d0b473');r(-16,-7,2,17,'#f1d597');r(14,-7,2,17,'#f1d597');
   if(t.inWater){r(-18,12,5,3,'#afd0bf');r(13,12,5,3,'#afd0bf');r(-11,16,22,2,'#477e8c');}
 }
 const fast=!player&&t.type==='fast',heavy=player?level===3:t.type==='armor';
 // Three separate wheel pairs make the fast scout recognizable even in monochrome.
 if(fast){for(const yy of[-11,-2,8])for(const xx of[-13,8]){r(xx,yy,5,6,ink);r(xx+1,yy,3,5,c[1]);r(xx+1,yy+phase,3,2,c[0]);}}
 else {const top=heavy?-14:-12,len=heavy?28:25;for(const xx of[-14,8]){r(xx,top,6,len,ink);r(xx+1,top+1,4,len-2,c[1]);for(let j=top+2+phase*2;j<top+len-1;j+=5)r(xx+1,j,4,2,c[0]);}}
 if(heavy){r(-9,-13,18,26,c[1]);r(-8,-12,16,24,c[0]);r(-7,-10,14,3,hi);r(-7,8,14,3,c[1]);r(-9,-7,3,15,hi);r(6,-7,3,15,c[1]);r(-5,-5,10,12,ink);r(-4,-4,8,10,c[0]);r(-2,-2,4,5,hi);r(-3,-17,6,14,c[1]);r(-2,-17,4,13,c[0]);r(-1,-16,1,11,hi);if(!player)r(-5,-17,10,3,hi);}
 else if(fast){r(-7,-13,14,27,c[1]);r(-6,-12,12,24,c[0]);r(-5,-12,10,3,hi);r(-4,9,8,2,ink);r(-5,-5,10,12,c[1]);r(-3,-4,6,9,hi);r(-2,-2,4,5,c[0]);r(-2,-17,4,15,c[1]);r(-1,-17,2,14,hi);}
 else if(player){
   const wide=level===2?8:level===1?6:7,top=level===0?-8:-11;
   r(-wide,top,wide*2,21,c[1]);r(-wide+1,top+1,wide*2-2,18,c[0]);r(-wide+2,top+1,wide*2-4,2,hi);
   if(level===0){r(-5,-6,10,13,c[1]);r(-4,-5,8,11,c[0]);r(-2,-2,4,6,hi);r(-1,-1,2,4,c[1]);}
   else {r(-5,-7,10,16,c[1]);r(-4,-7,8,14,hi);r(-3,-6,6,12,c[0]);r(-2,-1,4,7,c[1]);r(-1,0,2,4,hi);}
   const tip=level===0?-14:-18;r(-2,tip,4,-tip-3,c[1]);r(-1,tip,2,-tip-3,hi);if(level===2){r(-5,-18,10,3,c[1]);r(-4,-18,8,2,hi);}
 } else {
   // Stepped oval body/turret for light and rapid-fire tanks.
   const power=t.type==='power';r(-5,-12,10,25,c[1]);r(-8,-9,16,20,c[1]);r(-7,-8,14,17,c[0]);r(-5,-11,10,23,c[0]);r(-4,-9,8,2,hi);r(-5,-5,10,11,hi);r(-6,-3,12,7,hi);r(-3,-3,6,7,c[1]);r(-2,-2,4,4,c[0]);r(-2,power?-18:-15,4,power?17:14,c[1]);r(-1,power?-18:-15,2,power?16:13,hi);if(power){r(-5,-18,10,3,c[1]);r(-4,-18,8,2,hi);r(-3,9,6,2,c[1]);}
 }
 if(t.carrier&&Math.floor(time*6)%2===0){for(const xx of[-16,13]){r(xx,-14,3,5,'#fff0bb');r(xx,10,3,5,'#fff0bb');}r(-6,14,12,2,'#e59175');}
 target.restore();
 if(freeze&&!player){r(x-7,y-18,4,2,'#b6d8d1');r(x+3,y-18,4,2,'#b6d8d1');r(x-5,y-20,2,6,'#b6d8d1');r(x+3,y-20,2,6,'#b6d8d1');}
 if(player&&t.shield>0){target.save();target.translate(x,y);const step=Math.floor(time*12)%8,rad=19+(Math.floor(time*6)%2);for(let i=0;i<8;i++){target.save();target.rotate(i*Math.PI/4);r(-3,-rad,6,2,(i+step)%4===0?'#fff7cb':'#9ebc88');r(-4,-rad+2,2,3,'#6d9472');target.restore();}target.restore();}
}
function tank(t){drawTankSprite(ctx,t,g.time,g.freeze>0);}
function drawExplosion(target,f){const q=Math.max(0,Math.min(1,1-f.life/f.max)),phase=Math.min(3,Math.floor(q*4)),size=f.big?2:1;target.save();target.translate(Math.round(f.x),Math.round(f.y));target.scale(size,size);const r=(x,y,w,h,c)=>{target.fillStyle=c;target.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};const rays=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
 if(phase<3){const a=[5,9,7][phase];r(-a,-a/2,a*2,a,'#b25b36');r(-a/2,-a,a,a*2,'#e28e43');r(-a+2,-a+2,a*2-4,a*2-4,'#f4bf64');r(-3,-5,6,10,'#fff0ae');r(-5,-2,10,4,'#fff8d0');}
 for(let i=0;i<rays.length;i++){const[dx,dy]=rays[i],d=5+q*14+(i%2)*2,s=phase===3?2:3;r(Math.round(dx*d)-1,Math.round(dy*d)-1,s,s,phase===3?'#aa764b':i%2?'#edac54':'#ffe49b');}target.restore();}
function base(){const x=192,y=384;if(!g.baseAlive){rect(x+4,y+8,24,23,'#665e43');rect(x+9,y+2,5,13,'#8b6b4b');rect(x+18,y+7,6,11,'#8b6b4b');return;}rect(x+3,y+1,26,29,'#101811');rect(x+7,y+6,18,16,'#a28b4a');rect(x+4,y+4,6,6,'#d6bb6a');rect(x+22,y+4,6,6,'#d6bb6a');rect(x+9,y+3,14,5,'#d6bb6a');rect(x+12,y+8,8,17,'#e2cd84');rect(x+10,y+24,12,3,'#a28b4a');rect(x+13,y+10,6,6,'#536243');rect(x+15,y+8,2,10,'#243520');}
function pickup(p){if(Math.floor(g.time*6)%3===2)return;rect(p.x-1,p.y-1,26,26,'#142318');ctx.strokeStyle='#fff1b5';ctx.lineWidth=2;ctx.strokeRect(p.x+1,p.y+1,22,22);drawItemIcon(ctx,p.type,p.x+4,p.y+4,'#fff1b5');}
let terrainCache=null,forestCache=null,terrainKey='',waterCells=[];
function refreshTerrainCache(){
 const key=g.tiles.map(row=>row.map(t=>t.type+(t.hp||0)).join('')).join('|');
 if(key===terrainKey&&terrainCache)return;
 if(!document.createElement)return;
 if(!terrainCache){terrainCache=document.createElement('canvas');forestCache=document.createElement('canvas');terrainCache.width=forestCache.width=416;terrainCache.height=forestCache.height=416;}
 const main=ctx;ctx=terrainCache.getContext('2d');ctx.clearRect(0,0,416,416);waterCells=[];
 for(let y=0;y<26;y++)for(let x=0;x<26;x++){const tile=g.tiles[y][x];if(tile.type==='W')waterCells.push([x,y]);else{if(tile.type==='.')rect(x*16+7,y*16+7,1,1,'#1e2a20');terrain(tile,x*16,y*16);}}
 ctx=forestCache.getContext('2d');ctx.clearRect(0,0,416,416);for(let y=0;y<26;y++)for(let x=0;x<26;x++)if(g.tiles[y][x].type==='F')forest(x*16,y*16);ctx=main;terrainKey=key;
}
function render(){
rect(0,0,416,448,'#18221b');rect(0,0,416,32,'#0d170f');ctx.textBaseline='top';ctx.textAlign='left';ctx.font='9px monospace';ctx.fillStyle='#839571';ctx.fillText(g.practice?'PRACTICE':'SCORE',10,5);ctx.fillText('BEST',135,5);ctx.fillText('TANKS',266,5);ctx.fillText('STAGE',354,5);ctx.font='bold 12px monospace';ctx.fillStyle='#e3e8bb';ctx.fillText(String(g.score).padStart(6,'0'),10,17);ctx.fillText(String(g.best).padStart(6,'0'),135,17);ctx.fillText('× '+g.lives,271,17);ctx.fillText(String(g.stage+1).padStart(2,'0')+'/06',354,17);
refreshTerrainCache();ctx.save();ctx.translate(0,32);if(terrainCache){ctx.drawImage(terrainCache,0,0);for(const[x,y]of waterCells)terrain(g.tiles[y][x],x*16,y*16);}else for(let y=0;y<26;y++)for(let x=0;x<26;x++){if(g.tiles[y][x].type==='.')rect(x*16+7,y*16+7,1,1,'#1e2a20');terrain(g.tiles[y][x],x*16,y*16);}base();
tank(g.player);for(const e of g.enemies)tank(e);
if(g.state==='title'){for(const[x,y,d,type]of[[194,2,2,'basic'],[386,2,2,'fast'],[2,2,2,'armor']])tank({x,y,dir:d,type,alive:true,track:0,hp:4,team:'enemy'});}
for(const b of g.bullets){rect(b.x,b.y,6,6,b.team==='player'?'#eae4ae':'#e0a67b');rect(b.x+2,b.y+2,2,2,'#fff4d4');}
if(forestCache)ctx.drawImage(forestCache,0,0);else for(let y=0;y<26;y++)for(let x=0;x<26;x++)if(g.tiles[y][x].type==='F')forest(x*16,y*16);
// Bonus sprites have foreground priority in the original, including over forest.
for(const p of g.pickups)pickup(p);
for(const f of g.effects)drawExplosion(ctx,f);
for(const f of pickupFx){const age=g.time-f.time;if(age<0||age>1)continue;const radius=15+age*18;ctx.strokeStyle=age<.4?'#f0dfa0':'#928a60';ctx.lineWidth=1;for(let i=0;i<4;i++){ctx.save();ctx.translate(f.x,f.y);ctx.rotate(i*Math.PI/2);ctx.strokeRect(-5,-radius,10,2);ctx.restore();}ctx.fillStyle='#fff0b8';ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillText('500',f.x,f.y-19-age*18);}

if(g.freeze>0){ctx.fillStyle='#acd1c0';ctx.font='bold 10px monospace';ctx.textAlign='left';ctx.fillText('STOP '+Math.ceil(g.freeze)+'s',8,8);}if(g.fortify>0){ctx.fillStyle=g.fortify<4&&Math.floor(g.time*5)%2?'#dcad7c':'#dce6bb';ctx.font='bold 9px monospace';ctx.textAlign='right';ctx.fillText('BASE '+Math.ceil(g.fortify)+'s',408,402);}if(g.player.upgrade>0){ctx.fillStyle='#dfc76f';ctx.font='bold 10px monospace';ctx.textAlign='left';ctx.fillText('★'.repeat(g.player.upgrade),7,402);}ctx.restore();
}
let uiStamp='';
function refresh(){
const stamp=[g.state,g.stage,g.kills,g.spawned,g.enemies.length,g.practice,g.best,!!document.querySelector('dialog[open]'),window.ArcadeI18n?.language].join('|');if(stamp===uiStamp)return;uiStamp=stamp;
const state=g.state,playing=state==='playing';$('title-overlay').classList.toggle('hidden',state!=='title');$('pause-overlay').classList.toggle('hidden',state!=='paused'||!!document.querySelector('dialog[open]'));$('result-overlay').classList.toggle('hidden',!['stageclear','gameover','victory'].includes(state));$('pause-button').disabled=!['playing','paused'].includes(state);$('pause-button').textContent=T(state==='paused'?'继续':'暂停');$('restart-button').disabled=state==='title';
$('stage-label').textContent=(g.practice?T('练习 · '):'')+T('第 {stage} 关 · {name}',{stage:String(g.stage+1).padStart(2,'0'),name:T(stages[g.stage].name)});$('wave-label').textContent=T('击毁 {kills} / 20 · 场上 {active}',{kills:g.kills,active:g.enemies.length});
Array.from($('wave-track').children).forEach((el,i)=>{el.className=i<g.kills?'done':i<g.spawned?'active':'';});
if(state!==prevState){clearInput();if(['stageclear','gameover','victory'].includes(state)){$('result-kicker').textContent=state==='stageclear'?'STAGE CLEAR':state==='victory'?'ALL SIX STAGES CLEARED':'GAME OVER';$('result-title').textContent=state==='stageclear'?T('第 {stage} 关守住了',{stage:g.stage+1}):T(state==='victory'?'六道防线，全部守住':g.reason==='base'?'基地失守':'最后一辆坦克倒下了');$('result-score').textContent=String(g.score).padStart(6,'0');$('result-detail').textContent=state==='stageclear'?T('剩余 {lives} 辆坦克 · 火力 {tier} 级',{lives:g.lives,tier:g.player.upgrade}):(g.practice?T('练习模式 · '):'')+T('第 {stage} 关 · 本关击毁 {kills} 辆',{stage:g.stage+1,kills:g.kills});$('kill-summary').textContent=T('炮击计分：普通 {basic}　快速 {fast}　火力 {power}　装甲 {armor}',g.counts);$('result-button').textContent=T(state==='stageclear'?(g.stage<5?'进入下一关 ▶':'查看通关战绩 ▶'):'再守一局 ↻');$('result-hint').textContent=T(state==='stageclear'?'ENTER 继续':'ENTER 重新开始');}prevState=state;}
if(g.best!==savedBest){savedBest=g.best;write('fc-tanks-best',g.best);}
}
function loop(now){const dt=last?Math.min(.1,(now-last)/1000):0;last=now;G.update(g,dt);for(const e of G.drainEvents(g)){soundEvent(e);if(e.type==='pickup'){toast(itemNames[e.item]);pickupFx.push({x:e.x??g.player.x+14,y:e.y??g.player.y+14,time:g.time});}if(e.type==='drop')toast('闪光敌军掉落道具');if(e.type==='life')toast('20,000 分 · 奖励一辆坦克');if(e.type==='fortifyend')toast('基地钢墙保护已结束');}pickupFx=pickupFx.filter(f=>g.time>=f.time&&g.time-f.time<1);if(now>toastUntil)$('toast').classList.add('hidden');if(frame++%5===0||g.state!==prevState)refresh();render();requestAnimationFrame(loop);}
document.querySelectorAll('[data-item-icon]').forEach(icon=>drawItemIcon(icon.getContext('2d'),icon.dataset.itemIcon,4,4,'#52653c'));
window.addEventListener('arcade-language-change',()=>{uiStamp='';prevState='';updateSound();refresh();for(let i=0;i<stages.length;i++)$('stage-options').children[i].innerHTML='<strong>'+String(i+1).padStart(2,'0')+'</strong>'+T(stages[i].name)+'<small>'+T('原版第 {stage} 关 / 20 辆敌军',{stage:i+1})+'</small>';render();});
updateSound();refresh();render();requestAnimationFrame(loop);
// Small read-only-ish QA entry point; all gameplay remains usable without it.
window.TankArcade={game:g,start,togglePause,clearInput,render,drawItemIcon,itemPixels,drawTankSprite,drawExplosion};
})();

// The first scene and controls are now initialized.
window.ArcadeGameLoader?.ready();
