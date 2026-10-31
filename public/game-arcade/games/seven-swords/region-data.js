/* 九地游记：人物、既有地名沿用本作资料；下列局部地标、机关与事件均为平行江湖原创。 */
window.REGION_DATA = {
  version: 3,
  regions: {
    forest: { subtitle: '松风旧径 · 林中有信', description: '沿旧栈道走入峰林，循溪寻找失修的水闸，再登上望台辨认归路。山中小事，往往藏着守林人的心意。', atmosphere: '云脚贴着松梢游移，溪声自岩隙间传来。' },
    yuchan: { subtitle: '宫阙荷影 · 一水相连', description: '宫门、水榭与后苑由石桥和回廊连接。修复水令，整理残册，让守宫的人与暂住的山民各得其所。', atmosphere: '荷叶轻触桥墩，风穿过白墙的月洞。' },
    inn: { subtitle: '金鞭烟火 · 灯下有人', description: '客栈前堂通向溪岸货埠，后厨外还有水磨与旧院。账目之外，这里藏着暗绘、热饭和等待修好的木轮。', atmosphere: '锅盖腾起白气，檐下的风灯慢慢摇晃。' },
    liuqige: { subtitle: '云阁药香 · 山路回春', description: '在药圃与云阶之间查找药记，为山中求医的人备好遮雨处。此处药方与草木均为虚构的任务设定。', atmosphere: '药杵声一下一下，山雨正从远处越岭而来。' },
    leizhuang: { subtitle: '旧庄新声 · 炊烟再起', description: '从村口走到旧庄遗址，再沿林边回到作坊。补牢榫木，校正公秤，接回尚未归家的巡林人。', atmosphere: '茶水在灶上轻响，落叶掠过空旷的旧阶。' },
    waterfall: { subtitle: '白练深处 · 水声藏讯', description: '瀑前吊桥、临水平台和水幕后的旧哨互相照应。听懂雾中的信号，补上桥索，把隐秘山路交还行人。', atmosphere: '水雾浮上衣袖，远处短哨时断时续。' },
    gallery: { subtitle: '溪山入画 · 竹路分岔', description: '循画中山形辨路，在长滩分批转运行李，查出竹林里被人挪动的旗记。每条支路都有不同的去处。', atmosphere: '竹影落满浅滩，舟篙偶尔碰响溪石。' },
    baicao: { subtitle: '谷中长风 · 草木有期', description: '竹屋、药圃与风口散布在谷地。修好风琴，按水势照料新苗，也听一听归巢小兽带来的动静。', atmosphere: '风过林间，竹叶与檐下细弦先后应声。' },
    tianzi: { subtitle: '云阶万重 · 山河在望', description: '沿高山石阶逐处探察风候，修稳古台，补全营地的归山名簿。峰顶的约定，从一桩桩小事开始。', atmosphere: '云海忽聚忽散，高处的旗角绷得笔直。' }
  },
  tasks: [
    {
      id: 'forest-homeward', region: 'forest', title: '松间归路', summary: '查明旧栈道岔口的方向，为迷路的采薪人留下能看懂的路引。',
      steps: [
        { anchor: 'arrival', title: '村口的空背篓', speaker: '采薪人阿枝', action: 'talk', button: '询问旧路', text: '阿枝望着山上的雾：“我弟弟去取落在旧栈道的背篓，至今没回。岔口那块木牌倒了，连熟路人也会绕晕。”', result: '你记下背篓上的三道红线，决定先查旧栈道留下的路记。' },
        { anchor: 'ruins', title: '断栏上的刻痕', speaker: '旧栈道遗迹', action: 'inspect', button: '拓下路记', text: '断栏背面刻着三座山峰，旁边的小箭头被苔藓遮住。擦净后，露出“面向三峰，右支归营”八个小字。', item: '三峰路记拓片', result: '你取下刻痕拓片。得去高处确认三峰的方向，才不会把右支认反。' },
        { anchor: 'lookout', title: '辨认三峰', speaker: '临崖望台', action: 'puzzle', button: '比对山形', text: '望台正对高、中、低三座石峰。拓片上的山形与眼前相同，旧栈道的两条支路分别绕向左右两侧。', puzzle: { hint: '拓片写着：面向三峰，右支归营。', choices: [{ label: '背向三峰，沿右支', text: '背向山峰会把方向颠倒。你重新摊开拓片比对。', correct: false }, { label: '面向三峰，沿右支', text: '山形与刻痕重合，归营的支路就在右手一侧。', correct: true }, { label: '顺着最陡的岩隙上行', text: '岩隙在拓片上被画了叉，那里并非旧栈道。', correct: false }] }, result: '你在望台记下准确方向，带着拓片前往避风营。' },
        { anchor: 'camp', title: '让归路有名字', speaker: '采薪少年', action: 'deliver', button: '交付路引', text: '少年果然在营地等雾散。他看见拓片，认出了爷爷当年刻过的字：“原来这条路一直记得我们。”', result: '你把拓片交给少年，和营地的人约好将路引挂在岔口。' }
      ],
      reward: { gold: 28, xp: 30, virtue: 2 }, ending: '阿枝收到了弟弟平安的口信。新的归路木牌立起，来往的人不必再凭雾里的猜测走路。', effect: '归路木牌已立，营地挂出红绳路引。'
    },
    {
      id: 'forest-sluice', region: 'forest', title: '溪泉复流', summary: '找出溪闸失灵的缘故，用旧料修好水轮，让下游小池重新蓄水。',
      steps: [
        { anchor: 'waterside', title: '不转的水轮', speaker: '溪边小童', action: 'inspect', button: '检查闸轴', text: '小童把空水桶搁在岸边。溪水仍在流，木轮却纹丝不动；你拨开缠枝，发现轴旁少了固定用的木楔。', item: '磨损的旧木楔', result: '旧楔已经磨圆。岸上的备用木料堆里，也许还有尺寸合适的硬木。' },
        { anchor: 'cache', title: '木料里的好材', speaker: '备用料堆', action: 'gather', button: '挑选硬木', text: '料堆中的木头一半发软，一半仍有清脆的敲击声。你只取下早已截好的干燥余料，没有砍动活树。', item: '干燥硬木料', result: '余料足够做一只新楔，接下来要借作坊的工具削出榫口。' },
        { anchor: 'workshop', title: '削楔配轴', speaker: '林中木匠', action: 'craft', button: '添钱更换轴套', cost: { gold: 10 }, text: '木匠量过旧楔：“花十枚铜钱可换一副轴套；若省着用，把旧套缠紧、木楔再削厚一些，也能稳稳撑住。”', alternatives: [{ label: '协助缠紧旧轴套 · 免费', text: '你磨平毛刺，用作坊余下的麻绳紧缠轴套，再把新楔削厚半分。' }], item: '配好的闸轴木楔', result: '新木楔与轴套严丝合缝。带回溪闸，便能让水轮重新转动。' },
        { anchor: 'waterside', title: '第一圈清水', speaker: '溪边小童', action: 'deliver', button: '装楔开闸', text: '你将新楔压入轴槽，请小童退到岸边，再慢慢放开闸杆。木轮发出一声轻响，开始带着清水转动。', result: '下游的小池渐渐涨起清水，小童提着水桶向你挥手。' }
      ],
      reward: { gold: 32, xp: 32, virtue: 2, herbs: 1 }, ending: '木轮重新唱起低低的歌。山民在闸边留了一把长柄勺，谁路过都可以歇脚取水。', effect: '溪闸修复，岸边添上取水长勺。'
    },
    {
      id: 'forest-watch', region: 'forest', title: '借烟藏踪', summary: '追查守林亭附近的异常烟痕，清理盯住小兽迁徙路线的临时哨点。',
      steps: [
        { anchor: 'shrine', title: '亭后有新灰', speaker: '守林老人', action: 'inspect', button: '察看烟灰', text: '守林亭近来无人烧香，背风处却积了一撮新灰。灰里有短短的黑麻线，旁边还压着一片鹰纹纸角。', item: '带鹰纹的纸角', result: '纸角上留下“枯枝朝水”的字样，像是辨认暗哨的约定。' },
        { anchor: 'ruins', title: '真假两堆枝', speaker: '石隙旁的岔路', action: 'puzzle', button: '辨认暗记', text: '石隙旁有两堆枯枝，一堆尖端朝山，一堆尖端朝溪。纸角上的字迹虽焦了半边，关键四字仍清清楚楚。', puzzle: { hint: '纸角写着“枯枝朝水”。', choices: [{ label: '察看尖端朝溪的那堆', text: '拨开枯枝，下面藏着通向营地的暗哨脚印。', correct: true }, { label: '察看尖端朝山的那堆', text: '枝下只有旧鸟巢。你没有扰动它，转身重新核对纸角。', correct: false }, { label: '把两堆枯枝一起烧掉', text: '烟会惊动暗哨，也可能伤到山林。先看清线索更稳妥。', correct: false }] }, result: '你查清暗哨方向，沿脚印走向隐蔽营地。' },
        { anchor: 'camp', title: '哨火将燃', speaker: '魔教巡山散兵', action: 'battle', button: '拔剑截住暗哨', text: '几名散兵正把油筒搬向小兽常走的林隙。只要哨火点起，附近的捕兽人便会赶来。', alternatives: [{ label: '打乱信号，把散兵引向空坡', text: '你在空坡敲出急促的换哨声，又翻转脚边的指路枝。散兵误以为有人来查岗，抬着油筒匆匆赶去。' }, { label: '借熟悉的兽径绕到背后', hero: 'hongmao', text: '你沿幼时走过的兽径绕后，把传讯器具收走。等散兵回头，信号已无从发出。' }], result: '林隙前的油筒被搬离，剩余的暗号牌也落入你手。', item: '缴下的暗号牌' },
        { anchor: 'lookout', title: '把眼睛留在山里', speaker: '守林学徒', action: 'deliver', button: '交代哨位', text: '望台上的学徒记下暗号牌的样式。你与他约定，见到可疑烟线先提醒山民，不让无辜生灵再被逼进死角。', result: '学徒收好暗号牌，收起旧哨火，换上山民都认得的守望布旗。' }
      ],
      reward: { gold: 38, xp: 38, virtue: 3 }, ending: '原本通向陷阱的林隙安静下来。小兽从树根下探出脑袋，守望布旗在高处轻轻展开。', effect: '暗哨撤去，望台换上守林布旗。'
    },
    {
      id: 'yuchan-scroll', region: 'yuchan', title: '残册归阁', summary: '收回风中散落的宫阁旧册，按残页线索辨认它的归处。',
      steps: [
        { anchor: 'ruins', title: '瓦下半页书', speaker: '废院一角', action: 'inspect', button: '收起残册', text: '雨后碎瓦下压着半册湿书。书角画着月轮和一道长廊，没有武功秘诀，只有早年安置山民的名录。', item: '月纹残册', result: '你将书页夹在干布里，准备询问认得旧藏书印的人。' },
        { anchor: 'side1', title: '记得旧印的人', speaker: '整理书册的宫人', action: 'talk', button: '请教藏印', text: '宫人轻轻抚平书角：“圆月印属于静月堂，半月印才是水榭。年头太久，匾字已经剥落，可月形还在。”', result: '你记下圆月与半月的区别，去宫前核对两处旧藏书标记。' },
        { anchor: 'main', title: '辨认藏书印', speaker: '宫前石案', action: 'puzzle', button: '核对归处', text: '石案摆着三枚旧馆印：圆月、半月与荷叶。残册页角是一轮完整的月亮，与你方才听到的线索相合。', puzzle: { hint: '完整圆月对应静月堂；半月对应水榭。', choices: [{ label: '将残册归入水榭半月卷', text: '水榭的印是半月，与残册不合。', correct: false }, { label: '将残册归入静月堂圆月卷', text: '圆月纹与缺册登记相合，这正是静月堂失散的旧名录。', correct: true }, { label: '混入荷池花木记', text: '名录并非花木记，页上的藏印也不同。', correct: false }] }, result: '你找到了完整的归册记录，接下来可把名录送回静置书册的清静处。' },
        { anchor: 'shrine', title: '把名字放回原处', speaker: '守册宫人', action: 'deliver', button: '归还旧名录', text: '守册人翻到熟悉的名字，指尖停了一下：“她后来平安回乡了。书留着，好让后来的人知道，这里曾给她一扇门。”', result: '旧名录被重新包好，放回干燥的木匣。' }
      ],
      reward: { gold: 26, xp: 30, virtue: 2 }, ending: '散落的册页有了归处。宫人留下一张新的空白页，准备继续记下得到庇护的人。', effect: '书匣补全，案上添了一卷新名录。'
    },
    {
      id: 'yuchan-water', region: 'yuchan', title: '后苑水令', summary: '查明上下两道小闸的关系，恢复后苑温和的补水水势。',
      steps: [
        { anchor: 'workshop', title: '匠人的两块木牌', speaker: '修渠匠人', action: 'talk', button: '听取水令', text: '匠人递来两块木牌：“上闸进水，下闸泄水。水道堵过，千万别一口气放满。先去池边看水线，再上高处找旧刻度。”', item: '上下闸木牌', result: '你收好木牌，先到后苑水边查验实际水位。' },
        { anchor: 'waterside', title: '石岸上的水线', speaker: '后苑小渠', action: 'inspect', button: '查看水位', text: '石岸旧水线比眼下高出一掌。下游浮叶堵着出水口，你清走浮叶，水面随即稳了些。', result: '出水口已经通畅。为了不冲坏刚修好的岸沿，需要按旧令缓慢补水。' },
        { anchor: 'lookout', title: '两闸之间', speaker: '观水台旧刻', action: 'puzzle', button: '决定开闸顺序', text: '高处的旧刻写着“下闸半开，上闸缓启；水齐白线，两闸相平”。木牌与水线的含义终于连在一起。', puzzle: { hint: '先留出缓流出口，再慢慢放入新水。', choices: [{ label: '关死下闸，将上闸全开', text: '水只进不出，会冲过白线。你停下闸杆，重新读一遍旧刻。', correct: false }, { label: '先开上闸，再同时关住两闸', text: '这样的水势难以控制，也不符合旧刻。', correct: false }, { label: '下闸半开，再缓启上闸', text: '水流有了去处，进水便能一寸寸调平。', correct: true }] }, result: '你确定了正确的水令，回池边将闸杆调到记下的位置。' },
        { anchor: 'waterside', title: '荷影重映', speaker: '修渠匠人', action: 'deliver', button: '依令调平水势', text: '匠人守着下闸，你缓缓推动上闸杆。待水面齐到白线，两道闸便维持在同样的流量。', result: '清水平稳穿过后苑，荷叶在恢复的水面上轻轻舒展。' }
      ],
      reward: { gold: 34, xp: 34, virtue: 2 }, ending: '两块木牌挂回闸边，注明先后与水线。此后换班的宫人也能照着水令照料荷池。', effect: '后苑水令复原，池边挂出开闸木牌。'
    },
    {
      id: 'yuchan-courier', region: 'yuchan', title: '渡夜信灯', summary: '制作防风信灯，处理宫外窥探的人，把平安消息送到夜归路口。',
      steps: [
        { anchor: 'cache', title: '一箱未用的灯骨', speaker: '库边宫人', action: 'gather', button: '领取灯骨与旧纱', text: '宫人打开一只浅木箱：“都是去年余下的灯骨。今夜有几户人家要沿山路回去，需要一盏不怕风的信灯。”', item: '灯骨与旧纱', result: '你取好足够一盏灯的材料，带去作坊蒙纱配罩。' },
        { anchor: 'workshop', title: '给火光一道屏障', speaker: '制灯弟子', action: 'craft', button: '添置灯罩', cost: { gold: 12 }, text: '弟子比着灯骨：“十二枚铜钱能换一只新罩。也可以把旧纱叠两层，再用竹篾撑开，不让它碰着火芯。”', alternatives: [{ label: '用旧纱与竹篾做防风罩 · 免费', text: '你把旧纱缝成双层，留出通气小孔，竹篾将灯罩稳稳撑住。' }, { label: '按宫中灯式亲手结罩', hero: 'lantu', text: '你认得宫中常用的灯结，收紧三处绳扣，旧纱便平整地贴上灯骨。' }], item: '防风信灯', result: '防风信灯已做好，先去宫外等候点确认归路安全。' },
        { anchor: 'camp', title: '窥灯的黑影', speaker: '等候归家的山民', action: 'battle', button: '清退窥探散兵', text: '几名散兵藏在等候点外，打算跟着信灯找到山民的住处。众人缩在棚后，不敢点起手中的火。', alternatives: [{ label: '用空灯架引他们绕向无人坡', text: '你将一只无火的空灯架挂在高枝，借晃动的枝影引开窥探者；山民的真信灯仍藏在防风罩里。' }], result: '窥探者离开了真正的归路，你带着信灯前往宫门外的路口。' },
        { anchor: 'arrival', title: '一盏灯的约定', speaker: '夜归山民', action: 'deliver', button: '点亮信灯', text: '山民约好：看见路口的暖光，便知此处可以放心歇脚。你把信灯挂牢，确认灯罩在风中也不会翻倒。', result: '信灯在夜归路口亮起，等待的人终于能互报平安。' }
      ],
      reward: { gold: 38, xp: 38, virtue: 3, herbs: 1 }, ending: '防风罩把火光护在中央。远处有人挥起手中的布巾，宫门内外都有了回应。', effect: '夜归路口点亮一盏防风信灯。'
    },
    {
      id: 'inn-hidden-map', region: 'inn', title: '半幅密绘', summary: '循油纸上的标记找出被窥探的后院路线，替客栈补上一个隐患。',
      steps: [
        { anchor: 'side1', title: '不画风景的客人', speaker: '客栈伙计', action: 'talk', button: '询问画客', text: '伙计压低声音：“那位客人一整天没画山，只画窗和门。走时有东西落在旧院，可别是什么害人的算计。”', result: '你记下画客停留的位置，去旧院找他遗落的纸片。' },
        { anchor: 'ruins', title: '油纸上的小叉', speaker: '旧院石缝', action: 'inspect', button: '取出半幅绘图', text: '一张油纸卡在石缝中，上面画着客栈后窗、磨坊和溪桥。后窗被打了叉，旁边写着“看得见窗，听不见水”。', item: '客栈半幅密绘', result: '纸上的短句像在说明窥探的位置。你得站到高处，实地核对声响与视线。' },
        { anchor: 'lookout', title: '风景之外', speaker: '临溪观景处', action: 'puzzle', button: '辨明藏身位置', text: '磨坊旁水声很响，溪桥正面看不到后窗，只有旧院矮墙背后既能看见窗，又被石坡挡住水声。', puzzle: { hint: '密绘注明“看得见窗，听不见水”；逐处对照。', choices: [{ label: '磨坊水轮旁', text: '水轮轰响，与“听不见水”的记录相反。', correct: false }, { label: '旧院矮墙背后', text: '窗的位置与图纸完全吻合，石坡也确实遮住了水声。', correct: true }, { label: '溪桥正中', text: '桥边视线被屋角挡住，无法窥见后窗。', correct: false }] }, result: '你在密绘上圈出旧院矮墙，将准确位置带回前堂。' },
        { anchor: 'main', title: '把后窗留给晚风', speaker: '客栈账房', action: 'deliver', button: '交付标注密绘', text: '账房收下绘图，叫伙计把旧院外侧的杂物移开：“既然没了藏身处，客人们便能放心推窗透气。”', result: '你说明观察到的视线，客栈开始整理院墙外的盲角。' }
      ],
      reward: { gold: 35, xp: 34, virtue: 2 }, ending: '窥探用的旧凳被搬走，院墙边挂起了一串风铃。后窗照旧迎着溪风打开。', effect: '旧院盲角清理，窗外挂上风铃。'
    },
    {
      id: 'inn-warm-meal', region: 'inn', title: '热食过溪', summary: '把后厨备好的热饭送到临时歇脚点，再将领饭木筹带回核清。',
      steps: [
        { anchor: 'workshop', title: '还差一趟脚程', speaker: '后厨帮工', action: 'talk', button: '接下送饭差事', text: '后厨炖好了饭菜，歇在溪外的搬运人却走不开。帮工递来空食笼：“饭在货棚保着温，送到后请带回木筹，免得有人漏领。”', item: '空食笼', result: '你接下食笼，先到货棚装好已经分装的饭菜。' },
        { anchor: 'cache', title: '四份热饭', speaker: '货棚小伙计', action: 'gather', button: '装好饭包', text: '四份饭包垫在厚布里，小伙计按人数逐份放进食笼，又加了一壶温茶：“先送过去，回来还有你的那份。”', item: '四份热饭与温茶', result: '食笼扎得稳稳当当，可以送往歇脚营地了。' },
        { anchor: 'camp', title: '先让大家吃上饭', speaker: '搬运领班', action: 'deliver', button: '分发热饭', text: '搬运人轮流卸下肩上的担子。领班照名字分完四份饭，将四枚领饭木筹交给你，没有把最后一份忘在车后。', item: '四枚领饭木筹与空食笼', result: '热饭已分完。你收好木筹，带空食笼回后厨交账。' },
        { anchor: 'workshop', title: '回厨报平安', speaker: '后厨帮工', action: 'deliver', button: '归还木筹与食笼', text: '帮工一枚枚数清木筹，松了口气：“好，人人都有。”炉边果然还留着一碗饭，热气并没有散。', result: '木筹与食笼归还，后厨确认了这一趟送饭的全部人数。' }
      ],
      reward: { gold: 24, xp: 28, virtue: 3 }, ending: '客栈在货棚多留了一张小桌，下一趟送饭的人可以坐着核数。灯下的热饭，终于一份也没落下。', effect: '货棚增设送饭小桌，食笼重新码齐。'
    },
    {
      id: 'inn-mill', region: 'inn', title: '水磨歇轮', summary: '找回水磨缺失的销钉，配好联轴绳，恢复客栈的磨粮声。',
      steps: [
        { anchor: 'waterside', title: '空转的半只轮', speaker: '磨坊老人', action: 'inspect', button: '查看传动轴', text: '外头水轮转着，屋里的磨盘却不动。老人停住水闸，让你安全查看：传动轴的圆销断了一截，另一截不见了。', item: '断裂的圆销', result: '老人说旧院存着一批拆下的好木件，或许能找出同样尺寸的替代品。' },
        { anchor: 'ruins', title: '旧件也有用处', speaker: '旧院木架', action: 'gather', button: '挑出合用圆销', text: '木架上的零件标着长短，你用断销比了比，挑出一枚长度相同、木纹紧实的圆销。', item: '完好的木圆销', result: '圆销尺寸合适，但还需要重新编紧连接轴套的绳扣。' },
        { anchor: 'workshop', title: '圆销与绳扣', speaker: '修具师傅', action: 'craft', button: '换一副新绳扣', cost: { gold: 10 }, text: '师傅有十枚铜钱一副的新绳扣，也留了几段结实旧绳。你可以添钱换新，或耐心拆开旧绳重新编紧。', alternatives: [{ label: '重编旧绳扣 · 免费', text: '你剔去磨断的细股，把剩下的旧绳交错编紧，做成贴合轴套的双扣。' }], item: '木圆销与联轴绳扣', result: '绳扣通过了拉扯检查，圆销也打磨光滑，可以装回水磨。' },
        { anchor: 'waterside', title: '磨盘又响了', speaker: '磨坊老人', action: 'deliver', button: '修复联轴', text: '老人压住闸杆，你装好圆销和绳扣，再退出轮轴旁。闸水缓缓放开，里外两只轮终于一同转动。', result: '第一把粮食落进磨眼，石盘重新发出熟悉的低响。' }
      ],
      reward: { gold: 32, xp: 32, virtue: 2 }, ending: '磨坊外重新挂出收粮布招。老人说，等客栈蒸起下一笼馒头，准有这一只小圆销的功劳。', effect: '水磨联轴修好，门边挂起收粮布招。'
    },
    {
      id: 'liuqige-herbal-note', region: 'liuqige', title: '缺页药记', summary: '依照虚构药记的图样寻找月纹草，再按医嘱备好山路急用药包。',
      steps: [
        { anchor: 'main', title: '只剩图样的一页', speaker: '药房学徒', action: 'talk', button: '领下补记差事', text: '学徒翻开山路急用药记：“末页淋湿了，只剩一幅月纹草图。师傅把另一份图样存进了静室，请先取来核对，不能凭猜。”', result: '你记下药记的页号，前往静室寻找存底的图样。' },
        { anchor: 'shrine', title: '存底图样', speaker: '药记静室', action: 'inspect', button: '读取图样', text: '存底画着游戏中独有的月纹草：圆叶、叶背一道银弧，旁边注明只取落在收药盘中的成熟叶。', item: '月纹草图样', result: '你带好图样，去药圃辨认已经采收、待核对的叶片。' },
        { anchor: 'herb', title: '三盘相似的叶', speaker: '药圃学徒', action: 'puzzle', button: '照图核对', text: '学徒摆出三只收药盘：长叶、圆叶带银弧、圆叶无纹。三盘都已采好，只有一盘与存底图样完全一致。', puzzle: { hint: '这是本作虚构的月纹草：圆叶，叶背一道银弧。', choices: [{ label: '取长叶那盘', text: '叶形不同，先单独封存，不可混用。', correct: false }, { label: '取圆叶带银弧那盘', text: '叶形与叶背纹样都吻合，你把这一盘交给药房使用。', correct: true }, { label: '取圆叶无纹那盘', text: '叶背缺少银弧，不能按这张图样认作同一种。', correct: false }] }, item: '核对过的月纹草叶', result: '材料核对完成，你把叶片送到作坊，按药房已经写好的医嘱封包。' },
        { anchor: 'workshop', title: '包好，再写清', speaker: '药房学徒', action: 'craft', button: '添入备用草药', cost: { herbs: 1 }, text: '学徒准备把材料封成游戏中的急用药包。你可添入一份随身备用草药，也可帮助研磨、分包，由药房出齐材料。', alternatives: [{ label: '协助分包，由药房提供材料 · 免费', text: '你将核对过的材料按医嘱分好，学徒从药房补齐所需，再把每包用途写清。' }, { label: '亲自核对医嘱并封包', hero: 'doudou', text: '你核对全部材料与封签，让学徒把拿不准的另收一盒，最后才系紧药包。' }], result: '药包排好，补写的图样与原记并放，下一位学徒也能照图核对。' }
      ],
      reward: { gold: 26, xp: 34, virtue: 2, herbs: 1 }, ending: '药记补上了清楚的图样与核对方法。学徒把“不确定，先封存”写在药柜最显眼的地方。', effect: '药案添上封好的急用包与完整图样。'
    },
    {
      id: 'liuqige-rain-shelter', region: 'liuqige', title: '山雨前的药棚', summary: '检查风雨来向，修好棚架，为候诊的人搭起稳固的遮雨处。',
      steps: [
        { anchor: 'cache', title: '晒场收篷', speaker: '晒药人', action: 'gather', button: '收好干篷布', text: '山雨就要翻过岭头，晒药人忙着收竹匾。你帮他把药材移进干处，他把空出的干篷布交给你：“门外还等着人。”', item: '干燥篷布', result: '篷布已经收好；搭棚前，得先看看高处的风从哪边压来。' },
        { anchor: 'lookout', title: '风口的一处松钉', speaker: '云阶高台', action: 'inspect', button: '查看风向与棚架', text: '高台草梢都朝山外倒，迎风一侧的旧棚架却松着一枚钉。你在木柱上标出需要加固的位置，记下将篷口背向来风。', item: '棚架修补记号', result: '加固位置和开口方向已明确，带篷布去作坊配好绑绳即可。' },
        { anchor: 'workshop', title: '一顶稳当的雨棚', speaker: '山路木工', action: 'craft', button: '添置绑绳与木钉', cost: { gold: 12 }, text: '木工备有新绳木钉，也愿意把旧篷的完好边绳拆给你。你只需多做一会儿活，便能省下这十二枚铜钱。', alternatives: [{ label: '拆取旧篷好绳并削钉 · 免费', text: '你挑出未磨损的边绳，削成两枚硬木钉，把松动的横梁扣紧。' }], item: '加固好的雨棚材料', result: '雨棚材料扎成一捆，迎风面也做了醒目的记号。' },
        { anchor: 'camp', title: '雨落在篷顶', speaker: '候诊的山民', action: 'deliver', button: '搭起候诊雨棚', text: '你按记号拉好迎风绳，将篷口朝向背风处。候诊的人挪到棚下时，第一阵雨恰好落在绷紧的篷顶。', result: '篷下留出了干燥的坐处，药箱与热水也都有了遮挡。' }
      ],
      reward: { gold: 28, xp: 30, virtue: 3 }, ending: '雨声再大，也没浇湿候诊人的衣襟。棚下多了一壶温水，来往的人会替下一位扶好布帘。', effect: '候诊营搭起加固雨棚，篷下摆出温水。'
    },
    {
      id: 'liuqige-missing-porter', region: 'liuqige', title: '山径求药人', summary: '沿失落的药牌找到被阻在山中的挑夫，将他的托付交给药房。',
      steps: [
        { anchor: 'arrival', title: '少了一个人的队伍', speaker: '求药妇人', action: 'talk', button: '询问挑夫去向', text: '求药队伍到了山门，替大家背行李的挑夫却没来。妇人说他去旧径拾药牌，牌背刻着“石桥村，三户”。', result: '你记下药牌上的刻字，沿旧径查找挑夫的踪迹。' },
        { anchor: 'ruins', title: '被踩进泥里的药牌', speaker: '旧径石隙', action: 'inspect', button: '拾起药牌', text: '药牌陷在泥里，旁边两种脚印一深一浅，通向临时营地。牌背的“三户”两字被他用布仔细包过。', item: '石桥村药牌', result: '药牌的主人就在附近，你循脚印前往营地。' },
        { anchor: 'camp', title: '被扣下的空背篓', speaker: '魔教拦路散兵', action: 'battle', button: '救出挑夫', text: '散兵扣住挑夫，要他替搜山队背器械。他把空背篓紧紧抱着，仍惦记着村里三户人家等药。', alternatives: [{ label: '用假车辙引开散兵', text: '你把弃在营外的空车推出显眼车辙，又在远处敲响货箱。散兵以为有大批货物经过，离营追去；挑夫趁机退到安全处。' }], item: '挑夫的求药便笺', result: '挑夫已脱身，能随求药队伍下山。他请你先把补写的便笺送进药房。' },
        { anchor: 'main', title: '把托付送到', speaker: '药房管事', action: 'deliver', button: '交付药牌与便笺', text: '管事核对药牌与便笺，在石桥村的三栏后逐一画下记号：“人和托付都没少，这就给他们安排。”', result: '药房收下求药资料，门外的队伍也得到了挑夫平安的消息。' }
      ],
      reward: { gold: 40, xp: 40, virtue: 3, herbs: 1 }, ending: '求药妇人接过便笺的回签，长长松了口气。空背篓重新放在山门内，等着装上回乡的东西。', effect: '求药队伍补齐，山门内摆回挑夫的背篓。'
    },
    {
      id: 'leizhuang-mortise', region: 'leizhuang', title: '旧庄榫合', summary: '从旧庄木件中找回相合的榫口，修好村里公用的长凳。',
      steps: [
        { anchor: 'workshop', title: '坐不稳的长凳', speaker: '庄边木匠', action: 'talk', button: '查看凳脚图样', text: '木匠把一张长凳倒放在地：“凳脚少了横撑。旧庄拆下的木件里有配套榫头，能用旧的，就不必多伐一棵树。”', item: '凳脚榫口图', result: '你记下窄口、宽肩的形状，去旧庄遗址挑选配件。' },
        { anchor: 'ruins', title: '旧木配旧榫', speaker: '旧庄木架', action: 'gather', button: '找出横撑', text: '旧木架下留着几根完好横撑，你依图选出肩部宽、尖端窄的一根。榫头上的浅刻提示着装配的方向。', item: '旧庄横撑', result: '横撑没有朽坏，只需到旧匠亭核对刻记，免得装反。' },
        { anchor: 'shrine', title: '匠亭装配记', speaker: '旧匠亭木版', action: 'puzzle', button: '确定装配方向', text: '木版画着“窄头入孔，宽肩抵外”的图样。反着装会卡在入口，肩部朝内又会撑裂凳脚。', puzzle: { hint: '窄头先入孔，宽肩停在凳脚外侧。', choices: [{ label: '宽肩先入，把榫头敲平', text: '宽肩无法入孔，硬敲只会伤木。', correct: false }, { label: '窄头入孔，宽肩抵外', text: '横撑的位置正好，宽肩能稳稳抵住凳脚。', correct: true }, { label: '削去宽肩，整根穿过', text: '少了宽肩便失去固定的位置，长凳仍会晃动。', correct: false }] }, result: '你确认了装配方式，把横撑带回作坊。' },
        { anchor: 'workshop', title: '一张能安心坐的凳', speaker: '庄边木匠', action: 'craft', button: '添置护木油', cost: { gold: 10 }, text: '木匠装好横撑，问你要不要添十枚铜钱上一层护木油。若不用新油，也可一起细磨毛刺，再用作坊余蜡封住接缝。', alternatives: [{ label: '细磨毛刺并用余蜡封缝 · 免费', text: '你顺着木纹磨平毛刺，把余蜡慢慢擦进接缝，凳脚摸起来再无扎手处。' }, { label: '稳住凳架，亲手压紧榫口', hero: 'daben', text: '你双手稳稳压住凳架，让木匠从容校准横撑，再把榫口合得紧紧的。' }], result: '长凳四脚落地，再重的担子放上去也不晃了。' }
      ],
      reward: { gold: 28, xp: 32, virtue: 2 }, ending: '旧庄的好木头没有被白白丢弃。新修的长凳摆到村口，挑担人终于能坐下来喝口茶。', effect: '村口摆出修稳的公用长凳。'
    },
    {
      id: 'leizhuang-fair-scale', region: 'leizhuang', title: '公秤无欺', summary: '查清粮袋标记与称量差额，用公用砝码校正村里的旧秤。',
      steps: [
        { anchor: 'cache', title: '对不上的粮重', speaker: '粮棚管事', action: 'inspect', button: '检查粮袋标记', text: '三袋粮分别标着七斤、七斤、六斤，入棚复称却多出一截。封口完好，问题也许出在秤上。', item: '七七六粮袋记条', result: '你抄下三袋标重，去问负责封袋的人是否另有包装重量。' },
        { anchor: 'side2', title: '一斤不藏在袋里', speaker: '封袋婶婶', action: 'talk', button: '核实封袋记录', text: '婶婶翻开封袋记录：“七、七、六都是粮食净重，袋重已经扣过。三袋凑整，是方便大家一眼核账。”', result: '你确认记条写的是净重，准备到作坊用标准砝码校秤。' },
        { anchor: 'workshop', title: '摆上多少砝码', speaker: '公秤木案', action: 'puzzle', button: '校正砝码', text: '木案上的标准砝码足够组合。三袋净重是七斤、七斤、六斤，应该用多少斤的标准砝码核对？', puzzle: { hint: '袋重已经扣过，直接把七、七、六相加。', choices: [{ label: '十四斤', text: '这里只算了前两袋，还少了一袋六斤。', correct: false }, { label: '二十一斤', text: '第三袋是六斤，并非七斤。你重新核对记条。', correct: false }, { label: '二十斤', text: '七加七再加六，正好二十斤。标准砝码让旧秤的偏差显了出来。', correct: true }] }, item: '公秤校验木签', result: '你调正秤星，写下校验木签，送到村中公示处。' },
        { anchor: 'main', title: '人人都能看见', speaker: '村中管事', action: 'deliver', button: '挂出校验木签', text: '管事没有把木签收进柜子，而是挂在公秤边：“以后谁拿来粮食，都可以先用标准砝码试一试。”', result: '校验结果公示，粮棚的三袋粮也重新过秤入册。' }
      ],
      reward: { gold: 30, xp: 32, virtue: 3 }, ending: '公秤旁留出一只放砝码的小盒。来往的人不再为一两个模糊的秤星争执。', effect: '公秤校正，秤旁挂出公开校验木签。'
    },
    {
      id: 'leizhuang-patrol', region: 'leizhuang', title: '鼓点归队', summary: '辨出林中异常的回响，找到被困的巡林人，并替归队队伍立好路记。',
      steps: [
        { anchor: 'camp', title: '少了一次回哨', speaker: '巡林队头', action: 'talk', button: '询问巡林信号', text: '队头敲了敲空水壶：“我们约好到高台便回三下。今早只听见一下，之后再没声音。你若经过，替我留意。”', result: '你记住三下回哨的约定，先到望台辨认异常回响。' },
        { anchor: 'lookout', title: '被风带来的敲击', speaker: '林边望台', action: 'inspect', button: '听清回响', text: '一声闷响从旧庄方向传来，随后是两下很轻的木响。节奏仍是三下，只是有人压低了声音，显然不敢暴露位置。', item: '巡林人的隐蔽回哨', result: '你认出求援的节奏，向旧庄遗迹赶去。' },
        { anchor: 'ruins', title: '旧墙后的巡林人', speaker: '魔教搜山散兵', action: 'battle', button: '逼退搜山散兵', text: '巡林人躲在旧墙后，几名散兵守着外头的窄口。他借破水壶敲出的回哨，终于等来了回应。', alternatives: [{ label: '敲响空庄，制造队伍赶来的声势', text: '你沿空心梁连敲几处，让回声从不同方向响起。散兵误以为整队巡林人已到，慌忙退入深林。' }, { label: '推开旧梁，接人从内侧脱身', hero: 'daben', text: '你稳稳挪开侧墙的旧梁，给巡林人留出一条可以通过的宽缝。' }], item: '巡林队回营木牌', result: '巡林人已从包围中脱身。他先去通知队头，请你把回营牌送到村口。' },
        { anchor: 'arrival', title: '这次三声都响亮', speaker: '守村少年', action: 'deliver', button: '挂回回营木牌', text: '少年认出回营木牌，朝林中响亮地敲了三下。远处很快传来同样的三声回应。', result: '回营木牌挂上村口架子，守村的人知道巡林队已经平安。' }
      ],
      reward: { gold: 40, xp: 40, virtue: 3 }, ending: '村口的回营牌重新凑齐。队头给空水壶换了根新绳，说以后无论风多大，都要让伙伴听见。', effect: '巡林回营牌补齐，村口恢复三声回哨。'
    },
    {
      id: 'waterfall-echo', region: 'waterfall', title: '雾中三声', summary: '核对瀑边巡路人的吹哨约定，把一条被误认的安全讯息送到营地。',
      steps: [
        { anchor: 'shrine', title: '避水石牌', speaker: '瀑边石亭', action: 'inspect', button: '读取旧哨约定', text: '亭中石牌刻着巡路人的约定：“一长两短，平路；两长一短，止步。”瀑水太响，近来常有人把次序听反。', item: '巡路哨约拓记', result: '你把两种节奏记清，准备到较高处听一次完整的回哨。' },
        { anchor: 'lookout', title: '从水声里分出哨声', speaker: '临瀑高台', action: 'inspect', button: '静听一轮回哨', text: '瀑声稍弱的间隙里，先来一声拉长的哨，随后两声短促轻响。你没有急着答复，等它重复一轮，次序仍完全相同。', item: '一长两短的回哨记', result: '信号已经听清，到旧哨台核对后就能给营地准确答复。' },
        { anchor: 'ruins', title: '该通行还是止步', speaker: '旧哨台', action: 'puzzle', button: '判读回哨', text: '记录是一长、两短；石牌写着“一长两短，平路；两长一短，止步”。营地还在等你判断。', puzzle: { hint: '长短和先后都要与石牌完全对应。', choices: [{ label: '报平路，可按原路通行', text: '回哨与平路约定一致，你在回报木片上划下通行记号。', correct: true }, { label: '报止步，封闭原路', text: '止步应是两长一短，与刚才的完整回哨不同。', correct: false }, { label: '没有听见任何约定信号', text: '你已经听到两轮相同节奏，可以按记录核对。', correct: false }] }, item: '核实后的通行木片', result: '你带着核实的木片，返回等候巡路消息的营地。' },
        { anchor: 'camp', title: '把误会留在雾里', speaker: '等候过山的挑夫', action: 'deliver', button: '交付通行消息', text: '挑夫照木片重新学了一遍长短次序：“多听一轮，再说清楚，真比一味大声喊管用。”', result: '营地收到了准确回报，并把两种哨号挂在篷边。' }
      ],
      reward: { gold: 28, xp: 34, virtue: 2 }, ending: '瀑声照旧轰鸣，山路上的消息却清楚了。下一次哨声响起，营地里已有几个人会一同数拍。', effect: '营地挂出长短哨号牌，通行旗展开。'
    },
    {
      id: 'waterfall-rope', region: 'waterfall', title: '悬桥新索', summary: '收齐桥索材料，重新编紧受力绳，把检查过的桥边安全线补全。',
      steps: [
        { anchor: 'arrival', title: '桥匠的绳结样', speaker: '瀑前桥匠', action: 'talk', button: '领下补索差事', text: '桥匠展示被水磨毛的侧索：“桥板还能过，扶索却得换。新麻存在料棚，拿来之前先按这个结样量好长度。”', item: '桥索结样', result: '你收好结样，到料棚领取补索所需的干麻绳。' },
        { anchor: 'cache', title: '给桥留足一段绳', speaker: '桥料棚', action: 'gather', button: '量取干麻绳', text: '料棚中的麻绳挂得高高的，避开了潮湿地面。你按结样量取一段，把余绳重新盘好放回。', item: '干麻绳束', result: '绳料备齐，下一步需要在作坊把受力结编紧。' },
        { anchor: 'workshop', title: '每一股都受力', speaker: '编索师傅', action: 'craft', button: '加配新护索套', cost: { gold: 15 }, text: '师傅把新护索套摆在案上。也可以将旧套拆开，只取完好布条，花些工夫交错缠紧，效果一样稳当。', alternatives: [{ label: '拆取好布条，交错缠紧 · 免费', text: '你将完好布条叠在绳索转角，再按结样编紧，逐股检查有没有松动。' }], item: '编紧的悬桥侧索', result: '侧索已经通过拉力检查，桥匠示意你把它带回临水桥头。' },
        { anchor: 'waterside', title: '两岸多一分稳当', speaker: '瀑前桥匠', action: 'deliver', button: '装好侧索', text: '桥匠固定远端，你将近端索环扣进石锚，确认人走过时绳结也不会滑动。桥板轻轻摇着，扶索已稳稳绷起。', result: '补索检查完成，桥边挂起“慢行勿挤”的新木片。' }
      ],
      reward: { gold: 34, xp: 34, virtue: 2 }, ending: '行人走过时，手终于能握住一条不松脱的扶索。桥匠把旧结样留在料棚，供后来修桥的人照着做。', effect: '悬桥侧索补齐，石锚挂上检查木片。'
    },
    {
      id: 'waterfall-watermark', region: 'waterfall', title: '水幕封存', summary: '从瀑边水位刻度找到旧哨藏匣的提示，取回被扣下的通行记录。',
      steps: [
        { anchor: 'waterside', title: '水线下的一点铜光', speaker: '瀑脚石壁', action: 'inspect', button: '察看铜片', text: '石壁上嵌着一小片铜，上刻“青苔止处，第三格”。附近没有钥匙孔，只有通往高台的三道浅刻线。', item: '水位铜片拓记', result: '提示指向刻度，需要到高台看清水线与青苔的边界。' },
        { anchor: 'lookout', title: '数到第三格', speaker: '望瀑刻度台', action: 'puzzle', button: '查找藏匣记号', text: '从高处能看见青苔止于一条白线；白线向上的第一格无痕，第二格画叉，第三格刻着一只方匣。', puzzle: { hint: '以青苔停止处的白线为起点，向上数到第三格。', choices: [{ label: '记下第一格', text: '第一格没有方匣记号，不符合铜片提示。', correct: false }, { label: '记下画叉的第二格', text: '画叉的格子标出了失效的旧藏处。', correct: false }, { label: '记下方匣所在的第三格', text: '第三格与铜片吻合，方匣旁的小箭头指向水幕后旧哨。', correct: true }] }, result: '你找到了藏匣的准确记号，转往旧哨检查石壁。' },
        { anchor: 'ruins', title: '被扣住的通行簿', speaker: '水幕后旧哨', action: 'inspect', button: '开启石壁木匣', text: '按照第三格的位置，你移开一块薄石，取出油布裹住的木匣。里面都是被扣下的山民通行簿，连孩子的名字也在其上。', item: '山民通行簿', result: '你将通行簿全部收好，准备从石亭一侧离开，却发现追索木匣的人已到。' },
        { anchor: 'shrine', title: '不能交回的名字', speaker: '追索木匣的散兵', action: 'battle', button: '护住通行簿', text: '散兵堵住石亭，想把通行簿抢回去继续勒索。亭后的巡路人示意，只要拖住他们片刻，名簿就能安全转交。', alternatives: [{ label: '留下空匣，把簿册交巡路人转移', text: '你将空木匣显眼地搁在石上，用谈话拖住散兵。巡路人从背风侧带走真正的簿册，等对方开匣时已无从追索。' }, { label: '用旧哨口令命他们退开', hero: 'tiaotiao', text: '你照旧哨规矩报出查验口令，反问谁准他们私扣民簿。几人心虚退开，簿册顺利转入巡路人手中。' }], result: '通行簿已交给山民保管，散兵失去了借名勒索的凭据。' }
      ],
      reward: { gold: 42, xp: 42, virtue: 3 }, ending: '木匣空了，旧哨的勒索牌也被拆下。山民把取回的名字揣在怀里，重新踏上自己的路。', effect: '旧哨勒索牌拆除，空木匣留作公用储物。'
    },
    {
      id: 'gallery-painted-road', region: 'gallery', title: '画卷藏路', summary: '把半幅山水画与实际峰形对照，确认一条被旧画记下的归村支路。',
      steps: [
        { anchor: 'main', title: '画里少了一笔', speaker: '行脚画师', action: 'talk', button: '借阅半幅山水', text: '画师摊开旧画：“祖父画的不是仙境，是他回家的路。可这处被折痕磨掉了，哪条支路才到山村，我已认不清。”', item: '缺角归村画卷', result: '你借来画卷，准备到高处把山形一一对照。' },
        { anchor: 'lookout', title: '三峰一溪入画', speaker: '观画台', action: 'inspect', button: '比对峰形', text: '画中最高的峰偏左，低矮双峰偏右，一条溪从中间穿过。站在望台上，三处都能找到，唯独转路处被亭顶遮住。', item: '峰形对照记', result: '你确认了画卷朝向，准备到石亭查看画上标记的转路符号。' },
        { anchor: 'shrine', title: '亭柱上的叶形', speaker: '溪山石亭', action: 'puzzle', button: '对照转路符号', text: '画角标着“循双叶，不循单叶”。亭柱外有三块路签：单叶朝溪、双叶朝竹林、空白朝高坡。', puzzle: { hint: '画卷已经对正朝向；转路标记是双叶。', choices: [{ label: '循单叶朝溪', text: '画角特地注明不循单叶，溪边是另一条渡路。', correct: false }, { label: '循双叶朝竹林', text: '双叶与画角标记相合，你找到了祖父笔下通向山村的支路。', correct: true }, { label: '循空白朝高坡', text: '空白路签没有与画卷对应的标记。', correct: false }] }, item: '补全的归村画卷', result: '你把双叶路签的位置补在画角，回区域入口交给等候消息的画师。' },
        { anchor: 'arrival', title: '画终于通向家门', speaker: '行脚画师', action: 'deliver', button: '归还补全画卷', text: '画师看见补上的双叶，忽然笑了：“小时候祖父让我捡这种叶子，我竟把它忘了。”他将画仔细卷好。', result: '画卷有了完整的归路，画师又临摹一张路引，留给后来的人。' }
      ],
      reward: { gold: 30, xp: 34, virtue: 2 }, ending: '入口多了一幅小小山水，画角写着清楚的双叶路记。它仍是一幅画，也成了一张有人情的地图。', effect: '入口挂出山水路引，双叶支路得到标注。'
    },
    {
      id: 'gallery-two-shores', region: 'gallery', title: '长滩两岸', summary: '按清单把过溪行李送到临时营地，再把收讫木签带回渡口。',
      steps: [
        { anchor: 'waterside', title: '行李先过，心才安', speaker: '长滩船工', action: 'talk', button: '领取转运清单', text: '船工指着岸上行李：“人已经在营地安顿好了，这些家什还压在岸边。先搬货棚里最怕潮的那箱，再请营地给个收讫签。”', item: '长滩转运清单', result: '你记下要优先搬运的箱号，去岸上货棚核领行李。' },
        { anchor: 'cache', title: '怕潮的一箱', speaker: '岸边货棚', action: 'gather', button: '核领封好的行李箱', text: '清单写着“蓝绳、木箱、两道封蜡”。你逐项核对，确认箱内是书本与冬衣，把它平稳地托上肩。', item: '蓝绳行李箱', result: '箱号与封蜡都吻合，可以送到已经安顿山民的营地。' },
        { anchor: 'camp', title: '收到了旧冬衣', speaker: '迁居山民', action: 'deliver', button: '交付行李箱', text: '山民解开箱盖，最上面是一件给孩子缝到一半的冬衣。他将收讫木签交给你：“这些小东西在，新地方也能慢慢像个家。”', item: '行李收讫木签', result: '行李箱已经交到主人手中，你带木签回渡口完成核账。' },
        { anchor: 'waterside', title: '给清单一个圆满', speaker: '长滩船工', action: 'deliver', button: '归还收讫木签', text: '船工把木签与箱号摆在一起，划掉清单上的这一栏。岸上的空位正好腾出来，给下一趟竹筏卸货。', result: '转运清单核销，渡口与营地都知道这箱行李已平安送达。' }
      ],
      reward: { gold: 28, xp: 30, virtue: 3 }, ending: '蓝绳箱不再孤零零留在岸上。营地的绳索间晒起一件旧冬衣，风里有了回家的气息。', effect: '岸边货位清空，营地晒起山民的冬衣。'
    },
    {
      id: 'gallery-false-flags', region: 'gallery', title: '竹影错旗', summary: '辨出被倒换的巡路旗记，清除借假旗诱人的伏点，并重新制作明确的路标。',
      steps: [
        { anchor: 'ruins', title: '插反的旗杆', speaker: '竹林旧哨', action: 'inspect', button: '察看旗底刻记', text: '旧哨的两根旗杆被拔动过。杆底刻着“白圈迎日，黑叉背日”，地上却将两者换了位置。', item: '巡路旗底拓记', result: '你记下白圈与黑叉的原定方向，去高处确认当天的日照位置。' },
        { anchor: 'lookout', title: '朝日的一面', speaker: '竹海望台', action: 'puzzle', button: '找出安全旗位', text: '朝日的坡面明亮，背日的坡面沉在竹影里。拓记写得明确：白圈迎日，黑叉背日。', puzzle: { hint: '用日照与刻记核对旗位，别只看被人搬动的旗。', choices: [{ label: '将白圈记在迎日坡', text: '白圈位置复原，假旗引向背日伏点的意图也显了出来。', correct: true }, { label: '将白圈记在背日坡', text: '这正是被人倒换后的错误位置。', correct: false }, { label: '两处都记成白圈', text: '抹去区别会让后来的人再次误入伏点。', correct: false }] }, result: '你辨出伏点所在，绕向营地处理躲在假旗后的人。' },
        { anchor: 'camp', title: '等来的不是迷路人', speaker: '埋伏的魔教散兵', action: 'battle', button: '清除伏点', text: '几名散兵正等人沿假白圈走进营口。你已经看清地势，这回他们等来的，是知道真相的人。', alternatives: [{ label: '移走假旗，让散兵误以为伏点暴露', text: '你在伏点外显眼处立起黑叉，又连续敲响巡路梆子。散兵见暗记被识破，收起埋伏匆匆离开。' }, { label: '用调哨手势让他们撤营', hero: 'tiaotiao', text: '你借竹影打出熟悉的调哨手势，等几人顺势退开，再收掉全部假旗。' }], item: '收回的巡路旧旗', result: '伏点已清，旧旗也全部收回，需要去作坊加上更易分辨的文字标记。' },
        { anchor: 'workshop', title: '颜色之外还有字', speaker: '竹工师傅', action: 'craft', button: '添置耐雨墨料', cost: { gold: 8 }, text: '师傅建议在白圈上加“通”字，黑叉上加“止”字。你可添钱用耐雨墨，也可将字刻在旧竹片上，挂到旗杆下。', alternatives: [{ label: '在旧竹片刻字，再绑上旗杆 · 免费', text: '你将“通”“止”刻得清清楚楚，又磨圆竹片边角，结实地绑在旗杆下。' }], result: '新路标同时有图形和文字，巡路人不必再只凭颜色判断。' }
      ],
      reward: { gold: 42, xp: 40, virtue: 3 }, ending: '竹林的旗记各归其位。风一吹，旗杆下的“通”“止”木片轻轻相碰，提醒行人先看清再走。', effect: '假旗清除，路标增加“通”“止”字片。'
    },
    {
      id: 'baicao-wind-song', region: 'baicao', title: '风琴失弦', summary: '修好谷中用来记录风向的竹风琴，再依谱校准三支发声竹管。',
      steps: [
        { anchor: 'main', title: '少了一声的风', speaker: '谷中学琴人', action: 'talk', button: '查看风琴缺口', text: '学琴人指着无声的竹风琴：“它并非什么宝物，只是把风分成三声。中间竹管裂了，旧亭旁留有适合替换的竹节。”', item: '三管风琴小谱', result: '你接过标着低、中、高三声的小谱，去旧亭找一节未裂的竹材。' },
        { anchor: 'ruins', title: '留在亭后的竹节', speaker: '旧亭竹架', action: 'gather', button: '选取完好竹节', text: '竹架上放着早已裁好的余料。你轻叩几节，选出声音清亮、没有裂纹的一段，再把散开的余料重新码好。', item: '完好的发声竹节', result: '竹材找到了，带去作坊按小谱修成相同长度即可。' },
        { anchor: 'workshop', title: '给风一道回声', speaker: '制琴竹工', action: 'craft', button: '换上新挂弦', cost: { gold: 12 }, text: '竹工修好竹管，桌边有十二枚铜钱一束的新挂弦。你也可以耐心拆取旧弦的完好部分，重新编成三股。', alternatives: [{ label: '重编完好的旧挂弦 · 免费', text: '你挑出未断的弦股，错开接头重新编紧，三支竹管便能平稳悬起。' }, { label: '亲手校弦，留住谷中音色', hero: 'dada', text: '你细听竹管的轻响，重新调整挂弦松紧，让三声各有清楚的起落。' }], item: '修好的三管风琴', result: '风琴修复，最后还需到通风的高处按小谱排列竹管。' },
        { anchor: 'lookout', title: '风从低处起', speaker: '谷口听风台', action: 'puzzle', button: '按谱悬挂竹管', text: '小谱写着“自左而右：低、中、高”。三支管分别缀着低、中、高的纸签，应该按什么顺序挂回？', puzzle: { hint: '小谱与纸签完全对应，左边起第一声是低音。', choices: [{ label: '高、低、中', text: '第一支便与小谱不同，再对照一次纸签。', correct: false }, { label: '低、中、高', text: '三支管依谱悬起，清楚的三声随山风依次荡开。', correct: true }, { label: '中、高、低', text: '小谱要求从低音开始，这样会打乱原来的次序。', correct: false }] }, result: '风琴的三声重新齐全，听风台恢复了辨认风起风落的声音。' }
      ],
      reward: { gold: 30, xp: 34, virtue: 2 }, ending: '谷风吹过，三支竹管一前一后应和。学琴人认真把小谱抄了一份，挂在风琴旁。', effect: '听风台挂回三管风琴，添上校音小谱。'
    },
    {
      id: 'baicao-irrigation', region: 'baicao', title: '分水护苗', summary: '修补药圃的分水竹槽，按两畦幼苗的需求分配有限清水。',
      steps: [
        { anchor: 'herb', title: '两畦不同的小苗', speaker: '照苗药农', action: 'inspect', button: '察看分水木签', text: '一畦新苗需水两份，一畦耐旱苗只需一份。药农把需求写在木签上，可上游竹槽裂了，水全漏到了空地。', item: '两份一份的分水木签', result: '你记下两畦所需，先去料棚取一节能修补竹槽的竹材。' },
        { anchor: 'cache', title: '半筒竹槽', speaker: '谷中料棚', action: 'gather', button: '领取补槽竹材', text: '料棚有一段剖好的半筒竹，与旧槽宽度相当。旁边还留着绑槽的藤条，药农早已备好，只差有人走这一程。', item: '补槽竹材与藤条', result: '修补材料备齐，你把它带到水边分流处。' },
        { anchor: 'waterside', title: '三份水如何分', speaker: '分流石槽', action: 'puzzle', button: '调整分水挡片', text: '补槽后，一轮共有三份水可用。木签注明：新苗需两份，耐旱苗需一份。两块挡片可以调出三种分法。', puzzle: { hint: '总水量三份，按木签把两份留给新苗、一份给耐旱苗。', choices: [{ label: '新苗一份，耐旱苗两份', text: '需求被调反了，新苗仍会缺水。', correct: false }, { label: '新苗三份，耐旱苗零份', text: '耐旱苗也需要一份，不能把它的水全部取走。', correct: false }, { label: '新苗两份，耐旱苗一份', text: '挡片分流与木签相合，两畦都有了所需的水。', correct: true }] }, item: '校准的分水记录', result: '清水按两比一分向两畦，你回药圃查看落水口。' },
        { anchor: 'herb', title: '到根边才算到', speaker: '照苗药农', action: 'deliver', button: '核对两畦落水', text: '你与药农逐畦查看，确认水真正落进土沟，没有从接缝白白漏走。药农将新的分水记录系在入口。', result: '两畦幼苗都获得合适的水量，补槽与分流一并完成。' }
      ],
      reward: { gold: 26, xp: 32, virtue: 3, herbs: 1 }, ending: '幼苗的叶片渐渐挺起来。分水记录留在竹槽边，后来的人也知道该怎样照料不同的小苗。', effect: '药圃竹槽修好，分水木签重新挂齐。'
    },
    {
      id: 'baicao-returning-cub', region: 'baicao', title: '谷口遗踪', summary: '沿谷口遗落的红布与脚印找到失散的小兽，拆去猎人的临时围栏。',
      steps: [
        { anchor: 'arrival', title: '红布挂在低枝', speaker: '谷口竹径', action: 'inspect', button: '查看细小足迹', text: '低枝挂着一角红布，泥地上有细小爪印，也有沉重靴印。红布的边缘缝着歪歪扭扭的一朵花。', item: '缝花红布角', result: '这像是谷中孩子做的小领巾，问问附近的人也许能找到线索。' },
        { anchor: 'side1', title: '给小兽的领巾', speaker: '谷中小姑娘', action: 'talk', button: '询问红布来历', text: '小姑娘一眼认出布角：“我给受伤后放归的小狐狸做的，它伤好后一直在谷边。今早有人扛着围栏进了林子。”', result: '你答应去查看临时营地，先确认小狐狸是否平安。' },
        { anchor: 'camp', title: '围栏后的小影子', speaker: '魔教猎手散兵', action: 'battle', button: '击退猎手，打开围栏', text: '小狐狸缩在临时围栏后，几名猎手正把更多网索往竹径搬。打开围栏之前，必须让这些人离开。', alternatives: [{ label: '在空营制造火石响，引人离开', text: '你在无人空棚敲响火石与铁片，让猎手误以为器具出了问题。几人赶去查看，你趁机拆开围栏，收走网索。' }, { label: '循谷风绕后，先拆围栏暗扣', hero: 'dada', text: '你辨着风声绕过猎手，先解开背面的暗扣，让小狐狸沿熟悉的竹径脱身，再收起残余网索。' }], item: '取回的缝花领巾', result: '小狐狸沿竹径回到了安全处，猎网被收走，你带回它脱落的领巾报信。' },
        { anchor: 'shrine', title: '不必把它留在身边', speaker: '等消息的小姑娘', action: 'deliver', button: '归还领巾并报平安', text: '小姑娘接过领巾，望见远处竹影里闪过的小尾巴。“平安就好。”她没有追过去，只把领巾轻轻叠好。', result: '你告诉她围栏已经拆除，小狐狸仍可以自由留在谷中的山林。' }
      ],
      reward: { gold: 38, xp: 38, virtue: 3 }, ending: '临时围栏堆成了待拆的废木，竹径重新敞开。小姑娘把领巾系在自己腕上，安静听了一会儿林中的动静。', effect: '营地猎栏与网索清走，竹径恢复通行。'
    },
    {
      id: 'tianzi-weather', region: 'tianzi', title: '山风测候', summary: '用云旗和旧刻核对高处风候，将准确的通行消息送回登山营。',
      steps: [
        { anchor: 'arrival', title: '先看风，再上山', speaker: '守阶山民', action: 'talk', button: '领下测候记录', text: '山民递来一片木板：“我们只按眼前旗相判断这一小段路。旗直、云低要候着；旗缓、云开才往前。替营地看清再回报。”', item: '登阶测候木板', result: '你记下两组旗相与云相，到高处实地查看。' },
        { anchor: 'lookout', title: '云开的一刻', speaker: '迎风望台', action: 'inspect', button: '观察云旗', text: '你在稳固的望台停了一会儿：旗布已从笔直变为缓缓摆动，贴阶的低云也散开，石阶边缘重新显了出来。', item: '旗缓云开的观察记', result: '观察完整记下了旗缓与云开两项，去旧台核对通行木刻。' },
        { anchor: 'ruins', title: '不只看一面旗', speaker: '旧台测候刻', action: 'puzzle', button: '核对通行条件', text: '旧刻与木板相同：“旗缓、云开，两项齐备，报此段可行。”你刚才观察到两项均已出现。', puzzle: { hint: '这是区域任务的局部风候规则，需要旗缓与云开同时满足。', choices: [{ label: '只因看见旗，就报可行', text: '仅仅看见旗不够，还要核对旗的状态和云是否散开。', correct: false }, { label: '两项齐备，报此段可行', text: '观察与旧刻一致，你写下附有两项依据的回报。', correct: true }, { label: '无论之后怎样，都报整座山永久安全', text: '局部观察不能说明整座山和之后的风候，只应回报眼前这一段。', correct: false }] }, item: '本段通行回报', result: '你带着写清依据的木板，回到登山营交给守路的人。' },
        { anchor: 'camp', title: '把看到的说清楚', speaker: '登山营管事', action: 'deliver', button: '交付测候回报', text: '管事照着木板换好路旗，又让下一班守路人接着观察：“知道为什么能走，也才知道何时该停。”', result: '营地收到准确回报，这一班登阶队伍开始有序准备。' }
      ],
      reward: { gold: 30, xp: 34, virtue: 2 }, ending: '通行回报附在营地路牌旁，留下了当时所见的云与旗。高山的约定，多了一份认真交接。', effect: '登山营更新云旗记录与本段通行牌。'
    },
    {
      id: 'tianzi-old-platform', region: 'tianzi', title: '古台石契', summary: '查清古台松动石座的尺寸，配好石楔，让路过的人有一处稳固歇脚点。',
      steps: [
        { anchor: 'ruins', title: '一块晃动的石座', speaker: '古台守望人', action: 'inspect', button: '检查石座缝隙', text: '古台边的石座有些松动，守望人先围起了细绳。你在安全一侧量过缝隙，发现旧石楔已经碎裂，只须按尺寸换新。', item: '古台石楔尺寸记', result: '缺口的大小记清了，到料堆找一块能加工的旧石料即可。' },
        { anchor: 'cache', title: '旧料中的完整一角', speaker: '高山料堆', action: 'gather', button: '挑选补楔石料', text: '料堆中的石料都来自先前修阶剩下的边角。你依尺寸挑了一块没有裂缝的，没动护坡上原本稳固的石头。', item: '完整的补楔石料', result: '石料足够加工成楔，需要借作坊工具将受力面磨平。' },
        { anchor: 'workshop', title: '磨到能够贴合', speaker: '修阶石匠', action: 'craft', button: '添置细磨石砂', cost: { gold: 12 }, text: '石匠已有粗工具，十二枚铜钱可添些细砂。若自己多磨一阵，也可用备在作坊的旧磨石把接触面一点点磨平。', alternatives: [{ label: '用旧磨石耐心磨平 · 免费', text: '你反复比对尺寸，沿着旧磨石慢慢磨削，直到两面都贴合样板。' }], item: '配好的古台石楔', result: '石楔尺寸合适，棱角也已修平，可以送往石亭安装。' },
        { anchor: 'shrine', title: '落脚处稳如承诺', speaker: '古台守望人', action: 'deliver', button: '固定石座并复查', text: '守望人支稳石座，你将新楔推入缝中。两人再从不同方向轻推检查，石座终于不再晃动，临时围绳也可以撤下。', result: '石座固定并完成复查，古台多了一处稳固的歇脚位置。' }
      ],
      reward: { gold: 32, xp: 32, virtue: 2 }, ending: '有人把水壶放在刚修好的石座旁，招呼后来的人坐一会儿。高处的风很大，脚下这一小处却已经稳了。', effect: '古台石座固定，临时围绳撤下。'
    },
    {
      id: 'tianzi-homeward-book', region: 'tianzi', title: '归山名簿', summary: '找回登山营遗失的名簿，护住受阻的回报人，让每一份归来的消息都有名字。',
      steps: [
        { anchor: 'camp', title: '不能只数旗子', speaker: '营地记事人', action: 'talk', button: '询问名簿去向', text: '记事人翻着空夹板：“旗子凑齐了，也未必人人都回了。我把登记簿借给旧台回报人，他还没送回来。”', result: '你记下名簿的蓝线装订，前往旧台查找回报人。' },
        { anchor: 'ruins', title: '蓝线装订的薄册', speaker: '旧台石案', action: 'inspect', button: '收好登记簿', text: '薄册仍在石案上，夹着一张便条：“高台有人被截，我去报信。”册上几栏空着，需要有确切消息才能补全。', item: '蓝线归山名簿', result: '你将名簿收好，赶往高处查明回报人遇到的阻碍。' },
        { anchor: 'lookout', title: '被截住的回报', speaker: '占道的魔教散兵', action: 'battle', button: '护回报人脱困', text: '几名散兵占着望台出口，扣下了来报平安的人。那人手里攥着几张姓名木片，即便被推搡也没有松开。', alternatives: [{ label: '利用空台回声，制造巡山队抵达的信号', text: '你借空台的回声敲出多处脚步，又将营地布旗高高扬起。散兵以为援手已到，匆忙让开出口，回报人带着姓名木片脱困。' }], item: '核实平安的姓名木片', result: '回报人脱困，木片上的几位山民都已有确切平安消息。你带着记录前往会合处。' },
        { anchor: 'main', title: '每个名字都写清', speaker: '会合处记事人', action: 'deliver', button: '补全归山登记', text: '记事人将木片与名簿一一对照，补上空栏，再请你复核：“远远看见一面旗很安心，知道旗后的人是谁，更安心。”', result: '名簿逐名核对，全部确定的平安消息都写回了原来的位置。' }
      ],
      reward: { gold: 44, xp: 42, virtue: 3, herbs: 1 }, ending: '蓝线薄册重新放回营地的夹板。它没有记下多少剑光，只记着这一程里，谁替谁带回了一句平安。', effect: '归山名簿补全，会合处挂出实名平安木片。'
    }
  ]
};
