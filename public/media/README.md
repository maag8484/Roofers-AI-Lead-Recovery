# Demo video — drop files here

Anything in `public/` is served from the site root and is **not** bundled by
Vite. `public/media/demo.mp4` is therefore reachable at `/media/demo.mp4`.

## Current state

| File | Status | Notes |
|---|---|---|
| `ROOF AI  (1).mp4` | **present** (64 MB) | Wired up and playing. |
| poster image | missing | Recommended — see below. |
| `.webm` | not supplied | Optional. |
| `.vtt` captions | not supplied | Optional. |

Filenames are configured in [`src/pages/home-v2/media.js`](../../src/pages/home-v2/media.js) —
change them there rather than renaming code.

### Filename note

`ROOF AI  (1).mp4` contains spaces and parentheses, so `media.js` references it
percent-encoded as `/media/ROOF%20AI%20%20(1).mp4` (note the **double** space
between `AI` and `(1)` → two `%20` in a row). That works, but a URL-safe name is
less fragile — if you rename the file to `demo.mp4`, set `src` to
`"/media/demo.mp4"` and the encoding concern disappears.

### Two suggested improvements

1. **Add a poster.** Without one the player shows black for the moment before
   playback begins. Set `poster` in `media.js` once added.
2. **64 MB is large for a 90-second clip.** It will play, but visitors on slow
   connections will wait. Re-encoding (below) typically lands 8–20 MB with no
   visible quality loss. Anything above ~50 MB is also better served from a CDN
   than from the repo.

## Loading behaviour (why the homepage stays fast)

The video is deliberately **not** part of the initial page load:

1. The player component is a separate JS chunk, fetched only on first click of
   "Watch 90-Second Demo".
2. The `<video>` element only mounts once the modal opens, so the browser
   issues no request for the media file before then.
3. `preload="none"` means even after mounting, only the poster is fetched
   until the visitor actually presses play.

Net effect: zero video bytes on first paint.

## Encoding suggestion

A 90-second demo should land around 8–20 MB. If your export is much larger:

```bash
# shrink the existing 64 MB file (quote the name — it has spaces)
ffmpeg -i "ROOF AI  (1).mp4" -vcodec libx264 -crf 24 -preset slow \
       -vf "scale=1920:-2" -acodec aac -b:a 128k demo.mp4

# poster frame at 3 seconds
ffmpeg -i demo.mp4 -ss 00:00:03 -vframes 1 -q:v 3 demo-poster.jpg
```

Then in `media.js`:

```js
src:    "/media/demo.mp4",
poster: "/media/demo-poster.jpg",
```

## Hosting elsewhere

For anything above ~50 MB, prefer a CDN or object storage over the repo. Point
`src` in `media.js` at the absolute URL — no other change is needed:

```js
src: "https://cdn.example.com/roofai/demo.mp4",
```
