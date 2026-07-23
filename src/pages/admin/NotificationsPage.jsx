import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/EmptyState";
import { SeverityIcon } from "@/components/admin/SeverityBadge";
import { ChipRow, PaginationBar } from "@/components/admin/ListControls";
import { useNotificationsList } from "@/hooks/admin/useNotificationsList";
import { formatDateTime } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "CRITICAL", label: "Critical" },
  { key: "WARNING", label: "Warning" },
  { key: "INFO", label: "Info" },
];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [filter, setFilter] = useState("all");

  const { rows, total, loading, error, setRead, markAllRead } = useNotificationsList({ page, pageSize, filter });
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ChipRow
          options={FILTERS}
          value={filter}
          onChange={(k) => {
            setFilter(k);
            setPage(0);
          }}
        />
        <Button size="sm" variant="secondary" onClick={markAllRead}>
          <Check className="h-4 w-4" /> Mark all read
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-secondary" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">Couldn't load notifications.</div>
          ) : rows.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications" description="Nothing matches this filter." />
          ) : (
            <ul>
              {rows.map((n) => (
                <li
                  key={n.id}
                  className={"flex items-start gap-3 border-b border-border/60 px-4 py-3 last:border-0 " + (!n.read_at ? "bg-brand-50/30" : "")}
                >
                  <SeverityIcon severity={n.severity} />
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => n.metadata?.link && navigate(n.metadata.link)}
                  >
                    <div className="flex items-center gap-2">
                      {!n.read_at && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                      <p className="font-medium text-ink">{n.title}</p>
                    </div>
                    {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(n.created_at)}</p>
                  </button>
                  <button
                    onClick={() => setRead(n.id, !n.read_at)}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-secondary"
                  >
                    {n.read_at ? "Mark unread" : "Mark read"}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!loading && !error && rows.length > 0 && (
            <PaginationBar
              page={page}
              pageCount={pageCount}
              pageSize={pageSize}
              total={total}
              onPage={setPage}
              onPageSize={(n) => {
                setPageSize(n);
                setPage(0);
              }}
              noun="notifications"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
