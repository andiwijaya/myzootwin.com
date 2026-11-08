# Internal visual QA

This entry imports the actual `mountFoundationScene`, strict V4 codec, and durable backend. It does not fork the models, gameplay engine or fixed clock. It starts paused before any RAF callback advances the game. Current H1-01 scope is entry, isolation, overview, close and cold identity. Viewer/registry/timeline/resource acceptance are separate checklist gates.

Build an immutable run with `node scripts/qa/visual3d/build.mjs h1-01-new-name`. Output is under `.qa/visual3d/<run-id>/lab`; the companion `product` build is scanned for leaked QA entries and strings. The build records the exact source SHA, full source fingerprint, original fixture hash, and every output hash. A large single QA bundle is expected because it includes the production game renderer; it is never a public route or product dependency.

Serve that lab directory using `node scripts/qa/zebra/serve.mjs .qa/visual3d/<run-id>/lab`. Read its dynamically allocated loopback origin; open `/scripts/qa/visual3d/index.html` only in the internal browser. Keep the server's own session and stop it by typing `stop`. Do not terminate other processes or reuse the owner's browser/profile/database. Restore temporary viewport settings and close task-owned QA tabs when finished.

The page creates only `myzootwin-visual3d-<UUID>` on its disposable loopback origin and rejects any other database name. Original V3 provenance is seeded, then real V4 migration/CAS preserves it before the earned V4 fixture is stored. Reload preserves that database identity. No primary save is imported, exported, reset or deleted. Never copy real player saves into fixtures or public output.

Use the visible controls for all mutations. Browser evaluation is read-only diagnostics. Receipts distinguish object-key-independent exact state hashes, owned resources, internal Three counters and presented FPS. A nonzero internal counter is an investigation input, not proof of a leak or of successful cleanup. Native browser viewport overrides are not physical-device measurements.
