DROP MATERIALIZED VIEW IF EXISTS "AreaFlowsGeometries";

CREATE MATERIALIZED VIEW "AreaFlowsGeometries" AS
WITH
  "aggregatedFlows" AS (
    SELECT
      MIN("id") as "id",
      COUNT("id") as "count",
      "foodGroupId",
      "fromAreaId",
      "toAreaId",
      "type",
      SUM("value") as "sumValue"
    FROM
      "Flow"
    WHERE
      "Flow"."fromAreaId" = 'ESP.8_1'
    GROUP BY
      "foodGroupId",
      "fromAreaId",
      "toAreaId",
      "type"
  ),
  "orderedEdges" AS (
    SELECT
      "Flow".id as "flowId",
      "FlowSegment"."order" as "flowSegmentOrder",
      "FlowSegmentEdges"."order" as "flowSegmentEdgeOrder",
      "Edge"."geom" AS "geom"
    FROM
      "Flow"
      JOIN "FlowSegment" ON "Flow"."id" = "FlowSegment"."flowId"
      JOIN "FlowSegmentEdges" ON "FlowSegment"."id" = "FlowSegmentEdges"."flowSegmentId"
      JOIN "Edge" ON "FlowSegmentEdges"."edgeId" = "Edge"."id"
    WHERE
      "Flow"."id" IN (
        SELECT
          "aggregatedFlows"."id"
        FROM
          "aggregatedFlows"
      )
    GROUP BY
      "Flow".id,
      "Edge"."geom",
      "FlowSegment"."order",
      "FlowSegmentEdges"."order"
    ORDER BY
      "Flow".id ASC,
      "FlowSegment"."order" ASC,
      "FlowSegmentEdges"."order" ASC
  )
SELECT
  "aggregatedFlows"."id" AS "flowId",
  "aggregatedFlows"."foodGroupId",
  "aggregatedFlows"."fromAreaId",
  "aggregatedFlows"."toAreaId",
  "aggregatedFlows"."type",
  "aggregatedFlows"."sumValue",
  "aggregatedFlows"."count",
  ST_LineMerge (ST_Union ("orderedEdges"."geom")) AS "multiLineStringGeom"
FROM
  "orderedEdges"
  JOIN "aggregatedFlows" ON "orderedEdges"."flowId" = "aggregatedFlows"."id"
GROUP BY
  "aggregatedFlows"."id",
  "aggregatedFlows"."foodGroupId",
  "aggregatedFlows"."fromAreaId",
  "aggregatedFlows"."toAreaId",
  "aggregatedFlows"."type",
  "aggregatedFlows"."sumValue",
  "aggregatedFlows"."count";