import { useState, useEffect } from "react";
import { DeckProps } from "@deck.gl/core";
import { TripsLayer } from "@deck.gl/geo-layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { useControl } from "react-map-gl";
import { MachineContext } from "../state";

const SPEED_FACTOR = 10;

interface Waypoint {
  coordinates: [number, number]; // [longitude, latitude]
  timestamp: number;
}

interface DataType {
  fromAreaId: string;
  toAreaId: string;
  waypoints: Waypoint[];
}

function DeckGLOverlay(props: DeckProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

const AreaFlowsLayer = () => {
  const [currentTime, setCurrentTime] = useState(0);

  const trips = MachineContext.useSelector((s) => {
    const { currentAreaFlows } = s.context;
    if (!currentAreaFlows) return null;

    return currentAreaFlows.map(({ fromAreaId, toAreaId, geojson }) => ({
      fromAreaId,
      toAreaId,
      waypoints: geojson.coordinates.flat().map((coords, i) => ({
        coordinates: coords,
        timestamp: i,
      })),
    }));
  });

  useEffect(() => {
    if (!trips) return;

    const interval = setInterval(() => {
      setCurrentTime((prevTime) => prevTime + SPEED_FACTOR);
    }, 500);

    return () => clearInterval(interval);
  }, [trips]);

  if (!trips) {
    return null;
  }

  const tripsLayer = new TripsLayer<DataType>({
    id: `trips`,
    data: trips,
    getPath: (d: DataType) => d.waypoints.map((p) => p.coordinates),
    getTimestamps: (d: DataType) => d.waypoints.map((p) => p.timestamp),
    getColor: [0, 0, 0],
    currentTime,
    trailLength: 6,
    capRounded: true,
    jointRounded: true,
    widthMinPixels: 8,
  });

  return <DeckGLOverlay layers={[tripsLayer]} />;
};

export default AreaFlowsLayer;
