import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env["GEMINI_API_KEY"] ?? "");

// Extract suggested retry delay from a 429 error message (in seconds)
function retryDelay(err: unknown): number | null {
  const msg = String(err);
  const match = msg.match(/Please retry in ([\d.]+)s/);
  return match?.[1] ? Math.ceil(parseFloat(match[1])) : null;
}

async function generateWithRetry(model: ReturnType<typeof genAI.getGenerativeModel>, prompt: string, maxRetries = 2): Promise<string> { // eslint-disable-line @typescript-eslint/no-explicit-any
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      if (attempt < maxRetries) {
        const delay = retryDelay(err) ?? 30;
        console.log(`[ai/analyze] 429 — retrying in ${delay}s (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, delay * 1000));
      } else {
        throw err;
      }
    }
  }
  throw new Error("Max retries exceeded");
}

export async function POST(req: NextRequest) {
  const { startupId } = await req.json();
  if (!startupId) return NextResponse.json({ error: "startupId required" }, { status: 400 });

  const startup = await prisma.startup.findUnique({ where: { id: startupId } });
  if (!startup) return NextResponse.json({ error: "Startup not found" }, { status: 404 });

  // Return cached result if analysed within last 24 h
  const existing = await prisma.aIMarketAnalysis.findUnique({ where: { startupId } });
  if (existing) {
    const ageHours = (Date.now() - existing.analyzedAt.getTime()) / 3_600_000;
    if (ageHours < 24) return NextResponse.json(existing);
  }

  try {
    const companyName = startup.name;
    const category    = startup.category.replace(/_/g, " ");
    const stage       = startup.stage.replace(/_/g, " ");
    const description = startup.description;

    // Use Gemini 2.0 Flash with Google Search grounding for web research + scoring in one call
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ googleSearch: {} } as any],
    });

    const prompt = `You are a senior climate investment analyst. Research the company "${companyName}" using web search, then provide an objective AI market analysis for investors.

COMPANY PROFILE:
Name: ${companyName}
Category: ${category}
Stage: ${stage}
Country: ${startup.countryCode}
CO₂ Reduction: ${Number(startup.co2ReductionTonnesPerYear).toLocaleString()} tonnes/year
Jobs Created: ${startup.jobsCreated}
Description: ${description}

Search for: recent news, funding rounds, technology details, market presence, partnerships, achievements, and any concerns about this company.

Then score from 0–100 for exactly these 5 metrics:
1. market_adoption_score — Market traction, customer base, partnerships, and sector growth rate
2. financial_sustainability_score — Business model viability, revenue model, funding history, path to profitability
3. technology_score — Innovation level, IP defensibility, technical maturity, and scalability
4. consistency_score — How well their public claims align with independent web sources (high = trustworthy)
5. potential_score — 3–5 year upside for growth, impact, and investor returns

Also write a "web_summary" of 3–4 sentences covering: what the company does, key findings from your research, one notable strength, and one key risk for investors.

Respond ONLY with valid JSON, no markdown, no explanation:
{"market_adoption_score":72,"financial_sustainability_score":58,"technology_score":81,"consistency_score":75,"potential_score":79,"web_summary":"..."}`;

    let raw = await generateWithRetry(model, prompt);

    // Strip markdown code fences if present
    if (raw.includes("```")) {
      const parts = raw.split("```");
      raw = parts[1] ?? raw;
      if (raw.startsWith("json")) raw = raw.slice(4).trim();
    }

    const data = JSON.parse(raw) as {
      market_adoption_score: number;
      financial_sustainability_score: number;
      technology_score: number;
      consistency_score: number;
      potential_score: number;
      web_summary: string;
    };

    const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

    const analysis = await prisma.aIMarketAnalysis.upsert({
      where: { startupId },
      update: {
        webSummary:                   data.web_summary,
        marketAdoptionScore:          clamp(data.market_adoption_score),
        financialSustainabilityScore: clamp(data.financial_sustainability_score),
        technologyScore:              clamp(data.technology_score),
        consistencyScore:             clamp(data.consistency_score),
        potentialScore:               clamp(data.potential_score),
        analyzedAt:                   new Date(),
      },
      create: {
        startupId,
        webSummary:                   data.web_summary,
        marketAdoptionScore:          clamp(data.market_adoption_score),
        financialSustainabilityScore: clamp(data.financial_sustainability_score),
        technologyScore:              clamp(data.technology_score),
        consistencyScore:             clamp(data.consistency_score),
        potentialScore:               clamp(data.potential_score),
      },
    });

    return NextResponse.json(analysis);
  } catch (err) {
    console.error("[ai/analyze]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
