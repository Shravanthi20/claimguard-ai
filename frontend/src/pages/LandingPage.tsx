import React from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-8">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
          Enterprise Insurance Claim Fraud Prevention System
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          AI-Powered Insurance Claim Investigation & Risk Assessment
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl">
          Automate claim intake, flag high-risk anomalies in real-time, and empower investigators with automated risk scoring and evidentiary intelligence.
        </p>

        {/* Portal Access Buttons */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl text-left">
          {/* Customer Portal */}
          <Link
            to="/login?role=customer"
            className="group p-6 bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all hover:scale-[1.02] flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500/20">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-indigo-400">Customer Portal</h3>
              <p className="text-xs text-slate-400 mt-2">
                Submit claims, upload incident documentation, track investigation status in real-time.
              </p>
            </div>
            <div className="mt-6 text-xs font-semibold text-indigo-400 flex items-center gap-1">
              Access Customer Portal →
            </div>
          </Link>

          {/* Investigator Portal */}
          <Link
            to="/login?role=investigator"
            className="group p-6 bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all hover:scale-[1.02] flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:bg-purple-500/20">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-purple-400">Investigator Portal</h3>
              <p className="text-xs text-slate-400 mt-2">
                Analyze high-risk claims, review evidence, evaluate risk factors, log investigation notes.
              </p>
            </div>
            <div className="mt-6 text-xs font-semibold text-purple-400 flex items-center gap-1">
              Access Investigator Portal →
            </div>
          </Link>

          {/* Admin Portal */}
          <Link
            to="/login?role=admin"
            className="group p-6 bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all hover:scale-[1.02] flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:bg-emerald-500/20">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-emerald-400">Admin Dashboard</h3>
              <p className="text-xs text-slate-400 mt-2">
                Executive statistics, claim analytics, financial exposure, risk distribution, user management.
              </p>
            </div>
            <div className="mt-6 text-xs font-semibold text-emerald-400 flex items-center gap-1">
              Access Admin Dashboard →
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
};
