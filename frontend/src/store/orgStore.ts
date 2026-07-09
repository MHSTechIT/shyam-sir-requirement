import { create } from "zustand";
import { api } from "../api/client";
import { DEFAULT_CLARITY } from "../lib/constants";
import type {
  OrgNode,
  Connection,
  FileMeta,
  LineStyle,
  ViewKey,
  Group,
} from "../types";

type ToastType = "ok" | "warn" | "err";
interface Toast {
  id: number;
  msg: string;
  type: ToastType;
}

interface Snapshot {
  nodes: Record<string, OrgNode>;
  connections: Connection[];
}

interface PendingAction {
  action: string;
  nodeId?: string;
}

interface OrgStore {
  // data
  nodes: Record<string, OrgNode>;
  connections: Connection[];
  files: Record<string, FileMeta>;
  groups: Group[];
  // ui
  loading: boolean;
  loadError: string | null;
  currentView: ViewKey;
  filters: Record<string, boolean>;
  lineStyle: LineStyle;
  selectedNodeId: string | null;
  editMode: boolean;
  toasts: Toast[];
  undoStack: Snapshot[];
  redoStack: Snapshot[];
  lastSavedAt: number | null;
  clipboard: Snapshot | null;
  // explicit-save model
  dirty: boolean;
  pending: PendingAction[];
  saving: boolean;

  // lifecycle
  load: () => Promise<void>;
  save: () => Promise<void>;

  // ui actions
  setView: (v: ViewKey) => void;
  toggleFilter: (key: string) => void;
  setLineStyle: (s: LineStyle) => void;
  selectNode: (id: string | null) => void;
  toggleEditMode: () => void;
  toast: (msg: string, type?: ToastType) => void;
  dismissToast: (id: number) => void;

  // data actions (local-only until save())
  addNode: (partial: Partial<OrgNode>) => void;
  updateNode: (
    id: string,
    patch: Partial<OrgNode>,
    opts?: { silent?: boolean; record?: boolean }
  ) => void;
  deleteNode: (id: string) => void;
  deleteNodes: (ids: string[]) => void;
  copyNodes: (ids: string[]) => void;
  pasteClipboard: () => void;
  duplicateNodes: (ids: string[]) => void;
  toggleCollapse: (id: string) => void;
  persistPositions: (
    updates: Array<{ id: string; x: number; y: number }>
  ) => void;
  addConnection: (from: string, to: string) => void;
  deleteConnection: (id: string) => void;

  // files (committed to the server immediately)
  uploadFile: (nodeId: string, file: File) => Promise<void>;
  removeFile: (nodeId: string) => Promise<void>;

  // groups / named color filters (committed immediately)
  addGroup: (name: string, color: string) => Promise<Group | null>;
  updateGroup: (id: string, patch: { name?: string; color?: string }) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;

  // undo / redo (local)
  undo: () => void;
  redo: () => void;
}

const FILTERS_KEY = "mhs_filters_v1";
const LINESTYLE_KEY = "mhs_linestyle_v1";

