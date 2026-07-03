import { Router } from "express";
import crypto from "crypto";
import { query, queryOne } from "../db";
import { logAction } from "../history";
import { serializeConnection } from "../serialize";
import type { Connection } from "../types";

const router = Router();

function newId(): string {
  return `conn_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}

// POST /api/connections — create a connection
router.post("/", async (req, res) => {
  const b = req.body as Partial<Connection>;
  if (!b.from || !b.to) {
    res.status(400).json({ error: "from and to are required" });
    return;
  }
  if (b.from === b.to) {
    res.status(400).json({ error: "Cannot connect a node to itself" });
    return;
  }
  const view = b.view || "master";

  const dup = await queryOne(
    `SELECT "id" FROM connections WHERE "fromNode"=$1 AND "toNode"=$2 AND "view"=$3`,
    [b.from, b.to, view]
  );
  if (dup) {
    res.status(409).json({ error: "Connection already exists" });
    return;
  }

  const rows = await query(
    `INSERT INTO connections ("id","fromNode","toNode","view","lineStyle")
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [b.id || newId(), b.from, b.to, view, b.lineStyle ?? null]
  );

  const [from, to] = await Promise.all([
    queryOne<{ title: string }>(`SELECT "title" FROM nodes WHERE "id"=$1`, [b.from]),
    queryOne<{ title: string }>(`SELECT "title" FROM nodes WHERE "id"=$1`, [b.to]),
  ]);
  await logAction(`Connected "${from?.title ?? b.from}" → "${to?.title ?? b.to}"`);
  res.status(201).json(serializeConnection(rows[0]));
});

// PATCH /api/connections/:id — change per-connection line style
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const existing = await queryOne(`SELECT "id" FROM connections WHERE "id"=$1`, [id]);
  if (!existing) {
    res.status(404).json({ error: "Connection not found" });
    return;
  }
  const b = req.body as { lineStyle?: string | null };
  const rows = await query(
    `UPDATE connections SET "lineStyle"=$2 WHERE "id"=$1 RETURNING *`,
    [id, b.lineStyle ?? null]
  );
  res.json(serializeConnection(rows[0]));
});

// DELETE /api/connections/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const existing = await queryOne(`SELECT "id" FROM connections WHERE "id"=$1`, [id]);
  if (!existing) {
    res.status(404).json({ error: "Connection not found" });
    return;
  }
  await query(`DELETE FROM connections WHERE "id"=$1`, [id]);
  await logAction("Deleted a connection");
  res.json({ ok: true });
});

export default router;
