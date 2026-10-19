(function(root){'use strict';
const PLANTS={};
function plant(id,name,cost,recharge,hp,description,extra){PLANTS[id]=Object.assign({id,name,cost,recharge,hp,description},extra||{});}
plant('peashooter','Peashooter',100,7.5,300,'Shoots peas down its lane.',{damage:20,interval:1.425});
plant('sunflower','Sunflower',50,7.5,300,'Produces 25 sun every 24 seconds.',{sun:25});
plant('cherry-bomb','Cherry Bomb',150,50,300,'Explodes across a 3 × 3 area.',{instant:true});
plant('wall-nut','Wall-nut',50,30,4000,'A sturdy edible barricade.');
plant('potato-mine','Potato Mine',25,30,300,'Arms after 14 seconds; explodes on contact.');
plant('snow-pea','Snow Pea',175,7.5,300,'Chilling peas slow zombies.',{damage:20,interval:1.425});
plant('chomper','Chomper',150,7.5,300,'Swallows one nearby zombie, then digests for 42 seconds.');
plant('repeater','Repeater',200,7.5,300,'Fires two peas per attack.',{damage:20,interval:1.425});
plant('puff-shroom','Puff-shroom',0,7.5,300,'Free mushroom with short-range spores.',{damage:20,interval:1.425,mushroom:true,range:3});
plant('sun-shroom','Sun-shroom',25,7.5,300,'Makes small suns, then grows to make full suns.',{mushroom:true,sun:15});
plant('fume-shroom','Fume-shroom',75,7.5,300,'Fumes pierce screens and hit every zombie in range.',{damage:20,interval:1.425,mushroom:true,range:4});
plant('grave-buster','Grave Buster',75,7.5,300,'Removes a grave.');
plant('hypno-shroom','Hypno-shroom',75,30,300,'A zombie that eats it turns against its allies.',{mushroom:true});
plant('scaredy-shroom','Scaredy-shroom',25,7.5,300,'Long-range spores; hides when zombies approach.',{damage:20,interval:1.425,mushroom:true});
plant('ice-shroom','Ice-shroom',75,50,300,'Freezes all zombies, then leaves them slowed.',{mushroom:true,instant:true});
plant('doom-shroom','Doom-shroom',125,50,300,'Huge blast leaves an unplantable crater.',{mushroom:true,instant:true});
plant('lily-pad','Lily Pad',25,7.5,300,'Supports a land plant on water.',{layer:'base'});
plant('squash','Squash',50,30,300,'Crushes nearby zombies.');
plant('threepeater','Threepeater',325,7.5,300,'Shoots into three adjacent lanes.',{damage:20,interval:1.425});
plant('tangle-kelp','Tangle Kelp',25,30,300,'Pulls one water zombie under.');
plant('jalapeno','Jalapeno',125,50,300,'Burns every zombie in one lane.',{instant:true});
plant('spikeweed','Spikeweed',100,7.5,300,'Damages walking zombies and pops tires.');
plant('torchwood','Torchwood',175,7.5,300,'Turns peas into double-damage fireballs.');
plant('tall-nut','Tall-nut',125,30,8000,'Blocks vaulting zombies.');
plant('sea-shroom','Sea-shroom',0,30,300,'A short-range mushroom for water.',{damage:20,interval:1.425,mushroom:true,range:3});
plant('plantern','Plantern',25,30,300,'Clears nearby fog.');
plant('cactus','Cactus',125,7.5,300,'Spikes can pop balloon zombies.',{damage:20,interval:1.425});
plant('blover','Blover',100,7.5,300,'Blows away balloons and briefly clears fog.',{instant:true});
plant('split-pea','Split Pea',125,7.5,300,'Two peas behind, one pea ahead.',{damage:20,interval:1.425});
plant('starfruit','Starfruit',125,7.5,300,'Fires stars in five directions.',{damage:20,interval:1.425});
plant('pumpkin','Pumpkin',125,30,4000,'Protects another plant with an armored shell.',{layer:'armor'});
plant('magnet-shroom','Magnet-shroom',100,7.5,300,'Pulls metal gear off nearby zombies.',{mushroom:true});
plant('cabbage-pult','Cabbage-pult',100,7.5,300,'Lobs cabbages over roof slopes and screens.',{damage:40,interval:2.85,lob:true});
plant('flower-pot','Flower Pot',25,7.5,300,'Supports plants on the roof.',{layer:'base'});
plant('kernel-pult','Kernel-pult',100,7.5,300,'Lobs corn; butter stuns its target.',{damage:20,interval:2.85,lob:true});
plant('coffee-bean','Coffee Bean',75,7.5,300,'Wakes a sleeping mushroom.');
plant('garlic','Garlic',50,7.5,400,'Biting zombies change lanes.');
plant('umbrella-leaf','Umbrella Leaf',100,7.5,300,'Protects adjacent plants from bungees and basketballs.');
plant('marigold','Marigold',50,30,300,'Produces collectible coins for your garden.');
plant('melon-pult','Melon-pult',300,7.5,300,'Heavy melons splash nearby zombies.',{damage:80,interval:2.85,lob:true});
// Shop upgrades are earned here through adventure progression, without currency gates.
plant('gatling-pea','Gatling Pea',250,50,300,'Upgrade a Repeater to four peas per volley.',{damage:20,interval:1.425,upgradeFrom:'repeater',unlockLevel:10});
plant('twin-sunflower','Twin Sunflower',150,50,300,'Upgrade a Sunflower to produce two suns.',{sun:50,upgradeFrom:'sunflower',unlockLevel:10});
plant('gloom-shroom','Gloom-shroom',150,50,300,'Upgrade a Fume-shroom: four piercing pulses in all adjacent squares.',{damage:20,interval:1.9,mushroom:true,upgradeFrom:'fume-shroom',unlockLevel:20});
plant('cattail','Cattail',225,50,300,'Upgrade a Lily Pad; homing spikes prioritize balloons anywhere on the lawn.',{damage:20,interval:1.425,upgradeFrom:'lily-pad',unlockLevel:25});
plant('winter-melon','Winter Melon',200,50,300,'Upgrade a Melon-pult with chilling splash damage.',{damage:80,interval:2.85,lob:true,upgradeFrom:'melon-pult',unlockLevel:49});
plant('gold-magnet','Gold Magnet',50,50,300,'Upgrade a Magnet-shroom to collect nearby coins; awake during day.',{upgradeFrom:'magnet-shroom',unlockLevel:40});
plant('spikerock','Spikerock',125,50,300,'Upgrade Spikeweed; double damage and withstands nine crushing hits.',{upgradeFrom:'spikeweed',unlockLevel:30});
plant('cob-cannon','Cob Cannon',500,50,300,'Upgrade two side-by-side Kernel-pults; select and aim a devastating cob.',{upgradeFrom:'kernel-pult',footprint:2,unlockLevel:45});
plant('imitater','Imitater',0,7.5,300,'Choose a non-upgrade seed to copy; transforms after 3.2 seconds.',{unlockLevel:30});
const roofHeight=x=>Math.min(4.5,Math.max(0,x))*.22;
const ZOMBIES={};
function zombie(id,name,hp,speed,description,extra){ZOMBIES[id]=Object.assign({id,name,hp,speed,damage:100,description},extra||{});}
zombie('normal','Zombie',200,.075,'A shambling lawn invader.');
zombie('flag','Flag Zombie',200,.09,'Leads a large wave.');
zombie('cone','Conehead Zombie',200,.075,'Traffic-cone armor.',{armor:370,metal:false});
zombie('pole','Pole Vaulting Zombie',340,.15,'Vaults the first low plant.');
zombie('bucket','Buckethead Zombie',200,.075,'Heavy metal bucket.',{armor:1100,metal:true});
zombie('newspaper','Newspaper Zombie',200,.075,'Runs when its paper is destroyed.',{armor:150});
zombie('screen','Screen Door Zombie',200,.075,'A metal shield blocks straight shots.',{armor:1100,metal:true,shield:true});
zombie('football','Football Zombie',200,.17,'Fast and heavily armored.',{armor:1400,metal:true});
zombie('dancing','Dancing Zombie',340,.075,'Summons backup dancers.');
zombie('backup','Backup Dancer',200,.075,'Shuffles with the dancing zombie.');
zombie('ducky','Ducky Tube Zombie',200,.075,'Swims across the pool.',{water:true});
zombie('snorkel','Snorkel Zombie',200,.085,'Submerges until it reaches a plant.',{water:true});
zombie('zomboni','Zomboni',1350,.13,'Crushes plants and leaves an icy trail.',{vehicle:true});
zombie('bobsled','Bobsled Team',800,.2,'Slides along the ice.',{vehicle:true});
zombie('dolphin','Dolphin Rider Zombie',340,.2,'Jumps the first pool plant.',{water:true});
zombie('jack','Jack-in-the-Box Zombie',340,.12,'Its box can explode among your plants.');
zombie('balloon','Balloon Zombie',200,.095,'Floats over defenses.');
zombie('digger','Digger Zombie',200,.12,'Tunnels to the left, then attacks from behind.',{metal:true});
zombie('pogo','Pogo Zombie',340,.15,'Bounces over plants until blocked.',{metal:true});
zombie('yeti','Zombie Yeti',1350,.1,'A rare visitor.');
zombie('bungee','Bungee Zombie',450,0,'Drops onto a plant and steals it.');
zombie('ladder','Ladder Zombie',200,.15,'Places a ladder over a defensive nut.',{armor:500,metal:true});
zombie('catapult','Catapult Zombie',850,.11,'Lobs basketballs at the rear defenses.',{vehicle:true});
zombie('gargantuar','Gargantuar',3000,.085,'Smashes plants and throws an Imp.');
zombie('imp','Imp',200,.15,'Small and quick.');
zombie('zomboss','Dr. Zomboss',40000,0,'Roof battle: ice and fire attacks.');
// Public PC reference: seconds per full lawn cell. Raw body HP includes the headless tail.
const bodyHealth={normal:270,flag:270,cone:270,pole:500,bucket:270,newspaper:270,screen:270,football:270,dancing:500,backup:270,ducky:270,snorkel:270,dolphin:500,jack:500,balloon:270,digger:270,pogo:500,ladder:500,imp:270};
const secondsPerCell={normal:4.7,flag:3.7,cone:4.7,pole:2.5,bucket:4.7,newspaper:4.7,screen:4.7,football:2.5,dancing:5.5,backup:5.5,ducky:4.7,snorkel:4,dolphin:.8,jack:2.2,balloon:2.5,digger:1.2,pogo:1.9,ladder:2,catapult:2.5,gargantuar:4.7,imp:4.7,bobsled:1.2};
for(const [id,hp] of Object.entries(bodyHealth))ZOMBIES[id].hp=hp;
for(const [id,seconds] of Object.entries(secondsPerCell))ZOMBIES[id].speed=1/seconds;
ZOMBIES.digger.armor=100;ZOMBIES.balloon.armor=20;
const unlock=['peashooter','sunflower','cherry-bomb','wall-nut','potato-mine','snow-pea','chomper','repeater','puff-shroom','sun-shroom','fume-shroom','grave-buster','hypno-shroom','scaredy-shroom','ice-shroom','doom-shroom','lily-pad','squash','threepeater','tangle-kelp','jalapeno','spikeweed','torchwood','tall-nut','sea-shroom','plantern','cactus','blover','split-pea','starfruit','pumpkin','magnet-shroom','cabbage-pult','flower-pot','kernel-pult','coffee-bean','garlic','umbrella-leaf','marigold','melon-pult'];
// Explicit original adventure unlock sequence (level award): no plant on most challenge stages.
const rewardList={1:'sunflower',2:'cherry-bomb',3:'wall-nut',5:'potato-mine',6:'snow-pea',7:'chomper',8:'repeater',10:'puff-shroom',11:'sun-shroom',12:'fume-shroom',13:'grave-buster',15:'hypno-shroom',16:'scaredy-shroom',17:'ice-shroom',18:'doom-shroom',20:'lily-pad',21:'squash',22:'threepeater',23:'tangle-kelp',25:'jalapeno',26:'spikeweed',27:'torchwood',28:'tall-nut',30:'sea-shroom',31:'plantern',32:'cactus',33:'blover',35:'split-pea',36:'starfruit',37:'pumpkin',38:'magnet-shroom',40:'cabbage-pult',41:'flower-pot',42:'kernel-pult',43:'coffee-bean',45:'garlic',46:'umbrella-leaf',47:'marigold',48:'melon-pult'};
// Source-checked unlocks; waves below are original reconstructed schedules.
const FIRST_ADVENTURE_FLAGS=[0,1,1,1,1,1,2,1,2,2,1,2,1,2,0,1,2,1,2,2,1,2,2,3,2,2,3,2,3,3,1,2,1,2,0,1,2,1,2,2,1,2,2,3,2,2,3,2,3,0];
const LEVELS=[];const envs=['day','night','pool','fog','roof'];
// First-Adventure PC walkthrough rosters. Spawn timing/counts remain reconstructed;
// summons (backup dancers, sled teams, Imps) are generated by their parent enemy.
const ADVENTURE_ROSTERS={
1:'normal',2:'normal',3:'normal cone',4:'normal cone',5:'normal cone',6:'normal cone pole',7:'normal cone pole',8:'normal cone bucket',9:'normal cone pole bucket',10:'normal cone pole bucket',
11:'normal newspaper',12:'normal cone newspaper bucket',13:'normal cone screen',14:'normal cone screen pole',15:'normal cone bucket',16:'normal cone football',17:'normal cone football screen',18:'normal cone dancing',19:'normal cone dancing screen',20:'normal cone newspaper dancing screen football',
21:'normal cone ducky',22:'normal cone ducky newspaper bucket football',23:'normal cone ducky snorkel',24:'normal cone ducky snorkel bucket pole newspaper',25:'normal cone ducky snorkel football',26:'normal cone ducky zomboni',27:'normal cone ducky snorkel bucket zomboni',28:'normal cone ducky dolphin',29:'normal cone ducky dolphin bucket pole zomboni',30:'normal cone ducky snorkel bucket dolphin zomboni',
31:'normal cone ducky jack',32:'normal cone ducky jack football',33:'normal cone ducky balloon',34:'normal cone ducky balloon dolphin',36:'normal cone ducky digger',37:'normal cone ducky digger bucket jack',38:'normal cone ducky pogo',39:'normal cone ducky bucket pogo balloon',40:'normal cone ducky bucket jack balloon pogo digger',
41:'normal cone bungee',42:'normal cone bungee bucket pole',43:'normal cone ladder',44:'normal cone ladder pogo football',45:'normal cone bucket ladder bungee',46:'normal cone catapult',47:'normal cone ladder bungee catapult',48:'normal cone gargantuar',49:'normal cone bucket bungee jack ladder catapult gargantuar'
};
for(let n=1;n<=50;n++){const chapter=Math.ceil(n/10),stage=(n-1)%10+1,environment=envs[chapter-1];let mode='normal';if(stage===10)mode=chapter===5?'boss':'conveyor';if(n===5)mode='bowling';if(n===15)mode='whack';if(n===25)mode='conveyor';if(n===35)mode='vase';if(n===45)mode='conveyor';
const intros={normal:1,flag:2,cone:3,pole:6,bucket:8,newspaper:11,screen:13,football:16,dancing:18,ducky:21,snorkel:23,zomboni:26,bobsled:26,dolphin:28,jack:31,balloon:33,digger:36,pogo:38,bungee:41,ladder:43,catapult:46,gargantuar:48};
const pools={1:['normal','cone','pole','bucket'],2:['normal','cone','bucket','newspaper','screen','football','dancing'],3:['normal','cone','bucket','pole','ducky','snorkel','zomboni','dolphin'],4:['normal','cone','bucket','ducky','snorkel','dolphin','jack','balloon','digger','pogo'],5:['normal','cone','bucket','bungee','ladder','catapult','gargantuar']};
const kinds=ADVENTURE_ROSTERS[n]?ADVENTURE_ROSTERS[n].split(' '):pools[chapter].filter(k=>intros[k]<=n);
const rows=n===35?5:(chapter===3||chapter===4)?6:5;LEVELS.push({number:n,id:chapter+'-'+stage,name:chapter+'-'+stage,chapter,stage,environment:n===35?'night':environment,mode,rows,cols:9,activeRows:n===1?[2]:n<=3?[1,2,3]:Array.from({length:rows},(_,i)=>i),night:n===50||environment==='night'||environment==='fog',storm:n===40,tiny:n===25,bungeeBlitz:n===45,waterRows:rows===6?[2,3]:[],flagCount:FIRST_ADVENTURE_FLAGS[n-1],duration:n===1?110:[0,160+stage*7,180+stage*8,200+stage*9,220+stage*8,240+stage*8][chapter],startSun:50,startingPotColumns:chapter===5?(stage===1?5:stage===2?4:3):0,reward:rewardList[n]||null,zombies:[...new Set(kinds)],conveyor:n===45?['chomper','flower-pot','pumpkin','cherry-bomb']:chapter===5?['flower-pot','cabbage-pult','kernel-pult','melon-pult','jalapeno','ice-shroom']:chapter===4?['lily-pad','starfruit','pumpkin','blover','split-pea','cactus','magnet-shroom','sea-shroom']:n===25?['peashooter','lily-pad','wall-nut','cherry-bomb']:chapter===3?['lily-pad','threepeater','squash','tangle-kelp','jalapeno','tall-nut','torchwood','spikeweed']:chapter===2?['puff-shroom','fume-shroom','scaredy-shroom','ice-shroom','doom-shroom','hypno-shroom','grave-buster']:['peashooter','cherry-bomb','wall-nut','snow-pea','repeater','potato-mine','chomper'],hint:environment==='night'?'No sun falls at night. Grow mushrooms and clear graves.':environment==='pool'?'Water lanes require Lily Pads or aquatic plants.':environment==='fog'?'Fog hides the right side. Planterns reveal nearby lanes.':environment==='roof'?'Plant on Flower Pots. Catapults shoot over the roof slope.':'Build sun income, then defend every open lane.',waveNote:'Wave schedules are reconstructed, not extracted from the 2009 game.'});}
const api={PLANTS,ZOMBIES,LEVELS,roofHeight,SEED_SLOTS:10,UNLOCK_ORDER:[...unlock,...Object.keys(PLANTS).filter(k=>!unlock.includes(k))],getLevel:n=>LEVELS[Math.max(0,Math.min(49,n-1))],unlockedBefore:n=>['peashooter',...Object.entries(rewardList).filter(([k])=>+k<n).map(([,v])=>v),...Object.values(PLANTS).filter(p=>p.unlockLevel&&p.unlockLevel<=n).map(p=>p.id)]};if(typeof module!=='undefined')module.exports=api;root.PVZContent=api;
})(typeof globalThis!=='undefined'?globalThis:this);
