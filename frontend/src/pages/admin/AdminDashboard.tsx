import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { claimService } from "../../services/claimService";
import { Claim, ClaimStatistics } from "../../types";
import { MetricCard } from "../../components/MetricCard";
import { StatusBadge } from "../../components/StatusBadge";
import { RiskBadge } from "../../components/RiskBadge";
import { EmptyState } from "../../components/EmptyState";
import { AlertBanner } from "../../components/AlertBanner";

export const AdminDashboard: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<Claim[]>([]);
  const [stats, setStats] = useState<ClaimStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [claimsData, statsData] = await Promise.all([
        claimService.getClaims(),
        claimService.getStatistics(),
      ]);
      setClaims(claimsData);
      setFilteredClaims(claimsData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || "Failed to load admin console data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let result = claims;

    if (statusFilter !== "ALL") {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.claimId.toLowerCase().includes(q) ||
          c.policyNumber.toLowerCase().includes(q) ||
          (c.customerId || c.userId || "").toLowerCase().includes(q) ||
          c.claimType.toLowerCase().includes(q)
      );
    }

    setFilteredClaims(result);
  }, [searchTerm, statusFilter, claims]);

  return (
    <div className="main-content">
      {/* Header */}
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
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff" }}>
            Administrator Governance Console
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Platform Overview • Amazon DynamoDB & Cognito Identity Auditing
          </p>
        </div>

        <button onClick={loadData} className="btn btn-secondary btn-sm" title="Refresh data">
          ↻ Refresh Console
        </button>
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

      {/* Metrics */}
      <div className="metrics-grid">
        <MetricCard
          label="Total System Claims"
          value={stats ? stats.totalClaims : "—"}
          subtitle="All platform records"
          highlightColor="#6366f1"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          }
        />
        <MetricCard
          label="Requires Attention"
          value={stats ? stats.requiresAttention : "—"}
          subtitle="Flagged or escalated"
          highlightColor="#ef4444"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          }
        />
        <MetricCard
          label="Under Review"
          value={stats ? stats.underInvestigation : "—"}
          subtitle="In investigator queue"
          highlightColor="#f59e0b"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          }
        />
        <MetricCard
          label="High Risk Claims"
          value={stats ? stats.highRiskClaims : "—"}
          subtitle="AI-designated high or critical risk"
          highlightColor="#e11d48"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          }
        />
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: "1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: "240px" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by Claim ID, Policy Number, Customer ID, or Type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ minWidth: "180px" }}>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="PROCESSING">Processing</option>
            <option value="AI_ANALYSIS">AI Analysis</option>
            <option value="UNDER_INVESTIGATION">Under Investigation</option>
            <option value="REVIEW">Review</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* All Claims Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">All Claims Database Records ({filteredClaims.length})</h2>
            <p className="card-subtitle">Real-time scan of DynamoDB ClaimGuardClaims table</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <div className="spinner"></div>
            <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
              Scanning DynamoDB table...
            </p>
          </div>
        ) : filteredClaims.length === 0 ? (
          <EmptyState
            title={claims.length === 0 ? "DynamoDB Table Empty" : "No matching claims found"}
            description={
              claims.length === 0
                ? "There are currently zero claim records in the database."
                : "Try adjusting your search criteria."
            }
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Customer ID</th>
                  <th>Policy Number</th>
                  <th>Type</th>
                  <th>Claimed Amount</th>
                  <th>Risk Level</th>
                  <th>Status</th>
                  <th>Assigned Investigator</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim) => (
                  <tr key={claim.claimId}>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "#fff" }}>
                        {claim.claimId}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                        {claim.customerId || claim.userId}
                      </span>
                    </td>
                    <td>{claim.policyNumber}</td>
                    <td>{claim.claimType}</td>
                    <td style={{ fontWeight: 600, color: "#67e8f9" }}>
                      ₹{claim.claimedAmount.toLocaleString()}
                    </td>
                    <td>
                      {claim.aiResult?.riskLevel ? (
                        <RiskBadge level={claim.aiResult.riskLevel} />
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Pending</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={claim.status} />
                    </td>
                    <td>
                      {claim.investigatorId ? (
                        <span style={{ color: "#a5b4fc", fontSize: "0.85rem" }}>
                          {claim.investigatorName || claim.investigatorId}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td>
                      <Link
                        to={`/admin/claims/${claim.claimId}`}
                        className="btn btn-outline btn-sm"
                      >
                        Manage →
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
