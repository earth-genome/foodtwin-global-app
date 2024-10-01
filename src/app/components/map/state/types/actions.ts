import { MapRef } from "react-map-gl";
import { GeoJSONFeature } from "mapbox-gl";
import { IMapPopup } from "@/app/components/map-popup";
import { EViewType } from "../machine";

interface ActionParseUrl {
  type: "action:parseUrl";
  params: {
    pathname: string;
  };
  viewType: EViewType | null;
  currentAreaId?: string | null;
  currentArea?: GeoJSON.Feature | null;
}

interface ActionSetMapRef {
  type: "action:setMapRef";
  mapRef: MapRef;
}

interface ActionSetHighlightedArea {
  type: "action:setHighlightedArea";
  highlightedArea: GeoJSONFeature | null;
  MapPopup: IMapPopup | null;
}

interface ActionClearHighlightedArea {
  type: "action:clearHighlightedArea";
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

interface ActionSetWorldMapView {
  type: "action:setWorldMapView";
}
interface ActionAreaClear {
  type: "action:area:clear";
}

export type StateActions =
  | ActionParseUrl
  | ActionSetMapRef
  | ActionSetHighlightedArea
  | ActionClearHighlightedArea
  | ActionSetCurrentAreaId
  | ActionSetCurrentArea
  | ActionSetAreaMapView
  | ActionSetWorldMapView
  | ActionAreaClear;
