# Vector Shift music

User-supplied MP3 files, copied without transcoding:

- `menu.mp3`: `menuSong.mp3`
- `race-01.mp3`: `output (2).mp3`
- `race-02.mp3`: `output (3).mp3`
- `race-03.mp3`: `output (4).mp3`

The menu song loops. Racing plays 01, 02, 03 in order and repeats; checkpoints and retries do not restart the song. Returning to the menu switches back to the menu song. Pause and hidden tabs suspend playback; crash panels lower the race volume. The header music toggle persists locally. Browsers can require a user gesture before playback starts. Media elements load songs on demand, without decoding all four tracks into Web Audio buffers.
