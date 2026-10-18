# Database model — Postgres multi-tenant, RLS, ORM

> Como estruturar o banco Postgres para SaaS B2B multi-tenant, considerando LGPD, RLS, soft delete e auditoria.

---

## 1. Estratégia multi-tenant no Postgres

### 1.1 Três modelos clássicos

| Modelo | Isolamento | Custo | Complexidade | Migração de schema | Quando usar |
|--------|-----------|-------|--------------|--------------------|-------------|
| **Database-per-tenant** | Total (banco físico separado) | Alto (N conexões, N backups) | Alta | Fácil (cada DB seu schema) | Enterprise (Slack, Salesforce); compliance extremo |
| **Schema-per-tenant** | Parcial (Postgres schema) | Médio (N migrations) | Média | Difícil (migrations em N schemas) | Médio porte (raramente usado) |
| **Row-Level Security (single schema)** | Lógico (WHERE tenant_id = ?) | Baixo (1 banco) | **Baixa** | Trivial | **SaaS B2B pequeno/médio — nossa escolha** |

### 1.2 Decisão: **RLS com banco único, schema compartilhado**

Baseado em:
- AWS Prescriptive Guidance on multi-tenant SaaS on AWS: <https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/rls.html>
- Blog "Multi-tenant data isolation with PostgreSQL Row-Level Security": <https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security>
- "Postgres Row-Level Security Footguns" (Bytebase 2025): <https://www.bytebase.com/blog/postgres-row-level-security-footguns>

**Como funciona:**
- Todas as tabelas têm coluna `tenant_id UUID NOT NULL`.
- Cada linha está amarrada a um tenant (workspace).
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY`.
- Antes de cada query, app faz `SET LOCAL app.current_tenant = '<uuid>'`.
- Policies garantem `USING (tenant_id = current_setting('app.tenant_id')::uuid)`.

### 1.3 Pegadinhas de RLS (lidas em <https://www.bytebase.com/blog/postgres-row-level-security-footguns>)

1. **Owner bypass**: tabelas owner pelo role de migration não vão respeitar RLS. Use `FORCE ROW LEVEL SECURITY` para forçar RLS até no owner.
2. **Bypass via superuser**: role com `BYPASSRLS` ignora policies. Nunca dê isso ao app_user.
3. **Funções não LEAKPROOF** quebram push-down de index scan → slow queries. Sempre declare `STABLE LEAKPROOF` em helpers de policy.
4. **Timing attacks**: query lenta em tenant errado vaza existência de rows. Mitigation: queries constantes em policies ou pgbouncer + statement_timeout.
5. **Performance de subqueries em USING clause**: evite `EXISTS (SELECT 1 FROM ...)` direto — materializa via função STABLE.

### 1.4 Setup mínimo

```sql
-- migrations/0001_init.sql

-- Função que retorna tenant atual
CREATE OR REPLACE FUNCTION app.current_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
LEAKPROOF
AS $$ SELECT current_setting('app.current_tenant_id', true)::UUID $$;

-- Tabela exemplo
CREATE TABLE demos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE demos ENABLE ROW LEVEL SECURITY;
ALTER TABLE demos FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON demos
  USING (tenant_id = app.current_tenant_id())
  WITH CHECK (tenant_id = app.current_tenant_id());
```

```ts
// Drizzle middleware — seta tenant antes de cada query
db.$client.on('beforeQuery', async (event) => {
  const tenantId = await getTenantFromClerk();
  await event.db.execute(sql`SET LOCAL app.current_tenant_id = ${tenantId}`);
});
```

Ou mais simples: usar `pg.Pool` com `options: '-c app.current_tenant_id=...'`.

---

## 2. Modelo de dados proposto (Postgres)

### 2.1 Diagrama ER simplificado

```
┌─────────────┐      ┌──────────────────┐      ┌──────────────┐
│ workspaces  │──┬──<│ workspace_members│      │   users      │
│ (tenants)   │  │   └──────────────────┘      │  (clerk)     │
└─────────────┘  │                              └──────────────┘
       │         │
       │         ├──<┌──────────────────┐
       │         │   │     demos        │──<┌──────────────┐
       │         │   │  (interactive)   │   │ demo_steps   │
       │         │   └──────────────────┘   └──────────────┘
       │         │                              │       │
       │         │                              │       └──< hotspots
       │         │                              └── branches
       │         │
       │         ├──<┌──────────────────┐
       │         │   │   invitations    │
       │         │   └──────────────────┘
       │         │
       │         ├──<┌──────────────────┐      ┌────────────────┐
       │         │   │  subscriptions   │──>──│ payment_events │
       │         │   └──────────────────┘      └────────────────┘
       │         │
       │         └──<┌──────────────────┐
       │             │  demo_events     │  (analytics — partitioned by month)
       │             └──────────────────┘
       │
       ├──<┌──────────────────┐
           │  audit_logs      │  (LGPD — quem acessou o quê)
           └──────────────────┘
