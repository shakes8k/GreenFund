import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

/* ─── GET  /api/secondary — list all active listings ───────────────────── */
export async function GET() {
  const listings = await prisma.secondaryListing.findMany({
    where: { status: "listed" },
    orderBy: { createdAt: "desc" },
    include: {
      offer: {
        include: {
          fundraisingRequest: {
            include: {
              startup: {
                include: {
                  onboarding: { select: { logoUrl: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  const result = listings.map((l) => {
    const fr = l.offer.fundraisingRequest;
    const s  = fr.startup;
    return {
      id:                  l.id,
      offerId:             l.offerId,
      sellerEmail:         l.sellerEmail,
      sellerName:          l.sellerName,
      askPriceINR:         l.askPriceINR.toString(),
      algorithmicPriceINR: l.algorithmicPriceINR.toString(),
      createdAt:           l.createdAt.toISOString(),
      sharesPercent:       l.offer.sharesPercent?.toString() ?? "0",
      fundingRound:        fr.fundingRound,
      valuationINR:        fr.valuationINR.toString(),
      startup: {
        id:               s.id,
        name:             s.name,
        category:         s.category,
        countryCode:      s.countryCode,
        co2PerYear:       Number(s.co2ReductionTonnesPerYear),
        logoUrl:          s.onboarding?.logoUrl ?? null,
      },
    };
  });

  return NextResponse.json(result);
}

/* ─── POST /api/secondary — create a listing ───────────────────────────── */
export async function POST(req: NextRequest) {
  const body = await req.json() as { offerId?: string; sellerEmail?: string; askPriceINR?: number };
  const { offerId, sellerEmail, askPriceINR } = body;

  if (!offerId || !sellerEmail || !askPriceINR) {
    return NextResponse.json({ error: "offerId, sellerEmail and askPriceINR required" }, { status: 400 });
  }

  // Verify offer belongs to seller and is accepted
  const offer = await prisma.investorOffer.findUnique({
    where: { id: offerId },
    include: {
      fundraisingRequest: {
        include: {
          startup: {
            include: { milestones: true },
          },
        },
      },
      secondaryListing: true,
    },
  });

  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  if (offer.investorEmail !== sellerEmail) return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  if (offer.status !== "accepted") return NextResponse.json({ error: "Only accepted offers can be listed" }, { status: 400 });
  if (offer.secondaryListing) return NextResponse.json({ error: "Already listed" }, { status: 409 });

  const sharesPercent = Number(offer.sharesPercent ?? 0);
  const valuationINR  = Number(offer.fundraisingRequest.valuationINR);
  const milestones    = offer.fundraisingRequest.startup.milestones;

  // Impact multiplier — milestone completion bonus
  const total     = milestones.length;
  const completed = milestones.filter((m) => m.status === "completed").length;
  const mPct      = total > 0 ? completed / total : 0;
  const mBonus    = mPct >= 0.75 ? 0.25 : mPct >= 0.5 ? 0.15 : mPct >= 0.25 ? 0.07 : 0;

  // CO₂ impact bonus
  const co2 = Number(offer.fundraisingRequest.startup.co2ReductionTonnesPerYear);
  const co2Bonus = co2 >= 10000 ? 0.15 : co2 >= 1000 ? 0.08 : co2 >= 100 ? 0.04 : 0;

  const impactMultiplier = 1 + mBonus + co2Bonus;
  const algoPrice = (sharesPercent / 100) * valuationINR * impactMultiplier;

  const listing = await prisma.secondaryListing.create({
    data: {
      offerId,
      sellerEmail,
      sellerName: offer.investorName,
      askPriceINR: askPriceINR,
      algorithmicPriceINR: parseFloat(algoPrice.toFixed(2)),
      status: "listed",
    },
  });

  return NextResponse.json(listing, { status: 201 });
}
