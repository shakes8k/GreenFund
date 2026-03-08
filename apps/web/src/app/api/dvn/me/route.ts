import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json(null);

  const expert = await prisma.dVNExpert.findUnique({
    where: { email },
    include: {
      royalties: {
        orderBy: { paidAt: "desc" },
        take: 20,
      },
    },
  });

  return NextResponse.json(expert ?? null);
}
