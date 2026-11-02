# M6-06 — four package notice review

2 November 2026 UTC. **One qualified source notice added; three full-text gaps remain.** Direct findings accounted: **9/12**, comprising three prior `LICENCE` scanner false positives and six source/parent supplements. Whole M6-06 remains **PARTIAL**, V1 **44/51 (86.27%)**. Notice checkpoint **`187c74d2c704e570d5a4400263a35892b12b2da5`**, local only; no release/legal clearance.

[Package outcomes](qa/m6-06-notice-four/package-outcomes.json) · [acceptance](qa/m6-06-notice-four/acceptance-matrix.json) · [current risks](qa/m6-06-notice-four/risk-register.json) · [priorities](qa/m6-06-notice-four/next-gates-plan.json).

## Exact identity and bounded sources

| Locked package | Registry publisher metadata | Official upstream | Full notice outcome |
| --- | --- | --- | --- |
| [am-i-vibing@0.5.0](https://registry.npmjs.org/am-i-vibing/0.5.0) | GitHub Actions; recorded maintainer ascorbic | [ascorbic/am-i-vibing](https://github.com/ascorbic/am-i-vibing) | **Unresolved**, declared MIT only |
| [boolbase@1.0.0](https://registry.npmjs.org/boolbase/1.0.0) | feedic | [fb55/boolbase](https://github.com/fb55/boolbase) | **Qualified matching-version ISC source notice supplied** |
| [piccolore@0.1.3](https://registry.npmjs.org/piccolore/0.1.3) | GitHub Actions; recorded maintainer delucis | [delucis/piccolore](https://github.com/delucis/piccolore) | **Unresolved**, declared ISC only |
| [process-ancestry@0.1.0](https://registry.npmjs.org/process-ancestry/0.1.0) | ascorbic | [ascorbic/process-ancestry](https://github.com/ascorbic/process-ancestry) | **Unresolved**, declared MIT only |

Each exact registry name/version, tarball URL and integrity matches `package-lock.json`. SHA1 and lock SRI were verified; every regular tarball member byte-matches its installed file, rechecked after build. Publisher names are public registry assertions, not independently verified legal identity/signatures; publisher emails were omitted. Four archives total20,318bytes retained audit-local outside the repo; none was extracted as an installation or invoked. Standalone bin/debug/install entry points of the four audited packages were not invoked. Dependency versions and access were unchanged; no agreements were accepted. A normal existing Astro build was used only for distribution regression.

The declared bound was one exact metadata/tarball pair per package, one current upstream license endpoint, and one bounded history/source bridge only if a candidate full text existed. All four tarballs lack a standalone full notice and full permission-clause token matches (including whitespace/comment-normalized scans). Prior exact-tag/tree observations were reused rather than re-querying exhausted refs. Three current public license endpoints returned404; searches stopped without filename guessing or SPDX-to-text synthesis. This establishes a text-evidence gap at inspected sources, **not proof of infringement or absence of any license grant**.

## boolbase source bridge and qualification

The official repository LICENSE history contains observed commit **`be0bcd8a4e917a0a5895e95b523fbbed05a64871`**. Its [package.json](https://github.com/fb55/boolbase/blob/be0bcd8a4e917a0a5895e95b523fbbed05a64871/package.json) explicitly declares `boolbase`, version1.0.0 and ISC. Its sole runtime source [index.js](https://github.com/fb55/boolbase/blob/be0bcd8a4e917a0a5895e95b523fbbed05a64871/index.js),125bytes, has SHA256 `c62510fca8738c7444cdf5012bdd0ce214a1b6f7eaff7facb3a919e4656d7341`, exactly matching the locked archive and installed code.

The [full ISC notice at that commit](https://github.com/fb55/boolbase/blob/be0bcd8a4e917a0a5895e95b523fbbed05a64871/LICENSE) is copied byte-for-byte to [boolbase-1.0.0-LICENSE.txt](licenses/build-tooling/boolbase-1.0.0-LICENSE.txt): **751bytes**, SHA256 **`cdf4d87ae0a6c160227263bf4e39a0a10e30e89ae7256e0f7ac7bde0836552c6`**. Copyright and permission text are preserved exactly. [History](qa/m6-06-notice-four/boolbase-license-history.json), [source bridge](qa/m6-06-notice-four/boolbase-source-bridge.json).

This is an **explicit matching-version/project-code supplement**, not a claim that npm's original archive contained a license file. Source and archive package metadata differ in the `scripts` field; name/version/license agree and all runtime code is identical. No claim that every archive file matches the source tree, no current-v2 substitution, no invented copyright/terms or blanket retroactive grant/ownership inference. The source file provides the notice itself; overall legal/native/transitive clearance remains withheld.

## Distribution and notice placement

Declared installed paths: root→Astro→am-i-vibing; root→Astro→piccolore; root→Astro→am-i-vibing→process-ancestry; root→Astro→svgo→css-select→boolbase. These belong to the Astro build dependency graph. `dev:false` in a lockfile does not identify shipped browser code. [Dependency edges](qa/m6-06-notice-four/dependency-paths.json).

Fresh emitted client module evidence identifies **Three.js only** among dependency modules; none of these four packages is emitted. All24static artifacts remain byte-identical, with existing public full Three MIT notices unchanged. Therefore the boolbase supplement is placed in **`docs/licenses/build-tooling/` plus its manifest**, rather than represented as a bundled browser library in public notices. That path is a project organization choice; the license does not prescribe our filename. Any later distribution containing package code must carry its applicable copyright/permission notices. The three unavailable full texts remain a broader tooling/source evidence gap; current static-browser scope must not be confused with whole-source/native redistribution clearance.

The installed tree was not patched: **nine physical standalone-file absences remain**, six covered by separately sourced supplements and three still unresolved. Living [manifest](licenses/build-tooling/manifest.json) distinguishes these counts; earlier12-finding/8-accounted raw reports remain immutable. All10exact text files (nine direct plus Rolldown's vendor external-project notice) revalidated; prior notice bytes unchanged.

## Verification, preservation and remaining gates

Fresh isolated build **`n20261102T181134Z`**, source **`45145f5fac6380f8a011ad78a3576613f42e388ca76bf5b2f4009287ff113e6e`**, build **`c6ddd901b67d5484d1a0cdfae72bab3c425b09e99330e3d4b6d28068f5fbf3fa`**: build/nine static routes/canonical/sitemap PASS;24artifact SHA comparisons exact; emitted module-map third party onlyThree. Existing lazy-chunk warning remains unsuppressed. **485unit tests and205file zero-diagnostic check results were reused from exact source `45145f5fac6380f8a011ad78a3576613f42e388ca76bf5b2f4009287ff113e6e` / `s20261102T174805Z`, not rerun or relabelled as new tests.** No application/test/script/public/package graph changes occurred. [Fresh build/reuse proof](qa/m6-06-notice-four/final-build.json), [notice audit](qa/m6-06-notice-four/notice-audit-final.json).

Original ownerdist, source/media/saves, root package/lock and three rollback archives unchanged; audited installed files remain exact. No QA browser/server started; build child exited and named ports are free. Original failures remain. No artwork redesign, push/deploy/Actions/login/credentials/permissions, upstream messages, new license agreement or deniedQA46/baseline/download retry.

Priority after parent review:

1. **Independently implementable after dispatch:** choose the previously proposed original repo-native hero/favicon replacement plan, preserving original assets/history/URLs and validating SEO, if provenance cannot be established. No artwork was changed here. QA-only diagnostics for future loader failures are another bounded local option; they cannot recover the lost historical trace.
2. **Owner/publisher/legal facts:** obtain version-applicable authoritative full texts/permission confirmation for the three unresolved packages if broader source/tooling redistribution needs clearance, or a documented distribution-scope decision. Owner may supply evidence or explicitly authorize contact; no messages sent. Responsible entity/contact, analytics/retention/hosting and legacy-art provenance also remain external facts.
3. **Available hardware/human/runtime:** physical Android/touch/distinct browsers, native background/speaker/process restart, unaided human testing and supported recording. GPU and old import causes remain inconclusive; no green rerun substitutes.
4. **External config/release:** verify Cloudflare repo/build/root/autodeploy/builderNode through existing authorized reads; remote compatibility still unknown. M6-08 requires separate dispatch after gates close or explicit acceptance handling; no deployment here.

Three searches are **UNRESOLVED due absent full-text evidence at the exact inspected sources**, not new authorization denials. Exact targets/actions/results are in [blockers](qa/m6-06-notice-four/blockers.json). No new pending/denied action or uncertain mutation. Whole M6-06 remains partial and **44/51 unchanged**. Stop for parent review.
