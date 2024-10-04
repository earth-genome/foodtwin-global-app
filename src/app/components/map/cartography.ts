import {
  CircleLayerSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
} from "mapbox-gl";

// Colors
const AREA_HIGHLIGHT_OUTLINE_COLOR = "rgba(28, 25, 23, 0.6)";
const AREA_DEFAULT_OUTLINE_COLOR = "rgba(28, 25, 23, 0.02)";

export const areaStyle: FillLayerSpecification["paint"] = {
  "fill-color": "transparent",
};

export const lineStyle: LineLayerSpecification["paint"] = {
  "line-color": [
    "case",
    ["boolean", ["feature-state", "hover"], false],
    AREA_HIGHLIGHT_OUTLINE_COLOR,
    AREA_DEFAULT_OUTLINE_COLOR,
  ],
  "line-width": ["interpolate", ["exponential", 1.99], ["zoom"], 3, 1, 7, 3],
};

export const areaMaskStyle: FillLayerSpecification["paint"] = {
  "fill-color": "rgba(255,255,255,0.6)",
};

export const areaMaskOutlineStyle: LineLayerSpecification["paint"] = {
  "line-color": AREA_HIGHLIGHT_OUTLINE_COLOR,
  "line-width": ["interpolate", ["exponential", 1.99], ["zoom"], 3, 1, 7, 3],
};

export const foodgroupsStyle: CircleLayerSpecification["paint"] = {
  "circle-emissive-strength": 1,
  "circle-color": [
    "match",
    ["get", "max_food_group"],
    "cereals-excluding-beer",
    "#F28E2B",
    "aquatic-products-other",
    "#E15759",
    "treenuts",
    "#9C755F",
    "spices",
    "#BAB0AC",
    "starchy-roots",
    "#4E79A7",
    "stimulants",
    "#BAB0AC",
    "milk-excluding-butter",
    "#BAB0AC",
    "animal-fats",
    "#EDC948",
    "meat",
    "#E15759",
    "fruits-excluding-wine",
    "#FF9DA7",
    "sugar-crops",
    "#BAB0AC",
    "vegetable-oils",
    "#EDC948",
    "eggs",
    "#BAB0AC",
    "alcoholic-beverages",
    "#BAB0AC",
    "oilcrops",
    "#EDC948",
    "vegetables",
    "#59A14F",
    "fish-seafood",
    "#E15759",
    "offals",
    "#E15759",
    "pulses",
    "#B07AA1",
    "#000000",
  ],
  "circle-radius": [
    "interpolate",
    ["exponential", 1.99],
    ["zoom"],
    3,
    [
      "interpolate",
      ["linear"],
      ["get", "max_food_group_value"],
      -2963,
      0.1,
      53567,
      1,
    ],
    12,
    [
      "interpolate",
      ["linear"],
      ["get", "max_food_group_value"],
      -2963,
      1,
      53567,
      200,
    ],
  ],
};
