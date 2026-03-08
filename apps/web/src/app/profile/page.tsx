"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, logout, setUser, type AuthUser } from "@/lib/auth";

const roleLabel: Record<string, string> = {
  investor: "Investor",
  company:  "Company",
  analyst:  "Analyst",
  admin:    "Admin",
};

const roleStyle: Record<string, string> = {
  investor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  company:  "bg-green-500/10 text-green-400 border-green-500/20",
  analyst:  "bg-purple-500/10 text-purple-400 border-purple-500/20",
  admin:    "bg-red-500/10 text-red-400 border-red-500/20",
};

const categories = [
  "solar", "wind", "ocean_tech", "carbon_capture", "green_hydrogen",
  "sustainable_agriculture", "ev_mobility", "energy_storage", "waste_tech", "biodiversity",
];

const stages = ["pre_seed", "seed", "series_a", "series_b", "growth"];

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-white/5 last:border-0">
      <span className="text-sm font-light text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-white text-right">{value}</span>
    </div>
  );
}

interface Pref {
  categories: string[];
  stages: string[];
  minScore: number | null;
}

export default function ProfilePage() {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [pref, setPref] = useState<Pref>({ categories: [], stages: [], minScore: null });
  const [prefLoading, setPrefLoading] = useState(false);
  const [prefSaved, setPrefSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push("/auth/login"); return; }
    setUserState(u);

    if (u.role === "investor") {
      fetch(`/api/investor/preferences?email=${encodeURIComponent(u.email)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data) setPref({ categories: data.categories ?? [], stages: data.stages ?? [], minScore: data.minScore ?? null });
        })
        .catch(() => null);
    }
  }, [router]);

  function handleLogout() {
    logout();
    router.push("/");
  }

  function toggleCategory(c: string) {
    setPref((p) => ({
      ...p,
      categories: p.categories.includes(c) ? p.categories.filter((x) => x !== c) : [...p.categories, c],
    }));
  }

  function toggleStage(s: string) {
    setPref((p) => ({
      ...p,
      stages: p.stages.includes(s) ? p.stages.filter((x) => x !== s) : [...p.stages, s],
    }));
  }

  async function savePreferences() {
    if (!user) return;
    setPrefLoading(true);
    await fetch("/api/investor/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, ...pref }),
    });
    setPrefLoading(false);
    setPrefSaved(true);
    setTimeout(() => setPrefSaved(false), 2500);
  }

  if (!user) return null;

  return (
    <main className="relative min-h-[calc(100vh-73px)]">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="relative mx-auto max-w-2xl px-6 py-12">

        <div className="mb-8">
          <p className="text-sm font-light text-gray-500">Account Settings</p>
          <h1 className="text-3xl font-bold text-white">Your Profile</h1>
        </div>

        {/* Identity card */}
        <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-2xl font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{user.name}</h2>
              <p className="text-sm font-light text-gray-500">{user.email}</p>
              <span className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleStyle[user.role] ?? ""}`}>
                {roleLabel[user.role] ?? user.role}
              </span>
            </div>
          </div>
          <Row label="Account ID" value={user.id} />
          <Row label="Member since" value={new Date(user.createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })} />
        </div>

        {/* Investor role details */}
        {user.role === "investor" && (
          <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="mb-4 font-semibold text-white">Investor Details</h3>
            <Row label="Investor type" value={user.investorType?.replace(/_/g, " ") ?? null} />
            <Row label="Risk appetite" value={user.riskAppetite ?? null} />
            <Row label="Investment range" value={user.investmentRange ?? null} />
          </div>
        )}

        {/* Investor preferences panel */}
        {user.role === "investor" && (
          <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="mb-1 font-semibold text-white">Investment Preferences</h3>
            <p className="mb-5 text-xs font-light text-gray-500">
              Your dashboard recommendations are ranked by how well startups match these preferences.
            </p>

            {/* Categories */}
            <div className="mb-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Climate Categories</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleCategory(c)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      pref.categories.includes(c)
                        ? "border-green-500/40 bg-green-500/10 text-green-400"
                        : "border-white/10 bg-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300"
                    }`}
                  >
                    {c.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Stages */}
            <div className="mb-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Startup Stages</p>
              <div className="flex flex-wrap gap-2">
                {stages.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleStage(s)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      pref.stages.includes(s)
                        ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                        : "border-white/10 bg-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300"
                    }`}
                  >
                    {s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Min score */}
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Minimum AI Score</p>
                <span className="font-mono text-sm text-green-400">{pref.minScore ?? 0}/100</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={pref.minScore ?? 0}
                onChange={(e) => setPref((p) => ({ ...p, minScore: Number(e.target.value) || null }))}
                className="w-full accent-green-500"
              />
              <p className="mt-1 text-xs text-gray-600">Only show startups with AI overall score ≥ this value.</p>
            </div>

            <button
              onClick={savePreferences}
              disabled={prefLoading}
              className="rounded-lg bg-green-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-green-400 disabled:opacity-50"
            >
              {prefLoading ? "Saving…" : prefSaved ? "Saved!" : "Save Preferences"}
            </button>
          </div>
        )}

        {/* Company role details */}
        {user.role === "company" && (
          <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="mb-4 font-semibold text-white">Company Details</h3>
            <Row label="Company name" value={user.companyName ?? null} />
            <Row label="Category" value={user.category?.replace(/_/g, " ") ?? null} />
            <Row label="Stage" value={user.stage?.replace(/_/g, " ") ?? null} />
            <Row label="Country" value={user.countryCode ?? null} />
            <Row label="Team size" value={user.teamSize ?? null} />
            <Row label="Funding goal" value={user.fundingGoal ?? null} />
          </div>
        )}

        {/* Analyst role details */}
        {user.role === "analyst" && (
          <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="mb-4 font-semibold text-white">Analyst Details</h3>
            <Row label="Domain expertise" value={user.domain?.replace(/_/g, " ") ?? null} />
            <Row label="Experience" value={user.experience ?? null} />
          </div>
        )}

        {/* Actions */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h3 className="mb-4 font-semibold text-white">Account</h3>
          <p className="mb-4 text-sm font-light text-gray-500">
            Your profile details are stored locally in this browser. Platform-wide profile sync coming soon.
          </p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>

      </div>
    </main>
  );
}
