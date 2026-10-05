import { Router, Request, Response } from "express";
import { prisma } from "../config/db";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";
import { calculateInitialRiskAssessment } from "../services/riskEngine";

const router = Router();

// Helper to generate claim number
function generateClaimNumber(): string {
  const year = new Date().getFullYear();
  const randomStr = Math.floor(100000 + Math.random() * 900000);
  return `CLM-${year}-${randomStr}`;
}

// POST /api/claims - Submit a new claim
router.post(
  "/",
  authenticateToken,
  upload.array("files", 10),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "UNAUTHORIZED", message: "Not authenticated" });
        return;
      }

      const {
        policyNumber,
        policyId: inputPolicyId,
        claimType,
        incidentDate,
        incidentLocation,
        claimAmount,
        description,
      } = req.body;

      if (!claimType || !incidentDate || !incidentLocation || !claimAmount || !description) {
        res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "Please fill in all required claim fields (claimType, incidentDate, incidentLocation, claimAmount, description).",
        });
        return;
      }

      const parsedAmount = parseFloat(claimAmount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "Claim amount must be a positive number.",
        });
        return;
      }

      // Find or create matching policy
      let policyId: string | null = inputPolicyId || null;

      if (!policyId && policyNumber) {
        const foundPolicy = await prisma.policy.findFirst({
          where: { policyNumber: policyNumber.trim() },
        });
        if (foundPolicy) {
          policyId = foundPolicy.id;
        }
      }

      if (!policyId) {
        // Find existing user policy or create a default policy
        let userPolicy = await prisma.policy.findFirst({
          where: { userId: req.user.id },
        });

        if (!userPolicy) {
          const randNum = Math.floor(100000 + Math.random() * 900000);
          userPolicy = await prisma.policy.create({
            data: {
              policyNumber: policyNumber || `POL-${claimType.toUpperCase()}-${randNum}`,
              userId: req.user.id,
              policyType: `${claimType} Policy`,
              status: "ACTIVE",
              startDate: new Date(),
              endDate: new Date(Date.now() + 365 * 24 * 3600 * 1000),
              coverageAmount: Math.max(parsedAmount * 2, 50000),
            },
          });
        }
        policyId = userPolicy.id;
      }

      const claimNum = generateClaimNumber();
      const files = (req.files as Express.Multer.File[]) || [];

      // Create claim in DB
      const claim = await prisma.claim.create({
        data: {
          claimNumber: claimNum,
          customerId: req.user.id,
          policyId,
          claimType,
          incidentDate: new Date(incidentDate),
          incidentLocation,
          claimAmount: parsedAmount,
          description,
          status: "SUBMITTED",
        },
      });

      // Save evidence metadata if files were uploaded
      if (files.length > 0) {
        await prisma.evidence.createMany({
          data: files.map((file) => ({
            claimId: claim.id,
            fileName: file.originalname,
            filePath: `/uploads/${file.filename}`,
            fileType: file.mimetype,
            fileSize: file.size,
            description: `Uploaded during claim submission`,
          })),
        });
      }

      // Create Claim Event
      await prisma.claimEvent.create({
        data: {
          claimId: claim.id,
          eventType: "CLAIM_SUBMITTED",
          description: `Claim ${claim.claimNumber} submitted by ${req.user.name}`,
          createdBy: req.user.name,
        },
      });

      // Calculate initial demo risk assessment
      const riskCalc = calculateInitialRiskAssessment({
        claimType,
        claimAmount: parsedAmount,
        description,
        incidentDate: new Date(incidentDate),
        evidenceCount: files.length,
      });

      // Save Risk Assessment
      const riskAssessment = await prisma.riskAssessment.create({
        data: {
          claimId: claim.id,
          riskScore: riskCalc.riskScore,
          fraudProbability: riskCalc.fraudProbability,
          riskLevel: riskCalc.riskLevel,
          priority: riskCalc.priority,
          riskFactors: riskCalc.riskFactors,
          modelVersion: riskCalc.modelVersion,
        },
      });

      // Create initial Investigation entry
      const investigation = await prisma.investigation.create({
        data: {
          claimId: claim.id,
          status: "PENDING",
        },
      });

      // Fetch complete created claim object to return
      const fullClaim = await prisma.claim.findUnique({
        where: { id: claim.id },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          policy: true,
          evidence: true,
          riskAssessment: true,
          investigation: {
            include: {
              investigator: { select: { id: true, name: true, email: true } },
              notes: {
                include: { author: { select: { id: true, name: true } } },
                orderBy: { createdAt: "desc" },
              },
            },
          },
          claimEvents: { orderBy: { createdAt: "asc" } },
        },
      });

      res.status(201).json({
        message: "Claim submitted successfully",
        claim: fullClaim,
      });
    } catch (error: any) {
      console.error("Create Claim Error:", error);
      res.status(500).json({
        error: "SERVER_ERROR",
        message: "Failed to submit claim. Please check your inputs.",
      });
    }
  }
);

