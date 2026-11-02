import {ACESFilmicToneMapping,Color,DirectionalLight,HemisphereLight,PCFShadowMap,type Scene,type WebGLRenderer} from 'three';

/** Original daylight art direction. Only static scenery casts; moving animals retain their authoritative animation. */
export function createSanctuaryLighting(scene:Scene,renderer:WebGLRenderer){
 const sky=new HemisphereLight('#cbe5e7','#65754a',1.9);
 const sun=new DirectionalLight('#fff0cf',3.2);sun.name='Sanctuary afternoon sun';sun.position.set(-6,10,8);
 sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-9;sun.shadow.camera.right=9;sun.shadow.camera.top=9;sun.shadow.camera.bottom=-9;sun.shadow.camera.near=.5;sun.shadow.camera.far=35;
 sun.shadow.bias=-.00015;sun.shadow.normalBias=.035;sun.shadow.autoUpdate=false;sun.shadow.camera.updateProjectionMatrix();
 scene.background=new Color('#e9efe4');scene.add(sky,sun,sun.target);
 renderer.toneMapping=ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
 renderer.shadowMap.type=PCFShadowMap;renderer.shadowMap.autoUpdate=false;
 let low:boolean|undefined,disposed=false,refreshRequests=0;
 function invalidate(){if(disposed||low!==false)return;renderer.shadowMap.needsUpdate=true;sun.shadow.needsUpdate=true;refreshRequests++;}
 function setLowGraphics(value:boolean){if(disposed||value===low)return;low=value;renderer.shadowMap.enabled=!value;sun.castShadow=!value;if(value){renderer.shadowMap.needsUpdate=false;sun.shadow.needsUpdate=false;}else invalidate();}
 return {sun,sky,setLowGraphics,invalidate,
  dispose(){if(disposed)return;disposed=true;sun.castShadow=false;renderer.shadowMap.enabled=false;renderer.shadowMap.needsUpdate=false;sun.shadow.dispose();sun.shadow.map=null;sun.shadow.mapPass=null;scene.remove(sky,sun,sun.target);},
  inspect:()=>({sunShadowEnabled:!disposed&&low===false,staticShadowMapSize:1024,staticShadowRefreshRequests:refreshRequests,sunShadowMapAllocated:!disposed&&sun.shadow.map!==null,sanctuaryLightingDisposed:disposed}),
 };
}
