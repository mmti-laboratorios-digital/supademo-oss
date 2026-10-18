# PHASE 6 — Recomendações (DB Schema Optimization)

**Data:** 2026-10-18  
**Escopo:** Índices, policies RLS adicionais, seeds faltantes, FKs, constraints, migrations.

> ℹ️ Tabelas de billing (`subscriptions`, `plans`, billing-related) **não foram tocadas**, conforme restrição da missão. As recomendações abaixo cobrem os demais aspectos do schema.

---

## 1. Migrations & Build System

### 🔴 Crítico: `drizzle-kit migrate` está quebrado

**Problema:** A migration `0000_init.sql` é raw SQL (sem `meta/_journal.json`), portanto `drizzle-kit migrate` falha com `Can't find meta/_journal.json file`. Apenas `psql -f` funciona hoje.

**Recomendação (sem mexer em billing):**

Escolher **uma** das opções:

**Opção A — Regenerar via drizzle-kit (consistente com `schema/`):**
```bash
cd apps/web
DATABASE_URL=... pnpm exec drizzle-kit generate
# isso vai criar 0000_init.sql (snake_case) + meta/_journal.json
# Reviewar diff — RLS/policies/grants podem precisar ficar em arquivo separado (manual).
```

**Opção B — Documentar a divergência e usar psql-only:** adicionar a `apps/web/scripts/db/migrate.sh`:
```bash
#!/usr/bin/env bash
# Aplica migrations raw (RLS + policies) — drizzle-kit não cobre isso.
set -euo pipefail
for f in apps/web/db/migrations/*.sql; do
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done
```

E adicionar um smoke check pós-migrate (`apps/web/scripts/db/verify-schema.ts`) que confirma tabelas/índices/policies — evita drift silencioso.

> 💡 A Opção A é melhor para o futuro: gera diff legível quando o schema mudar, e o journal permite `drizzle-kit push --force` para prototipagem.

---

## 2. Índices Sugeridos para Performance

### 2.1 Índices que **já existem** e estão OK

| Tabela | Índice | Uso |
|--------|--------|-----|
| `demos` | `(workspace_id, status)` | Listing filtrado por status (draft/published/archived) |
| `leads` | `(workspace_id, created_at DESC)` | Export em ordem cronológica |
| `leads` | `(demo_id)` | Leads por demo |
| `leads` | `(email)` | Busca LGPD |
| `steps` | `(demo_id)` | Steps por demo |
| `steps` | `(demo_id, position)` UNIQUE | Reordenação |
| `webhooks` | `webhooks_workspace_idx` | Lista de webhooks por tenant |
| `webhook_deliveries` | `(webhook_id)` | Histórico de deliveries |
| `events` (analytics) | `(demo_id, event_type, created_at DESC)` | Funil e reports |
| `events` (analytics) | `(workspace_id, created_at)` | Reports globais |
| `sessions` | `(member_id)` | Logout/invalidate |
| `members` | `(workspace_id)` | Listagem |
| `dsr_log` | `(lead_email)` | Busca LGPD por email |

### 2.2 Índices a **adicionar**

#### `app.demos.slug` — para o player público (lookup por slug em cada request)
```sql
CREATE INDEX IF NOT EXISTS demos_slug_idx ON app.demos(slug);
-- já tem UNIQUE em (slug) que cria índice automaticamente — NÃO adicionar duplicado.
-- ✅ OK — não precisa.
```

#### `app.workspaces.custom_domain` — para o player multi-tenant (custom domain)
```sql
-- Se custom_domain for usado em produção (lookup por hostname):
CREATE INDEX IF NOT EXISTS workspaces_custom_domain_idx ON app.workspaces(custom_domain);
-- WHERE custom_domain IS NOT NULL  -- parcial seria melhor mas UNIQUE implícito é mais seguro
```
**Justificativa:** atualmente `custom_domain` é nullable sem índice. Toda visita a `demo.exemplo.com.br` precisa resolver `custom_domain → workspace_id` rapidamente.

#### `app.leads` — partial index para `exported_at IS NULL`
```sql
CREATE INDEX IF NOT EXISTS leads_pending_export_idx
  ON app.leads(workspace_id, created_at)
  WHERE exported_at IS NULL;
```
**Justificativa:** export batch normalmente processa "leads não exportados". Índice parcial é menor e mais rápido que `leads_workspace_created_idx`.

