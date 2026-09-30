/* Add a game here to publish it in the library and use the shared launch page. */
window.ARCADE_GAMES = Object.freeze([
  {
    id: "fallen-frontier",
    title: "星陨前线",
    en: "FALLEN FRONTIER",
    category: "动作射击",
    tags: ["第三人称", "据点争夺", "战甲"],
    description: "切换双枪、呼叫战甲，在科幻战场争夺据点。占住阵地，带领队伍推向胜利。",
    controls: "WASD 移动 · 鼠标瞄准 / 射击 · F 战甲",
    path: "game-arcade/games/fallen-frontier.html",
    sizeBytes: 326691,
    cover: "assets/covers/v2/fallen-frontier.png"
  },
  {
    id: "iron-front",
    title: "智械前线",
    en: "IRON FRONT",
    category: "动作射击",
    tags: ["自动射击", "小队养成", "机甲"],
    description: "左右走位收集增援，从三人小队扩充成重装军团。部署坦克与机甲，击穿机器人防线。",
    controls: "鼠标 / A D 横移 · SPACE 导弹 · E / R 技能",
    path: "game-arcade/games/iron-front.html",
    sizeBytes: 199253,
    cover: "assets/covers/v2/iron-front.png"
  },
  {
    id: "neon-swarm",
    title: "霓潮",
    en: "NEON SWARM",
    category: "生存挑战",
    tags: ["无尽生存", "自动攻击", "升级构筑"],
    description: "在虫群包围中走位求生，用冲刺穿过险境。拾取经验、搭配武器与强化，迎接下一波浪潮。",
    controls: "WASD 移动 · SPACE 冲刺 · E / R 技能",
    path: "game-arcade/games/neon-swarm.html",
    sizeBytes: 8017087,
    cover: "assets/covers/v2/neon-swarm.png"
  },
  {
    id: "road-fury",
    title: "公路狂徒",
    en: "ROAD FURY",
    category: "竞速格斗",
    tags: ["摩托竞速", "近身格斗", "氮气加速"],
    description: "骑上摩托，在车流和弯道之间追逐。贴近对手挥棍出击，抓准时机用氮气冲向终点。",
    controls: "A / D 转向 · J / K 挥棍 · SHIFT 氮气",
    path: "game-arcade/games/road-fury.html",
    sizeBytes: 377961,
    cover: "assets/covers/v2/road-fury.png"
  },
  {
    id: "thunderwing",
    title: "雷霆战翼",
    en: "THUNDERWING",
    category: "动作射击",
    tags: ["飞行射击", "弹幕闪避", "火力升级"],
    description: "驾驶战机穿越礁海与舰队，闪避弹幕、拾取补给。让脉冲火力逐步升级，直面空中堡垒。",
    controls: "鼠标 / WASD 驾驶 · SPACE 炸弹 · E 超频",
    path: "game-arcade/games/thunderwing.html",
    sizeBytes: 158938,
    cover: "assets/covers/v2/thunderwing.png"
  }
].map(Object.freeze));
