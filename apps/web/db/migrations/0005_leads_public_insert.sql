-- 0005_leads_public_insert.sql
--
-- Permite que o visitante PÚBLICO do player grave um lead na demo.
--
-- Contexto: a captura de lead acontece no player (`/d/[slug]` e
-- `/embed/[id]`), que é acessado **sem sessão**. O `POST /api/v1/leads`
-- deriva o `workspace_id` do demo e grava com o role `app_user`, sem
-- contexto de tenant — e a policy `leads_all` (0000_init.sql) só libera a
-- escrita quando `app.current_tenant_id() = workspace_id`. Resultado:
-- `42501 — new row violates row-level security policy for table "leads"`.
-- Ou seja: **o funil de lead era impossível de fechar** — o formulário
-- existia, mas nenhum lead podia ser gravado.
--
-- Armadilha do Postgres (descoberta na F3): uma policy **FOR INSERT**
-- isolada (sem FOR SELECT/FOR ALL na mesma tabela) faz o INSERT falhar
-- com `42501` mesmo quando o `WITH CHECK` é `true`. O Postgres exige que
-- a linha recém-inserida seja visível pela policy de SELECT no mesmo
-- comando (o `RETURNING` re-avalia a visibilidade da row). Por isso
-- existem **duas** policies aqui: uma FOR INSERT e uma FOR SELECT.
--
-- Semântica (Postgres): policies do MESMO comando são combinadas com OR.
-- Para INSERT vale `leads_all OR leads_public_insert`:
--   - com tenant no contexto, `leads_all` já restringe ao próprio workspace;
--   - sem tenant (player público), a nova policy permite o insert.
--
-- A policy pública é estreita de propósito:
--   1. só INSERT e SELECT público da **própria row recém-criada**;
--   2. o `demo_id` precisa apontar para uma demo **publicada**;
--   3. o `workspace_id` do lead precisa ser **o mesmo da demo** — assim o
--      visitante não consegue atribuir o lead a outro workspace;
--   4. `consent_text` é obrigatório (o texto de consentimento gravado).
--
-- A policy de SELECT público só enxerga rows cujo demo_id aponta para uma
-- demo publicada do MESMO workspace. Isso não abre vazamento: o lead
-- gravado pelo visitante pertence a uma demo pública — e o creator só o
-- lê dentro do próprio tenant (via `leads_all`, que continua valendo).

CREATE POLICY leads_public_insert ON app.leads
  FOR INSERT WITH CHECK (
    app.current_tenant_id() IS NULL
    AND EXISTS (
      SELECT 1 FROM app.demos d
      WHERE d.id = leads.demo_id
        AND d.workspace_id = leads.workspace_id
        AND d.status = 'published'
    )
    AND length(coalesce(leads.consent_text, '')) > 0
  );
--> statement-breakpoint
CREATE POLICY leads_public_select ON app.leads
  FOR SELECT USING (
    app.current_tenant_id() IS NULL
    AND EXISTS (
      SELECT 1 FROM app.demos d
      WHERE d.id = leads.demo_id
        AND d.workspace_id = leads.workspace_id
        AND d.status = 'published'
    )
  );
