-- ───────────────────────────────────────────────────────────────────────────
-- EasyDemo — initial schema
-- RLS + pgcrypto + tabelas do app/analytics
-- ───────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS analytics;

-- ─────────── App: workspaces ───────────
CREATE TABLE IF NOT EXISTS app.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_org_id VARCHAR(64) UNIQUE,
  slug VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  locale VARCHAR(5) NOT NULL DEFAULT 'pt-BR',
  plan_id VARCHAR(20) NOT NULL DEFAULT 'free',
  subscription_id UUID,
  asaas_customer_id VARCHAR(40),
  custom_domain VARCHAR(255),
  brand_logo_r2_key VARCHAR(255),
  brand_color VARCHAR(16),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS workspaces_plan_idx ON app.workspaces(plan_id);

-- ─────────── App: members ───────────
CREATE TABLE IF NOT EXISTS app.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES app.workspaces(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(120),
  role VARCHAR(20) NOT NULL DEFAULT 'owner',
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, email)
);

CREATE INDEX IF NOT EXISTS members_workspace_idx ON app.members(workspace_id);

-- ─────────── App: sessions ───────────
CREATE TABLE IF NOT EXISTS app.sessions (
  id TEXT PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES app.members(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  user_agent_hash VARCHAR(64),
  ip_hash VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_member_idx ON app.sessions(member_id);

-- ─────────── App: plans ───────────
CREATE TABLE IF NOT EXISTS app.plans (
  id VARCHAR(20) PRIMARY KEY,
  name_pt_br VARCHAR(40) NOT NULL,
  name_en VARCHAR(40) NOT NULL,
  price_brl_cents INTEGER NOT NULL,
  max_demos INTEGER,
  max_steps_per_demo INTEGER,
  max_leads_per_month INTEGER,
  max_views_per_month INTEGER,
  tts_minutes_per_month INTEGER,
  ai_text_requests_per_month INTEGER,
  features JSONB NOT NULL
);

INSERT INTO app.plans (id, name_pt_br, name_en, price_brl_cents, features) VALUES
  ('free', 'Free', 'Free', 0, '["3 demos","10 steps/demo","50 views/mês","links 30d","analytics anônimo"]'::jsonb),
  ('pro', 'Business', 'Pro', 4900, '["demos ilimitados","30 steps/demo","5k views/mês","100 leads/mês","30 min TTS","PIX+boleto+cartão"]'::jsonb),
  ('business', 'Business', 'Business', 19900, '["60 steps/demo","50k views/mês","leads ilimitados","200 min TTS","custom domain","variáveis","branching","white-label","CRM BR"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ─────────── App: subscriptions ───────────
CREATE TABLE IF NOT EXISTS app.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES app.workspaces(id) ON DELETE CASCADE,
  plan_id VARCHAR(20) NOT NULL REFERENCES app.plans(id),
  asaas_subscription_id VARCHAR(40),
  status VARCHAR(20) NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_workspace_idx ON app.subscriptions(workspace_id);

-- ─────────── App: demos ───────────
CREATE TABLE IF NOT EXISTS app.demos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES app.workspaces(id) ON DELETE CASCADE,
  slug VARCHAR(64) UNIQUE NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  language VARCHAR(5) NOT NULL DEFAULT 'pt-BR',
  cover_r2_key VARCHAR(255),
  lead_form_enabled BOOLEAN NOT NULL DEFAULT false,
  lead_form_consent_text TEXT,
  final_cta JSONB,
  variables JSONB,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS demos_workspace_status_idx ON app.demos(workspace_id, status);

-- ─────────── App: steps ───────────
CREATE TABLE IF NOT EXISTS app.steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_id UUID NOT NULL REFERENCES app.demos(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  screenshot_r2_key VARCHAR(255) NOT NULL,
  source_url TEXT NOT NULL,
  source_title VARCHAR(255),
  caption TEXT,
  hotspot JSONB NOT NULL,
  voiceover_r2_key VARCHAR(255),
  voiceover_text TEXT,
  next_step_id UUID REFERENCES app.steps(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(demo_id, position)
);

CREATE INDEX IF NOT EXISTS steps_demo_idx ON app.steps(demo_id);

-- ─────────── App: hotspots ───────────
CREATE TABLE IF NOT EXISTS app.hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES app.steps(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  geometry JSONB NOT NULL,
  action VARCHAR(20) NOT NULL DEFAULT 'next',
  action_target JSONB,
  label TEXT
);

CREATE INDEX IF NOT EXISTS hotspots_step_idx ON app.hotspots(step_id);

-- ─────────── App: leads ───────────
CREATE TABLE IF NOT EXISTS app.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES app.workspaces(id) ON DELETE CASCADE,
  demo_id UUID NOT NULL REFERENCES app.demos(id) ON DELETE CASCADE,
  name VARCHAR(120),
  email VARCHAR(255),
  phone VARCHAR(32),
  consent_text TEXT NOT NULL,
  consent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  consent_ip_hash VARCHAR(64),
  user_agent_hash VARCHAR(64),
  extra JSONB,
  exported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_workspace_created_idx ON app.leads(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS leads_demo_idx ON app.leads(demo_id);
CREATE INDEX IF NOT EXISTS leads_email_idx ON app.leads(email);

-- ─────────── App: webhooks ───────────
CREATE TABLE IF NOT EXISTS app.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES app.workspaces(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret VARCHAR(255) NOT NULL,
  events TEXT[] NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES app.webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(40) NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempt INTEGER NOT NULL DEFAULT 1,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS webhook_deliveries_webhook_idx ON app.webhook_deliveries(webhook_id);

-- ─────────── App: invitations ───────────
CREATE TABLE IF NOT EXISTS app.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES app.workspaces(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'editor',
  token VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invitations_workspace_idx ON app.invitations(workspace_id);
CREATE INDEX IF NOT EXISTS invitations_email_idx ON app.invitations(email);

-- ─────────── App: dsr_log ───────────
CREATE TABLE IF NOT EXISTS app.dsr_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES app.workspaces(id),
  lead_email VARCHAR(255),
  action VARCHAR(20) NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  notes TEXT
);

CREATE INDEX IF NOT EXISTS dsr_log_email_idx ON app.dsr_log(lead_email);

-- ─────────── Analytics: events ───────────
CREATE TABLE IF NOT EXISTS analytics.events (
  id BIGSERIAL PRIMARY KEY,
  workspace_id UUID NOT NULL,
  demo_id UUID NOT NULL,
  step_id UUID,
  event_type VARCHAR(40) NOT NULL,
  visitor_id_hash VARCHAR(64),
  device_class VARCHAR(10),
  country_code VARCHAR(2),
  referrer_host VARCHAR(255),
  utm JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_demo_event_created_idx ON analytics.events(demo_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS events_workspace_idx ON analytics.events(workspace_id, created_at);

-- ───────────────────────────────────────────────────────────────────────────
-- Row-Level Security
-- ───────────────────────────────────────────────────────────────────────────

-- Função que lê a config local de tenant_id (seta via SET LOCAL app.current_tenant_id)
CREATE OR REPLACE FUNCTION app.current_tenant_id() RETURNS UUID AS $$
DECLARE
  v TEXT;
BEGIN
  v := current_setting('app.current_tenant_id', true);
  IF v IS NULL OR v = '' THEN
    RETURN NULL;
  END IF;
  RETURN v::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Workspaces: leitura pública (descoberta via slug), escrita só owner
ALTER TABLE app.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.workspaces FORCE ROW LEVEL SECURITY;

CREATE POLICY workspaces_select ON app.workspaces
  FOR SELECT USING (true);

CREATE POLICY workspaces_modify ON app.workspaces
  FOR ALL
  USING (id = app.current_tenant_id())
  WITH CHECK (id = app.current_tenant_id());

-- Members
ALTER TABLE app.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.members FORCE ROW LEVEL SECURITY;

CREATE POLICY members_all ON app.members
  FOR ALL
  USING (workspace_id = app.current_tenant_id())
  WITH CHECK (workspace_id = app.current_tenant_id());

-- Demos
ALTER TABLE app.demos ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.demos FORCE ROW LEVEL SECURITY;

CREATE POLICY demos_all ON app.demos
  FOR ALL
  USING (workspace_id = app.current_tenant_id())
  WITH CHECK (workspace_id = app.current_tenant_id());

-- Steps (via demo)
ALTER TABLE app.steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.steps FORCE ROW LEVEL SECURITY;

CREATE POLICY steps_all ON app.steps
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM app.demos d
    WHERE d.id = steps.demo_id
      AND d.workspace_id = app.current_tenant_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM app.demos d
    WHERE d.id = steps.demo_id
      AND d.workspace_id = app.current_tenant_id()
  ));

-- Hotspots (via step → demo)
ALTER TABLE app.hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.hotspots FORCE ROW LEVEL SECURITY;

CREATE POLICY hotspots_all ON app.hotspots
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM app.steps s
    JOIN app.demos d ON d.id = s.demo_id
    WHERE s.id = hotspots.step_id
      AND d.workspace_id = app.current_tenant_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM app.steps s
    JOIN app.demos d ON d.id = s.demo_id
    WHERE s.id = hotspots.step_id
      AND d.workspace_id = app.current_tenant_id()
  ));

-- Leads
ALTER TABLE app.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.leads FORCE ROW LEVEL SECURITY;

CREATE POLICY leads_all ON app.leads
  FOR ALL
  USING (workspace_id = app.current_tenant_id())
  WITH CHECK (workspace_id = app.current_tenant_id());

-- Subscriptions
ALTER TABLE app.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.subscriptions FORCE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_all ON app.subscriptions
  FOR ALL
  USING (workspace_id = app.current_tenant_id())
  WITH CHECK (workspace_id = app.current_tenant_id());

-- Webhooks
ALTER TABLE app.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.webhooks FORCE ROW LEVEL SECURITY;

CREATE POLICY webhooks_all ON app.webhooks
  FOR ALL
  USING (workspace_id = app.current_tenant_id())
  WITH CHECK (workspace_id = app.current_tenant_id());

CREATE POLICY webhook_deliveries_all ON app.webhook_deliveries
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM app.webhooks w
    WHERE w.id = webhook_deliveries.webhook_id
      AND w.workspace_id = app.current_tenant_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM app.webhooks w
    WHERE w.id = webhook_deliveries.webhook_id
      AND w.workspace_id = app.current_tenant_id()
  ));

ALTER TABLE app.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.webhook_deliveries FORCE ROW LEVEL SECURITY;

-- Invitations
ALTER TABLE app.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.invitations FORCE ROW LEVEL SECURITY;

CREATE POLICY invitations_all ON app.invitations
  FOR ALL
  USING (workspace_id = app.current_tenant_id())
  WITH CHECK (workspace_id = app.current_tenant_id());

-- Plans (lookup público)
ALTER TABLE app.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.plans FORCE ROW LEVEL SECURITY;

CREATE POLICY plans_public_select ON app.plans
  FOR SELECT USING (true);

-- Sessions
ALTER TABLE app.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.sessions FORCE ROW LEVEL SECURITY;

CREATE POLICY sessions_all ON app.sessions
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM app.members m
    WHERE m.id = sessions.member_id
      AND m.workspace_id = app.current_tenant_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM app.members m
    WHERE m.id = sessions.member_id
      AND m.workspace_id = app.current_tenant_id()
  ));

