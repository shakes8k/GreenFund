export type UserRole = "investor" | "company" | "analyst" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  // investor-specific
  investorType?: "individual" | "institutional" | "family_office";
  riskAppetite?: "conservative" | "balanced" | "aggressive";
  investmentRange?: string;
  // company-specific
  companyName?: string;
  category?: string;
  stage?: string;
  countryCode?: string;
  teamSize?: string;
  fundingGoal?: string;
  companyDescription?: string;
  // analyst-specific
  domain?: string;
  experience?: string;
  stakedAmount?: number;
  // investor preferences
  preferences?: Record<string, unknown>;
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("gf_user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setUser(user: AuthUser): void {
  localStorage.setItem("gf_user", JSON.stringify(user));
}

export function logout(): void {
  localStorage.removeItem("gf_user");
}

export function dashboardPath(role: UserRole): string {
  return `/dashboard/${role}`;
}
