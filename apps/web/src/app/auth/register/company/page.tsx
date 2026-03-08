"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setUser } from "@/lib/auth";

const steps = ["Contact Info", "Company Details", "Funding Setup"];

const categories = [
  "solar", "wind", "ocean_tech", "carbon_capture",
  "green_hydrogen", "sustainable_agriculture", "ev_mobility",
  "energy_storage", "waste_tech", "biodiversity",
];

const stages = ["pre_seed", "seed", "series_a", "series_b", "growth"];

export default function CompanyRegisterPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [category, setCategory] = useState("solar");
  const [stage, setStage] = useState("seed");
  const [countryCode, setCountryCode] = useState("US");
  const [teamSize, setTeamSize] = useState("1–10");
  const [fundingGoal, setFundingGoal] = useState("$1M");
  const [description, setDescription] = useState("");

  async function finish() {
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role: "company", companyName, category, stage, countryCode, teamSize, fundingGoal, companyDescription: description }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Registration failed. Please try again.");
      setLoading(false);
      return;
    }
    // Also create the startup record in DB
    await fetch("/api/company/startup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName, description, category, stage, countryCode, teamSize, fundingGoal, companyEmail: email }),
    });
    setUser(data);
    router.push("/dashboard/company");
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/auth/register" className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-white transition">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to role selection
        </Link>

        <div className="mb-6 flex items-center gap-2">
          <span className="text-2xl">🌱</span>
          <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-0.5 text-xs font-medium text-green-400">
            Company Registration
          </span>
        </div>

        <div className="mb-8 flex gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col gap-1">
              <div className={`h-0.5 rounded-full transition-colors ${i <= step ? "bg-green-500" : "bg-white/10"}`} />
              <span className={`text-[10px] font-medium ${i === step ? "text-green-400" : "text-gray-600"}`}>{s}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Contact Information</h2>
              <Field label="Your Full Name" type="text" value={name} onChange={setName} placeholder="Jane Smith" color="green" />
              <Field label="Work Email" type="email" value={email} onChange={setEmail} placeholder="jane@yourcompany.com" color="green" />
              <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" color="green" />
              <button
                disabled={!name || !email || password.length < 8}
                onClick={() => setStep(1)}
                className="w-full rounded-lg bg-green-500 py-3 text-sm font-semibold text-black transition hover:bg-green-400 disabled:opacity-40"
              >
                Continue →
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Company Details</h2>
              <Field label="Company Name" type="text" value={companyName} onChange={setCompanyName} placeholder="SolarTech Ltd." color="green" />

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">Climate Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-green-500/40 focus:outline-none">
                  {categories.map((c) => (
                    <option key={c} value={c}>{c.replace(/_/g, " ").replace(/\b\w/g, (x) => x.toUpperCase())}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">Stage</label>
                  <select value={stage} onChange={(e) => setStage(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-green-500/40 focus:outline-none">
                    {stages.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">Team Size</label>
                  <select value={teamSize} onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-green-500/40 focus:outline-none">
                    {["1–10", "11–50", "51–200", "200+"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">Country</label>
                <input type="text" value={countryCode} onChange={(e) => setCountryCode(e.target.value.toUpperCase().slice(0, 2))}
                  maxLength={2} placeholder="US"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-green-500/40 focus:outline-none" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 rounded-lg border border-white/10 py-3 text-sm text-gray-400 hover:text-white transition">← Back</button>
                <button disabled={!companyName} onClick={() => setStep(2)}
                  className="flex-1 rounded-lg bg-green-500 py-3 text-sm font-semibold text-black hover:bg-green-400 disabled:opacity-40 transition">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Funding Setup</h2>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">Funding Goal</label>
                <select value={fundingGoal} onChange={(e) => setFundingGoal(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-green-500/40 focus:outline-none">
                  {["$250k", "$500k", "$1M", "$2M", "$5M", "$10M", "$25M+"].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                  Company Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe your climate solution, technology, and impact model in 2–3 sentences…"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-green-500/40 focus:outline-none resize-none"
                />
              </div>

              <div className="rounded-lg border border-green-500/10 bg-green-500/5 p-3 text-xs text-gray-400">
                After registration, your startup will enter the DVN queue for expert assessment. Funding is unlocked as milestones are verified.
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 rounded-lg border border-white/10 py-3 text-sm text-gray-400 hover:text-white transition">← Back</button>
                <button onClick={finish} disabled={loading || !description}
                  className="flex-1 rounded-lg bg-green-500 py-3 text-sm font-semibold text-black hover:bg-green-400 disabled:opacity-50 transition">
                  {loading ? "Creating…" : "Submit →"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm font-light text-gray-600">
          Already registered?{" "}
          <Link href="/auth/login" className="font-medium text-green-400 hover:text-green-300">Sign in</Link>
        </p>
      </div>
    </main>
  );
}

function Field({ label, type, value, onChange, placeholder, color }: {
  label: string; type: string; value: string; onChange: (v: string) => void; placeholder: string; color: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-${color}-500/40 focus:outline-none`} />
    </div>
  );
}
