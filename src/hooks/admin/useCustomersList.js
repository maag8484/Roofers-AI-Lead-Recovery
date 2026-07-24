import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// Fetch `cols` from `table` where `key` IN ids, indexed by `key`. Empty ids ->
// {}. Used to batch-resolve related rows (LEFT-join semantics).
async function idxBy(table, key, cols, ids) {
  if (!ids.length) return {};
  const { data } = await supabase.from(table).select(cols).in(key, ids);
  const out = {};
  (data ?? []).forEach((row) => {
    out[row[key]] = row;
  });
  return out;
}

// ---------------------------------------------------------------------------
// Filter chip -> query predicate mapping (server-side). Multi-select: chips of
// the SAME group OR together; different groups AND together.
//   Onboarding-status chips (current_status IN ...):
//     "pending"   -> NEW, WAITING_FOR_BUSINESS_INFO, BUSINESS_INFO_SUBMITTED,
//                    SETUP_IN_PROGRESS, WAITING_FOR_CUSTOMER, PENDING_REVIEW
//     "completed" -> CONFIGURATION_COMPLETE, AI_ACTIVATED, LIVE
//     "ai_active" -> AI_ACTIVATED, LIVE
//   Subscription-status chips (subscriptions.status = ...):
//     "active"    -> 'active'
//     "trial"     -> 'trialing'
//     "cancelled" -> 'canceled'
//     "sub_active"-> 'active','trialing'   (any live subscription)
// Subscription chips require a status filter on the SUBSCRIPTIONS table, which
// is a separate table; we resolve those to a user_id set first, then constrain
// the main query by user_id. Onboarding chips filter roofing_companies directly.
// ---------------------------------------------------------------------------
const ONBOARDING_CHIP = {
  pending: [
    "NEW",
    "WAITING_FOR_BUSINESS_INFO",
    "BUSINESS_INFO_SUBMITTED",
    "SETUP_IN_PROGRESS",
    "WAITING_FOR_CUSTOMER",
    "PENDING_REVIEW",
  ],
  completed: ["CONFIGURATION_COMPLETE", "AI_ACTIVATED", "LIVE"],
  ai_active: ["AI_ACTIVATED", "LIVE"],
};
const SUBSCRIPTION_CHIP = {
  active: ["active"],
  trial: ["trialing"],
  cancelled: ["canceled"],
  sub_active: ["active", "trialing"],
};

// Columns safe to sort server-side (single field on roofing_companies).
export const SORTABLE = new Set([
  "company_name",
  "current_status",
  "created_at",
  "last_login_at",
  "business_phone",
  "contact_email",
]);

// Only roofing_companies fields here. profiles / subscriptions
// are keyed by user_id (FK to auth.users, not to roofing_companies), so Supabase
// can't reliably auto-embed them — we batch-resolve them by user_id after the
// paginated main query (LEFT-join semantics: a missing related row -> null, the
// customer still renders).
const SELECT =
  "id, user_id, company_name, contact_email, business_phone, phone_country, " +
  "current_status, created_at, last_login_at";

export function useCustomersList({ page, pageSize, sort, dir, search, chips }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Resolve subscription-status chips to a user_id set first (separate table).
      const subChips = chips.filter((c) => SUBSCRIPTION_CHIP[c]);
      let subUserIds = null;
      if (subChips.length) {
        const statuses = [...new Set(subChips.flatMap((c) => SUBSCRIPTION_CHIP[c]))];
        const { data: subs, error: sErr } = await supabase
          .from("subscriptions")
          .select("user_id")
          .in("status", statuses);
        if (sErr) throw sErr;
        subUserIds = [...new Set((subs ?? []).map((s) => s.user_id))];
        if (subUserIds.length === 0) {
          // No matching subs -> empty result without hitting the main table.
          setRows([]);
          setTotal(0);
          setLoading(false);
          return;
        }
      }

      let q = supabase.from("roofing_companies").select(SELECT, { count: "exact" });

      // Onboarding-status chips (union across selected chips).
      const onbChips = chips.filter((c) => ONBOARDING_CHIP[c]);
      if (onbChips.length) {
        const statuses = [...new Set(onbChips.flatMap((c) => ONBOARDING_CHIP[c]))];
        q = q.in("current_status", statuses);
      }

      if (subUserIds) q = q.in("user_id", subUserIds);

      // Search across company / email / business phone (roofing_companies fields).
      if (search?.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(`company_name.ilike.${s},contact_email.ilike.${s},business_phone.ilike.${s}`);
      }

      // Sort (only whitelisted single-field columns).
      const sortCol = SORTABLE.has(sort) ? sort : "created_at";
      q = q.order(sortCol, { ascending: dir === "asc" });

      // Pagination.
      const from = page * pageSize;
      q = q.range(from, from + pageSize - 1);

      const { data, count, error: qErr } = await q;
      if (qErr) throw qErr;

      const companies = data ?? [];
      const userIds = [...new Set(companies.map((c) => c.user_id).filter(Boolean))];

      // Batch-resolve related rows by user_id (LEFT-join: missing -> undefined).
      const [profByU, subByU] = await Promise.all([
        idxBy("profiles", "id", "id, full_name, phone", userIds),
        idxBy("subscriptions", "user_id", "user_id, status", userIds),
      ]);

      setRows(
        companies.map((r) => ({
          id: r.id,
          userId: r.user_id,
          company: r.company_name,
          owner: profByU[r.user_id]?.full_name || "—",
          email: r.contact_email || "—",
          ownerPhone: profByU[r.user_id]?.phone || null,
          businessPhone: r.business_phone || null,
          phoneCountry: r.phone_country || null,
          subscriptionStatus: subByU[r.user_id]?.status ?? null,
          currentStatus: r.current_status,
          createdAt: r.created_at,
          lastLoginAt: r.last_login_at,
        }))
      );
      setTotal(count ?? 0);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sort, dir, search, chips]);

  useEffect(() => {
    run();
  }, [run]);

  return { rows, total, loading, error, refetch: run };
}
