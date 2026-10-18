import {
  pgSchema,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Schema `app` — multi-tenant data com RLS.
 * RLS ativado em todas as tabelas via migration 0000_init.sql.
 */

const app = pgSchema("app");

export const workspaces = app.table("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkOrgId: varchar("clerk_org_id", { length: 64 }).unique(),
  slug: varchar("slug", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  locale: varchar("locale", { length: 5 }).notNull().default("pt-BR"),
  planId: varchar("plan_id", { length: 20 }).notNull().default("free"),
  subscriptionId: uuid("subscription_id"),
  asaasCustomerId: varchar("asaas_customer_id", { length: 40 }),
  customDomain: varchar("custom_domain", { length: 255 }),
  brandLogoR2Key: varchar("brand_logo_r2_key", { length: 255 }),
  brandColor: varchar("brand_color", { length: 16 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const members = app.table(
  "members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 120 }),
    role: varchar("role", { length: 20 }).notNull().default("owner"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    unqWorkspaceEmail: unique("members_workspace_email_unq").on(
      t.workspaceId,
      t.email,
    ),
  }),
);

export const sessions = app.table("sessions", {
  id: text("id").primaryKey(),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  userAgentHash: varchar("user_agent_hash", { length: 64 }),
  ipHash: varchar("ip_hash", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const demos = app.table(
  "demos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 64 }).notNull().unique(),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 20 }).notNull().default("draft"),
    language: varchar("language", { length: 5 }).notNull().default("pt-BR"),
    coverR2Key: varchar("cover_r2_key", { length: 255 }),
    leadFormEnabled: boolean("lead_form_enabled").notNull().default(false),
    leadFormConsentText: text("lead_form_consent_text"),
    finalCta: jsonb("final_cta"),
    variables: jsonb("variables"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    idxWorkspaceStatus: index("demos_workspace_status_idx").on(
      t.workspaceId,
      t.status,
    ),
  }),
);

export const steps = app.table(
  "steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    demoId: uuid("demo_id")
      .notNull()
      .references(() => demos.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    screenshotR2Key: varchar("screenshot_r2_key", { length: 255 }).notNull(),
    sourceUrl: text("source_url").notNull(),
    sourceTitle: varchar("source_title", { length: 255 }),
    caption: text("caption"),
    hotspot: jsonb("hotspot").notNull(),
    voiceoverR2Key: varchar("voiceover_r2_key", { length: 255 }),
    voiceoverText: text("voiceover_text"),
    nextStepId: uuid("next_step_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    unqDemoPosition: unique("steps_demo_position_unq").on(t.demoId, t.position),
  }),
);

export const hotspots = app.table("hotspots", {
  id: uuid("id").primaryKey().defaultRandom(),
  stepId: uuid("step_id")
    .notNull()
    .references(() => steps.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(),
  geometry: jsonb("geometry").notNull(),
  action: varchar("action", { length: 20 }).notNull().default("next"),
  actionTarget: jsonb("action_target"),
  label: text("label"),
});

export const plans = app.table("plans", {
  id: varchar("id", { length: 20 }).primaryKey(),
  namePtBr: varchar("name_pt_br", { length: 40 }).notNull(),
  nameEn: varchar("name_en", { length: 40 }).notNull(),
  priceBrlCents: integer("price_brl_cents").notNull(),
  maxDemos: integer("max_demos"),
  maxStepsPerDemo: integer("max_steps_per_demo"),
  maxLeadsPerMonth: integer("max_leads_per_month"),
  maxViewsPerMonth: integer("max_views_per_month"),
  ttsMinutesPerMonth: integer("tts_minutes_per_month"),
  aiTextRequestsPerMonth: integer("ai_text_requests_per_month"),
  features: jsonb("features").notNull(),
});

export const subscriptions = app.table("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  planId: varchar("plan_id", { length: 20 })
    .notNull()
    .references(() => plans.id),
  asaasSubscriptionId: varchar("asaas_subscription_id", { length: 40 }),
  status: varchar("status", { length: 20 }).notNull(),
  currentPeriodStart: timestamp("current_period_start", {
    withTimezone: true,
  }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const leads = app.table(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    demoId: uuid("demo_id")
      .notNull()
      .references(() => demos.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 32 }),
    consentText: text("consent_text").notNull(),
    consentAt: timestamp("consent_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    consentIpHash: varchar("consent_ip_hash", { length: 64 }),
    userAgentHash: varchar("user_agent_hash", { length: 64 }),
    extra: jsonb("extra"),
    exportedAt: timestamp("exported_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    idxWorkspaceCreated: index("leads_workspace_created_idx").on(
      t.workspaceId,
      t.createdAt,
    ),
    idxDemo: index("leads_demo_idx").on(t.demoId),
  }),
);

export const webhooks = app.table("webhooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  secret: varchar("secret", { length: 255 }).notNull(),
  events: text("events").array().notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const webhookDeliveries = app.table("webhook_deliveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  webhookId: uuid("webhook_id")
    .notNull()
    .references(() => webhooks.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 40 }).notNull(),
  payload: jsonb("payload").notNull(),
  responseStatus: integer("response_status"),
  responseBody: text("response_body"),
  attempt: integer("attempt").notNull().default(1),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const dsrLog = app.table("dsr_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  leadEmail: varchar("lead_email", { length: 255 }),
  action: varchar("action", { length: 20 }).notNull(),
  requestedAt: timestamp("requested_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  notes: text("notes"),
});

export const invitations = app.table("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("editor"),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─────────── Relations ───────────
export const workspaceRelations = relations(workspaces, ({ many }) => ({
  demos: many(demos),
  members: many(members),
  subscriptions: many(subscriptions),
  leads: many(leads),
}));

export const demoRelations = relations(demos, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [demos.workspaceId],
    references: [workspaces.id],
  }),
  steps: many(steps),
  leads: many(leads),
}));

export const stepRelations = relations(steps, ({ one, many }) => ({
  demo: one(demos, {
    fields: [steps.demoId],
    references: [demos.id],
  }),
  hotspots: many(hotspots),
}));