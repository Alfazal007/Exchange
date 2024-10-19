CREATE TABLE IF NOT EXISTS "Account" (
	"public_key" varchar(255) NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "Account_user_id_public_key_pk" PRIMARY KEY("user_id","public_key"),
	CONSTRAINT "Account_public_key_unique" UNIQUE("public_key")
);
--> statement-breakpoint
ALTER TABLE "User" RENAME COLUMN "refreshToken" TO "refresh_token";--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Account" ADD CONSTRAINT "Account_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
