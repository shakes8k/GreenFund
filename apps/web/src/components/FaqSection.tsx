"use client";

import { useState } from "react";

interface FaqItem {
  q: string;
  a: string;
}

export function FaqSection({ faqs }: { faqs: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {faqs.map(({ q, a }, i) => (
        <div
          key={q}
          className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden transition-all"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-white/[0.02]"
          >
            <span className="font-semibold text-white">{q}</span>
            <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 text-gray-400 text-sm font-bold transition-transform" style={{ transform: open === i ? "rotate(45deg)" : "none" }}>
              +
            </span>
          </button>
          {open === i && (
            <div className="px-6 pb-5">
              <div className="border-t border-white/5 pt-4">
                <p className="font-light leading-relaxed text-gray-500">{a}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
