import { motion } from "framer-motion";
import { Clock, Sparkles, PlayCircle, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureCard } from "./FeatureCard";
import { FEATURES } from "./content";

const TESTIMONIALS = [
  {
    quote: "We stopped losing weekend calls overnight. It books estimates while we're on a roof.",
    name: "Joe",
    company: "Alexander Roofing",
  },
  {
    quote: "Feels like hiring a receptionist who never sleeps, for a fraction of the cost.",
    name: "Mike",
    company: "GM Exterior Pros",
  },
];

// Full-page welcome behind the onboarding modal. `onStart` opens/advances the
// modal; `onReplay` re-opens the tour.
export function WelcomeHero({ ownerName, onStart }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-center"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          <Sparkles className="h-3.5 w-3.5" /> Your AI lead recovery is ready to set up
        </span>
        <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Welcome to Roof AI Lead Recovery{ownerName ? `, ${ownerName}` : ""}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Let's get everything ready so your AI assistant can start recovering missed leads and
          booking appointments.
        </p>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={onStart} className="min-w-52">
            <PlayCircle className="h-5 w-5" /> Start setup
          </Button>
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" /> Takes about 5 minutes
          </span>
        </div>
      </motion.div>

      {/* Benefits */}
      <div className="mt-14">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          What you're getting
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} index={i} {...f} />
          ))}
        </div>
      </div>

      {/* Setup timeline */}
      <div className="mt-14 rounded-2xl border border-border bg-white p-6 sm:p-8">
        <h2 className="text-center text-lg font-bold text-ink">How setup works</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-4">
          {[
            { n: 1, t: "Start your trial", d: "Subscribe — free for 7 days." },
            { n: 2, t: "Tell us about your business", d: "A quick guided form." },
            { n: 3, t: "We configure your AI", d: "Our team provisions everything." },
            { n: 4, t: "Go live", d: "Start recovering calls 24/7." },
          ].map((s) => (
            <div key={s.n} className="text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-600">
                {s.n}
              </span>
              <p className="mt-3 font-semibold text-ink">{s.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials (placeholder) */}
      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="rounded-2xl border border-border bg-white p-6">
            <Quote className="h-6 w-6 text-brand-200" />
            <p className="mt-3 text-ink">"{t.quote}"</p>
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              {t.name} · {t.company}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Button size="lg" onClick={onStart} className="min-w-52">
          <PlayCircle className="h-5 w-5" /> Start setup
        </Button>
      </div>
    </div>
  );
}
