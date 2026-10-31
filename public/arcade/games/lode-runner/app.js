(() => {
'use strict';
const t=(s,p)=>window.ArcadeI18n?window.ArcadeI18n.t(s,p):s.replace(/\{(\w+)\}/g,(_,k)=>p?.[k]??'{'+k+'}');
const $=id=>document.getElementById(id),canvas=$('game'),C=window.LodeRunner,I=window.LodeControls;
let ctx=canvas.getContext('2d');
const storage={get(k,d){try{return localStorage.getItem(k)??d;}catch(_){return d;}},set(k,v){try{localStorage.setItem(k,v);}catch(_){}}};
const storedBest=Number(storage.get('classic-lode-best','0'));
const game=new C.Game({best:Number.isFinite(storedBest)&&storedBest>0?Math.floor(storedBest):0});window.__lodeGame=game;
let sound=storage.get('classic-lode-sound','on')==='on',audio=null,touch=new Map(),last=0,acc=0,previous='',resumeAfterDialog=false,toastUntil=0,particles=[];
const inputs=new I.InputBuffer();
let lastStoredBest=game.best,lastSyncKey='',lastPaintKey='';
let speed=I.speedValue(storage.get('classic-lode-speed','1'));
const palette={paper:'#e8e8c9',gold:'#f6d96c',brick:'#b94e37',mortar:'#482e29',ladder:'#a4bbac',rope:'#88a493',steel:'#59655d',screen:'#070e10',red:'#dc5c4a',blue:'#65adb1'};
function tone(f,d=.08,shape='square',to=f){if(!sound)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),v=audio.createGain();o.type=shape;o.frequency.setValueAtTime(f,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(20,to),audio.currentTime+d);v.gain.setValueAtTime(.035,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(v);v.connect(audio.destination);o.start();o.stop(audio.currentTime+d);}catch(_){}}
function music(notes){notes.forEach((n,i)=>setTimeout(()=>tone(n,.1,'triangle'),i*105));}
function clearInput(){inputs.clear();touch.clear();document.querySelectorAll('.is-held').forEach(el=>el.classList.remove('is-held'));}
function toast(text,seconds=2.8){$('toast').textContent=text;$('toast').hidden=false;toastUntil=performance.now()+seconds*1000;}
function start(index=0){clearInput();acc=0;game.start(index);tone(440,.15,'triangle',880);sync();canvas.focus({preventScroll:true});}
function action(){const s=game.status;clearInput();acc=0;if(s==='title'||s==='gameover'||s==='won')start();else if(s==='paused')game.pause();else if(s==='dead')game.retry();else if(s==='clear')game.next();sync();canvas.focus({preventScroll:true});}
function pause(){if(document.querySelector('dialog[open]'))return;clearInput();game.pause();acc=0;sync();}
function openDialog(id){if(document.querySelector('dialog[open]'))return;clearInput();resumeAfterDialog=game.status==='playing';if(resumeAfterDialog)game.pause();$(id).showModal();sync();}
function closeDialog(dialog){dialog.close();}
document.querySelectorAll('dialog').forEach(dialog=>{dialog.addEventListener('close',()=>{if(resumeAfterDialog&&game.status==='paused')game.pause();resumeAfterDialog=false;clearInput();acc=0;sync();canvas.focus({preventScroll:true});});dialog.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeDialog(dialog)));});
$('action-button').addEventListener('click',action);$('pause-button').addEventListener('click',pause);$('restart-button').addEventListener('click',()=>openDialog('restart-dialog'));
$('help-button').addEventListener('click',()=>openDialog('help-dialog'));$('reference-button').addEventListener('click',()=>openDialog('reference-dialog'));$('stage-button').addEventListener('click',()=>openDialog('stage-dialog'));
$('confirm-restart').addEventListener('click',()=>{resumeAfterDialog=false;$('restart-dialog').close();if(game.status==='paused')game.pause();game.die(t('重新挑战本关'));if(game.status==='dead')game.retry();clearInput();acc=0;sync();});
function toggleSound(){sound=!sound;storage.set('classic-lode-sound',sound?'on':'off');syncSound();if(sound)tone(720,.08);}
function syncSound(){$('sound-button').textContent=(sound?t('声音 开'):t('声音 关'));$('sound-button').setAttribute('aria-pressed',String(sound));}
$('sound-button').addEventListener('click',toggleSound);syncSound();
$('speed-select').value=String(speed);
$('speed-select').addEventListener('change',()=>{speed=I.speedValue($('speed-select').value);storage.set('classic-lode-speed',String(speed));clearInput();acc=0;});
C.LEVELS.forEach((level,i)=>{const b=document.createElement('button');b.innerHTML='<strong>FC STAGE '+String(level.sourceStage).padStart(2,'0')+'</strong><span>'+t(level.name)+'</span>';b.addEventListener('click',()=>{resumeAfterDialog=false;$('stage-dialog').close();start(i);});$('stage-grid').appendChild(b);});
const keys={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',z:'digLeft',x:'digRight'};
window.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;if(e.target.closest?.('select,input,textarea'))return;if(document.querySelector('dialog[open]'))return;if(e.target instanceof HTMLButtonElement&&['Enter',' '].includes(e.key))return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(keys[k]){e.preventDefault();if(game.status==='playing')inputs.press('key:'+k,keys[k]);return;}if(e.repeat)return;if(k==='Enter'){e.preventDefault();action();}else if(k==='p'||k==='Escape'){e.preventDefault();pause();}else if(k==='m'){toggleSound();}else if(k==='r'&&['playing','paused'].includes(game.status)){e.preventDefault();openDialog('restart-dialog');}});
window.addEventListener('keyup',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;if(keys[k])inputs.release('key:'+k);});
canvas.addEventListener('pointerdown',e=>{if(e.button!==0||game.status!=='playing'||document.querySelector('dialog[open]'))return;e.preventDefault();const r=canvas.getBoundingClientRect();const mouse=(e.clientX-r.left)/r.width*448,offset=(448-game.width*16)/2,px=offset+(game.player.x+.5)*16;inputs.tap(mouse<px?'digLeft':'digRight');tone(50,.015,'triangle');canvas.focus({preventScroll:true});});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
document.querySelectorAll('[data-input]').forEach(b=>{const input=b.dataset.input;b.addEventListener('pointerdown',e=>{e.preventDefault();if(game.status!=='playing')return;touch.set(e.pointerId,input);inputs.press('pointer:'+e.pointerId,input);try{b.setPointerCapture(e.pointerId);}catch(_){}b.classList.add('is-held');});const release=e=>{const cancelled=e.type==='pointercancel'||(e.type==='lostpointercapture'&&touch.has(e.pointerId));touch.delete(e.pointerId);inputs.release('pointer:'+e.pointerId,cancelled);b.classList.remove('is-held');};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);});
const releasePointer=e=>{const input=touch.get(e.pointerId);touch.delete(e.pointerId);inputs.release('pointer:'+e.pointerId,e.type==='pointercancel');if(input&&!Array.from(touch.values()).includes(input))document.querySelector('[data-input="'+input+'"]')?.classList.remove('is-held');};
window.addEventListener('pointerup',releasePointer);window.addEventListener('pointercancel',releasePointer);
function blur(){clearInput();if(game.status==='playing'){game.pause();sync();}acc=0;}
window.addEventListener('blur',blur);document.addEventListener('visibilitychange',()=>{if(document.hidden)blur();});window.addEventListener('pagehide',clearInput);
function sync(){const s=game.status,key=[s,game.index,game.collected,game.totalGold,game.lives,game.score,game.best,window.ArcadeI18n?.language].join('|');if(key===lastSyncKey)return;lastSyncKey=key;$('pause-button').disabled=!['playing','paused'].includes(s);$('pause-button').textContent=s==='paused'?t('继续'):t('暂停');$('restart-button').disabled=!['playing','paused'].includes(s);$('stage-caption').textContent=t('FC 第 {stage} 关 · {name}',{stage:game.level.sourceStage,name:t(game.level.name)});$('level-hint').textContent=t(game.level.hint);
previous=s;const data={title:['COLLECT. DIG. ESCAPE.',t('黄金在前，退路在后。'),t('收齐黄金，找到出现的逃生梯。<br>没有跳跃，只有聪明的路线。'),t('开始冒险 ▶'),t('ENTER 开始 · P 暂停')],paused:['TAKE A BREATH',t('已暂停'),t('金库会在原处等你。'),t('继续冒险 ▶'),t('P / ESC 继续')],dead:['ONE MORE WAY OUT',t('换条路，再试一次。'),t(game.deathReason)+'<br>'+t('还剩 {lives} 条命 · 本关重试',{lives:game.lives}),t('继续挑战 ↻'),t('ENTER 重试')],gameover:['GAME OVER',t('下次，留好退路。'),t('本局 {score} 分 · 最高 {best} 分',{score:game.score,best:game.best}),t('再来一局 ↻'),t('ENTER 重新开始')],clear:['GOLD SECURED',t('金库清空！'),t('已拿齐 {gold} 块黄金 · 奖励 1 条命',{gold:game.totalGold})+'<br>'+t('本局 {score} 分',{score:game.score}),game.index+1===C.LEVELS.length?t('完成冒险 ★'):t('下一关 ▶'),t('ENTER 继续')],won:['ALL ROOMS CLEARED',t('满载而归。'),t('8 间金库全部完成！')+'<br>'+t('本局 {score} 分 · 最高 {best} 分',{score:game.score,best:game.best}),t('再次冒险 ↻'),t('也可通过「选关」重新挑战')]};
$('overlay').hidden=s==='playing';if(data[s]){const d=data[s];$('overlay-kicker').textContent=d[0];$('overlay-title').textContent=d[1];$('overlay-copy').innerHTML=d[2];$('action-button').textContent=d[3];$('overlay-key').textContent=d[4];}$('live-status').textContent=s==='playing'?t('第 {stage} 关，黄金 {gold}/{total}，生命 {lives}',{stage:game.level.sourceStage,gold:game.collected,total:game.totalGold,lives:game.lives}):(data[s]?.[1]||'');}
function events(){for(const e of game.drainEvents()){if(e.type==='gold'){tone(880,.09,'triangle',1400);for(let i=0;i<6;i++)particles.push({x:e.x*16+8,y:e.y*16+34,vx:(i-2.5)*8,vy:-15-i*5,t:.5,c:palette.gold});}else if(e.type==='dig')tone(110,.09,'sawtooth',40);else if(e.type==='trap')tone(160,.13,'square',70);else if(e.type==='bury')tone(110,.2,'triangle',450);else if(e.type==='death')music([300,250,170,110]);else if(e.type==='exit'){music([440,554,660,880]);toast('黄金集齐！沿亮起的梯子向上逃生',4);}else if(e.type==='clear'||e.type==='won')music([523,659,784,1047]);else if(e.type==='steal')toast('机器人拿走了黄金，引它掉进砖洞',2.2);else if(e.type==='drop')toast('黄金掉出来了！',1.7);}if(game.best!==lastStoredBest){storage.set('classic-lode-best',game.best);lastStoredBest=game.best;}}
const miner=['....hhhh....','...hhhhhh...','...hhsshh...','....ssss....','.....ss.....','..tttttttt..','..tttttttt..','ss.tttttt.ss','...tttttt...','....bbbb....','....bbbb....','...bb..bb...','...bb..bb...','..kk....kk..'];
const robot=['....rrrr....','...rrrrrr...','...wwwwww...','...wkkkkw...','...wwwwww...','....rrrr....','..rrrrrrrr..','..wrrrrrrw..','..wwrrrrww..','....rrrr....','....kkkk....','...rr..rr...','...rr..rr...','..ww....ww..'];
function drawActor(a,enemy,t){if(a.respawn)return;let x=Math.round((a.fromX+(a.x-a.fromX)*t)*16)+2,y=Math.round((a.fromY+(a.y-a.fromY)*t)*16)+27;const climb=game.ladder(a.x,a.y)&&a.fromY!==a.y;const walk=a.anim%2;const sprite=enemy?robot:miner;const colors=enemy?{r:a.carry?'#d7b85e':palette.red,w:'#d3ddd1',k:'#13201d'}:{h:'#e5e7d2',s:'#d8a170',t:palette.blue,b:'#6a7cb1',k:'#e0dcb3'};if(enemy&&a.trap)y+=4;if(a.immunity&&Math.floor(performance.now()/100)%2===0)ctx.globalAlpha=.55;for(let yy=0;yy<sprite.length;yy++)for(let xx=0;xx<12;xx++){const c=colors[sprite[yy][xx]];if(!c)continue;ctx.fillStyle=c;let dx=xx;if(a.facing<0)dx=11-xx;let shift=yy>10&&walk?(xx<6?-1:1):0;if(climb&&yy>5&&yy<9)shift=walk?1:-1;ctx.fillRect(x+dx+shift,y+yy,1,1);}ctx.globalAlpha=1;if(enemy&&a.carry){ctx.fillStyle=palette.gold;ctx.fillRect(x+5,y-3,3,2);}if(enemy&&a.trap){ctx.fillStyle='#c5d699';ctx.fillRect(x+2,y-7,Math.ceil(8*a.trap/C.TRAP_TICKS),1);}}
function brick(x,y,hole){ctx.fillStyle=palette.mortar;ctx.fillRect(x,y,16,16);ctx.fillStyle=palette.brick;ctx.fillRect(x+1,y+1,14,6);ctx.fillRect(x+1,y+9,6,6);ctx.fillRect(x+9,y+9,6,6);ctx.fillStyle='#d56d48';ctx.fillRect(x+1,y+1,14,1);ctx.fillRect(x+1,y+9,6,1);ctx.fillRect(x+9,y+9,6,1);if(hole){ctx.fillStyle=palette.screen;ctx.fillRect(x,y,16,16);ctx.fillStyle='#6c4835';ctx.fillRect(x,y+14,2,2);ctx.fillRect(x+14,y+14,2,2);if(hole.left<12){const q=Math.ceil((12-hole.left)/12*8);ctx.fillStyle=palette.brick;ctx.fillRect(x,y,q,16);ctx.fillRect(x+16-q,y,q,16);}}}
// Five immutable 16px tile glyphs replace repeated pixel primitives each frame.
// Holes, trap reveals and blinking escape edges remain live overlays.
let tileSprites=null;
function prepareTileSprites(){if(tileSprites)return;tileSprites={};const main=ctx;
 for(const kind of ['#','=','H','E','-']){const tile=document.createElement('canvas');tile.width=tile.height=16;ctx=tile.getContext('2d');
  if(kind==='#')brick(0,0,null);
  else if(kind==='='){ctx.fillStyle=palette.steel;ctx.fillRect(0,0,16,16);ctx.fillStyle='#82907b';ctx.fillRect(1,1,14,1);ctx.fillRect(1,1,1,14);ctx.fillStyle='#34463b';ctx.fillRect(2,14,13,1);ctx.fillRect(14,2,1,13);}
  else if(kind==='H'||kind==='E'){ctx.fillStyle=kind==='E'?'#d4e892':palette.ladder;ctx.fillRect(3,0,2,16);ctx.fillRect(11,0,2,16);for(let q=2;q<16;q+=5)ctx.fillRect(5,q,6,1);}
  else{ctx.fillStyle=palette.rope;ctx.fillRect(0,2,16,2);ctx.fillStyle='#d3dabb';ctx.fillRect(0,2,16,1);}
  tileSprites[kind]=tile;
 }ctx=main;
}
function render(alpha,dt){const key=[game.status,game.index,game.score,game.best,game.lives,game.collected,window.ArcadeI18n?.language].join('|');if(game.status!=='playing'&&key===lastPaintKey)return;lastPaintKey=key;prepareTileSprites();ctx.fillStyle=palette.screen;ctx.fillRect(0,0,448,264);ctx.imageSmoothingEnabled=false;ctx.font='8px monospace';ctx.textBaseline='top';ctx.fillStyle='#9eae94';ctx.fillText('1P '+String(game.score).padStart(6,'0'),9,8);ctx.fillStyle='#d1d4a5';ctx.fillText('HI '+String(game.best).padStart(6,'0'),122,8);ctx.fillStyle='#e3bd62';ctx.fillText('GOLD '+String(game.collected).padStart(2,'0')+'/'+String(game.totalGold).padStart(2,'0'),248,8);ctx.fillStyle='#a7c3b7';ctx.fillText('LIFE '+game.lives,373,8);ctx.fillStyle='#273e33';ctx.fillRect(8,21,432,1);
const offset=(448-game.width*16)/2;ctx.save();ctx.translate(offset,0);
for(let y=0;y<game.height;y++)for(let x=0;x<game.width;x++){
 const tile=game.tile(x,y),px=x*16,py=26+y*16;
 if(tile==='#'||tile==='T'){
  const hole=game.holes.get(C.key(x,y));if(hole)brick(px,py,hole);else ctx.drawImage(tileSprites['#'],px,py);
  if(tile==='T'&&game.player.y>y&&Math.abs(game.player.x-x)<2){ctx.fillStyle='#151d16';ctx.fillRect(px+3,py+3,10,10);}
 }else if(tile==='H'){
  const exit=game.base(x,y)==='E';ctx.drawImage(tileSprites[exit?'E':'H'],px,py);
  if(exit&&Math.floor(performance.now()/250)%2===0){ctx.fillStyle='#7d9c55';ctx.fillRect(px,py,1,16);ctx.fillRect(px+15,py,1,16);}
 }else if(tileSprites[tile])ctx.drawImage(tileSprites[tile],px,py);
}
for(const k of game.gold){const [x,y]=k.split(',').map(Number),px=x*16,py=26+y*16;ctx.fillStyle='#9c722c';ctx.fillRect(px+2,py+14,13,1);ctx.fillStyle=palette.gold;for(let r=0;r<8;r++)ctx.fillRect(px+7-Math.floor(r/2),py+6+r,2+Math.floor(r/2)*2,1);ctx.fillStyle='#fff0bd';ctx.fillRect(px+6,py+7,2,3);}
if(!game.noGuards)game.guards.forEach(g=>drawActor(g,true,alpha));drawActor(game.player,false,alpha);ctx.restore();
if(game.status==='playing'){for(const p of particles){p.t-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=70*dt;ctx.globalAlpha=Math.max(0,p.t*2);ctx.fillStyle=p.c;ctx.fillRect(p.x+offset,p.y,2,2);}particles=particles.filter(p=>p.t>0);ctx.globalAlpha=1;}
ctx.fillStyle='#829679';ctx.font='7px monospace';ctx.fillText('STAGE '+String(game.level.sourceStage).padStart(2,'0')+' / '+String(game.index+1).padStart(2,'0')+' OF 08',9,254);ctx.fillStyle=game.exitOpen?'#e4df95':'#72866e';ctx.textAlign='right';ctx.fillText(game.exitOpen?'ESCAPE LADDER OPEN':'COLLECT ALL GOLD TO ESCAPE',440,254);ctx.textAlign='left';}
function loop(now){const dt=Math.min(.05,(now-last)/1000||0);last=now;if(game.status==='playing'){acc+=dt;const interval=C.STEP/speed;while(acc>=interval&&game.status==='playing'){game.step(inputs.sample());acc-=interval;events();}sync();}else acc=0;if(toastUntil&&now>toastUntil){$('toast').hidden=true;toastUntil=0;}render(game.status==='playing'?Math.min(1,acc/(C.STEP/speed)):1,dt);requestAnimationFrame(loop);}
window.addEventListener('arcade-language-change',()=>{lastSyncKey='';lastPaintKey='';previous='';syncSound();sync();});
sync();requestAnimationFrame(loop);
})();

// The first scene and controls are now initialized.
window.ArcadeGameLoader?.ready();
