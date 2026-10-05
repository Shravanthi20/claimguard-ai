import React, { useEffect, useState } from "react";
import { DashboardLayout } from "../../components/DashboardLayout";
import { adminService } from "../../services/adminService";
import { User } from "../../types";

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { users: data } = await adminService.getUsers({
        role: roleFilter,
        search: searchQuery,
      });
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, searchQuery]);

  const roleColors: Record<string, string> = {
    CUSTOMER: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    INVESTIGATOR: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    ADMIN: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  };

  return (
    <DashboardLayout
      title="User Management"
      subtitle="View registered platform users, customers, investigators, and administrative roles."
    >
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-950 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-slate-950 border border-slate-700/80 text-sm text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Roles</option>
          <option value="CUSTOMER">Customers</option>
          <option value="INVESTIGATOR">Investigators</option>
          <option value="ADMIN">Administrators</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-3" />
          <p className="text-sm">Loading user registry...</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-slate-900/60 border border-slate-800 rounded-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">User Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Registration Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-semibold text-white">{user.name}</td>
                  <td className="px-6 py-4 text-slate-300 font-mono text-xs">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${roleColors[user.role.toUpperCase()] || "bg-slate-700 text-slate-300"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};
