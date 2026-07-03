import { query } from "./db";

// Append a permanent history entry.
export async function logAction(action: string, details?: unknown): Promise<void> {
  await query(
    `INSERT INTO history ("action", "details") VALUES ($1, $2::jsonb)`,
    [action, details === undefined ? null : JSON.stringify(details)]
  );
}
