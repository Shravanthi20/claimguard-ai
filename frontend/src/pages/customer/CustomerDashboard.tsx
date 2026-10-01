import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { claimService } from "../../services/claimService";
import { Claim, ClaimStatistics } from "../../types";
import { MetricCard } from "../../components/MetricCard";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState } from "../../components/EmptyState";
import { AlertBanner } from "../../components/AlertBanner";

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [stats, setStats] = useState<ClaimStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [claimsData, statsData] = await Promise.all([
        claimService.getClaims(),
        claimService.getStatistics(),
      ]);
      setClaims(claimsData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="main-content">
      {/* Welcome Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
            Welcome, {user?.name || user?.email}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "0.25rem" }}>
            Customer Claim Portal • Amazon Cognito Identity:{" "}
            <span style={{ fontFamily: "var(--font-mono)", color: "#a5b4fc", fontSize: "0.85rem" }}>
              {user?.userId}
            </span>
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={loadData} className="btn btn-secondary btn-sm" title="Refresh data">
            ↻ Refresh
          </button>
          <Link to="/customer/claims/new" className="btn btn-primary">
            + Submit New Claim
          </Link>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

      {/* Dynamic Statistics Grid */}
      <div className="metrics-grid">
        <MetricCard
          label="Total Claims"
          value={stats ? stats.totalClaims : "—"}
          subtitle="All filed insurance claims"
          highlightColor="#6366f1"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          }
        />
        <MetricCard
          label="Pending Processing"
          value={stats ? stats.pendingClaims : "—"}
          subtitle="In OCR & AI extraction stage"
          highlightColor="#06b6d4"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          }
        />
        <MetricCard
          label="Under Review"
          value={stats ? stats.underInvestigation : "—"}
          subtitle="With claims investigator"
          highlightColor="#f59e0b"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          }
        />
        <MetricCard
          label="Completed"
          value={stats ? stats.completedClaims : "—"}
          subtitle="Resolved & finalized claims"
          highlightColor="#10b981"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          }
        />
      </div>

      {/* Recent Claims Section */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Recent Claims</h2>
            <p className="card-subtitle">Your latest insurance claims and status updates</p>
          </div>
          {claims.length > 0 && (
            <Link to="/customer/claims" className="btn btn-outline btn-sm">
              View All Claims ({claims.length})
            </Link>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div className="spinner"></div>
            <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
              Fetching claims from DynamoDB...
            </p>
          </div>
        ) : claims.length === 0 ? (
          <EmptyState
            title="No claims found"
            description="You have not submitted any insurance claims yet. Create your first claim to get started with automated AI processing."
            actionText="Submit Your First Claim"
            actionLink="/customer/claims/new"
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Policy Number</th>
                  <th>Claim Type</th>
                  <th>Claimed Amount</th>
                  <th>Incident Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {claims.slice(0, 5).map((claim) => (
                  <tr key={claim.claimId}>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "#fff" }}>
                        {claim.claimId}
                      </span>
                    </td>
                    <td>{claim.policyNumber}</td>
                    <td>{claim.claimType}</td>
                    <td style={{ fontWeight: 600, color: "#67e8f9" }}>
                      ₹{claim.claimedAmount.toLocaleString()}
                    </td>
                    <td>{claim.incidentDate}</td>
                    <td>
                      <StatusBadge status={claim.status} />
                    </td>
                    <td>
                      <Link to={`/customer/claims/${claim.claimId}`} className="btn btn-outline btn-sm">
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
