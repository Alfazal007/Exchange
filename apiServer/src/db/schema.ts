import {  pgTable, uuid, varchar } from "drizzle-orm/pg-core";

export const UserTable = pgTable("User", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", {length: 255}).notNull().unique(),
    username: varchar("username", {length: 40}).notNull().unique(),
    password: varchar("password", {length: 20}).notNull(),
    refreshToken: varchar("refreshToken", { length: 255 }).default(""),
    publicKey: varchar("refreshToken", {length: 255}).default("")
});
