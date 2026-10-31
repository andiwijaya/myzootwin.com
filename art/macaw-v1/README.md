# Original blue-and-yellow macaw — V1 model / M2-01

This is the new code-native articulated model in `src/game/render3d/macaw/`, rather than the M0-03 study GLB relabeled as final. The original study and its generator/receipts remain unchanged under `art/studies/macaw-m0-03`. No mesh, photo, texture, audio, executable or font from another creator is incorporated into the new model. No purchase, agreement, external upload or repository-wide license grant is made. Existing Three.js MIT notice remains in `public/licenses/three-MIT.txt`.

Species ID: `ara-ararauna`, matching the typed core. Blue wings/back, yellow breast/underwing, green forehead, pale marked cheeks, dark hooked bill, long tail and opposed pairs of toes guide recognition. Facts rechecked against the [Toronto Zoo species profile](https://www.torontozoo.com/animals/Blue%20and%20yellow%20macaw) and [Stone Zoo](https://www.zoonewengland.org/stone-zoo/animals/birds/blue-and-yellow-macaw/) on 2026-10-31. Only factual identifying features inform original geometry; no source image or prose is copied into it. Proportions, movements, game scale and preview facilities are stylized design choices, not scientific illustration or husbandry guidance.

`model-stats.json` records actual part triangles/bounds/attribute bytes and source hashes. Maximum pose geometry is **3,180 triangles per bird /6,360 for two**, eleven owned geometries, one vertex-colour material, zero textures. Normal awake pose has ten mesh draws; closed-eye overlay adds one. Flat/gripping foot geometries are alternatives, shared by both feet and both future birds. Geometry attributes total343,440 bytes once per shared asset set. Sources total22,272 bytes across the five modules; these are source bytes, not independent network download bytes. The model is currently procedural TypeScript, not a new GLB export or official glTF certification.

## Reuse and ownership

```ts
const assets = createMacawAssets();
const first = createMacawRig(assets);
const second = createMacawRig(assets);
first.apply(sampleMacawPose('perch', animationTimeMs));
second.apply(sampleMacawPose('walk', animationTimeMs));
// Place root transforms from authoritative game state, not the demonstration studio.
first.dispose(); second.dispose(); assets.dispose();
```

Rig transforms are independent; geometry/material buffers are borrowed and shared. Rig disposal detaches that instance and never disposes shared assets. One explicit asset owner disposes the eleven geometry buffers and material exactly once. The rig does not create RAF, timers, listeners, textures or storage. World placement/animal needs/targets/AI remain the simulation's responsibility.

`sampleMacawPose` supplies deterministic perch/idle, walk, hop, short-flight, eat, drink and rest articulation. Root XZ placement stays untouched. Internal visual lift is bounded; head/jaw, shoulder/forewing, tail, independent feet and eyelids respond to the pose. `createMacawAnimator` supports a280ms continuous crossfade and interruption from the current blended pose, with caller-supplied bounded visual time. Paused callers stop advancing time. It creates no loop and does not consume resources or change welfare.

`macaw-studio.ts` is an explicitly labelled presentation adapter. It has one demonstration bird, a supported perch/bowl, ground contact cue, seven clips/four angles, visual pause, and optional preview in a real empty habitat at scale0.62. Its demonstration walk/flight offset is not navigation and must not be copied into authoritative movement. It pauses the gameplay core while using the existing renderer RAF for visual animation. Its assets and original display props are disposed on close/failure/remount. Selecting a clip does not place birds, feed them or complete missions. M2-02 must instantiate the two actual living animals from typed simulation state.

## Verification boundary

Unit/integration tests check finite normals/palette/nondegenerate triangles, outward hook faces, grip contact, ground/roof/wing bounds across cycles, independent shared rigs, continuous interruptions, pause/reduced-motion, no world mutations and disposal ownership. Actual WebGL visual and input evidence, final commands/source/build identities and measured limitations are recorded in `docs/M2-01_MACAW_MODEL.md` and `docs/qa/m2-01/` after completion. Physical Android/touch/Safari/iOS, actual presented FPS/GPU time and full populated-game soak remain separate gates.
