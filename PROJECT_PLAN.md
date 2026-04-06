# SportHub - Sports Tournament Management & Organization Platform

## Project Overview

**Project name:** SportHub
**Description:** A comprehensive platform for managing and organizing sports tournaments (football, volleyball, badminton) with full features including tournament creation, team/player management, scheduling, live score, check-in, payment integration, and a public-facing page for spectators.

**Tech Stack:**

- **Runtime:** Node.js + TypeScript (strict mode)
- **API:** GraphQL (Apollo Server v4 + Express)
- **Database:** PostgreSQL 16
- **Query Builder:** Kysely (type-safe, no ORM)
- **Cache & Realtime:** Redis (caching, pub/sub for subscriptions, sessions)
- **Auth:** JWT (access + refresh token)
- **Monorepo:** pnpm workspaces
- **Testing:** Vitest + Supertest
- **Validation:** Zod
- **Containerization:** Docker + Docker Compose

---

## Directory Structure (Monorepo)

```
sporthub/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── docker-compose.yml
├── .env.example
│
├── packages/
│   ├── db/                          # Database package (shared)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts             # Kysely instance export
│   │   │   ├── database.ts          # Database type definitions
│   │   │   ├── config.ts            # DB connection config
│   │   │   ├── types/               # Generated DB types
│   │   │   │   └── db.d.ts          # Kysely Codegen output
│   │   │   ├── migrations/          # Kysely migrations
│   │   │   │   ├── 001_users_and_auth.ts
│   │   │   │   ├── 002_tournaments.ts
│   │   │   │   ├── 003_teams_and_players.ts
│   │   │   │   ├── 004_matches_and_results.ts
│   │   │   │   ├── 005_scheduling_and_venues.ts
│   │   │   │   ├── 006_standings_and_statistics.ts
│   │   │   │   ├── 007_checkin.ts
│   │   │   │   ├── 008_payments.ts
│   │   │   │   ├── 009_notifications.ts
│   │   │   │   └── 010_public_page.ts
│   │   │   └── seeds/               # Seed data
│   │   │       ├── 001_seed_users.ts
│   │   │       ├── 002_seed_sports.ts
│   │   │       └── 003_seed_sample_tournament.ts
│   │   └── kysely.config.ts
│   │
│   └── shared/                      # Shared utilities
│       ├── package.json
│       ├── src/
│       │   ├── constants/
│       │   │   ├── sports.ts        # Sport-specific rules (max players, sets, etc.)
│       │   │   ├── tournament.ts    # Tournament format enums
│       │   │   └── match.ts         # Match status enums
│       │   ├── utils/
│       │   │   ├── bracket.ts       # Bracket generation algorithms
│       │   │   ├── round-robin.ts   # Round-robin scheduling
│       │   │   ├── standings.ts     # Standings calculation
│       │   │   └── slug.ts          # URL slug generator
│       │   └── types/
│       │       ├── sport.ts         # Sport-related types
│       │       ├── tournament.ts    # Tournament types
│       │       └── common.ts        # Shared types (Pagination, etc.)
│       └── tsconfig.json
│
├── apps/
│   └── api/                         # Main GraphQL API
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts             # Entry point: Express + Apollo Server
│       │   ├── context.ts           # GraphQL context (auth, db, redis)
│       │   ├── schema/              # GraphQL schema (schema-first with SDL)
│       │   │   ├── index.ts         # Merge all type defs + resolvers
│       │   │   │
│       │   │   ├── auth/
│       │   │   │   ├── auth.typeDefs.ts
│       │   │   │   ├── auth.resolvers.ts
│       │   │   │   └── auth.service.ts
│       │   │   │
│       │   │   ├── user/
│       │   │   │   ├── user.typeDefs.ts
│       │   │   │   ├── user.resolvers.ts
│       │   │   │   └── user.service.ts
│       │   │   │
│       │   │   ├── tournament/
│       │   │   │   ├── tournament.typeDefs.ts
│       │   │   │   ├── tournament.resolvers.ts
│       │   │   │   └── tournament.service.ts
│       │   │   │
│       │   │   ├── team/
│       │   │   │   ├── team.typeDefs.ts
│       │   │   │   ├── team.resolvers.ts
│       │   │   │   └── team.service.ts
│       │   │   │
│       │   │   ├── player/
│       │   │   │   ├── player.typeDefs.ts
│       │   │   │   ├── player.resolvers.ts
│       │   │   │   └── player.service.ts
│       │   │   │
│       │   │   ├── match/
│       │   │   │   ├── match.typeDefs.ts
│       │   │   │   ├── match.resolvers.ts
│       │   │   │   └── match.service.ts
│       │   │   │
│       │   │   ├── standing/
│       │   │   │   ├── standing.typeDefs.ts
│       │   │   │   ├── standing.resolvers.ts
│       │   │   │   └── standing.service.ts
│       │   │   │
│       │   │   ├── venue/
│       │   │   │   ├── venue.typeDefs.ts
│       │   │   │   ├── venue.resolvers.ts
│       │   │   │   └── venue.service.ts
│       │   │   │
│       │   │   ├── checkin/
│       │   │   │   ├── checkin.typeDefs.ts
│       │   │   │   ├── checkin.resolvers.ts
│       │   │   │   └── checkin.service.ts
│       │   │   │
│       │   │   ├── payment/
│       │   │   │   ├── payment.typeDefs.ts
│       │   │   │   ├── payment.resolvers.ts
│       │   │   │   └── payment.service.ts
│       │   │   │
│       │   │   ├── notification/
│       │   │   │   ├── notification.typeDefs.ts
│       │   │   │   ├── notification.resolvers.ts
│       │   │   │   └── notification.service.ts
│       │   │   │
│       │   │   └── public/
│       │   │       ├── public.typeDefs.ts
│       │   │       ├── public.resolvers.ts
│       │   │       └── public.service.ts
│       │   │
│       │   ├── middleware/
│       │   │   ├── auth.guard.ts       # JWT verification middleware
│       │   │   ├── role.guard.ts       # Role-based access control
│       │   │   └── rate-limit.ts       # Rate limiting
│       │   │
│       │   ├── plugins/
│       │   │   ├── error-handler.ts    # Apollo error formatting
│       │   │   └── logging.ts          # Request logging
│       │   │
│       │   ├── lib/
│       │   │   ├── redis.ts            # Redis client setup
│       │   │   ├── jwt.ts              # JWT sign/verify helpers
│       │   │   ├── password.ts         # bcrypt hash/compare
│       │   │   ├── qr.ts              # QR code generation
│       │   │   ├── email.ts            # Email sender (Nodemailer/Resend)
│       │   │   ├── payment/
│       │   │   │   ├── momo.ts         # MoMo payment gateway
│       │   │   │   ├── vnpay.ts        # VNPay integration
│       │   │   │   └── vietqr.ts       # VietQR bank transfer
│       │   │   └── pubsub.ts           # Redis PubSub for GraphQL subscriptions
│       │   │
│       │   └── jobs/                   # Background jobs (node-cron or BullMQ)
│       │       ├── scheduler.ts        # Job scheduler setup
│       │       ├── match-reminder.ts   # Match schedule reminders
│       │       ├── checkin-window.ts   # Auto open/close check-in window
│       │       ├── payment-expiry.ts   # Handle overdue payments
│       │       └── standings-sync.ts   # Recalculate standings
│       │
│       └── tests/
│           ├── setup.ts
│           ├── helpers/
│           │   ├── test-db.ts          # Test database setup/teardown
│           │   └── test-client.ts      # GraphQL test client
│           ├── unit/
│           │   ├── bracket.test.ts
│           │   ├── round-robin.test.ts
│           │   └── standings.test.ts
│           └── integration/
│               ├── auth.test.ts
│               ├── tournament.test.ts
│               ├── match.test.ts
│               └── payment.test.ts
│
└── scripts/
    ├── migrate.ts                   # Run migrations
    ├── seed.ts                      # Run seeds
    ├── generate-types.ts            # Kysely codegen
    └── reset-db.ts                  # Drop & recreate DB
```

