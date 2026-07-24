import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// The five pipeline columns (in order) + the KPI status sets.
export const PIPELINE = [
  "NEW",
  "WAITING_FOR_BUSINESS_INFO",
  "SETUP_IN_PROGRESS",
  "PENDING_REVIEW",
  "CONFIGURATION_COMPLETE",
];
const ONBOARDING_STATES = [
  "NEW",
  "WAITING_FOR_BUSINESS_INFO",
  "BUSINESS_INFO_SUBMITTED",
  "SETUP_IN_PROGRESS",
  "WAITING_FOR_CUSTOMER",
  "PENDING_REVIEW",
  "CONFIGURATION_COMPLETE",
];
const KANBAN_MAX = 200;

async function count(build) {
  let q = supabase.from("roofing_companies").select("*", { count: "exact", head: true });
  q = build(q);
  const { count: c } = await q;
  return c ?? 0;
}

// KPI strip: waiting-for-info / in-setup / pending-review / ready-to-activate.
export function useOnboardingKpis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    Promise.all([
      count((q) => q.eq("current_status", "WAITING_FOR_BUSINESS_INFO")),
      count((q) => q.in("current_status", ["BUSINESS_INFO_SUBMITTED", "SETUP_IN_PROGRESS"])),
      count((q) => q.eq("current_status", "PENDING_REVIEW")),
      count((q) => q.eq("current_status", "CONFIGURATION_COMPLETE")),
    ]).then(([waiting, inSetup, review, ready]) => {
      if (active) {
        setData({ waiting, inSetup, review, ready });
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  return { data, loading };
}

// Kanban: all onboarding-state customers (capped). `truncated` flags overflow.
export function useOnboardingKanban(refreshKey) {
  const [rows, setRows] = useState([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const { data, count } = await supabase
        .from("roofing_companies")
        .select("id, user_id, company_name, current_status, updated_at, created_at", {
          count: "exact",
        })
        .in("current_status", ONBOARDING_STATES)
        .order("updated_at", { ascending: true })
        .limit(KANBAN_MAX);

      const list = data ?? [];
      const userIds = [...new Set(list.map((r) => r.user_id).filter(Boolean))];
      const nameBy = {};
      if (userIds.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
        (profs ?? []).forEach((p) => (nameBy[p.id] = p.full_name));
      }
      if (active) {
        setRows(list.map((r) => ({ ...r, owner: nameBy[r.user_id] || "—" })));
        setTruncated((count ?? 0) > KANBAN_MAX);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  return { rows, truncated, loading };
}

// Stalled: onboarding-state customers whose status is older than 7 days.
export function useStalledCustomers(refreshKey) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
    (async () => {
      const { data } = await supabase
        .from("roofing_companies")
        .select("id, user_id, company_name, current_status, updated_at")
        .in("current_status", ONBOARDING_STATES)
        .lt("updated_at", since)
        .order("updated_at", { ascending: true })
        .limit(50);
      const list = data ?? [];
      const userIds = [...new Set(list.map((r) => r.user_id).filter(Boolean))];
      const nameBy = {};
      if (userIds.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
        (profs ?? []).forEach((p) => (nameBy[p.id] = p.full_name));
      }
      if (active) {
        setRows(list.map((r) => ({ ...r, owner: nameBy[r.user_id] || "—" })));
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  return { rows, loading };
}

// Whole days since an ISO timestamp.
export function daysSince(iso) {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}
