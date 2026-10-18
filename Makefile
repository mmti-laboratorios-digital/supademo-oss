# =============================================================================
# DemoBR Makefile — interface alternativa ao `pnpm`
# =============================================================================
# Uso:
#   make install     # pnpm install
#   make dev         # sobe Next.js em :3000
#   make build       # build de produção
#   make test        # vitest em todos os pacotes
#   make lint        # biome
#   make typecheck   # tsc --noEmit
#   make db-up       # docker compose up -d postgres pgweb
#   make db-down     # docker compose down
#   make db-migrate  # pnpm --filter web db:migrate (drizzle-kit)
#   make db-seed     # pnpm --filter web db:seed
#   make db-studio   # drizzle-kit studio
#   make db-backup   # snapshot sob demanda
#   make db-restore  # restore drill (provisiona VPS temp)
#   make deploy-prod # pre-deploy gate + ssh deploy
#   make logs-app    # docker compose logs -f web
#   make logs-worker # docker compose logs -f worker
#   make logs-postgres # docker compose logs -f postgres
#   make shell-app   # shell no container web
#   make shell-postgres # psql no container postgres
# =============================================================================

SHELL := /usr/bin/env bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help

ROOT_DIR := $(shell pwd)
COMPOSE  := docker compose -f infra/docker-compose.yml

# -----------------------------------------------------------------------------
# Meta
# -----------------------------------------------------------------------------
.PHONY: help
help: ## Mostra esta ajuda
	@awk 'BEGIN {FS = ":.*##"; printf "\nDemoBR — comandos disponíveis:\n\n"} \
	  /^[a-zA-Z_-]+:.*##/ { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@printf "\n"

# -----------------------------------------------------------------------------
# Setup / dev
# -----------------------------------------------------------------------------
.PHONY: install
install: ## Instala dependências (pnpm install)
	pnpm install

.PHONY: dev
dev: ## Sobe Next.js dev em :3000
	pnpm --filter web dev

.PHONY: build
build: ## Build de produção (Next + workers)
	pnpm -r --filter=./apps/* --filter=./packages/* build

.PHONY: test
test: ## Roda vitest em todos os pacotes
	pnpm test

.PHONY: lint
lint: ## Biome check
	pnpm lint

.PHONY: lint-fix
lint-fix: ## Biome check --write
	pnpm lint:fix

.PHONY: typecheck
typecheck: ## tsc --noEmit em todos os pacotes
	pnpm typecheck

.PHONY: worker
worker: ## Sobe graphile-worker
	pnpm worker

.PHONY: extension-dev
extension-dev: ## Dev da Chrome extension
	pnpm extension:dev

.PHONY: extension-build
extension-build: ## Build da Chrome extension
	pnpm extension:build

# -----------------------------------------------------------------------------
# Banco de dados
# -----------------------------------------------------------------------------
.PHONY: db-up
db-up: ## Sobe Postgres + pgweb via docker compose
	$(COMPOSE) up -d postgres pgweb

.PHONY: db-down
db-down: ## Para containers do banco
	$(COMPOSE) down

.PHONY: db-migrate
db-migrate: ## Aplica migrations (drizzle-kit migrate, lê 0000_init.sql + meta/_journal.json)
	pnpm --filter web db:migrate

.PHONY: db-seed
db-seed: ## Popula dados de exemplo
	pnpm --filter web db:seed

.PHONY: db-studio
db-studio: ## Abre Drizzle Studio
	cd apps/web && pnpm exec drizzle-kit studio

.PHONY: db-backup
db-backup: ## Snapshot sob demanda (pg_dump → .sql.gz)
	bash scripts/db-snapshot.sh

.PHONY: db-restore
db-restore: ## DR drill (provisiona VPS temp)
	bash scripts/restore-drill.sh

.PHONY: db-test-rls
db-test-rls: ## Verifica RLS multi-tenant
	bash apps/web/scripts/test-rls.sh

.PHONY: db-shell
db-shell: ## Abre psql no Postgres
	$(COMPOSE) exec postgres psql -U app_user -d supademo

# -----------------------------------------------------------------------------
# Health / smoke
# -----------------------------------------------------------------------------
.PHONY: health
health: ## GET /api/health com exit code
	bash scripts/health-check.sh

.PHONY: smoke
smoke: ## Smoke test de URLs públicas
	bash apps/web/scripts/smoke-test.sh

# -----------------------------------------------------------------------------
# Deploy
# -----------------------------------------------------------------------------
.PHONY: deploy-prod
deploy-prod: ## Gate pré-deploy + push
	bash scripts/pre-deploy.sh
	@echo "→ OK para deployar; SSH e docker compose up no Hetzner (veja .github/workflows/deploy.yml)"

# -----------------------------------------------------------------------------
# Logs
# -----------------------------------------------------------------------------
.PHONY: logs-app
logs-app: ## tail -f logs do container web
	$(COMPOSE) logs -f --tail=100 web

.PHONY: logs-worker
logs-worker: ## tail -f logs do worker
	$(COMPOSE) logs -f --tail=100 worker

.PHONY: logs-postgres
logs-postgres: ## tail -f logs do Postgres
	$(COMPOSE) logs -f --tail=100 postgres

# -----------------------------------------------------------------------------
# Shells
# -----------------------------------------------------------------------------
.PHONY: shell-app
shell-app: ## Shell interativo no container web
	$(COMPOSE) exec web sh

.PHONY: shell-postgres
shell-postgres: ## psql no Postgres (wrapper)
	@make db-shell

.PHONY: shell-worker
shell-worker: ## Shell no container worker
	$(COMPOSE) exec worker sh

# -----------------------------------------------------------------------------
# Limpeza
# -----------------------------------------------------------------------------
.PHONY: clean
clean: ## Limpa caches e builds locais
	rm -rf apps/web/.next apps/workers/dist packages/*/dist .turbo .biome-cache coverage

.PHONY: teardown
teardown: ## Derruba tudo (containers + volumes após confirmação)
	bash scripts/teardown.sh