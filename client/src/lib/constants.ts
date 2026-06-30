import type { Clarity } from "../types";

export const NODE_W = 200;
export const NODE_H = 110;

export const DEFAULT_CLARITY: Clarity = {
  reports_to: "",
  dept: "",
  responsibilities: "",
  kpis: [],
  kras: [],
  doc_notes: "",
  doc_link: "",
};

export const COLOR_PALETTE = [
  { hex: "#ff7043", label: "Orange", group: "wc" },
  { hex: "#26c6da", label: "Cyan", group: "vsl" },
  { hex: "#66bb6a", label: "Green", group: "col" },
  { hex: "#7c4dff", label: "Purple", group: "dev" },
  { hex: "#f06292", label: "Pink", group: "mkt" },
  { hex: "#ffd166", label: "Yellow", group: "ops" },
  { hex: "#ab47bc", label: "Violet", group: "rnd" },
  { hex: "#1e88e5", label: "Blue", group: "bom" },
  { hex: "#42a5f5", label: "Sky", group: "pmo" },
  { hex: "#ef5350", label: "Red", group: "misc" },
  { hex: "#546e7a", label: "Slate", group: "future" },
  { hex: "#4caf50", label: "Lime", group: "misc" },
];

export const PROJECT_FILTERS = [
  { key: "wc", label: "Wellness", color: "#ff7043" },
  { key: "vsl", label: "VSL", color: "#26c6da" },
  { key: "col", label: "Collab", color: "#66bb6a" },
  { key: "dev", label: "Dev", color: "#7c4dff" },
  { key: "mkt", label: "Mktg", color: "#f06292" },
  { key: "ops", label: "Ops", color: "#1e88e5" },
] as const;

export const CANVAS_VIEWS = ["master", "wc", "vsl", "col"];

export const VIEW_TABS = [
  { key: "master", label: "Master" },
  { key: "scorecard", label: "Scorecards" },
  { key: "table", label: "Headcount" },
  { key: "history", label: "History" },
] as const;
