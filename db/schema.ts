import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tradeEntries = sqliteTable(
  "trade_entries",
  {
    id: text("id").primaryKey(),
    date: text("date").notNull(),
    ticker: text("ticker").notNull(),
    action: text("action").notNull(),
    size: text("size").notNull(),
    price: text("price").notNull().default(""),
    thesis: text("thesis").notNull(),
    valuation: text("valuation").notNull(),
    risk: text("risk").notNull(),
    invalidation: text("invalidation").notNull(),
    gates: text("gates").notNull().default("[]"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("trade_entries_date_idx").on(table.date)],
);

export const investorSettings = sqliteTable("investor_settings", {
  id: text("id").primaryKey(),
  weeklyNotes: text("weekly_notes").notNull(),
  updatedAt: text("updated_at").notNull(),
});
