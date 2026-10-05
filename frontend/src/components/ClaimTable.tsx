import React from "react";
import { Link } from "react-router-dom";
import { Claim } from "../types";
import { StatusBadge } from "./StatusBadge";
import { RiskBadge } from "./RiskBadge";

interface ClaimTableProps {
  claims: Claim[];
  userRole?: string;
  loading?: boolean;
}

export const ClaimTable: React.FC<ClaimTableProps> = ({ claims, userRole = "customer", loading }) => {
  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-3"></div>
        <p className="text-sm">Loading claims data...</p>
      </div>
    );
  }

  if (claims.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
        <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-base font-semibold text-slate-200">No claims found</h3>
        <p className="text-sm text-slate-400 mt-1">There are no claims matching your selected criteria.</p>
      </div>
    );
  }

  const getDetailPath = (claimId: string) => {
    if (userRole === "admin") return `/admin/claims/${claimId}`;
    if (userRole === "investigator") return `/investigator/claims/${claimId}`;
    return `/customer/claims/${claimId}`;
  };

  return (
    <div className="overflow-x-auto bg-slate-900/60 border border-slate-800 rounded-xl">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
          <tr>
            <th className="px-6 py-4">Claim #</th>
            {userRole !== "customer" && <th className="px-6 py-4">Customer</th>}
            <th className="px-6 py-4">Type</th>
            <th className="px-6 py-4">Amount</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Risk Level</th>
            <th className="px-6 py-4">Date</th>
            <th className="px-6 py-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {claims.map((claim) => (
            <tr key={claim.id} className="hover:bg-slate-800/40 transition-colors group">
              <td className="px-6 py-4 font-mono font-medium text-white group-hover:text-indigo-400">
                {claim.claimNumber}
              </td>
              {userRole !== "customer" && (
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-200">{claim.customer?.name || "Customer"}</div>
                  <div className="text-xs text-slate-400">{claim.customer?.email}</div>
                </td>
              )}
              <td className="px-6 py-4">{claim.claimType}</td>
              <td className="px-6 py-4 font-mono font-semibold text-emerald-400">
                ${claim.claimAmount.toLocaleString()}
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={claim.status} />
              </td>
              <td className="px-6 py-4">
                {claim.riskAssessment ? (
                  <RiskBadge
                    level={claim.riskAssessment.riskLevel}
                    score={claim.riskAssessment.riskScore}
                  />
                ) : (
                  <span className="text-xs text-slate-400">N/A</span>
                )}
              </td>
              <td className="px-6 py-4 text-slate-400 text-xs">
                {new Date(claim.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </td>
              <td className="px-6 py-4 text-right">
                <Link
                  to={getDetailPath(claim.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors"
                >
                  View Details
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
