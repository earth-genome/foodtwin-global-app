import { Color } from "@deck.gl/core";

export type Coordinate = [number, number];

export interface ParticleData {
  path: Coordinate[];
  color: Color;
}

export interface ParticleDataWithTimestamps extends ParticleData {
  timestamps: number[];
}

export interface TripPoint {
  coordinates: Coordinate;
  timestamp: number;
}

export interface TripPath {
  path: Coordinate[];
  timestamps: number[];
}
