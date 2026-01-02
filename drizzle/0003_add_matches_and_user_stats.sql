CREATE TABLE "match_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"correct_answers" integer DEFAULT 0 NOT NULL,
	"rating_before" integer DEFAULT 1200 NOT NULL,
	"rating_after" integer DEFAULT 1200 NOT NULL,
	"rating_change" integer DEFAULT 0 NOT NULL,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"winner_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_subject_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"elo" integer DEFAULT 1200 NOT NULL,
	"matches" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"draws" integer DEFAULT 0 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"max_streak" integer DEFAULT 0 NOT NULL,
	"last_played_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "coins" TO "xp";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "total_matches" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "wins" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "losses" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "draws" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subject_stats" ADD CONSTRAINT "user_subject_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subject_stats" ADD CONSTRAINT "user_subject_stats_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "match_participants_user_idx" ON "match_participants" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "match_participants_match_user_idx" ON "match_participants" USING btree ("match_id","user_id");--> statement-breakpoint
CREATE INDEX "matches_status_subject_idx" ON "matches" USING btree ("status","subject_id");--> statement-breakpoint
CREATE INDEX "matches_created_at_idx" ON "matches" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_subject_stats_user_subject_idx" ON "user_subject_stats" USING btree ("user_id","subject_id");--> statement-breakpoint
CREATE INDEX "user_subject_stats_subject_elo_idx" ON "user_subject_stats" USING btree ("subject_id","elo");--> statement-breakpoint
CREATE INDEX "user_subject_stats_user_idx" ON "user_subject_stats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_wins_idx" ON "users" USING btree ("wins");