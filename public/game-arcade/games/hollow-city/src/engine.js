(function(root){
'use strict';
const THRESHOLDS=[0,16,50,115,220,390], RADII=[15,23,35,51,74,104];
// Zen grows in area, not exponentially in radius. Physical catalog tiers remain
// unchanged; additional display levels mark each 30 units of radius expansion.
const ZEN_AREA_PER_XP=24, ZEN_RADIUS_STEP=30;
function zenRadius(xp){const extra=Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,Number.isFinite(xp)?xp:Number.MAX_SAFE_INTEGER)-THRESHOLDS[5]);return Math.sqrt(RADII[5]*RADII[5]+extra*ZEN_AREA_PER_XP);}
function zenThreshold(level){if(level<=6)return THRESHOLDS[Math.max(0,level-1)];const r=RADII[5]+(level-6)*ZEN_RADIUS_STEP;return Math.ceil(THRESHOLDS[5]+(r*r-RADII[5]*RADII[5])/ZEN_AREA_PER_XP);}
function displayLevel(s){if(s.mode!=='zen'||s.tier<5)return s.tier+1;return 6+Math.floor(Math.max(0,zenRadius(s.xp)-RADII[5])/ZEN_RADIUS_STEP);}
function nextThreshold(s){if(s.tier<5)return THRESHOLDS[s.tier+1];return s.mode==='zen'?zenThreshold(displayLevel(s)+1):null;}
function movementSpeed(s){const base=105+s.tier*10;if(s.mode!=='zen'||s.tier<5)return base;return base+155*(1-104/Math.max(104,s.radius));}
function create(level,mode){return {level,mode:mode||'campaign',x:level.spawn.x,y:level.spawn.y,xp:0,tier:0,radius:15,time:level.time||180,elapsed:0,status:'playing',objects:level.objects.map(o=>({...o,state:'live',sink:0})),swallows:[],particles:[],targets:0,eaten:0,combo:0,lastEat:-99,events:[],totalTargets:level.objects.filter(o=>o.target).length};}
function animate(s,dt){for(const o of s.swallows){o.sink+=dt/(o.height>45?.85:.55);if(o.sink>=1)o.state='gone';}s.swallows=s.swallows.filter(o=>o.state!=='gone');}
function tick(s,dt,input){dt=Math.max(0,Math.min(.05,dt||0));animate(s,dt);if(s.status!=='playing')return;s.elapsed+=dt;if(s.mode==='campaign')s.time=Math.max(0,s.time-dt);let ix=Number.isFinite(input?.x)?input.x:0,iy=Number.isFinite(input?.y)?input.y:0;let mag=Math.hypot(ix,iy);if(mag>1){ix/=mag;iy/=mag;}let speed=movementSpeed(s);s.x=Math.max(8,Math.min(s.level.bounds.w-8,s.x+ix*speed*dt));s.y=Math.max(8,Math.min(s.level.bounds.h-8,s.y+iy*speed*dt));
for(const o of s.objects){if(o.state!=='live'||o.tier>s.tier||o.radius>s.radius)continue;if(Math.hypot(o.x-s.x,o.y-s.y)<s.radius*.88){const previousLevel=displayLevel(s);o.state='sinking';o.sink=0;o.swallowX=s.x;o.swallowY=s.y;s.swallows.push(o);s.xp=s.mode==='zen'?Math.min(Number.MAX_SAFE_INTEGER,s.xp+o.value):s.xp+o.value;s.eaten++;if(o.target)s.targets++;s.combo=s.elapsed-s.lastEat<1.7?s.combo+1:1;s.lastEat=s.elapsed;s.events.push({type:'eat',o,combo:s.combo});while(s.tier<5&&s.xp>=THRESHOLDS[s.tier+1]){s.tier++;s.events.push({type:'grow',tier:s.tier});}s.radius=s.mode==='zen'&&s.tier===5?zenRadius(s.xp):RADII[s.tier];const grownLevel=displayLevel(s);if(s.mode==='zen'&&grownLevel>Math.max(6,previousLevel))s.events.push({type:'grow',tier:s.tier,displayLevel:grownLevel,radius:s.radius});}}
if(s.mode==='campaign'&&s.targets>=s.totalTargets&&s.totalTargets>0){s.status='won';s.events.push({type:'won'});}else if(s.mode==='zen'&&s.eaten===s.objects.length){s.status='won';s.events.push({type:'won'});}else if(s.mode==='campaign'&&s.time<=0){s.status='lost';s.events.push({type:'lost'});}}
function progress(s){if(s.tier===5){if(s.mode!=='zen')return 1;const level=displayLevel(s),start=zenThreshold(level),end=zenThreshold(level+1);return Math.max(0,Math.min(1,(s.xp-start)/(end-start)));}return (s.xp-THRESHOLDS[s.tier])/(THRESHOLDS[s.tier+1]-THRESHOLDS[s.tier]);}
const api={THRESHOLDS,RADII,ZEN_AREA_PER_XP,ZEN_RADIUS_STEP,create,tick,progress,displayLevel,nextThreshold,zenRadius,movementSpeed};root.HCEngine=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
