import { MapRef } from "react-map-gl";
import { GeoJSONFeature } from "mapbox-gl";
import { IMapPopup } from "@/app/components/map-popup";
import { EViewType } from "../machine";

interface ActionParseUrl {
  type: "action:parseUrl";
  viewType: EViewType | null;
  currentAreaId?: string | null;
  currentArea?: GeoJSON.Feature | null;
}

interface ActionParseAreaSection {
  type: "action:parseAreaSection";
}

interface ResetAreaHighlight {
  type: "action:resetAreaHighlight";
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
interface ActionEnterProductionAreaView {
  type: "action:setProductionAreaView";
}

interface ActionSetTransportationAreaView {
  type: "action:setTransportationAreaView";
}

interface ActionSetImpactAreaView {
  type: "action:setImpactAreaView";
}

interface ActionEnterWorldMapView {
  type: "action:enterWorldMapView";
}
interface ActionAreaClear {
  type: "action:area:clear";
}

export type StateActions =
  | ActionParseUrl
  | ActionParseAreaSection
  | ResetAreaHighlight
  | ActionSetMapRef
  | ActionSetHighlightedArea
  | ActionClearHighlightedArea
  | ActionSetCurrentAreaId
  | ActionSetCurrentArea
  | ActionEnterProductionAreaView
  | ActionSetTransportationAreaView
  | ActionSetImpactAreaView
  | ActionSetAreaMapView
  | ActionEnterWorldMapView
  | ActionAreaClear;
