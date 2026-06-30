import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { logAction } from "../history";
import {
  serializeNode,
  serializeConnection,
  serializeFile,
} from "../serialize";
import type { OrgNode, Connection } from "../types";

const router = Router();

// GET /api/state — full hydration payload for the app.
router.get("/", async (_req, res) => {
  const [nodes, connections, files] = await Promise.all([
    prisma.node.findMany(),
    prisma.connection.findMany(),
    prisma.file.findMany(),
  ]);

  const nodesById: Record<string, ReturnType<typeof serializeNode>> = {};
  for (const n of nodes) nodesById[n.id] = serializeNode(n);

  const filesByNode: Record<string, ReturnType<typeof serializeFile>> = {};
  for (const f of files) filesByNode[f.nodeId] = serializeFile(f);

  res.json({
    nodes: nodesById,
    connections: connections.map(serializeConnection),
    files: filesByNode,
  });
});

// PUT /api/state — bulk replace nodes + connections (used by undo/redo & import).
// Files are left untouched (managed via their own endpoints).
router.put("/", async (req, res) => {
  const body = req.body as {
    nodes?: Record<string, OrgNode>;
    connections?: Connection[];
    action?: string;
  };
  const nodes = body.nodes ?? {};
  const connections = body.connections ?? [];

  await prisma.$transaction(async (tx) => {
    // Connections first (FK), then nodes.
    await tx.connection.deleteMany({});
    // Only delete nodes that are no longer present, to preserve attached files.
    const keepIds = Object.keys(nodes);
    await tx.node.deleteMany({
      where: keepIds.length ? { id: { notIn: keepIds } } : {},
    });

    for (const id of keepIds) {
      const n = nodes[id];
      const data = {
        badge: n.badge,
        title: n.title,
        sub: n.sub,
        color: n.color,
        project: n.project,
        status: n.status,
        x: n.x,
        y: n.y,
        view: n.view,
        collapsed: n.collapsed,
        hc: (n.hc ?? undefined) as Prisma.InputJsonValue | undefined,
        size: (n.size ?? undefined) as Prisma.InputJsonValue | undefined,
        clarity: (n.clarity ?? undefined) as unknown as Prisma.InputJsonValue | undefined,
      };
      await tx.node.upsert({
        where: { id },
        create: { id, ...data },
        update: data,
      });
    }

    if (connections.length) {
      await tx.connection.createMany({
        data: connections.map((c) => ({
          id: c.id,
          fromNode: c.from,
          toNode: c.to,
          view: c.view,
          lineStyle: c.lineStyle ?? null,
        })),
      });
    }
  });

  // Only log a coarse entry when an action label is given. When the client
  // commits granular per-node history separately (POST /api/history), it sends
  // no action here to avoid a duplicate "Bulk state update" line.
  if (body.action) await logAction(body.action);
  res.json({ ok: true });
});

export default router;
