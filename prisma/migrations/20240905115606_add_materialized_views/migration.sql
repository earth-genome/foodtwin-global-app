-- DropTable
DROP MATERIALIZED VIEW IF EXISTS "EdgeFlowAggregation";

-- CreateMaterializedView
CREATE MATERIALIZED VIEW "EdgeFlowAggregation" AS
SELECT
  e.id AS "edgeId",
  f."foodGroupId",
  COUNT(DISTINCT fs.id) AS "flowCount",
  SUM(f.value) AS "flowSum"
FROM
  "Edge" e
  INNER JOIN "FlowSegmentEdges" fse ON e.id = fse."edgeId"
  INNER JOIN "FlowSegment" fs ON fse."flowSegmentId" = fs.id
  INNER JOIN "Flow" f ON fs."flowId" = f.id
GROUP BY
  e.id, f."foodGroupId"
HAVING
  COUNT(DISTINCT fs.id) > 0;

-- CreateIndex
CREATE INDEX "EdgeFlowAggregation_edgeId_foodGroupId_idx" ON "EdgeFlowAggregation"("edgeId", "foodGroupId");

-- CreateFunction
CREATE OR REPLACE FUNCTION refresh_edge_flow_aggregation()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW "EdgeFlowAggregation";
END;
$$ LANGUAGE plpgsql;