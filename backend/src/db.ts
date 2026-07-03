import "dotenv/config"; // load backend/.env (Prisma used to do this for us)
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import fs from "fs";
import path from "path";

// Single shared connection pool (reused across dev hot-reloads).
const globalForDb = globalThis as unknown as { pool?: Pool };

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

// Some remote Postgres servers drop idle connections; don't let a background
// error crash the process.
pool.on("error", (err) => console.error("Idle pg client error:", err.message));

const TRANSIENT = /ECONNRESET|termin|Connection terminated|reach database|timeout|EPIPE/i;

/** Run a parameterised query, retrying transient connection failures. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await pool.query<T>(text, params as never[]);
      return res.rows;
    } catch (e) {
      const msg = String((e as Error)?.message ?? "");
      if (!TRANSIENT.test(msg) || attempt === 3) throw e;
      lastErr = e;
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
    }
  }
  throw lastErr;
}

/** First row or null. */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Run a function inside a transaction. */
export async function tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

/** Create tables/indexes/constraints if they don't exist (idempotent). */
export async function ensureSchema(): Promise<void> {
  const sql = fs.readFileSync(path.resolve(__dirname, "../db/schema.sql"), "utf8");
  await pool.query(sql);
}
