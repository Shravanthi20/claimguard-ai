import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "../../components/DashboardLayout";
import { StatCard } from "../../components/StatCard";
import { ClaimTable } from "../../components/ClaimTable";
import { investigationService } from "../../services/investigationService";
import { claimService } from "../../services/claimService";
import { Claim, Investigation } from "../../types";

export const InvestigatorDashboard: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ claims: claimsData }, { investigations: invData }] = await Promise.all([
          claimService.getClaims(),
          investigationService.getInvestigations(),
        ]);
        setClaims(claimsData);
        setInvestigations(invData);
      } catch (err) {
        console.error("Failed to load investigator dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalClaims = claims.length;
  const pendingInv = investigations.filter((i) =>
    ["PENDING", "IN_PROGRESS", "MORE_INFO_REQUESTED"].includes(i.status)
  ).length;
  const highRiskClaims = claims.filter(
    (c) => c.riskAssessment && ["HIGH", "CRITICAL"].includes(c.riskAssessment.riskLevel)
  ).length;
  const completedInv = investigations.filter((i) =>
    ["COMPLETED", "APPROVED", "REJECTED"].includes(i.status)
  ).length;

  return (
    <DashboardLayout
      title="Investigator Portal"
      subtitle="Monitor incoming claims, evaluate automated risk assessments, and manage active fraud investigations."
      actions={
        <Link
          to="/investigator/claims?riskLevel=HIGH"
          className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm shadow-rose-600/30 transition-all flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Review High-Risk Queue ({highRiskClaims})
        </Link>
      }
    >
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Claims Queue" value={totalClaims} color="indigo" />
        <StatCard title="Pending Investigations" value={pendingInv} color="amber" />
        <StatCard title="High & Critical Risk" value={highRiskClaims} color="rose" />
        <StatCard title="Completed Investigations" value={completedInv} color="emerald" />
      </div>

      {/* Priority Investigations Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Recent Claims Requiring Review</h2>
          <Link to="/investigator/claims" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
            View All Investigations →
          </Link>
        </div>
        <ClaimTable claims={claims.slice(0, 6)} userRole="investigator" loading={loading} />
      </div>
    </DashboardLayout>
  );
};
