import type {
  OrgNode,
  Connection,
  FileMeta,
  HistoryEntry,
  OrgStatePayload,
} from "../types";

// In dev (and single-service deploys) the frontend talks to "/api" on the same
// origin (Vite proxies it). For a split deploy (frontend on Vercel, backend on
// Render) set VITE_API_URL to the backend's API base, e.g.
// "https://my-backend.onrender.com/api".
const BASE = import.meta.env.VITE_API_URL || "/api";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  // Abort after 15s so a hung/unreachable backend surfaces as an error
  // (→ Retry screen) instead of an indefinite "Loading…".
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      credentials: "include",
      signal: ctrl.signal,
      headers:
        init?.body && !(init.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : undefined,
      ...init,
    });
  } catch (e) {
    if ((e as Error).name === "AbortError")
      throw new Error("Server did not respond (timed out)");
    throw new Error("Cannot reach server");
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // ── auth ──
  authStatus: () =>
    req<{ required: boolean; authed: boolean }>("/auth/status"),
  login: (password: string) =>
    req<{ ok: boolean }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  // ── state ──
  getState: () => req<OrgStatePayload>("/state"),
  putState: (
    nodes: Record<string, OrgNode>,
    connections: Connection[],
    action: string
  ) =>
    req<{ ok: true }>("/state", {
      method: "PUT",
      body: JSON.stringify({ nodes, connections, action }),
    }),

  // ── nodes ──
  createNode: (node: Partial<OrgNode>) =>
    req<OrgNode>("/nodes", { method: "POST", body: JSON.stringify(node) }),
  updateNode: (id: string, patch: Partial<OrgNode>, silent = false) =>
    req<OrgNode>(`/nodes/${id}${silent ? "?silent=1" : ""}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  moveNodes: (updates: Array<{ id: string; x: number; y: number }>) =>
    req<{ ok: true }>("/nodes", {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),
  deleteNode: (id: string) =>
    req<{ ok: true }>(`/nodes/${id}`, { method: "DELETE" }),

  // ── connections ──
  createConnection: (conn: Partial<Connection>) =>
    req<Connection>("/connections", {
      method: "POST",
      body: JSON.stringify(conn),
    }),
  updateConnection: (id: string, lineStyle: string | null) =>
    req<Connection>(`/connections/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ lineStyle }),
    }),
  deleteConnection: (id: string) =>
    req<{ ok: true }>(`/connections/${id}`, { method: "DELETE" }),

  // ── files ──
  uploadFile: (nodeId: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return req<FileMeta>(`/nodes/${nodeId}/file`, { method: "POST", body: fd });
  },
  deleteFile: (fileId: string) =>
    req<{ ok: true }>(`/files/${fileId}`, { method: "DELETE" }),
  fileUrl: (fileId: string) => `${BASE}/files/${fileId}`,

  // ── history ──
  getHistory: (limit = 200, before?: string) =>
    req<{ entries: HistoryEntry[]; total: number }>(
      `/history?limit=${limit}${before ? `&before=${encodeURIComponent(before)}` : ""}`
    ),
  getNodeHistory: (nodeId: string, limit = 100) =>
    req<{ entries: HistoryEntry[]; total: number }>(
      `/history?nodeId=${encodeURIComponent(nodeId)}&limit=${limit}`
    ),
  postHistory: (items: Array<{ action: string; nodeId?: string }>) =>
    req<{ ok: true }>("/history", {
      method: "POST",
      body: JSON.stringify(items),
    }),
};
