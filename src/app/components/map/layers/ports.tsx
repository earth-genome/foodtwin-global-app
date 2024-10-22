import React, { useEffect } from "react";
import { Source, Layer, useMap } from "react-map-gl";

const PortsLayer = () => {
  const map = useMap();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

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
        id="ports-point"
        type="symbol"
        source-layer="default"
        layout={{
          "icon-image": "port-icon",
          "icon-size": 0.3,
        }}
      />
    </Source>
  );
};

export default PortsLayer;
