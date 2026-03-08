import { NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function GET() {
  const pending = await prisma.adminReview.findMany({
    where: { status: "pending" },
    include: {
      startup: {
        include: { aiScore: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(pending);
}
