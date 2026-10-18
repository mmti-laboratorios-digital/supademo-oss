import {
  pgSchema,
  uuid,
  varchar,
  text,
  jsonb,
  bigserial,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * Schema `analytics` — eventos LGPD-safe.
 * NÃO tem IP, NÃO tem user_id cru.
 */

const analytics = pgSchema("analytics");

export const events = analytics.table(
  "events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    workspaceId: uuid("workspace_id").notNull(),
    demoId: uuid("demo_id").notNull(),
    stepId: uuid("step_id"),
    eventType: varchar("event_type", { length: 40 }).notNull(),
    visitorIdHash: varchar("visitor_id_hash", { length: 64 }),
    deviceClass: varchar("device_class", { length: 10 }),
    countryCode: varchar("country_code", { length: 2 }),
    referrerHost: varchar("referrer_host", { length: 255 }),
    utm: jsonb("utm"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    idxDemoEvent: index("events_demo_event_created_idx").on(
      t.demoId,
      t.eventType,
      t.createdAt,
    ),
    idxWorkspace: index("events_workspace_idx").on(t.workspaceId, t.createdAt),
  }),
);