import React from "react";
import { RiskAssessment } from "../types";
import { RiskBadge } from "./RiskBadge";

interface RiskScoreCardProps {
  assessment: RiskAssessment;
}

export const RiskScoreCard: React.FC<RiskScoreCardProps> = ({ assessment }) => {
  const { riskScore, fraudProbability, riskLevel, priority, riskFactors, modelVersion } = assessment;

  // Colors based on risk score
  let gaugeColor = "bg-emerald-500";
  let textColor = "text-emerald-400";
  if (riskScore >= 75) {
    gaugeColor = "bg-rose-500";
    textColor = "text-rose-400";
  } else if (riskScore >= 55) {
    gaugeColor = "bg-rose-400";
    textColor = "text-rose-300";
  } else if (riskScore >= 35) {
    gaugeColor = "bg-amber-500";
    textColor = "text-amber-400";
  }

  const factors = Array.isArray(riskFactors) ? riskFactors : [];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Automated Risk & Fraud Assessment
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Powered by ClaimGuard Risk Engine ({modelVersion})</p>
        </div>
        <RiskBadge level={riskLevel} score={riskScore} size="lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Risk Score Meter */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center flex flex-col justify-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Risk Score</span>
          <div className="mt-2 flex items-baseline justify-center gap-1">
            <span className={`text-4xl font-extrabold tracking-tight ${textColor}`}>{riskScore}</span>
            <span className="text-sm font-semibold text-slate-500">/100</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full ${gaugeColor} transition-all duration-500 rounded-full`}
              style={{ width: `${Math.min(100, riskScore)}%` }}
            ></div>
          </div>
        </div>

        {/* Fraud Probability */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center flex flex-col justify-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fraud Probability</span>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-white font-mono">
            {(fraudProbability * 100).toFixed(0)}%
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Statistical likelihood of anomaly or claim inflation</p>
        </div>

        {/* Priority Level */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center flex flex-col justify-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Investigation Priority</span>
          <div className="mt-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {priority}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Recommended queue handling priority</p>
        </div>
      </div>

      {/* Risk Factors List */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Identified Risk Factors ({factors.length})
        </h4>
        <div className="space-y-2">
          {factors.map((factor, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300"
            >
              <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{typeof factor === "string" ? factor : JSON.stringify(factor)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
