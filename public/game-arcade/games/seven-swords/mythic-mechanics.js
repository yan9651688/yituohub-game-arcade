/* Mythic-only attack grammar. All damage areas are locked when their warning appears. */
(() => {
'use strict';
const profiles={
 kui:{moves:['ring','追雷','lanes','charge'],names:['雷蹄震波','九霄追雷','雷泽封路','震岳奔雷'],scale:1.08,beat:.8},
 xuanwu:{moves:['ring','cross','sweep'],names:['玄甲寒潮','玄蛇双牙','北冥横扫'],scale:1.12,beat:1.05},
 bifang:{moves:['fan','bombs','lanes'],names:['三翎火羽','落羽燎原','赤羽火径'],scale:.96,beat:.75},
 yinglong:{moves:['charge','wings','追雷'],names:['游龙破阵','双翼裁云','云海雷雨'],scale:1.1,beat:.85},
 qinglong:{moves:['cross','追雷','charge'],names:['苍雷龙脉','青霄连雷','苍龙出海'],scale:1.07,beat:.76},
 baihu:{moves:['sweep','charge','cross'],names:['庚金裂地','白虎扑杀','四象爪痕'],scale:.98,beat:.67},
 zhuque:{moves:['wings','bombs','ring'],names:['南明展翼','焚羽流星','离火天环'],scale:1.08,beat:.9},
 qilin:{moves:['ring','lanes','sweep'],names:['麒麟震岳','厚土封疆','瑞角扫阵'],scale:1.02,beat:.93},
 baize:{moves:['cross','ring','追雷'],names:['白泽符阵','万象法环','明鉴灵击'],scale:.94,beat:1.02},
 xiezhi:{moves:['charge','fan','ring'],names:['独角裁罪','断狱锋芒','正法震环'],scale:.95,beat:.73},
 pixiu:{moves:['sweep','ring','charge'],names:['吞金裂锋','聚宝金潮','貔貅镇邪'],scale:1.05,beat:.85},
 luwu:{moves:['lanes','sweep','cross'],names:['九尾封门','昆仑虎爪','神阙交锋'],scale:1.12,beat:.78},
 taotie:{moves:['sweep','bombs','ring'],names:['吞天巨口','饕餮噬地','腹鸣震浪'],scale:1.16,beat:1.03},
 hundun:{moves:['ring','cross','bombs'],names:['混沌空环','无相交界','虚空崩落'],scale:1.03,beat:1.07},
 taowu:{moves:['charge','lanes','sweep'],names:['梼杌凶扑','荒野裂痕','獠牙横扫'],scale:1.06,beat:.71},
 qiongqi:{moves:['wings','charge','fan'],names:['穷奇恶翼','噬善飞扑','凶风裂刃'],scale:1.02,beat:.68},
 jiuwei:{moves:['bombs','fan','lanes'],names:['九尾狐火','魅焰散华','幽火迷径'],scale:.93,beat:.74},
 chenghuang:{moves:['charge','ring','bombs'],names:['乘黄踏虚','灵蹄涟漪','白芒星落'],scale:.96,beat:.72},
 zheng:{moves:['fan','sweep','追雷'],names:['五尾铮鸣','赤豹裂爪','金石连震'],scale:.98,beat:.7},
 bo:{moves:['charge','cross','sweep'],names:['驳兽逐虎','独角裂阵','白鬃斩浪'],scale:1.04,beat:.8},
 fenghuang:{moves:['wings','ring','bombs'],names:['百鸟朝凤','涅槃火轮','五彩羽雨'],scale:1.1,beat:.95},
 jinwu:{moves:['bombs','wings','fan'],names:['十日坠焰','金乌展翅','日冕流火'],scale:1.13,beat:.88},
 kun:{moves:['lanes','ring','sweep'],names:['北海巨浪','鲸波回潮','鲲尾覆海'],scale:1.2,beat:1.1},
 zhulong:{moves:['cross','追雷','ring'],names:['昼夜分界','烛目天罚','晦明轮转'],scale:1.14,beat:1.04}
};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function attack(c,e){
 const cfg=Object.prototype.hasOwnProperty.call(profiles,e.mythicId)?profiles[e.mythicId]:null;if(!cfg||e.dead||c.actionsLocked())return false;
 // One cast owns its delayed follow-ups until the final actual impact.
 // This also prevents an HP phase transition from truncating the cast cooldown.
 if((e.mythicPending||0)>0||c.time<(e.mythicUntil||0)||c.hazards.some(h=>h.owner===e&&h.mythic&&!h.dead&&!h.triggered)){
  e.cooldown=Math.max(.001,(e.mythicUntil||0)-c.time);return false;
 }
 const phase=e.hp<e.maxHp*.35?3:e.hp<e.maxHp*.7?2:1;
 e.phase=phase;const index=e.pattern++%cfg.moves.length,move=cfg.moves[index],size=cfg.scale;
 e.dir=Math.atan2(c.p.y-e.y,c.p.x-e.x);e.cooldown=0;e.action=1.2;e.mythicPending=0;e.mythicUntil=c.time;
 const later=(t,fn)=>{e.mythicPending++;c.schedule(t,()=>{try{if(!e.dead&&e.hp>0&&!c.ended&&!c.destroyed)fn();}finally{e.mythicPending=Math.max(0,e.mythicPending-1);}});};
 const tell=(spec)=>{const h={owner:e,damage:e.damage*1.75,high:true,delay:1.2,cancelOnDeath:true,mythic:true,...spec};e.mythicUntil=Math.max(e.mythicUntil,c.time+h.delay);e.cooldown=Math.max(e.cooldown,e.mythicUntil-c.time);c.hazard(h);};
 const circle=(x,y,r,extra={})=>tell({kind:'circle',x:clamp(x,65,c.arenaWidth-65),y:clamp(y,100,c.arenaHeight-75),r:r*size,...extra});
 const line=(x,y,a,length,width,extra={})=>tell({kind:'line',x,y,x2:clamp(x+Math.cos(a)*length*size,65,c.arenaWidth-65),y2:clamp(y+Math.sin(a)*length*size,100,c.arenaHeight-75),width:width*size,...extra});
 function cast(kind,secondary=false){
  const x=e.x,y=e.y,a=Math.atan2(c.p.y-y,c.p.x-x),damage=e.damage*(secondary?1.4:1.75),base={damage};
  if(kind==='ring'){
   // Stand inside the empty core OR outside the outer boundary. Never a full-screen blast.
   tell({kind:'annulus',x,y,inner:125*size,r:300*size,delay:1.35,...base});
   if(phase>=2&&!secondary)later(.9,()=>circle(e.x,e.y,100,{delay:1.25,damage:e.damage*1.6}));
  }else if(kind==='追雷'){
   for(let i=0;i<(secondary?2:2+phase);i++)later(i*cfg.beat,()=>circle(c.p.x,c.p.y,94,{delay:1.15,damage}));
  }else if(kind==='charge'){
   line(x,y,a,610,108,{dash:true,delay:1.35,damage:e.damage*(secondary?1.5:1.9)});
   if(phase>=2&&!secondary)later(1.6,()=>{const a2=Math.atan2(c.p.y-e.y,c.p.x-e.x);line(e.x,e.y,a2,430,82,{dash:true,delay:1.15,damage:e.damage*1.6});});
  }else if(kind==='sweep'){
   tell({kind:'cone',x,y,angle:a,range:330*size,half:1.05,delay:1.3,...base});
   if(phase>=2&&!secondary)later(1.1,()=>tell({kind:'cone',x:e.x,y:e.y,angle:a+Math.PI*.8,range:300*size,half:.85,delay:1.2,damage:e.damage*1.6}));
  }else if(kind==='wings'){
   for(const side of [-1,1])tell({kind:'cone',x,y,angle:a+side*Math.PI/2,range:360*size,half:.65,delay:1.3,...base});
  }else if(kind==='fan'){
   for(let k=-1;k<=1;k++)line(x,y,a+k*.63,650,72,{delay:1.25,...base});
  }else if(kind==='cross'){
   // Two locked strips cross at the player snapshot; four open quadrants remain around it.
   const tx=clamp(c.p.x,140,c.arenaWidth-140),ty=clamp(c.p.y,150,c.arenaHeight-140);
   for(const dir of [a,a+Math.PI/2]){
    const dx=Math.cos(dir)*290*size,dy=Math.sin(dir)*290*size;
    tell({kind:'line',x:clamp(tx-dx,65,c.arenaWidth-65),y:clamp(ty-dy,100,c.arenaHeight-75),x2:clamp(tx+dx,65,c.arenaWidth-65),y2:clamp(ty+dy,100,c.arenaHeight-75),width:80*size,delay:1.4,...base});
   }
  }else if(kind==='bombs'){
   const tx=c.p.x,ty=c.p.y;
   circle(tx,ty,125,{delay:1.4,...base});
   for(const side of [-1,1])circle(tx+Math.cos(a+side*1.2)*275,ty+Math.sin(a+side*1.2)*275,110,{delay:1.6,...base});
  }else if(kind==='lanes'){
   // Parallel strips with a broad central corridor; phase adds a delayed aimed follow-up.
   for(const side of [-1,1]){
    const ox=clamp(x-Math.sin(a)*side*205*size,65,c.arenaWidth-65),oy=clamp(y+Math.cos(a)*side*205*size,100,c.arenaHeight-75);
    line(ox,oy,a,650,105,{delay:1.4,...base});
   }
   if(!secondary)later(1.2,()=>circle(c.p.x,c.p.y,100,{delay:1.25,damage:e.damage*1.5}));
  }
 }
 cast(move);
 if(phase>=2&&['fan','bombs','wings','cross'].includes(move))later(.95,()=>{
  const a=Math.atan2(c.p.y-e.y,c.p.x-e.x);
  if(move==='bombs')circle(c.p.x,c.p.y,105,{delay:1.25,damage:e.damage*1.5});
  else line(e.x,e.y,a,490,78,{delay:1.25,damage:e.damage*1.5});
 });
 // Later phases combine readable, separately locked attacks, rather than only bigger numbers.
 if(phase===3)later(1.9,()=>cast(cfg.moves[(index+1)%cfg.moves.length],true));
 c.textFloat(cfg.names[index]+(phase===3?' · 连式':''),e.x,e.y,'#f2d99c',17,1.5,125);
 return true;
}
window.MythicMechanics=Object.freeze({profiles,attack});
})();
