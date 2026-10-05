import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import healthRoutes from "./routes/health";
import authRoutes from "./routes/auth";
import claimRoutes from "./routes/claims";
import investigationRoutes from "./routes/investigations";
import investigatorRoutes from "./routes/investigator";
import riskRoutes from "./routes/risk";
import adminRoutes from "./routes/admin";

dotenv.config();

const app = express();

// Security and CORS middleware
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Static directory for uploaded evidence files
const uploadsPath = path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadsPath));

// API Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/investigations", investigationRoutes);
app.use("/api/investigator", investigatorRoutes);
app.use("/api", riskRoutes);
app.use("/api/admin", adminRoutes);

// Global 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "NOT_FOUND",
    message: "Requested API endpoint does not exist.",
  });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled API Error:", err);
  const status = err.code === "LIMIT_FILE_SIZE" ? 413 : Number(err.status) || 500;
  res.status(status).json({
    error: status === 413 ? "PAYLOAD_TOO_LARGE" : "INTERNAL_SERVER_ERROR",
    message: status === 413
      ? "Uploaded file exceeds maximum size limit (20 MB)."
      : err.message || "An unexpected error occurred. Please try again later.",
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`[ClaimGuard AI] Express REST API server running on port ${PORT}`);
  });
}

export default app;