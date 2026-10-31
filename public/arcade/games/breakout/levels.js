/* NES 35-round campaign layouts, transcribed from Rick N. Bruns / NESmaps.
 * Sources, extraction checks and deliberate coordinate adaptation: LEVEL_SOURCES.md.
 * No original game code or image assets are included. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BreakoutLevels = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const LEVELS = [
    {"name":"彩虹墙","subtitle":"从最简单的回弹开始","rows":["SSSSSSSSSSS","RRRRRRRRRRR","BBBBBBBBBBB","YYYYYYYYYYY","PPPPPPPPPPP","GGGGGGGGGGG"]},
    {"name":"上升阶梯","subtitle":"找到阶梯右侧的入口","rows":["O..........","OL.........","OLG........","OLGB.......","OLGBR......","OLGBRO.....","OLGBROL....","OLGBROLG...","OLGBROLGB..","OLGBROLGBR.","SSSSSSSSSSO"]},
    {"name":"金色迷宫","subtitle":"金砖不碎，沿缺口穿行","rows":["GGGGGGGGGGG","...........","WWWgggggggg","...........","RRRRRRRRRRR","...........","ggggggggWWW","...........","PPPPPPPPPPP","...........","BBBgggggggg","...........","BBBBBBBBBBB","...........","ggggggggBBB"]},
    {"name":"双子高塔","subtitle":"穿过中央，再从内部击破","rows":[".SYGP.YGBS.",".BGYR.GYSB.",".GPRY.BSYG.",".YRPG.SBGY.",".RYGB.YGPR.",".PGYS.GYRP.",".GBSY.PRYG.",".YSBG.RPGY.",".SYGP.YGBS.",".BGYR.GYSB.",".GPRY.BSYG.",".YRPG.SBGY.",".RYGB.YGPR.",".PGYS.GYRP."]},
    {"name":"银色来客","subtitle":"熟悉的轮廓，需要两次命中","rows":["...Y...Y...","....Y.Y....","....Y.Y....","...SSSSS...","...SSSSS...","..SSRSRSS..","..SSRSRSS..",".SSSSSSSSS.",".SSSSSSSSS.",".S.SSSSS.S.",".S.S...S.S.",".S.S...S.S.","....S.S....","....S.S...."]},
    {"name":"六道光柱","subtitle":"窄巷里的角度练习","rows":["B.R.G.G.R.B","B.R.G.G.R.B","B.R.G.G.R.B","B.gOgOgOg.B","B.R.G.G.R.B","B.R.G.G.R.B","B.R.G.G.R.B","B.R.G.G.R.B","B.R.G.G.R.B","O.g.g.g.g.O","B.R.G.G.R.B"]},
    {"name":"七彩星球","subtitle":"从外缘慢慢剥开它","rows":["....YLB....","...YGBLY...","...LBGYO...","..GBLYGRO..","..BGYORGY..","..LYGROYG..","..YORGYLB..","..GROYGBL..","..RGYLBGY..","...YGBLY...","...LBGYO...","....LYG...."]},
    {"name":"黄金轨道","subtitle":"只剩七块，也要稳稳击中","rows":[".g..g.g..g.",".gg.....gg.",".....O.....","....gGg....","..g..Y..g..",".....B.....","..g..R..g..","....gGg....",".....Y.....",".gg.....gg.",".g..g.g..g."]},
    {"name":"彩色城堡","subtitle":"先拆彩墙，再进城垛","rows":[".g.g...g.g.",".gGg...gGg.",".gBg...gBg.",".ggg...ggg.","...........","...PBBBY...","...PGLGY...","...PLGLY...","...PGLGY...","...PLGLY...","...PBBBY..."]},
    {"name":"蓝色星眼","subtitle":"沿金色边界，击中星心","rows":[".g.........","...........",".g.........",".g.........",".g....B....",".g...BLB...",".g..BLBLB..",".g.BLBSBLB.",".g..BLBLB..",".g...BLB...",".g....B....",".g.........",".g.........",".g.........",".g.........",".gggggggggg"]},
    {"name":"白银回廊","subtitle":"穿越回廊，清除银砖","rows":[".SSSSSSSSS.",".S.......S.",".S.SSSSS.S.",".S.S...S.S.",".S.S.S.S.S.",".S.S...S.S.",".S.SSSSS.S.",".S.......S.",".SSSSSSSSS."]},
    {"name":"黄金栅格","subtitle":"狭窄栅格间寻找入口","rows":["ggggggggggg","....g...gO.",".gG.g...g..",".g..g.g.g..",".g..g.g.g..",".g..gGg.g..",".g.Og.gBg..",".g..gRg.g..",".g..g.g.g..",".g..g.g.g..",".gL...g....",".g....g...O",".gggggggggg"]},
    {"name":"三面彩旗","subtitle":"三面彩旗逐一拆解","rows":[".YY.WWW.YY.",".WW.YYY.WW.",".BB.RRR.BB.",".PP.GGG.PP.",".GG.PPP.GG.",".RR.BBB.RR.",".YY.WWW.YY.",".WW.YYY.WW."]},
    {"name":"横贯长城","subtitle":"绕过金角，打穿横墙","rows":["RSSSSSSSSSR","g.........g","BBBBBBBBBBB","...........","OSSSSSSSSSO","g.........g","BBBBBBBBBBB","...........","BSSSSSSSSSB","g.........g","RRRRRRRRRRR","...........","RRRRRRRRRRR","g.........g"]},
    {"name":"彩蝶双翼","subtitle":"从双翼边缘击入银色骨架","rows":["LSSLLLLLSSL","LSYSLLLSGSL","LSYYSSSGGSL","LSYYYSGGGSL","LSYYYSGGGSL","LSYYYSGGGSL","LSYYYSGGGSL","LSYYYSGGGSL","LSYYYSGGGSL","LLSYYSGGSLL","LLLSYSGSLLL","LLLLSSSLLLL"]},
    {"name":"彩色波纹","subtitle":"波纹间寻找反弹角度","rows":[".....g.....","...WW.WW...",".WW..g..WW.","W..YY.YY..W",".YY..g..YY.","Y..GG.GG..Y",".GG..g..GG.","G..RR.RR..G",".RR..g..RR.","R..BB.BB..R",".BB..g..BB.","B..GG.GG..B",".GG.....GG.","G.........G"]},
    {"name":"晴空雨伞","subtitle":"收起彩伞，清除伞柄","rows":[".....S.....","...BBSGG...","..BBWWWGG..",".BBWWWWWGG.",".BBWWWWWGG.",".BBWWWWWGG.",".S.S.S.S.S.",".....S.....",".....S.....","...g.g.....","...ggg.....","....g......"]},
    {"name":"黄金穹顶","subtitle":"越过穹顶，深入立柱","rows":["O.gYYYYYg.O","O.ggYYYgg.O","O.g.gYg.g.O","O.g.GSG.g.O","O.g.G.G.g.O","O.g.G.G.g.O","O.g.G.G.g.O","O.g.G.G.g.O","O.g.G.G.g.O","OgggG.GgggO"]},
    {"name":"双彩方阵","subtitle":"绕过金色方框的两侧","rows":["..ggggggg..","..GRBgBRG..","..GRBgBRG..","..GRBgBRG..","..GRBgBRG..","..GRBgBRG..","..GRBgBRG..","..GRBgBRG..","..ggggggg.."]},
    {"name":"粉色折线","subtitle":"穿梭金砖，追逐粉色折线","rows":["GgOgLgGgPgO","PgSgSgSgSgL","..P........",".g.gPg.g.g.",".g.g.gPg.g.",".g.g.g.gPg.","...........",".g.g.gPg.g.",".g.gPg.g.g.","..Pg.g.g...","P....g....."]},
    {"name":"金色画框","subtitle":"从上方缺口进入画框","rows":[".gOOOOOOOg.",".g.......g.",".g.ggggg.g.",".g.gBBBg.g.",".g.gPPPg.g.",".g.gGGGg.g.",".g.gOOOg.g.",".g.gLLLg.g.",".g.......g.",".g.......g.",".ggggggggg."]},
    {"name":"三层横阵","subtitle":"穿过横阵的狭窄缺口","rows":["YYYYYYYYYYY","YYYYYYYYYYY","...........","Rg.gRRRg.gR","Rg.gRRRg.gR","Rg.gRRRg.gR","Rg.gRRRg.gR","...........","WWWWWWWWWWW","WWWWWWWWWWW"]},
    {"name":"银色九宫","subtitle":"银色方阵需要耐心","rows":["BBBBBBBBBBB","...........","SSS.SSS.SSS","SGS.SGS.SGS","SSS.SSS.SSS","...........","..SSS.SSS..","..SRS.SRS..","..SSS.SSS..","...........","SSS.SSS.SSS","SBS.SBS.SBS","SSS.SSS.SSS"]},
    {"name":"蓝色雪峰","subtitle":"从山脚向雪顶推进","rows":["....WWW....","....WWW....","....WWW....","...WBWBW...","...BBBBB...","..BBBBBBB..","..BBBBBBB..",".BBBBBBBBB.","BBBBBBBBBBB"]},
    {"name":"黄金门廊","subtitle":"找到金门里的通道","rows":["RRRRRRRRRRR","GGGGGGGGGGG","BBBBBBBBBBB","ggggRRRgggg","gGGgSSSgGGg","gRRg...gBBg","g.........g","g.........g","g.........g","g..gGGGg..g","gSSgggggSSg"]},
    {"name":"环形小星","subtitle":"从环形缺口击入星心","rows":["..gSSg.....",".g....g....","g..LL..g...","g.BBBB.g...","g..PP..g...",".g....g....","..gggg....."]},
    {"name":"白银夹层","subtitle":"银色横墙，耐心破开","rows":["SSSSSSSSSSS","YYYYYYYYYYY","SSSSSSSSSSS","...........","SSSSSSSSSSS","RRRRRRRRRRR","SSSSSSSSSSS"]},
    {"name":"倒悬彩冠","subtitle":"先开外缘，再入彩冠","rows":["BBBBBBBBBBB","BgggPgPgggB","Bg.......gB","BgP.....PgB","BgPP...PPgB",".BgPP.PPgB.","..BgPPPgB..","...BgPgB...","....BPB....",".....B....."]},
    {"name":"黄金双墙","subtitle":"两侧推进，穿过金色分隔","rows":["BBBBg.gBBBB","GGGGg.gGGGG","ggggg.ggggg","PPPPg.gPPPP","OOOOg.gOOOO","BBBBg.gBBBB","SSSSg.gSSSS","OOOOg.gOOOO","PPPPg.gPPPP","GGGGg.gGGGG"]},
    {"name":"斜向彩带","subtitle":"斜向长带，注意下沿反弹","rows":["OP.........","OPLG.......","OPLGOP.....","OPLGOPLG...","SPLGOPLGOP.",".gSGOPLGOPL","...gSPLGOPL",".....gSGOPL",".......gSPL",".........gS"]},
    {"name":"交错棋盘","subtitle":"在交错空隙中连续反弹","rows":["B.R.G.P.B.R","S.S.S.S.S.S",".G.R.B.O.G.",".S.S.S.S.S.","O.B.R.G.P.B","S.S.S.S.S.S",".P.G.R.B.O.",".S.S.S.S.S.","G.O.B.R.G.P","S.S.S.S.S.S",".B.P.G.R.B.",".S.S.S.S.S.","R.G.O.B.R.G","S.S.S.S.S.S"]},
    {"name":"黄金琴键","subtitle":"沿琴键窄道逐层击破","rows":["..g.g.g.g..","..g.g.g.g..","..g.g.g.g..","..g.g.gRR..","..g.g.g.g..","..g.gBBBB..","..g.g.g.g..","..gRRRRRR..","..g.g.g.g..","..YYYYYYY..","..SSSSSSS.."]},
    {"name":"三色宝塔","subtitle":"三色高塔，银砖藏在拐角","rows":[".....RR....","....RSSR...","....RSRR...","....RRRR...","....RRRR...","....RRRR...","...GGRRRB..","..GSSRRSSB.","..GSGGBSBB.","..GGGGBBBB.","..GGGGBBBB.","..GGGGBBBB.","..GGGGBBBB.","...GG..BB.."]},
    {"name":"彩色球拍","subtitle":"从长柄进入彩色球面","rows":["......LLL..","......LLP..",".....LLPPP.",".....LLLPB.",".....LLLLB.","....gLLLLB.","....OBLLBB.","....OOBBB..","...gOgBBB..","...OOOO....","..gOgO.....","..OOOO.....","..OOO......",".OOO.......",".OO........"]},
    {"name":"花园终章","subtitle":"花园里的最后一片砖墙","rows":[".........W.",".........WW","...WWWW....","....WWWW...",".....ggg...","..W........",".WOW.......","WOgOW......",".WOW.......","..W.......O","..P..g.GGG.","G.P.G.G.GPG","gGPG.PGgG..","gGPG.G.OGG.","ggGgG..GG.."]},
    {"name":"最终决战 · DOH","subtitle":"击败最后的守卫","boss":true,"rows":[]}
  ];
  return { LEVELS };
});
