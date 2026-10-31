/* 七剑江湖 v9 · 歇脚、同行、席间情报与就地委托。 */
(() => {
  'use strict';
  const C=window.CANON_DATA,D=window.GAME_DATA,R=window.JourneyRules,A=window.GameArt;
  if(!C?.life||!R?.life)return;
  const rules=R.life,data=C.life,esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const hero=id=>D.heroes.find(h=>h.id===id),region=id=>D.locations.find(l=>l.id===id),place=id=>data.places.find(p=>p.id===id||p.region===id);
  const money=r=>`银钱 ${r.gold} 文 · 阅历 ${r.xp}`;
  const conversation={hongmao:'坐下，把消息对一对。',lantu:'水还热着，慢慢说。',sali:'今日握剑稳了些。',doudou:'先吃饭，药囊也得补齐。',daben:'有热茶！大伙坐！',tiaotiao:'这回能坐下来聊了。',dada:'听完这段琴，再走吧。'};
  function companionList(s){
    const l=rules.ensure(s);if(!l)return[];const available=rules.availableCompanions(s);
    return l.companions.map(id=>{const rule=available.find(r=>r.id===id),h=hero(id);if(!rule||!h)return null;
      const swordState={status:'bound',hand:id==='sali'?'left':'right',weaponName:h.sword,ultimateUnlocked:id!=='hongmao'||s.progress.step>=8,owner:id,id:'sword-'+id};
      if(rule.weapon==='staff')Object.assign(swordState,{status:'sealed',weaponName:'水火棍',ultimateUnlocked:false});
      return {id,name:h.name,color:h.color,swordState};
    }).filter(Boolean).slice(0,2);
  }
  // Scene participants, not the player's unlocked/invited travel roster. Ensemble
  // scenes use two nearby allies; the separate seven-sword finale is unchanged.
  const chapterPartners={
    'hongmao-02':['lantu'],'hongmao-04':['doudou'],
    'lantu-02':['hongmao'],'lantu-03':['hongmao'],'lantu-07':['hongmao'],
    'sali-03':['daben'],'doudou-02':['hongmao'],
    'daben-06':['lantu','doudou'],'daben-07':['hongmao','lantu'],
    'tiaotiao-06':['daben'],'tiaotiao-07':['lantu'],
    'hongmao-08':['lantu','doudou'],'lantu-08':['hongmao','doudou'],
    'doudou-08':['hongmao','lantu'],'daben-08':['hongmao','lantu'],
    'tiaotiao-08':['hongmao','lantu'],'dada-08':['hongmao','lantu']
  };
  const isStory=context=>context.kind==='chapter'||context.kind==='replay';
  function storyParty(s,context={},encounter={}){
    if(!s||!isStory(context)||context.preview||encounter.training)return [];
    const chapter=C.heroes[s.hero]?.chapters.find(c=>c.id===context.id);
    if(!chapter||chapter.kind==='choice'||chapter.kind==='training')return [];
    const replay=context.kind==='replay'||context.replay;
    if(replay?!s.progress.chapters.includes(chapter.id):chapter.id!==R.chapter(s)?.id)return [];
    return (chapterPartners[chapter.id]||[]).filter(id=>id!==s.hero).slice(0,2).map(id=>{
      const h=hero(id),staff=id==='daben'&&chapter.id==='sali-03';
      return {id,name:h.name,color:h.color,swordState:{status:staff?'sealed':'bound',hand:'right',weaponName:staff?'水火棍':h.sword,ultimateUnlocked:id==='hongmao'&&chapter.battle?.storyFinale?true:false,owner:id,id:'sword-'+id}};
    });
  }
  function battleEligibility(s,context={},encounter={}){
    if(!s||context.preview||encounter.training)return [];
    if(isStory(context))return storyParty(s,context,encounter);
    if(context.replay||encounter.readOnlyReplay)return [];
    return rules.availableCompanions(s);
  }
  function battleParty(s,context={},encounter={}){
    if(isStory(context))return storyParty(s,context,encounter);
    const eligible=new Set(battleEligibility(s,context,encounter).map(h=>h.id));
    return eligible.size?companionList(s).filter(h=>eligible.has(h.id)):[];
  }
  function getTargets(s,regionId,now=Date.now()){
    const p=place(regionId);if(!s||!p)return[];const l=rules.ensure(s),patrol=rules.patrolStatus(s,regionId,now);
    const result=[{id:p.id,restId:p.id,life:true,type:'rest',venue:p.venue,anchor:p.anchor,region:regionId,name:p.name,label:'茶饭 · 同行 · 委托',color:'#e8d4a5'},
      {id:'patrol-'+regionId,patrolId:'patrol-'+regionId,life:true,type:'patrol',anchor:'ruins',region:regionId,count:3,name:'山道流寇',label:patrol.cooldownLeft?`此处暂时清静 · ${patrol.cooldownLeft} 秒`:'主动交锋 · 获得阅历与银钱',cooldownLeft:patrol.cooldownLeft,color:'#d59a70'}];
    for(const [id,q]of Object.entries(l.commissions)){const spec=rules.commissionSpec(id);if(q.status==='active'&&spec?.region===regionId)result.push({id,life:true,type:'commission',kind:spec.count?'battle':'find',anchor:spec.anchor,region:regionId,name:spec.title,label:spec.count?'完成后当场收银':'观察痕迹 · 就地交差',color:'#b9d2b1'});}
    return result;
  }
  function create(opts){
    let currentRest=null,currentTarget=null,tab='gather',notice='',talkLine=null,lastActivity='tea';
    const state=()=>opts.getState?.(),world=()=>opts.getWorld?.(),changed=()=>{opts.save?.();opts.render?.();};
    const button=(action,text,id='',className='secondary-button',extra='')=>`<button class="${className}" data-action="${action}"${id?` data-id="${esc(id)}"`:''} ${extra}>${text}</button>`;
    const header=(k,title,description='')=>`<header class="modal-header"><span class="eyebrow">${esc(k)}</span><h2 id="dialogTitle">${esc(title)}</h2>${description?`<p>${esc(description)}</p>`:''}</header>`;
    const image=(id,swordState)=>A.heroSVG(id,{portrait:true,swordState});
    function target(id){return world()?.getTargets?.().find(t=>t.life&&t.id===id);}
    function nearby(id,radius=220){const t=target(id),p=world()?.player;return !!(t&&p&&Math.hypot(t.x-p.x,t.y-p.y)<=radius);}
    function go(id,openAfter=true){
      const p=place(id),spec=rules.commissionSpec(id),regionId=p?.region||spec?.region||(id.startsWith('patrol-')?id.slice(7):null);
      if(!state()||!region(regionId))return false;
      const anchor=p?.anchor||spec?.anchor||'ruins';if(opts.travel?.(regionId,anchor,id)===false)return false;
      if(!nearby(id,p?220:150)){opts.toast?.('已来到附近，请沿路走近交互点。');return false;}
      if(openAfter)open(id);return true;
    }
    function stateRibbon(s){const l=rules.ensure(s),party=companionList(s);return `<div class="life-ribbon"><span>盘缠 <b>${s.gold}</b> 文</span><span>同行 <b>${party.length}</b> / 2</span><span>${l.energy?'下场起手剑意 <b>'+l.energy+'</b>':'茶歇后再出发'}</span></div>`;}
    function partyStrip(s){const party=companionList(s);return `<div class="life-party-strip"><div class="life-face">${image(s.hero,s.sword)}<span>${esc(hero(s.hero).name)}</span></div>${party.map(h=>`<div class="life-face" style="--hero-color:${h.color}">${image(h.id,h.swordState)}<span>${esc(h.name)}</span></div>`).join('')}${Array.from({length:2-party.length},()=>'<div class="life-empty-seat"><span>空席</span><small>邀一位故人</small></div>').join('')}</div>`;}
    function companionHint(s){if(s.hero==='sali'&&s.progress.step>=3&&s.progress.step<8)return '剑冢与藏锋这一段路，莎丽独自前行；紫云归主之后，才与众人公开同行。';if(s.hero==='tiaotiao'&&s.progress.step<5)return '仍在暗处维持护法身份。待「雷区显身」了结，才能公开邀同伴同行。';if(s.hero==='dada'&&s.progress.step>=3&&s.progress.step<7)return '家人仍受牵制，此刻不便公开结伴；待「家人归来」，再与同伴会合。';return '同伴随本角色已历的故事次第开放；各自传记的进度与行囊，不会被借用。';}
    function companionPanel(s){
      const available=rules.availableCompanions(s),l=rules.ensure(s),party=companionList(s);
      const cards=D.heroes.filter(h=>h.id!==s.hero).map(h=>{const rule=available.find(r=>r.id===h.id),selected=l.companions.includes(h.id),windows=data.companionWindows[s.hero].filter(w=>w.id===h.id),next=windows.find(w=>w.minStep>s.progress.step),text=rule?.note||next?.note||'此刻暂别，待重聚时可再相邀';
        return `<article class="life-companion${selected?' selected':''}${rule?'':' unavailable'}" style="--hero-color:${h.color}"><div class="life-companion-portrait">${image(h.id,party.find(p=>p.id===h.id)?.swordState)}</div><div><h3>${esc(h.name)}<small>${esc(h.sword)}</small></h3><p>${esc(text)}</p>${button('life-invite',selected?'请在此歇脚':rule?'邀为同行':'随传记开放',h.id,selected?'text-button':'secondary-button',`${!rule||!selected&&l.companions.length>=2?'disabled':''} aria-pressed="${selected}"`)}</div></article>`;
      }).join('');
      return `<div class="life-section-title"><h3>与你走这一程的人</h3><span>至多两位</span></div><p class="life-section-note">${esc(companionHint(s))}</p><div class="life-companion-grid">${cards}</div><p class="small-note">茶席邀请的同行会随你游历，并在山道流寇与战斗委托中助阵。主线剧情则按本幕情节自动安排参战人物，不受茶席邀请影响。每位实际参战同伴使敌方气血增加 50%、攻击增加 20%（两位 +100% / +40%），速度、人数不变。受伤的同伴可受逗逗的范围治疗照顾；一旦倒地，本场即退下。</p>`;
    }
    function battlePreview(context={},encounter={}){
      const s=state();if(!s)return '';
      const eligible=battleEligibility(s,context,encounter),party=battleParty(s,context,encounter),story=isStory(context);
      const availableNames=eligible.map(h=>hero(h.id).name).join('、');
      const solo=encounter.training?'左手剑修炼，由本人独自完成。':story&&!eligible.length?'本幕按剧情独自出手；游历同行不会进入这一场。':'';
      return `<section class="life-battle-party" aria-label="本场参战安排"><h3>本场参战 · ${esc(hero(s.hero).name)}${party.length?' + '+party.map(h=>esc(h.name)).join('、'):'（独自）'}</h3><p>${party.length?'敌方气血 +'+(party.length*50)+'%（×'+(1+party.length*.5)+'），攻击 +'+(party.length*20)+'%（×'+(1+party.length*.2)+'）':'敌方气血 ×1、攻击 ×1 · 不追加同行加成'}；速度与人数不变。</p><p class="small-note">${esc(solo||(story?'按本幕剧情自动并肩，无需茶席邀请。群战最多安排两名近身助战同伴；七剑合璧演出另按剧情进行。':('可邀入本场：'+(availableNames||'暂无已相认的同伴')+'。需先在茶席明确邀请，最多两位。')))}</p>${!story&&eligible.length?button('life-party-go','到茶席安排本场同行',s.current):''}${party.length?'<p class="small-note">同伴会自动普攻、施放剑招，并靠造成伤害积累自己的剑意释放大招；输出弱于主角，招式受本幕佩剑与领悟阶段限制。敌方气血与攻击加成按开战人数固定，同伴倒地不会降低。</p>':''}</section>`;
    }
    function gatherPanel(s,p){
      const l=rules.ensure(s),offers=data.services.filter(o=>o.id!=='wine'||['wine','inn'].includes(p.venue));
      const cards=offers.map(o=>{const room=s.herbs<12&&o.herbs>0,intel=['tea','feast','wine'].includes(o.id)&&!l.intel.includes(p.region),usable=room||o.energy>l.energy||intel;
        return `<article class="life-menu-card"><span class="life-menu-icon" aria-hidden="true">${o.id==='meal'?'饭':o.id==='feast'?'宴':o.id==='wine'?'酒':'茶'}</span><div><h3>${esc(o.name)}<b>${o.price}<small> 文</small></b></h3><p>${esc(o.description)}</p>${button('life-order',s.gold<o.price?'盘缠不足':usable?'请上一份':'已整装妥当',o.id,'secondary-button',`${s.gold<o.price||!usable?'disabled':''}`)}</div></article>`;
      }).join('');
      return `<div class="life-section-title"><h3>一席烟火，片刻闲暇</h3><span>回春散 ${s.herbs} / 12</span></div><div class="life-menu-grid">${cards}</div><div class="life-table-talk"><div><span class="eyebrow">围桌叙话 · 原创串场</span><h3>茶还热着，不妨多坐一会儿。</h3><p>${esc(talkLine?.text||'问问此地的近况，或把这一路的心事说给同行的人听。')}</p>${talkLine?`<small>—— ${esc(talkLine.speaker)}</small>`:''}</div><div class="life-talk-actions">${button('life-talk','问此地见闻','local')}${button('life-talk','与同行闲谈','companions')}${button('life-talk','聊聊原作旧事','memory')}${button('life-table-view','合上菜单，坐一会儿',p.id,'primary-button')}</div></div><p class="small-note">歇脚带来的起手剑意取最高值，不累加；进入下一场正式战斗时使用。演武与重温不消耗。酒肆也备清茶，大奔守戒时以茶代酒。</p>`;
    }
    function commissionsPanel(s,p){
      const l=rules.ensure(s),active=rules.activeCommission(s),activeSpec=active&&rules.commissionSpec(active);
      const cards=data.commissionKinds.map(k=>{const id='commission-'+p.region+'-'+k.id,spec=rules.commissionSpec(id),q=l.commissions[id],earned=rules.commissionReward(s,spec);
        return `<article class="life-job-card${q?.status==='done'?' settled':''}"><span class="life-job-seal">${k.name}</span><div><div class="life-job-heading"><h3>${esc(spec.title)}</h3><small>${q?.status==='done'?'已结清':q?.status==='active'?'已接取':k.count?'自愿交锋':'无须战斗'}</small></div><p>${esc(k.description)}</p><div class="life-job-reward">${money(earned)}</div><div class="life-job-actions">${q?.status==='done'?'<span class="life-settled-mark">此单酬银已到账</span>':q?.status==='active'?button('life-go','直接到本区目标',id,'primary-button')+button('life-walk','沿路走过去',id,'text-button')+button('life-abandon','放下此单',id,'text-button'):button('life-accept',active?'先办完手上这一单':'接下委托',id,'secondary-button',active?'disabled':'')}</div></div></article>`;
      }).join('');
      return `<div class="life-section-title"><h3>本区告示</h3><span>一次专心办一件</span></div>${activeSpec&&activeSpec.region!==p.region?`<div class="life-note">手上还有「${esc(activeSpec.title)}」。${button('life-go','直达完成处',active,'text-button')}${button('life-abandon','放下此单',active,'text-button')}</div>`:''}<div class="life-job-list">${cards}</div><p class="small-note">三类委托均为游戏原创。每位剑主各有一份账簿，完成后在目标旁收银，不产生回程交付。已经结清的单子不会再次付酬。</p>`;
    }
    function intelPanel(s,p){const l=rules.ensure(s),known=l.intel.includes(p.region),active=rules.activeCommission(s),spec=active&&rules.commissionSpec(active);return `<div class="life-section-title"><h3>席间消息</h3><span>${l.intel.length} / 9 处</span></div><article class="life-intel-card"><span class="eyebrow">${known?'已记下的线索':'茶客还在低声说话'}</span><h3>${esc(p.name)}</h3><p>${known?esc(p.intel):'点一盏茶，便能听清此地的消息。也可以直接接寻物委托，到目标旁自己观察线索。'}</p>${button('life-tab',known?'看看本区委托':'回席上点茶',known?'commissions':'gather','primary-button')}</article>${spec?`<article class="life-intel-card"><span class="eyebrow">手头委托</span><h3>${esc(spec.title)}</h3><p>完成处位于${esc(region(spec.region).name)}。物主或收账人就在现场，办完当场交差。</p>${button('life-go','直达完成处',spec.id)}</article>`:''}<div class="life-ledger"><span>游历与委托收入 <b>${l.earned}</b> 文</span><span>茶饭支出 <b>${l.spent}</b> 文</span></div>`;}
    function showRest(id=state()?.current,nextTab=tab){
      const s=state(),p=place(id);if(!s||!p)return false;if(s.current!==p.region||!nearby(p.id))return go(p.id);
      currentRest=p.id;currentTarget=p.id;tab=['gather','companions','commissions','intel'].includes(nextTab)?nextTab:'gather';
      const content=tab==='companions'?companionPanel(s):tab==='commissions'?commissionsPanel(s,p):tab==='intel'?intelPanel(s,p):gatherPanel(s,p);
      const nav=[['gather','茶饭叙话'],['companions','邀友同行'],['commissions','本区委托'],['intel','情报与账簿']].map(([key,label])=>`<button class="life-tab${tab===key?' active':''}" data-action="life-tab" data-id="${key}" aria-pressed="${tab===key}">${label}</button>`).join('');
      opts.openModal?.('life-rest',`<div class="life-dialog">${header('江湖歇脚 · '+region(p.region).name,p.name,p.description)}${stateRibbon(s)}<div class="life-layout"><aside class="life-aside"><div class="life-place-image" style="background-image:url('maps/${p.region}.webp')"><span>${esc(p.venue==='wine'?'酒肆':p.venue==='inn'?'溪畔歇脚':'茶棚')}<small>${esc(p.host)}</small></span></div>${partyStrip(s)}<p>${companionList(s).length?'同伴已在这一程中相随。':'先把茶续上。故人会随着传记，一个一个相会。'}</p>${button('life-tab','安排同行','companions','text-button')}</aside><section class="life-content"><nav class="life-tabs" aria-label="江湖生活">${nav}</nav>${notice?`<div class="life-notice" role="status">${esc(notice)}</div>`:''}${content}</section></div><details class="life-adaptation"><summary>原著与游历编排</summary><p>${esc(data.adaptationNote)}</p><p>${esc(data.socialNote)}</p>${p.sourceIds.map(id=>{const source=C.sources.find(x=>x.id===id);return source?`<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a>`:'';}).join('')}</details><div class="modal-footer">${button('close-modal','起身，在附近走走','','primary-button')}${button('go-chapter',R.chapter(s)?'接续主线 · '+esc(R.chapter(s).title):'看看七侠传记','','secondary-button')}</div></div>`,{wide:true});return true;
    }
    function showTarget(id){
      const s=state();if(!s)return false;const isPatrol=id==='patrol-'+s.current,spec=rules.commissionSpec(id),q=rules.ensure(s).commissions[id];
      if(!isPatrol&&(!spec||q?.status!=='active')){opts.toast?.('这张委托尚未接取，或已经结清。');return false;}
      if(!nearby(id,150))return go(id);currentTarget=id;
      const status=rules.patrolStatus(s),party=companionList(s),isFind=spec&&!spec.count;
      const earned=isPatrol?{gold:35+5*s.level,xp:52+11*s.level}:rules.commissionReward(s,spec);
      let content='';
      if(isFind)content=`<p class="story-copy">${esc(spec.description)}物主请你找回${esc(spec.lostItem)}。</p><article class="life-clue"><span class="eyebrow">${q.clueSeen?'已经观察到的痕迹':'先看清现场'}</span><p>${q.clueSeen?esc(spec.clue):'先别急着翻找。看清脚印、绳痕与物件上的细节，再断定东西在哪儿。'}</p>${!q.clueSeen?button('life-observe','俯身观察',id,'primary-button'):''}</article><div class="life-find-options">${spec.options.map((text,i)=>button('life-pick',esc(text),id,'choice-button',`data-index="${i}" ${!q.clueSeen?'disabled':''}`)).join('')}</div><p class="small-note">选对了，便由近旁的物主取回失物，当场付酬。</p>`;
      else content=`<p class="story-copy">${isPatrol?'山道边有一小股拦路的流寇。他们不会打断你的游历；可以出手，也可以沿路走开。':esc(spec.description)}</p><div class="life-encounter-stats"><span>${isPatrol?16+Math.min(4,Math.floor(s.level/4)):spec.count} 名敌人</span><span>一次有限交锋</span><span>${party.length?'与 '+party.map(h=>esc(h.name)).join('、')+' 同行':'独自出手'}</span></div>${battlePreview({kind:'life'})}${isPatrol&&status.cooldownLeft?`<div class="life-note">山道暂时清静，还需 ${status.cooldownLeft} 秒才会有新的流寇经过。</div>`:''}<div class="chapter-actions">${button('life-fight',isPatrol&&status.cooldownLeft?'稍后再来':'拔剑，开始交锋',id,'primary-button',isPatrol&&status.cooldownLeft?'disabled':'')}${isPatrol&&status.cooldownLeft?button('life-open','再看看动静',id):''}${button('close-modal','收剑离开','','secondary-button')}</div><p class="small-note">胜利后回到当前地点，由你决定下一步。${isPatrol?'每三次击退流寇可多得一份回春散；药囊最多收 12 份。':'此单只付酬一次，收账人会在完成处交差。'}</p>`;
      opts.openModal?.('life-target',`<div class="life-target-dialog">${header(isFind?'本区委托 · 观察寻物':isPatrol?'山河游历 · 主动交锋':'本区委托 · 就地办理',isPatrol?'山道流寇':spec.title)}${stateRibbon(s)}<div class="life-job-reward">${money(earned)}</div>${notice?`<div class="life-notice" role="status">${esc(notice)}</div>`:''}${content}<div class="modal-footer">${button('life-rest-go','到本区歇脚处',s.current)}${button('close-modal','回到山河','','text-button')}</div></div>`,{wide:false});return true;
    }
    function open(id){notice='';talkLine=null;lastActivity='tea';if(place(id))return showRest(id,'gather');return showTarget(id);}
    function gather(activity=lastActivity){const s=state();if(!s||!currentRest)return false;const soberDaben=s.hero==='daben'&&s.progress.step>=3||companionList(s).some(h=>h.id==='daben'&&h.swordState.status==='bound');lastActivity=activity==='wine'&&soberDaben?'tea':activity;return world()?.gatherAt?.(currentRest,{duration:6,activity:lastActivity})||false;}
    function talk(topic){
      const s=state(),p=place(currentRest);if(!s||!p||!nearby(p.id))return;
      if(topic==='local')talkLine={speaker:p.host,text:rules.ensure(s).intel.includes(p.region)?p.intel:'本区的告示上，有护商、清寨、寻物三种差事。愿意就接一件，办妥了当场付银；不愿接，也尽管坐着喝茶。'};
      else if(topic==='memory'){
        const step=s.progress.step,knowsWine=p.region==='leizhuang'&&({daben:4,doudou:4,hongmao:5,lantu:6,tiaotiao:5,dada:3,sali:8}[s.hero]<=step);
        talkLine=knowsWine?{speaker:'原作旧事 · 第66集',text:'大奔得知莎丽仍在练左手剑，曾在快活林与逗逗对饮一场。这段相聚见于原作，席间的新对白由游戏编排；不为逗逗另设酒量高低。'}:step?{speaker:'原作旧事 · 已历的章节',text:C.heroes[s.hero].chapters[Math.min(step,8)-1].outcome}:{speaker:p.host,text:'你的传记方才展开。先看看此地的风景；走过的事，往后再慢慢说。'};
      }else{const party=companionList(s),person=party[rules.ensure(s).talked.length%Math.max(1,party.length)];talkLine=person?{speaker:person.name,text:person.id==='daben'&&person.swordState.status==='bound'?'俺喝茶。大伙坐！':conversation[person.id]}:{speaker:p.host,text:companionHint(s)};}
      rules.recordTalk(s,p.id+':'+s.progress.step+':'+topic+':'+talkLine.speaker);opts.save?.();gather('tea');notice='这一段闲谈不会推动主线，也不会提前揭开你尚未经历的故事。';
      opts.openModal?.('life-conversation',header('围桌叙话',p.name,region(p.region).name)+`<div class="chapter-line" data-provenance="游戏改编对白"><b>${esc(talkLine.speaker)}</b><p>${esc(talkLine.text)}</p></div><div class="chapter-actions">${button('life-tab','回到茶席','gather','primary-button')}${button('life-talk','问此地见闻','local')}${button('life-talk','与同行闲谈','companions')}${button('close-modal','起身，继续游历','','text-button')}</div>`);
    }
    function finishFind(id,result){
      if(!result)return false;if(result.wrong){notice='这里没有你要找的东西。再对一对方才看到的痕迹。';showTarget(id);return true;}
      changed();const s=state();opts.openModal?.('life-result',header('当场交差 · 不必折返',result.spec.title,'物主当面点验了失物，酬银已经送到手里。')+`<div class="life-result-seal">成</div><div class="life-job-reward">${money(result.reward)}</div>${result.levels?`<p class="checkpoint-note">修为达到 Lv.${s.level}</p>`:''}<div class="modal-footer">${button('close-modal','收好银钱，继续散步','','primary-button')}${button('life-rest-go','去本区歇脚处',s.current)}</div>`);return true;
    }
    function finishBattle(id,result){
      const s=state(),settled=rules.settleBattle(s,id,result);if(!settled)return false;changed();
      const win=settled.victory,title=win?settled.run.kind==='patrol'?'山道清静下来':'这一单，当场结清':result.retreated?'暂且收剑':'整装再来';
      opts.openModal?.('life-result',header(win?'游历交锋 · 原地收束':'游历交锋 · 未付酬',title,win?'你仍在交锋前的地点，同伴也在身旁。接下来由你决定。':'已用药品照常扣除；委托仍可接着办，不会自动发起下一场。')+`${win?'<div class="life-result-seal">成</div><div class="life-job-reward">'+money(settled.reward)+(settled.reward.herbs?' · 回春散 +'+settled.reward.herbs:'')+'</div>':''}${settled.levels?`<p class="checkpoint-note">修为达到 Lv.${s.level}</p>`:''}<div class="modal-footer">${button('close-modal','收剑，回到山河','','primary-button')}${button('life-rest-go','到本区歇脚处',s.current)}${!win&&settled.run.kind==='commission'?button('life-go','查看这张委托',settled.run.targetId,'text-button'):''}</div>`);return true;
    }
    function handle(action,dataset={}){
      if(!action.startsWith('life-'))return false;const s=state(),id=dataset.id;if(!s)return true;
      if(action==='life-party-go'){notice='';talkLine=null;const p=place(id||s.current);if(p&&go(p.id,false))showRest(p.id,'companions');return true;}
      if(action==='life-open'){open(id);return true;}if(action==='life-rest-go'){notice='';talkLine=null;go(place(id||s.current)?.id||'rest-'+s.current);return true;}
      if(action==='life-go'){notice='';go(id);return true;}if(action==='life-walk'){opts.closeModal?.();if(!world()?.navigateTarget?.(id))go(id,false);return true;}
      if(action==='life-tab'){notice='';showRest(currentRest||s.current,id);return true;}
      if(action==='life-table-view'){if(!gather())opts.toast?.('先走到桌边再坐。');opts.closeModal?.();return true;}
      if(action==='life-order'){
        if(!currentRest||!nearby(currentRest))return true;const bought=rules.buy(s,id,place(currentRest).region);
        if(!bought){notice='盘缠或药囊余量不足，或这一份整装效果已经备好。';showRest(currentRest,'gather');return true;}
        changed();gather(bought.offer.activity);notice='花费 '+bought.offer.price+' 文。'+(bought.herbs?'回春散 +'+bought.herbs+'。':'')+(bought.offer.energy?'下场起手剑意至少 '+bought.energy+'。':'')+(bought.newIntel?'本区消息已记入情报页。':'');talkLine={speaker:place(currentRest).host,text:bought.newIntel?place(currentRest).intel:'茶饭上齐了，慢慢用。路上的事，吃好再说。'};showRest(currentRest,'gather');return true;
      }
      if(action==='life-invite'){
        if(!currentRest||!nearby(currentRest))return true;const had=rules.ensure(s).companions.includes(id);if(rules.toggleCompanion(s,id)){changed();notice=hero(id).name+(had?'留在歇脚处等你回来。':'加入同行。可一同行走；能否进入当前剧情战斗，以开战前参战名单为准。');}else notice='本程至多两位同行；尚未到相认时机的角色，暂不能相邀。';showRest(currentRest,'companions');return true;
      }
      if(action==='life-talk'){talk(id);return true;}
      if(action==='life-accept'){
        const spec=rules.commissionSpec(id);if(!currentRest||!nearby(currentRest)||spec?.region!==s.current)return true;
        if(rules.acceptCommission(s,id)){changed();notice='已接下「'+spec.title+'」。交差处就在本区，办妥了在那里收银。';}else notice='先办完或放下手头的委托。已经结清的单子不会再付酬。';showRest(currentRest,'commissions');return true;
      }
      if(action==='life-abandon'){if(rules.abandonCommission(s,id)){changed();notice='已放下这张委托，没有扣除银钱。';}showRest(currentRest||s.current,'commissions');return true;}
      if(action==='life-observe'){if(currentTarget===id&&nearby(id,150)&&rules.observeCommission(s,id)){opts.save?.();notice='看清了痕迹，再论断失物的下落。';showTarget(id);}return true;}
      if(action==='life-pick'){if(currentTarget===id&&nearby(id,150))finishFind(id,rules.findCommission(s,id,Number(dataset.index)));return true;}
      if(action==='life-fight'){
        if(currentTarget!==id||!nearby(id,150))return true;const run=rules.beginBattle(s,id);
        if(!run){notice='这里暂时没有可开始的交锋。';showTarget(id);return true;}
        opts.save?.();if(opts.startBattle?.(run.encounter,{kind:'life',id:run.token.id,lifeId:run.token.id})===false){rules.abortBattle(s,run.token.id);opts.save?.();}return true;
      }
      return true;
    }
    function battleAllies(context={},encounter={}){
      const s=state();if(!s)return[];const R=window.JourneyRules,shared=!!R.postgame?.(s);
      return battleParty(s,context,encounter).map(h=>{
        const base=hero(h.id),stats=shared?R.stats(s,h.id):{hp:base.hp+9*(s.level-1),attack:base.attack+2.3*(s.level-1),power:1,cooldown:1,technique:0},maxHp=Math.round(stats.hp*.9);
        return {...h,id:'companion-'+h.id,heroId:h.id,team:'ally',ai:'companion',maxHp,hp:maxHp,attack:stats.attack*.24,speed:220,sharedGrowth:shared,sharedBaseHp:stats.hp,skillPower:stats.power,skillCooldownRate:stats.cooldown,techniqueBonus:(stats.technique||0)*.24,swordState:{...h.swordState}};
      });
    }
    function regionCard(regionId){const p=place(regionId);if(!p)return'';return `<article class="life-region-card"><span class="life-small-seal">歇</span><div><span class="eyebrow">茶饭 · 同行 · 就地委托</span><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p>${button('life-rest-go','直接到歇脚处',p.region,'secondary-button')}</div></article>`;}
    return {open,openRest:showRest,go,handle,getTargets:regionId=>getTargets(state(),regionId),getCompanions:()=>companionList(state()),battleAllies,battlePreview,finishBattle,abortBattle:id=>rules.abortBattle(state(),id),takeEnergy:()=>rules.takeEnergy(state()),restoreEnergy:n=>rules.restoreEnergy(state(),n),regionCard};
  }
  window.JianghuLife={version:9,create,getTargets,companions:companionList};
})();
