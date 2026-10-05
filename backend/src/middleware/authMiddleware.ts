import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "claimguard-jwt-secret-key-2026";

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

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
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
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUserPayload;
    req.user = decoded;
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
        message: `Access denied. Action requires one of: ${allowedRoles.join(", ")}`,
      });
      return;
    }

    next();
  };
}
