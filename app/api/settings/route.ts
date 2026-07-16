import { env } from "cloudflare:workers";

const defaultWeeklyNotes = "本周只在高确定性资产出现安全边际时行动；没有好价格，现金也是仓位。";

function getDatabase() {
  const database = (env as unknown as { DB?: D1Database }).DB;
  if (!database) throw new Error("D1 binding DB is unavailable");
  return database;
}

async function ensureSchema(database: D1Database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS investor_settings (
    id TEXT PRIMARY KEY NOT NULL,
    weekly_notes TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`).run();
}

export async function GET() {
  try {
    const database = getDatabase();
    await ensureSchema(database);
    const row = await database.prepare("SELECT weekly_notes AS weeklyNotes, updated_at AS updatedAt FROM investor_settings WHERE id = ?").bind("personal").first();
    return Response.json(row ?? { weeklyNotes: defaultWeeklyNotes });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { weeklyNotes?: unknown };
    if (typeof body.weeklyNotes !== "string" || !body.weeklyNotes.trim()) {
      return Response.json({ error: "weeklyNotes is required" }, { status: 400 });
    }
    const weeklyNotes = body.weeklyNotes.trim().slice(0, 4000);
    const updatedAt = new Date().toISOString();
    const database = getDatabase();
    await ensureSchema(database);
    await database
      .prepare("INSERT INTO investor_settings (id, weekly_notes, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET weekly_notes = excluded.weekly_notes, updated_at = excluded.updated_at")
      .bind("personal", weeklyNotes, updatedAt)
      .run();
    return Response.json({ weeklyNotes, updatedAt });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save settings" }, { status: 500 });
  }
}
