# 原作参考与实现边界 · v1.8

更新日期：2026-10-26。

## 资料

1. Taito《HOW TO PLAY ARKANOID》NES 原版说明书扫描，Digital Press 保存：
   https://www.digitpress.com/library/manuals/nes/Arkanoid.pdf
   原始说明书是规则主来源。参考彩砖分值、银砖耐久、金砖不可破坏、发球与激光共用主动作、胶囊种类。

2. 原版说明书的文字转录，World of Nintendo：
   https://www.world-of-nintendo.com/manuals/nes/arkanoid.shtml
   用于对照扫描的规则：第 1–8 关银砖需要 2 次击中；随后按 8 关一组增加。彩砖白 / 橙 / 浅蓝 / 绿 / 红 / 蓝 / 粉 / 黄对应 50 / 60 / 70 / 80 / 90 / 100 / 110 / 120 分；银砖为 50 × 当前关数。

3. Rick N. Bruns / NESmaps，《Arkanoid Map of all Levels》，v2.0（2009）：
   https://nesmaps.com/maps/Arkanoid/Arkanoid.html
   直接图像：https://nesmaps.com/maps/Arkanoid/Arkanoid.png
   主布局参考。按实机地图的 35 屏砖阵转成 11 列字符网格，并逐关核对；未把原图作为游戏资产或发布附件。

4. AWing_Pilot / Christopher Long，NES《Arkanoid FAQ》，Final（2008-06-17）：
   https://gamefaqs.gamespot.com/nes/563383-arkanoid/faqs/41196
   以及关卡 1–10 图谱目录：
   https://gamefaqs.gamespot.com/nes/563383-arkanoid/map/2716-block-layouts-rounds-1-10
   用作结构与颜色类别的辅助核对，没有复制其说明文字或图片。图谱原图访问未成功，采用可访问的 NESmaps 实机图校验。

## 36 关流程与关卡来源

本作采用美版 NES 的 35 面砖阵 + 第 36 关 DOH 流程。不同地区 / 平台版本关数不同，不能把这个数量统称为所有“原版”。

`levels.js` 中第 1–35 项按 NESmaps 图谱保留主要布局、空行与砖类型；第 36 项是 Boss 元数据，不是空砖阵自动清关。新增地图逐格读取并与源图并排核对；第 3 关同时校正了首行后空行及末行金砖 / 蓝砖排列。配色、砖像素尺寸、纵向起始位置、球径与空隙是适配，不宣称 ROM 精确复刻。原图未作为游戏资产或发布附件。

第 36 关参考图谱中的红色网格 DOH 头部概念，采用原创铜红分段刻线、眉骨、长鼻和方颚像素造型。没有复制原作精灵或描摹逐像素轮廓。

## 规则依据与明确适配

- 说明书：彩砖白 / 橙 / 浅蓝 / 绿 / 红 / 蓝 / 粉 / 黄对应 50 / 60 / 70 / 80 / 90 / 100 / 110 / 120 分；银砖得分为 50 × 关数；金砖不可破坏，不计入清关目标。
- 银砖耐久采用说明书转录：第 1–8 关 2 击，随后每 8 关增加 1 击，至第 33–35 关为 6 击。辅助 FAQ 的初始耐久写法不同，本作不据 FAQ 的差异项宣称精确。
- 7 种胶囊：E 加长、L 激光、C 粘球、D 三球、S 减速、P 加命、B 传送。激光不能打碎金砖。三球全部丢失才扣命。B 打开右门后挡板需到达右侧；换能力、失命、换关清门。
- 一次最多一枚掉落胶囊；三球时不掉落。P / B 稀有，E / D 更常见；实际权重与 RNG 为本作参数，不复制原机随机过程。
- 挡板顶面左右各 3 档方向、撞砖累计加速、首次触顶提速参考作者的 NES 机制研究；实际角度、速度档、阈值和时机适配当前画布。
- 漂浮障碍最多 3 个，从顶部闸门出现，能被球、激光或挡板撞毁。轨迹、时间表、得分 100 和图形是简化重建，不复刻原机绕行与漂移 bug。
- DOH 采用 16 点耐久、瞄准火球、命中反馈与击败退场。失命重置 Boss 满血、清除火球，重新发球后留攻击缓冲。耐久、弹速、攻击节奏、受击判定和重置处理均为本作适配，不声称原机参数。
- 纯 JavaScript / Canvas 原创绘制及 Web Audio 音效，不使用 ROM、模拟器、原作源码、贴图或音乐。
- 连续时间矩形碰撞近似并非原机碰撞代码。后期关卡速度按本作规则适配，不据前八关资料外推同帧一致性。
- 新增自由选关、鼠标 / 触屏、暂停和失焦保护、最佳分保存；3 条起始生命、最多 9 条、清砖奖励 500 分为本作规则。B 传送没有清砖奖励。
- 未实现双人模式、原机控制器校准、特殊侧向挤球 / bump、原机计分累加动画和精确帧时序。

## 视频与机制研究入口

- World of Longplays / KAGE-008，NES 美版全流程（36:24）：
  https://longplays.org/infusions/longplays/longplays.php?cat_id=15&longplay_id=10823
  https://www.youtube.com/watch?v=5MMrXKgeKMs
  已核实平台、版本、作者与入口，目录注明美版 36 关。未把视频元数据当作逐帧观看证据；频道可能使用即时存档，不称真人无辅助速通。
- eien86 / Chef_Stef，NES Arkanoid warpless，TASVideos：
  https://tasvideos.org/9448S
  工具辅助速通入口，不是真人实时纪录。
- Chef_Stef，NES Arkanoid 机制研究（Game Mechanics / Decision Points）：
  https://tasvideos.org/6347S
  六档出射方向、撞砖 / 首次触顶加速、障碍上限与胶囊稀有度的研究参考。只采用规则结构，不复制研究者引擎。

## 验证边界

核心与 Boss 自动测试见 `tests/`，真实浏览器检查由集合主任务统一记录。v1.8 新增正常输入自动接球验证：逐关、连续战役和额外三种种子均完成全部 36 关；不等同原版实机或人工通关。没有下载或执行未知 ROM，也没有把第三方模拟器当作已验证入口。

Arkanoid、相关商标和原作权利归各自权利人所有。本作是非官方玩法参考，不宣称得到 Taito 或 Nintendo 授权。
