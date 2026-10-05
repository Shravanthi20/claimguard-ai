import React, { useEffect, useState } from "react";
import { DashboardLayout } from "../../components/DashboardLayout";
import { SearchFilter } from "../../components/SearchFilter";
import { ClaimTable } from "../../components/ClaimTable";
import { adminService } from "../../services/adminService";
import { Claim } from "../../types";

export const AdminClaims: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const { claims: data } = await adminService.getClaims({
        search: searchQuery,
        status: statusFilter,
        riskLevel: riskFilter,
      });
      setClaims(data);
    } catch (err) {
      console.error("Failed to load admin claims:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [searchQuery, statusFilter, riskFilter]);

  return (
    <DashboardLayout
      title="System-Wide Claims Registry"
      subtitle="Complete database of submitted claims, automated risk classifications, and investigation statuses."
    >
      <SearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        riskFilter={riskFilter}
        onRiskChange={setRiskFilter}
      />

      <ClaimTable claims={claims} userRole="admin" loading={loading} />
    </DashboardLayout>
  );
};
