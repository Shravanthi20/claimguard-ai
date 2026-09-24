import { Router } from "express";
import { createClaim, getClaim } from "../services/claimService";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const claim = {
      claimId: `CLM-${Date.now()}`,
      userId: req.body.userId,
      claimType: req.body.claimType,
      description: req.body.description,
      claimedAmount: Number(req.body.claimedAmount),
      status: "SUBMITTED",
      createdAt: new Date().toISOString(),
    };

    const result = await createClaim(claim);

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create claim",
    });
  }
});

router.get("/:claimId", async (req, res) => {
  try {
    const claim = await getClaim(req.params.claimId);

    if (!claim) {
      return res.status(404).json({
        message: "Claim not found",
      });
    }

    res.json(claim);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to retrieve claim",
    });
  }
});

export default router;