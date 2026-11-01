import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const [runId='standalone-unverified',buildId='unverified',sourceId='unverified']=process.argv.slice(2);
if(![runId,buildId,sourceId].every(value=>/^[a-zA-Z0-9-]+$/.test(value)))throw Error('Invalid fixture identity');
let html=await readFile(resolve(root,'dist/play/index.html'),'utf8');
html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
html=html.replaceAll('href="/_astro/','href="/dist/_astro/');
const toolbar=`<section id="qa-toolbar" lang="en" style="padding:1rem;background:#e4edf4;border-bottom:2px solid #53718b;font:14px system-ui;color:#19364b">
<strong>LOCAL QA — injected renderer failures; this page is not a product route</strong>
<p style="overflow-wrap:anywhere">Run <code id="qa-run-id">${runId}</code> · Build <code id="qa-build-id">${buildId}</code> · Source <code id="qa-source-id">${sourceId}</code></p>
<p><label>Scenario <select id="qa-mode"><option value="native">Native WebGL</option><option value="unsupported">Injected null WebGL</option><option value="init-error">Injected constructor error</option><option value="load-error">Injected import failure</option><option value="slow">Injected delayed import</option></select></label>
<button id="qa-apply">Apply scenario</button><button id="qa-release">Complete delayed import</button><button id="qa-context">Inject context loss</button><button id="qa-render">Inject render failure</button><button id="qa-unmount">Unmount panel</button><button id="qa-remount">Remount panel</button><button id="qa-pause">Pause renderer</button><button id="qa-resume">Resume renderer</button><button id="qa-probe">Record 5-second callback baseline</button><button id="qa-memory">Record heap snapshot</button><button id="qa-stale">Dispose previous handle</button><button id="qa-camera">Run injected camera checks</button><button id="qa-camera-held">Begin injected camera gesture</button><button id="qa-selection">Run injected selection checks</button><button id="qa-select-gate">Select gate fixture</button><button id="qa-id">Use Indonesian</button><button id="qa-en">Use English</button></p>
<p>Measurement: RAF callback cadence and synchronous JS/render submission only. Presented FPS/GPU time unmeasured; optional heap numbers are non-standard.</p>
<output id="qa-camera-results" style="display:block;white-space:pre-wrap;overflow-wrap:anywhere;font:12px monospace">Camera checks UNRUN; injected touch only, not physical-device evidence.</output><output id="qa-selection-results" style="display:block;white-space:pre-wrap;overflow-wrap:anywhere;font:12px monospace">Selection checks UNRUN; injected events, not physical touch.</output><output id="qa-diagnostics" style="display:block;white-space:pre-wrap;overflow-wrap:anywhere;font:12px monospace"></output></section>`;
html=html.replace('<main>','<style>#qa-toolbar output{display:block;overflow-wrap:anywhere;word-break:break-word;max-width:100%}</style>'+toolbar+'<main>');
html=html.replace('</body>','<script type="module" src="/tests/browser/preview-harness.mjs"></script></body>');
const output=resolve(root,'tests/browser/.generated');
await mkdir(output,{recursive:true});
await writeFile(resolve(output,'preview-harness.html'),html);
console.log('Prepared ignored local-only harness from actual built /play markup; production scripts removed.');

let saveHtml=await readFile(resolve(root,'dist/play/index.html'),'utf8');saveHtml=saveHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replaceAll('href="/_astro/','href="/dist/_astro/');
const saveToolbar=`<section style="padding:1rem;background:#e4edf4;color:#19364b;min-width:0;max-width:100%;overflow-wrap:anywhere"><strong>LOCAL STORAGE QA ONLY - labelled whole fixtures and injected failures; not a product route</strong><p>Run <code id="qa-save-run-id">${runId}</code> · Build ${buildId} · Source ${sourceId}</p><button id="qa-save-run">Run bounded IndexedDB autosave checks</button><button id="qa-save-normalize">Disable injected failure</button><button id="qa-save-error-view">Show injected quota error for visual review</button><output id="qa-save-results" style="display:block;overflow-wrap:anywhere"></output><output id="qa-save-inspect" style="display:block;overflow-wrap:anywhere"></output></section>`;
saveHtml=saveHtml.replace('<main>',saveToolbar+'<main>').replace('</body>','<script type="module" src="/tests/browser/autosave-harness.mjs"></script></body>');await writeFile(resolve(output,'autosave-harness.html'),saveHtml);

let recoveryHtml=await readFile(resolve(root,'dist/play/index.html'),'utf8');recoveryHtml=recoveryHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replaceAll('href="/_astro/','href="/dist/_astro/');
const recoveryToolbar=`<section style="padding:1rem;min-width:0;max-width:100%;overflow-wrap:anywhere;background:#e4edf4"><strong>LOCAL RECOVERY QA ONLY - owned raw fixtures and explicit failures, not a product route</strong><p>Run <code id="qa-recovery-run-id">${runId}</code> - Build ${buildId} - Source ${sourceId}</p><button id="qa-recovery-run">Run bounded migration and recovery checks</button><button id="qa-recovery-normalize">Disable injected recovery failure</button><button id="qa-recovery-review-view">Show damaged-save recovery dialog</button><output id="qa-recovery-results" style="display:block;overflow-wrap:anywhere"></output><output id="qa-recovery-inspect" style="display:block;overflow-wrap:anywhere"></output></section>`;
recoveryHtml=recoveryHtml.replace('<main>',recoveryToolbar+'<main>').replace('</body>','<script type="module" src="/tests/browser/recovery-harness.mjs"></script></body>');await writeFile(resolve(output,'recovery-harness.html'),recoveryHtml);
