import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// 10 most recent customer signups, joined to profiles for owner name/email.
// profiles.id === roofing_companies.user_id, so we resolve names in one extra
// keyed lookup rather than relying on a declared FK embed.
export function useRecentSignups() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: companies, error: cErr } = await supabase
          .from("roofing_companies")
          .select("id, user_id, company_name, contact_email, created_at")
          .order("created_at", { ascending: false })
          .limit(10);
        if (cErr) throw cErr;

        const rows = companies ?? [];
        const userIds = rows.map((r) => r.user_id).filter(Boolean);

        let profileBy = {};
        if (userIds.length) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", userIds);
          (profiles ?? []).forEach((p) => {
            profileBy[p.id] = p;
          });
        }

        if (!active) return;
        setData(
          rows.map((r) => ({
            id: r.id,
            company: r.company_name,
            owner: profileBy[r.user_id]?.full_name || "—",
            email: r.contact_email || "—",
            created_at: r.created_at,
          }))
        );
      } catch (e) {
        if (active) setError(e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}
