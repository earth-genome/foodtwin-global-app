import { Color } from "@deck.gl/core";
import { Coordinate } from "./config";

export interface ParticleData {
  path: Coordinate[];
  color: Color;
}

export interface ParticlePath {
  from: Coordinate;
  to: Coordinate;
  color: Color;
}
