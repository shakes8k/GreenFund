import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json([], { status: 200 });

  const offers = await prisma.investorOffer.findMany({
    where: { investorEmail: email },
    include: {
      fundraisingRequest: {
        include: { startup: { select: { id: true, name: true, category: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(offers);
}
