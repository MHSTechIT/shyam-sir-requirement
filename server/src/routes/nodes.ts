import { Router } from "express";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { logAction } from "../history";
import { serializeNode, DEFAULT_CLARITY } from "../serialize";
import type { OrgNode } from "../types";

const router = Router();

function newId(prefix = "nd"): string {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}

function buildData(body: Partial<OrgNode>) {
  const data: Record<string, unknown> = {};
  const fields: (keyof OrgNode)[] = [
    "badge",
    "title",
    "sub",
    "color",
    "project",
    "status",
    "x",
    "y",
    "view",
    "collapsed",
  ];
  for (const f of fields) if (body[f] !== undefined) data[f] = body[f];
  if (body.hc !== undefined) data.hc = body.hc ?? null;
  if (body.size !== undefined) data.size = body.size ?? null;
  if (body.clarity !== undefined) data.clarity = body.clarity;
  return data;
}

// POST /api/nodes — create a node
router.post("/", async (req, res) => {
  const body = req.body as Partial<OrgNode>;
  const id = body.id || newId();
  const created = await prisma.node.create({
    data: {
      id,
      badge: body.badge ?? "ROLE",
      title: body.title ?? "New Position",
      sub: body.sub ?? "",
      color: body.color ?? "#6c63ff",
      project: body.project ?? "shared",
      status: body.status ?? "active",
      x: body.x ?? 100,
      y: body.y ?? 100,
      view: body.view ?? "master",
      collapsed: body.collapsed ?? false,
      hc: (body.hc ?? undefined) as Prisma.InputJsonValue | undefined,
      size: (body.size ?? undefined) as Prisma.InputJsonValue | undefined,
      clarity: (body.clarity ?? DEFAULT_CLARITY) as unknown as Prisma.InputJsonValue,
    },
  });
  await logAction(`Added new node "${created.title}"`, { nodeId: id });
  res.status(201).json(serializeNode(created));
});

// PATCH /api/nodes — batch position update: [{id, x, y}, ...]
router.patch("/", async (req, res) => {
  const updates = req.body as Array<{ id: string; x: number; y: number }>;
  if (!Array.isArray(updates)) {
    res.status(400).json({ error: "Expected an array of {id,x,y}" });
    return;
  }
  await prisma.$transaction(
    updates.map((u) =>
      prisma.node.update({ where: { id: u.id }, data: { x: u.x, y: u.y } })
    )
  );
  await logAction(`Moved ${updates.length} node${updates.length === 1 ? "" : "s"}`);
  res.json({ ok: true });
});

// PATCH /api/nodes/:id — update a single node
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.node.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Node not found" });
    return;
  }
  const data = buildData(req.body as Partial<OrgNode>);
  const updated = await prisma.node.update({ where: { id }, data });
  if (!req.query.silent) {
    await logAction(`Updated "${updated.title}"`, { nodeId: id });
  }
  res.json(serializeNode(updated));
});

// DELETE /api/nodes/:id — delete a node (cascades connections + file)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.node.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Node not found" });
    return;
  }
  await prisma.node.delete({ where: { id } });
  await logAction(`Deleted node "${existing.title}"`, { nodeId: id });
  res.json({ ok: true });
});

export default router;
