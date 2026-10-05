import React from "react";
import { ClaimStatus } from "../types";

interface StatusBadgeProps {
  status: ClaimStatus | string;
  size?: "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md" }) => {
  const normStatus = (status || "").toUpperCase();

  let badgeColor = "bg-slate-700/50 text-slate-300 border-slate-600";
  let label = normStatus.replace(/_/g, " ");

  switch (normStatus) {
    case "SUBMITTED":
      badgeColor = "bg-blue-500/15 text-blue-400 border-blue-500/30";
      label = "Submitted";
      break;
    case "IN_REVIEW":
      badgeColor = "bg-amber-500/15 text-amber-400 border-amber-500/30";
      label = "In Review";
      break;
    case "UNDER_INVESTIGATION":
      badgeColor = "bg-purple-500/15 text-purple-400 border-purple-500/30";
      label = "Under Investigation";
      break;
    case "APPROVED":
      badgeColor = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      label = "Approved";
      break;
    case "REJECTED":
      badgeColor = "bg-rose-500/15 text-rose-400 border-rose-500/30";
      label = "Rejected";
      break;
    case "ACTION_REQUIRED":
      badgeColor = "bg-orange-500/15 text-orange-400 border-orange-500/30";
      label = "Action Required";
      break;
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs font-medium",
    lg: "px-3 py-1.5 text-sm font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${badgeColor} ${sizeClasses[size]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {label}
    </span>
  );
};
