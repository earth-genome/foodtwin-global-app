"use client";

import useSWR from "swr";
import { useEffect, useState } from "react";
import { DeckProps } from "@deck.gl/core";
import turfLength from "@turf/length";
import turfAlong from "@turf/along";
import { TripsLayer } from "@deck.gl/geo-layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { Layer, Source, useControl } from "react-map-gl";
import { AreaFlowsResponse } from "@/app/api/areas/[id]/flows/route";

const SPEED_FACTOR = 1;
const DISTANCE_BETWEEN_PARTICLES_IN_KM = 10;
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

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then(({ flows }) => {
      const exampleFlow = flows[0];

      const multiLinestring = exampleFlow.geojson.coordinates;

      const baseTrips = [];
      let maxLineStringLength = 0;
      for (const lineString of multiLinestring) {
        const lineStringLength = turfLength(
          {
            type: "Feature",
            geometry: { type: "LineString", coordinates: lineString },
            properties: {},
          },
          {
            units: "kilometers",
          }
        );

        console.log("lineStringLength", lineStringLength);

        if (lineStringLength > maxLineStringLength) {
          maxLineStringLength = lineStringLength;
        }

        const numberOfParticles = Math.ceil(
          lineStringLength / DISTANCE_BETWEEN_PARTICLES_IN_KM
        );

        console.log("numberOfParticles", numberOfParticles);

        const waypoints = [];
        for (let i = 0; i < numberOfParticles; i++) {
          const particleInitialPosition = turfAlong(
            {
              type: "Feature",
              geometry: { type: "LineString", coordinates: lineString },
              properties: {},
            },
            i * DISTANCE_BETWEEN_PARTICLES_IN_KM,
            { units: "kilometers" }
          );
          waypoints.push({
            coordinates: particleInitialPosition.geometry.coordinates,
            timestamp: i * DISTANCE_BETWEEN_PARTICLES_IN_KM,
          });
        }

        console.log("waypoints", waypoints);

        baseTrips.push({
          fromAreaId: exampleFlow.fromAreaId,
          toAreaId: exampleFlow.toAreaId,
          length: lineStringLength,
          numberOfParticles,
          waypoints,
        });
      }

      console.log("maxLineStringLength", maxLineStringLength);

      const offsetTrips = [];
      for (const baseTrip of baseTrips) {
        const distanceFactor = maxLineStringLength / baseTrip.length;
        const offsetTripCount = Math.ceil(
          baseTrip.numberOfParticles * distanceFactor
        );
        for (let i = 1; i <= offsetTripCount; i++) {
          offsetTrips.push({
            ...baseTrip,
            waypoints: baseTrip.waypoints.map((waypoint) => ({
              ...waypoint,
              timestamp:
                waypoint.timestamp + i * DISTANCE_BETWEEN_PARTICLES_IN_KM,
            })),
          });
        }
      }

      return {
        exampleFlow,
        trips: baseTrips.concat(offsetTrips),
      };
    });

const AreaFlowsLayer = ({ areaId }: { areaId: string }) => {
  const [currentTime, setCurrentTime] = useState(0);

  const { data, error, isLoading } = useSWR<AreaFlowsResponse>(
    `/api/areas/${areaId}/flows`,
    fetcher
  );

  // Basic animation loop
  useEffect(() => {
    if (!data?.trips) return;

    const interval = setInterval(() => {
      setCurrentTime((prevTime) => {
        const nextTime = prevTime + SPEED_FACTOR;
        if (nextTime > data.maxLineStringLength) {
          return 0;
        }
        return nextTime;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [data?.trips]);

  if (!data?.trips) {
    return null;
  }

  if (isLoading || error) {
    return null;
  }

  const tripsLayer = new TripsLayer<DataType>({
    id: `trips`,
    data: data.trips,
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
      <Source id="source_id" type="geojson" data={data.exampleFlow.geojson}>
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
