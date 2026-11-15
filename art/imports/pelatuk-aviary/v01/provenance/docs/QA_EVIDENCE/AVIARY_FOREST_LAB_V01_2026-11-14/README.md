# Original forest tree checkpoint v01

The first original broadleaf tree kit is retained for further habitat composition. This is a tree asset checkpoint, not acceptance of the complete forest or photographic equivalence. R07/H07 remain open for lower vegetation, other habitat assets and final composition.

## Assets and authoring

- Editable curved trunk/branch/leaf geometry: `src/aviary/asset-lab/forest-tree.ts`.
- Three canonical seeds 17/203/841, each at 2.4 m design height with high and low detail.
- High: 12 branches, 288 curved leaf cards, 5,040 triangles. Low: the same twelve branch paths and 96 canonical leaf attachments, 1,400 triangles. Low is visibly sparser and is suitable only for distant placement; the actual switching distance remains an integration gate.
- Two shared materials, three original maps per material set. Bark is the project's retained generated bark and derived normal; leaves use untouched `tropical-leaf-atlas-v01b.png` (SHA-256 `4d1eafaf1e0913d1539087e05a0e95783e27dacd5e67a5644b463ae45f863b0d`).
- Built-in image generation created leaf candidate A and edit B. Both untouched RGBA outputs and exact prompts are retained in `assets/aviary/originals/`. No internet photograph pixels or downloaded meshes are used in this kit.
- Six self-contained quality GLBs and their exact byte counts/hashes are recorded in `assets/aviary/exports/forest/manifest.json`. Their embedded maps are duplicated for portable standalone authoring files; these are not delivery packages. Runtime texture sharing/compression remains required.

## Validation

- Nine local geometry/export-route tests pass. These cover actual closed/outward wood components, branch-root cap burial, ground caps, petiole attachment inside actual polygonal branches, deterministic shared LOD attachments, disposal and fixed-path loopback export behavior.
- The initial attachment test failed against true-curve roots. Actual roots were moved onto the canonical polygonal branch ring interpolation; low detail retains six longitudinal branch rows. The failed log remains in `forest-tests-initial.txt`.
- Twenty-four source/decoded-GLB render pairs pass: four cases for every seed/detail combination (whole/daylight, trunk/studio, canopy/back/daylight, leaf/studio). All 48 metadata files bind the views to the retained binary byte counts and SHA-256 values.
- First pilot failed because GLB core sampler data does not store renderer anisotropy. The loader now applies the same anisotropy 4 as source. Rejected pilot captures/report remain in `pilot-sampler-default/`; original pixel thresholds remain unchanged. This is an explicit loader policy, not an embedded GLB property.
- Native full-viewport images have a measured uniform CSS-to-capture pixel scale. The comparator maps the measured canvas rectangle into those pixels without resampling images. Early clipped exploratory images are not portability evidence.
- Actual emitted POSITION/NORMAL/UV/COLOR attributes agree with Node source generation within 1e-6; metadata numeric agreement uses 1e-12 because browser/Node transcendental arithmetic can differ. The inspector retains actual emitted attribute hashes. Wood closure and material factors are inspected directly in each GLB.
- Three embedded PNGs per GLB are checked against retained source pixels. Three 0.187 explicitly inverts the normal-map green channel for derivative-TBN export and the loader compensates in normalScale.y; the verification checks that transformation. Transparent RGB is excluded because browser canvas premultiplication can change hidden RGB; alpha and fully opaque RGB remain checked.
- Four actual import/dispose cycles return from renderer 5 geometries/11 textures to 3/8. The shared source material set remains two materials/three maps. These are renderer counters, not heap or GPU-memory measurements.
- Build passes. Observed browser warning/error log is empty. All 78 retained bird masters match their existing byte counts/hashes; the bird manifest is unchanged.

## Visual decision and remaining limits

Close leaf edges are clean in the observed front/back/studio views; veins, subtle colour variation, curved surfaces and bark relief are readable. Trunks meet the study floor, branch caps are buried and petiole anchors are attached. Whole and grove views are usable as a young broadleaf tree foundation. This kit is an artistic mixed tropical broadleaf study, not a botanical species reconstruction.

The grove is still a sparse isolated look-development scene. Final canopy density, mature silhouettes, understory/palms/ferns, ground cover, rocks, water, fixtures, contact placement, lighting and camera composition remain open. No physical Samsung Galaxy A56 test, runtime LOD switch, complete-scene performance result or production deployment is claimed.

All authoring exports use the development-only same-origin loopback POST endpoint. The saved binary is exactly the cached preview binary. Browser download/file chooser tests are skipped per the owner's instruction. No owner approval is required for these local checks.

Next: original lower vegetation and wider habitat asset kit, then combined composition review before runtime integration.
