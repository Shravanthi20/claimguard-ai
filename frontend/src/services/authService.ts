import { apiClient } from "./apiClient";
import { User, UserRole } from "../types";

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/auth/login", { email, password });
    return response.data;
  },

  async register(payload: RegisterPayload): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/auth/register", payload);
    return response.data;
  },

  async getMe(): Promise<{ user: User }> {
    const response = await apiClient.get<{ user: User }>("/auth/me");
    return response.data;
  },
};
