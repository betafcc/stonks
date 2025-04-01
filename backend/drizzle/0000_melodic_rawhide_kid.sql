CREATE TYPE "public"."direction" AS ENUM('up', 'down');--> statement-breakpoint
CREATE TABLE "bets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"symbol" varchar(64) NOT NULL,
	"direction" "direction" NOT NULL,
	"initial" numeric(12, 2) NOT NULL,
	"initial_time" timestamp NOT NULL,
	"final" numeric(12, 2),
	"final_time" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"google_id" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL,
	"name" varchar(256),
	"picture" varchar(512),
	"score" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;