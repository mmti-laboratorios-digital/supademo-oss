-- 0002_public_demo_select.sql
--
-- Restaura a leitura pública de demos publicadas e seus steps.
--
-- Contexto: `0000_init.sql` criou `plans_public_select` (lookup público) mas
-- NUNCA criou as policies equivalentes para `app.demos` e `app.steps`. O
-- resultado era que `/d/[slug]` e `/embed/[id]` — que leem via `getDb()`
-- (role `app_user`, RLS ativo) sem contexto de tenant — recebiam 0 rows de
-- qualquer demo e caíam em `notFound()`. O produto não tinha player público.
--
-- Os testes de RLS já assumiam a existência de `demos_public_select`
-- (ver apps/web/lib/__tests__/rl.integration.test.ts:74 e :154), o que
-- confirma que a policy era a intenção original do autor.
--
-- Semântica (Postgres): policies do MESMO comando são combinadas com OR.
-- Para SELECT vale `demos_all OR demos_public_select`:
--   - queries com tenant (withTenant) continuam isoladas por workspace_id;
--   - queries sem tenant enxergam apenas demos com status='published'.
-- INSERT/UPDATE/DELETE só têm `demos_all`, então escrita permanece isolada.
-- Nenhum rascunho (status != 'published') fica exposto, mesmo que uma query
-- futura esqueça de filtrar por status — defense in depth no banco, não na
-- aplicação.

CREATE POLICY demos_public_select ON app.demos
  FOR SELECT USING (status = 'published');
--> statement-breakpoint
CREATE POLICY steps_public_select ON app.steps
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM app.demos d
    WHERE d.id = steps.demo_id
      AND d.status = 'published'
  ));