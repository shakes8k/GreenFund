"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setUser } from "@/lib/auth";

const steps = ["Personal Info", "Investor Profile", "Preferences"];

export default function InvestorRegisterPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [investorType, setInvestorType] = useState<"individual" | "institutional" | "family_office">("individual");
  const [riskAppetite, setRiskAppetite] = useState<"conservative" | "balanced" | "aggressive">("balanced");
  const [investmentRange, setInvestmentRange] = useState("$1k – $50k");

  async function finish() {
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role: "investor", investorType, riskAppetite, investmentRange }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Registration failed. Please try again.");
      setLoading(false);
      return;
    }
    setUser(data);
    router.push("/dashboard/investor");
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back */}
        <Link href="/auth/register" className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-white transition">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to role selection
        </Link>

        {/* Role badge */}
        <div className="mb-6 flex items-center gap-2">
          <span className="text-2xl">💼</span>
          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-0.5 text-xs font-medium text-blue-400">
            Investor Registration
          </span>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col gap-1">
              <div className={`h-0.5 rounded-full transition-colors ${i <= step ? "bg-blue-500" : "bg-white/10"}`} />
              <span className={`text-[10px] font-medium ${i === step ? "text-blue-400" : "text-gray-600"}`}>{s}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Personal Information</h2>
              <Field label="Full Name" type="text" value={name} onChange={setName} placeholder="Alex Johnson" />
              <Field label="Email Address" type="email" value={email} onChange={setEmail} placeholder="alex@example.com" />
              <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" />
              <button
                disabled={!name || !email || password.length < 8}
                onClick={() => setStep(1)}
                className="w-full rounded-lg bg-blue-500 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-40"
              >
                Continue →
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-white">Investor Profile</h2>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">Investor Type</label>
                <div className="grid gap-2">
                  {([
                    { value: "individual", label: "Individual", desc: "Personal capital, accredited or retail" },
                    { value: "institutional", label: "Institutional", desc: "Fund, VC, pension, endowment" },
                    { value: "family_office", label: "Family Office", desc: "Single or multi-family office" },
                  ] as const).map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => setInvestorType(value)}
                      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${investorType === value ? "border-blue-500/40 bg-blue-500/10" : "border-white/5 bg-white/[0.02] hover:border-white/10"}`}
                    >
                      <div className={`mt-0.5 h-4 w-4 rounded-full border-2 ${investorType === value ? "border-blue-400 bg-blue-400" : "border-gray-600"}`} />
                      <div>
                        <p className="font-medium text-white">{label}</p>
                        <p className="text-xs font-light text-gray-500">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 rounded-lg border border-white/10 py-3 text-sm text-gray-400 hover:text-white transition">← Back</button>
                <button onClick={() => setStep(2)} className="flex-1 rounded-lg bg-blue-500 py-3 text-sm font-semibold text-white hover:bg-blue-400 transition">Continue →</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-white">Investment Preferences</h2>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">Risk Appetite</label>
                <div className="grid gap-2">
                  {([
                    { value: "conservative", label: "Conservative", desc: "6–9% expected returns, solar & wind", color: "blue" },
                    { value: "balanced", label: "Balanced", desc: "12–22% expected returns, diversified", color: "green" },
                    { value: "aggressive", label: "Aggressive", desc: "20–100% expected, early-stage bets", color: "red" },
                  ] as const).map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => setRiskAppetite(value)}
                      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${riskAppetite === value ? "border-blue-500/40 bg-blue-500/10" : "border-white/5 bg-white/[0.02] hover:border-white/10"}`}
                    >
                      <div className={`mt-0.5 h-4 w-4 rounded-full border-2 ${riskAppetite === value ? "border-blue-400 bg-blue-400" : "border-gray-600"}`} />
                      <div>
                        <p className="font-medium text-white">{label}</p>
                        <p className="text-xs font-light text-gray-500">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">Expected Annual Investment Range</label>
                <select
                  value={investmentRange}
                  onChange={(e) => setInvestmentRange(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-blue-500/40 focus:outline-none"
                >
                  {["Under $1k", "$1k – $50k", "$50k – $500k", "$500k – $5M", "Over $5M"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 rounded-lg border border-white/10 py-3 text-sm text-gray-400 hover:text-white transition">← Back</button>
                <button
                  onClick={finish}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-green-500 py-3 text-sm font-semibold text-black hover:bg-green-400 disabled:opacity-50 transition"
                >
                  {loading ? "Creating account…" : "Create Account →"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm font-light text-gray-600">
          Already registered?{" "}
          <Link href="/auth/login" className="font-medium text-blue-400 hover:text-blue-300">Sign in</Link>
        </p>
      </div>
    </main>
  );
}

function Field({ label, type, value, onChange, placeholder }: {
  label: string; type: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-blue-500/40 focus:outline-none"
      />
    </div>
  );
}
