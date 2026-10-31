/* Fever: note/timing reconstruction from the documented NES score.
 * Web Audio timbres/percussion are approximations, not an original recording or APU emulation.
 * Other optional tunes and victory/gameover jingles are original. See AUDIO.md. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = { createAudio: factory };
  else root.DrMarioAudio = factory(root);
}(typeof window !== 'undefined' ? window : globalThis, function createAudio(environment) {
  'use strict';
  var env = environment || (typeof window !== 'undefined' ? window : {});
  var doc = env.document;
  var Context = env.AudioContext || env.webkitAudioContext;
  var context = null, master = null, limiter = null, noiseBuffer = null;
  var enabled = true, track = 'fever', playing = false, disposed = false;
  var hidden = !!(doc && doc.hidden), pageHidden = false;
  var timer = null, nextStepTime = 0, step = 0, voices = new Set();
  var lastEffect = Object.create(null), listeners = [];
  var customAudio = null, customURL = null, customName = '', customBlocked = false;
  var customError = '', customPlayPending = false, customPlayToken = 0;
  var LOOK_AHEAD = 0.15, TICK_MS = 40, MAX_VOICES = 32;
  var setTimer = env.setInterval ? env.setInterval.bind(env) : setInterval;
  var clearTimer = env.clearInterval ? env.clearInterval.bind(env) : clearInterval;

  // Sixteen individually authored bars per tune. Each event is [sixteenth, MIDI,
  // duration in sixteenths]. Rests, answers, and turnaround bars are intentional.
  // Pulse: a springy D-Dorian conversation. Calm: a spacious C-Lydian night walk.
  var scores = {
    pulse: {
      bpm: 132,
      roots: [38, 41, 43, 36, 38, 45, 43, 36, 41, 40, 43, 45, 38, 36, 43, 38],
      thirds: [3, 4, 4, 4, 3, 3, 4, 4, 4, 3, 4, 3, 3, 4, 4, 3],
      lead: [
        [[0,74,1.3],[3,77,0.8],[6,76,0.8],[7,81,1.1],[10,79,1.2],[13,76,0.8],[15,72,0.7]],
        [[1,77,1.3],[4,81,0.8],[6,79,1.3],[9,76,0.8],[12,77,1.6],[15,81,0.7]],
        [[0,79,0.8],[2,83,1.3],[5,81,0.8],[7,79,1.1],[10,76,0.8],[12,74,1.8]],
        [[1,76,0.8],[3,79,0.8],[6,84,1.8],[10,83,0.8],[12,79,0.8],[14,76,0.8],[15,72,0.7]],
        [[0,74,1.3],[3,77,0.8],[6,81,0.8],[7,84,1.1],[10,81,1.2],[13,77,0.8],[15,76,0.7]],
        [[1,81,0.8],[3,84,1.3],[6,83,0.8],[9,79,1.1],[12,76,1.4],[15,77,0.7]],
        [[0,79,0.8],[2,83,1.3],[5,86,0.8],[7,83,1.1],[10,81,0.8],[12,79,1.8]],
        [[1,76,1.1],[4,72,1.2],[7,79,0.8],[10,76,0.8],[12,74,0.8],[14,72,1.1]],
        [[0,81,1.8],[4,77,0.8],[6,76,0.8],[9,77,1.3],[12,84,1.1],[15,81,0.7]],
        [[1,79,1.3],[4,76,1.1],[7,83,0.8],[9,81,1.3],[13,79,1.3]],
        [[0,83,1.3],[3,86,0.8],[5,83,0.8],[8,79,1.3],[11,81,0.8],[14,83,1.1]],
        [[1,84,1.8],[5,81,0.8],[8,79,0.8],[10,76,1.3],[14,72,1.1]],
        [[0,74,1.3],[3,77,0.8],[6,76,0.8],[7,81,1.1],[10,79,1.2],[13,77,1.1]],
        [[1,76,0.8],[3,79,1.3],[6,84,0.8],[9,79,1.3],[12,76,1.4]],
        [[0,79,0.8],[2,83,0.8],[4,86,1.3],[7,83,0.8],[10,81,0.8],[12,79,0.8],[14,76,1.1]],
        [[0,77,1.3],[3,76,0.8],[6,74,2.7],[12,69,0.8],[14,72,0.7],[15,73,0.5]]
      ]
    },
    calm: {
      bpm: 88,
      roots: [36, 43, 40, 38, 36, 45, 43, 38, 40, 43, 45, 38, 36, 40, 43, 36],
      thirds: [4, 4, 3, 4, 4, 3, 4, 4, 3, 4, 3, 4, 4, 3, 4, 4],
      lead: [
        [[1,76,1.8],[5,79,1.2],[8,78,1.8],[13,74,1.3]],
        [[0,71,2.1],[6,74,1.2],[9,78,1.4],[14,79,1.1]],
        [[2,76,1.8],[7,71,1.3],[10,74,1.6]],
        [[1,78,1.3],[4,81,1.8],[10,76,1.3],[14,74,1.1]],
        [[1,76,1.8],[5,79,1.2],[8,83,1.8],[13,81,1.3]],
        [[0,84,2.1],[6,81,1.2],[9,79,1.4],[14,76,1.1]],
        [[2,78,1.8],[7,74,1.3],[10,71,1.6]],
        [[1,69,1.3],[4,74,1.8],[10,78,1.3],[14,81,1.1]],
        [[0,83,1.8],[5,79,1.3],[9,76,1.6],[13,78,1.2]],
        [[2,79,2.1],[7,74,1.2],[11,71,1.7]],
        [[1,72,1.3],[4,76,1.8],[9,81,1.5],[14,79,1.1]],
        [[0,78,1.8],[5,74,1.3],[9,69,1.6],[13,74,1.2]],
        [[1,76,1.8],[5,79,1.2],[8,78,1.8],[13,74,1.3]],
        [[0,71,2.1],[6,76,1.2],[9,79,1.4],[14,83,1.1]],
        [[2,81,1.8],[6,78,1.3],[10,74,1.3],[14,71,1.1]],
        [[1,72,2.4],[6,76,1.2],[10,79,1.4],[14,74,0.9]]
      ]
    }
  };

  // Derived note events [frame, MIDI pitch, duration frames, pulse duty index].
  // Nostaljipi/dr-mario-disassembly: data/drmario_data_music.asm, NTSC Fever.
  // Intro is 192 frames; subsequent 3840-frame chorus loops without the intro.
  var feverChannels = [[[0,43,12,3],[12,43,12,3],[24,46,12,3],[36,47,12,3],[48,48,12,3],[60,47,12,3],[72,46,12,3],[84,45,12,3],[96,43,12,3],[108,43,12,3],[120,46,12,3],[132,47,12,3],[144,48,12,3],[156,47,12,3],[168,46,12,3],[180,45,12,3],[192,62,12,2],[204,64,12,2],[216,62,12,2],[228,64,12,2],[240,64,12,2],[252,63,12,2],[264,62,12,2],[276,60,12,2],[288,62,12,2],[300,64,12,2],[312,62,12,2],[324,62,12,2],[336,64,12,2],[363,55,3,2],[366,54,3,2],[369,53,3,2],[372,52,3,2],[375,51,3,2],[384,62,12,2],[396,64,12,2],[408,63,12,2],[420,64,12,2],[432,64,12,2],[444,63,12,2],[456,62,12,2],[468,64,12,2],[480,55,6,3],[486,55,6,3],[492,55,12,3],[504,55,6,3],[510,55,6,3],[516,55,12,3],[528,55,6,3],[534,55,6,3],[540,55,12,3],[552,55,6,3],[558,55,6,3],[564,55,12,3],[576,62,12,2],[588,64,12,2],[600,62,12,2],[612,64,12,2],[624,64,12,2],[636,63,12,2],[648,62,12,2],[660,60,12,2],[672,62,12,2],[684,64,12,2],[696,62,12,2],[708,62,12,2],[720,64,12,2],[768,62,12,2],[780,64,12,2],[792,62,12,2],[804,64,12,2],[816,64,12,2],[828,64,12,2],[840,64,12,2],[852,64,12,2],[867,92,3,2],[873,86,3,2],[882,83,3,2],[891,72,3,2],[897,81,3,2],[900,62,3,2],[912,98,3,2],[915,92,3,2],[918,88,3,2],[921,69,3,2],[927,66,3,2],[930,86,3,2],[936,75,3,2],[939,73,3,2],[942,71,3,2],[945,69,3,2],[948,70,3,2],[951,67,3,2],[960,67,6,2],[966,67,6,2],[972,67,12,2],[984,67,12,2],[996,67,12,2],[1008,65,12,2],[1020,70,12,2],[1032,69,12,2],[1044,65,12,2],[1056,67,6,2],[1062,67,6,2],[1068,67,12,2],[1080,67,12,2],[1092,67,12,2],[1104,69,12,2],[1152,67,6,2],[1158,67,6,2],[1164,67,12,2],[1176,67,12,2],[1188,67,12,2],[1200,65,12,2],[1212,70,12,2],[1224,69,12,2],[1236,65,12,2],[1248,57,12,2],[1284,66,12,2],[1296,67,12,2],[1320,65,12,2],[1344,55,6,2],[1350,55,6,2],[1356,60,12,2],[1368,59,12,2],[1380,58,12,2],[1392,57,12,2],[1416,53,24,0],[1440,55,6,2],[1446,55,6,2],[1452,60,12,2],[1464,59,12,2],[1476,58,12,2],[1488,57,12,2],[1512,54,24,0],[1536,55,6,2],[1542,55,6,2],[1548,55,12,2],[1560,55,12,2],[1572,55,12,2],[1584,53,12,2],[1596,53,12,2],[1608,53,12,2],[1620,53,12,2],[1632,53,12,2],[1656,53,12,2],[1680,52,12,2],[1704,48,12,3],[1728,60,12,3],[1740,55,12,3],[1752,60,12,3],[1764,62,12,3],[1776,60,12,3],[1788,55,12,3],[1800,67,12,3],[1812,55,12,3],[1824,60,12,3],[1836,55,12,3],[1848,60,12,3],[1860,62,12,3],[1872,60,12,3],[1884,55,12,3],[1896,67,12,3],[1908,55,12,3],[1920,60,12,3],[1932,55,12,3],[1944,60,12,3],[1956,62,12,3],[1968,60,12,3],[1980,55,12,3],[1992,67,12,3],[2004,55,12,3],[2016,65,12,3],[2028,53,12,3],[2040,60,12,3],[2052,62,12,3],[2064,60,12,3],[2076,53,12,3],[2088,59,12,3],[2100,53,12,3],[2112,60,12,3],[2124,55,12,3],[2136,60,12,3],[2148,62,12,3],[2160,60,12,3],[2172,55,12,3],[2184,67,12,3],[2196,55,12,3],[2208,60,12,3],[2220,55,12,3],[2232,60,12,3],[2244,62,12,3],[2256,60,12,3],[2268,55,12,3],[2280,67,12,3],[2292,55,12,3],[2304,60,12,3],[2316,55,12,3],[2328,60,12,3],[2340,62,12,3],[2352,60,12,3],[2364,55,12,3],[2376,67,12,3],[2388,55,12,3],[2400,65,12,3],[2412,53,12,3],[2424,60,12,3],[2436,62,12,3],[2448,60,12,3],[2460,53,12,3],[2472,59,12,3],[2484,53,12,3],[2496,55,6,2],[2502,55,6,2],[2508,60,12,2],[2520,59,12,2],[2532,58,12,2],[2544,57,12,2],[2568,53,24,0],[2592,55,6,2],[2598,55,6,2],[2604,60,12,2],[2616,59,12,2],[2628,58,12,2],[2640,57,12,2],[2664,54,24,0],[2688,55,6,2],[2694,55,6,2],[2700,55,12,2],[2712,55,12,2],[2724,55,12,2],[2736,53,12,2],[2748,53,12,2],[2760,53,12,2],[2772,53,12,2],[2784,53,12,2],[2808,53,12,2],[2832,52,12,2],[2856,48,12,3],[2880,36,12,3],[2892,36,12,3],[2904,39,12,3],[2916,40,12,3],[2928,41,12,3],[2940,41,12,3],[2952,42,12,3],[2964,43,12,3],[2976,36,12,3],[2988,36,12,3],[3000,39,12,3],[3012,40,12,3],[3024,41,12,3],[3036,41,12,3],[3048,42,12,3],[3060,43,12,3],[3072,36,12,3],[3084,36,12,3],[3096,39,12,3],[3108,40,12,3],[3120,41,12,3],[3132,41,12,3],[3144,42,12,3],[3156,43,12,3],[3168,51,12,3],[3180,38,12,3],[3192,49,12,3],[3204,48,12,3],[3216,47,12,3],[3228,46,12,3],[3240,45,12,3],[3252,44,12,3],[3264,36,12,3],[3276,36,12,3],[3288,39,12,3],[3300,40,12,3],[3312,41,12,3],[3324,41,12,3],[3336,42,12,3],[3348,43,12,3],[3360,36,12,3],[3372,36,12,3],[3384,39,12,3],[3396,40,12,3],[3408,41,12,3],[3420,41,12,3],[3432,42,12,3],[3444,43,12,3],[3456,36,12,3],[3468,36,12,3],[3480,39,12,3],[3492,40,12,3],[3504,41,12,3],[3516,41,12,3],[3528,42,12,3],[3540,43,12,3],[3552,51,12,3],[3564,38,12,3],[3576,49,12,3],[3588,48,12,3],[3600,47,12,3],[3612,46,12,3],[3624,45,12,3],[3636,44,12,3],[3648,43,12,3],[3660,42,12,3],[3744,43,12,3],[3756,42,12,3],[3840,43,12,3],[3852,42,12,3],[3936,44,12,3]],[[0,43,12,3],[12,43,12,3],[24,46,12,3],[36,47,12,3],[48,48,12,3],[60,47,12,3],[72,46,12,3],[84,45,12,3],[96,43,12,3],[108,43,12,3],[120,46,12,3],[132,47,12,3],[144,48,12,3],[156,47,12,3],[168,46,12,3],[180,45,12,3],[192,82,12,2],[204,83,12,2],[216,82,12,2],[228,83,12,2],[240,81,12,2],[252,79,12,2],[264,79,12,2],[276,81,12,2],[288,82,12,2],[300,83,12,2],[312,81,12,2],[324,79,12,2],[336,79,12,2],[363,43,3,2],[366,42,3,2],[369,41,3,2],[372,40,3,2],[375,39,3,2],[384,82,12,2],[396,83,12,2],[408,82,12,2],[420,83,12,2],[432,81,12,2],[444,79,12,2],[456,79,12,2],[468,81,12,2],[480,47,6,3],[486,47,6,3],[492,47,12,3],[504,48,6,3],[510,48,6,3],[516,48,12,3],[528,49,6,3],[534,49,6,3],[540,49,12,3],[552,50,6,3],[558,50,6,3],[564,50,12,3],[576,82,12,2],[588,83,12,2],[600,82,12,2],[612,83,12,2],[624,81,12,2],[636,79,12,2],[648,79,12,2],[660,81,12,2],[672,82,12,2],[684,83,12,2],[696,81,12,2],[708,79,12,2],[720,79,12,2],[768,82,12,2],[780,83,12,2],[792,82,12,2],[804,83,12,2],[816,81,12,2],[828,79,12,2],[840,79,12,2],[852,81,12,2],[864,98,6,2],[870,92,6,2],[876,88,6,2],[882,87,6,2],[894,92,6,2],[900,86,6,2],[912,75,6,2],[918,73,6,2],[930,69,6,2],[960,75,12,2],[972,76,12,2],[984,75,12,2],[996,76,12,2],[1008,74,12,2],[1020,72,12,2],[1032,72,12,2],[1044,69,12,2],[1056,75,12,2],[1068,76,12,2],[1080,74,12,2],[1092,72,12,2],[1104,72,12,2],[1152,75,12,2],[1164,76,12,2],[1176,75,12,2],[1188,76,12,2],[1200,74,12,2],[1212,72,12,2],[1224,72,12,2],[1236,69,12,2],[1248,66,12,2],[1260,69,12,2],[1272,71,12,2],[1284,74,12,2],[1296,72,12,2],[1320,71,12,2],[1344,75,12,2],[1356,76,12,2],[1368,74,12,2],[1380,72,12,2],[1392,72,12,2],[1416,41,24,0],[1440,75,12,2],[1452,76,12,2],[1464,74,12,2],[1476,72,12,2],[1488,72,12,2],[1512,42,24,0],[1536,75,12,2],[1548,76,12,2],[1560,75,12,2],[1572,76,12,2],[1584,74,12,2],[1596,72,12,2],[1608,72,12,2],[1620,69,12,2],[1632,72,12,2],[1656,74,12,2],[1680,72,12,2],[1704,36,12,3],[1728,52,48,0],[1776,50,24,0],[1800,55,24,0],[1824,48,96,0],[1920,57,48,0],[1968,55,24,0],[1992,60,24,0],[2016,53,96,0],[2112,52,48,0],[2160,50,24,0],[2184,55,24,0],[2208,48,96,0],[2304,57,48,0],[2352,55,24,0],[2376,59,24,0],[2400,60,96,0],[2496,75,12,2],[2508,76,12,2],[2520,74,12,2],[2532,72,12,2],[2544,72,12,2],[2568,41,24,0],[2592,75,12,2],[2604,76,12,2],[2616,74,12,2],[2628,72,12,2],[2640,72,12,2],[2664,42,24,0],[2688,75,12,2],[2700,76,12,2],[2712,75,12,2],[2724,76,12,2],[2736,74,12,2],[2748,72,12,2],[2760,72,12,2],[2772,69,12,2],[2784,72,12,2],[2808,74,12,2],[2832,72,12,2],[2856,36,12,3],[2880,36,12,3],[2892,36,12,3],[2904,39,12,3],[2916,40,12,3],[2928,41,12,3],[2940,41,12,3],[2952,42,12,3],[2964,43,12,3],[2976,36,12,3],[2988,36,12,3],[3000,39,12,3],[3012,40,12,3],[3024,41,12,3],[3036,41,12,3],[3048,42,12,3],[3060,43,12,3],[3072,36,12,3],[3084,36,12,3],[3096,39,12,3],[3108,40,12,3],[3120,41,12,3],[3132,41,12,3],[3144,42,12,3],[3156,43,12,3],[3168,51,12,3],[3180,50,12,3],[3192,49,12,3],[3204,48,12,3],[3216,47,12,3],[3228,46,12,3],[3240,45,12,3],[3252,44,12,3],[3264,36,12,3],[3276,36,12,3],[3288,39,12,3],[3300,40,12,3],[3312,41,12,3],[3324,41,12,3],[3336,42,12,3],[3348,43,12,3],[3360,36,12,3],[3372,36,12,3],[3384,39,12,3],[3396,40,12,3],[3408,41,12,3],[3420,41,12,3],[3432,42,12,3],[3444,43,12,3],[3456,36,12,3],[3468,36,12,3],[3480,39,12,3],[3492,40,12,3],[3504,41,12,3],[3516,41,12,3],[3528,42,12,3],[3540,43,12,3],[3552,51,12,3],[3564,50,12,3],[3576,49,12,3],[3588,48,12,3],[3600,47,12,3],[3612,46,12,3],[3624,45,12,3],[3636,44,12,3],[3648,43,12,3],[3660,42,12,3],[3744,43,12,3],[3756,42,12,3],[3840,43,12,3],[3852,42,12,3],[3936,44,12,3]],[[0,43,12,0],[12,43,12,0],[24,46,12,0],[36,47,12,0],[48,48,12,0],[60,47,12,0],[72,46,12,0],[84,45,12,0],[96,43,12,0],[108,43,12,0],[120,46,12,0],[132,47,12,0],[144,48,12,0],[156,47,12,0],[168,46,12,0],[180,45,12,0],[192,67,12,0],[204,67,12,0],[216,70,12,0],[228,71,12,0],[240,60,12,0],[252,60,12,0],[264,63,12,0],[276,64,12,0],[288,67,12,0],[300,67,12,0],[312,70,12,0],[324,71,12,0],[336,60,12,0],[384,67,12,0],[396,67,12,0],[408,70,12,0],[420,71,12,0],[432,60,12,0],[444,60,12,0],[456,63,12,0],[468,64,12,0],[480,43,6,0],[486,43,6,0],[492,43,12,0],[504,45,6,0],[510,45,6,0],[516,45,12,0],[528,46,6,0],[534,46,6,0],[540,46,12,0],[552,47,6,0],[558,47,6,0],[564,47,12,0],[576,67,12,0],[588,67,12,0],[600,70,12,0],[612,71,12,0],[624,60,12,0],[636,60,12,0],[648,63,12,0],[660,64,12,0],[672,67,12,0],[684,67,12,0],[696,70,12,0],[708,71,12,0],[720,60,12,0],[768,67,12,0],[780,67,12,0],[792,70,12,0],[804,71,12,0],[816,60,12,0],[828,60,12,0],[840,63,12,0],[852,64,12,0],[960,48,12,0],[972,48,12,0],[984,51,12,0],[996,52,12,0],[1008,41,6,0],[1014,41,6,0],[1020,41,12,0],[1032,44,12,0],[1044,45,12,0],[1056,48,12,0],[1068,48,12,0],[1080,51,12,0],[1092,52,12,0],[1104,41,6,0],[1110,41,6,0],[1116,44,12,0],[1128,45,12,0],[1140,49,12,0],[1152,48,12,0],[1164,48,12,0],[1176,51,12,0],[1188,52,12,0],[1200,41,6,0],[1206,41,6,0],[1212,41,12,0],[1224,44,12,0],[1236,45,12,0],[1248,50,12,0],[1260,50,12,0],[1272,54,12,0],[1284,57,12,0],[1296,55,6,0],[1302,55,6,0],[1308,55,12,0],[1320,55,12,0],[1332,55,12,0],[1344,48,6,0],[1350,48,6,0],[1356,48,12,0],[1368,51,12,0],[1380,52,12,0],[1392,53,12,0],[1416,41,24,0],[1440,48,6,0],[1446,48,6,0],[1452,48,12,0],[1464,51,12,0],[1476,52,12,0],[1488,53,12,0],[1512,42,24,0],[1536,52,6,0],[1542,52,6,0],[1548,52,12,0],[1560,52,12,0],[1572,52,12,0],[1584,50,12,0],[1596,50,12,0],[1608,50,12,0],[1620,50,12,0],[1632,55,6,0],[1638,55,6,0],[1644,55,6,0],[1656,55,6,0],[1662,55,6,0],[1668,55,6,0],[1680,48,12,0],[1704,48,24,0],[1728,48,12,0],[1740,48,12,0],[1752,55,12,0],[1764,48,6,0],[1770,48,6,0],[1776,47,12,0],[1788,47,12,0],[1800,55,12,0],[1812,47,6,0],[1818,47,6,0],[1824,45,12,0],[1836,45,12,0],[1848,55,12,0],[1860,45,6,0],[1866,45,6,0],[1872,43,12,0],[1884,43,12,0],[1896,55,12,0],[1908,43,6,0],[1914,43,6,0],[1920,41,12,0],[1932,41,12,0],[1944,53,12,0],[1956,41,6,0],[1962,41,6,0],[1968,40,12,0],[1980,40,12,0],[1992,53,12,0],[2004,40,6,0],[2010,40,6,0],[2016,50,12,0],[2028,50,12,0],[2040,50,12,0],[2052,50,6,0],[2058,50,6,0],[2064,43,12,0],[2076,43,12,0],[2088,43,12,0],[2100,43,6,0],[2106,43,6,0],[2112,48,12,0],[2124,48,12,0],[2136,55,12,0],[2148,48,6,0],[2154,48,6,0],[2160,47,12,0],[2172,47,12,0],[2184,55,12,0],[2196,47,6,0],[2202,47,6,0],[2208,45,12,0],[2220,45,12,0],[2232,55,12,0],[2244,45,6,0],[2250,45,6,0],[2256,43,12,0],[2268,43,12,0],[2280,55,12,0],[2292,43,6,0],[2298,43,6,0],[2304,41,12,0],[2316,41,12,0],[2328,53,12,0],[2340,41,6,0],[2346,41,6,0],[2352,40,12,0],[2364,40,12,0],[2376,53,12,0],[2388,40,6,0],[2394,40,6,0],[2400,50,12,0],[2412,50,12,0],[2424,50,12,0],[2436,50,6,0],[2442,50,6,0],[2448,43,12,0],[2460,43,12,0],[2472,43,12,0],[2484,43,6,0],[2490,43,6,0],[2496,48,6,0],[2502,48,6,0],[2508,48,12,0],[2520,51,12,0],[2532,52,12,0],[2544,53,12,0],[2568,41,24,0],[2592,48,6,0],[2598,48,6,0],[2604,48,12,0],[2616,51,12,0],[2628,52,12,0],[2640,53,12,0],[2664,42,24,0],[2688,52,6,0],[2694,52,6,0],[2700,52,12,0],[2712,52,12,0],[2724,52,12,0],[2736,50,12,0],[2748,50,12,0],[2760,50,12,0],[2772,50,12,0],[2784,55,6,0],[2790,55,6,0],[2796,55,6,0],[2808,55,6,0],[2814,55,6,0],[2820,55,6,0],[2832,48,12,0],[2856,48,24,0],[2880,36,12,0],[2892,36,12,0],[2904,39,12,0],[2916,40,12,0],[2928,41,12,0],[2940,41,12,0],[2952,42,12,0],[2964,43,12,0],[2976,36,12,0],[2988,36,12,0],[3000,39,12,0],[3012,40,12,0],[3024,41,12,0],[3036,41,12,0],[3048,42,12,0],[3060,43,12,0],[3072,36,12,0],[3084,36,12,0],[3096,39,12,0],[3108,40,12,0],[3120,41,12,0],[3132,41,12,0],[3144,42,12,0],[3156,43,12,0],[3168,51,12,0],[3180,50,12,0],[3192,49,12,0],[3204,48,12,0],[3216,47,12,0],[3228,46,12,0],[3240,45,12,0],[3252,44,12,0],[3264,36,12,0],[3276,36,12,0],[3288,39,12,0],[3300,40,12,0],[3312,41,12,0],[3324,41,12,0],[3336,42,12,0],[3348,43,12,0],[3360,36,12,0],[3372,36,12,0],[3384,39,12,0],[3396,40,12,0],[3408,41,12,0],[3420,41,12,0],[3432,42,12,0],[3444,43,12,0],[3456,36,12,0],[3468,36,12,0],[3480,39,12,0],[3492,40,12,0],[3504,41,12,0],[3516,41,12,0],[3528,42,12,0],[3540,43,12,0],[3552,51,12,0],[3564,50,12,0],[3576,49,12,0],[3588,48,12,0],[3600,47,12,0],[3612,46,12,0],[3624,45,12,0],[3636,44,12,0],[3648,43,12,0],[3660,42,12,0],[3744,43,12,0],[3756,42,12,0],[3840,43,12,0],[3852,42,12,0],[3936,44,12,0]],[[0,96,12],[12,96,12],[96,96,12],[108,96,12],[192,7,6],[198,4,6],[204,7,6],[216,7,6],[222,4,6],[228,7,6],[240,7,6],[246,4,6],[252,7,6],[264,7,6],[270,4,6],[276,7,6],[288,7,6],[294,4,6],[300,7,6],[312,7,6],[318,4,6],[324,7,6],[360,32,24],[384,7,6],[390,4,6],[396,7,6],[408,7,6],[414,4,6],[420,7,6],[432,7,6],[438,4,6],[444,7,6],[456,7,6],[462,4,6],[468,7,6],[480,32,24],[504,96,24],[528,32,24],[552,96,24],[576,7,6],[582,4,6],[588,7,6],[600,7,6],[606,4,6],[612,7,6],[624,7,6],[630,4,6],[636,7,6],[648,7,6],[654,4,6],[660,7,6],[672,7,6],[678,4,6],[684,7,6],[696,7,6],[702,4,6],[708,7,6],[720,96,24],[768,7,6],[774,4,6],[780,7,6],[792,7,6],[798,4,6],[804,7,6],[816,7,6],[822,4,6],[828,7,6],[840,7,6],[846,4,6],[852,7,6],[864,96,72],[936,32,24],[960,96,6],[966,4,6],[972,7,6],[984,32,6],[990,4,6],[996,96,6],[1008,96,6],[1014,4,6],[1020,7,6],[1032,32,6],[1038,4,6],[1044,96,6],[1056,96,6],[1062,4,6],[1068,7,6],[1080,32,6],[1086,4,6],[1092,96,6],[1104,96,6],[1110,4,6],[1116,7,6],[1128,32,6],[1134,4,6],[1140,96,6],[1152,96,6],[1158,4,6],[1164,7,6],[1176,32,6],[1182,4,6],[1188,96,6],[1200,96,6],[1206,4,6],[1212,7,6],[1224,32,6],[1230,4,6],[1236,96,6],[1248,96,6],[1254,4,6],[1260,7,6],[1272,32,6],[1278,4,6],[1284,96,6],[1296,96,6],[1302,4,6],[1308,7,6],[1320,32,6],[1326,4,6],[1332,96,6],[1344,96,6],[1350,4,6],[1356,7,6],[1368,32,6],[1374,4,6],[1380,96,6],[1392,32,6],[1416,96,6],[1440,96,6],[1446,4,6],[1452,7,6],[1464,32,6],[1470,4,6],[1476,96,6],[1488,32,6],[1512,96,6],[1536,96,6],[1542,4,6],[1548,7,6],[1560,32,6],[1566,4,6],[1572,96,6],[1584,96,6],[1590,4,6],[1596,7,6],[1608,32,6],[1614,4,6],[1620,96,6],[1632,96,24],[1656,32,24],[1680,96,12],[1692,96,6],[1698,96,6],[1704,32,24],[1728,4,6],[1734,4,6],[1740,7,6],[1752,10,6],[1758,4,6],[1764,4,6],[1770,4,6],[1776,4,6],[1782,4,6],[1788,7,6],[1800,10,6],[1806,4,6],[1812,4,6],[1818,4,6],[1824,4,6],[1830,4,6],[1836,7,6],[1848,10,6],[1854,4,6],[1860,4,6],[1866,4,6],[1872,4,6],[1878,4,6],[1884,7,6],[1896,10,6],[1902,4,6],[1908,4,6],[1914,4,6],[1920,4,6],[1926,4,6],[1932,7,6],[1944,10,6],[1950,4,6],[1956,4,6],[1962,4,6],[1968,4,6],[1974,4,6],[1980,7,6],[1992,10,6],[1998,4,6],[2004,4,6],[2010,4,6],[2016,4,6],[2022,4,6],[2028,7,6],[2040,10,6],[2046,4,6],[2052,4,6],[2058,4,6],[2064,4,6],[2070,4,6],[2076,7,6],[2088,10,6],[2094,4,6],[2100,4,6],[2106,4,6],[2112,4,6],[2118,4,6],[2124,7,6],[2136,10,6],[2142,4,6],[2148,4,6],[2154,4,6],[2160,4,6],[2166,4,6],[2172,7,6],[2184,10,6],[2190,4,6],[2196,4,6],[2202,4,6],[2208,4,6],[2214,4,6],[2220,7,6],[2232,10,6],[2238,4,6],[2244,4,6],[2250,4,6],[2256,4,6],[2262,4,6],[2268,7,6],[2280,10,6],[2286,4,6],[2292,4,6],[2298,4,6],[2304,4,6],[2310,4,6],[2316,7,6],[2328,10,6],[2334,4,6],[2340,4,6],[2346,4,6],[2352,4,6],[2358,4,6],[2364,7,6],[2376,10,6],[2382,4,6],[2388,4,6],[2394,4,6],[2400,4,6],[2406,4,6],[2412,7,6],[2424,10,6],[2430,4,6],[2436,4,6],[2442,4,6],[2448,4,6],[2454,4,6],[2460,7,6],[2472,10,6],[2478,4,6],[2484,4,6],[2490,4,6],[2496,96,6],[2502,4,6],[2508,7,6],[2520,32,6],[2526,4,6],[2532,96,6],[2544,32,6],[2568,96,6],[2592,96,6],[2598,4,6],[2604,7,6],[2616,32,6],[2622,4,6],[2628,96,6],[2640,32,6],[2664,96,6],[2688,96,6],[2694,4,6],[2700,7,6],[2712,32,6],[2718,4,6],[2724,96,6],[2736,96,6],[2742,4,6],[2748,7,6],[2760,32,6],[2766,4,6],[2772,96,6],[2784,96,24],[2808,32,24],[2832,96,12],[2844,96,6],[2850,96,6],[2856,32,24],[2880,96,12],[2892,96,12],[2904,4,12],[2928,4,12],[2952,4,12],[2976,96,12],[2988,4,12],[3000,32,12],[3012,32,12],[3048,4,12],[3060,10,12],[3072,96,12],[3084,96,12],[3096,4,12],[3120,4,12],[3144,4,12],[3168,96,12],[3180,4,12],[3192,32,12],[3204,32,12],[3240,4,12],[3252,10,12],[3264,96,12],[3276,4,12],[3288,32,12],[3300,32,12],[3312,96,12],[3324,96,12],[3336,32,12],[3348,10,12],[3360,96,12],[3372,4,12],[3384,32,12],[3396,32,12],[3408,96,12],[3432,129,12],[3444,10,12],[3456,96,12],[3468,4,12],[3480,32,12],[3492,32,12],[3504,96,12],[3516,96,12],[3528,32,12],[3540,10,12],[3552,96,12],[3564,4,12],[3576,32,12],[3588,32,12],[3600,96,12],[3624,129,12],[3636,10,12],[3648,96,12],[3660,96,12],[3744,96,12],[3756,96,12],[3840,96,12],[3852,96,12],[3936,96,24],[4008,96,24]]];
  var feverAtFrame = Object.create(null);
  feverChannels.forEach(function (events, channel) {
    events.forEach(function (event) {
      (feverAtFrame[event[0]] || (feverAtFrame[event[0]] = [])).push([channel].concat(event.slice(1)));
    });
  });
  var pulseWaves = Object.create(null);
  function chipPulse(source, duty) {
    if (!context.createPeriodicWave || !source.setPeriodicWave) return;
    var ratio = [0.125, 0.25, 0.5, 0.75][duty == null ? 2 : duty];
    if (!pulseWaves[ratio]) {
      var real = new Float32Array(33), imaginary = new Float32Array(33);
      for (var harmonic = 1; harmonic < 33; harmonic++) {
        real[harmonic] = 2 * Math.sin(2 * Math.PI * harmonic * ratio) / (Math.PI * harmonic);
        imaginary[harmonic] = 2 * (1 - Math.cos(2 * Math.PI * harmonic * ratio)) / (Math.PI * harmonic);
      }
      pulseWaves[ratio] = context.createPeriodicWave(real, imaginary);
    }
    source.setPeriodicWave(pulseWaves[ratio]);
  }
  function playFeverFrame(frame, time) {
    (feverAtFrame[frame] || []).forEach(function (event) {
      var channel = event[0], pitch = event[1], frames = event[2];
      if (channel < 3) {
        voice('music', time, Math.max(.025, frames / 60 * .87), channel === 2 ? .17 : channel === 1 ? .12 : .16,
          {note:pitch, wave:channel === 2 ? 'triangle' : 'square', duty:event[3]});
      } else {
        // The rhythm is sourced; drum samples are synthesized, not extracted DPCM.
        var type = pitch >= 0x80 ? 'hat' : pitch === 0x60 || pitch === 7 ? 'kick' : pitch === 0x20 || pitch === 4 ? 'snare' : 'hat';
        percussion(time, type, type === 'kick' ? .19 : type === 'snare' ? .065 : .035);
      }
    });
  }

  function safe(call) { try { return call(); } catch (_) { return undefined; } }
  function running() { return context && context.state === 'running'; }
  function audible() { return !disposed && enabled && !hidden && !pageHidden && running(); }
  function musicWanted() { return audible() && playing && track !== 'off'; }
  function frequency(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
  function disconnect(node) { if (node) safe(function () { node.disconnect(); }); }
  function forget(voice) {
    if (!voices.delete(voice)) return;
    voice.source.onended = null;
    disconnect(voice.source); disconnect(voice.gain); disconnect(voice.filter);
  }
  function stopVoice(voice) {
    safe(function () { voice.gain.gain.cancelScheduledValues(0); voice.gain.gain.value = 0; });
    safe(function () { voice.source.stop(); });
    forget(voice);
  }
  function stopVoices(kind) {
    Array.from(voices).forEach(function (voice) { if (!kind || kind === voice.kind) stopVoice(voice); });
  }
  function stopScheduler() {
    if (timer !== null) { clearTimer(timer); timer = null; }
  }
  function stopCustom(reset) {
    customPlayToken += 1; customPlayPending = false;
    if (!customAudio) return;
    safe(function () { customAudio.pause(); });
    if (reset) safe(function () { customAudio.currentTime = 0; });
  }
  function stopAll() { stopScheduler(); stopVoices(); stopCustom(false); lastEffect = Object.create(null); }
  function customWanted() { return musicWanted() && track === 'custom' && !!customAudio; }
  function playCustom() {
    if (!customWanted() || customPlayPending || !customAudio.paused) return;
    var media = customAudio, token = ++customPlayToken;
    customPlayPending = true;
    try {
      var result = media.play();
      Promise.resolve(result).then(function () {
        if (token === customPlayToken) { customPlayPending = false; customBlocked = false; customError = ''; }
        if (media !== customAudio || !customWanted()) safe(function () { media.pause(); });
      }, function (error) {
        if (token !== customPlayToken) return;
        customPlayPending = false;
        if (customWanted()) {
          customBlocked = true;
          customError = error && error.name === 'NotAllowedError' ? 'gesture-required' : 'playback-failed';
        }
      });
    } catch (_) { customPlayPending = false; customBlocked = true; customError = 'playback-failed'; }
  }

  // All sources have a short attack/release, a scheduled stop, and an onended
  // cleanup. A hard voice cap also bounds memory during repeated input bursts.
  function voice(kind, time, duration, amplitude, options) {
    if (!audible() || voices.size >= MAX_VOICES) return;
    var source = null, gain = null, filter = null, item = null;
    try {
      var start = Math.max(context.currentTime, time), end = start + Math.max(0.025, duration);
      gain = context.createGain();
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(amplitude, start + 0.004);
      gain.gain.setValueAtTime(amplitude * 0.68, Math.max(start + 0.005, end - 0.028));
      gain.gain.linearRampToValueAtTime(0, end);
      gain.connect(master);
      if (options.noise) {
        source = context.createBufferSource(); source.buffer = noiseBuffer;
        filter = context.createBiquadFilter(); filter.type = options.filter || 'highpass';
        filter.frequency.setValueAtTime(options.cutoff || 5500, start);
        source.connect(filter); filter.connect(gain);
      } else {
        source = context.createOscillator(); source.type = options.wave || 'square';
        if (options.duty != null) chipPulse(source, options.duty);
        source.frequency.setValueAtTime(options.hz || frequency(options.note), start);
        if (options.endHz) source.frequency.exponentialRampToValueAtTime(options.endHz, end);
        if (options.pitchSteps) options.pitchSteps.forEach(function (hz, i) { source.frequency.setValueAtTime(hz, start + i / 30); });
        source.connect(gain);
      }
      item = { source: source, gain: gain, filter: filter, kind: kind };
      voices.add(item); source.onended = function () { forget(item); };
      source.start(start); source.stop(end + 0.005);
    } catch (_) {
      if (item) stopVoice(item);
      else { if (source) safe(function () { source.stop(); }); disconnect(source); disconnect(gain); disconnect(filter); }
    }
  }
  function note(kind, time, midi, duration, amplitude, wave) {
    voice(kind, time, duration, amplitude, { note: midi, wave: wave || 'square' });
  }
  function percussion(time, type, level) {
    if (type === 'kick') voice('music', time, 0.085, level, { wave: 'triangle', hz: 150, endHz: 45 });
    else voice('music', time, type === 'snare' ? 0.075 : 0.026, level,
      { noise: true, cutoff: type === 'snare' ? 1500 : 6000 });
  }
  function playStep(index, time) {
    if (track === 'fever') { playFeverFrame(index, time); return; }
    var score = scores[track]; if (!score) return;
    var bar = Math.floor(index / 16), beat = index % 16, unit = 60 / score.bpm / 4;
    var root = score.roots[bar], third = score.thirds[bar], lively = track === 'pulse';
    score.lead[bar].forEach(function (event) {
      if (event[0] === beat) note('music', time, event[1], event[2] * unit, lively ? 0.20 : 0.12);
    });
    var bassBeats = lively ? [0, 3, 6, 8, 11, 14] : [0, 7, 10];
    var bassIndex = bassBeats.indexOf(beat);
    if (bassIndex >= 0) {
      var offsets = lively ? [0, 12, 7, 0, 12, 7] : [0, 7, 12];
      note('music', time, root + offsets[bassIndex], unit * (lively ? 1.2 : 2), lively ? 0.15 : 0.115);
    }
    var arpBeats = lively ? [2, 10] : [3, 6, 11, 14], arpIndex = arpBeats.indexOf(beat);
    if (arpIndex >= 0) {
      var arp = lively ? [third, 7] : [third, 7, 12, 7];
      note('music', time, root + 24 + arp[arpIndex], unit * 1.35, lively ? 0.105 : 0.085, 'triangle');
    }
    if (beat === 0 || (lively && beat === 8)) percussion(time, 'kick', lively ? 0.25 : 0.14);
    if (beat === 4 || beat === 12) percussion(time, 'snare', lively ? 0.10 : 0.045);
    if (lively && [2, 6, 10, 14].indexOf(beat) >= 0) percussion(time, 'hat', 0.065);
    if (lively && bar % 4 === 3 && beat === 15) percussion(time, 'snare', 0.065);
  }
  function schedule() {
    if (!musicWanted() || track === 'custom') { stopScheduler(); stopVoices('music'); return; }
    try {
      var now = context.currentTime, unit = track === 'fever' ? 1 / 60 : 60 / scores[track].bpm / 4;
      // Do not replay an accumulated backlog after browser throttling or sleep.
      if (nextStepTime < now - 0.03) nextStepTime = now + 0.01;
      var count = 0;
      while (nextStepTime < now + LOOK_AHEAD && count < (track === 'fever' ? 12 : 4)) {
        playStep(step, nextStepTime);
        step += 1;
        if (track === 'fever') { if (step >= 4032) step = 192; } else step %= 256;
        nextStepTime += unit; count += 1;
      }
    } catch (_) { stopAll(); }
  }
  function synchronize() {
    if (!musicWanted()) { stopScheduler(); stopVoices('music'); stopCustom(false); return; }
    if (track === 'custom') { stopScheduler(); stopVoices('music'); playCustom(); return; }
    if (timer !== null) return;
    nextStepTime = context.currentTime + 0.02;
    schedule();
    if (musicWanted()) timer = setTimer(schedule, TICK_MS);
  }
  function suspend() {
    if (context && context.state === 'running' && context.suspend) {
      safe(function () { var result = context.suspend(); if (result && result.catch) result.catch(function () {}); });
    }
  }
  function addListener(target, name, handler) {
    if (!target || !target.addEventListener) return;
    target.addEventListener(name, handler);
    listeners.push([target, name, handler]);
  }
  addListener(doc, 'visibilitychange', function () {
    hidden = !!doc.hidden;
    if (hidden) { stopAll(); suspend(); }
    // A suspended context resumes only at the next explicit user gesture.
    else synchronize();
  });
  addListener(env, 'pagehide', function () { pageHidden = true; stopAll(); suspend(); });
  addListener(env, 'pageshow', function () { pageHidden = false; hidden = !!(doc && doc.hidden); synchronize(); });

  function createContext() {
    var candidate = new Context();
    try {
      context = candidate;
      master = context.createGain(); master.gain.value = 0.12;
      limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -12; limiter.knee.value = 12; limiter.ratio.value = 12;
      limiter.attack.value = 0.003; limiter.release.value = 0.12;
      master.connect(limiter); limiter.connect(context.destination);
      noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.14), context.sampleRate);
      var data = noiseBuffer.getChannelData(0), seed = 0x51a7;
      for (var i = 0; i < data.length; i += 1) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        data[i] = (seed / 4294967296) * 2 - 1;
      }
      context.onstatechange = function () {
        if (disposed) return;
        if (!running()) stopAll(); else synchronize();
      };
    } catch (error) {
      disconnect(master); disconnect(limiter);
      safe(function () { var result = candidate.close(); if (result && result.catch) result.catch(function () {}); });
      context = master = limiter = noiseBuffer = null;
      throw error;
    }
  }

  // IMPORTANT: call synchronously from a click, pointer, or keyboard handler.
  // Browsers with User Activation enforce this here as well as at resume().
  // No constructor, state setter, lifecycle handler, or SFX creates/resumes audio.
  function unlock() {
    if (disposed || !enabled || hidden || pageHidden || !Context) return Promise.resolve(false);
    if (env.navigator && env.navigator.userActivation && !env.navigator.userActivation.isActive) {
      return Promise.resolve(false);
    }
    try {
      if (context && context.state === 'closed') {
        stopAll(); context.onstatechange = null; disconnect(master); disconnect(limiter);
        context = master = limiter = noiseBuffer = null;
      }
      if (!context) createContext();
      var activeContext = context;
      // Invoke resume before returning from the gesture, not in a promise callback.
      var result = context.state === 'running' ? undefined : context.resume();
      return Promise.resolve(result).then(function () {
        if (disposed || context !== activeContext) return false;
        if (!enabled || hidden || pageHidden) { stopAll(); suspend(); return false; }
        synchronize(); return !!running();
      }, function () { stopAll(); return false; });
    } catch (_) { stopAll(); return Promise.resolve(false); }
  }
  function setEnabled(value) {
    if (disposed) return;
    enabled = !!value;
    if (!enabled) stopAll(); else synchronize();
  }
  function setTrack(value) {
    if (disposed || ['fever', 'pulse', 'calm', 'off', 'custom'].indexOf(value) < 0 || track === value) return;
    if (value === 'custom' && !customAudio) return;
    stopScheduler(); stopVoices('music'); stopCustom(true); track = value; step = 0; synchronize();
  }
  function setPlaying(value) {
    if (disposed) return;
    var next = !!value;
    if (!next) stopAll();
    if (next && !playing) nextStepTime = 0;
    playing = next; synchronize();
  }
  function sfx(name, details) {
    if (!audible()) return;
    var supported = ['move', 'rotate', 'drop', 'lock', 'clear', 'chain', 'stageclear', 'gameover'];
    if (supported.indexOf(name) < 0) return;
    var now = context.currentTime, gap = name === 'move' ? 0.04 : 0.06;
    if (lastEffect[name] !== undefined && now - lastEffect[name] < gap) return;
    lastEffect[name] = now;
    var start = now + 0.005;
    if (name === 'move') note('sfx', start, 69, 0.025, 0.10, 'triangle');
    if (name === 'rotate') {
      // Flip uses timer $0A3 twice, with the second envelope much quieter.
      voice('sfx', start, 1 / 60, .15, {hz:1789773 / (16 * 164), duty:2});
      voice('sfx', start + 1 / 60, 3 / 60, .05, {hz:1789773 / (16 * 164), duty:2});
    }
    if (name === 'drop') voice('sfx', start, 0.12, 0.24, { wave: 'triangle', hz: 520, endHz: 70 });
    if (name === 'lock') {
      voice('sfx', start, 0.055, 0.10, { noise: true, cutoff: 1200 });
      note('sfx', start, 45, 0.06, 0.20, 'triangle');
    }
    if (name === 'clear' || name === 'chain') {
      // Both effects update every two NTSC frames; chains retrigger this rattle,
      // not an invented rising arpeggio. Distinguish pill-only and virus matches.
      var hasVirus = details && Number.isFinite(details.viruses) ? details.viruses > 0 : name === 'chain';
      var periods = hasVirus ? [240,96,224,112,208,128,192,144,240,96,224,112] : [352,384,352,384,352,384,352,384,352,384,352,384];
      var pitches = periods.map(function (period) { return 1789773 / (16 * (period + 1)); });
      voice('sfx', start, .4, hasVirus ? .23 : .18, {hz:pitches[0], pitchSteps:pitches, duty:2});
    }
    if (name === 'stageclear') {
      [74, 81, 78, 86, 83, 90].forEach(function (tone, index) {
        note('sfx', start + index * 0.10, tone, index === 5 ? 0.32 : 0.075, 0.19);
      });
      [50, 57, 62].forEach(function (tone, index) { note('sfx', start + index * 0.20, tone, 0.17, 0.13, 'triangle'); });
    }
    if (name === 'gameover') {
      [76, 73, 69, 62].forEach(function (tone, index) {
        note('sfx', start + index * 0.16, tone, index === 3 ? 0.34 : 0.12, 0.16);
      });
    }
  }
  function releaseCustom() {
    stopCustom(true);
    if (customAudio) {
      customAudio.onerror = null;
      safe(function () { customAudio.removeAttribute('src'); customAudio.load(); });
    }
    if (customURL && env.URL && env.URL.revokeObjectURL) {
      safe(function () { env.URL.revokeObjectURL(customURL); });
    }
    customAudio = null; customURL = null; customName = ''; customBlocked = false; customError = '';
  }
  function setCustomFile(file) {
    if (disposed || !file || !env.Audio || !env.URL || !env.URL.createObjectURL) return false;
    var url = null, media = null;
    try {
      url = env.URL.createObjectURL(file); media = new env.Audio();
      media.loop = true; media.volume = 0.12; media.preload = 'metadata'; media.src = url;
    } catch (_) {
      if (url) safe(function () { env.URL.revokeObjectURL(url); });
      return false;
    }
    stopScheduler(); stopVoices('music'); releaseCustom();
    customAudio = media; customURL = url; customName = String(file.name || 'Local audio');
    customAudio.onerror = function () {
      if (media !== customAudio) return;
      stopCustom(false); customBlocked = true; customError = 'unsupported-or-invalid-file';
    };
    track = 'custom'; step = 0; synchronize(); return true;
  }
  function clearCustomFile() {
    if (disposed) return;
    if (track === 'custom') { stopScheduler(); stopVoices('music'); track = 'off'; }
    releaseCustom(); synchronize();
  }
  function destroy() {
    if (disposed) return;
    disposed = true; stopAll(); releaseCustom();
    listeners.forEach(function (entry) { entry[0].removeEventListener(entry[1], entry[2]); }); listeners = [];
    if (context) {
      context.onstatechange = null;
      safe(function () { var result = context.close(); if (result && result.catch) result.catch(function () {}); });
    }
    disconnect(master); disconnect(limiter); context = master = limiter = noiseBuffer = null;
  }
  function getState() {
    return { supported: !!Context, enabled: enabled, track: track, playing: playing,
      unlocked: !!context, running: !!running(), hidden: hidden || pageHidden,
      activeVoices: voices.size, schedulerActive: timer !== null, disposed: disposed,
      musicBpm: track === 'fever' ? 150 : scores[track] ? scores[track].bpm : null, musicFrame: track === 'fever' ? step : null,
      customReady: !!customAudio, customName: customName, customBlocked: customBlocked, customError: customError };
  }
  return { unlock: unlock, setEnabled: setEnabled, setTrack: setTrack,
    setPlaying: setPlaying, sfx: sfx, setCustomFile: setCustomFile,
    clearCustomFile: clearCustomFile, destroy: destroy, getState: getState };
}));
