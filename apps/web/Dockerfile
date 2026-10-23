# =============================================================================
# DemoBR — Web (Next.js 15) Dockerfile
# Multi-stage: deps → build → runner
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1 — deps
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo
# O repo tem tsconfig.base.json na raiz — NÃO existe tsconfig.json. Copiar o
# nome errado aborta o build com `"/tsconfig.json": not found`.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/workers/package.json ./apps/workers/package.json
COPY apps/extension/package.json ./apps/extension/package.json
COPY packages ./packages
RUN pnpm install --frozen-lockfile --filter web... --filter ./packages/*

# -----------------------------------------------------------------------------
# Stage 2 — build (Next.js standalone)
# -----------------------------------------------------------------------------
FROM deps AS build
WORKDIR /repo
COPY apps/web ./apps/web
COPY apps/workers ./apps/workers
COPY packages ./packages
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter web build

# -----------------------------------------------------------------------------
# Stage 3 — runner (Next standalone)
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runner
LABEL org.opencontainers.image.title="demobr-web" \
      org.opencontainers.image.source="https://github.com/demobr/demobr" \
      org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache tini curl

ENV NODE_ENV=production \
    NODE_OPTIONS="--enable-source-maps" \
    PORT=3000

RUN addgroup -S demobr && adduser -S demobr -G demobr
WORKDIR /app

# Standalone output do Next.js inclui node_modules mínimos.
#
# `output: "standalone"` (next.config.ts) NÃO copia `public/` nem `.next/static`
# para dentro do standalone — daí os dois COPY explícitos. Se apps/web/public
# não existir, o primeiro COPY aborta o build; por isso public/ é versionado
# com pelo menos um asset.
COPY --from=build --chown=demobr:demobr /repo/apps/web/public /app/public
COPY --from=build --chown=demobr:demobr /repo/apps/web/.next/standalone /app
COPY --from=build --chown=demobr:demobr /repo/apps/web/.next/static /app/.next/static

USER demobr
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]