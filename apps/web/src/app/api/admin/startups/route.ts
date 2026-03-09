import { NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function GET() {
  const startups = await prisma.startup.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      stage: true,
      countryCode: true,
      verificationStatus: true,
      companyEmail: true,
      createdAt: true,
      onboarding: { select: { logoUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(startups);
}
