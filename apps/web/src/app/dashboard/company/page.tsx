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

interface InvestmentRequest {
  id: string;
  investorName: string;
  investorEmail: string;
  amountUSD: string;
  status: string;
  createdAt: string;
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

interface CompanyOnboarding {
  id: string;
  startupId: string;
  legalName: string;
  registrationNumber: string;
  incorporationDate: string;
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

const FUNDING_ROUNDS = ["Pre-Seed", "Seed", "Series A", "Series B", "Series C", "Growth"];

export default function CompanyDashboard() {
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [startup, setStartup]   = useState<StartupRecord | null>(null);
  const [onboarding, setOnboarding] = useState<CompanyOnboarding | null>(null);
  const [requests, setRequests] = useState<InvestmentRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const router = useRouter();

  // Ask Investment form state
  const [showAskForm, setShowAskForm]         = useState(false);
  const [fundingRound, setFundingRound]       = useState("Seed");
  const [amountRaising, setAmountRaising]     = useState("");
  const [minInvestment, setMinInvestment]     = useState("");
  const [valuation, setValuation]             = useState("");
  const [equityPercent, setEquityPercent]     = useState("");
  const [submittingAsk, setSubmittingAsk]     = useState(false);
  const [askSuccess, setAskSuccess]           = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== "company") { router.push("/auth/login"); return; }
    setUser(u);

