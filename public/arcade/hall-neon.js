/* Rendering is optional. Navigation, filters and launch links stay independent. */
(() => {
  const canvas=document.getElementById('hall-neon-scene'),host=canvas?.parentElement;
  if(!canvas||!host)return;
  import('./hall-scene.js?v=20261026-classic-arcade-soft-v1')
    .then(module=>module.mountScene(canvas,host))
    .catch(()=>{host.dataset.sceneState='fallback';});
})();
