ALTER TABLE "UserBalance" ALTER COLUMN "solana_lamports" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "UserBalance" ALTER COLUMN "solana_lamports" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "UserBalance" ALTER COLUMN "token_balance" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "UserBalance" ALTER COLUMN "token_balance" SET DEFAULT '0';