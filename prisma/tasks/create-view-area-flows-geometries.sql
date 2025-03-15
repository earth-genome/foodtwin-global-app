SET
  max_parallel_workers_per_gather = 8;

DROP MATERIALIZED VIEW IF EXISTS "AreaFlowGeometries";

CREATE MATERIALIZED VIEW "AreaFlowGeometries" AS
SELECT
  "Flow".id as "flowId",
  "Flow"."fromAreaId",
  "Flow"."toAreaId",
  ST_SimplifyPreserveTopology (ST_LineMerge (ST_Union (("Edge"."geom"))), 1000) as "geom"
FROM
  "Flow"
  JOIN "FlowSegment" ON "Flow"."id" = "FlowSegment"."flowId"
  JOIN "FlowSegmentEdges" ON "FlowSegment"."id" = "FlowSegmentEdges"."flowSegmentId"
  JOIN "Edge" ON "FlowSegmentEdges"."edgeId" = "Edge"."id"
WHERE
  "Flow"."id" in (
    SELECT
      ANY_VALUE ("id") as "id"
    FROM
      "Flow"
    GROUP BY
      "fromAreaId",
      "toAreaId"
  )
GROUP BY
  "Flow".id,
  "Flow"."fromAreaId",
  "Flow"."toAreaId"
ORDER BY
  "Flow".id ASC,
  "Flow"."fromAreaId",
  "Flow"."toAreaId";

DROP MATERIALIZED VIEW IF EXISTS "AreaFlowsPerFoodGroup";

CREATE MATERIALIZED VIEW "AreaFlowsPerFoodGroup" AS
SELECT
  "Flow"."fromAreaId",
  "Flow"."toAreaId",
  "Flow"."foodGroupId",
  SUM("Flow"."value") as "value"
FROM
  "Flow"
GROUP BY
  "Flow"."fromAreaId",
  "Flow"."toAreaId",
  "Flow"."foodGroupId"
ORDER BY
  "Flow"."fromAreaId",
  "Flow"."toAreaId";