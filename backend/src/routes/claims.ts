import { Router, Request, Response } from "express";
import multer from "multer";
import crypto from "crypto";
import {
  createClaim,
  getClaim,
  listClaims,
  updateClaimStatus,
  updateInvestigationStatus,
  addInvestigationRemark,
  addClaimEvidence,
  getClaimStatistics,
} from "../services/claimService";
import {
  authenticateToken,
  canAccessClaim,
  requireRole,
} from "../middleware/authMiddleware";
import {
  uploadFileToS3,
  getPresignedViewUrl,
  getLocalFilePath,
} from "../services/s3Service";
import {
  getClaimAIResult,
  ingestAIResult,
} from "../services/aiService";
import { Claim, ClaimStatus, InvestigationStatus } from "../models/types";
import { isLocalDataMode } from "../config/aws";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB maximum
  },
});

const paramStr = (val: string | string[] | undefined): string =>
  Array.isArray(val) ? val[0] : val || "";

const claimStatuses: ClaimStatus[] = [
  "SUBMITTED",
  "PROCESSING",
  "AI_ANALYSIS",
  "UNDER_INVESTIGATION",
  "REVIEW",
  "COMPLETED",
  "FAILED",
];

const investigationStatuses: InvestigationStatus[] = [
  "ASSIGNED",
  "UNDER_REVIEW",
  "ADDITIONAL_INFORMATION_REQUIRED",
  "INVESTIGATION_COMPLETED",
  "ESCALATED",
];

const allowedEvidenceTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const authenticateAIIngest = (req: Request, res: Response, next: () => void): void => {
  const expectedToken = process.env.AI_RESULT_INGEST_TOKEN;
  if (!expectedToken) {
    res.status(503).json({ error: "INTEGRATION_UNAVAILABLE", message: "AI result integration is not configured." });
    return;
  }

  const suppliedToken = req.header("x-ai-ingest-token") || "";
  const expected = Buffer.from(expectedToken);
  const supplied = Buffer.from(suppliedToken);
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "AI result integration authentication failed." });
    return;
  }
  next();
};

// GET /api/claims/statistics - Real-time database metrics
router.get("/statistics", authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const filter =
      user.role === "customer"
        ? { customerId: user.userId, role: user.role }
        : user.role === "investigator"
        ? { investigatorId: user.userId, role: user.role }
        : { role: user.role };

    const stats = await getClaimStatistics(filter);
    res.json(stats);
  } catch (error: any) {
    console.error("Statistics error:", error);
    res.status(500).json({ error: "INTERNAL_ERROR", message: "Failed to retrieve claim statistics." });
  }
});

// GET /api/claims/evidence/file/:s3Key - Local dev file viewing endpoint
router.get("/evidence/file/:s3Key", authenticateToken, async (req: Request, res: Response) => {
  if (!isLocalDataMode) {
    res.status(404).json({ error: "NOT_FOUND", message: "Evidence file not found." });
    return;
  }

  const s3Key = paramStr(req.params.s3Key);
  const claimId = s3Key.match(/^claims\/([^/]+)\/(?:documents|images)\/[^/]+$/)?.[1];
  if (!claimId) {
    res.status(404).json({ error: "NOT_FOUND", message: "Evidence file not found." });
    return;
  }

  const claim = await getClaim(claimId);
  if (!claim || !canAccessClaim(req.user!, claim)) {
    res.status(404).json({ error: "NOT_FOUND", message: "Evidence file not found." });
    return;
  }
  const referencedFile = [...(claim.documents || []), ...(claim.images || [])]
    .some((file) => file.s3Key === s3Key);
  if (!referencedFile) {
    res.status(404).json({ error: "NOT_FOUND", message: "Evidence file not found." });
    return;
  }

  const filePath = getLocalFilePath(s3Key);
  if (!filePath) {
    res.status(404).json({ error: "NOT_FOUND", message: "Evidence file not found." });
    return;
  }
  res.sendFile(filePath);
});

