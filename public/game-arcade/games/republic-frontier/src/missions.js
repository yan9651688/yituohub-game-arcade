import { BUILDINGS, UNITS } from "./data.js";
import { getMission } from "./campaigns.js";

// Every coordinate, delay and force count below is original campaign design.
// These scenarios run against actual entities; there is no mission-complete input.
const a = (type, role, x, y, count = 1, owner = 1, extra = {}) => ({
  type,
  role,
  x,
  y,
  count,
  owner,
  extra,
});
const z = (x, y, label, radius = 3) => ({ x, y, label, radius });
const goal = (id, text, kind, extra = {}) => ({ id, text, kind, ...extra });
const capture = (role, text, count = 1) =>
  goal(`capture_${role}`, text, "capture", { role, count });
const destroy = (role, text) =>
  goal(`destroy_${role}`, text, "destroy", { role });
const arrive = (role, zone, text, count = 1, extra = {}) =>
  goal(`arrive_${role}_${zone}`, text, "arrive", {
    role,
    zone,
    count,
    ...extra,
  });
const hold = (role, seconds, text) =>
  goal(`hold_${role}`, text, "hold", { role, seconds });
const scout = (zone, text) => goal(`scout_${zone}`, text, "scout", { zone });
const phase = (title, goals, radio, extra = {}) => ({
  title,
  goals,
  radio,
  ...extra,
});
const optional = (role, text, reward = "repair", extra = {}) => ({
  id: `optional_${role}`,
  role,
  text,
  kind: "capture",
  reward,
  ...extra,
});
const wave = (delay, x, y, units, target = "home") => ({
  delay,
  x,
  y,
  units,
  target,
});
const losses = (role, maximum, message) => ({
  kind: "losses",
  role,
  maximum,
  message,
});
const critical = (role, message, extra = {}) => ({
  kind: "allLost",
  role,
  message,
  ...extra,
});

export const MISSION_SCENARIOS = {
  a1: {
    base: "small",
    terrain: "harbor",
    camera: { x: 13, y: 26 },
    assets: [
      a("tank", "squad", 12, 27, 2, 0),
      a("infantry", "squad", 13, 24, 6, 0),
      a("engineer", "engineers", 9, 26, 3, 0),
      a("infantry", "investigators", 9, 29, 2, 0),
      a("infantry", "guards", 21, 24, 3, -1),
      a("infantry", "guardEnemy", 24, 23, 3),
      a("radar", "radar", 34, 19),
      a("powerPlant", "power", 35, 24),
      a("infantry", "radarEnemy", 31, 22, 3),
      a("hospital", "dock", 51, 24, 1, 0),
      a("hospital", "hospital", 22, 12, 1, -1),
      a("infantry", "warehouseGuards", 27, 9, 2, -1),
    ],
    zones: {
      rescue: z(21, 24, "救出港区守军", 3),
      extraction: z(51, 27, "调查队撤离", 4),
      home: z(14, 26, "登陆区", 4),
    },
    rescues: [
      { role: "guards", zone: "rescue", blockers: "guardEnemy" },
      { role: "warehouseGuards", x: 27, y: 9, radius: 3 },
    ],
    stages: [
      phase(
        "救出港区守军",
        [
          goal("rescue_guards", "击退守卫并接近被围守军", "rescue", {
            role: "guards",
            count: 3,
          }),
        ],
        "格兰特：先救出守军。地上的装备和电令对不上。",
      ),
      phase(
        "恢复港区情报",
        [
          capture("radar", "工程师占领港区雷达"),
          capture("power", "工程师占领发电厂"),
        ],
        "沃德：工程师接收雷达和电厂，调查队留在掩护后面。",
      ),
      phase(
        "掩护调查队撤离",
        [
          goal("repel_final_wave", "击退反扑部队", "wavesCleared"),
          arrive(
            "investigators",
            "extraction",
            "把至少一名调查队员送到撤离码头",
            1,
            { afterStage: 3 },
          ),
        ],
        "格兰特：敌人正在回来销毁证据。守住码头，把调查队送出去。",
        {
          waves: [
            wave(25, 47, 16, ["tank", "infantry", "infantry"], "extraction"),
          ],
        },
      ),
    ],
    optional: [
      optional("hospital", "占领医院，恢复步兵"),
      {
        id: "warehouse_guards",
        kind: "rescue",
        role: "warehouseGuards",
        count: 2,
        text: "救出仓库守军",
        reward: "credits",
      },
    ],
    failure: [
      critical("investigators", "调查队全部阵亡。"),
      critical("dock", "撤离码头被毁。"),
    ],
  },
  c1: {
    base: "small",
    terrain: "city",
    camera: { x: 14, y: 27 },
    assets: [
      a("tank", "squad", 12, 26, 2, 0),
      a("infantry", "squad", 13, 23, 8, 0),
      a("engineer", "engineers", 9, 26, 3, 0),
      a("infantry", "streetAttackers", 25, 24, 4),
      a("powerPlant", "power", 29, 18),
      a("hospital", "hospital", 33, 23, 1, -1),
      a("radar", "station", 47, 24, 1, 0),
      a("apc", "evacuees", 43, 28, 3, 0),
      a("oilDerrick", "oil", 24, 9, 1, -1),
      a("infantry", "trappedGuards", 29, 31, 3, -1),
    ],
    zones: {
      street: z(24, 23, "稳定关键街口", 4),
      extraction: z(57, 27, "居民撤离出口", 4),
      home: z(46, 25, "车站防线", 4),
    },
    rescues: [{ role: "trappedGuards", x: 29, y: 31, radius: 3 }],
    stages: [
      phase(
        "稳定关键街口",
        [
          destroy("streetAttackers", "击退街口第一轮突袭"),
          arrive("playerCombat", "street", "作战部队控制街口"),
        ],
        "周砺：先守住路口。袭击者的身份还不清楚，居民撤离不能等。",
      ),
      phase(
        "恢复撤离条件",
        [
          capture("power", "工程师夺回发电厂"),
          capture("hospital", "工程师接收医院"),
        ],
        "沈岚：电厂和医院恢复后，车站才能组织下一批撤离。",
      ),
      phase(
        "守住车站并撤离",
        [
          goal("station_counterattack", "击退车站反扑", "wavesCleared"),
          arrive(
            "evacuees",
            "extraction",
            "至少一辆居民运输车驶入安全出口",
            1,
            { afterStage: 3 },
          ),
        ],
        "周砺：运输车由你调度。守住车站，让居民通过东侧出口。",
        { waves: [wave(30, 48, 13, ["tank", "infantry", "infantry"], "home")] },
      ),
    ],
    optional: [
      optional("oil", "占领油井，增加收入", "credits"),
      {
        id: "trapped_guards",
        kind: "rescue",
        role: "trappedGuards",
        count: 3,
        text: "救出被困守军",
        reward: "credits",
      },
    ],
    failure: [
      critical("station", "撤离车站被毁。"),
      critical("evacuees", "居民运输车全部损失。"),
    ],
  },
};

const landArmy = (x = 13, y = 26) => [
  a("tank", "squad", x, y, 3, 0),
  a("infantry", "squad", x + 1, y - 3, 6, 0),
  a("engineer", "engineers", x - 3, y, 4, 0),
  a("antiAir", "squad", x - 1, y + 2, 1, 0),
];
const navy = () => [
  a("destroyer", "fleet", 12, 19, 3, 0),
  a("engineer", "engineers", 13, 11, 3, 0),
  a("infantry", "marines", 15, 10, 5, 0),
];
const safeLost = (role, text) => critical(role, text);

