/* Original stage design, re-expressed as 26x26 terrain cells.
 * No ROM, sprites, audio, third-party runtime, or third-party game code is bundled.
 * Every character is one original 8x8-pixel terrain cell; scale freely at runtime.
 * Important: original tank spawning clears its own 2x2 cells ($E3A9-$E3B4).
 * Stage 5 therefore initially contains brick at the upper-middle spawn location.
 * See SOURCE_VERIFICATION.md for exact provenance and comparison caveats.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TankLevels = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  return {
  "levels": [
    {
      "name": "砖墙纵列",
      "sourceStage": 1,
      "tiles": [
        "..........................",
        "..........................",
        "..BB..BB..BB..BB..BB..BB..",
        "..BB..BB..BB..BB..BB..BB..",
        "..BB..BB..BB..BB..BB..BB..",
        "..BB..BB..BB..BB..BB..BB..",
        "..BB..BB..BBSSBB..BB..BB..",
        "..BB..BB..BBSSBB..BB..BB..",
        "..BB..BB..BB..BB..BB..BB..",
        "..BB..BB..........BB..BB..",
        "..BB..BB..........BB..BB..",
        "..........BB..BB..........",
        "..........BB..BB..........",
        "BB..BBBB..........BBBB..BB",
        "SS..BBBB..........BBBB..SS",
        "..........BB..BB..........",
        "..........BBBBBB..........",
        "..BB..BB..BBBBBB..BB..BB..",
        "..BB..BB..BB..BB..BB..BB..",
        "..BB..BB..BB..BB..BB..BB..",
        "..BB..BB..BB..BB..BB..BB..",
        "..BB..BB..........BB..BB..",
        "..BB..BB..........BB..BB..",
        "..BB..BB...BBBB...BB..BB..",
        "...........B..B...........",
        "...........B..B..........."
      ],
      "roster": [
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "fast",
        "fast"
      ],
      "provenance": "Battle City (J), original stage 1; pinned disassembly stage_01.bin / TileTypeTable $DACB / enemy tables $E4EC and $E578. Source map retained exactly at 8px resolution; separate eagle wall overlaid; home base remains empty."
    },
    {
      "name": "断续防线",
      "sourceStage": 2,
      "tiles": [
        "......SS......SS..........",
        "......SS......SS..........",
        "..BB..SS......BB..BB..BB..",
        "..BB..SS......BB..BB..BB..",
        "..BB........BBBB..BBSSBB..",
        "..BB........BBBB..BBSSBB..",
        "......BB..........SS......",
        "......BB..........SS......",
        "FF....BB....SS....BBFFBBSS",
        "FF....BB....SS....BBFFBBSS",
        "FFFF......BB....SS..FF....",
        "FFFF......BB....SS..FF....",
        "..BBBBBBFFFFFFSS....FFBB..",
        "..BBBBBBFFFFFFSS....FFBB..",
        "......SSFFBB..BB..BB..BB..",
        "......SSFFBB..BB..BB..BB..",
        "SSBB..SS..BB..BB......BB..",
        "SSBB..SS..BB..BB......BB..",
        "..BB..BB..BBBBBB..BBSSBB..",
        "..BB..BB..BBBBBB..BBSSBB..",
        "..BB..BB..BBBBBB..........",
        "..BB..BB..BBBBBB..........",
        "..BB..............BB..BB..",
        "..BB.......BBBB...BB..BB..",
        "..BB..BB...B..B...BBBBBB..",
        "..BB..BB...B..B...BBBBBB.."
      ],
      "roster": [
        "armor",
        "armor",
        "fast",
        "fast",
        "fast",
        "fast",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic"
      ],
      "provenance": "Battle City (J), original stage 2; pinned disassembly stage_02.bin / TileTypeTable $DACB / enemy tables $E4EC and $E578. Source map retained exactly at 8px resolution; separate eagle wall overlaid; home base remains empty."
    },
    {
      "name": "对角森林",
      "sourceStage": 3,
      "tiles": [
        "........BB......BB........",
        "........BB......BB........",
        "..FFFFFFBB................",
        "..FFFFFFBB..........SSSSSS",
        "BBFFFFFF..................",
        "BBFFFFFF..................",
        "FFFFFFFF......BB..BBBBBBB.",
        "FFFFFFFF......BB..BBBBBBB.",
        "FFFFFFFFBBBBBBBB..BB...B..",
        "FFFFFFFFBBBBBB....BB...B..",
        "FFFFFFFF....BB.........B..",
        "FFFFFFFF....BB.........B..",
        "..FF........SSSSSS....FF..",
        "..FF........SSSSSS....FF..",
        "..................FFFFFFFF",
        "..BB..BB..........FFFFFFFF",
        "BBB..BBBB..BBBBBBBFFFFFFFF",
        "BBB..BBBB..B......FFFFFFFF",
        "..........BB......FFFFFFFF",
        "..........BB..BBBBFFFFFFFF",
        "BB....S.......BBBBFFFFFF..",
        "BB....S...........FFFFFF..",
        "BBBB..S...........FFFFFF..",
        "BBBB..S....BBBB...FFFFFF..",
        "SSBBBB.....B..B...BB......",
        "SSBBBB.....B..B...BB......"
      ],
      "roster": [
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "fast",
        "fast",
        "fast",
        "fast",
        "armor",
        "armor"
      ],
      "provenance": "Battle City (J), original stage 3; pinned disassembly stage_03.bin / TileTypeTable $DACB / enemy tables $E4EC and $E578. Source map retained exactly at 8px resolution; separate eagle wall overlaid; home base remains empty."
    },
    {
      "name": "砖墙堡垒",
      "sourceStage": 4,
      "tiles": [
        "..FFFF................FF..",
        "..FFFF................FF..",
        "FFFF......BBBB..........FF",
        "FFFF....BBBBBBBBBB......FF",
        "FF.....BBBBBBBBBBBBB....SS",
        "FF.....BBBBBBBBBBBBBBB....",
        "SS....BBBBBBBBBBBBBBBBB...",
        "......BBBBBBBBBBBBBBBBB...",
        ".....BBB......BBBBBB..B...",
        ".....B..........BBBB..B...",
        "WW...B..S...S...BBB.......",
        "WW...B..S...S...BBB.......",
        "....BB..........BBB...WWWW",
        "....BB..BBBB....BBB...WWWW",
        "....BBBBBBBBBBBBBBBB......",
        "....BBBBBBBBBBBBBBBB......",
        "...BBBBBBBBBBBBBBBBBB.....",
        "...BBBBBBBBBBBBBBBBBB.....",
        "..BBBBBBBBBBBBBBBBBBBB....",
        "......BBBBBBBBBBBB........",
        "..BBBB..BBBBBBBB..BBBB..FF",
        "..BBBBBB..BBBB..BBBBBB..FF",
        "FF..BBBB........BBBB..FFFF",
        "FF.........BBBB.......FFFF",
        "SSFF.......B..B.....FFFFSS",
        "SSFF.......B..B.....FFFFSS"
      ],
      "roster": [
        "power",
        "power",
        "power",
        "power",
        "power",
        "power",
        "power",
        "power",
        "power",
        "power",
        "fast",
        "fast",
        "fast",
        "fast",
        "fast",
        "basic",
        "basic",
        "armor",
        "armor",
        "armor"
      ],
      "provenance": "Battle City (J), original stage 4; pinned disassembly stage_04.bin / TileTypeTable $DACB / enemy tables $E4EC and $E578. Source map retained exactly at 8px resolution; separate eagle wall overlaid; home base remains empty."
    },
    {
      "name": "河流岔口",
      "sourceStage": 5,
      "tiles": [
        "........BBBBBB............",
        "........BBBBBB............",
        "........BB......SSSSSS....",
        "SS..BB..BB..........SS....",
        "SS..BB......BB............",
        "SS..BB......BB............",
        "BB..BBBBBB..BBBB..WWWW..WW",
        "BB..BBBBBB..BBBB..WWWW..WW",
        "BB......BB........WW......",
        "..................WW......",
        "........WWWW..WWWWWW..BBBB",
        "....BB..WWWW..WWWWWW..BBBB",
        "BBBB....WWBB..BBB.........",
        "BBBB....WWBB..BBB.........",
        "........WW...........SS...",
        "........WW...........SS...",
        "WWWWWW..WW..SS..BB...S....",
        "WWWWWW..WW..SS..BB...S....",
        ".....................SBBBB",
        "......BBBB...........SBBBB",
        "........BBBBBBBBBB........",
        "........BB......BBBB......",
        "BBBBBB............BBBB....",
        "BBBB.......BBBB.....BB....",
        "BB.........B..B...........",
        "...........B..B..........."
      ],
      "roster": [
        "power",
        "power",
        "power",
        "power",
        "power",
        "armor",
        "armor",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "fast",
        "fast",
        "fast",
        "fast",
        "fast"
      ],
      "provenance": "Battle City (J), original stage 5; pinned disassembly stage_05.bin / TileTypeTable $DACB / enemy tables $E4EC and $E578. Source map retained exactly at 8px resolution; separate eagle wall overlaid; home base remains empty."
    },
    {
      "name": "林间纵线",
      "sourceStage": 6,
      "tiles": [
        "...........B..B.FFFF......",
        "...........B..B.FFFF......",
        "..B..S..B........BFFB..BFF",
        "..B..S..B........BFFB..BFF",
        "..B..S..B...BB...BFFB..BFF",
        "..B..S..B...BB...BFFB..BFF",
        "..BB....BB..SS..BBFF..BBFF",
        "..BB....BB..SS..BBFF..BBFF",
        ".......BSS..BB..BBS...FFFF",
        ".......B....BB....S...FFFF",
        "BBBBB.....FFBBFF.....BBBBB",
        "BBBBB.....FFBBFF.....BBBBB",
        ".........BFFFFFFB.........",
        ".........BFFFFFFB.........",
        "SSBBBB..BBFFFFFFBB.BBBBBSS",
        "SSBBBB....FFFFFF...BBBBBSS",
        "SSSSSS......FF......SSSSSS",
        "........BB..FF..BB........",
        "..BB....BB......BB........",
        "..BB....BB......BB........",
        "..BBB.....BB..BB.....BBBFF",
        "..BBB................BBBFF",
        "....BB..............FFFFFF",
        "...........BBBB.....FFFFFF",
        "...........B..B.......FFFF",
        "....BB.....B..B.....BBFFFF"
      ],
      "roster": [
        "power",
        "power",
        "power",
        "power",
        "power",
        "power",
        "power",
        "fast",
        "fast",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "armor",
        "armor"
      ],
      "provenance": "Battle City (J), original stage 6; pinned disassembly stage_06.bin / TileTypeTable $DACB / enemy tables $E4EC and $E578. Source map retained exactly at 8px resolution; separate eagle wall overlaid; home base remains empty."
    }
  ],
  "sources": [
    {
      "title": "Battle City pinned NES disassembly: stage data and terrain/enemy tables",
      "url": "https://github.com/cyneprepou4uk/NES-Games-Disassembly/blob/df2c8e55e7f13e5792482527db9e7c9e4a84c6e1/Battle%20City/bank_FF.asm"
    },
    {
      "title": "Pinned original stage files, stages 01–06",
      "url": "https://github.com/cyneprepou4uk/NES-Games-Disassembly/tree/df2c8e55e7f13e5792482527db9e7c9e4a84c6e1/Battle%20City/incbin/stages"
    },
    {
      "title": "Independent comparison: cattle-bity original stage geometry and enemy rosters",
      "url": "https://github.com/dogballs/cattle-bity/tree/master/data/maps/original"
    },
    {
      "title": "Reverse-engineering notes: map encoding and eagle-wall geometry (not used for stage order)",
      "url": "https://github.com/vgrichina/battlecity/blob/main/REVERSE.md"
    }
  ],
  "tileSizeNES": 8,
  "fieldTiles": 26,
  "bonusEnemyOrdinals": [
    4,
    11,
    18
  ],
  "base": {
    "col": 12,
    "row": 24,
    "width": 2,
    "height": 2
  },
  "homeWall": [
    [
      11,
      23
    ],
    [
      12,
      23
    ],
    [
      13,
      23
    ],
    [
      14,
      23
    ],
    [
      11,
      24
    ],
    [
      14,
      24
    ],
    [
      11,
      25
    ],
    [
      14,
      25
    ]
  ],
  "spawnClearsTerrain": true
};
}));
