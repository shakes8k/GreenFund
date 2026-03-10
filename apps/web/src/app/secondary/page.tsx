"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUser, type AuthUser } from "@/lib/auth";

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface Listing {
  id: string;
  offerId: string;
  sellerEmail: string;
  sellerName: string;
  askPriceINR: string;
  algorithmicPriceINR: string;
  createdAt: string;
  sharesPercent: string;
  fundingRound: string;
  valuationINR: string;
  startup: {
    id: string;
    name: string;
    category: string;
    countryCode: string;
    co2PerYear: number;
    logoUrl: string | null;
  };
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const fmt = (n: number) =>
  n >= 1_00_00_000 ? `₹${(n / 1_00_00_000).toFixed(2)}Cr`
  : n >= 1_00_000  ? `₹${(n / 1_00_000).toFixed(2)}L`
  : `₹${n.toLocaleString("en-IN")}`;

const categoryLabel = (c: string) =>
  c.replace(/_/g, " ").replace(/\b\w/g, (x) => x.toUpperCase());

const CATEGORY_COLORS: Record<string, string> = {
  solar_energy:    "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  wind_energy:     "text-blue-400 bg-blue-500/10 border-blue-500/20",
  carbon_capture:  "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  sustainable_agriculture: "text-lime-400 bg-lime-500/10 border-lime-500/20",
  clean_water:     "text-sky-400 bg-sky-500/10 border-sky-500/20",
  electric_mobility: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  green_buildings: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};
const DEFAULT_CAT_CLS = "text-green-400 bg-green-500/10 border-green-500/20";

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function SecondaryMarketPage() {
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading]   = useState(true);
  const [buying, setBuying]     = useState<string | null>(null);
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);
  const [filter, setFilter]     = useState<"all" | string>("all");

  useEffect(() => {
    setUser(getUser());
    fetch("/api/secondary")
      .then((r) => r.json())
      .then((data) => { setListings(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function buyListing(id: string) {
    if (!user) { showToast("Please log in to buy.", false); return; }
    setBuying(id);
    const res = await fetch(`/api/secondary/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyerEmail: user.email, buyerName: user.name }),
    });
    setBuying(null);
    if (res.ok) {
      setListings((prev) => prev.filter((l) => l.id !== id));
      showToast("Purchase recorded! Ownership transfer confirmed.", true);
    } else {
      const err = await res.json() as { error?: string };
      showToast(err.error ?? "Purchase failed.", false);
    }
  }

  // Unique categories for filter
  const categories = Array.from(new Set(listings.map((l) => l.startup.category)));
  const visible = filter === "all" ? listings : listings.filter((l) => l.startup.category === filter);

  const totalVolume = listings.reduce((s, l) => s + Number(l.askPriceINR), 0);
  const avgDiscount = listings.length > 0
    ? listings.reduce((s, l) => {
        const ask = Number(l.askPriceINR);
        const algo = Number(l.algorithmicPriceINR);
        return s + (algo > 0 ? (ask - algo) / algo * 100 : 0);
      }, 0) / listings.length
    : 0;

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />

      <div className="relative mx-auto max-w-7xl px-6 py-12">

        {/* ── Header ── */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
              BETA
            </span>
            <span className="text-xs text-gray-600">Climate Equity Exchange</span>
          </div>
          <h1 className="text-4xl font-bold text-white">
            Secondary{" "}
            <span style={{ fontStyle: "italic", fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Market
            </span>
          </h1>
          <p className="mt-2 max-w-lg text-gray-400 font-light">
            Buy verified climate equity from early investors. Impact-weighted pricing ensures fair value for both sides.
          </p>

          {/* Stats */}
          {!loading && listings.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-600">Active Listings</p>
                <p className="text-2xl font-bold text-white">{listings.length}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-600">Total Ask Volume</p>
                <p className="text-2xl font-bold text-green-400">{fmt(totalVolume)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-600">Avg. Premium vs Algo</p>
                <p className={`text-2xl font-bold ${avgDiscount >= 0 ? "text-yellow-400" : "text-green-400"}`}>
                  {avgDiscount >= 0 ? "+" : ""}{avgDiscount.toFixed(1)}%
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── How it works banner ── */}
        <div className="mb-8 rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-5">
          <h2 className="text-sm font-semibold text-white mb-3">How secondary trading works</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-xs text-gray-400">
            {[
              { step: "1", title: "Seller lists equity", body: "An investor lists their accepted equity at an ask price." },
              { step: "2", title: "Algorithmic fair price", body: "Our model prices equity using startup valuation × impact multiplier." },
              { step: "3", title: "You buy it", body: "Pay the ask. Equity ownership is transferred to your name instantly." },
              { step: "4", title: "Climate stays intact", body: "CO₂ reduction commitments transfer with ownership — impact never dilutes." },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-green-500/30 bg-green-500/10 text-[10px] font-bold text-green-400">
                  {step}
                </span>
                <div>
                  <p className="font-semibold text-white mb-0.5">{title}</p>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Category filter ── */}
        {categories.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                filter === "all" ? "border-green-500/40 bg-green-500/15 text-green-400" : "border-white/10 text-gray-500 hover:text-gray-300"
              }`}
            >
              All sectors
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  filter === cat
                    ? "border-green-500/40 bg-green-500/15 text-green-400"
                    : "border-white/10 text-gray-500 hover:text-gray-300"
                }`}
              >
                {categoryLabel(cat)}
              </button>
            ))}
          </div>
        )}

        {/* ── Listings ── */}
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-24 text-center">
            <svg className="h-16 w-16 text-green-500/20 mb-4" fill="none" viewBox="0 0 64 64" stroke="currentColor" strokeWidth={1.2}>
              <rect x="8" y="16" width="48" height="36" rx="4" />
              <path d="M24 16v-4a8 8 0 0116 0v4" />
              <circle cx="32" cy="34" r="4" />
              <line x1="32" y1="38" x2="32" y2="44" />
            </svg>
            <h3 className="text-base font-semibold text-white">No active listings</h3>
            <p className="mt-1 text-sm font-light text-gray-500 max-w-xs">
              Investors can list their accepted equity here. Check back soon or invest in a primary round first.
            </p>
            <Link href="/startups" className="mt-5 rounded-lg bg-green-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-green-400 transition">
              Explore Startups
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((l) => {
              const ask  = Number(l.askPriceINR);
              const algo = Number(l.algorithmicPriceINR);
              const premium = algo > 0 ? ((ask - algo) / algo) * 100 : 0;
              const catCls  = CATEGORY_COLORS[l.startup.category] ?? DEFAULT_CAT_CLS;
              const initials = l.startup.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
              const isMine   = user?.email === l.sellerEmail;

              return (
                <div key={l.id} className="group flex flex-col rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden hover:border-green-500/20 transition">

                  {/* ── Card header ── */}
                  <div className="flex items-start gap-3 p-5 pb-4">
                    {l.startup.logoUrl ? (
                      <img
                        src={l.startup.logoUrl}
                        alt={l.startup.name}
                        className="h-10 w-10 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 text-sm font-bold text-green-400">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <Link href={`/startups/${l.startup.id}`} className="font-semibold text-white hover:text-green-400 transition truncate block">
                        {l.startup.name}
                      </Link>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${catCls}`}>
                          {categoryLabel(l.startup.category)}
                        </span>
                        <span className="text-[10px] text-gray-600">{l.startup.countryCode} · {l.fundingRound}</span>
                      </div>
                    </div>
                    {isMine && (
                      <span className="shrink-0 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                        Your listing
                      </span>
                    )}
                  </div>

                  {/* ── Equity details ── */}
                  <div className="mx-5 mb-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-gray-600 mb-0.5">Equity stake</p>
                        <p className="font-semibold text-green-400 font-mono">{Number(l.sharesPercent).toFixed(4)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-0.5">Round valuation</p>
                        <p className="font-semibold text-white font-mono">{fmt(Number(l.valuationINR))}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-0.5">CO₂ reduction</p>
                        <p className="font-semibold text-emerald-400">{l.startup.co2PerYear.toLocaleString()} t/yr</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-0.5">CO₂ you&apos;d own</p>
                        <p className="font-semibold text-emerald-400">
                          {((l.startup.co2PerYear * Number(l.sharesPercent)) / 100).toFixed(1)} t/yr
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ── Pricing ── */}
                  <div className="mx-5 mb-5 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-gray-600 mb-0.5">Ask price</p>
                      <p className="text-2xl font-bold text-white">{fmt(ask)}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <p className="text-[10px] text-gray-600">
                          Algo: <span className="text-gray-400 font-mono">{fmt(algo)}</span>
                        </p>
                        <span className={`text-[10px] font-semibold ${premium > 10 ? "text-red-400" : premium > 0 ? "text-yellow-400" : "text-green-400"}`}>
                          {premium >= 0 ? "+" : ""}{premium.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-600 self-end">
                      Listed {new Date(l.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </p>
                  </div>

                  {/* ── Action ── */}
                  <div className="mt-auto border-t border-white/5 px-5 py-4">
                    {isMine ? (
                      <p className="text-center text-xs text-gray-500">You listed this — go to dashboard to cancel.</p>
                    ) : !user ? (
                      <Link
                        href="/auth/login"
                        className="block w-full rounded-lg border border-green-500/30 py-2 text-center text-sm font-semibold text-green-400 hover:bg-green-500/10 transition"
                      >
                        Log in to buy
                      </Link>
                    ) : (
                      <button
                        onClick={() => buyListing(l.id)}
                        disabled={buying === l.id}
                        className="w-full rounded-lg bg-green-500 py-2 text-sm font-semibold text-black hover:bg-green-400 transition disabled:opacity-50"
                      >
                        {buying === l.id ? "Processing…" : `Buy for ${fmt(ask)}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Disclaimer ── */}
        <div className="mt-12 rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-5 text-xs text-gray-500">
          <p className="font-semibold text-gray-400 mb-1">Important notice</p>
          <p>
            GreenFund secondary market is a peer-to-peer equity transfer platform operating in beta. Algorithmic prices are indicative and not guaranteed.
            All transactions are subject to GreenFund&apos;s terms and applicable securities regulations. Past performance does not indicate future returns.
            Climate impact figures are based on startup-reported data verified by our analyst network.
          </p>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3 text-sm font-medium shadow-2xl transition-all ${
          toast.ok
            ? "border-green-500/30 bg-green-500/15 text-green-300"
            : "border-red-500/30 bg-red-500/15 text-red-300"
        }`}>
          <span>{toast.ok ? "✓" : "✕"}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </main>
  );
}
