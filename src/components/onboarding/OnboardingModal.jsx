import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Hand,
  Sparkles,
  ClipboardList,
  CreditCard,
  ListChecks,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ProgressStepper } from "./ProgressStepper";
import { FeatureCard } from "./FeatureCard";
import { SetupChecklist } from "./SetupChecklist";
import { PricingPreview } from "./PricingPreview";
import { NextSteps } from "./NextSteps";
import { FEATURES, CHECKLIST } from "./content";

const STEP_LABELS = ["Welcome", "Features", "What you'll need", "Pricing", "Next steps"];
const TOTAL = STEP_LABELS.length;

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

// Premium animated onboarding wizard. Controlled by the parent:
//   open        — visibility
//   step/setStep — current 1..TOTAL
//   onClose     — X / Escape / "Skip for now"
//   onFinish    — final CTA ("Start Free Trial"); parent kicks off checkout
//   finishing   — parent's in-flight state for the CTA spinner
export function OnboardingModal({
  open,
  step,
  setStep,
  onClose,
  onFinish,
  finishing,
  finishLabel = "Start Free Trial",
  finishIcon: FinishIcon = Rocket,
}) {
  const panelRef = useRef(null);
  const lastFocused = useRef(null);

  const next = useCallback(() => setStep((s) => Math.min(TOTAL, s + 1)), [setStep]);
  const back = useCallback(() => setStep((s) => Math.max(1, s - 1)), [setStep]);

  // Escape closes; Tab is trapped within the panel.
  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement;

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Tab") {
        const nodes = panelRef.current?.querySelectorAll(FOCUSABLE);
        if (!nodes || nodes.length === 0) return;
        const list = Array.from(nodes).filter((n) => n.offsetParent !== null);
        const first = list[0];
        const last = list.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    // Lock background scroll.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move focus into the panel.
    const t = setTimeout(() => {
      const nodes = panelRef.current?.querySelectorAll(FOCUSABLE);
      nodes?.[0]?.focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
      // Restore focus to whatever opened the modal.
      if (lastFocused.current instanceof HTMLElement) lastFocused.current.focus();
    };
  }, [open, onClose]);

  const isLast = step === TOTAL;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
            className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          >
            {/* Header */}
            <div className="border-b border-border p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-brand-600">
                  Getting started
                </span>
                <button
                  onClick={onClose}
                  aria-label="Close onboarding"
                  className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-ink"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ProgressStepper current={step} total={TOTAL} labels={STEP_LABELS} />
            </div>

            {/* Body (scrolls) */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <StepContent step={step} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-border p-5">
              {step === 1 ? (
                <button
                  onClick={onClose}
                  className="text-sm font-medium text-muted-foreground hover:text-ink"
                >
                  Skip for now
                </button>
              ) : (
                <Button variant="ghost" onClick={back}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              )}

              {isLast ? (
                <Button onClick={onFinish} disabled={finishing} className="min-w-44">
                  {finishing ? (
                    <Spinner className="text-white" />
                  ) : (
                    <>
                      <FinishIcon className="h-4 w-4" /> {finishLabel}
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={next}>
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StepHeading({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-5">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" />
      </span>
      <h2 id="onboarding-title" className="text-xl font-extrabold text-ink">
        {title}
      </h2>
      {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function StepContent({ step }) {
  if (step === 1) {
    return (
      <div>
        <StepHeading
          icon={Hand}
          title="Welcome 👋"
          subtitle="In the next few minutes we'll get your AI receptionist ready to recover missed calls."
        />
        <ul className="space-y-2.5">
          {[
            "Secure your subscription (7-day free trial)",
            "Tell us about your business",
            "We configure your AI receptionist",
            "Connect your calendar & call routing",
            "Activate 24/7 lead recovery",
          ].map((line) => (
            <li key={line} className="flex items-center gap-3 text-sm text-ink">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
                ✓
              </span>
              {line}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div>
        <StepHeading
          icon={Sparkles}
          title="What your AI does"
          subtitle="Everything that goes to work the moment a call comes in."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} index={i} {...f} />
          ))}
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div>
        <StepHeading
          icon={ClipboardList}
          title="What you'll need"
          subtitle="Have these handy for the quick setup form after checkout."
        />
        <SetupChecklist items={CHECKLIST} />
      </div>
    );
  }

  if (step === 4) {
    return (
      <div>
        <StepHeading
          icon={CreditCard}
          title="Simple, transparent pricing"
          subtitle="Start free. You won't be charged during your 7-day trial."
        />
        <PricingPreview />
      </div>
    );
  }

  return (
    <div>
      <StepHeading
        icon={ListChecks}
        title="What happens after you start"
        subtitle="Here's exactly what we'll do once you begin your trial."
      />
      <NextSteps />
    </div>
  );
}
