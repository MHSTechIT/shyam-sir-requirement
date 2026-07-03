-- MHS Org Chart — schema (plain SQL, applied idempotently on startup).
-- Mirrors the tables the app expects. Safe to run repeatedly.

CREATE TABLE IF NOT EXISTS nodes (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "badge"     TEXT NOT NULL DEFAULT 'ROLE',
  "title"     TEXT NOT NULL DEFAULT 'New Position',
  "sub"       TEXT NOT NULL DEFAULT '',
  "color"     TEXT NOT NULL DEFAULT '#6c63ff',
  "project"   TEXT NOT NULL DEFAULT 'shared',
  "status"    TEXT NOT NULL DEFAULT 'active',
  "x"         DOUBLE PRECISION NOT NULL DEFAULT 100,
  "y"         DOUBLE PRECISION NOT NULL DEFAULT 100,
  "view"      TEXT NOT NULL DEFAULT 'master',
  "collapsed" BOOLEAN NOT NULL DEFAULT false,
  "hc"        JSONB,
  "size"      JSONB,
  "clarity"   JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS connections (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "fromNode"  TEXT NOT NULL,
  "toNode"    TEXT NOT NULL,
  "view"      TEXT NOT NULL DEFAULT 'master',
  "lineStyle" TEXT
);

CREATE TABLE IF NOT EXISTS files (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "nodeId"     TEXT NOT NULL,
  "name"       TEXT NOT NULL,
  "mimeType"   TEXT NOT NULL,
  "size"       INTEGER NOT NULL,
  "storageKey" TEXT NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS history (
  "id"      SERIAL PRIMARY KEY,
  "ts"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "action"  TEXT NOT NULL,
  "details" JSONB
);

CREATE TABLE IF NOT EXISTS groups (
  "id"    TEXT NOT NULL PRIMARY KEY,
  "name"  TEXT NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#6c63ff',
  "order" INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "connections_fromNode_idx" ON connections ("fromNode");
CREATE INDEX IF NOT EXISTS "connections_toNode_idx"   ON connections ("toNode");
CREATE UNIQUE INDEX IF NOT EXISTS "files_nodeId_key"  ON files ("nodeId");
CREATE INDEX IF NOT EXISTS "history_ts_idx"           ON history ("ts");

-- Foreign keys (added only if missing, with cascade delete).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'connections_fromNode_fkey') THEN
    ALTER TABLE connections ADD CONSTRAINT "connections_fromNode_fkey"
      FOREIGN KEY ("fromNode") REFERENCES nodes ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'connections_toNode_fkey') THEN
    ALTER TABLE connections ADD CONSTRAINT "connections_toNode_fkey"
      FOREIGN KEY ("toNode") REFERENCES nodes ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'files_nodeId_fkey') THEN
    ALTER TABLE files ADD CONSTRAINT "files_nodeId_fkey"
      FOREIGN KEY ("nodeId") REFERENCES nodes ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