Object.assign(MISSION_SCENARIOS, {
  a2: {
    base: "full",
    terrain: "naval",
    assets: [
      ...navy(),
      a("shipyard", "shipyard", 7, 12, 1, -1),
      a("destroyer", "harborThreats", 27, 20, 1),
      a("transport", "transports", 15, 26, 4, 0),
      a("radar", "islandRadar", 34, 10, 1, -1),
      a("destroyer", "outerFleet", 47, 26, 2),
    ],
    zones: {
      bay: z(32, 24, "内海整队海湾", 5),
      port: z(56, 24, "安全港", 5),
      home: z(15, 23, "护航编队", 5),
    },
    stages: [
      phase(
        "恢复船厂与近港安全",
        [
          capture("shipyard", "工程师恢复船厂"),
          destroy("harborThreats", "击沉近港敌舰"),
        ],
        "沃德：驱逐舰先清近港，运输船由你决定何时出发。",
      ),
      phase(
        "分批通过内海",
        [arrive("transports", "bay", "至少两艘运输船抵达海湾", 2)],
        "格兰特：第一批在海湾整队，第二批可以等护航兵力回来再走。",
      ),
      phase(
        "护送档案船抵港",
        [
          arrive("transports", "port", "至少三艘抵港；随后留45秒接船窗口", 3, {
            grace: 45,
            perfectCount: 4,
          }),
        ],
        "沃德：外海有敌舰。至少带回三艘，四船全到能取得完整评价。",
        { waves: [wave(28, 49, 18, ["destroyer"], "port")] },
      ),
    ],
    optional: [
      optional("islandRadar", "占领雷达，显示安全港海域", "reveal", {
        revealZone: "port",
      }),
      {
        id: "all_transports",
        kind: "arrive",
        role: "transports",
        zone: "port",
        count: 4,
        text: "四艘运输船全部抵港",
        reward: "record",
      },
    ],
    failure: [losses("transports", 1, "档案运输船已损失两艘，护航失败。")],
  },
  a3: {
    base: "none",
    terrain: "warehouse",
    credits: 0,
    assets: [
      a("spy", "spy", 10, 25, 1, 0),
      a("infantry", "squad", 10, 28, 5, 0),
      a("tank", "squad", 13, 28, 1, 0),
      a("powerPlant", "power", 28, 20),
      a("techLab", "archive", 46, 18),
      a("dog", "patrolDogs", 34, 25, 1),
      a("infantry", "archiveGuard", 42, 21, 3),
      a("engineer", "captiveEngineers", 24, 9, 2, -1),
      a("hospital", "hospital", 19, 31, 1, -1),
    ],
    zones: {
      patrol: z(22, 25, "侦察巡逻", 3),
      extraction: z(55, 32, "档案撤离点", 4),
      home: z(13, 27, "接应小队", 4),
    },
    rescues: [{ role: "captiveEngineers", x: 24, y: 9, radius: 3 }],
    stages: [
      phase(
        "侦察并潜入电厂",
        [
          scout("patrol", "侦察巡逻接近路线"),
          goal("infiltrate_power", "间谍实际潜入发电厂", "infiltrate", {
            role: "spy",
            targetRole: "power",
          }),
        ],
        "格兰特：间谍可伪装，但军犬会揭露身份。选中间谍，对电厂下达潜入命令。",
      ),
      phase(
        "取得伪造电令",
        [
          goal("infiltrate_archive", "间谍实际潜入档案设施", "infiltrate", {
            role: "spy",
            targetRole: "archive",
          }),
        ],
        "格兰特：趁停电窗口进入档案库。里面的原始电令能证明谁在制造冲突。",
      ),
      phase(
        "携证据撤离",
        [
          arrive("spy", "extraction", "携带档案的间谍抵达撤离点", 1, {
            afterStage: 3,
          }),
        ],
        "沃德：证据已交给间谍。小队掩护他离开，被发现只会引来追兵。",
        {
          waves: [
            wave(35, 48, 12, ["infantry", "infantry", "dog"], "extraction"),
          ],
        },
      ),
    ],
    optional: [
      {
        id: "captive_engineers",
        kind: "rescue",
        role: "captiveEngineers",
        count: 2,
        text: "救出两名被囚工程师",
        reward: "record",
      },
      optional("hospital", "夺回医院支援接应小队"),
    ],
    failure: [
      safeLost("spy", "携证据的间谍阵亡。"),
      critical("archive", "取证前档案设施被毁。", { stages: [1, 2] }),
    ],
  },
  a4: {
    base: "full",
    terrain: "city",
    assets: [
      ...landArmy(),
      a("infantry", "couriers", 13, 30, 2, 0),
      a("radar", "liaison", 26, 20, 1, -1),
      a("artillery", "artillery", 43, 13, 2),
      a("tank", "artilleryGuard", 39, 16, 2),
      a("hospital", "bridgeControl", 47, 25, 1, 0),
      a("apc", "evacuees", 43, 31, 6, 0),
      a("repairDepot", "repair", 28, 9, 1, -1),
      a("radar", "observation", 52, 10, 1, -1),
    ],
    zones: {
      liaison: z(28, 23, "停火联络站", 4),
      exit: z(57, 25, "西桥安全出口", 4),
      home: z(47, 26, "西桥防线", 4),
    },
    stages: [
      phase(
        "建立停火联络",
        [
          capture("liaison", "工程师接收停火联络站"),
          arrive("couriers", "liaison", "联络队把证据送到联络站"),
        ],
        "沃德：取消炸桥命令。友军识别已明确，我们守住城区西侧通道。",
      ),
      phase(
        "解除城区炮击",
        [destroy("artillery", "摧毁两辆炮兵核心车辆")],
        "格兰特：两支炮兵分队正在轰击城区。解除炮击，不必扫平整座敌基地。",
      ),
      phase(
        "守住通道完成转移",
        [
          arrive("evacuees", "exit", "护送至少四辆居民车通过安全出口", 4),
          goal("repel_bridge_wave", "击退桥头反扑", "wavesCleared"),
        ],
        "沃德：居民车辆交给你调度。桥头反扑已经发现，先留出掩护再移动。",
        { waves: [wave(28, 52, 15, ["tank", "infantry", "infantry"], "home")] },
      ),
    ],
    optional: [
      optional("repair", "占领维修站"),
      optional("observation", "占领观察点，显示桥头接近方向", "reveal", {
        revealZone: "home",
      }),
    ],
    failure: [
      critical("bridgeControl", "桥头控制设施被毁，撤离通道失守。"),
      critical("liaison", "联络站被毁，停火联络无法恢复。"),
      losses("evacuees", 2, "撤离车辆损失超过两辆，已无法完成四批撤离。"),
    ],
  },
  a5: {
    base: "small",
    terrain: "industrial",
    assets: [
      ...landArmy(),
      a("miner", "miner", 15, 32, 1, 0),
      a("oilDerrick", "oil", 27, 10, 1, -1),
      a("powerPlant", "enemyPower", 35, 15, 2),
      a("radar", "outpost", 38, 25),
      a("techLab", "lab", 53, 21),
      a("tank", "labGuard", 48, 25, 3),
      a("pillbox", "bunker", 46, 19),
      a("repairDepot", "repair", 29, 31, 1, -1),
    ],
    zones: { ore: z(21, 36, "矿区", 4), home: z(52, 23, "实验室交接区", 4) },
    stages: [
      phase(
        "建立稳定收入",
        [
          goal("build_refinery", "建造并完成一座精炼厂", "build", {
            building: "refinery",
          }),
          scout("ore", "部队侦察矿区"),
        ],
        "沃德：先稳住收入。矿厂要实际建成，别让采矿车独自进危险区。",
      ),
      phase(
        "选择经营或断电路线",
        [
          goal("route_choice", "占领油井或解除两处敌方电源", "either", {
            goals: [
              capture("oil", "油井"),
              goal("power_disabled", "敌电源", "neutralize", {
                role: "enemyPower",
              }),
            ],
          }),
          capture("outpost", "占领前沿雷达支点"),
        ],
        "格兰特：油井路线稳，断电路线快。两条都能通向实验室。",
      ),
      phase(
        "接收实验室资料",
        [
          capture("lab", "占领实验室，禁止摧毁"),
          hold("lab", 60, "连续控制实验室60秒"),
          goal("lab_counterattack", "击退实验室反扑", "wavesCleared"),
        ],
        "格兰特：资料正在传输，失守会中断并重新计时。",
        { waves: [wave(25, 57, 12, ["tank", "tank", "infantry"], "home")] },
      ),
    ],
    optional: [
      optional("oil", "控制油井增加收入", "credits"),
      optional("repair", "占领前进维修厂"),
    ],
    failure: [critical("lab", "目标实验室被摧毁。")],
  },
  a6: {
    base: "full",
    terrain: "airfield",
    assets: [
      ...landArmy(),
      a("airfield", "airport", 27, 24, 1, -1),
      a("airDefense", "airDefense", 31, 25, 1, -1),
      a("fighter", "strikeAircraft", 19, 23, 3, 0),
      a("infantry", "technicians", 29, 29, 2, -1),
      a("artillery", "missileColumns", 54, 9, 3),
      a("antiAir", "missileEscort", 46, 14, 1),
      a("radar", "forwardRadar", 36, 9, 1, -1),
      a("airfield", "secondAirport", 41, 30, 1, -1),
    ],
    zones: {
      technicianRescue: z(29, 29, "救出技术人员", 3),
      strike: z(54, 36, "敌导弹打击区", 4),
      home: z(28, 26, "机场防线", 5),
    },
    rescues: [{ role: "technicians", zone: "technicianRescue" }],
    stages: [
      phase(
        "夺回机场",
        [
          capture("airport", "工程师接收机场"),
          capture("airDefense", "恢复机场防空"),
          goal("rescue_technicians", "救出两名技术人员", "rescue", {
            role: "technicians",
            count: 2,
          }),
        ],
        "沃德：飞机只负责对地攻击。地面部队清防空、守机场，先救出技术人员。",
      ),
      phase(
        "截击三支移动导弹分队",
        [
          goal("stop_two_columns", "截停至少两辆导弹核心车辆", "lossCount", {
            role: "missileColumns",
            count: 2,
          }),
          goal(
            "resolve_all_columns",
            "三支分队均已被截停或抵达目标区",
            "resolved",
            { role: "missileColumns", zone: "strike" },
          ),
        ],
        "格兰特：三支导弹分队会分批移动。提前清理防空，用飞机和装甲交叉截击。",
        {
          convoyOrders: [
            {
              role: "missileColumns",
              zone: "strike",
              interval: 55,
              initialDelay: 25,
            },
          ],
        },
      ),
      phase(
        "守住机场",
        [
          capture("airport", "保持机场控制权"),
          goal("repel_airport_wave", "击退报复进攻", "wavesCleared"),
        ],
        "沃德：气象站情报已经核实。守住技术人员和机场，接应队马上到。",
        { waves: [wave(28, 42, 23, ["tank", "infantry", "infantry"], "home")] },
      ),
    ],
    optional: [
      optional("forwardRadar", "夺取雷达，发现导弹路线", "reveal", {
        revealZone: "strike",
      }),
      optional("secondAirport", "夺回第二机场"),
    ],
    failure: [
      critical("technicians", "技术人员全部死亡。"),
      {
        kind: "arrivals",
        role: "missileColumns",
        zone: "strike",
        count: 2,
        owner: 1,
        message: "已有两支导弹分队抵达打击区。",
      },
    ],
  },
  a7: {
    base: "full",
    terrain: "river",
    assets: [
      ...landArmy(),
      a("tank", "assaultVehicles", 16, 27, 4, 0),
      a("superweapon", "chronosphere", 21, 30, 1, 0, {
        missionName: "超时空传送节点",
        missionControlled: true,
      }),
      a("powerPlant", "chronoPower", 20, 35, 2, 0),
      a("powerPlant", "coastalPower", 42, 13, 2),
      a("shipyard", "port", 52, 24, 1, -1),
      a("tank", "coastalGuards", 39, 20, 3),
      a("repairDepot", "repair", 39, 30, 1, -1),
      a("refinery", "supply", 51, 10),
    ],
    zones: {
      source: z(23, 27, "装甲传送集结区", 3),
      landing: z(39, 24, "已侦察传送落点", 4),
      home: z(51, 26, "登陆港", 4),
    },
    stages: [
      phase(
        "准备超时空突击",
        [
          arrive("assaultVehicles", "source", "把突击装甲开入传送集结区", 2),
          hold("chronosphere", 35, "保护传送节点准备35秒"),
        ],
        "格兰特：集结区与落点已经标出。只转移装甲车辆，工程师从桥梁正常前进。",
      ),
      phase(
        "侧后切断供电",
        [
          goal("actual_transfer", "至少两辆装甲实际完成传送", "flag", {
            flag: "chronoTransferred",
          }),
          goal(
            "coastal_power_disabled",
            "夺取或摧毁两处海岸电源",
            "neutralize",
            { role: "coastalPower" },
          ),
        ],
        "沃德：装甲进入集结区后会被送至侧后。切断供电，然后接收登陆港。",
      ),
      phase(
        "稳住登陆窗口",
        [
          capture("port", "工程师占领登陆港"),
          hold("port", 60, "连续守住港口60秒"),
          goal("repel_port_wave", "击退港口反扑", "wavesCleared"),
        ],
        "沃德：舰队正在接近。守住港口，不要追击远处的敌人。",
        { waves: [wave(25, 56, 18, ["tank", "tank", "infantry"], "home")] },
      ),
    ],
    optional: [
      optional("repair", "占领维修厂"),
      {
        id: "supply_destroyed",
        kind: "destroy",
        role: "supply",
        text: "摧毁补给仓库，削弱末波",
        reward: "reduceWave",
      },
    ],
    failure: [
      critical("chronosphere", "首次传送前节点被毁。", {
        unlessFlag: "chronoTransferred",
      }),
      {
        kind: "assaultExhausted",
        message: "突击装甲全灭，且后续作战与补充能力耗尽。",
      },
    ],
  },
  a8: {
    base: "naval",
    terrain: "naval",
    assets: [
      ...navy(),
      a("destroyer", "fleet", 16, 22, 2, 0),
      a("transport", "landingTransports", 13, 27, 2, 0),
      a("destroyer", "blockade", 37, 22, 3),
      a("constructionYard", "landingBase", 42, 35, 1, -1),
      a("powerPlant", "weatherPower", 48, 35, 2),
      a("superweapon", "weather", 56, 35, 1, 1, { missionControlled: true }),
      a("infantry", "technicians", 41, 39, 3, -1),
      a("tank", "shoreGuards", 48, 39, 3),
      a("techLab", "archive", 56, 6),
      a("shipyard", "auxiliaryShipyard", 40, 30, 1, -1),
    ],
    zones: {
      shore: z(43, 38, "登陆并救出技术人员", 4),
      extraction: z(12, 11, "北岸卸载与人员交接区", 5),
      home: z(44, 37, "登陆阵地", 4),
    },
    rescues: [{ role: "technicians", zone: "shore", blockers: "shoreGuards" }],
    stages: [
      phase(
        "建立联合登陆点",
        [
          destroy("blockade", "击破外海封锁舰队"),
          capture("landingBase", "运送工程师占领南岸登陆基地"),
        ],
        "沃德：使用运输艇把工程师送到南岸。地面与海上各有任务，不必清掉所有岸防。",
      ),
      phase(
        "摧毁气象站",
        [destroy("weather", "摧毁真实气象控制建筑")],
        "格兰特：最终攻击倒计时已公开。控制或摧毁两处电源可暂停准备，供电恢复后会继续。",
        {
          deadline: 540,
          deadlineCancelFlag: "weatherDisabled",
          deadlineMessage: "气象站完成了已预告的最终攻击。",
          waves: [wave(45, 53, 38, ["tank", "infantry"], "home")],
        },
      ),
      phase(
        "完成技术人员撤离",
        [
          goal("rescue_technicians", "救出至少一名技术人员", "rescue", {
            role: "technicians",
            count: 1,
          }),
          arrive(
            "technicians",
            "extraction",
            "至少一名技术人员乘艇返回并卸载至撤离区",
            1,
            { afterStage: 3 },
          ),
        ],
        "沃德：气象站已停机。把技术人员运回北岸，卸载后完成交接。",
      ),
    ],
    optional: [
      optional("archive", "占领完整计划资料库", "record"),
      optional("auxiliaryShipyard", "恢复辅助船厂"),
    ],
    failure: [critical("technicians", "所有待撤离技术人员均已死亡。")],
  },
  c2: {
    base: "small",
    terrain: "river",
    assets: [
      ...landArmy(),
      a("mcv", "mobileBase", 13, 30, 1, 0),
      a("apc", "supplyConvoy", 16, 28, 3, 0),
      a("engineer", "supplyCrew", 15, 30, 3, 0),
      a("tank", "ambush", 35, 20, 2),
      a("infantry", "ambush", 38, 25, 3),
      a("repairDepot", "repair", 24, 8, 1, -1),
      a("hospital", "bridgeControl", 26, 17, 1, -1),
      a("infantry", "scouts", 25, 30, 2, -1),
    ],
    loadPassengers: { carriers: "supplyConvoy", passengers: "supplyCrew" },
    zones: {
      routeShort: z(28, 22, "南桥短路", 4),
      routeLong: z(28, 10, "北桥绕行", 4),
      rear: z(50, 25, "后方基地展开区", 6),
      home: z(50, 25, "后方基地", 5),
    },
    rescues: [{ role: "scouts", x: 25, y: 30, radius: 3 }],
    stages: [
      phase(
        "侦察山路",
        [
          goal("scout_route", "侦察任意一座桥的接近路线", "either", {
            goals: [scout("routeShort", "南桥"), scout("routeLong", "北桥")],
          }),
        ],
        "沈岚：南桥路短但守军多，北桥绕行更远。车队由你调度，可以停下来整队。",
      ),
      phase(
        "护送车队通过隘口",
        [
          arrive("mobileBase", "rear", "基地车驶入后方展开区"),
          arrive("supplyConvoy", "rear", "至少两辆补给车驶入后方", 2),
        ],
        "周砺：先确认桥头安全，再让基地车通过。不要把运输车当作突击装甲。",
      ),
      phase(
        "展开基地并卸载",
        [
          goal("rear_yard", "在后方标记区展开基地车", "buildInZone", {
            building: "constructionYard",
            zone: "rear",
          }),
          arrive("supplyCrew", "rear", "卸载至少两名补给工程人员", 2),
          goal("repel_rear_wave", "击退尾随追兵", "wavesCleared"),
        ],
        "沈岚：基地车到标记区后部署。补给车要卸载，工程人员到位才能完成交接。",
        { waves: [wave(35, 40, 28, ["tank", "infantry", "infantry"], "home")] },
      ),
    ],
    optional: [
      optional("repair", "占领沿途维修站"),
      optional("bridgeControl", "接收桥梁控制所，修复南桥", "record"),
      {
        id: "scouts_rescued",
        kind: "rescue",
        role: "scouts",
        count: 2,
        text: "救出侦察队",
        reward: "reveal",
        revealZone: "routeLong",
      },
    ],
    failure: [
      critical("mobileBase", "基地车及其展开的建造厂均已损失。"),
      losses("supplyConvoy", 1, "补给车损失超过一辆。"),
      losses("supplyCrew", 1, "补给人员不足两人。"),
    ],
  },
  c3: {
    base: "full",
    terrain: "river",
    assets: [
      ...landArmy(),
      a("mcv", "mobileBase", 14, 30, 1, 0),
      a("tank", "coreArmy", 18, 25, 4, 0),
      a("radar", "rearRelay", 48, 22, 1, -1),
      a("repairDepot", "repair", 23, 8, 1, -1),
      a("refinery", "abandonedAmmo", 23, 31, 1, -1),
      a("tank", "forwardEnemies", 24, 20, 2),
    ],
    zones: {
      muster: z(20, 26, "撤退集结点", 4),
      rear: z(51, 25, "第二道阵地", 6),
      home: z(50, 25, "后方防线", 5),
    },
    stages: [
      phase(
        "组织主动换防",
        [
          arrive("coreArmy", "muster", "至少两辆核心装甲到撤退集结点", 2),
          destroy("forwardEnemies", "击退前沿接触部队"),
        ],
        "周砺：旧基地可以放弃。先保存核心装甲和基地车，我们在后方重新展开。",
      ),
      phase(
        "撤出核心部队",
        [
          arrive("mobileBase", "rear", "基地车撤到第二道阵地"),
          arrive("coreArmy", "rear", "至少两辆核心装甲撤到后方", 2),
        ],
        "沈岚：两座桥都能通过。损失旧阵地不会判负，不要为了空建筑耗尽主力。",
        { waves: [wave(35, 17, 21, ["tank", "tank", "infantry"], "rear")] },
      ),
      phase(
        "重建第二道防线",
        [
          goal("redeploy_base", "基地车在后方标记区重新展开", "buildInZone", {
            building: "constructionYard",
            zone: "rear",
          }),
          capture("rearRelay", "接收后方联络站"),
          goal("repel_pursuit", "击退最后追兵", "wavesCleared"),
        ],
        "周砺：展开、修理、建立射界。保存下来的部队就是反攻的本钱。",
        { waves: [wave(35, 40, 20, ["tank", "infantry", "infantry"], "home")] },
      ),
    ],
    optional: [
      optional("repair", "接收沿途维修站"),
      {
        id: "ammo_denial",
        kind: "destroy",
        role: "abandonedAmmo",
        text: "摧毁废弃弹药库，减少最后追兵",
        reward: "reduceWave",
      },
    ],
    failure: [
      critical("mobileBase", "基地车与其新展开建造厂全部损失。"),
      critical("coreArmy", "核心撤离装甲全部损失。"),
    ],
  },
  c4: {
    base: "full",
    terrain: "city",
    assets: [
      ...landArmy(),
      a("hospital", "assembly", 30, 17, 2, -1),
      a("apc", "evacuees", 36, 30, 6, 0),
      a("tank", "streetGuard", 37, 22, 2),
      a("radar", "meeting", 53, 25, 1, 0),
      a("hospital", "hospital", 24, 9, 1, -1),
    ],
    zones: {
      route: z(47, 25, "主要撤离通路", 4),
      exit: z(57, 27, "与西桥守军会合", 4),
      home: z(49, 25, "通路防线", 4),
    },
    stages: [
      phase(
        "收复集结点",
        [
          capture("assembly", "工程师接收两处居民集结点", 2),
          destroy("streetGuard", "清除主要通路上的装甲威胁"),
        ],
        "沈岚：六批居民的位置都已标记。先接收集结点，再分配护送兵力。",
      ),
      phase(
        "组织分批撤离",
        [arrive("evacuees", "route", "至少两辆撤离车进入主要通路", 2)],
        "周砺：六批救出四批即可。不要为了守住每条街让所有队伍一起被困。",
        { waves: [wave(35, 46, 13, ["tank", "infantry", "infantry"], "home")] },
      ),
      phase(
        "完成停火交接",
        [
          arrive(
            "evacuees",
            "exit",
            "至少四辆抵达；保留60秒争取六批全部撤离",
            4,
            { grace: 60, perfectCount: 6 },
          ),
        ],
        "沈岚：西桥守军已经接应。至少四批抵达即可完成任务，还能继续争取剩下的居民。",
      ),
    ],
    optional: [
      optional("hospital", "夺回医院恢复步兵"),
      {
        id: "all_six",
        kind: "arrive",
        role: "evacuees",
        zone: "exit",
        count: 6,
        text: "六批居民全部撤离",
        reward: "record",
      },
    ],
    failure: [
      losses("evacuees", 2, "六批撤离队伍已损失三批，无法完成目标。"),
      critical("meeting", "最终会合设施被毁。"),
    ],
  },
  c5: {
    base: "full",
    terrain: "naval",
    assets: [
      ...navy(),
      a("shipyard", "shipyard", 7, 12, 1, -1),
      a("transport", "enemyTransports", 57, 19, 3),
      a("destroyer", "coverFleet", 49, 25, 3),
      a("radar", "coastRadar", 35, 10, 1, -1),
    ],
    zones: {
      entrance: z(27, 24, "海峡入口侦察点", 5),
      enemyPort: z(8, 26, "敌军抵港判定区", 4),
      home: z(25, 23, "封锁线", 5),
    },
    stages: [
      phase(
        "建立海峡封锁线",
        [
          capture("shipyard", "恢复造船厂"),
          scout("entrance", "舰队侦察海峡入口"),
        ],
        "周砺：先夺船厂，再把舰队放到航道上。海面上的目标优先级由你决定。",
      ),
      phase(
        "截断三批增援",
        [
          goal("stop_two_convoys", "截停至少两艘增援运输船", "lossCount", {
            role: "enemyTransports",
            count: 2,
          }),
          goal("convoy_outcomes", "三艘运输船全部被截停或抵港", "resolved", {
            role: "enemyTransports",
            zone: "enemyPort",
          }),
        ],
        "沈岚：三批运输船间隔出发。拦住至少两批，敌军就无法维持这条补给线。",
        {
          convoyOrders: [
            {
              role: "enemyTransports",
              zone: "enemyPort",
              interval: 50,
              initialDelay: 20,
            },
          ],
        },
      ),
      phase(
        "击退掩护舰队",
        [destroy("coverFleet", "击沉仍在作战的掩护舰队")],
        "周砺：补给线已被截断。击退掩护舰队后停战，不必炮击沿岸所有建筑。",
        { orderRole: "coverFleet", orderZone: "home", orderAttack: true },
      ),
    ],
    optional: [
      optional("coastRadar", "占领岸上雷达，观察来船方向", "reveal", {
        revealZone: "entrance",
      }),
      {
        id: "stop_all",
        kind: "destroy",
        role: "enemyTransports",
        text: "截停全部三艘运输船",
        reward: "record",
      },
    ],
    failure: [
      {
        kind: "arrivals",
        role: "enemyTransports",
        zone: "enemyPort",
        count: 2,
        owner: 1,
        message: "两批增援成功抵港，封锁失败。",
      },
    ],
  },
  c6: {
    base: "full",
    terrain: "industrial",
    assets: [
      ...landArmy(),
      a("mammoth", "heavyArmor", 16, 28, 2, 0),
      a("radar", "forwardPosts", 32, 15, 2),
      a("radar", "railControl", 54, 22),
      a("tank", "heavyGuard", 46, 20, 3),
      a("artillery", "heavyGuard", 50, 26, 1),
      a("repairDepot", "repair", 28, 30, 1, -1),
      a("oilDerrick", "oil", 26, 8, 1, -1),
    ],
    zones: {
      industrial: z(24, 24, "工业区前进支点", 5),
      home: z(35, 18, "前沿阵地", 4),
    },
    stages: [
      phase(
        "站稳工业区",
        [
          arrive(
            "playerCombat",
            "industrial",
            "至少三支作战单位进入工业支点",
            3,
          ),
          goal("air_cover", "完成至少一座防空阵地", "build", {
            building: "airDefense",
          }),
        ],
        "周砺：装甲不必单独顶上去。先建立防空与补给支点，再向铁路推进。",
      ),
      phase(
        "分割运输线路",
        [capture("forwardPosts", "夺取两处前沿设施", 2)],
        "沈岚：拿下这两处前沿设施，就能切开敌军运输线。留工程师接收，不要全部打烂。",
        { waves: [wave(30, 43, 12, ["tank", "infantry", "infantry"], "home")] },
      ),
      phase(
        "夺取铁路调度站",
        [
          capture("railControl", "占领铁路调度站"),
          destroy("heavyGuard", "击破调度站重装护卫"),
        ],
        "周砺：最后目标是调度站。拿到运输记录即可，不要求扫平整张地图。",
      ),
    ],
    optional: [
      optional("repair", "接收前进维修厂"),
      optional("oil", "夺回工业区油井", "credits"),
    ],
    failure: [critical("railControl", "铁路调度站被毁，运输记录无法取得。")],
  },
  c7: {
    base: "none",
    terrain: "river",
    credits: 0,
    assets: [
      a("infantry", "squad", 12, 26, 7, 0),
      a("tank", "squad", 13, 29, 1, 0),
      a("engineer", "captiveEngineers", 23, 25, 2, -1),
      a("engineer", "extraEngineers", 25, 8, 2, -1),
      a("infantry", "patrol", 22, 20, 2),
      a("radar", "radar", 37, 20),
      a("hospital", "bridgeControl", 26, 17, 1, -1),
      a("tank", "mainForce", 18, 30, 4, 0),
      a("hospital", "hospital", 39, 30, 1, -1),
    ],
    zones: {
      approach: z(20, 26, "观察渡口", 3),
      engineers: z(23, 25, "解救工程师", 3),
      crossing: z(45, 23, "主力通过区域", 5),
      home: z(42, 23, "桥后防线", 4),
    },
    rescues: [
      { role: "captiveEngineers", zone: "engineers", blockers: "patrol" },
      { role: "extraEngineers", x: 25, y: 8, radius: 3 },
    ],
    stages: [
      phase(
        "接近渡口",
        [
          scout("approach", "小队到达渡口观察点"),
          destroy("patrol", "清除阻挡救援的巡逻队"),
        ],
        "沈岚：我们没有隐身能力。观察巡逻，利用河岸掩护前进。",
      ),
      phase(
        "工程部队打开通路",
        [
          goal("rescue_engineers", "救出至少一名工程师", "rescue", {
            role: "captiveEngineers",
          }),
          capture("bridgeControl", "工程师接收桥梁控制所"),
          capture("radar", "夺取对岸雷达"),
        ],
        "沈岚：解救工程师后，先接收桥梁控制所，再去对岸雷达。",
      ),
      phase(
        "让主力通过",
        [
          arrive("mainForce", "crossing", "至少两辆主力坦克通过河道", 2),
          goal("repel_pursuit", "击退追击部队", "wavesCleared"),
        ],
        "周砺：主力正在通过。守住桥后区域，别让追兵切断队形。",
        { waves: [wave(30, 24, 23, ["tank", "infantry", "infantry"], "home")] },
      ),
    ],
    optional: [
      {
        id: "extra_engineers",
        kind: "rescue",
        role: "extraEngineers",
        count: 2,
        text: "解救第二组工程师",
        reward: "record",
      },
      optional("hospital", "占领医院恢复步兵"),
    ],
    failure: [
      critical("mainForce", "需要通过的核心主力全部损失。"),
      {
        kind: "engineeringLost",
        message: "所有必要工程人员都已死亡，且仍有未完成的工程目标。",
        stages: [1, 2],
      },
    ],
  },
  c8: {
    base: "full",
    terrain: "mountain",
    assets: [
      ...landArmy(),
      a("mammoth", "heavyArmor", 15, 29, 2, 0),
      a("radar", "forwardBase", 27, 22, 1, -1),
      a("superweapon", "silos", 42, 8, 3, 1, { missionControlled: true }),
      a("powerPlant", "siloPower", 39, 14, 3),
      a("powerPlant", "enemyGridReserve", 36, 4),
      a("radar", "command", 55, 27),
      a("mammoth", "finalGuard", 50, 24, 1),
      a("tank", "finalGuard", 46, 28, 2),
      a("repairDepot", "repair", 31, 31, 1, -1),
      a("infantry", "prisoners", 54, 35, 3, -1),
    ],
    zones: {
      forward: z(29, 25, "山体入口前沿阵地", 4),
      prisoners: z(54, 35, "被拘押人员", 3),
      home: z(55, 27, "指挥部交接区", 4),
    },
    rescues: [{ role: "prisoners", zone: "prisoners" }],
    stages: [
      phase(
        "建立前沿阵地",
        [
          capture("forwardBase", "接收山体入口前沿设施"),
          arrive("playerCombat", "forward", "至少三支部队进入前沿阵地", 3),
        ],
        "周砺：前沿站稳后再进入核武器区。三座发射井的准备时间会同时公开。",
      ),
      phase(
        "解除三处核威胁",
        [
          goal("disable_all_silos", "夺取或摧毁三座核弹发射井", "neutralize", {
            role: "silos",
          }),
        ],
        "沈岚：攻击电厂可让敌方电网过载，暂停发射准备。供电恢复会继续，夺取或摧毁发射井才算彻底解除。",
      ),
      phase(
        "夺取并交接指挥部",
        [
          capture("command", "工程师占领指挥部"),
          hold("command", 60, "连续控制指挥部60秒"),
          destroy("finalGuard", "击破指挥部重装护卫"),
          goal("repel_last_wave", "击退最后反扑", "wavesCleared"),
        ],
        "周砺：核威胁已解除。接收指挥部，把这里完整交给后续部队。",
        { waves: [wave(30, 57, 19, ["tank", "infantry", "infantry"], "home")] },
      ),
    ],
    optional: [
      optional("repair", "接收前进维修设施"),
      {
        id: "prisoners_rescued",
        kind: "rescue",
        role: "prisoners",
        count: 3,
        text: "解救被拘押人员，保留证词",
        reward: "record",
      },
    ],
    failure: [critical("command", "指挥部被毁，无法完成接收与交接。")],
  },
});

