"use client";

import { useMemo, useState } from "react";

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface DVNPanelProps {
  startupName: string;
  aiScore: { overallScore: number; growthScore: number; impactScore: number; riskScore: number } | null;
  assessments: {
    id: string;
    verdict: string;
    confidenceScore: number;
    report: string;
    createdAt: string;
    expert: { walletAddress: string; reputationScore: number; domain?: string | null };
  }[];
  analystReports: {
    id: string;
    analystName: string;
    analystEmail: string;
    title: string;
    content: string;
    rating: number;
    publishedAt: string;
    growthScore:  number | null;
    impactScore:  number | null;
    riskScore:    number | null;
    overallScore: number | null;
    pdfUrl:       string | null;
  }[];
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const VERDICT_COLOR: Record<string, { text: string; hex: string; bg: string }> = {
  approved:       { text: "text-emerald-400", hex: "#10B981", bg: "bg-emerald-500/10 border-emerald-500/20" },
  needs_revision: { text: "text-yellow-400",  hex: "#FBBF24", bg: "bg-yellow-500/10 border-yellow-500/20"  },
  rejected:       { text: "text-red-400",     hex: "#EF4444", bg: "bg-red-500/10 border-red-500/20"        },
};

function ratingColor(r: number): { hex: string; text: string } {
  if (r >= 4) return { hex: "#10B981", text: "text-emerald-400" };
  if (r === 3) return { hex: "#60A5FA", text: "text-blue-400"    };
  return                { hex: "#EF4444", text: "text-red-400"    };
}

function shortAddress(addr: string) {
  return `${addr.slice(0, 5)}…${addr.slice(-3)}`;
}

/* ─── Node Network (SVG force-directed) ─────────────────────────────────── */

interface ContribNode {
  id: string;
  label: string;
  type: "expert" | "analyst";
  // Expert fields
  verdict?: string;
  confidence?: number;
  reputationScore?: number;
  // Analyst fields
  rating?: number;
  growthScore:  number | null;
  impactScore:  number | null;
  riskScore:    number | null;
  overallScore: number | null;
}

function getVector(n: ContribNode, fallback: number[]): number[] {
  // Normalise all dimensions to 0-100 "quality" (invert risk)
  if (n.type === "expert") {
    const conf = n.confidence ?? 50;
    return [conf, conf, 100 - conf, conf]; // approximate proxy
  }
  return [
    n.growthScore  ?? fallback[0],
    n.impactScore  ?? fallback[1],
    100 - (n.riskScore  ?? (100 - fallback[2])),
    n.overallScore ?? fallback[3],
  ];
}

function nodeSimilarity(a: ContribNode, b: ContribNode, fallback: number[]): number {
  const va = getVector(a, fallback);
  const vb = getVector(b, fallback);
  let sumSq = 0;
  for (let i = 0; i < 4; i++) sumSq += (va[i] - vb[i]) ** 2;
  return Math.max(0, 100 - Math.sqrt(sumSq / 4));
}

function computeLayout(
  nodes: ContribNode[],
  W: number, H: number,
): { node: ContribNode; x: number; y: number }[] {
  if (nodes.length === 0) return [];
  const cx = W / 2, cy = H / 2;
  const n = nodes.length;

  // Consensus fallback vector (avg of all analyst scores)
  const dims = [0, 0, 0, 0];
  let cnt = 0;
  for (const node of nodes) {
    if (node.type === "analyst" && node.overallScore != null) {
      dims[0] += node.growthScore  ?? 50;
      dims[1] += node.impactScore  ?? 50;
      dims[2] += node.riskScore    ?? 50;
      dims[3] += node.overallScore ?? 50;
      cnt++;
    }
  }
  const fallback = cnt > 0 ? dims.map(d => d / cnt) : [50, 50, 50, 50];

  // Separate experts (inner ring) and analysts (outer ring)
  const experts  = nodes.filter(n => n.type === "expert");
  const analysts = nodes.filter(n => n.type === "analyst");

  const pos: { node: ContribNode; x: number; y: number }[] = [];

  for (let i = 0; i < experts.length; i++) {
    const angle = (i / Math.max(experts.length, 1)) * 2 * Math.PI - Math.PI / 2;
    pos.push({ node: experts[i], x: cx + 88 * Math.cos(angle), y: cy + 88 * Math.sin(angle) });
  }
  for (let i = 0; i < analysts.length; i++) {
    const angle = (i / Math.max(analysts.length, 1)) * 2 * Math.PI - Math.PI / 2;
    pos.push({ node: analysts[i], x: cx + 152 * Math.cos(angle), y: cy + 152 * Math.sin(angle) });
  }

  if (nodes.length < 2) return pos;

  // Spring iterations — cluster similar nodes
  const vx = pos.map(() => 0);
  const vy = pos.map(() => 0);
  const ITERS = 80, REPEL = 600, DAMPING = 0.82;

  for (let iter = 0; iter < ITERS; iter++) {
    for (let i = 0; i < pos.length; i++) {
      let fx = 0, fy = 0;

      for (let j = 0; j < pos.length; j++) {
        if (i === j) continue;
        const dx = pos[i].x - pos[j].x;
        const dy = pos[i].y - pos[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;

        // Repulsion
        fx += (dx / dist) * (REPEL / (dist * dist));
        fy += (dy / dist) * (REPEL / (dist * dist));

        // Attraction based on similarity (only same type)
        if (pos[i].node.type === pos[j].node.type) {
          const sim = nodeSimilarity(pos[i].node, pos[j].node, fallback) / 100;
          fx -= (dx / dist) * sim * dist * 0.004;
          fy -= (dy / dist) * sim * dist * 0.004;
        }
      }

      // Radial constraint — keep on ring
      const targetR = pos[i].node.type === "expert" ? 88 : 152;
      const toCx = cx - pos[i].x, toCy = cy - pos[i].y;
      const currR = Math.sqrt(toCx * toCx + toCy * toCy) + 0.1;
      const radialForce = (currR - targetR) * 0.015;
      fx += (toCx / currR) * radialForce;
      fy += (toCy / currR) * radialForce;

      vx[i] = (vx[i] + fx) * DAMPING;
      vy[i] = (vy[i] + fy) * DAMPING;
    }
    for (let i = 0; i < pos.length; i++) {
      pos[i].x = Math.max(18, Math.min(W - 18, pos[i].x + vx[i]));
      pos[i].y = Math.max(18, Math.min(H - 18, pos[i].y + vy[i]));
    }
  }

  return pos;
}

function DVNGraph({ nodes, companyName, W = 380, H = 360 }: {
  nodes: ContribNode[];
  companyName: string;
  W?: number;
  H?: number;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const cx = W / 2, cy = H / 2;

  const fallback = useMemo(() => {
    const dims = [0, 0, 0, 0]; let cnt = 0;
    for (const n of nodes) {
      if (n.type === "analyst" && n.overallScore != null) {
        dims[0] += n.growthScore ?? 50; dims[1] += n.impactScore ?? 50;
        dims[2] += n.riskScore ?? 50;   dims[3] += n.overallScore ?? 50; cnt++;
      }
    }
    return cnt > 0 ? dims.map(d => d / cnt) : [50, 50, 50, 50];
  }, [nodes]);

  const layout = useMemo(() => computeLayout(nodes, W, H), [nodes, W, H]);

  // Similarity edges between same-type nodes (similarity > 65)
  const edges = useMemo(() => {
    const result: { i: number; j: number; sim: number }[] = [];
    for (let i = 0; i < layout.length; i++) {
      for (let j = i + 1; j < layout.length; j++) {
        const sim = nodeSimilarity(layout[i].node, layout[j].node, fallback);
        if (sim > 65 && layout[i].node.type === layout[j].node.type) {
          result.push({ i, j, sim });
        }
      }
    }
    return result;
  }, [layout, fallback]);

  const hoveredNode = hovered ? layout.find(l => l.node.id === hovered) : null;

  return (
    <div className="relative">
      <svg
        width="100%" viewBox={`0 0 ${W} ${H}`}
        style={{ background: "linear-gradient(135deg,#04091a 0%,#060c1f 100%)" }}
        className="rounded-xl"
      >
        {/* Subtle concentric rings (visual guide) */}
        {[88, 152].map((r) => (
          <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={1} strokeDasharray="3 6" />
        ))}

        {/* Similarity edges */}
        {edges.map(({ i, j, sim }) => (
          <line
            key={`e-${i}-${j}`}
            x1={layout[i].x} y1={layout[i].y} x2={layout[j].x} y2={layout[j].y}
            stroke="#10B981" strokeWidth={(sim - 65) / 35 * 1.5 + 0.4}
            strokeOpacity={(sim - 65) / 35 * 0.35 + 0.08}
          />
        ))}

        {/* Company-to-node radial lines */}
        {layout.map(({ node, x, y }) => {
          const col = node.type === "expert"
            ? (VERDICT_COLOR[node.verdict ?? ""] ?? VERDICT_COLOR.approved).hex
            : ratingColor(node.rating ?? 3).hex;
          return (
            <line
              key={`r-${node.id}`}
              x1={cx} y1={cy} x2={x} y2={y}
              stroke={col} strokeWidth={1} strokeOpacity={0.18} strokeDasharray="4 4"
            />
          );
        })}

        {/* Expert nodes (diamond) */}
        {layout.filter(l => l.node.type === "expert").map(({ node, x, y }) => {
          const vc = VERDICT_COLOR[node.verdict ?? ""] ?? VERDICT_COLOR.approved;
          const s = 10;
          return (
            <g key={node.id} onMouseEnter={() => setHovered(node.id)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
              <polygon
                points={`${x},${y - s} ${x + s},${y} ${x},${y + s} ${x - s},${y}`}
                fill={`${vc.hex}22`} stroke={vc.hex} strokeWidth={1.5}
                style={{ filter: hovered === node.id ? `drop-shadow(0 0 6px ${vc.hex})` : undefined }}
              />
              <text x={x} y={y + s + 10} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.45)">
                {node.label.slice(0, 8)}
              </text>
            </g>
          );
        })}

        {/* Analyst nodes (circle) */}
        {layout.filter(l => l.node.type === "analyst").map(({ node, x, y }) => {
          const rc = ratingColor(node.rating ?? 3);
          const hasScore = node.overallScore != null;
          return (
            <g key={node.id} onMouseEnter={() => setHovered(node.id)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
              <circle
                cx={x} cy={y} r={hasScore ? 11 : 9}
                fill={`${rc.hex}1a`} stroke={rc.hex} strokeWidth={1.5}
                style={{ filter: hovered === node.id ? `drop-shadow(0 0 8px ${rc.hex})` : undefined }}
              />
              {hasScore && node.overallScore != null && (
                <text x={x} y={y + 3.5} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.7)" fontWeight="bold">
                  {node.overallScore}
                </text>
              )}
              <text x={x} y={y + (hasScore ? 11 : 9) + 10} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.45)">
                {node.label.split(" ")[0].slice(0, 8)}
              </text>
            </g>
          );
        })}

        {/* Company center node */}
        <circle cx={cx} cy={cy} r={22} fill="rgba(16,185,129,0.12)" stroke="#10B981" strokeWidth={1.5}
          style={{ filter: "drop-shadow(0 0 10px rgba(16,185,129,0.4))" }} />
        <circle cx={cx} cy={cy} r={22} fill="none" stroke="#10B981" strokeWidth={1}
          className="animate-spin" style={{ animationDuration: "12s", strokeDasharray: "8 20" }} />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={8} fill="#10B981" fontWeight="bold">DVN</text>
        <text x={cx} y={cy + 7} textAnchor="middle" fontSize={6} fill="rgba(255,255,255,0.35)">
          {companyName.slice(0, 10)}
        </text>

        {/* Legend */}
        <g transform={`translate(8, ${H - 44})`}>
          <polygon points="6,0 12,6 6,12 0,6" fill="rgba(251,191,36,0.2)" stroke="#FBBF24" strokeWidth={1} />
          <text x={16} y={9} fontSize={7} fill="rgba(255,255,255,0.35)">DVN Expert</text>
          <circle cx={6} cy={24} r={5} fill="rgba(16,185,129,0.2)" stroke="#10B981" strokeWidth={1} />
          <text x={16} y={28} fontSize={7} fill="rgba(255,255,255,0.35)">Analyst</text>
        </g>
        <text x={W - 8} y={H - 8} textAnchor="end" fontSize={6} fill="rgba(255,255,255,0.15)">
          edge = consensus similarity ≥65%
        </text>
      </svg>

      {/* Hover tooltip */}
      {hoveredNode && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-white/10 bg-[#080f1e]/95 p-3 text-xs shadow-2xl"
          style={{
            left: Math.min(hoveredNode.x / W * 100, 70) + "%",
            top: hoveredNode.y / H * 100 + "%",
            transform: "translate(-50%, -115%)",
            minWidth: 140,
          }}
        >
          <p className="font-semibold text-white mb-1">{hoveredNode.node.label}</p>
          {hoveredNode.node.type === "expert" ? (
            <>
              <p className={`capitalize ${(VERDICT_COLOR[hoveredNode.node.verdict ?? ""] ?? VERDICT_COLOR.approved).text}`}>
                {hoveredNode.node.verdict?.replace(/_/g, " ")}
              </p>
              <p className="text-gray-500">Confidence: {hoveredNode.node.confidence}/100</p>
              <p className="text-gray-500">Rep: {hoveredNode.node.reputationScore?.toFixed(0)}</p>
            </>
          ) : (
            <>
              <p className="text-gray-500">Rating: {"★".repeat(hoveredNode.node.rating ?? 0)}</p>
              {hoveredNode.node.overallScore != null && <p className="text-gray-500">Overall: {hoveredNode.node.overallScore}</p>}
              {hoveredNode.node.growthScore  != null && <p className="text-gray-500">Growth: {hoveredNode.node.growthScore}</p>}
              {hoveredNode.node.impactScore  != null && <p className="text-gray-500">Impact: {hoveredNode.node.impactScore}</p>}
              {hoveredNode.node.riskScore    != null && <p className="text-gray-500">Risk: {hoveredNode.node.riskScore}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Consensus Section ──────────────────────────────────────────────────── */

function ScoreComparisonBar({ label, ai, analyst, color }: {
  label: string; ai: number | null; analyst: number | null; color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <div className="flex gap-3 text-[10px]">
          {ai != null && <span className="text-blue-400">AI {ai}</span>}
          {analyst != null && <span className="text-purple-400">Analyst {analyst}</span>}
        </div>
      </div>
      <div className="relative h-2 rounded-full bg-white/5">
        {ai != null && (
          <div className="absolute h-2 rounded-full opacity-40" style={{ width: `${ai}%`, background: "#60A5FA" }} />
        )}
        {analyst != null && (
          <div
            className="absolute h-2 rounded-full"
            style={{ width: `${analyst}%`, background: color, boxShadow: `0 0 6px ${color}80` }}
          />
        )}
      </div>
      {ai != null && analyst != null && (
        <p className="text-[9px] text-gray-700">
          Δ {Math.abs(analyst - ai)} pts · {Math.abs(analyst - ai) <= 10 ? "Strong consensus" : Math.abs(analyst - ai) <= 25 ? "Moderate consensus" : "Divergent view"}
        </p>
      )}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export function DVNPanel({ startupName, aiScore, assessments, analystReports }: DVNPanelProps) {
  const [reportTab, setReportTab] = useState<"assessments" | "reports">("assessments");

  // Build contributor nodes for the graph
  const nodes: ContribNode[] = useMemo(() => [
    ...assessments.map((a) => ({
      id: a.id,
      label: shortAddress(a.expert.walletAddress),
      type: "expert" as const,
      verdict: a.verdict,
      confidence: a.confidenceScore,
      reputationScore: a.expert.reputationScore,
      growthScore:  null,
      impactScore:  null,
      riskScore:    null,
      overallScore: null,
    })),
    ...analystReports.map((r) => ({
      id: r.id,
      label: r.analystName,
      type: "analyst" as const,
      rating: r.rating,
      growthScore:  r.growthScore,
      impactScore:  r.impactScore,
      riskScore:    r.riskScore,
      overallScore: r.overallScore,
    })),
  ], [assessments, analystReports]);

  // Analyst score averages (only those who submitted scores)
  const scoredReports = analystReports.filter((r) => r.overallScore != null);
  const avg = (field: "growthScore" | "impactScore" | "riskScore" | "overallScore") => {
    const vals = scoredReports.map((r) => r[field]).filter((v): v is number => v != null);
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };
  const avgOverall = avg("overallScore");
  const avgGrowth  = avg("growthScore");
  const avgImpact  = avg("impactScore");
  const avgRisk    = avg("riskScore");

  // DVN verdict tally
  const verdictCounts = assessments.reduce<Record<string, number>>((acc, a) => {
    acc[a.verdict] = (acc[a.verdict] ?? 0) + 1; return acc;
  }, {});
  const majorVerdict = Object.entries(verdictCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const avgConf = assessments.length > 0
    ? Math.round(assessments.reduce((s, a) => s + a.confidenceScore, 0) / assessments.length)
    : null;

  const totalContribs = assessments.length + analystReports.length;

  return (
    <div className="space-y-5">

      {/* ── Intel Header ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(145deg,#050d1a 0%,#08142b 50%,#060f1e 100%)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L10.5 5.5H15L11.5 8.5L13 13L8 10L3 13L4.5 8.5L1 5.5H5.5L8 1Z" stroke="#A855F7" strokeWidth="1.2" fill="rgba(168,85,247,0.15)" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">DVN Intelligence</h2>
              <p className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>
                Decentralized Verification Network
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {assessments.length > 0 && (
              <span className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.18)", color: "#A855F7" }}>
                {assessments.length} expert assessment{assessments.length !== 1 ? "s" : ""}
              </span>
            )}
            {analystReports.length > 0 && (
              <span className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.18)", color: "#60A5FA" }}>
                {analystReports.length} analyst report{analystReports.length !== 1 ? "s" : ""}
              </span>
            )}
            {majorVerdict && (
              <span className={`rounded-lg px-3 py-1.5 text-xs font-semibold border ${(VERDICT_COLOR[majorVerdict] ?? VERDICT_COLOR.approved).bg} ${(VERDICT_COLOR[majorVerdict] ?? VERDICT_COLOR.approved).text}`}>
                Majority: {majorVerdict.replace(/_/g, " ")}
              </span>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 divide-x" style={{ divideColor: "rgba(255,255,255,0.05)" }}>
          {[
            { label: "Contributors", value: totalContribs > 0 ? totalContribs : "—" },
            { label: "Avg. Confidence", value: avgConf != null ? `${avgConf}/100` : "—" },
            { label: "Scored Reports", value: scoredReports.length > 0 ? `${scoredReports.length}/${analystReports.length}` : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="px-5 py-3 text-center" style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{label}</p>
              <p className="text-base font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {totalContribs === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] py-16 text-center">
          <p className="text-gray-500 text-sm">No DVN assessments or analyst reports submitted yet.</p>
          <p className="text-gray-600 text-xs mt-1">DVN experts and analysts can contribute via their dashboards.</p>
        </div>
      ) : (
        <>
          {/* ── Main body: graph + consensus ── */}
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">

            {/* Node Network */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "linear-gradient(145deg,#050d1a,#060f1e)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <p className="text-sm font-semibold text-white">Analyst Node Network</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                    Force-directed · Similar assessments cluster together · Edge = ≥65% score similarity
                  </p>
                </div>
              </div>
              <div className="p-4">
                <DVNGraph nodes={nodes} companyName={startupName} />
              </div>
              <div className="px-5 py-3 flex flex-wrap gap-4 text-[10px]" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)" }}>
                <span>◆ DVN Expert (inner ring)</span>
                <span>● Analyst Reporter (outer ring)</span>
                <span>— Dashed = company link</span>
                <span>— Solid = score similarity</span>
              </div>
            </div>

            {/* Consensus vs AI */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "linear-gradient(145deg,#050d1a,#060f1e)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-sm font-semibold text-white">Score Consensus</p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Analyst average vs AI on the same 0–100 dimensions
                </p>
              </div>
              <div className="p-5 space-y-4">
                {(avgOverall == null && aiScore == null) ? (
                  <p className="text-xs text-gray-600">No scored reports yet. Analysts can include scores when submitting reports.</p>
                ) : (
                  <>
                    <ScoreComparisonBar label="Overall" ai={aiScore?.overallScore ?? null} analyst={avgOverall} color="#A855F7" />
                    <ScoreComparisonBar label="Growth"  ai={aiScore?.growthScore  ?? null} analyst={avgGrowth}  color="#60A5FA" />
                    <ScoreComparisonBar label="Impact"  ai={aiScore?.impactScore  ?? null} analyst={avgImpact}  color="#10B981" />
                    <ScoreComparisonBar label="Risk"    ai={aiScore?.riskScore    ?? null} analyst={avgRisk}    color="#F97316" />

                    {scoredReports.length > 0 && aiScore && avgOverall != null && (
                      <div
                        className="rounded-lg px-4 py-3 mt-2"
                        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}
                      >
                        <p className="text-[10px] text-gray-500 mb-0.5">Analyst–AI Agreement</p>
                        <p className={`text-sm font-bold ${Math.abs(avgOverall - aiScore.overallScore) <= 10 ? "text-emerald-400" : Math.abs(avgOverall - aiScore.overallScore) <= 25 ? "text-yellow-400" : "text-orange-400"}`}>
                          {Math.abs(avgOverall - aiScore.overallScore) <= 10
                            ? "High consensus"
                            : Math.abs(avgOverall - aiScore.overallScore) <= 25
                              ? "Moderate consensus"
                              : "Analysts diverge from AI"}
                        </p>
                        <p className="text-[10px] text-gray-600 mt-0.5">Based on {scoredReports.length} scored report{scoredReports.length !== 1 ? "s" : ""}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Assessment + Report cards ── */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "linear-gradient(145deg,#050d1a,#060f1e)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {/* Tab bar */}
            <div className="px-5 py-3 flex gap-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {[
                { key: "assessments" as const, label: `DVN Assessments (${assessments.length})` },
                { key: "reports"     as const, label: `Analyst Reports (${analystReports.length})` },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setReportTab(key)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-medium transition ${
                    reportTab === key
                      ? "bg-white/10 text-white"
                      : "text-gray-600 hover:text-gray-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              {reportTab === "assessments" && (
                assessments.length === 0
                  ? <p className="text-sm text-gray-600">No formal DVN assessments submitted yet.</p>
                  : assessments.map((a) => {
                      const vc = VERDICT_COLOR[a.verdict] ?? VERDICT_COLOR.approved;
                      return (
                        <div key={a.id} className="rounded-xl p-4 space-y-2" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.05)`, borderLeft: `3px solid ${vc.hex}` }}>
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${vc.bg} ${vc.text}`}>
                                  {a.verdict.replace(/_/g, " ")}
                                </span>
                                {a.expert.domain && (
                                  <span className="text-[10px] text-gray-600 rounded px-1.5 py-0.5 border border-white/5 bg-white/[0.02]">
                                    {a.expert.domain.replace(/_/g, " ")}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 font-mono">{shortAddress(a.expert.walletAddress)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-gray-600">Confidence</p>
                              <p className={`text-sm font-bold ${vc.text}`}>{a.confidenceScore}/100</p>
                            </div>
                          </div>
                          {a.report && (
                            <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{a.report}</p>
                          )}
                          <div className="flex items-center justify-between text-[10px] text-gray-600 pt-1">
                            <span>Rep score: {a.expert.reputationScore?.toFixed(1)}</span>
                            <span>{new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                          </div>
                        </div>
                      );
                    })
              )}

              {reportTab === "reports" && (
                analystReports.length === 0
                  ? <p className="text-sm text-gray-600">No analyst reports published yet.</p>
                  : analystReports.map((r) => {
                      const rc = ratingColor(r.rating);
                      const hasScores = r.overallScore != null || r.growthScore != null;
                      return (
                        <div key={r.id} className="rounded-xl p-5 space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                          {/* Header */}
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white text-sm leading-snug">{r.title}</h3>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                By <span className="text-gray-300">{r.analystName}</span> ·{" "}
                                {new Date(r.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-sm ${rc.text}`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                              {r.pdfUrl && (
                                <a
                                  href={r.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-semibold transition hover:opacity-80"
                                  style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", color: "#A855F7" }}
                                >
                                  <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                                    <path d="M1 1h5l3 3v7H1V1z" stroke="currentColor" strokeWidth="1.2" fill="none" />
                                    <path d="M6 1v3h3" stroke="currentColor" strokeWidth="1.2" />
                                    <path d="M3 7h4M3 9h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                                  </svg>
                                  PDF Report
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Score comparison bars */}
                          {hasScores && (
                            <div className="grid grid-cols-2 gap-x-5 gap-y-2 rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                              {[
                                { label: "Overall", val: r.overallScore, ai: aiScore?.overallScore ?? null, col: "#A855F7" },
                                { label: "Growth",  val: r.growthScore,  ai: aiScore?.growthScore  ?? null, col: "#60A5FA" },
                                { label: "Impact",  val: r.impactScore,  ai: aiScore?.impactScore  ?? null, col: "#10B981" },
                                { label: "Risk",    val: r.riskScore,    ai: aiScore?.riskScore    ?? null, col: "#F97316" },
                              ].filter(d => d.val != null || d.ai != null).map(({ label, val, ai, col }) => (
                                <div key={label}>
                                  <div className="flex justify-between text-[9px] mb-0.5">
                                    <span style={{ color: "rgba(255,255,255,0.3)" }}>{label}</span>
                                    <span style={{ color: col }}>{val ?? "—"} {ai != null && val != null && `(AI ${ai})`}</span>
                                  </div>
                                  <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                                    {val != null && (
                                      <div className="h-1 rounded-full" style={{ width: `${val}%`, background: col, boxShadow: `0 0 4px ${col}60` }} />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Content preview */}
                          <p className="text-xs text-gray-400 leading-relaxed line-clamp-4">{r.content}</p>
                        </div>
                      );
                    })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
