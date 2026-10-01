import React from "react";

export const RiskBadge: React.FC<{ level?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string }> = ({
  level = "LOW",
}) => {
  const norm = level.toUpperCase();
  const getBadgeClass = () => {
    switch (norm) {
      case "CRITICAL":
        return "badge-critical";
      case "HIGH":
        return "badge-high";
      case "MEDIUM":
        return "badge-medium";
      case "LOW":
      default:
        return "badge-low";
    }
  };

  return <span className={`badge ${getBadgeClass()}`}>{norm} RISK</span>;
};
