import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // Clean existing data
  await prisma.claimEvent.deleteMany();
  await prisma.investigationNote.deleteMany();
  await prisma.investigation.deleteMany();
  await prisma.riskAssessment.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Create Users
  const customerUser = await prisma.user.create({
    data: {
      email: "customer@claimguard.ai",
      passwordHash,
      name: "Sarah Jenkins",
      role: "CUSTOMER",
    },
  });

  const investigatorUser = await prisma.user.create({
    data: {
      email: "investigator@claimguard.ai",
      passwordHash,
      name: "Marcus Vance",
      role: "INVESTIGATOR",
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@claimguard.ai",
      passwordHash,
      name: "System Administrator",
      role: "ADMIN",
    },
  });

  console.log("Users created:", {
    customer: customerUser.email,
    investigator: investigatorUser.email,
    admin: adminUser.email,
  });

  // 2. Create Policies
  const autoPolicy = await prisma.policy.create({
    data: {
      policyNumber: "POL-AUTO-998241",
      userId: customerUser.id,
      policyType: "Comprehensive Auto Insurance",
      status: "ACTIVE",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2027-01-01"),
      coverageAmount: 75000,
    },
  });

  const propertyPolicy = await prisma.policy.create({
    data: {
      policyNumber: "POL-PROP-441209",
      userId: customerUser.id,
      policyType: "Homeowner Property Protection",
      status: "ACTIVE",
      startDate: new Date("2025-06-15"),
      endDate: new Date("2026-06-15"),
      coverageAmount: 350000,
    },
  });

  // 3. Create Claims
  // Claim 1: High Risk Collision Claim
  const claim1 = await prisma.claim.create({
    data: {
      claimNumber: "CLM-2026-881923",
      customerId: customerUser.id,
      policyId: autoPolicy.id,
      claimType: "Auto Collision",
      incidentDate: new Date("2026-09-28"),
      incidentLocation: "Interstate 95, Exit 42, Philadelphia PA",
      claimAmount: 48500,
      description: "Severe multi-vehicle rear-end accident during heavy rain. Vehicle suffered total loss. Stolen contents reported missing from trunk after collision.",
      status: "UNDER_INVESTIGATION",
      investigatorId: investigatorUser.id,
    },
  });

  // Evidence for Claim 1
  await prisma.evidence.createMany({
    data: [
      {
        claimId: claim1.id,
        fileName: "vehicle_front_damage.jpg",
        filePath: "/uploads/sample_crash_1.jpg",
        fileType: "image/jpeg",
        fileSize: 2450000,
        description: "Front bumper and hood crumpled damage photograph",
      },
      {
        claimId: claim1.id,
        fileName: "police_incident_report.pdf",
        filePath: "/uploads/police_report_881923.pdf",
        fileType: "application/pdf",
        fileSize: 1120000,
        description: "Official state highway patrol incident report",
      },
    ],
  });

  // Risk Assessment for Claim 1
  await prisma.riskAssessment.create({
    data: {
      claimId: claim1.id,
      riskScore: 82,
      fraudProbability: 0.82,
      riskLevel: "CRITICAL",
      priority: "URGENT",
      riskFactors: [
        "High claim amount ($48,500) close to policy limit",
        "High-risk key phrases detected: ['stolen', 'total loss', 'unattended']",
        "Discrepancy in reported passenger count vs police record",
        "Filing submitted within 12 hours of policy modification",
      ],
      modelVersion: "demo-rule-engine-v1.0",
    },
  });

  // Investigation for Claim 1
  const inv1 = await prisma.investigation.create({
    data: {
      claimId: claim1.id,
      investigatorId: investigatorUser.id,
      status: "IN_PROGRESS",
      startedAt: new Date("2026-09-29"),
    },
  });

  await prisma.investigationNote.createMany({
    data: [
      {
        investigationId: inv1.id,
        authorId: investigatorUser.id,
        note: "Contacted local precinct to obtain dashcam footage from responding officer.",
      },
      {
        investigationId: inv1.id,
        authorId: investigatorUser.id,
        note: "Requested independent vehicle damage appraisal from certified inspector.",
      },
    ],
  });

  await prisma.claimEvent.createMany({
    data: [
      {
        claimId: claim1.id,
        eventType: "CLAIM_SUBMITTED",
        description: "Claim submitted by Sarah Jenkins",
        createdBy: "Sarah Jenkins",
        createdAt: new Date("2026-09-28T14:30:00Z"),
      },
      {
        claimId: claim1.id,
        eventType: "RISK_FLAGGED",
        description: "Automated risk engine assigned CRITICAL risk score (82/100)",
        createdBy: "System",
        createdAt: new Date("2026-09-28T14:31:00Z"),
      },
      {
        claimId: claim1.id,
        eventType: "INVESTIGATOR_ASSIGNED",
        description: "Claim assigned to Investigator Marcus Vance",
        createdBy: "System Administrator",
        createdAt: new Date("2026-09-29T09:00:00Z"),
      },
    ],
  });

  // Claim 2: Low Risk Water Leak Claim
  const claim2 = await prisma.claim.create({
    data: {
      claimNumber: "CLM-2026-104921",
      customerId: customerUser.id,
      policyId: propertyPolicy.id,
      claimType: "Property Damage",
      incidentDate: new Date("2026-09-15"),
      incidentLocation: "1428 Elm Street, Apt 4B, Philadelphia PA",
      claimAmount: 3200,
      description: "Minor kitchen pipe burst under sink causing cabinet water damage. Plumber invoice attached.",
      status: "APPROVED",
      investigatorId: investigatorUser.id,
    },
  });

  await prisma.evidence.create({
    data: {
      claimId: claim2.id,
      fileName: "plumber_receipt.pdf",
      filePath: "/uploads/plumbing_receipt.pdf",
      fileType: "application/pdf",
      fileSize: 450000,
      description: "Licensed plumbing repair receipt and photo",
    },
  });

  await prisma.riskAssessment.create({
    data: {
      claimId: claim2.id,
      riskScore: 18,
      fraudProbability: 0.18,
      riskLevel: "LOW",
      priority: "LOW",
      riskFactors: [
        "Low claim amount ($3,200)",
        "Verified plumber receipt attached",
        "Consistent customer history",
      ],
      modelVersion: "demo-rule-engine-v1.0",
    },
  });

  const inv2 = await prisma.investigation.create({
    data: {
      claimId: claim2.id,
      investigatorId: investigatorUser.id,
      status: "APPROVED",
      startedAt: new Date("2026-09-16"),
      completedAt: new Date("2026-09-17"),
    },
  });

  await prisma.investigationNote.create({
    data: {
      investigationId: inv2.id,
      authorId: investigatorUser.id,
      note: "Receipt verified with QuickFix Plumbing LLC. Claim recommended for instant approval.",
    },
  });

  await prisma.claimEvent.createMany({
    data: [
      {
        claimId: claim2.id,
        eventType: "CLAIM_SUBMITTED",
        description: "Claim submitted by Sarah Jenkins",
        createdBy: "Sarah Jenkins",
        createdAt: new Date("2026-09-15T10:00:00Z"),
      },
      {
        claimId: claim2.id,
        eventType: "APPROVED",
        description: "Claim approved by Marcus Vance",
        createdBy: "Marcus Vance",
        createdAt: new Date("2026-09-17T11:20:00Z"),
      },
    ],
  });

  console.log("Database seeded successfully with realistic sample data.");
}

main()
  .catch((e) => {
    console.error("Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
