> **Final R7-02 acceptance:** [final review](final-preview/review.md) and [verification](final-preview/verification.json),46/54. Historical pending lists below are superseded; raw/rejected observations and limits remain retained.

# R7-02 preparation: native five-species visual matrix

Current status: **PARTIAL NATIVE REVIEW / NOT ACCEPTED**, progress **45/54**. [Current continuation review](continuation-review.md), [verification](verification.json) and [checkpoint](checkpoint.json) supersede the older pending lists below. Current QA source96289e2; probe gatingc9ebd11; all36 product files remain identical to R7-01.619 raw observations/135 selected captures, not a blanket inventory pass. Native legacy previews and final per-family attribution remain open. Own browser/server resources closed by09:21UTC; no tests/builds active. Stop10:00UTC/17:00WIB; no Zebra push/deploy authorization.

[Preparation audit](preparation.json) records exact source excerpts and hashes, [matrix](matrix.json) defines the planned observations, and [checkpoint](checkpoint.json) carries the isolated QA identities without opening them. R7-01 remains accepted at its white-box scope; its full pass is not a fresh browser or visual acceptance.

## Historical preparation findings (before the bridges)

A read-only AST registry scan took 1.30 seconds: 205 runtime modules, 56 render modules, 514 registry records, 287 constructor sites. Zebra has 59 records/30 constructors/6 modules. Every record still says `NOT_RUN`. The complete raw preparation registry is retained under `.qa/zebra-audit/r7-02/preparation-registry.json`, with its hash in the audit; these are inventory counts, not rendered asset counts.

The existing Asset Lab is V4-only. The product harness can render V5, but normally opens an existing construction QA UUID. Reusing either path unchanged would omit Zebra from the universal lab or risk modifying a carried QA checkpoint. **The next slot is ready for QA integration and preflight; native matrix acceptance is not ready yet.**

| Gap | Current source | Required QA change |
| --- | --- | --- |
| Fixture schema | `fixture.ts` validates/loads V4 | Explicit strict V4/V5 case dispatch; fresh isolated UUIDs and correct provenance. Keep V4 behavior/output exact. |
| Report identity | `lab.ts` validates V4 and hard-codes four habitats/ten actors | Match the case codec, schema, counts and actual case-file hash. |
| Full Zoo overlay | `world-fixture.ts` rejects V5 and reports unbuilt Zebra land | Describe actual V5 footprint, residents, facilities, ports and original path access. |
| Spatial queries | `spatial-state.ts` rejects V5 | Add the original Zebra ground/body/head/prop rules. Preserve all old queries and map/origin contracts. |
| Phase fixtures | `phase-fixtures.mjs` produces 15 V4 phases | Separate, bounded causal V5 producer/cache and strict file/schema/generation metadata. |
| Selectors | Lab/UI/lifecycle list four species; focus falls through to Giraffe | Explicit Zebra habitat/family/species mapping; truthful dynamic labels. |
| Product cases | `zebra-product-fixture.ts` normally requires an existing QA DB | Immutable cases load into fresh UUIDs; main830/secondary87 remain untouched. |
| Registry availability | Default fixture metadata advertises earned V4 | V5 fixtures stay planned until produced and validated. Constructor coverage never grants visual PASS. |
| Build identity | `build.mjs` routes legacy matrix or Zebra construction and defines a V4 fixture hash | Compile matching V4/V5 cases/entries, source fingerprints and per-case hashes; retain production QA exclusion. |

The audit links each finding to the current exact file/line. These are QA integration gaps, not nine new PRD micro-features or newly observed production visual defects. No production behavior, artwork, renderer, codec or save schema needs changing merely to adapt the lab.

## Original work order (current completion is in verification.json)

1. Implement the QA-only bridges above. Keep `mountFoundationScene`, production models, strict codecs/backend, viewer, canonical clock and original controls. Do not create a second engine/viewer with substitute art. Disable V4-only storage probes on populated V5 cases rather than passing V5 into their V4 contracts; fault/recovery acceptance belongs to R7-03.
2. Verify old V4 fixture/overlay outputs exactly and add meaningful V5 positive/negative cases: wrong UUID/schema/lineage/file hash, malformed state, original backup identity, correct five habitats/14 actors and original point/body/path rules. Run focused fixture/spatial/registry/isolation/phase/observer checks and strict types/Astro before browser work. No full regression rerun is needed solely for unchanged production code; any production fix requires appropriate regressions and a new source binding.
3. Produce immutable V5 snapshots using actual prepare/adopt/welcome/path/refill/mission/advance commands. `preparedZebraCare` uses a labelled validation-only synthetic grant/home prerequisite; do not misrepresent that setup as grant/budget/public-adoption proof. Pay for the real connection path using `zebraAccessView` plus `buildPath`, as the accepted clock/visitor tests do. The baseline helper alone does not connect Zebra. A bounded current-source search must confirm each actual phase; refuse a missing phase instead of posing actors or reusing a historical tick blindly. Do this serially in an owned below-normal process, only during Zebra's slot.
4. Retain exact original V4 provenance/backups through actual QA backend adoption. Assign a fresh UUID/generation for every case lineage; never target owner/default databases. Leave the carried main/secondary QA checkpoints unopened. Freeze each case and compare exact state/gameplay hashes before/after inspection.
5. Build a fresh immutable combined matrix. Proposed run ID: `h1-09-r7-matrix1`. **Do not run the existing builder with that ID before the bridges are implemented:** currently it would compile only legacy V4 phases. Verify every input/case/output hash, original renderer identity, and production QA exclusion.
6. Start only the repository QA server on a confirmed free loopback port. Keep its actual PID/session and stop command. Open only the internal browser, with at most one live 3D scene across task-owned tabs. Begin with V4 preservation and the full V5 baseline, then checkpoint before expanding the matrix or handing the slot to Farm. Do not promise the entire matrix within one short slot.

