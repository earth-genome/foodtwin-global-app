import { FillLayerSpecification, LineLayerSpecification } from "mapbox-gl";
import { Layer, Source } from "react-map-gl";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

// Colors
const AREA_HIGHLIGHT_OUTLINE_COLOR = "rgba(28, 25, 23, 0.6)";
const AREA_DEFAULT_OUTLINE_COLOR = "rgba(28, 25, 23, 0.02)";

export const areaDefaultStyle: FillLayerSpecification["paint"] = {
  "fill-color": "transparent",
};

export const areaStyle: FillLayerSpecification["paint"] = {
  "fill-color": [
    "case",
    ["boolean", ["feature-state", "selected"], false],
    "transparent",
    "rgba(255,255,255,0.6)",
  ],
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

interface IAreaLayer {
  areaSelected?: boolean;
}

function AreaLayer({ areaSelected }: IAreaLayer) {
  return (
    <Source
      id="area-tiles"
      type="vector"
      tiles={[`${appUrl}/api/tiles/areas/{z}/{x}/{y}`]}
    >
      <Layer
        id="area-clickable-polygon"
        type="fill"
        source-layer="default"
        paint={areaSelected ? areaStyle : areaDefaultStyle}
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
