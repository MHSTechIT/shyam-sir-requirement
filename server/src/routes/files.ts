import { Router } from "express";
import multer from "multer";
import fs from "fs";
import { prisma } from "../db";
import { logAction } from "../history";
import { serializeFile } from "../serialize";
import { saveFile, resolveFile, deleteFile } from "../storage";

const router = Router();

// 4 MB cap — matches the old client limit.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
});

// POST /api/nodes/:id/file — upload (replaces any existing doc for the node)
router.post("/nodes/:id/file", upload.single("file"), async (req, res) => {
  const { id } = req.params;
  const node = await prisma.node.findUnique({ where: { id } });
  if (!node) {
    res.status(404).json({ error: "Node not found" });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  // Remove previous file (one doc per node).
  const prev = await prisma.file.findUnique({ where: { nodeId: id } });
  if (prev) {
    deleteFile(prev.storageKey);
    await prisma.file.delete({ where: { id: prev.id } });
  }

  const storageKey = saveFile(req.file.originalname, req.file.buffer);
  const file = await prisma.file.create({
    data: {
      nodeId: id,
      name: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storageKey,
    },
  });
  await logAction(`Attached document "${file.name}" to "${node.title}"`, {
    nodeId: id,
  });
  res.status(201).json(serializeFile(file));
});

// GET /api/files/:id — stream the file (inline, for preview)
router.get("/files/:id", async (req, res) => {
  const file = await prisma.file.findUnique({ where: { id: req.params.id } });
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
  const file = await prisma.file.findUnique({ where: { id: req.params.id } });
  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  deleteFile(file.storageKey);
  await prisma.file.delete({ where: { id: file.id } });
  await logAction(`Removed document "${file.name}"`, { nodeId: file.nodeId });
  res.json({ ok: true });
});

export default router;
