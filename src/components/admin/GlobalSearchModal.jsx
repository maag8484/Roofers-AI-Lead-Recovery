import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Building2, Bell, Activity, ShieldCheck } from "lucide-react";
import { useGlobalSearch } from "@/hooks/admin/useGlobalSearch";
import { useRecentSearch } from "@/hooks/admin/useRecentSearch";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

// Highlight the matched query inside a text excerpt (bold).
function Highlight({ text, q }) {
  if (!text) return null;
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <strong className="font-semibold text-ink">{text.slice(i, i + q.length)}</strong>
      {text.slice(i + q.length)}
    </>
  );
}

const GROUP_META = {
  customers: { label: "Customers", icon: Building2 },
  notifications: { label: "Notifications", icon: Bell },
  activity: { label: "Activity", icon: Activity },
  audit: { label: "Audit", icon: ShieldCheck },
};

// Flatten grouped results into a single ordered list for keyboard nav.
function flatten(results) {
  if (!results) return [];
  const out = [];
  for (const key of ["customers", "notifications", "activity", "audit"]) {
    (results[key] ?? []).forEach((row) => out.push({ group: key, row }));
  }
  return out;
}

export function GlobalSearchModal({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const { results, loading } = useGlobalSearch(query);
  const { recentCustomers, unread } = useRecentSearch(open && !query.trim());
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const flat = useMemo(() => flatten(results), [results]);
  const q = query.trim();

  const go = (item) => {
    onClose();
    if (item.group === "customers") navigate(`/admin/customers/${item.row.id}`);
    else if (item.group === "notifications") navigate("/admin/notifications");
    else if (item.group === "activity") navigate("/admin/activity");
    else if (item.group === "audit") navigate("/admin/audit");
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") return onClose();
    if (!flat.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(flat.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flat[active]) go(flat[active]);
    }
  };

  if (!open) return null;

  const label = (item) => {
    const r = item.row;
    if (item.group === "customers") return r.company_name;
    if (item.group === "notifications") return r.title;
    if (item.group === "activity") return r.action;
    return `${r.entity_type} · ${r.field ?? ""}`;
  };
  const excerpt = (item) => {
    const r = item.row;
    if (item.group === "customers") return r.contact_email || r.owner_name || r.business_phone || "";
    if (item.group === "notifications") return r.body || "";
    if (item.group === "activity") return r.result || "";
    return r.new_value || r.old_value || "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24" onKeyDown={onKeyDown}>
      <button aria-label="Close" className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-white shadow-2xl"
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search customers, logs, notifications…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {loading && <Spinner className="h-4 w-4" />}
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {/* Empty query -> Recent */}
          {!q && (
            <div className="space-y-3 p-1">
              <RecentBlock
                title="Recently viewed"
                icon={Building2}
                items={recentCustomers.map((c) => ({ id: c.id, label: c.company }))}
                onPick={(id) => { onClose(); navigate(`/admin/customers/${id}`); }}
                empty="No recent customers"
              />
              <RecentBlock
                title="Unread notifications"
                icon={Bell}
                items={unread.map((n) => ({ id: n.id, label: n.title }))}
                onPick={() => { onClose(); navigate("/admin/notifications"); }}
                empty="No unread notifications"
              />
            </div>
          )}

          {/* Query -> grouped results */}
          {q && !loading && flat.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">No results for “{q}”.</p>
          )}

          {q &&
            ["customers", "notifications", "activity", "audit"].map((group) => {
              const rows = results?.[group] ?? [];
              if (!rows.length) return null;
              const Meta = GROUP_META[group];
              return (
                <div key={group} className="mb-2">
                  <p className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Meta.icon className="h-3.5 w-3.5" /> {Meta.label}
                  </p>
                  {rows.map((row) => {
                    const item = { group, row };
                    const idx = flat.findIndex((f) => f.group === group && f.row === row);
                    return (
                      <button
                        key={`${group}-${row.id}`}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => go(item)}
                        className={cn(
                          "flex w-full flex-col rounded-lg px-3 py-2 text-left",
                          idx === active ? "bg-brand-50" : "hover:bg-secondary/60"
                        )}
                      >
                        <span className="text-sm font-medium text-ink">
                          <Highlight text={label(item)} q={q} />
                        </span>
                        {excerpt(item) && (
                          <span className="truncate text-xs text-muted-foreground">
                            <Highlight text={excerpt(item)} q={q} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
        </div>

        <div className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          ↑↓ navigate · ↵ open · esc close
        </div>
      </div>
    </div>
  );
}

function RecentBlock({ title, icon: Icon, items, onPick, empty }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {title}
      </p>
      {items.length === 0 ? (
        <p className="px-3 py-1.5 text-xs text-muted-foreground">{empty}</p>
      ) : (
        items.map((it) => (
          <button
            key={it.id}
            onClick={() => onPick(it.id)}
            className="block w-full truncate rounded-lg px-3 py-1.5 text-left text-sm text-ink hover:bg-secondary/60"
          >
            {it.label}
          </button>
        ))
      )}
    </div>
  );
}
