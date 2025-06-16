-- CreateIndex
CREATE INDEX "flow_from_area_idx" ON "Flow" ("fromAreaId");

-- CreateIndex
CREATE INDEX "flow_to_area_idx" ON "Flow" ("toAreaId");

-- CreateIndex
CREATE INDEX "flow_food_group_idx" ON "Flow" ("foodGroupId");

-- CreateIndex
CREATE INDEX "flow_from_area_food_group_idx" ON "Flow" ("fromAreaId", "foodGroupId");

-- CreateIndex
CREATE INDEX "flow_from_to_area_idx" ON "Flow" ("fromAreaId", "toAreaId");