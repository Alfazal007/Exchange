CREATE TABLE IF NOT EXISTS "LastBlockHash" (
	"Last_Used_Transaction" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "UserBalance" ADD COLUMN "solana_lamports" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "UserBalance" ADD COLUMN "token_balance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "UserBalance" DROP COLUMN IF EXISTS "balance";