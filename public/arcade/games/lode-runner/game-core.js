(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./levels.js'));
  else root.LodeRunner = factory(root.LodeLevels);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (LEVELS) {
  'use strict';
  const STEP = 0.13, HOLE_TICKS = 55, TRAP_TICKS = 25;
  const key = (x, y) => x + ',' + y;
  const actor = (x,y,id) => ({x,y,fromX:x,fromY:y,facing:1,anim:0,id,trap:0,respawn:0,immunity:0,carry:false,carryTicks:0});
  class Game {
    constructor(options={}) { this.levels=options.levels||LEVELS; this.noGuards=!!options.noGuards; this.best=Number.isFinite(options.best)&&options.best>0?Math.floor(options.best):0; this.status='title'; this.score=0; this.lives=5; this.events=[]; this.load(0); this.status='title'; }
    load(index) {
      this.index=index; this.level=this.levels[index]; this.width=this.level.map[0].length; this.height=this.level.map.length;
      this.tiles=[];this.gold=new Set();this.holes=new Map();this.guards=[];this.player=null;this.tick=0;this.stageTime=0;this.digCooldown=0;this.deathReason='';this.exitOpen=false;
      this.level.map.forEach((r,y)=>{this.tiles[y]=[];[...r].forEach((c,x)=>{
        if(c==='P'){this.player=actor(x,y,-1);c=' ';}else if(c==='G'){this.guards.push(actor(x,y,this.guards.length));c=' ';}else if(c==='$'){this.gold.add(key(x,y));c=' ';}this.tiles[y][x]=c;
      });});
      if(!this.player)throw Error('Level needs a player');this.totalGold=this.gold.size;this.collected=0;this.status='playing';this.events=[];
    }
    start(index=0){this.score=0;this.lives=5;this.load(Math.max(0,Math.min(this.levels.length-1,index)));this.emit('start');}
    emit(type,data={}){this.events.push({type,...data});}
    drainEvents(){const e=this.events;this.events=[];return e;}
    tile(x,y){if(x<0||x>=this.width||y>=this.height)return '=';if(y<0)return ' ';const t=this.tiles[y][x];return t==='E'?(this.exitOpen?'H':' '):t;}
    base(x,y){return this.tiles[y]?.[x]||' ';}
    solid(x,y){const t=this.tile(x,y);return t==='='||(t==='#'&&!this.holes.has(key(x,y)));}
    ladder(x,y){return this.tile(x,y)==='H';}
    trappedAt(x,y){return !this.noGuards&&this.guards.some(g=>!g.respawn&&g.trap>0&&g.x===x&&g.y===y);}
    supported(a){return this.solid(a.x,a.y+1)||this.ladder(a.x,a.y+1)||this.trappedAt(a.x,a.y+1);}
    falling(a){return !this.ladder(a.x,a.y)&&this.tile(a.x,a.y)!=='-'&&!this.supported(a);}
    canDig(dir,a=this.player){const x=a.x+dir,y=a.y+1;return !this.falling(a)&&this.base(x,y)==='#'&&!this.holes.has(key(x,y))&&!this.solid(x,a.y)&&!['H','-'].includes(this.tile(x,a.y))&&(this.noGuards||!this.guards.some(g=>!g.respawn&&g.x===x&&g.y===a.y));}
    dig(dir){if(this.digCooldown||!this.canDig(dir))return false;const x=this.player.x+dir,y=this.player.y+1;this.holes.set(key(x,y),{x,y,left:HOLE_TICKS,full:HOLE_TICKS});this.player.facing=dir;this.digCooldown=2;this.emit('dig',{x,y});return true;}
    moveOptions(a,guard=false){
      if(this.falling(a))return [{x:a.x,y:a.y+1,action:'down',fall:true}];
      const opts=[];
      if(this.ladder(a.x,a.y)&&a.y>0&&!this.solid(a.x,a.y-1))opts.push({x:a.x,y:a.y-1,action:'up'});
      if((this.ladder(a.x,a.y)||this.ladder(a.x,a.y+1)||this.tile(a.x,a.y)==='-')&&!this.solid(a.x,a.y+1)&&!this.trappedAt(a.x,a.y+1))opts.push({x:a.x,y:a.y+1,action:'down'});
      for(const d of [-1,1])if(!this.solid(a.x+d,a.y))opts.push({x:a.x+d,y:a.y,action:d<0?'left':'right'});
      return opts;
    }
    move(a,next){a.fromX=a.x;a.fromY=a.y;if(next.x!==a.x)a.facing=Math.sign(next.x-a.x);a.x=next.x;a.y=next.y;a.anim++;}
    collect(){const p=this.player,k=key(p.x,p.y);if(this.gold.delete(k)){this.collected++;this.addScore(100);this.emit('gold',{x:p.x,y:p.y});}this.updateExit();}
    updateExit(){if(!this.exitOpen&&this.collected===this.totalGold){this.exitOpen=true;this.emit('exit');}}
    addScore(points){this.score+=points;this.best=Math.max(this.best,this.score);}
    die(reason){if(this.status!=='playing')return;this.lives--;this.status=this.lives>0?'dead':'gameover';this.deathReason=reason;this.emit('death');}
    retry(){if(this.status==='dead')this.load(this.index);}
    next(){if(this.status!=='clear')return;if(this.index+1<this.levels.length)this.load(this.index+1);else{this.status='won';this.emit('won');}}
    pause(){if(this.status==='playing'){this.status='paused';this.emit('pause');}else if(this.status==='paused')this.status='playing';}
    dropGold(g){if(!g.carry)return;let x=g.x,y=g.y;if(g.trap)y--;if(y<0)y=0;const choices=[[x,y],[x-1,y],[x+1,y],[x,y-1]];let place=choices.find(([xx,yy])=>xx>=0&&xx<this.width&&yy>=0&&!this.solid(xx,yy)&&!this.gold.has(key(xx,yy)));if(!place)place=[this.player.x,this.player.y];this.gold.add(key(...place));g.carry=false;g.carryTicks=0;this.emit('drop',{x:place[0],y:place[1]});}
    guardDirection(g){
      const queue=[{x:g.x,y:g.y,first:null}],seen=new Set([key(g.x,g.y)]);let fallback=null,dist=Infinity;
      for(let i=0;i<queue.length&&i<this.width*this.height;i++){
        const n=queue[i],d=Math.abs(n.x-this.player.x)+Math.abs(n.y-this.player.y)*1.5;
        if(n.first&&d<dist){dist=d;fallback=n.first;}if(n.x===this.player.x&&n.y===this.player.y)return n.first;
        const opts=this.moveOptions(n,true);if((g.id+this.tick)%2)opts.reverse();
        for(const p of opts){if(p.y<0||p.y>=this.height-1)continue;const k=key(p.x,p.y);if(seen.has(k))continue;seen.add(k);queue.push({x:p.x,y:p.y,first:n.first||p});}
      }
      return fallback;
    }
    hitGuard(){if(this.noGuards)return;for(const g of this.guards){if(g.trap||g.respawn||g.immunity)continue;const p=this.player;const same=g.x===p.x&&g.y===p.y;const crossed=g.x===p.fromX&&g.y===p.fromY&&g.fromX===p.x&&g.fromY===p.y;if(same||crossed){this.die('被机器人抓住了');return;}}}
    step(input={}){
      if(this.status!=='playing')return;this.tick++;this.stageTime+=STEP;this.player.fromX=this.player.x;this.player.fromY=this.player.y;
      for(const g of this.guards){g.fromX=g.x;g.fromY=g.y;}
      if(this.digCooldown)this.digCooldown--;
      // Refill first: occupied cells close around their occupants, never silently teleport them.
      for(const [k,h] of this.holes){h.left--;if(h.left<=0){this.holes.delete(k);if(this.player.x===h.x&&this.player.y===h.y){this.die('洞口合拢，没能及时离开');return;}for(const g of this.guards)if(!g.respawn&&g.x===h.x&&g.y===h.y){this.dropGold(g);g.respawn=18;g.trap=0;this.addScore(100);this.emit('bury',{x:g.x,y:g.y});}}}
      const act=typeof input==='string'?input:input.action;
      let dug=false;if(act==='digLeft'||input.digLeft)dug=this.dig(-1);else if(act==='digRight'||input.digRight)dug=this.dig(1);
      const options=this.moveOptions(this.player);let next;
      if(this.falling(this.player))next=options[0];else if(!dug&&!this.digCooldown){const moves=['up','down','left','right'];const action=moves.includes(act)?act:moves.find(k=>input[k]);next=options.find(o=>o.action===action);}
      if(next)this.move(this.player,next);this.collect();this.hitGuard();if(this.status!=='playing')return;
      if(!this.noGuards)for(const g of this.guards){
        if(g.respawn){g.respawn--;if(!g.respawn){const choices=[];for(let x=0;x<this.width;x++)if(!this.solid(x,0)&&Math.abs(x-this.player.x)>3)choices.push(x);g.x=choices[(this.tick+g.id*7)%Math.max(1,choices.length)]??0;g.y=0;g.fromX=g.x;g.fromY=g.y;g.immunity=5;}continue;}
        if(g.immunity)g.immunity--;
        if(g.trap){g.trap--;if(!g.trap){if(!this.solid(g.x,g.y-1)){this.move(g,{x:g.x,y:g.y-1});g.immunity=3; // exit the pit sideways before falling back
            const dir=this.player.x<g.x?-1:1;let x=g.x+dir;if(this.solid(x,g.y))x=g.x-dir;if(!this.solid(x,g.y))g.x=x;g.fromX=g.x;g.fromY=g.y;
          }else g.trap=2;}continue;}
        if((this.tick+g.id)%2===0||this.falling(g)){const n=this.guardDirection(g);if(n&&!this.guards.some(other=>other!==g&&!other.respawn&&!other.trap&&other.x===n.x&&other.y===n.y))this.move(g,n);}
        const hole=this.holes.get(key(g.x,g.y));if(hole&&!g.immunity){g.trap=TRAP_TICKS;this.dropGold(g);this.emit('trap',{x:g.x,y:g.y});}
        if(!g.trap){if(g.carry){g.carryTicks++;if(g.carryTicks>90&&this.supported(g))this.dropGold(g);}else if(!g.immunity&&this.gold.has(key(g.x,g.y))){this.gold.delete(key(g.x,g.y));g.carry=true;g.carryTicks=0;this.emit('steal');}}
      }
      this.hitGuard();if(this.status!=='playing')return;
      if(this.exitOpen&&this.player.y===0&&this.base(this.player.x,0)==='E'){this.status='clear';this.lives=Math.min(9,this.lives+1);this.emit('clear');}
    }
  }
  return {Game,LEVELS,STEP,HOLE_TICKS,TRAP_TICKS,key};
});
