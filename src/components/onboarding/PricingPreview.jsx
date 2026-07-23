import { Check, ShieldCheck, Star } from "lucide-react";

const INCLUDED = [
  "7-day free trial",
  "No charges during your trial",
  "Cancel anytime",
  "Unlimited AI conversations",
  "Unlimited lead recovery",
  "Dedicated business number",
  "24/7 AI receptionist",
];

// Premium pricing panel: gradient header, the real $299/mo, trial-forward
// framing, and trust badges — replaces the bare price line.
export function PricingPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
      <div className="bg-gradient-to-br from-brand-600 to-brand-700 p-6 text-white">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-100">
          <Star className="h-3.5 w-3.5 fill-brand-100" /> Trusted by roofing companies
        </div>
        <div className="mt-2 flex items-end gap-1.5">
          <span className="text-4xl font-extrabold">$299</span>
          <span className="pb-1 text-brand-100">/month</span>
        </div>
        <p className="mt-1 text-sm text-brand-100">Starts after your 7-day free trial.</p>
      </div>

      <div className="space-y-2.5 bg-white p-6">
        {INCLUDED.map((line) => (
          <div key={line} className="flex items-center gap-2.5 text-sm text-ink">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50">
              <Check className="h-3 w-3 text-emerald-600" />
            </span>
            {line}
          </div>
        ))}
        <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-secondary/60 py-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> Secure payments by Stripe · No credit card
          charged during trial
        </div>
      </div>
    </div>
  );
}
