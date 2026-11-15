import { LoadingManager, Mesh, SkinnedMesh, type BufferGeometry, type Material, type Texture, type Group } from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import type { AnimalSpecies, Bones } from './articulation.ts';
export interface AnimalModel {
    id: string;
    species: AnimalSpecies;
    variant: string;
    detail: 'high' | 'low';
    url: string;
    bytes: number;
    sha256: string;
    rawBytes: number;
    rawSha256: string;
    sourceSha256: string;
    textures: string[];
    animations: string[];
    triangles: number;
}
interface ImageRecord {
    url: string;
    sha256: string;
    bytes: number;
}
interface Delivery {
    schemaVersion: number;
    models: AnimalModel[];
    textures: ImageRecord[];
}
export interface SceneryInstance {
    id: string;
    residentId: string;
    scene: Group;
    bones: Bones;
    animations: GLTF['animations'];
    skeletons: Set<SkinnedMesh['skeleton']>;
    released: boolean;
}
export interface AnimalInstance extends SceneryInstance {mesh:SkinnedMesh;}
interface Options {
    baseURL?: string;
    fetcher?: typeof fetch;
    parse?: (bytes: ArrayBuffer, path: string, manager: LoadingManager) => Promise<GLTF>;
    changed?: () => void;
    failed?: (error: unknown) => void;
}
const abort = () => new DOMException('Animal library disposed', 'AbortError');
const hash = async (bytes: ArrayBuffer) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), x => x.toString(16).padStart(2, '0')).join('');
const textureList = (gltf: GLTF) => { const all = new Set<Texture>(); gltf.scene.traverse(o => { if (o instanceof Mesh)
    for (const m of Array.isArray(o.material) ? o.material : [o.material])
        for (const value of Object.values(m))
            if ((value as Texture)?.isTexture)
                all.add(value as Texture); }); return all; };
