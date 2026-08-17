import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck, RefreshCw, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EMAIL_REDIRECT_TO } from "@/lib/authRedirect";

/**
 * Shown after signup when Supabase has "Confirm email" ON.
 *
 * In that mode signUp() succeeds and sends a confirmation email, but returns
 * NO session — the user cannot use the app until they click the link. That is
 * the happy path, not a failure, so this renders as a success state.
 *
 * It also polls for confirmation: if the user clicks the link in another tab,
 * onAuthStateChange fires here with a live session and we can move them along
 * without asking them to come back and sign in manually.
 */
export function ConfirmEmailNotice({ email, onConfirmed }) {
  const [resending, setResending] = useState(false);
  // Guards against onConfirmed firing twice — onAuthStateChange can emit more
  // than one session-bearing event (SIGNED_IN, then TOKEN_REFRESHED).
  const handled = useRef(false);

  // Watch for the confirmation landing in another tab.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !handled.current) {
        handled.current = true;
        onConfirmed?.();
      }
    });
    return () => subscription.unsubscribe();
  }, [onConfirmed]);

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: EMAIL_REDIRECT_TO },
    });
    setResending(false);

    if (error) {
      // Supabase's built-in mailer caps sends (~3/hour). That's a rate limit,
      // not a bug — say so plainly instead of showing a raw error.
      const rateLimited = /rate limit|too many/i.test(error.message || "");
      toast.error(
        rateLimited
          ? "Too many emails sent just now. Please wait a few minutes and try again."
          : error.message || "Could not resend the email."
      );
      return;
    }
    toast.success("Confirmation email sent again.");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
          <MailCheck className="h-7 w-7 text-brand-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-ink">Confirm your email</h1>
        <p className="mt-2 text-muted-foreground">
          We sent a confirmation link to
        </p>
        <p className="mt-1 break-all font-semibold text-ink">{email}</p>
      </div>

      <div className="rounded-xl border border-border bg-slate-50 p-4">
        <ol className="space-y-2.5 text-sm text-muted-foreground">
          <li className="flex gap-2.5">
            <span className="font-bold text-brand-600">1.</span>
            Open the email and click <span className="font-semibold text-ink">Confirm your email</span>.
          </li>
          <li className="flex gap-2.5">
            <span className="font-bold text-brand-600">2.</span>
            You'll come straight back here to start your free trial.
          </li>
        </ol>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Can't find it? Check your spam or promotions folder — it can take a minute to arrive.
      </p>

      <div className="space-y-2.5">
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? (
            <Spinner />
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Resend confirmation email
            </>
          )}
        </Button>

        <Button asChild variant="ghost" className="w-full">
          <Link to="/login">
            Already confirmed? Sign in <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
