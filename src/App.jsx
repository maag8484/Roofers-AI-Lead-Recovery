import { Routes, Route } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute, AdminRoute } from "@/components/ProtectedRoute";

import LandingPage from "@/pages/LandingPage";
import HomeV2Page from "@/pages/home-v2/HomeV2Page";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OnboardingPage from "@/pages/OnboardingPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import DashboardPage from "@/pages/DashboardPage";
import AccountPage from "@/pages/AccountPage";
import BillingPage from "@/pages/BillingPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import PrivacyPage from "@/pages/legal/PrivacyPage";
import TermsPage from "@/pages/legal/TermsPage";
import NotFoundPage from "@/pages/NotFoundPage";

// Admin console (Phase 1 shell + placeholder pages)
import { AdminShell } from "@/components/admin/layout/AdminShell";
import AdminDashboardOverviewPage from "@/pages/admin/DashboardPage";
import AdminCustomersPage from "@/pages/admin/CustomersPage";
import AdminCustomerDetailPage from "@/pages/admin/CustomerDetailPage";
import AdminOnboardingPage from "@/pages/admin/OnboardingPage";
import AdminIntegrationsEmailPage from "@/pages/admin/IntegrationsEmailPage";
import AdminAuditPage from "@/pages/admin/AuditPage";
import AdminNotificationsPage from "@/pages/admin/NotificationsPage";
import AdminBillingPage from "@/pages/admin/BillingPage";
import AdminSettingsPage from "@/pages/admin/SettingsPage";

export default function App() {
  return (
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
        <Route path="integrations/email" element={<AdminIntegrationsEmailPage />} />
        <Route path="audit" element={<AdminAuditPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="billing" element={<AdminBillingPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="legacy" element={<AdminDashboardPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
