import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  CognitoUserSession,
} from "amazon-cognito-identity-js";
import { apiClient } from "./apiClient";
import { User } from "../types";

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
const userPool =
  userPoolId && clientId
    ? new CognitoUserPool({ UserPoolId: userPoolId, ClientId: clientId })
    : null;

function getUserPool(): CognitoUserPool {
  if (!userPool) {
    throw new Error(
      "Cognito is not configured. Set VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID in frontend/.env."
    );
  }
  return userPool;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return "Authentication failed. Please try again.";
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  message: string;
  requiresConfirmation: boolean;
  email: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    return new Promise((resolve, reject) => {
      const normalizedEmail = email.trim().toLowerCase();
      const cognitoUser = new CognitoUser({
        Username: normalizedEmail,
        Pool: getUserPool(),
      });

      cognitoUser.authenticateUser(
        new AuthenticationDetails({ Username: normalizedEmail, Password: password }),
        {
          onSuccess: async (session) => {
            const token = session.getIdToken().getJwtToken();
            apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
            try {
              const response = await apiClient.get<{ user: User }>("/auth/me");
              resolve({ message: "Login successful", token, user: response.data.user });
            } catch (error) {
              reject(error);
            }
          },
          onFailure: (error) => reject(new Error(errorMessage(error))),
        }
      );
    });
  },

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    return new Promise((resolve, reject) => {
      const email = payload.email.trim().toLowerCase();
      const attributes = [
        new CognitoUserAttribute({ Name: "email", Value: email }),
        new CognitoUserAttribute({ Name: "name", Value: payload.name.trim() }),
      ];

      getUserPool().signUp(email, payload.password, attributes, [], (error, result) => {
        if (error) {
          reject(new Error(errorMessage(error)));
          return;
        }
        resolve({
          message: result?.userConfirmed
            ? "Registration successful"
            : "Registration successful. Check your email for the confirmation code.",
          requiresConfirmation: !result?.userConfirmed,
          email,
        });
      });
    });
  },

  async confirmRegistration(email: string, code: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email.trim().toLowerCase(),
        Pool: getUserPool(),
      });
      cognitoUser.confirmRegistration(code.trim(), true, (error) => {
        if (error) {
          reject(new Error(errorMessage(error)));
          return;
        }
        resolve();
      });
    });
  },

  async getCurrentSession(): Promise<string | null> {
    if (!userPool) return null;
    const currentUser = userPool.getCurrentUser();
    if (!currentUser) return null;

    return new Promise((resolve, reject) => {
      currentUser.getSession(
        (error: Error | null, session: CognitoUserSession | null) => {
          if (error) {
            reject(new Error(errorMessage(error)));
            return;
          }
          resolve(session?.isValid() ? session.getIdToken().getJwtToken() : null);
        }
      );
    });
  },

  logout(): void {
    userPool?.getCurrentUser()?.signOut();
    delete apiClient.defaults.headers.common.Authorization;
  },

  async getMe(): Promise<{ user: User }> {
    const response = await apiClient.get<{ user: User }>("/auth/me");
    return response.data;
  },
};
