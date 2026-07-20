import { index, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

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

export const portfolioPositions = sqliteTable(
  "portfolio_positions",
  {
    ticker: text("ticker").primaryKey(),
    name: text("name").notNull(),
    assetClass: text("asset_class").notNull(),
    quantity: real("quantity").notNull().default(0),
    averageCost: real("average_cost").notNull().default(0),
    currentPrice: real("current_price").notNull().default(0),
    targetWeight: real("target_weight").notNull().default(0),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("portfolio_positions_asset_class_idx").on(table.assetClass)],
);

export const portfolioConfig = sqliteTable("portfolio_config", {
  id: text("id").primaryKey(),
  cashBalance: real("cash_balance").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});
