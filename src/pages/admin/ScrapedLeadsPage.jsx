import { Fragment, useState, useCallback } from "react";
import {
  Database,
  Search,
  Mail,
  MailX,
  MessageSquare,
  Reply,
  Ban,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { useScrapedLeads } from "@/hooks/admin/useScrapedLeads";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

// ─── constants ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "replied", label: "Replied" },
  { value: "converted", label: "Converted" },
  { value: "opted_out", label: "Opted out" },
];

const OUTREACH_OPTIONS = [
  { value: "", label: "All outreach" },
  { value: "no_outreach", label: "No outreach yet" },
  { value: "sms_sent", label: "SMS sent" },
  { value: "email_sent", label: "Email sent" },
  { value: "has_email", label: "Has email on file" },
  { value: "no_email", label: "No email on file" },
  { value: "replied", label: "Replied" },
  { value: "opted_out", label: "Opted out" },
];

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function BoolIcon({ value }) {
  if (value === true)
    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  return <XCircle className="h-4 w-4 text-muted-foreground/40" />;
}

function StatusPill({ status }) {
  const map = {
    new: "bg-amber-100 text-amber-700",
    contacted: "bg-brand-100 text-brand-700",
    replied: "bg-emerald-100 text-emerald-700",
    converted: "bg-purple-100 text-purple-700",
    opted_out: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        map[status] ?? "bg-secondary text-muted-foreground"
      )}
    >
      {status ?? "—"}
    </span>
  );
}

// Sequence badge: day1 / day2 / day4 progress.
//
// A scraped lead often has no owner email — Outscraper found the business but
// not a contact address. The email legs of the sequence can never run for those
// rows, so showing greyed-out "D1/D2/D4 Email" chips reads as "not sent yet"
// when the truth is "not sendable at all". Those rows drop the email chips
// entirely and get a single "No email" tag instead.
function OutreachSequence({ row }) {
  const hasEmail = Boolean((row.owner_email || "").trim());

  const steps = [
    { label: "D1 SMS", done: row.sms_sent },
    { label: "D1 Email", done: row.email_sent, email: true },
    { label: "D2 SMS", done: row.day2_sms_sent },
    { label: "D2 Email", done: row.day2_email_sent, email: true },
    { label: "D4 SMS", done: row.day4_sms_sent },
    { label: "D4 Email", done: row.day4_email_sent, email: true },
  ].filter((s) => hasEmail || !s.email);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {steps.map((s) => (
        <span
          key={s.label}
          className={cn(
            "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium",
            s.done
              ? "bg-emerald-100 text-emerald-700"
              : "bg-secondary text-muted-foreground"
          )}
        >
          {s.label}
        </span>
      ))}
      {!hasEmail && (
        <span
          className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700"
          title="No owner email on this lead — the email steps can't run"
        >
          <MailX className="h-3 w-3" />
          No email
        </span>
      )}
    </div>
  );
}

// ─── KPI summary bar ────────────────────────────────────────────────────────

