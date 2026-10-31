(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CircusCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DT = 1 / 60;
  const W = 384, H = 256, FLOOR = 211;
  // FC exposes a descending bonus, not an invented clean-clear reward.
  // The 16-frame quantum is a reconstruction consistent with the published
  // active-stage frame / remaining-bonus pairs; see REFERENCES.md.
  const BONUS_START = 5000, BONUS_STEP = 10, BONUS_FRAMES = 16;
  const TIME_LIMIT = BONUS_START / BONUS_STEP * BONUS_FRAMES * DT;
  const STAGES = [
    { name: '骑狮钻火圈', short: '骑狮', en: 'LION & FIRE', meters: 100, length: 3772, time: TIME_LIMIT,
      help: '左右控制狮子；起跳穿过火圈中央，同时越过地上的火盆。火圈会缓慢迎面移动；最后要跳上终点台。', tip: '让狮子的脚进入火圈的亮色开口。', action: '跳跃' },
    { name: '高空走钢丝', short: '钢丝', en: 'TIGHTROPE', meters: 70, length: 3260, time: TIME_LIMIT,
      help: '左右走钢丝，跳过迎面而来的猴子。棕猴成小群前进，蓝猴速度快，还会跳过同伴；最后跳上终点台。', tip: '看准整群猴子，不要急着落地。', action: '跳跃' },
    { name: '彩球接力', short: '踩球', en: 'BALANCING BALLS', meters: 80, length: 3360, time: TIME_LIMIT,
      help: '左右滚动脚下的彩球，起跳换到下一颗。空中也能调整方向；掉地或两球相撞都会失误。最后跳上终点台。', tip: '先靠近下一颗球，再起跳；落点比距离更重要。', action: '换球' },
    { name: '马术跳板', short: '马术', en: 'TRICK RIDING', meters: 200, length: 4180, time: TIME_LIMIT,
      help: '马儿自动向前跑，左减速、右加速。人从马背起跳，落在跳板顶会再次弹起，最后回到马背。撞到跳板侧面会失误，最后要从马背跳上终点台。', tip: '跳板前减速，从上方落下才能弹跳。', action: '起跳' },
    { name: '空中飞人', short: '飞人', en: 'FLYING TRAPEZE', meters: 50, length: 2850, time: TIME_LIMIT,
      help: '从摆杆上按动作键松手跃出，左右调整飞行。靠近下一根杆会自动接住，空中再按动作键可主动伸手。下方弹床能救场，终点要落上高台。', tip: '向右摆出时松手；青色箭头提示较好的时机。', action: '松手 / 抓杆' }
  ];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const overlap = (x, y, w, h, a, b, c, d) => x < a+c && x+w > a && y < b+d && y+h > b;
  function ropePosition(rope, time, loop) {
    const omega = 1.72 + Math.min(loop, 4) * .1;
    const angle = .68 * Math.sin(time * omega + rope.phase);
    const av = .68 * omega * Math.cos(time * omega + rope.phase);
    return { x: rope.x + Math.sin(angle) * rope.length, y: rope.y + Math.cos(angle) * rope.length,
      vx: Math.cos(angle) * rope.length * av, vy: -Math.sin(angle) * rope.length * av, angle };
  }
  function layout(stage, loop) {
    const harder = loop > 0;
    const pedestal = (y) => ({ x: STAGES[stage].length, y, w: 115 });
    if (stage === 0) return {
      // Nine pots occupy the 10 m marks before the 100 m pedestal.
      pots: Array.from({length:9}, (_,i) => ({ x:72+(i+1)*370, id:'pot'+i, scored:false })),
      rings: Array.from({length:10}, (_,i) => ({ x:400+i*405, id:'ring'+i, scored:false, speed:9+Math.min(loop,5)*2 })),
      coins: [], platform:pedestal(163)
    };
    if (stage === 1) {
      const monkeys=[];
      Array.from({length:16}, (_,i) => 320+i*285).forEach((x,i) => {
        monkeys.push({ x, y:195, vy:0, blue:false, scored:false, id:'m'+i+'a' });
        if(i%2===1||harder) monkeys.push({ x:x+31, y:195, vy:0, blue:false, scored:false, id:'m'+i+'b' });
        if(i%4===2||harder&&i%4===0) monkeys.push({ x:x+110, y:195, vy:0, blue:true, scored:false, id:'m'+i+'c' });
      });
      return { monkeys, platform:pedestal(163) };
    }
    if (stage === 2) return {
      balls:Array.from({length:17}, (_,i)=>({ x:72+i*240, id:i, radius:19, spin:0 })),
      platform:pedestal(169)
    };
    if (stage === 3) return {
      boards:Array.from({length:8}, (_,i)=>[
        {x:350+i*460,y:i%2?160:166,w:58},
        {x:440+i*460,y:i%2?142:148,w:58}
      ]).flat().map((b,i)=>({...b,w:b.w-(harder?10:0),id:i,scored:false})),
      horse:{x:72,speed:94}, bounceCombo:0, platform:pedestal(150)
    };
    return {
      ropes:Array.from({length:18}, (_,i)=>({x:105+i*150,y:61,length:79,phase:i*Math.PI,id:i})),
      trampolines:Array.from({length:18}, (_,i)=>({x:188+i*150,y:221,w:58-(harder?8:0),id:i})),
      platform:pedestal(178)
    };
  }
  class Game {
    constructor(options) {
      this.options=options||{}; this.best=Number(this.options.best)||0; this.mode='title'; this.previousMode='playing';
      this.score=0; this.lives=3; this.stage=0; this.loop=0; this.practice=false; this.nextLife=20000;
      this.events=[]; this.frame=0; this.previousAction=false; this.setup();
    }
    setup() {
      this.field=layout(this.stage,this.loop); this.time=STAGES[this.stage].time; this.elapsed=0; this.stageFrame=0; this.bonus=BONUS_START; this.camera=0;
      this.player={ x:72, y:195, vx:0, vy:0, grounded:true, support:0, rope:-1, lastRope:-1, flight:0, reach:0, direction:1 };
      this.visited=new Set([0]); this.jumpClears={rings:0,pots:0,combos:0}; this.stageDeaths=0; this.reason=''; this.previousAction=false; this.stageBonus=0;
      if(this.stage===2) this.player.y=FLOOR-38;
      if(this.stage===3) this.player.y=182;
      if(this.stage===4) { this.player.rope=0; this.player.grounded=false; this.syncRope(); }
    }
    start(stage, practice) {
      this.stage=clamp(Number(stage)||0,0,4); this.loop=0; this.practice=!!practice; this.score=0; this.lives=3; this.nextLife=20000; this.frame=0;
      this.setup(); this.mode='playing'; this.events=[{type:'start'}]; return this;
    }
    pause(value) {
      if(value!==false && this.mode==='playing') { this.mode='paused'; this.previousAction=false; return true; }
      if(value===false && this.mode==='paused') { this.mode='playing'; this.previousAction=false; return true; }
      return false;
    }
    retry() {
      if(this.mode!=='lost') return false;
      const deaths=this.stageDeaths+1; this.setup(); this.stageDeaths=deaths; this.mode='playing'; this.events=[{type:'start'}]; return true;
    }
    next() {
      if(this.mode!=='clear' && this.mode!=='cycle') return false;
      if(this.practice) { this.stage=(this.stage+1)%5; }
      else if(this.stage===4) { this.stage=0; this.loop++; }
      else this.stage++;
      this.setup(); this.mode='playing'; this.events=[{type:'start'}]; return true;
    }
    addScore(points, x, y) {
      this.score+=points;
      if(!this.practice) this.best=Math.max(this.best,this.score);
      this.events.push({type:'score',points,x:x===undefined?this.player.x:x,y:y===undefined?this.player.y-30:y});
      while(this.score>=this.nextLife) { this.lives=Math.min(9,this.lives+1); this.nextLife+=40000; this.events.push({type:'life'}); }
    }
    fail(reason) {
      if(this.mode!=='playing') return;
      this.lives--; this.reason=reason; this.mode=this.lives>0?'lost':'gameover'; this.events.push({type:'fail'}); this.previousAction=false;
    }
    clearStage() {
      if(this.mode!=='playing') return;
      this.stageBonus=this.bonus;
      this.addScore(this.stageBonus); this.mode=this.stage===4?'cycle':'clear'; this.events.push({type:'clear'});
    }
    jump(force) {
      this.jumpClears={rings:0,pots:0,combos:0};
      const p=this.player; p.vy=force||-257; p.grounded=false; p.flight=0; this.events.push({type:'jump'});
    }
    syncRope() {
      const p=this.player, r=ropePosition(this.field.ropes[p.rope],this.elapsed,this.loop);
      p.x=r.x; p.y=r.y+24; p.vx=r.vx; p.vy=r.vy; return r;
    }
    tick(input) {
      input=input||{}; this.events=[];
      if(this.mode!=='playing') return;
      const action=!!input.action&&!this.previousAction; this.previousAction=!!input.action;
      const dir=(input.right?1:0)-(input.left?1:0); if(dir) this.player.direction=dir;
      this.frame++; this.stageFrame++; this.elapsed+=DT; this.time=Math.max(0,this.time-DT);
      this.bonus=Math.max(0,BONUS_START-Math.floor(this.stageFrame/BONUS_FRAMES)*BONUS_STEP);
      if(this.time<=0||this.bonus===0) { this.fail('时间到了，再试一次。'); return; }
      if(this.stage===0) this.lion(dir,action);
      else if(this.stage===1) this.tightrope(dir,action);
      else if(this.stage===2) this.balls(dir,action);
      else if(this.stage===3) this.horse(dir,action);
      else this.trapeze(dir,action);
      this.camera=clamp(this.player.x-114,0,STAGES[this.stage].length-W+180);
    }
    groundMove(dir, action, speed, floor, gravity) {
      const p=this.player; if(action&&p.grounded) this.jump();
      p.vx=dir*speed; p.x=clamp(p.x+p.vx*DT,24,STAGES[this.stage].length+125);
      if(!p.grounded) { p.vy+=gravity*DT; p.y+=p.vy*DT; p.flight+=DT;
        if(p.y>=floor) { p.y=floor; p.vy=0; p.grounded=true; this.events.push({type:'land'}); }
      }
    }
    landOnPedestal(oldY) {
      const p=this.player, f=this.field.platform;
      if(!p.grounded&&p.vy>=0&&oldY<=f.y&&p.y>=f.y&&p.x>f.x-5&&p.x<f.x+f.w) {
        p.y=f.y;p.vy=0;p.grounded=true;p.support=-2;this.events.push({type:'land'});
      }
      if(p.grounded&&p.support===-2) this.clearStage();
    }
    lion(dir, action) {
      const p=this.player, oldY=p.y;
      this.groundMove(dir,action,89,195,650);
      for(const ring of this.field.rings) {
        ring.x-=ring.speed*DT;
        if(Math.abs(p.x-ring.x)<13 && (p.y>178 || p.y<137)) { this.fail('碰到火圈了。让狮子从亮色开口穿过去。'); return; }
        if(!ring.scored && p.x>ring.x+14) { ring.scored=true; this.addScore(100,ring.x,123); if(!p.grounded)this.jumpClears.rings++; }
      }
      for(const pot of this.field.pots) {
        if(overlap(p.x-10,p.y-25,20,25,pot.x-9,181,18,14)) { this.fail('碰到火盆了。稍早一点起跳。'); return; }
        if(!pot.scored&&p.x>pot.x+20) { pot.scored=true; this.addScore(200,pot.x,167); if(!p.grounded)this.jumpClears.pots++; }
      }
      const combos=Math.min(this.jumpClears.rings,this.jumpClears.pots);
      if(combos>this.jumpClears.combos){this.addScore((combos-this.jumpClears.combos)*100);this.jumpClears.combos=combos;}
      this.landOnPedestal(oldY);
    }
    tightrope(dir, action) {
      const p=this.player, oldY=p.y; this.groundMove(dir,action,83,195,620);
      for(const m of this.field.monkeys) {
        m.x-=(m.blue?72:37)*(1+Math.min(this.loop,5)*.08)*DT;
        if(m.blue&&m.y>=195) {
          const other=this.field.monkeys.find(n=>!n.blue&&n.x<m.x&&m.x-n.x<46&&m.x-n.x>0);
          if(other) m.vy=-165;
        }
        if(m.vy!==0||m.y<195) {m.vy+=620*DT;m.y+=m.vy*DT;if(m.y>=195){m.y=195;m.vy=0;}}
        if(overlap(p.x-6,p.y-23,12,23,m.x-7,m.y-14,14,14)) { this.fail(m.blue?'蓝猴也会跳。等它越过同伴，再抓住空隙。':'碰到猴子了。把整群一起跳过去。'); return; }
        if(!m.scored&&p.x>m.x+15){m.scored=true;this.addScore(m.blue?200:100,m.x,m.y-24);}
      }
      this.landOnPedestal(oldY);
    }
    balls(dir, action) {
      const p=this.player, balls=this.field.balls, platform=this.field.platform, oldY=p.y;
      for(const ball of balls) {
        const speed=p.grounded&&p.support===ball.id?(dir*70-(!dir?14:0)):-18;
        ball.x+=speed*DT;ball.spin+=speed*DT/ball.radius;
      }
      if(p.grounded&&p.support>=0){const b=balls[p.support];p.x=b.x;p.y=FLOOR-38;
        if(action){this.jump(-264);p.vx=dir*104;p.grounded=false;}
        else if(balls.some(other=>other.id!==p.support&&Math.abs(other.x-b.x)<35)){this.fail('彩球撞在一起了。相遇前跳到下一颗。');return;}
      } else if(p.grounded&&p.support===-1){if(action)this.jump(-264);p.x+=dir*82*DT;}
      if(!p.grounded) {
        p.vx=dir*104;p.x+=p.vx*DT;p.vy+=600*DT;p.y+=p.vy*DT;
        if(p.vy>=0) {
          if(oldY<=platform.y&&p.y>=platform.y&&p.x>platform.x-5&&p.x<platform.x+platform.w){p.y=platform.y;p.grounded=true;p.support=-1;p.vy=0;}
          else if(oldY<=FLOOR-38&&p.y>=FLOOR-38) {
            const landed=balls.filter(b=>Math.abs(b.x-p.x)<22).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
            if(landed){const previous=p.support;p.support=landed.id;p.grounded=true;p.vy=0;p.y=FLOOR-38;p.x=landed.x;
              if(!this.visited.has(landed.id)){this.visited.add(landed.id);this.addScore(landed.id-previous>1?500:100);}
              this.events.push({type:'land'});
            }
          }
        }
      }
      if(p.x<12||p.y>FLOOR+4){this.fail('没有落到彩球上。空中用左右键调整落点。');return;}
      if(p.grounded&&p.support===-1&&p.x>=platform.x+18)this.clearStage();
    }
    horse(dir, action) {
      const p=this.player, horse=this.field.horse, oldY=p.y;
      const target=dir<0?58:dir>0?137:94;
      horse.speed+=(target-horse.speed)*.12;horse.x=Math.min(this.field.platform.x+12,horse.x+horse.speed*DT);p.x=horse.x;
      if(action&&p.grounded){this.jump(-238);this.field.bounceCombo=0;}
      if(!p.grounded){p.vy+=570*DT;p.y+=p.vy*DT;}
      for(const b of this.field.boards) {
        if(p.x+6>b.x&&p.x-6<b.x+b.w) {
          if(p.vy>=0&&oldY<=b.y+1&&p.y>=b.y) {
            p.y=b.y;p.vy=-231;p.grounded=false;this.field.bounceCombo++;
            if(!b.scored){b.scored=true;this.addScore(100*Math.pow(2,Math.min(3,this.field.bounceCombo-1)),b.x+b.w/2,b.y-10);}
            this.events.push({type:'bounce'});
          } else if(overlap(p.x-6,p.y-24,12,24,b.x,b.y+2,b.w,19)){this.fail('撞到跳板侧面了。减速，先跳到板面上方。');return;}
        }
      }
      this.landOnPedestal(oldY);
      if(this.mode!=='playing') return;
      if(!p.grounded&&p.y>=182&&p.vy>0){p.y=182;p.vy=0;p.grounded=true;this.field.bounceCombo=0;this.events.push({type:'land'});}

    }
    trapeze(dir, action) {
      const p=this.player, oldY=p.y, f=this.field;
      p.reach=Math.max(0,p.reach-DT);
      if(p.rope>=0) {
        const r=this.syncRope();
        if(action){p.lastRope=p.rope;p.rope=-1;p.flight=0;p.vx=(dir||1)*105+r.vx*.55;p.vy=-236+Math.min(r.vy,0)*.2;p.reach=.25;this.events.push({type:'jump'});}
      } else if(p.grounded) {
        p.x+=dir*85*DT;if(action)this.jump(-250);
      } else {
        if(action)p.reach=.24;
        p.flight+=DT;p.vx=clamp(p.vx+dir*180*DT,-171,171);p.x+=p.vx*DT;p.vy+=490*DT;p.y+=p.vy*DT;
        for(const rope of f.ropes) {
          if(p.flight<.17||(rope.id===p.lastRope&&p.flight<.7))continue;
          const r=ropePosition(rope,this.elapsed,this.loop), dx=p.x-r.x,dy=(p.y-24)-r.y;
          if(dx*dx+dy*dy<Math.pow(p.reach>0?26:20,2)){
            p.rope=rope.id;p.lastRope=rope.id;this.syncRope();
            if(!this.visited.has(rope.id)){this.visited.add(rope.id);this.addScore(500);}
            this.events.push({type:'catch'});break;
          }
        }
        if(p.rope<0&&p.vy>0){
          const platform=f.platform;
          if(oldY<=platform.y&&p.y>=platform.y&&p.x>platform.x-5&&p.x<platform.x+platform.w+5){p.y=platform.y;p.vy=0;p.grounded=true;this.events.push({type:'land'});}
          else for(const t of f.trampolines)if(oldY<=t.y&&p.y>=t.y&&p.x>t.x-4&&p.x<t.x+t.w+4){p.y=t.y;p.vy=-350;p.flight=.18;this.events.push({type:'bounce'});break;}
        }
      }
      if(p.x<5||p.y>H+20){this.fail('没接住摆杆。向右摆出时再松手，也可以借下方弹床返回。');return;}
      if(p.grounded&&p.x>=f.platform.x+15)this.clearStage();
    }
    progress() { return clamp((this.player.x-72)/(STAGES[this.stage].length-72),0,1); }
  }
  return { Game, STAGES, DT, W, H, FLOOR, BONUS_START, BONUS_STEP, BONUS_FRAMES, TIME_LIMIT, ropePosition, layout, overlap, clamp };
});
