SET
  max_parallel_workers_per_gather = 8;

-- Create a view with one flow per area pair
DROP MATERIALIZED VIEW IF EXISTS "FlowPairs" CASCADE;

CREATE MATERIALIZED VIEW "FlowPairs" AS
SELECT
  ANY_VALUE ("id") as "id",
  "fromAreaId",
  "toAreaId"
FROM
  "Flow"
WHERE
  "fromAreaId" LIKE 'ESP%'
GROUP BY
  "fromAreaId",
  "toAreaId";

DROP MATERIALIZED VIEW IF EXISTS "FlowPairsSegments" CASCADE;

CREATE MATERIALIZED VIEW "FlowPairsSegments" AS
SELECT
  "FlowPairs".id as "flowId",
  "FlowSegment".id as "flowSegmentId",
  "FlowSegment"."order" as "order"
FROM
  "FlowPairs"
  JOIN "Flow" ON "Flow"."fromAreaId" = "FlowPairs"."fromAreaId"
  AND "Flow"."toAreaId" = "FlowPairs"."toAreaId"
  JOIN "FlowSegment" ON "FlowSegment"."flowId" = "Flow"."id";

CREATE MATERIALIZED VIEW "FlowPairsSegmentsGeometries" AS
WITH
  ordered_edges AS (
    SELECT
      "FlowSegment".id AS segment_id,
      "Edge".geom
    FROM
      "FlowSegment"
      JOIN "FlowSegmentEdges" ON "FlowSegmentEdges"."flowSegmentId" = "FlowSegment"."id"
      JOIN "Edge" ON "FlowSegmentEdges"."edgeId" = "Edge"."id"
    WHERE
      "FlowSegment".id IN (
        SELECT
          "flowSegmentId"
        FROM
          "FlowPairsSegments"
      )
    ORDER BY
      "FlowSegment".id,
      "FlowSegment"."order",
      "FlowSegmentEdges"."order"
  ),
  merged_per_segment AS (
    SELECT
      segment_id,
      ST_LineMerge (ST_Collect (geom)) AS merged_line
    FROM
      ordered_edges
    GROUP BY
      segment_id
  )
SELECT
  "FlowPairsSegments"."flowId",
  "FlowPairsSegments"."flowSegmentId",
  merged_line
FROM
  "FlowPairsSegments"
  JOIN merged_per_segment ON "FlowPairsSegments"."flowSegmentId" = merged_per_segment.segment_id;