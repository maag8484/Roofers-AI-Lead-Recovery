import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { EMAIL_REDIRECT_TO } from "@/lib/authRedirect";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Includes the new-flow columns: status lifecycle + details_submitted, plus
  // the business-detail fields captured by the post-payment /onboarding form.
  // `status` is the legacy 4-value column the customer UI renders; `current_status`
  // is the admin console's 13-value lifecycle. 0016 keeps the two in sync, and we
  // pull both so the portal can show the precise stage the admin actually set.
  const COMPANY_COLS_BASE =
    "id, company_name, business_phone, phone_country, website, address, contact_name, contact_email, service_area, service_areas, services, calendly_link, transfer_number, conversion_preference, business_hours, after_hours_preference, monthly_leads_segment, setup_step, is_live, status, current_status, details_submitted";

  // Columns added by migration 0019 (Smith.ai build fields). PostgREST rejects
  // the WHOLE select with a 400 if any one column is unknown, so until 0019 has
  // been run these would null out the entire profile — breaking the dashboard
  // gate and status display, not just the new fields. We select them
  // optimistically and fall back to the base list on "does not exist".
  const COMPANY_COLS_0019 = "phone_provider, phone_provider_other, employees, summary_emails";
  const COMPANY_COLS = `${COMPANY_COLS_BASE}, ${COMPANY_COLS_0019}`;

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      setIsAdmin(false);
      setOnboardingCompleted(false);
      return;
    }
    // Pull the user's company + setup status, the profiles row (for the
    // onboarding flag), and the admin flag together.
    let [{ data, error }, profileRes, adminRes] = await Promise.all([
      supabase.from("roofing_companies").select(COMPANY_COLS).eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("onboarding_completed").eq("id", userId).maybeSingle(),
      // is_admin() is a SECURITY DEFINER RPC; returns false for non-admins.
      supabase.rpc("is_admin"),
    ]);

    // Migration 0019 not applied yet → retry with only the pre-0019 columns so
    // the rest of the app keeps working instead of seeing a null profile.
    if (error && /does not exist/i.test(error.message ?? "")) {
      console.warn(
        "[auth] roofing_companies is missing the 0019 columns — run " +
          "supabase/migrations/0019_smith_build_fields.up.sql. Loading without them."
      );
      ({ data, error } = await supabase
        .from("roofing_companies")
        .select(COMPANY_COLS_BASE)
        .eq("user_id", userId)
        .maybeSingle());
    }

    if (error) {
      console.error("[auth] failed to load profile", error.message);
    }
    setIsAdmin(adminRes?.data === true);
    setOnboardingCompleted(profileRes?.data?.onboarding_completed === true);
    // In the new flow the roofing_companies row is created by the /onboarding
    // form after payment — not at signup. Until then, profile is simply null.
    setProfile(data ?? null);
  }, []);

  // Persist that the customer has finished (or dismissed) the welcome tour so it
  // won't auto-show again. Optimistic: flip local state, then write.
  const markOnboardingComplete = useCallback(async () => {
    setOnboardingCompleted(true);
    const userId = session?.user?.id;
    if (!userId) return;
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", userId);
    if (error) console.error("[auth] failed to mark onboarding complete", error.message);
  }, [session]);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      loadProfile(data.session?.user?.id).finally(() => setLoading(false));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      loadProfile(newSession?.user?.id);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Live-sync the company row. When an admin changes the customer's status from
  // the console, the update lands here and the portal re-renders immediately —
  // no manual reload. Requires roofing_companies in the supabase_realtime
  // publication (added in 0016).
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    const channel = supabase
      .channel(`roofing_companies:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "roofing_companies",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Merge rather than replace: the payload carries every column, but
          // keeping the merge shape guards against a narrowed future select.
          setProfile((prev) => (prev ? { ...prev, ...payload.new } : payload.new));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    isAdmin,
    onboardingCompleted,
    markOnboardingComplete,
    loading,
    refreshProfile: () => loadProfile(session?.user?.id),
    signIn: (email, password) =>
      supabase.auth.signInWithPassword({ email, password }),
    // emailRedirectTo only matters when "Confirm email" is ON: it's where the
    // link in the confirmation email lands the user. Harmless when it's OFF.
    signUp: (email, password, metadata) =>
      supabase.auth.signUp({
        email,
        password,
        options: { data: metadata, emailRedirectTo: EMAIL_REDIRECT_TO },
      }),
    signOut: () => supabase.auth.signOut(),
    resetPassword: (email) =>
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
