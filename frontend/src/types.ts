// Mirrors server/src/types.ts

export type Status =
  | "active"
  | "hiring"
  | "future"
  | "notice"
  | "inactive"
  | "future_plan"
  | "upcoming";

export type NodeKind = "team" | "project" | "people";

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
  // Phase 2 — Team / Project / People node kinds
  kind: NodeKind;
  role_title: string; // People: the designation "Title" (shown as the card badge)
  project_lead: string; // Project / People
  goals: string; // Team Goal / Project Goals / People Goals
  team_process: string; // Team only
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

export interface Group {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface OrgStatePayload {
  nodes: Record<string, OrgNode>;
  connections: Connection[];
  files: Record<string, FileMeta>;
  groups: Group[];
}

export type LineStyle = "curved" | "straight" | "orthogonal";
export type CanvasView = "master" | "wc" | "vsl" | "col";
export type ViewKey = CanvasView | "scorecard" | "table" | "history";
