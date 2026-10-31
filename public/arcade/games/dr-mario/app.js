(function(){
  'use strict';
  const t=(source,params)=>window.ArcadeI18n?window.ArcadeI18n.t(source,params):String(source).replace(/\{(\w+)\}/g,(_,key)=>params?.[key]??'{'+key+'}');
  const setText=(id,value)=>{const el=$(id);if(el.textContent!==value)el.textContent=value;};
  const C=window.DrMarioCore,Inputs=window.DrMarioControls,$=id=>document.getElementById(id);
  const canvas=$('game'),input=new Inputs.InputBuffer(),pointerOwners=new Map();
  let ctx=canvas.getContext('2d');
  const danceCanvas=$('virus-dance'),danceCtx=danceCanvas?.getContext('2d');
  let danceTime=0,danceHit=[0,0,0],danceCounts=[1,1,1];
  let openingToss=0,doctorFollow=0,previewTime=0;
  const TOSS_TIME=.22;
  const STORE='classic-dr-mario-v1';
  let saved={};try{saved=JSON.parse(localStorage.getItem(STORE)||'{}')||{};}catch(_){}
  const game=new C.Game({best:Number.isFinite(saved.best)?saved.best:0});
  const audio=window.DrMarioAudio||{unlock(){},setEnabled(){},setTrack(){},setPlaying(){},sfx(){}};
  let enabled=saved.sound!==false,track=saved.track==='off'?'off':saved.musicRevision===2&&['fever','pulse','calm'].includes(saved.track)?saved.track:'fever';
  let lastState='',lastScore=-1,lastRemaining=-1,lastTime=0,accumulator=0,elapsed=0,toastTime=0,dialogPaused=false;
  const palette=[{body:'#e6bd4d',light:'#fff1a9',dark:'#a87529'},{body:'#e57566',light:'#ffc2a7',dark:'#9f424b'},{body:'#6cb7d6',light:'#c0edfa',dark:'#365e9a'}];
  const motionQuery=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let motionMode=['full','simple','system'].includes(saved.motionMode)?saved.motionMode:'full';
  let touchLayout=saved.touchLayout==='two'?'two':'one';
  let reducedMotion=motionMode==='simple'||(motionMode==='system'&&!!motionQuery?.matches);
  let renderScale=1, renderSizeDirty=true, danceScale=1;
  let bottleLayer=null,bottleLayerScale=0,boardLayer=null,boardLayerKey='';
  window.addEventListener('resize',()=>{renderSizeDirty=true;});
  if(window.ResizeObserver){const ro=new window.ResizeObserver(()=>{renderSizeDirty=true;});ro.observe(canvas);if(danceCanvas)ro.observe(danceCanvas);}
  function layer(width,height,scale){const c=document.createElement('canvas');c.width=width*scale;c.height=height*scale;return c;}

  // Compact portrait composition: keep the 8 × 16 board, not decorative HUDs, dominant.
  const field={x:12,y:24,size:20};
  const busy=()=>['playing','clearing','falling','spawnWait'].includes(game.state);
  const anyDialog=()=>!!document.querySelector('dialog[open]');
  function save(){try{localStorage.setItem(STORE,JSON.stringify({best:game.best,sound:enabled,musicRevision:2,motionMode,touchLayout,track:track==='custom'?'fever':track}));}catch(_){}}
  function unlock(){audio.unlock();}
  function refreshMotion(){
    reducedMotion=motionMode==='simple'||(motionMode==='system'&&!!motionQuery?.matches);
    $('motion-select').value=motionMode;
    setText('motion-status',t(reducedMotion?'简化：无跳舞与飞行动作':'完整：病毒跳舞 / 医生投药'));
    canvas.dataset.motion=reducedMotion?'simple':'full';save();
  }
  $('motion-select').addEventListener('change',()=>{motionMode=$('motion-select').value;refreshMotion();});
  motionQuery?.addEventListener?.('change',refreshMotion);
  $('motion-preview').addEventListener('click',()=>{
    if(game.state!=='title')return;
    previewTime=2.4;danceTime=0;lastState='';sync();showToast(reducedMotion?'简化动效预览':'动效演示 · 不影响游戏');
  });
  function refreshSound(){audio.setEnabled(enabled);audio.setTrack(track);setText('sound-toggle',t(enabled?'声音 开':'声音 关'));$('sound-toggle').setAttribute('aria-pressed',String(enabled));$('music-select').value=track;save();}
  for(let n=0;n<=20;n++){const o=document.createElement('option');o.value=n;o.textContent=t('{n} · {count} 只',{n:String(n).padStart(2,'0'),count:C.virusCountForLevel(n)});$('level-select').append(o);}
  function levelDetail(){const n=+$('level-select').value;$('level-detail').textContent=t('{count} 只病毒 · 下方 {rows} 行',{count:C.virusCountForLevel(n),rows:C.virusRowsForLevel(n)});}
  $('level-select').addEventListener('change',levelDetail);levelDetail();
  function clearInput(){input.clear();pointerOwners.clear();document.querySelectorAll('[data-input]').forEach(b=>b.classList.remove('pressed'));}
  function refreshTouchLayout(){
    document.body.dataset.touchLayout=touchLayout;
    document.querySelectorAll('.touch-layout-switch button[data-touch-layout]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.touchLayout===touchLayout)));
    renderSizeDirty=true;
  }
  document.querySelectorAll('.touch-layout-switch button[data-touch-layout]').forEach(button=>{
    button.addEventListener('click',event=>{
      event.preventDefault();
      const next=button.dataset.touchLayout;if(next!=='one'&&next!=='two')return;
      clearInput();touchLayout=next;refreshTouchLayout();save();
    });
  });
  function showToast(text){$('toast').textContent=t(text);$('toast').hidden=false;toastTime=1.5;}
  function newSeed(){if(window.crypto?.getRandomValues){const b=new Uint32Array(1);crypto.getRandomValues(b);return b[0];}return Date.now()>>>0;}
  function start(){previewTime=0;unlock();clearInput();game.newGame(+$('level-select').value,$('speed-select').value,newSeed());danceTime=0;danceHit=[0,0,0];openingToss=TOSS_TIME;document.body.classList.add('is-running');sync();canvas.focus({preventScroll:true});
    // Starting collapses the title; keep all touch controls within a short landscape viewport.
    if(window.matchMedia?.('(pointer: coarse) and (orientation: landscape) and (max-height: 560px)')?.matches)requestAnimationFrame(()=>document.querySelector('.cabinet').scrollIntoView({block:'nearest',inline:'nearest'}));
  }
  function action(){
    unlock();if(anyDialog())return;
    if(game.state==='title')start();
    else if(game.state==='paused'){clearInput();game.resume();sync();canvas.focus({preventScroll:true});}
    else if(game.state==='levelclear'){clearInput();game.nextLevel();openingToss=TOSS_TIME;sync();canvas.focus({preventScroll:true});}
    else if(['gameover','complete'].includes(game.state))title();
  }
  function title(){previewTime=0;doctorFollow=0;openingToss=0;clearInput();audio.setPlaying(false);game.state='title';game.active=null;$('level-select').value=String(game.level);$('speed-select').value=game.speed;levelDetail();document.body.classList.remove('is-running');sync();$('action-button').focus({preventScroll:true});}
  function pause(){if(anyDialog())return;unlock();clearInput();if(game.state==='paused')game.resume();else game.pause();sync();canvas.focus({preventScroll:true});}
  function showDialog(id){unlock();clearInput();dialogPaused=game.pause();sync();$(id).showModal();}
  document.querySelectorAll('dialog').forEach(dialog=>{
    dialog.addEventListener('close',()=>{clearInput();if(dialogPaused&&game.state==='paused'){game.resume();}dialogPaused=false;sync();canvas.focus({preventScroll:true});});
    dialog.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>dialog.close()));
  });
  $('action-button').addEventListener('click',action);
  $('pause-button').addEventListener('click',pause);
  $('restart-button').addEventListener('click',()=>showDialog('restart-dialog'));
  $('confirm-restart').addEventListener('click',()=>{dialogPaused=false;$('restart-dialog').close();title();});
  $('help-button').addEventListener('click',()=>showDialog('help-dialog'));
  $('reference-button').addEventListener('click',()=>showDialog('reference-dialog'));
  $('sound-toggle').addEventListener('click',()=>{unlock();enabled=!enabled;refreshSound();});
  $('music-select').addEventListener('change',()=>{unlock();track=$('music-select').value;refreshSound();});
  const file=$('local-music');
  if(file){
    file.addEventListener('click',unlock);
    file.addEventListener('change',()=>{const chosen=file.files?.[0];if(!chosen)return;unlock();if(audio.setCustomFile?.(chosen)){
      let option=$('custom-track');if(!option){option=document.createElement('option');option.id='custom-track';option.value='custom';$('music-select').append(option);}option.textContent='本地音乐';track='custom';refreshSound();$('local-music-status').textContent=t('{name} · 仅本机播放',{name:chosen.name});
    }else{$('local-music-status').textContent='无法播放这个音频文件，请换一个常见音频格式。';}file.value='';});
  }
  document.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey||e.isComposing||Inputs.isInteractive(e.target)||e.target?.closest?.('summary')||anyDialog())return;
    const mapped=Inputs.KEY_MAP[e.code];
    if(mapped){if(!busy())return;e.preventDefault();if(!e.repeat){unlock();input.press(mapped,'key:'+e.code);}return;}
    if(e.repeat)return;
    if(e.code==='KeyP'||e.code==='Escape'){if(busy()||game.state==='paused'){e.preventDefault();pause();}}
    else if(e.code==='KeyR'&&game.state!=='title'){e.preventDefault();showDialog('restart-dialog');}
    else if(e.code==='KeyM'){e.preventDefault();unlock();enabled=!enabled;refreshSound();}
    else if(e.code==='Enter'&&!busy()){e.preventDefault();action();}
  });
  document.addEventListener('keyup',e=>input.release('key:'+e.code));
  function releasePointer(e,cancelled=false){
    const source='pointer:'+e.pointerId,button=pointerOwners.get(e.pointerId);
    if(cancelled)input.cancel(source);else input.release(source);
    pointerOwners.delete(e.pointerId);
    if(button&&!Array.from(pointerOwners.values()).includes(button))button.classList.remove('pressed');
  }
  document.querySelectorAll('[data-input]').forEach(button=>{
    button.addEventListener('pointerdown',e=>{
      if(e.button!==0||!busy()||anyDialog())return;e.preventDefault();unlock();
      try{button.setPointerCapture?.(e.pointerId);}catch(_){}
      pointerOwners.set(e.pointerId,button);input.press(button.dataset.input,'pointer:'+e.pointerId);button.classList.add('pressed');
    });
    button.addEventListener('pointerup',e=>releasePointer(e));
    button.addEventListener('pointercancel',e=>releasePointer(e,true));
    button.addEventListener('lostpointercapture',e=>{if(pointerOwners.has(e.pointerId))releasePointer(e,true);});
    button.addEventListener('click',e=>{if(e.detail===0&&busy()&&!anyDialog()){unlock();input.press(button.dataset.input,'keyboard-button');input.release('keyboard-button');}});
  });
  window.addEventListener('pointerup',e=>releasePointer(e));
  window.addEventListener('pointercancel',e=>releasePointer(e,true));
  window.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&(e.buttons&1)===0&&pointerOwners.has(e.pointerId))releasePointer(e,true);});
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0||!busy()||anyDialog())return;e.preventDefault();unlock();canvas.focus({preventScroll:true});
    try{canvas.setPointerCapture?.(e.pointerId);}catch(_){}
    pointerOwners.set(e.pointerId,canvas);input.press('cw','pointer:'+e.pointerId);
  });
  canvas.addEventListener('pointerup',e=>releasePointer(e));
  canvas.addEventListener('pointercancel',e=>releasePointer(e,true));
  canvas.addEventListener('lostpointercapture',e=>{if(pointerOwners.has(e.pointerId))releasePointer(e,true);});
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  function interrupted(){dialogPaused=false;clearInput();game.pause();audio.setPlaying(false);sync();}
  window.addEventListener('blur',interrupted);window.addEventListener('pagehide',interrupted);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)interrupted();});
  function syncCustomAudio(){
    if(track!=='custom'||!audio.getState||!$('local-music-status'))return;
    const state=audio.getState();
    const errors={
      'gesture-required':'浏览器暂未允许播放。点击「继续治疗」或声音按钮后再试。',
      'playback-failed':'这个音频未能播放。请换一个文件，或切回原创配乐。',
      'unsupported-or-invalid-file':'这个文件不是可播放的音频，或浏览器不支持它的格式。请换一个文件。'
    };
    const message=t(errors[state.customError]||'')||(state.customReady?t('{name} · 仅本机播放',{name:state.customName}):'');
    if(message&&$('local-music-status').textContent!==message)$('local-music-status').textContent=message;
  }
  function sync(){
    syncCustomAudio();
    if(lastScore!==game.score){lastScore=game.score;save();}
    const remaining=game.remaining;
    if(lastRemaining!==remaining){lastRemaining=remaining;$('live-status').textContent=t('第 {level} 级，剩余 {count} 只病毒，分数 {score}。',{level:game.level,count:remaining,score:game.score});}
    $('motion-preview').disabled=game.state!=='title';
    setText('stage-caption','LEVEL '+String(game.level).padStart(2,'0')+' · '+game.speed.toUpperCase());
    $('pause-button').disabled=!busy()&&game.state!=='paused';$('restart-button').disabled=game.state==='title';setText('pause-button',t(game.state==='paused'?'继续':'暂停'));
    if(lastState===game.state)return;
    lastState=game.state;audio.setPlaying(busy());
    const visible=['title','paused','levelclear','gameover','complete'].includes(game.state);$('overlay').hidden=!visible||previewTime>0;
    if(!visible)return;
    $('setup-controls').hidden=game.state!=='title';
    const info={
      title:['A LITTLE DOSE OF COLOR','今天，消灭哪一瓶？','同色连成四个，病毒就会消失。<br>留好空间，等下一颗刚刚好的胶囊。','开始治疗 ▶','ENTER 开始 · Z / X 旋转'],
      paused:['TAKE A LITTLE BREATHER','先歇一小会儿。','瓶子替你守着。准备好以后，<br>继续把颜色接起来。','继续治疗 ▶','P / ENTER 继续'],
      levelclear:['A CLEAN BILL OF HEALTH','这一瓶，清空了！',t('第 {level} 级完成 · 本局 {score} 分<br>下一瓶有 {count} 只病毒。',{level:game.level,score:game.score.toLocaleString(),count:C.virusCountForLevel(game.level+1)}),'下一关 ▶','ENTER 进入下一关'],
      gameover:['THE BOTTLE IS FULL','瓶口满了。',t('本局 {score} 分 · 最高 {best} 分<br>再试一次，给下一颗留一点空间。',{score:game.score.toLocaleString(),best:game.best.toLocaleString()}),'重新选择等级','ENTER 返回选关'],
      complete:['TWENTY-ONE LEVELS. WELL DONE.','第 20 级，治愈！',t('你清空了这一瓶的 84 只病毒。<br>本局 {score} 分 · 换个速度再挑战？',{score:game.score.toLocaleString()}),'重新选择等级','本版在 20 级结束 · 原作可继续加关']
    }[game.state];
    $('overlay-kicker').textContent=t(info[0]);$('overlay-title').textContent=t(info[1]);$('overlay-copy').innerHTML=info[2].split('<br>').map(line=>t(line)).join('<br>');$('action-button').textContent=t(info[3]);$('overlay-key').textContent=t(info[4]);
  }
  function events(){
    const ev=game.drainEvents();sync();
    for(const e of ev){
      if(e.type==='spawn')doctorFollow=.5;
      if(e.type==='match')for(const pos of game.marked){const c=game.board[pos.y]?.[pos.x];if(c?.kind==='virus')danceHit[c.color]=.72;}
      if(e.type==='clear'){audio.sfx(e.chain>1?'chain':'clear',e);if(e.chain>1)showToast(e.chain+' CHAIN'+(e.points?'  +'+e.points:''));}
      else if(e.type==='levelclear'){audio.setPlaying(false);audio.sfx('stageclear');}
      else if(e.type==='gameover'){audio.setPlaying(false);audio.sfx('gameover');}
      else if(['move','rotate','lock'].includes(e.type))audio.sfx(e.type);
    }
  }
  function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
  function text(str,x,y,size=9,color='#c3cab2',align='left'){ctx.fillStyle=color;ctx.font='bold '+size+'px ui-monospace, monospace';ctx.textAlign=align;ctx.fillText(t(str),x,y);}
  function rounded(x,y,w,h,r,fill,stroke){
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.65;ctx.stroke();}
  }
  function line(points,color,width=1){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
  function ellipse(x,y,rx,ry,fill){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();}
  function shade(x,y,h,p){const g=ctx.createLinearGradient(x,y,x+h*.25,y+h);g.addColorStop(0,p.light);g.addColorStop(.27,p.body);g.addColorStop(.7,p.body);g.addColorStop(1,p.dark);return g;}
  function virus(x,y,color,large=false){
    const p=palette[color];ctx.save();ctx.translate(x,y);if(large)ctx.scale(2,2);
    // Distinct silhouettes and faces remain readable even in a crowded bottle.
    ellipse(9,17,6,1,'#00000044');
    if(color===0){
      line([[4,6],[3,1],[6,4]],p.dark,2.1);line([[12,4],[15,1],[14,7]],p.dark,2.1);
      rounded(2.2,3.5,13.6,12,5,shade(2,3,13,p),p.dark);
    }else if(color===1){
      ctx.beginPath();ctx.moveTo(2,7);ctx.lineTo(0,4);ctx.lineTo(5,4);ctx.lineTo(7,1);ctx.lineTo(10,3);ctx.lineTo(14,1);ctx.lineTo(14,5);ctx.lineTo(18,7);ctx.lineTo(16,11);ctx.quadraticCurveTo(16,17,9,16);ctx.quadraticCurveTo(1,17,2,7);ctx.fillStyle=shade(0,1,16,p);ctx.fill();ctx.strokeStyle=p.dark;ctx.lineWidth=.65;ctx.stroke();
    }else{
      ellipse(2.5,8,2.2,3,p.body);ellipse(15.5,8,2.2,3,p.body);
      rounded(3,3,12,13,4.7,shade(3,3,13,p),p.dark);
      ellipse(5,2,1.6,1.8,p.body);ellipse(13,2,1.6,1.8,p.body);
    }
    line([[5,15],[4,17]],p.dark,2);line([[12,15],[13,17]],p.dark,2);
    ellipse(5.9,7,2.6,3.1,'#fff5df');ellipse(11.7,7,2.6,3.1,'#fff5df');
    const glance=large&&!reducedMotion?Math.sin(elapsed*.9)*.4:0;
    ellipse(6.5+glance,7.6,1.1,1.7,'#25333f');ellipse(11.1+glance,7.6,1.1,1.7,'#25333f');
    ellipse(6.8,6.8,.35,.45,'#fff');ellipse(11.4,6.8,.35,.45,'#fff');
    if(color===1){line([[3.8,4.6],[7.8,5.3]],p.dark,.9);line([[10,5.3],[13.6,4.6]],p.dark,.9);}
    if(color===2){ellipse(8.8,12.2,2.3,1.9,'#273c58');rounded(7.5,10.7,2.6,1.2,.3,'#fff4dc');}
    else{ctx.beginPath();ctx.moveTo(5.4,11);ctx.quadraticCurveTo(9,15.7,12.7,11);ctx.closePath();ctx.fillStyle='#44383e';ctx.fill();rounded(7.4,11,2.7,1.3,.3,'#fff4dc');}
    ellipse(3.3,10.6,1,.55,p.light);ellipse(14.8,10.6,1,.55,p.light);
    ctx.restore();
  }
  function pill(x,y,color,join,opacity=1){
    const p=palette[color];ctx.save();ctx.globalAlpha=opacity;
    // Half-capsules share a flush seam; detached fragments have four rounded corners.
    let bx=x+2,by=y+2,w=16,h=16,r=[7,7,7,7];
    if(join==='right'){w=18;r=[7,0,0,7];}if(join==='left'){bx=x;w=18;r=[0,7,7,0];}
    if(join==='down'){h=18;r=[7,7,0,0];}if(join==='up'){by=y;h=18;r=[0,0,7,7];}
    rounded(bx,by+.6,w,h,r,'#00000044');
    rounded(bx,by,w,h,r,shade(bx,by,h,p),p.dark);
    ctx.save();ctx.beginPath();ctx.roundRect(bx+.8,by+.8,w-1.6,h-1.6,r);ctx.clip();
    rounded(bx+2,by+1.5,w-4,3.3,2,'#ffffff3d');
    line([[bx+2.2,by+5],[bx+2.2,by+8]],'#ffffff55',1.1);
    line([[bx+4,by+h-2],[bx+w-4,by+h-2]],'#ffffff25',.7);
    ctx.restore();
    if(join==='right')line([[x+19.5,y+3.8],[x+19.5,y+16.2]],'#20303b66',.6);
    if(join==='down')line([[x+3.8,y+19.5],[x+16.2,y+19.5]],'#20303b66',.6);
    ctx.restore();
  }
  function partnerDirection(x,y,cell){
    if(cell.link==null)return null;
    for(const [dx,dy,name]of [[1,0,'right'],[-1,0,'left'],[0,-1,'up'],[0,1,'down']])if(game.board[y+dy]?.[x+dx]?.link===cell.link)return name;
    return null;
  }
  function delivery(){
    if(previewTime>0&&game.state==='title'){const phase=(2.4-previewTime)%1.2;return {progress:Math.min(1,phase/.9),colors:game.next,initial:false,preview:true};}
    const state=game.state==='paused'?game.previousState:game.state;
    if(state==='spawnWait')return {progress:Math.max(0,Math.min(1,1-game.timer/TOSS_TIME)),colors:game.next,initial:false};
    const c=game.active;
    if(openingToss>0&&state==='playing'&&c&&c.x===3&&c.y===0&&c.orientation===0)return {progress:1-openingToss/TOSS_TIME,colors:c.colors,initial:true};
    return null;
  }
  function doctor(toss){
    // White coat, dark moustache, round nose and head mirror: readable at rail scale.
    ctx.save();ctx.translate(188,12);
    const p=toss&&!reducedMotion?toss.progress:0;
    const lift=reducedMotion?0:toss?(p<.24?p/.24:Math.max(0,1-(p-.24)/.76)):doctorFollow>0?doctorFollow/.5*.65:.10+.10*Math.sin(danceTime*2.5*Math.PI*2);
    const idle=reducedMotion?0:Math.sin(danceTime*2.5*Math.PI)*.8;
    const bg=ctx.createLinearGradient(0,0,48,66);bg.addColorStop(0,'#3b5052');bg.addColorStop(1,'#1c3036');
    rounded(0,0,48,66,8,bg,'#7e9a8566');ellipse(24,62,18,2,'#0b192b66');
    // Body leans into the throw without moving the origin of gameplay.
    ctx.save();ctx.translate(24,54+idle);ctx.rotate(-lift*.16);ctx.translate(-24,-54);
    rounded(11,37,27,23,[8,8,4,4],'#e9eee0','#a5b8ac');rounded(22,38,7,22,2,'#b14f45');
    line([[20,39],[16,45],[23,51]],'#fffde9',2.8);line([[29,39],[33,44],[27,51]],'#fffde9',2.8);
    rounded(10,58,12,5,2,'#6c5147');rounded(29,58,12,5,2,'#6c5147');
    ellipse(24,27,11,12,'#e8ae83');ellipse(13.5,28,2,3,'#dfa078');ellipse(34,28,2,3,'#dfa078');
    rounded(13,14,22,9,5,'#674239');rounded(13,11,23,9,3,'#f4f1d8','#baccc0');
    rounded(17,7,17,9,[5,5,2,2],'#f4f1d8','#baccc0');
    ellipse(23,16,4.6,4.6,'#557d85');ellipse(23,16,3.3,3.3,'#c4ded6');ellipse(22,15,1.1,1.1,'#fffbe3');
    ellipse(20,26,1.4,2,'#273642');ellipse(29,26,1.4,2,'#273642');
    line([[17.4,22],[21,21.7]],'#5c3b30',1);line([[27,21.7],[30.5,22]],'#5c3b30',1);
    // The moustache and round nose distinguish the doctor from a generic clinic icon.
    ellipse(21,32.5,4,2.1,'#55352e');ellipse(27,32.5,4,2.1,'#55352e');ellipse(24,29.5,4,3.1,'#f2bd93');
    line([[21,36],[25,36.5],[28,35]],'#9d6551',.8);
    line([[33,42],[39,49],[34,53]],'#e4eddf',6);ellipse(34,53,3,3,'#faf6e6');
    // Left arm winds up and extends towards the bottle.
    const hx=10-lift*7,hy=40-lift*21;
    line([[15,43],[10,45-lift*7],[hx,hy]],'#a2b7aa',7);
    line([[15,42],[10,44-lift*7],[hx,hy]],'#f1f2df',5);
    ellipse(hx,hy,3.6,3.1,'#fff9e9');
    if(!toss||toss.progress<.24||reducedMotion){
      const colors=toss?toss.colors:game.next;
      ctx.save();ctx.translate(hx-8,hy-8);ctx.scale(.43,.43);pill(0,0,colors[0],'right');pill(20,0,colors[1],'left');ctx.restore();
    }
    line([[32,44],[30,51],[34,54]],'#52797a',1);ellipse(34,54,1.7,1.7,'#9bbfba');
    ctx.restore();ctx.restore();
  }
  function renderDelivery(toss){
    if(!toss||reducedMotion)return;
    const p=toss.progress;
    // Release after the wind-up, arc above the rim, then settle into row zero.
    if(p<.24||p>=1)return;
    const t=(p-.24)/.76,u=1-t;
    const x=u*u*193+2*u*t*145+t*t*92;
    const y=u*u*33+2*u*t*4+t*t*34;
    const scale=.43+.57*t;
    ctx.save();ctx.translate(x,y);ctx.rotate(-Math.sin(Math.PI*t)*.65);ctx.scale(scale,scale);
    pill(-20,-10,toss.colors[0],'right');pill(0,-10,toss.colors[1],'left');ctx.restore();
  }
  function bottle(){
    const rim=ctx.createLinearGradient(4,0,178,0);rim.addColorStop(0,'#658a86');rim.addColorStop(.08,'#c7e0ce');rim.addColorStop(.35,'#6b9791');rim.addColorStop(.8,'#8db2a0');rim.addColorStop(1,'#486d70');
    ctx.beginPath();ctx.moveTo(54,4);ctx.lineTo(130,4);ctx.lineTo(130,13);ctx.quadraticCurveTo(130,20,144,20);ctx.lineTo(167,20);ctx.quadraticCurveTo(178,20,178,31);ctx.lineTo(178,337);ctx.quadraticCurveTo(178,349,166,349);ctx.lineTo(18,349);ctx.quadraticCurveTo(6,349,6,337);ctx.lineTo(6,31);ctx.quadraticCurveTo(6,20,17,20);ctx.lineTo(40,20);ctx.quadraticCurveTo(54,20,54,13);ctx.closePath();ctx.fillStyle=rim;ctx.fill();
    rounded(57,6,70,16,[2,2,0,0],'#132830');
    line([[59,8],[125,8]],'#b7d2b899',.8);
    rect(field.x,field.y,160,320,'#101b23');
    const inside=ctx.createLinearGradient(12,24,172,344);inside.addColorStop(0,'#162932');inside.addColorStop(.5,'#101e2a');inside.addColorStop(1,'#14252d');rect(12,24,160,320,inside);
    // Quiet lattice, no visual noise around occupied cells.
    ctx.beginPath();for(let x=1;x<8;x++){ctx.moveTo(12+x*20,24);ctx.lineTo(12+x*20,344);}for(let y=1;y<16;y++){ctx.moveTo(12,24+y*20);ctx.lineTo(172,24+y*20);}ctx.strokeStyle='#8ca8aa0b';ctx.lineWidth=.5;ctx.stroke();
    line([[8.5,35],[8.5,333]],'#d8f0dc88',.8);line([[175,33],[175,333]],'#d5ead92e',.65);
    line([[19,346],[164,346]],'#d0e3c866',1);line([[16,25.5],[51,25.5]],'#ffffff12',.8);
    rounded(51,2,82,5,2,rim,'#bdd6bc77');
  }
  function render(){
    if(renderSizeDirty){
      const bounds=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
      const desired=Math.min(4,Math.max(1,Math.ceil((bounds.width/248)*dpr)));
      if(desired!==renderScale){renderScale=desired;canvas.width=248*renderScale;canvas.height=352*renderScale;}
      const width=danceCanvas?.getBoundingClientRect().width||160;
      danceScale=Math.min(4,Math.max(1,Math.ceil(width/160*dpr)));renderSizeDirty=false;
    }
    ctx.setTransform(renderScale,0,0,renderScale,0,0);ctx.imageSmoothingEnabled=true;
    const bg=ctx.createLinearGradient(0,0,248,352);bg.addColorStop(0,'#25383c');bg.addColorStop(.5,'#1b2b34');bg.addColorStop(1,'#15252e');
    rect(0,0,248,352,bg);
    // Right rail has small engraved separators, leaving the whole bottle full height.
    rounded(183,10,57,334,6,'#13232a99','#8ca79b22');
    const toss=delivery();doctor(toss);
    line([[190,85],[233,85]],'#91ab9122',.65);
    text('SCORE',190,98,7,'#91aba3');text(String(game.score).padStart(7,'0'),190,112,10,'#f3dfa7');
    text('BEST',190,130,7,'#91aba3');text(String(game.best).padStart(7,'0'),190,144,9,'#d3d5b6');
    text('LEVEL',190,166,7,'#91aba3');text(String(game.level).padStart(2,'0'),190,188,20,'#efd38c');
    text('VIRUS',190,210,7,'#91aba3');text(String(game.remaining).padStart(2,'0'),190,233,22,'#d5e7ca');
    rounded(189,241,45,14,4,'#405d5533');text(game.speed.toUpperCase()+' SPEED',211.5,250.5,6.4,'#b3cfbc','center');
    text('NEXT',211,278,7,'#91aba3','center');
    rounded(188,285,46,28,6,'#0f2029','#6c999066');
    // During delivery this remains the capsule being delivered, until core spawn advances it.
    pill(191,290,game.next[0],'right');pill(211,290,game.next[1],'left');
    const counts=[0,0,0];game.board.flat().forEach(c=>{if(c?.kind==='virus')counts[c.color]++;});
    [0,1,2].forEach((c,i)=>{rounded(190+i*17,322,11,3,1.5,palette[c].body);text(String(counts[c]).padStart(2,'0'),190+i*17,338,8,'#c1d4bc');});
    if(!bottleLayer||bottleLayerScale!==renderScale){
      bottleLayer=layer(180,352,renderScale);bottleLayerScale=renderScale;
      const front=ctx;ctx=bottleLayer.getContext('2d');ctx.setTransform(renderScale,0,0,renderScale,0,0);bottle();ctx=front;
    }
    ctx.drawImage(bottleLayer,0,0,180,352);
    // Settled cells have no per-frame motion. Rebuild only after a board change.
    const boardKey=renderScale+':'+game.board.map(row=>row.map(c=>c?c.kind+','+c.color+','+c.link:'').join(';')).join('|');
    if(!boardLayer||boardLayerKey!==boardKey){
      boardLayer=layer(160,320,renderScale);boardLayerKey=boardKey;
      const front=ctx;ctx=boardLayer.getContext('2d');ctx.setTransform(renderScale,0,0,renderScale,0,0);ctx.lineCap='round';ctx.lineJoin='round';
      for(let y=0;y<16;y++)for(let x=0;x<8;x++){
        const cell=game.board[y][x];if(!cell)continue;
        if(cell.kind==='virus')virus(x*20+1,y*20+1,cell.color);else pill(x*20,y*20,cell.color,partnerDirection(x,y,cell));
      }
      ctx=front;
    }
    ctx.drawImage(boardLayer,field.x,field.y,160,320);
    ctx.save();ctx.beginPath();ctx.rect(field.x,field.y-20,160,340);ctx.clip();
    const marked=new Set(game.marked.map(p=>p.y*8+p.x));
    for(let y=0;y<16;y++)for(let x=0;x<8;x++){
      const cell=game.board[y][x];if(!cell)continue;const px=field.x+x*20,py=field.y+y*20;
      if(marked.has(y*8+x)){
        // A single local glint replaces the harsh alternating white square.
        const progress=Math.max(0,Math.min(1,1-game.timer/.30));
        ctx.save();ctx.globalAlpha=reducedMotion ? .42 : .35+Math.sin(progress*Math.PI)*.45;
        rounded(px+1.5,py+1.5,17,17,5,'#fff2be22','#fff5c4');
        line([[px+6,py+10],[px+14,py+10]],'#fff9da',1.2);
        line([[px+10,py+6],[px+10,py+14]],'#fff9da',1.2);ctx.restore();
      }
    }
    if(game.active&&!(toss?.initial&&!reducedMotion)){const cells=C.capsuleCells(game.active);cells.forEach((c,i)=>{const other=cells[1-i];const join=other.x>c.x?'right':other.x<c.x?'left':other.y>c.y?'down':'up';pill(field.x+c.x*20,field.y+c.y*20,c.color,join);});}
    ctx.restore();
    renderDelivery(toss);
    canvas.dataset.delivery=toss?(toss.preview?'preview':toss.initial?'opening':'waiting'):'idle';
    canvas.dataset.doctorPhase=reducedMotion?'0':danceTime.toFixed(3);
    canvas.dataset.deliveryPhase=toss?toss.progress.toFixed(3):'1';
    canvas.dataset.deliveryColors=toss?toss.colors.join(''):'';
  }
  function renderDance(){
    if(!danceCtx)return;
    const old=ctx;ctx=danceCtx;
    const scale=danceScale;
    if(danceCanvas.width!==160*scale){danceCanvas.width=160*scale;danceCanvas.height=160*scale;}
    ctx.setTransform(scale,0,0,scale,0,0);ctx.clearRect(0,0,160,160);
    const rim=ctx.createLinearGradient(5,5,140,145);rim.addColorStop(0,'#e3edcf');rim.addColorStop(.45,'#6f9e9c');rim.addColorStop(1,'#36575e');
    ctx.save();ctx.translate(28,128);ctx.rotate(.7);rounded(-7,-3,14,36,5,'#77948a','#c3d4b5');rounded(-4,1,3,26,2,'#c6d3bd77');ctx.restore();
    ellipse(80,77,68,68,'#10252d');ellipse(80,75,66,66,rim);
    const lens=ctx.createRadialGradient(60,40,5,80,75,62);lens.addColorStop(0,'#507fba');lens.addColorStop(1,'#2f507d');ellipse(80,75,60,60,lens);
    ctx.save();ctx.beginPath();ctx.ellipse(80,75,59,59,0,0,Math.PI*2);ctx.clip();
    line([[26,98],[134,98]],'#b9d5db18',1);
    const counts=[0,0,0];game.board.flat().forEach(c=>{if(c?.kind==='virus')counts[c.color]++;});
    danceCounts=game.state==='title'?[1,1,1]:counts;
    const beat=danceTime*2.5*Math.PI*2;
    // Original-inspired counterclockwise orbit: one turn per four 150-BPM bars.
    // Slots belong to colors, not survivors: eliminating one never moves the others.
    const orbit=reducedMotion?0:danceTime*Math.PI*2/6.4;
    for(const [color,slot,phase] of [[1,0,0],[2,1,2.1],[0,2,4.2]]){
      const angle=-Math.PI/2-slot*Math.PI*2/3-orbit;
      const cx=80+Math.cos(angle)*29,cy=75+Math.sin(angle)*29;
      if(!danceCounts[color])continue;
      const reaction=danceHit[color]>0;
      const wave=reducedMotion?0:Math.sin(beat+phase);
      const hop=reducedMotion?0:Math.max(0,Math.sin(beat+phase))*6;
      const tilt=reducedMotion?0:wave*.22;
      ellipse(cx,cy+17,15,2.8,'#142d5355');
      ctx.save();ctx.translate(cx,cy-hop);ctx.rotate(tilt);
      const squash=reducedMotion?1:1+Math.sin(beat+phase)*.035;
      ctx.scale(1.8*squash,1.8/squash);
      const p=palette[color],arm=reducedMotion?0:wave*2.4;
      line([[-7,0],[-12,-2-arm],[-13,-5-arm]],p.dark,1.8);
      line([[7,0],[12,-2+arm],[13,-5+arm]],p.dark,1.8);
      ellipse(-13,-5-arm,1.5,1.5,p.light);ellipse(13,-5+arm,1.5,1.5,p.light);
      // Long alternating steps sit outside the compact in-board sprite.
      line([[-3,5],[-5+wave*2,10],[-8+wave*2,10]],p.dark,2.4);
      line([[3,5],[5-wave*2,10],[8-wave*2,10]],p.dark,2.4);
      ctx.save();if(reaction&&!reducedMotion)ctx.rotate(Math.sin(danceTime*32)*.16);virus(-9,-9,color);ctx.restore();
      if(reaction){line([[-5,-12],[-3,-14]],'#fff1a8',1);line([[5,-12],[7,-14]],'#fff1a8',1);}
      ctx.restore();
    }
    if(!danceCounts.some(Boolean)){line([[57,74],[72,89],[101,58]],'#d9edb5',5);}
    ctx.restore();
    line([[40,30],[48,25],[58,22]],'#eef9e77a',2);ellipse(80,75,60,60,'#ffffff03');
    const description=game.state==='title'?t('三色病毒在放大镜中跳舞'):t('病毒舞蹈：黄 {yellow}，红 {red}，蓝 {blue}',{yellow:counts[0],red:counts[1],blue:counts[2]});
    if(danceCanvas.getAttribute('aria-label')!==description)danceCanvas.setAttribute('aria-label',description);
    danceCanvas.dataset.colors=danceCounts.map(n=>n>0?'1':'0').join('');
    danceCanvas.dataset.phase=danceTime.toFixed(3);
    danceCanvas.dataset.orbitPhase=(orbit%(Math.PI*2)).toFixed(4);
    ctx=old;
  }
  function frame(timestamp){
    const dt=lastTime?Math.min((timestamp-lastTime)/1000,0.25):0;lastTime=timestamp;elapsed+=dt;accumulator+=dt;
    while(accumulator>=1/60){
      for(const action of input.step(1/60)){
        if(action==='left')game.move(-1);else if(action==='right')game.move(1);else if(action==='cw')game.rotate(1);else if(action==='ccw')game.rotate(-1);else if(action==='down'){if(game.down())audio.sfx('drop');}
      }
      if(busy()&&doctorFollow>0)doctorFollow=Math.max(0,doctorFollow-1/60);
      if(previewTime>0){previewTime=Math.max(0,previewTime-1/60);if(previewTime===0){lastState='';sync();}}
      if(busy()&&openingToss>0)openingToss=Math.max(0,openingToss-1/60);
      game.update(1/60,input.softDrop);
      if(openingToss>0&&(!game.active||game.active.x!==3||game.active.y!==0||game.active.orientation!==0))openingToss=0;
      accumulator-=1/60;events();
    }
    if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').hidden=true;}
    if(game.state==='title'||busy()){danceTime+=dt;danceHit=danceHit.map(t=>Math.max(0,t-dt));}
    render();renderDance();requestAnimationFrame(frame);
  }
  window.addEventListener('arcade-language-change',()=>{lastState='';lastRemaining=-1;refreshMotion();refreshSound();levelDetail();for(const o of $('level-select').querySelectorAll('option')){const n=+o.value;o.textContent=t('{n} · {count} 只',{n:String(n).padStart(2,'0'),count:C.virusCountForLevel(n)});}sync();render();renderDance();});
  refreshTouchLayout();refreshSound();refreshMotion();sync();render();renderDance();requestAnimationFrame(frame);
})();

// The first scene and controls are now initialized.
window.ArcadeGameLoader?.ready();
