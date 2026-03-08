import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";
import { scryptSync, randomBytes } from "crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, role, ...rest } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        role,
        investorType:       rest.investorType ?? null,
        riskAppetite:       rest.riskAppetite ?? null,
        investmentRange:    rest.investmentRange ?? null,
        companyName:        rest.companyName ?? null,
        category:           rest.category ?? null,
        stage:              rest.stage ?? null,
        countryCode:        rest.countryCode ?? null,
        teamSize:           rest.teamSize ?? null,
        fundingGoal:        rest.fundingGoal ?? null,
        companyDescription: rest.companyDescription ?? null,
        domain:             rest.domain ?? null,
        experience:         rest.experience ?? null,
      },
    });

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
    console.error("[auth/register]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
