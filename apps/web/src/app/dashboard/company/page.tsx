"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUser, type AuthUser } from "@/lib/auth";

interface Milestone {
  id: string;
  title: string;
  fundReleaseUSD: string;
  targetDate: string;
  status: string;
}

interface Assessment {
  id: string;
  verdict: string;
  confidenceScore: number;
  createdAt: string;
  expert: { walletAddress: string; reputationScore: number };
}

interface StartupRecord {
  id: string;
  name: string;
  verificationStatus: string;
  stage: string;
  category: string;
  totalFundedUSD: string;
  co2ReductionTonnesPerYear: string;
  jobsCreated: number;
  milestones: Milestone[];
  assessments: Assessment[];
}

const milestoneStatus: Record<string, { label: string; color: string }> = {
  completed:        { label: "Completed",   color: "bg-green-500/10 text-green-400" },
  in_progress:      { label: "In Progress", color: "bg-blue-500/10 text-blue-400" },
  oracle_verifying: { label: "Verifying",   color: "bg-purple-500/10 text-purple-400" },
  pending:          { label: "Pending",      color: "bg-white/5 text-gray-500" },
  failed:           { label: "Failed",       color: "bg-red-500/10 text-red-400" },
  disputed:         { label: "Disputed",     color: "bg-orange-500/10 text-orange-400" },
};

