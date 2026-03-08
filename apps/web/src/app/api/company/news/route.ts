import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function GET(req: NextRequest) {
  const startupId = req.nextUrl.searchParams.get("startupId");
  if (!startupId) return NextResponse.json([]);
  const news = await prisma.companyNews.findMany({
    where: { startupId },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });
  return NextResponse.json(news);
}

export async function POST(req: NextRequest) {
  const { startupId, title, summary, sourceUrl } = await req.json();
  if (!startupId || !title || !summary) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const item = await prisma.companyNews.create({
    data: { startupId, title, summary, sourceUrl: sourceUrl ?? undefined },
  });
  return NextResponse.json(item, { status: 201 });
}
