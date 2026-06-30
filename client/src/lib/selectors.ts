import type { OrgNode, Connection } from "../types";

export interface Agg {
  req: number;
  have: number;
  hire: number;
  notice: number;
  total: number;
  active: number;
  hiring: number;
  future: number;
}

function emptyAgg(): Agg {
  return { req: 0, have: 0, hire: 0, notice: 0, total: 0, active: 0, hiring: 0, future: 0 };
}

function accumulate(out: Agg, n: OrgNode) {
  out.total++;
  if (n.status === "active") out.active++;
  else if (n.status === "hiring") out.hiring++;
  else if (n.status === "future") out.future++;
  if (n.hc) {
    out.req += n.hc.req || 0;
    out.have += n.hc.have || 0;
    out.hire += Math.max(0, (n.hc.req || 0) - (n.hc.have || 0));
    out.notice += n.hc.notice || 0;
  }
}

export function hasCollapsedAncestor(
  nodeId: string,
  view: string,
  nodes: Record<string, OrgNode>,
  connections: Connection[]
): boolean {
  const visited = new Set<string>();
  const check = (id: string): boolean => {
    if (visited.has(id)) return false;
    visited.add(id);
    for (const c of connections) {
      if (c.view === view && c.to === id) {
        const parent = nodes[c.from];
        if (parent && parent.collapsed) return true;
        if (check(c.from)) return true;
      }
    }
    return false;
  };
  return check(nodeId);
}

export function isNodeVisible(
  node: OrgNode,
  view: string,
  filters: Record<string, boolean>,
  nodes: Record<string, OrgNode>,
  connections: Connection[]
): boolean {
  if (node.view !== view) return false;
  if (view === "master") {
    if (node.project === "shared") {
      /* always shown */
    } else if (node.project === "ops") {
      if (!filters.ops) return false;
    } else if (filters[node.project] === false) {
      return false;
    }
  }
  if (hasCollapsedAncestor(node.id, view, nodes, connections)) return false;
  return true;
}

export function aggregateProject(project: string, nodes: Record<string, OrgNode>): Agg {
  const out = emptyAgg();
  for (const n of Object.values(nodes)) {
    if (n.view !== "master" || n.project !== project) continue;
    accumulate(out, n);
  }
  return out;
}

export function aggregateBranch(
  rootId: string,
  nodes: Record<string, OrgNode>,
  connections: Connection[]
): Agg {
  const out = emptyAgg();
  const visited = new Set<string>();
  const walk = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    const n = nodes[id];
    if (!n) return;
    accumulate(out, n);
    for (const c of connections) if (c.view === "master" && c.from === id) walk(c.to);
  };
  walk(rootId);
  return out;
}

export function aggregateAll(nodes: Record<string, OrgNode>): Agg {
  const out = emptyAgg();
  for (const n of Object.values(nodes)) {
    if (n.view !== "master") continue;
    accumulate(out, n);
  }
  return out;
}
