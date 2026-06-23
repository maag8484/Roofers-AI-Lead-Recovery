import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export default function LoginPage() {
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPw, setShowPw] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async ({ email, password }) => {
    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error.message || "Could not sign in.");
      return;
    }
    toast.success("Welcome back!");
    // Admins go straight to the admin panel; everyone else to the dashboard.
    const { data: admin } = await supabase.rpc("is_admin");
    if (admin === true) {
      navigate("/admin", { replace: true });
    } else {
      navigate(location.state?.from || "/dashboard", { replace: true });
    }
  };

  const handleForgot = async () => {
    const email = getValues("email");
    if (!email) {
      toast.error("Enter your email above first, then click reset.");
      return;
    }
    const { error } = await resetPassword(email);
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent.");
  };

  return (
    <AuthLayout
      title="Sign In"
      subtitle="Welcome back to Roof AI Lead Recovery"
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-brand-600 hover:underline">
            Sign Up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            {...register("email", { required: "Email is required" })}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password", { required: "Password is required" })}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleForgot}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Forgot Password?
          </button>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="text-white" /> : (<>Sign In <ArrowRight /></>)}
        </Button>
      </form>
    </AuthLayout>
  );
}
