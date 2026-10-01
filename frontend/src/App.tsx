import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Auth Pages
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
import { AdminClaimDetail } from "./pages/admin/AdminClaimDetail";

// 404
import { NotFoundPage } from "./pages/NotFoundPage";

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p style={{ color: "var(--text-secondary)" }}>Initializing ClaimGuard AI...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (role === "investigator") return <Navigate to="/investigator/dashboard" replace />;
  return <Navigate to="/customer/dashboard" replace />;
};

export const AppContent: React.FC = () => {
  return (
    <div className="app-container">
      <Navbar />
      <Routes>
        {/* Root Redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public Authentication Routes */}
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
          path="/customer/claims/:claimId"
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
          path="/investigator/claims/:claimId"
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
          path="/admin/claims"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/claims/:claimId"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminClaimDetail />
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
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
