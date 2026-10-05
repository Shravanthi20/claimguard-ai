import { apiClient } from "./apiClient";
import { AdminStatistics, User, Claim } from "../types";

export const adminService = {
  async getStatistics(): Promise<{ statistics: AdminStatistics }> {
    const response = await apiClient.get<{ statistics: AdminStatistics }>("/admin/statistics");
    return response.data;
  },

  async getUsers(params?: { role?: string; search?: string }): Promise<{ users: User[]; count: number }> {
    const response = await apiClient.get<{ users: User[]; count: number }>("/admin/users", { params });
    return response.data;
  },

  async getClaims(params?: { status?: string; riskLevel?: string; search?: string }): Promise<{ claims: Claim[]; count: number }> {
    const response = await apiClient.get<{ claims: Claim[]; count: number }>("/admin/claims", { params });
    return response.data;
  },
};
