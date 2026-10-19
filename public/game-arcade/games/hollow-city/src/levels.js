/* Sixteen authored scenes. Fixed resource islands, no token grids or random replenishment. */
(function (root) {
'use strict';
  const THEMES = {
    oldtown: { ground:'#dccdb9', road:'#afb6ac', grass:'#9bb783', water:'#82b9bf', accent:'#d8754f', building:['#dc9975','#edc99a','#a2b5a2','#d6b3a0'], name:'旧城日光', en:'OLD TOWN' },
    garden: { ground:'#d7dbc6', road:'#abb9ae', grass:'#88ad7e', water:'#81bec1', accent:'#729978', building:['#d6bfa6','#acc5ab','#e4d9b3','#b3c8c4'], name:'林间花园', en:'GARDEN DISTRICT' },
    harbor: { ground:'#d0cec2', road:'#94a9aa', grass:'#9bac87', water:'#6eacb9', accent:'#df9b53', building:['#b58264','#d6b47b','#809d9b','#bab3a1'], name:'潮汐港湾', en:'TIDAL HARBOR' },
    skyline: { ground:'#d5d2d6', road:'#a5acb9', grass:'#9eaf98', water:'#84b8c7', accent:'#a187bb', building:['#bdafcc','#a5bac8','#d8c4bd','#93aaa8'], name:'云端都会', en:'SKYLINE' }
  };

const CATALOG = [
 [{kind:'bin',radius:9,w:12,d:12,height:17},{kind:'cone',radius:8,w:10,d:10,height:16},{kind:'lamp',radius:9,w:12,d:12,height:37}],
 [{kind:'bench',radius:21,w:36,d:20,height:17},{kind:'tree',radius:22,w:30,d:30,height:43}],
 [{kind:'car',radius:31,w:50,d:30,height:20},{kind:'kiosk',radius:31,w:42,d:42,height:37},{kind:'van',radius:32,w:51,d:34,height:28}],
 [{kind:'house',radius:46,w:72,d:54,height:61}],
 [{kind:'warehouse',radius:68,w:108,d:78,height:69},{kind:'tower',radius:69,w:94,d:94,height:112}],
 [{kind:'landmark',radius:96,w:144,d:120,height:148}]
];
const VALUES=[1,3,7,18,42,80];
// Every opening uses a different scene-authored silhouette. Coordinates are local
// surface positions, not random seeds; later islands echo that scene's circulation.
const OPENINGS=[
 [[-62,-15],[-39,-18],[-15,-15],[9,-17],[-51,15],[-27,18],[-3,15],[30,12]], // market stall fronts
 [[-73,-8],[-52,-8],[-31,-8],[-10,-8],[11,8],[32,8],[53,8],[74,8]], // book quay
 [[-66,4],[-51,-21],[-31,-40],[-10,-49],[12,-49],[34,-40],[54,-21],[68,4]], // theatre fan
 [[-36,-36],[-12,-36],[12,-36],[36,-36],[-36,36],[-12,36],[12,36],[36,36]], // propagation beds
 [[-63,-24],[-21,-24],[21,-24],[63,-24],[-45,24],[-3,24],[39,24],[70,24]], // offset fruit rows
 [[-60,-26],[-37,-26],[-14,-13],[9,-13],[32,0],[55,0],[55,25],[32,38]], // bent tea approach
 [[-55,-40],[-55,-17],[-55,6],[-55,29],[10,-40],[10,-17],[10,6],[10,29]], // pier fingers
 [[-52,-30],[-26,-30],[0,-30],[26,-30],[-52,30],[-26,30],[0,30],[26,30]], // cargo lanes
 [[-60,-35],[-41,-22],[-22,-9],[-3,4],[16,17],[35,30],[-20,25],[0,40]], // diagonal slipway
 [[-46,-46],[0,-46],[46,-46],[46,0],[46,46],[0,46],[-46,46],[-46,0]], // formal plaza edge
 [[-70,-20],[-47,-20],[-24,-20],[-1,-20],[22,-20],[45,-20],[0,20],[23,20]], // platform & concourse
 [[-54,-15],[-38,-38],[-12,-53],[17,-52],[42,-34],[55,-8],[50,21],[30,43]], // orbital sweep
 [[-60,-28],[-39,-12],[-18,4],[3,20],[24,36],[45,20],[66,4],[66,-20]], // fairground zigzag
 [[-43,-43],[-20,-43],[25,-43],[48,-43],[-43,32],[-20,32],[25,32],[48,32]], // quadrant seed trays
 [[-64,22],[-54,-2],[-37,-23],[-14,-36],[12,-40],[38,-33],[59,-17],[71,5]], // crescent coast
 [[-65,-30],[-35,-30],[-5,-30],[40,-5],[40,25],[40,55],[-30,30],[-60,30]] // asymmetrical sculpture court
];
const MEDIUM_FORMS=[
 [[-50,-28],[0,-28],[50,-28],[-50,28],[0,28],[50,28]],
 [[-70,-25],[-23,-25],[24,-25],[-46,25],[1,25],[48,25]],
 [[-65,20],[-42,-23],[0,-48],[42,-23],[65,20],[0,20]],
 [[-48,-48],[0,-48],[48,-48],[-48,0],[0,0],[-48,48]],
 [[-55,-35],[-5,-35],[45,-35],[-35,20],[15,20],[65,20]],
 [[-60,-30],[-12,-30],[36,-30],[36,20],[-12,20],[-60,20]],
 [[-28,-55],[-28,0],[-28,55],[28,-55],[28,0],[28,55]],
 [[-50,-50],[0,-50],[50,-50],[-50,0],[0,0],[50,0]]
];
function formation(tier,variant,sceneIndex){
 const turn=variant%3===2?-1:1;
 if(tier===0)return OPENINGS[sceneIndex].map(([x,y])=>[x*turn,y]);
 if(tier===1)return MEDIUM_FORMS[sceneIndex%8].map(([x,y])=>sceneIndex%2?[y,x*turn]:[x*turn,y]);
 if(tier===2){
  const forms=[ [[-35,-35],[35,-35],[-35,35],[35,35]], [[-58,-28],[12,-28],[-12,38],[58,38]], [[-48,0],[22,-48],[22,48],[86,0]], [[-35,-55],[-35,15],[35,-15],[35,55]] ];
  return forms[sceneIndex%4].map(([x,y])=>[x*turn,y]);
 }
 if(tier===3)return sceneIndex%2?[[0,-62],[-54,31],[54,31]]:[[-62,0],[31,-54],[31,54]];
 return variant%2?[[0,-74],[0,74]]:[[-74,0],[74,0]];
}
function make(spec,index){
 const theme={...THEMES[spec.theme]}; const objects=[];
 spec.zones.forEach(([x,y],zi)=>{
  const tier=Math.floor(zi/3),variant=index+zi;
  formation(tier,variant,index).forEach(([dx,dy],i)=>{
   const kindChoice = tier===1 && ['windmillorchard','fourseasongarden','botanicalglasshouse'].includes(spec.sceneId) ? (i===0?0:1)
    : tier===1 && ['canalbookstreet','oldtheatre','transithub'].includes(spec.sceneId) ? 0
    : tier===2 && ['festivalfair','bellmarket','lotustea'].includes(spec.sceneId) ? 1
    : (i+variant)%CATALOG[tier].length;
   const entry=CATALOG[tier][kindChoice];
   objects.push({...entry,id:`${spec.id}-zone${zi}-${i}`,x:x+dx,y:y+dy,tier,value:VALUES[tier],target:false,
    color:theme.building[(index+zi+i)%4],visualVariant:`${spec.sceneId}-${entry.kind}`,sceneId:spec.sceneId,zone:zi});
  });
 });
 (spec.streetObjects||[]).forEach((entry,i)=>objects.push({...entry,id:`${spec.id}-frontage-${i}`,target:false,
  color:theme.building[(index+i)%4],visualVariant:`${spec.sceneId}-${entry.kind}`,sceneId:spec.sceneId}));
 spec.targets.forEach(([x,y,label],i)=>{
  const entry=CATALOG[spec.targetTier][spec.targetTier===4?1:0];
  objects.push({...entry,id:`${spec.id}-goal-${i}`,x,y,tier:spec.targetTier,value:VALUES[spec.targetTier],target:true,label,
   color:theme.building[i%4],visualVariant:`${spec.sceneId}-${entry.kind}`,sceneId:spec.sceneId,signature:i===0});
 });
 const roads=spec.roads,water=spec.sceneTerrain.filter(t=>t.type==='pond').map(t=>({...t})),parks=[];
 return {id:spec.id,title:spec.title,sceneId:spec.sceneId,sceneName:spec.title,sceneMotifs:spec.sceneMotifs,
  sceneDescription:spec.brief,district:theme.name,districtId:spec.theme,subtitle:index<12?`${String(index+1).padStart(2,'0')} · ${spec.sceneMotifs.join(' / ')}`:'自由漫游 · 有限地图 · 无倒计时',
  brief:spec.brief,description:spec.brief,time:spec.time,bounds:spec.bounds,spawn:spec.spawn,theme,roads,parks,water,
  sceneTerrain:spec.sceneTerrain,objects,goals:{targets:spec.targets.length},seed:101+index,difficulty:spec.difficulty,
  routeHint:spec.brief,design:{plan:spec.zones.map((p,i)=>`${Math.floor(i/3)}@${p.join(',')}`),maxTier:spec.targetTier,
   pressure:index<12?'优先串起成长资源，再决定地标巡游顺序；无需清空全部小物。':'无倒计时，全图物件有限，全部吞下即完成。',
   detour:'三处独立的同级资源岛提供余量；可以漏过一处，再从另一条路线补齐。',
   landmarks:Object.fromEntries(spec.targets.map((p,i)=>[String.fromCharCode(65+i),p[2]])),
   milestones:['收集场景小物','穿行主题摊位与车辆','回收暂时吃不下的建筑','吞下场景地标'],
   zones:spec.zones.map(([x,y],i)=>({x,y,tier:Math.floor(i/3),formation:(index+i)%3})),
   openingRoutes:[spec.zones[0],spec.zones[1],spec.zones[2]]}};
}
const SPECS = [
  {
    "id": "old-01",
    "sceneId": "bellmarket",
    "title": "钟声早市",
    "theme": "oldtown",
    "bounds": {
      "w": 1320,
      "h": 1120
    },
    "spawn": {
      "x": 350,
      "y": 250
    },
    "zones": [
      [
        220,
        250
      ],
      [
        390,
        220
      ],
      [
        220,
        410
      ],
      [
        440,
        400
      ],
      [
        650,
        280
      ],
      [
        440,
        620
      ],
      [
        690,
        480
      ],
      [
        790,
        710
      ],
      [
        260,
        670
      ],
      [
        1000,
        320
      ],
      [
        1050,
        590
      ],
      [
        570,
        870
      ]
    ],
    "targets": [
      [
        510,
        270,
        "早市钟楼"
      ],
      [
        1110,
        875,
        "拱廊市场"
      ],
      [
        265,
        940,
        "面包会馆"
      ]
    ],
    "targetTier": 3,
    "sceneMotifs": [
      "铜铃摊车",
      "条纹遮棚",
      "环形市集"
    ],
    "brief": "沿钟楼脚下的早市出发，北排铃摊与西排果篮都能起步；绕内场吃下长椅，再沿面包摊和拱廊回收整片屋顶。",
    "sceneTerrain": [
      {
        "type": "plaza",
        "x": 430,
        "y": 90,
        "w": 530,
        "h": 570
      },
      {
        "type": "path",
        "x": 140,
        "y": 530,
        "w": 990,
        "h": 75
      },
      {
        "type": "court",
        "x": 480,
        "y": 740,
        "w": 370,
        "h": 260
      }
    ],
    "roads": [
      {
        "x": 140,
        "y": 160,
        "w": 70,
        "h": 760
      },
      {
        "x": 1120,
        "y": 190,
        "w": 70,
        "h": 760
      }
    ],
    "time": 105,
    "difficulty": 1,
    "streetObjects": [
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 130.0,
        "y": 120.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 217.8,
        "y": 118.9,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 305.6,
        "y": 117.8,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 393.3,
        "y": 116.7,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 481.1,
        "y": 115.6,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 568.9,
        "y": 114.4,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 656.7,
        "y": 113.3,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 744.4,
        "y": 112.2,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 832.2,
        "y": 111.1,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 920.0,
        "y": 110.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 1000.0,
        "y": 140.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 1080.0,
        "y": 170.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1160.0,
        "y": 200.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1168.3,
        "y": 293.3,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1176.7,
        "y": 386.7,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1185.0,
        "y": 480.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1193.3,
        "y": 573.3,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 1201.7,
        "y": 666.7,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 1210.0,
        "y": 760.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 992.5,
        "y": 955.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 920.0,
        "y": 1020.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 830.0,
        "y": 1020.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 740.0,
        "y": 1020.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 650.0,
        "y": 1020.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 560.0,
        "y": 1020.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 470.0,
        "y": 1020.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 380.0,
        "y": 1020.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 110.0,
        "y": 520.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 122.5,
        "y": 607.5,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 135.0,
        "y": 695.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 147.5,
        "y": 782.5,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 160.0,
        "y": 870.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      }
    ]
  },
  {
    "id": "old-02",
    "sceneId": "canalbookstreet",
    "title": "运河书街",
    "theme": "oldtown",
    "bounds": {
      "w": 1710,
      "h": 1180
    },
    "spawn": {
      "x": 520,
      "y": 205
    },
    "zones": [
      [
        240,
        280
      ],
      [
        420,
        270
      ],
      [
        240,
        440
      ],
      [
        480,
        440
      ],
      [
        650,
        290
      ],
      [
        450,
        650
      ],
      [
        710,
        510
      ],
      [
        720,
        780
      ],
      [
        280,
        740
      ],
      [
        1040,
        270
      ],
      [
        1210,
        500
      ],
      [
        1020,
        770
      ],
      [
        1410,
        240
      ],
      [
        1410,
        780
      ],
      [
        630,
        1030
      ]
    ],
    "targets": [
      [
        570,
        135,
        "河畔阅览塔"
      ],
      [
        1450,
        1030,
        "活字印刷馆"
      ],
      [
        1130,
        1030,
        "藏书楼"
      ]
    ],
    "targetTier": 4,
    "sceneMotifs": [
      "露天书摊",
      "活字书楼",
      "双岸运河"
    ],
    "brief": "先逛西岸两段书摊，长大后从桥头进入印刷街；北桥通向阅览塔，南桥串起仓书楼，可把另一岸留作回程。",
    "sceneTerrain": [
      {
        "type": "pond",
        "x": 840,
        "y": 0,
        "w": 115,
        "h": 1180
      },
      {
        "type": "path",
        "x": 120,
        "y": 150,
        "w": 1430,
        "h": 70
      },
      {
        "type": "path",
        "x": 120,
        "y": 895,
        "w": 1430,
        "h": 75
      },
      {
        "type": "plaza",
        "x": 1010,
        "y": 850,
        "w": 490,
        "h": 260
      }
    ],
    "roads": [
      {
        "x": 120,
        "y": 150,
        "w": 70,
        "h": 820
      },
      {
        "x": 1550,
        "y": 150,
        "w": 65,
        "h": 820
      }
    ],
    "time": 110,
    "difficulty": 1,
    "streetObjects": [
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 120.0,
        "y": 100.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 212.9,
        "y": 100.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 305.7,
        "y": 100.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 398.6,
        "y": 100.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 491.4,
        "y": 100.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 770.0,
        "y": 100.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 780.0,
        "y": 340.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 780.0,
        "y": 446.7,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 780.0,
        "y": 660.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 792.0,
        "y": 924.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 796.0,
        "y": 1012.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 800.0,
        "y": 1100.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 530.0,
        "y": 1090.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 440.0,
        "y": 1086.7,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 350.0,
        "y": 1083.3,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 260.0,
        "y": 1080.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1040.0,
        "y": 140.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 1133.3,
        "y": 140.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 1226.7,
        "y": 140.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 1320.0,
        "y": 140.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1600.0,
        "y": 140.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1600.0,
        "y": 228.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 1600.0,
        "y": 316.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 1600.0,
        "y": 404.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 1600.0,
        "y": 492.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 1600.0,
        "y": 580.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1600.0,
        "y": 668.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1600.0,
        "y": 756.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1600.0,
        "y": 844.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1600.0,
        "y": 932.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 1600.0,
        "y": 1020.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      }
    ]
  },
  {
    "id": "old-03",
    "sceneId": "oldtheatre",
    "title": "帷幕剧院",
    "theme": "oldtown",
    "bounds": {
      "w": 1510,
      "h": 1430
    },
    "spawn": {
      "x": 740,
      "y": 440
    },
    "zones": [
      [
        660,
        420
      ],
      [
        840,
        430
      ],
      [
        740,
        600
      ],
      [
        530,
        650
      ],
      [
        970,
        670
      ],
      [
        570,
        850
      ],
      [
        970,
        880
      ],
      [
        320,
        830
      ],
      [
        1180,
        890
      ],
      [
        330,
        560
      ],
      [
        1200,
        560
      ],
      [
        740,
        1090
      ],
      [
        260,
        1140
      ],
      [
        1220,
        1170
      ],
      [
        740,
        1280
      ]
    ],
    "targets": [
      [
        740,
        180,
        "大帷幕剧院"
      ],
      [
        180,
        280,
        "排练会馆"
      ],
      [
        1320,
        280,
        "演奏礼堂"
      ]
    ],
    "targetTier": 5,
    "sceneMotifs": [
      "红色帷幕",
      "票亭与海报",
      "放射前场"
    ],
    "brief": "从剧院前庭的票券与海报架开始，左右排练巷都有成长补给；中段向扇形观众广场展开，最后绕回剧院收下大帷幕。",
    "sceneTerrain": [
      {
        "type": "stage",
        "x": 570,
        "y": 80,
        "w": 340,
        "h": 250
      },
      {
        "type": "plaza",
        "x": 430,
        "y": 370,
        "w": 640,
        "h": 390,
        "points": [
          [
            610,
            350
          ],
          [
            890,
            350
          ],
          [
            1200,
            920
          ],
          [
            310,
            920
          ]
        ]
      },
      {
        "type": "path",
        "x": 220,
        "y": 1050,
        "w": 1070,
        "h": 75
      }
    ],
    "roads": [
      {
        "x": 170,
        "y": 410,
        "w": 1100,
        "h": 55
      },
      {
        "x": 170,
        "y": 930,
        "w": 1100,
        "h": 55
      }
    ],
    "time": 125,
    "difficulty": 1,
    "streetObjects": [
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 380.0,
        "y": 220.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 450.0,
        "y": 265.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 520.0,
        "y": 310.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 480.0,
        "y": 385.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 440.0,
        "y": 460.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 315.0,
        "y": 685.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 270.0,
        "y": 760.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 180.0,
        "y": 910.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 1110.0,
        "y": 220.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1055.0,
        "y": 285.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1000.0,
        "y": 350.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1047.5,
        "y": 432.5,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 1190.0,
        "y": 680.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1340.0,
        "y": 970.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 440.0,
        "y": 1360.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 532.9,
        "y": 1358.6,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 718.6,
        "y": 1355.7,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 997.1,
        "y": 1351.4,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1090.0,
        "y": 1350.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      }
    ]
  },
  {
    "id": "garden-01",
    "sceneId": "botanicalglasshouse",
    "title": "晨雾玻璃园",
    "theme": "garden",
    "bounds": {
      "w": 1460,
      "h": 1400
    },
    "spawn": {
      "x": 480,
      "y": 360
    },
    "zones": [
      [
        420,
        320
      ],
      [
        590,
        340
      ],
      [
        420,
        490
      ],
      [
        640,
        530
      ],
      [
        290,
        670
      ],
      [
        780,
        380
      ],
      [
        850,
        650
      ],
      [
        550,
        760
      ],
      [
        1040,
        450
      ],
      [
        1040,
        730
      ],
      [
        800,
        920
      ],
      [
        310,
        940
      ],
      [
        1080,
        1050
      ],
      [
        600,
        1200
      ],
      [
        230,
        1190
      ]
    ],
    "targets": [
      [
        720,
        165,
        "棕榈玻璃宫"
      ],
      [
        1230,
        200,
        "标本温室"
      ],
      [
        1250,
        1280,
        "种子典藏馆"
      ]
    ],
    "targetTier": 5,
    "sceneMotifs": [
      "肋骨玻璃穹顶",
      "苗圃托盘",
      "交叉温室步道"
    ],
    "brief": "在玻璃宫门口收起苗圃工具，沿两条育苗步道长大；中段可穿越盆栽庭院回收温室，或绕东侧进入种子馆。",
    "sceneTerrain": [
      {
        "type": "glassbed",
        "x": 180,
        "y": 150,
        "w": 350,
        "h": 140
      },
      {
        "type": "glassbed",
        "x": 800,
        "y": 180,
        "w": 430,
        "h": 170
      },
      {
        "type": "glassbed",
        "x": 300,
        "y": 700,
        "w": 340,
        "h": 160
      },
      {
        "type": "path",
        "x": 170,
        "y": 570,
        "w": 1030,
        "h": 70
      },
      {
        "type": "gardenbed",
        "x": 750,
        "y": 960,
        "w": 460,
        "h": 270
      }
    ],
    "roads": [
      {
        "x": 650,
        "y": 120,
        "w": 65,
        "h": 1100
      },
      {
        "x": 250,
        "y": 850,
        "w": 930,
        "h": 60
      }
    ],
    "time": 115,
    "difficulty": 2,
    "streetObjects": [
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 140.0,
        "y": 130.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 233.3,
        "y": 136.7,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 326.7,
        "y": 143.3,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 420.0,
        "y": 150.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 450.0,
        "y": 220.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 900.0,
        "y": 120.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 970.0,
        "y": 190.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1040.0,
        "y": 260.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1120.0,
        "y": 303.3,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 1200.0,
        "y": 346.7,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 1280.0,
        "y": 390.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1286.7,
        "y": 485.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1293.3,
        "y": 580.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1300.0,
        "y": 675.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1306.7,
        "y": 770.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1313.3,
        "y": 865.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 1320.0,
        "y": 960.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 150.0,
        "y": 810.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 220.0,
        "y": 880.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 430.0,
        "y": 1090.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 790.0,
        "y": 1230.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 880.0,
        "y": 1265.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 970.0,
        "y": 1300.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      }
    ]
  },
  {
    "id": "garden-02",
    "sceneId": "windmillorchard",
    "title": "风车果园",
    "theme": "garden",
    "bounds": {
      "w": 1670,
      "h": 1250
    },
    "spawn": {
      "x": 410,
      "y": 470
    },
    "zones": [
      [
        340,
        420
      ],
      [
        510,
        430
      ],
      [
        330,
        590
      ],
      [
        600,
        580
      ],
      [
        390,
        780
      ],
      [
        670,
        350
      ],
      [
        850,
        520
      ],
      [
        870,
        780
      ],
      [
        640,
        870
      ],
      [
        1140,
        370
      ],
      [
        1140,
        670
      ],
      [
        1070,
        960
      ],
      [
        1400,
        340
      ],
      [
        1430,
        680
      ],
      [
        1410,
        1040
      ]
    ],
    "targets": [
      [
        480,
        170,
        "磨坊风车"
      ],
      [
        180,
        1020,
        "苹果酿造坊"
      ],
      [
        860,
        1120,
        "果园粮仓"
      ]
    ],
    "targetTier": 5,
    "sceneMotifs": [
      "十字风车",
      "苹果果筐",
      "弧形果树行"
    ],
    "brief": "从风车下的果筐起步，向果园北行或向压榨巷南行都能成长；中段沿弯曲果树行吃进运果车，再把磨坊留作丰收的最后一口。",
    "sceneTerrain": [
      {
        "type": "orchard",
        "x": 730,
        "y": 120,
        "w": 740,
        "h": 1020
      },
      {
        "type": "path",
        "x": 170,
        "y": 650,
        "w": 1270,
        "h": 70
      },
      {
        "type": "court",
        "x": 240,
        "y": 100,
        "w": 420,
        "h": 220
      }
    ],
    "roads": [
      {
        "x": 600,
        "y": 100,
        "w": 60,
        "h": 1050
      },
      {
        "x": 1100,
        "y": 100,
        "w": 60,
        "h": 1050
      }
    ],
    "time": 130,
    "difficulty": 2,
    "streetObjects": [
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 130.0,
        "y": 280.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 220.0,
        "y": 290.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 310.0,
        "y": 300.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 400.0,
        "y": 310.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 655.0,
        "y": 212.5,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 740.0,
        "y": 180.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 833.3,
        "y": 190.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 926.7,
        "y": 200.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 1020.0,
        "y": 210.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1112.0,
        "y": 202.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1204.0,
        "y": 194.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1296.0,
        "y": 186.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1388.0,
        "y": 178.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1480.0,
        "y": 170.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 150.0,
        "y": 650.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 214.3,
        "y": 707.1,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 278.6,
        "y": 764.3,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 407.1,
        "y": 878.6,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 471.4,
        "y": 935.7,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 535.7,
        "y": 992.9,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 600.0,
        "y": 1050.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 694.0,
        "y": 1068.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 976.0,
        "y": 1122.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1070.0,
        "y": 1140.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1166.0,
        "y": 1134.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 1262.0,
        "y": 1128.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 930.0,
        "y": 280.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 928.8,
        "y": 372.5,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 925.0,
        "y": 650.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 920.0,
        "y": 1020.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      }
    ]
  },
  {
    "id": "garden-03",
    "sceneId": "lotustea",
    "title": "荷塘茶事",
    "theme": "garden",
    "bounds": {
      "w": 1600,
      "h": 1440
    },
    "spawn": {
      "x": 430,
      "y": 380
    },
    "zones": [
      [
        350,
        340
      ],
      [
        510,
        350
      ],
      [
        350,
        510
      ],
      [
        580,
        530
      ],
      [
        300,
        740
      ],
      [
        720,
        380
      ],
      [
        790,
        610
      ],
      [
        620,
        810
      ],
      [
        960,
        410
      ],
      [
        1080,
        640
      ],
      [
        990,
        940
      ],
      [
        380,
        1010
      ],
      [
        1290,
        880
      ],
      [
        720,
        1200
      ],
      [
        1180,
        1220
      ]
    ],
    "targets": [
      [
        670,
        160,
        "听雨茶楼"
      ],
      [
        1330,
        280,
        "水榭琴馆"
      ],
      [
        240,
        1260,
        "荷香会馆"
      ]
    ],
    "targetTier": 5,
    "sceneMotifs": [
      "重檐茶亭",
      "荷叶水塘",
      "曲折石桥"
    ],
    "brief": "茶亭前的灯笼和茶筐是第一口，西岸竹径与东岸石桥都通向新资源；桥面和水面均可安全移动，绕塘把茶屋留给升级后的自己。",
    "sceneTerrain": [
      {
        "type": "pond",
        "x": 720,
        "y": 170,
        "w": 520,
        "h": 310
      },
      {
        "type": "pond",
        "x": 440,
        "y": 850,
        "w": 420,
        "h": 310
      },
      {
        "type": "lily",
        "x": 850,
        "y": 260,
        "w": 230,
        "h": 100
      },
      {
        "type": "path",
        "x": 460,
        "y": 640,
        "w": 850,
        "h": 60
      },
      {
        "type": "plaza",
        "x": 180,
        "y": 200,
        "w": 390,
        "h": 350
      }
    ],
    "roads": [
      {
        "x": 180,
        "y": 570,
        "w": 1180,
        "h": 55
      },
      {
        "x": 1080,
        "y": 200,
        "w": 60,
        "h": 1080
      }
    ],
    "time": 115,
    "difficulty": 2,
    "streetObjects": [
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 160.0,
        "y": 140.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 253.3,
        "y": 153.3,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 346.7,
        "y": 166.7,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 440.0,
        "y": 180.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 530.0,
        "y": 170.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 890.0,
        "y": 130.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 150.0,
        "y": 560.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 230.0,
        "y": 585.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 310.0,
        "y": 610.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 390.0,
        "y": 635.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 470.0,
        "y": 660.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 655.0,
        "y": 675.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 840.0,
        "y": 690.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 907.5,
        "y": 635.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 975.0,
        "y": 580.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1042.5,
        "y": 525.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1110.0,
        "y": 470.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1460.0,
        "y": 450.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1457.1,
        "y": 534.3,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 1454.3,
        "y": 618.6,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 1451.4,
        "y": 702.9,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1448.6,
        "y": 787.1,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1445.7,
        "y": 871.4,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1442.9,
        "y": 955.7,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1440.0,
        "y": 1040.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1376.0,
        "y": 1102.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 1312.0,
        "y": 1164.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 1248.0,
        "y": 1226.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1028.0,
        "y": 1350.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 936.0,
        "y": 1350.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 844.0,
        "y": 1350.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 752.0,
        "y": 1350.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 660.0,
        "y": 1350.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      }
    ]
  },
  {
    "id": "harbor-01",
    "sceneId": "fishingharbor",
    "title": "晨汐鱼港",
    "theme": "harbor",
    "bounds": {
      "w": 1730,
      "h": 1170
    },
    "spawn": {
      "x": 350,
      "y": 440
    },
    "zones": [
      [
        270,
        390
      ],
      [
        440,
        390
      ],
      [
        270,
        560
      ],
      [
        510,
        570
      ],
      [
        310,
        780
      ],
      [
        670,
        370
      ],
      [
        790,
        580
      ],
      [
        800,
        800
      ],
      [
        1050,
        420
      ],
      [
        1070,
        650
      ],
      [
        1120,
        900
      ],
      [
        540,
        950
      ],
      [
        1390,
        400
      ],
      [
        1410,
        720
      ],
      [
        1450,
        1000
      ]
    ],
    "targets": [
      [
        510,
        180,
        "渔港拍卖馆"
      ],
      [
        1120,
        160,
        "航海信号所"
      ],
      [
        1500,
        160,
        "潮汐鱼市"
      ]
    ],
    "targetTier": 5,
    "sceneMotifs": [
      "渔船形货车",
      "鱼箱与浮标",
      "梳齿渔码头"
    ],
    "brief": "在鱼市入口收集浮标，北面的渔具行和南面的鱼箱巷都能开局；沿梳齿码头清空渔船与拍卖棚，最后把海风里的三座馆舍一口收下。",
    "sceneTerrain": [
      {
        "type": "pond",
        "x": 0,
        "y": 0,
        "w": 1730,
        "h": 290
      },
      {
        "type": "dock",
        "x": 220,
        "y": 120,
        "w": 145,
        "h": 560
      },
      {
        "type": "dock",
        "x": 810,
        "y": 120,
        "w": 145,
        "h": 520
      },
      {
        "type": "dock",
        "x": 1330,
        "y": 120,
        "w": 145,
        "h": 640
      },
      {
        "type": "path",
        "x": 170,
        "y": 760,
        "w": 1360,
        "h": 70
      }
    ],
    "roads": [
      {
        "x": 180,
        "y": 290,
        "w": 1390,
        "h": 65
      }
    ],
    "time": 110,
    "difficulty": 3,
    "streetObjects": [
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 130.0,
        "y": 300.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 218.3,
        "y": 301.7,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 306.7,
        "y": 303.3,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 483.3,
        "y": 306.7,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 571.7,
        "y": 308.3,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 835.0,
        "y": 305.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 922.5,
        "y": 302.5,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "van",
        "radius": 32,
        "w": 51,
        "d": 34,
        "height": 28,
        "x": 1010.0,
        "y": 300.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1100.0,
        "y": 301.7,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1190.0,
        "y": 303.3,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1280.0,
        "y": 305.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1460.0,
        "y": 308.3,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1550.0,
        "y": 310.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "van",
        "radius": 32,
        "w": 51,
        "d": 34,
        "height": 28,
        "x": 150.0,
        "y": 640.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 236.7,
        "y": 646.7,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 323.3,
        "y": 653.3,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 410.0,
        "y": 660.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 496.7,
        "y": 666.7,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 670.0,
        "y": 680.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "van",
        "radius": 32,
        "w": 51,
        "d": 34,
        "height": 28,
        "x": 753.3,
        "y": 693.3,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 920.0,
        "y": 720.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1170.0,
        "y": 760.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1254.0,
        "y": 792.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1506.0,
        "y": 888.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 140.0,
        "y": 1030.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 236.7,
        "y": 1043.3,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 333.3,
        "y": 1056.7,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 430.0,
        "y": 1070.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 518.6,
        "y": 1068.6,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 695.7,
        "y": 1065.7,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 784.3,
        "y": 1064.3,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 872.9,
        "y": 1062.9,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 961.4,
        "y": 1061.4,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1050.0,
        "y": 1060.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      }
    ]
  },
  {
    "id": "harbor-02",
    "sceneId": "containerterminal",
    "title": "彩箱货场",
    "theme": "harbor",
    "bounds": {
      "w": 1750,
      "h": 1350
    },
    "spawn": {
      "x": 370,
      "y": 360
    },
    "zones": [
      [
        290,
        310
      ],
      [
        470,
        320
      ],
      [
        300,
        490
      ],
      [
        520,
        510
      ],
      [
        270,
        710
      ],
      [
        690,
        350
      ],
      [
        810,
        550
      ],
      [
        710,
        790
      ],
      [
        1020,
        320
      ],
      [
        1100,
        600
      ],
      [
        990,
        850
      ],
      [
        400,
        970
      ],
      [
        1400,
        500
      ],
      [
        1360,
        820
      ],
      [
        1040,
        1160
      ]
    ],
    "targets": [
      [
        590,
        150,
        "一号龙门吊"
      ],
      [
        1460,
        180,
        "港务控制楼"
      ],
      [
        1520,
        1140,
        "集装箱转运楼"
      ]
    ],
    "targetTier": 5,
    "sceneMotifs": [
      "彩色集装箱",
      "叉车与托盘",
      "平行装卸槽"
    ],
    "brief": "从托盘和安全锥开始，在两条装卸巷之间接力长大；跨到东侧前先吞下叉车，回程时整排彩箱和龙门吊就是下一顿。",
    "sceneTerrain": [
      {
        "type": "dock",
        "x": 170,
        "y": 220,
        "w": 1430,
        "h": 850
      },
      {
        "type": "rail",
        "x": 150,
        "y": 1120,
        "w": 1450,
        "h": 95
      },
      {
        "type": "plaza",
        "x": 1080,
        "y": 80,
        "w": 450,
        "h": 250
      }
    ],
    "roads": [
      {
        "x": 150,
        "y": 400,
        "w": 1450,
        "h": 50
      },
      {
        "x": 150,
        "y": 660,
        "w": 1450,
        "h": 50
      },
      {
        "x": 150,
        "y": 920,
        "w": 1450,
        "h": 50
      }
    ],
    "time": 115,
    "difficulty": 3,
    "streetObjects": [
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 150.0,
        "y": 160.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 243.3,
        "y": 173.3,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 336.7,
        "y": 186.7,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 430.0,
        "y": 200.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 772.9,
        "y": 182.9,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 858.6,
        "y": 178.6,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 944.3,
        "y": 174.3,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 1030.0,
        "y": 170.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 150.0,
        "y": 820.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 240.0,
        "y": 851.7,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 600.0,
        "y": 978.3,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 690.0,
        "y": 1010.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 787.5,
        "y": 1017.5,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 885.0,
        "y": 1025.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1163.3,
        "y": 1028.3,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1246.7,
        "y": 1016.7,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 1330.0,
        "y": 1005.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 1413.3,
        "y": 993.3,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1496.7,
        "y": 981.7,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1580.0,
        "y": 970.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1600.0,
        "y": 430.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1607.5,
        "y": 530.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1615.0,
        "y": 630.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1622.5,
        "y": 730.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 1630.0,
        "y": 830.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 250.0,
        "y": 1200.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 340.0,
        "y": 1203.3,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 430.0,
        "y": 1206.7,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 520.0,
        "y": 1210.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 610.0,
        "y": 1213.3,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 700.0,
        "y": 1216.7,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 790.0,
        "y": 1220.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      }
    ]
  },
  {
    "id": "harbor-03",
    "sceneId": "shipyard",
    "title": "蓝图船坞",
    "theme": "harbor",
    "bounds": {
      "w": 1790,
      "h": 1480
    },
    "spawn": {
      "x": 480,
      "y": 410
    },
    "zones": [
      [
        390,
        350
      ],
      [
        560,
        350
      ],
      [
        390,
        530
      ],
      [
        610,
        570
      ],
      [
        300,
        760
      ],
      [
        820,
        400
      ],
      [
        850,
        680
      ],
      [
        540,
        820
      ],
      [
        1080,
        430
      ],
      [
        1110,
        750
      ],
      [
        890,
        960
      ],
      [
        290,
        1020
      ],
      [
        1420,
        620
      ],
      [
        1350,
        1020
      ],
      [
        650,
        1230
      ]
    ],
    "targets": [
      [
        710,
        160,
        "干船坞龙骨馆"
      ],
      [
        1530,
        230,
        "船厂总装塔"
      ],
      [
        1500,
        1310,
        "造船设计院"
      ],
      [
        240,
        1300,
        "焊接工坊"
      ]
    ],
    "targetTier": 5,
    "sceneMotifs": [
      "船体龙骨",
      "焊接工坊",
      "长槽干船坞"
    ],
    "brief": "在船厂入口收集工具和零件，沿西侧工坊或北侧船坞开局；中段跨过干船坞时注意自己的体量，四座造船地标需要一次完整巡游。",
    "sceneTerrain": [
      {
        "type": "pond",
        "x": 900,
        "y": 100,
        "w": 300,
        "h": 1120
      },
      {
        "type": "dock",
        "x": 960,
        "y": 180,
        "w": 180,
        "h": 920
      },
      {
        "type": "rail",
        "x": 160,
        "y": 1240,
        "w": 1460,
        "h": 80
      },
      {
        "type": "court",
        "x": 280,
        "y": 170,
        "w": 490,
        "h": 290
      }
    ],
    "roads": [
      {
        "x": 180,
        "y": 230,
        "w": 65,
        "h": 1040
      },
      {
        "x": 1260,
        "y": 160,
        "w": 65,
        "h": 1170
      }
    ],
    "time": 125,
    "difficulty": 3,
    "streetObjects": [
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 200.0,
        "y": 170.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 296.7,
        "y": 166.7,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 393.3,
        "y": 163.3,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "van",
        "radius": 32,
        "w": 51,
        "d": 34,
        "height": 28,
        "x": 490.0,
        "y": 160.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 150.0,
        "y": 550.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 230.0,
        "y": 580.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 310.0,
        "y": 610.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 390.0,
        "y": 640.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 470.0,
        "y": 670.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 560.0,
        "y": 700.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "van",
        "radius": 32,
        "w": 51,
        "d": 34,
        "height": 28,
        "x": 650.0,
        "y": 730.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 740.0,
        "y": 760.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1250.0,
        "y": 170.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1257.5,
        "y": 255.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1265.0,
        "y": 340.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1272.5,
        "y": 425.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1280.0,
        "y": 510.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 1280.0,
        "y": 730.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1280.0,
        "y": 840.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1257.5,
        "y": 1110.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1250.0,
        "y": 1200.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "van",
        "radius": 32,
        "w": 51,
        "d": 34,
        "height": 28,
        "x": 400.0,
        "y": 1390.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 485.0,
        "y": 1390.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 570.0,
        "y": 1390.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 655.0,
        "y": 1390.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 740.0,
        "y": 1390.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 825.0,
        "y": 1390.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 910.0,
        "y": 1390.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 995.0,
        "y": 1390.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "van",
        "radius": 32,
        "w": 51,
        "d": 34,
        "height": 28,
        "x": 1080.0,
        "y": 1390.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      }
    ]
  },
  {
    "id": "sky-01",
    "sceneId": "financeplaza",
    "title": "金线金融城",
    "theme": "skyline",
    "bounds": {
      "w": 1460,
      "h": 1450
    },
    "spawn": {
      "x": 710,
      "y": 620
    },
    "zones": [
      [
        650,
        570
      ],
      [
        830,
        590
      ],
      [
        680,
        750
      ],
      [
        470,
        690
      ],
      [
        930,
        800
      ],
      [
        510,
        940
      ],
      [
        1050,
        540
      ],
      [
        1020,
        1010
      ],
      [
        760,
        1000
      ],
      [
        280,
        430
      ],
      [
        1150,
        330
      ],
      [
        290,
        970
      ],
      [
        570,
        1210
      ],
      [
        1020,
        1270
      ],
      [
        1240,
        790
      ]
    ],
    "targets": [
      [
        700,
        300,
        "金线交易所"
      ],
      [
        230,
        160,
        "镜面金融塔"
      ],
      [
        1320,
        1320,
        "城市金库"
      ],
      [
        210,
        1240,
        "证券双子楼"
      ]
    ],
    "targetTier": 5,
    "sceneMotifs": [
      "金线玻璃塔",
      "交易屏亭",
      "菱形金融前场"
    ],
    "brief": "中央交易所周围有三条短补给线，先选一边收集街边小物；长大后沿菱形广场扫过车辆和镜面楼群，四角目标决定最后一圈的方向。",
    "sceneTerrain": [
      {
        "type": "plaza",
        "x": 380,
        "y": 300,
        "w": 680,
        "h": 640
      },
      {
        "type": "court",
        "x": 600,
        "y": 80,
        "w": 240,
        "h": 240
      },
      {
        "type": "path",
        "x": 160,
        "y": 1100,
        "w": 1160,
        "h": 70
      }
    ],
    "roads": [
      {
        "x": 140,
        "y": 550,
        "w": 1170,
        "h": 60
      },
      {
        "x": 710,
        "y": 80,
        "w": 60,
        "h": 1230
      }
    ],
    "time": 120,
    "difficulty": 4,
    "streetObjects": [
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 140.0,
        "y": 580.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 360.0,
        "y": 290.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 445.0,
        "y": 272.5,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 530.0,
        "y": 255.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 785.0,
        "y": 202.5,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 870.0,
        "y": 185.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 955.0,
        "y": 167.5,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1040.0,
        "y": 150.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1290.0,
        "y": 450.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1316.7,
        "y": 533.3,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1343.3,
        "y": 616.7,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1370.0,
        "y": 700.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 1357.5,
        "y": 792.5,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 1345.0,
        "y": 885.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1332.5,
        "y": 977.5,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1320.0,
        "y": 1070.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 160.0,
        "y": 750.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 170.0,
        "y": 840.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 180.0,
        "y": 930.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 200.0,
        "y": 1110.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 365.0,
        "y": 1172.5,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 447.5,
        "y": 1203.8,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 695.0,
        "y": 1297.5,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 777.5,
        "y": 1328.8,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 860.0,
        "y": 1360.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 590.0,
        "y": 440.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 775.0,
        "y": 420.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 867.5,
        "y": 410.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 960.0,
        "y": 400.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      }
    ]
  },
  {
    "id": "sky-02",
    "sceneId": "transithub",
    "title": "轨道交汇站",
    "theme": "skyline",
    "bounds": {
      "w": 1810,
      "h": 1240
    },
    "spawn": {
      "x": 430,
      "y": 580
    },
    "zones": [
      [
        350,
        530
      ],
      [
        530,
        540
      ],
      [
        350,
        710
      ],
      [
        590,
        740
      ],
      [
        270,
        920
      ],
      [
        760,
        570
      ],
      [
        850,
        820
      ],
      [
        760,
        1010
      ],
      [
        1050,
        560
      ],
      [
        1110,
        790
      ],
      [
        1230,
        1020
      ],
      [
        1100,
        330
      ],
      [
        1410,
        600
      ],
      [
        1530,
        920
      ],
      [
        770,
        300
      ]
    ],
    "targets": [
      [
        510,
        290,
        "中央拱顶车站"
      ],
      [
        260,
        160,
        "换乘控制塔"
      ],
      [
        1510,
        200,
        "城市巴士总站"
      ],
      [
        1650,
        1120,
        "环线调度中心"
      ]
    ],
    "targetTier": 5,
    "sceneMotifs": [
      "拱顶车站",
      "列车与站台",
      "横贯双轨"
    ],
    "brief": "从南广场的行李和站牌起步，向西侧出租车列或东侧站台街成长；轨道仅是地面图案，可以安全横穿，升级后回来收下整座换乘站。",
    "sceneTerrain": [
      {
        "type": "rail",
        "x": 0,
        "y": 380,
        "w": 1810,
        "h": 125
      },
      {
        "type": "rail",
        "x": 0,
        "y": 1100,
        "w": 1810,
        "h": 55
      },
      {
        "type": "plaza",
        "x": 220,
        "y": 520,
        "w": 720,
        "h": 400
      },
      {
        "type": "path",
        "x": 1340,
        "y": 200,
        "w": 100,
        "h": 850
      }
    ],
    "roads": [
      {
        "x": 160,
        "y": 650,
        "w": 1500,
        "h": 65
      }
    ],
    "time": 115,
    "difficulty": 4,
    "streetObjects": [
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 110.0,
        "y": 420.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 197.2,
        "y": 420.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 284.4,
        "y": 420.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "van",
        "radius": 32,
        "w": 51,
        "d": 34,
        "height": 28,
        "x": 371.7,
        "y": 420.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 458.9,
        "y": 420.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 546.1,
        "y": 420.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 633.3,
        "y": 420.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 720.6,
        "y": 420.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 807.8,
        "y": 420.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 895.0,
        "y": 420.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 982.2,
        "y": 420.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 1243.9,
        "y": 420.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1331.1,
        "y": 420.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1418.3,
        "y": 420.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1505.6,
        "y": 420.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1592.8,
        "y": 420.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 1680.0,
        "y": 420.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "van",
        "radius": 32,
        "w": 51,
        "d": 34,
        "height": 28,
        "x": 120.0,
        "y": 800.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 226.7,
        "y": 820.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 333.3,
        "y": 840.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 440.0,
        "y": 860.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 584.0,
        "y": 988.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 800.0,
        "y": 1180.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 990.0,
        "y": 150.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1086.7,
        "y": 150.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1183.3,
        "y": 150.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1280.0,
        "y": 150.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1230.0,
        "y": 650.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "van",
        "radius": 32,
        "w": 51,
        "d": 34,
        "height": 28,
        "x": 1402.0,
        "y": 686.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 1488.0,
        "y": 704.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 1574.0,
        "y": 722.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1660.0,
        "y": 740.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      }
    ]
  },
  {
    "id": "sky-03",
    "sceneId": "observatorycampus",
    "title": "星图观测园",
    "theme": "skyline",
    "bounds": {
      "w": 1590,
      "h": 1550
    },
    "spawn": {
      "x": 730,
      "y": 560
    },
    "zones": [
      [
        650,
        510
      ],
      [
        830,
        510
      ],
      [
        650,
        690
      ],
      [
        440,
        600
      ],
      [
        940,
        720
      ],
      [
        440,
        830
      ],
      [
        1020,
        460
      ],
      [
        1070,
        920
      ],
      [
        690,
        950
      ],
      [
        250,
        1060
      ],
      [
        1270,
        670
      ],
      [
        970,
        1150
      ],
      [
        480,
        1280
      ],
      [
        1280,
        1250
      ],
      [
        390,
        300
      ]
    ],
    "targets": [
      [
        740,
        220,
        "主天文台"
      ],
      [
        210,
        150,
        "太阳观测塔"
      ],
      [
        1320,
        200,
        "星图研究院"
      ],
      [
        210,
        1390,
        "陨石典藏馆"
      ],
      [
        910,
        1410,
        "轨道数据楼"
      ]
    ],
    "targetTier": 5,
    "sceneMotifs": [
      "旋转观测穹顶",
      "星图仪器",
      "同心轨道花坛"
    ],
    "brief": "在主天文台脚下收起观测器材，北环和西环都能给第一轮成长；星轨地面提示回访线路，五座观测建筑分布在校园边缘，先规划最后一圈。",
    "sceneTerrain": [
      {
        "type": "orbit",
        "x": 330,
        "y": 270,
        "w": 870,
        "h": 850
      },
      {
        "type": "orbit",
        "x": 570,
        "y": 520,
        "w": 400,
        "h": 380
      },
      {
        "type": "path",
        "x": 180,
        "y": 1190,
        "w": 1210,
        "h": 70
      }
    ],
    "roads": [
      {
        "x": 270,
        "y": 260,
        "w": 1040,
        "h": 55
      },
      {
        "x": 260,
        "y": 780,
        "w": 1070,
        "h": 55
      }
    ],
    "time": 135,
    "difficulty": 4,
    "streetObjects": [
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 230.0,
        "y": 460.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 270.0,
        "y": 363.3,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 455.0,
        "y": 150.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 560.0,
        "y": 130.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1010.0,
        "y": 170.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1081.7,
        "y": 216.7,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1153.3,
        "y": 263.3,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1225.0,
        "y": 310.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 1296.7,
        "y": 356.7,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 1368.3,
        "y": 403.3,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1440.0,
        "y": 450.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1441.7,
        "y": 545.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1443.3,
        "y": 640.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1445.0,
        "y": 735.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1446.7,
        "y": 830.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 1448.3,
        "y": 925.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 1450.0,
        "y": 1020.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 140.0,
        "y": 720.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 144.0,
        "y": 812.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 148.0,
        "y": 904.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 160.0,
        "y": 1180.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 236.7,
        "y": 1221.7,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 313.3,
        "y": 1263.3,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 620.0,
        "y": 1430.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 480.0,
        "y": 1050.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 563.8,
        "y": 1050.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 647.5,
        "y": 1050.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 815.0,
        "y": 1050.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 898.8,
        "y": 1050.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1066.2,
        "y": 1050.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1150.0,
        "y": 1050.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      }
    ]
  },
  {
    "id": "zen-old",
    "sceneId": "festivalfair",
    "title": "纸灯游园会",
    "theme": "oldtown",
    "bounds": {
      "w": 1430,
      "h": 1390
    },
    "spawn": {
      "x": 630,
      "y": 450
    },
    "zones": [
      [
        550,
        400
      ],
      [
        730,
        410
      ],
      [
        550,
        580
      ],
      [
        350,
        620
      ],
      [
        840,
        600
      ],
      [
        550,
        790
      ],
      [
        1050,
        640
      ],
      [
        870,
        830
      ],
      [
        300,
        840
      ],
      [
        290,
        1070
      ],
      [
        1090,
        920
      ],
      [
        660,
        1010
      ],
      [
        1050,
        1190
      ],
      [
        300,
        340
      ],
      [
        1210,
        370
      ]
    ],
    "targets": [
      [
        650,
        180,
        "纸灯旋转木马"
      ],
      [
        650,
        1240,
        "游园主舞台"
      ]
    ],
    "targetTier": 5,
    "sceneMotifs": [
      "纸灯棚架",
      "彩旗售票车",
      "旋转木马前场"
    ],
    "brief": "没有倒计时。在纸灯下慢慢逛两条摊街，从票券和糖果车长成能收下旋转木马的大洞；所有游园物件都是有限的，全部清空便完成这一夜。",
    "sceneTerrain": [
      {
        "type": "plaza",
        "x": 430,
        "y": 60,
        "w": 440,
        "h": 550
      },
      {
        "type": "stage",
        "x": 470,
        "y": 1120,
        "w": 380,
        "h": 200
      },
      {
        "type": "path",
        "x": 200,
        "y": 690,
        "w": 990,
        "h": 80
      },
      {
        "type": "court",
        "x": 940,
        "y": 270,
        "w": 280,
        "h": 260
      }
    ],
    "roads": [
      {
        "x": 240,
        "y": 240,
        "w": 65,
        "h": 970
      },
      {
        "x": 1090,
        "y": 240,
        "w": 65,
        "h": 970
      }
    ],
    "time": null,
    "difficulty": 5,
    "streetObjects": [
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 140.0,
        "y": 200.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 236.7,
        "y": 206.7,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 430.0,
        "y": 220.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 870.0,
        "y": 160.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 955.0,
        "y": 240.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1040.0,
        "y": 320.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1144.0,
        "y": 480.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1196.0,
        "y": 560.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 1248.0,
        "y": 640.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 1300.0,
        "y": 720.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 140.0,
        "y": 680.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 145.0,
        "y": 766.7,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 150.0,
        "y": 853.3,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 155.0,
        "y": 940.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 160.0,
        "y": 1026.7,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 165.0,
        "y": 1113.3,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 170.0,
        "y": 1200.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 263.3,
        "y": 1240.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 356.7,
        "y": 1280.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 450.0,
        "y": 1320.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 820.0,
        "y": 1200.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 1156.0,
        "y": 1280.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1240.0,
        "y": 1300.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      }
    ]
  },
  {
    "id": "zen-garden",
    "sceneId": "fourseasongarden",
    "title": "四季方庭",
    "theme": "garden",
    "bounds": {
      "w": 1510,
      "h": 1450
    },
    "spawn": {
      "x": 660,
      "y": 540
    },
    "zones": [
      [
        580,
        480
      ],
      [
        770,
        490
      ],
      [
        580,
        670
      ],
      [
        360,
        610
      ],
      [
        890,
        650
      ],
      [
        370,
        830
      ],
      [
        1090,
        620
      ],
      [
        900,
        860
      ],
      [
        590,
        900
      ],
      [
        270,
        1070
      ],
      [
        1180,
        920
      ],
      [
        950,
        1170
      ],
      [
        390,
        1280
      ],
      [
        1220,
        1190
      ],
      [
        1130,
        300
      ]
    ],
    "targets": [
      [
        650,
        240,
        "四季喷泉庭"
      ],
      [
        210,
        220,
        "春日种子馆"
      ],
      [
        740,
        1270,
        "冬园暖房"
      ]
    ],
    "targetTier": 5,
    "sceneMotifs": [
      "四季叶色",
      "花坛园艺车",
      "十字分季庭院"
    ],
    "brief": "春粉、夏绿、秋金、冬白分成四座庭院。先挑一条花径起步，长大后按喜欢的季节巡游；花房、园艺车和树木都能收起，没有必须赶上的时刻。",
    "sceneTerrain": [
      {
        "type": "gardenbed",
        "x": 110,
        "y": 100,
        "w": 610,
        "h": 580,
        "color": "#e7b8c1"
      },
      {
        "type": "gardenbed",
        "x": 790,
        "y": 100,
        "w": 600,
        "h": 580,
        "color": "#9ec09c"
      },
      {
        "type": "gardenbed",
        "x": 110,
        "y": 750,
        "w": 610,
        "h": 580,
        "color": "#d7b476"
      },
      {
        "type": "gardenbed",
        "x": 790,
        "y": 750,
        "w": 600,
        "h": 580,
        "color": "#dce2dc"
      },
      {
        "type": "path",
        "x": 710,
        "y": 70,
        "w": 70,
        "h": 1300
      },
      {
        "type": "path",
        "x": 80,
        "y": 680,
        "w": 1330,
        "h": 70
      }
    ],
    "roads": [],
    "time": null,
    "difficulty": 5,
    "streetObjects": [
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 130.0,
        "y": 440.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 240.0,
        "y": 430.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 350.0,
        "y": 420.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 376.7,
        "y": 330.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 403.3,
        "y": 240.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 430.0,
        "y": 150.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 870.0,
        "y": 150.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 938.3,
        "y": 203.3,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1006.7,
        "y": 256.7,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 1211.7,
        "y": 416.7,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1280.0,
        "y": 470.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1310.0,
        "y": 570.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1340.0,
        "y": 670.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1370.0,
        "y": 770.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 150.0,
        "y": 780.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 158.0,
        "y": 868.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 166.0,
        "y": 956.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 190.0,
        "y": 1220.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 280.0,
        "y": 1248.3,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 550.0,
        "y": 1333.3,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 640.0,
        "y": 1361.7,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 730.0,
        "y": 770.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 920.0,
        "y": 963.3,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 983.3,
        "y": 1027.8,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 1046.7,
        "y": 1092.2,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1236.7,
        "y": 1285.6,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1300.0,
        "y": 1350.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      }
    ]
  },
  {
    "id": "zen-harbor",
    "sceneId": "lighthousebay",
    "title": "白塔月牙湾",
    "theme": "harbor",
    "bounds": {
      "w": 1790,
      "h": 1400
    },
    "spawn": {
      "x": 470,
      "y": 660
    },
    "zones": [
      [
        390,
        600
      ],
      [
        570,
        610
      ],
      [
        390,
        780
      ],
      [
        610,
        820
      ],
      [
        260,
        990
      ],
      [
        790,
        680
      ],
      [
        820,
        940
      ],
      [
        630,
        1120
      ],
      [
        1030,
        810
      ],
      [
        1050,
        1070
      ],
      [
        1100,
        540
      ],
      [
        890,
        330
      ],
      [
        1370,
        820
      ],
      [
        1420,
        1100
      ],
      [
        1390,
        360
      ]
    ],
    "targets": [
      [
        490,
        350,
        "月牙湾灯塔"
      ],
      [
        250,
        160,
        "海岸救援馆"
      ],
      [
        1590,
        590,
        "湾口航标所"
      ]
    ],
    "targetTier": 5,
    "sceneMotifs": [
      "条纹白灯塔",
      "救生艇与浮圈",
      "月牙岸线"
    ],
    "brief": "在白灯塔下面捡起浮圈，沿月牙湾两侧任选一边慢慢长大；海面和岸线都可自由穿行，最终把救生艇、港屋与灯塔一起收入夜色。",
    "sceneTerrain": [
      {
        "type": "pond",
        "x": 630,
        "y": 50,
        "w": 1120,
        "h": 700,
        "points": [
          [
            630,
            50
          ],
          [
            1720,
            50
          ],
          [
            1750,
            750
          ],
          [
            1320,
            750
          ],
          [
            1210,
            640
          ],
          [
            1040,
            575
          ],
          [
            900,
            590
          ],
          [
            770,
            500
          ],
          [
            680,
            330
          ]
        ]
      },
      {
        "type": "dock",
        "x": 1160,
        "y": 180,
        "w": 95,
        "h": 800
      },
      {
        "type": "path",
        "x": 190,
        "y": 1080,
        "w": 1370,
        "h": 70
      }
    ],
    "roads": [
      {
        "x": 330,
        "y": 390,
        "w": 60,
        "h": 820
      },
      {
        "x": 920,
        "y": 760,
        "w": 55,
        "h": 510
      }
    ],
    "time": null,
    "difficulty": 5,
    "streetObjects": [
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 130.0,
        "y": 450.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 215.0,
        "y": 395.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 300.0,
        "y": 340.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 380.0,
        "y": 313.3,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 620.0,
        "y": 233.3,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 700.0,
        "y": 206.7,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 780.0,
        "y": 180.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "van",
        "radius": 32,
        "w": 51,
        "d": 34,
        "height": 28,
        "x": 877.5,
        "y": 182.5,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 975.0,
        "y": 185.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1072.5,
        "y": 187.5,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1170.0,
        "y": 190.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 150.0,
        "y": 780.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 215.0,
        "y": 840.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 345.0,
        "y": 960.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "van",
        "radius": 32,
        "w": 51,
        "d": 34,
        "height": 28,
        "x": 410.0,
        "y": 1020.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 492.0,
        "y": 1074.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 738.0,
        "y": 1236.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 820.0,
        "y": 1290.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "van",
        "radius": 32,
        "w": 51,
        "d": 34,
        "height": 28,
        "x": 913.3,
        "y": 1295.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 1006.7,
        "y": 1300.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "tree",
        "radius": 22,
        "w": 30,
        "d": 30,
        "height": 43,
        "x": 1100.0,
        "y": 1305.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1193.3,
        "y": 1310.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1286.7,
        "y": 1315.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1380.0,
        "y": 1320.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1460.0,
        "y": 540.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "van",
        "radius": 32,
        "w": 51,
        "d": 34,
        "height": 28,
        "x": 1533.3,
        "y": 746.7,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 1570.0,
        "y": 850.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      }
    ]
  },
  {
    "id": "zen-sky",
    "sceneId": "sculpturepark",
    "title": "留白雕塑园",
    "theme": "skyline",
    "bounds": {
      "w": 1590,
      "h": 1430
    },
    "spawn": {
      "x": 650,
      "y": 450
    },
    "zones": [
      [
        570,
        400
      ],
      [
        750,
        410
      ],
      [
        570,
        580
      ],
      [
        360,
        610
      ],
      [
        860,
        600
      ],
      [
        610,
        800
      ],
      [
        1070,
        660
      ],
      [
        900,
        890
      ],
      [
        330,
        840
      ],
      [
        300,
        1080
      ],
      [
        1130,
        960
      ],
      [
        700,
        1030
      ],
      [
        1230,
        330
      ],
      [
        510,
        1230
      ],
      [
        1160,
        1230
      ]
    ],
    "targets": [
      [
        650,
        180,
        "拱环雕塑馆"
      ],
      [
        220,
        270,
        "环形艺术廊"
      ],
      [
        900,
        1270,
        "留白展览厅"
      ]
    ],
    "targetTier": 5,
    "sceneMotifs": [
      "折纸与环形雕塑",
      "石材展台",
      "不对称留白草坪"
    ],
    "brief": "先在雕塑馆前收起小展牌，再走向任意一块草坪。几何雕塑与艺术楼都是可吞的展品，随意选择参观顺序，最后收空整座公园。",
    "sceneTerrain": [
      {
        "type": "gardenbed",
        "x": 150,
        "y": 400,
        "w": 390,
        "h": 830
      },
      {
        "type": "gardenbed",
        "x": 900,
        "y": 170,
        "w": 420,
        "h": 940
      },
      {
        "type": "court",
        "x": 500,
        "y": 80,
        "w": 320,
        "h": 260
      },
      {
        "type": "path",
        "x": 540,
        "y": 890,
        "w": 860,
        "h": 70
      }
    ],
    "roads": [
      {
        "x": 730,
        "y": 350,
        "w": 65,
        "h": 860
      }
    ],
    "time": null,
    "difficulty": 5,
    "streetObjects": [
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 160.0,
        "y": 450.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 250.0,
        "y": 386.7,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 340.0,
        "y": 323.3,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 430.0,
        "y": 260.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 910.0,
        "y": 140.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 970.0,
        "y": 206.7,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 1030.0,
        "y": 273.3,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1090.0,
        "y": 340.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 1315.0,
        "y": 535.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 1390.0,
        "y": 600.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 130.0,
        "y": 650.0,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 133.3,
        "y": 743.3,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 136.7,
        "y": 836.7,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "house",
        "radius": 46,
        "w": 72,
        "d": 54,
        "height": 61,
        "x": 140.0,
        "y": 930.0,
        "tier": 3,
        "value": 6,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 143.3,
        "y": 1023.3,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 146.7,
        "y": 1116.7,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 150.0,
        "y": 1210.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 240.0,
        "y": 1227.1,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 690.0,
        "y": 1312.9,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bin",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 17,
        "x": 810.0,
        "y": 690.0,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 884.3,
        "y": 748.6,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "lamp",
        "radius": 9,
        "w": 12,
        "d": 12,
        "height": 37,
        "x": 1032.9,
        "y": 865.7,
        "tier": 0,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "bench",
        "radius": 21,
        "w": 36,
        "d": 20,
        "height": 17,
        "x": 1255.7,
        "y": 1041.4,
        "tier": 1,
        "value": 1,
        "streetDressing": true
      },
      {
        "kind": "kiosk",
        "radius": 31,
        "w": 42,
        "d": 42,
        "height": 37,
        "x": 1330.0,
        "y": 1100.0,
        "tier": 2,
        "value": 3,
        "streetDressing": true
      }
    ]
  }
];
// v07 Zen cities use their own finite city plans. Campaign SPECS/make stay intact.
// Rectangles below describe named neighbourhoods, not copied resource islands.
const ZEN_CITY_PLANS=[
 {bounds:{w:3200,h:3000},spawn:{x:600,y:620},hero:[650,370],final:[2540,2380],
  districts:[['灯串入口街',120,120,790,690,'street'],['糕点作坊巷',1100,120,850,670,'court'],['巡游花车库',2110,100,960,780,'street'],['旋转木马广场',130,1010,790,720,'arc'],['帐篷集市',1110,1040,840,700,'court'],['烟火工坊',2120,1060,950,650,'street'],['音乐草坪',120,1990,900,860,'arc'],['后台小镇',1120,2010,720,840,'street'],['庆典大剧场',2010,1910,1070,980,'court']],
  roads:[[970,80,72,2750],[2010,100,72,2750],[120,900,2950,78],[120,1820,2950,80]],
  terrain:[['plaza',270,160,570,610],['court',1190,210,620,490],['stage',2140,2000,810,750],['gardenbed',180,2070,770,620],['path',130,1300,770,65],['plaza',1200,1120,650,540]],
  labels:['庆典大剧场','花车总装馆','灯火钟楼','旋转木马殿','露天音乐厅','彩旗拱门']},
 {bounds:{w:3100,h:3100},spawn:{x:710,y:660},hero:[730,400],final:[2620,2450],
  districts:[['春樱温室',100,100,1240,830,'arc'],['夏荫湖畔',1680,110,1290,840,'arc'],['苗圃小街',100,1110,720,680,'street'],['四季中庭',1010,1090,1100,740,'court'],['水生花房',2310,1130,660,690,'court'],['秋果梯田',110,2040,1080,930,'street'],['冬松雕园',1370,2030,660,920,'arc'],['四季植物宫',2110,1930,880,1060,'court']],
  roads:[[1440,90,78,1000],[110,980,2860,76],[100,1890,2880,80],[870,1080,72,1900],[2100,1080,72,1890]],
  terrain:[['gardenbed',110,110,1210,790,'#e6b7c0'],['gardenbed',1660,110,1310,800,'#9fc498'],['gardenbed',120,2050,1030,900,'#d6b47b'],['gardenbed',1380,2040,640,880,'#dce4dc'],['court',1050,1130,990,650],['glassbed',2340,1160,600,610],['pond',1520,260,115,520]],
  labels:['四季植物宫','春樱花房','夏日荫廊','秋实展馆','冬松穹亭','种子图书馆']},
 {bounds:{w:3500,h:2780},spawn:{x:640,y:650},hero:[670,390],final:[2800,2315],
  districts:[['灯塔老镇',120,100,810,800,'court'],['贝壳市集',1110,100,500,790,'street'],['渔网修补巷',120,1080,820,660,'street'],['海湾码头',1110,1090,850,610,'street'],['渡船候船街',2140,1000,1220,630,'street'],['船长花园',120,1940,810,700,'arc'],['盐仓街区',1130,1910,1050,740,'court'],['海洋文化馆',2320,1780,1060,860,'court']],
  roads:[[980,100,74,2550],[110,970,1510,78],[100,1800,3280,80],[2010,970,72,800],[1110,890,2240,76]],
  terrain:[['pond',1700,90,1660,730],['dock',1780,760,1240,115],['dock',2030,380,105,500],['dock',2600,490,100,400],['plaza',160,170,710,650],['court',2350,1830,970,760],['gardenbed',140,1980,740,600],['path',1120,1210,800,75]],
  labels:['海洋文化馆','白昼灯塔','渡船大厅','海风钟楼','海事展馆','船长会馆']},
 {bounds:{w:3300,h:2920},spawn:{x:560,y:620},hero:[610,350],final:[2520,2240],
  districts:[['雕塑入口庭',100,100,810,750,'court'],['艺术家工作坊',1120,100,850,680,'street'],['几何雕塑林',2170,100,980,800,'arc'],['铸造小街',100,1030,730,680,'street'],['中央镜面庭',1020,980,850,780,'court'],['斜坡展廊',2090,1070,1070,660,'street'],['石作花园',110,1950,850,820,'arc'],['公共艺术广场',1160,1980,750,790,'court'],['城市美术馆',2060,1810,1110,990,'court']],
  roads:[[950,80,74,1650],[80,900,3090,78],[110,1810,1820,76],[1940,930,76,1850],[1020,1890,72,890]],
  terrain:[['court',170,150,680,630],['gardenbed',2200,140,900,680],['plaza',1080,1030,720,670],['gardenbed',150,1990,760,710],['court',1210,2030,660,660],['court',2150,1880,960,890],['path',2180,1380,890,65]],
  labels:['城市美术馆','云帆雕塑馆','镜面展厅','石作工坊','艺术档案馆','公共雕塑厅']}
];
// Frozen placement results keep scene loading cheap; regenerate only while authoring.
const ZEN_CITY_PLACEMENTS=[[[8,0,1347,367,1],[8,1,1357,1287,4],[8,2,2357,347,2],[7,0,1307,2197,7],[7,1,615.1,1391.5,3],[7,2,307,307,0],[7,3,2307,1247,5],[7,4,681.4,2632.6,6],[7,5,571.1,2183.8,6],[6,0,272.8,2370.8,6],[6,1,294.1,1292.3,3],[6,2,1804,260,1],[6,3,1804,1180,4],[6,4,368,2629.7,6],[6,5,1606.7,1594,4],[6,6,1603.1,644,1],[6,7,2686.8,1271.4,5],[6,8,2776.3,433,2],[6,9,335,650.9,0],[5,1,1208,676,1],[5,2,817.7,2310.4,6],[5,3,2714,208,2],[5,4,1480,2430,7],[5,5,369.3,1517.8,3],[5,6,2966,2018,8],[5,7,1218,1626,4],[5,8,504.8,1125.6,3],[5,9,1297,2550.4,7],[5,10,1836,542.6,1],[5,11,1836,1483.4,4],[5,12,2421.9,707.7,2],[5,13,1618.1,2670.9,7],[5,14,2918.4,1335.5,5],[5,15,2921.3,2776,8],[5,16,270.1,2134.1,6],[5,17,2722,757.3,2],[4,0,470.4,2444.8,6],[4,1,619.7,201,0],[4,2,1573.3,2090,7],[4,3,2590,593,2],[4,4,2994,2605,8],[4,5,703.1,1149.4,3],[4,6,557.8,1640.9,3],[4,7,2506,1479.2,5],[4,8,2214.7,2804,8],[4,9,2703,1479.2,5],[4,10,496.3,479,0],[4,11,1649.4,2221.9,7],[4,12,2899.6,713,2],[4,13,1649.4,2447.9,7],[4,14,2209.2,626,2],[4,15,822.7,244.4,0],[4,16,2227.9,1495,5],[4,17,791.7,580.8,0],[4,18,2811.5,1574.1,5],[4,19,2985.9,358,2],[4,20,1223.3,2721.4,7],[4,21,831.8,1266.6,3],[4,22,1388,701,1],[4,23,1390.4,1638.2,4],[4,24,2157.3,1996,8],[4,25,2947.4,1160.3,5],[4,26,2954.1,533.9,2],[4,27,894.5,2118.4,6],[4,28,798.7,1612.6,3],[4,29,1445.8,2720.9,7],[4,30,1659.8,1363.9,4],[4,31,1694.4,435.8,1],[3,0,221.5,1482.2,3],[3,1,3016,2256,8],[3,2,1602.4,1098,4],[3,3,1598.4,178,1],[3,4,506.5,2777.6,6],[3,5,350,1121.3,3],[3,6,877.9,2478.2,6],[3,7,909.6,2586.4,6],[3,8,2749.4,2826,8],[3,9,842.8,1443.8,3],[3,10,809.5,432.3,0],[3,11,2340.6,2826,8],[3,12,675.6,2393.8,6],[3,13,1713.7,2786.9,7],[3,14,677.6,1630.3,3],[3,15,434.2,1652.5,3],[3,16,2283.6,817.4,2],[3,17,809.5,719.3,0],[3,18,2871.3,158,2],[3,19,1845.8,726,1],[3,20,1886,1648.7,4],[3,21,2292.3,1621.6,5],[3,22,1727.3,2335.2,7],[3,23,259.2,1630.2,3],[3,24,2565,817.4,2],[3,25,2987,817.4,2],[3,26,2431.3,1621.6,5],[3,27,2521.5,1164.6,5],[3,28,3016,2157.5,8],[3,29,255.9,2776.4,6],[3,30,632.3,543.1,0],[3,31,210.1,2542.1,6],[3,32,2987.3,1488.1,5],[3,33,191.8,518.3,0],[3,34,2637.7,1609.5,5],[3,35,839.9,1085.2,3],[3,36,2992.2,1636.4,5],[3,37,1766.8,1674.5,4],[3,38,180.5,2652.5,6],[3,39,2520.9,1352.3,5],[3,40,1532.8,2259.1,7],[3,41,2360.1,1510,5],[3,42,566.8,748.9,0],[3,43,2528.7,1620.2,5],[3,44,2999.9,212.1,2],[3,45,915.7,2754.2,6],[3,46,2192.3,746.7,2],[3,47,1759.5,2507.3,7],[3,48,2873.6,278.8,2],[3,49,1759.9,2152.6,7],[3,50,222.6,1100.7,3],[3,51,1627.5,305,1],[3,52,2183.2,1636.8,5],[3,53,1764.1,2644.6,7],[3,54,1206,2414.8,7],[2,0,2442.7813403177242,845.1225950363892,2],[2,1,1705.329610971128,781.077009891126,1],[2,2,1440.358720764942,2563.227508347969,7],[2,3,768.7696820433325,146.23931130491826,0],[2,4,3096.7793618397586,2218.6410024122524,8],[2,5,2878.464396571823,1485.5744692658006,5],[2,6,3059.3973993679233,1161.0632396883743,5],[2,7,940.9314148653032,1291.7859939152117,3],[2,8,843.3506155900516,1714.223434932251,3],[2,9,1778.4379831703006,2420.3382107276916,7],[2,10,2567.3527556967597,1088.3207446613874,5],[2,11,1266.59737075415,1756.2278601366993,4],[2,12,2579.5680376365713,729.6003856533558,2],[2,13,653.3820983470717,769.5043744340369,0],[2,14,1795.1448432338607,2234.3239317790117,7],[2,15,932.2607697851611,2841.6456454268755,6],[2,16,2123.00241783277,1702.353421735403,5],[2,17,263.32510162672867,1995.2652033817462,6],[2,18,1136.683035083991,556.6899395894516,1],[2,19,557.8056184327625,997.103290257842,3],[2,20,3055.994084818528,2741.6706610186097,8],[2,21,3080.2795683602258,2674.8343474486096,8],[2,22,1644.960615104271,2333.8119826548864,7],[2,23,2719.9597944652332,1636.8804967378617,5],[2,24,2841.4016423949056,1124.1289040113174,5],[2,25,1107.6637523176353,772.1958283971978,1],[2,26,961.1711522463447,2513.8643793989163,6],[2,27,3055.7959328114503,873.8634362096609,2],[2,28,2347.115780953129,1691.7158338643887,5],[2,29,134.19468650745895,1090.4286541151832,3],[2,30,2108.2669919963337,717.3835615079914,2],[2,31,1960.8016316437288,481.3990789361548,1],[2,32,1752.3325595231554,2063.922303567191,7],[2,33,956.6823713817097,2308.186305098586,6],[2,34,1571.97516959522,2528.828336426687,7],[2,35,1113.131545646785,2707.838596480319,7],[2,36,2123.34638637855,1457.7234406268965,5],[2,37,508.91645858984543,217.46228880273193,0],[2,38,2135.982501939216,2725.740460651429,8],[2,39,838.5156228834237,133.5222922639121,0],[2,40,253.855045271261,1719.0393576009403,3],[2,41,2786.494072390548,2906.901358415572,8],[2,42,525.04493767746,2864.646454761461,6],[2,43,2281.908620022961,2892.9053205387345,8],[2,44,2862.906828656692,817.7597784303244,2],[2,45,1974.999548825308,259.60718765150773,1],[2,46,437.54422745514194,787.7418116499051,0],[2,47,1676.9097130389887,1749.921763057576,4],[2,48,2646.518961064753,329.5208187275731,2],[2,49,2993.611951360004,1058.2781613991363,5],[2,50,2827.5150217716728,2006.0454692647645,8],[2,51,876.9654672123053,508.17906568304625,0],[2,52,1613.9886671445552,1986.726419806421,7],[2,53,348.04684336794327,2019.0118181177002,6],[2,54,725.8069248159892,749.573241753131,0],[2,55,1387.7434729865151,1750.1684904972226,4],[2,56,1851.169391028677,2626.163049441533,7],[2,57,1848.89428539079,2153.6085473626267,7],[2,58,1002.3292012070665,2774.6054281558995,6],[2,59,2218.6324822279466,1718.4427535251366,5],[2,60,1836.4864367223433,1729.860640683999,4],[2,61,1814.8407836112099,2351.250271173264,7],[2,62,295.3686378497595,2856.169835315641,6],[2,63,2951.8506022711435,1715.7279654530394,5],[2,64,1129.6520137040573,2369.0617775973474,7],[2,65,577.8982054234667,2417.13891125183,6],[2,66,3057.329489998323,1331.073171699078,5],[2,67,1972.5469999977192,568.5983997896572,1],[2,68,3093.582248024718,2073.1703723837295,8],[2,69,506.80354144972557,1739.4918922393224,3],[1,0,1305.8286820027756,760.0865564617782,1],[1,1,547.320553092324,274.28175533745696,0],[1,2,2114.665864606155,2790.065447405606,8],[1,3,2363.4709183547807,821.9427305845662,2],[1,4,751.5925362759596,2415.3901466031843,6],[1,5,1874.2798263719012,800.7589425408516,1],[1,6,445.5352893853386,1730.6825505758839,3],[1,7,112.02356553078305,524.2766632311626,0],[1,8,886.5545881546773,2661.963939765469,6],[1,9,2954.15704576032,1566.0243392022664,5],[1,10,289.1741111171763,1070.889572094512,3],[1,11,737.6925354624368,493.0948475046999,0],[1,12,900.5068454737645,1034.526434093117,3],[1,13,1811.0482565777995,2709.375467611628,7],[1,14,831.9265213036816,1164.600078468855,3],[1,15,1496.9934431821,2623.6432343921765,7],[1,16,1546.480887703421,1992.625797997501,7],[1,17,1642.8425996288413,1163.4987180616151,4],[1,18,970.477575016567,2186.4544494842326,6],[1,19,2998.6656966871483,737.2896632312984,2],[1,20,3025.6537615549832,451.93422401994667,2],[1,21,841.1757403201517,345.7293985949898,0],[1,22,238.7421917412037,1553.8948358153505,3],[1,23,1343.409602314286,2709.71043067132,7],[1,24,1823.8389942178683,1339.7730086980382,4],[1,25,3045.961073592295,277.50930743804884,2],[1,26,2947.9839355850722,139.01121322505043,2],[1,27,1718.612112889228,2576.0617676301067,7],[1,28,3038.3738801801182,2514.2698575017075,8],[1,29,2454.618265609619,1397.0965588656422,5],[1,30,2737.7125922690757,81.19813499841344,2],[1,31,2689.6933492568805,618.8889187480988,2],[1,32,3091.4264660639546,1987.847029819476,8],[1,33,574.7270580757522,1741.485658544845,3],[1,34,1375.757680014142,2652.567645753389,7],[1,35,2617.2712102609885,1536.2926843814896,5],[1,36,843.9674041561399,2029.7971966736884,6],[1,37,2813.314657246197,658.604783060836,2],[1,38,919.7356107707819,1425.8580994505396,3],[1,39,2344.741577543902,868.9917386355899,2],[1,40,837.0247558286892,2761.3558336051524,6],[1,41,1823.684487900617,802.8824045187326,1],[1,42,396.31901611699936,1721.8255440660646,3],[1,43,124.4175251850831,475.1768961249646,0],[1,44,1527.1562466400046,2180.3018525090115,7],[1,45,2941.124499916438,2904.4795283423127,8],[1,46,3015.757045551244,1414.4033477117555,5],[1,47,1181.2117476978437,1750.6861038470322,4],[1,48,2797.3938972343108,1380.204844183371,5],[1,49,1762.747542595242,2724.5885670516,7],[1,50,893.1478206264247,1185.1110749586915,3],[1,51,900.6989591840388,1613.0607877741456,3],[1,52,2255.7650649268685,2018.486239991328,8],[1,53,2802.391500934688,1452.1753900684953,5],[1,54,914.3921342968188,2218.4415063517004,6],[1,55,1634.3450546193865,2797.0386707037874,7],[1,56,1881.3786689561173,663.3550264120344,1],[1,57,2860.036002087055,573.3457132859004,2],[1,58,807.322094858783,2438.9818769690346,6],[1,59,2432.089346157535,1544.8931804198264,5],[1,60,149.81762840495227,2087.4829314148683,6],[1,61,1078.9389344963722,691.5961973271794,1],[1,62,415.8303734994346,1032.1901206490988,3],[1,63,1685.5151983591343,2537.7343412309474,7],[1,64,1884.9181944899537,1364.03497058249,4],[1,65,1590.3566581254283,1432.8265059745527,4],[1,66,2809.1010946041847,120.840480697253,2],[1,67,427.01424542391595,2786.6562033695436,6],[1,68,2778.4181045953064,873.3086094816806,2],[1,69,2885.288356707504,79.23245670567331,2],[1,70,2071.0136300926456,1943.5055967915514,8],[1,71,1149.8288804276024,2650.646946434953,7],[1,72,2172.1917013346733,1410.7528311465912,5],[1,73,1425.3077162105965,1541.2956587713406,4],[1,74,1756.4358893151978,1334.531566329461,4],[1,75,2301.513596046438,895.36860314694,2],[1,76,193.49951057482764,2727.952307387256,6],[1,77,1781.950549581032,774.2000796803881,1],[1,78,1924.1636051345358,1072.847267878643,4],[1,79,3027.525067078098,137.0210038097831,2],[1,80,1749.9904735295906,709.9104603705104,1],[1,81,1839.3138933483724,2501.8463380582734,7],[1,82,334.8422221101939,811.8999226898494,0],[1,83,1571.1918866301235,1752.0606652045726,4],[1,84,681.9736222891241,1709.1788401795568,3],[1,85,2426.678999143659,1701.46642818535,5],[1,86,2373.6910734570156,2897.7354923135154,8],[1,87,894.5058512039958,574.4788483468685,0],[1,88,1869.090630866301,112.74440664807685,1],[1,89,1270.6008841973362,2811.7693883687957,7],[0,24,2483.2816909743296,1579.3282150430182,5],[0,25,201.24392325555385,1419.3852616424847,3],[0,26,315.71802891811495,2806.579519816451,6],[0,27,3003.768745549529,1702.3936673205108,5],[0,28,2483.4007025179244,1668.1997254953656,5],[0,29,1213.8906109111451,1509.0721892733966,4],[0,30,777.5396564635187,1109.6987255589354,3],[0,31,510.72974979798477,714.084385079631,0],[0,32,529.8668239270767,561.4273518405671,0],[0,33,384.23481761495907,2271.8895282433614,6],[0,34,1568.6138295640287,2177.8751375910447,7],[0,35,1633.8261284418643,369.23569962466024,1],[0,36,619.1100582423558,1181.737125468222,3],[0,37,1364.2419619938642,1553.1308690083792,4],[0,38,1712.3549477265065,1292.0739777694453,4],[0,39,2532.168245765261,1230.745207931429,5],[0,40,3080.5377953373277,2269.8156785210576,8],[0,41,1527.5735630075387,2758.4910147914643,7],[0,42,2368.61155616652,1645.2465432936106,5],[0,43,2980.932256211183,148.88430024462448,2],[0,44,1748.4336417335546,611.1498465686574,1],[0,45,3002.1129175910105,1570.1373856172743,5],[0,46,1270.4421478977758,2429.055159568423,7],[0,47,283.2837573854209,1129.0986195014366,3],[0,48,2421.6465984186057,1447.8231989895714,5],[0,49,2677.9449323461326,543.5905993599961,2],[0,50,247.06978334088933,2716.745291077579,6],[0,51,1556.478847564081,2571.442302598194,7],[0,52,1728.1160429215124,2406.3694740368173,7],[0,53,1303.6508231771445,2759.671989950292,7],[0,54,793.006926619326,1145.3079899966976,3],[0,55,2509.8994931050815,781.0691021316145,2],[0,56,2964.1816022560606,445.34020379777024,2],[0,57,2658.810271077322,855.7685643171386,2],[0,58,2959.152566296486,2222.4683838545684,8],[0,59,697.0710180202046,525.9618780309416,0],[0,60,1729.895574404934,1309.2653631381017,4],[0,61,2325.4940776544286,643.187225011633,2],[0,62,1516.1891474631811,2324.0082396772555,7],[0,63,1662.5517215917337,213.1664165866248,1],[0,64,288.29571628328137,510.4624342189446,0],[0,65,174.02396861222414,1054.5549116956765,3],[0,66,2576.0862923493014,1535.6615942453654,5],[0,67,2645.4523810448336,662.6134572942517,2],[0,68,473.64778226641266,565.0690248100334,0],[0,69,1677.204384783366,349.92743185746417,1],[0,70,1577.9996819347064,115.23195858691426,1],[0,71,2613.1438890117884,1474.1128280868265,5],[0,72,905.7884058403716,2029.1107403234687,6],[0,73,1659.8380720325,1065.4904955253182,4],[0,74,904.1138301870863,1470.811372193747,3],[0,75,118.19609820229478,2677.1419118735116,6],[0,76,216.47173976827185,1680.5020454610915,3],[0,77,565.4344784618258,538.8571201492402,0],[0,78,2366.9720301533443,1602.867346813445,5],[0,79,168.70888729808695,456.4711999616072,0],[0,80,1557.1924052582606,1048.550294463297,4],[0,81,1923.354019286881,349.194271565313,1],[0,82,1760.3011094447072,1571.2958359007855,4],[0,83,1124.141965225505,1695.8546298270176,4],[0,84,2607.1598337267824,255.68835152016953,2],[0,85,2559.430879388848,509.41454154542885,2],[0,86,545.0285111551116,404.52495585361385,0],[0,87,869.6272783378631,1666.3617074466881,3],[0,88,2214.1394500244223,2063.1809267643816,8],[0,89,1939.484831090562,1537.9883662895115,4],[0,90,855.5319166501538,2199.526373517121,6],[0,91,1537.6254269910287,1110.6591742031399,4],[0,92,1824.848833113168,2672.8591449868613,7],[0,93,2290.0355983042573,750.709797762593,2],[0,94,957.9852372854683,2804.8750304164846,6],[0,95,694.3852814812097,568.2876522010081,0],[0,96,1783.7257668009668,1739.326834090516,4],[0,97,2958.6769079621695,263.6427655722948,2],[0,98,491.1441528473366,1009.3996650669925,3],[0,99,1719.011560813683,137.6155025966373,1],[0,100,381.97944782491584,510.5542430920478,0],[0,101,552.6415725706659,2478.8194612112525,6],[0,102,2771.8750912484825,1653.7923246394148,5],[0,103,2592.5429120529566,681.9636644832649,2],[0,104,426.50519177534693,534.2239508264657,0],[0,105,748.4344369667042,1539.1536034039398,3],[0,106,2124.6452217183737,1914.2830161142874,8],[0,107,873.2865976553705,411.79951318744173,0],[0,108,864.0673947196392,758.1767209716958,0],[0,109,1757.7999481270115,2836.003916088179,7],[0,110,157.27575540281217,2583.314065350757,6],[0,111,115.88185486109079,2634.7942009836647,6],[0,112,2579.386780453635,1578.5877301684684,5],[0,113,2349.8655141331374,1443.7862907016909,5],[0,114,2920.559706290957,231.01102653260844,2],[0,115,764.9312457814302,385.7101477755137,0],[0,116,480.9765194884641,1240.1488619599359,3],[0,117,2815.2328618212173,2825.383825272684,8],[0,118,1722.6891544520136,1508.2324843944455,4],[0,119,1435.5362518613533,625.7583575473398,1],[0,120,2119.838469484375,1615.021192624078,5],[0,121,549.9266166950192,2827.3003919745497,6],[0,122,2535.5320425544387,679.8296052251454,2],[0,123,1496.0978369349339,2203.0468892357853,7],[0,124,1558.3596118331577,230.4668210915107,1],[0,125,742.5041065600926,431.55820340485354,0],[0,126,770.0422171706741,665.1512846487217,0],[0,127,2257.5640192583087,756.5289262003112,2],[0,128,273.2529166448043,2519.723469454484,6],[0,129,236.19243274390124,2689.7471869416477,6]],[[8,0,2435.9,530,1],[8,1,1735.4,2516.5,6],[8,2,1257,1337,3],[7,0,304.1,476.4,0],[7,1,297,2227,5],[7,2,287,1297,2],[7,3,1054.1,564.1,0],[7,4,2497,1317,4],[7,5,1921.1,433.2,1],[6,0,2041.5,752.9,1],[6,1,2824,1270,4],[6,2,2801.3,600.3,1],[6,3,1964,1230,3],[6,4,1560,1684,3],[6,5,2450,1674,4],[6,6,650,2180,5],[6,7,650,2505,5],[6,8,1672.3,1236,3],[6,9,359.6,2630.5,5],[5,1,1996,1460,3],[5,2,1021.5,276.6,0],[5,3,1759.2,2160.2,6],[5,4,1118,1716,3],[5,5,475.5,254.3,0],[5,6,498.4,782.9,0],[5,7,2176.3,295.8,1],[5,8,882,797.8,0],[5,9,590.6,551.1,0],[5,10,2714.6,326.7,1],[5,11,1567,2220,6],[5,12,1781,1460,3],[5,13,816.6,221.7,0],[5,14,2281.5,832.8,1],[5,15,529,1539.6,2],[5,16,1902.1,1716,3],[5,17,2856,1566.5,4],[4,0,191,2505,5],[4,1,553.3,1190,2],[4,2,2370.5,2903,7],[4,3,2723.3,1734,4],[4,4,2565,827.3,1],[4,5,1625.1,2842.4,6],[4,6,558.2,2697,5],[4,7,672.5,840,0],[4,8,741.8,2697,5],[4,9,553.3,1363.3,2],[4,10,2472.5,211.8,1],[4,11,1796.2,2830.2,6],[4,12,257.4,1550,2],[4,13,1841.1,689.1,1],[4,14,1051.2,2269.2,5],[4,15,650,250.5,0],[4,16,1051.2,2461.2,5],[4,17,1052,2653.6,5],[4,18,2903,2902.7,7],[4,19,1052,2846.1,5],[4,20,316.8,2845.2,5],[4,21,500,2846.1,5],[4,22,328.2,732.2,0],[4,23,684,2846.1,5],[4,24,1853.7,832.5,1],[4,25,1523.3,2744.3,6],[4,26,705.9,1390.9,2],[4,27,1255.1,199.3,0],[4,28,705.9,1649.9,2],[4,29,2329.6,198.8,1],[4,30,1348,1743,3],[4,31,706.8,1217.4,2],[3,0,2640,1618.5,4],[3,1,2600.5,220.6,1],[3,2,1435.7,2508.8,6],[3,3,1489.7,1148,3],[3,4,1179.2,324.4,0],[3,5,994.3,2098,5],[3,6,1349.1,1616,3],[3,7,1266.6,483.8,0],[3,8,168,2640.7,5],[3,9,2429.8,876.9,1],[3,10,1896.6,2227.7,6],[3,11,1630.3,1460,3],[3,12,525.5,410.7,0],[3,13,168,2776.3,5],[3,14,2046,1616,3],[3,15,2550,2926,7],[3,16,2697.2,798.3,1],[3,17,1770.9,1616,3],[3,18,1449.9,2362.1,6],[3,19,821.1,591,0],[3,20,1046.4,794.7,0],[3,21,1448.1,2609.9,6],[3,22,2024.8,229.4,1],[3,23,2876.6,433.9,1],[3,24,2906,1729.3,4],[3,25,1762,596.7,1],[3,26,876.7,387.6,0],[3,27,2046.2,1766,3],[3,28,240.7,1699.9,2],[3,29,1892.7,2758.6,6],[3,30,542.7,1699.9,2],[3,31,391.7,1699.9,2],[3,32,2714.5,1442.3,4],[3,33,1126.4,2119.4,5],[3,34,2782,2926,7],[3,35,2272.7,2035.3,7],[3,36,820,2112.9,5],[3,37,432.1,2412.2,5],[3,38,1759.3,1766,3],[3,39,2909.3,2035.3,7],[3,40,326.3,199.3,0],[3,41,823.9,2411.7,5],[3,42,1533.9,1493.9,3],[3,43,2242.4,2888.5,7],[3,44,2630.3,1501.5,4],[3,45,2911.7,318.5,1],[3,46,1485.6,2888.1,6],[3,47,2910.5,1429.2,4],[3,48,200.2,785.1,0],[3,49,802.7,2895.9,5],[3,50,754.4,1512.9,2],[3,51,1271.1,842.4,0],[3,52,174.1,2888.8,5],[3,53,2845.5,884.3,1],[3,54,1949.9,2089.8,6],[2,0,939.4619534661389,2453.5443513144423,5],[2,1,696.009798523429,2345.7320078917573,5],[2,2,1032.8642283734844,1825.8767509055388,3],[2,3,1428.0235480480187,2217.4415233363056,6],[2,4,125.12350404527973,2413.1888499106576,5],[2,5,2998.2957914228537,2843.8551859796294,7],[2,6,1157.0406013654335,2232.569860734589,5],[2,7,592.6385582744828,2909.045194580883,5],[2,8,710.8243550477424,1761.7916919496877,2],[2,9,1695.9903163769893,537.0030849374106,1],[2,10,2039.7570437840259,2084.7293311688045,6],[2,11,2985.343018349401,1989.0565208887494,7],[2,12,2357.001884662977,2006.7659459194788,7],[2,13,2868.390751576762,971.340298093762,1],[2,14,1819.781116761834,1831.2919176869648,3],[2,15,714.1439778972918,127.76511012999819,0],[2,16,93.37406424679399,2928.5909951718886,5],[2,17,422.81332033793524,125.67218890851416,0],[2,18,1154.7708951399175,2503.8271002991787,5],[2,19,349.99146989954664,1614.7751472544937,2],[2,20,817.3493753402736,2779.6818715662293,5],[2,21,2620.684809025575,924.4761392718669,1],[2,22,1751.5919401142394,2932.9332516434106,6],[2,23,2231.0847554510983,147.65562991423081,1],[2,24,239.99324905845242,864.7083998669234,0],[2,25,1199.7921332354451,2171.4921757958978,5],[2,26,1340.9111952601866,434.8219818795982,0],[2,27,2129.6875137812076,1646.2886123340147,3],[2,28,2161.1392519338806,2927.187088592121,7],[2,29,187.80247154771996,1771.4740978541836,2],[2,30,2183.7008358215376,2035.6857143179725,7],[2,31,2851.3341873736244,794.4892976439364,1],[2,32,429.06420250394666,2931.4763001868723,5],[2,33,2201.7824093769545,693.313514583268,1],[2,34,794.4276818302549,2598.4058066778434,5],[2,35,666.8350683326483,1113.8441974739035,2],[2,36,1675.3632502696141,1550.343107686197,3],[2,37,2978.6753543021564,1782.3875962636848,4],[2,38,1105.0790911390036,861.6160986841023,0],[2,39,811.143811609383,1352.5889034621991,2],[2,40,2700.2195343962867,2963.575995604107,7],[2,41,1848.4483957067312,944.3768101634423,1],[2,42,2481.9694548006933,2983.383315692674,7],[2,43,1937.1555913502712,208.9437629941537,1],[2,44,1369.732955352723,2323.4445352825574,6],[2,45,864.1063650455192,2035.5978101055903,5],[2,46,1006.4411186143836,2008.8226865240297,5],[2,47,815.9132763788558,1577.2204231106925,2],[2,48,1531.5940278262456,2964.294155972217,6],[2,49,1269.0071110892118,318.5107897125357,0],[2,50,2801.2714934585933,1438.7275828993315,4],[2,51,791.0743164845782,85.06384270234133,0],[2,52,1947.3113271192292,895.7923331453084,1],[2,53,1360.8227311230137,2627.3263690243916,6],[2,54,1108.4253606644402,2557.476986330196,5],[2,55,1355.3399796734664,2549.3248952265035,6],[2,56,988.0735933061507,2936.8436748606346,5],[2,57,885.3070995823076,2929.022003239519,5],[2,58,2985.9124381423558,369.41673619711884,1],[2,59,177.6113925210138,2977.7307040485084,5],[2,60,477.0513085792841,2489.013930097411,5],[2,61,1132.962070506388,2383.2002318817003,5],[2,62,1900.651686905713,2847.2440673443716,6],[2,63,1094.3388965003116,1579.0286446691243,3],[2,64,1894.64438031596,2018.7590505881806,6],[2,65,1871.2628664822414,2911.9714257884084,6],[2,66,2904.31754142898,1119.0361217416428,4],[2,67,2756.681626171541,1840.9096208680187,4],[2,68,2053.2823997845085,145.08064929972818,1],[2,69,941.0100335568154,2655.092430548053,5],[1,0,1183.1846956437705,128.38322483818865,0],[1,1,826.7215492272402,915.4617732322761,0],[1,2,401.63263993711104,1565.62989801383,2],[1,3,636.5357355797727,149.39256415266877,0],[1,4,401.91603155669833,660.2628976707301,0],[1,5,219.13337365070515,2700.9194162965514,5],[1,6,1216.4245755957932,395.211940883675,0],[1,7,2094.045211367302,1374.635273514518,3],[1,8,299.2010344497695,124.02951397720739,0],[1,9,2954.6376400651234,1362.4776744299063,4],[1,10,2299.3141658402765,2833.711518302607,7],[1,11,2554.0118184272105,1798.1996039746703,4],[1,12,2946.7477531044606,1660.455097378688,4],[1,13,1601.4226016283228,1381.6722156077217,3],[1,14,805.6726707832662,2975.8447510998335,5],[1,15,1338.0604314543566,517.4809550986488,0],[1,16,2061.92116362252,1694.3997228879346,3],[1,17,1819.7156668833134,1156.338400661722,3],[1,18,1847.9759352874025,1348.5808629885437,3],[1,19,709.2700146518359,2944.9201718248655,5],[1,20,657.0654435490287,1555.09974737183,2],[1,21,625.2398863041878,1454.9542430958222,2],[1,22,1283.657617221806,405.6396667438378,0],[1,23,846.8761965689463,515.26633713837,0],[1,24,1166.3009628540651,245.44675535034804,0],[1,25,1332.6134632424726,134.54922381810525,0],[1,26,1220.395609646728,904.279437609783,0],[1,27,1023.3840631639913,1626.8494279511094,3],[1,28,1581.9002539890719,2090.8567367956766,6],[1,29,2390.6442227799444,1523.2654926348876,4],[1,30,1425.4668024338812,2836.865260316128,6],[1,31,1785.6389333374977,1120.2490337408874,3],[1,32,1561.785554451954,1418.699022393606,3],[1,33,971.2658957788287,2715.937824918785,5],[1,34,2328.192690678329,2996.9100185175175,7],[1,35,1946.7335938353974,2168.7365179875624,6],[1,36,973.2555258021862,2393.867549116148,5],[1,37,453.81398782872895,1167.4937034975162,2],[1,38,1081.3317284151617,2748.408394894038,5],[1,39,2735.5475958451393,868.510126711877,1],[1,40,2835.7612585766583,296.721396944733,1],[1,41,464.4692949819505,1716.631909406249,2],[1,42,188.9176722937836,705.8995638804334,0],[1,43,1079.171455950884,2054.8286082928307,5],[1,44,349.82688663656995,122.83768506519054,0],[1,45,2984.916902597808,1402.6835031018738,4],[1,46,403.29327253036143,2786.496467702277,5],[1,47,2458.597102866672,1835.771721330707,4],[1,48,2385.098012385384,113.21980006291334,1],[1,49,1528.1524147644818,1309.9288419412142,3],[1,50,2503.160439461851,114.51722941853389,1],[1,51,1148.3136614246819,2620.01907352422,5],[1,52,1510.7514558989324,1225.18054291423,3],[1,53,2215.1281984847437,2813.2919629154408,7],[1,54,1287.2516388852014,1666.7422922956134,3],[1,55,645.2536163348241,2939.372277515192,5],[1,56,1248.1279137558265,1768.190601208315,3],[1,57,932.2415803571797,2047.5148284004538,5],[1,58,2083.063144166382,909.4774729870314,1],[1,59,622.2047172321043,1708.7881909207188,2],[1,60,804.0907719106535,1190.2797916484926,2],[1,61,1356.9629049281043,194.01335648941898,0],[1,62,279.7823006771565,264.3853566457888,0],[1,63,839.5110400443707,2664.41852284737,5],[1,64,367.52564218900983,2468.6939920896266,5],[1,65,2492.779765287192,1518.7875917267797,4],[1,66,1880.3152339649532,2112.9654776501907,6],[1,67,1431.6078152213227,2788.9826952019785,6],[1,68,1195.2199249171574,2078.6100755774564,5],[1,69,1968.7627590220065,2733.811763072776,6],[1,70,2281.1556105630825,2952.2095526919766,7],[1,71,734.5721853505721,1119.253651515436,2],[1,72,1423.8288048902812,1587.4411884058477,3],[1,73,2240.505925028554,2108.5362037296645,7],[1,74,2486.3932316697997,933.4438425398241,1],[1,75,1036.6535283785367,2164.687169934617,5],[1,76,2863.4490905794887,254.68895283656877,1],[1,77,744.1415187381103,612.8493057524346,0],[1,78,2115.7164176222577,1173.2009804321533,3],[1,79,1127.4057847530844,2039.4063227684185,5],[1,80,1349.8359962358556,848.8531307709754,0],[1,81,2986.8848036468194,1452.9773373580144,4],[1,82,1452.2854937300874,2281.1602979983763,6],[1,83,2359.7376391897633,1808.523998680394,4],[1,84,859.6087777357643,661.1218513538934,0],[1,85,2725.257998015747,1633.01898077475,4],[1,86,2556.245074361562,151.83532272932274,1],[1,87,1149.1817699013402,2684.579083247297,5],[1,88,772.6232505023569,2048.437269627811,5],[1,89,328.3329124206304,2947.5522932381,5],[0,24,1455.928817876886,2687.6861870270677,6],[0,25,1676.8474230223587,1411.8093638766036,3],[0,26,1516.358206151057,2370.6033425888672,6],[0,27,807.1167303701237,2177.6303743511803,5],[0,28,1885.2505057661967,2072.2090109626142,6],[0,29,2843.978852105461,2050.2046180004636,7],[0,30,2801.1327055805627,1123.777269735739,4],[0,31,1493.612733606763,1440.3655609298057,3],[0,32,821.5291769793571,2831.600216996633,5],[0,33,872.8964851317431,323.12339849271183,0],[0,34,1760.4833057715348,726.8087338911579,1],[0,35,466.3972109450512,1382.5069064263632,2],[0,36,1537.1002707943762,2842.1816888988496,6],[0,37,203.77408702581465,1477.7209473105445,2],[0,38,2496.1361418560487,886.3083092877622,1],[0,39,693.0889076202187,173.77095699739078,0],[0,40,1959.6574734188475,628.3897560727899,1],[0,41,2391.550168577886,262.6997387566763,1],[0,42,1168.679015032116,389.5560348341238,0],[0,43,2112.6943608038155,1451.5486003177605,3],[0,44,1327.784188363144,806.6802185111444,0],[0,45,1749.4380552164992,531.9065007639172,1],[0,46,2005.658507540069,2126.948200991489,6],[0,47,2975.9804684352434,2041.8356812389006,7],[0,48,2165.5150529027937,830.9312980820117,1],[0,49,2820.219197154092,946.3474093533832,1],[0,50,575.6185041150444,2799.1655581113077,5],[0,51,931.0185254598077,204.01141436126107,0],[0,52,594.7308640109813,434.17294597689215,0],[0,53,378.5597469222206,2910.6655150449706,5],[0,54,1708.5068108735077,2870.4589361863723,6],[0,55,285.3928872893978,1635.535947187151,2],[0,56,412.27469801868153,1636.1373008613966,2],[0,57,2685.5222902005294,733.3413124067353,1],[0,58,2922.3740422149117,384.9741677709263,1],[0,59,869.5435184352884,2460.7476220101184,5],[0,60,2611.324425669119,2901.60092591198,7],[0,61,1146.8047313377892,2183.217293416696,5],[0,62,1206.0245053317751,858.3430233546161,0],[0,63,2844.5135455266523,1430.537096121004,4],[0,64,2176.7320751248617,2875.2062555089547,7],[0,65,331.13792384532286,822.1520350157743,0],[0,66,716.4276279365484,916.2519737703108,0],[0,67,1819.585376666399,1213.4607493417168,3],[0,68,581.7292186396888,865.0294181210297,0],[0,69,491.49190012891205,2755.915442895636,5],[0,70,1753.9918371521073,670.8471107693867,1],[0,71,278.93493718070124,2763.5529730015196,5],[0,72,1032.2779885734178,2374.234734039547,5],[0,73,224.5888129502897,2812.1706878785053,5],[0,74,1051.4760567023548,861.5074370736858,0],[0,75,2687.7180154100774,863.6153272076048,1],[0,76,501.6366467344583,473.3062326843259,0],[0,77,481.89373662175916,1671.7646426364263,2],[0,78,231.99098917350898,727.2611462132086,0],[0,79,2094.3901077132364,1523.3118212040831,3],[0,80,380.507873511088,159.92352924136185,0],[0,81,2879.7926353043104,725.7707384332482,1],[0,82,2477.1728382512824,807.6432032323519,1],[0,83,109.57939221706118,2466.650493767757,5],[0,84,2189.8739648946835,761.6616159104008,1],[0,85,1111.1771669806349,2202.097545194106,5],[0,86,588.6509760543669,2853.9742901018485,5],[0,87,640.1255138935271,2662.2263005522636,5],[0,88,2906.7435704639342,495.02581775279685,1],[0,89,656.7089334408906,1290.9655153653591,2],[0,90,1283.1610122714974,1618.8372341003837,3],[0,91,1369.7467648925995,2497.0029334634437,6],[0,92,2399.8276785906482,816.9778843052542,1],[0,93,2726.866793700062,739.3433943348334,1],[0,94,2942.5814052608685,422.2615224448806,1],[0,95,591.4755619537289,1745.8341328001081,2],[0,96,424.5523302538464,2477.767009093011,5],[0,97,2572.363196170232,1535.150063328187,4],[0,98,1209.488848069575,816.0738541026967,0],[0,99,2766.553848275986,456.436505880151,1],[0,100,2642.0908485950745,873.7435255217702,1],[0,101,2293.140508540672,301.9070094119203,1],[0,102,2345.900548844373,929.2809271749785,1],[0,103,2693.500192483141,1817.8628134035469,4],[0,104,1647.5134809694753,1395.2489685571456,3],[0,105,980.9261382260689,2601.7106352655946,5],[0,106,1532.853945232179,1096.7482974829313,3],[0,107,777.5994532460276,1163.4700693486118,2],[0,108,1412.5472289359425,1634.1782601023885,3],[0,109,2883.136731454141,1792.278337159693,4],[0,110,1010.3440557621155,851.1709561200673,0],[0,111,1706.2610469253632,1726.7206230096954,3],[0,112,2911.4752894389903,251.50037682819573,1],[0,113,838.3020080480163,2346.266200139493,5],[0,114,2105.9945129485877,1271.7319816506872,3],[0,115,832.3472744621102,456.6924634336653,0],[0,116,467.90872546609944,1215.0864551795592,2],[0,117,1033.0931173302347,2760.1550770102635,5],[0,118,764.8008959255344,1322.8508673150836,2],[0,119,2667.323193619248,225.46423627350774,1],[0,120,710.2579901956204,760.5120501183517,0],[0,121,159.66720635400944,731.7512170780668,0],[0,122,2648.5613629865675,1684.9507566835189,4],[0,123,1384.0145603571611,2365.9870095278798,6],[0,124,1979.8672509239886,1605.2547917819475,3],[0,125,2729.7924652907673,1377.0685619863345,4],[0,126,817.4623582968807,1532.3714911097184,2],[0,127,2178.3836616022018,888.0812875703053,1],[0,128,1583.4009167006134,1539.051514324538,3],[0,129,1452.9400020723674,1786.1868721692533,3]],[[8,0,367,1327,2],[8,1,1357,347,1],[8,2,2387,1247,4],[7,0,1297,1277,3],[7,1,1317,2097,6],[7,2,640.3,2343.9,5],[7,3,307,287,0],[7,4,1987,2097,6],[7,5,1317,2457,6],[6,0,260,754,0],[6,1,378.3,2169.3,5],[6,2,2906.7,1140,4],[6,3,1655,2504,6],[6,4,1655,2056,6],[6,5,1613.1,1293.7,3],[6,6,345.7,2436.4,5],[6,7,3164.2,1275.1,4],[6,8,2914.8,1449.6,4],[6,9,1443.5,713.2,1],[5,1,816,208,0],[5,2,2066,2381.1,6],[5,3,604.4,2063.9,5],[5,4,3266,2012.3,7],[5,5,819,2054.7,5],[5,6,664.3,1567,2],[5,7,1908.3,2536,6],[5,8,1646.1,1546.5,3],[5,9,511,520.5,0],[5,10,1538,2268.7,6],[5,11,801.3,1216.7,2],[5,12,796.5,556,0],[5,13,2642.1,1507.5,4],[5,14,1238,1559.2,3],[5,15,1820.2,2338.4,6],[5,16,1839,1498.8,3],[5,17,1218.2,759.3,1],[4,0,3294,2210,7],[4,1,2750,1315,4],[4,2,633.3,180,0],[4,3,639.7,1161,2],[4,4,3103.3,1080,4],[4,5,2407,1995.7,7],[4,6,844,393.3,0],[4,7,1457.3,1481.5,3],[4,8,3294,2520.1,7],[4,9,207,516.8,0],[4,10,844,730.2,0],[4,11,209.6,2281.6,5],[4,12,505.7,814,0],[4,13,1815.2,1296.2,3],[4,14,220.8,1618.4,2],[4,15,828.7,2523.8,5],[4,16,475.4,1644.8,2],[4,17,834.7,1584,2],[4,18,3272.9,1521.5,4],[4,19,823.1,1414.7,2],[4,20,2087.4,2551.2,6],[4,21,2264.6,1538.7,4],[4,22,691.1,1346.3,2],[4,23,2687.4,1161.5,4],[4,24,3125,1541.7,4],[4,25,450.6,682,0],[4,26,201.7,2047,5],[4,27,691.3,852.3,2],[4,28,3268.6,1090.7,4],[4,29,3293.2,1705.4,4],[4,30,2468.9,1549.8,4],[4,31,1407.6,1616.7,3],[3,0,509.4,2573.9,5],[3,1,1755.2,1148,3],[3,2,2378,2576,7],[3,3,2612,1058,4],[3,4,1168,562.4,1],[3,5,862.2,2269.5,5],[3,6,539.3,265.6,0],[3,7,368.2,558.8,0],[3,8,443.3,1999.5,5],[3,9,1685.1,2277.6,6],[3,10,1882,1172.4,3],[3,11,684.7,2578.4,5],[3,12,231.2,2581.7,5],[3,13,507,164,0],[3,14,349.2,1671.9,2],[3,15,3103.8,1930.9,7],[3,16,1491.3,1149.8,3],[3,17,1763.7,1639.1,3],[3,18,3282.1,2369.8,7],[3,19,520.8,367.1,0],[3,20,871.3,2367.9,5],[3,21,653,605,0],[3,22,314,2002.1,5],[3,23,1549.3,560.8,1],[3,24,1773.7,2196,6],[3,25,1878.5,1641.4,3],[3,26,2357,2113.7,4],[3,27,1287.6,624.5,1],[3,28,2217,2675.8,6],[3,29,1509.9,2636.2,3],[3,30,2778.5,1569.4,4],[3,31,759.1,1680.3,2],[3,32,2508.3,1930.9,7],[3,33,929.1,1734.7,7],[3,34,1797,1746.1,4],[3,35,2850.9,1655.5,1],[3,36,82,2257.2,6],[3,37,3011.7,1627.5,3],[3,38,3392.9,2331.2,0],[3,39,3291.5,1403.1,4],[3,40,288.7,2689.2,2],[3,41,3404.3,1957.3,7],[3,42,449.5,2661.1,4],[3,43,229.1,1929.3,1],[3,44,3344.7,1197.4,6],[3,45,178.2,2165.7,5],[3,46,1531.4,1639,3],[3,47,2196.8,2310.2,5],[3,48,746,2678.9,2],[3,49,2658.4,1691.9,7],[3,50,2137.2,1550.3,4],[3,51,84.8,483.4,1],[3,52,1926.2,1726.3,6],[3,53,1104.2,2174.9,3],[3,54,1857.2,2674.5,0],[2,0,2298.1420304311396,2026.014063755047,7],[2,1,328.7639827416175,2606.5592528175407,5],[2,2,945.9001585005662,2416.436752586987,5],[2,3,3052.33832782395,980.2658134388173,4],[2,4,1729.203767449161,1803.759958826837,4],[2,5,3382.042796667127,1501.2799620257974,4],[2,6,2270.1364431899274,2137.2525475968796,4],[2,7,2328.2075074083336,1630.8850584492886,4],[2,8,459.14168497612025,914.7637003197937,0],[2,9,2270.2383703092137,2258.173028472466,5],[2,10,2548.1639381056784,1851.3269741765048,7],[2,11,2273.26830695047,2606.8443792506537,6],[2,12,1597.0289112786759,1700.5860861264596,3],[2,13,845.0251008073653,1703.4921765094205,2],[2,14,3425.677634031657,2413.9443454701695,0],[2,15,96.09209829540498,806.1363573602608,0],[2,16,683.6930945374585,81.09835176834127,0],[2,17,816.3925692724266,1915.7244578891632,5],[2,18,843.9838800333436,70.82528491635406,0],[2,19,567.4885591304579,906.2126561843975,0],[2,20,3334.1757640508204,2623.5741899361033,7],[2,21,94.74039962841596,2080.2211361688765,5],[2,22,130.86075676387674,2361.25005696547,5],[2,23,3219.185291416784,1621.341550613031,4],[2,24,3175.2979669727792,1876.2370260710286,7],[2,25,978.1371785807239,1808.9721691944042,7],[2,26,2451.2495563462753,2626.551978151936,7],[2,27,2749.3462221663826,1070.5465004374253,4],[2,28,140.34577270972682,1935.9096246570082,1],[2,29,2078.8412999274087,1483.1042997965094,4],[2,30,3227.241987329923,1797.1526052197648,4],[2,31,206.04999530647223,1728.4156232611574,2],[2,32,2712.6059818734657,1621.3116756883016,7],[2,33,2170.8758927145172,2473.841830515324,6],[2,34,2592.7238966513737,971.1125334717769,4],[2,35,1940.1268161540045,1105.0036110477827,3],[2,36,2301.7487062639348,1954.576221393402,7],[2,37,2838.4725699311857,1743.6280828220195,1],[2,38,891.918031580489,1326.3366675063303,2],[2,39,2576.566671264278,1654.4392697878002,7],[2,40,2132.4569984688746,2259.0161462170036,6],[2,41,3336.805381066042,1808.5628360509988,4],[2,42,1122.4948686319076,640.0484579317108,1],[2,43,596.2448123556304,2588.2325875942884,5],[2,44,407.96499442247904,866.6200407141798,0],[2,45,946.803684486193,2318.918435825207,5],[2,46,1426.9549084540108,883.3977084033004,1],[2,47,2171.2912520984864,1632.5118393563691,4],[2,48,1108.3066715788361,1506.477703359583,3],[2,49,1043.0858458992632,2239.5997694628923,3],[2,50,913.3907981785429,643.5633038017681,0],[2,51,931.4054018796926,323.2693229916386,0],[2,52,1923.5919066426518,1324.3991945695377,3],[2,53,1974.1638628939422,1466.3696104311462,3],[2,54,493.9375246095464,1755.2552406242023,2],[2,55,434.2007642968028,112.8016476727001,0],[2,56,112.71644380499562,1593.1226409559597,2],[2,57,96.22117518283376,2009.3407711816935,5],[2,58,1729.0797419406692,1062.9192611755518,3],[2,59,495.8868389328205,1927.6973233712447,5],[2,60,3025.9910208163205,1716.358126944177,3],[2,61,797.6794706679905,887.3343862569069,2],[2,62,703.7007909009757,1966.6356543925747,5],[2,63,2822.5749302847285,989.9767596490439,4],[2,64,926.9505531266207,1157.261472940741,2],[2,65,143.7442247560502,2565.192808340613,5],[2,66,3185.362683171885,1739.1655608470048,4],[2,67,142.94532596104457,1697.517948218391,2],[2,68,1178.805668823384,892.6007376991856,1],[2,69,3214.487875938712,992.6394165345944,4],[1,0,383.9516821625574,1601.9257050821582,2],[1,1,2647.137052393505,1320.3116861450492,4],[1,2,781.234221489251,1756.1358506187198,2],[1,3,1512.4621595777785,1979.0132216041657,6],[1,4,99.20107715045437,2165.2874607757567,5],[1,5,3382.234535876832,1757.186594995202,4],[1,6,927.8571606764915,1985.4820935779437,5],[1,7,938.2794341060774,163.86679260808833,0],[1,8,300.2298367904016,599.0623510647422,0],[1,9,3356.2328133861306,2105.8843971419583,7],[1,10,633.7940396176788,528.3701684342664,0],[1,11,3370.258958313659,1389.0633876826587,4],[1,12,2929.8248227562613,1658.9456280839297,1],[1,13,559.0968083293916,1096.8741433389685,2],[1,14,2632.588968476445,1766.5645207022055,7],[1,15,1946.365427367803,2330.231846592277,6],[1,16,1909.5579358182263,1257.4626801633945,3],[1,17,1921.874135486711,1398.6407384845004,3],[1,18,898.4441108999653,476.95318948360034,0],[1,19,1298.4388295365281,1674.296254866327,3],[1,20,1933.9939672067135,2399.1612790135086,6],[1,21,774.0185647605332,2611.086543293637,5],[1,22,1585.6442016248704,490.6565825736244,1],[1,23,1950.874052279352,1802.399876111041,6],[1,24,1723.7355762192162,1440.8766660966076,3],[1,25,3334.6099493157944,1276.7611421111753,6],[1,26,3351.5325847680538,2407.4844287793653,7],[1,27,409.4888341134541,1724.4857060544064,2],[1,28,1793.6305650434026,2627.596621237922,0],[1,29,2149.4043949626275,2718.5882481486633,6],[1,30,1493.8634480527728,1569.4873589344131,3],[1,31,427.7662199059583,2584.1088134730744,4],[1,32,1263.2474817292436,880.1789658702186,1],[1,33,368.1161536853806,2698.8475143855817,2],[1,34,1952.1792037783086,1612.8978083194563,3],[1,35,780.1755802074492,2178.767177076662,5],[1,36,2090.651702418544,1614.1298988896915,4],[1,37,2664.555536581843,1257.4826663415,4],[1,38,731.2635461501646,1754.2332931571832,2],[1,39,1587.2460062135633,1908.8490695714515,6],[1,40,938.9559500669205,427.71464146099,0],[1,41,3352.6708116507516,1896.1900424611683,7],[1,42,947.6107621326398,2064.7135839568823,5],[1,43,908.4175485946168,1657.41975541017,7],[1,44,1506.6223759875681,2557.268021810972,3],[1,45,3195.801940368405,2547.68878548595,7],[1,46,900.4424864481938,2200.3732162598335,5],[1,47,3362.9085026216203,1439.1669620752575,4],[1,48,3375.8894355415737,1645.6801770781603,4],[1,49,613.7500073352358,1061.3225307268553,2],[1,50,1213.726386327864,630.3775939539116,1],[1,51,2666.0531549442208,1379.7257992855439,4],[1,52,291.77901383562687,1726.157076477736,2],[1,53,2125.8278884663646,2645.6843764228593,6],[1,54,638.532937350205,939.5905327015055,2],[1,55,1217.2198578521338,1687.528429010545,3],[1,56,2368.6621212838595,1537.4158298425655,4],[1,57,1506.5758978106885,1071.271998968028,3],[1,58,1620.4810365865715,526.5325222629215,1],[1,59,3433.9338189454916,2031.6090625341608,7],[1,60,846.2308228643262,1095.777623424221,2],[1,61,1591.4180462116171,1133.1575044422243,3],[1,62,1488.027218909215,2712.1116687167037,3],[1,63,3291.6923601483995,1884.86412345809,7],[1,64,885.6731771981927,2608.405301724794,5],[1,65,3384.086751569602,2257.8369856035774,7],[1,66,2004.7652301682194,1734.576751090538,6],[1,67,632.7681314417875,1263.7664789622163,2],[1,68,759.1563077387112,784.995509701724,0],[1,69,384.5447342799136,480.4874871982834,0],[1,70,3096.676570288098,1444.7526775544836,4],[1,71,1787.640942026352,2714.016293523288,0],[1,72,2061.6501935682295,1573.391703014764,4],[1,73,575.0886558432394,1937.2475420541555,5],[1,74,692.4465784557036,1722.7066197242639,2],[1,75,3318.123622854333,2302.765981272972,0],[1,76,178.27255077656952,2640.3488287922373,5],[1,77,3399.708336031902,1877.4318798142583,7],[1,78,915.8316917722465,2139.9327605356334,5],[1,79,958.9646687756575,1660.4834145293637,7],[1,80,2377.9515993463892,2497.000014826731,7],[1,81,2259.417389108983,2359.9901855908793,5],[1,82,1334.8231843462847,831.9869931405303,1],[1,83,1480.2999788451941,1386.480140015432,3],[1,84,1171.6086813947225,1448.5962350828304,3],[1,85,678.8010333460664,1065.7103930574283,2],[1,86,941.8248498219222,705.0743406590321,0],[1,87,102.74223430440229,405.4379821440855,1],[1,88,1878.7167314336098,1376.0099293821934,3],[1,89,2061.395229621535,2649.8293664055655,6],[0,24,3059.927687799948,1674.0090327729001,3],[0,25,537.2118451134425,2512.9450882095143,5],[0,26,1533.3684654011224,2697.8865555183324,3],[0,27,46.044422734040445,2313.734913668207,6],[0,28,3186.0849393538483,1047.3250276789763,4],[0,29,3380.932389984202,2196.3339994279736,7],[0,30,2788.329652492047,1631.5427127425912,1],[0,31,3050.4877904811196,1388.0384575050964,4],[0,32,1799.8730488987512,2025.7378172832823,6],[0,33,408.9852445953518,756.0968769308652,0],[0,34,3053.7455531411497,1488.3726730199305,4],[0,35,2030.1511249223656,2484.3676253426124,6],[0,36,2264.589338559568,2722.962006482579,6],[0,37,1481.0601524432964,1683.2142482461006,3],[0,38,3289.7498885865516,2432.202693141523,7],[0,39,898.162995007548,2466.5733250609355,5],[0,40,1794.1243481081765,1202.5334312541718,3],[0,41,464.55769877817505,401.63698819054025,0],[0,42,2294.761976938616,2088.8921688692735,4],[0,43,3373.7521133846913,1137.0263740704352,6],[0,44,474.30582800247043,2509.64302699779,5],[0,45,134.00045783738813,2214.951303159718,6],[0,46,2568.2670313546437,1901.017644829913,7],[0,47,1566.9789639173841,1434.3301889021916,3],[0,48,1542.9394380435458,1704.998798243901,3],[0,49,2766.6033623513745,1465.0517503746948,4],[0,50,1507.996516439936,2038.854276882967,6],[0,51,924.6463895897014,1587.1059619729929,2],[0,52,713.226352258723,140.84928845327923,0],[0,53,286.16668053616985,557.4649319793359,0],[0,54,2186.7838373451477,2616.000472289361,6],[0,55,2311.31544200279,2582.4938220422723,7],[0,56,749.0017669168069,1463.999613121695,2],[0,57,829.0328689625734,2211.28538483554,5],[0,58,1861.7251241315487,1763.4106414137548,4],[0,59,1904.7797017123276,1788.7273243160969,6],[0,60,3170.7974831559522,1930.319267042532,7],[0,61,925.0465708802518,1801.577273511793,7],[0,62,233.50288619457268,2725.3839553884136,2],[0,63,3382.8968632880237,2524.3834212436336,7],[0,64,172.68322106626715,1893.1593434655329,1],[0,65,2132.5142003020055,1484.4665489193353,4],[0,66,491.11574929698406,2071.967545440588,5],[0,67,1608.1202544727828,2362.35975609979,6],[0,68,356.3038484104294,1951.4405052367533,5],[0,69,1576.798829348883,2639.8805749209955,3],[0,70,2639.671749265178,996.9813611049449,4],[0,71,144.7734801314616,453.16934524106796,0],[0,72,489.2064735293637,1556.8774130914985,2],[0,73,2803.5822902507552,1702.9345269195996,1],[0,74,2548.3311923032143,1587.6772450065969,4],[0,75,2626.429861250146,1633.0195259163527,7],[0,76,1482.8364690660555,569.261622527187,1],[0,77,1966.277340928054,1673.8614002462257,6],[0,78,3022.5444496605915,1561.3834520595722,3],[0,79,3404.1835237777505,1166.566407945525,6],[0,80,1611.711071288668,1657.2853852368937,3],[0,81,2934.6965714983985,1286.3461375791485,4],[0,82,685.1388191583694,1230.6849942966737,2],[0,83,3233.3358449270304,2146.2515859861383,7],[0,84,3383.184447299161,1707.0730942186522,4],[0,85,1501.1276762404627,2157.6620256823285,6],[0,86,2344.4042643735547,1578.0989769892033,4],[0,87,932.9561032525753,390.5050591925483,0],[0,88,3121.6370742466984,1630.6364420829718,4],[0,89,1334.2963032598013,1667.1734389973678,3],[0,90,607.8207626753604,885.9335685840277,2],[0,91,2320.7759966897224,2541.151564667186,7],[0,92,1678.9184073841566,2211.8901231721456,6],[0,93,1541.0208841970268,1104.8908286130122,3],[0,94,1615.0249215147307,573.8090234792037,1],[0,95,3387.038871058452,2021.0028525865462,7],[0,96,2980.487196038545,1686.7854186867546,3],[0,97,570.4885400239723,328.46570603769436,0],[0,98,2836.4958402045777,1294.036469111713,4],[0,99,2926.4610969751757,992.3162194202164,4],[0,100,1573.7001187568933,640.7505067257827,1],[0,101,185.73877615938264,2367.341716782602,5],[0,102,3208.3709376669462,1675.3329053000639,4],[0,103,374.37706518357066,634.1453846743037,0],[0,104,2201.3679989196107,1476.068426178407,4],[0,105,786.1203422020948,1508.2371011098544,2],[0,106,3156.338363802803,1458.399898234377,4],[0,107,1942.0182597057271,1199.8555732392515,3],[0,108,592.6767145418307,306.0960040586712,0],[0,109,2784.579656913992,1665.0190384469333,1],[0,110,818.0698061137277,2406.9198213582517,5],[0,111,1767.591864562065,1958.4086477476737,6],[0,112,2180.2849849942654,2406.158775007181,6],[0,113,3440.8356867254774,1902.3350694033206,7],[0,114,812.9017937412281,2675.273707925969,2],[0,115,718.9084723649166,643.5702851385907,0],[0,116,2681.482379916077,1072.6969495313233,4],[0,117,3246.985674856054,2444.5311358345293,7],[0,118,861.5355870557996,2440.0036741694425,5],[0,119,3283.7677482966737,2122.59690494565,7],[0,120,1522.7002142003025,1419.671107218756,3],[0,121,2955.696389197457,1590.7223494894347,3],[0,122,630.9429503336357,2616.69072487128,5],[0,123,1474.8956927649301,2579.071211504244,3],[0,124,3051.7939652878526,1173.8930853869538,4],[0,125,1833.756781464227,1127.360108067296,3],[0,126,1769.6310643681372,1082.572602212814,3],[0,127,525.6221867248977,2150.40465961781,5],[0,128,478.8784459473103,2720.2008199073493,4],[0,129,1517.3085829205788,2112.939210239174,6]],[[8,0,2727.5,500,2],[8,1,1407,2227,7],[8,2,347,1277,3],[7,0,1307,287,1],[7,1,638.2,2387.8,6],[7,2,1207,1167,4],[7,3,287,287,0],[7,4,1677,1167,4],[7,5,1207,1567,4],[6,0,240,704,0],[6,1,2230,1210,5],[6,2,2363.8,374.7,2],[6,3,259,2334.2,6],[6,4,2625,1210,5],[6,5,1764,2120,7],[6,6,436,2114.7,6],[6,7,3024,1950,8],[6,8,1300,2624,7],[6,9,2382.8,647.2,2],[5,1,683.3,2102.2,6],[5,2,796,208,0],[5,3,377.3,2612.8,6],[5,4,1545,440,1],[5,5,1796,2375,7],[5,6,1535,2656,7],[5,7,2168,2686,8],[5,8,2838.5,2686,8],[5,9,3056,2434,8],[5,10,796,475,0],[5,11,1756,1478.9,4],[5,12,2884.3,1263.7,5],[5,13,1531.9,1646,4],[5,14,1796,2596.6,7],[5,15,605.8,1549.1,3],[5,16,3056,2216.8,8],[5,17,2432,1349.4,5],[4,0,1633,2479.7,7],[4,1,1445,1066,4],[4,2,2141,1891,8],[4,3,1445,1266.7,4],[4,4,1545,181,1],[4,5,2716,1400,5],[4,6,1717,181,1],[4,7,547,2623.8,6],[4,8,2631.1,190.2,2],[4,9,613.3,180,0],[4,10,1445,1473,4],[4,11,1717.5,353.3,1],[4,12,845.1,2238.3,6],[4,13,1200,526.7,1],[4,14,690.8,2643.7,6],[4,15,1372.5,526.7,1],[4,16,3041.3,591.1,2],[4,17,2657.5,811.6,2],[4,18,3001.5,339.5,2],[4,19,1717.5,526.7,1],[4,20,3083,2671.8,8],[4,21,1712,1674,4],[4,22,485.8,490.5,0],[4,23,2840.7,1496.5,5],[4,24,2295.4,1496.1,5],[4,25,824,687.2,0],[4,26,3021.8,1496.1,5],[4,27,702.4,764,0],[4,28,715.3,1310.9,3],[4,29,2951.3,713.5,2],[4,30,2419.8,1592.2,5],[4,31,2945.1,190.2,2],[3,0,412.5,2467.6,6],[3,1,2814,810.2,2],[3,2,1218,2442.4,7],[3,3,649.2,1088,3],[3,4,2863.5,1868,8],[3,5,2965.7,1128,5],[3,6,158,475,0],[3,7,2420.6,1128,5],[3,8,158,1511,3],[3,9,881.2,2446.1,6],[3,10,3075.6,444.8,2],[3,11,2366.5,2736,8],[3,12,2148,1400,5],[3,13,2615,2736,8],[3,14,2148,1536,5],[3,15,435.6,786,0],[3,16,2693.1,1536,5],[3,17,2790.6,183.2,2],[3,18,832.2,2550.9,6],[3,19,2448.6,211.8,2],[3,20,2556.9,1536,5],[3,21,242.1,1619.9,3],[3,22,2525.7,815.8,2],[3,23,236.7,2549.4,6],[3,24,1865.8,266.9,1],[3,25,3096.4,1233,5],[3,26,2239,514.6,2],[3,27,254.4,2147.3,6],[3,28,364.9,1619.9,3],[3,29,1685.3,2707.3,7],[3,30,3096.4,1369,5],[3,31,2502.7,2736,8],[3,32,2278.7,1641,5],[3,33,1865.8,407.9,1],[3,34,3096.4,1641,5],[3,35,1865.8,548.9,1],[3,36,1278.6,689.9,1],[3,37,2960.1,1641,5],[3,38,1425.4,689.9,1],[3,39,2823.8,1641,5],[3,40,1572.2,689.9,1],[3,41,2687.6,1641,5],[3,42,1719,689.9,1],[3,43,2551.3,1641,5],[3,44,1865.8,689.9,1],[3,45,2992.9,2570.8,8],[3,46,1508.2,1367.6,4],[3,47,393.8,581.4,0],[3,48,240.2,2024.5,6],[3,49,487,164,0],[3,50,898.8,2073.6,6],[3,51,2382.5,834.5,2],[3,52,556.1,760,0],[3,53,737.2,1646,3],[3,54,648.6,493.4,0],[2,0,2605.5370287310548,1389.094406094293,5],[2,1,2710.0219693700874,2739.050877895274,8],[2,2,2595.297829686938,83.02162251239987,2],[2,3,1655.0954097161805,1383.3005038734277,4],[2,4,1646.1420875685071,2368.473719228135,7],[2,5,3112.533893326874,360.4874851441616,2],[2,6,793.6592164533265,2688.016831910773,6],[2,7,1737.7356263213912,1781.9753561598466,4],[2,8,642.8480988143549,1397.6163307260263,3],[2,9,560.3356670945876,1083.0877360335544,3],[2,10,253.14533664073784,1531.5880498545482,3],[2,11,2820.9890556220507,98.48574323999583,2],[2,12,1950.9198448849322,240.90746247929872,1],[2,13,1739.044416073862,776.6134440802457,1],[2,14,1426.0450191819266,779.8976885828461,1],[2,15,69.32894603098987,693.3985219376153,0],[2,16,2930.465400362186,1806.8487559586233,8],[2,17,3178.214569481781,2148.509451558924,8],[2,18,758.4539545091676,1985.2688958333413,6],[2,19,2977.163892718406,2676.3395209136165,8],[2,20,1644.5245409253803,611.6622408652722,1],[2,21,1520.5967846545357,290.30911709826813,1],[2,22,3185.392776016267,1639.866061325043,5],[2,23,3184.4738808084066,1387.5200302199169,5],[2,24,2997.4874496650295,1721.766197183877,5],[2,25,1823.4076937088637,768.1553024869145,1],[2,26,890.4227390095776,2619.5302605431643,6],[2,27,2189.377352528854,1614.796666793101,5],[2,28,203.6718080623058,1700.1762359879917,3],[2,29,868.351271012605,1988.907173249134,6],[2,30,2324.407530347657,1067.42293938485,5],[2,31,801.3458944871894,1584.3047471806917,3],[2,32,2562.536816154987,733.6839298580131,2],[2,33,859.7829156726426,331.5019824468278,0],[2,34,2038.1720301297912,1935.3892848824066,8],[2,35,2985.776765742599,85.84770856027296,2],[2,36,401.1832176017208,1701.1682479229507,3],[2,37,1381.5650579669125,974.9120857124348,4],[2,38,2666.8266546249733,82.99642660196508,2],[2,39,3125.3519551510476,1538.773089698257,5],[2,40,577.5435566245576,554.7426635334853,0],[2,41,2954.6492156621307,825.4499118108117,2],[2,42,2173.8369679449834,453.9800424497271,2],[2,43,1930.780779063649,629.0847194178862,1],[2,44,2834.73354128719,2825.9493257888894,8],[2,45,3142.8052365224253,1157.0555859638262,5],[2,46,2305.8284408724135,799.8970172775764,2],[2,47,2884.0254458364598,1707.8797104793348,5],[2,48,2095.320168002298,1315.3676556305147,5],[2,49,656.8251678459447,1684.2215430903495,3],[2,50,1483.7627365493026,2525.7128447079917,7],[2,51,774.5842720645844,70.6596687167376,0],[2,52,3153.2916983290365,2334.7260082586995,8],[2,53,3194.735260996475,2235.5757118703923,8],[2,54,614.5121815186578,831.7991988344306,0],[2,55,1132.2941912538809,2418.4101199008073,7],[2,56,848.8332912215394,2362.121454151371,6],[2,57,2937.0773655371668,1422.8465003588421,5],[2,58,160.95448778373424,855.633792402842,0],[2,59,2688.4517555117204,1730.995969423904,5],[2,60,169.3625708701373,2078.380039293524,6],[2,61,2550.249810822617,901.3471027479816,2],[2,62,1630.794834773913,2778.918342368956,7],[2,63,1189.604221212313,689.0331909246643,1],[2,64,1894.6413353083674,1468.9210148856278,4],[2,65,1909.5583248857922,2028.3660867558185,7],[2,66,1861.7417020336732,2719.070521407054,7],[2,67,1397.9869573040837,1367.25234366474,4],[2,68,1542.3675109616995,2795.8060076757406,7],[2,69,1425.002312918058,1734.8475351179266,4],[1,0,2040.7279511363308,2659.5080091717555,8],[1,1,2857.549559910872,1396.9154011364712,5],[1,2,958.9672161418027,2464.8685932758463,6],[1,3,1534.5745621567887,79.53419174038311,1],[1,4,1792.604334195903,284.28305291459134,1],[1,5,3014.3342966873292,792.4156349599607,2],[1,6,868.7318274125878,778.868225772786,0],[1,7,2293.276337903645,2765.6529140085563,8],[1,8,1660.471003948443,2631.250536128966,7],[1,9,2091.0229430274376,1481.2769246227394,5],[1,10,2984.034807100471,1050.129371078766,5],[1,11,433.5997295474222,1580.8955494832828,3],[1,12,1542.7930217864985,1439.7340616053111,4],[1,13,1150.363673908073,2683.4135499167533,7],[1,14,2392.49597407522,1225.5475396460197,5],[1,15,703.5726170634982,118.01011788256831,0],[1,16,2217.783458543919,1822.3465187041893,8],[1,17,1840.3840942617348,2253.875881111294,7],[1,18,3008.8881996121195,1226.5815340105396,5],[1,19,1826.4132054032905,198.41875868972136,1],[1,20,2533.109785412674,1459.6192060142803,5],[1,21,1291.5576601816665,587.1097477625378,1],[1,22,296.6996306037706,2496.484554925702,6],[1,23,2912.4229267104615,289.80819972902805,2],[1,24,123.87908363089417,2423.566313337706,6],[1,25,2820.748386728517,1151.4405128704402,5],[1,26,1519.6623202278108,750.2306904001181,1],[1,27,2249.9863173556582,260.82530727622986,2],[1,28,2205.4692248483047,1673.2064212647401,5],[1,29,2755.0728089978234,1602.0439578890478,5],[1,30,1913.943813630282,2651.2740964840327,7],[1,31,898.3759474225949,553.4867211018914,0],[1,32,2430.2740228610023,1479.3885418139448,5],[1,33,1502.0794399596562,1771.5059130036518,4],[1,34,1102.6307571118093,496.3152910268912,1],[1,35,2325.8726208008075,1704.3698970078317,5],[1,36,2800.9167824354904,1717.6574089954474,5],[1,37,855.4539529382062,2136.8268722343037,6],[1,38,1805.032827598293,474.3358510749239,1],[1,39,190.13595552603647,2193.247062885983,6],[1,40,2833.785198628815,887.7148109409959,2],[1,41,108.31971034844068,1572.4236828929784,3],[1,42,2951.1984056581464,1561.4967823407562,5],[1,43,2290.140902795143,2715.7444260989914,8],[1,44,1942.5837749973994,571.3555538152311,1],[1,45,1353.7787930912114,665.6276068475147,1],[1,46,2616.516882654456,1687.3331222435418,5],[1,47,900.6242225313998,2152.5789352432403,6],[1,48,3060.1090812638,254.8006753662504,2],[1,49,1144.6670171806718,2581.660131690683,7],[1,50,1812.2685380255243,1692.7141732979044,4],[1,51,1599.9100941214222,1536.3841840900898,4],[1,52,612.7039311968813,1159.1901465226615,3],[1,53,3084.660362656998,2773.786485358832,8],[1,54,78.11201560453351,470.767985204456,0],[1,55,1875.4241899635067,188.4884258062221,1],[1,56,1617.893779711862,548.6681788027796,1],[1,57,521.3241502326842,235.1537259094991,0],[1,58,1408.9035292401886,1603.90643540123,4],[1,59,2526.812307846741,222.92811310539915,2],[1,60,97.28898826739226,2324.527943113463,6],[1,61,612.490924971654,1994.371085076265,6],[1,62,378.7713874087391,1963.1451059817618,6],[1,63,334.39378386586014,529.3240796084806,0],[1,64,1627.729705691599,242.3579318114732,1],[1,65,634.9319374851519,1248.0909677863967,3],[1,66,525.0043814754517,2723.4001644864234,6],[1,67,727.1184267238477,658.6524824277569,0],[1,68,1944.1255037197986,424.1823667517906,1],[1,69,701.6483994665738,1209.8176879821413,3],[1,70,2040.8684197202645,1866.861511425052,8],[1,71,573.5744764243198,87.14052134198643,0],[1,72,232.4417342713133,504.29894535097094,0],[1,73,2635.7544648624953,2812.2250102543217,8],[1,74,910.1962623295805,412.877430269236,0],[1,75,2632.002497532468,1586.0808864960468,5],[1,76,159.05746786800933,2530.122105816952,6],[1,77,2377.9304102827527,176.48981606963844,2],[1,78,315.92931622595177,1998.7110360047209,6],[1,79,1919.7979911061793,350.2353058059182,1],[1,80,2436.9737109766143,893.0885211661491,2],[1,81,433.67031714786253,649.6008637080855,0],[1,82,2237.626289078288,719.0929319002861,2],[1,83,2891.8799510595627,823.4556864386609,2],[1,84,3045.6952701020114,752.1462544416448,2],[1,85,802.3683764190973,346.1572905369315,0],[1,86,798.3323221826739,2041.6395768404686,6],[1,87,2707.878067459733,899.138850340992,2],[1,88,1230.3578835304334,624.0776098882728,1],[1,89,3023.0891405227717,2754.3511291061473,8],[0,24,812.2909475696018,598.9735975391596,0],[0,25,2432.3701393688943,2731.861795132856,8],[0,26,2486.7732401868398,1138.4929635077426,5],[0,27,3081.356375744394,1298.2892745346135,5],[0,28,1843.520313837297,1402.7672562833768,4],[0,29,1817.1673213451045,1980.8086355373064,7],[0,30,583.836188967077,2704.819103811273,6],[0,31,1725.2520180264019,624.1967864515171,1],[0,32,544.2613215854932,129.21291834196583,0],[0,33,378.14475457091794,759.8303392837698,0],[0,34,3061.5790032966192,2093.1496367834466,8],[0,35,1723.0444933269798,2466.4685412919816,7],[0,36,2767.3617122526775,1259.900413348223,5],[0,37,2667.103526816706,2776.5120043105844,8],[0,38,923.8432458465209,2497.7773991573995,6],[0,39,2996.0378955128785,1187.7378614937768,5],[0,40,2118.693994279224,1459.1367739117875,5],[0,41,2382.6909393648775,223.84141711742342,2],[0,42,368.65172191951314,783.3678787912025,0],[0,43,2488.3518856757246,761.383841035765,2],[0,44,807.2549745410862,2488.7168374489193,6],[0,45,2430.360966531075,508.00655548190093,2],[0,46,2344.4190802988187,1634.9170332339042,5],[0,47,1669.5119020368372,2235.2085037803363,7],[0,48,260.42435775012575,2607.4070185723112,6],[0,49,731.0111396110797,378.9143713901531,0],[0,50,2470.5006722905173,1238.9160725119793,5],[0,51,1802.8331766597944,153.93220022815808,1],[0,52,2229.6750253130513,1883.40132342248,8],[0,53,672.4041941811948,246.54092147086334,0],[0,54,2759.1584321341284,1477.8354015581847,5],[0,55,2760.9725617016247,1533.7496386878963,5],[0,56,2579.3780341538727,1472.8831402826681,5],[0,57,1486.811460832304,716.6886632447831,1],[0,58,2818.7563584167124,744.3716090534505,2],[0,59,3140.5517724364786,1419.39465240199,5],[0,60,498.2735876323452,809.6858905952627,0],[0,61,1805.8154275648967,717.4290949683757,1],[0,62,1506.6755681478821,703.8838775186691,1],[0,63,2342.852173091524,227.1798707029697,2],[0,64,2512.3601116811406,1587.7113042220515,5],[0,65,918.532203150591,2009.5715675748359,6],[0,66,110.20671441829076,1464.0446823745683,3],[0,67,1423.1315938560601,2706.113400821463,7],[0,68,2360.5104613001968,1442.0188202067452,5],[0,69,2457.079536791864,1071.8017491780124,5],[0,70,1148.5655455258307,455.2962403444706,1],[0,71,3110.0914449590787,2585.974283515783,8],[0,72,3086.468185793243,513.2550580182174,2],[0,73,2928.11835341556,1486.3989363870796,5],[0,74,2481.530669008304,1657.6929347623638,5],[0,75,187.41829380684885,2145.7344216869246,6],[0,76,2089.056127000758,1429.6920837235987,5],[0,77,613.2812594211512,725.0814723819716,0],[0,78,2227.174640197569,448.65183197735485,2],[0,79,1931.4138690103541,682.7711716606381,1],[0,80,1638.781888458658,697.3734282146045,1],[0,81,1454.0104817789704,513.5520738926164,1],[0,82,622.8388283208852,554.164809172079,0],[0,83,1598.7320495889553,2396.479163819232,7],[0,84,3086.89121284213,311.0686657128068,2],[0,85,779.3427636600273,2634.69006085234,6],[0,86,1534.3678691606863,1483.6481905354126,4],[0,87,698.497647660388,1399.3176507031008,3],[0,88,2260.103862437693,1577.8017911259153,5],[0,89,2858.5049845493104,210.75001944268823,2],[0,90,106.62624565884343,431.9914268442384,0],[0,91,1177.8584344239873,2390.010547692244,7],[0,92,899.4711412592059,2381.6394275771136,6],[0,93,2755.6959893948933,1512.1097904639912,5],[0,94,3115.613496344574,1704.1414408943685,5],[0,95,3101.446388458962,1435.8096846536582,5],[0,96,173.2012823223459,2024.9145232804087,6],[0,97,1801.3028899902558,675.8956149584864,1],[0,98,477.6087895238259,1971.627610510057,6],[0,99,715.617256533402,1589.4629801609958,3],[0,100,1853.5212818905254,1541.7140078201408,4],[0,101,2250.165159320605,2769.2939769360282,8],[0,102,1778.3510115344748,2712.2612000895015,7],[0,103,1367.3287258943049,1308.0663290466773,4],[0,104,1363.5964304345212,1434.6143404120985,4],[0,105,759.2227095063919,1232.3455883503855,3],[0,106,714.6347988505041,1079.3810035738454,3],[0,107,3033.747470510612,198.11365731316067,2],[0,108,193.12059058542457,532.0573756575868,0],[0,109,2590.6272367204624,2797.3348873816494,8],[0,110,2442.2957071104747,2707.011702352217,8],[0,111,1412.5258584813437,624.1485248822689,1],[0,112,3098.1584348099113,1575.023429105331,5],[0,113,3127.1822673895417,2057.491486622677,8],[0,114,303.8856949498233,2045.3118297791916,6],[0,115,2781.181483241456,1316.8278787598174,5],[0,116,1365.0257350936897,1026.9472542233545,4],[0,117,1428.0747289034603,444.1810260703183,1],[0,118,3110.1880432072494,1485.6810836459147,5],[0,119,575.3261167365472,499.7235796778759,0],[0,120,146.54144110980178,1577.012888348866,3],[0,121,2838.293569477181,1928.9970151753205,8],[0,122,2465.696397834716,785.9911468320167,2],[0,123,2353.628032177055,1129.9379179349098,5],[0,124,3099.057463777243,1167.053522563577,5],[0,125,2333.97777491343,1603.1401584707469,5],[0,126,932.7468471250033,2131.3634103067993,6],[0,127,273.4669828189774,2664.5175457952664,6],[0,128,2550.824300701639,2782.6160024238266,8],[0,129,2476.036429495227,1213.2946414781497,5]]];
function makeZenCity(spec,index){
 const city=ZEN_CITY_PLANS[index],level=make(spec,index+12),objects=[];
 const counts=[130,90,70,55,32,18,10,6,3,1],values=[1,3,7,18,42,80,130,220,400,800];
 const lateRadii=[128,175,235,430];
 const districts=city.districts.map(([name,x,y,w,h,form],i)=>({name,x,y,w,h,form,id:i}));
 function template(band,n){
  let entry;
  if(band<6){let choices=CATALOG[band];let choice=(n+index)%choices.length;
   if(band===1&&index===1)choice=n%5===0?0:1;
   if(band===2&&index===0)choice=n%4===0?0:1;
   entry={...choices[choice]};
  }else{const base=band===6?CATALOG[4][0]:band===7?CATALOG[4][1]:CATALOG[5][0],radius=lateRadii[band-6],scale=radius/base.radius;
   entry={...base,radius,w:base.w*scale,d:base.d*scale,height:Math.min(450,base.height*scale)};}
  return entry;
 }
 function allowed(o,ignoreRoad=false){
  if(o.x-o.radius<34||o.y-o.radius<34||o.x+o.radius>city.bounds.w-34||o.y+o.radius>city.bounds.h-34)return false;
  if(objects.some(p=>Math.hypot(p.x-o.x,p.y-o.y)<p.radius+o.radius+5))return false;
  if(!ignoreRoad&&o.radius>35&&city.roads.some(([x,y,w,h])=>o.x+o.radius>x&&o.x-o.radius<x+w&&o.y+o.radius>y&&o.y-o.radius<y+h))return false;
  if(index===2&&o.x+o.radius>1700&&o.y-o.radius<820)return false;
  return true;
 }
 function add(band,n,x,y,di,extra={}){
  const entry=template(band,n),d=districts[di];
  const o={...entry,id:`${spec.id}-city${di}-b${band}-${n}`,x,y,tier:Math.min(5,band),growthBand:band,value:values[band],target:band>=5,
   color:level.theme.building[(n+di+index)%4],visualVariant:`${spec.sceneId}-${entry.kind}`,sceneId:spec.sceneId,zone:di,neighbourhood:d.name,streetDressing:band<3,...extra};
  if(o.target&&!o.label)o.label=city.labels[(n+band)%city.labels.length];
  if(!allowed(o,!!extra.signature))return false;
  objects.push(o);return true;
 }
 // A human-scale signature introduces the familiar theme before the final city-scale landmark.
 if(!add(5,0,...city.hero,0,{signature:true,label:city.labels[1]}))throw Error('Zen hero placement');
 if(!add(9,0,...city.final,districts.length-1,{label:city.labels[0],cityFinale:true}))throw Error('Zen finale placement');
 // Twenty-four entrance props in three deliberately different walks; the rest of the city is finite.
 for(let n=0;n<24;n++){
  const row=Math.floor(n/8),col=n%8,x=city.spawn.x-99+col*28+(index===0?row*8:index===3?row*13:0),y=city.spawn.y+row*32+(index===1?Math.sin(col*.8)*12:index===2?col*5:0);
  if(!add(0,n,x,y,0))throw Error('Zen entrance placement '+index+' '+n);
 }
 // Buildings form staggered streetfronts, courtyards or concentric garden walks inside authored districts.
 if(ZEN_CITY_PLACEMENTS[index]){for(const [b,n,x,y,di] of ZEN_CITY_PLACEMENTS[index])if(!add(b,n,x,y,di))throw Error("Invalid frozen Zen placement");}
 else for(let band=8;band>=0;band--){const start=band===5?1:band===0?24:0;
  for(let n=start;n<counts[band];n++){
   let placed=false;
   // Small props deliberately line existing facades instead of scattering uniformly over terrain.
   if(band<3){const parents=objects.filter(o=>o.growthBand>=3&&o.growthBand<=6);
    for(let j=0;j<parents.length&&!placed;j++){const p=parents[(n*7+j*11)%parents.length],r=template(band,n).radius;
     const a=(n*.93+j*.71+index*.37),distance=p.radius+r+12;
     placed=add(band,n,p.x+Math.cos(a)*distance,p.y+Math.sin(a)*distance,p.zone);
    }
   }
   for(let trial=0;trial<32000&&!placed;trial++){
    const di=(n*5+Math.floor(trial/90)+band+index)%districts.length,d=districts[di],r=template(band,n).radius;
    if(d.w<2*r+25||d.h<2*r+25)continue;
    const k=trial%90,columns=Math.max(2,Math.floor((d.w-2*r)/(2*r+35))+1),rows=Math.max(2,Math.floor((d.h-2*r)/(2*r+43))+1);
    let u=((k*7+n*3)%columns)/(columns-1),v=(Math.floor(k/columns)%rows)/(rows-1);
    // Successive sweeps offset the frontage pitch without any random or replenishing objects.
    const sweep=Math.floor(trial/(90*districts.length));u=(u+sweep*.137)%1;v=(v+sweep*.193)%1;
    let x=d.x+r+12+u*(d.w-2*r-24),y=d.y+r+12+v*(d.h-2*r-24);
    if(trial>1800){x=d.x+r+12+((trial*.61803398875+n*.17)%1)*(d.w-2*r-24);y=d.y+r+12+((trial*.754877666+n*.23)%1)*(d.h-2*r-24);}
    else if(d.form==='arc'){const a=(k*2.399963+sweep*.31+n*.28),ring=.28+((k+n)%5)*.175;x=d.x+d.w/2+Math.cos(a)*(d.w/2-r-14)*ring;y=d.y+d.h/2+Math.sin(a)*(d.h/2-r-14)*ring;}
    else if(d.form==='court'&&k%3!==0){const edge=k%4;if(edge===0)x=d.x+r+18;if(edge===1)x=d.x+d.w-r-18;if(edge===2)y=d.y+r+18;if(edge===3)y=d.y+d.h-r-18;}
    if(trial>12000){x=r+36+((trial*.61803398875+n*.17)%1)*(city.bounds.w-2*r-72);y=r+36+((trial*.754877666+n*.23)%1)*(city.bounds.h-2*r-72);}
    placed=add(band,n,Math.round(x*10)/10,Math.round(y*10)/10,di);
   }
   if(!placed)throw Error(`Zen capacity ${spec.id} band ${band} object ${n}`);
  }
 }
 const terrain=city.terrain.map(([type,x,y,w,h,color])=>({type,x,y,w,h,...(color?{color}: {})}));
 if(index===2)terrain[0].points=[[1700,90],[3360,90],[3360,820],[3120,810],[2910,740],[2680,785],[2410,720],[2210,770],[1980,690],[1800,540],[1700,330]];
 level.bounds=city.bounds;level.spawn=city.spawn;level.objects=objects;level.time=null;level.layoutVersion=7;level.recordVersion='city-v07';
 level.roads=city.roads.map(([x,y,w,h])=>({x,y,w,h}));level.sceneTerrain=terrain;level.water=terrain.filter(t=>t.type==='pond').map(t=>({...t}));
 level.goals={targets:objects.filter(o=>o.target).length};
 level.design={...level.design,maxTier:5,cityScale:true,areaBaseline:{metric:'median campaign bounds area',value:2138150,ratio:city.bounds.w*city.bounds.h/2138150},
  plan:districts.map(d=>`${d.name}:${d.x},${d.y},${d.w},${d.h}:${d.form}`),neighbourhoods:districts,
  zones:districts.map(d=>({x:d.x+d.w/2,y:d.y+d.h/2,tier:0,formation:d.form})),
  openingRoutes:[city.spawn,{x:city.spawn.x-95,y:city.spawn.y+32},{x:city.spawn.x+95,y:city.spawn.y+64}],
  milestones:['从入口街景长大','吞下完整街区','继续吞噬大型场馆','成长到城市级并清空全部物件'],
  pressure:'无倒计时；大于六级后仍持续成长，全部有限物件吞下后结算。',
  detour:'每个城区都有独立的小物、街景和建筑补给；大型场馆按真实半径逐步可吞。'};
 return level;
}

