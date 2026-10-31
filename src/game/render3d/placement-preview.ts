import { BoxGeometry, EdgesGeometry, Group, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, Plane, PlaneGeometry, Raycaster, Vector2, Vector3, type Camera } from 'three';
import { cellKey, createPlacementPlanner, type PlacementCommand, type PlacementView } from '../world/placement-preview.ts';
import type { WorldState } from '../core/state.ts';
import type { SceneCatalog } from './scene-selection.ts';
import { raycastScene, type PickRect } from './scene-picking.ts';

export function createPlacementPreview(world:()=>WorldState,catalog:SceneCatalog,camera:Camera,rect:()=>PickRect,onChange:(view:PlacementView)=>void) {
  const map=world(),blocked=new Set<string>();
  for(const identity of catalog.identities.values())if(identity.category==='object') {
    const b=catalog.bounds.get(identity.id);if(!b)continue;
    for(const tile of map.tiles){const x=tile.cell.x-map.width/2,z=tile.cell.z-map.height/2;if(x+1>b.min.x+.03&&x<b.max.x-.03&&z+1>b.min.z+.03&&z<b.max.z-.03)blocked.add(cellKey(tile.cell));}
  }
  const group=new Group();group.name='Habitat footprint planning';
  const box=new BoxGeometry(2,.22,2),edges=new EdgesGeometry(box);box.dispose();
  const plane=new PlaneGeometry(.93,.93);
  const ghostMaterial=new MeshBasicMaterial({color:'#23774e',transparent:true,opacity:.34,depthWrite:false});
  const edgeMaterial=new LineBasicMaterial({color:'#176541',depthTest:false});
  const confirmedMaterial=new LineBasicMaterial({color:'#226ca0',depthTest:false});
  const ghost=new Group(),outline=new LineSegments(edges,edgeMaterial),confirmed=new LineSegments(edges,confirmedMaterial);outline.renderOrder=24;confirmed.renderOrder=23;
  ghost.add(outline);
  for(const [x,z]of [[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5]]){const tile=new Mesh(plane,ghostMaterial);tile.rotation.x=-Math.PI/2;tile.position.set(x,-.07,z);tile.renderOrder=22;ghost.add(tile);}
  group.add(ghost,confirmed);ghost.visible=false;confirmed.visible=false;
  function position(target:Group|LineSegments,anchor:{x:number;z:number}){target.position.set(anchor.x-map.width/2+1,.17,anchor.z-map.height/2+1);}
  const planner=createPlacementPlanner(world,blocked,view=>{
    ghost.visible=view.active&&Boolean(view.proposal);confirmed.visible=Boolean(view.confirmed);
    if(view.proposal){position(ghost,view.proposal.anchor);ghostMaterial.color.set(view.reason==='ready'?'#23774e':'#b32e33');edgeMaterial.color.set(view.reason==='ready'?'#176541':'#a5222b');}
    if(view.confirmed)position(confirmed,view.confirmed.anchor);group.updateMatrixWorld(true);onChange(view);
  });
  const raycaster=new Raycaster(),ground=new Plane(new Vector3(0,1,0),0),intersection=new Vector3();
  return {group,geometries:[edges,plane],materials:[ghostMaterial,edgeMaterial,confirmedMaterial],
    command(value:PlacementCommand,expectedRevision?:number){if(value==='begin')planner.begin();else if(value==='confirm')planner.confirm(expectedRevision??-1);else if(value==='cancel')planner.cancel();else planner.move(value==='left'?-1:value==='right'?1:0,value==='up'?-1:value==='down'?1:0);},
    pick(point:{x:number;y:number}){
      const b=rect();if(b.width<=0||b.height<=0)return;
      const identity=raycastScene(catalog,camera,point,b,raycaster);
      if(identity){planner.choose(identity.cell);return;}
      camera.updateMatrixWorld(true);raycaster.setFromCamera(new Vector2((point.x-b.left)/b.width*2-1,1-(point.y-b.top)/b.height*2),camera);
      planner.choose(raycaster.ray.intersectPlane(ground,intersection)?{x:Math.floor(intersection.x+map.width/2),z:Math.floor(intersection.z+map.height/2)}:null);
    },
    active:()=>planner.snapshot().active,
    setEnabled:planner.setEnabled,
    dispose:planner.dispose,
    inspect:()=>({...planner.inspect(),placementGhostVisible:ghost.visible,placementPlanVisible:confirmed.visible,placementBlockedCells:blocked.size}),
  };
}
