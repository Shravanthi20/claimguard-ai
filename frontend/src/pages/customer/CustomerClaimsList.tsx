import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { claimService } from "../../services/claimService";
import { Claim } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState } from "../../components/EmptyState";
import { AlertBanner } from "../../components/AlertBanner";

export const CustomerClaimsList: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoading(true);
        const data = await claimService.getClaims();
        setClaims(data);
        setFilteredClaims(data);
      } catch (err: any) {
        setError(err.message || "Failed to load claims.");
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
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
          c.claimType.toLowerCase().includes(q) ||
          (c.accidentDescription || c.description || "").toLowerCase().includes(q)
      );
    }

    setFilteredClaims(result);
  }, [searchTerm, statusFilter, claims]);

  return (
    <div className="main-content">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff" }}>My Insurance Claims</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Track your filed claims and evidence submissions
          </p>
        </div>

        <Link to="/customer/claims/new" className="btn btn-primary">
          + Submit New Claim
        </Link>
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

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
        <div style={{ flex: 1, minWidth: "240px" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by Claim ID, Policy Number, or Type..."
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

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <div className="spinner"></div>
          <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
            Loading your claims...
          </p>
        </div>
      ) : filteredClaims.length === 0 ? (
        <EmptyState
          title={claims.length === 0 ? "No claims found" : "No claims match your filters"}
          description={
            claims.length === 0
              ? "You haven't submitted any insurance claims yet. Click the button below to submit your first claim."
              : "Try adjusting your search criteria or resetting your status filter."
          }
          actionText={claims.length === 0 ? "Submit New Claim" : "Reset Filters"}
          actionLink={claims.length === 0 ? "/customer/claims/new" : undefined}
          onActionClick={
            claims.length > 0
              ? () => {
                  setSearchTerm("");
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
                <th>Claim Type</th>
                <th>Claimed Amount</th>
                <th>Incident Date</th>
                <th>Evidence Files</th>
                <th>Status</th>
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
                    {(claim.documents?.length || 0) + (claim.images?.length || 0)} files
                  </td>
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
  );
};
