/**
 * DVN Scoring Engine
 *
 * reputationScore (0–100) is derived from:
 *   - accuracyRate × 60   → quality is the primary driver (max 60 pts)
 *   - experience bonus    → min(totalAssessments × 0.5, 20)  (max 20 pts)
 *   - stake bonus         → log10 of staked GFT (max 10 pts)
 *   - slash penalty       → −15 per successful challenge against the expert
 *
 * New validators start at 50 (neutral) until they submit their first assessment.
 */

export const GFT_PER_USD = 10;   // internal rate: 1 USD = 10 GFT
export const ROYALTY_RATE = 0.01; // 1% of each milestone release → royalty pool

export function computeReputationScore(expert: {
  totalAssessments: number;
  accuracyRate: number | { toNumber(): number };
  slashedCount: number;
  stakedTokens: number | { toNumber(): number };
}): number {
  if (expert.totalAssessments === 0) return 50;

  const accuracy = toNum(expert.accuracyRate);
  const staked   = toNum(expert.stakedTokens);

  const accuracyScore   = accuracy * 60;
  const experienceBonus = Math.min(expert.totalAssessments * 0.5, 20);
  const stakeBonus      = Math.min(Math.log10(staked + 1) * 3, 10);
  const slashPenalty    = expert.slashedCount * 15;

  return Math.max(0, Math.min(100, Math.round(
    accuracyScore + experienceBonus + stakeBonus - slashPenalty,
  )));
}

/**
 * Rolling accuracy average after one more assessment outcome.
 * wasCorrect = true  → assessment survived challenge period (approved by peers)
 * wasCorrect = false → assessment was successfully challenged (slashed)
 */
export function updateAccuracyRate(
  currentRate: number | { toNumber(): number },
  totalAssessments: number,
  wasCorrect: boolean,
): number {
  const rate     = toNum(currentRate);
  const prevTotal = totalAssessments - 1;
  if (prevTotal <= 0) return wasCorrect ? 1.0 : 0.0;
  const updated = (rate * prevTotal + (wasCorrect ? 1 : 0)) / totalAssessments;
  return Math.round(updated * 10000) / 10000; // 4 decimal places
}

function toNum(v: number | { toNumber(): number }): number {
  return typeof v === "number" ? v : v.toNumber();
}
