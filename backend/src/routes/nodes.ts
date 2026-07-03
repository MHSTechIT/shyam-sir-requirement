import { Router } from "express";
import crypto from "crypto";
import { query, queryOne, tx } from "../db";
import { logAction } from "../history";
import { serializeNode, DEFAULT_CLARITY } from "../serialize";
import type { OrgNode } from "../types";

const router = Router();

function newId(prefix = "nd"): string {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}

const jsonb = (v: unknown) => (v === undefined || v === null ? null : JSON.stringify(v));

// POST /api/nodes — create a node
router.post("/", async (req, res) => {
  const b = req.body as Partial<OrgNode>;
  const id = b.id || newId();
  const rows = await query(
    `INSERT INTO nodes
       ("id","badge","title","sub","color","project","status","x","y","view","collapsed","hc","size","clarity","updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14::jsonb,CURRENT_TIMESTAMP)
     RETURNING *`,
    [
      id,
      b.badge ?? "ROLE",
      b.title ?? "New Position",
      b.sub ?? "",
      b.color ?? "#6c63ff",
      b.project ?? "shared",
      b.status ?? "active",
      b.x ?? 100,
      b.y ?? 100,
      b.view ?? "master",
      b.collapsed ?? false,
      jsonb(b.hc),
      jsonb(b.size),
      jsonb(b.clarity ?? DEFAULT_CLARITY),
    ]
  );
  await logAction(`Added new node "${rows[0].title}"`, { nodeId: id });
  res.status(201).json(serializeNode(rows[0]));
});

// PATCH /api/nodes — batch position update: [{id, x, y}, ...]
router.patch("/", async (req, res) => {
  const updates = req.body as Array<{ id: string; x: number; y: number }>;
  if (!Array.isArray(updates)) {
    res.status(400).json({ error: "Expected an array of {id,x,y}" });
    return;
  }
  await tx(async (c) => {
    for (const u of updates) {
      await c.query(
        `UPDATE nodes SET "x"=$2,"y"=$3,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=$1`,
        [u.id, u.x, u.y]
      );
    }
  });
  await logAction(`Moved ${updates.length} node${updates.length === 1 ? "" : "s"}`);
  res.json({ ok: true });
});

// PATCH /api/nodes/:id — update a single node
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const existing = await queryOne(`SELECT * FROM nodes WHERE "id"=$1`, [id]);
  if (!existing) {
    res.status(404).json({ error: "Node not found" });
    return;
  }
  const b = req.body as Partial<OrgNode>;
  const sets: string[] = [];
  const params: unknown[] = [id];
  const scalar: (keyof OrgNode)[] = [
    "badge", "title", "sub", "color", "project", "status", "x", "y", "view", "collapsed",
  ];
  for (const f of scalar) {
    if (b[f] !== undefined) {
      params.push(b[f]);
      sets.push(`"${f}"=$${params.length}`);
    }
  }
  for (const f of ["hc", "size", "clarity"] as const) {
    if (b[f] !== undefined) {
      params.push(jsonb(b[f]));
      sets.push(`"${f}"=$${params.length}::jsonb`);
    }
  }
  sets.push(`"updatedAt"=CURRENT_TIMESTAMP`);
  const rows = await query(
    `UPDATE nodes SET ${sets.join(",")} WHERE "id"=$1 RETURNING *`,
    params
  );
  if (!req.query.silent) await logAction(`Updated "${rows[0].title}"`, { nodeId: id });
  res.json(serializeNode(rows[0]));
});

// DELETE /api/nodes/:id — delete a node (cascades connections + file)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const existing = await queryOne<{ title: string }>(
    `SELECT "title" FROM nodes WHERE "id"=$1`,
    [id]
  );
  if (!existing) {
    res.status(404).json({ error: "Node not found" });
    return;
  }
  await query(`DELETE FROM nodes WHERE "id"=$1`, [id]);
  await logAction(`Deleted node "${existing.title}"`, { nodeId: id });
  res.json({ ok: true });
});

export default router;
