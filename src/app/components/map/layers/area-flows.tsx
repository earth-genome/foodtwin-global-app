"use client";

import useSWR from "swr";
import { useEffect, useState } from "react";
import { DeckProps } from "@deck.gl/core";
import turfLength from "@turf/length";
import { TripsLayer } from "@deck.gl/geo-layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { Layer, Source, useControl } from "react-map-gl";
import { AreaFlowsResponse } from "@/app/api/areas/[id]/flows/route";

const SPEED_FACTOR = 1;
const TRAIL_LENGTH = 3;
const WIDTH_MIN_PIXELS = 8;

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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const AreaFlowsLayer = ({ areaId }: { areaId: string }) => {
  const [currentTime, setCurrentTime] = useState(0);

  const {
    data: trips,
    error,
    isLoading,
  } = useSWR<AreaFlowsResponse>(`/api/areas/${areaId}/flows`, fetcher);

  // Basic animation loop
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

  if (isLoading || error) {
    return null;
  }

  const exampleFlow = trips.flows[0];

  const multiLinestring = exampleFlow.geojson.coordinates;

  const baseTrips = [];
  let maxLength = 0;
  for (const lineString of multiLinestring) {
    const length = turfLength({
      type: "Feature",
      geometry: { type: "LineString", coordinates: lineString },
      properties: {},
    });

    if (length > maxLength) {
      maxLength = length;
    }
    const waypoints = lineString.map((coordinates, i) => ({
      coordinates: coordinates as [number, number],
      timestamp: i * (length / lineString.length) * SPEED_FACTOR,
    }));

    baseTrips.push({
      fromAreaId: exampleFlow.fromAreaId,
      toAreaId: exampleFlow.toAreaId,
      length,
      waypoints,
    });
  }

  const tripsLayer = new TripsLayer<DataType>({
    id: `trips`,
    data: baseTrips,
    getPath: (d: DataType) => d.waypoints.map((p) => p.coordinates),
    getTimestamps: (d: DataType) => d.waypoints.map((p) => p.timestamp),
    getColor: [0, 0, 0],
    currentTime: currentTime,
    trailLength: TRAIL_LENGTH,
    capRounded: true,
    jointRounded: true,
    widthMinPixels: WIDTH_MIN_PIXELS,
  });

  return (
    <>
      <Source id="source_id" type="geojson" data={exampleFlow.geojson}>
        <Layer
          id="layer_id"
          type="line"
          source="source_id"
          paint={{
            "line-color": "red",
          }}
        />
      </Source>
      <DeckGLOverlay layers={[tripsLayer]} />
    </>
  );
};

export default AreaFlowsLayer;
