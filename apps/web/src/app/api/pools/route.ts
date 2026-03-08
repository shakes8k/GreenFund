import { NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function GET() {
  const pools = await prisma.riskPool.findMany({
    orderBy: { totalValueLocked: "desc" },
    include: { _count: { select: { startups: true } } },
  });
  return NextResponse.json(pools);
}
