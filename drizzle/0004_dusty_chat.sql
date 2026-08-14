ALTER TABLE "orders" ADD COLUMN "shipping_name" varchar(200);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_line1" varchar(200);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_postal_code" varchar(20);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_city" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_country" varchar(2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_phone" varchar(50);