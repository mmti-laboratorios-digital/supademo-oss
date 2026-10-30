-- 0004_flat_plans.sql
--
-- F0 — Pricing flat + views ilimitadas (gate G0.5).
--
-- Contexto: até aqui o `app.plans` carregava o modelo antigo, de view-cap
-- (50 / 5.000 / 50.000 views por mês, Free com 0 leads). A decisão D1 troca
-- para preço fechado por plano, com creators inclusos e VIEWS ILIMITADAS em
-- todos os planos — inclusive o Free. O Free ganha lead form (D2), porque a
-- prova de valor do produto é a captura de lead.
--
-- Duas regras deliberadas aqui:
--
-- 1. `max_views_per_month` NÃO é dropada. A coluna é mantida e os 3 planos
--    passam a `NULL`, onde `NULL` significa "ilimitado". `DROP COLUMN` em
--    tabela populada é destrutivo e irreversível sem dump, e não há ganho em
--    remover a coluna — o código ainda precisa do campo para distinguir
--    "ilimitado" de "zero".
--
-- 2. As migrations 0000–0003 não são tocadas. Esta é a primeira que muda o
--    modelo de pricing, e a anterior (`0000_init.sql`) continua sendo o
--    registro do que existia antes.
--
-- Os limites gravados aqui espelham `docs/MVP-PLAN.md` §5 e o bloco
-- `pricing_brl` de `specs/mvp-scope.json`. O gate G0.5 valida que os três
-- batem entre si.

ALTER TABLE app.plans ADD COLUMN IF NOT EXISTS max_creators integer NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE app.plans ADD COLUMN IF NOT EXISTS link_ttl_days integer NOT NULL DEFAULT 30;
--> statement-breakpoint
ALTER TABLE app.plans ADD COLUMN IF NOT EXISTS custom_domain boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE app.plans ADD COLUMN IF NOT EXISTS watermark_on_cta boolean NOT NULL DEFAULT true;
--> statement-breakpoint
ALTER TABLE app.plans ADD COLUMN IF NOT EXISTS lead_form boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE app.plans DROP CONSTRAINT IF EXISTS plans_max_creators_positive;
--> statement-breakpoint
ALTER TABLE app.plans ADD CONSTRAINT plans_max_creators_positive CHECK (max_creators >= 1);
--> statement-breakpoint

-- Free: R$ 0 · 1 creator · 3 demos · 10 steps/demo · views ilimitadas ·
-- 20 leads/mês · lead form ligado · watermark no CTA · links 30d.
UPDATE app.plans SET
  name_pt_br = 'Free',
  name_en = 'Free',
  price_brl_cents = 0,
  max_creators = 1,
  max_demos = 3,
  max_steps_per_demo = 10,
  max_views_per_month = NULL,
  max_leads_per_month = 20,
  tts_minutes_per_month = 0,
  ai_text_requests_per_month = 0,
  link_ttl_days = 30,
  custom_domain = false,
  watermark_on_cta = true,
  lead_form = true,
  features = '["3 demos","10 steps/demo","views ilimitadas","20 leads/mês","links 30d","analytics anônimo"]'::jsonb
WHERE id = 'free';
--> statement-breakpoint

-- Pro: R$ 49/mês (R$ 490/ano) · 1 creator · demos ilimitados · 30 steps/demo ·
-- views ilimitadas · 100 leads/mês · lead form ligado · sem watermark.
UPDATE app.plans SET
  name_pt_br = 'Pro',
  name_en = 'Pro',
  price_brl_cents = 4900,
  max_creators = 1,
  max_demos = NULL,
  max_steps_per_demo = 30,
  max_views_per_month = NULL,
  max_leads_per_month = 100,
  tts_minutes_per_month = 30,
  ai_text_requests_per_month = 500,
  link_ttl_days = 30,
  custom_domain = false,
  watermark_on_cta = false,
  lead_form = true,
  features = '["demos ilimitados","30 steps/demo","views ilimitadas","100 leads/mês","30 min TTS","PIX+boleto+cartão"]'::jsonb
WHERE id = 'pro';
--> statement-breakpoint

-- Business: R$ 199/mês (R$ 1.990/ano) · 3 creators · demos ilimitados ·
-- 60 steps/demo · views ilimitadas · leads ilimitados · custom domain ·
-- lead form ligado · sem watermark.
UPDATE app.plans SET
  name_pt_br = 'Business',
  name_en = 'Business',
  price_brl_cents = 19900,
  max_creators = 3,
  max_demos = NULL,
  max_steps_per_demo = 60,
  max_views_per_month = NULL,
  max_leads_per_month = NULL,
  tts_minutes_per_month = 200,
  ai_text_requests_per_month = 2000,
  link_ttl_days = 30,
  custom_domain = true,
  watermark_on_cta = false,
  lead_form = true,
  features = '["60 steps/demo","views ilimitadas","leads ilimitados","200 min TTS","custom domain","variáveis","branching","white-label","CRM BR"]'::jsonb
WHERE id = 'business';
