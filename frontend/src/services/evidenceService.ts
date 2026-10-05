import { apiClient } from "./apiClient";
import { Evidence } from "../types";

export const evidenceService = {
  async uploadEvidence(claimId: string, files: File[], description?: string): Promise<{ message: string; evidence: Evidence[] }> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    if (description) formData.append("description", description);

    const response = await apiClient.post<{ message: string; evidence: Evidence[] }>(`/claims/${claimId}/evidence`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async getEvidence(claimId: string): Promise<{ evidence: Evidence[] }> {
    const response = await apiClient.get<{ evidence: Evidence[] }>(`/claims/${claimId}/evidence`);
    return response.data;
  },
};
