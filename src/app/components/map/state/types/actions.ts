import { MapGeoJSONFeature, MapRef } from "react-map-gl/maplibre";
import { IMapPopup } from "@/app/components/map-popup";

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

interface ActionSetHighlightedArea {
  type: "action:setHighlightedArea";
  highlightedArea: MapGeoJSONFeature | null;
  MapPopup: IMapPopup | null;
}

interface ActionSetCurrentAreaId {
  type: "action:setCurrentAreaId";
  currentAreaId: string;
}
interface ActionSetCurrentArea {
  type: "action:setCurrentArea";
  area: GeoJSON.Feature;
}

interface ActionSetAreaMapView {
  type: "action:setAreaMapView";
}
interface ActionAreaClear {
  type: "action:area:clear";
}

export type StateActions =
  | ActionInitContext
  | ActionSetMapRef
  | ActionSetHighlightedArea
  | ActionSetCurrentAreaId
  | ActionSetCurrentArea
  | ActionSetAreaMapView
  | ActionAreaClear;
