import Link from "next/link";
import { prisma } from "@greenfund/db";
import { FaqSection } from "@/components/FaqSection";

/* ── Live data ────────────────────────────────────────────────────────────── */

async function getActiveRounds() {
  try {
    return await prisma.fundraisingRequest.findMany({
      where: { status: "active" },
      include: {
        startup: { select: { id: true, name: true, category: true, co2ReductionTonnesPerYear: true, verificationStatus: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
  } catch {
    return [];
  }
}

async function getVerifiedStartups() {
  try {
    return await prisma.startup.findMany({
      where: { verificationStatus: "verified" },
      select: { id: true, name: true, category: true, co2ReductionTonnesPerYear: true, totalFundedUSD: true, stage: true, onboarding: { select: { logoUrl: true } } },
      orderBy: { totalFundedUSD: "desc" },
      take: 3,
    });
  } catch {
    return [];
  }
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const catLabel = (c: string) => c.replace(/_/g, " ").replace(/\b\w/g, (x) => x.toUpperCase());

const catColor: Record<string, string> = {
  solar_energy: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  wind_energy: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  carbon_capture: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  sustainable_agriculture: "bg-lime-500/10 text-lime-400 border-lime-500/20",
  clean_water: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  electric_mobility: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  green_buildings: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  diverse: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const fmtINR = (n: number) =>
  n >= 1_00_00_000 ? `₹${(n / 1_00_00_000).toFixed(1)} Cr`
  : n >= 1_00_000  ? `₹${(n / 1_00_000).toFixed(0)}L`
  : `₹${n.toLocaleString("en-IN")}`;

/* ── Static content ──────────────────────────────────────────────────────── */

const stats = [
  { value: "₹3,200 Cr", label: "Capital Deployed", accent: "text-green-400" },
  { value: "142", label: "Startups Funded", accent: "text-emerald-400" },
  { value: "2.4M t", label: "CO₂ Tracked", accent: "text-teal-400" },
  { value: "1,200+", label: "Expert Validators", accent: "text-sky-400" },
];

const trustPillars = [
  {
    title: "Every rupee, verified.",
    desc: "1,200+ domain experts stake tokens to validate impact claims. Consensus scoring removes bias. Bad actors are slashed. Only the real deal gets funded.",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    color: "text-green-400",
    border: "border-green-500/15",
    glow: "from-green-500/[0.06]",
  },
  {
    title: "Real equity, not promises.",
    desc: "You invest directly into a company's fundraising round and receive a defined equity stake. No fund manager fees, no blind pooling — your name, your shares.",
    icon: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z",
    color: "text-blue-400",
    border: "border-blue-500/15",
    glow: "from-blue-500/[0.06]",
  },
  {
    title: "Impact you can measure.",
    desc: "Every investment shows your exact CO₂ contribution, jobs attributed to your capital, and milestone progress — updated live. Not a PDF. A living record.",
    icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "text-purple-400",
    border: "border-purple-500/15",
    glow: "from-purple-500/[0.06]",
  },
];

const steps = [
  {
    n: "01",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    title: "Create your account",
    desc: "Sign up as an investor in under 2 minutes. Set your risk appetite, preferred sectors, and investment range.",
  },
  {
    n: "02",
    icon: "M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z",
    title: "Browse verified startups",
    desc: "Explore AI-scored, expert-validated climate companies with active fundraising rounds. See financials, equity offered, and impact data.",
  },
  {
    n: "03",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    title: "Fund a round",
    desc: "Submit your investment offer. The company reviews and accepts. Your equity is recorded and confirmed — directly, no intermediary.",
  },
  {
    n: "04",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    title: "Track impact & returns",
    desc: "Your portfolio dashboard shows live equity value, CO₂ attributed to your capital, and milestone progress per company.",
  },
];

const testimonials = [
  {
    quote: "GreenFund gave me direct equity in a solar company for the first time. I can see exactly what my ₹10 lakh is doing — not just a vague ESG label.",
    name: "Priya Subramaniam",
    title: "Portfolio Manager, Bengaluru",
    initials: "PS",
    color: "from-emerald-500/20 to-green-500/5",
  },
  {
    quote: "The expert validation layer is what makes this different. I know the CO₂ numbers aren't marketing — they've been staked on by 40+ domain experts.",
    name: "Rohan Mehta",
    title: "Angel Investor, Mumbai",
    initials: "RM",
    color: "from-blue-500/20 to-indigo-500/5",
  },
  {
    quote: "As a company, getting listed was straightforward. The onboarding process was rigorous but fair, and we had our first investor offer within a week.",
    name: "Ananya Krishnan",
    title: "Founder, WindBridge Energy",
    initials: "AK",
    color: "from-purple-500/20 to-violet-500/5",
  },
];

const faqs = [
  {
    q: "How is impact actually verified?",
    a: "DVN experts — domain scientists, engineers, and climate analysts — stake GFT tokens to validate each startup's impact claims. If their assessment is later found wrong, tokens are slashed. This puts real skin in the game on every number you see.",
  },
  {
    q: "What do I actually own when I invest?",
    a: "You receive equity in the company proportional to your investment relative to the total fundraising round. For example, if a company raises ₹1 Cr at ₹10 Cr valuation (10% equity) and you put in ₹10 lakh, you receive 1% equity.",
  },
  {
    q: "What is the minimum investment?",
    a: "Each fundraising round sets its own minimum — typically between ₹50,000 and ₹5,00,000. You can see the minimum before submitting any offer.",
  },
  {
    q: "How do I exit my investment?",
    a: "GreenFund is early-stage equity. Exits happen at secondary sales, IPOs, or acquistions — typically 5–8 years. This is long-term patient capital, not a liquid market.",
  },
  {
    q: "Are companies vetted before listing?",
    a: "Yes. Every company must complete a legal onboarding process and be manually verified by GreenFund admins before they can raise funds. DVN experts then perform independent impact assessment.",
  },
];

const footerLinks = {
  Invest: [
    { label: "Browse Startups", href: "/startups" },
    { label: "Active Rounds", href: "/startups" },
    { label: "Risk Pools", href: "/pools" },
    { label: "Impact Ledger", href: "/ledger" },
  ],
  Platform: [
    { label: "How It Works", href: "#how-it-works" },
    { label: "DVN Network", href: "/dvn" },
    { label: "AI Scoring", href: "/startups" },
    { label: "For Companies", href: "/auth/register/company" },
  ],
  Learn: [
    { label: "Climate 101", href: "#" },
    { label: "Investing Basics", href: "#" },
    { label: "FAQ", href: "#faq" },
    { label: "Impact Methodology", href: "#" },
  ],
  Company: [
    { label: "About GreenFund", href: "#" },
    { label: "Analyst Program", href: "/auth/register/analyst" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default async function LandingPage() {
  const [activeRounds, verifiedStartups] = await Promise.all([
    getActiveRounds(),
    getVerifiedStartups(),
  ]);

  return (
    <>
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-7xl px-6 pb-0 pt-20 md:pt-28">
          {/* Ambient blobs */}
          <div className="pointer-events-none absolute -top-20 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-green-500/[0.07] blur-3xl" />
          <div className="pointer-events-none absolute top-40 -right-40 h-[400px] w-[400px] rounded-full bg-emerald-500/[0.05] blur-3xl" />
          <div className="pointer-events-none absolute top-60 -left-40 h-[300px] w-[300px] rounded-full bg-teal-500/[0.05] blur-3xl" />

          <div className="relative text-center">
            {/* Eyebrow */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
              <span className="text-xs font-medium text-green-400">
                {activeRounds.length > 0
                  ? `${activeRounds.length} active fundraising round${activeRounds.length !== 1 ? "s" : ""} now live`
                  : "India's Climate Investment Platform"}
              </span>
            </div>

            {/* Headline */}
            <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-white md:text-7xl lg:text-[80px] lg:leading-[1.05]">
              Where Profit{" "}
              <em className="gradient-text not-italic" style={{ fontStyle: "italic", fontFamily: "Georgia, 'Times New Roman', serif" }}>powers</em>{" "}
              <span className="gradient-text">the Planet.</span>
            </h1>

            <p className="relative mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-gray-400">
              Invest directly in verified Indian climate tech companies. Real equity in solar, wind,
              carbon capture, and clean mobility startups — with transparent impact tracking built in.
            </p>

            <div className="relative mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="#active-rounds"
                className="rounded-xl bg-green-500 px-8 py-4 text-sm font-semibold text-black shadow-lg shadow-green-500/30 transition hover:bg-green-400"
              >
                View Live Rounds →
              </Link>
              <Link
                href="/auth/register"
                className="rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Create Account
              </Link>
            </div>

            {/* Trust line */}
            <p className="relative mt-8 text-xs font-light text-gray-600">
              Trusted by 500+ investors &nbsp;·&nbsp; ₹3,200 Cr deployed &nbsp;·&nbsp; 142 verified startups &nbsp;·&nbsp; 1,200+ expert validators
            </p>
          </div>

          {/* ── Stats band ── */}
          <div className="relative mt-20 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="grid grid-cols-2 divide-x divide-y divide-white/5 md:grid-cols-4 md:divide-y-0">
              {stats.map(({ value, label, accent }) => (
                <div key={label} className="px-8 py-8 text-center">
                  <p className={`text-3xl font-bold ${accent}`}>{value}</p>
                  <p className="mt-1 text-sm font-light text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ACTIVE ROUNDS ─────────────────────────────────────────────────── */}
        <section id="active-rounds" className="relative mx-auto max-w-7xl px-6 py-28">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-green-500">Live now</p>
              <h2 className="mt-2 text-4xl font-bold text-white">Active Investment Rounds</h2>
              <p className="mt-3 max-w-xl font-light text-gray-500">
                Companies currently raising capital on GreenFund. Each has been admin-verified and expert-assessed.
              </p>
            </div>
            <Link href="/startups" className="hidden shrink-0 rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium text-gray-400 transition hover:text-white md:block">
              See all startups →
            </Link>
          </div>

          {activeRounds.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 py-20 text-center">
              <p className="text-gray-500 font-light">No active rounds right now.</p>
              <p className="mt-1 text-sm text-gray-600">Check back soon, or browse all verified startups.</p>
              <Link href="/startups" className="mt-4 inline-block rounded-lg bg-green-500/10 px-5 py-2.5 text-sm font-medium text-green-400 hover:bg-green-500/20 transition">
                Browse Startups
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {activeRounds.map((round) => {
                const raising = Number(round.amountRaisingINR);
                const raised = Number(round.amountRaisedINR);
                const pct = raising > 0 ? Math.min((raised / raising) * 100, 100) : 0;
                const equity = Number(round.equityPercent);
                const valuation = Number(round.valuationINR);
                const minInvest = Number(round.minInvestmentINR);
                const catStyle = catColor[round.startup.category] ?? catColor.diverse!;

                return (
                  <Link
                    key={round.id}
                    href={`/startups/${round.startup.id}`}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] transition-all duration-300 hover:border-green-500/30 hover:bg-white/[0.04] hover:shadow-lg hover:shadow-green-500/5"
                  >
                    {/* Top accent line that fills on hover */}
                    <div className="h-[2px] w-full bg-gradient-to-r from-green-500/60 via-emerald-500/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                    <div className="flex flex-1 flex-col p-6">
                      {/* Header */}
                      <div className="mb-5 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-white group-hover:text-green-100 transition-colors">
                            {round.startup.name}
                          </h3>
                          <span className={`mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${catStyle}`}>
                            {catLabel(round.startup.category)}
                          </span>
                        </div>
                        <span className="shrink-0 rounded-full bg-green-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-green-400">
                          {round.fundingRound}
                        </span>
                      </div>

                      {/* Key numbers */}
                      <div className="mb-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-white/[0.03] px-4 py-3">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-600">Raising</p>
                          <p className="mt-0.5 text-base font-bold text-white">{fmtINR(raising)}</p>
                        </div>
                        <div className="rounded-xl bg-white/[0.03] px-4 py-3">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-600">Equity</p>
                          <p className="mt-0.5 text-base font-bold text-green-400">{equity.toFixed(1)}%</p>
                        </div>
                        <div className="rounded-xl bg-white/[0.03] px-4 py-3">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-600">Valuation</p>
                          <p className="mt-0.5 text-base font-bold text-white">{fmtINR(valuation)}</p>
                        </div>
                        <div className="rounded-xl bg-white/[0.03] px-4 py-3">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-600">Min. Invest</p>
                          <p className="mt-0.5 text-base font-bold text-white">{fmtINR(minInvest)}</p>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mt-auto">
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="text-gray-500">{fmtINR(raised)} raised</span>
                          <span className={`font-semibold ${pct >= 75 ? "text-green-400" : pct >= 40 ? "text-yellow-400" : "text-gray-400"}`}>
                            {pct.toFixed(0)}% funded
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5">
                          <div
                            className="h-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="mt-5 flex items-center justify-between">
                        <span className="text-xs text-gray-600">
                          CO₂ {Number(round.startup.co2ReductionTonnesPerYear).toLocaleString()} t/yr
                        </span>
                        <span className="text-xs font-medium text-green-500 group-hover:text-green-400 transition-colors">
                          View Round →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── COMPANY SPOTLIGHTS ────────────────────────────────────────────── */}
        {verifiedStartups.length > 0 && (
          <section className="relative mx-auto max-w-7xl px-6 pb-28">
            <div className="mb-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-green-500">Portfolio</p>
              <h2 className="mt-2 text-4xl font-bold text-white">Meet the companies</h2>
              <p className="mt-3 font-light text-gray-500">Verified startups changing how India powers, moves, and feeds itself.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {verifiedStartups.map((s) => {
                const catStyle = catColor[s.category] ?? catColor.diverse!;
                return (
                  <Link key={s.id} href={`/startups/${s.id}`}
                    className="group flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition hover:border-green-500/20 hover:bg-white/[0.04]">
                    {/* Avatar */}
                    <div className="flex items-center gap-3">
                      {s.onboarding?.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.onboarding.logoUrl} alt={s.name} className="h-11 w-11 shrink-0 rounded-xl object-cover border border-white/10" />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 text-sm font-bold text-green-400">
                          {s.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white">{s.name}</p>
                        <span className={`text-[11px] rounded-full border px-2 py-0.5 ${catStyle}`}>
                          {catLabel(s.category)}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-600">CO₂ Reduction</p>
                        <p className="font-semibold text-green-400">{Number(s.co2ReductionTonnesPerYear).toLocaleString()} t/yr</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Total Funded</p>
                        <p className="font-semibold text-white">{fmtINR(Number(s.totalFundedUSD))}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-green-500 group-hover:text-green-400 transition-colors">
                      View profile →
                    </span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-8 text-center">
              <Link href="/startups"
                className="rounded-lg border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-gray-400 transition hover:text-white">
                Browse all startups →
              </Link>
            </div>
          </section>
        )}

        {/* ── WHY GREENFUND ─────────────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-7xl px-6 pb-28">
          {/* Section headline */}
          <div className="mb-14 text-center">
            <h2 className="text-5xl font-bold text-white md:text-6xl">Why GreenFund</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {trustPillars.map(({ title, desc, icon, color, border, glow }) => (
              <div key={title} className={`relative overflow-hidden rounded-2xl border ${border} bg-gradient-to-b ${glow} to-transparent p-8`}>
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border ${border} bg-white/[0.03]`}>
                  <svg className={`h-6 w-6 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                  </svg>
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">{title}</h3>
                <p className="font-light leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
        <section id="how-it-works" className="relative mx-auto max-w-7xl px-6 pb-28">
          <div className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-green-500">Simple by design</p>
            <h2 className="mt-2 text-4xl font-bold text-white">From sign-up to equity in 4 steps</h2>
          </div>

          <div className="relative grid gap-0 md:grid-cols-4">
            {/* Connecting line */}
            <div className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-11 hidden h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent md:block" />

            {steps.map(({ n, icon, title, desc }, i) => (
              <div key={n} className="relative flex flex-col items-center px-4 text-center">
                <div className={`relative mb-5 flex h-[88px] w-[88px] items-center justify-center rounded-2xl border ${
                  i === 0 ? "border-green-500/30 bg-gradient-to-br from-green-500/20 to-green-500/5 shadow-lg shadow-green-500/10"
                  : "border-white/10 bg-white/[0.03]"
                }`}>
                  <svg className={`h-7 w-7 ${i === 0 ? "text-green-400" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                  </svg>
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#030712] text-[10px] font-bold text-green-400 ring-1 ring-green-500/30">
                    {n}
                  </span>
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
                <p className="text-sm font-light leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-7xl px-6 pb-28">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-green-500">Community</p>
            <h2 className="mt-2 text-4xl font-bold text-white">What our investors say</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map(({ quote, name, title, initials, color }) => (
              <div key={name} className="flex flex-col gap-6 rounded-2xl border border-white/5 bg-white/[0.02] p-7">
                {/* Quote mark */}
                <svg className="h-8 w-8 text-green-500/30" fill="currentColor" viewBox="0 0 32 32">
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>
                <p className="flex-1 text-sm font-light leading-relaxed text-gray-400">&ldquo;{quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${color} text-xs font-bold text-white`}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{name}</p>
                    <p className="text-xs text-gray-600">{title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────────── */}
        <section id="faq" className="relative mx-auto max-w-3xl px-6 pb-28">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-green-500">Got questions?</p>
            <h2 className="mt-2 text-4xl font-bold text-white">Common questions</h2>
          </div>
          <FaqSection faqs={faqs} />
        </section>

        {/* ── CTA BANNER ────────────────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-7xl px-6 pb-28">
          <div className="relative overflow-hidden rounded-3xl border border-green-500/10 bg-gradient-to-br from-green-950/40 via-[#030712] to-[#030712] p-16 text-center">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(34,197,94,0.18)_0%,_transparent_65%)]" />

            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-widest text-green-500">Join the platform</p>
              <h2 className="mt-3 text-4xl font-bold text-white md:text-5xl">
                Ready to make your money matter?
              </h2>
              <p className="mx-auto mt-4 max-w-xl font-light text-gray-400">
                Join 500+ investors deploying capital into verified Indian climate tech.
                Create your account in under 2 minutes. No commitment required to browse.
              </p>
              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/auth/register/investor"
                  className="rounded-xl bg-green-500 px-10 py-4 text-sm font-semibold text-black shadow-2xl shadow-green-500/30 transition hover:bg-green-400"
                >
                  Start Investing →
                </Link>
                <Link
                  href="/auth/register/company"
                  className="rounded-xl border border-white/10 bg-white/5 px-10 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  List Your Company
                </Link>
              </div>
              <p className="mt-6 text-xs text-gray-600">
                Investing involves risk. Review all fund materials before committing capital.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="border-t" style={{ borderColor: "var(--nav-border)", backgroundColor: "var(--nav-bg)" }}>
        <div className="mx-auto max-w-7xl px-6 py-16">

          {/* Main footer grid */}
          <div className="grid gap-12 md:grid-cols-5">

            {/* Brand column */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 ring-1 ring-green-500/30">
                  <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-base font-semibold tracking-tight">
                  <span className="gradient-text">Green</span>
                  <span className="text-white">Fund</span>
                </span>
              </div>
              <p className="mt-4 text-xs font-light leading-relaxed text-gray-500">
                India&apos;s first direct-equity climate investment platform. Verified impact. Honest returns.
              </p>

              {/* Social icons */}
              <div className="mt-5 flex items-center gap-2">
                <a href="#" aria-label="LinkedIn"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-500 transition hover:border-blue-500/30 hover:text-blue-400">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                    <circle cx="4" cy="4" r="2"/>
                  </svg>
                </a>
                <a href="#" aria-label="X"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-500 transition hover:border-white/20 hover:text-white">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="#" aria-label="Instagram"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-500 transition hover:border-pink-500/30 hover:text-pink-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(footerLinks).map(([group, links]) => (
              <div key={group}>
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">{group}</h4>
                <ul className="space-y-2.5">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link href={href} className="text-sm font-light text-gray-600 transition hover:text-gray-300">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row" style={{ borderColor: "var(--nav-border)" }}>
            <p className="text-xs font-light text-gray-600">
              © {new Date().getFullYear()} GreenFund Technologies Pvt. Ltd. All rights reserved.
            </p>
            <p className="text-xs font-light text-gray-700 text-center max-w-lg">
              Investing in early-stage companies involves significant risk including the possible loss of capital.
              Past performance is not indicative of future results.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
