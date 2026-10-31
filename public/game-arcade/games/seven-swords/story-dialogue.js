/* Presentation only: consume the existing chapter/encounter markup, retaining
 * the original action nodes and their delegated handlers and validation. */
(() => {
  'use strict';
  let current=null,frame=0,listeners=null;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  function reset(){listeners?.abort();listeners=null;cancelAnimationFrame(frame);frame=0;current=null;document.querySelector('#modalLayer')?.classList.remove('story-layer');}
  function mount(modal,type,state,companions=[]){
    reset();
    if(!state||!['chapter','encounter','chapter-outcome','encounter-outcome','life-conversation'].includes(type))return;
    const lines=[];
    const intro=modal.querySelector('.story-copy')?.textContent.trim();
    if(intro)lines.push({speaker:'旁白',text:intro});
    modal.querySelectorAll('.chapter-line').forEach(node=>lines.push({speaker:node.querySelector('b')?.textContent.trim()||'旁白',text:node.querySelector('p')?.textContent||'',stageId:node.dataset.artStage||undefined,portraitSpeaker:node.dataset.portraitSpeaker||undefined,provenance:node.dataset.provenance||''}));
    const interlude=modal.querySelector('.chapter-interlude p')?.textContent;
    if(interlude)lines.push({speaker:'旁白',text:interlude});
    if(!lines.length)return;
    const adapted=lines.some(line=>line.provenance);
    const narrated=lines.some(line=>line.provenance==='剧情旁白');
    const title=modal.querySelector('#dialogTitle')?.textContent||'江湖一叙';
    const place=modal.querySelector('.chapter-place')?.textContent||modal.querySelector('.modal-header p')?.textContent||'';
    const actions=modal.querySelector('.chapter-actions,.modal-footer');
    const rewards=modal.querySelector('.chapter-rewards');
    const sources=modal.querySelector('.chapter-source');
    const battleParty=modal.querySelector('.life-battle-party');
    const note=Array.from(modal.querySelectorAll('.small-note')).find(node=>!node.closest('.life-battle-party'));
    const results=Array.from(modal.querySelectorAll('.sword-result,.reward-grid,.checkpoint-note'));
    const close=modal.querySelector('.modal-close');
    modal.classList.add('story-dialogue');
    document.querySelector('#modalLayer').classList.add('story-layer');
    modal.innerHTML=`<header class="story-heading"><span>七剑江湖 · ${type.startsWith('chapter')?'传记':type==='life-conversation'?'围桌叙话':'江湖一遇'}</span><h2 id="dialogTitle">${esc(title)}</h2><p>${esc(place)}</p></header>${adapted?`<small class="story-adaptation">${narrated?'剧情旁白 / 游戏编排':'游戏改编对白'} · 非原片逐字台词</small>`:''}<div class="story-figure" aria-hidden="true"></div><section class="story-panel"><div class="story-speaker-row"><h3 class="story-speaker"></h3><span class="story-count" aria-hidden="true"></span></div><p class="story-line" aria-hidden="true"></p><p class="story-sr" aria-live="polite" aria-atomic="true"></p><button type="button" class="story-next"><span>点击展开</span><i aria-hidden="true">◆</i></button><div class="story-decisions" hidden></div></section>`;
    if(close)modal.append(close);
    const decisions=modal.querySelector('.story-decisions');
    results.forEach(node=>decisions.append(node));
    if(rewards)decisions.append(rewards);
    if(battleParty)decisions.append(battleParty);
    if(actions)decisions.append(actions);
    if(sources)decisions.append(sources);
    if(note)decisions.append(note);
    listeners=new AbortController();
    current={modal,lines,index:0,state,companions,shown:0,complete:false,decisions:false};
    modal.querySelector('.story-next').addEventListener('click',event=>{event.stopPropagation();advance();});
    modal.addEventListener('click',event=>{if(!event.target.closest('button,a,summary,details,.story-heading')&&!current?.decisions){event.stopPropagation();advance();}},{signal:listeners.signal});
    showLine();
  }
  function showLine(){
    cancelAnimationFrame(frame);
    const c=current;if(!c)return;
    const line=c.lines[c.index],m=c.modal,ui=window.SevenUIArt;
    const id=ui?.speakerId(line.portraitSpeaker||line.speaker,c.state.hero);
    const sword=id===c.state.hero?c.state.sword:c.companions.find(h=>h.id===id)?.swordState||c.state.profiles?.[id]?.sword;
    m.querySelector('.story-speaker').textContent=line.speaker;
    m.querySelector('.story-count').textContent=`${c.index+1} / ${c.lines.length}`;
    m.querySelector('.story-figure').innerHTML=id?ui.render(id,{swordState:sword,stageId:line.stageId}):'';
    m.classList.toggle('story-narration',!id);
    m.querySelector('.story-sr').textContent=line.speaker+'：'+line.text;
    c.chars=Array.from(line.text);c.shown=0;c.complete=false;
    m.querySelector('.story-line').textContent='';
    m.querySelector('.story-next span').textContent='点击展开';
    if(reduced.matches){finishLine();return;}
    const start=performance.now();
    function tick(now){if(current!==c)return;const n=Math.min(c.chars.length,Math.floor((now-start)/25)+1);if(n!==c.shown){c.shown=n;m.querySelector('.story-line').textContent=c.chars.slice(0,n).join('');}if(n===c.chars.length)finishLine();else frame=requestAnimationFrame(tick);}
    frame=requestAnimationFrame(tick);
  }
  function finishLine(){const c=current;if(!c)return;cancelAnimationFrame(frame);c.complete=true;c.modal.querySelector('.story-line').textContent=c.lines[c.index].text;c.modal.querySelector('.story-next span').textContent=c.index===c.lines.length-1?'继续 · 作出回应':'点击继续';}
  function advance(){const c=current;if(!c||c.decisions)return;if(!c.complete){finishLine();return;}if(c.index<c.lines.length-1){c.index++;showLine();return;}c.decisions=true;c.modal.querySelector('.story-next').hidden=true;c.modal.querySelector('.story-decisions').hidden=false;c.modal.classList.add('story-choosing');c.modal.querySelector('.story-decisions button')?.focus({preventScroll:true});}
  // Capture before world and app shortcuts. Tab still reaches the existing modal
  // focus trap. Keyup is deliberately not blocked, so held movement is released.
  window.addEventListener('keydown',event=>{
    if(!current||document.querySelector('#modalLayer').hidden)return;
    if(event.ctrlKey||event.metaKey){event.stopImmediatePropagation();return;}
    if(event.code==='Tab'||['F5','F11','F12'].includes(event.code))return;
    if(event.code==='Escape'){event.preventDefault();event.stopImmediatePropagation();current.modal.querySelector('.modal-close')?.click();return;}
    if(event.repeat){event.preventDefault();event.stopImmediatePropagation();return;}
    const native=event.target.closest?.('button,a,summary');
    if(native&&['Enter','Space'].includes(event.code)){event.stopPropagation();return;}
    event.preventDefault();event.stopImmediatePropagation();
    if(!event.repeat&&['Enter','Space'].includes(event.code))advance();
  },true);
  reduced.addEventListener?.('change',()=>{if(reduced.matches&&current)finishLine();});
  window.SevenStoryDialogue=Object.freeze({mount,reset});
})();
