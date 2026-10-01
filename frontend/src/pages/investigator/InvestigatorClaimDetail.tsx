import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { claimService } from "../../services/claimService";
import { Claim, InvestigationStatus } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { AIResultCard } from "../../components/AIResultCard";
import { RemarksSection } from "../../components/RemarksSection";
import { AlertBanner } from "../../components/AlertBanner";
import { Modal } from "../../components/Modal";
import { openEvidence } from "../../services/apiClient";

export const InvestigatorClaimDetail: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status update modal & state
  const [selectedStatus, setSelectedStatus] = useState<InvestigationStatus>("UNDER_REVIEW");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchClaim = async () => {
    if (!claimId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await claimService.getClaimWithAI(claimId);
      setClaim(data);
      if (data.investigationStatus) {
        setSelectedStatus(data.investigationStatus);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load claim for investigation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaim();
  }, [claimId]);

  useEffect(() => {
    if (!claimId || !claim || claim.aiResult || !["SUBMITTED", "PROCESSING", "AI_ANALYSIS"].includes(claim.status)) return;
    const interval = window.setInterval(async () => {
      try {
        setClaim(await claimService.getClaimWithAI(claimId));
      } catch (err: any) {
        setError(err.message || "Failed to refresh claim status.");
      }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [claimId, claim?.status, claim?.aiResult]);

  const handleUpdateStatus = async () => {
    if (!claimId) return;
    try {
      setUpdatingStatus(true);
      const updated = await claimService.updateInvestigationStatus(claimId, selectedStatus);
      setClaim(updated);
      setShowStatusModal(false);
    } catch (err: any) {
      setError(err.message || "Failed to update investigation status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddRemark = async (remark: string) => {
    if (!claimId) return;
    const res = await claimService.addInvestigatorRemark(claimId, remark);
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
            Loading claim records from DynamoDB and S3...
          </p>
        </div>
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="main-content">
        <div className="card" style={{ maxWidth: 600, margin: "2rem auto", textAlign: "center" }}>
          <h2 style={{ color: "#ef4444", marginBottom: "0.5rem" }}>Access Denied or Not Found</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            {error || "Claim record not found or you are not authorized to investigate this claim."}
          </p>
          <Link to="/investigator/claims" className="btn btn-primary">
            ← Return to Investigation Queue
          </Link>
        </div>
      </div>
    );
  }

  const allEvidence = [...(claim.documents || []), ...(claim.images || [])];

  return (
    <div className="main-content">
      {/* Top Header & Breadcrumb */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link to="/investigator/claims" style={{ fontSize: "0.88rem", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
          ← Back to Claims Queue
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff" }}>
                Investigation File: {claim.claimId}
              </h1>
              <StatusBadge status={claim.investigationStatus || "UNASSIGNED"} />
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              Policy: <strong>{claim.policyNumber}</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => setShowStatusModal(true)}
              className="btn btn-primary"
            >
              Update Investigation Status
            </button>
          </div>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

      {/* AI Risk Assessment Card (Comprehensive Investigator View) */}
      <AIResultCard
        aiResult={claim.aiResult}
        status={claim.status}
        isInvestigatorOrAdmin={true}
      />

      {/* Claim Overview Card */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div className="card-header">
          <h3 className="card-title">Submitted Claim Information</h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Submitted: {new Date(claim.createdAt).toLocaleString()}
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

      {/* Uploaded Evidence Inspection */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Evidence & Documents Verification</h3>
            <p className="card-subtitle">
              Inspect submitted invoices, police reports, and accident photographs
            </p>
          </div>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            {allEvidence.length} file{allEvidence.length !== 1 ? "s" : ""} on record
          </span>
        </div>

        {allEvidence.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)", border: "1px dashed var(--border-subtle)", borderRadius: "12px" }}>
            No evidence files attached to this claim.
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
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "0.15rem 0.45rem",
                        borderRadius: "4px",
                        background: file.category === "image" ? "rgba(6, 182, 212, 0.2)" : "rgba(99, 102, 241, 0.2)",
                        color: file.category === "image" ? "#67e8f9" : "#a5b4fc",
                        fontWeight: 600,
                      }}
                    >
                      {file.category.toUpperCase()}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {file.fileSize ? `${(file.fileSize / 1024).toFixed(0)} KB` : ""}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#fff", wordBreak: "break-all" }}>
                    {file.fileName}
                  </div>
                </div>

                <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)" }}>
                  <button
                    type="button"
                    onClick={() => openEvidence(file.url || "").catch((err) => setError(err.message))}
                    className="btn btn-secondary btn-sm"
                    style={{ width: "100%", textAlign: "center" }}
                    disabled={!file.url}
                  >
                    Examine S3 File →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Human Remarks & Notes */}
      <RemarksSection
        remarks={claim.investigationRemarks || []}
        onAddRemark={handleAddRemark}
      />

      {/* Investigation Status Modal */}
      <Modal
        isOpen={showStatusModal}
        title="Update Investigation Status"
        onClose={() => setShowStatusModal(false)}
        confirmText="Confirm Status Update"
        onConfirm={handleUpdateStatus}
        isLoading={updatingStatus}
      >
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginBottom: "1rem" }}>
            Select the updated status for claim <strong>{claim.claimId}</strong>:
          </p>

          <div className="form-group">
            <label className="form-label">Investigation Status</label>
            <select
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as InvestigationStatus)}
            >
              <option value="ASSIGNED">ASSIGNED (In investigator queue)</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW (Active evidence analysis)</option>
              <option value="ADDITIONAL_INFORMATION_REQUIRED">
                ADDITIONAL_INFORMATION_REQUIRED (Waiting on claimant)
              </option>
              <option value="INVESTIGATION_COMPLETED">
                INVESTIGATION_COMPLETED (Findings finalized)
              </option>
              <option value="ESCALATED">ESCALATED (Referred to Special Investigation Unit)</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};
