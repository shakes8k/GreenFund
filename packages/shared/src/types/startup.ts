export type StartupStage =
  | "pre_seed"
  | "seed"
  | "series_a"
  | "series_b"
  | "growth";

export type ClimateCategory =
  | "solar"
  | "wind"
  | "ocean_tech"
  | "carbon_capture"
  | "green_hydrogen"
  | "sustainable_agriculture"
  | "ev_mobility"
  | "energy_storage"
  | "waste_tech"
  | "biodiversity";

export type VerificationStatus =
  | "pending"
  | "under_review"
  | "verified"
  | "disputed"
  | "rejected";

export interface ImpactMetrics {
  co2ReductionTonnesPerYear: number;
  jobsCreated: number;
  sdgGoals: number[]; // UN SDG goal numbers 1-17
  waterSavedLitresPerYear?: number;
  biodiversityScore?: number; // 0-100
}

export interface ClimateScenario {
  carbonPriceUSD: number; // per tonne
  policyStrictness: number; // 0-100
  technologyAdoptionRate: number; // 0-100
  extremeWeatherFrequency: number; // 0-100
}

export interface ScenarioProjection {
  scenario: ClimateScenario;
  projectedValuationUSD: number;
  projectedImpactMultiplier: number;
  confidenceInterval: [number, number]; // [low, high] multipliers
  riskScore: number; // 0-100
}

export interface Startup {
  id: string;
  name: string;
  description: string;
  stage: StartupStage;
  category: ClimateCategory;
  foundedYear: number;
  teamSize: number;
  countryCode: string;
  websiteUrl?: string;
  impactMetrics: ImpactMetrics;
  verificationStatus: VerificationStatus;
  riskPoolId?: string;
  totalFundedUSD: number;
  smartContractAddress?: string; // milestone contract address
  createdAt: string;
  updatedAt: string;
}
