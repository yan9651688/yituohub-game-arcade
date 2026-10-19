(function(){'use strict';
// Original composition: "Pocket-sized Sunday", 32 bars in C major, 72 BPM.
// All instruments are synthesized locally. No recordings, fetches or dependencies.
const MIX_GAIN=1.95; // Gentle default, with clear laptop-level audibility and headroom at 100%.
const KEY='hollow-city-audio-v1',BPM=72,BEAT=60/BPM,BARS=32,LOOP_BEATS=BARS*4;
const HARMONY=[[48,60,64,67,71],[45,60,64,67,69],[41,60,64,67,69],[43,59,62,67,69],
[48,60,64,67,71],[45,60,64,67,69],[50,60,65,69,72],[43,59,62,65,69],
[41,60,64,67,69],[48,59,64,67,72],[45,60,64,67,71],[43,59,62,67,69],
[41,60,64,67,69],[50,60,65,69,72],[43,59,62,65,69],[48,60,64,67,71]];
// Call-and-response phrases leave space between notes; the B section opens up.
const MELODY=[[[0,76,1.3],[1.5,79,.75],[3,74,.8]],[[.5,72,1],[2,76,1.4]],[[0,77,1],[1.5,76,.6],[2.5,72,1.2]],[[.5,74,1.5],[3,71,.6]],
[[0,72,.8],[1.5,76,.8],[3,79,.8]],[[0,81,1.3],[2,79,1.4]],[[.5,77,1.1],[2,74,1.3]],[[0,71,1.3],[2,74,.8]],
[[0,77,1.6],[2.5,79,1]],[[.5,76,1],[2,74,.6],[3,72,.6]],[[0,76,1.3],[2,79,1.4]],[[.5,74,1.6]],
[[0,72,1],[1.5,77,1.2]],[[.5,74,1],[2,77,1.2]],[[0,74,1.5],[2.5,71,1]],[[0,72,2.6]]];
const events=[];
for(let bar=0;bar<BARS;bar++){
const chord=HARMONY[bar%16],at=bar*4,section=bar>=16;
events.push({beat:at,note:chord[0],duration:3.6,voice:'bass',gain:.058});
for(let n=1;n<4;n++)events.push({beat:at+(n-1)*.035,note:chord[n],duration:4.35,voice:'pad',gain:.027});
for(const [beat,note,duration]of MELODY[bar%16])events.push({beat:at+beat,note:note+(section&&bar%8<4?12:0),duration,voice:'felt',gain:section?.062:.067});
// A quieter, broken-chord answer in the second half, not a constant ticking ostinato.
if(section||bar%4===2)for(let n=0;n<3;n++)events.push({beat:at+.75+n,note:chord[1+n]+12,duration:.72,voice:'glass',gain:.015});
}
events.sort((a,b)=>a.beat-b.beat);Object.freeze(events);
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}
function settings(storage){try{const s=JSON.parse(storage?.getItem(KEY));return{muted:s?.muted===true,volume:typeof s?.volume==='number'&&Number.isFinite(s.volume)?clamp(s.volume,0,1):.32};}catch(e){return{muted:false,volume:.32};}}
class Music{
constructor(options={}){this.storage=options.storage===undefined?(()=>{try{return localStorage;}catch(e){return null;}})():options.storage;Object.assign(this,settings(this.storage));this.contextFactory=options.contextFactory||(()=>new(window.AudioContext||window.webkitAudioContext)());this.interval=options.setInterval||((callback,ms)=>window.setInterval(callback,ms));this.clearInterval=options.clearInterval||(id=>window.clearInterval(id));this.onChange=options.onChange||(()=>{});this.context=null;this.master=null;this.bus=null;this.unlocked=false;this.active=true;this.available=true;this.lastError=null;this.timer=null;this.cursor=0;this.origin=0;this.scheduled=0;this.suspendedByLifecycle=false;this.pending=null;this.destroyed=false;}
get status(){return{muted:this.muted,volume:this.volume,unlocked:this.unlocked,active:this.active,available:this.available,state:this.context?.state||'locked',scheduled:this.scheduled,schedulerActive:this.timer!==null,contextTime:this.context?.currentTime||0,error:this.lastError,title:'口袋里的星期天',bars:BARS,bpm:BPM};}
notify(){this.onChange(this.status);}
persist(){try{this.storage?.setItem(KEY,JSON.stringify({muted:this.muted,volume:this.volume}));}catch(e){}}
create(){if(this.context||this.destroyed)return;const c=this.contextFactory();this.context=c;this.master=c.createGain();this.master.gain.value=this.muted?0:this.volume*MIX_GAIN;this.bus=c.createGain();this.bus.gain.value=.7;const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=3700;filter.Q.value=.35;const compressor=c.createDynamicsCompressor();compressor.threshold.value=-20;compressor.knee.value=18;compressor.ratio.value=2;compressor.attack.value=.02;compressor.release.value=.3;this.bus.connect(filter).connect(compressor).connect(this.master).connect(c.destination);
// Subtle stereo echo shared by every voice; it also bridges the loop naturally.
const delay=c.createDelay(1),feedback=c.createGain(),wet=c.createGain();delay.delayTime.value=BEAT*.75;feedback.gain.value=.19;wet.gain.value=.15;this.bus.connect(delay);delay.connect(feedback).connect(delay);delay.connect(wet).connect(filter);
this.origin=c.currentTime+.08;c.onstatechange=()=>this.notify();}
unlock(){if(this.destroyed)return Promise.resolve(false);this.unlocked=true;try{this.create();this.available=true;this.lastError=null;this.setGain();}catch(e){this.available=false;this.lastError=e?.message||'Audio is unavailable';this.notify();return Promise.resolve(false);}this.notify();return this.sync();}
setMuted(value){this.muted=!!value;this.persist();this.setGain();this.notify();return this.sync();}
setVolume(value){const v=Number(value);if(!Number.isFinite(v))return;this.volume=clamp(v,0,1);this.persist();this.setGain();this.notify();return this.sync();}
setGain(){if(!this.master)return;const g=this.master.gain,t=this.context.currentTime;g.cancelScheduledValues(t);g.setTargetAtTime(this.muted?0:this.volume*MIX_GAIN,t,.035);}
setActive(value){value=!!value;if(this.active===value)return;this.active=value;this.notify();return this.sync();}
// Reconcile against the latest desired state after each async resume/suspend.
// This prevents rapid mute/pause clicks from leaving a stale resume running.
async fail(error){this.available=false;this.lastError=error?.message||'Audio playback failed';if(this.timer!==null){try{this.clearInterval(this.timer);}catch(e){}this.timer=null;}if(this.master)this.master.gain.setTargetAtTime(0,this.context.currentTime,.02);if(this.context?.state==='running')try{await this.context.suspend();}catch(e){}this.notify();return false;}
sync(){if(!this.context||!this.unlocked||this.destroyed)return Promise.resolve(false);if(this.pending)return this.pending;this.pending=(async()=>{for(let pass=0;pass<8;pass++){const desired=this.active&&!this.muted&&this.volume>0,c=this.context;if(c.state==='closed')throw new Error('Audio context is closed');if(desired){if(c.state!=='running'){await c.resume();if(c.state!=='running')throw new Error('Browser did not start audio');}if(this.timer===null){this.schedule();this.timer=this.interval(()=>{try{this.schedule();}catch(error){this.fail(error);}},100);}this.suspendedByLifecycle=false;}else{if(this.timer!==null){this.clearInterval(this.timer);this.timer=null;}if(c.state==='running')await c.suspend();this.suspendedByLifecycle=true;}if(desired===(this.active&&!this.muted&&this.volume>0))break;}return this.context?.state==='running';})().catch(error=>this.fail(error)).finally(()=>{this.pending=null;this.notify();});return this.pending;}

schedule(){const c=this.context;if(!c||c.state!=='running'||!this.active||this.muted||this.volume<=0)return;const horizon=c.currentTime+.32;
// If an externally interrupted context skipped forward, resume on the next beat.
if(this.origin+events[this.cursor].beat*BEAT<c.currentTime-1){this.origin=c.currentTime+.08;this.cursor=0;}
let budget=40;while(budget--){const e=events[this.cursor],at=this.origin+e.beat*BEAT;if(at>horizon)break;this.note(e,Math.max(c.currentTime+.01,at));this.scheduled++;this.cursor++;if(this.cursor===events.length){this.cursor=0;this.origin+=LOOP_BEATS*BEAT;}}}
note(e,at){const c=this.context,duration=e.duration*BEAT,env=c.createGain(),freq=440*Math.pow(2,(e.note-69)/12),pad=e.voice==='pad',bass=e.voice==='bass',attack=pad?.28:bass?.06:.014,release=pad?.6:bass?.22:.7,end=at+duration+release;
env.gain.setValueAtTime(0,at);env.gain.linearRampToValueAtTime(e.gain,at+attack);env.gain.exponentialRampToValueAtTime(Math.max(.0001,e.gain*(pad?.66:.24)),at+duration);env.gain.exponentialRampToValueAtTime(.0001,end);env.connect(this.bus);
const osc=c.createOscillator();osc.type=pad?'triangle':'sine';osc.frequency.value=freq;if(pad)osc.detune.value=(e.note%3-1)*3;osc.connect(env);osc.start(at);osc.stop(end+.02);
// A soft upper partial adds a felt-key tone; quiet enough to avoid bell harshness.
let upper=null,upperGain=null;if(e.voice==='felt'||e.voice==='glass'){upper=c.createOscillator();upperGain=c.createGain();upper.type='sine';upper.frequency.value=freq*(e.voice==='felt'?2.002:3.001);upperGain.gain.value=e.voice==='felt'?.12:.055;upper.connect(upperGain).connect(env);upper.start(at);upper.stop(end+.02);}
osc.onended=()=>{osc.disconnect();env.disconnect();if(upper){upper.disconnect();upperGain.disconnect();}};}
effect(freq,duration=.06){const c=this.context;if(!c||c.state!=='running'||this.muted||!this.active||this.volume<=0)return;const g=c.createGain(),o=c.createOscillator(),t=c.currentTime;o.type='sine';o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*.68,t+duration);g.gain.setValueAtTime(.027,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(this.master);o.start(t);o.stop(t+duration+.01);o.onended=()=>{o.disconnect();g.disconnect();};}
async destroy(){this.destroyed=true;if(this.timer!==null)this.clearInterval(this.timer);this.timer=null;if(this.context&&this.context.state!=='closed')try{await this.context.close();}catch(e){}this.notify();}
}
window.HCAudio=Object.freeze({Music,score:events,bpm:BPM,loopBeats:LOOP_BEATS,storageKey:KEY,title:'口袋里的星期天'});
})();
