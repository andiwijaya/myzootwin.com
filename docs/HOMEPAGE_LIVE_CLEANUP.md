# Homepage: live game only

3 November 2026 UTC. User authorized this one homepage change, tests, then direct main publication. Candidate is locally verified; publication status is recorded below after deployment.

The homepage now presents Tropical Creek Sanctuary with a real existing original gameplay screenshot, one primary Play CTA, and accurate build/care/visitor/four-mission/local-save capabilities. Its header/footer link only Home and Play. Journal promotion, category cards and coming-soon promises were removed from the homepage. Privacy choices and the keyboard skip link remain.

Journal URLs/content, canonical/sitemap, assets and the game are preserved. Eight other built HTML files, including /play/, are byte-identical to the deployed camera local build. No game, save schema, economy, language or analytics configuration changed. Homepage remains English; game manual ID/EN preference still works.

## Verification

- Source SHA256: 2b1a0d783ae76d49eb6c381af00b3c06416c1421e379062f50270987c8215522
- Build SHA256: ebcc8ba10534494e2d378d1d166178bfad9df9e49007349d262fc8704ecd47e9
- Isolated output: .qa/builds/h20261103T032041Z; owner dist preserved e06d975a30b49470a1e80e915fbe39ce22ba102f16447dbef8776e7088d38b05.
-17 targeted site/privacy/security tests passed; Astro check zero errors/warnings/hints;9-route static build passed. Captured commands/stdout in .qa/homepage/h20261103T032041Z.
- Nine local HTTP routes and sitemap9 passed; eight unchanged route bodies. Only Three.js runtime third-party modules; no tooling, private archives, maps, secrets or tests shipped.
- Supported IAB Chrome actions: all homepage Home/Play links, keyboard skip, privacy essential-only/Close, actual desktop1366x768, portrait360x780, landscape780x360 screenshots and no horizontal overflow. ID preference restored after back/Play; switching to EN worked. Console warn/error empty (limit200).
- Evidence: [local gates](qa/homepage-live/local-gates.json), [browser](qa/homepage-live/browser-local.json), [desktop](qa/homepage-live/screens/desktop.png), [portrait](qa/homepage-live/screens/portrait.png), [landscape](qa/homepage-live/screens/landscape.png).
- Initial gate rejected Node's default spec reporter, not a product test failure; explicit TAP rerun passed. Original receipt retained.

## Release boundaries

Rollback candidate before this release: remote/main d8c03c6c8d3cc1aeef848470b69d287937a1ab7f, Pages a7dbf297-e15a-4096-ae9b-82b95f684018. Actual rollback not exercised. Local documentation commits dc5d831/f268a25 are preserved and travel with the intended source push. No Actions/manual build or new grants/settings.

V1 remains46/51 (90.20%); no additional checklist criterion is claimed. The five existing partial evidence/signoff gates remain open. Physical Android/Edge, presented FPS, native background/speaker/process restart, recording and unaided study are not passed by this homepage smoke. Operator/contact stay deferred. Denied QA46, recovery-download and live300ZC confirmation were not retried. Existing gameplay evidence is reused explicitly because its complete emitted route is identical.
