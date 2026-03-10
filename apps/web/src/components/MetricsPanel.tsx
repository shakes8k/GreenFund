"use client";

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Cell,
  ResponsiveContainer, Tooltip,
} from "recharts";

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface MetricUpdate {
  id: string;
  createdAt: string;
  co2ReductionTonnesPerYear: number | null;
  jobsCreated: number | null;
  revenue: number | null;
  notes: string | null;
}

interface Milestone {
  id: string;
  title: string;
  status: string;
  fundReleaseUSD: number;
  targetDate: string;
}

interface DVNAssessment {
  id: string;
  verdict: string;
  confidenceScore: number;
  report: string;
  createdAt: string;
}

interface FinancialsEntry {
  id: string;
  fiscalYear: string;
  periodEndDate: string;
  revenueINR: number | null;
  grossProfitINR: number | null;
  ebitdaINR: number | null;
  netProfitINR: number | null;
  totalAssetsINR: number | null;
  totalLiabilitiesINR: number | null;
  cashEquivalentsINR: number | null;
  burnRateINR: number | null;
  runwayMonths: number | null;
  filingSource: string | null;
}

interface MetricsPanelProps {
  startup: {
    co2ReductionTonnesPerYear: number;
    jobsCreated: number;
    waterSavedLitresPerYear: number | null;
    biodiversityScore: number | null;
    sdgGoals: number[];
    totalFundedUSD: number;
    teamSize: number;
  };
  milestones: Milestone[];
  assessments: DVNAssessment[];
  metricUpdates: MetricUpdate[];
  fundraising: {
    amountRaisingINR: number;
    amountRaisedINR: number;
    fundingRound: string;
    equityPercent: number;
    valuationINR: number;
  } | null;
  aiScore: {
    overallScore: number;
    growthScore: number;
    impactScore: number;
    riskScore: number;
  } | null;
  financials: FinancialsEntry[];
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const fmt = (n: number) =>
  n >= 1_00_00_000 ? `₹${(n / 1_00_00_000).toFixed(1)}Cr`
  : n >= 1_00_000  ? `₹${(n / 1_00_000).toFixed(1)}L`
  : `₹${n.toLocaleString("en-IN")}`;

/* ─── Component ──────────────────────────────────────────────────────────── */

export function MetricsPanel({
  startup, milestones, assessments, metricUpdates, fundraising, aiScore, financials,
}: MetricsPanelProps) {

  /* ── Milestone stats ── */
  const totalM    = milestones.length;
  const doneM     = milestones.filter((m) => m.status === "completed").length;
  const inProgM   = milestones.filter((m) => m.status === "in_progress").length;
  const mPct      = totalM > 0 ? Math.round((doneM / totalM) * 100) : 0;
  const fundUnlocked = milestones
    .filter((m) => m.status === "completed")
    .reduce((s, m) => s + m.fundReleaseUSD, 0);
  const fundTotal = milestones.reduce((s, m) => s + m.fundReleaseUSD, 0);

  /* ── Radar / impact dimensions ── */
  const co2Norm  = Math.min(100, (startup.co2ReductionTonnesPerYear / 50000) * 100);
  const jobsNorm = Math.min(100, (startup.jobsCreated / 500) * 100);
  const waterNorm = startup.waterSavedLitresPerYear
    ? Math.min(100, (startup.waterSavedLitresPerYear / 1_000_000) * 100)
    : 0;
  const bioNorm  = startup.biodiversityScore ? (startup.biodiversityScore / 10) * 100 : 0;
  const sdgNorm  = Math.min(100, (startup.sdgGoals.length / 17) * 100);
  const fundingNorm = fundraising
    ? Math.min(100, (fundraising.amountRaisedINR / fundraising.amountRaisingINR) * 100)
    : 0;

  const radarData = [
    { subject: "CO₂ Impact",     A: Math.round(co2Norm) },
    { subject: "Jobs",           A: Math.round(jobsNorm) },
    { subject: "Water",          A: Math.round(waterNorm) },
    { subject: "Biodiversity",   A: Math.round(bioNorm) },
    { subject: "SDG Alignment",  A: Math.round(sdgNorm) },
    { subject: "Funding Prog.",  A: Math.round(fundingNorm) },
  ];

  /* ── Score bar chart (AI scores, DVN confidence overlaid) ── */
  const dvnApproved = assessments.filter((a) => a.verdict === "approve").length;
  const dvnTotal    = assessments.length;
  const avgConf     = dvnTotal > 0
    ? Math.round(assessments.reduce((s, a) => s + a.confidenceScore, 0) / dvnTotal)
    : null;

  const scoreBarData = aiScore
    ? [
        { label: "Overall",  score: aiScore.overallScore,  color: "#22c55e" },
        { label: "Growth",   score: aiScore.growthScore,   color: "#60a5fa" },
        { label: "Impact",   score: aiScore.impactScore,   color: "#34d399" },
        { label: "Risk",     score: aiScore.riskScore,     color: "#f87171" },
        ...(avgConf !== null ? [{ label: "DVN Conf.", score: avgConf, color: "#a78bfa" }] : []),
      ]
    : avgConf !== null
    ? [{ label: "DVN Conf.", score: avgConf, color: "#a78bfa" }]
    : [];

  /* ── Trend lines from metricUpdates (sorted oldest→newest) ── */
  const trend = [...metricUpdates]
    .reverse()
    .map((mu) => ({
      date: new Date(mu.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      co2:     mu.co2ReductionTonnesPerYear ?? null,
      jobs:    mu.jobsCreated ?? null,
      revenue: mu.revenue ? Number(mu.revenue) : null,
    }));

  return (
    <div className="space-y-8">

      {/* ── Row 1: KPI snapshot ── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="CO₂ Reduction"
          value={`${startup.co2ReductionTonnesPerYear >= 1000
            ? `${(startup.co2ReductionTonnesPerYear / 1000).toFixed(1)}k`
            : startup.co2ReductionTonnesPerYear.toLocaleString()} t/yr`}
          sub="tonnes per year"
          color="emerald"
          icon="M12 3C7 3 3 7.5 3 12c0 3.5 2 6.5 5 8l1-3h6l1 3c3-1.5 5-4.5 5-8 0-4.5-4-9-9-9z"
        />
        <KpiCard
          label="Jobs Created"
          value={startup.jobsCreated.toLocaleString()}
          sub="direct employment"
          color="blue"
          icon="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z"
        />
        {startup.waterSavedLitresPerYear ? (
          <KpiCard
            label="Water Saved"
            value={`${(startup.waterSavedLitresPerYear / 1_000_000).toFixed(1)}M L/yr`}
            sub="litres per year"
            color="sky"
            icon="M12 2C8 7 4 10 4 14a8 8 0 0016 0c0-4-4-7-8-12z"
          />
        ) : (
          <KpiCard
            label="SDG Goals"
            value={startup.sdgGoals.length.toString()}
            sub={`of 17 aligned: ${startup.sdgGoals.slice(0, 4).join(", ")}${startup.sdgGoals.length > 4 ? "…" : ""}`}
            color="purple"
            icon="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
          />
        )}
        <KpiCard
          label="Milestones"
          value={`${doneM} / ${totalM}`}
          sub={`${mPct}% complete${inProgM > 0 ? ` · ${inProgM} active` : ""}`}
          color="gold"
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </div>

      {/* ── Row 2: Radar chart + DVN/AI scores ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Impact radar */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h2 className="font-semibold text-white mb-0.5">Impact Profile</h2>
          <p className="text-xs text-gray-500 mb-4">Normalised across 6 sustainability dimensions</p>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "#6b7280", fontSize: 11 }}
              />
              <Radar
                name="Score"
                dataKey="A"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.18}
                strokeWidth={2}
              />
              <Tooltip
                formatter={(v: number) => [`${v}/100`, "Score"]}
                contentStyle={{ backgroundColor: "#0f1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "12px" }}
                itemStyle={{ color: "#4ade80" }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* AI + DVN score bars */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-semibold text-white mb-0.5">Score Breakdown</h2>
              <p className="text-xs text-gray-500">AI evaluation{dvnTotal > 0 ? " + DVN confidence" : ""}</p>
            </div>
            {dvnTotal > 0 && (
              <div className="text-right">
                <p className="text-xs text-gray-500">{dvnApproved}/{dvnTotal} DVN verdicts</p>
                <p className={`text-xs font-semibold mt-0.5 ${dvnApproved / dvnTotal >= 0.5 ? "text-green-400" : "text-red-400"}`}>
                  {dvnApproved / dvnTotal >= 0.5 ? "Approved" : "Flagged"}
                </p>
              </div>
            )}
          </div>
          {scoreBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={scoreBarData.length * 44 + 20}>
              <BarChart data={scoreBarData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 12, fill: "#9ca3af" }} tickLine={false} axisLine={false} width={80} />
                <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <Tooltip
                  formatter={(v: number) => [`${v}/100`, "Score"]}
                  contentStyle={{ backgroundColor: "#0f1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "12px" }}
                  itemStyle={{ color: "#fff" }}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {scoreBarData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-sm text-gray-600">
              No assessment data yet
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Milestone progress + Fundraising ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Milestone tracker */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-semibold text-white">Milestone Completion</h2>
              <p className="text-xs text-gray-500 mt-0.5">{doneM} of {totalM} milestones reached</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-400">{mPct}%</p>
              <p className="text-[10px] text-gray-600">complete</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full bg-white/5 mb-5">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
              style={{ width: `${mPct}%` }}
            />
          </div>

          {/* Fund unlock progress */}
          {fundTotal > 0 && (
            <div className="mb-5 rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs text-gray-500 mb-1">Fund unlocked via milestones</p>
              <div className="flex items-end justify-between">
                <p className="text-lg font-bold text-white">{fmt(fundUnlocked)}</p>
                <p className="text-xs text-gray-600">of {fmt(fundTotal)}</p>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white/5">
                <div
                  className="h-1.5 rounded-full bg-purple-500/70"
                  style={{ width: `${fundTotal > 0 ? (fundUnlocked / fundTotal) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Milestone list */}
          {milestones.length > 0 ? (
            <div className="space-y-2">
              {milestones.map((m) => (
                <div key={m.id} className="flex items-center gap-3 text-sm">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${
                    m.status === "completed"  ? "bg-green-400" :
                    m.status === "in_progress" ? "bg-yellow-400 animate-pulse" :
                    "bg-white/20"
                  }`} />
                  <span className={m.status === "completed" ? "text-gray-400 line-through" : "text-gray-300"}>
                    {m.title}
                  </span>
                  <span className="ml-auto text-[10px] text-gray-600">
                    {new Date(m.targetDate).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 text-center py-4">No milestones defined</p>
          )}
        </div>

        {/* Fundraising round stats */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h2 className="font-semibold text-white mb-0.5">Fundraising Round</h2>
          {fundraising ? (
            <>
              <p className="text-xs text-gray-500 mb-5">{fundraising.fundingRound} · {fundraising.equityPercent}% equity offered</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-[10px] text-gray-600 mb-0.5">Target</p>
                  <p className="text-lg font-bold text-white">{fmt(fundraising.amountRaisingINR)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 mb-0.5">Raised</p>
                  <p className="text-lg font-bold text-green-400">{fmt(fundraising.amountRaisedINR)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 mb-0.5">Valuation</p>
                  <p className="text-base font-semibold text-white">{fmt(fundraising.valuationINR)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 mb-0.5">Filled</p>
                  <p className="text-base font-semibold text-yellow-400">
                    {fundraising.amountRaisingINR > 0
                      ? `${Math.min(100, Math.round((fundraising.amountRaisedINR / fundraising.amountRaisingINR) * 100))}%`
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Visual ring */}
              <div className="flex items-center justify-center">
                <RingProgress
                  pct={fundraising.amountRaisingINR > 0
                    ? Math.min(100, (fundraising.amountRaisedINR / fundraising.amountRaisingINR) * 100)
                    : 0}
                  label="of goal raised"
                  color="#22c55e"
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-sm text-gray-600">No active fundraising round</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4: Trend charts (only if metricUpdates exist) ── */}
      {trend.length >= 2 && (
        <div className="grid gap-6 md:grid-cols-3">
          {trend.some((d) => d.co2 !== null) && (
            <TrendChart
              title="CO₂ Reduction Trend"
              unit="t/yr"
              color="#34d399"
              data={trend.filter((d) => d.co2 !== null).map((d) => ({ date: d.date, value: d.co2! }))}
            />
          )}
          {trend.some((d) => d.jobs !== null) && (
            <TrendChart
              title="Jobs Created Trend"
              unit="jobs"
              color="#60a5fa"
              data={trend.filter((d) => d.jobs !== null).map((d) => ({ date: d.date, value: d.jobs! }))}
            />
          )}
          {trend.some((d) => d.revenue !== null) && (
            <TrendChart
              title="Revenue Trend"
              unit="USD"
              color="#fbbf24"
              data={trend.filter((d) => d.revenue !== null).map((d) => ({ date: d.date, value: d.revenue! }))}
              formatY={(v) => `$${v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
          )}
        </div>
      )}

      {/* ── Financial Filings ── */}
      {financials.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-white">Financial Filings</h2>
              <p className="text-xs text-gray-500 mt-0.5">Admin-verified from official company filings</p>
            </div>
            <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-yellow-400">
              Admin Verified
            </span>
          </div>

          {/* Revenue trend if multiple years */}
          {financials.filter((f) => f.revenueINR !== null).length >= 2 && (
            <div className="px-6 pt-5 pb-2">
              <p className="text-xs font-medium text-gray-500 mb-3">Revenue trend</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart
                  data={[...financials].reverse().filter((f) => f.revenueINR !== null).map((f) => ({
                    year: f.fiscalYear.replace("FY", ""),
                    revenue: f.revenueINR,
                    profit: f.netProfitINR,
                  }))}
                  margin={{ left: 0, right: 16, top: 4, bottom: 0 }}
                >
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                  <YAxis
                    tickFormatter={(v: number) => v >= 1e7 ? `${(v/1e7).toFixed(1)}Cr` : v >= 1e5 ? `${(v/1e5).toFixed(0)}L` : `${v}`}
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                  />
                  <Tooltip
                    formatter={(v: number, name: string) => [
                      `₹${v >= 1e7 ? `${(v/1e7).toFixed(2)}Cr` : v >= 1e5 ? `${(v/1e5).toFixed(2)}L` : v.toLocaleString("en-IN")}`,
                      name === "revenue" ? "Revenue" : "Net P/L",
                    ]}
                    contentStyle={{ backgroundColor: "#0f1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "11px" }}
                  />
                  <Bar dataKey="revenue" fill="#fbbf24" fillOpacity={0.8} radius={[3, 3, 0, 0]} maxBarSize={32} name="revenue" />
                  <Bar dataKey="profit" fill="#34d399" fillOpacity={0.7} radius={[3, 3, 0, 0]} maxBarSize={32} name="profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-medium uppercase tracking-wider text-gray-600">
                  <th className="px-6 py-3 text-left">Period</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-right">EBITDA</th>
                  <th className="px-4 py-3 text-right">Net P/L</th>
                  <th className="px-4 py-3 text-right">Cash</th>
                  <th className="px-4 py-3 text-right">Runway</th>
                  <th className="px-4 py-3 text-right">D/E Ratio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {financials.map((f) => {
                  const deRatio = f.totalAssetsINR && f.totalLiabilitiesINR && (f.totalAssetsINR - f.totalLiabilitiesINR) > 0
                    ? (f.totalLiabilitiesINR / (f.totalAssetsINR - f.totalLiabilitiesINR)).toFixed(2)
                    : null;
                  return (
                    <tr key={f.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-6 py-3">
                        <p className="font-semibold text-white">{f.fiscalYear}</p>
                        <p className="text-gray-600">{f.filingSource ?? "Filing"}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-300">
                        {f.revenueINR != null ? fmt(f.revenueINR) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-300">
                        {f.ebitdaINR != null ? fmt(f.ebitdaINR) : "—"}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${
                        f.netProfitINR == null ? "text-gray-600" :
                        f.netProfitINR >= 0 ? "text-green-400" : "text-red-400"
                      }`}>
                        {f.netProfitINR != null ? `${f.netProfitINR >= 0 ? "+" : ""}${fmt(f.netProfitINR)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-300">
                        {f.cashEquivalentsINR != null ? fmt(f.cashEquivalentsINR) : "—"}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${
                        f.runwayMonths == null ? "text-gray-600" :
                        f.runwayMonths >= 18 ? "text-green-400" :
                        f.runwayMonths >= 9 ? "text-yellow-400" : "text-red-400"
                      }`}>
                        {f.runwayMonths != null ? `${f.runwayMonths} mo` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-400">
                        {deRatio ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="px-6 py-3 text-[10px] text-gray-600 border-t border-white/5">
            D/E Ratio = Total Liabilities ÷ Net Worth (Assets − Liabilities). Runway colour: green ≥18 mo, yellow ≥9 mo, red &lt;9 mo.
          </p>
        </div>
      )}

      {/* ── Update history (compact) ── */}
      {metricUpdates.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-semibold text-white">Update History</h2>
            <p className="text-xs text-gray-500 mt-0.5">Company-reported metric snapshots</p>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {metricUpdates.map((mu) => (
              <div key={mu.id} className="px-6 py-3 flex items-center gap-6 text-sm flex-wrap">
                <span className="text-xs text-gray-600 w-28 shrink-0">
                  {new Date(mu.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                {mu.co2ReductionTonnesPerYear != null && (
                  <span className="text-emerald-400">CO₂: <strong>{Number(mu.co2ReductionTonnesPerYear).toLocaleString()}t/yr</strong></span>
                )}
                {mu.jobsCreated != null && (
                  <span className="text-blue-400">Jobs: <strong>{mu.jobsCreated}</strong></span>
                )}
                {mu.revenue != null && (
                  <span className="text-yellow-400">Rev: <strong>${Number(mu.revenue).toLocaleString()}</strong></span>
                )}
                {mu.notes && <span className="text-gray-500 text-xs">{mu.notes}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function KpiCard({
  label, value, sub, color, icon,
}: { label: string; value: string; sub: string; color: string; icon: string }) {
  const cfg: Record<string, { border: string; bg: string; text: string }> = {
    emerald: { border: "border-emerald-500/15", bg: "from-emerald-500/[0.08] to-transparent", text: "text-emerald-400" },
    blue:    { border: "border-blue-500/15",    bg: "from-blue-500/[0.08] to-transparent",    text: "text-blue-400" },
    sky:     { border: "border-sky-500/15",     bg: "from-sky-500/[0.08] to-transparent",     text: "text-sky-400" },
    purple:  { border: "border-purple-500/15",  bg: "from-purple-500/[0.08] to-transparent",  text: "text-purple-400" },
    gold:    { border: "border-yellow-500/15",  bg: "from-yellow-500/[0.08] to-transparent",  text: "text-yellow-400" },
  };
  const s = cfg[color] ?? cfg.emerald!;
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 ${s.border} ${s.bg}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-600">{label}</p>
        <svg className={`h-4 w-4 opacity-50 ${s.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <p className={`text-2xl font-bold mt-1 ${s.text}`}>{value}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>
    </div>
  );
}

function TrendChart({
  title, unit, color, data, formatY,
}: {
  title: string;
  unit: string;
  color: string;
  data: { date: string; value: number }[];
  formatY?: (v: number) => string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} />
          <YAxis
            tickFormatter={formatY ?? ((v: number) => v.toLocaleString())}
            tick={{ fontSize: 10, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            formatter={(v: number) => [formatY ? formatY(v) : `${v.toLocaleString()} ${unit}`, title]}
            contentStyle={{ backgroundColor: "#0f1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "11px" }}
            labelStyle={{ color: "#9ca3af" }}
            itemStyle={{ color }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color, stroke: "#0f1117", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function RingProgress({ pct, label, color }: { pct: number; label: string; color: string }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative flex flex-col items-center">
      <svg width={128} height={128} className="-rotate-90">
        <circle cx={64} cy={64} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
        <circle
          cx={64} cy={64} r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-bold text-white">{Math.round(pct)}%</p>
        <p className="text-[10px] text-gray-500 text-center">{label}</p>
      </div>
    </div>
  );
}
