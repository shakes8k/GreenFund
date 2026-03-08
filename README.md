# README.md

This file provides guidance when working with code in this repository.

## Architecture Overview

GreenFund is a climate investment platform structured as a **pnpm monorepo** managed with Turborepo. It has three distinct runtimes that must all be running for full local development:

```
greenfund/
├── apps/
│   ├── web/            # Next.js 15 (TypeScript) — investor-facing UI + API routes
│   └── ai-service/     # FastAPI (Python 3.11) — AI/ML pipeline
├── packages/
│   ├── contracts/      # Hardhat + Solidity — on-chain logic
│   ├── db/             # Prisma client + schema — PostgreSQL
│   └── shared/         # Shared TypeScript types (no runtime deps)
```

### How the layers connect

- **Next.js** (`apps/web`) is the primary user-facing app. It imports `@greenfund/db` for server-side data access and proxies AI requests to the FastAPI service via `src/lib/ai-client.ts`.
- **FastAPI** (`apps/ai-service`) exposes `/api/v1` endpoints for: scenario stress-testing (`/scenario`), impact forecasting (`/impact`), and risk pool rebalancing (`/pools`). It calls Anthropic Claude (Haiku) for narrative generation.
- **Smart contracts** (`packages/contracts`) are deployed to Polygon (Amoy testnet / mainnet). The backend triggers contract calls (milestone releases, pool rebalancing) after AI/DVN confirmation.
- **Prisma** (`packages/db`) is the single source of truth for off-chain state. The on-chain data (ImpactLedger) mirrors what's in the DB via REPORTER_ROLE writes.

### Key domain concepts

- **DVN (Decentralized Verification Network)** — experts stake GFT tokens to assess startups. `DVNRegistry.sol` handles staking/slashing. The DB mirrors assessments via `DVNAssessment` / `DVNExpert` tables.
- **Milestone Vault** — funds held in `MilestoneVault.sol` escrow; released only when `ORACLE_ROLE` (Chainlink) calls `oracleCallback()` confirming physical completion.
- **Risk Pools** — `RiskPoolManager.sol` holds LP shares; the AI rebalancer pushes new weights via `REBALANCER_ROLE`. Weights are in basis points (10000 = 100%).
- **GFT Token** — ERC20 used for DVN staking/rewards. Only `MINTER_ROLE` contracts can mint (cap: 1B).
- **Impact Ledger** — append-only on-chain record in `ImpactLedger.sol`; also mirrored in the `ImpactLedgerEntry` Prisma table for fast queries.

## Commands

### Root monorepo

```bash
pnpm dev           # start all apps in parallel (requires .env)
pnpm build         # build all packages/apps
pnpm lint          # lint all packages
pnpm typecheck     # typecheck all packages
```

### Database

```bash
pnpm db:generate   # regenerate Prisma client after schema changes
pnpm db:migrate    # run migrations (requires DATABASE_URL in .env)
pnpm db:studio     # open Prisma Studio
```

### Smart contracts

```bash
pnpm contracts:compile          # compile Solidity (produces typechain-types/)
pnpm contracts:test             # run Hardhat tests
pnpm contracts:deploy:local     # deploy to local hardhat node
```

Or directly from `packages/contracts/`:

```bash
npx hardhat node                # start local blockchain
npx hardhat test                # run a single test file: npx hardhat test test/DVNRegistry.test.ts
npx hardhat coverage            # coverage report
```

### AI service

```bash
cd apps/ai-service
python -m venv .venv && pip install -e ".[dev]"   # first time setup
DATABASE_URL=... ANTHROPIC_API_KEY=... uvicorn app.main:app --reload --port 8000
pytest tests/                                      # run tests
pytest tests/test_scenario_engine.py -k "test_name"  # single test
ruff check app/                                    # lint
mypy app/                                          # type check
```

> Tests require `DATABASE_URL` and `ANTHROPIC_API_KEY` as env vars (even if DB is unreachable — they're validated at import time).

### Infrastructure

```bash
docker compose up postgres    # just the database
docker compose up             # postgres + ai-service
```

## Environment Setup

Copy `.env.example` → `.env` at the repo root. All services read from `../../.env` relative to their location, or from the root via Docker Compose `env_file`.

Required vars: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `DEPLOYER_PRIVATE_KEY`, `POLYGON_AMOY_RPC_URL`.

## Smart Contract Notes

- Solidity version: `0.8.24`, EVM target: **`cancun`** (required for OpenZeppelin v5 — uses `mcopy` opcode).
- All contracts use OpenZeppelin v5 `AccessControl` (not `Ownable`). Role constants are `keccak256` hashes defined in each contract.
- `RiskPoolManager` stores pool state with a `mapping(bytes32 => Pool)` where `Pool` contains a nested mapping — this means `delete p.startupIds` resets the array but the nested `weights` mapping must be cleared manually (done before each rebalance).
- Typechain types are generated to `packages/contracts/typechain-types/` after compile.

## AI Service Notes

- `app/core/config.py` instantiates `Settings` at module import time — this means **all endpoints fail at startup without required env vars**. This is intentional (fail-fast).
- The scenario engine (`services/scenario_engine.py`) uses placeholder linear model weights. Replace `_WEIGHTS` and `_BIAS` with a trained model for production.
- The pool rebalancer (`services/pool_rebalancer.py`) currently uses mock startup profiles in the endpoint — wire up real DB queries before shipping.
- Claude Haiku is used for narrative generation (cost-efficient). The model ID is `claude-haiku-4-5-20251001`.

## Next.js Notes

- Server components fetch data directly from Prisma (no REST layer between Next.js and DB).
- The `ScenarioSimulator` is a `"use client"` component that calls `/api/scenario/[startupId]` (Next.js route handler), which proxies to the AI service.
- Wagmi v2 + viem is configured for wallet connection (on Polygon Amoy, `NEXT_PUBLIC_CHAIN_ID=80002`).
- `revalidate` is set per-page (30-60s ISR) rather than globally.