const live = (entity) => entity && entity.hp > 0 && !entity.dead;
const center = (entity) => ({
  x: entity.x + (BUILDINGS[entity.type]?.w || 0) / 2,
  y: entity.y + (BUILDINGS[entity.type]?.h || 0) / 2,
});
const distance = (entity, point) => {
  const p = center(entity);
  return Math.hypot(p.x - point.x, p.y - point.y);
};
const allLive = (state) => state.entities.filter(live);
const roleEntities = (state, role) => {
  if (role === "playerCombat")
    return allLive(state).filter(
      (e) =>
        e.owner === 0 &&
        e.kind === "unit" &&
        (UNITS[e.type]?.damage || 0) > 0 &&
        !e.carrierId,
    );
  if (role === "playerUnits")
    return allLive(state).filter(
      (e) => e.owner === 0 && e.kind === "unit" && !e.carrierId,
    );
  const ids = state.mission.roles[role] || [];
  return state.entities.filter((e) => ids.includes(e.id));
};
const aliveRole = (state, role) => roleEntities(state, role).filter(live);
const ownedRole = (state, role) =>
  aliveRole(state, role).filter((e) => e.owner === 0);
const roleTotal = (state, role) => state.mission.roles[role]?.length || 0;
const warningTime = (state) =>
  state.mission.difficulty === "easy"
    ? 40
    : state.mission.difficulty === "hard"
      ? 18
      : 28;

