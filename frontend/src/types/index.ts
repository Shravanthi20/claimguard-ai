export type UserRole = "CUSTOMER" | "INVESTIGATOR" | "ADMIN" | "customer" | "investigator" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: string;
  policies?: Policy[];
}

export interface Policy {
  id: string;
  policyNumber: string;
  userId: string;
  policyType: string;
  status: string;
  startDate: string;
  endDate: string;
  coverageAmount: number;
  createdAt?: string;
}

export type ClaimStatus =
  | "SUBMITTED"
  | "IN_REVIEW"
  | "UNDER_INVESTIGATION"
  | "APPROVED"
  | "REJECTED"
  | "ACTION_REQUIRED";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Evidence {
  id: string;
  claimId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  description?: string;
  uploadedAt: string;
}

export interface RiskAssessment {
  id: string;
  claimId: string;
  riskScore: number;
  fraudProbability: number;
  riskLevel: RiskLevel;
  priority: Priority;
  riskFactors: string[];
  modelVersion: string;
  createdAt: string;
  updatedAt?: string;
}

export interface InvestigationNote {
  id: string;
  investigationId: string;
  authorId: string;
  note: string;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface Investigation {
  id: string;
  claimId: string;
  investigatorId?: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "APPROVED" | "REJECTED" | "MORE_INFO_REQUESTED";
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
  investigator?: {
    id: string;
    name: string;
    email: string;
  };
  notes?: InvestigationNote[];
}

export interface ClaimEvent {
  id: string;
  claimId: string;
  eventType: string;
  description: string;
  createdBy?: string;
  createdAt: string;
}

export interface Claim {
  id: string;
  claimNumber: string;
  customerId: string;
  policyId?: string;
  claimType: string;
  incidentDate: string;
  incidentLocation: string;
  claimAmount: number;
  description: string;
  status: ClaimStatus;
  investigatorId?: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  investigator?: {
    id: string;
    name: string;
    email: string;
  };
  policy?: Policy;
  evidence?: Evidence[];
  riskAssessment?: RiskAssessment;
  investigation?: Investigation;
  claimEvents?: ClaimEvent[];
}

export interface AdminStatistics {
  totalUsers: number;
  usersByRole: {
    customers: number;
    investigators: number;
    admins: number;
  };
  totalClaims: number;
  claimsByStatus: {
    submitted: number;
    inReview: number;
    underInvestigation: number;
    approved: number;
    rejected: number;
    actionRequired: number;
  };
  activeInvestigations: number;
  highRiskClaims: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  financials: {
    totalAmount: number;
    averageAmount: number;
  };
}
