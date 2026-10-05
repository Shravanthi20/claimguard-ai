import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "../../components/DashboardLayout";
import { StatCard } from "../../components/StatCard";
import { ClaimTable } from "../../components/ClaimTable";
import { adminService } from "../../services/adminService";
import { AdminStatistics, Claim } from "../../types";

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStatistics | null>(null);
  const [recentClaims, setRecentClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [{ statistics }, { claims }] = await Promise.all([
          adminService.getStatistics(),
          adminService.getClaims(),
        ]);
        setStats(statistics);
        setRecentClaims(claims.slice(0, 5));
      } catch (err) {
        console.error("Failed to load admin dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  return (
    <DashboardLayout
      title="Platform Administration & Executive Control"
      subtitle="High-level oversight of claim volume, risk exposure, user roles, and platform health."
    >
      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Platform Users" value={stats?.totalUsers || 0} color="indigo" />
        <StatCard title="Total Claims Filed" value={stats?.totalClaims || 0} color="cyan" />
        <StatCard title="Active Investigations" value={stats?.activeInvestigations || 0} color="amber" />
        <StatCard title="High & Critical Risk" value={stats?.highRiskClaims || 0} color="rose" />
      </div>

      {/* Risk Distribution Visual Breakdown */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Claims Status Breakdown */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              Claims Status Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block mb-1">Submitted</span>
                <span className="text-xl font-bold text-blue-400">{stats.claimsByStatus.submitted}</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block mb-1">Under Investigation</span>
                <span className="text-xl font-bold text-purple-400">{stats.claimsByStatus.underInvestigation}</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block mb-1">Approved Claims</span>
                <span className="text-xl font-bold text-emerald-400">{stats.claimsByStatus.approved}</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block mb-1">Rejected Claims</span>
                <span className="text-xl font-bold text-rose-400">{stats.claimsByStatus.rejected}</span>
              </div>
            </div>
          </div>

          {/* Risk Level Distribution */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              Automated Risk Level Distribution
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-emerald-400">Low Risk</span>
                  <span className="text-slate-300">{stats.riskDistribution.low} claims</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${stats.totalClaims ? (stats.riskDistribution.low / stats.totalClaims) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-amber-400">Medium Risk</span>
                  <span className="text-slate-300">{stats.riskDistribution.medium} claims</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${stats.totalClaims ? (stats.riskDistribution.medium / stats.totalClaims) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-rose-400">High & Critical Risk</span>
                  <span className="text-slate-300">{stats.riskDistribution.high + stats.riskDistribution.critical} claims</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full"
                    style={{ width: `${stats.totalClaims ? ((stats.riskDistribution.high + stats.riskDistribution.critical) / stats.totalClaims) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System-Wide Claims List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Recent System Claims</h2>
          <Link to="/admin/claims" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
            View All System Claims →
          </Link>
        </div>
        <ClaimTable claims={recentClaims} userRole="admin" loading={loading} />
      </div>
    </DashboardLayout>
  );
};
