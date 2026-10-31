See [the reproducible local QA workflow](../../docs/LOCAL_QA.md) for run/build identity, six approved-runtime browser cases, bounded evidence and PASS/FAIL/UNRUN verification. The standalone commands below remain useful for debugging; an unverified standalone fixture cannot pass the full QA receipt gate.

# Local renderer fixture (M0-05, workflow updated M0-07)

This test fixture is not an Astro route and does not ship in dist. Use Node 24 and the existing installed dependencies; no separate browser driver/install is needed.

1. `npm run build`
2. `node tests/browser/prepare-preview-harness.mjs`
3. `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4322 --strictPort`
4. Open `http://127.0.0.1:4322/tests/browser/.generated/preview-harness.html` in the supported isolated browser. Stop the owned preview afterwards.

The generated ignored HTML reuses actual built entry markup/CSS, removes production scripts, and adds visibly labelled QA controls. How/Settings are disabled only in this fixture. The real product entry is tested separately via Astro preview on loopback 4321.

Native mode uses the actual Three scene and an instrumented RAF driver. Exercise Open/Close, pause/resume, remount, previous-handle disposal, unmount and late import. Check diagnostics: at most one session/canvas/pending RAF; zero after release. Negative modes use injected null context, constructor throw or loader rejection/delay. Context loss uses the native WEBGL_lose_context extension if present; render failure control injects the failure callback. These injected cases are not physical-device compatibility/FPS proof. RAF render exceptions are tested in preview-lifecycle.test.mjs.

Use only fixture buttons for mutations; supported browser evaluate may read the diagnostic output. No product globals/debug URLs or browser security settings are required. Saved evidence under docs/qa/m0-05 records native vs injected sources explicitly.
