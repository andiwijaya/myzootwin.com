# Elephant ground-care vertical slice — EH2-05

Verified after local EH2-04 checkpoint `eff7d1167d5d84fbf562a77af225e3c32bf6b2e1`. This is the same production runtime, independently exercised with five additional causal and worst-state gates. It intentionally uses internal placeholder standing art; no release of this art is authorized or claimed.

The existing authoritative100ms tick drives elephant walk/turn/seek/eat/drink and derived welfare. No extra RAF, wall-time care, random stream, economy, admission or autosave system. The complete two-resident food/water cycle, real stock/need relief and mid-action Continue were implemented as dependencies of real facilities in EH2-04; this checkpoint closes their independent vertical-slice acceptance.

Additional checks prove:

1. Each welfare component uses actual needs, accessible stocked resources and free interior walking cells. Weighted output is exact and read-only; reconciliation preserves macaws. Props causally reduce available space.
2. Empty resources provide no food/water-access welfare. Real refill charges20 ZC across the three facilities and restores access, but does not instantly relieve needs or fabricate consumed counters.
3. An otherwise stored approach too far from its actual facility cannot fake access. Drying the trough removes its actual water contribution.
4. Starting both elephants at100% hunger and100% thirst recovers through real meals and drinks. Every1200 simulated ticks remain bounded by continuous movement speed, body separation and real habitat/prop collision. Both needs return below80%, event counts match actual portions and the final save validates.
5. Leaving all actual care empty until both needs naturally cap remains truthful with zero consumption. Full cold Continue → real refills →1200 ticks recovers both residents, retains Q01–Q04 and charges20service +8two-habitat upkeep, without grant or invented money.

Validation: **597/597 full serial tests PASS** in153.3s, including five new gates. The production `src/` tree is unchanged from EH2-04, whose261-file clean Astro check,9-page build/route check,25 native storage cases and desktop/portrait/landscape actual UI evidence therefore apply to this exact runtime. Those browser tests include a native abort, actual mid-seek cold state and570 further identical ticks, both residents eating/drinking by60 simulated seconds, pause and real UI cold Continue. Their provenance is [care evidence](ELEPHANT_CARE.md), not a new browser run. No physical-device, articulated rig, final balance or15-minute active wall-time soak claim.

[Verification receipt](qa/elephant-welfare/verification.json). Living checklist15/39. Next: EH2-06 actual facility removal/Undo with occupied habitat, stale input, refunds, actor-space and orphan guards. The original V1 checklist remains46/51 and its original tests are unchanged. No push or deployment.
