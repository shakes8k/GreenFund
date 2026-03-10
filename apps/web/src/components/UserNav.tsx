"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUser, logout, type AuthUser, type UserRole } from "@/lib/auth";

const roleNav: Record<UserRole, { href: string; label: string }[]> = {
  investor: [
    { href: "/dashboard/investor", label: "Dashboard" },
    { href: "/startups", label: "Startups" },
    { href: "/secondary", label: "Secondary Market" },
    { href: "/pools", label: "Risk Pools" },
    { href: "/ledger", label: "Impact Ledger" },
  ],
  company: [
    { href: "/dashboard/company", label: "Dashboard" },
    { href: "/startups", label: "Market" },
    { href: "/ledger", label: "Ledger" },
  ],
  analyst: [
    { href: "/dashboard/analyst", label: "Dashboard" },
    { href: "/dvn", label: "DVN Queue" },
    { href: "/startups", label: "Startups" },
    { href: "/ledger", label: "Ledger" },
  ],
  admin: [
    { href: "/admin", label: "Review Queue" },
    { href: "/startups", label: "All Startups" },
  ],
};

const roleStyle: Record<UserRole, string> = {
  investor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  company:  "bg-green-500/10 text-green-400 border-green-500/20",
  analyst:  "bg-purple-500/10 text-purple-400 border-purple-500/20",
  admin:    "bg-red-500/10 text-red-400 border-red-500/20",
};

const roleLabel: Record<UserRole, string> = {
  investor: "Investor",
  company:  "Company",
  analyst:  "Analyst",
  admin:    "Admin",
};

export function UserNav() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setUser(getUser());
  }, [pathname]);

  function handleLogout() {
    logout();
    setUser(null);
    setOpen(false);
    router.push("/");
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2" suppressHydrationWarning>
        <Link
          href="/auth/login"
          className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-white/40 hover:text-white"
        >
          Sign In
        </Link>
        <Link
          href="/auth/register"
          className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-400"
        >
          Register
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Role-aware nav links — desktop only */}
      <nav className="hidden items-center gap-1 md:flex">
        {roleNav[user.role].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-white/30 hover:bg-white/20"
        >
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${roleStyle[user.role]}`}>
            {roleLabel[user.role]}
          </span>
          <span className="max-w-[96px] truncate">{user.name.split(" ")[0]}</span>
          <svg className="h-3 w-3 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#0a0f1a] shadow-2xl">
              <div className="border-b border-white/5 px-4 py-3">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <Link
                href={`/dashboard/${user.role}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
                Dashboard
              </Link>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Account Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 transition hover:bg-white/5"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
