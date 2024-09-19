import { ProductionArea } from "@/types/data";
import { BBox, Feature, Geometry } from "geojson";

interface EventPageMount {
  type: "event:page:mounted";
  context: {
    areaId: string | null;
  };
}

interface EventAreaSelect {
  type: "event:area:select";
  area: Feature<Geometry, ProductionArea>;
}

interface EventAreaClear {
  type: "event:area:clear";
}

export type StateEvents = EventPageMount | EventAreaSelect | EventAreaClear;

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

export interface StateContext {
  areaId: string | null;
  mapBounds: BBox | null;
}
