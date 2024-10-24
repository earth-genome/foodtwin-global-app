import React, { useEffect } from "react";
import { Source, Layer, useMap } from "react-map-gl";
import { MachineContext } from "../state";

const PortsLayer = () => {
  const map = useMap();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

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
      tiles={[`${appUrl}/api/tiles/ports/{z}/{x}/{y}`]}
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
          "icon-size": 0.5,
        }}
        filter={["in", "$id", ...destinationPortsIds]}
      />
    </Source>
  );
};

export default PortsLayer;
