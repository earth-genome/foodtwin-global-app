import { MapRef } from "react-map-gl";
import { GeoJSONFeature } from "mapbox-gl";
import { IMapPopup } from "@/app/components/map-popup";
import { EViewType } from "../machine";
import { Legend } from "../../legend";

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

interface ActionApplyDestinationAreaIdsToMap {
  type: "action:applyDestinationAreaIdsToMap";
}

interface ActionEnterProductionAreaView {
  type: "action:enterProductionAreaView";
}
interface ActionExitProductionAreaView {
  type: "action:exitProductionAreaView";
}

interface ActionEnterTransportationAreaView {
  type: "action:enterTransportationAreaView";
}
interface ActionExitTransportationAreaView {
  type: "action:exitTransportationAreaView";
}

interface ActionEnterImpactAreaView {
  type: "action:enterImpactAreaView";
  legend: Legend;
}

interface ActionExitImpactAreaView {
  type: "action:exitImpactAreaView";
  legend: Legend;
}

interface ActionEnterWorldMapView {
  type: "action:enterWorldMapView";
}

interface ActionResetAreaViewMap {
  type: "action:resetAreaViewMap";
}

export type StateActions =
  | ActionParseUrl
  | ActionParseAreaSection
  | ActionSetMapRef
  | ActionSetHighlightedArea
  | ActionApplyDestinationAreaIdsToMap
  | ActionClearHighlightedArea
  | ActionSetCurrentAreaId
  | ActionSetCurrentArea
  | ActionEnterProductionAreaView
  | ActionExitProductionAreaView
  | ActionEnterTransportationAreaView
  | ActionExitTransportationAreaView
  | ActionEnterImpactAreaView
  | ActionExitImpactAreaView
  | ActionSetAreaMapView
  | ActionEnterWorldMapView
  | ActionResetAreaViewMap;
