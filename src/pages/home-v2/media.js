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
  /* Primary source.
     The filename contains spaces, so it MUST stay percent-encoded here. */
  src: "/media/ROOF%20AI%2010%20AUG%201.mp4",

  /* Optional WebM: usually smaller; offered first so browsers that support it
     never download the MP4. null = not supplied. */
  webm: null,

  /* Still frame shown before playback. Without it the player opens black.
     Not supplied yet; see public/media/README.md for how to generate one. */
  poster: null,

  /* Optional WebVTT captions. null = no subtitles track. */
  captions: null,

  /* Used for the dialog title and the <video> accessible name. */
  title: "Roof AI Lead Recovery - 120-second demo",

  /* Shown under the title inside the modal. */
  subtitle: "See how a missed call becomes a booked inspection.",
};
