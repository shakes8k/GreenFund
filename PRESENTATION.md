# GreenFund — Pitch Deck
### Climate Investment Platform · Text Presentation

---

## SLIDE 1 — Title

```
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║              🌿  G R E E N F U N D                       ║
║                                                          ║
║        The AI-Verified Climate Investment Platform       ║
║                                                          ║
║   Connecting Impact Investors with Verified Green        ║
║   Startups — Transparently, Trustlessly, On-Chain        ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

---

## SLIDE 2 — The Problem

### Climate investing is broken

```
  $500B+         BUT       Less than 12%
  invested in              of funds reach
  climate tech             verified projects
  annually
```

**Three critical failures:**

```
  ❌  TRUST GAP         No independent verification of actual impact claims
  ❌  OPACITY           Investors can't see real financials or risk profiles
  ❌  SLOW CAPITAL      Fund release is manual, delayed, and open to fraud
```

> "Every year, billions flow into 'green' projects that never prove their
>  environmental impact. Investors have no way to know the difference."

---

## SLIDE 3 — The Solution

### GreenFund: Verified, Transparent, Automated

```
  ┌─────────────────────────────────────────────────────┐
  │                                                     │
  │   COMPANY          AI SCORE        DVN VERDICT      │
  │   submits    ──►   (Claude)   ──►  (Experts)   ──►  │
  │   profile          0-100           approve/         │
  │                    4 dimensions    reject            │
  │                                         │            │
  │                                         ▼            │
  │   INVESTOR  ◄──  SMART CONTRACT  ◄──  FUNDS         │
  │   gets             milestone           released      │
  │   returns          vault               on proof      │
  │                                                     │
  └─────────────────────────────────────────────────────┘
```

**What makes it different:**
- AI scores every startup on Growth, Impact, Risk, and Overall
- Human experts in the DVN stake tokens to verify — skin in the game
- Funds locked in smart contract escrow until milestones are physically proven

---

## SLIDE 4 — Core Innovation

### The Decentralized Verification Network (DVN)

```
        ┌──────────────┐
        │   COMPANY    │
        │   Profile    │
        └──────┬───────┘
               │
       ┌───────▼────────┐
       │   AI ENGINE    │  ← Claude (Anthropic)
       │  Growth  67    │    Scores 4 dimensions
       │  Impact  82    │    Generates narrative
       │  Risk    34    │
       │  Overall 74    │
       └───────┬────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
  Expert 1   Expert 2   Analyst 1
  (staked)   (staked)   (report + PDF)
  APPROVE    APPROVE    Rating: ★★★★☆
  conf: 89%  conf: 76%  Growth: 71
                        Impact: 80
    └──────────┬──────────┘
               ▼
        CONSENSUS VIEW
        Node network graph
        Score comparison bars
        Majority verdict
```

**Why it works:** Experts lose staked GFT tokens if their verdicts are consistently wrong. Analysts build reputation through rated, scored reports.

---

## SLIDE 5 — Platform Modules

```
┌────────────────────┬────────────────────┬────────────────────┐
│   FOR INVESTORS    │   FOR COMPANIES    │   FOR ANALYSTS     │
├────────────────────┼────────────────────┼────────────────────┤
│ • Portfolio        │ • 5-step onboard   │ • Write reports    │
│   dashboard        │   with doc upload  │ • Score companies  │
│ • AI-scored        │ • Request funding  │ • Upload PDF       │
│   startup feed     │   rounds           │ • Build reputation │
│ • Risk + SDG       │ • Milestone        │ • View DVN graph   │
│   3D analytics     │   tracking         │ • Compare with AI  │
│ • DVN network      │ • Financial        │                    │
│   visualization    │   updates          │                    │
│ • Secondary        │ • Admin review     │                    │
│   market           │   status           │                    │
└────────────────────┴────────────────────┴────────────────────┘
```

---

## SLIDE 6 — Technology Stack

```
  FRONTEND         BACKEND          DATA             BLOCKCHAIN
  ─────────        ───────          ────             ──────────
  Next.js 15       FastAPI          PostgreSQL        Polygon
  TypeScript       Python 3.11      Prisma ORM        (Amoy testnet)
  Tailwind CSS     Anthropic API    Turborepo         Solidity 0.8.24
  Recharts         (Claude Haiku)   pnpm mono         OpenZeppelin v5
  SVG animations   AI scoring       Prisma Studio     Hardhat
  Glassmorphism    endpoints        migrations        Chainlink Oracle
  3D CSS/SVG       Uvicorn                            ERC20 (GFT)
```

**Key architectural choices:**

```
  • Server components (Next.js 15) — zero client-side DB exposure
  • Prisma direct access — no REST API layer, fewer attack surfaces
  • localStorage auth — simple, works without session infra
  • pnpm monorepo — all packages share types, zero drift
  • Smart contract escrow — trustless milestone fund release
```

---

## SLIDE 7 — AI Scoring Engine

### How a startup gets its score

```
  INPUT                  CLAUDE                   OUTPUT
  ─────                  ──────                   ──────
  Company profile   ──►  Analyzes:           ──►  growthScore:   78
  Sector / Stage         • Technology             impactScore:   91
  CO₂ reduction          • Market size            riskScore:     28
  Team size              • Financial health       overallScore:  82
  Funding ask            • ESG alignment          narrative:
  Milestones             • Team capability          "SolarGrid's
  SDG goals              • Competitive moat         proprietary..."
  Documents              • Risk factors
