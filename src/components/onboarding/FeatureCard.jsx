import { motion } from "framer-motion";

// A single feature tile: icon chip, title, one-line explanation. Animates in
// with a small stagger when `index` is provided.
export function FeatureCard({ icon: Icon, title, description, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * index, duration: 0.3, ease: "easeOut" }}
      className="group rounded-xl border border-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
        <Icon className="h-5 w-5" />
      </span>
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}
