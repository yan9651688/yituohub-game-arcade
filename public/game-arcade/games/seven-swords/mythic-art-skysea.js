/* v32 trial apparitions. Reference: art-direction/mythic-expansion/skysea.
 * Projected groundpoint contract; no combat state mutation or ground effects. */
(()=>{'use strict';
const TAU=Math.PI*2,ink='#292c35',gold='#d9b369',clamp=x=>Math.max(0,Math.min(1,x));
function shape(c,p,f,s=ink,w=1){c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;){if(i+5<p.length){c.bezierCurveTo(...p.slice(i,i+6));i+=6;}else{c.lineTo(p[i],p[i+1]);i+=2;}}c.closePath();c.fillStyle=f;c.fill();if(s){c.strokeStyle=s;c.lineWidth=w;c.stroke();}}
function line(c,p,col,w=1){c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.stroke();}
function curve(c,p,col,w=1){c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=6)c.bezierCurveTo(...p.slice(i,i+6));c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.stroke();}
function ell(c,x,y,rx,ry,f,s=null){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=f;c.fill();if(s){c.strokeStyle=s;c.lineWidth=1;c.stroke();}}
function feather(c,x,y,a,l,w,b,t){c.save();c.translate(x,y);c.rotate(a);shape(c,[0,0,-w,-l*.2,-w,-l*.7,0,-l,w,-l*.7,w,-l*.2,0,0],b);shape(c,[0,-l*.58,-w*.6,-l*.8,0,-l*.97,0,-l,w*.5,-l*.76,w*.6,-l*.7,0,-l*.58],t,null);line(c,[0,-2,0,-l*.92],gold,.55);for(let i=1;i<5;i++){let yy=-l*i/6;line(c,[0,yy,w*.6,yy-l*.1],t,.4);}c.restore();}
function claw(c,x,y,flip=1){for(let i=0;i<3;i++)curve(c,[x,y,x+(i-1)*5,y+2,x+(i-1)*7,y+6,x+(i-1)*6+flip*2,y+8],gold,1.5);}
function eye(c,x,y,r=2){ell(c,x,y,r+1,r*.8,'#f8d875',ink);ell(c,x+.6,y,.7,r*.7,'#201e23');ell(c,x-.5,y-.6,.45,.45,'#fff8d8');}
function fenghuang(c,t,s,a){
 // Sweeping independent peacock-like tail ribbons, each with an eye spot.
 const colors=['#325e68','#705279','#bd6547','#568d77','#b4934e','#356e78'];
 for(let i=0;i<6;i++){let x=-81+i*6,y=-5-i*5+s*(i%2?1:-1)*1.7;curve(c,[-11,-50,-65,-51,-52,-94,x,y],ink,10);curve(c,[-11,-50,-65,-51,-52,-94,x,y],colors[i],8);curve(c,[-12,-49,-61,-47,-49,-84,x,y],gold,.8);ell(c,x,y,4.3,9,colors[(i+2)%6],gold);ell(c,x,y,2.4,4.7,'#214853');ell(c,x+.7,y,1.2,2.5,'#b98145');}
 for(const [x,y] of [[-5,-28],[18,-27]]){line(c,[x,y,x-3,y+15,x+3,y+24],'#9d824d',3);claw(c,x+3,y+24);}
 ell(c,4,-54,23,31,'#316f65',ink);shape(c,[14,-32,36,-50,22,-69,26,-84,31,-105,42,-111,46,-105,45,-90,34,-91,34,-76,37,-55,34,-35,14,-32],'#b68b45');
 for(let k=0;k<5;k++)for(let j=0;j<4;j++)feather(c,-6+j*7,-34-k*6,-.3,14,4,k%2?'#427e69':'#c29b50','#e4c278');
 c.save();c.translate(-5,-61);c.rotate(-s*.035-a*.15);for(let i=0;i<12;i++)feather(c,-i*.8,i*.5,-1.5+i*.095,83-i*2,7,'#dfc893',i%2?'#b65c3f':'#d8a65e');for(let i=0;i<10;i++)feather(c,-i*.8,4+i,-1.45+i*.09,52-i,6,'#286c65','#b4884a');for(let i=0;i<9;i++)feather(c,0,6+i,-1.4+i*.09,30,5,'#bb703f','#e2b863');c.restore();
 shape(c,[29,-79,20,-91,25,-105,34,-110,40,-116,52,-113,54,-107,52,-101,42,-105,40,-99,36,-90,40,-83,29,-79],'#dbad57');shape(c,[48,-108,57,-109,62,-105,62,-100,56,-102,53,-103,48,-104],'#e6c890');eye(c,46,-108,2);
 for(let i=0;i<6;i++)curve(c,[35+i*2,-111,25+i*2,-126,33+i*3,-125,29+i*4,-135-i%2*5],gold,1.7);
 for(let i=0;i<6;i++)feather(c,31,-100+i*2,-1.35-i*.15,26+i*2,2.5,'#ac4f3c','#d8a658');curve(c,[35,-83,25,-70,28,-62,23,-55],gold,2);
}
function jinwu(c,t,s,a){
 c.save();c.globalAlpha*=.65;c.strokeStyle=gold;c.lineWidth=1.3;c.beginPath();c.arc(25,-94,26,Math.PI*.7,Math.PI*2.4);c.stroke();c.restore();
 for(let wing=0;wing<2;wing++){c.save();c.translate(wing?13:-5,-61);c.rotate(s*.035*(wing?1:-1)-a*.13);for(let i=0;i<12;i++)feather(c,0,0,(wing?.35:-1.58)+i*.105,wing?57-i*.8:85-i,7,'#252b30','#c89c50');for(let i=0;i<9;i++)feather(c,0,3,(wing?.4:-1.5)+i*.12,wing?34:52,6,'#394047','#927444');c.restore();}
 for(let i=0;i<6;i++)feather(c,-8+i*3,-43,-2.2+i*.12,49-i*3,5,'#2b3137','#c89b4c');
 // Exactly three separated legs, with distinct endpoints and joint bends.
 for(const [x,y,dx] of [[-12,-37,-18],[3,-31,0],[18,-39,19]]){line(c,[x,y,x+dx*.45,y+15,x+dx,y+30],'#ba934e',3);line(c,[x,y+1,x+dx*.45,y+14,x+dx,y+28],'#61523b',1);claw(c,x+dx,y+30);}
 ell(c,5,-56,24,29,'#252c32',ink);for(let k=0;k<4;k++)for(let j=0;j<5;j++)feather(c,-11+j*7,-36-k*7,-.2,12,3,'#343a3d',k%2?'#9b7e45':'#575745');
 shape(c,[12,-71,9,-89,17,-105,30,-108,38,-114,50,-111,53,-104,61,-105,66,-105,69,-101,58,-100,52,-97,48,-91,41,-77,39,-68,25,-65,12,-71],'#303337');shape(c,[49,-104,56,-110,65,-108,72,-105,64,-103,57,-101,49,-101],'#716b53');line(c,[54,-103,68,-105],gold,.8);eye(c,43,-105,2.2);
 for(let i=0;i<7;i++)feather(c,22+i,-93+i*3,-1.65+i*.08,21,2.5,'#242b32','#b18a43');ell(c,21,-64,7,10,gold,ink);ell(c,21,-64,4.7,7,'#f4d487');curve(c,[15,-65,8,-71,4,-63,10,-61],gold,1);
}
function kun(c,t,s,a){
 c.save();c.translate(0,s*1.3-a*2);
 shape(c,[-64,-40,-94,-46,-106,-76,-91,-105,-96,-77,-78,-77,-73,-65,-64,-87,-44,-92,-38,-107,-36,-78,-53,-66,-61,-57,-62,-51,-61,-47,-64,-40],'#3e8097');
 for(let i=0;i<5;i++)curve(c,[-65,-54,-78-i*2,-68,-87-i*2,-72,-91,-94+i*4],'#79afbc',.7);
 shape(c,[-67,-48,-51,-71,-17,-80,21,-79,54,-91,76,-80,79,-60,82,-34,51,-18,9,-17,-30,-14,-58,-27,-67,-48],'#34768d');
 shape(c,[-63,-42,-31,-22,23,-38,73,-64,80,-43,54,-20,13,-19,-22,-16,-48,-23,-63,-42],'#d2c6a3');
 for(let i=0;i<9;i++)curve(c,[-48+i*3,-34,-20+i*3,-20,30+i*3,-28,70+i*.4,-57+i*.5],'#9c9f8b',.7);
 shape(c,[0,-44,-6,-35,-21,-18,-47,-7,-29,-4,8,-15,24,-38,19,-47,8,-47,0,-44],'#40849b');curve(c,[10,-40,1,-28,-15,-15,-36,-9],'#8bb9bd',1);
 shape(c,[43,-29,42,-19,50,-6,56,-3,57,-13,59,-23,60,-32,54,-31,47,-30,43,-29],'#2e657e');
 shape(c,[-39,-67,-26,-80,-17,-78,-10,-86,-15,-73,-8,-70,-4,-72,-16,-66,-26,-66,-39,-67],'#3b8096');
 curve(c,[-58,-49,-31,-29,26,-38,76,-62],'#23495f',1.4);eye(c,49,-61,2.6);curve(c,[42,-66,47,-70,54,-70,59,-67],'#8ebabb',1.3);
 for(const [x,y] of [[-43,-51],[-18,-65],[8,-63],[28,-73],[1,-39],[-12,-25],[-28,-14]]){curve(c,[x-5,y+3,x+8,y+7,x+9,y-8,x,y-6,x-7,y-5,x-4,y+3,x+1,y],gold,1.2);curve(c,[x+2,y+3,x+8,y+1,x+11,y+3,x+14,y-1],gold,.8);}
 for(let i=0;i<30;i++)ell(c,-52+(i*29)%116,-47-(i*13)%23,.6,.6,'#8bb6b9');c.restore();
}
function zhulong(c,t,s,a){
 const p=[-66,-6,-102,-31,-52,-64,-23,-33,2,-10,66,-24,43,-51,22,-75,-30,-62,-22,-89,-16,-108,7,-111,30,-108];
 curve(c,p,ink,25);curve(c,p,'#792e30',22);curve(c,[-66,-3,-95,-31,-51,-54,-23,-27,5,-4,72,-23,45,-56,21,-79,-26,-58,-17,-89,-11,-105,5,-105,30,-103],'#cead7e',7);
 // Dorsal spine ribbons and individually etched, staggered scales.
 for(let i=0;i<14;i++){let x=-65+i*7,y=-36+Math.sin(i*.45)*12;feather(c,x,y,-.7-i*.045,16+i%3*4,3,'#9e3c31','#d3663e');}
 for(let i=0;i<12;i++){let x=-18+Math.sin(i*.38)*18,y=-91+i*3;feather(c,x-11,y,-1.5,16+i%3*3,3,'#a43b30','#c75a3d');}
 // Follow the actual cubic spine so scale rows wrap the serpent, not its empty coil.
 for(let n=2;n<p.length;n+=6){let x0=p[n-2],y0=p[n-1],x1=p[n],y1=p[n+1],x2=p[n+2],y2=p[n+3],x3=p[n+4],y3=p[n+5];for(let k=1;k<12;k++){let u=k/12,v=1-u,x=v*v*v*x0+3*v*v*u*x1+3*v*u*u*x2+u*u*u*x3,y=v*v*v*y0+3*v*v*u*y1+3*v*u*u*y2+u*u*u*y3,dx=3*v*v*(x1-x0)+6*v*u*(x2-x1)+3*u*u*(x3-x2),dy=3*v*v*(y1-y0)+6*v*u*(y2-y1)+3*u*u*(y3-y2);c.save();c.translate(x,y);c.rotate(Math.atan2(dy,dx));for(let j=-1;j<=1;j++){shape(c,[-2,j*5,0,j*5-3,3,j*5-3,4,j*5,3,j*5+3,0,j*5+3,-2,j*5],j===1?'#be895e':k%2?'#974334':'#713433','#c68054',.55);}c.restore();}}
 c.save();c.translate(a*6,-a*2);shape(c,[21,-110,27,-123,42,-121,49,-116,51,-109,60,-109,66,-103,73,-102,78,-97,75,-91,65,-90,57,-91,50,-87,39,-91,25,-93,19,-103,21,-110],'#ad4636');shape(c,[49,-104,61,-102,64,-98,75,-98,77,-94,72,-92,66,-94,57,-94,50,-97,49,-104],'#d2714b');shape(c,[49,-93,59,-87,66,-92,73,-91,67,-82,56,-81,49,-93],'#432b2c');for(let i=0;i<4;i++)line(c,[53+i*5,-91,55+i*5,-86],'#e8c796',1.7);
 for(let i=0;i<6;i++)feather(c,27,-105+i*3,-1.6+i*.06,26+i*2,3,'#9d342b','#dc7444');
 for(const [x,y] of [[28,-115],[40,-118]]){line(c,[x,y,x-9,y-12,x-10,y-23],gold,2.8);line(c,[x-7,y-10,x+1,y-20],gold,1.7);}
 // One visible eye periodically closes; no human facial anatomy.
 if(Math.sin(t*.8)>.94)line(c,[43,-108,49,-107],gold,1.3);else eye(c,46,-108,2.4);curve(c,[39,-113,45,-115,50,-111,52,-108],'#e09a5f',1.2);line(c,[55,-102,61,-99,70,-97],'#6f2c2a',.8);
 curve(c,[64,-95,90,-88,77,-75,93,-78],gold,.9);curve(c,[62,-100,86,-104,76,-115,94,-115],gold,.9);for(let i=0;i<4;i++)feather(c,51+i*3,-86,-.3+i*.12,19,2,'#913b31','#d08b59');c.restore();
}
const painters=Object.freeze({fenghuang,jinwu,kun,zhulong});
function draw(c,e,time=0){if(!e||!Object.prototype.hasOwnProperty.call(painters,e.mythicId))return false;const t=Number.isFinite(time)?time:0,seed=Number.isFinite(e.seed)?e.seed:0,dir=Number.isFinite(e.dir)?e.dir:0,active=!e.dead&&!(e.stun>0),s=active?Math.sin(t*4+seed):0,a=active&&e.action>0?Math.sin(clamp(e.action)*Math.PI):0;c.save();try{if(e.dead)c.globalAlpha*=clamp(1-(t-(Number.isFinite(e.deathTime)?e.deathTime:t))/.36);else if(e.spawn>0)c.globalAlpha*=clamp(1-e.spawn/.8);c.translate(Number.isFinite(e.x)?e.x:0,Number.isFinite(e.y)?e.y:0);c.scale(Math.cos(dir)<-.1?-1.38:1.38,1.38);if(e.dead){let f=clamp((t-(Number.isFinite(e.deathTime)?e.deathTime:t))/.36);c.scale(1+f*.12,1-f*.5);}painters[e.mythicId](c,active?t:0,s,a);if(e.hit>0&&!e.dead){c.globalAlpha*=clamp(e.hit/.13);line(c,[-12,-74,0,-81,12,-74],'#fff2ce',2);}}finally{c.restore();}return true;}
window.MythicSkySeaArt=Object.freeze({ids:Object.freeze(Object.keys(painters)),draw});
})();
