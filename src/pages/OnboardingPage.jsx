import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const SMITH_CALENDLY = "https://calendly.com/smith-ai-client-success/account-check-in-with-tony";
import { useForm, useFieldArray } from "react-hook-form";
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  Wrench,
  PhoneForwarded,
  Clock,
  CheckCircle2,
  X,
  CalendarDays,
  Users,
  Plus,
  Trash2,
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
import {
  Select,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { PhoneField } from "@/components/ui/phone-field";
import { ProgressStepper } from "@/components/onboarding/ProgressStepper";
import {
  PHONE_PROVIDER_GROUPS,
  PHONE_PROVIDER_OTHER,
} from "@/config/phoneProviders";
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
    hint: "Book the estimate on your calendar. Our team sets this up for you.",
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
  {
    title: "Business Information",
    icon: Building2,
    fields: [
      "company_name",
      "address",
      "business_phone",
      "phone_provider",
      "contact_name",
      "contact_email",
    ],
  },
  { title: "Service Details", icon: Wrench, fields: ["service_areas", "services"] },
  { title: "Call Handling", icon: PhoneForwarded, fields: ["conversion_preference"] },
  // The employee directory Smith.ai builds the AI receptionist's transfer tree
  // from: who's on the team, the line each one is reached on, and which
  // addresses get the call summaries.
  { title: "Your Team", icon: Users, fields: ["employees", "summary_emails"] },
  { title: "Hours of Operation", icon: Clock, fields: ["business_hours", "after_hours_preference"] },
];
const STEP_LABELS = STEPS.map((s) => s.title);
const TOTAL_STEPS = STEPS.length;

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

// "a@x.com, b@y.com" -> ["a@x.com", "b@y.com"]. Also splits on newlines and
// semicolons so a pasted list works however it was formatted.
const parseEmailList = (raw) =>
  (raw || "")
    .split(/[,;\n]/)
    .map((e) => e.trim())
    .filter(Boolean);

