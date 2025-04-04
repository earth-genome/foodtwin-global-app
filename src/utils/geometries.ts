import { BBox } from "geojson";

export function combineBboxes(bboxes: BBox[]): BBox {
  let minLeft = 180;
  let minBottom = 90;
  let maxRight = -180;
  let maxTop = -90;

  bboxes.forEach(([left, bottom, right, top]) => {
    if (left < minLeft) minLeft = left;
    if (bottom < minBottom) minBottom = bottom;
    if (right > maxRight) maxRight = right;
    if (top > maxTop) maxTop = top;
  });

  return [minLeft, minBottom, maxRight, maxTop];
}
