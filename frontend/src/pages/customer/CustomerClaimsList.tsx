import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "../../components/DashboardLayout";
import { SearchFilter } from "../../components/SearchFilter";
import { ClaimTable } from "../../components/ClaimTable";
import { claimService } from "../../services/claimService";
import { Claim } from "../../types";

export const CustomerClaimsList: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const { claims: data } = await claimService.getClaims({
        search: searchQuery,
        status: statusFilter,
        claimType: typeFilter,
      });
      setClaims(data);
    } catch (err) {
      console.error("Failed to load claims:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [searchQuery, statusFilter, typeFilter]);

  return (
    <DashboardLayout
      title="My Insurance Claims"
      subtitle="View, search, and monitor the progress of your submitted claims."
      actions={
        <Link
          to="/customer/claims/new"
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          File New Claim
        </Link>
      }
    >
      <SearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
      />

      <ClaimTable claims={claims} userRole="customer" loading={loading} />
    </DashboardLayout>
  );
};