---

## Database Schema

### Enums

```sql
-- Sport types
CREATE TYPE sport_type AS ENUM ('football', 'volleyball', 'badminton');

-- Tournament formats
CREATE TYPE tournament_format AS ENUM (
  'round_robin',           -- Round-robin (all-play-all)
  'single_elimination',    -- Single elimination bracket
  'double_elimination',    -- Double elimination (winners + losers bracket)
  'group_stage_knockout'   -- Group stage followed by knockout rounds
);

-- Tournament lifecycle status
CREATE TYPE tournament_status AS ENUM (
  'draft',         -- Being set up
  'registration',  -- Open for team registration
  'in_progress',   -- Matches underway
  'completed',     -- All matches finished
  'cancelled'      -- Cancelled
);

-- Match status
CREATE TYPE match_status AS ENUM (
  'scheduled',     -- Scheduled but not started
  'checkin_open',  -- Check-in window is open
  'live',          -- Currently in progress
  'completed',     -- Finished
  'postponed',     -- Postponed
  'cancelled'      -- Cancelled
);

-- User roles
CREATE TYPE user_role AS ENUM (
  'admin',         -- System administrator
  'organizer',     -- Tournament organizer
  'team_manager',  -- Team manager / captain
  'player',        -- Player
  'referee'        -- Referee
);

-- Payment status
CREATE TYPE payment_status AS ENUM (
  'pending',       -- Awaiting payment
  'paid',          -- Payment received
  'overdue',       -- Past deadline
  'refunded',      -- Refunded
  'cancelled'      -- Cancelled
);

-- Payment methods (Vietnam-specific gateways)
CREATE TYPE payment_method AS ENUM (
  'bank_transfer',  -- Bank transfer via VietQR
  'momo',           -- MoMo e-wallet
  'vnpay',          -- VNPay gateway
  'zalopay',        -- ZaloPay e-wallet
  'cash'            -- Cash payment
);

-- Notification types
CREATE TYPE notification_type AS ENUM (
  'match_reminder',     -- Upcoming match reminder
  'match_result',       -- Match result posted
  'schedule_change',    -- Schedule updated
  'payment_reminder',   -- Payment due reminder
  'registration',       -- Registration confirmation
  'checkin',            -- Check-in notification
  'announcement',       -- General announcement
  'system'              -- System notification
);

-- Check-in status
CREATE TYPE checkin_status AS ENUM (
  'pending',      -- Not yet checked in
  'checked_in',   -- Successfully checked in
  'absent'        -- Marked absent
);
```

### Tables

