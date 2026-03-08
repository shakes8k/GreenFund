import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@greenfund/db";
import { ScenarioSimulator } from "@/components/scenario/ScenarioSimulator";

export const revalidate = 60;

const TABS = ["overview", "metrics", "news", "reports", "contract"] as const;
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
      analystReports: { orderBy: { publishedAt: "desc" } },
      news: { orderBy: { publishedAt: "desc" }, take: 20 },
      metricUpdates: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!startup) notFound();

  const tabHref = (t: Tab) => `?tab=${t}`;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-white">{startup.name}</h1>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-gray-400">
            {startup.category.replace(/_/g, " ")}
          </span>
          <VerificationBadge status={startup.verificationStatus} />
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span>{startup.stage.replace(/_/g, " ")}</span>
          <span>·</span>
          <span>{startup.countryCode}</span>
          <span>·</span>
          <span>Founded {startup.foundedYear}</span>
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <nav className="mb-8 flex gap-1 border-b border-white/5">
        {TABS.map((t) => (
          <Link
            key={t}
            href={tabHref(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
              activeTab === t
                ? "border-b-2 border-green-400 text-white"
                : "text-gray-500 hover:text-gray-300"
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

          {/* Key metrics */}
          <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Metric label="CO₂ / year" value={`${Number(startup.co2ReductionTonnesPerYear).toLocaleString()}t`} />
            <Metric label="Jobs Created" value={startup.jobsCreated.toString()} />
            <Metric label="Total Funded" value={`$${Number(startup.totalFundedUSD).toLocaleString()}`} />
            <Metric label="Team Size" value={startup.teamSize.toString()} />
          </section>

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
                      ${Number(m.fundReleaseUSD).toLocaleString()} · {new Date(m.targetDate).toLocaleDateString()}
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
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Metrics History</h2>
          {startup.metricUpdates.length === 0 ? (
            <p className="text-gray-500">No metric updates yet.</p>
          ) : (
            <div className="relative border-l border-white/10 pl-6 space-y-6">
              {startup.metricUpdates.map((mu) => {
                const custom = mu.customMetrics as Record<string, unknown> | null;
                return (
                  <div key={mu.id} className="relative">
                    <span className="absolute -left-[25px] top-1 h-3 w-3 rounded-full border border-green-500/50 bg-green-500/20" />
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-600">
                        {new Date(mu.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        {mu.co2ReductionTonnesPerYear != null && (
                          <span className="text-green-400">
                            CO₂: <strong>{Number(mu.co2ReductionTonnesPerYear).toLocaleString()}t/yr</strong>
                          </span>
                        )}
                        {mu.jobsCreated != null && (
                          <span className="text-blue-400">
                            Jobs: <strong>{mu.jobsCreated}</strong>
                          </span>
                        )}
                        {mu.revenue != null && (
                          <span className="text-yellow-400">
                            Revenue: <strong>${Number(mu.revenue).toLocaleString()}</strong>
                          </span>
                        )}
                      </div>
                      {mu.notes && (
                        <p className="mt-3 text-sm text-gray-400">{mu.notes}</p>
                      )}
                      {custom && Object.keys(custom).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {Object.entries(custom).map(([k, v]) => (
                            <span
                              key={k}
                              className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-gray-400"
                            >
                              {k}: {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── News tab ── */}
      {activeTab === "news" && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Company News</h2>
          {startup.news.length === 0 ? (
            <p className="text-gray-500">No news posted yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {startup.news.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-5 flex flex-col gap-3"
                >
                  <div>
                    <p className="text-xs text-gray-600">
                      {new Date(item.publishedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <h3 className="mt-1 font-semibold text-white">{item.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-400 flex-1">{item.summary}</p>
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-400 hover:underline"
                    >
                      Read source →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
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
                        {new Date(r.publishedAt).toLocaleDateString(undefined, {
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

      {/* ── Contract tab ── */}
      {activeTab === "contract" && (
        <div className="space-y-8">
          <ScenarioSimulator
            startupId={startup.id}
            baselineValuationUSD={Number(startup.totalFundedUSD) || 5_000_000}
          />
          <ContractSignForm startupId={startup.id} startupName={startup.name} />
        </div>
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
import { ContractSignForm } from "@/components/ContractSignForm";
