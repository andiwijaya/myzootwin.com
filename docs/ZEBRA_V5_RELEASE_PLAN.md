# Zebra V5 maintenance and fix-forward plan

This is a local preparation record. Zebra has not been pushed or deployed. The normal public game entry still selects the historical V4 backend; source-causal V5 gameplay has been exercised through isolated QA. Passing the gates below does not activate V5 for existing visitors.

## Exact prepared artifacts

Tested implementation: `604f429792accf4c5b93c28aedd17dd8eab0e6ed`; input fingerprint `c600030f42a87e612a97b97389acb3346860b7c487d7dccbd34a56191ce71685`. Build receipt: `.qa/zebra-audit/r7-07/r7-07-maint1/source.json`; its portable archived copy is in [R7-07 evidence](qa/zebra/r7-07/verification.json). The receipt contains every input and output hash, not just a Git label.

The normal ten-route product has 37 files and build fingerprint `6a573dcba1597d740a89c2b7f68b0c9d91a9c3b7edbce8d99c5ca242bd326849`. It contains no QA harness or maintenance entry. The separate 38-file maintenance site has fingerprint `dba4a900e523d99d521dbee451276e3705317c29ec4c1e3c4292f3b16321d864`. It preserves all normal non-play routes/assets and replaces only `/play/index.html`, adding one maintenance script. Fingerprints include repository-relative paths; moving an artifact requires checking each normalized path/content hash, not expecting the aggregate path-sensitive ID to remain equal.

Maintenance HTML SHA-256: `72dc00ea827f9b49cdf31d9b2da6bac1a06656381677383c35b615a28f7d93bb`. Script `/_zebra-maintenance-assets/zebra-BHjMyjFF.js` SHA-256: `01a1e8155d8180de5f9fa3a9a6e61048add353deb8a0271d91a766da6bbb816d` (104,665 bytes). The actual script graph excludes the game entry, simulation, renderer, Three.js and V5 writer backend. Build-time writer-pattern checks complement actual readonly-transaction tests; pattern scanning alone is not a proof of arbitrary code behavior.

Any later Z2-06/runtime change makes this snapshot historical rather than the final release artifact. Rebuild both outputs and repeat source-bound acceptance for the new lineage. The builder deliberately checks the existing product source against the accepted causal producer; update that reference only with a newly reviewed causal fixture/source receipt, never by bypassing its guard or relabelling this old build.

Final full regression is1,046/1,046 at `9099ffe5bd66c0d6a8e8d82d067054fc299f5f27`, input `9a5c167408808f7291327a8b08aeed9b9c02a2de607ed3506e4f7d4b9f24f78f`. Only the reviewed inventory test/fixture differs from604f429; archived input parity proves all runtime/public/package/configuration/scripts bytes remain exact. Native/build receipts retain their original implementation identity. The first full run's stale provenance/notice expectation and its tightly scoped correction are preserved in the evidence rather than suppressed.

## Recovery rules

1. Never deploy the old V4 binary as a rollback after a browser may have written V5. Never lower the database version, clear browser storage, automatically restore the V4 backup, or overwrite the current primary with historical data.
2. If a released V5 defect requires containment, publish the exact verified V5-compatible maintenance artifact only after release/incident authorization and a fresh source/output-manifest check. This step is a future operational procedure, not an executed deployment. Use a new deployment and record its exact source/build/deployment identifiers; do not invoke a historical V4 deployment restore. Verify the actual public `/play/` HTML and hashed maintenance script before claiming containment; stale CDN/browser responses are not a successful maintenance rollout.
3. The maintenance entry opens the same database without requesting a version. It aborts creation of an absent database and reads only readonly transactions. V1–V4 are interpreted in memory; no migration, grant, preference persistence, CAS writer, lease, reset, simulation tick or recovery write starts. Strict V5 requires its original V4 backup. Corrupt/future primary, missing history/backup and future database version fail closed while preserving rows.
4. A new page cannot stop an already-open V5 game tab. Do not claim global suspension of those tabs. Ask affected users to close/reload their game through normal product communication when incident scope warrants it; never terminate owner browser processes or edit their IndexedDB. The maintenance page's pause statement describes that page, not every tab.
5. Fix forward from the exact tested V5 lineage. Reproduce the fault with an isolated copy/fixture; preserve current primary, previous/history, original V4 backup, generation, CAS revision and once-only ledger proofs. Add a causal regression for the actual failure, run strict codec/CAS/old-client/recovery coverage, complete the full suite/build and repeat native isolated cold-save verification before replacing maintenance. A changed save contract needs its own compatible migration and validation.
6. Unreadable storage stays preserved and gets an explicit retry message. Local diagnostics show schema/count/status only, contain no resident names and are not uploaded. No automatic export, deletion or fallback restoration is part of this procedure.

## Production identity and authorization

Read-only checks on 10 November 2026 found remote `main` at `634de84ebfeab6c069ca9463527193a4e99ea458`. The GitHub **Cloudflare Pages** check for that SHA is completed/success and points to deployment `de1f5a36-23ab-4b6a-bd13-14a3d822b2a3`, project `myzootwin-com`. HTTPS responses from `https://myzootwin.com/` and `/en/` are 200 with four-habitat titles; robots and sitemap index are also 200. These are timestamped HTTP/GitHub-check observations, not a fresh Cloudflare account/domain-binding API audit or a Zebra live acceptance. Full responses and identifiers are archived. A GitHub combined-status response with zero statuses is not treated as a failed Pages check.

Before any future authorized publish, recheck remote main/ancestry, working-tree scope, pipeline/project/domain, final source fingerprint and complete output manifest. Preserve unrelated work. Use only a reviewed fast-forward path; do not force-push, merge silently over unexpected remote changes, or assume an earlier homepage deployment permission covers Zebra V5. Verify the actual resulting Pages deployment and live route/asset metadata with isolated saves, recording exact hashes and limitations.

## Candidate gates still open

- **Z2-06:** actual once-only proposed 1,700 ZC grant, GQ04 proof through compaction/cold recovery, viable essential setup with at least 150 ZC reserve, and explicit public V5 adoption. Current synthetic already-claimed fixture prerequisites do not satisfy this gate.
- **HP6-02:** five genuinely playable habitats and accurate ID/EN live claims. Preview-labelled Zebra media is not proof of public playability. Do not publish a five-playable claim before the game release supports it.
- **R7-08:** separate explicit Zebra push/deploy authorization, then controlled publication and live acceptance. It is currently held.

The native internal-browser profile/gesture and active soak/stress evidence retains its recorded scope. Presented FPS, physical-device performance and unsupported browser engines remain unmeasured. Callback cadence, render submission time and estimated heap are not substituted for those measurements. This plan and its maintenance tests do not turn those limits into passes or claim 54/54 completion.
