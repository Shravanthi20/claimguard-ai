export interface RiskEngineInput {
  claimType: string;
  claimAmount: number;
  description: string;
  incidentDate: Date;
  evidenceCount: number;
}

export interface RiskEngineOutput {
  riskScore: number;
  fraudProbability: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  riskFactors: string[];
  modelVersion: string;
}

/**
 * Temporary Rule-Based Risk Engine
 * This engine calculates initial risk scores based on heuristics.
 * Later, this service will be replaced or delegated to AWS SageMaker & Rekognition.
 */
export function calculateInitialRiskAssessment(input: RiskEngineInput): RiskEngineOutput {
  const riskFactors: string[] = [];
  let score = 20; // baseline score

  // 1. Claim Amount Thresholds
  if (input.claimAmount > 50000) {
    score += 35;
    riskFactors.push(`High claim amount ($${input.claimAmount.toLocaleString()}) exceeds standard approval limit`);
  } else if (input.claimAmount > 15000) {
    score += 20;
    riskFactors.push(`Moderate-high claim amount ($${input.claimAmount.toLocaleString()}) requires manual review`);
  }

  // 2. Incident Date Recency vs Filing
  const now = new Date();
  const daysDiff = Math.abs((now.getTime() - new Date(input.incidentDate).getTime()) / (1000 * 3600 * 24));
  if (daysDiff > 90) {
    score += 25;
    riskFactors.push(`Delayed reporting: Incident occurred ${Math.floor(daysDiff)} days ago`);
  } else if (daysDiff < 1) {
    score += 10;
    riskFactors.push(`Immediate filing: Claim submitted within 24 hours of incident`);
  }

  // 3. Evidence Files Evaluation
  if (input.evidenceCount === 0) {
    score += 25;
    riskFactors.push("Missing supporting documentation or photo evidence");
  } else if (input.evidenceCount === 1) {
    score += 10;
    riskFactors.push("Limited documentation (only 1 evidence file provided)");
  }

  // 4. Keyword heuristic in description
  const descLower = input.description.toLowerCase();
  const highRiskKeywords = ["stolen", "unattended", "cash", "total loss", "unknown", "whiplash", "fire", "suspicious"];
  const matchedKeywords = highRiskKeywords.filter((kw) => descLower.includes(kw));

  if (matchedKeywords.length > 0) {
    score += matchedKeywords.length * 10;
    riskFactors.push(`High-risk key phrases detected in incident report: [${matchedKeywords.join(", ")}]`);
  }

  // Cap score between 5 and 99
  const riskScore = Math.min(99, Math.max(5, score));
  const fraudProbability = parseFloat((riskScore / 100).toFixed(2));

  let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  let priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "LOW";

  if (riskScore >= 75) {
    riskLevel = "CRITICAL";
    priority = "URGENT";
  } else if (riskScore >= 55) {
    riskLevel = "HIGH";
    priority = "HIGH";
  } else if (riskScore >= 35) {
    riskLevel = "MEDIUM";
    priority = "MEDIUM";
  } else {
    riskLevel = "LOW";
    priority = "LOW";
  }

  if (riskFactors.length === 0) {
    riskFactors.push("Standard claim profile within normal risk parameters");
  }

  return {
    riskScore,
    fraudProbability,
    riskLevel,
    priority,
    riskFactors,
    modelVersion: "demo-rule-engine-v1.0",
  };
}
