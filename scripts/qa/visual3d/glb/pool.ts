import {Mesh,SkinnedMesh,type BufferGeometry,type Group,type Material,type Texture} from 'three';
import {GLTFLoader,type GLTF} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';

export interface MasterAsset {id:string;category:string;localPath:string;sourcePath:string;bytes:number;sha256:string;sourceSha256:string;detail?:string;kind?:string;species?:string;animations:string[];sourcePlacementM?:number[];walkSpeedMps?:number;[key:string]:unknown;}
export interface MasterManifest {schemaVersion:number;sourceLibrarySha256:string;selectedMasters:number;totalMasterBytes:number;assets:MasterAsset[];}
type Instance=GLTF&{masterId:string};
type Options={baseURL:string;fetcher?:typeof fetch;parse?:(bytes:ArrayBuffer)=>Promise<GLTF>};
const abortError=()=>new DOMException('GLB QA pool disposed','AbortError');
export async function digest(bytes:ArrayBuffer){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');}

/** QA owner of exact retained masters. Instances borrow geometry/materials and own skeletons. */
export function createMasterPool(manifest:MasterManifest,options:Options){
 const base=new URL(options.baseURL),fetcher=options.fetcher??fetch;
 if(!['localhost','127.0.0.1'].includes(base.hostname))throw Error('GLB authoring masters are loopback QA only');
 const entries=new Map(manifest.assets.map(a=>[a.id,a])),templates=new Map<string,GLTF>(),pending=new Map<string,Promise<GLTF>>(),instances=new Set<Instance>(),controller=new AbortController();
 const disposedGeometries=new WeakSet<BufferGeometry>(),disposedMaterials=new WeakSet<Material>(),disposedTextures=new WeakSet<Texture>(),closedImages=new WeakSet<object>();
 let disposed=false,loadedBytes=0,loads=0,evictions=0;
 const check=()=>{if(disposed||controller.signal.aborted)throw abortError();};
 function skeletons(gltf:GLTF){const all=new Set<SkinnedMesh['skeleton']>();gltf.scene.traverse(o=>{if(o instanceof SkinnedMesh)all.add(o.skeleton);});return all;}
 function disposeTemplate(gltf:GLTF){
  for(const s of skeletons(gltf))s.dispose();
  gltf.scene.traverse(o=>{if(!(o instanceof Mesh))return;const g=o.geometry;if(!disposedGeometries.has(g)){disposedGeometries.add(g);g.dispose();}
   for(const m of Array.isArray(o.material)?o.material:[o.material]){if(disposedMaterials.has(m))continue;disposedMaterials.add(m);
    for(const v of Object.values(m)){const t=v as Texture;if(!t?.isTexture||disposedTextures.has(t))continue;disposedTextures.add(t);t.dispose();const image=t.image as {close?:()=>void}|undefined;if(image&&typeof image.close==='function'&&!closedImages.has(image)){closedImages.add(image);image.close();}}
    m.dispose();
   }
  });gltf.scene.removeFromParent();gltf.scene.clear();
 }
 async function load(id:string){check();const cached=templates.get(id);if(cached)return cached;const task=pending.get(id);if(task)return task;
  const promise=(async()=>{const asset=entries.get(id);if(!asset)throw Error('Unknown GLB master '+id);if(!/^masters\/[a-z0-9/_-]+\.glb$/.test(asset.localPath))throw Error('Unsafe GLB master path');const url=new URL(asset.localPath,base);if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname))throw Error('GLB master outside library');
   const response=await fetcher(url,{signal:controller.signal});if(!response.ok)throw Error('GLB HTTP '+response.status);const bytes=await response.arrayBuffer();check();if(bytes.byteLength!==asset.bytes||await digest(bytes)!==asset.sha256)throw Error('GLB identity mismatch '+id);check();
   const gltf=await (options.parse?options.parse(bytes):new GLTFLoader().parseAsync(bytes,''));
   if(disposed){disposeTemplate(gltf);throw abortError();}
   // GLTFLoader may resolve a model after reporting a texture decode error. Treat it as failure.
   try{
    if(gltf.parser?.json?.textures?.length){const textures=await gltf.parser.getDependencies('texture')as (Texture|null)[];if(textures.some(t=>{const image=t?.image as {width?:number;height?:number}|undefined;return !image?.width||!image?.height;}))throw Error('Incomplete GLB textures '+id);}
    check();
   }catch(error){disposeTemplate(gltf);throw error;}
   gltf.scene.traverse(o=>{if(!(o instanceof Mesh))return;o.castShadow=o.userData.fixtureShadow?.cast??o.userData.originalOrnamentShadow?.cast??!['soil','water','ground'].includes(o.name);o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material])for(const v of Object.values(m)){const t=v as Texture;if(t?.isTexture)t.anisotropy=4;}});
   templates.set(id,gltf);loadedBytes+=bytes.byteLength;loads++;return gltf;
  })();pending.set(id,promise);try{return await promise;}finally{if(pending.get(id)===promise)pending.delete(id);}
 }
 function instantiate(id:string):Instance{check();const gltf=templates.get(id);if(!gltf)throw Error('Master not loaded '+id);const scene=cloneSkeleton(gltf.scene)as Group,instance={...gltf,scene,scenes:[scene],masterId:id};instances.add(instance);return instance;}
 function release(instance:Instance){if(!instances.delete(instance))return;instance.scene.removeFromParent();for(const s of skeletons(instance))s.dispose();instance.scene.clear();}
 function evict(id:string){if([...instances].some(i=>i.masterId===id))throw Error('Release instances before evicting master');const gltf=templates.get(id);if(gltf){templates.delete(id);disposeTemplate(gltf);evictions++;}}
 function dispose(){if(disposed)return;disposed=true;controller.abort();for(const i of [...instances])release(i);for(const id of [...templates.keys()])evict(id);}
 function inspect(){const geometries=new Set(),materials=new Set(),textures=new Set(),bones=new Set();for(const g of templates.values())g.scene.traverse(o=>{if(!(o instanceof Mesh))return;geometries.add(o.geometry);if(o instanceof SkinnedMesh)for(const b of o.skeleton.bones)bones.add(b);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const v of Object.values(m))if((v as Texture)?.isTexture)textures.add(v);}});return{disposed,templates:templates.size,pending:pending.size,instances:instances.size,geometries:geometries.size,materials:materials.size,textures:textures.size,bones:bones.size,loadedBytes,loads,evictions};}
 return{load,instantiate,release,evict,dispose,inspect};
}
export type MasterPool=ReturnType<typeof createMasterPool>;
