import { Router } from "express";
import {
  AWS_REGION,
  DYNAMODB_CLAIMS_TABLE,
  isCognitoConfigured,
  isLocalDataMode,
  isS3Configured,
} from "../config/aws";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "ClaimGuard AI backend",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    region: AWS_REGION,
    integrations: {
      cognito: isCognitoConfigured ? "configured" : "not-configured",
      s3: isS3Configured ? "configured" : isLocalDataMode ? "local-only" : "not-configured",
      dynamoDb: DYNAMODB_CLAIMS_TABLE
        ? "configured"
        : isLocalDataMode
        ? "local-only"
        : "not-configured",
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
