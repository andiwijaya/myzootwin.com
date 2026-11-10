import test from 'node:test';import assert from 'node:assert/strict';import {Box3,Vector3,OrthographicCamera,Group,Mesh,BoxGeometry,MeshBasicMaterial} from 'three';import {fitViewerCamera,viewerAzimuth} from '../scripts/qa/visual3d/viewer-math.ts';import {captureVisualFactory,visualCatalogues} from '../scripts/qa/visual3d/tagging.ts';
test('all four QA orbit directions fit every exact actor corner across desktop/portrait/landscape without moving models',()=>{
 for(const viewport of [[1366,768],[360,780],[780,360]])for(const degrees of [0,90,180,270])for(const size of [[1,1,1],[.8,3.4,.9],[24,3,26]]){const bounds=new Box3(new Vector3(-3,.079,12),new Vector3(-3+size[0],.079+size[1],12+size[2])),before=bounds.clone(),camera=new OrthographicCamera();fitViewerCamera(camera,bounds,...viewport,degrees);assert.deepEqual(bounds,before);for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const p=new Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<=1&&Math.abs(p.y)<=1&&p.z>=-1&&p.z<=1,JSON.stringify({viewport,degrees,size,p}));}}
 assert.throws(()=>fitViewerCamera(new OrthographicCamera(),new Box3(),360,780,0),/Invalid/);
});
test('QA captures the actual mutable production catalog by identity and does not copy or rewrite factory output',()=>{
 const group=new Group(),mesh=new Mesh(new BoxGeometry(),new MeshBasicMaterial());group.add(mesh);const catalog={identities:new Map(),bounds:new Map(),batches:[]},factory={group,catalog},before=Object.getOwnPropertyDescriptors(factory);assert.equal(captureVisualFactory(factory),factory);assert.deepEqual(Object.getOwnPropertyDescriptors(factory),before);assert.equal(visualCatalogues(group)[0],catalog);catalog.identities.set('new',{id:'new'});assert.equal(visualCatalogues(group)[0].identities.size,1);mesh.geometry.dispose();mesh.material.dispose();
});

test('QA yaw reports actual reset and orbit geometry rather than a stale requested angle, without changing camera/model data',()=>{
 const camera=new OrthographicCamera(),target=new Vector3(5.972475528717041,1.552305221557617,8.000000238418577);camera.position.set(19.97247552871704,13.819999963045122,24.000000238418576);const before=camera.position.clone();assert.ok(Math.abs(viewerAzimuth(camera,target)-41.185925166)<1e-9);assert.deepEqual(camera.position,before);
 for(const degrees of[0,90,180,270]){const bounds=new Box3(new Vector3(-3,.079,12),new Vector3(3,4,18)),center=fitViewerCamera(camera,bounds,1366,768,degrees);assert.equal(viewerAzimuth(camera,center),degrees);}
 camera.position.copy(target).add(new Vector3(-10,8,0));assert.equal(viewerAzimuth(camera,target),270);
});
