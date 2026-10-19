/* Exhibition copy and accessible controls; scene geometry stays in scene.js. */
const copy = {
  pageTitle:['阿房宫 · AI放映厅','阿房宮 · AI放映廳','Afang Palace · AI Cinema'],
  title:['阿房宫图卷','阿房宮圖卷','Afang Palace'],
  subtitle:['覆压三百里 · 隔离天日 · 关中山水数字复原','覆壓三百里 · 隔離天日 · 關中山水數位復原','Palaces beyond the horizon · A digital vision of Guanzhong'],
  description:['走入阿房宫的数字艺术图卷，在八处景点与三种光影之间自由漫游，聆听《盛世金钟》。','走入阿房宮的數位藝術圖卷，在八處景點與三種光影之間自由漫遊，聆聽《盛世金鐘》。','Explore a digital vision of Afang Palace, with eight scenic viewpoints, three lighting moods and the music Golden Bells of a Flourishing Era.'],
  back:['← AI放映厅','← AI放映廳','← AI Cinema'],controls:['展陈控制','展陳控制','Exhibition controls'],
  sunset:['夕照咸阳','夕照咸陽','Golden dusk'],noon:['盛世晴昼','盛世晴晝','Sunlit splendor'],night:['星汉夜宴','星漢夜宴','Starlit night'],
  orbit:['🎥 环绕巡礼','🎥 環繞巡禮','🎥 Orbit tour'],immerse:['👁️ 沉浸','👁️ 沉浸','👁️ Immerse'],showUI:['👁️ 显示界面','👁️ 顯示介面','👁️ Show controls'],
  settings:['展陈设置','展陳設定','Exhibition settings'],quality:['画质','畫質','Quality'],
  'quality.auto':['自动','自動','Auto'],'quality.high':['精细','精細','High'],'quality.low':['流畅','流暢','Smooth'],
  export:['📦 导出','📦 導出','📦 Export'],'export.title':['导出 3D 模型（OBJ）','匯出 3D 模型（OBJ）','Export 3D model (.OBJ)'],
  'export.busy':['⏳ 导出中…','⏳ 導出中…','⏳ Exporting…'],'export.error':['模型导出失败，请稍后重试。','模型匯出失敗，請稍後重試。','The model could not be exported. Please try again.'],
  'loading.title':['图卷徐启','圖卷徐啟','The scroll unfolds'],
  'loading.start':['正在准备宫阙与山水…','正在準備宮闕與山水…','Preparing palaces and landscapes…'],
  'loading.geometry':['正在构筑宫阙与山水…','正在構築宮闕與山水…','Building palaces and landscapes…'],
  'loading.compile':['正在点亮宫灯与金瓦…','正在點亮宮燈與金瓦…','Lighting the halls and golden rooftops…'],
  'loading.slow':['图卷仍在准备中，首次打开可能需要稍等片刻。','圖卷仍在準備中，首次開啟可能需要稍等片刻。','The exhibition is still loading. Its first visit may take a little longer.'],
  'loading.error':['图卷暂时无法打开，请重新载入，或换用支持 WebGL 的浏览器。','圖卷暫時無法開啟，請重新載入，或改用支援 WebGL 的瀏覽器。','The exhibition could not open. Try reloading, or use a browser with WebGL support.'],
  'loading.ready':['图卷已就绪。','圖卷已就緒。','The exhibition is ready.'],retry:['重新载入','重新載入','Reload'],
  'music.gesture':['点击画面开启音乐','點擊畫面開啟音樂','Tap anywhere to start music'],
  'music.play':['🎵 盛世金钟','🎵 盛世金鐘','🎵 Golden Bells'],'music.pause':['Ⅱ 暂停音乐','Ⅱ 暫停音樂','Ⅱ Pause music'],
  'music.loading':['音乐载入中…','音樂載入中…','Loading music…'],'music.error':['音乐暂时无法播放，请重试。','音樂暫時無法播放，請重試。','Music could not play. Please try again.'],
  'music.title':['盛世金钟','盛世金鐘','Golden Bells of a Flourishing Era'],'music.resume':['继续音乐','繼續音樂','Resume music'],
  roam:['漫游','漫遊','Roam'],forward:['前进','前進','Move forward'],backward:['后退','後退','Move backward'],left:['左移','左移','Move left'],right:['右移','右移','Move right'],up:['升高','升高','Move up'],down:['降低','降低','Move down'],
  scenes:['八大名景','八大名景','Eight scenic viewpoints'],overview:['苍穹全览','蒼穹全覽','Sky panorama'],front:['阿房前殿','阿房前殿','Front palace'],colossi:['十二金人','十二金人','Twelve colossi'],waterWest:['兰池水榭','蘭池水榭','Orchid waterside'],waterEast:['沧池画舫','滄池畫舫','Azure lake boats'],stargaze:['太液摘星','太液摘星','Star terrace'],magnet:['磁石雄关','磁石雄關','Magnetite gate'],zhongnan:['终南双阙','終南雙闕','Zhongnan towers'],
  hint:['漫游指南：W A S D / 方向键移动 · E / 空格上升 · Q / C 下降 · Shift 加速 · 鼠标左键拖拽转向','漫遊指南：W A S D / 方向鍵移動 · E / 空格上升 · Q / C 下降 · Shift 加速 · 滑鼠左鍵拖拽轉向','Roam: WASD / arrows to move · E / Space up · Q / C down · Shift to speed up · Drag to look around'],
  touchHint:['拖动画面转向 · 左右滑动选择景点 · 漫游键移动','拖動畫面轉向 · 左右滑動選擇景點 · 漫遊鍵移動','Drag to look · Swipe the viewpoints · Roam to move']
};
const locales=['zh-Hans','zh-Hant','en'];
const dictionaries=Object.fromEntries(locales.map((locale,index)=>[locale,Object.fromEntries(Object.entries(copy).map(([key,value])=>['afang.'+key,value[index]]))]));
window.SiteI18n?.register(dictionaries);
const t=key=>window.SiteI18n?.t(key) || dictionaries['zh-Hans'][key] || key;
const status=document.getElementById('scene-status');
const announce=message=>{status.textContent=message};
function centerActiveView(){
  const dock=document.getElementById('scenic-dock'),active=dock.querySelector('.active');
  if(active&&dock.scrollWidth>dock.clientWidth) dock.scrollLeft=active.offsetLeft+active.offsetWidth/2-dock.clientWidth/2;
}
window.AfangUI=Object.freeze({t,announce});
window.SiteI18n?.apply();
// Same-origin embedding follows the current shell without reloading its scene.
try {
  if(window.parent!==window && window.parent.SiteI18n){
    window.SiteI18n.setLocale(window.parent.SiteI18n.locale,{url:false});
    window.parent.addEventListener('site:languagechange',event=>window.SiteI18n.setLocale(event.detail.locale,{url:false}));
  }
}catch{/* Standalone navigation and cross-tab storage synchronization still work. */}
const loader=document.getElementById('scene-loader');
const loadingMessage=document.getElementById('loading-message');
const retry=document.getElementById('btn-retry');
let ready=false,error=false;
function loadingText(key){loadingMessage.dataset.i18n=key;loadingMessage.textContent=t(key)}
function sceneError(){
  if(error)return;
  error=true;ready=false;
  document.body.classList.add('scene-loading','scene-error');
  loader.hidden=false;
  loadingText('afang.loading.error');
  retry.hidden=false;
}
retry.addEventListener('click',()=>location.reload());
window.addEventListener('afang:progress',event=>{
  if(ready||error)return;
  const stage=event.detail?.stage;
  if(stage==='geometry'||stage==='compile')loadingText('afang.loading.'+stage);
});
window.addEventListener('afang:ready',()=>{
  ready=true;error=false;
  clearTimeout(slowTimer);
  document.body.classList.remove('scene-loading','scene-error');
  loader.hidden=true;
  announce(t('afang.loading.ready'));
  syncQuality();
  centerActiveView();
});
window.addEventListener('afang:error',sceneError);
window.addEventListener('afang:restored',()=>{
  ready=true;error=false;loader.hidden=true;retry.hidden=true;
  document.body.classList.remove('scene-loading','scene-error');
  announce(t('afang.loading.ready'));
});
const slowTimer=setTimeout(()=>{if(!ready&&!error)loadingText('afang.loading.slow')},20000);
let exportBusy=false;
function syncDynamicLabels(){
  const button=document.getElementById('btn-toggle-ui');
  const hidden=document.body.classList.contains('ui-hidden');
  button.dataset.i18n=hidden?'afang.showUI':'afang.immerse';
  button.textContent=t(button.dataset.i18n);
  button.setAttribute('aria-pressed',String(hidden));
  const exportButton=document.getElementById('btn-export-obj');
  exportButton.dataset.i18n=exportBusy?'afang.export.busy':'afang.export';
  exportButton.textContent=t(exportButton.dataset.i18n);
  exportButton.disabled=exportBusy;
}
window.addEventListener('site:languagechange',()=>{syncDynamicLabels();centerActiveView()});
window.addEventListener('afang:immersion',()=>{syncDynamicLabels();releaseMoves();document.getElementById('advanced-tools').open=false});
window.addEventListener('afang:export',event=>{
  exportBusy=Boolean(event.detail?.busy);syncDynamicLabels();
  if(event.detail?.error)announce(t('afang.export.error'));
});
const quality=document.getElementById('quality-select');
function syncQuality(){
  const state=window.AfangPalace?.getQuality?.();
  const choice=typeof state==='string'?state:state?.quality||state?.mode||state?.requested||'auto';
  quality.value=['high','low'].includes(choice)?choice:'auto';
}
quality.addEventListener('change',()=>window.AfangPalace?.setQuality(quality.value));
window.addEventListener('afang:qualitychange',syncQuality);
const details=document.getElementById('advanced-tools');
document.addEventListener('pointerdown',event=>{if(details.open&&!details.contains(event.target))details.open=false});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){
    if(details.open){details.open=false;details.querySelector('summary').focus()}
    else if(document.body.classList.contains('ui-hidden'))document.getElementById('btn-toggle-ui').click();
  }
});
const roam=document.getElementById('btn-roam'),pad=document.getElementById('roam-pad');
roam.addEventListener('click',()=>{pad.hidden=!pad.hidden;roam.setAttribute('aria-expanded',String(!pad.hidden));if(pad.hidden)releaseMoves()});
const held=new Set();
function move(button,active){
  const direction=button.dataset.move;
  if(active)held.add(direction);else held.delete(direction);
  button.classList.toggle('active',active);
  window.AfangPalace?.setMove(direction,active);
}
function releaseMoves(){
  held.forEach(direction=>window.AfangPalace?.setMove(direction,false));
  held.clear();pad.querySelectorAll('.active').forEach(button=>button.classList.remove('active'));
}
pad.querySelectorAll('[data-move]').forEach(button=>{
  button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);move(button,true)});
  ['pointerup','pointercancel','lostpointercapture'].forEach(name=>button.addEventListener(name,()=>move(button,false)));
  button.addEventListener('keydown',event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();move(button,true)}});
  button.addEventListener('keyup',event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();move(button,false)}});
  button.addEventListener('blur',()=>move(button,false));
});
window.addEventListener('blur',releaseMoves);
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseMoves()});
// Yield a paint so a genuinely waiting state appears before scene construction.
requestAnimationFrame(()=>requestAnimationFrame(()=>import('./scene.js').catch(error=>{console.error('Afang exhibition failed to initialize:',error);sceneError()})));
