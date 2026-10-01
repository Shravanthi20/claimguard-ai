import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { claimService } from "../../services/claimService";
import { Claim } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { RiskBadge } from "../../components/RiskBadge";
import { EmptyState } from "../../components/EmptyState";
import { AlertBanner } from "../../components/AlertBanner";

export const InvestigatorClaimsList: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [investigationFilter, setInvestigationFilter] = useState("ALL");

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoading(true);
        const data = await claimService.getClaims();
        setClaims(data);
        setFilteredClaims(data);
      } catch (err: any) {
        setError(err.message || "Failed to load claims queue.");
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, []);

  useEffect(() => {
    let result = claims;

    if (riskFilter !== "ALL") {
      result = result.filter((c) => c.aiResult?.riskLevel === riskFilter);
    }

    if (investigationFilter !== "ALL") {
      result = result.filter((c) => c.investigationStatus === investigationFilter);
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
  }, [searchTerm, riskFilter, investigationFilter, claims]);

  return (
    <div className="main-content">
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff" }}>
          Full Claims Investigation Queue
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Filter and examine assigned insurance claims requiring forensic analysis and remarks
        </p>
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

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
        <div style={{ flex: 1, minWidth: "220px" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by Claim ID, Policy Number, or Type..."
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

        <div style={{ minWidth: "180px" }}>
          <select
            className="form-select"
            value={investigationFilter}
            onChange={(e) => setInvestigationFilter(e.target.value)}
          >
            <option value="ALL">All Investigation Statuses</option>
            <option value="UNASSIGNED">Unassigned</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ADDITIONAL_INFORMATION_REQUIRED">Info Required</option>
            <option value="INVESTIGATION_COMPLETED">Completed</option>
            <option value="ESCALATED">Escalated</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <div className="spinner"></div>
          <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
            Loading claims records...
          </p>
        </div>
      ) : filteredClaims.length === 0 ? (
        <EmptyState
          title="No claims match your criteria"
          description="Try broadening your search term or selecting 'All Risk Levels'."
          actionText="Reset Filters"
          onActionClick={() => {
            setSearchTerm("");
            setRiskFilter("ALL");
            setInvestigationFilter("ALL");
          }}
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
                <th>Incident Date</th>
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
                  <td>{claim.incidentDate}</td>
                  <td>
                    {claim.aiResult?.riskLevel ? (
                      <RiskBadge level={claim.aiResult.riskLevel} />
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Pending</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={claim.investigationStatus || "UNASSIGNED"} />
                  </td>
                  <td>
                    <Link
                      to={`/investigator/claims/${claim.claimId}`}
                      className="btn btn-outline btn-sm"
                    >
                      Inspect Claim →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
