/**
 * apps/workers/src/lib/asaas.ts
 * -----------------------------------------------------------------------------
 * Cliente HTTP mínimo do Asaas para o worker.
 *
 * ⚠️ **Por que não importar `apps/web/lib/billing/asaas.ts`?**
 *
 * O client do app web depende de `env()` (Zod validado, `process.env` + Next).
 * O worker é um **processo Node separado** (`apps/workers`), sem Next no
 * runtime — e o `apps/web` não é dependência do workspace `workers`. Trazer o
 * client para cá manteria o worker acoplado ao app web por um import.
 *
 * O que o worker precisa é pequeno: **ler** uma subscription. O client do app
 * web continua sendo a referência para o app (criar customer, criar
 * subscription, criar payment, QR Code do PIX).
 *
 * ⚠️ **A URL do mock (`MOCK_ASAAS_URL`) é respeitada** — é o mesmo mecanismo
 * usado pelo app web (`asaasBaseUrl()`), e é o que permite testar o job sem
 * rede.
 */

/**
 * Base do Asaas por ambiente.
 *
 * ⚠️ **Mesma tabela do app web** (`apps/web/lib/billing/asaas.ts`) — se uma
 * mudar, as duas precisam mudar. Divergir aqui significaria o worker
 * consultando um host diferente do app.
 */
const ASAAS_BASE = {
  sandbox: "https://sandbox.asaas.com/api/v3",
  production: "https://api.asaas.com/v3",
} as const;

export type AsaasEnvironment = keyof typeof ASAAS_BASE;

/**
 * DTO da subscription no Asaas (subset usado pela reconciliação).
 */
export type AsaasSubscription = {
  id: string;
  customer: string;
  status: string;
  value: number;
  /** Data da próxima cobrança — `YYYY-MM-DD`. É o fim do ciclo corrente. */
  nextDueDate?: string;
  /** Data de início do ciclo — `YYYY-MM-DD`. */
  startDate?: string;
  /** `true` quando o cancelamento foi agendado para o fim do ciclo. */
  cancelAtPeriodEnd?: boolean;
};

/**
 * URL base do Asaas.
 *
 * - `MOCK_ASAAS_URL` → mock local (usado nos testes de integração);
 * - `ASAAS_ENVIRONMENT` → sandbox (default) ou produção.
 */
export function asaasBaseUrl(): string {
  const mock = process.env.MOCK_ASAAS_URL;
  if (mock) return `${mock.replace(/\/$/, "")}/v3`;
  const env = (process.env.ASAAS_ENVIRONMENT ?? "sandbox") as AsaasEnvironment;
  return ASAAS_BASE[env] ?? ASAAS_BASE.sandbox;
}

/**
 * `fetch` autenticado no Asaas.
 *
 * O Asaas autentica com o header `access_token`. Erros da API são propagados
 * com o body em texto — útil para o log do job.
 */
export async function asaasRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("ASAAS_API_KEY not configured");
  const base = asaasBaseUrl();

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      access_token: apiKey,
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Asaas ${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

/**
 * Lê uma subscription no Asaas (`GET /v3/subscriptions/{id}`).
 */
export async function getSubscription(id: string): Promise<AsaasSubscription> {
  return asaasRequest<AsaasSubscription>(`/subscriptions/${id}`);
}

/**
 * Mapeia o status do Asaas → status interno (canonical).
 *
 * ⚠️ Espelha `mapAsaasStatus()` do app web (`apps/web/lib/billing/asaas.ts`).
 * Os dois precisam concordar — se divergirem, o app e o job reinterpretam
 * estados diferentes para a mesma assinatura. (O `mapAsaasStatus` do app web
 * não é importável aqui pelo mesmo motivo do client HTTP.)
 */
export function mapAsaasStatus(asaas: string): string {
  switch (asaas.toUpperCase()) {
    case "ACTIVE":
      return "active";
    case "OVERDUE":
      return "past_due";
    case "INACTIVE":
    case "EXPIRED":
    case "CANCELLED":
      return "canceled";
    case "TRIAL":
      return "trial";
    default:
      return "incomplete";
  }
}
