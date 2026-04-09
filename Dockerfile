# ─── Stage 1: Dependencies ───────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Enable Yarn 4 via corepack
RUN corepack enable && corepack prepare yarn@4.6.0 --activate

# Copy workspace config and package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json

RUN yarn install

# ─── Stage 2: Build ──────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare yarn@4.6.0 --activate

COPY --from=deps /app /app
COPY . .

RUN yarn workspace @sporthub/db build && \
    yarn workspace @sporthub/shared build && \
    yarn workspace @sporthub/api build

# ─── Stage 3: Production ─────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

RUN corepack enable && corepack prepare yarn@4.6.0 --activate

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy workspace structure
COPY --from=deps /app/package.json /app/yarn.lock /app/.yarnrc.yml ./
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/packages/db/package.json packages/db/package.json
COPY --from=deps /app/packages/shared/package.json packages/shared/package.json
COPY --from=deps /app/apps/api/package.json apps/api/package.json

# Copy built output
COPY --from=build /app/packages/db/dist packages/db/dist
COPY --from=build /app/packages/db/src packages/db/src
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/packages/shared/src packages/shared/src
COPY --from=build /app/apps/api/dist apps/api/dist

# Copy migration files for runtime migrations
COPY --from=build /app/packages/db/src/migrations packages/db/src/migrations

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

USER appuser

CMD ["node", "apps/api/dist/index.js"]