function createCampaignTerrain(state, terrain) {
  state.width = 64;
  state.height = 44;
  state.tiles = Array.from(
    { length: state.width * state.height },
    (_, index) => {
      const x = index % state.width,
        y = Math.floor(index / state.width);
      let kind = (x * 13 + y * 7) % 17 < 3 ? "dirt" : "grass";
      let bridge = false,
        surface;
      if (terrain === "naval") kind = y >= 14 && y <= 31 ? "water" : "grass";
      else if (terrain === "river" && x >= 30 && x <= 33) {
        kind = "water";
        if ((y >= 20 && y <= 24) || (y >= 8 && y <= 11)) {
          kind = "road";
          bridge = true;
        }
      } else if (terrain === "harbor") {
        if (x >= 44 && y >= 30) kind = "water";
        else if (x >= 35 && y >= 19) {
          kind = "dirt";
          surface = "quay";
        }
        if (x >= 49 && x <= 53 && y >= 27 && y <= 34) {
          kind = "road";
          surface = "quay";
        }
      } else if (terrain === "city") {
        kind = "dirt";
        surface = "urban";
        if (
          [10, 11, 22, 23, 32, 33].includes(y) ||
          [18, 19, 30, 31, 40, 41, 52, 53].includes(x)
        )
          kind = "road";
        if (x >= 24 && x <= 37 && y >= 17 && y <= 27) kind = "road";
      } else if (terrain === "industrial") {
        if (x > 20 && y > 7 && y < 36) {
          kind = "dirt";
          surface = "concrete";
        }
        if (y === 14 || y === 15 || y === 28 || y === 29) kind = "road";
      } else if (terrain === "warehouse") {
        if (x > 17 && x < 55 && y > 12 && y < 28) {
          kind = "dirt";
          surface = "warehouse";
        }
        if (y === 18 || y === 19 || x === 27 || x === 28) kind = "road";
      } else if (terrain === "airfield") {
        if (x >= 20 && x <= 51 && y >= 17 && y <= 31) {
          kind = "dirt";
          surface = "concrete";
        }
        if (x >= 23 && x <= 48 && y >= 17 && y <= 20) {
          kind = "road";
          surface = "runway";
        }
      } else if (terrain === "mountain") {
        if (
          ((x >= 32 && x <= 35) || (x >= 46 && x <= 48)) &&
          y > 3 &&
          y < 38 &&
          !(y >= 7 && y <= 15) &&
          !(y >= 20 && y <= 29)
        )
          kind = "rock";
        if (x > 28 && kind !== "rock") kind = "dirt";
      }
      if (kind !== "water" && (y === 22 || y === 23 || x === 18 || x === 40))
        kind = "road";
      if (x === 0 || y === 0 || x === 63 || y === 43)
        kind = terrain === "naval" && y >= 14 && y <= 31 ? "water" : "rock";
      return {
        kind,
        height: kind === "rock" && terrain === "mountain" ? 1 : 0,
        ore: 0,
        explored: false,
        visible: false,
        ...(surface ? { surface } : {}),
        ...(bridge ? { bridge: true } : {}),
      };
    },
  );
  const oreY = terrain === "naval" ? 6 : 35;
  for (let y = oreY; y < oreY + 5; y++)
    for (let x = 18; x < 24; x++)
      Object.assign(state.tiles[y * state.width + x], {
        kind: x % 5 === 0 ? "gem" : "ore",
        ore: 3000,
      });
}

