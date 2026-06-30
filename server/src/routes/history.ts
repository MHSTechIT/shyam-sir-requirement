import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { serializeHistory } from "../serialize";

const router = Router();

// GET /api/history?limit=200&before=<iso-timestamp>&nodeId=<id>
// Returns newest-first. `before` enables "load more" paging through the full,
// permanently-retained history. `nodeId` filters to actions on one node
// (matched via the JSON `details.nodeId` field).
router.get("/", async (req, res) => {
  const limit = Math.min(parseInt(String(req.query.limit)) || 200, 1000);
  const before = req.query.before ? new Date(String(req.query.before)) : null;
  const nodeId = req.query.nodeId ? String(req.query.nodeId) : null;

  const where: Prisma.HistoryWhereInput = {};
  if (before) where.ts = { lt: before };
  if (nodeId) where.details = { path: ["nodeId"], equals: nodeId };

  const [entries, total] = await Promise.all([
    prisma.history.findMany({ where, orderBy: { ts: "desc" }, take: limit }),
    prisma.history.count({ where }),
  ]);

  res.json({ entries: entries.map(serializeHistory), total });
});

// POST /api/history — append one or many history entries.
// Body: { action, nodeId? } or an array of them. Used by the client to commit
// the buffered per-node actions when the user clicks Save.
router.post("/", async (req, res) => {
  const raw = Array.isArray(req.body) ? req.body : [req.body];
  const items = raw.filter((i) => i && typeof i.action === "string" && i.action);
  if (!items.length) {
    res.json({ ok: true, inserted: 0 });
    return;
  }
  await prisma.history.createMany({
    data: items.map((i) => ({
      action: i.action,
      details: (i.nodeId ? { nodeId: i.nodeId } : Prisma.JsonNull) as Prisma.InputJsonValue,
    })),
  });
  res.json({ ok: true, inserted: items.length });
});

export default router;
