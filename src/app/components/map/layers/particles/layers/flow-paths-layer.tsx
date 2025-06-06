"use client";

import { Layer, Source } from "react-map-gl";
import { FeatureCollection, LineString } from "geojson";

interface FlowPathsLayerProps {
  pathsData: FeatureCollection<LineString> | undefined;
}

export function FlowPathsLayer({ pathsData }: FlowPathsLayerProps) {
  if (!pathsData) return null;

  return (
    <Source id="flow-paths" type="geojson" data={pathsData}>
      <Layer
        id="flow-paths-lines"
        type="line"
        paint={{
          "line-color": "rgb(255, 255, 255)",
          "line-width": 2.5,
          "line-opacity": 0.5,
        }}
        layout={{
          "line-join": "round",
          "line-cap": "round",
        }}
      />
    </Source>
  );
}
