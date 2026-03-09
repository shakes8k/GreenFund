import Link from "next/link";
import { FaqSection } from "@/components/FaqSection";

const roles = [
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      </svg>
    ),
    iconBg: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
    title: "Investors",
    tagline: "Deploy capital with precision",
    border: "border-blue-500/20",
    glow: "hover:border-blue-500/40",
    bg: "hover:bg-blue-500/[0.03]",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    topAccent: "bg-blue-500",
    href: "/auth/register/investor",
    features: [
      "Browse AI-verified climate startups",
      "Co-invest in managed risk pools",
      "Real-time portfolio & impact tracking",
      "Climate scenario stress-testing",
      "On-chain transparent returns",
    ],
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3C7 3 3 7.5 3 12c0 2.4 1 4.6 2.6 6.2C7 19.7 9.4 21 12 21s5-1.3 6.4-2.8C20 16.6 21 14.4 21 12c0-4.5-4-9-9-9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18" />
      </svg>
    ),
    iconBg: "bg-green-500/10 text-green-400 ring-green-500/20",
    title: "Companies",
    tagline: "Raise capital, prove impact",
    border: "border-green-500/20",
    glow: "hover:border-green-500/40",
    bg: "hover:bg-green-500/[0.03]",
    badge: "bg-green-500/10 text-green-400 border-green-500/20",
    topAccent: "bg-green-500",
    href: "/auth/register/company",
    features: [
      "List your climate startup in minutes",
      "Milestone-locked smart contract funding",
      "Expert DVN validation boosts credibility",
      "IoT oracle integration for impact proof",
      "Build a permanent on-chain impact record",
    ],
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
    iconBg: "bg-purple-500/10 text-purple-400 ring-purple-500/20",
    title: "Analysts",
    tagline: "Earn from your expertise",
    border: "border-purple-500/20",
    glow: "hover:border-purple-500/40",
    bg: "hover:bg-purple-500/[0.03]",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    topAccent: "bg-purple-500",
    href: "/auth/register/analyst",
    features: [
      "Stake GFT tokens, assess startups",
      "Earn fees for accurate verdicts",
      "7-day challenge window protects consensus",
      "Build on-chain reputation score",
      "Slash bad actors, protect the ecosystem",
    ],
  },
];

const steps = [
  { n: "01", title: "Register", desc: "Choose your role — investor, company, or analyst — and set up your profile in under 2 minutes." },
  { n: "02", title: "Connect", desc: "Link your wallet on Polygon Amoy. No wallet yet? Browse read-only or use a custodial option." },
  { n: "03", title: "Validate", desc: "DVN experts stake tokens and assess startup claims. AI surfaces red flags and impact scores." },
  { n: "04", title: "Fund", desc: "Smart contracts release capital automatically when IoT oracles confirm real-world milestones." },
];

