import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserNav } from "@/components/UserNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "GreenFund – Climate Investment Ecosystem",
  description:
    "AI-powered climate investment platform with decentralized verification, milestone-based funding, and real-time impact tracking.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(localStorage.getItem('theme')==='light'){document.documentElement.classList.add('light');}})();`,
          }}
        />
      </head>
      <body className="min-h-screen text-gray-100 antialiased" style={{ backgroundColor: "var(--page-bg)" }} suppressHydrationWarning>
        <header
          className="gf-navbar fixed top-0 left-0 right-0 z-50"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 ring-1 ring-indigo-400/30">
                <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-lg font-semibold tracking-tight">
                <span className="gradient-text">Green</span>
                <span className="text-white">Fund</span>
              </span>
            </Link>

            <div className="flex items-center gap-2.5">
              <ThemeToggle />
              <UserNav />
            </div>
          </div>
        </header>

        <div className="pt-[73px]">{children}</div>
      </body>
    </html>
  );
}
