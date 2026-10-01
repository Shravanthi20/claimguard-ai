import { AIResult } from "../models/types";
import { getClaim, setClaimAIResult } from "./claimService";

export interface AIResultResponse {
  status: "AVAILABLE" | "PROCESSING" | "FAILED";
  message?: string;
  data?: AIResult;
}

export async function getClaimAIResult(claimId: string): Promise<AIResultResponse> {
  const claim = await getClaim(claimId);

  if (!claim) {
    throw new Error("Claim not found");
  }

  if (claim.aiResult) {
    return {
      status: "AVAILABLE",
      data: claim.aiResult,
    };
  }

  if (claim.status === "FAILED") {
    return {
      status: "FAILED",
      message: "We could not complete automated analysis yet. Please try again later.",
    };
  }

  return {
    status: "PROCESSING",
    message: "AI analysis is currently being processed.",
  };
}

export async function ingestAIResult(
  claimId: string,
  aiResultData: AIResult
) {
  const existingClaim = await getClaim(claimId);
  if (!existingClaim) {
    throw new Error("Claim not found");
  }

  if (
    aiResultData.claimId !== claimId ||
    !Number.isFinite(aiResultData.fraudProbability) ||
    aiResultData.fraudProbability < 0 ||
    aiResultData.fraudProbability > 1 ||
    !Number.isFinite(aiResultData.estimatedCost) ||
    aiResultData.estimatedCost < 0 ||
    !Number.isFinite(aiResultData.riskScore) ||
    aiResultData.riskScore < 0 ||
    aiResultData.riskScore > 100 ||
    !["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(aiResultData.severity) ||
    !["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(aiResultData.riskLevel) ||
    typeof aiResultData.investigationRequired !== "boolean" ||
    !aiResultData.extractedEvidence ||
    typeof aiResultData.extractedEvidence !== "object" ||
    typeof aiResultData.summary !== "string" ||
    !aiResultData.summary.trim()
  ) {
    throw new Error("AI result is incomplete or invalid");
  }
  for (const evidenceValue of Object.values(aiResultData.extractedEvidence)) {
    if (evidenceValue !== undefined && (!evidenceValue || typeof evidenceValue !== "object" || Array.isArray(evidenceValue))) {
      throw new Error("AI result is incomplete or invalid");
    }
  }

  const updatedClaim = await setClaimAIResult(claimId, {
    ...aiResultData,
    analyzedAt: aiResultData.analyzedAt || new Date().toISOString(),
  });
  if (!updatedClaim) {
    throw new Error("Failed to update claim with AI result");
  }

  return updatedClaim;
}
