"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUser, type AuthUser } from "@/lib/auth";

interface AIScore {
  overallScore: number;
  growthScore: number;
  impactScore: number;
  riskScore: number;
}

interface Startup {
  id: string;
  name: string;
  category: string;
  stage: string;
  verificationStatus: string;
  co2ReductionTonnesPerYear: string;
  jobsCreated: number;
  totalFundedUSD: string;
  riskPool: { name: string; tier: string } | null;
  aiScore: AIScore | null;
  _count: { analystReports: number };
  _matchScore: number;
}

interface Pool {
  id: string;
  name: string;
  tier: string;
  totalValueLocked: string;
  expectedReturnLow: string;
  expectedReturnHigh: string;
  minInvestmentUSD: string;
  _count: { startups: number };
}

interface ImpactStats {
  co2ReducedTonnes: number;
  jobsCreated: number;
  verifiedReports: number;
  poolCount: number;
  expertCount: number;
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

const tierColor: Record<string, string> = {
  conservative: "text-blue-400",
  balanced:     "text-green-400",
  growth:       "text-yellow-400",
  speculative:  "text-red-400",
};

const verificationBorderColor: Record<string, string> = {
  verified:     "border-l-green-500",
  pending:      "border-l-yellow-500",
  under_review: "border-l-blue-500",
  disputed:     "border-l-orange-500",
  rejected:     "border-l-red-500",
};

const categoryLabel = (c: string) => c.replace(/_/g, " ").replace(/\b\w/g, (x) => x.toUpperCase());

export default function InvestorDashboard() {
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [pools, setPools]       = useState<Pool[]>([]);
  const [impact, setImpact]     = useState<ImpactStats | null>(null);
  const [offers, setOffers]     = useState<InvestorOfferItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const router = useRouter();

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== "investor") { router.push("/auth/login"); return; }
    setUser(u);