/** Session owner of lazy runtime derivatives. Shared images/textures; independent instance bones. */
export function createAnimalLibrary(options: Options = {}) {
    const base = new URL(options.baseURL ?? '/zoo-assets/v01/', location.href), fetcher = options.fetcher ?? fetch, controller = new AbortController(), templates = new Map<string, GLTF>(), pending = new Map<string, Promise<GLTF>>(), instances = new Set<SceneryInstance>(), imageBytes = new Map<string, ArrayBuffer>(), imagePending = new Map<string, Promise<ArrayBuffer>>(), shared = new Map<string, {
        texture: Texture;
        owners: Set<string>;
    }>(), templateTextures = new Map<string, Set<string>>(), closedImages = new WeakSet<object>();
    let disposed = false, active = 0;
    const queue: Array<() => void> = [], timings: Array<{
        id: string;
        milliseconds: number;
        decodedBytes: number;
        encodedBytes: number;
    }> = [];
    const resourceCounts=new Map<string,{geometries:number;materials:number}>(),failedIds=new Set<string>();
    if (base.origin !== location.origin || !base.pathname.endsWith('/'))
        throw Error('Animal library must use the current site');
    const check = () => { if (disposed)
        throw abort(); };
    const notify = () => { if (!disposed)
        options.changed?.(); };
    const safeURL = (relative: string, kind: 'model' | 'texture') => { if (!(kind === 'model' ? /^models\/[a-z0-9-]+\.glb\.br$/ : /^textures\/[a-f0-9]{64}\.webp$/).test(relative))
        throw Error('Unsafe animal asset path'); const url = new URL(relative, base); if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname))
        throw Error('Animal asset escaped library'); return url.href; };
    function closeImage(image: unknown) { if (!image || typeof image !== 'object' || closedImages.has(image))
        return; if ([...shared.values()].some(v => v.texture.image === image))
        return; const data = image as {
        close?: () => void;
    }; if (typeof data.close === 'function') {
        closedImages.add(image);
        data.close();
    } }
    function disposeUnpooled(gltf: GLTF) { const geos = new Set<BufferGeometry>(), mats = new Set<Material>(), images = new Set<unknown>(); gltf.scene.traverse(o => { if (o instanceof SkinnedMesh)
        o.skeleton.dispose(); if (!(o instanceof Mesh))
        return; geos.add(o.geometry); for (const m of Array.isArray(o.material) ? o.material : [o.material])
        mats.add(m); }); for (const t of textureList(gltf)) {
        images.add(t.image);
        t.dispose();
    } for (const g of geos)
        g.dispose(); for (const m of mats)
        m.dispose(); for (const image of images)
        closeImage(image); gltf.scene.clear(); }
    function disposeTemplate(id: string, gltf: GLTF) { resourceCounts.delete(id);const geos = new Set<BufferGeometry>(), mats = new Set<Material>(), skeletons = new Set<SkinnedMesh['skeleton']>(); gltf.scene.traverse(o => { if (o instanceof SkinnedMesh)
        skeletons.add(o.skeleton); if (o instanceof Mesh) {
        geos.add(o.geometry);
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
            mats.add(m);
    } }); for (const s of skeletons)
        s.dispose(); for (const g of geos)
        g.dispose(); for (const m of mats)
        m.dispose(); const images = []; for (const key of templateTextures.get(id) ?? []) {
        const entry = shared.get(key);
        entry?.owners.delete(id);
        if (entry && !entry.owners.size) {
            shared.delete(key);
            entry.texture.dispose();
            images.push(entry.texture.image);
        }
    } templateTextures.delete(id); for (const image of images)
        closeImage(image); gltf.scene.clear(); }
    const ready = (async () => { const response = await fetcher(new URL('manifest.json', base), { signal: controller.signal }); if (!response.ok)
        throw Error('Animal catalogue HTTP ' + response.status); const value = await response.json() as Delivery; check(); if (value.schemaVersion !== 1 || !Array.isArray(value.models) || !value.models.length || !Array.isArray(value.textures))
        throw Error('Invalid animal catalogue'); const ids = new Set<string>(); for (const a of value.models) {
        if (ids.has(a.id) || !/^[a-z0-9-]+$/.test(a.id) || !['high', 'low'].includes(a.detail) || !/^[a-f0-9]{64}$/.test(a.rawSha256) || !Number.isSafeInteger(a.rawBytes) || a.rawBytes <= 0)
            throw Error('Invalid animal model');
        ids.add(a.id);
        safeURL(a.url, 'model');
    } for (const t of value.textures) {
        safeURL(t.url, 'texture');
        if (!/^[a-f0-9]{64}$/.test(t.sha256) || t.url !== 'textures/' + t.sha256 + '.webp')
            throw Error('Invalid animal image identity');
    } return value; })();
    // Callers may create a library before requesting any resident; suppress an unhandled rejection.
    ready.catch(error => { if (!disposed)
        options.failed?.(error); });
    async function imageData(id: string) { check(); const cached = imageBytes.get(id); if (cached)
        return cached; const previous = imagePending.get(id); if (previous)
        return previous; const task = (async () => { const m = await ready, entry = m.textures.find(t => t.sha256 === id); if (!entry)
        throw Error('Unknown original animal image'); const response = await fetcher(safeURL(entry.url, 'texture'), { signal: controller.signal }); if (!response.ok)
        throw Error('Animal image HTTP ' + response.status); const bytes = await response.arrayBuffer(); check(); if (bytes.byteLength !== entry.bytes || await hash(bytes) !== entry.sha256)
        throw Error('Animal image identity mismatch'); check(); imageBytes.set(id, bytes); return bytes; })(); imagePending.set(id, task); try {
        return await task;
    }
    finally {
        imagePending.delete(id);
    } }
    async function slot() { check(); if (active >= 2)
        await new Promise<void>(resolve => queue.push(resolve)); check(); active++; }
    function free() { active--; queue.shift()?.(); }
    async function load(id: string) {
        check();
        failedIds.delete(id);
        const existing = templates.get(id);
        if (existing)
            return existing;
        const old = pending.get(id);
        if (old)
            return old;
        const task = (async () => {
            await slot();
            const objectURLs = new Set<string>();
            let gltf: GLTF | undefined;
            try {
                const m = await ready;
                check();
                const entry = m.models.find(a => a.id === id);
                if (!entry)
                    throw Error('Unknown animal model ' + id);
                const started = performance.now(), response = await fetcher(safeURL(entry.url, 'model'), { signal: controller.signal });
                if (!response.ok)
                    throw Error('Animal model HTTP ' + response.status);
                const bytes = await response.arrayBuffer();
                check();
                if (bytes.byteLength !== entry.rawBytes || await hash(bytes) !== entry.rawSha256)
                    throw Error('Animal model identity mismatch ' + id);
                check();
                const verified = new Map<string, string>();
                for (const image of entry.textures) {
                    const data = await imageData(image);
                    check();
                    const uri = URL.createObjectURL(new Blob([data], { type: 'image/webp' }));
                    objectURLs.add(uri);
                    verified.set(new URL('textures/' + image + '.webp', base).href, uri);
                }
                const manager = new LoadingManager();
                manager.setURLModifier(url => { if (objectURLs.has(url))
                    return url; const known = verified.get(new URL(url, base).href); if (!known)
                    throw Error('Unverified animal image dependency'); return known; });
                gltf = await (options.parse ? options.parse(bytes, new URL('models/', base).href, manager) : new GLTFLoader(manager).parseAsync(bytes, new URL('models/', base).href));
                if (disposed) {
                    disposeUnpooled(gltf);
                    gltf = undefined;
                    throw abort();
                }
                const dependencies = await gltf.parser.getDependencies('texture') as Array<Texture | null>;
                if (dependencies.some(t => { const image = t?.image as {
                    width?: number;
                    height?: number;
                } | undefined; return !image?.width || !image.height; }))
                    throw Error('Incomplete animal textures');
                check();
                const owned = new Set<string>(), dropped = new Set<Texture>();
                const bindings: Array<{ material: Material; property: string; texture: Texture; key: string }> = [];
                gltf.scene.traverse(o => { if (!(o instanceof Mesh))
                    return; o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; for (const material of Array.isArray(o.material) ? o.material : [o.material])
                    for (const [property, value] of Object.entries(material)) {
                        const texture = value as Texture;
                        if (!texture?.isTexture)
                            continue;
                        const association = gltf!.parser.associations.get(texture) as {
                            textures?: number;
                        } | undefined, index = association?.textures, definition = index === undefined ? undefined : gltf!.parser.json.textures[index], imageIndex=definition?.source??definition?.extensions?.EXT_texture_webp?.source, image = imageIndex===undefined?undefined:gltf!.parser.json.images[imageIndex];
                        if (!image?.uri)
                            throw Error('Missing original image association');
                        const key = image.uri + '|' + texture.colorSpace + '|' + [texture.mapping,texture.channel,texture.flipY,texture.minFilter,texture.magFilter,texture.wrapS, texture.wrapT, texture.offset.x, texture.offset.y, texture.repeat.x, texture.repeat.y, texture.rotation,texture.center.x,texture.center.y].join(',');
                        bindings.push({ material, property, texture, key });
                    } });
                // Validate all associations before changing the shared ownership table.
                for (const { material, property, texture, key } of bindings) {
                    texture.anisotropy = 4;
                    const cached = shared.get(key);
                    if (cached) {
                        cached.owners.add(id);
                        if (cached.texture !== texture) {
                            (material as unknown as Record<string, unknown>)[property] = cached.texture;
                            dropped.add(texture);
                        }
                    } else {
                        shared.set(key, { texture, owners: new Set([id]) });
                    }
                    owned.add(key);
                }
                templateTextures.set(id, owned);
                for (const t of dropped) {
                    t.dispose();
                    closeImage(t.image);
                }
                templates.set(id, gltf);
                const geometries=new Set<BufferGeometry>(),materials=new Set<Material>();gltf.scene.traverse(o=>{if(o instanceof Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});resourceCounts.set(id,{geometries:geometries.size,materials:materials.size});
                timings.push({ id, milliseconds: performance.now() - started, decodedBytes: bytes.byteLength, encodedBytes: entry.bytes });
                const result = gltf;
                gltf = undefined;
                notify();
                return result;
            }
            catch (error) {
                if (gltf)
                    disposeUnpooled(gltf);
                if(!disposed)failedIds.add(id);
                throw error;
            }
            finally {
                for (const url of objectURLs)
                    URL.revokeObjectURL(url);
                free();
            }
        })();
        pending.set(id, task);
        try {
            return await task;
        }
        finally {
            if (pending.get(id) === task)
                pending.delete(id);
            notify();
        }
    }
    function ensure(id: string) { if (!templates.has(id) && !pending.has(id)&&!failedIds.has(id))
        void load(id).catch(error => { if (!disposed)
            options.failed?.(error); }); return templates.has(id); }
    function instantiateScene(id:string,residentId:string):SceneryInstance{check();const template=templates.get(id);if(!template)throw Error('Model is not ready');const scene=cloneSkeleton(template.scene) as Group,bones:Bones=new Map(),skeletons=new Set<SkinnedMesh['skeleton']>();scene.traverse(o=>{if(o.type==='Bone')bones.set(o.name,o as Parameters<Bones['set']>[1]);if(o instanceof SkinnedMesh)skeletons.add(o.skeleton);});scene.name=residentId;const instance={id,residentId,scene,bones,animations:template.animations,skeletons,released:false};instances.add(instance);return instance;}
    function instantiate(id:string,residentId:string):AnimalInstance{const instance=instantiateScene(id,residentId),meshes:SkinnedMesh[]=[];instance.scene.traverse(o=>{if(o instanceof SkinnedMesh)meshes.push(o);});if(meshes.length!==1||!instance.bones.size){release(instance);throw Error('Expected one complete original animal skin');}const mesh=meshes[0]!;mesh.name=residentId;Object.assign(instance,{mesh});return instance as AnimalInstance;}
    function release(instance: SceneryInstance) { if (!instances.delete(instance))
        return; instance.released = true; if('mesh'in instance){const mesh=(instance as AnimalInstance).mesh;mesh.removeFromParent();mesh.clear();}instance.scene.removeFromParent(); for (const s of instance.skeletons)
        s.dispose(); instance.scene.clear(); if (![...instances].some(i => i.id === instance.id)) {
        const template = templates.get(instance.id);
        if (template) {
            templates.delete(instance.id);
            disposeTemplate(instance.id, template);
        }
    } }
    function modelId(species: AnimalSpecies, variant: string, low: boolean) { return species + '-' + variant + '-' + (low ? 'low' : 'high') + '-v01'; }
    function dispose() { if (disposed)
        return; disposed = true; controller.abort(); while (queue.length)
        queue.shift()?.(); for (const instance of [...instances])
        release(instance); for (const [id, t] of templates) {
        disposeTemplate(id, t);
    } templates.clear();failedIds.clear(); imageBytes.clear(); imagePending.clear(); }
    function inspect() { return { animalLibraryDisposed: disposed, animalTemplates: templates.size, animalTemplateGeometries:[...resourceCounts.values()].reduce((n,r)=>n+r.geometries,0),animalTemplateMaterials:[...resourceCounts.values()].reduce((n,r)=>n+r.materials,0),animalPending: pending.size, animalInstances: instances.size, animalSharedTextures: shared.size, animalVerifiedImages: imageBytes.size, animalVerifiedImageBytes: [...imageBytes.values()].reduce((n, b) => n + b.byteLength, 0), animalInstanceBones: [...instances].reduce((n, i) => n + i.bones.size, 0) }; }
    return { ready, load, ensure, instantiate, instantiateScene, release, modelId, dispose, inspect, loadTimings:()=>timings.map(t=>({...t})) };
}
export type AnimalLibrary = ReturnType<typeof createAnimalLibrary>;
