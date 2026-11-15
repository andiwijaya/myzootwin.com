import {Mesh,SkinnedMesh} from 'three';
import type {GLTF} from 'three/addons/loaders/GLTFLoader.js';
import {createAnimalLibrary,type AnimalInstance} from '../../../../src/game/render3d/glb/animal-library.ts';
import type {MasterManifest,MasterPool} from './pool.ts';

/** Exercise the production runtime loader in the same isolated asset lab. */
export function createRuntimePool(manifest:MasterManifest,options:Parameters<typeof createAnimalLibrary>[0]={}):MasterPool {
 const library=createAnimalLibrary(options),templates=new Map<string,GLTF>(),instances=new Map<ReturnType<MasterPool['instantiate']>,AnimalInstance>();let loads=0,loadedBytes=0,evictions=0;
 async function load(id:string){const existed=templates.has(id),result=await library.load(id);templates.set(id,result);if(!existed){loads++;loadedBytes+=manifest.assets.find(a=>a.id===id)!.bytes;}return result;}
 function instantiate(id:string){const real=library.instantiate(id,id),template=templates.get(id)!;const instance={...template,scene:real.scene,scenes:[real.scene],masterId:id};instances.set(instance,real);return instance;}
 function release(instance:ReturnType<MasterPool['instantiate']>){const real=instances.get(instance);if(!real)return;instances.delete(instance);library.release(real);if(![...instances.values()].some(i=>i.id===real.id))templates.delete(real.id);}
 function evict(id:string){if([...instances.values()].some(i=>i.id===id))throw Error('Release runtime instances first');templates.delete(id);evictions++;}
 function dispose(){for(const i of [...instances.keys()])release(i);library.dispose();templates.clear();}
 function inspect(){const geometries=new Set(),materials=new Set(),textures=new Set(),bones=new Set();for(const t of templates.values())t.scene.traverse(o=>{if(!(o instanceof Mesh))return;geometries.add(o.geometry);if(o instanceof SkinnedMesh)for(const b of o.skeleton.bones)bones.add(b);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const v of Object.values(m))if((v as {isTexture?:boolean})?.isTexture)textures.add(v);}});const actual=library.inspect();return{disposed:actual.animalLibraryDisposed,templates:templates.size,pending:actual.animalPending,instances:instances.size,geometries:geometries.size,materials:materials.size,textures:textures.size,bones:bones.size,loadedBytes,loads,evictions,...actual};}
 return{load,instantiate,release,evict,dispose,inspect};
}
