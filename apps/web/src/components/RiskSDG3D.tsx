"use client";

import { useRef, useCallback, CSSProperties } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";

/* ─── Types ─────────────────────────────────────────────────────────────── */

type RiskLevel = "low" | "moderate" | "high" | "critical";

export interface RiskSDG3DProps {
  stage: string;
  category: string;
  aiScore: { riskScore: number; impactScore: number } | null;
  aiAnalysis: { marketAdoptionScore: number; financialSustainabilityScore: number; technologyScore: number } | null;
  assessments: { verdict: string; confidenceScore: number }[];
  milestones: { status: string }[];
  latestFinancials: { runwayMonths: number | null } | null;
  sdgGoals: number[];
  co2ReductionTonnesPerYear: number;
  jobsCreated: number;
  waterSavedLitresPerYear: number | null;
  biodiversityScore: number | null;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function rlevel(score: number): RiskLevel {
  if (score <= 30) return "low";
  if (score <= 55) return "moderate";
  if (score <= 75) return "high";
  return "critical";
}

const NEON: Record<RiskLevel, { hex: string; text: string; glow: string }> = {
  low:      { hex: "#10B981", text: "text-emerald-400", glow: "rgba(16,185,129,0.5)"  },
  moderate: { hex: "#FBBF24", text: "text-yellow-400",  glow: "rgba(251,191,36,0.5)"  },
  high:     { hex: "#F97316", text: "text-orange-400",  glow: "rgba(249,115,22,0.5)"  },
  critical: { hex: "#EF4444", text: "text-red-400",     glow: "rgba(239,68,68,0.5)"   },
};

/* ─── Risk Calculation ───────────────────────────────────────────────────── */

function calcRisks(p: RiskSDG3DProps) {
  const { stage, category, aiScore, aiAnalysis, assessments, milestones, latestFinancials } = p;

  const marketRisk = clamp(
    (aiAnalysis ? 100 - aiAnalysis.marketAdoptionScore : 50) +
    ({ pre_seed: 12, seed: 8, series_a: 3, series_b: -3, growth: -8 }[stage] ?? 0),
    5, 95,
  );

  const catTechAdj: Record<string, number> = {
    green_hydrogen: 15, ocean_tech: 12, carbon_capture: 8, energy_storage: 5,
    solar: -8, wind: -8, ev_mobility: -3, sustainable_agriculture: 0, waste_tech: 0, biodiversity: 5, diverse: 0,
  };
  const techRisk = clamp((aiAnalysis ? 100 - aiAnalysis.technologyScore : 50) + (catTechAdj[category] ?? 0), 5, 95);

  const runway = latestFinancials?.runwayMonths ?? null;
  const runwayAdj = runway == null ? 0 : runway < 6 ? 25 : runway < 12 ? 15 : runway < 18 ? 5 : -10;
  const finRisk = clamp(
    (aiAnalysis ? 100 - aiAnalysis.financialSustainabilityScore : 55) +
    runwayAdj +
    ({ pre_seed: 10, seed: 5, series_a: 0, series_b: -5, growth: -10 }[stage] ?? 0),
    5, 95,
  );

  const REG_BASE: Record<string, number> = {
    carbon_capture: 72, green_hydrogen: 68, ocean_tech: 62, ev_mobility: 52,
    energy_storage: 48, sustainable_agriculture: 48, waste_tech: 45, biodiversity: 42,
    solar: 35, wind: 35, diverse: 50,
  };
  const regRisk = clamp(
    (REG_BASE[category] ?? 50) + ({ pre_seed: 10, seed: 5, series_a: 0, series_b: -3, growth: -5 }[stage] ?? 0),
    5, 95,
  );

  const total = milestones.length;
  let execRisk: number;
  if (total === 0) {
    execRisk = aiScore ? clamp(aiScore.riskScore, 5, 95) : 50;
  } else {
    const done = milestones.filter((m) => m.status === "completed").length;
    const wip  = milestones.filter((m) => m.status === "in_progress").length;
    const rate = (done + 0.5 * wip) / total;
    const mScore = rate >= 0.75 ? 15 : rate >= 0.5 ? 30 : rate >= 0.25 ? 50 : 65;
    execRisk = clamp(aiScore ? Math.round(0.5 * mScore + 0.5 * aiScore.riskScore) : mScore, 5, 95);
  }

  let dvnRisk: number;
  if (assessments.length === 0) {
    dvnRisk = 55;
  } else {
    const vm: Record<string, number> = { approved: 5, needs_revision: 55, rejected: 90 };
    let sw = 0, ss = 0;
    for (const a of assessments) { const w = a.confidenceScore / 100; ss += (vm[a.verdict] ?? 55) * w; sw += w; }
    dvnRisk = clamp(Math.round(sw > 0 ? ss / sw : 55), 5, 95);
  }

  const composite = clamp(
    Math.round(marketRisk * 0.20 + techRisk * 0.18 + finRisk * 0.25 + regRisk * 0.15 + execRisk * 0.15 + dvnRisk * 0.07),
    5, 95,
  );

  return { marketRisk, techRisk, finRisk, regRisk, execRisk, dvnRisk, composite, runway };
}

/* ─── SDG Data ───────────────────────────────────────────────────────────── */

const CATEGORY_SDG_MAP: Record<string, number[]> = {
  solar:                   [7, 13, 11, 9],
  wind:                    [7, 13, 9],
  ocean_tech:              [14, 7, 13, 9],
  carbon_capture:          [13, 9, 12, 11],
  green_hydrogen:          [7, 13, 9, 11],
  sustainable_agriculture: [2, 12, 13, 15, 8],
  ev_mobility:             [11, 13, 9, 7],
  energy_storage:          [7, 13, 9],
  waste_tech:              [12, 11, 13, 3],
  biodiversity:            [15, 14, 13, 6],
  diverse:                 [13, 7, 9, 11],
};

const SDG_META: Record<number, { name: string; hex: string }> = {
  1:  { name: "No Poverty",              hex: "#F87171" },
  2:  { name: "Zero Hunger",             hex: "#F59E0B" },
  3:  { name: "Good Health",             hex: "#22C55E" },
  4:  { name: "Quality Education",       hex: "#EF4444" },
  5:  { name: "Gender Equality",         hex: "#FB923C" },
  6:  { name: "Clean Water",             hex: "#38BDF8" },
  7:  { name: "Affordable Energy",       hex: "#FACC15" },
  8:  { name: "Decent Work",             hex: "#F472B6" },
  9:  { name: "Industry & Innovation",   hex: "#FB923C" },
  10: { name: "Reduced Inequalities",    hex: "#EC4899" },
  11: { name: "Sustainable Cities",      hex: "#FBBF24" },
  12: { name: "Responsible Consumption", hex: "#EAB308" },
  13: { name: "Climate Action",          hex: "#34D399" },
  14: { name: "Life Below Water",        hex: "#60A5FA" },
  15: { name: "Life on Land",            hex: "#A3E635" },
  16: { name: "Peace & Justice",         hex: "#3B82F6" },
  17: { name: "Partnerships",            hex: "#818CF8" },
};

function calcSDGScore(sdg: number, p: RiskSDG3DProps): number {
  const base = p.aiScore?.impactScore ?? 50;
  let s = base;
  const { co2ReductionTonnesPerYear: co2, jobsCreated, waterSavedLitresPerYear: water, biodiversityScore, category, aiAnalysis } = p;
  switch (sdg) {
    case 6:  if (water)         s = clamp(base + (water > 1_000_000 ? 25 : water > 100_000 ? 15 : water > 10_000 ? 8 : 3), 0, 100); break;
    case 7:  if (["solar","wind","green_hydrogen","energy_storage"].includes(category)) s = clamp(base + 22, 0, 100); break;
    case 8:  s = clamp(base + (jobsCreated > 500 ? 25 : jobsCreated > 200 ? 18 : jobsCreated > 100 ? 12 : jobsCreated > 50 ? 8 : jobsCreated > 10 ? 4 : -8), 0, 100); break;
    case 9:  if (aiAnalysis)    s = clamp(Math.round((base + aiAnalysis.technologyScore) / 2), 0, 100); break;
    case 11: if (["ev_mobility","waste_tech","solar"].includes(category)) s = clamp(base + 18, 0, 100); break;
    case 12: if (["waste_tech","sustainable_agriculture","carbon_capture"].includes(category)) s = clamp(base + 18, 0, 100); break;
    case 13: s = clamp(base + (co2 > 100_000 ? 30 : co2 > 10_000 ? 22 : co2 > 1_000 ? 14 : co2 > 100 ? 7 : -5), 0, 100); break;
    case 14: if (category === "ocean_tech") s = clamp(base + 25, 0, 100); break;
    case 15: if (biodiversityScore != null) s = clamp(base + (biodiversityScore > 7 ? 25 : biodiversityScore > 4 ? 15 : 8), 0, 100); break;
  }
  return Math.round(s);
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function RingGauge({ score, size = 52 }: { score: number; size?: number }) {
  const lv = rlevel(score);
  const c  = NEON[lv];
  const r  = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={5} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c.hex}
          strokeWidth={5} strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 5px ${c.hex})`, transition: "stroke-dashoffset 1.2s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-[10px] font-bold ${c.text}`}>{score}</span>
      </div>
    </div>
  );
}

