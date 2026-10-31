/* v25: one loadout editor. Drag is an optional shortcut; all operations are buttons. */
(function(){
  'use strict';
  const mounts=new WeakMap();
  function mount(root,options){
    if(!root)return;
    if(mounts.has(root)){const old=mounts.get(root);old.clear();old.options=options;return;}
    const ctx={options,drag:null,suppressClickUntil:0};mounts.set(root,ctx);
    const source=e=>e.target.closest('[data-supply-drag]');
    const slot=e=>e.target.closest('[data-supply-slot]');
    const relevant=e=>e.target.closest('.supply-loadout,.supply-inventory-grid');
    const clear=()=>{ctx.drag=null;root.querySelectorAll('.supply-drop-target,.supply-dragging').forEach(n=>n.classList.remove('supply-drop-target','supply-dragging'));};
    ctx.clear=clear;
    function change(n,id,from){
      const o=ctx.options,s=o.state();
      if(!s||!Number.isInteger(n)||n<0||n>4||id!==null&&!o.rules.supply(id))return false;
      // Only a live internal slot drag swaps. Inventory selection retains move/replace semantics.
      if(Number.isInteger(from)){
        if(from<0||from>4||s.loadout[from]!==id)return false;
        if(from===n)return false;
        [s.loadout[from],s.loadout[n]]=[s.loadout[n],s.loadout[from]];
      }else if(!o.rules.equipSupply(s,n,id))return false;
      o.changed(n);return true;
    }
    root.addEventListener('click',e=>{
      if(!relevant(e))return;
      e.stopPropagation();
      if(Date.now()<ctx.suppressClickUntil){e.preventDefault();return;}
      const b=e.target.closest('button');if(!b||b.disabled)return;
      const a=b.dataset.action,o=ctx.options;
      if(a==='select-item'){e.preventDefault();o.select(b.dataset.id);}
      else if(a==='equip-supply'){e.preventDefault();change(Number(b.dataset.slot),o.selected());}
      else if(a==='clear-supply'){e.preventDefault();change(Number(b.dataset.slot),null);}
    });
    // Do not let editor input become a world move/attack, including keyboard activation.
    for(const type of ['pointerdown','pointerup','mousedown','mouseup','touchstart','touchend','keydown','keyup'])root.addEventListener(type,e=>{if(relevant(e)&&!['Escape','KeyB','KeyI'].includes(e.code||e.key))e.stopPropagation();});
    root.addEventListener('dragstart',e=>{
      const b=source(e);if(!b||!ctx.options.rules.supply(b.dataset.supplyDrag)){if(relevant(e))e.preventDefault();return;}
      e.stopPropagation();ctx.drag={id:b.dataset.supplyDrag,from:b.dataset.fromSlot===undefined?undefined:Number(b.dataset.fromSlot)};
      b.classList.add('supply-dragging');
      if(e.dataTransfer){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',ctx.drag.id);}
    });
    root.addEventListener('dragover',e=>{const b=slot(e);if(!ctx.drag||!b)return;e.preventDefault();e.stopPropagation();root.querySelectorAll('.supply-drop-target').forEach(n=>n.classList.remove('supply-drop-target'));b.classList.add('supply-drop-target');if(e.dataTransfer)e.dataTransfer.dropEffect='move';});
    root.addEventListener('dragleave',e=>{const b=slot(e);if(b&&!b.contains(e.relatedTarget))b.classList.remove('supply-drop-target');});
    root.addEventListener('drop',e=>{
      if(!ctx.drag){if(relevant(e)){e.preventDefault();e.stopPropagation();}return;}
      e.preventDefault();e.stopPropagation();const b=slot(e),d=ctx.drag;clear();ctx.suppressClickUntil=Date.now()+250;
      if(b)change(Number(b.dataset.supplySlot),d.id,d.from);
    });
    root.addEventListener('dragend',e=>{if(ctx.drag){e.stopPropagation();ctx.suppressClickUntil=Date.now()+250;}clear();});
  }
  window.SevenSupplyLoadout={mount};
})();
