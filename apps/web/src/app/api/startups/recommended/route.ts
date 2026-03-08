import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  const search = req.nextUrl.searchParams.get("search") ?? "";

  const [pref, startups] = await Promise.all([
    email ? prisma.investorPreference.findUnique({ where: { investorEmail: email } }) : null,
    prisma.startup.findMany({
      where: {
        verificationStatus: "verified",
        ...(search ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        } : {}),
      },
      include: {
        aiScore: true,
        riskPool: { select: { name: true, tier: true } },
        _count: { select: { analystReports: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Score each startup by preference match
  const scored = startups.map((s) => {
    let match = 0;
    if (pref) {
      if (pref.categories.length > 0 && pref.categories.includes(s.category)) match += 3;
      if (pref.stages.length > 0 && pref.stages.includes(s.stage)) match += 2;
      if (pref.minScore != null && s.aiScore && s.aiScore.overallScore >= pref.minScore) match += 1;
    }
    return { ...s, _matchScore: match };
  });

  // Sort: preference matches first (desc), then by AI overall score (desc)
  scored.sort((a, b) => {
    if (b._matchScore !== a._matchScore) return b._matchScore - a._matchScore;
    return (b.aiScore?.overallScore ?? 0) - (a.aiScore?.overallScore ?? 0);
  });

  return NextResponse.json(scored);
}
