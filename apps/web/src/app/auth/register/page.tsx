import Link from "next/link";

const roles = [
  {
    icon: "💼",
    title: "Investor",
    subtitle: "Deploy capital into verified climate startups",
    description:
      "Browse AI-scored startups, co-invest in managed risk pools, track your portfolio's financial returns and real-world impact from a single dashboard.",
    highlights: ["$500 minimum entry", "Real-time impact tracking", "AI scenario simulator", "Polygon-native returns"],
    href: "/auth/register/investor",
    color: "blue",
    border: "border-blue-500/20",
    hover: "hover:border-blue-500/50 hover:bg-blue-500/[0.03]",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    cta: "bg-blue-500 hover:bg-blue-400",
  },
  {
    icon: "🌱",
    title: "Company",
    subtitle: "Raise climate capital, proven by experts",
    description:
      "Submit your startup, set milestone-based funding gates, pass DVN validation, and unlock capital automatically as your real-world impact is verified.",
    highlights: ["Milestone-locked funding", "1,200+ expert validators", "IoT oracle integration", "On-chain credibility"],
    href: "/auth/register/company",
    color: "green",
    border: "border-green-500/20",
    hover: "hover:border-green-500/50 hover:bg-green-500/[0.03]",
    badge: "bg-green-500/10 text-green-400 border-green-500/20",
    cta: "bg-green-500 hover:bg-green-400 text-black",
  },
  {
    icon: "🔬",
    title: "Analyst",
    subtitle: "Monetise your climate domain expertise",
    description:
      "Join the Decentralised Verification Network. Stake GFT tokens, assess startup claims, earn fees for accurate verdicts, and build a verifiable on-chain reputation.",
    highlights: ["Stake & earn GFT rewards", "7-day challenge window", "Reputation leaderboard", "Slash protection"],
    href: "/auth/register/analyst",
    color: "purple",
    border: "border-purple-500/20",
    hover: "hover:border-purple-500/50 hover:bg-purple-500/[0.03]",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    cta: "bg-purple-500 hover:bg-purple-400",
  },
];

export default function RegisterPage() {
  return (
    <main className="relative min-h-[calc(100vh-73px)]">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-green-500/5 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 py-16">
        {/* Header */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-green-500">Step 1 of 2 — Choose your role</p>
          <h1 className="text-4xl font-bold text-white md:text-5xl">Join GreenFund</h1>
          <p className="mt-3 font-light text-gray-500">
            Select how you want to participate. You can always add additional roles later.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {roles.map(({ icon, title, subtitle, description, highlights, href, border, hover, badge, cta }) => (
            <div
              key={title}
              className={`flex flex-col rounded-2xl border ${border} ${hover} bg-white/[0.02] p-8 transition-all duration-300`}
            >
              <div className="mb-5">
                <div className="mb-4 text-4xl">{icon}</div>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge}`}>
                  {title}
                </span>
                <h2 className="mt-3 text-lg font-semibold text-white">{subtitle}</h2>
                <p className="mt-2 text-sm font-light leading-relaxed text-gray-500">{description}</p>
              </div>

              <ul className="mb-8 flex-1 space-y-2">
                {highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm font-light text-gray-400">
                    <span className="h-1 w-1 rounded-full bg-green-500" />
                    {h}
                  </li>
                ))}
              </ul>

              <Link
                href={href}
                className={`block w-full rounded-xl ${cta} py-3 text-center text-sm font-semibold text-white transition`}
              >
                Register as {title} →
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm font-light text-gray-600">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-green-400 hover:text-green-300">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
