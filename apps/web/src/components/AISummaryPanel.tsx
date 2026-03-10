"use client";

import { useEffect, useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";

interface AIAnalysis {
  webSummary: string;
  marketAdoptionScore: number;
  financialSustainabilityScore: number;
  technologyScore: number;
  consistencyScore: number;
  potentialScore: number;
  analyzedAt: string;
}

const METRICS = [
  { key: "marketAdoptionScore"          as keyof AIAnalysis, label: "Market Adoption" },
  { key: "financialSustainabilityScore" as keyof AIAnalysis, label: "Financial" },
  { key: "technologyScore"              as keyof AIAnalysis, label: "Technology" },
  { key: "consistencyScore"             as keyof AIAnalysis, label: "Consistency" },
  { key: "potentialScore"               as keyof AIAnalysis, label: "Potential" },
];

const BAR_COLORS = [
  "#3b82f6",
  "#10b981",
  "#a855f7",
  "#eab308",
  "#22c55e",
];

function scoreColor(score: number) {
  if (score >= 75) return "text-green-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-white">{d.label}</p>
      <p className={`font-mono font-bold ${scoreColor(d.score)}`}>{d.score}/100</p>
    </div>
  );
}

export function AISummaryPanel({ startupId, cached }: { startupId: string; cached: AIAnalysis | null }) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(cached);
  const [loading, setLoading]   = useState(!cached);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startupId }),
        });
        if (cancelled) return;
        if (!res.ok) throw new Error(await res.text());
        setAnalysis(await res.json());
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [startupId, cached]);

  const composite = analysis
    ? Math.round((analysis.marketAdoptionScore + analysis.financialSustainabilityScore + analysis.technologyScore + analysis.consistencyScore + analysis.potentialScore) / 5)
    : null;

  const radarData = analysis
    ? METRICS.map((m) => ({ label: m.label, score: analysis[m.key] as number, fullMark: 100 }))
    : [];

  return (
    <section className="rounded-2xl border border-green-500/15 bg-white/[0.02] p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/10">
          <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">AI Summary</h2>
          <p className="text-xs text-gray-500">Web-researched · Powered by Gemini</p>
        </div>
        {analysis && (
          <span className="ml-auto text-[10px] text-gray-600">
            Updated {new Date(analysis.analyzedAt).toLocaleDateString("en-IN")}
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
            <div>
              <p className="text-sm text-white">Researching company…</p>
              <p className="text-xs text-gray-500">Gemini is searching the web. Takes ~15 seconds.</p>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2 items-end h-36">
            {METRICS.map((m, i) => (
              <div key={m.key} className="flex flex-col items-center gap-1">
                <div className="w-full animate-pulse rounded-t-md bg-white/10" style={{ height: `${40 + i * 12}%` }} />
                <span className="text-[9px] text-gray-700 text-center leading-tight">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          Analysis unavailable: {error}
        </div>
      )}

      {/* Results */}
      {analysis && !loading && (
        <div className="space-y-6">
          {/* Web summary */}
          <p className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm leading-relaxed text-gray-300">
            {analysis.webSummary}
          </p>

          {/* Charts: bar + radar side by side on md+ */}
          <div className="grid gap-6 md:grid-cols-2">

            {/* Vertical bar chart */}
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Score Breakdown</p>
              <div className="flex gap-2">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between shrink-0 h-36 pb-0">
                  {[100, 75, 50, 25, 0].map((v) => (
                    <span key={v} className="text-[9px] text-gray-600 font-mono leading-none">{v}</span>
                  ))}
                </div>
                {/* Chart area */}
                <div className="flex-1">
                  {/* Bar area */}
                  <div className="relative h-36 flex items-end gap-2">
                    {/* Gridlines */}
                    {[25, 50, 75, 100].map((v) => (
                      <div
                        key={v}
                        className="pointer-events-none absolute left-0 right-0 border-t border-white/10"
                        style={{ bottom: `${v}%` }}
                      />
                    ))}
                    {METRICS.map((m, i) => {
                      const score = analysis[m.key] as number;
                      const color = BAR_COLORS[i] ?? "#22c55e";
                      return (
                        <div key={m.key} className="relative flex-1 h-full group">
                          <span className={`absolute top-0 left-1/2 -translate-x-1/2 text-[10px] font-mono font-semibold opacity-0 group-hover:opacity-100 transition-opacity ${scoreColor(score)}`}>
                            {score}
                          </span>
                          <div
                            className="absolute bottom-0 w-full rounded-t-md transition-all duration-700"
                            style={{ height: `${score}%`, backgroundColor: color }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {/* Labels */}
                  <div className="flex gap-2 mt-1">
                    {METRICS.map((m) => (
                      <span key={m.key} className="flex-1 text-[9px] text-gray-500 text-center leading-tight">{m.label}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Radar chart */}
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Radar View</p>
              <ResponsiveContainer width="100%" height={176}>
                <RadarChart data={radarData} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.07)" />
                  <PolarAngleAxis
                    dataKey="label"
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Radar
                    dataKey="score"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.15}
                    strokeWidth={1.5}
                    dot={{ r: 3, fill: "#22c55e" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Composite score */}
          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-5 py-3">
            <span className="text-sm font-medium text-gray-400">Composite AI Score</span>
            <span className={`font-mono text-2xl font-bold ${scoreColor(composite!)}`}>
              {composite}
              <span className="text-sm text-gray-600 font-normal">/100</span>
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
