# M5-06 settings — recovered visual checkpoint

Status: PARTIAL, checkbox remains unchecked; V1 remains 39/51 (76.47%).

The recovered visual slice adds Auto/Low/High graphics, decorative reduced motion, bilingual Apply/Cancel, versioned device preference and game-state handoff. Low mode reduces resolution, shade/glints and vegetation lighting and displays one visitor model while all authoritative entities still simulate. Repeated quality changes reuse existing materials. Language remains immediate; visual drafts apply explicitly. Help remains functional. Audio/mute is not implemented at this checkpoint.

Evidence: [recovery receipt](qa/m5-06/recovered-visual-slice/recovery-checkpoint.json), including 447 unit tests, 174-file typecheck without diagnostics, build/nine-route pass and 27 targeted browser cases across desktop/portrait/landscape. The general six-case browser gate is UNRUN. Native Cancel and Apply verified; last ID/close/reload was interrupted and is uncertain. Failed original receipts are retained. This is not final M5-06 acceptance, physical Android, native background or FPS proof.

The laptop disconnected around 00:25 UTC before final evidence packaging/commit. On explicit resume the exact source/build hashes still matched the tested candidate and prior ports4321/4322/4344 were free. An owner preview now runs at http://127.0.0.1:4345/play/ from existing dist, source d64bdf3085df59aa372c42c61bdc63ab854d74606904a3bbf4ad5659ff676dc9, build e06d975a30b49470a1e80e915fbe39ce22ba102f16447dbef8776e7088d38b05. Its legacy saves on other origins were not changed. Do not modify dist or stop/reload/reset the owner preview while developing; next build/QA must use an isolated output directory and separate tab/origin.

Next: finish original procedural ambient audio and gesture-activated mute/persistence/lifecycle, then final-source targeted settings/storage/render verification. M0-01 and M4-07 stay partial. Recovery download remains BLOCKED/UNRUN, no retry. No push/deploy/Actions/login/access changes.
