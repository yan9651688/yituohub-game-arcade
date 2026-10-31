/* Local recorded BGM. Independent from game state and save schemas. */
(function(root){'use strict';
function create(options){
 if(root.GameMusicController)return root.GameMusicController;
 const audio=new Audio(options.src),doc=document,button=doc.getElementById('music-toggle'),slider=doc.getElementById('music-volume'),status=doc.getElementById('music-status');
 let muted=false,volume=.24,unlocked=false,pending=false,blocked=false,disposed=false;
 const listeners=[];
 try{const saved=JSON.parse(localStorage.getItem(options.key));if(saved&&typeof saved==='object'){muted=saved.muted===true;if(typeof saved.volume==='number'&&Number.isFinite(saved.volume))volume=Math.min(1,Math.max(0,saved.volume));}}catch(_){}
 audio.loop=true;audio.preload='none';audio.volume=volume;audio.muted=muted;
 function wanted(){return !disposed&&unlocked&&!muted&&volume>0&&!doc.hidden&&options.active();}
 function clock(t){if(!Number.isFinite(t)||t<0)return '—:—';return Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');}
 function put(node,value){if(root.GameI18n?.setText){root.GameI18n.setText(node,value);return;}if(node.textContent!==value)node.textContent=value;}
 function label(){put(button,muted?'开启音乐':'静音');button.setAttribute('aria-pressed',String(muted));slider.value=String(Math.round(volume*100));put(status,blocked?'点击音乐按钮重试；游戏可继续':!unlocked?'开始游戏后播放':muted||volume===0?'音乐已静音':pending&&wanted()?'音乐准备中…':!audio.paused&&wanted()?'正在播放 · '+clock(audio.currentTime)+' / '+clock(audio.duration)+' · 循环':'音乐已暂停 · '+clock(audio.currentTime)+' / '+clock(audio.duration));}
 function persist(){try{localStorage.setItem(options.key,JSON.stringify({muted,volume}));}catch(_){} }
 function sync(){if(disposed)return;if(!wanted()){if(!audio.paused||pending)audio.pause();label();return;}if(!audio.paused||pending||blocked)return;pending=true;label();let p;try{p=audio.play();}catch(_){pending=false;blocked=true;label();return;}Promise.resolve(p).then(()=>{pending=false;if(!wanted())audio.pause();label();},()=>{pending=false;blocked=true;label();});}
 function gesture(e){if(e&&e.isTrusted===false)return;if(e&&e.type==='keydown'&&(e.repeat||e.ctrlKey||e.metaKey||e.altKey))return;unlocked=true;blocked=false;sync();}
 function listen(target,type,fn){target.addEventListener(type,fn);listeners.push([target,type,fn]);}
 listen(button,'click',()=>{if(blocked){muted=false;blocked=false;}else muted=!muted;audio.muted=muted;persist();label();});
 listen(slider,'input',()=>{volume=Math.min(1,Math.max(0,Number(slider.value)/100||0));audio.volume=volume;persist();sync();label();});
 listen(doc,'click',gesture);listen(doc,'keydown',gesture);listen(doc,'visibilitychange',sync);
 listen(root,'pagehide',()=>{audio.pause();});listen(root,'pageshow',sync);
 for(const event of ['timeupdate','loadedmetadata','playing','pause'])listen(audio,event,label);
 listen(audio,'error',()=>{blocked=true;pending=false;audio.pause();label();});
 const controller=Object.freeze({sync,snapshot:()=>({muted,volume,unlocked,blocked,paused:audio.paused,currentTime:audio.currentTime,duration:Number.isFinite(audio.duration)?audio.duration:null,loop:audio.loop,src:options.src}),dispose:()=>{disposed=true;audio.pause();for(const [target,type,fn]of listeners)target.removeEventListener(type,fn);if(root.GameMusicController===controller)delete root.GameMusicController;}});
 root.GameMusicController=controller;label();return controller;
}
root.createGameMusic=create;
})(window);
