# M5-07 usability audit - engineering verified, whole feature PARTIAL

Date: 2026-11-02 UTC. Implementation commit `768e030836a197abe3b919bb9d7429e513b40071` (local only). V1 remains **40/51 (78.43%)**, M5 **6/7**. M5-07 stays unchecked.

## Exact acceptance mapping

The canonical requirement is: "First-run user testing & UX fix of confusing steps; minimize clicks. Verify: unaided test notes and corrections."

| Requirement | Evidence and result |
| --- | --- |
| First-run user testing / unaided notes | **UNRUN for an independent human.** Three final-source fresh journeys used a familiar engineering agent, native supported browser controls and visible product guidance. They are engineering walkthroughs, not an unaided human study. Owner's brief preview has no study notes and is not counted. |
| UX fixes of confusing steps | **PASS for the engineering scope below.** Baseline observations, explicit corrections, 27 targeted integration cases and actual final product interactions are retained. |
| Minimize clicks | Q02 now opens the actual bird inspector directly instead of a camera-only detour. Paused Inspect/dismiss/care navigation no longer require resuming the simulation merely to read. No aggregate human click/time/success benchmark is claimed. Five guided path tiles still require ten Preview/Confirm actions; confirmation safety is retained. |
| Corrections verified across target layouts | **PASS for desktop1366x768, portrait360x780 and landscape780x360 viewports**, with paired ID/EN coverage described below. Physical touch/Android is not tested. |

Remaining human evidence is an external acceptance gap, not a denied tool action. No participant, independent unaided notes or outcomes are available. The [blank study template](qa/m5-07/HUMAN_STUDY_TEMPLATE.md) is explicitly UNRUN; no owner testing request is made now. This gap prevents marking M5-07 complete while allowing independent M6 work after parent review.

## Findings and corrections

Baseline source `8c722eec8ae4be97c9a78f872d26d0acd61b2f3bb56eedfc5df0982a7c426faa`: fresh desktop reached Q01-Q03, real care, admissions/tickets and exact reload/Continue. Q04 stayed in progress. Long agent/tool intervals at10x exhausted resources; these are not human balancing or timing results. [Raw baseline actions](qa/m5-07/baseline/walkthrough.json) retain the actual observations.

| Finding | Final correction |
| --- | --- |
| Q02 low-welfare action moved only the camera, leaving a Care/Inspect detour | "Check bird needs / Periksa kebutuhan burung" opens Care and the first low-welfare bird, with safe read-only navigation. Bird destination prefers Welcome or Inspect, never Reserve. |
| Normal Pause disabled Inspect, dismissal and care navigation together with mutations | Read-only information remains usable; five named mutation groups stay disabled. Hard storage conflict still makes the whole guide inert. Hidden care sections do not expose empty groups before play. |
| Care navigation could select hidden Cancel or destructive controls | Resource destination chooses only visible safe Confirm/Refill/Preview controls; otherwise it focuses the readable resource section. Depleted-existing-feeder and paused missing-food cases assert unchanged full saved payload. |
| Reserve appeared as a primary general care action | Secondary styling and explicit edit purpose: "Move birds to reserve for habitat edits" / "Pindahkan ke cadangan untuk edit habitat". Shorter intro directs food, water, rest and inspection. |
| Technical preview/start wording and incomplete Help note | "Explore the sanctuary" / "Return to start screen" with ID equivalents; Help points to visual and sound settings. |
| English Q04 number spacing | Readable "welfare 60", "for 30", "Earn 20", "at least 2". |

Simulation, economy, mission qualification, reward, save schema and visitor traffic rules are unchanged. No asset/dependency additions or broad redesign. Safe construction availability briefly changed during the landscape journey; only the observed disabled-then-enabled state is established, not a root-cause or human-friction conclusion.

## Final-source verification

Run `s20261102T050815Z`; source `0783a7670100a1b738b128038aebccf7a428d22942d78473ad77272e924b69bc`; isolated build `b57979507f5618a9dc060eea3303b7c5a045bcdc8b6577c7176006fb928eda30`. Final source/build equality was rechecked after the code commit. [Independent audit](qa/m5-07/independent-audit.json), [raw local report](qa/m5-07/local/report.json), [fixture matrix](qa/m5-07/final/fixture-matrix.json), [native results](qa/m5-07/native/results.json).

Commands from C:\MyZooTwin:

```powershell
$env:MYZOO_QA_SCOPE='usability-m5-07'
node scripts/qa/settings-isolated.mjs local
node scripts/qa/settings-isolated.mjs serve
```

