import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AlertBanner } from "../../components/AlertBanner";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await login(email, password);

      // Navigate based on authenticated role
      const userRole = res.user.role;
      if (userRole === "admin") {
        navigate("/admin/dashboard");
      } else if (userRole === "investigator") {
        navigate("/investigator/dashboard");
      } else {
        navigate("/customer/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div
            style={{
              width: "48px",
              height: "48px",
              margin: "0 auto 1rem",
              background: "linear-gradient(135deg, #6366f1, #06b6d4)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
            Sign In to ClaimGuard AI
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginTop: "0.35rem" }}>
            Amazon Cognito Authenticated Enterprise Portal
          </p>
        </div>

        {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

        {location.state?.registered && (
          <AlertBanner
            type="success"
            message="Registration verified successfully! Please log in with your credentials."
          />
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.85rem", marginTop: "0.5rem" }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18 }}></div>
                Authenticating...
              </>
            ) : (
              "Sign In with Cognito"
            )}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ fontWeight: 600, color: "#818cf8" }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
