import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Authenticating with Amazon Cognito...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="main-content" style={{ textAlign: "center", paddingTop: "5rem" }}>
        <div className="card" style={{ maxWidth: 500, margin: "0 auto", padding: "2.5rem" }}>
          <div style={{ color: "#ef4444", fontSize: "3rem", marginBottom: "1rem" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 style={{ color: "#fff", marginBottom: "0.5rem" }}>403 - Access Denied</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            Your account ({user.email}) with role <strong>{role}</strong> does not have permission to view this resource.
          </p>
          <a
            href={
              role === "admin"
                ? "/admin/dashboard"
                : role === "investigator"
                ? "/investigator/dashboard"
                : "/customer/dashboard"
            }
            className="btn btn-primary"
          >
            Return to Authorized Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