function addRole(state, role, entity) {
  (state.mission.roles[role] ||= []).push(entity.id);
  entity.tags = [
    ...new Set([
      ...(entity.tags || []),
      `mission:${state.mission.id}`,
      `role:${role}`,
    ]),
  ];
  entity.missionRole = role;
  return entity;
}

function spawnAsset(game, spec, waveRole) {
  const { state } = game;
  const created = [];
  for (let n = 0; n < (spec.count || 1); n++) {
    const building = Boolean(BUILDINGS[spec.type]);
    const movement = UNITS[spec.type]?.movement;
    const spacing =
      movement === "naval" || movement === "amphibious" ? 2.8 : 1.15;
    const x = spec.x + (building ? n * 4 : (n % 3) * spacing);
    const y = spec.y + (building ? 0 : Math.floor(n / 3) * spacing);
    const config = MISSION_SCENARIOS[state.mission.id];
    const captureOnly =
      building &&
      config.stages.some((stage) =>
        stage.goals.some(
          (goal) => goal.kind === "capture" && goal.role === spec.role,
        ),
      );
    const entity = game.spawn(spec.type, spec.owner, x, y, {
      ...spec.extra,
      missionCaptureOnly: captureOnly,
      protected: spec.extra?.protected ?? false,
    });
    if (building && !entity.missionName) {
      const names = {
        dock: "港区撤离联络站",
        station: "铁路撤离调度站",
        archive: "档案保管设施",
        liaison: "停火联络站",
        bridgeControl: "桥梁控制所",
        assembly: "居民集结点",
        meeting: "停火会合站",
        railControl: "铁路调度站",
        command: "萨文前线指挥部",
        weather: "气象控制站",
        silos: "核弹发射井",
        forwardBase: "山体入口联络站",
        landingBase: "南岸登陆建造厂",
        rearRelay: "后方联络站",
        port: "登陆港接收站",
        outpost: "前沿情报站",
        lab: "目标作战实验室",
        power: "任务区域发电厂",
      };
      entity.missionName = names[spec.role] || BUILDINGS[spec.type]?.name;
    }
    if (!entity)
      throw new Error(
        `Mission ${state.mission.id}: spawn failed for ${spec.type}`,
      );
    addRole(state, spec.role, entity);
    if (waveRole) addRole(state, waveRole, entity);
    created.push(entity);
  }
  return created;
}

function spawnBase(game, kind, naval) {
  if (!kind || kind === "none") return;
  const y = naval ? 3 : 31;
  const specs = [
    a("constructionYard", "homeBase", 3, y, 1, 0),
    a("powerPlant", "homePower", 7, y, 1, 0),
    a("barracks", "homeBarracks", 10, y, 1, 0),
  ];
  if (kind === "full" || kind === "naval")
    specs.push(
      a("powerPlant", "homePower", 7, y + 4, 1, 0),
      a("refinery", "homeRefinery", 3, y + 5, 1, 0),
      a("warFactory", "homeFactory", 10, y + 5, 1, 0),
      a("radar", "homeRadar", 14, y + 5, 1, 0),
      a("miner", "homeMiner", 14, y + 3, 1, 0),
    );
  if (kind === "naval") specs.push(a("shipyard", "homeShipyard", 7, 12, 1, 0));
  for (const spec of specs) spawnAsset(game, spec);
}

function say(game, text) {
  const split = text.indexOf("：");
  const entry = {
    speaker: split < 0 ? "指挥部" : text.slice(0, split),
    text: split < 0 ? text : text.slice(split + 1),
    time: game.state.time,
  };
  game.state.mission.radio.push(entry);
  game.state.mission.radio = game.state.mission.radio.slice(-24);
  game.emit?.("missionRadio", entry);
}

