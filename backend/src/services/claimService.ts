import {
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, DYNAMODB_CLAIMS_TABLE, isLocalDataMode } from "../config/aws";
import {
  Claim,
  ClaimStatus,
  EvidenceFile,
  InvestigationRemark,
  InvestigationStatus,
  AIResult,
} from "../models/types";

const localClaims = new Map<string, Claim>();

export async function createClaim(claim: Claim): Promise<Claim> {
  if (isLocalDataMode) {
    localClaims.set(claim.claimId, { ...claim });
    return claim;
  }

  try {
    await docClient.send(
      new PutCommand({
        TableName: DYNAMODB_CLAIMS_TABLE,
        Item: claim,
      })
    );
  } catch (error: any) {
    console.error("DynamoDB claim write failed:", error);
    throw new Error("Unable to save claim record.");
  }

  return claim;
}

export async function getClaim(claimId: string): Promise<Claim | null> {
  if (isLocalDataMode) {
    return localClaims.get(claimId) || null;
  }

  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: DYNAMODB_CLAIMS_TABLE,
        Key: { claimId },
      })
    );

    if (result.Item) {
      return result.Item as Claim;
    }
  } catch (error: any) {
    console.error("DynamoDB claim read failed:", error);
    throw new Error("Unable to retrieve claim record.");
  }

  return null;
}

export interface ClaimFilters {
  customerId?: string;
  investigatorId?: string;
  status?: ClaimStatus;
  claimType?: string;
}

export async function listClaims(filters: ClaimFilters = {}): Promise<Claim[]> {
  let claims: Claim[];
  if (isLocalDataMode) {
    claims = Array.from(localClaims.values());
  } else {
    claims = [];
    let exclusiveStartKey: Record<string, unknown> | undefined;
    try {
      do {
        const result = await docClient.send(
          new ScanCommand({
            TableName: DYNAMODB_CLAIMS_TABLE,
            ExclusiveStartKey: exclusiveStartKey,
          })
        );
        claims.push(...((result.Items || []) as Claim[]));
        exclusiveStartKey = result.LastEvaluatedKey;
      } while (exclusiveStartKey);
    } catch (error: any) {
      console.error("DynamoDB claim scan failed:", error);
      throw new Error("Unable to retrieve claim records.");
    }
  }

  // Apply filters strictly
  if (filters.customerId) {
    claims = claims.filter(
      (c) =>
        c.customerId === filters.customerId ||
        c.userId === filters.customerId
    );
  }

  if (filters.investigatorId) {
    claims = claims.filter((c) => c.investigatorId === filters.investigatorId);
  }

  if (filters.status) {
    claims = claims.filter((c) => c.status === filters.status);
  }

  if (filters.claimType) {
    claims = claims.filter((c) => c.claimType === filters.claimType);
  }

  // Sort by createdAt desc
  claims.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return claims;
}

export async function updateClaimStatus(
  claimId: string,
  status: ClaimStatus
): Promise<Claim | null> {
  const claim = await getClaim(claimId);
  if (!claim) return null;

  claim.status = status;
  claim.updatedAt = new Date().toISOString();

  // If transitioning to completed/closed
  if (status === "COMPLETED") {
    claim.investigationStatus = "INVESTIGATION_COMPLETED";
  }

  return await saveUpdatedClaim(claim);
}

export async function updateInvestigationStatus(
  claimId: string,
  investigationStatus: InvestigationStatus,
  investigatorId?: string,
  investigatorName?: string
): Promise<Claim | null> {
  const claim = await getClaim(claimId);
  if (!claim) return null;

  claim.investigationStatus = investigationStatus;
  if (investigatorId) {
    claim.investigatorId = investigatorId;
  }
  if (investigatorName) {
    claim.investigatorName = investigatorName;
  }
  claim.updatedAt = new Date().toISOString();

  if (
    investigationStatus === "ASSIGNED" ||
    investigationStatus === "UNDER_REVIEW" ||
    investigationStatus === "ADDITIONAL_INFORMATION_REQUIRED" ||
    investigationStatus === "ESCALATED"
  ) {
    claim.status = "UNDER_INVESTIGATION";
  } else if (investigationStatus === "INVESTIGATION_COMPLETED") {
    claim.status = "REVIEW";
  }

  return await saveUpdatedClaim(claim);
}

