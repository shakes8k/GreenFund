import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json([], { status: 200 });

  const offers = await prisma.investorOffer.findMany({
    where: { investorEmail: email },
    include: {
      secondaryListing: { select: { id: true, status: true } },
      fundraisingRequest: {
        select: {
          fundingRound: true,
          equityPercent: true,
          valuationINR: true,
          startup: { select: { id: true, name: true, category: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(offers);
}
