import Dagre from "@dagrejs/dagre";
import type { OrgNode, Connection } from "../types";
import { isNodeVisible } from "./selectors";
import { NODE_W, NODE_H } from "./constants";

/**
 * Compute a clean top-down (hierarchical) layout for the nodes currently
 * visible in `view`, using dagre. Returns new top-left positions keyed by id,
 * ready to hand to `persistPositions`. Nodes not visible in the view are left
 * untouched (not returned).
 */
export function autoLayout(
  view: string,
  filters: Record<string, boolean>,
  nodes: Record<string, OrgNode>,
  connections: Connection[]
): Array<{ id: string; x: number; y: number }> {
  const visible = Object.values(nodes).filter((n) =>
    isNodeVisible(n, view, filters, nodes, connections)
  );
  if (!visible.length) return [];
  const visibleIds = new Set(visible.map((n) => n.id));

  const g = new Dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 90, marginx: 40, marginy: 40 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const n of visible) {
    g.setNode(n.id, {
      width: n.size?.w ?? NODE_W,
      height: n.size?.h ?? NODE_H,
    });
  }
  for (const c of connections) {
    if (c.view !== view) continue;
    if (!visibleIds.has(c.from) || !visibleIds.has(c.to)) continue;
    g.setEdge(c.from, c.to);
  }

  Dagre.layout(g);

  return visible.map((n) => {
    const pos = g.node(n.id);
    const w = n.size?.w ?? NODE_W;
    const h = n.size?.h ?? NODE_H;
    // dagre gives node centers; React Flow positions are top-left.
    return { id: n.id, x: Math.round(pos.x - w / 2), y: Math.round(pos.y - h / 2) };
  });
}
