/**
 * Import org-chart data from an old exported backup HTML file.
 *
 * Usage:  npm run import -- "C:/path/to/mhs_orgchart_2026-01-01.html"
 *
 * The old "Save & Export" embeds  window.__SAVED_STATE__ = {...};  into the HTML.
 * This reads that payload and upserts nodes, connections and attached files.
 */
import fs from "fs";
import { pool, query, ensureSchema } from "../src/db";
import { saveFile } from "../src/storage";

const DEFAULT_CLARITY = {
  reports_to: "", dept: "", responsibilities: "",
  kpis: [], kras: [], doc_notes: "", doc_link: "",
};

const jsonb = (v: unknown) => (v === undefined || v === null ? null : JSON.stringify(v));

function extractSavedState(html: string): any {
  const marker = "window.__SAVED_STATE__=";
  const start = html.indexOf(marker);
  if (start === -1) throw new Error("No __SAVED_STATE__ payload found in file.");
  let i = start + marker.length;
  while (i < html.length && html[i] !== "{") i++;
  let depth = 0, inStr = false, esc = false;
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
        if (depth === 0) return JSON.parse(html.slice(begin, i + 1));
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
  await ensureSchema();
  const state = extractSavedState(fs.readFileSync(file, "utf8"));

  const nodes = state.nodes || {};
  const connections = state.connections || [];
  const files = state.files || {};

  for (const id of Object.keys(nodes)) {
    const n = nodes[id];
    await query(
      `INSERT INTO nodes
         ("id","badge","title","sub","color","project","status","x","y","view","collapsed","hc","size","clarity","updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14::jsonb,CURRENT_TIMESTAMP)
       ON CONFLICT ("id") DO UPDATE SET
         "badge"=EXCLUDED."badge","title"=EXCLUDED."title","sub"=EXCLUDED."sub","color"=EXCLUDED."color",
         "project"=EXCLUDED."project","status"=EXCLUDED."status","x"=EXCLUDED."x","y"=EXCLUDED."y",
         "view"=EXCLUDED."view","collapsed"=EXCLUDED."collapsed","hc"=EXCLUDED."hc","size"=EXCLUDED."size",
         "clarity"=EXCLUDED."clarity","updatedAt"=CURRENT_TIMESTAMP`,
      [
        id, n.badge ?? "ROLE", n.title ?? "Untitled", n.sub ?? "", n.color ?? "#6c63ff",
        n.project ?? "shared", n.status ?? "active", n.x ?? 100, n.y ?? 100, n.view ?? "master",
        Boolean(n.collapsed), jsonb(n.hc), jsonb(n.size),
        JSON.stringify({ ...DEFAULT_CLARITY, ...(n.clarity ?? {}) }),
      ]
    );
  }

  for (const c of connections) {
    await query(
      `INSERT INTO connections ("id","fromNode","toNode","view","lineStyle")
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT ("id") DO UPDATE SET
         "fromNode"=EXCLUDED."fromNode","toNode"=EXCLUDED."toNode",
         "view"=EXCLUDED."view","lineStyle"=EXCLUDED."lineStyle"`,
      [c.id, c.from, c.to, c.view ?? "master", c.lineStyle ?? null]
    );
  }

  let fileCount = 0;
  for (const nodeId of Object.keys(files)) {
    const f = files[nodeId];
    if (!f?.dataUrl) continue;
    try {
      const { buffer } = dataUrlToBuffer(f.dataUrl);
      const storageKey = saveFile(f.name || "document", buffer);
      await query(
        `INSERT INTO files ("id","nodeId","name","mimeType","size","storageKey")
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT ("nodeId") DO UPDATE SET
           "name"=EXCLUDED."name","mimeType"=EXCLUDED."mimeType",
           "size"=EXCLUDED."size","storageKey"=EXCLUDED."storageKey"`,
        [
          `file_${nodeId}`, nodeId, f.name || "document",
          f.type || "application/octet-stream", f.size || buffer.length, storageKey,
        ]
      );
      fileCount++;
    } catch (e) {
      console.warn(`Skipped file for ${nodeId}:`, (e as Error).message);
    }
  }

  await query(`INSERT INTO history ("action") VALUES ($1)`, [
    `Imported data from ${file.split(/[\\/]/).pop()}`,
  ]);
  console.log(
    `Imported ${Object.keys(nodes).length} nodes, ${connections.length} connections, ${fileCount} files.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
