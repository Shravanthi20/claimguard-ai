import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "../../components/DashboardLayout";
import { StatusBadge } from "../../components/StatusBadge";
import { RiskScoreCard } from "../../components/RiskScoreCard";
import { Timeline } from "../../components/Timeline";
import { claimService } from "../../services/claimService";
import { investigationService } from "../../services/investigationService";
import { Claim, Evidence, InvestigationNote } from "../../types";

export const InvestigatorClaimDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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

  const handleStatusUpdate = async (newStatus: string) => {
    if (!claim || !claim.investigation) return;
    setUpdatingStatus(true);
    setStatusMessage(null);

    try {
      await investigationService.updateStatus(claim.investigation.id, newStatus);
      setStatusMessage(`Investigation status updated to ${newStatus}`);
      await fetchClaimDetail();
    } catch (err: any) {
      console.error("Failed to update status:", err);
      setStatusMessage("Failed to update investigation status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim || !claim.investigation || !newNote.trim()) return;
    setSubmittingNote(true);

    try {
      await investigationService.addNote(claim.investigation.id, newNote);
      setNewNote("");
      await fetchClaimDetail();
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setSubmittingNote(false);
    }
  };

  const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const apiBase = VITE_API_URL.replace(/\/api$/, "");

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center text-slate-400">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-3" />
          <p>Loading investigation data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!claim) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center text-slate-400 space-y-4">
          <p className="text-lg font-semibold text-rose-400">Claim not found.</p>
          <Link to="/investigator/claims" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
            ← Return to Claims Queue
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`Investigation: ${claim.claimNumber}`}
      subtitle={`Customer: ${claim.customer?.name} (${claim.customer?.email})`}
      actions={
        <div className="flex items-center gap-3">
          <StatusBadge status={claim.status} size="lg" />
        </div>
      }
    >
      {/* Risk Engine Assessment Card */}
      {claim.riskAssessment && <RiskScoreCard assessment={claim.riskAssessment} />}

      {/* Decision Controls Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Investigator Decision & Action Controls
        </h3>
        {statusMessage && (
          <p className="text-xs font-semibold text-emerald-400">{statusMessage}</p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleStatusUpdate("IN_PROGRESS")}
            disabled={updatingStatus}
            className="px-4 py-2 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors"
          >
            Mark In Progress
          </button>
          <button
            onClick={() => handleStatusUpdate("MORE_INFO_REQUESTED")}
            disabled={updatingStatus}
            className="px-4 py-2 text-xs font-semibold text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg transition-colors"
          >
            Request More Information
          </button>
          <button
            onClick={() => handleStatusUpdate("APPROVED")}
            disabled={updatingStatus}
            className="px-4 py-2 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors"
          >
            Approve Claim
          </button>
          <button
            onClick={() => handleStatusUpdate("REJECTED")}
            disabled={updatingStatus}
            className="px-4 py-2 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors"
          >
            Reject Claim
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Claim details & Evidence */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claim Metadata */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              Claim & Policy Details
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-semibold block mb-1">Claim Type</span>
                <span className="text-slate-200 font-medium">{claim.claimType}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold block mb-1">Claimed Amount</span>
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
                <span className="text-slate-400 uppercase font-semibold block mb-1">Policy Number</span>
                <span className="text-slate-200 font-mono font-medium">
                  {claim.policy?.policyNumber || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold block mb-1">Policy Coverage</span>
                <span className="text-slate-200 font-mono font-medium">
                  ${claim.policy?.coverageAmount?.toLocaleString() || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold block mb-1">Location</span>
                <span className="text-slate-200 font-medium">{claim.incidentLocation}</span>
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

          {/* Evidence Inspector */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              Submitted Evidence Files ({claim.evidence?.length || 0})
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
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </div>
                    <div className="overflow-hidden text-xs">
                      <p className="font-semibold text-slate-200 truncate group-hover:text-indigo-400">
                        {file.fileName}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {(file.fileSize / 1024 / 1024).toFixed(2)} MB • {file.fileType}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No evidence uploaded for this claim.</p>
            )}
          </div>
        </div>

        {/* Right Column: Investigation Notes & Timeline */}
        <div className="space-y-6">
          {/* Notes Section */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              Investigation Notes
            </h3>

            {/* Existing Notes */}
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

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="space-y-2 pt-3 border-t border-slate-800">
              <textarea
                rows={3}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add confidential investigation note..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={submittingNote || !newNote.trim()}
                className="w-full py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50"
              >
                {submittingNote ? "Saving Note..." : "Add Note"}
              </button>
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
