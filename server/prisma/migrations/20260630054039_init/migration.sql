-- CreateTable
CREATE TABLE "nodes" (
    "id" TEXT NOT NULL,
    "badge" TEXT NOT NULL DEFAULT 'ROLE',
    "title" TEXT NOT NULL DEFAULT 'New Position',
    "sub" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT '#6c63ff',
    "project" TEXT NOT NULL DEFAULT 'shared',
    "status" TEXT NOT NULL DEFAULT 'active',
    "x" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "y" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "view" TEXT NOT NULL DEFAULT 'master',
    "collapsed" BOOLEAN NOT NULL DEFAULT false,
    "hc" JSONB,
    "size" JSONB,
    "clarity" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connections" (
    "id" TEXT NOT NULL,
    "fromNode" TEXT NOT NULL,
    "toNode" TEXT NOT NULL,
    "view" TEXT NOT NULL DEFAULT 'master',
    "lineStyle" TEXT,

    CONSTRAINT "connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "history" (
    "id" SERIAL NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "details" JSONB,

    CONSTRAINT "history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "connections_fromNode_idx" ON "connections"("fromNode");

-- CreateIndex
CREATE INDEX "connections_toNode_idx" ON "connections"("toNode");

-- CreateIndex
CREATE UNIQUE INDEX "files_nodeId_key" ON "files"("nodeId");

-- CreateIndex
CREATE INDEX "history_ts_idx" ON "history"("ts");

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_fromNode_fkey" FOREIGN KEY ("fromNode") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_toNode_fkey" FOREIGN KEY ("toNode") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
