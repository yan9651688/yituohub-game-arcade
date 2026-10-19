/* Installed from registerInput, alongside the game's native action functions. */
window.installFrontierTouch = function () {
  if (!touchMode) return;
  const root=$('touchControls');
  root.insertAdjacentHTML('beforeend',`<div id="touchActions"><button id="touchAim">瞄准</button><button id="touchReload">换弹</button><button id="touchSprint">疾跑</button><button id="touchSwap">切枪</button><button id="touchEquip">配装</button><button id="touchMap">地图</button></div><div id="touchTips">左侧移动 · 右侧转向 · 长按战甲选机型</div>`);
  let joyId=null,lookId=null,lookAt=null,timer=null,longPress=false,mechId=null;const held=new Map(),joy=$('joystick'),handle=joy.querySelector('i'),look=$('touchLook');
  const release=()=>{joyId=lookId=null;lookAt=null;clearTimeout(timer);mechId=null;touchMove=[0,0];handle.style.transform='';held.clear();keys.ShiftLeft=false;cancelCharge();releaseAim();exitScope(player);$('touchAim').classList.remove('on');};
  window.mobileFrontierRelease=release;
  const move=e=>{const b=joy.getBoundingClientRect(),x=(e.clientX-b.left-b.width/2)/38,y=(e.clientY-b.top-b.height/2)/38,n=Math.max(1,Math.hypot(x,y));touchMove=[x/n,y/n];handle.style.transform=`translate(${x/n*28}px,${y/n*28}px)`;};
  joy.onpointerdown=e=>{if(state!=='playing'||joyId!==null)return;e.preventDefault();joyId=e.pointerId;joy.setPointerCapture(e.pointerId);move(e);};joy.onpointermove=e=>{if(e.pointerId===joyId)move(e);};const joyUp=e=>{if(e.pointerId!==joyId)return;joyId=null;touchMove=[0,0];handle.style.transform='';};joy.onpointerup=joy.onpointercancel=joy.onlostpointercapture=joyUp;
  look.onpointerdown=e=>{if(state!=='playing'||lookId!==null)return;e.preventDefault();lookId=e.pointerId;lookAt=[e.clientX,e.clientY];look.setPointerCapture(e.pointerId);};look.onpointermove=e=>{if(e.pointerId!==lookId||!lookAt||state!=='playing')return;const zoom=ads?.45:1;yaw+=(e.clientX-lookAt[0])*.006*sensitivity*zoom;pitch=clamp(pitch-(e.clientY-lookAt[1])*.005*sensitivity*zoom,-.95,1.05);lookAt=[e.clientX,e.clientY];};look.onpointerup=look.onpointercancel=look.onlostpointercapture=e=>{if(e.pointerId===lookId){lookId=null;lookAt=null;}};
  const hold=(id,down,up,cancel=up)=>{const b=$(id);b.onpointerdown=e=>{if(state!=='playing')return;e.preventDefault();b.setPointerCapture(e.pointerId);const already=[...held.values()].includes(id);held.set(e.pointerId,id);ensureAudio();if(!already)down();};const end=e=>{if(held.get(e.pointerId)!==id)return;held.delete(e.pointerId);if(![...held.values()].includes(id))(e.type==='pointerup'?up:cancel)();};b.onpointerup=b.onpointercancel=b.onlostpointercapture=end;};
  hold('touchFire',beginFire,endFire,cancelCharge);
  hold('touchAim',()=>{pressAim();$('touchAim').classList.add('on');},()=>{releaseAim();exitScope(player);$('touchAim').classList.remove('on');});
  hold('touchSprint',()=>keys.ShiftLeft=true,()=>keys.ShiftLeft=false);
  const bindTap=(button,fn)=>{button.onpointerdown=e=>{e.preventDefault();fn();};button.onclick=e=>{if(e.detail===0)fn();};};
  bindTap($('touchJump'),()=>action(' '));bindTap($('touchReload'),()=>action('r'));bindTap($('touchSwap'),()=>{if(state==='playing')switchWeapon(player.loadout[1-(player.activeSlot||0)]);});
  // Open overlays after the gesture ends, so its synthetic click cannot hit a
  // newly exposed map destination or equipment choice under the same finger.
  const bindOverlay=(button,fn)=>{button.onpointerdown=e=>e.stopPropagation();button.onclick=e=>{e.preventDefault();fn();};};
  bindOverlay($('touchEquip'),()=>{release();openWheel('weapon');});bindOverlay($('touchMap'),()=>{release();openTactical();});
  for(const id of ['skillQ','skillE','slot1','slot2','armoryButton','frameButton','mapButton','resume','restart','backMenu','fullScreen']){const b=$(id),fn=b.onclick;if(fn)bindTap(b,()=>fn.call(b));}
  document.querySelectorAll('.settings-open').forEach(b=>bindTap(b,openSettings));
  // Hold the existing mech skill to select the next frame; a tap still summons it.
  const mech=$('skillF');mech.onpointerdown=e=>{if(mechId!==null)return;e.preventDefault();mechId=e.pointerId;mech.setPointerCapture(e.pointerId);longPress=false;timer=setTimeout(()=>{longPress=true;release();openWheel('mech');},500);};mech.onpointerup=e=>{if(e.pointerId!==mechId)return;clearTimeout(timer);mechId=null;if(!longPress)action('f');};mech.onpointercancel=mech.onlostpointercapture=e=>{if(e.pointerId===mechId){clearTimeout(timer);mechId=null;}};mech.onclick=e=>{if(e.detail===0)action('f');};mech.title='轻点召唤战甲，长按选择战甲';
  addEventListener('blur',release);document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});addEventListener('resize',release);addEventListener('orientationchange',release);
  window.FrontierMobile={snapshot:()=>({touchMove:[...touchMove],yaw,pitch,firing,ads,keys:{...keys},state})};
};
