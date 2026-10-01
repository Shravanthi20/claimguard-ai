import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AlertBanner } from "../../components/AlertBanner";
import { Modal } from "../../components/Modal";

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verification code modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const { register, confirm } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please complete all required fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await register(name, email, password);

      if (res.requiresConfirmation) {
        setShowConfirmModal(true);
      } else {
        navigate("/login", { state: { registered: true } });
      }
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async () => {
    if (!verificationCode.trim()) {
      setConfirmError("Please enter the verification code.");
      return;
    }

    try {
      setConfirming(true);
      setConfirmError(null);
      await confirm(email, verificationCode);
      setShowConfirmModal(false);
      navigate("/login", { state: { registered: true } });
    } catch (err: any) {
      setConfirmError(err.message || "Invalid verification code.");
    } finally {
      setConfirming(false);
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
            Create Your Account
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginTop: "0.35rem" }}>
            Join the ClaimGuard AI Claims & Risk Assessment Platform
          </p>
        </div>

        {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
                Registering with Cognito...
              </>
            ) : (
              "Complete Registration"
            )}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ fontWeight: 600, color: "#818cf8" }}>
            Sign In
          </Link>
        </div>
      </div>

      {/* Confirmation Code Modal */}
      <Modal
        isOpen={showConfirmModal}
        title="Verify Your Email Address"
        onClose={() => setShowConfirmModal(false)}
        confirmText="Verify Account"
        onConfirm={handleConfirmCode}
        isLoading={confirming}
      >
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginBottom: "1rem" }}>
            A confirmation code has been sent to <strong>{email}</strong> via Amazon Cognito. Please enter it below to activate your account.
          </p>

          {confirmError && (
            <div className="form-error" style={{ marginBottom: "1rem" }}>
              {confirmError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Verification Code</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter the confirmation code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
