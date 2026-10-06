import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

const LandingPage = lazy(() => import("./pages/LandingPage").then((module) => ({ default: module.LandingPage })));
const LoginPage = lazy(() => import("./pages/auth/LoginPage").then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage").then((module) => ({ default: module.RegisterPage })));

const CustomerDashboard = lazy(() => import("./pages/customer/CustomerDashboard").then((module) => ({ default: module.CustomerDashboard })));
const CustomerClaimsList = lazy(() => import("./pages/customer/CustomerClaimsList").then((module) => ({ default: module.CustomerClaimsList })));
const CustomerNewClaim = lazy(() => import("./pages/customer/CustomerNewClaim").then((module) => ({ default: module.CustomerNewClaim })));
const CustomerClaimDetail = lazy(() => import("./pages/customer/CustomerClaimDetail").then((module) => ({ default: module.CustomerClaimDetail })));

const InvestigatorDashboard = lazy(() => import("./pages/investigator/InvestigatorDashboard").then((module) => ({ default: module.InvestigatorDashboard })));
const InvestigatorClaimsList = lazy(() => import("./pages/investigator/InvestigatorClaimsList").then((module) => ({ default: module.InvestigatorClaimsList })));
const InvestigatorClaimDetail = lazy(() => import("./pages/investigator/InvestigatorClaimDetail").then((module) => ({ default: module.InvestigatorClaimDetail })));

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard").then((module) => ({ default: module.AdminDashboard })));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers").then((module) => ({ default: module.AdminUsers })));
const AdminClaims = lazy(() => import("./pages/admin/AdminClaims").then((module) => ({ default: module.AdminClaims })));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics").then((module) => ({ default: module.AdminAnalytics })));

const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })));

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

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
        <Suspense fallback={<LoadingScreen />}>
          <AppContent />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
