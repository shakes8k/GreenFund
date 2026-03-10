import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

const ADMIN_EMAILS = (process.env["ADMIN_EMAILS"] ?? "").split(",").map((e) => e.trim()).filter(Boolean);

function isAdmin(email: string | null) {
  return email && ADMIN_EMAILS.includes(email);
}

/* ─── GET /api/admin/financials/[startupId] ─────────────────────────────── */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ startupId: string }> }
) {
  const adminEmail = req.nextUrl.searchParams.get("adminEmail");
  if (!isAdmin(adminEmail)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { startupId } = await params;
  const records = await prisma.companyFinancials.findMany({
    where: { startupId },
    orderBy: { periodEndDate: "desc" },
  });
  return NextResponse.json(records);
}

/* ─── POST /api/admin/financials/[startupId] ────────────────────────────── */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ startupId: string }> }
) {
  const { startupId } = await params;

  const body = await req.json() as {
    adminEmail?: string;
    fiscalYear?: string;
    periodEndDate?: string;
    revenueINR?: number | null;
    grossProfitINR?: number | null;
    ebitdaINR?: number | null;
    netProfitINR?: number | null;
    totalAssetsINR?: number | null;
    totalLiabilitiesINR?: number | null;
    cashEquivalentsINR?: number | null;
    burnRateINR?: number | null;
    runwayMonths?: number | null;
    filingSource?: string | null;
    notes?: string | null;
  };

  if (!isAdmin(body.adminEmail ?? null)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!body.fiscalYear || !body.periodEndDate) {
    return NextResponse.json({ error: "fiscalYear and periodEndDate required" }, { status: 400 });
  }

  const record = await prisma.companyFinancials.upsert({
    where: { startupId_fiscalYear: { startupId, fiscalYear: body.fiscalYear } },
    update: {
      periodEndDate:       new Date(body.periodEndDate),
      revenueINR:          body.revenueINR ?? null,
      grossProfitINR:      body.grossProfitINR ?? null,
      ebitdaINR:           body.ebitdaINR ?? null,
      netProfitINR:        body.netProfitINR ?? null,
      totalAssetsINR:      body.totalAssetsINR ?? null,
      totalLiabilitiesINR: body.totalLiabilitiesINR ?? null,
      cashEquivalentsINR:  body.cashEquivalentsINR ?? null,
      burnRateINR:         body.burnRateINR ?? null,
      runwayMonths:        body.runwayMonths ?? null,
      filingSource:        body.filingSource ?? null,
      notes:               body.notes ?? null,
      addedByEmail:        body.adminEmail!,
    },
    create: {
      startupId,
      fiscalYear:          body.fiscalYear,
      periodEndDate:       new Date(body.periodEndDate),
      revenueINR:          body.revenueINR ?? null,
      grossProfitINR:      body.grossProfitINR ?? null,
      ebitdaINR:           body.ebitdaINR ?? null,
      netProfitINR:        body.netProfitINR ?? null,
      totalAssetsINR:      body.totalAssetsINR ?? null,
      totalLiabilitiesINR: body.totalLiabilitiesINR ?? null,
      cashEquivalentsINR:  body.cashEquivalentsINR ?? null,
      burnRateINR:         body.burnRateINR ?? null,
      runwayMonths:        body.runwayMonths ?? null,
      filingSource:        body.filingSource ?? null,
      notes:               body.notes ?? null,
      addedByEmail:        body.adminEmail!,
    },
  });

  return NextResponse.json(record, { status: 201 });
}

/* ─── DELETE /api/admin/financials/[startupId]?fiscalYear=&adminEmail= ─── */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ startupId: string }> }
) {
  const { startupId } = await params;
  const adminEmail = req.nextUrl.searchParams.get("adminEmail");
  const fiscalYear = req.nextUrl.searchParams.get("fiscalYear");

  if (!isAdmin(adminEmail)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!fiscalYear) return NextResponse.json({ error: "fiscalYear required" }, { status: 400 });

  await prisma.companyFinancials.delete({
    where: { startupId_fiscalYear: { startupId, fiscalYear } },
  });
  return NextResponse.json({ ok: true });
}
