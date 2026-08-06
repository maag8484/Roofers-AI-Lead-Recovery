import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { X, AlertCircle } from "lucide-react";
import { DEMO_VIDEO } from "../media";

/**
 * Demo video lightbox.
 *
 * LOADING: this module is imported lazily, so its JS is a separate chunk that
 * only downloads on first click. The <video> element exists only while the
 * modal is open, and carries preload="none" — so the browser makes no request
 * for the media file until the visitor presses play. Nothing here costs the
 * homepage a single byte on first paint.
 *
 * PORTAL: rendered into document.body on purpose. The hero applies a scroll
 * transform to its columns, and a transformed ancestor becomes the containing
 * block for `position: fixed` — a modal rendered in place would be positioned
 * against the hero instead of the viewport.
 *
 * CONTROLS: the native control set is used deliberately. It gives fullscreen,
 * scrubbing, volume, playback rate, picture-in-picture, captions and keyboard
 * support for free, in the shell each platform's users already know.
 */
export function VideoModal({ onClose }) {
  const reduce = useReducedMotion();
  const videoRef = useRef(null);
  const closeRef = useRef(null);
  const [failed, setFailed] = useState(false);

  const handleClose = useCallback(() => onClose?.(), [onClose]);

  /* Escape to close. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handleClose]);

  /* Lock page scroll, compensating for the scrollbar so the page behind
     doesn't shift sideways as it disappears. */
  useEffect(() => {
    const { body } = document;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const gap = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, []);

  /* Move focus into the dialog, then start playback. The click that opened
     this counts as the user gesture, so audio is permitted. */
  useEffect(() => {
    closeRef.current?.focus();
    const v = videoRef.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        /* Autoplay blocked — the poster and controls are still there. */
      });
    }
  }, []);

  /* Keep Tab inside the dialog while it is open. */
  const onKeyDownTrap = (e) => {
    if (e.key !== "Tab") return;
    const focusables = e.currentTarget.querySelectorAll(
      'button, [href], video, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const fade = reduce
    ? { initial: false }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
      };

  const pop = reduce
    ? { initial: false }
    : {
        initial: { opacity: 0, scale: 0.96, y: 14 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.97, y: 8 },
        transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
      };

  return createPortal(
    <motion.div
      {...fade}
      className="hv2 fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={DEMO_VIDEO.title}
      onKeyDown={onKeyDownTrap}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--ink)]/80 backdrop-blur-md"
        onClick={handleClose}
        aria-hidden="true"
      />

      <motion.div
        {...pop}
        className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[var(--ink-900)] shadow-[0_50px_120px_-40px_rgba(0,0,0,0.9)]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold text-white">{DEMO_VIDEO.title}</p>
            <p className="mt-0.5 truncate text-[13px] text-white/55">{DEMO_VIDEO.subtitle}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={handleClose}
            aria-label="Close video"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Player */}
        <div className="relative aspect-video w-full bg-black">
          {failed ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <AlertCircle className="h-7 w-7 text-white/40" />
              <p className="text-[15px] font-semibold text-white">Demo video not found</p>
              <p className="max-w-sm text-[13.5px] leading-[1.6] text-white/50">
                Add <code className="rounded bg-white/10 px-1.5 py-0.5">demo.mp4</code> to{" "}
                <code className="rounded bg-white/10 px-1.5 py-0.5">public/media/</code> — see the
                README in that folder for the expected filenames.
              </p>
            </div>
          ) : (
            <video
              ref={videoRef}
              className="h-full w-full"
              controls
              playsInline
              preload="none"
              poster={DEMO_VIDEO.poster || undefined}
              onError={() => setFailed(true)}
              title={DEMO_VIDEO.title}
            >
              {DEMO_VIDEO.webm && <source src={DEMO_VIDEO.webm} type="video/webm" />}
              <source src={DEMO_VIDEO.src} type="video/mp4" />
              {DEMO_VIDEO.captions && (
                <track
                  kind="captions"
                  src={DEMO_VIDEO.captions}
                  srcLang="en"
                  label="English"
                  default
                />
              )}
              Your browser does not support embedded video.
            </video>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

export default VideoModal;
