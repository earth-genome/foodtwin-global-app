import { MapMouseEvent, MapRef } from "react-map-gl";
import { FetchAreaResponse } from "@/app/api/areas/[id]/route";

interface EventPageMount {
  type: "event:page:mount";
}

interface EventUrlEnter {
  type: "event:url:enter";
  pathname: string | undefined;
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

interface EventMapZoomEnd {
  type: "event:map:zoomend";
}

interface EventFetchAreaDone {
  type: "xstate.done.actor.0.globeView.area:fetching";
  input: {
    areaId: string;
  };
  output: FetchAreaResponse;
}

interface EventAreaSelectFoodTransportation {
  type: "event:area:selectFoodTransportation";
}

interface EventAreaSelectImpact {
  type: "event:area:selectImpact";
}

interface EventAreaSelectFoodProduced {
  type: "event:area:selectFoodProduced";
}

export type StateEvents =
  | EventPageMount
  | EventUrlEnter
  | EventMapMount
  | EventMapMouseMove
  | EventFetchAreaDone
  | EventMapMouseOut
  | EventMapZoomEnd
  | EventAreaSelectFoodTransportation
  | EventAreaSelectImpact
  | EventAreaSelectFoodProduced;
