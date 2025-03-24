import { Geometry, LineString, Position } from "geojson";
import { EItemType } from "./components";

export interface ProductionArea {
  id: string;
  name: string;
}

export interface IResult {
  id: string;
  name: string;
  type: EItemType;
}

export interface Waypoint {
  coordinates: Position;
  timestamp: number;
}

export interface Path {
  coordinates: number[][];
  distances: number[];
  totalDistance: number;
}
export interface Trip {
  waypoints: Waypoint[];
  color: number[];
  sourceId?: string;
  targetId?: string;
}

export interface Flow {
  // source: Position;
  // target: Position;
  // sourceId: string;
  // targetId: string;
  value: number;
  valuesRatiosByFoodGroup: number[];
  routeGeometry?: LineString;
}
