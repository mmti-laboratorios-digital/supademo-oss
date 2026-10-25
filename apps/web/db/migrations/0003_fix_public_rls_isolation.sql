-- 0003_fix_public_rls_isolation.sql
--
-- Corrige as policies publicas de SELECT para NÃO quebrarem o isolamento
-- multi-tenant quando um tenant_id está ativo no contexto da conexão.
--
-- Contexto: 0002_public_demo_select.sql adicionou `demos_public_select` e
-- `steps_public_select` para permitir leitura pública de demos publicadas
-- (player em `/d/[slug]` e `/embed/[id]` sem autenticação). Porém, como
-- policies do mesmo comando são combinadas com OR, a policy publica passou
-- a vazar dados entre tenants autenticados: qualquer workspace logado via
-- `app.current_tenant_id()` conseguia ler demos `published` de outros
-- workspaces.
--
-- Correção: a policy publica só se aplica quando NÃO há tenant no contexto.
-- A função `app.current_tenant_id()` retorna NULL quando a config
-- `app.current_tenant_id` não está setada (caso do player publico).
-- Quando há tenant, `demos_all` / `steps_all` isolam normalmente.

DROP POLICY IF EXISTS demos_public_select ON app.demos;
CREATE POLICY demos_public_select ON app.demos
  FOR SELECT USING (
    status = 'published'
    AND app.current_tenant_id() IS NULL
  );

DROP POLICY IF EXISTS steps_public_select ON app.steps;
CREATE POLICY steps_public_select ON app.steps
  FOR SELECT USING (
    app.current_tenant_id() IS NULL
    AND EXISTS (
      SELECT 1 FROM app.demos d
      WHERE d.id = steps.demo_id
        AND d.status = 'published'
    )
  );
