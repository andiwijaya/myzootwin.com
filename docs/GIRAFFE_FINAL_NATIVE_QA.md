# Giraffe Plains final local verification

Final product source: `dfeef18ba6eb7d4d9095245738e209add7fc976b`. All four PRDs were read, implemented and tracked in [the living checklist](GIRAFFE_PLAINS_PROGRESS.md). **39/42 gates are verified (92.86%)**. The private release binding, presented-FPS coverage and authorized publication remain open. No push, deployment or owner-save operation occurred.

## Final source and build

Run `20261107T022626Z-aa7c1312` is **PASS**, including the six supported internal-browser cases and verified server cleanup. Tests: **821/821**, no failure/skip/cancel/todo; Astro **412 files**, zero diagnostics; nine-page build and nine HTTP/metadata/sitemap checks pass. Source fingerprint `2e11d399ff7d4f95c87dba5ceee339c43d41ef2586e15ef608aee085f9905ef6`; build fingerprint `f2da21b6f46347925eae329722a9fc17a7d6657687ef890555200c079c5e7094`. Exact report/logs/receipt are [final-dfe-report.json](qa/giraffe-hygiene/final-dfe-report.json) and adjacent `final-dfe-*` files.

The first receipt omitted the three screenshot-path metadata fields. Verification correctly failed, despite the actual screenshots existing. The original receipt and both verification attempts are preserved; adding the paths to those same observed captures passed without a source/build change or fabricated screenshot.

The actual distributed game was opened on a fresh OS-assigned loopback origin, with an observed empty test save before keyboard start. Only its own new synthetic progress was created. The 4322 renderer fixture is separately labelled and never represented as the full V4 world. Actual V4 gameplay used disposable named UUID databases on the owned 4381 server, compiled from the real product modules. No personal browser/desktop takeover or external browser driver was used.

## Native gameplay and art

[Evidence manifest](qa/giraffe-native-final/manifest.json) binds selected original JPEGs and projected full-state observations to capture hashes and source revisions. Earlier files bearing `.png` contained native JPEG bytes; exported `.jpg` copies preserve those bytes unchanged. Projections retain the entire authoritative state and replace duplicate validation/storage copies with explicit equality results; they are labelled as projections.

The four-habitat overview visibly preserves the old northern Macaw, Elephant and Lion areas, continuous paid visitor land route, and the empty southeastern reserve. Giraffe Plains occupies exactly x13..19/z2..8 in the saved-Macaw fixture; displayed anchor 14,3 is one-based. Native preview is green at the valid 49-cell footprint, red with a reason and disabled confirmation one tile west, and cancellation leaves habitats/grant unchanged. Actual confirmation creates one habitat and exactly one **-700 ZC** receipt. Normal tickets/upkeep continue during preview, so interim balances are not incorrectly treated as frozen. [Native plot assertions](qa/giraffe-native-final/plot-assertions.json).

The original low-poly adult rigs are recognizable from four angles: long legs/neck, distinct coats, ears, paired ossicones and tails. Actual Dira picking, camera drag, walk sequences and independent actors supplement geometric collision/IK tests. Native real-time captures show:

| Behavior | Actual authoritative proof |
|---|---|
| Essential high browse | Lila paused at reached upper leaves, phase remaining23; exact cold Continue; completed meal11→12 and stock5→4 with hunger improvement. |
| Drinking | Sora at the real blue water port, phase remaining21; lowered head/planted foreleg stance; exact cold Continue; drinks14→15 and stock3→2 with thirst improvement. |
| Social | Dira/Sora reciprocally paired with remaining17 at distinct positions; visible mutual head orientation; exact cold Continue. |
| Shade/rumination | Saved Lila rest65 at tick47822 cold-loaded byte-for-state equal across the renderer-only fix; rumination21 at47866; rest1260→1330, energy75.17→99.8 and shade recovery by47907. |
| Optional enrichment | Lila reaches the separate optional foliage; completion420→450 enriched ticks and stock6→5. Essential browse remains a separate survival resource. |

Visual QA found a real canopy/head intersection. Source `dfeef18` raises only the shade crown/trunk, preserving its footprint, price, stock, geometry count and all save state. The new test evaluates actual emitted leaf vertices against actual skinned adult rig vertices for both LODs and idle/rest/ruminate poses: the old crown failed (min2.637 vs adult max3.229), the new minimum3.537 clears the adult by about0.308. Red/green transcripts and matched native before/after captures remain versioned. Natural foreground foliage can occlude an animal from some camera angles; this is distinct from intersecting geometry.

## Responsive controls and recovery