```

### 2.2 Schema SQL (Drizzle-friendly)

```ts
// src/lib/db/schema.ts
import { pgTable, uuid, text, timestamp, integer, jsonb, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkOrgId: text('clerk_org_id').notNull().unique(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  plan: text('plan').notNull().default('free'), // 'free' | 'pro' | 'business'
  billingCustomerId: text('billing_customer_id'), // asaas/stripe
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  slugIdx: uniqueIndex('workspaces_slug_idx').on(t.slug),
}));

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const workspaceMembers = pgTable('workspace_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => workspaces.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  role: text('role').notNull(), // 'admin' | 'editor' | 'viewer'
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('workspace_members_uniq').on(t.tenantId, t.userId),
}));

export const demos = pgTable('demos', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => workspaces.id),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('draft'), // 'draft' | 'published' | 'archived'
  thumbnailUrl: text('thumbnail_url'),
  stepsCount: integer('steps_count').notNull().default(0),
  variables: jsonb('variables').$type<Record<string, string>>().notNull().default({}),
  settings: jsonb('settings').$type<{ theme?: Record<string, string>; autoplay?: boolean }>().notNull().default({}),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  tenantSlugIdx: uniqueIndex('demos_tenant_slug_idx').on(t.tenantId, t.slug),
  tenantIdx: index('demos_tenant_idx').on(t.tenantId),
  statusIdx: index('demos_status_idx').on(t.status),
}));

export const demoSteps = pgTable('demo_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => workspaces.id),
  demoId: uuid('demo_id').notNull().references(() => demos.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  imageUrl: text('image_url').notNull(),
  imageWidth: integer('image_width').notNull(),
  imageHeight: integer('image_height').notNull(),
  caption: text('caption'),
  tooltipTitle: text('tooltip_title'),
  tooltipBody: text('tooltip_body'),
  advanceMode: text('advance_mode').notNull().default('click'), // 'click' | 'auto' | 'manual'
  advanceDelayMs: integer('advance_delay_ms'),
  redactPii: boolean('redact_pii').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  demoPosIdx: index('demo_steps_demo_pos_idx').on(t.demoId, t.position),
}));

