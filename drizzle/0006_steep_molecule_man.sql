ALTER TABLE "orders" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "guest_email" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "public_token" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "orders_public_token_idx" ON "orders" USING btree ("public_token");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_identity" CHECK (("orders"."user_id" IS NOT NULL) <> ("orders"."guest_email" IS NOT NULL));