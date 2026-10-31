/* Independent postgame challenge using the shared hero inventory and growth economy. */
(() => {
  'use strict';
  const families=[['beast','异兽','裂岩兽王'],['yao','妖物','千藤妖魁'],['evil','邪物','噬心邪核'],['ghost','鬼物','幽冥鬼王']];
  const themes=[['bamboo','青竹灵庭'],['lava','熔火地宫'],['ice','寒玉冰窟'],['lotus','幽莲水殿'],['sand','赤砂古陵'],['astral','星穹祭坛']];
  const mythics=[{id:'kui',name:'夔牛',theme:'lotus'},{id:'qinglong',name:'青龙',theme:'bamboo'},{id:'xuanwu',name:'玄武',theme:'ice'},{id:'baihu',name:'白虎',theme:'sand'},{id:'bifang',name:'毕方',theme:'lava'},{id:'zhuque',name:'朱雀',theme:'lava'},{id:'yinglong',name:'应龙',theme:'astral'},{id:'qilin',name:'麒麟',theme:'bamboo'},{id:'baize',name:'白泽',theme:'ice'},{id:'xiezhi',name:'獬豸',theme:'astral'},{id:'pixiu',name:'貔貅',theme:'sand'},{id:'luwu',name:'陆吾',theme:'bamboo'},{id:'taotie',name:'饕餮',theme:'sand'},{id:'hundun',name:'混沌',theme:'astral'},{id:'taowu',name:'梼杌',theme:'bamboo'},{id:'qiongqi',name:'穷奇',theme:'lava'},{id:'jiuwei',name:'九尾狐',theme:'lotus'},{id:'chenghuang',name:'乘黄',theme:'sand'},{id:'zheng',name:'狰',theme:'lava'},{id:'bo',name:'驳',theme:'ice'},{id:'fenghuang',name:'凤凰',theme:'bamboo'},{id:'jinwu',name:'金乌',theme:'lava'},{id:'kun',name:'鲲',theme:'lotus'},{id:'zhulong',name:'烛龙',theme:'astral'}];
  const mythicFor=n=>n>=10&&n%5===0?mythics[((n-10)/5)%mythics.length]:null;
  const maxFloor=Number.MAX_SAFE_INTEGER-2;
  const floor=n=>Math.max(1,Math.min(maxFloor,Math.floor(Number.isFinite(Number(n))?Number(n):1)));
  const highest=s=>{const n=Number(s?.tower?.highest);return Number.isFinite(n)?Math.max(0,Math.min(maxFloor,Math.floor(n))):0;};
  const unlocked=s=>!!s&&s.progress?.step>=8;
  const checkpoint=s=>Math.max(1,highest(s));
  const rewardSafe=Math.floor(Number.MAX_SAFE_INTEGER/1024);
  function pressure(n){
    n=floor(n);
    const waveSize=36+2*Math.min(n-1,32),waves=3+Math.min(3,Math.floor((n-1)/8));
    return {waveSize,waves,quota:waveSize*waves,hpScale:1+(n-1)*.065,eliteEvery:Math.max(6,14-Math.floor((n-1)/3))};
  }
  // Match combat.js danger-5 spawn slots, including archetype overrides and elites.
  // At most 600 slots: exact total HP, not an assumed random enemy mix.
  function rewardProfile(n){
    n=floor(n);const p=pressure(n);let ordinaryHp=0,eliteExtraHp=0,elites=0;
    for(let slot=0;slot<p.quota;slot++){
      let factor=1;if(slot%4===3)factor=.76;if(slot%6===4)factor=1.85;if(slot%7===5)factor=1.15;
      const hp=90*factor;ordinaryHp+=hp;
      if(slot>0&&slot%p.eliteEvery===0){eliteExtraHp+=hp*1.2;elites++;}
    }
    const bossHp=710+5*235,workload=(ordinaryHp+eliteExtraHp+bossHp)*p.hpScale;
    // Bounded +0..30% efficiency premium, not an exponential growth multiplier.
    // Fixed-DPS model only: travel, targeting, simultaneous enemy limits and refill waits vary.
    const premium=1+.30*((n-1)/(n+19));
    const riskPremium=mythicFor(n)?1.3:1;
    return {...p,ordinaryHp,eliteExtraHp,elites,bossHp,workload,premium,riskPremium};
  }
  const firstWorkload=rewardProfile(1).workload;
  // Lv.15 repeatable wild patrol: 19 danger-5 enemies, 217 XP.
  // Calibrate against the same deterministic spawn HP as combat.js, not gold income.
  const xpBenchmark=Object.freeze({level:15,enemies:19,xp:217,workload:1880.1,towerPremium:1.15});
  const firstXp=firstWorkload/xpBenchmark.workload*xpBenchmark.xp*xpBenchmark.towerPremium;
  function encounter(n){
    n=floor(n);const [family,label,name]=families[(n-1)%4],{waveSize,waves,quota,hpScale,eliteEvery}=pressure(n),ends=Array.from({length:waves},(_,i)=>waveSize*(i+1)),r=reward(n);
    const mythic=mythicFor(n),theme=mythic?themes.find(t=>t[0]===mythic.theme):themes[Math.floor((n-1)/5)%themes.length];
    const bossName=mythic?mythic.name+' · 试炼幻象':name;
    return {name:`无尽塔 ${n} 层 · ${theme[1]} · 通关 +${r.gold} 文 / +${r.xp} 阅历`,profile:'crowd',danger:5,density:1.25,maxLiving:Math.min(34,22+Math.floor((n-1)/3)),total:quota+1,biome:['forest','cave','ruins','mountain'][(n-1)%4],boss:{name:bossName,kind:'tower',mythicId:mythic?.id||null},tower:{floor:n,theme:theme[0],themeName:theme[1],mythicId:mythic?.id||null,family,label,quota,waveSize,waves,ends,hpScale,damageScale:1+(n-1)*.035,eliteEvery}};
  }
  function createRun(s,n=1){if(!unlocked(s))return null;n=Number(n);if(!Number.isSafeInteger(n)||n<1||n>checkpoint(s))return null;return {hero:s.hero,floor:n,start:n,cleared:0,kills:0,time:0,done:false,lastSettled:0,gold:0,xp:0};}
  function reward(n){
    const p=rewardProfile(n),scale=p.workload/firstWorkload*p.premium*p.riskPremium;
    const amount=base=>Math.min(rewardSafe,Math.ceil(base*scale));
    return {gold:amount(22),xp:amount(firstXp)};
  }
  function settle(s,run,result){
    if(!run||run.done||s.hero!==run.hero||run.lastSettled===run.floor)return false;
    run.lastSettled=run.floor;run.kills+=Math.max(0,result.kills||0);run.time+=Math.max(0,result.time||0);
    if(result.victory){if(window.SevenBestiaryRules)window.SevenBestiaryRules.unlockFloor(s,run.floor);run.cleared++;const first=run.floor>highest(s);s.tower={highest:Math.max(highest(s),run.floor)};const r=reward(run.floor);if(first&&run.floor%5===0){r.item=window.JourneyRules.growthItems[(Math.floor(run.floor/5)-1)%window.JourneyRules.growthItems.length].id;window.JourneyRules.grantItem(s,r.item);}window.JourneyRules.reward(s,r);run.gold=Math.min(Number.MAX_SAFE_INTEGER,run.gold+r.gold);run.xp=Math.min(Number.MAX_SAFE_INTEGER,run.xp+r.xp);run.latestReward=r;}
    else {run.done=true;run.latestReward=null;}
    return true;
  }
  window.SevenTower={maxFloor,rewardSafe,rewardProfile,xpBenchmark,families,themes,mythics,mythicFor,floor,highest,unlocked,checkpoint,encounter,createRun,reward,settle};
})();
