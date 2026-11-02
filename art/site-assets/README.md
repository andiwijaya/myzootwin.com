# Original site vector assets

`generate.mjs` authors a Tropical Creek journal composition and a macaw favicon from handwritten SVG paths, using the original project's low-poly scenery/macaw motifs as visual context. No legacy pixels, external image, font, model or third-party SVG is an input. SVG metadata and the sidecar record authorship/method/source hashes; no third-party license designation is invented.

Run `node art/site-assets/generate.mjs --write` to generate only the three named public outputs. Run `--verify` to regenerate in memory and compare their bytes on the recorded Node/sharp/libvips toolchain. The primary illustration is SVG1024x1536. Its PNG export preserves `/images/myzootwin-beranda.png` for existing image links; it contains only the new artwork. Favicon `/favicon.svg` retains64x64 dimensions and its URL. No format-mismatched redirect/PNG stub or hosting assumption is needed.

Before the first replacement, both original files were saved into the Git-ignored local archive named in `legacy-retirement.json`, with CRC/every-member SHA verified. They also remain in the referenced Git history. This is a recovery/provenance archive, not a distributable art pack and not an assertion of infringement. Restore only to a new empty review directory after hash checks; no in-place or production rollback was performed. Do not add the archive to public or the shipping build.

The existing original gameplay JPEG remains the homepage/play social image and actual-game capture. The new journal art is explicitly an illustration. Browser visual QA and final asset mapping are recorded in `docs/M6-06_ORIGINAL_SITE_ASSETS.md`.
