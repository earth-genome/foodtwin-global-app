import { ProductionArea } from "@/types/data";
import { Feature, Geometry } from "geojson";

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