// GET /api/claims - List claims filtered by authenticated user role
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { status, claimType } = req.query;

    let claims: Claim[];

    if (user.role === "customer") {
      claims = await listClaims({
        customerId: user.userId,
        status: status as ClaimStatus,
        claimType: claimType as string,
      });
    } else if (user.role === "investigator") {
      claims = await listClaims({
        investigatorId: user.userId,
        status: status as ClaimStatus,
        claimType: claimType as string,
      });
    } else {
      // Admin sees all claims
      claims = await listClaims({
        status: status as ClaimStatus,
        claimType: claimType as string,
      });
    }

    res.json(claims);
  } catch (error: any) {
    console.error("List claims error:", error);
    res.status(500).json({ error: "INTERNAL_ERROR", message: "Failed to list claims." });
  }
});

// POST /api/claims - Create claim with authenticated customer identity
router.post("/", authenticateToken, requireRole("customer"), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const {
      policyNumber,
      incidentDate,
      claimType,
      accidentDescription,
      description,
      claimedAmount,
    } = req.body;

    const desc = accidentDescription || description;

    // Strict validation
    if (!policyNumber || !incidentDate || !claimType || !desc || claimedAmount === undefined) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Policy number, incident date, claim type, accident description, and claimed amount are required.",
      });
      return;
    }

    const normalizedPolicyNumber = String(policyNumber).trim();
    if (normalizedPolicyNumber.length < 4 || normalizedPolicyNumber.length > 64) {
      res.status(400).json({ error: "VALIDATION_ERROR", message: "Policy number must be between 4 and 64 characters." });
      return;
    }

    const parsedIncidentDate = new Date(`${incidentDate}T00:00:00.000Z`);
    const validIncidentDate =
      /^\d{4}-\d{2}-\d{2}$/.test(String(incidentDate)) &&
      !Number.isNaN(parsedIncidentDate.getTime()) &&
      parsedIncidentDate.toISOString().slice(0, 10) === incidentDate &&
      String(incidentDate) <= new Date().toISOString().slice(0, 10);
    if (!validIncidentDate) {
      res.status(400).json({ error: "VALIDATION_ERROR", message: "Incident date must be a valid date that is not in the future." });
      return;
    }

    const allowedClaimTypes = ["Vehicle Accident", "Property Damage", "Theft", "Bodily Injury", "Natural Disaster", "Other"];
    if (!allowedClaimTypes.includes(String(claimType))) {
      res.status(400).json({ error: "VALIDATION_ERROR", message: "Claim type is not supported." });
      return;
    }

    const normalizedDescription = String(desc).trim();
    if (normalizedDescription.length < 20 || normalizedDescription.length > 5000) {
      res.status(400).json({ error: "VALIDATION_ERROR", message: "Description must be between 20 and 5000 characters." });
      return;
    }

    const numAmount = Number(claimedAmount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Claimed amount must be a positive number.",
      });
      return;
    }

    const now = new Date().toISOString();
    const claimId = `CLM-${crypto.randomUUID().toUpperCase()}`;

    const newClaim: Claim = {
      claimId,
      customerId: user.userId,
      userId: user.userId, // Backward compatibility alias
      policyNumber: normalizedPolicyNumber,
      incidentDate: String(incidentDate).trim(),
      claimType: String(claimType).trim(),
      accidentDescription: normalizedDescription,
      description: normalizedDescription,
      claimedAmount: numAmount,
      status: "SUBMITTED",
      investigationStatus: "UNASSIGNED",
      investigatorId: null,
      documents: [],
      images: [],
      aiResult: null,
      investigationRemarks: [],
      createdAt: now,
      updatedAt: now,
    };

    const savedClaim = await createClaim(newClaim);
    res.status(201).json(savedClaim);
  } catch (error: any) {
    console.error("Create claim error:", error);
    res.status(500).json({ error: "INTERNAL_ERROR", message: "Failed to create claim." });
  }
});

