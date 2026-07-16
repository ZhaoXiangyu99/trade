import { env } from "cloudflare:workers";

type PositionInput = {
  ticker?: unknown;
  name?: unknown;
  assetClass?: unknown;
  quantity?: unknown;
  averageCost?: unknown;
  currentPrice?: unknown;
  targetWeight?: unknown;
};

function getDatabase() {
  const database = (env as unknown as { DB?: D1Database }).DB;
  if (!database) throw new Error("D1 binding DB is unavailable");
  return database;
}

async function ensureSchema(database: D1Database) {
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS portfolio_positions (
      ticker TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      asset_class TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      average_cost REAL NOT NULL DEFAULT 0,
      current_price REAL NOT NULL DEFAULT 0,
      target_weight REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    )`),
    database.prepare("CREATE INDEX IF NOT EXISTS portfolio_positions_asset_class_idx ON portfolio_positions (asset_class)"),
    database.prepare(`CREATE TABLE IF NOT EXISTS portfolio_config (
      id TEXT PRIMARY KEY NOT NULL,
      cash_balance REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    )`),
  ]);
}

function requiredText(value: unknown, field: string, maxLength = 160) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`);
  return value.trim().slice(0, maxLength);
}

function nonNegativeNumber(value: unknown, field: string, maximum = Number.MAX_SAFE_INTEGER) {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : 0;
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > maximum) throw new Error(`${field} must be a non-negative number`);
  return parsed;
}

export async function GET() {
  try {
    const database = getDatabase();
    await ensureSchema(database);
    const [positionsResult, config] = await Promise.all([
      database.prepare("SELECT ticker, name, asset_class AS assetClass, quantity, average_cost AS averageCost, current_price AS currentPrice, target_weight AS targetWeight, updated_at AS updatedAt FROM portfolio_positions ORDER BY asset_class, ticker").all(),
      database.prepare("SELECT cash_balance AS cashBalance, updated_at AS updatedAt FROM portfolio_config WHERE id = ?").bind("personal").first(),
    ]);
    return Response.json({
      cashBalance: String(config?.cashBalance ?? ""),
      positions: positionsResult.results.map((row) => ({
        ...row,
        quantity: String(row.quantity ?? ""),
        averageCost: String(row.averageCost ?? ""),
        currentPrice: String(row.currentPrice ?? ""),
        targetWeight: String(row.targetWeight ?? ""),
      })),
      updatedAt: config?.updatedAt,
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load portfolio" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const input = (await request.json()) as { cashBalance?: unknown; positions?: unknown };
    if (!Array.isArray(input.positions) || input.positions.length > 100) {
      return Response.json({ error: "positions must be an array with at most 100 items" }, { status: 400 });
    }

    const updatedAt = new Date().toISOString();
    const positions = input.positions.map((raw) => {
      const position = raw as PositionInput;
      const ticker = requiredText(position.ticker, "ticker", 24).toUpperCase();
      const assetClass = position.assetClass === "btc" ? "btc" : position.assetClass === "stock" ? "stock" : null;
      if (!assetClass) throw new Error("assetClass must be stock or btc");
      return {
        ticker,
        name: requiredText(position.name, "name"),
        assetClass,
        quantity: nonNegativeNumber(position.quantity, "quantity"),
        averageCost: nonNegativeNumber(position.averageCost, "averageCost"),
        currentPrice: nonNegativeNumber(position.currentPrice, "currentPrice"),
        targetWeight: nonNegativeNumber(position.targetWeight, "targetWeight", 100),
      };
    });
    if (new Set(positions.map((position) => position.ticker)).size !== positions.length) {
      return Response.json({ error: "duplicate tickers are not allowed" }, { status: 400 });
    }

    const cashBalance = nonNegativeNumber(input.cashBalance, "cashBalance");
    const database = getDatabase();
    await ensureSchema(database);
    await database.batch([
      database.prepare("DELETE FROM portfolio_positions"),
      ...positions.map((position) => database.prepare("INSERT INTO portfolio_positions (ticker, name, asset_class, quantity, average_cost, current_price, target_weight, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(position.ticker, position.name, position.assetClass, position.quantity, position.averageCost, position.currentPrice, position.targetWeight, updatedAt)),
      database.prepare("INSERT INTO portfolio_config (id, cash_balance, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET cash_balance = excluded.cash_balance, updated_at = excluded.updated_at").bind("personal", cashBalance, updatedAt),
    ]);

    return Response.json({
      cashBalance: String(cashBalance),
      positions: positions.map((position) => ({
        ...position,
        quantity: String(position.quantity),
        averageCost: String(position.averageCost),
        currentPrice: String(position.currentPrice),
        targetWeight: String(position.targetWeight),
      })),
      updatedAt,
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save portfolio" }, { status: 400 });
  }
}
