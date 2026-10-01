import React from "react";
import { Link } from "react-router-dom";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="main-content" style={{ textAlign: "center", paddingTop: "5rem" }}>
      <div className="card" style={{ maxWidth: 480, margin: "0 auto", padding: "2.5rem" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 800, color: "#6366f1", marginBottom: "0.5rem" }}>404</h1>
        <h2 style={{ color: "#fff", marginBottom: "0.5rem" }}>Page Not Found</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
          The requested page does not exist or has been relocated.
        </p>
        <Link to="/" className="btn btn-primary">
          Return to Home
        </Link>
      </div>
    </div>
  );
};
