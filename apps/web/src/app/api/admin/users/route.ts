import { NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function GET() {
  const users = await prisma.user.findMany({
    where: { role: { in: ["investor", "company", "analyst"] } },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}
