import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Includes the new-flow columns: status lifecycle + details_submitted, plus
  // the business-detail fields captured by the post-payment /onboarding form.
  const COMPANY_COLS =
    "id, company_name, business_phone, phone_country, website, address, contact_name, contact_email, service_area, service_areas, services, calendly_link, transfer_number, conversion_preference, business_hours, after_hours_preference, monthly_leads_segment, setup_step, is_live, status, details_submitted";

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      setIsAdmin(false);
      setOnboardingCompleted(false);
      return;
    }
    // Pull the user's company + setup status, the profiles row (for the
    // onboarding flag), and the admin flag together.
    const [{ data, error }, profileRes, adminRes] = await Promise.all([
      supabase.from("roofing_companies").select(COMPANY_COLS).eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("onboarding_completed").eq("id", userId).maybeSingle(),
      // is_admin() is a SECURITY DEFINER RPC; returns false for non-admins.
      supabase.rpc("is_admin"),
    ]);
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
    signUp: (email, password, metadata) =>
      supabase.auth.signUp({ email, password, options: { data: metadata } }),
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
