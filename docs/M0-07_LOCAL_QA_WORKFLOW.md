# M0-07 — Reproducible local QA and supported-browser evidence

Status: implementation and relevant verification complete, 2026-10-31 UTC. Subsequent living-PRD completion record references the local implementation/evidence commit. No product gameplay/UI code or dependency upgrade; no Actions/push/deploy.

## Delivered workflow

Native Node test discovery consolidates all existing 36 tests and nine QA failure-detection tests (**45 total**). Portable Node scripts expose `npm test`, `npm run qa:local`, `qa:serve`, `qa:verify` and `qa:prune`. Full instructions, six case data fields and manual/automated boundaries: [LOCAL_QA.md](LOCAL_QA.md); [fixture README](../tests/browser/README.md).

`qa:local` runs complete TAP/unit/integration, Astro check/build and actual built HTTP route/canonical/title/H1/sitemap checks through its own short-lived loopback preview. Per-run report records UTC start/finish, Git HEAD at run start, Node/platform, explicit discovered test list/counts, full bounded log hashes, code/test/tooling/package/config/baseline source manifest before/after tests and all built-file hashes. Git HEAD is the pre-commit baseline; exact implementation bytes are identified by source fingerprints. Public served asset bytes are represented in the complete build manifest. Stages use **PASS/FAIL/UNRUN**; overall remains UNRUN until real browser evidence exists. Failed/truncated/capped/duplicate-summary/skipped test results cannot pass. Invalid source changes during checks fail; source/build changes before browser/verification invalidate old receipts.

`qa:serve` rejects occupied ports and stale source/build/fixture IDs, then owns only its two direct Node previews on 127.0.0.1:4321/4322. The generated ignored fixture visibly names run/build/source, uses the actual renderer/core and has no production route. A normal foreground terminal or agent PTY (`tty:true`) accepts `stop` + Enter for verified child shutdown; no browser driver, personal profile, security bypass or ExecutionPolicy change. `qa:verify` checks the six operator-observed runtime cases, time/identity/DOM viewport/core/pause/recovery observations, uncapped native console capture, three distinct actual JPEGs, bounded paths/hashes and final free ports. Browser interaction/visual judgment is **manual through approved cua_repl**, not a standalone/fully automated E2E driver. Verification attempts append history; absent browser evidence exits2 UNRUN, inconsistency exits1 FAIL, completed recipe exits0 PASS.

Ignored generated output is bounded at five runs, command logs2MB, screenshots2MB each/eight maximum. A new run refuses a full directory. Prune defaults to dry-run, preserves newest3 and only accepts marked own directories after resolved-path/symlink checks; never touches docs/qa, source, valid media, player saves or Git history. Dry-run keep3/remove0 was exercised; apply deletion was not needed or claimed tested.

## Executed final run

- Run: `20261031T174545Z-942b4125`.
- Source/code manifest: `bd1a7f59f492ea0dfc8bdf3a32580b35182bf31f012886d29fc9d7f4863834c0`.
- Built output: `b06fac4d024f7b425e08574eab6e8ef606a7d063f062448049be72e9db568387`.
- **45/45 tests**, no fail/cancel/skip/todo; Astro check31 files, zero errors/warnings/hints; static build9 pages; all local route/sitemap checks PASS.
- Initial final-run verify returned **UNRUN/exit2** with six missing browser cases, preserved in attempts history. After actual approved-browser observations and cleanup, verify returned **PASS/exit0**, all six stages PASS. [report.json](qa/m0-07/report.json), [verification-attempts.jsonl](qa/m0-07/verification-attempts.jsonl).
- Native actual built canvas and visual inspection at DOM1366x768, portrait360x780 and landscape780x360; EN/ID Settings/Escape, keyboard Open, journal navigation/back, reload canonical and released canvas. Three new screenshots **210,244 bytes**, pixel dimensions/hashes recorded separately from CSS viewport.
- Visible fixture identity matched this run. Core marker pose/event/tick, one subscriber/session/RAF, paused tick6 held across UI actions, resume advanced to tick11, close released resources. Injected native WEBGL_lose_context produced error/canvas0/subscribers0; real Retry created one canvas. This is an injected recovery test, not an unsupported physical-phone observation.
- Actual native-product warn/error capture:0 entries with limit200, not capped. Owned tabs15/16 closed; viewport reset. Final PTY `stop` exited0; serve receipt STOPPED/portsFree true and independent Windows listener count0.

## Investigated failures retained honestly

The first preliminary run failed journal metadata comparison on `/adventures/` because raw HTML `&amp;` had not been decoded before comparison with the browser baseline. The decoder was corrected and its actual failure shape added to tests; product content stayed unchanged. Automatic source fingerprinting was also placed before/after checks.

The next preliminary run reached automatic PASS/browser UNRUN; real browser inspection revealed missing fixture identity nodes because a text-template match had failed. The fixture-only UTF-8 label/insertion was fixed; generated identity guard and regression test added. The old run was then deliberately verified and returned FAIL for changed source/build. Its old screenshots were not reused for final evidence. Selected preliminary reports and UNRUN/FAIL history remain under `qa/m0-07/attempts`; earlier historical feature receipts are unchanged.

One plain-pipe exec session had closed stdin, so the stop text was not executed. Exact workflow-recorded child command lines/parents/loopback PIDs were checked before stopping the known own child; the wrapper cleaned the other child and verified free ports. A new PTY serve against the same unchanged source/build then proved the documented graceful stop. Details: `cleanup-and-execution.json`. No approval denial or unowned process termination.

## Limits and next item

This pass is the current entry/renderer/core foundation workflow. Actual game-loop/animal/economy/mission/save E2E, physical Android/true touch/Safari/iOS, FPS/network/soak and live production remain UNRUN gates. BASE-01/02 persist. Raw lazy chunk >500kB warning remains recorded, not optimized or suppressed. No original route, product source, public asset, dependency/lockfile or immutable PRD source copy changed. M0-01 exact external Cloudflare source/build/automatic-deploy settings remain pending; no login attempted. Next: **M0-08 performance baseline, screen matrix and artifact budgets**.
