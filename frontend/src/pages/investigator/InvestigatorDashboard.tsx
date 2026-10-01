import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { claimService } from "../../services/claimService";
import { Claim, ClaimStatistics } from "../../types";
import { MetricCard } from "../../components/MetricCard";
import { StatusBadge } from "../../components/StatusBadge";
import { RiskBadge } from "../../components/RiskBadge";
import { EmptyState } from "../../components/EmptyState";
import { AlertBanner } from "../../components/AlertBanner";

export const InvestigatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<Claim[]>([]);
  const [stats, setStats] = useState<ClaimStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
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
      setError(err.message || "Failed to load investigator dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let result = claims;

    if (riskFilter !== "ALL") {
      result = result.filter((c) => c.aiResult?.riskLevel === riskFilter);
    }

    if (statusFilter !== "ALL") {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.claimId.toLowerCase().includes(q) ||
          c.policyNumber.toLowerCase().includes(q) ||
          c.claimType.toLowerCase().includes(q)
      );
    }

    setFilteredClaims(result);
  }, [searchTerm, riskFilter, statusFilter, claims]);

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
            Investigator Workbench
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Claims Investigation Queue • Assigned Investigator:{" "}
            <span style={{ color: "#a5b4fc", fontWeight: 600 }}>{user?.name || user?.email}</span>
          </p>
        </div>

        <button onClick={loadData} className="btn btn-secondary btn-sm" title="Refresh queue">
          ↻ Refresh Queue
        </button>
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

      {/* Investigator Metrics */}
      <div className="metrics-grid">
        <MetricCard
          label="Total Assigned Claims"
          value={stats ? stats.totalClaims : "—"}
          subtitle="Cases in your jurisdiction"
          highlightColor="#6366f1"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          }
        />
        <MetricCard
          label="High Risk Flags"
          value={stats ? stats.highRiskClaims : "—"}
          subtitle="AI-designated high or critical risk"
          highlightColor="#ef4444"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          }
        />
        <MetricCard
          label="Under Review"
          value={stats ? stats.underInvestigation : "—"}
          subtitle="Active investigations"
          highlightColor="#f59e0b"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          }
        />
        <MetricCard
          label="Completed Reviews"
          value={stats ? stats.completedClaims : "—"}
          subtitle="Finalized investigation remarks"
          highlightColor="#10b981"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
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
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1, minWidth: "220px" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by Claim ID, Policy Number, or Claim Type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ minWidth: "160px" }}>
          <select
            className="form-select"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>
        </div>

        <div style={{ minWidth: "160px" }}>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Claim Statuses</option>
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

      {/* Claims Queue Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Investigation Queue ({filteredClaims.length})</h2>
            <p className="card-subtitle">Prioritized claims matching your investigation authority</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <div className="spinner"></div>
            <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
              Loading investigator claims queue...
            </p>
          </div>
        ) : filteredClaims.length === 0 ? (
          <EmptyState
            title={claims.length === 0 ? "No claims assigned" : "No claims match filters"}
            description={
              claims.length === 0
                ? "There are currently no claims in your investigation queue."
                : "Try adjusting your search criteria or resetting filters."
            }
            actionText={claims.length > 0 ? "Reset Filters" : undefined}
            onActionClick={
              claims.length > 0
                ? () => {
                    setSearchTerm("");
                    setRiskFilter("ALL");
                    setStatusFilter("ALL");
                  }
                : undefined
            }
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Policy Number</th>
                  <th>Type</th>
                  <th>Claimed Amount</th>
                  <th>Risk Score</th>
                  <th>Risk Level</th>
                  <th>Investigation Status</th>
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
                    <td>{claim.policyNumber}</td>
                    <td>{claim.claimType}</td>
                    <td style={{ fontWeight: 600, color: "#67e8f9" }}>
                      ₹{claim.claimedAmount.toLocaleString()}
                    </td>
                    <td>
                      {claim.aiResult ? (
                        <span style={{ fontWeight: 700, color: claim.aiResult.riskLevel === "HIGH" || claim.aiResult.riskLevel === "CRITICAL" ? "#f87171" : "#fff" }}>
                          {claim.aiResult.riskScore}/100
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Pending AI</span>
                      )}
                    </td>
                    <td>
                      {claim.aiResult?.riskLevel ? (
                        <RiskBadge level={claim.aiResult.riskLevel} />
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Unscored</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={claim.investigationStatus || "UNASSIGNED"} />
                    </td>
                    <td>
                      <Link
                        to={`/investigator/claims/${claim.claimId}`}
                        className="btn btn-primary btn-sm"
                      >
                        Inspect & Review →
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
