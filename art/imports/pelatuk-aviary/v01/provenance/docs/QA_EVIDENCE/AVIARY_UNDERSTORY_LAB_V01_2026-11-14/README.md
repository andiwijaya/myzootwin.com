# Original understory checkpoint v01

Three editable original growth-form studies are retained for habitat composition: fern, clustered palm and broadleaf shrub. Each has high/low geometry and a self-contained GLB. These are artistic forms, not measured botanical replicas or final photographic scene acceptance.

| Asset | High triangles / leaves | Low triangles / leaves |
| --- | --- | --- |
| Fern | 4,860 / 432 | 2,034 / 216 |
| Clustered palm | 15,660 / 1,100 | 7,670 / 550 |
| Shrub | 1,862 / 98 | 966 / 49 |

The canonical seed is 17. Both detail levels consume the same deterministic stream and keep identical retained leaf attachment positions/directions. Low detail is visibly sparse; actual camera switching distances remain a runtime composition gate. The high palm is a hero clump with five stems, so its population must be budgeted.

## Source, references and visual changes

Editable source: `understory-geometry.ts`, `understory-shapes.ts`, `understory-material.ts`, `understory-export.ts` and `understory-lab.ts` under `src/aviary/asset-lab/`.

The built-in image generator created two untouched original source bitmaps in `assets/aviary/originals/`:

- `understory-leaflets-v01a.png`: four fern/palm pinna cutouts, SHA-256 `d42ad4ba97ca81cf889a0ca5ff7e4124296386c4b807f5c9edacfc91c548184d`. Exact prompt and read-only alpha layout are retained. Minimum alpha-mask cell padding is 3 pixels, so atlas gutters/mips must be checked again when preparing a compressed delivery texture.
- `palm-stem-v01a.png`: generated matte ring-scar epidermis. Exact prompt and digest are in the source recipe manifest. It is used as colour only; no derived normal map is claimed.

The shrub reuses selected broadleaf cutouts from the existing original atlas. No third-party photograph pixels or downloaded mesh are generator inputs or shipped asset components.

Reference growth forms were read at [NParks fern](https://www.nparks.gov.sg/florafaunaweb/flora/1/5/1554) and [NParks clustered palm](https://www.nparks.gov.sg/florafaunaweb/flora/2/6/2622). Observed photo references: [museum palm specimen](https://south.npm.gov.tw/i-trees/PlantsData/Detail.aspx?number=B108960595) and [iNaturalist fern observation](https://www.inaturalist.org/observations/265448955). These informed arching versus upright fronds, paired pinnae and ringed cane structure; their images are not copied into this repository.

Candidate A had similar umbrella-like palm fronds and excessive cane taper. Candidate B varies younger upright and older arching fronds, keeps broader cane tips and adds younger lower stems. Candidate C adds the original epidermis texture. Candidate A geometry and exploratory captures remain retained. The initial geometry test found the fern base 15 mm above the ground; its source root was corrected to ground level before export. No assertion was weakened.

## Validation and retained identities

- Thirteen combined local tree/understory/export-route tests pass. Actual emitted stems are closed/outward, every pinna root is inside its own polygonal rachis on six ray directions, source values are finite, root bases meet the ground, LOD attachments agree and owned geometry disposes once.
- Twenty-four paired source/decoded-GLB renders pass at unchanged thresholds: whole/daylight, whole/back/studio, stem/studio and leaf/studio for all six variants. All 48 metadata files bind their render to the saved cached binary hash/bytes.
- Direct GLB inspection checks all attributes against Node-generated editable geometry (1e-6 numeric tolerance for browser/Node arithmetic), embedded images, material factors, alpha masking, closed stems and original metadata. Actual emitted hashes are retained in `assets/aviary/exports/understory/manifest.json`.
- Eight embedded PNG images across the six files agree with retained source alpha and fully opaque RGB pixels within one channel unit. Transparent RGB is excluded because of browser canvas premultiplication.
- Six actual import/dispose cycles return to three renderer geometries/eight textures. Import adds two geometries and one texture for fern/shrub, two textures for palm. Shared source ownership is four materials/three maps. These counters are not heap or physical GPU-memory measurements.
- Build passes. Observed browser warning/error log is empty. All 78 bird masters and all six forest tree masters retain their manifest hashes/byte counts.
- The fixed loopback-only development export route rejects unknown kind/seed/scale/path metadata, saves exact cached preview bytes and refuses conflicting overwrite. Browser downloads and owner-interactive tests are skipped per user instruction.

## Decision and next gate

The individual plant kit is sufficient to continue combined habitat composition. Close pinnae retain clean serrated/smooth silhouettes and readable veins; palm stem scars improve the previously uniform surface. A botanical accuracy claim is not made. Ground contact readability, canopy/understory density, lighting, mature tree scale and final bird composition must be reviewed together.

Self-contained quality GLBs duplicate textures. They are not runtime delivery packages. Texture sharing/compression, actual LOD distances and Samsung Galaxy A56 physical performance remain open. Continue ground/rocks/water/facilities, then a combined original habitat review before product integration and deploy. R07/H07/final quality gates remain open.
