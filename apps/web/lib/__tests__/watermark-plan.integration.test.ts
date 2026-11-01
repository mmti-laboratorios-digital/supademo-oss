import { getPlanLimits } from "@/lib/plans";
/**
 * apps/web/lib/__tests__/watermark-plan.integration.test.ts
 *
 * Gate G5 (F7) — `watermark_on_cta` respeita o plano.
 *
 * O plano Free exibe o watermark "Powered by EasyDemo" no CTA final;
 * Pro/Business não exibem (a coluna `watermark_on_cta` da tabela `app.plans`
 * controla isso).
 */
import { describe, expect, it } from "vitest";

describe("watermark_on_cta por plano", () => {
  it("Free tem watermark_on_cta = true", async () => {
    const limits = await getPlanLimits("free");
    expect(limits.watermarkOnCta).toBe(true);
  });

  it("Pro tem watermark_on_cta = false", async () => {
    const limits = await getPlanLimits("pro");
    expect(limits.watermarkOnCta).toBe(false);
  });

  it("Business tem watermark_on_cta = false", async () => {
    const limits = await getPlanLimits("business");
    expect(limits.watermarkOnCta).toBe(false);
  });
});
