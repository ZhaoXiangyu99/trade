import { env } from "cloudflare:workers";

type TradeInput = {
  date?: unknown;
  ticker?: unknown;
  action?: unknown;
  size?: unknown;
  price?: unknown;
  thesis?: unknown;
  valuation?: unknown;
  risk?: unknown;
  invalidation?: unknown;
  gates?: unknown;
};

function getDatabase() {
  const database = (env as unknown as { DB?: D1Database }).DB;
  if (!database) throw new Error("D1 binding DB is unavailable");
  return database;
}

async function ensureSchema(database: D1Database) {
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS trade_entries (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      ticker TEXT NOT NULL,
      action TEXT NOT NULL,
      size TEXT NOT NULL,
      price TEXT NOT NULL DEFAULT '',
      thesis TEXT NOT NULL,
      valuation TEXT NOT NULL,
      risk TEXT NOT NULL,
      invalidation TEXT NOT NULL,
      gates TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    )`),
    database.prepare("CREATE INDEX IF NOT EXISTS trade_entries_date_idx ON trade_entries (date)"),
  ]);
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`);
  return value.trim().slice(0, 4000);
}

export async function GET() {
  try {
    const database = getDatabase();
    await ensureSchema(database);
    const { results } = await database
      .prepare("SELECT id, date, ticker, action, size, price, thesis, valuation, risk, invalidation, gates, created_at AS createdAt FROM trade_entries ORDER BY date DESC, created_at DESC LIMIT 100")
      .all();
    return Response.json({
      entries: results.map((row) => ({
        ...row,
        gates: JSON.parse(String(row.gates || "[]")),
      })),
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load trades" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as TradeInput;
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const entry = {
      id,
      date: requiredString(input.date, "date"),
      ticker: requiredString(input.ticker, "ticker").toUpperCase(),
      action: requiredString(input.action, "action"),
      size: requiredString(input.size, "size"),
      price: typeof input.price === "string" ? input.price.trim().slice(0, 120) : "",
      thesis: requiredString(input.thesis, "thesis"),
      valuation: requiredString(input.valuation, "valuation"),
      risk: requiredString(input.risk, "risk"),
      invalidation: requiredString(input.invalidation, "invalidation"),
      gates: Array.isArray(input.gates) ? input.gates.filter((gate): gate is string => typeof gate === "string").slice(0, 10) : [],
      createdAt,
    };
    const database = getDatabase();
    await ensureSchema(database);
    await database
      .prepare("INSERT INTO trade_entries (id, date, ticker, action, size, price, thesis, valuation, risk, invalidation, gates, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(entry.id, entry.date, entry.ticker, entry.action, entry.size, entry.price, entry.thesis, entry.valuation, entry.risk, entry.invalidation, JSON.stringify(entry.gates), entry.createdAt)
      .run();
    return Response.json(entry, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save trade" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });
    const database = getDatabase();
    await ensureSchema(database);
    await database.prepare("DELETE FROM trade_entries WHERE id = ?").bind(id).run();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to delete trade" }, { status: 500 });
  }
}
