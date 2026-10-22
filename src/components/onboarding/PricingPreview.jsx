import { Check, ShieldCheck } from "lucide-react";

const INCLUDED = [
  "Free setup and a live test call before activation",
  "Up to 40 recovered calls over 30 days",
  "Missed and after-hours overflow — your staff answers first",
  "Keep your current business number",
  "Roofing need, service area and urgency qualification",
  "A clear callback or booking request for qualified callers",
  "A report of exactly what the pilot caught",
];

export function PricingPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
      <div className="bg-gradient-to-br from-brand-600 to-brand-700 p-6 text-white">
        <h3 className="text-xl font-bold">Free 30-Day Pilot</h3>
        <p className="mt-2 text-4xl font-extrabold">$0</p>
        <p className="mt-2 text-sm text-brand-100">Your pilot ends automatically unless you explicitly choose paid continuation.</p>
      </div>
      <div className="space-y-2.5 bg-white p-6">
        {INCLUDED.map(line => <div key={line} className="flex items-start gap-2.5 text-sm text-ink"><Check className="h-5 w-5 shrink-0 text-emerald-600" />{line}</div>)}
        <p className="pt-3 text-sm text-muted-foreground">One pilot per operating roofing company with a forwardable business line. If you continue: $149/month locked for 12 months for the first 10 customers; standard $299/month. Eligibility and your rate are confirmed before your pilot starts.</p>
        <p className="text-sm text-muted-foreground">No setup fees · No contracts · Cancel anytime from your dashboard</p>
        <p className="flex items-center gap-2 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0" />No card required. No automatic paid conversion. Existing subscriptions keep their agreed terms.</p>
      </div>
    </div>
  );
}
