(() => {
  'use strict';
  function init(){
    const I=globalThis.ArcadeI18n,T=(source,params)=>I?I.t(source,params):source;
    const names={galaxian:'小蜜蜂',tanks:'坦克大战',breakout:'打砖块',circus:'马戏团','lode-runner':'淘金者','dr-mario':'马里奥医生'};
    const bar=document.querySelector('.arcade-language-bar'),slot=document.getElementById('hall-language-slot');
    if(bar&&slot){
      const select=bar.querySelector('select');
      const field=document.createElement('div');field.className='language-field';
      const icon=document.createElement('span');icon.className='language-icon';icon.textContent='◎';icon.setAttribute('aria-hidden','true');icon.setAttribute('data-i18n-ignore','');
      field.append(icon,select);bar.append(field);slot.append(bar);bar.querySelector('label').textContent='LANGUAGE';
    }
    const recent=document.getElementById('recent');
    function updateRecent(){
      let id;try{id=localStorage.getItem('classic-hall-last');}catch{}
      recent.replaceChildren();recent.hidden=!Object.hasOwn(names,id);if(recent.hidden)return;
      const label=document.createElement('span');label.textContent=T('上次玩到这里：');
      const a=document.createElement('a');a.href='games/'+id+'/index.html?lang='+(I?.language||'zh-Hans');a.target='_blank';a.rel='noopener';a.textContent=T('{name}，再来一局 ↗',{name:T(names[id])});recent.append(label,a);
    }
    updateRecent();globalThis.addEventListener('arcade-language-change',updateRecent);globalThis.addEventListener('storage',event=>{if(event.key==='classic-hall-last')updateRecent();});
    for(const a of document.querySelectorAll('[data-game]'))a.addEventListener('click',()=>{try{localStorage.setItem('classic-hall-last',a.dataset.game)}catch{}updateRecent();});
    for(const button of document.querySelectorAll('[data-filter]'))button.addEventListener('click',()=>{
      for(const other of document.querySelectorAll('[data-filter]')){const active=button===other;other.classList.toggle('active',active);other.setAttribute('aria-pressed',String(active));}
      for(const card of document.querySelectorAll('.game-card'))card.hidden=button.dataset.filter!=='all'&&card.dataset.kind!==button.dataset.filter;
    });
    const guide=document.getElementById('guide');document.getElementById('help').addEventListener('click',()=>guide.showModal());
    document.getElementById('close-help').addEventListener('click',()=>guide.close());document.getElementById('guide-done').addEventListener('click',()=>guide.close());
  }
  if(document.readyState==='complete'||performance.getEntriesByType('navigation')[0]?.domContentLoadedEventStart>0)init();else document.addEventListener('DOMContentLoaded',init,{once:true});
})();
