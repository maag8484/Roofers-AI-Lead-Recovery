/**
 * Demo video configuration.
 *
 * Paths are root-relative because the files live in `public/`. Vite copies
 * that folder verbatim, so nothing here is bundled or hashed. Swap any value
 * for an absolute CDN URL and the player picks it up with no other change.
 *
 * See public/media/README.md for the files to drop in.
 */
export const DEMO_VIDEO = {
  /* Versioned, URL-safe source for the 84-second narrated walkthrough. */
  src: "/media/roof-ai-demo-20261014.mp4",

  /* Optional WebM: usually smaller; offered first so browsers that support it
     never download the MP4. null = not supplied. */
  webm: null,

  /* Still frame shown before playback. */
  poster: "/media/roof-ai-demo-20261014-poster.jpg",

  /* The current MP4 includes burned-in captions. Optional WebVTT track. */
  captions: null,

  /* Used for the dialog title and the <video> accessible name. */
  title: "Roof AI Lead Recovery - 84-second walkthrough",

  /* Shown under the title inside the modal. */
  subtitle: "See the missed-inquiry handoff and request a human callback.",
};
