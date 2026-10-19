import * as THREE from '../../vendor/three/build/three.module.js';

// Deterministic, local art assets. Textures add surface detail without extra draw calls.
const caches = new Map();
function rng(seed) { return () => { seed = Math.imul(seed ^ seed >>> 16, 2246822507); seed = Math.imul(seed ^ seed >>> 13, 3266489909); return ((seed ^= seed >>> 16) >>> 0) / 4294967296; }; }
export function texture(kind) {
  if(caches.has(kind)) return caches.get(kind);
  const c=document.createElement('canvas');c.width=kind==='forest'?2048:kind==='tree'?768:512;c.height=kind==='forest'?1024:kind==='tree'?1024:512;
  const x=c.getContext('2d'),r=rng(8099+kind.length*137),w=c.width,h=c.height;
  if(['rock','metal','earth','ice','organic'].includes(kind)) {
    const bases={rock:'#d3d8d2',metal:'#d8dddd',earth:'#c9cfbd',ice:'#e4f0ef',organic:'#d2c9c1'};
    x.fillStyle=bases[kind];x.fillRect(0,0,w,h);
    // Layered noise is deliberately quiet; lighting supplies the contrast.
    for(let i=0;i<19000;i++){const v=Math.floor(55+r()*150);x.fillStyle=`rgba(${v},${v},${v},${.025+r()*.075})`;const s=1+r()*6;x.fillRect(r()*w,r()*h,s,s);}
    if(kind==='metal') {
      x.strokeStyle='rgba(16,22,27,.48)';x.lineWidth=5;x.strokeRect(3,3,w-6,h-6);x.strokeRect(14,14,w-28,h-28);
      x.strokeStyle='rgba(232,241,242,.23)';x.lineWidth=2;x.strokeRect(18,18,w-36,h-36);
      for(let i=0;i<90;i++){const y=r()*h;x.strokeStyle=`rgba(20,28,30,${r()*.09})`;x.beginPath();x.moveTo(20,y);x.lineTo(w-20,y);x.stroke();}
      for(const xx of [28,w-28])for(const yy of [28,h-28]){x.fillStyle='#515a5d';x.beginPath();x.arc(xx,yy,5,0,Math.PI*2);x.fill();x.fillStyle='#c6cece';x.fillRect(xx-2,yy-2,3,2);}
      for(let i=0;i<80;i++){x.strokeStyle='rgba(215,225,225,.2)';const px=r()*w,py=r()*h;x.beginPath();x.moveTo(px,py);x.lineTo(px+r()*25,py+r()*3);x.stroke();}
    } else if(kind==='earth') {
      for(let i=0;i<1400;i++){const px=r()*w,py=r()*h,shade=Math.floor(110+r()*110);x.fillStyle=`rgba(${shade},${shade+Math.floor(r()*8)},${shade-8},${.08+r()*.16})`;x.beginPath();x.ellipse(px,py,2+r()*15,2+r()*10,r()*6.28,0,6.29);x.fill();}
      for(let i=0;i<150;i++){x.fillStyle='rgba(236,239,220,.23)';x.beginPath();x.ellipse(r()*w,r()*h,2+r()*5,1+r()*3,r()*6.28,0,6.29);x.fill();}
    } else if(kind==='rock') {
      for(let j=0;j<18;j++){let y=j*h/18+r()*8;x.beginPath();x.moveTo(0,y);for(let px=0;px<=w;px+=16){y+=(r()-.5)*12;x.lineTo(px,y);}x.lineWidth=2+r()*7;x.strokeStyle=`rgba(21,30,30,${.08+r()*.15})`;x.stroke();}
      for(let i=0;i<110;i++){const px=r()*w,py=r()*h;x.beginPath();x.moveTo(px,py);x.lineTo(px+6+r()*20,py+2+r()*6);x.lineTo(px+12,py+9+r()*7);x.closePath();x.fillStyle=r()>.5?'rgba(225,234,216,.09)':'rgba(21,28,24,.1)';x.fill();}
    } else if(kind==='ice') {
      x.strokeStyle='rgba(230,250,255,.5)';x.lineWidth=1.5;for(let j=0;j<16;j++){let px=r()*w,py=r()*h;x.beginPath();x.moveTo(px,py);for(let i=0;i<6;i++){px+=(r()-.5)*50;py+=20+r()*25;x.lineTo(px,py);}x.stroke();}
    } else {
      for(let j=0;j<16;j++){x.beginPath();x.moveTo(r()*w,0);x.bezierCurveTo(r()*w,h*.3,r()*w,h*.7,r()*w,h);x.strokeStyle='rgba(58,32,35,.25)';x.lineWidth=3+r()*9;x.stroke();}
    }
  } else if(kind==='tree'||kind==='forest') {
    const tree=(tx,ground,scale,shade)=>{
      x.save();x.translate(tx,ground);x.scale(scale,scale);x.fillStyle=shade;x.strokeStyle=shade;x.lineCap='round';
      x.beginPath();x.moveTo(-9,0);x.lineTo(-5,-330);x.lineTo(4,-440);x.lineTo(9,-170);x.lineTo(16,0);x.closePath();x.fill();
      for(let j=0;j<16;j++){const yy=-110-j*19,reach=(18-j)*5.5,side=j%2?-1:1;x.lineWidth=9-j*.35;x.beginPath();x.moveTo(0,yy+30);x.quadraticCurveTo(side*reach*.4,yy,side*reach,yy-20);x.stroke();
        for(let k=0;k<22;k++){const bx=side*reach*(.15+r()*.9),by=yy-10+(r()-.5)*45;x.beginPath();x.ellipse(bx,by,15+r()*25,5+r()*7,side*-.3,0,Math.PI*2);x.fill();}
      }
      x.restore();
    };
    if(kind==='tree') {
      x.translate(w*.5,h);x.lineCap='round';
      const canopy=[];
      const branch=(px,py,len,angle,width,depth)=>{
        const ex=px+Math.cos(angle)*len,ey=py+Math.sin(angle)*len;
        x.strokeStyle=depth>1?'#9ea397':'#c5c9bd';x.lineWidth=width;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+(ex-px)*.35+15,py+(ey-py)*.65,ex,ey);x.stroke();
        if(depth===0){canopy.push([ex,ey]);return;}
        branch(ex,ey,len*(.61+r()*.12),angle-.35-r()*.35,width*.57,depth-1);
        branch(ex,ey,len*(.61+r()*.12),angle+.35+r()*.35,width*.57,depth-1);
        if(depth===2)branch(ex,ey,len*.6,angle+(r()-.5)*.2,width*.55,depth-1);
      };
      branch(0,10,350,-Math.PI/2-.04,32,4);
      branch(1,-245,185,-2.1,15,3);branch(1,-340,165,-.85,13,3);
      for(const [px,py] of canopy){for(let j=0;j<60;j++){const a=r()*Math.PI*2,rad=Math.sqrt(r())*45,shade=Math.floor(165+r()*90);x.fillStyle=`rgb(${shade},${shade},${shade})`;x.beginPath();x.ellipse(px+Math.cos(a)*rad,py+Math.sin(a)*rad*.6,4+r()*9,2+r()*4,r()*3,0,Math.PI*2);x.fill();}}
    }
    else {for(let j=0;j<3;j++)for(let i=-3;i<37;i++)tree(i*65+r()*40,h+25,(.8+r()*.8)*(1+j*.18),['#365557','#223e40','#152b30'][j]);}
  } else if(kind==='mist'||kind==='glow') {
    const g=x.createRadialGradient(w*.5,h*.5,0,w*.5,h*.5,w*.5);g.addColorStop(0,'rgba(255,255,255,.75)');g.addColorStop(kind==='glow'?.18:.5,'rgba(255,255,255,.2)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h);
  } else if(kind==='fern') {
    x.strokeStyle='#fff';x.fillStyle='#fff';x.lineCap='round';
    for(let j=0;j<9;j++){const a=-2.8+j*.3,ex=256+Math.cos(a)*210,ey=470+Math.sin(a)*250;x.lineWidth=4;x.beginPath();x.moveTo(256,490);x.quadraticCurveTo(ex,ey+100,ex,ey);x.stroke();for(let k=1;k<12;k++){const t=k/12,px=256+(ex-256)*t,py=490+(ey-490)*t;for(const s of [-1,1]){x.beginPath();x.ellipse(px+s*(1-t)*25,py-5,(1-t)*36+2,4+(1-t)*5,s*.5,0,6.29);x.fill();}}}
  }
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
  if(['rock','metal','earth','ice','organic'].includes(kind)){t.wrapS=t.wrapT=THREE.RepeatWrapping;}
  caches.set(kind,t);return t;
}

export function skyTexture(theme) {
  const c=document.createElement('canvas');c.width=16;c.height=512;const x=c.getContext('2d');
  const colors={jungle:['#29424f','#67848a','#a6b5ad'],waterfall:['#294858','#658b92','#b1c4be'],snow:['#283b4c','#697e8b','#bbc9c9'],energy:['#211e22','#544238','#a27b54'],hangar:['#17212c','#364450','#6c7980'],alien:['#100f18','#2d2434','#5a414c'],base:['#0b111a','#15232d','#263943'],base2:['#0d1019','#232632','#3a3d4a']}[theme];
  const g=x.createLinearGradient(0,0,0,512);g.addColorStop(0,colors[0]);g.addColorStop(.64,colors[1]);g.addColorStop(1,colors[2]);x.fillStyle=g;x.fillRect(0,0,16,512);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
