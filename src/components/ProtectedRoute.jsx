import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { FullPageSpinner } from "@/components/ui/spinner";

/** Gate routes that require an authenticated (non-admin) session. */
export function ProtectedRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  // Admins are read-only and never use the customer dashboard or setup wizard.
  if (isAdmin) return <Navigate to="/admin" replace />;
  return children;
}

/** Redirect already-authenticated users away from auth pages. */
export function PublicOnlyRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (user) return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  return children;
}

/** Gate routes that require an admin user. Non-admins are bounced to /dashboard. */
export function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}
