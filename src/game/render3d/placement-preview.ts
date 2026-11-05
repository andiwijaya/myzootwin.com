import {sceneOrigin} from '../world/scene-coordinates.ts';
import { BoxGeometry, EdgesGeometry, Group, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, Plane, PlaneGeometry, Raycaster, Vector2, Vector3, type Camera } from 'three';
import {validatePathPlacement} from '../world/paths.ts';
import {habitatBlockerKeys,validateHabitatPlacement} from '../world/build-habitat.ts';
import { createPlacementPlanner, type PlacementCommand, type PlacementView, type PlacementProposal } from '../world/placement-preview.ts';
import type { RuntimeWorld } from '../core/state.ts';
import type { SceneCatalog } from './scene-selection.ts';
import { raycastScene, type PickRect } from './scene-picking.ts';
import type {HabitatKind} from '../core/species.ts';
import {validateSpeciesHabitatPlacement} from '../world/species-habitat.ts';

export function createPlacementPreview(world:()=>RuntimeWorld,catalog:SceneCatalog,camera:Camera,rect:()=>PickRect,onChange:(view:PlacementView)=>void,commit?:(proposal:PlacementProposal,operationId:string)=>boolean,purchaseReason?:(kind:'habitat'|'path')=>'funds'|'capacity'|null,habitatKind?:()=>HabitatKind) {
  const map=world(),blocked=habitatBlockerKeys();
  const group=new Group();group.name='Habitat footprint planning';
  const box=new BoxGeometry(2,.22,2),edges=new EdgesGeometry(box);box.dispose();
  const plane=new PlaneGeometry(.93,.93);
  const ghostMaterial=new MeshBasicMaterial({color:'#23774e',transparent:true,opacity:.34,depthWrite:false});
  const edgeMaterial=new LineBasicMaterial({color:'#176541',depthTest:false});
  const confirmedMaterial=new LineBasicMaterial({color:'#226ca0',depthTest:false});
  const ghost=new Group(),outline=new LineSegments(edges,edgeMaterial),confirmed=new LineSegments(edges,confirmedMaterial);outline.renderOrder=24;confirmed.renderOrder=23;
  const fills:Mesh<PlaneGeometry,MeshBasicMaterial>[]=[];
  ghost.add(outline);
  for(const [x,z]of [[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5]]){const tile=new Mesh(plane,ghostMaterial);tile.rotation.x=-Math.PI/2;tile.position.set(x,-.07,z);tile.renderOrder=22;fills.push(tile);ghost.add(tile);}
  function ensureFills(count:number){while(fills.length<count){const tile=new Mesh(plane,ghostMaterial);tile.rotation.x=-Math.PI/2;tile.renderOrder=22;fills.push(tile);ghost.add(tile);}}
  group.add(ghost,confirmed);ghost.visible=false;confirmed.visible=false;
  function position(target:Group|LineSegments,proposal:PlacementProposal){target.position.set(proposal.anchor.x-sceneOrigin(map).x+proposal.width/2,.17,proposal.anchor.z-sceneOrigin(map).z+proposal.height/2);}
  const planner=createPlacementPlanner(world,blocked,view=>{
    ghost.visible=view.active&&Boolean(view.proposal);confirmed.visible=!commit&&Boolean(view.confirmed);
    if(view.proposal){const proposal=view.proposal;position(ghost,proposal);outline.scale.set(proposal.width/2,1,proposal.height/2);ensureFills(proposal.cells.length);fills.forEach((tile,i)=>{tile.visible=i<proposal.cells.length;tile.position.set(i%proposal.width-(proposal.width-1)/2,-.07,Math.floor(i/proposal.width)-(proposal.height-1)/2);});ghostMaterial.color.set(view.reason==='ready'?'#23774e':'#b32e33');edgeMaterial.color.set(view.reason==='ready'?'#176541':'#a5222b');}
    if(view.confirmed){position(confirmed,view.confirmed);confirmed.scale.set(view.confirmed.width/2,1,view.confirmed.height/2);}group.updateMatrixWorld(true);onChange(view);
  },commit||habitatKind?{validate:(w,a,kind)=>{const checked=kind==='path'?validatePathPlacement(w,a):habitatKind?validateSpeciesHabitatPlacement(w,a,habitatKind()):validateHabitatPlacement(w,a);return checked.reason==='ready'?{...checked,reason:purchaseReason?.(kind)??'ready'}:checked;},commit}:{});
  const raycaster=new Raycaster(),ground=new Plane(new Vector3(0,1,0),0),intersection=new Vector3();
  return {group,geometries:[edges,plane],materials:[ghostMaterial,edgeMaterial,confirmedMaterial],
    guide(kind:'habitat'|'path',target:{x:number;z:number}){planner.cancel();planner.begin(kind);planner.choose(target);},
    command(value:PlacementCommand,expectedRevision?:number){if(value==='begin')planner.begin();else if(value==='begin-path')planner.begin('path');else if(value==='confirm')planner.confirm(expectedRevision??-1);else if(value==='cancel')planner.cancel();else planner.move(value==='left'?-1:value==='right'?1:0,value==='up'?-1:value==='down'?1:0);},
    pick(point:{x:number;y:number}){
      const b=rect();if(b.width<=0||b.height<=0)return;
      const identity=raycastScene(catalog,camera,point,b,raycaster);
      if(identity){planner.choose(identity.cell);return;}
      camera.updateMatrixWorld(true);raycaster.setFromCamera(new Vector2((point.x-b.left)/b.width*2-1,1-(point.y-b.top)/b.height*2),camera);
      planner.choose(raycaster.ray.intersectPlane(ground,intersection)?{x:Math.floor(intersection.x+sceneOrigin(map).x),z:Math.floor(intersection.z+sceneOrigin(map).z)}:null);
    },
    refresh:()=>planner.refresh(),active:()=>planner.snapshot().active,
    setEnabled:planner.setEnabled,
    dispose:planner.dispose,
    inspect:()=>({...planner.inspect(),placementGhostVisible:ghost.visible,placementPlanVisible:confirmed.visible,placementBlockedCells:blocked.size}),
  };
}
