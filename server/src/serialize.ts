import type {
  Node as PrismaNode,
  Connection as PrismaConnection,
  File as PrismaFile,
  History as PrismaHistory,
} from "@prisma/client";
import type {
  OrgNode,
  Connection,
  FileMeta,
  HistoryEntry,
  Clarity,
} from "./types";

export const DEFAULT_CLARITY: Clarity = {
  reports_to: "",
  dept: "",
  responsibilities: "",
  kpis: [],
  kras: [],
  doc_notes: "",
  doc_link: "",
};

export function serializeNode(n: PrismaNode): OrgNode {
  return {
    id: n.id,
    badge: n.badge,
    title: n.title,
    sub: n.sub,
    color: n.color,
    project: n.project,
    status: n.status as OrgNode["status"],
    x: n.x,
    y: n.y,
    view: n.view,
    collapsed: n.collapsed,
    hc: (n.hc as OrgNode["hc"]) ?? null,
    size: (n.size as OrgNode["size"]) ?? null,
    clarity: { ...DEFAULT_CLARITY, ...((n.clarity as Partial<Clarity>) ?? {}) },
  };
}

export function serializeConnection(c: PrismaConnection): Connection {
  return {
    id: c.id,
    from: c.fromNode,
    to: c.toNode,
    view: c.view,
    lineStyle: c.lineStyle ?? null,
  };
}

export function serializeFile(f: PrismaFile): FileMeta {
  return {
    id: f.id,
    nodeId: f.nodeId,
    name: f.name,
    mimeType: f.mimeType,
    size: f.size,
  };
}

export function serializeHistory(h: PrismaHistory): HistoryEntry {
  return {
    id: h.id,
    ts: h.ts.toISOString(),
    action: h.action,
    details: h.details ?? undefined,
  };
}