// GET /api/claims/:claimId - Retrieve single claim with authorization check
router.get("/:claimId", authenticateToken, async (req: Request, res: Response) => {
  try {
    const claimId = paramStr(req.params.claimId);
    const claim = await getClaim(claimId);

    if (!claim) {
      res.status(404).json({ error: "NOT_FOUND", message: "Claim not found." });
      return;
    }

    // Security: Check customer ownership or investigator/admin authorization
    if (!canAccessClaim(req.user!, claim)) {
      res.status(403).json({
        error: "FORBIDDEN",
        message: "You are not authorized to view this claim.",
      });
      return;
    }

    // Attach signed URLs for evidence preview
    const docsWithUrls = await Promise.all(
      (claim.documents || []).map(async (doc) => ({
        ...doc,
        url: await getPresignedViewUrl(doc.s3Key),
      }))
    );

    const imagesWithUrls = await Promise.all(
      (claim.images || []).map(async (img) => ({
        ...img,
        url: await getPresignedViewUrl(img.s3Key),
      }))
    );

    res.json({
      ...claim,
      documents: docsWithUrls,
      images: imagesWithUrls,
    });
  } catch (error: any) {
    console.error("Get claim error:", error);
    res.status(500).json({ error: "INTERNAL_ERROR", message: "Failed to retrieve claim." });
  }
});

// PATCH /api/claims/:claimId/status - Update claim status
router.patch(
  "/:claimId/status",
  authenticateToken,
  requireRole("investigator", "admin"),
  async (req: Request, res: Response) => {
    try {
      const claimId = paramStr(req.params.claimId);
      const { status } = req.body;

      if (!status) {
        res.status(400).json({ error: "VALIDATION_ERROR", message: "Status is required." });
        return;
      }

      if (!claimStatuses.includes(status as ClaimStatus)) {
        res.status(400).json({ error: "VALIDATION_ERROR", message: "Claim status is not supported." });
        return;
      }

      const claim = await getClaim(claimId);
      if (!claim) {
        res.status(404).json({ error: "NOT_FOUND", message: "Claim not found." });
        return;
      }
      if (!canAccessClaim(req.user!, claim)) {
        res.status(403).json({ error: "FORBIDDEN", message: "You are not authorized to update this claim." });
        return;
      }

      const updated = await updateClaimStatus(claimId, status as ClaimStatus);
      if (!updated) {
        res.status(404).json({ error: "NOT_FOUND", message: "Claim not found." });
        return;
      }

      res.json(updated);
    } catch (error: any) {
      console.error("Update claim status error:", error);
      res.status(500).json({ error: "INTERNAL_ERROR", message: "Failed to update claim status." });
    }
  }
);

// GET /api/claims/:claimId/ai-result - Retrieve AI result for claim
router.get("/:claimId/ai-result", authenticateToken, async (req: Request, res: Response) => {
  try {
    const claimId = paramStr(req.params.claimId);
    const claim = await getClaim(claimId);

    if (!claim) {
      res.status(404).json({ error: "NOT_FOUND", message: "Claim not found." });
      return;
    }

    if (!canAccessClaim(req.user!, claim)) {
      res.status(403).json({ error: "FORBIDDEN", message: "Not authorized to access this claim's AI results." });
      return;
    }

    const aiResultResponse = await getClaimAIResult(claimId);
    res.json(aiResultResponse);
  } catch (error: any) {
    console.error("Get AI result error:", error);
    res.status(500).json({ error: "INTERNAL_ERROR", message: "Failed to retrieve AI result." });
  }
});

// POST /api/claims/:claimId/ai-result - Ingest AI result (for Person 2 integration or Lambda)
router.post(
  "/:claimId/ai-result",
  authenticateAIIngest,
  async (req: Request, res: Response) => {
    try {
      const claimId = paramStr(req.params.claimId);
      const updatedClaim = await ingestAIResult(claimId, req.body);
      res.json(updatedClaim);
    } catch (error: any) {
      console.error("Ingest AI result error:", error);
      res.status(400).json({ error: "VALIDATION_ERROR", message: "AI result was invalid or could not be associated with this claim." });
    }
  }
);

