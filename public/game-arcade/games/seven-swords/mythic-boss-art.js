/* Four trial apparitions, drawn from the v31 generated concept sheet.
 * Projected x/y contract matches TowerArt. Pure rendering; no shadow or stat edits.
 */
(() => {
'use strict';
const TAU=Math.PI*2, clamp=v=>Math.max(0,Math.min(1,v)), ink='#25343a', gold='#c3a363';
function path(c,p,fill,stroke=ink,w=1.2){c.beginPath();p.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function shape(c,p,fill,stroke=ink,w=1.2){c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=6)c.bezierCurveTo(...p.slice(i,i+6));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function line(c,p,col,w=2){c.beginPath();p.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.stroke();}
function ellipse(c,x,y,rx,ry,col,stroke=ink){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=col;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
function curve(c,p,col,w){c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=6)c.bezierCurveTo(...p.slice(i,i+6));c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.stroke();}
function medal(c,x,y,r){ellipse(c,x,y,r,r,gold);ellipse(c,x,y,r*.66,r*.66,'#485951');line(c,[[x-r*.35,y],[x,y-r*.4],[x+r*.35,y],[x,y+r*.4],[x-r*.35,y]],gold,.9);}
function feather(c,x,y,a,len,width,base,tip){c.save();c.translate(x,y);c.rotate(a);path(c,[[0,0],[-width,-len*.24],[-width*.55,-len*.7],[0,-len],[width*.6,-len*.63],[width,-len*.2]],base);path(c,[[0,-len*.2],[0,-len],[width*.6,-len*.63],[width,-len*.2]],tip,null);line(c,[[0,-2],[0,-len*.85]],'#dac58d',.55);c.restore();}
function eye(c,x,y){path(c,[[x-3,y-2],[x+4,y-1],[x+1,y+2],[x-2,y+1]],'#f3df9c',null);ellipse(c,x+1,y,.8,1.3,ink,null);}
function claw(c,x,y,col){for(let j=0;j<3;j++)path(c,[[x+j*4,y],[x+j*4+2,y-3],[x+j*4+4,y+3],[x+j*4,y+2]],col);}
function kui(c,t,s,a){
 curve(c,[-32,-50,-64,-39,-66,-77,-46,-78],'#293c54',8);for(let i=0;i<5;i++)feather(c,-52,-75,-1.8+i*.2,24+i*2,3,'#3e5872','#7d99aa');
 // A single central supporting leg, with split hoof, not four ox legs.
 path(c,[[-10,-48],[10,-42],[8,-22],[16+s*2,-7],[11,0],[-12,0],[-17,-7],[-9,-24]],'#30455e');path(c,[[-9,-41],[-2,-35],[-2,-13],[-10,-7],[-14,-9]],'#56728c',null);path(c,[[-14,-9],[12,-9],[16,1],[-16,1]],'#292e34');line(c,[[0,-7],[0,1]],'#a09c85',1.2);medal(c,0,-13,7);
 ellipse(c,-4,-61,35,29,'#344b66');ellipse(c,-19,-63,18,21,'#425d77');for(let i=0;i<5;i++)line(c,[[-29+i*8,-52],[-27+i*8,-45],[-20+i*8,-42]],'#6b8295',.7);path(c,[[-38,-64],[-31,-84],[-5,-92],[16,-77],[10,-55],[-12,-51]],'#8d794d');path(c,[[-33,-65],[-28,-81],[-5,-86],[10,-74],[6,-59],[-12,-56]],'#37494e',gold,2);
 for(let i=0;i<3;i++)line(c,[[-27+i*9,-73],[-22+i*9,-78],[-16+i*9,-72],[-21+i*9,-66]],gold,1.4);medal(c,-10,-58,7);
 for(let i=0;i<10;i++)feather(c,11+i*2,-73+i*2,-.5-i*.09,29+(i%3)*5,5,'#233b52','#54768c');
 c.save();c.translate(a*5,-a*2);path(c,[[14,-76],[25,-89],[41,-83],[49,-66],[44,-52],[27,-50],[17,-60]],'#3c5269');shape(c,[32,-66,43,-65,54,-67,55,-60,57,-53,46,-48,37,-51,32,-53,31,-60,32,-66],'#293d50');ellipse(c,49,-59,2.5,1.8,'#101e2b',null);ellipse(c,40,-57,2,1.2,'#101e2b',null);curve(c,[39,-52,43,-50,48,-51,51,-53],'#83949d',.8);
 path(c,[[25,-79],[10,-86],[10,-101],[18,-111],[15,-96],[23,-91],[32,-88]],'#dfd1a6');path(c,[[40,-83],[46,-97],[43,-110],[52,-102],[53,-91],[47,-78]],'#bcad88');line(c,[[18,-101],[17,-94],[24,-90]],'#9c895d',1);for(let i=0;i<4;i++)feather(c,29+i*3,-80,.25+i*.16,11,2.5,'#274157','#70869a');eye(c,39,-70);path(c,[[26,-52],[32,-39],[35,-52]],'#263e55');c.restore();
 if(Math.sin(t*3)>.2||a>0)line(c,[[-29,-91],[-23,-98],[-20,-91],[-12,-102]],'#a8d2dc',1.4);for(let i=0;i<3;i++)line(c,[[-29+i*14,-51],[-24+i*14,-46]],'#7b91a2',.7);
}
function xuanwu(c,t,s,a){
 // Snake forms an open arch above the low shell, with its own unmistakable head.
 const sw=Math.sin(t*2)*3; const snake=[-40,-38,-70,-90,-12,-114,10,-84,44,-45,10,-126,42,-126,62,-128,65,-106,72,-99];curve(c,snake,ink,14);curve(c,snake,'#9aaf99',11);curve(c,snake,'#d0ceb0',4);
 for(let i=0;i<9;i++)line(c,[[8+i*5,-103-i*1.8],[10+i*5,-108-i*1.6]],'#637b6c',1);
 c.save();c.translate(0,sw);shape(c,[63,-108,69,-114,82,-111,87,-105,95,-100,87,-94,76,-94,68,-94,63,-100,63,-108],'#a9b8a0');shape(c,[70,-98,76,-97,83,-96,89,-100,87,-95,78,-92,70,-98],'#d5d5b3',null);eye(c,79,-104);ellipse(c,88,-101,1,1,ink,null);curve(c,[79,-98,84,-97,87,-97,89,-99],'#456656',.8);line(c,[[89,-97],[96,-94],[101,-96]],'#9b655d',.9);line(c,[[96,-94],[100,-91]],'#9b655d',.9);c.restore();
 for(const x of [-35,29]){path(c,[[x,-28],[x+13,-23],[x+14,-8],[x+21,-3],[x+17,1],[x-3,0],[x-5,-11]],'#4c7366');for(let j=0;j<3;j++)path(c,[[x+j*4,-16],[x+j*4+3,-19],[x+j*4+6,-14],[x+j*4+2,-11]],'#8ba286',null);claw(c,x+3,-1,'#c4c4a6');}
 ellipse(c,0,-35,49,25,'#354f47');path(c,[[-49,-37],[-40,-63],[-18,-83],[10,-86],[37,-73],[52,-47],[43,-25],[-24,-22]],'#3b6154',gold,2);
 const plates=[[-27,-56,15],[-4,-65,18],[22,-59,16],[-29,-35,13],[-4,-37,15],[24,-37,14]];
 for(const [x,y,r] of plates){const p=Array.from({length:6},(_,i)=>[x+Math.cos(i*TAU/6)*r,y+Math.sin(i*TAU/6)*r*.72]);path(c,p,'#456e5d',gold,1.7);line(c,[[x-r*.5,y-r*.25],[x+r*.4,y-r*.25],[x+r*.4,y+r*.2],[x-r*.25,y+r*.2],[x-r*.25,y],[x+r*.1,y]],'#94a77b',1.3);}
 for(let i=0;i<6;i++){const x=-39+i*15;ellipse(c,x,-24,7,4,'#586f4e',gold);}
 for(let i=0;i<9;i++)path(c,[[-42+i*10,-25],[-37+i*10,-18],[-32+i*10,-26]],'#8f9d70',gold,.8);
 c.save();c.translate(a*5,0);path(c,[[35,-35],[50,-40],[56,-57],[72,-58],[80,-49],[76,-38],[60,-34],[49,-23]],'#5d8170');path(c,[[60,-54],[77,-52],[80,-46],[63,-44]],'#adc2a1');eye(c,70,-50);path(c,[[58,-57],[60,-65],[65,-58]],gold);c.restore();medal(c,-2,-24,6);
}
function bifang(c,t,s,a){
 const flap=Math.sin(t*3)*.06+a*.1;
 // Three separate flowing plumes, crimson edges over turquoise cores.
 for(let i=0;i<3;i++){const p=[-12,-40,-51,-38-i*10,-85,-22-i*12,-69,1-i*12,-51,18-i*9,-42,5-i*10,-32,8-i*9];curve(c,p,'#793f39',9-i);curve(c,p,'#bc6047',6-i);curve(c,p,'#427779',3);medal(c,-69,-6-i*13,3);}
 // One long leg and three splayed toes.
 line(c,[[3,-33],[3,-16],[0,-1]],'#3a4243',5);line(c,[[3,-30],[5,-17],[2,-3]],'#a7a17a',1.3);line(c,[[1,-1],[-8,2],[0,0],[9,2],[2,-1],[14,-1]],'#a7a17a',2);
 c.save();c.translate(-3,-58);c.rotate(flap);for(let i=0;i<10;i++)feather(c,12-i*3,i*1.5,-1.7+i*.15,85-i*2,10,'#a75040',i%2?'#d38951':'#bd6047');for(let i=0;i<8;i++)feather(c,8-i*3,6+i,-1.55+i*.15,57-i*2,8,'#285a64','#4d8084');c.restore();
 ellipse(c,0,-49,18,26,'#2d6875');for(let j=0;j<4;j++)for(let i=0;i<4;i++)feather(c,-10+i*7,-55+j*7,.1,10,3,'#3c7880','#5e9290');
 curve(c,[8,-58,30,-66,7,-85,24,-98,32,-103,39,-99,40,-95],'#214953',14);curve(c,[10,-59,31,-68,12,-85,27,-96,32,-99,37,-97,40,-95],'#51858a',8);
 path(c,[[34,-101],[46,-99],[62,-91],[43,-94]],'#dfc99c');eye(c,37,-100);for(let i=0;i<5;i++)feather(c,27,-98,-.8-i*.22,22+i*3,2.5,'#b95b43','#d98b56');
 for(let i=0;i<5;i++)feather(c,13+i*1.6,-60+i*2,.1,18,3,'#cdbb86','#e0d0a5');medal(c,0,-61,6);
 if(a>0)for(let i=0;i<3;i++)feather(c,61+i*10,-71+i*4,.8,14,3,'#b9593d','#f0bf6b');
}
function yinglong(c,t,s,a){
 // An elongated dragon with two separate feather wings, not a four-legged recolor.
 c.save();c.translate(1,-58);c.rotate(Math.sin(t*2)*.04);for(let i=0;i<9;i++)feather(c,0,i*.8,-.85+i*.13,83-i*2,12,'#9a824e','#d4bc81');for(let i=0;i<8;i++)feather(c,6-i*3,10+i,-1.65+i*.12,79-i*2,11,'#b69352','#e1c58a');for(let i=0;i<8;i++)feather(c,4-i*2,8+i,-1.1+i*.08,45-i,8,'#416e68','#789a80');c.restore();
 const body=[-57,-12,-94,-25,-69,-65,-41,-45,-14,-22,28,-37,30,-59,31,-80,9,-89,42,-104];curve(c,body,ink,25);curve(c,body,'#b19453',22);curve(c,body,'#d6be80',12);
 for(let i=0;i<12;i++){const x=-51+i*6,y=-40+Math.sin(i*.5)*9;path(c,[[x,y-8],[x+6,y-11],[x+10,y-5],[x+4,y]],i%2?'#496f65':'#739078','#354f49',.7);}
 for(let i=0;i<11;i++){const x=-47+i*6,y=-34+Math.sin(i*.5)*9;line(c,[[x,y],[x+3,y+4],[x+7,y+1]],'#8c784d',.8);}
 for(let i=0;i<6;i++)feather(c,-62-i,-21-i*2,-1-i*.16,25,3,'#af955d','#dbca93');
 for(const [x,y,f] of [[-27,-34,-1],[17,-44,1],[-7,-33,-1],[35,-51,1]]){path(c,[[x,y],[x+f*12,y+8],[x+f*8,y+23],[x+f*20,y+27],[x+f*22,y+32],[x+f*7,y+31],[x+f*2,y+22]],'#a58f54');claw(c,x+f*9,y+30,'#e2d2a4');}
 c.save();c.translate(a*5,-a*2);shape(c,[31,-99,30,-112,45,-117,55,-111,60,-108,62,-101,70,-100,75,-99,83,-101,87,-95,92,-88,77,-85,66,-87,51,-84,39,-87,31,-99],'#bd9d5a');shape(c,[55,-98,65,-101,72,-96,85,-97,91,-94,88,-89,79,-89,68,-89,61,-90,55,-98],'#e0c78f');shape(c,[56,-89,65,-89,76,-86,86,-91,80,-79,64,-78,56,-89],'#543c32');shape(c,[54,-86,64,-82,73,-81,81,-85,78,-77,63,-77,54,-86],'#c8ad73');ellipse(c,83,-94,1.7,1,ink,null);for(let i=0;i<4;i++)path(c,[[60+i*5,-90],[62+i*5,-84],[64+i*5,-90]],'#f0e4bb',null);eye(c,58,-103);path(c,[[72,-88],[71,-80],[76,-87]],'#f0e4bb',null);for(let i=0;i<3;i++)feather(c,51+i*3,-84,-.4+i*.1,19+i*4,3,'#9c8656','#d9c895');
 for(const [x,y] of [[39,-111],[51,-113]]){line(c,[[x,y],[x-10,y-12],[x-13,y-24]],'#b39762',3);line(c,[[x-7,y-9],[x+1,y-19]],'#b39762',2);}
 for(let i=0;i<6;i++)feather(c,39,-104+i*3,-1.5-i*.07,27+i*2,3,'#a68c57','#e0cea0');curve(c,[70,-91,91,-86,87,-75,98,-78],'#e4d3a0',1);curve(c,[67,-94,90,-102,87,-108,98,-104],'#e4d3a0',1);c.restore();medal(c,27,-70,6);
}
const painters={kui,xuanwu,bifang,yinglong};
function draw(c,e,time=0){const render=Object.prototype.hasOwnProperty.call(painters,e?.mythicId)?painters[e.mythicId]:null;if(!render){for(const art of [window.MythicCelestialArt,window.MythicAncientArt,window.MythicSkySeaArt])if(art?.draw(c,e,time))return true;return false;}const t=Number.isFinite(time)?time:0,seed=Number.isFinite(e.seed)?e.seed:0,dir=Number.isFinite(e.dir)?e.dir:0,active=!e.dead&&!(e.stun>0),s=active?Math.sin(t*7+seed):0,a=e.action>0?Math.sin(clamp(e.action)*Math.PI):0;
 c.save();try{if(e.dead)c.globalAlpha*=clamp(1-(t-(Number.isFinite(e.deathTime)?e.deathTime:t))/.36);else if(e.spawn>0)c.globalAlpha*=clamp(1-e.spawn/.8);c.translate(Number.isFinite(e.x)?e.x:0,Number.isFinite(e.y)?e.y:0);c.scale(Math.cos(dir)<-.1?-1.38:1.38,1.38);if(e.dead){const f=clamp((t-(Number.isFinite(e.deathTime)?e.deathTime:t))/.36);c.scale(1+f*.12,1-f*.5);}c.translate(a*2,active?Math.abs(s)*.75:0);render(c,t,s,a);if(e.hit>0&&!e.dead){c.globalAlpha*=clamp(e.hit/.13);line(c,[[-15,-72],[0,-81],[15,-72]],'#fff0c4',2);}}finally{c.restore();}return true;}
window.MythicBossArt=Object.freeze({draw,ids:Object.freeze(['kui','xuanwu','bifang','yinglong','qinglong','baihu','zhuque','qilin','baize','xiezhi','pixiu','luwu','taotie','hundun','taowu','qiongqi','jiuwei','chenghuang','zheng','bo','fenghuang','jinwu','kun','zhulong'])});
})();
