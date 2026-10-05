import { apiClient } from "./apiClient";
import { RiskAssessment } from "../types";

export const riskService = {
  async getRiskAssessment(claimId: string): Promise<{ riskAssessment: RiskAssessment }> {
    const response = await apiClient.get<{ riskAssessment: RiskAssessment }>(`/claims/${claimId}/risk`);
    return response.data;
  },
};
