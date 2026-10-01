# ClaimGuard AI API

All routes use JSON except evidence upload (`multipart/form-data`, field `file`). The default local API prefix is `/api`; configure the frontend base URL with `VITE_API_BASE_URL` when deploying behind API Gateway.

Protected routes use `Authorization: Bearer <Cognito ID token>`. Missing/invalid tokens return `401`; a valid identity lacking permission returns `403` (or `404` for local evidence that should not be discoverable). Responses do not include raw AWS errors.

| Method and path | Authentication / role | Request | Success |
|---|---|---|---|
| `POST /api/auth/register` | Public; customer account only | `{ name, email, password }` | `201`, Cognito user ID/email and confirmation requirement. Request role is ignored/not accepted. |
| `POST /api/auth/confirm` | Public | `{ email, code }` | `200`, confirmation result. |
| `POST /api/auth/login` | Public | `{ email, password }` | `200`, Cognito ID/access/refresh tokens and group-derived user. |
| `POST /api/auth/refresh` | Public Cognito refresh token | `{ refreshToken }` | `200`, renewed ID/access tokens; invalid/expired tokens return `401`. |
| `POST /api/auth/logout` | Authenticated | `{ accessToken }` | `204`, Cognito global sign-out; token subject must match authenticated identity. |
| `GET /api/auth/me` | Authenticated | None | `200`, backend-verified user identity/role. |
| `GET /api/claims` | Customer, investigator, admin | Optional `status`, `claimType` query | `200`, claims filtered by authenticated role (own, assigned, or all). |
| `POST /api/claims` | Customer | `policyNumber`, `incidentDate`, `claimType`, `accidentDescription`, `claimedAmount` | `201`, created claim. Customer ID and ID/timestamps are backend-generated. |
| `GET /api/claims/statistics` | Authenticated | None | `200`, database-derived aggregate counts for the caller's visibility. |
| `GET /api/claims/{claimId}` | Owner, assigned investigator, admin | None | `200`, claim; evidence has short-lived authorized URLs. |
| `PATCH /api/claims/{claimId}/status` | Assigned investigator, admin | `{ status }` | `200`, updated claim. Status and assignment authorization are validated. |
| `GET /api/claims/{claimId}/ai-result` | Owner, assigned investigator, admin | None | `200`, `{ status: AVAILABLE, data }`, `{ status: PROCESSING, message }`, or `{ status: FAILED, message }`. |
| `POST /api/claims/{claimId}/ai-result` | Trusted service token | Complete AI result; `x-ai-ingest-token` header | `200`, updated claim. Invalid/incomplete result returns `400`. |
| `POST /api/claims/{claimId}/evidence` | Owning customer | Multipart field `file` | `201`, evidence metadata and updated claim. Maximum 15 MB/file, 20 files/claim; PDF, JPEG, PNG, WebP, DOC, DOCX. |
| `POST /api/claims/{claimId}/remarks` | Assigned investigator, admin | `{ remark }` | `201`, persisted remark and updated claim. |
| `PATCH /api/claims/{claimId}/investigation-status` | Assigned investigator, admin | `{ investigationStatus }` | `200`, updated claim. |
| `GET /api/investigator/claims` | Investigator, admin | None | `200`, claims assigned to the authenticated investigator; admin access is limited by this route to the admin's own subject assignment filter. |
| `GET /api/investigator/statistics` | Investigator, admin | None | `200`, statistics for claims assigned to the authenticated investigator. |
| `GET /api/admin/claims` | Admin | None | `200`, all claims. |
| `GET /api/admin/statistics` | Admin | None | `200`, system-wide database-derived statistics. |
| `POST /api/admin/claims/{claimId}/assign` | Admin | `{ investigatorId, investigatorName? }` | `200`, updated assignment; `investigatorId` is a Cognito `sub`. |
| `GET /api/health` | Public | None | `200`, health status. |

Common errors: `400` invalid input, `401` missing/invalid Cognito or integration token, `403` insufficient role/ownership/assignment, `404` missing or hidden claim/evidence, `413` file too large, `503` missing Cognito/integration configuration, and `500` internal failure. Error bodies use `{ error, message }` and do not expose stack traces.

See [integration-contract.md](integration-contract.md) for claim/evidence/AI schemas and the Person 2/3 handoff.
