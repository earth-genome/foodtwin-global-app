import React from "react";
import { Source, Layer, useMap } from "react-map-gl";
import { MachineContext } from "../state";

const DestinationAreasLayer = () => {
  const map = useMap();

  const destinationAreasGeoJSON = MachineContext.useSelector((s) => ({
    type: "FeatureCollection",
    features: s.context.destinationAreas.map((area) => ({
      type: "Feature",
      properties: {
        id: area.id,
        name: area.name,
      },
      geometry: area.centroid,
    })),
  }));

  const isVisible = MachineContext.useSelector(
    (s) =>
      s.matches("area:view:transportation") || s.matches("area:view:impact")
  );

  return (
    <>
      <Source
        id="destination-areas-centroids"
        type="geojson"
        data={destinationAreasGeoJSON}
      />
      <Layer
        id="destination-areas"
        type="symbol"
        source="destination-areas-centroids"
        layout={{
          "icon-image": "producing_area-icon",
          "icon-size": 0.2,
          "icon-allow-overlap": true,
          visibility: isVisible ? "visible" : "none",
        }}
      />
    </>
  );
};

export default DestinationAreasLayer;