```

**Analyst consensus layer:**
Analysts input the same 4 dimensions — the DVN panel shows a live comparison of analyst average vs AI score, highlighting where human judgment diverges from the model.

---

## SLIDE 8 — Risk & SDG Intelligence

### Futuristic 3D Analytics Interface

```
  ┌─────────────────────────────────────────────────────────┐
  │  RISK INTELLIGENCE               SDG IMPACT             │
  │  ─────────────────               ──────────             │
  │                                                         │
  │    ◉  OVERALL RISK: 34          SDG 7  ████████ 82     │
  │    [spinning neon orb]          SDG 13 ███████  76     │
  │                                 SDG 11 ██████   68     │
  │  Radar Chart (6-axis):          SDG 9  █████    61     │
  │  Market Risk    42              SDG 15 ████     54     │
  │  Technology     28                                      │
  │  Financial      35              ┌─────────────────┐    │
  │  Regulatory     51              │ Inferred from   │    │
  │  Execution      29              │ category:       │    │
  │  DVN Score      18              │ solar_energy    │    │
  │                                 └─────────────────┘    │
  └─────────────────────────────────────────────────────────┘
```

SDGs are inferred automatically from company category when not declared — labeled clearly as "Inferred from category."

---

## SLIDE 9 — Secondary Market

```
  INVESTOR A                              INVESTOR B
  holds 5% stake          LIST            wants entry
  in SolarGrid X  ──►  on secondary  ──►  buys at
  needs liquidity       market            premium price
```

Features:
- List share positions with ask price
- Premium/discount display vs original investment
- Search by company name
- Sort by newest, price ascending/descending, premium
- Category filters

---

## SLIDE 10 — Smart Contract Architecture

```
  ┌──────────────────────────────────────────────────────┐
  │               POLYGON BLOCKCHAIN                     │
  │                                                      │
  │  GFTToken.sol          DVNRegistry.sol               │
  │  ─────────────         ───────────────               │
  │  ERC20, 1B cap         Expert staking                │
  │  MINTER_ROLE only      Slashing on wrong verdicts    │
  │  DVN rewards           Reputation tracking           │
  │                                                      │
  │  MilestoneVault.sol    RiskPoolManager.sol            │
  │  ────────────────      ───────────────────           │
  │  Escrow per company    LP shares                     │
  │  Oracle callback       AI-driven rebalancing         │
  │  Chainlink verified    Basis point weights           │
  │  release trigger       10000 = 100%                  │
  │                                                      │
  │  ImpactLedger.sol                                    │
  │  ─────────────────                                   │
  │  Append-only record    On-chain ESG proof             │
  │  REPORTER_ROLE writes  Mirrored in Prisma DB         │
  └──────────────────────────────────────────────────────┘
```

---

## SLIDE 11 — User Flows

### Investor Flow
```
  Register  ──►  Browse startups  ──►  View AI score + DVN  ──►  Invest
      │                                                              │
      └──────────────────────────────────────────────────────────►  │
                        Dashboard: portfolio health, CO₂
                        attribution, paper returns, secondary
                        market listings
```

### Company Flow
```
  Register  ──►  5-step onboard  ──►  Admin review  ──►  Go live
                 (docs, people,        Approve /          Receive
                 financials,           Reject             investor
                 funding ask)                             offers
```

### Analyst Flow
```
  Register  ──►  Browse queue  ──►  Write report  ──►  Score + PDF
                 (verified              Rating          4 dimensions
                 startups)              1-5★            mirrors AI
```

---

## SLIDE 12 — Competitive Advantages

```
  ┌─────────────────────┬──────────────┬────────────┬────────────┐
  │ Feature             │ GreenFund    │ Traditional│ Generic    │
  │                     │             │ ESG Fund   │ Crowdfund  │
  ├─────────────────────┼──────────────┼────────────┼────────────┤
  │ AI-verified scoring │      ✅      │     ❌     │     ❌     │
  │ On-chain escrow     │      ✅      │     ❌     │     ❌     │
  │ DVN expert network  │      ✅      │     ❌     │     ❌     │
  │ Analyst reports     │      ✅      │     ✅     │     ❌     │
  │ Secondary market    │      ✅      │     ❌     │     ❌     │
  │ Real-time SDG data  │      ✅      │  Sometimes │     ❌     │
  │ Milestone gating    │      ✅      │     ❌     │     ❌     │
  │ Open to retail      │      ✅      │     ❌     │     ✅     │
  └─────────────────────┴──────────────┴────────────┴────────────┘
```

---

## SLIDE 13 — Roadmap

```
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PHASE 1 (NOW)         PHASE 2               PHASE 3
  ─────────────         ───────               ───────
  ✅ Core platform      AI model fine-tuning   Mobile app
  ✅ AI scoring         Real oracle (Chainlink) Institutional
  ✅ DVN network        KYC/AML integration     API access
  ✅ Smart contracts    Multi-chain (Ethereum)  GFT token
  ✅ Dashboards (4)     iOS/Android wallet      public sale
  ✅ Secondary market   Regulatory compliance   DAO governance
  ✅ Risk/SDG 3D UI     Live CO₂ verification   Cross-border
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## SLIDE 14 — Summary

```
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │   GreenFund is the first climate investment platform    │
  │   that combines:                                        │
  │                                                         │
  │   🤖  AI SCORING      Objective, consistent, fast       │
  │   👥  DVN NETWORK     Human expertise + staked skin     │
  │   🔒  SMART ESCROW    Trustless milestone release        │
  │   📊  TRANSPARENCY    Full analytics for every          │
  │                       investor, every company           │
  │                                                         │
  │   Making climate capital flow faster,                   │
  │   further, and with full accountability.                │
  │                                                         │
  └─────────────────────────────────────────────────────────┘

             github.com/[your-org]/GreenFund
```

---

*GreenFund Presentation — Version 1.0 · March 2026*
