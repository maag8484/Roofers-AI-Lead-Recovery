import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      setIsAdmin(false);
      return;
    }
    // Pull the user's company + setup status and admin flag together.
    const [{ data, error }, adminRes] = await Promise.all([
      supabase
        .from("roofing_companies")
        .select(
          "id, company_name, business_phone, website, service_area, monthly_leads_segment, setup_step, is_live"
        )
        .eq("user_id", userId)
        .maybeSingle(),
      // is_admin() is a SECURITY DEFINER RPC; returns false for non-admins.
      supabase.rpc("is_admin"),
    ]);
    if (error) {
      console.error("[auth] failed to load profile", error.message);
    }
    setProfile(data ?? null);
    setIsAdmin(adminRes?.data === true);
  }, []);

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
    loading,
    refreshProfile: () => loadProfile(session?.user?.id),
    signIn: (email, password) =>
      supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password, metadata) =>
      supabase.auth.signUp({ email, password, options: { data: metadata } }),
    signOut: () => supabase.auth.signOut(),
    resetPassword: (email) =>
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
