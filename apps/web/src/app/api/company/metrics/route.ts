import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function GET(req: NextRequest) {
  const startupId = req.nextUrl.searchParams.get("startupId");
  if (!startupId) return NextResponse.json([]);
  const updates = await prisma.companyMetricUpdate.findMany({
    where: { startupId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json(updates);
}

export async function POST(req: NextRequest) {
  const { startupId, co2ReductionTonnesPerYear, jobsCreated, revenue, customMetrics, notes } = await req.json();
  if (!startupId) return NextResponse.json({ error: "startupId required" }, { status: 400 });

  const update = await prisma.companyMetricUpdate.create({
    data: {
      startupId,
      co2ReductionTonnesPerYear: co2ReductionTonnesPerYear != null ? co2ReductionTonnesPerYear : undefined,
      jobsCreated: jobsCreated != null ? jobsCreated : undefined,
      revenue: revenue != null ? revenue : undefined,
      customMetrics: customMetrics ?? undefined,
      notes: notes ?? undefined,
    },
  });

  // Update denormalized fields on Startup
  await prisma.startup.update({
    where: { id: startupId },
    data: {
      ...(co2ReductionTonnesPerYear != null ? { co2ReductionTonnesPerYear } : {}),
      ...(jobsCreated != null ? { jobsCreated } : {}),
    },
  });

  return NextResponse.json(update, { status: 201 });
}
