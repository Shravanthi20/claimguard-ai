import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "../../components/DashboardLayout";
import { StatusBadge } from "../../components/StatusBadge";
import { Timeline } from "../../components/Timeline";
import { claimService } from "../../services/claimService";
import { evidenceService } from "../../services/evidenceService";
import { Claim, Evidence } from "../../types";
import { FileUpload } from "../../components/FileUpload";

export const CustomerClaimDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fetchClaimDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { claim: data } = await claimService.getClaimById(id);
      setClaim(data);
    } catch (err) {
      console.error("Failed to load claim detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimDetail();
  }, [id]);

  const handleEvidenceUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || uploadFiles.length === 0) return;
    setUploading(true);
    setUploadSuccess(false);

    try {
      await evidenceService.uploadEvidence(id, uploadFiles, "Customer uploaded additional evidence");
      setUploadFiles([]);
      setUploadSuccess(true);
      await fetchClaimDetail();
    } catch (err) {
      console.error("Failed to upload evidence:", err);
    } finally {
      setUploading(false);
    }
  };

  const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const apiBase = VITE_API_URL.replace(/\/api$/, "");

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
          <p className="text-lg font-semibold text-rose-400">Claim not found or access denied.</p>
          <Link to="/customer/claims" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
            ← Return to Claims List
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`Claim ${claim.claimNumber}`}
      subtitle={`Submitted on ${new Date(claim.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
      actions={<StatusBadge status={claim.status} size="lg" />}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Evidence */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claim Summary */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              Claim Overview
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-semibold block mb-1">Claim Type</span>
                <span className="text-slate-200 font-medium">{claim.claimType}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold block mb-1">Claim Amount</span>
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
              <div className="col-span-2 sm:col-span-3">
                <span className="text-slate-400 uppercase font-semibold block mb-1">Incident Location</span>
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

          {/* Submitted Evidence */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              Submitted Supporting Evidence ({claim.evidence?.length || 0})
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
                        {(file.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No evidence files uploaded yet.</p>
            )}

            {/* Upload Additional Evidence Form */}
            <form onSubmit={handleEvidenceUpload} className="pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Upload Additional Documentation
              </h4>
              <FileUpload files={uploadFiles} onFilesChange={setUploadFiles} maxFiles={3} />
              {uploadSuccess && (
                <p className="text-xs text-emerald-400 font-medium">Evidence files uploaded successfully!</p>
              )}
              {uploadFiles.length > 0 && (
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Submit Uploaded Files"}
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Right Column: Timeline & Progress */}
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              Investigation Progress
            </h3>
            <Timeline events={claim.claimEvents || []} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
