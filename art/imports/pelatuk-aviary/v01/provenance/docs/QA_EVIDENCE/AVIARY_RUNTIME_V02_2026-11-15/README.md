# Native Aviary runtime V02

**Local quality, integration, visual/flow QA and bounded browser performance accepted; preview/live release verification remains in progress.** The owner authorized autonomous completion through deployment, with original asset quality first. This directory records actual delivered GLB rendering through the product controller. It does not certify equivalence to wildlife photography or a physical Galaxy A56 result.

## Scope and isolation

The loopback runtime harness mounts the exact product HTML/controller with an in-memory backend, no owner IndexedDB, no preference storage, no broadcasts and no recovery download. Whole fixtures are prepared before mount with the real simulation; stock variants are explicitly labelled QA fixtures. `thriving` genuinely earns all four missions before mount. There is no per-frame substitution of game logic or economy.

The production preview uses the actual `/aviary/?qa-session=pre-release-20261115` route. This explicit namespace has its own IndexedDB database, disables shared preferences/broadcasts/download, and visibly identifies itself as QA. Invalid namespaces fail closed. Normal player database identifiers/schema/transactions are unchanged. Persistence evidence on this route is separate from the in-memory harness evidence.

## Evidence and findings

| Area | Evidence and bounded result |
| --- | --- |
| Retained model views | Original 20 mobile + 20 desktop + 8 landscape stills, plus 20 expanded-mobile and 8 each expanded-desktop/landscape stills. Two species and all ten clips are covered in the mobile matrix. Representative floor, bark, bowl, flight, rest and handoff views were visually reviewed alongside actual-geometry CPU checks. |
| Autoplay | `autoplay.json`: seven clips per species, advancing rendered animation while the authoritative simulation tick stays fixed. Takeoff/landing stop at their endpoint. |
| Resource lifecycle | `reference-cycles.json`: six open-reference/close cycles with stable closed geometry/texture/depth counts. `session-cycles.json`: six complete renderer sessions return pool instances/templates/images, geometry, textures, programs, pending frames and owned materials to zero, with zero cleanup errors/subscribers. Compare final disposed ticks to the next session's start tick, not a potentially older 500 ms UI sample. |
| Real stock | Sixteen desktop and sixteen actual 390x844 mobile cases cover empty, last portion, full and asymmetric bowls. Empty selected bowls use a planted standing pose; the other facility's stock remains authoritative. `mobile-stock-cases.json` is the explicit mobile set. |
| Camera/reduced motion | `camera-bounds.json`, `reduced-motion.json` and mobile/desktop reduced images cover actual near/far clamps, disabled bound buttons, quarter-angle reset, keyboard orbit/Home and opening paused. |
| Phone observation size | `mobile-observation-expanded.json`: actual canvas height 528.875 CSS px on 844 px viewport, 62.66%. The earlier 269 px canvas was rejected for close observation; management retains the compact split layout. Tools remain independently scrollable. |
| Earned decoration/visitors | `desktop-high-earned-banner-corrected.*`: genuine Q04 banner and Q02 flowers. The earlier uncorrected image exposed visitor intersections with gate footings. Removing the duplicate visual lane offset fixes the queue. Actual posed component-box checks cover all three styles, all three bays and six arrival ages without changing saved positions. Walking uses rendered distance/native stride speed, and observation freezes visitors. |
| Native gameplay | A fresh game was built entirely through UI: habitat preview/cancel/confirm, five path tiles, Q01 claim, all three facilities, supplies and both birds. Actual timber and paver picking work; occupied habitat deletion is refused. Path delete refunds 15 ZC and Undo repays 15 ZC/restores connectivity. See `mobile-new-flow.json`, `mobile-native-edit-undo.json`, protected-habitat image and `mobile-built-save-reopen.json`. |
| Load recovery | Initial synthetic transport outage exposes the product reload control, which recovers on a real reload. The harness models a one-off outage using navigation type and stores no fault flag. Detail outage targets only the hashed detail GLB, preserves the overview/world and recovers through the actual Retry control. See `initial-load-*` and `detail-load-*`. |
| Production route | `production-preview-before-reload.txt` / `after-reload.txt`: native build, real QA IndexedDB, Q01→Q02 and 1,145 ZC persist through reload; resume starts paused. Header/footer, controls and QA notice switch to English. Dynamic Low/High and reduced motion apply through the real settings dialog; observation stays paused. Production preview warning/error console was empty. |
| Package | `production-package.json`: all 47 models and 50 shared WebP textures fetched from production preview; Brotli transport and decoded SHA256 match selected candidate F. No canonical masters, authoring inputs, test harness, map or environment file appears in production output. |
| Homepage card | `homepage-card-source.png`: actual 960x600 native canvas in the harness's full-canvas presentation, encoded as WebP without scene generation/retouching. The first crop included the HUD and is retained as `homepage-card-rejected-hud.png`. |

