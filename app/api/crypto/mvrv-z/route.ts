const UPSTREAM_URL = "https://btcfunk.com/api/mvrv_zscore";

type UpstreamPayload = {
  z_score?: unknown;
  market_cap?: unknown;
  realized_cap?: unknown;
  labels?: unknown;
  values?: unknown;
  updated_at?: unknown;
};

function finiteNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET() {
  try {
    const response = await fetch(UPSTREAM_URL, {
      headers: { accept: "application/json" },
      next: { revalidate: 21_600 },
    });
    if (!response.ok) throw new Error(`upstream ${response.status}`);

    const payload = (await response.json()) as UpstreamPayload;
    const labels = Array.isArray(payload.labels) ? payload.labels : [];
    const values = Array.isArray(payload.values) ? payload.values : [];
    const history = labels
      .map((date, index) => ({ date: String(date), value: finiteNumber(values[index]) }))
      .filter((point): point is { date: string; value: number } => Boolean(point.date) && point.value !== null)
      .slice(-365);
    const zScore = finiteNumber(payload.z_score);
    const marketCap = finiteNumber(payload.market_cap);
    const realizedCap = finiteNumber(payload.realized_cap);

    if (zScore === null || marketCap === null || realizedCap === null || history.length < 2) {
      throw new Error("invalid upstream payload");
    }

    return Response.json(
      {
        status: "ready",
        zScore,
        marketCap,
        realizedCap,
        updatedAt: typeof payload.updated_at === "string" ? payload.updated_at : history.at(-1)?.date,
        history,
        source: {
          name: "BTCFunk",
          url: "https://btcfunk.com/",
          methodology: "Bitcoin blockchain via Google BigQuery; BTC/USD via Kraken",
        },
      },
      { headers: { "cache-control": "public, max-age=900, s-maxage=21600, stale-while-revalidate=86400" } },
    );
  } catch {
    return Response.json(
      { status: "unavailable", message: "MVRV Z-Score 数据暂时不可用，请稍后重试。" },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}
