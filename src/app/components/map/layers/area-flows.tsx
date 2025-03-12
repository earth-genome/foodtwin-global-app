import { useState, useEffect } from "react";
import { DeckProps } from "@deck.gl/core";
import { TripsLayer } from "@deck.gl/geo-layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { useControl } from "react-map-gl";
import { MachineContext } from "../state";
import { GeoJSONFeature } from "mapbox-gl";

const SPEED_FACTOR = 10;

interface Waypoint {
  coordinates: [number, number]; // [longitude, latitude]
  timestamp: number;
}

interface DataType {
  waypoints: Waypoint[];
}

function DeckGLOverlay(props: DeckProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

const AreaFlowsLayer = () => {
  const [currentTime, setCurrentTime] = useState(0);

  // Selector to extract and transform the flow data
  const waypoints = MachineContext.useSelector((s) => {
    const oneFlow: GeoJSONFeature | undefined = s.context.currentAreaFlows?.[0];
    if (!oneFlow) return null;

    return oneFlow.geojson.coordinates
      .flat()
      .reverse()
      .map((coords, i) => ({
        coordinates: coords,
        timestamp: i,
      }));
  });

  useEffect(() => {
    if (!waypoints) return;

    const interval = setInterval(() => {
      setCurrentTime((prevTime) => prevTime + SPEED_FACTOR);
    }, 50);

    return () => clearInterval(interval);
  }, [waypoints]);

  if (!waypoints) {
    return null;
  }

  const tripsData: DataType[] = [{ waypoints }];

  const layers = [
    new TripsLayer<DataType>({
      id: "TripsLayer",
      data: tripsData,

      getPath: (d: DataType) => d.waypoints.map((p) => p.coordinates),
      getTimestamps: (d: DataType) => d.waypoints.map((p) => p.timestamp),
      getColor: [0, 0, 0],
      currentTime,
      trailLength: 600,
      capRounded: true,
      jointRounded: true,
      widthMinPixels: 8,
    }),
  ];

  return <DeckGLOverlay layers={layers} />;
};

export default AreaFlowsLayer;
