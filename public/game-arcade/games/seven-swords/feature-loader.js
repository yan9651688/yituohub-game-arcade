/* Heavy trial art is loaded only by an explicit trial / bestiary visit. */
(() => {
  'use strict';
  const assets = {
    creatures: [['tower-art.js?v=31','TowerArt'],['mythic-art-celestial.js?v=32','MythicCelestialArt'],['mythic-art-ancient.js?v=32','MythicAncientArt'],['mythic-art-skysea.js?v=32','MythicSkySeaArt'],['mythic-boss-art.js?v=32','MythicBossArt'],['mythic-mechanics.js?v=32','MythicMechanics']],
    tower: [['tower-scene.js?v=31','SevenTowerScene']],
    bestiary: [['bestiary.js?v=34','SevenBestiary']]
  };
  const scripts = new Map(), features = new Map();
  const list = name => name === 'creatures' ? assets.creatures : Object.prototype.hasOwnProperty.call(assets,name) ? [...assets.creatures,...assets[name]] : null;
  function ready(name){const files=list(name);return !!files&&files.every(([,key])=>!!window[key]);}
  function script([src,key]){
    if(window[key])return Promise.resolve();
    if(scripts.has(src))return scripts.get(src);
    const task=new Promise((resolve,reject)=>{
      const node=document.createElement('script');node.src=src;node.async=false;node.dataset.sevenFeature=key;
      node.onload=()=>{if(window[key])resolve();else{node.remove();reject(new Error('素材未能初始化：'+key));}};
      node.onerror=()=>{node.remove();reject(new Error('素材暂未载入，请重试。'));};
      document.head.appendChild(node);
    });
    scripts.set(src,task);task.catch(()=>{if(scripts.get(src)===task)scripts.delete(src);});return task;
  }
  function load(name){
    const files=list(name);if(!files)return Promise.reject(new Error('未知画卷'));
    if(ready(name))return Promise.resolve();if(features.has(name))return features.get(name);
    // The dispatcher must follow its three art packs. Shared dependencies are deduplicated.
    const task=files.reduce((chain,file)=>chain.then(()=>script(file)),Promise.resolve());
    features.set(name,task);task.catch(()=>{if(features.get(name)===task)features.delete(name);});return task;
  }
  window.SevenFeatureLoader=Object.freeze({load,ready});
})();
