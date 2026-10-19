(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const strings = {
    'zh-Hans': { library:'游戏库',dojo:'竹林道场',tagline:'一刀划过，满屏清脆。',intro:'让烦恼跟着蔬菜一起切开。\n刀光落下的瞬间，快乐刚刚好。',start:'拔刀开切',how:'怎么玩',input:'按住鼠标划动 / 手指滑动 · 一刀切中 3 个，触发连斩',choose:'选择你的修行',classic:'经典修行',arcade:'街机狂热',zen:'禅意时刻',classicBrief:'三次机会 · 挑战极限',arcadeBrief:'60 秒 · 连斩冲分',zenBrief:'90 秒 · 没有炸弹',record:'本机最佳',fresh:'新鲜上场，尽情开切。',score:'得分',best:'最佳',pause:'暂停',playHint:'划过蔬菜，避开带火星的炸弹。',zenHint:'放松一点，每一刀都算数。',paused:'刀先收好，歇一会儿。',pausedHint:'这一局正在等你，时间也停在这里。',resume:'继续开切',restart:'重新开始',home:'回到道场',finished:'收刀，好身手。',roundScore:'本局得分',sliced:'切开蔬菜',maxCombo:'最高连斩',again:'再来一局',gotIt:'知道了，开切',helpInput:'按住鼠标左键拖动，或用手指在屏幕上划动。快速连续切中 3 个以上蔬菜即可连斩，每个蔬菜基础得分 10 分。',classicRule:'没有时间限制。漏掉一个蔬菜或切中炸弹，失去一次机会。三次机会用完，本局结束。',arcadeRule:'60 秒尽量多得分。炸弹扣 50 分，最低扣到 0；漏切不扣分。蓝色冰晶减速 5 秒，金色 ×2 球让得分翻倍 6 秒。',zenRule:'90 秒，没有炸弹，也不惩罚漏切。放松一点，享受切菜。',shortcuts:'P / Esc 暂停 · M 音效 · F 全屏。切换窗口或旋转屏幕会自动暂停。',mute:'关闭音效',unmute:'开启音效',full:'全屏',noFull:'当前浏览器不支持全屏，可直接继续游戏。',newBest:'新纪录！这一刀，值得记住。',nice:'再来一局，试试把更多蔬菜连在一刀里。',first:'先找找手感，下一刀会更准。',freeze:'冰晶减速',double:'双倍得分',canvas:'切菜道场，按住鼠标拖动或用手指滑动切开蔬菜',life:'剩余机会',gameTitle:'蔬菜忍者',modeGroup:'游戏模式' },
    'zh-Hant': {library:'遊戲庫',dojo:'竹林道場',tagline:'一刀劃過，滿屏清脆。',intro:'讓煩惱跟著蔬菜一起切開。\n刀光落下的瞬間，快樂剛剛好。',start:'拔刀開切',how:'怎麼玩',input:'按住滑鼠劃動 / 手指滑動 · 一刀切中 3 個，觸發連斬',choose:'選擇你的修行',classic:'經典修行',arcade:'街機狂熱',zen:'禪意時刻',classicBrief:'三次機會 · 挑戰極限',arcadeBrief:'60 秒 · 連斬衝分',zenBrief:'90 秒 · 沒有炸彈',record:'本機最佳',fresh:'新鮮上場，盡情開切。',score:'得分',best:'最佳',pause:'暫停',playHint:'劃過蔬菜，避開帶火星的炸彈。',zenHint:'放鬆一點，每一刀都算數。',paused:'刀先收好，歇一會兒。',pausedHint:'這一局正在等你，時間也停在這裡。',resume:'繼續開切',restart:'重新開始',home:'回到道場',finished:'收刀，好身手。',roundScore:'本局得分',sliced:'切開蔬菜',maxCombo:'最高連斬',again:'再來一局',gotIt:'知道了，開切',helpInput:'按住滑鼠左鍵拖動，或用手指在螢幕上劃動。快速連續切中 3 個以上蔬菜即可連斬，每個蔬菜基礎得分 10 分。',classicRule:'沒有時間限制。漏掉一個蔬菜或切中炸彈，失去一次機會。三次機會用完，本局結束。',arcadeRule:'60 秒盡量多得分。炸彈扣 50 分，最低扣到 0；漏切不扣分。藍色冰晶減速 5 秒，金色 ×2 球讓得分翻倍 6 秒。',zenRule:'90 秒，沒有炸彈，也不懲罰漏切。放鬆一點，享受切菜。',shortcuts:'P / Esc 暫停 · M 音效 · F 全螢幕。切換視窗或旋轉螢幕會自動暫停。',mute:'關閉音效',unmute:'開啟音效',full:'全螢幕',noFull:'目前瀏覽器不支援全螢幕，可直接繼續遊戲。',newBest:'新紀錄！這一刀，值得記住。',nice:'再來一局，試試把更多蔬菜連在一刀裡。',first:'先找找手感，下一刀會更準。',freeze:'冰晶減速',double:'雙倍得分',canvas:'切菜道場，按住滑鼠拖動或用手指滑動切開蔬菜',life:'剩餘機會',gameTitle:'蔬菜忍者',modeGroup:'遊戲模式'},
    en: {library:'Library',dojo:'BAMBOO DOJO',tagline:'A little slice of happiness.',intro:'Clear your mind. Sharpen your senses.\nMake every swipe a fresh start.',start:'LET IT SLICE',how:'How to play',input:'Hold and drag / swipe to slice · Cut 3 in a row for a combo',choose:'Choose your practice',classic:'Classic',arcade:'Arcade Rush',zen:'Zen Garden',classicBrief:'3 chances · No time limit',arcadeBrief:'60 seconds · Chase combos',zenBrief:'90 seconds · No bombs',record:'Personal best',fresh:'Fresh picks. Satisfying slices.',score:'SCORE',best:'BEST',pause:'Pause',playHint:'Slice the vegetables. Avoid the sizzling bombs.',zenHint:'Take your time. Enjoy every slice.',paused:'A moment of stillness.',pausedHint:'Your round is waiting. The clock is paused, too.',resume:'KEEP SLICING',restart:'Restart',home:'Back to dojo',finished:'A fine round of slicing.',roundScore:'YOUR SCORE',sliced:'Vegetables',maxCombo:'Best combo',again:'SLICE AGAIN',gotIt:'GOT IT',helpInput:'Hold the left mouse button and drag, or swipe with your finger. Slice 3 or more vegetables in quick succession for a combo. Each vegetable starts at 10 points.',classicRule:'No time limit. Each missed vegetable or bomb costs one chance. The round ends after three mistakes.',arcadeRule:'Score as much as you can in 60 seconds. Bombs cost 50 points, down to a minimum of zero. No penalty for misses. Blue ice slows vegetables for 5 seconds; gold ×2 doubles points for 6 seconds.',zenRule:'90 seconds with no bombs and no penalties for misses. Relax and enjoy the slicing.',shortcuts:'P / Esc to pause · M for sound · F for fullscreen. Switching windows or rotating the screen pauses the game.',mute:'Mute sound',unmute:'Enable sound',full:'Fullscreen',noFull:'Fullscreen is unavailable in this browser. You can keep playing here.',newBest:'A new personal best. Beautifully sliced!',nice:'One more round? Try a bigger combo.',first:'Find your rhythm. The next slice will be better.',freeze:'FROZEN',double:'DOUBLE POINTS',canvas:'Slicing dojo. Hold and drag with a mouse or swipe with a finger.',life:'Chances remaining',gameTitle:'Vegetable Ninja',modeGroup:'Game mode'}
  };
  let locale = 'zh-Hans', mode = 'classic', muted = false, initialBest = 0, toastTimer;
  try {
    const qs = new URLSearchParams(window.parent !== window ? window.parent.location.search : location.search);
    const saved = qs.get('lang') || localStorage.getItem('neon-arcade.locale');
    if (Object.hasOwn(strings, saved)) locale = saved;
    muted = localStorage.getItem('vegetable-ninja.muted') === 'true';
  } catch { /* Default language and sound work with restricted storage. */ }
  const t = key => strings[locale][key] || strings['zh-Hans'][key] || key;
  const dialogs = ['pause-dialog','result-dialog','help-dialog'];
  function closeDialogs() { dialogs.forEach(id => { if ($(id).open) $(id).close(); }); }
  function setState(state) {
    document.body.dataset.state = state; $('menu').hidden = state !== 'menu';
    $('hud').hidden = state === 'menu'; $('play-hint').hidden = state !== 'playing';
  }
  function update(s) {
    $('score').textContent = s.score; $('best').textContent = s.best;
    $('clock').textContent = Number.isFinite(s.timeLeft) ? Math.ceil(s.timeLeft).toString().padStart(2,'0') : '∞';
    $('clock').style.color = s.timeLeft <= 10 ? '#ffac86' : '';
    $('lives').hidden = s.mode !== 'classic';
    [...$('lives').children].forEach((span, i) => span.classList.toggle('lost', i >= s.lives));
    $('lives').setAttribute('aria-label', `${t('life')}: ${s.lives}`);
    $('effects').textContent = [s.frozen ? t('freeze') : '', s.double ? t('double') : ''].filter(Boolean).join(' · ');
  }
  const engine = new VegetableNinjaEngine($('game'), {
    onUpdate: update,
    onPause: () => { setState('paused'); if (!$('pause-dialog').open) $('pause-dialog').showModal(); },
    onEnd: s => {
      setState('ended'); update(s); $('final-score').textContent = s.score;
      $('final-sliced').textContent = s.sliced; $('final-combo').textContent = s.maxCombo; $('final-best').textContent = s.best;
      $('result-message').textContent = t(s.score > initialBest ? 'newBest' : s.score ? 'nice' : 'first');
      $('result-kicker').textContent = s.score > initialBest ? 'NEW PERSONAL BEST' : 'WELL SLICED';
      $('result-dialog').showModal();
    }
  });
  function setLanguage() {
    document.documentElement.lang = locale; document.title = t('gameTitle') + ' · NEON ARCADE';
    document.querySelectorAll('[data-text]').forEach(el => { el.textContent = t(el.dataset.text); });
    document.querySelector('[data-text=intro]').style.whiteSpace = 'pre-line';
    $('title').innerHTML = locale === 'en' ? '<span>VEGETABLE</span><strong>NINJA</strong>' : '<span>蔬菜</span><strong>忍者</strong><i class="seal" aria-hidden="true">斩</i>';
    $('language').value = locale; $('game').setAttribute('aria-label', t('canvas'));
    document.querySelector('.modes').setAttribute('aria-label',t('modeGroup'));
    $('fullscreen').setAttribute('aria-label',t('full')); $('fullscreen').title = t('full');
    syncSound(); selectMode(mode); update(engine.snapshot());
    const url = new URL('../../../games.html', document.baseURI); url.searchParams.set('lang', locale); document.querySelector('.back-link').href = url.href;
  }
  function selectMode(value) {
    mode = value;
    document.querySelectorAll('[data-mode]').forEach(b => { const yes = b.dataset.mode === mode; b.classList.toggle('selected',yes); b.setAttribute('aria-pressed',String(yes)); });
    $('menu-best').textContent = engine.best[mode]; $('mode-name').textContent = t(mode);
    $('play-hint').textContent = t(mode === 'zen' ? 'zenHint' : 'playHint');
  }
  function syncSound() {
    engine.setMuted(muted); $('sound').setAttribute('aria-pressed',String(muted));
    $('sound').setAttribute('aria-label',t(muted ? 'unmute' : 'mute')); $('sound').title = t(muted ? 'unmute' : 'mute');
  }
  function start() { closeDialogs(); initialBest = engine.best[mode]; setState('playing'); engine.start(mode); $('game').focus({preventScroll:true}); }
  function home() { closeDialogs(); engine.home(); setState('menu'); selectMode(mode); $('start').focus({preventScroll:true}); }
  function resume() { closeDialogs(); setState('playing'); engine.resume(); $('game').focus({preventScroll:true}); }
  function sound() { muted = !muted; syncSound(); try { localStorage.setItem('vegetable-ninja.muted',String(muted)); } catch {} }
  function toast(msg) { clearTimeout(toastTimer); $('toast').textContent = msg; $('toast').hidden = false; toastTimer = setTimeout(() => $('toast').hidden = true, 3500); }
  async function fullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); else toast(t('noFull')); }
    catch { toast(t('noFull')); }
  }
  $('start').addEventListener('click',start); $('again').addEventListener('click',start); $('restart').addEventListener('click',start);
  $('pause').addEventListener('click',() => engine.pause()); $('resume').addEventListener('click',resume);
  document.querySelectorAll('.home-action').forEach(b => b.addEventListener('click',home));
  document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click',() => selectMode(b.dataset.mode)));
  $('help').addEventListener('click',() => $('help-dialog').showModal()); $('close-help').addEventListener('click',() => $('help-dialog').close());
  $('sound').addEventListener('click',sound); $('fullscreen').addEventListener('click',fullscreen);
  $('language').addEventListener('change',e => { locale = e.target.value; setLanguage(); try { localStorage.setItem('neon-arcade.locale',locale); } catch {} });
  $('pause-dialog').addEventListener('cancel',e => { e.preventDefault(); resume(); });
  $('result-dialog').addEventListener('cancel',e => { e.preventDefault(); home(); });
  window.addEventListener('keydown',e => {
    if (e.repeat || e.target.tagName === 'SELECT') return;
    if (e.key === 'Escape' && dialogs.some(id => $(id).open)) return;
    if (e.key.toLowerCase() === 'p' || e.key === 'Escape') { if (engine.state === 'playing') { e.preventDefault(); engine.pause(); } else if (engine.state === 'paused') { e.preventDefault(); resume(); } }
    if (e.key.toLowerCase() === 'm') sound();
    if (e.key.toLowerCase() === 'f') fullscreen();
  });
  document.addEventListener('contextmenu',e => { if (e.target === $('game')) e.preventDefault(); });
  window.addEventListener('pagehide',() => engine.destroy(),{once:true});
  setLanguage(); setState('menu');
})();
