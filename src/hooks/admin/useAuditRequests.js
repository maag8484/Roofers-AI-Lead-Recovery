import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useAuditRequests() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from("audit_requests")
      .select("id, full_name, email, company, service_area, phone, preferred_contact, current_process, contact_consent, marketing_consent, consent_version, consented_at, submission_page, attribution, calculator, status, created_at")
      .order("created_at", { ascending: false })
      .limit(250);
    if (queryError) setError(queryError);
    else setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const updateStatus = useCallback(async (id, status) => {
    const { error: updateError } = await supabase.from("audit_requests").update({ status }).eq("id", id);
    if (updateError) throw updateError;
    setRows((current) => current.map((row) => row.id === id ? { ...row, status } : row));
  }, []);

  return { rows, loading, error, refetch, updateStatus };
}
