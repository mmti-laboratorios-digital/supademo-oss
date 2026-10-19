import { z } from "zod";

/**
 * Schema canônico de validação de Demo.
 * Usado em: API REST, server actions, validação de upload da extensão.
 */

export const hotspotSchema = z.object({
  type: z.enum(["pointer", "callout", "area"]),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  w: z.number().min(0).max(100).optional(),
  h: z.number().min(0).max(100).optional(),
});

export const finalCtaSchema = z.object({
  type: z.enum(["whatsapp", "url", "email"]),
  value: z.string().min(1).max(500),
  label: z.string().min(1).max(80),
});

export const slugSchema = z
  .string()
  .min(3)
  .max(64)
  .regex(/^[a-z0-9-]+$/, "slug deve ser [a-z0-9-]");

export const demoCreateSchema = z.object({
  title: z.string().min(3).max(180),
  slug: slugSchema,
  description: z.string().max(2000).optional(),
  language: z.enum(["pt-BR", "en"]).default("pt-BR"),
  leadFormEnabled: z.boolean().default(false),
  finalCta: finalCtaSchema.optional(),
});

export const demoUpdateSchema = z.object({
  title: z.string().min(3).max(180).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  language: z.enum(["pt-BR", "en"]).optional(),
  leadFormEnabled: z.boolean().optional(),
  finalCta: finalCtaSchema.nullable().optional(),
});

export const stepCreateSchema = z.object({
  position: z.number().int().min(1).max(1000),
  screenshotR2Key: z.string().min(1).max(255),
  sourceUrl: z.string().url(),
  sourceTitle: z.string().max(255).optional(),
  caption: z.string().max(2000).optional(),
  hotspot: hotspotSchema,
});

export const stepUpdateSchema = z.object({
  stepId: z.string().uuid(),
  position: z.number().int().min(1).max(1000).optional(),
  caption: z.string().max(2000).optional(),
  hotspot: hotspotSchema.optional(),
  screenshotR2Key: z.string().min(1).max(255).optional(),
});

export type DemoCreate = z.infer<typeof demoCreateSchema>;
export type DemoUpdate = z.infer<typeof demoUpdateSchema>;
export type StepCreate = z.infer<typeof stepCreateSchema>;
export type StepUpdate = z.infer<typeof stepUpdateSchema>;
