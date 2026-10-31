/*
 * 七剑江湖 v11：2006 年《虹猫蓝兔七侠传》人物篇章与江湖生活。
 * 故事节点以央视原作资料为主，并标明后段所用二级剧集参考；短对白、关卡人数、掉落与操控规则是游戏改编。
 * region 是现有九张地图中的场景承载，place 才是该章原著地点。地图的邻接、
 * 方位、比例以及将多处地点放入一个区域的做法，不是原作地理设定。
 * 章节结算后先回到山河，由玩家选择歇脚或接续；没有跨图送物或返回委托人的步骤。
 */
(() => {
  'use strict';
  const sources = [
    { id: 'cctv-story', title: '央视：《虹猫蓝兔七侠传》故事介绍', url: 'https://www.cntv.cn/program/yhjc/20070301/102348.shtml' },
    { id: 'cctv-cast', title: '央视银河剧场：七侠人物介绍', url: 'https://www.cntv.cn/program/yhjc/02/08/index.shtml' },
    { id: 'cctv-01', title: '央视：第1—10集剧情介绍', url: 'https://www.cntv.cn/program/yhjc/20070301/102564.shtml' },
    { id: 'cctv-11', title: '央视：第11—20集剧情介绍', url: 'https://www.cntv.cn/program/yhjc/20070301/102579.shtml' },
    { id: 'cctv-21', title: '央视：第21—30集剧情介绍', url: 'https://www.cctv.com/program/yhjc/20070301/102586.shtml' },
    { id: 'cctv-31', title: '央视：第31—40集剧情介绍', url: 'https://www.cctv.com/program/yhjc/20070301/102598.shtml' },
    { id: 'cctv-41', title: '央视：第41—50集剧情介绍', url: 'https://www.cctv.com/program/yhjc/20070301/102607.shtml' },
    { id: 'cctv-51', title: '央视：第51—60集剧情介绍', url: 'https://www.cntv.cn/program/yhjc/20070301/102612.shtml' },
    { id: 'cctv-61', title: '央视：第61—70集剧情介绍', url: 'https://www.cntv.cn/program/yhjc/20070301/102618.shtml' },
    { id: 'cctv-71', title: '央视：第71—80集剧情介绍', url: 'https://www.cctv.com/program/yhjc/20070301/102708.shtml' },
    { id: 'cctv-81', title: '央视：第81—89集剧情介绍', url: 'https://www.cctv.com/program/yhjc/20070301/104028.shtml' },
    { id: 'cctv-90', title: '央视节目导视：达达与寒冰洞误会', url: 'https://tvguide.cctv.com/20070216/103044.shtml' },
    { id: 'cctv-92', title: '央视节目导视：第92集黑虎崖取玉', url: 'https://tvguide.cctv.com/20070226/102417_1.shtml' },
    { id: 'cctv-lantu', title: '央视：蓝兔与冰天雪地', url: 'https://www.cctv.com/program/yhjc/20070301/104264.shtml' },
    { id: 'cctv-dada', title: '央视：达达与琴针飞箭', url: 'https://www.cctv.com/program/yhjc/20070301/104660.shtml' },
    { id: 'official-moves', title: '虹猫蓝兔官方频道：原作人物介绍篇', url: 'https://www.bilibili.com/video/BV1vs4117755/' },
    { id: 'official-late', title: '虹猫蓝兔官方频道·央视频：十里画廊后段看点', url: 'https://m.yangshipin.cn/video?cid=sx1w1tv8jdjqets&type=0&vid=c000034t7u4' },
    { id: 'official-antidote', title: '虹猫蓝兔官方频道·央视频：假虹猫与解药看点', url: 'https://m.yangshipin.cn/video?cid=sx1w1tv8jdjqets&type=0&vid=m0000108hfo' },
    { id: 'official-truth', title: '虹猫蓝兔官方频道·央视频：识破假虹猫看点', url: 'https://m.yangshipin.cn/video?cid=sx1w1tv8jdjqets&type=0&vid=c000094799p' },
    { id: 'official-rescue', title: '虹猫蓝兔官方频道·央视频：救人、取回宝玉与火舞旋风', url: 'https://m.yangshipin.cn/video?cid=sx1w1tv8jdjqets&type=0&vid=p00000544jh' },
    { id: 'official-finale', title: '央视频：最终一战·七剑合璧对战黑心虎（已见标题，正片待核）', url: 'https://w.yangshipin.cn/video?cid=sx1w1tv8jdjqets&type=0&vid=i000061ngpk' },
    { id: 'tvdb-105', title: 'TheTVDB：第105集《火舞旋风》（二级剧集参考，非官方）', url: 'https://thetvdb.com/series/408982-/episodes/8624320' },
    { id: 'official-changhong', title: '《永劫无间》虹猫蓝兔联动：长虹贯日（招式命名参考）', url: 'https://www.yjwujian.cn/news/update/20250429/33456_1231768.html' },
    { id: 'wuxia-social-official', title: '《燕云十六声》官方：路牌与方寸间（游历社交设计参考）', url: 'https://www.yysls.cn/news/official/20251031/37780_1268321.html' }
  ];
  const xp = [240, 300, 340, 400, 460, 520, 590, 700];
  const gold = [85, 110, 125, 140, 170, 190, 230, 300];
  const reward = (i, extra = {}) => ({ xp: xp[i], gold: gold[i], ...extra });
  const fight = (profile, danger, total, maxLiving, boss) => ({ profile, danger, total, maxLiving, ...(boss ? { boss } : {}) });
  const training = goalHits => ({ profile: 'training', danger: 1, total: 6, maxLiving: 6, training: { kind: 'left-hand', goalHits } });
  const finale = viewpoint => ({ ...fight('crowd', 8, 108, 32, { name: '黑心虎', kind: 'blackheart' }), storyFinale: { kind: 'seven-swords', viewpoint } });
  // Each viewpoint owns its complete text; all result and memory screens reuse it.
  const finalOutcomes = {
    hongmao: "七剑合璧，紫云之位由马三娘占着，她却暗中收力。你握紧长虹剑，接下同伴尚未散尽的剑势，拼尽余力施展火舞旋风。黑心虎倒下时，众人已力竭难支。马三娘趁势露出野心；赶到的莎丽以左手剑败了她，取回紫云剑。七位真正的剑主，至此重聚。",
    lantu: "七剑合璧，紫云之位由马三娘占着，她却暗中留力。你以冰魄剑守住自己的阵位，将最后一分内力尽数汇入剑阵，眼看虹猫接上火舞旋风。黑心虎倒下时，众人已力竭难支。马三娘趁势露出野心；赶到的莎丽以左手剑败了她，取回紫云剑。七位真正的剑主，至此重聚。",
    doudou: "七剑合璧，紫云之位由马三娘占着，她却暗中留力。你以雨花剑与同伴合璧；待虹猫接上火舞旋风，便立刻撑着身子去看众人的伤势。黑心虎倒下时，众人已力竭难支。马三娘趁势露出野心；赶到的莎丽以左手剑败了她，取回紫云剑。七位真正的剑主，至此重聚。",
    daben: "七剑合璧，紫云之位由马三娘占着，她却暗中留力。你以奔雷剑全力合璧；虹猫接上火舞旋风时，你仍守在同伴身侧。黑心虎倒下时，众人已力竭难支。马三娘趁势露出野心；赶到的莎丽以左手剑败了她，取回紫云剑。七位真正的剑主，至此重聚。",
    tiaotiao: "七剑合璧，紫云之位由马三娘占着，她却暗中留力。你让青光汇入七剑之中；虹猫接上火舞旋风后，你仍留意着马三娘的一举一动。黑心虎倒下时，众人已力竭难支。马三娘趁势露出野心；赶到的莎丽以左手剑败了她，取回紫云剑。七位真正的剑主，至此重聚。",
    dada: "七剑合璧，紫云之位由马三娘占着，她却暗中留力。你以旋风剑全力合璧，眼看虹猫接上火舞旋风；你守护的家与山河，终于等来转机。黑心虎倒下时，众人已力竭难支。马三娘趁势露出野心；赶到的莎丽以左手剑败了她，取回紫云剑。七位真正的剑主，至此重聚。"
  };
  const finaleOutcome = viewpoint => finalOutcomes[viewpoint];

  const heroes = {
    hongmao: {
      title: '长虹篇 · 承诺与担当', subtitle: '承父遗命，寻齐七剑',
      prologue: '父亲白猫把守护麒麟的重担交到你手上。追兵已逼近西海峰林，你须带着长虹剑下山，寻回散落四方的七剑传人。',
      startRegion: 'forest', startAnchor: 'main', skillName: '长虹剑法', ultName: '长虹贯日', finisherName: '火舞旋风',
      ultNote: 'E 长虹贯日依附长虹剑法使用；第七章领悟火舞旋风第十层之后，另立 F 位开放杀招。长虹贯日的键位与剑气演出属游戏改编，命名参考官方联动。七剑合璧只在终局剧情中施展。',
      initialSword: { status: 'bound', hand: 'right', ultimateUnlocked: false },
      chapters: [
        {
          id: 'hongmao-01', title: '长虹出山', region: 'forest', anchor: 'main', place: '西海峰林', episode: "第1—3集开篇；结果衔接第5集", sourceIds: ['cctv-01', 'cctv-story'],
          intro: '白猫只身挡在魔教之前。你握紧长虹剑，在火海里为麒麟劈出一条退路。',
          dialogue: [{"speaker": "虹猫", "text": "先把麒麟送出去。", "provenance": "游戏改编对白"}],
          kind: 'battle', battle: fight('crowd', 1, 36, 14), reward: reward(0, { virtue: 2 }),
          after: { technique: '长虹剑法', item: 'father-tassel' },
          outcome: '你冲出了第一重包围。其后为护麒麟负伤坠崖，灵鸽引着麒麟将你送往玉蟾宫。寻访其余剑主的漫漫长路，自此开端。'
        },
        {
          id: 'hongmao-02', title: '长虹冰魄', region: 'yuchan', anchor: 'main', place: '玉蟾宫', episode: '第5—13集', sourceIds: ['cctv-01', 'cctv-11'],
          intro: "虹猫服下跳跳取得的真解药，伤势好转。猪无戒仍围在玉蟾宫外，虹猫与蓝兔准备两剑合璧。",
          dialogue: [{"speaker": "虹猫", "text": "你我一同出剑。", "provenance": "游戏改编对白"}],
          kind: 'battle', battle: fight('duel', 2, 42, 16, { name: '猪无戒', kind: 'boar' }), reward: reward(1),
          after: { item: 'two-swords-memory' },
          outcome: "两剑合璧后，大奔护轿引开追兵，紫兔在轿中作掩护。虹猫与蓝兔乘孔明灯离宫，紫兔牺牲。"
        },
        {
          id: 'hongmao-03', title: '暗道辨真', region: 'inn', anchor: 'ruins', place: '金鞭溪客栈暗道', episode: '第18—37集的客栈疑云', sourceIds: ['cctv-11', 'cctv-31'],
          intro: '合璧接连失手，暗道中又堆满了炸药。与黑衣人交手时，你认出他正是屡次示警的跳跳。',
          dialogue: [{"speaker": "虹猫", "text": "先救莎丽。", "provenance": "游戏改编对白"}],
          kind: 'battle', battle: fight('ambush', 3, 54, 20), reward: reward(2),
          after: { item: 'tunnel-message' },
          outcome: "虹猫让跳跳先送莎丽去找神医，再与大奔制造莎丽已死的假象，瞒过马三娘。"
        },
        {
          id: 'hongmao-04', title: '穿云取医典', region: 'liuqige', anchor: 'ruins', place: '穿云洞', episode: '第38—40集', sourceIds: ['cctv-31'],
          intro: "虹猫陪逗逗进入穿云洞找医典。猪无戒抢先到达，趁灵兽袭击虹猫时夺书离开。",
          dialogue: [{"speaker": "旁白", "text": "猪无戒已夺书离去，虹猫与逗逗仍被灵兽阻住。", "provenance": "剧情旁白", "portraitSpeaker": "逗逗"}],
          kind: 'battle', battle: fight('rescue', 3, 60, 22), reward: reward(3, { herbs: 2 }),
          after: { item: 'medical-classic' },
          outcome: "逗逗用麻沸散制住灵兽。虹猫发现猪无戒抢走的是假本，两人找到真正的《济世医典》。"
        },
        {
          id: 'hongmao-05', title: '孤岛五剑', region: 'leizhuang', anchor: 'waterside', place: '宝峰湖孤岛', episode: '第68—76集', sourceIds: ['cctv-61', 'cctv-71'],
          intro: "黑小虎围住宝峰湖孤岛。蓝兔突围求援，虹猫独自留守，等待大奔带奔雷剑赶来。",
          dialogue: [{"speaker": "虹猫", "text": "同伴一定会来。", "provenance": "游戏改编对白"}],
          kind: 'battle', battle: fight('rescue', 4, 70, 24), reward: reward(4),
          after: { item: 'five-swords-memory' },
          outcome: "大奔赶到孤岛，五剑合璧，冲破围困。"
        },
        {
          id: 'hongmao-06', title: '灵泉守诺', region: 'gallery', anchor: 'waterside', place: '十里画廊灵泉', episode: '第88—89集', sourceIds: ['cctv-81'],
          intro: "失心丸毒发，虹猫在溪流源头发现灵泉宝玉。取玉后疼痛缓解，周围草木却开始枯萎。",
          dialogue: [{"speaker": "旁白", "text": "虹猫发现，宝玉一离开灵泉，草木便开始枯萎。", "provenance": "剧情旁白", "portraitSpeaker": "虹猫"}],
          kind: 'choice', choices: [{ label: '将宝玉放回泉眼', text: '让灵泉继续滋养山林，自己忍着痛，另寻一条活路。' }, { label: '先稳住呼吸，再将宝玉归位', text: '你记下宝玉的位置，到底没有把它带走。' }],
          reward: reward(5, { virtue: 3 }), after: { item: 'spring-oath' },
          outcome: "虹猫放回宝玉，随后昏倒，被溪水带走。黑小虎趁机盗玉，达达循着枯萎的草木追查。"
        },
        {
          id: 'hongmao-07', title: '火舞旋风 · 十重', region: 'tianzi', anchor: 'ruins', place: '黑小虎围阵之地', episode: '第105集《火舞旋风》', sourceIds: ['official-rescue', 'official-moves', 'tvdb-105'],
          intro: '蓝兔已换回长虹剑，也拿到了招魂引的解药。你赶到黑小虎的围阵之前，七只灵鸽自头顶掠过。救人的时机就在眼前，火舞旋风却仍隔着一重心障。',
          dialogue: [{"speaker": "蓝兔", "text": "长虹剑回来了。", "provenance": "游戏改编对白"}],
          kind: 'battle', battle: { ...fight('crowd', 6, 84, 28, { name: '黑小虎', kind: 'tiger' }), awakening: { atKills: 12, technique: '火舞旋风·第十层' } }, reward: reward(6),
          after: { ultimateUnlocked: true, technique: '火舞旋风·第十层', item: 'fire-tenth-memory' },
          outcome: '七鸽令你放下执念，踏入火舞旋风第十层的“无我”之境。你以新悟的剑势击退黑小虎，为同伴打开了脱身之路；长虹剑重归手中，而七剑仍要迎向黑心虎的最后一围。'
        },
        {
          id: 'hongmao-08', title: '七剑同心', region: 'tianzi', anchor: 'main', place: '天子山决战之地', episode: '原作终局，第108集', sourceIds: ['official-finale', 'cctv-story'],
          intro: '黑心虎亲率魔教围堵。你带着同伴迎战；马三娘仍持紫云剑列于合璧之位，莎丽守在外围，只待破局的时机。清尽护卫、将黑心虎逼入最后一阵，便是七剑同出的时刻。',
          dialogue: [{"speaker": "虹猫", "text": "七剑合璧！", "provenance": "游戏改编对白"}],
          kind: 'battle', battle: finale('hongmao'), reward: reward(7, { virtue: 3 }), after: { item: 'seven-swords-memory' }, outcome: finaleOutcome('hongmao')
        }
      ]
    },
    sali: {
      title: '紫云篇 · 左手重生', subtitle: '失剑不失志，反手见锋芒',
      prologue: '你是金鞭溪客栈的主人，也是紫云剑传人。马三娘盯上了你的身份，也盯上了你的剑。这一场劫难会夺走你惯用的右手剑法，却定不了你往后的路。',
      startRegion: 'inn', startAnchor: 'main', skillName: '紫云剑法', ultName: '紫气东来',
      ultNote: '毒伤之后重练左手，在断臂山得独臂大侠遗留的左手剑与剑谱，悟出反手剑；终局败了马三娘，才取回紫云剑。木剑起式是本作的训练编排。',
      initialSword: { status: 'bound', hand: 'right', ultimateUnlocked: true },
      chapters: [
        {
          id: 'sali-01', title: '紫云遭劫', region: 'inn', anchor: 'main', place: '金鞭溪客栈', episode: '原作客栈篇：移花接木与毒伤', sourceIds: ['cctv-11', 'cctv-21', 'cctv-41'],
          intro: "马三娘进入金鞭溪客栈，冒充紫云剑主，并用毒药控制莎丽。",
          dialogue: [{"speaker": "旁白", "text": "马三娘盯上了莎丽的剑主身份。", "provenance": "剧情旁白", "portraitSpeaker": "莎丽"}],
          kind: 'battle', battle: fight('ambush', 1, 36, 14), reward: reward(0),
          after: { swordStatus: 'lost', hand: 'left', ultimateUnlocked: false, technique: '左手握剑', item: 'inn-keepsake' },
          outcome: "此后，马三娘逼问出真剑的藏处。莎丽被同伴救出，送往六奇阁；毒伤虽获医治，右手却不能再使剑。"
        },
        {
          id: 'sali-02', title: '重新握剑', region: 'liuqige', anchor: 'workshop', place: '六奇阁', episode: '第41—44、52集', sourceIds: ['cctv-41', 'cctv-51'],
          intro: '蓝兔取来的七叶花救回了你的性命，右手却仍旧握不住剑。逗逗亲尝汤药的身影，让你下决心重新握剑。眼下，先练左手握剑。',
          dialogue: [{"speaker": "莎丽", "text": "那就从左手开始。", "provenance": "游戏改编对白"}],
          kind: 'training', battle: training(12), reward: reward(1, { herbs: 2 }),
          after: { swordStatus: 'training', hand: 'left', weaponName: '木剑', ultimateUnlocked: false, technique: '左手剑·起式', item: 'training-sword' },
          outcome: "莎丽完成第一组左手练习。"
        },
        {
          id: 'sali-03', title: '天险守关', region: 'waterfall', anchor: 'camp', place: '大奔护送途中的天险关口', episode: '第53—56集', sourceIds: ['cctv-51'],
          intro: "大奔护送莎丽途中，因赌酒失去关口。猪无戒率兵逼近。",
          dialogue: [{"speaker": "莎丽", "text": "我的剑还没练成。", "provenance": "游戏改编对白"}],
          kind: 'battle', battle: fight('rescue', 3, 54, 20), reward: reward(2),
          after: { technique: '左手剑·连击' },
          outcome: '牛旋风察觉自己受了利用，舍命相救。你不愿再落进猪无戒手里，纵身跃下崖去，却意外落进了断臂山的剑冢。'
        },
        {
          id: 'sali-04', title: '独臂剑冢', region: 'waterfall', anchor: 'ruins', place: '断臂山·独臂大侠剑冢', episode: '第58集', sourceIds: ['cctv-51'],
          intro: "莎丽落入断臂山的剑冢，发现独臂大侠留下的左手剑与剑谱。她依照遗言寻找出路。",
          dialogue: [{"speaker": "旁白", "text": "独臂大侠的剑冢里，留着左手剑与剑谱。", "provenance": "剧情旁白", "portraitSpeaker": "莎丽"}],
          kind: 'choice', choices: [{ label: '依左手的发力方向反转剑路', text: '换足、转腕，让剑锋沿相反的弧线穿过机关空隙。' }, { label: '先观察机关，再用反手破关', text: '找出镜像的节奏，顺着左臂最自然的方向出剑。' }],
          reward: reward(3), after: { swordStatus: 'training', hand: 'left', weaponName: '左手剑', technique: '反手剑', item: 'left-hand-manual' },
          outcome: "莎丽取到左手剑与剑谱，开始修习反手剑。"
        },
        {
          id: 'sali-05', title: '反手剑成', region: 'waterfall', anchor: 'shrine', place: '断臂山剑冢石台', episode: '第58—59集的练剑情节', sourceIds: ['cctv-51', 'official-moves'],
          intro: "莎丽在断臂山修习左手剑。",
          dialogue: [{"speaker": "旁白", "text": "莎丽继续练习左手剑。", "provenance": "剧情旁白", "portraitSpeaker": "莎丽"}],
          kind: 'training', battle: training(24), reward: reward(4),
          after: { swordStatus: 'training', hand: 'left', ultimateUnlocked: true, technique: '反手剑·紫气东来', item: 'left-hand-mastery' },
          outcome: "莎丽练成反手剑，留下报平安的讯息，暂不公开行踪。"
        },
        {
          id: 'sali-06', title: '暗中接应', region: 'tianzi', anchor: 'ruins', place: '天子山下水帘洞', episode: '原作后段：莎丽接应虹猫', sourceIds: ['official-late', 'official-antidote'],
          intro: '你接住坠下的虹猫，将他安置在水帘洞中。洞外搜捕渐近，洞里的火舞旋风，还差最后一层领悟。',
          dialogue: [{"speaker": "莎丽", "text": "安心练剑。", "provenance": "游戏改编对白"}],
          kind: 'battle', battle: fight('ambush', 5, 76, 26), reward: reward(5), after: { item: 'hidden-ally-memory' },
          outcome: '你挡下搜索的人，为虹猫保住了这块练剑之地。其后同伴识破假虹猫，你仍旧敛起锋芒，只盯着马三娘。'
        },
        {
          id: 'sali-07', title: '合璧之外', region: 'tianzi', anchor: 'camp', place: '七剑决战外围', episode: '原作终局：莎丽藏锋', sourceIds: ['official-finale', 'cctv-cast'],
          intro: '黑心虎的兵马涌向合璧之地，马三娘仍握着紫云剑。你守在外围，一面拦住增援，一面等她露出最后的破绽。',
          dialogue: [{"speaker": "莎丽", "text": "不能再让她伤到同伴。", "provenance": "游戏改编对白"}],
          kind: 'battle', battle: fight('crowd', 6, 92, 30), reward: reward(6), after: { item: 'patient-blade-memory' },
          outcome: '峰顶上七剑合璧，马三娘却暗中留了力；虹猫补上火舞旋风，黑心虎应声而倒。众人内力耗去大半，马三娘自以为胜券在握，夺麒麟的心思终于摊开在明面上。你握紧左手剑，自外围赶向同伴。'
        },
        {
          id: 'sali-08', title: '紫云归主', region: 'tianzi', anchor: 'main', place: '七剑合璧之地', episode: '原作终局，第108集', sourceIds: ['official-finale', 'cctv-cast'],
          intro: '黑心虎已倒在七剑合璧与虹猫追加的火舞旋风之下，同伴们也耗尽了力气。合璧时藏了后手的马三娘，此刻亮出夺麒麟的野心，召出伏兵。你赶到战场，以她始终没能看破的左手剑，迎上紫云剑锋。',
          dialogue: [{"speaker": "莎丽", "text": "紫云剑，我要取回来。", "provenance": "游戏改编对白"}],
          kind: 'battle', battle: fight('duel', 8, 80, 26, { name: '马三娘', kind: 'assassin' }), reward: reward(7, { virtue: 3 }),
          after: { swordStatus: 'bound', hand: 'left', weaponName: '紫云剑', ultimateUnlocked: true, technique: '左手紫云剑法', item: 'ziyun-returned' },
          outcome: '左手剑破了马三娘最后一步棋。紫云真剑重归你手，专属剑至此归位；而七侠迎回的，是从绝境里自己站起来的莎丽。'
        }
      ]
    }
  };
  heroes.lantu = {
    title: '冰魄篇 · 守护与抉择', subtitle: '玉蟾宫主，柔中有锋',
    prologue: '麒麟把受伤的虹猫送到玉蟾宫。你须一面救人，一面周旋于宫外重兵之间。从这一日起，冰魄剑所护的，已不止一座宫苑。',
    startRegion: 'yuchan', startAnchor: 'main', skillName: '冰魄剑法', ultName: '冰天雪地',
    ultNote: '冰天雪地据央视人物介绍；游戏中先起手冻结，再以 8 段冰域伤害持续控场。雪晶、寒流与剑幕，皆为本招意象的游戏演出。',
    initialSword: { status: 'bound', hand: 'right', ultimateUnlocked: true },
    chapters: [
      {
        id: 'lantu-01', title: '宫主迎敌', region: 'yuchan', anchor: 'main', place: '玉蟾宫桃林与荷池', episode: '第5—10集', sourceIds: ['cctv-01'],
        intro: "虹猫需要时间疗伤。蓝兔提出比武招亲，先在桃树上比武，再到荷池比轻功，借此拖住猪无戒。",
        dialogue: [{"speaker": "旁白", "text": "蓝兔借比武招亲为虹猫拖延疗伤时间。", "provenance": "剧情旁白", "portraitSpeaker": "蓝兔"}],
        kind: 'battle', battle: fight('crowd', 1, 36, 14), reward: reward(0), after: { item: 'palace-ribbon' },
        outcome: "蓝兔继续与猪无戒周旋，为虹猫争取疗伤时间。"
      },
      {
        id: 'lantu-02', title: '两剑破围', region: 'yuchan', anchor: 'arrival', place: '玉蟾宫宫门', episode: '第11—13集', sourceIds: ['cctv-11'],
        intro: '取药的谋划几近失手，幸有跳跳暗中送来解药。虹猫终于能与你并肩；紫兔和大奔正为离宫打点。',
        dialogue: [{"speaker": "蓝兔", "text": "一起出去。", "provenance": "游戏改编对白"}],
        kind: 'battle', battle: fight('duel', 2, 42, 16, { name: '猪无戒', kind: 'boar' }), reward: reward(1), after: { item: 'purple-rabbit-memory' },
        outcome: "两剑合璧之后，大奔护轿引敌，紫兔在轿中掩护。虹猫与蓝兔乘孔明灯离宫，紫兔牺牲。"
      },
      {
        id: 'lantu-03', title: '护住真剑主', region: 'inn', anchor: 'ruins', place: '金鞭溪客栈', episode: '第22—37集的莎丽之谜', sourceIds: ['cctv-21', 'cctv-31'],
        intro: "合璧失败、莎丽受控，客栈中的疑点越来越多。虹猫与蓝兔逐步查明内情，安排莎丽转移。",
        dialogue: [{"speaker": "蓝兔", "text": "先救莎丽。", "provenance": "游戏改编对白"}],
        kind: 'battle', battle: fight('rescue', 3, 54, 20), reward: reward(2), after: { item: 'tunnel-message' },
        outcome: "跳跳将莎丽送往六奇阁，虹猫等人设法瞒过马三娘。"
      },
      {
        id: 'lantu-04', title: '碧血真情', region: 'baicao', anchor: 'herb', place: '百草谷·七叶花生长处', episode: '第41—43集', sourceIds: ['cctv-41'],
        intro: '要救莎丽，须得碧血真情七叶花。与达达解开误会之后，你才知催开此花，要以自身精血为引。',
        dialogue: [{"speaker": "蓝兔", "text": "我的朋友还等着它救命。", "provenance": "游戏改编对白"}],
        kind: 'choice', choices: [{ label: '按达达指点，滴血催花', text: '蓝兔以鲜血催开七叶花，取花救治莎丽。' }, { label: '确认采法，再滴血取花', text: '确认方法之后，蓝兔滴血催开花蕾，取下七叶花。' }],
        reward: reward(3, { herbs: 3, virtue: 2 }), after: { item: 'seven-leaf-memory' },
        outcome: '七叶花到手，随即送入药炉。莎丽保住了性命；往后要面对的，是右手不能再使剑的日子。'
      },
      {
        id: 'lantu-05', title: '雪中相救', region: 'liuqige', anchor: 'lookout', place: '冰山雪沟', episode: '第45—51集', sourceIds: ['cctv-41', 'cctv-51'],
        intro: "莎丽去找马三娘报仇。猪无戒引发雪崩，蓝兔赶去救人，自己却落入冰沟。",
        dialogue: [{"speaker": "蓝兔", "text": "莎丽，抓紧！", "provenance": "游戏改编对白"}],
        kind: 'battle', battle: fight('rescue', 4, 68, 24), reward: reward(4, { virtue: 2 }), after: { item: 'snow-rescue-memory' },
        outcome: "蓝兔救援莎丽时落入冰沟，虹猫与莎丽先后下去。虹猫设法带众人脱险，逗逗在外接应。"
      },
      {
        id: 'lantu-06', title: '为奔雷开路', region: 'leizhuang', anchor: 'shrine', place: '奔雷剑陵园之外', episode: '第74—76集', sourceIds: ['cctv-71'],
        intro: '六嫂以性命为大奔换来取剑的时机。你赶到陵园，拦住猪无戒与十三太保，好让大奔走完最后那一段路。',
        dialogue: [{"speaker": "蓝兔", "text": "大奔，去取剑。", "provenance": "游戏改编对白"}],
        kind: 'battle', battle: fight('crowd', 5, 78, 26), reward: reward(5), after: { item: 'five-swords-memory' },
        outcome: '奔雷剑出世。你们破了包围，赶赴宝峰湖；五剑合璧，把困在孤岛上的虹猫接了回来。'
      },
      {
        id: 'lantu-07', title: '真伪之间', region: 'gallery', anchor: 'ruins', place: '十里画廊与水帘洞', episode: '原作后段：识破假虹猫', sourceIds: ['official-truth', 'official-antidote', 'official-rescue'],
        intro: '你在水帘洞见到真正的虹猫，才明白身边那位同伴为何处处不对。你与跳跳互通消息，配合虹猫救人破局。',
        dialogue: [{"speaker": "旁白", "text": "蓝兔与同伴着手查明假虹猫的身份。", "provenance": "剧情旁白", "portraitSpeaker": "蓝兔"}],
        kind: 'battle', battle: fight('ambush', 6, 88, 28), reward: reward(6), after: { item: 'true-companion-memory' },
        outcome: '假虹猫的局被拆开，受制的同伴尽数脱困。你再度与真正的长虹剑主并肩，向最后的围困走去。'
      },
      {
        id: 'lantu-08', title: '冰魄合璧', region: 'tianzi', anchor: 'main', place: '天子山决战之地', episode: '原作终局，第108集', sourceIds: ['official-finale', 'cctv-story'],
        intro: '追兵汇成黑潮涌来。你以冰天雪地护住合璧阵位，好让同伴在纷乱的战场上立得住脚。',
        dialogue: [{"speaker": "蓝兔", "text": "七剑合璧！", "provenance": "游戏改编对白"}],
        kind: 'battle', battle: finale('lantu'), reward: reward(7, { virtue: 3 }), after: { item: 'seven-swords-memory' }, outcome: finaleOutcome('lantu')
      }
    ]
  };

  heroes.doudou = {
    title: '雨花篇 · 医者剑心', subtitle: '从怕惹麻烦，到舍身救人',
    prologue: '你原打算在六奇阁安心行医，跳跳却送来一个身中奇毒的莎丽。医书、药方与七剑之约，一同推开了你的山门。',
    startRegion: 'liuqige', startAnchor: 'workshop', skillName: '雨花剑法', ultName: '雨花剑法',
    ultNote: '雨花剑法合神医身份于一处：持续御敌，并为范围内的存活友方提供小额治疗，离开范围则停止回复。治疗比例、雨幕范围与伤害节奏均属游戏改编。',
    initialSword: { status: 'bound', hand: 'right', ultimateUnlocked: true },
    chapters: [
      {
        id: 'doudou-01', title: '医馆来客', region: 'liuqige', anchor: 'workshop', place: '六奇阁', episode: '第38—39集', sourceIds: ['cctv-31'],
        intro: '跳跳带着伤重的莎丽闯进六奇阁。你验过伤情，看出寻常方子根本压不住她身上的毒。',
        dialogue: [{"speaker": "旁白", "text": "逗逗查出莎丽中了黯然销魂散，须取医典寻找救治办法。", "provenance": "剧情旁白", "portraitSpeaker": "逗逗"}],
        kind: 'choice', choices: [{ label: '先稳住毒势，查阅药记', text: '你守住伤者的气息，判断必须去取《济世医典》。' }, { label: '让跳跳说明经过，再安置伤者', text: '误会解开，你准备面对从未遇见过的毒伤。' }],
        reward: reward(0, { herbs: 2 }), after: { item: 'doctor-notes' }, outcome: '莎丽暂且脱了最急的一关。你决定与虹猫同去穿云洞，寻那部真正能救她的医典。'
      },
      {
        id: 'doudou-02', title: '灵兽与医典', region: 'liuqige', anchor: 'ruins', place: '穿云洞', episode: '第39—40集', sourceIds: ['cctv-31'],
        intro: "猪无戒抢先进入穿云洞。灵兽袭击虹猫时，他趁机夺书，随后又以暗器袭击虹猫。",
        dialogue: [{"speaker": "逗逗", "text": "我有麻沸散。", "provenance": "游戏改编对白"}],
        kind: 'battle', battle: fight('rescue', 2, 44, 16), reward: reward(1), after: { item: 'medical-classic' },
        outcome: "逗逗用麻沸散制住灵兽。虹猫察觉被抢走的并非真本，两人继续查找，取得《济世医典》。"
      },
      {
        id: 'doudou-03', title: '奇迹在左手', region: 'liuqige', anchor: 'herb', place: '六奇阁药炉前', episode: '第44、52集', sourceIds: ['cctv-41', 'cctv-51'],
        intro: '性命是救回来了，莎丽的右手却仍旧握不住剑。你翻来覆去地改药方，甚至亲身试药，只盼能多给她一分希望。',
        dialogue: [{"speaker": "逗逗", "text": "你肯再试，我就陪着。", "provenance": "游戏改编对白"}],
        kind: 'choice', choices: [{ label: '把木剑放到她的左手边', text: '你把医典的启示告诉莎丽，陪她从最小的一步重新开始。' }, { label: '陪她练习握柄与抬腕', text: '不用一次就做好，让新动作一点点变得可靠。' }],
        reward: reward(2, { herbs: 2, virtue: 2 }), after: { item: 'left-hand-promise' }, outcome: "逗逗亲身试药，莎丽受到触动，重新下定决心练左手剑。"
      },
      {
        id: 'doudou-04', title: '奔雷的钥匙', region: 'leizhuang', anchor: 'ruins', place: '快活林与陵园', episode: '第64—75集', sourceIds: ['cctv-61', 'cctv-71'],
        intro: "逗逗等人追查第五剑。六嫂受到猪无戒胁迫，水火棍则是取出奔雷剑的关键。",
        dialogue: [{"speaker": "旁白", "text": "六嫂与水火棍，关系着大奔取出奔雷剑。", "provenance": "剧情旁白", "portraitSpeaker": "逗逗"}],
        kind: 'battle', battle: fight('rescue', 3, 62, 22), reward: reward(3), after: { item: 'fifth-sword-memory' },
        outcome: '六嫂护住了水火棍，也搭上了自己的性命。大奔带着她的托付取出奔雷剑，众人赶去孤岛解虹猫之围。'
      },
      {
        id: 'doudou-05', title: '雷区救人', region: 'waterfall', anchor: 'lookout', place: '雷区', episode: '第84—87集', sourceIds: ['cctv-81'],
        intro: "跳跳为了引黑心虎进入雷区，迫使前来采药的逗逗充当诱饵。蓝兔随后赶来，刺杀计划出了意外。",
        dialogue: [{"speaker": "逗逗", "text": "先活着出去！", "provenance": "游戏改编对白"}],
        kind: 'battle', battle: fight('rescue', 4, 70, 24), reward: reward(4, { herbs: 2 }), after: { item: 'lightning-rescue-memory' },
        outcome: "逗逗带走受伤的跳跳，蓝兔却被黑心虎抓住。"
      },
      {
        id: 'doudou-06', title: '神医入虎穴', region: 'gallery', anchor: 'camp', place: '黑虎崖', episode: '第92集', sourceIds: ['cctv-92'],
        intro: "猪无戒带逗逗等人进入黑虎崖。逗逗以看病牵制黑心虎，跳跳与大奔趁机寻找灵泉宝玉。",
        dialogue: [{"speaker": "旁白", "text": "逗逗牵制黑心虎，跳跳和大奔趁机取玉。", "provenance": "剧情旁白", "portraitSpeaker": "逗逗"}],
        kind: 'battle', battle: fight('ambush', 5, 78, 26), reward: reward(5), after: { item: 'tiger-cliff-memory' },
        outcome: "跳跳与大奔取回宝玉。"
      },
      {
        id: 'doudou-07', title: '招魂引解药', region: 'gallery', anchor: 'workshop', place: '十里画廊临时药舍', episode: '原作后段：解药与假虹猫', sourceIds: ['official-antidote', 'official-truth'],
        intro: '你在旧日的毒伤记录里寻到相通的药理，配出了招魂引的解药。敌人要把你与同伴都变成听令的傀儡，这方子务必保住。',
        dialogue: [{"speaker": "逗逗", "text": "解药务必保住。", "provenance": "游戏改编对白"}],
        kind: 'battle', battle: fight('rescue', 6, 88, 28), reward: reward(6, { herbs: 3 }), after: { item: 'antidote-notes' },
        outcome: '同伴设法利用解药解除控制。'
      },
      {
        id: 'doudou-08', title: '雨花济世', region: 'tianzi', anchor: 'main', place: '天子山决战之地', episode: '原作终局，第108集', sourceIds: ['official-finale', 'cctv-story'],
        intro: "逗逗持雨花剑，与同伴准备合璧。",
        dialogue: [{"speaker": "逗逗", "text": "大伙都要平安回来！", "provenance": "游戏改编对白"}],
        kind: 'battle', battle: finale('doudou'), reward: reward(7, { virtue: 3 }), after: { item: 'seven-swords-memory' }, outcome: finaleOutcome('doudou')
      }
    ]
  };

  heroes.daben = {
    title: '奔雷篇 · 从豪气到担当', subtitle: '戒酒戒赌，接下奔雷',
    prologue: '你自号混世魔王，一根水火棍走遍江湖。你还不知道，干娘六嫂守着的那些旧事，正与那柄尚未出世的奔雷剑连在一处。',
    startRegion: 'yuchan', startAnchor: 'camp', skillName: '奔雷剑法', ultName: '奔雷滚滚',
    ultNote: '取剑之前使用水火棍；第五章取出奔雷剑之后，解锁奔雷剑法与奔雷滚滚。戒酒戒赌是这条传记的成长节点，不作数值门槛。',
    initialSword: { status: 'sealed', hand: 'right', ultimateUnlocked: false, weaponName: '水火棍', technique: '水火棍法' },
    chapters: [
      {
        id: 'daben-01', title: '混世魔王', region: 'yuchan', anchor: 'camp', place: '玉蟾宫', episode: '第8—13集', sourceIds: ['cctv-01', 'cctv-11'],
        intro: "大奔来到玉蟾宫参加比武招亲，与猪无戒争夺绣球，随后卷入虹猫和蓝兔的脱身计划。",
        dialogue: [{"speaker": "大奔", "text": "俺大奔偏偏要管！", "provenance": "游戏改编对白"}],
        kind: 'battle', battle: fight('crowd', 1, 40, 16), reward: reward(0), after: { technique: '水火棍法', item: 'water-fire-staff-memory' },
        outcome: '你与猪无戒缠斗，其后又护着轿子引开追兵。紫兔以性命作掩护，虹猫与蓝兔得以离宫；你则继续打听他们的下落。'
      },
      {
        id: 'daben-02', title: '客栈救人', region: 'inn', anchor: 'side1', place: '金鞭溪客栈后山', episode: '第25—28集', sourceIds: ['cctv-21'],
        intro: '虹猫托你去寻被藏起来的莎丽。牛旋风的封山队挡在道上，暗处还留着跳跳的指引。',
        dialogue: [{"speaker": "旁白", "text": "跳跳暗中指引，大奔与牛旋风前去寻找莎丽。", "provenance": "剧情旁白", "portraitSpeaker": "大奔"}],
        kind: 'battle', battle: fight('rescue', 2, 48, 18), reward: reward(1), after: { item: 'rescued-sali-memory' },
        outcome: "在跳跳指引下，大奔和牛旋风找到莎丽，把她带回客栈。"
      },
      {
        id: 'daben-03', title: '关口失守', region: 'waterfall', anchor: 'camp', place: '护送莎丽途中的天险', episode: '第53—57集', sourceIds: ['cctv-51'],
        intro: '你护送莎丽，却因贪那一场赌酒离了关口，正中了猪无戒的圈套。追兵已绕到背后，你拼了命挥棍，只想护住身旁的人。',
        dialogue: [{"speaker": "大奔", "text": "是俺误了事……", "provenance": "游戏改编对白"}],
        kind: 'battle', battle: fight('rescue', 3, 58, 22), reward: reward(2), after: { item: 'niu-xuanfeng-memory' },
        outcome: "牛旋风救大奔时被乱箭射死，莎丽跳下山崖。虹猫赶到，与大奔借酒破阵。"
      },
      {
        id: 'daben-04', title: '放下酒与赌', region: 'leizhuang', anchor: 'main', place: '快活林', episode: '第61—74集', sourceIds: ['cctv-61', 'cctv-71'],
        intro: "大奔先前戒酒戒赌失败。如今六嫂被猪无戒囚禁，他重新下定决心。",
        dialogue: [{"speaker": "旁白", "text": "为救六嫂，大奔决心戒酒戒赌。", "provenance": "剧情旁白", "portraitSpeaker": "大奔"}],
        kind: 'choice', choices: [{ label: '放下酒葫芦，立下戒酒戒赌的决心', text: '你收起玩闹，把目光转向需要你保护的干娘。' }, { label: '想起六嫂的劝告，决定戒酒戒赌', text: '记住六嫂的劝告，不再贪酒好赌。' }],
        reward: reward(3, { virtue: 2 }), after: { technique: '水火棍法·守关', item: 'sober-promise' },
        outcome: "大奔戒成后，为救六嫂再次赴赌，输掉水火棍。六嫂获救后又舍命夺回棍子，掩护众人离开。"
      },
      {
        id: 'daben-05', title: '奔雷出世', region: 'leizhuang', anchor: 'shrine', place: '奔雷剑陵园', episode: '第75集', sourceIds: ['cctv-71', 'official-moves'],
        intro: "大奔带水火棍进入陵园，准备取剑，酒葫芦却触发险情。追敌仍守在外面。",
        dialogue: [{"speaker": "大奔", "text": "干娘……", "provenance": "游戏改编对白"}],
        kind: 'battle', battle: fight('crowd', 4, 74, 26), reward: reward(4),
        after: { swordStatus: 'bound', hand: 'right', weaponName: '奔雷剑', ultimateUnlocked: true, technique: '奔雷剑法', item: 'thunder-sword-memory' },
        outcome: "大奔取得奔雷剑，与蓝兔合力破了十三太保，赶往宝峰湖孤岛。"
      },
      {
        id: 'daben-06', title: '五剑破浪', region: 'waterfall', anchor: 'waterside', place: '宝峰湖孤岛', episode: '第76集', sourceIds: ['cctv-71'],
        intro: '虹猫在孤岛上已苦守多时。如今奔雷在手，你直冲重重封锁，以真正的第五剑为同伴打开归路。',
        dialogue: [{"speaker": "大奔", "text": "虹猫，我们来了！", "provenance": "游戏改编对白"}],
        kind: 'battle', battle: fight('crowd', 5, 86, 28), reward: reward(5), after: { item: 'five-swords-memory' },
        outcome: "奔雷剑加入，五剑合璧，冲破孤岛的围困。"
      },
      {
        id: 'daben-07', title: '护住同伴', region: 'gallery', anchor: 'camp', place: '十里画廊', episode: '原作后段：假虹猫阴谋解除', sourceIds: ['official-antidote', 'official-truth', 'official-rescue'],
        intro: '假虹猫以药物控住七剑，连你也着了道。真相揭开、药力散去之后，你重新握住奔雷，冲向围住同伴的敌群。',
        dialogue: [{"speaker": "大奔", "text": "谁也别想拆散俺们！", "provenance": "游戏改编对白"}],
        kind: 'battle', battle: fight('crowd', 6, 96, 30), reward: reward(6), after: { item: 'true-companion-memory' },
        outcome: "大奔重新与同伴同行。"
      },
      {
        id: 'daben-08', title: '奔雷守诺', region: 'tianzi', anchor: 'main', place: '天子山决战之地', episode: '原作终局，第108集', sourceIds: ['official-finale', 'cctv-story'],
        intro: '黑心虎的重兵迎面压来。你立在合璧阵前，以奔雷滚滚撕开战线，好让同伴跟上来。',
        dialogue: [{"speaker": "大奔", "text": "七剑合璧！", "provenance": "游戏改编对白"}],
        kind: 'battle', battle: finale('daben'), reward: reward(7, { virtue: 3 }), after: { item: 'seven-swords-memory' }, outcome: finaleOutcome('daben')
      }
    ]
  };

  heroes.tiaotiao = {
    title: '青光篇 · 暗处的同伴', subtitle: '藏剑于身，明心于行',
    prologue: '你以魔教护法的身份行走江湖，真正的青光剑收在无人知晓的地方。复仇的念头伴了你许多年，而每一次暗中救人，都把你往同伴身边推近一步。',
    startRegion: 'forest', startAnchor: 'camp', skillName: '青光剑法', ultName: '青光剑法',
    ultNote: '取剑之前以护法身份、寻常佩剑行事；天池取剑之后，青光剑法以雷电剑光演出。未采用无法核实的网传招名。',
    initialSword: { status: 'sealed', hand: 'right', ultimateUnlocked: false, weaponName: '护法佩剑', technique: '护法剑术' },
    chapters: [
      {
        id: 'tiaotiao-01', title: '护法的暗线', region: 'forest', anchor: 'camp', place: '黑虎崖与搜山队', episode: '第3—11集', sourceIds: ['cctv-01', 'cctv-11', 'cctv-cast'],
        intro: '魔教搜山，你须把护法这层皮继续披下去。借着搜寻调度的差事，你替虹猫与蓝兔争来一点时间。',
        dialogue: [{"speaker": "旁白", "text": "跳跳以魔教护法的身份潜伏，暗中帮助七剑。", "provenance": "剧情旁白", "portraitSpeaker": "跳跳"}],
        kind: 'choice', choices: [{ label: '借调度之机拖住追兵', text: '你顺着堂主们互争功劳的心思，为同伴挪开一道阻碍。' }, { label: '留下隐蔽示警，继续扮演护法', text: '消息递出去，你仍回到众人眼中的位置。' }],
        reward: reward(0), after: { technique: '护法剑术', item: 'hidden-message' }, outcome: '没人看见青光剑，虹猫与蓝兔却多了一次脱身的机会。你转身走向下一条暗线。'
      },
      {
        id: 'tiaotiao-02', title: '真正的解药', region: 'yuchan', anchor: 'side1', place: '玉蟾宫外魔教营地', episode: '第12集', sourceIds: ['cctv-11'],
        intro: '蓝兔取药中了圈套，虹猫的毒伤至今未愈。你潜进守备之中，非要拿到那一份真正的解药。',
        dialogue: [{"speaker": "旁白", "text": "跳跳为虹猫取得真正的解药。", "provenance": "剧情旁白", "portraitSpeaker": "跳跳"}],
        kind: 'battle', battle: fight('ambush', 2, 44, 16), reward: reward(1), after: { item: 'antidote-delivery-memory' },
        outcome: '解药悄悄送到虹猫手中，两剑合璧终得成就。你重新退回暗处，去查魔教下一步的动向。'
      },
      {
        id: 'tiaotiao-03', title: '引线背后', region: 'inn', anchor: 'ruins', place: '金鞭溪客栈暗道', episode: '第17—38集的暗中救援', sourceIds: ['cctv-11', 'cctv-31'],
        intro: '你查出客栈里藏着魔教内应，又摸到一条通往宝塔的炸药引线。虹猫认出了你的身份，托你先把莎丽救走。',
        dialogue: [{"speaker": "虹猫", "text": "莎丽就托付给你了。", "provenance": "游戏改编对白"}],
        kind: 'battle', battle: fight('rescue', 3, 56, 20), reward: reward(2), after: { item: 'tunnel-message' },
        outcome: "跳跳将莎丽送到六奇阁，继续以护法身份行动。"
      },
      {
        id: 'tiaotiao-04', title: '天池取青光', region: 'waterfall', anchor: 'waterside', place: '天池湖畔', episode: '第78—79集', sourceIds: ['cctv-71'],
        intro: '麒麟现身的消息传开，雷雨也已经近了。你来到天池湖畔，准备取出藏了许久的青光剑。',
        dialogue: [{"speaker": "旁白", "text": "跳跳来到天池，准备取回青光剑。", "provenance": "剧情旁白", "portraitSpeaker": "跳跳"}],
        kind: 'choice', choices: [{ label: '取出青光剑，稳住剑息', text: '熟悉的剑柄回到掌心，雷光映亮湖面。' }, { label: '整理旧誓，再揭开藏剑处', text: '你不忘来时的路，也看清现在需要保护的人。' }],
        reward: reward(3), after: { swordStatus: 'bound', hand: 'right', weaponName: '青光剑', ultimateUnlocked: true, technique: '青光剑法', item: 'qingguang-returned' },
        outcome: "跳跳取出青光剑，趁雷雨刺杀黑心虎，未能得手。黑心虎起疑，设局试探；跳跳涉险过关。"
      },
      {
        id: 'tiaotiao-05', title: '雷区显身', region: 'waterfall', anchor: 'lookout', place: '雷区', episode: '第82—87集', sourceIds: ['cctv-81'],
        intro: "跳跳在雷区布阵，借逗逗引黑心虎前来，准备再次复仇。蓝兔赶来救人，打乱了刺杀计划。",
        dialogue: [{"speaker": "跳跳", "text": "我是青光剑主。", "provenance": "游戏改编对白"}],
        kind: 'battle', battle: fight('crowd', 4, 74, 26), reward: reward(4), after: { item: 'qingguang-identity' },
        outcome: "跳跳刺杀失败，负伤后被逗逗救走，蓝兔则落入黑心虎手中。"
      },
      {
        id: 'tiaotiao-06', title: '故地取玉', region: 'gallery', anchor: 'camp', place: '黑虎崖', episode: '第92集', sourceIds: ['cctv-92'],
        intro: '为取回灵泉宝玉，你重又踏进熟悉的黑虎崖。逗逗缠住黑心虎，你带着大奔穿过那些旧日的守备。',
        dialogue: [{"speaker": "跳跳", "text": "跟紧我，取到宝玉就走。", "provenance": "游戏改编对白"}],
        kind: 'battle', battle: fight('ambush', 5, 82, 28), reward: reward(5), after: { item: 'tiger-cliff-memory' },
        outcome: "逗逗牵制黑心虎，跳跳与大奔取回宝玉。"
      },
      {
        id: 'tiaotiao-07', title: '看破伪装', region: 'gallery', anchor: 'ruins', place: '十里画廊', episode: '原作后段：跳跳与蓝兔识破假虹猫', sourceIds: ['official-truth', 'official-antidote'],
        intro: '假虹猫的言行处处留着破绽。你与蓝兔互换了线索，赶在对方还想控住七剑之前备好反击。',
        dialogue: [{"speaker": "旁白", "text": "跳跳与蓝兔核对假虹猫留下的破绽。", "provenance": "剧情旁白", "portraitSpeaker": "跳跳"}],
        kind: 'battle', battle: fight('ambush', 6, 92, 30), reward: reward(6), after: { item: 'true-companion-memory' },
        outcome: "同伴核对假虹猫的疑点，继续设法解除控制。"
      },
      {
        id: 'tiaotiao-08', title: '青光同归', region: 'tianzi', anchor: 'main', place: '天子山决战之地', episode: '原作终局，第108集', sourceIds: ['official-finale', 'cctv-story'],
        intro: '黑心虎就在前方。这一回身边有同伴，复仇不再是一个人往里闯的赌局。',
        dialogue: [{"speaker": "跳跳", "text": "七剑合璧！", "provenance": "游戏改编对白"}],
        kind: 'battle', battle: finale('tiaotiao'), reward: reward(7, { virtue: 3 }), after: { item: 'seven-swords-memory' }, outcome: finaleOutcome('tiaotiao')
      }
    ]
  };

  heroes.dada = {
    title: '旋风篇 · 家人与山河', subtitle: '琴心剑胆，护住两全',
    prologue: '你守着百草谷，与家人相守。灵泉生变，七剑到来，把这一片安宁卷进了风暴；旋风剑主须得寻一条路，既能护住家人，也不负这片山林。',
    startRegion: 'baicao', startAnchor: 'herb', skillName: '旋风剑法', ultName: '琴针飞箭',
    ultNote: '琴针飞箭见央视达达人设；旋风剑法以短弧风刃回旋，琴针分轮索敌，配合七弦拨动与针束的演出。',
    initialSword: { status: 'bound', hand: 'right', ultimateUnlocked: true },
    chapters: [
      {
        id: 'dada-01', title: '一朵花的分量', region: 'baicao', anchor: 'herb', place: '百草谷', episode: '第43集', sourceIds: ['cctv-41', 'cctv-dada'],
        intro: '蓝兔闯进药谷，原是为救治莎丽。误会既解，你说明七叶花的采法，也在暗处看着她付出救人的代价。',
        dialogue: [{"speaker": "旁白", "text": "达达与蓝兔解开误会，告知七叶花的取法。", "provenance": "剧情旁白", "portraitSpeaker": "达达"}],
        kind: 'choice', choices: [{ label: '说明催花之法，守住药谷周围', text: '你尊重她的选择，也护住不受打扰的采花时刻。' }, { label: '确认来意后，为蓝兔指明花圃', text: '药草留在谷中长成，本就是为了有一天能够救人。' }],
        reward: reward(0, { herbs: 2 }), after: { item: 'seven-leaf-memory' }, outcome: "蓝兔取到七叶花，赶回救治莎丽。"
      },
      {
        id: 'dada-02', title: '灵泉失落', region: 'gallery', anchor: 'waterside', place: '十里画廊灵泉', episode: '第89集', sourceIds: ['cctv-81'],
        intro: '竹木药草骤然枯败，灵泉宝玉不见了。你挂心怀孕的妻子，急急沿溪追查，先挡下正在搜谷的黑衣人。',
        dialogue: [{"speaker": "达达", "text": "非得找出宝玉不可。", "provenance": "游戏改编对白"}],
        kind: 'battle', battle: fight('crowd', 2, 46, 18), reward: reward(1), after: { item: 'spring-trace' },
        outcome: '你沿溪寻到了虹猫，却把宝玉失窃的事错安在他身上。焦急叫你错判了同伴，新的误会由此生出。'
      },
      {
        id: 'dada-03', title: '寒洞释疑', region: 'baicao', anchor: 'ruins', place: '寒冰洞', episode: '原作十里画廊段：达达与虹猫的误会', sourceIds: ['cctv-90', 'cctv-81', 'official-late'],
        intro: '你把虹猫困在寒冰洞，想藉此追回宝玉。同伴带来的线索，终于让你看见先前忽略的那一半真相。',
        dialogue: [{"speaker": "旁白", "text": "达达误认虹猫盗走宝玉，将他关进寒冰洞。", "provenance": "剧情旁白", "portraitSpeaker": "达达"}],
        kind: 'choice', choices: [{ label: '打开机关，听完虹猫的经历', text: '你愿意把事情查清，不再让同伴替真凶承担。' }, { label: '核对灵泉线索，与众人消除误会', text: '真正盗走宝玉的人另有其人，七剑应当共同面对。' }],
        reward: reward(2, { virtue: 2 }), after: { item: 'trust-restored' }, outcome: "达达与同伴消除误会。宝玉尚待取回，灵泉的危机并未就此结束。"
      },
      {
        id: 'dada-04', title: '家人受制', region: 'baicao', anchor: 'camp', place: '百草谷与黑小虎设伏处', episode: '原作后段：达夫人被掳', sourceIds: ['cctv-dada', 'official-late'],
        intro: '黑小虎劫走达夫人，以她的安危逼你听命。你赶去救人，迎头却是层层伏兵。',
        dialogue: [{"speaker": "达达", "text": "我非得找到她不可。", "provenance": "游戏改编对白"}],
        kind: 'battle', battle: fight('rescue', 3, 62, 22), reward: reward(3), after: { item: 'family-keepsake' },
        outcome: '外围伏兵被击退，人质却仍在黑小虎手里。你在家人与同伴之间被迫周旋，只能暗暗寻一个脱困的缝隙。'
      },
      {
        id: 'dada-05', title: '子母残局', region: 'gallery', anchor: 'shrine', place: '十里画廊棋局前', episode: '原作后段：子母残局与达达受制', sourceIds: ['official-late', 'official-antidote'],
        intro: "达夫人被掳，黑小虎以此要挟达达。",
        dialogue: [{"speaker": "旁白", "text": "妻子被掳后，达达受到黑小虎要挟。", "provenance": "剧情旁白", "portraitSpeaker": "达达"}],
        kind: 'choice', choices: [{ label: '先稳住棋局，设法向同伴示警', text: '你没有放弃家人，也没有停止寻找打破胁迫的办法。' }, { label: '观察整盘棋，等待相互接应的机会', text: '把目光移开威胁，才能看见局外还有可信的人。' }],
        reward: reward(4), after: { item: 'mother-child-board' }, outcome: "达达继续设法摆脱胁迫。"
      },
      {
        id: 'dada-06', title: "暗中示警", region: 'gallery', anchor: 'lookout', place: '十里画廊', episode: '原作后段：协助蓝兔、跳跳辨明真假', sourceIds: ['official-truth', 'official-antidote'],
        intro: "达达仍受黑小虎牵制。他寻找机会，为同伴示警。",
        dialogue: [{"speaker": "旁白", "text": "达达仍受牵制，设法帮助同伴。", "provenance": "剧情旁白", "portraitSpeaker": "达达"}],
        kind: 'battle', battle: fight('ambush', 5, 78, 26), reward: reward(5), after: { item: 'true-companion-memory' },
        outcome: '线索终于串成了一处。真正的虹猫开始筹划救人，黑小虎的威胁也不必再一个人受着。'
      },
      {
        id: 'dada-07', title: '家人归来', region: 'baicao', anchor: 'arrival', place: '达夫人被囚之处与百草谷', episode: '原作后段：达夫人获救', sourceIds: ['official-rescue', 'official-truth'],
        intro: '虹猫用计救出达夫人，宝玉也一并夺回。你守住归途的出口，以旋风剑挡下追来的魔教残兵。',
        dialogue: [{"speaker": "达达", "text": "你们把我的家人带回来了。", "provenance": "游戏改编对白"}],
        kind: 'battle', battle: fight('rescue', 6, 88, 28), reward: reward(6, { herbs: 2 }), after: { item: 'family-reunited' },
        outcome: '家人与同伴都回到了身旁。你安顿好达夫人，带着旋风剑赶去会合；这一回，终于能毫无牵挂地守那七剑之约。'
      },
      {
        id: 'dada-08', title: '旋风护山河', region: 'tianzi', anchor: 'main', place: '天子山决战之地', episode: '原作终局，第108集', sourceIds: ['official-finale', 'cctv-story'],
        intro: "达达持旋风剑参加最后一战。",
        dialogue: [{"speaker": "达达", "text": "七剑合璧！", "provenance": "游戏改编对白"}],
        kind: 'battle', battle: finale('dada'), reward: reward(7, { virtue: 3 }), after: { item: 'seven-swords-memory' }, outcome: finaleOutcome('dada')
      }
    ]
  };

  const encounters = [
    {
      id: 'forest-dove', title: '灵鸽歇枝', region: 'forest', anchor: 'side1', place: '松枝下', kind: 'choice', sourceIds: ['cctv-01'],
      intro: '一只灵鸽在枝头歇脚，脚上还系着空信筒。它歪着头看你，仿佛认得七剑的气息。',
      dialogue: [{ speaker: '你', text: '歇一会儿吧。等风顺了再飞。' }],
      choices: [{ label: '留一点清水', text: '灵鸽饮罢，拍翅飞向山口。' }, { label: '抬手让它认认剑穗', text: '它绕你飞了一圈，才重新振翅。' }],
      reward: { xp: 30, gold: 55 }, after: { item: 'dove-feather' }, outcome: '羽毛落在掌心。消息仍要往山林深处传去。'
    },
    {
      id: 'forest-small-beasts', title: '林间小兽', region: 'forest', anchor: 'side2', place: '林间岔道', kind: 'battle', sourceIds: ['cctv-story'],
      intro: '几只小兽被搜山队堵在石隙旁。顺手清开这一段路，它们自会回到林中去。',
      dialogue: [{ speaker: '你', text: '往林子里走。这边我来挡。' }],
      battle: fight('crowd', 1, 32, 14), reward: { xp: 30, gold: 55, herbs: 1 }, after: { item: 'forest-seed' }, outcome: '黑衣人散去，小兽钻进灌木。你拾起一颗从枝间滚落的种子。'
    },
    {
      id: 'yuchan-embroidery', title: '绣架上的牛', region: 'yuchan', anchor: 'side1', place: '宫苑绣架', kind: 'choice', sourceIds: ['cctv-01'],
      intro: '绣架上留着一幅还没收针的牛像。想起蓝兔曾借绣花拖住牛旋风，那桩紧张的旧事，如今读来也添了几分笑意。',
      choices: [{ label: '替绣架遮住雨水', text: '你把架子挪到檐下，线色仍旧清清楚楚。' }, { label: '看一眼画像，笑着继续走', text: '这份机智，值得好好记住。' }],
      reward: { xp: 30, gold: 55 }, after: { item: 'embroidered-ox' }, outcome: '你记下一笔有趣的旧事，继续沿宫道走去。'
    },
    {
      id: 'yuchan-purple-rabbit', title: '宫灯长明', region: 'yuchan', anchor: 'side2', place: '静廊宫灯下', kind: 'choice', sourceIds: ['cctv-11'],
      intro: '宫灯旁留着一条紫色系带。有人把这里收拾得干干净净，为那位曾护住同伴的姑娘点着一盏长明灯。',
      choices: [{ label: '添一点灯油', text: '灯芯重新亮起，照着安静的回廊。' }, { label: '拂去灯座上的落叶', text: '你停了片刻，把谢意留在心里。' }],
      reward: { xp: 30, gold: 55, virtue: 1 }, after: { item: 'purple-rabbit-memory' }, outcome: '宫灯在风里轻轻晃动，光却没熄。'
    },
    {
      id: 'inn-hidden-tunnel', title: '空信筒', region: 'inn', anchor: 'side1', place: '客栈墙根', kind: 'choice', sourceIds: ['cctv-31'],
      intro: '墙缝里的空信筒轻轻一转，露出一枚暗道标记。一次不起眼的示警，曾改了许多人的命数。',
      choices: [{ label: '记下标记，合好墙缝', text: '旧日的暗线就此收好，不必再招人追索。' }, { label: '确认暗道已安全', text: '你只在附近看了一圈，便继续前行。' }],
      reward: { xp: 30, gold: 55 }, after: { item: 'empty-message-tube' }, outcome: '暗道里只剩安静的水声。'
    },
    {
      id: 'inn-disturbance', title: '客栈门前', region: 'inn', anchor: 'side2', place: '客栈短街', kind: 'battle', sourceIds: ['cctv-21'],
      intro: '一队黑衣人正要掀翻路旁摊位。你提剑挡在短街上，替摊主守住这一点人间烟火。',
      dialogue: [{ speaker: '你', text: '别碰这些东西。退后。' }],
      battle: fight('crowd', 2, 40, 18), reward: { xp: 30, gold: 55, herbs: 1 }, after: { item: 'inn-tea-token' }, outcome: '摊主重新摆好茶碗，把一杯热茶递到你手上。'
    },
    {
      id: 'liuqige-chicken', title: '神医的鸡腿', region: 'liuqige', anchor: 'side1', place: '药阁檐下', kind: 'choice', sourceIds: ['cctv-cast'],
      intro: '油纸包里飘出香味，旁边却压着一张一本正经的字条：行医之前，也要好好吃饭。',
      choices: [{ label: '尝一口秘制鸡腿', text: '药阁里难得有个只与饭香有关的时刻。' }, { label: '把纸包留给忙完的神医', text: '你替它盖好，免得香气引来山里的小客人。' }],
      reward: { xp: 30, gold: 55, herbs: 1 }, after: { item: 'chicken-recipe' }, outcome: '你把这段闲趣写进游历册，继续上路。'
    },
    {
      id: 'liuqige-drying-herbs', title: '护住药架', region: 'liuqige', anchor: 'side2', place: '晒药石坪', kind: 'battle', sourceIds: ['cctv-31'],
      intro: '追兵绕到药阁侧面，眼看就要踩坏晾晒的草药。你挡在药架之前，为伤者留下这些救命的东西。',
      battle: fight('rescue', 3, 48, 20), reward: { xp: 30, gold: 55, herbs: 2 }, after: { item: 'herb-pressing' }, outcome: '追兵退去，药架完好。风又把草木的气味送回石坪。'
    },
    {
      id: 'leizhuang-water-tea', title: '以茶代酒', region: 'leizhuang', anchor: 'side1', place: '快活林小桌旁', kind: 'choice', sourceIds: ['cctv-61', 'cctv-71'],
      intro: '桌上的酒坛已经挪开，换成一壶热茶。大奔许下的诺言，就落在这件极小的变化里。',
      choices: [{ label: '举茶相敬', text: '不必赌个输赢，也能与朋友痛快相聚。' }, { label: '为路过的人添一只杯子', text: '一张小桌，也能接住许多人的归途。' }],
      reward: { xp: 30, gold: 55 }, after: { item: 'tea-instead-wine' }, outcome: '茶香升起，旧日那股豪气有了新的去处。'
    },
    {
      id: 'leizhuang-six-aunt', title: '旧庄一束花', region: 'leizhuang', anchor: 'side2', place: '旧庄静处', kind: 'choice', sourceIds: ['cctv-71'],
      intro: '路旁放着一束摆得齐整的山花。你想起六嫂守护大奔与奔雷剑的旧事，也想起那句没能说完的叮嘱。',
      choices: [{ label: '把被风吹散的花枝摆正', text: '你细细理好，不惊动旁边的草木。' }, { label: '安静行一礼', text: '把这份守护记在心里，再走不迟。' }],
      reward: { xp: 30, gold: 55, virtue: 1 }, after: { item: 'six-aunt-memory' }, outcome: '花束静静停在阳光里。'
    },
    {
      id: 'waterfall-reverse-mark', title: '反手留痕', region: 'waterfall', anchor: 'side1', place: '瀑旁石壁', kind: 'choice', sourceIds: ['cctv-51'],
      intro: '石上几道剑痕沿相反的方向连成一弧，叫人想起莎丽初学左手剑时的那股执拗。',
      choices: [{ label: '用左手比画一下剑路', text: '别扭的起手之后，你看见另一种连贯的走法。' }, { label: '把剑痕拓进游历册', text: '困境留下的痕迹，也是一条新路。' }],
      reward: { xp: 30, gold: 55 }, after: { item: 'reverse-sword-rubbing' }, outcome: '这一道反向的弧线，你记住了。'
    },
    {
      id: 'waterfall-pursuit', title: '瀑声中的追兵', region: 'waterfall', anchor: 'side2', place: '栈桥外侧', kind: 'battle', sourceIds: ['cctv-81'],
      intro: '瀑声掩住了脚步，几队追兵忽然自桥侧涌来。栈道开阔，正适合把成群的敌人一口气打散。',
      battle: fight('ambush', 4, 56, 24), reward: { xp: 30, gold: 55, herbs: 1 }, after: { item: 'waterfall-stone' }, outcome: '最后一片衣角消失在雾中，桥面重新空了下来。'
    },
    {
      id: 'gallery-bamboo-listen', title: '一段竹音', region: 'gallery', anchor: 'side1', place: '竹林小亭', kind: 'choice', sourceIds: ['cctv-dada'],
      intro: '风穿过竹节，像几声没弹完的琴音。你停下脚步，正听见水声、叶响与鸟鸣接在一处。',
      choices: [{ label: '听完这一阵风', text: '不必去寻弹奏的人，山林自己就在应答。' }, { label: '轻叩亭栏，和一声节拍', text: '短短一拍，寂静便有了回音。' }],
      reward: { xp: 30, gold: 55 }, after: { item: 'bamboo-melody' }, outcome: '你收好这一段声响，走回有阳光的小路。'
    },
    {
      id: 'gallery-blockade', title: '画廊解围', region: 'gallery', anchor: 'side2', place: '画廊溪桥', kind: 'battle', sourceIds: ['cctv-81'],
      intro: '一队巡哨封住了溪桥。击散他们，附近的人便能从桥面上往来。',
      battle: fight('crowd', 5, 64, 26), reward: { xp: 30, gold: 55, herbs: 1 }, after: { item: 'open-bridge-memory' }, outcome: '竹影落在桥上，路人又重新从你身旁走过。'
    },
    {
      id: 'baicao-leaf-letter', title: '竹叶家书', region: 'baicao', anchor: 'side1', place: '竹舍门前', kind: 'choice', sourceIds: ['cctv-dada'],
      intro: '一片竹叶压在门边的短笺上，只留一句盼人平安的话。对守谷的人而言，这比任何称号都重。',
      choices: [{ label: '替短笺挡住风', text: '好让归来的人一眼就看见。' }, { label: '轻轻合好门边的竹窗', text: '你把安稳留在原处，没有带走谁的家书。' }],
      reward: { xp: 30, gold: 55 }, after: { item: 'homecoming-leaf' }, outcome: '你只收下一片落叶作念想，家书仍留给它等着的人。'
    },
    {
      id: 'baicao-valley-guard', title: '药谷退敌', region: 'baicao', anchor: 'side2', place: '药谷小径', kind: 'battle', sourceIds: ['cctv-story', 'cctv-dada'],
      intro: '魔教散兵闯到药田边缘。你就地迎敌，把剑气收束在路面上，好叫药苗免遭踩踏。',
      battle: fight('crowd', 5, 66, 26), reward: { xp: 30, gold: 55, herbs: 2 }, after: { item: 'valley-seed' }, outcome: '路面重归安静，药田仍覆着一片青绿。'
    },
    {
      id: 'tianzi-seven-doves', title: '七羽同归', region: 'tianzi', anchor: 'side1', place: '山风汇聚处', kind: 'choice', sourceIds: ['official-finale'],
      intro: '几只灵鸽自山下飞来，在石台边先后落脚。它们曾把散在远处的人，连成一条可以彼此接应的路。',
      choices: [{ label: '看它们一同起飞', text: '羽影在云前散开，又朝同一个方向飞去。' }, { label: '给它们留出落脚的位置', text: '你退开半步，好让归来的翅膀安心落下。' }],
      reward: { xp: 30, gold: 55 }, after: { item: 'seven-feathers-memory' }, outcome: '群鸽再度飞起，远处的云慢慢散开。'
    },
    {
      id: 'tianzi-last-patrol', title: '峰口破阵', region: 'tianzi', anchor: 'side2', place: '峰口石道', kind: 'battle', sourceIds: ['official-finale'],
      intro: '敌人的巡守正集结在峰口。此处足够开阔，正好把一路练成的剑法完整施展一遍，清开通往山顶的路。',
      battle: fight('crowd', 6, 84, 30), reward: { xp: 30, gold: 55, herbs: 2 }, after: { item: 'summit-stone' }, outcome: '剑光散去，山风自通畅的石道上吹了上来。'
    }
  ];
  encounters.forEach(e => { e.adaptation = true; e.short = true; e.triggerRadius = 135; });

  const itemRows = [
    ['father-tassel', '父辈的托付', '长虹篇纪念：记下白猫交付守护麒麟使命的那一刻。', 'memory', 'tassel'],
    ['two-swords-memory', '两剑同心', '长虹与冰魄首次合璧的游历纪念。', 'memory', 'sword'],
    ['tunnel-message', '暗道示警', '客栈暗道里彼此托付、秘密救人的记忆。', 'memory', 'scroll'],
    ['medical-classic', '济世医典摘记', '穿云洞取书的纪念摘记。救治所需内容已在剧情中使用，无需送还。', 'memory', 'book'],
    ['five-swords-memory', '五剑破围', '奔雷剑加入后，五剑在宝峰湖合璧的记忆。', 'memory', 'sword'],
    ['spring-oath', '灵泉之诺', '宝玉留给灵泉。物囊里保存的，是守护山林的承诺。', 'memory', 'jade'],
    ['fire-tenth-memory', '火舞十重', '虹猫领悟火舞旋风第十层的心得纪念。', 'memory', 'flame'],
    ['seven-swords-memory', '七剑同归', '终局之后，七位真正剑主并肩的纪念。', 'memory', 'sword'],
    ['inn-keepsake', '客栈旧忆', '紫云篇纪念：莎丽不会被暗算抹去的身份。', 'memory', 'lantern'],
    ['training-sword', '木剑起式记录', '本作训练关中，左手第一次稳稳握剑的记录。剑冢之后实际佩戴独臂大侠留下的左手剑。', 'memory', 'sword'],
    ['left-hand-manual', '反手剑谱心得', '承继独臂大侠的左手剑与剑谱，在断臂山剑冢中领悟左手发力与反向剑路。', 'memory', 'book'],
    ['left-hand-mastery', '反手剑成', '莎丽完成左手剑修炼的证明。', 'memory', 'sword'],
    ['hidden-ally-memory', '暗处的接应', '为虹猫保住水帘洞练剑时机的记忆。', 'memory', 'water'],
    ['patient-blade-memory', '藏锋待时', '决战外围的坚持：最后的破局时机仍要留给真剑主。', 'memory', 'sword'],
    ['ziyun-returned', '紫云归主', '莎丽制止马三娘后取回紫云真剑的纪念。剑已绑定莎丽。', 'memory', 'sword'],
    ['palace-ribbon', '宫苑系带', '冰魄篇纪念：守护玉蟾宫与伤者的开端。', 'memory', 'ribbon'],
    ['purple-rabbit-memory', '紫兔长明灯', '记住紫兔掩护同伴的勇气。', 'memory', 'lantern'],
    ['seven-leaf-memory', '七叶花影', '药花已经用于救人，留下的花影记载着同伴的付出。', 'memory', 'flower'],
    ['snow-rescue-memory', '雪中相救', '冰沟险境中彼此不肯放手的记忆。', 'memory', 'snow'],
    ['true-companion-memory', '真心识故人', '假虹猫的伪装没有替代同伴之间的了解。', 'memory', 'jade'],
    ['doctor-notes', '神医药记', '逗逗接诊莎丽时留下的剧情纪念。', 'memory', 'book'],
    ['left-hand-promise', '左手的希望', '医者与剑主一起寻找新道路的纪念。', 'memory', 'sword'],
    ['fifth-sword-memory', '第五剑线索', '取剑故事已经完成；水火棍与奔雷剑的线索记在这里。', 'memory', 'scroll'],
    ['lightning-rescue-memory', '雷区回身', '逗逗冒险救回受伤跳跳的记忆。', 'memory', 'thunder'],
    ['tiger-cliff-memory', '虎穴取玉', '第92集三人分工取回灵泉宝玉的纪念。', 'memory', 'jade'],
    ['antidote-notes', '解毒心得', '招魂引解药的故事纪念。配药与使用已就地结算。', 'memory', 'bottle'],
    ['water-fire-staff-memory', '一棍闯江湖', '大奔初持水火棍、仗义出手的纪念。', 'memory', 'staff'],
    ['rescued-sali-memory', '后山救人', '客栈篇中找回莎丽的游历记忆。', 'memory', 'scroll'],
    ['niu-xuanfeng-memory', '牛旋风之义', '牛旋风识破骗局后舍身相救的记忆。', 'memory', 'tassel'],
    ['sober-promise', '戒酒戒赌之诺', '大奔把豪气化成担当的剧情纪念。', 'memory', 'cup'],
    ['thunder-sword-memory', '奔雷出世', '大奔取出奔雷剑，正式接下剑主使命。', 'memory', 'thunder'],
    ['hidden-message', '护法暗讯', '跳跳以护法身份暗中接应同伴的记忆。', 'memory', 'scroll'],
    ['antidote-delivery-memory', '一份真解药', '解药已经用于救治虹猫，留下的是暗中相助的记忆。', 'memory', 'bottle'],
    ['qingguang-returned', '天池青光', '跳跳从天池藏剑处取回青光剑的纪念。', 'memory', 'thunder'],
    ['qingguang-identity', '青光显身', '从魔教护法到公开站在同伴身侧的青光剑主。', 'memory', 'sword'],
    ['spring-trace', '灵泉旧迹', '达达追查宝玉失窃时的记录。', 'memory', 'water'],
    ['trust-restored', '寒洞释疑', '消除误会之后，旋风剑主与同伴重建的信任。', 'memory', 'jade'],
    ['family-keepsake', '家人牵挂', '达达的家人与责任，始终是他握剑的理由。', 'memory', 'leaf'],
    ['mother-child-board', '子母棋局', '一次关于家人与同伴、局内与局外的思索。', 'memory', 'chess'],
    ['family-reunited', '谷中团圆', '达夫人获救，旋风剑主终于解除后顾之忧。', 'memory', 'leaf'],
    ['dove-feather', '灵鸽羽毛', '顺路彩蛋留下的一片羽毛。', 'memory', 'feather'],
    ['forest-seed', '山林种子', '清开小兽退路时拾到的种子。', 'material', 'seed'],
    ['embroidered-ox', '牛像小记', '蓝兔借绣花周旋的原作趣事纪念。', 'memory', 'ribbon'],
    ['empty-message-tube', '空信筒拓记', '记录客栈暗讯意象的小小拓记。', 'memory', 'scroll'],
    ['inn-tea-token', '客栈茶意', '护住摊位后收下的一杯茶的记忆。', 'memory', 'cup'],
    ['chicken-recipe', '秘制鸡腿小记', '逗逗爱吃秘制鸡腿的原作人物彩蛋。', 'memory', 'food'],
    ['herb-pressing', '草药压叶', '晒药坪安全后留下的一片压叶。', 'material', 'leaf'],
    ['tea-instead-wine', '清茶一盏', '为大奔戒酒戒赌的成长留下纪念。', 'memory', 'cup'],
    ['six-aunt-memory', '六嫂山花', '记住六嫂的守护与托付。', 'memory', 'flower'],
    ['reverse-sword-rubbing', '反向剑痕', '顺路观察反手剑意象留下的拓片。', 'memory', 'sword'],
    ['waterfall-stone', '瀑边青石', '退敌后随手拾起的一颗光滑小石。', 'material', 'stone'],
    ['bamboo-melody', '竹音一段', '一阵风穿过竹林的游历纪念。', 'memory', 'music'],
    ['open-bridge-memory', '溪桥通行', '清开溪桥后，路人重新通行的记忆。', 'memory', 'bridge'],
    ['homecoming-leaf', '归家竹叶', '只带走一片落叶，把家书留在它等着的人身旁。', 'memory', 'leaf'],
    ['valley-seed', '药谷种子', '药谷退敌后留下的一小袋种子。', 'material', 'seed'],
    ['seven-feathers-memory', '群羽向山', '灵鸽在峰口一同起飞的纪念。', 'memory', 'feather'],
    ['summit-stone', '峰口石子', '最后一段山路被清开后拾得的小石。', 'material', 'stone']
  ];
  const items = itemRows.map(([id, name, description, type, icon]) => ({ id, name, description, type, icon }));

  const lifePlaces = [
    ['forest', '西海山路茶棚', 'tea', 'camp', '挑担茶客', '松风穿过棚檐，炉上的水恰在滚头上。', '山路上常有药商来往；草叶间留下的蓝线，一路连到岩边那只竹篮。', '蓝绳药囊', '湿草上挂着几根蓝线，岩边竹篮里透出淡淡药香。', ['岩边竹篮', '桥下木桶', '路旁铁匣'], 0],
    ['yuchan', '听泉茶席', 'tea', 'waterside', '守席宫人', '桃花落在石案边，泉水新沏了一壶春茶。', '失物就在荷池一带；绣白花的帕子与那只花篮放在一处。', '绣帕小包', '荷叶边散着花瓣；走近花篮，能看见露出来的一线白绣。', ['亭中木箱', '荷池花篮', '桥头竹筒'], 1],
    ['inn', '金鞭溪歇脚处', 'inn', 'market', '溪畔掌柜', '溪桥旁留着一桌热饭。客栈的旧事之外，行旅都在这儿歇脚。', '商队的账册遭过雨；带油纸的那只货篓，最是避雨。', '商队账册', '地上散着几片纸角，檐下货篓裹着一层防雨的油纸。', ['桥下水桶', '灶旁柴堆', '檐下货篓'], 2],
    ['liuqige', '六奇阁药茶席', 'tea', 'camp', '晒药人', '药香与茶香混在一处，竹匾上的草叶正慢慢转干。', '晒药的铜秤上还留着药粉气；系秤的细绳一道拖痕，直通晾架底下。', '晒药铜秤', '地上撒着少许药粉，系秤的细绳一直拖到晾架底下。', ['晾架下竹匾', '门边米缸', '井旁木盆'], 0],
    ['leizhuang', '快活林酒肆', 'wine', 'market', '酒肆掌柜', '旧庄外灯火尚暖，席上既有酒，也常备着一壶清茶。', '赶车人失落了路引；把纸塞进茶罐，是本地避雨的老法子。', '赶车路引', '车轮痕旁留了半张封纸，茶罐口系着一样的红绳。', ['酒窖木桶', '柜边茶罐', '门口石槽'], 1],
    ['waterfall', '飞瀑歇脚棚', 'tea', 'camp', '栈道守棚人', '瀑声隔开了远处的喧闹，棚里还留着几张干爽的坐席。', '过瀑的旅客总把行李挂高；麻绳的磨痕就停在棚梁边。', '旅人行囊', '泥地上没有翻找的痕迹，棚梁挂钩上却缠着一截麻绳。', ['溪中石穴', '脚边草堆', '棚梁挂钩'], 2],
    ['gallery', '竹间琴茶', 'tea', 'waterside', '竹林茶客', '一段琴音自竹影深处传来，茶博士把杯盏放轻了些。', '送信人夹在琴谱里的家书，多半还在收琴的那只竹盒中。', '夹谱家书', '竹盒边落着一页残谱，缝里能看见信封上的封蜡。', ['石桌竹盒', '岸边鱼篓', '门外陶瓮'], 0],
    ['baicao', '百草谷茶圃', 'tea', 'workshop', '护圃人', '草木还挂着露水，谷中人招呼你先坐下喝一盏。', '育苗的记录用青布包着；苗架边那只小匣，最不容易沾泥。', '育苗札记', '一角青布卡在苗架边，木匣底下还垫着干竹叶。', ['泉边石罐', '苗架木匣', '桥下竹篮'], 1],
    ['tianzi', '云脚茶棚', 'tea', 'camp', '山口茶客', '云海卷过山口，茶棚里的炭火把湿衣一点点烘干。', '上山的商队靠风铃认路；失落的那只铜铃，应在背风的地方。', '商队铜铃', '断绳在风口晃着，避风石后的布袋里传出一声轻响。', ['山口空桶', '树上旧巢', '避风石后布袋'], 2]
  ].map(([region,name,venue,anchor,host,description,intel,lostItem,clue,options,answer])=>({id:'rest-'+region,region,name,venue,anchor,host,description,intel,lostItem,clue,options,answer,sourceIds:region==='leizhuang'?['cctv-61']:region==='inn'?['cctv-11']:[],adapted:true}));
  // minStep / maxStep refer to completed chapters in THIS protagonist's biography.
  // Hidden identities and Sali's solitary sword-tomb period remain unavailable for public travel.
  const companionWindows = {
    hongmao: [{id:'lantu',minStep:1,note:'玉蟾宫相救后'}, {id:'doudou',minStep:3,note:'客栈脱险、会合神医后'}, {id:'daben',minStep:5,note:'孤岛五剑后'}, {id:'tiaotiao',minStep:6,note:'六剑相认、灵泉风波之后'}, {id:'dada',minStep:6,note:'灵泉误会解除后'}, {id:'sali',minStep:8,note:'紫云归主之后'}],
    lantu: [{id:'hongmao',minStep:1,note:'长虹伤愈、两剑并肩时'}, {id:'doudou',minStep:3,note:'救出莎丽、会合神医后'}, {id:'daben',minStep:6,note:'奔雷出世之后'}, {id:'tiaotiao',minStep:7,note:'真伪之局解除后'}, {id:'dada',minStep:7,note:'真伪之局解除后'}, {id:'sali',minStep:8,note:'紫云归主之后'}],
    sali: [{id:'lantu',minStep:1,maxStep:1,note:'六奇阁休养时'}, {id:'doudou',minStep:1,maxStep:2,note:'六奇阁重练与护送前'}, {id:'daben',minStep:2,maxStep:2,weapon:'staff',note:'天险护送这一幕'}, ...['hongmao','lantu','doudou','daben','tiaotiao','dada'].map(id=>({id,minStep:8,note:'紫云归主、重聚之后'}))],
    doudou: [{id:'hongmao',minStep:1,note:'决定同取医典后'}, {id:'lantu',minStep:3,note:'莎丽重新握剑之后'}, {id:'daben',minStep:4,note:'奔雷取剑之后'}, {id:'tiaotiao',minStep:5,note:'雷区救回青光剑主后'}, {id:'dada',minStep:6,note:'取回灵泉宝玉后'}, {id:'sali',minStep:8,note:'紫云归主之后'}],
    daben: [{id:'hongmao',minStep:1,maxStep:2,note:'玉蟾宫结识、客栈相助时'}, {id:'lantu',minStep:1,maxStep:2,note:'玉蟾宫结识、客栈相助时'}, {id:'lantu',minStep:5,note:'奔雷出世之后'}, {id:'hongmao',minStep:6,note:'五剑破浪之后'}, {id:'doudou',minStep:4,note:'六嫂托付、取剑之时'}, {id:'tiaotiao',minStep:7,note:'七剑解除控制后'}, {id:'dada',minStep:7,note:'七剑解除控制后'}, {id:'sali',minStep:8,note:'紫云归主之后'}],
    tiaotiao: [...['hongmao','lantu','doudou','daben'].map(id=>({id,minStep:5,note:'雷区显身、六剑相认后'})), {id:'dada',minStep:7,note:'看破伪装之后'}, {id:'sali',minStep:8,note:'紫云归主之后'}],
    dada: [...['hongmao','lantu','doudou','daben','tiaotiao'].map(id=>({id,minStep:7,note:'家人归来、解除牵制后'})), {id:'sali',minStep:8,note:'紫云归主之后'}]
  };
  const life = {
    version:1, places:lifePlaces, companionWindows,
    interludes:{
      'hongmao-01':'伤后疗养、与蓝兔相认，是下一段故事的开端。先把父亲留下的剑穗收好，歇一会儿，再去看看玉蟾宫的情势。',
      'hongmao-02':'紫兔的托付仍在心上。出宫之后，可与蓝兔交换消息、整理行囊，再去查访客栈里的第三剑。',
      'hongmao-03':'跳跳已带莎丽去求医。暗道中的线索先记清，再与同伴商议救治之法；医典的事，稍后再往前推。',
      'hongmao-04':'真正的医典已经到手。莎丽得了救治，同伴也各自调息，这一路总算有了片刻喘息；茶席上还能重温这一幕。',
      'hongmao-05':'五剑冲出了湖上封锁，大奔终于与众人相聚。且坐下把沿途见闻说一说，再继续寻访散落的剑主。',
      'daben-03':'护送里的失手，与失去的人，都得慢慢面对。此刻不妨独自喝一盏清茶，等愿意听了，再去想六嫂说过的话。',
      'daben-05':'奔雷剑既已出世，戒酒的承诺也一并记在心里。酒肆里备着清茶，先与同伴坐一会儿，再去赴孤岛之约。',
      'sali-03':'天险之后，修习转入独行的一程。歇脚、察看剑痕、整理所学，都随你自己的节奏。',
      'sali-04':'左手剑与剑谱已在手中。先记牢剑冢所见，再定何时修习反手剑；此段仍不公开结伴。',
      'dada-03':'误会方解，家人的危机又已逼近。这一段路须独自走；可先在茶棚听听近况，再去探家人的处境。',
      'dada-07':'家人与同伴都回来了。此刻终于可以放心邀一两位故人同行，坐下喝一盏茶，再定何时前去会合。'
    },
    adaptationNote:'歇脚席、新掌柜、委托、山贼与席间对白为游戏原创串场；同行开放参照本角色已历的原著关系与当前处境。主线事件仍以章节出处为准。',
    socialNote:'这是与剧情同伴同行的单人江湖。酒肆可以茶代酒；大奔悔悟后守戒，逗逗不设置酒量数值。',
    commissionKinds:[{id:'escort',name:'护商',title:'护商过境',anchor:'market',count:18,profile:'rescue',gold:115,xp:90,description:'一支小商队被流寇拦在本区路口。挡下这一股拦路的人，商队当场付清护送钱。'}, {id:'clear',name:'清寨',title:'清开山道',anchor:'lookout',count:24,profile:'ambush',gold:155,xp:120,description:'山道边有一小股匪众在收买路钱。清了这处据点，附近乡亲自会送来酬银。'}, {id:'find',name:'寻物',title:'寻回失物',anchor:'herb',count:0,gold:85,xp:65,description:'看一看本区失物附近的痕迹，辨出东西落在何处。物主就在近旁，找到便可交差。'}],
    patrolCooldownMs:20000, retreatCooldownMs:8000,
    services:[{id:'tea',name:'清茶一盏',price:12,energy:20,herbs:0,activity:'tea',description:'歇一口气，听听本区消息；下场实战起手剑意至少 20。'}, {id:'meal',name:'热饭与干粮',price:28,energy:0,herbs:1,activity:'meal',description:'席上吃饱，再往药囊里添一份回春散。'}, {id:'feast',name:'请同伴吃茶饭',price:52,energy:30,herbs:2,activity:'meal',description:'一桌茶饭，外加两份回春散；下场实战起手剑意至少 30。'}, {id:'wine',name:'小酌叙旧',price:16,energy:20,herbs:0,activity:'wine',description:'酒肆围坐，清茶同席；下场实战起手剑意至少 20。'}]
  };

  window.CANON_DATA = {
    version: 11,
    adaptationNote: '按2006年《虹猫蓝兔七侠传》主要人物经历选编。对白为游戏改编或剧情旁白，非原片逐字实录。战斗人数和玩法为游戏编排；每章实景名称见章题，现有九区用于承载章节，不代表原著精确地理。章节结束后可歇脚闲谈或自行接续，物品就地结算。',
    encounterNote: '顺路彩蛋皆依据原作人物与意象自由改编，每处就地完成一次；不须交付，不须重复刷取，也无往返跑图。',
    sources, heroes, encounters, items, life
  };
})();
