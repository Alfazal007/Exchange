ALTER TABLE "Account" DROP CONSTRAINT "Account_user_id_public_key_pk";--> statement-breakpoint
ALTER TABLE "Account" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "Account" ADD COLUMN "is_verified" boolean DEFAULT false;