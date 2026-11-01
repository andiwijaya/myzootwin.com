# Local QA — repeatable foundation workflow

Use the existing Node 24 installation (verified 24.12.0), npm and repository dependencies. No new package, browser driver, global install, PowerShell policy change, Actions or production access is required. This workflow tests the current nine-route **foundation**; it is not the V1 gameplay release gate.

## Commands from the repository root

```powershell
npm test
npm run qa:local
npm run qa:verify
npm run qa:serve
```

`npm test` discovers the root `tests/*.test.mjs` files using native Node strip-types. `qa:local` creates a unique ignored `.qa/runs/<runId>/` directory, runs the full discovered suite with complete TAP, Astro check/build, then starts and stops its own loopback Astro preview for HTTP checks of all nine routes, `/play` direct URL and sitemap. It records UTC timestamps, Node/platform, Git HEAD, test file list/counts, complete bounded logs/hashes, source fingerprints **before/after** tests and a fingerprint of all built output. A changed input, failed command, incomplete/capped test log or bad route is FAIL; stages not reached stay UNRUN. Logs are limited to 2MB per command, with overflow/timeout always failing.

After the automatic stages succeed, the overall status is deliberately **UNRUN** because the browser steps have not happened. `qa:verify` before a browser receipt exits **2 (UNRUN)**, not zero. A complete verified workflow exits **0 (PASS)**; any failed consistency check exits **1 (FAIL)**. This explicit UNRUN exit is expected, not a request to bypass the browser stage.

`qa:serve` reads `.qa/latest.json` (or accepts an exact run ID after `--`), rejects a changed source/build and occupied ports, and owns only its two direct Node child processes: actual built `/play/` at **127.0.0.1:4321** and the labelled renderer fixture at **127.0.0.1:4322/tests/browser/.generated/preview-harness.html**. No alternate-port retry or unowned process kill. Leave this command running during the browser recipe. For agent execution, allocate an open PTY (`exec_command` with `tty:true`); a plain-pipe exec session may close stdin before the stop command. A normal foreground PowerShell terminal already provides interactive stdin. Type `stop` and Enter in this foreground command for graceful child shutdown and verified free ports. Ctrl+C also requests a stop when delivered normally; an external forced interruption may prevent its final receipt, so verify the ports separately in that case. Preview output is bounded; any overflow prevents final PASS. The generated fixture is ignored, contains the run/build/source IDs and is not an Astro product route.

## Supported browser recipe (manual via the approved runtime)

Use the documented isolated in-app browser/computer-use runtime; no standalone Playwright, Puppeteer, CDP, extension/personal profile or hidden automation route. Browser `evaluate` is for read-only DOM/diagnostic observations. Perform mutations with the actual buttons/selects and supported navigation APIs. Screenshots must capture the actual native canvas and be visually inspected. Viewport dimensions are DOM observations, not physical-device claims.

Start from the generated `browser-template.json`, preserving the exact run/build/source identities. Save the completed receipt as `browser-receipt.json` in that run directory. Set real UTC `startedAt`, `finishedAt`, per-case `observedAt`, `method: approved-cua-isolated-browser`, `physicalDevice: false`. Each case starts UNRUN; only record PASS after actual observation. A failed action records FAIL and its evidence; fix/retest rather than relabeling a failed/stale receipt. The six case IDs are mandatory:

| Case | Actual actions and required `data` |
|---|---|
| `desktop-native` | Actual built `/play/`; set/verify **1366×768**, press Open with keyboard, inspect real canvas. Record `width,height,documentWidth,state:'ready',canvas:1,visualReviewed:true,entryScript` (pathname of the actual built PlayEntry script). Save `screens/desktop-native.jpg`. |
| `portrait-native-id` | Use working Settings to choose ID, close/Escape; set/verify **360×780**, inspect canvas and readable controls. Same data plus `lang:'id'`. Save `screens/portrait-native-id.jpg`. |
| `landscape-native-id` | Set/verify **780×360**, inspect actual canvas/UI with no page overflow. Same ID data. Save `screens/landscape-native-id.jpg`. |
| `native-lifecycle` | Open labelled fixture. Read visible `#qa-run-id`, `#qa-build-id`, `#qa-source-id` into `harnessRunId,harnessBuildId,harnessSourceId`. Record `samples` from the DOM `#qa-diagnostics`: `ready`, `paused`, `still-paused` after other UI actions, `resumed`, and `closed`. Each sample has `name` plus the diagnostic fields. Confirm time/tick/event/world visual time, one session/subscriber/RAF and zero resources after Close. |
| `injected-failure-retry` | With a native fixture canvas, use **Inject context loss** (WEBGL_lose_context). Record `source:'WEBGL_lose_context',failedState:'error',failedReason:'context-lost',failedCanvas:0,failedSubscribers:0`; press Retry and record `retryState:'ready',retryCanvas:1`. This is an injected test, never a physically unsupported-device claim. |
| `navigation-reload` | Actual product: follow journal link to `/animals/`, Back to `/play/`, verify no canvas, reload and verify no canvas/correct canonical. Record `journalPath,returnPath,returnCanvas:0,reloadCanvas:0,canonical:'https://myzootwin.com/play/'`. |

