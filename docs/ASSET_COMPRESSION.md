# Media compression — 2026-09-25

## Runtime sky textures

The two active sky textures use Basis Universal ETC1S in KTX2 containers, quality 255, compression effort 2, sRGB, RGB only, with full mip chains. Original resolutions remain 1536 × 1024 and 1774 × 887. Inputs are flipped vertically during encoding to preserve the prior Three.js TextureLoader orientation; compressed texture uploads do not apply TextureLoader's flipY operation.

| Asset | Original PNG bytes | KTX2 bytes |
|---|---:|---:|
| planet-backdrop-r1 | 1,811,455 | 229,489 |
| planet-stars-r2 | 1,694,277 | 219,827 |
| Combined | 3,505,732 | 449,316 |

The local transcoder adds 584,862 bytes (57,529 JS + 527,333 WASM), so these textures plus their transcoder total 1,034,178 bytes, approximately 70.5% below the original PNG pair, before additional loader module code and HTTP compression. This is a file-size comparison, not a measured gate result or download total.

`spaceSky(renderer)` detects GPU support and transcodes to a supported GPU format. If compressed formats are unavailable, KTX2Loader can fall back to uncompressed texture data. Both jobs must finish before shader warmup, rendering and game readiness. Failures appear through the existing loading-error UI. The loader releases its worker after both requests settle. Shared sky textures survive level changes and remain covered by scene disposal; late results are disposed if their sky has already been destroyed.

Sky PNGs remain as original sources for the independent art studies. The racing sky requests only the KTX2 versions. HTML campaign banners use WebP, since browsers cannot display KTX2 in an img element. Procedural canvas textures are unchanged.

## Campaign thumbnails — 2026-09-26

All six area thumbnails were 2172 × 724 RGB PNG images, totaling 15,517,308 bytes. After the user supplied their approximately 480-pixel-wide screen appearance, runtime copies were reduced to 480 × 160 WebP images (Pillow, Lanczos resize, quality 82, method 6), totaling 118,308 bytes: a 99.24% reduction. These were regenerated from the original PNGs, not the intermediate 1200-pixel WebP copies. The aspect ratio, CSS crop, carousel and lazy-loading behavior remain unchanged; the image elements now declare the new intrinsic dimensions. Original PNGs are archived under `docs/art/ui/source/areas/`, outside the production build. Historical art notes refer to the original generation paths.

| Thumbnail | Original bytes | Runtime WebP bytes |
|---|---:|---:|
| Dockyards | 2,695,935 | 18,978 |
| Conduits | 2,630,197 | 17,334 |
| Broken Span | 2,553,934 | 19,980 |
| Relay Grid | 2,438,895 | 19,840 |
| Outer Ring | 2,659,691 | 21,736 |
| Nexus | 2,538,656 | 20,440 |

The images are lossy derivatives, so visual approval remains with the user. No visual gameplay inspection or tests were performed.

### Reproduction

Encoder: Basis Universal v1.16.3, portable executable distributed by npm package `@gpu-tex-enc/basis@1.16.4`. The downloaded archive was compared with the registry's SHA-1 `8f367ca8b572e2b1abdadec55e07717c667011f7`. Conversion tools live in ignored `artifacts/media-tools/`, not in game dependencies.

Run for each active sky image, substituting the stem:

```text
basisu -ktx2 -q 255 -comp_level 2 -mipmap -y_flip -no_alpha -file public/assets/space/<stem>.png -output_file public/assets/space/<stem>.ktx2
```

The deployed `public/vendor/basis/` transcoder comes from the installed Three.js 0.180.0 package, matching its KTX2Loader. Basis Universal's license is retained beside it.

## Audio

Only race-01 remains in the game playlist and loops through the native media element. race-02 and race-03 are archived under `docs/art/audio/source/`; their combined 5,761,242 bytes are no longer copied into the production build.

The original menu song was approximately 180 seconds, 192 kb/s stereo MP3. The runtime version contains its first 90 seconds, at the original bitrate/sample rate, with a 20 ms opening fade and 250 ms closing fade. HTMLAudioElement.loop repeats it. This softens the cut but does not claim a musically seamless edit; listening approval belongs to the user.

Menu size: 4,320,621 → 2,161,196 bytes. The full original is retained as `docs/art/audio/source/menu-original.mp3`. FFmpeg 7.1 was supplied by the portable `imageio-ffmpeg==0.6.0` package.

```text
ffmpeg -i docs/art/audio/source/menu-original.mp3 -t 90 -af "afade=t=in:st=0:d=0.02,afade=t=out:st=89.75:d=0.25" -c:a libmp3lame -b:a 192k -map_metadata -1 public/assets/music/menu.mp3
```

## Validation boundary

Conversion metadata/file sizes and source reviewed; production preview rebuilt. No tests, gate runs, gameplay screenshots, visual review or audio listening performed. User review should cover sky detail/orientation and the music loop. Jam compliance remains unproven until the authorised official live-URL gate run.
