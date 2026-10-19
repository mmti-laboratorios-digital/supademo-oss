CREATE TABLE IF NOT EXISTS "app"."webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"provider" varchar(32) NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"processing_error" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "webhook_events_provider_event_idx" ON "app"."webhook_events" USING btree ("provider","event_id");