import React from "react";

interface MetricCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  highlightColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  highlightColor = "#6366f1",
}) => {
  return (
    <div className="metric-card">
      <div>
        <div className="metric-label">{label}</div>
        <div className="metric-value">{value}</div>
        {subtitle && (
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
            {subtitle}
          </div>
        )}
      </div>
      {icon && (
        <div
          className="metric-icon-box"
          style={{
            background: `${highlightColor}20`,
            color: highlightColor,
            border: `1px solid ${highlightColor}40`,
          }}
        >
          {icon}
        </div>
      )}
    </div>
  );
};
