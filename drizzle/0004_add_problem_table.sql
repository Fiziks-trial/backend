CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."subject" AS ENUM('physics', 'chemistry', 'biology', 'math');--> statement-breakpoint
CREATE TABLE "problems" (
	"id" text PRIMARY KEY NOT NULL,
	"subject" "subject" NOT NULL,
	"topic" text NOT NULL,
	"difficulty" "difficulty" NOT NULL,
	"question" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_index" integer NOT NULL,
	"explanation" text,
	"hint" text,
	"animation_type" text,
	"animation_config" jsonb,
	"time_limit" integer DEFAULT 15,
	"points" integer DEFAULT 10,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
