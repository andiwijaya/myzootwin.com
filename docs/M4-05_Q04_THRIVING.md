# M4-05 - Q04 sustained care, real income and sanctuary achievement

COMPLETE - 2026-11-01 UTC. Implementation `b4039c84a89ea7b2151b90aaf55c745a83bb21e7` local only. **33/51 (64.71%)**, M4 **5/7**. Next **M4-06 speed**; no production change. M0-01 external source binding/build/root/autodeploy configuration remains partial; no login or new grants attempted.

## Player outcome

After Q03, Q04 shows a bilingual healthy-open timer and actual new ticket income/count, alongside concrete care/path/entrance controls. The player must sustain both birds at welfare >=60, with food/water access, connected habitat and an open gate for at least30 simulation seconds, and receive20 ZC from at least2 newly paid visitors during that same streak. Waiting guests have not paid. Earlier genuine Q03 tickets do not contribute to Q04. A visitor queued earlier can count only if its actual eligible crossing occurs after the streak baseline.

The PRD specifies a short period balancing welfare and income, small unlock, local achievement and expansion-goal preview; it does not fix duration or amount. Chosen starting balance is300 consecutive100ms ticks, threshold60 and20 gross ticket ZC/two admissions. Expenses remain real in the separate cashflow summary; this is not a claim of20 net profit. These are tunable game rules, not scientific welfare guidance or final V1 balancing.

An **unfinished** streak resets both timer and income baseline when welfare/resources/access/open entrance fail. Pause stops time and preserves partial progress. The timer caps at30 seconds while waiting for the required legitimate new income; it cannot complete on elapsed time alone. Native preliminary play actually showed30 seconds with only10 new ticket ZC, correctly incomplete. Correction/refill and later legitimate visits recover. An achieved condition stays recorded before explicit Claim, even if later distress occurs; current bird needs still change honestly.

Claim unlocks three consistent noncash outcomes: an original celebration banner at the real entrance, the **Thriving Sanctuary** achievement, and an expandable next-goal preview. The preview explains possible later species expansion without offering an unavailable purchase or implementing M7. The real View celebration button focuses the entrance. Details open with keyboard/touch, ID/EN text and no unresolved keys. Q04 adds no coins, zero-value ledger entry or automatic reward. Four missions complete, while autosave/full polish/release remain future work.

## Deterministic state and persistence boundary

`missions/thriving-objective.ts` evaluates real welfare/access and lifetime **ticket** amount/count deltas from a bounded streak baseline. Only the final fixed-tick publication advances time; ordinary events, UI reads and forged presentation events cannot. The last-tick guard prevents repeated fixed publication at the same tick, and a discontinuity restarts safely. No pre-Q03 duration or income is granted. Only actual ticket transactions increase the existing checkpoint-aware lifetime totals; starter money, mission rewards, refunds, restoration and recovery equipment do not count. No new RNG, RAF, bus subscriber, visitor or finance implementation.

State stores bounded typed start/last tick, ticket baselines, earned income/admissions and capped duration. Codec rejects malformed counters, future/earlier-than-prerequisite timing, inconsistent ticket/count arithmetic, absent qualification and wrong reward shape. Q04's exclusive noncash reward combines `sanctuary-banner`, `thriving-sanctuary`, tick and command in the existing clone/validate/commit transaction. Its command must follow Q03, and ordered mission completion/nonce changes once. Replays/duplicate clicks, stale quotes and paused claims cannot separate or regrant outcomes. Long journal compaction preserves all proof and exact balance without the old960-entry freeze. Native partial/earned/claimed handoff and serialized archives survive remount.

Persist means the versioned serialized/page-session contract in this milestone. Actual same-page close/reopen retains all four claims, banner/achievement and60 total mission cash. Actual full reload starts wholly fresh1500/no claims/no unlock until M5; locale alone persists. No durable browser storage or migration is claimed here.

## Final acceptance evidence

Run `20261101T163523Z-c0444b8c`; source `12b9affdea1851339316209f24edaf4f69c6c9e4acc42d1fc71b84b4608b5c2f`; build `ffd46fc607f1361a824a159b2428a7c2261adbf8476f8bf6c81f96c56667e1f4`. The tested final product bundle is identical to candidate2, whose old-copy assertion failed; source identity differs because that one QA assertion was corrected. Final acceptance uses fresh final-source runs, never relabels candidate2.

- `npm run qa:local`: **370/370 tests**, **146 checked files**, zero errors/warnings/hints, build and **nine route/SEO regressions PASS**.11 new tests cover deterministic care/ticket qualification, resets/recovery, pause, genuine revenue versus refunds, delayed/duplicate claims, corruption, compaction/codec and original banner geometry/disposal.
- Approved isolated browser, verified1366x768 /360x780 /780x360: **22 sequential suites x272 cases =816 PASS**. **12 Q04 cases per viewport (36)** include genuine unaccelerated care/income after labelled whole starts, forged UI-only ready event, partial codec/remount, closed entrance reset, critical recovery, disconnected path/cancel, pre-Q03 history, delayed claim, localization/interactive expansion details, and archived achievement. All prior780 cases remain, with obsolete future-Q04/history/copy expectations updated to actual behavior, not skipped.
- Three fresh **native product** Q01 -> Q02 actual consumption/welfare -> Q03 paid/viewing -> Q04 runs, using real construction/care/gate/claim controls. Agent monitored ordinary supplies and waited real simulation time; no state/time injection. This is separate from labelled fixtures and is not an external unaided participant study.

