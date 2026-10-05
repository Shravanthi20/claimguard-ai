import { Router, Request, Response } from "express";
import { prisma } from "../config/db";

const router = Router();

router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    // Ping database
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "ClaimGuard AI Backend API",
      database: "connected",
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      service: "ClaimGuard AI Backend API",
      database: "disconnected",
      error: (error as Error).message,
    });
  }
});

export default router;
