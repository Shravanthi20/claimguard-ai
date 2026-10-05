import { Router, Request, Response } from "express";
import { prisma } from "../config/db";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

// GET /api/claims/:id/risk - Get risk assessment for claim
router.get("/claims/:id/risk", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const riskAssessment = await prisma.riskAssessment.findFirst({
      where: {
        OR: [{ id }, { claimId: id }],
      },
      include: {
        claim: {
          select: {
            id: true,
            claimNumber: true,
            claimAmount: true,
            claimType: true,
            incidentDate: true,
          },
        },
      },
    });

    if (!riskAssessment) {
      res.status(404).json({ error: "NOT_FOUND", message: "Risk assessment not found for this claim." });
      return;
    }

    res.json({ riskAssessment });
  } catch (error: any) {
    console.error("Get Risk Assessment Error:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch risk assessment." });
  }
});

export default router;
