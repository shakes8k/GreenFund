import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

function isAdmin(email: string): boolean {
  const admins = (process.env["ADMIN_EMAILS"] ?? "").split(",").map((e) => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}

export async function POST(req: NextRequest) {
  const { startupId, adminEmail, status, notes } = await req.json();

  if (!isAdmin(adminEmail)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!startupId || !status || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const review = await prisma.adminReview.upsert({
    where: { startupId },
    update: { status, adminEmail, notes, reviewedAt: new Date() },
    create: { startupId, status, adminEmail, notes, reviewedAt: new Date() },
  });

  // If approved, set startup to verified
  if (status === "approved") {
    await prisma.startup.update({
      where: { id: startupId },
      data: { verificationStatus: "verified" },
    });
    // Fire async AI scoring (fire-and-forget)
    const baseUrl = process.env["NEXTAUTH_URL"] ?? process.env["NEXT_PUBLIC_BASE_URL"] ?? "http://localhost:3000";
    fetch(`${baseUrl}/api/ai/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startupId }),
    }).catch(() => null);
  } else {
    await prisma.startup.update({
      where: { id: startupId },
      data: { verificationStatus: "rejected" },
    });
  }

  return NextResponse.json(review);
}
