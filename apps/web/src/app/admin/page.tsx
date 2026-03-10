"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface KeyPerson {
  name: string;
  role: string;
  linkedin: string;
}

interface CompanyOnboarding {
  id: string;
  legalName: string;
  registrationNumber: string;
  incorporationDate: string;
  jurisdiction: string;
  registeredAddress: string;
  operatingAddress: string;
  website: string | null;
  logoUrl: string | null;
  keyPeople: KeyPerson[];
  legalDocUrls: string[];
  kycDocUrls: string[];
  financialDocUrls: string[];
  patentDocUrls: string[];
  esgCertUrls: string[];
}

interface PendingReview {
  id: string;
  startupId: string;
  createdAt: string;
  startup: {
    id: string;
    name: string;
    description: string;
    category: string;
    stage: string;
    countryCode: string;
    teamSize: number;
    companyEmail: string | null;
    co2ReductionTonnesPerYear: string;
    jobsCreated: number;
    onboarding: CompanyOnboarding | null;
  };
}

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: "investor" | "company" | "analyst";
  createdAt: string;
}

interface StartupRecord {
  id: string;
  name: string;
  category: string;
  stage: string;
  countryCode: string;
  verificationStatus: string;
  companyEmail: string | null;
  createdAt: string;
  onboarding: { logoUrl: string | null } | null;
}

const STATUS_STYLES: Record<string, string> = {
  verified:     "bg-green-500/10 text-green-400",
  pending:      "bg-yellow-500/10 text-yellow-400",
  under_review: "bg-blue-500/10 text-blue-400",
  disputed:     "bg-orange-500/10 text-orange-400",
  rejected:     "bg-red-500/10 text-red-400",
};

const ROLE_STYLES: Record<string, string> = {
  investor: "bg-blue-500/10 text-blue-400",
  company:  "bg-green-500/10 text-green-400",
  analyst:  "bg-purple-500/10 text-purple-400",
};

interface FinancialsRecord {
  id: string;
  fiscalYear: string;
  periodEndDate: string;
  revenueINR: string | null;
  grossProfitINR: string | null;
  ebitdaINR: string | null;
  netProfitINR: string | null;
  totalAssetsINR: string | null;
  totalLiabilitiesINR: string | null;
  cashEquivalentsINR: string | null;
  burnRateINR: string | null;
  runwayMonths: number | null;
  filingSource: string | null;
  notes: string | null;
}

const BLANK_FIN = {
  fiscalYear: "", periodEndDate: "",
  revenueINR: "", grossProfitINR: "", ebitdaINR: "", netProfitINR: "",
  totalAssetsINR: "", totalLiabilitiesINR: "", cashEquivalentsINR: "",
  burnRateINR: "", runwayMonths: "", filingSource: "", notes: "",
};