const stats = [
  {
    value: "2.4M",
    label: "Tonnes CO₂ tracked",
    accent: "border-l-green-500",
    icon: (
      <svg className="h-4 w-4 text-green-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3C7 3 3 7.5 3 12c0 3.5 2 6.5 5 8l1-3h6l1 3c3-1.5 5-4.5 5-8 0-4.5-4-9-9-9z" />
      </svg>
    ),
  },
  {
    value: "142",
    label: "Startups funded",
    accent: "border-l-emerald-500",
    icon: (
      <svg className="h-4 w-4 text-emerald-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    value: "₹3,200 Cr",
    label: "Capital deployed",
    accent: "border-l-teal-500",
    icon: (
      <svg className="h-4 w-4 text-teal-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: "1,200",
    label: "Expert validators",
    accent: "border-l-sky-500",
    icon: (
      <svg className="h-4 w-4 text-sky-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const faqs = [
  {
    q: "How is impact verified?",
    a: "DVN experts stake tokens to validate startup claims. IoT oracles (satellite imagery, sensors) confirm physical milestones before any capital is released.",
  },
  {
    q: "What blockchain does GreenFund use?",
    a: "Polygon Amoy testnet, with mainnet deployment planned. All contracts are audited and open-source.",
  },
  {
    q: "What's the minimum investment?",
    a: "Individual investors can start from ₹42,000 in the BioFrontier speculative pool, or ₹84,000 in the conservative Green Shield pool.",
  },
  {
    q: "How are analyst rewards calculated?",
    a: "Analysts earn a percentage of the capital unlocked for assessments they've validated. Bad assessments risk slashing of staked GFT tokens.",
  },
];

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: "AI-Powered Due Diligence",
    desc: "Scenario simulations model how each startup performs under carbon tax hikes, policy shifts, extreme weather events — giving you probabilistic, impact-weighted return projections.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Milestone-Locked Smart Contracts",
    desc: "Capital is released in tranches — automatically — only when IoT oracles confirm real-world milestones: satellite imagery, sensor data, third-party audits. No delays, no discretion.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Decentralised Verification Network",
    desc: "1,200+ domain experts stake GFT tokens to validate claims. Consensus-based scoring removes single points of failure. Bad actors are slashed; accurate assessors earn rewards.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Public Impact Ledger",
    desc: "Every funded project reports CO₂ reduction, jobs created, and SDG progress on-chain. Fully auditable by anyone, forever. Not a PDF — a living, verifiable record.",
  },
];

export default function LandingPage() {
  return (
    <>
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid-soft opacity-45" />

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="gf-hero relative mx-auto max-w-7xl px-6 pb-20 pt-24 text-center">
          <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl" />

          <h1 className="relative text-5xl font-bold tracking-tight md:text-7xl lg:text-[88px]">
            <span className="gradient-text">Where Capital</span>
            <br />
            <span className="text-white">Meets Climate Impact.</span>
          </h1>

          <p className="relative mx-auto mt-6 max-w-2xl text-lg font-light text-gray-400 leading-relaxed">
            GreenFund is the first AI-powered climate investment platform with decentralised expert verification,
            milestone-locked smart contracts, and a public impact ledger — built for investors, startups, and analysts.
          </p>

          <div className="relative mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/auth/register"
              className="gf-btn-primary px-8 py-3.5 text-sm font-semibold"
            >
              Get Started →
            </Link>
            <Link
              href="/auth/login"
              className="gf-btn-secondary px-8 py-3.5 text-sm font-semibold"
            >
              Sign In
            </Link>
          </div>

          {/* Stats */}
          <div className="gf-card relative mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/5 md:grid-cols-4">
            {stats.map(({ value, label, accent, icon }) => (
              <div key={label} className={`stat-cell-bg px-6 py-8 border-l-2 ${accent} transition-colors`}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  {icon}
                </div>
                <p className="text-3xl font-bold gradient-text">{value}</p>
                <p className="mt-1 text-sm font-light text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Who is it for ─────────────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-7xl px-6 pb-28">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-green-500">Built for three ecosystems</p>
            <h2 className="mt-2 text-4xl font-bold text-white">Choose Your Role</h2>
            <p className="mt-3 text-gray-500 font-light">Each role unlocks a different set of tools, dashboards, and earning mechanisms.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {roles.map(({ icon, iconBg, title, tagline, border, glow, bg, badge, topAccent, href, features: featureList }) => (
              <div
                key={title}
                className={`gf-card-interactive gf-card-glow group relative flex flex-col overflow-hidden rounded-2xl border ${border} ${glow} ${bg} transition-all duration-300`}
              >
                {/* Animated top accent strip */}
                <div className={`h-[3px] w-full ${topAccent} opacity-60 group-hover:opacity-100 transition-opacity`} />

                <div className="flex flex-col flex-1 p-8">
                  <div className="mb-5">
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${iconBg}`}>
                      {icon}
                    </div>
                    <span className={`block rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit ${badge}`}>
                      {title}
                    </span>
                    <h3 className="mt-3 text-xl font-semibold text-white">{tagline}</h3>
                  </div>

                  <ul className="mb-8 flex-1 space-y-2.5">
                    {featureList.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm font-light text-gray-400">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={href}
                    className="gf-btn-secondary block w-full py-3 text-center text-sm font-semibold transition group-hover:bg-gradient-to-r group-hover:from-indigo-500 group-hover:to-cyan-500 group-hover:text-white"
                  >
                    Register as {title.slice(0, -1)} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How It Works ──────────────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-7xl px-6 pb-28">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-green-500">Simple by design</p>
            <h2 className="mt-2 text-4xl font-bold text-white">How It Works</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            {steps.map(({ n, title, desc }, i) => (
              <div key={n} className="relative flex flex-col">
                {i < steps.length - 1 && (
                  <div className="absolute left-full top-6 hidden h-px w-8 -translate-y-1/2 bg-gradient-to-r from-green-500/30 to-transparent md:block" />
                )}
                {/* Gradient step number circle */}
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/25 to-cyan-500/10 border border-indigo-400/25 shadow-sm shadow-indigo-500/15">
                  <span className="font-mono text-sm font-bold text-green-400">{n}</span>
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
                <p className="text-sm font-light leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Platform Features ─────────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-7xl px-6 pb-28">
          <div className="gf-card overflow-hidden rounded-3xl">
            <div className="grid md:grid-cols-2">
              {features.map(({ icon, title, desc }, i) => (
                <div
                  key={title}
                  className={`p-10 ${i === 0 ? "border-b border-white/5 md:border-b-0 md:border-r" : i === 1 ? "border-b border-white/5 md:border-b-0" : i === 2 ? "md:border-r border-white/5" : ""}`}
                >
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300">
                    {icon}
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-white">{title}</h3>
                  <p className="font-light leading-relaxed text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-3xl px-6 pb-28">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-white">Common Questions</h2>
          </div>
          <FaqSection faqs={faqs} />
        </section>

        {/* ── CTA Banner ────────────────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-7xl px-6 pb-20">
          <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/35 via-[#0b1226] to-[#060b17] p-16 text-center">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
            {/* Radial gradient overlay */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(34,197,94,0.15)_0%,_transparent_70%)]" />
            <h2 className="relative text-4xl font-bold text-white">Ready to make an impact?</h2>
            <p className="relative mt-3 font-light text-gray-400">
              Join 1,200+ validators, 142 startups, and dozens of institutional investors on GreenFund.
            </p>
            <div className="relative mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/auth/register"
                className="gf-btn-primary px-10 py-4 text-sm font-semibold"
              >
                Create Your Account →
              </Link>
              <Link
                href="/auth/login"
                className="gf-btn-secondary px-10 py-4 text-sm font-semibold"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t" style={{ borderColor: "var(--nav-border)", backgroundColor: "var(--nav-bg)" }}>
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">

            {/* Brand */}
            <div className="flex flex-col items-center gap-2 md:items-start">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 ring-1 ring-green-500/30">
                  <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-lg font-semibold tracking-tight">
                  <span className="gradient-text">Green</span>
                  <span className="text-white">Fund</span>
                </span>
              </div>
              <p className="text-xs font-light text-gray-500 text-center md:text-left max-w-xs">
                AI-powered climate investment platform — connecting capital with verified climate impact.
              </p>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-3">
              {/* Instagram */}
              <a
                href="https://instagram.com/greenfund"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition hover:border-pink-500/40 hover:bg-pink-500/10 hover:text-pink-400"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                </svg>
              </a>

              {/* X (Twitter) */}
              <a
                href="https://x.com/greenfund"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* Facebook */}
              <a
                href="https://facebook.com/greenfund"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="mt-8 border-t pt-6 text-center text-xs font-light text-gray-600" style={{ borderColor: "var(--nav-border)" }}>
            © {new Date().getFullYear()} GreenFund. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}