export async function addInvestigationRemark(
  claimId: string,
  remark: InvestigationRemark
): Promise<Claim | null> {
  const claim = await getClaim(claimId);
  if (!claim) return null;

  if (!Array.isArray(claim.investigationRemarks)) {
    claim.investigationRemarks = [];
  }

  claim.investigationRemarks.push(remark);
  claim.updatedAt = new Date().toISOString();

  return await saveUpdatedClaim(claim);
}

export async function addClaimEvidence(
  claimId: string,
  evidence: EvidenceFile
): Promise<Claim | null> {
  const claim = await getClaim(claimId);
  if (!claim) return null;

  if (!Array.isArray(claim.documents)) claim.documents = [];
  if (!Array.isArray(claim.images)) claim.images = [];

  if (evidence.category === "image") {
    claim.images.push(evidence);
  } else {
    claim.documents.push(evidence);
  }

  claim.updatedAt = new Date().toISOString();
  return await saveUpdatedClaim(claim);
}

export async function setClaimAIResult(
  claimId: string,
  aiResult: AIResult
): Promise<Claim | null> {
  const claim = await getClaim(claimId);
  if (!claim) return null;

  claim.aiResult = aiResult;
  claim.status = "AI_ANALYSIS";

  if (aiResult.investigationRequired && claim.investigatorId) {
    claim.status = "UNDER_INVESTIGATION";
    if (claim.investigationStatus === "UNASSIGNED") {
      claim.investigationStatus = "ASSIGNED";
    }
  } else if (aiResult.investigationRequired) {
    claim.investigationStatus = "UNASSIGNED";
  }

  claim.updatedAt = new Date().toISOString();
  return await saveUpdatedClaim(claim);
}

export async function getClaimStatistics(filters: {
  customerId?: string;
  investigatorId?: string;
  role?: string;
}): Promise<{
  totalClaims: number;
  pendingClaims: number;
  underInvestigation: number;
  completedClaims: number;
  highRiskClaims: number;
  requiresAttention: number;
}> {
  const allClaims = await listClaims({
    customerId: filters.customerId,
    investigatorId: filters.investigatorId,
  });

  const totalClaims = allClaims.length;
  let pendingClaims = 0;
  let underInvestigation = 0;
  let completedClaims = 0;
  let highRiskClaims = 0;
  let requiresAttention = 0;

  for (const claim of allClaims) {
    if (
      claim.status === "SUBMITTED" ||
      claim.status === "PROCESSING" ||
      claim.status === "AI_ANALYSIS"
    ) {
      pendingClaims++;
    } else if (
      claim.status === "UNDER_INVESTIGATION" ||
      claim.investigationStatus === "UNDER_REVIEW"
    ) {
      underInvestigation++;
    } else if (claim.status === "COMPLETED") {
      completedClaims++;
    }

    if (
      claim.aiResult?.riskLevel === "HIGH" ||
      claim.aiResult?.riskLevel === "CRITICAL"
    ) {
      highRiskClaims++;
    }

    if (
      claim.aiResult?.investigationRequired ||
      claim.investigationStatus === "ADDITIONAL_INFORMATION_REQUIRED" ||
      claim.investigationStatus === "ESCALATED"
    ) {
      requiresAttention++;
    }
  }

  return {
    totalClaims,
    pendingClaims,
    underInvestigation,
    completedClaims,
    highRiskClaims,
    requiresAttention,
  };
}

async function saveUpdatedClaim(claim: Claim): Promise<Claim> {
  if (isLocalDataMode) {
    localClaims.set(claim.claimId, { ...claim });
    return claim;
  }

  try {
    await docClient.send(
      new PutCommand({
        TableName: DYNAMODB_CLAIMS_TABLE,
        Item: claim,
      })
    );
  } catch (error: any) {
    console.error("DynamoDB claim update failed:", error);
    throw new Error("Unable to update claim record.");
  }

  return claim;
}