-- dsr_log (sem tenant direto — audit aberto para o DPO)
ALTER TABLE app.dsr_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.dsr_log FORCE ROW LEVEL SECURITY;

CREATE POLICY dsr_log_select ON app.dsr_log FOR SELECT USING (true);
CREATE POLICY dsr_log_insert ON app.dsr_log FOR INSERT WITH CHECK (true);
CREATE POLICY dsr_log_update ON app.dsr_log FOR UPDATE USING (true) WITH CHECK (true);

-- Analytics events (lidos via reports — escrita pública para o player SSR)
ALTER TABLE analytics.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.events FORCE ROW LEVEL SECURITY;

CREATE POLICY events_insert_public ON analytics.events
  FOR INSERT WITH CHECK (true);

CREATE POLICY events_select ON analytics.events
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM app.demos d
    WHERE d.id = events.demo_id
      AND d.workspace_id = app.current_tenant_id()
  ));

-- ─────────── graphile-worker schema (criado na primeira execução do worker) ───────────
-- As tabelas _graphile_worker.* são criadas pelo graphile-worker --schema-only.
-- Ver scripts/init-db.sh.

-- ─────────── Grants ───────────
GRANT USAGE ON SCHEMA app TO app_user, app_owner;
GRANT USAGE ON SCHEMA analytics TO app_user, app_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA analytics TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA analytics TO app_user;

GRANT ALL ON ALL TABLES IN SCHEMA app TO app_owner;
GRANT ALL ON ALL TABLES IN SCHEMA analytics TO app_owner;
GRANT ALL ON ALL SEQUENCES IN SCHEMA app TO app_owner;
GRANT ALL ON ALL SEQUENCES IN SCHEMA analytics TO app_owner;

ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT ALL ON TABLES TO app_owner;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics
  GRANT ALL ON TABLES TO app_owner;