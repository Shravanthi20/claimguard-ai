import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { CognitoJwtVerifier } from "aws-jwt-verify";

const JWT_SECRET = process.env.JWT_SECRET || "claimguard-jwt-secret-key-2026";
let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null | undefined;

function getVerifier(): ReturnType<typeof CognitoJwtVerifier.create> | null {
  if (verifier !== undefined) return verifier;
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;
  verifier = userPoolId && clientId
    ? CognitoJwtVerifier.create({
        userPoolId,
        tokenUse: "id",
        clientId,
      })
    : null;
  return verifier;
}

export interface AuthenticatedUserPayload {
  id: string;
  email: string;
  name: string;
  role: "CUSTOMER" | "INVESTIGATOR" | "ADMIN";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserPayload;
    }
  }
}

export function generateToken(user: AuthenticatedUserPayload): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Authentication token is missing. Please log in.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const cognitoVerifier = getVerifier();
    if (cognitoVerifier) {
      // Validate via Cognito
      const payload = await cognitoVerifier.verify(token);
      const groups = Array.isArray(payload["cognito:groups"])
        ? payload["cognito:groups"].map((group) => String(group).toLowerCase())
        : [];
      const role = groups.some((group) => ["admin", "admins", "administrators"].includes(group))
        ? "ADMIN"
        : groups.some((group) => ["investigator", "investigators"].includes(group))
          ? "INVESTIGATOR"
          : "CUSTOMER";
      req.user = {
        id: payload.sub,
        email: payload.email as string,
        name: (payload.name || payload.email) as string,
        role,
      };
    } else {
      // Local JWTs are only valid for explicit local development mode.
      if (process.env.NODE_ENV === "production" || process.env.LOCAL_AUTH_MODE !== "true") {
        res.status(503).json({
          error: "AUTH_NOT_CONFIGURED",
          message: "Cognito authentication is not configured.",
        });
        return;
      }
      const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUserPayload;
      req.user = decoded;
    }
    next();
  } catch (error) {
    res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Invalid or expired token. Please log in again.",
    });
  }
}

export function requireRole(...allowedRoles: ("CUSTOMER" | "INVESTIGATOR" | "ADMIN")[]) {
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
        message: `Access denied. Action requires one of: \${allowedRoles.join(", ")}`,
      });
      return;
    }

    next();
  };
}
