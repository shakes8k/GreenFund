import { NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function GET() {
  const [agg, poolCount, expertCount] = await Promise.all([
    prisma.impactLedgerEntry.aggregate({
      _sum: { co2ReducedTonnes: true, jobsCreated: true },
      _count: { id: true },
    }),
    prisma.riskPool.count(),
    prisma.dVNExpert.count(),
  ]);

  return NextResponse.json({
    co2ReducedTonnes: Number(agg._sum.co2ReducedTonnes ?? 0),
    jobsCreated: agg._sum.jobsCreated ?? 0,
    verifiedReports: agg._count.id,
    poolCount,
    expertCount,
  });
}