// POST /api/claims/:claimId/evidence - Upload supporting document or photo
router.post(
  "/:claimId/evidence",
  authenticateToken,
  requireRole("customer"),
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const claimId = paramStr(req.params.claimId);
      const claim = await getClaim(claimId);

      if (!claim) {
        res.status(404).json({ error: "NOT_FOUND", message: "Claim not found." });
        return;
      }

      if (!canAccessClaim(req.user!, claim)) {
        res.status(403).json({ error: "FORBIDDEN", message: "Not authorized to upload evidence for this claim." });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({ error: "VALIDATION_ERROR", message: "No file provided for upload." });
        return;
      }

      if (!allowedEvidenceTypes.has(file.mimetype)) {
        res.status(400).json({ error: "VALIDATION_ERROR", message: "This file type is not supported." });
        return;
      }
      if ([...(claim.documents || []), ...(claim.images || [])].length >= 20) {
        res.status(400).json({ error: "VALIDATION_ERROR", message: "A claim can contain no more than 20 evidence files." });
        return;
      }

      const isImage = file.mimetype.startsWith("image/");
      const category: "document" | "image" = isImage ? "image" : "document";

      // Upload to S3 (or local fallback)
      const evidence = await uploadFileToS3(
        claimId,
        file.originalname,
        file.buffer,
        file.mimetype,
        category
      );

      // Save reference to DynamoDB
      const updatedClaim = await addClaimEvidence(claimId, evidence);

      // Add signed URL for immediate client preview
      evidence.url = await getPresignedViewUrl(evidence.s3Key);

      res.status(201).json({
        evidence,
        claim: updatedClaim,
      });
    } catch (error: any) {
      console.error("Evidence upload error:", error);
      res.status(500).json({ error: "INTERNAL_ERROR", message: "Failed to upload evidence." });
    }
  }
);

// POST /api/claims/:claimId/remarks - Add investigator remarks
router.post(
  "/:claimId/remarks",
  authenticateToken,
  requireRole("investigator", "admin"),
  async (req: Request, res: Response) => {
    try {
      const claimId = paramStr(req.params.claimId);
      const { remark } = req.body;
      const user = req.user!;

      if (!remark || !String(remark).trim()) {
        res.status(400).json({ error: "VALIDATION_ERROR", message: "Remark text is required." });
        return;
      }

      const claim = await getClaim(claimId);
      if (!claim) {
        res.status(404).json({ error: "NOT_FOUND", message: "Claim not found." });
        return;
      }

      if (!canAccessClaim(user, claim)) {
        res.status(403).json({ error: "FORBIDDEN", message: "Not authorized to remark on this claim." });
        return;
      }

      const remarkItem = {
        id: crypto.randomUUID(),
        investigatorId: user.userId,
        investigatorName: user.name,
        remark: String(remark).trim(),
        timestamp: new Date().toISOString(),
      };

      const updatedClaim = await addInvestigationRemark(claimId, remarkItem);
      res.status(201).json({
        remark: remarkItem,
        claim: updatedClaim,
      });
    } catch (error: any) {
      console.error("Add remark error:", error);
      res.status(500).json({ error: "INTERNAL_ERROR", message: "Failed to add remark." });
    }
  }
);

// PATCH /api/claims/:claimId/investigation-status - Update investigation status
router.patch(
  "/:claimId/investigation-status",
  authenticateToken,
  requireRole("investigator", "admin"),
  async (req: Request, res: Response) => {
    try {
      const claimId = paramStr(req.params.claimId);
      const { investigationStatus } = req.body;
      const user = req.user!;

      if (!investigationStatus) {
        res.status(400).json({ error: "VALIDATION_ERROR", message: "Investigation status is required." });
        return;
      }
      if (!investigationStatuses.includes(investigationStatus as InvestigationStatus)) {
        res.status(400).json({ error: "VALIDATION_ERROR", message: "Investigation status is not supported." });
        return;
      }

      const claim = await getClaim(claimId);
      if (!claim) {
        res.status(404).json({ error: "NOT_FOUND", message: "Claim not found." });
        return;
      }

      if (!canAccessClaim(user, claim)) {
        res.status(403).json({ error: "FORBIDDEN", message: "Not authorized to update this claim's investigation." });
        return;
      }

      const assignedId = user.role === "investigator" ? user.userId : undefined;
      const assignedName = user.role === "investigator" ? user.name : undefined;

      const updated = await updateInvestigationStatus(
        claimId,
        investigationStatus as InvestigationStatus,
        assignedId,
        assignedName
      );

      res.json(updated);
    } catch (error: any) {
      console.error("Update investigation status error:", error);
      res.status(500).json({ error: "INTERNAL_ERROR", message: "Failed to update investigation status." });
    }
  }
);

export default router;