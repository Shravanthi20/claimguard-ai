import { Router } from "express";
import {
  registerUser,
  confirmUserRegistration,
  loginUser,
  refreshUserSession,
  signOutUser,
} from "../services/cognitoService";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Name, email, and password are required.",
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Password must be at least 8 characters long.",
      });
      return;
    }

    const result = await registerUser(name, email, password);
    res.status(201).json(result);
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(400).json({
      error: "REGISTRATION_FAILED",
      message: error.name === "UsernameExistsException"
        ? "An account already exists for this email address."
        : error.name === "InvalidPasswordException"
        ? "Password does not meet the Cognito user pool requirements."
        : error.message === "Amazon Cognito is not configured."
        ? "Registration is unavailable because Cognito has not been configured."
        : "Unable to register this account. Please check the details and try again.",
    });
  }
});

// POST /api/auth/confirm
router.post("/confirm", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Email and verification code are required.",
      });
      return;
    }

    const result = await confirmUserRegistration(email, code);
    res.json(result);
  } catch (error: any) {
    console.error("Confirmation error:", error);
    res.status(400).json({
      error: "CONFIRMATION_FAILED",
      message: error.name === "CodeMismatchException" || error.name === "ExpiredCodeException"
        ? "The confirmation code is invalid or expired."
        : "Unable to confirm this account. Please request a new code and try again.",
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Email and password are required.",
      });
      return;
    }

    const result = await loginUser(email, password);
    res.json(result);
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(401).json({
      error: "AUTHENTICATION_FAILED",
      message: error.message === "Amazon Cognito is not configured."
        ? "Sign-in is unavailable because Cognito has not been configured."
        : error.name === "UserNotConfirmedException"
        ? "Please verify your email address before signing in."
        : "Invalid email or password.",
    });
  }
});

// POST /api/auth/refresh
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (typeof refreshToken !== "string" || !refreshToken) {
    res.status(400).json({ error: "VALIDATION_ERROR", message: "Refresh token is required." });
    return;
  }

  try {
    res.json(await refreshUserSession(refreshToken));
  } catch (error: any) {
    const unavailable = error.message === "Amazon Cognito is not configured.";
    console.error("Cognito token refresh failed:", error);
    res.status(unavailable ? 503 : 401).json({
      error: unavailable ? "AUTHENTICATION_UNAVAILABLE" : "SESSION_EXPIRED",
      message: unavailable
        ? "Session refresh is unavailable because Cognito has not been configured."
        : "Your session has expired. Please sign in again.",
    });
  }
});

// POST /api/auth/logout
router.post("/logout", authenticateToken, async (req, res) => {
  const { accessToken } = req.body;
  if (typeof accessToken !== "string" || !accessToken) {
    res.status(400).json({ error: "VALIDATION_ERROR", message: "Access token is required." });
    return;
  }

  try {
    await signOutUser(accessToken, req.user!.userId);
    res.status(204).end();
  } catch (error) {
    console.error("Cognito global sign-out failed:", error);
    res.status(503).json({ error: "SIGN_OUT_FAILED", message: "Unable to revoke the Cognito session. Local credentials were cleared." });
  }
});

// GET /api/auth/me
router.get("/me", authenticateToken, (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Not authenticated" });
    return;
  }
  res.json({ user: req.user });
});

export default router;
