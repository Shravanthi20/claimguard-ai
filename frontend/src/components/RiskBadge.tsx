import React from "react";
import { RiskLevel } from "../types";

interface RiskBadgeProps {
  level: RiskLevel | string;
  score?: number;
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  showScore = true,
  size = "md",
}) => {
  const normLevel = (level || "LOW").toUpperCase();

  let styles = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  let label = normLevel;

  switch (normLevel) {
    case "CRITICAL":
      styles = "bg-rose-600/20 text-rose-400 border-rose-500/40 animate-pulse";
      break;
    case "HIGH":
      styles = "bg-rose-500/15 text-rose-400 border-rose-500/30";
      break;
    case "MEDIUM":
      styles = "bg-amber-500/15 text-amber-400 border-amber-500/30";
      break;
    case "LOW":
      styles = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      break;
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs font-medium",
    lg: "px-3 py-1.5 text-sm font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${styles} ${sizeClasses[size]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      <span>{label}</span>
      {showScore && score !== undefined && (
        <span className="font-mono opacity-80">({score}/100)</span>
      )}
    </span>
  );
};
