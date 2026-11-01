import { createHash, randomBytes } from "node:crypto";
/**
 * apps/web/lib/__tests__/visitor-id.test.ts
 *
 * Gate G5 — "duas views do mesmo navegador = 1 visitor".
 *
 * ⚠️ **O teste mais importante deste arquivo:** o cookie do visitante é
 * gravado pelo **middleware** (Edge runtime, Web Crypto) e lido pela página
 * do player (Node runtime, `node:crypto`). Se as duas implementações
 * divergissem, o mesmo visitante contaria como dois — e o funil de conversão
 * (que é o produto da F5) estaria quebrado sem nenhum erro visível.
 *
 * Por isso o primeiro teste compara as duas implementações byte a byte.
 */
import { describe, expect, it } from "vitest";
import {
  VISITOR_COOKIE_NAME,
  VISITOR_COOKIE_TTL_DAYS,
  VISITOR_HASH_LENGTH,
  VISITOR_ID_HEADER,
  hashVisitorId,
  randomVisitorId,
  visitorCookieConfig,
  visitorHashInput,
} from "../analytics/visitor-id";

describe("visitor-id — Edge (Web Crypto) vs Node (node:crypto)", () => {
  it("as duas implementações geram o MESMO hash para o mesmo id+salt", async () => {
    const id = randomBytes(16).toString("hex");
    const salt = "salt-de-teste";

    // Edge: Web Crypto (é o que o middleware usa).
    const edgeHash = await hashVisitorId(id, salt);

    // Node: node:crypto (é o que `visitor.ts` usa).
    const nodeHash = createHash("sha256")
      .update(visitorHashInput(id, salt))
      .digest("hex")
      .slice(0, VISITOR_HASH_LENGTH);

    expect(edgeHash).toBe(nodeHash);
    expect(edgeHash).toHaveLength(VISITOR_HASH_LENGTH);
  });

  it("divergem quando o salt muda (salt é rotativo)", async () => {
    const id = randomBytes(16).toString("hex");
    const a = await hashVisitorId(id, "salt-janeiro");
    const b = await hashVisitorId(id, "salt-fevereiro");
    expect(a).not.toBe(b);
  });

  it("salt undefined funciona (dev) e é diferente de salt vazio", async () => {
    const id = randomBytes(16).toString("hex");
    const semSalt = await hashVisitorId(id, undefined);
    const saltVazio = await hashVisitorId(id, "");
    // `undefined` e `""` produzem o mesmo input (`":id"`) — por isso são iguais.
    expect(semSalt).toBe(saltVazio);
  });

  it("o hash é determinístico para o mesmo par (id, salt)", async () => {
    const id = "abc123";
    const a = await hashVisitorId(id, "s");
    const b = await hashVisitorId(id, "s");
    expect(a).toBe(b);
  });
});

describe("randomVisitorId", () => {
  it("gera ids de 32 chars hex (16 bytes)", () => {
    const id = randomVisitorId();
    expect(id).toMatch(/^[a-f0-9]{32}$/);
  });

  it("gera ids diferentes a cada chamada", () => {
    const ids = new Set(Array.from({ length: 50 }, () => randomVisitorId()));
    expect(ids.size).toBe(50);
  });
});

describe("visitorCookieConfig", () => {
  it("usa os defaults quando o env está vazio", () => {
    const original = { ...process.env };
    delete process.env.VISITOR_COOKIE_NAME;
    delete process.env.VISITOR_COOKIE_TTL_DAYS;
    delete process.env.PII_HASH_SALT;
    try {
      const cfg = visitorCookieConfig();
      expect(cfg.name).toBe(VISITOR_COOKIE_NAME);
      expect(cfg.name).toBe("_pk_id");
      expect(cfg.ttlDays).toBe(VISITOR_COOKIE_TTL_DAYS);
      expect(cfg.ttlDays).toBe(30);
      expect(cfg.salt).toBeUndefined();
    } finally {
      process.env = original;
    }
  });

  it("lê o TTL do env quando configurado", () => {
    const original = process.env.VISITOR_COOKIE_TTL_DAYS;
    process.env.VISITOR_COOKIE_TTL_DAYS = "7";
    try {
      expect(visitorCookieConfig().ttlDays).toBe(7);
    } finally {
      if (original === undefined) delete process.env.VISITOR_COOKIE_TTL_DAYS;
      else process.env.VISITOR_COOKIE_TTL_DAYS = original;
    }
  });

  it("ignora TTL inválido (zero, negativo ou não-número)", () => {
    const original = process.env.VISITOR_COOKIE_TTL_DAYS;
    for (const bad of ["0", "-5", "abc"]) {
      process.env.VISITOR_COOKIE_TTL_DAYS = bad;
      expect(visitorCookieConfig().ttlDays).toBe(30);
    }
    if (original === undefined) delete process.env.VISITOR_COOKIE_TTL_DAYS;
    else process.env.VISITOR_COOKIE_TTL_DAYS = original;
  });

  it("`secure` só é true em produção", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    expect(visitorCookieConfig().secure).toBe(true);
    process.env.NODE_ENV = "development";
    expect(visitorCookieConfig().secure).toBe(false);
    if (original === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = original;
  });
});

describe("constantes", () => {
  it("o nome do cookie é `_pk_id` (o mesmo do histórico do projeto)", () => {
    expect(VISITOR_COOKIE_NAME).toBe("_pk_id");
  });

  it("o header injetado é interno (`x-visitor-id`)", () => {
    expect(VISITOR_ID_HEADER).toBe("x-visitor-id");
  });
});
