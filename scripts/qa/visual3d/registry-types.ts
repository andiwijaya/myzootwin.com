export type VisualRecordKind='module'|'constructor-site'|'named-part'|'static-ui'|'public-file'|'generated';
export interface VisualRecord {
 assetId:string;kind:VisualRecordKind;category:string;sourcePath:string;sourceHash:string;owner:string;
 line?:number;constructorType?:string;variable?:string;label?:string;
 provenance:{origin:string;license:string;evidence:string[]};
 testFixtures:{id:string;status:'AVAILABLE'|'PLANNED'}[];
 qualityTiers:readonly ['low','high'];stateRule:string;fallback:string;visualStatus:'NOT_RUN';
}
export interface VisualRegistry {version:1;entry:string;method:string;modules:number;renderModules:number;records:VisualRecord[];notApplicable:{category:string;status:string;proof:string}[];dependencies:{name:string;version:string;license:string;licenseHash:string}[];}
