import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "../../components/DashboardLayout";
import { StatCard } from "../../components/StatCard";
import { ClaimTable } from "../../components/ClaimTable";
import { claimService } from "../../services/claimService";
import { Claim } from "../../types";

export const CustomerDashboard: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const { claims: data } = await claimService.getClaims();
        setClaims(data);
      } catch (err) {
        console.error("Failed to load customer claims:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, []);

  const totalClaims = claims.length;
  const pendingClaims = claims.filter((c) =>
    ["SUBMITTED", "IN_REVIEW", "UNDER_INVESTIGATION"].includes(c.status)
  ).length;
  const approvedClaims = claims.filter((c) => c.status === "APPROVED").length;
  const actionRequiredClaims = claims.filter((c) => c.status === "ACTION_REQUIRED").length;

  return (
    <DashboardLayout
      title="Customer Dashboard"
      subtitle="Overview of your submitted insurance claims and investigation status."
      actions={
        <Link
          to="/customer/claims/new"
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Submit New Claim
        </Link>
      }
    >
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Claims" value={totalClaims} color="indigo" />
        <StatCard title="Pending Review" value={pendingClaims} color="amber" />
        <StatCard title="Approved Claims" value={approvedClaims} color="emerald" />
        <StatCard title="Action Required" value={actionRequiredClaims} color="rose" />
      </div>

      {/* Recent Claims Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Recent Submitted Claims</h2>
          <Link to="/customer/claims" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
            View All Claims →
          </Link>
        </div>
        <ClaimTable claims={claims.slice(0, 5)} userRole="customer" loading={loading} />
      </div>
    </DashboardLayout>
  );
};
