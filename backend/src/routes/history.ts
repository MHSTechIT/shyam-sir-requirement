import { Router } from "express";
import { query, queryOne } from "../db";
import { serializeHistory } from "../serialize";

const router = Router();

// GET /api/history?limit=200&before=<iso-timestamp>&nodeId=<id>
// Newest-first. `before` pages through the full, permanently-retained history.
// `nodeId` filters to actions on one node (via details->>'nodeId').
router.get("/", async (req, res) => {
  const limit = Math.min(parseInt(String(req.query.limit)) || 200, 1000);
  const before = req.query.before ? new Date(String(req.query.before)) : null;
  const nodeId = req.query.nodeId ? String(req.query.nodeId) : null;

  const where: string[] = [];
  const params: unknown[] = [];
  if (before) {
    params.push(before.toISOString());
    where.push(`"ts" < $${params.length}`);
  }
  if (nodeId) {
    params.push(nodeId);
    where.push(`"details"->>'nodeId' = $${params.length}`);
    // Per-node activity focuses on text/field changes — exclude position-move
    // entries (old rows may still be tagged to a node). The global History view
    // (no nodeId filter) still shows moves.
    where.push(`"action" NOT LIKE 'Moved %'`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  params.push(limit);
  const entries = await query(
    `SELECT * FROM history ${whereSql} ORDER BY "ts" DESC LIMIT $${params.length}`,
    params
  );
  const totalRow = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM history ${whereSql}`,
    params.slice(0, params.length - 1)
  );

  res.json({
    entries: entries.map(serializeHistory),
    total: Number(totalRow?.count ?? 0),
  });
});

// POST /api/history — append one or many entries. Body: {action,nodeId?} or array.
router.post("/", async (req, res) => {
  const raw = Array.isArray(req.body) ? req.body : [req.body];
  const items = raw.filter(
    (i) => i && typeof i.action === "string" && i.action
  ) as Array<{ action: string; nodeId?: string }>;
  if (!items.length) {
    res.json({ ok: true, inserted: 0 });
    return;
  }

  const values: string[] = [];
  const params: unknown[] = [];
  for (const it of items) {
    const details = it.nodeId ? JSON.stringify({ nodeId: it.nodeId }) : null;
    params.push(it.action, details);
    values.push(`($${params.length - 1}, $${params.length}::jsonb)`);
  }
  await query(
    `INSERT INTO history ("action","details") VALUES ${values.join(",")}`,
    params
  );
  res.json({ ok: true, inserted: items.length });
});

export default router;
