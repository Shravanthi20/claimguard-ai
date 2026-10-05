import { Router, Request, Response } from "express";
import { prisma } from "../config/db";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";

const router = Router();

// Apply auth & Admin role check to all admin routes
router.use(authenticateToken);
router.use(requireRole("ADMIN"));

// GET /api/admin/statistics - Comprehensive platform statistics & metrics
router.get("/statistics", async (_req: Request, res: Response): Promise<void> => {
  try {
    const totalUsers = await prisma.user.count();
    const customersCount = await prisma.user.count({ where: { role: "CUSTOMER" } });
    const investigatorsCount = await prisma.user.count({ where: { role: "INVESTIGATOR" } });
    const adminsCount = await prisma.user.count({ where: { role: "ADMIN" } });

    const totalClaims = await prisma.claim.count();

    const claimsByStatus = {
      submitted: await prisma.claim.count({ where: { status: "SUBMITTED" } }),
      inReview: await prisma.claim.count({ where: { status: "IN_REVIEW" } }),
      underInvestigation: await prisma.claim.count({ where: { status: "UNDER_INVESTIGATION" } }),
      approved: await prisma.claim.count({ where: { status: "APPROVED" } }),
      rejected: await prisma.claim.count({ where: { status: "REJECTED" } }),
      actionRequired: await prisma.claim.count({ where: { status: "ACTION_REQUIRED" } }),
    };

    const riskDistribution = {
      low: await prisma.riskAssessment.count({ where: { riskLevel: "LOW" } }),
      medium: await prisma.riskAssessment.count({ where: { riskLevel: "MEDIUM" } }),
      high: await prisma.riskAssessment.count({ where: { riskLevel: "HIGH" } }),
      critical: await prisma.riskAssessment.count({ where: { riskLevel: "CRITICAL" } }),
    };

    const totalClaimAmountResult = await prisma.claim.aggregate({
      _sum: { claimAmount: true },
      _avg: { claimAmount: true },
    });

    const activeInvestigations = await prisma.investigation.count({
      where: { status: { in: ["PENDING", "IN_PROGRESS", "MORE_INFO_REQUESTED"] } },
    });

    const highRiskClaimsCount = await prisma.riskAssessment.count({
      where: { riskLevel: { in: ["HIGH", "CRITICAL"] } },
    });

    res.json({
      statistics: {
        totalUsers,
        usersByRole: {
          customers: customersCount,
          investigators: investigatorsCount,
          admins: adminsCount,
        },
        totalClaims,
        claimsByStatus,
        activeInvestigations,
        highRiskClaims: highRiskClaimsCount,
        riskDistribution,
        financials: {
          totalAmount: totalClaimAmountResult._sum.claimAmount || 0,
          averageAmount: totalClaimAmountResult._avg.claimAmount || 0,
        },
      },
    });
  } catch (error: any) {
    console.error("Admin Statistics Error:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to load admin statistics." });
  }
});

// GET /api/admin/users - User management list
router.get("/users", async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, search } = req.query;

    const whereClause: any = {};
    if (role && typeof role === "string") {
      whereClause.role = role.toUpperCase();
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      const query = search.trim();
      whereClause.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            claims: true,
            policies: true,
            investigations: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ users, count: users.length });
  } catch (error: any) {
    console.error("Admin List Users Error:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch users." });
  }
});

// GET /api/admin/claims - System-wide claims list
router.get("/claims", async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, riskLevel, search } = req.query;

    const whereClause: any = {};
    if (status && typeof status === "string") {
      whereClause.status = status.toUpperCase();
    }

    if (riskLevel && typeof riskLevel === "string") {
      whereClause.riskAssessment = { riskLevel: riskLevel.toUpperCase() };
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      const query = search.trim();
      whereClause.OR = [
        { claimNumber: { contains: query, mode: "insensitive" } },
        { customer: { name: { contains: query, mode: "insensitive" } } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }

    const claims = await prisma.claim.findMany({
      where: whereClause,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        investigator: { select: { id: true, name: true, email: true } },
        policy: true,
        riskAssessment: true,
        investigation: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ claims, count: claims.length });
  } catch (error: any) {
    console.error("Admin Claims Error:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch claims." });
  }
});

export default router;
