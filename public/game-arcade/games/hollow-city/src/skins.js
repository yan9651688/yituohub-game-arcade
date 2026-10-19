(function(){'use strict';
// Cosmetic-only: no engine state, object geometry, timers or progress storage.
const catalog=Object.freeze([
Object.freeze({id:'original',name:'原初圈',note:'熟悉的城市入口',color:'#e7d9b1'}),
Object.freeze({id:'cat',name:'猫咪圈',note:'耳朵竖起，尾巴绕一圈',color:'#e9b790'}),
Object.freeze({id:'nailong',name:'奶龙圈',note:'圆顶软坡，像一小座奶油山',color:'#f8cf48'}),
Object.freeze({id:'bunny',name:'月兔圈',note:'带一点月光去散步',color:'#c5c9ef'}),
Object.freeze({id:'panda',name:'熊猫圈',note:'黑白软团，慢慢逛街',color:'#e9e9dc'}),
Object.freeze({id:'fox',name:'赤狐圈',note:'尖尖耳朵，暖橙色的陪伴',color:'#de976b'}),
Object.freeze({id:'bear',name:'蜜熊圈',note:'一口蜂蜜色的好心情',color:'#cda46d'}),
Object.freeze({id:'sprout',name:'新芽圈',note:'小小叶片，向阳生长',color:'#a8c792'}),
Object.freeze({id:'cloud',name:'云朵圈',note:'把一朵轻云装进口袋',color:'#d8e8ed'}),
Object.freeze({id:'peach',name:'蜜桃圈',note:'桃粉色的软甜漫游',color:'#efafb2'}),
Object.freeze({id:'star',name:'星星圈',note:'捡起一颗暖金色星星',color:'#efd17f'}),
Object.freeze({id:'planet',name:'星环圈',note:'沿着小行星的轨道旅行',color:'#adaed8'})]);
const KEY='hollow-city-skin-v1';
function valid(id){return catalog.some(s=>s.id===id)?id:'original';}
function load(){try{return valid(localStorage.getItem(KEY));}catch(e){return 'original';}}
function save(id){id=valid(id);try{localStorage.setItem(KEY,id);return true;}catch(e){return false;}}
function draw(c,id,x,y,rx,ry){
if(valid(id)==='original')return;
const d=Math.min(19,Math.max(8,rx*.32)),rim=Math.min(7,Math.max(3,rx*.085));
c.save();c.translate(x,y);c.lineCap='round';c.lineJoin='round';
// Exclude the physical opening: the inner ellipse is identical for every skin.
c.beginPath();c.rect(-rx-80,-ry-90,rx*2+160,ry*2+180);c.ellipse(0,0,rx+2.5,ry+2.5,0,0,Math.PI*2);c.clip('evenodd');
const ellipse=(x,y,a,b,fill,stroke)=>{c.beginPath();c.ellipse(x,y,a,b,0,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1.1;c.stroke();}};
const line=(pts,col,width)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=col;c.lineWidth=width;c.stroke();};
const palettes={panda:['#e9e9dc','#7b8176'],fox:['#de976b','#98604e'],bear:['#cda46d','#96734d'],sprout:['#a8c792','#688d69'],cloud:['#d8e8ed','#7da1ad'],peach:['#efafb2','#b87780'],star:['#efd17f','#aa8845'],planet:['#adaed8','#7479a6']};
const fill=id==='cat'?'#e9b790':id==='nailong'?'#f8cf48':(palettes[id]?.[0]||'#c5c9ef'),edge=id==='cat'?'#86604c':id==='nailong'?'#b18a2d':(palettes[id]?.[1]||'#777fa8');
c.beginPath();c.ellipse(0,1,rx+rim*.5+2.5,ry+rim*.5+2.5,0,0,Math.PI*2);c.lineWidth=rim;c.strokeStyle=edge;c.stroke();
c.beginPath();c.ellipse(0,-.5,rx+rim*.5+2.5,ry+rim*.5+2.5,0,0,Math.PI*2);c.lineWidth=rim*.8;c.strokeStyle=fill;c.stroke();
const hy=-ry-d*.52-2;
if(id==='cat'){
// Curled tail and two triangular ears are a silhouette, never an emoji glyph.
c.beginPath();c.moveTo(rx*.86,ry*.45);c.bezierCurveTo(rx+d*1.1,ry*.25,rx+d*1.3,-d*.6,rx+d*.3,-d*.4);c.bezierCurveTo(rx-d*.1,-d*.3,rx+d*.3,d*.3,rx+d*.55,-d*.1);c.strokeStyle=edge;c.lineWidth=d*.31;c.stroke();c.strokeStyle=fill;c.lineWidth=d*.21;c.stroke();
for(const side of [-1,1]){c.beginPath();c.moveTo(side*d*.94,hy+d*.3);c.lineTo(side*d*.89,hy-d*.91);c.lineTo(side*d*.22,hy-d*.3);c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=edge;c.lineWidth=1;c.stroke();line([[side*d*.76,hy-d*.47],[side*d*.66,hy-d*.16]],'#d68d84',d*.13);}
ellipse(0,hy,d,d*.6,fill,edge);
for(const side of [-1,1]){line([[side*d*.3,hy-d*.03],[side*d*.3,hy+d*.1]],'#4e4542',Math.max(1.2,d*.095));line([[side*d*.64,hy+d*.13],[side*d*.88,hy+d*.2]],'#986958',1);ellipse(side*rx*.64,ry*.8+rim*.45,d*.35,d*.23,'#f2d2b4',edge);}
ellipse(0,hy+d*.19,d*.105,d*.07,'#a66567');line([[0,hy+d*.23],[0,hy+d*.33]],'#815747',1);
}else if(id==='nailong'){
// Reference silhouette: a rounded yellow dome falls into two soft, flared
// bell-curve slopes. No frog head, ears, limbs, or separate circular face.
const w=Math.min(36,Math.max(19,rx*.66)),h=Math.min(37,Math.max(24,rx*.76)),base=-ry+1;
c.beginPath();c.moveTo(-w,base);c.bezierCurveTo(-w*.56,base-h*.2,-w*.48,base-h*.48,-w*.38,base-h*.73);c.bezierCurveTo(-w*.3,base-h*1.06,w*.3,base-h*1.06,w*.38,base-h*.73);c.bezierCurveTo(w*.48,base-h*.48,w*.56,base-h*.2,w,base);c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle='#d4ac3b';c.lineWidth=1;c.stroke();
// Warm shoulder highlight keeps the smooth mound readable at the smallest size.
c.beginPath();c.moveTo(-w*.28,base-h*.81);c.bezierCurveTo(-w*.2,base-h*.99,w*.19,base-h*.99,w*.28,base-h*.81);c.strokeStyle='#ffe788';c.lineWidth=Math.max(1.4,h*.065);c.stroke();
for(const side of [-1,1]){ellipse(side*w*.235,base-h*.65,w*.115,h*.135,'#85ad54');ellipse(side*w*.236,base-h*.65,w*.059,h*.079,'#254830');ellipse(side*w*.25-w*.018,base-h*.684,w*.019,h*.026,'#b6d98c');}
c.beginPath();c.moveTo(-w*.16,base-h*.44);c.quadraticCurveTo(0,base-h*.405,w*.17,base-h*.44);c.strokeStyle='#997525';c.lineWidth=Math.max(1.1,h*.04);c.stroke();
}else if(id==='bunny'){
for(const side of [-1,1]){ellipse(side*d*.44,hy-d*.57,d*.25,d*.81,fill,edge);ellipse(side*d*.44,hy-d*.62,d*.1,d*.53,'#eee0e9');}
ellipse(0,hy,d*.83,d*.59,'#e1e1f7',edge);for(const side of [-1,1]){ellipse(side*d*.29,hy,d*.06,d*.085,'#626781');ellipse(side*d*.5,hy+d*.18,d*.15,d*.07,'#d6acc6');}ellipse(0,hy+d*.15,d*.07,d*.05,'#a184a3');
ellipse(rx*.98,ry*.32,d*.25,d*.25,'#f4edca',edge);
}else if(id==='panda'||id==='bear'){
for(const side of [-1,1])ellipse(side*d*.73,hy-d*.49,d*.33,d*.33,id==='panda'?'#56605b':fill,edge);
ellipse(0,hy,d,d*.75,fill,edge);
for(const side of [-1,1]){if(id==='panda')ellipse(side*d*.38,hy-d*.03,d*.22,d*.27,'#56605b');ellipse(side*d*.37,hy-d*.025,d*.065,d*.095,id==='panda'?'#fbf7df':'#4e5040');}
ellipse(0,hy+d*.27,d*.38,d*.23,id==='panda'?'#f7f5e5':'#edcf99');ellipse(0,hy+d*.21,d*.105,d*.08,'#55554a');line([[0,hy+d*.29],[0,hy+d*.38]],'#77705a',1);
}else if(id==='fox'){
for(const side of [-1,1]){c.beginPath();c.moveTo(side*d*.86,hy+d*.02);c.lineTo(side*d*.89,hy-d*.95);c.lineTo(side*d*.2,hy-d*.42);c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=edge;c.lineWidth=1;c.stroke();}
c.beginPath();c.moveTo(-d,hy-d*.2);c.quadraticCurveTo(0,hy-d*.89,d,hy-d*.2);c.quadraticCurveTo(d*.7,hy+d*.55,0,hy+d*.75);c.quadraticCurveTo(-d*.7,hy+d*.55,-d,hy-d*.2);c.fillStyle=fill;c.fill();c.strokeStyle=edge;c.stroke();
for(const side of [-1,1]){ellipse(side*d*.4,hy+d*.24,d*.43,d*.28,'#f8e8c9');ellipse(side*d*.38,hy+d*.02,d*.065,d*.08,'#624b40');}ellipse(0,hy+d*.41,d*.1,d*.07,'#624b40');
}else if(id==='sprout'){
line([[0,hy+d*.42],[0,hy-d*.35]],'#6b9364',d*.14);
for(const side of [-1,1]){c.beginPath();c.moveTo(0,hy-d*.08);c.bezierCurveTo(side*d*1.02,hy-d*.02,side*d*1.18,hy-d*.94,side*d*.92,hy-d*1.03);c.bezierCurveTo(side*d*.25,hy-d*.91,side*d*.04,hy-d*.58,0,hy-d*.08);c.fillStyle=side<0?'#b9d59a':'#80ad76';c.fill();c.strokeStyle=edge;c.lineWidth=1;c.stroke();}
ellipse(-rx*.76,ry*.69,d*.27,d*.19,'#e9ddb3',edge);
}else if(id==='cloud'){
c.beginPath();c.moveTo(-d*1.2,hy+d*.35);c.bezierCurveTo(-d*1.75,hy-d*.14,-d*.94,hy-d*.85,-d*.55,hy-d*.48);c.bezierCurveTo(-d*.39,hy-d*1.25,d*.61,hy-d*1.13,d*.72,hy-d*.42);c.bezierCurveTo(d*1.51,hy-d*.71,d*1.84,hy+d*.37,d*1.03,hy+d*.43);c.closePath();c.fillStyle='#f2f5e9';c.fill();c.strokeStyle=edge;c.lineWidth=1;c.stroke();
for(const side of [-1,1]){ellipse(side*d*.38,hy,d*.055,d*.085,'#7c9598');ellipse(side*d*.58,hy+d*.16,d*.14,d*.06,'#d4c1c7');}
}else if(id==='peach'){
c.beginPath();c.moveTo(0,hy-d*.56);c.bezierCurveTo(-d*1.04,hy-d*1.11,-d*1.48,hy+d*.22,0,hy+d*.87);c.bezierCurveTo(d*1.48,hy+d*.22,d*1.04,hy-d*1.11,0,hy-d*.56);c.fillStyle=fill;c.fill();c.strokeStyle=edge;c.lineWidth=1;c.stroke();
c.beginPath();c.moveTo(0,hy-d*.57);c.quadraticCurveTo(d*.2,hy-d*.02,0,hy+d*.58);c.strokeStyle='#d28c97';c.stroke();ellipse(d*.42,hy-d*.66,d*.4,d*.15,'#95b882','#759268');
}else if(id==='star'){
c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=d*(i%2?.5:1.05),px=Math.cos(a)*r,py=hy+Math.sin(a)*r;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=edge;c.lineWidth=1.1;c.stroke();
for(const side of [-1,1])ellipse(side*d*.24,hy,d*.055,d*.075,'#97783f');ellipse(rx*.92,ry*.38,d*.2,d*.14,'#f4e8b4',edge);
}else if(id==='planet'){
ellipse(0,hy,d*.89,d*.86,fill,edge);
c.save();c.translate(0,hy);c.rotate(-.35);c.beginPath();c.ellipse(0,0,d*1.38,d*.33,0,0,Math.PI);c.strokeStyle='#edd6a5';c.lineWidth=d*.24;c.stroke();c.restore();ellipse(-d*.27,hy-d*.26,d*.17,d*.12,'#d1d4eb');ellipse(rx*.97,ry*.29,d*.21,d*.2,'#e4d5a3',edge);

}
c.restore();
}
window.HCSkins=Object.freeze({catalog,valid,load,save,draw,storageKey:KEY});
})();
