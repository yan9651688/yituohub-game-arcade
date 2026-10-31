/* 九境烟火：茶棚、酒桌、委托牌与可自由挑战的山贼。共享世界坐标与纵深。 */
(function(global){
  'use strict';
  const TAU=Math.PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const THEMES={tea:{cloth:'#759586',edge:'#d6d7aa',ceramic:'#bad3bf',flag:'茶'},wine:{cloth:'#986d55',edge:'#e2c48e',ceramic:'#ba9070',flag:'酒'},inn:{cloth:'#967063',edge:'#dcc8a0',ceramic:'#b2c8b3',flag:'客'}};
  function brush(ctx,t,env){
    const k=env.camera.zoom||1,z=env.scene.heightAt(t.x,t.y),J=global.JianghuScene;
    const P=(x,y,h=0)=>J.screen(t.x+x,t.y+y,z+h,env.camera);
    const poly=(points,fill,stroke='#425c48',lw=.85)=>{ctx.beginPath();points.forEach((q,i)=>{const a=P(...q);i?ctx.lineTo(a.x,a.y):ctx.moveTo(a.x,a.y)});ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw*k;ctx.stroke()}};
    const line=(points,color,width=1)=>{ctx.beginPath();points.forEach((q,i)=>{const a=P(...q);i?ctx.lineTo(a.x,a.y):ctx.moveTo(a.x,a.y)});ctx.strokeStyle=color;ctx.lineWidth=width*k;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke()};
    const oval=(x,y,h,rx,ry,fill,stroke=null,lw=1)=>{const q=P(x,y,h);ctx.beginPath();ctx.ellipse(q.x,q.y,rx*k,ry*k,0,0,TAU);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw*k;ctx.stroke()}};
    const box=(x,y,w,d,h0,h,colors=['#b3a179','#796c50','#625c46'])=>{
      const a=[x-w/2,y-d/2,h0+h],b=[x+w/2,y-d/2,h0+h],c=[x+w/2,y+d/2,h0+h],d0=[x-w/2,y+d/2,h0+h];
      poly([d0,c,[c[0],c[1],h0],[d0[0],d0[1],h0]],colors[1]);poly([b,c,[c[0],c[1],h0],[b[0],b[1],h0]],colors[2]);poly([a,b,c,d0],colors[0]);
    };
    return {P,poly,line,oval,box,k,z};
  }
  function stool(ctx,t,env,x,y){
    const b=brush(ctx,t,env);b.oval(x,y,0,19,8,'#203e302a');
    for(const [dx,dy]of [[-10,-7],[10,-7],[10,7],[-10,7]])b.box(x+dx,y+dy,4,4,0,22,['#9e8d68','#74664d','#645b47']);
    b.box(x,y,32,25,21,5,['#c0ae80','#857554','#786c4f']);b.line([[x-13,y-1,27],[x+13,y-1,27]],'#d6c391',.7);
  }
  function cup(ctx,t,env,x,y,h=52){
    const b=brush(ctx,t,env);b.oval(x,y,h-1,5,2,'#516e5033');
    const q=b.P(x,y,h),k=b.k;ctx.save();ctx.translate(q.x,q.y);ctx.scale(k,k);
    ctx.beginPath();ctx.moveTo(-5,-4);ctx.lineTo(5,-4);ctx.lineTo(3,2);ctx.quadraticCurveTo(0,4,-3,2);ctx.closePath();ctx.fillStyle='#d5e2c9';ctx.fill();ctx.strokeStyle='#708e70';ctx.lineWidth=.7;ctx.stroke();
    ctx.beginPath();ctx.ellipse(0,-4,5,1.7,0,0,TAU);ctx.fillStyle='#edf1d8';ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(0,-4,3.7,1.1,0,0,TAU);ctx.fillStyle='#ab8c49';ctx.fill();ctx.restore();
  }
  function pot(ctx,t,env,x,y,h=56){
    const b=brush(ctx,t,env),q=b.P(x,y,h),k=b.k;ctx.save();ctx.translate(q.x,q.y);ctx.scale(k,k);
    ctx.strokeStyle='#5c7e68';ctx.lineWidth=2.8;ctx.beginPath();ctx.ellipse(7,-4,6,5,-.2,0,TAU);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-7,-3);ctx.quadraticCurveTo(-14,-5,-17,-12);ctx.lineTo(-18,-9);ctx.quadraticCurveTo(-17,-2,-8,2);ctx.closePath();ctx.fillStyle='#91b598';ctx.fill();ctx.strokeStyle='#52795f';ctx.lineWidth=.9;ctx.stroke();
    const g=ctx.createLinearGradient(-10,-10,10,7);g.addColorStop(0,'#c1d9b5');g.addColorStop(.55,'#92b596');g.addColorStop(1,'#668e73');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,-3,10,8,0,0,TAU);ctx.fill();ctx.stroke();
    ctx.fillStyle='#b4ccaa';ctx.beginPath();ctx.ellipse(0,-10,6.5,2.4,0,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='#789c78';ctx.beginPath();ctx.ellipse(0,-12,2,2,0,0,TAU);ctx.fill();
    ctx.strokeStyle='#e6e7cba3';ctx.lineWidth=.85;ctx.beginPath();ctx.moveTo(-6,-7);ctx.quadraticCurveTo(-8,-4,-6,-1);ctx.stroke();
    ctx.restore();
    for(let i=0;i<3;i++){
      const age=(env.time*.32+i*.33)%1,drift=Math.sin(age*3+i)*5;
      ctx.save();ctx.globalAlpha=(1-age)*.33;ctx.strokeStyle='#f1eed6';ctx.lineWidth=(1+age*.5)*k;ctx.beginPath();const a=b.P(x,y,h+13+age*25);ctx.moveTo(a.x+drift*k,a.y);ctx.bezierCurveTo(a.x+(drift-5)*k,a.y-5*k,a.x+(drift+5)*k,a.y-11*k,a.x+(drift+1)*k,a.y-16*k);ctx.stroke();ctx.restore();
    }
  }
  function table(ctx,t,env){
    const b=brush(ctx,t,env),r=58;b.oval(0,0,0,80,32,'#233d302a');
    for(const [x,y]of [[-29,-24],[29,-24],[29,24],[-29,24]])b.box(x,y,8,8,0,46,['#b09a73','#7a674e','#685c46']);
    b.box(0,0,68,6,15,5,['#998060','#756348','#665740']);
    const circle=(h,from=0,to=TAU,n=32)=>Array.from({length:n+1},(_,i)=>{const a=from+(to-from)*i/n;return [Math.cos(a)*r,Math.sin(a)*r,h]});
    b.poly([...circle(49,-Math.PI/4,Math.PI*.75,18),...circle(43,-Math.PI/4,Math.PI*.75,18).reverse()],'#837154','#5c5b43',1.1);
    b.poly(circle(50),'#c1ae82','#706448',1.1);
    for(let i=-2;i<=2;i++){const y=i*17,x=Math.sqrt(r*r-y*y)-2;b.line([[-x,y,50.4],[x,y,50.4]],i%2?'#dac69b':'#9c8965',.75)}
    b.poly([[-15,-22,51],[26,-22,51],[26,20,51],[-15,20,51]],'#869a7880',null);
    pot(ctx,t,env,5,-7,56);
    for(const [x,y]of [[-32,-9],[17,28],[31,-23]])cup(ctx,t,env,x,y,53);
    b.oval(-17,19,53,13,5,'#eee1bd','#a19570',.7);
    for(const [x,y]of [[-21,17],[-15,22],[-11,16]])b.oval(x,y,55,4,3.4,'#d9b372','#ac8851',.6);
  }
  function canopy(ctx,t,env){
    const b=brush(ctx,t,env),theme=THEMES[t.venue]||THEMES.tea,x=-91,y=-79;
    b.oval(x,y,0,116,35,'#193b2b21');
    for(const [dx,dy]of [[-64,-42],[64,-42],[-64,36],[64,36]]){
      b.box(x+dx,y+dy,6,6,0,127,['#b09b76','#7c6d4e','#665c43']);b.line([[x+dx,y+dy,8],[x+dx+1,y+dy,121]],'#d1bd8b',.75);
    }
    b.line([[x-69,y-45,128],[x+69,y-45,128]],'#725c40',6);
    b.line([[x-69,y+41,117],[x+69,y+41,117]],'#796849',5);
    b.poly([[x-79,y-52,130],[x+80,y-52,130],[x+87,y+50,114],[x-85,y+50,114]],theme.cloth,'#465e49',1);
    for(let i=0;i<8;i++){
      const a=x-79+i*20;b.poly([[a,y-52,130],[a+9,y-52,130],[a+8,y+50,114],[a-2,y+50,114]],'#eadbbf17',null);
    }
    const sway=Math.sin(env.time*1.4)*1.7;
    for(let i=0;i<8;i++){const xx=x-85+i*21.5;b.poly([[xx,y+50,114],[xx+21.5,y+50,114],[xx+21.5,y+52+sway,105],[xx+13,y+52+sway,102],[xx+3,y+52+sway,105]],i%2?theme.edge:theme.cloth,'#627058',.55)}
    b.line([[x-85,y+50,114],[x+87,y+50,114]],theme.edge,1.7);
    b.box(x,y-17,101,27,0,40,['#baa87d','#817153','#635f47']);
    b.box(x-32,y-17,24,23,40,12,['#9ca788','#687b5d','#5b6b50']);
    pot(ctx,t,env,x+22,y-17,44);
    if(t.venue==='wine'||t.venue==='inn'){
      for(let i=0;i<3;i++){
        b.oval(x+55+i*10,y-22-i*11,12,10,13,i===1?'#967b5f':'#756f56','#575e47',1);
        b.oval(x+55+i*10,y-22-i*11,25,5,2.6,'#b78a62','#625f45',.6);
      }
    }
  }
  function sign(ctx,t,env){
    const b=brush(ctx,t,env),theme=THEMES[t.venue]||THEMES.tea,x=72,y=-62;
    b.box(x,y,6,6,0,138,['#b29a72','#7d684e','#5e5944']);b.line([[x-2,y,136],[x+34,y,136]],'#78654b',4);
    const swing=Math.sin(env.time*1.5+t.x)*2.1;
    b.poly([[x+8,y-1,127],[x+38,y-1,127],[x+39+swing,y+2,80],[x+24+swing,y+2,86],[x+10+swing,y+2,80]],theme.cloth,'#536047',.8);
    const q=b.P(x+24+swing*.5,y+1,101);ctx.save();ctx.translate(q.x,q.y);ctx.rotate(.05*Math.sin(env.time*1.5));ctx.fillStyle=theme.edge;ctx.font=`bold ${22*b.k}px "Noto Serif SC","Microsoft YaHei",serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(theme.flag,0,0);ctx.restore();
    if(t.venue!=='tea'){
      const q2=b.P(-18,-72,111);ctx.save();ctx.translate(q2.x,q2.y);ctx.scale(b.k,b.k);
      const g=ctx.createRadialGradient(0,2,1,0,2,29);g.addColorStop(0,'#f6ce7745');g.addColorStop(1,'#f6ce7700');ctx.fillStyle=g;ctx.fillRect(-30,-28,60,60);
      ctx.fillStyle='#c88d58';ctx.beginPath();ctx.ellipse(0,1,10,14,0,0,TAU);ctx.fill();ctx.strokeStyle='#ecd196';ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(0,1,4,14,0,0,TAU);ctx.stroke();ctx.fillStyle='#816649';ctx.fillRect(-6,-14,12,3);ctx.fillRect(-6,13,12,3);ctx.restore();
    }
  }
  function board(ctx,t,env){
    const b=brush(ctx,t,env);b.oval(0,0,0,31,10,'#223c2b25');
    b.box(-24,0,6,8,0,92,['#ad956a','#776749','#5f5943']);b.box(24,0,6,8,0,92,['#ad956a','#776749','#5f5943']);
    b.poly([[-31,0,86],[31,0,86],[31,0,42],[-31,0,42]],'#7e7052','#485943',1);
    b.poly([[-26,-1,91],[27,-1,91],[35,2,83],[-34,2,83]],'#b3a37b','#646346',1);
    b.poly([[-23,1,80],[20,1,80],[20,1,48],[-22,1,46]],'#e4d5aa','#b1a47d',.65);
    for(let i=0;i<4;i++)b.line([[-17,1,73-i*5],[i%2?9:14,1,73-i*5]],'#897a57',.85);
    b.poly([[10,1.2,60],[17,1.2,60],[17,1.2,52],[10,1.2,52]],'#b56b50',null);
  }
  function commissionProps(ctx,t,env){
    const b=brush(ctx,t,env),x=53,y=27;
    if(t.id.endsWith('-escort')){
      b.oval(x,y,0,44,17,'#223d2929');
      for(const dy of [-24,24]){
        const q=b.P(x,y+dy,12);ctx.save();ctx.translate(q.x,q.y);ctx.scale(b.k,b.k);ctx.lineWidth=3;ctx.strokeStyle='#7b6547';ctx.fillStyle='#6c715448';ctx.beginPath();ctx.ellipse(0,0,11,13,-.35,0,TAU);ctx.fill();ctx.stroke();ctx.lineWidth=1.3;for(let a=0;a<TAU;a+=TAU/5){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*10,Math.sin(a)*12);ctx.stroke();}ctx.restore();
      }
      b.box(x,y,58,39,14,6,['#b8a17a','#86714f','#6b6045']);
      for(const dy of [-16,16])b.line([[x-37,y+dy,18],[x+48,y+dy,15]],'#8c7852',4);
      b.box(x-11,y-3,26,27,20,26,['#c8b386','#92805c','#7d7053']);
      b.line([[x-23,y-3,46],[x+1,y-3,46]],'#ede0b76b',2);b.line([[x-11,y-16,46],[x-11,y+10,46]],'#c4d0a8',2);
      b.oval(x+13,y+4,30,14,14,'#9eaa7c','#607157',1);b.oval(x+13,y+4,44,5,2.5,'#899666','#64704e',.8);
    }else if(t.id.endsWith('-find')){
      b.oval(x,y,0,25,10,'#24442e26');
      b.poly([[x-18,y-12,4],[x+17,y-12,4],[x+19,y+12,3],[x-20,y+12,3]],'#627f69','#4d674f',.8);
      b.poly([[x-18,y-12,4],[x-7,y-6,20],[x+9,y-5,18],[x+17,y-12,4],[x+19,y+12,3],[x-1,y+6,19],[x-20,y+12,3]],'#8ea582','#546f57',1);
      b.line([[x-14,y+9,6],[x,y,20],[x+13,y-9,6]],'#d4cd9b',1.7);b.line([[x-13,y-9,7],[x,y,20],[x+14,y+9,7]],'#c4bd8a',1.7);
      b.oval(x,y,21,4,3,'#e0d6a3','#9c936a',.7);
      for(let i=0;i<4;i++)b.oval(x+27+i*9,y-13-i*4,1,3.7,1.7,'#56724d35');
    }else{
      for(let i=0;i<3;i++){const xx=x-18+i*20;b.poly([[xx-3,y,0],[xx+3,y,0],[xx+3,y,36+i%2*7],[xx,y,44+i%2*7],[xx-3,y,36+i%2*7]],'#9d875e','#596147',.8);}
      b.line([[x-24,y+1,20],[x+27,y+1,25]],'#796848',4);b.line([[x-24,y+1,34],[x+27,y+1,38]],'#aa946c',3);
      b.poly([[x+1,y-1,44],[x+21,y-1,42],[x+15,y,27],[x+2,y,29]],'#a07450','#786848',.6);
    }
  }
  function bandit(ctx,t,env,index){
    const phase=env.time*.6+index*2.1,dx=[-36,27,14][index%3]+Math.sin(phase)*6,dy=[-11,-18,36][index%3]+Math.cos(phase*.7)*5;
    const b=brush(ctx,t,env),q=b.P(dx,dy),k=b.k,bob=Math.sin(phase*2)*.5;
    ctx.save();ctx.translate(q.x,q.y+bob*k);ctx.scale(k,k);ctx.lineCap='round';ctx.lineJoin='round';
    const fur=index%2?'#baa382':'#8b9d93',robe=index%2?'#977955':'#677b60';
    ctx.fillStyle='#19382935';ctx.beginPath();ctx.ellipse(0,0,21,8,0,0,TAU);ctx.fill();
    ctx.strokeStyle='#354c3d';ctx.lineWidth=1.2;
    ctx.fillStyle='#4f5644';ctx.beginPath();ctx.moveTo(-15,-22);ctx.lineTo(13,-22);ctx.lineTo(15,-3);ctx.lineTo(21,0);ctx.lineTo(7,3);ctx.lineTo(1,-16);ctx.lineTo(-5,1);ctx.lineTo(-21,1);ctx.lineTo(-15,-5);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=robe;ctx.beginPath();ctx.moveTo(-13,-65);ctx.quadraticCurveTo(-26,-50,-24,-29);ctx.lineTo(-15,-19);ctx.lineTo(2,-24);ctx.lineTo(13,-18);ctx.lineTo(22,-25);ctx.lineTo(17,-61);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='#b6b28a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-9,-62);ctx.lineTo(8,-26);ctx.stroke();ctx.strokeStyle='#3e5140';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-17,-31);ctx.lineTo(16,-33);ctx.stroke();
    ctx.fillStyle=fur;ctx.strokeStyle='#4e6050';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(-13,-72);ctx.lineTo(-18,-91);ctx.lineTo(-3,-82);ctx.lineTo(9,-83);ctx.lineTo(17,-92);ctx.lineTo(16,-68);ctx.quadraticCurveTo(20,-50,3,-51);ctx.quadraticCurveTo(-17,-51,-13,-72);ctx.fill();ctx.stroke();
    ctx.fillStyle='#dbc9a0';ctx.beginPath();ctx.ellipse(1,-61,11,7,0,0,TAU);ctx.fill();
    ctx.fillStyle='#a36b4e';ctx.beginPath();ctx.moveTo(-14,-80);ctx.quadraticCurveTo(2,-87,17,-78);ctx.lineTo(16,-73);ctx.quadraticCurveTo(1,-77,-15,-73);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(13,-77);ctx.lineTo(30,-73);ctx.lineTo(25,-67);ctx.lineTo(15,-73);ctx.fill();
    ctx.strokeStyle='#344536';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-8,-70);ctx.lineTo(-3,-68);ctx.moveTo(6,-68);ctx.lineTo(11,-71);ctx.stroke();ctx.fillStyle='#354438';ctx.beginPath();ctx.ellipse(1,-64,3,2,0,0,TAU);ctx.fill();
    ctx.strokeStyle=robe;ctx.lineWidth=11;ctx.beginPath();ctx.moveTo(16,-53);ctx.lineTo(27,-37);ctx.stroke();ctx.fillStyle=fur;ctx.beginPath();ctx.ellipse(27,-37,4,5,0,0,TAU);ctx.fill();
    ctx.save();ctx.translate(29,-37);ctx.rotate(-.25+Math.sin(phase)*.03);ctx.fillStyle='#aab5a1';ctx.strokeStyle='#475c4a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-2,3);ctx.lineTo(-3,-37);ctx.quadraticCurveTo(5,-49,6,-56);ctx.quadraticCurveTo(14,-29,4,3);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='#ecedd2';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(3,-4);ctx.quadraticCurveTo(10,-33,6,-51);ctx.stroke();ctx.fillStyle='#b99d6c';ctx.fillRect(-6,2,12,3);ctx.fillStyle='#675b44';ctx.fillRect(-2,5,4,10);ctx.restore();
    ctx.restore();
  }
  function camp(ctx,t,env){
    const b=brush(ctx,t,env);b.box(-63,23,26,26,0,23,['#a89369','#81724e','#6a6447']);
    b.line([[-72,14,24],[-54,32,24]],'#c9b682',2);b.line([[-55,16,24],[-73,30,24]],'#c9b682',2);
    for(let i=0;i<6;i++){const a=i*TAU/6;b.oval(55+Math.cos(a)*12,34+Math.sin(a)*12,0,6,3.5,'#84927a','#586952',.6)}
    b.line([[46,28,1],[64,39,1]],'#665a42',4);b.line([[48,42,1],[62,26,1]],'#776045',4);
    const embers=t.cooldownLeft?'.2':'.55';b.oval(55,34,3,8,4,`rgba(215,144,66,${embers})`);
  }
  function getDrawables(env,targets){
    const list=[];
    const add=(t,offset,draw)=>list.push({depth:t.x+t.y+offset,draw:ctx=>draw(ctx,t,env)});
    for(const t of targets){
      if(!t.life)continue;
      if(t.type==='rest'){
        add(t,-170,canopy);add(t,-102,(ctx,t,e)=>stool(ctx,t,e,-71,-22));
        add(t,-53,(ctx,t,e)=>{const a={...t,x:t.x-45,y:t.y-38,name:'茶博士',variant:1};env.drawVillager?.(a,global.JianghuScene.screen(a.x,a.y,env.scene.heightAt(a.x,a.y),env.camera));});
        add(t,-12,sign);add(t,3,table);add(t,91,(ctx,t,e)=>stool(ctx,t,e,65,26));add(t,50,(ctx,t,e)=>stool(ctx,t,e,-20,72));
      }else if(t.type==='commission'){
        add(t,-36,(ctx,t,e)=>{const a={...t,x:t.x-45,y:t.y+9,name:t.id.endsWith('-escort')?'商队掌柜':t.id.endsWith('-find')?'寻物的旅人':'山道乡亲',variant:0};env.drawVillager?.(a,global.JianghuScene.screen(a.x,a.y,env.scene.heightAt(a.x,a.y),env.camera));});
        add(t,.2,board);add(t,80,commissionProps);
      }
      else if(t.type==='patrol'){
        add(t,-30,camp);
        if(!t.disabled&&!t.cooldownLeft)for(let i=0;i<clamp(Number(t.count)||3,1,3);i++)add(t,[-47,9,50][i],(ctx,t,e)=>bandit(ctx,t,e,i));
      }
    }
    return list;
  }
  global.WorldLifeArt={getDrawables,drawTable:table,drawCanopy:canopy,drawBandit:bandit,themes:THEMES,version:9};
})(typeof window!=='undefined'?window:globalThis);
