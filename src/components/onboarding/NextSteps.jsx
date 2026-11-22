import { pilotOffer } from "@/lib/pilot";
import { motion } from "framer-motion";

// Applying is separate from card authorization and activation.
const steps = (offer) => [
  { title: "Request your free pilot", detail: "Create your account and confirm your email. A card authorization reserves an eligible pilot; nothing is due at reservation." },
  { title: "Tell us about your business", detail: "Share your service area, services and call-handling preferences." },
  { title: "Free setup with a specialist", detail: "We configure overflow forwarding from your current number. Your staff still answers first." },
  { title: "Confirm each caller's next step", detail: "Approve the callback, booking-request or transfer destination and exclusions." },
  { title: "Live test and pilot activation", detail: `After setup and a successful live test, run the free pilot for ${offer.duration}, up to 40 recovered calls. Unless you cancel before 14 full days from activation, monthly billing begins at the rate you authorized. Earlier accepted agreements keep their terms.` },
];

export function NextSteps({ user }) {
  const offer = pilotOffer(user);
  return (
    <ol className="space-y-3">
      {steps(offer).map((s, i) => (
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
