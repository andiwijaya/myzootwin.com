# GLB master inspection

Local P1/P2 extension of the Visual3D Asset Lab. It uses actual copied GLBs, the production sanctuary lighting factory, and the existing Visual3D orthographic camera fitter. It owns no game engine, save database, economy, or animal authoring. Low/high geometry remains a choice of master; the graphics control changes shadow policy.

The selected library is in C:/MyZooTwin/art/imports/pelatuk-aviary/v01. Master GLBs are authoring files with embedded images. They must stay outside public. Source files in C:/PelatukDotCom are read only.

Run from C:/MyZooTwin:

1. Import or independently verify: node scripts/qa/visual3d/glb/import-library.mjs, or add --verify-only. Existing different destination bytes are refused.
2. Inspect actual containers, geometry, skin, clips and PNG headers: node scripts/qa/visual3d/glb/inspect-library.mjs.
3. Build a new immutable run: node scripts/qa/visual3d/glb/build.mjs p2-20261115-example. Choose a fresh name for each changed build.
4. Start the loopback server: node scripts/qa/visual3d/glb/serve.mjs p2-20261115-example. Retain the process session with stdin and use its emitted dynamic origin. Type stop to end that owned server. If a sandbox listener is inaccessible to the internal browser, run only this loopback server in the supported host context.
5. Open the emitted entry in the internal browser. Use visible controls to run the 122-master batch, native playback, manual inspection and lifecycle/recovery. Page evaluation is read-only diagnostics.
6. Review evidence from .qa/glb/RUN/evidence/BATCH. The optional make_review_sheets.py RUN BATCH creates labelled scaled derivatives without changing native captures. Actual source capture hashes are verified before composition.

The server exposes compiled QA files and an explicit master whitelist only. Same-origin evidence requests write bounded JSON/PNG names within that run's evidence directory. No generic filesystem access, personal save, browser download, or public asset route is involved. Blob image fetches are permitted by this local page's CSP so embedded PNGs can be decoded.

The batch records six views per master, a low-shadow view, animation sampler/probe and labelled frame strips, independent cloned skeletons, sourcePlacementM restoration, and full/empty/partial/asymmetric stock. Facility close views use actual retained primitive component ranges, and keep root geometry and pivot unchanged. Studio has a separately recorded environment intensity; daylight uses the production lighting factory. Captures are canvas readbacks at 768 by 576 and DPR 1, independent of how the responsive page displays the canvas. They are not physical-device or presented-FPS evidence.

GLTFLoader can resolve after a texture failure; the pool explicitly rejects missing decoded textures and releases late results after disposal. HTTP failure, payload identity, late decode, cache ownership and independent skeleton regressions have focused tests. Resource cycles compare against the warmed renderer baseline; closing the complete scene should release its canvas, callbacks and owned resources.

Source receipts retain the build fingerprint and every master hash. Visual review is recorded separately from automated load success. Preserve rejected trials and report any remaining adaptation work before product integration. Update C:/MyZooTwin/docs/GLB_ASSET_PLAN_CHECKLIST.md for each verified milestone. P3 animal creation and deployment are outside P1/P2.
