import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@greenfund/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env["GEMINI_API_KEY"] ?? "");

const TRUSTED_SOURCES = [
  "Reuters", "Bloomberg", "Financial Times", "The Hindu", "Economic Times",
  "Mint", "Business Standard", "Moneycontrol", "TechCrunch", "Forbes",
  "The Guardian", "BBC", "NDTV", "LiveMint", "Inc42", "YourStory",
  "CleanTechnica", "GreenBiz", "Carbon Brief", "E&E News",
];

export async function GET(req: NextRequest) {
  const startupId = req.nextUrl.searchParams.get("startupId");
  if (!startupId) return NextResponse.json({ error: "startupId required" }, { status: 400 });

  const startup = await prisma.startup.findUnique({
    where: { id: startupId },
    select: { name: true, category: true, countryCode: true, description: true },
  });
  if (!startup) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Return cached if fresh (< 12h)
  const cached = await prisma.companyNews.findMany({
    where: { startupId },
    orderBy: { publishedAt: "desc" },
    take: 10,
  });

  if (cached.length > 0) {
    const ageHours = (Date.now() - cached[0]!.publishedAt.getTime()) / 3_600_000;
    if (ageHours < 12) return NextResponse.json(cached);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ googleSearch: {} } as any],
    });

    const prompt = `Search the web right now for the latest real news articles about "${startup.name}", a ${startup.category.replace(/_/g, " ")} company from ${startup.countryCode}.

Also search for recent news about the broader ${startup.category.replace(/_/g, " ")} industry, climate tech investment in ${startup.countryCode}, and any relevant regulatory or policy news affecting this sector.

Find up to 6 real, recent news items published in the last 6 months from trusted sources only (Reuters, Bloomberg, Economic Times, Mint, Business Standard, TechCrunch, The Hindu, BBC, YourStory, Inc42, CleanTechnica, GreenBiz, Carbon Brief, NDTV, Forbes, Financial Times).

For each news item return:
- title: the real article headline
- summary: 2 sentences summarising the article
- source: the publication name
- sourceUrl: the actual URL of the article (must be a real URL you found via search)
- publishedAt: the publication date in ISO format (YYYY-MM-DD)
- relevance: "company" if directly about this company, or "industry" if about the broader sector

Respond ONLY with valid JSON array, no markdown:
[{"title":"...","summary":"...","source":"...","sourceUrl":"https://...","publishedAt":"2025-01-15","relevance":"company"}]

If you cannot find enough real articles, return fewer items. Never fabricate URLs or headlines.`;

    const result = await model.generateContent(prompt);
    let raw = result.response.text().trim();

    if (raw.includes("```")) {
      const parts = raw.split("```");
      raw = parts[1] ?? raw;
      if (raw.startsWith("json")) raw = raw.slice(4).trim();
    }

    // Extract JSON array
    const arrStart = raw.indexOf("[");
    const arrEnd = raw.lastIndexOf("]");
    if (arrStart === -1 || arrEnd === -1) throw new Error("No JSON array in response");
    raw = raw.slice(arrStart, arrEnd + 1);

    const items = JSON.parse(raw) as {
      title: string;
      summary: string;
      source: string;
      sourceUrl: string;
      publishedAt: string;
      relevance: string;
    }[];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json([]);
    }

    // Filter to trusted sources only
    const trusted = items.filter((item) =>
      TRUSTED_SOURCES.some((src) =>
        item.source?.toLowerCase().includes(src.toLowerCase())
      )
    );

    const toSave = (trusted.length > 0 ? trusted : items).slice(0, 8);

    // Delete old cached news and replace
    await prisma.companyNews.deleteMany({ where: { startupId } });
    await prisma.companyNews.createMany({
      data: toSave.map((item) => ({
        startupId,
        title: item.title,
        summary: `[${item.source}] ${item.summary}`,
        sourceUrl: item.sourceUrl || null,
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),
      })),
    });

    const saved = await prisma.companyNews.findMany({
      where: { startupId },
      orderBy: { publishedAt: "desc" },
    });

    return NextResponse.json(saved);
  } catch (err) {
    console.error("[ai/news]", err);
    // Return whatever is cached even if stale
    if (cached.length > 0) return NextResponse.json(cached);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
