/* Per-hero clear ledger. Catalogue descriptors point to the real battle renderers. */
(() => {
  'use strict';
  const entries=Object.freeze([
  {
    "id": "beast-wolf",
    "name": "霜鬃狼",
    "kind": "species",
    "family": "beast",
    "skinId": "beast-wolf",
    "mythicId": null,
    "firstFloor": 1
  },
  {
    "id": "beast-ape",
    "name": "铁臂猿",
    "kind": "species",
    "family": "beast",
    "skinId": "beast-ape",
    "mythicId": null,
    "firstFloor": 1
  },
  {
    "id": "beast-pangolin",
    "name": "岩甲穿山兽",
    "kind": "species",
    "family": "beast",
    "skinId": "beast-pangolin",
    "mythicId": null,
    "firstFloor": 1
  },
  {
    "id": "beast-horn",
    "name": "双角狰",
    "kind": "species",
    "family": "beast",
    "skinId": "beast-horn",
    "mythicId": null,
    "firstFloor": 1
  },
  {
    "id": "guardian-beast",
    "name": "裂岩兽王",
    "kind": "guardian",
    "family": "beast",
    "skinId": null,
    "mythicId": null,
    "firstFloor": 1
  },
  {
    "id": "yao-flower",
    "name": "噬灵花",
    "kind": "species",
    "family": "yao",
    "skinId": "yao-flower",
    "mythicId": null,
    "firstFloor": 2
  },
  {
    "id": "yao-fox",
    "name": "三尾妖狐",
    "kind": "species",
    "family": "yao",
    "skinId": "yao-fox",
    "mythicId": null,
    "firstFloor": 2
  },
  {
    "id": "yao-mantis",
    "name": "碧镰螳妖",
    "kind": "species",
    "family": "yao",
    "skinId": "yao-mantis",
    "mythicId": null,
    "firstFloor": 2
  },
  {
    "id": "yao-mushroom",
    "name": "赤伞菌妖",
    "kind": "species",
    "family": "yao",
    "skinId": "yao-mushroom",
    "mythicId": null,
    "firstFloor": 2
  },
  {
    "id": "guardian-yao",
    "name": "千藤妖魁",
    "kind": "guardian",
    "family": "yao",
    "skinId": null,
    "mythicId": null,
    "firstFloor": 2
  },
  {
    "id": "evil-idol",
    "name": "碎面邪像",
    "kind": "species",
    "family": "evil",
    "skinId": "evil-idol",
    "mythicId": null,
    "firstFloor": 3
  },
  {
    "id": "evil-blades",
    "name": "双刃剑煞",
    "kind": "species",
    "family": "evil",
    "skinId": "evil-blades",
    "mythicId": null,
    "firstFloor": 3
  },
  {
    "id": "evil-eye",
    "name": "悬瞳邪眼",
    "kind": "species",
    "family": "evil",
    "skinId": "evil-eye",
    "mythicId": null,
    "firstFloor": 3
  },
  {
    "id": "evil-puppet",
    "name": "缚咒木偶",
    "kind": "species",
    "family": "evil",
    "skinId": "evil-puppet",
    "mythicId": null,
    "firstFloor": 3
  },
  {
    "id": "guardian-evil",
    "name": "噬心邪核",
    "kind": "guardian",
    "family": "evil",
    "skinId": null,
    "mythicId": null,
    "firstFloor": 3
  },
  {
    "id": "ghost-wisp",
    "name": "寒魄幽魂",
    "kind": "species",
    "family": "ghost",
    "skinId": "ghost-wisp",
    "mythicId": null,
    "firstFloor": 4
  },
  {
    "id": "ghost-lantern",
    "name": "青火灯鬼",
    "kind": "species",
    "family": "ghost",
    "skinId": "ghost-lantern",
    "mythicId": null,
    "firstFloor": 4
  },
  {
    "id": "ghost-armor",
    "name": "无首甲魂",
    "kind": "species",
    "family": "ghost",
    "skinId": "ghost-armor",
    "mythicId": null,
    "firstFloor": 4
  },
  {
    "id": "ghost-banner",
    "name": "招魂幡灵",
    "kind": "species",
    "family": "ghost",
    "skinId": "ghost-banner",
    "mythicId": null,
    "firstFloor": 4
  },
  {
    "id": "guardian-ghost",
    "name": "幽冥鬼王",
    "kind": "guardian",
    "family": "ghost",
    "skinId": null,
    "mythicId": null,
    "firstFloor": 4
  },
  {
    "id": "mythic-kui",
    "name": "夔牛",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "kui",
    "firstFloor": 10
  },
  {
    "id": "mythic-qinglong",
    "name": "青龙",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "qinglong",
    "firstFloor": 15
  },
  {
    "id": "mythic-xuanwu",
    "name": "玄武",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "xuanwu",
    "firstFloor": 20
  },
  {
    "id": "mythic-baihu",
    "name": "白虎",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "baihu",
    "firstFloor": 25
  },
  {
    "id": "mythic-bifang",
    "name": "毕方",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "bifang",
    "firstFloor": 30
  },
  {
    "id": "mythic-zhuque",
    "name": "朱雀",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "zhuque",
    "firstFloor": 35
  },
  {
    "id": "mythic-yinglong",
    "name": "应龙",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "yinglong",
    "firstFloor": 40
  },
  {
    "id": "mythic-qilin",
    "name": "麒麟",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "qilin",
    "firstFloor": 45
  },
  {
    "id": "mythic-baize",
    "name": "白泽",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "baize",
    "firstFloor": 50
  },
  {
    "id": "mythic-xiezhi",
    "name": "獬豸",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "xiezhi",
    "firstFloor": 55
  },
  {
    "id": "mythic-pixiu",
    "name": "貔貅",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "pixiu",
    "firstFloor": 60
  },
  {
    "id": "mythic-luwu",
    "name": "陆吾",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "luwu",
    "firstFloor": 65
  },
  {
    "id": "mythic-taotie",
    "name": "饕餮",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "taotie",
    "firstFloor": 70
  },
  {
    "id": "mythic-hundun",
    "name": "混沌",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "hundun",
    "firstFloor": 75
  },
  {
    "id": "mythic-taowu",
    "name": "梼杌",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "taowu",
    "firstFloor": 80
  },
  {
    "id": "mythic-qiongqi",
    "name": "穷奇",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "qiongqi",
    "firstFloor": 85
  },
  {
    "id": "mythic-jiuwei",
    "name": "九尾狐",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "jiuwei",
    "firstFloor": 90
  },
  {
    "id": "mythic-chenghuang",
    "name": "乘黄",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "chenghuang",
    "firstFloor": 95
  },
  {
    "id": "mythic-zheng",
    "name": "狰",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "zheng",
    "firstFloor": 100
  },
  {
    "id": "mythic-bo",
    "name": "驳",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "bo",
    "firstFloor": 105
  },
  {
    "id": "mythic-fenghuang",
    "name": "凤凰",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "fenghuang",
    "firstFloor": 110
  },
  {
    "id": "mythic-jinwu",
    "name": "金乌",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "jinwu",
    "firstFloor": 115
  },
  {
    "id": "mythic-kun",
    "name": "鲲",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "kun",
    "firstFloor": 120
  },
  {
    "id": "mythic-zhulong",
    "name": "烛龙",
    "kind": "mythic",
    "family": null,
    "skinId": null,
    "mythicId": "zhulong",
    "firstFloor": 125
  }
].map(Object.freeze));
  const byId=new Map(entries.map(e=>[e.id,e]));
  const families=['beast','yao','evil','ghost'];
  const mythics=entries.filter(e=>e.kind==='mythic');
  const empty=()=>({version:1,unlocked:[],legacyMigrated:false});
  // Fixed catalogue scan, never iterate to an imported highest floor.
  function normalize(raw,highest=0){
    const out=empty(),valid=Array.isArray(raw?.unlocked)?raw.unlocked:[];
    const seen=new Set(valid.filter(id=>typeof id==='string'&&byId.has(id)));
    if(raw?.version!==1){
      const n=Number(highest),top=Number.isFinite(n)?Math.max(0,Math.floor(n)):0;
      for(const e of entries)if(e.kind!=='mythic'&&e.firstFloor<=top)seen.add(e.id);
      ['kui','xuanwu','bifang','yinglong'].forEach((id,i)=>{if(top>=(i+1)*10)seen.add('mythic-'+id);});
      out.legacyMigrated=top>0;
    }else out.legacyMigrated=raw.legacyMigrated===true;
    out.unlocked=entries.filter(e=>seen.has(e.id)).map(e=>e.id);return out;
  }
  function entriesForFloor(n){
    if(!Number.isSafeInteger(n)||n<1||n>Number.MAX_SAFE_INTEGER-2)return [];
    const family=families[(n-1)%4],mythic=n>=10&&n%5===0?mythics[((n-10)/5)%mythics.length]:null;
    return entries.filter(e=>(e.kind==='species'&&e.family===family)||(mythic?e===mythic:e.kind==='guardian'&&e.family===family));
  }
  function unlockFloor(state,n){
    if(!state)return [];
    const ledger=normalize(state.bestiary,state.tower?.highest),seen=new Set(ledger.unlocked),added=[];
    for(const e of entriesForFloor(n))if(!seen.has(e.id)){seen.add(e.id);added.push(e.id);}
    ledger.unlocked=entries.filter(e=>seen.has(e.id)).map(e=>e.id);state.bestiary=ledger;return added;
  }
  const isUnlocked=(state,id)=>byId.has(id)&&Array.isArray(state?.bestiary?.unlocked)&&state.bestiary.unlocked.includes(id);
  window.SevenBestiaryRules=Object.freeze({entries,empty,normalize,entriesForFloor,unlockFloor,isUnlocked,get:id=>byId.get(id)||null});
})();
