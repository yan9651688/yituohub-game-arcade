/* 人物、剑名、地名参照动画；平行剧情、地图路径与全部战斗机制为本作原创。 */
window.GAME_DATA = {
  storyTitle: '七剑 · 山河一诺',
  worldNote: '以《虹猫蓝兔七侠传》人物、七剑与张家界山水为基础的平行冒险。封山令、剑印、事件分支及战斗招式为本作原创；人物以各自已经掌握佩剑的状态登场，不按动画集数重演剧情。大地图是游历示意，方位、距离与道路并非官方地理设定。',
  prologue: '魔教封山，灵鸽断讯。黑心虎的爪牙沿溪布下暗哨，山中生灵无处可逃。你收到一封没有署名的急信：七侠须在天子山会合，重现七剑之光。先去西海峰林吧——晨雾深处，已有第一声剑鸣。',
  heroes: [
    {
      id: 'hongmao', name: '虹猫', sword: '长虹剑', color: '#ea9462', animal: '猫',
      tagline: '长虹照夜，赤子护山河',
      desc: '长虹剑传人。承父辈守护森林的心愿，以果敢与担当连接七侠。适合主动迎敌，用火斩持续压制。',
      passive: '赤诚剑心：普通攻击附带灼烧。',
      skillName: '长虹剑法', skillDesc: '以长虹剑斩出火色剑气，对敌人造成伤害并附加灼烧。',
      ultName: '长虹贯日', ultDesc: '蓄势后向前贯穿一道长虹剑气，剑锋命中时迸开金白日轮。',
      finisherName: '火舞旋风', finisherDesc: '随主线领悟后以 F 独立施展的高消耗杀招。',
      hp: 132, attack: 23, speed: 232, startLocation: 'forest',
      quote: '这片山林，还有许多等着明天的生命。'
    },
    {
      id: 'lantu', name: '蓝兔', sword: '冰魄剑', color: '#8dd5e7', animal: '兔',
      tagline: '冰魄为锋，温柔亦有千钧',
      desc: '玉蟾宫宫主、冰魄剑传人。心怀善意，也有独当危局的决断。以寒气控制敌人，擅长周旋。',
      passive: '凝霜剑意：普通攻击令敌人短暂减速。',
      skillName: '冰魄环舞', skillDesc: '释放环身冰魄剑气，伤害周围敌人并大幅减慢其移动。',
      ultName: '冰天雪舞', ultDesc: '起手冻结周围敌人，冰域随后持续造成 8 次伤害并减缓敌人的攻势。',
      hp: 125, attack: 21, speed: 232, startLocation: 'forest',
      quote: '只要还能护住一人，这一剑就值得。'
    },
    {
      id: 'sali', name: '莎丽', sword: '紫云剑', color: '#c8a2ec', animal: '松鼠',
      tagline: '紫云不折，逆境重开锋芒',
      desc: '金鞭溪客栈老板娘、紫云剑传人。历经伤痛仍练成左手剑法。身法灵巧，以密集连斩寻找破绽。',
      passive: '不屈紫锋：出剑迅速，每第三次普通攻击强化。',
      skillName: '紫影三叠', skillDesc: '连续斩出三道紫色剑影，快速追击身前敌人。',
      ultName: '紫云千影', ultDesc: '向周围连续释放八次剑影，打出密集的范围连击。',
      hp: 116, attack: 21, speed: 250, startLocation: 'forest',
      quote: '握剑的手可以改变，心里的路不会。'
    },
    {
      id: 'doudou', name: '逗逗', sword: '雨花剑', color: '#91c88e', animal: '狗',
      tagline: '一剑济世，药香也有锋芒',
      desc: '居于六奇阁的神医、雨花剑传人。嘴上怕麻烦，遇见伤者总会停步。以雨花持续御敌，为身边同伴提供小额范围治疗。',
      passive: '济世医心：普攻命中时，为自身周围 180 范围内的存活友方恢复各自最大气血的 0.6%（含自身），每 0.9 秒至多触发一次。',
      skillName: '雨花春生', skillDesc: '雨花持续御敌；范围内存活友方起手恢复各自最大气血的 2%，随后 4 跳、每跳 1%。包含自身，离开区域停止恢复。',
      ultName: '万物回春', ultDesc: '雨花剑阵持续造成 8 次范围伤害；范围内存活友方起手恢复各自最大气血的 2%，随后 8 跳、每跳 1.1%。包含自身，离开区域停止恢复。',
      hp: 132, attack: 18, speed: 220, startLocation: 'forest',
      quote: '先别说谢，平平安安回来再说。'
    },
    {
      id: 'daben', name: '大奔', sword: '奔雷剑', color: '#e7c069', animal: '白熊',
      tagline: '奔雷在手，豪气直破重围',
      desc: '奔雷剑传人，快活林长大的豪爽侠客。重情重义，愿为同伴挡在最前。出手厚重，耐久出众。',
      passive: '铁骨侠胆：受到的伤害降低 15%。',
      skillName: '奔雷震岳', skillDesc: '震击地面，对周围敌人造成伤害，并获得 5 秒减伤。',
      ultName: '雷动九霄', ultDesc: '在出招处连续引落三次白金雷击，细电弧接地扩散，重击成群敌人。',
      hp: 150, attack: 24, speed: 204, startLocation: 'forest',
      quote: '这条路，我来开。你们放心往前！'
    },
    {
      id: 'tiaotiao', name: '跳跳', sword: '青光剑', color: '#70c9b7', animal: '猴',
      tagline: '藏锋十载，青光一瞬破局',
      desc: '青光剑传人，曾以魔教护法身份暗中相助七侠。机敏隐忍，精于身法与情报。靠突进与闪避穿梭敌阵。',
      passive: '踏影无痕：闪避冷却更短，闪避路径也能伤敌。',
      skillName: '青光掠影', skillDesc: '沿前方快速突进，穿透并斩击路径上的敌人。',
      ultName: '碧落七闪', ultDesc: '连续闪向周围敌人展开追击，以高速剑击切开包围。',
      hp: 116, attack: 21, speed: 258, startLocation: 'forest',
      quote: '有些路，藏在敌人以为安全的地方。'
    },
    {
      id: 'dada', name: '达达', sword: '旋风剑', color: '#b3cd9f', animal: '熊猫',
      tagline: '竹韵入剑，长风守一方天地',
      desc: '百草谷谷主、旋风剑传人。珍爱家人与山林，琴心映着剑胆。以风场牵制，擅长在移动中持续输出。',
      passive: '竹海听风：每四次普通攻击发出一道穿透风刃。',
      skillName: '旋风剑阵', skillDesc: '短弧风刃在施招处回旋，持续牵制并伤害范围内敌人。',
      ultName: '长风万里', ultDesc: '随身风域持续展开，八轮琴针独立索敌；单敌汇聚、多敌分击，飞行中追踪并在目标倒下后改选。',
      hp: 130, attack: 21, speed: 230, startLocation: 'forest',
      quote: '愿这曲终了，山里的风仍是从前的风。'
    }
  ],
  locations: [
    {
      id: 'forest', name: '西海峰林', x: 20, y: 73, biome: 'forest', kicker: '风起 · 第一声剑鸣',
      description: '千峰自云海中探出，旧栈道隐入苍翠。', danger: 1,
      connections: ['yuchan', 'inn'], hero: 'hongmao',
      speaker: '虹猫',
      intro: '山风送来焦木的气味。虹猫正护着几只受惊的小兽退向石隙，栈道另一端的魔教斥候已举起信号火。“先截住他们，别让麒麟的去向传出去。”',
      selfSpeaker: '山中急信',
      selfIntro: '这是你熟悉的峰林。断枝指向麒麟隐去的石隙，魔教斥候却已在栈道上举起信号火。你收好父亲留下的剑穗，决定先替林中的生灵截下这道追令。',
      choices: [
        { label: '拔剑截住斥候', detail: '清开栈道，夺下传讯火筒。', kind: 'battle', battleMod: 'normal', reward: { gold: 24, xp: 42, virtue: 1 }, text: '最后一簇信号火落入溪涧。小兽们钻进深林，远处灵鸽振翅而起，送来一条通往玉蟾宫的消息。长虹剑印回应了你的决心。' },
        { label: '沿旧岩隙引开追兵', detail: '虹猫专属：凭熟悉山路护送生灵转移。', hero: 'hongmao', kind: 'peace', reward: { gold: 16, xp: 42, virtue: 3, herbs: 1 }, text: '你在旧岩隙留下几道足迹，再从藤桥折回。追兵奔向空谷，麒麟的蹄声早已消失在安全的林间。天边有一只灵鸽掠向玉蟾宫。' }
      ],
      reward: { gold: 18, xp: 20 },
      lore: '西海峰林取自原作的山林意象与虹猫身世关联；本关的截讯与护送事件为原创。', canon: true
    },
    {
      id: 'yuchan', name: '玉蟾宫', x: 22, y: 27, biome: 'palace', kicker: '冰月 · 荷池风紧',
      description: '白墙映着荷影，远峰托起一轮清月。', danger: 2,
      connections: ['forest', 'liuqige'], hero: 'lantu', speaker: '蓝兔',
      intro: '宫前荷池被铁索截断。猪无戒带人占住渡桥，要以断水逼宫中交出山民。蓝兔立在石阶上，衣袖被风吹得笔直：“守住后门的人已经安排好了，桥上交给我们。”',
      selfSpeaker: '宫中传讯',
      selfIntro: '守门弟子递来急报：猪无戒已锁住荷池渡桥，准备断去宫中水路。你让山民从后苑撤离，提起冰魄剑走下石阶。自己的家门，该由自己守住。',
      choices: [
        { label: '正面迎战猪无戒', detail: '首领战：留意冲撞与远处投来的暗器。', kind: 'battle', battleMod: 'guard', reward: { gold: 40, xp: 62, virtue: 2 }, text: '猪无戒狼狈退走，荷池上的铁索轰然坠落。清水重新穿过石桥，宫门为山民敞开。冰魄剑印亮起，灵鸽带来了金鞭溪的求援。' },
        { label: '踏荷绕至桥侧', detail: '蓝兔专属：利用熟悉的水榭位置出击。', hero: 'lantu', kind: 'battle', battleMod: 'ambush', reward: { gold: 40, xp: 68, virtue: 2 }, text: '一抹冰蓝掠过荷叶。你从桥侧破开防守，将猪无戒逐出宫门。弟子们点起水榭的灯，一盏盏照亮了山民下山的路。' }
      ],
      boss: { name: '猪无戒', kind: 'boar' }, reward: { gold: 24, xp: 26 },
      lore: '玉蟾宫与宫主蓝兔、魔教围宫均见央视原作剧情介绍。本关“断水封桥”为平行事件。', canon: true
    },
    {
      id: 'inn', name: '金鞭溪客栈', x: 42, y: 62, biome: 'inn', kicker: '紫云 · 灯下辨真心',
      description: '一溪绕过红木小楼，风灯照着往来的侠客。', danger: 3,
      connections: ['forest', 'liuqige', 'leizhuang'], hero: 'sali', speaker: '莎丽',
      intro: '客栈窗纸上多了一道陌生的掌印。莎丽把账簿翻到空白页，左手写下“后院有诈”。马三娘已替魔教布好包围，正笑着催你入席。屋梁上，细细的引线微微晃动。',
      selfSpeaker: '客栈旧账',
      selfIntro: '你一进门便发现，账簿被人动过，常开的后窗也被钉死。马三娘借着歇脚客的身份在后院布伏。你握紧左手的紫云剑：这一次，客栈里的每一盏灯都要平安留到天亮。',
      choices: [
        { label: '挑断引线，当面揭局', detail: '首领战：应对马三娘的突刺与毒雾。', kind: 'battle', battleMod: 'normal', reward: { gold: 50, xp: 82, virtue: 2 }, text: '剑光割断屋梁上的引线。马三娘的伪装与伏兵一同败露，客人们顺着溪边撤走。旧账簿被重新放回柜台，紫云剑印照亮了纸页。' },
        { label: '从熟悉的后厨反击', detail: '莎丽专属：绕开圈套，先截断退路。', hero: 'sali', kind: 'battle', battleMod: 'ambush', reward: { gold: 50, xp: 88, virtue: 2, herbs: 1 }, text: '你轻轻推开米缸后的暗门，从伏兵背后现身。马三娘的算盘终于落空。战后，你亲手扶正客栈招牌——金鞭溪的灯火，还由你来照看。' }
      ],
      boss: { name: '马三娘', kind: 'assassin' }, reward: { gold: 28, xp: 30 },
      lore: '莎丽是紫云剑传人、金鞭溪客栈老板娘。原作有马三娘冒充剑主、客栈暗道与莎丽左手剑的情节；本关为重新编写的破局事件。', canon: true
    },
    {
      id: 'liuqige', name: '六奇阁', x: 48, y: 24, biome: 'temple', kicker: '雨花 · 医者的一步',
      description: '药香越过檐角，云中的小观守着一炉春意。', danger: 3,
      connections: ['yuchan', 'inn', 'waterfall', 'tianzi'], hero: 'doudou', speaker: '逗逗',
      intro: '六奇阁门外摆满空药箱。逗逗正给伤者包扎，一张截药令压在桌角：“有人封住了送药山道。这些人今晚还等着药，我这就算把自己分成七个，也得有人去开路！”',
      selfSpeaker: '六奇阁药记',
      selfIntro: '病榻上有人睡着，有人仍在等药。你翻遍药柜，最后一包药材也已用尽。山道被魔教封锁，送药的挑夫迟迟未归。你合上药记，背起药箱，把雨花剑系紧。',
      choices: [
        { label: '夺回被截的药车', detail: '清除封路守卫，让药材进山。', kind: 'battle', battleMod: 'guard', reward: { gold: 34, xp: 76, herbs: 3, virtue: 2 }, text: '药车的木轮重新转动，山风里终于飘来药香。逗逗留下的医嘱送到了每位伤者手里，雨花剑印与同伴们的光芒相应。' },
        { label: '用草木气味辨认药车', detail: '逗逗专属：寻到无人看守的旧药径。', hero: 'doudou', kind: 'peace', reward: { gold: 20, xp: 76, herbs: 4, virtue: 3 }, text: '你辨出车辙里熟悉的药香，带挑夫沿旧药径绕过封锁。待追兵发现空车，药罐已经在六奇阁的小炉上咕嘟作响。' }
      ],
      reward: { gold: 22, xp: 28 },
      lore: '央视第37至40集剧情介绍明确六奇阁是逗逗所在的道观，并记有其求医典救治同伴的情节。本关药车事件原创。', canon: true
    },
    {
      id: 'leizhuang', name: '快活林·奔雷旧庄', x: 62, y: 75, biome: 'village', kicker: '奔雷 · 旧门不倒',
      description: '林间木舍尚暖，旧庄石阶上青苔如故。', danger: 4,
      connections: ['inn', 'waterfall', 'gallery'], hero: 'daben', speaker: '大奔',
      intro: '魔教把抢来的粮车堆在旧庄石阶下，还在林中架起拒马。大奔拍了拍一扇摇摇欲坠的木门：“门坏了还能修，大家若饿着肚子，这山可怎么守？跟我把粮食抢回来！”',
      selfSpeaker: '快活林乡亲',
      selfIntro: '乡亲们把半碗热茶推到你面前，说粮车全被扣在旧庄外。你望了一眼熟悉的石阶，放下茶碗。奔雷剑的分量沉在掌心，你知道这回该为谁使劲。',
      choices: [
        { label: '冲破拒马，夺回粮车', detail: '正面迎击重甲守卫，留意蓄力重击。', kind: 'battle', battleMod: 'guard', reward: { gold: 44, xp: 98, virtue: 2 }, text: '拒马翻倒，粮车驶回林间。乡亲们重新挂好木门，在门边给七侠留下一盏茶。奔雷剑印亮起，厚重得像一个可靠的承诺。' },
        { label: '抬开旧石梁，另辟粮道', detail: '大奔专属：沿旧庄内径将粮车送走。', hero: 'daben', kind: 'peace', reward: { gold: 28, xp: 98, virtue: 3, herbs: 1 }, text: '你托起挡路的石梁，让乡亲们把粮车一辆辆推出内径。最后一只车轮过去，你才长长舒了口气。那碗热茶还在门边等你。' }
      ],
      reward: { gold: 26, xp: 34 },
      lore: '快活林是大奔的重要活动地点。央视第63集以陵园指向“奔雷山庄”；本作将其画为林中旧址，粮道和村落细节为原创。', canon: true
    },
    {
      id: 'waterfall', name: '天悬白练', x: 67, y: 44, biome: 'waterfall', kicker: '青光 · 瀑声藏锋',
      description: '飞瀑悬空如一道白练，水幕后藏着未寄出的讯息。', danger: 5,
      connections: ['liuqige', 'leizhuang', 'gallery', 'baicao'], hero: 'tiaotiao', speaker: '跳跳',
      intro: '跳跳把一枚湿透的鹰符抛给你。瀑声盖住他的笑：“封山令上写着七处暗哨，真正的总哨却藏在水幕后。要是连这点小把戏都看不穿，我那些年可就白待了。”',
      selfSpeaker: '鹰符密令',
      selfIntro: '熟悉的鹰符又出现在瀑边。你一眼认出，所谓搜山只是幌子，水幕后才是传递密令的总哨。远处黑衣人的脚步近了，你把青光剑隐入袖影，准备收回这条暗线。',
      choices: [
        { label: '闯入水幕后的总哨', detail: '追击轻装刺客，截下真正的封山令。', kind: 'battle', battleMod: 'ambush', reward: { gold: 48, xp: 112, virtue: 1 }, text: '总哨的火盆熄了，尚未发出的密令尽落你手。水声把脚步冲散，青光剑印在飞沫中亮起。信上最后的箭头，指向十里画廊。' },
        { label: '换令调走总哨', detail: '跳跳专属：用护法的暗号截断敌方消息。', hero: 'tiaotiao', kind: 'peace', reward: { gold: 42, xp: 112, virtue: 2 }, text: '你将真假两道命令换过位置。哨兵们互看一眼，匆匆撤向空谷。你在未发出的封山图上划了一笔，留给同伴的是一条真正能走的路。' }
      ],
      reward: { gold: 28, xp: 38 },
      lore: '天悬白练是与青光剑主跳跳相关的原作地点。本关鹰符、总哨与换令行动为原创；跳跳卧底魔教的身份沿用原作。', canon: true
    },
    {
      id: 'gallery', name: '十里画廊', x: 82, y: 64, biome: 'bamboo', kicker: '危局 · 一水连青山',
      description: '奇峰随溪而转，竹影在清流上铺成一幅画卷。', danger: 6,
      connections: ['leizhuang', 'waterfall', 'baicao', 'tianzi'], hero: null, speaker: '黑小虎',
      intro: '溪流忽然变浑。黑小虎立在上游石堰，身后的人正把滚木推向河道：“你们救得了一处，救得了整座山吗？”更下游，山民的小船还没靠岸。',
      choices: [
        { label: '迎战黑小虎，守住石堰', detail: '首领战：避开掌波，趁蓄力空隙进攻。', kind: 'battle', battleMod: 'guard', reward: { gold: 62, xp: 152, virtue: 3 }, text: '黑小虎退向山路，滚木被一一推回岸边。清流重新穿过竹影，渡船平稳地靠上浅滩。护船的水路重新畅通，山民们沿溪回家；百草谷与天子山仍在前方等你。' },
        { label: '沿溪石逼近，切断后援', detail: '先从侧翼出手，迫使黑小虎离开石堰。', kind: 'battle', battleMod: 'ambush', reward: { gold: 68, xp: 152, virtue: 2 }, text: '侧翼的旗帜先倒了。黑小虎回身迎战，没能再命人放下滚木。战后山风吹散浊浪，竹筏载着最后一户山民驶进安全的湾口。' }
      ],
      boss: { name: '黑小虎', kind: 'tiger' }, reward: { gold: 38, xp: 46 },
      lore: '原作后段在十里画廊展开，并将灵泉、竹林与环境安危联系起来。本关石堰与护船之战为原创，并非原作场面的逐集复现。', canon: true
    },
    {
      id: 'baicao', name: '百草谷', x: 84, y: 26, biome: 'garden', kicker: '旋风 · 琴心守谷',
      description: '药草沾着晨露，竹舍琴音与山鸟相和。', danger: 6,
      connections: ['waterfall', 'gallery', 'tianzi'], hero: 'dada', speaker: '达达',
      intro: '谷里没有鸟鸣。达达合上琴匣，望着被烟灰染黑的竹叶：“他们把谷口堵住，想用浓烟逼出麒麟。先让风重新流进来，山里的生灵才有地方躲。”',
      selfSpeaker: '百草谷家书',
      selfIntro: '一封家书被压在琴匣上，只写着“谷中平安，勿念”。你却听见风声断在谷口，看见竹叶落着烟灰。你将书信收好，提剑去打开这扇山林的门。',
      choices: [
        { label: '击退谷口焚林队', detail: '在浓烟扩散前清除谷口守军。', kind: 'battle', battleMod: 'guard', reward: { gold: 56, xp: 136, herbs: 3, virtue: 3 }, text: '谷口重获畅通，潮湿的山风吹熄余火。鸟鸣从一枝传向另一枝，旋风剑印映出竹叶的青色。远处峰顶已有同伴的信灯，七剑离重聚又近了一步。' },
        { label: '借谷中风道引烟入空谷', detail: '达达专属：凭熟悉的地势护住谷中生灵。', hero: 'dada', kind: 'peace', reward: { gold: 32, xp: 136, herbs: 4, virtue: 4 }, text: '你解开旧风道的竹闸，让湿润山风涌进谷口。浓烟被带向无人空谷，守军失了依仗，弃火退走。第一声鸟鸣落在琴弦上，清亮得像家人的回答。' }
      ],
      reward: { gold: 32, xp: 42 },
      lore: '央视第89集剧情介绍称达达为百草谷谷主，并提及草木凋零对环境与家人的影响。本关焚林、风道与家书为原创。', canon: true
    },
    {
      id: 'tianzi', name: '天子山', x: 55, y: 9, biome: 'summit', kicker: '终章 · 七剑照山河',
      description: '云海翻涌，群峰在天光里汇成一道剑脊。', danger: 8,
      connections: ['liuqige', 'gallery', 'baicao'], hero: null, speaker: '黑心虎',
      intro: '七道剑印同时发亮。云海另一端，黑心虎踏碎峰顶石阶，身后是被截住去路的麒麟。你听见同伴一一拔剑的声音。所有走过的山路，都通向此刻。',
      choices: [
        { label: '七侠并肩，迎战黑心虎', detail: '最终首领战：集齐七剑后，可蓄满合璧之力。', kind: 'battle', battleMod: 'normal', reward: { gold: 120, xp: 240, virtue: 5 }, text: '七色剑光穿开云海。黑心虎的掌势终于崩散，麒麟跃过峰顶，奔向仍在生长的森林。你看见同伴们站在晨光里：有人笑，有人悄悄松开攥紧的手。山下炊烟升起，这一回，是人家的灶火。' }
      ],
      boss: { name: '黑心虎', kind: 'tiger' }, reward: { gold: 80, xp: 100 },
      lore: '天子山是原作出现的张家界景点。七侠守护麒麟、七剑合璧对抗黑心虎沿用原作核心；将本次决战设在这里，以及战斗流程与结局文字，均为原创编排。', canon: true
    }
  ],
  sideEvents: [
    {
      id: 'forest_pigeon', location: 'forest', title: '灵鸽折翼', speaker: '林间小事',
      text: '一只灵鸽蜷在松根旁，脚上的信筒被藤丝缠住。它仍想振翅，却只能扑起一点落叶。',
      choices: [
        { label: '取药替它包扎', detail: '消耗 1 份草药；获得侠义与阅历。', cost: { herbs: 1 }, reward: { gold: 0, xp: 24, virtue: 3, herbs: 0 }, text: '灵鸽安静下来，终于肯靠着你的掌心歇息。信筒里是一张画着山民避难处的小图。你记下位置，把它放回松枝间。' },
        { label: '用软草做一只小窝', detail: '细心照料，无需物资。', reward: { gold: 0, xp: 14, virtue: 2, herbs: 0 }, text: '你在避风处垫好软草，替它解开信筒。离开时，身后响起很轻的一声咕咕。' },
        { label: '吹响熟悉的鸽哨', detail: '虹猫专属：唤来同伴照应它。', hero: 'hongmao', reward: { gold: 8, xp: 28, virtue: 3, herbs: 1 }, text: '哨声穿过林冠，两只灵鸽很快落到枝头。受伤的那只抬起头，也轻轻回应。它不必独自留在这里了。' }
      ]
    },
    {
      id: 'forest_stone', location: 'forest', title: '半块旧路碑', speaker: '挑柴老人',
      text: '“年轻人，这碑倒了以后，已经有三个赶路人走进死谷。”老人试着扶碑，手上的麻绳却又断了一股。',
      choices: [
        { label: '一起把路碑扶正', detail: '留下清楚的山路指引。', reward: { gold: 12, xp: 18, virtue: 2, herbs: 0 }, text: '你与老人合力扶正石碑，又用炭枝补上箭头。老人递来一小袋干粮，说这是山里人的路费。' },
        { label: '为他换一根新绳', detail: '花费 10 铜钱，另得采药人的谢礼。', cost: { gold: 10 }, reward: { gold: 0, xp: 16, virtue: 1, herbs: 2 }, text: '新绳拉紧，碑身稳稳落回土里。路过的采药人从背篓里抓出两份药草，请你留作急用。' }
      ]
    },
    {
      id: 'yuchan_lantern', location: 'yuchan', title: '荷灯未熄', speaker: '守灯弟子',
      text: '荷池中心还漂着最后一盏引路灯。灯座卡在残桥下，几名山民正等着那一点光辨认夜渡的方向。',
      choices: [
        { label: '沿岸牵绳取灯', detail: '稳妥地把灯引回渡口。', reward: { gold: 16, xp: 24, virtue: 2, herbs: 0 }, text: '你用长绳勾住灯座，缓缓牵回岸边。灯重新挂上渡口，水面上有人远远挥手。' },
        { label: '踏过池中的隐石', detail: '蓝兔专属：从熟悉的水路护送夜渡。', hero: 'lantu', reward: { gold: 20, xp: 32, virtue: 3, herbs: 1 }, text: '你熟知每块隐石的位置，提着荷灯走到水中央。身后的山民跟随你的脚步，平稳地渡过了这一夜。' }
      ]
    },
    {
      id: 'yuchan_ribbon', location: 'yuchan', title: '系在剑鞘上的丝带', speaker: '小弟子',
      text: '一个小弟子攥着七段颜色不同的丝带：“我还不会使剑，可我想让你们在山上也记得，这里一直有人等着。”',
      choices: [
        { label: '郑重系上一段', detail: '收下这份微小而坚定的心意。', reward: { gold: 0, xp: 26, virtue: 3, herbs: 0 }, text: '你把丝带系在剑鞘上，认真向她道谢。她忽然站直了些，像也守住了一件很要紧的事。' },
        { label: '买些布料，让她多做几段', detail: '花费 16 铜钱，为夜渡的人做路标。', cost: { gold: 16 }, reward: { gold: 0, xp: 24, virtue: 4, herbs: 1 }, text: '更多丝带被系在岔路口。七种颜色沿着山路向下延伸，成了大家都认识的平安记号。' }
      ]
    },
    {
      id: 'inn_ledger', location: 'inn', title: '未结的账本', speaker: '赶路客',
      text: '柜台下压着一册赊账簿。商人说乱世里最该先把账收清，可第一页，写着的都是山中穷苦人家的名字。',
      choices: [
        { label: '垫下一桌热饭钱', detail: '花费 20 铜钱，替几位山民渡过难关。', cost: { gold: 20 }, reward: { gold: 0, xp: 28, virtue: 4, herbs: 1 }, text: '你把钱压在账本旁。后厨多添了一锅米，今夜的客人不必再为饭钱局促。' },
        { label: '帮忙整理账簿', detail: '分清真正的欠账与被乱改的数字。', reward: { gold: 18, xp: 20, virtue: 1, herbs: 0 }, text: '你从重叠的墨迹里找出几笔错账。掌柜把报酬递来，嘴里只说，明天终于能安心开门了。' },
        { label: '认出老客，划去虚账', detail: '莎丽专属：账目和人情，都记得清楚。', hero: 'sali', reward: { gold: 24, xp: 34, virtue: 4, herbs: 1 }, text: '你一眼认出被人添上的虚账，干脆划掉。老客们围着柜台笑起来：“这才是我们的老板娘。”' }
      ]
    },
    {
      id: 'inn_midnight', location: 'inn', title: '夜雨叩门', speaker: '客栈伙计',
      text: '三声轻叩从后门传来。门外是一对被追赶的药商，门前却已有黑衣人借宿，正竖起耳朵听。',
      choices: [
        { label: '拔剑护送药商离开', detail: '可选战斗；赢得药材与额外报酬。', battle: true, reward: { gold: 32, xp: 48, virtue: 3, herbs: 2 }, text: '黑衣人的刀被逼出门槛。你护着药商沿溪离开，雨里留下一句“六奇阁见”。' },
        { label: '用货篷遮住后院', detail: '花费 12 铜钱置办篷布，掩护他们转移。', cost: { gold: 12 }, reward: { gold: 12, xp: 30, virtue: 3, herbs: 1 }, text: '货篷盖住后院的小径，雨声遮去脚步。待前堂的黑衣人察觉，药商已随空车悄然出城。' }
      ]
    },
    {
      id: 'liuqige_cabinet', location: 'liuqige', title: '百味药柜', speaker: '采药学徒',
      text: '山路颠簸，药柜上的木签全混在一起。学徒守着满桌草药发愁：“外形长得像，可千万不能凭猜的呀。”',
      choices: [
        { label: '按药记逐一核对', detail: '耐心整理，获得备用草药。', reward: { gold: 6, xp: 26, virtue: 1, herbs: 2 }, text: '你照着药记一一核对，把不确定的另行封存。学徒松了口气，将整理出的备用草药交给你。' },
        { label: '亲自辨药，重新立签', detail: '逗逗专属：让每味药回到正确的位置。', hero: 'doudou', reward: { gold: 14, xp: 36, virtue: 2, herbs: 4 }, text: '你逐味检查药材，把受潮的一批也挑了出来。新木签排得整整齐齐，小药炉很快重新升起白气。' }
      ]
    },
    {
      id: 'liuqige_enemy', location: 'liuqige', title: '门槛外的伤者', speaker: '六奇阁弟子',
      text: '一名受伤的黑衣人倒在门外，兵器已落进泥里。他盯着门上的药葫芦，想开口，又把头低了下去。',
      choices: [
        { label: '收下兵器，为他疗伤', detail: '消耗 1 份草药；侠义大幅提升。', cost: { herbs: 1 }, reward: { gold: 0, xp: 34, virtue: 5, herbs: 0 }, text: '药送到嘴边时，他还愣着。醒来后，他留下了附近暗哨的草图，沿山路慢慢走了。' },
        { label: '请弟子安置，自己去巡路', detail: '确保医馆与山路安全。', reward: { gold: 16, xp: 24, virtue: 2, herbs: 0 }, text: '你把伤者交给弟子，自己守了一程山路。没有追兵闯进来，门外那把刀也始终没有人再拿起。' },
        { label: '打开药箱，先救人', detail: '逗逗专属：用随身药具处理伤势。', hero: 'doudou', reward: { gold: 8, xp: 40, virtue: 5, herbs: 1 }, text: '“在我这儿，先是伤者，再论其他。”你合上药箱时，他已能坐起来。那双总是躲闪的眼睛，终于敢看向门外的光。' }
      ]
    },
    {
      id: 'leizhuang_tea', location: 'leizhuang', title: '一坛新茶', speaker: '林中茶客',
      text: '有人将旧酒坛洗得干干净净，装满新茶，摆在长凳上。“今日不赌输赢，只赌大家都能平安回来，如何？”',
      choices: [
        { label: '以茶代酒，举碗相约', detail: '与乡亲们留下一句约定。', reward: { gold: 8, xp: 28, virtue: 3, herbs: 1 }, text: '茶碗轻轻相碰，声音却十分响亮。你们约好，等山路重开，就在这张长凳上再坐一回。' },
        { label: '把酒坛改成全村的茶缸', detail: '大奔专属：亲自挑来山泉。', hero: 'daben', reward: { gold: 16, xp: 36, virtue: 4, herbs: 2 }, text: '你一肩挑来两桶清泉，笑着说这次谁也不许拿骰子来。旧坛盛上热茶，路过的人都能喝上一碗。' }
      ]
    },
    {
      id: 'leizhuang_bell', location: 'leizhuang', title: '旧庄风铃', speaker: '修门匠人',
      text: '屋檐下的风铃断了，匠人找不到合适的铜片。他说铃不只是好听，山民听见急摇的三声，就知道该往林里避。',
      choices: [
        { label: '添钱置办新铜片', detail: '花费 14 铜钱，修复示警风铃。', cost: { gold: 14 }, reward: { gold: 0, xp: 26, virtue: 4, herbs: 1 }, text: '铜片在风中轻轻一碰，声音传到了林外。匠人教会每户人家辨认急铃，再不用靠烟火报信。' },
        { label: '从废木里做一面梆子', detail: '就地做一件同样响亮的替代物。', reward: { gold: 12, xp: 22, virtue: 2, herbs: 0 }, text: '空心木在你掌下响了三声，惊起檐下一只燕子。匠人乐了：“好，听得见，便管用！”' }
      ]
    },
    {
      id: 'waterfall_message', location: 'waterfall', title: '无字急报', speaker: '瀑边发现',
      text: '一张白纸夹在湿石缝里。纸上没有字，边缘却有七个细小的折痕，绝不是被水随意冲出来的。',
      choices: [
        { label: '借侧光查看压痕', detail: '还原一段隐去的山路消息。', reward: { gold: 20, xp: 32, virtue: 1, herbs: 1 }, text: '你把纸迎向斜照的天光，压痕显出一条岔路。那是山民留下的安全绕行线。' },
        { label: '按暗号折回信纸', detail: '跳跳专属：读懂原本藏起的整封信。', hero: 'tiaotiao', reward: { gold: 28, xp: 42, virtue: 2, herbs: 2 }, text: '七折复原，碎开的字迹连成一句话。你读完后换了一处藏纸位置，给下一位赶来的同伴留下自己的暗记。' }
      ]
    },
    {
      id: 'waterfall_bridge', location: 'waterfall', title: '桥头的过路钱', speaker: '行脚商人',
      text: '瀑前吊桥被几个魔教散兵扣住。他们自称“看桥人”，每来一位就加一次价，行脚商人的钱袋已经见了底。',
      choices: [
        { label: '清走拦路散兵', detail: '可选战斗；让吊桥恢复通行。', battle: true, reward: { gold: 40, xp: 54, virtue: 3, herbs: 1 }, text: '勒索的木牌被你扔进急流。商人们重新走过吊桥，把凑出的谢礼塞进你手里。' },
        { label: '领大家走瀑侧旧径', detail: '放弃交锋，耐心绕行。', reward: { gold: 14, xp: 28, virtue: 2, herbs: 1 }, text: '你带着商人沿崖边旧径走过险处，回望时，散兵还守着那座空桥。' },
        { label: '假传换防口令', detail: '跳跳专属：让散兵自己离开桥头。', hero: 'tiaotiao', reward: { gold: 32, xp: 42, virtue: 3, herbs: 1 }, text: '几句熟悉的口令一出，散兵连木牌都顾不上收。你翻过牌子，写上“行人慢过，勿挤”。' }
      ]
    },
    {
      id: 'gallery_raft', location: 'gallery', title: '溪中的竹筏', speaker: '摆渡老人',
      text: '竹筏被漩水顶在溪心，筏上装着避难人家的行李。老人看着绷紧的绳索，只怕再拉一下就会断。',
      choices: [
        { label: '沿岸换一处受力点', detail: '与老人合力稳住竹筏。', reward: { gold: 22, xp: 34, virtue: 3, herbs: 1 }, text: '你将绳索绕过低岸的岩角，和老人同时发力。竹筏一点点离开漩水，完好地回到浅滩。' },
        { label: '听水辨流，以风助筏', detail: '达达专属：凭山水经验化解险情。', hero: 'dada', reward: { gold: 28, xp: 44, virtue: 4, herbs: 2 }, text: '你听了一会儿水声，找准回流换向的片刻。旋风托开筏头，竹筏顺势漂回岸边，一只陶碗都没摔碎。' }
      ]
    },
    {
      id: 'gallery_rations', location: 'gallery', title: '迟到的粮车', speaker: '护车少年',
      text: '满车粮食停在竹林岔口，拉车的牲口受了惊。远处有人吹短哨，少年握着一根竹竿，手却在发抖。',
      choices: [
        { label: '迎击埋伏，护车过林', detail: '可选战斗；护住这批急需的粮食。', battle: true, reward: { gold: 46, xp: 64, virtue: 4, herbs: 1 }, text: '伏兵从竹影里败退。少年放下竹竿，终于能稳稳握住缰绳。粮车在你身后驶向山民的营地。' },
        { label: '卸开重物，绕行浅溪', detail: '花费 20 铜钱雇人搬运，避开埋伏。', cost: { gold: 20 }, reward: { gold: 22, xp: 36, virtue: 3, herbs: 1 }, text: '你找来几位熟悉浅溪的搬运人，分批运过粮食。少年回望空车，不好意思地笑了：原来也可以这么走。' }
      ]
    },
    {
      id: 'baicao_silence', location: 'baicao', title: '林间忽然无声', speaker: '采药姑娘',
      text: '平日最热闹的一片林子，此刻连虫鸣都没有。采药姑娘指了指灌木深处：几个捕兽夹闪着冷光。',
      choices: [
        { label: '逐个解除捕兽夹', detail: '把林中生灵常走的小径清理出来。', reward: { gold: 14, xp: 36, virtue: 4, herbs: 2 }, text: '你把捕兽夹收拢到空地，确认小径再无危险。过了很久，一只山雀试探着叫了一声。' },
        { label: '循鸟踪找齐隐蔽机关', detail: '达达专属：把最隐蔽的危险也清除。', hero: 'dada', reward: { gold: 20, xp: 46, virtue: 5, herbs: 3 }, text: '你从折草与羽痕间找出最后一处暗夹。竹叶重新沙沙作响，山雀们一只接一只落回枝上。' }
      ]
    },
    {
      id: 'baicao_herbs', location: 'baicao', title: '一篓带露的草药', speaker: '谷中药农',
      text: '药农把一篓刚收的草药摆在石上：“上山用得着。但根不能全挖了，来年山里人还要靠它们过活。”',
      choices: [
        { label: '按价购下备用草药', detail: '花费 24 铜钱，获得 3 份草药。', cost: { gold: 24 }, reward: { gold: 0, xp: 20, virtue: 1, herbs: 3 }, text: '你只收下需要的药材，把剩下的仔细包好。药农拍拍背篓，继续往谷中走去。' },
        { label: '帮药农把种苗种回去', detail: '换取药材，也给来年留下生机。', reward: { gold: 0, xp: 34, virtue: 3, herbs: 2 }, text: '你们在松软的土里种下小苗。药农递给你两份草药，说山里欠下的情，总会开花结果。' },
        { label: '检查药材，留根分株', detail: '逗逗专属：帮药农分清可收与须养的药株。', hero: 'doudou', reward: { gold: 12, xp: 44, virtue: 4, herbs: 4 }, text: '你把需要养护的药株另栽成一畦，给新学徒留下清楚的木签。药农郑重地把最好的备用药交给你。' }
      ]
    },
    {
      id: 'tianzi_lights', location: 'tianzi', title: '山门七盏灯', speaker: '守路山民',
      text: '登山石阶旁亮着七盏灯。你曾帮助过的人把干粮与药草留在灯下，没有留下姓名，只写着“给上山的人”。',
      choices: [
        { label: '收下心意，继续登山', detail: '获得决战前的草药与阅历。', reward: { gold: 20, xp: 42, virtue: 1, herbs: 3 }, text: '你取了适量的草药，向灯火深深一揖。背后的山路上，有更多小小的光正向这里汇来。' },
        { label: '留下些盘缠给守路的人', detail: '花费 24 铜钱，让善意继续传下去。', cost: { gold: 24 }, reward: { gold: 0, xp: 46, virtue: 5, herbs: 4 }, text: '你把盘缠放在灯下，收好药草。守路的人替你添上最后一勺灯油，目送你走入云中。' }
      ]
    },
    {
      id: 'tianzi_promise', location: 'tianzi', title: '风里的旧约', speaker: '峰顶片刻',
      text: '峰顶风大，身后的路已隐入云海。剑鞘轻轻碰着腰间，你忽然想起那些还亮着的灯、还没喝完的茶，以及等着重开的门。',
      choices: [
        { label: '静下心，重新系紧剑穗', detail: '记住此行要守护的人与山。', reward: { gold: 0, xp: 48, virtue: 3, herbs: 1 }, text: '你把剑穗系紧，呼吸渐渐平稳。前方还有一战，而身后那些日常的小事，已足够让你向前。' },
        { label: '把父辈的约定说给山风', detail: '虹猫专属：让长虹剑回应自己的承诺。', hero: 'hongmao', reward: { gold: 0, xp: 60, virtue: 4, herbs: 2 }, text: '你轻轻说了一句“我会守住”。没有人回答，长虹剑却映出云隙里的第一缕光。你知道自己已经准备好了。' }
      ]
    }
  ],
  sources: [
    { title: '央视国际｜《虹猫蓝兔七侠传》故事介绍', url: 'https://www.cntv.cn/program/yhjc/20070301/102348.shtml', note: '核验张家界背景、森林与麒麟、黑心虎以及七剑合璧的核心冲突。本作剧情分支、剑印与玩法另行创作。' },
    { title: '央视国际｜第1—10集剧情介绍', url: 'https://www.cntv.cn/program/yhjc/20070301/102564.shtml', note: '核验虹猫护送麒麟、蓝兔是玉蟾宫宫主，以及猪无戒围攻玉蟾宫等角色与地点关系。' },
    { title: '央视国际｜第11—20集剧情介绍', url: 'https://www.cntv.cn/program/yhjc/20070301/102579.shtml', note: '核验莎丽的紫云剑主身份与马三娘冒充剑主的情节；该早期简介使用“潇湘客栈”，游戏采用通行的金鞭溪客栈名称。' },
    { title: '央视国际｜第31—40集剧情介绍', url: 'https://www.cntv.cn/program/yhjc/20070301/102598.shtml', note: '核验六奇阁与神医逗逗、跳跳暗中相助的关系。此处仅引用地点和人物设定，药车任务为原创。' },
    { title: '央视国际｜第61—70集剧情介绍', url: 'https://www.cntv.cn/program/yhjc/20070301/102618.shtml', note: '核验大奔与快活林的关系；第63集将奔雷山庄指向陵园。本作使用“快活林·奔雷旧庄”，不将其补成有官方依据的完整现存山庄。' },
    { title: '央视国际｜第81—89集剧情介绍', url: 'https://www.cntv.cn/program/yhjc/20070301/104028.shtml', note: '核验跳跳使用青光剑、十里画廊的环境剧情与达达的百草谷谷主身份。焚林队、石堰和风道事件为原创。' },
    { title: '新华社报道（新浪转载）｜湖南武侠卡通大片亮相央视', url: 'https://ent.sina.com.cn/v/m/2006-09-06/07591233349.html', note: '2006年报道列出作品采用的金鞭溪、天子山等张家界景点。游戏地图将这些地名重新组织成游历路线，并非真实比例地图。' },
    { title: '维基百科｜虹猫蓝兔七侠传', url: 'https://zh.wikipedia.org/wiki/%E8%99%B9%E7%8C%AB%E8%93%9D%E5%85%94%E4%B8%83%E4%BE%A0%E4%BC%A0', note: '辅助交叉核验七位角色、对应剑名与主要身份；原作剧情以央视简介优先。' },
    { title: '百度百科｜跳跳', url: 'https://bkso.baidu.com/item/%E8%B7%B3%E8%B7%B3/69099', note: '辅助核验天悬白练与跳跳的地点关系、猴类形象。游戏没有采用该词条中未另行确认的年龄、门派、武力排名或招式列表。' },
    { title: '百度百科｜莎丽', url: 'https://bkso.baidu.com/item/%E8%8E%8E%E4%B8%BD/68665', note: '辅助核验莎丽的松鼠形象与紫云剑传人身份。' },
    { title: '百度百科｜逗逗', url: 'https://bkso.baidu.com/item/%E9%80%97%E9%80%97/263652', note: '辅助核验逗逗的犬类形象；不同资料对犬种有分歧，本作只标作“狗”。' },
    { title: '百度百科｜大奔', url: 'https://bkso.baidu.com/item/%E5%A4%A7%E5%A5%94/6860723', note: '辅助核验大奔的白色熊类形象与奔雷剑传人身份。' },
    { title: '百度百科｜达达', url: 'https://bkso.baidu.com/item/%E8%BE%BE%E8%BE%BE/2384014', note: '辅助核验达达的大熊猫形象与旋风剑传人身份。' }
  ]
};
