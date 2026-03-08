import { NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function GET() {
  const experts = await prisma.dVNExpert.findMany({
    orderBy: { reputationScore: "desc" },
    take: 20,
  });
  return NextResponse.json(experts);
}
