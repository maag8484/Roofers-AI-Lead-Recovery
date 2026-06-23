import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

/**
 * Landing page for the password-reset email link. Supabase's recovery link
 * carries a token that (with detectSessionInUrl) establishes a temporary
 * recovery session and fires a PASSWORD_RECOVERY auth event. While that
 * session is active, updateUser({ password }) sets the new password.
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    // The link may still be exchanging the token when this mounts; listen for
    // the recovery event, and also accept an already-present session.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async ({ password }) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message || "Could not update password.");
      return;
    }
    toast.success("Password updated. Please sign in.");
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <AuthLayout
      title="Set a new password"
      subtitle={ready ? "Choose a new password for your account." : undefined}
    >
      {!ready ? (
        <div className="space-y-4 text-center">
          <Spinner className="mx-auto h-7 w-7" />
          <p className="text-sm text-muted-foreground">
            Verifying your reset link… If this doesn't continue, the link may have expired —
            request a new one from the sign-in page.
          </p>
          <Button variant="secondary" onClick={() => navigate("/login")}>
            Back to Sign In
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
            <KeyRound className="h-6 w-6 text-brand-600" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
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
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type={showPw ? "text" : "password"}
              placeholder="Re-enter password"
              {...register("confirm", {
                required: "Please confirm your password",
                validate: (v) => v === watch("password") || "Passwords don't match",
              })}
            />
            {errors.confirm && (
              <p className="text-xs text-destructive">{errors.confirm.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="text-white" /> : "Update password"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
