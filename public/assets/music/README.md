# Vector Shift music

Audio files:

- `menu.mp3`: first 90 seconds of `menuSong.mp3`, re-encoded at the original 192 kb/s with a 20 ms fade-in and 250 ms fade-out to soften the loop boundary.
- `race-01.mp3`: `output (2).mp3`

The menu song loops, and racing loops only race-01, as requested on 2026-09-25. Checkpoints and retries do not restart the song. Returning to the menu switches back to the menu song. Pause and hidden tabs suspend playback; crash panels lower the race volume. The header music toggle persists locally. Browsers can require a user gesture before playback starts. Media elements load songs on demand, without decoding entire tracks into Web Audio buffers.

Audio provenance:
- `menu.mp3` was generated with ElevenLabs through an Atlas account.
- `race-01.mp3` was generated with ElevenLabs through an Atlas account.
- Both tracks were generated specifically for this project.
- The entrant has full rights to use and publish both tracks in this game.

The full menu original and removed race-02 / race-03 tracks are preserved under `docs/art/audio/source/`, outside the published game. Their original names were `menuSong.mp3`, `output (3).mp3`, and `output (4).mp3`. Audio quality and the loop transition remain for user review.