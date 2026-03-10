import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

/* ─── PATCH /api/secondary/[id] — buy a listing ────────────────────────── */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as { buyerEmail?: string; buyerName?: string };
  const { buyerEmail, buyerName } = body;

  if (!buyerEmail || !buyerName) {
    return NextResponse.json({ error: "buyerEmail and buyerName required" }, { status: 400 });
  }

  const listing = await prisma.secondaryListing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.status !== "listed") return NextResponse.json({ error: "Listing is no longer available" }, { status: 409 });
  if (listing.sellerEmail === buyerEmail) return NextResponse.json({ error: "Cannot buy your own listing" }, { status: 400 });

  const updated = await prisma.secondaryListing.update({
    where: { id },
    data: { status: "sold", buyerEmail, buyerName },
  });

  return NextResponse.json(updated);
}

/* ─── DELETE /api/secondary/[id] — cancel a listing ────────────────────── */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = req.nextUrl;
  const sellerEmail = searchParams.get("sellerEmail");

  const listing = await prisma.secondaryListing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (listing.sellerEmail !== sellerEmail) return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  if (listing.status !== "listed") return NextResponse.json({ error: "Cannot cancel a sold listing" }, { status: 409 });

  await prisma.secondaryListing.update({ where: { id }, data: { status: "cancelled" } });
  return NextResponse.json({ ok: true });
}
