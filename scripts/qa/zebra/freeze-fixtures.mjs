import {writeFile} from 'node:fs/promises';
import {createBaselineManifest} from './baseline-fixtures.mjs';
const path='tests/fixtures/zebra-v1-v4-baseline.json';
await writeFile(path,JSON.stringify(createBaselineManifest(),null,2)+'\n',{flag:'wx'});
console.log('Frozen original V1–V4 fingerprints without duplicating saves: '+path);