Actual full-world ID/EN at **1366×768, 360×780 and 780×360** has one native canvas, no horizontal document overflow and five focus controls at least44px with unclipped labels. The 44px minimum exposed a real portrait no-wrap clipping issue; source `098bfca` wraps the focus row with a4px gap. All five focus destinations, four camera orientations, actual selection/drag and keyboard End/Home/Tab were exercised. Computed eligible ID/EN text contrast passed, minimum11.67; this is a computed-color audit, not physical-display certification.

The final labelled native controller ran **9 injected camera scenarios at each of three sizes (27 PASS)**, including tap threshold, drag, two-finger pinch, lift/cancel/lost capture, bounded wheel and UI/keyboard isolation. An active pointer was released by portrait→landscape ResizeObserver. These are actual-controller DOM event integration tests with `physicalTouch:false`; there was no physical finger/OS pinch test. [Exact camera captures](qa/giraffe-native-final/camera-injected-three-views.json).

Real low-power/reduced-motion/mute settings retain three adult actors, two bounded cached LODs, **10,140 triangles** and disabled sun shadows. Actual full-world WEBGL_lose_context→localized retry preserves the entire state, retires all prior GPU/frame/subscriber ownership and recreates one owner only. Final closure has zero owned resources and zero cleanup errors. Native product warn/error observations were empty with limit200 and uncapped. Actual journal navigation, Back and reload retain zero unsolicited renderer canvases. All owned tabs and servers are closed; viewport/visibility reset.

## Soak, stress and measurement limits

The earlier **900.3-active-second attempt failed** on the Lion route; that result is preserved in [the repair history](GIRAFFE_SOAK_ROUTE_FIX.md), never converted to a pass. Source `76e715e` fixes prospective ramp/prop clearance and remaining-segment safety without tightening historical save acceptance. Exact every-tick replay through22757 and both formerly failing regressions pass.

A fresh native **1× run passed 943.9 active seconds**, with **1040.1421 wall seconds**, four excluded pauses, zero invalid states, speed violations0, max pending RAF1 and ten retained residents. The saved tick30879 equals the entire cold Continue state with no offline progress. [Soak measurements](qa/giraffe-native-final/soak-summary.json) and exact stopped/cold captures are versioned. Paid care was performed through real controls; old birds required later refills, so this does not claim continuously high welfare in every habitat.

The clean soak is honestly bound to source `76e715e`. The only later product edits are navigation wrapping and static shade mesh elevation, shown in [source-bridge.diff](qa/giraffe-native-final/source-bridge.diff); no authoritative clock, schema, routing, FSM or rig changed. Final-source rendered/lifecycle tests were repeated after both visual fixes.

| Native measurement | Recorded result and scope |
|---|---|
| RAF callback delivery | 10,366 callbacks; interval mean91.14ms, p95 lower bound133.4ms; about10.97 callback Hz. **Not presented display FPS.** |
| Callback elapsed CPU proxy | Mean79.36ms/p95 lower bound104.2ms, including QA instrumentation; not OS CPU utilization. |
| Render submission elapsed CPU | Mean1.576ms/p95 lower bound2.6ms. |
| Native GPU timer query | 174 valid samples, 64-bit counter, disjoint0; mean5.42ms/p95 lower bound6.3ms. |
| Heap | End used40.87MB; nonstandard potentially shared/quantized estimate, not GPU memory or a leak certificate. |
| Save payload | Compact UTF-8 state measured at every retained minute checkpoint; exact sizes/deltas and natural ledger compaction are in soak-summary.json. End94,366 bytes. |
| 10× model stress | 10,000 ticks/72 paid services/all four visitor destinations/strict invariants/exact cold return; max105,968 characters. Node measurements remain separate. |

**GH6-04 remains partial because actual presented FPS is unmeasured.** Its active soak, CPU/heap/GPU and payload portions are now complete. No30/60 FPS or physical Android/iOS/Safari claim is made, and no additional desktop/driver workaround was attempted. The recorded roughly11Hz callback cadence should be considered when assessing performance; no numeric PRD acceptance threshold was invented.

## Remaining boundaries

GH0-01: private Cloudflare deployment binding is unverified. Automatic approval review previously denied opening the specific administrative deployment dashboard because local coding/testing authorization did not authorize private administration. It did not execute and was not retried. Public remote main was last verified at3252234; it is not inferred to be this local V4 candidate.

GH6-04: presented FPS coverage described above. GH6-06: separately authorized push/deploy and actual live source/save-safe smoke remain held. V4-aware maintenance/fix-forward is implemented and tested; never restore a V3 backup over a started V4 or resume an old binary on V4 data.
