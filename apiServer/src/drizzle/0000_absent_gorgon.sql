CREATE TABLE IF NOT EXISTS "User" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(40) NOT NULL,
	"password" varchar(20) NOT NULL,
	"refreshToken" varchar(255) DEFAULT '',
	CONSTRAINT "User_email_unique" UNIQUE("email"),
	CONSTRAINT "User_username_unique" UNIQUE("username")
);
