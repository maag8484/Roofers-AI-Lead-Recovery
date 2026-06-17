import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, ArrowRight, ArrowLeft, CreditCard, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase, invokeFunction } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Stepper } from "@/components/Stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const STEPS = [
  { label: "Account" },
  { label: "Business" },
  { label: "Payment" },
];

const LEAD_SEGMENTS = [
  { value: "under_10", label: "Under 10" },
  { value: "10_25", label: "10–25" },
  { value: "25_50", label: "25–50" },
  { value: "50_plus", label: "50+" },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState({});

  const accountForm = useForm({ defaultValues: data });
  const businessForm = useForm({ defaultValues: data });

  // Step 1: create the auth account.
  const submitAccount = async (values) => {
    setSubmitting(true);
    const { error } = await signUp(values.email, values.password, {
      full_name: values.owner_name,
      phone: values.phone,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message || "Could not create account.");
      return;
    }
    setData((d) => ({ ...d, ...values }));
    setStep(2);
  };

  // Step 2: persist company info, then move to payment.
  const submitBusiness = async (values) => {
    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Session expired. Please sign in again.");
      setSubmitting(false);
      navigate("/login");
      return;
    }
    const { error } = await supabase.from("roofing_companies").upsert(
      {
        user_id: user.id,
        company_name: data.company_name,
        business_phone: values.business_phone,
        service_area: values.service_area,
        website: values.website,
        monthly_leads_segment: values.monthly_leads_segment,
        setup_step: 2,
      },
      { onConflict: "user_id" }
    );
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setData((d) => ({ ...d, ...values }));
    setStep(3);
  };

  // Step 3: kick off Stripe Checkout via edge function.
  const startCheckout = async (trial) => {
    setSubmitting(true);
    try {
      const res = await invokeFunction("stripe-create-checkout", {
        trial_type: trial, // 'free_7' | 'dollar_7'
        success_url: `${window.location.origin}/setup/twilio`,
        cancel_url: `${window.location.origin}/signup`,
      });
      if (res?.url) {
        window.location.href = res.url;
      } else {
        throw new Error("No checkout URL returned.");
      }
    } catch (err) {
      // Edge function not deployed yet — let the user continue setup in dev.
      console.error(err);
      toast.message("Stripe not configured yet — continuing to setup.", {
        description: "Deploy the stripe-create-checkout function to enable billing.",
      });
      navigate("/setup/twilio");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      wide
      footer={
        step === 1 ? (
          <>
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-brand-600 hover:underline">
              Sign In
            </Link>
          </>
        ) : null
      }
    >
      <div className="mb-7">
        <Stepper steps={STEPS} current={step} />
      </div>

      {step === 1 && (
        <form onSubmit={accountForm.handleSubmit(submitAccount)} className="space-y-4">
          <h2 className="text-lg font-bold text-ink">Create your account</h2>
          <Field
            form={accountForm}
            name="company_name"
            label="Company Name"
            placeholder="Apex Roofing"
            rules={{ required: "Company name is required" }}
          />
          <Field
            form={accountForm}
            name="owner_name"
            label="Owner Name"
            placeholder="John Smith"
            rules={{ required: "Owner name is required" }}
          />
          <Field
            form={accountForm}
            name="email"
            label="Email"
            type="email"
            placeholder="you@company.com"
            rules={{ required: "Email is required" }}
          />
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                placeholder="At least 8 characters"
                {...accountForm.register("password", {
                  required: "Password is required",
                  minLength: { value: 8, message: "Use at least 8 characters" },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {accountForm.formState.errors.password && (
              <p className="text-xs text-destructive">
                {accountForm.formState.errors.password.message}
              </p>
            )}
          </div>
          <Field
            form={accountForm}
            name="phone"
            label="Phone"
            type="tel"
            placeholder="(555) 123-4567"
            rules={{ required: "Phone is required" }}
          />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Spinner className="text-white" /> : (<>Continue Setup <ArrowRight /></>)}
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={businessForm.handleSubmit(submitBusiness)} className="space-y-4">
          <h2 className="text-lg font-bold text-ink">Tell us about your business</h2>
          <Field
            form={businessForm}
            name="business_phone"
            label="Business Phone"
            type="tel"
            placeholder="(555) 123-4567"
            rules={{ required: "Business phone is required" }}
          />
          <Field
            form={businessForm}
            name="service_area"
            label="Service Area"
            placeholder="Charlotte, NC"
            rules={{ required: "Service area is required" }}
          />
          <Field
            form={businessForm}
            name="website"
            label="Website (optional)"
            placeholder="https://apexroofing.com"
          />
          <div className="space-y-2">
            <Label>How many leads do you get monthly?</Label>
            <RadioGroup
              onValueChange={(v) => businessForm.setValue("monthly_leads_segment", v)}
              defaultValue={data.monthly_leads_segment}
              className="grid grid-cols-2 gap-2"
            >
              {LEAD_SEGMENTS.map((seg) => (
                <label
                  key={seg.value}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3.5 py-2.5 text-sm hover:bg-secondary has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50"
                >
                  <RadioGroupItem value={seg.value} /> {seg.label}
                </label>
              ))}
            </RadioGroup>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              <ArrowLeft /> Back
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? <Spinner className="text-white" /> : (<>Continue <ArrowRight /></>)}
            </Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div className="text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
              <CreditCard className="h-6 w-6 text-brand-600" />
            </span>
            <h2 className="text-lg font-bold text-ink">Start your free trial</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              $299/month after trial · Cancel anytime · No setup fees
            </p>
          </div>

          <div className="rounded-xl border border-border bg-secondary/40 p-4">
            <p className="mb-2 text-sm font-semibold text-ink">Everything included:</p>
            <ul className="grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
              {["AI Lead Follow-Up", "Missed Call Recovery", "Appointment Booking", "Dashboard Access", "Email & SMS Support", "Google Calendar"].map((f) => (
                <li key={f} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-500" /> {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="secondary" onClick={() => startCheckout("free_7")} disabled={submitting}>
              7-day free trial
            </Button>
            <Button onClick={() => startCheckout("dollar_7")} disabled={submitting}>
              {submitting ? <Spinner className="text-white" /> : "$1 for 7 days"}
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            You'll be redirected to Stripe to complete payment securely.
          </p>
        </div>
      )}
    </AuthLayout>
  );
}

/** Small wrapper around an RHF-registered input with inline error. */
function Field({ form, name, label, type = "text", placeholder, rules }) {
  const {
    register,
    formState: { errors },
  } = form;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type={type} placeholder={placeholder} {...register(name, rules)} />
      {errors[name] && <p className="text-xs text-destructive">{errors[name].message}</p>}
    </div>
  );
}
