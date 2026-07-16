import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("renders the investment decision cockpit", async () => {
  const [page, layout, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /INVESTOR OS/);
  assert.match(layout, /个人价值投资决策台/);
  assert.match(page, /先不行动/);
  assert.match(page, /开单前/);
  assert.match(page, /每周日 21:00/);
  assert.match(css, /prefers-reduced-motion/);
  assert.doesNotMatch(page + layout, /codex-preview|react-loading-skeleton/);
});

test("uses durable storage for the decision ledger", async () => {
  const [page, hosting, schema, migration] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0000_wandering_abomination.sql", import.meta.url), "utf8"),
  ]);

  assert.match(hosting, /"d1": "DB"/);
  assert.match(schema, /trade_entries/);
  assert.match(migration, /CREATE TABLE `trade_entries`/);
  assert.match(page, /fetch\("\/api\/trades"\)/);
  assert.doesNotMatch(page, /localStorage|sessionStorage/);
});