function KpiBar({ data, total }) {
  const sms = data.filter((r) => r.sms_sent).length;
  const email = data.filter((r) => r.email_sent).length;
  const replied = data.filter((r) => r.reply_received).length;
  const optedOut = data.filter((r) => r.opted_out).length;

  const items = [
    { label: "Total scraped", value: total, icon: Database },
    { label: "SMS sent (this page)", value: sms, icon: MessageSquare },
    { label: "Email sent (this page)", value: email, icon: Mail },
    { label: "Replied (this page)", value: replied, icon: Reply },
    { label: "Opted out (this page)", value: optedOut, icon: Ban },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="text-xs">{item.label}</span>
            </div>
            <p className="mt-1 text-2xl font-extrabold text-ink">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── main page ──────────────────────────────────────────────────────────────

export default function ScrapedLeadsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [outreachFilter, setOutreachFilter] = useState("");
  const [expanded, setExpanded] = useState(null); // row id expanded for detail

  const { data, total, loading, error, pageSize } = useScrapedLeads({
    page,
    search,
    statusFilter,
    outreachFilter,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      setPage(1);
      setSearch(searchInput);
    },
    [searchInput]
  );

  const handleFilterChange = useCallback((setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Scraped Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Roofing companies scraped via Outscraper + n8n. Read-only view — outreach
          is managed by n8n workflows.
        </p>
      </div>

      {/* KPIs */}
      <KpiBar data={data} total={total} />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search company, city, owner name/email…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={handleFilterChange(setStatusFilter)}
              className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 sm:flex-none"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              value={outreachFilter}
              onChange={handleFilterChange(setOutreachFilter)}
              className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 sm:flex-none"
            >
              {OUTREACH_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="h-9 w-full rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 transition-colors sm:w-auto"
            >
              Search
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner className="h-6 w-6" />
            </div>
          ) : error ? (
            <div className="py-12 text-center text-sm text-red-600">
              Error loading leads: {error}
            </div>
          ) : data.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              No leads found for the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground sm:px-4">Company</th>
                    <th className="hidden px-4 py-3 text-left font-semibold text-muted-foreground md:table-cell">City</th>
                    <th className="hidden px-4 py-3 text-left font-semibold text-muted-foreground lg:table-cell">Owner</th>
                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground sm:px-4">Status</th>
                    <th className="hidden px-4 py-3 text-left font-semibold text-muted-foreground md:table-cell">Outreach sequence</th>
                    <th className="hidden px-4 py-3 text-center font-semibold text-muted-foreground lg:table-cell">Reply</th>
                    <th className="hidden px-4 py-3 text-center font-semibold text-muted-foreground lg:table-cell">Opt-out</th>
                    <th className="hidden px-4 py-3 text-left font-semibold text-muted-foreground xl:table-cell">Scraped</th>
                    <th className="px-2 py-3 sm:px-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((row) => (
                    <Fragment key={row.id}>
                      <tr
                        className="hover:bg-secondary/30 cursor-pointer transition-colors"
                        onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                      >
                        <td className="px-3 py-3 sm:px-4">
                          <p className="font-medium text-ink">{row.company_name}</p>
                          {row.phone && (
                            <p className="text-xs text-muted-foreground">{row.phone}</p>
                          )}
                          {/* Columns hidden at this breakpoint fold into the
                              company cell so a narrow screen still identifies
                              the lead without horizontal scrolling. */}
                          <p className="text-xs text-muted-foreground md:hidden">
                            {row.city || "—"}
                          </p>
                          <div className="mt-1.5 md:hidden">
                            <OutreachSequence row={row} />
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                          {row.city || "—"}
                        </td>
                        <td className="hidden px-4 py-3 lg:table-cell">
                          <p className="text-ink">{row.owner_name || "—"}</p>
                          {row.owner_email && (
                            <p className="text-xs text-muted-foreground">{row.owner_email}</p>
                          )}
                        </td>
                        <td className="px-3 py-3 sm:px-4">
                          <StatusPill status={row.status} />
                        </td>
                        <td className="hidden px-4 py-3 md:table-cell">
                          <OutreachSequence row={row} />
                        </td>
                        <td className="hidden px-4 py-3 text-center lg:table-cell">
                          <BoolIcon value={row.reply_received} />
                        </td>
                        <td className="hidden px-4 py-3 text-center lg:table-cell">
                          <BoolIcon value={row.opted_out} />
                        </td>
                        <td className="hidden px-4 py-3 text-xs text-muted-foreground whitespace-nowrap xl:table-cell">
                          {fmt(row.sourced_at || row.created_at)}
                        </td>
                        <td className="px-2 py-3 text-right sm:px-4">
                          <span className="text-xs text-muted-foreground">
                            {expanded === row.id ? "▲" : "▼"}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {expanded === row.id && (
                        <tr className="bg-secondary/20">
                          <td colSpan={9} className="px-4 py-4 sm:px-6">
                            <div className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                              <Detail label="Address" value={row.address} />
                              <Detail label="Website" value={row.website} link />
                              <Detail label="Source" value={row.source} />
                              <Detail
                                label="Email verified"
                                value={row.email_verified ? "Yes" : "No"}
                              />
                              <Detail
                                label="SMS only"
                                value={row.sms_only ? "Yes" : "No"}
                              />
                              <Detail label="Reply channel" value={row.reply_channel} />
                              <Detail
                                label="Enriched at"
                                value={fmt(row.enriched_at)}
                              />
                              <Detail
                                label="Day 1 SMS"
                                value={
                                  row.sms_sent
                                    ? `Sent ${fmt(row.sms_sent_at)}`
                                    : "Not sent"
                                }
                              />
                              <Detail
                                label="Day 1 Email"
                                value={
                                  row.email_sent
                                    ? `Sent ${fmt(row.email_sent_at)}`
                                    : row.owner_email
                                      ? "Not sent"
                                      : "No email on file"
                                }
                              />
                              <Detail
                                label="Day 2 SMS"
                                value={
                                  row.day2_sms_sent
                                    ? `Sent ${fmt(row.day2_sms_sent_at)}`
                                    : "Not sent"
                                }
                              />
                              <Detail
                                label="Day 2 Email"
                                value={
                                  row.day2_email_sent
                                    ? `Sent ${fmt(row.day2_email_sent_at)}`
                                    : row.owner_email
                                      ? "Not sent"
                                      : "No email on file"
                                }
                              />
                              <Detail
                                label="Day 4 SMS"
                                value={
                                  row.day4_sms_sent
                                    ? `Sent ${fmt(row.day4_sms_sent_at)}`
                                    : "Not sent"
                                }
                              />
                              <Detail
                                label="Day 4 Email"
                                value={
                                  row.day4_email_sent
                                    ? `Sent ${fmt(row.day4_email_sent_at)}`
                                    : row.owner_email
                                      ? "Not sent"
                                      : "No email on file"
                                }
                              />
                              {row.reply_received && (
                                <Detail
                                  label="Reply received"
                                  value={fmt(row.reply_received_at)}
                                />
                              )}
                              {row.opted_out && (
                                <Detail
                                  label="Opted out"
                                  value={fmt(row.opted_out_at)}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && total > pageSize && (
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of{" "}
            {total.toLocaleString()} leads
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
            >
              Previous
            </button>
            <span className="flex items-center px-2">
              Page {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, link }) {
  if (!value || value === "—") return null;
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {link && value ? (
        <a
          href={value.startsWith("http") ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-brand-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {value} <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <p className="text-ink">{value}</p>
      )}
    </div>
  );
}
