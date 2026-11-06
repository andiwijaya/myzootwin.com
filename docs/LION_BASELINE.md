# Lion baseline and isolation

6 November 2026. Local-only branch `lion-savanna` in the task workspace is an independent clone of clean Elephant checkout `377ec7d`. Original `C:/MyZooTwin` remains at `63ce52a`; original Elephant checkout remains untouched. No push or deployment is authorized.

Fresh GitHub main is `2aa836300304477f6e381413b4a39047c28bacf3`. Local `377ec7d` only adds release evidence after that runtime. `ELEPHANT_LIVE_RELEASE.md` records owner approval, successful Cloudflare deployment `2c7e695d-620f-49e7-acee-68f73ad281c8`, 719 tests and scoped live smoke. EH is 39/39; inherited V1 remains 46/51. A new public HTTP hash audit returned 403 for all 24 requests. Browser audit initialization/navigation timed out. **Current production verification is BLOCKED, not passed. LH0-01 remains partial.** No attempt was made to change hosting or bypass access controls.

The three original Library files were read completely, `has_more=false`. Windows helper materialization fails on unavailable `os.setxattr`; a bounded retry failed identically. Parent explicitly authorized direct use of the complete readable Library content. The Lion PRD and progress documents are engineering transcriptions, not verified materialized originals. Their source IDs are in the task intake receipt.

QA owns only task-local `.qa` outputs, fixture files and newly created isolated browser profiles/databases. Never read, reset, import or seed the owner's primary game database. Baseline V1 source is the existing nine-entry `tests/fixtures/elephant-legacy-v1.json`. V2 golden is generated before product changes by `scripts/qa/freeze-lion-baseline.mjs --write` using actual baseline commands, ticks and four sequential EH claims, with hash and provenance. Original fixture bytes remain unchanged. Baseline cold-load, pause and full projection tests must pass before a gate is checked.

Publication remains held. Production HTTP 403 and browser transport timeouts are external verification limitations; independent local engineering may continue.
