import { apiRequest } from "./apiClient";
import { User } from "../types";

export interface RegisterResponse {
  userId: string;
  email: string;
  requiresConfirmation: boolean;
  message: string;
}

export interface LoginResponse {
  idToken: string;
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export const authService = {
  async register(
    name: string,
    email: string,
    password: string
  ): Promise<RegisterResponse> {
    return apiRequest<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },

  async confirm(
    email: string,
    code: string
  ): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>("/auth/confirm", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (res.idToken) {
      localStorage.setItem("claimguard_token", res.idToken);
      localStorage.setItem("claimguard_access_token", res.accessToken);
      if (res.refreshToken) localStorage.setItem("claimguard_refresh_token", res.refreshToken);
      localStorage.setItem("claimguard_user", JSON.stringify(res.user));
    }

    return res;
  },

  async getMe(): Promise<{ user: User }> {
    return apiRequest<{ user: User }>("/auth/me", {
      method: "GET",
    });
  },

  async logout(): Promise<void> {
    const accessToken = localStorage.getItem("claimguard_access_token");
    try {
      if (accessToken) {
        await apiRequest<void>("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ accessToken }),
        });
      }
    } catch (error) {
      console.warn("Cognito sign-out could not be confirmed; clearing the local session.", error);
    } finally {
      localStorage.removeItem("claimguard_token");
      localStorage.removeItem("claimguard_access_token");
      localStorage.removeItem("claimguard_refresh_token");
      localStorage.removeItem("claimguard_user");
      window.dispatchEvent(new Event("auth_logout"));
    }
  },
};
