"use server";

import { leads } from "@/db/schema/app";
import { recordLeadCaptured } from "@/lib/analytics/events";
import { analyticsVisitorCookie } from "@/lib/analytics/visitor";
import { getDb } from "@/lib/db";
import { getDefaultConsentText } from "@/lib/lgpd/consent";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

const leadSchema = z.object({
  workspaceId: z.string().uuid(),
  demoId: z.string().uuid(),
  workspaceName: z.string().min(1).max(120),
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().max(32).optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Consentimento é obrigatório (LGPD art. 7º)" }),
  }),
  consentText: z.string().min(1).max(2000).optional(),
  extra: z.record(z.string()).optional(),
  locale: z.enum(["pt-BR", "en"]).default("pt-BR"),
});

export async function captureLead(
  input: z.infer<typeof leadSchema>,
): Promise<{ ok: true; leadId: string } | { ok: false; error: string }> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }

  const text =
    parsed.data.consentText ?? getDefaultConsentText(parsed.data.workspaceName, parsed.data.locale);

  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  const ip = h.get("x-forwarded-for") ?? "";
  const uaHash = hashPii(ua, "ua");
  const ipHash = hashPii(ip, "ip");

  const db = getDb();
  const [row] = await db
    .insert(leads)
    .values({
      workspaceId: parsed.data.workspaceId,
      demoId: parsed.data.demoId,
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone ?? null,
      consentText: text,
      consentIpHash: ipHash,
      userAgentHash: uaHash,
      extra: parsed.data.extra ?? null,
    })
    .returning({ id: leads.id });

  const visitor = await analyticsVisitorCookie(h);
  await recordLeadCaptured({
    workspaceId: parsed.data.workspaceId,
    demoId: parsed.data.demoId,
    visitorIdHash: visitor.idHash,
    deviceClass: visitor.deviceClass,
    countryCode: visitor.countryCode,
    referrerHost: visitor.referrerHost,
  });

  return { ok: true, leadId: row?.id ?? "" };
}

import { createHash } from "node:crypto";
function hashPii(value: string, kind: "ua" | "ip"): string {
  return createHash("sha256").update(`${kind}:${value}`).digest("hex").slice(0, 32);
}
