import React from "react";

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter?: string;
  onStatusChange?: (value: string) => void;
  riskFilter?: string;
  onRiskChange?: (value: string) => void;
  typeFilter?: string;
  onTypeChange?: (value: string) => void;
  placeholder?: string;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  riskFilter,
  onRiskChange,
  typeFilter,
  onTypeChange,
  placeholder = "Search by claim #, customer, description...",
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
      {/* Search Input */}
      <div className="relative flex-1">
        <svg
          className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 text-sm bg-slate-950 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Status Filter */}
      {onStatusChange && (
        <select
          value={statusFilter || ""}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-slate-950 border border-slate-700/80 text-sm text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="UNDER_INVESTIGATION">Under Investigation</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="ACTION_REQUIRED">Action Required</option>
        </select>
      )}

      {/* Risk Filter */}
      {onRiskChange && (
        <select
          value={riskFilter || ""}
          onChange={(e) => onRiskChange(e.target.value)}
          className="bg-slate-950 border border-slate-700/80 text-sm text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Risk Levels</option>
          <option value="LOW">Low Risk</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="HIGH">High Risk</option>
          <option value="CRITICAL">Critical Risk</option>
        </select>
      )}

      {/* Claim Type Filter */}
      {onTypeChange && (
        <select
          value={typeFilter || ""}
          onChange={(e) => onTypeChange(e.target.value)}
          className="bg-slate-950 border border-slate-700/80 text-sm text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Claim Types</option>
          <option value="Auto Collision">Auto Collision</option>
          <option value="Property Damage">Property Damage</option>
          <option value="Health Claim">Health Claim</option>
          <option value="Theft">Theft</option>
        </select>
      )}
    </div>
  );
};