// Deliberate architectural palettes: preserve one city identity while giving its
// neighbourhoods ordinary buildings, working streets and only a few monuments.
const ZEN_ARCHITECTURE=[
 [['bellmarket','canalbookstreet'],['bellmarket','canalbookstreet'],['transithub','bellmarket'],['festivalfair','bellmarket'],['festivalfair','bellmarket'],['oldtheatre','bellmarket'],['oldtheatre','festivalfair'],['canalbookstreet','oldtheatre'],['oldtheatre','canalbookstreet']],
 [['botanicalglasshouse','fourseasongarden'],['lotustea','fourseasongarden'],['windmillorchard','botanicalglasshouse'],['fourseasongarden','lotustea'],['botanicalglasshouse','lotustea'],['windmillorchard','fourseasongarden'],['lotustea','fourseasongarden'],['botanicalglasshouse','fourseasongarden']],
 [['lighthousebay','fishingharbor'],['fishingharbor','lighthousebay'],['fishingharbor','shipyard'],['shipyard','containerterminal'],['transithub','lighthousebay'],['lighthousebay','lotustea'],['containerterminal','lighthousebay'],['observatorycampus','lighthousebay']],
 [['sculpturepark','observatorycampus'],['observatorycampus','canalbookstreet'],['sculpturepark','observatorycampus'],['observatorycampus','financeplaza'],['observatorycampus','sculpturepark'],['observatorycampus','canalbookstreet'],['sculpturepark','lotustea'],['sculpturepark','observatorycampus'],['observatorycampus','financeplaza']]
];
function curateZenArchitecture(level,index){
 const objects=level.objects,plans=ZEN_ARCHITECTURE[index],large=objects.filter(o=>o.growthBand>=3),hero=objects.find(o=>o.signature),finale=objects.find(o=>o.cityFinale);
 hero.label=['旋转木马','四季花亭','白昼灯塔','云帆雕塑门'][index];
 const monuments=new Set([hero.id,finale.id]);
 // One civic anchor per neighbourhood at most; everyday streets remain lower.
 for(let zone=0;zone<plans.length;zone++){
  const anchor=large.filter(o=>o.zone===zone&&!o.signature&&!o.cityFinale).sort((a,b)=>b.radius-a.radius)[0];if(anchor)monuments.add(anchor.id);
 }
 // Only three reproductions of each defining monument in an entire city.
 const identityAnchors=new Set([hero.id]);
 for(const zone of(index===0?[3,4]:index===1?[1,6]:index===2?[0,4]:[2,7])){
  const o=large.filter(o=>o.zone===zone&&!o.signature&&!o.cityFinale).sort((a,b)=>b.radius-a.radius)[0];if(o){identityAnchors.add(o.id);monuments.add(o.id);}
 }
 for(const o of objects){
  if(o.growthBand<2)continue; // familiar themed props and seasonal foliage
  const n=Number(o.id.split('-').at(-1)),palette=plans[o.zone];
  let scene=palette[n%4===0?1:0];
  if(o.signature||identityAnchors.has(o.id))scene=level.sceneId;
  if(o.cityFinale)scene=['oldtheatre','botanicalglasshouse','observatorycampus','observatorycampus'][index];
  if(o.growthBand>=3){
   const isMonument=monuments.has(o.id);
   if(!isMonument&&(o.kind==='tower'||o.kind==='landmark')){
    o.kind=n%3===0?'warehouse':'house';
    // Low wings and long facades contrast with true landmark vertical massing.
    o.height=Math.min(o.height*.63,o.radius*(n%2?.83:1.06));
    o.w*=n%2?.96:.88;o.d*=n%2?.78:.95;
   }
   if(isMonument&&!o.signature&&!o.cityFinale)o.kind='landmark';
   // A lighthouse is a navigational exception, not the town's ordinary roof.
   if(index===2&&!identityAnchors.has(o.id)&&scene==='lighthousebay'&&isMonument)scene='fishingharbor';
   if(index===0&&!identityAnchors.has(o.id)&&scene==='festivalfair'&&isMonument)scene='oldtheatre';
   if(index===1&&!identityAnchors.has(o.id)&&scene==='fourseasongarden'&&isMonument)scene='botanicalglasshouse';
   if(index===3&&!identityAnchors.has(o.id)&&scene==='sculpturepark'&&isMonument)scene='observatorycampus';
  }
  o.visualScene=scene;o.visualVariant=`${level.sceneId}-${o.kind}`;
  o.architectureRole=o.growthBand<3?'streetfront':monuments.has(o.id)?'district-anchor':'neighbourhood-building';
 }
 // Distinct ground stitching, without new obstacles or resource changes.
 if(index===0){
  // Parade axis across the city, shorter service lanes rather than nine equal cells.
  level.roads=level.roads.flatMap((r,i)=>i===0?[{...r,h:1600}]:i===1?[{...r,y:1030,h:1820}]:i===3?[{...r,w:1800}]:[r]);
  level.sceneTerrain.push({type:'path',x:1930,y:1850,w:1050,h:48},{type:'gardenbed',x:990,y:2040,w:72,h:660,color:'#b6bd95'},{type:'plaza',x:950,y:1670,w:140,h:145});
 }else if(index===1){level.sceneTerrain.push({type:'path',x:1425,y:2110,w:48,h:760},{type:'pond',x:1660,y:260,w:170,h:300},{type:'path',x:240,y:1700,w:530,h:48});}
 else if(index===2){level.sceneTerrain.push({type:'dock',x:2220,y:860,w:990,h:62},{type:'gardenbed',x:120,y:1845,w:790,h:48,color:'#9cac91'});}
 else{level.sceneTerrain.push({type:'path',x:2270,y:980,w:780,h:44},{type:'gardenbed',x:950,y:1980,w:60,h:700,color:'#a9b698'},{type:'court',x:1400,y:1870,w:340,h:70});}
 level.water=level.sceneTerrain.filter(t=>t.type==='pond').map(t=>({...t}));
 level.design.architecture='Curated per-neighbourhood visualScene palettes; three identity monuments, varied low streetfront buildings and distinct civic anchors.';
 return level;
}

root.HC_LEVELS=SPECS.slice(0,12).map(make);
root.HC_ZEN_LEVELS=SPECS.slice(12).map(makeZenCity).map(curateZenArchitecture);
root.HC_LEVEL_THEMES=THEMES;
if(typeof module!=='undefined'&&module.exports)module.exports={levels:root.HC_LEVELS,zenLevels:root.HC_ZEN_LEVELS,themes:THEMES};
})(typeof window!=='undefined'?window:globalThis);
