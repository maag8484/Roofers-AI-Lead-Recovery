import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Reads the email_integration_status singleton (id = 1). Returns the row or null.
export function useEmailHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("email_integration_status")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data: row, error: err }) => {
        if (!active) return;
        if (err) setError(err);
        else setData(row ?? null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}
