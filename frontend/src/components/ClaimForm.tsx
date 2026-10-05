import React, { useState } from "react";
import { FileUpload } from "./FileUpload";
import { CreateClaimPayload } from "../services/claimService";

interface ClaimFormProps {
  onSubmit: (payload: CreateClaimPayload) => Promise<void>;
  loading?: boolean;
}

export const ClaimForm: React.FC<ClaimFormProps> = ({ onSubmit, loading }) => {
  const [policyNumber, setPolicyNumber] = useState("");
  const [claimType, setClaimType] = useState("Auto Collision");
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentLocation, setIncidentLocation] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!claimType || !incidentDate || !incidentLocation || !claimAmount || !description) {
      setError("Please complete all required fields.");
      return;
    }

    const amountNum = parseFloat(claimAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Claim amount must be a positive number.");
      return;
    }

    try {
      await onSubmit({
        policyNumber: policyNumber || undefined,
        claimType,
        incidentDate,
        incidentLocation,
        claimAmount: amountNum,
        description,
        files,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to submit claim.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 md:p-8 space-y-6">
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Policy Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Policy Number (Optional)
          </label>
          <input
            type="text"
            value={policyNumber}
            onChange={(e) => setPolicyNumber(e.target.value)}
            placeholder="e.g. POL-AUTO-998241"
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <span className="text-[11px] text-slate-500 mt-1 block">Leave empty to use active account policy</span>
        </div>

        {/* Claim Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Claim Category *
          </label>
          <select
            value={claimType}
            onChange={(e) => setClaimType(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            required
          >
            <option value="Auto Collision">Auto Collision</option>
            <option value="Property Damage">Property Damage</option>
            <option value="Health Claim">Health & Medical Claim</option>
            <option value="Theft">Theft & Vandalism</option>
            <option value="Life Claim">Life Insurance Claim</option>
          </select>
        </div>

        {/* Incident Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Date of Incident *
          </label>
          <input
            type="date"
            value={incidentDate}
            onChange={(e) => setIncidentDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            required
          />
        </div>

        {/* Claim Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Estimated Claim Amount ($ USD) *
          </label>
          <input
            type="number"
            step="0.01"
            value={claimAmount}
            onChange={(e) => setClaimAmount(e.target.value)}
            placeholder="e.g. 4500.00"
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            required
          />
        </div>
      </div>

      {/* Incident Location */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Incident Location *
        </label>
        <input
          type="text"
          value={incidentLocation}
          onChange={(e) => setIncidentLocation(e.target.value)}
          placeholder="e.g. Intersection of 5th Ave and Main St, Philadelphia PA"
          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Detailed Incident Description *
        </label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe how the incident occurred, damages sustained, and any third parties involved..."
          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          required
        />
      </div>

      {/* Supporting Documents Upload */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Upload Supporting Evidence & Photos
        </label>
        <FileUpload files={files} onFilesChange={setFiles} />
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-slate-800">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting Claim...
            </>
          ) : (
            <>
              Submit Claim for Processing
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
