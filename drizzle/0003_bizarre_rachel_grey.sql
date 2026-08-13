ALTER TABLE "order_items" DROP CONSTRAINT "order_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "product_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "product_name" varchar(200);--> statement-breakpoint
UPDATE "order_items" oi SET "product_name" = p."name" FROM "products" p WHERE oi."product_id" = p."id" AND oi."product_name" IS NULL;--> statement-breakpoint
UPDATE "order_items" SET "product_name" = 'Item' WHERE "product_name" IS NULL;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "product_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
