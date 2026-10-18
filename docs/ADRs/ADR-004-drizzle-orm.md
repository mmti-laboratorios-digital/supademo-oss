# ADR-004: Drizzle ORM

- **Status:** Accepted
- **Date:** 2026-10-18
- **Deciders:** Tech lead DemoBR, Founding engineer

## Context and Problem Statement

DemoBR precisa de um ORM TypeScript-first para Postgres 17 que:

- Gere tipos automaticamente a partir do schema do banco.
- Produza SQL auditável e próximo do gerado manualmente (para SRE revisar).
- Seja leve em runtime (bundle pequeno no edge/extension, conexão enxuta no VPS).
- Funcione com RLS nativo do Postgres sem hacks.
- Permita migrations versionadas em SQL puro (para revisão Git em PR).

O time conhece `kysely` (query builder) e tem aversão saudável a ORMs "mágicos". Precisamos decidir.

## Decision Drivers

- **Bundle pequeno** (importa em Next.js, worker, extensão se necessário).
- **Migrations legíveis** (SQL puro).
- **Tipos fortes** em select/insert/update (sem `any`).
- **Compatibilidade com RLS** (Drizzle respeita sessão/role do Postgres; não tenta ser anti-RLS).
- **DX**: auto-complete no editor, validação Zod derivável do schema (`drizzle-zod`).

## Considered Options

1. **Drizzle ORM** + `drizzle-zod`.
2. **Prisma** + `prisma-client-js`.
3. **Kysely** (query builder puro, sem ORM).
4. **TypeORM** (decorator-based).

## Decision Outcome

**Chosen option: "Drizzle ORM + drizzle-zod"**, porque entrega o melhor equilíbrio entre tipos fortes, bundle mínimo (≈7 KB), SQL transparente e migrations legíveis.

Configuração:

```ts
// packages/db/src/schema/workspaces.ts
import { pgTable, uuid, varchar, timestamp, jsonb, pgSchema } from "drizzle-orm/pg-core";

export const appSchema = pgSchema("app");

export const workspaces = appSchema.table("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  planId: varchar("plan_id", { length: 20 }).notNull().default("free"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- `drizzle-kit generate` produz SQL em `packages/db/migrations/`, revisável em PR.
- `drizzle-zod` deriva Zod schemas do Drizzle schema → reuso em API validation e forms.
- Cliente Drizzle instanciado por request com `SET LOCAL app.current_workspace_id = $1` (variável de sessão) para RLS funcionar.

### Positive Consequences

- Bundle cliente ≈ 7 KB (vs Prisma ~500 KB com engine).
- Tipos inferidos automaticamente — `workspaces.$inferSelect` e `workspaces.$inferInsert`.
- SQL gerado é legível: `SELECT "id", "slug", "name" FROM app.workspaces WHERE ...`.
- Migrations em SQL puro — DBA/SRE consegue revisar `git diff packages/db/migrations/`.
- `drizzle-zod` elimina duplicação schema→validation.
- Funciona com RLS, `LISTEN/NOTIFY`, prepared statements sem quirks.

### Negative Consequences

- Ecossistema de plugins menor que Prisma (sem "Admin UI" oficial, sem Soft Delete plugin oficial).
- Curva de aprendizado para quem só usou Prisma (não tem `include`/`select` na relação — joins explícitos).
- Migrations avançadas (renomear coluna preservando dados) exigem SQL manual + edição da migration gerada.

### Follow-ups

- Adotar `drizzle-relations` quando estabilizar v1 (hoje em beta); reduz boilerplate de joins manuais.
- Escrever helper `withWorkspace(workspaceId, fn)` para garantir que toda query tenha `SET LOCAL` antes do `SELECT`.

## Pros and Cons of the Options

### Drizzle ORM (escolhido)

- Good, bundle mínimo.
- Good, SQL transparente.
- Good, tipos fortes.
- Good, drizzle-zod elimina duplicação.
- Neutral, comunidade jovem (mas ativa).
- Bad, sem UI admin pronta.

### Prisma

- Good, UX maravilhosa (Prisma Studio, declarative `.prisma`).
- Good, migrations automáticas.
- Good, comunidade enorme.
- Bad, bundle cliente gigante (~500 KB) — proibitivo no edge/extension.
- Bad, query engine roda em processo separado (Rust binary) — overhead de memória.
- Bad, RLS requer bypass manual (`SET LOCAL` antes do query) — funciona, mas requer cuidado.
- Bad, migrations geradas são opinionated (não SQL puro).
- Bad, lock-in com o schema `.prisma` separado do DDL real.

### Kysely

- Good, query builder puro, zero magic.
- Good, bundle ~3 KB.
- Good, types fortes via `Generated<T>`.
- Bad, sem migrations oficiais (precisa `kysely-codegen` + `kysely-migrations` ou escrever SQL).
- Bad, sem `drizzle-zod` equivalente — duplicaríamos schemas.
- Bad, sem relations declarativas (joins sempre manuais).

### TypeORM

- Good, maduro, decorators familiares para devs Java/Spring.
- Bad, performance inferior (reflection metadata).
- Bad, types fracos (`any` espalhado em queries complexas).
- Bad, comunidade migrou para Prisma/Drizzle desde 2022.
- Bad, suporte RLS exige hack no DataSource.

## References

- [Drizzle ORM docs](https://orm.drizzle.team/docs/overview)
- [drizzle-zod](https://orm.drizzle.team/docs/zod)
- [Drizzle + RLS guide](https://orm.drizzle.team/docs/rls)
- RFC DemoBR §2.2 — escolha de ORM
- `research/tech/backend-stack.md` §3 — ORM comparison
- `research/tech/database-model.md` — schema completo