CREATE TABLE IF NOT EXISTS "dictionaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_key" varchar(64) NOT NULL,
	"code" varchar(100) NOT NULL,
	"label" varchar(200) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dictionaries_group_code_unique" UNIQUE("group_key","code")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dictionaries_group_idx" ON "dictionaries" ("group_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dictionaries_sort_idx" ON "dictionaries" ("group_key","sort_order");--> statement-breakpoint
ALTER TABLE "contact_requests" ADD COLUMN IF NOT EXISTS "request_type" varchar(100);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_requests_type_idx" ON "contact_requests" ("request_type");
