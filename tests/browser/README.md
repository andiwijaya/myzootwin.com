See [the reproducible local QA workflow](../../docs/LOCAL_QA.md) for run/build identity, six approved-runtime browser cases, bounded evidence and PASS/FAIL/UNRUN verification. The standalone commands below remain useful for debugging; an unverified standalone fixture cannot pass the full QA receipt gate.

# Local renderer fixture (M0-05, workflow updated M0-07)

This test fixture is not an Astro route and does not ship in dist. Use Node 24 and the existing installed dependencies; no separate browser driver/install is needed.

1. `npm run build`
2. `node tests/browser/prepare-preview-harness.mjs`
3. `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4322 --strictPort`
4. Open `http://127.0.0.1:4322/tests/browser/.generated/preview-harness.html` in the supported isolated browser. Stop the owned preview afterwards.

M1-07 adds **Run injected editing checks**, after fresh camera → selection → habitat → path checks. It exercises destructive confirmation/cancel, pause, double confirm/Undo, path disconnection/restoration, habitat removal/replacement, bilingual critical copy and a bounded repeated geometry lifecycle. This labelled fixture uses synthetic touch and an HTML dialog cancel request; test real mouse/keyboard separately on the actual built product. The final edit intentionally leaves one removed path and a page-session Undo for remount/context-loss tests. No physical Android claim.

M2-01 adds **Run injected macaw checks**, after the fresh camera/selection/habitat/path/editing sequence. Seven clips, four angles, visual pause, interrupted transitions, true habitat scale/camera isolation, ID/EN, bounded repeated open/close and Escape are checked against actual WebGL frames. It ends with a presentation-only flying model active and the simulation paused, ready for profiling/fault/remount cleanup. Close the model before ordinary core pause/resume baseline tests. Use the real built product separately for native mouse/keyboard and actual pixel review.

The generated ignored HTML reuses actual built entry markup/CSS, removes production scripts, and adds visibly labelled QA controls. How/Settings are disabled only in this fixture. The real product entry is tested separately via Astro preview on loopback 4321.

Native mode uses the actual Three scene and an instrumented RAF driver. Exercise Open/Close, pause/resume, remount, previous-handle disposal, unmount and late import. Check diagnostics: at most one session/canvas/pending RAF; zero after release. Negative modes use injected null context, constructor throw or loader rejection/delay. Context loss uses the native WEBGL_lose_context extension if present; render failure control injects the failure callback. These injected cases are not physical-device compatibility/FPS proof. RAF render exceptions are tested in preview-lifecycle.test.mjs.

Use only fixture buttons for mutations; supported browser evaluate may read the diagnostic output. No product globals/debug URLs or browser security settings are required. Saved evidence under docs/qa/m0-05 records native vs injected sources explicitly.

## Recovery download gate

Both storage fixtures set `allowRecoveryDownload:false`. Routine QA must not register download waiters or click recovery export. An attempted download from the local recovery harness triggered repeated browser permission cards; the owner cancelled approval. No retry, permission broadening, alternate origin/driver or indirect file retrieval is allowed without new relevant authorization. Core migration/recovery tests do not export anything and assert zero export requests. Actual download completion remains BLOCKED/UNRUN; this is not a passed control.

M5-03: `restart-harness.html` and `#qa-restart-run` use only bounded `myzootwin-qa-restart-*` databases, never the product/owner save. Capture actual reset/restore dialogs with `#qa-restart-review-view`; failures with `#qa-restart-error-view`. Visibility/pagehide cases explicitly inject listeners and must not be called native background. Run actual product Pause/Resume/reset/restore/reload separately on a verified empty owned QA origin. Reset keeps one pre-restart backup, later replacement requires explicit confirmation. No download/export waiters/buttons: the prior cancelled gate remains BLOCKED/UNRUN; all fixture mounts disable downloads and assert zero requests.

M5-04: `hud-harness.html` runs19 labelled real-IDB HUD/input cases in one bounded own database via #qa-hud-run. Hidden QA outputs avoid moving the product layout while results accumulate. #qa-hud-inspect reads renderer/HUD state; #qa-hud-hold/#qa-hud-release inject touch for a supported viewport-resize check. Synthetic keys/pointers/context loss are not native physical touch. Native full product flows and keyboard/scroll need separate actual controls in both languages. Never reassign captured evidence writer objects; keep each run identity immutable. No recovery export/download action or permission request is part of QA.
