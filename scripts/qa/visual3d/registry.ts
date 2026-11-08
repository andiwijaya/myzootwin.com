import type {VisualRegistry} from './registry-types.ts';
declare const __VIS3D_REGISTRY__:VisualRegistry;
export const visualRegistry=__VIS3D_REGISTRY__;
export const visualRecords=new Map(visualRegistry.records.map(r=>[r.assetId,r]));
