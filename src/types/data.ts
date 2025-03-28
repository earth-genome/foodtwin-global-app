import { MultiLineString, Position } from "geojson";
import { EItemType } from "./components";
import { Color } from "@deck.gl/core";

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
  coordinates: Position[];
  distances: number[];
  totalDistance: number;
}
export interface Trip {
  waypoints: Waypoint[];
  color: Color;
  sourceId?: string;
  targetId?: string;
}

export interface Flow {
  foodGroupId: number;
  foodGroupSlug: string;
  fromAreaId: string;
  level2FoodGroupId: number;
  level2FoodGroupSlug: string;
  level3FoodGroupId: number;
  level3FoodGroupSlug: string;
  toAreaId: string;
  value: number;
  valuesRatiosByFoodGroup: number[];
  routeGeometry?: MultiLineString;
}

export interface FlowGeometry {
  fromAreaId: string;
  toAreaId: string;
  geojson: MultiLineString;
}
