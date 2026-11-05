# EH0-03 — original elephant art and behavior contract

5 November 2026. **Reference/provenance plan verified; final elephant art is not implemented.** Prior baseline commit `7246bc6993f20f0606c3e6b8c0e63a099227eab6`.

## Reference facts versus game design

Read the three official Smithsonian sources on 5 November. Asian elephant trunks have one finger-like tip and serve feeding, drinking and touch; females generally lack prominent tusks. Female social groups and tactile greetings support the two-companion design. [Asian elephant fact sheet](https://nationalzoo.si.edu/animals/asian-elephant).

Shade, varied ground, foraging enrichment, pools and room to move motivate the habitat's functional zones. [Elephant Trails](https://nationalzoo.si.edu/animals/exhibits/elephant-trails).

The webcam's explanatory text describes splashing, trunk greetings, feeding, dust baths and ear motion; a credited photo caption documents trunk spraying. This was a text reference review, **not a live video observation or a reproduction license**. [Elephant Cam](https://nationalzoo.si.edu/webcams/elephants).

Ayu and Nara are fictional female **Elephas maximus**. Their names, personalities, 6×6 gameplay footprint, 100ms FSM timings and welfare weights are game design, not biological measurements or zoo accreditation advice. Do not label all Asian elephants Sumatran. No riding, coercive shows or abandonment rewards.

## Original visual plan

Build small original procedural Three.js geometry in the existing renderer: a broad barrel torso, four near-vertical articulated legs with broad feet, two head domes, modest ears, small eyes, flexible segmented trunk ending in one projection and a thin tail. No prominent male tusks. Ayu is slightly warmer gray and larger; Nara slightly cooler gray and smaller. Distinguish by silhouette/color without costumes. Body proportions must read at front, rear, side and three-quarter views, including the phone canvas.

Rigid hierarchies with shared geometry/material pools: body breathing, grounded alternating gait, smooth heading, ears, trunk reach/curl/sip/spray, companion touch and log rub. Renderer reads authoritative motion and need state; no independent simulation timer, random animation reward or fake bathing. Draw water toward mouth rather than portraying the trunk as a drinking straw. Pond spray requires reached wet pond + genuine bath state; dry/removed resources abort. Shared particle pool is bounded and suppressible under reduced motion without changing simulation.

## Budgets and ownership

- Preferred fully code-authored mesh, no new dependency, textures, remote runtime downloads, GLTF or audio required. Incremental compressed elephant art/audio hard review target **2 MB**, measured at EH3/EH6 rather than claimed here.
- Initial geometry budget **6,000 triangles per elephant**, at most 2 residents. Shared materials, bounded splash pool ≤24 visible droplets, one existing RAF/fixed tick, geometries/materials disposed exactly once by scene ownership. Optimize only on measured evidence.
- No Smithsonian photos/video/logo/model copied, downloaded into the repo or redistributed. Reference links convey facts only; no license inferred. New procedural source/mesh is original work within this repo's existing ownership policy, not a third-party asset license claim.
- Existing macaw/site media and notice/provenance records remain unchanged. Future external media requires an explicit source/version/license record before inclusion; none selected.

## Measurable gates carried to implementation

With essentials placed, an elephant must visibly seek/use a real resource within **15–30 active seconds**, then produce matching resource/need deltas. Both residents must reach food and water; neither may monopolize a station. Bath/spray, log and social actions require saved state/events with cooldown and reachable contact; every action needs an interrupt path. Low/high graphics must produce identical save/simulation outcomes. EH3 requires four-angle actual 3D review and disposal evidence; this plan does not close those items.

Verification: only documentation added for this item; no external asset/import or dependency change. Existing baseline 494 tests + 68 focused tests/build/check remain applicable because product modules are unchanged. Browser art review is **UNRUN until EH3-01**, not passed by this plan.

Implementation update: EH3-01 is now verified with original articulated assets; [rig evidence](ELEPHANT_RIG.md). The plan above records the earlier design checkpoint. Ground/action/bath/social animation and final release/performance gates remain separate.
