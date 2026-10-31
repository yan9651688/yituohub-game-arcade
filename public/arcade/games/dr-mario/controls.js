/* Buffered controls: a complete short tap is retained until the next simulation step. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.DrMarioControls=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KEY_MAP={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowDown:'down',KeyS:'down',KeyZ:'ccw',KeyX:'cw',ArrowUp:'cw'};
  class InputBuffer {
    constructor(){this.sources=new Map();this.queue=[];this.direction=0;this.repeat=0;}
    press(action,source=action){
      if(this.sources.has(source))return false;
      this.sources.set(source,action);this.queue.push({action,source});
      if(action==='left'||action==='right'){this.direction=action==='left'?-1:1;this.repeat=16/60;}
      return true;
    }
    release(source){this.sources.delete(source);}
    cancel(source){this.sources.delete(source);this.queue=this.queue.filter(item=>item.source!==source);}
    held(action){return [...this.sources.values()].includes(action);}
    step(dt){
      const out=this.queue.splice(0).map(item=>item.action),direction=this.held('left')===this.held('right')?0:this.held('left')?-1:1;
      if(!direction){this.direction=0;this.repeat=0;}
      else if(direction!==this.direction){this.direction=direction;this.repeat=16/60;}
      else {this.repeat-=dt;while(this.repeat<=1e-9){out.push(direction<0?'left':'right');this.repeat+=6/60;}}
      return out;
    }
    get softDrop(){return this.held('down')&&!this.held('left')&&!this.held('right');}
    clear(){this.sources.clear();this.queue=[];this.direction=0;this.repeat=0;}
  }
  function isInteractive(target){return !!target?.closest?.('button,select,input,textarea,a,[contenteditable="true"]');}
  return {KEY_MAP,InputBuffer,isInteractive};
});
