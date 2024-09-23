import { BBox } from "geojson";
import { MapRef } from "react-map-gl";

interface ActionInitContext {
  type: "action:initializeContext";
  context: {
    areaId: string | null;
  };
}

interface ActionSetMapRef {
  type: "action:setMapRef";
  mapRef: MapRef;
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
  | ActionSetMapRef
  | ActionAreaSelect
  | ActionAreaClear;
