import { Router, Request, Response } from "express";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";
import {
  listClaims,
  getClaimStatistics,
  getClaim,
  updateInvestigationStatus,
} from "../services/claimService";

const router = Router();

// Admin-only routes
router.use(authenticateToken);
router.use(requireRole("admin"));

// GET /api/admin/statistics
router.get("/statistics", async (_req: Request, res: Response) => {
  try {
    const stats = await getClaimStatistics({ role: "admin" });
    res.json(stats);
  } catch (error: any) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "INTERNAL_ERROR", message: "Failed to retrieve admin statistics." });
  }
});

// GET /api/admin/claims
router.get("/claims", async (_req: Request, res: Response) => {
  try {
    const claims = await listClaims();
    res.json(claims);
  } catch (error: any) {
    console.error("Admin claims error:", error);
    res.status(500).json({ error: "INTERNAL_ERROR", message: "Failed to retrieve all claims." });
  }
});

// POST /api/admin/claims/:claimId/assign - Assign an investigator to a claim
router.post("/claims/:claimId/assign", async (req: Request, res: Response) => {
  try {
    const claimId = Array.isArray(req.params.claimId)
      ? req.params.claimId[0]
      : req.params.claimId || "";
    const investigatorId = typeof req.body.investigatorId === "string"
      ? req.body.investigatorId.trim()
      : "";
    const investigatorName = typeof req.body.investigatorName === "string"
      ? req.body.investigatorName.trim()
      : undefined;

    if (!investigatorId) {
      res.status(400).json({ error: "VALIDATION_ERROR", message: "Investigator ID is required." });
      return;
    }

    const updated = await updateInvestigationStatus(
      claimId,
      "ASSIGNED",
      investigatorId,
      investigatorName
    );

    if (!updated) {
      res.status(404).json({ error: "NOT_FOUND", message: "Claim not found." });
      return;
    }

    res.json(updated);
  } catch (error: any) {
    console.error("Admin assign error:", error);
    res.status(500).json({ error: "INTERNAL_ERROR", message: "Failed to assign investigator." });
  }
});

export default router;
