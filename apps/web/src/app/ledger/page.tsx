import { prisma } from "@greenfund/db";

export const dynamic = "force-dynamic";

async function getAggregates() {
  return prisma.impactLedgerEntry.aggregate({
    _sum: { co2ReducedTonnes: true, jobsCreated: true },
    _count: { id: true },
  });
}

async function getRecentEntries() {
  return prisma.impactLedgerEntry.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: { startup: { select: { name: true, category: true } } },
  });
}

export default async function ImpactLedgerPage() {
  const [aggregates, entries] = await Promise.all([getAggregates(), getRecentEntries()]);

  const totalCO2 = Number(aggregates._sum.co2ReducedTonnes ?? 0);
  const totalJobs = aggregates._sum.jobsCreated ?? 0;
  const totalReports = aggregates._count.id;

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-green-500/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-4">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/5 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-green-400">Live on-chain</span>
          </div>
          <h1 className="text-4xl font-bold text-white">Public Impact Ledger</h1>
          <p className="mt-2 text-gray-500">
            Verified environmental impact across all GreenFund-backed startups.
          </p>
        </div>

        {/* Aggregate stats */}
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total CO₂ Reduced"
            value={totalCO2 >= 1000 ? `${(totalCO2 / 1000).toFixed(1)}k` : totalCO2.toFixed(0)}
            unit="tonnes"
            icon="🌍"
          />
          <StatCard
            label="Jobs Created"
            value={totalJobs >= 1000 ? `${(totalJobs / 1000).toFixed(1)}k` : totalJobs.toString()}
            unit="people"
            icon="👥"
          />
          <StatCard
            label="Verified Reports"
            value={totalReports.toString()}
            unit="entries"
            icon="✅"
          />
        </div>

        {/* Entries */}
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-32 text-center">
            <div className="text-5xl">📊</div>
            <h3 className="mt-4 text-lg font-semibold text-white">No entries yet</h3>
            <p className="mt-1 text-sm text-gray-500">Impact data will appear here once startups begin reporting.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/5">
            <div className="border-b border-white/5 px-6 py-4">
              <h2 className="text-sm font-semibold text-white">Recent Reports</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  {["Startup", "Category", "CO₂ (t)", "Jobs", "Period", "Verified"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {entries.map((e) => (
                  <tr key={e.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-medium text-white">{e.startup.name}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {e.startup.category.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4 font-mono text-green-400">
                      {Number(e.co2ReducedTonnes).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-300">{e.jobsCreated}</td>
                    <td className="px-6 py-4 text-gray-500">{e.reportingPeriod}</td>
                    <td className="px-6 py-4">
                      {e.verifiedOnChain ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                          <span className="h-1 w-1 rounded-full bg-green-400" />
                          On-chain
                        </span>
                      ) : (
                        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-gray-500">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value, unit, icon }: { label: string; value: string; unit: string; icon: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-600">{label}</p>
          <p className="mt-2 text-4xl font-bold gradient-text">{value}</p>
          <p className="mt-0.5 text-sm text-gray-600">{unit}</p>
        </div>
        <div className="text-3xl opacity-20">{icon}</div>
      </div>
    </div>
  );
}
