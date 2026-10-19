import { z } from "zod";

export const leadCreateSchema = z.object({
  workspaceId: z.string().uuid(),
  demoId: z.string().uuid(),
  workspaceName: z.string().min(1).max(120),
  name: z.string().min(1).max(120),
  email: z.string().email().max(255),
  phone: z
    .string()
    .max(32)
    .regex(/^[0-9+()\-\s]*$/, "telefone inválido")
    .optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Consentimento é obrigatório (LGPD art. 7º)" }),
  }),
  consentText: z.string().min(1).max(2000).optional(),
  extra: z.record(z.string()).optional(),
  locale: z.enum(["pt-BR", "en"]).default("pt-BR"),
});

export const leadExportSchema = z.object({
  email: z.string().email(),
  action: z.enum(["export", "delete"]).default("export"),
});

export type LeadCreate = z.infer<typeof leadCreateSchema>;
export type LeadExport = z.infer<typeof leadExportSchema>;
