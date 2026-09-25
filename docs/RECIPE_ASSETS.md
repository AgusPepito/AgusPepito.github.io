# Active recipe assets

The final racer uses the standalone model modules listed in
[`recipe-assets.json`](recipe-assets.json). The manifest contains **38 modules**:
30 track fixtures (including the separate compact passage), two asteroid
prototypes, three off-track decorations, the ship, the ring station and one
approach-chevron fixture. Historical construction studies are not part of this
submission asset set.

## Standalone interface

Every listed module has one default function accepting the Three.js namespace
and returning a Group. Optional parameters configure dimensions and variants;
calling the function with only THREE builds its default model. Modules contain
their own procedural geometry helpers, without imports, image/texture loading,
network access, timers or shader callbacks. Materials are MeshStandardMaterial
with explicit colours. Geometry is built from constructors and mathematical
operations; no baked mesh data was introduced.

The refactor inlined existing geometry helpers into editable source modules.
It did not export meshes into vertex-array files or replace procedural geometry
with imported models. The compact passage, decorations and asteroid prototypes
now have separate default-export modules.

## Placement and game rendering

Standalone models use metres, +Y up, a ground origin at minimum Y=0 and centred
X/Z. Existing ship/station normalisation remains in place; the other generators
measure transformed vertices, including instance matrices, before translating
their direct children. Open-ended primitives use DoubleSide materials.

`src/racer/recipe-assets/` contains **game adapters**, not standalone asset
modules. They call the canonical recipes and restore the authored course anchor
using `recipeOriginOffset` before deformation. This retains recessed road
hardware, gate crossing positions, ramp alignment and existing scenery centres.
The restored root keeps its original child hierarchy for the course assembler.

`recipe-runtime.js` applies material metadata after generation: shared procedural
normal/roughness maps, unlit light treatments and animated projection/sign
shaders. `recipe-surface-maps.js` owns the cached maps. Existing orbital surface
shading is still in `surface-finish.js`. Worker packing still serializes the
finished materials and restores their maps and shader hooks on the main thread.

The asteroid loader extracts each recipe Group's single mesh for the existing
InstancedMesh batches. Track material merging, indexed geometry, shared scenery
resources and culling are retained. Animated trails, projection ribbons,
particles, skies and other rendering effects remain game renderer code; they
are not additional imported models.

## Verification boundary

Source review and production/tools builds were used for this refactor. No asset
verifier, gameplay tests, browser smoke tests or visual playtesting were run,
following the user's project instructions. The user still needs to check road
alignment, recessed gates, approach markings, lighting and scenery in the
playable preview. Passing builds is not a measured FPS result or an official
jam-gate verdict.

Production and development-tools builds completed successfully. The rebuilt
`pages-dist` package contains 22 files totalling **8,793,785 bytes** (8.794 MB),
up 116,289 bytes from the preceding package. This is the full publication
directory size, not a jam-gate download measurement. Origin measurement happens
during generation; the refactor adds no per-frame origin traversal.