function RiskOrb({ score, level }: { score: number; level: RiskLevel }) {
  const c    = NEON[level];
  const size = 152;
  const r    = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Spinning conic halo */}
      <div
        className="absolute inset-0 rounded-full animate-spin"
        style={{ background: `conic-gradient(from 0deg, transparent 55%, ${c.hex}30 75%, ${c.hex}70 100%)`, animationDuration: "7s" }}
      />
      {/* Pulsing outer glow */}
      <div
        className="absolute rounded-full animate-pulse"
        style={{ inset: -8, borderRadius: "50%", background: `radial-gradient(circle, ${c.hex}12, transparent 70%)` }}
      />
      {/* SVG arc */}
      <svg width={size} height={size} className="absolute inset-0" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={11} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c.hex} strokeWidth={11}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 10px ${c.hex}) drop-shadow(0 0 20px ${c.hex}50)` }}
        />
      </svg>
      {/* Inner orb glass sphere */}
      <div
        className="absolute rounded-full"
        style={{
          width: size - 32, height: size - 32,
          background: `radial-gradient(circle at 32% 28%, ${c.hex}25, ${c.hex}05 60%, transparent)`,
          border: `1px solid ${c.hex}25`,
          boxShadow: `inset 0 1px 0 ${c.hex}20, inset 0 0 24px ${c.hex}10, 0 0 32px ${c.hex}15`,
        }}
      />
      {/* Score text */}
      <div className="relative z-10 text-center select-none">
        <p className={`text-3xl font-black ${c.text}`} style={{ textShadow: `0 0 24px ${c.hex}` }}>{score}</p>
        <p className={`text-[9px] font-bold uppercase tracking-[0.18em] mt-0.5`} style={{ color: `${c.hex}99` }}>
          {level} risk
        </p>
      </div>
    </div>
  );
}

function TiltCard({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(700px) rotateX(${-y * 12}deg) rotateY(${x * 12}deg) scale(1.04) translateZ(4px)`;
  }, []);
  const onLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = "perspective(700px) rotateX(0deg) rotateY(0deg) scale(1) translateZ(0)";
  }, []);
  return (
    <div
      ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      className={className} style={{ ...style, transition: "transform 0.18s ease", transformStyle: "preserve-3d", willChange: "transform" }}
    >
      {children}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export function RiskSDG3D(props: RiskSDG3DProps) {
  const { marketRisk, techRisk, finRisk, regRisk, execRisk, dvnRisk, composite, runway } = calcRisks(props);
  const level = rlevel(composite);
  const oc    = NEON[level];

  const declared = props.sdgGoals.filter((n) => n >= 1 && n <= 17);
  const inferred = declared.length === 0;
  const sdgs     = (inferred ? (CATEGORY_SDG_MAP[props.category] ?? [13, 9]) : declared).sort((a, b) => a - b);

  const radarData = [
    { axis: "Market",     score: marketRisk },
    { axis: "Financial",  score: finRisk    },
    { axis: "Technology", score: techRisk   },
    { axis: "Regulatory", score: regRisk    },
    { axis: "Execution",  score: execRisk   },
    { axis: "DVN",        score: dvnRisk    },
  ];

  const subRisks = [
    { label: "Market Risk",     score: marketRisk, note: `${props.stage.replace(/_/g," ")} stage` },
    { label: "Technology Risk", score: techRisk,   note: props.category.replace(/_/g," ") },
    { label: "Financial Risk",  score: finRisk,    note: runway != null ? `${runway} mo runway` : "No filing data" },
    { label: "Regulatory",      score: regRisk,    note: "Sector policy exposure" },
    { label: "Execution",       score: execRisk,   note: `${props.milestones.filter(m=>m.status==="completed").length}/${props.milestones.length} milestones done` },
    { label: "DVN Experts",     score: dvnRisk,    note: `${props.assessments.length} stake-weighted verdict${props.assessments.length!==1?"s":""}` },
  ];

  const BG = "linear-gradient(145deg,#050d1a 0%,#08142b 50%,#060f1e 100%)";

  return (
    <div className="space-y-4">

      {/* ── Risk Intelligence ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: BG, border: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${oc.hex}12`, border: `1px solid ${oc.hex}25` }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <polygon points="8,1 15,4.5 15,11.5 8,15 1,11.5 1,4.5" stroke={oc.hex} strokeWidth="1.2" fill={`${oc.hex}20`} />
                <circle cx="8" cy="8" r="2.5" fill={oc.hex} fillOpacity="0.6" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Risk Intelligence</h2>
              <p className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>AI · DVN · Financial composite</p>
            </div>
          </div>
          <div className="rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ background: `${oc.hex}12`, border: `1px solid ${oc.hex}22`, color: oc.hex }}>
            {level} risk · {composite}/100
          </div>
        </div>

        {/* Body */}
        <div className="p-5 grid gap-6 md:grid-cols-[168px_1fr]">

          {/* Left: Orb + Radar */}
          <div className="flex flex-col items-center gap-5">
            <div className="flex flex-col items-center gap-1.5">
              <RiskOrb score={composite} level={level} />
              <p className="text-[9px] uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.2)" }}>Composite Score</p>
            </div>
            <div style={{ width: 168, height: 172 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 8, fill: "rgba(255,255,255,0.3)" }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#080f1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
                    formatter={(v: number) => [`${v}/100`, "Risk"]}
                  />
                  <Radar
                    dataKey="score" stroke={oc.hex} fill={oc.hex} fillOpacity={0.10} strokeWidth={1.5}
                    style={{ filter: `drop-shadow(0 0 5px ${oc.hex}80)` }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: Sub-risk gauges */}
          <div className="space-y-2.5">
            {subRisks.map((r) => {
              const lv = rlevel(r.score);
              const rc = NEON[lv];
              return (
                <div
                  key={r.label}
                  className="flex items-center gap-3 rounded-xl px-3.5 py-2.5"
                  style={{ background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.045)" }}
                >
                  <RingGauge score={r.score} size={48} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-xs font-semibold text-gray-200">{r.label}</p>
                      <span className="text-[9px] font-bold uppercase rounded px-1.5 py-0.5" style={{ background: `${rc.hex}12`, color: rc.hex }}>{lv}</span>
                    </div>
                    <p className="text-[10px] mb-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>{r.note}</p>
                    <div className="h-px rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div
                        className="h-px rounded-full"
                        style={{ width: `${r.score}%`, background: rc.hex, boxShadow: `0 0 6px ${rc.hex}80`, transition: "width 1.1s ease" }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            <p className="text-[9px] pt-1" style={{ color: "rgba(255,255,255,0.18)" }}>
              Weights: Fin 25% · Market 20% · Tech 18% · Reg 15% · Exec 15% · DVN 7%
            </p>
          </div>
        </div>
      </div>

      {/* ── SDG Impact ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: BG, border: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="#34D399" strokeWidth="1.2" fill="rgba(52,211,153,0.12)" />
                <path d="M5 8l2 2 4-4" stroke="#34D399" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">SDG Impact Alignment</h2>
              <p className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>UN Sustainable Development Goals</p>
            </div>
          </div>
          <span
            className="rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={inferred
              ? { background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.18)", color: "#FBBF24" }
              : { background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.18)", color: "#34D399" }
            }
          >
            {inferred ? `Inferred · ${props.category.replace(/_/g," ")}` : `${sdgs.length} goal${sdgs.length!==1?"s":""} declared`}
          </span>
        </div>

        {inferred && (
          <div className="mx-5 mt-4 rounded-lg px-4 py-2.5" style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.1)" }}>
            <p className="text-xs" style={{ color: "rgba(251,191,36,0.65)" }}>
              Company has not declared SDG alignment — goals shown are inferred from their sector: <strong>{props.category.replace(/_/g," ")}</strong>
            </p>
          </div>
        )}

        <div className="p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sdgs.map((n) => {
              const meta = SDG_META[n];
              if (!meta) return null;
              const score = calcSDGScore(n, props);
              const scoreColor = score >= 70 ? "#34D399" : score >= 50 ? "#FBBF24" : "#6B7280";
              const label = inferred ? "Inferred" : score >= 75 ? "Strong" : score >= 55 ? "Moderate" : score >= 35 ? "Reported" : "Marginal";
              return (
                <TiltCard
                  key={n}
                  className="rounded-xl p-4 cursor-default"
                  style={{
                    background: `linear-gradient(135deg, ${meta.hex}08, transparent 80%)`,
                    border: `1px solid ${meta.hex}18`,
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="flex items-start justify-between mb-2.5">
                    <span
                      className="text-[9px] font-black uppercase tracking-[0.14em] rounded px-1.5 py-0.5"
                      style={{ background: `${meta.hex}15`, color: meta.hex, border: `1px solid ${meta.hex}25` }}
                    >
                      SDG {n}
                    </span>
                    <span className="text-xs font-mono font-bold" style={{ color: scoreColor, textShadow: score >= 70 ? `0 0 8px ${scoreColor}70` : "none" }}>
                      {score}
                    </span>
                  </div>
                  <p className="text-sm font-semibold leading-tight mb-3" style={{ color: meta.hex }}>{meta.name}</p>
                  <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div
                      className="h-1 rounded-full"
                      style={{
                        width: `${score}%`,
                        background: `linear-gradient(90deg, ${meta.hex}70, ${meta.hex})`,
                        boxShadow: `0 0 8px ${meta.hex}50`,
                        transition: "width 1.3s ease",
                      }}
                    />
                  </div>
                  <p className="text-[9px] mt-2 font-semibold uppercase tracking-wider" style={{ color: `${meta.hex}55` }}>{label}</p>
                </TiltCard>
              );
            })}
          </div>
          <p className="text-[9px] mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.18)" }}>
            {inferred
              ? "Goals inferred from sector — declare official alignment in your company profile for verified scores."
              : "Scores derived from AI impact analysis, CO₂ reduction, jobs, water savings, biodiversity data, and sector affinity. Scale: 0–100."}
          </p>
        </div>
      </div>
    </div>
  );
}
