import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute, AdminRoute } from "@/components/ProtectedRoute";

const LandingPage = lazy(() => import("@/pages/LandingPage"));
import HomeV2Page from "@/pages/home-v2/HomeV2Page";
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const SignupPage = lazy(() => import("@/pages/SignupPage"));
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage"));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const AccountPage = lazy(() => import("@/pages/AccountPage"));
const BillingPage = lazy(() => import("@/pages/BillingPage"));
const AdminDashboardPage = lazy(() => import("@/pages/AdminDashboardPage"));
const PrivacyPage = lazy(() => import("@/pages/legal/PrivacyPage"));
const TermsPage = lazy(() => import("@/pages/legal/TermsPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
import { Seo } from "@/components/Seo";

// Admin console (Phase 1 shell + placeholder pages)
const AdminShell = lazy(() => import("@/components/admin/layout/AdminShell").then((module) => ({ default: module.AdminShell })));
const AdminDashboardOverviewPage = lazy(() => import("@/pages/admin/DashboardPage"));
const AdminCustomersPage = lazy(() => import("@/pages/admin/CustomersPage"));
const AdminCustomerDetailPage = lazy(() => import("@/pages/admin/CustomerDetailPage"));
const AdminOnboardingPage = lazy(() => import("@/pages/admin/OnboardingPage"));
const AdminScrapedLeadsPage = lazy(() => import("@/pages/admin/ScrapedLeadsPage"));
const AdminAuditPage = lazy(() => import("@/pages/admin/AuditPage"));
const AdminAuditRequestsPage = lazy(() => import("@/pages/admin/AuditRequestsPage"));
const AdminNotificationsPage = lazy(() => import("@/pages/admin/NotificationsPage"));
const AdminBillingPage = lazy(() => import("@/pages/admin/BillingPage"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/SettingsPage"));

function RouteBoundary({ children }) {
  const { pathname } = useLocation();
  // The homepage is eagerly imported and pre-rendered. Keeping it outside a
  // Suspense boundary lets the existing auth effect settle without replacing
  // the page before React finishes hydration. Lazy app routes retain loading UI.
  return pathname === "/" ? children : (
    <Suspense fallback={<div role="status" className="grid min-h-screen place-items-center text-sm text-slate-600">Loading…</div>}>
      {children}
    </Suspense>
  );
}

export default function App() {
  return (
    <>
      <Seo />
      <RouteBoundary>
      <Routes>
        {/* Public marketing + legal. HomeV2Page is the live landing page; the
          previous one stays reachable at /home-v1 for comparison/rollback. */}
      <Route path="/" element={<HomeV2Page />} />
      <Route path="/home-v1" element={<LandingPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />

      {/* Password reset target (recovery session lands here from the email link) */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Auth (redirect away if already signed in) */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <SignupPage />
          </PublicOnlyRoute>
        }
      />

      {/* Payment (auth required) — step 2 of the new flow */}
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />

      {/* Post-payment business details form (auth required) — step 3 */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* App (auth required) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Account overview (auth required) */}
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        }
      />

      {/* Billing (auth required) */}
      <Route
        path="/billing"
        element={
          <ProtectedRoute>
            <BillingPage />
          </ProtectedRoute>
        }
      />

      {/* Admin console (admin role required) — nested under the persistent
          AdminShell layout. The legacy tabbed admin stays at /admin/legacy
          until Phase 3 folds it into the new Dashboard. */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminShell />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardOverviewPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="customers/:id" element={<AdminCustomerDetailPage />} />
        <Route path="onboarding" element={<AdminOnboardingPage />} />
        <Route path="scraped-leads" element={<AdminScrapedLeadsPage />} />
        <Route path="audit" element={<AdminAuditPage />} />
        <Route path="audit-requests" element={<AdminAuditRequestsPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="billing" element={<AdminBillingPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="legacy" element={<AdminDashboardPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </RouteBoundary>
    </>
  );
}
