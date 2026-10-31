/* Display-only language adapter. Game IDs, economy, saved state and music stay unchanged. */
(()=>{'use strict';
const key='neon-arcade.locale',locales=['zh-Hans','zh-Hant','en'],dict=window.FrostLocaleData||{},sources=new WeakMap(),attributes=new WeakMap(),cache=new Map();
const normalize=v=>/^en(?:-|$)/i.test(v||'')?'en':/^zh(?:-|$)/i.test(v||'')?(/hant|tw|hk|mo/i.test(v)?'zh-Hant':'zh-Hans'):null;
let saved;try{saved=localStorage.getItem(key);}catch{}
let locale=normalize(new URL(location.href).searchParams.get('lang'))||normalize(saved)||normalize(navigator.languages?.[0]||navigator.language)||'en';
function t(value){const text=String(value??'');if(locale==='zh-Hans'||!/[\u3400-\u9fff]/.test(text))return text;const id=locale+'\0'+text;if(cache.has(id))return cache.get(id);let out=text;
 if(locale==='en'){
  out=out.replace(/建设 (\d+) \/ (\d+) 阶/g,'Tier $1 / $2').replace(/无尽第 (\d+) 波/g,'Endless wave $1').replace(/第 (\d+) 波交战中/g,'Wave $1 in combat').replace(/第 (\d+) 波待命/g,'Wave $1 ready').replace(/已守住 (\d+) 波/g,'$1 waves held').replace(/立即派遣第 (\d+) 波/g,'Dispatch wave $1').replace(/防寒落后 (\d+) 阶/g,'Cold resistance $1 tiers behind').replace(/升至 Lv\./g,'Upgrade to Lv.');
 }
 out=out.replace(/[\u3400-\u9fff]+/g,part=>{const translated=dict[locale]?.[part];return translated===undefined?part:locale==='en'?' '+translated+' ':translated;});
 if(locale==='en')out=out.replace(/，|、/g,', ').replace(/。/g,'. ').replace(/；/g,'; ').replace(/：/g,': ').replace(/！/g,'! ').replace(/？/g,'? ').replace(/[「」]/g,'"').replace(/（/g,' (').replace(/）/g,') ').replace(/[ \t]+/g,' ').replace(/ +([,.;:!?])/g,'$1').trim();
 if(cache.size>2500)cache.clear();cache.set(id,out);return out;
}
function setText(el,value){const raw=String(value??'');sources.set(el,raw);const next=t(raw);if(el.textContent!==next)el.textContent=next;}
function setAttribute(el,name,value){const raw=String(value??'');let a=attributes.get(el);if(!a){a={};attributes.set(el,a);}a[name]=raw;const next=t(raw);if(el.getAttribute(name)!==next)el.setAttribute(name,next);}
function apply(root=document){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=walker.nextNode()){const p=n.parentElement;if(!p||p.closest('script,style,textarea,select,[data-language-static]'))continue;let raw=sources.get(n);if(raw===undefined){raw=n.nodeValue;sources.set(n,raw);}const next=t(raw);if(n.nodeValue!==next)n.nodeValue=next;}
 if(root.nodeType===1&&sources.has(root))setText(root,sources.get(root));
 for(const el of root.querySelectorAll('*')){
  if(sources.has(el))setText(el,sources.get(el));
  if(el.closest('select,[data-language-static]'))continue;
  let a=attributes.get(el);if(!a){a={};attributes.set(el,a);}for(const attr of ['title','aria-label','placeholder']){const value=el.getAttribute(attr);if(value===null)continue;if(a[attr]===undefined)a[attr]=value;const next=t(a[attr]);if(value!==next)el.setAttribute(attr,next);}
 }
 document.documentElement.lang=locale;document.title=t('雪境工坊')+' · Frostworks v0.7';const select=document.getElementById('game-language');if(select)select.value=locale;
}
function setLocale(value,options={}){const next=normalize(value);if(!next)return;const changed=next!==locale;locale=next;try{if(options.persist!==false)localStorage.setItem(key,locale);}catch{}if(options.url!==false){try{const url=new URL(location.href);url.searchParams.set('lang',locale);history.replaceState(history.state,'',url);}catch{}}apply();if(changed)window.dispatchEvent(new CustomEvent('site:languagechange',{detail:{locale}}));}
const api=Object.freeze({t,setText,setAttribute,apply,setLocale,get locale(){return locale;},locales});window.FrostI18n=window.GameI18n=api;if(!window.SiteI18n)window.SiteI18n=api;
window.addEventListener('storage',e=>{if(e.key===key&&e.newValue)setLocale(e.newValue,{persist:false});});
window.addEventListener('popstate',()=>setLocale(new URL(location.href).searchParams.get('lang')||locale,{url:false}));
function ready(){document.getElementById('game-language')?.addEventListener('change',e=>setLocale(e.target.value));if(new URL(location.href).searchParams.get('debug')==='1')document.documentElement.dataset.debugTools='true';setLocale(locale,{url:false});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