    const name = u.companyName ?? "";
    if (name) {
      fetch(`/api/company/startup?name=${encodeURIComponent(name)}`)
        .then((r) => r.json())
        .then((data) => {
          setStartup(data ?? null);
          setLoading(false);
          if (data?.id) {
            // Fetch contracts
            fetch(`/api/contracts?startup=${data.id}`)
              .then((r) => r.json())
              .then(setRequests)
              .catch(() => {});
            // Fetch onboarding status
            fetch(`/api/company/onboarding?startupId=${data.id}`)
              .then((r) => r.json())
              .then((ob) => setOnboarding(ob ?? null))
              .catch(() => {});
          }
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [router]);

  async function respond(contractId: string, action: "accept" | "reject") {
    setResponding(contractId);
    const res = await fetch(`/api/contracts/${contractId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === contractId ? { ...r, status: action === "accept" ? "active" : "terminated" } : r
        )
      );
    }
    setResponding(null);
  }

  async function submitAskInvestment() {
    if (!startup) return;
    setSubmittingAsk(true);
    const res = await fetch("/api/company/fundraising", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startupId: startup.id,
        fundingRound,
        amountRaisingINR: parseFloat(amountRaising),
        minInvestmentINR: parseFloat(minInvestment),
        valuationINR: parseFloat(valuation),
        equityPercent: parseFloat(equityPercent),
      }),
    });
    setSubmittingAsk(false);
    if (res.ok) {
      setAskSuccess(true);
      setShowAskForm(false);
      setAmountRaising("");
      setMinInvestment("");
      setValuation("");
      setEquityPercent("");
    } else {
      alert("Failed to submit fundraising request. Please try again.");
    }
  }

  if (!user) return null;

  const vs = startup?.verificationStatus ?? "pending";
  const pendingRequests = requests.filter((r) => r.status === "pending_acceptance");
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

          {/* Ask Investment button */}
          {startup && onboarding && !askSuccess && (
            <button
              onClick={() => setShowAskForm((p) => !p)}
              className="rounded-lg bg-green-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-green-400 transition"
            >
              {showAskForm ? "Cancel" : "Ask Investment"}
            </button>
          )}
        </div>

        {/* Success banner */}
        {askSuccess && (
          <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/10 px-5 py-4">
            <p className="font-medium text-green-400">Fundraising request submitted!</p>
            <p className="mt-0.5 text-sm text-gray-400">
              Your request is now visible to platform investors and our review team.
            </p>
          </div>
        )}

        {/* Onboarding incomplete banner */}
        {startup && !onboarding && !loading && (
          <div className="mb-6 rounded-xl border border-yellow-500/20 bg-yellow-500/[0.05] px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-yellow-400">Complete your onboarding to unlock fundraising</p>
              <p className="mt-0.5 text-sm text-gray-400">
                Submit your legal identity, key people, and documents to activate the &quot;Ask Investment&quot; feature.
              </p>
            </div>
          </div>
        )}

        {/* Ask Investment inline form */}
        {showAskForm && startup && onboarding && (
          <div className="mb-8 rounded-2xl border border-green-500/20 bg-green-500/[0.03] p-6">
            <h2 className="mb-5 text-lg font-semibold text-white">New Fundraising Request</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                  Funding Round
                </label>
                <select
                  value={fundingRound}
                  onChange={(e) => setFundingRound(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-green-500/40 focus:outline-none"
                >
                  {FUNDING_ROUNDS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <AskField
                label="Amount Raising (₹)"
                value={amountRaising}
                onChange={setAmountRaising}
                placeholder="5000000"
              />
              <AskField
                label="Minimum Investment (₹)"
                value={minInvestment}
                onChange={setMinInvestment}
                placeholder="100000"
              />
              <AskField
                label="Valuation (₹)"
                value={valuation}
                onChange={setValuation}
                placeholder="50000000"
              />
              <AskField
                label="Equity Offered (%)"
                value={equityPercent}
                onChange={setEquityPercent}
                placeholder="10"
              />
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={submitAskInvestment}
                disabled={
                  submittingAsk ||
                  !amountRaising ||
                  !minInvestment ||
                  !valuation ||
                  !equityPercent
                }
                className="rounded-lg bg-green-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-green-400 disabled:opacity-50 transition"
              >
                {submittingAsk ? "Submitting…" : "Submit Request"}
              </button>
              <button
                onClick={() => setShowAskForm(false)}
                className="rounded-lg border border-white/10 px-6 py-2.5 text-sm text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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
              <StatCard label="Total Funded" value={`₹${(Number(startup.totalFundedUSD) / 1_00_000).toFixed(1)}L`} sub="raised to date" />
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
                                ₹{Number(m.fundReleaseUSD).toLocaleString("en-IN")} · {new Date(m.targetDate).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.color}`}>{st.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Investment Requests */}
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Investment Requests</h2>
                    {pendingRequests.length > 0 && (
                      <span className="rounded-full bg-yellow-500/20 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
                        {pendingRequests.length} pending
                      </span>
                    )}
                  </div>
                  {requests.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center">
                      <p className="text-sm font-light text-gray-500">No investment requests yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {requests.map((r) => (
                        <div key={r.id} className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white">{r.investorName}</p>
                            <p className="text-xs text-gray-500">{r.investorEmail} · {new Date(r.createdAt).toLocaleDateString()}</p>
                          </div>
                          <span className="font-semibold text-green-400">₹{Number(r.amountUSD).toLocaleString("en-IN")}</span>
                          {r.status === "pending_acceptance" ? (
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => respond(r.id, "accept")}
                                disabled={responding === r.id}
                                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                              >
                                {responding === r.id ? "…" : "Accept"}
                              </button>
                              <button
                                onClick={() => respond(r.id, "reject")}
                                disabled={responding === r.id}
                                className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/15 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              r.status === "active"     ? "bg-green-500/10 text-green-400" :
                              r.status === "terminated" ? "bg-red-500/10 text-red-400" :
                              "bg-white/5 text-gray-400"
                            }`}>
                              {r.status.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                      ))}
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
                              {a.expert.walletAddress?.slice(0, 6) ?? "N/A"}…{a.expert.walletAddress?.slice(-4) ?? ""}
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
                {/* Onboarding status card */}
                <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  <h2 className="mb-3 font-semibold text-white">Onboarding Status</h2>
                  {onboarding ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-400"></span>
                        <span className="text-sm text-green-400 font-medium">Complete</span>
                      </div>
                      <p className="text-xs text-gray-500">{onboarding.legalName}</p>
                      <p className="text-xs text-gray-600">{onboarding.registrationNumber}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-yellow-400"></span>
                        <span className="text-sm text-yellow-400 font-medium">Incomplete</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Complete onboarding to unlock the &quot;Ask Investment&quot; feature.
                      </p>
                    </div>
                  )}
                </section>

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
                <h2 className="text-xl font-semibold text-white">Your startup isn&apos;t on-platform yet</h2>
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

function AskField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min="0"
        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-green-500/40 focus:outline-none"
      />
    </div>
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
