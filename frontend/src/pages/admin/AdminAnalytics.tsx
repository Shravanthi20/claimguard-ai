import React, { useEffect, useState } from "react";
import { DashboardLayout } from "../../components/DashboardLayout";
import { StatCard } from "../../components/StatCard";
import { adminService } from "../../services/adminService";
import { AdminStatistics } from "../../types";

export const AdminAnalytics: React.FC = () => {
  const [stats, setStats] = useState<AdminStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { statistics } = await adminService.getStatistics();
        setStats(statistics);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Claim Analytics & Risk Intelligence">
        <div className="py-12 text-center text-slate-400">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-3" />
          <p>Calculating claim analytics metrics...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Claim Analytics & Financial Risk Exposure"
      subtitle="Detailed breakdown of claim volume, financial distribution, and anomaly risk intelligence."
    >
      {/* Financial Exposure Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Claim Exposure"
          value={`$${(stats?.financials.totalAmount || 0).toLocaleString()}`}
          color="cyan"
          subtitle="Cumulative monetary value of filed claims"
        />
        <StatCard
          title="Average Claim Size"
          value={`$${Math.round(stats?.financials.averageAmount || 0).toLocaleString()}`}
          color="indigo"
          subtitle="Mean financial claim size across categories"
        />
        <StatCard
          title="High Risk Ratio"
          value={`${stats?.totalClaims ? Math.round(((stats.highRiskClaims) / stats.totalClaims) * 100) : 0}%`}
          color="rose"
          subtitle="Percentage of claims flagged with High/Critical risk"
        />
      </div>

      {/* Analytics Breakdown Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Claim Status Distribution */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              Claims Lifecycle Analytics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">Submitted (Pending Review)</span>
                <span className="font-mono font-bold text-blue-400">{stats.claimsByStatus.submitted}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">Under Active Investigation</span>
                <span className="font-mono font-bold text-purple-400">{stats.claimsByStatus.underInvestigation}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">Action Required by Claimant</span>
                <span className="font-mono font-bold text-orange-400">{stats.claimsByStatus.actionRequired}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">Approved Claims</span>
                <span className="font-mono font-bold text-emerald-400">{stats.claimsByStatus.approved}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">Rejected Claims</span>
                <span className="font-mono font-bold text-rose-400">{stats.claimsByStatus.rejected}</span>
              </div>
            </div>
          </div>

          {/* Risk Level Metrics */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              Automated Risk Profile Breakdown
            </h3>
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-bold text-emerald-400 block">Low Risk</span>
                  <span className="text-[10px] text-slate-500">Standard claim parameters, minimal fraud indicators</span>
                </div>
                <span className="text-xl font-bold text-white font-mono">{stats.riskDistribution.low}</span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-bold text-amber-400 block">Medium Risk</span>
                  <span className="text-[10px] text-slate-500">Moderate indicators, standard manual review queue</span>
                </div>
                <span className="text-xl font-bold text-white font-mono">{stats.riskDistribution.medium}</span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-bold text-rose-400 block">High & Critical Risk</span>
                  <span className="text-[10px] text-slate-500">Multiple anomaly flags, high fraud probability</span>
                </div>
                <span className="text-xl font-bold text-rose-400 font-mono">
                  {stats.riskDistribution.high + stats.riskDistribution.critical}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