```sql
----------------------------------------------------------------------
-- 1. USERS & AUTH
----------------------------------------------------------------------

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  full_name       VARCHAR(255) NOT NULL,
  phone           VARCHAR(20),
  avatar_url      TEXT,
  role            user_role NOT NULL DEFAULT 'player',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  email_verified  BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

----------------------------------------------------------------------
-- 2. TOURNAMENTS
----------------------------------------------------------------------

CREATE TABLE tournaments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(255) UNIQUE NOT NULL,  -- URL-friendly identifier for public page
  description     TEXT,
  sport           sport_type NOT NULL,
  format          tournament_format NOT NULL,
  status          tournament_status NOT NULL DEFAULT 'draft',
  organizer_id    UUID NOT NULL REFERENCES users(id),

  -- Tournament configuration
  max_teams               INT,                  -- Maximum number of teams allowed
  min_players_per_team    INT NOT NULL,          -- Minimum roster size
  max_players_per_team    INT NOT NULL,          -- Maximum roster size
  group_count             INT,                   -- Number of groups (group_stage_knockout only)
  teams_per_group_advance INT,                   -- Teams advancing per group

  -- Timeline
  registration_start TIMESTAMPTZ,
  registration_end   TIMESTAMPTZ,
  start_date         TIMESTAMPTZ NOT NULL,
  end_date           TIMESTAMPTZ,

  -- Scoring rules (round-robin / group stage)
  points_for_win   INT NOT NULL DEFAULT 3,
  points_for_draw  INT NOT NULL DEFAULT 1,
  points_for_loss  INT NOT NULL DEFAULT 0,

  -- Entry fee
  entry_fee        DECIMAL(12, 2) DEFAULT 0,
  currency         VARCHAR(3) DEFAULT 'VND',

  -- Media & rules
  banner_url       TEXT,
  rules_text       TEXT,                         -- Custom tournament rules

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tournaments_organizer ON tournaments(organizer_id);
CREATE INDEX idx_tournaments_sport ON tournaments(sport);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_slug ON tournaments(slug);

----------------------------------------------------------------------
-- 3. VENUES
----------------------------------------------------------------------

CREATE TABLE venues (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(255) NOT NULL,
  address      TEXT,
  city         VARCHAR(100),
  latitude     DECIMAL(10, 8),
  longitude    DECIMAL(11, 8),
  capacity     INT,                          -- Spectator capacity
  sport_types  sport_type[] NOT NULL,        -- Compatible sport types
  surface_type VARCHAR(50),                  -- Artificial turf, hardwood, etc.
  amenities    TEXT[],                        -- Parking, restrooms, etc.
  contact_info JSONB,                        -- Phone, email for venue
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

----------------------------------------------------------------------
-- 4. TEAMS & PLAYERS
----------------------------------------------------------------------

CREATE TABLE teams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  logo_url        TEXT,
  manager_id      UUID NOT NULL REFERENCES users(id),  -- Team manager

  -- Group assignment (group_stage_knockout format)
  group_name      VARCHAR(10),              -- 'A', 'B', 'C', ...
  seed            INT,                      -- Seeding number

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(tournament_id, name)
);

CREATE INDEX idx_teams_tournament ON teams(tournament_id);

CREATE TABLE team_players (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id),           -- NULL if account not yet linked
  full_name   VARCHAR(255) NOT NULL,
  jersey_number INT,
  position    VARCHAR(50),                           -- Playing position
  is_captain  BOOLEAN NOT NULL DEFAULT false,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(team_id, jersey_number)
);

CREATE INDEX idx_team_players_team ON team_players(team_id);
CREATE INDEX idx_team_players_user ON team_players(user_id);

----------------------------------------------------------------------
-- 5. MATCHES
----------------------------------------------------------------------

CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,

  -- Competing teams
  home_team_id    UUID REFERENCES teams(id),
  away_team_id    UUID REFERENCES teams(id),

  -- Round info
  round           INT,                      -- Round number
  round_name      VARCHAR(100),             -- 'Group Stage', 'Quarter-final', 'Semi-final', 'Final'
  group_name      VARCHAR(10),              -- Group name (group stage only)
  bracket_position INT,                     -- Position in elimination bracket

  -- Schedule & venue
  venue_id        UUID REFERENCES venues(id),
  scheduled_at    TIMESTAMPTZ,               -- Planned start time
  started_at      TIMESTAMPTZ,               -- Actual start time
  ended_at        TIMESTAMPTZ,               -- Actual end time
  status          match_status NOT NULL DEFAULT 'scheduled',

  -- Referee
  referee_id      UUID REFERENCES users(id),

  -- Final result
  home_score      INT,
  away_score      INT,
  winner_team_id  UUID REFERENCES teams(id),
  is_draw         BOOLEAN DEFAULT false,

  -- Notes
  notes           TEXT,
  postponed_reason TEXT,

  -- Check-in configuration
  checkin_opens_at    TIMESTAMPTZ,           -- When check-in window opens
  checkin_deadline    TIMESTAMPTZ,           -- Check-in cutoff time

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_home ON matches(home_team_id);
CREATE INDEX idx_matches_away ON matches(away_team_id);
CREATE INDEX idx_matches_scheduled ON matches(scheduled_at);
CREATE INDEX idx_matches_status ON matches(status);

-- Per-set scores (volleyball, badminton)
CREATE TABLE match_sets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  set_number  INT NOT NULL,
  home_score  INT NOT NULL DEFAULT 0,
  away_score  INT NOT NULL DEFAULT 0,

  UNIQUE(match_id, set_number)
);

----------------------------------------------------------------------
-- 6. MATCH EVENTS (in-match events, primarily for football)
----------------------------------------------------------------------

CREATE TABLE match_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id         UUID REFERENCES teams(id),
  player_id       UUID REFERENCES team_players(id),

  event_type      VARCHAR(50) NOT NULL,       -- 'goal', 'assist', 'yellow_card', 'red_card',
                                              -- 'substitution', 'penalty', 'own_goal', 'point'
  minute          INT,                        -- Minute of occurrence (football)
  set_number      INT,                        -- Set number (volleyball / badminton)
  description     TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_match_events_match ON match_events(match_id);
CREATE INDEX idx_match_events_player ON match_events(player_id);

----------------------------------------------------------------------
-- 7. STANDINGS
----------------------------------------------------------------------

CREATE TABLE standings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  group_name      VARCHAR(10),

  played          INT NOT NULL DEFAULT 0,
  won             INT NOT NULL DEFAULT 0,
  drawn           INT NOT NULL DEFAULT 0,
  lost            INT NOT NULL DEFAULT 0,
  goals_for       INT NOT NULL DEFAULT 0,     -- Goals scored / points scored
  goals_against   INT NOT NULL DEFAULT 0,     -- Goals conceded / points conceded
  goal_difference INT NOT NULL DEFAULT 0,     -- Goal difference
  points          INT NOT NULL DEFAULT 0,

  -- Additional stats for volleyball / badminton
  sets_won        INT NOT NULL DEFAULT 0,
  sets_lost       INT NOT NULL DEFAULT 0,

  rank            INT,                         -- Calculated ranking position

  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(tournament_id, team_id)
);

CREATE INDEX idx_standings_tournament ON standings(tournament_id);

----------------------------------------------------------------------
-- 8. PLAYER STATISTICS
----------------------------------------------------------------------

CREATE TABLE player_statistics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES team_players(id) ON DELETE CASCADE,
  team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  -- Football-specific
  goals           INT NOT NULL DEFAULT 0,
  assists         INT NOT NULL DEFAULT 0,
  yellow_cards    INT NOT NULL DEFAULT 0,
  red_cards       INT NOT NULL DEFAULT 0,

  -- Volleyball / Badminton
  points_scored   INT NOT NULL DEFAULT 0,
  aces            INT NOT NULL DEFAULT 0,       -- Direct serving points

  -- General
  matches_played  INT NOT NULL DEFAULT 0,
  mvp_count       INT NOT NULL DEFAULT 0,

  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(tournament_id, player_id)
);

CREATE INDEX idx_player_stats_tournament ON player_statistics(tournament_id);
CREATE INDEX idx_player_stats_goals ON player_statistics(goals DESC);

----------------------------------------------------------------------
-- 9. CHECK-IN
----------------------------------------------------------------------

CREATE TABLE match_checkins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id         UUID NOT NULL REFERENCES teams(id),
  player_id       UUID NOT NULL REFERENCES team_players(id),

  status          checkin_status NOT NULL DEFAULT 'pending',
  checked_in_at   TIMESTAMPTZ,
  method          VARCHAR(20),                 -- 'qr_code', 'manual', 'app'
  checked_in_by   UUID REFERENCES users(id),   -- Who confirmed (referee/organizer)

  -- Lineup
  is_starting     BOOLEAN DEFAULT false,        -- Starting lineup or substitute

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(match_id, player_id)
);

CREATE INDEX idx_checkins_match ON match_checkins(match_id);

-- QR codes for check-in
CREATE TABLE checkin_qr_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  code        VARCHAR(255) UNIQUE NOT NULL,     -- Unique QR code string
  expires_at  TIMESTAMPTZ NOT NULL,
  is_used     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

----------------------------------------------------------------------
-- 10. PAYMENTS
----------------------------------------------------------------------

CREATE TABLE payment_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,         -- 'Team Registration Fee', 'Early Bird'
  amount          DECIMAL(12, 2) NOT NULL,
  currency        VARCHAR(3) NOT NULL DEFAULT 'VND',
  per_team        BOOLEAN NOT NULL DEFAULT true,  -- true = per team, false = per player
  early_bird_amount   DECIMAL(12, 2),
  early_bird_deadline TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_plan_id   UUID NOT NULL REFERENCES payment_plans(id),
  team_id           UUID REFERENCES teams(id),
  user_id           UUID REFERENCES users(id),     -- Person who made the payment

  amount            DECIMAL(12, 2) NOT NULL,
  currency          VARCHAR(3) NOT NULL DEFAULT 'VND',
  status            payment_status NOT NULL DEFAULT 'pending',
  method            payment_method,

  -- Gateway response data
  transaction_id    VARCHAR(255),                   -- Gateway transaction ID
  gateway_response  JSONB,                          -- Raw response from MoMo/VNPay
  payment_url       TEXT,                           -- Payment redirect URL

  -- Promo
  promo_code        VARCHAR(50),
  discount_amount   DECIMAL(12, 2) DEFAULT 0,

  -- Refund
  refunded_at       TIMESTAMPTZ,
  refund_reason     TEXT,

  paid_at           TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,                    -- Payment deadline
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_team ON payments(team_id);
CREATE INDEX idx_payments_status ON payments(status);

CREATE TABLE promo_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  code            VARCHAR(50) UNIQUE NOT NULL,
  discount_type   VARCHAR(10) NOT NULL,          -- 'percent' or 'fixed'
  discount_value  DECIMAL(12, 2) NOT NULL,
  max_uses        INT,
  used_count      INT NOT NULL DEFAULT 0,
  valid_from      TIMESTAMPTZ NOT NULL,
  valid_until     TIMESTAMPTZ NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

----------------------------------------------------------------------
-- 11. NOTIFICATIONS
----------------------------------------------------------------------

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  title           VARCHAR(255) NOT NULL,
  body            TEXT NOT NULL,
  data            JSONB,                         -- Metadata (match_id, tournament_id, etc.)

  is_read         BOOLEAN NOT NULL DEFAULT false,
  read_at         TIMESTAMPTZ,

  -- Delivery channels
  sent_email      BOOLEAN NOT NULL DEFAULT false,
  sent_push       BOOLEAN NOT NULL DEFAULT false,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

----------------------------------------------------------------------
-- 12. PUBLIC PAGE & SOCIAL
----------------------------------------------------------------------

-- Tournament news feed / announcements
CREATE TABLE tournament_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  author_id       UUID NOT NULL REFERENCES users(id),
  title           VARCHAR(255),
  content         TEXT NOT NULL,
  media_urls      TEXT[],                        -- Images, videos
  is_pinned       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_tournament ON tournament_posts(tournament_id);

-- Match comments from spectators
CREATE TABLE match_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id),          -- NULL for guest comments
  guest_name  VARCHAR(100),                        -- Guest display name (if not logged in)
  content     TEXT NOT NULL,
  parent_id   UUID REFERENCES match_comments(id), -- Reply threading
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_match ON match_comments(match_id);

-- Match reactions
CREATE TABLE match_reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id),
  reaction    VARCHAR(20) NOT NULL,                -- 'like', 'cheer', 'fire', 'clap'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(match_id, user_id, reaction)
);
```

