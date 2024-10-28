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
  type: "action:fitMapToCurrentAreaBounds";
}
interface ActionEnterProductionAreaView {
  type: "action:setProductionAreaView";
}

interface ActionEnterTransportationAreaView {
  type: "action:enterTransportationAreaView";
}
interface ActionExitTransportationAreaView {
  type: "action:exitTransportationAreaView";
}

interface ActionSetImpactAreaView {
  type: "action:setImpactAreaView";
}

interface ActionEnterWorldMapView {
  type: "action:enterWorldMapView";
}

interface ActionEnterAreaView {
  type: "action:enterAreaView";
}

export type StateActions =
  | ActionParseUrl
  | ActionParseAreaSection
  | ActionSetMapRef
  | ActionSetHighlightedArea
  | ActionClearHighlightedArea
  | ActionSetCurrentAreaId
  | ActionSetCurrentArea
  | ActionEnterProductionAreaView
  | ActionEnterTransportationAreaView
  | ActionExitTransportationAreaView
  | ActionSetImpactAreaView
  | ActionSetAreaMapView
  | ActionEnterWorldMapView
  | ActionEnterAreaView;
