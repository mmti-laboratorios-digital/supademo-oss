FROM node:22-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/workers/package.json ./apps/workers/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --filter "./apps/workers" --filter "./packages/shared"

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter workers build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 worker
COPY --from=build /app/apps/workers/dist ./dist
COPY --from=build /app/apps/workers/package.json ./
COPY --from=build /app/packages ./packages
USER worker
CMD ["node", "dist/index.js"]