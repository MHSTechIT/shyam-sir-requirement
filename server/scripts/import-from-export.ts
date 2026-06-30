/**
 * Import org-chart data from an old exported backup HTML file.
 *
 * Usage:  npm run import -- "C:/path/to/mhs_orgchart_2026-01-01.html"
 *
 * The old "Save & Export" embeds  window.__SAVED_STATE__ = {...};  into the HTML.
 * This reads that payload and upserts nodes, connections and attached files into
 * PostgreSQL.
 */
import fs from "fs";
import { PrismaClient, Prisma } from "@prisma/client";
import { saveFile } from "../src/storage";

const prisma = new PrismaClient();

const DEFAULT_CLARITY = {
  reports_to: "",
  dept: "",
  responsibilities: "",
  kpis: [],
  kras: [],
  doc_notes: "",
  doc_link: "",
};

function extractSavedState(html: string): any {
  const marker = "window.__SAVED_STATE__=";
  const start = html.indexOf(marker);
  if (start === -1) throw new Error("No __SAVED_STATE__ payload found in file.");
  // Find the JSON object that follows the marker.
  let i = start + marker.length;
  while (i < html.length && html[i] !== "{") i++;
  let depth = 0;
  let inStr = false;
  let esc = false;
  const begin = i;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else {
      if (ch === '"') inStr = true;
      else if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          const json = html.slice(begin, i + 1);
          return JSON.parse(json);
        }
      }
    }
  }
  throw new Error("Could not parse __SAVED_STATE__ JSON.");
}

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mime: string } {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl);
  if (!m) throw new Error("Unsupported data URL");
  return { mime: m[1], buffer: Buffer.from(m[2], "base64") };
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: npm run import -- "path/to/export.html"');
    process.exit(1);
  }
  const html = fs.readFileSync(file, "utf8");
  const state = extractSavedState(html);

  const nodes = state.nodes || {};
  const connections = state.connections || [];
  const files = state.files || {};

  for (const id of Object.keys(nodes)) {
    const n = nodes[id];
    const data = {
      badge: n.badge ?? "ROLE",
      title: n.title ?? "Untitled",
      sub: n.sub ?? "",
      color: n.color ?? "#6c63ff",
      project: n.project ?? "shared",
      status: n.status ?? "active",
      x: n.x ?? 100,
      y: n.y ?? 100,
      view: n.view ?? "master",
      collapsed: Boolean(n.collapsed),
      hc: (n.hc ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      size: (n.size ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      clarity: { ...DEFAULT_CLARITY, ...(n.clarity ?? {}) } as Prisma.InputJsonValue,
    };
    await prisma.node.upsert({ where: { id }, create: { id, ...data }, update: data });
  }

  for (const c of connections) {
    await prisma.connection.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        fromNode: c.from,
        toNode: c.to,
        view: c.view ?? "master",
        lineStyle: c.lineStyle ?? null,
      },
      update: {
        fromNode: c.from,
        toNode: c.to,
        view: c.view ?? "master",
        lineStyle: c.lineStyle ?? null,
      },
    });
  }

  let fileCount = 0;
  for (const nodeId of Object.keys(files)) {
    const f = files[nodeId];
    if (!f?.dataUrl) continue;
    try {
      const { buffer } = dataUrlToBuffer(f.dataUrl);
      const storageKey = saveFile(f.name || "document", buffer);
      await prisma.file.upsert({
        where: { nodeId },
        create: {
          nodeId,
          name: f.name || "document",
          mimeType: f.type || "application/octet-stream",
          size: f.size || buffer.length,
          storageKey,
        },
        update: {
          name: f.name || "document",
          mimeType: f.type || "application/octet-stream",
          size: f.size || buffer.length,
          storageKey,
        },
      });
      fileCount++;
    } catch (e) {
      console.warn(`Skipped file for ${nodeId}:`, (e as Error).message);
    }
  }

  await prisma.history.create({
    data: { action: `Imported data from ${file.split(/[\\/]/).pop()}` },
  });

  console.log(
    `Imported ${Object.keys(nodes).length} nodes, ${connections.length} connections, ${fileCount} files.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
