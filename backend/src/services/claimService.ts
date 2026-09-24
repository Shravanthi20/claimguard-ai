import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

import { dynamoClient } from "../config/aws";

const db = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME =
  process.env.DYNAMODB_CLAIMS_TABLE || "ClaimGuardClaims";

export interface Claim {
  claimId: string;
  userId: string;
  claimType: string;
  description: string;
  claimedAmount: number;
  status: string;
  createdAt: string;
}

export async function createClaim(claim: Claim) {
  await db.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: claim,
    })
  );

  return claim;
}

export async function getClaim(claimId: string) {
  const result = await db.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { claimId },
    })
  );

  return result.Item;
}