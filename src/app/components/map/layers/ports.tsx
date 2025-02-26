import React from "react";
import { Source, Layer, useMap } from "react-map-gl";
import { MachineContext } from "../state";

const VECTOR_TILES_URL = process.env.NEXT_PUBLIC_VECTOR_TILES_URL;

const PortsLayer = () => {
  const map = useMap();

  const destinationPortsIds = MachineContext.useSelector(
    (s) => s.context.destinationPortsIds
  );

  return (
    <Source
      id="ports-tiles"
      type="vector"
      tiles={[`${VECTOR_TILES_URL}/nodes/{z}/{x}/{y}.pbf`]}
    >
      <Layer
        id="top-ports"
        type="symbol"
        source-layer="default"
        layout={{
          "icon-image": [
            "match",
            ["get", "type"],
            "ADMIN",
            "producing_area-icon",
            "PORT",
            "port-icon",
            "INLAND_PORT",
            "port-icon",
            "MARITIME",
            "port-icon",
            "RAIL_STATION",
            "shipping_container-icon",
            "",
          ],

          "icon-size": 0.3,
        }}
      />
      <Layer
        id="destination-ports"
        type="symbol"
        source-layer="default"
        layout={{
          "icon-image": "port-icon",
          "icon-size": 0.4,
        }}
        filter={["in", "$id", ...destinationPortsIds]}
      />
    </Source>
  );
};

export default PortsLayer;
