import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  const startups = await prisma.startup.findMany({
    where: {
      ...(status ? { verificationStatus: status as never } : {}),
      ...(category ? { category: category as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { riskPool: { select: { name: true } } },
  });

  return NextResponse.json(startups);
}
