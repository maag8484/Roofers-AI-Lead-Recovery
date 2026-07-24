import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

// New flow: signup is now email + password ONLY. Email confirmation is OFF in
// Supabase, so signUp returns a live session immediately. Business details are
// collected AFTER payment on the /onboarding form — not here. On success we send
// the user straight to /checkout to pay.
export default function SignupPage() {
  const { signUp } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (values) => {
    setSubmitting(true);
    // Pass full_name in the signup metadata — the handle_new_user trigger writes
    // it into public.profiles, so it's available for the account menu, greeting,
    // etc. The onboarding form still writes the company row after payment.
    const { data: result, error } = await signUp(values.email, values.password, {
      full_name: values.full_name.trim(),
    });
    setSubmitting(false);

    if (error) {
      // Surface the real Supabase reason (invalid email, weak password,
      // user already registered) rather than a generic message.
      toast.error(error.message || "Could not create account.");
      return;
    }

    // With email confirmation OFF, signUp returns a session immediately.
    if (result?.session) {
      window.location.href = "/checkout";
      return;
    }

    // Fallback: if confirmation somehow got re-enabled, there's a user but no
    // session. Tell the user rather than silently stalling.
    if (result?.user && !result?.session) {
      toast.error(
        "Check your email to confirm your account, then sign in. (Disable 'Confirm email' in Supabase for the instant flow.)"
      );
    }
  };

  return (
    <AuthLayout
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">
            Sign In
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Create your account</h1>
          <p className="mt-1 text-muted-foreground">
            Start recovering missed calls in minutes — no sales call.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            type="text"
            placeholder="John Smith"
            autoComplete="name"
            {...register("full_name", {
              required: "Your name is required",
              minLength: { value: 2, message: "Enter your full name" },
            })}
          />
          {errors.full_name && (
            <p className="text-xs text-destructive">{errors.full_name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/,
                message: "Enter a valid email address",
              },
            })}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              placeholder="At least 8 characters"
              {...register("password", {
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
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? (
            <Spinner className="text-white" />
          ) : (
            <>
              Create account <ArrowRight />
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          We'll walk you through setup next — start your 7-day free trial, no charge today.
        </p>
      </form>
    </AuthLayout>
  );
}
