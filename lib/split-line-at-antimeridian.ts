import { LineString, MultiLineString } from "geojson";

export function splitLineAtAntimeridian(line: LineString): MultiLineString {
  if (
    line.type !== "LineString" ||
    !line.coordinates ||
    line.coordinates.length < 2
  ) {
    throw new Error("Invalid LineString");
  }

  const coordinates = line.coordinates;
  const segments: number[][][] = [];
  let currentSegment: number[][] = [coordinates[0]];

  for (let i = 0; i < coordinates.length - 1; i++) {
    const coord1 = coordinates[i];
    const coord2 = coordinates[i + 1];

    const lonDiff = coord2[0] - coord1[0];

    if (Math.abs(lonDiff) > 180) {
      // Crossing detected
      const crossingLon = lonDiff > 0 ? 180 : -180;

      // Calculate approximate latitude at crossing
      const latAtCrossing =
        coord1[1] +
        ((coord2[1] - coord1[1]) * (crossingLon - coord1[0])) / lonDiff;

      // Add point at the antimeridian to the current segment
      currentSegment.push([crossingLon, latAtCrossing]);
      segments.push(currentSegment);

      // Start a new segment on the other side, starting from the crossing point
      currentSegment = [
        [crossingLon + Math.sign(lonDiff) * -360, latAtCrossing],
      ];
    } else {
      currentSegment.push(coord2);
    }
  }

  if (currentSegment.length > 1) {
    segments.push(currentSegment);
  }

  return {
    type: "MultiLineString",
    coordinates: segments,
  };
}
