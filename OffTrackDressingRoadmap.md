# Off-track dressing — roadmap

## Goal
Deliver procedural models of R2 Broken arc, P3 Relay crown, and S3 Service boom without hanging cylinders, with moderate detail and emissive lights, in a standalone user-controlled preview. Following user approval, distribute them sparsely through the playable levels.

## Assumptions
- Models and detail pass approved; campaign placement authorized with sparse density, freely rotated rings, quarter-turn pylons and booms randomly on either side.
- Follow the import-free Three.js factory and material batching used by `art-studies/phase14-ring-station-r1/station.js` and its preview.
- User owns all testing and visual review; agent verification is source review and build only.

## Phases
### Phase 1 — Models
**Implementation checklist**
- [x] Create `art-studies/off-track-dressing-r1/models.js` with the three factories, named components, modest radial segmentation and shared material palette.
- [x] Give the broken arc a large empty aperture and the boom an unobstructed underside.

**Tests / verification checklist**
- [x] Review geometry construction, dimensions and material ownership from source.

### Phase 2 — Preview and delivery
**Implementation checklist**
- [x] Add isolated orbit preview, asset selector, optional track scale guide, glow controls and material batching.
- [x] Document model sizes and how to start the preview.

**Tests / verification checklist**
- [x] Build the isolated preview; run no tests or browser inspection.
- [x] Start and open the preview for the user.

### Phase 3 — Sparse level dressing
**Implementation checklist**
- [x] Add `src/racer/off-track-dressing.js` with retained material-batched prototypes, seeded placements and conservative full-model clearance from the course.
- [x] Connect placement/culling to `SpaceScenery` and its existing cross-level resource reuse.
- [x] Document distribution, rotation and performance limits.

**Tests / verification checklist**
- [x] Review placement bounds, culling and resource ownership from source.
- [x] Build the game and make the playable preview available; no tests or agent gameplay inspection.
