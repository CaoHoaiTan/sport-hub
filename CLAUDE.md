# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SportHub is a sports tournament management platform supporting football, volleyball, and badminton. It handles tournament creation, team/player management, scheduling (round-robin, single/double elimination, group+knockout), live scoring, QR check-in, and Vietnam-specific payment gateways (MoMo, VNPay, VietQR).

## Tech Stack

- **Runtime:** Node.js + TypeScript (strict mode)
- **API:** GraphQL (Apollo Server v4 + Express)
- **Database:** PostgreSQL 16 with Kysely (type-safe query builder, no ORM)
- **Cache & Realtime:** Redis (caching, pub/sub for GraphQL subscriptions, sessions)
- **Auth:** JWT (access 15min + refresh 7d rotation)
- **Frontend:** Next.js 15 (App Router) + React 19 + shadcn/ui + Tailwind CSS v4
- **GraphQL Client:** Apollo Client + @apollo/experimental-nextjs-app-support
- **Monorepo:** yarn 4 workspaces
- **Testing:** Vitest + Supertest
- **Validation:** Zod
- **Containerization:** Docker + Docker Compose

## Commands

```bash
# Infrastructure
docker compose up -d              # Start PostgreSQL 16 + Redis 7

# Dependencies
yarn install                          # Install all workspace dependencies

# Database
yarn workspace @sporthub/db migrate   # Run migrations
yarn workspace @sporthub/db seed      # Run seed data
yarn workspace @sporthub/db generate  # Kysely codegen (regenerate DB types)
yarn workspace @sporthub/db reset     # Drop & recreate database

# API server
yarn workspace @sporthub/api dev      # Start dev server (http://localhost:4000/graphql)
yarn workspace @sporthub/api build    # Build for production

# Web frontend
yarn workspace @sporthub/web dev      # Start dev server (http://localhost:3000)
yarn workspace @sporthub/web build    # Build for production

# Testing
yarn workspace @sporthub/api test              # Run all tests
yarn workspace @sporthub/api test -- bracket   # Run a single test file by name
yarn workspace @sporthub/shared test           # Run shared package tests
```

## Architecture

### Monorepo Layout

```
packages/db/        — Kysely instance, migrations, seeds, generated DB types
packages/shared/    — Constants (sport rules, enums), utilities (bracket/round-robin/standings algorithms), shared types
apps/api/           — GraphQL API server (Express + Apollo Server v4)
apps/web/           — Next.js 15 frontend (App Router, shadcn/ui, Apollo Client)
scripts/            — CLI scripts for migrate, seed, codegen, reset-db
```

### API Module Pattern

Each domain in `apps/api/src/schema/` follows a consistent three-file pattern:
- `*.typeDefs.ts` — GraphQL SDL type definitions
- `*.resolvers.ts` — Resolver implementations
- `*.service.ts` — Business logic (Kysely queries, validation, side effects)

Modules: `auth`, `user`, `tournament`, `team`, `player`, `match`, `standing`, `venue`, `checkin`, `payment`, `notification`, `public`

### Frontend Architecture (`apps/web/`)

Route groups:
- `(auth)/` — Login, register, forgot/reset password (centered card layout, no sidebar)
- `(public)/t/` — Public tournament pages (SSR for SEO, public navbar + footer)
- `(dashboard)/` — Authenticated pages (sidebar + topbar, protected by auth guard)

Key directories:
- `src/components/ui/` — shadcn/ui primitives (button, card, dialog, table, etc.)
- `src/components/layout/` — Sidebar, topbar, public navbar, footer
- `src/components/shared/` — Data table, loading skeleton, empty state, role gate, confirm dialog
- `src/components/{tournament,match,team,player,standing,checkin,payment,notification,dashboard,public}/` — Feature components
- `src/graphql/{fragments,queries,mutations,subscriptions}/` — GraphQL documents
- `src/lib/apollo/` — Apollo Client setup (browser + RSC)
- `src/lib/auth/` — Token management, AuthContext, ProtectedRoute

### GraphQL Context

Defined in `apps/api/src/context.ts` — injects `db` (Kysely instance), `redis` client, and authenticated `user` (from JWT) into every resolver.

### Key Shared Utilities (`packages/shared/src/utils/`)

- `bracket.ts` — Single/double elimination bracket generation with seeding and byes
- `round-robin.ts` — Circle-method round-robin scheduling
- `standings.ts` — Standings calculation with sport-specific tiebreakers (points > goal diff > goals for > head-to-head)

### Auth Flow

JWT access token (15min) + refresh token (7d) with rotation. Middleware in `apps/api/src/middleware/`:
- `auth.guard.ts` — JWT verification, injects user into context
- `role.guard.ts` — Role-based access control (`admin`, `organizer`, `team_manager`, `player`, `referee`)

### Sport-Specific Rules

Sport rules (roster sizes, scoring validation) are defined in `packages/shared/src/constants/sports.ts`:
- **Football:** 5-11 min / 11-25 max players, single score
- **Volleyball:** 6 min / 14 max, best-of-3/5 sets (25 pts, 5th set 15 pts, 2-pt lead)
- **Badminton:** 1-2 min / 2-4 max, best-of-3 sets (21 pts, 2-pt lead, max 30)

### Payment Integration

Vietnam-specific gateways in `apps/api/src/lib/payment/`: MoMo, VNPay, VietQR. Currency is VND.

### Realtime

Redis pub/sub powers GraphQL subscriptions for live match scores via `apps/api/src/lib/pubsub.ts`.

## Database

- Migrations are in `packages/db/src/migrations/` (sequential numbered files)
- Types are generated by `kysely-codegen` into `packages/db/src/types/db.d.ts`
- After schema changes: write migration, run it, then regenerate types
- All IDs are UUIDs, all timestamps are TIMESTAMPTZ

## Key Design Decisions

- **Schema-first GraphQL** with SDL (not code-first)
- **Kysely query builder** instead of an ORM — write type-safe SQL, no magic
- **Cursor-based pagination** for list queries
- **State machine** for tournament lifecycle: draft > registration > in_progress > completed (any > cancelled)
- **Bracket advancement** is automatic — submitting a match result in elimination format fills the winner into the next bracket match
