import { SageMakerRuntimeClient, InvokeEndpointCommand } from "@aws-sdk/client-sagemaker-runtime";
import { RekognitionClient, DetectLabelsCommand } from "@aws-sdk/client-rekognition";
import https from "https";

const rekognition = new RekognitionClient({});
const sagemaker = new SageMakerRuntimeClient({});
const SAGEMAKER_ENDPOINT = process.env.SAGEMAKER_ENDPOINT || "claimguard-risk-model-endpoint";

// Mock URL for the backend since this is deployed in AWS pointing to an ECS service
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000/api";

function updateBackend(data) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${BACKEND_URL}/claims/internal/webhook`);
        const req = https.request(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            res.on('data', () => {});
            res.on('end', resolve);
        });
        req.on('error', reject);
        req.write(JSON.stringify(data));
        req.end();
    });
}

export const handler = async (event) => {
    console.log("Processing SQS Event:", JSON.stringify(event));

    for (const record of event.Records) {
        let body;
        try { body = JSON.parse(record.body); } catch (e) { body = record.body; }
        const detail = body.detail || body;
        
        console.log("Processing Claim ID:", detail.claimId);
        
        // Notify PROCESSING
        await updateBackend({ claimId: detail.claimId, aiProcessingStatus: "PROCESSING" }).catch(e => console.error(e));

        let imageAnalysisResults = [];
        
        // 1. Amazon Rekognition
        if (detail.evidence && detail.evidence.length > 0) {
            for (const ev of detail.evidence) {
                if (ev.location) {
                    try {
                        const urlObj = new URL(ev.location);
                        const bucketName = urlObj.hostname.split('.')[0];
                        const key = decodeURIComponent(urlObj.pathname.substring(1));
                        
                        const labelsResponse = await rekognition.send(new DetectLabelsCommand({
                            Image: { S3Object: { Bucket: bucketName, Name: key } },
                            MaxLabels: 10,
                            MinConfidence: 70
                        }));
                        
                        imageAnalysisResults.push({
                            fileName: key,
                            labels: labelsResponse.Labels.map(l => ({ name: l.Name, confidence: l.Confidence }))
                        });
                    } catch (err) {
                        console.error("Rekognition Error:", err);
                    }
                }
            }
        }

        // 2. Real SageMaker Risk Prediction
        console.log("Invoking SageMaker ML Model Endpoint...");
        let fraudProbability = 0.1;
        let riskScore = 10;
        let riskFactors = { modelNote: "SageMaker invoked successfully." };

        try {
            const smPayload = {
                claimId: detail.claimId,
                claimAmount: detail.claimAmount || 0,
                evidenceCount: detail.evidence?.length || 0,
                rekognitionLabels: imageAnalysisResults.flatMap(r => r.labels.map(l => l.name))
            };

            const smResponse = await sagemaker.send(new InvokeEndpointCommand({
                EndpointName: SAGEMAKER_ENDPOINT,
                ContentType: "application/json",
                Body: Buffer.from(JSON.stringify(smPayload))
            }));

            const smResult = JSON.parse(Buffer.from(smResponse.Body).toString('utf-8'));
            fraudProbability = smResult.fraudProbability || fraudProbability;
            riskScore = smResult.riskScore || (fraudProbability * 100);
            riskFactors = smResult.riskFactors || riskFactors;
        } catch (err) {
            console.error("SageMaker Invocation Error:", err);
            // Fallback gracefully in case the endpoint is starting or missing
            riskFactors.modelNote = "SageMaker Endpoint unavailable. Using baseline metrics.";
        }

        let riskLevel = "LOW";
        if (riskScore > 30) riskLevel = "MEDIUM";
        if (riskScore > 70) riskLevel = "HIGH";
        if (riskScore > 90) riskLevel = "CRITICAL";
        
        // 3. Update Database
        await updateBackend({
            claimId: detail.claimId,
            aiProcessingStatus: "COMPLETED",
            riskScore,
            fraudProbability,
            riskLevel,
            riskFactors,
            imageAnalysisResults
        });
    }
    
    return { statusCode: 200, body: 'Success' };
};
