import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function GET(req: NextRequest) {
  const startupId = req.nextUrl.searchParams.get("startupId");
  if (!startupId) return NextResponse.json(null);
  const onboarding = await prisma.companyOnboarding.findUnique({ where: { startupId } });
  return NextResponse.json(onboarding);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    startupId,
    legalName,
    registrationNumber,
    incorporationDate,
    jurisdiction,
    registeredAddress,
    operatingAddress,
    website,
    logoUrl,
    keyPeople,
    legalDocUrls,
    kycDocUrls,
    financialDocUrls,
    patentDocUrls,
    esgCertUrls,
  } = body;

  if (!startupId || !legalName || !registrationNumber) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const onboarding = await prisma.companyOnboarding.upsert({
    where: { startupId },
    update: {
      legalName,
      registrationNumber,
      incorporationDate: new Date(incorporationDate),
      jurisdiction,
      registeredAddress,
      operatingAddress,
      website,
      logoUrl,
      keyPeople,
      legalDocUrls,
      kycDocUrls,
      financialDocUrls,
      patentDocUrls,
      esgCertUrls,
    },
    create: {
      startupId,
      legalName,
      registrationNumber,
      incorporationDate: new Date(incorporationDate),
      jurisdiction,
      registeredAddress,
      operatingAddress,
      website: website ?? null,
      logoUrl: logoUrl ?? null,
      keyPeople,
      legalDocUrls: legalDocUrls ?? [],
      kycDocUrls: kycDocUrls ?? [],
      financialDocUrls: financialDocUrls ?? [],
      patentDocUrls: patentDocUrls ?? [],
      esgCertUrls: esgCertUrls ?? [],
    },
  });

  return NextResponse.json(onboarding, { status: 201 });
}
