"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setUser } from "@/lib/auth";

const steps = ["Personal Info", "Expertise"];

const domains = [
  { value: "climate_science", label: "Climate Science" },
  { value: "renewable_energy", label: "Renewable Energy" },
  { value: "carbon_markets", label: "Carbon Markets" },
  { value: "policy_analysis", label: "Policy Analysis" },
  { value: "marine_biology", label: "Marine Biology" },
  { value: "sustainable_finance", label: "Sustainable Finance" },
  { value: "engineering", label: "Engineering" },
  { value: "ecology", label: "Ecology" },
];

export default function AnalystRegisterPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [domain, setDomain] = useState("climate_science");
  const [experience, setExperience] = useState("3–5 years");
  const [linkedin, setLinkedin] = useState("");

  async function finish() {
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role: "analyst", domain, experience }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Registration failed. Please try again.");
      setLoading(false);
      return;
    }
    // Also register as DVN expert
    await fetch("/api/dvn/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, domain, stakedTokens: 0 }),
    });
    setUser(data);
    router.push("/dashboard/analyst");
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/auth/register" className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-white transition">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to role selection
        </Link>

        <div className="mb-6 flex items-center gap-2">
          <span className="text-2xl">🔬</span>
          <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-0.5 text-xs font-medium text-purple-400">
            Analyst Registration
          </span>
        </div>

        <div className="mb-8 flex gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col gap-1">
              <div className={`h-0.5 rounded-full transition-colors ${i <= step ? "bg-purple-500" : "bg-white/10"}`} />
              <span className={`text-[10px] font-medium ${i === step ? "text-purple-400" : "text-gray-600"}`}>{s}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Personal Information</h2>
              {[
                { label: "Full Name", type: "text", value: name, set: setName, ph: "Dr. Maria Chen" },
                { label: "Email Address", type: "email", value: email, set: setEmail, ph: "maria@university.edu" },
                { label: "Password", type: "password", value: password, set: setPassword, ph: "Min. 8 characters" },
              ].map(({ label, type, value, set, ph }) => (
                <div key={label}>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">{label}</label>
                  <input type={type} value={value} onChange={(e) => set(e.target.value)} placeholder={ph}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-purple-500/40 focus:outline-none" />
                </div>
              ))}
              <button disabled={!name || !email || password.length < 8} onClick={() => setStep(1)}
                className="w-full rounded-lg bg-purple-500 py-3 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:opacity-40">
                Continue →
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Domain Expertise</h2>
              <p className="text-sm font-light text-gray-500">
                Choose your primary area of climate expertise. You'll be able to write reports on companies in your domain.
              </p>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">Primary Domain</label>
                <div className="grid grid-cols-2 gap-2">
                  {domains.map(({ value, label }) => (
                    <button key={value} onClick={() => setDomain(value)}
                      className={`rounded-lg border p-3 text-left text-sm transition ${domain === value ? "border-purple-500/40 bg-purple-500/10 text-white" : "border-white/5 bg-white/[0.02] text-gray-500 hover:border-white/10 hover:text-gray-300"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">Years of Experience</label>
                <select value={experience} onChange={(e) => setExperience(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-purple-500/40 focus:outline-none">
                  {["Under 2 years", "2–3 years", "3–5 years", "5–10 years", "10+ years"].map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">LinkedIn Profile (optional)</label>
                <input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-purple-500/40 focus:outline-none" />
              </div>

              <div className="rounded-lg border border-purple-500/10 bg-purple-500/5 p-3 text-xs text-gray-400">
                As a GreenFund analyst you can write reports on verified companies. Your reports are visible to investors on each company's profile.
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 rounded-lg border border-white/10 py-3 text-sm text-gray-400 hover:text-white transition">← Back</button>
                <button onClick={finish} disabled={loading}
                  className="flex-1 rounded-lg bg-green-500 py-3 text-sm font-semibold text-black hover:bg-green-400 disabled:opacity-50 transition">
                  {loading ? "Creating account…" : "Join as Analyst →"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm font-light text-gray-600">
          Already registered?{" "}
          <Link href="/auth/login" className="font-medium text-purple-400 hover:text-purple-300">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
