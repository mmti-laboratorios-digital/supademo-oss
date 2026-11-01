/* eslint-disable no-console */
/**
 * apps/web/scripts/test-webhook-asaas.ts
 * -----------------------------------------------------------------------------
 * Valida o webhook Asaas de ponta a ponta **sem precisar do Next.js rodando**.
 *
 * ⚠️ **Por que este script existe (e o que ele substitui):**
 *
 * A versão anterior exigia um servidor Next.js em `$BASE` e lia o status por
 * `GET /api/v1/billing/subscriptions/:id` — uma rota que **nunca existiu**.
 * O script falhava com "fetch failed" mesmo com o app rodando. Além disso,
 * ele assinava o body no header `X-Asaas-Signature`, mas o handler lê
 * `asaas-signature` — a validação HMAC caía no caminho do token fixo e a
 * assinatura nunca era conferida de verdade.
 *
 * A implementação real dos checks está em
 * `apps/web/app/api/__tests__/webhook-asaas.script.test.ts` — roda dentro do
 * vitest, que é o único ambiente onde `vi.mock` funciona (o script roda com
 * `tsx`, fora do runner). Este arquivo é só o ponto de entrada: sobe o
 * vitest com aquele arquivo e propaga o exit code.
 *
 * O que é coberto (gate G3):
 *   1. webhook sem auth → 401 MISSING_AUTH;
 *   2. assinatura HMAC inválida → 401 INVALID_SIGNATURE;
 *   3. `PAYMENT_RECEIVED` → `app.subscriptions.status = active` **e**
 *      `app.workspaces.plan_id` promovido para o plano pago;
 *   4. reenvio do MESMO `payment.id` → idempotente (sem efeito duplicado);
 *   5. `PAYMENT_OVERDUE` → `past_due`;
 *   6. `PAYMENT_REFUNDED` → `canceled` + workspace volta para Free;
 *   7. `SUBSCRIPTION_INACTIVATED` com o período já vencido → Free;
 *   8. `SUBSCRIPTION_INACTIVATED` dentro do ciclo → o plano é mantido.
 *
 * Uso:
 *   pnpm scripts:test-webhook-asaas
 */
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const TEST_FILE = resolve(process.cwd(), "app/api/__tests__/webhook-asaas.script.test.ts");

console.log("▶ Webhook Asaas — rodando os checks do gate G3…\n");

const child = spawn("pnpm", ["exec", "vitest", "run", TEST_FILE, "--reporter=verbose"], {
  stdio: "inherit",
  cwd: process.cwd(),
  env: {
    ...process.env,
    ASAAS_WEBHOOK_SECRET: process.env.ASAAS_WEBHOOK_SECRET ?? "mock_webhook_secret_for_sandbox",
    ASAAS_API_KEY: process.env.ASAAS_API_KEY ?? "mock_api_key",
  },
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
