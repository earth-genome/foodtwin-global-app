import { FillLayerSpecification } from "mapbox-gl";
import { Layer, Source } from "react-map-gl";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

// Colors
const AREA_HIGHLIGHT_COLOR = "rgba(250, 250, 249, 0.7)";
const AREA_DEFAULT_COLOR = "rgba(250, 250, 249, 0.3)";
const AREA_HIGHLIGHT_OUTLINE_COLOR = "rgba(0, 0, 0, 1)";
const AREA_DEFAULT_OUTLINE_COLOR = "rgba(0, 0, 0, 0.3)";

export const areaStyle = {
  "fill-color": [
    "case",
    ["boolean", ["feature-state", "hover"], false],
    AREA_HIGHLIGHT_COLOR,
    AREA_DEFAULT_COLOR,
  ],
  "fill-outline-color": [
    "case",
    ["boolean", ["feature-state", "hover"], false],
    AREA_HIGHLIGHT_OUTLINE_COLOR,
    AREA_DEFAULT_OUTLINE_COLOR,
  ],
};

function AreaLayer() {
  return (
    <Source
      id="area-tiles"
      type="vector"
      tiles={[`${appUrl}/api/tiles/areas/{z}/{x}/{y}`]}
    >
      <Layer
        id="area-outline"
        type="line"
        source-layer="default"
        paint={{ "line-color": "#000", "line-width": 0.2 }}
      />
      <Layer
        id="area-clickable-polygon"
        type="fill"
        source-layer="default"
        paint={areaStyle as FillLayerSpecification["paint"]}
      />
    </Source>
  );
}

export default AreaLayer;
