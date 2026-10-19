/* Local game translations. Never change level geometry, IDs, save keys or object labels. */
(function () {
  'use strict';
  const locales = ['zh-Hans', 'zh-Hant', 'en'];
  const storageKey = 'neon-arcade.locale';
  const messages = {
    'title': ['吞城漫游 · HOLLOW CITY', '吞城漫遊 · HOLLOW CITY', 'HOLLOW CITY · A Little Hole, a Whole City'],
    'brand': ['吞城漫游', '吞城漫遊', 'A LITTLE HOLE. A WHOLE CITY.'],
    'language': ['游戏语言', '遊戲語言', 'Game language'],
    'world': ['等距城市游戏场景', '等距城市遊戲場景', 'Isometric city game scene'],
    'skins': ['换皮肤', '換造型', 'Skins'],
    'volume': ['音量', '音量', 'Volume'],
    'volumeLabel': ['背景音乐与音效音量', '背景音樂與音效音量', 'Music and sound effects volume'],
    'help': ['玩法说明', '玩法說明', 'How to play'],
    'pauseLabel': ['暂停游戏', '暫停遊戲', 'Pause game'],
    'hero': ['把整座城市<br>装进口袋<span>。</span>', '把整座城市<br>裝進口袋<span>。</span>', 'A whole city.<br>In your pocket<span>.</span>'],
    'intro': ['穿过钟楼集市，走进玻璃花房。<br>十六座小城，十六种不同的漫游。', '穿過鐘樓市集，走進玻璃花房。<br>十六座小城，十六種不同的漫遊。', 'From clocktower markets to glass gardens. <br>Sixteen little cities. Sixteen ways to wander.'],
    'wardrobe': ['我的黑洞 · 12 款自由换装', '我的黑洞 · 12 款自由換裝', 'YOUR HOLE · 12 FREE SKINS'],
    'wardrobeHint': ['选一圈，陪你逛小城', '選一圈，陪你逛小城', 'Pick a companion for your stroll'],
    'campaign': ['章节挑战', '章節挑戰', 'Campaign'],
    'zen': ['自在漫游', '自在漫遊', 'Free roam'],
    'campaignTag': ['CAMPAIGN', 'CAMPAIGN', 'BEAT THE CLOCK'],
    'zenTag': ['NO TIMER', 'NO TIMER', 'NO TIMER'],
    'campaignDesc': ['规划成长路线，在时间结束前吞下金色标记地标', '規劃成長路線，在時間結束前吞下金色標記地標', 'Grow along your route. Collect every golden landmark before time runs out.'],
    'zenDesc': ['没有倒计时，也没有失败。慢慢成长，收藏整座城市', '沒有倒數計時，也沒有失敗。慢慢成長，收藏整座城市', 'No timer, no failure. Grow at your own pace and collect the whole city.'],
    'chooseDistrict': ['下一站，哪里？', '下一站，哪裡？', 'Where to next?'],
    'takeTime': ['留一点时间，给自己', '留一點時間，給自己', 'A little time for yourself'],
    'districtCount': ['{count} 座街区', '{count} 座街區', '{count} DISTRICTS'],
    'start': ['开始漫游', '開始漫遊', 'Start wandering'],
    'again': ['再逛一次', '再逛一次', 'Wander again'],
    'preparing': ['正在准备街景…', '正在準備街景…', 'Preparing the city…'],
    'controls': ['WASD / 方向键 · 拖动或触屏移动<br><span>离线可玩 · 无广告 · 所有关卡开放试玩</span>', 'WASD / 方向鍵 · 拖曳或觸控移動<br><span>離線可玩 · 無廣告 · 所有關卡開放試玩</span>', 'WASD / arrow keys · Drag with mouse or touch<br><span>Works offline · No ads · Every district unlocked</span>'],
    'footer': ['原创等距城市吞噬游戏', '原創等距城市吞噬遊戲', 'An original isometric city-swallowing game'],
    'timeLeft': ['剩余时间', '剩餘時間', 'TIME LEFT'],
    'minimap': ['地图，金色为任务地标', '地圖，金色為任務地標', 'Minimap. Golden markers show target landmarks.'],
    'hint': ['拖动屏幕移动 · P / Esc 暂停 · R 重开', '拖曳螢幕移動 · P / Esc 暫停 · R 重開', 'Drag to move · P / Esc to pause · R to restart'],
    'skinTitle': ['今天，带哪一圈出门？', '今天，帶哪一圈出門？', 'Who is coming along today?'],
    'skinClose': ['关闭皮肤选择', '關閉造型選擇', 'Close skin picker'],
    'skinDescription': ['12 款皮肤，自由换装。仅改变外观，不影响吞噬与成长。方向键切换卡片，Enter 选用。', '12 款造型，自由換裝。僅改變外觀，不影響吞噬與成長。方向鍵切換卡片，Enter 選用。', '12 free skins. Looks only: swallowing and growth stay the same. Use arrow keys to browse and Enter to choose.'],
    'skinGrid': ['十二款黑洞皮肤', '十二款黑洞造型', 'Twelve hole skins'],
    'skinDone': ['就带这一圈', '就帶這一圈', 'Take this one'],
    'selected': ['已选择', '已選擇', 'Selected'],
    'choose': ['选择', '選擇', 'Choose'],
    'skinChange': ['更换皮肤 · {name}', '更換造型 · {name}', 'Change skin · {name}'],
    'skinAria': ['更换皮肤，当前{name}，共12款', '更換造型，目前為{name}，共12款', 'Change skin. Current: {name}. 12 skins available.'],
    'skinShowcaseAria': ['当前{name}，打开12款黑洞皮肤', '目前為{name}，開啟12款黑洞造型', 'Current: {name}. Browse 12 hole skins.'],
    'skinStored': ['已换上{name} · 自动记住选择', '已換上{name} · 自動記住選擇', '{name} selected · Choice saved'],
    'skinSession': ['已换上{name} · 本次有效，浏览器未允许保存', '已換上{name} · 本次有效，瀏覽器未允許儲存', '{name} selected · This session only; browser storage is unavailable'],
    'skinCurrent': ['当前：{name} · 选择后立即生效', '目前：{name} · 選擇後立即生效', 'Current: {name} · Changes apply immediately'],
    'musicRetry': ['♪ 重试', '♪ 重試', '♪ Retry'],
    'musicOn': ['♪ 音乐', '♪ 音樂', '♪ Music'],
    'musicOff': ['♪ 静音', '♪ 靜音', '♪ Muted'],
    'musicRetryAria': ['重试开启背景音乐', '重試開啟背景音樂', 'Retry playing background music'],
    'musicEnable': ['开启背景音乐', '開啟背景音樂', 'Enable background music'],
    'musicMute': ['静音背景音乐与音效', '靜音背景音樂與音效', 'Mute music and sound effects'],
    'musicUnmute': ['开启背景音乐与音效', '開啟背景音樂與音效', 'Enable music and sound effects'],
    'musicUnavailable': ['音乐暂时未能播放 · 点按重试', '音樂暫時未能播放 · 點按重試', 'Music could not play · Tap to retry'],
    'musicCredit': ['原创配乐：口袋里的星期天 · {status}', '原創配樂：口袋裡的星期天 · {status}', 'Original score: Pocket Sunday · {status}'],
    'musicTap': ['点按开始播放', '點按開始播放', 'Tap to play'],
    'musicPlaying': ['播放中', '播放中', 'Playing'],
    'musicPreparing': ['正在准备', '正在準備', 'Preparing'],
    'musicPaused': ['已随游戏暂停', '已隨遊戲暫停', 'Paused with the game'],
    'musicMuted': ['已静音', '已靜音', 'Muted'],
    'targetsBrief': ['{time} / {count} 处目标', '{time} / {count} 處目標', '{time} / {count} targets'],
    'zenBrief': ['不限时 / {count} 件城市收藏', '不限時 / {count} 件城市收藏', 'No timer / {count} city objects'],
    'record': ['个人记录：{time} · 已吞 {count} 件', '個人紀錄：{time} · 已吞 {count} 件', 'Personal best: {time} · {count} objects swallowed'],
    'startCampaign': ['先吞街角小物，再挑战金色地标', '先吞街角小物，再挑戰金色地標', 'Start with small objects, then collect the golden landmarks.'],
    'startZen': ['不必赶路。整座城市，都在等你', '不必趕路。整座城市，都在等你', 'Take your time. The whole city is waiting for you.'],
    'pauseTitle': ['城市会等你', '城市會等你', 'The city can wait'],
    'pauseBody': ['已经暂停，倒计时也停下了。', '已經暫停，倒數計時也停下了。', 'Paused. The timer is taking a break too.'],
    'resume': ['继续漫游', '繼續漫遊', 'Keep wandering'],
    'changeSkin': ['更换皮肤', '更換造型', 'Change skin'],
    'restart': ['重新开始', '重新開始', 'Restart'],
    'selectDistrict': ['选择街区', '選擇街區', 'Choose a district'],
    'helpTitle': ['一口，一座城', '一口，一座城', 'One bite. One city.'],
    'helpBody': ['用 WASD、方向键，或在空白处按住拖动来移动黑洞。触屏拖动的距离决定速度。\n\n靠近能装下的物体会自动吞噬；大物体旁会显示所需等级。吞噬获得成长值，升级后能吞更大的东西，镜头也会拉远。\n\n章节挑战：时间结束前吞掉全部金色标记地标，不需要清空杂物。\n自在漫游：没有倒计时，6 级后仍会越吞越大、越走越快。清空城市即可收藏这座街区。\n\nP / Esc 暂停 · R 重开 · 切换标签页自动暂停', '用 WASD、方向鍵，或在空白處按住拖曳來移動黑洞。觸控拖曳的距離決定速度。\n\n靠近能裝下的物體會自動吞噬；大物體旁會顯示所需等級。吞噬獲得成長值，升級後能吞更大的東西，鏡頭也會拉遠。\n\n章節挑戰：時間結束前吞掉全部金色標記地標，不需要清空雜物。\n自在漫遊：沒有倒數計時，6 級後仍會越吞越大、越走越快。清空城市即可收藏這座街區。\n\nP / Esc 暫停 · R 重開 · 切換分頁自動暫停', 'Move with WASD, arrow keys, or drag an empty part of the screen. Drag farther to move faster.\n\nNearby objects are swallowed automatically when they fit. Larger objects show the required level. Swallow objects to grow, unlock bigger bites, and widen your view.\n\nCampaign: collect every golden landmark before time runs out. Small objects can be left behind.\nFree roam: no timer. Growth and speed keep increasing beyond level 6. Clear the city to complete the district.\n\nP / Esc: pause · R: restart · Switching tabs pauses the game'],
    'gotIt': ['明白了', '明白了', 'Got it'],
    'next': ['下一站', '下一站', 'Next district'],
    'playAgain': ['再来一次', '再來一次', 'Play again'],
    'districtMap': ['街区地图', '街區地圖', 'District map'],
    'retry': ['立即重试', '立即重試', 'Try again'],
    'tryZen': ['无计时逛这张图', '無計時逛這張圖', 'Explore without a timer'],
    'noTimerToast': ['这次没有倒计时，慢慢来', '這次沒有倒數計時，慢慢來', 'No timer this time. Take it easy.'],
    'wonZenTitle': ['整座城市，收入囊中', '整座城市，收入囊中', 'A city in your pocket'],
    'wonTitle': ['这一站，收下了', '這一站，收下了', 'District collected'],
    'lostTitle': ['差一点，就吞下整座城', '差一點，就吞下整座城', 'So close to one whole city'],
    'wonZenBody': ['最后一片街景也落进口袋。下一座城市，按你的节奏来。', '最後一片街景也落進口袋。下一座城市，按你的節奏來。', 'The last little piece is in your pocket. The next city can wait for your pace.'],
    'wonBody': ['所有标记地标已吞噬。留下的小物件，不影响这场胜利。', '所有標記地標已吞噬。留下的小物件，不影響這場勝利。', 'Every marked landmark is collected. Any small objects left behind do not affect your win.'],
    'lostBody': ['已完成 {count} / {total} 个地标。\n先沿小物密集的街道积累成长，再前往金色目标。重试保留同一布局。', '已完成 {count} / {total} 個地標。\n先沿小物密集的街道累積成長，再前往金色目標。重試保留同一配置。', '{count} / {total} landmarks collected.\nGrow along streets full of small objects before heading to golden targets. Retrying keeps the same layout.'],
    'elapsed': ['漫游用时', '漫遊用時', 'Time wandering'],
    'eaten': ['吞噬物件', '吞噬物件', 'Objects swallowed'],
    'finalLevel': ['最终等级', '最終等級', 'Final level'],
    'objectiveCampaign': ['地标收藏 {count} / {total}', '地標收藏 {count} / {total}', 'Landmarks {count} / {total}'],
    'objectiveZen': ['城市收藏 {count} / {total}', '城市收藏 {count} / {total}', 'City objects {count} / {total}'],
    'objectiveCampaignHint': ['金色菱形是目标 · 不必清理全部小物', '金色菱形是目標 · 不必清理全部小物', 'Golden diamonds are targets · Small objects are optional'],
    'objectiveZenHint': ['不设时限 · 清空后解锁收藏记录', '不設時限 · 清空後解鎖收藏紀錄', 'No time limit · Clear the city to record your collection'],
    'xp': ['成长值 {xp}', '成長值 {xp}', 'Growth {xp}'],
    'maxSize': ['最大尺寸 · 整座城市都装得下', '最大尺寸 · 整座城市都裝得下', 'Maximum size · The whole city fits'],
    'endlessGrowth': ['半径 {radius}m · 越大越快 · 再收集 {xp} 点继续长大', '半徑 {radius}m · 越大越快 · 再收集 {xp} 點繼續長大', 'Radius {radius}m · Bigger and faster · {xp} growth to next level'],
    'growthHint': ['还差 {xp} 点 → {unlocks}', '還差 {xp} 點 → {unlocks}', '{xp} growth to go → {unlocks}'],
    'nearestLandmark': ['最近地标', '最近地標', 'Nearest landmark'],
    'nearestObject': ['最近收藏', '最近收藏', 'Nearest object'],
    'needLevel': [' · 需{level}级', ' · 需{level}級', ' · Needs level {level}'],
    'needGrowth': [' · 需继续长大', ' · 需繼續長大', ' · Grow a little more'],
    'food': ['可吞物件', '可吞物件', 'Ready to swallow'],
    'complete': ['收藏完成', '收藏完成', 'Collection complete'],
    'milestone': ['已收藏 {count} 件街景', '已收藏 {count} 件街景', '{count} city objects collected'],
    'levelUp': ['升至 {level} 级 · {unlocks}', '升至 {level} 級 · {unlocks}', 'Level {level} · {unlocks}'],
    'keepGrowing': ['越大越快 · 继续漫游', '越大越快 · 繼續漫遊', 'Bigger and faster · Keep wandering'],
    'canvas.grow': ['还需继续长大', '還需繼續長大', 'Keep growing'],
    'canvas.needLevel': ['需要 {level} 级', '需要 {level} 級', 'Needs level {level}']
  };
  const ranks = [
    ['街角访客','街角訪客','Street Visitor'],['车道漫步','車道漫步','Lane Wanderer'],['街区收藏家','街區收藏家','District Collector'],['屋顶旅行者','屋頂旅行者','Rooftop Traveler'],['天际线猎手','天際線獵手','Skyline Hunter'],['城市吞噬者','城市吞噬者','City Swallower'],['无尽漫游者','無盡漫遊者','Endless Wanderer']
  ];
  const unlocks = [
    ['街边小物 / 招牌 / 路灯','街邊小物 / 招牌 / 路燈','Small objects / signs / lamps'],['座椅 / 植物 / 小装置','座椅 / 植物 / 小裝置','Benches / plants / fixtures'],['摊位 / 小车 / 船只','攤位 / 小車 / 船隻','Stalls / cars / boats'],['街角建筑','街角建築','Small buildings'],['大型建筑 / 设施','大型建築 / 設施','Large buildings / facilities'],['城市地标 / 全部建筑','城市地標 / 全部建築','City landmarks / all buildings']
  ];
  const skinText = {
    original:[['原初圈','原初圈','Original Ring'],['熟悉的城市入口','熟悉的城市入口','Your familiar gateway to the city']],
    cat:[['猫咪圈','貓咪圈','Kitten Ring'],['耳朵竖起，尾巴绕一圈','耳朵豎起，尾巴繞一圈','Perky ears and a curling tail']],
    nailong:[['奶龙圈','奶龍圈','Cream Dragon'],['圆顶软坡，像一小座奶油山','圓頂軟坡，像一小座奶油山','A soft little hill of golden cream']],
    bunny:[['月兔圈','月兔圈','Moon Bunny'],['带一点月光去散步','帶一點月光去散步','Take a little moonlight on your walk']],
    panda:[['熊猫圈','熊貓圈','Panda Ring'],['黑白软团，慢慢逛街','黑白軟團，慢慢逛街','A soft black-and-white strolling buddy']],
    fox:[['赤狐圈','赤狐圈','Red Fox'],['尖尖耳朵，暖橙色的陪伴','尖尖耳朵，暖橙色的陪伴','Pointed ears and warm orange company']],
    bear:[['蜜熊圈','蜜熊圈','Honey Bear'],['一口蜂蜜色的好心情','一口蜂蜜色的好心情','A little bite of honey-colored joy']],
    sprout:[['新芽圈','新芽圈','Little Sprout'],['小小叶片，向阳生长','小小葉片，向陽生長','Little leaves reaching for the sun']],
    cloud:[['云朵圈','雲朵圈','Cloud Ring'],['把一朵轻云装进口袋','把一朵輕雲裝進口袋','Put a fluffy cloud in your pocket']],
    peach:[['蜜桃圈','蜜桃圈','Peach Ring'],['桃粉色的软甜漫游','桃粉色的軟甜漫遊','A sweet stroll in soft peach pink']],
    star:[['星星圈','星星圈','Little Star'],['捡起一颗暖金色星星','撿起一顆暖金色星星','Pick up a warm golden star']],
    planet:[['星环圈','星環圈','Planet Ring'],['沿着小行星的轨道旅行','沿著小行星的軌道旅行','Follow a little planet around its orbit']]
  };
  const districts = {
    oldtown:['旧城日光','舊城日光','Old Town'],garden:['林间花园','林間花園','Garden District'],harbor:['潮汐港湾','潮汐港灣','Tidal Harbor'],skyline:['云端都会','雲端都會','Skyline']
  };
  // Source Chinese stays in levels.js; translated copy is a presentation layer.
  const levelText = {
    'old-01':['鐘聲早市','Clocktower Market','沿鐘樓腳下的早市出發，北排鈴攤與西排果籃都能起步；繞內場吃下長椅，再沿麵包攤和拱廊回收整片屋頂。','Start at the market below the clocktower. Bell stalls to the north and fruit baskets to the west offer your first bites. Circle the benches, then follow the bakery stalls and arcades toward the rooftops.'],
    'old-02':['運河書街','Canal Book Street','先逛西岸兩段書攤，長大後從橋頭進入印刷街；北橋通向閱覽塔，南橋串起藏書樓，可把另一岸留作回程。','Browse the two stretches of book stalls on the west bank, then grow into Printing Street. The north bridge leads to the reading tower; the south bridge connects the libraries. Save the far bank for your return.'],
    'old-03':['帷幕劇院','Curtain Theatre','從劇院前庭的票券與海報架開始，左右排練巷都有成長補給；中段向扇形觀眾廣場展開，最後繞回劇院收下大帷幕。','Start with tickets and poster stands in the theatre forecourt. Both rehearsal lanes offer room to grow. Sweep across the fan-shaped audience plaza, then circle back for the grand theatre.'],
    'garden-01':['晨霧玻璃園','Misty Glass Gardens','在玻璃宮門口收起苗圃工具，沿兩條育苗步道長大；中段可穿越盆栽庭院回收溫室，或繞東側進入種子館。','Collect nursery tools by the glass palace and grow along either seedling path. Cross the potted courtyard to swallow greenhouses, or circle east toward the seed hall.'],
    'garden-02':['風車果園','Windmill Orchard','從風車下的果筐起步，向果園北行或向壓榨巷南行都能成長；中段沿彎曲果樹行吃進運果車，再把磨坊留作豐收的最後一口。','Start with fruit baskets beneath the windmill. Grow north through the orchard or south along Press Lane. Follow the curved tree rows to the fruit carts, and save the mill for your final harvest bite.'],
    'garden-03':['荷塘茶事','Lotus Teahouse','茶亭前的燈籠和茶筐是第一口，西岸竹徑與東岸石橋都通向新資源；橋面和水面均可安全移動，繞塘把茶屋留給升級後的自己。','Begin with lanterns and tea baskets outside the pavilion. The bamboo path to the west and stone bridge to the east both offer more to collect. Bridges and water are safe to cross; return for the teahouses once you grow.'],
    'harbor-01':['晨汐魚港','Morning Tide Harbor','在魚市入口收集浮標，北面的漁具行和南面的魚箱巷都能開局；沿梳齒碼頭清空漁船與拍賣棚，最後把海風裡的三座館舍一口收下。','Collect buoys at the fish market entrance. Start north along the tackle shops or south through Fish Crate Lane. Sweep the piers for boats and auction sheds, then collect the three harbor halls.'],
    'harbor-02':['彩箱貨場','Colorbox Cargo Yard','從棧板和安全錐開始，在兩條裝卸巷之間接力長大；跨到東側前先吞下堆高機，回程時整排彩箱和龍門吊就是下一頓。','Start with pallets and traffic cones, growing between the two loading lanes. Swallow the forklifts before heading east. Return for the colorful containers and gantry cranes.'],
    'harbor-03':['藍圖船塢','Blueprint Shipyard','在船廠入口收集工具和零件，沿西側工坊或北側船塢開局；中段跨過乾船塢時注意自己的體量，四座造船地標需要一次完整巡遊。','Collect tools and parts at the shipyard entrance. Start along the western workshops or northern docks. Mind your size as you cross the dry dock; a full circuit will take you to all four shipbuilding landmarks.'],
    'sky-01':['金線金融城','Goldenline Finance City','中央交易所周圍有三條短補給線，先選一邊收集街邊小物；長大後沿菱形廣場掃過車輛和鏡面樓群，四角目標決定最後一圈的方向。','Three short growth routes surround the central exchange. Pick one and collect small street objects. Once larger, sweep the diamond plaza for vehicles and mirrored towers. Plan a final loop through the four corner targets.'],
    'sky-02':['軌道交匯站','Crossrail Station','從南廣場的行李和站牌起步，向西側計程車列或東側月台街成長；軌道僅是地面圖案，可以安全橫穿，升級後回來收下整座轉乘站。','Start with luggage and signs in the south plaza. Grow toward the taxi queue to the west or platform street to the east. Tracks are only ground markings and safe to cross. Return after leveling up to collect the whole interchange.'],
    'sky-03':['星圖觀測園','Star Chart Observatory','在主天文台腳下收起觀測器材，北環和西環都能給第一輪成長；星軌地面提示回訪路線，五座觀測建築分布在校園邊緣，先規劃最後一圈。','Collect instruments beneath the main observatory. Both the north and west loops offer early growth. Follow the star trails for return routes, and plan your final circuit around the five observation buildings at the campus edge.'],
    'zen-old':['紙燈遊園會','Paper Lantern Fair','沒有倒數計時。在紙燈下慢慢逛兩條攤街，從票券和糖果車長成能收下旋轉木馬的大洞；所有遊園物件都是有限的，全部清空便完成這一夜。','No timer. Wander the two stall streets beneath paper lanterns, growing from tickets and candy carts to a hole big enough for a carousel. Every object is yours to collect; clear them all to finish the fair.'],
    'zen-garden':['四季方庭','Four Seasons Garden','春粉、夏綠、秋金、冬白分成四座庭院。先挑一條花徑起步，長大後按喜歡的季節巡遊；花房、園藝車和樹木都能收起，沒有必須趕上的時刻。','Four courtyards in spring pink, summer green, autumn gold, and winter white. Choose a flower path, then explore the seasons in any order. Collect glasshouses, garden carts, and trees without rushing.'],
    'zen-harbor':['白塔月牙灣','Crescent Lighthouse Bay','在白燈塔下面撿起浮圈，沿月牙灣兩側任選一邊慢慢長大；海面和岸線都可自由穿行，最終把救生艇、港屋與燈塔一起收入夜色。','Pick up lifebuoys beneath the white lighthouse and grow along either side of the crescent bay. Roam freely over land and sea, then gather the lifeboats, harbor houses, and lighthouse into the night.'],
    'zen-sky':['留白雕塑園','Open Space Sculpture Park','先在雕塑館前收起小展牌，再走向任意一塊草坪。幾何雕塑與藝術樓都是可吞的展品，隨意選擇參觀順序，最後收空整座公園。','Start with small exhibit signs outside the sculpture gallery, then choose any lawn. Geometric sculptures and art buildings are all yours to swallow. Visit in any order and collect the entire park.']
  };
  function normalize(value) {
    const tag = String(value || '').replace(/_/g, '-').toLowerCase();
    if (/^en(?:-|$)/.test(tag)) return 'en';
    if (/^zh(?:-|$)/.test(tag)) return /(?:^|-)(hant|tw|hk|mo)(?:-|$)/.test(tag) ? 'zh-Hant' : 'zh-Hans';
    return null;
  }
  function parentSite() { try { return window.parent !== window ? window.parent.SiteI18n : null; } catch { return null; } }
  function saved() { try { return normalize(localStorage.getItem(storageKey)); } catch { return null; } }
  function resolve() {
    const parent = parentSite();
    return normalize(parent?.locale) || normalize(new URL(location.href).searchParams.get('lang')) || saved() || normalize(navigator.languages?.[0] || navigator.language) || 'en';
  }
  let locale = resolve();
  const pick = values => values[locales.indexOf(locale)] ?? values[0];
  function t(key, values = {}) {
    const copy = messages[key] ? pick(messages[key]) : key;
    return copy.replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match);
  }
  function skin(id) { const entry = skinText[id] || skinText.original; return { name: pick(entry[0]), note: pick(entry[1]) }; }
  function level(item) {
    const entry = levelText[item.id];
    const description = locale === 'zh-Hans' || !entry ? item.sceneDescription || item.brief : entry[locale === 'zh-Hant' ? 2 : 3];
    return { title: locale === 'zh-Hans' || !entry ? item.title : entry[locale === 'zh-Hant' ? 0 : 1], district: districts[item.districtId] ? pick(districts[item.districtId]) : item.district, description, routeHint: locale === 'zh-Hans' ? item.routeHint : description };
  }
  function apply() {
    document.documentElement.lang = locale;
    document.title = t('title');
    document.querySelectorAll('[data-hc-text]').forEach(el => { el.textContent = t(el.dataset.hcText); });
    document.querySelectorAll('[data-hc-html]').forEach(el => { el.innerHTML = t(el.dataset.hcHtml); });
    for (const attr of ['aria-label', 'title']) document.querySelectorAll('[data-hc-' + attr + ']').forEach(el => el.setAttribute(attr, t(el.getAttribute('data-hc-' + attr))));
    const picker = document.getElementById('game-language');
    if (picker) picker.value = locale;
  }
  function setLocale(value, { propagate = true, persist = true } = {}) {
    const next = normalize(value);
    if (!next) return;
    const changed = locale !== next;
    locale = next;
    if (persist) try { localStorage.setItem(storageKey, locale); } catch { /* Offline storage can be disabled. */ }
    if (propagate && parentSite()?.locale !== locale) parentSite()?.setLocale(locale);
    if (window.parent === window && location.protocol !== 'file:') {
      try { const url = new URL(location.href); url.searchParams.set('lang', locale); history.replaceState(history.state, '', url); } catch { /* Optional URL persistence. */ }
    }
    apply();
    if (changed) window.dispatchEvent(new CustomEvent('hc:languagechange', { detail: { locale } }));
  }
  window.HCI18n = Object.freeze({ get locale() { return locale; }, t, skin, level, rank: index => pick(ranks[Math.min(index, ranks.length - 1)]), unlock: index => pick(unlocks[Math.min(index, unlocks.length - 1)]), setLocale, apply, locales: Object.freeze(locales.slice()) });
  try {
    if (parentSite()) {
      const siteWindow = window.parent, onParentLanguage = event => setLocale(event.detail.locale, { propagate: false });
      siteWindow.addEventListener('site:languagechange', onParentLanguage);
      window.addEventListener('pagehide', () => siteWindow.removeEventListener('site:languagechange', onParentLanguage));
      window.addEventListener('pageshow', () => { siteWindow.addEventListener('site:languagechange', onParentLanguage); setLocale(siteWindow.SiteI18n.locale, { propagate: false }); });
    }
  } catch { /* Standalone and sandboxed games remain usable. */ }
  window.addEventListener('storage', event => { if (event.key === storageKey && normalize(event.newValue)) setLocale(event.newValue, { propagate: false, persist: false }); });
  window.addEventListener('popstate', () => setLocale(resolve(), { propagate: false }));
  apply();
  document.getElementById('game-language')?.addEventListener('change', event => setLocale(event.target.value));
})();
