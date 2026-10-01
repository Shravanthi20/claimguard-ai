import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import dotenv from "dotenv";

dotenv.config();

export const AWS_REGION = process.env.AWS_REGION || "ap-south-1";

export const DYNAMODB_CLAIMS_TABLE =
  process.env.DYNAMODB_CLAIMS_TABLE || "";
export const DYNAMODB_USERS_TABLE =
  process.env.DYNAMODB_USERS_TABLE || "";
export const S3_CLAIMS_BUCKET =
  process.env.S3_CLAIMS_BUCKET || "";
export const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || "";
export const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || "";

const clientConfig = {
  region: AWS_REGION,
};

export const dynamoClient = new DynamoDBClient(clientConfig);
export const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export const s3Client = new S3Client(clientConfig);

export const cognitoClient = new CognitoIdentityProviderClient(clientConfig);

export const isCognitoConfigured = Boolean(
  COGNITO_USER_POOL_ID && COGNITO_CLIENT_ID
);

export const isS3Configured = Boolean(process.env.S3_CLAIMS_BUCKET);
export const isLocalDataMode =
  process.env.LOCAL_DATA_MODE === "true" && process.env.NODE_ENV !== "production";