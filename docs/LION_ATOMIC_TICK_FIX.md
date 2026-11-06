# Complete shared ticks at every observer boundary

A long internal-browser run captured an invalid intermediate snapshot at `$.visitors.arrival.position`. The completed frame and last stored checkpoint remained valid; explicit Retry recovered the earlier write error. Instrumented QA preserved the first invalid snapshot instead of accepting it as a successful soak.

The regression reproduces the same path on `animal-fed`, tick2723: the canonical clock had incremented, but visitor arrival positions were still from the preceding tick. The old implementation published feeding/drinking and maintenance changes before visitor movement; maintenance could also attempt compaction at that intermediate point.

The simulation now finishes animal care, visitor movement/admission, mission evidence and financial retirement/compaction before publishing any tick-domain notification. Rules, prices, fixed-clock duration, RNG and purchase/reward receipts are unchanged. Listeners and eager checkpoints receive one coherent world. Maintenance debit still happens at its original point; its notification and checkpoint happen after the shared tick is complete.

The new regression validates the entire save inside every domain callback, then validates the completed tick. It failed before the fix and passed after it. The combined atomic-event, genuine-care and four-mission journey set passed6/6. Exact red/green output: [before](qa/lion/atomic-events-before.txt), [after](qa/lion/atomic-events-after.txt). Full regression and a new built-source soak are required after this core fix.

The earlier approximately1FPS native Chrome result is distinct: on resume the native window was observed minimized, while the internal browser measured approximately60FPS before Lion construction. We cannot establish the cause of all old Chrome samples under the later internal-browser-only restriction. The new local route context removes repeated geometric work;360 route comparisons retain exact outputs and tie ordering. This is an optimization, not a change in collision clearance.
