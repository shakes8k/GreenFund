import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ holdings: [], timeline: [] });

  // All accepted offers for this investor
  const offers = await prisma.investorOffer.findMany({
    where: { investorEmail: email, status: "accepted" },
    include: {
      fundraisingRequest: {
        include: {
          startup: {
            select: {
              id: true,
              name: true,
              category: true,
              co2ReductionTonnesPerYear: true,
              jobsCreated: true,
              verificationStatus: true,
              // For latest valuation: grab the most recent fundraising request
              fundraisingRequests: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { valuationINR: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Build holdings — group by startup
  const holdingsMap = new Map<string, {
    startupId: string;
    name: string;
    category: string;
    co2PerYear: number;
    jobsCreated: number;
    fundingRound: string;
    investedINR: number;
    sharesPercent: number;
    originalValuationINR: number;
    latestValuationINR: number;
    investedAt: string;
  }>();

  for (const o of offers) {
    const fr = o.fundraisingRequest;
    const s = fr.startup;
    const sid = s.id;
    const amount = Number(o.amountINR);
    const shares = Number(o.sharesPercent ?? 0);
    const origVal = Number(fr.valuationINR);
    const latestVal = Number(s.fundraisingRequests[0]?.valuationINR ?? fr.valuationINR);

    if (holdingsMap.has(sid)) {
      const h = holdingsMap.get(sid)!;
      h.investedINR += amount;
      h.sharesPercent += shares;
      h.latestValuationINR = latestVal; // keep freshest
    } else {
      holdingsMap.set(sid, {
        startupId: sid,
        name: s.name,
        category: s.category,
        co2PerYear: Number(s.co2ReductionTonnesPerYear),
        jobsCreated: s.jobsCreated,
        fundingRound: fr.fundingRound,
        investedINR: amount,
        sharesPercent: shares,
        originalValuationINR: origVal,
        latestValuationINR: latestVal,
        investedAt: o.createdAt.toISOString(),
      });
    }
  }

  const holdings = Array.from(holdingsMap.values());

  // Timeline: cumulative investment over time
  let cumulative = 0;
  const timeline = offers.map((o) => {
    cumulative += Number(o.amountINR);
    return {
      date: o.createdAt.toISOString().slice(0, 10),
      amount: Number(o.amountINR),
      cumulative,
      company: o.fundraisingRequest.startup.name,
    };
  });

  // Active rounds this investor is in (for funding momentum)
  const activeRounds = await prisma.fundraisingRequest.findMany({
    where: {
      offers: { some: { investorEmail: email, status: "accepted" } },
    },
    select: {
      id: true,
      fundingRound: true,
      amountRaisingINR: true,
      amountRaisedINR: true,
      status: true,
      startup: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ holdings, timeline, activeRounds });
}
