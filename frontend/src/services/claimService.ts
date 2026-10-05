import { apiClient } from "./apiClient";
import { Claim } from "../types";

export interface CreateClaimPayload {
  policyNumber?: string;
  claimType: string;
  incidentDate: string;
  incidentLocation: string;
  claimAmount: number;
  description: string;
  files?: File[];
}

export const claimService = {
  async createClaim(payload: CreateClaimPayload): Promise<{ message: string; claim: Claim }> {
    const formData = new FormData();
    if (payload.policyNumber) formData.append("policyNumber", payload.policyNumber);
    formData.append("claimType", payload.claimType);
    formData.append("incidentDate", payload.incidentDate);
    formData.append("incidentLocation", payload.incidentLocation);
    formData.append("claimAmount", payload.claimAmount.toString());
    formData.append("description", payload.description);

    if (payload.files && payload.files.length > 0) {
      payload.files.forEach((file) => formData.append("files", file));
    }

    const response = await apiClient.post<{ message: string; claim: Claim }>("/claims", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async getClaims(params?: { status?: string; riskLevel?: string; search?: string; claimType?: string }): Promise<{ claims: Claim[]; count: number }> {
    const response = await apiClient.get<{ claims: Claim[]; count: number }>("/claims", { params });
    return response.data;
  },

  async getClaimById(id: string): Promise<{ claim: Claim }> {
    const response = await apiClient.get<{ claim: Claim }>(`/claims/${id}`);
    return response.data;
  },

  async updateClaim(id: string, data: { status?: string; investigatorId?: string; description?: string }): Promise<{ message: string; claim: Claim }> {
    const response = await apiClient.put<{ message: string; claim: Claim }>(`/claims/${id}`, data);
    return response.data;
  },
};
