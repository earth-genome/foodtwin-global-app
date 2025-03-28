import { CircleLayerSpecification } from "mapbox-gl";
import { Layer, Source } from "react-map-gl";

const foodgroupsStyle = {
  "circle-color": [
    "match",
    ["get", "max_food_group"],
    "grains",
    "#F28E2B",
    "treenuts",
    "#9C755F",
    ["starchy_roots"],
    "#4E79A7",
    "other",
    "#BAB0AC",
    "fruits",
    "#FF9DA7",
    "oils_and_oilseed",
    "#EDC948",
    "dairy_and_eggs",
    "#76B7B2",
    "vegetables",
    "#59A14F",
    "meat_and_fish",
    "#E15759",
    "pulses",
    "#B07AA1",
    "#000000",
  ],
  "circle-radius": [
    "interpolate",
    ["exponential", 1.99],
    ["zoom"],
    1,
    [
      "interpolate",
      ["linear"],
      ["get", "max_food_group_value"],
      -2572,
      0.04,
      53567,
      0.4,
    ],
    3,
    [
      "interpolate",
      ["linear"],
      ["get", "max_food_group_value"],
      -2572,
      0.09,
      53567,
      0.9,
    ],
    12,
    [
      "interpolate",
      ["linear"],
      ["get", "max_food_group_value"],
      -2572,
      1,
      53567,
      200,
    ],
  ],
};

function FoodGroupsLayer() {
  return (
    <Source
      id="foodgroups-source"
      type="vector"
      url="mapbox://plotline.cndbsry2"
    >
      <Layer
        id="foodgroups-layer"
        type="circle"
        source-layer="prod_overview"
        paint={foodgroupsStyle as CircleLayerSpecification["paint"]}
      />
    </Source>
  );
}

export default FoodGroupsLayer;