| Native viewport | Q04 balance before -> after | Fixed ticks in streak | New ticket ZC / admissions in streak | Lifetime ticket income at claim |
|---|---:|---:|---:|---:|
| desktop | 981 -> 981 ZC | 300 | 20 ZC / 2 | 70 ZC |
| portrait | 989 -> 989 ZC | 300 | 20 ZC / 2 | 70 ZC |
| landscape | 969 -> 969 ZC | 300 | 20 ZC / 2 | 60 ZC |

Q04 total cash reward remains0 and combined mission cash60 in every run. Later ordinary upkeep/refills can change screenshot balances, recorded separately by cashflow; they are not reward money. Three untouched full-page-requested captures total **1,204,725 bytes**: [desktop](qa/m4-05/screens/desktop-native.jpg), [portrait ID](qa/m4-05/screens/portrait-native-id.jpg), [landscape ID](qa/m4-05/screens/landscape-native-id.jpg). Actual banner, readable achievement and open expansion details inspected in pixels; viewport emulation is not physical Android.

- Final claimed archived state survives `WEBGL_lose_context` and retry plus **three paused remounts with127 explicitly present equal fields**. This includes banner234 triangles/one material and care/ticket/mission state. Five clock phases hold at1254 during pause and resume to1367 with exact event/core/visual time relations; one session/one pending RAF maximum. Injected hidden/visible events are labelled, not native-background evidence. Disposal leaves zero geometries/textures/programs/materials/subscribers/frames/canvas and disposed core.
- Actual seven-tab warn/error reads are empty, uncapped limit200. Journal navigation/back/reload canonical correct. Every owned tab closed, viewport reset and loopback4321/4322 previews gracefully stopped/free. `npm run qa:verify`, independent ledger/identity/receipt/log/screens/archive audit and clean checkpoint check PASS.

Raw evidence: [report](qa/m4-05/report.json), [browser receipt](qa/m4-05/browser-receipt.json), [interaction matrix](qa/m4-05/interaction-matrix.json), [independent audit](qa/m4-05/independent-audit.json), [attempt resolution](qa/m4-05/attempts/resolution.json).

## Art, resources and measured limitations

Banner is original repository-authored geometry: **234 triangles, one vertex-color material, zero textures, one mesh**, reused for200 repeated syncs without allocation. Poles meet the ground and pennants sit visibly above the existing canopy; no visitor/path or collision effect. Geometry/material disposal balanced twice, no world mutation. Provenance/SHA added as one asset-manifest entry; existing assets/licenses unchanged. No purchase, download, agreement, upload or dependency change.

Shell **192,387 raw bytes**, first preview **904,496 raw /239,799 summed gzip9 estimate**, lazy scene **712,109 raw**. Compared with M4-04: shell delta+6,811, preview delta+11,830, gzip estimate delta+2,609, scene delta+5,019. These are local build bytes, not measured mobile download or first-interaction latency; external fonts remain unmeasured. Lazy chunk warning is retained for measured M6 profiling.

The final populated archived scene uses two equipped macaws, Q02 flowers and banner, zero active visitors. Its recorded retry state had45 draw calls/13,614 submitted triangles; subsequent pose/fruit/culling changes affect these counts. The callback probe completes under concurrent regression load; its full raw scope/metrics and nonstandard shared JS heap observations are in the interaction matrix. Callbacks/submission CPU are **not presentation FPS/GPU time**, and no equivalent-device performance improvement or leak proof is claimed. Full physical Android/iOS/Safari, native background, actual presentation FPS, full-game15-minute soak,10x, durable saves, human unaided test and live deployment remain UNRUN.

## Hygiene, known risks and next

No remaining P0/P1 defect found for this slice. A missing totals import failed initial core tests and was corrected. An unused helper hint was removed by actually asserting the view. Candidate1 preflight was aborted by a source-edit/Vite reload and excluded. Candidate2's full chains correctly stopped on an old hint-copy expectation; actual product state/money were correct, but no full pass was accepted. All raw failures, preliminary native/lifecycle observations and candidate2 screenshots are retained in a verified archive; final gate/browser reran fresh. Uncertain transport pause outcomes were inspected before continuation. No denial or bypass occurred.

Candidate3 also rejected an old hidden-future-button assumption: active Q04 correctly remains visible but disabled. Its corrected check additionally requires incomplete Q04 and unchanged money/nonce. Candidate4 landscape feeding consumed two actual portions (stock8->6; both hunger76.44->49.44) but failed a requirement to sample the short Seek state from render frames. The observer started two frames after refill. Exact failed seek samples/positions were not retained; a separately labelled legal core fixture demonstrates the observation boundary without claiming an exact browser replay. The corrected browser assertion still requires each real Eat pose, both actual meals, lower hunger and per-bowl stock/visual conservation; fixed-tick tests still require Seek and Eat. Bounded failure observations were added. Both other incomplete candidate4 chains were aborted and excluded. No animal/visitor/economy implementation changed for this correction.

The five-run hygiene guard held a further gate before execution; verified archives and supported scoped pruning resolved it before gate5b. No guard bypass or denied permission. Preliminary receipts and sample-reproduction failures remain labelled and recoverable.

Existing FIFO queue pacing, lengthy development panels, shorthand timer-copy polish and care reminders remain M4-07/M5 UX/balance work; current accessible primary controls function. M0-01 external Cloudflare configuration stays partial and gates production release. Original PRD transcriptions/media/old QA receipts remain intact. Generated-only pruning follows CRC plus every-entry SHA verified archives, keeping three owned working runs and bounded committed artifacts.

Next **M4-06**:1x/10x fixed-step speed, explicit UI indicator and deterministic equal-simulation-time care/economy/mission behavior, bounded catch-up/background/pause/save semantics, one render loop and no10x GPU workload. Speed is not implemented/checked by M4-05. No push/deploy/Actions/login/access change.
