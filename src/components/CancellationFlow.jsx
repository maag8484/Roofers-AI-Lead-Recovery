import { useState } from "react";
import {
  TrendingUp, Clock, PhoneCall, Calendar, DollarSign,
  ArrowRight, Pause, LifeBuoy, Star, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const REASONS = [
  { key: "too_expensive",       label: "Too expensive" },
  { key: "not_enough_leads",    label: "Not enough leads" },
  { key: "business_slowed",     label: "Business slowed down" },
  { key: "technical_issues",    label: "Technical issues" },
  { key: "switching_providers", label: "Switching providers" },
  { key: "sold_business",       label: "Sold my business" },
  { key: "other",               label: "Other" },
];

const MOCK_STATS = {
  callsAnswered: 27,
  leadsRecovered: 14,
  inspectionsBooked: 5,
  avgResponseSeconds: 18,
  estimatedRevenue: 18750,
  roi: 6170,
  monthlyInvestment: 299,
};

const TESTIMONIALS = [
  { quote: "Roof AI recovered three inspections during our first month.", company: "ABC Roofing" },
  { quote: "The service paid for itself in the first week.", company: "XYZ Roofing" },
];

export function CancellationFlow({ onKeep, onConfirmCancel, onPause }) {
  const [step, setStep] = useState("roi");
  const [reason, setReason] = useState(null);
  const [pauseDays, setPauseDays] = useState(60);
  const [feedback, setFeedback] = useState("");

  const s = MOCK_STATS;

  // ── Step 1: ROI ─────────────────────────────────────────────────────
  if (step === "roi") {
    return (
      <div className="space-y-5">
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Before you leave…</p>
          <h2 className="text-xl font-extrabold text-ink">Here's what Roof AI accomplished</h2>
          <p className="text-sm text-muted-foreground">In the last 30 days</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatTile icon={PhoneCall}  color="brand"   label="Missed calls answered" value={s.callsAnswered} />
          <StatTile icon={TrendingUp} color="emerald" label="Qualified leads recovered" value={s.leadsRecovered} />
          <StatTile icon={Calendar}   color="violet"  label="Inspections booked"    value={s.inspectionsBooked} />
          <StatTile icon={Clock}      color="amber"   label="Avg response time"     value={`${s.avgResponseSeconds}s`} />
        </div>

        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 space-y-2">
          <div className="text-center">
            <p className="text-xs text-emerald-700 font-medium">Estimated Revenue Protected</p>
            <p className="text-3xl font-extrabold text-emerald-700">${s.estimatedRevenue.toLocaleString()}</p>
            <p className="text-xs text-emerald-600">Estimated based on booked inspections and average roofing job values.</p>
          </div>
          <div className="border-t border-emerald-200 pt-2 grid grid-cols-2 gap-2 text-center text-sm">
            <div>
              <p className="text-xs text-emerald-600">Monthly Subscription</p>
              <p className="font-bold text-emerald-800">${s.monthlyInvestment}</p>
            </div>
            <div>
              <p className="text-xs text-emerald-600">Estimated ROI</p>
              <p className="font-bold text-emerald-800">{s.roi.toLocaleString()}%</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Button className="w-full" size="lg" onClick={onKeep}>
            🟢 Keep My Account Active
          </Button>
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-red-600" onClick={() => setStep("reason")}>
            Continue Cancellation <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Step 2: Reason ──────────────────────────────────────────────────
  if (step === "reason") {
    return (
      <div className="space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-extrabold text-ink">Help Us Improve</h2>
          <p className="text-sm text-muted-foreground">What's the primary reason you're considering canceling?</p>
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

        <div className="space-y-2">
          <Button
            className="w-full"
            disabled={!reason}
            onClick={() => setStep("offer")}
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

  // ── Step 3: Personalized Offer ──────────────────────────────────────
  if (step === "offer") {
    const isExpensive   = reason === "too_expensive";
    const notEnough     = reason === "not_enough_leads";
    const seasonal      = reason === "business_slowed";
    const technical     = reason === "technical_issues";
    const switching     = reason === "switching_providers";
    const sold          = reason === "sold_business";

    return (
      <div className="space-y-5">
        {isExpensive && (
          <>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold text-ink">We understand.</h2>
              <p className="text-sm text-muted-foreground">If price is the only concern, we'd love to keep helping you.</p>
            </div>
            <OfferCard
              icon={DollarSign}
              color="emerald"
              title="Special Loyalty Offer — $249/month"
              subtitle="For the next 90 days, then back to $299/month."
              cta="Claim Discount"
              onClick={() => { window.location.href = "mailto:support@roofaileadrecovery.com?subject=Loyalty Discount Request"; }}
            />
            <OfferCard
              icon={Pause}
              color="brand"
              title="Pause your account for up to 60 days"
              subtitle="No billing. Your settings stay intact. Resume anytime."
              cta="Pause My Account"
              onClick={() => setStep("pause")}
            />
          </>
        )}

        {notEnough && (
          <>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold text-ink">Roof AI performs best with volume</h2>
              <p className="text-sm text-muted-foreground">If your lead volume is temporarily lower than normal, we recommend pausing instead of canceling.</p>
            </div>
            <OfferCard
              icon={Pause}
              color="brand"
              title="Pause your account for up to 60 days"
              subtitle="Keep your settings, AI training, call flows, and business info. Reactivate anytime with one click."
              cta="Pause My Account"
              onClick={() => setStep("pause")}
            />
          </>
        )}

        {seasonal && (
          <>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold text-ink">We understand roofing can be seasonal.</h2>
              <p className="text-sm text-muted-foreground">Pause billing for up to 90 days. No setup required when you're ready to return.</p>
            </div>
            <OfferCard
              icon={Pause}
              color="brand"
              title="Seasonal Pause — up to 90 days"
              subtitle="No billing. All your settings and workflows stay ready."
              cta="Pause My Account"
              onClick={() => setStep("pause")}
            />
          </>
        )}

        {technical && (
          <>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold text-ink">Let's fix it.</h2>
              <p className="text-sm text-muted-foreground">Schedule a complimentary 15-minute account review. We'll help optimize your setup.</p>
            </div>
            <div className="rounded-xl border border-border p-4 space-y-2">
              <p className="text-sm font-semibold text-ink">We'll review:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✓ AI responses</li>
                <li>✓ Call routing</li>
                <li>✓ Appointment booking</li>
                <li>✓ Notifications & integrations</li>
              </ul>
            </div>
            <Button className="w-full" onClick={() => { window.location.href = "mailto:support@roofaileadrecovery.com?subject=15-Minute Account Review Request"; }}>
              <LifeBuoy className="h-4 w-4" /> Schedule Free Review
            </Button>
            <OfferCard
              icon={Pause}
              color="brand"
              title="Pause instead"
              subtitle="No billing while we sort things out."
              cta="Pause My Account"
              onClick={() => setStep("pause")}
            />
          </>
        )}

        {switching && (
          <>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold text-ink">We'd love the opportunity to understand why.</h2>
              <p className="text-sm text-muted-foreground">Schedule a quick comparison review before making your final decision.</p>
            </div>
            <Button className="w-full" onClick={() => { window.location.href = "mailto:support@roofaileadrecovery.com?subject=Comparison Review Request"; }}>
              Schedule Comparison Review
            </Button>
            <OfferCard
              icon={Pause}
              color="brand"
              title="Pause for 60 days"
              subtitle="No billing. Resume anytime with one click."
              cta="Pause My Account"
              onClick={() => setStep("pause")}
            />
          </>
        )}

        {(sold || reason === "other") && (
          <>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold text-ink">We're sorry to hear that.</h2>
              <p className="text-sm text-muted-foreground">Before you go — pause instead of cancel. No billing, everything stays set up.</p>
            </div>
            <OfferCard
              icon={Pause}
              color="brand"
              title="Pause for 60 days"
              subtitle="No billing. Resume anytime with one click."
              cta="Pause My Account"
              onClick={() => setStep("pause")}
            />
          </>
        )}

        <div className="space-y-2 pt-1">
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setStep("reason")}>
            ← Back
          </Button>
          <button
            className="w-full text-center text-xs text-muted-foreground hover:text-red-600 underline underline-offset-2 transition-colors"
            onClick={() => setStep("social")}
          >
            Continue to cancel →
          </button>
        </div>
      </div>
    );
  }

  // ── Step 4: Pause selector ──────────────────────────────────────────
  if (step === "pause") {
    return (
      <div className="space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-extrabold text-ink">Pause Instead of Cancel</h2>
          <p className="text-sm text-muted-foreground">Many roofing companies experience seasonal slowdowns. Choose your pause duration.</p>
        </div>

        <div className="space-y-2">
          {[30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setPauseDays(d)}
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all",
                pauseDays === d
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-border bg-white text-ink hover:border-brand-300"
              )}
            >
              {d} Days
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-1">
          <p className="text-xs font-semibold text-ink">While paused, we'll retain:</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>✓ AI settings & training</li>
            <li>✓ Business information</li>
            <li>✓ Call flows & FAQs</li>
            <li>✓ Scheduling preferences</li>
          </ul>
          <p className="text-xs text-muted-foreground pt-1">No setup required when you return.</p>
        </div>

        <Button className="w-full" onClick={() => onPause(pauseDays)}>
          <Pause className="h-4 w-4" /> Pause for {pauseDays} Days
        </Button>
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setStep("offer")}>
          ← Back
        </Button>
        <button
          className="w-full text-center text-xs text-muted-foreground hover:text-red-600 underline underline-offset-2 transition-colors"
          onClick={() => setStep("social")}
        >
          Continue to cancel →
        </button>
      </div>
    );
  }

  // ── Step 5: Social Proof ────────────────────────────────────────────
  if (step === "social") {
    return (
      <div className="space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-extrabold text-ink">What other roofers are saying</h2>
          <p className="text-sm text-muted-foreground">Before your cancellation is finalized</p>
        </div>

        <div className="space-y-3">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="rounded-xl border border-border bg-white p-4 space-y-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-ink italic">"{t.quote}"</p>
              <p className="text-xs font-semibold text-muted-foreground">— {t.company}</p>
            </div>
          ))}
        </div>

        <Button className="w-full" onClick={onKeep}>
          Keep My Account Active
        </Button>
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setStep("offer")}>
          ← Back
        </Button>
        <button
          className="w-full text-center text-xs text-muted-foreground hover:text-red-600 underline underline-offset-2 transition-colors"
          onClick={() => setStep("founder")}
        >
          Still want to cancel →
        </button>
      </div>
    );
  }

  // ── Step 6: Founder Review ──────────────────────────────────────────
  if (step === "founder") {
    return (
      <div className="space-y-5">
        <div className="text-center space-y-2">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 mx-auto">
            <User className="h-6 w-6 text-brand-600" />
          </span>
          <h2 className="text-xl font-extrabold text-ink">Before You Cancel...</h2>
          <p className="text-sm text-muted-foreground">Would you like a complimentary 15-minute strategy review with our founder?</p>
        </div>

        <div className="rounded-xl border border-border p-4 space-y-2">
          <p className="text-sm font-semibold text-ink">We'll review:</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>✓ Missed calls & lead recovery</li>
            <li>✓ AI performance</li>
            <li>✓ Missed opportunities</li>
          </ul>
          <p className="text-xs text-muted-foreground pt-1">No obligation. Sometimes a few small adjustments can dramatically improve results.</p>
        </div>

        <Button className="w-full" onClick={() => { window.location.href = "mailto:support@roofaileadrecovery.com?subject=Founder Strategy Review Request"; }}>
          Schedule Free 15-Min Review
        </Button>
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setStep("social")}>
          ← Back
        </Button>
        <button
          className="w-full text-center text-xs text-muted-foreground hover:text-red-600 underline underline-offset-2 transition-colors"
          onClick={() => setStep("final")}
        >
          No thanks, proceed to cancel →
        </button>
      </div>
    );
  }

  // ── Step 7: Final Feedback ──────────────────────────────────────────
  if (step === "final") {
    return (
      <div className="space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-extrabold text-ink">We're sorry to see you go.</h2>
          <p className="text-sm text-muted-foreground">One last question — what could we have done better?</p>
        </div>

        <textarea
          rows={4}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Your feedback helps us improve..."
          className="flex w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1"
        />

        <Button
          className="w-full bg-red-600 hover:bg-red-700"
          onClick={onConfirmCancel}
        >
          Confirm Cancellation
        </Button>
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setStep("founder")}>
          ← Back
        </Button>
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
