(function () {
  'use strict';

  const TAU = Math.PI * 2;
  const WORLD_W = 960, WORLD_H = 600;
  const ISO_X = Math.sqrt(3) / 2, ISO_Y = .5;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hypot = Math.hypot;
  const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  const mix = (a, b, t) => a + (b - a) * t;
  const safe = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v, d) => Number.isFinite(Number(v)) ? Number(v) : d;
  const COLORS = { hongmao: '#eb7446', lantu: '#70cce7', sali: '#ba87ee', doudou: '#86c994', daben: '#e6bd67', tiaotiao: '#77d1b1', dada: '#b0ddbe' };
  // Game balance, not an official numeric martial-arts ranking. These weights
  // are measured with real cooldowns and damage-based energy generation.
  // Firewhirl belongs to awakened Hongmao; practice moves keep their old power.
  const MOVE_BALANCE = Object.freeze({
    hongmao: Object.freeze({ j: 1.05, q: 1.05, e: 1, f: 2.2 }),
    dada: Object.freeze({ j: 1.04, q: .73, e: .8 }),
    lantu: Object.freeze({ j: 1.12, q: 1.5, e: 1.4 }),
    tiaotiao: Object.freeze({ j: 1.08, q: 1.13, e: 1.1 }),
    daben: Object.freeze({ j: 1.12, q: 1.25, e: 1.25 }),
    sali: Object.freeze({ j: .77, q: .81, e: .78 }),
    doudou: Object.freeze({ j: 1, q: 1, e: 1 })
  });
  const QIN = Object.freeze({ range: 760, speed: 680, life: 1.7, turnRate: 6.2, maxLead: .2, pierce: 3 });
  const CHANGHONG = Object.freeze({ cost: 50, cd: 5.2, charge: .55, echoAt: .79, range: 620, halfWidth: 200, mainPower: 6.2, echoPower: 1.2, duration: 1.65 });
  const FIREWHIRL = Object.freeze({ cost: 100, cd: 18, duration: 3.05 });
  // Named techniques use the original series; generic sword-school labels are
  // deliberately used where an individual move has not been source-verified.
  const SKILLS = {
    hongmao: { name: '长虹剑法', ult: '长虹贯日', finisher: '火舞旋风', cd: 5.6 },
    lantu: { name: '冰魄剑法', ult: '冰天雪地', cd: 6.1 },
    sali: { name: '紫云剑法', ult: '紫气东来', cd: 5.1 },
    doudou: { name: '雨花剑法', ult: '雨花剑法', cd: 7.6 },
    daben: { name: '奔雷剑法', ult: '奔雷滚滚', cd: 6.2 },
    tiaotiao: { name: '青光剑法', ult: '青光剑法', cd: 4.8 },
    dada: { name: '旋风剑法', ult: '琴针飞箭', cd: 6.1 }
  };
  const PROFILES = {
    crowd: { total: 56, perDanger: 8, living: 22, perLiving: 2.6, opening: 15, refill: .82 },
    ambush: { total: 32, perDanger: 2, living: 20, perLiving: 1.4, opening: 16, refill: .68 },
    rescue: { total: 28, perDanger: 1.8, living: 18, perLiving: 1.25, opening: 12, refill: .84 },
    duel: { total: 20, perDanger: 3, living: 12, perLiving: 1.5, opening: 8, refill: 1.08 },
    training: { total: 1, perDanger: 0, living: 1, perLiving: 0, opening: 1, refill: 1 }
  };
  const GLYPHS = {
    attack: '<path d="M8 27L24 5l3-2-1 5-15 22M8 25l8 6M5 32l5-6"/>',
    skill: '<path d="M7 28C25 31 34 16 24 7M10 25C21 24 25 16 21 11M5 16l3 2-1 4M27 4l2 3 4 1"/>',
    ult: '<path d="M18 4v24M8 7l9 20M28 7L19 27M3 16l13 12M33 16L20 28M8 29l8 1M28 29l-8 1"/><circle cx="18" cy="29" r="3"/>',
    changhong: '<path d="M3 31L29 5l4-2-2 4L5 33l3-8 16-16M10 29L30 9M5 20L19 6M17 32L31 18"/><circle cx="26" cy="10" r="6"/><path d="M26 1v3M32 10h3M33 3l-2 2"/>',
    dodge: '<path d="M5 27C10 12 23 6 31 7c-2 8-10 21-22 23M8 28L26 12M16 20l9 2M20 16l9 0M7 33l6-1"/>',
    meditate: '<circle cx="18" cy="8" r="3"/><path d="M13 17l5-4 5 4M10 23l3-6M26 23l-3-6M12 21l6 4 6-4M10 26l-5 4h26l-5-4M8 10C2 16 3 22 6 25M28 10c6 6 5 12 2 15"/>',
    herb: '<path d="M14 15h9l5 7-2 10H11L9 22zM14 15V9h9v6M15 8h7M16 24c0-6 6-6 7-8 0 7-5 7-7 8M16 24v4"/>'
  };
  const glyph = kind => `<svg class="ss-c-glyph" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPHS[kind]}</svg>`;
  const skillGlyph = (hero, tier) => window.ItemArt && window.ItemArt.svg ? '<i class="ss-c-v4icon">' + window.ItemArt.svg('skill-' + hero + '-' + tier) + '</i>' : glyph(hero === 'hongmao' && tier === 'e' ? 'changhong' : tier === 'q' ? 'skill' : 'ult');
  let active = null;

  const CSS = `
.ss-c-supplies{position:absolute;left:50%;bottom:118px;transform:translateX(-50%);display:flex;gap:4px;z-index:7}.ss-c-supplies button{color:#f1e5c7;background:#213e35e8;border:1px solid #aa9970;border-radius:6px;min-width:58px;min-height:44px;padding:4px;font-size:11px}.ss-c-supplies kbd,.ss-c-supplies span,.ss-c-supplies em{display:block}.ss-c-supplies button:disabled{opacity:.5}.ss-c-buffs{position:absolute;bottom:100%;width:100%;color:#e7e9ba;text-align:center;white-space:nowrap}@media(pointer:coarse),(max-width:640px){.ss-c-supplies{bottom:176px;gap:2px}.ss-c-supplies button{min-width:52px}}

  .ss-combat{position:relative;width:100%;height:100%;min-height:350px;overflow:hidden;background:#132d2b;color:#f9f5e7;font-family:"PingFang SC","Microsoft YaHei",sans-serif;isolation:isolate;user-select:none;-webkit-user-select:none;touch-action:none;}
  .ss-combat *{box-sizing:border-box}.ss-combat canvas{position:absolute;inset:0;width:100%;height:100%;display:block;outline:none;touch-action:none}
  .ss-c-hud{position:absolute;left:18px;right:18px;top:14px;display:flex;align-items:flex-start;justify-content:space-between;gap:14px;pointer-events:none;z-index:3}
  .ss-c-player{display:flex;align-items:center;gap:11px;min-width:230px;max-width:365px;padding:10px 15px 11px 10px;border:1px solid #c9dfc333;border-radius:16px;background:linear-gradient(120deg,#153531ef,#193b32d9);box-shadow:0 8px 30px #061c2733;backdrop-filter:blur(8px)}
  .ss-c-avatar{width:48px;height:48px;border-radius:50%;background:#344e46;overflow:hidden;flex:none;border:1px solid #dfe4c455}.ss-c-avatar svg{width:100%;height:100%;display:block}
  .ss-c-playerinfo{flex:1;min-width:0}.ss-c-namerow{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:15px;font-weight:700;margin-bottom:6px}.ss-c-sword{font-size:10px;color:#d2d9b9;font-weight:400;letter-spacing:1px}
  .ss-c-bar{height:8px;border-radius:5px;background:#041a19aa;overflow:hidden;border:1px solid #e1e9d614}.ss-c-bar>i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#72aa70,#c4da89);transition:width .13s linear;border-radius:4px}.ss-c-healthtext{font-size:10px;letter-spacing:.7px;color:#c8d8ca;margin-top:5px}.ss-c-energy{height:4px;margin-top:5px}.ss-c-energy>i{background:linear-gradient(90deg,#4ea8bc,#d8e6bf);width:0%}
  .ss-c-location{flex:1;text-align:center;padding-top:6px;text-shadow:0 2px 12px #001c20,0 2px 3px #072a20}.ss-c-location strong{display:block;font-family:Georgia,"Songti SC","STSong",serif;font-size:25px;letter-spacing:4px;font-weight:600}.ss-c-location small{display:block;color:#e3eacb;font-size:11px;letter-spacing:2px;margin-top:7px}
  .ss-c-headbuttons{display:flex;gap:7px;pointer-events:auto}.ss-combat button{font:inherit;cursor:pointer;touch-action:none;-webkit-tap-highlight-color:transparent}.ss-c-mini{border:1px solid #dce4c93d;color:#f0eedc;background:#173c34db;padding:10px 12px;border-radius:10px;font-size:12px;white-space:nowrap;backdrop-filter:blur(7px)}.ss-c-mini:hover{background:#38594c}.ss-c-mini:focus-visible,.ss-c-action:focus-visible{outline:2px solid #efddad;outline-offset:3px}
  .ss-c-boss{position:absolute;top:108px;left:50%;transform:translateX(-50%);width:min(460px,58%);z-index:3;pointer-events:none;text-align:center;text-shadow:0 1px 4px #12241d}.ss-c-bossname{font-size:12px;letter-spacing:3px;margin-bottom:5px;color:#f6d7bd}.ss-c-bossbar{height:8px;border:1px solid #c8a58380;background:#221e1bdd;border-radius:5px;overflow:hidden}.ss-c-bossbar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#9c5150,#e59875);transition:width .15s}.ss-c-phase{font-size:9px;margin-top:3px;color:#e6c6a7;letter-spacing:2px}
  .ss-c-guide{position:absolute;left:18px;bottom:100px;z-index:3;pointer-events:none;font-size:10px;line-height:1.8;color:#eff0d3;letter-spacing:.5px;text-shadow:0 1px 5px #0d302b;background:#153a2b80;border:1px solid #d8dfba20;padding:6px 10px;border-radius:8px;transition:opacity 1s;max-width:330px}.ss-c-guide b{color:#fff;font-weight:500}
  .ss-c-controls{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);display:flex;gap:9px;z-index:5;align-items:flex-end;pointer-events:auto}.ss-c-action{position:relative;min-width:87px;height:68px;border:1px solid #becfaf66;border-radius:12px;color:#f6f0df;background:linear-gradient(150deg,#20483aef,#132f2bf2);box-shadow:0 4px 12px #0c252740;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;overflow:hidden;transition:transform .1s,border-color .2s,background .2s;isolation:isolate}.ss-c-action:hover{border-color:#e6dcad;background:#2f5643}.ss-c-action:active,.ss-c-action.ss-c-pressed{transform:scale(.95)}.ss-c-action kbd{font:700 16px Georgia,serif;position:relative;z-index:2;letter-spacing:1px}.ss-c-action span{font-size:10px;letter-spacing:1px;z-index:2}.ss-c-action em{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:700 21px Georgia,serif;background:#092520cb;z-index:3;pointer-events:none;font-style:normal}.ss-c-action em:empty{display:none}.ss-c-action .ss-c-fill{position:absolute;inset:auto 0 0;height:0;background:#b9d4c133;pointer-events:none;z-index:1}.ss-c-ultimate{border-color:#dfc7948c;min-width:104px}.ss-c-ultimate.ss-c-ready{box-shadow:0 0 25px #e8d69044;border-color:#f2db9b;background:linear-gradient(145deg,#66704a,#2d4d3d);animation:ss-c-breathe 1.6s infinite}.ss-c-attack{min-width:86px;background:linear-gradient(145deg,#8b6750ef,#4b4b36f2);border-color:#efd5a86e}
  .ss-c-joy{display:none;position:absolute;left:24px;bottom:32px;width:132px;height:132px;border:1px solid #e2e8d548;border-radius:50%;background:radial-gradient(circle,#e6ebce12,#10392b50);z-index:5;touch-action:none;box-shadow:inset 0 0 24px #103d3a33}.ss-c-joy:before{content:"";position:absolute;inset:29px;border:1px solid #eff0d328;border-radius:50%}.ss-c-joynub{position:absolute;left:43px;top:43px;width:46px;height:46px;border-radius:50%;background:#e3e8cb6b;border:1px solid #f2f0d782;box-shadow:0 4px 10px #09272233;pointer-events:none}.ss-c-joylabel{position:absolute;bottom:-18px;left:0;right:0;text-align:center;color:#eff3d899;font-size:10px;letter-spacing:3px;pointer-events:none}
  .ss-c-overlay{position:absolute;inset:0;z-index:20;background:#0b2521ba;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(7px)}.ss-c-overlay[hidden]{display:none}.ss-c-panel{width:min(440px,88%);padding:35px 32px;text-align:center;background:linear-gradient(145deg,#223f34f5,#102f2dfc);border:1px solid #d9d9b155;border-radius:20px;box-shadow:0 20px 100px #05171080}.ss-c-panel h2{font:normal 34px Georgia,"Songti SC","STSong",serif;letter-spacing:7px;margin:0 0 13px;color:#f4eac8}.ss-c-panel p{font-size:12px;color:#c6d2be;line-height:1.9;letter-spacing:.6px;margin:0 0 24px}.ss-c-panelbuttons{display:flex;gap:12px;justify-content:center}.ss-c-panelbuttons button{min-width:120px;padding:13px 18px;border-radius:9px;border:1px solid #ddd5ac55;background:#274f42;color:#eee7cf;font-size:13px}.ss-c-panelbuttons button:first-child{background:#d8c997;color:#213c32;border-color:#ebdfa7}.ss-c-toast{position:absolute;top:29%;left:50%;transform:translate(-50%,-10px);z-index:12;pointer-events:none;max-width:85%;white-space:nowrap;background:#12362ced;border:1px solid #dbe0b85c;padding:11px 20px;border-radius:10px;font-size:13px;color:#f0e7c8;letter-spacing:1px;opacity:0;transition:opacity .2s,transform .2s;box-shadow:0 7px 25px #00251f44}.ss-c-toast.ss-c-show{opacity:1;transform:translate(-50%,0)}
  @keyframes ss-c-breathe{50%{box-shadow:0 0 35px #e8d69080}}
  @media(max-width:850px){.ss-c-hud{left:10px;right:10px;top:10px;gap:8px}.ss-c-player{min-width:205px;padding:8px 10px}.ss-c-location strong{font-size:21px;letter-spacing:2px}.ss-c-location small{font-size:10px;letter-spacing:1px}.ss-c-mini{padding:10px 9px}.ss-c-action{min-width:74px;height:64px}.ss-c-controls{gap:7px}.ss-c-boss{top:101px}.ss-c-guide{bottom:93px}}
  @media(pointer:coarse),(max-width:640px){.ss-c-joy{display:block}.ss-c-guide{display:none}.ss-c-controls{left:auto;right:15px;bottom:21px;transform:none;display:grid;grid-template-columns:repeat(3,61px);gap:7px}.ss-c-action{min-width:0;width:61px;height:59px;border-radius:12px;gap:3px}.ss-c-action kbd{font-size:14px}.ss-c-action span{font-size:9px;letter-spacing:0}.ss-c-ultimate{min-width:0}.ss-c-attack{grid-column:3;grid-row:1 / 3;height:125px;width:66px}.ss-c-dodge{grid-column:1;grid-row:2}.ss-c-herb{grid-column:2;grid-row:2}.ss-c-hud{left:9px;right:9px;top:9px}.ss-c-player{min-width:0;width:195px;padding:7px 9px;gap:7px;border-radius:12px}.ss-c-avatar{width:36px;height:36px}.ss-c-namerow{font-size:12px;margin-bottom:4px;gap:4px}.ss-c-sword{font-size:8px;letter-spacing:0}.ss-c-healthtext{font-size:9px;margin-top:4px}.ss-c-bar{height:6px}.ss-c-energy{height:3px;margin-top:3px}.ss-c-location{position:absolute;top:110px;left:0;text-align:left;padding:0;max-width:65%}.ss-c-location strong{font-size:17px;letter-spacing:2px}.ss-c-location small{font-size:9px;letter-spacing:0;margin-top:4px}.ss-c-mini{font-size:10px;padding:9px 8px}.ss-c-headbuttons{gap:5px;flex-wrap:wrap;justify-content:flex-end;max-width:126px}.ss-c-boss{top:156px;width:70%;}.ss-c-with-party .ss-c-boss{top:181px;}.ss-c-bossname{font-size:10px}.ss-c-phase{font-size:8px}.ss-c-toast{top:31%;font-size:11px;padding:9px 13px;white-space:normal;text-align:center}.ss-c-panel{padding:28px 22px}.ss-c-panel h2{font-size:29px}.ss-c-panel p{font-size:11px}}
  @media(pointer:coarse) and (min-width:700px) and (max-height:550px){.ss-c-location{position:static;text-align:center;max-width:none;padding-top:3px}.ss-c-boss{top:85px;width:43%}.ss-c-controls{right:15px;bottom:12px;grid-template-columns:repeat(3,54px)}.ss-c-action{width:54px;height:49px}.ss-c-attack{height:105px;width:58px}.ss-c-joy{width:110px;height:110px;left:20px;bottom:23px}.ss-c-joynub{left:32px;top:32px}.ss-c-joy:before{inset:22px}.ss-c-player{width:205px}}
  @media(prefers-reduced-motion:reduce){.ss-c-ultimate.ss-c-ready{animation:none}.ss-c-action,.ss-c-toast{transition:none}}
  .ss-c-controls{padding:7px 9px;border:1px solid #cfbf916e;border-radius:7px;background:linear-gradient(180deg,#19362de0,#0f2825f5);box-shadow:0 9px 30px #112b2b66,inset 0 0 0 3px #c3b38812;backdrop-filter:blur(12px)}
  .ss-c-action{height:72px;border-radius:5px;border-color:#c7b88970;background:linear-gradient(150deg,#3e5142ef,#172f29f2);box-shadow:inset 0 0 0 2px #cbb48d12,0 3px 7px #142a254a;font-family:"Songti SC","STSong",serif}
  .ss-c-action kbd{position:absolute;top:5px;right:7px;font:11px Georgia,serif;letter-spacing:0;color:#e2d4af}.ss-c-action span{position:absolute;bottom:8px;font-size:11px;letter-spacing:1px}.ss-c-action .ss-c-glyph{position:absolute;top:5px;width:31px;height:31px;color:#e9d4a5}.ss-c-attack .ss-c-glyph{color:#f0d9b1}.ss-c-skill .ss-c-glyph{color:#b5d8be}.ss-c-ultimate .ss-c-glyph{color:#e9d394}.ss-c-dodge .ss-c-glyph{color:#adceca}.ss-c-herb .ss-c-glyph{color:#b7d2a1}
  .ss-c-player{border-radius:8px;border-color:#c6bb8b60;box-shadow:inset 0 0 0 3px #c4b4870c,0 7px 28px #122f2d38}.ss-c-avatar{border-color:#dbcba67a}.ss-c-location strong{letter-spacing:5px}.ss-c-mini{border-radius:5px;border-color:#c7bc8e4d}.ss-c-panel{border-radius:10px;border-color:#dbc9a071;box-shadow:inset 0 0 0 5px #cbbb8f0c,0 20px 100px #05171080}
  @media(pointer:coarse),(max-width:640px){.ss-c-controls{padding:6px;gap:7px}.ss-c-action{width:61px;height:59px;border-radius:5px}.ss-c-action .ss-c-glyph{width:25px;height:25px;top:5px}.ss-c-action kbd{font-size:9px;top:4px;right:5px}.ss-c-action span{font-size:9px;bottom:8px;letter-spacing:0}.ss-c-attack{height:125px;width:66px}.ss-c-attack .ss-c-glyph{width:39px;height:39px;top:30px}.ss-c-attack span{bottom:27px}.ss-c-location strong{letter-spacing:2px}}
  @media(max-width:400px){.ss-c-joy{width:110px;height:110px;left:14px;bottom:34px}.ss-c-joynub{left:32px;top:32px}.ss-c-joy:before{inset:24px}.ss-c-controls{right:10px;bottom:20px}}
  @media(pointer:coarse) and (min-width:700px) and (max-height:550px){.ss-c-action{width:54px;height:49px}.ss-c-action .ss-c-glyph{width:21px;height:21px;top:3px}.ss-c-attack{height:105px;width:58px}.ss-c-attack .ss-c-glyph{width:32px;height:32px;top:23px}.ss-c-attack span{bottom:20px}.ss-c-action span{bottom:6px}}
  .ss-c-player{background:linear-gradient(125deg,#112829f2,#213b36e8);border-color:#cfb57860;box-shadow:inset 0 0 0 3px #cfb5780c,0 8px 26px #06161855}.ss-c-namerow{font-family:"Songti SC",serif;letter-spacing:1px}.ss-c-sword{color:#d4c390}.ss-c-mini{background:#112829e6;border-color:#cfb57860}.ss-c-controls{background:linear-gradient(180deg,#18312ff5,#112829fa);border-color:#cfb5788a;padding:8px 11px;gap:9px}.ss-c-action{background:linear-gradient(145deg,#2c4541,#132c2b);border-color:#94b4a45c}.ss-c-attack{background:linear-gradient(145deg,#796648,#3f4538);border-color:#cfb57899}.ss-c-v4icon{position:absolute;top:4px;left:50%;transform:translateX(-50%);width:37px;height:37px}.ss-c-v4icon svg{display:block;width:100%;height:100%}.ss-c-action span{bottom:7px;letter-spacing:1px}.ss-c-chain{position:absolute;right:26px;top:30%;z-index:4;text-align:right;pointer-events:none;color:#e5c884;font-family:"Songti SC",serif;text-shadow:0 2px 8px #112829;transition:opacity .25s}.ss-c-chain strong{font:italic 48px Georgia,serif;line-height:1}.ss-c-chain small{display:block;font-size:11px;letter-spacing:3px;margin-top:7px}.ss-c-chain[hidden]{display:none}.ss-c-panel p{font-size:13px}.ss-c-ultimate.ss-c-ready{box-shadow:0 0 18px #cfb57844;border-color:#efdb9d;background:linear-gradient(145deg,#56654b,#213e37)}
  @media(max-width:640px){.ss-c-controls{padding:6px;gap:7px}.ss-c-v4icon{width:29px;height:29px;top:3px}.ss-c-attack .ss-c-v4icon{top:29px;width:40px;height:40px}.ss-c-chain{right:15px;top:29%}.ss-c-chain strong{font-size:34px}.ss-c-chain small{font-size:9px}.ss-c-action span{font-size:9px;letter-spacing:0}}
  .ss-c-finisher{min-width:104px;border-color:#de946a99;background:linear-gradient(145deg,#704b36,#322e28)}.ss-c-finisher.ss-c-ready{border-color:#ffd5a0;box-shadow:0 0 24px #f596534d}.ss-c-finisher.ss-c-locked{filter:saturate(.28);opacity:.62}.ss-c-finisher.ss-c-locked em{font:12px "Songti SC",serif;background:#142d29b8;letter-spacing:1px}.ss-c-hongmao .ss-c-ultimate .ss-c-glyph{color:#ffe2aa}
  @media(pointer:coarse),(max-width:640px){.ss-c-hongmao .ss-c-finisher{min-width:0;grid-column:3;grid-row:1}.ss-c-hongmao .ss-c-skill{grid-column:1;grid-row:1}.ss-c-hongmao .ss-c-ultimate{grid-column:2;grid-row:1}.ss-c-hongmao .ss-c-attack{grid-column:3;grid-row:2;width:61px;height:59px}.ss-c-hongmao .ss-c-attack .ss-c-glyph{width:25px;height:25px;top:5px}.ss-c-hongmao .ss-c-attack span{bottom:8px}}
  @media(pointer:coarse) and (min-width:700px) and (max-height:550px){.ss-c-hongmao .ss-c-attack{width:54px;height:49px}.ss-c-hongmao .ss-c-attack .ss-c-glyph{width:21px;height:21px;top:3px}.ss-c-hongmao .ss-c-attack span{bottom:6px}}
  `;

  class Combat {
    constructor(opts) {
      if (!opts || !opts.container) throw new Error('SevenCombat.start requires a container.');
      this.opts = opts;
      this.dojo = opts.dojo ? { targetMode: ['single', 'crowd', 'sparring'].includes(opts.dojo.targetMode) ? opts.dojo.targetMode : 'single', freeSkills: opts.dojo.freeSkills !== false, timeScale: clamp(num(opts.dojo.timeScale, 1), .25, 1) } : null;
      this.dojoCastAt = { q: -100, e: -100, f: -100 }; this.dojoBusyUntil = { q: 0, e: 0, f: 0 }; this.casts = { q: 0, e: 0, f: 0 }; this.dojoHits = 0; this.dojoCombo = 0; this.dojoMaxCombo = 0; this.dojoComboUntil = 0; this.dojoStartedAt = 0; this.dojoFloorNoticeAt = -10; this.dojoRespawns = [];
      this.hero = opts.hero || { id: 'hongmao', name: '虹猫', sword: '长虹剑' };
      if (!SKILLS[this.hero.id]) this.hero = Object.assign({}, this.hero, { id: 'hongmao' });
      this.enc = opts.encounter || { name: '林间遇敌', biome: 'forest', danger: 1 };
      this.arenaWidth = this.enc.tower ? 1600 : WORLD_W; this.arenaHeight = this.enc.tower ? 1100 : WORLD_H;
      // A deliberate roaming/commission encounter owns one finite group.
      // Story encounters without this flag retain their authored reinforcements.
      this.initialOnly = !this.dojo && this.enc.spawnPolicy === 'initial-only';
      // Seven Swords Unity is owned exclusively by the one-shot finale.
      // Legacy encounter.alliance cannot turn an ordinary skill into it.
      this.alliance = false;
      this.storyFinale = !this.dojo && this.hero.id !== 'sali' && this.enc.storyFinale && this.enc.storyFinale.kind === 'seven-swords' ? Object.assign({}, this.enc.storyFinale, { viewpoint: this.hero.id }) : null;
      this.finale = null; this.finaleSettled = false;
      if (this.storyFinale && (!window.SevenFinale || typeof window.SevenFinale.create !== 'function')) throw new Error('SevenFinale must be loaded before a story finale.');
      this.awakening = !this.dojo && this.enc.awakening && typeof this.enc.awakening === 'object' ? Object.assign({}, this.enc.awakening) : null;
      this.awakened = false; this.awakenedAt = null; this.awakeningCount = 0;
      this.level = clamp(num(opts.level, 1), 1, 20);
      this.upg = Object.assign({ attack: 0, vitality: 0, mastery: 0 }, opts.upgrade || {});
      this.postgame = opts.postgame === true;
      this.permanentLimit = this.postgame ? (window.JourneyRules?.growthSafe || Math.floor(Number.MAX_SAFE_INTEGER / 1024)) : 5;
      this.growthStats = opts.stats && typeof opts.stats === 'object' ? { ...opts.stats } : null;
      this.techniqueBonus = this.postgame ? Math.max(0, num(this.growthStats?.technique, 0)) : 0;
      this.danger = clamp(num(this.enc.danger, 1), 1, 8);
      this.diff = opts.difficulty || 'normal';
      this.dm = this.diff === 'story' ? { hp: .83, damage: .7, speed: .94 } : this.diff === 'heroic' ? { hp: 1.15, damage: 1.28, speed: 1.08 } : { hp: 1, damage: 1, speed: 1 };
      this.color = this.hero.color || COLORS[this.hero.id];
      this.skill = Object.assign({}, SKILLS[this.hero.id]);
      if (this.hero.skillName && /剑法|棍法|练剑/.test(this.hero.skillName)) this.skill.name = this.hero.skillName;
      if (this.hero.ultName && /剑法|棍法|练剑|火舞旋风|冰天雪地|紫气东来|奔雷滚滚|琴针飞箭/.test(this.hero.ultName)) this.skill.ult = this.hero.ultName;
      const ss = opts.swordState || this.enc.swordState || this.hero.swordState || {};
      this.swordState = typeof ss === 'string' ? { status: ss } : Object.assign({}, ss);
      this.swordState.status = this.swordState.status || 'bound';
      this.swordState.hand = this.swordState.hand || (this.hero.id === 'sali' ? 'left' : 'right');
      // The original name is 左手剑. Older saves used 剑冢左手剑; accept
      // that alias locally without downgrading the inherited metal weapon.
      if (this.hero.id === 'sali' && this.swordState.weaponName === '剑冢左手剑') this.swordState.weaponName = '左手剑';
      const leftHandSword = this.hero.id === 'sali' && this.swordState.weaponName === '左手剑';
      if (leftHandSword) this.swordState.hand = 'left';
      const leftSwordMastered = leftHandSword && this.swordState.status === 'training' && this.swordState.ultimateUnlocked === true;
      this.techniqueReady = this.swordState.ultimateUnlocked !== false && (!['lost', 'training', 'sealed'].includes(this.swordState.status) || leftSwordMastered);
      this.equipment = { type: this.swordState.status === 'sealed' && this.hero.id === 'daben' ? 'staff' : leftHandSword || this.swordState.status === 'sealed' ? 'plain' : ['lost', 'training'].includes(this.swordState.status) ? 'wood' : 'sword', hand: this.swordState.hand, swordState: this.swordState, name: this.swordState.weaponName || this.hero.sword };
      this.finisherUnlocked = this.hero.id === 'hongmao' && this.techniqueReady && this.equipment.type === 'sword';
      if (this.hero.id === 'hongmao' && this.equipment.type === 'sword') this.techniqueReady = true;
      if (this.equipment.type === 'wood' && !this.swordState.weaponName) this.equipment.name = '木剑';
      if (!this.techniqueReady) this.skill.ult = this.hero.id === 'daben' && this.equipment.type === 'staff' ? '水火棍法' : this.skill.name;
      if (this.equipment.type === 'staff') this.skill.name = '水火棍法';
      if (this.hero.id === 'tiaotiao' && this.swordState.status === 'sealed') this.skill.name = this.skill.ult = this.swordState.technique || '护法剑术';
      if (this.hero.id === 'sali' && !this.techniqueReady && ['lost', 'training'].includes(this.swordState.status)) this.skill.name = this.skill.ult = '左手练剑';
      if (this.hero.id === 'hongmao') this.skill.ult = '长虹贯日';
      const tr = !this.dojo && (opts.training || this.enc.training);
      this.training = tr ? Object.assign({ kind: 'left-hand', goalHits: 12 }, typeof tr === 'object' ? tr : {}) : null;
      this.trainingHits = 0;
      this.profileName = this.dojo ? 'crowd' : this.training ? 'training' : typeof this.enc.profile === 'string' && PROFILES[this.enc.profile] ? this.enc.profile : this.enc.boss ? 'duel' : this.enc.modifier === 'ambush' ? 'ambush' : 'crowd';
      this.profile = PROFILES[this.profileName];
      this.density = clamp(num(this.enc.density, 1), .6, 1.6);
      let seed = Math.floor(num(this.enc.seed, 19139 + this.danger * 937));
      this.random = () => { seed = Math.imul(seed, 1664525) + 1013904223 | 0; return (seed >>> 0) / 4294967296; };
      let speed = num(this.hero.speed, 230); if (speed < 20) speed = 180 + speed * 10;
      const maxHp = Math.max(1, num(this.growthStats?.hp, num(this.hero.hp, 132) + (this.level - 1) * 9 + Math.max(0, num(this.upg.vitality, 0)) * 20 + clamp(num(opts.permanent?.vitality,0),0,this.permanentLimit)*12));
      this.p = {
        x: this.enc.tower ? 800 : 480, y: this.enc.tower ? 650 : 400, r: 15, dir: Math.PI / 4, maxHp, hp: maxHp,
        attack: Math.max(0, num(this.growthStats?.attack, num(this.hero.attack, 23) + (this.level - 1) * 2.3 + Math.max(0, num(this.upg.attack, 0)) * 4.5 + clamp(num(opts.permanent?.attack,0),0,this.permanentLimit)*3)),
        speed, invuln: 1.1, hit: 0, attackCd: 0, skillCd: 0, dodgeCd: 0, herbCd: 0, breatheCd: 0,
        energy: this.dojo ? 100 : clamp(num(opts.entryEnergy, num(this.enc.entryEnergy, 0)), 0, 100), ultCd: 0, fireCd: 0, combo: 0, armor: 0, swing: 0, dash: null, healCd: 0, walking: false,
        air: 0, cast: 0, walkPhase: 0
      };
      this.mastery = Math.max(0, num(this.upg.mastery, 0));
      this.skillPower = Math.max(1, num(this.growthStats?.power, 1 + this.mastery * .12));
      this.skillMaxCd = this.skill.cd * clamp(num(this.growthStats?.cooldown, 1 - this.mastery * .075), .55, 1);
      this.ultEnergyCost = this.hero.id === 'hongmao' ? CHANGHONG.cost : 100;
      this.fireEnergyCost = FIREWHIRL.cost;
      this.ultMaxCd = ({ hongmao: CHANGHONG.cd, lantu: 4.2, sali: 3.35, doudou: 5.3, daben: 3.35, tiaotiao: 3.2, dada: 5.3 }[this.hero.id]) * Math.max(.8, 1 - this.mastery * .035);
      this.fireMaxCd = FIREWHIRL.cd;
      this.herbs = Math.max(0, Math.floor(num(opts.herbs, 0))); this.usedHerbs = 0;
      this.supplyCatalog = window.JourneyRules?.supplies || [{id:'herb',name:'回春散',heal:.42}];
      this.supplyStock = {...opts.supplies,herb:this.herbs}; this.usedSupplies={};this.loot={};
      this.loadout=Array.from({length:5},(_,i)=>(opts.loadout||['herb'])[i]||null);
      this.permanent={attack:clamp(num(opts.permanent?.attack,0),0,this.permanentLimit),vitality:clamp(num(opts.permanent?.vitality,0),0,this.permanentLimit)};this.buffAttackRate=.25;this.baseAttack=this.p.attack; this.supplyBuffs={attack:0,guard:0};
      this.enemies = []; this.bolts = []; this.hazards = []; this.fields = []; this.fx = []; this.particles = []; this.floats = []; this.tasks = []; this.ghosts = [];
      // The caller supplies battle-local actors. Only ai:'companion' opts into
      // follow/attack/damage; other allied recipients keep external ownership.
      this.allies = Array.isArray(opts.allies) ? opts.allies : []; this.healingDone = 0;
      this.companions = []; this.companionInit = new WeakSet(); this.companionDamage = 0; this.companionDamageTaken = 0;
      this.camera = { x: 480, y: 320, zoom: 1, width: 960, height: 600 }; this.lastGhost = 0;
      this.keys = new Set(); this.physicalKeys = new Set(); this.physicalPointers = new Set(); this.pointer = { x: 480, y: 280, active: false, last: -100 }; this.joy = { x: 0, y: 0, id: null }; this.heldAttack = false; this.attackPointer = null;
      this.time = 0; this.kills = 0; this.spawned = 0; this.uid = 0; this.wave = 0; this.nextSpawn = 6.8;
      this.total = this.dojo ? Infinity : this.training ? 1 : Math.round(clamp(num(this.enc.total, this.profile.total + (this.danger - 1) * this.profile.perDanger), this.enc.boss ? 2 : 1, this.enc.tower ? 10000 : 220));
      this.tower = this.enc.tower || null;
      this.storyWaves = this.makeStoryWaves();
      this.maxLiving = Math.round(clamp(num(this.enc.maxLiving, (this.profile.living + (this.danger - 1) * this.profile.perLiving) * this.density), 1, 54));
      this.maxLiving = Math.min(this.maxLiving, this.total);
      if (this.dojo) this.maxLiving = this.dojo.targetMode === 'single' ? 1 : this.dojo.targetMode === 'crowd' ? 18 : 20;
      this.spatial = new Map(); this.streak = 0; this.streakMax = 0; this.streakUntil = 0; this.damageDealt = 0; this.damageTaken = 0;
      this.shake = 0; this.flash = 0; this.hitStop = 0; this.toastUntil = 0;
      this.paused = false; this.ended = false; this.destroyed = false; this.listeners = []; this.timers = [];
      this.soundOn = true; this.audio = null; this.lastTone = 0; this.lastHud = -1; this.reducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      this.swordFx = window.SwordFX && window.SwordFX.create ? window.SwordFX.create(this) : null;
      this.syncCompanions();
      // Freeze the opening roster, not the living count on later frames. Only
      // validated combat companions count; finale actors/healing recipients do not.
      this.battleAllyCount = this.dojo || this.training || (this.enc.readOnlyReplay && !this.enc.storyCompanions) ? 0 : this.livingCompanions().length;
      this.enemyHpMultiplier = 1 + .5 * this.battleAllyCount;
      this.enemyDamageMultiplier = 1 + .2 * this.battleAllyCount;
      this.buildDOM(); this.bind(); this.makeGround(); this.resize();
      if (this.storyFinale) this.finale = window.SevenFinale.create(this, this.storyFinale);
      if (this.dojo) this.resetDojo({ heal: true });
      else this.schedule(.4, () => { if (this.training) this.spawnTrainingTarget(); else { if (this.enc.boss && !this.tower) this.spawnBoss(); this.spawnGroup(this.initialOnly ? this.total - this.spawned : Math.min(this.maxLiving - (this.enc.boss && !this.boss?.waiting ? 1 : 0), Math.round(this.profile.opening * this.density))); } this.nextSpawn = this.initialOnly ? Infinity : this.time + this.profile.refill; });
      this.toast(this.tower ? `无尽塔第 ${this.tower.floor} 层 · ${this.tower.label} · 第 1 / ${this.tower.waves||1} 波` : this.storyWaves ? `第 1 / ${this.storyWaves.count} 波 · ${this.storyWaves.names[0]}${this.enc.boss&&this.storyWaves.count>1?' · 首领在场边观战':''}` : this.dojo ? '自由演武 · 受伤与恢复照常，气血最低保留 1 点' : this.training ? `左手持剑 · 击中木桩 ${this.training.goalHits} 次，体会剑势` : this.enc.boss ? `迎战 ${this.enc.boss.name} · 留意红色蓄力范围` : '按住 J 连斩 · Q 扫敌 · 剑意蓄满即放 E', 4.2);
      this.updateHud(true);
    }

    buildDOM() {
      this.root = document.createElement('div'); this.root.className = 'ss-combat' + (this.battleAllyCount ? ' ss-c-with-party' : '') + (this.dojo ? ' ss-c-dojo' : '') + (this.hero.id === 'hongmao' ? ' ss-c-hongmao' : '');
      this.root.innerHTML = `<style>${CSS}</style><canvas tabindex="0" aria-label="七侠实时战斗。WASD移动，J挥剑，Q剑招，E绝技，虹猫F火舞旋风（领悟后），空格闪避，R调息，1至5使用已装配消耗品，Esc暂停。"></canvas>
        <div class="ss-c-hud"><div class="ss-c-player"><div class="ss-c-avatar"></div><div class="ss-c-playerinfo"><div class="ss-c-namerow"><span>${safe(this.hero.name)}</span><small class="ss-c-sword">${safe(this.equipment.name || this.hero.sword || '')} · ${this.level} 级</small></div><div class="ss-c-bar ss-c-upper-health" aria-hidden="true"><i class="ss-c-upper-hpfill"></i></div><div class="ss-c-bar ss-c-energy"><i class="ss-c-energyfill"></i></div><div class="ss-c-healthtext ss-c-energytext ss-c-upper-healthtext"></div><div class="ss-c-healthtext ss-c-party-status"></div></div></div><div class="ss-c-location"><strong>${safe(this.enc.name || '林间对决')}</strong><small class="ss-c-progress"></small>${this.tower?'<progress class="tower-pressure" max="100" value="0" aria-label="本层肃清进度"></progress>':''}${this.battleAllyCount?`<small class="ss-c-party-strength">同行 ${this.battleAllyCount} 人 · 敌方气血 +${this.battleAllyCount*50}% · 攻击 +${this.battleAllyCount*20}%</small>`:''}</div><div class="ss-c-headbuttons"><button class="ss-c-mini" data-bgm-toggle>音乐：${window.SevenBGM?.enabled ? '开' : '关'}</button><button class="ss-c-mini ss-c-sound" aria-label="切换音效">音效：开</button><button class="ss-c-mini ss-c-pause" aria-label="暂停战斗">暂停 Ⅱ</button></div></div>
        <div class="ss-c-boss" ${this.enc.boss ? '' : 'hidden'}><div class="ss-c-bossname">${safe(this.enc.boss && this.enc.boss.name)}</div><div class="ss-c-bossbar"><i></i></div><div class="ss-c-phase">第一式 · 见招拆招</div></div>
        <div class="ss-c-guide"><b>WASD / 方向键</b> 移动　<b>J / 左键</b> 连续挥剑<br><b>Q</b> 剑招　<b>E</b> 绝技${this.hero.id === 'hongmao' ? '　<b>F</b> 火舞旋风（领悟后）' : ''}　<b>空格</b> 闪避　<b>R</b> 调息　<b>1–5</b> 消耗品</div>
        <div class="ss-c-chain" hidden><strong>0</strong><small>连破敌阵</small></div><div class="ss-c-joy" aria-label="移动摇杆"><div class="ss-c-joynub"></div><div class="ss-c-joylabel">移动</div></div>
        <div class="ss-c-bottom-hud"><div class="ss-c-life" role="meter" aria-label="主控气血" aria-valuemin="0">${window.HealthOrb.markup()}</div><div class="ss-c-controls"><button class="ss-c-action ss-c-attack" data-action="attack">${glyph('attack')}<kbd>J</kbd><span>挥剑 · 按住</span></button><button class="ss-c-action ss-c-skill" data-action="skill">${skillGlyph(this.hero.id, 'q')}<kbd>Q</kbd><span>${safe(this.skill.name)}</span><em></em></button><button class="ss-c-action ss-c-ultimate" data-action="ult"><i class="ss-c-fill"></i>${skillGlyph(this.hero.id, 'e')}<kbd>E</kbd><span>${safe(this.skill.ult)}</span><em></em></button>${this.hero.id === 'hongmao' ? `<button class="ss-c-action ss-c-finisher${this.finisherUnlocked ? '' : ' ss-c-locked'}" data-action="finisher" aria-label="F 火舞旋风，后期领悟后解锁，消耗100剑意"><i class="ss-c-fill"></i>${skillGlyph('hongmao', 'f')}<kbd>F</kbd><span>火舞旋风</span><em></em></button>` : ''}<button class="ss-c-action ss-c-dodge" data-action="dodge">${glyph('dodge')}<kbd>空格</kbd><span>闪避</span><em></em></button><button class="ss-c-action ss-c-herb" data-action="herb" title="R 调息：免费回复 20% 气血，独立冷却 18 秒">${glyph('meditate')}<kbd>R</kbd><span>调息 · 20%</span><em></em></button></div><div class="ss-c-supplies" role="group" aria-label="战斗补给，1 至 5，共享 4 秒冷却">${this.loadout.map((id,i)=>`<button class="ss-c-supply${id?'':' ss-c-supply-empty'}" data-action="supply-${i}" title="${safe(this.supplyCatalog.find(v=>v.id===id)?.description||'未装配，战斗外在行囊中装配')}"><kbd>${i+1}</kbd><span class="ss-c-supply-art">${id?window.ConsumableArt?.icon(id,{size:48})||'':'＋'}</span><span class="ss-c-supply-name">${safe(this.supplyCatalog.find(v=>v.id===id)?.name||'未装配')}</span><b class="ss-c-supply-qty"></b><em class="ss-c-supply-cd"></em></button>`).join('')}<small class="ss-c-buffs"></small></div></div>
        <div class="ss-c-toast" role="status"></div><div class="ss-c-overlay" hidden><div class="ss-c-panel"><h2>剑心暂歇</h2><p>气息调匀，再赴江湖。<br>${this.enc.readOnlyReplay?'重温与试演不消耗传记药草，也不发奖励；撤退即结束本场。':'撤退即结束本场战斗；已用去的药草，照旧消耗。'}</p><div class="ss-c-panelbuttons"><button data-pause-action="resume">继续战斗</button><button data-pause-action="retreat">撤回大地图</button></div></div></div>`;
      this.opts.container.appendChild(this.root);
      this.canvas = this.root.querySelector('canvas'); this.ctx = this.canvas.getContext('2d', { alpha: false });
      this.ui = {};
      for (const [key, selector] of Object.entries({ life: '.ss-c-life', upperHp: '.ss-c-player .ss-c-upper-hpfill', energytext: '.ss-c-energytext', hp: '.ss-c-hpfill', hptext: '.ss-c-life .ss-c-hpnum', partyStatus: '.ss-c-party-status', energy: '.ss-c-energyfill', progress: '.ss-c-progress', boss: '.ss-c-boss', bossHp: '.ss-c-bossbar i', phase: '.ss-c-phase', skill: '.ss-c-skill em', ult: '.ss-c-ultimate', ultCd: '.ss-c-ultimate em', ultFill: '.ss-c-ultimate .ss-c-fill', finisher: '.ss-c-finisher', finisherCd: '.ss-c-finisher em', finisherFill: '.ss-c-finisher .ss-c-fill', dodge: '.ss-c-dodge em', herb: '.ss-c-herb span', herbCd: '.ss-c-herb em', overlay: '.ss-c-overlay', toast: '.ss-c-toast', guide: '.ss-c-guide', chain: '.ss-c-chain', chainCount: '.ss-c-chain strong', joy: '.ss-c-joy', nub: '.ss-c-joynub' })) this.ui[key] = this.root.querySelector(selector);
      if (this.dojo) {
        this.ui.boss.hidden = true;
        this.ui.guide.innerHTML = `<b>WASD / 方向键</b> 移动　<b>J / 左键</b> 连续挥剑<br><b>Q</b> 剑招　<b>E</b> ${this.skill.ult}${this.hero.id === 'hongmao' ? '　<b>F</b> 火舞旋风（领悟后）' : ''}　<b>空格</b> 闪避　<b>R</b> 调息　<b>1–5</b> 试用补给`;
        this.ui.overlay.querySelector('p').innerHTML = '气息调匀，再试下一招。<br>演武场内气血最低只降到 1 点；调息不消耗药品；补给仅本场试用，不写入存档。';
        this.ui.overlay.querySelector('[data-pause-action="resume"]').textContent = '继续练习';
        this.ui.overlay.querySelector('[data-pause-action="retreat"]').textContent = '离开演武场';
        this.canvas.setAttribute('aria-label', '七侠演武场。WASD移动，J挥剑，Q剑招，E绝技，虹猫F火舞旋风（领悟后），空格闪避，R恢复气血，Esc暂停。气血最低保留1点。');
      }
      const avatar = this.root.querySelector('.ss-c-avatar');
      try { if (window.GameArt && window.GameArt.heroSVG) avatar.innerHTML = window.GameArt.heroSVG(this.hero.id, { size: 80, portrait: true, equipment: this.equipment, swordState: this.swordState }); } catch (_) { /* Canvas fallback below. */ }
      if (!avatar.firstElementChild) avatar.innerHTML = `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="30" fill="#36564b"/><path d="M10 54Q13 33 30 32Q47 33 50 54" fill="${safe(this.color)}"/><path d="M15 23L12 6L27 17M34 16L48 6L45 25" fill="${safe(this.color)}"/><ellipse cx="30" cy="27" rx="18" ry="17" fill="#f5e5c3"/><path d="M19 25L25 26M35 26L42 25" stroke="#2c4540" stroke-width="3" stroke-linecap="round"/><path d="M26 34Q30 38 34 34" fill="none" stroke="#684a42" stroke-width="2"/></svg>`;
    }

    listen(target, event, fn, options) { target.addEventListener(event, fn, options); this.listeners.push([target, event, fn, options]); }
    bind() {
      const inputKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyJ', 'KeyQ', 'KeyE', 'KeyF', 'KeyR', 'Digit1','Digit2','Digit3','Digit4','Digit5', 'Space', 'Escape']);
      this.listen(window, 'keydown', e => {
        if (!inputKeys.has(e.code) || this.destroyed) return;
        this.physicalKeys.add(e.code);
        if (this.ended) return;
        if (/INPUT|TEXTAREA|SELECT/.test(e.target && e.target.tagName || '') || this.dojo && (e.target && e.target.tagName) === 'BUTTON' && e.code !== 'Escape') return;
        e.preventDefault(); this.unlockSound();
        if (e.code === 'Escape') { if (!e.repeat) this.pause(!this.paused); return; }
        if (this.paused) return;
        this.keys.add(e.code);
        if (e.code === 'KeyJ') this.pointer.active = false;
        if (!e.repeat) {
          if (e.code === 'KeyQ') this.useSkill();
          if (e.code === 'KeyE') this.useUlt();
          if (e.code === 'KeyF') this.useFinisher();
          if (e.code === 'Space') this.dodge();
          if (e.code === 'KeyR') this.breathe();
          if (/^Digit[1-5]$/.test(e.code)) this.useSupply(Number(e.code.slice(-1))-1);
        }
      });
      this.listen(window, 'keyup', e => { this.keys.delete(e.code); this.physicalKeys.delete(e.code); });
      this.listen(window, 'blur', () => { this.clearInput(); this.physicalKeys.clear(); this.physicalPointers.clear(); if (!this.ended) this.pause(true); });
      this.listen(document, 'visibilitychange', () => { if (document.hidden) { this.clearInput(); if (!this.ended) this.pause(true); } });
      this.listen(this.canvas, 'contextmenu', e => e.preventDefault());
      this.listen(this.canvas, 'pointermove', e => { if (this.finale && (this.finale.active || this.finale.complete)) return; if (e.pointerType === 'mouse') this.setMouseAim(e.clientX, e.clientY); });
      this.listen(this.canvas, 'pointerdown', e => { if (e.button !== 0 || this.actionsLocked()) return; e.preventDefault(); this.unlockSound(); this.canvas.focus({ preventScroll: true }); if (e.pointerType === 'mouse') { this.setMouseAim(e.clientX, e.clientY); this.heldAttack = true; this.attackPointer = e.pointerId; this.attack(); } });
      this.listen(this.root, 'pointerdown', e => this.physicalPointers.add(e.pointerId), true);
      this.listen(window, 'pointerup', e => { this.physicalPointers.delete(e.pointerId); if (this.attackPointer === e.pointerId) { this.heldAttack = false; this.attackPointer = null; this.root.querySelector('.ss-c-attack').classList.remove('ss-c-pressed'); } });
      this.listen(window, 'pointercancel', e => { this.physicalPointers.delete(e.pointerId); if (this.attackPointer === e.pointerId) { this.heldAttack = false; this.attackPointer = null; } if (this.joy.id === e.pointerId) this.releaseJoy(); });
      this.listen(this.root.querySelector('.ss-c-pause'), 'click', () => this.pause(!this.paused));
      this.listen(this.root.querySelector('.ss-c-sound'), 'click', e => { this.soundOn = !this.soundOn; e.currentTarget.textContent = `音效：${this.soundOn ? '开' : '关'}`; if (this.soundOn) this.unlockSound(); if (this.dojo && !this.paused) this.canvas.focus({ preventScroll: true }); });
      this.listen(this.root.querySelector('[data-pause-action="resume"]'), 'click', () => this.pause(false));
      this.listen(this.root.querySelector('[data-pause-action="retreat"]'), 'click', () => this.finish(false, true));
      this.root.querySelectorAll('[data-action]').forEach(button => {
        this.listen(button, 'pointerdown', e => {
          e.preventDefault(); if (this.paused || this.ended) return; this.unlockSound(); this.pointer.active = false;
          const action = button.dataset.action;
          if (action === 'attack') { this.heldAttack = true; this.attackPointer = e.pointerId; button.classList.add('ss-c-pressed'); this.attack(); }
          if (action === 'skill') this.useSkill(); if (action === 'ult') this.useUlt(); if (action === 'finisher') this.useFinisher(); if (action === 'dodge') this.dodge(); if (action === 'herb') this.breathe(); if (action.startsWith('supply-')) this.useSupply(Number(action.slice(7)));
        });
        this.listen(button, 'click', e => {
          if ((e.detail || 0) !== 0 || this.paused || this.ended) return;
          this.unlockSound(); this.pointer.active = false;
          const action = button.dataset.action;
          if (action === 'attack') this.attack(); if (action === 'skill') this.useSkill(); if (action === 'ult') this.useUlt(); if (action === 'finisher') this.useFinisher(); if (action === 'dodge') this.dodge(); if (action === 'herb') this.breathe(); if (action.startsWith('supply-')) this.useSupply(Number(action.slice(7)));
          this.canvas.focus({ preventScroll: true });
        });
      });
      this.listen(this.ui.joy, 'pointerdown', e => { e.preventDefault(); if (this.paused || this.ended || this.joy.id !== null) return; this.unlockSound(); this.pointer.active = false; this.joy.id = e.pointerId; this.ui.joy.setPointerCapture(e.pointerId); this.moveJoy(e); });
      this.listen(this.ui.joy, 'pointermove', e => { if (this.joy.id === e.pointerId) { e.preventDefault(); this.moveJoy(e); } });
      this.listen(this.ui.joy, 'pointerup', e => { if (this.joy.id === e.pointerId) this.releaseJoy(); });
      this.listen(this.ui.joy, 'lostpointercapture', () => this.releaseJoy());
      if (window.ResizeObserver) { this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(this.root); } else this.listen(window, 'resize', () => this.resize());
    }

    moveJoy(e) {
      const r = this.ui.joy.getBoundingClientRect(), max = r.width * .29;
      let x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      const d = hypot(x, y); if (d > max) { x *= max / d; y *= max / d; }
      this.joy.x = x / max; this.joy.y = y / max;
      this.ui.nub.style.transform = `translate(${x}px,${y}px)`;
    }
    releaseJoy() { this.joy.id = null; this.joy.x = 0; this.joy.y = 0; if (this.ui) this.ui.nub.style.transform = ''; }
    clearInput() { this.keys.clear(); this.heldAttack = false; this.attackPointer = null; this.releaseJoy(); }
    resize() {
      if (this.destroyed) return;
      this.paintDirty = true;
      const r = this.root.getBoundingClientRect(); this.cw = Math.max(1, r.width); this.ch = Math.max(1, r.height);
      this.dpr = Math.min(2, window.devicePixelRatio || 1); this.canvas.width = Math.round(this.cw * this.dpr); this.canvas.height = Math.round(this.ch * this.dpr);
      this.camera.width = this.cw; this.camera.height = this.ch;
      this.camera.zoom = this.cw < 650 ? clamp(this.cw / 700, .55, .8) : clamp(Math.min(this.cw / 1250, this.ch / 800), .65, 1.25);
      this.scale = this.camera.zoom; this.updateCamera(0, true);
    }
    project(x, y, z = 0) { return { x: (x - y) * ISO_X, y: (x + y) * ISO_Y - z }; }
    unproject(x, y, z = 0) { return { x: x / (2 * ISO_X) + (y + z) / (2 * ISO_Y), y: (y + z) / (2 * ISO_Y) - x / (2 * ISO_X) }; }
    screen(x, y, z = 0) { const p = this.project(x, y, z), center = this.project(this.camera.x, this.camera.y); return { x: this.cw / 2 + (p.x - center.x) * this.camera.zoom, y: this.ch / 2 + (p.y - center.y) * this.camera.zoom }; }
    toWorld(x, y) { const r = this.canvas.getBoundingClientRect(), center = this.project(this.camera.x, this.camera.y); return this.unproject((x - r.left - this.cw / 2) / this.camera.zoom + center.x, (y - r.top - this.ch / 2) / this.camera.zoom + center.y); }
    screenDirection(angle) { const x = Math.cos(angle), y = Math.sin(angle); return Math.atan2((x + y) * ISO_Y, (x - y) * ISO_X); }
    screenVectorToWorld(x, y) { const strength = Math.min(1, hypot(x, y)); if (!strength) return { x: 0, y: 0 }; const v = this.unproject(x, y), d = hypot(v.x, v.y); return { x: v.x / d * strength, y: v.y / d * strength }; }
    mouseAimPoint(clientX, clientY) {
      const bounds = this.canvas.getBoundingClientRect(), x = clientX - bounds.left, y = clientY - bounds.top;
      let target = null;
      for (const e of this.enemies) {
        if (e.dead || e.spawn > 0) continue;
        const q = this.screen(e.x, e.y), scale = this.camera.zoom * (e.boss ? 1.39 : e.kind === 'heavy' ? 1.13 : .94);
        if (Math.abs(x - q.x) <= 24 * scale && y >= q.y - 81 * scale && y <= q.y + 7 * scale && (!target || e.x + e.y > target.x + target.y)) target = e;
      }
      return target ? { x: target.x, y: target.y } : this.toWorld(clientX, clientY);
    }
    setMouseAim(clientX, clientY) { if (this.finale && (this.finale.active || this.finale.complete)) return; const p = this.mouseAimPoint(clientX, clientY); this.pointer.x = p.x; this.pointer.y = p.y; this.pointer.clientX = clientX; this.pointer.clientY = clientY; this.pointer.last = this.time; this.pointer.active = true; this.p.dir = Math.atan2(p.y - this.p.y, p.x - this.p.x); }
    updateCamera(dt, snap = false) {
      const follow = this.tower ? 1 : this.cw < 650 ? .98 : .58, bias = (this.cw < 650 ? 14 : this.ch * .11) / this.camera.zoom;
      const x = mix(this.arenaWidth / 2, this.p.x, follow) - bias, y = mix(this.tower ? this.arenaHeight / 2 : 320, this.p.y, follow) - bias;
      const amount = snap ? 1 : 1 - Math.exp(-Math.max(0, dt) * 7);
      this.camera.x = mix(this.camera.x, x, amount); this.camera.y = mix(this.camera.y, y, amount);
      if (this.pointer.active && this.pointer.clientX != null) { const p = this.mouseAimPoint(this.pointer.clientX, this.pointer.clientY); this.pointer.x = p.x; this.pointer.y = p.y; }
    }
    withView(c, fn) { const center = this.project(this.camera.x, this.camera.y); c.save(); c.translate(this.cw / 2 - center.x * this.camera.zoom, this.ch / 2 - center.y * this.camera.zoom); c.scale(this.camera.zoom, this.camera.zoom); fn(c); c.restore(); }
    withGround(c, fn, z = 0) { this.withView(c, () => { c.save(); c.translate(0, -z); c.transform(ISO_X, ISO_Y, -ISO_X, ISO_Y, 0, 0); fn(c); c.restore(); }); }
    run() { this.lastFrame = performance.now(); this.raf = requestAnimationFrame(t => this.frame(t)); }
    frame(t) {
      if (this.destroyed) return;
      let dt = Math.min(.034, Math.max(.001, (t - this.lastFrame) / 1000)); this.lastFrame = t;
      if(document.hidden){this.raf=requestAnimationFrame(n=>this.frame(n));return;}
      if (!this.paused && !this.ended) {
        if (this.hitStop > 0) { this.hitStop -= dt; dt *= .3; }
        this.update(dt);
      }
      // A paused/finished scene is static; repaint only after a state or size change.
      if ((!this.paused && !this.ended) || this.paintDirty) { this.draw(); this.paintDirty = false; }
      this.raf = requestAnimationFrame(n => this.frame(n));
    }
    schedule(delay, fn) { this.tasks.push({ at: this.time + delay, fn }); }

    dojoMoveDuration(tier) {
      if (tier === 'f') return FIREWHIRL.duration;
      if (tier === 'e' && this.hero.id === 'hongmao') return CHANGHONG.duration;
      if (tier === 'q') return this.equipment.type !== 'sword' && !this.techniqueReady ? 1 : this.hero.id === 'dada' ? 4.7 : this.hero.id === 'doudou' ? 2.8 : 1;
      if (!this.techniqueReady) return 1.8;
      return { hongmao: 3.05, lantu: 5.5, sali: 2.65, doudou: 5.8, daben: 2.65, tiaotiao: 2.65, dada: 6.2 }[this.hero.id];
    }
    refreshDojoSkills() {
      if (!this.dojo || !this.dojo.freeSkills) return;
      this.p.energy = 100;
      // Preserve the complete move and field lifetime before another cast of
      // that move. Q and E can still combine, as they do in regular combat.
      this.p.skillCd = Math.max(0, this.dojoBusyUntil.q - this.time);
      this.p.ultCd = Math.max(0, this.dojoBusyUntil.e - this.time);
      this.p.fireCd = Math.max(0, this.dojoBusyUntil.f - this.time);
    }
    setDojoSettings(patch = {}) {
      if (!this.dojo || this.destroyed || this.ended) return null;
      const previousMode = this.dojo.targetMode, previousFree = this.dojo.freeSkills;
      if (['single', 'crowd', 'sparring'].includes(patch.targetMode)) this.dojo.targetMode = patch.targetMode;
      if (typeof patch.freeSkills === 'boolean') this.dojo.freeSkills = patch.freeSkills;
      if (Number.isFinite(Number(patch.timeScale))) this.dojo.timeScale = clamp(Number(patch.timeScale), .25, 1);
      if (previousMode !== this.dojo.targetMode) this.resetDojo({ heal: false });
      else if (previousFree && !this.dojo.freeSkills) {
        this.p.skillCd = Math.max(this.p.skillCd, this.skillMaxCd - (this.time - this.dojoCastAt.q));
        this.p.ultCd = Math.max(this.p.ultCd, this.ultMaxCd - (this.time - this.dojoCastAt.e));
        this.p.fireCd = Math.max(this.p.fireCd, this.fireMaxCd - (this.time - this.dojoCastAt.f));
      }
      this.refreshDojoSkills(); this.updateHud(true);
      return this.getDojoState();
    }
    resetDojo({ heal = true } = {}) {
      if (!this.dojo || this.destroyed || this.ended) return null;
      const p = this.p, hp = p.hp;
      this.clearInput(); this.physicalKeys.clear(); this.physicalPointers.clear(); this.pointer.active = false;
      this.tasks = []; this.enemies = []; this.bolts = []; this.hazards = []; this.fields = []; this.fx = []; this.particles = []; this.floats = []; this.ghosts = [];
      this.dojoRespawns = []; this.spatial.clear(); if (this.swordFx) this.swordFx.clear();
      this.kills = 0; this.spawned = 0; this.wave = 0; this.nextSpawn = this.time + .85; this.boss = null;
      this.damageDealt = 0; this.damageTaken = 0; this.healingDone = 0; this.streak = 0; this.streakMax = 0; this.streakUntil = 0;
      this.dojoHits = 0; this.dojoCombo = 0; this.dojoMaxCombo = 0; this.dojoComboUntil = 0; this.dojoStartedAt = this.time; this.dojoFloorNoticeAt = this.time - 10;
      this.dojoCastAt = { q: this.time - 100, e: this.time - 100, f: this.time - 100 }; this.dojoBusyUntil = { q: 0, e: 0, f: 0 }; this.casts = { q: 0, e: 0, f: 0 };
      this.shake = 0; this.flash = 0; this.hitStop = 0; this.lastImpact = 0; this.lastGhost = this.time; this.usedHerbs = 0;
      Object.assign(p, { x: 480, y: 400, dir: Math.PI / 4, hp: heal ? p.maxHp : clamp(hp, 1, p.maxHp), energy: 100, invuln: 1.1, hit: 0, attackCd: 0, skillCd: 0, ultCd: 0, fireCd: 0, dodgeCd: 0, herbCd: 0, combo: 0, armor: 0, swing: 0, dash: null, healCd: 0, walking: false, air: 0, cast: 0, castMax: 0, walkPhase: 0 });
      this.maxLiving = this.dojo.targetMode === 'single' ? 1 : this.dojo.targetMode === 'crowd' ? 18 : 20;
      if (this.dojo.targetMode === 'sparring') this.spawnGroup(this.maxLiving);
      else for (let i = 0; i < this.maxLiving; i++) this.spawnDojoTarget(i);
      this.updateCamera(0, true); this.refreshDojoSkills(); this.updateHud(true);
      return this.getDojoState();
    }
    getDojoState() {
      if (!this.dojo) return null;
      const p = this.p, skillBusy = Math.max(0, this.dojoBusyUntil.q - this.time), ultBusy = Math.max(0, this.dojoBusyUntil.e - this.time), finisherBusy = Math.max(0, this.dojoBusyUntil.f - this.time);
      return { settings: Object.assign({}, this.dojo), targetMode: this.dojo.targetMode, freeSkills: this.dojo.freeSkills, timeScale: this.dojo.timeScale, hp: p.hp, maxHp: p.maxHp, energy: p.energy, damage: this.damageDealt, damageDealt: this.damageDealt, damageTaken: this.damageTaken, hits: this.dojoHits, combo: this.time <= this.dojoComboUntil ? this.dojoCombo : 0, maxCombo: this.dojoMaxCombo, kills: this.kills, elapsed: this.time - this.dojoStartedAt, activeTargets: this.enemies.filter(e => !e.dead).length, skillReady: !this.paused && p.skillCd <= .01, ultReady: !this.paused && p.ultCd <= .01 && p.energy >= this.ultEnergyCost - .1, finisherReady: !this.paused && this.finisherUnlocked && p.fireCd <= .01 && p.energy >= this.fireEnergyCost - .1, skillBusy, ultBusy, finisherBusy, busy: Math.max(skillBusy, ultBusy, finisherBusy), skillCd: p.skillCd, ultCd: p.ultCd, finisherCd: p.fireCd, finisherUnlocked: this.finisherUnlocked, fireEnergy: this.fireEnergyCost, ultEnergy: this.ultEnergyCost, fireEnergyCost: this.fireEnergyCost, ultEnergyCost: this.ultEnergyCost, casts: Object.assign({}, this.casts), paused: this.paused, techniqueReady: this.techniqueReady, equipment: Object.assign({}, this.equipment), swordState: Object.assign({}, this.swordState) };
    }
    spawnDojoTarget(slot) {
      const single = this.dojo.targetMode === 'single', x = single ? 480 : 300 + slot % 6 * 72, y = single ? 270 : 195 + Math.floor(slot / 6) * 75;
      const hp = single ? 6000 : 480;
      this.enemies.push({ id: ++this.uid, x, y, r: 23, kind: 'dummy', dojoDummy: true, dojoSlot: slot, hp, maxHp: hp, damage: 0, speed: 0, dir: Math.PI / 2, kx: 0, ky: 0, cooldown: 999, action: 0, spawn: .35, hit: 0, stun: 0, slow: 0, slowFactor: 1, seed: slot * .73 + 4, dead: false, boss: false });
      this.spawned++; this.fx.push({ type: 'spawn', x, y, life: .35, max: .35, color: '#c4cbaa' });
    }
    updateDojoTargets() {
      const ready = this.dojoRespawns.filter(r => r.at <= this.time); this.dojoRespawns = this.dojoRespawns.filter(r => r.at > this.time);
      for (const r of ready) this.spawnDojoTarget(r.slot);
      if (this.dojo.targetMode === 'sparring' && this.time >= this.nextSpawn) {
        const alive = this.enemies.filter(e => !e.dead).length;
        if (alive < this.maxLiving) { this.spawnGroup(Math.min(5, this.maxLiving - alive)); this.wave++; }
        this.nextSpawn = this.time + .65;
      }
    }

    update(dt) {
      if (this.paused || this.ended || this.destroyed) return;
      if (this.dojo) dt *= this.dojo.timeScale;
      this.time += dt;
      const p = this.p;
      for (const key of ['invuln', 'hit', 'attackCd', 'skillCd', 'ultCd', 'fireCd', 'dodgeCd', 'herbCd', 'breatheCd', 'armor', 'swing', 'healCd', 'cast']) p[key] = Math.max(0, p[key] - dt);
      for(const key of ['attack','guard'])this.supplyBuffs[key]=Math.max(0,this.supplyBuffs[key]-dt);
      p.attack=this.baseAttack*(this.supplyBuffs.attack>0?1+this.buffAttackRate:1);
      if (this.dojo) { p.hp = clamp(p.hp, 1, p.maxHp); this.refreshDojoSkills(); }
      this.shake = Math.max(0, this.shake - dt * 23); this.flash = Math.max(0, this.flash - dt * 2.5);
      if (this.finale && this.finale.active) {
        this.clearInput(); this.finale.update(dt);
        if (!this.ended) this.updateEffects(dt);
        if (this.time - this.lastHud > .08) this.updateHud();
        return;
      }
      const due = this.tasks.filter(t => t.at <= this.time); this.tasks = this.tasks.filter(t => t.at > this.time); due.forEach(t => { if (!this.ended) t.fn(); });
      if (this.ended) return;
      let movement = this.getMove();
      p.walking = hypot(movement.x, movement.y) > .08;
      if (p.walking) p.walkPhase = (p.walkPhase + hypot(movement.x, movement.y) * p.speed * dt / 76) % 1;
      if (p.dash) {
        const dash = p.dash; dash.t -= dt; p.x += dash.vx * dt; p.y += dash.vy * dt;
        p.air = Math.sin(Math.PI * clamp(1 - dash.t / dash.max, 0, 1)) * (dash.damage ? 46 : 34);
        if (this.time - this.lastGhost > .035) { this.lastGhost = this.time; this.ghosts.push({ x: p.x, y: p.y, z: p.air, dir: p.dir, phase: 1 - dash.t / dash.max, life: .27, max: .27 }); }
        this.particles.push({ x: p.x, y: p.y, z: p.air + 18, vz: 0, vx: 0, vy: 0, life: .24, max: .24, r: 11, color: this.color, type: 'glow' });
        if (dash.damage) this.enemies.forEach(e => { if (!e.dead && !dash.hits.has(e.id) && hypot(e.x - p.x, e.y - p.y) < 55 + e.r) { dash.hits.add(e.id); this.damageEnemy(e, dash.damage, { knock: 30, charge: dash.charge !== false }); } });
        if (dash.t <= 0) { p.dash = null; p.air = 0; }
      } else { p.air = 0; p.x += movement.x * p.speed * dt; p.y += movement.y * p.speed * dt; }
      p.x = clamp(p.x, 43, this.arenaWidth - 43); p.y = clamp(p.y, 86, this.arenaHeight - 48);
      if (this.pointer.active && (this.heldAttack || this.time - this.pointer.last < 1.4)) p.dir = Math.atan2(this.pointer.y - p.y, this.pointer.x - p.x);
      else if (p.walking && p.swing < .03) p.dir = Math.atan2(movement.y, movement.x);
      if (this.heldAttack || this.keys.has('KeyJ')) this.attack();
      this.updateCamera(dt);
      this.rebuildSpatial();
      this.syncCompanions(); this.updateCompanions(dt);
      this.enemies.forEach(e => {
        this.updateEnemy(e, dt);
        // Sample actual motion, including slow, knockback and externally moved
        // targets; discard teleport-sized jumps rather than leading off screen.
        const sample = e.motionSample;
        if (sample && this.time > sample.time) {
          const age = this.time - sample.time, vx = (e.x - sample.x) / age, vy = (e.y - sample.y) / age;
          const sensible = hypot(vx, vy) < 850;
          e.trackVx = sensible ? mix(num(e.trackVx, vx), vx, Math.min(1, dt * 18)) : 0;
          e.trackVy = sensible ? mix(num(e.trackVy, vy), vy, Math.min(1, dt * 18)) : 0;
        }
        e.motionSample = { x: e.x, y: e.y, time: this.time };
      });
      this.updateHazards(dt); this.updateFields(dt); this.updateBolts(dt);
      this.enemies = this.enemies.filter(e => !e.dead || e.deathTime > this.time - .36);
      this.updateEffects(dt);
      this.updateSpawnDirector();
      // The wounded boss continues fighting and every reinforcement still
      // spawns. The cinematic starts only after the entire guard force is gone.
      if (this.finale && !this.finale.complete && this.boss && !this.boss.dead && this.boss.hp <= this.boss.maxHp * .2 + .001 && this.spawned >= this.total && !this.enemies.some(e => !e.dead && e !== this.boss)) {
        this.finale.tryStart();
        if (this.finale.active) {
          this.clearInput(); this.pointer.active = false; p.dash = null; p.air = 0; p.walking = false;
          this.tasks = []; this.fields = []; this.hazards = []; this.bolts = []; this.fx = []; this.ghosts = []; this.particles = []; this.floats = [];
          if (this.swordFx) this.swordFx.clear();
          this.updateHud(true); return;
        }
      }
      // Spawning above can change the live count in this same frame. The final
      // reinforcement group must actually be defeated before victory is awarded.
      if (!this.dojo && !this.finale && this.spawned >= this.total && !this.enemies.some(e => !e.dead) && this.time > 1) this.finish(true, false);
      if (!this.dojo && p.hp <= 0 && !this.ended) this.finish(false, false);
      if (this.time > this.toastUntil) this.ui.toast.classList.remove('ss-c-show');
      if (this.time > 15) this.ui.guide.style.opacity = '.28';
      if (this.time - this.lastHud > .08) this.updateHud();
    }
    getMove() {
      let x = this.joy.x + (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) - (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);
      let y = this.joy.y + (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0) - (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0);
      const d = hypot(x, y); if (d > 1) { x /= d; y /= d; } return this.screenVectorToWorld(x, y);
    }
    makeStoryWaves() {
      if (this.dojo || this.training || this.initialOnly || !/^[a-z]+-0[1-8]$/.test(this.enc.storyChapter || '')) return null;
      const chapter = Number(this.enc.storyChapter.slice(-2)), solo = this.enc.storyChapter === 'sali-08';
      const count = solo ? 1 : this.storyFinale ? 5 : chapter <= 2 ? 2 : chapter <= 5 ? 3 : 4;
      const base = this.total, bossSlot = this.enc.boss ? 1 : 0;
      // Each wave repeats the original encounter's ordinary army. Captains are
      // additive, and the unique story boss is counted once, outside that quota.
      const ordinary = base - bossSlot;
      const captainBudgets = Array.from({length:count},(_,i)=>solo||chapter<=2||i===0?0:chapter<=5?(i===count-1?1:0):(i===count-1||this.storyFinale&&i>=3?2:1));
      const ordinaryBudgets = Array(count).fill(ordinary);
      const budgets = ordinaryBudgets.map((n,i)=>n+captainBudgets[i]);
      this.total = bossSlot + budgets.reduce((a,b)=>a+b,0);
      let cumulative = bossSlot;
      return { index:0, count, baseTotal:base, ordinaryBudgets, captainBudgets, budgets, ends:budgets.map(n=>cumulative+=n), names:count===1?['决战']:Array.from({length:count},(_,i)=>i===count-1?'决战总攻':i===0?'先锋压阵':i===1?'弓阵夹击':i===2?'重甲压进':'突袭合围') };
    }

    updateSpawnDirector() {
      if (this.actionsLocked()) return;
      if (this.dojo) { this.updateDojoTargets(); return; }
      if(this.tower){
        const alive=this.enemies.filter(e=>!e.dead).length,ends=this.tower.ends||[this.tower.quota];
        const wave=this.towerWave||0;
        if(!this.boss&&wave<ends.length-1&&this.spawned>=ends[wave]&&alive<=Math.max(2,Math.floor(this.maxLiving*.2))){
          this.towerWave=wave+1;this.nextSpawn=this.time;
          this.toast(`第 ${this.towerWave+1} / ${ends.length} 波 · ${this.tower.label}再起`,2.8);
        }
        if(!this.boss&&this.kills>=this.tower.quota){this.spawnBoss();this.toast(this.enc.boss.name+' 现身 · 击败守层者',3);}
        if(!this.boss&&this.spawned<this.tower.quota&&this.time>=this.nextSpawn){this.spawnGroup(Math.min(6,this.maxLiving-alive));this.nextSpawn=this.time+.65;}
        return;
      }
      const w=this.storyWaves;
      let alive=this.enemies.filter(e=>!e.dead).length;
      if(w && w.index<w.count-1 && this.spawned>=w.ends[w.index] && alive<=Math.max(2,Math.min(Math.floor(this.maxLiving*.25),Math.floor(w.budgets[w.index]*.25)))) {
        w.index++; this.nextSpawn=this.time;
        if(w.index===w.count-1)this.activateWaitingBoss();
        this.toast(`第 ${w.index+1} / ${w.count} 波 · ${w.names[w.index]}${w.index===w.count-1&&this.boss?' · '+this.enc.boss.name+' 入战，无敌解除':''}`,2.8);
        alive=this.enemies.filter(e=>!e.dead).length;
      }
      const bossAlive=!this.enc.boss||this.boss&&!this.boss.dead;
      const limit=w?w.ends[w.index]:this.total;
      if(!this.training&&!this.initialOnly&&this.spawned<limit&&(w||bossAlive)&&this.time>=this.nextSpawn) {
        const n=Math.min(Math.ceil((this.enc.boss?3:4+this.danger*.25)*this.density),limit-this.spawned,this.maxLiving-alive);
        if(n>0){this.spawnGroup(n);this.wave++;this.nextSpawn=this.time+this.profile.refill;}else this.nextSpawn=this.time+.24;
      }
      if(!w&&!this.finale&&this.enc.boss&&this.boss?.dead)this.total=this.spawned;
    }
    activateWaitingBoss() {
      const b=this.boss;if(!b?.waiting)return;
      b.waiting=false;b.x=480;b.y=135;b.spawn=.8;b.cooldown=1.2;
      this.enemies.push(b);this.ring(b.x,b.y,90,'#e0bc98',.7);
    }

    nearest(max = Infinity) { let target = null, best = max; for (const e of this.enemies) if (!e.dead && e.spawn <= 0) { const d = hypot(e.x - this.p.x, e.y - this.p.y); if (d < best) { best = d; target = e; } } return target; }
    aim(max = 260) { const n = this.nearest(max); if (!this.pointer.active && n) this.p.dir = Math.atan2(n.y - this.p.y, n.x - this.p.x); return this.p.dir; }
    rebuildSpatial() {
      this.spatial.clear();
      for (const e of this.enemies) if (!e.dead) { const key = Math.floor(e.x / 80) + ',' + Math.floor(e.y / 80); if (!this.spatial.has(key)) this.spatial.set(key, []); this.spatial.get(key).push(e); }
    }
    neighbors(x, y) {
      const cx = Math.floor(x / 80), cy = Math.floor(y / 80), out = [];
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { const bucket = this.spatial.get((cx + dx) + ',' + (cy + dy)); if (bucket) out.push(...bucket); }
      return out;
    }
    emitSword(tier, options = {}) {
      if (this.swordFx) return this.swordFx.emit(this.hero.id, tier, Object.assign({ x: this.p.x, y: this.p.y, angle: this.p.dir, hand: this.swordState.hand, equipment: this.equipment.type, learned: this.techniqueReady }, options));
      return null;
    }
    checkAwakening() {
      if (!this.awakening || this.awakened || this.hero.id !== 'hongmao' || this.kills < Math.max(1, num(this.awakening.atKills, 12))) return false;
      // swordState is a private constructor copy. A failed attempt never writes
      // an unlock into the journey save; chapter completion owns persistence.
      this.awakened = true; this.awakenedAt = this.time; this.awakeningCount++;
      this.swordState.ultimateUnlocked = true;
      this.swordState.technique = this.awakening.technique || '火舞旋风·第十层';
      this.techniqueReady = true; this.finisherUnlocked = true; this.skill.ult = '长虹贯日';
      this.p.energy = 100; this.p.fireCd = 0;
      this.fx.push({ type: 'title', text: '七鸽启悟 · 火舞旋风', life: 2.4, max: 2.4, color: '#ffddb0' });
      this.toast('七鸽启悟 · 火舞旋风第十层！按 F 卷焰破阵', 5.5);
      this.emitSword('awakening', { radius: 175, duration: 2.3, follow: true });
      this.tone('skill'); this.updateHud(true); return true;
    }

    actionsLocked() { return this.paused || this.ended || this.destroyed || !!(this.finale && (this.finale.active || this.finale.complete)); }

    attack() {
      const p = this.p; if (this.actionsLocked() || p.attackCd > 0 || p.dash) return;
      this.aim(235); p.combo++;
      const id = this.hero.id, cadence = id === 'sali' ? .275 : id === 'daben' ? .45 : .34;
      p.attackCd = cadence; p.swing = .2;
      const finisher = p.combo % 3 === 0, range = (id === 'daben' ? 153 : id === 'dada' ? 143 : id === 'doudou' ? 136 : 132) + (finisher ? 16 : 0);
      const half = finisher ? 1.85 : id === 'daben' ? 1.62 : 1.35;
      const comboHit = id === 'sali' && finisher;
      const basicPower = p.attack * (this.techniqueReady ? MOVE_BALANCE[id].j : 1);
      const damage = basicPower * (comboHit ? 1.65 : finisher ? 1.22 : 1);
      if (this.swordFx) this.emitSword('attack', { radius: range, half, combo: p.combo });
      else this.fx.push({ type: 'slash', x: p.x, y: p.y, z: 28, angle: p.dir, range, half, life: .22, max: .22, color: this.color, flip: p.combo % 2, thick: comboHit || id === 'daben' ? 7 : 4 });
      let hit = false;
      this.enemies.forEach(e => {
        if (e.dead || e.spawn > 0) return; const d = hypot(e.x - p.x, e.y - p.y), a = Math.atan2(e.y - p.y, e.x - p.x);
        if (d < range + e.r && (Math.abs(angleDiff(a, p.dir)) < half || d < 44)) {
          hit = true; this.damageEnemy(e, damage, { knock: id === 'daben' ? 34 : 16, stun: id === 'daben' ? .18 : 0, crit: comboHit });
          if (id === 'hongmao' && this.equipment.type === 'sword') this.applyDot(e, 'burn', p.attack * .13, 2.8);
          if (id === 'lantu') { e.slow = Math.max(e.slow, 1.6); e.slowFactor = Math.min(e.slowFactor, .78); }
          if (id === 'doudou' && p.healCd <= 0) { this.healInArea(p.x, p.y, 180, .006); p.healCd = .9; }
        }
      });
      if (id === 'dada' && p.combo % 4 === 0) this.playerBolt(p.x, p.y - 4, p.dir, 470, basicPower * 1.15, 17, '#d8ecd0', 9, 1.3);
      this.tone(hit ? 'hit' : 'swing');
      if (hit && this.time > (this.lastImpact || 0) + .09) { this.hitStop = .018; this.lastImpact = this.time; }
    }

    useSkill() {
      const p = this.p; if (this.actionsLocked()) return;
      this.refreshDojoSkills();
      if (p.skillCd > 0) { this.toast(`剑招调息中 · ${p.skillCd.toFixed(1)} 秒`, 1); return; }
      this.casts.q++; p.skillCd = this.skillMaxCd; p.cast = .64; p.castMax = .64; this.aim(650);
      if (this.dojo) { this.dojoCastAt.q = this.time; this.dojoBusyUntil.q = this.time + this.dojoMoveDuration('q'); this.refreshDojoSkills(); }
      return this.performSwordSkill();
    }

    performSwordSkill() {
      const p = this.p;
      const id = this.hero.id, x = p.x, y = p.y, angle = p.dir;
      let power = (p.attack + (this.techniqueBonus || 0)) * this.skillPower;
      this.tone('skill'); this.textFloat(this.skill.name, p.x, p.y, this.color, 18, .95, 105);
      this.emitSword('q', { radius: id === 'dada' ? 218 : 230, duration: id === 'dada' ? 4.6 : 1.0, follow: id === 'sali' || this.equipment.type !== 'sword' && !this.techniqueReady });
      if (this.equipment.type !== 'sword' && !this.techniqueReady) {
        for (let i = 0; i < 3; i++) this.schedule(.14 + i * .14, () => this.arcDamage(p.x, p.y, angle + (i - 1) * .3, 218, 1.65, power * 1.45, { knock: 20, stun: .1 }));
        return this.updateHud(true);
      }
      if (this.techniqueReady) power *= MOVE_BALANCE[id].q;
      if (id === 'hongmao') {
        this.schedule(.16, () => {
          this.arcDamage(x, y, angle, 270, 1.36, power * 3.65, { knock: 48, burn: power * .35, burnDuration: 3.5 });
          for (let i = -1; i <= 1; i++) this.playerBolt(x, y, angle + i * .19, 560, power * .7, 22, '#ffd697', 20, .8, { burn: power * .2, burnDuration: 3 });
          this.shake = Math.max(this.shake, 2.8);
        });
      } else if (id === 'lantu') {
        this.schedule(.18, () => this.radial(x, y, 238, power * 3.1, { knock: 22, slow: 3.6, slowFactor: .38, stun: .3 }));
      } else if (id === 'sali') {
        p.invuln = Math.max(p.invuln, .35);
        for (let i = 0; i < 3; i++) this.schedule(.1 + i * .16, () => this.arcDamage(p.x, p.y, angle + (i - 1) * .22, 238 + i * 5, 1.35, power * 1.8, { knock: 14 }));
      } else if (id === 'doudou') {
        this.schedule(.18, () => { this.healInArea(x, y, 235, .02); this.radial(x, y, 240, power * 2.35, { knock: 15 }); this.fields.push({ team: 'player', kind: 'rain', x, y, r: 235, life: 2.6, max: 2.6, tick: .25, interval: .65, ticksRemaining: 4, damage: power * .65, healRate: .01, color: '#b7e5d3', ult: false, visualFX: true }); });
      } else if (id === 'daben') {
        this.schedule(.22, () => { p.armor = 3.6; this.radial(x, y, 242, power * 4.45, { knock: 70, stun: .65 }); this.shake = Math.max(this.shake, 4); });
      } else if (id === 'tiaotiao') {
        this.schedule(.1, () => { this.startDash(angle, 1060, .31, power * 4, true); p.invuln = Math.max(p.invuln, .4); });
      } else if (id === 'dada') {
        this.schedule(.16, () => this.fields.push({ team: 'player', kind: 'wind', x, y, r: 220, life: 4.5, max: 4.5, tick: 0, interval: .45, ticksRemaining: 10, damage: power * .84, color: '#d4ebbb', follow: false, slow: .74, ult: false, visualFX: true }));
      }
      this.updateHud(true);
    }

    useUlt() {
      const p = this.p; if (this.actionsLocked()) return;
      this.refreshDojoSkills();
      if (p.ultCd > 0) { this.toast(`剑势收转 · ${p.ultCd.toFixed(1)} 秒`, .8); return; }
      if (p.energy < this.ultEnergyCost - .1) { this.toast(`${this.skill.ult}需要 ${this.ultEnergyCost} 剑意 · 当前 ${Math.floor(p.energy)}`, 1.4); return; }
      this.casts.e++; p.energy = Math.max(0, p.energy - this.ultEnergyCost); p.ultCd = this.ultMaxCd; p.invuln = Math.max(p.invuln, .65); this.aim(800);
      if (this.dojo) { this.dojoCastAt.e = this.time; this.dojoBusyUntil.e = this.time + this.dojoMoveDuration('e'); this.refreshDojoSkills(); }
      p.cast = this.hero.id === 'hongmao' ? .96 : 1.8; p.castMax = p.cast;
      return this.performSwordUlt();
    }

    performSwordUlt() {
      const p = this.p;
      this.shake = Math.max(this.shake, 2.5); this.tone('ult');
      this.fx.push({ type: 'title', text: `${this.hero.name} · ${this.skill.ult}`, life: 1.35, max: 1.35, color: this.color });
      const id = this.hero.id, x = p.x, y = p.y, angle = p.dir;
      let power = (p.attack + (this.techniqueBonus || 0)) * this.skillPower;
      if (id === 'hongmao') { this.useChanghong(power * MOVE_BALANCE.hongmao.e, angle); this.updateHud(true); return; }
      if (!this.techniqueReady) {
        this.emitSword('practice', { radius: 285, duration: 1.55, follow: true });
        for (let i = 0; i < 3; i++) this.schedule(.24 + i * .25, () => { this.radial(p.x, p.y, 265 + i * 12, power * 2.45, { knock: 28, stun: .14, charge: false }); this.shake = Math.max(this.shake, 2.2); });
        return this.updateHud(true);
      }
      power *= MOVE_BALANCE[id].e;
      this.emitSword('e', { radius: id === 'tiaotiao' ? 250 : 282, duration: id === 'lantu' ? 5.5 : id === 'doudou' ? 5.8 : id === 'dada' ? 6.2 : 2.65, follow: ['sali', 'dada'].includes(id) });
      if (id === 'lantu') {
        this.schedule(.35, () => { this.radial(x, y, 282, power * 4.4, { stun: .85, slow: 5.3, slowFactor: .3, charge: false }); this.fields.push({ team: 'player', kind: 'ice', x, y, r: 282, life: 5, max: 5, tick: .2, interval: .62, ticksRemaining: 8, damage: power * 1.05, color: '#b6eeff', slow: .34, ult: true, visualFX: true }); });
      } else if (id === 'sali') {
        for (let i = 0; i < 8; i++) this.schedule(.32 + i * .15, () => { this.radial(p.x, p.y, 278, power * 1.24, { knock: 7, charge: false, quiet: i % 2 === 1 }); });
        this.schedule(1.66, () => { this.arcDamage(p.x, p.y, angle, 350, 1.55, power * 2.75, { knock: 65, charge: false }); this.shake = Math.max(this.shake, 3); });
      } else if (id === 'doudou') {
        this.schedule(.32, () => { this.healInArea(x, y, 282, .02); this.radial(x, y, 282, power * 3.2, { charge: false }); this.fields.push({ team: 'player', kind: 'rain', x, y, r: 282, life: 5.3, max: 5.3, tick: .15, interval: .65, ticksRemaining: 8, damage: power * 1.2, color: '#bee7d2', ult: true, healRate: .011, visualFX: true }); });
      } else if (id === 'daben') {
        for (let i = 0; i < 3; i++) this.schedule(.35 + i * .54, () => { this.radial(x, y, 260 + i * 19, power * 3.85, { knock: 55, stun: .45, charge: false }); this.shake = Math.max(this.shake, 4.5); }); p.armor = 4.8;
      } else if (id === 'tiaotiao') {
        p.invuln = Math.max(p.invuln, 1.55);
        for (let i = 0; i < 7; i++) this.schedule(.23 + i * .19, () => {
          const e = this.nearest(900); if (!e) return;
          const ox = p.x, oy = p.y, a = Math.atan2(e.y - oy, e.x - ox);
          p.x = clamp(e.x - Math.cos(a) * 43, 43, this.arenaWidth - 43); p.y = clamp(e.y - Math.sin(a) * 43, 86, this.arenaHeight - 48); p.dir = a;
          this.emitSword('dash', { x: ox, y: oy, x2: p.x, y2: p.y, angle: a, duration: .57, radius: 138 });
          this.radial(e.x, e.y, 151, power * 1.8, { knock: 10, charge: false });
          this.ghosts.push({ x: ox, y: oy, z: 22, dir: a, phase: .6, life: .32, max: .32 });
        });
      } else if (id === 'dada') {
        this.schedule(.27, () => this.fields.push({ team: 'player', kind: 'wind', x: p.x, y: p.y, r: 282, life: 5.8, max: 5.8, tick: 0, interval: .4, ticksRemaining: 15, damage: power * .96, color: '#e0eec6', follow: true, slow: .64, ult: true, visualFX: true }));
        for (let k = 0; k < 8; k++) this.schedule(.4 + k * .54, () => this.fireQinVolley(power, angle));
      }
      this.updateHud(true);
    }

    useChanghong(power, angle) {
      // Traced from concepts/hongmao-changhong-v8.png: a focused sword core,
      // two straight residual blades, a small sun impact and sharp fragments.
      // The ground reflection and elevated blade use the same world-space axis.
      const p = this.p, f = { type: 'changhong', x: p.x, y: p.y, angle, range: CHANGHONG.range, life: CHANGHONG.duration, max: CHANGHONG.duration, charge: CHANGHONG.charge, released: false, impacts: [] };
      this.fx.push(f);
      this.schedule(CHANGHONG.charge, () => {
        f.x = p.x; f.y = p.y; f.released = true; p.dir = angle; p.swing = .2;
        this.lineDamage(f.x, f.y, angle, f.range, CHANGHONG.halfWidth, power * CHANGHONG.mainPower, { knock: 24, stun: .2, charge: false, crit: true }, f.impacts);
        this.shake = Math.max(this.shake, 3.4); this.tone('hit');
      });
      this.schedule(CHANGHONG.echoAt, () => {
        this.lineDamage(f.x, f.y, angle, f.range, CHANGHONG.halfWidth, power * CHANGHONG.echoPower, { knock: 12, charge: false });
      });
    }
    lineDamage(x, y, angle, range, width, amount, options = {}, impacts) {
      const dx = Math.cos(angle), dy = Math.sin(angle);
      for (const e of this.enemies) {
        if (e.dead || e.spawn > 0) continue;
        const along = (e.x - x) * dx + (e.y - y) * dy, side = (e.y - y) * dx - (e.x - x) * dy;
        if (along < -e.r || along > range + e.r || Math.abs(side) > width + e.r) continue;
        const before = e.hp; this.damageEnemy(e, amount, options);
        if (impacts && e.hp < before) impacts.push({ x: e.x, y: e.y, along: clamp(along, 24, range) });
      }
    }

    useFinisher() {
      const p = this.p;
      if (this.actionsLocked() || this.hero.id !== 'hongmao') return false;
      if (!this.finisherUnlocked) { this.toast('火舞旋风尚未领悟 · 待第七幕战中领悟第十层，F 方才开放', 2.2); return false; }
      this.refreshDojoSkills();
      if (p.fireCd > 0) { this.toast(`火舞旋风调息中 · ${p.fireCd.toFixed(1)} 秒`, 1); return false; }
      if (p.energy < this.fireEnergyCost - .1) { this.toast(`火舞旋风需要 ${this.fireEnergyCost} 剑意 · 当前 ${Math.floor(p.energy)}`, 1.5); return false; }
      this.casts.f++; p.energy = Math.max(0, p.energy - this.fireEnergyCost); p.fireCd = this.fireMaxCd;
      p.invuln = Math.max(p.invuln, .65); p.cast = 2.5; p.castMax = p.cast; this.aim(800);
      if (this.dojo) { this.dojoCastAt.f = this.time; this.dojoBusyUntil.f = this.time + this.dojoMoveDuration('f'); this.refreshDojoSkills(); }
      return this.performSwordFinisher();
    }

    performSwordFinisher() {
      const p = this.p;
      const power = (p.attack + (this.techniqueBonus || 0)) * this.skillPower * MOVE_BALANCE.hongmao.f;
      this.shake = Math.max(this.shake, 2.5); this.tone('ult');
      this.fx.push({ type: 'title', text: '虹猫 · 火舞旋风', life: 1.35, max: 1.35, color: this.color });
      // Retain the approved firewhirl director and all eight pull/burn pulses.
      // Its internal tier stays e for compatibility with the original art.
      this.emitSword('e', { radius: 298, duration: FIREWHIRL.duration, follow: true, technique: 'firewhirl' });
        for (let i = 0; i < 8; i++) this.schedule(.34 + i * .205, () => {
          const r = 205 + i * 11;
          for (const e of this.enemies) if (!e.dead && !e.boss && hypot(e.x - p.x, e.y - p.y) < r + e.r) { const a = Math.atan2(p.y - e.y, p.x - e.x); e.kx += Math.cos(a) * 78; e.ky += Math.sin(a) * 78; }
          this.radial(p.x, p.y, r, power * .76, { burn: power * .2, burnDuration: 2.3, charge: false, quiet: i % 2 === 1 });
        });
        this.schedule(2.06, () => { this.radial(p.x, p.y, 315, power * 5.2, { knock: 100, stun: .38, burn: power * .6, burnDuration: 4, charge: false }); this.shake = Math.max(this.shake, 4.5); this.burst(p.x, p.y, '#ffd7a1', 28, 280); });
      this.updateHud(true); return true;
    }

    startDash(angle, speed, duration, damage, charge) { this.p.dash = { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, t: duration, max: duration, damage, hits: new Set(), charge }; }
    dodge() {
      const p = this.p; if (this.actionsLocked() || p.dodgeCd > 0 || p.dash) return;
      const m = this.getMove(); const a = hypot(m.x, m.y) > .15 ? Math.atan2(m.y, m.x) : p.dir;
      p.dodgeCd = this.hero.id === 'tiaotiao' ? 1.6 : 2.25; p.invuln = Math.max(p.invuln, .33);
      this.startDash(a, 705, .19, this.hero.id === 'tiaotiao' ? p.attack * .9 : 0, true); this.tone('swing'); this.updateHud(true);
    }
    breathe() {
      const p=this.p;if(this.actionsLocked()||p.breatheCd>0)return false;
      if(p.hp>=p.maxHp-.01){this.toast('气血充盈，无需调息',1.2);return false;}
      p.breatheCd=18;this.heal(p.maxHp*.2);this.tone('heal');this.ring(p.x,p.y,70,'#c7e9a7',.6);this.updateHud(true);return true;
    }
    useHerb() { return this.consumeSupply('herb'); }
    useSupply(slot) { return this.consumeSupply(this.loadout[slot]); }
    consumeSupply(id) {
      const p=this.p,i=this.supplyCatalog.find(v=>v.id===id);
      if(this.actionsLocked()||p.herbCd>0||!i)return false;
      if((this.supplyStock[id]||0)-(this.usedSupplies[id]||0)<=0){this.toast('该补给已用尽',1.2);return false;}
      if(i.heal&&p.hp>=p.maxHp-.01&&(!i.energy||p.energy>=100)){this.toast('气血与所需剑意充足，不消耗恢复药',1.2);return false;}
      if(i.buff&&this.supplyBuffs[i.buff]>0){this.toast('同类增益仍生效，不重复消耗',1.2);return false;}
      if(typeof this.opts.onSupplyUse==='function'&&this.opts.onSupplyUse(id)===false){this.toast('补给未能使用',1.2);return false;}
      if(i.permanent&&this.permanent[i.permanent]<this.permanentLimit){
        this.permanent[i.permanent]++;
        if(i.permanent==='attack')this.baseAttack+=i.amount;else p.maxHp+=i.amount;
        // Permanent growth belongs to the whole postgame party, not the temporary buff.
        for(const a of this.companions)if(a.sharedGrowth){
          if(i.permanent==='attack')a.attack+=i.amount*.24;
          else {a.sharedBaseHp+=i.amount;const next=Math.round(a.sharedBaseHp*.9),gain=next-a.maxHp;a.maxHp=next;if(!a.dead&&a.hp>0)a.hp=Math.min(a.maxHp,a.hp+gain);}
        }
      }
      this.usedSupplies[id]=(this.usedSupplies[id]||0)+1;if(id==='herb')this.usedHerbs++;
      p.herbCd=4;if(i.heal)this.heal(p.maxHp*i.heal);if(i.energy)p.energy=Math.min(100,p.energy+i.energy);
      if(i.buff){this.supplyBuffs[i.buff]=i.duration;if(i.buff==='attack')this.buffAttackRate=i.rate||.25;}
      p.attack=this.baseAttack*(this.supplyBuffs.attack>0?1+this.buffAttackRate:1);
      this.tone('heal');this.toast(i.name+' · '+(i.description||'回复气血'),2);this.updateHud(true);return true;
    }
    healTarget(actor, amount, show = true, small = false) {
      if (!actor || actor.dead || actor.removed || !Number.isFinite(actor.hp) || !Number.isFinite(actor.maxHp) || actor.hp <= 0 || actor.maxHp <= 0) return 0;
      const n = Math.max(0, Math.min(actor.maxHp - actor.hp, num(amount, 0)));
      if (n <= 0) return 0;
      actor.hp += n; this.healingDone += n;
      if (show) this.textFloat(`+${Math.max(1, Math.round(n))}`, actor.x, actor.y, '#c9ffcd', small ? 13 : 20, small ? .65 : .85, 84);
      return n;
    }
    heal(amount, show = true) { return this.healTarget(this.p, amount, show); }
    syncCompanions() {
      const live = typeof this.opts.getAllies === 'function' ? this.opts.getAllies() : [];
      const candidates = [...(Array.isArray(live) ? live : []), ...this.allies], seen = new Set(), ids = new Set(), heroIds = new Set(), party = [];
      for (const a of candidates) {
        if (!a || a === this.p || a.ai !== 'companion' || a.heroId === this.hero.id || !SKILLS[a.heroId] || this.enemies.includes(a) || a.team != null && !['player', 'ally', 'friendly'].includes(a.team)) continue;
        if (seen.has(a) || a.id != null && ids.has(a.id)) continue;
        // A live getter is authoritative for this actor, including departure
        // and defeat. Its old static snapshot cannot rejoin or resurrect it.
        seen.add(a); if (a.id != null) ids.add(a.id);
        if (a.removed || a.spawn > 0 || heroIds.has(a.heroId) || party.length >= 2) continue;
        if (!this.companionInit.has(a)) {
          const hero = window.GAME_DATA && window.GAME_DATA.heroes.find(h => h.id === a.heroId) || {};
          const side = party.length ? 1 : -1, angle = this.p.dir;
          a.x = clamp(num(a.x, this.p.x - Math.cos(angle) * 74 - Math.sin(angle) * side * 53), 43, this.arenaWidth - 43);
          a.y = clamp(num(a.y, this.p.y - Math.sin(angle) * 74 + Math.cos(angle) * side * 53), 86, this.arenaHeight - 48);
          a.maxHp = Math.max(1, num(a.maxHp, num(hero.hp, 130) + (this.level - 1) * 9));
          a.hp = clamp(num(a.hp, a.maxHp), 0, a.maxHp);
          a.attack = Math.max(0, num(a.attack, num(hero.attack, 21) + (this.level - 1) * 2.3));
          a.speed = Math.max(0, num(a.speed, num(hero.speed, 220))); a.r = clamp(num(a.r, 15), 10, 24);
          a.name = a.name || hero.name || '同行'; a.color = a.color || COLORS[a.heroId]; a.team = 'ally';
          a.dir = num(a.dir, Math.PI / 4); a.walkPhase = 0; a.walking = false; a.swing = 0;
          a.canRecover = a.hp > 0 && !a.dead; a.lifeVersion = 0; a.recovery = 0; a.dodgeCd = 0; a.dodgeCount = 0; a.returnCount = 0;
          a.attackCd = .3 + party.length * .18; a.invuln = .8; a.hit = 0; a.combo = 0; a.healCd = 0;
          a.skillCd = .65 + party.length * .35; a.ultCd = 0; a.fireCd = 0; a.energy = 0; a.cast = 0; a.castMax = 1; a.armor = 0; a.dash = null; a.skillCasts = { q: 0, e: 0, f: 0 };
          const ss = Object.assign({ status: 'bound', hand: a.heroId === 'sali' ? 'left' : 'right' }, a.swordState || {});
          if (a.heroId === 'sali' && ss.weaponName === '剑冢左手剑') ss.weaponName = '左手剑';
          const leftSword = a.heroId === 'sali' && ss.weaponName === '左手剑'; if (leftSword) ss.hand = 'left';
          a.combatEquipment = { type: ss.status === 'sealed' && a.heroId === 'daben' ? 'staff' : leftSword || ss.status === 'sealed' ? 'plain' : ['lost', 'training'].includes(ss.status) ? 'wood' : 'sword', hand: ss.hand, swordState: ss };
          if (a.hp <= 0) this.knockOutCompanion(a);
          this.companionInit.add(a);
        }
        if (!Number.isFinite(a.x) || !Number.isFinite(a.y) || !Number.isFinite(a.hp) || !Number.isFinite(a.maxHp) || a.maxHp <= 0) continue;
        if (a.hp <= 0 && !a.dead) this.knockOutCompanion(a);
        heroIds.add(a.heroId); party.push(a);
      }
      this.companions = party;
    }
    livingCompanions() { return this.companions.filter(a => !a.dead && !a.removed && a.hp > 0); }
    // Shared geometry for steering and safe re-entry. Projectiles are assessed
    // along their future segment, not merely by distance from the archer.
    companionDanger(a, x, y) {
      let danger = 0;
      for (const h of this.hazards) {
        if (h.dead || h.triggered || h.delay - h.elapsed > .95 || h.cancelOnDeath && h.owner?.dead) continue;
        const d = hypot(x-h.x,y-h.y);
        const hit = h.kind === 'annulus' ? d < h.r+a.r+10 && d > h.inner-a.r-10 : h.kind === 'circle' ? d < h.r+a.r+10 : h.kind === 'line' ? this.segmentDistance(x,y,h.x,h.y,h.x2,h.y2) < h.width/2+a.r+10 : h.kind === 'cone' && d < h.range+a.r+10 && (d<30 || Math.abs(angleDiff(Math.atan2(y-h.y,x-h.x),h.angle))<h.half+.16);
        if (hit) danger += 3 + Math.max(0, .95-(h.delay-h.elapsed))*3;
      }
      for (const b of this.bolts) if (b.team === 'enemy' && b.life > 0) {
        const speed2=b.vx*b.vx+b.vy*b.vy;
        const t=speed2 ? clamp(((x-b.x)*b.vx+(y-b.y)*b.vy)/speed2,0,Math.min(.5,b.life)) : 0;
        if (hypot(x-b.x-b.vx*t,y-b.y-b.vy*t)<a.r+b.r+12) danger += 4;
      }
      for (const f of this.fields) if (f.team==='enemy' && f.life>0 && hypot(x-f.x,y-f.y)<f.r+a.r) danger+=3;
      return danger;
    }
    companionEscape(a, mx, my) {
      let best=null;
      for(let i=0;i<16;i++) {
        const angle=i*TAU/16, vx=Math.cos(angle), vy=Math.sin(angle);
        const x=clamp(a.x+vx*114, 43, this.arenaWidth - 43), y=clamp(a.y+vy*114, 86, this.arenaHeight - 48);
        const travel=hypot(x-a.x,y-a.y);
        let score=this.companionDanger(a,x,y)*10 + this.companionDanger(a,(a.x+x)/2,(a.y+y)/2)*2 + (114-travel)*.2 - (vx*mx+vy*my)*.4;
        for(const e of this.enemies) if(!e.dead && e.spawn<=0) score+=Math.max(0,65+e.r-hypot(x-e.x,y-e.y))*.06;
        if(!best || score<best.score) best={x:(x-a.x)/(travel||1),y:(y-a.y)/(travel||1),score};
      }
      return best;
    }
    knockOutCompanion(a) {
      a.hp=0; a.dead=true; a.deathTime=this.time; a.recovery=a.canRecover ? 18 : 0;
      a.lifeVersion=(a.lifeVersion||0)+1; a.walking=false; a.swing=0; a.cast=0; a.dash=null; a.invuln=0;
      // Cancel owned pending/lingering visuals now, even if a caller advances
      // directly across the entire recovery interval in a single update.
      for(const list of [this.fields,this.fx,this.bolts,this.swordFx?.effects || []]) for(const f of list) if(f.sourceActor===a || f.owner===a) f.life=0;
    }
    returnCompanion(a, slot) {
      let best=null;
      for(let i=0;i<12;i++) {
        const angle=this.p.dir+Math.PI+(i+(slot?.5:0))*TAU/12;
        const x=clamp(this.p.x+Math.cos(angle)*90, 43, this.arenaWidth - 43),y=clamp(this.p.y+Math.sin(angle)*90, 86, this.arenaHeight - 48);
        let score=this.companionDanger(a,x,y)*100;
        for(const e of this.enemies) if(!e.dead && e.spawn<=0) score+=Math.max(0,120-hypot(x-e.x,y-e.y));
        for(const other of this.livingCompanions()) score+=Math.max(0,50-hypot(x-other.x,y-other.y));
        if(!best || score<best.score) best={x,y,score};
      }
      Object.assign(a,{x:best.x,y:best.y,hp:a.maxHp*.6,dead:false,recovery:0,invuln:1,hit:0,armor:0,cast:0,swing:0,dash:null,walking:false,dodgeCd:.6,attackCd:.3,skillCd:Math.max(.6,a.skillCd)});
      a.returnCount++; this.textFloat(`${a.name} 归队`,a.x,a.y,'#d2efbd',16,1.5,110);
      this.toast(`${a.name} 已休整归队 · 恢复六成气血`,2);
    }
    companionStatusText() {
      return this.companions.filter(a=>!a.removed).map(a=>a.dead ? a.recovery>0 ? `${a.name} 休整 ${Math.ceil(a.recovery)}秒` : `${a.name} 已离场` : `${a.name} ${Math.ceil(a.hp/a.maxHp*100)}%`).join(' · ');
    }
    updateCompanions(dt) {
      if (this.actionsLocked()) return;
      for (let slot = 0; slot < this.companions.length; slot++) {
        const a = this.companions[slot]; if (a.removed) continue;
        if(a.dead || a.hp<=0) { if(!a.dead) this.knockOutCompanion(a); if(a.recovery>0) { a.recovery=Math.max(0,a.recovery-dt); if(a.recovery<=0) this.returnCompanion(a,slot); } continue; }
        for (const key of ['attackCd', 'invuln', 'hit', 'swing', 'healCd', 'skillCd', 'ultCd', 'fireCd', 'cast', 'armor', 'dodgeCd']) a[key] = Math.max(0, a[key] - dt);
        if (a.dash) {
          const dash = a.dash; dash.t -= dt; a.x = clamp(a.x + dash.vx * dt, 43, this.arenaWidth - 43); a.y = clamp(a.y + dash.vy * dt, 86, this.arenaHeight - 48); a.walking = false;
          for (const e of this.enemies) if (dash.damage && !e.dead && e.spawn <= 0 && !dash.hits.has(e.id) && hypot(e.x-a.x,e.y-a.y) < 55+e.r) { dash.hits.add(e.id); this.damageEnemy(e,dash.damage,{sourceActor:a,charge:false,knock:30}); }
          if (dash.t <= 0) a.dash = null;
          continue;
        }
        const playerDistance = hypot(a.x - this.p.x, a.y - this.p.y);
        let target = null, nearest = 345;
        if (playerDistance < 285) for (const e of this.enemies) {
          if (e.dead || e.spawn > 0 || hypot(e.x - this.p.x, e.y - this.p.y) > 425) continue;
          const d = hypot(e.x - a.x, e.y - a.y); if (d < nearest) { target = e; nearest = d; }
        }
        const side = slot ? 1 : -1, heading = this.p.dir;
        const tx = target ? target.x : clamp(this.p.x - Math.cos(heading) * 76 - Math.sin(heading) * side * 54, 43, this.arenaWidth - 43);
        const ty = target ? target.y : clamp(this.p.y - Math.sin(heading) * 76 + Math.cos(heading) * side * 54, 86, this.arenaHeight - 48);
        const dx = tx - a.x, dy = ty - a.y, d = hypot(dx, dy) || 1, stop = target ? a.heroId === 'daben' ? 83 : 72 : 18;
        let mx = d > stop ? dx / d : 0, my = d > stop ? dy / d : 0;
        if(target && d<150+target.r) {
          // Circle at striking distance, retreat when crowded, close the gap
          // outside reach. Aim remains on the target while feet move sideways.
          const radial=d<stop ? -.8 : d>stop+25 ? .55 : 0;
          mx=dx/d*radial-dy/d*side*.65; my=dy/d*radial+dx/d*side*.65;
        }
        for (const other of [this.p, ...this.companions]) {
          if (other === a || other.dead || other.hp <= 0) continue;
          const sx = a.x - other.x, sy = a.y - other.y, sd = hypot(sx, sy), spacing = a.r + other.r + 12;
          if (sd > .1 && sd < spacing) { mx += sx / sd * (spacing - sd) / spacing; my += sy / sd * (spacing - sd) / spacing; }
        }
        if(this.companionDanger(a,a.x,a.y)>0 || this.companionDanger(a,clamp(a.x+mx*45, 43, this.arenaWidth - 43),clamp(a.y+my*45, 86, this.arenaHeight - 48))>0) {
          const escape=this.companionEscape(a,mx,my); mx=escape.x; my=escape.y;
          if(a.dodgeCd<=0) {
            a.dodgeCd=2.8; a.invuln=Math.max(a.invuln,.24); a.dodgeCount++;
            a.dash={vx:mx*520,vy:my*520,t:.22,max:.22,damage:0,hits:new Set(),evasion:true};
            this.textFloat('闪避',a.x,a.y,'#d5eedb',11,.5,100);
          }
        }
        const md = hypot(mx, my); if (md > 1) { mx /= md; my /= md; }
        a.walking = hypot(mx, my) > .06;
        if (a.walking) { a.x = clamp(a.x + mx * a.speed * dt, 43, this.arenaWidth - 43); a.y = clamp(a.y + my * a.speed * dt, 86, this.arenaHeight - 48); a.walkPhase = (a.walkPhase + hypot(mx, my) * a.speed * dt / 76) % 1; }
        if (target || a.walking) a.dir = target ? Math.atan2(dy, dx) : Math.atan2(my, mx);
        const wounded = a.heroId === 'doudou' && [this.p, ...this.livingCompanions()].some(v => v.hp < v.maxHp * .85 && hypot(v.x-a.x,v.y-a.y)<235);
        if ((target && nearest < (a.heroId === 'tiaotiao' ? 340 : 225) + target.r || wounded) && this.companionSkill(a)) continue;
        if (target && a.attackCd <= 0 && nearest < (a.heroId === 'daben' ? 137 : 119) + target.r) this.companionAttack(a);
      }
    }
    companionSkillScope(a, tier) {
      const combat = this, equipment = a.combatEquipment, ss = equipment.swordState, lifeVersion=a.lifeVersion;
      const masteredLeft = a.heroId === 'sali' && equipment.type === 'plain' && ss.status === 'training' && ss.ultimateUnlocked === true;
      const ready = equipment.type === 'sword' || masteredLeft;
      const scope = Object.create(Combat.prototype);
      Object.assign(scope, { p: a, hero: { id: a.heroId, name: a.name }, equipment, swordState: ss, techniqueReady: ready, color: a.color, skillPower: .65 * Math.max(1, num(a.skillPower, 1)), techniqueBonus: Math.max(0, num(a.techniqueBonus, 0)), arenaWidth: this.arenaWidth, arenaHeight: this.arenaHeight, skill: { ...SKILLS[a.heroId] } });
      if (!ready) scope.skill.name = scope.skill.ult = equipment.type === 'staff' ? '水火棍法' : a.heroId === 'sali' ? '左手练剑' : ss.technique || '护法剑术';
      const alive = () => a.lifeVersion===lifeVersion && !combat.actionsLocked() && combat.companions.includes(a) && !a.dead && !a.removed && a.hp > 0;
      const attribution = opt => ({ ...opt, sourceActor: a, charge: false, earnEnergy: tier === 'q' });
      for (const key of ['time', 'enemies']) Object.defineProperty(scope, key, { get: () => combat[key] });
      Object.defineProperty(scope, 'shake', { get: () => combat.shake, set: v => { combat.shake = Math.max(combat.shake, Math.min(v, 2)); } });
      scope.fx = { push: effect => { effect.sourceActor = a; return combat.fx.push(effect); } };
      scope.fields = { push: field => { field.sourceActor = a; return combat.fields.push(field); } };
      scope.ghosts = { push: () => {} }; // Do not draw the main hero as an ally after-image.
      scope.updateHud = () => {};
      scope.tone = (...args) => combat.tone(...args);
      scope.textFloat = (...args) => combat.textFloat(...args);
      scope.burst = (...args) => combat.burst(...args);
      scope.healInArea = (...args) => combat.healInArea(...args);
      scope.schedule = (delay, fn) => combat.schedule(delay, () => { if (alive()) fn(); });
      scope.damageEnemy = (e, amount, opt = {}) => combat.damageEnemy(e, amount, attribution(opt));
      scope.emitSword = (move, opt = {}) => combat.swordFx?.emit(a.heroId, move, { x:a.x, y:a.y, angle:a.dir, hand:equipment.hand, equipment:equipment.type, learned:ready, ...opt, owner:a });
      scope.playerBolt = (x,y,angle,speed,damage,r,color,pierce,life,opt={}) => combat.playerBolt(x,y,angle,speed,damage,r,color,pierce,life,attribution(opt));
      scope.nearest = range => combat.qinTargets(a.x,a.y,range)[0] || null;
      scope.startDash = (angle,speed,duration,damage) => { a.dash = { vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed, t:duration, max:duration, damage, hits:new Set() }; };
      return scope;
    }
    companionSkill(a) {
      if (this.actionsLocked() || a.dead || a.removed || a.hp <= 0 || a.dash) return false;
      const equipment=a.combatEquipment, ss=equipment.swordState, ready=equipment.type==='sword' || a.heroId==='sali' && equipment.type==='plain' && ss.status==='training' && ss.ultimateUnlocked===true;
      const fireReady=a.heroId==='hongmao' && ready && ss.ultimateUnlocked===true;
      let tier = fireReady && a.energy>=100 && a.fireCd<=0 ? 'f' : (!fireReady || a.fireCd>0) && a.energy >= (a.heroId==='hongmao'?50:100) && a.ultCd<=0 ? 'e' : a.skillCd<=0 ? 'q' : null;
      if (!tier) return false;
      const scope=this.companionSkillScope(a,tier);
      a.skillCasts[tier]++; a.attackCd=Math.max(a.attackCd,.5);
      if (tier==='q') { a.skillCd=SKILLS[a.heroId].cd*clamp(num(a.skillCooldownRate,1),.55,1); a.cast=.64; a.castMax=a.cast; scope.performSwordSkill(); }
      else if (tier==='e') { a.energy-=a.heroId==='hongmao'?50:100; a.ultCd=a.heroId==='hongmao'?CHANGHONG.cd:8; a.cast=a.heroId==='hongmao'?.96:1.8; a.castMax=a.cast; scope.performSwordUlt(); }
      else { a.energy-=100; a.fireCd=FIREWHIRL.cd; a.cast=2.5; a.castMax=a.cast; scope.performSwordFinisher(); }
      return true;
    }
    companionAttack(a) {
      if (this.actionsLocked() || a.dead || a.hp <= 0) return;
      const range = a.heroId === 'daben' ? 137 : 119, half = 1.22, equipment = a.combatEquipment;
      a.attackCd = a.heroId === 'daben' ? 1.05 : a.heroId === 'sali' ? .76 : .86; a.swing = .25; a.combo++;
      if (this.swordFx) this.swordFx.emit(a.heroId, 'attack', { x: a.x, y: a.y, angle: a.dir, radius: range, half, combo: a.combo, duration: .27, follow: false, equipment: equipment.type, hand: equipment.hand, learned: equipment.type === 'sword', owner: a });
      const targets = this.enemies.filter(e => !e.dead && e.spawn <= 0 && hypot(e.x - a.x, e.y - a.y) < range + e.r && (Math.abs(angleDiff(Math.atan2(e.y - a.y, e.x - a.x), a.dir)) < half || hypot(e.x - a.x, e.y - a.y) < 38)).sort((e, f) => hypot(e.x - a.x, e.y - a.y) - hypot(f.x - a.x, f.y - a.y)).slice(0, 3);
      let actual = 0;
      for (const e of targets) {
        const before = e.hp; this.damageEnemy(e, a.attack * .8, { sourceActor: a, charge: false, quiet: true, periodic: true, fieldKind: 'companion' });
        actual += Math.max(0, before - Math.max(0, e.hp));
        if (a.heroId === 'lantu') { e.slow = Math.max(e.slow, .8); e.slowFactor = Math.min(e.slowFactor, .8); }
      }
      if (actual > 0 && a.heroId === 'doudou' && a.healCd <= 0) { this.healInArea(a.x, a.y, 180, .006); a.healCd = .9; }
    }
    damageCompanion(a, amount, x, y, high = false) {
      if (!this.companions.includes(a) || a.dead || a.removed || a.hp <= 0 || a.invuln > 0 || this.actionsLocked()) return false;
      const actual = Math.min(a.hp, Math.max(1, amount * (a.heroId === 'daben' ? .85 : 1) * (a.armor > 0 ? .55 : 1)));
      a.hp -= actual; a.hit = .3; a.invuln = .4; this.companionDamageTaken += actual;
      this.textFloat(`−${Math.round(actual)}`, a.x, a.y, '#ffd0aa', 14, .7, 83);
      const angle = Math.atan2(a.y - y, a.x - x), push = high ? 19 : 9;
      a.x = clamp(a.x + Math.cos(angle) * push, 43, this.arenaWidth - 43); a.y = clamp(a.y + Math.sin(angle) * push, 86, this.arenaHeight - 48);
      if (a.hp <= 0) { this.knockOutCompanion(a); this.textFloat(`${a.name} 暂歇`, a.x, a.y, '#e2d5b4', 14, 1.3, 107); }
      return true;
    }
    enemyTarget(e) {
      // Boss choreography keeps its selected-player focus; its area and
      // projectile damage still strikes companions standing in danger.
      let target = this.p, distance = hypot(e.x - this.p.x, e.y - this.p.y);
      if (!e.boss) for (const a of this.livingCompanions()) { const d = hypot(e.x - a.x, e.y - a.y); if (d < distance) { target = a; distance = d; } }
      return target;
    }
    getHealingTargets() {
      const live = typeof this.opts.getAllies === 'function' ? this.opts.getAllies() : [];
      const candidates = [this.p, ...(Array.isArray(live) ? live : []), ...this.allies], seen = new Set(), ids = new Set();
      return candidates.filter(a => {
        if (!a || seen.has(a) || a.id != null && ids.has(a.id)) return false;
        // A missing team is valid only for explicitly supplied allied actors.
        if (a !== this.p && (this.enemies.includes(a) || a.team != null && !['player', 'ally', 'friendly'].includes(a.team))) return false;
        if (a.dead || a.removed || a.spawn > 0 || !Number.isFinite(a.x) || !Number.isFinite(a.y) || !Number.isFinite(a.hp) || !Number.isFinite(a.maxHp) || a.hp <= 0 || a.maxHp <= 0) return false;
        // Only valid recipients reserve an ID. A removed/dead snapshot must not
        // suppress the live actor returned by a party's current-state getter.
        seen.add(a); if (a.id != null) ids.add(a.id);
        return true;
      });
    }
    healInArea(x, y, radius, rate, flat = 0, { show = true, pulse = true } = {}) {
      let restored = 0;
      for (const a of this.getHealingTargets()) if (hypot(a.x - x, a.y - y) <= radius) {
        const n = this.healTarget(a, a.maxHp * Math.max(0, num(rate, 0)) + Math.max(0, num(flat, 0)), show, true);
        restored += n;
        if (n > 0 && pulse) this.fx.push({ type: 'healPulse', x: a.x, y: a.y, range: 28, color: '#a5e8b7', life: .52, max: .52 });
      }
      return restored;
    }

    arcDamage(x, y, angle, range, half, amount, options = {}) { this.enemies.forEach(e => { if (!e.dead && e.spawn <= 0 && hypot(e.x - x, e.y - y) < range + e.r && (Math.abs(angleDiff(Math.atan2(e.y - y, e.x - x), angle)) < half || hypot(e.x - x, e.y - y) < 45)) this.damageEnemy(e, amount, options); }); }
    radial(x, y, radius, amount, options = {}) { this.enemies.forEach(e => { if (!e.dead && e.spawn <= 0 && hypot(e.x - x, e.y - y) < radius + e.r) this.damageEnemy(e, amount, options); }); }
    applyDot(e, type, dps, duration, charge = true, sourceActor = null, earnEnergy = true) { if (!e[type] || e[type].dps <= dps) e[type] = { dps, remaining: duration, tick: .5, charge, sourceActor, earnEnergy }; else e[type].remaining = Math.max(e[type].remaining, duration); }
    damageEnemy(e, amount, opt = {}) {
      if (e.dead || e.waiting || e.spawn > 0 || this.finale && (this.finale.active || this.finale.complete)) return 0;
      if (e.kind === 'dummy' && !e.dojoDummy) { if (opt.quiet || this.time - (e.lastTrainingHit || -9) < .06) return; e.lastTrainingHit = this.time; this.trainingHits++; amount = 1; }
      amount = Math.max(1, amount);
      if (this.finale && e === this.boss) amount = this.finale.guardBossDamage(e, amount);
      if (!Number.isFinite(amount) || amount <= 0) return 0;
      const actual = Math.min(e.hp, amount); e.hp -= amount; e.hit = .13;
      this.damageDealt += actual;
      if (opt.sourceActor) { this.companionDamage += actual; if (!opt.sourceActor.dead && !opt.sourceActor.removed && opt.sourceActor.hp > 0 && opt.earnEnergy !== false) opt.sourceActor.energy = Math.min(100, opt.sourceActor.energy + actual / (405 + this.level * 16) * 100); }
      if (this.dojo) { this.dojoHits++; this.dojoCombo = this.time <= this.dojoComboUntil ? this.dojoCombo + 1 : 1; this.dojoComboUntil = this.time + 3.2; this.dojoMaxCombo = Math.max(this.dojoMaxCombo, this.dojoCombo); }
      if (opt.charge !== false) this.p.energy = Math.min(100, this.p.energy + actual / (405 + this.level * 16) * 100);
      if (opt.knock && !e.boss && !e.dojoDummy) { const a = Math.atan2(e.y - (opt.sourceActor || this.p).y, e.x - (opt.sourceActor || this.p).x); e.kx += Math.cos(a) * opt.knock * 5; e.ky += Math.sin(a) * opt.knock * 5; }
      if (opt.stun) e.stun = Math.max(e.stun, e.boss ? Math.min(.16, opt.stun * .2) : opt.stun);
      if (opt.slow) { e.slow = Math.max(e.slow, opt.slow); e.slowFactor = Math.min(e.slowFactor, opt.slowFactor || .5); }
      if (opt.burn) this.applyDot(e, 'burn', opt.burn, opt.burnDuration || 4, opt.charge !== false, opt.sourceActor, opt.earnEnergy);
      if (opt.poison) this.applyDot(e, 'poison', opt.poison, opt.poisonDuration || 5, opt.charge !== false, opt.sourceActor, opt.earnEnergy);
      if (opt.periodic) {
        const color = opt.fieldKind === 'ice' ? '#c2f4ff' : opt.fieldKind === 'rain' ? '#f1e6b7' : '#d9f2cd';
        this.textFloat(String(Math.round(amount)), e.x + 9, e.y, color, 12, .46, e.boss ? 108 : 76);
        // Two small sparks per target keep every tick readable without covering
        // a dense pack with the five-particle burst used by direct sword hits.
        this.burst(e.x, e.y, color, 2, 58);
      } else if (!opt.quiet) { this.textFloat(String(Math.round(amount)), e.x + (Math.random() - .5) * 18, e.y, opt.crit ? '#ffeb9d' : '#fff2d1', opt.crit ? 23 : 15, .65, e.boss ? 106 : 75); this.burst(e.x, e.y, this.color, 5, 105); }
      if (e.hp <= 0) {
        e.dead = true; e.deathTime = this.time; this.kills++;
        if(!this.actionsLocked()&&!this.training&&!this.dojo&&!this.tower&&!this.enc.readOnlyReplay&&!this.enc.preview&&!e.boss&&!e.dojoDummy&&e.kind!=='dummy'&&typeof this.opts.onLoot==='function'){
          const drop=this.opts.onLoot(e);if(drop?.overflow)this.textFloat(drop.name+'已满',e.x,e.y,'#d8cfaa',14,1.2,105);
          else if(drop?.quantity>0){this.loot[drop.id]=(this.loot[drop.id]||0)+drop.quantity;this.supplyStock[drop.id]=(this.supplyStock[drop.id]||0)+drop.quantity;this.textFloat(drop.name+' +'+drop.quantity,e.x,e.y,drop.rarity==='rare'?'#ffda7a':'#bde3a1',17,1.8,105);this.updateHud(true);}
        }
        if (e.dojoDummy) this.dojoRespawns.push({ slot: e.dojoSlot, at: this.time + .85 });
        this.checkAwakening();
        this.streak = this.time < this.streakUntil ? this.streak + 1 : 1; this.streakUntil = this.time + 3.2; this.streakMax = Math.max(this.streakMax, this.streak);
        this.burst(e.x, e.y, e.boss ? '#f5d290' : '#d7d7a8', e.boss ? 30 : 8, e.boss ? 235 : 120);
        if (e.boss) { this.shake = 4.5; this.flash = .08; this.toast(`${this.enc.boss.name} 已败 · 清除余敌`, 2); this.bolts = this.bolts.filter(b => b.team === 'player'); }
      }
    }
    damagePlayer(amount, x, y, high = false) {
      const p = this.p; if (this.dojo) p.hp = clamp(p.hp, 1, p.maxHp);
      if (p.invuln > 0 || p.hp <= 0 || this.ended || this.finale && this.finale.active) return false;
      const reduction = (this.hero.id === 'daben' ? .85 : 1) * (p.armor > 0 ? .55 : 1) * (this.supplyBuffs.guard>0?.7:1);
      const n = Math.max(1, amount * reduction), before = p.hp; p.hp = Math.max(this.dojo ? 1 : 0, p.hp - n); p.hit = .3; p.invuln = .4; this.shake = Math.max(this.shake, high ? 5 : 2.8); this.tone('hurt');
      const actual = before - p.hp; this.damageTaken += this.dojo ? actual : n;
      if (!this.dojo || actual > .001) this.textFloat(`−${Math.round(this.dojo ? actual : n)}`, p.x, p.y, '#ffd0aa', 20, .9, 80);
      if (this.dojo && p.hp <= 1 && this.time - this.dojoFloorNoticeAt >= 1.4) { this.dojoFloorNoticeAt = this.time; this.textFloat('护心 · 最低留 1 点', p.x, p.y, '#e7ebbf', 15, .85, 104); }
      this.burst(p.x, p.y, '#ffe2b8', 9, 100);
      const a = Math.atan2(p.y - y, p.x - x); p.x = clamp(p.x + Math.cos(a) * (high ? 28 : 13), 43, this.arenaWidth - 43); p.y = clamp(p.y + Math.sin(a) * (high ? 28 : 13), 86, this.arenaHeight - 48);
      if (!this.dojo && p.hp <= 0) this.finish(false, false);
      return true;
    }

    spawnGroup(n) { const limit=this.tower?(this.tower.ends?.[this.towerWave||0]||this.tower.quota):this.storyWaves?this.storyWaves.ends[this.storyWaves.index]:this.total; for (let i = 0; i < n && this.spawned < limit; i++) this.spawnEnemy(); }
    spawnEnemy() {
      const slot = this.spawned, side = (slot * 3 + this.wave) % 4;
      let x = side === 0 ? 67 : side === 1 ? 895 : 115 + this.random() * 730, y = side === 2 ? 100 : side === 3 ? 527 : 130 + this.random() * 330;
      if (hypot(x - this.p.x, y - this.p.y) < 190) { x = this.p.x < 480 ? 865 : 95; y = this.p.y < 300 ? 495 : 115; }
      if (this.tower) {
        const a = side * Math.PI / 2 + (this.random() - .5) * .7, radius = 400 + this.random() * 180;
        x = clamp(this.p.x + Math.cos(a) * radius, 80, this.arenaWidth - 80); y = clamp(this.p.y + Math.sin(a) * radius, 110, this.arenaHeight - 80);
        if (hypot(x - this.p.x, y - this.p.y) < 240) { x = this.p.x < this.arenaWidth / 2 ? this.p.x + 370 : this.p.x - 370; y = clamp(this.p.y, 110, this.arenaHeight - 80); }
      }
      let kind = 'grunt';
      if (slot % 4 === 3) kind = 'archer';
      if (this.danger >= 3 && slot % 6 === 4) kind = 'heavy';
      if (this.danger >= 5 && slot % 7 === 5) kind = 'assassin';
      if(this.storyWaves){const phase=this.storyWaves.names[this.storyWaves.index];if(phase==='弓阵夹击'&&slot%3===1)kind='archer';if(phase==='重甲压进'&&this.danger>=3&&slot%4===2)kind='heavy';if(phase==='突袭合围'&&this.danger>=5&&slot%4===2)kind='assassin';}
      const w=this.storyWaves, waveStart=w?(w.index?w.ends[w.index-1]:(this.enc.boss?1:0)):0;
      const captain=!!w&&slot-waveStart>=w.ordinaryBudgets[w.index];
      const rank=captain?Math.min(3,1+(Number(this.enc.storyChapter.slice(-2))>=6?1:0)+(w.index>=3?1:0)):0;
      const captainType=captain?['heavy','archer','assassin'][(w.index+slot-waveStart-w.ordinaryBudgets[w.index]-1)%3]:null;
      if(captain)kind=captainType;
      const hpScale = kind === 'heavy' ? 1.85 : kind === 'assassin' ? 1.15 : kind === 'archer' ? .76 : 1;
      const hp = (40 + this.danger * 10) * (captain ? 2.8 + rank * .45 : hpScale) * this.dm.hp * this.enemyHpMultiplier;
      const damage = (5.5 + this.danger * 1.75) * this.dm.damage * (captain ? 1.2 + rank * .15 : kind === 'heavy' ? 1.4 : 1) * this.enemyDamageMultiplier;
      this.enemies.push({ id: ++this.uid, x, y, r: captain ? 29 : kind === 'heavy' ? 25 : 19, captain, storyWaveIndex:w?w.index:null, captainRank:rank, captainName:captain?({heavy:'铁甲头目',archer:'连弩头目',assassin:'突袭头目'})[kind]:null, pattern:0, kind, hp, maxHp: hp, damage, speed: (kind === 'heavy' ? 72 : kind === 'archer' ? 91 : kind === 'assassin' ? 137 : 101) * this.dm.speed, dir: Math.atan2(this.p.y - y, this.p.x - x), kx: 0, ky: 0, cooldown: .8 + this.random() * .8, action: 0, spawn: .7, hit: 0, stun: 0, slow: 0, slowFactor: 1, seed: this.random() * 10, dead: false, boss: false });
      if(this.tower){const e=this.enemies[this.enemies.length-1];e.towerFamily=this.tower.family;const skin=window.TowerArt?.skinFor?.(this.tower.family,this.tower.floor,slot);if(skin){e.towerSkin=skin.id;e.towerSpecies=skin.name;}e.hp*=this.tower.hpScale;e.damage*=this.tower.damageScale;
        if(slot>0&&slot%this.tower.eliteEvery===0){e.captain=true;e.captainRank=1;e.captainName=(e.towerSpecies||this.tower.label)+'头目';e.hp*=2.2;e.damage*=1.2;e.r=29;}e.maxHp=e.hp;}
      if(captain)this.textFloat('小头目 · '+this.enemies[this.enemies.length-1].captainName,x,y,'#f5c66c',16,1.5,115);
      this.spawned++; this.fx.push({ type: 'spawn', x, y, life: .7, max: .7, color: '#bccbb0' });
    }
    spawnBoss() {
      const hp = (this.enc.boss.kind === 'blackheart' || this.enc.boss.name === '黑心虎' ? 1580 + this.danger * 840 : 710 + this.danger * 235) * this.dm.hp * this.enemyHpMultiplier;
      this.boss = { id: ++this.uid, x: 480, y: 170, r: 38, kind: this.enc.boss.kind || (this.enc.boss.name === '黑心虎' ? 'blackheart' : 'tiger'), hp, maxHp: hp, damage: (10 + this.danger * 2.3) * this.dm.damage * this.enemyDamageMultiplier, speed: (this.enc.boss.kind === 'assassin' ? 123 : 92) * this.dm.speed, dir: Math.PI / 2, kx: 0, ky: 0, cooldown: 1.2, action: 0, spawn: .8, hit: 0, stun: 0, slow: 0, slowFactor: 1, seed: 5, dead: false, boss: true, pattern: 0, phase: 1 };
      if(this.tower){this.boss.x=this.arenaWidth/2;this.boss.y=this.arenaHeight/2-120;this.boss.towerFamily=this.tower.family;this.boss.mythicId=this.tower.mythicId||null;this.boss.hp*=this.tower.hpScale;this.boss.maxHp=this.boss.hp;this.boss.damage*=this.tower.damageScale;}
      this.boss.waiting=!!this.storyWaves&&this.storyWaves.count>1;
      if(this.boss.waiting){this.boss.x=865;this.boss.y=96;this.boss.spawn=0;}else this.enemies.push(this.boss); this.spawned++; this.fx.push({ type: 'spawn', x: this.boss.x, y: this.boss.y, life: 1, max: 1, color: '#e0bc98' });
    }
    spawnTrainingTarget() {
      const hp = Math.round(clamp(num(this.training.goalHits, 12), 3, 60)); this.training.goalHits = hp;
      this.enemies.push({ id: ++this.uid, x: 490, y: 287, r: 25, kind: 'dummy', hp, maxHp: hp, damage: 0, speed: 0, dir: Math.PI / 2, kx: 0, ky: 0, cooldown: 999, action: 0, spawn: .45, hit: 0, stun: 0, slow: 0, slowFactor: 1, seed: 4, dead: false, boss: false }); this.spawned++;
    }

    updateEnemy(e, dt) {
      if (e.dead || e.waiting) return;
      e.spawn = Math.max(0, e.spawn - dt); e.hit = Math.max(0, e.hit - dt); e.stun = Math.max(0, e.stun - dt); e.slow = Math.max(0, e.slow - dt); if (e.slow <= 0) e.slowFactor = 1;
      if (e.kind === 'dummy' && !e.dojoDummy) return;
      e.cooldown -= dt; e.action = Math.max(0, e.action - dt);
      for (const dot of ['burn', 'poison']) if (e[dot]) { e[dot].remaining -= dt; e[dot].tick -= dt; if (e[dot].tick <= 0) { e[dot].tick += .5; this.damageEnemy(e, e[dot].dps * .5, { quiet: true, charge: e[dot].charge, sourceActor: e[dot].sourceActor, earnEnergy: e[dot].earnEnergy }); if (!e.dead) this.textFloat(String(Math.max(1, Math.round(e[dot].dps * .5))), e.x + 10, e.y, dot === 'burn' ? '#ffcd8d' : '#c5e7a5', 11, .5, e.boss ? 98 : 68); } if (e[dot] && e[dot].remaining <= 0) e[dot] = null; }
      if (e.dojoDummy) { e.kx = 0; e.ky = 0; return; }
      if (e.dead || e.spawn > 0) return;
      e.x += e.kx * dt; e.y += e.ky * dt; e.kx *= Math.exp(-dt * 15); e.ky *= Math.exp(-dt * 15);
      const target = this.enemyTarget(e), dx = target.x - e.x, dy = target.y - e.y, d = hypot(dx, dy) || 1;
      if (e.action <= 0) e.dir = Math.atan2(dy, dx);
      if (e.boss) { const phase = e.hp < e.maxHp * (e.mythicId ? .35 : .3) ? 3 : e.hp < e.maxHp * (e.mythicId ? .7 : .65) ? 2 : 1; if (phase > e.phase) { e.phase = phase; this.toast(`${this.enc.boss.name} · 第${phase === 2 ? '二' : '三'}式`, 2); this.ring(e.x, e.y, 140, '#d9a796', .6); e.cooldown = Math.min(e.cooldown, .45); } }
      if (e.stun <= 0 && e.action <= 0) {
        let mx = 0, my = 0;
        if (e.kind === 'archer' && !e.boss) { const desired = 235; const direction = d > desired + 35 ? 1 : d < desired - 55 ? -.8 : 0; mx = dx / d * direction + -dy / d * .23 * (e.id % 2 ? 1 : -1); my = dy / d * direction + dx / d * .23 * (e.id % 2 ? 1 : -1); }
        else if (d > (e.boss ? 105 : e.kind === 'heavy' ? 65 : 56)) { mx = dx / d; my = dy / d; }
        for (const other of this.neighbors(e.x, e.y)) { if (other === e || other.dead) continue; const sx = e.x - other.x, sy = e.y - other.y, sd = hypot(sx, sy) || .1, min = e.r + other.r + 7; if (sd < min) { mx += sx / sd * (min - sd) / min * 1.8; my += sy / sd * (min - sd) / min * 1.8; } }
        const md = hypot(mx, my); if (md > 1) { mx /= md; my /= md; }
        const slow = e.boss ? Math.max(.62, e.slowFactor) : e.slowFactor;
        e.x += mx * e.speed * slow * dt; e.y += my * e.speed * slow * dt;
        if (e.cooldown <= 0) {
          if (e.boss) this.bossAttack(e);
          else if (e.captain && d < (e.kind === 'archer' ? 470 : e.kind === 'assassin' ? 340 : 155)) this.captainAttack(e);
          else if (e.kind === 'archer' && d < 470) this.archerAttack(e);
          else if (e.kind === 'assassin' && d > 105 && d < 330) this.assassinAttack(e);
          else if (d < (e.kind === 'heavy' ? 110 : 90)) this.meleeAttack(e);
        }
      }
      e.x = clamp(e.x, 38, this.arenaWidth - 38); e.y = clamp(e.y, 78, this.arenaHeight - 48);
    }

    hazard(h) { this.hazards.push(Object.assign({ elapsed: 0, delay: .65, linger: .25, damage: 10, high: false, triggered: false, cancelOnDeath: true }, h)); }
    meleeAttack(e) {
      const heavy = e.kind === 'heavy'; e.action = heavy ? 1.0 : .67; e.cooldown = heavy ? 2.2 : 1.55 + Math.random() * .35;
      this.hazard({ kind: heavy ? 'circle' : 'cone', x: e.x, y: e.y, r: 88, range: 95, half: .92, angle: e.dir, delay: heavy ? .86 : .53, owner: e, damage: e.damage, high: heavy });
    }
    archerAttack(e) {
      e.action = .52; e.cooldown = 2.5 - this.danger * .065; const a = e.dir;
      this.fx.push({ type: 'charge', x: e.x, y: e.y, z: 40, life: .44, max: .44, color: '#f1cf87' });
      this.schedule(.42, () => { if (!e.dead) this.enemyBolt(e.x, e.y, a, 250 + this.danger * 8, e.damage, 6, '#f4d792', 3.4); });
    }
    assassinAttack(e) {
      e.action = 1.05; e.cooldown = 3.3;
      const end = { x: clamp(e.x + Math.cos(e.dir) * 230, 50, this.arenaWidth - 50), y: clamp(e.y + Math.sin(e.dir) * 230, 90, this.arenaHeight - 65) };
      this.hazard({ kind: 'line', x: e.x, y: e.y, x2: end.x, y2: end.y, width: 44, delay: .75, owner: e, damage: e.damage * 1.25, high: true, dash: true });
    }
    captainAttack(e) {
      // Separate readable patterns, below a real boss in reach and damage.
      // All tells are anchored before firing and cancel when their owner dies.
      e.action=1.3;e.cooldown=3.5-e.captainRank*.15;e.pattern++;
      this.textFloat(e.kind==='heavy'?'震地二连':e.kind==='archer'?'三箭齐射':'突进追击',e.x,e.y,'#f5c66c',14,1.1,112);
      const a=e.dir;
      if(e.kind==='heavy') {
        this.hazard({kind:'cone',x:e.x,y:e.y,angle:a,range:135,half:1.05,delay:.8,owner:e,damage:e.damage,high:true});
        this.schedule(.85,()=>{if(!e.dead)this.hazard({kind:'circle',x:e.x,y:e.y,r:108,delay:.65,owner:e,damage:e.damage*.65,high:true});});
        e.action=1.55;
      } else if(e.kind==='archer') {
        this.fx.push({type:'charge',x:e.x,y:e.y,z:65,life:.85,max:.85,color:'#f5c66c'});
        this.schedule(.85,()=>{if(!e.dead)for(let i=-1;i<=1;i++)this.enemyBolt(e.x,e.y,a+i*.21,255+this.danger*6,e.damage*.8,7,'#f5c66c',3.4);});
      } else {
        const x2=clamp(e.x+Math.cos(a)*260, 50, this.arenaWidth - 50),y2=clamp(e.y+Math.sin(a)*260, 90, this.arenaHeight - 65);
        this.hazard({kind:'line',x:e.x,y:e.y,x2,y2,width:52,delay:.9,owner:e,damage:e.damage,high:true,dash:true});
        this.schedule(.95,()=>{if(!e.dead)this.hazard({kind:'circle',x:x2,y:y2,r:75,delay:.65,owner:e,damage:e.damage*.6});});
        e.action=1.65;
      }
    }

    bossAttack(e) {
      if(e.mythicId)return this.mythicBossAttack(e);
      if (e.kind === 'blackheart') return this.blackheartAttack(e);
      const phase = e.phase, pattern = e.pattern++ % 4, a = Math.atan2(this.p.y - e.y, this.p.x - e.x), kind = e.kind;
      e.dir = a; e.cooldown = (kind === 'assassin' ? 2.05 : 2.6) - phase * .15; e.action = .95;
      if ((kind === 'tiger' && pattern === 0) || (kind === 'boar' && pattern === 0) || (kind === 'assassin' && pattern === 3)) {
        e.action = 1.35;
        this.hazard({ kind: 'cone', x: e.x, y: e.y, angle: a - .12, range: kind === 'boar' ? 175 : 164, half: 1.12, delay: .67, owner: e, damage: e.damage, high: true });
        if (phase > 1 || kind === 'assassin') this.schedule(.55, () => { if (!e.dead) this.hazard({ kind: 'cone', x: e.x, y: e.y, angle: Math.atan2(this.p.y - e.y, this.p.x - e.x), range: 165, half: 1.2, delay: .55, owner: e, damage: e.damage * .9, high: true }); });
      } else if ((kind === 'tiger' && pattern === 1) || (kind === 'boar' && pattern === 3) || (kind === 'assassin' && pattern === 1)) {
        const range = kind === 'assassin' ? 380 : 320; const x2 = clamp(e.x + Math.cos(a) * range, 60, this.arenaWidth - 60), y2 = clamp(e.y + Math.sin(a) * range, 90, this.arenaHeight - 65);
        this.hazard({ kind: 'line', x: e.x, y: e.y, x2, y2, width: kind === 'boar' ? 92 : 70, delay: .87 - phase * .025, owner: e, damage: e.damage * 1.35, high: true, dash: true });
        e.action = 1.2;
        if (phase === 3) this.schedule(.8, () => { if (!e.dead) this.hazard({ kind: 'circle', x: x2, y: y2, r: 100, delay: .6, damage: e.damage * .9, owner: e, high: true }); });
      } else if ((kind === 'tiger' && pattern === 2) || (kind === 'boar' && pattern === 2)) {
        const r = kind === 'boar' ? 175 : 205;
        this.hazard({ kind: 'circle', x: e.x, y: e.y, r, delay: .95, owner: e, damage: e.damage * 1.15, high: true }); e.action = 1.2;
        this.schedule(.97, () => { if (!e.dead) { this.shake = 6; if (kind === 'boar') this.fields.push({ team: 'enemy', kind: 'poison', x: e.x, y: e.y, r: 110, life: 5.5, max: 5.5, tick: .75, interval: .8, damage: e.damage * .42, color: '#99b575' }); else for (let i = 0; i < 6 + phase * 2; i++) this.enemyBolt(e.x, e.y, a + i * TAU / (6 + phase * 2), 160 + phase * 20, e.damage * .65, 8, '#e9bd82', 4); } });
      } else if ((kind === 'boar' && pattern === 1) || (kind === 'assassin' && pattern === 0)) {
        e.action = .9; this.fx.push({ type: 'charge', x: e.x, y: e.y, z: 64, life: .6, max: .6, color: kind === 'boar' ? '#b9da8b' : '#d7b5f3' });
        this.schedule(.58, () => { if (!e.dead) for (let i = -phase; i <= phase; i++) this.enemyBolt(e.x, e.y, a + i * .19, kind === 'assassin' ? 295 : 220, e.damage * .7, kind === 'boar' ? 11 : 7, kind === 'boar' ? '#bdd98d' : '#d9bdef', 4); });
      } else {
        e.action = 1.25; const count = 2 + phase;
        for (let i = 0; i < count; i++) this.schedule(i * .21, () => { if (!e.dead) { const radius = i ? 35 + i * 18 : 0, ang = i * 2.4; this.hazard({ kind: 'circle', x: clamp(this.p.x + Math.cos(ang) * radius, 70, this.arenaWidth - 70), y: clamp(this.p.y + Math.sin(ang) * radius, 100, this.arenaHeight - 70), r: kind === 'assassin' ? 66 : 83, delay: .85, owner: e, damage: e.damage * .9, high: true }); } });
      }
    }

    // Trial illusions: same HP/damage baseline as the existing tower guardian.
    // All positions lock when the tell appears; no unannounced homing or persistent damage.
    mythicBossAttack(e) { return window.MythicMechanics?.attack(this,e); }

    blackheartAttack(e) {
      const phase = e.phase, pattern = e.pattern++ % 4, a = Math.atan2(this.p.y - e.y, this.p.x - e.x);
      e.dir = a; e.cooldown = 2.65 - phase * .22; e.action = .95;
      if (pattern === 0) {
        this.hazard({ kind: 'cone', x: e.x, y: e.y, angle: a, range: 222, half: 1.16, delay: .78, owner: e, damage: e.damage * 1.2, high: true, palm: true });
        if (phase >= 2) this.schedule(.62, () => { if (!e.dead) this.hazard({ kind: 'cone', x: e.x, y: e.y, angle: Math.atan2(this.p.y - e.y, this.p.x - e.x), range: 245, half: .93, delay: .64, owner: e, damage: e.damage, high: true, palm: true }); });
      } else if (pattern === 1) {
        e.action = 1.4; const count = 5 + phase * 2;
        this.fx.push({ type: 'charge', x: e.x, y: e.y, z: 70, life: .62, max: .62, color: '#d7a1c0' });
        this.schedule(.62, () => { if (!e.dead) for (let k = 0; k < count; k++) { const angle = a + (k - (count - 1) / 2) * .16; const bolt = this.enemyBolt(e.x, e.y, angle, 205 + phase * 18, e.damage * .75, 14, '#d9b5cd', 4.5); bolt.palm = true; } });
      } else if (pattern === 2) {
        const tx = clamp(this.p.x, 95, 865), ty = clamp(this.p.y, 125, 510), count = 2 + phase;
        for (let k = 0; k < count; k++) this.schedule(k * .2, () => { if (!e.dead) { const ang = k * 2.399, rad = k ? 65 + k * 17 : 0; this.hazard({ kind: 'circle', x: clamp(tx + Math.cos(ang) * rad, 75, this.arenaWidth - 75), y: clamp(ty + Math.sin(ang) * rad, 100, this.arenaHeight - 70), r: 65 + phase * 4, delay: .82, owner: e, damage: e.damage, high: true, palm: true }); } });
      } else {
        e.action = 1.3;
        for (let k = -1; k <= 1; k++) { const ang = a + k * .65, x2 = clamp(e.x + Math.cos(ang) * 390, 60, this.arenaWidth - 60), y2 = clamp(e.y + Math.sin(ang) * 390, 90, this.arenaHeight - 70); this.hazard({ kind: 'line', x: e.x, y: e.y, x2, y2, width: 58 + phase * 6, delay: .86, owner: e, damage: e.damage * 1.1, high: true, palm: true }); }
        if (phase === 3) this.schedule(1.0, () => { if (!e.dead) this.hazard({ kind: 'circle', x: e.x, y: e.y, r: 205, delay: .75, damage: e.damage * .85, owner: e, high: true, palm: true }); });
      }
    }

    updateHazards(dt) {
      this.hazards.forEach(h => {
        if (h.cancelOnDeath && h.owner && h.owner.dead && !h.triggered) { h.dead = true; return; }
        h.elapsed += dt;
        if (h.elapsed >= h.delay && !h.triggered) {
          h.triggered = true;
          for (const a of [this.p, ...this.livingCompanions()]) {
            let hit = false;
            if (h.kind === 'annulus') { const d=hypot(a.x-h.x,a.y-h.y); hit=d<h.r+a.r*.6 && d>h.inner-a.r*.6; }
            if (h.kind === 'circle') hit = hypot(a.x - h.x, a.y - h.y) < h.r + a.r * .6;
            if (h.kind === 'cone') { const d = hypot(a.x - h.x, a.y - h.y); hit = d < h.range + a.r && (Math.abs(angleDiff(Math.atan2(a.y - h.y, a.x - h.x), h.angle)) < h.half + .07 || d < 30); }
            if (h.kind === 'line') hit = this.segmentDistance(a.x, a.y, h.x, h.y, h.x2, h.y2) < h.width / 2 + a.r * .65;
            if (hit) { if (a === this.p) this.damagePlayer(h.damage, h.x, h.y, h.high); else this.damageCompanion(a, h.damage, h.x, h.y, h.high); }
          }
          if (h.palm) this.fx.push({ type: 'palm', x: h.kind === 'line' ? h.x2 : h.kind === 'cone' ? h.x + Math.cos(h.angle) * h.range * .55 : h.x, y: h.kind === 'line' ? h.y2 : h.kind === 'cone' ? h.y + Math.sin(h.angle) * h.range * .55 : h.y, z: 36, angle: h.angle || 0, life: .42, max: .42, color: '#d6a9c5', radius: h.kind === 'circle' ? h.r : 72 });
          if (h.kind === 'annulus') { this.ring(h.x,h.y,h.r,'#efb791',.35); this.ring(h.x,h.y,h.inner,'#efb791',.35); }
          if (h.kind === 'circle') { this.ring(h.x, h.y, h.r, h.high ? '#e7a47f' : '#efcf83', .3); this.burst(h.x, h.y, '#dabd8b', h.high ? 16 : 7, 170); }
          if (h.kind === 'cone') this.fx.push({ type: 'slash', x: h.x, y: h.y, range: h.range, angle: h.angle, half: h.half, color: h.high ? '#edb08b' : '#e7ca87', thick: h.high ? 9 : 5, life: .26, max: .26 });
          if (h.dash && h.owner && !h.owner.dead) { this.fx.push({ type: 'trail', x: h.x, y: h.y, x2: h.x2, y2: h.y2, width: h.width * .58, color: '#e2ac93', life: .35, max: .35 }); h.owner.x = h.x2; h.owner.y = h.y2; }
        }
      });
      this.hazards = this.hazards.filter(h => !h.dead && h.elapsed < h.delay + h.linger);
    }
    segmentDistance(px, py, x, y, x2, y2) { const dx = x2 - x, dy = y2 - y, len = dx * dx + dy * dy; const t = len ? clamp(((px - x) * dx + (py - y) * dy) / len, 0, 1) : 0; return hypot(px - x - dx * t, py - y - dy * t); }
    enemyBolt(x, y, angle, speed, damage, r, color, life) { const b = { team: 'enemy', x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, angle, damage, r, color, life, hit: new Set() }; this.bolts.push(b); return b; }
    playerBolt(x, y, angle, speed, damage, r, color, pierce, life, options = {}) { const b = Object.assign({ team: 'player', x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, angle, damage, r, color, life, pierce, hit: new Set() }, options); this.bolts.push(b); return b; }
    qinTargets(x, y, range, hit = new Set()) {
      return this.enemies.filter(e => !e.dead && e.hp > 0 && e.spawn <= 0 && !hit.has(e.id) && hypot(e.x - x, e.y - y) <= range)
        .sort((a, b) => hypot(a.x - x, a.y - y) - hypot(b.x - x, b.y - y) || a.id - b.id);
    }
    qinAim(x, y, target) {
      const lead = Math.min(QIN.maxLead, hypot(target.x - x, target.y - y) / QIN.speed);
      return Math.atan2(target.y + num(target.trackVy, 0) * lead - y, target.x + num(target.trackVx, 0) * lead - x);
    }
    fireQinVolley(power, castAngle) {
      const p = this.p, targets = this.qinTargets(p.x, p.y, QIN.range).slice(0, 3);
      for (let i = 0; i < 3; i++) {
        const target = targets.length ? targets[i % targets.length] : null, side = (i - 1) * 42;
        // These three ports sit at the visible qin's front rail. Each needle
        // leaves that rail in its own real target direction, not a fake fan.
        const x = clamp(p.x + Math.cos(castAngle) * 86 - Math.sin(castAngle) * side, 40, this.arenaWidth - 40);
        const y = clamp(p.y + Math.sin(castAngle) * 86 + Math.cos(castAngle) * side, 78, this.arenaHeight - 48);
        const a = target ? this.qinAim(x, y, target) : p.dir + (i - 1) * .11;
        this.playerBolt(x, y, a, QIN.speed, power * .48, 8, '#f2f4d4', QIN.pierce, QIN.life, { charge: false, needle: true, homing: true, target, height: 61, trail: [{ x, y }] });
      }
    }
    steerQin(b, dt) {
      const reach = Math.min(QIN.range, QIN.speed * Math.max(0, b.life));
      if (!b.target || b.target.dead || b.target.hp <= 0 || b.target.spawn > 0 || b.hit.has(b.target.id) || !this.enemies.includes(b.target) || hypot(b.target.x - b.x, b.target.y - b.y) > reach + b.target.r) {
        b.target = this.qinTargets(b.x, b.y, reach, b.hit)[0] || null;
      }
      if (b.target) {
        const desired = this.qinAim(b.x, b.y, b.target);
        b.angle += clamp(angleDiff(desired, b.angle), -QIN.turnRate * dt, QIN.turnRate * dt);
        b.vx = Math.cos(b.angle) * QIN.speed; b.vy = Math.sin(b.angle) * QIN.speed;
      }
      b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > 9) b.trail.shift();
    }
    updateBolts(dt) {
      for (const b of this.bolts) {
        b.life -= dt; if (b.homing) this.steerQin(b, dt);
        const ox = b.x, oy = b.y; b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.team === 'enemy') {
          // A travelling shot hits the first vulnerable friendly on its swept
          // segment. Standing behind a companion cannot cause a second hit.
          const targets = [this.p, ...this.livingCompanions()].filter(a => a.hp > 0 && a.invuln <= 0 && this.segmentDistance(a.x, a.y, ox, oy, b.x, b.y) < b.r + a.r * .8).sort((a, c) => ((a.x - ox) * b.vx + (a.y - oy) * b.vy) - ((c.x - ox) * b.vx + (c.y - oy) * b.vy));
          if (targets.length) { const a = targets[0]; if (a === this.p) this.damagePlayer(b.damage, ox - b.vx * .1, oy - b.vy * .1); else this.damageCompanion(a, b.damage, ox - b.vx * .1, oy - b.vy * .1); b.life = 0; }
        }
        else for (const e of this.enemies) { if (b.life <= 0) break; if (!e.dead && e.spawn <= 0 && !b.hit.has(e.id) && this.segmentDistance(e.x, e.y, ox, oy, b.x, b.y) < b.r + e.r) { b.hit.add(e.id); this.damageEnemy(e, b.damage, { knock: b.needle ? 3 : 12, sourceActor: b.sourceActor, earnEnergy: b.earnEnergy, charge: b.charge !== false, burn: b.burn, burnDuration: b.burnDuration }); b.pierce--; if (b.pierce <= 0) b.life = 0; } }
        if (b.x < -40 || b.x > this.arenaWidth + 40 || b.y < 25 || b.y > this.arenaHeight + 30) b.life = 0;
      }
      this.bolts = this.bolts.filter(b => b.life > 0);
    }
    updateFields(dt) {
      this.fields.forEach(f => {
        if(f.life<=0) return;
        const activeDt = Math.min(dt, Math.max(0, f.life)); f.life -= dt;
        if (f.sourceActor && (f.sourceActor.dead || f.sourceActor.removed || f.sourceActor.hp <= 0 || !this.companions.includes(f.sourceActor))) { f.life = 0; return; }
        if (f.follow) { const owner = f.sourceActor || this.p; f.x = mix(f.x, owner.x, Math.min(1, dt * 9)); f.y = mix(f.y, owner.y, Math.min(1, dt * 9)); }
        if (f.team !== 'player') {
          // Keep the enemy's existing field timing and damage rules intact.
          f.tick -= dt;
          if (f.tick <= 0) { f.tick += f.interval; if (hypot(this.p.x - f.x, this.p.y - f.y) < f.r) this.damagePlayer(f.damage, f.x, f.y); for (const a of this.livingCompanions()) if (hypot(a.x - f.x, a.y - f.y) < f.r) this.damageCompanion(a, f.damage, f.x, f.y); }
          return;
        }
        f.tick -= activeDt;
        while (f.tick <= 1e-7 && f.ticksRemaining !== 0) {
          f.tick += f.interval;
          if (Number.isFinite(f.ticksRemaining)) f.ticksRemaining--;
          this.radial(f.x, f.y, f.r, f.damage, { slow: f.slow ? .9 : 0, slowFactor: f.slow || 1, knock: f.kind === 'wind' ? 5 : 0, sourceActor: f.sourceActor, earnEnergy: !f.ult, charge: !f.sourceActor && !f.ult, quiet: true, periodic: true, fieldKind: f.kind });
          this.fx.push({ type: 'fieldPulse', kind: f.kind, x: f.x, y: f.y, range: f.r, color: f.color, life: .3, max: .3 });
          if (f.healRate) this.healInArea(f.x, f.y, f.r, f.healRate);
        }
      }); this.fields = this.fields.filter(f => f.life > 0);
    }

    textFloat(text, x, y, color, size = 16, life = .85, z = 74) { if (this.floats.length > 43) this.floats.shift(); this.floats.push({ text, x, y, z, color, size, life, max: life, vx: (Math.random() - .5) * 12 }); }
    ring(x, y, r, color, life = .6) { this.fx.push({ type: 'ring', x, y, range: r, color, life, max: life }); }
    burst(x, y, color, count, speed) { const limit = this.reducedMotion ? Math.min(8, count) : count; for (let i = 0; i < limit && this.particles.length < 550; i++) { const a = Math.random() * TAU, s = speed * (.2 + Math.random() * .8), life = .2 + Math.random() * .4; this.particles.push({ x, y, z: 15 + Math.random() * 18, vz: 30 + Math.random() * 105, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 1.5 + Math.random() * 2.5, color, life, max: life, type: i % 3 ? 'spark' : 'glow' }); } }
    lightning(x, y) { for (let i = 0; i < 7; i++) this.fx.push({ type: 'lightning', x, y, angle: i * TAU / 7 + Math.random() * .4, range: 140 + Math.random() * 80, color: '#fff2bc', life: .32, max: .32, seed: Math.random() * 10 }); }
    updateEffects(dt) {
      if (this.swordFx) this.swordFx.update(dt);
      this.fx.forEach(f => { f.life -= dt; if (f.sourceActor && (f.sourceActor.dead || f.sourceActor.removed || f.sourceActor.hp <= 0 || !this.companions.includes(f.sourceActor))) { f.life = 0; return; } if (f.type === 'changhong' && !f.released) { f.x = (f.sourceActor || this.p).x; f.y = (f.sourceActor || this.p).y; } }); this.fx = this.fx.filter(f => f.life > 0);
      this.particles.forEach(p => { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z = Math.max(0, num(p.z, 16) + num(p.vz, 0) * dt); p.vz = num(p.vz, 0) - 150 * dt; p.vx *= Math.exp(-dt * 3); p.vy *= Math.exp(-dt * 3); }); this.particles = this.particles.filter(p => p.life > 0);
      this.floats.forEach(f => { f.life -= dt; f.z += dt * 40; f.x += f.vx * dt; }); this.floats = this.floats.filter(f => f.life > 0);
      this.ghosts.forEach(g => g.life -= dt); this.ghosts = this.ghosts.filter(g => g.life > 0);
    }

    updateHud(force = false) {
      if (force) this.paintDirty = true;
      this.lastHud = this.time; const p = this.p;
      const hp = clamp(num(p.hp, 0), 0, Math.max(1, p.maxHp));
      window.HealthOrb.update(this.ui.life, hp, p.maxHp);
      this.ui.hptext.textContent = `${Math.ceil(hp)} / ${Math.ceil(p.maxHp)}`;
      if (this.ui.life) {
        this.ui.life.setAttribute('aria-valuemax', String(p.maxHp));
        this.ui.life.setAttribute('aria-valuenow', String(hp));
        this.ui.life.setAttribute('aria-valuetext', `气血 ${Math.ceil(hp)} / ${Math.ceil(p.maxHp)}${this.dojo ? '，演武保底 1' : ''}`);
        this.ui.life.classList.toggle('is-critical', hp < p.maxHp * .3);
        this.ui.life.classList.toggle('is-empty', hp <= 0);
      }
      if (this.ui.upperHp) {
        this.ui.upperHp.style.width = `${hp / Math.max(1, p.maxHp) * 100}%`;
        this.ui.upperHp.style.background = hp < p.maxHp * .3 ? 'linear-gradient(90deg,#bb735b,#eba979)' : '';
      }
      if (this.ui.energytext) this.ui.energytext.textContent = `气血 ${Math.ceil(hp)}/${Math.ceil(p.maxHp)} · 剑意 ${Math.floor(p.energy)}%${this.dojo ? ' · 保底 1' : ''}`;
      if(this.ui.partyStatus) { this.ui.partyStatus.textContent=this.companionStatusText(); this.ui.partyStatus.hidden=!this.companions.length; }
      this.ui.energy.style.width = `${p.energy}%`;
      const remaining = this.enemies.filter(e => !e.dead).length;
      if(this.tower){const meter=this.root.querySelector('.tower-pressure');if(meter){meter.value=Math.min(100,this.kills/this.tower.quota*100);meter.setAttribute('aria-valuetext',this.boss?'守层者现身':this.kills+' / '+this.tower.quota);}}
      this.ui.progress.textContent = this.tower ? `无尽塔 ${this.tower.floor} 层 · ${this.tower.label} · 第 ${(this.towerWave||0)+1} / ${this.tower.waves||1} 波 · ${this.boss?'守层者现身':'肃清 '+Math.min(this.kills,this.tower.quota)+'/'+this.tower.quota} · 场上 ${remaining}` : this.dojo ? `${{ single: '单桩试剑', crowd: '密集桩阵', sparring: '实战陪练' }[this.dojo.targetMode]} · 命中 ${this.dojoHits} 次 · 场上 ${remaining}` : this.training ? `左手剑修习 · ${this.trainingHits} / ${this.training.goalHits} 次命中` : `${this.enc.preview ? '招式试演 · ' : ''}${this.storyWaves?'第 '+(this.storyWaves.index+1)+' / '+this.storyWaves.count+' 波 · '+this.storyWaves.names[this.storyWaves.index]+' · ':''}${this.enc.boss ? '首领战 · ' : ''}已击退 ${this.kills} / ${this.total} · 场上 ${remaining}`;
      this.ui.chain.hidden = this.streak < 3 || this.time > this.streakUntil; this.ui.chainCount.textContent = String(this.streak);
      this.ui.skill.textContent = p.skillCd > .05 ? p.skillCd.toFixed(1) : '';
      this.ui.dodge.textContent = p.dodgeCd > .05 ? p.dodgeCd.toFixed(1) : '';
      this.ui.ultFill.style.height = `${Math.min(100, p.energy / this.ultEnergyCost * 100)}%`;
      this.ui.ult.classList.toggle('ss-c-ready', !this.actionsLocked() && p.energy >= this.ultEnergyCost - .1 && p.ultCd <= .01);
      this.ui.ultCd.textContent = p.ultCd > .05 ? p.ultCd.toFixed(1) + 's' : p.energy < this.ultEnergyCost - .1 ? `${Math.floor(p.energy)} / ${this.ultEnergyCost}` : this.hero.id === 'hongmao' ? `${this.ultEnergyCost} 剑意` : '';
      this.ui.ultCd.style.background = 'transparent'; this.ui.ultCd.style.alignItems = 'flex-end'; this.ui.ultCd.style.fontSize = '9px'; this.ui.ultCd.style.paddingBottom = '2px'; this.ui.ultCd.style.color = '#d6d9b5';
      if (this.ui.finisher) {
        const unlocked = this.finisherUnlocked;
        this.ui.finisherFill.style.height = `${p.energy}%`;
        this.ui.finisher.classList.toggle('ss-c-locked', !unlocked);
        this.ui.finisher.classList.toggle('ss-c-ready', !this.actionsLocked() && unlocked && p.fireCd <= .01 && p.energy >= this.fireEnergyCost - .1);
        this.ui.finisher.setAttribute('aria-disabled', String(!unlocked));
        this.ui.finisherCd.textContent = !unlocked ? '尚未领悟' : p.fireCd > .05 ? p.fireCd.toFixed(1) + 's' : p.energy < this.fireEnergyCost - .1 ? `${Math.floor(p.energy)} / ${this.fireEnergyCost}` : `${this.fireEnergyCost} 剑意`;
        this.ui.finisherCd.style.background = unlocked ? 'transparent' : '';
        this.ui.finisherCd.style.alignItems = unlocked ? 'flex-end' : '';
        this.ui.finisherCd.style.fontSize = unlocked ? '9px' : '';
        this.ui.finisherCd.style.paddingBottom = unlocked ? '2px' : '';
      }
      this.ui.herb.textContent='调息 · 20%'; this.ui.herbCd.textContent=p.breatheCd>.05?p.breatheCd.toFixed(1):'';
      this.root.querySelectorAll('.ss-c-supplies button').forEach((b,n)=>{const id=this.loadout[n],left=Math.max(0,(this.supplyStock[id]||0)-(this.usedSupplies[id]||0));b.querySelector('.ss-c-supply-qty').textContent=id?'×'+left:'—';b.querySelector('em').textContent=id&&left>0&&p.herbCd>.05?p.herbCd.toFixed(1)+'s':'';b.classList.toggle('is-depleted',!!id&&left<=0);b.setAttribute('aria-label',(n+1)+' '+(this.supplyCatalog.find(v=>v.id===id)?.name||'未装配')+'，库存 '+left+(p.herbCd>.05?'，冷却 '+p.herbCd.toFixed(1)+' 秒':''));b.disabled=!id||left<=0||p.herbCd>0;});
      const buffs=this.root.querySelector('.ss-c-buffs');if(buffs)buffs.textContent=[this.supplyBuffs.attack>0?'攻 +'+Math.round(this.buffAttackRate*100)+'% '+Math.ceil(this.supplyBuffs.attack)+'秒':'',this.supplyBuffs.guard>0?'减伤 30% '+Math.ceil(this.supplyBuffs.guard)+'秒':''].filter(Boolean).join(' · ');
      if (this.boss) {
        this.ui.bossHp.style.width = `${Math.max(0, this.boss.hp / this.boss.maxHp * 100)}%`;
        this.ui.phase.textContent = this.boss.waiting ? '场边观战 · 无敌 · 最后一波入战' : this.finale && this.finale.complete ? '七剑合璧 · 终局已定' : this.finale && this.finale.active ? '七剑聚势 · 共赴终局' : this.finale && this.boss.hp <= this.boss.maxHp * .2 + .001 ? '虎势已破 · 清尽护卫，七剑聚首' : this.boss.dead ? '首领已败 · 清除余敌' : `第${['', '一', '二', '三'][this.boss.phase]}式 · ${Math.ceil(Math.max(0, this.boss.hp))} / ${Math.ceil(this.boss.maxHp)}`;
      }
    }
    toast(text, duration = 2) { if (this.destroyed) return; this.ui.toast.textContent = text; this.ui.toast.classList.add('ss-c-show'); this.toastUntil = this.time + duration; }
    pause(flag) { if (this.destroyed || this.ended) return; this.paused = flag === undefined ? !this.paused : !!flag; this.paintDirty = true; this.clearInput(); if (this.finale && this.finale.clearInteractionInput) this.finale.clearInteractionInput(); this.ui.overlay.hidden = !this.paused; this.lastFrame = performance.now(); if (this.dojo && !this.paused) this.canvas.focus({ preventScroll: true }); }
    finishFinale() {
      if (!this.finale || !this.finale.complete || this.finaleSettled || this.paused || this.ended || this.destroyed) return false;
      this.finaleSettled = true;
      if (this.boss && !this.boss.dead) {
        this.damageDealt += Math.max(0, this.boss.hp); this.boss.hp = 0; this.boss.dead = true; this.boss.deathTime = this.time; this.kills++;
      }
      this.tasks = []; this.hazards = []; this.fields = []; this.bolts = []; this.p.dash = null; this.clearInput();
      this.finish(true, false); return true;
    }
    finish(victory, retreated) {
      if (this.ended || this.destroyed) return;
      if (this.dojo && !retreated) return;
      if (victory && this.finale && !this.finale.complete) return false;
      if (victory && this.tower && (!this.boss?.dead || this.spawned<this.total || this.enemies.some(e=>!e.dead))) return false;
      window.SevenBGM?.setScene('exploration'); this.ended = true; this.paused = false; this.clearInput(); this.updateHud(true);
      this.result = { victory: !!victory, hp: Math.max(0, Math.round(this.p.hp)), maxHp: Math.round(this.p.maxHp), usedHerbs: this.usedHerbs, usedSupplies:{...this.usedSupplies}, loot:{...this.loot}, kills: this.kills, time: Math.round(this.time * 10) / 10, retreated: !!retreated, preview: !!this.enc.preview, training: !!this.training, trainingHits: this.trainingHits, awakened: this.awakened, awakenedAt: this.awakenedAt, streakMax: this.streakMax, damageDealt: Math.round(this.damageDealt), damageTaken: Math.round(this.damageTaken) };
      if (this.storyFinale) Object.assign(this.result, { storyFinale: this.storyFinale.kind, finaleCompleted: !!(this.finale && this.finale.complete && victory), viewpoint: this.hero.id });
      if (this.dojo) Object.assign(this.result, { dojo: true, victory: false, usedHerbs: 0, training: false, hits: this.dojoHits, maxCombo: this.dojoMaxCombo });
      if (retreated) { this.deliver(); return; }
      this.ui.overlay.hidden = false;
      this.ui.overlay.innerHTML = `<div class="ss-c-panel"><h2>${victory ? (this.tower?'本层已破':'此战告捷') : '暂避锋芒'}</h2><p>${victory ? '剑意未散，江湖仍在前方。' : '胜负本是常事。整顿之后，再来一战。'}<br>击退 ${this.kills} 名敌人 · 用时 ${Math.floor(this.time)} 秒${Object.keys(this.loot||{}).length?'<br>拾得：'+Object.entries(this.loot).map(([id,n])=>safe(this.supplyCatalog.find(i=>i.id===id)?.name||id)+' ×'+n).join('、'):''}</p><div class="ss-c-panelbuttons"><button class="ss-c-endreturn">${this.tower&&victory?'继续登塔':'返回江湖'}</button></div></div>`;
      this.listen(this.root.querySelector('.ss-c-endreturn'), 'click', () => this.deliver());
      const returnWhenReleased = () => {
        if (this.destroyed || this.delivered) return;
        if (this.physicalKeys.size || this.physicalPointers.size) { this.timers.push(setTimeout(returnWhenReleased, 120)); return; }
        this.deliver();
      };
      this.timers.push(setTimeout(returnWhenReleased, victory ? 1600 : 2400));
    }
    deliver() { if (this.destroyed || this.delivered) return; this.delivered = true; const result = this.result, callback = this.opts.onEnd; this.destroy(); if (active === this) active = null; if (typeof callback === 'function') callback(result); }
    destroy() {
      if (this.destroyed) return; this.destroyed = true; window.SevenBGM?.setScene('exploration'); cancelAnimationFrame(this.raf);
      this.listeners.forEach(([t, event, fn, options]) => t.removeEventListener(event, fn, options)); this.listeners = [];
      this.timers.forEach(clearTimeout); this.timers = []; if (this.observer) this.observer.disconnect(); if (this.audio) this.audio.close().catch(() => {});
      this.tasks = []; this.root.remove();
      if (this.finale && typeof this.finale.dispose === 'function') this.finale.dispose();
      if (this.swordFx) this.swordFx.clear(); if (this.scene && typeof this.scene.dispose === 'function') this.scene.dispose();
    }

    unlockSound() { if (!this.soundOn) return; try { if (!this.audio) { const A = window.AudioContext || window.webkitAudioContext; if (A) this.audio = new A(); } if (this.audio && this.audio.state === 'suspended') this.audio.resume().catch(() => {}); } catch (_) {} }
    tone(kind) {
      if (!this.soundOn || !this.audio || this.audio.state !== 'running') return;
      const t = this.audio.currentTime; if (t - this.lastTone < .035) return; this.lastTone = t;
      try { const o = this.audio.createOscillator(), g = this.audio.createGain(); const def = { swing: [360, 120, .07, .025], hit: [155, 65, .095, .045], hurt: [110, 45, .17, .05], skill: [520, 190, .28, .04], ult: [180, 620, .45, .045], heal: [420, 780, .24, .025] }[kind] || [200, 100, .1, .02]; o.type = kind === 'hurt' ? 'sawtooth' : 'triangle'; o.frequency.setValueAtTime(def[0], t); o.frequency.exponentialRampToValueAtTime(def[1], t + def[2]); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(def[3], t + .009); g.gain.exponentialRampToValueAtTime(.0001, t + def[2]); o.connect(g); g.connect(this.audio.destination); o.start(t); o.stop(t + def[2] + .01); } catch (_) {}
    }

    makeGround() {
      const aliases = { jade: 'palace', mountain: 'summit', peak: 'summit', gold: 'inn', cave: 'temple', valley: 'bamboo', lake: 'garden', water: 'waterfall' };
      this.biome = aliases[this.enc.biome] || this.enc.biome || 'forest';
      this.scene = null;
      if (this.tower && window.SevenTowerScene && typeof window.SevenTowerScene.create === 'function') {
        this.scene = window.SevenTowerScene.create({ width: this.arenaWidth, height: this.arenaHeight, family: this.tower.family, floor: this.tower.floor, theme: this.tower.theme });
      } else if (this.dojo && window.SevenTrainingScene && typeof window.SevenTrainingScene.create === 'function') {
        this.scene = window.SevenTrainingScene.create({ width: WORLD_W, height: WORLD_H, combat: true });
      } else if (window.JianghuScene && typeof window.JianghuScene.createBattle === 'function') {
        this.scene = window.JianghuScene.createBattle(this.biome, 3137 + this.danger * 61, { width: WORLD_W, height: WORLD_H, combat: true });
      }
      this.palette = /summit|temple/.test(this.biome) ? { sky: '#a6c3c8', floor: '#b5baa3', leaf: '#405d52' } : /palace|garden/.test(this.biome) ? { sky: '#bdd4ca', floor: '#c4c4a6', leaf: '#456956' } : { sky: '#b4c6b3', floor: '#b0bc8c', leaf: '#496445' };
      this.envSeeds = Array.from({ length: 25 }, (_, i) => ({ x: (i * 263 + 47) % 1520 - 250, y: (i * 197 + 13) % 1140 - 230, s: .55 + (i % 5) * .16, phase: i * 2.4, i }));
      this.fallbackProps = [
        { type: 'pavilion', x: 55, y: -250, w: 170, d: 145, h: 155 },
        { type: 'pavilion', x: 720, y: -195, w: 160, d: 130, h: 145 },
        { type: 'tree', x: -65, y: 250, h: 153 }, { type: 'tree', x: 345, y: -78, h: 143 },
        { type: 'tree', x: 1030, y: 185, h: 160 }, { type: 'tree', x: 1050, y: 505, h: 147 },
        { type: 'tree', x: 135, y: 705, h: 150 }, { type: 'tree', x: 805, y: 760, h: 130 },
        { type: 'rock', x: -55, y: 40, h: 51 }, { type: 'rock', x: -80, y: 560, h: 54 },
        { type: 'rock', x: 740, y: 660, h: 42 }, { type: 'rock', x: 1030, y: 410, h: 47 },
        { type: 'lantern', x: 125, y: 34, h: 64 }, { type: 'lantern', x: 810, y: 30, h: 64 },
        { type: 'lantern', x: 30, y: 510, h: 64 }, { type: 'lantern', x: 934, y: 530, h: 64 }
      ];
    }

    draw() {
      const c = this.ctx; if (!c || this.destroyed) return;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      if (this.finale && (this.finale.active || this.finale.complete)) { this.finale.drawWorld(c); this.finale.drawOverlay(c); return; }
      const sky = c.createLinearGradient(0, 0, 0, this.ch); sky.addColorStop(0, this.tower ? '#111b25' : this.palette.sky); sky.addColorStop(.48, this.tower ? '#19222b' : '#b6c5b2'); sky.addColorStop(1, this.tower ? '#0a121b' : '#627765'); c.fillStyle = sky; c.fillRect(0, 0, this.cw, this.ch);
      c.save();
      if (!this.reducedMotion && this.shake > 0) c.translate((Math.random() - .5) * this.shake * this.camera.zoom, (Math.random() - .5) * this.shake * this.camera.zoom);
      if (this.scene && typeof this.scene.drawGround === 'function') this.scene.drawGround(c, this.camera, this.time * 1000);
      else this.drawFallbackGround(c);
      if (this.swordFx) this.swordFx.drawGround(c);
      this.withGround(c, () => {
        this.fields.forEach(f => { if (!f.visualFX || !this.swordFx) this.drawField(c, f); });
        this.hazards.forEach(h => this.drawHazard(c, h));
        this.drawShadows(c);
        for (const f of this.fx) if (['ring', 'spawn', 'lightning', 'alliance', 'fieldPulse', 'healPulse'].includes(f.type)) this.drawGroundEffect(c, f);
      });
      for (const f of this.fx) if (f.type === 'changhong') this.withView(c, () => this.drawChanghong(c, f, true));
      let drawables = [];
      if (this.scene && typeof this.scene.getDrawables === 'function') drawables = this.scene.getDrawables(this.camera, this.time * 1000, { x: this.p.x, y: this.p.y, z: this.p.air, hero: true }).slice();
      else drawables = this.fallbackProps.map(prop => ({ depth: prop.x + prop.y + (prop.d || 0), draw: () => this.withView(c, () => this.drawFallbackProp(c, prop)) }));
      this.ghosts.forEach(g => drawables.push({ depth: g.x + g.y - 1, draw: () => this.withView(c, () => this.drawGhost(c, g)) }));
      if(this.boss?.waiting)drawables.push({depth:this.boss.x+this.boss.y,draw:()=>this.withView(c,()=>{this.drawEnemy(c,this.boss);const q=this.project(this.boss.x,this.boss.y,125);c.save();c.font='bold 12px sans-serif';c.textAlign='center';c.fillStyle='#f7e8b8';c.strokeStyle='#403d32';c.lineWidth=4;c.strokeText('观战 · 无敌',q.x,q.y);c.fillText('观战 · 无敌',q.x,q.y);c.restore();})});
      this.enemies.forEach(e => drawables.push({ depth: e.x + e.y, draw: () => this.withView(c, () => this.drawEnemy(c, e)) }));
      this.companions.forEach(a => { if (!a.removed && (!a.dead || this.time - a.deathTime < .5)) drawables.push({ depth: a.x + a.y + .05, draw: () => this.withView(c, () => this.drawCompanion(c, a)) }); });
      drawables.push({ depth: this.p.x + this.p.y + .1, draw: () => this.withView(c, () => this.drawPlayer(c)) });
      this.bolts.forEach(b => drawables.push({ depth: b.x + b.y + .2, draw: () => this.withView(c, () => this.drawBolt(c, b)) }));
      this.fields.forEach(f => { if (f.team === 'player' && (!f.visualFX || !this.swordFx)) drawables.push({ depth: f.x + f.y + .3, draw: () => this.withView(c, () => this.drawFieldColumn(c, f)) }); });
      if (this.swordFx) drawables.push(...this.swordFx.getDrawables());
      for (const f of this.fx) if (f.type === 'alliance' && !this.swordFx) this.alliancePositions(f).forEach((pos, i) => drawables.push({ depth: pos.x + pos.y + .2, draw: () => this.withView(c, () => this.drawAllianceProjection(c, f, pos, i)) }));
      drawables.sort((a, b) => a.depth - b.depth).forEach(item => item.draw(c));
      for (const f of this.fx) {
        if (f.type === 'slash') this.withGround(c, () => this.drawSlash(c, f), num(f.z, 27));
        else if (f.type === 'trail' || f.type === 'charge' || f.type === 'palm') this.withView(c, () => this.drawAirEffect(c, f));
        else if (f.type === 'changhong') this.withView(c, () => this.drawChanghong(c, f));
      }
      this.withView(c, () => {
        this.drawAmbient(c);
        for (const p of this.particles) {
          const q = this.project(p.x, p.y, p.z), a = clamp(p.life / p.max, 0, 1); c.save(); c.globalAlpha = a; c.fillStyle = p.color;
          if (p.type === 'glow') { c.beginPath(); c.ellipse(q.x, q.y, p.r * (1.3 - a * .4), p.r * .55, 0, 0, TAU); c.fill(); }
          else { c.translate(q.x, q.y); c.rotate(Math.atan2((p.vx + p.vy) * ISO_Y - num(p.vz, 0), (p.vx - p.vy) * ISO_X)); c.fillRect(-p.r, -p.r * .3, p.r * 2.4, p.r * .6); }
          c.restore();
        }
        c.textAlign = 'center'; c.textBaseline = 'middle';
        for (const f of this.floats) { const q = this.project(f.x, f.y, f.z); c.save(); c.globalAlpha = clamp(f.life / .25, 0, 1); c.font = `700 ${f.size}px "Microsoft YaHei",sans-serif`; c.lineWidth = 3; c.strokeStyle = '#263c32bc'; c.strokeText(f.text, q.x, q.y); c.fillStyle = f.color; c.fillText(f.text, q.x, q.y); c.restore(); }
      });
      // Keep imminent hostile boundaries readable above transparent sword sheets.
      this.withGround(c, () => this.hazards.forEach(h => this.drawHazardEdge(c, h)));
      if (this.flash > 0) { c.fillStyle = `rgba(249,237,203,${this.flash * .46})`; c.fillRect(0, 0, this.cw, this.ch); }
      this.drawPlayerMarker(c);
      c.restore();
      this.drawOffscreenIndicators(c);
      for (const f of this.fx) if (f.type === 'title') { c.save(); c.globalAlpha = Math.min(1, f.life * 2, (f.max - f.life) * 6); c.textAlign = 'center'; c.font = `600 ${clamp(this.cw / 32, 21, 38)}px "Songti SC","STSong",serif`; c.shadowColor = '#1f3a31'; c.shadowBlur = 14; c.fillStyle = '#fff1c7'; c.fillText(f.text, this.cw / 2, this.ch * .28); c.restore(); }
      const vignette = c.createRadialGradient(this.cw / 2, this.ch / 2, Math.min(this.cw, this.ch) * .3, this.cw / 2, this.ch / 2, Math.max(this.cw, this.ch) * .73); vignette.addColorStop(0, '#122d2000'); vignette.addColorStop(1, this.p.hp < this.p.maxHp * .28 && !this.ended ? '#6b30243a' : '#142c232e'); c.fillStyle = vignette; c.fillRect(0, 0, this.cw, this.ch);
    }

    drawChanghong(c, f, ground = false) {
      const age = f.max - f.life, release = Math.max(0, age - f.charge), charge = clamp(age / f.charge, 0, 1);
      const dx = Math.cos(f.angle), dy = Math.sin(f.angle), z = ground ? 1 : 43;
      const point = (along, side = 0, height = z) => this.project(f.x + dx * along - dy * side, f.y + dy * along + dx * side, height);
      const polygon = (points, fill, alpha = 1, stroke) => {
        c.globalAlpha = alpha; c.beginPath();
        points.forEach((v, i) => { const q = point(v[0], v[1], v.length > 2 ? v[2] : z); i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y); });
        c.closePath(); c.fillStyle = fill; c.fill();
        if (stroke) { c.strokeStyle = stroke; c.lineWidth = .7; c.stroke(); }
      };
      const stroke = (points, color, width, alpha = 1) => {
        c.globalAlpha = alpha; c.beginPath();
        points.forEach((v, i) => { const q = point(v[0], v[1], v.length > 2 ? v[2] : z); i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y); });
        c.strokeStyle = color; c.lineWidth = width; c.stroke();
      };
      // Separate swept blades give the wide lane a feathered silhouette. Their
      // points fade at different distances; no filled box or transverse cap
      // outlines the unchanged 620 × 400 collision rectangle.
      const sweptWing = (start, end, side, offset, width, bend, alpha, height = z, groundLayer = false) => {
        const near = point(start, side * offset, height), far = point(end, side * offset, height), tint = c.createLinearGradient(near.x, near.y, far.x, far.y);
        tint.addColorStop(0, '#92351d00'); tint.addColorStop(.12, '#b9402244'); tint.addColorStop(.42, '#ed773c99'); tint.addColorStop(.76, '#ffbf6e99'); tint.addColorStop(.94, '#ffe9b23d'); tint.addColorStop(1, '#ffe4a400');
        const center = t => offset + Math.sin(t * Math.PI) * bend + Math.sin(t * Math.PI * 2) * 9;
        const outer = [], inner = [], crest = [];
        for (let i = 0; i <= 28; i++) {
          const t = i / 28, along = mix(start, end, t), taper = Math.pow(Math.sin(t * Math.PI), .65), w = width * taper * (1 + Math.sin(t * 21 - release * 9) * .045);
          outer.push([along, side * (center(t) + w), height]); inner.push([along, side * (center(t) - w), height]);
          if (i > 3 && i < 25) crest.push([along, side * (center(t) + w * .63), height + (groundLayer ? 0 : 2)]);
        }
        polygon(outer.concat(inner.reverse()), tint, alpha);
        if (!groundLayer) {
          stroke(crest, '#ffc87d', .85, alpha * .42);
          const fine = [];
          for (let i = 0; i <= 20; i++) { const t = .09 + i / 20 * .82; fine.push([mix(start, end, t), side * (center(t) - width * Math.pow(Math.sin(t * Math.PI), .7) * .32), height + 1]); }
          stroke(fine, '#f69b53', .65, alpha * .34);
        }
      };
      c.save(); c.lineJoin = 'miter'; c.lineCap = 'butt';
      if (ground) {
        const len = f.released ? f.range : 90 + charge * 50, opacity = f.released ? Math.pow(clamp(1 - release / .8, 0, 1), 1.4) : charge * .32;
        if (f.released) {
          for (const side of [-1, 1]) {
            sweptWing(-37, len + 18, side, 121, 72, 18, opacity * .19, 1, true);
            sweptWing(-21, len + 25, side, 187, 17, -8, opacity * .18, 1, true);
          }
        }
        polygon([[18, -12], [len * .7, -34], [len, 0], [len * .7, 34], [18, 12]], '#f99439', opacity * .15);
        stroke([[20, 0], [len, 0]], '#fff0aa', 7, opacity * .23);
        stroke([[20, -20], [len * .87, -20]], '#df6133', 2, opacity * .26);
        stroke([[20, 20], [len * .9, 20]], '#df6133', 2, opacity * .26);
        c.restore(); return;
      }
      if (!f.released) {
        const origin = point(36), flare = 9 + charge * 22;
        c.globalCompositeOperation = 'lighter';
        const glow = c.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, flare * 2.2);
        glow.addColorStop(0, '#fff9d1d9'); glow.addColorStop(.16, '#ffc46999'); glow.addColorStop(1, '#f58a3f00');
        c.globalAlpha = .2 + charge * .65; c.fillStyle = glow; c.beginPath(); c.arc(origin.x, origin.y, flare * 2.2, 0, TAU); c.fill();
        polygon([[8, 0], [43, -5 * charge], [109 + charge * 35, 0], [43, 5 * charge]], '#fff3bb', .3 + charge * .7);
        for (let i = 0; i < 7; i++) {
          const side = i % 2 ? -1 : 1, offset = (19 + i * 7) * (1 - charge * .72) * side, tail = -64 - i * 21 + charge * 25;
          stroke([[tail, offset, 30 + i * 4], [36, side * 2, 43]], i % 2 ? '#ed7439' : '#ffe8a8', i % 3 ? .8 : 1.4, charge * (.32 + i % 3 * .12));
        }
        // The small vertical lens compresses into the sword point; no orbit or
        // tornado is used, keeping its silhouette distinct from Firewhirl.
        c.globalAlpha = charge * .8; c.strokeStyle = '#ffdfa0'; c.lineWidth = 1.2;
        c.beginPath(); c.ellipse(origin.x, origin.y, 5 + (1 - charge) * 13, 15 + (1 - charge) * 27, this.screenDirection(f.angle), -.6, Math.PI * 1.3); c.stroke();
        c.restore(); return;
      }
      const solid = clamp(1 - Math.max(0, release - .12) / .42, 0, 1), echo = clamp(1 - Math.abs(release - .31) / .4, 0, 1);
      const length = f.range * (.94 + .06 * clamp(release / .07, 0, 1));
      const blade = (start, end, width, offset, alpha, height = 43) => {
        if (alpha <= 0) return;
        const span = end - start, p = (t, w) => [start + span * t, offset + w * width, height];
        const a = point(start, offset, height), b = point(end, offset, height), red = c.createLinearGradient(a.x, a.y, b.x, b.y);
        red.addColorStop(0, '#9c331b00'); red.addColorStop(.17, '#a32912'); red.addColorStop(.6, '#ec6a28'); red.addColorStop(1, '#ffdc84');
        c.globalCompositeOperation = 'source-over';
        polygon([p(0, 0), p(.22, -.3), p(.37, -.9), p(.41, -.46), p(.65, -1), p(.75, -.51), p(1, 0), p(.72, .8), p(.6, .57), p(.46, 1), p(.38, .48), p(.17, .4)], red, alpha, '#f9a353');
        polygon([p(.05, 0), p(.36, -.42), p(.52, -.2), p(.74, -.61), p(1, 0), p(.74, .24), p(.52, .38), p(.29, .13)], '#ffb54c', alpha * .95);
        polygon([p(.03, 0), p(.53, -.12), p(.81, -.22), p(1, 0), p(.72, .13), p(.3, .08)], '#fffbd8', alpha);
        stroke([p(0, 0), p(1, 0)], '#ffffff', 1.2, alpha);
        for (let i = 0; i < 6; i++) {
          const t = .27 + i * .103, side = i % 2 ? 1 : -1;
          stroke([p(t - .09, side * .45), p(t, side * .12), p(t + .11, side * .6)], i % 2 ? '#ffc76d' : '#ffefb6', .9, alpha * .65);
        }
      };
      const start = point(14), end = point(length);
      // Curved gold/vermilion sheets, tapered flanking swords and detached
      // edge splinters visibly span the full width without a hard fence.
      for (const side of [-1, 1]) {
        c.globalCompositeOperation = 'source-over';
        sweptWing(-44 + side * 9, length + 24, side, 109, 74, 27, solid * .52, 41 + side * 3);
        sweptWing(-27, length + 32 + side * 10, side, 181, 24, -2, solid * .55 + echo * .08, 41 + side * 2);
        sweptWing(19, length - 37, side, 66, 20, 34, solid * .43 + echo * .19, 43);
        for (let i = 0; i < 3; i++) {
          const offset = CHANGHONG.halfWidth - 6 + Math.sin(i * 2.4 + side) * 7, from = -15 + i * 195 + side * 15, extent = 139 + i * 14;
          blade(from + release * 23, Math.min(length + 18, from + extent + release * 48), 3.6 + i * .65, side * offset, (solid * .43 + echo * .17) * (.76 + i * .12), 42 + side * 3);
          const flank = 55 + i * 41, tail = 18 + i * 61, head = length - 11 - i * 27;
          blade(tail + release * 35, head + release * 9, 4 + i * .8, side * flank, solid * (.17 + i * .04) + echo * .16, 42 + side * 4);
        }
      }
      c.globalCompositeOperation = 'lighter';
      const halo = c.createLinearGradient(start.x, start.y, end.x, end.y); halo.addColorStop(0, '#ff973b00'); halo.addColorStop(.24, '#ed652e55'); halo.addColorStop(.82, '#ffb34855'); halo.addColorStop(1, '#ffe2a600');
      stroke([[7, 0], [length, 0]], halo, 30, solid * .7);
      blade(4, length, 32, 0, solid);
      // Parallel residual swords pass on either flank with separate timing.
      blade(52 + release * 90, length * .91 + release * 32, 7.5, -29, echo * .72, 46);
      blade(5 + release * 80, length * .85 + release * 54, 6.2, 31, echo * .66, 38);
      const impactPhase = clamp(1 - release / .47, 0, 1), impact = f.impacts.length ? f.impacts.reduce((a, b) => a.along > b.along ? a : b) : null;
      if (impact && impactPhase > 0) {
        const q = this.project(impact.x, impact.y, 47), radius = 13 + (1 - impactPhase) * 36;
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = impactPhase;
        const sun = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, radius * 1.65); sun.addColorStop(0, '#ffffeedd'); sun.addColorStop(.2, '#ffe1a19c'); sun.addColorStop(1, '#ff9a4100');
        c.fillStyle = sun; c.beginPath(); c.arc(q.x, q.y, radius * 1.65, 0, TAU); c.fill();
        c.strokeStyle = '#ffeab1'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(q.x, q.y, radius * .74, radius, this.screenDirection(f.angle), 0, TAU); c.stroke();
        c.lineWidth = .7; c.beginPath(); c.ellipse(q.x, q.y, radius * .57, radius * .78, this.screenDirection(f.angle), 0, TAU); c.stroke();
        for (let i = 0; i < 10; i++) {
          const a = i * TAU / 10 + f.angle * .2, r = radius * (i % 2 ? 1.25 : 1.8);
          c.beginPath(); c.moveTo(q.x + Math.cos(a) * radius * .67, q.y + Math.sin(a) * radius * .67); c.lineTo(q.x + Math.cos(a) * r, q.y + Math.sin(a) * r); c.stroke();
        }
      }
      // Deterministic sharp facets disperse along the original axis. Their
      // height and ground reflection remain separate throughout the decay.
      const decay = clamp(1 - release / 1.1, 0, 1), spread = 8 + release * 59;
      c.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 23; i++) {
        const along = 80 + (i * 137 % 485) + release * (35 + i % 5 * 11), side = (i % 2 ? -1 : 1) * (9 + i % 4 * spread * .38);
        const len = 12 + i % 4 * 7, w = 1.8 + i % 3 * 1.25, h = 35 + i % 5 * 6 + Math.sin(release * 3) * 13;
        polygon([[along - len, side, h], [along + len * .17, side - w, h], [along + len, side, h], [along, side + w, h]], i % 4 ? '#e77632' : '#fff0ba', decay * (i % 4 ? .56 : .85), i % 3 ? null : '#ffe3a2');
        if (i % 4 === 0) stroke([[along - len * 2.2, side, h], [along + len, side, h]], '#ffd98c', .6, decay * .55);
      }
      for (let i = 0; i < 16; i++) {
        const side = i % 2 ? -1 : 1, along = -13 + (i * 97 % 638) + release * (38 + i % 3 * 14), offset = side * (174 + i % 4 * 10 + release * 14), span = 8 + i % 4 * 5, h = 39 + i % 3 * 4;
        polygon([[along - span, offset, h], [along, offset - 2.2, h], [along + span * 1.4, offset, h], [along - span * .2, offset + 2.3, h]], i % 3 ? '#ee9b51' : '#ffe4a3', decay * .62);
      }
      c.restore();
    }

    drawShadows(c) {
      const actors = this.enemies.filter(e => !e.dead); actors.push(...this.livingCompanions(), this.p);
      actors.forEach(a => { c.save(); const player = a === this.p, air = player ? this.p.air : 0; c.globalAlpha = player ? .27 - air * .002 : .22; c.fillStyle = '#233d2c'; c.beginPath(); c.ellipse(a.x + 6, a.y + 6, (player ? 24 : a.r + 2) * (1 - air * .004), (player ? 24 : a.r + 2) * (1 - air * .004), 0, 0, TAU); c.fill(); c.restore(); if (a.slow > 0) { c.strokeStyle = '#b9f0eabc'; c.lineWidth = 2; c.beginPath(); c.arc(a.x, a.y, a.r + 8, 0, TAU); c.stroke(); } });
      c.save(); c.strokeStyle = this.color; c.lineWidth = 1.6; c.globalAlpha = .73; c.beginPath(); c.arc(this.p.x, this.p.y, 29, 0, TAU); c.stroke(); c.setLineDash([3, 7]); c.lineWidth = .8; c.beginPath(); c.arc(this.p.x, this.p.y, 34, 0, TAU); c.stroke(); c.restore();
    }

    drawPlayerMarker(c) {
      // Screen-space triangle: fixed CSS-pixel size, following the actual actor lift.
      // Initial carried roster is intentional: retain identification while allies recover.
      if (!(this.battleAllyCount > 0)) return;
      const q = this.screen(this.p.x, this.p.y, num(this.p.air, 0) + num(this.p.spellLift, 0) + 98);
      c.save(); c.globalAlpha = 1; c.fillStyle = '#fff1a8'; c.strokeStyle = '#172f2b';
      c.lineWidth = 2; c.lineJoin = 'round'; c.shadowColor = '#09241f'; c.shadowBlur = 3;
      c.beginPath(); c.moveTo(q.x - 6, q.y - 13); c.lineTo(q.x + 6, q.y - 13); c.lineTo(q.x, q.y - 3);
      c.closePath(); c.fill(); c.stroke(); c.restore();
    }
    drawOffscreenIndicators(c) {
      let count = 0; const marginX = 35, top = this.cw < 650 ? 156 : 118, bottom = this.ch - (this.cw <= 900 || window.matchMedia?.('(pointer:coarse)').matches ? (this.cw > 640 && this.ch <= 600 ? 135 : 230) : 155);
      const sorted = this.enemies.filter(e => !e.dead && e.spawn <= 0).sort((a, b) => Number(b.boss) - Number(a.boss) || hypot(a.x - this.p.x, a.y - this.p.y) - hypot(b.x - this.p.x, b.y - this.p.y));
      for (const e of sorted) { const q = this.screen(e.x, e.y); if (q.x >= marginX && q.x <= this.cw - marginX && q.y >= top && q.y <= bottom) continue; if (count++ >= 3) break; const x = clamp(q.x, marginX, this.cw - marginX), y = clamp(q.y, top, Math.max(top + 20, bottom)); const a = Math.atan2(q.y - y, q.x - x); c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = e.boss ? '#bf7557' : '#b0a274'; c.strokeStyle = '#f3e9c3'; c.lineWidth = 1; c.beginPath(); c.moveTo(9, 0); c.lineTo(-4, -5); c.lineTo(-1, 0); c.lineTo(-4, 5); c.closePath(); c.fill(); c.stroke(); c.restore(); }
    }
    drawAmbient(c) {
      if (this.tower) return;
      for (const s of this.envSeeds) { const x = (s.x + this.time * (7 + s.s * 4) + 250) % 1520 - 250, y = s.y + Math.sin(this.time * .5 + s.phase) * 17, q = this.project(x, y, 14 + Math.sin(this.time + s.phase) * 5); c.save(); c.globalAlpha = .15 + s.s * .07; c.fillStyle = s.i % 4 ? '#f3f0c9' : '#678055'; c.translate(q.x, q.y); c.rotate(this.time * .3 + s.phase); c.beginPath(); c.ellipse(0, 0, s.s * 4.5, s.s * 1.4, 0, 0, TAU); c.fill(); c.restore(); }
    }

    drawFallbackGround(c) {
      this.withView(c, () => {
        const poly = (points, fill) => { c.fillStyle = fill; c.beginPath(); points.forEach(([x, y, z], i) => { const p = this.project(x, y, z); i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y); }); c.closePath(); c.fill(); };
        poly([[-620, -600, -25], [1550, -600, -25], [1550, 1220, -25], [-620, 1220, -25]], '#8fa38a');
        poly([[0, 600, 0], [960, 600, 0], [960, 600, -36], [0, 600, -36]], '#70816c');
        poly([[960, 0, 0], [960, 600, 0], [960, 600, -36], [960, 0, -36]], '#687b67');
      });
      this.withGround(c, () => {
        c.fillStyle = this.palette.floor; c.fillRect(0, 0, 960, 600);
        c.fillStyle = /palace|summit|temple|inn/.test(this.biome) ? '#c8c7ab' : '#cad0a8'; c.fillRect(48, 67, 868, 488);
        c.strokeStyle = '#7d927341'; c.lineWidth = 1.2;
        for (let y = 76; y < 560; y += 62) for (let x = 55 + (Math.floor(y / 62) % 2) * 57; x < 907; x += 114) { c.strokeRect(x, y, 107, 56); c.fillStyle = (x + y) % 3 ? '#e3e0bf18' : '#526e5220'; c.fillRect(x + 1, y + 1, 105, 54); }
        c.strokeStyle = '#7c927251'; c.lineWidth = 3; c.strokeRect(48, 67, 868, 488);
        c.fillStyle = '#658f8270'; c.fillRect(-320, 640, 1490, 190); c.strokeStyle = '#c9e1c74a'; c.lineWidth = 2;
        for (let i = 0; i < 18; i++) { const x = -250 + i * 75, y = 670 + (i % 3) * 41; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 20, y - 6, x + 38, y); c.stroke(); }
      });
    }

    drawFallbackProp(c, prop) {
      const p = this.project(prop.x, prop.y), h = prop.h;
      if (prop.type === 'pavilion') {
        const x = prop.x, y = prop.y, w = prop.w, d = prop.d;
        const polygon = (pts, color) => { c.fillStyle = color; c.beginPath(); pts.forEach(v => { const q = this.project(v[0], v[1], v[2]); if (pts.indexOf(v) === 0) c.moveTo(q.x, q.y); else c.lineTo(q.x, q.y); }); c.closePath(); c.fill(); };
        polygon([[x, y, 0], [x + w, y, 0], [x + w, y + d, 0], [x, y + d, 0]], '#b5b69d');
        polygon([[x, y + d, 0], [x + w, y + d, 0], [x + w, y + d, 17], [x, y + d, 17]], '#7f8e76');
        for (const [cx, cy] of [[x + 16, y + 16], [x + w - 16, y + 16], [x + 16, y + d - 16], [x + w - 16, y + d - 16]]) { const a = this.project(cx, cy, 17), b = this.project(cx, cy, h - 45); c.strokeStyle = '#795c48'; c.lineWidth = 10; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); c.strokeStyle = '#c3a079'; c.lineWidth = 2; c.beginPath(); c.moveTo(a.x - 3, a.y); c.lineTo(b.x - 3, b.y); c.stroke(); }
        const roof = [[x - 29, y - 25, h - 44], [x + w + 29, y - 25, h - 44], [x + w + 29, y + d + 25, h - 44], [x - 29, y + d + 25, h - 44]], peak = [x + w / 2, y + d / 2, h + 12];
        for (let i = 0; i < 4; i++) polygon([roof[i], roof[(i + 1) % 4], peak], ['#536f68', '#355952', '#43685a', '#6b8170'][i]);
        c.strokeStyle = '#9faf89'; c.lineWidth = 4; c.beginPath(); for (let i = 0; i <= 4; i++) { const q = this.project(...roof[i % 4]); i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y); } c.stroke();
      } else if (prop.type === 'tree') {
        c.save(); c.translate(p.x, p.y); c.strokeStyle = '#6a6d4d'; c.lineWidth = 11; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-9, -h * .45, 4, -h * .83); c.stroke();
        const colors = /palace|garden/.test(this.biome) ? ['#bca995', '#d8c0a8', '#c4ab98'] : ['#3d6250', '#55795a', '#729164'];
        for (let i = 0; i < 7; i++) { c.fillStyle = colors[i % 3]; c.beginPath(); c.ellipse(Math.cos(i * 2.4) * 29, -h * (.72 + i % 2 * .14), 43 - i % 2 * 7, 27 - i % 2 * 2, -.15, 0, TAU); c.fill(); } c.restore();
      } else if (prop.type === 'rock') {
        c.save(); c.translate(p.x, p.y); c.fillStyle = '#697e6d'; c.beginPath(); c.moveTo(-38, 0); c.lineTo(-31, -h * .63); c.lineTo(-4, -h); c.lineTo(27, -h * .77); c.lineTo(42, -10); c.lineTo(16, 6); c.closePath(); c.fill(); c.fillStyle = '#a3ad90'; c.beginPath(); c.moveTo(-31, -h * .63); c.lineTo(-4, -h); c.lineTo(27, -h * .77); c.lineTo(2, -h * .33); c.closePath(); c.fill(); c.restore();
      } else {
        c.save(); c.translate(p.x, p.y); c.fillStyle = '#89967a'; c.fillRect(-9, -8, 18, 8); c.fillStyle = '#617963'; c.fillRect(-5, -h + 18, 10, h - 20); c.fillStyle = '#e0c18a'; c.fillRect(-12, -h, 24, 23); c.strokeStyle = '#735e48'; c.lineWidth = 2; c.strokeRect(-12, -h, 24, 23); c.fillStyle = '#66836d'; c.beginPath(); c.moveTo(-18, -h); c.lineTo(0, -h - 12); c.lineTo(18, -h); c.closePath(); c.fill(); c.restore();
      }
    }

    drawPlayer(c) {
      const p = this.p, fire = !p.dash && this.swordFx && this.swordFx.effects.find(e => e.hero === 'hongmao' && !e.owner && e.tier === 'e' && e.age > .28 && e.age < 2.12);
      const lift = fire ? Math.sin(clamp((fire.age - .28) / 1.84, 0, 1) * Math.PI) * 19 : 0;
      p.spellLift = lift;
      const q = this.project(p.x, p.y, p.air + lift), dir = this.screenDirection(p.dir + (fire ? fire.age * TAU * 1.72 : 0));
      const state = p.dash ? 'dash' : fire ? 'attack' : p.cast > 0 ? 'cast' : p.swing > 0 ? 'attack' : p.walking ? 'walk' : 'idle';
      const phase = p.dash ? 1 - p.dash.t / p.dash.max : fire ? (fire.age * 3.4) % 1 : p.cast > 0 ? 1 - p.cast / p.castMax : p.swing > 0 ? 1 - p.swing / .2 : p.walkPhase;
      c.save();
      if (p.armor > 0) { c.strokeStyle = '#f9dfa0'; c.globalAlpha = .3 + Math.sin(this.time * 6) * .1; c.lineWidth = 2.2; c.beginPath(); c.ellipse(q.x, q.y - 43, 35, 57, 0, -.4, Math.PI * 1.8); c.stroke(); c.globalAlpha = 1; }
      if (p.invuln > 0 && !p.dash && Math.sin(this.time * 35) > .3) c.globalAlpha = .65;
      try { if (window.GameArt && typeof window.GameArt.drawHero === 'function') window.GameArt.drawHero(c, this.hero.id, q.x, q.y, 96, dir, this.time, { state, phase: clamp(phase, 0, 1), air: clamp(p.air / 46, 0, 1), equipment: this.equipment, swordState: this.swordState, hand: this.swordState.hand }); else this.drawFallbackHero(c, q.x, q.y, dir); } catch (_) { this.drawFallbackHero(c, q.x, q.y, dir); }
      if (p.hit > 0) { c.strokeStyle = '#ffe4b2'; c.lineWidth = 1.6; c.globalAlpha = p.hit / .3; c.beginPath(); c.ellipse(q.x, q.y - 43, 29, 53, 0, 0, TAU); c.stroke(); }
      c.restore();
    }
    drawCompanion(c, a) {
      const q = this.project(a.x, a.y), dir = this.screenDirection(a.dir), equipment = a.combatEquipment;
      const state = a.dash ? 'dash' : a.cast > 0 ? 'cast' : a.swing > 0 ? 'attack' : a.walking ? 'walk' : 'idle', phase = a.dash ? 1 - a.dash.t / a.dash.max : a.cast > 0 ? 1 - a.cast / a.castMax : a.swing > 0 ? 1 - a.swing / .25 : a.walkPhase;
      c.save();
      if (a.dead) c.globalAlpha = clamp(1 - (this.time - a.deathTime) / .5, 0, 1);
      else if (a.invuln > 0 && Math.sin(this.time * 32) > .35) c.globalAlpha = .65;
      if (window.GameArt && typeof window.GameArt.drawHero === 'function') window.GameArt.drawHero(c, a.heroId, q.x, q.y, 91, dir, this.time, { state, phase: clamp(phase, 0, 1), equipment, swordState: equipment.swordState, hand: equipment.hand });
      else { c.fillStyle = a.color; c.beginPath(); c.ellipse(q.x, q.y - 39, 19, 34, 0, 0, TAU); c.fill(); }
      if (!a.dead) {
        c.globalAlpha = 1; c.textAlign = 'center'; c.textBaseline = 'bottom'; c.font = '11px "Songti SC","STSong",serif'; c.lineWidth = 3; c.strokeStyle = '#1e392ed9'; c.fillStyle = '#e3eed3'; c.strokeText(`${a.name} · 同行`, q.x, q.y - 102); c.fillText(`${a.name} · 同行`, q.x, q.y - 102);
        c.fillStyle = '#19392fbb'; c.fillRect(q.x - 25, q.y - 99, 50, 4); c.fillStyle = '#a9d6a3'; c.fillRect(q.x - 24, q.y - 98, 48 * clamp(a.hp / a.maxHp, 0, 1), 2);
        if (a.hit > 0) { c.globalAlpha = a.hit / .3; c.strokeStyle = '#f1ddb2'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(q.x, q.y - 40, 26, 48, 0, 0, TAU); c.stroke(); }
      }
      c.restore();
    }
    drawGhost(c, g) {
      const p = this.project(g.x, g.y, g.z); c.save(); c.globalAlpha = g.life / g.max * .25;
      if (window.GameArt && typeof window.GameArt.drawHero === 'function') { try { window.GameArt.drawHero(c, this.hero.id, p.x, p.y, 96, this.screenDirection(g.dir), this.time, { state: 'dash', phase: clamp(g.phase, 0, 1), air: clamp(g.z / 46, 0, 1), equipment: this.equipment, swordState: this.swordState }); } catch (_) {} }
      else this.drawFallbackHero(c, p.x, p.y, this.screenDirection(g.dir));
      c.restore();
    }
    drawEnemy(c, e) { const q = this.project(e.x, e.y); this.drawEnemySprite(c, Object.assign({}, e, { x: q.x, y: q.y, dir: this.screenDirection(e.dir) })); }

    drawFieldColumn(c, f) {
      c.save(); const alpha = Math.min(1, f.life, (f.max - f.life) * 3); c.strokeStyle = f.color; c.lineWidth = 1.3;
      if (f.kind === 'wind') {
        for (let level = 0; level < 5; level++) { const r = f.r * (.37 + level * .105), z = level * 16 + 8, spin = this.time * (level % 2 ? -2.1 : 1.7) + level * 1.3; c.globalAlpha = alpha * (.1 + (5 - level) * .04); c.beginPath(); for (let i = 0; i <= 24; i++) { const a = spin + i / 24 * 3.6, q = this.project(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, z + Math.sin(a * 2) * 4); i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y); } c.stroke(); }
      } else if (f.kind === 'ice') {
        for (let i = 0; i < 17; i++) { const a = i * 2.4, r = (i * 53) % (f.r - 15), q = this.project(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r), h = 17 + (i % 4) * 7; c.globalAlpha = alpha * .27; c.fillStyle = i % 2 ? '#f0ffff' : '#a8e2ef'; c.beginPath(); c.moveTo(q.x - 5, q.y); c.lineTo(q.x, q.y - h); c.lineTo(q.x + 6, q.y - 2); c.closePath(); c.fill(); c.stroke(); }
      } else if (f.kind === 'rain') {
        for (let i = 0; i < 32; i++) { const a = i * 2.4, r = (i * 47) % (f.r - 12), z = 12 + (this.time * 80 + i * 23) % 83, q = this.project(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, z); c.globalAlpha = alpha * .38; c.beginPath(); c.moveTo(q.x, q.y - 9); c.lineTo(q.x - 2, q.y + 3); c.stroke(); }
      }
      c.restore();
    }

    drawBolt(c, b) {
      const height = num(b.height, b.team === 'player' ? 28 : 23), q = this.project(b.x, b.y, height), a = this.screenDirection(b.angle);
      if (b.needle && b.trail && b.trail.length > 1) {
        c.save(); c.lineCap = 'round'; c.strokeStyle = '#c9e1b6';
        for (let i = 1; i < b.trail.length; i++) {
          const from = this.project(b.trail[i - 1].x, b.trail[i - 1].y, height), to = this.project(b.trail[i].x, b.trail[i].y, height);
          c.globalAlpha = i / b.trail.length * .36; c.lineWidth = .45 + i / b.trail.length * 1.35;
          c.beginPath(); c.moveTo(from.x, from.y); c.lineTo(to.x, to.y); c.stroke();
        }
        c.restore();
      }
      c.save(); c.translate(q.x, q.y); c.rotate(a); c.fillStyle = b.color; c.shadowColor = b.color; c.shadowBlur = 8;
      if (b.palm) { this.drawPalm(c, 0, 0, 28, .8, '#b485aa'); }
      else if (b.needle) { c.shadowBlur = 3; c.strokeStyle = b.color; c.lineWidth = 1.25; c.beginPath(); c.moveTo(-22, 0); c.lineTo(17, 0); c.stroke(); c.fillStyle = '#ffffed'; c.beginPath(); c.moveTo(21, 0); c.lineTo(8, -1.9); c.lineTo(11, 0); c.lineTo(8, 1.9); c.closePath(); c.fill(); }
      else if (b.team === 'player') { c.beginPath(); c.moveTo(17, 0); c.quadraticCurveTo(-2, -13, -13, -5); c.quadraticCurveTo(1, 0, -13, 5); c.quadraticCurveTo(0, 12, 17, 0); c.fill(); }
      else if (b.r > 8) { c.beginPath(); c.ellipse(0, 0, b.r * 1.2, b.r * .85, 0, 0, TAU); c.fill(); c.fillStyle = '#eef1c6'; c.beginPath(); c.arc(2, -2, b.r * .35, 0, TAU); c.fill(); }
      else { c.lineWidth = 2.8; c.strokeStyle = b.color; c.beginPath(); c.moveTo(-17, 0); c.lineTo(9, 0); c.stroke(); c.beginPath(); c.moveTo(11, 0); c.lineTo(3, -4); c.lineTo(3, 4); c.closePath(); c.fill(); }
      c.restore();
    }

    drawSlash(c, f) {
      const t = clamp(1 - f.life / f.max, 0, 1), a0 = f.angle - f.half + t * f.half * .7, a1 = f.angle + f.half - t * f.half * .3;
      c.save(); c.globalAlpha = Math.min(1, f.life / .13) * (1 - t * .5); c.strokeStyle = f.color; c.lineCap = 'round'; c.lineWidth = (f.thick || 5) * (1 - t * .7); c.beginPath(); c.arc(f.x, f.y, f.range * (.79 + t * .21), a0, a1); c.stroke(); c.globalAlpha *= .18; c.lineWidth = (f.thick || 5) * 3.5; c.stroke(); c.globalAlpha *= 1.8; c.lineWidth = 1.1; c.beginPath(); c.arc(f.x, f.y, f.range * (.58 + t * .2), a0 + .3, a1 - .3); c.stroke(); c.restore();
    }
    drawGroundEffect(c, f) {
      const t = clamp(1 - f.life / f.max, 0, 1); c.save(); c.globalAlpha = Math.min(1, f.life / .13); c.strokeStyle = f.color; c.fillStyle = f.color;
      if (f.type === 'ring') { const r = f.range * (.25 + Math.pow(t, .55) * .75); c.lineWidth = 5 * (1 - t) + 1; c.globalAlpha *= 1 - t; c.beginPath(); c.arc(f.x, f.y, r, 0, TAU); c.stroke(); c.lineWidth = 1; c.beginPath(); c.arc(f.x, f.y, r * .89, 0, TAU); c.stroke(); }
      else if (f.type === 'fieldPulse') {
        // The pulse is created by the damage tick itself, so the ground cue and
        // the small hit numbers cannot drift into separate animation timelines.
        const r = f.range * (.87 + t * .13), segments = f.kind === 'ice' ? 12 : f.kind === 'rain' ? 9 : 6;
        c.globalAlpha *= (1 - t) * .46; c.lineWidth = f.kind === 'ice' ? 1.6 : 1.2;
        for (let i = 0; i < segments; i++) {
          const a = i * TAU / segments + (f.kind === 'wind' ? t * .28 : 0);
          c.beginPath();
          if (f.kind === 'ice') {
            c.moveTo(f.x + Math.cos(a - .026) * r, f.y + Math.sin(a - .026) * r);
            c.lineTo(f.x + Math.cos(a) * (r + 8 * (1 - t)), f.y + Math.sin(a) * (r + 8 * (1 - t)));
            c.lineTo(f.x + Math.cos(a + .026) * r, f.y + Math.sin(a + .026) * r);
          } else c.arc(f.x, f.y, r, a, a + TAU / segments * .48);
          c.stroke();
        }
      }
      else if (f.type === 'healPulse') {
        const r = f.range * (.66 + t * .5); c.globalAlpha *= (1 - t) * .7; c.lineWidth = 1.2;
        for (let i = 0; i < 5; i++) { const a = i * TAU / 5; c.beginPath(); c.ellipse(f.x + Math.cos(a) * r * .5, f.y + Math.sin(a) * r * .5, r * .45, r * .18, a, 0, TAU); c.stroke(); }
        c.globalAlpha *= .5; c.beginPath(); c.arc(f.x, f.y, r * 1.15, 0, TAU); c.stroke();
      }
      else if (f.type === 'spawn') { c.globalAlpha = Math.sin(t * Math.PI) * .7; c.lineWidth = 2; c.beginPath(); c.arc(f.x, f.y, 22 + t * 18, 0, TAU); c.stroke(); }
      else if (f.type === 'lightning') { c.translate(f.x, f.y); c.rotate(f.angle); c.lineWidth = 2.4; c.shadowColor = '#fff1ad'; c.shadowBlur = 8; c.beginPath(); c.moveTo(0, 0); for (let i = 1; i < 9; i++) c.lineTo(f.range * i / 8, Math.sin(i * 12 + f.seed) * 13); c.stroke(); }
      else if (f.type === 'alliance') { c.globalAlpha = clamp((f.max - f.life) * 3.5, 0, 1) * Math.min(1, f.life / .65); c.lineWidth = 1.5; c.strokeStyle = '#f4e8b3'; c.beginPath(); c.arc(f.x, f.y, 190, 0, TAU); c.stroke(); c.setLineDash([4, 10]); c.beginPath(); c.arc(f.x, f.y, 212, 0, TAU); c.stroke(); c.setLineDash([]); this.alliancePositions(f).forEach((p, i) => { c.strokeStyle = COLORS[Object.keys(SKILLS)[i]]; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, 22, 0, TAU); c.stroke(); c.globalAlpha *= .95; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(f.x, f.y); c.stroke(); }); }
      c.restore();
    }
    drawAirEffect(c, f) {
      const t = clamp(1 - f.life / f.max, 0, 1), q = this.project(f.x, f.y, num(f.z, 26)); c.save(); c.globalAlpha = Math.min(1, f.life / .13); c.strokeStyle = f.color; c.fillStyle = f.color;
      if (f.type === 'trail') { const q2 = this.project(f.x2, f.y2, num(f.z, 26)); c.globalAlpha *= 1 - t; c.lineCap = 'round'; c.lineWidth = f.width * (1 - t * .7); c.beginPath(); c.moveTo(q.x, q.y); c.lineTo(q2.x, q2.y); c.stroke(); c.lineWidth *= .2; c.strokeStyle = '#fff3c8'; c.stroke(); }
      else if (f.type === 'palm') { this.drawPalm(c, q.x, q.y, (f.radius || 72) * (.7 + t * .7), (1 - t) * .55, '#c7a1be'); }
      else if (f.type === 'charge') { c.globalAlpha *= t; c.lineWidth = 2; c.beginPath(); c.arc(q.x, q.y, 20 * (1 - t) + 3, 0, TAU); c.stroke(); }
      c.restore();
    }
    alliancePositions(f) { return Object.keys(SKILLS).map((id, i) => { const a = -Math.PI / 2 + i * TAU / 7; return { id, x: f.x + Math.cos(a) * 190, y: f.y + Math.sin(a) * 190 }; }); }
    drawAllianceProjection(c, f, pos, i) {
      const appear = clamp((f.max - f.life) * 3.5, 0, 1), disappear = Math.min(1, f.life / .65), z = 5 + Math.sin(this.time * 3 + i) * 3, q = this.project(pos.x, pos.y, z), dir = this.screenDirection(Math.atan2(f.y - pos.y, f.x - pos.x));
      c.save(); c.globalAlpha = appear * disappear * .78; c.shadowColor = COLORS[pos.id]; c.shadowBlur = 13;
      // Original finale: Ma Sanniang still occupies the purple position.
      this.drawAllianceSword(c, q.x, q.y, COLORS[pos.id]);
      c.restore();
    }

    drawHazard(c, h) {
      if (h.dead || h.triggered) return;
      const t = clamp(h.elapsed / h.delay, 0, 1), color = h.high ? '218,83,62' : '216,172,62';
      c.save(); c.fillStyle = `rgba(${color},${.1 + t * .18})`; c.strokeStyle = h.high ? '#b74337' : '#ab842f'; c.lineWidth = h.high ? 2.4 : 1.7;
      const path = () => { c.beginPath(); if (h.kind === 'annulus') { c.arc(h.x,h.y,h.r,0,TAU); c.moveTo(h.x+h.inner,h.y); c.arc(h.x,h.y,h.inner,0,TAU,true); } else if (h.kind === 'circle') c.arc(h.x, h.y, h.r, 0, TAU); else if (h.kind === 'cone') { c.moveTo(h.x, h.y); c.arc(h.x, h.y, h.range, h.angle - h.half, h.angle + h.half); c.closePath(); } else if (h.kind === 'line') { const a = Math.atan2(h.y2 - h.y, h.x2 - h.x), nx = -Math.sin(a) * h.width / 2, ny = Math.cos(a) * h.width / 2; c.moveTo(h.x + nx, h.y + ny); c.lineTo(h.x2 + nx, h.y2 + ny); c.lineTo(h.x2 - nx, h.y2 - ny); c.lineTo(h.x - nx, h.y - ny); c.closePath(); } };
      path(); c.fill(); c.stroke();
      c.strokeStyle = h.high ? '#ffd0a2' : '#fff0af'; c.lineWidth = 3.1; c.globalAlpha = .45 + t * .5;
      if (h.kind === 'annulus') { c.beginPath(); c.arc(h.x,h.y,h.r,-Math.PI/2,-Math.PI/2+TAU*t); c.stroke(); c.beginPath(); c.arc(h.x,h.y,h.inner,0,TAU); c.stroke(); }
      else if (h.kind === 'circle') { c.beginPath(); c.arc(h.x, h.y, h.r, -Math.PI / 2, -Math.PI / 2 + TAU * t); c.stroke(); c.beginPath(); c.arc(h.x, h.y, h.r * t, 0, TAU); c.strokeStyle = `rgba(${color},.5)`; c.lineWidth = 1; c.stroke(); }
      else if (h.kind === 'cone') { c.beginPath(); c.arc(h.x, h.y, h.range, h.angle - h.half, h.angle - h.half + h.half * 2 * t); c.stroke(); }
      else { const x2 = mix(h.x, h.x2, t), y2 = mix(h.y, h.y2, t); c.beginPath(); c.moveTo(h.x, h.y); c.lineTo(x2, y2); c.stroke(); }
      if (h.high) { const x = h.kind === 'line' ? mix(h.x, h.x2, .55) : h.kind === 'cone' ? h.x + Math.cos(h.angle) * h.range * .65 : h.kind === 'annulus' ? h.x+(h.r+h.inner)/2 : h.x, y = h.kind === 'line' ? mix(h.y, h.y2, .55) : h.kind === 'cone' ? h.y + Math.sin(h.angle) * h.range * .65 : h.y; c.globalAlpha = .8; c.font = '700 16px "Songti SC",serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff2ce'; c.fillText('危', x, y); }
      c.restore();
    }
    drawHazardEdge(c, h) {
      if (h.dead || h.triggered || h.owner && h.owner.dead) return;
      const t = clamp(h.elapsed / h.delay, 0, 1); c.save(); c.strokeStyle = h.high ? '#ffba91' : '#f6df94'; c.globalAlpha = .45 + t * .4; c.lineWidth = h.high ? 2 : 1.4; c.setLineDash(t > .65 ? [] : [7, 6]); c.beginPath();
      if (h.kind === 'annulus') { c.arc(h.x,h.y,h.r,0,TAU); c.moveTo(h.x+h.inner,h.y); c.arc(h.x,h.y,h.inner,0,TAU,true); } else if (h.kind === 'circle') c.arc(h.x, h.y, h.r, 0, TAU);
      else if (h.kind === 'cone') { c.moveTo(h.x, h.y); c.arc(h.x, h.y, h.range, h.angle - h.half, h.angle + h.half); c.closePath(); }
      else if (h.kind === 'line') { const a = Math.atan2(h.y2 - h.y, h.x2 - h.x), nx = -Math.sin(a) * h.width / 2, ny = Math.cos(a) * h.width / 2; c.moveTo(h.x + nx, h.y + ny); c.lineTo(h.x2 + nx, h.y2 + ny); c.lineTo(h.x2 - nx, h.y2 - ny); c.lineTo(h.x - nx, h.y - ny); c.closePath(); }
      c.stroke(); c.restore();
    }
    drawPalm(c, x, y, size, alpha, color) {
      c.save(); c.translate(x, y); c.scale(size / 45, size / 45); c.globalAlpha *= alpha;
      c.beginPath(); c.moveTo(-16, 19); c.lineTo(-21, -1); c.quadraticCurveTo(-36, -13, -29, -18); c.quadraticCurveTo(-25, -21, -15, -11); c.lineTo(-17, -37); c.quadraticCurveTo(-16, -45, -10, -40); c.lineTo(-7, -15); c.lineTo(-7, -43); c.quadraticCurveTo(-2, -49, 2, -42); c.lineTo(3, -17); c.lineTo(6, -39); c.quadraticCurveTo(12, -45, 14, -37); c.lineTo(12, -13); c.lineTo(18, -31); c.quadraticCurveTo(23, -35, 25, -27); c.lineTo(20, 3); c.quadraticCurveTo(17, 18, 8, 21); c.closePath();
      c.fillStyle = '#3e304acc'; c.fill(); c.strokeStyle = color; c.lineWidth = 1.8; c.stroke(); c.strokeStyle = '#edcfda'; c.lineWidth = .9; c.beginPath(); c.moveTo(-10, 6); c.quadraticCurveTo(0, -4, 12, 0); c.moveTo(-9, -4); c.quadraticCurveTo(2, -11, 14, -7); c.stroke(); c.restore();
    }
    drawField(c, f) {
      c.save(); const alpha = Math.min(1, f.life, (f.max - f.life) * 4); c.globalAlpha = alpha;
      const g = c.createRadialGradient(f.x, f.y, 8, f.x, f.y, f.r); g.addColorStop(0, f.team === 'enemy' ? '#59733855' : f.kind === 'ice' ? '#a5e2ec12' : '#d8e9bb09'); g.addColorStop(.75, f.team === 'enemy' ? '#67834b55' : f.kind === 'ice' ? '#93dbea3b' : '#c7e2b326'); g.addColorStop(1, '#dbecc300'); c.fillStyle = g; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill();
      c.strokeStyle = f.color; c.lineWidth = 1.3; c.globalAlpha = alpha * .6; c.setLineDash(f.team === 'enemy' ? [6, 5] : [3, 11]); c.beginPath(); c.arc(f.x, f.y, f.r * .96, 0, TAU); c.stroke(); c.setLineDash([]);
      if (f.kind === 'wind') for (let i = 0; i < 7; i++) { const r = f.r * (.28 + i * .1), a = this.time * (i % 2 ? 2.1 : -1.7) + i * 1.3; c.globalAlpha = alpha * (.2 + i * .07); c.lineWidth = i % 3 === 0 ? 4 : 1.8; c.beginPath(); c.ellipse(f.x, f.y, r, r, 0, a, a + 1.5); c.stroke(); }
      else if (f.kind === 'ice') for (let i = 0; i < 16; i++) { const a = i * 2.4, r = (i * 37 % (f.r - 20)), x = f.x + Math.cos(a) * r, y = f.y + Math.sin(a) * r; c.globalAlpha = alpha * (.35 + Math.sin(this.time * 3 + i) * .2); c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x + 6, y); c.moveTo(x - 3, y - 5); c.lineTo(x + 3, y + 5); c.moveTo(x + 3, y - 5); c.lineTo(x - 3, y + 5); c.stroke(); }
      else if (f.kind === 'rain') for (let i = 0; i < 25; i++) { const a = i * 2.4, r = i * 31 % (f.r - 15), x = f.x + Math.cos(a) * r, y = f.y + Math.sin(a) * r + (this.time * 60 + i * 7) % 30 - 15; c.globalAlpha = alpha * .4; c.beginPath(); c.moveTo(x, y - 9); c.lineTo(x - 3, y + 3); c.stroke(); }
      else { c.globalAlpha = alpha * .27; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(f.x + Math.cos(i * 2.4 + this.time * .12) * f.r * .6, f.y + Math.sin(i * 2.4) * f.r * .55, 14 + Math.sin(this.time * 2 + i) * 5, 0, TAU); c.fillStyle = '#bac38d'; c.fill(); } }
      c.restore();
    }

    drawFallbackHero(c, x, y, dir = this.screenDirection(this.p.dir)) {
      const id = this.hero.id, face = id === 'hongmao' ? '#eaa572' : id === 'lantu' ? '#f2ece0' : id === 'daben' ? '#b99468' : '#e0cc96';
      c.save(); c.translate(x, y); const flip = Math.cos(dir) < -.2 ? -1 : 1; c.scale(flip * 1.04, 1.04);
      c.fillStyle = '#344b3b'; c.beginPath(); c.ellipse(-9, -2, 7, 5, -.1, 0, TAU); c.ellipse(9, -2, 7, 5, .1, 0, TAU); c.fill();
      c.fillStyle = this.color; c.strokeStyle = '#344d3c'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-12, -34); c.quadraticCurveTo(-15, -13, -19, -6); c.quadraticCurveTo(0, 1, 19, -6); c.quadraticCurveTo(14, -23, 11, -34); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = '#efe4c3'; c.lineWidth = 3; c.beginPath(); c.moveTo(-7, -33); c.lineTo(3, -20); c.lineTo(11, -32); c.stroke(); c.strokeStyle = '#54654b'; c.lineWidth = 4; c.beginPath(); c.moveTo(-13, -17); c.lineTo(14, -17); c.stroke();
      c.fillStyle = face;
      if (id === 'lantu') { c.beginPath(); c.ellipse(-9, -63, 5, 16, -.2, 0, TAU); c.ellipse(9, -64, 5, 16, .15, 0, TAU); c.fill(); c.fillStyle = '#d9b6b8'; c.beginPath(); c.ellipse(-9, -64, 2, 10, -.2, 0, TAU); c.ellipse(9, -65, 2, 10, .15, 0, TAU); c.fill(); }
      else if (id === 'daben' || id === 'tiaotiao') { c.beginPath(); c.arc(-16, -48, 7, 0, TAU); c.arc(16, -48, 7, 0, TAU); c.fill(); }
      else { c.beginPath(); c.moveTo(-16, -45); c.lineTo(-18, -63); c.lineTo(-2, -53); c.moveTo(16, -45); c.lineTo(18, -63); c.lineTo(2, -53); c.fill(); }
      c.fillStyle = face; c.beginPath(); c.ellipse(0, -44, 18, 17, 0, 0, TAU); c.fill(); c.fillStyle = '#f4e7cc'; c.beginPath(); c.ellipse(3, -37, 12, 8, 0, 0, TAU); c.fill();
      c.strokeStyle = '#304a40'; c.lineWidth = 2.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(-10, -46); c.lineTo(-4, -45); c.moveTo(5, -45); c.lineTo(11, -46); c.stroke(); c.fillStyle = '#705e50'; c.beginPath(); c.ellipse(1, -38, 2.7, 1.8, 0, 0, TAU); c.fill();
      c.strokeStyle = '#eeddb3'; c.lineWidth = 2.7; c.beginPath(); c.moveTo(-12, -28); c.lineTo(-20, -15); c.moveTo(12, -28); c.lineTo(23, -23); c.stroke(); c.restore();
    }

    drawEnemySprite(c, e) {
      if(e.mythicId&&window.MythicBossArt?.draw(c,e,this.time))return;
      if(e.towerFamily&&window.TowerArt?.draw(c,e,this.time)){
        if(!e.dead&&e.spawn<=0&&!e.boss){const scale=e.captain?1.2:e.kind==='heavy'?1.08:.92,y=e.y-107*scale;
          c.save();if(e.captain||e.hp<e.maxHp){c.fillStyle='#183c35dd';c.fillRect(e.x-23,y,46,5);c.fillStyle='#dbcd8c';c.fillRect(e.x-22,y+1,44*clamp(e.hp/e.maxHp,0,1),3);}
          if(e.captain){c.font='bold 11px sans-serif';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#20332e';c.fillStyle='#ffe0a0';c.strokeText(e.captainName,e.x,y-7);c.fillText(e.captainName,e.x,y-7);}c.restore();
        }return;
      }
      const villainId = e.boss && window.SevenVillainArt?.resolve(this.enc.boss?.name, e.kind);
      if (villainId) {
        c.save();
        if (e.dead) { const fade=clamp(1-(this.time-e.deathTime)/.36,0,1); c.globalAlpha*=fade; c.translate(e.x,e.y); c.scale(1+(1-fade)*.12,.55+fade*.45); c.translate(-e.x,-e.y); }
        else if (e.spawn>0) c.globalAlpha*=clamp(1-e.spawn/.8,0,1);
        const state=e.action>.1?'cast':e.stun<=0?'walk':'idle';
        window.SevenVillainArt.draw(c,villainId,e.x,e.y,villainId==='heixinhu'?151:villainId==='masanniang'?125:137,e.dir,this.time,{state,phase:e.action>.1?clamp(1-e.action,0,1):(this.time*1.8+e.seed*.13)%1});
        if (e.hit>0&&!e.dead) { c.globalAlpha*=e.hit/.13*.55;c.strokeStyle='#f5e8b9';c.lineWidth=1.5;c.beginPath();c.ellipse(e.x,e.y-61,30,58,0,0,TAU);c.stroke(); }
        c.restore();return;
      }
      if (e.boss && this.enc.boss && (this.enc.boss.name === '马三娘' || this.enc.boss.kind === 'masanniang') && window.SevenFinale && typeof window.SevenFinale.drawMaSanniang === 'function') {
        c.save();
        if (e.dead) c.globalAlpha = clamp(1 - (this.time - e.deathTime) / .36, 0, 1);
        else if (e.spawn > 0) c.globalAlpha = clamp(1 - e.spawn / .8, 0, 1);
        const state = e.action > .1 ? 'cast' : e.stun <= 0 ? 'walk' : 'idle';
        window.SevenFinale.drawMaSanniang(c, e.x, e.y, 125, e.dir, this.time, { state, phase: e.action > .1 ? clamp(1 - e.action, 0, 1) : this.time * 1.8 % 1 });
        if (e.hit > 0 && !e.dead) { c.globalAlpha = e.hit / .13 * .55; c.strokeStyle = '#f5e8b9'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(e.x, e.y - 54, 27, 51, 0, 0, TAU); c.stroke(); }
        c.restore(); return;
      }
      if (e.kind === 'dummy') {
        c.save(); c.translate(e.x, e.y); c.globalAlpha = e.dead ? Math.max(0, 1 - (this.time - e.deathTime) / .36) : 1; c.rotate(Math.sin(e.hit * 35) * e.hit * .12);
        c.fillStyle = '#786346'; c.strokeStyle = '#4d513c'; c.lineWidth = 1.4; c.fillRect(-7, -82, 14, 84); c.strokeRect(-7, -82, 14, 84); c.fillStyle = '#a78a57'; c.fillRect(-36, -59, 72, 10); c.strokeRect(-36, -59, 72, 10); c.fillStyle = '#c7b78a'; c.fillRect(-10, -37, 20, 9); c.strokeStyle = '#e3d4a5'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, -69, 15, 16, 0, 0, TAU); c.stroke(); c.fillStyle = '#ddd0a6'; c.fillRect(-18, -5, 36, 5); c.restore(); return;
      }
      const scale = e.boss ? 1.39 : e.captain ? 1.28 : e.kind === 'heavy' ? 1.13 : .94;
      const back = Math.sin(e.dir) < -.35, moving = e.action <= 0 && e.stun <= 0;
      const step = moving ? Math.sin(this.time * (e.boss ? 8 : 12) + e.seed) : 0;
      const robe = e.captain ? (e.kind==='archer'?['#a98543','#595333']:e.kind==='assassin'?['#92719d','#4c3b62']:['#aa7954','#624638']) : e.boss ? e.kind === 'assassin' ? ['#927295', '#4f425d'] : e.kind === 'boar' ? ['#839064', '#475740'] : ['#6c5158', '#322f3c'] : e.kind === 'archer' ? ['#7b8760', '#3d5746'] : ['#66766a', '#304c43'];
      const fur = e.boss ? (e.kind === 'tiger' || e.kind === 'blackheart') ? ['#e0bc84', '#b28655'] : e.kind === 'boar' ? ['#d8bda2', '#b18d71'] : ['#e5d4c3', '#b99d92'] : ['#c4c8ac', '#879888'];
      const gradient = (a, b, y1, y2) => { const g = c.createLinearGradient(-17, y1, 18, y2); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
      const path = (draw, fill, stroke = '#34483dd9', width = 1) => { c.beginPath(); draw(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); } };
      c.save();
      if (e.dead) { const life = clamp(1 - (this.time - e.deathTime) / .36, 0, 1); c.globalAlpha = life; c.translate(e.x, e.y); c.scale(1 + (1 - life) * .15, .55 + life * .45); c.translate(-e.x, -e.y); }
      if (e.spawn > 0) c.globalAlpha = clamp(1 - e.spawn / .8, 0, 1);
      c.translate(e.x, e.y + (moving ? Math.abs(step) * 1.15 : 0)); c.scale(Math.cos(e.dir) < -.1 ? -scale : scale, scale);
      if (e.boss || e.captain || e.kind === 'assassin') path(() => { c.moveTo(-15, -46); c.quadraticCurveTo(-25, -34, -28 + step * 2, -5); c.lineTo(-9, -11); c.lineTo(2, -4); c.lineTo(12, -10); c.lineTo(26, -5); c.quadraticCurveTo(23, -35, 13, -46); c.closePath(); }, gradient(e.boss ? '#895764' : '#687783', '#343e40', -46, -5));
      if(e.captain) { path(()=>{c.moveTo(-21,-45);c.lineTo(-25,-99);c.lineTo(5,-90);c.lineTo(-23,-79);c.closePath();},'#ad713b','#f4cf76',1.6); }
      for (const side of [-1, 1]) {
        const foot = side * 7, shift = step * side * 2.6;
        path(() => { c.moveTo(foot - 4, -19); c.lineTo(foot + 4, -19); c.lineTo(foot + 4 + shift, -4); c.lineTo(foot - 4 + shift, -4); c.closePath(); }, '#526355');
        path(() => { c.moveTo(foot - 5 + shift, -8); c.lineTo(foot + 5 + shift, -8); c.quadraticCurveTo(foot + 10 + shift, -3, foot + 8 + shift, 0); c.lineTo(foot - 5 + shift, 0); c.closePath(); }, gradient('#455c4d', '#263e35', -8, 0));
        c.strokeStyle = '#c0b18a'; c.lineWidth = 1; c.beginPath(); c.moveTo(foot - 4 + shift, -7); c.lineTo(foot + 5 + shift, -7); c.stroke();
      }
      path(() => { c.moveTo(-13, -47); c.quadraticCurveTo(-19, -35, -19, -15); c.lineTo(-9, -10); c.lineTo(0, -14); c.lineTo(10, -10); c.lineTo(20, -15); c.quadraticCurveTo(17, -36, 13, -47); c.closePath(); }, gradient(robe[0], robe[1], -46, -10));
      path(() => { c.moveTo(-7, -44); c.lineTo(0, -36); c.lineTo(7, -45); c.lineTo(8, -19); c.lineTo(0, -15); c.lineTo(-8, -19); c.closePath(); }, back ? robe[1] : e.boss ? '#a28d62' : '#889584', null);
      if (!back) { c.strokeStyle = e.boss ? '#dcc490' : '#bec5a5'; c.lineWidth = 2; c.beginPath(); c.moveTo(-11, -45); c.lineTo(2, -30); c.lineTo(11, -44); c.stroke(); c.lineWidth = .8; c.beginPath(); c.moveTo(-10, -32); c.lineTo(-9, -17); c.moveTo(10, -32); c.lineTo(10, -17); c.stroke(); }
      else { c.strokeStyle = '#b6bda087'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -42); c.quadraticCurveTo(4, -28, 0, -17); c.stroke(); }
      path(() => { c.moveTo(-17, -29); c.lineTo(17, -29); c.lineTo(17, -23); c.quadraticCurveTo(0, -21, -17, -23); c.closePath(); }, gradient(e.boss ? '#c6a15f' : '#ad8060', '#7b604b', -29, -22));
      c.fillStyle = '#e0c893'; c.fillRect(-2.5, -29, 5, 7); c.fillStyle = '#637660'; c.fillRect(-1.3, -27.5, 2.6, 4);
      if (e.kind === 'heavy' || e.kind === 'boar') for (const side of [-1, 1]) path(() => { c.moveTo(side * 9, -46); c.lineTo(side * 19, -45); c.lineTo(side * 22, -37); c.lineTo(side * 12, -35); c.closePath(); }, gradient('#a8aa87', '#6f8066', -46, -35), '#586c55');
      for (const side of [-1, 1]) {
        c.save(); c.translate(side * 14, -41); c.rotate(side * (e.action > .1 ? -.17 : .12 + step * .04));
        path(() => { c.moveTo(-4, -3); c.quadraticCurveTo(-6, 6, -4, 14); c.lineTo(5, 15); c.lineTo(7, 1); c.closePath(); }, gradient(robe[0], robe[1], -3, 14));
        c.fillStyle = '#b5a17d'; c.fillRect(-4, 10, 9, 4); path(() => c.ellipse(1, 17, 4.8, 5.2, 0, 0, TAU), gradient(fur[0], fur[1], 12, 22)); c.restore();
      }
      c.fillStyle = gradient(fur[0], fur[1], -76, -48);
      if (e.kind === 'tiger' || e.kind === 'blackheart' || e.kind === 'heavy') { c.beginPath(); c.ellipse(-12, -69, 6.4, 7.2, -.2, 0, TAU); c.ellipse(12, -69, 6.4, 7.2, .2, 0, TAU); c.fill(); c.fillStyle = '#765c48'; c.beginPath(); c.ellipse(-12, -69, 3.7, 4.6, -.2, 0, TAU); c.ellipse(12, -69, 3.7, 4.6, .2, 0, TAU); c.fill(); }
      else if (e.kind === 'boar') path(() => { c.moveTo(-13, -64); c.lineTo(-25, -69); c.lineTo(-19, -55); c.moveTo(13, -64); c.lineTo(25, -69); c.lineTo(19, -55); }, gradient(fur[0], fur[1], -70, -55));
      else path(() => { c.moveTo(-14, -57); c.lineTo(-16, -78); c.lineTo(-3, -68); c.moveTo(14, -57); c.lineTo(17, -77); c.lineTo(3, -68); }, gradient(fur[0], fur[1], -77, -56));
      path(() => c.ellipse(0, -59, e.kind === 'boar' ? 18 : 16, 15.8, 0, 0, TAU), gradient(fur[0], fur[1], -74, -43));
      if (!back) {
        path(() => c.ellipse(1, -52, 11.8, 8.3, 0, 0, TAU), gradient('#f1e3bd', '#d7c4a0', -59, -44), null);
        c.fillStyle = '#f5efda'; c.beginPath(); c.ellipse(-7, -61, 5.3, 4.5, .06, 0, TAU); c.ellipse(7, -61, 5.3, 4.5, -.06, 0, TAU); c.fill(); c.fillStyle = '#2d4037'; c.beginPath(); c.ellipse(-6, -60, 2, 3, 0, 0, TAU); c.ellipse(6, -60, 2, 3, 0, 0, TAU); c.fill(); c.strokeStyle = '#344437'; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(-12, -65); c.lineTo(-3, -62); c.moveTo(3, -62); c.lineTo(12, -65); c.stroke();
        if (e.kind === 'boar') { path(() => c.ellipse(2, -52, 8, 5, -.08, 0, TAU), '#bd927c', '#90735e', .7); c.fillStyle = '#7a6455'; c.beginPath(); c.ellipse(-1, -52, 1.4, 2, 0, 0, TAU); c.ellipse(5, -52, 1.4, 2, 0, 0, TAU); c.fill(); path(() => { c.moveTo(-10, -49); c.quadraticCurveTo(-14, -54, -11, -59); c.lineTo(-7, -51); c.moveTo(12, -49); c.quadraticCurveTo(16, -54, 13, -59); c.lineTo(9, -51); }, '#eee1bb', '#b4a17f', .6); }
        else { path(() => { c.moveTo(-2.7, -55); c.lineTo(3.7, -55); c.quadraticCurveTo(2, -50, .4, -51); c.closePath(); }, '#675749', null); c.strokeStyle = '#796954'; c.lineWidth = .9; c.beginPath(); c.moveTo(0, -51); c.lineTo(0, -47); c.quadraticCurveTo(4, -45, 7, -48); c.stroke(); }
        if ((e.kind === 'tiger' || e.kind === 'blackheart') && e.boss) { c.strokeStyle = '#705641'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-5, -72); c.lineTo(5, -72); c.moveTo(-3, -68); c.lineTo(3, -68); c.moveTo(0, -74); c.lineTo(0, -65); c.moveTo(-15, -56); c.lineTo(-10, -53); c.moveTo(15, -56); c.lineTo(10, -53); c.stroke(); }
        if (!e.boss) path(() => { c.moveTo(-15, -55); c.quadraticCurveTo(0, -49, 15, -55); c.lineTo(12, -45); c.quadraticCurveTo(0, -39, -12, -45); c.closePath(); }, gradient('#617364', '#374e44', -55, -42));
      } else { c.strokeStyle = '#68776280'; c.lineWidth = .9; c.beginPath(); c.moveTo(-9, -52); c.quadraticCurveTo(0, -45, 9, -52); c.stroke(); }
      if (!e.boss) { path(() => { c.moveTo(-14, -70); c.quadraticCurveTo(0, -74, 15, -69); c.lineTo(15, -66); c.quadraticCurveTo(0, -70, -14, -66); c.closePath(); }, '#8c6555', null); c.strokeStyle = '#a88662'; c.lineWidth = 1; c.beginPath(); c.moveTo(13, -68); c.quadraticCurveTo(23, -64, 22, -52); c.stroke(); }
      c.save(); c.translate(19, -24);
      if (e.kind === 'archer') { c.rotate(-.16); c.strokeStyle = '#8c704e'; c.lineWidth = 3.2; c.beginPath(); c.moveTo(1, -26); c.bezierCurveTo(23, -15, 23, 8, 1, 21); c.stroke(); c.strokeStyle = '#ddd7b3'; c.lineWidth = .8; c.beginPath(); c.moveTo(1, -26); c.lineTo(e.action > .1 ? -8 : 4, -3); c.lineTo(1, 21); c.stroke(); }
      else { c.rotate(-1.15 + (e.action > .1 ? -.65 : .14 + step * .03)); path(() => { c.moveTo(-3, -2); c.lineTo(25, -2); c.lineTo(34, 0); c.lineTo(25, 2); c.lineTo(-3, 2); c.closePath(); }, gradient('#e6e8d0', '#8baba5', -3, 3), '#536e64', .65); c.strokeStyle = '#c1ad77'; c.lineWidth = 3.3; c.beginPath(); c.moveTo(0, -6); c.lineTo(0, 6); c.stroke(); c.strokeStyle = '#715a46'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(-2, 0); c.lineTo(-11, 0); c.stroke(); if (e.kind === 'boar' || e.kind === 'heavy') { path(() => c.arc(31, 0, 9, 0, TAU), gradient('#a1a98a', '#697e65', -9, 9), '#526751'); c.fillStyle = '#c2c6a1'; c.beginPath(); c.arc(28, -3, 2, 0, TAU); c.fill(); } }
      c.restore(); c.restore();
      if (!e.dead && e.spawn <= 0) {
        if(e.captain){c.save();c.font='bold 12px sans-serif';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#302c29';c.fillStyle='#ffe09a';c.strokeText(e.captainName,e.x,e.y-112*scale);c.fillText(e.captainName,e.x,e.y-112*scale);c.restore();}
        if (!e.boss && (e.captain || e.hp < e.maxHp)) { c.save(); c.fillStyle = '#253d30aa'; c.fillRect(e.x - 22, e.y - 85 * scale, 44, 4); c.fillStyle = '#c8ad78'; c.fillRect(e.x - 21, e.y - 85 * scale + 1, 42 * Math.max(0, e.hp / e.maxHp), 2); c.restore(); }
        if (e.hit > 0) { c.save(); c.globalAlpha = e.hit / .13 * .7; c.strokeStyle = '#f5e8b9'; c.lineWidth = 1.4; c.beginPath(); c.ellipse(e.x, e.y - 43 * scale, 21 * scale, 38 * scale, 0, 0, TAU); c.stroke(); c.restore(); }
        if (e.burn) { c.save(); c.fillStyle = '#f9b273'; c.globalAlpha = .7; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(e.x - 10 + i * 9, e.y - 24 - (this.time * 23 + i * 9) % 24, 2.6, 5, .2, 0, TAU); c.fill(); } c.restore(); }
        if (e.poison) { c.fillStyle = '#c2e397'; c.beginPath(); c.arc(e.x + 17, e.y - 52, 3.2, 0, TAU); c.fill(); }
      }
    }

    drawAllianceSword(c, x, y, color) {
      c.save(); c.translate(x, y); c.fillStyle = color; c.shadowColor = color; c.shadowBlur = 12;
      c.beginPath(); c.moveTo(0, -70); c.lineTo(5, -51); c.lineTo(3, -19); c.lineTo(-3, -19); c.lineTo(-5, -51); c.closePath(); c.fill();
      c.strokeStyle = '#f6e5b5'; c.lineWidth = 3; c.beginPath(); c.moveTo(-10, -17); c.lineTo(10, -17); c.moveTo(0, -18); c.lineTo(0, -4); c.stroke(); c.restore();
    }
  }

  window.SevenCombat = {
    version: 9,
    skills: SKILLS,
    profiles: PROFILES,
    moveBalance: MOVE_BALANCE,
    qin: QIN,
    changhong: CHANGHONG,
    firewhirl: FIREWHIRL,
    get instance() { return active; },
    start(opts) { if (active) active.destroy(); active = new Combat(opts); active.run(); window.SevenBGM?.setScene('battle'); window.SevenBGM?.refresh(); return active; },
    stop() { if (active) active.destroy(); active = null; },
    pause(flag) { if (active) active.pause(flag); }
  };
})();
