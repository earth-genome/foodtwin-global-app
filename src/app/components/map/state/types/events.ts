import { MapMouseEvent, MapRef } from "react-map-gl";
import { FetchAreaResponse } from "@/app/api/areas/[id]/route";

interface EventPageMount {
  type: "event:page:mount";
  pathname: string;
}

interface EventUrlEnter {
  type: "event:url:enter";
  pathname: string;
}

interface EventMapMount {
  type: "event:map:mount";
  mapRef: MapRef;
}

interface EventMapMouseMove {
  type: "event:map:mousemove";
  mapEvent: MapMouseEvent;
}

interface EventMapMouseOut {
  type: "event:map:mouseout";
}

interface EventAreaSelect {
  type: "event:area:select";
  areaId: string;
}

interface EventFetchAreaDone {
  type: "xstate.done.actor.0.globeView.area:fetching";
  input: {
    areaId: string;
  };
  output: FetchAreaResponse;
}

interface EventAreaClear {
  type: "event:area:clear";
}

export type StateEvents =
  | EventPageMount
  | EventUrlEnter
  | EventMapMount
  | EventMapMouseMove
  | EventAreaSelect
  | EventFetchAreaDone
  | EventAreaClear
  | EventMapMouseOut;
