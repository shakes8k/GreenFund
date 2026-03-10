# GreenFund — Climate Investment Platform

GreenFund is a full-stack climate investment platform that connects verified green startups with impact investors, backed by AI scoring, on-chain smart contracts, and a Decentralized Verification Network (DVN) of domain experts and analysts.

---

## Table of Contents

1. [What is GreenFund?](#what-is-greenfund)
2. [Core Features](#core-features)
3. [Architecture Overview](#architecture-overview)
4. [Local Setup Guide](#local-setup-guide)
5. [Environment Variables](#environment-variables)
6. [Commands Reference](#commands-reference)
7. [Project Notes](#project-notes)

---

## What is GreenFund?

GreenFund solves the trust and transparency gap in climate investing. Traditional platforms offer no independent verification of a startup's actual environmental impact. GreenFund combines:

- **AI-powered scoring** (Claude via Anthropic API) for objective startup evaluation
- **Decentralized Verification Network** (DVN) where staked experts and analysts add independent assessments
- **Smart contracts** for milestone-gated fund release (funds only unlock when real-world completion is verified)
- **Role-based dashboards** for investors, companies, analysts, and admins

---

## Core Features

| Feature | Description |
|---|---|
| Company Onboarding | 5-step registration with document upload, key people, and fundraising ask |
| AI Scoring | Growth, Impact, Risk, and Overall scores (0–100) with narrative — powered by Claude |
| DVN Network | Staked experts submit verdicts; analysts write reports with metric scores and PDF attachments |
| Analyst Node Graph | Force-directed SVG network showing score proximity/consensus between analysts and DVN experts |
| Risk & SDG Dashboard | 3D futuristic risk orb, radar chart, and glassmorphism SDG impact cards (infers SDGs from category) |
| Fundraising Rounds | Fractional investor offers, equity %, valuation tracking |
| Secondary Market | Peer-to-peer share listings with search, sort, and category filter |
| Milestone Vault | On-chain escrow — funds released only after oracle-verified milestone completion |
| Financial Metrics | Admin-entered financials (revenue, EBITDA, burn rate, runway) visible to investors |
| Admin Review | Full review queue with onboarding details, approve/reject, financial metric entry |

---

## Architecture Overview

```
greenfund/
├── apps/
│   ├── web/            # Next.js 15 (TypeScript) — UI + API routes
│   └── ai-service/     # FastAPI (Python 3.11) — AI/ML pipeline
├── packages/
│   ├── contracts/      # Hardhat + Solidity — on-chain logic
│   ├── db/             # Prisma ORM + PostgreSQL schema
│   └── shared/         # Shared TypeScript types
```

### How the layers connect

- **Next.js** (`apps/web`) is the primary user-facing app. It reads data directly from Prisma (no REST layer) and proxies AI requests to FastAPI via `src/lib/ai-client.ts`.
- **FastAPI** (`apps/ai-service`) exposes `/api/v1` endpoints for scenario stress-testing, impact forecasting, and AI scoring. It calls Claude Haiku for narrative generation.
- **Prisma** (`packages/db`) is the single source of truth for all off-chain state.
- **Smart contracts** (`packages/contracts`) are deployed to Polygon (Amoy testnet). Milestone releases and pool rebalancing are triggered after AI/DVN confirmation.

### Auth model

Authentication is localStorage-based (no JWT/sessions). An `AuthUser` object is stored under the key `gf_user`. Roles: `investor`, `company`, `analyst`, `admin`. Admin emails are configured via the `ADMIN_EMAILS` environment variable.

---

## Local Setup Guide

### Prerequisites

Make sure the following are installed on your machine:

| Tool | Version | Install |
|---|---|---|
| Node.js | >= 20 | https://nodejs.org |
| pnpm | >= 9 | `npm install -g pnpm` |
| Python | >= 3.11 | https://python.org |
| PostgreSQL | >= 14 | https://postgresql.org or Docker |
| Git | any | https://git-scm.com |

---

### Step 1 — Clone the repository

```bash
git clone <your-repo-url> GreenFund
cd GreenFund
```

---

### Step 2 — Set up environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and set at minimum:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://greenfund:greenfund@localhost:5432/greenfund_dev"

# Anthropic API key (for AI scoring and narratives)
ANTHROPIC_API_KEY="sk-ant-..."

# AI service URL (leave as-is for local dev)
AI_SERVICE_URL="http://localhost:8000"

# Admin emails (comma-separated — these users get the admin role)
ADMIN_EMAILS="your@email.com"
```

The blockchain keys (`DEPLOYER_PRIVATE_KEY`, `POLYGON_AMOY_RPC_URL`) are only needed if you want to deploy or interact with smart contracts.

---

### Step 3 — Start PostgreSQL

**Option A — Docker (recommended):**

```bash
docker compose up postgres -d
```

**Option B — Local PostgreSQL:**

```sql
-- Run in psql as superuser:
CREATE USER greenfund WITH PASSWORD 'greenfund';
CREATE DATABASE greenfund_dev OWNER greenfund;
```

---

### Step 4 — Install dependencies

```bash
pnpm install
```

This installs all workspace packages (web, ai-service excluded — Python has its own step).

---

### Step 5 — Set up the database

Push the Prisma schema to your database and generate the client:

```bash
pnpm db:generate    # generate Prisma client
cd packages/db && npx prisma db push && cd ../..   # push schema to DB
```

Optionally seed with sample data:

```bash
cd packages/db && pnpm seed && cd ../..
```

---

### Step 6 — Set up the AI service (Python)

```bash
cd apps/ai-service
python -m venv .venv
source .venv/bin/activate        # on Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cd ../..
```

---

### Step 7 — Start the development servers

Open **two terminals**:

**Terminal 1 — Next.js + shared packages (all in one via Turborepo):**

```bash
pnpm dev
```

This starts:
- Next.js web app on `http://localhost:3000`
- TypeScript watch on `packages/shared`

**Terminal 2 — Python AI service:**

```bash
cd apps/ai-service
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

---

### Step 8 — Create your first admin account

1. Open `http://localhost:3000/auth/register`
2. Register with the email you set in `ADMIN_EMAILS`
3. You will automatically get the `admin` role on login
4. Visit `http://localhost:3000/admin` to access the admin dashboard

---

### Step 9 — (Optional) Smart contracts

Only needed if you want to work with on-chain features:

```bash
# Start a local Hardhat blockchain node
cd packages/contracts
npx hardhat node

# In another terminal, deploy contracts to local node
pnpm contracts:deploy:local
```

---

### Verify everything is running

| Service | URL | Status check |
|---|---|---|
| Next.js | http://localhost:3000 | Should show GreenFund landing |
| AI Service | http://localhost:8000/docs | FastAPI Swagger UI |
| Prisma Studio | run `pnpm db:studio` | Visual DB browser |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude |
| `AI_SERVICE_URL` | Yes | URL of the FastAPI service |
| `ADMIN_EMAILS` | Yes | Comma-separated list of admin emails |
| `NEXT_PUBLIC_CHAIN_ID` | No | Polygon chain ID (default: 80002 for Amoy testnet) |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | No | WalletConnect project ID |
| `DEPLOYER_PRIVATE_KEY` | No | Private key for contract deployment |
| `POLYGON_AMOY_RPC_URL` | No | RPC URL for Polygon Amoy testnet |
| `POLYGONSCAN_API_KEY` | No | For contract verification on Polygonscan |

---

## Commands Reference

### Monorepo (run from root)

```bash
pnpm dev              # start all apps in parallel
pnpm build            # build all packages/apps
pnpm lint             # lint all packages
pnpm typecheck        # typecheck all packages
pnpm db:generate      # regenerate Prisma client after schema changes
pnpm db:migrate       # run Prisma migrations
pnpm db:studio        # open Prisma Studio (visual DB browser)
```

### Smart contracts

```bash
pnpm contracts:compile         # compile Solidity
pnpm contracts:test            # run Hardhat tests
pnpm contracts:deploy:local    # deploy to local Hardhat node
```

### AI service (from `apps/ai-service/`)

```bash
uvicorn app.main:app --reload --port 8000   # start server
pytest tests/                               # run tests
ruff check app/                             # lint
mypy app/                                   # type check
```

---

## Project Notes

### Database schema
After any changes to `packages/db/prisma/schema.prisma`, always run:
```bash
pnpm db:generate
cd packages/db && npx prisma db push
```
Then **restart the Next.js dev server** to pick up the regenerated Prisma client.

### AI scoring
The AI service scores startups on four dimensions: **Growth**, **Impact**, **Risk**, and **Overall** (0–100 scale). The same dimensions are used for analyst report scoring, enabling consensus comparison in the DVN panel.

### DVN Panel
Each startup detail page has a **DVN Network** tab showing:
- Force-directed node graph (DVN experts as diamonds, analysts as circles)
- Score consensus bars (analyst average vs AI score on all 4 dimensions)
- DVN assessment cards with verdict and confidence
- Analyst report cards with ratings, scores, and PDF links

### Smart contract architecture
- Solidity `0.8.24`, EVM target `cancun` (required for OpenZeppelin v5)
- All contracts use `AccessControl` (not `Ownable`)
- `MilestoneVault`: escrow with oracle-triggered release
- `DVNRegistry`: staking/slashing for expert nodes
- `RiskPoolManager`: LP shares with AI-driven weight rebalancing
- `GFT Token`: ERC20, 1B cap, only `MINTER_ROLE` can mint
