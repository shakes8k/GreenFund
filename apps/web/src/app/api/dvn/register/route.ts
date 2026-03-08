import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

// Called when an analyst completes registration — creates a DVNExpert row
// linked to their email so subsequent assessments can find them.
export async function POST(req: NextRequest) {
  const { email, domain, stakedTokens } = await req.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const domainKey = domain?.toLowerCase().replace(/[\s-]/g, "_");
  const walletAddress = `platform:${email}`; // placeholder until real wallet connects

  const expert = await prisma.dVNExpert.upsert({
    where: { email },
    update: {
      stakedTokens: stakedTokens ?? 0,
      ...(domainKey ? { domains: { set: [domainKey as any] } } : {}),
    },
    create: {
      walletAddress,
      email,
      domains: domainKey ? [domainKey as any] : [],
      stakedTokens: stakedTokens ?? 0,
      reputationScore: 50,
    },
  });

  return NextResponse.json(expert);
}
