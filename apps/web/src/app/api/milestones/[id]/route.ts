import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

// PATCH /api/milestones/[id] — toggle status (pending ↔ completed) or set in_progress
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { status } = await req.json();

  const valid = ["pending", "in_progress", "completed", "failed", "disputed", "oracle_verifying"];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const milestone = await prisma.milestone.update({
    where: { id },
    data: {
      status,
      ...(status === "completed" ? { completedAt: new Date() } : { completedAt: null }),
    },
  });
  return NextResponse.json(milestone);
}

// DELETE /api/milestones/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.milestone.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
