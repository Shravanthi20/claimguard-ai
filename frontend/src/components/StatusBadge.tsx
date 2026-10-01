import React from "react";
import { ClaimStatus, InvestigationStatus } from "../types";

export const StatusBadge: React.FC<{ status: ClaimStatus | InvestigationStatus | string }> = ({
  status,
}) => {
  const getBadgeClass = (s: string) => {
    switch (s) {
      case "SUBMITTED":
      case "UNASSIGNED":
        return "badge-submitted";
      case "PROCESSING":
      case "AI_ANALYSIS":
      case "UNDER_REVIEW":
        return "badge-processing";
      case "UNDER_INVESTIGATION":
      case "ASSIGNED":
      case "ADDITIONAL_INFORMATION_REQUIRED":
      case "ESCALATED":
        return "badge-investigation";
      case "COMPLETED":
      case "INVESTIGATION_COMPLETED":
        return "badge-completed";
      case "FAILED":
        return "badge-failed";
      default:
        return "badge-submitted";
    }
  };

  const formatText = (s: string) => {
    return s.replace(/_/g, " ");
  };

  return <span className={`badge ${getBadgeClass(status)}`}>{formatText(status)}</span>;
};
