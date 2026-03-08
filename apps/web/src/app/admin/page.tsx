"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  };
}

export default function AdminPage() {
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const router = useRouter();
  const user = typeof window !== "undefined" ? (() => { try { return JSON.parse(localStorage.getItem("gf_user") ?? "null"); } catch { return null; } })() : null;

  useEffect(() => {
    if (!user || user.role !== "admin") { router.push("/auth/login"); return; }
    fetch("/api/admin/pending")
      .then((r) => r.json())
      .then((data) => { setReviews(data); setLoading(false); })
      .catch(() => setLoading(false));
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

  if (!user || user.role !== "admin") return null;

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
      <div className="relative mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-light text-gray-500">Admin</p>
          <h1 className="text-3xl font-bold text-white">Company Review Queue</h1>
          <p className="mt-1 text-sm text-gray-500">{reviews.length} pending approval{reviews.length !== 1 ? "s" : ""}</p>
        </div>

        {loading ? (
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
                  <div>
                    <h2 className="text-xl font-semibold text-white">{r.startup.name}</h2>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs text-green-400">{r.startup.category.replace(/_/g, " ")}</span>
                      <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-gray-400">{r.startup.stage.replace(/_/g, " ")}</span>
                      <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-gray-400">{r.startup.countryCode} · {r.startup.teamSize} people</span>
                      {r.startup.companyEmail && <span className="text-xs text-gray-500">{r.startup.companyEmail}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-gray-600">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="mb-4 text-sm leading-relaxed text-gray-400">{r.startup.description}</p>
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Metric label="CO2/yr" value={`${Number(r.startup.co2ReductionTonnesPerYear).toLocaleString()} t`} />
                  <Metric label="Jobs" value={r.startup.jobsCreated.toString()} />
                </div>
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
        )}
      </div>
    </main>
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
