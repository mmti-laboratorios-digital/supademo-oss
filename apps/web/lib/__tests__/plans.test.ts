import { readFileSync } from "node:fs";
import { resolve } from "node:path";
/**
 * apps/web/lib/__tests__/plans.test.ts
 *
 * Gate G0.5 — o pricing do banco tem que bater com `specs/mvp-scope.json`
 * (`pricing_brl`) e com `docs/MVP-PLAN.md` §5.
 *
 * Este teste existe para matar o drift clássico de pricing: alguém muda o
 * seed da migration, o JSON do spec ou o código, e os três param de falar a
 * mesma coisa. Como o G0.5 é "fundação" — sem ele, G1–G7 passam validando
 * contra dado errado — a verificação é automática, não manual.
 *
 * Precisa de Postgres com a migration 0004_flat_plans.sql aplicada.
 */
import { demos, workspaces } from "@/db/schema/app";
import { getAdminDb } from "@/lib/db";
import {
  PlanLimitError,
  assertWithinLimits,
  countWorkspaceResources,
  getPlanLimits,
} from "@/lib/plans";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

type SpecPlan = {
  price_monthly: number;
  max_creators: number;
  limits: Record<string, number | boolean | null>;
};

type Spec = {
  pricing_brl: Record<string, SpecPlan>;
};

const spec = JSON.parse(
  readFileSync(resolve(process.cwd(), "../../specs/mvp-scope.json"), "utf8"),
) as Spec;

const PLAN_IDS = ["free", "pro", "business"] as const;

/** Chave do spec (snake_case) -> chave do código (camelCase). */
const LIMIT_KEYS = {
  max_demos: "maxDemos",
  max_steps_per_demo: "maxStepsPerDemo",
  max_views_per_month: "maxViewsPerMonth",
  max_leads_per_month: "maxLeadsPerMonth",
  tts_minutes_per_month: "ttsMinutesPerMonth",
  ai_text_requests_per_month: "aiTextRequestsPerMonth",
  link_ttl_days: "linkTtlDays",
  custom_domain: "customDomain",
  watermark_on_cta: "watermarkOnCta",
  lead_form: "leadForm",
} as const;

const adminDb = getAdminDb();
let workspaceId: string;

beforeAll(async () => {
  const [workspace] = await adminDb
    .insert(workspaces)
    .values({
      slug: `plan-test-${Date.now()}`,
      name: "Plan Test",
      planId: "free",
    })
    .returning({ id: workspaces.id });
  workspaceId = workspace.id;
});

afterAll(async () => {
  await adminDb.delete(workspaces).where(eq(workspaces.id, workspaceId));
});

describe("gate G0.5 — pricing do banco bate com o spec", () => {
  it("getPlanLimits('free') devolve maxViewsPerMonth null e leadForm true", async () => {
    const limits = await getPlanLimits("free");
    expect(limits.maxViewsPerMonth).toBeNull();
    expect(limits.leadForm).toBe(true);
  });

  for (const planId of PLAN_IDS) {
    it(`getPlanLimits('${planId}') bate com pricing_brl.${planId}`, async () => {
      const limits = await getPlanLimits(planId);
      const expected = spec.pricing_brl[planId];

      expect(limits.priceBrlCents).toBe(expected.price_monthly * 100);
      expect(limits.maxCreators).toBe(expected.max_creators);

      for (const [specKey, codeKey] of Object.entries(LIMIT_KEYS)) {
        expect(limits[codeKey as keyof typeof limits]).toBe(expected.limits[specKey]);
      }
    });
  }

  it("os 3 planos têm views ilimitadas (decisão D1)", async () => {
    for (const planId of PLAN_IDS) {
      const limits = await getPlanLimits(planId);
      expect(limits.maxViewsPerMonth).toBeNull();
    }
  });
});

describe("assertWithinLimits — enforcement por plano", () => {
  it("Free rejeita o 4º demo (limite 3)", async () => {
    await expect(assertWithinLimits(workspaceId, "demo", 3)).resolves.toBeUndefined();
    await expect(assertWithinLimits(workspaceId, "demo", 4)).rejects.toThrow(PlanLimitError);
  });

  it("Free rejeita o 21º lead (limite 20)", async () => {
    await expect(assertWithinLimits(workspaceId, "lead", 20)).resolves.toBeUndefined();
    await expect(assertWithinLimits(workspaceId, "lead", 21)).rejects.toThrow(PlanLimitError);
  });

  it("Free rejeita o 11º step (limite 10)", async () => {
    await expect(assertWithinLimits(workspaceId, "step", 10)).resolves.toBeUndefined();
    await expect(assertWithinLimits(workspaceId, "step", 11)).rejects.toThrow(PlanLimitError);
  });

  it("a mensagem de erro diz quantos faltam e pede upgrade", async () => {
    const error = await assertWithinLimits(workspaceId, "demo", 4).catch(
      (e: unknown) => e as PlanLimitError,
    );
    expect(error).toBeInstanceOf(PlanLimitError);
    expect(error.message).toContain("3");
    expect(error.message).toContain("upgrade");
    expect(error.resource).toBe("demo");
    expect(error.limit).toBe(3);
    expect(error.requested).toBe(4);
  });

  it("plano sem limite (Business, demos ilimitados) nunca rejeita", async () => {
    const [businessWorkspace] = await adminDb
      .insert(workspaces)
      .values({
        slug: `plan-test-biz-${Date.now()}`,
        name: "Plan Test Business",
        planId: "business",
      })
      .returning({ id: workspaces.id });
    try {
      await expect(assertWithinLimits(businessWorkspace.id, "demo", 9999)).resolves.toBeUndefined();
      await expect(assertWithinLimits(businessWorkspace.id, "lead", 9999)).resolves.toBeUndefined();
    } finally {
      await adminDb.delete(workspaces).where(eq(workspaces.id, businessWorkspace.id));
    }
  });
});

describe("countWorkspaceResources — contagem com RLS", () => {
  it("conta os demos do workspace e ignora os de outro tenant", async () => {
    const [demo] = await adminDb
      .insert(demos)
      .values({
        workspaceId,
        slug: `plan-test-demo-${Date.now()}`,
        title: "Demo do teste de plano",
        status: "draft",
      })
      .returning({ id: demos.id });

    expect(await countWorkspaceResources(workspaceId, "demo")).toBe(1);
    expect(await countWorkspaceResources(workspaceId, "step", { demoId: demo.id })).toBe(0);

    const [otherWorkspace] = await adminDb
      .insert(workspaces)
      .values({
        slug: `plan-test-other-${Date.now()}`,
        name: "Plan Test Outro",
        planId: "free",
      })
      .returning({ id: workspaces.id });
    try {
      expect(await countWorkspaceResources(otherWorkspace.id, "demo")).toBe(0);
    } finally {
      await adminDb.delete(workspaces).where(eq(workspaces.id, otherWorkspace.id));
    }
  });
});
