export * from "./types/demo";
export * from "./types/analytics";
export * from "./types/billing";
export * from "./schemas/demo.schema";
export * from "./schemas/lead.schema";
// NOTE: ./test-utils/asaas-payloads uses `node:crypto` and is server/test only.
// Do NOT re-export here — it pollutes the client bundle via lib/i18n/index.tsx
// which imports from "@demo.br/shared". Import directly from
// "@demo.br/shared/test-utils/asaas-payloads" in server/test code.
export { default as messagesPtBR } from "./i18n/messages.pt-BR.json";
export { default as messagesEn } from "./i18n/messages.en.json";

export * from "./i18n/translate";
