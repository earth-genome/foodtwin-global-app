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