Viewport overrides and screenshots are desktop browser evidence. Some early captures have DPR 1.5, while later captures report about 1; renderer Low still caps its pixel ratio at 1. Recorded CSS viewport/canvas rectangles are authoritative for layout measurements. Screenshot output dimensions can differ from CSS viewport dimensions in the available browser capture surface.

## Preserved rejected/intermediate evidence

- `desktop-high-earned-banner.png` is the **pre-fix** gate intersection image; use the `-corrected` counterpart for acceptance.
- `detail-injection-rejected-initial.json` records a faulty harness predicate that also matched the overview GLB. This was a test-fixture error, fixed with an exact hash-pattern match before the accepted detail-failure/retry pair.
- Earlier matrices precede the expanded observation layout; later `*-expanded-*` captures substantiate its framing. The source assets/animations are the same accepted candidate F bytes.
- The reduced desktop capture is named `desktop-reduced-common-drink.*`; the mobile English reduced capture is separate. No desktop capture is relabelled as a phone result.

## Regression and remaining limits

`aviary-tests.log`: 570/570 full Aviary tests; `unit-tests.log`: 295/295 original-game unit tests; `final-focused-tests.log`: 39 focused tests after UI/sampler corrections, including four new render-timing tests. Additional world/QA checks verify distance-driven visitor strides, unchanged same-tick interpolation, frozen observation visitors and actual gate clearance. Production typecheck/build pass; the existing large dynamic engine/renderer chunk warning is retained without relaxing thresholds.

Model fidelity, contact and cleanup checks are specific evidence, not proof of every possible camera/route combination. Lighting, feather grouping and foliage remain an artistic approximation. No touch hardware, physical Android FPS/thermal session, speaker listening or human pacing acceptance is claimed. No owner approval/download test was requested. The active timing and source inventory receipts accompany this checkpoint; release identity and live smoke remain mandatory.

Earlier frameMedianMs/frameP95Ms fields in non-benchmark captures came from an exploratory RAF sampler and are not accepted performance measurements. The corrected render-interval sampler and its tests are used for the dedicated active-world performance record; active stalls are retained and explicit pause/background gaps are counted separately.


## Dedicated active-world measurement

`performance-active-world-final.json` records **614,770.5 ms active**, 36,640 sampled render intervals, **16.7 ms median / 16.9 ms p95**, zero interruptions, maximum **147,664 triangles / 150 draw calls**, and maxima 115 geometries / 58 textures. The same counts remain stable in the later samples. This is the actual thriving simulation at 1x, Low profile and a 390x844 desktop-browser viewport; food/water were refilled intermittently through ordinary UI, and real admissions continued. No build, full test run or other browser tab/viewport work was performed during the sample. Instrumentation overhead is included. It passes the stated browser-proxy timing/render targets and is not a physical A56/thermal/touch measurement.

`runtime-delivery-budget.json` independently sums 29 first-ready models and 24 shared textures for each visitor style: worst payload 5,389,203 bytes, plus a conservative 768 KiB bootstrap reserve gives 6,175,635 bytes, below 6 MiB. The actual gzip-sized bootstrap allocation is 502,168 bytes (490.4 KiB). This is a static transport allocation, not a measured physical-device first paint or all-library download. The whole 18.6 MB catalogue is streamed selectively. The card now has a new public filename (`aviary-gameplay-native-v01.webp`) so an existing cached baseline image is not reused; the prior card is retained.

Final bounded classic-game smoke opened both practice species, rendered the game, exercised native movement/peck input and pause, and switched ID/EN without progressing a saved adventure. Food remained 0/2 in the captured Flameback case, so no completed feeding/lifecycle claim is made. Final product settings/menu-stability and classic/homepage console receipts are included. All recorded warning/error console arrays are empty.
