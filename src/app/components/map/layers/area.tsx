import { FillLayerSpecification, LineLayerSpecification } from "mapbox-gl";
import { Layer, Source } from "react-map-gl";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

// Colors
const AREA_HIGHLIGHT_OUTLINE_COLOR = "rgba(28, 25, 23, 0.6)";
const AREA_DEFAULT_OUTLINE_COLOR = "rgba(28, 25, 23, 0.02)";
const AREA_POPULATION_COLOR = "#C60E08";
const AREA_OVERLAY_COLOR = "rgba(255,255,255,0.6)";

export const areaDefaultStyle: FillLayerSpecification["paint"] = {
  "fill-color": "transparent",
};

export const lineStyle: LineLayerSpecification["paint"] = {
  "line-color": [
    "case",
    ["boolean", ["feature-state", "hover"], false],
    AREA_HIGHLIGHT_OUTLINE_COLOR,
    ["boolean", ["feature-state", "selected"], false],
    AREA_HIGHLIGHT_OUTLINE_COLOR,
    AREA_DEFAULT_OUTLINE_COLOR,
  ],
  "line-width": ["interpolate", ["exponential", 1.99], ["zoom"], 3, 1, 7, 3],
};

function AreaLayer() {
  return (
    <Source
      id="area-tiles"
      type="vector"
      tiles={[`${appUrl}/api/tiles/areas/{z}/{x}/{y}`]}
    >
      <Layer
        id="area-population-fill"
        type="fill"
        source-layer="default"
        paint={{
          "fill-color": [
            "case",
            [
              "any",
              ["boolean", ["feature-state", "destination"], false],
              ["boolean", ["feature-state", "selected"], false],
            ],
            AREA_POPULATION_COLOR,
            "transparent",
          ],
        }}
        layout={{
          visibility: "none",
        }}
      />

      <Layer
        id="destination-areas-outline"
        type="line"
        source-layer="default"
        paint={{
          "line-opacity": 1,
          "line-color": [
            "case",
            ["boolean", ["feature-state", "destination"], false],
            AREA_HIGHLIGHT_OUTLINE_COLOR,
            "transparent",
          ],
        }}
        layout={{
          visibility: "none",
        }}
      />

      <Layer
        id="selected-area-overlay"
        type="fill"
        source-layer="default"
        paint={{
          "fill-opacity": 1,
          "fill-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "transparent",
            AREA_OVERLAY_COLOR,
          ],
        }}
        layout={{
          visibility: "none",
        }}
      />

      <Layer
        id="area-clickable-polygon"
        type="fill"
        source-layer="default"
        paint={{ "fill-color": "transparent" }}
      />
      <Layer
        id="area-outline"
        type="line"
        source-layer="default"
        paint={lineStyle}
      />
    </Source>
  );
}

export default AreaLayer;
