"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import { Color, DeckProps } from "@deck.gl/core";
import { TripsLayer } from "@deck.gl/geo-layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { useControl } from "react-map-gl";
import { distance, point } from "@turf/turf";
import { Flow, FlowGeometry, Path, Trip, Waypoint } from "@/types/data";
import { hexToRgb } from "@/utils/general";
import useAnimationFrame from "@/hooks/useAnimationFrame";
import { FoodGroupColors } from "../../../../../tailwind.config";
import { Position } from "geojson";

const TRAIL_LENGTH = 0.15;
const WIDTH_MIN_PIXELS = 2.5;

interface DataType {
  fromAreaId: string;
  toAreaId: string;
  waypoints: Waypoint[];
  color: Color;
}

function DeckGLOverlay(props: DeckProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

const getDistances = (coordinates: Position[]) => {
  const distances = [];
  for (
    let waypointIndex = 1;
    waypointIndex < coordinates.length;
    waypointIndex++
  ) {
    const waypoint = coordinates[waypointIndex];
    const prevWaypoint = coordinates[waypointIndex - 1];
    const dist = distance(point(prevWaypoint), point(waypoint));
    distances.push(dist);
  }

  const totalDistance = distances.reduce((a, b) => a + b, 0);
  return {
    distances,
    totalDistance,
  };
};

const numParticlesMultiplicator = 0.000001;
const fromTimestamp = 0;
const toTimeStamp = 100;
const intervalHumanize = 0.5; // Randomize particle start time (0: emitted at regular intervals; 1: emitted at "fully" random intervals)
const speedKps = 100; // Speed in km per second
const speedKpsHumanize = 0.5; // Randomize particles trajectory speed (0: stable duration; 1: can be 0 or 2x the speed)
const maxParticles = 500;

const getPathTrips = (
  path: Path,
  flow: Flow,
  zoomMultiplier: number
): Trip[] => {
  const numParticles = Math.min(
    flow.value * numParticlesMultiplicator,
    maxParticles
  );

  const speedZoomMultiplier = (3 - zoomMultiplier + 2) / 3;
  const baseSpeedKps = speedKps * speedZoomMultiplier;

  const d = toTimeStamp - fromTimestamp;
  // const numParticles = (path.totalDistance / 1000) * numParticlesPer1000K;
  const interval = d / numParticles;

  const trips = [];

  for (let i = 0; i < numParticles; i++) {
    const humanizeSpeedKps =
      (Math.random() - 0.5) * 2 * baseSpeedKps * speedKpsHumanize;
    const humanizedSpeedKps = baseSpeedKps + humanizeSpeedKps;

    const baseDuration = path.totalDistance / humanizedSpeedKps;

    const humanizeInterval =
      (Math.random() - 0.5) * 2 * interval * intervalHumanize;

    const timestampStart = fromTimestamp + i * interval + humanizeInterval;

    const timestampEnd = timestampStart + baseDuration;

    const timestampDelta = timestampEnd - timestampStart;
    const waypointsAccumulator = path.coordinates.reduce(
      (accumulator, currentCoords, currentIndex) => {
        const accDistance = accumulator.accDistance;
        const accDistanceRatio = accDistance / path.totalDistance;
        const timestamp = timestampStart + accDistanceRatio * timestampDelta;
        return {
          accDistance: accDistance + path.distances[currentIndex],
          waypoints: [
            ...accumulator.waypoints,
            { coordinates: currentCoords, timestamp: timestamp },
          ],
        };
      },
      { waypoints: [] as Waypoint[], accDistance: 0 }
    );

    const colorHex =
      FoodGroupColors[flow.foodGroupSlug as keyof typeof FoodGroupColors];
    const color = hexToRgb(colorHex.slice(1));
    trips.push({
      waypoints: waypointsAccumulator.waypoints,
      color: [...color, 255] as Color,
      foodGroup: "Grain",
    });
  }
  return trips;
};

interface FlowResponse {
  flows: Flow[];
  flowGeometries: FlowGeometry[];
}

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then(({ flows, flowGeometries }: FlowResponse) => {
      const trips = flows.flatMap((flow) => {
        const flowGeometry = flowGeometries.find(({ fromAreaId, toAreaId }) => {
          return fromAreaId === flow.fromAreaId && toAreaId === flow.toAreaId;
        });

        if (!flowGeometry) {
          return [];
        }

        const multiLinestring = flowGeometry.geojson.coordinates;
        const flowPaths: Path[] = multiLinestring.map((lineString) => ({
          coordinates: lineString,
          ...getDistances(lineString),
        }));
        return flowPaths.map((flowPath) => {
          return getPathTrips(
            flowPath,
            {
              ...flow,
              valuesRatiosByFoodGroup: [0.2, 0.2, 0.2, 0.2, 0.2],
              routeGeometry: flowGeometry.geojson,
            },
            1
          );
        });
      });

      return trips.flat();
    })
    .catch((error) => {
      console.error("Error fetching area flows", error);
      throw error;
    });

const AreaFlowsLayer = ({ areaId }: { areaId: string }) => {
  const { data, error, isLoading } = useSWR<Trip[]>(
    `/api/areas/${areaId}/flows`,
    fetcher,
    {
      keepPreviousData: true,
    }
  );
  const [currentTime, setCurrentTime] = useState(0);
  useAnimationFrame((e) => setCurrentTime(e.time));

  const loopLength = 100;
  const currentFrame = useMemo(() => {
    const animationSpeed = 1;
    const animationSpeedZoom = 1;
    const speed = animationSpeed * animationSpeedZoom;
    return (currentTime * speed) % loopLength;
  }, [currentTime]);

  if (!data) {
    return null;
  }

  if (isLoading || error) {
    return null;
  }

  const tripsLayer = new TripsLayer<DataType>({
    id: `trips`,
    data,
    getPath: (d: DataType) =>
      d.waypoints.map((p) => p.coordinates as [number, number]),
    getTimestamps: (d: DataType) => d.waypoints.map((p) => p.timestamp),
    getColor: (d: DataType) => d.color,
    currentTime: currentFrame,
    trailLength: TRAIL_LENGTH,
    capRounded: true,
    jointRounded: true,
    fadeTrail: true,
    widthMinPixels: WIDTH_MIN_PIXELS,
  });

  return <DeckGLOverlay layers={[tripsLayer]} />;
};

export default AreaFlowsLayer;
