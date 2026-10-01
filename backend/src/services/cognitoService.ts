import {
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  AuthFlowType,
  GlobalSignOutCommand,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import jwt from "jsonwebtoken";
import {
  cognitoClient,
  COGNITO_CLIENT_ID,
  isCognitoConfigured,
} from "../config/aws";
import { AuthenticatedUser, UserRole } from "../models/types";

function requireCognitoConfiguration(): void {
  if (!isCognitoConfigured) {
    throw new Error("Amazon Cognito is not configured.");
  }
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<{ userId: string; email: string; requiresConfirmation: boolean; message: string }> {
  requireCognitoConfiguration();
  const normalizedEmail = email.toLowerCase().trim();
  const response = await cognitoClient.send(
    new SignUpCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: normalizedEmail,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: normalizedEmail },
        { Name: "name", Value: name },
      ],
    })
  );

  return {
    userId: response.UserSub || normalizedEmail,
    email: normalizedEmail,
    requiresConfirmation: !response.UserConfirmed,
    message: "Registration successful. Please check your email for the confirmation code.",
  };
}

export async function confirmUserRegistration(
  email: string,
  code: string
): Promise<{ success: boolean; message: string }> {
  requireCognitoConfiguration();
  await cognitoClient.send(
    new ConfirmSignUpCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: email.toLowerCase().trim(),
      ConfirmationCode: code,
    })
  );
  return {
    success: true,
    message: "Account verified successfully. You can now log in.",
  };
}

export async function loginUser(
  email: string,
  password: string
): Promise<{
  idToken: string;
  accessToken: string;
  refreshToken?: string;
  user: AuthenticatedUser;
}> {
  requireCognitoConfiguration();
  const normalizedEmail = email.toLowerCase().trim();
  const response = await cognitoClient.send(
    new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: normalizedEmail,
        PASSWORD: password,
      },
    })
  );
  const authResult = response.AuthenticationResult;
  if (!authResult?.IdToken || !authResult.AccessToken) {
    throw new Error("Authentication failed: Missing tokens from Cognito response");
  }

  const decoded = jwt.decode(authResult.IdToken);
  if (!decoded || typeof decoded !== "object") {
    throw new Error("Authentication failed: Invalid token response");
  }

  const role = extractRoleFromClaims(decoded);
  const groups = Array.isArray(decoded["cognito:groups"])
    ? decoded["cognito:groups"].map(String)
    : [];

  return {
    idToken: authResult.IdToken,
    accessToken: authResult.AccessToken,
    refreshToken: authResult.RefreshToken,
    user: {
      userId: String(decoded.sub || ""),
      email: String(decoded.email || normalizedEmail),
      name: String(decoded.name || decoded["cognito:username"] || normalizedEmail),
      role,
      groups,
    },
  };
}

export async function refreshUserSession(refreshToken: string): Promise<{
  idToken: string;
  accessToken: string;
}> {
  requireCognitoConfiguration();
  const response = await cognitoClient.send(
    new InitiateAuthCommand({
      AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: { REFRESH_TOKEN: refreshToken },
    })
  );
  const authResult = response.AuthenticationResult;
  if (!authResult?.IdToken || !authResult.AccessToken) {
    throw new Error("Session refresh failed.");
  }
  return { idToken: authResult.IdToken, accessToken: authResult.AccessToken };
}

export async function signOutUser(accessToken: string, expectedUserId: string): Promise<void> {
  requireCognitoConfiguration();
  const cognitoUser = await cognitoClient.send(new GetUserCommand({ AccessToken: accessToken }));
  const actualUserId = cognitoUser.UserAttributes?.find((attribute) => attribute.Name === "sub")?.Value;
  if (!actualUserId || actualUserId !== expectedUserId) {
    throw new Error("The Cognito access token does not belong to the authenticated user.");
  }
  await cognitoClient.send(new GlobalSignOutCommand({ AccessToken: accessToken }));
}

export function extractRoleFromClaims(claims: Record<string, unknown>): UserRole {
  const groups = claims["cognito:groups"];
  if (!Array.isArray(groups)) return "customer";

  const normalizedGroups = groups.map((group) => String(group).toLowerCase());
  if (normalizedGroups.some((group) => ["admin", "admins", "administrators"].includes(group))) {
    return "admin";
  }
  if (normalizedGroups.some((group) => ["investigator", "investigators"].includes(group))) {
    return "investigator";
  }
  return "customer";
}