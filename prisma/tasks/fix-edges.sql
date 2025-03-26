UPDATE "Edge" AS e
SET
    geom = ST_Reverse (e.geom) -- Reverse the original geometry if needed
FROM
    "Node" AS from_n,
    "Node" AS to_n
WHERE
    e."fromNodeId" = from_n.id
    AND e."toNodeId" = to_n.id
    AND
    -- Apply checks only to valid, non-empty, single-component MultiLineStrings
    e.geom IS NOT NULL
    AND ST_GeometryType (e.geom) = 'ST_MultiLineString'
    AND ST_NumGeometries (e.geom) = 1
    AND ST_IsValid (e.geom) = true
    AND NOT ST_IsEmpty (e.geom)
    AND
    -- *** Use ST_GeometryN before ST_StartPoint/ST_EndPoint in the condition ***
    -- Condition for reversal: StartPoint(extracted line) is near toNode AND EndPoint(extracted line) is near fromNode
    ST_DWithin (
        ST_StartPoint (ST_GeometryN (e.geom, 1)),
        to_n.geom,
        0.01
    )
    AND -- Adjust tolerance if needed
    ST_DWithin (
        ST_EndPoint (ST_GeometryN (e.geom, 1)),
        from_n.geom,
        0.01
    )
    AND -- Adjust tolerance if needed
    -- Optional safety check (also using ST_GeometryN)
    NOT (
        ST_DWithin (
            ST_StartPoint (ST_GeometryN (e.geom, 1)),
            from_n.geom,
            0.01
        )
        AND ST_DWithin (
            ST_EndPoint (ST_GeometryN (e.geom, 1)),
            to_n.geom,
            0.01
        )
    );

UPDATE "Edge"
SET
    geom = ST_GeometryN (geom, 1) -- Extract the first (and only) LineString component
WHERE
    ST_GeometryType (geom) = 'ST_MultiLineString' -- Only target MultiLineStrings
    AND ST_NumGeometries (geom) = 1 -- Only those with exactly one component line
    AND ST_IsValid (geom) = true;

-- Only target valid ones