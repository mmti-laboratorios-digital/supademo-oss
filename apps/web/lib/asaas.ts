/**
 * apps/web/lib/asaas.ts
 * -----------------------------------------------------------------------------
 * @deprecated Use `@/lib/billing/asaas` — a implementação foi consolidada lá na
 * F4 (DEC-2026-11-01-025). Este arquivo existe só como shim de compatibilidade
 * para imports antigos e será removido.
 *
 * Motivo da consolidação: havia DUAS camadas Asaas — `lib/asaas.ts` (wrapper
 * HTTP) e `lib/billing/asaas.ts` (helpers puros). Duas camadas meant:
 * a base URL, o header `access_token` e o tratamento de erro viviam num
 * lugar, e o mapeamento de status/serialização vivia no outro — impossível
 * de evolve sem um dos dois ficar para trás.
 */
export {
  asaasBaseUrl,
  asaasRequest,
  buildSubscriptionPayload,
  brlToCents,
  cancelSubscription,
  centsToBrl,
  createCustomer,
  createPayment,
  createSubscription,
  findCustomerByEmail,
  formatPriceBrl,
  getSubscription,
  todayAsAsaasDate,
} from "./billing/asaas";

export type {
  AsaasCustomer,
  AsaasPayment,
  AsaasSubscription,
  BillingCycle,
  BillingType,
  CreateSubscriptionArgs,
} from "./billing/asaas";
