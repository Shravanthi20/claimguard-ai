export type UserRole = "customer" | "investigator" | "admin";

export type ClaimStatus =
  | "SUBMITTED"
  | "PROCESSING"
  | "AI_ANALYSIS"
  | "UNDER_INVESTIGATION"
  | "REVIEW"
  | "COMPLETED"
  | "FAILED";

export type InvestigationStatus =
  | "UNASSIGNED"
  | "ASSIGNED"
  | "UNDER_REVIEW"
  | "ADDITIONAL_INFORMATION_REQUIRED"
  | "INVESTIGATION_COMPLETED"
  | "ESCALATED";

export interface EvidenceFile {
  fileId: string;
  fileName: string;
  s3Key: string;
  fileType: string;
  fileSize: number;
  category: "document" | "image";
  uploadedAt: string;
  url?: string;
}

export interface ExtractedEvidence {
  documentData?: Record<string, any>;
  imageAnalysis?: Record<string, any>;
  textAnalysis?: Record<string, any>;
}

export interface AIResult {
  claimId: string;
  fraudProbability: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  estimatedCost: number;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  investigationRequired: boolean;
  extractedEvidence: ExtractedEvidence;
  summary: string;
  analyzedAt?: string;
}

export interface InvestigationRemark {
  id: string;
  investigatorId: string;
  investigatorName: string;
  remark: string;
  timestamp: string;
}

export interface Claim {
  claimId: string;
  customerId: string;
  userId?: string;
  policyNumber: string;
  incidentDate: string;
  claimType: string;
  accidentDescription: string;
  description?: string;
  claimedAmount: number;
  status: ClaimStatus;
  investigationStatus: InvestigationStatus;
  investigatorId: string | null;
  investigatorName?: string | null;
  documents: EvidenceFile[];
  images: EvidenceFile[];
  aiResult: AIResult | null;
  investigationRemarks: InvestigationRemark[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  groups?: string[];
}

export interface ClaimStatistics {
  totalClaims: number;
  pendingClaims: number;
  underInvestigation: number;
  completedClaims: number;
  highRiskClaims: number;
  requiresAttention: number;
}
