import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// --- admin_settings singleton (Gmail integration settings) -----------------
export function useAdminSettings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: row } = await supabase.from("admin_settings").select("*").eq("id", 1).maybeSingle();
    setData(row ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async (patch) => {
    const { error } = await supabase.from("admin_settings").update(patch).eq("id", 1);
    if (!error) setData((d) => ({ ...d, ...patch }));
    return { error };
  }, []);

  return { data, loading, save, reload: load };
}

// --- admin roster via the SECURITY DEFINER RPC -----------------------------
export function useAdminList(refreshKey) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    supabase.rpc("admin_list_admins").then(({ data, error: err }) => {
      if (!active) return;
      if (err) setError(err);
      else setAdmins(data ?? []);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const addAdmin = useCallback(async (email) => {
    const { data, error } = await supabase.rpc("admin_add_admin", { p_email: email });
    return { ok: !error && data?.ok, message: error?.message };
  }, []);

  const removeAdmin = useCallback(async (userId) => {
    const { data, error } = await supabase.rpc("admin_remove_admin", { p_user_id: userId });
    return { ok: !error && data?.ok, message: error?.message };
  }, []);

  return { admins, loading, error, addAdmin, removeAdmin };
}

// --- per-admin notification preferences ------------------------------------
export function useNotificationPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("admin_notification_preferences")
      .select("*")
      .eq("admin_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setPrefs(
          data ?? {
            admin_id: user.id,
            on_gmail_disconnect: true,
            on_critical_error: true,
            on_new_signup: false,
          }
        );
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  // Upsert (row may not exist yet).
  const savePref = useCallback(
    async (patch) => {
      if (!user) return;
      const next = { ...prefs, ...patch, admin_id: user.id };
      setPrefs(next);
      await supabase.from("admin_notification_preferences").upsert(next, { onConflict: "admin_id" });
    },
    [prefs, user]
  );

  return { prefs, loading, savePref };
}
