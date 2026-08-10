CREATE TABLE IF NOT EXISTS "contact_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"contact" varchar(200) NOT NULL,
	"subject" varchar(300) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(24) DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_requests_status_idx" ON "contact_requests" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_requests_created_at_idx" ON "contact_requests" ("created_at");
