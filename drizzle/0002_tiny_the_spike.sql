ALTER TYPE "public"."user_role" ADD VALUE 'groomer' BEFORE 'admin';--> statement-breakpoint
CREATE TABLE "groomer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"salon_name" varchar(200),
	"bio" text,
	"services" text,
	"price_from" integer,
	"city" varchar(100),
	"country" varchar(2),
	"phone" varchar(50),
	"is_accepting_clients" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "groomer_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "groomer_profiles" ADD CONSTRAINT "groomer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;