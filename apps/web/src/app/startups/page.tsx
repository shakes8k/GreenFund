import { prisma } from "@greenfund/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Top accent strip colors per category
const categoryAccent: Record<string, string> = {
  solar:                    "bg-amber-500",
  wind:                     "bg-sky-500",
  ocean_tech:               "bg-cyan-500",
  carbon_capture:           "bg-slate-400",
  green_hydrogen:           "bg-emerald-500",
  sustainable_agriculture:  "bg-lime-500",
  ev_mobility:              "bg-violet-500",
  energy_storage:           "bg-orange-500",
  waste_tech:               "bg-rose-500",
  biodiversity:             "bg-teal-500",
  diverse:                  "bg-indigo-500",
};

// Subtle card gradient per category
const categoryGradient: Record<string, string> = {
  solar:                    "from-amber-500/[0.04]",
  wind:                     "from-sky-500/[0.04]",
  ocean_tech:               "from-cyan-500/[0.04]",
  carbon_capture:           "from-slate-400/[0.04]",
  green_hydrogen:           "from-emerald-500/[0.04]",
  sustainable_agriculture:  "from-lime-500/[0.04]",
  ev_mobility:              "from-violet-500/[0.04]",
  energy_storage:           "from-orange-500/[0.04]",
  waste_tech:               "from-rose-500/[0.04]",
  biodiversity:             "from-teal-500/[0.04]",
  diverse:                  "from-indigo-500/[0.04]",
};

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
    where: { verificationStatus: "verified" },
    include: {
      riskPool: { select: { name: true } },
      onboarding: { select: { logoUrl: true } },
    },
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
              ? `${startups.length} verified startup${startups.length !== 1 ? "s" : ""} seeking investment`
              : "No verified startups yet — be the first to apply."}
          </p>
        </div>

        {startups.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {startups.map((s) => {
              const accent = categoryAccent[s.category] ?? "bg-green-500";
              const gradient = categoryGradient[s.category] ?? "from-green-500/[0.04]";
              return (
                <Link
                  key={s.id}
                  href={`/startups/${s.id}`}
                  className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b ${gradient} to-transparent transition hover:border-green-500/30 hover:bg-white/[0.04]`}
                >
                  {/* Colored top accent strip */}
                  <div className={`h-[3px] w-full ${accent} rounded-t-2xl`} />

                  <div className="p-6">
                    {/* Category + Status */}
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${categoryColors[s.category] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                        {s.category.replace(/_/g, " ")}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${verificationColors[s.verificationStatus] ?? "bg-gray-500/10 text-gray-400"}`}>
                        {s.verificationStatus.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Name + Logo + Description */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Logo or initials */}
                        {s.onboarding?.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={s.onboarding.logoUrl}
                            alt={`${s.name} logo`}
                            className="h-9 w-9 shrink-0 rounded-lg object-cover border border-white/10"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/5 border border-white/10 text-xs font-bold text-green-400">
                            {s.name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")}
                          </div>
                        )}
                        <h2 className="text-lg font-bold text-white group-hover:text-green-300 transition-colors truncate">
                          {s.name}
                        </h2>
                      </div>
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-gray-600 opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-green-400"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-500 leading-relaxed">
                      {s.description}
                    </p>

                    {/* Metrics */}
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <Metric
                        label="CO₂ / year"
                        value={`${Number(s.co2ReductionTonnesPerYear).toLocaleString()}t`}
                        green
                        icon={
                          <svg className="h-3.5 w-3.5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3C7 3 3 7.5 3 12c0 2.4 1 4.6 2.6 6.2C7 19.7 9.4 21 12 21s5-1.3 6.4-2.8C20 16.6 21 14.4 21 12c0-4.5-4-9-9-9z" />
                          </svg>
                        }
                      />
                      <Metric
                        label="Jobs created"
                        value={s.jobsCreated.toString()}
                        icon={
                          <svg className="h-3.5 w-3.5 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                          </svg>
                        }
                      />
                      <Metric label="Stage" value={s.stage.replace(/_/g, " ")} />
                      <Metric
                        label="Funded"
                        value={`$${(Number(s.totalFundedUSD) / 1000).toFixed(0)}k`}
                        green
                        icon={
                          <svg className="h-3.5 w-3.5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                          </svg>
                        }
                      />
                    </div>

                    {/* Pool tag */}
                    {s.riskPool && (
                      <div className="mt-4 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <span className="text-xs text-gray-500">{s.riskPool.name}</span>
                      </div>
                    )}

                    {/* View CTA */}
                    <div className="mt-5 flex items-center justify-end">
                      <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-400 transition group-hover:border-green-500/30 group-hover:bg-green-500/10 group-hover:text-green-400">
                        View →
                      </span>
                    </div>
                  </div>

                  <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-hover:opacity-100 glow-green" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  green,
  icon,
}: {
  label: string;
  value: string;
  green?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-3 py-2">
      <div className="flex items-center gap-1">
        {icon}
        <p className="text-[10px] uppercase tracking-wider text-gray-600">{label}</p>
      </div>
      <p className={`mt-0.5 text-sm font-semibold ${green ? "text-green-400" : "text-gray-300"}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-32 text-center">
      {/* Simple plant/sprout SVG illustration */}
      <svg
        className="h-20 w-20 text-green-500/30"
        fill="none"
        viewBox="0 0 80 80"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Stem */}
        <line x1="40" y1="65" x2="40" y2="32" />
        {/* Left leaf */}
        <path d="M40 48 C30 44 22 34 26 24 C32 28 38 38 40 48z" />
        {/* Right leaf */}
        <path d="M40 40 C50 36 58 26 54 16 C48 20 42 30 40 40z" />
        {/* Ground line */}
        <path d="M24 65 Q40 60 56 65" />
        {/* Soil mound */}
        <path d="M28 68 Q40 63 52 68" strokeWidth={1.8} />
      </svg>

      <h3 className="mt-6 text-xl font-semibold text-white">No startups yet</h3>
      <p className="mt-2 max-w-xs text-sm text-gray-500 leading-relaxed">
        The ecosystem is just getting started. Climate startups will appear here once they&apos;re listed and verified.
      </p>
      <Link
        href="/auth/register/company"
        className="mt-6 rounded-lg border border-green-500/20 bg-green-500/10 px-5 py-2.5 text-sm font-medium text-green-400 transition hover:bg-green-500/20"
      >
        List your startup →
      </Link>
    </div>
  );
}
