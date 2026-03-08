import { prisma } from "@greenfund/db";
import Link from "next/link";

export const revalidate = 30;

const categoryColors: Record<string, string> = {
  solar: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  wind: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  ocean_tech: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  carbon_capture: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  green_hydrogen: "bg-green-500/10 text-green-400 border-green-500/20",
  sustainable_agriculture: "bg-lime-500/10 text-lime-400 border-lime-500/20",
  ev_mobility: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  energy_storage: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  waste_tech: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  biodiversity: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const verificationColors: Record<string, string> = {
  verified: "bg-green-500/10 text-green-400",
  pending: "bg-yellow-500/10 text-yellow-400",
  under_review: "bg-blue-500/10 text-blue-400",
  disputed: "bg-orange-500/10 text-orange-400",
  rejected: "bg-red-500/10 text-red-400",
};

export default async function StartupsPage() {
  const startups = await prisma.startup.findMany({
    orderBy: { createdAt: "desc" },
    include: { riskPool: { select: { name: true } } },
  });

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />

      <div className="relative mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white">Climate Startups</h1>
          <p className="mt-2 text-gray-500">
            {startups.length > 0
              ? `${startups.length} verified startups seeking investment`
              : "No startups listed yet — be the first to apply."}
          </p>
        </div>

        {startups.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {startups.map((s) => (
              <Link
                key={s.id}
                href={`/startups/${s.id}`}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition hover:border-green-500/30 hover:bg-white/[0.04]"
              >
                {/* Category + Status */}
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${categoryColors[s.category] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                    {s.category.replace(/_/g, " ")}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${verificationColors[s.verificationStatus] ?? "bg-gray-500/10 text-gray-400"}`}>
                    {s.verificationStatus.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Name + Description */}
                <h2 className="text-lg font-semibold text-white group-hover:text-green-300 transition-colors">
                  {s.name}
                </h2>
                <p className="mt-1.5 line-clamp-2 text-sm text-gray-500 leading-relaxed">
                  {s.description}
                </p>

                {/* Metrics */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Metric label="CO₂ / year" value={`${Number(s.co2ReductionTonnesPerYear).toLocaleString()}t`} green />
                  <Metric label="Jobs created" value={s.jobsCreated.toString()} />
                  <Metric label="Stage" value={s.stage.replace(/_/g, " ")} />
                  <Metric label="Funded" value={`$${(Number(s.totalFundedUSD) / 1000).toFixed(0)}k`} green />
                </div>

                {/* Pool tag */}
                {s.riskPool && (
                  <div className="mt-4 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-xs text-gray-500">{s.riskPool.name}</span>
                  </div>
                )}

                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-hover:opacity-100 glow-green" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-gray-600">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${green ? "text-green-400" : "text-gray-300"}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-32 text-center">
      <div className="text-5xl">🌱</div>
      <h3 className="mt-4 text-lg font-semibold text-white">No startups yet</h3>
      <p className="mt-1 text-sm text-gray-500">The ecosystem is just getting started.</p>
    </div>
  );
}
