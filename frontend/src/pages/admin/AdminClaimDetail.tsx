import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "../../components/DashboardLayout";
import { StatusBadge } from "../../components/StatusBadge";
import { RiskScoreCard } from "../../components/RiskScoreCard";
import { Timeline } from "../../components/Timeline";
import { claimService } from "../../services/claimService";
import { investigationService } from "../../services/investigationService";
import { Claim, Evidence, InvestigationNote } from "../../types";

export const AdminClaimDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

  const fetchClaimDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { claim: data } = await claimService.getClaimById(id);
      setClaim(data);
    } catch (err) {
      console.error("Failed to load claim:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimDetail();
  }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!claim) return;
    setUpdatingStatus(true);
    setStatusMessage(null);
    try {
      await claimService.updateClaim(claim.id, { status: newStatus });
      setStatusMessage(`Claim status updated to ${newStatus.replace(/_/g, " ")}`);
      await fetchClaimDetail();
    } catch (err) {
      setStatusMessage("Failed to update claim status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim?.investigation || !newNote.trim()) return;
    setSubmittingNote(true);
    try {
      await investigationService.addNote(claim.investigation.id, newNote);
      setNewNote("");
      setStatusMessage("Note added successfully.");
      await fetchClaimDetail();
    } catch (err) {
      setStatusMessage("Failed to add note.");
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center text-slate-400">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-3" />
          <p>Loading claim details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!claim) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center text-slate-400 space-y-4">
          <p className="text-lg font-semibold text-rose-400">Claim not found.</p>
          <Link to="/admin/claims" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
            ← Back to Claims Registry
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const statusOptions = [
    { value: "SUBMITTED", label: "Submitted", color: "text-blue-300 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20" },
    { value: "IN_REVIEW", label: "In Review", color: "text-yellow-300 bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20" },
    { value: "UNDER_INVESTIGATION", label: "Under Investigation", color: "text-orange-300 bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20" },
    { value: "ACTION_REQUIRED", label: "Action Required", color: "text-amber-300 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20" },
    { value: "APPROVED", label: "Approve", color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20" },
    { value: "REJECTED", label: "Reject", color: "text-rose-300 bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20" },
  ];

  return (
    <DashboardLayout
      title={`Admin Review: ${claim.claimNumber}`}
      subtitle={`Customer: ${claim.customer?.name} (${claim.customer?.email})`}
      actions={
        <div className="flex items-center gap-3">
          <Link
            to="/admin/claims"
            className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            ← Back
          </Link>
          <StatusBadge status={claim.status} size="lg" />
        </div>
      }
    >
      {statusMessage && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-4 py-3 text-xs font-semibold text-indigo-300">
          {statusMessage}
        </div>
      )}

      {/* Risk Assessment */}
      {claim.riskAssessment && <RiskScoreCard assessment={claim.riskAssessment} />}

      {/* Admin Status Override */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Admin Override — Set Claim Status
        </h3>
        <div className="flex flex-wrap gap-3">
          {statusOptions.map(({ value, label, color }) => (
            <button
              key={value}
              onClick={() => handleUpdateStatus(value)}
              disabled={updatingStatus || claim.status === value}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${color}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Claim info + Evidence */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claim Metadata */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              Claim Details
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-semibold block mb-1">Claim Type</span>
                <span className="text-slate-200 font-medium">{claim.claimType}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold block mb-1">Amount Claimed</span>
                <span className="text-emerald-400 font-mono font-bold text-base">
                  ${claim.claimAmount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold block mb-1">Incident Date</span>
                <span className="text-slate-200 font-medium">
                  {new Date(claim.incidentDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold block mb-1">Location</span>
                <span className="text-slate-200 font-medium">{claim.incidentLocation}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold block mb-1">Policy No.</span>
                <span className="text-slate-200 font-mono font-medium">
                  {claim.policy?.policyNumber || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold block mb-1">Coverage</span>
                <span className="text-slate-200 font-mono font-medium">
                  ${claim.policy?.coverageAmount?.toLocaleString() || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold block mb-1">Investigator</span>
                <span className="text-slate-200 font-medium">
                  {claim.investigator?.name || (
                    <span className="text-slate-500 italic">Unassigned</span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold block mb-1">Submitted</span>
                <span className="text-slate-200 font-medium">
                  {new Date(claim.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold block mb-1">Last Updated</span>
                <span className="text-slate-200 font-medium">
                  {new Date(claim.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-slate-400 text-xs uppercase font-semibold block mb-1">
                Incident Description
              </span>
              <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800 leading-relaxed">
                {claim.description}
              </p>
            </div>
          </div>

          {/* Evidence Files */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              Submitted Evidence ({claim.evidence?.length || 0} files)
            </h3>
            {claim.evidence && claim.evidence.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {claim.evidence.map((file: Evidence) => (
                  <a
                    key={file.id}
                    href={`${apiBase}${file.filePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-indigo-500/50 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </div>
                    <div className="overflow-hidden text-xs">
                      <p className="font-semibold text-slate-200 truncate group-hover:text-indigo-400">
                        {file.fileName}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {(file.fileSize / 1024 / 1024).toFixed(2)} MB · {file.fileType}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No evidence files attached to this claim.</p>
            )}
          </div>
        </div>

        {/* Right: Notes + Timeline */}
        <div className="space-y-6">
          {/* Investigation Notes */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              Investigation Notes
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {claim.investigation?.notes && claim.investigation.notes.length > 0 ? (
                claim.investigation.notes.map((note: InvestigationNote) => (
                  <div key={note.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span className="font-semibold text-indigo-400">{note.author?.name || "Investigator"}</span>
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-300">{note.note}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No investigation notes recorded yet.</p>
              )}
            </div>
            <form onSubmit={handleAddNote} className="space-y-2 pt-3 border-t border-slate-800">
              <textarea
                rows={3}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add admin oversight note..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={submittingNote || !newNote.trim() || !claim.investigation}
                className="w-full py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50"
              >
                {submittingNote ? "Saving..." : "Add Note"}
              </button>
              {!claim.investigation && (
                <p className="text-[10px] text-slate-500 italic">No investigation record exists for this claim yet.</p>
              )}
            </form>
          </div>

          {/* Audit Timeline */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              Claim Audit History
            </h3>
            <Timeline events={claim.claimEvents || []} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
