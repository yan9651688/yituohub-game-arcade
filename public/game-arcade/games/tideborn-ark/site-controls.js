/* Debug remains opt-in and separate from normal save slots. */
(()=>{'use strict';
 function reveal(on){document.documentElement.toggleAttribute('data-debug-tools',on);}
 try{reveal(new URL(location.href).searchParams.get('debug')==='1');}catch{}
 window.addEventListener('keydown',event=>{if(event.ctrlKey&&event.shiftKey&&event.code==='KeyD'){event.preventDefault();reveal(!document.documentElement.hasAttribute('data-debug-tools'));}});
})();
