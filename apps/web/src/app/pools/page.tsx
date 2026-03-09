"use client";

import { useEffect, useState } from "react";

interface Pool {
  id: string;
  name: string;
  description: string;
  tier: string;
  totalValueLocked: string;
  expectedReturnLow: string;
  expectedReturnHigh: string;
  minInvestmentUSD: string;
  _count: { startups: number };
}

const tierColors: Record<string, string> = {
  conservative: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  balanced: "text-green-400 bg-green-500/10 border-green-500/20",
  growth: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  speculative: "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function PoolsPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [amount, setAmount] = useState("");
  const [investStep, setInvestStep] = useState(0);

  useEffect(() => {
    fetch("/api/pools")
      .then((r) => r.json())
      .then((data) => { setPools(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function openInvest(pool: Pool) {
    setSelectedPool(pool);
    setAmount(pool.minInvestmentUSD);
    setInvestStep(0);
  }

  function closeModal() {
    setSelectedPool(null);
    setAmount("");
    setInvestStep(0);
  }

  const minInvest = selectedPool ? Number(selectedPool.minInvestmentUSD) : 0;
  const amountNum = Number(amount);
  const valid = amountNum >= minInvest && amountNum > 0;

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-grid-soft opacity-40" />
      <div className="relative mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white">Risk Pools</h1>
          <p className="mt-2 text-gray-500">
            Co-invest across curated baskets of startups. AI rebalances weights daily.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-32 text-gray-500">Loading pools…</div>
        ) : pools.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-32 text-center">
            <div className="text-5xl">🌊</div>
            <h3 className="mt-4 text-lg font-semibold text-white">No pools yet</h3>
            <p className="mt-1 text-sm text-gray-500">Risk pools will appear here once created.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {pools.map((p) => (
              <div
                key={p.id}
                className="gf-card-interactive gf-card-glow group relative overflow-hidden rounded-2xl p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${tierColors[p.tier] ?? tierColors.balanced}`}>
                    {p.tier}
                  </span>
                  <span className="text-xs text-gray-600">{p._count.startups} startups</span>
                </div>

                <h2 className="text-lg font-semibold text-white">{p.name}</h2>
                <p className="mt-1.5 line-clamp-2 text-sm text-gray-500">{p.description}</p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-gray-600">TVL</p>
                    <p className="mt-0.5 text-sm font-semibold text-green-400">
                      ${Number(p.totalValueLocked).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-gray-600">Expected return</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-300">
                      {Number(p.expectedReturnLow)}–{Number(p.expectedReturnHigh)}%
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => openInvest(p)}
                  className="gf-btn-primary mt-4 w-full py-2.5 text-sm font-medium active:scale-95"
                >
                  Invest in Pool
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Invest Modal ─────────────────────────────────────────────────────── */}
      {selectedPool && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div
            className="gf-card w-full max-w-md rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {investStep < 2 ? `Invest in ${selectedPool.name}` : "Investment Submitted"}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-white/5 hover:text-white"
              >
                ✕
              </button>
            </div>

            {investStep === 0 && (
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tier</span>
                    <span className={`font-medium ${tierColors[selectedPool.tier]?.split(" ")[0]}`}>
                      {selectedPool.tier}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expected return</span>
                    <span className="text-white">{Number(selectedPool.expectedReturnLow)}–{Number(selectedPool.expectedReturnHigh)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Min investment</span>
                    <span className="text-white">${Number(selectedPool.minInvestmentUSD).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Startups</span>
                    <span className="text-white">{selectedPool._count.startups}</span>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs text-gray-500 uppercase tracking-wider">
                    Investment Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min={minInvest}
                      className="gf-input w-full pl-7 pr-4 py-2.5 text-sm"
                      placeholder={minInvest.toLocaleString()}
                    />
                  </div>
                  {amountNum > 0 && amountNum < minInvest && (
                    <p className="mt-1 text-xs text-red-400">Minimum investment is ${minInvest.toLocaleString()}</p>
                  )}
                </div>

                {valid && (
                  <div className="rounded-lg border border-green-500/10 bg-green-500/5 p-3 text-xs text-gray-400">
                    Estimated annual return:{" "}
                    <span className="text-green-400 font-semibold">
                      ${(amountNum * Number(selectedPool.expectedReturnLow) / 100).toLocaleString()}–
                      ${(amountNum * Number(selectedPool.expectedReturnHigh) / 100).toLocaleString()}
                    </span>
                  </div>
                )}

                <button
                  disabled={!valid}
                  onClick={() => setInvestStep(1)}
                  className="gf-btn-primary w-full py-2.5 text-sm font-semibold disabled:opacity-40"
                >
                  Review Investment
                </button>
              </div>
            )}

            {investStep === 1 && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-gray-400">Please review your investment details before signing.</p>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm space-y-3">
                  <Row label="Pool" value={selectedPool.name} />
                  <Row label="Amount" value={`$${Number(amount).toLocaleString()}`} />
                  <Row label="GFT tokens (est.)" value={`${Math.round(Number(amount) * 10).toLocaleString()} GFT`} />
                  <Row label="Lock period" value="30 days" />
                  <Row label="Network" value="Polygon Amoy" />
                </div>
                <p className="text-xs text-gray-600">
                  You will be prompted to sign a transaction in your wallet. Funds are held by the MilestoneVault smart contract.
                </p>
                <button
                  onClick={() => setInvestStep(2)}
                  className="gf-btn-primary w-full py-2.5 text-sm font-semibold"
                >
                  Sign & Invest →
                </button>
                <button onClick={() => setInvestStep(0)} className="text-sm text-gray-500 hover:text-white transition">
                  ← Back
                </button>
              </div>
            )}

            {investStep === 2 && (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="text-5xl">🎉</div>
                <h3 className="text-lg font-semibold text-white">Investment Submitted!</h3>
                <p className="text-sm text-gray-400">
                  Your investment of{" "}
                  <strong className="text-white">${Number(amount).toLocaleString()}</strong> into{" "}
                  <strong className="text-green-400">{selectedPool.name}</strong> is pending on-chain confirmation.
                </p>
                <div className="rounded-lg bg-white/5 px-4 py-2.5 text-xs text-gray-500">
                  Connect a wallet to complete the on-chain transaction.
                </div>
                <button
                  onClick={closeModal}
                  className="gf-btn-secondary px-6 py-2 text-sm text-gray-300"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

