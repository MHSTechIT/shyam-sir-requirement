import { Router } from "express";
import multer from "multer";
import fs from "fs";
import crypto from "crypto";
import { query, queryOne } from "../db";
import { logAction } from "../history";
import { serializeFile } from "../serialize";
import { saveFile, resolveFile, deleteFile } from "../storage";

const router = Router();

// 4 MB cap — matches the old client limit.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
});

const newId = () => `file_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;

// POST /api/nodes/:id/file — upload (replaces any existing doc for the node)
router.post("/nodes/:id/file", upload.single("file"), async (req, res) => {
  const { id } = req.params;
  const node = await queryOne<{ title: string }>(
    `SELECT "title" FROM nodes WHERE "id"=$1`,
    [id]
  );
  if (!node) {
    res.status(404).json({ error: "Node not found" });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  // Remove previous file (one doc per node).
  const prev = await queryOne<{ id: string; storageKey: string }>(
    `SELECT "id","storageKey" FROM files WHERE "nodeId"=$1`,
    [id]
  );
  if (prev) {
    deleteFile(prev.storageKey);
    await query(`DELETE FROM files WHERE "id"=$1`, [prev.id]);
  }

  const storageKey = saveFile(req.file.originalname, req.file.buffer);
  const rows = await query(
    `INSERT INTO files ("id","nodeId","name","mimeType","size","storageKey")
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [newId(), id, req.file.originalname, req.file.mimetype, req.file.size, storageKey]
  );
  await logAction(`Attached document "${rows[0].name}" to "${node.title}"`, { nodeId: id });
  res.status(201).json(serializeFile(rows[0]));
});

// GET /api/files/:id — stream the file (inline, for preview)
router.get("/files/:id", async (req, res) => {
  const file = await queryOne<{ name: string; mimeType: string; storageKey: string }>(
    `SELECT "name","mimeType","storageKey" FROM files WHERE "id"=$1`,
    [req.params.id]
  );
  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  const path = resolveFile(file.storageKey);
  if (!fs.existsSync(path)) {
    res.status(410).json({ error: "File bytes missing from storage" });
    return;
  }
  res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(file.name)}"`
  );
  fs.createReadStream(path).pipe(res);
});

// DELETE /api/files/:id
router.delete("/files/:id", async (req, res) => {
  const file = await queryOne<{ id: string; name: string; nodeId: string; storageKey: string }>(
    `SELECT "id","name","nodeId","storageKey" FROM files WHERE "id"=$1`,
    [req.params.id]
  );
  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  deleteFile(file.storageKey);
  await query(`DELETE FROM files WHERE "id"=$1`, [file.id]);
  await logAction(`Removed document "${file.name}"`, { nodeId: file.nodeId });
  res.json({ ok: true });
});

export default router;
