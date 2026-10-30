/**
 * apps/web/lib/plans.ts
 *
 * Limites de plano: a fonte de verdade é a tabela `app.plans` (seed pela
 * migration `0004_flat_plans.sql`). Este módulo é a única porta de entrada
 * para enforcing de limites — o resto do app **não** deve ler `app.plans`
 * direto, senão o gate G0.5 ("o banco bate com o spec") passa a valer só
 * para este arquivo.
 *
 * Decisões que o código materializa (docs/MVP-PLAN.md §5):
 *  - D1: cobrança por creator seat, nunca por viewer. `maxViewsPerMonth`
 *    é `null` (= ilimitado) nos 3 planos. A coluna foi MANTIDA de propósito:
 *    `DROP COLUMN` em tabela populada é destrutivo, e o código precisa
 *    distinguir "ilimitado" de "zero".
 *  - D2: o Free tem lead form ligado e 20 leads/mês.
 *
 * `NULL` em um limite significa **ilimitado** em toda a API deste módulo.
 */

import { demos, leads, plans, steps, workspaces } from "@/db/schema/app";
import { getDb, withTenant } from "@/lib/db";
import type { PlanId } from "@easydemo/shared";
import { and, count, eq, gte } from "drizzle-orm";

/**
 * Limites efetivos de um plano, como consumidos pelo app.
 *
 * Espelha `docs/MVP-PLAN.md` §5 e o bloco `pricing_brl` de
 * `specs/mvp-scope.json` (gate G0.5 compara os três).
 */
export type PlanLimits = {
  planId: PlanId;
  namePtBr: string;
  priceBrlCents: number;
  /** Creators inclusos no plano (D1 — cobrança por creator seat). */
  maxCreators: number;
  /** `null` = ilimitado. */
  maxDemos: number | null;
  /** `null` = ilimitado. */
  maxStepsPerDemo: number | null;
  /** `null` = ilimitado (sempre, no modelo flat — decisão D1). */
  maxViewsPerMonth: number | null;
  /** `null` = ilimitado. */
  maxLeadsPerMonth: number | null;
  ttsMinutesPerMonth: number | null;
  aiTextRequestsPerMonth: number | null;
  linkTtlDays: number;
  customDomain: boolean;
  watermarkOnCta: boolean;
  /** D2: o Free captura lead. */
  leadForm: boolean;
};

/** Recurso cujo consumo é limitado pelo plano. */
export type LimitResource = "demo" | "step" | "lead";

const RESOURCE_LABEL: Record<LimitResource, string> = {
  demo: "demos",
  step: "steps por demo",
  lead: "leads por mês",
};

/**
 * Erro de limite de plano. Lançado quando o workspace estoura um limite.
 *
 * A mensagem é o que o usuário vê no checkout/painel, então é PT-BR e
 * aponta o caminho de upgrade — o gate G3 da F4 depende dela.
 */
export class PlanLimitError extends Error {
  readonly resource: LimitResource;
  readonly requested: number;
  readonly limit: number;
  readonly planId: PlanId;

  constructor(resource: LimitResource, requested: number, limit: number, planId: PlanId) {
    super(
      `O plano ${planId} permite no máximo ${limit} ${RESOURCE_LABEL[resource]}. ` +
        `Faça upgrade para continuar.`,
    );
    this.name = "PlanLimitError";
    this.resource = resource;
    this.requested = requested;
    this.limit = limit;
    this.planId = planId;
  }
}

type PlanRow = typeof plans.$inferSelect;

function toPlanLimits(row: PlanRow): PlanLimits {
  return {
    planId: row.id as PlanId,
    namePtBr: row.namePtBr,
    priceBrlCents: row.priceBrlCents,
    maxCreators: row.maxCreators,
    maxDemos: row.maxDemos,
    maxStepsPerDemo: row.maxStepsPerDemo,
    maxViewsPerMonth: row.maxViewsPerMonth,
    maxLeadsPerMonth: row.maxLeadsPerMonth,
    ttsMinutesPerMonth: row.ttsMinutesPerMonth,
    aiTextRequestsPerMonth: row.aiTextRequestsPerMonth,
    linkTtlDays: row.linkTtlDays,
    customDomain: row.customDomain,
    watermarkOnCta: row.watermarkOnCta,
    leadForm: row.leadForm,
  };
}