## Planned visual coverage

The46 matrix groups comprise two baselines,15 legacy canonical phase cases,13 Zebra phase cases,eight scene/facility/visitor/camera groups,six locale/viewport pairs and two cleanup/cold cases. Group count is independent of the54 PRD units. Current observed/partial/not-run statuses are in matrix.json; the whole R7-02 unit is not accepted.

- **Baselines:** original earned four-habitat fixture and a strict five-habitat fixture with all 14 distinct source residents. Preserve the 24×26 grid, 624 tile bindings, origin `(6,5)`, original habitats and Zebra cells `x14..21,z12..19`. Verify five original gate-to-viewing routes after paid source connection.
- **Legacy phases:** original macaw drink/eat/flight/rest/enrichment; giraffe social/drink/browse; lion nuzzle/roar; elephant rest/bathe/spray/enrich/trunk-touch. Historical reference ticks are recipe evidence only; current producer output must match the actual phase.
- **Zebra phases:** idle, actual walking, grazing, drinking, shade rest, enrichment, following, true-distance trot, partner approach, first grooming bout, neutral gap, second bout, and exact last-tick/completion transition. Inspect real hooves/muzzle/body/head contact, four coats/identities, resource stock and source event/counter boundaries. Use existing `zebraGroomAmount`/contact contracts rather than arbitrary pose labels.
- **Scene groups:** every original enclosure/floor and facility family; terrain, creek, paths, gate, trees, rocks, flowers, reward decoration/banner; actual visitors; original picking/camera. Include real valid/invalid source preview factories on separately labelled empty setup cases. Do not remove occupied habitats just to manufacture a preview screenshot.
- **Views/settings:** four angles `0/90/180/270` for each actor/facility/phase family, low/high, actual supported overlays and debug modes. Exercise skeletons where actually present, transform rigs where that is the implementation, normals, wireframe, bounds, pivot and subtree isolation without canonical mutations. Use representative quality/motion/locale/viewport combinations rather than claiming all Cartesian products.
- **Product controls:** ID/EN at `1366×768`, `360×780`, `780×360`; camera zoom1/3 and pan/fit; visible versus occluded supported picks. Never invent individual product picking for macaws, food/water/perches or visitors where there is no SceneIdentity contract. QA subtree inspection is separate.

Every currently registered constructor ID must be accounted for through observed construction or an explicit source/trigger review. The actual renderer fallback constructor is a known equivalent-hook branch, not an absent visual family. Missing/unobserved sites stay unresolved; do not assign `NA` merely because a case did not reach them. Static source-derived absence of Sprite/Points is different from actual instanced elephant spray.

## Evidence and acceptance

Each accepted observation needs current source/build/case hashes, strict schema and full state/gameplay identity, actor/phase/tick, viewport and actual raster dimensions, quality/motion, angle/zoom, runtime provenance, camera/selection/frustum data, mesh/spatial results, console errors and visual review. Run mesh audit before choosing the final camera; the old audit pauses/recreates the viewer. Inspect the reported dimensions/angle after controls settle, with the full canvas visible.

Check frozen gameplay remains exact during camera, overlay and cosmetic inspection. Product locale/quality/mute controls may persist explicitly expected preferences in their fresh QA case; disclose those separately instead of claiming full-state equality. A conservative AABB or occluded pick is a review input, not pixel collision or wrong-selection proof. Inspect actual native pixels before accepting screenshots. Keep useful discovery and compact reviewed captures; do not bulk-delete older media.

At close, verify source owners, subscribers, pending callbacks and owned scene/debug resources are released. A bounded internal Three program cache is not a literal-zero-cache or heap-leak claim. Close own tabs, restore viewport, stop only the owned server and record the resource checkpoint before releasing the slot.

R7-02 passes only after actual current-source five-species visual observations and all required fixture/asset groups have evidence or defensible source-specific scope. Registry construction alone never promotes all 514 records. Native performance/background/15-minute soak remain R7-04/05; presented FPS is unmeasured unless directly measured. Grant budget/exactly-once/public V5 adoption, HP6-02 five-playable copy, V5 maintenance and explicit release authorization remain open.
