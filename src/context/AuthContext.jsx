import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const COMPANY_COLS =
    "id, company_name, business_phone, website, service_area, monthly_leads_segment, setup_step, is_live";

  /**
   * Signup stashes the company details in the user's auth metadata because
   * email confirmation is ON (no session = no DB write at signup time). The
   * first time a confirmed user is authenticated, materialize their
   * roofing_companies row from that metadata.
   */
  const ensureCompany = useCallback(async (authUser) => {
    const meta = authUser?.user_metadata ?? {};
    if (!meta.company_name) return null; // nothing to create (e.g. admin)
    const { data, error } = await supabase
      .from("roofing_companies")
      .insert({
        user_id: authUser.id,
        company_name: meta.company_name,
        business_phone: meta.business_phone ?? null,
        service_area: meta.service_area ?? null,
        website: meta.website ?? null,
        monthly_leads_segment: meta.monthly_leads_segment ?? null,
        setup_step: 1,
      })
      .select(COMPANY_COLS)
      .single();
    if (error) {
      console.error("[auth] failed to create company row", error.message);
      return null;
    }
    return data;
  }, []);

  const loadProfile = useCallback(
    async (userId, authUser) => {
      if (!userId) {
        setProfile(null);
        setIsAdmin(false);
        return;
      }
      // Pull the user's company + setup status and admin flag together.
      const [{ data, error }, adminRes] = await Promise.all([
        supabase.from("roofing_companies").select(COMPANY_COLS).eq("user_id", userId).maybeSingle(),
        // is_admin() is a SECURITY DEFINER RPC; returns false for non-admins.
        supabase.rpc("is_admin"),
      ]);
      if (error) {
        console.error("[auth] failed to load profile", error.message);
      }
      const admin = adminRes?.data === true;
      setIsAdmin(admin);

      // No company row yet + has signup metadata + not an admin → create it.
      let company = data ?? null;
      if (!company && !admin && authUser) {
        company = await ensureCompany(authUser);
      }
      setProfile(company);
    },
    [ensureCompany]
  );

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      loadProfile(data.session?.user?.id, data.session?.user).finally(() => setLoading(false));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      loadProfile(newSession?.user?.id, newSession?.user);
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
    refreshProfile: () => loadProfile(session?.user?.id, session?.user),
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
