/* 七剑江湖 · 消耗品图谱。独立矢量轮廓，兼顾快捷栏与物品详览。 */
(function () {
  'use strict';
  let serial = 0;
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const catalog = {
    herb: {name:'回春散',form:'草药包·散剂',color:'#6f9560',description:'青叶与药粉包入素纸，以麻绳扎紧。'},
    'small-return': {name:'小还丹',form:'瓷瓶·丹药',color:'#5f9e9d',description:'小青瓷瓶盛装日常还丹。'},
    'great-return': {name:'大还丹',form:'锦盒·金丹',color:'#d5aa4f',description:'朱漆锦盒内收一颗金色大还丹。'},
    'tiger-wine': {name:'虎骨酒',form:'葫芦·药酒',color:'#bc7b43',description:'双腹酒葫芦，朱绳缠颈，内盛虎骨药酒。'},
    'guardian-pill': {name:'护心丹',form:'药瓶·丹丸',color:'#7294bf',description:'扁圆蓝瓷药瓶，系护心结，装细小丹丸。'},
    'strength-pill': {name:'培元丹',form:'蜡封·赤丹',color:'#c26b57',description:'折开的药纸中，一颗朱红培元丹覆金纹。'},
    'vitality-pill': {name:'固本丹',form:'玉瓶·药丹',color:'#84ab78',description:'长颈六棱玉瓶，琥珀封口，储藏固本药丹。'}
  };
  Object.keys(catalog).forEach(key => {catalog[key].accent=catalog[key].color;Object.freeze(catalog[key]);});
  Object.freeze(catalog);
  const p = (d,fill,stroke='#61533e',w=2) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const line = (d,color='#dbc08b',w=2) => p(d,'none',color,w);
  function drawing(key,u) {
    switch(key) {
      case 'herb': return `${p('M38 52Q22 42 23 21Q44 24 46 47','#6a9564','#486748')}${p('M48 49Q43 23 62 14Q70 34 54 51','#87ac70','#486748')}${p('M55 52Q67 29 81 34Q80 52 60 57','#4e8057','#486748')}${line('M34 33 48 62M59 28 50 60M71 42 54 60','#c9ce91',1.7)}${p('M21 54 45 45 76 53 84 78 65 91 29 86 15 69Z',u('paper'))}${p('M21 54 47 65 76 53 65 76 29 86 35 65Z','#d6be87','#90764c',1.5)}${line('M47 51 45 82M20 66 76 72','#7f6041',3)}${p('M45 63C21 50 29 77 45 65C68 49 65 79 45 65','#ceb27c','#7c5d3d',2)}${line('M45 65 39 79M45 65 56 82','#7f6041',2.5)}`;
      case 'small-return': return `${p('M39 17 59 17 59 32Q60 38 69 41Q75 45 75 55L73 81Q72 89 64 90H34Q26 89 25 81L23 55Q23 45 30 41Q38 38 39 32Z',u('jade'),'#426d69')}${p('M37 15Q48 11 61 15L61 24H37Z',u('gold'),'#78603a')}${line('M29 51 29 77Q29 82 33 83','#c9e0c0',3)}${p('M35 48 63 48 63 77 35 77Z',u('paper'),'#b39563',1.5)}${p('M49 52 58 63 49 72 40 63Z','#668f7f','#527865',1.5)}${line('M44 63H54M49 58V68','#f1ddb0',2)}<circle cx="75" cy="83" r="9" fill="${u('pearl')}" stroke="#9b814e" stroke-width="2"/><circle cx="72" cy="80" r="2.5" fill="#fff1cb"/>`;
      case 'great-return': return `${p('M18 40 26 15 78 15 85 40 76 57 26 57Z',u('red'),'#774936')}${p('M25 36 31 22 73 22 78 36Z','#603d35','#c49a55',2)}${p('M12 54 29 43 76 43 88 55 81 85 21 85Z',u('red'),'#704735')}${p('M15 54 29 46 75 46 85 55 74 69 28 69Z','#e7c58a','#bd9557',2)}${p('M24 64Q24 50 49 48Q76 49 77 64L68 73H32Z','#a86449','#dcb77a',1.5)}<circle cx="50" cy="56" r="19" fill="${u('gold')}" stroke="#9a7134" stroke-width="2"/>${line('M38 54Q43 40 55 43','#fff0af',3)}${line('M47 48 56 53 48 62 43 57 54 54','#b78633',2)}${line('M21 73H79M25 81H74','#e3b763',2)}${p('M44 71H56V85H44Z',u('gold'),'#946b35',1)}${line('M50 75V81','#865b31',2)}`;
      case 'tiger-wine': return `${p('M42 14H57L59 23Q72 29 69 42Q67 49 62 51Q82 58 81 73Q80 90 50 93Q20 90 19 73Q18 58 38 51Q30 46 31 36Q32 25 41 23Z',u('amber'),'#765036')}${p('M40 10 58 10 59 19H39Z',u('paper'),'#765036')}${line('M37 33Q34 40 40 44M29 66Q24 80 40 84','#f6cd87',3)}${line('M34 49Q50 55 65 48M35 52Q50 59 64 52','#944d40',4)}${p('M60 52Q80 52 82 66L74 70 68 60Z','#b85a46','#7f4438',1.5)}${p('M36 64 59 61 65 80 41 84Z',u('paper'),'#a37c4e',1.5)}${line('M43 68 55 76M54 67 45 78M42 73 57 71','#8b5637',2.8)}`;
      case 'guardian-pill': return `${p('M40 17H61V31Q77 37 82 56Q90 86 53 92Q16 91 18 67Q19 42 40 31Z',u('blue'),'#45617d')}${p('M37 13H64V25H37Z',u('gold'),'#816b45')}${p('M31 47Q50 32 69 47L68 74Q50 88 31 74Z','#b6cfda','#63839c',2)}${p('M50 46 64 52 61 65Q57 73 50 78Q43 73 39 65L36 52Z','#557ba0','#e4d5aa',2)}${line('M43 60 48 65 58 55','#f1dfac',3)}${line('M36 29 64 29M58 30 74 43 69 49','#c1aa6e',2.5)}<circle cx="77" cy="82" r="7" fill="${u('pearl')}" stroke="#a28b59" stroke-width="1.5"/><circle cx="66" cy="88" r="5" fill="${u('pearl')}" stroke="#a28b59" stroke-width="1.5"/>`;
      case 'strength-pill': return `${p('M12 59 21 26 43 32 61 22 85 38 90 72 67 91 35 86Z',u('paper'),'#a58a5e')}${p('M21 26 39 47 12 59 30 68 35 86 51 72 67 91 70 66 90 72 76 54 85 38 61 42 61 22 49 43 43 32 39 47Z','#f0d7a3','#bea071',1.5)}<circle cx="51" cy="57" r="25" fill="${u('red')}" stroke="#984e3b" stroke-width="2"/>${p('M34 46Q39 35 54 37Q48 43 34 46Z','#edb08c','none',0)}${line('M37 58Q51 43 65 58Q51 73 37 58M51 43V72','#e9bc69',2.5)}${p('M47 54 55 54 57 61 50 65 45 60Z',u('gold'),'#c58c45',1)}${line('M24 72 33 74M72 79 78 73','#c39e65',2)}`;
      case 'vitality-pill': return `${p('M41 16H59V34L74 43 80 78 68 91H32L20 78 26 43 41 34Z',u('jade'),'#526e56')}${p('M41 16H59V34L65 44 68 80 60 91H40L32 80 35 44 41 34Z','#9bb893','#6f906e',1.5)}${p('M38 10H62L64 21H36Z',u('amber'),'#80673b')}${line('M40 27H60M29 47 25 76 34 85M43 36 39 48 39 75','#d3dfb0',2.5)}${p('M38 48H62V74L50 81 38 74Z',u('paper'),'#a58d56',1.5)}${p('M50 74Q38 62 45 56Q49 58 50 62Q52 52 58 54Q62 65 50 74Z','#659466','#48734d',1.5)}${line('M50 61V73','#e0dfa5',1.6)}${line('M36 25Q49 29 64 25M62 27 73 39 70 46','#b89450',2.5)}`;
      default: return drawing('herb',u);
    }
  }
  function icon(id,opts) {
    opts=opts || {};
    const key=Object.prototype.hasOwnProperty.call(catalog,id)?id:'herb', info=catalog[key], uid=`consumable-${++serial}`;
    const u=kind=>`url(#${uid}-${kind})`;
    const size=Number.isFinite(Number(opts.size))?Math.max(16,Math.min(1024,Number(opts.size))):64;
    const gradients={paper:['#f9e6bc','#c8a971'],gold:['#fff0ac','#c18b35'],jade:['#bfdbb7','#528a80'],red:['#dc8c67','#963e33'],amber:['#f1bd70','#a66b35'],blue:['#b6d7de','#507896'],pearl:['#fff6cf','#c6ad72']};
    const defs=Object.keys(gradients).map(k=>`<linearGradient id="${uid}-${k}" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="${gradients[k][0]}"/><stop offset="1" stop-color="${gradients[k][1]}"/></linearGradient>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" class="consumable-art ${esc(opts.className || '')}" data-consumable="${key}" ${opts.decorative?'aria-hidden="true"':`role="img" aria-label="${esc(info.name+' · '+info.form)}"`} focusable="false"><defs>${defs}</defs><ellipse cx="50" cy="91" rx="33" ry="5" fill="#403627" opacity=".14"/>${drawing(key,u)}</svg>`;
  }
  window.ConsumableArt=Object.freeze({icon,meta:id=>Object.prototype.hasOwnProperty.call(catalog,id)?catalog[id]:catalog.herb,catalog});
})();
