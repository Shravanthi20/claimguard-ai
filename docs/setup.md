# Setup and Verification

## Requirements

- Node.js compatible with the versions declared by the frontend and backend packages.
- An AWS account with a Cognito user pool, DynamoDB claims table, and private S3 evidence bucket for real workflows.
- AWS credentials supplied through the standard AWS SDK credential provider chain (for example, a local AWS profile or an attached workload role). Do not place AWS secrets in frontend variables.

## Backend Configuration

Create `backend/.env` from the repository `.env.example`, then set:

- `AWS_REGION` to the region containing the resources.
- `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID` from the user pool/client.
- `DYNAMODB_CLAIMS_TABLE` to a table with string partition key `claimId`.
- `S3_CLAIMS_BUCKET` to a private bucket.
- `AI_RESULT_INGEST_TOKEN` to a secret shared with the trusted AI result publisher.
- `NODE_ENV=development` and `LOCAL_DATA_MODE=false` for AWS-backed local development.

The Cognito app client must allow `USER_PASSWORD_AUTH`, with email confirmation configured. Create trusted Cognito groups for investigators and administrators and assign their membership outside public registration. All new public registrations become customers.

For isolated local tests only, `LOCAL_DATA_MODE=true` enables an in-memory claim store and local file storage. Cognito is still required for interactive registration/login. The local persistence switch is disabled automatically when `NODE_ENV=production`; it is not durable and is not a substitute for DynamoDB/S3.

## Frontend Configuration

Create `frontend/.env` from `frontend/.env.example`. `VITE_API_BASE_URL` is the only frontend service URL setting; point it to the local `/api` server or the deployed API Gateway stage. Never place AWS credentials or the AI result token in this file.

## Run

In one terminal:

```powershell
cd backend
npm install
npm run dev
```

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Use the URL printed by Vite. Registration, login, upload, and claim APIs use the configured real backend services; when required resources are not configured, those operations return errors rather than fabricated successful records.

## Workflow Checks

- Customer: register and confirm through Cognito, sign in, submit a claim, upload supported evidence, then open its generated claim ID and observe the backend status/AI-result polling.
- Investigator: assign a Cognito user's `sub` to a claim through the admin interface, sign in as that group member, open only assigned claims, add remarks, and update investigation status.
- Administrator: add the Cognito user to the trusted admin group outside the application, sign in, inspect system statistics, and assign claims.
- Authorization: try another customer's claim ID and an investigator's unassigned claim ID. The API independently returns a forbidden/not-found response regardless of frontend route access.
- Tests: from `backend`, run `npm test`. The suite uses runtime-generated isolated local test records and tests backend ownership/assignment checks, pending AI state, live aggregation logic, and unauthenticated rejection. It does not pretend to test live Cognito, DynamoDB, or S3 calls.
- Builds: run `npm run build` in both `backend` and `frontend`. Run `npm run lint` in `frontend` for lint diagnostics.

See [api.md](api.md) for endpoints and [integration-contract.md](integration-contract.md) for Person 2/3 interface requirements.
