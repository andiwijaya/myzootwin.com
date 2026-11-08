import {mkdir,writeFile} from 'node:fs/promises';
import {discoverVisualInventory} from './visual-inventory.mjs';
const report=discoverVisualInventory({productDirectory:'.qa/zebra/z0-02/product'});if(report.unresolved.length)throw Error(JSON.stringify(report.unresolved));
await mkdir('docs/qa/zebra/z0-03',{recursive:true});
await writeFile('docs/qa/zebra/z0-03/inventory.json',JSON.stringify(report)+'\n');
console.log(JSON.stringify({modules:report.moduleCount,visualModules:report.visualModuleCount,assetSites:report.assets.length,publicFiles:report.publicAssets.length,notApplicable:report.notApplicable,issues:report.issues}));
