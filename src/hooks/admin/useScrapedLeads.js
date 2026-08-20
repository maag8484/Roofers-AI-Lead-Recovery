import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 25;

/**
 * Fetches rows from the public.leads table (n8n Outscraper data).
 * Supports server-side pagination, search (company_name / city / owner_email),
 * and filtering by status and outreach progress.
 *
 * NOTE: This table is owned by n8n — never INSERT/UPDATE/DELETE from the app.
 */
export function useScrapedLeads({ page = 1, search = "", statusFilter = "", outreachFilter = "" } = {}) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let q = supabase
      .from("leads")
      .select(
        "id, created_at, company_name, phone, owner_name, owner_email, city, address, website, source, status, sms_sent, email_sent, day2_sms_sent, day2_email_sent, day4_sms_sent, day4_email_sent, reply_received, reply_channel, opted_out, email_verified, sms_only, enriched_at, sourced_at",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    // Full-text-ish search across company name, city, owner email
    if (search.trim()) {
      const s = search.trim();
      q = q.or(`company_name.ilike.%${s}%,city.ilike.%${s}%,owner_email.ilike.%${s}%,owner_name.ilike.%${s}%`);
    }

    // Status filter
    if (statusFilter) {
      q = q.eq("status", statusFilter);
    }

    // Outreach filter shortcuts
    if (outreachFilter === "replied") {
      q = q.eq("reply_received", true);
    } else if (outreachFilter === "opted_out") {
      q = q.eq("opted_out", true);
    } else if (outreachFilter === "sms_sent") {
      q = q.eq("sms_sent", true);
    } else if (outreachFilter === "email_sent") {
      q = q.eq("email_sent", true);
    } else if (outreachFilter === "no_outreach") {
      q = q.eq("sms_sent", false).eq("email_sent", false);
    }

    const { data: rows, count, error: err } = await q;
    if (err) {
      setError(err.message);
    } else {
      setData(rows ?? []);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [page, search, statusFilter, outreachFilter]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, total, loading, error, pageSize: PAGE_SIZE, refetch: fetch };
}
