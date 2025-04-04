import { FillLayerSpecification, LineLayerSpecification } from "mapbox-gl";
import { Layer } from "react-map-gl";
import { AREA_SOURCE_ID, AREA_SOURCE_LAYER_ID } from "../constants";

// Colors
const AREA_HIGHLIGHT_OUTLINE_COLOR = "rgba(28, 25, 23, 0.6)";
const AREA_DEFAULT_OUTLINE_COLOR = "rgba(28, 25, 23, 0.02)";
const AREA_POPULATION_COLOR = "#C60E08";
const AREA_OVERLAY_COLOR = "rgba(255,255,255,0.6)";
const AREA_DESTINATION_OUTLINE_COLOR = "rgba(171, 165, 160, 1)";
const AREA_ORIGIN_FILL_COLOR = "rgba(193, 237, 150, 0.3)";
const AREA_DESTINATION_FILL_COLOR = "rgba(199, 187, 168, 0.5)";

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

function AreaLayers() {
  return (
    <>
      <Layer
        id="area-population-fill"
        type="fill"
        source={AREA_SOURCE_ID}
        source-layer={AREA_SOURCE_LAYER_ID}
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
        id="destination-areas-fill"
        type="fill"
        source={AREA_SOURCE_ID}
        source-layer={AREA_SOURCE_LAYER_ID}
        paint={{
          "fill-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            AREA_ORIGIN_FILL_COLOR,
            ["boolean", ["feature-state", "destination"], false],
            AREA_DESTINATION_FILL_COLOR,
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
        source={AREA_SOURCE_ID}
        source-layer={AREA_SOURCE_LAYER_ID}
        paint={{
          "line-opacity": 1,
          "line-color": [
            "case",
            ["boolean", ["feature-state", "destination"], false],
            AREA_DESTINATION_OUTLINE_COLOR,
            ["boolean", ["feature-state", "selected"], false],
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
        source={AREA_SOURCE_ID}
        source-layer={AREA_SOURCE_LAYER_ID}
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
        source={AREA_SOURCE_ID}
        source-layer={AREA_SOURCE_LAYER_ID}
        paint={{ "fill-color": "transparent" }}
      />
      <Layer
        id="area-outline"
        type="line"
        source={AREA_SOURCE_ID}
        source-layer={AREA_SOURCE_LAYER_ID}
        paint={lineStyle}
      />
    </>
  );
}

export default AreaLayers;
