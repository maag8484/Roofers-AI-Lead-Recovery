import { useState } from "react";
import {
  TrendingUp, Clock, PhoneCall, Calendar, DollarSign,
  X, ArrowRight, Pause, LifeBuoy, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const REASONS = [
  { key: "too_expensive",       label: "Too expensive" },
  { key: "not_enough_leads",    label: "Not enough leads" },
  { key: "business_slowed",     label: "Business slowed down" },
  { key: "technical_issues",    label: "Technical issues" },
  { key: "switching_providers", label: "Switching providers" },
  { key: "other",               label: "Other" },
];

// Mock stats — replace with real data from recovered_leads / appointments tables when available
const MOCK_STATS = {
  leadsRecovered: 14,
  callsAnswered: 27,
  inspectionsBooked: 5,
  avgResponseSeconds: 18,
  potentialRevenue: 21000,
};

export function CancellationFlow({ onKeep, onConfirmCancel, onPause }) {
  const [step, setStep] = useState("roi"); // roi | reason | offer | pause
  const [reason, setReason] = useState(null);

  const s = MOCK_STATS;

  // ── Step 1: ROI screen ──────────────────────────────────────────────
  if (step === "roi") {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Before you leave…</p>
          <h2 className="text-xl font-extrabold text-ink">Here's what Roof AI did for you</h2>
          <p className="text-sm text-muted-foreground">In the last 30 days</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatTile icon={PhoneCall}   color="brand"   label="Missed calls answered" value={s.callsAnswered} />
          <StatTile icon={TrendingUp}  color="emerald" label="Leads recovered"        value={s.leadsRecovered} />
          <StatTile icon={Calendar}    color="violet"  label="Inspections booked"     value={s.inspectionsBooked} />
          <StatTile icon={Clock}       color="amber"   label="Avg response time"      value={`${s.avgResponseSeconds}s`} />
        </div>

        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-center space-y-0.5">
          <p className="text-xs text-emerald-700 font-medium">Potential revenue recovered</p>
          <p className="text-3xl font-extrabold text-emerald-700">
            ${s.potentialRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-emerald-600">Based on average roofing job value of $1,500</p>
        </div>

        <div className="space-y-2.5">
          <Button className="w-full" size="lg" onClick={onKeep}>
            Keep My Account Active
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-red-600"
            onClick={() => setStep("reason")}
          >
            Continue Cancellation <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Step 2: Reason ──────────────────────────────────────────────────
  if (step === "reason") {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-extrabold text-ink">Why are you leaving?</h2>
          <p className="text-sm text-muted-foreground">Help us improve — takes 5 seconds</p>
        </div>

        <div className="space-y-2">
          {REASONS.map((r) => (
            <button
              key={r.key}
              onClick={() => setReason(r.key)}
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all",
                reason === r.key
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-border bg-white text-ink hover:border-brand-300"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          <Button
            className="w-full"
            disabled={!reason}
            onClick={() => {
              if (reason === "technical_issues") setStep("support");
              else setStep("offer");
            }}
          >
            Next <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setStep("roi")}>
            ← Back
          </Button>
        </div>
      </div>
    );
  }

  // ── Step 3a: Support offer (technical issues) ────────────────────────
  if (step === "support") {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 mx-auto">
            <LifeBuoy className="h-6 w-6 text-brand-600" />
          </span>
          <h2 className="text-xl font-extrabold text-ink">Let us fix it</h2>
          <p className="text-sm text-muted-foreground">
            Our team can resolve most issues within 24 hours. Don't lose your setup over a fixable problem.
          </p>
        </div>

        <div className="rounded-xl border border-border p-4 space-y-3">
          <p className="text-sm font-semibold text-ink">What we can help with:</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✓ AI not responding to calls</li>
            <li>✓ Appointments not booking correctly</li>
            <li>✓ Dashboard not showing data</li>
            <li>✓ Any other technical problem</li>
          </ul>
        </div>

        <div className="space-y-2.5">
          <Button
            className="w-full"
            onClick={() => {
              window.location.href = "mailto:support@roofaileadrecovery.com?subject=Technical Issue - Need Help";
            }}
          >
            <LifeBuoy className="h-4 w-4" /> Contact Support
          </Button>
          <Button variant="secondary" className="w-full" onClick={onPause}>
            <Pause className="h-4 w-4" /> Pause Account Instead
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={onConfirmCancel}
          >
            Cancel Anyway
          </Button>
        </div>
      </div>
    );
  }

  // ── Step 3b: Dynamic offer ───────────────────────────────────────────
  if (step === "offer") {
    const isExpensive    = reason === "too_expensive";
    const notEnoughLeads = reason === "not_enough_leads";
    const seasonal       = reason === "business_slowed";
    const switching      = reason === "switching_providers";

    return (
      <div className="space-y-6">
        {/* Expensive → discount or pause */}
        {isExpensive && (
          <>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold text-ink">We hear you on price</h2>
              <p className="text-sm text-muted-foreground">Pick an option that works for your budget</p>
            </div>
            <OfferCard
              icon={DollarSign}
              color="emerald"
              title="Stay at $199/month"
              subtitle="For the next 90 days — then back to $299/month"
              cta="Claim Discount"
              onClick={() => {
                // TODO: trigger discount via Stripe coupon edge function
                window.location.href = "mailto:support@roofaileadrecovery.com?subject=Discount Request - Retention";
              }}
            />
            <OfferCard
              icon={Pause}
              color="brand"
              title="Pause for 60 days"
              subtitle="No billing. Your settings stay intact. Resume anytime."
              cta="Pause My Account"
              onClick={onPause}
            />
          </>
        )}

        {/* Not enough leads → pause */}
        {notEnoughLeads && (
          <>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold text-ink">Roof AI works best with volume</h2>
              <p className="text-sm text-muted-foreground">
                Our system is optimized for roofing companies receiving at least 20+ calls per month.
                If call volume picks up, we'll be ready.
              </p>
            </div>
            <OfferCard
              icon={Pause}
              color="brand"
              title="Pause your account"
              subtitle="Keep your setup. Come back when the calls are flowing."
              cta="Pause My Account"
              onClick={onPause}
            />
          </>
        )}

        {/* Business slowed → seasonal pause */}
        {seasonal && (
          <>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold text-ink">Seasonal slowdown?</h2>
              <p className="text-sm text-muted-foreground">
                Many roofers go quiet in winter. Pause billing for up to 90 days and pick back up when the season starts.
              </p>
            </div>
            <OfferCard
              icon={Pause}
              color="brand"
              title="Seasonal Pause — up to 90 days"
              subtitle="No billing. All your settings and workflows stay ready."
              cta="Pause My Account"
              onClick={onPause}
            />
          </>
        )}

        {/* Switching / Other → just pause */}
        {(switching || reason === "other") && (
          <>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold text-ink">One last option</h2>
              <p className="text-sm text-muted-foreground">
                Before you go — pause instead of cancel. No billing, everything stays set up.
              </p>
            </div>
            <OfferCard
              icon={Pause}
              color="brand"
              title="Pause for 60 days"
              subtitle="No billing. Resume anytime with one click."
              cta="Pause My Account"
              onClick={onPause}
            />
          </>
        )}

        <div className="space-y-2 pt-2">
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setStep("reason")}>
            ← Back
          </Button>
          <button
            className="w-full text-center text-xs text-red-400 hover:text-red-600 underline underline-offset-2 transition-colors"
            onClick={onConfirmCancel}
          >
            No thanks, cancel my account
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function StatTile({ icon: Icon, color, label, value }) {
  const colors = {
    brand:   "bg-brand-50 text-brand-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet:  "bg-violet-50 text-violet-600",
    amber:   "bg-amber-50 text-amber-600",
  };
  return (
    <div className="rounded-xl border border-border bg-white p-4 space-y-2">
      <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg", colors[color])}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-xl font-extrabold text-ink">{value}</p>
      <p className="text-xs text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}

function OfferCard({ icon: Icon, color, title, subtitle, cta, onClick }) {
  const colors = {
    brand:   "bg-brand-50 border-brand-200 text-brand-600",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-600",
  };
  return (
    <div className={cn("rounded-xl border p-4 space-y-3", colors[color])}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/70">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-bold text-ink">{title}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <Button className="w-full" onClick={onClick}>{cta}</Button>
    </div>
  );
}
