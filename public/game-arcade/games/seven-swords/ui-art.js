/* Local standing art and matching portraits. Animated actors are rendered
 * independently by sprites.js / villain-sprites.js. No network requests. */
(() => {
  'use strict';
  const data=window.SevenArtData, A=window.GameArt;
  if(!data||!A)return;
  const vectorPortrait=A.heroSVG;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const names={虹猫:'hongmao',蓝兔:'lantu',莎丽:'sali',逗逗:'doudou',大奔:'daben',跳跳:'tiaotiao',达达:'dada',马三娘:'masanniang',黑心虎:'heixinhu',黑小虎:'heixiaohu',猪无戒:'zhuwujie',牛旋风:'niuxuanfeng'};
  function stageId(id,swordState,requested){
    // Explicit runtime equipment always wins over an optional preview stage.
    if(!swordState&&requested&&data.stages[id+':'+requested])return requested;
    const s=swordState||window.CANON_DATA?.heroes[id]?.initialSword||{};
    if(id==='hongmao')return s.ultimateUnlocked===true?'fire-awakened':'changhong';
    if(id==='sali'){
      if(['bound','recovered'].includes(s.status))return s.hand==='left'?'purple-returned':'purple-right';
      if(['左手剑','剑冢左手剑'].includes(s.weaponName))return s.ultimateUnlocked===true?'left-mastered':'tomb-learning';
      return 'wood-left';
    }
    if(id==='daben')return s.status==='sealed'||s.weaponName==='水火棍'?'water-fire-staff':'thunder-sword';
    if(id==='tiaotiao')return s.status==='sealed'||s.weaponName==='护法佩剑'?'guardian-sword':'azure-sword';
    if(['heixinhu','heixiaohu','zhuwujie','niuxuanfeng'].includes(id))return 'neutral';
    if(id==='masanniang')return s.weaponName==='紫云剑'||requested==='purple-sword'?'purple-sword':'neutral';
    return {lantu:'ice-sword',doudou:'rain-sword',dada:'wind-sword'}[id]||null;
  }
  function resolve(id,options={}){return data.stages[id+':'+stageId(id,options.swordState,options.stageId)]||null;}
  function render(id,options={}){
    const stage=resolve(id,options);
    if(!stage)return vectorPortrait?.(id,options)||'';
    const portrait=!!options.portrait,file=data.files[portrait?stage.portrait:stage.standing];
    const width=portrait?1254:1280,height=portrait?1254:1728;
    // Centre the feet, not the sword-inclusive alpha bounds. The larger SVG
    // frame includes the entire native canvas even after the anchor offset.
    const feet=file.feet||[512,1490];
    let x=portrait?25:640-feet[0],y=portrait?25:1632-feet[1];
    const iw=portrait?1204:file.width,ih=portrait?1204:file.height;
    if(!portrait){x=Math.min(Math.max(x,16),width-iw-16);y=Math.min(Math.max(y,16),height-ih-16);}
    const label=stage.name+(portrait?'头像':' · '+stage.label+' · '+(stage.hand==='left'?'左手':'右手')+(stage.weapon||''));
    const image=(path,extra='')=>`<image href="${esc(path)}" x="${x}" y="${y}" width="${iw}" height="${ih}" preserveAspectRatio="xMidYMid meet" ${extra}/>`;
    const overlay=!portrait&&stage.id==='fire-awakened'&&stage.overlay&&options.overlay!==false?image(stage.overlay,'class="ss-art-overlay"'):'';
    return `<svg class="hero-svg ss-art-png ${portrait?'ss-art-portrait':'ss-art-standing'}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(label)}" data-art-hero="${esc(id)}" data-art-stage="${esc(stage.id)}" data-art-hand="${stage.hand}" data-art-file="${esc(file.file)}">${image(file.file)}${overlay}</svg>`;
  }
  function speakerId(speaker,playerId){return speaker==='你'?playerId:names[speaker]||null;}
  function speakerAvatar(speaker,playerId,swordState,stageId){const id=speakerId(speaker,playerId);return id?`<span class="ss-dialogue-avatar" aria-hidden="true">${render(id,{portrait:true,swordState:id===playerId?swordState:undefined,stageId})}</span>`:'';}
  function villainGallery(){
    const cards=[['heixinhu','黑心虎','魔教教主','以强横掌力封山围猎，终与七剑相对。'],['heixiaohu','黑小虎','魔教少主','披风掠过山道，以掌法与七侠交锋。'],['zhuwujie','猪无戒','魔教堂主','暗器与诡计并用，曾围困玉蟾宫。'],['niuxuanfeng','牛旋风','魔教堂主','使一对板斧；他的义举留在莎丽与大奔的往事里。'],['masanniang','马三娘','紫云局中人','曾冒充紫云剑主，终由莎丽亲手破局。']];
    return `<section class="villain-gallery" aria-label="江湖人物 · 魔教"><header class="villain-gallery-heading"><h3>江湖人物 · 魔教</h3><p>剑途之中，各有来路。</p></header><div class="villain-gallery-grid">${cards.map(([id,name,role,note])=>`<article class="villain-card" data-villain="${id}"><header class="villain-card-header"><span class="villain-card-avatar" aria-hidden="true">${render(id,{portrait:true})}</span><div><h4>${name}</h4><small>${role}</small></div></header><div class="villain-card-figure">${render(id)}</div><p>${note}</p></article>`).join('')}</div><p class="villain-gallery-note">人物造型据动画参考重新绘制；此处为人物图鉴，不改变七侠传记与交锋安排。</p></section>`;
  }
  A.villainGallery=villainGallery;
  A.heroSVG=render;
  A.uiArtVersion='11.5';
  window.SevenUIArt=Object.freeze({version:'11.5',resolve,stageId,render,speakerId,speakerAvatar});
})();
