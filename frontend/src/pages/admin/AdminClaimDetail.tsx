import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { claimService } from "../../services/claimService";
import { apiRequest } from "../../services/apiClient";
import { Claim } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { AIResultCard } from "../../components/AIResultCard";
import { RemarksSection } from "../../components/RemarksSection";
import { AlertBanner } from "../../components/AlertBanner";
import { Modal } from "../../components/Modal";
import { openEvidence } from "../../services/apiClient";

export const AdminClaimDetail: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Investigator assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [investigatorId, setInvestigatorId] = useState("");
  const [investigatorName, setInvestigatorName] = useState("");
  const [assigning, setAssigning] = useState(false);

  const fetchClaim = async () => {
    if (!claimId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await claimService.getClaim(claimId);
      setClaim(data);
    } catch (err: any) {
      setError(err.message || "Failed to load claim record.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaim();
  }, [claimId]);

  const handleAssignInvestigator = async () => {
    if (!claimId || !investigatorId.trim()) return;
    try {
      setAssigning(true);
      const updated = await apiRequest<Claim>(`/admin/claims/${claimId}/assign`, {
        method: "POST",
        body: JSON.stringify({
          investigatorId: investigatorId.trim(),
          investigatorName: investigatorName.trim() || undefined,
        }),
      });
      setClaim(updated);
      setShowAssignModal(false);
    } catch (err: any) {
      setError(err.message || "Failed to assign investigator.");
    } finally {
      setAssigning(false);
    }
  };

  const handleAddRemark = async (remark: string) => {
    if (!claimId) return;
    const res = await claimService.addInvestigatorRemark(claimId, `[ADMIN] ${remark}`);
    if (res.claim) {
      setClaim(res.claim);
    } else {
      await fetchClaim();
    }
  };

  if (loading) {
    return (
      <div className="main-content">
        <div style={{ textAlign: "center", padding: "5rem 0" }}>
          <div className="spinner"></div>
          <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
            Loading administrative record from DynamoDB...
          </p>
        </div>
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="main-content">
        <div className="card" style={{ maxWidth: 600, margin: "2rem auto", textAlign: "center" }}>
          <h2 style={{ color: "#ef4444", marginBottom: "0.5rem" }}>Record Not Found</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            {error || "Claim record not found."}
          </p>
          <Link to="/admin/claims" className="btn btn-primary">
            ← Return to Admin Console
          </Link>
        </div>
      </div>
    );
  }

  const allEvidence = [...(claim.documents || []), ...(claim.images || [])];

  return (
    <div className="main-content">
      {/* Top Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link to="/admin/claims" style={{ fontSize: "0.88rem", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
          ← Back to All Claims
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff" }}>
                Admin Oversight: {claim.claimId}
              </h1>
              <StatusBadge status={claim.status} />
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              Policy: <strong>{claim.policyNumber}</strong> • Claimant:{" "}
              <span style={{ fontFamily: "var(--font-mono)", color: "#a5b4fc" }}>{claim.customerId || claim.userId}</span>
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => setShowAssignModal(true)}
              className="btn btn-primary"
            >
              {claim.investigatorId ? "Reassign Investigator" : "Assign Investigator"}
            </button>
          </div>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

      {/* AI Assessment Card */}
      <AIResultCard
        aiResult={claim.aiResult}
        status={claim.status}
        isInvestigatorOrAdmin={true}
      />

      {/* Administrative Details Card */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div className="card-header">
          <h3 className="card-title">Claim Record Audit</h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Created: {new Date(claim.createdAt).toLocaleString()} • Updated:{" "}
            {new Date(claim.updatedAt).toLocaleString()}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Policy Number</div>
            <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "#fff", marginTop: "0.2rem" }}>{claim.policyNumber}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Incident Date</div>
            <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "#fff", marginTop: "0.2rem" }}>{claim.incidentDate}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Claim Type</div>
            <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "#fff", marginTop: "0.2rem" }}>{claim.claimType}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Claimed Amount</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#67e8f9", marginTop: "0.2rem" }}>
              ₹{claim.claimedAmount.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Assigned Investigator</div>
            <div style={{ fontSize: "1rem", fontWeight: 600, color: claim.investigatorId ? "#a5b4fc" : "var(--text-muted)", marginTop: "0.2rem" }}>
              {claim.investigatorName || claim.investigatorId || "Unassigned"}
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.4rem" }}>
            Reported Accident Details
          </div>
          <p style={{ color: "var(--text-primary)", fontSize: "0.95rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {claim.accidentDescription || claim.description}
          </p>
        </div>
      </div>

      {/* Evidence Files */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div className="card-header">
          <h3 className="card-title">S3 Evidence Files ({allEvidence.length})</h3>
        </div>

        {allEvidence.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
            No evidence files attached.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {allEvidence.map((file) => (
              <div
                key={file.fileId || file.s3Key}
                style={{
                  background: "rgba(15, 23, 42, 0.75)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "12px",
                  padding: "1rem",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#fff" }}>
                  {file.fileName}
                </div>
                <div style={{ marginTop: "0.75rem" }}>
                  <button type="button" onClick={() => openEvidence(file.url || "").catch((err) => setError(err.message))} disabled={!file.url} className="btn btn-secondary btn-sm" style={{ width: "100%", textAlign: "center" }}>
                    View File →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Remarks Section */}
      <RemarksSection
        remarks={claim.investigationRemarks || []}
        onAddRemark={handleAddRemark}
      />

      {/* Assign Investigator Modal */}
      <Modal
        isOpen={showAssignModal}
        title="Assign Claims Investigator"
        onClose={() => setShowAssignModal(false)}
        confirmText="Assign Case"
        onConfirm={handleAssignInvestigator}
        isLoading={assigning}
      >
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginBottom: "1rem" }}>
            Assign an authorized claims investigator to review claim <strong>{claim.claimId}</strong>:
          </p>

          <div className="form-group">
            <label className="form-label">Investigator Cognito User ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter investigator Cognito user ID"
              value={investigatorId}
              onChange={(e) => setInvestigatorId(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Investigator Full Name (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Investigator name"
              value={investigatorName}
              onChange={(e) => setInvestigatorName(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
