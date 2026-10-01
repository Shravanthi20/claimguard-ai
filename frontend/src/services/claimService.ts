import { apiRequest } from "./apiClient";
import { Claim, ClaimStatistics, AIResult, EvidenceFile, InvestigationRemark } from "../types";

export const claimService = {
  async getClaims(filters?: { status?: string; claimType?: string }): Promise<Claim[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.claimType) params.append("claimType", filters.claimType);

    const qs = params.toString() ? `?${params.toString()}` : "";
    return apiRequest<Claim[]>(`/claims${qs}`);
  },

  async getClaim(claimId: string): Promise<Claim> {
    return apiRequest<Claim>(`/claims/${claimId}`);
  },

  async getClaimWithAI(claimId: string): Promise<Claim> {
    const claim = await this.getClaim(claimId);
    const analysis = await this.getAIResult(claimId);
    if (analysis.status === "AVAILABLE") {
      return { ...claim, aiResult: analysis.data || null };
    }
    if (analysis.status === "FAILED") {
      return { ...claim, aiResult: null, status: "FAILED" };
    }
    return { ...claim, aiResult: null };
  },

  async createClaim(data: {
    policyNumber: string;
    incidentDate: string;
    claimType: string;
    accidentDescription: string;
    claimedAmount: number;
  }): Promise<Claim> {
    return apiRequest<Claim>("/claims", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateClaimStatus(claimId: string, status: string): Promise<Claim> {
    return apiRequest<Claim>(`/claims/${claimId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async getStatistics(): Promise<ClaimStatistics> {
    return apiRequest<ClaimStatistics>("/claims/statistics");
  },

  async getAIResult(claimId: string): Promise<{
    status: "AVAILABLE" | "PROCESSING" | "FAILED";
    data?: AIResult;
    message?: string;
  }> {
    return apiRequest<{
      status: "AVAILABLE" | "PROCESSING" | "FAILED";
      data?: AIResult;
      message?: string;
    }>(`/claims/${claimId}/ai-result`);
  },

  async uploadEvidence(
    claimId: string,
    file: File
  ): Promise<{ evidence: EvidenceFile; claim: Claim }> {
    const formData = new FormData();
    formData.append("file", file);

    return apiRequest<{ evidence: EvidenceFile; claim: Claim }>(
      `/claims/${claimId}/evidence`,
      {
        method: "POST",
        body: formData,
      }
    );
  },

  async addInvestigatorRemark(
    claimId: string,
    remark: string
  ): Promise<{ remark: InvestigationRemark; claim: Claim }> {
    return apiRequest<{ remark: InvestigationRemark; claim: Claim }>(
      `/claims/${claimId}/remarks`,
      {
        method: "POST",
        body: JSON.stringify({ remark }),
      }
    );
  },

  async updateInvestigationStatus(
    claimId: string,
    investigationStatus: string,
    investigatorId?: string
  ): Promise<Claim> {
    return apiRequest<Claim>(`/claims/${claimId}/investigation-status`, {
      method: "PATCH",
      body: JSON.stringify({ investigationStatus, investigatorId }),
    });
  },

};