function setStage(game, index, initial = false) {
  const state = game.state,
    mission = state.mission,
    config = MISSION_SCENARIOS[mission.id],
    stage = config.stages[index];
  mission.stage = index + 1;
  mission.stageTitle = stage.title;
  mission.stageStartedAt = state.time;
  mission.holdTimers = {};
  mission.objectiveLatches = {};
  mission.stageWaveIds = [];
  mission.waveSchedule = (stage.waves || []).map((entry, n) => ({
    ...entry,
    id: `${mission.id}:${index + 1}:${n}`,
    at: state.time + Math.max(entry.delay, warningTime(state)),
    issued: false,
  }));
  mission.deadlineAt = stage.deadline
    ? state.time +
      stage.deadline *
        (mission.difficulty === "easy"
          ? 1.25
          : mission.difficulty === "hard"
            ? 0.9
            : 1)
    : null;
  mission.checkpointRevision += initial ? 0 : 1;
  mission.markers = buildMarkers(config, stage);
  say(game, stage.radio);
  if (stage.orderRole)
    orderToZone(state, stage.orderRole, stage.orderZone, false);
  mission.convoyOrders = (stage.convoyOrders || []).flatMap((order) =>
    aliveRole(state, order.role).map((entity, index) => ({
      entityId: entity.id,
      zone: order.zone,
      at: state.time + order.initialDelay + index * order.interval,
      issued: false,
    })),
  );
  if (stage.orderRole && stage.orderAttack)
    orderToZone(state, stage.orderRole, stage.orderZone, true);
}

function buildMarkers(config, stage) {
  const markers = [];
  for (const objective of stage.goals) {
    if (objective.zone && config.zones[objective.zone])
      markers.push({
        ...config.zones[objective.zone],
        kind: "objective",
        objectiveId: objective.id,
      });
    else if (objective.role) {
      const asset = config.assets.find(
        (asset) => asset.role === objective.role,
      );
      if (asset)
        markers.push({
          x: asset.x,
          y: asset.y,
          label: objective.text,
          kind: "objective",
          objectiveId: objective.id,
        });
    }
  }
  return markers;
}

export function missionSetup(state, definition, game) {
  const missionDefinition =
    typeof definition === "string"
      ? getMission(definition)
      : definition || getMission(state.missionId);
  if (!game?.spawn || !missionDefinition)
    throw new Error("missionSetup requires a known definition and game.spawn");
  const config = MISSION_SCENARIOS[missionDefinition.id];
  if (!config)
    throw new Error(`Mission ${missionDefinition.id} is not implemented`);
  state.entities = [];
  state.projectiles = [];
  state.effects = [];
  state.events = [];
  state.selectedIds = [];
  state.mode = "campaign";
  state.missionId = missionDefinition.id;
  state.status = "playing";
  const difficulty = state.difficulty || state.options?.difficulty || "normal";
  state.mission = {
    version: 1,
    id: missionDefinition.id,
    faction: missionDefinition.faction,
    stage: 1,
    stageTitle: "",
    difficulty,
    status: "active",
    roles: {},
    visits: {},
    flags: {},
    optionalDone: {},
    objectiveLatches: {},
    holdTimers: {},
    waveSchedule: [],
    stageWaveIds: [],
    radio: [],
    markers: [],
    checkpointRevision: 0,
    startedAt: state.time,
    stageStartedAt: state.time,
    deadlineAt: null,
    missionDefinitionVersion: "original-design-1",
    allowGenericAI: false,
  };
  state.mission.briefing = missionDefinition.briefing;
  state.mission.terrain = config.terrain;
  state.mission.saveGuidance = missionDefinition.save;
  state.mission.camera = config.camera || {
    x: 13,
    y: config.terrain === "naval" ? 16 : 27,
  };
  createCampaignTerrain(state, config.terrain);
  state.players[0].faction = missionDefinition.faction;
  state.players[0].credits =
    config.credits ??
    (difficulty === "easy" ? 18000 : difficulty === "hard" ? 11000 : 14000);
  state.players[0].defeated = false;
  if (state.players[1]) {
    state.players[1].faction = "soviet";
    state.players[1].credits = 0;
    state.players[1].defeated = false;
  }
  spawnBase(game, config.base, config.terrain === "naval");
  for (const spec of config.assets) spawnAsset(game, spec);
  if (config.loadPassengers) {
    const carriers = aliveRole(state, config.loadPassengers.carriers),
      passengers = aliveRole(state, config.loadPassengers.passengers);
    passengers.forEach((passenger, index) => {
      const carrier = carriers[index % carriers.length];
      passenger.carrierId = carrier.id;
      passenger.x = carrier.x;
      passenger.y = carrier.y;
      carrier.passengers ||= [];
      carrier.passengers.push(passenger.id);
    });
  }
  if (["c2", "c7"].includes(missionDefinition.id)) setMainBridge(state, false);
  setStage(game, 0, true);
  updateObjectives(game, 0);
  game.emit?.("missionStarted", {
    missionId: missionDefinition.id,
    faction: missionDefinition.faction,
  });
}

function orderToZone(state, role, zoneId, attackMove = true) {
  const point = MISSION_SCENARIOS[state.mission.id].zones[zoneId];
  if (!point) return;
  for (const entity of aliveRole(state, role)) {
    entity.order = {
      type: attackMove ? "attackMove" : "move",
      x: point.x,
      y: point.y,
    };
    entity.targetId = null;
  }
}

function processWorldEvidence(game, dt) {
  const state = game.state,
    mission = state.mission,
    config = MISSION_SCENARIOS[mission.id];
  // Deployment changes the MCV entity ID; tags preserve the same critical mission role.
  for (const entity of state.entities)
    for (const tag of entity.tags || []) {
      if (!tag.startsWith("role:")) continue;
      const role = tag.slice(5);
      if (!(mission.roles[role] ||= []).includes(entity.id))
        mission.roles[role].push(entity.id);
    }
  for (const [zoneId, zone] of Object.entries(config.zones)) {
    for (const entity of allLive(state)) {
      if (
        entity.kind !== "unit" ||
        entity.carrierId ||
        distance(entity, zone) > zone.radius
      )
        continue;
      const key = `${zoneId}:${entity.id}`;
      if (!mission.visits[key] || mission.visits[key].stage < mission.stage)
        mission.visits[key] = {
          id: entity.id,
          zone: zoneId,
          time: state.time,
          stage: mission.stage,
          owner: entity.owner,
        };
    }
  }
  for (const rescue of config.rescues || []) {
    const point = rescue.zone ? config.zones[rescue.zone] : rescue;
    const blocked =
      rescue.blockers &&
      aliveRole(state, rescue.blockers).some((entity) => entity.owner === 1);
    const rescueForce = roleEntities(state, "playerUnits").some(
      (entity) => distance(entity, point) <= (point.radius || 3),
    );
    if (!blocked && rescueForce)
      for (const entity of aliveRole(state, rescue.role)) {
        if (entity.owner !== -1) continue;
        entity.owner = 0;
        entity.order = null;
        game.emit?.("rescue", { entityId: entity.id, role: rescue.role });
      }
  }
  for (const pending of mission.waveSchedule) {
    if (pending.issued || state.time < pending.at) continue;
    pending.issued = true;
    const reinforcementType = pending.units.every(
      (type) => UNITS[type]?.movement === "naval",
    )
      ? "destroyer"
      : "infantry";
    let units =
      mission.difficulty === "easy" && pending.units.length > 2
        ? pending.units.slice(0, -1)
        : mission.difficulty === "hard"
          ? [...pending.units, reinforcementType]
          : pending.units;
    if (
      mission.flags.reduceFinalWave &&
      mission.stage === 3 &&
      units.length > 1
    )
      units = units.slice(0, -1);
    units.forEach((type, n) => {
      const role = `wave_${pending.id}`;
      const created = spawnAsset(
        game,
        a(
          type,
          role,
          pending.x + (n % 3) * 1.2,
          pending.y + Math.floor(n / 3) * 1.2,
        ),
        "missionWaves",
      );
      mission.stageWaveIds.push(...created.map((entity) => entity.id));
      orderToZone(state, role, pending.target);
    });
    say(game, "战场通报：已预告的敌军正在接近目标区域。");
  }
  for (const order of mission.convoyOrders || []) {
    if (order.issued || state.time < order.at) continue;
    order.issued = true;
    const entity = state.entities.find(
        (candidate) => candidate.id === order.entityId,
      ),
      point = config.zones[order.zone];
    if (live(entity) && point) {
      entity.order = { type: "move", x: point.x, y: point.y };
      entity.path = [];
      entity.pathGoal = null;
    }
  }
  for (const option of config.optional || []) {
    if (mission.optionalDone[option.id]) continue;
    const progress = evaluateGoal(game, option, dt, false);
    if (!progress.done) continue;
    mission.optionalDone[option.id] = {
      time: state.time,
      reward: option.reward,
    };
    if (option.reward === "credits") state.players[0].credits += 1200;
    if (option.reward === "engineer")
      spawnAsset(
        game,
        a("engineer", "engineers", option.x || 14, option.y || 27, 1, 0),
      );
    if (option.reward === "reveal" && option.revealZone)
      revealZone(state, config.zones[option.revealZone]);
    if (option.reward === "reduceWave") mission.flags.reduceFinalWave = true;
    say(game, `指挥部：可选目标完成，${option.text}。`);
    game.emit?.("missionOptional", {
      missionId: mission.id,
      objectiveId: option.id,
    });
  }
  runSpecialScenario(game, dt);
}

function revealZone(state, point) {
  if (!point) return;
  for (
    let y = Math.max(0, Math.floor(point.y - 8));
    y < Math.min(state.height, point.y + 8);
    y++
  )
    for (
      let x = Math.max(0, Math.floor(point.x - 8));
      x < Math.min(state.width, point.x + 8);
      x++
    )
      state.tiles[y * state.width + x].explored = true;
}

