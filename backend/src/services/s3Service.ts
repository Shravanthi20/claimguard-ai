import {
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { s3Client, S3_CLAIMS_BUCKET, isLocalDataMode, isS3Configured } from "../config/aws";
import { EvidenceFile } from "../models/types";

// Local directory fallback for development/testing when S3 bucket is not yet provisioned
const LOCAL_STORAGE_DIR = path.join(__dirname, "../../uploads");

if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
  fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
}

export function generateS3Key(
  claimId: string,
  category: "document" | "image",
  fileName: string
): string {
  const sanitizedFileName = path.basename(fileName).replace(/[^a-zA-Z0-9.-]/g, "_");
  const folder = category === "image" ? "images" : "documents";
  return `claims/${claimId}/${folder}/${crypto.randomUUID()}-${sanitizedFileName}`;
}

export async function uploadFileToS3(
  claimId: string,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string,
  category: "document" | "image"
): Promise<EvidenceFile> {
  const s3Key = generateS3Key(claimId, category, fileName);
  const fileId = crypto.randomUUID();

  if (isS3Configured) {
    const command = new PutObjectCommand({
      Bucket: S3_CLAIMS_BUCKET,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: mimeType,
      Metadata: {
        claimId,
        originalName: fileName,
        fileId,
      },
    });
    await s3Client.send(command);
  } else if (isLocalDataMode) {
    saveLocally(s3Key, fileBuffer);
  } else {
    throw new Error("Amazon S3 is not configured.");
  }

  const evidenceFile: EvidenceFile = {
    fileId,
    fileName,
    s3Key,
    fileType: mimeType,
    fileSize: fileBuffer.length,
    category,
    uploadedAt: new Date().toISOString(),
  };

  return evidenceFile;
}

export async function getPresignedViewUrl(s3Key: string): Promise<string> {
  if (isS3Configured) {
    const command = new GetObjectCommand({
      Bucket: S3_CLAIMS_BUCKET,
      Key: s3Key,
    });
    return getSignedUrl(s3Client, command, { expiresIn: 900 });
  }

  if (isLocalDataMode) {
    return `/api/claims/evidence/file/${encodeURIComponent(s3Key)}`;
  }
  throw new Error("Amazon S3 is not configured.");
}

function saveLocally(s3Key: string, buffer: Buffer): void {
  const localPath = path.join(LOCAL_STORAGE_DIR, s3Key.replace(/\//g, path.sep));
  const dir = path.dirname(localPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(localPath, buffer);
}

export function getLocalFilePath(s3Key: string): string | null {
  const localPath = path.resolve(LOCAL_STORAGE_DIR, s3Key.replace(/\//g, path.sep));
  if (!localPath.startsWith(`${LOCAL_STORAGE_DIR}${path.sep}`)) return null;
  if (fs.existsSync(localPath)) {
    return localPath;
  }
  return null;
}
