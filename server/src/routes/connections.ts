import { Router } from "express";
import crypto from "crypto";
import { prisma } from "../db";
import { logAction } from "../history";
import { serializeConnection } from "../serialize";
import type { Connection } from "../types";

const router = Router();

function newId(): string {
  return `conn_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}

// POST /api/connections — create a connection
router.post("/", async (req, res) => {
  const body = req.body as Partial<Connection>;
  if (!body.from || !body.to) {
    res.status(400).json({ error: "from and to are required" });
    return;
  }
  if (body.from === body.to) {
    res.status(400).json({ error: "Cannot connect a node to itself" });
    return;
  }
  const view = body.view || "master";

  // Prevent duplicates within the same view.
  const dup = await prisma.connection.findFirst({
    where: { fromNode: body.from, toNode: body.to, view },
  });
  if (dup) {
    res.status(409).json({ error: "Connection already exists" });
    return;
  }

  const created = await prisma.connection.create({
    data: {
      id: body.id || newId(),
      fromNode: body.from,
      toNode: body.to,
      view,
      lineStyle: body.lineStyle ?? null,
    },
  });

  const [from, to] = await Promise.all([
    prisma.node.findUnique({ where: { id: body.from } }),
    prisma.node.findUnique({ where: { id: body.to } }),
  ]);
  await logAction(
    `Connected "${from?.title ?? body.from}" → "${to?.title ?? body.to}"`
  );
  res.status(201).json(serializeConnection(created));
});

// PATCH /api/connections/:id — change per-connection line style
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const body = req.body as { lineStyle?: string | null };
  const existing = await prisma.connection.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Connection not found" });
    return;
  }
  const updated = await prisma.connection.update({
    where: { id },
    data: { lineStyle: body.lineStyle ?? null },
  });
  res.json(serializeConnection(updated));
});

// DELETE /api/connections/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.connection.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Connection not found" });
    return;
  }
  await prisma.connection.delete({ where: { id } });
  await logAction("Deleted a connection");
  res.json({ ok: true });
});

export default router;
