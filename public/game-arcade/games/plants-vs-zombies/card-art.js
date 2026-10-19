(function(root){'use strict';
// Image-generated artwork, grouped in the same fixed order as the 49 classic plants.
// Every atlas has five columns and two rows. A 1.5% inset excludes neighbouring pixels.
const groups=[
['peashooter','sunflower','cherry-bomb','wall-nut','potato-mine','snow-pea','chomper','repeater','puff-shroom','sun-shroom'],
['fume-shroom','grave-buster','hypno-shroom','scaredy-shroom','ice-shroom','doom-shroom','lily-pad','squash','threepeater','tangle-kelp'],
['jalapeno','spikeweed','torchwood','tall-nut','sea-shroom','plantern','cactus','blover','split-pea','starfruit'],
['pumpkin','magnet-shroom','cabbage-pult','flower-pot','kernel-pult','coffee-bean','garlic','umbrella-leaf','marigold','melon-pult'],
['gatling-pea','twin-sunflower','gloom-shroom','cattail','winter-melon','gold-magnet','spikerock','cob-cannon','imitater']
];
const atlasFiles=["../../../assets/media/3c44aec589cc7a1a2e8c1bea114e6a87a01c6ea412365397d6c1225a471bf20f.webp","../../../assets/media/8656d412b082a33dd0d88fa6a8464c04ebe9f8a1f8e9ddc6fc213f1f0c0ecda2.webp","../../../assets/media/22e7749849e01fdcb49d33af84b03a825fd5a1ca5d9c70063ba7de077eff26b1.webp","../../../assets/media/b9de846aab6d7192c1eec6cf014d80fa4281b3c9e25ee1e7b4dcf41d0d946ca5.webp","../../../assets/media/36b57c693f83ccdb23399a3e1c9dd6e39a4e0db8025b63847c87982d4db6a272.webp"];
const atlases=Object.freeze(groups.map((ids,i)=>Object.freeze({src:atlasFiles[i],columns:5,rows:2,ids:Object.freeze(ids)})));
const manifest=Object.freeze(Object.fromEntries(atlases.flatMap((atlas,a)=>atlas.ids.map((id,i)=>[id,Object.freeze({atlas:a,col:i%5,row:Math.floor(i/5)})]))));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inset=.015,visible=1-2*inset;
function sprite(id){const entry=manifest[id];if(!entry)return null;const atlas=atlases[entry.atlas];return {...entry,src:atlas.src,size:(100*atlas.columns/visible)+'% '+(100*atlas.rows/visible)+'%',position:(100*(entry.col+inset)/(atlas.columns-visible))+'% '+(100*(entry.row+inset)/(atlas.rows-visible))+'%'};}
function html(id,label,extra=''){const art=sprite(id);return '<span class="plant-portrait '+escape(extra)+'" data-plant-art="'+escape(id)+'"'+(art?' data-atlas="'+art.atlas+'" style="--art-image:url('+art.src+');--art-size:'+art.size+';--art-position:'+art.position+'"':'')+' aria-hidden="true">'+(art?'<span class="portrait-image"></span>':'')+'<span class="portrait-fallback">'+escape(Array.from(label||id).slice(0,2).join(''))+'</span></span>';}
let pending=null;const images=[],status=atlases.map(()=> 'idle');
function preload(){if(pending)return pending;if(!root.Image||!root.document)return Promise.resolve([]);
 const progress=()=>root.PVZAssetLoading?.setGroup('cards',{loaded:status.filter(s=>s==='ready'||s==='error').length,total:atlases.length,errors:status.flatMap((s,i)=>s==='error'?['card-atlas-'+i]:[])});progress();
 pending=Promise.all(atlases.map((atlas,i)=>new Promise(resolve=>{const image=new root.Image();image.decoding='async';images.push(image);status[i]='loading';
 const finish=ok=>{status[i]=ok?'ready':'error';if(ok)root.document.documentElement.classList.add('plant-art-ready-'+i);progress();resolve(ok);};
 image.onload=async()=>{try{if(typeof image.decode==='function')await image.decode();finish(!!image.naturalWidth&&!!image.naturalHeight&&Math.abs(image.naturalWidth/image.naturalHeight-atlas.columns/atlas.rows)<=.025);}catch(_){finish(false);}};
 image.onerror=()=>finish(false);image.src=atlas.src;})));return pending;
}
const api={atlases,manifest,sprite,html,preload,get status(){return status.slice();}};root.PVZCardArt=api;if(typeof module!=='undefined')module.exports=api;
if(root.document)preload();
})(typeof globalThis!=='undefined'?globalThis:this);
