import { Request, Response, NextFunction } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import {
  COGNITO_USER_POOL_ID,
  COGNITO_CLIENT_ID,
  isCognitoConfigured,
} from "../config/aws";
import { AuthenticatedUser, Claim, UserRole } from "../models/types";
import { extractRoleFromClaims } from "../services/cognitoService";

// Extend Express Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Cognito verifier initialized if configured
let cognitoVerifier: any = null;

if (isCognitoConfigured) {
  try {
    cognitoVerifier = CognitoJwtVerifier.create({
      userPoolId: COGNITO_USER_POOL_ID,
      tokenUse: "id",
      clientId: COGNITO_CLIENT_ID,
    });
  } catch (err) {
    console.warn("Failed to create CognitoJwtVerifier:", err);
  }
}

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Authentication token missing or invalid format. Please log in.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!cognitoVerifier || !isCognitoConfigured) {
    res.status(503).json({
      error: "AUTHENTICATION_UNAVAILABLE",
      message: "Amazon Cognito authentication is not configured.",
    });
    return;
  }

  try {
    const payload = await cognitoVerifier.verify(token);
    const role = extractRoleFromClaims(payload);
    req.user = {
      userId: payload.sub,
      email: String(payload.email || payload["cognito:username"] || ""),
      name: String(payload.name || payload["cognito:username"] || "User"),
      role,
      groups: Array.isArray(payload["cognito:groups"])
        ? (payload["cognito:groups"] as string[])
        : [],
    };
    next();
  } catch {
    res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Invalid or expired authentication token. Please log in again.",
    });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Authentication required.",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: "FORBIDDEN",
        message: `Access denied. Requires one of [${allowedRoles.join(", ")}] roles.`,
      });
      return;
    }

    next();
  };
}

export function canAccessClaim(user: AuthenticatedUser, claim: Claim): boolean {
  if (user.role === "admin") {
    return true;
  }

  if (user.role === "investigator") {
    return claim.investigatorId === user.userId;
  }

  if (user.role === "customer") {
    const claimCustomerId = claim.customerId || claim.userId;
    return claimCustomerId === user.userId;
  }

  return false;
}
