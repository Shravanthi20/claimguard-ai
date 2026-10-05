import { apiClient } from "./apiClient";
import { Investigation, InvestigationNote } from "../types";

export const investigationService = {
  async getInvestigations(params?: { status?: string; riskLevel?: string }): Promise<{ investigations: Investigation[]; count: number }> {
    const response = await apiClient.get<{ investigations: Investigation[]; count: number }>("/investigations", { params });
    return response.data;
  },

  async getInvestigationById(id: string): Promise<{ investigation: Investigation }> {
    const response = await apiClient.get<{ investigation: Investigation }>(`/investigations/${id}`);
    return response.data;
  },

  async updateStatus(id: string, status: string, note?: string): Promise<{ message: string; investigation: Investigation }> {
    const response = await apiClient.put<{ message: string; investigation: Investigation }>(`/investigations/${id}/status`, { status, note });
    return response.data;
  },

  async addNote(id: string, note: string): Promise<{ message: string; note: InvestigationNote }> {
    const response = await apiClient.post<{ message: string; note: InvestigationNote }>(`/investigations/${id}/notes`, { note });
    return response.data;
  },
};
