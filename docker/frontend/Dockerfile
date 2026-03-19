# ---- Base ----
FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --prod=false

# ---- Build ----
FROM deps AS build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/frontend/ ./apps/frontend/
RUN pnpm --filter @tiwa/shared build
RUN pnpm --filter frontend build

# ---- Runtime ----
FROM node:24-alpine AS runtime
WORKDIR /app
RUN addgroup -S tiwa && adduser -S tiwa -G tiwa
ENV NODE_ENV=production

COPY --from=build /app/apps/frontend/.next/standalone ./
COPY --from=build /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=build /app/apps/frontend/public ./apps/frontend/public

USER tiwa
EXPOSE 3000
CMD ["node", "apps/frontend/server.js"]
