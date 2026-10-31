/* Original, dependency-free capsule puzzle implementation. See REFERENCES.md. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DrMarioCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const COLS = 8, ROWS = 16, MAX_LEVEL = 20;
  const COLORS = ['yellow', 'red', 'blue'];
  const FALL_FRAMES = [70,68,66,64,62,60,58,56,54,52,50,48,46,44,42,40,38,36,34,32,30,28,26,24,22,20,19,18,17,16,15,14,13,12,11,10,10,9,9,8,8,7,7,6,6,6,6,6,6,6,6,6,6,6,6,5,5,5,5,5,4,4,4,4,4,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,1];
  const VIRUS_COLOR_TABLE = [0,1,2,2,1,0,0,1,2,2,1,0,0,1,2,1];
  const SPEEDS = ['low', 'med', 'hi'];
  const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  const cloneBoard = board => board.map(row => row.map(cell => cell ? { ...cell } : null));
  function seededRandom(seed) {
    let state=((Number(seed)>>>0) ^ ((Number(seed)>>>0)>>>16))&65535;
    if(state<2)state=0x8988;
    function random() {
      state=(state>>>1)|(((((state>>>9)^(state>>>1))&1))<<15);
      return state/65536;
    }
    random.nextBytes=()=>{random();return [state>>>8,state&255];};
    return random;
  }
  function randomBytes(random) {
    if(random.nextBytes)return random.nextBytes();
    const n=Math.floor(random()*65536);return [n>>>8,n&255];
  }
  function generateCapsuleReserve(random) {
    const reserve=Array(128);let id=0;
    for(let i=127;i>=0;i--){id=(id+(randomBytes(random)[0]&15))%9;reserve[i]=[Math.floor(id/3),id%3];}
    return reserve;
  }
  const virusCountForLevel = level => (Math.min(MAX_LEVEL, Math.max(0, Math.floor(level))) + 1) * 4;
  const virusRowsForLevel = level => level < 15 ? 10 : level < 17 ? 11 : level < 19 ? 12 : 13;
  function canPlaceVirus(board, x, y, color) {
    if (board[y][x]) return false;
    return [[-2,0],[2,0],[0,-2],[0,2]].every(([dx,dy]) => !board[y+dy] || !board[y+dy][x+dx] || board[y+dy][x+dx].color !== color);
  }
  function generateLevel(level, random = Math.random) {
    const count = virusCountForLevel(level), cap = virusRowsForLevel(level)-1;
    // Reconstruct the original LFSR, candidate bytes, scan and color constraints.
    // Startup entropy/preview state differs, so this is not a retail seed mapping.
    for (let restart=0;restart<20;restart++) {
      const board=emptyBoard(); let remaining=count, attempts=0;
      while(remaining>0 && attempts++<20000) {
        let h,bytes;
        do { bytes=randomBytes(random);h=bytes[0]&15; } while(h>cap);
        const x=bytes[1]&7, y=15-h;
        let color=remaining&3;
        if(color===3) color=VIRUS_COLOR_TABLE[randomBytes(random)[1]&15];
        for(let position=y*COLS+x;position<ROWS*COLS;position++) {
          const px=position%COLS,py=Math.floor(position/COLS);
          if(board[py][px]) continue;
          let chosen=-1;
          for(let j=0;j<3;j++) {
            if(canPlaceVirus(board,px,py,color)) { chosen=color; break; }
            color=(color+2)%3;
          }
          if(chosen<0) continue;
          board[py][px]={kind:'virus',color:chosen,link:null};remaining--;break;
        }
      }
      if(!remaining)return board;
    }
    throw new Error('Could not generate a valid virus field');
  }
  function findMatches(board) {
    const found = new Set();
    for (let y = 0; y < ROWS; y++) {
      let x = 0;
      while (x < COLS) {
        if (!board[y][x]) { x++; continue; }
        const start = x, color = board[y][x].color;
        while (x < COLS && board[y][x] && board[y][x].color === color) x++;
        if (x - start >= 4) for (let i = start; i < x; i++) found.add(y * COLS + i);
      }
    }
    for (let x = 0; x < COLS; x++) {
      let y = 0;
      while (y < ROWS) {
        if (!board[y][x]) { y++; continue; }
        const start = y, color = board[y][x].color;
        while (y < ROWS && board[y][x] && board[y][x].color === color) y++;
        if (y - start >= 4) for (let i = start; i < y; i++) found.add(i * COLS + x);
      }
    }
    return [...found].sort((a,b) => a-b).map(index => ({ x: index % COLS, y: Math.floor(index / COLS) }));
  }
  function normalizeLinks(board) {
    const links = new Map();
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const c = board[y][x];
      if (c && c.kind === 'pill' && c.link != null) {
        if (!links.has(c.link)) links.set(c.link, []);
        links.get(c.link).push({ x,y,cell:c });
      }
    }
    for (const cells of links.values()) {
      if (cells.length !== 2 || Math.abs(cells[0].x-cells[1].x) + Math.abs(cells[0].y-cells[1].y) !== 1) {
        cells.forEach(({cell}) => { cell.link = null; });
      }
    }
  }
  function clearMatches(board, matches = findMatches(board)) {
    let viruses = 0;
    for (const {x,y} of matches) { if (board[y][x]?.kind === 'virus') viruses++; board[y][x] = null; }
    normalizeLinks(board);
    return { cells: matches.length, viruses };
  }
  function gravityStep(board) {
    const groups = [], byLink = new Map(), occupancy = new Map();
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const cell = board[y][x];
      if (!cell || cell.kind !== 'pill') continue;
      let group = cell.link == null ? null : byLink.get(cell.link);
      if (!group) { group = { cells: [], id: groups.length }; groups.push(group); if (cell.link != null) byLink.set(cell.link, group); }
      group.cells.push({x,y,cell}); occupancy.set(y*COLS+x,group);
    }
    const movable = new Map();
    function canFall(group) {
      if (movable.has(group)) return movable.get(group);
      movable.set(group,false);
      const ok = group.cells.every(({x,y}) => {
        if (y === ROWS-1) return false;
        if (!board[y+1][x]) return true;
        const support = occupancy.get((y+1)*COLS+x);
        return support === group || (!!support && canFall(support));
      });
      movable.set(group,ok); return ok;
    }
    const falling = groups.filter(canFall);
    falling.forEach(g => g.cells.forEach(({x,y}) => { board[y][x] = null; }));
    falling.forEach(g => g.cells.forEach(({x,y,cell}) => { board[y+1][x] = cell; }));
    return falling.length > 0;
  }
  function capsuleCells(capsule) {
    const {x,y,orientation:o,colors:c} = capsule;
    const offsets = [[[0,0],[1,0]],[[0,-1],[0,0]],[[1,0],[0,0]],[[0,0],[0,-1]]][o & 3];
    return offsets.map(([dx,dy],i) => ({x:x+dx,y:y+dy,color:c[i],kind:'pill'}));
  }
  function fits(board, capsule) {
    return capsuleCells(capsule).every(({x,y}) => x >= 0 && x < COLS && y >= -1 && y < ROWS && (y < 0 || !board[y][x]));
  }
  function scoreForViruses(count, speed, previouslyCleared=0) {
    const base = {low:100,med:200,hi:300}[speed] || 100;
    let score = 0;
    for (let i=0;i<count;i++) score += base * Math.pow(2,Math.min(i+previouslyCleared,5));
    return score;
  }
  class Game {
    constructor(options = {}) {
      this.seed = (Number(options.seed) >>> 0) || 0x19d04f23;
      this.random = seededRandom(this.seed);
      this.best = Number.isFinite(Number(options.best)) ? Math.max(0,Math.floor(Number(options.best))) : 0; this.score=0; this.level=0; this.speed='low';
      this.state='title'; this.previousState='playing'; this.board=generateLevel(0,this.random);
      this.active=null; this.next=[0,1]; this.events=[]; this.marked=[]; this.timer=0;
      this.serial=0; this.capsules=0; this.locked=0; this.virusCombo=0; this.chain=0; this.fallTimer=0;
    }
    get remaining() { return this.board.reduce((sum,row) => sum+row.filter(c=>c?.kind==='virus').length,0); }
    get fallInterval() {
      const base={low:15,med:25,hi:31}[this.speed];
      const fine=Math.min(49,Math.floor((this.locked+2)/10));
      return FALL_FRAMES[base+fine]/60;
    }
    emit(type,data={}) { this.events.push({type,...data}); }
    drainEvents() { const e=this.events; this.events=[]; return e; }
    makeColors() { const pair=this.reserve[this.reserveIndex].slice();this.reserveIndex=(this.reserveIndex+1)%128;return pair; }
    newGame(level=0,speed='low',seed) {
      this.level=Math.max(0,Math.min(MAX_LEVEL,Math.floor(Number(level)||0)));
      this.speed=SPEEDS.includes(speed)?speed:'low';
      if (seed !== undefined) this.seed=(Number(seed)>>>0)||0x19d04f23;
      this.random=seededRandom(this.seed); this.score=0; this.serial=0; this.events=[];
      this.loadLevel(this.level); this.emit('start');
    }
    loadLevel(level) {
      this.level=level; this.reserve=generateCapsuleReserve(this.random);this.reserveIndex=1; this.board=generateLevel(level,this.random); this.active=null; this.marked=[];
      this.capsules=0; this.locked=0; this.virusCombo=0; this.chain=0; this.timer=0; this.next=this.makeColors(); this.state='playing';
      this.spawn();
    }
    spawn() {
      this.active={x:3,y:0,orientation:0,colors:this.next.slice()}; this.next=this.makeColors();
      this.fallTimer=0; this.chain=0; this.virusCombo=0; this.capsules++;
      if (!fits(this.board,this.active)) { this.active=null; this.state='gameover'; this.emit('gameover'); }
      else { this.state='playing'; this.emit('spawn'); }
    }
    move(dx) {
      if (this.state!=='playing' || !this.active) return false;
      const target={...this.active,x:this.active.x+Math.sign(dx)};
      if (!fits(this.board,target)) return false;
      this.active=target; this.emit('move'); return true;
    }
    rotate(direction=1) {
      if (this.state!=='playing'||!this.active) return false;
      const target={...this.active,orientation:(this.active.orientation+(direction>0?1:3))%4};
      const candidates=[target];
      // NES has one leftward wall/obstacle correction when becoming horizontal.
      if ((target.orientation&1)===0) candidates.push({...target,x:target.x-1});
      const valid=candidates.find(c=>fits(this.board,c));
      if (!valid) return false;
      this.active=valid; this.emit('rotate'); return true;
    }
    down() {
      if (this.state!=='playing'||!this.active) return false;
      const target={...this.active,y:this.active.y+1};
      if (fits(this.board,target)) { this.active=target; this.fallTimer=0; return true; }
      this.lock(); return false;
    }
    lock() {
      if (!this.active) return;
      const id=++this.serial;
      capsuleCells(this.active).forEach(({x,y,color})=>{ if(y>=0)this.board[y][x]={kind:'pill',color,link:id}; });
      normalizeLinks(this.board);
      this.active=null; this.locked++; this.emit('lock'); this.checkMatches();
    }
    checkMatches() {
      this.marked=findMatches(this.board);
      if (this.marked.length) { this.chain++; this.state='clearing'; this.timer=0.30; this.emit('match',{chain:this.chain}); }
      else if (this.remaining===0) this.completeLevel();
      else { this.state='spawnWait'; this.timer=0.22; }
    }
    completeLevel() {
      this.state=this.level===MAX_LEVEL?'complete':'levelclear'; this.active=null; this.marked=[];
      this.emit('levelclear',{level:this.level,complete:this.level===MAX_LEVEL});
    }
    nextLevel() { if (this.state==='levelclear') { this.loadLevel(this.level+1); return true; } return false; }
    pause() {
      if (!['playing','clearing','falling','spawnWait'].includes(this.state)) return false;
      this.previousState=this.state; this.state='paused'; this.emit('pause'); return true;
    }
    resume() { if(this.state==='paused') { this.state=this.previousState; this.emit('resume'); return true; } return false; }
    update(dt,softDrop=false) {
      if (!Number.isFinite(dt)||dt<0) return;
      dt=Math.min(dt,0.1);
      if (this.state==='playing') {
        this.fallTimer+=dt;
        const interval=softDrop?Math.min(2/60,this.fallInterval):this.fallInterval;
        if(this.fallTimer>=interval-1e-9) { this.fallTimer-=interval; const saved=this.fallTimer; this.down(); if(this.state==='playing')this.fallTimer=saved; }
      } else if (['clearing','falling','spawnWait'].includes(this.state)) {
        this.timer-=dt; if(this.timer>0) return;
        if(this.state==='clearing') {
          const result=clearMatches(this.board,this.marked); const points=scoreForViruses(result.viruses,this.speed,this.virusCombo);
          this.virusCombo+=result.viruses;
          this.score+=points; this.best=Math.max(this.best,this.score); this.marked=[];
          this.emit('clear',{...result,points,chain:this.chain});
          if(this.remaining===0) this.completeLevel(); else {this.state='falling';this.timer=0.06;}
        } else if(this.state==='falling') {
          if(gravityStep(this.board))this.timer=0.06; else this.checkMatches();
        } else this.spawn();
      }
    }
  }
  return {COLS,ROWS,MAX_LEVEL,COLORS,SPEEDS,FALL_FRAMES,generateCapsuleReserve,emptyBoard,cloneBoard,seededRandom,virusCountForLevel,virusRowsForLevel,canPlaceVirus,generateLevel,findMatches,clearMatches,normalizeLinks,gravityStep,capsuleCells,fits,scoreForViruses,Game};
});
