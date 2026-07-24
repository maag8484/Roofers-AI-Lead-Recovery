import { motion } from "framer-motion";

// "What happens after payment?" — a numbered, honest timeline of the real
// post-checkout flow (subscribe -> details form -> our team provisions -> live).
const STEPS = [
  { title: "Your AI workspace is created", detail: "We spin up your account the moment you subscribe." },
  { title: "You tell us about your business", detail: "A quick form: service area, services, call-handling preference." },
  { title: "Our team configures your AI receptionist", detail: "We provision your number and set up call handling for you." },
  { title: "Your calendar & routing are connected", detail: "Appointments and warm transfers wired to your preferences." },
  { title: "You're live — recovering missed calls 24/7", detail: "Every missed call gets answered and qualified automatically." },
];

export function NextSteps() {
  return (
    <ol className="space-y-3">
      {STEPS.map((s, i) => (
        <motion.li
          key={s.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.25 }}
          className="flex gap-3.5"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
            {i + 1}
          </span>
          <span>
            <span className="font-medium text-ink">{s.title}</span>
            <span className="block text-sm text-muted-foreground">{s.detail}</span>
          </span>
        </motion.li>
      ))}
    </ol>
  );
}
