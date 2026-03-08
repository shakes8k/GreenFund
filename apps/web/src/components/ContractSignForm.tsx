"use client";

import { useState } from "react";

interface Props {
  startupId: string;
  startupName: string;
}

export function ContractSignForm({ startupId, startupName }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !amount) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investorName: name.trim(),
          investorEmail: email.trim(),
          startupId,
          amountUSD: parseFloat(amount),
          terms: { milestoneSchedule: [] },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: `Investment contract created (ID: ${data.id}). Status: pending acceptance.` });
        setName("");
        setEmail("");
        setAmount("");
      } else {
        setResult({ success: false, message: data.error ?? "Something went wrong." });
      }
    } catch {
      setResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
      <h2 className="mb-1 text-lg font-semibold text-white">Sign Investment Contract</h2>
      <p className="mb-6 text-sm text-gray-500">
        Commit capital to <span className="text-white">{startupName}</span>. Funds are held in
        escrow and released as milestones are verified.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Jane Smith"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-green-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="jane@example.com"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-green-500/50 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
            Investment Amount (USD)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="100"
            step="1"
            placeholder="10000"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-green-500/50 focus:outline-none"
          />
        </div>

        {result && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              result.success
                ? "border border-green-500/20 bg-green-500/10 text-green-300"
                : "border border-red-500/20 bg-red-500/10 text-red-300"
            }`}
          >
            {result.message}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-green-500 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Sign Contract"}
        </button>
      </form>
    </div>
  );
}
