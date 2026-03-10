import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";

export async function GET(req: NextRequest) {
  try {
    const startupId = req.nextUrl.searchParams.get("startupId");
    const analystEmail = req.nextUrl.searchParams.get("analystEmail");

    const reports = await prisma.analystReport.findMany({
      where: {
        ...(startupId ? { startupId } : {}),
        ...(analystEmail ? { analystEmail } : {}),
      },
      orderBy: { publishedAt: "desc" },
    });
    return NextResponse.json(reports);
  } catch (err) {
    console.error("[analyst/report GET]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { startupId, analystEmail, analystName, title, content, rating,
            growthScore, impactScore, riskScore, overallScore, pdfUrl } = body;

    if (!startupId || !analystEmail || !analystName || !title || !content || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }
    const scoreOk = (v: unknown) => v == null || (typeof v === "number" && v >= 0 && v <= 100);
    if (!scoreOk(growthScore) || !scoreOk(impactScore) || !scoreOk(riskScore) || !scoreOk(overallScore)) {
      return NextResponse.json({ error: "Scores must be 0-100" }, { status: 400 });
    }

    const report = await prisma.analystReport.create({
      data: {
        startupId, analystEmail, analystName, title, content, rating,
        growthScore:  growthScore  ?? null,
        impactScore:  impactScore  ?? null,
        riskScore:    riskScore    ?? null,
        overallScore: overallScore ?? null,
        pdfUrl:       pdfUrl       ?? null,
      },
    });
    return NextResponse.json(report, { status: 201 });
  } catch (err) {
    console.error("[analyst/report POST]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
