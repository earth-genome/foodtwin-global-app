import { Coordinate } from "./config";

/**
 * Ensures coordinates are in 2D format by taking only the first two elements
 * @param coords Array of numbers representing coordinates (can be 2D or 3D)
 * @returns A 2D coordinate tuple
 */
export const ensure2DCoordinates = (coords: number[]): Coordinate => [
  coords[0],
  coords[1],
];
