import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../config/db";

const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const ANALYTICS_BUCKET = process.env.ANALYTICS_BUCKET_NAME || "claimguard-analytics-datalake";

export async function exportToDataLake() {
    try {
        console.log("Exporting operational data to Athena Data Lake...");
        const claims = await prisma.claim.findMany({ include: { riskAssessment: true } });
        
        // Format as JSONL for Athena
        const jsonl = claims.map(c => JSON.stringify(c)).join("\n");
        
        await s3.send(new PutObjectCommand({
            Bucket: ANALYTICS_BUCKET,
            Key: `claims/dt=${new Date().toISOString().split('T')[0]}/claims.jsonl`,
            Body: jsonl
        }));
        console.log("Export successful.");
    } catch (err) {
        console.error("Failed to export to S3 Data Lake:", err);
    }
}
