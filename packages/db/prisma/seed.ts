import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ── Risk Pools (platform infrastructure — no startup/user data seeded) ──────
  const pool1 = await prisma.riskPool.upsert({
    where: { id: "pool-conservative-001" },
    update: {},
    create: {
      id: "pool-conservative-001",
      name: "Green Shield",
      description:
        "Low-volatility basket of mature solar and wind projects with proven revenue streams and government-backed offtake agreements.",
      tier: "conservative",
      categories: ["solar", "wind"],
      totalValueLocked: 48_000_000,
      minInvestmentUSD: 1_000,
      expectedReturnLow: 6.5,
      expectedReturnHigh: 9.0,
    },
  });

  const pool2 = await prisma.riskPool.upsert({
    where: { id: "pool-balanced-001" },
    update: {},
    create: {
      id: "pool-balanced-001",
      name: "Climate Catalyst",
      description:
        "Diversified exposure across green hydrogen, energy storage, and EV mobility startups at Series A–B. AI-rebalanced weekly.",
      tier: "balanced",
      categories: ["green_hydrogen", "energy_storage", "ev_mobility"],
      totalValueLocked: 92_500_000,
      minInvestmentUSD: 5_000,
      expectedReturnLow: 12.0,
      expectedReturnHigh: 22.0,
    },
  });

  const pool3 = await prisma.riskPool.upsert({
    where: { id: "pool-growth-001" },
    update: {},
    create: {
      id: "pool-growth-001",
      name: "Ocean Alpha",
      description:
        "High-conviction bets on ocean technology and carbon capture startups with breakthrough potential and strong DVN scores.",
      tier: "growth",
      categories: ["ocean_tech", "carbon_capture"],
      totalValueLocked: 31_200_000,
      minInvestmentUSD: 10_000,
      expectedReturnLow: 20.0,
      expectedReturnHigh: 45.0,
    },
  });

  const pool4 = await prisma.riskPool.upsert({
    where: { id: "pool-speculative-001" },
    update: {},
    create: {
      id: "pool-speculative-001",
      name: "BioFrontier",
      description:
        "Early-stage biodiversity and sustainable agriculture moonshots. High risk, high potential planetary impact.",
      tier: "speculative",
      categories: ["biodiversity", "sustainable_agriculture"],
      totalValueLocked: 8_750_000,
      minInvestmentUSD: 500,
      expectedReturnLow: 30.0,
      expectedReturnHigh: 100.0,
    },
  });

  console.log("✅ Seed complete — risk pools only, no demo companies or users seeded");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
