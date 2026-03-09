"use client";

import { useState, useEffect } from "react";

interface Props {
  startupId: string;
  startupName: string;
}

interface AuthUser {
  name: string;
  email: string;
  role: string;
}

function getUser(): AuthUser | null {
  try { return JSON.parse(localStorage.getItem("gf_user") ?? "null"); } catch { return null; }
}

export function ContractSignForm({ startupId, startupName }: Props) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [amount, setAmount]   = useState("");
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]   = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => { setUser(getUser()); }, []);

  // Only investors can fund
  if (user && user.role !== "investor") {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <p className="text-sm text-gray-500">Only investors can fund companies.</p>
      </div>
    );
  }

  async function handleFund() {
    if (!amount || !user) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investorName:  user.name,
          investorEmail: user.email,
          startupId,
          amountUSD: parseFloat(amount),  // stored as numeric, treated as INR
          terms: { milestoneSchedule: [] },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: `Investment request sent to ${startupName}. Awaiting company acceptance.` });
        setAmount("");
        setConfirm(false);
      } else {
        setResult({ success: false, message: data.error ?? "Something went wrong." });
      }
    } catch {
      setResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const parsedAmount = parseFloat(amount);
  const validAmount  = !isNaN(parsedAmount) && parsedAmount >= 1000;

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
      <h2 className="mb-1 text-lg font-semibold text-white">Fund this Company</h2>
      <p className="mb-6 text-sm text-gray-500">
        Invest in <span className="text-white">{startupName}</span>. Your request will be sent to
        the company for acceptance. Funds are held in escrow and released as milestones are verified.
      </p>

      {!user ? (
        <p className="text-sm text-yellow-400">Please log in as an investor to fund this company.</p>
      ) : (
        <div className="space-y-5">
          {/* Investor info (read-only) */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-gray-500">Investor Name</p>
              <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-gray-300">{user.name}</p>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-gray-500">Email</p>
              <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-gray-300">{user.email}</p>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
              Investment Amount (₹)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setConfirm(false); setResult(null); }}
                min="1000"
                step="1000"
                placeholder="500000"
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-8 pr-4 text-sm text-white placeholder-gray-600 focus:border-green-500/50 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-gray-600">Minimum ₹1,000</p>
          </div>

          {result && (
            <div className={`rounded-lg px-4 py-3 text-sm ${
              result.success
                ? "border border-green-500/20 bg-green-500/10 text-green-300"
                : "border border-red-500/20 bg-red-500/10 text-red-300"
            }`}>
              {result.message}
            </div>
          )}

          {/* Confirm step */}
          {!confirm ? (
            <button
              onClick={() => setConfirm(true)}
              disabled={!validAmount}
              className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {validAmount ? `Fund ₹${Number(parsedAmount).toLocaleString("en-IN")}` : "Enter amount to continue"}
            </button>
          ) : (
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 space-y-3">
              <p className="text-sm text-white">
                Confirm investment of <span className="font-bold text-green-400">₹{Number(parsedAmount).toLocaleString("en-IN")}</span> in <span className="font-semibold">{startupName}</span>?
              </p>
              <p className="text-xs text-gray-500">The company must accept before funds are committed.</p>
              <div className="flex gap-3">
                <button
                  onClick={handleFund}
                  disabled={submitting}
                  className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                >
                  {submitting ? "Sending…" : "Yes, Send Request"}
                </button>
                <button
                  onClick={() => setConfirm(false)}
                  className="rounded-lg border border-white/10 px-5 py-2 text-sm text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