function loadFilters(): Record<string, boolean> {
  const def = { wc: true, vsl: true, col: true, dev: true, mkt: true, ops: true };
  try {
    const raw = localStorage.getItem(FILTERS_KEY);
    return raw ? { ...def, ...JSON.parse(raw) } : def;
  } catch {
    return def;
  }
}
function loadLineStyle(): LineStyle {
  const v = localStorage.getItem(LINESTYLE_KEY);
  return v === "straight" || v === "orthogonal" ? v : "curved";
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Deep-clone a set of nodes (+ the connections wholly between them), assigning
// fresh ids and offsetting positions. Used by copy/paste and duplicate.
function cloneSelection(
  srcNodes: OrgNode[],
  allConnections: Connection[],
  dx: number,
  dy: number
): { nodes: OrgNode[]; connections: Connection[] } {
  const idMap = new Map<string, string>();
  const nodes = srcNodes.map((n) => {
    const id = newId("nd");
    idMap.set(n.id, id);
    return {
      ...structuredClone(n),
      id,
      x: Math.round(n.x + dx),
      y: Math.round(n.y + dy),
    };
  });
  const connections = allConnections
    .filter((c) => idMap.has(c.from) && idMap.has(c.to))
    .map((c) => ({
      ...c,
      id: newId("cn"),
      from: idMap.get(c.from)!,
      to: idMap.get(c.to)!,
    }));
  return { nodes, connections };
}

let toastSeq = 0;

export const useOrg = create<OrgStore>((set, get) => {
  const snapshot = (): Snapshot => ({
    nodes: structuredClone(get().nodes),
    connections: structuredClone(get().connections),
  });
  const pushUndo = () =>
    set((s) => ({ undoStack: [...s.undoStack.slice(-49), snapshot()], redoStack: [] }));

  // Mark the working state dirty and (optionally) record a history action that
  // will be committed to the DB on save().
  const mark = (action?: string, nodeId?: string) =>
    set((s) => ({
      dirty: true,
      pending: action ? [...s.pending, { action, nodeId }] : s.pending,
    }));

  return {
    nodes: {},
    connections: [],
    files: {},
    groups: [],
    loading: true,
    loadError: null,
    currentView: "master",
    filters: loadFilters(),
    lineStyle: loadLineStyle(),
    selectedNodeId: null,
    editMode: false,
    toasts: [],
    undoStack: [],
    redoStack: [],
    lastSavedAt: null,
    clipboard: null,
    dirty: false,
    pending: [],
    saving: false,

    load: async () => {
      set({ loading: true, loadError: null });
      try {
        const data = await api.getState();
        set({
          nodes: data.nodes,
          connections: data.connections,
          files: data.files,
          groups: data.groups ?? [],
          loading: false,
          dirty: false,
          pending: [],
          lastSavedAt: Date.now(),
        });
      } catch (e) {
        set({ loading: false, loadError: (e as Error).message });
      }
    },

    save: async () => {
      const { dirty, nodes, connections, pending, saving } = get();
      if (saving) return;
      if (!dirty) {
        get().toast("Nothing to save", "warn");
        return;
      }
      set({ saving: true });
      try {
        await api.putState(nodes, connections, "");
        if (pending.length) await api.postHistory(pending);
        set({ dirty: false, pending: [], saving: false, lastSavedAt: Date.now() });
        get().toast("Saved to database");
      } catch (e) {
        set({ saving: false });
        get().toast(`Save failed: ${(e as Error).message}`, "err");
      }
    },

    setView: (v) => set({ currentView: v, selectedNodeId: null }),

    toggleFilter: (key) =>
      set((s) => {
        const filters = { ...s.filters, [key]: !s.filters[key] };
        localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
        return { filters };
      }),

    setLineStyle: (style) => {
      localStorage.setItem(LINESTYLE_KEY, style);
      set({ lineStyle: style });
    },

    selectNode: (id) => set({ selectedNodeId: id }),

    toggleEditMode: () =>
      set((s) => ({ editMode: !s.editMode })),

    toast: (msg, type = "ok") => {
      const id = ++toastSeq;
      set((s) => ({ toasts: [...s.toasts, { id, msg, type }] }));
      setTimeout(() => get().dismissToast(id), 2600);
    },
    dismissToast: (id) =>
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

    // ── data actions — local only ──
    addNode: (partial) => {
      pushUndo();
      const id = partial.id || newId("nd");
      const node: OrgNode = {
        id,
        badge: partial.badge ?? "ROLE",
        title: partial.title ?? "New Position",
        sub: partial.sub ?? "",
        color: partial.color ?? "#6c63ff",
        project: partial.project ?? "shared",
        status: partial.status ?? "active",
        x: partial.x ?? 100,
        y: partial.y ?? 100,
        view: partial.view ?? "master",
        collapsed: partial.collapsed ?? false,
        hc: partial.hc ?? null,
        size: partial.size ?? null,
        clarity: partial.clarity ?? { ...DEFAULT_CLARITY },
      };
      set((s) => ({ nodes: { ...s.nodes, [id]: node } }));
      mark(`Added new node "${node.title}"`, id);
      get().toast(`Added "${node.title}" (unsaved)`);
    },

    updateNode: (id, patch, opts) => {
      const prev = get().nodes[id];
      if (!prev) return;
      if (opts?.record !== false) pushUndo();
      const next = { ...prev, ...patch } as OrgNode;
      set((s) => ({ nodes: { ...s.nodes, [id]: next } }));
      mark(opts?.silent ? undefined : `Updated "${next.title}"`, id);
    },

    deleteNode: (id) => {
      pushUndo();
      const node = get().nodes[id];
      set((s) => {
        const nodes = { ...s.nodes };
        delete nodes[id];
        return {
          nodes,
          connections: s.connections.filter((c) => c.from !== id && c.to !== id),
          selectedNodeId: null,
        };
      });
      mark(`Deleted node "${node?.title ?? id}"`, id);
      get().toast(`Deleted "${node?.title ?? "node"}" (unsaved)`);
    },

    deleteNodes: (ids) => {
      const idSet = new Set(ids.filter((id) => get().nodes[id]));
      if (!idSet.size) return;
      pushUndo();
      set((s) => {
        const nodes = { ...s.nodes };
        for (const id of idSet) delete nodes[id];
        return {
          nodes,
          connections: s.connections.filter((c) => !idSet.has(c.from) && !idSet.has(c.to)),
          selectedNodeId: null,
        };
      });
      mark(`Deleted ${idSet.size} node${idSet.size > 1 ? "s" : ""}`);
      get().toast(`Deleted ${idSet.size} node${idSet.size > 1 ? "s" : ""} (unsaved)`);
    },

    copyNodes: (ids) => {
      const srcNodes = ids.map((id) => get().nodes[id]).filter(Boolean) as OrgNode[];
      if (!srcNodes.length) {
        set({ clipboard: null });
        return;
      }
      const chosen = new Set(srcNodes.map((n) => n.id));
      const connections = get().connections.filter(
        (c) => chosen.has(c.from) && chosen.has(c.to)
      );
      set({ clipboard: structuredClone({ nodes: Object.fromEntries(srcNodes.map((n) => [n.id, n])), connections }) });
      get().toast(`Copied ${srcNodes.length} node${srcNodes.length > 1 ? "s" : ""}`);
    },

    pasteClipboard: () => {
      const clip = get().clipboard;
      if (!clip) return;
      const srcNodes = Object.values(clip.nodes);
      if (!srcNodes.length) return;
      pushUndo();
      const view = get().currentView;
      const { nodes, connections } = cloneSelection(srcNodes, clip.connections, 40, 40);
      // paste into the current canvas view so the copies are visible here
      const placed = nodes.map((n) => ({ ...n, view }));
      set((s) => ({
        nodes: { ...s.nodes, ...Object.fromEntries(placed.map((n) => [n.id, n])) },
        connections: [...s.connections, ...connections.map((c) => ({ ...c, view }))],
      }));
      mark(`Pasted ${placed.length} node${placed.length > 1 ? "s" : ""}`);
      get().toast(`Pasted ${placed.length} node${placed.length > 1 ? "s" : ""} (unsaved)`);
    },

    duplicateNodes: (ids) => {
      const srcNodes = ids.map((id) => get().nodes[id]).filter(Boolean) as OrgNode[];
      if (!srcNodes.length) return;
      pushUndo();
      const { nodes, connections } = cloneSelection(srcNodes, get().connections, 40, 40);
      set((s) => ({
        nodes: { ...s.nodes, ...Object.fromEntries(nodes.map((n) => [n.id, n])) },
        connections: [...s.connections, ...connections],
      }));
      mark(`Duplicated ${nodes.length} node${nodes.length > 1 ? "s" : ""}`);
      get().toast(`Duplicated ${nodes.length} node${nodes.length > 1 ? "s" : ""} (unsaved)`);
    },

    toggleCollapse: (id) => {
      const node = get().nodes[id];
      if (!node) return;
      set((s) => ({ nodes: { ...s.nodes, [id]: { ...node, collapsed: !node.collapsed } } }));
      mark();
    },

    persistPositions: (updates) => {
      if (!updates.length) return;
      pushUndo();
      set((s) => {
        const nodes = { ...s.nodes };
        for (const u of updates)
          if (nodes[u.id]) nodes[u.id] = { ...nodes[u.id], x: u.x, y: u.y };
        return { nodes };
      });
      mark(
        updates.length === 1
          ? `Moved "${get().nodes[updates[0].id]?.title ?? updates[0].id}"`
          : `Moved ${updates.length} nodes`,
        updates.length === 1 ? updates[0].id : undefined
      );
    },

    addConnection: (from, to) => {
      if (from === to) return;
      const view = get().currentView;
      const dup = get().connections.find(
        (c) => c.from === from && c.to === to && c.view === view
      );
      if (dup) {
        get().toast("Connection already exists", "warn");
        return;
      }
      pushUndo();
      const conn: Connection = { id: newId("conn"), from, to, view, lineStyle: null };
      set((s) => ({ connections: [...s.connections, conn] }));
      const fn = get().nodes[from]?.title ?? from;
      const tn = get().nodes[to]?.title ?? to;
      mark(`Connected "${fn}" → "${tn}"`);
      get().toast("Connection added (unsaved)");
    },

    deleteConnection: (id) => {
      pushUndo();
      set((s) => ({ connections: s.connections.filter((c) => c.id !== id) }));
      mark("Deleted a connection");
      get().toast("Connection deleted (unsaved)");
    },

    // ── files — immediate server commit ──
    uploadFile: async (nodeId, file) => {
      // Ensure pending node edits are persisted so the node exists server-side.
      if (get().dirty) await get().save();
      try {
        const meta = await api.uploadFile(nodeId, file);
        set((s) => ({ files: { ...s.files, [nodeId]: meta }, lastSavedAt: Date.now() }));
        get().toast(`Uploaded ${meta.name}`);
      } catch (e) {
        get().toast((e as Error).message, "err");
      }
    },

    removeFile: async (nodeId) => {
      const meta = get().files[nodeId];
      if (!meta) return;
      set((s) => {
        const files = { ...s.files };
        delete files[nodeId];
        return { files };
      });
      try {
        await api.deleteFile(meta.id);
        get().toast("Document removed");
      } catch (e) {
        get().toast((e as Error).message, "err");
      }
    },

    // ── groups / named color filters — immediate ──
    addGroup: async (name, color) => {
      try {
        const group = await api.createGroup(name, color);
        set((s) => ({ groups: [...s.groups, group] }));
        get().toast(`Added color "${group.name}"`);
        return group;
      } catch (e) {
        get().toast((e as Error).message, "err");
        return null;
      }
    },
    updateGroup: async (id, patch) => {
      set((s) => ({
        groups: s.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
      }));
      try {
        await api.updateGroup(id, patch);
      } catch (e) {
        get().toast((e as Error).message, "err");
      }
    },
    deleteGroup: async (id) => {
      set((s) => ({ groups: s.groups.filter((g) => g.id !== id) }));
      try {
        await api.deleteGroup(id);
        get().toast("Color removed");
      } catch (e) {
        get().toast((e as Error).message, "err");
      }
    },

    // ── undo / redo (local) ──
    undo: () => {
      const { undoStack } = get();
      if (!undoStack.length) {
        get().toast("Nothing to undo", "warn");
        return;
      }
      const prev = undoStack[undoStack.length - 1];
      set((s) => ({
        undoStack: s.undoStack.slice(0, -1),
        redoStack: [...s.redoStack, snapshot()],
        nodes: prev.nodes,
        connections: prev.connections,
      }));
      mark("Undo");
    },

    redo: () => {
      const { redoStack } = get();
      if (!redoStack.length) {
        get().toast("Nothing to redo", "warn");
        return;
      }
      const next = redoStack[redoStack.length - 1];
      set((s) => ({
        redoStack: s.redoStack.slice(0, -1),
        undoStack: [...s.undoStack, snapshot()],
        nodes: next.nodes,
        connections: next.connections,
      }));
      mark("Redo");
    },
  };
});
