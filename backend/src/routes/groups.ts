import { Router } from "express";
import crypto from "crypto";
import { query, queryOne } from "../db";
import { logAction } from "../history";
import { serializeGroup } from "../serialize";

const router = Router();

function slugId(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${base || "grp"}_${crypto.randomBytes(3).toString("hex")}`;
}

// GET /api/groups
router.get("/", async (_req, res) => {
  const rows = await query(`SELECT * FROM groups ORDER BY "order" ASC`);
  res.json(rows.map(serializeGroup));
});

// POST /api/groups  { name, color }
router.post("/", async (req, res) => {
  const { name, color } = req.body as { name?: string; color?: string };
  if (!name || !name.trim()) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const max = await queryOne<{ max: number | null }>(
    `SELECT MAX("order") AS max FROM groups`
  );
  const rows = await query(
    `INSERT INTO groups ("id","name","color","order")
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [slugId(name), name.trim(), color || "#6c63ff", (max?.max ?? -1) + 1]
  );
  await logAction(`Added color group "${rows[0].name}"`);
  res.status(201).json(serializeGroup(rows[0]));
});

// PATCH /api/groups/:id  { name?, color? }
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const existing = await queryOne(`SELECT "id" FROM groups WHERE "id"=$1`, [id]);
  if (!existing) {
    res.status(404).json({ error: "Group not found" });
    return;
  }
  const { name, color } = req.body as { name?: string; color?: string };
  const sets: string[] = [];
  const params: unknown[] = [id];
  if (name !== undefined && name.trim()) {
    params.push(name.trim());
    sets.push(`"name"=$${params.length}`);
  }
  if (color !== undefined) {
    params.push(color);
    sets.push(`"color"=$${params.length}`);
  }
  if (!sets.length) {
    const cur = await query(`SELECT * FROM groups WHERE "id"=$1`, [id]);
    res.json(serializeGroup(cur[0]));
    return;
  }
  const rows = await query(
    `UPDATE groups SET ${sets.join(",")} WHERE "id"=$1 RETURNING *`,
    params
  );
  await logAction(`Updated color group "${rows[0].name}"`);
  res.json(serializeGroup(rows[0]));
});

// DELETE /api/groups/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const existing = await queryOne<{ name: string }>(
    `SELECT "name" FROM groups WHERE "id"=$1`,
    [id]
  );
  if (!existing) {
    res.status(404).json({ error: "Group not found" });
    return;
  }
  await query(`DELETE FROM groups WHERE "id"=$1`, [id]);
  await logAction(`Deleted color group "${existing.name}"`);
  res.json({ ok: true });
});

export default router;
