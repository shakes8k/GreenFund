import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

// Company accepts or rejects a pending investment
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { action } = await req.json(); // "accept" | "reject"

  if (!["accept", "reject"].includes(action)) {
    return NextResponse.json({ error: "action must be accept or reject" }, { status: 400 });
  }

  const contract = await prisma.investmentContract.findUnique({ where: { id } });
  if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  if (contract.status !== "pending_acceptance") {
    return NextResponse.json({ error: "Contract is not pending acceptance" }, { status: 409 });
  }

  const updated = await prisma.investmentContract.update({
    where: { id },
    data: {
      status: action === "accept" ? "active" : "terminated",
    },
  });

  return NextResponse.json(updated);
}
