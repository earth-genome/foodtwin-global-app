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

interface ActionSetProductionAreaView {
  type: "action:setProductionAreaView";
}

interface ActionClearProductionAreaView {
  type: "action:clearProductionAreaView";
}

interface ActionSetTransportationAreaView {
  type: "action:setTransportationAreaView";
}

interface ActionClearTransportationAreaView {
  type: "action:clearTransportationAreaView";
}

interface ActionSetImpactAreaView {
  type: "action:setImpactAreaView";
}

interface ActionSetWorldMapView {
  type: "action:setWorldMapView";
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
  | ActionSetProductionAreaView
  | ActionClearProductionAreaView
  | ActionSetTransportationAreaView
  | ActionClearTransportationAreaView
  | ActionSetImpactAreaView
  | ActionSetWorldMapView
  | ActionAreaClear;
