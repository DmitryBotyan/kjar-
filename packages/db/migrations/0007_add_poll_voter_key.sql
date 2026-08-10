ALTER TABLE "poll_votes" ADD COLUMN IF NOT EXISTS "voter_key" varchar(64);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "poll_votes_voter_idx" ON "poll_votes" ("voter_key");--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_voter_poll_unique" UNIQUE ("poll_id", "voter_key");
