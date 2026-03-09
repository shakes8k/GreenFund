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

export default function AdminPage() {
  const [tab, setTab] = useState<"reviews" | "users" | "companies">("reviews");
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
  const router = useRouter();

  const user = typeof window !== "undefined"
    ? (() => { try { return JSON.parse(localStorage.getItem("gf_user") ?? "null"); } catch { return null; } })()
    : null;

  useEffect(() => {
    if (!user || user.role !== "admin") { router.push("/auth/login"); return; }
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
  }, [router, user]);

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

  if (!user || user.role !== "admin") return null;

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
                    <span className="text-xs text-gray-600 shrink-0">{new Date(r.createdAt).toLocaleDateString()}</span>
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
                              value={new Date(r.startup.onboarding.incorporationDate).toLocaleDateString()}
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
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
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
                    {new Date(u.createdAt).toLocaleDateString()}
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
