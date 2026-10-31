/* 锁妖塔：共享世界投影和纵深的独立多层古塔。 */
(function(global){
  'use strict';
  function draw(ctx,scene,camera,time=0,player,groundOnly=false){
    const b=scene.tower?.building;if(!b)return;const k=camera.zoom||1,z=scene.heightAt(b.x,b.y),J=global.JianghuScene;
    const P=(x,y,h=0)=>J.screen(b.x+x,b.y+y,z+h,camera);
    const poly=(pts,fill,stroke='#344846',lw=1)=>{ctx.beginPath();pts.forEach((p,i)=>{const q=P(...p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)});ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw*k;ctx.stroke();}};
    const line=(pts,color,width=1)=>{ctx.beginPath();pts.forEach((p,i)=>{const q=P(...p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)});ctx.strokeStyle=color;ctx.lineWidth=width*k;ctx.stroke();};
    const box=(r,h0,h,colors)=>{poly([[-r,r,h0],[r,r,h0],[r,r,h0+h],[-r,r,h0+h]],colors[1]);poly([[r,r,h0],[r,-r,h0],[r,-r,h0+h],[r,r,h0+h]],colors[2]);poly([[-r,-r,h0+h],[r,-r,h0+h],[r,r,h0+h],[-r,r,h0+h]],colors[0]);};
    ctx.save();
    // Stone courtyard remains at ground depth and does not hide actors crossing it.
    if(groundOnly){poly([[-145,-145,0],[145,-145,0],[145,220,0],[-145,220,0]],'#aeb6a4','#7e8e7d',1.2);
    for(let a=-140;a<=140;a+=35)line([[a,-140,.3],[a,215,.3]],'#879a8938',.7);
    for(let a=-140;a<=215;a+=35)line([[-140,a,.3],[140,a,.3]],'#879a8938',.7);
    ctx.restore();return;}
    // Fade upper mass only when player walks behind it, preserving readable exploration.
    if(player&&player.x+player.y<b.x+b.y&&Math.hypot(player.x-b.x,player.y-b.y)<330)ctx.globalAlpha=.48;
    box(106,0,17,['#d4d6bf','#939e8e','#7a8c82']);box(95,17,12,['#c5cbb7','#8e9b8c','#6e8278']);
    for(let level=0;level<4;level++){
      const r=88-level*12,base=29+level*79,h=61;
      box(r,base,h,['#b7bda5','#879991','#617b76']);
      for(const x of [-r+9,r-9]){line([[x,r,base+3],[x,r,base+h]],'#b9b589',4);line([[r,x,base+3],[r,x,base+h]],'#939e80',4);}
      if(level===0){poly([[-28,r+.5,base],[28,r+.5,base],[28,r+.5,base+43],[16,r+.5,base+55],[-16,r+.5,base+55],[-28,r+.5,base+43]],'#263e3d','#c1bb88',2);line([[0,r+1,base],[0,r+1,base+49]],'#8ca591',1);for(const x of [-13,13])line([[x,r+1,base+16],[x,r+1,base+39]],'#6ca89c',2);}
      else for(const x of [-r*.43,r*.43]){poly([[x-9,r+.5,base+15],[x+9,r+.5,base+15],[x+9,r+.5,base+43],[x-9,r+.5,base+43]],'#243f3e','#a4ac86',1);line([[x,r+1,base+18],[x,r+1,base+40]],'#92b6a0',1.1);}
      const roof=base+h+2,e=r+21;
      poly([[-e,-e,roof-4],[e,-e,roof-4],[r*.62,-r*.62,roof+20],[-r*.62,-r*.62,roof+20]],'#577b74');
      poly([[e,-e,roof-4],[e,e,roof-4],[r*.62,r*.62,roof+20],[r*.62,-r*.62,roof+20]],'#365f5c');
      poly([[e,e,roof-4],[-e,e,roof-4],[-r*.62,r*.62,roof+20],[r*.62,r*.62,roof+20]],'#49746a');
      poly([[-e,e,roof-4],[-e,-e,roof-4],[-r*.62,-r*.62,roof+20],[-r*.62,r*.62,roof+20]],'#6b8b79');
      line([[-e-6,e+6,roof+3],[-e,e,roof-4],[e,e,roof-4],[e+6,e+6,roof+3]],'#c8bc86',2.3);
      line([[e+6,e+6,roof+3],[e,e,roof-4],[e,-e,roof-4],[e+6,-e-6,roof+3]],'#9fa77e',2);
      for(let a=-r;a<=r;a+=12)line([[a,e,roof-3],[a*.62,r*.62,roof+19]],'#95ae8f55',.8);
      for(const x of [-e,e]){line([[x,e,roof-5],[x,e,roof-16]],'#bbb783',1);const q=P(x,e,roof-17);ctx.fillStyle='#b4b387';ctx.beginPath();ctx.ellipse(q.x,q.y,3*k,4*k,0,0,Math.PI*2);ctx.fill();}
    }
    const top=29+3*79+61+22;line([[0,0,top],[0,0,top+43]],'#cbbd85',4);
    for(let i=0;i<3;i++){const q=P(0,0,top+7+i*10);ctx.strokeStyle='#d3c392';ctx.lineWidth=1.4*k;ctx.beginPath();ctx.ellipse(q.x,q.y,(10-i*2)*k,3*k,0,0,Math.PI*2);ctx.stroke();}
    // Front plaque and sealing ribbons distinguish it from ordinary houses.
    poly([[-29,89,96],[29,89,96],[29,89,81],[-29,89,81]],'#344c45','#c5bb87',1);
    const q=P(0,90,87);ctx.fillStyle='#e8dba6';ctx.font=`${11*k}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('锁 妖 塔',q.x,q.y);
    for(const x of [-76,76]){const sway=Math.sin(time*.0012+x)*3;poly([[x-5,90,75],[x+5,90,75],[x+5+sway,93,34],[x-5+sway,93,34]],'#c5b77c','#68745e',.5);line([[x,94,67],[x+2,94,57],[x-2,94,50],[x+1,94,40]],'#8c5d4a',1);}
    ctx.restore();
  }
  function getDrawables(scene,camera,time,player){if(!scene.tower)return[];const b=scene.tower.building;return[{id:'tower-courtyard',depth:b.x+b.y-500,draw:ctx=>draw(ctx,scene,camera,time,player,true)},{id:'sealed-tower',depth:b.x+b.y+b.d/2,draw:ctx=>draw(ctx,scene,camera,time,player)}];}
  global.WorldTowerArt={draw,getDrawables,version:1};
})(typeof window!=='undefined'?window:globalThis);
