import { Routes, Route } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute, AdminRoute } from "@/components/ProtectedRoute";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import TwilioSetupPage from "@/pages/setup/TwilioSetupPage";
import CalendarSetupPage from "@/pages/setup/CalendarSetupPage";
import DashboardPage from "@/pages/DashboardPage";
import BillingPage from "@/pages/BillingPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import PrivacyPage from "@/pages/legal/PrivacyPage";
import TermsPage from "@/pages/legal/TermsPage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      {/* Public marketing + legal */}
      <Route path="/" element={<LandingPage />} />
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

      {/* Setup wizard (auth required) */}
      <Route
        path="/setup/twilio"
        element={
          <ProtectedRoute>
            <TwilioSetupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/setup/calendar"
        element={
          <ProtectedRoute>
            <CalendarSetupPage />
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

      {/* Billing (auth required) */}
      <Route
        path="/billing"
        element={
          <ProtectedRoute>
            <BillingPage />
          </ProtectedRoute>
        }
      />

      {/* Admin (admin role required) */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