---

## Implementation Phases

### Phase 1: Project Setup & Infrastructure (2-3 days)

**Goal:** Initialize monorepo, database connection, migrations, and base configuration.

**Tasks:**

1. Initialize monorepo with pnpm workspaces
   - Create `pnpm-workspace.yaml` with `packages/*` and `apps/*`
   - Create `tsconfig.base.json` (strict mode, path aliases)
   - Create `.env.example` with all environment variables

2. Set up `packages/db`
   - Install `kysely`, `pg`, `kysely-codegen`
   - Create `database.ts` with `Database` interface containing all table types
   - Create `config.ts` reading from environment variables
   - Create `index.ts` exporting the Kysely instance
   - Create `kysely.config.ts` for migration CLI

3. Set up Docker Compose
   ```yaml
   services:
     postgres:
       image: postgres:16-alpine
       environment:
         POSTGRES_DB: sporthub
         POSTGRES_USER: sporthub
         POSTGRES_PASSWORD: sporthub_dev
       ports: ["5432:5432"]
       volumes: [pgdata:/var/lib/postgresql/data]
     redis:
       image: redis:7-alpine
       ports: ["6379:6379"]
   ```

4. Write first migration: `001_users_and_auth.ts`
   - Create `user_role` enum
   - Create `users` and `refresh_tokens` tables
   - Run and verify migration

5. Set up `apps/api`
   - Initialize Express + Apollo Server v4
   - Install dependencies: `@apollo/server`, `graphql`, `express`, `cors`, `dotenv`, `zod`, `bcryptjs`, `jsonwebtoken`
   - Create `index.ts` with basic health check query
   - Create `context.ts` (inject db, redis, current user into context)

6. Write utility scripts: `migrate.ts`, `seed.ts`, `reset-db.ts`, `generate-types.ts`

**Deliverables:**
- Server running at `http://localhost:4000/graphql`
- Database connected, migrations running successfully
- GraphQL Playground accessible

---

### Phase 2: Authentication & User Management (2-3 days)

**Goal:** Complete authentication system with JWT, role-based access control.

**Tasks:**

1. Auth service (`auth.service.ts`)
   - `register(email, password, fullName)` — hash password with bcrypt (12 rounds), create user, return JWT pair
   - `login(email, password)` — verify password, generate access token (15min TTL) + refresh token (7day TTL)
   - `refreshToken(token)` — verify refresh token, rotate (create new + revoke old)
   - `logout(token)` — revoke refresh token
   - `forgotPassword(email)` — generate reset token, store in Redis (1h TTL), send email
   - `resetPassword(token, newPassword)` — verify token from Redis, update password hash

2. GraphQL schema for Auth
   ```graphql
   type Mutation {
     register(input: RegisterInput!): AuthPayload!
     login(input: LoginInput!): AuthPayload!
     refreshToken(token: String!): AuthPayload!
     logout: Boolean!
     forgotPassword(email: String!): Boolean!
     resetPassword(input: ResetPasswordInput!): Boolean!
   }

   type AuthPayload {
     accessToken: String!
     refreshToken: String!
     user: User!
   }

   type User {
     id: ID!
     email: String!
     fullName: String!
     phone: String
     avatarUrl: String
     role: UserRole!
     createdAt: DateTime!
   }
   ```

3. Auth middleware (`auth.guard.ts`)
   - Extract JWT from `Authorization: Bearer <token>` header
   - Verify token signature and expiration, inject user into GraphQL context
   - Support optional auth (public queries may still carry user context)

4. Role guard (`role.guard.ts`)
   - Directive-based or wrapper function: `requireRole('admin', 'organizer')`
   - Check `context.user.role` before resolving protected fields/mutations

5. User service
   - `getProfile()`, `updateProfile()`, `changePassword()`
   - `listUsers()` (admin only, with cursor-based pagination)

6. Seed script: create default admin user

**Deliverables:**
- Register / Login / Logout flow working end-to-end
- JWT access + refresh token rotation
- Role-based access control middleware
- Unit tests for auth service

---

### Phase 3: Tournament Management (3-4 days)

**Goal:** Full CRUD for tournaments, format configuration, lifecycle state machine.

**Tasks:**

1. Migration `002_tournaments.ts`
   - Create enums: `sport_type`, `tournament_format`, `tournament_status`
   - Create `tournaments` table

2. Tournament service
   - `createTournament(input)` — validate input with Zod, auto-generate slug, restrict to organizer/admin roles
   - `updateTournament(id, input)` — only owning organizer or admin can update
   - `deleteTournament(id)` — soft delete or only allow when status = 'draft'
   - `getTournament(idOrSlug)` — query by UUID or slug
   - `listTournaments(filters)` — filter by sport, status, organizer; cursor-based pagination
   - `updateTournamentStatus(id, status)` — enforce state machine transitions:
     - `draft` → `registration`
     - `registration` → `in_progress`
     - `in_progress` → `completed`
     - Any state → `cancelled`
   - `getTournamentsByOrganizer(userId)` — list tournaments owned by organizer

