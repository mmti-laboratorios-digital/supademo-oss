import { randomUUID } from "node:crypto";
import { demos, steps, workspaces } from "@/db/schema/app";
import { getAdminDb } from "@/lib/db";
import { publishDemo, unpublishDemo } from "@/server/repositories/demos";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Gate G1 — publicação real.
 *
 * Cobre o contrato do repositório usado pelos endpoints:
 * - demo sem steps não publica;
 * - slug inválido é rejeitado pela API (validação vive na rota, testada aqui
 *   via o mesmo schema no teste de integração dos endpoints);
 * - slug duplicado não publica;
 * - publicar define status/published_at;
 * - despublicar volta para draft e limpa published_at.
 *
 * Precisa de Postgres com as migrations aplicadas.
 */

const adminDb = getAdminDb();
let workspaceId: string;

beforeAll(async () => {
  const [workspace] = await adminDb
    .insert(workspaces)
    .values({
      slug: `publish-test-${randomUUID().slice(0, 8)}`,
      name: "Publish Test",
      planId: "free",
    })
    .returning({ id: workspaces.id });
  workspaceId = workspace.id;
});

afterAll(async () => {
  await adminDb.delete(workspaces).where(eq(workspaces.id, workspaceId));
});

async function createDemo(status: "draft" | "published" = "draft") {
  const [demo] = await adminDb
    .insert(demos)
    .values({
      workspaceId,
      slug: `publish-test-${randomUUID().slice(0, 12)}`,
      title: "Demo de teste",
      status,
    })
    .returning();
  return demo;
}

async function addStep(demoId: string) {
  const [step] = await adminDb
    .insert(steps)
    .values({
      demoId,
      position: 1,
      screenshotR2Key: `demos/${workspaceId}/steps/test.webp`,
      sourceUrl: "https://example.com",
      hotspot: { type: "pointer", x: 50, y: 50 },
    })
    .returning();
  return step;
}

describe("publishDemo — gate G1", () => {
  it("demo sem steps não publica", async () => {
    const demo = await createDemo();
    const result = await publishDemo(workspaceId, demo.id, `sem-steps-${randomUUID().slice(0, 8)}`);
    expect(result).toEqual({ ok: false, reason: "NO_STEPS" });

    const [unchanged] = await adminDb
      .select({ status: demos.status, publishedAt: demos.publishedAt })
      .from(demos)
      .where(eq(demos.id, demo.id));
    expect(unchanged?.status).toBe("draft");
    expect(unchanged?.publishedAt).toBeNull();
  });

  it("demo de outro workspace não é encontrada", async () => {
    const [otherWorkspace] = await adminDb
      .insert(workspaces)
      .values({
        slug: `publish-test-other-${randomUUID().slice(0, 8)}`,
        name: "Outro Publish Test",
        planId: "free",
      })
      .returning({ id: workspaces.id });
    try {
      const demo = await createDemo();
      await addStep(demo.id);
      const result = await publishDemo(
        otherWorkspace.id,
        demo.id,
        `outra-${randomUUID().slice(0, 8)}`,
      );
      expect(result).toEqual({ ok: false, reason: "NOT_FOUND" });
    } finally {
      await adminDb.delete(workspaces).where(eq(workspaces.id, otherWorkspace.id));
    }
  });

  it("slug já usado por outra demo não publica", async () => {
    const first = await createDemo();
    await addStep(first.id);
    const slug = `duplicado-${randomUUID().slice(0, 8)}`;

    const firstResult = await publishDemo(workspaceId, first.id, slug);
    expect(firstResult.ok).toBe(true);

    const second = await createDemo();
    await addStep(second.id);
    const secondResult = await publishDemo(workspaceId, second.id, slug);
    expect(secondResult).toEqual({ ok: false, reason: "SLUG_TAKEN" });
  });

  it("publica com status published e published_at preenchido", async () => {
    const demo = await createDemo();
    await addStep(demo.id);
    const slug = `publicada-${randomUUID().slice(0, 8)}`;

    const result = await publishDemo(workspaceId, demo.id, slug);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.demo.status).toBe("published");
    expect(result.demo.publishedAt).toBeInstanceOf(Date);
    expect(result.demo.slug).toBe(slug);
  });
});

describe("unpublishDemo — gate G1", () => {
  it("volta para draft e limpa published_at", async () => {
    const demo = await createDemo();
    await addStep(demo.id);
    await publishDemo(workspaceId, demo.id, `despublicar-${randomUUID().slice(0, 8)}`);

    const result = await unpublishDemo(workspaceId, demo.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.demo.status).toBe("draft");
    expect(result.demo.publishedAt).toBeNull();
  });

  it("demo inexistente retorna NOT_FOUND", async () => {
    const result = await unpublishDemo(workspaceId, randomUUID());
    expect(result).toEqual({ ok: false, reason: "NOT_FOUND" });
  });
});
