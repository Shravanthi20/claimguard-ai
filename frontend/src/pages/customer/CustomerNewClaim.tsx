import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { claimService } from "../../services/claimService";
import { EvidenceUploader, PendingFile } from "../../components/EvidenceUploader";
import { AlertBanner } from "../../components/AlertBanner";

export const CustomerNewClaim: React.FC = () => {
  const navigate = useNavigate();

  // Form fields
  const [policyNumber, setPolicyNumber] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [claimType, setClaimType] = useState("");
  const [claimedAmount, setClaimedAmount] = useState("");
  const [accidentDescription, setAccidentDescription] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!policyNumber.trim()) {
      errors.policyNumber = "Policy number is required.";
    } else if (policyNumber.trim().length < 4) {
      errors.policyNumber = "Please enter a valid policy number.";
    }

    if (!incidentDate) {
      errors.incidentDate = "Incident date is required.";
    } else {
      const selectedDate = new Date(incidentDate);
      const today = new Date();
      if (selectedDate > today) {
        errors.incidentDate = "Incident date cannot be in the future.";
      }
    }

    if (!claimType) {
      errors.claimType = "Please select a claim type.";
    }

    const amount = Number(claimedAmount);
    if (!claimedAmount || isNaN(amount) || amount <= 0) {
      errors.claimedAmount = "Please enter a valid positive claimed amount.";
    }

    if (!accidentDescription.trim()) {
      errors.accidentDescription = "Accident description is required.";
    } else if (accidentDescription.trim().length < 20) {
      errors.accidentDescription = "Please provide more details (at least 20 characters) describing the incident.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setError(null);
      setUploadProgress("Submitting claim record to DynamoDB...");

      // 1. Create claim record in backend
      const createdClaim = await claimService.createClaim({
        policyNumber: policyNumber.trim(),
        incidentDate,
        claimType,
        accidentDescription: accidentDescription.trim(),
        claimedAmount: Number(claimedAmount),
      });

      const actualClaimId = createdClaim.claimId;

      // 2. Upload supporting evidence files to S3
      if (pendingFiles.length > 0) {
        for (let i = 0; i < pendingFiles.length; i++) {
          const item = pendingFiles[i];
          setUploadProgress(
            `Uploading evidence to Amazon S3 (${i + 1}/${pendingFiles.length}): ${item.name}...`
          );
          await claimService.uploadEvidence(actualClaimId, item.file);
        }
      }

      setUploadProgress("Claim and evidence uploaded successfully! Redirecting...");
      setTimeout(() => {
        navigate(`/customer/claims/${actualClaimId}`);
      }, 600);
    } catch (err: any) {
      setError(err.message || "Failed to submit claim. Please try again.");
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: "880px" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <Link to="/customer/claims" style={{ fontSize: "0.88rem", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
          ← Back to My Claims
        </Link>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff" }}>Submit New Insurance Claim</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Fill in incident details and attach evidence documents or photographs for automated AI risk assessment
        </p>
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

      <form onSubmit={handleSubmit}>
        {/* Step 1: Claim Information Card */}
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">1. Claim & Policy Information</h2>
              <p className="card-subtitle">Essential details regarding your insurance policy and incident</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div className="form-group">
              <label className="form-label">
                Policy Number <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter policy number"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
              />
              {fieldErrors.policyNumber && <div className="form-error">{fieldErrors.policyNumber}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Incident Date <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="date"
                className="form-input"
                max={new Date().toISOString().split("T")[0]}
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
              />
              {fieldErrors.incidentDate && <div className="form-error">{fieldErrors.incidentDate}</div>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div className="form-group">
              <label className="form-label">
                Claim Type <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                className="form-select"
                value={claimType}
                onChange={(e) => setClaimType(e.target.value)}
              >
                <option value="">Select claim type</option>
                <option value="Vehicle Accident">Vehicle Accident / Collision</option>
                <option value="Property Damage">Property Damage</option>
                <option value="Theft">Theft / Burglary</option>
                <option value="Bodily Injury">Bodily Injury / Medical</option>
                <option value="Natural Disaster">Natural Disaster</option>
                <option value="Other">Other Miscellaneous Claim</option>
              </select>
              {fieldErrors.claimType && <div className="form-error">{fieldErrors.claimType}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Claimed Amount (INR ₹) <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                className="form-input"
                placeholder="Enter claimed amount"
                value={claimedAmount}
                onChange={(e) => setClaimedAmount(e.target.value)}
              />
              {fieldErrors.claimedAmount && <div className="form-error">{fieldErrors.claimedAmount}</div>}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Accident / Incident Description <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <textarea
              className="form-textarea"
              placeholder="Provide a detailed description of what happened, location, parties involved, visible damage, road/weather conditions..."
              value={accidentDescription}
              onChange={(e) => setAccidentDescription(e.target.value)}
              rows={4}
            />
            {fieldErrors.accidentDescription && (
              <div className="form-error">{fieldErrors.accidentDescription}</div>
            )}
          </div>
        </div>

        {/* Step 2: Evidence Upload Card */}
        <div className="card" style={{ marginBottom: "2rem" }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">2. Supporting Evidence & Documents</h2>
              <p className="card-subtitle">
                Upload repair estimates, police reports, invoices, or photos of the accident to Amazon S3
              </p>
            </div>
          </div>

          <EvidenceUploader onFilesSelected={setPendingFiles} />
        </div>

        {/* Submission Feedback & Progress */}
        {uploadProgress && (
          <div
            style={{
              padding: "1rem 1.25rem",
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              borderRadius: "12px",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              color: "#a5b4fc",
            }}
          >
            <div className="spinner" style={{ width: 20, height: 20 }}></div>
            <span>{uploadProgress}</span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
          <Link to="/customer/claims" className="btn btn-secondary" style={{ pointerEvents: submitting ? "none" : "auto" }}>
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Processing Claim Submission..." : "Submit Claim for AI Review"}
          </button>
        </div>
      </form>
    </div>
  );
};