export default function AdminPage() {
  const [tab, setTab] = useState<"reviews" | "users" | "companies" | "financials">("reviews");
  const [reviews, setReviews]     = useState<PendingReview[]>([]);
  const [users, setUsers]         = useState<UserAccount[]>([]);
  const [startups, setStartups]   = useState<StartupRecord[]>([]);
  const [loadingR, setLoadingR]   = useState(true);
  const [loadingU, setLoadingU]   = useState(true);
  const [loadingS, setLoadingS]   = useState(true);
  const [processing, setProcessing]       = useState<string | null>(null);
  const [notes, setNotes]                 = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedOnboarding, setExpandedOnboarding] = useState<Record<string, boolean>>({});

  // Financials state
  const [finStartupId, setFinStartupId]     = useState<string | null>(null);
  const [finStartupName, setFinStartupName] = useState("");
  const [finRecords, setFinRecords]         = useState<FinancialsRecord[]>([]);
  const [finLoading, setFinLoading]         = useState(false);
  const [finForm, setFinForm]               = useState<typeof BLANK_FIN>({ ...BLANK_FIN });
  const [finSaving, setFinSaving]           = useState(false);
  const [finToast, setFinToast]             = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ email: string; role: string; name: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    let parsed: { email: string; role: string; name: string } | null = null;
    try { parsed = JSON.parse(localStorage.getItem("gf_user") ?? "null"); } catch { /* empty */ }
    setMounted(true);
    setUser(parsed);
    if (!parsed || parsed.role !== "admin") { router.push("/auth/login"); return; }
    fetch("/api/admin/pending")
      .then((r) => r.json())
      .then((data) => { setReviews(data); setLoadingR(false); })
      .catch(() => setLoadingR(false));
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => { setUsers(data); setLoadingU(false); })
      .catch(() => setLoadingU(false));
    fetch("/api/admin/startups")
      .then((r) => r.json())
      .then((data) => { setStartups(data); setLoadingS(false); })
      .catch(() => setLoadingS(false));
  }, [router]);

  async function decide(startupId: string, status: "approved" | "rejected") {
    setProcessing(startupId);
    await fetch("/api/admin/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startupId, adminEmail: user.email, status, notes: notes[startupId] ?? "" }),
    });
    setReviews((prev) => prev.filter((r) => r.startupId !== startupId));
    setProcessing(null);
  }

  async function deleteUser(id: string) {
    setProcessing(id);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
    setProcessing(null);
    setConfirmDelete(null);
  }

  async function deleteStartup(id: string) {
    setProcessing(id);
    const res = await fetch(`/api/admin/startups/${id}`, { method: "DELETE" });
    if (res.ok) setStartups((prev) => prev.filter((s) => s.id !== id));
    setProcessing(null);
    setConfirmDelete(null);
  }

  function openFinancials(s: StartupRecord) {
    setFinStartupId(s.id);
    setFinStartupName(s.name);
    setFinRecords([]);
    setFinForm({ ...BLANK_FIN });
    setTab("financials");
    setFinLoading(true);
    fetch(`/api/admin/financials/${s.id}?adminEmail=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((data) => { setFinRecords(Array.isArray(data) ? data : []); setFinLoading(false); })
      .catch(() => setFinLoading(false));
  }

  async function saveFinancials() {
    if (!finStartupId || !finForm.fiscalYear || !finForm.periodEndDate) {
      setFinToast("Fiscal year and period end date are required."); return;
    }
    setFinSaving(true);
    const res = await fetch(`/api/admin/financials/${finStartupId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminEmail:         user.email,
        fiscalYear:         finForm.fiscalYear,
        periodEndDate:      finForm.periodEndDate,
        revenueINR:         finForm.revenueINR ? Number(finForm.revenueINR) : null,
        grossProfitINR:     finForm.grossProfitINR ? Number(finForm.grossProfitINR) : null,
        ebitdaINR:          finForm.ebitdaINR ? Number(finForm.ebitdaINR) : null,
        netProfitINR:       finForm.netProfitINR ? Number(finForm.netProfitINR) : null,
        totalAssetsINR:     finForm.totalAssetsINR ? Number(finForm.totalAssetsINR) : null,
        totalLiabilitiesINR: finForm.totalLiabilitiesINR ? Number(finForm.totalLiabilitiesINR) : null,
        cashEquivalentsINR: finForm.cashEquivalentsINR ? Number(finForm.cashEquivalentsINR) : null,
        burnRateINR:        finForm.burnRateINR ? Number(finForm.burnRateINR) : null,
        runwayMonths:       finForm.runwayMonths ? Number(finForm.runwayMonths) : null,
        filingSource:       finForm.filingSource || null,
        notes:              finForm.notes || null,
      }),
    });
    setFinSaving(false);
    if (res.ok) {
      const saved = await res.json() as FinancialsRecord;
      setFinRecords((prev) => {
        const idx = prev.findIndex((r) => r.fiscalYear === saved.fiscalYear);
        if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
        return [saved, ...prev];
      });
      setFinForm({ ...BLANK_FIN });
      setFinToast("Saved!");
    } else {
      setFinToast("Save failed.");
    }
    setTimeout(() => setFinToast(null), 3000);
  }

  async function deleteFinancial(fiscalYear: string) {
    if (!finStartupId) return;
    await fetch(`/api/admin/financials/${finStartupId}?adminEmail=${encodeURIComponent(user.email)}&fiscalYear=${encodeURIComponent(fiscalYear)}`, { method: "DELETE" });
    setFinRecords((prev) => prev.filter((r) => r.fiscalYear !== fiscalYear));
  }

  if (!mounted || !user || user.role !== "admin") return null;

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
      <div className="relative mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-light text-gray-500">Admin</p>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        </div>

        {/* Tabs */}
        <nav className="mb-8 flex gap-1 border-b border-white/5">
          <TabBtn active={tab === "reviews"} onClick={() => setTab("reviews")}>
            Review Queue
            {reviews.length > 0 && (
              <span className="ml-2 rounded-full bg-green-500/20 px-1.5 py-0.5 text-[10px] text-green-400">
                {reviews.length}
              </span>
            )}
          </TabBtn>
          <TabBtn active={tab === "users"} onClick={() => setTab("users")}>
            Manage Users
            <span className="ml-2 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-400">
              {users.length}
            </span>
          </TabBtn>
          <TabBtn active={tab === "companies"} onClick={() => setTab("companies")}>
            Listed Companies
            <span className="ml-2 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-400">
              {startups.length}
            </span>
          </TabBtn>
          <TabBtn active={tab === "financials"} onClick={() => setTab("financials")}>
            Financials
            {finStartupName && (
              <span className="ml-2 rounded-full bg-yellow-500/20 px-1.5 py-0.5 text-[10px] text-yellow-400">
                {finStartupName.split(" ")[0]}
              </span>
            )}
          </TabBtn>
        </nav>

        {/* ── Review Queue ── */}
        {tab === "reviews" && (
          loadingR ? (
            <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]" />)}</div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-32 text-center">
              <div className="text-4xl">&#x2705;</div>
              <h3 className="mt-4 text-lg font-semibold text-white">Queue is clear</h3>
              <p className="mt-1 text-sm text-gray-500">No companies pending review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {r.startup.onboarding?.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.startup.onboarding.logoUrl} alt={r.startup.name} className="h-12 w-12 shrink-0 rounded-xl object-cover border border-white/10 mt-0.5" />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-sm font-bold text-green-400 mt-0.5">
                          {r.startup.name.split(" ").slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? "").join("")}
                        </div>
                      )}
                    <div>
                      <h2 className="text-xl font-semibold text-white">{r.startup.name}</h2>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs text-green-400">{r.startup.category.replace(/_/g, " ")}</span>
                        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-gray-400">{r.startup.stage.replace(/_/g, " ")}</span>
                        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-gray-400">{r.startup.countryCode} · {r.startup.teamSize} people</span>
                        {r.startup.companyEmail && <span className="text-xs text-gray-500">{r.startup.companyEmail}</span>}
                      </div>
                    </div>
                    </div>
                    <span className="text-xs text-gray-600 shrink-0">{new Date(r.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-gray-400">{r.startup.description}</p>
                  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Metric label="CO2/yr" value={`${Number(r.startup.co2ReductionTonnesPerYear).toLocaleString()} t`} />
                    <Metric label="Jobs" value={r.startup.jobsCreated.toString()} />
                  </div>

                  {/* Collapsible onboarding details */}
                  {r.startup.onboarding && (
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedOnboarding((prev) => ({
                            ...prev,
                            [r.id]: !prev[r.id],
                          }))
                        }
                        className="flex items-center gap-2 text-sm font-medium text-green-400 hover:text-green-300 transition"
                      >
                        <svg
                          className={`h-4 w-4 transition-transform ${expandedOnboarding[r.id] ? "rotate-90" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                        Onboarding Details
                      </button>

                      {expandedOnboarding[r.id] && (
                        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-5">
                          {/* Basic info */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <OnboardingField label="Legal Name" value={r.startup.onboarding.legalName} />
                            <OnboardingField label="Registration No." value={r.startup.onboarding.registrationNumber} />
                            <OnboardingField
                              label="Incorporation Date"
                              value={new Date(r.startup.onboarding.incorporationDate).toLocaleDateString("en-IN")}
                            />
                            <OnboardingField label="Jurisdiction" value={r.startup.onboarding.jurisdiction} />
                            <OnboardingField
                              label="Registered Address"
                              value={r.startup.onboarding.registeredAddress}
                              fullWidth
                            />
                            <OnboardingField
                              label="Operating Address"
                              value={r.startup.onboarding.operatingAddress}
                              fullWidth
                            />
                            {r.startup.onboarding.website && (
                              <div className="col-span-2">
                                <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Website</p>
                                <a
                                  href={r.startup.onboarding.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-400 hover:underline"
                                >
                                  {r.startup.onboarding.website}
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Key People */}
                          {r.startup.onboarding.keyPeople.length > 0 && (
                            <div>
                              <p className="mb-2 text-[10px] uppercase tracking-wider text-gray-600">Key People</p>
                              <div className="space-y-2">
                                {r.startup.onboarding.keyPeople.map((p, i) => (
                                  <div key={i} className="flex items-center gap-3 text-sm">
                                    <span className="font-medium text-white">{p.name}</span>
                                    <span className="text-gray-500">{p.role}</span>
                                    {p.linkedin && (
                                      <a
                                        href={p.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-400 hover:underline"
                                      >
                                        LinkedIn
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* File links */}
                          <DocLinks label="Legal Documents" urls={r.startup.onboarding.legalDocUrls} />
                          <DocLinks label="KYC Records" urls={r.startup.onboarding.kycDocUrls} />
                          <DocLinks label="Financial Records" urls={r.startup.onboarding.financialDocUrls} />
                          <DocLinks label="Patent Documents" urls={r.startup.onboarding.patentDocUrls} />
                          <DocLinks label="ESG Certifications" urls={r.startup.onboarding.esgCertUrls} />
                        </div>
                      )}
                    </div>
                  )}

                  <textarea
                    value={notes[r.startupId] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.startupId]: e.target.value }))}
                    placeholder="Review notes (optional)..."
                    className="mb-4 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-green-500/40 focus:outline-none"
                    rows={2}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => decide(r.startupId, "approved")}
                      disabled={processing === r.startupId}
                      className="rounded-lg bg-green-500 px-5 py-2 text-sm font-semibold text-black transition hover:bg-green-400 disabled:opacity-50"
                    >
                      {processing === r.startupId ? "Processing..." : "Approve & List"}
                    </button>
                    <button
                      onClick={() => decide(r.startupId, "rejected")}
                      disabled={processing === r.startupId}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 px-5 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Listed Companies ── */}
        {tab === "companies" && (
          loadingS ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl border border-white/5 bg-white/[0.02]" />)}</div>
          ) : startups.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-32 text-center">
              <h3 className="text-lg font-semibold text-white">No companies listed</h3>
              <p className="mt-1 text-sm text-gray-500">No startups have been registered yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {startups.map((s) => (
                <div key={s.id} className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-3">
                  {/* Logo or initials */}
                  {s.onboarding?.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.onboarding.logoUrl} alt={s.name} className="h-8 w-8 shrink-0 rounded-lg object-cover border border-white/10" />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-xs font-bold text-green-400">
                      {s.name.split(" ").slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? "").join("")}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{s.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {s.category.replace(/_/g, " ")} · {s.stage.replace(/_/g, " ")} · {s.countryCode}
                      {s.companyEmail && ` · ${s.companyEmail}`}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[s.verificationStatus] ?? "bg-white/5 text-gray-400"}`}>
                    {s.verificationStatus.replace(/_/g, " ")}
                  </span>
                  <span className="shrink-0 text-xs text-gray-600">
                    {new Date(s.createdAt).toLocaleDateString("en-IN")}
                  </span>
                  <button
                    onClick={() => openFinancials(s)}
                    className="shrink-0 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-1.5 text-xs font-medium text-yellow-400 transition hover:bg-yellow-500/15"
                  >
                    Financials
                  </button>
                  {confirmDelete === s.id ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-red-400">Sure?</span>
                      <button
                        onClick={() => deleteStartup(s.id)}
                        disabled={processing === s.id}
                        className="rounded px-2.5 py-1 text-xs font-semibold bg-red-500 text-white hover:bg-red-400 disabled:opacity-50"
                      >
                        {processing === s.id ? "..." : "Yes, delete"}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="rounded px-2.5 py-1 text-xs text-gray-400 hover:text-white border border-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(s.id)}
                      className="shrink-0 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/15"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Financials ── */}
        {tab === "financials" && (
          <div className="space-y-6">
            {!finStartupId ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-24 text-center">
                <h3 className="text-base font-semibold text-white">No company selected</h3>
                <p className="mt-1 text-sm text-gray-500">Go to Listed Companies and click "Financials" on a company.</p>
                <button onClick={() => setTab("companies")} className="mt-4 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-sm text-gray-300 hover:text-white transition">
                  Go to Companies →
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Financial Filings</p>
                    <h2 className="text-xl font-bold text-white">{finStartupName}</h2>
                  </div>
                  <button onClick={() => setTab("companies")} className="text-xs text-gray-500 hover:text-gray-300 transition">
                    ← Back to Companies
                  </button>
                </div>

                {/* Add / Edit form */}
                <div className="rounded-2xl border border-yellow-500/15 bg-yellow-500/[0.04] p-6">
                  <h3 className="font-semibold text-white mb-1">Add / Update Filing</h3>
                  <p className="text-xs text-gray-500 mb-5">
                    Entering the same fiscal year will overwrite the existing record. All INR amounts in rupees.
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <FinInput label="Fiscal Year *" placeholder="FY2024-25" value={finForm.fiscalYear}
                      onChange={(v) => setFinForm((p) => ({ ...p, fiscalYear: v }))} />
                    <FinInput label="Period End Date *" type="date" value={finForm.periodEndDate}
                      onChange={(v) => setFinForm((p) => ({ ...p, periodEndDate: v }))} />
                    <FinInput label="Filing Source" placeholder="MCA Filing / Audited P&L" value={finForm.filingSource}
                      onChange={(v) => setFinForm((p) => ({ ...p, filingSource: v }))} />
                  </div>

                  <p className="mt-5 mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">P&amp;L Statement</p>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    <FinInput label="Revenue (₹)" type="number" placeholder="0" value={finForm.revenueINR}
                      onChange={(v) => setFinForm((p) => ({ ...p, revenueINR: v }))} />
                    <FinInput label="Gross Profit (₹)" type="number" placeholder="0" value={finForm.grossProfitINR}
                      onChange={(v) => setFinForm((p) => ({ ...p, grossProfitINR: v }))} />
                    <FinInput label="EBITDA (₹)" type="number" placeholder="0" value={finForm.ebitdaINR}
                      onChange={(v) => setFinForm((p) => ({ ...p, ebitdaINR: v }))} />
                    <FinInput label="Net Profit / Loss (₹)" type="number" placeholder="0 (negative = loss)" value={finForm.netProfitINR}
                      onChange={(v) => setFinForm((p) => ({ ...p, netProfitINR: v }))} />
                  </div>

                  <p className="mt-5 mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Balance Sheet</p>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <FinInput label="Total Assets (₹)" type="number" placeholder="0" value={finForm.totalAssetsINR}
                      onChange={(v) => setFinForm((p) => ({ ...p, totalAssetsINR: v }))} />
                    <FinInput label="Total Liabilities (₹)" type="number" placeholder="0" value={finForm.totalLiabilitiesINR}
                      onChange={(v) => setFinForm((p) => ({ ...p, totalLiabilitiesINR: v }))} />
                    <FinInput label="Cash &amp; Equivalents (₹)" type="number" placeholder="0" value={finForm.cashEquivalentsINR}
                      onChange={(v) => setFinForm((p) => ({ ...p, cashEquivalentsINR: v }))} />
                  </div>

                  <p className="mt-5 mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Runway</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FinInput label="Monthly Burn Rate (₹)" type="number" placeholder="0" value={finForm.burnRateINR}
                      onChange={(v) => setFinForm((p) => ({ ...p, burnRateINR: v }))} />
                    <FinInput label="Runway (months)" type="number" placeholder="0" value={finForm.runwayMonths}
                      onChange={(v) => setFinForm((p) => ({ ...p, runwayMonths: v }))} />
                  </div>

                  <div className="mt-4">
                    <FinInput label="Admin Notes" placeholder="Any context about this filing…" value={finForm.notes}
                      onChange={(v) => setFinForm((p) => ({ ...p, notes: v }))} />
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <button
                      onClick={saveFinancials}
                      disabled={finSaving}
                      className="rounded-lg bg-yellow-500 px-5 py-2 text-sm font-semibold text-black hover:bg-yellow-400 transition disabled:opacity-50"
                    >
                      {finSaving ? "Saving…" : "Save Filing"}
                    </button>
                    <button
                      onClick={() => setFinForm({ ...BLANK_FIN })}
                      className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white transition"
                    >
                      Clear
                    </button>
                    {finToast && (
                      <span className={`text-sm font-medium ${finToast === "Saved!" ? "text-green-400" : "text-red-400"}`}>
                        {finToast}
                      </span>
                    )}
                  </div>
                </div>

                {/* Existing records */}
                <div>
                  <h3 className="font-semibold text-white mb-3">Filing History</h3>
                  {finLoading ? (
                    <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl border border-white/5 bg-white/[0.02]" />)}</div>
                  ) : finRecords.length === 0 ? (
                    <p className="text-sm text-gray-500 py-6 text-center">No financial filings yet for this company.</p>
                  ) : (
                    <div className="space-y-3">
                      {finRecords.map((r) => (
                        <div key={r.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold text-white">{r.fiscalYear}</p>
                              <p className="text-xs text-gray-500">
                                Period end: {new Date(r.periodEndDate).toLocaleDateString("en-IN")}
                                {r.filingSource && ` · ${r.filingSource}`}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setFinForm({
                                  fiscalYear: r.fiscalYear,
                                  periodEndDate: r.periodEndDate.slice(0, 10),
                                  revenueINR: r.revenueINR ?? "",
                                  grossProfitINR: r.grossProfitINR ?? "",
                                  ebitdaINR: r.ebitdaINR ?? "",
                                  netProfitINR: r.netProfitINR ?? "",
                                  totalAssetsINR: r.totalAssetsINR ?? "",
                                  totalLiabilitiesINR: r.totalLiabilitiesINR ?? "",
                                  cashEquivalentsINR: r.cashEquivalentsINR ?? "",
                                  burnRateINR: r.burnRateINR ?? "",
                                  runwayMonths: r.runwayMonths?.toString() ?? "",
                                  filingSource: r.filingSource ?? "",
                                  notes: r.notes ?? "",
                                })}
                                className="rounded-lg border border-white/10 px-3 py-1 text-xs text-gray-400 hover:text-white transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteFinancial(r.fiscalYear)}
                                className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1 text-xs text-red-400 hover:bg-red-500/15 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs sm:grid-cols-4">
                            {r.revenueINR && <FinStat label="Revenue" value={`₹${Number(r.revenueINR).toLocaleString("en-IN")}`} />}
                            {r.grossProfitINR && <FinStat label="Gross Profit" value={`₹${Number(r.grossProfitINR).toLocaleString("en-IN")}`} />}
                            {r.ebitdaINR && <FinStat label="EBITDA" value={`₹${Number(r.ebitdaINR).toLocaleString("en-IN")}`} />}
                            {r.netProfitINR && (
                              <FinStat label="Net P/L"
                                value={`₹${Number(r.netProfitINR).toLocaleString("en-IN")}`}
                                red={Number(r.netProfitINR) < 0}
                              />
                            )}
                            {r.totalAssetsINR && <FinStat label="Total Assets" value={`₹${Number(r.totalAssetsINR).toLocaleString("en-IN")}`} />}
                            {r.totalLiabilitiesINR && <FinStat label="Total Liabilities" value={`₹${Number(r.totalLiabilitiesINR).toLocaleString("en-IN")}`} />}
                            {r.cashEquivalentsINR && <FinStat label="Cash" value={`₹${Number(r.cashEquivalentsINR).toLocaleString("en-IN")}`} />}
                            {r.runwayMonths && <FinStat label="Runway" value={`${r.runwayMonths} mo`} />}
                          </div>
                          {r.notes && <p className="mt-2 text-xs text-gray-600 italic">{r.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Manage Users ── */}
        {tab === "users" && (
          loadingU ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl border border-white/5 bg-white/[0.02]" />)}</div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-32 text-center">
              <h3 className="text-lg font-semibold text-white">No accounts yet</h3>
              <p className="mt-1 text-sm text-gray-500">No investors, companies, or analysts have registered.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{u.name}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLES[u.role] ?? "bg-white/5 text-gray-400"}`}>
                    {u.role}
                  </span>
                  <span className="shrink-0 text-xs text-gray-600">
                    {new Date(u.createdAt).toLocaleDateString("en-IN")}
                  </span>
                  {confirmDelete === u.id ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-red-400">Sure?</span>
                      <button
                        onClick={() => deleteUser(u.id)}
                        disabled={processing === u.id}
                        className="rounded px-2.5 py-1 text-xs font-semibold bg-red-500 text-white hover:bg-red-400 disabled:opacity-50"
                      >
                        {processing === u.id ? "..." : "Yes, delete"}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="rounded px-2.5 py-1 text-xs text-gray-400 hover:text-white border border-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(u.id)}
                      className="shrink-0 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/15"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </main>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2.5 text-sm font-medium transition-colors ${
        active ? "border-b-2 border-green-400 text-white" : "text-gray-500 hover:text-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-gray-600">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-300">{value}</p>
    </div>
  );
}

function OnboardingField({
  label,
  value,
  fullWidth,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "col-span-2" : ""}>
      <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-0.5">{label}</p>
      <p className="text-sm text-gray-300">{value}</p>
    </div>
  );
}

function FinInput({
  label, placeholder, value, onChange, type = "text",
}: { label: string; placeholder?: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-yellow-500/40 focus:outline-none"
      />
    </div>
  );
}

function FinStat({ label, value, red }: { label: string; value: string; red?: boolean }) {
  return (
    <div>
      <p className="text-gray-600">{label}</p>
      <p className={`font-semibold ${red ? "text-red-400" : "text-gray-300"}`}>{value}</p>
    </div>
  );
}

function DocLinks({ label, urls }: { label: string; urls: string[] }) {
  if (!urls || urls.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-[10px] uppercase tracking-wider text-gray-600">{label}</p>
      <div className="flex flex-wrap gap-2">
        {urls.map((url, i) => (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:border-green-500/30 hover:text-white transition"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Document {i + 1}
          </a>
        ))}
      </div>
    </div>
  );
}
