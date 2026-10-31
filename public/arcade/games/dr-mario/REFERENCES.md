# 马里奥医生：原作对照与实现边界

资料检查日期：2026-10-25。参考对象：1990 年 FC / NES《Dr. Mario》单人玩法。此处记录规则核对来源，不表示官方授权、ROM 模拟或逐帧一致。

## 主要来源

1. Nintendo 官方 NES Classic 说明书：
   https://www.nintendo.co.jp/clv/manuals/en/pdf/CLV-P-NAAXE_en.pdf
   核对红黄蓝三色、横纵至少四格、顺/逆时针旋转、清病毒与堵瓶口、菜单等级和速度。
2. Nostaljipi 的公开注释反汇编项目（自述 Japan/USA Rev A）：
   https://github.com/Nostaljipi/dr-mario-disassembly
   此次只阅读规则、常量与数据表，没有取得、运行或附带 ROM。没有逐字节构建核验其兼容性。所取行为依据普通分支，不采用项目可选优化或修错分支。
   - 常量：https://github.com/Nostaljipi/dr-mario-disassembly/blob/main/defines/drmario_constants.asm
   - 胶囊序列与关卡初始化：https://github.com/Nostaljipi/dr-mario-disassembly/blob/main/prg/drmario_prg_level_init.asm
   - 病毒放置、旋转、消除、计分与重力：https://github.com/Nostaljipi/dr-mario-disassembly/blob/main/prg/drmario_prg_game_logic.asm
   - 高度与下落速度表：https://github.com/Nostaljipi/dr-mario-disassembly/blob/main/data/drmario_data_game.asm
   - 16 位随机数：https://github.com/Nostaljipi/dr-mario-disassembly/blob/main/prg/drmario_prg_general.asm
3. 社区机制交叉核对：
   https://wiki.drmar.io/index.php?title=Mechanics_(NES)
   辅助核对胶囊计数包含预览而导致第 8、18…颗提速。具体参数仍以程序常量和分支解释为准。

## 本版具体采用的规则

### 病毒数量与生成，不是关卡图片

`virusCount = 4 × (min(level, 20) + 1)`。可选等级 0—20 对应 4—84 只。最大底部高度索引为 9 / 10 / 11 / 12，分别在等级 0 / 15 / 17 / 19 切换。

重建程序中的 16 位移位反馈随机数。每次候选使用第一个字节的低四位选离底部高度，超出高度上限则重选；同一次随机数的第二字节低三位选列。默认颜色为剩余病毒数与 3 按位与；为 3 时另取颜色表 `[0,1,2,2,1,0,0,1,2,2,1,0,0,1,2,1]`。0 黄、1 红、2 蓝。

从候选格向右扫描，行尾向下一行。空格若与上下左右恰好两格的已放置病毒同色则改色，按颜色递减环绕找可用色；三色全被排除则继续扫描。扫描到瓶底以外则重新随机候选。这比「不出现四连」更严格，也不强行均分三色。

来源定位：`addVirus`、`addVirus_maxHeight_basedOnLvl`、`virusSameColorCheck`；level_init 中的初始病毒数量。

胶囊先于病毒生成，每关 128 组有序颜色对循环使用。逆序填写储备，颜色对 ID 累加随机低四位再对 9 取余。储备从预览偏移 1 开始。来源：`generatePillsReserve` / `generateNextPill` / `randomNumberGenerator`。

边界：本版以浏览器生成起始种子，不模拟开机、菜单停留、预览和投药动画中的完整随机数推进。低 16 位和高 16 位折叠为种子；退化到 0 或 1 的状态会被规范化。生成函数带有安全重试上限，避免坏输入无限循环。因此不能声称某个种子与某次原版实机开局逐格一致。

### 下落、旋转与连接

8 × 16 瓶身；水平胶囊从第 4、5 列最上行进入。左下 2×2 支点，H[A,B] 顺时针转成 A 在上、B 在下。横转竖不踢墙；竖转横只可左移一格尝试。允许一半转出瓶顶；落定时上方一半丢弃，下一次出生冲突决定失败。

横竖四连的并集一次清除，交点病毒不重复得分。消除后解除断片链接。相连两半共同下落，病毒固定，单片独立下落；完全稳定后检查新一波匹配。

