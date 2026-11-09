import {ZEBRA_PRICES,ZEBRA_MISSION_RULES} from '../game/animals/zebras/rules.ts';
import {PRICES,MONEY_RULES} from '../game/economy/prices.ts';
import {TICK_MS} from '../game/core/state.ts';
import {formatNumber} from './i18n-format.ts';
import type {ZebraCareSceneView} from './zebra-care-panel.ts';

export const zebraGuideCopy={
 id:{title:'Panduan Zebra Grasslands',notice:'Kebutuhan dan kesejahteraan ini adalah aturan permainan, bukan panduan merawat satwa nyata.',steps:[
  'Di Bangun, sambut Zaki, lalu Zuri, Mira, dan Kira. Sambungkan jalur pengamatan di luar pagar; setiap petak jalur berbiaya {path} ZC.',
  'Di Rawat, rencanakan pakan {food} ZC, bak air {water} ZC, dan naungan {shade} ZC. Pengayaan debu dan batang bersifat opsional, {enrichment} ZC. Tinjau lokasi, lalu konfirmasi pembelian.',
  'Fasilitas pakan, air, dan pengayaan mulai kosong. Isi ulang pakan {foodRefill} ZC, air {waterRefill} ZC, atau pengayaan {enrichmentRefill} ZC. Isi ulang menambah stok; Zebra tetap harus datang dan menyelesaikan kegiatan sebelum memperoleh manfaat.',
  'Sisakan ruang ke titik layanan. Zebra mencari pakan, air, dan naungan sesuai kebutuhan. Saling merawat memerlukan dua Zebra yang benar-benar bertemu; berlari kecil dan pengayaan tidak menggantikan kebutuhan pokok.',
  'Buka Misi untuk ZQ01–ZQ04. ZQ02 memerlukan keempat Zebra sudah makan dan minum serta masing-masing sejahtera ≥60 selama {comfortable} detik simulasi aktif berturut-turut. ZQ04 memerlukan masing-masing sejahtera ≥70 selama {thriving} detik simulasi aktif berturut-turut dan {viewers} pengunjung Zebra berbayar yang selesai mengamati. Klaim setiap hadiah sekali.',
  'Jika koin sedikit, ikuti Pulihkan perawatan Zebra. Penghapusan yang dikonfirmasi mengembalikan biaya konstruksi yang benar-benar dibayar; stok ikut hilang dan biaya isi ulang tidak dikembalikan. Perawatan rutin berbiaya {upkeep} ZC per habitat setiap {upkeepTime} detik simulasi. Di Tamu, satu tiket dibayar saat pengunjung masuk gerbang, bukan untuk setiap habitat.',
  'Kecepatan 10× mempercepat kebutuhan, biaya, dan waktu misi. Jeda menghentikan dunia. Periksa status Tersimpan sebelum pergi; Lanjutkan membuka simpanan dalam keadaan dijeda tanpa progres selama ditinggalkan.'
 ]},
 en:{title:'Zebra Grasslands guide',notice:'These needs and welfare scores are game rules, not instructions for caring for real wildlife.',steps:[
  'In Build, welcome Zaki, then Zuri, Mira and Kira. Connect the viewing path outside the fence; each path cell costs {path} ZC.',
  'In Care, plan a feeder for {food} ZC, a drinking trough for {water} ZC and shade for {shade} ZC. Dust and scratch enrichment is optional, at {enrichment} ZC. Review the location, then confirm the purchase.',
  'Feed, water and enrichment facilities start empty. Refill feed for {foodRefill} ZC, water for {waterRefill} ZC or enrichment for {enrichmentRefill} ZC. A refill adds stock; the Zebra still has to arrive and finish the activity before receiving its benefit.',
  'Leave clear routes to service points. Zebras seek feed, water and shade according to their needs. Mutual grooming requires two Zebras to actually meet; trotting and enrichment do not replace basic care.',
  'Open Missions for ZQ01–ZQ04. ZQ02 requires all four to have eaten and drunk, with each at welfare ≥60 for {comfortable} consecutive active simulation seconds. ZQ04 requires each at welfare ≥70 for {thriving} consecutive active simulation seconds and {viewers} paid Zebra visitors who finished viewing. Claim each reward once.',
  'When coins are low, follow Restore Zebra care. Confirmed removal returns actual construction spending; remaining stock is lost and refill fees are not returned. Upkeep costs {upkeep} ZC per habitat every {upkeepTime} simulation seconds. In Guests, one ticket is paid at the entrance, rather than at each habitat.',
  '10× speed accelerates needs, costs and mission time. Pause freezes the world. Check Saved before leaving; Continue opens the save paused, without progress while you were away.'
 ]}
}as const;
export function presentZebraGuide(locale:'id'|'en'){
 const values={upkeep:PRICES.maintenance,upkeepTime:MONEY_RULES.maintenanceTicks*TICK_MS/1000,path:PRICES.path,food:ZEBRA_PRICES['zebra-graze'],water:ZEBRA_PRICES['zebra-water'],shade:ZEBRA_PRICES['zebra-shade'],enrichment:ZEBRA_PRICES['zebra-enrichment'],foodRefill:ZEBRA_PRICES.foodRefill,waterRefill:ZEBRA_PRICES.waterRefill,enrichmentRefill:ZEBRA_PRICES.enrichmentRefill,comfortable:ZEBRA_MISSION_RULES.comfortableTicks*TICK_MS/1000,thriving:ZEBRA_MISSION_RULES.thrivingTicks*TICK_MS/1000,viewers:ZEBRA_MISSION_RULES.viewers},c=zebraGuideCopy[locale];
 return{title:c.title,notice:c.notice,steps:c.steps.map(text=>text.replace(/\{(\w+)\}/g,(_,key:string)=>formatNumber(values[key as keyof typeof values],locale)))};
}
/** Stable help in Care and the existing native Help dialog; no gameplay authority. */
export function mountZebraGuide(root:HTMLElement,host:HTMLElement,signal:AbortSignal){
 const surfaces=[['care',root.querySelector('[data-hud-pane="care"]')],['dialog',root.querySelector('#play-help')]]as const;
 const views=surfaces.flatMap(([kind,parent])=>{if(!parent)return[];const section=document.createElement(kind==='care'?'details':'section');section.dataset.zebraGuide=kind;section.style.cssText='border-top:1px solid #b4bea5;padding-block:12px;min-width:0;overflow-wrap:anywhere';const title=document.createElement(kind==='care'?'summary':'h3'),notice=document.createElement('p'),list=document.createElement('ol');title.style.cssText='min-height:44px;padding-block:10px;cursor:pointer';const lines=Array.from({length:7},()=>document.createElement('li'));list.append(...lines);section.append(title,notice,list);parent.insertBefore(section,kind==='dialog'?parent.querySelector('[data-close-dialog]'):null);return[{kind,section,title,notice,lines}];});
 let exists=false,visible=false,locale:'id'|'en'='id',key='';function render(){for(const v of views)v.section.hidden=!exists||(v.kind==='care'&&!visible);const next=locale+':'+exists+':'+visible;if(next===key)return;key=next;const c=presentZebraGuide(locale);for(const v of views){v.section.lang=locale;v.title.textContent=c.title;v.notice.textContent=c.notice;v.lines.forEach((line,i)=>{line.textContent=c.steps[i]!;});}}
 host.addEventListener('scene-zebra-care-change',event=>{const v=(event as CustomEvent<ZebraCareSceneView>).detail;exists=v.exists;locale=v.locale;render();},{signal});signal.addEventListener('abort',()=>views.forEach(v=>v.section.remove()),{once:true});return{show(v:boolean,l:'id'|'en'){visible=v;locale=l;render();}};
}