#### `app.invitations.token` — para aceitar convite
Já tem UNIQUE em `(token)`, índice criado automaticamente. ✅ OK.

#### `analytics.events` — partial index por período recente
```sql
CREATE INDEX IF NOT EXISTS events_recent_idx
  ON analytics.events(workspace_id, created_at DESC)
  WHERE created_at > now() - interval '90 days';
```
**Justificativa:** reports são sempre sobre janelas recentes (7d/30d/90d). Índice parcial fica menor e cabe em RAM. ⚠️ Mas índice parcial com `now()` em predicate não é reescrito dinamicamente — usar `pg_partman` ou partitioning por mês se a tabela crescer muito.

#### `app.sessions.expires_at` — limpeza periódica
```sql
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON app.sessions(expires_at);
```
**Justificativa:** cleanup de sessões expiradas via `DELETE WHERE expires_at < now()` é varredura sequencial sem índice. Se tiver 1M+ sessões, fica lento.

---

## 3. Policies RLS Adicionais

### 3.1 Cobertura atual

| Tabela | Policy atual | Comando | OK? |
|--------|--------------|---------|-----|
| `workspaces` | `workspaces_select USING(true)` | SELECT | ✅ (descoberta pública) |
| `workspaces` | `workspaces_modify USING/WITH CHECK (id = current_tenant_id())` | ALL | ✅ |
| `members` | `members_all USING (workspace_id = current_tenant_id())` | ALL | ✅ |
| `sessions` | `sessions_all USING/WITH CHECK (EXISTS ... members.workspace_id)` | ALL | ✅ |
| `demos` | `demos_all` | ALL | ✅ |
| `steps` | `steps_all` | ALL | ✅ |
| `hotspots` | `hotspots_all` | ALL | ✅ |
| `leads` | `leads_all` | ALL | ✅ |
| `subscriptions` | `subscriptions_all` | ALL | ✅ (billing — não modificar) |
| `webhooks` | `webhooks_all` | ALL | ✅ |
| `webhook_deliveries` | `webhook_deliveries_all` | ALL | ✅ |
| `invitations` | `invitations_all` | ALL | ✅ |
| `dsr_log` | `select/insert/update USING(true)` | ALL | ✅ (DPO audit) |
| `plans` | `plans_public_select USING(true)` | SELECT | ✅ (lookup público) |
| `analytics.events` | `events_insert_public` (INSERT) + `events_select` | ALL | ✅ |

**Todas as 14 tabelas têm RLS ativo (`rowsecurity=t`).** ✅

### 3.2 Policies adicionais sugeridas

#### 🔴 `analytics.events` — bloquear UPDATE/DELETE para preservar audit trail

Hoje só tem policies para INSERT e SELECT. UPDATE/DELETE são negados por ausência de policy (RLS default DENY) — **OK** mas implícito. Vale tornar explícito:

```sql
CREATE POLICY events_no_update ON analytics.events
  FOR UPDATE USING (false) WITH CHECK (false);
CREATE POLICY events_no_delete ON analytics.events
  FOR DELETE USING (false);
```

**Justificativa:** events são audit/forensics LGPD-safe. UPDATE/DELETE explícito = conformidade demonstrável.

#### 🟡 `app.demos` — policy separada para SELECT público (player)

Hoje: `demos_all USING (workspace_id = current_tenant_id())` — sem contexto, 0 rows.

O player público (`/d/[slug]`) precisa ler `demos` **sem `app.current_tenant_id`** para resolver slug → demo. Há 2 caminhos:

**Caminho A (recomendado):** abrir conexão dedicada com `SET app.public_player = true` antes da query do player.
```sql
CREATE POLICY demos_public_select ON app.demos
  FOR SELECT
  USING (
    status = 'published'
    OR workspace_id = app.current_tenant_id()
  );
```
Mas isso vaza qualquer demo published — não vaza dados sensíveis pois os campos públicos são slug/title/description, mas expõe **existência** de demos.

**Caminho B (mais conservador):** rota dedicada `/api/public/demos/[slug]` que usa `getAdminDb()` (BYPASSRLS) para resolver, e retorna só campos públicos. ✅ **Já implementado** (verificar — sem mexer, apenas validar).

**Recomendação:** Caminho B é o que o schema atual espera. **Não adicionar** `demos_public_select` até auditar o player.

#### 🟡 `app.invitations` — soft-delete por expiração

