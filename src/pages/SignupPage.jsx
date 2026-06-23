import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, ArrowRight, ArrowLeft, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Stepper } from "@/components/Stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const STEPS = [{ label: "Account" }, { label: "Business" }];

const LEAD_SEGMENTS = [
  { value: "under_10", label: "Under 10" },
  { value: "10_25", label: "10–25" },
  { value: "25_50", label: "25–50" },
  { value: "50_plus", label: "50+" },
];

export default function SignupPage() {
  const { signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState({});
  const [confirmEmail, setConfirmEmail] = useState(null); // set => show "check your email"

  const accountForm = useForm({ defaultValues: data });
  const businessForm = useForm({ defaultValues: data });

  // Step 1: validate account fields locally (no network), then advance.
  const submitAccount = (values) => {
    setData((d) => ({ ...d, ...values }));
    setStep(2);
  };

  // Step 2: create the account with ALL details in the signUp metadata.
  // Because email confirmation is ON, signUp returns a user but NO session —
  // so we cannot write to the DB yet. The roofing_companies row is created on
  // first authenticated load (see ensureCompany in DashboardPage) from this
  // same metadata. This keeps the whole signup pre-confirmation network-free
  // except for the one signUp call.
  const submitBusiness = async (values) => {
    setSubmitting(true);
    const all = { ...data, ...values };
    const { data: result, error } = await signUp(all.email, all.password, {
      full_name: all.owner_name,
      phone: all.phone,
      company_name: all.company_name,
      business_phone: all.business_phone,
      service_area: all.service_area,
      website: all.website || null,
      monthly_leads_segment: all.monthly_leads_segment || null,
    });
    setSubmitting(false);

    if (error) {
      // Surface the real Supabase reason (e.g. invalid email, weak password,
      // user already registered) instead of a generic message.
      toast.error(error.message || "Could not create account.");
      return;
    }

    // If confirmation is required, there is a user but no session.
    if (result?.user && !result?.session) {
      setConfirmEmail(all.email);
      return;
    }

    // If confirmation is OFF (instant session), the dashboard will pick it up.
    if (result?.session) {
      window.location.href = "/dashboard";
    }
  };

  const resend = async () => {
    if (!confirmEmail) return;
    const { error } = await supabase.auth.resend({ type: "signup", email: confirmEmail });
    if (error) toast.error(error.message);
    else toast.success("Confirmation email re-sent.");
  };

  // ---- Confirmation screen ----
  if (confirmEmail) {
    return (
      <AuthLayout
        footer={
          <>
            Wrong email?{" "}
            <button
              onClick={() => {
                setConfirmEmail(null);
                setStep(1);
              }}
              className="font-semibold text-brand-600 hover:underline"
            >
              Start over
            </button>
          </>
        }
      >
        <div className="space-y-5 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
            <MailCheck className="h-7 w-7 text-brand-600" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-ink">Confirm your email</h1>
            <p className="mt-2 text-muted-foreground">
              We sent a confirmation link to{" "}
              <span className="font-semibold text-ink">{confirmEmail}</span>. Click it to
              activate your account, then sign in to finish setup.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/40 p-4 text-left text-sm text-muted-foreground">
            Didn't get it? Check your spam folder, or resend below. The link expires after a
            while — request a fresh one if needed.
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" onClick={resend}>
              Resend confirmation email
            </Button>
            <Button asChild>
              <Link to="/login">
                Go to Sign In <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // ---- Wizard ----
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
            rules={{
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Enter a valid email address",
              },
            }}
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
          <Button type="submit" className="w-full">
            Continue <ArrowRight />
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
              {submitting ? <Spinner className="text-white" /> : (<>Create Account <ArrowRight /></>)}
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            We'll email you a confirmation link. Payment &amp; setup come right after you sign in.
          </p>
        </form>
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
