"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUser, type AuthUser } from "@/lib/auth";

interface Startup {
  id: string;
  name: string;
  category: string;
  stage: string;
  verificationStatus: string;
  co2ReductionTonnesPerYear: string;
}

interface AnalystReport {
  id: string;
  startupId: string;
  analystEmail: string;
  analystName: string;
  title: string;
  content: string;
  rating: number;
  publishedAt: string;
}

export default function AnalystDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [queue, setQueue] = useState<Startup[]>([]);
  const [myReports, setMyReports] = useState<AnalystReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Report form state
  const [formStartupId, setFormStartupId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formRating, setFormRating] = useState(0);
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== "analyst") { router.push("/auth/login"); return; }
    setUser(u);
    loadData(u.email);
  }, [router]);

  function loadData(email: string) {
    setLoading(true);
    Promise.all([
      fetch("/api/startups/recommended").then((r) => r.json()),
      fetch(`/api/analyst/report?analystEmail=${encodeURIComponent(email)}`).then((r) => r.json()),
    ]).then(([startups, reports]) => {
      setQueue(startups);
      setMyReports(reports);
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  async function submitReport() {
    if (!user) return;
    if (!formStartupId || !formTitle || !formContent || formRating < 1) {
      setFormError("All fields are required and rating must be at least 1.");
      return;
    }
    setFormSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/analyst/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupId: formStartupId,
          analystEmail: user.email,
          analystName: user.name,
          title: formTitle,
          content: formContent,
          rating: formRating,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Submission failed.");
        setFormSubmitting(false);
        return;
      }
      // Success — reset form, reload reports
      setFormStartupId("");
      setFormTitle("");
      setFormContent("");
      setFormRating(0);
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 3000);
      setMyReports((prev) => [data, ...prev]);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setFormSubmitting(false);
    }
  }

  if (!user) return null;

  const avgRating =
    myReports.length > 0
      ? (myReports.reduce((sum, r) => sum + r.rating, 0) / myReports.length).toFixed(1)
      : "—";

  const uniqueCoverage = new Set(myReports.map((r) => r.startupId)).size;
  const bestRating     = myReports.length > 0 ? Math.max(...myReports.map((r) => r.rating)) : 0;

  const startupName = (id: string) => queue.find((s) => s.id === id)?.name ?? id;

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
      <div className="relative mx-auto max-w-7xl px-6 py-10">

        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <p className="text-sm font-light text-gray-500">Analyst Dashboard</p>
            <h1 className="text-3xl font-bold text-white">{user.name}</h1>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-400">
                {user.domain?.replace(/_/g, " ") ?? "Analyst"}
              </span>
              {user.experience && (
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-gray-500">
                  {user.experience}
                </span>
              )}
            </div>
          </div>
          <Link href="/dvn"
            className="rounded-lg border border-purple-500/20 bg-purple-500/5 px-5 py-2.5 text-sm font-medium text-purple-400 transition hover:bg-purple-500/10">
            DVN Network
          </Link>
        </div>

        {/* Stats row */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Reports Submitted"
            value={loading ? "…" : myReports.length.toString()}
            sub="total reports written"
            color="purple"
          />
          <StatCard
            label="Avg Rating"
            value={loading ? "…" : avgRating}
            sub={bestRating > 0 ? `best: ${bestRating}★` : "no ratings yet"}
            color="gold"
          />
          <StatCard
            label="Companies Covered"
            value={loading ? "…" : uniqueCoverage.toString()}
            sub={`of ${queue.length} in queue`}
            color="teal"
          />
          <StatCard
            label="Domain"
            value={user.domain ? user.domain.replace(/_/g, " ").split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "—"}
            sub={user.experience ?? "experience not set"}
            color="green"
          />
        </div>

        {/* Insight bar */}
        {!loading && myReports.length > 0 && (
          <div className="mb-8 rounded-xl border border-purple-500/10 bg-purple-500/[0.04] px-5 py-3.5 flex flex-wrap items-center gap-4 text-xs">
            <span className="text-purple-400 font-semibold">Coverage insight</span>
            <span className="text-gray-500">
              You have analysed <span className="text-white font-medium">{uniqueCoverage}</span> unique compan{uniqueCoverage === 1 ? "y" : "ies"} out of{" "}
              <span className="text-white font-medium">{queue.length}</span> verified startups in queue.
            </span>
            {queue.length - uniqueCoverage > 0 && (
              <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-400 font-medium">
                {queue.length - uniqueCoverage} unanalysed
              </span>
            )}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">

            {/* Write a Report */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-white">Write a Report</h2>
              <div className="rounded-2xl border border-purple-500/10 bg-gradient-to-br from-purple-500/[0.04] to-transparent p-6">
                <div className="space-y-4">
                  {/* Startup selector */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                      Select Startup
                    </label>
                    <select
                      value={formStartupId}
                      onChange={(e) => setFormStartupId(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-purple-500/40 focus:outline-none">
                      <option value="" className="bg-[#0a0f1a] text-gray-400">Choose a startup…</option>
                      {queue.map((s) => (
                        <option key={s.id} value={s.id} className="bg-[#0a0f1a] text-white">
                          {s.name} — {s.category.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                      Report Title
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Deep Dive: Carbon Capture Viability 2026"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-purple-500/40 focus:outline-none"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                      Report Content
                    </label>
                    <textarea
                      rows={6}
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="Provide your analysis: technology assessment, market opportunity, team quality, impact credibility, risks, and recommendation…"
                      className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-purple-500/40 focus:outline-none"
                    />
                  </div>

                  {/* Star rating */}
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">
                      Rating
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormRating(star)}
                          className={`text-2xl transition-transform hover:scale-110 ${
                            formRating >= star ? "text-amber-400" : "text-gray-700"
                          }`}
                          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                        >
                          ★
                        </button>
                      ))}
                      {formRating > 0 && (
                        <span className="ml-2 text-xs text-gray-500">
                          {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][formRating]}
                        </span>
                      )}
                    </div>
                  </div>

                  {formError && (
                    <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-xs text-red-400">{formError}</p>
                  )}
                  {formSuccess && (
                    <p className="rounded-lg bg-green-500/10 px-4 py-2.5 text-xs text-green-400">
                      Report submitted successfully.
                    </p>
                  )}

                  <button
                    disabled={formSubmitting || !formStartupId || !formTitle || !formContent || formRating < 1}
                    onClick={submitReport}
                    className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-violet-500 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40">
                    {formSubmitting ? "Submitting…" : "Submit Report"}
                  </button>
                </div>
              </div>
            </section>

            {/* My Reports */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">My Reports</h2>
              {loading ? (
                <SkeletonList n={3} h="h-24" />
              ) : myReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-14 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-violet-500/10">
                    <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-white">No reports yet</h3>
                  <p className="mt-1 text-sm font-light text-gray-500">
                    Use the form above to submit your first analyst report.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myReports.map((r) => (
                    <div key={r.id}
                      className="rounded-xl border border-white/5 bg-gradient-to-r from-purple-500/[0.04] to-transparent px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white truncate">{r.title}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {startupName(r.startupId)} · {new Date(r.publishedAt).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}
                          </p>
                          <p className="mt-2 text-sm font-light text-gray-400 line-clamp-2">{r.content}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className={`text-sm ${r.rating >= star ? "text-amber-400" : "text-gray-700"}`}>★</span>
                            ))}
                          </div>
                          <p className="mt-1 text-xs text-gray-600">{r.rating}/5</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Pending Review Queue */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Review Queue</h2>
                {!loading && queue.length > 0 && (
                  <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-400">
                    {queue.length}
                  </span>
                )}
              </div>
              {loading ? (
                <SkeletonList n={4} h="h-16" />
              ) : queue.length === 0 ? (
                <p className="text-sm font-light text-gray-500">No verified startups yet.</p>
              ) : (
                <div className="space-y-2">
                  {queue.slice(0, 8).map((s) => (
                    <div key={s.id}
                      className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 transition hover:border-purple-500/20">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{s.name}</p>
                          <p className="text-xs text-gray-500">
                            {s.category.replace(/_/g, " ")} · {s.stage.replace(/_/g, " ")}
                          </p>
                        </div>
                        <Link href={`/startups/${s.id}`}
                          className="shrink-0 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-gray-400 transition hover:border-purple-500/30 hover:text-white">
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                  {queue.length > 8 && (
                    <p className="pt-1 text-center text-xs text-gray-600">+{queue.length - 8} more startups</p>
                  )}
                </div>
              )}
            </section>

            {/* Quick links */}
            <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <h2 className="mb-3 font-semibold text-white">Quick Links</h2>
              <div className="space-y-2">
                {[
                  { label: "DVN Network", href: "/dvn" },
                  { label: "Impact Ledger", href: "/ledger" },
                  { label: "All Startups", href: "/startups" },
                ].map(({ label, href }) => (
                  <Link key={label} href={href}
                    className="flex items-center justify-between rounded-lg border border-white/5 px-4 py-3 text-sm font-light text-gray-400 transition hover:border-purple-500/20 hover:text-white">
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

function StatCard({ label, value, sub, color }: {
  label: string; value: string; sub: string;
  color: "purple" | "gold" | "teal" | "green";
}) {
  const gradients: Record<string, string> = {
    purple: "from-purple-500/10 to-violet-500/5 border-purple-500/15",
    gold:   "from-amber-500/10 to-orange-500/5 border-amber-500/15",
    teal:   "from-teal-500/10 to-cyan-500/5 border-teal-500/15",
    green:  "from-green-500/10 to-emerald-500/5 border-green-500/15",
  };
  const textColors: Record<string, string> = {
    purple: "text-purple-400",
    gold:   "text-amber-400",
    teal:   "text-teal-400",
    green:  "text-green-400",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 ${gradients[color]}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-gray-600">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${textColors[color]}`}>{value}</p>
      <p className="mt-0.5 text-xs font-light text-gray-500">{sub}</p>
    </div>
  );
}

function SkeletonList({ n, h }: { n: number; h: string }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className={`${h} animate-pulse rounded-xl border border-white/5 bg-white/[0.02]`} />
      ))}
    </div>
  );
}
