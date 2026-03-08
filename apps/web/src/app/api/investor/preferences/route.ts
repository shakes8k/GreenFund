import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json(null);
  const pref = await prisma.investorPreference.findUnique({ where: { investorEmail: email } });
  return NextResponse.json(pref ?? null);
}

export async function POST(req: NextRequest) {
  const { email, categories, stages, minScore } = await req.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
  const pref = await prisma.investorPreference.upsert({
    where: { investorEmail: email },
    update: {
      categories: categories ?? [],
      stages: stages ?? [],
      minScore: minScore ?? null,
    },
    create: {
      investorEmail: email,
      categories: categories ?? [],
      stages: stages ?? [],
      minScore: minScore ?? null,
    },
  });
  return NextResponse.json(pref);
}
