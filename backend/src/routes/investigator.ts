import { Router, Request, Response } from "express";
import { prisma } from "../config/db";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";

const router = Router();

// Apply auth & role guard to all investigator routes
router.use(authenticateToken);
router.use(requireRole("INVESTIGATOR", "ADMIN"));

// GET /api/investigator/claims — List claims assigned to this investigator
router.get("/claims", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    const claims = await prisma.claim.findMany({
      where: { investigatorId: user.id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        riskAssessment: true,
        investigation: true,
        evidence: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ claims, count: claims.length });
  } catch (error: any) {
    console.error("Investigator claims error:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to retrieve investigator claims." });
  }
});

// GET /api/investigator/statistics — Stats for this investigator
router.get("/statistics", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    const [totalAssigned, pendingCount, inProgressCount, completedCount, highRiskCount] =
      await Promise.all([
        prisma.investigation.count({ where: { investigatorId: user.id } }),
        prisma.investigation.count({ where: { investigatorId: user.id, status: "PENDING" } }),
        prisma.investigation.count({ where: { investigatorId: user.id, status: "IN_PROGRESS" } }),
        prisma.investigation.count({
          where: {
            investigatorId: user.id,
            status: { in: ["COMPLETED", "APPROVED", "REJECTED"] },
          },
        }),
        prisma.riskAssessment.count({
          where: {
            riskLevel: { in: ["HIGH", "CRITICAL"] },
            claim: { investigatorId: user.id },
          },
        }),
      ]);

    res.json({
      statistics: {
        totalAssigned,
        pendingInvestigations: pendingCount,
        inProgress: inProgressCount,
        completed: completedCount,
        highRiskClaims: highRiskCount,
      },
    });
  } catch (error: any) {
    console.error("Investigator statistics error:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to retrieve statistics." });
  }
});

export default router;
