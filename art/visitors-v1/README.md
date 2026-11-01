# Original entrance visitors V1

Three recognisable low-poly people variants, hats/backpacks and separate limbs, authored as code in `src/game/render3d/visitor-scene.ts`. No external artwork, model, texture, audio or new licence terms. The existing Three.js MIT software notice remains in the site. Model/source byte hashes and measured triangles are in `model-stats.json`.

Each visible person uses five vertex-coloured rig meshes and one contact shade. All share a lazily allocated eight-geometry/two-material pool; maximum three people. Positions and lifetimes are authoritative fixed-tick state. The renderer interpolates only accepted positions; cosmetic limb motion never creates admissions or money. All geometry/material ownership is disposed on renderer teardown. This is entrance-only M3-01; M3-02 adds path navigation.