Use the runtime's real native-product warn/error log read with limit **200**; save `console:{entries,limit:200,capped:false}`. If 200 entries are returned, mark capped and investigate; do not call capped history a clean console. This receipt is an operator-observed runtime capture window, not independent instrumentation of every browser event or a performance test. Fixture context-loss diagnostics are labelled separately from native-product console results.

Before finishing the receipt, close only owned tabs, reset the temporary viewport and set `ownedTabsClosed:true,viewportReset:true`. Do not leave PASS defaults in a template. The verifier checks method, timestamps, all six cases, exact build/script/fixture identities, numeric viewport/core ownership observations, explicit pause/recovery, native console completeness, JPEG presence/hash/size/distinctness and current unchanged source/build. Browser interaction and visual judgment remain **manual through the approved runtime**; receipt consistency/HTTP/unit checks are automated. This is not an unattended browser-driver claim.

Save screenshots through the supported browser screenshot API. When the runtime can only write to its authorized workspace, save there first, then copy those exact own screenshot/receipt bytes into the run with an authorized file operation. Never fabricate a PNG/JPEG from DOM, fabricate missing observations, use placeholders or recover an earlier run's screenshots as new evidence.

Type `stop` and Enter in `qa:serve`, wait for its stopped/free-port receipt, then:

```powershell
npm run qa:verify
```

Optional exact-run selection: `npm run qa:verify -- 20261031T000000Z-12345678` (replace with the actual generated ID). Each verification attempt appends a status/hash record to `verification-attempts.jsonl`; failures and an initial UNRUN remain visible. `report.json` is the current result, not a production release approval.

## Artifact bounds and preservation

Generated runs are ignored. At five runs, a new run refuses to start until reviewed/archived. Each screenshot is at most 2MB; at most eight screenshots are accepted. The normal recipe captures three. Preserve only a bounded, selected report/log/receipt/screenshot set under `docs/qa/<feature>` for a local feature commit; never commit `dist`, dependencies, massive video or a whole unreviewed cache.

```powershell
npm run qa:prune
npm run qa:prune -- --apply
```

Prune defaults to a **dry run**, retains the newest three generated runs and only accepts directories marked by this tool's `qa-owner.json`. Apply verifies the resolved absolute path remains under this repository's literal `.qa/runs` root and refuses symlinks/unknown directories. It never prunes `docs/qa`, source, existing media, saves or Git rollback history. Archive any needed evidence before applying. No automatic deletion of historical receipts.

