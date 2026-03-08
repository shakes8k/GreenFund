export type MilestoneStatus =
  | "pending"
  | "in_progress"
  | "oracle_verifying"
  | "completed"
  | "failed"
  | "disputed";

export type OracleSource = "satellite" | "iot_sensor" | "third_party_api" | "manual_dvn";

export interface Milestone {
  id: string;
  startupId: string;
  title: string;
  description: string;
  fundReleaseUSD: number;
  targetDate: string;
  status: MilestoneStatus;
  oracleSources: OracleSource[];
  verificationData?: Record<string, unknown>; // raw oracle payload
  completedAt?: string;
  txHash?: string; // on-chain fund release tx
}

export type RiskTier = "conservative" | "balanced" | "growth" | "speculative";

export interface RiskPool {
  id: string;
  name: string; // e.g. "Early-Stage Ocean Tech"
  description: string;
  tier: RiskTier;
  categories: string[];
  totalValueLockedUSD: number;
  startupIds: string[];
  allocationWeights: Record<string, number>; // startupId -> weight (0-1, sum=1)
  minInvestmentUSD: number;
  expectedAnnualReturn: [number, number]; // [low%, high%]
  lastRebalancedAt: string;
}

export interface Investment {
  id: string;
  investorId: string;
  riskPoolId?: string;
  startupId?: string; // direct investment bypassing pool
  amountUSD: number;
  tokensReceived: number;
  txHash: string;
  investedAt: string;
}

export interface ImpactLedgerEntry {
  startupId: string;
  startupName: string;
  category: string;
  co2ReducedTonnes: number;
  jobsCreated: number;
  sdgContributions: number[];
  reportingPeriod: string; // ISO 8601 YYYY-MM
  verifiedOnChain: boolean;
  txHash?: string;
}
