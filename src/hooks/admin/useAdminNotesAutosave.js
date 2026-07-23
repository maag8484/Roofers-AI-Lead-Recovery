import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const trunc500 = (t) => (t == null ? null : String(t).slice(0, 500));

// Autosaving admin-notes editor state. Debounces saves 800ms after the last
// keystroke and also flushes on blur. Each save updates
// roofing_companies.admin_notes AND writes an audit_logs row (old -> new).
// This is NOT the atomic status path (that's the RPC); a notes edit is a plain
// two-write op — the note is what matters, the audit is best-effort.
export function useAdminNotesAutosave(customerId, initialNotes) {
  const { user } = useAuth();
  const [value, setValue] = useState(initialNotes ?? "");
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error
  const savedRef = useRef(initialNotes ?? "");
  const timer = useRef(null);

  // Re-sync when a different customer / fresh data loads in.
  useEffect(() => {
    setValue(initialNotes ?? "");
    savedRef.current = initialNotes ?? "";
    setStatus("idle");
  }, [customerId, initialNotes]);

  const save = useCallback(async () => {
    const next = value ?? "";
    if (next === savedRef.current) return; // nothing changed
    const prev = savedRef.current;
    setStatus("saving");
    try {
      const { error: uErr } = await supabase
        .from("roofing_companies")
        .update({ admin_notes: next })
        .eq("id", customerId);
      if (uErr) throw uErr;

      // Best-effort audit trail of the notes change.
      const { error: aErr } = await supabase.from("audit_logs").insert({
        actor_id: user?.id ?? null,
        entity_type: "roofing_companies",
        entity_id: customerId,
        field: "admin_notes",
        old_value: trunc500(prev),
        new_value: trunc500(next),
      });
      if (aErr) console.error("[admin notes] audit insert failed", aErr.message);

      savedRef.current = next;
      setStatus("saved");
    } catch (e) {
      console.error("[admin notes] save failed", e.message);
      setStatus("error");
    }
  }, [value, customerId, user]);

  // Debounced autosave on change.
  useEffect(() => {
    if ((value ?? "") === savedRef.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, 800);
    return () => timer.current && clearTimeout(timer.current);
  }, [value, save]);

  const onBlur = () => {
    if (timer.current) clearTimeout(timer.current);
    save();
  };

  return { value, setValue, onBlur, status };
}
