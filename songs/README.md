# Creator's Music Library

To add new songs to Resonance:

1. Place your audio file (`.m4a`, `.mp3`, `.wav`, `.ogg`, or `.flac`) into this `songs/` folder.
2. Open `songs.json` in the root folder and add an entry with the title, artist, and relative path:

```json
[
  {
    "title": "21 Guns",
    "artist": "Green Day",
    "file": "songs/21 Guns - Green Day.m4a"
  },
  {
    "title": "Your Next Song",
    "artist": "Artist Name",
    "file": "songs/your-song-file.mp3"
  }
]
```

3. Commit and push the changes to GitHub. The song will automatically appear in the **Creator's Playlist** on your website!