/**
 * Lê os limites de um plano do banco.
 *
 * `app.plans` tem policy de SELECT pública (`plans_public_select`), então
 * não precisa de contexto de tenant.
 */
export async function getPlanLimits(planId: PlanId): Promise<PlanLimits> {
  const db = getDb();
  const [row] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
  if (!row) {
    throw new Error(`Plano desconhecido: ${planId}`);
  }
  return toPlanLimits(row);
}

/** Limite que vale para um recurso. `null` = ilimitado. */
export function limitForResource(limits: PlanLimits, resource: LimitResource): number | null {
  switch (resource) {
    case "demo":
      return limits.maxDemos;
    case "step":
      return limits.maxStepsPerDemo;
    case "lead":
      return limits.maxLeadsPerMonth;
  }
}

/**
 * Plano do workspace. Workspace sem assinatura cai no `free`
 * (`app.workspaces.plan_id` tem default 'free').
 */
export async function getWorkspacePlanId(workspaceId: string): Promise<PlanId> {
  return withTenant(workspaceId, async (db) => {
    const [workspace] = await db
      .select({ planId: workspaces.planId })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);
    if (!workspace) {
      throw new Error(`Workspace não encontrado: ${workspaceId}`);
    }
    return workspace.planId as PlanId;
  });
}

/**
 * Garante que o workspace está dentro do limite do plano para um recurso.
 *
 * `count` é a quantidade **após** a operação — ou seja, o caller conta o
 * que já existe e soma 1. Ex.: no Free (máx. 3 demos), criar o 4º demo
 * chama `assertWithinLimits(wsId, "demo", 4)` e é rejeitado.
 *
 * Passa sem reclamar quando o limite é `null` (ilimitado) — é o caso de
 * views, demos no Pro/Business e leads no Business.
 *
 * @throws {PlanLimitError} quando `count` ultrapassa o limite do plano.
 */
export async function assertWithinLimits(
  workspaceId: string,
  resource: LimitResource,
  count: number,
): Promise<void> {
  const planId = await getWorkspacePlanId(workspaceId);
  const limits = await getPlanLimits(planId);
  const limit = limitForResource(limits, resource);
  if (limit !== null && count > limit) {
    throw new PlanLimitError(resource, count, limit, planId);
  }
}

/**
 * Conta o consumo atual do workspace, para o caller passar o número para
 * `assertWithinLimits`.
 *
 * - `demo`: demos do workspace (publicados e rascunhos);
 * - `lead`: leads capturados no período (default: o mês corrente);
 * - `step`: steps de um demo (`opts.demoId` é obrigatório — o limite de
 *   steps é por demo, não por workspace).
 */
export async function countWorkspaceResources(
  workspaceId: string,
  resource: LimitResource,
  opts: { demoId?: string; since?: Date } = {},
): Promise<number> {
  return withTenant(workspaceId, async (db) => {
    if (resource === "demo") {
      const [row] = await db
        .select({ value: count() })
        .from(demos)
        .where(eq(demos.workspaceId, workspaceId));
      return row?.value ?? 0;
    }

    if (resource === "lead") {
      const since = opts.since ?? startOfCurrentMonth();
      const [row] = await db
        .select({ value: count() })
        .from(leads)
        .where(and(eq(leads.workspaceId, workspaceId), gte(leads.createdAt, since)));
      return row?.value ?? 0;
    }

    if (!opts.demoId) {
      throw new Error("countWorkspaceResources('step') exige opts.demoId");
    }
    const [row] = await db
      .select({ value: count() })
      .from(steps)
      .where(eq(steps.demoId, opts.demoId));
    return row?.value ?? 0;
  });
}

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
