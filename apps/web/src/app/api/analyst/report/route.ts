import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function GET(req: NextRequest) {
  const startupId = req.nextUrl.searchParams.get("startupId");
  const analystEmail = req.nextUrl.searchParams.get("analystEmail");

  const reports = await prisma.analystReport.findMany({
    where: {
      ...(startupId ? { startupId } : {}),
      ...(analystEmail ? { analystEmail } : {}),
    },
    orderBy: { publishedAt: "desc" },
  });
  return NextResponse.json(reports);
}

export async function POST(req: NextRequest) {
  const { startupId, analystEmail, analystName, title, content, rating } = await req.json();

  if (!startupId || !analystEmail || !analystName || !title || !content || !rating) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  const report = await prisma.analystReport.create({
    data: { startupId, analystEmail, analystName, title, content, rating },
  });
  return NextResponse.json(report, { status: 201 });
}