    Promise.all([
      fetch(`/api/startups/recommended?email=${encodeURIComponent(u.email)}`).then((r) => r.json()),
      fetch("/api/pools").then((r) => r.json()),
      fetch("/api/impact").then((r) => r.json()),
      fetch(`/api/investor/offers?email=${encodeURIComponent(u.email)}`).then((r) => r.json()),
    ]).then(([s, p, i, o]) => {
      setStartups(s);
      setPools(p);
      setImpact(i);
      setOffers(Array.isArray(o) ? o : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router]);

  if (!user) return null;

  // Client-side search filter applied on top of server-sorted recommendations
  const filtered = startups.filter(
    (s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
      <div className="relative mx-auto max-w-7xl px-6 py-10">

        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <p className="text-sm font-light text-gray-500">Welcome back</p>
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

        {/* Platform impact stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]" />
            ))
          ) : (
            <>
              <StatCard
                label="CO&#x2082; Reduced"
                value={impact ? `${(impact.co2ReducedTonnes / 1000).toFixed(1)}k t` : "—"}
                sub="platform total"
                color="green"
                iconPath="M12 3C7 3 3 7.5 3 12c0 3.5 2 6.5 5 8l1-3h6l1 3c3-1.5 5-4.5 5-8 0-4.5-4-9-9-9z"
              />
              <StatCard
                label="Jobs Created"
                value={impact?.jobsCreated.toLocaleString() ?? "—"}
                sub="across all startups"
                color="teal"
                iconPath="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 100 8 4 4 0 000-8z"
              />
              <StatCard
                label="Verified Reports"
                value={impact?.verifiedReports.toString() ?? "—"}
                sub="on-chain entries"
                color="blue"
                iconPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
              <StatCard
                label="Active Pools"
                value={impact?.poolCount.toString() ?? "—"}
                sub={`${impact?.expertCount ?? 0} DVN analysts`}
                color="purple"
                iconPath="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* My Investment Offers */}
            <section>
              {/* Section header */}
              <div className="mb-3 flex items-center gap-2">
                <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
                <h2 className="text-lg font-semibold text-white">My Investment Offers</h2>
                {offers.length > 0 && (
                  <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                    {offers.length}
                  </span>
                )}
              </div>
              {loading ? (
                <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl border border-white/5 bg-white/[0.02]" />)}</div>
              ) : offers.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-gradient-to-br from-green-500/[0.03] to-transparent py-14 text-center">
                  {/* Illustrated empty state */}
                  <svg className="h-16 w-16 text-green-500/20 mb-4" fill="none" viewBox="0 0 64 64" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
                    {/* Circle */}
                    <circle cx="32" cy="32" r="28" />
                    {/* Chart bars */}
                    <rect x="16" y="38" width="8" height="10" rx="1" />
                    <rect x="28" y="28" width="8" height="20" rx="1" />
                    <rect x="40" y="20" width="8" height="28" rx="1" />
                    {/* Upward arrow */}
                    <polyline points="18,28 28,18 38,24 50,14" />
                    <polyline points="44,14 50,14 50,20" />
                  </svg>
                  <h3 className="text-base font-semibold text-white">No offers yet</h3>
                  <p className="mt-1 text-sm font-light text-gray-500 max-w-xs">Explore startups to invest in active fundraising rounds.</p>
                  <Link href="/startups" className="mt-4 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90 transition">
                    Explore Startups
                  </Link>
                </div>
              ) : (
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
                        o.status === "rejected" ? "bg-red-500/10 text-red-400" :
                        "bg-white/5 text-gray-400"
                      }`}>
                        {o.status}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Recommended startups */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-white">Recommended Startups</h2>
                  {filtered.length > 0 && (
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-gray-500">
                      {filtered.length}
                    </span>
                  )}
                </div>
                <Link href="/startups" className="text-xs text-green-500 hover:text-green-400 transition">See all →</Link>
              </div>

              {/* Search bar */}
              <div className="mb-4 relative">
                <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or category…"
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:border-green-500/40 focus:outline-none"
                />
              </div>

              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl border border-white/5 bg-white/[0.02]" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-sm font-light text-gray-500">
                  {search ? "No startups match your search." : "No verified startups yet."}
                </p>
              ) : (
                <div className="space-y-3">
                  {filtered.slice(0, 6).map((s) => {
                    const borderAccent = verificationBorderColor[s.verificationStatus] ?? "border-l-gray-600";
                    return (
                      <Link key={s.id} href={`/startups/${s.id}`}
                        className={`flex items-center justify-between rounded-xl border border-white/5 border-l-2 ${borderAccent} bg-gradient-to-r from-green-500/[0.04] to-transparent px-5 py-4 transition hover:border-green-500/20`}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white truncate">{s.name}</p>
                            {/* Preference match indicator */}
                            {s._matchScore > 0 && (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                Match
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs font-light text-gray-500">
                            {categoryLabel(s.category)} · {s.stage.replace(/_/g, " ")} · {Number(s.co2ReductionTonnesPerYear).toLocaleString()} t CO&#x2082;/yr
                          </p>
                          {s._count.analystReports > 0 && (
                            <p className="mt-0.5 text-xs text-gray-600">{s._count.analystReports} analyst report{s._count.analystReports !== 1 ? "s" : ""}</p>
                          )}
                        </div>
                        <div className="ml-4 shrink-0 text-right">
                          <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                            Verified
                          </span>
                          {/* AI score badge */}
                          {s.aiScore != null && (
                            <div className="mt-1">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                s.aiScore.overallScore >= 75 ? "bg-green-500/10 text-green-400" :
                                s.aiScore.overallScore >= 50 ? "bg-yellow-500/10 text-yellow-400" :
                                "bg-red-500/10 text-red-400"
                              }`}>
                                AI {s.aiScore.overallScore}
                              </span>
                            </div>
                          )}
                          {s.riskPool && (
                            <p className="mt-1 text-xs text-gray-600">{s.riskPool.name}</p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Risk Pools</h2>
                <Link href="/pools" className="text-xs text-green-500 hover:text-green-400 transition">View all</Link>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-xl border border-white/5 bg-white/[0.02]" />
                  ))}
                </div>
              ) : pools.length === 0 ? (
                <p className="text-sm font-light text-gray-500">No pools available.</p>
              ) : (
                <div className="space-y-3">
                  {pools.map((p) => (
                    <div key={p.id} className={`rounded-xl border p-4 ${
                      p.tier === "conservative" ? "border-blue-500/15 bg-gradient-to-br from-blue-500/[0.06] to-transparent" :
                      p.tier === "balanced"     ? "border-green-500/15 bg-gradient-to-br from-green-500/[0.06] to-transparent" :
                      p.tier === "growth"       ? "border-yellow-500/15 bg-gradient-to-br from-yellow-500/[0.06] to-transparent" :
                                                  "border-red-500/15 bg-gradient-to-br from-red-500/[0.06] to-transparent"}`}>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-white">{p.name}</p>
                        <span className={`text-xs font-medium ${tierColor[p.tier] ?? "text-gray-400"}`}>{p.tier}</span>
                      </div>
                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="font-light text-gray-500">TVL</span>
                          <span className="text-white">₹{Number(p.totalValueLocked).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-light text-gray-500">Expected APY</span>
                          <span className="text-green-400">{Number(p.expectedReturnLow)}–{Number(p.expectedReturnHigh)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-light text-gray-500">Min. invest</span>
                          <span className="text-gray-300">₹{Number(p.minInvestmentUSD).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                      <Link href="/pools"
                        className="mt-3 block w-full rounded-lg bg-green-500/10 py-2 text-center text-xs font-medium text-green-400 hover:bg-green-500/20 transition">
                        Invest in Pool
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <h2 className="mb-3 font-semibold text-white">Quick Links</h2>
              <div className="space-y-2">
                {/* Preferences link */}
                <Link href="/profile"
                  className="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm font-medium text-green-400 transition hover:bg-green-500/10">
                  Set Investment Preferences →
                </Link>
                {[
                  { label: "Impact Ledger", href: "/ledger" },
                  { label: "DVN Network", href: "/dvn" },
                  { label: "All Startups", href: "/startups" },
                ].map(({ label, href }) => (
                  <Link key={label} href={href}
                    className="flex items-center justify-between rounded-lg border border-white/5 px-4 py-3 text-sm font-light text-gray-400 transition hover:border-green-500/20 hover:text-white">
                    {label}
                    <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
  iconPath,
}: {
  label: string;
  value: string;
  sub: string;
  color?: string;
  iconPath?: string;
}) {
  const cfg: Record<string, { border: string; bg: string; text: string; icon: string }> = {
    green:  { border: "border-green-500/15",  bg: "from-green-500/[0.08] to-transparent",  text: "gradient-text",        icon: "text-green-400" },
    teal:   { border: "border-teal-500/15",   bg: "from-teal-500/[0.08] to-transparent",   text: "gradient-text-teal",   icon: "text-teal-400" },
    blue:   { border: "border-blue-500/15",   bg: "from-blue-500/[0.08] to-transparent",   text: "gradient-text-blue",   icon: "text-blue-400" },
    purple: { border: "border-purple-500/15", bg: "from-purple-500/[0.08] to-transparent", text: "gradient-text-purple", icon: "text-purple-400" },
  };
  const s = cfg[color ?? ""] ?? { border: "border-white/5", bg: "from-transparent to-transparent", text: "text-white", icon: "text-gray-400" };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 ${s.border} ${s.bg}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-600">{label}</p>
        {iconPath && (
          <svg className={`h-4 w-4 ${s.icon} opacity-60`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
        )}
      </div>
      <p className={`mt-1 text-2xl font-bold ${s.text}`}>{value}</p>
      <p className="mt-0.5 text-xs font-light text-gray-500">{sub}</p>
    </div>
  );
}
