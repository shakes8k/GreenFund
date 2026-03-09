"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUser, type AuthUser } from "@/lib/auth";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ScatterChart, Scatter, ZAxis, PieChart, Pie, Cell, Legend,
} from "recharts";

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface Holding {
  startupId: string;
  name: string;
  category: string;
  co2PerYear: number;
  jobsCreated: number;
  fundingRound: string;
  investedINR: number;
  sharesPercent: number;
  originalValuationINR: number;
  latestValuationINR: number;
  investedAt: string;
}

interface TimelinePoint {
  date: string;
  amount: number;
  cumulative: number;
  company: string;
}

interface ActiveRound {
  id: string;
  fundingRound: string;
  amountRaisingINR: string;
  amountRaisedINR: string;
  status: string;
  startup: { id: string; name: string };
}

interface Portfolio {
  holdings: Holding[];
  timeline: TimelinePoint[];
  activeRounds: ActiveRound[];
}

interface InvestorOfferItem {
  id: string;
  amountINR: string;
  sharesPercent: string | null;
  status: string;
  createdAt: string;
  fundraisingRequest: {
    fundingRound: string;
    equityPercent: string;
    startup: { id: string; name: string; category: string };
  };
}

/* ─── Constants ─────────────────────────────────────────────────────────── */

const CATEGORY_COLORS: Record<string, string> = {
  solar_energy:    "#f59e0b",
  wind_energy:     "#60a5fa",
  carbon_capture:  "#34d399",
  sustainable_agriculture: "#a3e635",
  clean_water:     "#38bdf8",
  electric_mobility: "#a78bfa",
  green_buildings: "#fb7185",
  diverse:         "#94a3b8",
};
const DEFAULT_COLOR = "#22c55e";

const fmt = (n: number) =>
  n >= 1_00_00_000 ? `₹${(n / 1_00_00_000).toFixed(1)}Cr`
  : n >= 1_00_000  ? `₹${(n / 1_00_000).toFixed(1)}L`
  : `₹${n.toLocaleString("en-IN")}`;

const categoryLabel = (c: string) =>
  c.replace(/_/g, " ").replace(/\b\w/g, (x) => x.toUpperCase());

/* ─── Main component ─────────────────────────────────────────────────────── */

