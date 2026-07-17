CREATE TYPE "public"."adoption_application_status" AS ENUM('pending', 'approved', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."adoption_listing_status" AS ENUM('available', 'on_hold', 'adopted', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."email_queue_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."health_record_type" AS ENUM('vet_visit', 'vaccination', 'medication', 'surgery', 'lab_result', 'dental', 'grooming', 'other');--> statement-breakpoint
CREATE TYPE "public"."medication_status" AS ENUM('active', 'completed', 'discontinued');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."pet_wellness_signal" AS ENUM('healthy', 'watch', 'concern');--> statement-breakpoint
CREATE TYPE "public"."product_category" AS ENUM('food', 'toys', 'health', 'accessories', 'grooming', 'other');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('male', 'female', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."species" AS ENUM('dog', 'cat', 'horse', 'bird', 'rabbit', 'guinea_pig', 'hamster', 'reptile', 'fish', 'other');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('pet_owner', 'veterinarian', 'pet_sitter', 'admin');--> statement-breakpoint
CREATE TYPE "public"."vaccination_status" AS ENUM('up_to_date', 'due_soon', 'overdue', 'not_applicable');--> statement-breakpoint
CREATE TABLE "accounts" (
	"userId" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "adoption_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"applicant_id" uuid NOT NULL,
	"status" "adoption_application_status" DEFAULT 'pending' NOT NULL,
	"message" text,
	"experience" text,
	"housing_type" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "adoption_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"status" "adoption_listing_status" DEFAULT 'available' NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"fee_cents" integer,
	"location" varchar(150),
	"requires_experience" boolean DEFAULT false NOT NULL,
	"good_with_kids" boolean,
	"good_with_dogs" boolean,
	"good_with_cats" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"pet_id" uuid NOT NULL,
	"professional_id" uuid NOT NULL,
	"professional_role" "user_role" NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"notes" text,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"template_key" varchar(100) NOT NULL,
	"send_at" timestamp NOT NULL,
	"sent_at" timestamp,
	"status" "email_queue_status" DEFAULT 'pending' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"date" varchar(10) NOT NULL,
	"weight_grams" integer,
	"temperature_centidegrees" integer,
	"heart_rate_bpm" integer,
	"energy" integer,
	"mood" integer,
	"anxiety" integer,
	"socialization" integer,
	"notes" text,
	"logged_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"type" "health_record_type" NOT NULL,
	"title" text NOT NULL,
	"date" varchar(10) NOT NULL,
	"vet_name" varchar(150),
	"clinic" varchar(150),
	"notes" text,
	"attachment_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"dosage" varchar(100),
	"frequency" varchar(100),
	"start_date" varchar(10) NOT NULL,
	"end_date" varchar(10),
	"prescribed_by" varchar(150),
	"status" "medication_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"price_cents" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"total_cents" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "owner_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"phone" varchar(50),
	"city" varchar(100),
	"country" varchar(2),
	"timezone" varchar(60),
	"bio" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "owner_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "pet_signal_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"signal" "pet_wellness_signal" NOT NULL,
	"reason" text,
	"reason_data" jsonb,
	"source" varchar(20) DEFAULT 'user_action' NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"species" "species" NOT NULL,
	"breed" varchar(100),
	"birth_date" varchar(10),
	"sex" "sex" DEFAULT 'unknown' NOT NULL,
	"weight_grams" integer,
	"bio" text,
	"avatar_url" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"handle" varchar(50),
	"last_known_signal" varchar(20),
	"signal_alert_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pets_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"price_cents" integer NOT NULL,
	"image_url" text,
	"category" "product_category" DEFAULT 'other' NOT NULL,
	"stock" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"seller_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"professional_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "seller_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" varchar(200),
	"bio" text,
	"city" varchar(100),
	"country" varchar(2),
	"phone" varchar(50),
	"website" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "seller_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sitter_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"bio" text,
	"services" text,
	"price_per_day" integer,
	"city" varchar(100),
	"country" varchar(2),
	"phone" varchar(50),
	"is_accepting_clients" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sitter_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"password" text,
	"role" "user_role" DEFAULT 'pet_owner' NOT NULL,
	"verified_at" timestamp,
	"locale" varchar(5),
	"digest_opt_out" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vaccinations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"administered_date" varchar(10) NOT NULL,
	"next_due_date" varchar(10),
	"status" "vaccination_status" DEFAULT 'up_to_date' NOT NULL,
	"batch_number" varchar(100),
	"vet_name" varchar(150),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vet_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"bio" text,
	"specialty" varchar(200),
	"clinic_name" varchar(200),
	"clinic_address" text,
	"city" varchar(100),
	"country" varchar(2),
	"phone" varchar(50),
	"is_accepting_clients" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vet_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adoption_applications" ADD CONSTRAINT "adoption_applications_listing_id_adoption_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."adoption_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adoption_applications" ADD CONSTRAINT "adoption_applications_applicant_id_users_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adoption_listings" ADD CONSTRAINT "adoption_listings_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adoption_listings" ADD CONSTRAINT "adoption_listings_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_metrics" ADD CONSTRAINT "health_metrics_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_metrics" ADD CONSTRAINT "health_metrics_logged_by_users_id_fk" FOREIGN KEY ("logged_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medications" ADD CONSTRAINT "medications_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_profiles" ADD CONSTRAINT "owner_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pet_signal_history" ADD CONSTRAINT "pet_signal_history_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sitter_profiles" ADD CONSTRAINT "sitter_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vet_profiles" ADD CONSTRAINT "vet_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "adoption_applications_listing_id_idx" ON "adoption_applications" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "adoption_applications_applicant_id_idx" ON "adoption_applications" USING btree ("applicant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "adoption_applications_unique_applicant_idx" ON "adoption_applications" USING btree ("listing_id","applicant_id");--> statement-breakpoint
CREATE INDEX "adoption_listings_owner_id_idx" ON "adoption_listings" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "adoption_listings_status_idx" ON "adoption_listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bookings_owner_id_idx" ON "bookings" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "bookings_professional_id_idx" ON "bookings" USING btree ("professional_id");--> statement-breakpoint
CREATE INDEX "email_queue_status_send_at_idx" ON "email_queue" USING btree ("status","send_at");--> statement-breakpoint
CREATE UNIQUE INDEX "health_metrics_pet_date_idx" ON "health_metrics" USING btree ("pet_id","date");--> statement-breakpoint
CREATE INDEX "health_records_pet_id_idx" ON "health_records" USING btree ("pet_id");--> statement-breakpoint
CREATE INDEX "medications_pet_id_idx" ON "medications" USING btree ("pet_id");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pet_signal_history_pet_id_idx" ON "pet_signal_history" USING btree ("pet_id");--> statement-breakpoint
CREATE INDEX "pets_owner_id_idx" ON "pets" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "products_seller_id_idx" ON "products" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "reviews_professional_id_idx" ON "reviews" USING btree ("professional_id");--> statement-breakpoint
CREATE INDEX "vaccinations_pet_id_idx" ON "vaccinations" USING btree ("pet_id");