Physical Android/iOS/Safari, FPS/network/soak tests, actual gameplay/save/mission E2E and live production tests remain separate UNRUN gates until those features/environment exist. See the living PRD and M0-01 external Cloudflare blocker. Reference for native test semantics: [official Node test runner](https://nodejs.org/docs/latest-v24.x/api/test.html); execution here is verified on the installed Node version, not an upgrade.

## M1-02 camera checks

After Open, zoom in before dragging: overview locks pan so the complete island stays framed. Native approved-runtime checks use actual canvas wheel and drag, verify unchanged page scroll inside the canvas, then verify page scrolling outside it preserves camera state. Focus the world for arrow keys, +/−, Home and Escape; toolbar/dialog interactions must not pan it. Capture both overview and a zoomed/panned view with the current build identity.

The labelled fixture's **Run injected camera checks** runs nine explicit DOM-event integration scenarios for tap/drag, two-finger pinch, pointercancel, lost capture, wheel bounds, UI isolation, keyboard/Escape and pause. Run at1366×768,360×780 and780×360; save actual result output. This is injected PointerEvent/WheelEvent/KeyboardEvent coverage, never physical touch or OS pinch evidence. Unit tests separately verify the ray through the real orthographic view center remains within the ground map under adversarial inputs.

For orientation interruption: use **Begin injected camera gesture**, record cameraPointers1, set/verify a new viewport through the approved capability, then confirm cameraPointers0 after ResizeObserver and actual layout. The diagnostic readout is throttled250ms; do not mistake a previous DOM snapshot for current dimensions. Read actual DOM innerWidth/innerHeight and use a subsequent fresh diagnostic update before accepting the result. Repeat portrait→landscape. Pause/remount/unmount/context loss must release pointers; disposed controls must have cameraControlsDisposed true with no RAF/subscriber/GPU ownership remaining.

Keep the six base receipt cases and the same final-source freshness checks. Record native versus injected method per additional evidence file. Performance probes remain callback/CPU-submit measurements on a small entry canvas, not true FPS or physical mobile benchmarks.

## M1-03 selection checks

On actual built /play, click visible grass and a visible tree/entrance. Check the 3D bounds/ground cue matches the object and the bilingual identity panel names it; labels use1-based map coordinates. Verify a canvas click does not shift page scroll, drag/wheel/Home keep selection, and the panel itself does not pick through. Empty canvas background, Dismiss and Escape clear the marker, identity dataset and hidden title/location/detail. Enter/Space with the world focused inspect its visible-center reticle; toolbar keys remain scoped to UI. Reopen/history/reload must begin with no selection. Capture actual selected object/tile pixels across the viewport matrix; do not substitute a successful DOM assertion for visual review.

The labelled fixture's **Select gate fixture** uses QA-projected coordinates and injected pointer events, explicitly not native/physical input. Let the actual marker render, then **Run injected selection checks** at1366x768,360x780 and780x360. Save12-case result output per size. It checks visible triangle ownership, repeat-tap idempotence, drag/pinch with/without prior selection, empty deselection, panel isolation/dismissal, locale, cancel/late release, pause, keyboard and bounded marker reuse. Run existing camera checks too.

For orientation: with the gate selected, Begin injected camera gesture, record one held pointer, resize via approved viewport, then verify pointer0 and the same gate ID/identity/marker after a fresh250ms readout. Repeat portrait to landscape. Lose context/remount/unmount with active selection; verify selectionDisposed/controlsDisposed true and all ownership counters0, then Retry has no identity/marker/title left over. The indicator owns two reusable geometries/materials. Once rendered, hidden indicator GPU resources/programs remain cached for reuse until session close; this is intentional bounded ownership, not a leak.

Performance evidence distinguishes unselected warmed idle frames from selected marker frames (actual selected gate adds three draws/four triangles with the current transparent double-sided fill). These remain callback/CPU-submit measurements, not presented FPS, touch latency, physical Android or a soak certificate.

## M3-01 entrance arrival checks

On a fresh fixture, **Run fresh sequential regression chain (QA only)** runs the existing suites in order, followed by arrival checks, without manual idle gaps. Wait for final PASS/FAIL; per-step outputs remain available. Manual individual suite buttons are still useful for diagnosis. After the existing camera, selection, placement, path, editing, macaw, animal, feeding, water, rest and welfare sequence finishes, run **Run real entrance-arrival checks** in the labelled fixture. Start only once and wait for terminal PASS/FAIL; macaw and visitor hooks now show RUNNING and disable overlapping starts. The eight new cases use actual fixed ticks and product commands (not accelerated state/time injection): closed state, blocked unconnected intake, real adjacent path construction, separated cap3, pause, ID/EN and entrance focus, safe closing/drain, and unique reopen with shared model buffers. Run at1366x768,360x780 and780x360. Preserve any failure before a fresh attempt.

Test the actual built product on4321 separately. Place a path beside the real gate (the baseline gate is1,8;1,7 is a legal neighbor), open the entrance, and press View entrance. Inspect actual people at normal game scale, native open/close and keyboard controls, stable IDs, the cap and no page overflow. These are viewport tests, not physical Android/touch proof. The existing native receipt cases and screenshot limits still apply.

With three active arrivals and two macaws, record the existing five-second callback probe and resource diagnostics. CallbackHz is not presentation FPS; CPU model buffer bytes are not GPU memory. Explicitly injected hidden/context-loss/remount scenarios must preserve visitor serials, age, cooldown, positions and intake state as well as animal/resource fields. Closed/unmounted sessions must have zero visitor models/geometries/materials and zero pending frames/subscribers. M3-01 is entrance-only and must not claim habitat navigation, satisfaction, paid admissions, durable save or a completed game.

The rest/enrichment browser recovery window is bounded by1,800 accepted simulation ticks and210 wall-clock seconds. Exhausted birds must finish urgent food/water and recover energy before exploration. Completion still requires real benefit ticks and observed enrichment gain (or a correctly capped100 score), not elapsed time alone. Failures retain the starting/current state and a bounded350-sample tail; the renderer is paused at the end. These are recovery-test budgets, not gameplay pacing or FPS claims.
