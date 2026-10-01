import React from "react";
import { ClaimStatus } from "../types";

export const ClaimTimeline: React.FC<{ currentStatus: ClaimStatus; createdAt?: string; updatedAt?: string }> = ({
  currentStatus,
  createdAt,
  updatedAt,
}) => {
  const stages: { key: ClaimStatus; label: string }[] = [
    { key: "SUBMITTED", label: "Claim Submitted" },
    { key: "PROCESSING", label: "Evidence Extraction" },
    { key: "AI_ANALYSIS", label: "AI Risk Assessment" },
    { key: "UNDER_INVESTIGATION", label: "Investigator Review" },
    { key: "COMPLETED", label: "Completed" },
  ];

  const getStageIndex = (status: ClaimStatus): number => {
    switch (status) {
      case "SUBMITTED":
        return 0;
      case "PROCESSING":
        return 1;
      case "AI_ANALYSIS":
        return 2;
      case "UNDER_INVESTIGATION":
      case "REVIEW":
        return 3;
      case "COMPLETED":
        return 4;
      case "FAILED":
        return 1;
      default:
        return 0;
    }
  };

  const currentIndex = getStageIndex(currentStatus);
  const isFailed = currentStatus === "FAILED";

  return (
    <div className="card" style={{ marginBottom: "2rem" }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">Claim Processing Status Pipeline</h3>
          <p className="card-subtitle">
            Status updates synchronized with the claim processing service
          </p>
        </div>
      </div>

      <div className="timeline-container">
        {stages.map((stage, idx) => {
          const isCompleted = idx < currentIndex || currentStatus === "COMPLETED";
          const isActive = idx === currentIndex && currentStatus !== "COMPLETED" && !isFailed;

          return (
            <div
              key={stage.key}
              className={`timeline-step ${isCompleted ? "completed" : ""} ${
                isActive ? "active" : ""
              }`}
            >
              <div className="timeline-step-icon">
                {isCompleted ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <div className="timeline-step-label">{stage.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginTop: "1.25rem", color: "var(--text-secondary)", fontSize: "0.82rem" }}>
        {createdAt && <span>Submitted: {new Date(createdAt).toLocaleString()}</span>}
        {updatedAt && <span>Last updated: {new Date(updatedAt).toLocaleString()}</span>}
      </div>
      {isFailed && (
        <p role="status" style={{ color: "#f87171", marginTop: "1rem" }}>
          We could not complete automated analysis yet. Please try again later.
        </p>
      )}
    </div>
  );
};