Hoje policy única para ALL. Convite expirado (`expires_at < now()`) ainda é visível para o tenant. **Não é vazamento** (é o próprio tenant), mas seria útil policy separada para SELECT:
```sql
CREATE POLICY invitations_active_select ON app.invitations
  FOR SELECT USING (
    workspace_id = app.current_tenant_id()
    AND accepted_at IS NULL
    AND expires_at > now()
  );
```
ℹ️ Mudança de comportamento — pode quebrar fluxos. Avaliar antes de aplicar.

---

## 4. Seeds Faltando

### 4.1 O que `seed-test.ts` cria hoje
- 2 plans (free, pro) — ⚠️ **falta business** se quiser testar
- 1 workspace `teste`
- 1 demo `tour-exemplo` published
- 3 steps
- 1 lead de teste
- **0 hotspots** (steps usam `hotspot` JSONB column em vez de `app.hotspots` — verificar se está OK)

### 4.2 O que falta para paridade com produção

| Seed | Status | Recomendação |
|------|--------|--------------|
| Plan `business` | ❌ | Adicionar ao bloco `INSERT INTO app.plans` (id='business') |
| Plan `enterprise` | ❌ | Opcional — se roadmap tem, criar agora |
| Demo `archived` | ❌ | Adicionar 1 demo com `status='archived'` para testes de filtro |
| Demo `draft` | ❌ | Idem |
| Membros com roles diferentes (`admin`, `editor`, `viewer`) | ❌ | Útil para testes de permissões |
| 1 webhook com deliveries | ❌ | Para testes de retry |
| 1 invitation pendente + 1 aceito | ❌ | Para testes de fluxo de membros |
| 1 session ativa + 1 expirada | ❌ | Para testes de auth |
| Analytics events (5-10 rows) | ❌ | Para validar reports |
| 1 dsr_log pendente | ❌ | Para validar fluxo LGPD |
| Demo com `lead_form_enabled=true` + 2-3 leads | ⚠️ Parcial | demo atual tem flag, mas lead só tem 1 |

**Recomendação concreta:** estender `scripts/seed-test.ts` com:
```ts
// extras para paridade
await db.insert(plans).values([
  { id: "business", namePtBr: "Business", ... },
]).onConflictDoNothing();

await db.insert(demos).values([
  { slug: "rascunho-demo", status: "draft", ... },
  { slug: "demo-arquivado", status: "archived", ... },
]);

await db.insert(members).values([
  { workspaceId, email: "admin@teste.com", role: "admin" },
  { workspaceId, email: "editor@teste.com", role: "editor" },
]);

await db.insert(webhooks).values({
  workspaceId,
  url: "https://webhook.site/...",
  secret: "test_secret",
  events: ["demo.published"],
});

// etc.
```

### 4.3 `app.hotspots` vazio — decisão de design

A tabela `app.hotspots` existe no schema mas **nunca é populada pelo seed**. Steps usam o JSONB column `hotspot` (singular). Investigar se:
- a) `app.hotspots` é dead code para remover, **ou**
- b) `app.hotspots` deveria ter 1 row por step (1:N) e o JSONB em `steps` é legado

**Recomendação:** antes de remover, `grep` no código de runtime (`apps/web/app/`, `apps/web/lib/`) por `hotspots` para confirmar uso. Se não há código que escreva em `app.hotspots`, abrir issue para remover na próxima migration.

---

## 5. Foreign Keys a Adicionar

### 5.1 FKs já presentes (14) — OK

Todas as relações workspace → filhos estão com `ON DELETE CASCADE`. ✅

### 5.2 🔴 FKs faltando

#### `app.subscriptions.workspace_id` — usar `UNIQUE` para "uma subscription ativa por workspace"

Hoje a FK está OK (`workspace_id → workspaces(id)` CASCADE), mas **não há constraint de unicidade parcial**:
```sql
-- "apenas uma subscription ativa (não-cancelled) por workspace"
CREATE UNIQUE INDEX subscriptions_one_active_per_workspace_idx
  ON app.subscriptions(workspace_id)
  WHERE cancel_at_period_end = false AND status IN ('active', 'trialing', 'past_due');
```

**Justificativa:** hoje nada impede o app de criar 2+ subscriptions ativas para o mesmo workspace. ⚠️ Tabela de billing — não modificar nesta fase, **mas marcar para review**.

