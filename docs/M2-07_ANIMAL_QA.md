# M2-07 - Comprehensive animal-action QA

Completed 2026-11-01 UTC. V1 **21/51 (41.18%)**. Local implementation/evidence **e11b373ec9a252529e06175a4ac1d281be6af64b**.

Implementation/evidence commit: **e11b373ec9a252529e06175a4ac1d281be6af64b** (local only). [Animal QA report](M2-07_ANIMAL_QA.md), [source-bound independent audit](qa/m2-07/independent-audit.json).

Reviewed cross-system gaps and added three substantive combined-action tests: 6,000 fixed ticks with interrupted/rebuilt care, pause, reserve/habitat removal/Undo and codec/editor reconstruction; simultaneous unreachable sources followed by real reconstruction/recovery; and exact full-state/event equivalence under irregular clock partitions. Serving deltas, each bird's consumption, emitted events, movement bounds, score validity and subscriber cleanup are checked together. Existing all-anchor, all-phase deletion and actual rig/contact coverage was rerun. This is accelerated deterministic simulation, not real-time performance evidence.

Final local gate `20261101T052122Z-8c5ba791`: **207/207 tests**, **94 checked files** with zero diagnostics, all **9 routes** and SEO baselines, **402 accepted fixture cases** across desktop/portrait/landscape, **3 explicit hidden/restore integration checks**, **9 inspected teardown events with zero owned resources** and **4 untouched actual screenshots** (1,027,571 bytes). Native built-product run lasted **322.63 seconds** at default 1x; both birds ate and drank 14 times. Native deletion/cancel/rebuild/refill, truthful welfare causes, ID/EN and keyboard cancellation passed. Labelled fixture pause, context-loss recovery and repeated remount checks passed. Native warn/error observation windows returned zero entries, with limit 200 and no cap. `qa:verify` and independent audit PASS at `2026-11-01T05:38:45.250548+00:00`.

The isolated browser remained visible when another owned tab opened: actual native background is **UNRUN**. Explicitly labelled fixture-only Document visibility overrides exercise the actual renderer listener, freeze care/ticks, and restore native descriptors. They never ship in dist. Injected touch and failure tests are distinct from native mouse/keyboard and physical Android. Presented FPS/GPU time, physical devices, network first-play timing, full-game 15-minute soak and live production remain UNRUN. The earlier invalid overlapping-cell fixture and operator-overlapped asynchronous model test are retained as resolved QA failures; accepted final evidence comes from a fresh sequential run. No product defect requiring a source fix was found.

Product source, original art/media/licenses, dependencies, journal/SEO and immutable PRD transcriptions are byte-unchanged from the preceding checkpoint. Build identity is unchanged; first preview remains **758,748 raw / 200,032 estimated gzip bytes**; existing lazy Three chunk warning remains. Prior cache runs were archived with CRC/every-entry SHA verification before exact owned-run pruning; three generated runs retained. Owned tabs closed, viewport reset, servers stopped/ports free. M0-01 external configuration remains partial; BASE-01/02 persist. **21/51 (41.18%)** verified, M7 all12 deferred. Next **M3-01**: visible visitor spawning from the real gate with a hard agent cap, avoiding water; path walking, satisfaction and ticket revenue belong to subsequent M3 items. Production **NOT DEPLOYED**.


## Coverage and reproduction

| Concern | Evidence and result |
|---|---|
| Mixed care/competition/priority interruption | `tests/animal-actions-qa.test.mjs`, existing feeding/watering/resting/autonomy/welfare suites; PASS |
| Missing, individually depleted, unreachable and deleted sources | Per-phase unit and labelled browser checks; simultaneous unreachable-resource recovery test; PASS |
| Habitat edit/remove/reserve/Undo | Protected occupied removal, reserve plus all resources removed, actual delete/Undo, rewelcome and stale-command guards; PASS |
| No teleport/contact | All21 legal habitat anchors, real geometry/rig vertex bounds and foot support tests, native actual pixels; PASS within sampled/tested scope |
| Pause/background | Native modal/Escape pause; actual visibility listener via labelled QA-only hidden getter/event; PASS. Native hidden state not produced by IAB: UNRUN |
| Retry/remount/disposal | Real `WEBGL_lose_context`, paused state equivalence, repeated remount, one session/RAF and zero owned resources; PASS |
| Sustained current product | Native default1x 322.63s run, independent bird counters, real refills/deletion/cancel/rebuild; PASS. Full V1 15min soak: UNRUN |
| Existing website | Local build9 routes plus baseline SEO/HTTP regression and native Animals/back/reload; PASS |

Run `node --experimental-strip-types --test tests/animal-actions-qa.test.mjs` for combined white-box invariants. Run `npm run qa:local`, `npm run qa:serve`, then follow `LOCAL_QA.md` with the approved isolated browser. Run each fixture scenario once and wait for terminal PASS/FAIL; the existing macaw scenario has no intermediate RUNNING marker, so blank/UNRUN during its asynchronous execution must never trigger a duplicate start. Complete camera, selection, placement, paths, editing, macaw, two-bird, feeding, water, rest and welfare in sequence at 1366x768, 360x780 and 780x360.

After actual care, press **Inject document hidden (QA only)**. Read diagnostics; tick, needs, consumption and resource state must remain frozen and pending RAF zero even if Resume is pressed while hidden. **Restore native visibility (QA only)** removes the own getter overrides and sends the real listener's visibility event; verify one resumed loop and no catch-up gain. This fixture does not emulate OS background behavior or a physical phone. Record actual native actions separately on port4321, use real screenshots, then close owned tabs/reset viewport, type `stop` in qa:serve, and run `npm run qa:verify`.

Evidence: `qa/m2-07/report.json` (raw logs/hash identities), `interaction-matrix.json` (accepted final cases and lifecycle), `native-real-time.json` (timestamped product samples), `browser-receipt.json`, `screenshot-manifest.json`, `independent-audit.json`, `attempts/` (including failures, superseded pre-visibility run), and `retention*.json`/verified archives. Screenshots are viewport/full-page IAB captures; saved image pixel sizes can differ from CSS viewport sizes and are not physical device resolutions.

Observed final diagnostic maxima were 32 geometries, 21 owned materials, 47 draw calls and 12,700 submitted triangles. These are sampled snapshots, not continuous peak counts or presented FPS. The byte-identical product build has no measured payload regression from M2-06. Optional heap estimates remain shared/nonstandard and do not establish global memory-leak freedom.
