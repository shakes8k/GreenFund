"use client";

import { useState, useEffect } from "react";
import { getUser } from "@/lib/auth";

interface ActiveRound {
  id: string;
  fundingRound: string;
  amountRaisingINR: string | number;
  amountRaisedINR: string | number;
  minInvestmentINR: string | number;
  valuationINR: string | number;
  equityPercent: string | number;
  _count: { offers: number };
}

interface Props {
  round: ActiveRound | null;
  startupId: string;
}

export function FundraisingBanner({ round, startupId: _startupId }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [amountINR, setAmountINR] = useState("");
  const [counterEquity, setCounterEquity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!round) return null;

  const raising = Number(round.amountRaisingINR);
  const raised = Number(round.amountRaisedINR);
  const progress = raising > 0 ? Math.min((raised / raising) * 100, 100) : 0;
  const minInvest = Number(round.minInvestmentINR);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const user = getUser();
    if (!user || user.role !== "investor") {
      setError("You must be logged in as an investor to invest.");
      return;
    }

    const amount = parseFloat(amountINR);
    if (!amount || amount < minInvest) {
      setError(`Minimum investment is ₹${minInvest.toLocaleString("en-IN")}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/fundraising/${round!.id}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investorEmail: user.email,
          investorName: user.name,
          amountINR: amount,
          counterEquityPercent: counterEquity ? parseFloat(counterEquity) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to submit offer.");
      } else {
        setSuccess(true);
        setShowForm(false);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const [mounted, setMounted] = useState(false);
  const [canInvest, setCanInvest] = useState(false);
  useEffect(() => {
    setMounted(true);
    setCanInvest(getUser()?.role === "investor");
  }, []);

  return (
    <div className="mb-8 rounded-2xl border border-green-500/30 bg-green-500/[0.04] p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🚀</span>
            <h3 className="font-semibold text-green-400 text-base">Active Fundraising Round</h3>
          </div>
          <p className="text-white font-medium">{round.fundingRound}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
            {round._count.offers} investor{round._count.offers !== 1 ? "s" : ""} committed
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Raising</p>
          <p className="font-semibold text-white">₹{raising.toLocaleString("en-IN")}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Raised</p>
          <p className="font-semibold text-green-400">₹{raised.toLocaleString("en-IN")}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Equity Offered</p>
          <p className="font-semibold text-white">{Number(round.equityPercent).toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Valuation</p>
          <p className="font-semibold text-white">₹{Number(round.valuationINR).toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/5">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Min. investment: <span className="text-gray-300">₹{minInvest.toLocaleString("en-IN")}</span>
      </p>

      {success && (
        <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3">
          <p className="text-sm font-medium text-green-400">Offer submitted successfully!</p>
          <p className="text-xs text-gray-400 mt-0.5">The company will review your offer and respond.</p>
        </div>
      )}

      {/* Render nothing until mounted — prevents server/client mismatch on localStorage-dependent UI */}
      {mounted && !success && (
        canInvest ? (
          <div className="mt-4">
            <button
              onClick={() => setShowForm((p) => !p)}
              className="rounded-lg bg-green-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-green-400 transition"
            >
              {showForm ? "Cancel" : "Invest / Counter-Offer"}
            </button>

            {showForm && (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                    Investment Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={amountINR}
                    onChange={(e) => setAmountINR(e.target.value)}
                    min={minInvest}
                    placeholder={minInvest.toString()}
                    required
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-green-500/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                    Counter Equity % <span className="normal-case text-gray-600">(optional — leave blank to accept stated terms)</span>
                  </label>
                  <input
                    type="number"
                    value={counterEquity}
                    onChange={(e) => setCounterEquity(e.target.value)}
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder={`${Number(round.equityPercent).toFixed(2)}`}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-green-500/40 focus:outline-none"
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-400">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-green-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-green-400 disabled:opacity-50 transition"
                >
                  {submitting ? "Submitting…" : "Submit Offer"}
                </button>
              </form>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            <a href="/auth/login" className="text-green-400 hover:underline">Log in as investor</a> to invest in this round.
          </p>
        )
      )}
    </div>
  );
}
