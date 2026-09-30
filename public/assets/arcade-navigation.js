/* Preserve native link navigation while preventing game input handlers from receiving menu clicks. */
(() => {
  const isolate = event => {
    if (event.target instanceof Element && event.target.closest('a.arcade-home-link')) {
      event.stopImmediatePropagation();
    }
  };
  for (const type of ['pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','touchstart','touchmove','touchend','click','keydown','keyup']) {
    document.addEventListener(type, isolate, {capture:true, passive:true});
  }
})();
