# Contributing to EasyDemo

Obrigado por contribuir com **EasyDemo** — clone brasileiro do Supademo, focado no mercado PT-BR com PIX/boleto, LGPD de ponta a ponta e player em pt-BR.

## 🚦 Status atual

- **MVP está em construção.** Issues em aberto listam os bugs conhecidos.
- **LGPD compliance** é o pilar: nenhum commit pode introduzir regressão de privacidade.
- **Tudo em PT-BR** é o padrão; i18n EN é secundário.

## 🧑‍💻 Como rodar localmente

```bash
# Dependências
pnpm install --frozen-lockfile

# Subir Postgres + Redis local (opcional, para tests integration)
docker compose -f infra/docker-compose.yml up -d postgres

# Aplicar schema
pnpm db:migrate

# Seed
pnpm db:seed

# Dev server
pnpm dev
```

Acesse `http://localhost:3000`.

## 🧪 Tests

```bash
pnpm test                     # vitest (148 tests)
pnpm exec playwright test     # E2E (7 tests + 1 conditional)
pnpm lint && pnpm typecheck   # lint + tsc strict
```

Todos devem passar antes de merge.

## 📦 Estrutura do monorepo

- **`apps/web`** — Next.js 15 App Router + TypeScript strict
- **`apps/extension`** — Chrome MV3 via WXT
- **`apps/workers`** — graphile-worker (Postgres-only queue)
- **`packages/shared`** — tipos, schemas Zod, i18n
- **`packages/player`** — `@easydemo/player` (React publicável)
- **`packages/ui`** — primitives shadcn-style
- **`infra/`** — docker-compose, postgres config, observability
- **`scripts/`** — 14 scripts operacionais
- **`docs/`** — RFC + 12 ADRs + 12 LGPD docs

## 🔐 Áreas sensíveis (pedem cuidado extra)

- **Billing (`apps/web/lib/billing/**`)** — dinheiro real. Qualquer mudança precisa de teste manual em Asaas sandbox.
- **LGPD (`apps/web/lib/lgpd/`, `legal/`)** — DSR, consent, encryption. Mudanças aqui são bloqueantes para release.
- **RLS (`apps/web/db/schema/`, `infra/postgres/init-roles.sql`)** — multi-tenant. Sempre rodar `pnpm test:rls` antes de merge.
- **Webhook Asaas (`apps/web/app/api/webhooks/asaas/`)** — HMAC validation é obrigatória. Não desabilitar.

## 🐛 Reportar bugs

Abra uma **issue** com:

1. Contexto (o que você tentou fazer)
2. Comportamento esperado
3. Comportamento atual
4. Passos para reproduzir
5. Screenshot/log/erro completo
6. Versão (commit SHA ou tag)

## ✨ Pull requests

1. Crie uma branch a partir de `main`:
   ```bash
   git checkout -b feat/nome-da-feature
   ```
2. Faça commits pequenos com mensagens descritivas (`<emoji> <escopo>: <descrição>`).
3. Antes de abrir PR:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm exec playwright test` (se mudou UI)
4. Abra o PR contra `main`. Use o template em `.github/PULL_REQUEST_TEMPLATE.md`.
5. Aguarde review.

## 🌐 i18n

- Novo texto em PT-BR? Edite `packages/shared/src/i18n/messages.pt-BR.json`.
- Toda chave DEVE existir em ambos os idiomas (CI bloqueia com `diffCatalogs()`).
- Use placeholders `{var}` para variáveis, nunca concatene.

## 📜 Licença

Este projeto é **proprietário e de uso interno** — todos os direitos reservados
(veja `LICENSE`). Contribuições são feitas sob contrato de cessão para a
EasyDemo e não concedem licença MIT nem qualquer direito de uso a terceiros.
