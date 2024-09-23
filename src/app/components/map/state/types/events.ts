import { ProductionArea } from "@/types/data";
import { Feature, Geometry } from "geojson";
import { MapRef } from "react-map-gl/maplibre";
import { MapLayerMouseEvent } from "react-map-gl/dist/esm/exports-maplibre";

interface EventPageMount {
  type: "event:page:mount";
  context: {
    areaId: string | null;
  };
}

interface EventMapMount {
  type: "event:map:mount";
  mapRef: MapRef;
}

interface EventMapMouseMove {
  type: "event:map:mousemove";
  mapEvent: MapLayerMouseEvent;
}

interface EventAreaSelect {
  type: "event:area:select";
  area: Feature<Geometry, ProductionArea>;
}

interface EventAreaClear {
  type: "event:area:clear";
}

export type StateEvents =
  | EventPageMount
  | EventMapMount
  | EventMapMouseMove
  | EventAreaSelect
  | EventAreaClear;
