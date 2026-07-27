import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronUp,
  ChevronDown,
  MoreVertical,
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
import { OnboardingProgress } from "@/components/admin/OnboardingProgress";
import { useCustomersList, SORTABLE } from "@/hooks/admin/useCustomersList";
import { useChangeStatus } from "@/hooks/admin/useChangeStatus";
import { ALL_STATUSES, statusLabel } from "@/config/customerStatus";
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
// `hide` = Tailwind class to hide the column on narrow screens
const COLUMNS = [
  { key: "company", label: "Company", sort: "company_name", hide: "" },
  { key: "owner", label: "Owner", sort: null, hide: "hidden md:table-cell" },
  { key: "email", label: "Email", sort: "contact_email", hide: "hidden lg:table-cell" },
  { key: "phone", label: "Phone", sort: null, hide: "hidden xl:table-cell" },
  { key: "subscription", label: "Subscription", sort: null, hide: "hidden lg:table-cell" },
  { key: "plan", label: "Plan", sort: null, hide: "hidden xl:table-cell" },
  { key: "onboarding", label: "Onboarding %", sort: null, hide: "hidden md:table-cell" },
  { key: "status", label: "Current Status", sort: "current_status", hide: "" },
  { key: "created", label: "Created", sort: "created_at", hide: "hidden lg:table-cell" },
  { key: "lastLogin", label: "Last Login", sort: "last_login_at", hide: "hidden xl:table-cell" },
  { key: "businessPhone", label: "Business Phone", sort: "business_phone", hide: "hidden lg:table-cell" },
  { key: "actions", label: "", sort: null, hide: "" },
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
  const { change } = useChangeStatus();

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

  const handleStatusChange = async (customerId, newStatus) => {
    const res = await change(customerId, newStatus, null);
    if (res.ok) {
      toast.success(`Status → ${statusLabel(newStatus)}`);
      refetch();
    } else {
      toast.error(res.message || "Could not change status.");
    }
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
                    {COLUMNS.map((col) => (
                      <th key={col.key} className={cn("whitespace-nowrap px-4 py-3 font-medium", col.hide)}>
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
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/admin/customers/${r.id}`)}
                      className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-secondary/40"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{r.company}</td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-ink md:table-cell">{r.owner}</td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground lg:table-cell">{r.email}</td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground xl:table-cell">
                        {r.ownerPhone ? formatPhone(r.ownerPhone) : "—"}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground lg:table-cell">
                        {r.subscriptionStatus || "—"}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground xl:table-cell">
                        {r.subscriptionStatus ? PLAN_LABEL : "—"}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 md:table-cell">
                        <OnboardingProgress status={r.currentStatus} compact />
                      </td>
                      <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                        <InlineStatusSelect
                          customerId={r.id}
                          currentStatus={r.currentStatus}
                          onChange={handleStatusChange}
                        />
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground lg:table-cell">
                        {formatDateTime(r.createdAt)}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground xl:table-cell">
                        {r.lastLoginAt ? formatDateTime(r.lastLoginAt) : "Never"}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground lg:table-cell">
                        {r.businessPhone ? formatPhone(r.businessPhone) : "—"}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <KebabMenu
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
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm">
              <span className="min-w-0 text-muted-foreground">
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

    </div>
  );
}

// Inline status dropdown — renders directly in the table cell.
function InlineStatusSelect({ customerId, currentStatus, onChange }) {
  const [saving, setSaving] = useState(false);
  const normalized = currentStatus?.toUpperCase() ?? "";

  const handleChange = async (val) => {
    setSaving(true);
    await onChange(customerId, val);
    setSaving(false);
  };

  return (
    <Select value={normalized} onValueChange={handleChange} disabled={saving}>
      <SelectTrigger className="h-8 min-w-[140px] border-border text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ALL_STATUSES.map((s) => (
          <SelectItem key={s} value={s} disabled={s === normalized} className="text-xs">
            {statusLabel(s)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Kebab menu with click-outside close. Row click handles navigation.
function KebabMenu({ onCopyEmail }) {
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