const verificationColor: Record<string, string> = {
  verified:     "bg-green-500/10 text-green-400 border-green-500/20",
  pending:      "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  under_review: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  disputed:     "bg-orange-500/10 text-orange-400 border-orange-500/20",
  rejected:     "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function CompanyDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [startup, setStartup] = useState<StartupRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== "company") { router.push("/auth/login"); return; }
    setUser(u);

    // Look up the startup by the company name the user registered with
    const name = u.companyName ?? "";
    if (name) {
      fetch(`/api/company/startup?name=${encodeURIComponent(name)}`)
        .then((r) => r.json())
        .then((data) => { setStartup(data ?? null); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [router]);

  if (!user) return null;

  const vs = startup?.verificationStatus ?? "pending";
  const completedMilestones = startup?.milestones.filter((m) => m.status === "completed").length ?? 0;

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
      <div className="relative mx-auto max-w-7xl px-6 py-10">

        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <p className="text-sm font-light text-gray-500">Company dashboard</p>
            <h1 className="text-3xl font-bold text-white">{user.companyName ?? user.name}</h1>
            <div className="mt-2 flex items-center gap-2">
              {startup ? (
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${verificationColor[vs]}`}>
                  {vs.replace(/_/g, " ")}
                </span>
              ) : (
                <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
                  Not yet listed
                </span>
              )}
              {user.category && (
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-gray-500">
                  {user.category.replace(/_/g, " ")}
                </span>
              )}
              {user.stage && (
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-gray-500">
                  {user.stage.replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]" />
            ))}
          </div>
        ) : startup ? (
          /* ── Startup found in DB ── */
          <>
            {/* Stats */}
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard label="Total Funded" value={`$${(Number(startup.totalFundedUSD) / 1_000).toFixed(0)}k`} sub="raised to date" />
              <StatCard label="CO₂ Reduction" value={`${Number(startup.co2ReductionTonnesPerYear).toLocaleString()} t`} sub="per year" green />
              <StatCard label="Jobs Created" value={startup.jobsCreated.toString()} sub="direct employment" />
              <StatCard label="Milestones" value={`${completedMilestones}/${startup.milestones.length}`} sub="completed" green={completedMilestones > 0} />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {/* Milestones */}
                <section>
                  <h2 className="mb-3 text-lg font-semibold text-white">Milestone Roadmap</h2>
                  {startup.milestones.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center">
                      <p className="text-sm font-light text-gray-500">No milestones defined yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {startup.milestones.map((m, i) => {
                        const st = milestoneStatus[m.status] ?? milestoneStatus["pending"]!;
                        return (
                          <div key={m.id} className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-xs font-mono text-gray-500 shrink-0">
                              {i + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-white">{m.title}</p>
                              <p className="text-xs font-light text-gray-500">
                                ${Number(m.fundReleaseUSD).toLocaleString()} · {new Date(m.targetDate).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.color}`}>{st.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* DVN Assessments */}
                <section>
                  <h2 className="mb-3 text-lg font-semibold text-white">DVN Assessments</h2>
                  {startup.assessments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center">
                      <p className="text-sm font-light text-gray-500">No assessments submitted yet. Analysts will be assigned once your profile is complete.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {startup.assessments.map((a) => (
                        <div key={a.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4">
                          <div>
                            <p className="font-mono text-sm text-gray-300">
                              {a.expert.walletAddress.slice(0, 6)}…{a.expert.walletAddress.slice(-4)}
                            </p>
                            <p className="text-xs font-light text-gray-500">
                              Reputation {a.expert.reputationScore}/100 · Confidence {a.confidenceScore}% · {new Date(a.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            a.verdict === "approved" ? "bg-green-500/10 text-green-400" :
                            a.verdict === "rejected" ? "bg-red-500/10 text-red-400" :
                            "bg-yellow-500/10 text-yellow-400"}`}>
                            {a.verdict.replace(/_/g, " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                  <h2 className="mb-4 font-semibold text-white">Quick Access</h2>
                  <div className="space-y-2">
                    {[
                      { label: "View on Impact Ledger", href: "/ledger" },
                      { label: "Your startup profile", href: `/startups/${startup.id}` },
                      { label: "DVN Network", href: "/dvn" },
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
          </>
        ) : (
          /* ── Startup not yet in DB — show onboarding ── */
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl border border-dashed border-green-500/20 bg-green-500/[0.02] p-8">
                <div className="text-3xl mb-4">🌱</div>
                <h2 className="text-xl font-semibold text-white">Your startup isn't on-platform yet</h2>
                <p className="mt-2 text-sm font-light text-gray-400 leading-relaxed">
                  Your registration details have been saved. To list <strong className="text-white">{user.companyName}</strong> on GreenFund and begin the DVN assessment process, contact our team or wait for our self-serve listing flow (coming soon).
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  {[
                    { label: "Company", value: user.companyName ?? "—" },
                    { label: "Category", value: user.category?.replace(/_/g, " ") ?? "—" },
                    { label: "Stage", value: user.stage?.replace(/_/g, " ") ?? "—" },
                    { label: "Funding Goal", value: user.fundingGoal ?? "—" },
                    { label: "Team Size", value: user.teamSize ?? "—" },
                    { label: "Country", value: user.countryCode ?? "—" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-600">{label}</p>
                      <p className="mt-0.5 font-medium text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                <h2 className="mb-4 font-semibold text-white">What happens next</h2>
                <div className="space-y-4">
                  {[
                    { n: "01", title: "Listing review", desc: "Our team reviews your registration and creates your startup profile on-chain." },
                    { n: "02", title: "DVN assessment", desc: "Domain experts are assigned to validate your climate impact claims." },
                    { n: "03", title: "Milestone setup", desc: "Define funding tranches tied to real-world milestones and IoT oracles." },
                    { n: "04", title: "Capital unlock", desc: "Investors fund your pool; capital releases automatically as milestones are verified." },
                  ].map(({ n, title, desc }) => (
                    <div key={n} className="flex gap-4">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/10 font-mono text-[10px] text-green-400">{n}</span>
                      <div>
                        <p className="font-medium text-white">{title}</p>
                        <p className="text-sm font-light text-gray-500">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                <h2 className="mb-4 font-semibold text-white">Explore the Platform</h2>
                <div className="space-y-2">
                  {[
                    { label: "Browse other startups", href: "/startups" },
                    { label: "View Impact Ledger", href: "/ledger" },
                    { label: "Learn about DVN", href: "/dvn" },
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
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value, sub, green }: { label: string; value: string; sub: string; green?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-600">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${green ? "gradient-text" : "text-white"}`}>{value}</p>
      <p className="mt-0.5 text-xs font-light text-gray-500">{sub}</p>
    </div>
  );
}
