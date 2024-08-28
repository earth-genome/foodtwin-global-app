-- CreateIndex
CREATE INDEX "geom_idx" ON "Edge" USING GIST ("geom");

-- CreateIndex
CREATE INDEX "Edge_fromNodeId_idx" ON "Edge"("fromNodeId");

-- CreateIndex
CREATE INDEX "Edge_toNodeId_idx" ON "Edge"("toNodeId");
