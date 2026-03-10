"use client";

import { useEffect, useState } from "react";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string | null;
  publishedAt: string;
}

export function NewsPanel({ startupId, cached }: { startupId: string; cached: NewsItem[] }) {
  const [news, setNews] = useState<NewsItem[]>(cached);
  const [loading, setLoading] = useState(cached.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cached.length > 0) return; // already have fresh cache from server
    fetch(`/api/ai/news?startupId=${startupId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setNews(data);
        else setError("Could not load news.");
        setLoading(false);
      })
      .catch(() => { setError("Could not load news."); setLoading(false); });
  }, [startupId, cached.length]);

  function refresh() {
    setLoading(true);
    setError(null);
    fetch(`/api/ai/news?startupId=${startupId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setNews(data);
        else setError("Could not load news.");
        setLoading(false);
      })
      .catch(() => { setError("Could not load news."); setLoading(false); });
  }

  // Parse source name from summary prefix "[Source] ..."
  function parseSource(summary: string) {
    const match = summary.match(/^\[([^\]]+)\]/);
    return match ? { source: match[1]!, body: summary.slice(match[0].length).trim() } : { source: null, body: summary };
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Company &amp; Industry News</h2>
          <p className="text-xs text-gray-500 mt-0.5">AI-sourced from trusted publications via Google Search</p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition disabled:opacity-50"
        >
          <svg className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? "Fetching…" : "Refresh"}
        </button>
      </div>

      {loading && news.length === 0 && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-white/5 bg-white/[0.02]" />
          ))}
          <p className="text-center text-xs text-gray-600 pt-2">
            Searching Reuters, Bloomberg, Economic Times and more…
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-400">{error}</div>
      )}

      {!loading && news.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-white/10 py-14 text-center">
          <p className="text-gray-500">No recent news found for this company.</p>
          <button onClick={refresh} className="mt-3 text-xs text-green-400 hover:underline">Try again →</button>
        </div>
      )}

      {news.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {news.map((item) => {
            const { source, body } = parseSource(item.summary);
            return (
              <div key={item.id} className="group flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-5 transition hover:border-green-500/20 hover:bg-white/[0.03]">
                {/* Source + date row */}
                <div className="flex items-center justify-between gap-2">
                  {source && (
                    <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-green-400">
                      {source}
                    </span>
                  )}
                  <p className="ml-auto text-[10px] text-gray-600">
                    {new Date(item.publishedAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>

                {/* Headline */}
                <h3 className="font-semibold text-white leading-snug group-hover:text-green-100 transition-colors">
                  {item.title}
                </h3>

                {/* Body */}
                <p className="text-sm leading-relaxed text-gray-400 flex-1">{body}</p>

                {/* Link */}
                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-medium text-green-400 hover:text-green-300 transition-colors"
                  >
                    Read full article
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
