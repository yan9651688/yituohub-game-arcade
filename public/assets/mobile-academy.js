/* Touch controls use the player's own input set and combat methods. */
(() => {
  const enabled = matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints > 0 && innerWidth < 1100);
  window.academyTouch = enabled;
  if (!enabled) return;
  document.documentElement.classList.add('academy-touch');
  window.mountAcademyMobile = api => {
    const root = document.createElement('div'); root.id = 'academy-mobile';
    root.innerHTML = `<div id="am-look" aria-label="拖动调整视角"></div><div id="am-stick" aria-label="移动摇杆"><i></i><span>移动</span></div>
      <div class="am-top"><button data-tap="KeyM">地图</button><button data-tap="KeyP">手机</button><button id="am-more">更多</button><button id="am-pause">暂停</button><button id="am-close" data-tap="Escape">关闭</button></div>
      <div class="am-actions"><button data-hold="Space">上升</button><button data-hold="KeyC">下降</button><button data-hold="KeyE">加速</button><button data-tap="KeyQ">瞬移</button><button data-tap="KeyF" class="am-interact">互动</button><button id="am-fire">攻击</button></div>
      <div id="am-extra" hidden><button data-tap="ShiftLeft">闪避</button><button data-tap="KeyX">闪击</button><button data-tap="KeyR">裂隙</button><button id="am-grab">抓取 / 投掷</button><button data-tap="KeyV">折叠场</button><button data-tap="KeyB">暴走 / 电极</button><button data-tap="Digit1">能力</button><button data-tap="Digit2">战术刀</button><button data-tap="Digit3">手枪</button><button data-tap="KeyG">赠礼</button><button data-tap="KeyT">时间</button><button data-tap="KeyY">天气</button></div>
      <div id="am-menu" hidden><div><h2>已暂停</h2><p>左侧摇杆移动，右侧空白处滑动转向。<br>按住上升 / 下降控制高度，靠近人物或门口点互动。<br>更多中可使用战斗技能与切换武器。</p><button id="am-resume">继续游戏</button></div></div>`;
    document.body.append(root); document.body.classList.add('academy-playing');
    const $ = id => document.getElementById(id), active = new Map(); let stickId=null, lookId=null, last=null;
    const key = (code, down) => { down ? api.player.keys.add(code) : api.player.keys.delete(code); window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code,key:code==='Space'?' ':code.replace('Key','').toLowerCase(),bubbles:true,cancelable:true})); };
    const tap = code => {key(code,true);key(code,false);};
    const release = () => { for (const code of active.values()) key(code,false); active.clear(); for(const c of ['KeyW','KeyA','KeyS','KeyD','Space','KeyC','KeyE'])key(c,false); stickId=lookId=null;last=null; $('am-stick').querySelector('i').style.transform='';api.release(); };
    const pause = value => {release();window.academyMobilePaused=value;$('am-menu').hidden=!value;$('am-extra').hidden=true;};
    const bindTap=(button,action)=>{button.onpointerdown=e=>{e.preventDefault();action();};button.onclick=e=>{if(e.detail===0)action();};};
    bindTap($('am-pause'),()=>pause(true));bindTap($('am-resume'),()=>pause(false));
    bindTap($('am-more'),()=>{$('am-extra').hidden=!$('am-extra').hidden;release();});
    root.querySelectorAll('[data-tap]').forEach(b=>bindTap(b,()=>{if(['KeyM','KeyP','Escape'].includes(b.dataset.tap))release();tap(b.dataset.tap);}));
    root.querySelectorAll('[data-hold]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);active.set(e.pointerId,b.dataset.hold);key(b.dataset.hold,true);};const up=e=>{const c=active.get(e.pointerId);active.delete(e.pointerId);if(c&&![...active.values()].includes(c))key(c,false);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=up;});
    const stick=$('am-stick');const move=e=>{const r=stick.getBoundingClientRect(),dx=(e.clientX-r.left-r.width/2)/38,dy=(e.clientY-r.top-r.height/2)/38,n=Math.max(1,Math.hypot(dx,dy)),x=dx/n,y=dy/n;for(const[c,on]of [['KeyA',x<-.22],['KeyD',x>.22],['KeyW',y<-.22],['KeyS',y>.22]])on?api.player.keys.add(c):api.player.keys.delete(c);stick.querySelector('i').style.transform=`translate(${x*32}px,${y*32}px)`;};
    stick.onpointerdown=e=>{if(stickId!==null)return;e.preventDefault();stickId=e.pointerId;stick.setPointerCapture(e.pointerId);move(e);};stick.onpointermove=e=>{if(e.pointerId===stickId)move(e);};const stop=e=>{if(e.pointerId!==stickId)return;stickId=null;for(const c of ['KeyW','KeyA','KeyS','KeyD'])api.player.keys.delete(c);stick.querySelector('i').style.transform='';};stick.onpointerup=stick.onpointercancel=stick.onlostpointercapture=stop;
    const look=$('am-look');look.onpointerdown=e=>{if(lookId!==null)return;e.preventDefault();lookId=e.pointerId;last=[e.clientX,e.clientY];look.setPointerCapture(e.pointerId);};look.onpointermove=e=>{if(e.pointerId!==lookId||!last)return;api.look(e.clientX-last[0],e.clientY-last[1]);last=[e.clientX,e.clientY];};look.onpointerup=look.onpointercancel=look.onlostpointercapture=e=>{if(e.pointerId===lookId){lookId=null;last=null;}};
    $('am-fire').onpointerdown=e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);api.attack();};$('am-fire').onpointerup=$('am-fire').onpointercancel=$('am-fire').onlostpointercapture=()=>api.release();
    $('am-grab').onpointerdown=e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);api.grab();};$('am-grab').onpointerup=$('am-grab').onpointercancel=$('am-grab').onlostpointercapture=()=>api.release();
    addEventListener('blur',()=>pause(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true);});addEventListener('resize',release);addEventListener('orientationchange',release);
    let blocked=false;setInterval(()=>{const v=api.blocked();document.body.classList.toggle('academy-panel-open',v);document.body.classList.toggle('academy-dialog-open',api.dialog());if(v&&!blocked)release();blocked=v;},120);
    window.AcademyMobile={snapshot:()=>({pos:api.player.state.pos.toArray(),yaw:api.player.state.yaw,pitch:api.player.state.pitch,energy:api.player.state.energy,keys:[...api.player.keys],paused:!!window.academyMobilePaused,cds:{...api.combat.debug.cds},flying:api.player.state.flying})};
  };
})();
