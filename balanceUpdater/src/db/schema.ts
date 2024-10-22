import { relations } from "drizzle-orm";
import {  pgTable, uuid, varchar, timestamp, primaryKey, boolean, jsonb, numeric, integer } from "drizzle-orm/pg-core";

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
    userId: uuid("user_id").notNull().references(() => UserTable.id, {onDelete: "cascade"}).unique(),
});

export const UserTokenBalance = pgTable("UserBalance", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(()=> UserTable.id, { onDelete: "cascade"}).unique(),
    accountId: uuid("account_id").notNull().references(() => AccountTable.id, { onDelete: "cascade"}).unique(),
    solanaBalanceLamports: integer("solana_lamports").default(0).notNull(),
    tokenBalanceLamports: integer("token_balance").default(0).notNull()
});

export const LastTransactionUsed = pgTable("LastBlockHash", {
    lastTransactionUsed: varchar("Last_Used_Transaction", {length: 255}).notNull(),
});

// relations
export const UserTableRelations = relations(UserTable, ({ one }) => {
    return {
        account: one(AccountTable),
        balance: one(UserTokenBalance)
    }
});

export const AccountTableRelations = relations(AccountTable, ({one}) => {
    return {
        user: one(UserTable, {
            fields: [AccountTable.userId],
            references: [UserTable.id]
        }),
        balance: one(UserTokenBalance)
    }
});

export const UserBalanceTableRelations = relations(UserTokenBalance, ({ one }) => {
    return {
        account: one(AccountTable, {
            fields: [UserTokenBalance.accountId],
            references: [AccountTable.id]
        }),
        user: one(UserTable, {
            fields: [UserTokenBalance.userId],
            references: [UserTable.id]
        })
    }
});
