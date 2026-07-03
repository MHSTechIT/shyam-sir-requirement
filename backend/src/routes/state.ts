import { Router } from "express";
import { query, tx } from "../db";
import { logAction } from "../history";
import {
  serializeNode,
  serializeConnection,
  serializeFile,
  serializeGroup,
} from "../serialize";
import type { OrgNode, Connection } from "../types";

const router = Router();

const jsonb = (v: unknown) => (v === undefined || v === null ? null : JSON.stringify(v));

// GET /api/state — full hydration payload for the app.
router.get("/", async (_req, res) => {
  const [nodes, connections, files, groups] = await Promise.all([
    query(`SELECT * FROM nodes`),
    query(`SELECT * FROM connections`),
    query(`SELECT * FROM files`),
    query(`SELECT * FROM groups ORDER BY "order" ASC`),
  ]);

  const nodesById: Record<string, ReturnType<typeof serializeNode>> = {};
  for (const n of nodes) nodesById[n.id as string] = serializeNode(n);

  const filesByNode: Record<string, ReturnType<typeof serializeFile>> = {};
  for (const f of files) filesByNode[f.nodeId as string] = serializeFile(f);

  res.json({
    nodes: nodesById,
    connections: connections.map(serializeConnection),
    files: filesByNode,
    groups: groups.map(serializeGroup),
  });
});

// PUT /api/state — bulk replace nodes + connections (used by undo/redo & Save).
// Files are left untouched (managed via their own endpoints).
router.put("/", async (req, res) => {
  const body = req.body as {
    nodes?: Record<string, OrgNode>;
    connections?: Connection[];
    action?: string;
  };
  const nodes = body.nodes ?? {};
  const connections = body.connections ?? [];
  const keepIds = Object.keys(nodes);

  await tx(async (c) => {
    // Connections first (FK), then prune nodes no longer present (keeps files).
    await c.query(`DELETE FROM connections`);
    if (keepIds.length) {
      await c.query(
        `DELETE FROM nodes WHERE "id" <> ALL($1::text[])`,
        [keepIds]
      );
    } else {
      await c.query(`DELETE FROM nodes`);
    }

    for (const id of keepIds) {
      const n = nodes[id];
      await c.query(
        `INSERT INTO nodes
           ("id","badge","title","sub","color","project","status","x","y","view","collapsed","hc","size","clarity","updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14::jsonb,CURRENT_TIMESTAMP)
         ON CONFLICT ("id") DO UPDATE SET
           "badge"=EXCLUDED."badge","title"=EXCLUDED."title","sub"=EXCLUDED."sub",
           "color"=EXCLUDED."color","project"=EXCLUDED."project","status"=EXCLUDED."status",
           "x"=EXCLUDED."x","y"=EXCLUDED."y","view"=EXCLUDED."view","collapsed"=EXCLUDED."collapsed",
           "hc"=EXCLUDED."hc","size"=EXCLUDED."size","clarity"=EXCLUDED."clarity",
           "updatedAt"=CURRENT_TIMESTAMP`,
        [
          id, n.badge, n.title, n.sub, n.color, n.project, n.status,
          n.x, n.y, n.view, n.collapsed, jsonb(n.hc), jsonb(n.size), jsonb(n.clarity),
        ]
      );
    }

    for (const cn of connections) {
      await c.query(
        `INSERT INTO connections ("id","fromNode","toNode","view","lineStyle")
         VALUES ($1,$2,$3,$4,$5)`,
        [cn.id, cn.from, cn.to, cn.view, cn.lineStyle ?? null]
      );
    }
  });

  if (body.action) await logAction(body.action);
  res.json({ ok: true });
});

export default router;
