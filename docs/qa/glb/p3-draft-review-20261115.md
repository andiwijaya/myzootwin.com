# P3 draft review, 15 November 2026

Status: **needs revision; not animal or habitat acceptance**.

Actual GLB run `p3-20261115-all-a`, batch `batch-20261114234744551-1`: 28/28 load and capture pass, 264 clip probe sets/strips, no browser errors/warnings. Independent skeleton checks pass. Recovery `recovery-20261114235121552-2` releases templates/instances/pending/geometry/material/texture/bones to zero and renderer to its warmed 2 geometry/4 texture baseline over six cycles; final close removes the canvas. This records asset inspection, not physical-device performance or gameplay integration.

Native captures and hashes are under `.qa/glb/p3-20261115-all-a/evidence/`; seven overview sheets and 28 animation sheets are retained under `reviews/`. Master identities are in that run's `source.json` and batch receipt. Subsequent changed master bytes are archived by the authoring builder under `art/animals/v01/history/`.

The first zebra trial `p3-20261115-zebra-a` / `batch-20261114234226193-1` revealed a short head and muzzle. The subsequent draft lengthens and slopes the head. That first rejected binary was overwritten before history retention was added; its captures and recorded hash remain, but the exact binary is not claimed retained.

Findings from actual overview images:

- Zebra: detached-looking ear bases; revise the attachment and verify from front/side/back. New muzzle dimensions also require an updated contact anchor in the GLB adapter before service contact acceptance.
- Giraffe: front neck pattern becomes horizontal bars; paint the coat from a three-dimensional patch field. Shoulder/chest volume is too bulbous. Mane skinning must follow both neck joints during drinking.
- Elephant: trunk volume reads as beads; replace it with a continuous tapered surface and adjacent-joint weights. Reduce the large decorative-looking wrinkle pattern. Existing female identity, one trunk finger and no prominent tusks remain required.
- Lion: repeated mane lobes form a ribbed collar and inflate the high-detail budget. Replace them with one continuous mane mass and tapered fur details.
- Macaw: pale cheek masses protrude from the head, and breast feather strips stand off the skin. Paint cheeks and fine breast structure into the continuous surface; retain layered flight feathers. Perch views need an actual QA perch because the tail extends below the foot contact plane.

All findings remain open until new actual exports and their affected views/poses have been checked. No individual, species, H gate, P4 gate, production integration, or deployment is marked complete by this draft run.

Second actual run `p3-20261115-all-b`, batch `batch-20261114235346265-1`: again 28/28 load/render, no browser errors/warnings. Retained recipe `6443e4214fc1abd1b7cee83e7bbdcbdb1f40e5f91c15acc6942029da50e82360`. Animal captures now use a fixed ground plane; macaw perch/rest captures include a separate QA perch at the actual foot contact plane. The floor no longer follows animated animal bounds, so that motion cannot hide floating feet.

Quarter and key behavior views were rechecked. Zebra ear attachment, three-dimensional giraffe coat, smooth elephant trunk and macaw cheek/breast revision improve the first findings. New blockers: a visible foreleg/shoulder gap on giraffe, spiky lion mane tips, and the old articulation's raised feet during rest/locomotion. A new GLB articulation adapter now solves planted feet from explicit distance and scene contact targets. Initial CPU probes reach zebra `(0,.20,.70)` and giraffe `(0,.24,.80)` mouth targets within numerical tolerance; stance foot Z offsets compensate each `.07` increase in distance by `.07`, while foot heights remain fixed. These CPU probes are preliminary and do not replace a new retained export, native motion review or actual habitat contact checks.
