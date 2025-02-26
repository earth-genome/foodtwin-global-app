import React from "react";
import { Source, Layer } from "react-map-gl";
import { MachineContext } from "../state";

const VECTOR_TILES_URL = process.env.NEXT_PUBLIC_VECTOR_TILES_URL;

// This is a toggle to disable without removing the layer
// We should review the logic of the ports layer to reinstate it
const IS_VISIBLE = false;

const PortsLayer = () => {
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
          visibility: IS_VISIBLE ? "visible" : "none",
        }}
      />
      <Layer
        id="destination-ports"
        type="symbol"
        source-layer="default"
        layout={{
          "icon-image": "port-icon",
          "icon-size": 0.4,
          visibility: IS_VISIBLE ? "visible" : "none",
        }}
        filter={["in", "$id", ...destinationPortsIds]}
      />
    </Source>
  );
};

export default PortsLayer;
