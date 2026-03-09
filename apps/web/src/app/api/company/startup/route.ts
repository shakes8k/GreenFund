import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json(null);

  const startup = await prisma.startup.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    include: {
      milestones: { orderBy: { targetDate: "asc" } },
      assessments: {
        include: { expert: { select: { walletAddress: true, reputationScore: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json(startup ?? null);
}

function parseTeamSize(teamSize: string): number {
  if (teamSize.startsWith("200")) return 200;
  if (teamSize.startsWith("51")) return 100;
  if (teamSize.startsWith("11")) return 25;
  return 5;
}

export async function POST(req: NextRequest) {
  const { companyName, description, category, stage, countryCode, teamSize, companyEmail } = await req.json();

  if (!companyName || !description || !category || !stage || !countryCode) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await prisma.startup.findFirst({
    where: { name: { equals: companyName, mode: "insensitive" } },
  });
  if (existing) return NextResponse.json(existing);

  const startup = await prisma.startup.create({
    data: {
      name: companyName,
      description,
      stage,
      category,
      foundedYear: 2026,
      teamSize: parseTeamSize(teamSize ?? "1–10"),
      countryCode: (countryCode as string).slice(0, 2).toUpperCase(),
      co2ReductionTonnesPerYear: 0,
      jobsCreated: 0,
      sdgGoals: [],
      ...(companyEmail ? { companyEmail } : {}),
    },
  });

  await prisma.adminReview.create({
    data: { startupId: startup.id },
  });

  return NextResponse.json(startup, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { startupId, co2ReductionTonnesPerYear, jobsCreated, description } = await req.json();
  if (!startupId) return NextResponse.json({ error: "startupId required" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (co2ReductionTonnesPerYear !== undefined) data.co2ReductionTonnesPerYear = co2ReductionTonnesPerYear;
  if (jobsCreated !== undefined) data.jobsCreated = Number(jobsCreated);
  if (description !== undefined) data.description = description;

  const startup = await prisma.startup.update({ where: { id: startupId }, data });
  return NextResponse.json(startup);
}
