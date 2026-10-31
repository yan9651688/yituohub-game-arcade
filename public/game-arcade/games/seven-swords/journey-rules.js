/* 七剑江湖 v9 · 七侠传记与江湖生活。存档格式保留 version:4，life 为独立角色的可选扩展。 */
(() => {
  'use strict';
  const C=window.CANON_DATA,D=window.GAME_DATA;
  const ids=()=>D.heroes.map(h=>h.id),validHero=id=>ids().includes(id)&&C.heroes[id];
  const clone=x=>JSON.parse(JSON.stringify(x));
  const bounded=(n,a,b,f=a)=>Number.isFinite(Number(n))?Math.min(b,Math.max(a,Math.floor(Number(n)))):f;
  const profileKeys=['hero','initialHero','level','xp','gold','herbs','supplies','loadout','permanent','nourishment','virtue','upgrade','current','visited','completed','sides','recruited','journal','day','battles','victories','ending','progress','sword','bag','world','life','tower','bestiary','startedAt'];
  const xpNeed=level=>85+(level-1)*25;
  // Arithmetic safety only, not a reachable gameplay cap. All bonuses stay additive.
  const growthSafe=Math.floor(Number.MAX_SAFE_INTEGER/1024);
  const postgame=s=>!!s&&validHero(s.hero)&&(s.progress?.step||0)>=C.heroes[s.hero].chapters.length;
  const permanentLimit=s=>postgame(s)?growthSafe:5;
  const cultivationNeed=rank=>300+60*bounded(rank,0,growthSafe);
  // One root ledger for all seven heroes. Profile snapshots never own this value.
  const cultivationProgress=s=>s?.cultivation||{rank:0,xp:0};
  function cleanCultivation(raw){const rank=bounded(raw?.rank,0,growthSafe);return {rank,xp:rank>=growthSafe?0:bounded(raw?.xp,0,cultivationNeed(rank)-1)};}
  function gainCultivation(s,amount){
    if(!postgame(s)||s.level<15)return 0;
    return advanceCultivation(s.cultivation||(s.cultivation={rank:0,xp:0}),amount);
  }
  function advanceCultivation(c,amount){
    c.rank=bounded(c.rank,0,growthSafe);
    const total=Math.min(Number.MAX_SAFE_INTEGER,bounded(c.xp,0,Number.MAX_SAFE_INTEGER)+bounded(amount,0,Number.MAX_SAFE_INTEGER));
    // Binary search an arithmetic series: even enormous imported rewards cannot hang.
    const cost=n=>n*(300+60*c.rank+30*(n-1));
    let lo=0,hi=Math.min(growthSafe-c.rank,Math.floor(total/cultivationNeed(c.rank)));
    while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(cost(mid)<=total)lo=mid;else hi=mid-1;}
    c.xp=c.rank+lo>=growthSafe?0:Math.max(0,total-cost(lo));c.rank+=lo;return lo;
  }
  function growthBonuses(s){const c=postgame(s)?s.cultivation:null,n=postgame(s)?s.nourishment:null;return {hp:10*bounded(c?.rank,0,growthSafe)+bounded(n?.vitality,0,growthSafe),attack:2*bounded(c?.rank,0,growthSafe)+bounded(n?.attack,0,growthSafe),technique:bounded(n?.technique,0,growthSafe)};}

  function chapter(s){return C.heroes[s.hero]?.chapters[s.progress.step]||null;}
  function createProfile(hero){
    const h=C.heroes[hero];if(!h)throw new Error('未知剑侠');
    return {hero,initialHero:hero,level:1,xp:0,gold:90,herbs:3,supplies:{},loadout:['herb',null,null,null,null],permanent:{attack:0,vitality:0},cultivation:{rank:0,xp:0},nourishment:{attack:0,vitality:0,technique:0},virtue:0,upgrade:{attack:0,vitality:0,mastery:0},current:h.startRegion,visited:[h.startRegion],completed:[],sides:[],recruited:[hero],journal:[],day:1,battles:0,victories:0,ending:false,progress:{step:0,chapters:[],encounters:[],logs:[]},sword:{id:'sword-'+hero,owner:hero,...clone(h.initialSword),technique:h.initialSword.technique||h.skillName},bag:{},life:createLife(),tower:{highest:0},bestiary:{version:1,unlocked:[],legacyMigrated:false},startedAt:Date.now()};
  }
  function create(hero,difficulty='normal'){return {version:4,cultivationShared:1,difficulty:['story','normal','heroic'].includes(difficulty)?difficulty:'normal',profiles:{},...createProfile(hero)};}
  function record(s){const p={};for(const key of profileKeys)if(s[key]!==undefined)p[key]=clone(s[key]);s.profiles=s.profiles||{};s.profiles[s.hero]=p;s.cultivationShared=1;return s;}
  function switchHero(s,hero){if(!validHero(hero))return false;record(s);const next=s.profiles[hero]?clone(s.profiles[hero]):createProfile(hero);delete next.cultivation;for(const key of profileKeys)delete s[key];Object.assign(s,next);return true;}
  function restart(s,hero=s.hero){if(!validHero(hero))return false;record(s);const fresh=createProfile(hero);delete fresh.cultivation;s.profiles[hero]=clone(fresh);for(const key of profileKeys)delete s[key];Object.assign(s,fresh);return true;}
  function log(s,title,text){s.journal.unshift({day:s.day,title,text});s.journal=s.journal.slice(0,240);}
  function reward(s,r={}){const before=s.level;for(const k of ['gold','xp','herbs','virtue'])s[k]=Math.min(Number.MAX_SAFE_INTEGER,Math.max(0,(Number.isFinite(s[k])?s[k]:0)+(Number.isFinite(Number(r[k]))?Number(r[k]):0)));while(s.level<15&&s.xp>=xpNeed(s.level)){s.xp-=xpNeed(s.level);s.level++;}if(s.level===15){gainCultivation(s,s.xp);s.xp=0;}return s.level-before;}
  function grantItem(s,id,count=1){if(id)s.bag[id]=Math.max(0,(s.bag[id]||0)+Math.floor(count));}
  function applyAfter(s,a={}){
    if(a.swordStatus)s.sword.status=a.swordStatus;if(a.hand)s.sword.hand=a.hand;
    if(typeof a.ultimateUnlocked==='boolean')s.sword.ultimateUnlocked=a.ultimateUnlocked;
    if(a.weaponName)s.sword.weaponName=a.weaponName;if(a.technique)s.sword.technique=a.technique;if(a.item)grantItem(s,a.item);
    s.sword.id='sword-'+s.hero;s.sword.owner=s.hero;
  }
  function complete(s,id,choice=''){
    const ch=chapter(s);if(!ch||ch.id!==id||s.progress.chapters.includes(id))return null;
    s.progress.chapters.push(id);s.progress.step++;s.progress.logs.push({id,choice,at:Date.now()});s.day++;
    if(!s.completed.includes(ch.region))s.completed.push(ch.region);applyAfter(s,ch.after);
    const levels=reward(s,ch.reward);log(s,ch.title,ch.outcome);
    s.ending=s.progress.step>=C.heroes[s.hero].chapters.length;
    if(s.life)s.life.companions=s.life.companions.filter(id=>availableCompanions(s).some(h=>h.id===id));
    return {chapter:ch,levels,next:chapter(s),ending:s.ending};
  }
  function encounter(s,id,choice=''){
    const e=C.encounters.find(e=>e.id===id);if(!e||s.progress.encounters.includes(id))return null;
    s.progress.encounters.push(id);s.sides.push(id);s.day++;const levels=reward(s,e.reward);
    if(e.item)grantItem(s,e.item);if(e.after)applyAfter(s,e.after);
    log(s,e.title,e.outcome||e.text||choice);return {encounter:e,levels};
  }
  const upgradeCost=n=>65+n*45;
  function upgrade(s,kind){if(!['attack','vitality','mastery'].includes(kind)||s.upgrade[kind]>=5)return false;const cost=upgradeCost(s.upgrade[kind]);if(s.gold<cost)return false;s.gold-=cost;s.upgrade[kind]++;return true;}
  // Item counts are per hero. Legacy herbs remain the sole source for 回春散.
  const supplies=[
    {id:'herb',name:'回春散',price:35,stage:0,heal:.42,cap:12,description:'回复 42% 最大气血。'},
    {id:'small-return',name:'小还丹',price:85,stage:2,heal:.65,cap:8,description:'回复 65% 最大气血。'},
    {id:'great-return',name:'大还丹',price:120,stage:4,heal:1,energy:25,cap:5,description:'回复全部气血，并恢复 25 点剑意。'},
    {id:'tiger-wine',name:'虎骨酒',price:85,stage:2,buff:'attack',duration:15,cap:6,description:'15 秒内基础攻击 +25%；同类不可叠加，生效时不能重复使用。'},
    {id:'guardian-pill',name:'护心丹',price:85,stage:2,buff:'guard',duration:15,cap:6,description:'15 秒内受到伤害降低 30%；同类不可叠加，生效时不能重复使用。'},
    {id:'strength-pill',name:'培元丹',price:260,stage:4,buff:'attack',rate:.4,duration:20,permanent:'attack',amount:3,cap:5,description:'20 秒攻击 +40%；另附永久攻击 +3（通关前最多 5 次，通关后解除永久成长次数限制），达到上限仍保留战斗增益。'},
    {id:'vitality-pill',name:'固本丹',price:260,stage:4,heal:1,energy:40,permanent:'vitality',amount:12,cap:5,description:'回满气血并补 40 点剑意；另附永久最大气血 +12（通关前最多 5 次，通关后解除永久成长次数限制），达到上限仍保留恢复效果。'}
  ];
  const supply=id=>supplies.find(i=>i.id===id);
  const supplyCount=(s,id)=>id==='herb'?s.herbs||0:s.supplies?.[id]||0;
  const supplyPrice=(s,id)=>supply(id)?.price||0;
  function buySupply(s,id){const i=supply(id);if(!i||(s.progress?.step||0)<i.stage)return false;const n=supplyCount(s,id),cost=supplyPrice(s,id);if(n>=i.cap||s.gold<cost)return false;s.gold-=cost;if(id==='herb')s.herbs++;else{ s.supplies=s.supplies||{};s.supplies[id]=n+1;}return true;}
  function equipSupply(s,slot,id){if(!Number.isInteger(slot)||slot<0||slot>4||id!==null&&!supply(id))return false;s.loadout=s.loadout||['herb',null,null,null,null];if(id)s.loadout=s.loadout.map(v=>v===id?null:v);s.loadout[slot]=id;return true;}
  function consumeSupply(s,id){const i=supply(id);if(!i||supplyCount(s,id)<=0)return false;if(id==='herb')s.herbs--;else s.supplies[id]--;let bonus=0;if(i.permanent){s.permanent=s.permanent||{attack:0,vitality:0};if(s.permanent[i.permanent]<permanentLimit(s)){s.permanent[i.permanent]++;bonus=i.amount;}}return {id,bonus};}

  const growthItems=[
    {id:'spirit-ginseng',name:'灵参膏',price:160,stat:'vitality',amount:8,description:'静养时服用，永久最大气血 +8。仅在行囊中使用。'},
    {id:'red-ganoderma',name:'赤玉芝',price:220,stat:'attack',amount:2,description:'静养时服用，永久攻击 +2。仅在行囊中使用。'},
    {id:'sword-insight',name:'剑意札',price:180,stat:'technique',amount:1,description:'参悟剑理，永久剑招攻击基数 +1。仅在行囊中使用，不缩短冷却。'}
  ];
  const growthItem=id=>growthItems.find(i=>i.id===id);
  function buyGrowthItem(s,id){const i=growthItem(id);if(!i||!postgame(s)||s.gold<i.price||(s.bag?.[id]||0)>=9999)return false;s.gold-=i.price;s.bag=s.bag||{};s.bag[id]=(s.bag[id]||0)+1;return true;}
  function useGrowthItem(s,id){const i=growthItem(id);if(!i||!postgame(s)||!(s.bag?.[id]>0))return false;s.nourishment=s.nourishment||{attack:0,vitality:0,technique:0};const old=bounded(s.nourishment[i.stat],0,growthSafe);if(old>growthSafe-i.amount)return false;s.bag[id]--;s.nourishment[i.stat]=old+i.amount;return {id,stat:i.stat,amount:i.amount};}
  function stats(s,heroId=s.hero){const h=D.heroes.find(h=>h.id===heroId)||D.heroes.find(h=>h.id===s.hero),g=growthBonuses(s),limit=permanentLimit(s);return{hp:h.hp+9*(s.level-1)+20*s.upgrade.vitality+12*bounded(s.permanent?.vitality,0,limit)+g.hp,attack:h.attack+2.3*(s.level-1)+4.5*s.upgrade.attack+3*bounded(s.permanent?.attack,0,limit)+g.attack,power:1+.12*s.upgrade.mastery,cooldown:1-.075*s.upgrade.mastery,technique:g.technique};}

  function cleanProfile(raw,hero){
    if(!raw||!validHero(hero))return null;const p=createProfile(hero),H=C.heroes[hero];
    for(const k of ['level','xp','gold','herbs','virtue','day','battles','victories'])p[k]=bounded(raw[k],k==='level'||k==='day'?1:0,k==='level'?15:k==='gold'?Number.MAX_SAFE_INTEGER:1000000,p[k]);
    p.xp=p.level===15?0:bounded(raw.xp,0,xpNeed(p.level)-1);
    for(const k of ['attack','vitality','mastery'])p.upgrade[k]=bounded(raw.upgrade?.[k],0,5);

    for(const i of supplies)if(i.id!=='herb')p.supplies[i.id]=bounded(raw.supplies?.[i.id],0,i.cap);
    if(Array.isArray(raw.loadout)){const seen=new Set();p.loadout=Array.from({length:5},(_,n)=>{const id=raw.loadout[n],i=supply(id);if(!i||seen.has(id))return null;seen.add(id);return id;});}
    p.current=D.locations.some(l=>l.id===raw.current)?raw.current:p.current;
    p.visited=[...new Set([p.current,...(Array.isArray(raw.visited)?raw.visited:[])].filter(id=>D.locations.some(l=>l.id===id)))];
    p.progress.step=bounded(raw.progress?.step,0,H.chapters.length);
    p.progress.chapters=H.chapters.slice(0,p.progress.step).map(c=>c.id);
    for(const k of ['attack','vitality'])p.permanent[k]=bounded(raw.permanent?.[k],0,permanentLimit(p));
    if(postgame(p)){p.cultivation={rank:bounded(raw.cultivation?.rank,0,growthSafe),xp:0};if(p.level===15)p.cultivation.xp=bounded(raw.cultivation?.xp,0,cultivationNeed(p.cultivation.rank)-1);else p.cultivation.rank=0;for(const k of ['attack','vitality','technique'])p.nourishment[k]=bounded(raw.nourishment?.[k],0,growthSafe);}
    p.progress.encounters=[...new Set((Array.isArray(raw.progress?.encounters)?raw.progress.encounters:[]).filter(id=>C.encounters.some(e=>e.id===id)))];
    p.progress.logs=(Array.isArray(raw.progress?.logs)?raw.progress.logs:[]).filter(l=>l&&typeof l==='object').slice(0,H.chapters.length).map(l=>({id:String(l.id||''),choice:String(l.choice||'').slice(0,120),at:bounded(l.at,0,1e15)}));
    for(const ch of H.chapters.slice(0,p.progress.step))applyAfter(p,ch.after);
    p.completed=[...new Set(H.chapters.slice(0,p.progress.step).map(c=>c.region))];p.sides=p.progress.encounters.slice();p.ending=p.progress.step>=H.chapters.length;
    p.journal=(Array.isArray(raw.journal)?raw.journal:[]).filter(j=>j&&typeof j==='object').slice(0,240).map(j=>({day:bounded(j.day,1,1000000),title:String(j.title||'江湖记事').slice(0,120),text:String(j.text||'').slice(0,2500)}));
    const itemIds=new Set([...C.items,...growthItems].map(i=>i.id));for(const [id,n]of Object.entries(raw.bag||{}))if(itemIds.has(id)&&bounded(n,0,9999)>0)p.bag[id]=bounded(n,0,9999);
    const w=raw.world;
    if(w&&typeof w==='object'){
      const point=q=>q&&Number.isFinite(q.x)&&Number.isFinite(q.y)&&q.x>=20&&q.x<=5600&&q.y>=20&&q.y<=4000?{x:q.x,y:q.y,dir:Number.isFinite(q.dir)?q.dir:Math.PI/2}:null;
      const positions={};for(const l of D.locations){const q=point(w.positions?.[l.id]);if(q)positions[l.id]=q;}
      const finds=new Set(D.locations.flatMap(l=>[l.id+'-wild-1',l.id+'-wild-2']));
      p.world={format:3,region:p.current,positions,zoom:Number.isFinite(w.zoom)?Math.max(.65,Math.min(1.5,w.zoom)):1,finds:[...new Set((Array.isArray(w.finds)?w.finds:[]).filter(id=>finds.has(id)))],seen:[...new Set((Array.isArray(w.seen)?w.seen:[]).filter(id=>typeof id==='string'&&id.length<80))],distance:bounded(w.distance,0,1e8),...(w.region===p.current?point(w)||{}:{})};
    }
    p.life=cleanLife(raw.life,p);
    p.tower={highest:bounded(raw.tower?.highest,0,Number.MAX_SAFE_INTEGER-2)};
    if(window.SevenBestiaryRules)p.bestiary=window.SevenBestiaryRules.normalize(raw.bestiary,p.tower.highest);
    p.startedAt=bounded(raw.startedAt,0,1e15,Date.now());return p;
  }
  function normalize(raw){
    if(!raw||raw.version!==4||!validHero(raw.hero))return null;
    const p=cleanProfile(raw,raw.hero);if(!p)return null;const s={version:4,difficulty:['story','normal','heroic'].includes(raw.difficulty)?raw.difficulty:'normal',profiles:{},...p};
    for(const id of ids())if(raw.profiles?.[id]){const q=cleanProfile(raw.profiles[id],id);if(q)s.profiles[id]=q;}
    // v33 and earlier kept separate ledgers. Preserve each distinct hero's earned
    // XP, but count root/profile snapshots of the active hero only once (higher
    // valid progress wins). After migration, the root ledger is authoritative.
    if(raw.cultivationShared===1)s.cultivation=cleanCultivation(raw.cultivation);
    else{
      const ledgers=new Map(Object.entries(s.profiles).map(([id,q])=>[id,q.cultivation]));
      const old=ledgers.get(s.hero),active=s.cultivation;
      if(!old||active.rank>old.rank||active.rank===old.rank&&active.xp>old.xp)ledgers.set(s.hero,active);
      let total=0;for(const c of ledgers.values()){
        const earned=Math.min(Number.MAX_SAFE_INTEGER,c.rank*(300+30*(c.rank-1))+c.xp);
        total=Math.min(Number.MAX_SAFE_INTEGER,total+earned);
      }
      s.cultivation={rank:0,xp:0};advanceCultivation(s.cultivation,total);
    }
    s.cultivationShared=1;for(const q of Object.values(s.profiles))delete q.cultivation;
    if(raw.legacyNotice)s.legacyNotice=String(raw.legacyNotice).slice(0,500);return s;
  }
  function migrate(raw){
    if(raw?.version===4)return normalize(raw);
    if(raw?.version!==1||!validHero(raw.hero))return null;
    const s=create(raw.hero,raw.difficulty);
    s.level=bounded(raw.level,1,15);s.xp=s.level===15?0:bounded(raw.xp,0,xpNeed(s.level)-1);s.gold=bounded(raw.gold,0,Number.MAX_SAFE_INTEGER,90);s.herbs=bounded(raw.herbs,0,1000000,3);s.virtue=bounded(raw.virtue,0,1000000);
    for(const k of ['attack','vitality','mastery'])s.upgrade[k]=bounded(raw.upgrade?.[k],0,5);
    s.legacyNotice='旧版平行江湖已封存。'+D.heroes.find(h=>h.id===s.hero).name+'的修为、铜钱和药品已接续；原著传记从角色起点展开，七侠各自保存进度。';
    log(s,'重启原著传记',s.legacyNotice);return s;
  }
  const lifePlace=region=>C.life?.places.find(p=>p.region===region)||null;
  function createLife(){return {version:1,companions:[],energy:0,intel:[],talked:[],commissions:{},patrols:{},runSeq:0,activeRun:null,settled:[],earned:0,spent:0};}
  function ensureLife(s){if(!s)return null;if(s.life?.version!==1)s.life=createLife();return s.life;}
  function availableCompanions(s){
    if(!s)return[];const step=s.progress?.step||0,seen=new Set();
    return (C.life?.companionWindows[s.hero]||[]).filter(r=>r.id!==s.hero&&validHero(r.id)&&step>=r.minStep&&(r.maxStep===undefined||step<=r.maxStep)).filter(r=>{if(seen.has(r.id))return false;seen.add(r.id);return true;}).map(r=>({...r}));
  }
  function commissionSpec(id){
    for(const p of C.life?.places||[])for(const k of C.life?.commissionKinds||[])if(id==='commission-'+p.region+'-'+k.id)return {...k,id,region:p.region,place:p.name,host:p.host,title:k.id==='find'?'寻回'+p.lostItem:k.title,clue:p.clue,options:p.options,answer:p.answer,lostItem:p.lostItem};
    return null;
  }
  function cleanLife(raw,s,now=Date.now()){
    const l=createLife();if(!raw||typeof raw!=='object')return l;
    const list=v=>Array.isArray(v)?v:[],regions=(C.life?.places||[]).map(p=>p.region),allowed=new Set(availableCompanions(s).map(h=>h.id));
    l.companions=[...new Set(list(raw.companions).filter(id=>allowed.has(id)))].slice(0,2);
    l.energy=bounded(raw.energy,0,30);l.intel=[...new Set(list(raw.intel).filter(id=>regions.includes(id)))];
    l.talked=[...new Set(list(raw.talked).filter(id=>typeof id==='string'&&id.length<100))].slice(-160);
    l.runSeq=bounded(raw.runSeq,0,1e9);l.earned=bounded(raw.earned,0,1e9);l.spent=bounded(raw.spent,0,1e9);
    l.settled=[...new Set(list(raw.settled).filter(id=>typeof id==='string'&&/^life-[a-z]+-\d+$/.test(id)))].slice(-64);
    let hasActive=false;
    for(const p of C.life?.places||[]){
      const old=raw.patrols?.[p.region];if(old)l.patrols[p.region]={wins:bounded(old.wins,0,1e7),availableAt:bounded(old.availableAt,0,now+(C.life?.patrolCooldownMs||20000))};
      for(const kind of C.life?.commissionKinds||[]){
        const id='commission-'+p.region+'-'+kind.id,q=raw.commissions?.[id];if(!q||!['active','done'].includes(q.status)||q.status==='active'&&hasActive)continue;
        l.commissions[id]={status:q.status,level:bounded(q.level,1,15,s.level),acceptedAt:bounded(q.acceptedAt,0,now),finishedAt:bounded(q.finishedAt,0,now),clueSeen:!!q.clueSeen};if(q.status==='active')hasActive=true;
      }
    }
    // A browser reload cannot resume a running battle. Keep its sequence and rewards ledger,
    // but drop the unfinished runtime token so no stale callback can pay it after migration.
    l.activeRun=null;return l;
  }
  function toggleCompanion(s,id){
    const l=ensureLife(s);if(!l)return false;
    if(l.companions.includes(id)){l.companions=l.companions.filter(x=>x!==id);return true;}
    if(l.companions.length>=2||!availableCompanions(s).some(h=>h.id===id))return false;
    l.companions.push(id);return true;
  }
  function buyLife(s,id,region=s?.current){
    const l=ensureLife(s),place=lifePlace(region),offer=C.life?.services.find(x=>x.id===id);
    if(!l||!place||!offer||s.current!==region||offer.id==='wine'&&!['wine','inn'].includes(place.venue)||s.gold<offer.price)return null;
    const herbs=Math.min(offer.herbs,Math.max(0,12-s.herbs)),energy=Math.max(l.energy,offer.energy),newIntel=['tea','feast','wine'].includes(id)&&!l.intel.includes(region);
    if(!herbs&&energy===l.energy&&!newIntel)return null;
    s.gold-=offer.price;s.herbs+=herbs;l.energy=energy;l.spent+=offer.price;if(newIntel){l.intel.push(region);const id='commission-'+region+'-find';if(l.commissions[id]?.status==='active')l.commissions[id].clueSeen=true;}
    log(s,place.name+' · '+offer.name,'花费 '+offer.price+' 文。'+(herbs?'收好回春散 '+herbs+' 份。':'')+(offer.energy?'歇脚时积下的剑意，留到下一场实战。':''));
    return {offer,place,herbs,energy,newIntel};
  }
  function takeLifeEnergy(s){const l=ensureLife(s),n=l?.energy||0;if(l)l.energy=0;return n;}
  function restoreLifeEnergy(s,n){const l=ensureLife(s);if(l)l.energy=Math.max(l.energy,bounded(n,0,30));}
  function activeCommission(s){const l=ensureLife(s);return l?Object.keys(l.commissions).find(id=>l.commissions[id].status==='active')||null:null;}
  function commissionReward(s,spec){const level=ensureLife(s)?.commissions[spec.id]?.level||s.level,index=(C.life?.places||[]).findIndex(p=>p.region===spec.region);return {gold:spec.gold+Math.max(0,index)*5+level*4,xp:spec.xp+level*9};}
  function acceptCommission(s,id,now=Date.now()){
    const l=ensureLife(s),spec=commissionSpec(id);if(!l||!spec||s.current!==spec.region||l.commissions[id]||activeCommission(s))return null;
    l.commissions[id]={status:'active',level:s.level,acceptedAt:now,finishedAt:0,clueSeen:l.intel.includes(spec.region)};
    log(s,'接下委托 · '+spec.title,'只在'+spec.place+'所在区域办理即可；办妥就地交差，不必再回来。');return spec;
  }
  function abandonCommission(s,id){const l=ensureLife(s);if(l?.commissions[id]?.status!=='active'||l.activeRun)return false;delete l.commissions[id];return true;}
  function observeCommission(s,id){const l=ensureLife(s),spec=commissionSpec(id);if(!spec||spec.id.split('-').at(-1)!=='find'||s.current!==spec.region||l?.commissions[id]?.status!=='active')return null;l.commissions[id].clueSeen=true;return spec.clue;}
  function completeCommission(s,id){
    const l=ensureLife(s),spec=commissionSpec(id),q=l?.commissions[id];if(!spec||q?.status!=='active')return null;
    const earned=commissionReward(s,spec);q.status='done';q.finishedAt=Date.now();l.earned+=earned.gold;
    const levels=reward(s,earned);log(s,'当场交差 · '+spec.title,'委托已在交差处结清，收得 '+earned.gold+' 文；不必再回歇脚处。');return {spec,reward:earned,levels};
  }
  function findCommission(s,id,choice){
    const l=ensureLife(s),spec=commissionSpec(id),q=l?.commissions[id];if(!spec||spec.count!==0||s.current!==spec.region||q?.status!=='active'||!q.clueSeen)return null;
    if(!Number.isInteger(choice)||choice!==spec.answer)return {wrong:true,clue:spec.clue};return completeCommission(s,id);
  }
  function patrolStatus(s,region=s?.current,now=Date.now()){
    const old=ensureLife(s)?.patrols[region]||{wins:0,availableAt:0};return {wins:old.wins,cooldownLeft:Math.max(0,Math.ceil((old.availableAt-now)/1000))};
  }
  function beginLifeBattle(s,targetId,now=Date.now()){
    const l=ensureLife(s);if(!l||l.activeRun)return null;
    const patrol=targetId==='patrol-'+s.current,quest=commissionSpec(targetId),place=lifePlace(s.current);
    if(!place||!patrol&&(!quest||!quest.count||quest.region!==s.current||l.commissions[targetId]?.status!=='active'))return null;
    if(patrol&&patrolStatus(s,s.current,now).cooldownLeft>0)return null;
    const status=patrolStatus(s,s.current,now),count=patrol?16+Math.min(4,Math.floor(s.level/4)):quest.count;
    const earned=patrol?{gold:35+5*s.level,xp:52+11*s.level,...((status.wins+1)%3===0?{herbs:1}:{})}:commissionReward(s,quest);
    const token={id:'life-'+s.hero+'-'+(++l.runSeq),hero:s.hero,kind:patrol?'patrol':'commission',targetId,region:s.current,reward:earned,at:now};l.activeRun=clone(token);
    return {token,encounter:{region:s.current,name:patrol?'山道流寇':quest.title,profile:patrol?'ambush':quest.profile,danger:Math.max(1,Math.min(5,Math.ceil(s.level/3))),total:count,maxLiving:count,spawnPolicy:'initial-only',exploration:true,faction:'bandit'}};
  }
  function abortLifeBattle(s,id){const l=ensureLife(s);if(!l?.activeRun||l.activeRun.id!==id)return false;l.activeRun=null;return true;}
  function settleLifeBattle(s,id,result={},now=Date.now()){
    const l=ensureLife(s),run=l?.activeRun;if(!run||run.id!==id||run.hero!==s.hero||l.settled.includes(id))return null;
    l.activeRun=null;l.settled.push(id);l.settled=l.settled.slice(-64);
    if(run.kind==='patrol'){
      const old=l.patrols[run.region]||{wins:0,availableAt:0};l.patrols[run.region]={wins:old.wins+(result.victory?1:0),availableAt:now+(result.victory?C.life.patrolCooldownMs:C.life.retreatCooldownMs)};
      if(!result.victory)return {run,victory:false,reward:null};
      const earned={...run.reward};if(earned.herbs)earned.herbs=Math.min(earned.herbs,Math.max(0,12-s.herbs));
      l.earned+=earned.gold;const levels=reward(s,earned);log(s,'山道清静了一会儿','击退拦路的流寇，得 '+earned.gold+' 文、阅历 '+earned.xp+'；收剑，回到原处。');return {run,victory:true,reward:earned,levels};
    }
    if(!result.victory)return {run,victory:false,reward:null};
    const completed=completeCommission(s,run.targetId);return completed?{...completed,run,victory:true}:null;
  }
  function recordLifeTalk(s,key){const l=ensureLife(s);if(!l||typeof key!=='string'||key.length>=100)return false;if(!l.talked.includes(key)){l.talked.push(key);l.talked=l.talked.slice(-160);return true;}return false;}
  const life={create:createLife,ensure:ensureLife,clean:cleanLife,place:lifePlace,availableCompanions,toggleCompanion,buy:buyLife,takeEnergy:takeLifeEnergy,restoreEnergy:restoreLifeEnergy,activeCommission,commissionSpec,commissionReward,acceptCommission,abandonCommission,observeCommission,findCommission,patrolStatus,beginBattle:beginLifeBattle,abortBattle:abortLifeBattle,settleBattle:settleLifeBattle,recordTalk:recordLifeTalk};
  window.JourneyRules={version:4,growthSafe,postgame,permanentLimit,cultivationNeed,cultivationProgress,gainCultivation,growthBonuses,growthItems,growthItem,buyGrowthItem,useGrowthItem,supplies,supply,supplyCount,supplyPrice,buySupply,equipSupply,consumeSupply,create,createProfile,record,switchHero,restart,chapter,stats,xpNeed,reward,complete,encounter,upgrade,upgradeCost,grantItem,applyAfter,normalize,migrate,log,life};
})();
