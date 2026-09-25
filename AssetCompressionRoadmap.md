# Asset compression — roadmap

## Goal
Reduce runtime media downloads with KTX2 sky textures, one racing song, and a half-length looping menu song. Retain original audio outside the published assets and preserve PNGs used by the separate art studies.

## Assumptions
- Keep only race-01, as explicitly selected by the user.
- Preserve texture resolution and orientation; use Basis Universal compression for device compatibility.
- HTML menu banners require a conventional browser image format; KTX2 applies to GPU textures.
- The user owns testing and visual/audio approval. No automated tests, gate runs, or gameplay inspection.

## Phase 1 — Media conversion
**Implementation checklist**
- [x] Encode the two active sky textures to KTX2 and retain PNG sources.
- [x] Keep race-01; archive race-02 and race-03 outside public output.
- [x] Cut the first half of menu.mp3 with short boundary fades and retain the original.

**Verification checklist**
- [x] Inspect conversion metadata and file sizes without visual gameplay review.

## Phase 2 — Runtime integration
**Implementation checklist**
- [x] Integrate KTX2Loader with local transcoders, renderer detection, readiness and disposal.
- [x] Update RaceMusic and asset provenance documentation.

**Verification checklist**
- [x] Source-review loading, texture orientation, errors and resource cleanup.
- [x] Rebuild the playable preview; leave gameplay/audio assessment to the user.

## Risks
- Compression is lossy; fine stars and planet detail require user approval.
- KTX2 adds a transcoder download; include it when comparing size savings.
- A half-length song may not end on a musical phrase; short fades soften the loop boundary.
