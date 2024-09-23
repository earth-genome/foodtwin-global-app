import { BBox } from "geojson";

interface ActionInitContext {
  type: "action:initializeContext";
  context: {
    areaId: string | null;
  };
}
interface ActionAreaSelect {
  type: "action:area:select";
  areaId: string;
  mapBounds: BBox | null;
}
interface ActionAreaClear {
  type: "action:area:clear";
}

export type StateActions =
  | ActionInitContext
  | ActionAreaSelect
  | ActionAreaClear;
