# ---- Base ----
FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --prod=false

# ---- Build ----
FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/worker/ ./apps/worker/
RUN pnpm --filter @tiwa/shared build
RUN pnpm --filter worker build

# ---- Production deps ----
FROM base AS prod-deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --prod

# ---- Runtime ----
FROM node:24-alpine AS runtime
WORKDIR /app
RUN addgroup -S tiwa && adduser -S tiwa -G tiwa

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=prod-deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=build /app/apps/worker/dist ./apps/worker/dist
COPY --from=build /app/packages/shared/dist ./packages/shared/dist

USER tiwa
CMD ["node", "apps/worker/dist/main.js"]