来源定位：`fallingPill_checkYMove`、`fallingPill_checkXMove`、`pillRotateValidation`、`pillMoveValidation`、`confirmPlacement`、`checkDrop`、`checkHorMatch`、`checkVerMatch`、`updateField`。

### 下落节奏与计分

正常下落以 60 Hz 模拟，基础表索引 LOW 15 / MED 25 / HI 31 对应 40 / 20 / 14 帧。细速度索引为 `min(49, floor((lockedCapsules + 2) / 10))`，每关重置。完整查表实现在核心中。软降每 2 帧，横移连发初延迟 16 帧、随后每 6 帧。

来源：`baseSpeedSettingValue`、`speedCounterTable`、`generateNextPill`、`fallingPill_checkYMove` 与常量表。表中保存的计时值比实际帧数少 1，本版采用实际帧数。

病毒得分基数 LOW 100 / MED 200 / HI 300，单次胶囊引发的累计倍率 1、2、4、8、16、32、32…，包括后续连锁。只消胶囊和加速下落不得分。来源：`scoreIncrease`、`resetCombo`、`scoreMultiplier_table`。

## 有意适配或未复刻

- 选关范围 0—20，本版在 20 级完成后结束并允许重选。原版可继续等级 21+，病毒数量封顶 84；Rev A 显示等级存在 24 的上限。本版没有宣称收录原版无限流程。
- 未制作双人对战、5/10/15 级插曲、20 级恐龙/UFO 等原作结局演出。
- 页面、瓶身、病毒和医生像素画均为原创；视觉比例、投药衔接、消除闪烁、重力动画间隔是浏览器适配。核心下落和横移时序有来源，不表示整台 NES 的每一帧都被模拟。
- 输入采用浏览器事件短按缓存；未复制原版左移与旋转特定组合产生的双步等输入怪异行为。没有硬降或暂存胶囊。
- 安全数值计分，不复现原版大连锁导致的计分溢出或故障。
- v1.5 的 Fever 为依据公开程序乐谱数据所作的 Web Audio 合成重建，不是原声录音，也不是完整 NES APU 逐周期模拟；消除等音效参考原程序参数。旧有轻快/舒缓原创曲仍作为可选曲目。可选本地文件只在浏览器内播放、不上传；来源和差异见 `AUDIO.md`。

## 录像入口与真实核验范围

- World of Longplays《NES Longplay [424] Dr Mario》：https://www.youtube.com/watch?v=IHXdtKEHDNU
  公开索引核对了标题、上传者与描述。作者说明该频道常使用即时存档，不能当作未辅助实时操作的速度标定。
- Razorflamekun《5-14-19 Dr. Mario (NES) Speedrun (0-20, Glitchless, Resets) (1:23:33) [PB]》：https://www.youtube.com/watch?v=DZqhKyJnjDg
  公开索引核对到作者描述，标注 NEStopia UE 与 RTA 时间；没有独立测时。
- TASVideos 单关 20 级 HI 工具辅助展示：https://tasvideos.org/1290M
  已阅读发布说明；这是 TAS，不是普通手动操作时序证据。

以上录像作为用户可继续查看的参考入口。本次没有播放、逐帧测量或从视频提取声音/画面。规则核验以官方说明书与可阅读程序资料为主。测试结果见核心测试与合集 QA，不把 Node 测试当作录像复核。

## v1.5 用户指定录像与声音、舞蹈

- 用户指定：https://www.bilibili.com/video/BV1px411T7nn/ 。2026-10-26 重新打开后播放器恢复正常，读取到 159 秒时长、可见 FC 游戏画面和左下圆形放大镜三色病毒。播放器显示音乐标注「Dr. Mario - Fever -Fever Clear」。标注不等于听觉核验；本次工具未传回音频，未声称实际试听。此前播放失败的具体原因仍不明。
- 音乐数据：https://github.com/Nostaljipi/dr-mario-disassembly/blob/main/data/drmario_data_music.asm
- 音效参数：https://github.com/Nostaljipi/dr-mario-disassembly/blob/main/data/drmario_data_sfx.asm
- 舞蹈是根据原作可见形态和摆动节奏制作的适配动画，保留本版精绘病毒，不是原 ROM 精灵逐帧复制。
