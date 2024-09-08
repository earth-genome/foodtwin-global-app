import React from "react";
import { Source, Layer } from "react-map-gl/maplibre";

const EdgeLayer = () => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return (
    <Source
      id="edges-tiles"
      type="vector"
      tiles={[`${appUrl}/api/tiles/edges/{z}/{x}/{y}`]}
    >
      <Layer
        id="edge-line"
        type="line"
        source-layer="default"
        paint={{
          "line-color": [
            "interpolate",
            ["linear"],
            ["get", "flowCount"],
            0,
            "#ffffcc",
            1000,
            "#fed976",
            10000,
            "#fd8d3c",
            100000,
            "#e31a1c",
          ],
          "line-width": [
            "interpolate",
            ["linear"],
            ["get", "flowCount"],
            0,
            1,
            1000,
            2,
            10000,
            4,
            100000,
            8,
          ],
          "line-opacity": 0.8,
        }}
      />
    </Source>
  );
};

export default EdgeLayer;
