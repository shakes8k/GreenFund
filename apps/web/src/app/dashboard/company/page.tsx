"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUser, type AuthUser } from "@/lib/auth";

interface Milestone {
  id: string;
  title: string;
  fundReleaseUSD: string;
  targetDate: string;
  status: string;
  completedAt: string | null;
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
  description: string;
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

interface ActiveRound {
  id: string;
  fundingRound: string;
  amountRaisingINR: string;
  amountRaisedINR: string;
  minInvestmentINR: string;
  valuationINR: string;
  equityPercent: string;
  status: string;
}

interface InvestorOffer {
  id: string;
  investorEmail: string;
  investorName: string;
  amountINR: string;
  counterEquityPercent: string | null;
  status: string;
  sharesPercent: string | null;
  createdAt: string;
}

const milestoneStatus: Record<string, { label: string; color: string; borderColor: string }> = {
  completed:        { label: "Completed",   color: "bg-green-500/10 text-green-400",   borderColor: "border-l-green-500" },
  in_progress:      { label: "In Progress", color: "bg-blue-500/10 text-blue-400",     borderColor: "border-l-blue-500" },
  oracle_verifying: { label: "Verifying",   color: "bg-purple-500/10 text-purple-400", borderColor: "border-l-purple-500" },
  pending:          { label: "Pending",      color: "bg-white/5 text-gray-500",         borderColor: "border-l-gray-600" },
  failed:           { label: "Failed",       color: "bg-red-500/10 text-red-400",       borderColor: "border-l-red-500" },
  disputed:         { label: "Disputed",     color: "bg-orange-500/10 text-orange-400", borderColor: "border-l-orange-500" },
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
  const [loading, setLoading]   = useState(true);
  const [activeRound, setActiveRound] = useState<ActiveRound | null>(null);
  const [offers, setOffers]     = useState<InvestorOffer[]>([]);
  const [responding, setResponding] = useState<string | null>(null);
  const router = useRouter();

  // Ask Investment form state
  const [showAskForm, setShowAskForm]         = useState(false);
  const [fundingRound, setFundingRound]       = useState("Seed");
  const [amountRaising, setAmountRaising]     = useState("");
  const [minInvestment, setMinInvestment]     = useState("");
  const [valuation, setValuation]             = useState("");
  const [useOfFunds, setUseOfFunds]           = useState("");
  const [submittingAsk, setSubmittingAsk]     = useState(false);
  const [askSuccess, setAskSuccess]           = useState(false);

  // Milestone management
  const [milestones, setMilestones]           = useState<Milestone[]>([]);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [mlTitle, setMlTitle]                 = useState("");
  const [mlFund, setMlFund]                   = useState("");
  const [mlDate, setMlDate]                   = useState("");
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [deletingMilestone, setDeletingMilestone] = useState<string | null>(null);
  const [togglingMilestone, setTogglingMilestone] = useState<string | null>(null);

  // Inline edit state for metrics
  const [editingCO2, setEditingCO2]           = useState(false);
  const [co2Value, setCo2Value]               = useState("");
  const [editingJobs, setEditingJobs]         = useState(false);
  const [jobsValue, setJobsValue]             = useState("");
  const [editingAbout, setEditingAbout]       = useState(false);
  const [aboutValue, setAboutValue]           = useState("");
  const [savingMetrics, setSavingMetrics]     = useState(false);

  // Auto-computed equity
  const computedEquity =
    amountRaising && valuation && Number(valuation) > 0
      ? ((Number(amountRaising) / Number(valuation)) * 100).toFixed(2)
      : null;

  const fetchOffers = useCallback(async (roundId: string) => {
    try {
      const r = await fetch(`/api/fundraising/${roundId}/offers`);
      const data = await r.json();
      setOffers(Array.isArray(data) ? data : []);
    } catch {
      setOffers([]);
    }
  }, []);

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
          if (data?.milestones) setMilestones(data.milestones);
          setLoading(false);
          if (data?.id) {
            // Fetch active fundraising round
            fetch(`/api/company/fundraising?startupId=${data.id}`)
              .then((r) => r.json())
              .then((rounds: ActiveRound[]) => {
                const active = Array.isArray(rounds)
                  ? rounds.find((rr) => rr.status === "active") ?? rounds[0] ?? null
                  : null;
                setActiveRound(active);
                if (active?.id) fetchOffers(active.id);
              })
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
  }, [router, fetchOffers]);

