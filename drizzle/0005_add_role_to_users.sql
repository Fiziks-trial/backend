CREATE TABLE "problems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"type" text NOT NULL,
	"difficulty" text NOT NULL,
	"options" jsonb,
	"correct_answer" text NOT NULL,
	"tolerance" real,
	"explanation" text,
	"hints" jsonb DEFAULT '[]'::jsonb,
	"points" integer DEFAULT 100 NOT NULL,
	"time_limit" integer DEFAULT 180 NOT NULL,
	"subject_id" uuid NOT NULL,
	"topic" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD CONSTRAINT "problems_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;