"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setUser, dashboardPath } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Check admin first
    const adminCheck = await fetch("/api/admin/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then((r) => r.json()).catch(() => ({ isAdmin: false }));

    if (adminCheck.isAdmin) {
      setUser({ id: "adm-1", name: "Admin", email, role: "admin", createdAt: new Date().toISOString() });
      router.push("/admin");
      return;
    }

    // Verify against DB
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Invalid email or password");
      setLoading(false);
      return;
    }

    setUser(data);
    router.push(dashboardPath(data.role));
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 ring-1 ring-green-500/20">
              <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="mt-1 text-sm font-light text-gray-500">Sign in to your GreenFund account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">Email address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-green-500/40 focus:outline-none"
                placeholder="you@example.com" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-green-500/40 focus:outline-none"
                placeholder="••••••••" />
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
                {error}{" "}
                <Link href="/auth/register" className="font-medium underline hover:text-red-300">Register here</Link>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-green-500 py-3 text-sm font-semibold text-black transition hover:bg-green-400 disabled:opacity-50">
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-light text-gray-500">
            Don't have an account?{" "}
            <Link href="/auth/register" className="font-medium text-green-400 hover:text-green-300">Register</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