  async function handleOfferAction(offerId: string, action: "accept" | "reject") {
    if (!activeRound) return;
    setResponding(offerId);
    try {
      const res = await fetch(`/api/fundraising/${activeRound.id}/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        // Refresh offers and round
        await fetchOffers(activeRound.id);
        const rr = await fetch(`/api/company/fundraising?startupId=${startup?.id}`);
        const rounds: ActiveRound[] = await rr.json();
        const updated = Array.isArray(rounds)
          ? rounds.find((r) => r.id === activeRound.id) ?? null
          : null;
        setActiveRound(updated);
      }
    } catch {
      // ignore
    }
    setResponding(null);
  }

  async function submitAskInvestment() {
    if (!startup || !computedEquity) return;
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
        equityPercent: parseFloat(computedEquity),
        useOfFunds: useOfFunds.trim() || null,
      }),
    });
    setSubmittingAsk(false);
    if (res.ok) {
      setAskSuccess(true);
      setShowAskForm(false);
      setAmountRaising("");
      setMinInvestment("");
      setValuation("");
      setUseOfFunds("");
    } else {
      alert("Failed to submit fundraising request. Please try again.");
    }
  }

  async function saveMetric(fields: Record<string, unknown>) {
    if (!startup) return;
    setSavingMetrics(true);
    const res = await fetch("/api/company/startup", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startupId: startup.id, ...fields }),
    });
    if (res.ok) {
      const updated = await res.json();
      setStartup((prev) => prev ? { ...prev, ...updated } : prev);
    }
    setSavingMetrics(false);
  }

  async function addMilestone() {
    if (!startup || !mlTitle || !mlDate) return;
    setAddingMilestone(true);
    const res = await fetch("/api/milestones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startupId: startup.id, title: mlTitle, fundReleaseINR: mlFund ? parseFloat(mlFund) : 0, targetDate: mlDate }),
    });
    if (res.ok) {
      const m = await res.json();
      setMilestones((prev) => [...prev, m]);
      setMlTitle(""); setMlFund(""); setMlDate("");
      setShowMilestoneForm(false);
    }
    setAddingMilestone(false);
  }

  async function deleteMilestone(id: string) {
    setDeletingMilestone(id);
    await fetch(`/api/milestones/${id}`, { method: "DELETE" });
    setMilestones((prev) => prev.filter((m) => m.id !== id));
    setDeletingMilestone(null);
  }

  async function toggleMilestone(m: Milestone) {
    setTogglingMilestone(m.id);
    const newStatus = m.status === "completed" ? "pending" : "completed";
    const res = await fetch(`/api/milestones/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMilestones((prev) => prev.map((x) => (x.id === m.id ? updated : x)));
    }
    setTogglingMilestone(null);
  }

  if (!user) return null;

  const vs = startup?.verificationStatus ?? "pending";
  const completedMilestones = milestones.filter((m) => m.status === "completed").length;
  const pendingOffers = offers.filter((o) => o.status === "pending");

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

          {/* Ask Investment button — only when verified + onboarding complete */}
          {startup && onboarding && vs === "verified" && !askSuccess && (
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
          <div className="mb-6 rounded-xl border border-yellow-500/20 bg-yellow-500/[0.05] px-5 py-4">
            <p className="font-medium text-yellow-400">Complete your onboarding to unlock fundraising</p>
            <p className="mt-0.5 text-sm text-gray-400">
              Submit your legal identity, key people, and documents to activate the &quot;Ask Investment&quot; feature.
            </p>
          </div>
        )}

        {/* Pending admin approval banner */}
        {startup && onboarding && vs !== "verified" && !loading && (
          <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/[0.05] px-5 py-4">
            <p className="font-medium text-blue-400">Awaiting admin approval</p>
            <p className="mt-0.5 text-sm text-gray-400">
              Your onboarding is complete. Once an admin verifies your company, the &quot;Ask Investment&quot; button will be unlocked.
            </p>
          </div>
        )}

        {/* Ask Investment inline form */}
        {showAskForm && startup && onboarding && vs === "verified" && (
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

              {/* Auto-computed equity — read only */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                  Equity Offered (auto-calculated)
                </label>
                <div className="flex h-10 items-center rounded-lg border border-white/10 bg-white/[0.03] px-4 text-sm">
                  {computedEquity !== null ? (
                    <span className="font-semibold text-green-400">{computedEquity}%</span>
                  ) : (
                    <span className="text-gray-600">Enter amount &amp; valuation above</span>
                  )}
                </div>
              </div>
            </div>

            {/* Use of Funds */}
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                Use of Funds <span className="normal-case text-gray-600">(optional)</span>
              </label>
              <textarea
                value={useOfFunds}
                onChange={(e) => setUseOfFunds(e.target.value)}
                placeholder="Describe how you plan to use the raised capital (e.g. 40% R&D, 30% hiring, 30% marketing)…"
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-green-500/40 focus:outline-none resize-none"
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
                  !computedEquity
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
              <StatCard
                label="Total Funded"
                value={`₹${(Number(startup.totalFundedUSD) / 1_00_000).toFixed(1)}L`}
                sub="raised to date"
                iconPath="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              {/* CO2 — inline editable */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-600">CO₂ Reduction</p>
                  <button
                    onClick={() => { setEditingCO2((p) => !p); setCo2Value(startup.co2ReductionTonnesPerYear); }}
                    className="text-gray-600 hover:text-gray-400 transition"
                    title="Edit"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-3 1 1-3a4 4 0 01.828-1.414z" />
                    </svg>
                  </button>
                </div>
                {editingCO2 ? (
                  <div className="mt-1 flex gap-2">
                    <input
                      type="number" min="0" value={co2Value}
                      onChange={(e) => setCo2Value(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white focus:border-green-500/40 focus:outline-none"
                    />
                    <button
                      onClick={async () => { await saveMetric({ co2ReductionTonnesPerYear: Number(co2Value) }); setEditingCO2(false); }}
                      disabled={savingMetrics}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                    >
                      {savingMetrics ? "…" : "Save"}
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="mt-1 text-2xl font-bold gradient-text">
                      {Number(startup.co2ReductionTonnesPerYear).toLocaleString()} t
                    </p>
                    <p className="mt-0.5 text-xs font-light text-gray-500">per year</p>
                  </>
                )}
              </div>

              {/* Jobs — inline editable */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-600">Jobs Created</p>
                  <button
                    onClick={() => { setEditingJobs((p) => !p); setJobsValue(startup.jobsCreated.toString()); }}
                    className="text-gray-600 hover:text-gray-400 transition"
                    title="Edit"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-3 1 1-3a4 4 0 01.828-1.414z" />
                    </svg>
                  </button>
                </div>
                {editingJobs ? (
                  <div className="mt-1 flex gap-2">
                    <input
                      type="number" min="0" value={jobsValue}
                      onChange={(e) => setJobsValue(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white focus:border-green-500/40 focus:outline-none"
                    />
                    <button
                      onClick={async () => { await saveMetric({ jobsCreated: Number(jobsValue) }); setEditingJobs(false); }}
                      disabled={savingMetrics}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                    >
                      {savingMetrics ? "…" : "Save"}
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="mt-1 text-2xl font-bold text-white">{startup.jobsCreated}</p>
                    <p className="mt-0.5 text-xs font-light text-gray-500">direct employment</p>
                  </>
                )}
              </div>
              <StatCard
                label="Milestones"
                value={`${completedMilestones}/${milestones.length}`}
                sub="completed"
                green={completedMilestones > 0}
                iconPath="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </div>

            {/* Current Round card */}
            {activeRound && (
              <>
                <div className="mb-8 rounded-2xl border border-green-500/20 bg-green-500/[0.03] p-6">
                  <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Current Round</p>
                      <h3 className="text-white font-semibold text-base">{activeRound.fundingRound}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeRound.status === "active" && (
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      )}
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        activeRound.status === "active"    ? "bg-green-500/10 text-green-400" :
                        activeRound.status === "completed" ? "bg-blue-500/10 text-blue-400" :
                        "bg-white/5 text-gray-400"
                      }`}>
                        {activeRound.status}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Raising</p>
                      <p className="font-semibold text-white">₹{Number(activeRound.amountRaisingINR).toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Raised So Far</p>
                      <p className="font-semibold text-green-400">₹{Number(activeRound.amountRaisedINR).toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Equity Offered</p>
                      <p className="font-semibold text-white">{Number(activeRound.equityPercent).toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Valuation</p>
                      <p className="font-semibold text-white">₹{Number(activeRound.valuationINR).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  {Number(activeRound.amountRaisingINR) > 0 && (
                    <div className="mt-4">
                      <div className="h-2 rounded-full bg-white/5">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                          style={{
                            width: `${Math.min(
                              (Number(activeRound.amountRaisedINR) / Number(activeRound.amountRaisingINR)) * 100,
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="border-t border-white/5 my-8" />
              </>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {/* Milestones */}
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Milestone Roadmap</h2>
                    <button
                      onClick={() => setShowMilestoneForm((p) => !p)}
                      className="flex items-center gap-1.5 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-400 hover:bg-green-500/20 transition"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      {showMilestoneForm ? "Cancel" : "Add Milestone"}
                    </button>
                  </div>

                  {/* Add milestone form */}
                  {showMilestoneForm && (
                    <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/[0.03] p-4 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Title</label>
                          <input
                            type="text" value={mlTitle} onChange={(e) => setMlTitle(e.target.value)}
                            placeholder="e.g. Pilot installation complete"
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-green-500/40 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Fund Release (₹)</label>
                          <input
                            type="number" value={mlFund} onChange={(e) => setMlFund(e.target.value)}
                            placeholder="500000"
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-green-500/40 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Target Date</label>
                          <input
                            type="date" value={mlDate} onChange={(e) => setMlDate(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-green-500/40 focus:outline-none [color-scheme:dark]"
                          />
                        </div>
                      </div>
                      <button
                        onClick={addMilestone}
                        disabled={addingMilestone || !mlTitle || !mlDate}
                        className="rounded-lg bg-green-600 px-5 py-2 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50 transition"
                      >
                        {addingMilestone ? "Adding…" : "Add Milestone"}
                      </button>
                    </div>
                  )}

                  {milestones.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center">
                      <p className="text-sm font-light text-gray-500">No milestones yet. Add your first one above.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {milestones.map((m, i) => {
                        const st = milestoneStatus[m.status] ?? milestoneStatus["pending"]!;
                        const isCurrent = m.status === "in_progress";
                        const isCompleted = m.status === "completed";
                        return (
                          <div
                            key={m.id}
                            className={`group flex items-center gap-4 rounded-xl border border-l-2 px-5 py-4 transition ${st.borderColor} ${
                              isCurrent ? "border-blue-500/20 bg-blue-500/[0.03]" : "border-white/5 bg-white/[0.02]"
                            }`}
                          >
                            {/* Checkbox */}
                            <button
                              onClick={() => toggleMilestone(m)}
                              disabled={togglingMilestone === m.id}
                              className={`shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition ${
                                isCompleted
                                  ? "border-green-500 bg-green-500"
                                  : "border-white/20 hover:border-green-500/60"
                              }`}
                              title={isCompleted ? "Mark as pending" : "Mark as completed"}
                            >
                              {isCompleted && (
                                <svg className="h-3 w-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>

                            {/* Step number */}
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs font-mono text-gray-500 shrink-0">
                              {i + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={`font-medium ${isCompleted ? "line-through text-gray-500" : "text-white"}`}>{m.title}</p>
                              <p className="text-xs font-light text-gray-500 mt-0.5">
                                {Number(m.fundReleaseUSD) > 0 && `₹${Number(m.fundReleaseUSD).toLocaleString("en-IN")} · `}
                                {new Date(m.targetDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>

                            {/* Status badge with heartbeat dot for current */}
                            <div className="flex items-center gap-2 shrink-0">
                              {isCurrent && (
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                                </span>
                              )}
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.color}`}>{st.label}</span>
                            </div>

                            {/* Delete */}
                            <button
                              onClick={() => deleteMilestone(m.id)}
                              disabled={deletingMilestone === m.id}
                              className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition disabled:opacity-50"
                              title="Delete milestone"
                            >
                              {deletingMilestone === m.id ? (
                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <div className="border-t border-white/5 my-8" />

                {/* Investor Offers */}
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Investor Offers</h2>
                    {pendingOffers.length > 0 && (
                      <span className="rounded-full bg-yellow-500/20 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
                        {pendingOffers.length} pending
                      </span>
                    )}
                  </div>
                  {!activeRound ? (
                    <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center">
                      <p className="text-sm font-light text-gray-500">No active fundraising round. Create one using &quot;Ask Investment&quot;.</p>
                    </div>
                  ) : offers.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center">
                      <p className="text-sm font-light text-gray-500">No offers yet. Share your startup page with investors.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {offers.map((o) => (
                        <div
                          key={o.id}
                          className={`flex items-center gap-4 rounded-xl border px-5 py-4 ${
                            o.status === "pending"
                              ? "border-yellow-500/20 bg-yellow-500/[0.03]"
                              : "border-white/5 bg-white/[0.02]"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white">{o.investorName}</p>
                            <p className="text-xs text-gray-500">{o.investorEmail} · {new Date(o.createdAt).toLocaleDateString()}</p>
                            {o.counterEquityPercent && (
                              <p className="text-xs text-yellow-400 mt-0.5">
                                Counter equity: {Number(o.counterEquityPercent).toFixed(2)}%
                              </p>
                            )}
                            {o.sharesPercent && o.status === "accepted" && (
                              <p className="text-xs text-green-400 mt-0.5">
                                Shares: {Number(o.sharesPercent).toFixed(4)}%
                              </p>
                            )}
                          </div>
                          <span className="font-semibold text-green-400 shrink-0">
                            ₹{Number(o.amountINR).toLocaleString("en-IN")}
                          </span>
                          {o.status === "pending" ? (
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => handleOfferAction(o.id, "accept")}
                                disabled={responding === o.id}
                                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                              >
                                {responding === o.id ? "…" : "Accept"}
                              </button>
                              <button
                                onClick={() => handleOfferAction(o.id, "reject")}
                                disabled={responding === o.id}
                                className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/15 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              o.status === "accepted" ? "bg-green-500/10 text-green-400" :
                              o.status === "rejected" ? "bg-red-500/10 text-red-400" :
                              "bg-white/5 text-gray-400"
                            }`}>
                              {o.status}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <div className="border-t border-white/5 my-8" />

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

                {/* About / description — inline editable */}
                <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-white">About</h2>
                    <button
                      onClick={() => { setEditingAbout((p) => !p); setAboutValue(startup.description ?? ""); }}
                      className="text-gray-600 hover:text-gray-400 transition"
                      title="Edit"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-3 1 1-3a4 4 0 01.828-1.414z" />
                      </svg>
                    </button>
                  </div>
                  {editingAbout ? (
                    <div className="space-y-2">
                      <textarea
                        value={aboutValue}
                        onChange={(e) => setAboutValue(e.target.value)}
                        rows={5}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-green-500/40 focus:outline-none resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={async () => { await saveMetric({ description: aboutValue }); setEditingAbout(false); }}
                          disabled={savingMetrics}
                          className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                        >
                          {savingMetrics ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingAbout(false)}
                          className="rounded-lg border border-white/10 px-4 py-1.5 text-xs text-gray-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-light text-gray-400 leading-relaxed">
                      {startup.description || <span className="text-gray-600 italic">No description yet. Click the pencil to add one.</span>}
                    </p>
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
                {/* SVG plant illustration replacing emoji */}
                <svg
                  className="h-12 w-12 text-green-500/40 mb-4"
                  fill="none"
                  viewBox="0 0 48 48"
                  stroke="currentColor"
                  strokeWidth={1.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* Stem */}
                  <line x1="24" y1="42" x2="24" y2="18" />
                  {/* Left leaf */}
                  <path d="M24 32 C16 28 10 18 14 10 C20 15 23 24 24 32z" />
                  {/* Right leaf */}
                  <path d="M24 24 C32 20 38 10 34 4 C28 9 25 18 24 24z" />
                  {/* Ground */}
                  <path d="M12 42 Q24 38 36 42" strokeWidth={1.5} />
                </svg>
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

function StatCard({
  label,
  value,
  sub,
  green,
  iconPath,
}: {
  label: string;
  value: string;
  sub: string;
  green?: boolean;
  iconPath?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-600">{label}</p>
        {iconPath && (
          <svg className="h-4 w-4 text-gray-600 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
        )}
      </div>
      <p className={`mt-1 text-2xl font-bold ${green ? "gradient-text" : "text-white"}`}>{value}</p>
      <p className="mt-0.5 text-xs font-light text-gray-500">{sub}</p>
    </div>
  );
}
