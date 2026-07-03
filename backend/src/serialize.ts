import type { OrgNode, Connection, FileMeta, HistoryEntry, Clarity } from "./types";

// Raw DB rows come back with the exact (camelCase) column names.
type Row = Record<string, unknown>;

export const DEFAULT_CLARITY: Clarity = {
  reports_to: "",
  dept: "",
  responsibilities: "",
  kpis: [],
  kras: [],
  doc_notes: "",
  doc_link: "",
};

export function serializeNode(n: Row): OrgNode {
  return {
    id: n.id as string,
    badge: n.badge as string,
    title: n.title as string,
    sub: n.sub as string,
    color: n.color as string,
    project: n.project as string,
    status: n.status as OrgNode["status"],
    x: Number(n.x),
    y: Number(n.y),
    view: n.view as string,
    collapsed: Boolean(n.collapsed),
    hc: (n.hc as OrgNode["hc"]) ?? null,
    size: (n.size as OrgNode["size"]) ?? null,
    clarity: { ...DEFAULT_CLARITY, ...((n.clarity as Partial<Clarity>) ?? {}) },
  };
}

export function serializeConnection(c: Row): Connection {
  return {
    id: c.id as string,
    from: c.fromNode as string,
    to: c.toNode as string,
    view: c.view as string,
    lineStyle: (c.lineStyle as string | null) ?? null,
  };
}

export function serializeFile(f: Row): FileMeta {
  return {
    id: f.id as string,
    nodeId: f.nodeId as string,
    name: f.name as string,
    mimeType: f.mimeType as string,
    size: Number(f.size),
  };
}

export function serializeHistory(h: Row): HistoryEntry {
  const ts = h.ts as Date | string;
  return {
    id: Number(h.id),
    ts: ts instanceof Date ? ts.toISOString() : String(ts),
    action: h.action as string,
    details: h.details ?? undefined,
  };
}

export interface GroupRow {
  id: string;
  name: string;
  color: string;
  order: number;
}
export function serializeGroup(g: Row): GroupRow {
  return {
    id: g.id as string,
    name: g.name as string,
    color: g.color as string,
    order: Number(g.order),
  };
}
