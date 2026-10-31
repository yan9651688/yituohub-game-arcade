/* 七剑江湖 · 九境山河。每一站都是独立区域，地理连接沿用原作地点关系的游戏改编。 */
(function(global){
  'use strict';
  const TAU=Math.PI*2,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const hash=(a,b=0)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n);};
  function random(seed){let x=seed>>>0;return()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296;};}
  const KEYS=['arrival','main','side1','side2','workshop','waterside','lookout','shrine','camp','ruins','herb','cache'];
  const defs={
    forest:{name:'西海峰林',biome:'forest',width:2688,height:2208,seed:3171,layout:'峰林岔路',description:'穿过守林古道，在石峰、松涛与溪涧之间寻找失散的讯息。',
      anchors:[
        ['arrival','雾岭山口',432,1872,'山风吹动旧路牌，守林古道在前方岔成两路。'],['main','长虹守林台',1392,1104,'旧亭背靠青峰，林间的求援都往这里汇聚。'],
        ['side1','灵鸽溪坪',1008,1584,'溪畔石坪落着几根鸽羽，草叶间藏着细碎的声响。'],['side2','麒麟旧径',2016,1200,'一条被灌木遮住的古径，通往林海深处。'],
        ['workshop','护林木作棚',912,1152,'木匠留下了绳索、木楔，与修补栈道的工具。'],['waterside','听泉渡',1728,1680,'溪水绕过石滩，两岸以旧木桥相连。'],
        ['lookout','云海听松',1584,384,'狭长石台探向群峰，松声自云海一阵阵传来。'],['shrine','守山祠',2064,672,'祠前石灯守望的，是这条长久未断的林间道路。'],
        ['camp','歇脚松棚',576,1488,'采药人与樵夫在松棚里避雨，炉火还留着一丝余温。'],['ruins','白猫旧关',480,528,'旧关的石梁早已倾倒，刻痕却还留在岩面上。'],
        ['herb','鹿踪草坡',2232,1872,'坡上药草沾着清露，兽径在草丛中若隐若现。'],['cache','白猫遗刻',816,720,'石碑旁的旧匣里，留着守林人的刻记。']],
      routes:[['arrival','camp','workshop','main'],['arrival','side1','waterside','herb'],['side1','main','side2','waterside'],['camp','cache','ruins'],['cache','lookout','shrine','side2'],['main','lookout']],
      hills:[[1584,384,106,650],[480,528,58,520],[2064,672,56,490]],
      rivers:[{width:55,points:[[1950,-120],[1860,480],[1790,1020],[1830,1390],[1580,1740],[1710,2350]]}],
      exits:{yuchan:'north',inn:'east'}},
    yuchan:{name:'玉蟾宫',biome:'palace',width:2496,height:2112,seed:5284,layout:'宫苑中轴与侧廊',description:'宫门、中庭与月台沿中轴铺开，荷池和曲廊连接两侧的庭院。',
      anchors:[
        ['arrival','玉蟾前门',1248,1872,'白石宫门朝着避难的山民敞开。'],['main','冰月正庭',1248,912,'冰魄剑主候在正殿前的月纹石庭，等同伴归来。'],
        ['side1','西苑灯廊',672,1152,'一盏盏荷灯沿西苑回廊次第排开。'],['side2','东苑剑坪',1872,1104,'清风掠过练剑坪，剑穗轻轻碰着石栏。'],
        ['workshop','织月工房',624,672,'弟子们在这里补衣甲、修灯架、换弓弦。'],['waterside','荷心石桥',1248,1440,'石桥隔开两片荷池，水声自栏下穿过。'],
        ['lookout','邀月台',1248,384,'高台上望得见宫墙外的山影，与来时的道路。'],['shrine','冰魄静祠',624,336,'祠堂安静明亮，历代守宫人的誓言都刻在石壁上。'],
        ['camp','南苑安置院',384,1632,'避难的山民在侧院暂歇，药炉与热茶一同冒着白气。'],['ruins','旧水阁',2208,384,'旧水阁一角受了损，坍下的瓦还没清理。'],
        ['herb','玉露青莲',1872,576,'宫苑药莲在露水里舒展开花瓣。'],['cache','东门备物院',2112,1632,'几口旧木箱叠得整整齐齐，留给守门弟子取用。']],
      routes:[['arrival','waterside','main','lookout'],['arrival','camp','side1','workshop','shrine','lookout'],['waterside','side1','main','side2','cache','arrival'],['side2','herb','ruins','lookout'],['main','workshop'],['cache','herb']],
      hills:[[1248,384,48,650]],ponds:[[816,1470,232,154],[1680,1490,220,145],[1760,340,180,90]],
      exits:{forest:'south',liuqige:'east'}},
    inn:{name:'金鞭溪客栈',biome:'inn',width:2784,height:2112,seed:8815,layout:'两岸街市与溪畔码头',description:'客栈、货棚和码头分居溪流两岸，三座桥把夜行人的灯火连起来。',
      anchors:[
        ['arrival','溪西驿口',384,1776,'驿道在客栈灯火前收窄，来往的客人放慢了脚步。'],['main','紫云客栈前院',960,1056,'客栈招牌迎着溪风，前院里聚着赶路的人。'],
        ['side1','东岸茶棚',2064,1104,'茶棚正对石桥，最容易听见南来北往的消息。'],['side2','溪东货栈',2064,624,'货栈边车辙还新，卸下的货物尚未入库。'],
        ['workshop','木轮修造铺',672,624,'修车师傅把木轮、铆钉同工具一并排在棚前。'],['waterside','金鞭小码头',1776,1536,'竹筏小舟停在木栈下，缆绳被溪水扯得笔直。'],
        ['lookout','金鞭听溪',1584,288,'高处的临溪亭上，望得见两岸灯火。'],['shrine','渡客小祠',2400,288,'过桥的人偶尔停一停，替远行者留一盏灯。'],
        ['camp','后院歇脚棚',768,1680,'伙计为迟到的旅客支起一间棚子。'],['ruins','旧驿站',288,384,'荒废的驿站还剩半面墙、几级石阶。'],
        ['herb','溪湾药滩',1776,1872,'浅滩的草药夹在卵石与芦叶之间。'],['cache','溪畔旧酒坛',2352,1776,'货棚后头的旧箱与酒坛里，有掌柜留下的补给。']],
      routes:[['arrival','camp','main','workshop','ruins'],['workshop','lookout','shrine','side2','side1'],['main','side1','waterside','cache'],['camp','waterside','herb','cache'],['main','lookout']],
      hills:[[288,384,39,540],[1584,288,50,580]],
      rivers:[{width:71,points:[[1320,-150],[1360,390],[1300,810],[1470,1210],[1450,1640],[1520,2310]]}],
      exits:{forest:'west',liuqige:'north',leizhuang:'east'}},
    liuqige:{name:'六奇阁',biome:'temple',width:2496,height:2304,seed:9417,layout:'沿山阶梯与问医小院',description:'山阶绕着药圃向上，从山脚歇棚一路通向云中的六奇阁。',
      anchors:[
        ['arrival','问医山门',384,2016,'求医的人沿山阶而来，山门里飘着草药香。'],['main','六奇阁前庭',1488,768,'小观立在高台上，问诊声与药香自门内透出。'],
        ['side1','半山候诊坪',1104,1344,'伤者在避风的石坪上歇着，挑药人来回奔走。'],['side2','雨花丹房',1584,1104,'丹房窗棂透出暖光，几口药炉正轻轻作响。'],
        ['workshop','百味药工坊',1968,1392,'药柜、晒架与磨盘沿石墙一字排开。'],['waterside','洗药溪桥',1008,1824,'清溪流过山脚的洗药台，木桥连着两岸草坡。'],
        ['lookout','听云高台',1920,336,'登上高台，药圃与层层山阶都显得细小。'],['shrine','六奇问心亭',1008,528,'小亭替求医与赶路的人留出一方清静。'],
        ['camp','山脚义诊棚',480,1632,'弟子们在棚下熬药，照看那些一时走不上山的人。'],['ruins','残卷旧阁',384,672,'旧阁的石阶隐在青苔里，还留着不少旧时痕迹。'],
        ['herb','云阶药圃',1584,1776,'药圃沿坡分成数层，每层都留着窄窄的田埂。'],['cache','药车转运坪',2208,2016,'运药的车在转运坪上歇脚，木箱盖得密不透风。']],
      routes:[['arrival','camp','waterside','herb','workshop','side2','main','lookout'],['camp','side1','side2'],['side1','shrine','main'],['camp','ruins','shrine'],['herb','cache','workshop']],
      hills:[[1488,768,152,700],[1920,336,88,510],[1008,528,70,470]],
      rivers:[{width:42,points:[[650,1100],[790,1510],[1060,1630],[1320,2080],[1290,2440]]}],
      exits:{yuchan:'west',inn:'south',waterfall:'east',tianzi:'north'}},
    leizhuang:{name:'快活林·奔雷旧庄',biome:'village',width:2784,height:2208,seed:11461,layout:'村巷、田埂与旧庄院',description:'横街连着茶棚与铁作坊，粮田和旧庄散布在林间。',
      anchors:[
        ['arrival','快活林村口',432,1872,'老树下的村口仍挂着一盏灯。'],['main','奔雷旧庄正院',1392,1104,'旧庄石阶宽厚结实，院里响着熟悉的脚步。'],
        ['side1','大树茶棚',816,1008,'村民把茶壶摆在树荫里，等赶路的人坐下来歇一阵。'],['side2','东田粮道',2064,1440,'田埂连着粮仓，木车碾过的痕迹还留在土里。'],
        ['workshop','奔雷铁作坊',2016,720,'铁砧旁摆着新修的农具，与旧庄换下的门轴。'],['waterside','下湾水车坪',2352,1872,'溪水绕过村边，粮车自石桥旁驶过。'],
        ['lookout','林海望楼',2112,288,'木楼上望得见田地、村巷，与更远处的林海。'],['shrine','奔雷古碑',1152,384,'旧庄留下的碑面上，侠义二字仍清晰可辨。'],
        ['camp','乡亲安置院',1104,1728,'几间屋舍腾出了空地，热饭在炉上温着。'],['ruins','旧庄西园',384,432,'西园的门梁与围墙俱已残坏，藤蔓爬过断石。'],
        ['herb','村西桑药圃',384,1296,'村民种下桑树与药草，窄田埂一直伸到林边。'],['cache','旧庄粮仓',2496,960,'粮仓门口搁着刚卸下的粮袋与箱笼。']],
      routes:[['arrival','camp','main','side1','herb','arrival'],['side1','ruins','shrine','main'],['main','workshop','lookout','shrine'],['main','side2','waterside','camp'],['workshop','cache','side2']],
      hills:[[2112,288,51,570],[384,432,28,480]],
      rivers:[{width:45,points:[[2540,-120],[2450,560],[2610,1240],[2230,1640],[2180,2350]]}],
      exits:{inn:'west',waterfall:'north',gallery:'east'}},
    waterfall:{name:'天悬白练',biome:'waterfall',width:2688,height:2304,seed:14471,layout:'飞瀑、峡谷与多桥栈道',description:'木栈沿崖伸展，多座桥把瀑布两侧的平台连成可行走的山路。',
      anchors:[
        ['arrival','雾峡入口',480,2016,'湿润的山风扑面而来，瀑声越过林梢。'],['main','青光会合台',1296,1296,'会合台嵌在岩间，水声足以盖住低声的交谈。'],
        ['side1','东崖行脚坪',2160,1776,'挑担的行脚人在栏边暂放货物。'],['side2','水帘暗哨',1968,672,'水幕后的石径隐约可见，旧日哨火早熄了。'],
        ['workshop','栈道修缮台',768,1536,'绳索、木梁与新削的桥板堆在一处。'],['waterside','下潭闸台',1920,1296,'深潭旁有一道旧水闸，栈桥自闸前穿过。'],
        ['lookout','水帘观瀑台',672,528,'白练自高崖落下，水雾在观瀑台外翻涌。'],['shrine','听瀑石祠',1200,336,'石祠檐角常年挂着水珠。'],
        ['camp','避雨岩棚',1296,1968,'岩棚替赶路的人挡住飞沫，火盆旁还有几块干地。'],['ruins','西崖断栈',336,960,'旧栈道尽头留着折断的栏木与半截石梁。'],
        ['herb','东涧湿草坡',2304,2112,'湿润的坡地上长着耐水的山草。'],['cache','青光藏锋处',2352,336,'青苔后藏着一份不落款的行路补给。']],
      routes:[['arrival','workshop','main','waterside','side1','herb'],['arrival','camp','side1'],['workshop','ruins','lookout','shrine'],['main','lookout'],['main','side2','cache','shrine'],['side2','waterside']],
      hills:[[672,528,137,610],[1200,336,110,500],[1968,672,94,570],[336,960,55,420]],
      rivers:[{width:84,points:[[1630,-100],[1620,550],[1550,960],[1720,1420],[1610,1840],[1810,2450]]},{width:48,points:[[340,330],[560,810],[1010,1050],[1560,960]]}],
      exits:{liuqige:'west',leizhuang:'south',gallery:'east',baicao:'north'}},
    gallery:{name:'十里画廊',biome:'bamboo',width:2784,height:2112,seed:18467,layout:'竹林曲水与回廊',description:'溪流绕着竹海拐弯，亭、桥、石堰与回廊在青峰之间交替出现。',
      anchors:[
        ['arrival','画廊南口',384,1824,'竹影自山门一直铺到远处的溪边。'],['main','灵泉石堰',1536,1152,'石堰压着上游水势，水声顺着竹林传开。'],
        ['side1','摆渡竹棚',768,1440,'渡客在竹棚里候着，岸边竹篙摆得整整齐齐。'],['side2','护粮回廊',1968,1440,'回廊沿溪而建，运粮的人在此歇脚。'],
        ['workshop','竹作工坊',2352,816,'竹匠把竹条、绳索与新做的船篙靠在廊边。'],['waterside','听竹灵泉',1104,624,'一泓清泉自竹根间涌出，沿石槽流入溪中。'],
        ['lookout','画廊望峰台',2256,336,'奇峰随溪而转，一水一峰连成青绿长卷。'],['shrine','竹影小祠',1392,288,'小祠隐在竹叶间，石灯下落着薄薄一层叶子。'],
        ['camp','山民渡宿',624,672,'准备渡河的山民聚在棚下，包袱搁在脚边。'],['ruins','旧灵泉院',288,288,'一段残墙、一道旧石槽，说明这里曾有一座小院。'],
        ['herb','清湾草洲',2448,1776,'草洲露出水面，药草在湿泥里长得极密。'],['cache','护粮歇坪',1392,1776,'粮车沿溪停靠，盖着油布的补给箱搁在车旁。']],
      routes:[['arrival','side1','camp','ruins','waterside','shrine','lookout'],['side1','main','waterside'],['main','workshop','lookout'],['main','side2','herb'],['arrival','cache','side2','workshop']],
      hills:[[2256,336,86,540],[288,288,52,450],[1392,288,38,420]],
      rivers:[{width:58,points:[[-120,450],[440,540],[810,960],[1300,980],[1640,1420],[2220,1250],[2900,1550]]}],
      exits:{leizhuang:'west',waterfall:'west',baicao:'north',tianzi:'north'}},
    baicao:{name:'百草谷',biome:'garden',width:2592,height:2208,seed:22469,layout:'药圃、琴舍与环谷小径',description:'缓坡上的药圃围着竹舍铺开，水渠和窄田埂通往谷里的每一处安静角落。',
      anchors:[
        ['arrival','百草谷口',336,1872,'谷口竹牌上写着辨药与护草的规矩。'],['main','竹舍琴庭',1488,912,'琴舍前有一方平整的庭院，落满竹影。'],
        ['side1','采药人石坪',912,1440,'采药人把新摘的草药摊开，请同伴一味味辨认。'],['side2','东畦药农棚',1968,1248,'药农在棚下整理药篓，田间小路一直通到溪边。'],
        ['workshop','晾药竹工房',1920,576,'药架一列列排开，竹筛里留着山草的清香。'],['waterside','引泉渠台',2256,1776,'清水由石渠引向药田，几处闸板管着水流。'],
        ['lookout','望谷风台',1968,288,'自高台望去，药田像一层层浅绿的纹路。'],['shrine','竹舍听琴',768,336,'静亭背靠竹林，风过叶隙，像一段极轻的琴声。'],
        ['camp','药农歇棚',624,1872,'空药篓挂在棚柱上，赶路的人在此歇脚。'],['ruins','旧药师院',288,768,'旧院墙角长满青苔，石磨仍在原处。'],
        ['herb','百草试香田',1296,1776,'药田依着缓坡铺开，风里带着新鲜的草木气味。'],['cache','竹谷备药仓',2304,768,'药仓外搁着绑好的竹篓与干燥的补给箱。']],
      routes:[['arrival','camp','side1','main','workshop','lookout'],['side1','ruins','shrine','main'],['camp','herb','side2','main'],['herb','waterside','side2','cache','workshop']],
      hills:[[1968,288,72,610],[768,336,42,510],[1296,1776,22,410]],
      rivers:[{width:37,points:[[2420,-90],[2260,520],[2340,1140],[2110,1570],[2280,2360]]}],ponds:[[1020,540,150,112]],
      exits:{waterfall:'west',gallery:'south',tianzi:'north'}},
    tianzi:{name:'天子山',biome:'summit',width:2592,height:2208,seed:25471,layout:'山脊台地与七剑峰顶',description:'沿着山脊登临石坛，群峰、云台与旧关分列两侧，来路逐渐沉入脚下。',
      anchors:[
        ['arrival','天子下关',432,2016,'山关之外，便是通向峰顶的最后一段路。'],['main','七剑合璧坛',1392,768,'七道旧剑痕汇向石坛中央，等同伴再度相逢。'],
        ['side1','七灯山门',960,1632,'七座石灯立在山门两侧，照着登峰人的脚下。'],['side2','旧约石坪',1968,1344,'石坪前望得见走过的山路，风把远处的声音送来。'],
        ['workshop','问天机关台',1488,1536,'古老的机关与石槽嵌在山台之上。'],['waterside','天池引流台',2256,1824,'峰间的小天池积着雨水，石渠自池边流出。'],
        ['lookout','天门观星台',2016,288,'登临峰顶，群山与来时的道路尽在脚下。'],['shrine','七剑问天石',1200,288,'剑痕在石上交汇，历代守护者的誓言未曾褪色。'],
        ['camp','登峰避风营',816,2016,'山民在背风处支起几顶棚子，守着最后一盏营火。'],['ruins','残云旧关',288,1008,'断折的石柱指向天空，旧关仍挡着呼啸的山风。'],
        ['herb','云顶寒草坪',624,576,'寒草贴着岩缝生长，在峰顶薄土里扎根。'],['cache','东峰守关匣',2256,768,'守关人留下的补给箱靠石壁搁着。']],
      routes:[['arrival','camp','side1','workshop','main','shrine','lookout'],['side1','ruins','herb','shrine'],['workshop','side2','cache','lookout'],['side2','waterside'],['main','cache']],
      hills:[[1392,768,138,760],[2016,288,131,530],[1200,288,96,560],[624,576,79,550]],ponds:[[2210,1580,149,116]],
      exits:{liuqige:'west',gallery:'south',baicao:'east'}}
  };
  const specs={};
  for(const [id,d] of Object.entries(defs)){
    specs[id]={...d,id,anchors:Object.fromEntries(d.anchors.map(a=>[a[0],{x:a[2],y:a[3],name:a[1],description:a[4]}]))};
  }
  const discoveryKinds={forest:[['viewpoint','云海听松','lookout'],['cache','白猫遗刻','cache']],yuchan:[['shrine','冰月水榭','shrine'],['herb','玉露青莲','herb']],inn:[['cache','溪畔旧酒坛','cache'],['viewpoint','金鞭听溪','lookout']],liuqige:[['herb','云阶药圃','herb'],['shrine','六奇问心亭','shrine']],leizhuang:[['cache','旧庄粮仓','cache'],['shrine','奔雷古碑','shrine']],waterfall:[['viewpoint','水帘观瀑台','lookout'],['cache','青光藏锋处','cache']],gallery:[['viewpoint','画廊望峰台','lookout'],['herb','听竹灵泉','waterside']],baicao:[['herb','百草试香田','herb'],['shrine','竹舍听琴','shrine']],tianzi:[['viewpoint','天门观星台','lookout'],['shrine','七剑问天石','shrine']]};
  const discoveryIds=Object.fromEntries(Object.keys(specs).map(id=>[id,[id+'-wild-1',id+'-wild-2']]));

  const eventVisuals={
    'forest-homeward':{anchor:'camp',kind:'redcord',role:'camp'},'forest-sluice':{anchor:'waterside',kind:'board',role:'sluice'},'forest-watch':{anchor:'lookout',kind:'flag'},
    'yuchan-scroll':{anchor:'shrine',kind:'scroll',role:'shrine'},'yuchan-water':{anchor:'waterside',kind:'board',role:'sluice'},'yuchan-courier':{anchor:'arrival',kind:'lantern'},
    'inn-hidden-map':{anchor:'ruins',kind:'windchime'},'inn-warm-meal':{anchor:'cache',kind:'table'},'inn-mill':{anchor:'waterside',kind:'flag',role:'sluice'},
    'liuqige-herbal-note':{anchor:'workshop',kind:'medicine'},'liuqige-rain-shelter':{anchor:'camp',kind:'cloth',role:'camp'},'liuqige-missing-porter':{anchor:'arrival',kind:'basket'},
    'leizhuang-mortise':{anchor:'arrival',kind:'bench'},'leizhuang-fair-scale':{anchor:'main',kind:'board'},'leizhuang-patrol':{anchor:'arrival',kind:'board'},
    'waterfall-echo':{anchor:'camp',kind:'flag',role:'brazier'},'waterfall-rope':{anchor:'waterside',kind:'rope',role:'bridge'},'waterfall-watermark':{anchor:'ruins',kind:'remove-board'},
    'gallery-painted-road':{anchor:'arrival',kind:'map'},'gallery-two-shores':{anchor:'camp',kind:'cloth',role:'brazier'},'gallery-false-flags':{anchor:'lookout',kind:'board'},
    'baicao-wind-song':{anchor:'lookout',kind:'windharp'},'baicao-irrigation':{anchor:'herb',kind:'board',role:'sluice'},'baicao-returning-cub':{anchor:'camp',kind:'remove-fence'},
    'tianzi-weather':{anchor:'camp',kind:'board',role:'brazier'},'tianzi-old-platform':{anchor:'shrine',kind:'stone',role:'shrine'},'tianzi-homeward-book':{anchor:'main',kind:'plaque'}
  };

  function segmentCross(a,b,c,d){
    const ax=b.x-a.x,ay=b.y-a.y,bx=d.x-c.x,by=d.y-c.y,den=ax*by-ay*bx;if(Math.abs(den)<.0001)return null;
    const cx=c.x-a.x,cy=c.y-a.y,t=(cx*by-cy*bx)/den,u=(cx*ay-cy*ax)/den;if(t<0||t>1||u<0||u>1)return null;
    return{x:a.x+ax*t,y:a.y+ay*t,angle:Math.atan2(ay,ax),riverAngle:Math.atan2(by,bx)};
  }
  function densify(points,step=104){
    const out=[points[0]];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],n=Math.max(1,Math.ceil(distance(a,b)/step));for(let j=1;j<=n;j++)out.push({x:a.x+(b.x-a.x)*j/n,y:a.y+(b.y-a.y)*j/n});}return out;
  }
  function routePoints(a,b,spec,index){
    if(spec.id==='yuchan')return densify([a,b]);
    if(spec.id==='leizhuang'&&Math.abs(a.x-b.x)>260&&Math.abs(a.y-b.y)>230){
      const turn=index%2?{x:a.x,y:b.y}:{x:b.x,y:a.y};return densify([a,turn,b]);
    }
    if(spec.id==='liuqige'&&Math.abs(a.y-b.y)>440){const dy=b.y-a.y;return densify([a,{x:a.x+(index%2?136:-136),y:a.y+dy*.37},{x:b.x-(index%2?94:-94),y:a.y+dy*.72},b]);}
    return global.JianghuScene.makePath(a,b,index,spec.id==='gallery'?118:126).points;
  }
  function create(id,data){
    const J=global.JianghuScene,spec=specs[id]||specs.forest;if(!J||!J.createTerrain)throw new Error('九境山河需要 JianghuScene.createTerrain');
    id=spec.id;const source=(data&&data.locations||[]).find(l=>l.id===id)||{id,name:spec.name,biome:spec.biome,connections:Object.keys(spec.exits)};
    const W=spec.width,H=spec.height,rand=random(spec.seed),anchors={};
    for(const key of KEYS)anchors[key]={...spec.anchors[key],id:key};
    const paths=[],seen=new Set();
    function addRoute(from,to,width=126){
      const aa=typeof from==='string'?anchors[from]:from,bb=typeof to==='string'?anchors[to]:to;if(!aa||!bb)return;
      const aid=aa.id||from,bid=bb.id||to,k=[aid,bid].sort().join('|');if(seen.has(k))return;seen.add(k);
      paths.push({from:aid,to:bid,points:routePoints(aa,bb,spec,paths.length),width});
    }
    if(id==='tianzi')anchors.tower={id:'tower',name:'锁妖塔',description:'山门西侧的古塔，封印着层层异物。',x:560,y:1340};
    for(const chain of spec.routes)for(let i=1;i<chain.length;i++)addRoute(chain[i-1],chain[i],id==='yuchan'&&['arrival','waterside','main','lookout'].includes(chain[i])?146:126);
    if(id==='tianzi')addRoute('side1','tower',112);
    const exits=[],entryFrom={},groups={north:[],east:[],south:[],west:[]},connections=source.connections||Object.keys(spec.exits);
    for(const dest of connections)(groups[spec.exits[dest]||'east']).push(dest);
    const targetNames=Object.fromEntries((data&&data.locations||[]).map(l=>[l.id,l.name]));
    for(const [side,list] of Object.entries(groups))for(let i=0;i<list.length;i++){
      const dest=list[i],t=list.length===1?.5:(i+1)/(list.length+1),along=Math.round((.18+t*.64)*(side==='north'||side==='south'?W:H)/48)*48;
      const p=side==='north'?{x:along,y:144}:side==='south'?{x:along,y:H-144}:side==='west'?{x:144,y:along}:{x:W-144,y:along};
      const normal=side==='north'?{x:0,y:1}:side==='south'?{x:0,y:-1}:side==='west'?{x:1,y:0}:{x:-1,y:0};
      const ex={id:'exit-'+dest,to:dest,...p,label:'前往'+(targetNames[dest]||specs[dest]?.name||dest),name:targetNames[dest]||dest,side,normal};
      const spawn={x:p.x+normal.x*112,y:p.y+normal.y*112};ex.spawn=spawn;entryFrom[dest]=spawn;exits.push(ex);
      let near=KEYS.map(key=>anchors[key]).sort((a,b)=>distance(a,spawn)-distance(b,spawn))[0];
      addRoute(near,{...spawn,id:'entry-'+dest},142);addRoute({...spawn,id:'entry-'+dest},ex,142);
    }
    const baseHeight=(x,y)=>{
      let z=id==='summit'?25:12;z+=Math.sin(x/540)*3+Math.cos(y/480)*3;
      for(const [cx,cy,raise,r]of spec.hills||[])z+=raise*Math.exp(-((x-cx)**2+(y-cy)**2)/(r*r));
      if(id==='liuqige')z+=Math.max(0,1-y/H)*21;
      return z;
    };
    const plateauKeys=id==='yuchan'?['main','lookout']:id==='tianzi'?['main','lookout']:id==='liuqige'?['main']:id==='leizhuang'?['main']:[];
    const heightAt=(x,y)=>{
      let z=baseHeight(x,y);if(id==='tianzi'){const d=Math.max(Math.abs(x-580)/190,Math.abs(y-1240)/230),w=clamp((1.3-d)/.3,0,1);z=z*(1-w)+baseHeight(580,1240)*w;}for(const key of plateauKeys){const p=anchors[key],rx=key==='main'?215:140,ry=key==='main'?172:126,d=Math.max(Math.abs(x-p.x)/rx,Math.abs(y-p.y)/ry);if(d<1.35){const w=clamp((1.35-d)/.35,0,1);z=z*(1-w)+baseHeight(p.x,p.y)*w;}}
      return z;
    };
    const loc={...source,x:anchors.main.x,y:anchors.main.y,px:source.x,py:source.y,biome:spec.biome};
    const reservedPoints=[...Object.values(anchors).map(p=>({...p,radius:93})),...exits.map(p=>({...p,radius:104})),...Object.values(entryFrom).map(p=>({...p,radius:85}))];
    if(id==='tianzi')reservedPoints.push({x:560,y:1190,radius:215});
    const scene=J.createTerrain({width:W,height:H,biome:spec.biome,seed:spec.seed,locations:[loc],paths,heightAt,reservedPoints,spawn:{...anchors.arrival}});
    scene.id=id;scene.name=spec.name;scene.description=spec.description;scene.layout=spec.layout;scene.anchors=anchors;scene.exits=exits;scene.entryFrom=entryFrom;scene.landmarks=Object.entries(anchors).map(([key,a])=>({id:key,...a}));scene.spec=spec;
    scene.region=true;scene.connections=connections.slice();scene.extent={width:W,height:H};
    const A=(p,collision=false)=>scene.addProp({regionId:id,biome:spec.biome,...p},collision);
    for(const river of spec.rivers||[])scene.rivers.push({id:id+'-water-'+scene.rivers.length,width:river.width,color:J.palettes[spec.biome].water,points:river.points.map(p=>({x:p[0],y:p[1]}))});
    for(const p of spec.ponds||[])scene.ponds.push({x:p[0],y:p[1],rx:p[2],ry:p[3],biome:spec.biome,lotus:['palace','garden'].includes(spec.biome)});
    for(const path of paths)for(const river of scene.rivers)for(let i=1;i<path.points.length;i++)for(let j=1;j<river.points.length;j++){
      const p=segmentCross(path.points[i-1],path.points[i],river.points[j-1],river.points[j]);if(!p||scene.props.some(q=>q.type==='bridge'&&distance(q,p)<125))continue;
      const cross=Math.max(.42,Math.abs(Math.sin(p.angle-p.riverAngle))),length=Math.min(620,(river.width+17)*2/cross+52);
      A({type:'bridge',...p,length,w:path.width+30,stone:['yuchan','liuqige','tianzi'].includes(id),anchor:'waterside',effectRole:'bridge'});
    }
    for(const pond of scene.ponds)for(const path of paths){
      const inside=path.points.filter(p=>((p.x-pond.x)/pond.rx)**2+((p.y-pond.y)/pond.ry)**2<1);if(!inside.length)continue;
      const a=inside[0],b=inside[inside.length-1],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};if(scene.props.some(q=>q.type==='bridge'&&distance(q,mid)<130))continue;
      const i=path.points.indexOf(a),before=path.points[Math.max(0,i-1)],after=path.points[Math.min(path.points.length-1,i+inside.length)],length=Math.min(650,distance(before,after)+64);
      A({type:'bridge',...mid,length,w:path.width+30,angle:Math.atan2(after.y-before.y,after.x-before.x),stone:true,anchor:'waterside',effectRole:'bridge'});
    }
    function clear(x,y,r=0){
      if(x<90+r||y<90+r||x>W-90-r||y>H-90-r||scene.isReserved(x,y,r)||scene.isWater(x,y,r+14))return false;
      for(const c of scene.colliders){const rr=c.kind==='rect'?Math.hypot(c.w/2,c.d/2):Math.max(c.rx,c.ry);if(distance({x,y},c)<r+rr+18)return false;}
      return true;
    }
    function place(key,dx,dy,p,collision=true){
      const a=typeof key==='string'?anchors[key]:key,ak=typeof key==='string'?key:a.id||'landscape',r=p.type==='building'?Math.hypot((p.w||160)/2,(p.d||110)/2)+7:p.type==='pillar'||p.type==='waterfall'?(p.w||120)*.52:p.type==='wall'?Math.hypot((p.w||100)/2,(p.d||30)/2):p.type==='bamboo'?30:p.type==='field'?10:32;
      const want={x:a.x+dx,y:a.y+dy},points=[want];for(const d of [64,120,184,240,320])for(let k=0;k<20;k++){const t=k/20*TAU;points.push({x:want.x+Math.cos(t)*d,y:want.y+Math.sin(t)*d});}
      let chosen=points.find(q=>clear(q.x,q.y,r));
      if(!chosen){let best=-Infinity;for(const q of points){const margin=Math.min(q.x-r-80,q.y-r-80,W-q.x-r-80,H-q.y-r-80,scene.pathDistance(q.x,q.y)-r,...reservedPoints.map(a=>distance(q,a)-(a.radius||90)-r));const score=margin-distance(q,want)*.035-(scene.isWater(q.x,q.y,r)?800:0);if(score>best){best=score;chosen=q;}}}
      const prop=A({...p,...chosen,anchor:ak},collision);return prop;
    }
    function landmark(key,type,opts={}){
      const a=anchors[key];return place(key,opts.dx??-140,opts.dy??-145,{type,w:opts.w||128,d:opts.d||96,h:opts.h||96,...opts},opts.collision!==false);
    }
    function grove(key,type,count,inner=125,outer=360){
      const a=typeof key==='string'?anchors[key]:key;let left=count;
      for(let i=0;i<count*12&&left>0;i++){
        const t=rand()*TAU,r=inner+Math.sqrt(rand())*(outer-inner),x=a.x+Math.cos(t)*r,y=a.y+Math.sin(t)*r;
        if(!clear(x,y,type==='bamboo'?28:22))continue;
        A({type,x,y,s:.82+rand()*.42,w:51+rand()*28,h:117+rand()*38,count:4+Math.floor(rand()*3)},!['bamboo'].includes(type));left--;
      }
    }
    function lamps(key,offset=128,wood=false){const a=anchors[key];for(const d of [-1,1])place(key,d*offset,-58,{type:'lantern',wood,h:wood?92:77,w:29,d:29,effectRole:'lantern'},false);}
    function fieldRows(key,count=5,flowers=true,dx=-180,dy=-170){
      const a=anchors[key];for(let i=0;i<count;i++){const q={x:a.x+dx+(i%2)*151,y:a.y+dy+Math.floor(i/2)*86};if(scene.pathDistance(q.x,q.y)<46||scene.isWater(q.x,q.y,23))continue;A({type:'field',...q,w:138,d:66,flowers,anchor:key,effectRole:'field'});}}
    function ridge(key,offsets){for(const [dx,dy,w,h]of offsets)landmark(key,'pillar',{dx,dy,w,d:w*.73,h});}
    function courtyard(key,w,d,color){const a=anchors[key];scene.surfaces.push({type:'court',x:a.x,y:a.y,w,d,z:heightAt(a.x,a.y)+.8,biome:spec.biome,color});}

    // 地区主地标：各自有建筑比例、道路组织与背景轮廓。
    if(id==='forest'){
      landmark('main','building',{dx:-170,dy:-190,w:176,d:134,h:119,open:true,roofH:49,sign:'长虹守林'});
      landmark('workshop','building',{w:160,d:112,h:81,open:true,roofH:30,sign:'护林木作'});
      ridge('lookout',[[-230,-210,148,390],[190,-210,124,361],[315,52,126,340]]);
      ridge('ruins',[[-230,-125,136,371],[160,-170,112,305]]);ridge('side2',[[228,-246,147,383]]);
      grove('arrival','pine',22,120,340);grove('main','pine',26,175,425);grove('ruins','tree',21,155,330);grove('side2','pine',29,180,420);grove('herb','tree',19,150,325);
      landmark('side1','building',{w:99,d:89,h:92,open:true,roofH:33});
    }else if(id==='yuchan'){
      const hall=landmark('main','building',{dx:-220,dy:-250,w:308,d:194,h:171,floors:2,roofH:58,sign:'玉蟾宫',lanterns:true});
      courtyard('main',410,328,'#d6d4b8');courtyard('lookout',256,218,'#d9d8bd');
      landmark('side1','building',{dx:-157,dy:-135,w:201,d:112,h:119,roofH:44,lanterns:true});
      landmark('side2','building',{dx:169,dy:-151,w:193,d:112,h:113,roofH:43});
      landmark('workshop','building',{w:156,d:123,h:101,roofH:40});
      landmark('lookout','building',{w:157,d:129,h:126,open:true,roofH:47});
      for(const side of [-1,1]){
        place('waterside',side*245,-64,{type:'building',w:179,d:58,h:88,roofH:22,open:true},false);
        for(let i=0;i<3;i++)place('main',side*350,-185+i*105,{type:'wall',w:105,d:25,h:58,collisionBox:true},true);
      }
      for(const key of ['arrival','main','waterside','lookout','side1','side2'])lamps(key,152,false);
      grove('herb','blossom',25,145,325);grove('camp','blossom',21,120,300);grove('ruins','tree',12,140,295);grove('lookout','blossom',13,205,390);
      A({type:'stair',x:hall.x,y:hall.y+hall.d*.5+35,z:hall.z-15,w:210,d:70,h:15,steps:5,anchor:'main'});
    }else if(id==='inn'){
      landmark('main','building',{dx:-185,dy:-210,w:267,d:177,h:151,floors:2,roofH:51,sign:'金鞭溪',lanterns:true});
      landmark('side1','building',{w:172,d:123,h:97,open:true,roofH:36,lanterns:true});
      landmark('side2','building',{w:194,d:142,h:106,roofH:39,sign:'溪东货栈'});
      landmark('workshop','building',{w:170,d:118,h:83,open:true,roofH:32});
      for(const key of ['main','side1','side2','camp','workshop'])lamps(key,125,true);
      for(let i=0;i<4;i++){const river=scene.rivers[0],t=(i+.5)/4,j=Math.min(river.points.length-2,Math.floor(t*(river.points.length-1))),aa=river.points[j],bb=river.points[j+1],tt=t*(river.points.length-1)-j;A({type:'boat',x:aa.x+(bb.x-aa.x)*tt,y:aa.y+(bb.y-aa.y)*tt,w:107+i*7,d:39,h:68,canopy:i===1,anchor:'waterside'});}
      for(const key of ['cache','side2','workshop'])place(key,126,55,{type:'cart',w:85,d:90,h:67},true);
      grove('ruins','goldtree',20,140,340);grove('camp','goldtree',20,160,360);grove('shrine','tree',16,140,340);grove('lookout','goldtree',19,145,340);
    }else if(id==='liuqige'){
      const hall=landmark('main','building',{dx:-190,dy:-216,w:230,d:160,h:156,floors:2,roofH:53,sign:'六奇阁'});
      courtyard('main',342,282,'#c7c9b1');
      landmark('side2','building',{w:171,d:134,h:113,roofH:45,sign:'雨花丹房',lanterns:true});
      landmark('workshop','building',{w:188,d:127,h:102,roofH:37,sign:'百味药坊'});
      landmark('side1','building',{w:148,d:118,h:95,open:true,roofH:37});
      for(const [key,dy,len]of [['main',192,185],['side2',167,130],['side1',155,144]]){
        const a=anchors[key],x=a.x+26,y=a.y+dy,front=heightAt(x,y+len/2),back=heightAt(x,y-len/2);A({type:'stair',x,y,z:front,w:220,d:len,h:Math.max(10,back-front),steps:11,anchor:key});
      }
      for(const key of ['main','side1','side2','lookout'])lamps(key,123,false);
      fieldRows('herb',12,true,-295,-176);fieldRows('workshop',6,true,-235,96);
      ridge('lookout',[[-230,-105,144,355],[228,58,132,337]]);ridge('ruins',[[-190,-140,142,328]]);
      grove('shrine','pine',26,150,370);grove('main','pine',17,260,425);grove('waterside','blossom',16,150,340);grove('ruins','tree',20,150,350);
    }else if(id==='leizhuang'){
      landmark('main','building',{dx:-170,dy:-200,w:231,d:162,h:137,roofH:49,sign:'奔雷旧庄',lanterns:true});
      courtyard('main',342,265,'#c4bb95');
      landmark('workshop','building',{w:188,d:134,h:105,roofH:42,open:true,sign:'奔雷铁作'});
      landmark('side1','building',{w:182,d:135,h:97,roofH:34,open:true});
      landmark('cache','building',{w:213,d:138,h:126,roofH:43,sign:'旧庄粮仓'});
      for(const key of ['camp','side2','arrival'])landmark(key,'building',{dx:168,dy:-136,w:138,d:111,h:89,roofH:38,lanterns:true});
      for(const key of ['camp','side2','cache'])place(key,131,76,{type:'cart',w:90,d:91,h:72},true);
      fieldRows('side2',10,false,-258,-240);fieldRows('herb',8,true,-110,-258);
      for(const key of ['main','side1','workshop','camp'])lamps(key,124,true);
      grove('side1','goldtree',23,170,350);grove('ruins','tree',24,150,355);grove('lookout','goldtree',25,170,355);grove('arrival','goldtree',16,150,330);
    }else if(id==='waterfall'){
      const f1=landmark('side2','waterfall',{dx:-306,dy:-280,w:173,d:232,h:472});
      const f2=landmark('lookout','waterfall',{dx:-255,dy:-257,w:127,d:187,h:393});
      // 深潭落在飞瀑基脚，连接既有溪流；桥道已是独立可行走的实体。
      for(const f of [f1,f2]){const pond={x:f.x+59,y:f.y+85,rx:f.w*1.15,ry:f.w*.81,biome:spec.biome,color:'#88b6b0'};if(!Object.values(anchors).some(a=>((a.x-pond.x)/pond.rx)**2+((a.y-pond.y)/pond.ry)**2<1.3))scene.ponds.push(pond);}
      ridge('shrine',[[-214,-93,143,388],[270,108,169,467]]);ridge('side1',[[266,-169,161,406]]);ridge('ruins',[[-146,-179,151,427]]);
      landmark('main','building',{w:176,d:136,h:113,roofH:43,open:true});landmark('workshop','building',{w:158,d:118,h:84,roofH:30,open:true});
      for(const key of ['main','waterside','lookout','side1'])lamps(key,135,false);
      grove('workshop','tree',21,155,335);grove('camp','tree',22,155,335);grove('herb','bamboo',24,140,335);grove('lookout','pine',19,205,355);
    }else if(id==='gallery'){
      landmark('main','sluice',{w:165,d:48,h:129,dx:-163,dy:-134,effectRole:'sluice',collision:false});
      landmark('side1','building',{w:164,d:128,h:101,open:true,roofH:35});
      landmark('side2','building',{w:225,d:74,h:94,open:true,roofH:27});landmark('workshop','building',{w:174,d:125,h:88,open:true,roofH:33});
      ridge('lookout',[[-213,-101,127,357],[211,97,145,369]]);ridge('ruins',[[-130,-86,133,337]]);ridge('main',[[165,-319,136,341]]);
      for(const key of ['arrival','side1','camp','shrine','waterside','side2','herb','lookout'])grove(key,'bamboo',22,135,315);
      for(const key of ['main','side2','lookout'])lamps(key,128,false);
      for(const r of scene.rivers)for(const i of [1,3,5]){const q=r.points[i];if(q)A({type:'boat',x:q.x+15,y:q.y+20,w:115,d:38,h:44,anchor:'waterside'});}
    }else if(id==='baicao'){
      landmark('main','building',{dx:-168,dy:-190,w:216,d:156,h:126,roofH:47,sign:'百草琴舍',lanterns:true});
      landmark('workshop','building',{w:198,d:119,h:98,roofH:37,open:true,sign:'晾药工房'});
      landmark('side2','building',{w:153,d:115,h:87,roofH:33,open:true});landmark('cache','building',{w:145,d:108,h:98,roofH:38,sign:'备药仓'});
      for(const key of ['herb','side1','side2','workshop'])fieldRows(key,key==='herb'?12:8,true,-268,-202);
      for(const key of ['main','shrine','lookout'])grove(key,'bamboo',22,165,345);
      grove('arrival','blossom',25,135,325);grove('camp','tree',14,150,320);grove('ruins','bamboo',20,140,320);grove('herb','blossom',14,220,350);
      for(const key of ['main','workshop','shrine'])lamps(key,130,false);
    }else if(id==='tianzi'){
      const m=anchors.main;A({type:'altar',x:m.x,y:m.y,z:heightAt(m.x,m.y)-24,w:190,h:25,anchor:'main'});courtyard('main',410,345,'#bdc8bc');
      landmark('main','gate',{dx:-210,dy:-232,w:237,d:33,h:185,sign:'七剑合璧',collision:false});
      landmark('workshop','sluice',{w:159,d:50,h:110,effectRole:'mechanism',collision:false});
      for(const [key,offs]of [['lookout',[[-233,-67,154,447],[227,90,144,408]]],['shrine',[[-252,-14,161,428]]],['ruins',[[-87,-163,151,402],[225,34,129,336]]],['side2',[[249,-185,154,426]]]])ridge(key,offs);
      for(let i=0;i<7;i++)place('side1',(i-3)*76,-156,{type:'lantern',h:87,w:31,d:31,effectRole:'seven-lanterns'},false);
      for(const key of ['main','lookout','shrine','side2'])lamps(key,143,false);
      grove('ruins','pine',20,150,350);grove('camp','pine',20,140,330);grove('herb','pine',17,140,325);grove('main','pine',17,305,435);
    }
    // 共有的十二处可交互地标，外观随地区主题改变。
    const workshopExists=scene.props.some(p=>p.anchor==='workshop'&&p.type==='building');
    if(!workshopExists)landmark('workshop','building',{w:167,d:122,h:94,roofH:37,open:true});
    if(!scene.props.some(p=>p.anchor==='lookout'&&p.type==='building'))landmark('lookout','building',{w:121,d:107,h:106,roofH:42,open:true});
    const shrine=landmark('shrine','shrine',{dx:-113,dy:-102,w:67,d:56,h:116,glow:true,effectRole:'shrine'});
    place('camp',-139,-112,{type:'tent',w:129,d:93,h:83,effectRole:'camp'},false);place('camp',118,-106,{type:'brazier',w:55,d:55,h:77,lit:false,effectRole:'brazier'},false);
    place('camp',188,45,{type:'flag',w:65,d:25,h:132,color:'#94846c',effectRole:'flag'},false);
    if(!scene.props.some(p=>p.anchor==='herb'&&p.type==='field'))fieldRows('herb',7,true,-176,-150);
    const cacheProp=place('cache',-84,-61,{type:'chest',w:43,d:33,h:46,effectRole:'cache'},false);
    for(const [dx,dy,w,h]of [[-146,-81,56,80],[124,-132,42,60],[-151,131,48,48]])place('ruins',dx,dy,{type:'rock',w,d:w*.72,h,moss:true,effectRole:'ruin'},true);
    place('ruins',-81,-177,{type:'wall',w:126,d:32,h:57,collisionBox:true,effectRole:'ruin'},true);
    if(!['gallery','tianzi'].includes(id))landmark('waterside','sluice',{dx:114,dy:-116,w:138,d:40,h:94,effectRole:'sluice',collision:false});
    for(const ex of exits){A({type:'gate',x:ex.x+ex.normal.x*21,y:ex.y+ex.normal.y*21,w:183,d:32,h:132,sign:targetNames[ex.to]||'山间古道',rotation:ex.side==='west'||ex.side==='east'?Math.PI/2:0,anchor:ex.id,open:true});A({type:'lantern',x:ex.x+ex.normal.x*58+ex.normal.y*106,y:ex.y+ex.normal.y*58-ex.normal.x*106,w:30,d:30,h:75,anchor:ex.id});}
    // 森林、竹影和石峰以地形边缘为主，保留路径两侧足够的行走与识路空间。
    const scatterCount=id==='gallery'?310:id==='yuchan'?180:id==='tianzi'?195:255;
    for(let i=0;i<scatterCount*5&&scene.props.length<scatterCount+240;i++){
      const x=110+rand()*(W-220),y=110+rand()*(H-220);if(!clear(x,y,28))continue;
      const t=rand();if(t<.24){const w=29+rand()*52;A({type:'rock',x,y,w,d:w*.71,h:w*(.49+rand()*.32)},true);}
      else{const type=spec.biome==='bamboo'?'bamboo':spec.biome==='garden'?(t>.6?'blossom':'bamboo'):spec.biome==='palace'?(t>.58?'blossom':'tree'):spec.biome==='village'||spec.biome==='inn'?(t>.48?'goldtree':'tree'):spec.biome==='summit'?'pine':t>.67?'tree':'pine';A({type,x,y,s:.74+rand()*.41,w:49+rand()*28,h:110+rand()*43,count:4+Math.floor(rand()*3)},type!=='bamboo');}
    }
    // 区域边缘的高峰和前景树形成纵深；其碰撞不越过地图通道。
    const borderPeaks=id==='yuchan'?4:id==='inn'||id==='leizhuang'||id==='baicao'?5:9;
    for(let i=0;i<borderPeaks;i++){
      const side=i%4,along=.13+rand()*.72,x=side===0?-48:side===1?W+42:along*W,y=side===2?-64:side===3?H+60:along*H;
      A({type:'pillar',x,y,w:132+rand()*87,d:103+rand()*48,h:(id==='tianzi'?360:285)+rand()*142,z:heightAt(clamp(x,0,W),clamp(y,0,H)),boundH:620},false);
    }
    for(let i=0;i<discoveryKinds[id].length;i++){
      const [type,name,key]=discoveryKinds[id][i],a=anchors[key],did=id+'-wild-'+(i+1),d={id:did,location:id,region:id,type,kind:type,anchor:key,name,description:a.description,x:a.x,y:a.y,z:heightAt(a.x,a.y)};
      scene.discoveries.push(d);
      const compatible={cache:'chest',herb:'field',shrine:'shrine',viewpoint:'building'}[type];
      let p=scene.props.find(p=>p.anchor===key&&p.type===compatible);
      if(!p)p=place(key,-106,-93,{type:compatible,w:compatible==='building'?111:76,d:compatible==='building'?93:56,h:compatible==='building'?94:80,open:compatible==='building',flowers:compatible==='field'},false);
      p.discoveryId=did;
    }
    for(const a of Object.values(anchors))a.z=scene.heightAt(a.x,a.y);
    for(const ex of exits){ex.z=scene.heightAt(ex.x,ex.y);ex.spawn.z=scene.heightAt(ex.spawn.x,ex.spawn.y);}
    scene.spawn={x:anchors.arrival.x,y:anchors.arrival.y,z:anchors.arrival.z};loc.npc={...anchors.main};loc.safe={...anchors.main};loc.spawn={...scene.spawn};
    scene.landmarks=Object.entries(anchors).map(([key,a])=>({id:key,...a}));
    const oldSet=scene.setDiscoveries;scene.setDiscoveries=ids=>oldSet(ids||[]);
    scene._completedEvents=new Set();
    scene.setEvents=(ids=[])=>{
      const incoming=ids&&typeof ids.has==='function'?ids:new Set(Array.isArray(ids)?ids:Object.keys(ids).filter(k=>ids[k]));
      scene._completedEvents=incoming;
      for(const p of scene.props){if(!p.eventTask)continue;const active=incoming.has(p.eventTask);if(p.eventDone===active)continue;p.eventDone=active;applyEvent(p,active);const c=scene._propCache?.get(p.id);if(c){scene._cacheBytes-=c.bytes;scene._propCache.delete(p.id);}}
    };
    scene.eventMarkers=[];
    scene.bindEvent=(taskId,anchor,effect)=>{
      if(scene.eventMarkers.some(e=>e.taskId===taskId))return 1;
      const v=eventVisuals[taskId]||{anchor,kind:typeof effect==='string'?effect:'board'},key=v.anchor||anchor,a=anchors[key];if(!a)return 0;
      const index=scene.eventMarkers.filter(e=>e.anchor===key).length,dx=index%2?101:-94,dy=index%2?-46:-81;
      let p;
      if(v.kind==='remove-board')p=A({type:'taskToken',x:a.x+dx,y:a.y+dy,w:123,d:77,h:143,anchor:key,eventTask:taskId,taskKind:'board',hideWhenDone:true,eventDone:false,hidden:false});
      else if(v.kind==='remove-fence')p=A({type:'fence',x:a.x+dx,y:a.y+dy,length:119,w:125,d:30,h:51,angle:.18,anchor:key,eventTask:taskId,hideWhenDone:true,eventDone:false,hidden:false});
      else p=A({type:'taskToken',x:a.x+dx,y:a.y+dy,w:123,d:77,h:143,anchor:key,eventTask:taskId,taskKind:v.kind,eventDone:false,hidden:true});
      scene.eventMarkers.push({taskId,anchor:key,kind:v.kind,propId:p.id});
      if(v.role){
        let choices=scene.props.filter(q=>q.id!==p.id&&q.effectRole===v.role&&!q.eventTask);
        choices.sort((aa,bb)=>distance(aa,a)-distance(bb,a));const linked=choices[0];
        if(linked){linked.eventTask=taskId;linked.eventEffect=v.role;linked.eventDone=false;scene.eventMarkers[scene.eventMarkers.length-1].linkedProp=linked.id;}
      }
      return 1;
    };
    for(const [taskId,v]of Object.entries(eventVisuals))if(taskId.startsWith(id+'-'))scene.bindEvent(taskId,v.anchor,v.kind);
    if(id==='tianzi'&&global.WorldTowerArt){scene.tower={...anchors.tower,building:{x:560,y:1190,w:180,d:180}};scene.colliders.push({kind:'rect',x:560,y:1190,w:180,d:180,prop:'sealed-tower'});const get=scene.getDrawables;scene.getDrawables=(camera,time=0,player)=>get(camera,time,player).concat(global.WorldTowerArt.getDrawables(scene,camera,time,player));}
    scene.rebuildGround();return scene;
  }
  function applyEvent(p,active){
    if(p.hideWhenDone)p.hidden=active;
    else if(p.type==='taskToken')p.hidden=!active;
    else if(p.type==='brazier')p.lit=active;
    else if(p.type==='flag'){p.color=active?'#759c83':'#94846c';}
    else if(p.type==='sluice')p.opened=active;
    else if(p.type==='tent')p.secured=active;
    else if(p.type==='shrine')p.glow=active;
    else if(p.type==='bridge')p.repaired=active;
    else if(p.type==='lantern'){p.wood=active;p.h=active?88:77;}
  }
  global.JianghuRegions={create,specs,discoveryIds:Object.values(discoveryIds).flat(),discoveryIdsByRegion:discoveryIds,anchorKeys:KEYS,eventVisuals,version:'3.0.0'};
})(typeof window!=='undefined'?window:globalThis);
