// Original campaign content. All timing, layouts and scenario balance are authored design values.
export const CAMPAIGNS = {
  allied: [
    {
      id: "a1",
      faction: "allied",
      title: "失联航标",
      subtitle: "侦察 / 救援 · 入门",
      briefing:
        "登陆失联港口，调查遭袭船队。遗留电令与袭击者装备来源互相矛盾，指挥部第一次意识到有人在制造冲突。",
      terrain: "harbor",
      difficulty: 1,
      stages: [
        "以有限小队突破码头，救出被围守军。",
        "使用工程师夺回雷达与电厂，恢复港区情报。",
        "抵挡已预告的反扑，把调查队送到撤离码头。",
      ],
      optional:
        "占领医院帮助小队恢复；救出仓库守军，为最终防守增加一支本关增援。",
      failure: "调查队全部阵亡，或撤离码头被毁。重要目标从开始就标记。",
      save: "救出守军、恢复雷达后各保存一次；最终反扑前留整队时间。",
      designProvenance: "原创战役设计；不是原版官方剧情或原版数值",
      sourcePlanningId: "allied_01",
    },
    {
      id: "a2",
      faction: "allied",
      title: "窄海护航",
      subtitle: "海军 / 运输护航",
      briefing:
        "护送带有调查档案的运输船。敌方袭击避开战舰而追逐档案船，进一步暴露其掩盖证据的目的。",
      terrain: "naval",
      difficulty: 2,
      stages: [
        "清理近港威胁，恢复船厂与护航编队。",
        "护送第一批运输船穿过内海，在安全海湾整队。",
        "在外海截击与空袭下，将四艘运输船中的至少三艘送入安全港。",
      ],
      optional:
        "夺回小岛雷达，提前发现外海舰队；全船抵达只影响评价，不是后关必需条件。",
      failure: "损失两艘运输船，或所有护航和补充生产能力丧失。",
      save: "船厂恢复后、第一批抵达安全海湾后保存。运输船分批出航。",
      designProvenance: "原创战役设计；不是原版官方剧情或原版数值",
      sourcePlanningId: "allied_02",
    },
    {
      id: "a3",
      faction: "allied",
      title: "借来的旗帜",
      subtitle: "间谍 / 取证 / 撤离",
      briefing:
        "档案指向一座仓储设施。小队找到伪造电令与缴获车辆的记录，证明袭击者在冒用不同阵营的身份。",
      terrain: "warehouse",
      difficulty: 3,
      stages: [
        "侦察巡逻与警犬路线，间谍潜入电厂。",
        "利用停电窗口进入档案设施，取得伪造电令。",
        "掩护携带档案的小队从桥梁或山路撤离。",
      ],
      optional:
        "救出囚禁工程师可修复较短的撤离桥；放弃支线仍可走长山路完成主线。",
      failure:
        "间谍在取证前死亡，或携带档案的小队全灭；被发现只触发增援，不直接判负。",
      save: "潜入前、取得档案后保存；不在警犬即将接触时自动覆盖安全档。",
      designProvenance: "原创战役设计；不是原版官方剧情或原版数值",
      sourcePlanningId: "allied_03",
    },
    {
      id: "a4",
      faction: "allied",
      title: "停火线",
      subtitle: "城市突击 / 桥梁防御",
      briefing:
        "沃德把证据送往联络站，取消炸桥封锁命令。盟军守住西桥，为中国一侧的居民撤离提供通路。",
      terrain: "city",
      difficulty: 3,
      stages: [
        "突破街区封锁，把证据送到停火联络站。",
        "夺取或摧毁两处炮兵阵地，停止对城区的炮击。",
        "守住西桥，掩护撤离队伍完成最后转移。",
      ],
      optional: "夺回维修站提供车辆修理；占领观察点提前揭示敌方进攻方向。",
      failure:
        "撤离结束前西桥被毁，或联络站达到任务明确规定的不可恢复失守条件。停火后友军关系明确，不设误点即破盟。",
      save: "达成停火、解除城区炮击后保存。与中国第 4 关是同一事件的另一侧。",
      designProvenance: "原创战役设计；不是原版官方剧情或原版数值",
      sourcePlanningId: "allied_04",
    },
    {
      id: "a5",
      faction: "allied",
      title: "一张电网",
      subtitle: "基地经营 / 断电攻坚",
      briefing:
        "调查发现萨文正转移核武器。盟军必须夺取实验室记录，确认运输路线与气象控制站的位置。",
      terrain: "industrial",
      difficulty: 4,
      stages: [
        "建立有限规模基地，侦察矿区并形成稳定收入。",
        "选择先控制油井经营扩张，或直接切断敌方供电突击。",
        "占领作战实验室并守住至资料传输完成。",
      ],
      optional:
        "油井增加本关收入；维修设施降低攻坚损耗。两条路线都要通过无支线通关测试。",
      failure:
        "目标实验室被摧毁，或己方作战与生产能力全部丧失。实验室的占领要求在接敌前明确。",
      save: "完成基地建设、选择路线后建立前沿支点时保存。",
      designProvenance: "原创战役设计；不是原版官方剧情或原版数值",
      sourcePlanningId: "allied_05",
    },
    {
      id: "a6",
      faction: "allied",
      title: "云下猎手",
      subtitle: "空地协同 / 机动截击",
      briefing:
        "技术人员确认气象站即将投入作战，三支转移中的导弹分队正准备掩护岛屿运输。",
      terrain: "airfield",
      difficulty: 3,
      stages: [
        "夺回机场，修复防空并救出技术人员。",
        "地面部队侦察与清理防空，飞机配合截击三支移动导弹分队。",
        "守住机场和技术人员，抵挡敌方报复进攻。",
      ],
      optional:
        "前沿雷达提前揭示移动目标路线；抢救另一座机场增加停机与补给选择。",
      failure:
        "技术人员全部死亡，或三支分队中两支进入指定打击区。飞机仅保留原版允许的目标类型。",
      save: "机场恢复后、完成主要截击后保存。此关减少经营负担，调节战役节奏。",
      designProvenance: "原创战役设计；不是原版官方剧情或原版数值",
      sourcePlanningId: "allied_06",
    },
    {
      id: "a7",
      faction: "allied",
      title: "零点之前",
      subtitle: "超时空突击 / 桥头堡",
      briefing:
        "正面海岸炮封锁舰队入口。盟军决定将一支装甲队送到防线侧后，争取登陆窗口。",
      terrain: "island",
      difficulty: 4,
      stages: [
        "保护超时空传送仪完成准备，并侦察可用落点。",
        "传送原版允许的装甲单位，切断海岸炮阵地供电。",
        "夺取登陆港并顶住反攻，为主力舰队打开通道。",
      ],
      optional: "占领维修厂支撑孤立部队；摧毁补给仓库削弱本关最后一次反扑。",
      failure: "首批出发前传送仪被毁，或突击部队全灭且后续运输能力耗尽。",
      save: "首次传送前、占领登陆港后保存；落点风险和撤离路线提前说明。",
      designProvenance: "原创战役设计；不是原版官方剧情或原版数值",
      sourcePlanningId: "allied_07",
    },
    {
      id: "a8",
      faction: "allied",
      title: "风暴尽头",
      subtitle: "海陆联合 / 终章",
      briefing:
        "盟军攻击要塞的海岸气象设施，中国部队同时进入山体核武器基地。两线完成不同目标，共同结束海峡危机。",
      terrain: "naval",
      difficulty: 5,
      stages: [
        "舰队打开外海通道，建立稳定登陆点。",
        "地面部队切断供电，配合舰队摧毁气象控制站。",
        "保护技术人员撤离，接获中国方面解除核威胁的消息。",
      ],
      optional: "占领资料库揭露完整计划；恢复辅助船厂提供备用撤离运输船。",
      failure:
        "气象站完成已明确预告的最终攻击，或撤离人员全部死亡。摧毁气象站后不追加无预告超武。",
      save: "登陆点建立后、气象站摧毁后保存；终章不要求清理全地图残兵。",
      designProvenance: "原创战役设计；不是原版官方剧情或原版数值",
      sourcePlanningId: "allied_08",
    },
  ],
  china: [
    {
      id: "c1",
      faction: "china",
      title: "灯火未熄",
      subtitle: "城防 / 撤离 · 入门",
      briefing:
        "港城遭到带有盟军标识的部队袭击。周砺在确认敌人身份前，先组织救援与撤离。",
      terrain: "city",
      difficulty: 1,
      stages: [
        "控制关键街口，击退第一轮突袭。",
        "工程师夺回电厂与医院，恢复撤离条件。",
        "守住车站，送走第一批居民。",
      ],
      optional: "抢救油井获得本关修复资金；救出被困守军，为最后防守增加兵力。",
      failure: "车站被毁，或居民运输单位全部损失。不是每一栋楼都必须守住。",
      save: "街口稳定、撤离线路恢复后保存；先小规模接敌，再引入双路压力。",
      designProvenance: "原创战役设计；不是原版官方剧情或原版数值",
      sourcePlanningId: "china_01",
    },
    {
      id: "c2",
      faction: "china",
      title: "山海走廊",
      subtitle: "基地车护送 / 路线选择",
      briefing:
        "敌军重点袭击补给而不占领城镇。周砺必须把基地车和物资送入后方，恢复持续作战能力。",
      terrain: "river",
      difficulty: 2,
      stages: [
        "侦察两条山路并抢修必要桥梁。",
        "护送基地车与补给车队穿过隘口，由玩家决定短路强攻或长路绕行。",
        "展开后方基地，守到物资卸载完成。",
      ],
      optional: "夺取维修站修复车队；救出侦察队揭示另一路的伏击点。",
      failure: "基地车被毁，或补给车辆损失超过任务明确显示的上限。",
      save: "路线侦察后、进入后方展开区后保存；车队由玩家控制，途中可停靠整队。",
      designProvenance: "原创战役设计；不是原版官方剧情或原版数值",
      sourcePlanningId: "china_02",
    },
    {
      id: "c3",
      faction: "china",
      title: "山口换防",
      subtitle: "主动撤退 / 基地转移",
      briefing:
        "继续死守旧山口将耗尽兵力。周砺下令主动换防，让出地形以保存守城主力。",
      terrain: "river",
      difficulty: 3,
      stages: [
        "利用旧阵地掩护主力后撤，准备运输和维修。",
        "收起基地车，撤出指定核心部队。",
        "在第二道阵地重新展开，击退追兵。",
      ],
      optional: "带走维修力量帮助后方整备；摧毁废弃弹药库减少本关追击部队。",
      failure: "基地车被毁，或指定撤离核心部队全灭。旧基地的失去不自动判负。",
      save: "撤退命令下达前、后方展开完成后保存；命令在局势崩溃前发出。",
      designProvenance: "原创战役设计；不是原版官方剧情或原版数值",
      sourcePlanningId: "china_03",
    },
    {
      id: "c4",
      faction: "china",
      title: "白线之内",
      subtitle: "多点救援 / 停火协作",
      briefing:
        "沈岚收到盟军送来的证据。中国部队守住城区撤离通路，与西桥守军完成有限合作。",
      terrain: "city",
      difficulty: 3,
      stages: [
        "夺回两处居民集结点并确认六批撤离队伍的位置。",
        "在多条通路分配兵力，优先保护仍可救出的队伍。",
        "与盟军西桥守军会合，完成至少四批撤离。",
      ],
      optional: "救出全部六批居民获得额外结局文字；夺回医院帮助本关步兵恢复。",
      failure:
        "已不可能完成四批撤离，或最终会合区域被彻底摧毁。剩余批次和通路状态持续显示。",
      save: "集结点收复后、主要队伍进入撤离通路后保存。与盟军第 4 关共享事件但目标不同。",
      designProvenance: "原创战役设计；不是原版官方剧情或原版数值",
      sourcePlanningId: "china_04",
    },
    {
      id: "c5",
      faction: "china",
      title: "断潮",
      subtitle: "海峡封锁 / 目标截击",
      briefing:
        "为迫使萨文放弃海上补给，中国部队夺回船厂，对群岛增援航线实施截断。",
      terrain: "naval",
      difficulty: 4,
      stages: [
        "恢复船厂并侦察海峡出入口。",
        "截击三批运输船，至少阻止两批抵达目标港。",
        "击退掩护舰队，封闭补给航道。",
      ],
      optional:
        "全部截停可减少本关最后敌舰数量；占领岸上雷达提前发现运输方向。",
      failure: "两批运输船成功抵港，或己方舰队与船厂补充能力全部丧失。",
      save: "舰队集结后、第一批截击完成后保存。舰艇编成必须符合老版中国可用装备。",
      designProvenance: "原创战役设计；不是原版官方剧情或原版数值",
      sourcePlanningId: "china_05",
    },
    {
      id: "c6",
      faction: "china",
      title: "钢铁分水岭",
      subtitle: "装甲推进 / 后勤经营",
      briefing:
        "萨文转而使用陆路转运核武器。中国部队需要占领铁路调度站，确认最终目的地。",
      terrain: "industrial",
      difficulty: 4,
      stages: [
        "在工业区建立支点，稳定矿区与防空。",
        "夺取两处前沿设施，分割敌军运输线路。",
        "突破重装防线，占领铁路调度站。",
      ],
      optional: "占领维修厂形成前进修理点；夺回矿区扩大后半关资源。",
      failure:
        "调度站被毁，或己方作战与生产能力全部丧失。铁幕威胁给出预警，可断电或暂退后反击。",
      save: "工业支点稳定、前沿设施夺取后保存，允许整队再打最后防线。",
      designProvenance: "原创战役设计；不是原版官方剧情或原版数值",
      sourcePlanningId: "china_06",
    },
    {
      id: "c7",
      faction: "china",
      title: "无声的渡口",
      subtitle: "有限小队 / 工程开路",
      briefing:
        "沈岚的小队发现一条绕过正面要塞的水岸道路，为最后反攻建立入口。",
      terrain: "river",
      difficulty: 3,
      stages: [
        "观察巡逻，以有限兵力接近渡口。",
        "解救工程师，修复桥梁并夺回雷达。",
        "让主力通过，再封住追击部队。",
      ],
      optional:
        "解救第二组工程师增加另一座桥的修复机会；夺取医院恢复受伤步兵。",
      failure:
        "必要工程人员全灭且无补充来源，或撤离小队全灭。被发现引来追兵，不立即失败。",
      save: "工程师解救后、主力开始通过前保存；不赋予中国小队原版没有的隐身或伪装技能。",
      designProvenance: "原创战役设计；不是原版官方剧情或原版数值",
      sourcePlanningId: "china_07",
    },
    {
      id: "c8",
      faction: "china",
      title: "山海同明",
      subtitle: "多线攻坚 / 终章",
      briefing:
        "中国部队进入山体核武器基地，盟军从海上攻击气象站。周砺必须在发射前解除威胁，并阻止萨文撤离。",
      terrain: "mountain",
      difficulty: 5,
      stages: [
        "利用渡口进入山体基地，建立前沿阵地。",
        "分兵停用三座核弹发射井，按地图设计选择切电、占领或摧毁。",
        "夺取指挥部，阻止萨文撤离并守到交接结束。",
      ],
      optional: "解救被拘押人员补全结局证词；夺取维修设施降低最后反扑损耗。",
      failure: "任一已明确启动倒计时的核弹发射，或己方主力与重建能力全部丧失。",
      save: "前沿阵地建立、核威胁解除后保存。三座发射井错峰计时，第二阶段开始时全部公开；切电后恢复供电的行为提前定义。",
      designProvenance: "原创战役设计；不是原版官方剧情或原版数值",
      sourcePlanningId: "china_08",
    },
  ],
};

export const ALL_MISSIONS = Object.values(CAMPAIGNS).flat();
export const CAMPAIGN_TITLES = {
  allied: "盟军线 · 破雾行动",
  china: "中国线 · 山海防线",
};
export function getMission(id) {
  return ALL_MISSIONS.find((mission) => mission.id === id) ?? null;
}
