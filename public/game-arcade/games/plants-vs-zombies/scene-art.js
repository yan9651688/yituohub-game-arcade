/* Cached micro-diorama scenery for the fixed Canvas 2D projection.
 * API: PVZSceneArt.drawGround(renderer, state, ctx)
 * ctx must already be scaled to CSS pixels. Caller owns the backing canvas,
 * cache invalidation and groundBuilds counter. This function has no side effects
 * on state, projection, picking, entities or gameplay, and needs no image assets.
 * All gradients, material detail and soft shadows are generated ONLY on rebuild.
 */
(function(root){'use strict';
const TAU=Math.PI*2;
function drawGround(r,s,c){
 const N=r.env==='night'||r.env==='fog'||!!s.levelDef?.night,R=r.env==='roof',S=r.scale,rows=r.rows;
 const P=(x,z,h=0)=>r.absolute(x,z,h),L=(x,z,h=0)=>r.local(x,z,h);
 const poly=(p,f,st)=>r.poly(c,p,f,st),line=(a,b,f,w=1)=>r.line(c,a,b,f,w);
 const box=(x,z,w,d,h,f,side,top,b=0)=>r.block(c,x,z,w,d,h,f,side,top,b);
 const ellipse=(p,x,y,f)=>r.ellipse(c,p,x*S,y*S,f);
 const world=(p,f)=>poly(p.map(v=>P(...v)),f);
 const local=(p,f)=>poly(p.map(v=>L(...v)),f);
 const rand=(a,b,k)=>{let n=Math.sin(a*127.1+b*311.7+k*74.7)*43758.5453;return n-Math.floor(n);};
 const C={soil:N?'#33473b':'#738353',soilSide:N?'#2b4037':'#627346',earth:N?'#455943':'#8c9f6d',stone:N?'#697971':'#c1c0a5',stoneSide:N?'#455b55':'#8f977d',wood:N?'#9ca897':'#ded5b6',woodSide:N?'#63776e':'#a7a386',woodTop:N?'#bbc5aa':'#f1e7c9'};
 function soft(x,z,rx,rz,alpha=.2,h=-.24){const p=P(x,z,h);c.save();c.translate(p.x,p.y);c.scale(S*rx,S*rz);const g=c.createRadialGradient(-.12,-.05,0,0,0,1);g.addColorStop(0,`rgba(24,39,28,${alpha})`);g.addColorStop(.5,`rgba(24,39,28,${alpha*.55})`);g.addColorStop(1,'rgba(24,39,28,0)');c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore();}
 function crown(x,z,h,rx,ry,light,mid,dark){const p=P(x,z,h),g=c.createRadialGradient(p.x-S*rx*.3,p.y-S*ry*.4,S*rx*.08,p.x,p.y,S*rx);g.addColorStop(0,light);g.addColorStop(.62,mid);g.addColorStop(1,dark);ellipse(p,rx,ry,g);}
 // Muted backdrop and a thick ground slab leave the playable lawn dominant.
 const bg=c.createLinearGradient(0,0,0,r.h);bg.addColorStop(0,N?'#253c4b':R?'#e7d9c3':'#e0e8ce');bg.addColorStop(1,N?'#526651':R?'#b7b18f':'#b9c998');c.fillStyle=bg;c.fillRect(0,0,r.w,r.h);
 soft(4.6,rows*.7,7.6,2,.2,-.5);
 box(-3,-1,14.7,rows+2.1,.24,C.soil,C.soilSide,C.earth,-.54);
 line(P(-3,rows+1.1,-.3),P(11.7,rows+1.1,-.3),N?'#7f916357':'#c1d39399',1.5);
 // Road and cut stone path, including bevels and subtle joints.
 box(10,-1,1.3,rows+2,.035,N?'#425452':'#7c8580',N?'#304642':'#68736b',N?'#52625d':'#879089',-.27);
 for(let z=-.8;z<rows+1;z+=.29)line(P(10.08,z,-.23),P(11.23,z+.12,-.23),N?'#a2b0a006':'#eef2dc09');
 box(9.35,-.7,.58,rows+1.4,.085,C.stone,C.stoneSide,N?'#8a9586':'#d4cfb5',-.23);
 for(let z=-.5;z<rows+1;z+=.6){line(P(9.35,z,-.14),P(9.93,z,-.14),N?'#455c53':'#a5aa90');line(P(9.35,z+.025,-.139),P(9.93,z+.025,-.139),N?'#a4ae9833':'#f2ecc34a');}
 line(P(9.4,-.7,-.14),P(9.4,rows+.7,-.14),N?'#a9b49a50':'#e9e5ce',1);
 // Grounded picket fence: shadow first, then rails and individually capped posts.
 for(let x=-2.4;x<10;x+=.52){soft(x+.16,-.38,.28,.075,.16);box(x,-.72,.095,.1,.66,C.wood,C.woodSide,C.woodTop,-.23);world([[x,-.62,.43],[x+.047,-.62,.50],[x+.095,-.62,.43]],C.woodTop);}
 for(const h of [.02,.35]){box(-2.4,-.72,12.3,.075,.07,C.wood,C.woodSide,C.woodTop,h);line(P(-2.4,-.64,h-.025),P(9.9,-.64,h-.025),N?'#263e3e55':'#7b7a4f40',S*.025);}
 // A compact, layered tree is completely behind the board.
 soft(8.6,-.33,.75,.19,.28);box(8.41,-.64,.14,.16,1.22,N?'#5e6650':'#87704e',N?'#414f42':'#5e573c',N?'#899273':'#ad9568',-.23);
 line(P(8.48,-.58,.8),P(8.12,-.59,1.35),N?'#54634c':'#766543',S*.065);line(P(8.49,-.56,.98),P(8.86,-.61,1.45),N?'#59684e':'#7c6948',S*.06);
 const foliage=N?['#688569','#4f7055','#345943']:['#93a866','#779652','#507a41'];
 for(const t of [[.2,.09,1.38,.49,.44],[-.36,.03,1.37,.42,.37],[.37,-.03,1.68,.42,.39],[-.02,-.04,1.72,.51,.43],[-.28,.09,1.58,.36,.32]])crown(8.47+t[0],-.64+t[1],t[2],t[3],t[4],...foliage);
 // Architecture stays softly toned, with real thickness instead of line-only windows.
 if(R){
  // Only vertical fascia beneath the two roof planes: no extra flat deck.
  for(const [a,b] of [[0,4.5],[4.5,9]])world([[a,rows,-1.3],[b,rows,-1.3],[b,rows,r.height(b)-.23],[a,rows,r.height(a)-.23]],N?'#8d8975':'#c6b58f');
  world([[9,0,-1.3],[9,rows,-1.3],[9,rows,r.height(9)-.23],[9,0,r.height(9)-.23]],N?'#626f63':'#a49b7c');
  for(let x=.35;x<9;x+=1.65){box(x-.055,rows+.258,.91,.065,.65,C.wood,C.woodSide,C.woodTop,-1.01);box(x,rows+.33,.8,.025,.52,N?'#bcaa71':'#688f96',N?'#676f5a':'#476f77',N?'#ded2a0':'#bfd4c8',-.94);line(P(x+.4,rows+.367,-.95),P(x+.4,rows+.367,-.4),C.woodTop,S*.028);line(P(x,rows+.367,-.68),P(x+.8,rows+.367,-.68),C.woodTop,S*.025);}
  box(-1.95,.15,1.1,1.55,1.2,N?'#999887':'#d9c59f',N?'#717b6b':'#b09e7d',N?'#b6b59b':'#e8d8b3',-.2);
  box(-2.1,0,1.45,1.8,.13,N?'#76685d':'#a26347',N?'#514f49':'#764c3a',N?'#998877':'#ba7b54',1);
  box(-1.91,1.64,.55,.035,.76,N?'#586c64':'#648377',null,C.woodTop,-.17);
 }else{
  soft(-1.5,2.1,1,1.5,.2);
  box(-2.85,-.35,1.35,4.25,2.12,N?'#8e9d8c':'#e4d6ad',N?'#728775':'#c5b58f',N?'#bcc5aa':'#f3e4c0',-.24);
  // Plinth and eave undercut are narrow and physically attached to the wall.
  box(-2.9,-.39,1.43,4.32,.13,N?'#728275':'#b0ad8c',N?'#526c5e':'#939b7a',C.wood,-.25);
  box(-2.96,-.44,1.57,4.43,.065,N?'#455b53':'#998568',N?'#3b5149':'#8b795e',C.wood,1.81);
  box(-3.02,-.5,1.72,4.55,.15,N?'#765e54':'#9b6048',N?'#534b43':'#754933',N?'#907565':'#b57a55',1.94);
  world([[-3.02,4.05,2.09],[-1.3,4.05,2.09],[-2.16,4.05,2.76]],N?'#b1b499':'#e5d0a5');
  const roofGrad=c.createLinearGradient(P(-2.16,0,2.77).x,P(-2.16,0,2.77).y,P(-1.3,0,2.09).x,P(-1.3,0,2.09).y);roofGrad.addColorStop(0,N?'#8c7162':'#b67a58');roofGrad.addColorStop(1,N?'#69594f':'#975b42');
  world([[-2.16,-.5,2.77],[-2.16,4.05,2.77],[-1.3,4.05,2.09],[-1.3,-.5,2.09]],roofGrad);
  for(let z=-.4,k=0;z<4.1;z+=.3,k++){line(P(-2.16,z,2.78),P(-1.3,z,2.1),N?'#c1a08740':'#d2a07777');for(let t=.22;t<.86;t+=.25)line(P(-2.16+t,z,2.78-t*.79),P(-2.16+t,z+.13,2.78-t*.79),N?'#372f2a30':'#704b3630');}
  line(P(-2.16,-.51,2.79),P(-2.16,4.06,2.79),N?'#af9980':'#dbaf7f',S*.045);
  for(const z of [.4,2.85]){
   box(-1.48,z-.045,.065,.79,.86,N?'#566f65':'#978d70',N?'#3c5752':'#776d57',C.woodTop,.50);
   box(-1.407,z,.02,.70,.75,N?'#afab71':'#80a9a7',N?'#8d9463':'#608d91',N?'#d3ca85':'#b4cdc0',.555);
   for(const dz of [0,.35,.7])box(-1.381,z+dz-.02,.035,.04,.8,C.wood,C.woodSide,C.woodTop,.53);
   for(const h of [.53,.92,1.31])box(-1.38,z-.02,.04,.74,.04,C.wood,C.woodSide,C.woodTop,h);
   box(-1.45,z-.07,.20,.86,.065,C.wood,C.woodSide,C.woodTop,.49);
   line(P(-1.375,z+.06,1.23),P(-1.375,z+.25,1.02),N?'#ffe6a544':'#e7f2d681',S*.023);
  }
  box(-1.47,1.51,.08,.8,1.33,C.wood,C.woodSide,C.woodTop,-.2);
  box(-1.375,1.56,.035,.69,1.25,N?'#486961':'#658478',N?'#36584f':'#466a61',C.woodTop,-.2);
  box(-1.48,1.44,.62,.94,.12,C.stone,C.stoneSide,N?'#a3ac94':'#d5cfb0',-.25);
  for(const z of [1.66,1.96])line(P(-1.33,z,.15),P(-1.33,z,.78),N?'#648075':'#8ea58e',S*.025);
  ellipse(P(-1.32,2.14,.50),.026,.026,N?'#e0c98b':'#d3b777');
  box(-2.65,.4,.26,.35,.55,N?'#6d6053':'#8e6047',N?'#4f5348':'#694e39',N?'#a49478':'#c39b74',2.36);
  box(-2.69,.36,.34,.43,.07,N?'#9c9079':'#c4a47d',N?'#756e60':'#8b765a',N?'#b7aa8a':'#dec096',2.9);
 }
 // Lawn/roof thickness follows the exact piecewise roof plane, including the crease inside column 5 (x=4.5).
 const breaks=R?[0,4.5,9]:[0,9];
 for(let i=0;i<breaks.length-1;i++){const a=breaks[i],b=breaks[i+1];local([[a,rows,0],[b,rows,0],[b,rows,-.23],[a,rows,-.23]],R?(N?'#735748':'#8f5639'):C.soil);line(L(a,rows,-.045),L(b,rows,-.045),R?'#e6b17b55':N?'#849c6655':'#d1dd9399',S*.032);}
 local([[9,0,0],[9,rows,0],[9,rows,-.23],[9,0,-.23]],R?(N?'#554b43':'#734733'):C.soilSide);
 for(let row=0;row<rows;row++)for(let col=0;col<9;col++){
  const water=(s.waterRows||[]).includes(row),inactive=s.activeRows&&!s.activeRows.includes(row),odd=(row+col)%2;
  let color=R?(N?(odd?'#8e6c52':'#9c785b'):(odd?'#b87951':'#c8875d')):water?(N?'#477b7d':'#70b9b8'):(N?(odd?'#486d48':'#52774c'):(odd?'#94b560':'#a0bf6e'));
  if(inactive)color=N?'#3c5440':'#788e57';r.tile(c,row,col,color,R?(N?'#634e40':'#985f40'):'#617e4438');
  if(R){for(let j=0;j<3;j++){const a=col+.075+j*.33;line(L(a,row,.018),L(a,row+1,.018),N?'#d2a67640':'#e6b77c77',S*.026);line(L(a+.065,row,.018),L(a+.065,row+1,.018),N?'#533e3338':'#89503755',S*.022);}for(const [a,b] of col===4?[[4,4.5],[4.5,5]]:[[col,col+1]])line(L(a,row+1,.02),L(b,row+1,.02),N?'#493d354a':'#78472f55',S*.025);}
  else if(water){
   // Mild depth shading inside every pool cell, with quiet caustic fragments.
   for(let j=0;j<4;j++){const x=col+.1+rand(col,row,j)*.65,z=row+.12+rand(row,col,j+7)*.7;line(L(x,z,.023),L(x+.11,z+.014,.023),N?'#aad6c44f':'#dcf1db66',S*.017);}
  }else{
   for(let j=0;j<7;j++){const x=col+.08+rand(col,row,j)*.78,z=row+.07+rand(row,col,j+13)*.82;local([[x,z,.009],[x+.11,z+.025,.009],[x+.06,z+.10,.009]],j%2?(N?'#a3bd7320':'#d6e5a01a'):(N?'#233f2c1c':'#4c783619'));}
   for(let j=0;j<2;j++){const x=col+.15+rand(col,row,j+25)*.7,z=row+.15+rand(row,col,j+30)*.7,p=L(x,z,.01);line(p,{x:p.x+S*.025,y:p.y-S*.045},N?'#73975a4a':'#61844544',Math.max(.5,S*.01));}
  }
 }
 // Recessed pool coping, interior edge shadow and thin surface highlights.
 const waterRows=s.waterRows||[];
 if(waterRows.length){const lo=Math.min(...waterRows),hi=Math.max(...waterRows)+1;
  local([[0,lo,.02],[9,lo,.02],[9,lo+.09,.021],[0,lo+.09,.021]],N?'#284f557d':'#387c7b75');
  local([[0,lo,.02],[.075,lo,.02],[.075,hi,.02],[0,hi,.02]],N?'#244e527d':'#3c858375');
  for(const z of [lo,hi]){line(L(0,z,.035),L(9,z,.035),N?'#a5b6a0':'#d8ddba',S*.067);line(L(.02,z+.04,.037),L(8.98,z+.04,.037),N?'#294f505c':'#557f664c',S*.017);}
  for(const x of [0,9])line(L(x,lo,.033),L(x,hi,.033),N?'#97aea0':'#cfdab8',S*.045);
  line(L(.1,hi-.12,.026),L(8.9,hi-.12,.026),N?'#83b4a14d':'#c5edcf70',S*.018);
 }
 // Arrival path and restrained miniature flower border, outside all playable cells.
 box(-1,-.12,.63,rows+.24,.07,C.stone,C.stoneSide,N?'#97a38d':'#cfceb2',-.09);
 for(let row=0;row<rows;row++){line(P(-1,row+.02,-.014),P(-.37,row+.02,-.014),N?'#516a583d':'#82957855');const p=L(-.3,row+.5);c.font='10px system-ui';c.textAlign='center';c.fillStyle=N?'#b8c6a5':'#5c714b';c.fillText(String(row+1),p.x,p.y);}
 if(!R)for(let x=.25,k=0;x<9;x+=.57,k++){soft(x+.1,rows+.45,.27,.085,.14,-.24);crown(x,rows+.43,-.07,.22,.10,N?'#65835a':'#8eab61',N?'#456b47':'#648b46',N?'#31553e':'#466f38');if(k%3===0){const p=P(x-.04,rows+.43,.015);ellipse(p,.035,.032,N?'#b7ac85':'#dcb88a');ellipse({x:p.x-S*.04,y:p.y-S*.025},.025,.023,N?'#c8bb90':'#edd8a3');}}
 if(R)for(const x of [1.2,7.9]){const h=r.height(x);soft(x+.3,-.25,.4,.13,.2,h);box(x,-.6,.45,.4,.62,N?'#796a59':'#96694d',N?'#554f43':'#704d3a',N?'#a69478':'#c49b73',h);for(let j=1;j<4;j++)line(P(x,-.2,h+j*.15),P(x+.45,-.2,h+j*.15),N?'#b3a08466':'#d3b18c77');box(x-.055,-.65,.56,.5,.075,N?'#a1947d':'#bd9f7c',N?'#6d6759':'#8d735a',N?'#c2b394':'#dfc09a',h+.62);}
}
const api={version:'1.0.0',drawGround};root.PVZSceneArt=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
