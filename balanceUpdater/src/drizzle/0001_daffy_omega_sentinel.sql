ALTER TABLE "LastBlockHash" ADD COLUMN "Last_Used_Transaction" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "LastBlockHash" DROP COLUMN IF EXISTS "block_hash";--> statement-breakpoint
ALTER TABLE "LastBlockHash" DROP COLUMN IF EXISTS "slot_number";--> statement-breakpoint
ALTER TABLE "LastBlockHash" DROP COLUMN IF EXISTS "block_number";