# ClaimGuard AI Integration Contract

This contract describes the application boundary between the frontend/backend, the AI provider (Person 2), and AWS infrastructure/workflows (Person 3). It contains schemas, not seeded application records.

## Claim Record

The backend generates identifiers and timestamps. The authenticated Cognito `sub` is the source of `customerId`; clients must not submit an owner identity.

| Field | Required | Owner/source | Notes |
|---|---|---|---|
| `claimId` | Yes | Backend | Generated for each accepted claim. |
| `customerId` | Yes | Cognito JWT `sub` | Never trusted from request bodies. |
| `policyNumber` | Yes | Customer input | Trimmed, 4-64 characters. |
| `incidentDate` | Yes | Customer input | ISO date (`YYYY-MM-DD`), not in the future. |
| `claimType` | Yes | Customer input | One of the supported claim types in the API documentation. |
| `accidentDescription` | Yes | Customer input | 20-5000 characters. |
| `claimedAmount` | Yes | Customer input | Finite positive number. |
| `status` | Yes | Backend/workflow | Starts in `SUBMITTED`; processing systems own later transitions. |
| `investigatorId` | Yes | Admin assignment | Cognito `sub`, or `null` while unassigned. |
| `investigatorName` | No | Admin directory/input | Display-only metadata; authorization always uses `investigatorId`. |
| `investigationStatus` | Yes | Backend/workflow | Starts `UNASSIGNED`. |
| `documents` | Yes | Backend/S3 | Evidence metadata for non-image files; empty array until uploaded. |
| `images` | Yes | Backend/S3 | Evidence metadata for images; empty array until uploaded. |
| `aiResult` | Yes | AI integration | `null` until a valid AI result is persisted. |
| `investigationRemarks` | Yes | Investigator/admin | Empty array until remarks are recorded. |
| `createdAt` | Yes | Backend | Server-generated ISO timestamp. |
| `updatedAt` | Yes | Backend/workflow | Updated by each persisted transition. |
| `userId`, `description` | No | Legacy compatibility | Existing aliases may exist in older DynamoDB records. New writes include canonical fields. |

Evidence object shape:

```json
{
  "fileId": "backend-generated UUID",
  "fileName": "original uploaded filename",
  "s3Key": "claims/{claimId}/{documents|images}/{generated-id}-{safe-filename}",
  "fileType": "validated MIME type",
  "fileSize": 0,
  "category": "document or image",
  "uploadedAt": "server-generated ISO timestamp"
}
```

Evidence objects are private. Production responses include short-lived presigned GET URLs only after claim authorization. Local file URLs are available only when `LOCAL_DATA_MODE=true` outside production and are still claim-authorized.

## AI Result

The AI provider must write a complete result to the trusted backend integration endpoint. Partial results are rejected; the application does not fill missing model outputs or calculate competing scores.

| Field | Required | Constraint |
|---|---|---|
| `claimId` | Yes | Must match the route claim ID. |
| `fraudProbability` | Yes | Finite number from 0 to 1. |
| `severity` | Yes | `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`. |
| `estimatedCost` | Yes | Finite, non-negative number. |
| `riskScore` | Yes | Finite number from 0 to 100. |
| `riskLevel` | Yes | `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`. |
| `investigationRequired` | Yes | Boolean from the backend risk decision. |
| `extractedEvidence` | Yes | Object; optional nested `documentData`, `imageAnalysis`, and `textAnalysis`. |
| `summary` | Yes | Non-empty investigation summary from the AI workflow. |
| `analyzedAt` | No | ISO timestamp; backend supplies one if omitted. |

No mock result is enabled. Before the workflow stores a result, `GET /api/claims/{claimId}/ai-result` returns `PROCESSING` (or `FAILED` when the workflow marks the claim failed).

## Role Claims

Cognito groups are the trusted role source. Group names recognized by the backend are `admin`, `admins`, `administrators`, `investigator`, and `investigators` (case-insensitive). Users without a privileged group are customers. Public registration cannot set a role. Provision investigator/admin accounts and their Cognito groups through the authorized account administration process.

## Person 2 Handoff

1. Consume the claim-submitted event or retrieve claim data/evidence through the approved backend workflow.
2. Run Textract/Rekognition/Comprehend/SageMaker/Bedrock outside the React application.
3. Persist a complete AI result using `POST /api/claims/{claimId}/ai-result` with `x-ai-ingest-token` set from the backend's `AI_RESULT_INGEST_TOKEN` secret.
4. The backend validates and stores the result on the claim record. The frontend polls the claim and AI-result APIs and displays persisted values only.
5. Do not expose the ingest token to the browser or commit it to source control.

## Person 3 Handoff

- Provision a Cognito user pool/client with `USER_PASSWORD_AUTH` enabled, email confirmation configured, and trusted groups for investigators/admins.
- Set backend `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID`. The backend verifies Cognito ID tokens against the configured pool/client.
- Provision a private S3 bucket and a DynamoDB claims table whose partition key is `claimId` (string). Set `S3_CLAIMS_BUCKET` and `DYNAMODB_CLAIMS_TABLE`.
- Grant the backend least-privilege Cognito, DynamoDB, and S3 permissions. Do not make evidence objects public.
- Set `AWS_REGION`, and configure AWS credentials through the standard SDK provider chain/role, never source code or frontend environment variables.
- Set `AI_RESULT_INGEST_TOKEN` through a secret store shared only with the trusted AI writer.
- API Gateway may proxy the same `/api` HTTP/JSON contract; configure frontend `VITE_API_BASE_URL` to the deployed API base URL.
- Set `LOCAL_DATA_MODE=false` in deployed environments. Its in-memory/file store is a development aid and is forcibly disabled when `NODE_ENV=production`.

## Workflow States

Claim statuses: `SUBMITTED`, `PROCESSING`, `AI_ANALYSIS`, `UNDER_INVESTIGATION`, `REVIEW`, `COMPLETED`, `FAILED`.

Investigation statuses: `UNASSIGNED`, `ASSIGNED`, `UNDER_REVIEW`, `ADDITIONAL_INFORMATION_REQUIRED`, `INVESTIGATION_COMPLETED`, `ESCALATED`.

The workflow owner must persist actual transitions. The UI does not infer or fabricate completion from elapsed time.
