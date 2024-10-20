import { relations } from "drizzle-orm";
import {  pgTable, uuid, varchar, timestamp, primaryKey, boolean } from "drizzle-orm/pg-core";

export const UserTable = pgTable("User", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", {length: 255}).notNull().unique(),
    username: varchar("username", {length: 40}).notNull().unique(),
    password: varchar("password", {length: 255}).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const AccountTable = pgTable("Account", {
    id: uuid("id").defaultRandom().primaryKey(),
    publicKey: varchar("public_key", {length: 255}).unique().notNull(),
    isVerified: boolean("is_verified").default(false),
    userId: uuid("user_id").notNull().references(() => UserTable.id, {onDelete: "cascade"}),
});

// relationsPUBLICKEYNOTVERIFIED
export const UserTableRelations = relations(UserTable, ({ many }) => {
    return {
        accounts: many(AccountTable)
    }
});

export const AccountTableRelations = relations(AccountTable, ({one}) => {
    return {
        user: one(UserTable, {
            fields: [AccountTable.userId],
            references: [UserTable.id]
        })
    }
});