export const hotspots = pgTable('hotspots', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  stepId: uuid('step_id').notNull().references(() => demoSteps.id, { onDelete: 'cascade' }),
  x: integer('x').notNull(), // 0-10000 (basis points = % × 10000)
  y: integer('y').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  shape: text('shape').notNull().default('circle'), // 'circle' | 'rect'
  label: text('label'),
  description: text('description'),
  targetStepId: uuid('target_step_id'), // pode ser null = end of demo
  color: text('color'),
  rippleScale: integer('ripple_scale'),
}, (t) => ({
  stepIdx: index('hotspots_step_idx').on(t.stepId),
}));

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => workspaces.id),
  email: text('email').notNull(),
  role: text('role').notNull().default('editor'),
  token: text('token').notNull().unique(),
  invitedBy: uuid('invited_by').notNull().references(() => users.id),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().unique().references(() => workspaces.id),
  provider: text('provider').notNull(), // 'asaas' | 'stripe'
  externalId: text('external_id').notNull(),
  status: text('status').notNull(),
  plan: text('plan').notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelAt: timestamp('cancel_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Eventos do player — particionado por mês para escalar
export const demoEvents = pgTable('demo_events', {
  id: uuid('id').notNull().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  demoId: uuid('demo_id').notNull(),
  sessionId: text('session_id').notNull(), // cookie do visitante
  type: text('type').notNull(), // 'demo_view' | 'step_view' | 'cta_click' | ...
  stepId: uuid('step_id'),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
  userAgent: text('user_agent'),
  country: text('country'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  // Particionado por mês; recomendado: usar pg_partman ou partições manuais
  demoCreatedIdx: index('demo_events_demo_created_idx').on(t.demoId, t.createdAt),
}));

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  userId: uuid('user_id'),
  action: text('action').notNull(), // 'demo.view' | 'demo.export' | 'member.invite' | ...
  resource: text('resource'),
  resourceId: text('resource_id'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  payload: jsonb('payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  tenantCreatedIdx: index('audit_logs_tenant_created_idx').on(t.tenantId, t.createdAt),
}));
```

### 2.3 Padrões SaaS aplicados

#### Soft delete
- Coluna `deleted_at TIMESTAMPTZ` em todas as tabelas tenant-scoped.
- Adicionar `WHERE deleted_at IS NULL` via policy ou view.
- Job cron diário (graphile-worker) **anonimiza** após 90 dias (substitui PII por hash) e **purga** após 365 dias (LGPD).

#### Audit log
- Tabela `audit_logs` append-only.
- Trigger no Postgres que registra INSERT/UPDATE/DELETE em tabelas sensíveis (demos, members, billing).
- View para admin do workspace consultar "quem viu esse demo nos últimos 30 dias".

#### RLS em todo lugar
- Toda tabela tenant-scoped tem RLS com `app.current_tenant_id()`.
- Tabelas globais (sem tenant): `users`, `subscriptions` (1:1 com tenant) — sem RLS mas com `tenant_id` para queries.

#### Partitioning de `demoEvents`
- Por mês: `CREATE TABLE demo_events_2026_10 PARTITION OF demo_events FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');`
- `pg_partman` automatiza criação/remoção.
- Após 90 dias: detach + comprimir + enviar para R2 Ice.

---

## 3. ORM — Drizzle

### 3.1 Comparativo (atualizado 2026)

| Aspecto | Prisma 7 | **Drizzle 0.36** | Kysely 0.29 |
|---------|-----------|------------------|-------------|
| Bundle | ~600 KB | ~7 KB | ~3 KB |
| Cold start | ~90ms | ~10-20ms | ~5ms |
| Type safety | 100% (gerado) | 100% (inferido) | 100% (manual ou gerado) |
| API | High-level | SQL-like | SQL puro |
| Migrations | `prisma migrate` (automático) | `drizzle-kit generate` (diff) | Nenhuma (use ferramenta externa) |
| RLS awareness | Limitado (extensões pagas) | Custom middlewares (1) | Manual em cada query |
| Edge runtime | OK | Excelente | Excelente |
| Adoptado por | Vercel, Render, Replit | PlanetScale (adquiriu time), Cloudflare D1, Neon | Apps que querem controle total |

**Fontes:**
- Prisma comparison: <https://www.prisma.io/docs/orm/v7/more/comparisons/prisma-and-drizzle>
- Drizzle vs Prisma 2026: <https://www.pkgpulse.com/guides/prisma-vs-drizzle-2026>
- Neon guide: <https://neon.com/guides/prisma-drizzle-typeorm-postgres>

### 3.2 Decisão: **Drizzle ORM**

**Por quê:**
- Bundle 85x menor que Prisma — relevante em serverless e para cold start da API.
- SQL-first: para SaaS com RLS, é trivial fazer `SET LOCAL app.current_tenant_id` antes de cada transaction.
- Migrations são SQL files que você pode revisar manualmente.
- Type inference 100% sem codegen step.
- PlanetScale adquiriu o time em 2026 — sinal de longevidade.
- Funciona nativo em edge (Cloudflare Workers).

**Quando escolher Prisma:** se sua equipe não conhece SQL e prefere abstração. Para nosso time pequeno com devs SQL-fluent, Drizzle é melhor.

### 3.3 Stack Drizzle

- `drizzle-orm@^0.36.0`
- `drizzle-kit@^0.28.0` (migrations)
- `postgres@^3.4.0` (driver — Porsager é o mais rápido)
- `pg@^8.13.0` (alternativa se quiser pool nativo)

### 3.4 Schema RLS com Drizzle

```ts
// src/lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

const queryClient = postgres(process.env.DATABASE_URL!, { max: 10 });
export const db = drizzle(queryClient, { schema });

// Helper para queries com tenant
export async function withTenant<T>(
  tenantId: string,
  fn: (tx: typeof db) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL app.current_tenant_id = ${tenantId}`);
    return fn(tx);
  });
}

