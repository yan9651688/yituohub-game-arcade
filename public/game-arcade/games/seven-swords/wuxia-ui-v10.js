/* Presentation-only focus and selected-state behavior. No gameplay or save mutations. */
(() => {
  'use strict';
  const doc=document,shell=doc.querySelector('#gameShell'),modalLayer=doc.querySelector('#modalLayer');
  const modal=doc.querySelector('#modal'),atlasLayer=doc.querySelector('#atlasLayer'),battleLayer=doc.querySelector('#battleLayer');
  if(!shell||!modalLayer||!modal||!atlasLayer||!battleLayer)return;
  const blocked=new Map();
  let previousMode='',opener=null,pendingTrigger=null;
  const isOpen=el=>!!el&&!el.hidden;
  const mode=()=>isOpen(modalLayer)?'modal':isOpen(atlasLayer)?'atlas':isOpen(battleLayer)?'battle':'world';
  const panel=()=>isOpen(modalLayer)?modal:isOpen(atlasLayer)?atlasLayer.querySelector('.atlas-dialog'):null;
  const setAttribute=(el,key,value)=>{if(el&&el.getAttribute(key)!==String(value))el.setAttribute(key,String(value));};
  const usable=el=>!!el?.isConnected&&!el.disabled&&!el.closest('[hidden],[inert]')&&
    (typeof el.getClientRects!=='function'||el.getClientRects().length>0);
  const focusables=box=>Array.from(box.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')).filter(usable);
  function suppress(nodes){
    const wanted=new Set(nodes);
    for(const [node,wasInert] of blocked){if(!wanted.has(node)){node.inert=wasInert;if(!wasInert)node.removeAttribute('inert');blocked.delete(node);}}
    for(const node of wanted){if(!blocked.has(node))blocked.set(node,!!node.inert);node.inert=true;setAttribute(node,'inert','');}
  }
  function sync(){
    const current=mode(),view=modal.dataset.view||'';
    /* The atlas lives inside gameShell. Disable its siblings, never its ancestor. */
    suppress(current==='world'?[]:Array.from(shell.children).filter(node=>current!=='atlas'||node!==atlasLayer));
    if(current!==previousMode){
      if(previousMode==='world'&&current!=='world')opener=pendingTrigger?.isConnected?pendingTrigger:doc.activeElement;
      if(current==='world'){
        const focus=usable(opener)?opener:shell.querySelector('.world-canvas');
        if(focus)focus.focus({preventScroll:true});
        opener=null;
      }
      previousMode=current;
    }
    setAttribute(doc.documentElement,'data-ui-mode',current);
    const active=current==='atlas'?'atlas':current==='battle'?'dojo':current==='modal'?
      (view==='character'?'character':['codex','bestiary','tower','feature-loading'].includes(view)?'codex':view==='inventory'?'bag':['select','roster'].includes(view)?'roster':view==='journal'?'journal':view==='help'?'help':''):'';
    shell.querySelectorAll('.main-nav .nav-item').forEach(button=>{
      const selected=button.dataset.action===active;
      button.classList.toggle('active',selected);setAttribute(button,'aria-pressed',selected);
    });
    modal.querySelectorAll('.hero-card,.inventory-tab,.life-tab,.move-hero-tab').forEach(button=>
      setAttribute(button,'aria-pressed',button.classList.contains('selected')||button.classList.contains('active')));
    const sound=shell.querySelector('.sound-button');
    if(sound){const playing=sound.classList.contains('playing');setAttribute(sound,'aria-pressed',playing);setAttribute(sound,'aria-label',playing?'关闭山水琴音':'开启山水琴音');setAttribute(sound,'title',playing?'关闭山水琴音':'开启山水琴音');}
    const box=panel();
    if(box){setAttribute(box,'aria-modal','true');setAttribute(box,'role','dialog');}
  }
  doc.addEventListener('click',event=>{
    if(mode()==='world')pendingTrigger=event.target.closest('button,a')||doc.activeElement;
  },true);
  doc.addEventListener('keydown',event=>{
    if(mode()==='world')pendingTrigger=doc.activeElement;
    const box=panel();
    if(!box||event.key!=='Tab')return;
    const elements=focusables(box),first=elements[0],last=elements[elements.length-1];
    if(!first){event.preventDefault();box.focus({preventScroll:true});return;}
    const active=doc.activeElement;
    if(event.shiftKey&&(active===first||active===box||!box.contains(active))){event.preventDefault();last.focus({preventScroll:true});}
    else if(!event.shiftKey&&(active===last||active===box||!box.contains(active))){event.preventDefault();first.focus({preventScroll:true});}
  },true);
  /* Native Enter activation also works on the formal-battle action buttons.
     Pointer clicks already cast on pointerdown; dojo owns its own keyboard path. */
  doc.addEventListener('click',event=>{
    if(event.detail!==0)return;
    const button=event.target.closest('.ss-c-action');
    if(!button||!button.closest('#battleLayer .ss-combat')||button.closest('.ss-c-dojo'))return;
    const combat=window.SevenCombat?.instance;
    if(!combat||combat.paused||combat.ended||combat.actionsLocked())return;
    const actions={attack:'attack',skill:'useSkill',ult:'useUlt',finisher:'useFinisher',dodge:'dodge',herb:'useHerb'};
    const method=actions[button.dataset.action];
    if(method&&typeof combat[method]==='function'){combat.unlockSound();combat.pointer.active=false;combat[method]();}
  });
  const observer=new MutationObserver(sync);
  observer.observe(modalLayer,{attributes:true,childList:true,subtree:true,attributeFilter:['hidden','data-view']});
  observer.observe(atlasLayer,{attributes:true,attributeFilter:['hidden']});
  observer.observe(battleLayer,{attributes:true,attributeFilter:['hidden']});
  const sound=shell.querySelector('.sound-button');
  if(sound)observer.observe(sound,{attributes:true,attributeFilter:['class']});
  sync();
  window.SevenWuxiaUI={version:10,refresh:sync};
})();
