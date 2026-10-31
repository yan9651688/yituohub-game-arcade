/* 七剑演武场 · Independent, disposable character-stage practice session. */
(() => {
  'use strict';
  let active = null;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TARGETS = {
    single: { label: '单桩', description: '木桩不移动，适合观察剑路与单体命中。' },
    crowd: { label: '桩阵', description: '密集木桩自动补齐，可反复试练范围剑招。' },
    sparring: { label: '对练', description: '陪练会进攻，正常受伤与回血，气血最低保留 1 格。' }
  };

  class Dojo {
    constructor(opts) {
      if (!window.SevenTrainingData || !window.SevenCombat) throw new Error('Training arena is not available');
      this.opts = opts;
      this.container = opts.container;
      this.data = window.SevenTrainingData;
      this.heroId = this.data.heroes.some(h => h.id === opts.heroId) ? opts.heroId : 'hongmao';
      this.stageByHero = new Map();
      this.settings = { targetMode: 'crowd', freeSkills: true, timeScale: 1 };
      this.level = 10;
      this.listeners = [];
      this.destroyed = false;
      this.panelOpen = false;
      this.panelResume = false;
      this.combat = null;
      this.build();
      this.bind();
      this.syncPanelAccessibility();
      this.launch(this.heroId, opts.stageId);
      this.poll();
    }

    build() {
      this.root = document.createElement('section');
      this.root.className = 'dojo-shell';
      this.root.dataset.panel = 'closed';
      this.root.setAttribute('role', 'dialog');
      this.root.setAttribute('aria-modal', 'true');
      this.root.setAttribute('aria-labelledby', 'dojoTitle');
      this.root.innerHTML = `
        <header class="dojo-header">
          <div class="dojo-brand"><span class="dojo-seal" aria-hidden="true">演<br>武</span><div><p>七剑同心 · 自由试剑</p><h1 id="dojoTitle">七剑演武场</h1></div></div>
          <button class="dojo-current" data-dojo="panel" aria-controls="dojoSidebar" aria-expanded="false"><span class="dojo-current-name"></span><span class="dojo-current-stage"></span><small>切换角色 / 阶段 <i>⌄</i></small></button>
          <div class="dojo-header-actions"><span class="dojo-hp-rule"><i></i>气血最低保留 1 格</span><button class="dojo-exit" data-dojo="exit">收剑离场 <span>↗</span></button></div>
        </header>
        <div class="dojo-layout">
          <button class="dojo-panel-scrim" data-dojo="panel-close" aria-label="合上人物阶段选择" hidden></button>
          <aside class="dojo-sidebar" id="dojoSidebar" aria-label="剑主与人物阶段">
            <div class="dojo-sidebar-heading"><span>选择剑主</span><small>七侠皆可试练</small><button class="dojo-panel-close" data-dojo="panel-close" aria-label="合上人物阶段选择">×</button></div>
            <nav class="dojo-heroes" aria-label="选择训练角色">${this.data.heroes.map(h => `<button class="dojo-hero" data-dojo="hero" data-hero="${h.id}" aria-pressed="false" style="--hero-tint:${esc(h.color)}"><span class="dojo-portrait">${window.GameArt?.heroSVG(h.id, { portrait: true }) || ''}</span><strong>${esc(h.name)}</strong></button>`).join('')}</nav>
            <section class="dojo-stage-section"><div class="dojo-section-heading"><h2>人物阶段</h2><span class="dojo-stage-count"></span></div><div class="dojo-stages" role="group" aria-label="选择人物成长阶段"></div></section>
            <section class="dojo-loadout" aria-label="本阶段的佩剑与招式">
              <figure class="dojo-stage-preview" aria-label="当前阶段立绘"></figure>
              <div class="dojo-weapon"><span class="dojo-weapon-art"></span><div><strong class="dojo-weapon-name"></strong><small class="dojo-weapon-hand"></small></div></div>
              <p class="dojo-stage-description"></p>
              <div class="dojo-move-info"><kbd>Q</kbd><div><strong class="dojo-q-name"></strong><span class="dojo-q-description"></span></div><button class="dojo-try" data-dojo="cast" data-move="q" aria-label="试演 Q 剑招">试演</button></div>
              <div class="dojo-move-info"><kbd>E</kbd><div><strong class="dojo-e-name"></strong><span class="dojo-e-description"></span></div><button class="dojo-try" data-dojo="cast" data-move="e" aria-label="试演 E 绝技">试演</button></div>
              <div class="dojo-move-info dojo-finisher-info" hidden><kbd>F</kbd><div><strong class="dojo-f-name"></strong><span class="dojo-f-description"></span><small class="dojo-f-status"></small></div><button class="dojo-try" data-dojo="cast" data-move="f" aria-label="试演 F 火舞旋风">试演</button></div>
              <p class="dojo-stage-note"></p>
              <p class="dojo-combo-note"></p>
            </section>
            <section class="dojo-record" aria-label="本次演武记录"><div class="dojo-section-heading"><h2>本次演武</h2><small>统一 Lv.10 · 无额外修习</small></div><dl><div><dt>累计伤害</dt><dd data-stat="damage">0</dd></div><div><dt>命中</dt><dd data-stat="hits">0</dd></div><div><dt>击破</dt><dd data-stat="kills">0</dd></div></dl><dl class="dojo-casts" aria-label="成功施招次数"><div><dt>Q 施招</dt><dd data-cast="q">0</dd></div><div><dt>E 施招</dt><dd data-cast="e">0</dd></div><div class="dojo-f-casts" hidden><dt>F 杀招</dt><dd data-cast="f">0</dd></div></dl></section>
            <p class="dojo-save-note">所有人物阶段在此开放。七剑合璧仅在终局剧情中演出。离场后，接续原来的传记与成长。</p>
          </aside>
          <div class="dojo-main">
            <div class="dojo-tools" aria-label="演武设置">
              <div class="dojo-targets" role="group" aria-label="训练目标">${Object.entries(TARGETS).map(([id, t]) => `<button data-dojo="target" data-target="${id}" aria-pressed="${id === this.settings.targetMode}" title="${t.description}">${t.label}</button>`).join('')}</div>
              <button class="dojo-setting dojo-free" data-dojo="free" aria-pressed="true" title="已解锁招式的资源常满，施展完毕即可重放；关闭后按正常规则充能与冷却。"><i class="dojo-switch" aria-hidden="true"></i><span>自由试招</span></button>
              <button class="dojo-setting dojo-speed" data-dojo="speed" aria-pressed="false" title="以半速观察招式与命中，点击恢复正常速度。">速度 <b>×1</b></button>
              <button class="dojo-setting" data-bgm-toggle>音乐：${window.SevenBGM?.enabled ? '开' : '关'}</button><button class="dojo-reset" data-dojo="reset" title="回到场中央，恢复气血和剑意，重置目标与演武记录。">重置演武 <span>↻</span></button>
            </div>
            <div class="dojo-arena" aria-label="伪三维招式训练场"></div>
            <footer class="dojo-footer"><span class="dojo-target-note"></span><span class="dojo-repeat-note">招式施展完毕即可重放</span></footer>
          </div>
        </div>`;
      this.container.appendChild(this.root);
      this.arena = this.root.querySelector('.dojo-arena');
      this.ui = {};
      for (const name of ['current-name', 'current-stage', 'stages', 'stage-count', 'weapon-art', 'weapon-name', 'weapon-hand', 'stage-description', 'q-name', 'q-description', 'e-name', 'e-description', 'finisher-info', 'f-name', 'f-description', 'f-status', 'stage-note', 'combo-note', 'target-note', 'repeat-note', 'f-casts']) this.ui[name] = this.root.querySelector('.dojo-' + name);
      this.stats = Object.fromEntries(Array.from(this.root.querySelectorAll('[data-stat]')).map(el => [el.dataset.stat, el]));
      this.castStats = Object.fromEntries(Array.from(this.root.querySelectorAll('[data-cast]')).map(el => [el.dataset.cast, el]));
      this.castButtons = Object.fromEntries(Array.from(this.root.querySelectorAll('[data-dojo="cast"]')).map(el => [el.dataset.move, el]));
    }

    listen(el, event, fn, options) {
      el.addEventListener(event, fn, options);
      this.listeners.push([el, event, fn, options]);
    }

    bind() {
      this.listen(this.root, 'click', e => {
        const b = e.target.closest('[data-dojo]');
        if (!b || b.disabled || this.destroyed) return;
        e.preventDefault();
        const a = b.dataset.dojo;
        if (a === 'exit') { this.close(); return; }
        if (a === 'panel' || a === 'panel-close') { this.setPanel(a === 'panel' && !this.panelOpen); return; }
        if (a === 'hero') { this.setPanel(false); this.launch(b.dataset.hero, this.stageByHero.get(b.dataset.hero)); return; }
        if (a === 'stage') { this.setPanel(false); this.launch(this.heroId, b.dataset.stage); return; }
        if (a === 'cast') { this.castMove(b.dataset.move); return; }
        if (a === 'target') {
          this.settings.targetMode = b.dataset.target;
          this.combat?.setDojoSettings({ targetMode: this.settings.targetMode });
        }
        if (a === 'free') {
          this.settings.freeSkills = !this.settings.freeSkills;
          this.combat?.setDojoSettings({ freeSkills: this.settings.freeSkills });
        }
        if (a === 'speed') {
          this.settings.timeScale = this.settings.timeScale === 1 ? .5 : 1;
          this.combat?.setDojoSettings({ timeScale: this.settings.timeScale });
        }
        if (a === 'reset') this.combat?.resetDojo({ heal: true });
        this.renderSettings();
        this.refreshStats();
        this.focusArena();
      });
      this.listen(window, 'resize', () => { if (!this.narrow() && this.panelOpen) this.setPanel(false); this.syncPanelAccessibility(); });
      this.listen(this.root, 'keydown', e => {
        if (e.key === 'Tab') {
          const scope = this.panelOpen ? this.root.querySelector('.dojo-sidebar') : this.root;
          const nodes = Array.from(scope.querySelectorAll('button:not([disabled]), canvas[tabindex]')).filter(el => !el.closest('[hidden]') && (!el.closest('.dojo-sidebar') || !this.narrow() || this.panelOpen) && (!el.classList.contains('dojo-panel-close') || this.narrow()));
          const first = nodes[0], last = nodes[nodes.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
        }
        if (e.code === 'Escape' && this.panelOpen) { e.preventDefault(); e.stopPropagation(); this.setPanel(false); }
      });
    }

    castMove(tier) {
      const method = { q: 'useSkill', e: 'useUlt', f: 'useFinisher' }[tier];
      if (!method || !this.combat || this.destroyed || tier === 'f' && !this.stage.finisherUnlocked) return;
      if (this.panelOpen) this.setPanel(false);
      if (this.combat.paused || typeof this.combat[method] !== 'function') return;
      this.combat.unlockSound?.();
      this.combat.pointer.active = false;
      this.combat[method]();
      this.refreshStats();
      this.focusArena();
    }

    narrow() { return !!window.matchMedia?.('(max-width: 960px)').matches; }

    syncPanelAccessibility() {
      const sidebar = this.root.querySelector('.dojo-sidebar');
      const hidden = this.narrow() && !this.panelOpen;
      sidebar.inert = hidden;
      sidebar.setAttribute('aria-hidden', String(hidden));
    }

    setPanel(open) {
      this.panelOpen = this.narrow() && !!open;
      this.root.dataset.panel = this.panelOpen ? 'open' : 'closed';
      this.root.querySelector('.dojo-current').setAttribute('aria-expanded', String(this.panelOpen));
      this.root.querySelector('.dojo-panel-scrim').hidden = !this.panelOpen;
      this.syncPanelAccessibility();
      if (this.panelOpen) {
        this.panelResume = !this.combat?.paused;
        this.combat?.pause(true);
        this.root.querySelector('.dojo-hero[aria-pressed="true"]')?.focus();
      } else {
        if (this.panelResume) this.combat?.pause(false);
        this.panelResume = false;
        this.focusArena();
      }
    }

    launch(heroId, stageId) {
      const stage = this.data.getPreset(heroId, stageId) || this.data.getPreset(heroId);
      if (!stage || this.destroyed) return;
      this.heroId = stage.heroId;
      this.stage = stage;
      this.stageByHero.set(this.heroId, stage.id);
      if (this.combat) window.SevenCombat.stop();
      this.combat = null;
      this.arena.replaceChildren();
      this.root.style.setProperty('--dojo-tint', stage.hero.color || '#c7b985');
      this.renderStage();
      this.combat = window.SevenCombat.start({
        container: this.arena,
        hero: { ...stage.hero },
        swordState: { ...stage.swordState },
        level: this.level,
        upgrade: { attack: 0, vitality: 0, mastery: 0 },
        difficulty: 'normal',
        encounter: { name: '七剑演武场', biome: 'forest', profile: 'crowd', danger: 3, seed: 73021 },
        entryEnergy: 100,
        herbs: 6,
        dojo: { ...this.settings },
        onEnd: () => { if (!this.destroyed) this.close(); }
      });
      this.renderSettings();
      this.refreshStats();
      this.focusArena();
    }

    renderStage() {
      const s = this.stage, stages = this.data.getStages(this.heroId);
      this.root.querySelectorAll('.dojo-hero').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.hero === this.heroId)));
      this.ui['current-name'].textContent = s.hero.name;
      this.ui['current-stage'].textContent = s.label;
      this.root.querySelector('.dojo-stage-preview').innerHTML = (window.SevenUIArt?.render(this.heroId,{stageId:s.id,swordState:s.swordState})||'') + `<figcaption>${esc(s.label)}<small>${esc(s.weaponName)} · ${s.hand==='left'?'左手':'右手'}</small></figcaption>`;
      this.ui['stage-count'].textContent = stages.length > 1 ? stages.length + ' 个阶段可切换' : '完整剑主';
      this.ui.stages.innerHTML = stages.map((v, i) => `<button class="dojo-stage" data-dojo="stage" data-stage="${esc(v.id)}" aria-pressed="${s.id === v.id}"><span class="dojo-stage-number">${String(i + 1).padStart(2, '0')}</span><span><strong>${esc(v.label)}</strong><small>${esc(v.weaponName)} · ${v.hand === 'left' ? '左手' : '右手'}</small></span><i aria-hidden="true">${s.id === v.id ? '◆' : '◇'}</i></button>`).join('');
      const artId = s.equipmentType === 'staff' ? 'staff' : s.equipmentType === 'wood' ? 'wooden-sword' : s.equipmentType === 'plain' ? 'left-sword' : 'sword-' + this.heroId;
      this.ui['weapon-art'].innerHTML = window.ItemArt?.svg(artId, { hero: this.heroId, label: s.weaponName }) || '';
      this.ui['weapon-name'].textContent = s.weaponName;
      this.ui['weapon-hand'].textContent = (s.hand === 'left' ? '左手' : '右手') + '持剑' + (s.weaponOrigin ? ' · ' + s.weaponOrigin : '');
      if (s.equipmentType === 'staff') this.ui['weapon-hand'].textContent = '持棍 · 水火棍法';
      this.ui['stage-description'].textContent = s.description;
      this.ui['q-name'].textContent = s.qName;
      this.ui['q-description'].textContent = s.qDescription;
      this.ui['e-name'].textContent = s.eName;
      this.ui['e-description'].textContent = s.eDescription;
      this.root.dataset.hasFinisher = String(s.hasFinisher);
      this.root.dataset.finisherUnlocked = String(s.finisherUnlocked);
      this.ui['finisher-info'].hidden = !s.hasFinisher;
      this.ui['finisher-info'].classList.toggle('dojo-move-locked', !s.finisherUnlocked);
      this.ui['f-name'].textContent = s.fName || '';
      this.ui['f-description'].textContent = s.fDescription || '';
      this.ui['f-status'].textContent = s.finisherUnlocked ? '后期杀招 · 独立施放' : '未领悟';
      this.ui['f-casts'].hidden = !s.hasFinisher;
      this.ui['combo-note'].textContent = s.comboNote;
      for (const tier of ['q', 'e', 'f']) {
        this.castButtons[tier].setAttribute('aria-label', '试演 ' + tier.toUpperCase() + ' ' + (s[tier + 'Name'] || '剑招'));
      }
      this.castButtons.f.disabled = !s.finisherUnlocked;
      this.ui['stage-note'].textContent = s.note || '';
      this.ui['stage-note'].hidden = !s.note;
    }

    renderSettings() {
      this.root.querySelectorAll('[data-dojo="target"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.target === this.settings.targetMode)));
      this.root.querySelector('.dojo-free').setAttribute('aria-pressed', String(this.settings.freeSkills));
      const speed = this.root.querySelector('.dojo-speed');
      speed.setAttribute('aria-pressed', String(this.settings.timeScale === .5));
      speed.querySelector('b').textContent = '×' + this.settings.timeScale;
      this.ui['target-note'].textContent = TARGETS[this.settings.targetMode].description;
      const withFinisher = this.stage.hasFinisher && this.stage.finisherUnlocked;
      this.root.querySelector('.dojo-free').title = this.settings.freeSkills ? (withFinisher ? 'E 与 F 共用剑意、分别计冷却。剑意常满，各招式演出结束后即可重放。' : '剑意常满，各招式演出结束后即可重放。' + (this.stage.hasFinisher ? '未领悟的 F 保持锁定。' : '')) : '按正常规则充能与冷却；再次开启可自由试练本阶段已解锁招式。';
      this.ui['repeat-note'].textContent = this.settings.freeSkills ? (withFinisher ? 'E / F 独立重放 · 招式结束即可再试' : '剑意常满 · 招式结束即可重放') : '正常充能与冷却 · R 回血';
    }

    refreshStats() {
      const s = this.combat?.getDojoState?.();
      if (!s) return;
      for (const key of ['damage', 'hits', 'kills']) this.stats[key].textContent = Math.round(s[key] || 0).toLocaleString('zh-CN');
      for (const tier of ['q', 'e', 'f']) this.castStats[tier].textContent = Math.round(s.casts?.[tier] || 0).toLocaleString('zh-CN');
      // Opening the narrow sidebar pauses combat. Its preview buttons may
      // resume that temporary pause, but never override a manual pause.
      const canPreview = !s.paused || this.panelOpen && this.panelResume;
      this.castButtons.q.disabled = !canPreview || s.skillCd > .01;
      const ultCost = s.ultEnergyCost ?? s.ultEnergy ?? 100;
      const fireCost = s.fireEnergyCost ?? s.fireEnergy ?? 100;
      this.castButtons.e.disabled = !canPreview || s.ultCd > .01 || s.energy < ultCost - .1;
      this.castButtons.f.disabled = !canPreview || !this.stage.finisherUnlocked || s.finisherUnlocked === false || s.finisherCd > .01 || s.energy < fireCost - .1;
      if (this.stage.hasFinisher) {
        const status = !this.stage.finisherUnlocked ? '未领悟 · 切换后期阶段体验' : s.finisherBusy > .01 ? '施招中 · ' + s.finisherBusy.toFixed(1) + ' 秒' : s.finisherCd > .01 ? '调息 · ' + s.finisherCd.toFixed(1) + ' 秒' : s.energy < fireCost - .1 ? '剑意不足 · ' + Math.floor(s.energy) + ' / ' + fireCost : '后期杀招 · 可以施展';
        this.ui['f-status'].textContent = status;
      }
      this.root.querySelector('.dojo-hp-rule').classList.toggle('at-floor', s.hp <= 1);
    }

    poll() {
      if (this.destroyed) return;
      this.refreshStats();
      this.timer = window.setTimeout(() => this.poll(), 180);
    }

    focusArena() { if (!this.destroyed && !this.panelOpen) this.combat?.canvas?.focus({ preventScroll: true }); }

    close() {
      if (this.destroyed) return;
      const cb = this.opts.onClose;
      this.destroy();
      if (active === this) active = null;
      if (typeof cb === 'function') cb();
    }

    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      window.clearTimeout(this.timer);
      for (const [el, event, fn, options] of this.listeners) el.removeEventListener(event, fn, options);
      this.listeners.length = 0;
      if (this.combat && window.SevenCombat.instance === this.combat) window.SevenCombat.stop();
      this.combat = null;
      this.root.remove();
    }
  }

  window.SevenDojo = {
    version: 8,
    get instance() { return active; },
    open(opts) { if (active) active.destroy(); active = new Dojo(opts); return active; },
    close() { active?.close(); }
  };
})();
