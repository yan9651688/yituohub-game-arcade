/* 锁妖塔六境。装饰不参与碰撞，1600×1100 战斗区域保持完整。 */
(function(global){
 'use strict';
 const IX=Math.sqrt(3)/2,TAU=Math.PI*2;
 const P=(x,y,z=0)=>({x:(x-y)*IX,y:(x+y)*.5-z});
 const THEMES={
  bamboo:{name:'青竹灵庭',outer:'#123b32',floor:'#60785a',edge:'#b5ba88',dark:'#304d3c',light:'#bed68b'},
  lava:{name:'熔火地宫',outer:'#250e13',floor:'#44363b',edge:'#a76645',dark:'#271e29',light:'#ffb158'},
  ice:{name:'寒玉冰窟',outer:'#173d60',floor:'#96b8c6',edge:'#d0eff3',dark:'#436e8c',light:'#e5fbff'},
  lotus:{name:'幽莲水殿',outer:'#103d48',floor:'#527779',edge:'#99b7ad',dark:'#214c5b',light:'#dda7d3'},
  sand:{name:'赤砂古陵',outer:'#67432c',floor:'#a77f52',edge:'#d7b477',dark:'#775036',light:'#efd79d'},
  astral:{name:'星穹祭坛',outer:'#10132d',floor:'#363c62',edge:'#b3a06d',dark:'#222744',light:'#d7c99a'}
 };
 const ORDER=Object.keys(THEMES);
 function themeForFloor(floor){return ORDER[Math.floor((Math.max(1,Number(floor)||1)-1)/5)%ORDER.length];}
 function poly(c,pts,fill,stroke){c.beginPath();pts.forEach((p,i)=>{const q=P(...p);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y);});c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
 function line(c,pts,color,width=1){c.beginPath();pts.forEach((p,i)=>{const q=P(...p);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y);});c.strokeStyle=color;c.lineWidth=width;c.stroke();}
 function box(c,x,y,w,d,h,top,side,z=0){poly(c,[[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]],side);poly(c,[[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]],side);poly(c,[[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],top);}
 function ring(c,x,y,r,col,width=1){let pts=[];for(let i=0;i<=80;i++){const a=i*TAU/80;pts.push([x+Math.cos(a)*r,y+Math.sin(a)*r,1]);}line(c,pts,col,width);}
 function disk(c,x,y,rx,ry,color,z=0){const q=P(x,y,z);c.fillStyle=color;c.beginPath();c.ellipse(q.x,q.y,rx,ry,0,0,TAU);c.fill();}
 function create(opts={}){
  const width=opts.width||1600,height=opts.height||1100,theme=THEMES[opts.theme]?opts.theme:themeForFloor(opts.floor),t=THEMES[theme],cx=width/2,cy=height/2;
  const props=[];let disposed=false,cache=null;
  // Tall decoration remains behind/outside the battle rectangle. Near edges get short versions.
  for(let x=70;x<width;x+=230)props.push({x,y:-48,h:140+(x%3)*20,type:theme});
  for(let y=170;y<height;y+=245)props.push({x:-55,y,h:145,type:theme});
  for(let y=180;y<height;y+=310)props.push({x:width+40,y,h:45,type:theme});
  for(let x=130;x<width;x+=340)props.push({x,y:height+38,h:36,type:theme});
  function rect(c,x,y,w,h,color,z=0){poly(c,[[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z]],color);}
  function ground(c){
   rect(c,-600,-600,width+1200,height+1200,t.outer,-35);
   if(theme==='bamboo'){
    // The garden is grass, crossed by wide pale stepping-stone promenades, not a tiled hall.
    rect(c,-110,-110,width+220,height+220,'#275749',-15);
    for(let y=-90;y<height+100;y+=34)line(c,[[-100,y,-12],[width+100,y,-12]],'#33705e',1);
    box(c,-16,-16,width+32,height+32,16,t.floor,t.dark,-16);
    for(let y=38;y<height;y+=55)for(let x=34;x<width;x+=73){const n=(x*11+y*7)%17;line(c,[[x,y,0],[x+3,y-5-n*.2,0],[x+7,y,0]],n<8?'#6b835e':'#526e50',1);}
    for(let y=8;y<height;y+=110)rect(c,cx-155+(y%3)*5,y,300,102,'#a1a58a');
    for(let x=8;x<width;x+=130)rect(c,x,cy-105,122,210,'#a1a58a');
    for(let i=0;i<3;i++)ring(c,cx,cy,160+i*18,'#7b9472',2);
    // Simple wooden bridges cross the decorative perimeter stream.
    for(let i=0;i<8;i++){rect(c,cx-85+i*22,-116,19,114,'#a28b61');rect(c,-116,cy-85+i*22,114,19,'#a28b61');}
   }else if(theme==='lava'){
    // Broken magma channels surround an intact basalt arena.
    rect(c,-100,-100,width+200,height+200,'#a3321e',-14);
    for(let i=0;i<22;i++){let x=i*93-80;line(c,[[x,-85,-13],[x+60,-40,-13],[x+15,-13,-13]],'#ef7934',5);}
    for(let y=-80;y<height+100;y+=95){line(c,[[-85,y,-13],[-35,y+50,-13],[-18,y+15,-13]],'#fca34a',6);line(c,[[width+20,y,-13],[width+68,y+35,-13]],'#df6b2e',4);}
    box(c,-10,-10,width+20,height+20,27,t.floor,t.dark,-27);
    for(let y=0;y<height;y+=145)for(let x=0;x<width;x+=180){let d=(y/145)%2*35;poly(c,[[x+6,y+8],[Math.min(width,x+170),y+3],[Math.min(width,x+177),Math.min(height,y+125)],[x+30+d,Math.min(height,y+138)]],(x+y)%3?'#493c40':'#3b3038','#594448');}
    // Fine mineral seams are subdued; orange hazard-like brightness stays off the walkable floor.
    for(let x=120;x<width;x+=350)line(c,[[x,30],[x+30,130],[x-12,230]],'#745147',2);
    ring(c,cx,cy,210,'#826054',3);ring(c,cx,cy,224,'#66504a',2);
   }else if(theme==='ice'){
    // A glacial shelf with irregular polygonal plates and cold blue fissures.
    box(c,-18,-18,width+36,height+36,45,t.floor,'#4b829e',-45);
    for(let y=0;y<height;y+=150)for(let x=0;x<width;x+=190){poly(c,[[x+2,y+4],[Math.min(width,x+165),y+2],[Math.min(width,x+189),Math.min(height,y+90)],[Math.min(width,x+142),Math.min(height,y+147)],[x+5,Math.min(height,y+144)]],['#9dbfcc','#a7c7d1','#8eb2c2'][(x/190+y/150)%3],'#7da6ba');}
    for(let j=0;j<4;j++){const x=180+j*350;line(c,[[x,30],[x+50,160],[x+10,260],[x+110,380]],'#bddde4',2);}
    // Frost rosette, flat and faint under units.
    for(let j=0;j<6;j++){const a=j*TAU/6,x=cx+Math.cos(a)*230,y=cy+Math.sin(a)*230;line(c,[[cx,cy],[x,y]],'#b9d7dd',3);for(const s of [-1,1])line(c,[[cx+(x-cx)*.65,cy+(y-cy)*.65],[cx+(x-cx)*.7+Math.cos(a+s*.8)*65,cy+(y-cy)*.7+Math.sin(a+s*.8)*65]],'#b9d7dd',2);}
   }else if(theme==='lotus'){
    // Open water beyond a complete jade platform; no fake holes in the combat surface.
    for(let y=-400;y<height+400;y+=70)for(let x=-400;x<width+400;x+=190)line(c,[[x,y,-20],[x+45,y+6,-20],[x+100,y-2,-20]],'#27606b',2);
    box(c,-12,-12,width+24,height+24,30,t.floor,t.dark,-30);
    for(let y=0;y<height;y+=180)for(let x=0;x<width;x+=240)rect(c,x+3,y+3,Math.min(234,width-x-3),Math.min(174,height-y-3),((x/240+y/180)%2)?'#557a7b':'#5d8080');
    // Broad bridge approaches and concentric ripples etched in the platform.
    box(c,cx-115,-220,230,210,18,'#84a39b','#315967',-10);
    box(c,-220,cy-110,210,220,18,'#84a39b','#315967',-10);
    for(const r of [160,186,225])ring(c,cx,cy,r,'#7f9c94',2);
    for(let i=0;i<16;i++){const a=i*TAU/16;poly(c,[[cx+Math.cos(a)*120,cy+Math.sin(a)*120],[cx+Math.cos(a-.15)*190,cy+Math.sin(a-.15)*190],[cx+Math.cos(a)*215,cy+Math.sin(a)*215],[cx+Math.cos(a+.15)*190,cy+Math.sin(a+.15)*190]],null,'#86a69c');}
   }else if(theme==='sand'){
    rect(c,-150,-150,width+300,height+300,'#b58a55',-15);
    for(let y=-100;y<height+150;y+=50)line(c,[[-130,y,-14],[width+140,y+28,-14]],'#c39a65',2);
    box(c,-15,-15,width+30,height+30,20,t.floor,t.dark,-20);
    for(let y=0;y<height;y+=115)for(let x=0;x<width;x+=230)rect(c,x+3,y+3,Math.min(224,width-x-3),Math.min(109,height-y-3),['#af8758','#a57c50','#b38b5e'][(x/230+y/115)%3]);
    // Stepped funerary friezes mark the edge, while the centre stays quiet.
    for(let x=40;x<width-40;x+=72)line(c,[[x,46],[x+18,46],[x+18,65],[x+42,65],[x+42,46],[x+57,46]],'#d0ad73',4);
    for(const d of [170,195])poly(c,[[cx,cy-d],[cx+d,cy],[cx,cy+d],[cx-d,cy]],null,'#c6a16a');
    line(c,[[cx-90,cy+30],[cx-35,cy-55],[cx,cy-15],[cx+35,cy-55],[cx+90,cy+30]],'#c9a772',5);
    // Sandstone rear walls are stepped and carved, unlike the other five environments.
    box(c,-25,-48,width+50,28,105,'#c19a65','#815a3b');
    box(c,-48,-20,28,height+40,90,'#bc925d','#805536');
    for(let x=80;x<width;x+=125){line(c,[[x,-19,20],[x+25,-19,70],[x+50,-19,20]],'#d6b27b',3);line(c,[[x+25,-19,85],[x+25,-19,96]],'#e6c28b',3);}
   }else{
    // Void outside, an unbroken celestial dais inside; stars never compete with combat tells.
    for(let i=0;i<120;i++){const x=(i*317)%2700-500,y=(i*173)%2100-500;if(x>=-20&&x<=width+20&&y>=-20&&y<=height+20)continue;disk(c,x,y,1+(i%3)*.6,1+(i%3)*.6,i%4?'#676e9a':'#c7b790',-25);}
    box(c,-20,-20,width+40,height+40,35,t.floor,t.dark,-35);
    for(let y=0;y<height;y+=170)for(let x=0;x<width;x+=210)rect(c,x+2,y+2,Math.min(206,width-x-2),Math.min(166,height-y-2),((x/210+y/170)%2)?'#3b4269':'#353b61');
    for(const r of [125,180,230,270,430])ring(c,cx,cy,r,r===430?'#696a80':'#918766',r===230?3:1.5);
    for(let i=0;i<12;i++){const a=i*TAU/12;line(c,[[cx+Math.cos(a)*245,cy+Math.sin(a)*245],[cx+Math.cos(a)*264,cy+Math.sin(a)*264]],'#aa9b73',3);}
    const pts=[];for(let i=0;i<7;i++){const a=i*TAU/7;pts.push([cx+Math.cos(a)*140,cy+Math.sin(a)*140]);}for(let i=0;i<7;i++){line(c,[pts[i],pts[(i+3)%7]],'#6f7181',1);disk(c,...pts[i],4,2,'#b0a782',1);}
   }
   // Shared visual boundary is a flat inlay, not an invisible/colliding rail.
   for(const inset of [14,24])poly(c,[[inset,inset,1],[width-inset,inset,1],[width-inset,height-inset,1],[inset,height-inset,1]],null,t.edge);
  }
  function crystal(c,p){for(let i=0;i<3;i++){const x=p.x+(i-1)*24,y=p.y+(i%2)*14,h=p.h*(i===1?1:.65);poly(c,[[x-16,y,0],[x-16,y,h*.65],[x,y,h],[x+16,y,h*.65],[x+16,y,0]],i===1?'#c4f0f4':'#85c3da','#e0fcff');poly(c,[[x,y,0],[x,y,h],[x+16,y,h*.65],[x+16,y,0]],'#78b0cc');}}
  function drawProp(c,p,time){
   if(theme==='bamboo'){
    for(let i=0;i<4;i++){const x=p.x+(i-1.5)*17,y=p.y+(i%2)*12,h=p.h*(.8+i*.08);line(c,[[x,y,0],[x+8,y,h]],'#254c35',7);line(c,[[x+2,y,0],[x+10,y,h]],'#7b9d58',2);for(let z=25;z<h;z+=27){line(c,[[x-3,y,z],[x+10,y,z]],'#b4ba78',2);if(z>h*.5)for(const sign of [-1,1]){line(c,[[x+5,y,z],[x+sign*38,y,z+22]],'#426e3e',2);poly(c,[[x+sign*18,y,z+12],[x+sign*48,y,z+33],[x+sign*34,y,z+9]],'#668c4e');}}
    }
   }else if(theme==='ice')crystal(c,p);
   else if(theme==='lotus'){
    for(let i=0;i<3;i++){const x=p.x+(i-1)*32,y=p.y+(i%2)*20;disk(c,x,y,30,14,'#326c59',-10);line(c,[[x,y,-8],[x+18,y+8,-8]],'#77a479',1);if(i===1){for(let a=0;a<5;a++){const q=P(x,y,3);c.fillStyle=a%2?'#dcb1d4':'#b483b7';c.beginPath();c.ellipse(q.x+Math.cos(a*TAU/5)*8,q.y+Math.sin(a*TAU/5)*4,7,13,(a-2)*.45,0,TAU);c.fill();}disk(c,x,y,5,3,'#e6d598',8);}}
    if(p.h>80){box(c,p.x-12,p.y-12,24,24,95,'#86a79f','#376570');box(c,p.x-26,p.y-26,52,52,9,'#a0b7a8','#476b71',95);}
   }else if(theme==='lava'){
    poly(c,[[p.x-38,p.y,0],[p.x-30,p.y,p.h*.65],[p.x-8,p.y,p.h],[p.x+12,p.y,p.h*.8],[p.x+37,p.y,0]],'#322731','#765044');line(c,[[p.x-8,p.y,5],[p.x+4,p.y,p.h*.45],[p.x-8,p.y,p.h*.7]],'#c66535',3);
    const q=P(p.x,p.y,p.h*.5),r=9+Math.sin(time/300+p.x)*2;c.fillStyle='#ee8b40';c.beginPath();c.ellipse(q.x,q.y,r*.5,r,0,0,TAU);c.fill();
   }else if(theme==='sand'){
    box(c,p.x-32,p.y-28,64,56,14,'#d2ae77','#86613e');box(c,p.x-23,p.y-20,46,40,p.h,'#be955e','#91683f');box(c,p.x-34,p.y-29,68,58,10,'#d2b17d','#8b643e',p.h);for(let z=25;z<p.h-15;z+=26)line(c,[[p.x-12,p.y+21,z],[p.x,p.y+21,z+10],[p.x+12,p.y+21,z]],'#e4bf80',3);
   }else{
    box(c,p.x-28,p.y-28,56,56,12,'#80795c','#282c4b');poly(c,[[p.x-18,p.y,12],[p.x-12,p.y,p.h],[p.x,p.y,p.h+20],[p.x+12,p.y,p.h],[p.x+18,p.y,12]],'#535b86','#b6a775');line(c,[[p.x,p.y,24],[p.x,p.y,p.h-5]],'#c5bc92',2);if(p.h>80){ring(c,p.x,p.y,42,'#9c916d',2);const q=P(p.x,p.y,p.h+25);c.strokeStyle='#c0b27e';c.lineWidth=2;c.beginPath();c.arc(q.x,q.y,20,0,TAU);c.stroke();}
   }
  }
  function worldView(c,cam,draw){const q=P(cam.x,cam.y);c.save();c.translate(cam.width/2-q.x*cam.zoom,cam.height/2-q.y*cam.zoom);c.scale(cam.zoom,cam.zoom);draw();c.restore();}
  function drawGround(c,cam,time){if(disposed)return;worldView(c,cam,()=>{if(!cache&&global.document?.createElement){const cv=global.document.createElement('canvas');cv.width=Math.ceil((width+height+1200)*IX);cv.height=Math.ceil((width+height)/2+900);const cc=cv.getContext?.('2d');if(cc){cache={cv,x:-(height+600)*IX,y:-650};cc.translate(-cache.x,-cache.y);ground(cc);}}if(cache)c.drawImage(cache.cv,cache.x,cache.y);else ground(c);});}
  return{drawGround,getDrawables(cam,time,player){if(disposed)return[];return props.map(p=>({depth:p.x+p.y,draw(c){worldView(c,cam,()=>{c.save();if(player&&p.x+p.y>player.x+player.y&&Math.abs((p.x-p.y)-(player.x-player.y))<100)c.globalAlpha*=.3;drawProp(c,p,time);c.restore();});}}));},dispose(){disposed=true;if(cache){cache.cv.width=1;cache.cv.height=1;}cache=null;},getStats(){return{width,height,theme,name:t.name,props:props.length,disposed,cached:!!cache};}};
 }
 global.SevenTowerScene={create,themeForFloor,themes:ORDER.slice()};
})(window);
