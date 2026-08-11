import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  Wrench,
  PhoneForwarded,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { pickActiveSubscription } from "@/lib/subscription";
import { Logo } from "@/components/Logo";
import { AccountMenu } from "@/components/AccountMenu";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PhoneField } from "@/components/ui/phone-field";
import { ProgressStepper } from "@/components/onboarding/ProgressStepper";
import { isValidPhoneNumber } from "react-phone-number-input";
import { cn } from "@/lib/utils";

// Step 3 of the new flow: after payment, the customer fills in their full
// business details. This writes (or updates) their roofing_companies row, flags
// details_submitted = true, and hands off to the dashboard. From here the
// technical team (n8n) takes over and the admin drives status.
const CONVERSION_OPTIONS = [
  {
    value: "scheduled_appointment",
    label: "Schedule appointment",
    hint: "Book the estimate on your calendar. Requires a scheduling link.",
  },
  {
    value: "warm_transfer",
    label: "Warm transfer",
    hint: "Connect the caller to your team live. Requires a transfer number.",
  },
  {
    value: "take_message",
    label: "Take a message",
    hint: "We capture the details and email them to your contact.",
  },
];

// Wizard steps. `fields` drives per-step validation (trigger before advancing);
// the conversion-goal conditional field is added dynamically in fieldsForStep().
const STEPS = [
  { title: "Business Information", icon: Building2, fields: ["company_name", "address", "business_phone", "contact_name", "contact_email"] },
  { title: "Service Details", icon: Wrench, fields: ["service_areas", "services"] },
  { title: "Call Handling", icon: PhoneForwarded, fields: ["conversion_preference"] },
  { title: "Hours of Operation", icon: Clock, fields: ["business_hours", "after_hours_preference"] },
];
const STEP_LABELS = STEPS.map((s) => s.title);
const TOTAL_STEPS = STEPS.length;

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [submitting, setSubmitting] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(1); // 1..TOTAL_STEPS

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    trigger,
    formState: { errors },
  } = useForm({ defaultValues: { conversion_preference: "scheduled_appointment" }, mode: "onTouched" });

  const conversion = watch("conversion_preference");

  // The phone + country are controlled by <PhoneField> via setValue, but we
  // register them so RHF tracks/validates them (trigger works in step 1) and
  // the E.164 value is validated with the library's own validator.
  register("business_phone", {
    validate: (v) =>
      !v
        ? "Business phone is required"
        : isValidPhoneNumber(v) || "Enter a valid phone number",
  });
  register("phone_country");

  // Per-user keys so two accounts on the same browser don't collide.
  const draftKey = user ? `onboarding_draft_${user.id}` : null;
  const stepKey = user ? `onboarding_step_${user.id}` : null;

  // The fields to validate for a given step, including the conversion-goal's
  // conditional field (scheduling link / transfer number).
  const fieldsForStep = (n) => {
    const base = [...STEPS[n - 1].fields];
    if (n === 3) {
      if (conversion === "scheduled_appointment") base.push("calendly_link");
      else if (conversion === "warm_transfer") base.push("transfer_number");
    }
    return base;
  };

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      toast.success("Payment successful — one quick step to go!");
      window.history.replaceState({}, "", "/onboarding");
    }
  }, [searchParams]);

  // Load the real subscription so the "payment complete" banner reflects the
  // actual paid state — not just the transient ?payment=success URL param
  // (which is gone after a reload).
  useEffect(() => {
    if (!user) return;
    supabase
      .from("subscriptions")
      .select("status, trial_ends_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setSubscription(pickActiveSubscription(data)));
  }, [user]);

  // Hydrate the form so a refresh doesn't wipe what the user typed. Priority:
  //   1. A local draft (in-progress typing, saved every change to localStorage)
  //   2. The saved roofing_companies row (if they submitted/partially saved)
  //   3. Defaults
  // Draft wins because it's the freshest reflection of their current session.
  useEffect(() => {
    if (!user || !draftKey) return;
    let cancelled = false;

    (async () => {
      const { data: row } = await supabase
        .from("roofing_companies")
        .select(
          "company_name, address, business_phone, phone_country, contact_name, contact_email, service_areas, services, conversion_preference, calendly_link, transfer_number, business_hours, after_hours_preference"
        )
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;

      let draft = null;
      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) draft = JSON.parse(raw);
      } catch {
        draft = null;
      }

      const merged = { conversion_preference: "scheduled_appointment" };
      if (row) Object.assign(merged, row);
      if (draft) Object.assign(merged, draft);
      reset(merged);

      // Restore the step the user was on before the refresh.
      try {
        const savedStep = Number.parseInt(localStorage.getItem(stepKey) ?? "1", 10);
        if (savedStep >= 1 && savedStep <= TOTAL_STEPS) setStep(savedStep);
      } catch {
        /* ignore */
      }

      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, draftKey, stepKey, reset]);

  // Persist the current step so a refresh returns the user to where they were.
  useEffect(() => {
    if (!hydrated || !stepKey) return;
    try {
      localStorage.setItem(stepKey, String(step));
    } catch {
      /* non-fatal */
    }
  }, [step, hydrated, stepKey]);

  // Autosave every change to localStorage once hydrated. Cheap, synchronous,
  // survives reloads with zero network. Cleared on successful submit.
  useEffect(() => {
    if (!hydrated || !draftKey) return;
    const sub = watch((values) => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(values));
      } catch {
        /* storage full / disabled — non-fatal, just no draft persistence */
      }
    });
    return () => sub.unsubscribe();
  }, [hydrated, draftKey, watch]);

  const paid = ["active", "trialing"].includes(subscription?.status);
  const trialEnds = subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  let paymentDetail;
  if (subscription?.status === "trialing") {
    paymentDetail = trialEnds
      ? `Your 7-day free trial is active — you won't be charged until ${trialEnds}.`
      : "Your 7-day free trial is active — no charge yet.";
  } else {
    paymentDetail = "Your subscription is active.";
  }

  // Advance only if the current step's fields validate. Back is always free.
  const goNext = async () => {
    const ok = await trigger(fieldsForStep(step));
    if (!ok) return;
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const onSubmit = async (values) => {
    if (!user) return;
    // Guard against Enter-key submits on non-final steps: advance instead.
    if (step < TOTAL_STEPS) {
      goNext();
      return;
    }
    setSubmitting(true);

    // Upsert the company row keyed by user_id (unique). Works whether or not a
    // row already exists for this user. Conditional fields (calendly_link /
    // transfer_number) only persist for the relevant conversion goal.
    const { error } = await supabase.from("roofing_companies").upsert(
      {
        user_id: user.id,
        company_name: values.company_name,
        address: values.address,
        business_phone: values.business_phone,
        phone_country: values.phone_country || null,
        contact_name: values.contact_name,
        contact_email: values.contact_email,
        service_areas: values.service_areas,
        services: values.services,
        conversion_preference: values.conversion_preference,
        calendly_link:
          values.conversion_preference === "scheduled_appointment"
            ? values.calendly_link || null
            : null,
        transfer_number:
          values.conversion_preference === "warm_transfer"
            ? values.transfer_number || null
            : null,
        business_hours: values.business_hours,
        after_hours_preference: values.after_hours_preference,
        details_submitted: true,
        status: "new",
        setup_step: 2,
      },
      { onConflict: "user_id" }
    );

    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Details are now saved server-side — drop the local draft + step marker.
    try {
      if (draftKey) localStorage.removeItem(draftKey);
      if (stepKey) localStorage.removeItem(stepKey);
    } catch {
      /* non-fatal */
    }
    await refreshProfile();
    toast.success("Thanks! Our team is taking it from here.");
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-white">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" aria-label="Roof AI Lead Recovery home">
            <Logo />
          </Link>
          <AccountMenu />
        </div>
      </header>

      <main className="container max-w-2xl py-10">
        {/* Persistent payment-complete banner — reflects the real subscription,
            so it survives reloads (unlike the transient success toast). */}
        {paid && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </span>
            <div>
              <p className="font-semibold text-emerald-800">
                Payment complete — you're subscribed 🎉
              </p>
              <p className="text-sm text-emerald-700">
                {paymentDetail} Just one last step below and our team takes over.
              </p>
            </div>
          </div>
        )}

        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
            <Building2 className="h-6 w-6 text-brand-600" />
          </span>
          <h1 className="text-2xl font-extrabold text-ink">Tell us about your business</h1>
          <p className="mt-1.5 text-muted-foreground">
            Our team uses this to set up your AI lead recovery. Takes a couple of minutes.
          </p>
        </div>

        {/* Wizard progress */}
        <div className="mb-5">
          <ProgressStepper current={step} total={TOTAL_STEPS} labels={STEP_LABELS} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* All steps stay MOUNTED (hidden when inactive) so react-hook-form
              keeps every field's value + validation ref — that's what makes
              going back to a prior step show what was already entered. */}

          {/* ---- Step 1: Business Information ---- */}
          <div className={step === 1 ? "" : "hidden"}>
          <Section icon={Building2} title="Business Information">
            <Field
              label="Business name"
              name="company_name"
              placeholder="Apex Roofing"
              register={register}
              rules={{ required: "Business name is required" }}
              error={errors.company_name}
            />
            <Field
              label="Business address"
              name="address"
              placeholder="123 Main St, Charlotte, NC 28202"
              register={register}
              rules={{ required: "Business address is required" }}
              error={errors.address}
            />
            <PhoneField
              label="Business phone number"
              id="business_phone"
              value={watch("business_phone") || ""}
              onChange={(v) =>
                setValue("business_phone", v, { shouldValidate: true, shouldDirty: true })
              }
              onCountryChange={(c) => setValue("phone_country", c || null)}
              defaultCountry={watch("phone_country") || "US"}
              hint="This will forward to Smith.ai."
              error={errors.business_phone?.message}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Primary contact name"
                name="contact_name"
                placeholder="John Smith"
                register={register}
                rules={{ required: "Contact name is required" }}
                error={errors.contact_name}
              />
              <Field
                label="Primary contact email"
                name="contact_email"
                type="email"
                placeholder="john@apexroofing.com"
                register={register}
                rules={{
                  required: "Contact email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/,
                    message: "Enter a valid email",
                  },
                }}
                error={errors.contact_email}
              />
            </div>
          </Section>
          </div>

          {/* ---- Step 2: Service Details ---- */}
          <div className={step === 2 ? "" : "hidden"}>
          <Section icon={Wrench} title="Service Details">
            <TextAreaField
              label="Service area"
              name="service_areas"
              rows={2}
              placeholder="Counties or ZIP codes you cover — e.g. Mecklenburg County, 28202, 28204"
              register={register}
              rules={{ required: "Service area is required" }}
              error={errors.service_areas}
            />
            <TextAreaField
              label="Services offered"
              name="services"
              rows={2}
              placeholder="Be specific — e.g. residential roofing, commercial roofing, gutter installation, repairs"
              register={register}
              rules={{ required: "Services offered is required" }}
              error={errors.services}
            />
          </Section>
          </div>

          {/* ---- Step 3: Call Handling Preferences ---- */}
          <div className={step === 3 ? "" : "hidden"}>
          <Section icon={PhoneForwarded} title="Call Handling Preferences">
            <div className="space-y-2">
              <Label>Conversion goal — choose one</Label>
              <RadioGroup
                value={conversion}
                onValueChange={(v) => setValue("conversion_preference", v)}
                className="space-y-2"
              >
                {CONVERSION_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 text-sm transition-colors",
                      conversion === opt.value
                        ? "border-brand-600 bg-brand-50"
                        : "border-border hover:bg-secondary"
                    )}
                  >
                    <RadioGroupItem value={opt.value} className="mt-0.5" />
                    <span>
                      <span className="font-medium text-ink">{opt.label}</span>
                      <span className="block text-xs text-muted-foreground">{opt.hint}</span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Conditional input based on the chosen conversion goal. */}
            {conversion === "scheduled_appointment" && (
              <Field
                label="Scheduling link (Calendly or your system)"
                name="calendly_link"
                placeholder="https://calendly.com/your-company"
                register={register}
                rules={{ required: "A scheduling link is required for this option" }}
                error={errors.calendly_link}
              />
            )}
            {conversion === "warm_transfer" && (
              <Field
                label="Transfer number"
                name="transfer_number"
                type="tel"
                placeholder="(555) 987-6543"
                register={register}
                rules={{ required: "A transfer number is required for this option" }}
                error={errors.transfer_number}
              />
            )}
            {conversion === "take_message" && (
              <p className="rounded-lg border border-dashed border-border bg-secondary/40 px-3.5 py-3 text-sm text-muted-foreground">
                We'll email the caller's details to your primary contact — nothing else needed here.
              </p>
            )}
          </Section>
          </div>

          {/* ---- Step 4: Hours of Operation ---- */}
          <div className={step === 4 ? "" : "hidden"}>
          <Section icon={Clock} title="Hours of Operation">
            <TextAreaField
              label="Business hours (when calls should be handled live)"
              name="business_hours"
              rows={2}
              placeholder="e.g. Mon–Fri 8am–6pm, Sat 9am–1pm ET"
              register={register}
              rules={{ required: "Business hours are required" }}
              error={errors.business_hours}
            />
            <TextAreaField
              label="After-hours preferences"
              name="after_hours_preference"
              rows={2}
              placeholder="e.g. Send to voicemail, or route emergencies to (555) 000-0000"
              register={register}
              rules={{ required: "After-hours preference is required" }}
              error={errors.after_hours_preference}
            />
          </Section>
          </div>

          {/* Wizard navigation */}
          <div className="flex items-center justify-between gap-3">
            {step > 1 ? (
              <Button type="button" variant="secondary" onClick={goBack} disabled={submitting}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <span />
            )}

            {step < TOTAL_STEPS ? (
              <Button type="button" onClick={goNext}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={submitting} className="min-w-40">
                {submitting ? (
                  <Spinner className="text-white" />
                ) : (
                  <>
                    Finish setup <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
            <Icon className="h-4 w-4 text-brand-600" />
          </span>
          <h2 className="font-bold text-ink">{title}</h2>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function Field({ label, name, type = "text", placeholder, hint, register, rules, error }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type={type} placeholder={placeholder} {...register(name, rules)} />
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}

function TextAreaField({ label, name, rows = 2, placeholder, register, rules, error }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        className="flex w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1"
        {...register(name, rules)}
      />
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}
