/* Disposable sword-manual demonstrations. Uses live Combat and its real skill FX. */
(() => {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let active = null;
  class Showcase {
    constructor(opts) {
      this.opts = opts;
      this.root = opts.container;
      this.stages = window.SevenTrainingData.getStages(opts.heroId);
      const sword = opts.profile?.sword;
      this.stage = this.stages.find(s => sword && ['status','hand','ultimateUnlocked','weaponName'].every(k => (s.swordState[k] ?? '') === (sword[k] ?? ''))) || this.stages[0];
      this.tier = 'q';
      this.root.innerHTML = `<div class="skill-showcase-toolbar"><label>人物阶段 <select aria-label="演示人物阶段">${this.stages.map(s => `<option value="${esc(s.id)}">${esc(s.label)}</option>`).join('')}</select></label><span class="skill-showcase-badge">实时演招 · 独立试演</span></div><p class="skill-showcase-access"></p><div class="skill-showcase-arena" aria-label="实时剑招与木桩演示"></div><div class="skill-showcase-controls"><div class="skill-showcase-moves" role="group" aria-label="选择演示剑招"></div><button class="secondary-button" data-showcase="replay">重演此招 ↻</button><button class="secondary-button" data-bgm-toggle>音乐：${window.SevenBGM?.enabled ? '开' : '关'}</button><button class="secondary-button" data-showcase="pause">暂停演示</button></div><section class="skill-showcase-description"><div><h3></h3><p></p></div><output aria-label="本次试演命中与伤害">命中 0 次 · 伤害 0</output></section><div class="skill-showcase-foot"><p>真实出招、命中与消散。试演不推进传记、不解锁招式、不消耗行囊。<br>固定十级、零修习；此处数值仅用于观察，实战随角色成长变化。</p><button class="primary-button" data-showcase="practice">亲自试剑 · 进入演武场</button></div>`;
      this.select = this.root.querySelector('select');
      this.select.value = this.stage.id;
      this.click = e => {
        const b = e.target.closest('[data-showcase]');
        if (!b || b.disabled) return;
        const action = b.dataset.showcase;
        if (['q','e','f'].includes(action)) { this.tier = action; this.renderMoves(); this.replay(); }
        else if (action === 'replay') this.replay();
        else if (action === 'pause') { this.combat.pause(!this.combat.paused); b.focus({preventScroll:true}); this.sync(); }
        else if (action === 'practice') this.opts.onPractice(this.stage.id);
      };
      this.change = () => { this.stage = this.stages.find(s => s.id === this.select.value); this.launch(); };
      this.key = e => {
        if (e.ctrlKey || e.metaKey || e.altKey) { e.stopImmediatePropagation(); return; }
        if (e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); this.opts.onClose?.(); return; }
        if (/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || '')) return;
        if (['KeyQ','KeyE','KeyF','KeyJ','KeyR','KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
          // The manual owns its shortcuts. Do not also trigger Combat's global input.
          if (e.code === 'Space' && e.target?.tagName === 'BUTTON') return;
          e.preventDefault(); e.stopImmediatePropagation();
          const tier = {KeyQ:'q',KeyE:'e',KeyF:'f'}[e.code];
          if (!e.repeat && tier && (tier !== 'f' || this.stage.finisherUnlocked)) { this.tier = tier; this.renderMoves(); this.replay(); }
        }
      };
      this.root.addEventListener('click', this.click);
      this.select.addEventListener('change', this.change);
      window.addEventListener('keydown', this.key, true);
      this.launch();
      this.timer = setInterval(() => this.sync(), 150);
    }
    launch() {
      if (this.combat && window.SevenCombat.instance === this.combat) window.SevenCombat.stop();
      if (this.tier === 'f' && !this.stage.finisherUnlocked) this.tier = 'q';
      this.combat = window.SevenCombat.start({
        container: this.root.querySelector('.skill-showcase-arena'), hero: {...this.stage.hero}, swordState: {...this.stage.swordState},
        level: 10, upgrade: {attack:0,vitality:0,mastery:0}, difficulty: 'normal',
        encounter: {name:'剑诀试演',biome:'forest',profile:'crowd',danger:3,seed:73021},
        entryEnergy:100, herbs:0, dojo: {targetMode:'single',freeSkills:true,timeScale:1}, onEnd: () => {}
      });
      this.combat.soundOn = false;
      this.combat.canvas.tabIndex = -1;
      this.combat.canvas.setAttribute('aria-label', '剑招实时演示画面；使用画面下方按钮选择、重演或暂停剑招。');
      // The standard battle HUD is replaced by the accessible manual controls.
      this.combat.root.querySelectorAll(':scope > :not(canvas)').forEach(el => { el.hidden = true; el.inert = true; });
      this.renderMoves();
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { this.combat.pause(true); this.sync(); }
      else this.replay();
    }
    renderMoves() {
      const s = this.stage, profile = this.opts.profile;
      const attained = !!profile && (profile.progress?.step ?? profile.progress?.chapters?.length ?? 0) >= s.afterChapter;
      this.root.querySelector('.skill-showcase-access').textContent = `${s.label} · ${s.weaponName} · ${s.hand === 'left' ? '左手' : '右手'}持剑。${attained ? '传记已到达此阶段。' : '仅供预览：传记尚未到达此阶段，不代表已解锁。'}`;
      this.root.querySelector('.skill-showcase-moves').innerHTML = ['q','e',...(s.hasFinisher?['f']:[])].map(t => `<button data-showcase="${t}" aria-pressed="${this.tier===t}" ${t==='f'&&!s.finisherUnlocked?'disabled':''}><kbd>${t.toUpperCase()}</kbd><span>${esc(s[t+'Name'])}<small>${t==='f'&&!s.finisherUnlocked?'此阶段尚未领悟':this.tier===t?'正在展示':'点击演招'}</small></span></button>`).join('');
      this.root.querySelector('.skill-showcase-description h3').textContent = `${this.tier.toUpperCase()} · ${s[this.tier+'Name']}`;
      this.root.querySelector('.skill-showcase-description p').textContent = s[this.tier+'Description'];
    }
    replay() {
      const c = this.combat, focus = document.activeElement;
      c.pause(false); c.resetDojo();
      if (focus?.isConnected) focus.focus({preventScroll:true});
      // Allow the dummy's spawn invulnerability to finish, then use the normal skill entry point.
      const tier = this.tier;
      c.schedule(.55, () => c[{q:'useSkill',e:'useUlt',f:'useFinisher'}[tier]]());
      this.sync();
    }
    sync() {
      if (!this.combat || this.combat.destroyed) return;
      const s = this.combat.getDojoState();
      this.root.querySelector('output').textContent = `命中 ${s.hits} 次 · 伤害 ${Math.round(s.damageDealt)}`;
      this.root.querySelector('[data-showcase="pause"]').textContent = s.paused ? '继续演示' : '暂停演示';
    }
    destroy() {
      clearInterval(this.timer);
      window.removeEventListener('keydown', this.key, true);
      this.root.removeEventListener('click', this.click);
      this.select.removeEventListener('change', this.change);
      if (window.SevenCombat.instance === this.combat) window.SevenCombat.stop();
      this.combat = null;
    }
  }
  window.SevenSkillShowcase = {
    get instance() { return active; },
    mount(opts) { this.destroy(); active = new Showcase(opts); return active; },
    destroy() { if (active) active.destroy(); active = null; }
  };
})();
