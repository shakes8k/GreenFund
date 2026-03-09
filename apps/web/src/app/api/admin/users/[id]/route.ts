import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role === "admin") return NextResponse.json({ error: "Cannot delete admin accounts" }, { status: 403 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
