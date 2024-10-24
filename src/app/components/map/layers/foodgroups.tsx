import { CircleLayerSpecification } from "mapbox-gl";
import { Layer, Source } from "react-map-gl";

const foodgroupsStyle = {
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

function FoodGroupsLayer() {
  return (
    <Source
      id="foodgroups-source"
      type="vector"
      url="mapbox://devseed.dlel0qkq"
    >
      <Layer
        id="foodgroups-layer"
        type="circle"
        source-layer="foodgroup2max"
        paint={foodgroupsStyle as CircleLayerSpecification["paint"]}
      />
    </Source>
  );
}

export default FoodGroupsLayer;