// Uso:
const myDemos = await withTenant(workspaceId, async (tx) => {
  return tx.select().from(schema.demos).where(eq(schema.demos.status, 'published'));
});
```

### 3.5 Migrations

```bash
npx drizzle-kit generate         # gera SQL a partir de schema.ts
npx drizzle-kit migrate          # aplica migrations pendentes
npx drizzle-kit studio           # UI local para inspecionar dados
```

Sempre commitar `drizzle/*.sql` no git. CI roda `drizzle-kit migrate` antes do deploy.

---

## 4. Estratégia de índices para SaaS pequeno

| Tabela | Índice | Query que otimiza |
|--------|--------|---------------------|
| demos | `(tenant_id, slug)` unique | GET `/d/abc` público |
| demos | `(tenant_id, status)` | Listagem admin filtrada |
| demo_steps | `(demo_id, position)` | Render player (ordem) |
| hotspots | `(step_id)` | Carregar todos do passo |
| demo_events | `(demo_id, created_at)` | Funil analytics |
| demo_events | `(tenant_id, created_at)` | Dashboard agregado |
| audit_logs | `(tenant_id, created_at DESC)` | Consulta "últimos 30 dias" |
| invitations | `token` unique | Aceitar convite |
| subscriptions | `tenant_id` unique + `external_id` unique | Webhook lookup |

Para 1k-100k demos, índices simples são suficientes. Após 1M demos: considerar partition + read replicas.

---

## 5. Connection pooling

Para 1 VPS 8 GB, **não** precisa de PgBouncer dedicado se usar `postgres` (Porsager) que já é eficiente.

Mas para SaaS multi-tenant com muitos tenants simultâneos, **recomendo PgBouncer** em modo `transaction`:

```
# pgbouncer.ini
[databases]
demo_br = host=127.0.0.1 port=5432 dbname=demo_br
[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
```

Acesso do app: `DATABASE_URL=postgres://demo_br:pwd@127.0.0.1:6432/demo_br`.

**Fonte:** <https://www.indujitechnologies.com/blog/multi-tenant-saas-architecture-nextjs-15-postgresql-rls-2026>

---

## 6. Backup — pgBackRest (ver `infra-vps.md` para detalhes)

Recomendação:
- pgBackRest com repo em R2 (`s3://bucket/pgbackrest`).
- Full backup diário, retenção 7 dias + 4 semanais + 12 mensais.
- WAL archiving contínuo.
- PITR (point-in-time recovery) até 7 dias atrás.

---

## 7. Estimativa de complexidade

| Tarefa | tamanho |
|---------|---------|
| Schema inicial (workspaces, members, demos, steps, hotspots) | S |
| RLS policies + functions LEAKPROOF | M |
| Drizzle setup + middleware de tenant | S |
| Migrations + seed | S |
| Audit log + soft delete patterns | M |
| Partitioning de demo_events (pg_partman) | M |
| PgBouncer config | S |

**Total DB layer: M.** Cabe em 1 sprint.

---

## 8. Referências

- AWS — Multi-tenant SaaS Postgres RLS: <https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/rls.html>
- AWS blog — RLS for multi-tenant data: <https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security>
- Bytebase — Postgres RLS Footguns: <https://www.bytebase.com/blog/postgres-row-level-security-footguns>
- Exemplo RLS mínimo MIT: <https://github.com/wenceslauAndre/postgres-rls-multi-tenancy>
- Exemplo NestJS + RLS: <https://github.com/RandyRozario/multitenant-saas>
- Drizzle vs Prisma (2026): <https://www.pkgpulse.com/guides/prisma-vs-drizzle-2026>
- Prisma vs Drizzle comparison oficial: <https://www.prisma.io/docs/orm/v7/more/comparisons/prisma-and-drizzle>
- TypeScript ORM type safety (Prisma Data Guide): <https://www.prisma.io/dataguide/database-tools/evaluating-type-safety-in-the-top-8-typescript-orms>
- Neon guide Prisma/Drizzle/TypeORM: <https://neon.com/guides/prisma-drizzle-typeorm-postgres>
- pgBackRest: <https://pgbackrest.org/>
- pgPartman: <https://github.com/pgpartman/pg_partman>