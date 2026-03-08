"use client";

import { useEffect, useState } from "react";

type ModalType = "validator" | "queue" | "leaderboard" | null;

interface Startup {
  id: string;
  name: string;
  category: string;
  stage: string;
  verificationStatus: string;
}

interface Expert {
  id: string;
  walletAddress: string;
  domains: string[];
  reputationScore: number;
  totalAssessments: number;
  accuracyRate: string;
}

const domains = [
  "Climate Science", "Renewable Energy", "Carbon Markets",
  "Policy Analysis", "Marine Biology", "Sustainable Finance",
  "Engineering", "Ecology",
];

export default function DVNPage() {
  const [modal, setModal] = useState<ModalType>(null);
  const [applyStep, setApplyStep] = useState(0);
  const [domain, setDomain] = useState("");
  const [stakeAmount, setStakeAmount] = useState(10000);

  const [queue, setQueue] = useState<Startup[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [loadingExperts, setLoadingExperts] = useState(false);

  function openModal(m: ModalType) {
    setModal(m);
    if (m === "queue" && queue.length === 0) {
      setLoadingQueue(true);
      Promise.all([
        fetch("/api/startups?status=pending").then((r) => r.json()),
        fetch("/api/startups?status=under_review").then((r) => r.json()),
      ]).then(([p, u]) => {
        setQueue([...p, ...u]);
        setLoadingQueue(false);
      }).catch(() => setLoadingQueue(false));
    }
    if (m === "leaderboard" && experts.length === 0) {
      setLoadingExperts(true);
      fetch("/api/dvn/experts").then((r) => r.json())
        .then((data) => { setExperts(data); setLoadingExperts(false); })
        .catch(() => setLoadingExperts(false));
    }
  }

  function closeModal() {
    setModal(null);
    setApplyStep(0);
    setDomain("");
    setStakeAmount(10000);
  }

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="relative mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white">Decentralized Verification Network</h1>
          <p className="mt-2 font-light text-gray-500">
            Expert validators stake tokens to assess climate startup claims.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {[
            { label: "Active Validators", value: experts.length > 0 ? experts.length.toString() : "—" },
            { label: "Assessments Submitted", value: experts.reduce((s, e) => s + e.totalAssessments, 0).toString() || "—" },
            { label: "Avg. Accuracy", value: experts.length > 0
              ? `${(experts.reduce((s, e) => s + Number(e.accuracyRate), 0) / experts.length * 100).toFixed(1)}%`
              : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-white/5 bg-white/[0.02] p-5 text-center">
              <p className="text-2xl font-bold text-green-400">{value}</p>
              <p className="mt-1 text-xs font-light text-gray-500 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: "🔬", title: "Become an Expert", desc: "Stake GFT tokens and start reviewing startups in your domain. Earn rewards for accurate assessments.", action: "Apply as Validator", modal: "validator" as ModalType },
            { icon: "📋", title: "Active Assessments", desc: "View startups currently under review. Challenge assessments you disagree with during the 7-day window.", action: "View Queue", modal: "queue" as ModalType },
            { icon: "🏆", title: "Leaderboard", desc: "Top validators by accuracy rate, total assessments, and reputation score.", action: "View Rankings", modal: "leaderboard" as ModalType },
          ].map(({ icon, title, desc, action, modal: m }) => (
            <div key={title} className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
              <div className="mb-4 text-4xl">{icon}</div>
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm font-light text-gray-500 leading-relaxed">{desc}</p>
              <button onClick={() => openModal(m)}
                className="mt-6 w-full rounded-lg border border-green-500/20 bg-green-500/5 py-2.5 text-sm font-medium text-green-400 transition hover:bg-green-500/10 active:scale-95">
                {action}
              </button>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.02] p-8">
          <h2 className="mb-6 text-lg font-semibold text-white">How DVN Works</h2>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { step: "01", title: "Stake GFT", desc: "Lock tokens as collateral — skin in the game." },
              { step: "02", title: "Assess Startups", desc: "Review claims, evidence, and impact projections." },
              { step: "03", title: "Challenge Period", desc: "7-day window for peers to dispute your verdict." },
              { step: "04", title: "Earn or Slash", desc: "Accurate assessors earn fees; bad actors get slashed." },
            ].map(({ step, title, desc }) => (
              <div key={step}>
                <span className="font-mono text-xs text-green-500">{step}</span>
                <p className="mt-1 font-semibold text-white">{title}</p>
                <p className="mt-1 text-sm font-light text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={closeModal}>
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0f1a] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {modal === "validator" && "Apply as Validator"}
                {modal === "queue" && "Assessment Queue"}
                {modal === "leaderboard" && "Validator Leaderboard"}
              </h2>
              <button onClick={closeModal} className="text-gray-500 transition hover:text-white">✕</button>
            </div>

            {/* Apply */}
            {modal === "validator" && applyStep === 0 && (
              <div className="space-y-4">
                <p className="text-sm font-light text-gray-400">Select your primary domain and choose how many GFT tokens to stake.</p>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">Primary Domain</label>
                  <select value={domain} onChange={(e) => setDomain(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/50">
                    <option value="">Select domain…</option>
                    {domains.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <div className="mb-1.5 flex justify-between">
                    <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Stake Amount</label>
                    <span className="font-mono text-sm text-green-400">{stakeAmount.toLocaleString()} GFT</span>
                  </div>
                  <input type="range" min={1000} max={100000} step={1000} value={stakeAmount}
                    onChange={(e) => setStakeAmount(Number(e.target.value))} className="w-full accent-green-500" />
                  <div className="mt-1 flex justify-between text-xs text-gray-600"><span>1k min</span><span>100k max</span></div>
                </div>
                <div className="rounded-lg border border-green-500/10 bg-green-500/5 p-3 text-xs text-gray-400">
                  Estimated weekly earnings at this stake: <span className="font-semibold text-green-400">~{Math.round(stakeAmount * 0.002).toLocaleString()} GFT</span>
                </div>
                <button disabled={!domain} onClick={() => setApplyStep(1)}
                  className="w-full rounded-lg bg-green-500 py-2.5 text-sm font-semibold text-black transition hover:bg-green-400 disabled:opacity-40">
                  Review & Confirm
                </button>
              </div>
            )}
            {modal === "validator" && applyStep === 1 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-sm space-y-3">
                  {[["Domain", domain], ["Stake", `${stakeAmount.toLocaleString()} GFT`], ["Challenge period", "7 days"], ["Min. accuracy", "60%"]].map(([l, v]) => (
                    <div key={l} className="flex justify-between"><span className="text-gray-500">{l}</span><span className="font-medium text-white">{v}</span></div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Tokens lock for 30 days. Unstake available after cooldown.</p>
                <button onClick={() => setApplyStep(2)} className="w-full rounded-lg bg-green-500 py-2.5 text-sm font-semibold text-black transition hover:bg-green-400">
                  Sign Transaction →
                </button>
              </div>
            )}
            {modal === "validator" && applyStep === 2 && (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="text-5xl">✅</div>
                <h3 className="text-lg font-semibold text-white">Application Submitted</h3>
                <p className="text-sm font-light text-gray-400">
                  Your validator application for <strong className="text-white">{domain}</strong> with <strong className="text-green-400">{stakeAmount.toLocaleString()} GFT</strong> staked is pending on-chain confirmation.
                </p>
                <button onClick={closeModal} className="rounded-lg border border-white/10 px-6 py-2 text-sm text-gray-400 transition hover:text-white">Close</button>
              </div>
            )}

            {/* Queue */}
            {modal === "queue" && (
              loadingQueue ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl border border-white/5 bg-white/[0.02]" />
                  ))}
                </div>
              ) : queue.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-4xl">✅</p>
                  <p className="mt-3 text-sm font-light text-gray-500">No startups pending assessment right now.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <p className="text-sm font-light text-gray-500 mb-1">{queue.length} startup{queue.length !== 1 ? "s" : ""} awaiting review.</p>
                  {queue.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3.5">
                      <div>
                        <p className="font-medium text-white">{s.name}</p>
                        <p className="text-xs font-light text-gray-500 mt-0.5">{s.category.replace(/_/g, " ")} · {s.stage.replace(/_/g, " ")}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        s.verificationStatus === "pending" ? "bg-yellow-500/10 text-yellow-400" : "bg-blue-500/10 text-blue-400"}`}>
                        {s.verificationStatus.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Leaderboard */}
            {modal === "leaderboard" && (
              loadingExperts ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 animate-pulse rounded-lg border border-white/5 bg-white/[0.02]" />
                  ))}
                </div>
              ) : experts.length === 0 ? (
                <p className="py-8 text-center text-sm font-light text-gray-500">No validators registered yet.</p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-white/5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.03]">
                        {["#", "Address", "Domain", "Score", "Assessments", "Accuracy"].map((h) => (
                          <th key={h} className="px-3 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-gray-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {experts.map((e, i) => (
                        <tr key={e.id} className="hover:bg-white/[0.02] transition">
                          <td className="px-3 py-3 font-mono text-xs text-gray-600">{i + 1}</td>
                          <td className="px-3 py-3 font-mono text-xs text-gray-400">{e.walletAddress.slice(0, 6)}…{e.walletAddress.slice(-4)}</td>
                          <td className="px-3 py-3 text-xs text-gray-400">{e.domains[0]?.replace(/_/g, " ") ?? "—"}</td>
                          <td className="px-3 py-3 font-semibold text-green-400">{e.reputationScore}</td>
                          <td className="px-3 py-3 text-gray-300">{e.totalAssessments}</td>
                          <td className="px-3 py-3 text-gray-300">{(Number(e.accuracyRate) * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </main>
  );
}
