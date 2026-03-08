import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";
import { scryptSync, timingSafeEqual } from "crypto";

function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split(":");
    if (parts.length !== 2) return false;
    const [salt, hash] = parts as [string, string];
    const candidate = scryptSync(password, salt, 64);
    return timingSafeEqual(Buffer.from(hash, "hex"), candidate);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    return NextResponse.json({
      id:              user.id,
      email:           user.email,
      name:            user.name,
      role:            user.role,
      investorType:    user.investorType,
      riskAppetite:    user.riskAppetite,
      investmentRange: user.investmentRange,
      companyName:     user.companyName,
      category:        user.category,
      stage:           user.stage,
      countryCode:     user.countryCode,
      teamSize:        user.teamSize,
      fundingGoal:     user.fundingGoal,
      companyDescription: user.companyDescription,
      domain:          user.domain,
      experience:      user.experience,
      createdAt:       user.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
