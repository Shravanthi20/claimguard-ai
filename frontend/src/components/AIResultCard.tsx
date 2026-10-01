import React, { useState } from "react";
import { AIResult } from "../types";
import { RiskBadge } from "./RiskBadge";

interface AIResultCardProps {
  aiResult: AIResult | null;
  status: string;
  isInvestigatorOrAdmin?: boolean;
}

export const AIResultCard: React.FC<AIResultCardProps> = ({
  aiResult,
  status,
  isInvestigatorOrAdmin = false,
}) => {
  const [activeTab, setActiveTab] = useState<"summary" | "extracted">("summary");

  if (!aiResult) {
    return (
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div className="card-header">
          <div>
            <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#67e8f9" }}>✦</span> AI Risk Assessment
            </h3>
            <p className="card-subtitle">
              Generated from submitted claim evidence via SageMaker & Amazon Bedrock
            </p>
          </div>
        </div>

        <div style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          {status === "FAILED" ? (
            <div style={{ color: "#f87171" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: "0 auto 1rem" }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h4>Automated Analysis Unavailable</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.35rem" }}>
                We could not complete automated analysis yet. Please try again later.
              </p>
            </div>
          ) : (
            <div>
              <div className="spinner" style={{ width: 36, height: 36, margin: "0 auto 1.25rem" }}></div>
              <h4 style={{ color: "#fff" }}>AI analysis is currently being processed...</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", maxWidth: 440, margin: "0.5rem auto 0" }}>
                Analysis results will appear here after the processing service saves them to your claim.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isInvestigatorOrAdmin) {
    return (
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Automated Review</h3>
            <p className="card-subtitle">Your claim analysis has been received by the review process.</p>
          </div>
        </div>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
          The latest claim status and next steps are shown in the claim timeline.
        </p>
      </div>
    );
  }

  const fraudPercent = Math.round(aiResult.fraudProbability * 100);

  return (
    <div className="card" style={{ marginBottom: "2rem" }}>
      <div className="card-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#67e8f9" }}>✦</span> AI Risk Assessment
            </h3>
            <RiskBadge level={aiResult.riskLevel} />
          </div>
          <p className="card-subtitle">
            Multimodal analysis generated from submitted claim documents, photos & description
          </p>
        </div>
        {aiResult.analyzedAt && (
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Assessed: {new Date(aiResult.analyzedAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Grid of Key Risk Indicators */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div style={{ background: "rgba(15, 23, 42, 0.7)", padding: "1.1rem", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
            Fraud Probability
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: fraudPercent > 60 ? "#f87171" : "#34d399" }}>
            {fraudPercent}%
          </div>
          <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", marginTop: "0.5rem", overflow: "hidden" }}>
            <div
              style={{
                width: `${fraudPercent}%`,
                height: "100%",
                background: fraudPercent > 60 ? "linear-gradient(90deg, #f59e0b, #ef4444)" : "linear-gradient(90deg, #10b981, #06b6d4)",
              }}
            ></div>
          </div>
        </div>

        <div style={{ background: "rgba(15, 23, 42, 0.7)", padding: "1.1rem", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
            Risk Score
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#fff" }}>
            {aiResult.riskScore} <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>/ 100</span>
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
            Severity: <strong style={{ color: "#fff" }}>{aiResult.severity}</strong>
          </div>
        </div>

        <div style={{ background: "rgba(15, 23, 42, 0.7)", padding: "1.1rem", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
            Estimated Cost
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#67e8f9" }}>
            ₹{aiResult.estimatedCost ? aiResult.estimatedCost.toLocaleString() : "0"}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
            Model predicted liability
          </div>
        </div>

        <div style={{ background: "rgba(15, 23, 42, 0.7)", padding: "1.1rem", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
            Investigation Action
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 700, color: aiResult.investigationRequired ? "#fbbf24" : "#34d399", marginTop: "0.2rem" }}>
            {aiResult.investigationRequired ? "REQUIRED" : "OPTIONAL"}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
            {aiResult.investigationRequired ? "Flagged for manual review" : "Straightforward approval"}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.75rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.75rem", marginBottom: "1.25rem" }}>
        <button
          onClick={() => setActiveTab("summary")}
          className={`btn btn-sm ${activeTab === "summary" ? "btn-primary" : "btn-secondary"}`}
        >
          Bedrock Investigation Summary
        </button>
        {isInvestigatorOrAdmin && (
          <button
            onClick={() => setActiveTab("extracted")}
            className={`btn btn-sm ${activeTab === "extracted" ? "btn-primary" : "btn-secondary"}`}
          >
            Extracted Evidence (OCR / Vision / NLP)
          </button>
        )}
      </div>

      {/* Tab: Bedrock Summary */}
      {activeTab === "summary" && (
        <div style={{ background: "rgba(99, 102, 241, 0.05)", border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", color: "#a5b4fc", fontSize: "0.88rem", fontWeight: 600 }}>
            <span>⚡ Amazon Bedrock Synthesis</span>
          </div>
          <p style={{ color: "var(--text-primary)", fontSize: "0.95rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {aiResult.summary}
          </p>
        </div>
      )}

      {/* Tab: Extracted Evidence */}
      {activeTab === "extracted" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          <div style={{ background: "rgba(15, 23, 42, 0.7)", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
            <h4 style={{ color: "#67e8f9", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
              Textract Document OCR Data
            </h4>
            <pre style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", overflowX: "auto" }}>
              {JSON.stringify(aiResult.extractedEvidence?.documentData || {}, null, 2)}
            </pre>
          </div>

          <div style={{ background: "rgba(15, 23, 42, 0.7)", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
            <h4 style={{ color: "#a5b4fc", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
              Rekognition Computer Vision
            </h4>
            <pre style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", overflowX: "auto" }}>
              {JSON.stringify(aiResult.extractedEvidence?.imageAnalysis || {}, null, 2)}
            </pre>
          </div>

          <div style={{ background: "rgba(15, 23, 42, 0.7)", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
            <h4 style={{ color: "#fcd34d", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
              Comprehend NLP & Entity Analysis
            </h4>
            <pre style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", overflowX: "auto" }}>
              {JSON.stringify(aiResult.extractedEvidence?.textAnalysis || {}, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
