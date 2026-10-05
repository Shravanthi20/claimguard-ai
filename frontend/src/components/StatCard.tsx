import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  color?: "indigo" | "emerald" | "amber" | "rose" | "purple" | "cyan";
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  change,
  trend = "neutral",
  color = "indigo",
  onClick,
}) => {
  const colorMap = {
    indigo: "from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 text-indigo-400",
    emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-400",
    amber: "from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-400",
    rose: "from-rose-500/10 to-rose-500/5 border-rose-500/20 text-rose-400",
    purple: "from-purple-500/10 to-purple-500/5 border-purple-500/20 text-purple-400",
    cyan: "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20 text-cyan-400",
  };

  const trendColors = {
    up: "text-emerald-400",
    down: "text-rose-400",
    neutral: "text-slate-400",
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${colorMap[color]} p-6 transition-all duration-200 ${
        onClick ? "cursor-pointer hover:border-opacity-50 hover:scale-[1.02]" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        {icon && <div className="rounded-lg bg-slate-800/60 p-2.5 text-slate-300">{icon}</div>}
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-white">{value}</span>
        {change && (
          <span className={`text-xs font-semibold ${trendColors[trend]}`}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "•"} {change}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-2 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
};
