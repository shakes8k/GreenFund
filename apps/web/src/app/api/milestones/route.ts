import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

// POST /api/milestones — create a new milestone
export async function POST(req: NextRequest) {
  const { startupId, title, fundReleaseINR, targetDate } = await req.json();
  if (!startupId || !title || !targetDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const milestone = await prisma.milestone.create({
    data: {
      startupId,
      title,
      description: "",
      fundReleaseUSD: fundReleaseINR ?? 0,
      targetDate: new Date(targetDate),
      status: "pending",
    },
  });
  return NextResponse.json(milestone, { status: 201 });
}
