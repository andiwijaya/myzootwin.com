# R7-03 fault / recovery review

**R7-03 storage fault/recovery accepted;47/54.** Source `cb9f09dcfbf8cf9fb436b8bc3770650ee2e92d97`; autosave fix `59af0f7d68d82a34a89429e1a9273aa7027d57ae`. Historical preparation and its125-title inventory remain unchanged in `design.md` and `preparation.json`.

## Autosave close defect and correction

A pending V5 candidate can be followed by a final preference checkpoint while disposal starts. An additional public/session flush could start another write as disposal decided it had finished, allowing the backend to close before that write settled. The native discovery retained the committed150ZC reward but reported unavailable/dirty and lost the latest preference. The existing125-case source pack passed before this new interleaving was exercised.

The fix gives disposal one shared final-drain promise. Late flushes join that promise; a drain that was already waiting does not start another write after closing begins. It changes autosave lifecycle only. No save schema, migration rule, price, grant, mission, actor, world, canonical clock, renderer, artwork or dependency was changed.

The new regression uses the actual V5 backend with IndexedDB emulation, a held real commit, a candidate command and a final preference checkpoint. On the extracted original source the older regression passes and the new case fails. After the fix both pass: two writes settle, backend closes once, primary keeps the candidate and latest preference, and the exact original V4 envelope survives. The native version uses an actually earned ZQ02 cash candidate and confirms saved/clean disposal with no inflight write. Its backend-promise hold is explicit injection, not physical disk latency or a held native transaction.

## Native coverage

All final controls operate on fresh `myzootwin-zebra-fault-<UUID>` databases on an owned loopback origin. Existing names are checked at their current version and must contain the exact QA lineage marker. Namespace/absent-UUID refusal never opens an owner/default/carried save. The probe does not enumerate databases, fill disk, clear profiles, delete stores or run the renderer.

- Strict native parsing rejects malformed, oversized, future, unknown and financially inconsistent payloads. All12 frozen V1–V4 states migrate with exact validated V4 projections and unchanged money/no new Zebra grant. Actual native database migration is representative V4→V5; all historical stored permutations are covered separately by source tests.
- Synthetic quota errors and actual `transaction.abort()` are tested before the first V5 write and after migration. Known checkpoint rows remain exact; explicit retry commits once. The first winning V5 transaction retains the original V4 envelope atomically and never rewrites existing historical backups.
- Corrupt primary/valid previous is restored only after review. Future schema, unsupported envelope, unknown content and malformed primary without a previous checkpoint stay blocked. Missing/corrupt V4 and V3 backups block read, recovery, reset and a writer that had already observed the valid generation; no backup is reconstructed from V5.
- A competing recovery invalidates a stale quote. Reset reaches revision1 with a new generation, so an old generation cannot write even with the matching numeric revision. Undo restores the exact V5 payload once and retains the original V4 archive.
- A real held native V4 connection blocks upgrade until closed. After version5 is present, the actual V4 backend cannot reopen it. The source tests additionally cover an active old backend's versionchange handling.
- Two independent internal-browser tabs prepare the same real ZQ02 candidate. The shared arm barrier delivers competing commits through the actual autosave/backend. Exactly one wins: cash3595→3745 and one `mission-zq02` receipt. The loser stays at3595 with exact preclaim memory and conflict status; stored data agrees in both tabs. Legacy mission/grant objects and the labelled Zebra grant prerequisite remain unchanged.
- After both owners close, a new page opens the same UUID and reads the exact committed state. Original admission rechecks do not add income. Additional compaction/rechecks operate on a clone, so this native case does not claim a persisted compaction write. Source economy/mission cases cover durable compaction and cold receipt history.

The source-command fixture earns readiness through787 actual100ms ticks, source welcome/care/refill/path/ZQ01 commands and a new paid visitor `arrival-39`. All four actual meals/drinks and the continuous welfare window precede ZQ02. The initial grant/home prerequisite is explicitly synthetic validation setup. This proves storage/replay protection for existing strict grant proofs; it does not prove a new Zebra grant command, proposed1700ZC budget, public V5 bootstrap or Z2-06 acceptance.

## Original recovery controller integration

The current production `mountRecoveryPanel` and autosave run in a generic QA component host with native dialog controls. This is controller/storage integration evidence; full `/play` rendering and production styling are not rerun here.

The English review/cancel leaves raw damaged primary, previous and backups unchanged. A one-shot, database-scoped quota hook causes the actual Confirm transition to fail atomically; the production panel reports recovery failure. Indonesian review and keyboard Confirm then succeed after the hook is restored. The validated previous payload is exact, the corrupt original is preserved, all four backup hashes stay identical and the session returns available without advancing time. Native Tab/Enter exercised the dialog. Both locale screenshots are actual browser pixels. No export/download or user storage was used.

## Discovery and verification boundaries

Initial rejected observations remain in the discovery archive. One QA assertion compared database version4 against the expected version5 upgrade caused by `read()`; its fixed baseline is captured after read. Another attempted a write without first observing the valid generation, so CAS conflict correctly preceded the backup-validation fault; the revised case observes the valid generation before damaging its own backup. Neither observation was promoted to a production atomicity defect. The actual late-flush/disposal defect was independently reproduced and fixed.

Three unused QA declarations produced Astro hints and were removed. A newly started full-suite run was stopped through its verified child PID; its runner retained incomplete TAP/result and its recorded workers were confirmed gone. That partial run is not counted as a pass. The clean source has strict types exit0 and Astro610 files with0errors/0warnings/0hints. The complete clean-source rerun passes all1030 tests across162 files, with0fail/skip/cancel/todo and unchanged inputs.

The immutable production build excludes every fault QA marker and contains36 files. Compared with accepted R7-01,33 are byte-exact. The PlayEntry bundle and its play-page reference change for the autosave fix. The foundation chunk changes only its companion PlayEntry hashed import path; after that path alone is normalized, its bytes match exactly. Actual build output is never rewritten. Images, CSS, homepage/static routes, robots/sitemap and dependencies remain unchanged.

All final native window/console error collections are empty. Successful active owners and pending callbacks/timers return0; the winning save ends saved/clean, the losing owner remains explicitly conflicted until disposed, and the restored inactive save is available/clean. All own browser tabs and three sequential loopback servers are closed; no viewport override was used. The complete source suite finished normally; its runner, test child and owned workers are closed.

No physical-device, storage-pressure, presented-FPS, background, benchmark or15-minute soak result is claimed. R7-04/05, Z2-06 and HP6-02 playability, V5-safe maintenance/fix-forward and separate R7-08 authorization remain open. **No push/deploy.**