// GET /api/claims - List claims with role filtering & search
router.get("/", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Not authenticated" });
      return;
    }

    const { status, riskLevel, search, claimType } = req.query;

    const whereClause: any = {};

    // Role-based scoping
    if (req.user.role === "CUSTOMER") {
      whereClause.customerId = req.user.id;
    }

    if (status && typeof status === "string") {
      whereClause.status = status.toUpperCase();
    }

    if (claimType && typeof claimType === "string") {
      whereClause.claimType = claimType;
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      const query = search.trim();
      whereClause.OR = [
        { claimNumber: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { incidentLocation: { contains: query, mode: "insensitive" } },
        { customer: { name: { contains: query, mode: "insensitive" } } },
      ];
    }

    if (riskLevel && typeof riskLevel === "string") {
      whereClause.riskAssessment = {
        riskLevel: riskLevel.toUpperCase(),
      };
    }

    const claims = await prisma.claim.findMany({
      where: whereClause,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        investigator: { select: { id: true, name: true, email: true } },
        policy: true,
        evidence: true,
        riskAssessment: true,
        investigation: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ claims, count: claims.length });
  } catch (error: any) {
    console.error("List Claims Error:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch claims." });
  }
});

// GET /api/claims/:id - Get claim details
router.get("/:id", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const claim = await prisma.claim.findFirst({
      where: {
        OR: [{ id: id }, { claimNumber: id }],
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        investigator: { select: { id: true, name: true, email: true } },
        policy: true,
        evidence: true,
        riskAssessment: true,
        investigation: {
          include: {
            investigator: { select: { id: true, name: true, email: true } },
            notes: {
              include: { author: { select: { id: true, name: true } } },
              orderBy: { createdAt: "desc" },
            },
          },
        },
        claimEvents: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!claim) {
      res.status(404).json({ error: "NOT_FOUND", message: "Claim not found." });
      return;
    }

    // Role security check
    if (req.user?.role === "CUSTOMER" && claim.customerId !== req.user.id) {
      res.status(403).json({ error: "FORBIDDEN", message: "You do not have permission to view this claim." });
      return;
    }

    res.json({ claim });
  } catch (error: any) {
    console.error("Get Claim Error:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to retrieve claim." });
  }
});

// PUT /api/claims/:id - Update claim status or investigator
router.put(
  "/:id",
  authenticateToken,
  requireRole("INVESTIGATOR", "ADMIN"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, investigatorId, description } = req.body;

      const existingClaim = await prisma.claim.findUnique({ where: { id } });
      if (!existingClaim) {
        res.status(404).json({ error: "NOT_FOUND", message: "Claim not found." });
        return;
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (investigatorId !== undefined) updateData.investigatorId = investigatorId;
      if (description) updateData.description = description;

      const updatedClaim = await prisma.claim.update({
        where: { id },
        data: updateData,
        include: {
          customer: { select: { id: true, name: true, email: true } },
          investigator: { select: { id: true, name: true, email: true } },
          riskAssessment: true,
          investigation: true,
        },
      });

      // Add audit event
      await prisma.claimEvent.create({
        data: {
          claimId: id,
          eventType: "CLAIM_UPDATED",
          description: `Claim status updated to ${status || existingClaim.status} by ${req.user?.name}`,
          createdBy: req.user?.name,
        },
      });

      res.json({ message: "Claim updated successfully", claim: updatedClaim });
    } catch (error: any) {
      console.error("Update Claim Error:", error);
      res.status(500).json({ error: "SERVER_ERROR", message: "Failed to update claim." });
    }
  }
);

// POST /api/claims/:id/evidence - Upload evidence files to existing claim
router.post(
  "/:id/evidence",
  authenticateToken,
  upload.array("files", 10),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { description } = req.body;
      const files = (req.files as Express.Multer.File[]) || [];

      const claim = await prisma.claim.findUnique({ where: { id } });
      if (!claim) {
        res.status(404).json({ error: "NOT_FOUND", message: "Claim not found." });
        return;
      }

      if (files.length === 0) {
        res.status(400).json({ error: "VALIDATION_ERROR", message: "No files uploaded." });
        return;
      }

      const newEvidence = await Promise.all(
        files.map((file) =>
          prisma.evidence.create({
            data: {
              claimId: id,
              fileName: file.originalname,
              filePath: `/uploads/${file.filename}`,
              fileType: file.mimetype,
              fileSize: file.size,
              description: description || "Additional supporting evidence",
            },
          })
        )
      );

      await prisma.claimEvent.create({
        data: {
          claimId: id,
          eventType: "EVIDENCE_ADDED",
          description: `${files.length} new evidence file(s) added by ${req.user?.name}`,
          createdBy: req.user?.name,
        },
      });

      res.status(201).json({
        message: "Evidence files uploaded successfully",
        evidence: newEvidence,
      });
    } catch (error: any) {
      console.error("Upload Evidence Error:", error);
      res.status(500).json({ error: "SERVER_ERROR", message: "Failed to upload evidence." });
    }
  }
);

// GET /api/claims/:id/evidence - Get claim evidence list
router.get("/:id/evidence", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const evidence = await prisma.evidence.findMany({
      where: { claimId: id },
      orderBy: { uploadedAt: "desc" },
    });

    res.json({ evidence });
  } catch (error: any) {
    console.error("Get Evidence Error:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch evidence." });
  }
});

export default router;