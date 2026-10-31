/* Optional reader notes; never alters CANON_DATA, event IDs or dialogue. */
(() => {
  'use strict';
  const data=window.SevenDialogueAuditData;
  if(!data)return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function event(id){
    const row=data.events[id];
    const addition=window.SevenVillainDialogue?.scenes.find(scene=>scene.id===id);
    const addedNote=addition?`<p><b>本轮修订：</b>删去未核交锋，改为 ${addition.lines.length} 段角色旁白。人物立绘表示叙述对象，不表示角色说出了这段话。原片台词待核对。</p>`:'';
    if(!row)return '<p class="ss-audit-note">当前文字为游戏改编；原片逐字对白尚未核准。</p>';
    const evidence=row.evidence.map(e=>{
      const source=data.sources.find(s=>s.id===e.sourceId);
      return `<li>${esc(e.fact)}${source?` <a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(e.section||source.title)} ↗</a>`:''}</li>`;
    }).join('');
    return `<div class="ss-audit-note" data-audit-event="${esc(id)}"><p><b>事件依据：</b>${esc(row.status)}。<b>对白：</b>已删短改编对白，纠正有依据的事件；未认定为动画原句。</p>${evidence?`<ul>${evidence}</ul>`:''}${addedNote}${row.currentRevision?`<p>${esc(row.currentRevision)}</p>`:row.note?`<p>${esc(row.note)}</p>`:''}${row.missing?`<p><b>待补核：</b>${esc(row.missing)}</p>`:''}</div>`;
  }
  function summary(){
    const chapters=Object.values(window.CANON_DATA.heroes).flatMap(hero=>hero.chapters);
    const lines=chapters.flatMap(chapter=>chapter.dialogue||[]);
    const spoken=lines.filter(line=>line.speaker!=='旁白').length;
    const narration=lines.length-spoken;
    return `<details class="chapter-source ss-audit-summary"><summary>对白与美术审校记录 · ${data.checked}</summary><p>当前 ${chapters.length} 章共 ${spoken} 句游戏改编发言、${narration} 段角色旁白。逐字原句核准 0 句。原审校快照另存，不再用旧计数代表现稿。</p>${window.SevenVillainDialogue?`<p>已删去上一轮 ${window.SevenVillainDialogue.removedInventedLines} 句未核交锋，改为 ${window.SevenVillainDialogue.scenes.length} 幕、${window.SevenVillainDialogue.addedLineCount} 段角色旁白。后段缺少逐场依据的内容仍标为游戏编排，未冒充原片实录。</p>`:''}<p>剧情简介可支持部分事件，不能代替对白字幕。已查看的终集单帧，也不足以核准整场台词。</p><p>新立绘和头像用于选人、传记、界面与对白。它们是参考原作形象生成的正面重建图，并非动画截帧。场景中的实时人物、招式和合璧演出继续使用原有动画模型。</p><p>莎丽木剑阶段仍属游戏训练编排；左右手与佩剑按现有传记切换。虹猫后期沿用同一人物母版，火焰是独立游戏表现层。</p><details><summary>查看来源核验范围</summary><div class="ss-audit-sources">${data.sources.map(source=>`<article><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a><p>${esc(source.status)} · ${esc(source.use)}</p></article>`).join('')}</div></details></details>`;
  }
  window.SevenDialogueAudit=Object.freeze({version:1,event,summary});
})();
