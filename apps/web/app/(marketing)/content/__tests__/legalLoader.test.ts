/**
 * apps/web/app/(marketing)/content/__tests__/legalLoader.test.ts
 *
 * F9.6 — as rotas públicas /privacidade, /termos e /cookies são exigidas pela
 * Chrome Web Store (a URL de privacidade precisa responder 200 sem login).
 * Este teste cobre o loader que transforma `legal/*.md` em blocos renderizáveis.
 *
 * ⚠️ Teste **unitário** (sem browser): o E2E de browser depende de chave real
 * do Clerk (bloqueio F10.1) — ver `tests/e2e/legal-pages.spec.ts`.
 */
import { describe, expect, it } from "vitest";
import { LEGAL_DOCUMENTS, loadLegalDocument } from "../legalLoader";

describe("loadLegalDocument", () => {
  it("carrega a política de privacidade com seções estruturadas", async () => {
    const doc = await loadLegalDocument("privacidade");
    expect(doc).not.toBeNull();
    expect(doc?.title).toBe("Política de Privacidade");

    const headings = doc?.blocks.filter((b) => b.type === "h2") ?? [];
    expect(headings.length).toBeGreaterThanOrEqual(8);

    // As seções que a ANPD e a CWS esperam encontrar.
    const texts = doc?.blocks.map((b) => ("text" in b ? b.text : "")).join(" ") ?? "";
    expect(texts).toMatch(/dados pessoais/i);
    expect(texts).toMatch(/base legal/i);
    expect(texts).toMatch(/direitos do titular/i);
    expect(texts).toMatch(/subprocessador/i);
  });

  it("preserva as tabelas da política (base legal por tratamento)", async () => {
    const doc = await loadLegalDocument("privacidade");
    const tables = doc?.blocks.filter((b) => b.type === "table") ?? [];
    expect(tables.length).toBeGreaterThanOrEqual(3);

    const baseLegal = tables.find(
      (t) => t.type === "table" && t.headers.some((h) => /base legal/i.test(h)),
    );
    expect(baseLegal).toBeDefined();
    if (baseLegal?.type === "table") {
      expect(baseLegal.headers.length).toBeGreaterThanOrEqual(3);
      expect(baseLegal.rows.length).toBeGreaterThan(0);
    }
  });

  it("extrai listas ordenadas e não ordenadas", async () => {
    const doc = await loadLegalDocument("privacidade");
    const lists = doc?.blocks.filter((b) => b.type === "ul" || b.type === "ol") ?? [];
    expect(lists.length).toBeGreaterThanOrEqual(3);
    for (const list of lists) {
      if (list.type === "ul" || list.type === "ol") {
        expect(list.items.length).toBeGreaterThan(0);
        for (const item of list.items) {
          expect(item.trim()).not.toBe("");
          // A marcação inline é removida no texto exibido.
          expect(item).not.toMatch(/\*\*/);
          expect(item).not.toMatch(/`/);
        }
      }
    }
  });

  it("gera âncoras (id) estáveis a partir dos headings", async () => {
    const doc = await loadLegalDocument("privacidade");
    const headings = doc?.blocks.filter((b) => b.type === "h2" || b.type === "h3") ?? [];
    expect(headings.length).toBeGreaterThan(0);
    for (const h of headings) {
      if (h.type === "h2" || h.type === "h3") {
        expect(h.id).toMatch(/^[a-z0-9-]+$/);
      }
    }
  });

  it("carrega termos e cookies", async () => {
    const termos = await loadLegalDocument("termos");
    expect(termos?.title).toBe("Termos de Uso");
    expect(termos?.blocks.length ?? 0).toBeGreaterThan(5);

    const cookies = await loadLegalDocument("cookies");
    expect(cookies?.title).toBe("Política de Cookies");
    expect(cookies?.blocks.length ?? 0).toBeGreaterThan(5);
  });

  it("devolve null para slug desconhecido", async () => {
    const doc = await loadLegalDocument("nao-existe" as "privacidade");
    expect(doc).toBeNull();
  });

  it("expõe o mapa de documentos legais usado pelas rotas", () => {
    expect(LEGAL_DOCUMENTS.privacidade.file).toBe("privacy-policy.md");
    expect(LEGAL_DOCUMENTS.termos.file).toBe("terms-of-service.md");
    expect(LEGAL_DOCUMENTS.cookies.file).toBe("cookie-policy.md");
  });
});
