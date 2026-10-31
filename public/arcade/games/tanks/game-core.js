/* Original deterministic game engine. Map provenance: levels.js / REFERENCES.md. */
(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./levels.js'):root.TankLevels);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.TankGame=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Data){
'use strict';
const SIZE=416,TILE=16,TANK=28,DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
// At 2x field scale and 60 Hz: ordinary tanks move 1px every other frame, fast tanks every frame.
const TYPES={basic:{speed:60,hp:1,value:100},fast:{speed:120,hp:1,value:200},power:{speed:60,hp:1,value:300},armor:{speed:60,hp:4,value:400}};
const ITEMS=['star','helmet','grenade','shovel','timer','life','boat'];
// Original eight-entry table: stars and grenades each occupy two entries.
const BONUS_TABLE=['helmet','timer','shovel','star','grenade','life','grenade','star'];
const BONUS_POSITIONS=[52,148,244,340]; // 24px icon top-lefts; original center coordinates $30/$60/$90/$C0.
function powerDuration(g,units){return (units*64-(Math.floor(g.time*60+1e-7)%64))/60;}
function rng(seed){let n=seed>>>0||1;return()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return(n>>>0)/4294967296;};}
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function rect(t){return{x:t.x,y:t.y,w:TANK,h:TANK};}
function create(options={}){
 const g={state:'title',stage:0,score:0,best:options.best||0,lives:3,kills:0,spawned:0,enemies:[],bullets:[],pickups:[],effects:[],events:[],player:null,baseAlive:true,freeze:0,fortify:0,time:0,stageTime:0,spawnTimer:0,respawnTimer:0,clearTimer:0,nextId:1,extraLife:false,practice:false,rng:rng(options.seed||7685),seed:options.seed||7685,input:{dir:null,fire:false},tiles:[],counts:{basic:0,fast:0,power:0,armor:0}};
 loadStage(g,0);g.state='title';return g;
}
function emit(g,type,extra={}){g.events.push({type,...extra});}
function homeWall(g,type='B'){for(let y=23;y<26;y++)for(let x=11;x<15;x++)if(y===23||x===11||x===14)g.tiles[y][x]={type,hp:type==='B'?2:1};}
function loadStage(g,index){
 g.stage=index;const level=Data.levels[index];g.waterStage=level.tiles.some(r=>r.includes('W'));g.tiles=level.tiles.map(r=>Array.from(r,c=>({type:c,hp:c==='B'?2:1})));
 homeWall(g);g.enemies=[];g.bullets=[];g.pickups=[];g.effects=[];g.kills=0;g.spawned=0;g.spawnTimer=.8;g.respawnTimer=0;g.clearTimer=0;g.baseAlive=true;g.freeze=0;g.fortify=0;g.stageTime=0;g.counts={basic:0,fast:0,power:0,armor:0};
 for(let y=24;y<26;y++)for(let x=8;x<10;x++)g.tiles[y][x]={type:'.',hp:1};
 const previous=g.player?g.player.upgrade:0,boat=!!(g.player&&g.player.boat);g.player={id:0,x:130,y:386,dir:0,speed:90,upgrade:previous,boat,inWater:false,moving:false,cooldown:0,shield:powerDuration(g,3),alive:true,team:'player',track:0};
}
function start(g,stage=0){g.score=0;g.lives=3;g.extraLife=false;g.time=0;g.rng=rng(g.seed);g.nextId=1;g.practice=stage>0;g.player=null;loadStage(g,Math.max(0,Math.min(Data.levels.length-1,stage)));g.state='playing';g.events=[];g.input={dir:null,fire:false};emit(g,'start');}
function pause(g){if(g.state==='playing'){g.state='paused';g.input={dir:null,fire:false};return true;}if(g.state==='paused'){g.state='playing';return false;}return false;}
function nextStage(g){if(g.state!=='stageclear')return false;if(g.stage+1>=Data.levels.length){g.state='victory';emit(g,'victory');return true;}loadStage(g,g.stage+1);g.state='playing';g.input={dir:null,fire:false};emit(g,'stage');return true;}
function setInput(g,input){g.input={dir:Number.isInteger(input.dir)&&input.dir>=0&&input.dir<4?input.dir:null,fire:!!input.fire};}
function cellsIn(r){const out=[];for(let y=Math.max(0,Math.floor(r.y/TILE));y<=Math.min(25,Math.floor((r.y+r.h-.001)/TILE));y++)for(let x=Math.max(0,Math.floor(r.x/TILE));x<=Math.min(25,Math.floor((r.x+r.w-.001)/TILE));x++)out.push([x,y]);return out;}
function canOccupy(g,x,y,tank,ignoreTanks=false){
 const r={x,y,w:TANK,h:TANK};if(x<0||y<0||x+TANK>SIZE||y+TANK>SIZE)return false;
 if(overlap(r,{x:192,y:384,w:32,h:32}))return false;
 for(const[cx,cy]of cellsIn(r)){const type=g.tiles[cy][cx].type;if('BS'.includes(type)||type==='W'&&!(tank&&tank.team==='player'&&tank.boat))return false;}
 if(!ignoreTanks){if(g.player&&g.player.alive&&g.player!==tank&&overlap(r,rect(g.player)))return false;for(const e of g.enemies)if(e!==tank&&e.alive&&overlap(r,rect(e)))return false;}return true;
}
function move(g,t,dir,dt){
 if(t.dir!==dir){let x=t.x,y=t.y;if(dir%2===0)x=Math.round((x-2)/TILE)*TILE+2;else y=Math.round((y-2)/TILE)*TILE+2;if(canOccupy(g,x,y,t)){t.x=x;t.y=y;}t.dir=dir;}
 const d=DIRS[dir],distance=t.speed*dt;const x=t.x+d[0]*distance,y=t.y+d[1]*distance;if(canOccupy(g,x,y,t)){t.x=x;t.y=y;t.track+=distance;if(distance>0)t.moving=true;return true;}return false;
}
function fire(g,t){
 if(!t||!t.alive||t.cooldown>0||t.spawning>0)return false;
 const max=t.team==='player'&&t.upgrade>=2?2:1;if(g.bullets.filter(b=>b.owner===t.id&&b.alive).length>=max)return false;
 const d=DIRS[t.dir],cx=t.x+14+d[0]*17,cy=t.y+14+d[1]*17;
 const fast=t.team==='player'?t.upgrade>=1:t.type==='power';g.bullets.push({x:cx-3,y:cy-3,w:6,h:6,dir:t.dir,speed:fast?480:240,team:t.team,owner:t.id,strong:t.team==='player'&&t.upgrade>=3,alive:true});
 t.cooldown=t.team==='player'?.18:.52;emit(g,t.team==='player'?'shoot':'enemyshoot');return true;
}
function spawnEnemy(g){
 if(g.spawned>=20||g.enemies.filter(e=>e.alive).length>=4)return false;
 const spots=[194,386,2],x=spots[g.spawned%3],spawnBox={x,y:2,w:TANK,h:TANK};
 if(g.player.alive&&overlap(spawnBox,rect(g.player))||g.enemies.some(e=>e.alive&&overlap(spawnBox,rect(e))))return false;
 // The original spawn routine clears the two-by-two terrain footprint. Stage 5 relies on this.
 const col=Math.floor(x/TILE);for(let y=0;y<2;y++)for(let dx=0;dx<2;dx++)g.tiles[y][col+dx]={type:'.',hp:1};
 const type=Data.levels[g.stage].roster[g.spawned]||'basic',spec=TYPES[type],carrier=[3,10,17].includes(g.spawned);
 if(carrier)g.pickups=[]; // E3A5: a newly appearing carrier removes the previous uncollected bonus.
 g.enemies.push({id:g.nextId++,x,y:2,dir:2,speed:spec.speed,type,hp:spec.hp,value:spec.value,carrier,team:'enemy',boat:false,inWater:false,moving:false,alive:true,spawning:.7,cooldown:0,fireTimer:.75+g.rng(),turnTimer:.8+g.rng(),blocked:0,track:0});g.spawned++;emit(g,'spawn');return true;
}
function addScore(g,n){g.score+=n;if(!g.practice)g.best=Math.max(g.best,g.score);if(!g.extraLife&&g.score>=20000){g.extraLife=true;g.lives++;emit(g,'life');}}
function explosion(g,x,y,big=false){g.effects.push({x,y,life:big?.55:.18,max:big?.55:.18,big});}
function killEnemy(g,e,score=true){if(!e.alive)return;e.alive=false;g.kills++;if(score){g.counts[e.type]++;addScore(g,e.value);}explosion(g,e.x+14,e.y+14,true);emit(g,'explode');}
function end(g,reason){if(g.state!=='playing')return;g.state='gameover';g.reason=reason;g.input={dir:null,fire:false};emit(g,'gameover');}
function damagePlayer(g){const p=g.player;if(!p||!p.alive||p.shield>0)return;p.alive=false;p.upgrade=0;p.boat=false;p.inWater=false;p.moving=false;g.lives--;explosion(g,p.x+14,p.y+14,true);emit(g,'playerhit');if(g.lives<=0)end(g,'lives');else g.respawnTimer=1.35;}
function pickupSpots(g){
 // Original 4x4 bonus lattice. Terrain is deliberately not filtered: a bonus can cover a wall or water.
 const spots=[];for(const y of BONUS_POSITIONS)for(const x of BONUS_POSITIONS){
 if(g.player.alive&&Math.abs(g.player.x+14-x-12)<24&&Math.abs(g.player.y+14-y-12)<24)continue;
 spots.push({x,y});}return spots;
}
// Mixed-version boat: permanent equipment, no armor/speed bonus. Never strand a tank on a timer.
// Search connected LAND tank positions, ignoring temporary tank traffic. A 16px edge cannot
// jump a wall because the tank footprint is 28px. Keep the boat near the player if possible.
function boatSpots(g){
 const p=g.player,land={team:'player',boat:false},start=p.alive?{x:p.x,y:p.y}:{x:130,y:386};
 if(!canOccupy(g,start.x,start.y,land,true))return[];
 const queue=[start],seen=new Set([start.x+','+start.y]),spots=[];
 for(let i=0;i<queue.length;i++){const at=queue[i];spots.push({x:at.x+2,y:at.y+2});
 for(const d of DIRS){const x=at.x+d[0]*TILE,y=at.y+d[1]*TILE,key=x+','+y;if(!seen.has(key)&&canOccupy(g,x,y,land,true)){seen.add(key);queue.push({x,y});}}}
 const nearby=spots.filter(s=>{const distance=Math.abs(s.x-start.x-2)+Math.abs(s.y-start.y-2);return distance>=48&&distance<=144;});
 return nearby.length?nearby:spots;
}
function dropPickup(g){
 // Until equipped, water-stage carriers guarantee a boat, including replacements after death.
 const boat=g.waterStage&&!g.player.boat,accessible=boat?boatSpots(g):[],spots=accessible.length?accessible:pickupSpots(g);if(!spots.length)return;
 const spot=spots[Math.floor(g.rng()*spots.length)],type=accessible.length?'boat':BONUS_TABLE[Math.floor(g.rng()*BONUS_TABLE.length)];
 g.pickups=[{...spot,w:24,h:24,type}];emit(g,'drop',{item:type,x:spot.x+12,y:spot.y+12});
}
function applyPickup(g,item,position){
 addScore(g,500);switch(item){case'boat':g.player.boat=true;break;case'star':g.player.upgrade=Math.min(3,g.player.upgrade+1);break;case'helmet':g.player.shield=powerDuration(g,10);break;case'grenade':for(const e of g.enemies)if(!(e.spawning>0))killEnemy(g,e,false);break;case'shovel':g.fortify=powerDuration(g,20);g.fortifyWall='S';homeWall(g,'S');break;case'timer':g.freeze=powerDuration(g,10);break;case'life':g.lives++;break;}emit(g,'pickup',{item,x:position?position.x+12:g.player.x+14,y:position?position.y+12:g.player.y+14});
}
function chooseDirection(g,e){
 let weighted=[];
 for(let d=0;d<4;d++){const v=DIRS[d];let n=1;if(d===2)n=4;if(d===1&&e.x<180||d===3&&e.x>220)n+=2;if(d===e.dir)n+=1;const nx=e.x+v[0]*6,ny=e.y+v[1]*6;if(!canOccupy(g,nx,ny,e))n=.5;for(let i=0;i<n*2;i++)weighted.push(d);}
 return weighted[Math.floor(g.rng()*weighted.length)];
}
function updateEnemy(g,e,dt){
 e.moving=false;
 if(e.spawning>0){e.spawning-=dt;return;}if(g.freeze>0)return;e.cooldown=Math.max(0,e.cooldown-dt);e.turnTimer-=dt;e.fireTimer-=dt;
 if(e.fireTimer<=0){fire(g,e);e.fireTimer=.9+g.rng()*1.5-Math.min(.25,g.stage*.03);}
 const moved=move(g,e,e.dir,dt);e.blocked=moved?0:e.blocked+dt;
 if(e.turnTimer<=0||e.blocked>.18){const d=chooseDirection(g,e);move(g,e,d,0);e.turnTimer=.55+g.rng()*1.8;e.blocked=0;}
}
function moveBullet(g,b,dt){
 const d=DIRS[b.dir];b.x+=d[0]*b.speed*dt;b.y+=d[1]*b.speed*dt;
 if(b.x+b.w<0||b.y+b.h<0||b.x>SIZE||b.y>SIZE){b.alive=false;return;}
 if(g.baseAlive&&overlap(b,{x:196,y:388,w:24,h:26})){g.baseAlive=false;b.alive=false;explosion(g,208,400,true);end(g,'base');return;}
 let wall=false;for(const[x,y]of cellsIn(b)){const tile=g.tiles[y][x];if(tile.type==='B'){tile.hp-=b.strong?2:1;if(tile.hp<=0)tile.type='.';wall=true;}else if(tile.type==='S'){if(b.strong)tile.type='.';wall=true;}}
 if(wall){b.alive=false;explosion(g,b.x+3,b.y+3);emit(g,'wall');return;}
}
function hitTank(g,b){
 if(b.team==='player'){for(const e of g.enemies){if(!e.alive||e.spawning>0||!overlap(b,rect(e)))continue;b.alive=false;if(e.carrier){e.carrier=false;dropPickup(g);}e.hp--;if(e.hp<=0)killEnemy(g,e);else emit(g,'armor');return;}}
 else if(g.player.alive&&overlap(b,rect(g.player))){b.alive=false;damagePlayer(g);}
}
function step(g,dt){
 g.time+=dt;g.stageTime+=dt;g.freeze=Math.max(0,g.freeze-dt);if(g.fortify>0){g.fortify-=dt;if(g.fortify<=0){g.fortify=0;g.fortifyWall='B';homeWall(g,'B');emit(g,'fortifyend');}else if(g.fortify<=3*64/60){const type=Math.floor((g.time*60+1e-7)/16)%2?'S':'B';if(type!==g.fortifyWall){g.fortifyWall=type;homeWall(g,type);}}}
 const p=g.player;p.moving=false;p.cooldown=Math.max(0,p.cooldown-dt);p.shield=Math.max(0,p.shield-dt);
 if(p.alive){if(g.input.dir!==null)move(g,p,g.input.dir,dt);if(g.input.fire)fire(g,p);}
 else if(g.respawnTimer>0){g.respawnTimer-=dt;if(g.respawnTimer<=0){let spot=[130,386];if(!canOccupy(g,spot[0],spot[1],p)){// Clear only hostile tanks occupying the fixed spawn to avoid permanent soft-lock.
 for(const e of g.enemies)if(e.alive&&overlap(rect(e),{x:130,y:386,w:TANK,h:TANK}))killEnemy(g,e,false);
 }for(let y=24;y<26;y++)for(let x=8;x<10;x++)g.tiles[y][x]={type:'.',hp:1};p.x=130;p.y=386;p.dir=0;p.alive=true;p.shield=powerDuration(g,3);emit(g,'respawn');}}
 g.spawnTimer-=dt;if(g.spawnTimer<=0){g.spawnTimer=spawnEnemy(g)?(190-4*(g.stage+1))/60:.3;}
 for(const e of g.enemies)if(e.alive)updateEnemy(g,e,dt);
 for(const b of g.bullets){if(b.alive)moveBullet(g,b,dt);if(g.state!=='playing')break;}
 for(let i=0;i<g.bullets.length;i++)for(let j=i+1;j<g.bullets.length;j++){const a=g.bullets[i],b=g.bullets[j];if(a.alive&&b.alive&&a.team!==b.team&&overlap(a,b)){a.alive=b.alive=false;explosion(g,a.x,a.y);}}
 // C304-C30A resolves shell interception before damage to tanks.
 for(const b of g.bullets){if(g.state!=='playing')break;if(b.alive)hitTank(g,b);}
 g.bullets=g.bullets.filter(b=>b.alive);g.enemies=g.enemies.filter(e=>e.alive);
 for(const pickup of g.pickups){if(p.alive&&Math.abs(p.x+14-pickup.x-12)<24&&Math.abs(p.y+14-pickup.y-12)<24){applyPickup(g,pickup.type,pickup);pickup.collected=true;}}g.pickups=g.pickups.filter(x=>!x.collected);
 p.inWater=!!(p.alive&&cellsIn(rect(p)).some(([x,y])=>g.tiles[y][x].type==='W'));
 for(const fx of g.effects)fx.life-=dt;g.effects=g.effects.filter(x=>x.life>0);
 if(g.state==='playing'&&g.kills>=20&&g.spawned>=20&&g.enemies.length===0){g.clearTimer+=dt;if(g.clearTimer>=1){g.state='stageclear';g.input={dir:null,fire:false};emit(g,'clear');}}
}
function update(g,dt){if(g.state!=='playing'||!Number.isFinite(dt)||dt<=0)return;let remaining=Math.min(dt,.1);while(remaining>1e-8&&g.state==='playing'){const stepDt=Math.min(1/120,remaining);step(g,stepDt);remaining-=stepDt;}}
function drainEvents(g){const events=g.events;g.events=[];return events;}
return{SIZE,TILE,TANK,DIRS,TYPES,ITEMS,BONUS_TABLE,BONUS_POSITIONS,powerDuration,levels:Data.levels,create,start,pause,nextStage,setInput,update,drainEvents,canOccupy,fire,spawnEnemy,applyPickup,damagePlayer,killEnemy,dropPickup,homeWall,overlap,addScore};
});