The local runner executes `node --experimental-strip-types --test --test-reporter=tap tests/*.test.mjs` (explicit sorted paths), `node node_modules/astro/astro.js check`, and `node node_modules/astro/astro.js build --outDir .qa/builds/<run>`, then prepares the authored browser fixtures. The supported in-app browser opens generated usability/visual-settings harnesses at4322; native fresh journeys use the same verified build on separate loopback4351/4352/4353. No standalone browser driver or Actions was used. Serve cleanup uses `stop` + Enter. Native serve helper/receipts are evidence for this run, not a general newly promised public command.

| Check | Result |
| --- | --- |
| Unit | **454 PASS**, zero failures/cancelled/skipped/todo |
| Astro check | **181 files**, zero errors/warnings/hints |
| Isolated build | **PASS**; owner dist never replaced |
| Journal + play routes | **9 PASS**, direct/play canonical and9-entry sitemap retained |
| Targeted usability integration | **27 PASS**, nine per viewport: depleted-resource focus; Q02 needs/help; paused Inspect/dismiss; direct real inspector; ID labels; secondary Reserve; paused care navigation; external-writer hard conflict. Read-only operations compare full backend payload byte equality. |
| Prior visual/settings integration | **27 PASS**, nine per viewport, actual persistence/visual setting behavior retained |
| Native fresh product journeys | **3 PASS** through Q01-Q03, actual resources/two birds/visitors/tickets, Pause, paired-language Settings/Help, actual reload/Continue; exact saved tick/balance/missions/birds preserved |
| Recovery UI | Labelled owned corrupt-save fixture, native EN/ID review and Cancel **PASS**; unreadable source remains, Play blocked, download hidden. No new restoration/export claim. |
| Console | Zero warn/error entries in all three native journeys and final fixtures, read with cap200, not capped |
| Generic six-case browser-template gate | **UNRUN**; targeted evidence above is explicit and does not overwrite this gate |

Native portrait uses ID for the core journey then EN Settings/Help/Continue; landscape/desktop use EN core then ID Settings/Help/Continue. These are three paired-language journeys, not six full independent runs. Three missions per final journey; Q04 text was reviewed but final fresh Q04 completion is not claimed. No state/time fixture injection was used in these native product journeys. Fixtures are separately labelled whole valid starting states/authored test actions.

| Native journey | Saved tick | ZC | Missions / placed birds | Continue |
| --- | ---: | ---: | --- | --- |
| Portrait | 9043 | 927 | 3 / 2 | Exact, paused |
| Landscape | 2223 | 975 | 3 / 2 | Exact, paused |
| Desktop | 1952 | 985 | 3 / 2 | Exact, paused |

Actual screenshots: [portrait ID](qa/m5-07/native/portrait-paused-inspection-id.jpg), [landscape EN](qa/m5-07/native/landscape-paused-inspection-en.jpg), [desktop EN](qa/m5-07/native/desktop-paused-inspection-en.jpg). Native keyboard Enter dismisses paused details. These screenshots show actual rendered canvas and independently scrollable information; no physical-device claim.

Built shell plus lazy renderer: **989,462 raw bytes / 261,584 gzip9 estimate** ([file hashes](qa/m5-07/payload.json)); external fonts excluded. No network, latency, GPU or presentationFPS claim. No new render model/texture/audio asset.

## Evidence, limits and cleanup

Raw failed/superseded candidates are preserved in `candidate-history.zip`, with CRC and every-entry SHA verification in [history manifest](qa/m5-07/history-manifest.json). Candidate folders named final1/final2 remain candidates; they are not relabelled as final-source pass. Earlier fixture assumptions (missing hungry cause / full-food starting condition) were corrected with valid full starting fixtures. A candidate exposed pre-game empty accessibility groups, which were fixed before the final run. Native selector/wait mistakes were inspected before continuing, recorded in native-summary.json, and are not product failures. Agent delays at10x are not timing studies.

Five loose screenshots, bounded historical zip and three generated runs retained; only the two exact SHA/CRC-archived generated builds/reports were pruned. Original source/media/requirements/saves/earlier feature receipts remain. Owner preview **http://127.0.0.1:4345/play/**, PID18816, loopback binding, HTTP200 and dist fingerprint `e06d975a30b49470a1e80e915fbe39ce22ba102f16447dbef8776e7088d38b05` are unchanged. No browser navigation/reload/close/reset/save access on that preview. All owned QA tabs closed, temporary viewport reset;4322/4346/4350/4351/4352/4353 free. Runtime retention marking was not retried.

**UNRUN:** independent unaided human study, physical Android/touch/speaker, native background, full browser-process restart, presentationFPS/GPU/network and populated15-minute soak/live production. Optional recovery download remains **BLOCKED/UNRUN**, never retried; no permission prompts added. M0-01 external Cloudflare settings and M4-07 recording remain partial;12 M7 items deferred. No push/deploy/Actions/login/access change. Next independent microfeature: **M6-01 profiling**, only after parent review; M5-07 human portion stays pending.