#### `app.workspaces.subscription_id` — FK circular para `subscriptions(id)`

Hoje `subscription_id UUID` (sem `.references()`). Inconsistência:
```sql
ALTER TABLE app.workspaces
  ADD CONSTRAINT workspaces_subscription_id_fkey
  FOREIGN KEY (subscription_id) REFERENCES app.subscriptions(id) ON DELETE SET NULL;
```

**Problema:** essa FK cria ciclo (workspaces ↔ subscriptions). PostgreSQL aceita mas precisa cuidado na ordem de INSERT. Alternativa: remover essa coluna e fazer lookup reverso (`SELECT * FROM subscriptions WHERE workspace_id = ?`).

**Recomendação:** avaliar remoção em refactor futuro. Por enquanto, `subscription_id` é só um cache.

#### `app.steps.next_step_id` — auto-referência, **NÃO deferrable**

Hoje:
```sql
next_step_id UUID REFERENCES app.steps(id)
```
Sem `ON DELETE` nem `DEFERRABLE`. Cenário:
```sql
-- Inserir step1 → step2 → step3 em uma transação, cada um referenciando o próximo
INSERT INTO steps (..., next_step_id) VALUES (..., '00000000-0000-0000-0000-...'); -- ❌ FK falha (id não existe)
```

**Recomendação:**
```sql
ALTER TABLE app.steps
  DROP CONSTRAINT steps_next_step_id_fkey,
  ADD CONSTRAINT steps_next_step_id_fkey
  FOREIGN KEY (next_step_id) REFERENCES app.steps(id)
  ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;
```

**Justificativa:** `DEFERRABLE` permite validar FKs no fim da transação, suportando inserts em ordem arbitrária.

---

## 6. Constraints Adicionais

### 6.1 🔴 CHECK constraints faltando

#### `app.demos.status`
```sql
ALTER TABLE app.demos
  ADD CONSTRAINT demos_status_check
  CHECK (status IN ('draft', 'published', 'archived'));
```
**Justificativa:** `status varchar(20)` aceita qualquer string. Schema TS infere `'draft' | 'published' | 'archived'`, mas DB não enforce. Sem CHECK, bug em runtime pode inserir `status='pulished'` silenciosamente.

#### `app.workspaces.plan_id`
```sql
ALTER TABLE app.workspaces
  ADD CONSTRAINT workspaces_plan_id_fkey
  FOREIGN KEY (plan_id) REFERENCES app.plans(id);
```
**Já existe como FK?** Não — linha 19 do schema TS é `varchar(20) DEFAULT 'free'` sem `.references()`. Hoje nada impede `plan_id='premium-enterprise'` que não existe em `app.plans`.

#### `app.workspaces.locale`
```sql
ALTER TABLE app.workspaces
  ADD CONSTRAINT workspaces_locale_check
  CHECK (locale IN ('pt-BR', 'en', 'es'));
```

#### `app.members.role`
```sql
ALTER TABLE app.members
  ADD CONSTRAINT members_role_check
  CHECK (role IN ('owner', 'admin', 'editor', 'viewer'));
```

#### `app.webhooks.events` — array values
```sql
-- Não dá pra CHECK em array contents sem função. Criar domain ou trigger.
-- Alternativa: validar via app/edge.
```

#### `app.steps.position` — positivo
```sql
ALTER TABLE app.steps
  ADD CONSTRAINT steps_position_positive_check
  CHECK (position >= 0);
```

### 6.2 `app.demos.published_at` — coerência com `status`

Hoje `published_at` é nullable; um demo `status='published'` pode ter `published_at=NULL`. Adicionar CHECK:
```sql
ALTER TABLE app.demos
  ADD CONSTRAINT demos_published_coherence_check
  CHECK (
    (status = 'published' AND published_at IS NOT NULL)
    OR (status IN ('draft', 'archived') AND published_at IS NULL)
    -- permite archives com published_at preservado (histórico)
    OR (status = 'archived')
  );
```

### 6.3 `app.leads.email` XOR `phone` — pelo menos 1 contato

```sql
ALTER TABLE app.leads
  ADD CONSTRAINT leads_has_contact_check
  CHECK (email IS NOT NULL OR phone IS NOT NULL);
```
**Justificativa:** lead sem email e sem phone é inútil e pode indicar bug.

---

## 7. Melhorias de Performance / Operacional