function visitCount(state, role, zone, afterStage = 0, owner = 0) {
  const ids =
    role === "playerUnits" || role === "playerCombat"
      ? roleEntities(state, role).map((entity) => entity.id)
      : state.mission.roles[role] || [];
  return ids.filter((id) => {
    const visit = state.mission.visits[`${zone}:${id}`];
    return visit && visit.owner === owner && visit.stage >= afterStage;
  }).length;
}

function evaluateGoal(game, objective, dt, mutate = true) {
  const state = game.state,
    mission = state.mission,
    config = MISSION_SCENARIOS[mission.id];
  let progress = 0,
    target = objective.count || 1,
    done = false;
  const living = objective.role ? aliveRole(state, objective.role) : [];
  if (objective.kind === "capture" || objective.kind === "rescue")
    progress = ownedRole(state, objective.role).length;
  else if (objective.kind === "destroy") {
    target = roleTotal(state, objective.role);
    progress = target - living.length;
    done = target > 0 && progress >= target;
  } else if (objective.kind === "arrive") {
    progress = visitCount(
      state,
      objective.role,
      objective.zone,
      objective.afterStage || 0,
      objective.owner ?? 0,
    );
    if (objective.grace && progress >= target) {
      const timer = `grace_${objective.id}`;
      if (mutate && mission.holdTimers[timer] == null)
        mission.holdTimers[timer] = state.time;
      done =
        progress >=
          (objective.perfectCount || roleTotal(state, objective.role)) ||
        state.time - (mission.holdTimers[timer] ?? state.time) >=
          objective.grace;
      return { done, progress, target };
    }
  } else if (objective.kind === "scout") {
    const point = config.zones[objective.zone];
    progress =
      point &&
      roleEntities(state, "playerUnits").some(
        (entity) => distance(entity, point) <= point.radius + 3,
      )
        ? 1
        : 0;
  } else if (objective.kind === "hold") {
    target = objective.seconds;
    const controlled =
      living.length > 0 && living.every((entity) => entity.owner === 0);
    if (mutate)
      mission.holdTimers[objective.id] = controlled
        ? (mission.holdTimers[objective.id] || 0) + dt
        : 0;
    progress = mission.holdTimers[objective.id] || 0;
  } else if (objective.kind === "wavesCleared") {
    target = mission.waveSchedule.length;
    progress = mission.waveSchedule.filter((entry) => entry.issued).length;
    done =
      progress >= target &&
      mission.stageWaveIds.every(
        (id) => !live(state.entities.find((entity) => entity.id === id)),
      );
    return { done, progress, target };
  } else if (objective.kind === "build")
    progress = allLive(state).filter(
      (entity) =>
        entity.owner === 0 &&
        entity.type === objective.building &&
        !(entity.progress < 1),
    ).length;
  else if (objective.kind === "buildInZone")
    progress = allLive(state).filter(
      (entity) =>
        entity.owner === 0 &&
        entity.type === objective.building &&
        !(entity.progress < 1) &&
        distance(entity, config.zones[objective.zone]) <=
          config.zones[objective.zone].radius,
    ).length;
  else if (objective.kind === "infiltrate") {
    const targetIds = aliveRole(state, objective.targetRole).map(
      (entity) => entity.id,
    );
    progress = aliveRole(state, objective.role).some((entity) =>
      targetIds.includes(entity.lastInfiltratedId),
    )
      ? 1
      : 0;
  } else if (objective.kind === "resolved") {
    target = roleTotal(state, objective.role);
    progress = (mission.roles[objective.role] || []).filter(
      (id) =>
        !live(state.entities.find((entity) => entity.id === id)) ||
        mission.visits[`${objective.zone}:${id}`],
    ).length;
  } else if (objective.kind === "neutralize") {
    target = roleTotal(state, objective.role);
    progress = target - living.filter((entity) => entity.owner !== 0).length;
  } else if (objective.kind === "flag")
    progress = mission.flags[objective.flag] ? 1 : 0;
  else if (objective.kind === "either") {
    const results = objective.goals.map((item) =>
      evaluateGoal(game, item, dt, false),
    );
    progress = results.some((result) => result.done) ? 1 : 0;
  } else if (objective.kind === "lossCount") {
    progress = roleTotal(state, objective.role) - living.length;
  } else if (objective.kind === "within") {
    const targetEntity = aliveRole(state, objective.targetRole)[0];
    progress =
      targetEntity &&
      living.some(
        (entity) =>
          entity.owner === 0 &&
          !entity.carrierId &&
          distance(entity, center(targetEntity)) <= (objective.radius || 3),
      )
        ? 1
        : 0;
  }
  done ||= progress >= target && target > 0;
  return { done, progress, target };
}

function failureReason(game) {
  const state = game.state,
    mission = state.mission,
    config = MISSION_SCENARIOS[mission.id],
    stage = config.stages[mission.stage - 1];
  for (const rule of config.failure || []) {
    if (rule.stages && !rule.stages.includes(mission.stage)) continue;
    if (rule.unlessFlag && mission.flags[rule.unlessFlag]) continue;
    if (
      rule.kind === "allLost" &&
      roleTotal(state, rule.role) > 0 &&
      aliveRole(state, rule.role).length === 0
    )
      return rule.message;
    if (
      rule.kind === "losses" &&
      roleTotal(state, rule.role) - aliveRole(state, rule.role).length >
        rule.maximum
    )
      return rule.message;
    if (
      rule.kind === "arrivals" &&
      visitCount(state, rule.role, rule.zone, 0, rule.owner ?? 1) >= rule.count
    )
      return rule.message;
    if (
      rule.kind === "engineeringLost" &&
      (!ownedRole(state, "bridgeControl").length ||
        !ownedRole(state, "radar").length) &&
      !allLive(state).some(
        (entity) =>
          entity.type === "engineer" && [0, -1].includes(entity.owner),
      )
    )
      return rule.message;
    if (
      rule.kind === "assaultExhausted" &&
      !aliveRole(state, "assaultVehicles").length &&
      !roleEntities(state, "playerCombat").length &&
      !allLive(state).some(
        (entity) =>
          entity.owner === 0 &&
          ["warFactory", "barracks", "constructionYard", "mcv"].includes(
            entity.type,
          ),
      )
    )
      return rule.message;
  }
  for (const phase of config.stages.slice(mission.stage - 1))
    for (const objective of phase.goals) {
      if (
        objective.kind === "capture" &&
        roleTotal(state, objective.role) > 0 &&
        aliveRole(state, objective.role).length < (objective.count || 1)
      )
        return `必须占领的目标已被摧毁：${objective.text}。`;
    }
  if (mission.nuclearFailure) return mission.nuclearFailure;
  if (
    stage.deadline &&
    mission.deadlineAt != null &&
    state.time >= mission.deadlineAt &&
    !mission.flags[stage.deadlineCancelFlag]
  )
    return stage.deadlineMessage || "已明确预告的任务期限已到。";
  const combat = roleEntities(state, "playerUnits").length;
  const production = allLive(state).filter(
    (entity) =>
      entity.owner === 0 &&
      (BUILDINGS[entity.type]?.factory || entity.type === "constructionYard"),
  ).length;
  if (!combat && !production) return "作战部队与重建能力全部丧失。";
  return null;
}

function updateObjectives(game, dt) {
  const mission = game.state.mission,
    config = MISSION_SCENARIOS[mission.id],
    stage = config.stages[mission.stage - 1];
  const current = stage.goals.map((objective) => {
    const result = evaluateGoal(game, objective, dt);
    // Hold/ownership goals remain live until phase completion; other evidence can latch.
    const reversible = ["capture", "hold", "neutralize", "build"].includes(
      objective.kind,
    );
    if (result.done && !reversible)
      mission.objectiveLatches[objective.id] = true;
    const asset =
      objective.role &&
      config.assets.find((asset) => asset.role === objective.role);
    const target = objective.zone
      ? config.zones[objective.zone]
      : asset
        ? { x: asset.x, y: asset.y }
        : null;
    return {
      id: objective.id,
      text: objective.text,
      optional: false,
      ...result,
      ...(target ? { targetPosition: { x: target.x, y: target.y } } : {}),
      done:
        result.done ||
        (!reversible && Boolean(mission.objectiveLatches[objective.id])),
    };
  });
  game.state.objectives = [
    ...current,
    ...(config.optional || []).map((option) => ({
      id: option.id,
      text: option.text,
      optional: true,
      done: Boolean(mission.optionalDone[option.id]),
      progress: mission.optionalDone[option.id] ? 1 : 0,
      target: 1,
    })),
  ];
  return current.every((objective) => objective.done);
}

export function updateMission(game, dt) {
  const state = game.state;
  if (
    state.mode !== "campaign" ||
    state.status !== "playing" ||
    !state.mission ||
    state.mission.status !== "active"
  )
    return;
  if (!Number.isFinite(dt) || dt < 0)
    throw new Error("Invalid mission time step");
  const config = MISSION_SCENARIOS[state.mission.id];
  if (!config) throw new Error(`Unknown mission ${state.mission.id}`);
  processWorldEvidence(game, dt);
  const reason = failureReason(game);
  if (reason) {
    state.status = "lost";
    state.mission.status = "lost";
    state.mission.failureReason = reason;
    say(game, `指挥部：${reason}`);
    game.emit?.("missionLost", {
      missionId: state.mission.id,
      stage: state.mission.stage,
      reason,
    });
    return;
  }
  if (!updateObjectives(game, dt)) return;
  if (state.mission.stage < 3) {
    setStage(game, state.mission.stage);
    updateObjectives(game, 0);
    game.emit?.("missionStage", {
      missionId: state.mission.id,
      stage: state.mission.stage,
      checkpoint: true,
      checkpointRevision: state.mission.checkpointRevision,
    });
  } else {
    state.status = "won";
    state.mission.status = "won";
    state.mission.completedAt = state.time;
    say(game, "指挥部：任务目标已经完成。各部按计划撤离与交接。");
    game.emit?.("missionWon", {
      missionId: state.mission.id,
      optional: Object.keys(state.mission.optionalDone),
    });
  }
}

