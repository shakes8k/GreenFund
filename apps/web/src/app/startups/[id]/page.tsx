import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@greenfund/db";
import { AISummaryPanel } from "@/components/AISummaryPanel";
import { FundraisingBanner } from "@/components/FundraisingBanner";
import { NewsPanel } from "@/components/NewsPanel";
import { MetricsPanel } from "@/components/MetricsPanel";
import { RiskSDG3D } from "@/components/RiskSDG3D";

export const revalidate = 60;

const TABS = ["overview", "metrics", "news", "reports"] as const;
type Tab = (typeof TABS)[number];

export default async function StartupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "overview" } = await searchParams;
  const activeTab: Tab = TABS.includes(tab as Tab) ? (tab as Tab) : "overview";

  const startup = await prisma.startup.findUnique({
    where: { id },
    include: {
      milestones: { orderBy: { targetDate: "asc" } },
      assessments: {
        include: { expert: { select: { walletAddress: true, reputationScore: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      aiScore: true,
      aiAnalysis: true,
      analystReports: { orderBy: { publishedAt: "desc" } },
      news: { orderBy: { publishedAt: "desc" }, take: 20 },
      metricUpdates: { orderBy: { createdAt: "desc" }, take: 20 },
      financials: { orderBy: { periodEndDate: "desc" }, take: 10 },
      fundraisingRequests: {
        where: { status: { in: ["active", "pending"] } },
        take: 1,
        include: { _count: { select: { offers: true } } },
      },
      onboarding: { select: { logoUrl: true } },
    },
  });

  if (!startup) notFound();

  const tabHref = (t: Tab) => `?tab=${t}`;

  // Derive initials for logo placeholder
  const initials = startup.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-green-500/[0.06] via-transparent to-transparent p-8 mb-8">
        {/* Background glow */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-green-500/10 blur-3xl" />

        <div className="relative flex flex-wrap items-start gap-5">
          {/* Logo / Initials */}
          {startup.onboarding?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={startup.onboarding.logoUrl}
              alt={`${startup.name} logo`}
              className="h-16 w-16 shrink-0 rounded-2xl object-cover border border-white/10"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-green-500/20 to-green-500/5 text-xl font-bold text-green-400">
              {initials}
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Name */}
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-white">{startup.name}</h1>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-gray-400">
                {startup.category.replace(/_/g, " ")}
              </span>
              <VerificationBadge status={startup.verificationStatus} />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span>{startup.stage.replace(/_/g, " ")}</span>
              <span>·</span>
              <span>{startup.countryCode}</span>
              <span>·</span>
              {/* Founded pill */}
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-gray-400">
                Founded {startup.foundedYear}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <nav className="mb-8 flex flex-wrap gap-1">
        {TABS.map((t) => (
          <Link
            key={t}
            href={tabHref(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
              activeTab === t
                ? "bg-green-500/10 text-green-400"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            {t === "reports" ? "Analyst Reports" : t}
          </Link>
        ))}
      </nav>

      {/* ── Overview tab ── */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* AI Score */}
          {startup.aiScore && (
            <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <h2 className="mb-5 text-lg font-semibold text-white">AI Company Score</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <ScoreBar label="Overall" value={startup.aiScore.overallScore} color="bg-green-500" />
                  <ScoreBar label="Growth" value={startup.aiScore.growthScore} color="bg-blue-500" />
                  <ScoreBar label="Impact" value={startup.aiScore.impactScore} color="bg-emerald-500" />
                  <ScoreBar label="Risk (lower = safer)" value={startup.aiScore.riskScore} color="bg-orange-500" />
                </div>
                <p className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-sm leading-relaxed text-gray-300">
                  {startup.aiScore.narrative}
                </p>
              </div>
            </section>
          )}

          {/* AI Summary (market analysis with web search) */}
          <AISummaryPanel
            startupId={startup.id}
            cached={startup.aiAnalysis ? {
              webSummary:                   startup.aiAnalysis.webSummary,
              marketAdoptionScore:          startup.aiAnalysis.marketAdoptionScore,
              financialSustainabilityScore: startup.aiAnalysis.financialSustainabilityScore,
              technologyScore:              startup.aiAnalysis.technologyScore,
              consistencyScore:             startup.aiAnalysis.consistencyScore,
              potentialScore:               startup.aiAnalysis.potentialScore,
              analyzedAt:                   startup.aiAnalysis.analyzedAt.toISOString(),
            } : null}
          />

          {/* Fundraising Banner */}
          <FundraisingBanner
            round={
              startup.fundraisingRequests[0]
                ? {
                    id: startup.fundraisingRequests[0].id,
                    fundingRound: startup.fundraisingRequests[0].fundingRound,
                    amountRaisingINR: startup.fundraisingRequests[0].amountRaisingINR.toString(),
                    amountRaisedINR: startup.fundraisingRequests[0].amountRaisedINR.toString(),
                    minInvestmentINR: startup.fundraisingRequests[0].minInvestmentINR.toString(),
                    valuationINR: startup.fundraisingRequests[0].valuationINR.toString(),
                    equityPercent: startup.fundraisingRequests[0].equityPercent.toString(),
                    _count: startup.fundraisingRequests[0]._count,
                  }
                : null
            }
            startupId={startup.id}
          />

          {/* Key metrics */}
          <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Metric label="CO₂ / year" value={`${Number(startup.co2ReductionTonnesPerYear).toLocaleString()}t`} />
            <Metric label="Jobs Created" value={startup.jobsCreated.toString()} />
            <Metric label="Total Funded" value={`₹${Number(startup.totalFundedUSD).toLocaleString("en-IN")}`} />
            <Metric label="Team Size" value={startup.teamSize.toString()} />
          </section>

          {/* Risk + SDG (3D futuristic) */}
          <RiskSDG3D
            stage={startup.stage}
            category={startup.category}
            aiScore={startup.aiScore
              ? { riskScore: startup.aiScore.riskScore, impactScore: startup.aiScore.impactScore }
              : null}
            aiAnalysis={startup.aiAnalysis
              ? {
                  marketAdoptionScore:          startup.aiAnalysis.marketAdoptionScore,
                  financialSustainabilityScore: startup.aiAnalysis.financialSustainabilityScore,
                  technologyScore:              startup.aiAnalysis.technologyScore,
                }
              : null}
            assessments={startup.assessments.map((a) => ({ verdict: a.verdict, confidenceScore: a.confidenceScore }))}
            milestones={startup.milestones.map((m) => ({ status: m.status }))}
            latestFinancials={startup.financials[0] ? { runwayMonths: startup.financials[0].runwayMonths } : null}
            sdgGoals={startup.sdgGoals}
            co2ReductionTonnesPerYear={Number(startup.co2ReductionTonnesPerYear)}
            jobsCreated={startup.jobsCreated}
            waterSavedLitresPerYear={startup.waterSavedLitresPerYear ? Number(startup.waterSavedLitresPerYear) : null}
            biodiversityScore={startup.biodiversityScore ?? null}
          />

          {/* Description */}
          <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h2 className="mb-3 text-lg font-semibold text-white">About</h2>
            <p className="text-sm leading-relaxed text-gray-400">{startup.description}</p>
          </section>

          {/* Milestones */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-green-400">Milestone Roadmap</h2>
            <div className="space-y-3">
              {startup.milestones.map((m, i) => (
                <div
                  key={m.id}
                  className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 font-mono text-xs text-gray-500">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{m.title}</p>
                    <p className="text-xs text-gray-500">
                      ₹{Number(m.fundReleaseUSD).toLocaleString("en-IN")} · {new Date(m.targetDate).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <MilestoneStatusBadge status={m.status} />
                </div>
              ))}
              {startup.milestones.length === 0 && (
                <p className="text-gray-500">No milestones defined yet.</p>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ── Metrics tab ── */}
      {activeTab === "metrics" && (
        <MetricsPanel
          startup={{
            co2ReductionTonnesPerYear: Number(startup.co2ReductionTonnesPerYear),
            jobsCreated: startup.jobsCreated,
            waterSavedLitresPerYear: startup.waterSavedLitresPerYear ? Number(startup.waterSavedLitresPerYear) : null,
            biodiversityScore: startup.biodiversityScore ?? null,
            sdgGoals: startup.sdgGoals,
            totalFundedUSD: Number(startup.totalFundedUSD),
            teamSize: startup.teamSize,
          }}
          milestones={startup.milestones.map((m) => ({
            id: m.id,
            title: m.title,
            status: m.status,
            fundReleaseUSD: Number(m.fundReleaseUSD),
            targetDate: m.targetDate.toISOString(),
          }))}
          assessments={startup.assessments.map((a) => ({
            id: a.id,
            verdict: a.verdict,
            confidenceScore: a.confidenceScore,
            report: a.report,
            createdAt: a.createdAt.toISOString(),
          }))}
          metricUpdates={startup.metricUpdates.map((mu) => ({
            id: mu.id,
            createdAt: mu.createdAt.toISOString(),
            co2ReductionTonnesPerYear: mu.co2ReductionTonnesPerYear ? Number(mu.co2ReductionTonnesPerYear) : null,
            jobsCreated: mu.jobsCreated ?? null,
            revenue: mu.revenue ? Number(mu.revenue) : null,
            notes: mu.notes ?? null,
          }))}
          fundraising={
            startup.fundraisingRequests[0]
              ? {
                  amountRaisingINR: Number(startup.fundraisingRequests[0].amountRaisingINR),
                  amountRaisedINR: Number(startup.fundraisingRequests[0].amountRaisedINR),
                  fundingRound: startup.fundraisingRequests[0].fundingRound,
                  equityPercent: Number(startup.fundraisingRequests[0].equityPercent),
                  valuationINR: Number(startup.fundraisingRequests[0].valuationINR),
                }
              : null
          }
          aiScore={
            startup.aiScore
              ? {
                  overallScore: startup.aiScore.overallScore,
                  growthScore: startup.aiScore.growthScore,
                  impactScore: startup.aiScore.impactScore,
                  riskScore: startup.aiScore.riskScore,
                }
              : null
          }
          financials={startup.financials.map((f) => ({
            id: f.id,
            fiscalYear: f.fiscalYear,
            periodEndDate: f.periodEndDate.toISOString(),
            revenueINR: f.revenueINR ? Number(f.revenueINR) : null,
            grossProfitINR: f.grossProfitINR ? Number(f.grossProfitINR) : null,
            ebitdaINR: f.ebitdaINR ? Number(f.ebitdaINR) : null,
            netProfitINR: f.netProfitINR ? Number(f.netProfitINR) : null,
            totalAssetsINR: f.totalAssetsINR ? Number(f.totalAssetsINR) : null,
            totalLiabilitiesINR: f.totalLiabilitiesINR ? Number(f.totalLiabilitiesINR) : null,
            cashEquivalentsINR: f.cashEquivalentsINR ? Number(f.cashEquivalentsINR) : null,
            burnRateINR: f.burnRateINR ? Number(f.burnRateINR) : null,
            runwayMonths: f.runwayMonths ?? null,
            filingSource: f.filingSource ?? null,
          }))}
        />
      )}

      {/* ── News tab ── */}
      {activeTab === "news" && (
        <NewsPanel
          startupId={startup.id}
          cached={startup.news.map((n) => ({
            id: n.id,
            title: n.title,
            summary: n.summary,
            sourceUrl: n.sourceUrl ?? null,
            publishedAt: n.publishedAt.toISOString(),
          }))}
        />
      )}

      {/* ── Analyst Reports tab ── */}
      {activeTab === "reports" && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Analyst Reports</h2>
          {startup.analystReports.length === 0 ? (
            <p className="text-gray-500">No analyst reports published yet.</p>
          ) : (
            <div className="space-y-4">
              {startup.analystReports.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-6 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-white">{r.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        By {r.analystName} ·{" "}
                        {new Date(r.publishedAt).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="text-sm leading-relaxed text-gray-400">
                    {r.content.length > 300 ? r.content.slice(0, 300) + "…" : r.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

    </main>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="font-mono text-white">{value}/100</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400 text-sm shrink-0">
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-green-400">{value}</p>
    </div>
  );
}

function VerificationBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    verified: "bg-green-500/10 text-green-400 border-green-500/20",
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    under_review: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    disputed: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles["pending"]}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function MilestoneStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-green-900/50 text-green-400",
    in_progress: "bg-blue-900/50 text-blue-400",
    oracle_verifying: "bg-purple-900/50 text-purple-400",
    pending: "bg-gray-700 text-gray-400",
    failed: "bg-red-900/50 text-red-400",
    disputed: "bg-orange-900/50 text-orange-400",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs ${styles[status] ?? styles["pending"]}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ── Contract sign form (client component wrapper rendered server-side) ─────────
// We keep the form in a separate client component so the server page stays a
// pure async server component.