3. GraphQL schema
   ```graphql
   type Tournament {
     id: ID!
     name: String!
     slug: String!
     description: String
     sport: SportType!
     format: TournamentFormat!
     status: TournamentStatus!
     organizer: User!
     maxTeams: Int
     minPlayersPerTeam: Int!
     maxPlayersPerTeam: Int!
     startDate: DateTime!
     endDate: DateTime
     entryFee: Float
     currency: String
     bannerUrl: String
     teams: [Team!]!
     matches: [Match!]!
     standings: [Standing!]!
     createdAt: DateTime!
   }

   type Query {
     tournament(id: ID, slug: String): Tournament
     tournaments(filter: TournamentFilter, pagination: PaginationInput): TournamentConnection!
     myTournaments: [Tournament!]!
   }

   type Mutation {
     createTournament(input: CreateTournamentInput!): Tournament!
     updateTournament(id: ID!, input: UpdateTournamentInput!): Tournament!
     deleteTournament(id: ID!): Boolean!
     updateTournamentStatus(id: ID!, status: TournamentStatus!): Tournament!
   }
   ```

4. Validation rules (Zod schemas)
   - Football: `minPlayersPerTeam` 5–11, `maxPlayersPerTeam` 11–25
   - Volleyball: `minPlayersPerTeam` 6, `maxPlayersPerTeam` 14
   - Badminton: `minPlayersPerTeam` 1–2, `maxPlayersPerTeam` 2–4
   - `registrationEnd` must be before `startDate`
   - `maxTeams` must be compatible with format (elimination needs 2^n or auto-add byes)

5. Integration tests for tournament CRUD

**Deliverables:**
- Full tournament CRUD
- Slug generation for public URLs
- State machine for tournament lifecycle
- Sport-specific validation rules

---

### Phase 4: Team & Player Management (2-3 days)

**Goal:** Team registration, player roster management, group draw.

**Tasks:**

1. Migration `003_teams_and_players.ts`
   - Create `teams` and `team_players` tables

2. Team service
   - `registerTeam(tournamentId, input)` — verify tournament is in registration status, team slots available
   - `updateTeam(id, input)` — restricted to team_manager or organizer
   - `deleteTeam(id)` — only allowed before tournament starts
   - `getTeam(id)` — include player roster
   - `listTeamsByTournament(tournamentId)`
   - `assignGroup(teamId, groupName)` — organizer manually assigns group
   - `drawGroups(tournamentId)` — random group assignment respecting seeds

3. Player service
   - `addPlayer(teamId, input)` — enforce max roster size, validate unique jersey number within team
   - `removePlayer(teamId, playerId)`
   - `updatePlayer(playerId, input)` — update jersey number, position
   - `setCaptain(teamId, playerId)` — enforce single captain per team
   - `linkPlayerAccount(playerId, userId)` — link player entry to a user account for self-check-in
   - `getPlayersByTeam(teamId)`

4. GraphQL schema for Team & Player
   ```graphql
   type Team {
     id: ID!
     name: String!
     logoUrl: String
     manager: User!
     groupName: String
     seed: Int
     players: [TeamPlayer!]!
     tournament: Tournament!
   }

   type TeamPlayer {
     id: ID!
     fullName: String!
     jerseyNumber: Int
     position: String
     isCaptain: Boolean!
     user: User
   }

   type Mutation {
     registerTeam(tournamentId: ID!, input: RegisterTeamInput!): Team!
     addPlayer(teamId: ID!, input: AddPlayerInput!): TeamPlayer!
     removePlayer(teamId: ID!, playerId: ID!): Boolean!
     setCaptain(teamId: ID!, playerId: ID!): Team!
     drawGroups(tournamentId: ID!): [Team!]!
   }
   ```

5. Constraint enforcement:
   - Reject registration if tournament has reached `maxTeams`
   - Reject player addition if team has reached `maxPlayersPerTeam`
   - Jersey number must be unique within a team
   - A user can only belong to one team per tournament

**Deliverables:**
- Team registration + player add/remove
- Automated group draw
- Full constraint validation

---

### Phase 5: Venue & Scheduling (3-4 days)

**Goal:** Venue management, automatic schedule generation including bracket algorithms.

**Tasks:**

1. Migrations `004_matches_and_results.ts` + `005_scheduling_and_venues.ts`
   - Create `venues`, `matches`, `match_sets`, `match_events` tables

2. Venue service
   - CRUD operations for venues
   - `findAvailableVenues(date, sportType)` — find venues without scheduling conflicts
   - `getVenueSchedule(venueId, dateRange)` — return all matches assigned to a venue

3. **Schedule Generator** (`packages/shared/src/utils/`) — CORE LOGIC
   - `generateRoundRobin(teams)`:
     - Input: list of teams
     - Output: array of rounds, each containing an array of match pairings
     - Algorithm: Circle method (add a "bye" placeholder if odd number of teams)
     - Every team plays every other team exactly once
   - `generateSingleElimination(teams)`:
     - Input: list of teams (optionally seeded)
     - Output: bracket tree (quarter → semi → final)
     - Handle byes when team count is not a power of 2
     - Seed-based pairing: seed 1 vs last seed, etc.
   - `generateDoubleElimination(teams)`:
     - Winners bracket + Losers bracket + Grand final
   - `generateGroupStageKnockout(teams, groupCount, advancePerGroup)`:
     - Distribute teams into groups → round-robin within each group → top N advance → single elimination
   - `assignSchedule(matches, venues, startDate, config)`:
     - Automatically assign venue + time slot to each match
     - Config options: `matchDuration` (minutes), `breakBetweenMatches` (minutes), `matchesPerDay`, `startTime`, `endTime`
     - Prevent a team from playing two consecutive matches without rest
     - Prevent venue double-booking at the same time

4. Match service
   - `generateMatches(tournamentId)` — invoke appropriate schedule generator based on tournament format
   - `updateMatchSchedule(matchId, input)` — reschedule venue/time
   - `getMatchesByTournament(tournamentId, filters)` — filter by round, group, status, date range
   - `getMatchesByTeam(teamId)`
   - `getUpcomingMatches(userId)` — upcoming matches for teams the user belongs to

5. GraphQL schema
   ```graphql
   type Match {
     id: ID!
     tournament: Tournament!
     homeTeam: Team
     awayTeam: Team
     round: Int
     roundName: String
     groupName: String
     venue: Venue
     scheduledAt: DateTime
     status: MatchStatus!
     homeScore: Int
     awayScore: Int
     winner: Team
     isDraw: Boolean
     sets: [MatchSet!]!
     events: [MatchEvent!]!
     referee: User
     checkinOpensAt: DateTime
     checkinDeadline: DateTime
   }

   type Mutation {
     generateMatches(tournamentId: ID!): [Match!]!
     updateMatchSchedule(matchId: ID!, input: UpdateScheduleInput!): Match!
   }
   ```

6. Unit tests for all scheduling algorithms

