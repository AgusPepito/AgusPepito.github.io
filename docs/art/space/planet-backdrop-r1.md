# Forward space backdrop

Generated 2026-09-25 using the built-in image-generation tool. Asset: `public/assets/space/planet-backdrop-r1.png`. The prior spherical panoramas remain available as earlier revisions.

This is perspective artwork covering the forward view. `src/racer/space-sky.js` projects a subdivided plane radially onto a curved cap at radius 700. UV rays preserve the source proportions from the viewing center. The panel maintains the source image aspect ratio and covers the maximum 102-degree racing FOV plus a shake margin. Wider and taller displays crop the art instead of stretching the planet; in portrait the planet may lie outside the central crop.

The panel follows camera translation and the smoothed course-facing camera orientation, excluding shake. This deliberately makes the background follow course turns and rolls, instead of representing a world-fixed celestial sphere. One unlit draw call, one texture, no extra lights or postprocessing. It renders behind the course without depth writes or fog and uses the existing disposal path. Build/source review only; visual evaluation remains user-owned.

The panel's X/Y scale follows the camera's FOV tangent, keeping its screen coverage and planet size stable during boost without rebuilding geometry each frame.

## Prompt

Create a high-resolution landscape space background texture for the FORWARD VIEW of a science-fiction racing game. This is a cropped perspective view of space, NOT a 360 panorama or equirectangular map. Prefer 1536x1024 or higher 3:2 landscape resolution. Dark near-black navy outer space with sparse tiny sharp pinprick stars and extremely faint blue dust. One beautifully detailed blue ocean planet with rocky continents, delicate white cloud swirls, partly shadowed with a thin atmospheric rim. Planet center at 76% image width and 42% image height; planet diameter about 18% of total image width (27% height), wholly within frame. Planet visually round in this perspective image. Main priorities: crisp natural planet surface details and small clean pinpoint stars, no blurry streaks, no smeared textures. Leave the central and lower-middle area very dark and unobtrusive for racing track overlay. Refined realistic space artwork. No track or ground, no spacecraft, no sun, no extra planets, no HUD, no lettering, no watermark. This will be mapped onto a gently curved backdrop viewed from its center: do NOT paint fisheye, longitude stretching or panoramic distortion.
