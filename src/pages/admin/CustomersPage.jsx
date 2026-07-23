import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Eye,
  Pencil,
  Copy,
  Users,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OnboardingProgress } from "@/components/admin/OnboardingProgress";
import { StatusChangeModal } from "@/components/admin/StatusChangeModal";
import { useCustomersList, SORTABLE } from "@/hooks/admin/useCustomersList";
import { PLAN_LABEL } from "@/config/plan";
import { formatPhone, formatDateTime, cn } from "@/lib/utils";

const CHIPS = [
  { key: "active", label: "Active" },
  { key: "trial", label: "Trial" },
  { key: "cancelled", label: "Cancelled" },
  { key: "pending", label: "Pending Onboarding" },
  { key: "completed", label: "Completed Onboarding" },
  { key: "ai_active", label: "AI Active" },
  { key: "sub_active", label: "Subscription Active" },
];

// column key -> sortable field (or null = not server-sortable, control hidden)
const COLUMNS = [
  { key: "company", label: "Company", sort: "company_name" },
  { key: "owner", label: "Owner", sort: null },
  { key: "email", label: "Email", sort: "contact_email" },
  { key: "phone", label: "Phone", sort: null },
  { key: "subscription", label: "Subscription", sort: null },
  { key: "plan", label: "Plan", sort: null },
  { key: "onboarding", label: "Onboarding %", sort: null },
  { key: "status", label: "Current Status", sort: "current_status" },
  { key: "created", label: "Created", sort: "created_at" },
  { key: "lastLogin", label: "Last Login", sort: "last_login_at" },
  // Reserved — no per-customer Google state yet (Calendar removed, Gmail is
  // workspace-level). Column kept so the table shape matches the spec.
  { key: "google", label: "Google", sort: null },
  { key: "businessPhone", label: "Business Phone", sort: "business_phone" },
  { key: "actions", label: "", sort: null },
];

export default function AdminCustomersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState("created_at");
  const [dir, setDir] = useState("desc");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [chips, setChips] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [modal, setModal] = useState(null); // { customerId, currentStatus, companyName }

  const { rows, total, loading, error, refetch } = useCustomersList({
    page,
    pageSize,
    sort,
    dir,
    search,
    chips,
  });

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const toggleChip = (key) => {
    setPage(0);
    setChips((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
  };

  const toggleSort = (col) => {
    if (!SORTABLE.has(col)) return;
    setPage(0);
    if (sort === col) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(col);
      setDir("asc");
    }
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput);
  };

  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) rows.forEach((r) => next.delete(r.id));
      else rows.forEach((r) => next.add(r.id));
      return next;
    });
  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectedRows = useMemo(() => rows.filter((r) => selected.has(r.id)), [rows, selected]);

  const onSaved = () => {
    setSelected(new Set());
    refetch();
  };

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c.key}
            onClick={() => toggleChip(c.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              chips.includes(c.key)
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-border text-muted-foreground hover:bg-secondary"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <form onSubmit={submitSearch} className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search company, email, phone…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </form>

            <div className="flex items-center gap-2">
              {selected.size > 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    // Bulk change: open the modal seeded from the first selected row.
                    const first = selectedRows[0];
                    if (first)
                      setModal({
                        bulk: true,
                        ids: [...selected],
                        currentStatus: first.currentStatus,
                        companyName: `${selected.size} customers`,
                      });
                  }}
                >
                  Change status ({selected.size})
                </Button>
              )}
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-9 w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[25, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-lg bg-secondary" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">Couldn't load customers.</div>
          ) : rows.length === 0 ? (
            <EmptyState icon={Users} title="No customers found" description="Try clearing filters or search." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-3">
                      <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll} aria-label="Select all" />
                    </th>
                    {COLUMNS.map((col) => (
                      <th key={col.key} className="whitespace-nowrap px-4 py-3 font-medium">
                        {col.sort ? (
                          <button
                            onClick={() => toggleSort(col.sort)}
                            className="inline-flex items-center gap-1 hover:text-ink"
                          >
                            {col.label}
                            {sort === col.sort &&
                              (dir === "asc" ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              ))}
                          </button>
                        ) : (
                          col.label
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggleOne(r.id)}
                          aria-label={`Select ${r.company}`}
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{r.company}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink">{r.owner}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{r.email}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {r.ownerPhone ? formatPhone(r.ownerPhone) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {r.subscriptionStatus || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {r.subscriptionStatus ? PLAN_LABEL : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <OnboardingProgress status={r.currentStatus} compact />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge status={r.currentStatus} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatDateTime(r.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {r.lastLoginAt ? formatDateTime(r.lastLoginAt) : "Never"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">—</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {r.businessPhone ? formatPhone(r.businessPhone) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <KebabMenu
                          onView={() => navigate(`/admin/customers/${r.id}`)}
                          onEditStatus={() =>
                            setModal({
                              customerId: r.id,
                              currentStatus: r.currentStatus,
                              companyName: r.company,
                            })
                          }
                          onCopyEmail={() => {
                            navigator.clipboard.writeText(r.email);
                            toast.success("Email copied");
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination footer */}
          {!loading && !error && rows.length > 0 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                {total} customer{total === 1 ? "" : "s"} · page {page + 1} of {pageCount}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ArrowLeft className="h-4 w-4" /> Prev
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page + 1 >= pageCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status change (single or bulk) */}
      {modal && !modal.bulk && (
        <StatusChangeModal
          open
          customerId={modal.customerId}
          currentStatus={modal.currentStatus}
          companyName={modal.companyName}
          onClose={() => setModal(null)}
          onSaved={onSaved}
        />
      )}
      {modal?.bulk && (
        <StatusChangeModal
          open
          bulkIds={modal.ids}
          currentStatus={modal.currentStatus}
          companyName={modal.companyName}
          onClose={() => setModal(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

// Kebab menu with click-outside close.
function KebabMenu({ onView, onEditStatus, onCopyEmail }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        aria-label="Actions"
        className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-white shadow-lg">
          <MenuItem icon={Eye} label="View" onClick={onView} />
          <MenuItem icon={Pencil} label="Edit status" onClick={onEditStatus} />
          <MenuItem icon={Copy} label="Copy email" onClick={onCopyEmail} />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick }) {
  return (
    <button
      onMouseDown={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink hover:bg-secondary"
    >
      <Icon className="h-4 w-4 text-muted-foreground" /> {label}
    </button>
  );
}