**Deliverables:**
- Round-robin, single/double elimination, group+knockout generation
- Automatic schedule assignment with venue allocation
- Conflict detection and prevention

---

### Phase 6: Match Results & Statistics (3-4 days)

**Goal:** Submit match results, auto-calculate standings, aggregate player statistics.

**Tasks:**

1. Migration `006_standings_and_statistics.ts`
   - Create `standings` and `player_statistics` tables

2. Match result service
   - `submitMatchResult(matchId, input)`:
     - Input varies by sport:
       - **Football**: `{ homeScore, awayScore, events: [{ type: 'goal', playerId, minute }] }`
       - **Volleyball**: `{ sets: [{ homeScore: 25, awayScore: 20 }, ...] }` — auto-determine winner (best of 3 or 5)
       - **Badminton**: `{ sets: [{ homeScore: 21, awayScore: 18 }, ...] }` — best of 3
     - Validation rules: volleyball set must reach 25 (5th set to 15), minimum 2-point lead; badminton to 21, 2-point lead, max 30
     - Auto-set `winner_team_id` and `is_draw`
     - Update match status → `completed`
     - **Trigger standings recalculation**
     - **Trigger bracket advancement** (elimination: auto-fill winner into next bracket match)
   - `addMatchEvent(matchId, input)` — add in-match event (goal, card, substitution, etc.)
   - `updateMatchResult(matchId, input)` — correct results (admin/organizer only)

3. Standings calculator (`packages/shared/src/utils/standings.ts`)
   - `calculateStandings(tournamentId)`:
     - Query all completed matches for the tournament
     - Calculate: played, won, drawn, lost, goals_for, goals_against, goal_difference, points
     - Ranking criteria: points → goal_difference → goals_for → head-to-head record
     - For volleyball/badminton: also compute sets_won, sets_lost
     - Upsert results into `standings` table
   - Called every time a new match result is submitted

4. Player statistics service
   - `recalculatePlayerStats(tournamentId)`:
     - Aggregate from `match_events`: count goals, assists, cards, etc.
     - Upsert into `player_statistics` table
   - `getTopScorers(tournamentId, limit)` — top goal scorers / point scorers
   - `getTopAssists(tournamentId, limit)`
   - `getMVP(tournamentId)` — based on goals + assists + mvp_count
   - `getPlayerProfile(playerId)` — aggregate stats across all tournaments

5. Bracket advancement logic
   - When a match is completed in elimination format:
     - Find next match based on `bracket_position`
     - Fill winner into `home_team_id` or `away_team_id` of the next match
     - If both teams are set → match is ready to be scheduled

6. GraphQL schema
   ```graphql
   type Standing {
     team: Team!
     played: Int!
     won: Int!
     drawn: Int!
     lost: Int!
     goalsFor: Int!
     goalsAgainst: Int!
     goalDifference: Int!
     points: Int!
     rank: Int
   }

   type PlayerStatistic {
     player: TeamPlayer!
     team: Team!
     goals: Int!
     assists: Int!
     yellowCards: Int!
     redCards: Int!
     matchesPlayed: Int!
   }

   type Mutation {
     submitMatchResult(matchId: ID!, input: MatchResultInput!): Match!
     addMatchEvent(matchId: ID!, input: MatchEventInput!): MatchEvent!
   }

   type Query {
     standings(tournamentId: ID!, groupName: String): [Standing!]!
     topScorers(tournamentId: ID!, limit: Int): [PlayerStatistic!]!
   }
   ```

**Deliverables:**
- Sport-specific result submission with validation
- Automatic standings calculation
- Bracket advancement for elimination tournaments
- Player statistics aggregation

---

### Phase 7: Check-in System (2-3 days)

**Goal:** Pre-match check-in, QR code scanning, lineup management.

**Tasks:**

1. Migration `007_checkin.ts`
   - Create `match_checkins` and `checkin_qr_codes` tables

2. Check-in service
   - `openCheckin(matchId)`:
     - Create checkin records for all players on both teams (status = 'pending')
     - Generate a unique QR code for the match
     - Set `checkin_opens_at` on the match record
     - Can be triggered automatically by cron job (60 minutes before match time)
   - `playerCheckin(matchId, playerId, method)`:
     - Validate: check-in window is open, player belongs to a team in this match
     - Update status → 'checked_in', record timestamp
     - Method: 'qr_code' | 'manual' | 'app'
   - `qrCheckin(qrCode, playerId)`:
     - Validate QR code exists and is not expired
     - Call `playerCheckin` with method = 'qr_code'
   - `closeCheckin(matchId)`:
     - Mark all players still pending → 'absent'
     - Check minimum roster rules: if fewer than `min_players_per_team` checked in → issue warning or forfeit
   - `setLineup(matchId, teamId, input)`:
     - Only allow players with 'checked_in' status
     - Set `is_starting` = true/false
     - Validate starting lineup count matches sport requirements
   - `getCheckinStatus(matchId)` — realtime check-in list
   - `getPlayerAttendanceHistory(playerId)` — historical attendance record

3. QR Code generation
   - Use `qrcode` npm package
   - Generate unique string: `sporthub:checkin:{matchId}:{randomToken}`
   - Return base64 image or downloadable URL

4. Cron job: `checkin-window.ts`
   - Runs every minute, checks for matches starting soon
   - Auto-open check-in 60 minutes before scheduled time (configurable)
   - Auto-close check-in 10 minutes before match time

5. GraphQL schema
   ```graphql
   type MatchCheckin {
     player: TeamPlayer!
     team: Team!
     status: CheckinStatus!
     checkedInAt: DateTime
     method: String
     isStarting: Boolean
   }

   type Query {
     matchCheckinStatus(matchId: ID!): [MatchCheckin!]!
     playerAttendance(playerId: ID!, tournamentId: ID): [MatchCheckin!]!
   }

   type Mutation {
     openCheckin(matchId: ID!): Boolean!
     playerCheckin(matchId: ID!, playerId: ID!, method: String): MatchCheckin!
     qrCheckin(code: String!, playerId: ID!): MatchCheckin!
     closeCheckin(matchId: ID!): [MatchCheckin!]!
     setLineup(matchId: ID!, teamId: ID!, input: LineupInput!): [MatchCheckin!]!
   }
   ```

**Deliverables:**
- Complete check-in flow
- QR code generation and scanning
- Auto open/close check-in window via cron
- Lineup management with validation

---

### Phase 8: Payment Integration (3-4 days)

**Goal:** Integrate Vietnam payment gateways, manage fees, promo codes.

**Tasks:**

1. Migration `008_payments.ts`
   - Create `payment_plans`, `payments`, `promo_codes` tables

2. Payment plan service
   - `createPaymentPlan(tournamentId, input)` — organizer defines fee structure
   - `updatePaymentPlan(id, input)`
   - `getPaymentPlansByTournament(tournamentId)`

