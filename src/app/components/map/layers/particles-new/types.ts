import { Color } from "@deck.gl/core";
import { Coordinate } from "./config";

export interface ParticleData {
  path: Coordinate[];
  color: Color;
}
