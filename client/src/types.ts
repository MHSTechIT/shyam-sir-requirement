// Mirrors server/src/types.ts

export type Status = "active" | "hiring" | "future" | "notice";

export interface Headcount {
  req: number;
  have: number;
  hire: number;
  notice: number;
}

export interface NodeSize {
  w: number;
  h: number;
}

export interface Clarity {
  reports_to: string;
  dept: string;
  responsibilities: string;
  kpis: string[];
  kras: string[];
  doc_notes: string;
  doc_link: string;
}

export interface OrgNode {
  id: string;
  badge: string;
  title: string;
  sub: string;
  color: string;
  project: string;
  status: Status;
  x: number;
  y: number;
  view: string;
  collapsed: boolean;
  hc: Headcount | null;
  size: NodeSize | null;
  clarity: Clarity;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  view: string;
  lineStyle: string | null;
}

export interface FileMeta {
  id: string;
  nodeId: string;
  name: string;
  mimeType: string;
  size: number;
}

export interface HistoryEntry {
  id: number;
  ts: string;
  action: string;
  details?: unknown;
}

export interface OrgStatePayload {
  nodes: Record<string, OrgNode>;
  connections: Connection[];
  files: Record<string, FileMeta>;
}

export type LineStyle = "curved" | "straight" | "orthogonal";
export type CanvasView = "master" | "wc" | "vsl" | "col";
export type ViewKey = CanvasView | "scorecard" | "table" | "history";
