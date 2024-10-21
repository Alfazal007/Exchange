CREATE TABLE IF NOT EXISTS "UserBalance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"balance" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "UserBalance_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "UserBalance_account_id_unique" UNIQUE("account_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserBalance" ADD CONSTRAINT "UserBalance_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserBalance" ADD CONSTRAINT "UserBalance_account_id_Account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."Account"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "Account" ADD CONSTRAINT "Account_user_id_unique" UNIQUE("user_id");