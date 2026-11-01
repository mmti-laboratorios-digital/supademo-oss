-- 0006_subscription_asaas_payment_id.sql
--
-- Guarda o id da cobrança (payment) do Asaas na row local da assinatura.
--
-- Contexto: a página `/billing/checkout` promete "pague com PIX" mas não
-- tinha como mostrar o QR Code. O Asaas só entrega o QR Code dinâmico via
-- `GET /v3/payments/{id}/pixQrCode` (devolve `encodedImage` em base64 +
-- o código copia-e-cola) — e o endpoint exige autenticação, então a chamada
-- tem que sair do servidor.
--
-- O problema: `app.subscriptions` só guardava `asaas_subscription_id`. Não
-- havia forma de saber **qual cobrança** buscar o QR Code. Sem esta coluna,
-- a UI só poderia exibir o link de pagamento.
--
-- A coluna é nullable: assinaturas criadas antes desta migration (ou
-- manualmente) continuam válidas — a UI apenas não mostra o QR Code e
-- oferece o link de pagamento como fallback.
--
-- ⚠️ Sem exposição pública: `app.subscriptions` tem RLS e só o próprio
-- tenant (via `withTenant`) lê a row. O id da cobrança do Asaas é um
-- identificador de pagamento — não é dado pessoal, mas também não deve
-- vazar.

ALTER TABLE app.subscriptions
  ADD COLUMN IF NOT EXISTS asaas_payment_id VARCHAR(40);

-- Índice para reconciliação (o webhook recebe o payment id e precisa
-- encontrar a assinatura correspondente).
CREATE INDEX IF NOT EXISTS subscriptions_asaas_payment_idx
  ON app.subscriptions (asaas_payment_id)
  WHERE asaas_payment_id IS NOT NULL;
