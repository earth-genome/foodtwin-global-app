import React from "react";
import { Source, Layer } from "react-map-gl";

const VECTOR_TILES_URL = process.env.NEXT_PUBLIC_VECTOR_TILES_URL;

const EdgeLayer = () => {
  return (
    <Source
      id="edges-tiles"
      type="vector"
      tiles={[`${VECTOR_TILES_URL}/edges/{z}/{x}/{y}.pbf`]}
    >
      <Layer
        id="edge-line"
        type="line"
        source-layer="default"
        paint={{
          "line-color": "#ffffff",
          "line-width": 1,
          "line-opacity": [
            "interpolate",
            ["linear"],
            ["get", "flowCount"],
            0,
            0.1,
            1000,
            0.3,
            10000,
            0.6,
            100000,
            1,
          ],
        }}
        filter={["!=", ["get", "flowCount"], 0]}
      />
    </Source>
  );
};

export default EdgeLayer;
