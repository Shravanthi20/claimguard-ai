import { Router, Request, Response } from "express";
import { prisma } from "../config/db";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";

const router = Router();

// GET /api/investigations - List all investigations
router.get(
  "/",
  authenticateToken,
  requireRole("INVESTIGATOR", "ADMIN"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, riskLevel } = req.query;

      const whereClause: any = {};
      if (status && typeof status === "string") {
        whereClause.status = status.toUpperCase();
      }

      if (riskLevel && typeof riskLevel === "string") {
        whereClause.claim = {
          riskAssessment: {
            riskLevel: riskLevel.toUpperCase(),
          },
        };
      }

      const investigations = await prisma.investigation.findMany({
        where: whereClause,
        include: {
          claim: {
            include: {
              customer: { select: { id: true, name: true, email: true } },
              riskAssessment: true,
              evidence: true,
            },
          },
          investigator: { select: { id: true, name: true, email: true } },
          notes: {
            include: { author: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({ investigations, count: investigations.length });
    } catch (error: any) {
      console.error("List Investigations Error:", error);
      res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch investigations." });
    }
  }
);

// GET /api/investigations/:id - Get investigation detail
router.get(
  "/:id",
  authenticateToken,
  requireRole("INVESTIGATOR", "ADMIN"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const investigation = await prisma.investigation.findFirst({
        where: {
          OR: [{ id: id }, { claimId: id }],
        },
        include: {
          claim: {
            include: {
              customer: { select: { id: true, name: true, email: true } },
              policy: true,
              evidence: true,
              riskAssessment: true,
              claimEvents: { orderBy: { createdAt: "asc" } },
            },
          },
          investigator: { select: { id: true, name: true, email: true } },
          notes: {
            include: { author: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!investigation) {
        res.status(404).json({ error: "NOT_FOUND", message: "Investigation record not found." });
        return;
      }

      res.json({ investigation });
    } catch (error: any) {
      console.error("Get Investigation Error:", error);
      res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch investigation." });
    }
  }
);

// PUT /api/investigations/:id/status - Update investigation status & decision
router.put(
  "/:id/status",
  authenticateToken,
  requireRole("INVESTIGATOR", "ADMIN"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      if (!status) {
        res.status(400).json({ error: "VALIDATION_ERROR", message: "Investigation status is required." });
        return;
      }

      const validStatus = status.toUpperCase();

      const existingInv = await prisma.investigation.findFirst({
        where: {
          OR: [{ id: id }, { claimId: id }],
        },
        include: { claim: true },
      });

      if (!existingInv) {
        res.status(404).json({ error: "NOT_FOUND", message: "Investigation record not found." });
        return;
      }

      // Map investigation status to claim status
      let claimStatus: "UNDER_INVESTIGATION" | "APPROVED" | "REJECTED" | "ACTION_REQUIRED" | "IN_REVIEW" = "UNDER_INVESTIGATION";
      if (validStatus === "APPROVED") claimStatus = "APPROVED";
      else if (validStatus === "REJECTED") claimStatus = "REJECTED";
      else if (validStatus === "MORE_INFO_REQUESTED") claimStatus = "ACTION_REQUIRED";
      else if (validStatus === "IN_PROGRESS") claimStatus = "UNDER_INVESTIGATION";

      const updatedInv = await prisma.investigation.update({
        where: { id: existingInv.id },
        data: {
          status: validStatus,
          investigatorId: req.user?.id,
          startedAt: existingInv.startedAt || new Date(),
          completedAt: ["APPROVED", "REJECTED", "COMPLETED"].includes(validStatus) ? new Date() : null,
        },
        include: {
          investigator: { select: { id: true, name: true, email: true } },
          notes: {
            include: { author: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      // Update parent claim status and investigator assignment
      await prisma.claim.update({
        where: { id: existingInv.claimId },
        data: {
          status: claimStatus,
          investigatorId: req.user?.id,
        },
      });

      // Add optional note if provided
      if (note && note.trim() !== "") {
        await prisma.investigationNote.create({
          data: {
            investigationId: existingInv.id,
            authorId: req.user!.id,
            note: note.trim(),
          },
        });
      }

      // Log claim audit event
      await prisma.claimEvent.create({
        data: {
          claimId: existingInv.claimId,
          eventType: "INVESTIGATION_STATUS_CHANGED",
          description: `Investigation status changed to ${validStatus} (${claimStatus}) by ${req.user?.name}`,
          createdBy: req.user?.name,
        },
      });

      res.json({
        message: "Investigation status updated successfully",
        investigation: updatedInv,
      });
    } catch (error: any) {
      console.error("Update Investigation Status Error:", error);
      res.status(500).json({ error: "SERVER_ERROR", message: "Failed to update investigation status." });
    }
  }
);

// POST /api/investigations/:id/notes - Add investigation note
router.post(
  "/:id/notes",
  authenticateToken,
  requireRole("INVESTIGATOR", "ADMIN"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { note } = req.body;

      if (!note || note.trim() === "") {
        res.status(400).json({ error: "VALIDATION_ERROR", message: "Note content cannot be empty." });
        return;
      }

      const existingInv = await prisma.investigation.findFirst({
        where: {
          OR: [{ id: id }, { claimId: id }],
        },
      });

      if (!existingInv) {
        res.status(404).json({ error: "NOT_FOUND", message: "Investigation record not found." });
        return;
      }

      const newNote = await prisma.investigationNote.create({
        data: {
          investigationId: existingInv.id,
          authorId: req.user!.id,
          note: note.trim(),
        },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      });

      await prisma.claimEvent.create({
        data: {
          claimId: existingInv.claimId,
          eventType: "INVESTIGATION_NOTE_ADDED",
          description: `Investigation note added by ${req.user?.name}`,
          createdBy: req.user?.name,
        },
      });

      res.status(201).json({
        message: "Investigation note added",
        note: newNote,
      });
    } catch (error: any) {
      console.error("Add Investigation Note Error:", error);
      res.status(500).json({ error: "SERVER_ERROR", message: "Failed to add investigation note." });
    }
  }
);

export default router;
