# Original macaw mesh study — M0-03

This is an original procedural feasibility study authored for MyZooTwin on 2026-10-31. It is **not final M2-01 art, an animated asset, a WebGL render test or a game implementation**.

No external mesh, texture, photograph, recording or font file is incorporated. Biological identifying features were checked against the primary sources linked in [M0-03_ASSETS.md](../../../docs/M0-03_ASSETS.md). Existing journal media was not used as a texture or copied into this study. No third-party asset purchase/agreement was required. No new open-source license is assigned to the repository or this original project work; provenance and task authorization are recorded rather than inventing a rights grant.

Files retained:

- build_macaw_study.py — original parametric geometry, vertex colours, GLB export and SVG review projection.
- validate_macaw_study.py — bounded structural checks with two malformed-file negative cases.
- study/macaw-study.glb — one 189,816-byte model, 2,028 triangles, eight rigid groups, one material, no textures/animations.
- study/study-stats.json and study/validation-results.json — actual measurements and test limits.
- study/macaw-study-preview.jpg and study/visual-review.json — actual isolated-browser capture/context of the mesh's SVG projection.

Run with existing Python:

    python art/studies/macaw-m0-03/build_macaw_study.py
    python art/studies/macaw-m0-03/validate_macaw_study.py

The generator also creates ignored study/macaw-study.svg and study/index.html for local review. Serve that folder only on loopback when needed, then shut down the owned server. The generated SVG/HTML are reproducible review artifacts; they are not application entry points and are not loaded by the site. The committed JPEG is evidence, not a new game texture.

Future M2-01 work must refine shapes and implement/test idle, movement, eat, drink/rest animation in the actual renderer. The GLB has useful named rigid pivots (jaw under head), but no animation clips or GPU quality/performance pass. Two animals should reuse the one geometry/material set. Do not mark the final-model task complete from this study.
