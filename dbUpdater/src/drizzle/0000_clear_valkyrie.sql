CREATE TABLE IF NOT EXISTS "Account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_key" varchar(255) NOT NULL,
	"is_verified" boolean DEFAULT false,
	"user_id" uuid NOT NULL,
	CONSTRAINT "Account_public_key_unique" UNIQUE("public_key"),
	CONSTRAINT "Account_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "LastBlockHash" (
	"Last_Used_Transaction" varchar(255) NOT NULL,
	"Last_Used_Transaction_Token" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "User" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(40) NOT NULL,
	"password" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email"),
	CONSTRAINT "User_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserBalance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"solana_lamports" varchar DEFAULT '0' NOT NULL,
	"token_balance" varchar DEFAULT '0' NOT NULL,
	CONSTRAINT "UserBalance_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "UserBalance_account_id_unique" UNIQUE("account_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Account" ADD CONSTRAINT "Account_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
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
