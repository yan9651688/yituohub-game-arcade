/* 七剑江湖 v8 · 演武场的人物阶段。
 * 只从既有传记的佩剑变化建立临时快照，不推进章节、不读取或写入存档。
 * “阶段”指人物经历与佩剑状态；Q/E/F 的连续演出不是额外人物阶段。
 */
(() => {
  'use strict';
  const D = window.GAME_DATA, C = window.CANON_DATA;
  const clone = value => JSON.parse(JSON.stringify(value));
  const isLeftSword = name => name === '左手剑' || name === '剑冢左手剑';
  const freeze = value => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  };

  // afterChapter is the number of completed chapters whose equipment changes
  // are replayed. We deliberately do not simulate battles or grant rewards.
  const definitions = {
    hongmao: [
      { id: 'changhong', label: '长虹传人', shortLabel: '长虹传人', afterChapter: 0,
        description: '长虹初出山门，尚未领悟火舞旋风，只以长虹剑法应敌。',
        note: 'Q 为长虹剑法，E 可施展长虹贯日；F 火舞旋风尚未领悟。' },
      { id: 'fire-awakened', label: '领悟火舞旋风', shortLabel: '火舞旋风', afterChapter: 7,
        description: '完成「火舞旋风 · 十重」之后，方领悟火舞旋风第十层。',
        note: 'Q 仍为长虹剑法，E 仍为长虹贯日；F 独立解锁火舞旋风。' }
    ],
    lantu: [
      { id: 'ice-sword', label: '冰魄剑主', shortLabel: '冰魄剑主', afterChapter: 0,
        description: '玉蟾宫主执冰魄剑，冰魄剑法与冰天雪地皆可施展。',
        note: '本传记并无另一套由换剑或修炼解锁的个人招式。' }
    ],
    sali: [
      { id: 'purple-right', label: '右手紫云', shortLabel: '右手紫云', afterChapter: 0,
        description: '客栈遭劫之前，右手执紫云剑，已练成紫气东来。',
        note: '右手紫云剑法；可与紫云归主后的左手施招两相对照。' },
      { id: 'wood-left', label: '左手木剑', shortLabel: '左手木剑', afterChapter: 2,
        description: '训练编排：紫云剑失落、右手受伤之后，以木剑体会左手起式。',
        note: '此段为体会左手重练而设的训练编排；取得左手剑后，木剑不再使用。' },
      { id: 'tomb-learning', label: '剑冢初修', shortLabel: '剑冢初修', afterChapter: 4,
        description: '于独臂大侠剑冢取得左手剑与剑谱，反手剑尚未悟透。',
        note: '手持独臂大侠遗留的佩剑，体会反手剑路；完整的反手剑法，此时尚未领悟。' },
      { id: 'left-mastered', label: '反手剑成', shortLabel: '反手剑成', afterChapter: 5,
        description: '既已悟出反手剑，仍旧手持独臂大侠遗留的左手剑，已能施展紫气东来。',
        note: '反手剑法已成；依旧沿用左手剑，只等终局取回紫云剑。' },
      { id: 'purple-returned', label: '紫云归主', shortLabel: '紫云归主', afterChapter: 8,
        description: '制住马三娘、取回专属紫云剑之后，以左手施展紫云剑法。',
        note: '专属紫云剑已归手中；练成的左手剑法与紫气东来，一并保留。' }
    ],
    doudou: [
      { id: 'rain-sword', label: '雨花剑主', shortLabel: '雨花剑主', afterChapter: 0,
        description: '执雨花剑行医济世，以雨花剑法御敌，兼可恢复气血。',
        note: '普攻命中时，为身周 180 范围内的存活友方（含自身）回复各自最大气血的 0.6%；每 0.9 秒至多触发一次。Q、E 同属雨花剑法。' }
    ],
    daben: [
      { id: 'water-fire-staff', label: '水火棍', shortLabel: '水火棍', afterChapter: 0,
        description: '奔雷剑尚未出世，只以一根水火棍闯荡江湖。',
        note: 'Q、E 皆用水火棍法；奔雷剑招尚未解锁。' },
      { id: 'thunder-sword', label: '奔雷剑主', shortLabel: '奔雷剑主', afterChapter: 5,
        description: '完成「奔雷出世」、取得奔雷剑之后，方接下奔雷传承。',
        note: '兵器换作专属奔雷剑，解锁奔雷剑法与奔雷滚滚。' }
    ],
    tiaotiao: [
      { id: 'guardian-sword', label: '护法佩剑', shortLabel: '护法佩剑', afterChapter: 0,
        description: '以护法身份暗中接应同伴，借护法佩剑掩去青光身份。',
        note: 'Q、E 皆为护法剑术；青光剑尚未取出。' },
      { id: 'azure-sword', label: '青光剑主', shortLabel: '青光剑主', afterChapter: 4,
        description: '完成「天池取青光」、取回专属青光剑之后，方施展青光剑法。',
        note: 'Q 为突进剑击，E 为连续追击；二者同属青光剑法。' }
    ],
    dada: [
      { id: 'wind-sword', label: '旋风剑主', shortLabel: '旋风剑主', afterChapter: 0,
        description: '百草谷谷主执旋风剑，以旋风剑法与琴针飞箭护住同伴。',
        note: '本传记并无另一套由换剑或修炼解锁的个人招式。' }
    ]
  };

  const moveDescriptions = {
    hongmao: { q: '向前斩出扇面火光与三道火刃，附带持续灼烧。', e: '消耗 50 剑意，蓄势后展开宽幅剑幕，贯穿前方大片敌人；领悟火舞旋风后仍可施展。', f: '烈焰旋风持续聚拢周围敌人，最后爆发大范围火浪。后期个人杀招，消耗全部剑意，独立调息。' },
    lantu: { q: '冰晶环斩击退身周敌人，并施加减速。', e: '起手冻结周围敌人，冰域随后持续造成 8 次伤害并减速。' },
    sali: { q: '三道紫云剑弧依次斩出，快速打出前方连击。', e: '紫云连续八次环身绽开，随后以一道长剑弧收势。' },
    doudou: { q: '雨花御敌并治疗范围内存活友方（含自身）：起手恢复各自最大气血的 2%，随后 4 跳、每跳 1%；离开区域停止恢复。', e: '大范围雨花持续造成 8 次伤害，并治疗范围内存活友方（含自身）：起手恢复各自最大气血的 2%，随后 8 跳、每跳 1.1%；离开区域停止恢复。' },
    daben: { q: '震击地面，击退周围敌人并短暂强化护身。', e: '在出招处连续引落三次白金雷击，细电弧接地扩散，重击并震退周围敌人。' },
    tiaotiao: { q: '沿瞄准方向快速突进，贯穿路径上的敌人。', e: '连续七次追击附近敌人，青光剑影随身法穿梭。' },
    dada: { q: '短弧风刃在施招处回旋，持续牵制并伤害范围内敌人。', e: '随身风域持续展开，八轮琴针独立索敌；单敌汇聚、多敌分击，飞行中追踪并在目标倒下后改选。' }
  };

  function swordAt(heroId, completed) {
    const H = C.heroes[heroId];
    const sword = {
      id: 'sword-' + heroId, owner: heroId,
      ...clone(H.initialSword),
      technique: H.initialSword.technique || H.skillName
    };
    for (const chapter of H.chapters.slice(0, completed)) {
      const after = chapter.after || {};
      if (after.swordStatus) sword.status = after.swordStatus;
      if (after.hand) sword.hand = after.hand;
      if (typeof after.ultimateUnlocked === 'boolean') sword.ultimateUnlocked = after.ultimateUnlocked;
      if (after.weaponName) sword.weaponName = after.weaponName;
      if (after.technique) sword.technique = after.technique;
    }
    // Read legacy chapter/save labels, but always present the original name.
    if (heroId === 'sali' && isLeftSword(sword.weaponName)) sword.weaponName = '左手剑';
    return sword;
  }

  function makeStage(baseHero, definition) {
    const id = baseHero.id, H = C.heroes[id];
    const swordState = swordAt(id, definition.afterChapter);
    // Keep this readiness/equipment mapping aligned with Combat's constructor.
    const leftSwordMastered = id === 'sali' && swordState.status === 'training' &&
      isLeftSword(swordState.weaponName) && swordState.ultimateUnlocked === true;
    const swordTechniqueReady = swordState.ultimateUnlocked !== false &&
      (!['lost', 'training', 'sealed'].includes(swordState.status) || leftSwordMastered);
    // Hongmao keeps his normal Changhong technique in both character stages.
    // The existing story awakening flag gates F alone, never his regular E.
    const techniqueReady = id === 'hongmao' && swordState.status === 'bound' ? true : swordTechniqueReady;
    const hasFinisher = id === 'hongmao';
    const finisherUnlocked = hasFinisher && swordTechniqueReady;
    const equipmentType = swordState.status === 'sealed' && id === 'daben' ? 'staff' :
      isLeftSword(swordState.weaponName) || swordState.status === 'sealed' ? 'plain' :
      ['lost', 'training'].includes(swordState.status) ? 'wood' : 'sword';
    const weaponName = swordState.weaponName || (equipmentType === 'wood' ? '木剑' : baseHero.sword);
    const weaponOrigin = id === 'sali' && isLeftSword(weaponName) ? '独臂大侠遗留的佩剑' : '';
    let qName = H.skillName, eName = techniqueReady ? H.ultName : H.skillName;
    if (hasFinisher) eName = '长虹贯日';
    if (equipmentType === 'staff') qName = eName = '水火棍法';
    if (id === 'tiaotiao' && swordState.status === 'sealed') qName = eName = swordState.technique || '护法剑术';
    if (id === 'sali' && !techniqueReady && ['lost', 'training'].includes(swordState.status)) qName = eName = '左手练剑';
    const basicWeapon = equipmentType !== 'sword' && !techniqueReady;
    const qDescription = basicWeapon ? (equipmentType === 'staff' ? '连续三次向前挥棍，以基础棍法击退敌人。' : '连续三次基础剑击，练习前方出剑与连击。') : moveDescriptions[id].q;
    const eDescription = techniqueReady ? moveDescriptions[id].e :
      (equipmentType === 'staff' ? '蓄力后连续三次环身棍击，尚未施展奔雷剑招。' : '蓄力后连续三次环身剑击，使用此阶段已掌握的基础剑术。');
    const fName = hasFinisher ? '火舞旋风' : null;
    const fDescription = hasFinisher ? (finisherUnlocked ? moveDescriptions[id].f : '尚未领悟，无法施展。切换至「领悟火舞旋风」阶段可单独试练 F。') : null;
    const comboNote = hasFinisher ? (finisherUnlocked ? 'J 连斩接 Q 扫敌；E 长虹贯日耗半数剑意，F 火舞旋风须蓄满全部剑意，两招各自调息。' : 'J 连斩接上 Q 扫敌，剑意蓄到半数，再以 E 长虹贯日收势。F 留待后期领悟。') : 'J 连斩衔接 Q，剑意充满即释放 E；空格闪避，R 恢复气血。';
    const chapter = H.chapters[definition.afterChapter > 0 ? definition.afterChapter - 1 : 0];
    return {
      ...definition, heroId: id,
      chapterId: chapter.id, chapterTitle: chapter.title,
      sourceIds: [...(chapter.sourceIds || [])],
      swordState, hand: swordState.hand, weaponName, weaponOrigin, equipmentType, techniqueReady,
      qName, eName, fName, qDescription, eDescription, fDescription,
      hasFinisher, finisherUnlocked, comboNote,
      eKind: techniqueReady ? 'ultimate' : 'charged-basic',
      hero: { ...clone(baseHero), skillName: H.skillName, ultName: eName,
        skillDesc: qDescription, ultDesc: eDescription,
        ...(hasFinisher ? { finisherName: fName, finisherDesc: fDescription } : {}) },
      // Seven-sword convergence is a once-only story finale, never a dojo move.
      allowAlliance: false
    };
  }

  const heroes = D.heroes.map(hero => {
    const stages = definitions[hero.id].map(definition => makeStage(hero, definition));
    return { id: hero.id, name: hero.name, color: hero.color, sword: hero.sword,
      stageCount: stages.length, defaultStage: stages[stages.length - 1].id, stages };
  });
  const byHero = new Map(heroes.map(hero => [hero.id, hero]));
  freeze(heroes);

  window.SevenTrainingData = Object.freeze({
    version: 8,
    heroes,
    stageCount: heroes.reduce((sum, hero) => sum + hero.stageCount, 0),
    getStages(heroId) { return clone(byHero.get(heroId)?.stages || []); },
    defaultStage(heroId) { return byHero.get(heroId)?.defaultStage || null; },
    getPreset(heroId, stageId) {
      const hero = byHero.get(heroId);
      if (!hero) return null;
      const stage = hero.stages.find(item => item.id === (stageId || hero.defaultStage));
      return stage ? clone(stage) : null;
    }
  });
})();
