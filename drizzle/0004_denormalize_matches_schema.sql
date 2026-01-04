ALTER TABLE "match_participants" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "match_participants" CASCADE;--> statement-breakpoint
DROP INDEX "matches_status_subject_idx";--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "subject_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "subject_icon" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "player1_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "player1_username" text NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "player1_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "player1_rating_before" integer DEFAULT 1200 NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "player1_rating_after" integer DEFAULT 1200 NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "player1_rating_change" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "player2_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "player2_username" text NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "player2_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "player2_rating_before" integer DEFAULT 1200 NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "player2_rating_after" integer DEFAULT 1200 NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "player2_rating_change" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_player1_id_users_id_fk" FOREIGN KEY ("player1_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_player2_id_users_id_fk" FOREIGN KEY ("player2_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "matches_player1_idx" ON "matches" USING btree ("player1_id");--> statement-breakpoint
CREATE INDEX "matches_player2_idx" ON "matches" USING btree ("player2_id");--> statement-breakpoint
CREATE INDEX "matches_subject_idx" ON "matches" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "matches_status_idx" ON "matches" USING btree ("status");