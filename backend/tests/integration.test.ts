import assert from "node:assert/strict";
import crypto from "node:crypto";

process.env.NODE_ENV = "test";
process.env.LOCAL_DATA_MODE = "true";

async function runTests(): Promise<void> {
  const [{ createClaim, getClaim, listClaims, updateInvestigationStatus, getClaimStatistics }, { canAccessClaim }, { extractRoleFromClaims }, { getClaimAIResult }] =
    await Promise.all([
      import("../src/services/claimService"),
      import("../src/middleware/authMiddleware"),
      import("../src/services/cognitoService"),
      import("../src/services/aiService"),
    ]);

  const suffix = crypto.randomUUID();
  const customerId = crypto.randomUUID();
  const investigatorId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const claim = {
    claimId: `test-${suffix}`,
    customerId,
    policyNumber: `policy-${suffix}`,
    incidentDate: timestamp.slice(0, 10),
    claimType: "Other",
    accidentDescription: "A test claim used to verify persistence and authorization.",
    claimedAmount: 1,
    status: "SUBMITTED" as const,
    investigationStatus: "UNASSIGNED" as const,
    investigatorId: null,
    documents: [],
    images: [],
    aiResult: null,
    investigationRemarks: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await createClaim(claim);
  assert.equal((await getClaim(claim.claimId))?.claimId, claim.claimId);
  assert.equal((await listClaims({ customerId })).length, 1);
  assert.equal((await listClaims({ customerId: crypto.randomUUID() })).length, 0);

  const customer = { userId: customerId, email: "", name: "", role: "customer" as const };
  const otherCustomer = { ...customer, userId: crypto.randomUUID() };
  const investigator = { userId: investigatorId, email: "", name: "", role: "investigator" as const };
  const administrator = { userId: crypto.randomUUID(), email: "", name: "", role: "admin" as const };

  assert.equal(canAccessClaim(customer, claim), true);
  assert.equal(canAccessClaim(otherCustomer, claim), false);
  assert.equal(canAccessClaim(investigator, claim), false);
  assert.equal(canAccessClaim(administrator, claim), true);
  assert.equal(extractRoleFromClaims({ role: "admin" }), "customer");
  assert.equal(extractRoleFromClaims({ "cognito:groups": ["Investigators"] }), "investigator");

  const pendingAI = await getClaimAIResult(claim.claimId);
  assert.equal(pendingAI.status, "PROCESSING");
  assert.equal(pendingAI.data, undefined);

  const assigned = await updateInvestigationStatus(
    claim.claimId,
    "ASSIGNED",
    investigatorId
  );
  assert.equal(assigned?.status, "UNDER_INVESTIGATION");
  assert.equal(canAccessClaim(investigator, assigned!), true);
  assert.equal((await listClaims({ investigatorId })).length, 1);

  const stats = await getClaimStatistics({ customerId });
  assert.equal(stats.totalClaims, 1);
  assert.equal(stats.underInvestigation, 1);

  const { default: app } = await import("../src/app");
  const server = app.listen(0);
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/claims`);
    assert.equal(response.status, 401);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }

  console.log("Integration checks passed: dynamic persistence, Cognito role mapping, ownership, assignment, AI pending state, statistics, and API authentication.");
}

runTests().catch((error) => {
  console.error("Integration test failure:", error);
  process.exitCode = 1;
});