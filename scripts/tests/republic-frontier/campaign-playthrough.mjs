/** Automated input playthrough, not human play or an oracle proof of solvability.
 * The bot is allowed to read authored mission goals/roles, as a guide reader would.
 * It may only change the game through Game.command and Game.step. No entity edits,
 * spawning, damage calls, objective overrides, economy grants or timer skips.
 * Run: node scripts/tests/republic-frontier/campaign-playthrough.mjs [--missions=a1,c1] [--limit=1800]
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {Game} from '../../../public/game-arcade/games/republic-frontier/src/engine.js';
import {BUILDINGS,UNITS} from '../../../public/game-arcade/games/republic-frontier/src/data.js';
import {MISSION_SCENARIOS} from '../../../public/game-arcade/games/republic-frontier/src/missions.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../public/game-arcade/games/republic-frontier');
const args=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=')));
const ids=(args.missions||Array.from({length:8},(_,i)=>[`a${i+1}`,`c${i+1}`]).flat().toString()).split(',');
const limit=Number(args.limit||1800),wallLimit=Number(args.wall||60),difficulty=args.difficulty||'easy';
const alive=e=>e&&e.hp>0&&!e.dead;
const center=e=>({x:e.x+(BUILDINGS[e.type]?.w||0)/2,y:e.y+(BUILDINGS[e.type]?.h||0)/2});
const dist=(a,b)=>Math.hypot(center(a).x-b.x,center(a).y-b.y);
const near=(a,b,n)=>Math.hypot(a.x-b.x,a.y-b.y)<=n;
const protectedRoles=new Set(['investigators','couriers','technicians','evacuees','supplyCrew','mobileBase','supplyConvoy','spy','engineers']);

class InputBot{
  constructor(game){this.game=game;this.config=MISSION_SCENARIOS[game.state.missionId];this.commands=[];this.rejected=[];this.commandCounts={};this.transitions=[];this.captureTasks=new Map();this.lastStage=0;this.lastEconomy=-10;this.lastSignature='';this.lastProgressAt=0;this.assignment=null;}
  get s(){return this.game.state;}
  living(){return this.s.entities.filter(alive);}
  own(){return this.living().filter(e=>e.owner===0);}
  role(role,owner=null){let list;if(role==='playerCombat')list=this.army();else if(role==='playerUnits')list=this.own().filter(e=>e.kind==='unit'&&!e.carrierId);else list=this.living().filter(e=>(this.s.mission.roles[role]||[]).includes(e.id));return owner===null?list:list.filter(e=>e.owner===owner);}
  army(){return this.own().filter(e=>e.kind==='unit'&&!e.carrierId&&(UNITS[e.type]?.damage||0)>0&&!['miner','spy','engineer','mcv','transport'].includes(e.type)&&!protectedRoles.has(e.missionRole));}
  command(command){const result=this.game.command(command);this.commandCounts[command.type]=(this.commandCounts[command.type]||0)+1;const event={time:+this.s.time.toFixed(2),stage:this.s.mission.stage,...command,...result};if(this.commands.length<240)this.commands.push(event);if(!result.ok&&this.rejected.length<60)this.rejected.push(event);return result;}
  order(type,units,point=null,target=null){
    units=units.filter(e=>alive(e)&&e.owner===0&&!e.carrierId);if(!units.length)return false;
    const changed=units.filter(e=>{if(target)return e.order?.type!==type||e.order?.targetId!==target.id;return e.order?.type!==type||Math.hypot((e.order.x??-100)-point.x,(e.order.y??-100)-point.y)>1.8;});
    if(!changed.length)return true;
    // Individual destinations avoid formation offsets moving mission-critical units
    // outside a small objective radius or onto an impassable coast tile.
    for(const e of changed){let destination=point;if(point&&UNITS[e.type]?.movement==='naval'&&this.game.tile(point.x,point.y)?.kind!=='water'){let best=Infinity;for(let y=1;y<this.s.height-1;y++)for(let x=1;x<this.s.width-1;x++)if(this.game.tile(x,y)?.kind==='water'){const d=Math.hypot(x+.5-point.x,y+.5-point.y);if(d<best){best=d;destination={x:x+.5,y:y+.5};}}}this.command({type,ids:[e.id],...(destination?{x:destination.x,y:destination.y}:{}),...(target?{targetId:target.id}:{})});}return true;
  }
  build(type){
    if(this.own().some(e=>e.type===type&&(e.progress??1)<1))return false;
    const yards=this.own().filter(e=>e.type==='constructionYard');if(!yards.length)return false;
    const spots=[];for(const yard of yards)for(let dy=-9;dy<=9;dy++)for(let dx=-9;dx<=9;dx++)spots.push({x:Math.floor(yard.x+dx),y:Math.floor(yard.y+dy),distance:Math.abs(dx)+Math.abs(dy)});
    spots.sort((a,b)=>a.distance-b.distance);
    for(const p of spots)if(this.game.canBuild(type,p.x,p.y).ok)return this.command({type:'build',building:type,x:p.x,y:p.y}).ok;return false;
  }
  economy(){
    if(this.s.time-this.lastEconomy<3)return;this.lastEconomy=this.s.time;
    const own=this.own(),ready=t=>own.some(e=>e.type===t&&(e.progress??1)>=1),pending=t=>own.some(e=>e.type===t),cash=this.s.players[0].credits;
    const current=this.config.stages[this.s.mission.stage-1];
    if(ready('constructionYard')&&!own.some(e=>e.kind==='building'&&(e.progress??1)<1)){
      if(this.s.players[0].power<this.s.players[0].demand+50&&cash>600)this.build('powerPlant');
      else if(!pending('refinery')&&cash>2200)this.build('refinery');
      else if(!pending('barracks')&&cash>500)this.build('barracks');
      else if(!pending('warFactory')&&ready('refinery')&&cash>2300)this.build('warFactory');
      else if(!pending('radar')&&ready('refinery')&&cash>1700)this.build('radar');
      else for(const goal of current.goals)if(goal.kind==='build'&&!pending(goal.building))this.build(goal.building);
    }
    const engineerCount=own.filter(e=>e.type==='engineer').length,combatCount=this.army().length;
    for(const factory of own.filter(e=>e.kind==='building'&&(e.progress??1)>=1&&e.queue.length<2)){
      let unit=null;
      if(factory.type==='barracks')unit=engineerCount+factory.queue.filter(q=>q.type==='engineer').length<4?'engineer':combatCount<11?'infantry':null;
      else if(factory.type==='warFactory')unit=own.filter(e=>e.type==='miner').length<1?'miner':combatCount<19?'tank':null;
      else if(factory.type==='shipyard')unit=this.config.terrain==='naval'&&own.filter(e=>e.type==='destroyer').length<8?'destroyer':null;
      if(unit&&cash>1200&&this.game.canTrain(unit).ok)this.command({type:'train',unit,buildingId:factory.id});
    }
    for(const building of own.filter(e=>e.kind==='building'&&e.hp<e.maxHp*.8&&!e.repairEnabled&&cash>500))this.command({type:'repair',ids:[building.id]});
  }
  attack(target,army=this.army()){
    if(!target)return false;
    // A human clears tanks beside an exposed landing squad before shooting distant
    // infrastructure. Do not change campaign stats to compensate for bad inputs.
    if(target.kind==='building'){
      const immediate=this.living().filter(e=>e.owner===1&&e.kind==='unit'&&army.some(friend=>dist(e,center(friend))<8));
      if(immediate.length)target=immediate.sort((a,b)=>dist(a,center(army[0]||target))-dist(b,center(army[0]||target)))[0];
    }
    const usable=army.filter(e=>this.game.canTarget(e,target)).filter(e=>{if(this.config.terrain!=='naval'||['naval','air','amphibious'].includes(UNITS[e.type]?.movement))return true;const ty=center(target).y;return e.y<14&&ty<14||e.y>31&&ty>31;});
    for(const unit of usable){
      if(UNITS[unit.type]?.movement==='naval'&&this.game.tile(target.x,target.y)?.kind!=='water'&&dist(unit,center(target))>(UNITS[unit.type].range||0)*.98){
        let point=null,best=Infinity;const position=center(target);
        for(let y=1;y<this.s.height-1;y++)for(let x=1;x<this.s.width-1;x++)if(this.game.tile(x,y)?.kind==='water'){
          const p={x:x+.5,y:y+.5},range=Math.hypot(p.x-position.x,p.y-position.y);
          if(range<(UNITS[unit.type].range||0)*.98){const score=range*10+dist(unit,p)*.1;if(score<best){best=score;point=p;}}
        }
        if(point){this.order('move',[unit],point);continue;}
      }
      this.order('attack',[unit],null,target);
    }
    return usable.length>0;
  }
  escort(point,explicit=null){
    const army=this.army().filter(e=>this.config.terrain!=='naval'||['naval','air','amphibious'].includes(UNITS[e.type]?.movement)||e.y<14&&point.y<14||e.y>31&&point.y>31),enemies=this.living().filter(e=>e.owner===1&&(e.kind==='unit'||(BUILDINGS[e.type]?.damage||0)>0));
    const relevant=enemies.filter(e=>dist(e,point)<17||army.some(a=>dist(e,center(a))<9));
    relevant.sort((a,b)=>dist(a,point)-dist(b,point));
    if(explicit&&alive(explicit))return this.attack(explicit,army);
    if(relevant.length)return this.attack(relevant[0],army);
    const stand={x:Math.max(2,Math.min(61,point.x-5)),y:Math.max(2,Math.min(41,point.y+5))};
    this.order('move',army,stand);return false;
  }
  ferry(unit,destination){
    if(this.config.terrain!=='naval')return false;
    const opposite=unit.y<14&&destination.y>31||unit.y>31&&destination.y<14;
    if(!opposite&&!unit.carrierId)return false;
    let carrier=unit.carrierId?this.game.getEntity(unit.carrierId):this.own().filter(e=>e.type==='transport'&&!e.passengers.length).sort((a,b)=>dist(a,unit)-dist(b,unit))[0];
    if(!carrier)return false;
    if(unit.carrierId){if(near(carrier,destination,4)){this.command({type:'unload',ids:[carrier.id]});}else this.order('move',[carrier],destination);return true;}
    const embark={x:unit.x,y:unit.y};if(!near(carrier,embark,2.1)){this.order('move',[carrier],embark);return true;}
    this.order('garrison',[unit],null,carrier);return true;
  }
  capture(target){
    if(!target||target.owner===0)return;
    const pos=center(target);this.escort(pos);
    const existing=this.captureTasks.get(target.id),old=this.game.getEntity(existing);
    const reserved=new Set([...this.captureTasks].filter(([targetId])=>targetId!==target.id&&alive(this.game.getEntity(targetId))&&this.game.getEntity(targetId).owner!==0).map(([,engineerId])=>engineerId));
    const engineer=alive(old)&&old.owner===0?old:this.own().filter(e=>e.type==='engineer'&&!e.carrierId&&!reserved.has(e.id)).sort((a,b)=>dist(a,pos)-dist(b,pos))[0];
    if(!engineer)return;this.captureTasks.set(target.id,engineer.id);
    if(this.ferry(engineer,{x:pos.x-3,y:pos.y+2}))return;
    this.order('capture',[engineer],null,target);
  }
  goRole(role,zone){
    const point=this.config.zones[zone];if(!point)return;const units=this.role(role,0);if(!units.length)return;
    if(role!=='playerCombat')this.escort(point);
    for(const e of units){if(e.carrierId){const carrier=this.game.getEntity(e.carrierId);if(carrier&&near(carrier,point,point.radius-1))this.command({type:'unload',ids:[carrier.id]});else if(carrier)this.order('move',[carrier],point);}else if(!this.ferry(e,point))this.order('move',[e],point);}
  }
  goal(objective){
    if(!objective)return;
    if(objective.kind==='either')return this.goal(objective.goals[0]);
    if(objective.kind==='capture')return this.capture(this.role(objective.role).find(e=>e.owner!==0));
    if(objective.kind==='destroy'||objective.kind==='lossCount'||objective.kind==='neutralize'||objective.kind==='resolved'){
      const target=this.role(objective.role).filter(e=>e.owner!==0).sort((a,b)=>dist(a,center(this.army()[0]||{x:0,y:0}))-dist(b,center(this.army()[0]||{x:0,y:0})))[0];return this.attack(target);
    }
    if(objective.kind==='arrive')return this.goRole(objective.role,objective.zone);
    if(objective.kind==='scout'){
      const point=this.config.zones[objective.zone];const unit=this.army()[0]||this.own().find(e=>e.kind==='unit'&&!e.carrierId);if(unit){this.escort(point);this.order('move',[unit],point);}return;
    }
    if(objective.kind==='rescue'){
      const rescue=this.config.rescues?.find(r=>r.role===objective.role),point=rescue?.zone?this.config.zones[rescue.zone]:rescue||this.role(objective.role)[0];
      if(!point)return;const blocker=rescue?.blockers?this.role(rescue.blockers,1)[0]:null;
      if(blocker)this.attack(blocker);else{const units=this.config.terrain==='naval'?this.own().filter(e=>e.type==='transport'&&!e.passengers.length):this.army();this.order('move',units,point);}return;
    }
    if(objective.kind==='infiltrate'){
      const spy=this.role(objective.role,0)[0],target=this.role(objective.targetRole).find(e=>e.owner!==0);if(spy&&target){this.escort(center(target));this.order('infiltrate',[spy],null,target);}return;
    }
    if(objective.kind==='wavesCleared'){
      const wave=this.living().filter(e=>this.s.mission.stageWaveIds.includes(e.id));if(wave.length)this.attack(wave[0]);else this.escort(this.config.zones.home||{x:30,y:22});return;
    }
    if(objective.kind==='hold')return this.escort(center(this.role(objective.role)[0]||this.config.zones.home));
    if(objective.kind==='build')return this.build(objective.building);
    if(objective.kind==='buildInZone'){
      const point=this.config.zones[objective.zone],mcv=this.role('mobileBase',0).find(e=>e.type==='mcv');if(!mcv)return;
      if(dist(mcv,point)>point.radius-2){this.order('move',[mcv],point);return;}
      const attempt=this.command({type:'deploy',ids:[mcv.id]});if(!attempt.ok){for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const x=Math.floor(point.x)+dx,y=Math.floor(point.y)+dy;if(this.game.placement('constructionYard',x,y,0,mcv.id).ok){this.order('move',[mcv],{x:x+1.5,y:y+1.5});return;}}}return;
    }
    if(objective.kind==='flag'&&objective.flag==='chronoTransferred')this.goRole('assaultVehicles','source');
    if(objective.kind==='within'){const target=this.role(objective.targetRole)[0];if(target)this.order('move',this.role(objective.role,0),center(target));}
  }
  think(){
    if(this.lastStage!==this.s.mission.stage){this.transitions.push({stage:this.s.mission.stage,time:+this.s.time.toFixed(2),title:this.s.mission.stageTitle});this.lastStage=this.s.mission.stage;this.captureTasks.clear();}
    this.economy();
    const definition=this.config.stages[this.s.mission.stage-1],pending=definition.goals.filter(g=>!this.s.objectives.find(o=>o.id===g.id)?.done);
    // Combat survival is evaluated each decision tick. The role goals remain real.
    const defenders=this.living().filter(e=>e.owner===1&&e.kind==='unit'&&this.own().some(a=>protectedRoles.has(a.missionRole)&&dist(e,center(a))<7));
    if(defenders.length)this.attack(defenders[0]);
    this.goal(pending[0]);
    // Timed holds and delayed wave completion must not prevent independent escort
    // inputs; execute non-combat arrival/capture requirements in the same phase.
    for(const g of pending.slice(1))if(['arrive','capture','infiltrate','buildInZone','build'].includes(g.kind))this.goal(g);
    const signature=JSON.stringify(this.s.objectives.filter(o=>!o.optional).map(o=>[o.id,o.done,Math.floor(o.progress||0)]));if(signature!==this.lastSignature){this.lastSignature=signature;this.lastProgressAt=this.s.time;}
  }
}

function run(id){
  const start=performance.now();let game=new Game({mode:'campaign',missionId:id,faction:id[0]==='a'?'allied':'china',difficulty,players:2,seed:2026});const bot=new InputBot(game),importantEvents=[],restoreChecks=[];let pendingRestore=false;
  const onEvent=e=>{if(['missionStage','missionLost','missionWon','capture','rescue','infiltrate','destroyed','deployed','missionTeleport'].includes(e.type)&&importantEvents.length<300)importantEvents.push({...e});if(e.type==='missionStage')pendingRestore=true;};
  game.onEvent=onEvent;
  let nextDecision=0,error=null,stoppedBy=null,lastLog=0;
  try{while(game.state.status==='playing'&&game.state.time<limit){if((performance.now()-start)/1000>wallLimit){stoppedBy='wall-clock-budget';break;}if(game.state.time-lastLog>180){console.log(`${id} progress stage=${game.state.mission.stage} sim=${game.state.time.toFixed(1)}s`);lastLog=game.state.time;}if(game.state.time>=nextDecision){bot.think();nextDecision=game.state.time+.75;}game.step(.25);if(pendingRestore&&game.state.status==='playing'){pendingRestore=false;const snapshot=game.serialize(),restored=Game.restore(snapshot);if(JSON.stringify(restored.serialize())!==JSON.stringify(snapshot))throw new Error('Full world changed across checkpoint restore');game=restored;bot.game=game;game.onEvent=onEvent;restoreChecks.push({stage:game.state.mission.stage,time:+game.state.time.toFixed(2),fullWorldMatched:true});}}}
  catch(e){error={message:e.message,stack:e.stack};}
  const s=game.state,roleSummary=Object.fromEntries(Object.entries(s.mission.roles).map(([role,ids])=>[role,ids.map(id=>game.getEntity(id)).filter(Boolean).map(e=>({id:e.id,type:e.type,owner:e.owner,hp:+e.hp.toFixed(1),x:+e.x.toFixed(2),y:+e.y.toFixed(2),carrierId:e.carrierId,order:e.order}))]));
  return{mission:id,difficulty,result:error?'error':s.status==='playing'?'timeout':s.status,simulatedSeconds:+s.time.toFixed(2),wallSeconds:+((performance.now()-start)/1000).toFixed(3),stage:s.mission.stage,reason:s.mission.failureReason||stoppedBy||null,lastObjectiveProgressSeconds:+bot.lastProgressAt.toFixed(2),objectives:s.objectives,transitions:bot.transitions,restoreChecks,commandCounts:bot.commandCounts,rejectedCommands:bot.rejected,firstCommands:bot.commands,events:importantEvents,roles:roleSummary,resources:{credits:s.players[0].credits,power:s.players[0].power,demand:s.players[0].demand},livingOwn:s.entities.filter(e=>alive(e)&&e.owner===0).map(e=>({id:e.id,type:e.type,x:+e.x.toFixed(2),y:+e.y.toFixed(2),hp:+e.hp.toFixed(1),order:e.order,carrierId:e.carrierId,queue:e.queue})),...(error?{error}:{} )};
}

const output=path.join(root,'evidence',args.output||'campaign-playthrough.json');
const previous=fs.existsSync(output)?JSON.parse(fs.readFileSync(output,'utf8')):null;
const previousAttempts=[...(previous?.previousAttempts||[])];if(previous?.runs?.length)previousAttempts.push({generatedAt:previous.generatedAt,difficulty:previous.difficulty,sourceHashes:previous.sourceHashes,summary:previous.summary,runs:previous.runs.map(r=>r.result==='won'?{mission:r.mission,result:r.result,stage:r.stage,simulatedSeconds:r.simulatedSeconds}:{...r,firstCommands:undefined})});
const report={previousAttempts,inputBotSha256:crypto.createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex'),wallLimit,method:'automated-input-playthrough-not-human',forbiddenMutationsUsed:false,description:'Authored scenario goals and role positions are visible to the bot. All gameplay effects come from public commands and ordinary simulation steps. Timeout is a bot failure, not automatically proof that a mission is impossible.',generatedAt:new Date().toISOString(),limit,difficulty,sourceHashes:Object.fromEntries(['engine.js','missions.js','campaigns.js','data.js','maps.js','terrain.js'].map(name=>[name,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'src',name))).digest('hex')])),runs:[]};
fs.mkdirSync(path.dirname(output),{recursive:true});
for(const id of ids){if(!MISSION_SCENARIOS[id])throw new Error(`Unknown mission ${id}`);const result=run(id);report.runs.push(result);report.summary=Object.fromEntries(['won','lost','timeout','error'].map(k=>[k,report.runs.filter(r=>r.result===k).length]));fs.writeFileSync(output,JSON.stringify(report,null,2));console.log(`${id} ${result.result} stage=${result.stage} sim=${result.simulatedSeconds}s wall=${result.wallSeconds}s ${result.reason||''}`);}
console.log(JSON.stringify({summary:report.summary,output}));