// Drop rows the user left completely blank (the directory always renders at
// least one empty row) and trim what's left before it hits jsonb.
const serializeEmployees = (rows) =>
  (rows || [])
    .map((r) => ({
      name: (r?.name || "").trim(),
      transfer_line: (r?.transfer_line || "").trim(),
      email: (r?.email || "").trim(),
    }))
    .filter((r) => r.name || r.transfer_line || r.email);

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [submitting, setSubmitting] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(1); // 1..TOTAL_STEPS
  const [showCalendly, setShowCalendly] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    trigger,
    formState: { errors },
  } = useForm({
    defaultValues: {
      conversion_preference: "scheduled_appointment",
      // One blank row so the directory renders an editable line immediately
      // instead of an empty box the user has to discover an "Add" button for.
      employees: [{ name: "", transfer_line: "", email: "" }],
      summary_emails: "",
    },
    mode: "onTouched",
  });

  const conversion = watch("conversion_preference");
  const phoneProvider = watch("phone_provider");

  // Employee directory rows (name / transfer line / email), stored as a jsonb
  // array on roofing_companies.
  const {
    fields: employeeFields,
    append: appendEmployee,
    remove: removeEmployee,
  } = useFieldArray({ control, name: "employees" });

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

  // The provider <Select> is controlled through setValue, so register it here to
  // keep RHF validating it as part of step 1.
  register("phone_provider", { required: "Select your phone provider" });

  // Per-user keys so two accounts on the same browser don't collide.
  const draftKey = user ? `onboarding_draft_${user.id}` : null;
  const stepKey = user ? `onboarding_step_${user.id}` : null;

  // The fields to validate for a given step, including the conversion-goal's
  // conditional field (scheduling link / transfer number).
  const fieldsForStep = (n) => {
    const base = [...STEPS[n - 1].fields];
    if (n === 1 && phoneProvider === PHONE_PROVIDER_OTHER) base.push("phone_provider_other");
    if (n === 3) {
      // calendly_link removed — Smith.ai handles scheduling via their own link.
      // Only warm_transfer needs an extra field (the number to transfer to).
      if (conversion === "warm_transfer") base.push("transfer_number");
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
          "company_name, address, business_phone, phone_country, phone_provider, phone_provider_other, contact_name, contact_email, service_areas, services, conversion_preference, calendly_link, transfer_number, employees, summary_emails, business_hours, after_hours_preference"
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

      // The DB stores employees as jsonb[] and summary_emails as text[]; the
      // form wants an always-non-empty row array and a comma-separated string.
      merged.employees =
        Array.isArray(merged.employees) && merged.employees.length
          ? merged.employees.map((e) => ({
              name: e?.name ?? "",
              transfer_line: e?.transfer_line ?? "",
              email: e?.email ?? "",
            }))
          : [{ name: "", transfer_line: "", email: "" }];
      merged.summary_emails = Array.isArray(merged.summary_emails)
        ? merged.summary_emails.join(", ")
        : merged.summary_emails || "";

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
        phone_provider: values.phone_provider || null,
        // Only meaningful for the "Other" choice — cleared otherwise so a stale
        // free-text value can't contradict a later concrete selection.
        phone_provider_other:
          values.phone_provider === PHONE_PROVIDER_OTHER
            ? values.phone_provider_other || null
            : null,
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
        employees: serializeEmployees(values.employees),
        summary_emails: parseEmailList(values.summary_emails),
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
    toast.success("Details saved! Schedule your onboarding call to get started.");
    // Show the Calendly scheduling modal. Closing it takes the user to /dashboard.
    setShowCalendly(true);
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Calendly scheduling modal — shown after form submit. Closing goes to dashboard. */}
      {showCalendly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50">
                  <CalendarDays className="h-5 w-5 text-brand-600" />
                </span>
                <div>
                  <p className="font-bold text-ink">Schedule your onboarding call</p>
                  <p className="text-xs text-muted-foreground">
                    Our Smith.ai team will walk you through everything
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowCalendly(false); navigate("/dashboard", { replace: true }); }}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
                aria-label="Skip for now"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Body */}
            <div className="space-y-4 p-6">
              <p className="text-sm text-muted-foreground">
                Pick a time that works for you. This call lets our team collect the details
                needed to configure your AI receptionist quickly.
              </p>
              <a
                href={SMITH_CALENDLY}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-base font-semibold text-white shadow hover:bg-brand-700 transition-colors"
              >
                <CalendarDays className="h-5 w-5" />
                Open Calendly to schedule
              </a>
              <button
                onClick={() => { setShowCalendly(false); navigate("/dashboard", { replace: true }); }}
                className="w-full text-center text-sm text-muted-foreground underline-offset-2 hover:underline"
              >
                Skip for now — I'll schedule later from the dashboard
              </button>
            </div>
          </div>
        </div>
      )}

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

            {/* Who carries the business line. Smith.ai's forwarding setup differs
                per provider, so this is required before the build can start. */}
            <div className="space-y-1.5">
              <Label htmlFor="phone_provider">Phone provider</Label>
              <Select
                value={phoneProvider || ""}
                onValueChange={(v) =>
                  setValue("phone_provider", v, { shouldValidate: true, shouldDirty: true })
                }
              >
                <SelectTrigger id="phone_provider">
                  <SelectValue placeholder="Select your phone or VoIP provider" />
                </SelectTrigger>
                <SelectContent>
                  {PHONE_PROVIDER_GROUPS.map((group) => (
                    <SelectGroup key={group.label}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.options.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                  <SelectGroup>
                    <SelectItem value={PHONE_PROVIDER_OTHER}>
                      Other (not listed)
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {!errors.phone_provider && (
                <p className="text-xs text-muted-foreground">
                  Who your business line is with. We use this to set up call forwarding.
                </p>
              )}
              {errors.phone_provider && (
                <p className="text-xs text-destructive">{errors.phone_provider.message}</p>
              )}
            </div>

            {phoneProvider === PHONE_PROVIDER_OTHER && (
              <Field
                label="Provider name"
                name="phone_provider_other"
                placeholder="e.g. Local Telecom Co."
                register={register}
                rules={{ required: "Tell us who your provider is" }}
                error={errors.phone_provider_other}
              />
            )}

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
              <p className="rounded-lg border border-dashed border-brand-200 bg-brand-50 px-3.5 py-3 text-sm text-brand-700">
                Our Smith.ai team will use your business details to set up appointment scheduling
                on your behalf — no link needed from you.
              </p>
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

          {/* ---- Step 4: Your Team (employee transfer directory) ---- */}
          <div className={step === 4 ? "" : "hidden"}>
          <Section icon={Users} title="Your Team">
            <div className="space-y-3">
              <div>
                <Label>Employee directory</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Who callers can be transferred to. Add a line for each person — the
                  AI receptionist uses this as its transfer directory.
                </p>
              </div>

              {employeeFields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border border-border bg-secondary/30 p-3.5"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Employee {index + 1}
                    </span>
                    {employeeFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEmployee(index)}
                        className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-white hover:text-destructive"
                        aria-label={`Remove employee ${index + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={`employees.${index}.name`} className="text-xs">
                        Name
                      </Label>
                      <Input
                        id={`employees.${index}.name`}
                        placeholder="Jane Doe"
                        {...register(`employees.${index}.name`, {
                          // Required only once the row has any other content —
                          // a fully blank row is dropped on submit.
                          validate: (v, all) => {
                            const row = all.employees?.[index] || {};
                            const touched = row.transfer_line || row.email;
                            if (touched && !(v || "").trim()) return "Name is required";
                            return true;
                          },
                        })}
                      />
                      {errors.employees?.[index]?.name && (
                        <p className="text-xs text-destructive">
                          {errors.employees[index].name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor={`employees.${index}.transfer_line`} className="text-xs">
                        Transfer line
                      </Label>
                      <Input
                        id={`employees.${index}.transfer_line`}
                        type="tel"
                        placeholder="(555) 123-4567"
                        {...register(`employees.${index}.transfer_line`)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor={`employees.${index}.email`} className="text-xs">
                        Email
                      </Label>
                      <Input
                        id={`employees.${index}.email`}
                        type="email"
                        placeholder="jane@apexroofing.com"
                        {...register(`employees.${index}.email`, {
                          validate: (v) =>
                            !(v || "").trim() || EMAIL_RE.test(v.trim())
                              ? true
                              : "Enter a valid email",
                        })}
                      />
                      {errors.employees?.[index]?.email && (
                        <p className="text-xs text-destructive">
                          {errors.employees[index].email.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => appendEmployee({ name: "", transfer_line: "", email: "" })}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3.5 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50"
              >
                <Plus className="h-4 w-4" />
                Add another employee
              </button>
            </div>

            <TextAreaField
              label="Summary email recipients"
              name="summary_emails"
              rows={2}
              placeholder="owner@apexroofing.com, office@apexroofing.com"
              register={register}
              rules={{
                required: "At least one summary email is required",
                validate: (v) => {
                  const list = parseEmailList(v);
                  if (!list.length) return "At least one summary email is required";
                  const bad = list.find((e) => !EMAIL_RE.test(e));
                  return bad ? `"${bad}" is not a valid email` : true;
                },
              }}
              error={errors.summary_emails}
              hint="Comma-separated. These addresses receive the call summaries."
            />
          </Section>
          </div>

          {/* ---- Step 5: Hours of Operation ---- */}
          <div className={step === 5 ? "" : "hidden"}>
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

function TextAreaField({ label, name, rows = 2, placeholder, hint, register, rules, error }) {
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
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}
