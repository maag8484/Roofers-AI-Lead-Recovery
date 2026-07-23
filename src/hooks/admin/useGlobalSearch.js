import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

// Debounced (250ms) global search via the admin_global_search RPC. Empty query
// returns null groups (caller shows "Recent" instead). Returns grouped results.
export function useGlobalSearch(query) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = (query ?? "").trim();
    if (!q) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      const { data, error } = await supabase.rpc("admin_global_search", { p_query: q, p_limit: 5 });
      if (!error) setResults(data ?? { customers: [], notifications: [], activity: [], audit: [] });
      setLoading(false);
    }, 250);
    return () => timer.current && clearTimeout(timer.current);
  }, [query]);

  return { results, loading };
}
