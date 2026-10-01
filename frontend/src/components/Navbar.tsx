import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getDashboardLink = () => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "investigator") return "/investigator/dashboard";
    return "/customer/dashboard";
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to={isAuthenticated ? getDashboardLink() : "/login"} className="nav-brand">
          <div className="nav-brand-shield">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span>ClaimGuard <span style={{ color: "#67e8f9" }}>AI</span></span>
          <span className="nav-badge-ai">Enterprise</span>
        </Link>

        {isAuthenticated && (
          <div className="nav-links">
            {role === "customer" && (
              <>
                <NavLink to="/customer/dashboard" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  Dashboard
                </NavLink>
                <NavLink to="/customer/claims" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  My Claims
                </NavLink>
                <NavLink to="/customer/claims/new" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  + Submit Claim
                </NavLink>
              </>
            )}

            {role === "investigator" && (
              <>
                <NavLink to="/investigator/dashboard" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  Investigator Dashboard
                </NavLink>
                <NavLink to="/investigator/claims" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  Claims Queue
                </NavLink>
              </>
            )}

            {role === "admin" && (
              <>
                <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  Admin Console
                </NavLink>
                <NavLink to="/admin/claims" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  All Claims
                </NavLink>
              </>
            )}
          </div>
        )}

        <div className="nav-user">
          {isAuthenticated && user ? (
            <>
              <div className="user-pill">
                <div className="user-avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "#fff" }}>
                    {user.name || user.email}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                    {user.role}
                  </div>
                </div>
              </div>
              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                Log Out
              </button>
            </>
          ) : (
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Link to="/login" className="btn btn-outline btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
