import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

// "What you'll need" — an animated checklist that reveals row by row so the
// customer can gather info before they start.
export function SetupChecklist({ items }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <motion.li
          key={item.label}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.06 * i, duration: 0.25 }}
          className="flex items-start gap-3 rounded-lg border border-border bg-white px-3.5 py-2.5"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          <span>
            <span className="text-sm font-medium text-ink">{item.label}</span>
            {item.hint && (
              <span className="block text-xs text-muted-foreground">{item.hint}</span>
            )}
          </span>
        </motion.li>
      ))}
    </ul>
  );
}
