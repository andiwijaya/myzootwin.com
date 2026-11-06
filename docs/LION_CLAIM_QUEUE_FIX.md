# Serializing a reward after overlapping autosave drains

During the isolated live V2-to-V3 journey, a single tab occasionally entered the protected conflict state when claiming EH/LQ rewards. The CAS barrier preserved the checkpoint and refused optimistic rewards. Explicit reload recovered the save; individual claims could subsequently succeed. This was investigated rather than reported as successful live completion.

The deterministic regression reproduces the race: an existing ordinary drain and the candidate's drain both await write A. When A completes, the first drain starts a follow-up write B. The candidate's drain sees dirty=false and returns while B is still in flight. Submitting the candidate then uses A's revision and competes with B; the real database correctly rejects that stale revision.

Before the fix the regression observed3 submitted requests while B was pending, against the required2. The candidate now joins any remaining in-flight write after its initial drain. candidateBusy already holds new ordinary drains and timers, so the finite pre-existing follow-ups settle before the candidate reads and uses the current revision. Genuine competing tabs still lose by the unchanged generation/revision CAS rules.

No checkpoint format, database version, backup policy, reward amount, simulation rule or recovery behavior changed. Red/green output and the native receipt are under docs/qa/lion-claim-queue. Focused coverage passes52/52. Actual native IndexedDB coverage passes9/9 in1005.3ms; the new overlap case retains the exact originalV2 backup and commits the grant once without a false conflict. The previous two-writer winner/loser, quota, corruption, future-format and reset/Undo gates still pass. All6 disposable databases were cleaned.

The full regression and final frozen-candidate session are separate required release checks; their final results are recorded in the live-release handoff. The native receipt is an internal-browser software check, not a physical-device claim.
