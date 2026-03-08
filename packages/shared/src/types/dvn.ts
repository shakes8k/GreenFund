export type ExpertDomain =
  | "climate_science"
  | "renewable_energy"
  | "carbon_markets"
  | "policy_analysis"
  | "marine_biology"
  | "sustainable_finance"
  | "engineering"
  | "ecology";

export type AssessmentVerdict = "approved" | "rejected" | "needs_revision";

export interface DVNExpert {
  id: string;
  walletAddress: string;
  domains: ExpertDomain[];
  stakedTokens: number;
  reputationScore: number; // 0-100, weighted by accuracy history
  totalAssessments: number;
  accuracyRate: number; // 0-1
  slashedCount: number;
  joinedAt: string;
}

export interface DVNAssessment {
  id: string;
  startupId: string;
  expertId: string;
  verdict: AssessmentVerdict;
  confidenceScore: number; // 0-100
  report: string; // IPFS CID or plaintext
  stakedAmount: number; // tokens at stake for this assessment
  challengePeriodEndsAt: string;
  resolvedAt?: string;
  slashed: boolean;
  txHash: string;
  createdAt: string;
}

export interface DVNChallenge {
  id: string;
  assessmentId: string;
  challengerId: string; // DVNExpert id
  reason: string;
  evidence: string; // IPFS CID
  stakedAmount: number;
  resolvedVerdict?: AssessmentVerdict;
  resolvedAt?: string;
  txHash: string;
  createdAt: string;
}
