import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Public Pages
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";

// Customer Pages
import { CustomerDashboard } from "./pages/customer/CustomerDashboard";
import { CustomerClaimsList } from "./pages/customer/CustomerClaimsList";
import { CustomerNewClaim } from "./pages/customer/CustomerNewClaim";
import { CustomerClaimDetail } from "./pages/customer/CustomerClaimDetail";

// Investigator Pages
import { InvestigatorDashboard } from "./pages/investigator/InvestigatorDashboard";
import { InvestigatorClaimsList } from "./pages/investigator/InvestigatorClaimsList";
import { InvestigatorClaimDetail } from "./pages/investigator/InvestigatorClaimDetail";

// Admin Pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminClaims } from "./pages/admin/AdminClaims";
import { AdminAnalytics } from "./pages/admin/AdminAnalytics";

// 404
import { NotFoundPage } from "./pages/NotFoundPage";

export const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Customer Routes */}
      <Route
        path="/customer/dashboard"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/claims"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <CustomerClaimsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/claims/new"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <CustomerNewClaim />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/claims/:id"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <CustomerClaimDetail />
          </ProtectedRoute>
        }
      />

      {/* Protected Investigator Routes */}
      <Route
        path="/investigator/dashboard"
        element={
          <ProtectedRoute allowedRoles={["investigator"]}>
            <InvestigatorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/investigator/claims"
        element={
          <ProtectedRoute allowedRoles={["investigator"]}>
            <InvestigatorClaimsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/investigator/claims/:id"
        element={
          <ProtectedRoute allowedRoles={["investigator"]}>
            <InvestigatorClaimDetail />
          </ProtectedRoute>
        }
      />

      {/* Protected Administrator Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/claims"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminClaims />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminAnalytics />
          </ProtectedRoute>
        }
      />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
