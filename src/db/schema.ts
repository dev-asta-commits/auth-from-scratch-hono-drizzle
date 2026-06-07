import { boolean, integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    username: varchar().notNull().unique(),
    email: varchar().notNull().unique(),
    password: varchar().notNull(),
    isVerified: boolean("is_verified").default(false).notNull(),
});
