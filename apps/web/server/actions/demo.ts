"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { demos, steps } from "@/db/schema/app";
import { eq } from "drizzle-orm";

const updateTitleSchema = z.object({
  demoId: z.string().uuid(),
  title: z.string().min(3).max(180),
});

export async function updateDemoTitle(input: z.infer<typeof updateTitleSchema>) {
  const { orgId } = await requireAuth();
  const parsed = updateTitleSchema.parse(input);
  await withTenant(orgId, async (db) => {
    await db
      .update(demos)
      .set({ title: parsed.title, updatedAt: new Date() })
      .where(eq(demos.id, parsed.demoId));
  });
  revalidatePath(`/demos/${parsed.demoId}/edit`);
}

const reorderSchema = z.object({
  demoId: z.string().uuid(),
  order: z.array(z.string().uuid()),
});

export async function reorderSteps(input: z.infer<typeof reorderSchema>) {
  const { orgId } = await requireAuth();
  const parsed = reorderSchema.parse(input);
  await withTenant(orgId, async (db) => {
    await db.transaction(async (tx) => {
      for (let i = 0; i < parsed.order.length; i++) {
        const id = parsed.order[i];
        if (!id) continue;
        await tx.update(steps).set({ position: i + 1 }).where(eq(steps.id, id));
      }
    });
  });
  revalidatePath(`/demos/${parsed.demoId}/edit`);
}

export async function publishDemo(demoId: string) {
  const { orgId } = await requireAuth();
  await withTenant(orgId, async (db) => {
    await db
      .update(demos)
      .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(demos.id, demoId));
  });
  revalidatePath(`/demos/${demoId}/edit`);
  revalidatePath("/demos");
}