import React, { useEffect } from "react";
import { Source, Layer, useMap } from "react-map-gl";
import { MachineContext } from "../state";

const VECTOR_TILES_URL = process.env.NEXT_PUBLIC_VECTOR_TILES_URL;

const PortsLayer = () => {
  const map = useMap();

  const destinationPortsIds = MachineContext.useSelector(
    (s) => s.context.destinationPortsIds
  );

  useEffect(() => {
    if (!map.current) return;

    map.current.loadImage("/icons/port.png", (error, image) => {
      if (error) throw error;
      if (map.current && image) {
        map.current.addImage("port-icon", image);
      }
    });
  }, [map]);

  return (
    <Source
      id="ports-tiles"
      type="vector"
      tiles={[`${VECTOR_TILES_URL}/ports/{z}/{x}/{y}.pbf`]}
    >
      <Layer
        id="top-ports"
        type="symbol"
        source-layer="default"
        layout={{
          "icon-image": "port-icon",
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
