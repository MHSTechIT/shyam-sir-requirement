import express from "express";
import "express-async-errors"; // route handlers that throw reach the error handler
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import path from "path";
import fs from "fs";

import { query, ensureSchema } from "./db";
import stateRouter from "./routes/state";
import nodesRouter from "./routes/nodes";
import connectionsRouter from "./routes/connections";
import filesRouter from "./routes/files";
import historyRouter from "./routes/history";
import groupsRouter from "./routes/groups";

// Keep the server alive through transient failures (e.g. a brief network blip
// to the remote PostgreSQL). Without these, an async DB error in a route
// surfaces as an unhandled rejection and Node would terminate the process.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection (server kept alive):", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception (server kept alive):", err);
});

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);
const SHARED_PASSWORD = process.env.SHARED_PASSWORD || "";

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
    credentials: true,
  })
);
app.use(express.json({ limit: "8mb" }));
app.use(cookieParser());

// ── Optional shared-password gate ────────────────────────────────────────────
// Off by default (SHARED_PASSWORD unset) → fully open chart.
const AUTH_COOKIE = "mhs_auth";
const authToken = SHARED_PASSWORD
  ? crypto.createHash("sha256").update(SHARED_PASSWORD).digest("hex")
  : "";

app.get("/api/auth/status", (req, res) => {
  res.json({
    required: Boolean(SHARED_PASSWORD),
    authed: !SHARED_PASSWORD || req.cookies[AUTH_COOKIE] === authToken,
  });
});

app.post("/api/auth/login", (req, res) => {
  if (!SHARED_PASSWORD) {
    res.json({ ok: true });
    return;
  }
  const { password } = req.body as { password?: string };
  if (password === SHARED_PASSWORD) {
    res.cookie(AUTH_COOKIE, authToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: "Incorrect password" });
  }
});

// Gate all other /api routes when a password is configured.
app.use("/api", (req, res, next) => {
  if (!SHARED_PASSWORD) return next();
  if (req.path.startsWith("/auth")) return next();
  if (req.cookies[AUTH_COOKIE] === authToken) return next();
  res.status(401).json({ error: "Authentication required" });
});

// ── API routes ───────────────────────────────────────────────────────────────
app.get("/api/health", async (_req, res) => {
  try {
    await query(`SELECT 1`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.use("/api/state", stateRouter);
app.use("/api/nodes", nodesRouter);
app.use("/api/connections", connectionsRouter);
app.use("/api", filesRouter); // /api/nodes/:id/file and /api/files/:id
app.use("/api/history", historyRouter);
app.use("/api/groups", groupsRouter);

// ── Serve the built React client in production ───────────────────────────────
const clientDist = path.resolve(__dirname, "../../frontend/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// ── Error handler (incl. multer file-size errors) ────────────────────────────
app.use(
  (
    err: Error & { code?: string },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "File too large (max 4 MB)" });
      return;
    }
    console.error(err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
);

// Ensure tables exist (idempotent), then start.
ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`MHS Org Chart API listening on http://localhost:${PORT}`);
      if (SHARED_PASSWORD) console.log("Shared-password gate is ENABLED.");
    });
  })
  .catch((e) => {
    console.error("Failed to ensure DB schema:", e);
    process.exit(1);
  });
