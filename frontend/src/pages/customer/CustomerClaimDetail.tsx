import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { claimService } from "../../services/claimService";
import { Claim } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { ClaimTimeline } from "../../components/ClaimTimeline";
import { AIResultCard } from "../../components/AIResultCard";
import { AlertBanner } from "../../components/AlertBanner";
import { openEvidence } from "../../services/apiClient";

export const CustomerClaimDetail: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New evidence upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchClaim = async (showLoading = true) => {
    if (!claimId) return;
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const data = await claimService.getClaimWithAI(claimId);
      setClaim(data);
    } catch (err: any) {
      setError(err.message || "Failed to load claim details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaim();
  }, [claimId]);

  useEffect(() => {
    if (!claimId || !claim || claim.aiResult || !["SUBMITTED", "PROCESSING", "AI_ANALYSIS"].includes(claim.status)) return;
    const interval = window.setInterval(() => {
      fetchClaim(false);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [claimId, claim?.status, claim?.aiResult]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !claimId) return;
    const file = e.target.files[0];

    try {
      setUploading(true);
      setUploadError(null);
      await claimService.uploadEvidence(claimId, file);
      // Refresh claim
      await fetchClaim();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="main-content">
        <div style={{ textAlign: "center", padding: "5rem 0" }}>
          <div className="spinner"></div>
          <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
            Loading claim records from DynamoDB & S3...
          </p>
        </div>
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="main-content">
        <div className="card" style={{ maxWidth: 600, margin: "2rem auto", textAlign: "center" }}>
          <h2 style={{ color: "#ef4444", marginBottom: "0.5rem" }}>Unable to View Claim</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            {error || "Claim record not found or you are not authorized to view it."}
          </p>
          <Link to="/customer/claims" className="btn btn-primary">
            ← Return to My Claims
          </Link>
        </div>
      </div>
    );
  }

  const allEvidence = [...(claim.documents || []), ...(claim.images || [])];

  return (
    <div className="main-content">
      {/* Top Breadcrumb & Status */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link to="/customer/claims" style={{ fontSize: "0.88rem", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
          ← Back to Claims
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff" }}>
                Claim {claim.claimId}
              </h1>
              <StatusBadge status={claim.status} />
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              Policy: <strong>{claim.policyNumber}</strong> • Submitted on{" "}
              {new Date(claim.createdAt).toLocaleDateString()}
            </p>
          </div>

          <button onClick={() => fetchClaim()} className="btn btn-secondary btn-sm" title="Refresh claim state">
            ↻ Check Status
          </button>
        </div>
      </div>

      {uploadError && <AlertBanner type="error" message={uploadError} onClose={() => setUploadError(null)} />}

      {/* Asynchronous Pipeline Stepper */}
      <ClaimTimeline currentStatus={claim.status} createdAt={claim.createdAt} updatedAt={claim.updatedAt} />

      {/* AI Assessment Card (Customer-Friendly View) */}
      <AIResultCard
        aiResult={claim.aiResult}
        status={claim.status}
        isInvestigatorOrAdmin={false}
      />

      {/* Claim Information Card */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div className="card-header">
          <h3 className="card-title">Claim Information</h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Policy Number</div>
            <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "#fff", marginTop: "0.2rem" }}>{claim.policyNumber}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Incident Date</div>
            <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "#fff", marginTop: "0.2rem" }}>{claim.incidentDate}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Claim Type</div>
            <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "#fff", marginTop: "0.2rem" }}>{claim.claimType}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Claimed Amount</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#67e8f9", marginTop: "0.2rem" }}>
              ₹{claim.claimedAmount.toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.4rem" }}>
            Accident Description
          </div>
          <p style={{ color: "var(--text-primary)", fontSize: "0.95rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {claim.accidentDescription || claim.description}
          </p>
        </div>
      </div>

      {/* Uploaded Evidence Gallery & Additional Upload */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Supporting Evidence & S3 Documents</h3>
            <p className="card-subtitle">Encrypted files stored in Amazon S3 for Textract & Rekognition inspection</p>
          </div>

          <label className="btn btn-outline btn-sm" style={{ cursor: uploading ? "not-allowed" : "pointer" }}>
            {uploading ? "Uploading..." : "+ Upload More Files"}
            <input
              type="file"
              style={{ display: "none" }}
              disabled={uploading}
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {allEvidence.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)", border: "1px dashed var(--border-subtle)", borderRadius: "12px" }}>
            No evidence files attached to this claim yet.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
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
                    onClick={() => openEvidence(file.url || "").catch((err) => setUploadError(err.message))}
                    className="btn btn-secondary btn-sm"
                    style={{ width: "100%", textAlign: "center" }}
                    disabled={!file.url}
                  >
                    View / Download →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