export default function InvestorDashboard() {
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [allOffers, setAllOffers] = useState<InvestorOfferItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<"portfolio" | "offers">("portfolio");
  const router = useRouter();

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== "investor") { router.push("/auth/login"); return; }
    setUser(u);

    Promise.all([
      fetch(`/api/investor/portfolio?email=${encodeURIComponent(u.email)}`).then((r) => r.json()),
      fetch(`/api/investor/offers?email=${encodeURIComponent(u.email)}`).then((r) => r.json()),
    ]).then(([p, o]) => {
      setPortfolio(p);
      setAllOffers(Array.isArray(o) ? o : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router]);

  if (!user) return null;

  /* ── Derived metrics ── */
  const holdings = portfolio?.holdings ?? [];
  const timeline = portfolio?.timeline ?? [];
  const activeRounds = portfolio?.activeRounds ?? [];

  const totalInvested   = holdings.reduce((s, h) => s + h.investedINR, 0);
  const portfolioValue  = holdings.reduce((s, h) => s + (h.sharesPercent / 100) * h.latestValuationINR, 0);
  const paperReturn     = totalInvested > 0 ? ((portfolioValue - totalInvested) / totalInvested) * 100 : 0;
  const climateImpact   = holdings.reduce((s, h) => s + (h.co2PerYear * h.sharesPercent) / 100, 0);
  const jobsContrib     = holdings.reduce((s, h) => s + (h.jobsCreated * h.sharesPercent) / 100, 0);

  /* ── Risk donut data ── */
  const categoryMap = new Map<string, number>();
  for (const h of holdings) {
    categoryMap.set(h.category, (categoryMap.get(h.category) ?? 0) + h.investedINR);
  }
  const donutData = Array.from(categoryMap.entries()).map(([cat, val]) => ({
    name: categoryLabel(cat),
    value: val,
    color: CATEGORY_COLORS[cat] ?? DEFAULT_COLOR,
  }));

  /* ── Scatter data ── */
  const scatterData = holdings.map((h) => ({
    x: parseFloat(((h.co2PerYear * h.sharesPercent) / 100).toFixed(2)),
    y: h.investedINR,
    z: h.sharesPercent,
    name: h.name,
  }));

  /* ── Pending offers count ── */
  const pendingCount = allOffers.filter((o) => o.status === "pending").length;

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
      <div className="relative mx-auto max-w-7xl px-6 py-10">

        {/* ── Header ── */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-sm font-light text-gray-500">Investor dashboard</p>
            <h1 className="text-3xl font-bold text-white">{user.name}</h1>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                {user.investorType?.replace(/_/g, " ") ?? "Investor"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-gray-500">
                {user.riskAppetite ?? "balanced"} risk
              </span>
            </div>
          </div>
          <Link href="/startups"
            className="rounded-lg bg-green-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-green-400">
            Browse Startups
          </Link>
        </div>

        {/* ── Tabs ── */}
        <div className="mb-8 flex gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-1 w-fit">
          {(["portfolio", "offers"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`relative rounded-lg px-5 py-2 text-sm font-medium transition ${
                activeTab === t ? "bg-green-500/15 text-green-400" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {t === "portfolio" ? "Portfolio" : "All Offers"}
              {t === "offers" && pendingCount > 0 && (
                <span className="ml-1.5 rounded-full bg-yellow-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "portfolio" ? (
          <PortfolioView
            loading={loading}
            holdings={holdings}
            timeline={timeline}
            activeRounds={activeRounds}
            totalInvested={totalInvested}
            portfolioValue={portfolioValue}
            paperReturn={paperReturn}
            climateImpact={climateImpact}
            jobsContrib={jobsContrib}
            donutData={donutData}
            scatterData={scatterData}
          />
        ) : (
          <OffersView offers={allOffers} loading={loading} />
        )}
      </div>
    </main>
  );
}

/* ─── Portfolio view ─────────────────────────────────────────────────────── */

function PortfolioView({
  loading, holdings, timeline, activeRounds,
  totalInvested, portfolioValue, paperReturn,
  climateImpact, jobsContrib, donutData, scatterData,
}: {
  loading: boolean;
  holdings: Holding[];
  timeline: TimelinePoint[];
  activeRounds: ActiveRound[];
  totalInvested: number;
  portfolioValue: number;
  paperReturn: number;
  climateImpact: number;
  jobsContrib: number;
  donutData: { name: string; value: number; color: string }[];
  scatterData: { x: number; y: number; z: number; name: string }[];
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]" />
        ))}
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-gradient-to-br from-green-500/[0.03] to-transparent py-20 text-center">
        <svg className="h-16 w-16 text-green-500/20 mb-4" fill="none" viewBox="0 0 64 64" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="32" cy="32" r="28" />
          <rect x="16" y="38" width="8" height="10" rx="1" />
          <rect x="28" y="28" width="8" height="20" rx="1" />
          <rect x="40" y="20" width="8" height="28" rx="1" />
          <polyline points="18,28 28,18 38,24 50,14" />
          <polyline points="44,14 50,14 50,20" />
        </svg>
        <h3 className="text-base font-semibold text-white">No holdings yet</h3>
        <p className="mt-1 text-sm font-light text-gray-500 max-w-xs">
          Invest in a startup's fundraising round and your portfolio will appear here.
        </p>
        <Link href="/startups" className="mt-5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90 transition">
          Explore Startups
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Row 1: Headline stats ── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <GlowStat
          label="Total Invested"
          value={fmt(totalInvested)}
          sub={`${holdings.length} holding${holdings.length !== 1 ? "s" : ""}`}
          color="green"
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <GlowStat
          label="Est. Portfolio Value"
          value={fmt(portfolioValue)}
          sub={
            paperReturn >= 0
              ? `▲ ${paperReturn.toFixed(1)}% paper return`
              : `▼ ${Math.abs(paperReturn).toFixed(1)}% paper return`
          }
          subColor={paperReturn >= 0 ? "text-green-400" : "text-red-400"}
          color="blue"
          icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
        <GlowStat
          label="CO₂ Impact"
          value={`${climateImpact.toFixed(1)} t`}
          sub="tonnes/yr attributed to you"
          color="emerald"
          icon="M12 3C7 3 3 7.5 3 12c0 3.5 2 6.5 5 8l1-3h6l1 3c3-1.5 5-4.5 5-8 0-4.5-4-9-9-9z"
        />
        <GlowStat
          label="Jobs Attributed"
          value={jobsContrib.toFixed(1)}
          sub="direct employment impact"
          color="purple"
          icon="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z"
        />
      </div>

      {/* ── Row 2: Holdings table + Risk donut ── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Holdings table */}
        <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-semibold text-white">Company Holdings</h2>
            <p className="text-xs text-gray-500 mt-0.5">Equity, estimated value, and climate contribution per company</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs font-medium uppercase tracking-wider text-gray-600">
                  <th className="px-6 py-3 text-left">Company</th>
                  <th className="px-4 py-3 text-right">Invested</th>
                  <th className="px-4 py-3 text-right">Equity</th>
                  <th className="px-4 py-3 text-right">Est. Value</th>
                  <th className="px-4 py-3 text-right">XIRR</th>
                  <th className="px-4 py-3 text-right">CO₂/yr</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {holdings.map((h) => {
                  const estValue = (h.sharesPercent / 100) * h.latestValuationINR;
                  const ret = h.investedINR > 0 ? ((estValue - h.investedINR) / h.investedINR) * 100 : 0;
                  const co2Contrib = (h.co2PerYear * h.sharesPercent) / 100;
                  // Annualised return: days held
                  const daysHeld = Math.max(1, (Date.now() - new Date(h.investedAt).getTime()) / 86400000);
                  const xirr = ret * (365 / daysHeld);
                  return (
                    <tr key={h.startupId} className="hover:bg-white/[0.02] transition">
                      <td className="px-6 py-4">
                        <Link href={`/startups/${h.startupId}`} className="hover:text-green-400 transition">
                          <p className="font-medium text-white">{h.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {categoryLabel(h.category)} · {h.fundingRound}
                          </p>
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-white">{fmt(h.investedINR)}</td>
                      <td className="px-4 py-4 text-right text-green-400 font-mono">{h.sharesPercent.toFixed(4)}%</td>
                      <td className="px-4 py-4 text-right font-mono text-white">{fmt(estValue)}</td>
                      <td className={`px-4 py-4 text-right font-mono font-semibold ${xirr >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {xirr >= 0 ? "+" : ""}{xirr.toFixed(1)}%
                        <span className="block text-[10px] font-normal text-gray-600">annualised</span>
                      </td>
                      <td className="px-4 py-4 text-right text-gray-400">{co2Contrib.toFixed(1)} t</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-white/5 text-xs text-gray-600">
            * Est. Value = equity% × latest round valuation. XIRR = annualised paper return (unrealised).
          </div>
        </div>

        {/* Risk donut */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h2 className="font-semibold text-white mb-1">Risk Analysis</h2>
          <p className="text-xs text-gray-500 mb-4">Portfolio by sector</p>
          {donutData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => fmt(v)}
                    contentStyle={{ backgroundColor: "#0f1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "12px" }}
                    labelStyle={{ color: "#fff" }}
                    itemStyle={{ color: "#9ca3af" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-2">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-gray-400">{d.name}</span>
                    </div>
                    <span className="font-mono text-gray-300">{((d.value / holdings.reduce((s, h) => s + h.investedINR, 0)) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600 text-center py-12">No data</p>
          )}
        </div>
      </div>

      {/* ── Row 3: Cumulative line chart + Funding momentum ── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Line chart */}
        <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h2 className="font-semibold text-white mb-1">Investment Timeline</h2>
          <p className="text-xs text-gray-500 mb-6">Cumulative capital deployed over time</p>
          {timeline.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={timeline} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => fmt(v)}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                />
                <Tooltip
                  formatter={(v: number) => [fmt(v), "Cumulative"]}
                  contentStyle={{ backgroundColor: "#0f1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "12px" }}
                  labelStyle={{ color: "#9ca3af" }}
                  itemStyle={{ color: "#4ade80" }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  dot={(props) => {
                    const { cx, cy } = props;
                    return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={4} fill="#22c55e" stroke="#0f1117" strokeWidth={2} />;
                  }}
                  activeDot={{ r: 6, fill: "#4ade80", stroke: "#0f1117", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : timeline.length === 1 ? (
            <div className="flex items-center justify-center h-[220px] text-sm text-gray-500">
              Only one data point — invest in more rounds to see the timeline.
            </div>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-sm text-gray-500">No timeline data</div>
          )}
        </div>

        {/* Funding momentum */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h2 className="font-semibold text-white mb-1">Funding Momentum</h2>
          <p className="text-xs text-gray-500 mb-5">Round progress for your investments</p>
          {activeRounds.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-10">No active rounds</p>
          ) : (
            <div className="space-y-5">
              {activeRounds.map((r) => {
                const raising = Number(r.amountRaisingINR);
                const raised = Number(r.amountRaisedINR);
                const pct = raising > 0 ? Math.min((raised / raising) * 100, 100) : 0;
                return (
                  <div key={r.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <p className="text-sm font-medium text-white">{r.startup.name}</p>
                        <p className="text-xs text-gray-500">{r.fundingRound}</p>
                      </div>
                      <span className={`text-xs font-semibold ${pct >= 100 ? "text-green-400" : "text-yellow-400"}`}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-gray-600">
                      <span>{fmt(raised)} raised</span>
                      <span>of {fmt(raising)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4: Impact vs Profit scatter ── */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <h2 className="font-semibold text-white mb-1">Impact vs. Invested Capital</h2>
        <p className="text-xs text-gray-500 mb-6">
          Each bubble is a company you hold. X = CO₂ you help reduce (t/yr) · Y = capital you deployed · Bubble size = equity %
        </p>
        {scatterData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
              <XAxis
                dataKey="x"
                type="number"
                name="CO₂ (t/yr)"
                unit=" t"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                label={{ value: "CO₂ contribution (t/yr)", position: "insideBottom", offset: -2, fill: "#4b5563", fontSize: 11 }}
              />
              <YAxis
                dataKey="y"
                type="number"
                name="Invested"
                tickFormatter={(v: number) => fmt(v)}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                width={64}
              />
              <ZAxis dataKey="z" range={[60, 400]} name="Equity %" />
              <Tooltip
                cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.1)" }}
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0]?.payload as { name: string; x: number; y: number; z: number };
                  return (
                    <div className="rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2 text-xs">
                      <p className="font-semibold text-white mb-1">{d.name}</p>
                      <p className="text-gray-400">CO₂ contribution: <span className="text-green-400">{d.x} t/yr</span></p>
                      <p className="text-gray-400">Invested: <span className="text-white">{fmt(d.y)}</span></p>
                      <p className="text-gray-400">Equity: <span className="text-blue-400">{d.z.toFixed(4)}%</span></p>
                    </div>
                  );
                }}
              />
              <Scatter data={scatterData} fill="#22c55e" fillOpacity={0.8} />
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[260px] text-sm text-gray-500">No data to display</div>
        )}
      </div>

    </div>
  );
}

/* ─── Offers view ────────────────────────────────────────────────────────── */

function OffersView({ offers, loading }: { offers: InvestorOfferItem[]; loading: boolean }) {
  if (loading) {
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl border border-white/5 bg-white/[0.02]" />)}</div>;
  }
  if (offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center">
        <h3 className="text-base font-semibold text-white">No offers yet</h3>
        <p className="mt-1 text-sm font-light text-gray-500">Explore startups to invest in active fundraising rounds.</p>
        <Link href="/startups" className="mt-4 rounded-lg bg-green-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-green-400 transition">
          Explore Startups
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {offers.map((o) => (
        <Link key={o.id} href={`/startups/${o.fundraisingRequest.startup.id}`}
          className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4 hover:border-green-500/20 transition">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white">{o.fundraisingRequest.startup.name}</p>
            <p className="text-xs text-gray-500">
              {categoryLabel(o.fundraisingRequest.startup.category)} · {o.fundraisingRequest.fundingRound} · {new Date(o.createdAt).toLocaleDateString()}
            </p>
            {o.sharesPercent && o.status === "accepted" && (
              <p className="text-xs text-green-400 mt-0.5">Equity: {Number(o.sharesPercent).toFixed(4)}%</p>
            )}
          </div>
          <span className="font-semibold text-green-400 shrink-0">
            ₹{Number(o.amountINR).toLocaleString("en-IN")}
          </span>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            o.status === "accepted" ? "bg-green-500/10 text-green-400" :
            o.status === "pending"  ? "bg-yellow-500/10 text-yellow-400" :
            "bg-red-500/10 text-red-400"
          }`}>
            {o.status}
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ─── GlowStat ───────────────────────────────────────────────────────────── */

function GlowStat({
  label, value, sub, subColor, color, icon,
}: {
  label: string;
  value: string;
  sub: string;
  subColor?: string;
  color: string;
  icon?: string;
}) {
  const cfg: Record<string, { border: string; bg: string; text: string; iconCls: string }> = {
    green:   { border: "border-green-500/15",   bg: "from-green-500/[0.08] to-transparent",   text: "text-green-400",   iconCls: "text-green-400" },
    blue:    { border: "border-blue-500/15",    bg: "from-blue-500/[0.08] to-transparent",    text: "text-blue-400",    iconCls: "text-blue-400" },
    emerald: { border: "border-emerald-500/15", bg: "from-emerald-500/[0.08] to-transparent", text: "text-emerald-400", iconCls: "text-emerald-400" },
    purple:  { border: "border-purple-500/15",  bg: "from-purple-500/[0.08] to-transparent",  text: "text-purple-400",  iconCls: "text-purple-400" },
  };
  const s = cfg[color] ?? cfg.green!;
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 ${s.border} ${s.bg}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-600">{label}</p>
        {icon && (
          <svg className={`h-4 w-4 ${s.iconCls} opacity-60`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        )}
      </div>
      <p className={`mt-1 text-2xl font-bold ${s.text}`}>{value}</p>
      <p className={`mt-0.5 text-xs font-light ${subColor ?? "text-gray-500"}`}>{sub}</p>
    </div>
  );
}
