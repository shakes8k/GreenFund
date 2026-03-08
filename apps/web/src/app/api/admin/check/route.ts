import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ isAdmin: false });

  const admins = (process.env["ADMIN_EMAILS"] ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const validEmail = admins.includes(email.toLowerCase());
  const validPassword = password === (process.env["ADMIN_PASSWORD"] ?? "");

  return NextResponse.json({ isAdmin: validEmail && validPassword });
}