export function validateMissionState(state) {
  if (state.mode !== "campaign") return true;
  const mission = state.mission,
    config = MISSION_SCENARIOS[state.missionId];
  const fail = () => {
    throw new Error("战役存档状态损坏或版本不兼容");
  };
  if (
    !config ||
    !mission ||
    mission.version !== 1 ||
    mission.id !== state.missionId ||
    !Number.isInteger(mission.stage) ||
    mission.stage < 1 ||
    mission.stage > 3 ||
    !["active", "won", "lost"].includes(mission.status) ||
    !["easy", "normal", "hard"].includes(mission.difficulty)
  )
    fail();
  if (
    (state.status === "won") !== (mission.status === "won") ||
    (state.status === "lost") !== (mission.status === "lost")
  )
    fail();
  if (
    !mission.roles ||
    !mission.visits ||
    !mission.flags ||
    !mission.optionalDone ||
    !mission.objectiveLatches ||
    !mission.holdTimers ||
    !Array.isArray(mission.radio) ||
    !Array.isArray(mission.markers) ||
    !Array.isArray(mission.waveSchedule) ||
    !Array.isArray(mission.stageWaveIds)
  )
    fail();
  const ids = new Set(state.entities.map((entity) => entity.id));
  for (const list of Object.values(mission.roles))
    if (
      !Array.isArray(list) ||
      list.some((id) => !ids.has(id)) ||
      new Set(list).size !== list.length
    )
      fail();
  for (const asset of config.assets)
    if (
      !Array.isArray(mission.roles[asset.role]) ||
      mission.roles[asset.role].length < asset.count
    )
      fail();
  if (
    ![mission.startedAt, mission.stageStartedAt].every(
      (value) =>
        Number.isFinite(value) && value >= 0 && value <= state.time + 1e-6,
    ) ||
    !Number.isInteger(mission.checkpointRevision) ||
    mission.checkpointRevision < 0 ||
    (mission.deadlineAt != null && !Number.isFinite(mission.deadlineAt))
  )
    fail();
  for (const value of Object.values(mission.holdTimers))
    if (!Number.isFinite(value) || value < 0) fail();
  for (const entry of mission.waveSchedule)
    if (
      !entry ||
      !Number.isFinite(entry.at) ||
      !Array.isArray(entry.units) ||
      entry.units.some((type) => !UNITS[type]) ||
      typeof entry.issued !== "boolean"
    )
      fail();
  for (const timer of mission.siloTimers || [])
    if (
      !ids.has(timer.id) ||
      !Number.isFinite(timer.remaining) ||
      timer.remaining < 0 ||
      typeof timer.disabled !== "boolean" ||
      typeof timer.paused !== "boolean"
    )
      fail();
  const currentGoalIds = new Set(
    config.stages[mission.stage - 1].goals.map((objective) => objective.id),
  );
  if (
    Object.keys(mission.objectiveLatches).some(
      (id) => !currentGoalIds.has(id),
    ) ||
    mission.stageWaveIds.some((id) => !ids.has(id))
  )
    fail();
  return true;
}

function runSpecialScenario(game, dt) {
  // Scenario-specific interactions are added below and always inspect live world entities.
  const state = game.state,
    mission = state.mission;
  if (mission.id === "a7") updateChronoScenario(game, dt);
  if (mission.id === "a3") updateArchiveScenario(game, dt);
  if (mission.id === "c8") updateNuclearScenario(game, dt);
  if (mission.id === "a8") updateWeatherScenario(game, dt);
  if (
    ["c2", "c7"].includes(mission.id) &&
    ownedRole(state, "bridgeControl").length &&
    !mission.flags.bridgeRepaired
  ) {
    setMainBridge(state, true);
    mission.flags.bridgeRepaired = true;
    say(game, "沈岚：南桥已经实际修复，车辆现在可以通行。");
  }
}

function setMainBridge(state, open) {
  for (let x = 30; x <= 33; x++)
    for (let y = 20; y <= 24; y++)
      Object.assign(state.tiles[y * state.width + x], {
        kind: open ? "road" : "water",
        bridge: open,
        ore: 0,
      });
}

function updateChronoScenario(game, dt) {
  const state = game.state,
    mission = state.mission;
  const source = MISSION_SCENARIOS.a7.zones.source,
    destination = MISSION_SCENARIOS.a7.zones.landing;
  // The approved failure rule permits rebuilding the assault while transport and
  // production survive. Replacement vehicles genuinely entering the muster area
  // therefore join the tagged assault group instead of leaving an unwinnable phase.
  if (mission.stage <= 2 && !mission.flags.chronoTransferred)
    for (const entity of allLive(state)) {
      if (
        entity.owner === 0 &&
        entity.kind === "unit" &&
        ["tank", "apc", "antiAir", "artillery", "prism", "mammoth"].includes(
          entity.type,
        ) &&
        !entity.carrierId &&
        distance(entity, source) <= source.radius &&
        !mission.roles.assaultVehicles.includes(entity.id)
      )
        addRole(state, "assaultVehicles", entity);
    }
  if (mission.stage !== 2 || mission.flags.chronoTransferred) return;
  const node = ownedRole(state, "chronosphere")[0];
  const readyVehicles = ownedRole(state, "assaultVehicles").filter(
    (entity) =>
      entity.kind === "unit" &&
      ["tank", "apc", "antiAir", "artillery", "prism", "mammoth"].includes(
        entity.type,
      ) &&
      !entity.carrierId &&
      distance(entity, source) <= source.radius,
  );
  if (
    !node ||
    readyVehicles.length < 2 ||
    (state.players[0].power || 0) < (state.players[0].demand || 0)
  )
    return;
  readyVehicles.forEach((entity, index) => {
    entity.x = destination.x + (index % 2) * 1.3;
    entity.y = destination.y + Math.floor(index / 2) * 1.3;
    entity.order = { type: "idle" };
    entity.path = [];
    entity.pathGoal = null;
  });
  mission.flags.chronoTransferred = true;
  mission.flags.chronoVehicleIds = readyVehicles.map((entity) => entity.id);
  game.emit?.("missionTeleport", {
    missionId: "a7",
    ids: mission.flags.chronoVehicleIds,
    from: source,
    to: destination,
  });
  say(game, "格兰特：装甲已经抵达侧后。工程师仍需走桥梁或运输路线。");
}

function updateArchiveScenario(game) {
  const state = game.state,
    mission = state.mission;
  const targets = aliveRole(state, "archive").map((entity) => entity.id);
  const spy = aliveRole(state, "spy").find((entity) =>
    targets.includes(entity.lastInfiltratedId),
  );
  if (spy && !mission.flags.archiveSecured) {
    mission.flags.archiveSecured = true;
    spy.missionCarriesArchive = true;
    game.emit?.("missionEvidenceSecured", {
      missionId: "a3",
      entityId: spy.id,
    });
  }
}

function updateWeatherScenario(game, dt) {
  const state = game.state,
    mission = state.mission;
  const device = aliveRole(state, "weather")[0];
  if (!device) {
    mission.flags.weatherDisabled = true;
    return;
  }
  if (mission.stage !== 2) return;
  const grid = state.players[1];
  const powered =
    grid.power >= grid.demand && state.time >= (grid.powerDisabledUntil || 0);
  if (!powered && mission.deadlineAt != null) mission.deadlineAt += dt;
  mission.powerStatus = powered
    ? "气象站供电中，倒计时继续"
    : "气象站停电，倒计时暂停";
  if (
    powered &&
    state.time >= mission.deadlineAt &&
    !mission.flags.weatherLaunched
  ) {
    device.charge = BUILDINGS.superweapon.chargeTime;
    const result = game.command({
      type: "superweapon",
      owner: 1,
      id: device.id,
      x: 10,
      y: 8,
      missionLaunch: true,
    });
    mission.flags.weatherLaunched = result.ok;
    if (!result.ok) {
      mission.deadlineAt += 1;
      mission.powerStatus = `发射等待：${result.reason}`;
    }
  }
}

function updateNuclearScenario(game, dt) {
  const state = game.state,
    mission = state.mission;
  if (mission.stage !== 2) return;
  const siloIds = mission.roles.silos || [],
    powerIds = mission.roles.siloPower || [];
  if (!mission.siloTimers) {
    const scale =
      mission.difficulty === "easy"
        ? 1.25
        : mission.difficulty === "hard"
          ? 0.9
          : 1;
    mission.siloTimers = siloIds.map((id, index) => ({
      id,
      powerId: powerIds[index],
      remaining: (480 + index * 90) * scale,
      disabled: false,
      paused: false,
    }));
    say(
      game,
      "沈岚：三座发射井准备时间已公开。敌方电网过载会暂停所有发射准备；夺取或摧毁发射井才能彻底解除。",
    );
  }
  for (const timer of mission.siloTimers) {
    const silo = state.entities.find((entity) => entity.id === timer.id),
      power = state.entities.find((entity) => entity.id === timer.powerId);
    timer.disabled = !live(silo) || silo.owner === 0;
    if (timer.disabled) continue;
    timer.paused =
      state.players[1].power < state.players[1].demand ||
      state.time < (state.players[1].powerDisabledUntil || 0);
    if (!timer.paused) timer.remaining = Math.max(0, timer.remaining - dt);
    if (timer.remaining <= 0) {
      silo.charge = BUILDINGS.superweapon.chargeTime;
      const result = game.command({
        type: "superweapon",
        owner: 1,
        id: silo.id,
        x: 29,
        y: 25,
        missionLaunch: true,
      });
      if (result.ok) {
        mission.nuclearFailure = "一座核弹发射井完成了已预告的发射。";
        game.emit?.("missionNuclearLaunch", { entityId: timer.id });
      }
    }
  }
}
