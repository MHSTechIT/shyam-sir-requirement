import type { Response } from "express";

// Simple Server-Sent Events hub: every connected browser holds an open
// GET /api/events stream; broadcast() pushes a message to all of them.
const clients = new Set<Response>();

export function addClient(res: Response): void {
  clients.add(res);
  res.on("close", () => clients.delete(res));
}

export function broadcast(payload: unknown): void {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) {
    try {
      res.write(data);
    } catch {
      clients.delete(res);
    }
  }
}

// Keep connections alive through proxies (comment ping every 25s).
setInterval(() => {
  for (const res of clients) {
    try {
      res.write(`:ping\n\n`);
    } catch {
      clients.delete(res);
    }
  }
}, 25_000).unref?.();