3. Payment service
   - `initiatePayment(paymentPlanId, teamId, method, promoCode?)`:
     - Validate promo code if provided → calculate discount
     - Create payment record (status = 'pending')
     - Call appropriate payment gateway:
       - **VietQR**: Generate bank transfer QR code with standardized content
       - **MoMo**: Call MoMo API to create payment URL → redirect user
       - **VNPay**: Call VNPay API to create payment URL
     - Return payment URL or QR image
     - Set `expires_at` (e.g., 24 hours)
   - `handlePaymentCallback(gateway, data)`:
     - REST endpoint receiving webhooks/callbacks from MoMo, VNPay
     - Verify signature (HMAC SHA256)
     - Update payment status → 'paid'
     - Set `paid_at` timestamp
     - Auto-confirm team registration if required
     - Send notification + email receipt
   - `checkPaymentStatus(paymentId)` — query gateway for current status
   - `refundPayment(paymentId, reason)`:
     - Call gateway refund API
     - Update status → 'refunded'
   - `getPaymentsByTournament(tournamentId)` — organizer financial dashboard
   - `getPaymentsByTeam(teamId)`

4. Payment gateway implementations (`lib/payment/`)
   - `momo.ts`:
     - `createPayment(amount, orderId, orderInfo, redirectUrl)` — MoMo All-In-One API
     - `verifyCallback(data, signature)` — HMAC SHA256 verification
     - `refund(transactionId, amount)`
   - `vnpay.ts`:
     - `createPaymentUrl(amount, orderId, orderInfo)` — VNPay URL generation
     - `verifyReturnUrl(query)` — checksum verification
   - `vietqr.ts`:
     - `generateQR(bankId, accountNo, amount, content)` — VietQR API
     - Note: bank transfers require manual confirmation or bank API integration

5. Promo code service
   - `createPromoCode(tournamentId, input)` — organizer creates discount codes
   - `validatePromoCode(code, tournamentId)` — check validity, expiration, usage limits
   - `applyPromoCode(paymentId, code)` — calculate discount, increment `used_count`

6. Cron job: `payment-expiry.ts`
   - Runs hourly, checks for overdue payments → update status = 'overdue'
   - Send reminder notifications before payment deadline

7. Financial dashboard queries
   - `getFinancialSummary(tournamentId)` — total revenue, collected, pending, refunded
   - `getPaymentReport(tournamentId)` — per-team payment details

8. REST endpoints for payment callbacks (Express routes alongside GraphQL)
   ```
   POST /api/payment/momo/callback
   POST /api/payment/vnpay/callback
   GET  /api/payment/vnpay/return
   ```

**Deliverables:**
- MoMo + VNPay + VietQR integration
- Promo code system with validation
- Auto-confirm registration on successful payment
- Financial dashboard for organizers
- Webhook handlers for payment callbacks

---

### Phase 9: Notification System (2-3 days)

**Goal:** In-app notifications, email delivery, GraphQL subscriptions for realtime updates.

**Tasks:**

1. Migration `009_notifications.ts`
   - Create `notifications` table

2. Notification service
   - `createNotification(userId, type, title, body, data?)`:
     - Insert into database
     - Publish via Redis PubSub for GraphQL subscription
     - Queue email if user has email notifications enabled
   - `createBulkNotification(userIds, ...)` — notify multiple users (e.g., entire team)
   - `markAsRead(notificationId)`
   - `markAllAsRead(userId)`
   - `getNotifications(userId, filters)` — pagination, filter by type, read/unread
   - `getUnreadCount(userId)` — cached in Redis for performance

3. Email service (`lib/email.ts`)
   - Use Resend or Nodemailer + SMTP
   - HTML templates for:
     - Match reminder
     - Match result
     - Payment confirmation
     - Payment reminder
     - Registration confirmation
     - Password reset
   - Queue emails via BullMQ to avoid blocking

4. GraphQL Subscriptions (realtime)
   ```graphql
   type Subscription {
     notificationReceived: Notification!
     matchScoreUpdated(matchId: ID!): Match!
     checkinUpdated(matchId: ID!): MatchCheckin!
   }
   ```
   - Set up Redis PubSub adapter for Apollo subscriptions
   - WebSocket transport via `graphql-ws`

5. Automatic notification triggers:
   - Match scheduled → remind 24h before + 1h before
   - Match result submitted → notify both teams
   - Schedule changed → notify affected teams
   - Payment received → confirmation notification
   - Payment overdue → reminder notification
   - Team registered → welcome notification
   - Check-in opened → notify all players

6. Notification preferences
   - Allow users to toggle: in-app / email per notification type
   - Store preferences in `users` table (JSONB column) or dedicated table

**Deliverables:**
- In-app notification system
- Email notifications with HTML templates
- Realtime subscriptions via WebSocket
- Auto-triggered notifications for all key events

---

### Phase 10: Public Page & Social Features (3-4 days)

**Goal:** Public-facing tournament pages for spectators, live scores, comments and reactions.

**Tasks:**

1. Migration `010_public_page.ts`
   - Create `tournament_posts`, `match_comments`, `match_reactions` tables

2. Public resolver (no authentication required)
   ```graphql
   type Query {
     # Public queries - no auth required
     publicTournament(slug: String!): PublicTournament
     publicMatch(id: ID!): PublicMatch
     publicStandings(tournamentSlug: String!): [Standing!]!
     publicBracket(tournamentSlug: String!): BracketData!
     publicSchedule(tournamentSlug: String!, filters: ScheduleFilter): [Match!]!
     publicTeam(id: ID!): PublicTeam
     publicPlayer(id: ID!): PublicPlayer
     tournamentPosts(tournamentSlug: String!, pagination: PaginationInput): PostConnection!
     matchComments(matchId: ID!, pagination: PaginationInput): CommentConnection!
   }
   ```

3. Live score (realtime)
   - `Subscription.matchScoreUpdated(matchId)`:
     - When referee/organizer submits a score update → publish via Redis PubSub
     - Clients subscribe → receive updates in realtime without refreshing
   - `Subscription.matchStatusChanged(tournamentId)`:
     - Push status changes when matches start or finish

4. Tournament posts (news feed)
   - `createPost(tournamentId, input)` — organizer publishes announcements
   - `updatePost`, `deletePost`, `pinPost`
   - Support `media_urls` for images/videos

5. Match comments
   - `addComment(matchId, content, parentId?)` — supports threaded replies
   - `deleteComment(commentId)` — restricted to comment owner or organizer
   - Rate limiting: max 1 comment per 10 seconds per user
   - Optional: allow guest comments (no login required, provide display name)

6. Match reactions
   - `addReaction(matchId, reaction)` — toggle reaction on/off
   - `getReactionCounts(matchId)` — aggregate counts by reaction type

7. Social sharing
   - Generate Open Graph meta tags for tournament/match pages:
     ```
     og:title, og:description, og:image (auto-generated score card)
     ```
   - Score card image generation:
     - Use `sharp` or `canvas` to generate shareable images
     - Template: team A logo + score + team B logo + tournament name
     - Return URL for social sharing

8. Embed widget
   - REST endpoint: `GET /api/embed/standings/:tournamentSlug` — return embeddable HTML/JS snippet
   - REST endpoint: `GET /api/embed/schedule/:tournamentSlug` — return embeddable HTML/JS snippet
   - Easy to embed in external websites via `<iframe>` or `<script>` tag

