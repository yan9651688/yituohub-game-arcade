/* 本区行图由当前可行走场景直接绘制，地标坐标与寻路目标共用。 */
(function(){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function mount(host,scene,targets,player,state){
    if(!host||!scene)return;
    const J=window.JianghuScene,w=1100,h=710,pad=75,canvas=host.querySelector('canvas'),ctx=canvas?.getContext('2d');if(!ctx)return;
    canvas.width=w;canvas.height=h;
    const corners=[[0,0],[scene.width,0],[scene.width,scene.height],[0,scene.height]].map(([x,y])=>J.project(x,y));
    const xs=corners.map(q=>q.x),ys=corners.map(q=>q.y),z=Math.min((w-pad*2)/(Math.max(...xs)-Math.min(...xs)),(h-pad*2)/(Math.max(...ys)-Math.min(...ys)));
    const camera={x:scene.width/2,y:scene.height/2,z:30,width:w,height:h,zoom:z};
    scene.drawGround(ctx,camera,18000);
    const objects=scene.getDrawables(camera,18000,{x:-10000,y:-10000}).slice().sort((a,b)=>a.depth-b.depth);
    for(const o of objects){ctx.save();o.draw(ctx);ctx.restore();}
    const screen=q=>J.screen(q.x,q.y,scene.heightAt(q.x,q.y),camera);
    const seen=state?.world?.seen||[],markers=[];
    for(const a of scene.landmarks||[]){
      const task=targets.find(t=>t.type==='task'&&t.anchor===a.id),main=a.id==='main'?targets.find(t=>t.type==='main'):null,side=a.id==='side1'||a.id==='side2'?targets.filter(t=>t.type==='side')[a.id==='side1'?0:1]:null;
      const target=targets.find(t=>t.type==='tower'&&t.anchor===a.id)||task||main||side||targets.find(t=>t.type==='discovery'&&Math.hypot(t.x-a.x,t.y-a.y)<100)||targets.find(t=>t.type==='landmark'&&t.anchor===a.id);
      const q=screen(a),type=target?.type||'landmark',done=!!target?.done,known=seen.includes(scene.id+':'+a.id);
      markers.push(`<button class="region-map-pin ${type}${done?' done':''}${known?' seen':''}" style="left:${q.x/w*100}%;top:${q.y/h*100}%" data-action="world-target" data-id="${esc(target?.id||'landmark-'+scene.id+'-'+a.id)}" title="${esc(task?task.label:a.description||a.name)}"><i>${done?'✓':type==='task'?'!':type==='main'?'◆':type==='side'?'◇':type==='discovery'?'✦':type==='tower'?'塔':'·'}</i><span>${esc(a.name)}</span>${task?'<em>有待办</em>':''}</button>`);
    }
    for(const e of scene.exits||[]){const q=screen(e),name=window.GAME_DATA.locations.find(l=>l.id===e.to)?.name||e.to;markers.push(`<button class="region-map-pin exit" style="left:${q.x/w*100}%;top:${q.y/h*100}%" data-action="world-target" data-id="${esc(e.id)}"><i>↗</i><span>${esc(name)}</span></button>`);}
    const q=screen(player);markers.push(`<div class="region-map-player" style="left:${q.x/w*100}%;top:${q.y/h*100}%" title="此刻所在"><i style="transform:rotate(${player.dir}rad)">➤</i><span>你</span></div>`);
    const overlay=host.querySelector('.region-map-markers');if(overlay)overlay.innerHTML=markers.join('');
  }
  window.JianghuAtlas={mount};
})();