### 7.1 `pg_trgm` para busca textual em `demos.title`

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX demos_title_trgm_idx ON app.demos USING gin (title gin_trgm_ops);
```
**Justificativa:** UI de admin tem busca por título — LIKE '%foo%' é sequencial sem trigram.

### 7.2 `pg_stat_statements` para observabilidade

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```
**Justificativa:** identificar queries lentas em produção. Já deve estar habilitado no `postgresql.conf` (`shared_preload_libraries`), mas o `CREATE EXTENSION` precisa rodar no banco.

### 7.3 Partitioning para `analytics.events` (se > 100M rows)

Hoje `events` é uma tabela monolítica com `bigserial`. Se passar de 100M, particionar por mês:
```sql
CREATE TABLE analytics.events_partitioned (LIKE analytics.events INCLUDING ALL)
  PARTITION BY RANGE (created_at);
```
Avaliar quando passar de 50M rows. Antes disso, índice cobre.

### 7.4 `VACUUM` / `ANALYZE` policy

Hoje sem vacuum config. Para tabelas de alto churn (`leads`, `events`, `sessions`):
```sql
ALTER TABLE analytics.events SET (
  autovacuum_vacuum_scale_factor = 0.05,  -- default 0.2 é muito para high-churn
  autovacuum_analyze_scale_factor = 0.02
);
ALTER TABLE app.sessions SET (
  autovacuum_vacuum_scale_factor = 0.1
);
```

### 7.5 `app.sessions` — TTL job

Hoje `expires_at` é nullable em nada — sessions têm TTL explícito. Mas não há job que faça `DELETE WHERE expires_at < now()`. Recomendar:
```sql
-- Job no graphile-worker: cleanup_sessions
DELETE FROM app.sessions WHERE expires_at < now() - interval '7 days';
```

---

## 8. LGPD / Compliance

### 8.1 `app.dsr_log.lead_email` — já tem índice ✅
### 8.2 `app.dsr_log` deveria ter FK para `workspaces`
Hoje `workspace_id UUID REFERENCES app.workspaces(id)` **sem** `ON DELETE`. Sugerir:
```sql
ALTER TABLE app.dsr_log
  DROP CONSTRAINT dsr_log_workspace_id_fkey,
  ADD CONSTRAINT dsr_log_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES app.workspaces(id) ON DELETE SET NULL;
```
**Justificativa:** DSRs antigos devem sobreviver à exclusão do workspace (audit trail).

### 8.3 `app.leads.email` — hash para busca LGPD sem plaintext

Hoje email é plaintext. Para LGPD, considere:
- coluna `email_hash varchar(64)` para indexação sem PII
- email real criptografado ou removido após export

Já existem `consent_ip_hash` e `user_agent_hash` — padronizar `email_hash` também seria consistente. **Decisão de produto**, não de schema.

---

## 9. Resumo de Ações (Priorizado)

### 🔴 Crítico (bloqueia produção)
1. **Gerar `meta/_journal.json`** ou documentar fluxo psql-only (seção 1)
2. **FK `subscriptions` unique-active** parcial (billing — não mexer agora, marcar)
3. **CHECK constraint em `demos.status`** (seção 6.1)

### 🟡 Importante (não-bloqueante mas alto valor)
4. **FK `app.steps.next_step_id` deferrable** (seção 5.2)
5. **Índice `workspaces.custom_domain`** (seção 2.2)
6. **Índice parcial `leads_workspace_created_idx` para `exported_at IS NULL`** (seção 2.2)
7. **Política `analytics.events` no UPDATE/DELETE** explícita (seção 3.2)
8. **Estender `seed-test.ts` com paridade** (seção 4.2)

### 🟢 Nice-to-have
9. CHECK constraints em `role`, `locale`, `status`, `plan_id` (seção 6.1)
10. `pg_trgm` para busca de demos (seção 7.1)
11. `autovacuum` tuning (seção 7.4)
12. Investigar `app.hotspots` (morto ou em uso?) (seção 4.3)

---

## 10. Não Modificado (Conforme Restrição)

- `app.subscriptions` (billing)
- `app.plans` (billing)
- Colunas `asaas_*` em `workspaces`
- Tabela/arquivo `asaas_webhook_events` (não existe no schema atual)
- Qualquer lógica de pagamento

Recomendações sobre billing foram **apenas documentadas** (não aplicadas), conforme restrição da missão.