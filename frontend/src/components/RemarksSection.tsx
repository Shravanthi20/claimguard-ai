import React, { useState } from "react";
import { InvestigationRemark } from "../types";

interface RemarksSectionProps {
  remarks: InvestigationRemark[];
  onAddRemark: (remark: string) => Promise<void>;
  readOnly?: boolean;
}

export const RemarksSection: React.FC<RemarksSectionProps> = ({
  remarks = [],
  onAddRemark,
  readOnly = false,
}) => {
  const [newRemark, setNewRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemark.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      await onAddRemark(newRemark);
      setNewRemark("");
    } catch (err: any) {
      setError(err.message || "Failed to add remark.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: "2rem" }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">Human Investigator Remarks & Audit Log</h3>
          <p className="card-subtitle">
            Chronological notes entered by authorized insurance claims investigators
          </p>
        </div>
      </div>

      {remarks.length === 0 ? (
        <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", padding: "1rem 0" }}>
          No investigation remarks recorded yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
          {remarks.map((r) => (
            <div
              key={r.id}
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "10px",
                padding: "1.1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                  fontSize: "0.82rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <strong style={{ color: "#fff" }}>{r.investigatorName || "Investigator"}</strong>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                    ({r.investigatorId})
                  </span>
                </div>
                <div style={{ color: "var(--text-muted)" }}>
                  {new Date(r.timestamp).toLocaleString()}
                </div>
              </div>
              <p style={{ color: "var(--text-primary)", fontSize: "0.92rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {r.remark}
              </p>
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Add Investigation Remark</label>
            <textarea
              className="form-textarea"
              placeholder="Enter official investigation notes, policy observations, claimant interview summary..."
              value={newRemark}
              onChange={(e) => setNewRemark(e.target.value)}
              rows={3}
              required
            />
          </div>

          {error && <div className="form-error" style={{ marginBottom: "1rem" }}>{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={submitting || !newRemark.trim()}
          >
            {submitting ? "Saving Remark..." : "Save Investigator Remark"}
          </button>
        </form>
      )}
    </div>
  );
};
