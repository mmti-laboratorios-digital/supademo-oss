import type { Task } from "graphile-worker";

/**
 * redact_pii — varre steps + leads e aplica máscaras em PII detectável.
 *
 * Heurística:
 *  - extra JSONB em leads → telefone, e-mail já chegam crus aqui. Apenas
 *    marcamos `exported_at = now()` para audit.
 *  - screenshots: OCR do screenshot para detectar CPF/CNPJ/e-mail.
 *    (V2 com Vision LLM — não no MVP.)
 */
export const redactPii: Task = async (rawPayload) => {
  const payload = rawPayload as { demoId: string };
  console.log(`[redact_pii] demoId=${payload.demoId} — noop no MVP`);
};
