import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useEmailHealth } from "@/hooks/admin/useEmailHealth";

// Red banner shown across every admin page whenever the Gmail integration is not
// CONNECTED. Reads the singleton via the shared hook. Renders nothing while
// loading or when healthy.
export function GmailWarningBanner() {
  const { data, loading } = useEmailHealth();
  if (loading || !data || data.status === "CONNECTED") return null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 lg:px-6">
      <span className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        Gmail integration is <strong>{data.status}</strong> — notification emails can't be sent.
      </span>
      <Link
        to="/admin/integrations/email"
        className="shrink-0 rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
      >
        Fix now
      </Link>
    </div>
  );
}
