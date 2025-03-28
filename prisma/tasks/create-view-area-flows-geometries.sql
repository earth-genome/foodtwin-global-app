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

-- Create index to match FlowSegmentEdges
CREATE INDEX "FlowPairs_id" ON "FlowPairs" ("id");

DROP TABLE IF EXISTS "FlowPairsGeometries" CASCADE;

CREATE TABLE
  "FlowPairsGeometries" AS
SELECT
  "FlowPairs".id as id,
  "FlowPairs"."fromAreaId" as "fromAreaId",
  "FlowPairs"."toAreaId" as "toAreaId",
  ST_SimplifyPreserveTopology (ST_Transform (ST_Union ("Edge".geom), 4326), 1000) AS geom
FROM
  "FlowPairs"
  JOIN "FlowSegment" ON "FlowSegment"."flowId" = "FlowPairs"."id"
  JOIN "FlowSegmentEdges" ON "FlowSegmentEdges"."flowSegmentId" = "FlowSegment"."id"
  JOIN "Edge" ON "FlowSegmentEdges"."edgeId" = "Edge"."id"
GROUP BY
  "FlowPairs".id,
  "FlowPairs"."fromAreaId",
  "FlowPairs"."toAreaId";

CREATE INDEX "FlowPairsGeometries_id" ON "FlowPairsGeometries" (id);

CREATE INDEX "FlowPairsGeometries_geom" ON "FlowPairsGeometries" USING GIST (geom);