**Deliverables:**
- Public pages accessible without authentication
- Live score updates via WebSocket
- Comment and reaction system
- Social sharing with auto-generated OG images
- Embeddable widgets for external sites

---

### Phase 11: Dashboard & Reports (2-3 days)

**Goal:** Admin/organizer dashboards, data export, player personal dashboard.

**Tasks:**

1. Organizer Dashboard
   ```graphql
   type OrganizerDashboard {
     activeTournaments: Int!
     totalTeams: Int!
     totalPlayers: Int!
     upcomingMatches: [Match!]!
     recentResults: [Match!]!
     financialSummary: FinancialSummary!
     registrationStats: RegistrationStats!
   }

   type FinancialSummary {
     totalRevenue: Float!
     totalPaid: Float!
     totalPending: Float!
     totalRefunded: Float!
     paymentsByMethod: [PaymentMethodStat!]!
   }

   type RegistrationStats {
     totalTeams: Int!
     confirmedTeams: Int!       # Paid teams
     pendingTeams: Int!         # Unpaid teams
     teamsByDay: [DayStat!]!   # Registration trend chart data
   }
   ```

2. Admin Dashboard
   - System-wide statistics: total users, tournaments, matches
   - Recent activity feed
   - System health monitoring (optional)

3. Report generation
   - `exportTournamentReport(tournamentId, format)`:
     - Format: JSON (structured data for frontend rendering or download)
     - Content: standings, top scorers, match results, team stats
   - `exportFinancialReport(tournamentId)`:
     - Per-team payment details
     - Summary by payment method

4. Player Dashboard
   - Active tournaments the player is participating in
   - Upcoming matches
   - Personal statistics across tournaments
   - Check-in attendance history

**Deliverables:**
- Organizer dashboard with financial summary
- Admin system overview
- Exportable reports (JSON format)
- Player personal dashboard

---

### Phase 12: Testing, Optimization & Deployment (3-5 days)

**Goal:** Comprehensive testing, performance tuning, production-ready deployment.

**Tasks:**

1. Testing
   - Unit tests (Vitest):
     - All utility functions (bracket generation, round-robin, standings calculation)
     - Service layer business logic
     - Zod validation schemas
   - Integration tests (Supertest + test database):
     - Auth flow end-to-end
     - Full tournament lifecycle: create → register teams → generate matches → submit results → standings
     - Payment flow
     - Check-in flow
   - Test coverage target: > 80%

2. Performance optimization
   - Database:
     - Review all indexes, add composite indexes where needed
     - Analyze slow queries with `EXPLAIN ANALYZE`
     - Configure connection pooling (Kysely pool settings)
   - Caching (Redis):
     - Cache standings (invalidate on match result submission)
     - Cache public tournament data (5-minute TTL)
     - Cache user sessions
     - Cache notification unread counts
   - GraphQL:
     - Implement DataLoader for N+1 query prevention (teams → players, matches → teams)
     - Query depth limiting
     - Query complexity analysis
     - Persisted queries (optional)

3. Security
   - Rate limiting on all mutations
   - Input sanitization (XSS prevention)
   - SQL injection prevention (handled by Kysely's parameterized queries)
   - CORS configuration
   - Helmet security headers
   - Request body size limits

4. Logging & Monitoring
   - Structured logging with pino
   - Request/response logging
   - Error tracking (Sentry or similar)
   - Health check endpoint (`GET /health`)

5. Deployment
   - Dockerfile for API service
   - Docker Compose production config (with nginx reverse proxy)
   - Environment configuration management
   - Database migration strategy for CI/CD
   - Process management with PM2 or systemd
   - SSL/TLS setup

6. Documentation
   - API documentation (auto-generated from GraphQL schema)
   - README.md with setup and development instructions
   - Environment variables reference
   - Deployment guide

**Deliverables:**
- Comprehensive test suite
- Production-ready Docker setup
- Performance-tuned database and caching
- Security hardened
- Complete documentation

---

## Conventions & Standards

### Coding Standards

- **TypeScript strict mode** — no `any`, enable `strictNullChecks`
- **Naming**: camelCase for variables/functions, PascalCase for types/classes, UPPER_SNAKE_CASE for constants
- **Database columns**: snake_case
- **GraphQL fields**: camelCase
- **Error handling**: custom error classes extending `GraphQLError` with proper error codes
- **Validation**: all inputs validated with Zod before processing
- **Pagination**: cursor-based (Relay-style connection) for all list queries
- **Date/Time**: always use TIMESTAMPTZ, store in UTC, convert on client
- **ID format**: UUID v4 everywhere

### Module File Pattern

Each feature module follows a consistent structure:

```
moduleName/
├── moduleName.typeDefs.ts    # GraphQL schema definitions (SDL string)
├── moduleName.resolvers.ts   # Resolver implementations
└── moduleName.service.ts     # Business logic (injectable, testable)
```

Each service receives `db: Kysely<Database>` and `redis: Redis` via dependency injection from the GraphQL context. Never import global instances directly.

### Git Workflow

- Branch naming: `feature/phase-{N}-{feature-name}`
- Commit messages: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`
- Each phase = 1 pull request

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://sporthub:sporthub_dev@localhost:5432/sporthub

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email
EMAIL_FROM=noreply@sporthub.vn
RESEND_API_KEY=re_xxxx

# Payment Gateways
MOMO_PARTNER_CODE=xxx
MOMO_ACCESS_KEY=xxx
MOMO_SECRET_KEY=xxx
VNPAY_TMN_CODE=xxx
VNPAY_HASH_SECRET=xxx

# App
PORT=4000
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000
APP_URL=https://sporthub.vn
```

---

## Dependency List

### packages/db
```json
{
  "dependencies": {
    "kysely": "^0.27.x",
    "pg": "^8.x",
    "kysely-codegen": "^0.15.x"
  }
}
```

### packages/shared
```json
{
  "dependencies": {
    "zod": "^3.x",
    "nanoid": "^5.x"
  }
}
```

### apps/api
```json
{
  "dependencies": {
    "@apollo/server": "^4.x",
    "graphql": "^16.x",
    "graphql-ws": "^5.x",
    "graphql-scalars": "^1.x",
    "express": "^4.x",
    "cors": "^2.x",
    "helmet": "^7.x",
    "dotenv": "^16.x",
    "ioredis": "^5.x",
    "bcryptjs": "^2.x",
    "jsonwebtoken": "^9.x",
    "zod": "^3.x",
    "qrcode": "^1.x",
    "pino": "^8.x",
    "pino-pretty": "^10.x",
    "dataloader": "^2.x",
    "node-cron": "^3.x",
    "bullmq": "^5.x",
    "resend": "^3.x",
    "sharp": "^0.33.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vitest": "^1.x",
    "supertest": "^6.x",
    "@types/express": "^4.x",
    "@types/bcryptjs": "^2.x",
    "@types/jsonwebtoken": "^9.x",
    "tsx": "^4.x"
  }
}
```
