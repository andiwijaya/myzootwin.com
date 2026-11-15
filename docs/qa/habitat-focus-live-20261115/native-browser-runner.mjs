import {readFile,writeFile} from 'node:fs/promises';

// This helper runs only inside cua_repl. All input uses documented CUA APIs.
// Page evaluation reads DOM presentation only. No game state, storage or JS hooks.
export async function habitatLiveRunner(tab,evidence){
 const matrix=JSON.parse(await readFile(evidence+'/internal-matrix.json','utf8'));
 const errors=[];
 const names={'macaw-aviary':'Macaw Aviary','elephant-grove':'Elephant Grove','lion-savanna':'Lion Savanna','giraffe-plains':'Giraffe Plains','zebra-grasslands':'Zebra Grasslands'};
 const focus={'macaw-aviary':'Macaw','elephant-grove':'Elephant','lion-savanna':'Focus Lion Savanna','giraffe-plains':'Giraffe','zebra-grasslands':'View Zebra Grasslands'};
 const state=async()=>tab.playwright.evaluate(()=>{
  const root=document.querySelector('[data-play-entry]'),s=document.querySelector('[data-preview-stage]');
  const visible=e=>{if(!e)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden';};
  const r=s?.getBoundingClientRect();return{url:location.href,kind:root?.getAttribute('data-habitat-focus'),paused:document.querySelector('[data-pause-toggle]')?.getAttribute('aria-pressed'),zoom:Number(s?.getAttribute('data-camera-zoom')),panX:Number(s?.getAttribute('data-camera-pan-x')),panZ:Number(s?.getAttribute('data-camera-pan-z')),angle:Number(s?.getAttribute('data-camera-azimuth')),viewport:{width:document.documentElement.clientWidth,height:document.documentElement.clientHeight},stage:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,toolbar:document.querySelector('[data-habitat-focus-toolbar]')?.innerText,visibleKinds:[...new Set([...document.querySelectorAll('[data-focus-kind]')].filter(visible).map(e=>e.getAttribute('data-focus-kind')))],selectedTab:document.querySelector('[role="tab"][aria-selected="true"]')?.getAttribute('data-hud-tab'),canvases:document.querySelectorAll('canvas').length,habitats:s?.getAttribute('data-built-habitats'),birds:s?.getAttribute('data-placed-birds'),elephants:s?.getAttribute('data-placed-elephants'),lions:s?.getAttribute('data-lion-residents'),giraffes:s?.getAttribute('data-giraffe-residents'),outsideBuild:visible(document.querySelector('[data-placement-tools]')),balance:document.querySelector('[data-hud-coins]')?.textContent,scripts:[...document.querySelectorAll('script[src]')].map(e=>e.getAttribute('src'))};
 });
 const click=async locator=>{await locator.press('Enter');await tab.getAXState({emit:false});};
 const select=async name=>{await click(tab.playwright.getByRole('tab',{name,exact:true}));if((await state()).selectedTab!==name.toLowerCase())throw Error('Selected tab mismatch '+name);};
 const camera=command=>click(tab.playwright.locator('[data-camera-command="'+command+'"]'));
 const save=()=>writeFile(evidence+'/internal-matrix.json',JSON.stringify(matrix,null,2));
 async function run(profile,size,kind){
  const r={profile,size,kind,at:new Date().toISOString(),browser:'internal',origin:'https://myzootwin.com',entryInput:'Native keyboard Enter on visible buttons and tabs; native arrow keys for pan'};
  try{
   let initial=await state();if(initial.kind)await click(tab.playwright.locator('[data-habitat-zoom-exit]'));
   if((await state()).paused==='true')await click(tab.playwright.locator('[data-pause-toggle]'));
   await select('Build');await click(tab.playwright.getByRole('button',{name:focus[kind],exact:true}));
   await tab.playwright.locator('[data-preview-stage]').press('Enter');await tab.getAXState({emit:false});
   const entry=tab.playwright.getByRole('button',{name:'Zoom habitat · '+names[kind],exact:true});
   await entry.waitFor({state:'visible'});r.before=await state();await entry.press('Enter');await tab.getAXState({emit:false});r.enter=await state();
   if(r.enter.kind!==kind)throw Error('Focus mismatch '+r.enter.kind);
   await camera('zoom-in');await camera('rotate-right');await tab.playwright.locator('[data-preview-stage]').press('ArrowRight');r.camera=await state();
   // 800 CSS pixels exceed local travel at relative125%. Another240 must clamp.
   for(let n=0;n<10;n++)await tab.playwright.locator('[data-preview-stage]').press('Shift+ArrowRight');r.edge=await state();
   for(let n=0;n<3;n++)await tab.playwright.locator('[data-preview-stage]').press('Shift+ArrowRight');r.edgeAgain=await state();
   await camera('zoom-out');r.zoomOut=await state();await camera('reset');await click(tab.playwright.locator('[data-pause-toggle]'));r.fit=await state();
   await select('Missions');r.missions=await state();await select('Build');r.build=await state();await select('Care');r.care=await state();
   r.geometry=await tab.playwright.evaluate(()=>{const b=document.querySelector('[data-habitat-zoom-exit]')?.getBoundingClientRect();return{back:b?{width:b.width,height:b.height,left:b.left,right:b.right,top:b.top,bottom:b.bottom}:null,zebras:['Zaki','Zuri','Mira','Kira'].every(n=>document.querySelector('[data-zebra-care]')?.textContent.includes(n))};});
   r.screenshot='internal-'+profile+'-'+kind+'.jpg';await tab.getAXState({emit:false});await writeFile(evidence+'/'+r.screenshot,await tab.getScreenshot({emit:false}));
   await click(tab.playwright.locator('[data-habitat-zoom-exit]'));r.exit=await state();
   r.checks={enter:r.enter.kind===kind,zoomAndRotate:r.camera.zoom===1.25&&r.camera.angle===45,pan:Math.abs(r.camera.panX)+Math.abs(r.camera.panZ)>0,panBounded:Math.abs(r.edge.panX-r.edgeAgain.panX)<1e-8&&Math.abs(r.edge.panZ-r.edgeAgain.panZ)<1e-8,zoomOut:r.zoomOut.zoom<r.camera.zoom,fit:r.fit.zoom===1&&r.fit.angle===0,scopedPanels:[r.enter,r.missions,r.build,r.care].every(s=>s.visibleKinds.every(k=>k===kind))&&r.care.visibleKinds.includes(kind),threePanels:r.missions.selectedTab==='missions'&&r.build.selectedTab==='build'&&r.care.selectedTab==='care',layout:!r.fit.overflow&&r.fit.stage.width>0&&r.fit.stage.height>0,backTarget:r.geometry.back.width>=44&&r.geometry.back.height>=43.9,outerBuildHidden:!r.build.outsideBuild,returnPaused:r.exit.kind===null&&r.exit.paused==='true',cameraRestored:Math.abs(r.exit.zoom-r.before.zoom)<1e-8&&r.exit.angle===r.before.angle,singleWorld:r.fit.canvases===1&&r.fit.habitats==='5'&&r.fit.birds==='2'&&r.fit.elephants==='2'&&r.fit.lions==='3'&&r.fit.giraffes==='3'&&r.geometry.zebras};
   r.pass=Object.values(r.checks).every(Boolean);const i=matrix.findIndex(m=>m.profile===profile&&m.kind===kind);if(i<0)matrix.push(r);else matrix.splice(i,1,r);await save();
   if(!r.pass)throw Error('Live checks failed '+profile+' '+kind);return{profile,kind,pass:r.pass,checks:r.checks,screenshot:evidence+'/'+r.screenshot};
  }catch(e){errors.push({profile,kind,error:String(e),at:new Date().toISOString()});await writeFile(evidence+'/internal-attempt-errors-final.json',JSON.stringify(errors,null,2));if((await state()).paused==='false')await click(tab.playwright.locator('[data-pause-toggle]'));throw e;}
 }
 return{state,click,select,run,matrix};
}
