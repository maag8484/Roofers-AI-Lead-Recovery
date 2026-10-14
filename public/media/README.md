# Website demo media

The active demo is configured in `src/pages/home-v2/media.js`. Vite copies these assets directly from `public/`.

| File | Role |
|---|---|
| `roof-ai-demo-20261014.mp4` | 83.92-second, 1920×1080 H.264/AAC walkthrough, approximately 3 MB; includes timed captions. |
| `roof-ai-demo-20261014-poster.jpg` | Opening frame shown before playback. |

The October 14, 2026 replacement uses slower synthetic narration, the original illustrative roofing scene, and actual public website screenshots. Configuration-dependent workflows are labelled illustrative; requested inspections are distinguished from confirmed appointments. The CTA is a human callback request, with no payment or account signup required for that request.

Original media remains available for rollback. The active filenames are versioned to avoid stale cached video bytes. No WebM or separate VTT is configured because this MP4 already includes captions.

The player is loaded only when the demo modal is opened, and uses `preload="none"`, so the video does not download on the initial homepage load. Change the source, poster, title, and subtitle together when replacing this demo.
