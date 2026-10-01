import { Router, Request, Response } from "express";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";
import { listClaims, getClaimStatistics } from "../services/claimService";

const router = Router();

// Investigator-only routes
router.use(authenticateToken);
router.use(requireRole("investigator", "admin"));

// GET /api/investigator/claims - List claims assigned or open for review
router.get("/claims", async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const claims = await listClaims({
      investigatorId: user.userId,
    });
    res.json(claims);
  } catch (error: any) {
    console.error("Investigator claims error:", error);
    res.status(500).json({ error: "INTERNAL_ERROR", message: "Failed to retrieve investigator claims." });
  }
});

// GET /api/investigator/statistics
router.get("/statistics", async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const stats = await getClaimStatistics({
      investigatorId: user.userId,
      role: "investigator",
    });
    res.json(stats);
  } catch (error: any) {
    console.error("Investigator statistics error:", error);
    res.status(500).json({ error: "INTERNAL_ERROR", message: "Failed to retrieve statistics." });
  }
});

export default router;
